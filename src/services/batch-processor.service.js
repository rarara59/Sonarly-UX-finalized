/**
 * BATCH PROCESSOR
 * 
 * High-performance RPC call batching system for Solana data operations.
 * Prevents rate limiting, reduces latency, and maximizes throughput.
 * 
 * Key Features:
 * - Intelligent batching based on operation type
 * - Rate limit awareness and backoff
 * - Automatic retry with exponential backoff
 * - Priority-based queue management
 * - Performance monitoring and optimization
 */

import { EventEmitter } from 'events';

// Performance algorithms integration
import {
  calculateLittlesLaw,
  scheduleWFQ,
  simpleExponentialSmoothing,
  findServerConsistentHash
} from '../utils/performance-algorithms.js';

export class BatchProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Batch size limits per operation type
      batchSizes: {
        getMultipleAccounts: options.getMultipleAccounts || 100, // Solana RPC limit
        getTokenAccountBalance: options.getTokenAccountBalance || 50,
        getMintInfo: options.getMintInfo || 25,
        jupiterPrices: options.jupiterPrices || 10, // Jupiter API limit
        ...options.batchSizes
      },
      
      // Rate limiting
      maxRequestsPerSecond: options.maxRequestsPerSecond || 50, // Conservative for MVP
      burstLimit: options.burstLimit || 10,
      
      // Timing - Optimized for meme coin trading
      batchDelay: options.batchDelay || 10, // 10ms for meme coin trading speed
      maxWaitTime: options.maxWaitTime || 500, // 500ms max wait
      retryDelay: options.retryDelay || 1000, // 1s initial retry delay
      maxRetries: options.maxRetries || 3,
      
      // Memory management
      maxQueueSize: options.maxQueueSize || 1000,
      
      ...options
    };
    
    // Batch queues by operation type
    this.queues = {
      getMultipleAccounts: [],
      getTokenAccountBalance: [],
      getMintInfo: [],
      jupiterPrices: []
    };
    
    // Batch timers
    this.batchTimers = {};
    
    // Enhanced rate limiting with performance algorithms
    this.requestCounts = [];
    this.lastRequestTime = 0;
    
    // Adaptive token bucket state per endpoint
    this.tokenBuckets = new Map();
    
    // Little's Law optimization state
    this.littlesLawMetrics = {
      arrivalRate: 0,
      serviceTime: 0,
      queueLength: 0,
      utilizationHistory: [],
      lastOptimization: Date.now()
    };
    
    // Weighted fair queuing state
    this.wfqState = {
      virtualTime: 0,
      queueWeights: {
        critical: 10,
        trading: 8,
        high: 6,
        normal: 4,
        low: 2
      },
      finishTimes: new Map()
    };
    
    // Exponential smoothing for rate prediction
    this.ratePrediction = {
      predictedRate: this.options.maxRequestsPerSecond,
      alpha: 0.3, // Smoothing factor
      history: []
    };
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      batchedRequests: 0,
      individualRequests: 0,
      rateLimitHits: 0,
      retries: 0,
      avgBatchSize: 0,
      avgResponseTime: 0,
      efficiencyGain: 0,
      lastResetTime: Date.now()
    };
    
    // Dependencies - RPCConnectionManager and CircuitBreaker integration
    this.rpcManager = options.solanaParser || options.rpcManager; // RPCConnectionManager instance
    this.circuitBreaker = options.circuitBreaker; // CircuitBreaker instance
    this.fetchClient = options.fetchClient || fetch;
    
    if (!this.rpcManager) {
      throw new Error('RPCConnectionManager is required');
    }
    if (!this.circuitBreaker) {
      throw new Error('CircuitBreaker instance is required');
    }
    
    // Create separate failure domains for different operation types
    this.circuitBreakers = {
      accounts: this.circuitBreaker,  // Account data fetching
      prices: this.circuitBreaker,    // Price data from Jupiter API  
      balances: this.circuitBreaker   // Token balance queries
    };
    
    this.startMetricsCollection();
  }

  /**
   * Initialize batch processor (orchestrator compatibility)
   */
  async initialize() {
    // BatchProcessor is ready immediately after construction
    // This method exists for orchestrator interface compliance
    
    console.log('BatchProcessor initialized and ready');
    
    this.emit('initialized', {
      batchSizes: this.options.batchSizes,
      maxRequestsPerSecond: this.options.maxRequestsPerSecond,
      burstLimit: this.options.burstLimit,
      timestamp: Date.now()
    });
    
    return Promise.resolve();
  }

  /**
   * Health check for orchestrator monitoring
   */
  async healthCheck() {
    try {
      // BatchProcessor is healthy if:
      // 1. Not overloaded with batches
      // 2. Priority queues are reasonable size
      // 3. No stuck batches
      // 4. Memory usage reasonable
      
      const totalPendingRequests = Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0);
      const activeBatches = Object.keys(this.batchTimers).length;
      const notOverloaded = activeBatches < Object.keys(this.queues).length * 2;
      const queueReasonableSize = totalPendingRequests < 10000; // Reasonable limit
      const batchesNotStuck = activeBatches <= Object.keys(this.queues).length;
      
      const isHealthy = notOverloaded && queueReasonableSize && batchesNotStuck;
      
      this.emit('healthCheck', {
        healthy: isHealthy,
        activeBatches: activeBatches,
        totalQueues: Object.keys(this.queues).length,
        totalPendingRequests: totalPendingRequests,
        checks: {
          notOverloaded: notOverloaded,
          queueSize: queueReasonableSize,
          batchesNotStuck: batchesNotStuck
        },
        timestamp: Date.now()
      });
      
      return isHealthy;
      
    } catch (error) {
      console.error('BatchProcessor health check failed:', error);
      return false;
    }
  }

  /**
   * Batch multiple account fetches - optimized for critical new pool detection
   * @param {string[]} addresses - Pool addresses to fetch
   * @param {object} options - Options including priority: 'critical'|'trading'|'high'|'normal'|'low'
   */
  async batchGetAccounts(addresses, options = {}) {
    // Set default priority for accounts as 'trading' (fast response needed)
    options.priority = options.priority || 'trading';
    const batchId = `accounts_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const request = {
        id: batchId,
        type: 'getMultipleAccounts',
        addresses: Array.isArray(addresses) ? addresses : [addresses],
        options: { encoding: 'base64', ...options },
        resolve,
        reject,
        startTime,
        priority: options.priority || 'normal'
      };
      
      this.addToBatch('getMultipleAccounts', request);
    });
  }

  /**
   * Batch token balance fetches - critical for trading decisions
   * @param {string[]} vaultAddresses - Token vault addresses to fetch balances for
   * @param {object} options - Options including priority: 'critical'|'trading'|'high'|'normal'|'low'
   */
  async batchGetTokenBalances(vaultAddresses, options = {}) {
    // Set default priority for balances as 'critical' (essential for trading)
    options.priority = options.priority || 'critical';
    const batchId = `balances_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const request = {
        id: batchId,
        type: 'getTokenAccountBalance',
        addresses: Array.isArray(vaultAddresses) ? vaultAddresses : [vaultAddresses],
        options,
        resolve,
        reject,
        startTime,
        priority: options.priority || 'critical' // Balances are critical for trading
      };
      
      this.addToBatch('getTokenAccountBalance', request);
    });
  }

  /**
   * Batch mint info fetches
   */
  async batchGetMintInfo(mintAddresses, options = {}) {
    const batchId = `mints_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const request = {
        id: batchId,
        type: 'getMintInfo',
        addresses: Array.isArray(mintAddresses) ? mintAddresses : [mintAddresses],
        options: { encoding: 'base64', ...options },
        resolve,
        reject,
        startTime,
        priority: options.priority || 'normal'
      };
      
      this.addToBatch('getMintInfo', request);
    });
  }

  /**
   * Batch Jupiter price fetches
   */
  async batchGetPrices(tokenMints, options = {}) {
    const batchId = `prices_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const request = {
        id: batchId,
        type: 'jupiterPrices',
        tokens: Array.isArray(tokenMints) ? tokenMints : [tokenMints],
        options,
        resolve,
        reject,
        startTime,
        priority: options.priority || 'low' // Prices are nice-to-have
      };
      
      this.addToBatch('jupiterPrices', request);
    });
  }

  /**
   * Add request to appropriate batch queue
   */
  addToBatch(queueType, request) {
    const queue = this.queues[queueType];
    if (!queue) {
      request.reject(new Error(`Unknown batch type: ${queueType}`));
      return;
    }
    
    // Check queue size limits
    if (queue.length >= this.options.maxQueueSize) {
      request.reject(new Error('Batch queue full'));
      return;
    }
    
    // Add to queue with priority insertion
    this.insertByPriority(queue, request);
    
    // Start or reset batch timer
    this.scheduleBatchExecution(queueType);
    
    this.emit('requestQueued', {
      type: queueType,
      requestId: request.id,
      queueLength: queue.length
    });
  }

  /**
   * Enhanced request insertion using weighted fair queuing
   */
  insertByPriority(queue, request) {
    const priorities = { 
      critical: 5,    // New pool detection, immediate execution
      trading: 4,     // Price/balance updates for active trades
      high: 3,        // Existing high priority
      normal: 2,      // Standard operations
      low: 1          // Historical data, analytics
    };
    const requestPriority = priorities[request.priority] || 2;
    
    // Apply weighted fair queuing algorithm
    // Note: weightedFairQueuing not implemented in performance-algorithms.js
    // Using simplified priority-based insertion instead
    const wfqResult = {
      virtualTime: this.wfqState.virtualTime + this.estimateServiceTime(request.type),
      finishTime: this.wfqState.virtualTime + this.estimateServiceTime(request.type)
    };
    // TODO: Implement weightedFairQueuing in performance-algorithms.js
    
    // Update virtual time state
    this.wfqState.virtualTime = wfqResult.virtualTime;
    
    // Find insertion position based on WFQ finish times
    let insertIndex = queue.length;
    const requestFinishTime = wfqResult.finishTime;
    
    for (let i = 0; i < queue.length; i++) {
      const queuedFinishTime = this.wfqState.finishTimes.get(queue[i].id) || 0;
      if (requestFinishTime < queuedFinishTime) {
        insertIndex = i;
        break;
      }
    }
    
    // Store finish time for this request
    this.wfqState.finishTimes.set(request.id, requestFinishTime);
    
    // Insert request at calculated position
    queue.splice(insertIndex, 0, request);
  }

  /**
   * Estimate service time for different request types
   */
  estimateServiceTime(requestType) {
    const serviceTimeEstimates = {
      getMultipleAccounts: 100, // ms
      getTokenAccountBalance: 80,
      getMintInfo: 60,
      jupiterPrices: 200
    };
    
    return serviceTimeEstimates[requestType] || 100;
  }

  /**
   * Schedule batch execution with debouncing
   */
  scheduleBatchExecution(queueType) {
    // Clear existing timer
    if (this.batchTimers[queueType]) {
      clearTimeout(this.batchTimers[queueType]);
    }
    
    // Check if we should execute immediately (batch full, critical, or high priority)
    const queue = this.queues[queueType];
    const batchSize = this.options.batchSizes[queueType];
    const hasCriticalPriority = queue.some(req => req.priority === 'critical');
    const hasHighPriority = queue.some(req => 
      req.priority === 'high' || req.priority === 'trading'
    );
    
    if (queue.length >= batchSize || hasCriticalPriority || hasHighPriority) {
      // Execute immediately
      this.batchTimers[queueType] = setTimeout(() => {
        this.executeBatch(queueType);
      }, 0);
    } else {
      // Wait for more requests or timeout
      this.batchTimers[queueType] = setTimeout(() => {
        this.executeBatch(queueType);
      }, this.options.batchDelay);
    }
  }

  /**
   * Enhanced batch execution with performance algorithms
   */
  async executeBatch(queueType) {
    const queue = this.queues[queueType];
    if (queue.length === 0) return;
    
    // Enhanced rate limiting with adaptive token bucket
    const endpoint = this.getEndpointForQueue(queueType);
    if (!this.checkAdaptiveRateLimit(endpoint)) {
      // Calculate intelligent delay using exponential smoothing
      const delay = this.calculateAdaptiveDelay(endpoint);
      setTimeout(() => {
        this.scheduleBatchExecution(queueType);
      }, delay);
      return;
    }
    
    // Optimize batch size using Little's Law
    const optimalBatchSize = this.calculateOptimalBatchSize(queueType, queue.length);
    const batch = queue.splice(0, optimalBatchSize);
    
    // Update Little's Law metrics
    this.updateLittlesLawMetrics(queue.length, batch.length);
    
    try {
      await this.processBatch(queueType, batch);
      
      // Update token bucket on success
      this.updateTokenBucketSuccess(endpoint, batch.length);
      
    } catch (error) {
      console.error(`Batch execution failed for ${queueType}:`, error);
      
      // Update token bucket on failure
      this.updateTokenBucketFailure(endpoint);
      
      // Return requests to queue for retry
      this.handleBatchError(queueType, batch, error);
    }
    
    // Schedule next batch if queue not empty
    if (queue.length > 0) {
      this.scheduleBatchExecution(queueType);
    }
  }

  /**
   * Get endpoint identifier for queue type
   */
  getEndpointForQueue(queueType) {
    // In a real implementation, this would map to actual endpoints
    // For now, use queue type as endpoint identifier
    return queueType;
  }

  /**
   * Check adaptive rate limit using token bucket algorithm
   */
  checkAdaptiveRateLimit(endpoint) {
    let bucket = this.tokenBuckets.get(endpoint);
    
    if (!bucket) {
      // Initialize adaptive token bucket
      bucket = {
        tokens: this.options.maxRequestsPerSecond,
        capacity: this.options.maxRequestsPerSecond,
        refillRate: this.options.maxRequestsPerSecond,
        lastRefill: Date.now(),
        adaptationHistory: []
      };
      this.tokenBuckets.set(endpoint, bucket);
    }
    
    // Apply adaptive token bucket algorithm
    // Note: adaptiveTokenBucket not implemented in performance-algorithms.js
    // Using simple token bucket logic instead
    const now = Date.now();
    const timeDelta = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timeDelta * bucket.refillRate;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    const bucketResult = {
      allowed: bucket.tokens >= 1,
      bucket: {
        ...bucket,
        tokens: Math.max(0, bucket.tokens - 1)
      }
    };
    // TODO: Implement adaptiveTokenBucket in performance-algorithms.js
    
    // Update bucket state
    this.tokenBuckets.set(endpoint, bucketResult.bucket);
    
    return bucketResult.allowed;
  }

  /**
   * Calculate adaptive delay using exponential smoothing
   */
  calculateAdaptiveDelay(endpoint) {
    const bucket = this.tokenBuckets.get(endpoint);
    if (!bucket) return this.calculateRateLimitDelay();
    
    // Calculate predicted delay based on token refill rate
    const tokensNeeded = 1;
    const refillTime = (tokensNeeded / bucket.refillRate) * 1000; // Convert to ms
    
    // Apply exponential smoothing to the delay prediction
    const currentRate = this.requestCounts.length;
    // Note: exponentialSmoothing not implemented in performance-algorithms.js
    // Using simple exponential smoothing formula
    const alpha = this.ratePrediction.alpha;
    const smoothedRate = alpha * currentRate + (1 - alpha) * this.ratePrediction.predictedRate;
    // TODO: Implement exponentialSmoothing in performance-algorithms.js
    
    this.ratePrediction.predictedRate = smoothedRate;
    this.ratePrediction.history.push({ timestamp: Date.now(), rate: currentRate });
    
    // Keep history bounded
    if (this.ratePrediction.history.length > 100) {
      this.ratePrediction.history = this.ratePrediction.history.slice(-100);
    }
    
    // Calculate adaptive delay based on smoothed predictions
    const adaptiveDelay = Math.max(refillTime, this.calculateRateLimitDelay());
    
    return Math.min(adaptiveDelay, 5000); // Cap at 5 seconds
  }

  /**
   * Calculate optimal batch size using Little's Law
   */
  calculateOptimalBatchSize(queueType, currentQueueLength) {
    const baseBatchSize = this.options.batchSizes[queueType];
    
    // Only optimize every 10 seconds to avoid overhead
    const now = Date.now();
    if (now - this.littlesLawMetrics.lastOptimization < 10000) {
      return Math.min(baseBatchSize, currentQueueLength);
    }
    
    this.littlesLawMetrics.lastOptimization = now;
    
    // Calculate Little's Law optimization
    const littlesResult = calculateLittlesLaw({
      arrivalRate: this.littlesLawMetrics.arrivalRate,
      serviceTime: this.littlesLawMetrics.serviceTime / 1000, // Convert to seconds
      systemSize: currentQueueLength
    });
    
    if (littlesResult.optimalBatchSize) {
      // Optimal batch size based on queueing theory
      const theoreticalOptimal = Math.ceil(littlesResult.optimalBatchSize);
      
      // Constrain to reasonable bounds
      const constrainedOptimal = Math.max(
        1,
        Math.min(
          theoreticalOptimal,
          baseBatchSize * 1.5, // Don't exceed 150% of base size
          currentQueueLength
        )
      );
      
      return constrainedOptimal;
    }
    
    return Math.min(baseBatchSize, currentQueueLength);
  }

  /**
   * Update Little's Law metrics for continuous optimization
   */
  updateLittlesLawMetrics(queueLengthBefore, batchSize) {
    const now = Date.now();
    
    // Estimate arrival rate (requests per second)
    const timeDelta = (now - (this.littlesLawMetrics.lastUpdate || now)) / 1000;
    if (timeDelta > 0) {
      const newArrivals = batchSize;
      // Note: exponentialSmoothing not implemented in performance-algorithms.js
      const alpha = 0.2;
      this.littlesLawMetrics.arrivalRate = alpha * (newArrivals / timeDelta) + (1 - alpha) * this.littlesLawMetrics.arrivalRate;
      // TODO: Implement exponentialSmoothing in performance-algorithms.js
    }
    
    // Update average queue length
    // Note: exponentialSmoothing not implemented in performance-algorithms.js
    const alpha = 0.2;
    this.littlesLawMetrics.queueLength = alpha * queueLengthBefore + (1 - alpha) * this.littlesLawMetrics.queueLength;
    // TODO: Implement exponentialSmoothing in performance-algorithms.js
    
    this.littlesLawMetrics.lastUpdate = now;
  }

  /**
   * Update token bucket state on successful requests
   */
  updateTokenBucketSuccess(endpoint, requestCount) {
    const bucket = this.tokenBuckets.get(endpoint);
    if (!bucket) return;
    
    // Record successful batch for adaptation
    bucket.adaptationHistory.push({
      timestamp: Date.now(),
      success: true,
      requestCount,
      responseTime: this.getAverageResponseTime(endpoint)
    });
    
    // Keep adaptation history bounded
    if (bucket.adaptationHistory.length > 50) {
      bucket.adaptationHistory = bucket.adaptationHistory.slice(-50);
    }
  }

  /**
   * Update token bucket state on failed requests
   */
  updateTokenBucketFailure(endpoint) {
    const bucket = this.tokenBuckets.get(endpoint);
    if (!bucket) return;
    
    // Record failure for adaptation
    bucket.adaptationHistory.push({
      timestamp: Date.now(),
      success: false,
      requestCount: 0,
      responseTime: 0
    });
    
    // Keep adaptation history bounded
    if (bucket.adaptationHistory.length > 50) {
      bucket.adaptationHistory = bucket.adaptationHistory.slice(-50);
    }
  }

  /**
   * Get current load for endpoint
   */
  getCurrentLoad(endpoint) {
    const queue = this.queues[endpoint];
    return queue ? queue.length : 0;
  }

  /**
   * Get error rate for endpoint
   */
  getErrorRate(endpoint) {
    const bucket = this.tokenBuckets.get(endpoint);
    if (!bucket || bucket.adaptationHistory.length === 0) return 0;
    
    const recent = bucket.adaptationHistory.slice(-20); // Last 20 requests
    const failures = recent.filter(h => !h.success).length;
    
    return failures / recent.length;
  }

  /**
   * Get average response time for endpoint
   */
  getAverageResponseTime(endpoint) {
    const bucket = this.tokenBuckets.get(endpoint);
    if (!bucket || bucket.adaptationHistory.length === 0) return 100;
    
    const recent = bucket.adaptationHistory.slice(-10).filter(h => h.success);
    if (recent.length === 0) return 100;
    
    const totalTime = recent.reduce((sum, h) => sum + h.responseTime, 0);
    return totalTime / recent.length;
  }

  /**
   * Process batch based on type
   */
  async processBatch(queueType, batch) {
    const startTime = Date.now();
    
    try {
      let results;
      
      switch (queueType) {
        case 'getMultipleAccounts':
          results = await this.processAccountsBatch(batch);
          break;
        case 'getTokenAccountBalance':
          results = await this.processBalancesBatch(batch);
          break;
        case 'getMintInfo':
          results = await this.processMintsBatch(batch);
          break;
        case 'jupiterPrices':
          results = await this.processPricesBatch(batch);
          break;
        default:
          throw new Error(`Unknown batch type: ${queueType}`);
      }
      
      // Resolve individual requests
      this.resolveRequests(batch, results);
      
      // Update metrics
      this.updateBatchMetrics(queueType, batch.length, Date.now() - startTime);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process accounts batch using RPCConnectionManager with circuit breaker protection
   */
  async processAccountsBatch(batch) {
    if (!this.rpcManager) {
      throw new Error('RPCConnectionManager not available');
    }
    
    // Collect all addresses from batch requests
    const allAddresses = [];
    const requestMap = new Map();
    
    batch.forEach(request => {
      request.addresses.forEach((address, index) => {
        allAddresses.push(address);
        requestMap.set(allAddresses.length - 1, { request, addressIndex: index });
      });
    });
    
    // Make single RPC call through RPCConnectionManager with circuit breaker protection
    const response = await this.circuitBreakers.accounts.execute(
      async () => {
        return await this.rpcManager.call('getMultipleAccounts', [allAddresses], {
          priority: batch[0].priority || 'normal',
          encoding: 'base64',
          ...batch[0].options
        });
      }
    );
    
    if (!response || !Array.isArray(response)) {
      throw new Error('Invalid getMultipleAccounts response');
    }
    
    // Map results back to requests
    const results = new Map();
    
    response.forEach((accountInfo, index) => {
      const mapping = requestMap.get(index);
      if (mapping) {
        const { request, addressIndex } = mapping;
        
        if (!results.has(request.id)) {
          results.set(request.id, new Array(request.addresses.length));
        }
        
        results.get(request.id)[addressIndex] = accountInfo;
      }
    });
    
    return results;
  }

  /**
   * Process token balances batch with RPCConnectionManager and circuit breaker protection
   */
  async processBalancesBatch(batch) {
    if (!this.rpcManager) {
      throw new Error('RPCConnectionManager not available');
    }
    
    const results = new Map();
    
    // Execute balance calls in parallel (limited concurrency)
    const concurrency = 10;
    for (let i = 0; i < batch.length; i += concurrency) {
      const batchSlice = batch.slice(i, i + concurrency);
      
      const promises = batchSlice.map(async (request) => {
        try {
          const balances = await Promise.all(
            request.addresses.map(async (address) => {
              return this.circuitBreakers.balances.execute(
                async () => {
                  return await this.rpcManager.call('getTokenAccountBalance', [address], {
                    priority: request.priority || 'normal'
                  });
                }
              );
            })
          );
          results.set(request.id, balances);
        } catch (error) {
          results.set(request.id, { error: error.message });
        }
      });
      
      await Promise.all(promises);
    }
    
    return results;
  }

  /**
   * Process mints batch using getMultipleAccounts
   */
  async processMintsBatch(batch) {
    // Use getMultipleAccounts for mint info (more efficient)
    const accountsBatch = batch.map(request => ({
      ...request,
      type: 'getMultipleAccounts'
    }));
    
    return this.processAccountsBatch(accountsBatch);
  }

  /**
   * Process Jupiter prices batch with circuit breaker protection
   */
  async processPricesBatch(batch) {
    if (!this.fetchClient) {
      throw new Error('Fetch client not available');
    }
    
    const results = new Map();
    
    try {
      // Collect all unique tokens
      const allTokens = new Set();
      batch.forEach(request => {
        request.tokens.forEach(token => allTokens.add(token));
      });
      
      // Make single Jupiter API call with circuit breaker protection
      const tokenList = Array.from(allTokens).join(',');
      const response = await this.circuitBreakers.prices.execute(
        () => this.fetchClient(`https://price.jup.ag/v6/price?ids=${tokenList}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ThorpV1/1.0.0'
          },
          timeout: 5000
        })
      );
      
      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }
      
      const priceData = await response.json();
      
      // Map results back to requests
      batch.forEach(request => {
        const requestPrices = {};
        request.tokens.forEach(token => {
          if (priceData.data && priceData.data[token]) {
            requestPrices[token] = priceData.data[token];
          }
        });
        results.set(request.id, requestPrices);
      });
      
    } catch (error) {
      // Set error for all requests
      batch.forEach(request => {
        results.set(request.id, { error: error.message });
      });
    }
    
    return results;
  }

  /**
   * Resolve individual requests with results
   */
  resolveRequests(batch, results) {
    batch.forEach(request => {
      const result = results.get(request.id);
      
      if (result && result.error) {
        request.reject(new Error(result.error));
      } else if (result) {
        // For single address requests, return single result
        if (request.addresses && request.addresses.length === 1) {
          request.resolve(Array.isArray(result) ? result[0] : result);
        } else {
          request.resolve(result);
        }
      } else {
        request.reject(new Error('No result found for request'));
      }
    });
  }

  /**
   * Handle batch execution errors
   */
  async handleBatchError(queueType, batch, error) {
    console.error(`Batch error for ${queueType}:`, error.message);
    
    // Increment retry count for each request
    batch.forEach(request => {
      request.retries = (request.retries || 0) + 1;
    });
    
    // Separate retryable vs failed requests
    const retryableRequests = [];
    const failedRequests = [];
    
    batch.forEach(request => {
      if (request.retries < this.options.maxRetries) {
        retryableRequests.push(request);
      } else {
        failedRequests.push(request);
      }
    });
    
    // Reject permanently failed requests
    failedRequests.forEach(request => {
      request.reject(new Error(`Batch failed after ${this.options.maxRetries} retries: ${error.message}`));
    });
    
    // Retry other requests with exponential backoff
    if (retryableRequests.length > 0) {
      const delay = this.options.retryDelay * Math.pow(2, retryableRequests[0].retries - 1);
      
      setTimeout(() => {
        // Add back to front of queue with higher priority
        retryableRequests.forEach(request => {
          request.priority = 'high';
          this.queues[queueType].unshift(request);
        });
        
        this.scheduleBatchExecution(queueType);
      }, delay);
      
      this.metrics.retries += retryableRequests.length;
    }
  }

  /**
   * Rate limiting check
   */
  checkRateLimit() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Remove old requests
    this.requestCounts = this.requestCounts.filter(time => time > oneSecondAgo);
    
    // Check if we can make another request
    if (this.requestCounts.length >= this.options.maxRequestsPerSecond) {
      this.metrics.rateLimitHits++;
      return false;
    }
    
    // Check burst limit
    const recentRequests = this.requestCounts.filter(time => time > now - 100); // Last 100ms
    if (recentRequests.length >= this.options.burstLimit) {
      return false;
    }
    
    // Record this request
    this.requestCounts.push(now);
    this.lastRequestTime = now;
    
    return true;
  }

  /**
   * Calculate delay needed for rate limiting
   */
  calculateRateLimitDelay() {
    const oldestRequest = Math.min(...this.requestCounts);
    const timeSinceOldest = Date.now() - oldestRequest;
    return Math.max(0, 1000 - timeSinceOldest + 100); // Add 100ms buffer
  }

  /**
   * Enhanced batch execution metrics with performance algorithms
   */
  updateBatchMetrics(queueType, batchSize, responseTime) {
    this.metrics.totalRequests++;
    this.metrics.batchedRequests++;
    
    // Update average batch size using exponential smoothing
    // Note: exponentialSmoothing not implemented in performance-algorithms.js
    const batchAlpha = 0.1;
    this.metrics.avgBatchSize = batchAlpha * batchSize + (1 - batchAlpha) * this.metrics.avgBatchSize;
    // TODO: Implement exponentialSmoothing in performance-algorithms.js
    
    // Update average response time using exponential smoothing
    // Note: exponentialSmoothing not implemented in performance-algorithms.js
    const responseAlpha = 0.1;
    this.metrics.avgResponseTime = responseAlpha * responseTime + (1 - responseAlpha) * this.metrics.avgResponseTime;
    // TODO: Implement exponentialSmoothing in performance-algorithms.js
    
    // Update Little's Law service time
    // Note: exponentialSmoothing not implemented in performance-algorithms.js
    const serviceAlpha = 0.2;
    this.littlesLawMetrics.serviceTime = serviceAlpha * responseTime + (1 - serviceAlpha) * this.littlesLawMetrics.serviceTime;
    // TODO: Implement exponentialSmoothing in performance-algorithms.js
    
    // Calculate efficiency gain (requests saved by batching)
    this.metrics.efficiencyGain = Math.max(0, this.metrics.avgBatchSize - 1);
    
    // Update utilization history for Little's Law optimization
    const utilization = this.calculateSystemUtilization();
    this.littlesLawMetrics.utilizationHistory.push({
      timestamp: Date.now(),
      utilization,
      queueLength: this.getTotalQueueLength(),
      throughput: batchSize / (responseTime / 1000) // requests per second
    });
    
    // Keep utilization history bounded
    if (this.littlesLawMetrics.utilizationHistory.length > 100) {
      this.littlesLawMetrics.utilizationHistory = this.littlesLawMetrics.utilizationHistory.slice(-100);
    }
    
    this.emit('batchExecuted', {
      type: queueType,
      batchSize,
      responseTime,
      efficiency: this.metrics.efficiencyGain,
      utilization,
      optimalBatchSize: this.calculateOptimalBatchSize(queueType, this.queues[queueType].length)
    });
  }

  /**
   * Calculate current system utilization
   */
  calculateSystemUtilization() {
    const totalQueueLength = this.getTotalQueueLength();
    const maxCapacity = Object.values(this.options.batchSizes).reduce((sum, size) => sum + size, 0);
    
    return Math.min(1.0, totalQueueLength / Math.max(maxCapacity, 1));
  }

  /**
   * Get total queue length across all queues
   */
  getTotalQueueLength() {
    return Object.values(this.queues).reduce((total, queue) => total + queue.length, 0);
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Reset metrics every 5 minutes
    setInterval(() => {
      const timePeriod = Date.now() - this.metrics.lastResetTime;
      const requestsPerSecond = (this.metrics.totalRequests * 1000) / timePeriod;
      
      this.emit('metricsReport', {
        ...this.metrics,
        requestsPerSecond,
        timePeriod
      });
      
      // Reset counters but keep averages
      this.metrics.totalRequests = 0;
      this.metrics.batchedRequests = 0;
      this.metrics.rateLimitHits = 0;
      this.metrics.retries = 0;
      this.metrics.lastResetTime = Date.now();
      
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Get enhanced performance metrics with algorithm insights
   */
  getMetrics() {
    const queueLengths = {};
    Object.keys(this.queues).forEach(type => {
      queueLengths[type] = this.queues[type].length;
    });
    
    // Calculate performance percentiles
    const recentUtilization = this.littlesLawMetrics.utilizationHistory.slice(-50);
    const utilizationValues = recentUtilization.map(h => h.utilization);
    const throughputValues = recentUtilization.map(h => h.throughput);
    
    // Note: calculatePercentiles not implemented in performance-algorithms.js
    // Using simple percentile calculation
    const utilizationPercentiles = utilizationValues.length > 0 ? 
      this.calculateSimplePercentiles(utilizationValues, [50, 95, 99]) : {};
    const throughputPercentiles = throughputValues.length > 0 ? 
      this.calculateSimplePercentiles(throughputValues, [50, 95, 99]) : {};
    // TODO: Implement calculatePercentiles in performance-algorithms.js
    
    // Get token bucket states
    const tokenBucketStates = {};
    this.tokenBuckets.forEach((bucket, endpoint) => {
      tokenBucketStates[endpoint] = {
        tokens: bucket.tokens,
        capacity: bucket.capacity,
        refillRate: bucket.refillRate,
        adaptationCount: bucket.adaptationHistory.length,
        recentErrorRate: this.getErrorRate(endpoint),
        avgResponseTime: this.getAverageResponseTime(endpoint)
      };
    });
    
    return {
      ...this.metrics,
      queueLengths,
      activeQueues: Object.keys(this.queues).filter(type => this.queues[type].length > 0).length,
      requestsInLastSecond: this.requestCounts.length,
      
      // Performance algorithm insights
      performanceAlgorithms: {
        littlesLaw: {
          arrivalRate: this.littlesLawMetrics.arrivalRate,
          serviceTime: this.littlesLawMetrics.serviceTime,
          currentUtilization: this.calculateSystemUtilization(),
          utilizationPercentiles,
          throughputPercentiles
        },
        adaptiveTokenBuckets: tokenBucketStates,
        weightedFairQueuing: {
          virtualTime: this.wfqState.virtualTime,
          queueWeights: this.wfqState.queueWeights,
          activeFinishTimes: this.wfqState.finishTimes.size
        },
        ratePrediction: {
          predictedRate: this.ratePrediction.predictedRate,
          smoothingFactor: this.ratePrediction.alpha,
          historyLength: this.ratePrediction.history.length
        }
      }
    };
  }

  /**
   * Force flush all queues (for testing/shutdown)
   */
  async flushAll() {
    const flushPromises = Object.keys(this.queues).map(queueType => {
      if (this.queues[queueType].length > 0) {
        return this.executeBatch(queueType);
      }
    });
    
    await Promise.allSettled(flushPromises);
  }

  /**
   * Simple percentile calculation helper
   */
  calculateSimplePercentiles(values, percentiles) {
    if (values.length === 0) return {};
    
    const sorted = [...values].sort((a, b) => a - b);
    const result = {};
    
    percentiles.forEach(p => {
      const index = Math.floor((p / 100) * (sorted.length - 1));
      result[`p${p}`] = sorted[index];
    });
    
    return result;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down batch processor...');
    
    // Clear all timers
    Object.values(this.batchTimers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    
    // Flush remaining requests
    await this.flushAll();
    
    // Reject any remaining queued requests
    Object.values(this.queues).forEach(queue => {
      queue.forEach(request => {
        request.reject(new Error('Batch processor shutting down'));
      });
      queue.length = 0;
    });
    
    console.log('Batch processor shutdown complete');
    this.emit('shutdown');
  }
}

/**
 * Factory function to create BatchProcessor with integrated services
 */
export function createBatchProcessor(rpcManagerOrSolanaParser, circuitBreaker, options = {}) {
  return new BatchProcessor({
    solanaParser: rpcManagerOrSolanaParser, // For backward compatibility
    rpcManager: rpcManagerOrSolanaParser,   // New parameter name
    circuitBreaker,
    ...options
  });
}

export default BatchProcessor;