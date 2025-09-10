/**
 * Integration Test: 4-Component Chain with EndpointSelector
 * TokenBucket + CircuitBreaker + ConnectionPoolCore + EndpointSelector
 * Tests endpoint selection, failover, and load balancing
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { EndpointSelector } from '../../src/detection/transport/endpoint-selector.js';
import { RealSolanaHelper } from '../../scripts/real-solana-helper.js';
import { performance } from 'perf_hooks';

class FourComponentChain {
  constructor(config = {}) {
    // Initialize TokenBucket (Component 1)
    this.rateLimiter = new TokenBucket({
      rateLimit: config.rateLimit || 50,
      windowMs: 1000,
      maxBurst: config.maxBurst || 75
    });
    
    // Initialize CircuitBreaker (Component 2)
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.failureThreshold || 6,
      successThreshold: 3,
      cooldownPeriod: 5000,
      volumeThreshold: 10,
      errorThresholdPercentage: 50
    });
    
    // Initialize ConnectionPoolCore (Component 3)
    this.connectionPool = new ConnectionPoolCore({
      maxSockets: config.maxSockets || 20,
      maxSocketsPerHost: 10,
      keepAlive: true,
      keepAliveMsecs: 3000,
      timeout: 10000
    });
    
    // Initialize EndpointSelector (Component 4) - NEW!
    this.endpointSelector = new EndpointSelector({
      strategy: config.strategy || 'round-robin',
      healthCheckInterval: 5000,
      failureThreshold: 3,
      recoveryTime: 10000
    });
    
    // Configure endpoints (Phase 2 finding: use initializeEndpoints)
    const endpoints = [
      'https://mainnet.helius-rpc.com/?api-key=mock',
      'https://solana-mainnet.chainstack.com/mock',
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com'
    ];
    
    this.endpointSelector.initializeEndpoints(endpoints);
    
    // Solana helper for real RPC calls
    this.solanaHelper = new RealSolanaHelper();
    
    // Metrics tracking
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      circuitBreakerRejections: 0,
      endpointUsage: {},
      endpointFailures: {},
      failoverEvents: 0,
      componentOverhead: {
        rateLimiter: [],
        circuitBreaker: [],
        connectionPool: [],
        endpointSelector: []
      },
      latencies: [],
      errors: []
    };
    
    // Initialize endpoint usage tracking
    endpoints.forEach(ep => {
      const url = new URL(ep);
      const key = url.hostname;
      this.metrics.endpointUsage[key] = 0;
      this.metrics.endpointFailures[key] = 0;
    });
    
    // Track endpoint changes
    this.lastEndpoint = null;
  }
  
  async makeRequest(method, params, options = {}) {
    const requestStart = performance.now();
    const componentTimings = {};
    
    this.metrics.totalRequests++;
    
    try {
      // Step 1: Rate Limiter
      const rlStart = performance.now();
      const canProceed = this.rateLimiter.consume(1);
      componentTimings.rateLimiter = performance.now() - rlStart;
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
      const cbStart = performance.now();
      const cbMetrics = this.circuitBreaker.getMetrics();
      componentTimings.circuitBreaker = performance.now() - cbStart;
      this.metrics.componentOverhead.circuitBreaker.push(componentTimings.circuitBreaker);
      
      if (cbMetrics.state === 'OPEN') {
        this.metrics.circuitBreakerRejections++;
        return {
          success: false,
          reason: 'circuit_open',
          latency: performance.now() - requestStart
        };
      }
      
      // Step 3: Connection Pool
      const cpStart = performance.now();
      const agent = this.connectionPool.getAgent('https');
      componentTimings.connectionPool = performance.now() - cpStart;
      this.metrics.componentOverhead.connectionPool.push(componentTimings.connectionPool);
      
      if (!agent) {
        this.circuitBreaker.recordFailure();
        return {
          success: false,
          reason: 'no_connection',
          latency: performance.now() - requestStart
        };
      }
      
      // Step 4: Endpoint Selection (NEW!)
      const esStart = performance.now();
      const endpoint = this.endpointSelector.selectEndpoint();
      componentTimings.endpointSelector = performance.now() - esStart;
      this.metrics.componentOverhead.endpointSelector.push(componentTimings.endpointSelector);
      
      if (!endpoint) {
        return {
          success: false,
          reason: 'no_endpoint_available',
          latency: performance.now() - requestStart
        };
      }
      
      // Track endpoint usage
      const endpointKey = new URL(endpoint.url).hostname;
      this.metrics.endpointUsage[endpointKey]++;
      
      // Check for failover
      if (this.lastEndpoint && this.lastEndpoint !== endpointKey) {
        this.metrics.failoverEvents++;
        console.log(`🔄 Failover: ${this.lastEndpoint} → ${endpointKey}`);
      }
      this.lastEndpoint = endpointKey;
      
      // Step 5: Execute Request
      const executeRequest = async () => {
        // Simulate endpoint-specific behavior
        if (options.forceFailEndpoint && endpoint.url.includes(options.forceFailEndpoint)) {
          throw new Error(`Simulated failure for ${options.forceFailEndpoint}`);
        }
        
        // For testing, simulate RPC call without real network
        if (options.simulate) {
          // Simulate different latencies per endpoint
          const latencies = {
            'mainnet.helius-rpc.com': 100 + Math.random() * 50,
            'solana-mainnet.chainstack.com': 150 + Math.random() * 75,
            'api.mainnet-beta.solana.com': 200 + Math.random() * 100,
            'solana-api.projectserum.com': 175 + Math.random() * 80
          };
          
          const simulatedLatency = latencies[endpointKey] || 150;
          await new Promise(resolve => setTimeout(resolve, simulatedLatency));
          
          // Simulate occasional failures
          if (Math.random() < 0.05) {
            throw new Error('Simulated endpoint failure');
          }
          
          return {
            result: {
              value: method === 'getBalance' ? 1000000000 : { test: 'data' }
            }
          };
        }
        
        // Real RPC call (when not simulating)
        this.solanaHelper.currentEndpoint = endpoint.url;
        return await this.solanaHelper.executeRpcCall(method, params, {
          agent,
          timeout: 5000
        });
      };
      
      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(
        `${endpointKey}_${method}`,
        executeRequest
      );
      
      const totalLatency = performance.now() - requestStart;
      this.metrics.latencies.push(totalLatency);
      
      if (response && response.result) {
        this.metrics.successfulRequests++;
        
        // Update endpoint health
        this.endpointSelector.recordSuccess(endpoint.id);
        
        return {
          success: true,
          data: response.result,
          endpoint: endpointKey,
          latency: totalLatency,
          componentOverhead: componentTimings
        };
      } else {
        this.metrics.failedRequests++;
        this.metrics.endpointFailures[endpointKey]++;
        
        // Update endpoint health
        this.endpointSelector.recordFailure(endpoint.id);
        this.circuitBreaker.recordFailure();
        
        return {
          success: false,
          reason: 'invalid_response',
          endpoint: endpointKey,
          latency: totalLatency
        };
      }
      
    } catch (error) {
      const totalLatency = performance.now() - requestStart;
      this.metrics.latencies.push(totalLatency);
      this.metrics.failedRequests++;
      
      // Record endpoint failure if we had selected one
      if (this.lastEndpoint) {
        this.metrics.endpointFailures[this.lastEndpoint]++;
      }
      
      this.metrics.errors.push({
        method,
        endpoint: this.lastEndpoint,
        error: error.message,
        time: new Date().toISOString()
      });
      
      return {
        success: false,
        reason: 'error',
        error: error.message,
        endpoint: this.lastEndpoint,
        latency: totalLatency
      };
    }
  }
  
  async testEndpointFailover() {
    console.log('\n📝 Testing Endpoint Failover');
    
    const results = [];
    const initialMetrics = { ...this.metrics.endpointUsage };
    
    // Force failure on first endpoint
    const firstEndpoint = this.endpointSelector.selectEndpoint();
    const failEndpoint = new URL(firstEndpoint.url).hostname;
    
    console.log(`Forcing failures on: ${failEndpoint}`);
    
    // Send requests that will fail on specific endpoint
    for (let i = 0; i < 10; i++) {
      const result = await this.makeRequest('getHealth', [], {
        simulate: true,
        forceFailEndpoint: failEndpoint.split('.')[0] // Match partial hostname
      });
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Check if failover occurred
    const endpointsUsed = new Set(results.map(r => r.endpoint).filter(e => e));
    const failoverOccurred = endpointsUsed.size > 1;
    const failoverSpeed = results.findIndex(r => r.endpoint !== failEndpoint) + 1;
    
    return {
      totalRequests: 10,
      endpointsUsed: endpointsUsed.size,
      failoverOccurred,
      failoverSpeed,
      failoverEvents: this.metrics.failoverEvents,
      results: results.map(r => ({
        success: r.success,
        endpoint: r.endpoint,
        reason: r.reason
      }))
    };
  }
  
  async testLoadBalancing(requestCount = 40) {
    console.log(`\n📝 Testing Load Balancing (${requestCount} requests)`);
    
    const results = [];
    this.metrics.endpointUsage = {}; // Reset usage stats
    
    // Initialize usage counters
    const endpoints = this.endpointSelector.getEndpoints();
    endpoints.forEach(ep => {
      const key = new URL(ep.url).hostname;
      this.metrics.endpointUsage[key] = 0;
    });
    
    // Send requests
    for (let i = 0; i < requestCount; i++) {
      const method = ['getHealth', 'getSlot', 'getBalance'][i % 3];
      const result = await this.makeRequest(method, [], { simulate: true });
      results.push(result);
      
      // Small delay to allow round-robin to work
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Calculate distribution statistics
    const totalUsage = Object.values(this.metrics.endpointUsage).reduce((a, b) => a + b, 0);
    const distribution = {};
    let maxUsagePercent = 0;
    let minUsagePercent = 100;
    
    for (const [endpoint, usage] of Object.entries(this.metrics.endpointUsage)) {
      if (usage > 0) {
        const percent = (usage / totalUsage * 100);
        distribution[endpoint] = {
          count: usage,
          percentage: percent.toFixed(1)
        };
        maxUsagePercent = Math.max(maxUsagePercent, percent);
        minUsagePercent = Math.min(minUsagePercent, percent);
      }
    }
    
    const endpointsUsed = Object.values(this.metrics.endpointUsage).filter(v => v > 0).length;
    const balanceRatio = minUsagePercent / maxUsagePercent; // Closer to 1 = better balance
    
    return {
      totalRequests: requestCount,
      successfulRequests: results.filter(r => r.success).length,
      endpointsUsed,
      distribution,
      maxUsagePercent: maxUsagePercent.toFixed(1),
      minUsagePercent: minUsagePercent.toFixed(1),
      balanceRatio: balanceRatio.toFixed(2),
      wellBalanced: maxUsagePercent < 80 && endpointsUsed > 1
    };
  }
  
  async runIntegrationTest() {
    console.log('\n🚀 Running 4-Component Integration Test');
    
    const testStart = Date.now();
    const results = [];
    
    // Test with mixed requests
    const methods = ['getHealth', 'getSlot', 'getTokenSupply', 'getBalance'];
    
    for (let i = 0; i < 30; i++) {
      const method = methods[i % methods.length];
      let params = [];
      
      if (method === 'getTokenSupply') {
        params = [this.solanaHelper.tokens.BONK.mint];
      } else if (method === 'getBalance') {
        params = [this.solanaHelper.getRandomWalletAddress()];
      }
      
      const result = await this.makeRequest(method, params, { simulate: true });
      results.push(result);
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/30 requests`);
      }
    }
    
    const testEnd = Date.now();
    const totalTime = testEnd - testStart;
    
    // Calculate statistics
    const successRate = (this.metrics.successfulRequests / this.metrics.totalRequests * 100);
    const avgLatency = this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length;
    
    // Component overhead
    const avgOverhead = {
      rateLimiter: this.calculateAverage(this.metrics.componentOverhead.rateLimiter),
      circuitBreaker: this.calculateAverage(this.metrics.componentOverhead.circuitBreaker),
      connectionPool: this.calculateAverage(this.metrics.componentOverhead.connectionPool),
      endpointSelector: this.calculateAverage(this.metrics.componentOverhead.endpointSelector)
    };
    
    const totalOverhead = Object.values(avgOverhead).reduce((a, b) => a + b, 0);
    
    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        rateLimitedRequests: this.metrics.rateLimitedRequests,
        circuitBreakerRejections: this.metrics.circuitBreakerRejections,
        successRate: successRate.toFixed(1),
        totalTime,
        throughput: (30 / (totalTime / 1000)).toFixed(2)
      },
      latency: {
        average: avgLatency.toFixed(2),
        max: Math.max(...this.metrics.latencies).toFixed(2),
        min: Math.min(...this.metrics.latencies).toFixed(2)
      },
      componentOverhead: {
        rateLimiter: avgOverhead.rateLimiter.toFixed(3),
        circuitBreaker: avgOverhead.circuitBreaker.toFixed(3),
        connectionPool: avgOverhead.connectionPool.toFixed(3),
        endpointSelector: avgOverhead.endpointSelector.toFixed(3),
        total: totalOverhead.toFixed(3),
        percentOfLatency: ((totalOverhead / avgLatency) * 100).toFixed(2)
      },
      endpointUsage: this.metrics.endpointUsage,
      failoverEvents: this.metrics.failoverEvents
    };
  }
  
  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  getMetrics() {
    return this.metrics;
  }
}

// Main test execution
async function runFourComponentTest() {
  console.log('=' .repeat(60));
  console.log('4-Component Chain Integration Test');
  console.log('TokenBucket + CircuitBreaker + ConnectionPoolCore + EndpointSelector');
  console.log('=' .repeat(60));
  
  const chain = new FourComponentChain({
    rateLimit: 50,
    maxBurst: 75,
    failureThreshold: 6,
    maxSockets: 20,
    strategy: 'round-robin'
  });
  
  // Test 1: Basic functionality
  console.log('\n📝 Test 1: Basic 4-Component Chain');
  const basicResult = await chain.makeRequest('getHealth', [], { simulate: true });
  console.log(`Health check: ${basicResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Endpoint used: ${basicResult.endpoint}`);
  console.log(`Latency: ${basicResult.latency?.toFixed(2)}ms`);
  
  // Test 2: Endpoint failover
  const failoverTest = await chain.testEndpointFailover();
  console.log('\n📊 Endpoint Failover Results:');
  console.log(`Endpoints used: ${failoverTest.endpointsUsed}`);
  console.log(`Failover occurred: ${failoverTest.failoverOccurred ? '✅' : '❌'}`);
  console.log(`Failover speed: ${failoverTest.failoverSpeed} requests`);
  console.log(`Failover events: ${failoverTest.failoverEvents}`);
  
  // Reset metrics for next test
  chain.metrics.failoverEvents = 0;
  
  // Test 3: Load balancing
  const loadBalanceTest = await chain.testLoadBalancing(40);
  console.log('\n📊 Load Balancing Results:');
  console.log(`Total requests: ${loadBalanceTest.totalRequests}`);
  console.log(`Successful: ${loadBalanceTest.successfulRequests}`);
  console.log(`Endpoints used: ${loadBalanceTest.endpointsUsed}`);
  console.log('\nDistribution:');
  for (const [endpoint, stats] of Object.entries(loadBalanceTest.distribution)) {
    console.log(`  ${endpoint}: ${stats.count} requests (${stats.percentage}%)`);
  }
  console.log(`Max usage: ${loadBalanceTest.maxUsagePercent}%`);
  console.log(`Well balanced: ${loadBalanceTest.wellBalanced ? '✅' : '❌'}`);
  
  // Test 4: Full integration test
  const integrationResults = await chain.runIntegrationTest();
  
  console.log('\n📊 Integration Test Results:');
  console.log('-' .repeat(40));
  console.log(`Total Requests: ${integrationResults.summary.totalRequests}`);
  console.log(`Successful: ${integrationResults.summary.successfulRequests}`);
  console.log(`Failed: ${integrationResults.summary.failedRequests}`);
  console.log(`Success Rate: ${integrationResults.summary.successRate}%`);
  console.log(`Throughput: ${integrationResults.summary.throughput} req/s`);
  
  console.log('\n⏱️ Latency:');
  console.log(`Average: ${integrationResults.latency.average}ms`);
  console.log(`Min: ${integrationResults.latency.min}ms`);
  console.log(`Max: ${integrationResults.latency.max}ms`);
  
  console.log('\n🔧 Component Overhead:');
  console.log(`Rate Limiter: ${integrationResults.componentOverhead.rateLimiter}ms`);
  console.log(`Circuit Breaker: ${integrationResults.componentOverhead.circuitBreaker}ms`);
  console.log(`Connection Pool: ${integrationResults.componentOverhead.connectionPool}ms`);
  console.log(`Endpoint Selector: ${integrationResults.componentOverhead.endpointSelector}ms`);
  console.log(`Total: ${integrationResults.componentOverhead.total}ms (${integrationResults.componentOverhead.percentOfLatency}%)`);
  
  // Validate success criteria
  console.log('\n✅ Success Criteria Validation:');
  const criteria = {
    '4-component chain works': basicResult.success,
    'Multiple endpoints used': loadBalanceTest.endpointsUsed > 1,
    'Endpoint failover works': failoverTest.failoverOccurred && failoverTest.failoverSpeed < 3,
    'Success rate > 65%': parseFloat(integrationResults.summary.successRate) > 65,
    'No endpoint > 80% usage': loadBalanceTest.wellBalanced
  };
  
  let allPassed = true;
  for (const [criterion, passed] of Object.entries(criteria)) {
    console.log(`${passed ? '✅' : '❌'} ${criterion}`);
    if (!passed) allPassed = false;
  }
  
  console.log('\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('🎉 All 4-component integration tests passed!');
    console.log('EndpointSelector successfully integrated with foundation chain');
    console.log('Load balancing and failover working as expected');
  } else {
    console.log('⚠️ Some criteria not met - review results above');
  }
  console.log('=' .repeat(60));
  
  return allPassed;
}

// Execute the test
runFourComponentTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });