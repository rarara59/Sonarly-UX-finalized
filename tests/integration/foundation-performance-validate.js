#!/usr/bin/env node

/**
 * Foundation Chain Performance Validation
 * Simulated performance test without real network calls
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { performance } from 'perf_hooks';

class MockSolanaHelper {
  constructor() {
    this.endpoints = {
      helius: 'https://mock-helius.example.com',
      solana: 'https://mock-solana.example.com',
      custom: 'https://mock-custom.example.com'
    };
    
    this.tokens = {
      BONK: { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
      WIF: { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
      PEPE: { mint: 'HhJgC4TULwmZzKCxBJMqUfPsJ86xfktB5M3xkbVAnX1' }
    };
    
    this.requestCount = 0;
    this.failureRate = 0.05; // 5% failure rate
  }
  
  async executeRpcCall(method, params, options = {}) {
    this.requestCount++;
    
    // Simulate network latency (50-500ms)
    const latency = Math.random() * 450 + 50;
    await new Promise(resolve => setTimeout(resolve, latency));
    
    // Simulate occasional failures
    if (Math.random() < this.failureRate) {
      throw new Error('Simulated network error');
    }
    
    // Return mock response based on method
    switch (method) {
      case 'getHealth':
        return { result: 'ok' };
      
      case 'getSlot':
        return { result: 123456789 + this.requestCount };
      
      case 'getTokenSupply':
        return {
          result: {
            value: {
              amount: '1000000000000',
              decimals: 9,
              uiAmount: 1000000.0
            }
          }
        };
      
      case 'getBalance':
        return {
          result: {
            value: Math.floor(Math.random() * 1000000000)
          }
        };
      
      default:
        return { result: { value: 'mock_data' } };
    }
  }
  
  getRandomWalletAddress() {
    return 'MockWallet' + Math.random().toString(36).substring(7);
  }
}

async function validateFoundationPerformance() {
  console.log('=' .repeat(60));
  console.log('Foundation Chain Performance Validation');
  console.log('Simulated test with 30 requests');
  console.log('=' .repeat(60));
  
  // Initialize components
  const rateLimiter = new TokenBucket({
    rateLimit: 50,
    windowMs: 1000,
    maxBurst: 75
  });
  
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 6,
    successThreshold: 3,
    cooldownPeriod: 5000
  });
  
  const connectionPool = new ConnectionPoolCore({
    maxSockets: 20,
    maxSocketsPerHost: 10,
    keepAlive: true
  });
  
  const solanaHelper = new MockSolanaHelper();
  
  // Metrics tracking
  const metrics = {
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
    memoryStart: process.memoryUsage(),
    memoryEnd: null
  };
  
  // Execute request through chain
  async function makeRequest(method, params) {
    const requestStart = performance.now();
    metrics.totalRequests++;
    
    try {
      // Step 1: Rate Limiter
      const rlStart = performance.now();
      const canProceed = rateLimiter.consume(1);
      metrics.componentOverhead.rateLimiter.push(performance.now() - rlStart);
      
      if (!canProceed) {
        metrics.rateLimitedRequests++;
        return { success: false, reason: 'rate_limited' };
      }
      
      // Step 2: Circuit Breaker
      const cbStart = performance.now();
      const cbMetrics = circuitBreaker.getMetrics();
      metrics.componentOverhead.circuitBreaker.push(performance.now() - cbStart);
      
      if (cbMetrics.state === 'OPEN') {
        metrics.circuitBreakerRejections++;
        return { success: false, reason: 'circuit_open' };
      }
      
      // Step 3: Connection Pool
      const cpStart = performance.now();
      const agent = connectionPool.getAgent('https');
      metrics.componentOverhead.connectionPool.push(performance.now() - cpStart);
      
      if (!agent) {
        circuitBreaker.recordFailure();
        return { success: false, reason: 'no_connection' };
      }
      
      // Step 4: Execute through circuit breaker
      const response = await circuitBreaker.execute(
        `${method}_${Date.now()}`,
        () => solanaHelper.executeRpcCall(method, params, { agent })
      );
      
      const latency = performance.now() - requestStart;
      metrics.latencies.push(latency);
      
      if (response && response.result) {
        metrics.successfulRequests++;
        return { success: true, data: response.result, latency };
      } else {
        metrics.failedRequests++;
        circuitBreaker.recordFailure();
        return { success: false, reason: 'invalid_response', latency };
      }
      
    } catch (error) {
      metrics.failedRequests++;
      const latency = performance.now() - requestStart;
      metrics.latencies.push(latency);
      return { success: false, reason: 'error', error: error.message, latency };
    }
  }
  
  // Run performance test
  console.log('\n🚀 Executing 30 requests through 3-component chain...\n');
  
  const startTime = Date.now();
  const methods = ['getHealth', 'getSlot', 'getTokenSupply', 'getBalance'];
  const tokens = Object.keys(solanaHelper.tokens);
  
  // Execute requests
  for (let i = 0; i < 30; i++) {
    const method = methods[i % methods.length];
    let params = [];
    
    if (method === 'getTokenSupply') {
      const token = tokens[i % tokens.length];
      params = [solanaHelper.tokens[token].mint];
    } else if (method === 'getBalance') {
      params = [solanaHelper.getRandomWalletAddress()];
    }
    
    await makeRequest(method, params);
    
    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/30 requests completed`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  metrics.memoryEnd = process.memoryUsage();
  
  // Calculate statistics
  const avgLatency = metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length;
  const sortedLatencies = metrics.latencies.sort((a, b) => a - b);
  const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
  const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
  const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
  
  const avgOverhead = {
    rateLimiter: metrics.componentOverhead.rateLimiter.reduce((a, b) => a + b, 0) / metrics.componentOverhead.rateLimiter.length,
    circuitBreaker: metrics.componentOverhead.circuitBreaker.reduce((a, b) => a + b, 0) / metrics.componentOverhead.circuitBreaker.length,
    connectionPool: metrics.componentOverhead.connectionPool.reduce((a, b) => a + b, 0) / metrics.componentOverhead.connectionPool.length
  };
  
  const totalOverhead = avgOverhead.rateLimiter + avgOverhead.circuitBreaker + avgOverhead.connectionPool;
  const successRate = (metrics.successfulRequests / metrics.totalRequests * 100);
  const memoryGrowth = ((metrics.memoryEnd.heapUsed - metrics.memoryStart.heapUsed) / metrics.memoryStart.heapUsed * 100);
  
  // Get component health
  const componentHealth = {
    rateLimiter: rateLimiter.getMetrics ? rateLimiter.getMetrics() : { healthy: true },
    circuitBreaker: circuitBreaker.getMetrics(),
    connectionPool: connectionPool.getStats()
  };
  
  // Display results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Performance Validation Results');
  console.log('=' .repeat(60));
  
  console.log('\n📈 Summary:');
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful: ${metrics.successfulRequests}`);
  console.log(`Failed: ${metrics.failedRequests}`);
  console.log(`Rate Limited: ${metrics.rateLimitedRequests}`);
  console.log(`Circuit Breaker Rejections: ${metrics.circuitBreakerRejections}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Throughput: ${(30 / (totalTime / 1000)).toFixed(2)} req/s`);
  
  console.log('\n⏱️ Latency Statistics:');
  console.log(`Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`P50: ${p50.toFixed(2)}ms`);
  console.log(`P95: ${p95.toFixed(2)}ms`);
  console.log(`P99: ${p99.toFixed(2)}ms`);
  
  console.log('\n🔧 Component Overhead:');
  console.log(`Rate Limiter: ${avgOverhead.rateLimiter.toFixed(3)}ms`);
  console.log(`Circuit Breaker: ${avgOverhead.circuitBreaker.toFixed(3)}ms`);
  console.log(`Connection Pool: ${avgOverhead.connectionPool.toFixed(3)}ms`);
  console.log(`Total Overhead: ${totalOverhead.toFixed(3)}ms`);
  console.log(`Overhead % of Latency: ${((totalOverhead / avgLatency) * 100).toFixed(2)}%`);
  
  console.log('\n💾 Memory Usage:');
  console.log(`Start Heap: ${(metrics.memoryStart.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`End Heap: ${(metrics.memoryEnd.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Memory Growth: ${memoryGrowth.toFixed(2)}%`);
  
  console.log('\n🏥 Component Health:');
  console.log(`Rate Limiter: ${componentHealth.rateLimiter.healthy !== false ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`Circuit Breaker: ${componentHealth.circuitBreaker.state} state`);
  console.log(`Connection Pool: ${componentHealth.connectionPool.activeConnections} active connections`);
  
  // Success criteria validation
  const successCriteria = {
    avgLatencyUnder5s: avgLatency < 5000,
    successRateAbove70: successRate > 70,
    componentsHealthy: componentHealth.circuitBreaker.state !== 'OPEN' && 
                      componentHealth.rateLimiter.healthy !== false,
    memoryGrowthUnder10: Math.abs(memoryGrowth) < 10
  };
  
  console.log('\n✅ Success Criteria Validation:');
  console.log(`Average Latency < 5000ms: ${successCriteria.avgLatencyUnder5s ? '✅ PASS' : '❌ FAIL'} (${avgLatency.toFixed(0)}ms)`);
  console.log(`Success Rate > 70%: ${successCriteria.successRateAbove70 ? '✅ PASS' : '❌ FAIL'} (${successRate.toFixed(1)}%)`);
  console.log(`Components Healthy: ${successCriteria.componentsHealthy ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Memory Growth < 10%: ${successCriteria.memoryGrowthUnder10 ? '✅ PASS' : '❌ FAIL'} (${memoryGrowth.toFixed(2)}%)`);
  
  const allCriteriaMet = Object.values(successCriteria).every(v => v);
  
  console.log('\n' + '=' .repeat(60));
  if (allCriteriaMet) {
    console.log('🎉 Foundation Chain Performance Validation PASSED!');
    console.log('All components working efficiently together');
    console.log(`Component overhead is minimal (${((totalOverhead / avgLatency) * 100).toFixed(1)}% of total latency)`);
  } else {
    console.log('⚠️ Some performance criteria not met');
  }
  console.log('=' .repeat(60));
  
  return allCriteriaMet;
}

// Run validation
validateFoundationPerformance()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });