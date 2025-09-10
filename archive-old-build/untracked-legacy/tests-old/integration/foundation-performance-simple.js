#!/usr/bin/env node

/**
 * Foundation Chain Performance Simple Test
 * Quick validation of 3-component chain performance
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { performance } from 'perf_hooks';

async function simplePerformanceTest() {
  console.log('=' .repeat(60));
  console.log('Foundation Chain Performance Test (Simplified)');
  console.log('=' .repeat(60));
  
  // Initialize components
  console.log('\n📦 Initializing components...');
  
  const rateLimiter = new TokenBucket({
    rateLimit: 50,
    windowMs: 1000,
    maxBurst: 75
  });
  console.log('✅ TokenBucket initialized (50 rps)');
  
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 6,
    successThreshold: 3,
    cooldownPeriod: 5000
  });
  console.log('✅ CircuitBreaker initialized (threshold: 6)');
  
  const connectionPool = new ConnectionPoolCore({
    maxSockets: 20,
    maxSocketsPerHost: 10
  });
  console.log('✅ ConnectionPoolCore initialized (20 sockets)');
  
  // Performance metrics
  const metrics = {
    totalRequests: 30,
    successful: 0,
    rateLimited: 0,
    circuitOpen: 0,
    latencies: [],
    componentOverhead: []
  };
  
  const memStart = process.memoryUsage();
  const testStart = Date.now();
  
  console.log('\n🚀 Executing 30 simulated requests...\n');
  
  // Simulate 30 requests
  for (let i = 0; i < 30; i++) {
    const requestStart = performance.now();
    let overheadSum = 0;
    
    // Step 1: Rate limiter
    const rlStart = performance.now();
    const canProceed = rateLimiter.consume(1);
    overheadSum += performance.now() - rlStart;
    
    if (!canProceed) {
      metrics.rateLimited++;
      continue;
    }
    
    // Step 2: Circuit breaker check
    const cbStart = performance.now();
    const cbMetrics = circuitBreaker.getMetrics();
    overheadSum += performance.now() - cbStart;
    
    if (cbMetrics.state === 'OPEN') {
      metrics.circuitOpen++;
      continue;
    }
    
    // Step 3: Connection pool
    const cpStart = performance.now();
    const agent = connectionPool.getAgent('https');
    overheadSum += performance.now() - cpStart;
    
    if (agent) {
      // Simulate successful request with random latency (50-500ms)
      const networkLatency = Math.random() * 450 + 50;
      await new Promise(resolve => setTimeout(resolve, networkLatency));
      
      // Randomly fail 5% of requests
      if (Math.random() > 0.05) {
        metrics.successful++;
        circuitBreaker.recordSuccess();
      } else {
        circuitBreaker.recordFailure();
      }
    }
    
    const totalLatency = performance.now() - requestStart;
    metrics.latencies.push(totalLatency);
    metrics.componentOverhead.push(overheadSum);
    
    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/30 requests`);
    }
  }
  
  const testEnd = Date.now();
  const memEnd = process.memoryUsage();
  
  // Calculate statistics
  const avgLatency = metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length;
  const avgOverhead = metrics.componentOverhead.reduce((a, b) => a + b, 0) / metrics.componentOverhead.length;
  const successRate = (metrics.successful / metrics.totalRequests * 100);
  const totalTime = testEnd - testStart;
  const memoryGrowth = ((memEnd.heapUsed - memStart.heapUsed) / memStart.heapUsed * 100);
  
  // Sort latencies for percentiles
  const sorted = metrics.latencies.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  
  // Display results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Performance Test Results');
  console.log('=' .repeat(60));
  
  console.log('\n📈 Summary:');
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful: ${metrics.successful}`);
  console.log(`Rate Limited: ${metrics.rateLimited}`);
  console.log(`Circuit Open Rejections: ${metrics.circuitOpen}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Throughput: ${(30 / (totalTime / 1000)).toFixed(2)} req/s`);
  
  console.log('\n⏱️ Latency:');
  console.log(`Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`P50: ${p50.toFixed(2)}ms`);
  console.log(`P95: ${p95.toFixed(2)}ms`);
  
  console.log('\n🔧 Component Overhead:');
  console.log(`Average: ${avgOverhead.toFixed(3)}ms`);
  console.log(`% of Latency: ${((avgOverhead / avgLatency) * 100).toFixed(2)}%`);
  
  console.log('\n💾 Memory:');
  console.log(`Start: ${(memStart.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`End: ${(memEnd.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Growth: ${memoryGrowth.toFixed(2)}%`);
  
  console.log('\n🏥 Component Health:');
  const finalCbMetrics = circuitBreaker.getMetrics();
  const finalCpStats = connectionPool.getStats();
  console.log(`Circuit Breaker: ${finalCbMetrics.state}`);
  console.log(`Connection Pool: ${finalCpStats.activeConnections} active`);
  
  // Success criteria
  console.log('\n✅ Success Criteria:');
  const criteria = {
    latency: avgLatency < 5000,
    successRate: successRate > 70,
    memory: Math.abs(memoryGrowth) < 10,
    health: finalCbMetrics.state !== 'OPEN'
  };
  
  console.log(`Avg Latency < 5s: ${criteria.latency ? '✅' : '❌'} (${avgLatency.toFixed(0)}ms)`);
  console.log(`Success Rate > 70%: ${criteria.successRate ? '✅' : '❌'} (${successRate.toFixed(1)}%)`);
  console.log(`Memory Growth < 10%: ${criteria.memory ? '✅' : '❌'} (${memoryGrowth.toFixed(1)}%)`);
  console.log(`Components Healthy: ${criteria.health ? '✅' : '❌'}`);
  
  const allPassed = Object.values(criteria).every(v => v);
  
  console.log('\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('🎉 Performance test PASSED!');
    console.log(`Component overhead is minimal (${((avgOverhead / avgLatency) * 100).toFixed(1)}%)`);
  } else {
    console.log('⚠️ Some criteria not met');
  }
  console.log('=' .repeat(60));
  
  return allPassed;
}

// Run test
simplePerformanceTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });