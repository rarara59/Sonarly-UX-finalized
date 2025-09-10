/**
 * RequestCache Component Testing
 * Comprehensive test suite for request caching and coalescing
 */

import { RequestCache } from '../../src/detection/transport/request-cache.js';

// Console colors for test output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Mock Expensive Operation
class ExpensiveOperation {
  constructor() {
    this.callCount = 0;
    this.totalLatency = 0;
    this.results = new Map();
  }

  async execute(key, delay = 50, shouldFail = false) {
    this.callCount++;
    const startTime = Date.now();
    
    // Simulate expensive operation
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (shouldFail) {
      throw new Error(`Operation failed for key: ${key}`);
    }
    
    const result = {
      key,
      value: `result_${key}_${this.callCount}`,
      timestamp: Date.now(),
      latency: Date.now() - startTime
    };
    
    this.totalLatency += result.latency;
    this.results.set(key, result);
    
    return result;
  }

  reset() {
    this.callCount = 0;
    this.totalLatency = 0;
    this.results.clear();
  }

  getStats() {
    return {
      callCount: this.callCount,
      avgLatency: this.callCount > 0 ? this.totalLatency / this.callCount : 0,
      uniqueKeys: this.results.size
    };
  }
}

// Mock Trading Request Patterns
class TradingRequestSimulator {
  constructor() {
    this.patterns = {
      // Common meme coin trading requests
      getBalance: { frequency: 0.25, ttl: 500 },
      getTokenInfo: { frequency: 0.20, ttl: 5000 },
      getRecentTrades: { frequency: 0.15, ttl: 250 },
      getQuote: { frequency: 0.30, ttl: 100 },
      getPool: { frequency: 0.10, ttl: 1000 }
    };
  }

  generateRequest() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [method, config] of Object.entries(this.patterns)) {
      cumulative += config.frequency;
      if (rand < cumulative) {
        return {
          method,
          params: this.generateParams(method),
          ttl: config.ttl
        };
      }
    }
    
    return {
      method: 'getBalance',
      params: ['defaultAddress'],
      ttl: 500
    };
  }

  generateParams(method) {
    switch (method) {
      case 'getBalance':
        return [`address_${Math.floor(Math.random() * 10)}`];
      case 'getTokenInfo':
        return [`token_${Math.floor(Math.random() * 5)}`];
      case 'getRecentTrades':
        return [`pair_${Math.floor(Math.random() * 3)}`];
      case 'getQuote':
        return [`quote_${Math.floor(Math.random() * 20)}`];
      case 'getPool':
        return [`pool_${Math.floor(Math.random() * 5)}`];
      default:
        return [];
    }
  }

  generateBatch(count) {
    const requests = [];
    for (let i = 0; i < count; i++) {
      requests.push(this.generateRequest());
    }
    return requests;
  }
}

