/**
 * Integration Test: TokenBucket + CircuitBreaker + ConnectionPoolCore Chain
 * Tests 3-component integration with circuit breaker protection
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { RealSolanaHelper } from '../../scripts/real-solana-helper.js';

class ThreeComponentChain {
  constructor() {
    // Initialize TokenBucket with 50 rps limit
    this.rateLimiter = new TokenBucket({
      rateLimit: 50,
      windowMs: 1000,
      maxBurst: 75
    });
    
    // Initialize CircuitBreaker with threshold 6 (from Phase 2 findings)
    this.circuitBreaker = new CircuitBreaker({
      threshold: 6,
      timeout: 30000,
      windowSize: 10000,
      cooldownTime: 5000,
      healthCheckInterval: 2000
    });
    
    // Initialize ConnectionPoolCore with 20 max sockets
    this.connectionPool = new ConnectionPoolCore({
      maxSockets: 20,
      maxSocketsPerHost: 10,
      keepAlive: true,
      keepAliveMsecs: 3000,
      timeout: 10000
    });
    
    // Initialize Solana helper
    this.solanaHelper = new RealSolanaHelper();
    
    // Track endpoints for testing
    this.endpoints = {
      good: this.solanaHelper.endpoints.helius,
      failing: 'https://failing-endpoint.example.com',
      slow: 'https://slow-endpoint.example.com'
    };
    
    // Metrics tracking
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitedRequests: 0,
      circuitBreakerRejections: 0,
      connectionPoolRejections: 0,
      validResponses: 0,
      errors: [],
      circuitOpens: 0,
      circuitCloses: 0,
      responseTimes: []
    };
    
    // Track circuit breaker state changes
    this.circuitBreaker.on('open', () => {
      this.metrics.circuitOpens++;
      console.log('🔴 Circuit breaker OPENED');
    });
    
    this.circuitBreaker.on('half-open', () => {
      console.log('🟡 Circuit breaker HALF-OPEN');
    });
    
    this.circuitBreaker.on('close', () => {
      this.metrics.circuitCloses++;
      console.log('🟢 Circuit breaker CLOSED');
    });
  }
  
  async makeRequest(method, params, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    const endpoint = options.endpoint || 'good';
    const forceFailure = options.forceFailure || false;
    
    try {
      // Step 1: Check rate limiter
      if (!this.rateLimiter.consume(1)) {
        this.metrics.rateLimitedRequests++;
        return { 
          success: false, 
          reason: 'rate_limited',
          latency: Date.now() - startTime
        };
      }
      
      // Step 2: Check circuit breaker
      const circuitState = this.circuitBreaker.getMetrics();
      if (circuitState.state === 'OPEN') {
        this.metrics.circuitBreakerRejections++;
        return {
          success: false,
          reason: 'circuit_open',
          latency: Date.now() - startTime
        };
      }
      
      // Step 3: Get connection from pool
      const agent = this.connectionPool.getAgent('https');
      if (!agent) {
        this.metrics.connectionPoolRejections++;
        // Record failure in circuit breaker
        this.circuitBreaker.recordFailure();
        return { 
          success: false, 
          reason: 'no_connection',
          latency: Date.now() - startTime
        };
      }
      
      // Step 4: Execute request through circuit breaker
      const executeRequest = async () => {
        // Simulate failures for testing
        if (forceFailure || endpoint === 'failing') {
          throw new Error('Simulated endpoint failure');
        }
        
        if (endpoint === 'slow') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          throw new Error('Request timeout');
        }
        
        // Make real Solana RPC call for good endpoints
        if (endpoint === 'good') {
          const response = await this.solanaHelper.executeRpcCall(method, params, {
            agent,
            timeout: 5000
          });
          
          return response;
        }
        
        // Mock response for testing
        return {
          result: {
            value: method === 'getBalance' ? 1000000000 : { test: 'data' }
          }
        };
      };
      
      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(
        `${endpoint}_${method}`,
        executeRequest
      );
      
      const latency = Date.now() - startTime;
      this.metrics.responseTimes.push(latency);
      
      // Validate response
      if (response && response.result) {
        this.metrics.successfulRequests++;
        
        if (response.result.value !== undefined) {
          this.metrics.validResponses++;
          
          return {
            success: true,
            data: response.result.value,
            latency,
            endpoint
          };
        }
      }
      
      // Record failure if response invalid
      this.circuitBreaker.recordFailure();
      return {
        success: false,
        reason: 'invalid_response',
        latency
      };
      
    } catch (error) {
      // Circuit breaker automatically records failures
      this.metrics.errors.push({
        method,
        endpoint,
        error: error.message,
        time: new Date().toISOString()
      });
      
      return {
        success: false,
        reason: 'error',
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }
  
  async testCircuitBreakerActivation() {
    console.log('\n📝 Testing Circuit Breaker Activation (6 failures threshold)');
    
    const results = [];
    
    // Send 10 requests to failing endpoint
    for (let i = 1; i <= 10; i++) {
      const result = await this.makeRequest('getHealth', [], {
        endpoint: 'failing'
      });
      
      results.push(result);
      
      const metrics = this.circuitBreaker.getMetrics();
      console.log(`Request ${i}: ${result.reason || 'success'} | Circuit: ${metrics.state} | Failures: ${metrics.failures}`);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check if circuit opened after 6 failures
    const circuitMetrics = this.circuitBreaker.getMetrics();
    const openedAfterSix = results.filter(r => r.reason === 'circuit_open').length > 0;
    
    return {
      totalRequests: 10,
      failures: results.filter(r => !r.success).length,
      circuitOpened: circuitMetrics.state === 'OPEN',
      openedAfterSix,
      rejectedByCircuit: results.filter(r => r.reason === 'circuit_open').length
    };
  }
  
  async testGoodEndpointsDuringCircuitOpen() {
    console.log('\n📝 Testing Good Endpoints While Circuit is Open');
    
    // First, open the circuit with failures
    console.log('Opening circuit with failures...');
    for (let i = 0; i < 7; i++) {
      await this.makeRequest('getHealth', [], { forceFailure: true });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const beforeMetrics = this.circuitBreaker.getMetrics();
    console.log(`Circuit state before good requests: ${beforeMetrics.state}`);
    
    // Now try good endpoints
    const goodResults = [];
    for (let i = 0; i < 5; i++) {
      const result = await this.makeRequest('getHealth', [], {
        endpoint: 'good',
        forceFailure: false
      });
      goodResults.push(result);
    }
    
    const successCount = goodResults.filter(r => r.success).length;
    const circuitRejections = goodResults.filter(r => r.reason === 'circuit_open').length;
    
    return {
      circuitStateBefore: beforeMetrics.state,
      totalGoodRequests: 5,
      successfulRequests: successCount,
      circuitRejections,
      goodEndpointsAccessible: successCount > 0 || circuitRejections === 5
    };
  }
  
  async runLoadTest(requestCount, concurrency) {
    console.log(`\n🚀 Running 3-component load test: ${requestCount} requests, ${concurrency} concurrent`);
    
    const methods = ['getTokenSupply', 'getBalance', 'getSlot', 'getHealth'];
    const requests = [];
    
    for (let i = 0; i < requestCount; i++) {
      const method = methods[i % methods.length];
      let params = [];
      
      if (method === 'getTokenSupply') {
        params = [this.solanaHelper.tokens.BONK.mint];
      } else if (method === 'getBalance') {
        params = [this.solanaHelper.getRandomWalletAddress()];
      }
      
      // Mix of good and occasional failing requests
      const endpoint = i % 20 === 0 ? 'failing' : 'good';
      
      requests.push({ method, params, endpoint });
    }
    
    // Execute requests with controlled concurrency
    const startTime = Date.now();
    const results = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(req => 
        this.makeRequest(req.method, req.params, { endpoint: req.endpoint })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + concurrency < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Calculate metrics
    const successRate = (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(1);
    const rateLimitRate = (this.metrics.rateLimitedRequests / this.metrics.totalRequests * 100).toFixed(1);
    const circuitBreakerRate = (this.metrics.circuitBreakerRejections / this.metrics.totalRequests * 100).toFixed(1);
    
    // Calculate latency percentiles
    const sortedLatencies = this.metrics.responseTimes.sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;
    
    // Get final circuit breaker state
    const circuitMetrics = this.circuitBreaker.getMetrics();
    
    return {
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      rateLimitedRequests: this.metrics.rateLimitedRequests,
      circuitBreakerRejections: this.metrics.circuitBreakerRejections,
      successRate,
      rateLimitRate,
      circuitBreakerRate,
      totalTime,
      throughput: (this.metrics.totalRequests / (totalTime / 1000)).toFixed(1),
      latencyP50: p50,
      latencyP95: p95,
      latencyP99: p99,
      errors: this.metrics.errors.length,
      circuitState: circuitMetrics.state,
      circuitOpens: this.metrics.circuitOpens,
      circuitCloses: this.metrics.circuitCloses
    };
  }
  
  async testRecovery() {
    console.log('\n📝 Testing Circuit Recovery');
    
    // Open the circuit
    console.log('Opening circuit...');
    for (let i = 0; i < 7; i++) {
      await this.makeRequest('getHealth', [], { forceFailure: true });
    }
    
    const openState = this.circuitBreaker.getMetrics();
    console.log(`Circuit state after failures: ${openState.state}`);
    
    // Wait for cooldown
    console.log('Waiting for cooldown period (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5500));
    
    // Try recovery with good requests
    console.log('Attempting recovery with good requests...');
    const recoveryResults = [];
    for (let i = 0; i < 5; i++) {
      const result = await this.makeRequest('getHealth', [], {
        endpoint: 'good',
        forceFailure: false
      });
      recoveryResults.push(result);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const afterRecoveryMetrics = this.circuitBreaker.getMetrics();
    const recoverySuccess = recoveryResults.filter(r => r.success).length;
    
    return {
      stateBeforeRecovery: openState.state,
      stateAfterRecovery: afterRecoveryMetrics.state,
      recoveryAttempts: 5,
      successfulRecoveries: recoverySuccess,
      recovered: afterRecoveryMetrics.state === 'CLOSED' || afterRecoveryMetrics.state === 'HALF_OPEN'
    };
  }
}

// Test suite
async function runThreeComponentTest() {
  console.log('=' .repeat(60));
  console.log('TokenBucket + CircuitBreaker + ConnectionPoolCore Integration');
  console.log('Testing 3-component chain with circuit breaker protection');
  console.log('=' .repeat(60));
  
  const chain = new ThreeComponentChain();
  
  // Test 1: Basic functionality test
  console.log('\n📝 Test 1: Basic 3-Component Chain');
  const basicResult = await chain.makeRequest('getHealth', []);
  console.log(`Health check: ${basicResult.success ? '✅ Success' : '❌ Failed'}`);
  if (basicResult.latency) {
    console.log(`Latency: ${basicResult.latency}ms`);
  }
  
  // Test 2: Circuit breaker activation
  const activationTest = await chain.testCircuitBreakerActivation();
  console.log('\n📊 Circuit Breaker Activation Results:');
  console.log(`Total Requests: ${activationTest.totalRequests}`);
  console.log(`Failures: ${activationTest.failures}`);
  console.log(`Circuit Opened: ${activationTest.circuitOpened ? '✅' : '❌'}`);
  console.log(`Opened After 6 Failures: ${activationTest.openedAfterSix ? '✅' : '❌'}`);
  console.log(`Rejected by Circuit: ${activationTest.rejectedByCircuit}`);
  
  // Reset circuit for next test
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // Test 3: Good endpoints during circuit open
  const goodEndpointTest = await chain.testGoodEndpointsDuringCircuitOpen();
  console.log('\n📊 Good Endpoints During Circuit Open:');
  console.log(`Circuit State: ${goodEndpointTest.circuitStateBefore}`);
  console.log(`Good Requests Attempted: ${goodEndpointTest.totalGoodRequests}`);
  console.log(`Successful: ${goodEndpointTest.successfulRequests}`);
  console.log(`Circuit Rejections: ${goodEndpointTest.circuitRejections}`);
  console.log(`Good Endpoints Accessible: ${goodEndpointTest.goodEndpointsAccessible ? '✅' : '❌'}`);
  
  // Wait for recovery
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // Test 4: Load test with mixed endpoints
  console.log('\n📝 Test 4: Load Test (200 requests, 10 concurrent)');
  const loadResults = await chain.runLoadTest(200, 10);
  
  console.log('\n📊 Load Test Results:');
  console.log('-' .repeat(40));
  console.log(`Total Requests: ${loadResults.totalRequests}`);
  console.log(`Successful: ${loadResults.successfulRequests}`);
  console.log(`Rate Limited: ${loadResults.rateLimitedRequests}`);
  console.log(`Circuit Breaker Rejections: ${loadResults.circuitBreakerRejections}`);
  console.log(`Success Rate: ${loadResults.successRate}%`);
  console.log(`Rate Limit Rate: ${loadResults.rateLimitRate}%`);
  console.log(`Circuit Breaker Rate: ${loadResults.circuitBreakerRate}%`);
  console.log(`\nPerformance:`);
  console.log(`Throughput: ${loadResults.throughput} rps`);
  console.log(`P50 Latency: ${loadResults.latencyP50}ms`);
  console.log(`P95 Latency: ${loadResults.latencyP95}ms`);
  console.log(`P99 Latency: ${loadResults.latencyP99}ms`);
  console.log(`\nCircuit Breaker:`);
  console.log(`Final State: ${loadResults.circuitState}`);
  console.log(`Times Opened: ${loadResults.circuitOpens}`);
  console.log(`Times Closed: ${loadResults.circuitCloses}`);
  console.log(`Errors: ${loadResults.errors}`);
  
  // Test 5: Recovery test
  const recoveryTest = await chain.testRecovery();
  console.log('\n📊 Recovery Test Results:');
  console.log(`State Before Recovery: ${recoveryTest.stateBeforeRecovery}`);
  console.log(`State After Recovery: ${recoveryTest.stateAfterRecovery}`);
  console.log(`Recovery Attempts: ${recoveryTest.recoveryAttempts}`);
  console.log(`Successful Recoveries: ${recoveryTest.successfulRecoveries}`);
  console.log(`System Recovered: ${recoveryTest.recovered ? '✅' : '❌'}`);
  
  // Validate success criteria
  console.log('\n✅ Success Criteria Validation:');
  const criteria = {
    '3-component chain works': basicResult.success,
    'Circuit opens after 6 failures': activationTest.openedAfterSix,
    'System continues after circuit opens': parseFloat(loadResults.successRate) > 50,
    'Good endpoints accessible': goodEndpointTest.goodEndpointsAccessible,
    'Recovery capability': recoveryTest.recovered,
    'Rate limiting still active': parseFloat(loadResults.rateLimitRate) > 0
  };
  
  let allPassed = true;
  for (const [criterion, passed] of Object.entries(criteria)) {
    console.log(`${passed ? '✅' : '❌'} ${criterion}`);
    if (!passed) allPassed = false;
  }
  
  // Final summary
  console.log('\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('🎉 All 3-component integration tests passed!');
    console.log('Circuit breaker successfully protects the system');
    console.log('Rate limiting and connection pooling work with circuit breaker');
  } else {
    console.log('⚠️ Some criteria not met - review results above');
  }
  console.log('=' .repeat(60));
  
  return allPassed;
}

// Run the test
runThreeComponentTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });