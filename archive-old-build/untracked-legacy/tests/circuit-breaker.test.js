/**
 * RENAISSANCE-GRADE CIRCUIT BREAKER TEST SUITE
 * 
 * Comprehensive tests validating all critical functionality:
 * - Circuit state transitions
 * - Memory leak prevention
 * - Error classification
 * - Timeout handling
 * - Production edge cases
 */

import { CircuitBreaker, CircuitBreakerManager } from '../services/circuit-breaker.service.js';
import { EventEmitter } from 'events';

// Test utilities
class TestUtils {
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static createMockFunction(shouldFail = false, delay = 0) {
    return async (...args) => {
      if (delay > 0) {
        await TestUtils.sleep(delay);
      }
      
      if (shouldFail) {
        const error = new Error('Mock function failure');
        error.code = 'ECONNREFUSED'; // Infrastructure error
        throw error;
      }
      
      return { success: true, args, timestamp: Date.now() };
    };
  }
  
  static createTimeoutFunction(delay = 100) {
    return async () => {
      await TestUtils.sleep(delay);
      return { success: true, delayed: true };
    };
  }
  
  static createBusinessLogicError() {
    const error = new Error('Invalid input data');
    error.status = 400; // Business logic error
    return error;
  }
  
  static createInfrastructureError() {
    const error = new Error('Connection refused');
    error.code = 'ECONNREFUSED'; // Infrastructure error
    return error;
  }
}

// Test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log('\n🧪 RUNNING RENAISSANCE CIRCUIT BREAKER TESTS\n');
    
    for (const { name, fn } of this.tests) {
      try {
        console.log(`⚡ Testing: ${name}`);
        await fn();
        console.log(`✅ PASS: ${name}\n`);
        this.passed++;
      } catch (error) {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}\n`);
        }
        this.failed++;
      }
    }
    
    const duration = Date.now() - this.startTime;
    console.log(`\n📊 TEST RESULTS:`);
    console.log(`   Total: ${this.tests.length}`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%\n`);
    
    if (this.failed > 0) {
      throw new Error(`${this.failed} tests failed`);
    }
    
    return { passed: this.passed, failed: this.failed, duration };
  }
}

// Assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Test suite
const runner = new TestRunner();

// =============================================================================
// CORE CIRCUIT BREAKER FUNCTIONALITY TESTS
// =============================================================================

runner.test('Circuit breaker initializes correctly', async () => {
  const cb = new CircuitBreaker('test-init');
  
  assertEqual(cb.name, 'test-init');
  assertEqual(cb.state, 'CLOSED');
  assertEqual(cb.failureCount, 0);
  assert(cb.isHealthy());
  assert(cb.isAvailable());
  
  cb.shutdown();
});

runner.test('Circuit breaker executes successful functions', async () => {
  const cb = new CircuitBreaker('test-success');
  const mockFn = TestUtils.createMockFunction(false);
  
  const result = await cb.execute(mockFn, 'arg1', 'arg2');
  
  assert(result.success);
  assertEqual(result.args.length, 2);
  assertEqual(cb.state, 'CLOSED');
  assertEqual(cb.failureCount, 0);
  
  const metrics = cb.getMetrics();
  assertEqual(metrics.totalRequests, 1);
  assertEqual(metrics.totalSuccesses, 1);
  assertEqual(metrics.totalFailures, 0);
  
  cb.shutdown();
});

runner.test('Circuit breaker handles single failure correctly', async () => {
  const cb = new CircuitBreaker('test-single-failure');
  const mockFn = TestUtils.createMockFunction(true);
  
  try {
    await cb.execute(mockFn);
    assert(false, 'Should have thrown error');
  } catch (error) {
    assert(error.message.includes('Mock function failure'));
  }
  
  assertEqual(cb.state, 'CLOSED'); // Should stay closed after single failure
  assertEqual(cb.failureCount, 1);
  
  const metrics = cb.getMetrics();
  assertEqual(metrics.totalRequests, 1);
  assertEqual(metrics.totalSuccesses, 0);
  assertEqual(metrics.totalFailures, 1);
  
  cb.shutdown();
});

