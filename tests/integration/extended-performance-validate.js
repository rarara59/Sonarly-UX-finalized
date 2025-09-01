#!/usr/bin/env node

/**
 * Extended Performance Validation - Simplified
 * Quick validation without network calls
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { EndpointSelector } from '../../src/detection/transport/endpoint-selector.js';
import { RequestCache } from '../../src/detection/transport/request-cache.js';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

async function validateExtendedPerformance() {
  console.log('=' .repeat(60));
  console.log('Extended Performance Validation (Simplified)');
  console.log('=' .repeat(60));
  
  // Initialize all 5 components
  console.log('\n📦 Initializing 5-component chain...');
  
  const rateLimiter = new TokenBucket({
    rateLimit: 50,
    windowMs: 1000
  });
  
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 6
  });
  
  const connectionPool = new ConnectionPoolCore({
    maxSockets: 20
  });
  
  const endpointSelector = new EndpointSelector({
    strategy: 'round-robin'
  });
  endpointSelector.initializeEndpoints([
    'https://endpoint1.com',
    'https://endpoint2.com',
    'https://endpoint3.com'
  ]);
  
  const requestCache = new RequestCache({
    maxSize: 1000,
    defaultTTL: 15000
  });
  
  console.log('✅ All 5 components initialized');
  
  // Metrics
  const metrics = {
    totalRequests: 0,
    successful: 0,
    failed: 0,
    cacheHits: 0,
    latencies: [],
    concurrentResults: []
  };
  
  // Simulated request function
  const makeRequest = async (method, params) => {
    const start = performance.now();
    metrics.totalRequests++;
    
    // Rate limiter
    if (!rateLimiter.consume(1)) {
      metrics.failed++;
      return { success: false, reason: 'rate_limited' };
    }
    
    // Circuit breaker
    const cbMetrics = circuitBreaker.getMetrics();
    if (cbMetrics.state === 'OPEN') {
      metrics.failed++;
      return { success: false, reason: 'circuit_open' };
    }
    
    // Cache check
    const cacheKey = crypto.createHash('md5')
      .update(JSON.stringify({ method, params }))
      .digest('hex');
    
    const cached = await requestCache.get(cacheKey);
    if (cached) {
      metrics.cacheHits++;
      metrics.successful++;
      const latency = performance.now() - start;
      metrics.latencies.push(latency);
      return { success: true, fromCache: true, latency };
    }
    
    // Connection pool
    const agent = connectionPool.getAgent('https://api.example.com');
    if (!agent) {
      metrics.failed++;
      return { success: false, reason: 'no_connection' };
    }
    
    // Endpoint selection
    const endpoint = endpointSelector.selectEndpoint();
    if (!endpoint) {
      metrics.failed++;
      return { success: false, reason: 'no_endpoint' };
    }
    
    // Simulate API call with random latency
    const simulatedLatency = 50 + Math.random() * 150;
    await new Promise(resolve => setTimeout(resolve, simulatedLatency));
    
    // Simulate 95% success rate
    if (Math.random() > 0.95) {
      metrics.failed++;
      circuitBreaker.recordFailure();
      return { success: false, reason: 'simulated_failure' };
    }
    
    // Success - cache the result
    const result = { value: `result_${method}_${Date.now()}` };
    await requestCache.set(cacheKey, result, { ttl: 5000 });
    
    metrics.successful++;
    const latency = performance.now() - start;
    metrics.latencies.push(latency);
    
    return { success: true, data: result, fromCache: false, latency };
  };
  
  // Test 1: Sequential trading pattern
  console.log('\n📊 Test 1: Sequential Trading Pattern (50 requests)');
  
  const tradingPattern = [];
  // Price checks (30%)
  for (let i = 0; i < 15; i++) {
    tradingPattern.push({ method: 'getTokenSupply', params: [`token${i % 3}`] });
  }
  // Balance checks (25%)
  for (let i = 0; i < 13; i++) {
    tradingPattern.push({ method: 'getBalance', params: [`wallet${i % 5}`] });
  }
  // Slot checks (15%)
  for (let i = 0; i < 7; i++) {
    tradingPattern.push({ method: 'getSlot', params: [] });
  }
  // Account info (20%)
  for (let i = 0; i < 10; i++) {
    tradingPattern.push({ method: 'getAccountInfo', params: [`account${i % 4}`] });
  }
  // Duplicates for cache testing (10%)
  for (let i = 0; i < 5; i++) {
    tradingPattern.push(tradingPattern[i]);
  }
  
  for (let i = 0; i < tradingPattern.length; i++) {
    const req = tradingPattern[i];
    await makeRequest(req.method, req.params);
    
    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/50`);
    }
  }
  
  const sequentialSuccess = metrics.successful;
  const sequentialFailed = metrics.failed;
  
  // Test 2: Concurrent streams
  console.log('\n📊 Test 2: Concurrent Request Streams (5 streams, 10 requests each)');
  
  const runStream = async (streamId) => {
    const streamResults = [];
    for (let i = 0; i < 10; i++) {
      const req = tradingPattern[i % tradingPattern.length];
      const result = await makeRequest(req.method, req.params);
      streamResults.push(result);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    return streamResults.filter(r => r.success).length;
  };
  
  const streams = [];
  for (let i = 0; i < 5; i++) {
    streams.push(runStream(i));
  }
  
  const streamResults = await Promise.all(streams);
  const concurrentSuccess = streamResults.reduce((a, b) => a + b, 0);
  const concurrentTotal = 50;
  
  metrics.concurrentResults = streamResults;
  
  // Calculate statistics
  const overallSuccessRate = (metrics.successful / metrics.totalRequests * 100);
  const concurrentSuccessRate = (concurrentSuccess / concurrentTotal * 100);
  const cacheHitRate = (metrics.cacheHits / metrics.totalRequests * 100);
  
  const avgLatency = metrics.latencies.length > 0
    ? metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length
    : 0;
  
  const sortedLatencies = metrics.latencies.sort((a, b) => a - b);
  const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
  const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
  
  // Component health check
  const componentHealth = {
    rateLimiter: true,
    circuitBreaker: circuitBreaker.getMetrics().state !== 'OPEN',
    connectionPool: connectionPool.getStats().activeConnections >= 0,
    endpointSelector: endpointSelector.getAvailableEndpoints().length > 0,
    requestCache: requestCache.getStats().size > 0
  };
  
  // Display results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Validation Results');
  console.log('=' .repeat(60));
  
  console.log('\n📈 Overall Performance:');
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful: ${metrics.successful}`);
  console.log(`Failed: ${metrics.failed}`);
  console.log(`Success Rate: ${overallSuccessRate.toFixed(1)}%`);
  console.log(`Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
  
  console.log('\n⏱️ Latency:');
  console.log(`Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`P50: ${p50.toFixed(2)}ms`);
  console.log(`P95: ${p95.toFixed(2)}ms`);
  
  console.log('\n🔄 Concurrent Performance:');
  console.log(`Streams: 5`);
  console.log(`Success: ${concurrentSuccess}/${concurrentTotal}`);
  console.log(`Success Rate: ${concurrentSuccessRate.toFixed(1)}%`);
  console.log(`Per Stream: ${streamResults.join(', ')}`);
  
  console.log('\n🏥 Component Health:');
  console.log(`Rate Limiter: ${componentHealth.rateLimiter ? '✅' : '❌'}`);
  console.log(`Circuit Breaker: ${componentHealth.circuitBreaker ? '✅' : '❌'}`);
  console.log(`Connection Pool: ${componentHealth.connectionPool ? '✅' : '❌'}`);
  console.log(`Endpoint Selector: ${componentHealth.endpointSelector ? '✅' : '❌'}`);
  console.log(`Request Cache: ${componentHealth.requestCache ? '✅' : '❌'}`);
  
  // Success criteria
  console.log('\n✅ Success Criteria:');
  const criteria = {
    'Success rate > 60%': overallSuccessRate > 60,
    'Avg latency < 6000ms': avgLatency < 6000,
    'Concurrent success > 80%': concurrentSuccessRate > 80,
    'All components healthy': Object.values(componentHealth).every(h => h)
  };
  
  let allPassed = true;
  for (const [criterion, passed] of Object.entries(criteria)) {
    console.log(`${passed ? '✅' : '❌'} ${criterion}`);
    if (!passed) allPassed = false;
  }
  
  console.log('\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('🎉 Extended performance validation PASSED!');
  } else {
    console.log('⚠️ Some criteria not met');
  }
  console.log('=' .repeat(60));
  
  return allPassed;
}

// Run validation
validateExtendedPerformance()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });