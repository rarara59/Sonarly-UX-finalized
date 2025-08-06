/**
 * Renaissance Batch Request Optimizer
 * Simple, Fast, Reliable - No Academic Over-Engineering
 * Target: 5x throughput improvement through proven batching patterns
 */

export class BatchRequestOptimizer {
  constructor(rpcPool) {
    this.rpcPool = rpcPool;
    
    // Simple, bounded caches to prevent memory leaks
    this.pendingBatches = new Map();
    this.batchTimeouts = new Map();
    
    // Proven batch sizes from actual Solana production systems
    this.batchConfig = {
      'getMultipleAccounts': { size: 100, delay: 50 },
      'getTokenAccountsByOwner': { size: 1, delay: 0 }, // No batching - individual calls
      'getProgramAccounts': { size: 1, delay: 0 },      // No batching - individual calls
      'getSignaturesForAddress': { size: 1, delay: 0 }, // No batching - individual calls
      'getAccountInfo': { size: 1, delay: 0 }           // No batching - individual calls
    };
    
    // Memory leak prevention
    this.maxPendingBatches = 50;
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
    
    // Simple performance tracking
    this.stats = {
      totalRequests: 0,
      batchedRequests: 0,
      startTime: Date.now()
    };
  }

  // Main batching method - Renaissance simplicity
  async batchRequest(method, requests) {
    this.stats.totalRequests += requests.length;
    
    const config = this.batchConfig[method];
    
    // Skip batching for non-batchable methods or single requests
    if (!config || config.size === 1 || requests.length === 1) {
      return this.executeIndividual(method, requests);
    }
    
    // Only batch getMultipleAccounts - the one method that actually benefits
    if (method === 'getMultipleAccounts') {
      return this.batchGetMultipleAccounts(requests);
    }
    
    // Fallback to individual requests
    return this.executeIndividual(method, requests);
  }

  // Execute individual requests in parallel - fast and reliable
  async executeIndividual(method, requests) {
    return Promise.all(requests.map(request => 
      this.rpcPool.call(method, request.params)
    ));
  }

  // The ONLY method worth batching - getMultipleAccounts
  async batchGetMultipleAccounts(requests) {
    // Extract addresses from requests
    const addresses = requests.map(req => req.params[0]);
    const options = requests[0]?.params[1] || { encoding: 'jsonParsed', commitment: 'confirmed' };
    
    // Split into 100-address chunks (Solana RPC limit)
    const chunks = this.chunkArray(addresses, 100);
    
    // Execute chunks in parallel
    const chunkResults = await Promise.all(
      chunks.map(chunk => 
        this.rpcPool.call('getMultipleAccounts', [chunk, options])
      )
    );
    
    // Flatten results correctly - fix the data corruption bug
    const allResults = chunkResults.flatMap(response => response.value || []);
    
    this.stats.batchedRequests += requests.length;
    return allResults;
  }

  // Simple array chunking utility
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Memory leak prevention - Renaissance reliability
  cleanup() {
    // Clear old pending batches
    if (this.pendingBatches.size > this.maxPendingBatches) {
      this.pendingBatches.clear();
      this.batchTimeouts.clear();
    }
    
    // Clear old timeouts
    for (const [key, timeout] of this.batchTimeouts) {
      if (timeout && timeout._destroyed) {
        this.batchTimeouts.delete(key);
      }
    }
  }

  // Simple performance stats
  getStats() {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const throughput = this.stats.totalRequests / runtime;
    
    return {
      totalRequests: this.stats.totalRequests,
      batchedRequests: this.stats.batchedRequests,
      throughputPerSecond: Math.round(throughput),
      runtime: Math.round(runtime),
      memoryHealth: {
        pendingBatches: this.pendingBatches.size,
        timeouts: this.batchTimeouts.size
      }
    };
  }

  // Health check - simple and effective
  isHealthy() {
    return this.pendingBatches.size < this.maxPendingBatches 
           && this.batchTimeouts.size < 20;
  }

  // Cleanup on shutdown
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clear all timeouts
    for (const timeout of this.batchTimeouts.values()) {
      clearTimeout(timeout);
    }
    
    this.pendingBatches.clear();
    this.batchTimeouts.clear();
  }
}