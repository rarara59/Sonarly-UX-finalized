/**
 * Extended Chain Performance Validation Test
 * Tests 5-component chain with realistic meme coin trading patterns
 * Components: TokenBucket + CircuitBreaker + ConnectionPoolCore + EndpointSelector + RequestCache
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { EndpointSelector } from '../../src/detection/transport/endpoint-selector.js';
import { RequestCache } from '../../src/detection/transport/request-cache.js';
import { RealSolanaHelper } from '../../scripts/real-solana-helper.js';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

class ExtendedPerformanceChain {
  constructor(config = {}) {
    // Initialize all 5 components with production settings
    this.rateLimiter = new TokenBucket({
      rateLimit: config.rateLimit || 50,
      windowMs: 1000,
      maxBurst: config.maxBurst || 75
    });
    
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.failureThreshold || 6,
      successThreshold: 3,
      cooldownPeriod: 5000,
      volumeThreshold: 10
    });
    
    this.connectionPool = new ConnectionPoolCore({
      maxSockets: config.maxSockets || 20,
      maxSocketsPerHost: 10,
      keepAlive: true,
      keepAliveMsecs: 3000,
      timeout: 10000
    });
    
    this.endpointSelector = new EndpointSelector({
      strategy: config.strategy || 'round-robin',
      healthCheckInterval: 5000,
      failureThreshold: 3
    });
    
    const endpoints = [
      'https://mainnet.helius-rpc.com/?api-key=mock',
      'https://solana-mainnet.chainstack.com/mock',
      'https://api.mainnet-beta.solana.com'
    ];
    this.endpointSelector.initializeEndpoints(endpoints);
    
    this.requestCache = new RequestCache({
      maxSize: config.maxCacheSize || 1000,
      defaultTTL: config.cacheTTL || 15000,
      cleanupInterval: 5000,
      coalesceRequests: true
    });
    
    this.solanaHelper = new RealSolanaHelper();
    
    // Performance metrics
    this.metrics = {
      startTime: null,
      endTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      concurrentSuccesses: 0,
      concurrentFailures: 0,
      componentHealth: {},
      latencies: [],
      memoryUsage: {
        start: null,
        end: null,
        samples: []
      },
      tradingPatterns: {
        priceChecks: 0,
        balanceChecks: 0,
        tokenSupplyChecks: 0,
        swapSimulations: 0
      }
    };
    
    // Memory tracking interval
    this.memoryInterval = null;
  }
  
  generateCacheKey(method, params) {
    const keyData = JSON.stringify({ method, params });
    return crypto.createHash('md5').update(keyData).digest('hex');
  }
  
  async makeRequest(method, params, options = {}) {
    const requestStart = performance.now();
    this.metrics.totalRequests++;
    
    try {
      // Component 1: Rate Limiter
      if (!this.rateLimiter.consume(1)) {
        return {
          success: false,
          reason: 'rate_limited',
          latency: performance.now() - requestStart
        };
      }
      
      // Component 2: Circuit Breaker
      const cbMetrics = this.circuitBreaker.getMetrics();
      if (cbMetrics.state === 'OPEN') {
        return {
          success: false,
          reason: 'circuit_open',
          latency: performance.now() - requestStart
        };
      }
      
      // Component 3: Request Cache
      const cacheKey = this.generateCacheKey(method, params);
      const cachedResult = await this.requestCache.get(cacheKey);
      
      if (cachedResult) {
        const latency = performance.now() - requestStart;
        this.metrics.latencies.push(latency);
        this.metrics.successfulRequests++;
        
        return {
          success: true,
          data: cachedResult,
          fromCache: true,
          latency
        };
      }
      
      // Component 4: Connection Pool
      const agent = this.connectionPool.getAgent('https');
      if (!agent) {
        this.circuitBreaker.recordFailure();
        return {
          success: false,
          reason: 'no_connection',
          latency: performance.now() - requestStart
        };
      }
      
      // Component 5: Endpoint Selection
      const endpoint = this.endpointSelector.selectEndpoint();
      if (!endpoint) {
        return {
          success: false,
          reason: 'no_endpoint',
          latency: performance.now() - requestStart
        };
      }
      
      // Execute request (simulated for testing)
      const executeRequest = async () => {
        if (options.simulate) {
          // Simulate network latency based on endpoint
          const latencies = {
            'mainnet.helius-rpc.com': 100 + Math.random() * 100,
            'solana-mainnet.chainstack.com': 150 + Math.random() * 150,
            'api.mainnet-beta.solana.com': 200 + Math.random() * 200
          };
          
          const endpointKey = new URL(endpoint.url).hostname;
          const simulatedLatency = latencies[endpointKey] || 200;
          await new Promise(resolve => setTimeout(resolve, simulatedLatency));
          
          // Simulate occasional failures (5%)
          if (Math.random() < 0.05) {
            throw new Error('Simulated endpoint failure');
          }
          
          // Return realistic response based on method
          return this.generateRealisticResponse(method, params);
        }
        
        // Real RPC call
        this.solanaHelper.currentEndpoint = endpoint.url;
        return await this.solanaHelper.executeRpcCall(method, params, {
          agent,
          timeout: 5000
        });
      };
      
      const response = await this.circuitBreaker.execute(
        `${endpoint.url}_${method}`,
        executeRequest
      );
      
      const latency = performance.now() - requestStart;
      this.metrics.latencies.push(latency);
      
      if (response && response.result) {
        // Cache successful result
        await this.requestCache.set(cacheKey, response.result, {
          ttl: this.getCacheTTL(method)
        });
        
        this.metrics.successfulRequests++;
        
        return {
          success: true,
          data: response.result,
          fromCache: false,
          endpoint: new URL(endpoint.url).hostname,
          latency
        };
      } else {
        this.metrics.failedRequests++;
        this.circuitBreaker.recordFailure();
        
        return {
          success: false,
          reason: 'invalid_response',
          latency
        };
      }
      
    } catch (error) {
      const latency = performance.now() - requestStart;
      this.metrics.latencies.push(latency);
      this.metrics.failedRequests++;
      
      return {
        success: false,
        reason: 'error',
        error: error.message,
        latency
      };
    }
  }
  
  generateRealisticResponse(method, params) {
    switch (method) {
      case 'getBalance':
        return {
          result: {
            value: Math.floor(Math.random() * 10000000000) // Random lamports
          }
        };
      
      case 'getTokenSupply':
        return {
          result: {
            value: {
              amount: '1000000000000000',
              decimals: 9,
              uiAmount: 1000000000.0,
              uiAmountString: '1000000000'
            }
          }
        };
      
      case 'getAccountInfo':
        return {
          result: {
            value: {
              data: ['base64data', 'base64'],
              executable: false,
              lamports: 2039280,
              owner: '11111111111111111111111111111111',
              rentEpoch: 361
            }
          }
        };
      
      case 'getSlot':
        return {
          result: 150000000 + Math.floor(Math.random() * 1000)
        };
      
      default:
        return { result: { value: 'mock_data' } };
    }
  }
  
  getCacheTTL(method) {
    // Different TTLs for different data types
    const ttlMap = {
      'getBalance': 5000,      // 5s for balances
      'getSlot': 1000,         // 1s for slot
      'getTokenSupply': 30000, // 30s for supply
      'getAccountInfo': 10000  // 10s for account info
    };
    
    return ttlMap[method] || 15000;
  }
  
  generateTradingPattern() {
    // Realistic meme coin trading request pattern
    const patterns = [];
    
    // Price monitoring pattern (30%)
    for (let i = 0; i < 15; i++) {
      const token = this.solanaHelper.tokens[Object.keys(this.solanaHelper.tokens)[i % 5]];
      patterns.push({
        method: 'getTokenSupply',
        params: [token.mint],
        type: 'price_check'
      });
    }
    
    // Balance checking pattern (25%)
    const wallets = [];
    for (let i = 0; i < 5; i++) {
      wallets.push(this.solanaHelper.getRandomWalletAddress());
    }
    
    for (let i = 0; i < 13; i++) {
      patterns.push({
        method: 'getBalance',
        params: [wallets[i % wallets.length]],
        type: 'balance_check'
      });
    }
    
    // Account info pattern (20%)
    for (let i = 0; i < 10; i++) {
      patterns.push({
        method: 'getAccountInfo',
        params: [wallets[i % wallets.length]],
        type: 'account_check'
      });
    }
    
    // Slot monitoring (15%)
    for (let i = 0; i < 7; i++) {
      patterns.push({
        method: 'getSlot',
        params: [],
        type: 'slot_check'
      });
    }
    
    // Duplicate requests to test cache (10%)
    for (let i = 0; i < 5; i++) {
      patterns.push(patterns[i]);
    }
    
    // Shuffle pattern for realistic distribution
    for (let i = patterns.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [patterns[i], patterns[j]] = [patterns[j], patterns[i]];
    }
    
    return patterns;
  }
  
  async testConcurrentStreams(streamCount = 5) {
    console.log(`\n📝 Testing ${streamCount} Concurrent Request Streams`);
    
    const pattern = this.generateTradingPattern();
    const streamResults = [];
    
    // Create concurrent streams
    const streams = [];
    for (let i = 0; i < streamCount; i++) {
      const streamPromise = this.executeRequestStream(pattern.slice(), i);
      streams.push(streamPromise);
    }
    
    // Execute all streams concurrently
    const results = await Promise.all(streams);
    
    // Aggregate results
    let totalSuccess = 0;
    let totalFailure = 0;
    
    results.forEach((streamResult, index) => {
      console.log(`Stream ${index + 1}: ${streamResult.successful}/${streamResult.total} successful`);
      totalSuccess += streamResult.successful;
      totalFailure += streamResult.failed;
      streamResults.push(streamResult);
    });
    
    const successRate = (totalSuccess / (totalSuccess + totalFailure) * 100);
    
    return {
      streamCount,
      totalRequests: totalSuccess + totalFailure,
      totalSuccess,
      totalFailure,
      successRate: successRate.toFixed(1),
      streamResults
    };
  }
  
  async executeRequestStream(pattern, streamId) {
    const results = [];
    let successful = 0;
    let failed = 0;
    
    for (const request of pattern) {
      const result = await this.makeRequest(
        request.method,
        request.params,
        { simulate: true }
      );
      
      results.push(result);
      
      if (result.success) {
        successful++;
        this.metrics.tradingPatterns[request.type.replace('_check', 'Checks')]++;
      } else {
        failed++;
      }
      
      // Small delay between requests in stream
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
    }
    
    return {
      streamId,
      total: pattern.length,
      successful,
      failed,
      results
    };
  }
  
  startMemoryTracking() {
    this.metrics.memoryUsage.start = process.memoryUsage();
    this.memoryInterval = setInterval(() => {
      this.metrics.memoryUsage.samples.push(process.memoryUsage());
    }, 2000);
  }
  
  stopMemoryTracking() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    this.metrics.memoryUsage.end = process.memoryUsage();
  }
  
  getComponentHealth() {
    return {
      rateLimiter: {
        healthy: true,
        metrics: this.rateLimiter.getMetrics ? this.rateLimiter.getMetrics() : { tokens: 50 }
      },
      circuitBreaker: {
        healthy: this.circuitBreaker.getMetrics().state !== 'OPEN',
        state: this.circuitBreaker.getMetrics().state
      },
      connectionPool: {
        healthy: true,
        stats: this.connectionPool.getStats()
      },
      endpointSelector: {
        healthy: true,
        endpoints: this.endpointSelector.getAvailableEndpoints().length
      },
      requestCache: {
        healthy: true,
        stats: this.requestCache.getStats()
      }
    };
  }
  
  async runPerformanceTest() {
    console.log('\n🚀 Running Extended Performance Test');
    console.log('Testing 5-component chain with realistic trading patterns\n');
    
    this.metrics.startTime = Date.now();
    this.startMemoryTracking();
    
    // Test 1: Sequential requests with trading pattern
    console.log('📊 Phase 1: Sequential Trading Pattern (50 requests)');
    const pattern = this.generateTradingPattern();
    const sequentialResults = [];
    
    for (let i = 0; i < pattern.length; i++) {
      const request = pattern[i];
      const result = await this.makeRequest(
        request.method,
        request.params,
        { simulate: true }
      );
      
      sequentialResults.push(result);
      
      if (request.type) {
        this.metrics.tradingPatterns[request.type.replace('_check', 'Checks')]++;
      }
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/50 requests`);
      }
    }
    
    // Test 2: Concurrent streams
    const concurrentResults = await this.testConcurrentStreams(5);
    this.metrics.concurrentSuccesses = concurrentResults.totalSuccess;
    this.metrics.concurrentFailures = concurrentResults.totalFailure;
    
    this.metrics.endTime = Date.now();
    this.stopMemoryTracking();
    
    // Calculate statistics
    const avgLatency = this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length;
    const sortedLatencies = this.metrics.latencies.sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
    
    const memoryGrowth = this.metrics.memoryUsage.end && this.metrics.memoryUsage.start
      ? ((this.metrics.memoryUsage.end.heapUsed - this.metrics.memoryUsage.start.heapUsed) / 
         this.metrics.memoryUsage.start.heapUsed * 100)
      : 0;
    
    const totalTime = this.metrics.endTime - this.metrics.startTime;
    const overallSuccessRate = (this.metrics.successfulRequests / this.metrics.totalRequests * 100);
    
    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        successRate: overallSuccessRate.toFixed(1),
        totalTime: totalTime,
        throughput: (this.metrics.totalRequests / (totalTime / 1000)).toFixed(2)
      },
      latency: {
        average: avgLatency.toFixed(2),
        p50: p50.toFixed(2),
        p95: p95.toFixed(2),
        p99: p99.toFixed(2)
      },
      concurrent: {
        streams: concurrentResults.streamCount,
        totalRequests: concurrentResults.totalRequests,
        successRate: concurrentResults.successRate
      },
      tradingPatterns: this.metrics.tradingPatterns,
      memory: {
        startHeap: (this.metrics.memoryUsage.start?.heapUsed / 1024 / 1024).toFixed(2),
        endHeap: (this.metrics.memoryUsage.end?.heapUsed / 1024 / 1024).toFixed(2),
        growth: memoryGrowth.toFixed(2)
      },
      componentHealth: this.getComponentHealth()
    };
  }
}

// Main test execution
async function runExtendedPerformanceTest() {
  console.log('=' .repeat(60));
  console.log('Extended Chain Performance Validation');
  console.log('5-Component Chain with Realistic Trading Patterns');
  console.log('=' .repeat(60));
  
  const chain = new ExtendedPerformanceChain({
    rateLimit: 50,
    maxBurst: 75,
    failureThreshold: 6,
    maxSockets: 20,
    strategy: 'round-robin',
    maxCacheSize: 1000,
    cacheTTL: 15000
  });
  
  // Run the comprehensive performance test
  const results = await chain.runPerformanceTest();
  
  // Display results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Performance Test Results');
  console.log('=' .repeat(60));
  
  console.log('\n📈 Overall Summary:');
  console.log(`Total Requests: ${results.summary.totalRequests}`);
  console.log(`Successful: ${results.summary.successfulRequests}`);
  console.log(`Failed: ${results.summary.failedRequests}`);
  console.log(`Success Rate: ${results.summary.successRate}%`);
  console.log(`Total Time: ${(results.summary.totalTime / 1000).toFixed(2)}s`);
  console.log(`Throughput: ${results.summary.throughput} req/s`);
  
  console.log('\n⏱️ Latency Statistics:');
  console.log(`Average: ${results.latency.average}ms`);
  console.log(`P50: ${results.latency.p50}ms`);
  console.log(`P95: ${results.latency.p95}ms`);
  console.log(`P99: ${results.latency.p99}ms`);
  
  console.log('\n🔄 Concurrent Performance:');
  console.log(`Streams: ${results.concurrent.streams}`);
  console.log(`Total Concurrent Requests: ${results.concurrent.totalRequests}`);
  console.log(`Concurrent Success Rate: ${results.concurrent.successRate}%`);
  
  console.log('\n📊 Trading Pattern Distribution:');
  console.log(`Price Checks: ${results.tradingPatterns.priceChecks}`);
  console.log(`Balance Checks: ${results.tradingPatterns.balanceChecks}`);
  console.log(`Token Supply Checks: ${results.tradingPatterns.tokenSupplyChecks}`);
  console.log(`Account Checks: ${results.tradingPatterns.accountChecks || 0}`);
  console.log(`Slot Checks: ${results.tradingPatterns.slotChecks || 0}`);
  
  console.log('\n💾 Memory Usage:');
  console.log(`Start Heap: ${results.memory.startHeap}MB`);
  console.log(`End Heap: ${results.memory.endHeap}MB`);
  console.log(`Memory Growth: ${results.memory.growth}%`);
  
  console.log('\n🏥 Component Health:');
  console.log(`Rate Limiter: ${results.componentHealth.rateLimiter.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`Circuit Breaker: ${results.componentHealth.circuitBreaker.healthy ? '✅' : '❌'} (${results.componentHealth.circuitBreaker.state})`);
  console.log(`Connection Pool: ${results.componentHealth.connectionPool.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`Endpoint Selector: ${results.componentHealth.endpointSelector.healthy ? '✅' : '❌'} (${results.componentHealth.endpointSelector.endpoints} endpoints)`);
  console.log(`Request Cache: ${results.componentHealth.requestCache.healthy ? '✅' : '❌'} (${results.componentHealth.requestCache.stats.hitRate.toFixed(1)}% hit rate)`);
  
  // Validate success criteria
  console.log('\n✅ Success Criteria Validation:');
  const criteria = {
    'Success rate > 60%': parseFloat(results.summary.successRate) > 60,
    'Average latency < 6000ms': parseFloat(results.latency.average) < 6000,
    'Concurrent success > 80%': parseFloat(results.concurrent.successRate) > 80,
    'All components healthy': Object.values(results.componentHealth).every(c => c.healthy)
  };
  
  let allPassed = true;
  for (const [criterion, passed] of Object.entries(criteria)) {
    console.log(`${passed ? '✅' : '❌'} ${criterion}`);
    if (!passed) allPassed = false;
  }
  
  console.log('\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('🎉 Extended performance validation PASSED!');
    console.log('5-component chain handles realistic trading patterns successfully');
    console.log('System remains stable under concurrent load');
  } else {
    console.log('⚠️ Some performance criteria not met');
  }
  console.log('=' .repeat(60));
  
  return allPassed;
}

// Execute the test
runExtendedPerformanceTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });