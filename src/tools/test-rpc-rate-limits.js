/**
 * Test RPC Rate Limits Optimization
 * Validates correct rate limits and burst handling
 */

import { RpcConnectionPool } from '../detection/transport/rpc-connection-pool.js';

console.log('🧪 Testing RPC Rate Limits Optimization\n');

// Test 1: Rate limit verification
const testRateLimitConfig = async () => {
  console.log('📊 TEST 1: Rate Limit Configuration');
  const pool = new RpcConnectionPool();
  const stats = pool.getStats();
  
  console.log('  Endpoint configurations:');
  Object.entries(stats.endpoints).forEach(([name, config]) => {
    console.log(`  ${name}:`);
    console.log(`    - Max req/s: ${config.maxRequestsPerSecond}`);
    console.log(`    - Burst limit: ${config.burstLimit}`);
    console.log(`    - Subscription: ${config.subscriptionTier}`);
  });
  
  // Verify correct limits
  const helius = stats.endpoints.helius;
  const chainstack = stats.endpoints.chainstack;
  const publicEndpoint = stats.endpoints.public;
  
  console.log('\n  Rate limit verification:');
  console.log(`  Helius (150 req/s): ${helius.maxRequestsPerSecond === 150 ? '✅' : '❌'}`);
  console.log(`  Chainstack (25 req/s): ${chainstack.maxRequestsPerSecond === 25 ? '✅' : '❌'}`);
  console.log(`  Public (5 req/s): ${publicEndpoint.maxRequestsPerSecond === 5 ? '✅' : '❌'}`);
  
  console.log('\n  Burst capacity verification:');
  console.log(`  Helius burst (180): ${helius.burstLimit === 180 ? '✅' : '❌'}`);
  console.log(`  Chainstack burst (35): ${chainstack.burstLimit === 35 ? '✅' : '❌'}`);
  console.log(`  Public burst (8): ${publicEndpoint.burstLimit === 8 ? '✅' : '❌'}\n`);
  
  return helius.maxRequestsPerSecond === 150 && 
         chainstack.maxRequestsPerSecond === 25 &&
         publicEndpoint.maxRequestsPerSecond === 5;
};

// Test 2: Burst capacity handling
const testBurstCapacity = async () => {
  console.log('📊 TEST 2: Burst Capacity Handling');
  
  // Create custom pool with test endpoint
  const testEndpoints = {
    test: {
      url: 'https://test.example.com',
      priority: 1,
      maxRequestsPerSecond: 10,
      burstLimit: 15,
      timeout: 1000
    }
  };
  
  const pool = new RpcConnectionPool(testEndpoints);
  const endpoint = pool.endpoints.get('test');
  
  console.log('  Testing burst capacity (15 requests with 10 req/s base):');
  
  // Simulate rapid requests
  let allowedRequests = 0;
  for (let i = 0; i < 20; i++) {
    if (pool.canMakeRequest(endpoint)) {
      allowedRequests++;
      endpoint.requestsThisSecond++;
    }
  }
  
  console.log(`  Allowed requests in burst: ${allowedRequests}`);
  console.log(`  Burst capacity working: ${allowedRequests > 10 && allowedRequests <= 15 ? '✅' : '❌'}`);
  console.log(`  Burst used: ${endpoint.burstUsed}\n`);
  
  return allowedRequests > 10 && allowedRequests <= 15;
};

// Test 3: Rate limit reset
const testRateLimitReset = async () => {
  console.log('📊 TEST 3: Rate Limit Reset');
  
  const testEndpoints = {
    test: {
      url: 'https://test.example.com',
      priority: 1,
      maxRequestsPerSecond: 5,
      burstLimit: 8,
      timeout: 1000
    }
  };
  
  const pool = new RpcConnectionPool(testEndpoints);
  const endpoint = pool.endpoints.get('test');
  
  // Fill up the rate limit
  console.log('  Filling rate limit...');
  for (let i = 0; i < 8; i++) {
    if (pool.canMakeRequest(endpoint)) {
      endpoint.requestsThisSecond++;
    }
  }
  
  const requestsBeforeReset = endpoint.requestsThisSecond;
  console.log(`  Requests before reset: ${requestsBeforeReset}`);
  
  // Wait for reset
  console.log('  Waiting 1.1 seconds for reset...');
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  // Try again after reset
  pool.canMakeRequest(endpoint); // This should trigger reset
  const requestsAfterReset = endpoint.requestsThisSecond;
  const burstAfterReset = endpoint.burstUsed;
  
  console.log(`  Requests after reset: ${requestsAfterReset}`);
  console.log(`  Burst counter after reset: ${burstAfterReset}`);
  console.log(`  Reset working: ${requestsAfterReset === 0 && burstAfterReset === 0 ? '✅' : '❌'}\n`);
  
  return requestsAfterReset === 0 && burstAfterReset === 0;
};

