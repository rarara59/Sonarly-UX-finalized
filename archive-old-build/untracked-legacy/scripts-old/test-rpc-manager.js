#!/usr/bin/env node

/**
 * Test script for RpcManager orchestrator with mock components
 * Validates orchestration patterns and component integration
 */

import { RpcManager } from '../src/detection/transport/rpc-manager.js';
import { EventEmitter } from 'events';

// Mock component implementations
class MockTokenBucket {
  constructor() {
    this.tokens = 100;
  }
  
  async initialize() {
    console.log('  TokenBucket initialized');
    return true;
  }
  
  async hasTokens(count = 1) {
    return this.tokens >= count;
  }
  
  async consume(count = 1) {
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
  
  async healthCheck() {
    return true;
  }
}

class MockCircuitBreaker {
  constructor() {
    this.state = 'CLOSED';
    this.failures = 0;
  }
  
  async initialize() {
    console.log('  CircuitBreaker initialized');
    return true;
  }
  
  async execute(key, fn) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= 5) {
        this.state = 'OPEN';
      }
      throw error;
    }
  }
  
  async healthCheck() {
    return this.state !== 'OPEN';
  }
}

class MockEndpointSelector {
  constructor() {
    this.endpoints = ['endpoint1', 'endpoint2', 'endpoint3'];
    this.currentIndex = 0;
  }
  
  async initialize(connectionPool) {
    console.log('  EndpointSelector initialized');
    this.connectionPool = connectionPool;
    return true;
  }
  
  async selectEndpoint(method, options) {
    const endpoint = this.endpoints[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
    return endpoint;
  }
  
  async selectBackupEndpoint() {
    return this.endpoints[(this.currentIndex + 1) % this.endpoints.length];
  }
  
  async healthCheck() {
    return true;
  }
}

class MockRequestCache {
  constructor() {
    this.cache = new Map();
  }
  
  async initialize() {
    console.log('  RequestCache initialized');
    return true;
  }
  
  async get(key) {
    return this.cache.get(key);
  }
  
  async set(key, value, ttl = 1000) {
    this.cache.set(key, value);
    setTimeout(() => this.cache.delete(key), ttl);
    return true;
  }
  
  async healthCheck() {
    return true;
  }
}

class MockBatchManager {
  constructor() {
    this.pendingRequests = [];
  }
  
  async initialize(connectionPool) {
    console.log('  BatchManager initialized');
    this.connectionPool = connectionPool;
    return true;
  }
  
  async addRequest(method, params, executor) {
    // For testing, execute immediately without batching
    return executor([{ method, params }]);
  }
  
  async healthCheck() {
    return true;
  }
}

class MockHedgedManager {
  constructor() {
    this.hedgeCount = 0;
  }
  
  async initialize(connectionPool, endpointSelector) {
    console.log('  HedgedManager initialized');
    this.connectionPool = connectionPool;
    this.endpointSelector = endpointSelector;
    return true;
  }
  
  async hedgedRequest(primaryRequest, backupRequests, delay = 100) {
    this.hedgeCount++;
    
    // For testing, just execute primary request
    try {
      return await primaryRequest();
    } catch (error) {
      if (backupRequests.length > 0) {
        return await backupRequests[0]();
      }
      throw error;
    }
  }
  
  async healthCheck() {
    return true;
  }
}

class MockConnectionPool extends EventEmitter {
  constructor() {
    super();
    this.requestCount = 0;
  }
  
  async initialize() {
    console.log('  ConnectionPool initialized');
    return true;
  }
  
  async execute(method, params) {
    this.requestCount++;
    // Simulate RPC response
    return {
      jsonrpc: '2.0',
      id: this.requestCount,
      result: {
        slot: 123456789,
        method,
        params
      }
    };
  }
  
  async executeWithEndpoint(endpoint, method, params) {
    this.requestCount++;
    // Simulate RPC response with endpoint info
    return {
      jsonrpc: '2.0',
      id: this.requestCount,
      result: {
        slot: 123456789,
        endpoint,
        method,
        params
      }
    };
  }
  
  async healthCheck() {
    return true;
  }
  
