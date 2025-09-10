#!/usr/bin/env node

/**
 * Comprehensive Test Suite for CircuitBreaker Component
 * Tests state transitions, failure thresholds, recovery cycles, and service isolation
 */

import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { performance } from 'perf_hooks';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  metric: (msg) => console.log(`${colors.magenta}📊 ${msg}${colors.reset}`)
};

// Mock service class for testing
class MockService {
  constructor(name, failureRate = 0) {
    this.name = name;
    this.failureRate = failureRate;
    this.callCount = 0;
    this.shouldFail = false;
    this.nextResults = [];
  }
  
  async execute() {
    this.callCount++;
    
    // Check if we have predetermined results
    if (this.nextResults.length > 0) {
      const result = this.nextResults.shift();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.value;
    }
    
    // Use failure flag or rate
    if (this.shouldFail || Math.random() < this.failureRate) {
      throw new Error(`Mock service ${this.name} failed`);
    }
    
    return `Success from ${this.name}`;
  }
  
  setFailure(shouldFail) {
    this.shouldFail = shouldFail;
  }
  
  setNextResults(results) {
    this.nextResults = results;
  }
  
  reset() {
    this.callCount = 0;
    this.shouldFail = false;
    this.nextResults = [];
  }
}

// Test utilities
class TestUtils {
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static measureTime(fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, duration: end - start };
  }
  
  static async measureAsyncTime(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  }
  
  static getMemoryUsageMB() {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  
  static calculateAccuracy(actual, expected, tolerance = 0.05) {
    const diff = Math.abs(actual - expected);
    const percentDiff = diff / expected;
    return percentDiff <= tolerance;
  }
}