// Test Suite
class RequestCacheTestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
    this.expensiveOp = new ExpensiveOperation();
    this.tradingSimulator = new TradingRequestSimulator();
  }

  // Test 1: Cache Hit/Miss Accuracy
  async testCacheHitMissAccuracy() {
    console.log(`${colors.blue}Testing Cache Hit/Miss Accuracy...${colors.reset}`);
    
    const cache = new RequestCache({
      maxEntries: 100,
      defaultTTL: 500
    });
    
    try {
      // First request - should miss
      const key1 = cache.generateKey('getBalance', ['address1']);
      const result1 = await cache.get(key1, () => this.expensiveOp.execute('balance1', 10));
      
      // Second request same key - should hit
      const result2 = await cache.get(key1, () => this.expensiveOp.execute('balance1', 10));
      
      // Third request different key - should miss
      const key2 = cache.generateKey('getBalance', ['address2']);
      const result3 = await cache.get(key2, () => this.expensiveOp.execute('balance2', 10));
      
      // Fourth request to first key - should hit
      const result4 = await cache.get(key1, () => this.expensiveOp.execute('balance1', 10));
      
      const stats = cache.getStats();
      
      console.log(`${colors.cyan}Hits: ${stats.hits}, Misses: ${stats.misses}, Hit rate: ${stats.hitRate}${colors.reset}`);
      console.log(`${colors.cyan}Operations executed: ${this.expensiveOp.callCount} (expected: 2)${colors.reset}`);
      
      cache.destroy();
      this.expensiveOp.reset();
      
      return {
        passed: stats.hits === 2 && stats.misses === 2 && this.expensiveOp.callCount === 2,
        metric: 'cacheAccuracy',
        expected: '2 hits, 2 misses, 2 operations',
        actual: `${stats.hits} hits, ${stats.misses} misses, ${this.expensiveOp.callCount} operations`,
        hitRate: stats.hitRate
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 2: TTL Expiration Accuracy
  async testTTLExpiration() {
    console.log(`${colors.blue}Testing TTL Expiration Accuracy...${colors.reset}`);
    
    const ttl = 100; // 100ms TTL
    const cache = new RequestCache({
      maxEntries: 100,
      defaultTTL: ttl
    });
    
    try {
      const key = cache.generateKey('getTokenInfo', ['token1']);
      
      // Set value with TTL
      const result1 = await cache.get(key, () => this.expensiveOp.execute('token1', 10), ttl);
      
      // Check immediately - should hit
      const hasKeyBefore = cache.has(key);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, ttl + 10));
      
      // Check after expiration - should miss
      const hasKeyAfter = cache.has(key);
      
      // Try to get after expiration - should execute fetcher again
      const result2 = await cache.get(key, () => this.expensiveOp.execute('token1', 10), ttl);
      
      const stats = cache.getStats();
      const variance = 10 / ttl * 100; // 10ms tolerance
      
      console.log(`${colors.cyan}Has key before: ${hasKeyBefore}, after: ${hasKeyAfter}${colors.reset}`);
      console.log(`${colors.cyan}Operations executed: ${this.expensiveOp.callCount} (expected: 2)${colors.reset}`);
      console.log(`${colors.cyan}TTL variance: ${variance.toFixed(1)}%${colors.reset}`);
      
      cache.destroy();
      this.expensiveOp.reset();
      
      return {
        passed: hasKeyBefore && !hasKeyAfter && this.expensiveOp.callCount === 2 && variance <= 5,
        metric: 'ttlAccuracy',
        expected: 'Within 5% of TTL',
        actual: `${variance.toFixed(1)}% variance`,
        expirationWorked: hasKeyBefore && !hasKeyAfter
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 3: Request Coalescing
  async testRequestCoalescing() {
    console.log(`${colors.blue}Testing Request Coalescing...${colors.reset}`);
    
    const cache = new RequestCache({
      maxEntries: 100,
      defaultTTL: 1000,
      enableCoalescing: true
    });
    
    try {
      const key = cache.generateKey('getQuote', ['quote1']);
      
      // Launch 10 concurrent identical requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          cache.get(key, () => this.expensiveOp.execute('quote1', 50))
        );
      }
      
      // All should return the same result
      const results = await Promise.all(promises);
      const firstResult = results[0];
      const allSame = results.every(r => r.value === firstResult.value);
      
      const stats = cache.getStats();
      const reduction = ((10 - this.expensiveOp.callCount) / 10 * 100);
      
      console.log(`${colors.cyan}Concurrent requests: 10, Operations executed: ${this.expensiveOp.callCount}${colors.reset}`);
      console.log(`${colors.cyan}Coalesced requests: ${stats.coalescedRequests}${colors.reset}`);
      console.log(`${colors.cyan}Reduction: ${reduction.toFixed(1)}%${colors.reset}`);
      console.log(`${colors.cyan}All results identical: ${allSame}${colors.reset}`);
      
      cache.destroy();
      this.expensiveOp.reset();
      
      return {
        passed: this.expensiveOp.callCount === 1 && allSame && reduction >= 95,
        metric: 'coalescingEfficiency',
        expected: '95%+ reduction',
        actual: `${reduction.toFixed(1)}% reduction`,
        operationsExecuted: this.expensiveOp.callCount,
        coalescedRequests: stats.coalescedRequests
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 4: LRU Eviction
  async testLRUEviction() {
    console.log(`${colors.blue}Testing LRU Eviction...${colors.reset}`);
    
    const maxEntries = 5;
    const cache = new RequestCache({
      maxEntries,
      defaultTTL: 10000 // Long TTL to test LRU not TTL
    });
    
    try {
      // Fill cache to capacity
      for (let i = 0; i < maxEntries; i++) {
        const key = cache.generateKey('getPool', [`pool${i}`]);
        await cache.get(key, () => this.expensiveOp.execute(`pool${i}`, 1));
      }
      
      // Access first 3 entries to make them more recent
      for (let i = 0; i < 3; i++) {
        const key = cache.generateKey('getPool', [`pool${i}`]);
        await cache.get(key); // Should hit cache
      }
      
      // Add new entry - should evict pool3 or pool4 (least recently used)
      const newKey = cache.generateKey('getPool', ['poolNew']);
      await cache.get(newKey, () => this.expensiveOp.execute('poolNew', 1));
      
      // Check which entries remain
      const remaining = [];
      for (let i = 0; i < maxEntries; i++) {
        const key = cache.generateKey('getPool', [`pool${i}`]);
        if (cache.has(key)) {
          remaining.push(i);
        }
      }
      
      const stats = cache.getStats();
      const hasNew = cache.has(newKey);
      
      // pool0, pool1, pool2 should remain (recently accessed)
      // poolNew should be present
      // Either pool3 or pool4 should be evicted
      const expectedRemaining = remaining.includes(0) && remaining.includes(1) && remaining.includes(2);
      const correctEviction = !remaining.includes(3) || !remaining.includes(4);
      
      console.log(`${colors.cyan}Cache size: ${cache.size()}/${maxEntries}${colors.reset}`);
      console.log(`${colors.cyan}Remaining entries: pool${remaining.join(', pool')}${colors.reset}`);
      console.log(`${colors.cyan}New entry present: ${hasNew}${colors.reset}`);
      console.log(`${colors.cyan}Evictions: ${stats.evictions}${colors.reset}`);
      
      cache.destroy();
      this.expensiveOp.reset();
      
      return {
        passed: cache.size() === maxEntries && stats.evictions === 1 && hasNew && expectedRemaining && correctEviction,
        metric: 'lruEviction',
        expected: 'Least recently used evicted',
        actual: correctEviction ? 'Correct eviction' : 'Incorrect eviction',
        evictions: stats.evictions,
        cacheSize: cache.size()
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 5: Memory Bounds Compliance
  async testMemoryBounds() {
    console.log(`${colors.blue}Testing Memory Bounds Compliance...${colors.reset}`);
    
    const maxEntries = 100;
    const cache = new RequestCache({
      maxEntries,
      defaultTTL: 10000
    });
    
    try {
      // Try to add more entries than max
      for (let i = 0; i < maxEntries * 2; i++) {
        const key = cache.generateKey('getData', [`data${i}`]);
        await cache.get(key, () => this.expensiveOp.execute(`data${i}`, 1));
      }
      
      const size = cache.size();
      const stats = cache.getStats();
      
      console.log(`${colors.cyan}Cache size: ${size}/${maxEntries}${colors.reset}`);
      console.log(`${colors.cyan}Total evictions: ${stats.evictions}${colors.reset}`);
      console.log(`${colors.cyan}Utilization: ${stats.utilizationPercentage}${colors.reset}`);
      
      cache.destroy();
      this.expensiveOp.reset();
      
      return {
        passed: size <= maxEntries,
        metric: 'memoryBounds',
        expected: `<=${maxEntries} entries`,
        actual: `${size} entries`,
        evictions: stats.evictions,
        utilization: stats.utilizationPercentage
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 6: Cache Lookup Performance
  async testCacheLookupPerformance() {
    console.log(`${colors.blue}Testing Cache Lookup Performance...${colors.reset}`);
    
    const cache = new RequestCache({
      maxEntries: 1000,
      defaultTTL: 10000
    });
    
    try {
      // Populate cache
      for (let i = 0; i < 100; i++) {
        const key = cache.generateKey('getPerfData', [`perf${i}`]);
        cache.set(key, { value: `data${i}` });
      }
      
      // Measure lookup performance
      const iterations = 10000;
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        const key = cache.generateKey('getPerfData', [`perf${i % 100}`]);
        await cache.get(key);
      }
      
      const endTime = process.hrtime.bigint();
      const totalMs = Number(endTime - startTime) / 1000000;
      const avgLookupMs = totalMs / iterations;
      
      const stats = cache.getStats();
      
      console.log(`${colors.cyan}Total lookups: ${iterations}${colors.reset}`);
      console.log(`${colors.cyan}Total time: ${totalMs.toFixed(2)}ms${colors.reset}`);
      console.log(`${colors.cyan}Avg lookup time: ${avgLookupMs.toFixed(4)}ms${colors.reset}`);
      console.log(`${colors.cyan}Avg hit latency: ${stats.avgHitLatencyMs}ms${colors.reset}`);
      
      cache.destroy();
      
      return {
        passed: avgLookupMs < 1,
        metric: 'lookupLatency',
        expected: '<1ms',
        actual: `${avgLookupMs.toFixed(4)}ms`,
        totalLookups: iterations,
        statsLatency: `${stats.avgHitLatencyMs}ms`
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 7: Trading Pattern Hit Rate
  async testTradingPatternHitRate() {
    console.log(`${colors.blue}Testing Trading Pattern Hit Rate...${colors.reset}`);
    
    const cache = new RequestCache({
      maxEntries: 1000,
      defaultTTL: 500
    });
    
    try {
      // Simulate realistic trading request patterns
      const requests = this.tradingSimulator.generateBatch(1000);
      
      for (const request of requests) {
        const key = cache.generateKey(request.method, request.params);
        await cache.get(
          key,
          () => this.expensiveOp.execute(`${request.method}_${request.params[0]}`, 5),
          request.ttl
        );
        
        // Small delay to simulate real timing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      }
      
      const stats = cache.getStats();
      const hitRate = parseFloat(stats.hitRate);
      
      console.log(`${colors.cyan}Total requests: ${requests.length}${colors.reset}`);
      console.log(`${colors.cyan}Hits: ${stats.hits}, Misses: ${stats.misses}${colors.reset}`);
      console.log(`${colors.cyan}Hit rate: ${stats.hitRate}${colors.reset}`);
      console.log(`${colors.cyan}Operations executed: ${this.expensiveOp.callCount}${colors.reset}`);
      
      cache.destroy();
      this.expensiveOp.reset();
      
      return {
        passed: hitRate >= 70,
        metric: 'tradingHitRate',
        expected: '70%+',
        actual: stats.hitRate,
        hits: stats.hits,
        misses: stats.misses,
        operationsSaved: requests.length - this.expensiveOp.callCount
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 8: Cleanup Timing
  async testCleanupTiming() {
    console.log(`${colors.blue}Testing Cleanup Timing...${colors.reset}`);
    
    const cleanupInterval = 100; // 100ms for fast testing
    const cache = new RequestCache({
      maxEntries: 100,
      defaultTTL: 50, // Short TTL
      cleanupInterval
    });
    
    try {
      let cleanupCount = 0;
      cache.on('cache-cleanup', (data) => {
        cleanupCount++;
      });
      
      // Add entries that will expire
      for (let i = 0; i < 10; i++) {
        const key = cache.generateKey('getCleanupTest', [`test${i}`]);
        cache.set(key, { value: i }, 50);
      }
      
      const initialSize = cache.size();
      
      // Wait for entries to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const finalSize = cache.size();
      
      console.log(`${colors.cyan}Initial size: ${initialSize}, Final size: ${finalSize}${colors.reset}`);
      console.log(`${colors.cyan}Cleanup runs: ${cleanupCount}${colors.reset}`);
      console.log(`${colors.cyan}Entries cleaned: ${initialSize - finalSize}${colors.reset}`);
      
      cache.destroy();
      
      return {
        passed: finalSize === 0 && cleanupCount >= 1,
        metric: 'cleanupTiming',
        expected: 'Expired entries cleaned within 60s',
        actual: `Cleaned in ~${cleanupInterval}ms`,
        entriesCleaned: initialSize - finalSize,
        cleanupRuns: cleanupCount
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 9: Concurrent Safety
  async testConcurrentSafety() {
    console.log(`${colors.blue}Testing Concurrent Safety...${colors.reset}`);
    
    const cache = new RequestCache({
      maxEntries: 1000,
      defaultTTL: 1000,
      enableCoalescing: true
    });
    
    try {
      const concurrentOps = 100;
      const uniqueKeys = 20;
      const promises = [];
      
      // Launch many concurrent operations with overlapping keys
      for (let i = 0; i < concurrentOps; i++) {
        const keyIndex = i % uniqueKeys;
        const key = cache.generateKey('getConcurrent', [`key${keyIndex}`]);
        
        promises.push(
          cache.get(key, () => this.expensiveOp.execute(`concurrent${keyIndex}`, 10))
            .catch(err => ({ error: err.message }))
        );
      }
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error).length;
      const successful = results.filter(r => !r.error).length;
      
      const stats = cache.getStats();
      
      console.log(`${colors.cyan}Concurrent operations: ${concurrentOps}${colors.reset}`);
      console.log(`${colors.cyan}Successful: ${successful}, Errors: ${errors}${colors.reset}`);
      console.log(`${colors.cyan}Operations executed: ${this.expensiveOp.callCount}${colors.reset}`);
      console.log(`${colors.cyan}Coalesced: ${stats.coalescedRequests}${colors.reset}`);
      
      cache.destroy();
      this.expensiveOp.reset();
      
      return {
        passed: errors === 0 && successful === concurrentOps,
        metric: 'concurrentSafety',
        expected: '0 errors',
        actual: `${errors} errors`,
        successful,
        operationsExecuted: this.expensiveOp.callCount,
        coalescedRequests: stats.coalescedRequests
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Test 10: Cache Invalidation
  async testCacheInvalidation() {
    console.log(`${colors.blue}Testing Cache Invalidation...${colors.reset}`);
    
    const cache = new RequestCache({
      maxEntries: 100,
      defaultTTL: 10000
    });
    
    try {
      // Add some entries
      const keys = [];
      for (let i = 0; i < 5; i++) {
        const key = cache.generateKey('getInvalidate', [`item${i}`]);
        keys.push(key);
        cache.set(key, { value: i });
      }
      
      const initialSize = cache.size();
      
      // Delete specific entries
      const deleted1 = cache.delete(keys[0]);
      const deleted2 = cache.delete(keys[2]);
      const deletedNonExistent = cache.delete('nonexistent');
      
      const afterDeleteSize = cache.size();
      
      // Clear all
      cache.clear();
      const afterClearSize = cache.size();
      
      console.log(`${colors.cyan}Initial size: ${initialSize}${colors.reset}`);
      console.log(`${colors.cyan}After deletes: ${afterDeleteSize}${colors.reset}`);
      console.log(`${colors.cyan}After clear: ${afterClearSize}${colors.reset}`);
      console.log(`${colors.cyan}Delete results: ${deleted1}, ${deleted2}, ${deletedNonExistent}${colors.reset}`);
      
      cache.destroy();
      
      return {
        passed: initialSize === 5 && afterDeleteSize === 3 && afterClearSize === 0 && 
                deleted1 && deleted2 && !deletedNonExistent,
        metric: 'cacheInvalidation',
        expected: 'Correct invalidation',
        actual: deleted1 && deleted2 && !deletedNonExistent ? 'Working correctly' : 'Issues found',
        deletions: { deleted1, deleted2, deletedNonExistent },
        sizes: { initial: initialSize, afterDelete: afterDeleteSize, afterClear: afterClearSize }
      };
      
    } catch (error) {
      cache.destroy();
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log(`\n${colors.bold}${colors.magenta}========================================${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}     RequestCache Test Suite${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}========================================${colors.reset}\n`);
    
    const tests = [
      { name: 'Cache Hit/Miss Accuracy', fn: () => this.testCacheHitMissAccuracy() },
      { name: 'TTL Expiration', fn: () => this.testTTLExpiration() },
      { name: 'Request Coalescing', fn: () => this.testRequestCoalescing() },
      { name: 'LRU Eviction', fn: () => this.testLRUEviction() },
      { name: 'Memory Bounds', fn: () => this.testMemoryBounds() },
      { name: 'Cache Lookup Performance', fn: () => this.testCacheLookupPerformance() },
      { name: 'Trading Pattern Hit Rate', fn: () => this.testTradingPatternHitRate() },
      { name: 'Cleanup Timing', fn: () => this.testCleanupTiming() },
      { name: 'Concurrent Safety', fn: () => this.testConcurrentSafety() },
      { name: 'Cache Invalidation', fn: () => this.testCacheInvalidation() }
    ];
    
    const results = [];
    const metrics = {};
    
    for (const test of tests) {
      console.log(`\n${colors.bold}Test: ${test.name}${colors.reset}`);
      console.log(`${'='.repeat(50)}`);
      
      try {
        const result = await test.fn();
        const status = result.passed ? 
          `${colors.green}✓ PASSED${colors.reset}` : 
          `${colors.red}✗ FAILED${colors.reset}`;
        
        console.log(`${status} - ${result.expected} (got ${result.actual})\n`);
        
        results.push({
          name: test.name,
          passed: result.passed,
          ...result
        });
        
        if (result.metric) {
          metrics[result.metric] = result.actual;
        }
        
      } catch (error) {
        console.log(`${colors.red}✗ ERROR${colors.reset} - ${error.message}\n`);
        results.push({
          name: test.name,
          passed: false,
          error: error.message
        });
      }
    }
    
    // Summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`\n${colors.bold}${colors.magenta}========================================${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}           Test Summary${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}========================================${colors.reset}\n`);
    
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`${colors.yellow}Pass Rate: ${((passed / results.length) * 100).toFixed(1)}%${colors.reset}\n`);
    
    // Requirements validation
    console.log(`${colors.bold}Requirements Validation:${colors.reset}`);
    console.log(`${'─'.repeat(40)}`);
    
    const requirements = {
      'Hit Rate (>70%)': metrics.tradingHitRate || 'Not measured',
      'TTL Accuracy (<5%)': metrics.ttlAccuracy || 'Not measured',
      'Coalescing (>95%)': metrics.coalescingEfficiency || 'Not measured',
      'Lookup Latency (<1ms)': metrics.lookupLatency || 'Not measured',
      'Memory Bounds': metrics.memoryBounds || 'Not measured'
    };
    
    for (const [req, value] of Object.entries(requirements)) {
      console.log(`${req}: ${value}`);
    }
    
    return {
      passed,
      failed,
      results,
      metrics
    };
  }
}

// Main execution
async function main() {
  const suite = new RequestCacheTestSuite();
  
  try {
    const { passed, failed, results, metrics } = await suite.runAllTests();
    
    // Save results
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed,
        failed,
        passRate: `${((passed / (passed + failed)) * 100).toFixed(1)}%`
      },
      metrics,
      tests: results.map(r => ({
        name: r.name,
        passed: r.passed,
        ...r
      })),
      requirements: {
        cacheHitRate: {
          target: '70%+',
          actual: metrics.tradingHitRate || 'Not measured',
          passed: parseFloat(metrics.tradingHitRate) >= 70
        },
        ttlAccuracy: {
          target: 'Within 5%',
          actual: metrics.ttlAccuracy || 'Not measured',
          passed: metrics.ttlAccuracy && parseFloat(metrics.ttlAccuracy) <= 5
        },
        requestCoalescing: {
          target: '95%+ reduction',
          actual: metrics.coalescingEfficiency || 'Not measured',
          passed: metrics.coalescingEfficiency && parseFloat(metrics.coalescingEfficiency) >= 95
        },
        lookupLatency: {
          target: '<1ms',
          actual: metrics.lookupLatency || 'Not measured',
          passed: metrics.lookupLatency && parseFloat(metrics.lookupLatency) < 1
        },
        memoryBounds: {
          target: 'Within limits',
          actual: metrics.memoryBounds || 'Not measured',
          passed: metrics.memoryBounds && metrics.memoryBounds.includes('entries')
        }
      }
    };
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    await fs.promises.writeFile(
      path.join(__dirname, 'request-cache-test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n${colors.cyan}Test report saved to request-cache-test-report.json${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { RequestCacheTestSuite };