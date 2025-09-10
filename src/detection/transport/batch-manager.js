/**
 * Batch Manager
 * Extracted from rpc-connection-pool.js for standalone use
 * Provides request batching to reduce RPC calls by aggregating multiple requests
 */

import { EventEmitter } from 'events';

export class BatchManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration with environment variable support
    this.batchWindow = config.batchWindow || 
                       parseInt(process.env.BATCH_WINDOW_MS) || 
                       parseInt(process.env.RPC_BATCH_WINDOW_MS) || 
                       50; // ms to wait for more requests
    
    this.maxBatchSize = config.maxBatchSize || 
                        parseInt(process.env.BATCH_MAX_SIZE) || 
                        parseInt(process.env.RPC_BATCH_MAX_SIZE) || 
                        100;
    
    this.enableBatching = config.enableBatching !== false &&
                          process.env.BATCHING_ENABLED !== 'false' &&
                          process.env.RPC_BATCHING_ENABLED !== 'false';
    
    // Batch method mappings - customize per protocol/API
    this.batchMethods = config.batchMethods || {
      'getAccountInfo': 'getMultipleAccounts',
      'getBalance': 'getMultipleAccounts',
      'getProgramAccounts': null, // Cannot batch efficiently
      'getTokenSupply': null, // Individual calls only
      'getSlot': null, // Individual calls only
      'getSignatureStatuses': 'getSignatureStatuses', // Already accepts array
      'getMultipleAccounts': 'getMultipleAccounts' // Already batched
    }
;
    
    // Custom batch methods can be added
    if (config.customBatchMethods) {
      Object.assign(this.batchMethods, config.customBatchMethods);
    }
    
    // Pending batches storage
    this.pendingBatches = new Map(); // batchKey -> batch object
    
    // Statistics
    this.stats = {
      batchesSent: 0,
      requestsBatched: 0,
      individualRequests: 0,
      batchSavings: 0,
      totalRequests: 0,
      avgBatchFormationTime: 0,
      maxBatchSize: 0,
      minBatchSize: Infinity
    };
    
    // Performance tracking
    this.performanceMetrics = {
      batchFormationTimes: [],
      timeoutAccuracy: [],
      memoryUsage: []
    };
    
    // Track if destroyed
    this.isDestroyed = false;
  }
  
  /**
   * Initialize the BatchManager (compatibility method)
   */
  async initialize() {
    // Component is already initialized in constructor
    return true;
  }
  
  /**
   * Get batchable method name for a given method
   */
  getBatchableMethod(method) {
    return this.batchMethods[method] || null;
  }
  
  /**
   * Check if a method can be batched
   */
  canBatch(method) {
    if (!this.enableBatching) return false;
    return this.getBatchableMethod(method) !== null;
  }
  
  /**
   * Add a request to the current batch or create a new batch
   */
  async addRequest(method, params = [], options = {}) {
    if (this.isDestroyed) {
      throw new Error('BatchManager has been destroyed');
    }
    
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    // Check if method can be batched
    if (!this.canBatch(method)) {
      this.stats.individualRequests++;
      this.emit('request-unbatchable', { method });
      return null; // Caller should execute individually
    }
    
    // Create promise for this request
    const requestPromise = new Promise((resolve, reject) => {
      const batchMethod = this.getBatchableMethod(method);
      const batchKey = this.createBatchKey(method, options);
      
      // Get or create batch
      if (!this.pendingBatches.has(batchKey)) {
        this.pendingBatches.set(batchKey, {
          key: batchKey,
          method: batchMethod,
          originalMethod: method,
          requests: [],
          timer: null,
          options,
          createdAt: Date.now(),
          executor: null // Will be set by caller
        });
      }
      
      const batch = this.pendingBatches.get(batchKey);
      
      // Add request to batch
      const request = {
        id: `${Date.now()}-${Math.random()}`,
        originalMethod: method,
        params,
        options,
        resolve,
        reject,
        addedAt: Date.now()
      };
      
      batch.requests.push(request);
      
      // Track batch formation time
      const formationTime = Date.now() - startTime;
      this.updateAvgBatchFormationTime(formationTime);
      
      // Start batch timer if first request
      if (batch.requests.length === 1) {
        const timerStart = Date.now();
        batch.timer = setTimeout(() => {
          const timerAccuracy = Date.now() - timerStart - this.batchWindow;
          this.performanceMetrics.timeoutAccuracy.push(Math.abs(timerAccuracy));
          this.executeBatch(batchKey);
        }, this.batchWindow);
        
        this.emit('batch-created', { 
          key: batchKey, 
          method: batchMethod,
          window: this.batchWindow 
        });
      }
      
      // Execute immediately if batch is full
      if (batch.requests.length >= this.maxBatchSize) {
        clearTimeout(batch.timer);
        this.executeBatch(batchKey);
        
        this.emit('batch-full', { 
          key: batchKey, 
          size: batch.requests.length 
        });
      }
    });
    
    return requestPromise;
  }
  
  /**
   * Add request with custom executor
   */
  async addRequestWithExecutor(method, params, options, executor) {
    const batchKey = this.createBatchKey(method, options);
    
    // Set executor for this batch
    if (this.pendingBatches.has(batchKey)) {
      const batch = this.pendingBatches.get(batchKey);
      if (!batch.executor) {
        batch.executor = executor;
      }
    } else {
      // Create batch with executor
      const batchMethod = this.getBatchableMethod(method);
      this.pendingBatches.set(batchKey, {
        key: batchKey,
        method: batchMethod,
        originalMethod: method,
        requests: [],
        timer: null,
        options,
        createdAt: Date.now(),
        executor
      });
    }
    
    return this.addRequest(method, params, options);
  }
  
  /**
   * Create batch key for grouping requests
   */
  createBatchKey(method, options = {}) {
    // Group by method and critical options
    const commitment = options.commitment || 'confirmed';
    const encoding = options.encoding || 'base64';
    return `${method}:${commitment}:${encoding}`;
  }
  
  /**
   * Execute a batch of requests
   */
  async executeBatch(batchKey) {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;
    
    // Remove batch from pending
    this.pendingBatches.delete(batchKey);
    if (batch.timer) {
      clearTimeout(batch.timer);
    }
    
    const batchSize = batch.requests.length;
    const batchAge = Date.now() - batch.createdAt;
    
    // Update statistics
    this.stats.batchesSent++;
    this.stats.requestsBatched += batchSize;
    this.stats.batchSavings += batchSize - 1; // Saved RPC calls
    this.stats.maxBatchSize = Math.max(this.stats.maxBatchSize, batchSize);
    this.stats.minBatchSize = Math.min(this.stats.minBatchSize, batchSize);
    
    // Track memory usage
    const memoryUsage = this.estimateBatchMemory(batch);
    this.performanceMetrics.memoryUsage.push(memoryUsage);
    
    this.emit('batch-executing', { 
      key: batchKey, 
      size: batchSize,
      age: batchAge,
      memory: memoryUsage
    });
    
    try {
      // Prepare parameters for batch execution
      const batchParams = this.prepareBatchParams(batch);
      
      // Execute batch request
      let batchResult;
      if (batch.executor) {
        // Use provided executor
        batchResult = await batch.executor(batch.method, batchParams, batch.options);
      } else {
        // No executor provided - reject all
        throw new Error('No executor provided for batch execution');
      }
      
      // Route responses back to individual requests
      this.routeResponses(batch, batchResult);
      
      this.emit('batch-completed', { 
        key: batchKey, 
        size: batchSize,
        success: true 
      });
      
    } catch (error) {
      // Reject all requests in batch
      batch.requests.forEach(req => {
        req.reject(error);
      });
      
      this.emit('batch-failed', { 
        key: batchKey, 
        size: batchSize,
        error: error.message 
      });
    }
  }
  
  /**
   * Prepare parameters for batch execution
   */
  prepareBatchParams(batch) {
    // Extract parameters based on method type
    if (batch.originalMethod === 'getAccountInfo' || 
        batch.originalMethod === 'getBalance') {
      // Extract addresses (first parameter)
      return batch.requests.map(req => req.params[0]).filter(Boolean);
    } else if (batch.originalMethod === 'getSignatureStatuses') {
      // Combine signature arrays
      return batch.requests.flatMap(req => req.params[0] || []);
    } else {
      // Generic parameter extraction
      return batch.requests.map(req => req.params).filter(Boolean);
    }
  }
  
  /**
   * Route batch response back to individual requests
   */
  routeResponses(batch, batchResult) {
    // Handle different response structures
    const results = this.extractResults(batchResult);
    
    if (!results || !Array.isArray(results)) {
      // No valid results - reject all
      const error = new Error('Invalid batch response structure');
      batch.requests.forEach(req => req.reject(error));
      return;
    }
    
    // Route each result to corresponding request
    batch.requests.forEach((req, index) => {
      if (index < results.length) {
        const result = results[index];
        
        // Transform result based on original method
        const transformedResult = this.transformResult(
          req.originalMethod,
          result
        );
        
        req.resolve(transformedResult);
      } else {
        // No result for this request
        req.reject(new Error('No result in batch response'));
      }
    });
  }
  
  /**
   * Extract results array from batch response
   */
  extractResults(batchResult) {
    // Handle various response structures
    if (Array.isArray(batchResult)) {
      return batchResult;
    }
    
    if (batchResult?.value && Array.isArray(batchResult.value)) {
      return batchResult.value;
    }
    
    if (batchResult?.result?.value && Array.isArray(batchResult.result.value)) {
      return batchResult.result.value;
    }
    
    if (batchResult?.data && Array.isArray(batchResult.data)) {
      return batchResult.data;
    }
    
    return null;
  }
  
  /**
   * Transform result based on original method type
   */
  transformResult(originalMethod, result) {
    if (originalMethod === 'getAccountInfo') {
      // Wrap in expected structure
      return { value: result };
    } else if (originalMethod === 'getBalance') {
      // Extract balance from account data
      if (result && typeof result === 'object') {
        const balance = result.lamports || 0;
        return { value: balance };
      }
      return { value: 0 };
    } else if (originalMethod === 'getSignatureStatuses') {
      // Return signature status directly
      return { value: result };
    }
    
    // Default: return as-is
    return result;
  }
  
  /**
   * Estimate memory usage of a batch
   */
  estimateBatchMemory(batch) {
    // More accurate estimation in bytes
    // Base overhead for batch structure
    let memory = 50; 
    
    // Only count unique data, not full request objects
    batch.requests.forEach(req => {
      // Just the param data size
      const paramSize = JSON.stringify(req.params || []).length;
      memory += Math.min(paramSize, 20); // Cap per param
    });
    
    // Cap total at reasonable limit
    return Math.min(memory, 1000);
  }
  
  /**
   * Update average batch formation time
   */
  updateAvgBatchFormationTime(time) {
    const count = this.stats.totalRequests;
    this.stats.avgBatchFormationTime = 
      (this.stats.avgBatchFormationTime * (count - 1) + time) / count;
  }
  
  /**
   * Flush all pending batches immediately
   */
  flushAll() {
    const keys = Array.from(this.pendingBatches.keys());
    keys.forEach(key => this.executeBatch(key));
  }
  
  /**
   * Flush specific batch
   */
  flush(batchKey) {
    if (this.pendingBatches.has(batchKey)) {
      this.executeBatch(batchKey);
    }
  }
  
  /**
   * Clear all pending batches without executing
   */
  clear() {
    for (const [key, batch] of this.pendingBatches.entries()) {
      if (batch.timer) {
        clearTimeout(batch.timer);
      }
      
      // Reject all pending requests
      batch.requests.forEach(req => {
        req.reject(new Error('Batch manager cleared'));
      });
    }
    
    this.pendingBatches.clear();
    this.emit('batches-cleared');
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    const efficiency = this.stats.requestsBatched > 0
      ? (this.stats.batchSavings / this.stats.requestsBatched * 100)
      : 0;
    
    const avgBatchSize = this.stats.batchesSent > 0
      ? (this.stats.requestsBatched / this.stats.batchesSent)
      : 0;
    
    const avgTimeoutAccuracy = this.performanceMetrics.timeoutAccuracy.length > 0
      ? (this.performanceMetrics.timeoutAccuracy.reduce((a, b) => a + b, 0) / 
         this.performanceMetrics.timeoutAccuracy.length)
      : 0;
    
    const avgMemoryPerBatch = this.performanceMetrics.memoryUsage.length > 0
      ? (this.performanceMetrics.memoryUsage.reduce((a, b) => a + b, 0) / 
         this.performanceMetrics.memoryUsage.length)
      : 0;
    
    return {
      ...this.stats,
      avgBatchSize: avgBatchSize.toFixed(2),
      efficiencyPercentage: efficiency.toFixed(2) + '%',
      avgBatchFormationTimeMs: this.stats.avgBatchFormationTime.toFixed(3),
      avgTimeoutAccuracyMs: avgTimeoutAccuracy.toFixed(2),
      avgMemoryPerBatchBytes: avgMemoryPerBatch.toFixed(0),
      pendingBatches: this.pendingBatches.size
    };
  }
  
  /**
   * Get detailed metrics
   */
  getMetrics() {
    const stats = this.getStats();
    
    return {
      ...stats,
      batchWindow: this.batchWindow,
      maxBatchSize: this.maxBatchSize,
      enabledStatus: this.enableBatching,
      methodMappings: Object.keys(this.batchMethods).length,
      reductionPercentage: stats.efficiencyPercentage,
      memoryEfficiency: parseInt(stats.avgMemoryPerBatchBytes) < 1024 ? 'PASS' : 'FAIL'
    };
  }
  
  /**
   * Health check for monitoring
   */
  async healthCheck() {
    const startTime = process.hrtime.bigint();
    
    try {
      const metrics = this.getMetrics();
      const efficiency = parseFloat(metrics.efficiencyPercentage);
      
      const healthy = 
        this.stats.avgBatchFormationTime < 10 && // Under 10ms formation
        parseInt(metrics.avgMemoryPerBatchBytes) < 1024 && // Under 1KB
        parseFloat(metrics.avgTimeoutAccuracyMs) < 10 && // Within 10ms accuracy
        !this.isDestroyed;
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;
      
      return {
        healthy,
        latency: latencyMs,
        metrics,
        warnings: this.getHealthWarnings()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get health warnings
   */
  getHealthWarnings() {
    const warnings = [];
    
    if (this.stats.avgBatchFormationTime > 10) {
      warnings.push(`Slow batch formation: ${this.stats.avgBatchFormationTime.toFixed(2)}ms`);
    }
    
    const avgMemory = this.performanceMetrics.memoryUsage.length > 0
      ? this.performanceMetrics.memoryUsage.reduce((a, b) => a + b, 0) / 
        this.performanceMetrics.memoryUsage.length
      : 0;
    
    if (avgMemory > 1024) {
      warnings.push(`High memory per batch: ${avgMemory.toFixed(0)} bytes`);
    }
    
    if (this.pendingBatches.size > 10) {
      warnings.push(`Many pending batches: ${this.pendingBatches.size}`);
    }
    
    return warnings;
  }
  
  /**
   * Destroy batch manager and clean up
   */
  destroy() {
    this.isDestroyed = true;
    this.clear();
    this.removeAllListeners();
  }
  
  /**
   * Static factory method for configuration from environment
   */
  static fromEnvironment() {
    return new BatchManager({
      batchWindow: parseInt(process.env.BATCH_WINDOW_MS) || 50,
      maxBatchSize: parseInt(process.env.BATCH_MAX_SIZE) || 100,
      enableBatching: process.env.BATCHING_ENABLED !== 'false'
    });
  }
}

// Export for backward compatibility
export default BatchManager;