// Main test suite
class CircuitBreakerTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
      metrics: {}
    };
  }
  
  /**
   * Test 1: CLOSED → OPEN State Transition
   */
  async testClosedToOpenTransition() {
    log.test('Testing CLOSED → OPEN state transition...');
    
    const breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 1000,
      monitoringPeriod: 10000
    });
    
    const service = new MockService('test-service');
    service.setFailure(true);
    
    let failures = 0;
    let opened = false;
    
    // Execute until circuit opens
    for (let i = 0; i < 10; i++) {
      try {
        await breaker.execute('test-service', () => service.execute());
      } catch (error) {
        failures++;
        if (error.message.includes('Circuit breaker is OPEN')) {
          opened = true;
          break;
        }
      }
    }
    
    const serviceState = breaker.getServiceState('test-service');
    
    log.metric(`Failures before opening: ${failures}`);
    log.metric(`Circuit state: ${serviceState?.state}`);
    log.metric(`Failure count: ${serviceState?.failures}`);
    log.metric(`Circuit opened: ${opened}`);
    
    this.results.metrics.failuresBeforeOpen = failures;
    
    // Should open after exactly 5 failures (threshold)
    if (failures === 5 && opened && serviceState?.state === 'OPEN') {
      log.success(`CLOSED → OPEN transition test passed - Opened after exactly ${failures} failures`);
      this.results.passed++;
      return true;
    } else {
      log.error(`CLOSED → OPEN transition test failed - ${failures} failures, state: ${serviceState?.state}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 2: OPEN → HALF_OPEN → CLOSED Recovery Cycle
   */
  async testRecoveryCycle() {
    log.test('Testing OPEN → HALF_OPEN → CLOSED recovery cycle...');
    
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 500, // 500ms for faster testing
      successThreshold: 2,
      monitoringPeriod: 10000
    });
    
    const service = new MockService('recovery-service');
    
    // Phase 1: Open the circuit
    service.setFailure(true);
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.execute('recovery-service', () => service.execute());
      } catch (error) {
        // Expected failures
      }
    }
    
    let state1 = breaker.getServiceState('recovery-service');
    log.info(`Phase 1 - Circuit state: ${state1?.state}`);
    
    // Phase 2: Wait for reset timeout and enter HALF_OPEN
    await TestUtils.sleep(600);
    service.setFailure(false); // Service recovers
    
    let halfOpenDetected = false;
    let successCount = 0;
    
    // Phase 3: Send successful requests to transition to CLOSED
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.execute('recovery-service', () => service.execute());
        successCount++;
        
        const currentState = breaker.getServiceState('recovery-service');
        if (currentState?.state === 'HALF_OPEN') {
          halfOpenDetected = true;
        }
      } catch (error) {
        log.warn(`Unexpected error in recovery: ${error.message}`);
      }
    }
    
    const finalState = breaker.getServiceState('recovery-service');
    
    log.metric(`Half-open detected: ${halfOpenDetected}`);
    log.metric(`Successful calls: ${successCount}`);
    log.metric(`Final state: ${finalState?.state}`);
    
    this.results.metrics.recoverySuccesses = successCount;
    
    if (state1?.state === 'OPEN' && halfOpenDetected && finalState?.state === 'CLOSED') {
      log.success(`Recovery cycle test passed - Complete OPEN → HALF_OPEN → CLOSED transition`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Recovery cycle test failed - Final state: ${finalState?.state}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 3: Failure Threshold Precision
   */
  async testFailureThresholdPrecision() {
    log.test('Testing failure threshold precision...');
    
    const threshold = 10;
    const breaker = new CircuitBreaker({
      failureThreshold: threshold,
      resetTimeout: 5000,
      monitoringPeriod: 10000
    });
    
    const service = new MockService('threshold-test');
    const results = [];
    
    // Set up exact failure sequence
    for (let i = 0; i < threshold - 1; i++) {
      results.push({ error: 'Controlled failure' });
    }
    results.push({ value: 'Success' }); // One success before threshold
    results.push({ error: 'Final failure' }); // This should trigger OPEN
    
    service.setNextResults(results);
    
    let openedAtFailure = -1;
    let totalCalls = 0;
    
    for (let i = 0; i < 15; i++) {
      totalCalls++;
      try {
        await breaker.execute('threshold-test', () => service.execute());
      } catch (error) {
        if (error.message.includes('Circuit breaker is OPEN')) {
          openedAtFailure = i;
          break;
        }
      }
    }
    
    const state = breaker.getServiceState('threshold-test');
    
    log.metric(`Threshold: ${threshold}`);
    log.metric(`Opened at call: ${openedAtFailure}`);
    log.metric(`Circuit state: ${state?.state}`);
    log.metric(`Failure count: ${state?.failures}`);
    
    this.results.metrics.thresholdPrecision = Math.abs(openedAtFailure - threshold);
    
    // Should open exactly at threshold
    if (openedAtFailure === threshold && state?.state === 'OPEN') {
      log.success(`Threshold precision test passed - Opened at exactly ${threshold} failures`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Threshold precision test failed - Opened at ${openedAtFailure}, expected ${threshold}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 4: Cooldown Timing Accuracy
   */
  async testCooldownTimingAccuracy() {
    log.test('Testing cooldown timing accuracy...');
    
    const resetTimeout = 1000; // 1 second
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeout: resetTimeout,
      monitoringPeriod: 10000
    });
    
    const service = new MockService('timing-test');
    
    // Open the circuit
    service.setFailure(true);
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute('timing-test', () => service.execute());
      } catch (error) {
        // Expected
      }
    }
    
    const openTime = Date.now();
    service.setFailure(false); // Service recovers
    
    // Poll for state change
    let attempts = 0;
    let halfOpenTime = 0;
    while (attempts < 50) { // Max 5 seconds
      await TestUtils.sleep(100);
      attempts++;
      
      try {
        await breaker.execute('timing-test', () => service.execute());
        halfOpenTime = Date.now();
        break; // Successfully executed, must be HALF_OPEN or CLOSED
      } catch (error) {
        if (!error.message.includes('Circuit breaker is OPEN')) {
          log.warn(`Unexpected error: ${error.message}`);
        }
      }
    }
    
    const actualCooldown = halfOpenTime > 0 ? halfOpenTime - openTime : 0;
    const accuracy = TestUtils.calculateAccuracy(actualCooldown, resetTimeout, 0.05);
    
    log.metric(`Configured timeout: ${resetTimeout}ms`);
    log.metric(`Actual cooldown: ${actualCooldown}ms`);
    log.metric(`Difference: ${Math.abs(actualCooldown - resetTimeout)}ms`);
    log.metric(`Within 5% tolerance: ${accuracy}`);
    
    this.results.metrics.cooldownAccuracy = (actualCooldown / resetTimeout) * 100;
    
    if (accuracy && halfOpenTime > 0) {
      log.success(`Cooldown timing test passed - ${actualCooldown}ms (within 5% of ${resetTimeout}ms)`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Cooldown timing test failed - ${actualCooldown}ms (expected ~${resetTimeout}ms)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 5: Per-Service Isolation
   */
  async testServiceIsolation() {
    log.test('Testing per-service isolation...');
    
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 10000
    });
    
    const numServices = 100;
    const services = [];
    
    // Create services with different failure patterns
    for (let i = 0; i < numServices; i++) {
      const service = new MockService(`service-${i}`);
      // Half will fail, half will succeed
      service.setFailure(i % 2 === 0);
      services.push(service);
    }
    
    // Execute calls for all services
    const results = {
      open: 0,
      closed: 0,
      errors: 0
    };
    
    // Make enough calls to trigger circuit breaker for failing services
    for (let round = 0; round < 5; round++) {
      for (let i = 0; i < numServices; i++) {
        try {
          await breaker.execute(`service-${i}`, () => services[i].execute());
        } catch (error) {
          // Count errors but continue
        }
      }
    }
    
    // Check final states
    for (let i = 0; i < numServices; i++) {
      const state = breaker.getServiceState(`service-${i}`);
      if (state?.state === 'OPEN') {
        results.open++;
      } else if (state?.state === 'CLOSED') {
        results.closed++;
      }
    }
    
    const metrics = breaker.getMetrics();
    
    log.metric(`Total services: ${numServices}`);
    log.metric(`Open circuits: ${results.open}`);
    log.metric(`Closed circuits: ${results.closed}`);
    log.metric(`Total tracked: ${metrics.totalServices}`);
    
    this.results.metrics.servicesTracked = metrics.totalServices;
    this.results.metrics.openCircuits = results.open;
    
    // Should have ~50 open (failing) and ~50 closed (succeeding)
    if (results.open >= 45 && results.open <= 55 && 
        results.closed >= 45 && results.closed <= 55 &&
        metrics.totalServices === numServices) {
      log.success(`Service isolation test passed - ${numServices} services tracked independently`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Service isolation test failed - Open: ${results.open}, Closed: ${results.closed}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 6: State Check Latency
   */
  async testStateCheckLatency() {
    log.test('Testing state check latency...');
    
    const breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 1000
    });
    
    const service = new MockService('latency-test');
    const iterations = 10000;
    const latencies = [];
    
    // Warm up
    for (let i = 0; i < 100; i++) {
      await breaker.execute('latency-test', () => service.execute());
    }
    
    // Measure latencies
    for (let i = 0; i < iterations; i++) {
      const { duration } = await TestUtils.measureAsyncTime(async () => {
        await breaker.execute('latency-test', () => service.execute());
      });
      latencies.push(duration);
    }
    
    // Calculate statistics
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(iterations * 0.5)];
    const p95 = sortedLatencies[Math.floor(iterations * 0.95)];
    const p99 = sortedLatencies[Math.floor(iterations * 0.99)];
    const maxLatency = sortedLatencies[iterations - 1];
    
    log.metric(`Iterations: ${iterations}`);
    log.metric(`Average latency: ${avgLatency.toFixed(3)}ms`);
    log.metric(`P50 latency: ${p50.toFixed(3)}ms`);
    log.metric(`P95 latency: ${p95.toFixed(3)}ms`);
    log.metric(`P99 latency: ${p99.toFixed(3)}ms`);
    log.metric(`Max latency: ${maxLatency.toFixed(3)}ms`);
    
    this.results.metrics.avgExecuteLatency = avgLatency;
    this.results.metrics.p99ExecuteLatency = p99;
    
    if (avgLatency < 1.0 && p99 < 1.0) {
      log.success(`State check latency test passed - Avg: ${avgLatency.toFixed(3)}ms, P99: ${p99.toFixed(3)}ms`);
      this.results.passed++;
      return true;
    } else {
      log.error(`State check latency test failed - Avg: ${avgLatency.toFixed(3)}ms (target: <1ms)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 7: Memory Per Service
   */
  async testMemoryPerService() {
    log.test('Testing memory usage per service...');
    
    const breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 1000
    });
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const initialMemory = TestUtils.getMemoryUsageMB();
    log.info(`Initial memory: ${initialMemory.toFixed(2)}MB`);
    
    const numServices = 100;
    const services = [];
    
    // Create and execute calls for many services
    for (let i = 0; i < numServices; i++) {
      const service = new MockService(`mem-service-${i}`);
      services.push(service);
      
      // Execute some calls to populate state
      for (let j = 0; j < 10; j++) {
        try {
          await breaker.execute(`mem-service-${i}`, () => service.execute());
        } catch (error) {
          // Ignore errors
        }
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      await TestUtils.sleep(100);
    }
    
    const finalMemory = TestUtils.getMemoryUsageMB();
    const memoryIncrease = finalMemory - initialMemory;
    const memoryPerService = (memoryIncrease * 1024) / numServices; // KB per service
    
    const metrics = breaker.getMetrics();
    
    log.metric(`Services tracked: ${metrics.totalServices}`);
    log.metric(`Initial memory: ${initialMemory.toFixed(2)}MB`);
    log.metric(`Final memory: ${finalMemory.toFixed(2)}MB`);
    log.metric(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    log.metric(`Memory per service: ${memoryPerService.toFixed(2)}KB`);
    
    this.results.metrics.memoryPerServiceKB = memoryPerService;
    
    if (memoryPerService < 1.0) { // Less than 1KB per service
      log.success(`Memory per service test passed - ${memoryPerService.toFixed(2)}KB per service`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Memory per service test failed - ${memoryPerService.toFixed(2)}KB per service (target: <1KB)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 8: Concurrent Safety
   */
  async testConcurrentSafety() {
    log.test('Testing concurrent execution safety...');
    
    const breaker = new CircuitBreaker({
      failureThreshold: 50,
      resetTimeout: 1000
    });
    
    const service = new MockService('concurrent-test');
    const concurrentCalls = 1000;
    const promises = [];
    
    let successCount = 0;
    let failureCount = 0;
    let errors = [];
    
    // Launch concurrent calls
    for (let i = 0; i < concurrentCalls; i++) {
      const promise = breaker.execute('concurrent-test', async () => {
        // Add some randomness
        if (Math.random() < 0.1) {
          await TestUtils.sleep(Math.random() * 10);
        }
        
        if (Math.random() < 0.3) { // 30% failure rate
          throw new Error(`Concurrent failure ${i}`);
        }
        
        return `Success ${i}`;
      }).then(() => {
        successCount++;
      }).catch((error) => {
        failureCount++;
        if (!error.message.includes('Circuit breaker is OPEN') && 
            !error.message.includes('Concurrent failure')) {
          errors.push(error.message);
        }
      });
      
      promises.push(promise);
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const state = breaker.getServiceState('concurrent-test');
    
    log.metric(`Concurrent calls: ${concurrentCalls}`);
    log.metric(`Duration: ${duration}ms`);
    log.metric(`Successes: ${successCount}`);
    log.metric(`Failures: ${failureCount}`);
    log.metric(`Unexpected errors: ${errors.length}`);
    log.metric(`Final state: ${state?.state}`);
    
    this.results.metrics.concurrentDuration = duration;
    this.results.metrics.concurrentErrors = errors.length;
    
    // Check for race conditions or corruption
    const totalProcessed = successCount + failureCount;
    const noRaceConditions = totalProcessed === concurrentCalls && errors.length === 0;
    
    if (noRaceConditions) {
      log.success(`Concurrent safety test passed - ${concurrentCalls} calls processed without race conditions`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Concurrent safety test failed - Processed: ${totalProcessed}/${concurrentCalls}, Errors: ${errors.length}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 9: Recovery Detection Speed
   */
  async testRecoveryDetectionSpeed() {
    log.test('Testing recovery detection speed...');
    
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 500,
      successThreshold: 3, // Need 3 successes to close
      monitoringPeriod: 10000
    });
    
    const service = new MockService('recovery-speed');
    
    // Open the circuit
    service.setFailure(true);
    for (let i = 0; i < 4; i++) {
      try {
        await breaker.execute('recovery-speed', () => service.execute());
      } catch (error) {
        // Expected
      }
    }
    
    // Wait for HALF_OPEN
    await TestUtils.sleep(600);
    service.setFailure(false);
    
    // Count successes needed to close
    let successesNeeded = 0;
    let closed = false;
    
    for (let i = 0; i < 10; i++) {
      try {
        await breaker.execute('recovery-speed', () => service.execute());
        successesNeeded++;
        
        const state = breaker.getServiceState('recovery-speed');
        if (state?.state === 'CLOSED') {
          closed = true;
          break;
        }
      } catch (error) {
        log.warn(`Unexpected error during recovery: ${error.message}`);
      }
    }
    
    log.metric(`Successes needed to close: ${successesNeeded}`);
    log.metric(`Circuit closed: ${closed}`);
    log.metric(`Configured threshold: 3`);
    
    this.results.metrics.recoverySuccesses = successesNeeded;
    
    if (successesNeeded <= 3 && closed) {
      log.success(`Recovery detection test passed - Closed after ${successesNeeded} successes`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Recovery detection test failed - Needed ${successesNeeded} successes (expected ≤3)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 10: State Persistence
   */
  async testStatePersistence() {
    log.test('Testing state persistence across calls...');
    
    const breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 2000,
      monitoringPeriod: 10000
    });
    
    const service = new MockService('persistence-test');
    
    // Create a pattern of failures and successes
    const pattern = [
      { error: 'Fail 1' },
      { error: 'Fail 2' },
      { value: 'Success 1' },
      { error: 'Fail 3' },
      { error: 'Fail 4' },
      { value: 'Success 2' },
      { error: 'Fail 5' }, // Should trigger OPEN
      { error: 'Fail 6' }
    ];
    
    service.setNextResults(pattern);
    
    const states = [];
    
    for (let i = 0; i < pattern.length; i++) {
      try {
        await breaker.execute('persistence-test', () => service.execute());
      } catch (error) {
        // Expected
      }
      
      const state = breaker.getServiceState('persistence-test');
      states.push({
        call: i + 1,
        state: state?.state,
        failures: state?.failures,
        successes: state?.successes
      });
    }
    
    // Log state progression
    log.info('State progression:');
    states.forEach(s => {
      log.info(`  Call ${s.call}: ${s.state} (failures: ${s.failures}, successes: ${s.successes})`);
    });
    
    // Check if state tracked correctly
    const finalState = states[states.length - 1];
    const openedAtCorrectTime = states[6]?.state === 'OPEN'; // After 5th failure
    
    this.results.metrics.stateTransitions = states.length;
    
    if (openedAtCorrectTime && finalState.state === 'OPEN') {
      log.success(`State persistence test passed - State tracked correctly across ${states.length} calls`);
      this.results.passed++;
      return true;
    } else {
      log.error(`State persistence test failed - Incorrect state tracking`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Run all tests
   */
  async runAll() {
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.cyan + '  CircuitBreaker Component Test Suite' + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    const tests = [
      { name: 'CLOSED → OPEN Transition', fn: () => this.testClosedToOpenTransition() },
      { name: 'Recovery Cycle', fn: () => this.testRecoveryCycle() },
      { name: 'Failure Threshold Precision', fn: () => this.testFailureThresholdPrecision() },
      { name: 'Cooldown Timing Accuracy', fn: () => this.testCooldownTimingAccuracy() },
      { name: 'Service Isolation', fn: () => this.testServiceIsolation() },
      { name: 'State Check Latency', fn: () => this.testStateCheckLatency() },
      { name: 'Memory Per Service', fn: () => this.testMemoryPerService() },
      { name: 'Concurrent Safety', fn: () => this.testConcurrentSafety() },
      { name: 'Recovery Detection Speed', fn: () => this.testRecoveryDetectionSpeed() },
      { name: 'State Persistence', fn: () => this.testStatePersistence() }
    ];
    
    const startTime = Date.now();
    
    for (const test of tests) {
      console.log(`\n${colors.blue}[Test ${tests.indexOf(test) + 1}/${tests.length}] ${test.name}${colors.reset}`);
      console.log(colors.blue + '─'.repeat(50) + colors.reset);
      
      try {
        const result = await test.fn();
        this.results.tests.push({ 
          name: test.name, 
          passed: result,
          metrics: { ...this.results.metrics }
        });
      } catch (error) {
        log.error(`Test failed with error: ${error.message}`);
        console.error(error.stack);
        this.results.failed++;
        this.results.tests.push({ 
          name: test.name, 
          passed: false, 
          error: error.message 
        });
      }
      console.log();
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.cyan + '  Test Summary' + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    const total = this.results.passed + this.results.failed;
    const passRate = (this.results.passed / total * 100).toFixed(1);
    
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.blue}Total: ${total}${colors.reset}`);
    console.log(`${colors.yellow}Pass Rate: ${passRate}%${colors.reset}`);
    console.log(`${colors.magenta}Total Time: ${totalTime}s${colors.reset}\n`);
    
    // Key metrics summary
    console.log(colors.cyan + 'Key Metrics:' + colors.reset);
    console.log(`  • State Transition Accuracy: ${this.results.metrics.failuresBeforeOpen === 5 ? '100%' : 'Failed'}`);
    console.log(`  • Avg Execute Latency: ${this.results.metrics.avgExecuteLatency?.toFixed(3)}ms`);
    console.log(`  • P99 Execute Latency: ${this.results.metrics.p99ExecuteLatency?.toFixed(3)}ms`);
    console.log(`  • Memory Per Service: ${this.results.metrics.memoryPerServiceKB?.toFixed(2)}KB`);
    console.log(`  • Cooldown Accuracy: ${this.results.metrics.cooldownAccuracy?.toFixed(1)}%`);
    console.log(`  • Services Tracked: ${this.results.metrics.servicesTracked}`);
    
    // Detailed results
    console.log('\n' + colors.cyan + 'Detailed Results:' + colors.reset);
    for (const test of this.results.tests) {
      const icon = test.passed ? '✅' : '❌';
      const color = test.passed ? colors.green : colors.red;
      console.log(`  ${icon} ${color}${test.name}${colors.reset}`);
      if (test.error) {
        console.log(`     ${colors.red}Error: ${test.error}${colors.reset}`);
      }
    }
    
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    // Generate report
    await this.generateReport();
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
  
  /**
   * Generate test report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        passRate: ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1) + '%'
      },
      metrics: this.results.metrics,
      tests: this.results.tests,
      requirements: {
        stateTransitions: {
          target: '100% accuracy',
          actual: this.results.metrics.failuresBeforeOpen === 5 ? '100%' : `${this.results.metrics.failuresBeforeOpen} failures`,
          passed: this.results.metrics.failuresBeforeOpen === 5
        },
        failureThreshold: {
          target: 'Within 1 failure',
          actual: `${this.results.metrics.thresholdPrecision || 0} difference`,
          passed: (this.results.metrics.thresholdPrecision || 0) <= 1
        },
        cooldownTiming: {
          target: 'Within 5%',
          actual: `${this.results.metrics.cooldownAccuracy?.toFixed(1)}%`,
          passed: this.results.metrics.cooldownAccuracy >= 95 && this.results.metrics.cooldownAccuracy <= 105
        },
        serviceIsolation: {
          target: '100 services',
          actual: `${this.results.metrics.servicesTracked} services`,
          passed: this.results.metrics.servicesTracked === 100
        },
        concurrentSafety: {
          target: '0 race conditions',
          actual: `${this.results.metrics.concurrentErrors || 0} errors`,
          passed: (this.results.metrics.concurrentErrors || 0) === 0
        }
      }
    };
    
    // Save report to file
    const fs = await import('fs').then(m => m.promises);
    const reportPath = 'tests/unit/circuit-breaker-test-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    log.info(`Test report saved to ${reportPath}`);
    
    return report;
  }
}

// Run the test suite
const suite = new CircuitBreakerTestSuite();
suite.runAll().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});