// =============================================================================
// CIRCUIT STATE TRANSITION TESTS
// =============================================================================

runner.test('Circuit opens after threshold failures', async () => {
  const cb = new CircuitBreaker('test-open', { failureThreshold: 3 });
  const mockFn = TestUtils.createMockFunction(true);
  
  // Execute 3 failing requests
  for (let i = 0; i < 3; i++) {
    try {
      await cb.execute(mockFn);
      assert(false, 'Should have thrown error');
    } catch (error) {
      // Expected
    }
  }
  
  assertEqual(cb.state, 'OPEN');
  assertEqual(cb.failureCount, 3);
  assert(!cb.isHealthy());
  assert(!cb.isAvailable());
  
  cb.shutdown();
});

runner.test('Open circuit rejects requests immediately', async () => {
  const cb = new CircuitBreaker('test-reject', { failureThreshold: 2 });
  const mockFn = TestUtils.createMockFunction(true);
  
  // Trigger circuit open
  for (let i = 0; i < 2; i++) {
    try {
      await cb.execute(mockFn);
    } catch (error) {
      // Expected
    }
  }
  
  assertEqual(cb.state, 'OPEN');
  
  // Next request should be rejected immediately
  const startTime = Date.now();
  try {
    await cb.execute(TestUtils.createMockFunction(false));
    assert(false, 'Should have thrown error');
  } catch (error) {
    assert(error.message.includes('is OPEN'));
    assert(error.isCircuitOpen);
  }
  
  const duration = Date.now() - startTime;
  assert(duration < 100, 'Should reject immediately, not after timeout');
  
  cb.shutdown();
});

runner.test('Circuit transitions to half-open after timeout', async () => {
  const cb = new CircuitBreaker('test-half-open', { 
    failureThreshold: 2, 
    timeout: 100, // Short timeout for testing
    clockSkewTolerance: 0 
  });
  const mockFn = TestUtils.createMockFunction(true);
  
  // Trigger circuit open
  for (let i = 0; i < 2; i++) {
    try {
      await cb.execute(mockFn);
    } catch (error) {
      // Expected
    }
  }
  
  assertEqual(cb.state, 'OPEN');
  
  // Wait for timeout
  await TestUtils.sleep(150);
  
  // Next request should transition to half-open
  const successFn = TestUtils.createMockFunction(false);
  const result = await cb.execute(successFn);
  
  assert(result.success);
  assertEqual(cb.state, 'HALF_OPEN');
  
  cb.shutdown();
});

runner.test('Half-open circuit closes after success threshold', async () => {
  const cb = new CircuitBreaker('test-close', { 
    failureThreshold: 2,
    successThreshold: 2,
    timeout: 100
  });
  const mockFn = TestUtils.createMockFunction(true);
  const successFn = TestUtils.createMockFunction(false);
  
  // Open circuit
  for (let i = 0; i < 2; i++) {
    try {
      await cb.execute(mockFn);
    } catch (error) {
      // Expected
    }
  }
  
  // Wait for timeout and execute successful request
  await TestUtils.sleep(150);
  await cb.execute(successFn);
  assertEqual(cb.state, 'HALF_OPEN');
  
  // One more success should close circuit
  await cb.execute(successFn);
  assertEqual(cb.state, 'CLOSED');
  assertEqual(cb.failureCount, 0);
  assert(cb.isHealthy());
  
  cb.shutdown();
});

runner.test('Half-open circuit reopens on failure', async () => {
  const cb = new CircuitBreaker('test-reopen', { 
    failureThreshold: 2,
    timeout: 100
  });
  const mockFn = TestUtils.createMockFunction(true);
  const successFn = TestUtils.createMockFunction(false);
  
  // Open circuit
  for (let i = 0; i < 2; i++) {
    try {
      await cb.execute(mockFn);
    } catch (error) {
      // Expected
    }
  }
  
  // Wait for timeout and execute successful request (goes to half-open)
  await TestUtils.sleep(150);
  await cb.execute(successFn);
  assertEqual(cb.state, 'HALF_OPEN');
  
  // Failure in half-open should immediately reopen
  try {
    await cb.execute(mockFn);
    assert(false, 'Should have thrown error');
  } catch (error) {
    // Expected
  }
  
  assertEqual(cb.state, 'OPEN');
  
  cb.shutdown();
});

// =============================================================================
// ERROR CLASSIFICATION TESTS
// =============================================================================

runner.test('Business logic errors do not trip circuit', async () => {
  const cb = new CircuitBreaker('test-business-errors', { failureThreshold: 2 });
  
  const businessErrorFn = async () => {
    throw TestUtils.createBusinessLogicError();
  };
  
  // Execute multiple business logic errors
  for (let i = 0; i < 5; i++) {
    try {
      await cb.execute(businessErrorFn);
      assert(false, 'Should have thrown error');
    } catch (error) {
      assert(error.message.includes('Invalid input data'));
    }
  }
  
  // Circuit should remain closed
  assertEqual(cb.state, 'CLOSED');
  assertEqual(cb.failureCount, 0); // Business errors don't count as failures
  
  const metrics = cb.getMetrics();
  assert(metrics.errorTypeBreakdown.business > 0);
  
  cb.shutdown();
});

runner.test('Infrastructure errors trip circuit correctly', async () => {
  const cb = new CircuitBreaker('test-infra-errors', { failureThreshold: 2 });
  
  const infraErrorFn = async () => {
    throw TestUtils.createInfrastructureError();
  };
  
  // Execute infrastructure errors
  for (let i = 0; i < 2; i++) {
    try {
      await cb.execute(infraErrorFn);
      assert(false, 'Should have thrown error');
    } catch (error) {
      assert(error.message.includes('Connection refused'));
    }
  }
  
  // Circuit should be open
  assertEqual(cb.state, 'OPEN');
  assertEqual(cb.failureCount, 2);
  
  const metrics = cb.getMetrics();
  assert(metrics.errorTypeBreakdown.infrastructure > 0);
  
  cb.shutdown();
});

runner.test('Mixed errors only count infrastructure failures', async () => {
  const cb = new CircuitBreaker('test-mixed-errors', { failureThreshold: 3 });
  
  const businessErrorFn = async () => { throw TestUtils.createBusinessLogicError(); };
  const infraErrorFn = async () => { throw TestUtils.createInfrastructureError(); };
  
  // Mix of business and infrastructure errors
  try { await cb.execute(businessErrorFn); } catch (e) {}
  try { await cb.execute(infraErrorFn); } catch (e) {} // Count: 1
  try { await cb.execute(businessErrorFn); } catch (e) {}
  try { await cb.execute(infraErrorFn); } catch (e) {} // Count: 2
  try { await cb.execute(businessErrorFn); } catch (e) {}
  try { await cb.execute(infraErrorFn); } catch (e) {} // Count: 3 - should open
  
  assertEqual(cb.state, 'OPEN');
  assertEqual(cb.failureCount, 3); // Only infrastructure errors counted
  
  const metrics = cb.getMetrics();
  assert(metrics.errorTypeBreakdown.business > 0);
  assert(metrics.errorTypeBreakdown.infrastructure > 0);
  assertEqual(metrics.totalFailures, 6); // All errors recorded
  
  cb.shutdown();
});

// =============================================================================
// TIMEOUT AND MEMORY MANAGEMENT TESTS
// =============================================================================

runner.test('Functions timeout correctly', async () => {
  const cb = new CircuitBreaker('test-timeout', { 
    timeout: 100,
    failureThreshold: 2
  });
  
  const slowFn = TestUtils.createTimeoutFunction(200); // Slower than timeout
  
  const startTime = Date.now();
  try {
    await cb.execute(slowFn);
    assert(false, 'Should have timed out');
  } catch (error) {
    assert(error.message.includes('timeout'));
    assert(error.code === 'CIRCUIT_BREAKER_TIMEOUT');
  }
  
  const duration = Date.now() - startTime;
  assert(duration >= 100 && duration < 150, `Timeout should be ~100ms, was ${duration}ms`);
  
  assertEqual(cb.failureCount, 1); // Timeout counts as infrastructure failure
  
  cb.shutdown();
});

runner.test('Memory bounds are enforced', async () => {
  const cb = new CircuitBreaker('test-memory', { maxRecentRequests: 5 });
  const successFn = TestUtils.createMockFunction(false);
  
  // Execute more requests than memory limit
  for (let i = 0; i < 10; i++) {
    await cb.execute(successFn);
  }
  
  const metrics = cb.getMetrics();
  assert(metrics.recentRequestsMemoryUsage <= 5, 
    `Memory usage should be <= 5, was ${metrics.recentRequestsMemoryUsage}`);
  assertEqual(metrics.totalRequests, 10); // Total counter not affected
  
  cb.shutdown();
});

runner.test('Active timeouts are cleaned up', async () => {
  const cb = new CircuitBreaker('test-cleanup', { timeout: 50 });
  const fastFn = TestUtils.createTimeoutFunction(10); // Faster than timeout
  
  // Execute function that completes before timeout
  await cb.execute(fastFn);
  
  const metrics = cb.getMetrics();
  assertEqual(metrics.activeTimeouts, 0, 'All timeouts should be cleaned up');
  
  cb.shutdown();
});

runner.test('Timeout cleanup prevents memory leaks', async () => {
  const cb = new CircuitBreaker('test-leak-prevention', { timeout: 100 });
  
  // Execute multiple concurrent operations
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(cb.execute(TestUtils.createTimeoutFunction(10)));
  }
  
  await Promise.all(promises);
  
  // Wait a bit to ensure cleanup
  await TestUtils.sleep(50);
  
  const metrics = cb.getMetrics();
  assertEqual(metrics.activeTimeouts, 0, 'All timeouts should be cleaned up after completion');
  
  cb.shutdown();
});

// =============================================================================
// FALLBACK FUNCTIONALITY TESTS
// =============================================================================

runner.test('Fallback executes when circuit is open', async () => {
  let fallbackCalled = false;
  const fallback = async () => {
    fallbackCalled = true;
    return { fallback: true };
  };
  
  const cb = new CircuitBreaker('test-fallback', { 
    failureThreshold: 2,
    fallback
  });
  
  const mockFn = TestUtils.createMockFunction(true);
  
  // Open circuit
  for (let i = 0; i < 2; i++) {
    try {
      await cb.execute(mockFn);
    } catch (error) {
      // Expected
    }
  }
  
  // Next request should use fallback
  const result = await cb.execute(mockFn);
  assert(fallbackCalled);
  assert(result.fallback);
  
  cb.shutdown();
});

runner.test('Failed fallback throws descriptive error', async () => {
  const fallback = async () => {
    throw new Error('Fallback also failed');
  };
  
  const cb = new CircuitBreaker('test-fallback-fail', { 
    failureThreshold: 1,
    fallback
  });
  
  const mockFn = TestUtils.createMockFunction(true);
  
  // Open circuit
  try {
    await cb.execute(mockFn);
  } catch (error) {
    // Expected
  }
  
  // Next request should fail with descriptive error
  try {
    await cb.execute(mockFn);
    assert(false, 'Should have thrown error');
  } catch (error) {
    assert(error.message.includes('fallback failed'));
    assert(error.originalError);
  }
  
  cb.shutdown();
});

// =============================================================================
// CIRCUIT BREAKER MANAGER TESTS
// =============================================================================

runner.test('CircuitBreakerManager creates and manages circuits', async () => {
  const manager = new CircuitBreakerManager();
  
  const cb1 = manager.getCircuitBreaker('service1');
  const cb2 = manager.getCircuitBreaker('service2');
  const cb1Again = manager.getCircuitBreaker('service1'); // Should return same instance
  
  assert(cb1 === cb1Again, 'Should return same instance for same service name');
  assert(cb1 !== cb2, 'Different services should have different instances');
  
  const metrics = manager.getAllMetrics();
  assertEqual(metrics.totalCircuits, 2);
  assertEqual(metrics.healthyCircuits, 2);
  
  manager.shutdown();
});

runner.test('CircuitBreakerManager execute method works', async () => {
  const manager = new CircuitBreakerManager();
  const mockFn = TestUtils.createMockFunction(false);
  
  const result = await manager.execute('test-service', mockFn, 'arg1');
  
  assert(result.success);
  assertEqual(result.args[0], 'arg1');
  
  const metrics = manager.getAllMetrics();
  assertEqual(metrics.totalCircuits, 1);
  assert(metrics.circuitBreakers['test-service']);
  
  manager.shutdown();
});

runner.test('CircuitBreakerManager tracks system health', async () => {
  const manager = new CircuitBreakerManager();
  
  // Create healthy circuit
  await manager.execute('healthy-service', TestUtils.createMockFunction(false));
  
  // Create unhealthy circuit
  const failFn = TestUtils.createMockFunction(true);
  for (let i = 0; i < 5; i++) {
    try {
      await manager.execute('unhealthy-service', failFn, { failureThreshold: 3 });
    } catch (error) {
      // Expected
    }
  }
  
  const health = manager.getSystemHealth();
  assertEqual(health.totalCircuits, 2);
  assertEqual(health.healthyCircuits, 1);
  assertEqual(health.openCircuits, 1);
  assertEqual(health.status, 'degraded'); // 50% healthy
  assert(health.issues.length > 0);
  
  manager.shutdown();
});

runner.test('CircuitBreakerManager forwards events', async (done) => {
  const manager = new CircuitBreakerManager();
  let eventReceived = false;
  
  manager.on('circuitStateChange', (event) => {
    eventReceived = true;
    assert(event.manager === 'CircuitBreakerManager');
    
    manager.shutdown();
  });
  
  // Trigger state change
  const failFn = TestUtils.createMockFunction(true);
  for (let i = 0; i < 5; i++) {
    try {
      await manager.execute('event-test', failFn, { failureThreshold: 3 });
    } catch (error) {
      // Expected
    }
  }
  
  // Wait a bit for event to fire
  await TestUtils.sleep(10);
  assert(eventReceived, 'Should have received circuit state change event');
});

// =============================================================================
// EDGE CASE AND PRODUCTION SCENARIO TESTS
// =============================================================================

runner.test('High concurrency does not break circuit breaker', async () => {
  const cb = new CircuitBreaker('test-concurrency');
  const mockFn = TestUtils.createMockFunction(false, 10); // Small delay
  
  // Execute many concurrent requests
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(cb.execute(mockFn, i));
  }
  
  const results = await Promise.all(promises);
  
  assertEqual(results.length, 50);
  results.forEach((result, index) => {
    assert(result.success);
    assertEqual(result.args[0], index);
  });
  
  const metrics = cb.getMetrics();
  assertEqual(metrics.totalRequests, 50);
  assertEqual(metrics.totalSuccesses, 50);
  assertEqual(metrics.activeTimeouts, 0);
  
  cb.shutdown();
});

runner.test('Circuit breaker handles rapid open/close cycles', async () => {
  const cb = new CircuitBreaker('test-rapid-cycles', { 
    failureThreshold: 2,
    successThreshold: 1,
    timeout: 50
  });
  
  const failFn = TestUtils.createMockFunction(true);
  const successFn = TestUtils.createMockFunction(false);
  
  // Multiple cycles of failure -> recovery
  for (let cycle = 0; cycle < 3; cycle++) {
    // Cause failures to open circuit
    for (let i = 0; i < 2; i++) {
      try {
        await cb.execute(failFn);
      } catch (error) {
        // Expected
      }
    }
    assertEqual(cb.state, 'OPEN');
    
    // Wait and recover
    await TestUtils.sleep(60);
    await cb.execute(successFn);
    assertEqual(cb.state, 'CLOSED');
  }
  
  // Circuit should be stable
  assert(cb.isHealthy());
  
  cb.shutdown();
});

runner.test('Manual circuit control works correctly', async () => {
  const cb = new CircuitBreaker('test-manual');
  
  // Manual open
  cb.open();
  assertEqual(cb.state, 'OPEN');
  assert(!cb.isAvailable());
  
  // Manual close
  cb.close();
  assertEqual(cb.state, 'CLOSED');
  assert(cb.isHealthy());
  
  // Reset functionality
  cb.failureCount = 3;
  cb.reset();
  assertEqual(cb.failureCount, 0);
  assertEqual(cb.state, 'CLOSED');
  
  cb.shutdown();
});

runner.test('Shutdown cleans up all resources', async () => {
  const cb = new CircuitBreaker('test-shutdown');
  
  // Create some state
  await cb.execute(TestUtils.createMockFunction(false));
  try {
    await cb.execute(TestUtils.createMockFunction(true));
  } catch (error) {
    // Expected
  }
  
  const metricsBeforeShutdown = cb.getMetrics();
  assert(metricsBeforeShutdown.totalRequests > 0);
  
  // Shutdown should clean everything
  cb.shutdown();
  
  // Verify cleanup
  assertEqual(cb.activeTimeouts.size, 0);
  assertEqual(cb.recentRequests.length, 0);
  assertEqual(cb.listenerCount(), 0);
});

// =============================================================================
// PERFORMANCE AND RELIABILITY TESTS
// =============================================================================

runner.test('Circuit breaker performance is acceptable', async () => {
  const cb = new CircuitBreaker('test-performance');
  const fastFn = () => Promise.resolve({ fast: true });
  
  const iterations = 1000;
  const startTime = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    await cb.execute(fastFn);
  }
  
  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1000000;
  
  const avgLatency = durationMs / iterations;
  assert(avgLatency < 1, `Average latency should be < 1ms, was ${avgLatency.toFixed(3)}ms`);
  
  console.log(`   Performance: ${avgLatency.toFixed(3)}ms avg latency over ${iterations} requests`);
  
  cb.shutdown();
});

runner.test('Memory usage stays bounded under load', async () => {
  const cb = new CircuitBreaker('test-memory-load', { maxRecentRequests: 100 });
  const mockFn = TestUtils.createMockFunction(false);
  
  // Execute many requests
  for (let i = 0; i < 1000; i++) {
    await cb.execute(mockFn);
    
    if (i % 100 === 0) {
      const metrics = cb.getMetrics();
      assert(metrics.recentRequestsMemoryUsage <= 100, 
        `Memory should stay <= 100, was ${metrics.recentRequestsMemoryUsage} at iteration ${i}`);
    }
  }
  
  const finalMetrics = cb.getMetrics();
  assert(finalMetrics.recentRequestsMemoryUsage <= 100);
  assertEqual(finalMetrics.totalRequests, 1000);
  
  cb.shutdown();
});

// =============================================================================
// RUN TESTS
// =============================================================================

// Export for external execution
export { runner as testRunner };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runner.run()
    .then((results) => {
      console.log('🎉 ALL TESTS PASSED!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 TESTS FAILED!');
      console.error(error.message);
      process.exit(1);
    });
}