/**
 * Foundation Chain Performance Test
 * Tests 3-component chain performance under real network load
 * Components: TokenBucket + CircuitBreaker + ConnectionPoolCore
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { RealSolanaHelper } from '../../scripts/real-solana-helper.js';
import { performance } from 'perf_hooks';

class FoundationChain {
  constructor(config = {}) {
    // Initialize with production-like settings
    this.rateLimiter = new TokenBucket({
      rateLimit: config.rateLimit || 50,
      windowMs: 1000,
      maxBurst: config.maxBurst || 75
    });
    
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.failureThreshold || 6,
      successThreshold: 3,
      cooldownPeriod: 5000,
      volumeThreshold: 10,
      errorThresholdPercentage: 50
    });
    
    this.connectionPool = new ConnectionPoolCore({
      maxSockets: config.maxSockets || 20,
      maxSocketsPerHost: 10,
      keepAlive: true,
      keepAliveMsecs: 3000,
      timeout: 10000
    });
    
    this.solanaHelper = new RealSolanaHelper();
    
    // Performance tracking
    this.metrics = {
      startTime: null,
      endTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      circuitBreakerRejections: 0,
      latencies: [],
      componentOverhead: {
        rateLimiter: [],
        circuitBreaker: [],
        connectionPool: []
      },
      memoryUsage: {
        start: null,
        end: null,
        samples: []
      },
      endpoints: {
        helius: { success: 0, failed: 0, latencies: [] },
        solana: { success: 0, failed: 0, latencies: [] },
        custom: { success: 0, failed: 0, latencies: [] }
      }
    };
    
    // Track memory usage
    this.memoryInterval = null;
  }
  
  startMemoryTracking() {
    this.metrics.memoryUsage.start = process.memoryUsage();
    this.memoryInterval = setInterval(() => {
      this.metrics.memoryUsage.samples.push(process.memoryUsage());
    }, 1000);
  }
  
  stopMemoryTracking() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    this.metrics.memoryUsage.end = process.memoryUsage();
  }
  
  async makeRequest(method, params, options = {}) {
    const requestStart = performance.now();
    const componentTimings = {};
    
    this.metrics.totalRequests++;
    
    const endpoint = options.endpoint || 'helius';
    
    try {
      // Step 1: Rate Limiter
      const rateLimiterStart = performance.now();
      const canProceed = this.rateLimiter.consume(1);
      componentTimings.rateLimiter = performance.now() - rateLimiterStart;
      this.metrics.componentOverhead.rateLimiter.push(componentTimings.rateLimiter);
      
      if (!canProceed) {
        this.metrics.rateLimitedRequests++;
        return {
          success: false,
          reason: 'rate_limited',
          latency: performance.now() - requestStart
        };
      }
      
      // Step 2: Circuit Breaker Check
      const circuitStart = performance.now();
      const circuitMetrics = this.circuitBreaker.getMetrics();
      componentTimings.circuitBreaker = performance.now() - circuitStart;
      this.metrics.componentOverhead.circuitBreaker.push(componentTimings.circuitBreaker);
      
      if (circuitMetrics.state === 'OPEN') {
        this.metrics.circuitBreakerRejections++;
        return {
          success: false,
          reason: 'circuit_open',
          latency: performance.now() - requestStart
        };
      }
      
      // Step 3: Connection Pool
      const poolStart = performance.now();
      const agent = this.connectionPool.getAgent('https');
      componentTimings.connectionPool = performance.now() - poolStart;
      this.metrics.componentOverhead.connectionPool.push(componentTimings.connectionPool);
      
      if (!agent) {
        this.circuitBreaker.recordFailure();
        return {
          success: false,
          reason: 'no_connection',
          latency: performance.now() - requestStart
        };
      }
      
      // Step 4: Execute Request
      const executeRequest = async () => {
        // Select endpoint
        let rpcEndpoint = this.solanaHelper.endpoints[endpoint];
        if (!rpcEndpoint) {
          rpcEndpoint = this.solanaHelper.endpoints.helius;
        }
        
        // Override endpoint for testing
        this.solanaHelper.currentEndpoint = rpcEndpoint;
        
        const response = await this.solanaHelper.executeRpcCall(method, params, {
          agent,
          timeout: 5000
        });
        
        return response;
      };
      
      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(
        `${endpoint}_${method}`,
        executeRequest
      );
      
      const totalLatency = performance.now() - requestStart;
      this.metrics.latencies.push(totalLatency);
      this.metrics.endpoints[endpoint].latencies.push(totalLatency);
      
      if (response && response.result) {
        this.metrics.successfulRequests++;
        this.metrics.endpoints[endpoint].success++;
        
        return {
          success: true,
          data: response.result,
          latency: totalLatency,
          endpoint,
          componentOverhead: componentTimings
        };
      } else {
        this.metrics.failedRequests++;
        this.metrics.endpoints[endpoint].failed++;
        this.circuitBreaker.recordFailure();
        
        return {
          success: false,
          reason: 'invalid_response',
          latency: totalLatency
        };
      }
      
    } catch (error) {
      const totalLatency = performance.now() - requestStart;
      this.metrics.latencies.push(totalLatency);
      this.metrics.failedRequests++;
      this.metrics.endpoints[endpoint].failed++;
      
      return {
        success: false,
        reason: 'error',
        error: error.message,
        latency: totalLatency
      };
    }
  }
  
  async runPerformanceTest(requestCount = 30) {
    console.log(`\n🚀 Starting Foundation Chain Performance Test`);
    console.log(`Executing ${requestCount} requests through 3-component chain\n`);
    
    this.metrics.startTime = Date.now();
    this.startMemoryTracking();
    
    // Prepare diverse request mix
    const requests = [];
    const methods = [
      { method: 'getHealth', params: [], weight: 0.2 },
      { method: 'getSlot', params: [], weight: 0.2 },
      { method: 'getTokenSupply', params: null, weight: 0.3 },
      { method: 'getBalance', params: null, weight: 0.3 }
    ];
    
    const endpoints = ['helius', 'solana', 'custom'];
    const tokens = Object.keys(this.solanaHelper.tokens);
    
    for (let i = 0; i < requestCount; i++) {
      // Select method
      const rand = Math.random();
      let selectedMethod = methods[0];
      let cumWeight = 0;
      for (const m of methods) {
        cumWeight += m.weight;
        if (rand < cumWeight) {
          selectedMethod = m;
          break;
        }
      }
      
      // Prepare params
      let params = selectedMethod.params;
      if (params === null) {
        if (selectedMethod.method === 'getTokenSupply') {
          const token = tokens[i % tokens.length];
          params = [this.solanaHelper.tokens[token].mint];
        } else if (selectedMethod.method === 'getBalance') {
          params = [this.solanaHelper.getRandomWalletAddress()];
        }
      }
      
      // Select endpoint (rotate through them)
      const endpoint = endpoints[i % endpoints.length];
      
      requests.push({
        method: selectedMethod.method,
        params,
        endpoint
      });
    }
    
    // Execute requests with controlled concurrency
    const results = [];
    const concurrency = 5;
    
    console.log('📊 Executing requests...\n');
    const progressInterval = Math.floor(requestCount / 10);
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(req =>
        this.makeRequest(req.method, req.params, { endpoint: req.endpoint })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Progress indicator
      if ((i + concurrency) % progressInterval === 0) {
        const progress = Math.min(100, Math.round(((i + concurrency) / requestCount) * 100));
        console.log(`Progress: ${progress}% (${Math.min(i + concurrency, requestCount)}/${requestCount})`);
      }
      
      // Small delay between batches
      if (i + concurrency < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.metrics.endTime = Date.now();
    this.stopMemoryTracking();
    
    return this.analyzeResults(results);
  }
  
  analyzeResults(results) {
    const totalTime = this.metrics.endTime - this.metrics.startTime;
    
    // Calculate latency statistics
    const sortedLatencies = this.metrics.latencies.sort((a, b) => a - b);
    const avgLatency = sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length;
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
    
    // Calculate component overhead
    const avgOverhead = {
      rateLimiter: this.calculateAverage(this.metrics.componentOverhead.rateLimiter),
      circuitBreaker: this.calculateAverage(this.metrics.componentOverhead.circuitBreaker),
      connectionPool: this.calculateAverage(this.metrics.componentOverhead.connectionPool)
    };
    
    const totalOverhead = avgOverhead.rateLimiter + avgOverhead.circuitBreaker + avgOverhead.connectionPool;
    
    // Calculate memory growth
    const memoryGrowth = this.metrics.memoryUsage.end && this.metrics.memoryUsage.start
      ? ((this.metrics.memoryUsage.end.heapUsed - this.metrics.memoryUsage.start.heapUsed) / 
         this.metrics.memoryUsage.start.heapUsed * 100)
      : 0;
    
    // Success rate
    const successRate = (this.metrics.successfulRequests / this.metrics.totalRequests * 100);
    
    // Component health check
    const componentHealth = {
      rateLimiter: this.rateLimiter.getMetrics ? this.rateLimiter.getMetrics() : { healthy: true },
      circuitBreaker: this.circuitBreaker.getMetrics(),
      connectionPool: this.connectionPool.getStats()
    };
    
    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        rateLimitedRequests: this.metrics.rateLimitedRequests,
        circuitBreakerRejections: this.metrics.circuitBreakerRejections,
        successRate: successRate.toFixed(1),
        totalTime: totalTime,
        throughput: (this.metrics.totalRequests / (totalTime / 1000)).toFixed(2)
      },
      latency: {
        average: avgLatency.toFixed(2),
        p50: p50.toFixed(2),
        p95: p95.toFixed(2),
        p99: p99.toFixed(2)
      },
      componentOverhead: {
        rateLimiter: avgOverhead.rateLimiter.toFixed(3),
        circuitBreaker: avgOverhead.circuitBreaker.toFixed(3),
        connectionPool: avgOverhead.connectionPool.toFixed(3),
        total: totalOverhead.toFixed(3),
        percentOfAvgLatency: ((totalOverhead / avgLatency) * 100).toFixed(2)
      },
      memory: {
        startHeap: (this.metrics.memoryUsage.start?.heapUsed / 1024 / 1024).toFixed(2),
        endHeap: (this.metrics.memoryUsage.end?.heapUsed / 1024 / 1024).toFixed(2),
        growth: memoryGrowth.toFixed(2)
      },
      endpoints: this.metrics.endpoints,
      componentHealth,
      successCriteria: {
        avgLatencyUnder5s: avgLatency < 5000,
        successRateAbove70: successRate > 70,
        componentsHealthy: this.checkComponentHealth(componentHealth),
        memoryGrowthUnder10: Math.abs(memoryGrowth) < 10
      }
    };
  }
  
  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  checkComponentHealth(health) {
    const rateLimiterHealthy = health.rateLimiter.healthy !== false;
    const circuitBreakerHealthy = health.circuitBreaker.state !== 'OPEN';
    const connectionPoolHealthy = health.connectionPool.activeConnections >= 0;
    
    return rateLimiterHealthy && circuitBreakerHealthy && connectionPoolHealthy;
  }
}

// Main test execution
async function runFoundationPerformanceTest() {
  console.log('=' .repeat(60));
  console.log('Foundation Chain Performance Test');
  console.log('TokenBucket + CircuitBreaker + ConnectionPoolCore');
  console.log('=' .repeat(60));
  
  const chain = new FoundationChain({
    rateLimit: 50,
    maxBurst: 75,
    failureThreshold: 6,
    maxSockets: 20
  });
  
  try {
    // Run the performance test with 30 requests
    const results = await chain.runPerformanceTest(30);
    
    // Display results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Performance Test Results');
    console.log('=' .repeat(60));
    
    console.log('\n📈 Summary:');
    console.log(`Total Requests: ${results.summary.totalRequests}`);
    console.log(`Successful: ${results.summary.successfulRequests}`);
    console.log(`Failed: ${results.summary.failedRequests}`);
    console.log(`Rate Limited: ${results.summary.rateLimitedRequests}`);
    console.log(`Circuit Breaker Rejections: ${results.summary.circuitBreakerRejections}`);
    console.log(`Success Rate: ${results.summary.successRate}%`);
    console.log(`Total Time: ${(results.summary.totalTime / 1000).toFixed(2)}s`);
    console.log(`Throughput: ${results.summary.throughput} req/s`);
    
    console.log('\n⏱️ Latency Statistics:');
    console.log(`Average: ${results.latency.average}ms`);
    console.log(`P50: ${results.latency.p50}ms`);
    console.log(`P95: ${results.latency.p95}ms`);
    console.log(`P99: ${results.latency.p99}ms`);
    
    console.log('\n🔧 Component Overhead:');
    console.log(`Rate Limiter: ${results.componentOverhead.rateLimiter}ms`);
    console.log(`Circuit Breaker: ${results.componentOverhead.circuitBreaker}ms`);
    console.log(`Connection Pool: ${results.componentOverhead.connectionPool}ms`);
    console.log(`Total Overhead: ${results.componentOverhead.total}ms`);
    console.log(`Overhead % of Latency: ${results.componentOverhead.percentOfAvgLatency}%`);
    
    console.log('\n💾 Memory Usage:');
    console.log(`Start Heap: ${results.memory.startHeap}MB`);
    console.log(`End Heap: ${results.memory.endHeap}MB`);
    console.log(`Memory Growth: ${results.memory.growth}%`);
    
    console.log('\n🌐 Endpoint Performance:');
    for (const [endpoint, stats] of Object.entries(results.endpoints)) {
      if (stats.success + stats.failed > 0) {
        const endpointSuccessRate = (stats.success / (stats.success + stats.failed) * 100).toFixed(1);
        const avgLatency = stats.latencies.length > 0 
          ? (stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length).toFixed(0)
          : 'N/A';
        console.log(`${endpoint}: Success=${stats.success}, Failed=${stats.failed}, Rate=${endpointSuccessRate}%, Avg=${avgLatency}ms`);
      }
    }
    
    console.log('\n🏥 Component Health:');
    console.log(`Rate Limiter: ${results.componentHealth.rateLimiter.healthy !== false ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`Circuit Breaker: ${results.componentHealth.circuitBreaker.state} state`);
    console.log(`Connection Pool: ${results.componentHealth.connectionPool.activeConnections} active connections`);
    
    console.log('\n✅ Success Criteria:');
    console.log(`Average Latency < 5s: ${results.successCriteria.avgLatencyUnder5s ? '✅ PASS' : '❌ FAIL'} (${results.latency.average}ms)`);
    console.log(`Success Rate > 70%: ${results.successCriteria.successRateAbove70 ? '✅ PASS' : '❌ FAIL'} (${results.summary.successRate}%)`);
    console.log(`Components Healthy: ${results.successCriteria.componentsHealthy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Memory Growth < 10%: ${results.successCriteria.memoryGrowthUnder10 ? '✅ PASS' : '❌ FAIL'} (${results.memory.growth}%)`);
    
    // Overall assessment
    const allCriteriaMet = Object.values(results.successCriteria).every(v => v);
    
    console.log('\n' + '=' .repeat(60));
    if (allCriteriaMet) {
      console.log('🎉 Foundation Chain Performance Test PASSED!');
      console.log('All success criteria met with real network calls');
      console.log(`Component overhead is minimal (${results.componentOverhead.percentOfAvgLatency}% of latency)`);
    } else {
      console.log('⚠️ Some performance criteria not met');
      console.log('Review the results above for details');
    }
    console.log('=' .repeat(60));
    
    return allCriteriaMet;
    
  } catch (error) {
    console.error('\n❌ Performance test failed:', error);
    return false;
  }
}

// Execute the test
runFoundationPerformanceTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });