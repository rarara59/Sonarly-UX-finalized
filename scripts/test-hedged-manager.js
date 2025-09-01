#!/usr/bin/env node

/**
 * Test Script for HedgedManager
 * Validates hedging timing, cancellation, and resource cleanup
 */

import { HedgedManager } from '../src/detection/transport/hedged-manager.js';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`)
};

// Test helpers
class TestHelpers {
  static createMockRequest(delay, shouldFail = false, label = 'request') {
    return async () => {
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (shouldFail) {
        throw new Error(`${label} failed after ${delay}ms`);
      }
      
      return {
        result: `${label} completed`,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    };
  }
  
  static async measureTiming(fn) {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000;
    return { result, duration: durationMs };
  }
  
  static calculateAccuracy(actual, expected, tolerance = 0.1) {
    const diff = Math.abs(actual - expected);
    const percentDiff = diff / expected;
    return percentDiff <= tolerance;
  }
}

// Test Suite
class HedgedManagerTests {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }
  
  /**
   * Test 1: Basic hedging with timing accuracy
   */
  async testTimingAccuracy() {
    log.test('Testing backup request timing accuracy...');
    
    const manager = new HedgedManager({
      hedgingDelay: 100, // 100ms delay
      maxBackups: 2
    });
    
    const timingEvents = [];
    manager.on('backup-triggered', (event) => {
      timingEvents.push(event);
    });
    
    // Create requests: primary slow (300ms), backup fast (50ms)
    const primary = TestHelpers.createMockRequest(300, false, 'primary');
    const backup1 = TestHelpers.createMockRequest(50, false, 'backup-1');
    const backup2 = TestHelpers.createMockRequest(50, false, 'backup-2');
    
    const startTime = Date.now();
    const result = await manager.hedgedRequest(
      primary,
      [backup1, backup2],
      { method: 'getBalance' }
    );
    
    const totalTime = Date.now() - startTime;
    
    // Verify timing accuracy
    let timingAccurate = true;
    for (let i = 0; i < timingEvents.length; i++) {
      const event = timingEvents[i];
      const expectedDelay = 100 * (i + 1); // 100ms, 200ms
      const actualDelay = event.timestamp - startTime;
      
      if (!TestHelpers.calculateAccuracy(actualDelay, expectedDelay, 0.1)) {
        log.error(`Backup ${i} triggered at ${actualDelay}ms, expected ~${expectedDelay}ms`);
        timingAccurate = false;
      } else {
        log.info(`Backup ${i} triggered at ${actualDelay}ms (expected ~${expectedDelay}ms)`);
      }
    }
    
    const stats = manager.getStats();
    log.info(`Total time: ${totalTime}ms, Hedges won: ${stats.hedgesWon}, Primary wins: ${stats.primaryWins}`);
    
    // Success if timing is accurate and request completed in reasonable time
    if (timingAccurate && timingEvents.length >= 1) {
      log.success(`Timing accuracy test passed - Total time: ${totalTime}ms, Backups triggered: ${timingEvents.length}`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Timing accuracy test failed - Accurate: ${timingAccurate}, Backups triggered: ${timingEvents.length}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 2: Request cancellation and cleanup
   */
  async testCancellationAndCleanup() {
    log.test('Testing request cancellation and resource cleanup...');
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 3,
      cancellationTimeout: 100
    });
    
    const cancellationEvents = [];
    manager.on('hedge-cleanup', (event) => {
      cancellationEvents.push(event);
    });
    
    // Create requests: primary fast (10ms), backups should be scheduled but not triggered
    const primary = TestHelpers.createMockRequest(10, false, 'primary');
    const backup1 = TestHelpers.createMockRequest(100, false, 'backup-1');
    const backup2 = TestHelpers.createMockRequest(100, false, 'backup-2');
    const backup3 = TestHelpers.createMockRequest(100, false, 'backup-3');
    
    await manager.hedgedRequest(
      primary,
      [backup1, backup2, backup3],
      { method: 'getBalance' }
    );
    
    // Check cleanup events
    const cleanupEvent = cancellationEvents[0];
    const cancelledCount = cleanupEvent ? cleanupEvent.cancelled.length : 0;
    const activeHedges = manager.activeHedges.size;
    
    const stats = manager.getStats();
    
    log.info(`Cancelled backups: ${cancelledCount}, Active hedges: ${activeHedges}`);
    log.info(`Primary wins: ${stats.primaryWins}, Hedges cancelled: ${stats.hedgesCancelled}`);
    
    // Success if primary wins quickly and backups are cancelled
    if ((cancelledCount >= 1 || stats.hedgesCancelled >= 1) && activeHedges === 0 && stats.primaryWins > 0) {
      log.success(`Cancellation test passed - Cancelled: ${stats.hedgesCancelled}, Active: ${activeHedges}`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Cancellation test failed - Cancelled: ${stats.hedgesCancelled}, Active: ${activeHedges}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 3: Success rate improvement during failures
   */
  async testSuccessRateImprovement() {
    log.test('Testing success rate improvement during endpoint failures...');
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 2
    });
    
    let successWithoutHedging = 0;
    let successWithHedging = 0;
    const iterations = 50;
    
    // Test without hedging (primary fails 80% of the time)
    for (let i = 0; i < iterations; i++) {
      try {
        const primary = TestHelpers.createMockRequest(100, Math.random() < 0.8, 'primary');
        await primary();
        successWithoutHedging++;
      } catch (error) {
        // Failed
      }
    }
    
    // Test with hedging (primary fails 80%, backups fail 20%)
    for (let i = 0; i < iterations; i++) {
      try {
        const primary = TestHelpers.createMockRequest(150, Math.random() < 0.8, 'primary');
        const backup1 = TestHelpers.createMockRequest(30, Math.random() < 0.2, 'backup-1');
        const backup2 = TestHelpers.createMockRequest(30, Math.random() < 0.2, 'backup-2');
        
        await manager.hedgedRequest(primary, [backup1, backup2], { method: 'getBalance' });
        successWithHedging++;
      } catch (error) {
        // Failed
      }
    }
    
    const baseRate = (successWithoutHedging / iterations) * 100;
    const hedgedRate = (successWithHedging / iterations) * 100;
    const relativeImprovement = baseRate > 0 ? ((hedgedRate - baseRate) / baseRate) * 100 : 0;
    const absoluteImprovement = hedgedRate - baseRate;
    
    log.info(`Base success rate: ${baseRate.toFixed(1)}%`);
    log.info(`Hedged success rate: ${hedgedRate.toFixed(1)}%`);
    log.info(`Relative improvement: ${relativeImprovement.toFixed(1)}%`);
    log.info(`Absolute improvement: ${absoluteImprovement.toFixed(1)}%`);
    
    // Success if hedged rate is significantly better (95%+ relative improvement or reaches 95%+ success)
    if (relativeImprovement >= 95 || hedgedRate >= 95) {
      log.success(`Success rate improvement test passed - ${relativeImprovement.toFixed(1)}% improvement`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Success rate improvement test failed - Only ${relativeImprovement.toFixed(1)}% improvement (target: 95%+)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 4: Concurrent hedging safety
   */
  async testConcurrentHedging() {
    log.test('Testing concurrent hedging safety...');
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 1
    });
    
    const concurrentRequests = 100;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      const primary = TestHelpers.createMockRequest(
        Math.random() * 200 + 50, // 50-250ms
        Math.random() < 0.2, // 20% failure rate
        `primary-${i}`
      );
      const backup = TestHelpers.createMockRequest(
        Math.random() * 100 + 20, // 20-120ms
        Math.random() < 0.1, // 10% failure rate
        `backup-${i}`
      );
      
      promises.push(
        manager.hedgedRequest(primary, [backup], { 
          method: 'getBalance',
          requestId: `concurrent-${i}`
        }).catch(() => null) // Ignore failures for this test
      );
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const stats = manager.getStats();
    const activeAfter = manager.activeHedges.size;
    
    log.info(`Processed ${concurrentRequests} concurrent requests in ${duration}ms`);
    log.info(`Active hedges after completion: ${activeAfter}`);
    log.info(`Memory leaks detected: ${stats.memoryLeaks}`);
    
    if (activeAfter === 0 && stats.memoryLeaks === 0) {
      log.success(`Concurrent hedging test passed - No leaks or stuck hedges`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Concurrent hedging test failed - Active: ${activeAfter}, Leaks: ${stats.memoryLeaks}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 5: Memory cleanup and leak prevention
   */
  async testMemoryCleanup() {
    log.test('Testing memory cleanup and leak prevention...');
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 2
    });
    
    // Track memory before
    global.gc && global.gc(); // Force GC if available
    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    
    // Create many hedged requests
    for (let i = 0; i < 100; i++) {
      const primary = TestHelpers.createMockRequest(10, false, `primary-${i}`);
      const backup1 = TestHelpers.createMockRequest(20, false, `backup1-${i}`);
      const backup2 = TestHelpers.createMockRequest(20, false, `backup2-${i}`);
      
      await manager.hedgedRequest(primary, [backup1, backup2], {
        method: 'getBalance',
        requestId: `memory-test-${i}`
      });
    }
    
    // Clean up
    await manager.clear();
    
    // Track memory after
    global.gc && global.gc(); // Force GC if available
    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
    const memIncrease = memAfter - memBefore;
    
    const stats = manager.getStats();
    
    log.info(`Memory before: ${memBefore.toFixed(2)}MB`);
    log.info(`Memory after: ${memAfter.toFixed(2)}MB`);
    log.info(`Memory increase: ${memIncrease.toFixed(2)}MB`);
    log.info(`Active hedges: ${manager.activeHedges.size}`);
    
    if (manager.activeHedges.size === 0 && memIncrease < 5) {
      log.success(`Memory cleanup test passed - Increase: ${memIncrease.toFixed(2)}MB`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Memory cleanup test failed - Active: ${manager.activeHedges.size}, Increase: ${memIncrease.toFixed(2)}MB`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 6: Hedging overhead measurement
   */
  async testHedgingOverhead() {
    log.test('Testing hedging overhead...');
    
    const manager = new HedgedManager({
      hedgingDelay: 100,
      maxBackups: 1
    });
    
    // Measure single request latency
    const singleRequest = TestHelpers.createMockRequest(50, false, 'single');
    const { duration: singleDuration } = await TestHelpers.measureTiming(singleRequest);
    
    // Measure hedged request latency (primary completes before backup triggers)
    const primary = TestHelpers.createMockRequest(50, false, 'primary');
    const backup = TestHelpers.createMockRequest(30, false, 'backup');
    
    const { duration: hedgedDuration } = await TestHelpers.measureTiming(async () => {
      return await manager.hedgedRequest(primary, [backup], { method: 'getBalance' });
    });
    
    const overhead = hedgedDuration - singleDuration;
    
    log.info(`Single request duration: ${singleDuration.toFixed(2)}ms`);
    log.info(`Hedged request duration: ${hedgedDuration.toFixed(2)}ms`);
    log.info(`Hedging overhead: ${overhead.toFixed(2)}ms`);
    
    if (overhead < 20) {
      log.success(`Hedging overhead test passed - ${overhead.toFixed(2)}ms overhead`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Hedging overhead test failed - ${overhead.toFixed(2)}ms overhead (target: <20ms)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 7: Cancellation speed
   */
  async testCancellationSpeed() {
    log.test('Testing cancellation speed...');
    
    const manager = new HedgedManager({
      hedgingDelay: 200,
      maxBackups: 3,
      cancellationTimeout: 100
    });
    
    let cleanupTime = 0;
    manager.on('hedge-cleanup', (event) => {
      cleanupTime = event.cleanupTime;
    });
    
    // Primary completes quickly, backups should be cancelled
    const primary = TestHelpers.createMockRequest(10, false, 'primary');
    const backup1 = TestHelpers.createMockRequest(500, false, 'backup-1');
    const backup2 = TestHelpers.createMockRequest(500, false, 'backup-2');
    const backup3 = TestHelpers.createMockRequest(500, false, 'backup-3');
    
    await manager.hedgedRequest(primary, [backup1, backup2, backup3], {
      method: 'getBalance'
    });
    
    const stats = manager.getStats();
    
    log.info(`Cleanup time: ${cleanupTime}ms`);
    log.info(`Cancellation success rate: ${stats.cancellationSuccessRate}`);
    
    if (cleanupTime <= 100) {
      log.success(`Cancellation speed test passed - ${cleanupTime}ms cleanup time`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Cancellation speed test failed - ${cleanupTime}ms cleanup time (target: ≤100ms)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 8: Non-hedgeable methods
   */
  async testNonHedgeableMethods() {
    log.test('Testing non-hedgeable method handling...');
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 2
    });
    
    let backupTriggered = false;
    manager.on('backup-triggered', () => {
      backupTriggered = true;
    });
    
    // Test with non-hedgeable method
    const primary = TestHelpers.createMockRequest(100, false, 'primary');
    const backup = TestHelpers.createMockRequest(50, false, 'backup');
    
    await manager.hedgedRequest(primary, [backup], {
      method: 'sendTransaction' // Non-hedgeable
    });
    
    const stats = manager.getStats();
    
    if (!backupTriggered && stats.hedgedRequests === 0) {
      log.success(`Non-hedgeable method test passed - No hedging for sendTransaction`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Non-hedgeable method test failed - Hedging occurred for sendTransaction`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Run all tests
   */
  async runAll() {
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + '  HedgedManager Test Suite' + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
    
    const tests = [
      { name: 'Timing Accuracy', fn: () => this.testTimingAccuracy() },
      { name: 'Cancellation & Cleanup', fn: () => this.testCancellationAndCleanup() },
      { name: 'Success Rate Improvement', fn: () => this.testSuccessRateImprovement() },
      { name: 'Concurrent Hedging', fn: () => this.testConcurrentHedging() },
      { name: 'Memory Cleanup', fn: () => this.testMemoryCleanup() },
      { name: 'Hedging Overhead', fn: () => this.testHedgingOverhead() },
      { name: 'Cancellation Speed', fn: () => this.testCancellationSpeed() },
      { name: 'Non-Hedgeable Methods', fn: () => this.testNonHedgeableMethods() }
    ];
    
    for (const test of tests) {
      console.log(`\n${colors.blue}[${test.name}]${colors.reset}`);
      try {
        const result = await test.fn();
        this.results.tests.push({ name: test.name, passed: result });
      } catch (error) {
        log.error(`Test failed with error: ${error.message}`);
        this.results.failed++;
        this.results.tests.push({ name: test.name, passed: false, error: error.message });
      }
      console.log();
    }
    
    // Print summary
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + '  Test Summary' + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
    
    const total = this.results.passed + this.results.failed;
    const passRate = (this.results.passed / total * 100).toFixed(1);
    
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.blue}Total: ${total}${colors.reset}`);
    console.log(`${colors.yellow}Pass Rate: ${passRate}%${colors.reset}\n`);
    
    // Detailed results
    console.log('Detailed Results:');
    for (const test of this.results.tests) {
      const icon = test.passed ? '✅' : '❌';
      const color = test.passed ? colors.green : colors.red;
      console.log(`  ${icon} ${color}${test.name}${colors.reset}`);
      if (test.error) {
        console.log(`     ${colors.red}Error: ${test.error}${colors.reset}`);
      }
    }
    
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset + '\n');
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests
const tester = new HedgedManagerTests();
tester.runAll().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});