  async shutdown() {
    console.log('  ConnectionPool shutdown');
    return true;
  }
}

// Test runner
async function runTests() {
  console.log('🧪 RpcManager Orchestrator Test Suite');
  console.log('=' .repeat(60));
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Component initialization
  console.log('\n📦 Test 1: Component Initialization');
  console.log('-' .repeat(40));
  
  try {
    const manager = new RpcManager({
      enableRateLimiting: true,
      enableCircuitBreaker: true,
      enableCaching: true,
      enableBatching: true,
      enableHedging: true
    });
    
    const components = {
      tokenBucket: new MockTokenBucket(),
      circuitBreaker: new MockCircuitBreaker(),
      endpointSelector: new MockEndpointSelector(),
      requestCache: new MockRequestCache(),
      batchManager: new MockBatchManager(),
      hedgedManager: new MockHedgedManager(),
      connectionPool: new MockConnectionPool()
    };
    
    const startTime = Date.now();
    await manager.initialize(components);
    const initTime = Date.now() - startTime;
    
    console.log(`✅ Initialization completed in ${initTime}ms`);
    
    // Verify all components are healthy
    const health = manager.getHealth();
    if (health.healthPercentage === 100) {
      console.log('✅ All components healthy');
      testsPassed++;
    } else {
      console.log(`❌ Only ${health.healthPercentage}% components healthy`);
      testsFailed++;
    }
    
    // Test 2: Request orchestration flow
    console.log('\n🔄 Test 2: Request Orchestration Flow');
    console.log('-' .repeat(40));
    
    const result = await manager.call('getSlot', []);
    
    if (result && result.result && result.result.slot) {
      console.log(`✅ Request completed successfully: slot ${result.result.slot}`);
      testsPassed++;
    } else {
      console.log('❌ Request failed');
      testsFailed++;
    }
    
    // Test 3: Component usage tracking
    console.log('\n📊 Test 3: Component Usage Tracking');
    console.log('-' .repeat(40));
    
    let componentUsageCount = 0;
    manager.on('request-complete', (data) => {
      console.log(`  Components used: ${data.componentsUsed.join(', ')}`);
      componentUsageCount = data.componentsUsed.length;
    });
    
    await manager.call('getAccountInfo', ['test-account']);
    
    if (componentUsageCount >= 3) {
      console.log(`✅ ${componentUsageCount} components used in request`);
      testsPassed++;
    } else {
      console.log(`❌ Only ${componentUsageCount} components used`);
      testsFailed++;
    }
    
    // Test 4: Caching functionality
    console.log('\n💾 Test 4: Caching Functionality');
    console.log('-' .repeat(40));
    
    const cacheTestMethod = 'getBalance';
    const cacheTestParams = ['cache-test-account'];
    
    // First call - should not be cached
    const result1 = await manager.call(cacheTestMethod, cacheTestParams);
    const poolRequests1 = components.connectionPool.requestCount;
    
    // Second call - should be cached
    const result2 = await manager.call(cacheTestMethod, cacheTestParams);
    const poolRequests2 = components.connectionPool.requestCount;
    
    if (poolRequests2 === poolRequests1) {
      console.log('✅ Second request served from cache');
      testsPassed++;
    } else {
      console.log('❌ Cache not working');
      testsFailed++;
    }
    
    // Test 5: Orchestration overhead
    console.log('\n⏱️  Test 5: Orchestration Overhead');
    console.log('-' .repeat(40));
    
    const overheadTestCount = 10;
    const overheadStart = Date.now();
    
    for (let i = 0; i < overheadTestCount; i++) {
      await manager.call('getSlot', [], { cache: false });
    }
    
    const totalTime = Date.now() - overheadStart;
    const avgTime = totalTime / overheadTestCount;
    
    console.log(`  Average request time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 10) {
      console.log('✅ Orchestration overhead < 10ms');
      testsPassed++;
    } else {
      console.log(`❌ Orchestration overhead ${avgTime.toFixed(2)}ms > 10ms target`);
      testsFailed++;
    }
    
    // Test 6: Graceful degradation
    console.log('\n🛡️  Test 6: Graceful Degradation');
    console.log('-' .repeat(40));
    
    // Simulate component failure
    components.tokenBucket.hasTokens = async () => { throw new Error('TokenBucket failed'); };
    manager.componentHealth.tokenBucket.healthy = false;
    
    try {
      const degradedResult = await manager.call('getSlot', []);
      if (degradedResult && degradedResult.result) {
        console.log('✅ Request succeeded despite TokenBucket failure');
        testsPassed++;
      } else {
        console.log('❌ Request failed with component failure');
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ System failed to degrade gracefully:', error.message);
      testsFailed++;
    }
    
    // Test 7: System health reporting
    console.log('\n🏥 Test 7: System Health Reporting');
    console.log('-' .repeat(40));
    
    const systemHealth = manager.getHealth();
    console.log(`  Health: ${systemHealth.healthPercentage.toFixed(1)}%`);
    console.log(`  Success rate: ${systemHealth.metrics.successRate}%`);
    console.log(`  Avg overhead: ${systemHealth.metrics.avgOrchestrationOverhead}ms`);
    console.log(`  Active requests: ${systemHealth.metrics.activeRequests}`);
    
    if (systemHealth.healthy && systemHealth.healthPercentage >= 80) {
      console.log('✅ System maintains 80%+ capability');
      testsPassed++;
    } else {
      console.log('❌ System below 80% capability threshold');
      testsFailed++;
    }
    
    // Test 8: Shutdown sequence
    console.log('\n🔌 Test 8: Graceful Shutdown');
    console.log('-' .repeat(40));
    
    try {
      await manager.shutdown();
      console.log('✅ Graceful shutdown completed');
      testsPassed++;
    } catch (error) {
      console.log('❌ Shutdown failed:', error.message);
      testsFailed++;
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
    testsFailed++;
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`  Tests Passed: ${testsPassed}`);
  console.log(`  Tests Failed: ${testsFailed}`);
  console.log(`  Success Rate: ${(testsPassed / (testsPassed + testsFailed) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n✅ All tests passed! RpcManager orchestrator is working correctly.');
  } else {
    console.log(`\n⚠️  ${testsFailed} tests failed. Review implementation.`);
  }
}

// Performance metrics test
async function runPerformanceTest() {
  console.log('\n\n📈 Performance Metrics Test');
  console.log('=' .repeat(60));
  
  const manager = new RpcManager({
    enableRateLimiting: true,
    enableCircuitBreaker: true,
    enableCaching: true,
    enableBatching: true,
    enableHedging: true
  });
  
  const components = {
    tokenBucket: new MockTokenBucket(),
    circuitBreaker: new MockCircuitBreaker(),
    endpointSelector: new MockEndpointSelector(),
    requestCache: new MockRequestCache(),
    batchManager: new MockBatchManager(),
    hedgedManager: new MockHedgedManager(),
    connectionPool: new MockConnectionPool()
  };
  
  await manager.initialize(components);
  
  // Measure startup time
  console.log(`\n⏱️  Startup time: ${manager.metrics.startupTime}ms`);
  console.log(`  Target: <5000ms`);
  console.log(`  Result: ${manager.metrics.startupTime < 5000 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Measure memory overhead
  const memoryBefore = process.memoryUsage().heapUsed;
  const requests = [];
  
  for (let i = 0; i < 100; i++) {
    requests.push(manager.call('getSlot', []));
  }
  
  await Promise.all(requests);
  
  const memoryAfter = process.memoryUsage().heapUsed;
  const memoryOverhead = (memoryAfter - memoryBefore) / 1024 / 1024;
  
  console.log(`\n💾 Memory overhead: ${memoryOverhead.toFixed(2)}MB`);
  console.log(`  Target: <10MB`);
  console.log(`  Result: ${memoryOverhead < 10 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Measure orchestration latency
  const latencies = [];
  for (let i = 0; i < 50; i++) {
    const start = Date.now();
    await manager.call('getSlot', []);
    latencies.push(Date.now() - start);
  }
  
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
  
  console.log(`\n⚡ Orchestration latency:`);
  console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`  P95: ${p95Latency}ms`);
  console.log(`  Target: <10ms`);
  console.log(`  Result: ${avgLatency < 10 ? '✅ PASS' : '❌ FAIL'}`);
  
  await manager.shutdown();
}

// Main execution
async function main() {
  await runTests();
  await runPerformanceTest();
  
  console.log('\n🎯 RpcManager orchestrator validation complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});