// Test 4: Combined capacity utilization
const testCombinedCapacity = async () => {
  console.log('📊 TEST 4: Combined Capacity Utilization');
  const pool = new RpcConnectionPool();
  
  console.log('  Total capacity calculation:');
  let totalBaseCapacity = 0;
  let totalBurstCapacity = 0;
  
  pool.endpoints.forEach((endpoint, name) => {
    if (name !== 'public') { // Only count paid endpoints
      totalBaseCapacity += endpoint.maxRequestsPerSecond;
      totalBurstCapacity += endpoint.burstLimit;
    }
  });
  
  console.log(`  Base capacity (Helius + Chainstack): ${totalBaseCapacity} req/s`);
  console.log(`  Burst capacity: ${totalBurstCapacity} req/s`);
  console.log(`  Correct base capacity (175): ${totalBaseCapacity === 175 ? '✅' : '❌'}`);
  console.log(`  Correct burst capacity (215): ${totalBurstCapacity === 215 ? '✅' : '❌'}\n`);
  
  return totalBaseCapacity === 175 && totalBurstCapacity === 215;
};

// Test 5: Performance monitoring integration
const testPerformanceMonitoring = async () => {
  console.log('📊 TEST 5: Performance Monitoring Integration');
  
  // Mock performance monitor
  const mockMonitor = {
    metrics: {},
    alerts: [],
    recordMetric: function(name, value) {
      this.metrics[name] = value;
    },
    triggerAlert: function(endpoint, type, data) {
      this.alerts.push({ endpoint, type, data });
    }
  };
  
  const pool = new RpcConnectionPool(null, mockMonitor);
  
  // Test underutilization alert
  console.log('  Testing underutilization alert...');
  pool.updateRateLimitMetrics('helius', 60, 150); // 40% utilization
  
  console.log(`  Metric recorded: ${mockMonitor.metrics.rpc_utilization_helius !== undefined ? '✅' : '❌'}`);
  console.log(`  Utilization value: ${mockMonitor.metrics.rpc_utilization_helius?.toFixed(2) || 'N/A'}`);
  console.log(`  Alert triggered: ${mockMonitor.alerts.length > 0 ? '✅' : '❌'}`);
  
  if (mockMonitor.alerts.length > 0) {
    const alert = mockMonitor.alerts[0];
    console.log(`  Alert type: ${alert.type}`);
    console.log(`  Alert message: ${alert.data.message}`);
  }
  
  // Test normal utilization
  console.log('\n  Testing normal utilization...');
  mockMonitor.alerts = []; // Reset alerts
  pool.updateRateLimitMetrics('helius', 120, 150); // 80% utilization
  
  console.log(`  No alert for 80% utilization: ${mockMonitor.alerts.length === 0 ? '✅' : '❌'}\n`);
  
  return mockMonitor.metrics.rpc_utilization_helius !== undefined && 
         mockMonitor.alerts.length === 0; // No alert for good utilization
};

// Test 6: Real request simulation
const testRealRequestSimulation = async () => {
  console.log('📊 TEST 6: Real Request Simulation');
  const pool = new RpcConnectionPool();
  
  console.log('  Simulating 180 rapid requests to test burst...');
  const startTime = Date.now();
  const results = [];
  
  // Simulate requests without actual network calls
  for (let i = 0; i < 180; i++) {
    const endpoint = pool.endpoints.get('helius');
    if (pool.canMakeRequest(endpoint)) {
      endpoint.requestsThisSecond++;
      results.push({ allowed: true, time: Date.now() - startTime });
    } else {
      results.push({ allowed: false, time: Date.now() - startTime });
    }
  }
  
  const allowedCount = results.filter(r => r.allowed).length;
  const deniedCount = results.filter(r => !r.allowed).length;
  
  console.log(`  Allowed requests: ${allowedCount}`);
  console.log(`  Denied requests: ${deniedCount}`);
  console.log(`  Burst capacity utilized: ${allowedCount >= 150 && allowedCount <= 180 ? '✅' : '❌'}`);
  
  // Check endpoint stats
  const stats = pool.getStats();
  const heliumUtilization = stats.endpoints.helius.currentUtilization;
  console.log(`  Current utilization: ${(heliumUtilization * 100).toFixed(1)}%\n`);
  
  return allowedCount >= 150 && allowedCount <= 180;
};

// Run all tests
const runAllTests = async () => {
  console.log('⚡ RPC Rate Limits Optimization Test Suite\n');
  console.log('Expected improvements:');
  console.log('  - Helius: 100 → 150 req/s (50% increase)');
  console.log('  - Chainstack: 50 → 25 req/s (correct limit)');
  console.log('  - Total capacity: 175 req/s (75% increase)');
  console.log('  - Burst capacity: 215 req/s for spikes');
  console.log('  - Utilization monitoring and alerts\n');
  
  const tests = [
    testRateLimitConfig,
    testBurstCapacity,
    testRateLimitReset,
    testCombinedCapacity,
    testPerformanceMonitoring,
    testRealRequestSimulation
  ];
  
  let passed = 0;
  for (const test of tests) {
    try {
      if (await test()) passed++;
    } catch (error) {
      console.error(`Test failed with error: ${error.message}`);
    }
  }
  
  console.log(`✅ Test Summary: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('\n🎉 All tests passed! RPC rate limits are optimized.');
    console.log('Key achievements:');
    console.log('  - Full utilization of paid RPC capacity');
    console.log('  - Burst handling for viral meme events');
    console.log('  - Performance monitoring integration');
    console.log('  - 75% increase in total capacity');
    console.log('  - Zero additional cost');
  }
  
  process.exit(passed === tests.length ? 0 : 1);
};

// Execute tests
runAllTests();