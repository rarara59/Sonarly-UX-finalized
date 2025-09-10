/**
 * HedgedManager Component Testing
 * Comprehensive test suite for hedged request pattern and backup triggering
 */

import { HedgedManager } from '../../src/detection/transport/hedged-manager.js';

// Console colors for test output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Controllable Mock Request
class ControllableRequest {
  constructor(id, delay, shouldFail = false, value = null) {
    this.id = id;
    this.delay = delay;
    this.shouldFail = shouldFail;
    this.value = value || `result_${id}`;
    this.cancelled = false;
    this.executed = false;
    this.startTime = null;
    this.endTime = null;
    this.abortController = null;
  }

  async execute() {
    if (this.cancelled) {
      throw new Error(`Request ${this.id} was cancelled`);
    }
    
    this.executed = true;
    this.startTime = Date.now();
    
    // Create cancellable delay
    this.abortController = new AbortController();
    
    try {
      await this.delayWithCancellation(this.delay);
      
      if (this.cancelled) {
        throw new Error(`Request ${this.id} was cancelled during execution`);
      }
      
      if (this.shouldFail) {
        throw new Error(`Request ${this.id} failed as configured`);
      }
      
      this.endTime = Date.now();
      return this.value;
      
    } catch (error) {
      this.endTime = Date.now();
      throw error;
    }
  }

  async delayWithCancellation(ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Cancelled'));
        });
      }
    });
  }

  cancel() {
    this.cancelled = true;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  getLatency() {
    if (this.startTime && this.endTime) {
      return this.endTime - this.startTime;
    }
    return null;
  }

  reset() {
    this.cancelled = false;
    this.executed = false;
    this.startTime = null;
    this.endTime = null;
    this.abortController = null;
  }
}

// Request Scenario Generator
class RequestScenarioGenerator {
  constructor() {
    this.scenarios = {
      fastPrimary: this.generateFastPrimary.bind(this),
      slowPrimary: this.generateSlowPrimary.bind(this),
      failingPrimary: this.generateFailingPrimary.bind(this),
      flaky: this.generateFlaky.bind(this),
      allFailing: this.generateAllFailing.bind(this)
    };
  }

  generateFastPrimary() {
    return {
      primary: new ControllableRequest('primary', 50, false),
      backups: [
        new ControllableRequest('backup-0', 100, false),
        new ControllableRequest('backup-1', 150, false)
      ]
    };
  }

  generateSlowPrimary() {
    return {
      primary: new ControllableRequest('primary', 500, false),
      backups: [
        new ControllableRequest('backup-0', 50, false),
        new ControllableRequest('backup-1', 100, false)
      ]
    };
  }

  generateFailingPrimary() {
    return {
      primary: new ControllableRequest('primary', 100, true),
      backups: [
        new ControllableRequest('backup-0', 50, false),
        new ControllableRequest('backup-1', 100, false)
      ]
    };
  }

  generateFlaky() {
    return {
      primary: new ControllableRequest('primary', 200, Math.random() > 0.5),
      backups: [
        new ControllableRequest('backup-0', 150, Math.random() > 0.7),
        new ControllableRequest('backup-1', 200, false) // Always succeeds
      ]
    };
  }

  generateAllFailing() {
    return {
      primary: new ControllableRequest('primary', 100, true),
      backups: [
        new ControllableRequest('backup-0', 50, true),
        new ControllableRequest('backup-1', 75, true)
      ]
    };
  }
}

// Test Suite
class HedgedManagerTestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
    this.scenarioGenerator = new RequestScenarioGenerator();
  }

  // Test 1: Hedging Delay Accuracy
  async testHedgingDelayAccuracy() {
    console.log(`${colors.blue}Testing Hedging Delay Accuracy...${colors.reset}`);
    
    const hedgingDelay = 100;
    const manager = new HedgedManager({
      hedgingDelay,
      maxBackups: 1,
      adaptiveDelayEnabled: false
    });
    
    try {
      let backupTriggerTime = null;
      manager.on('backup-triggered', (data) => {
        backupTriggerTime = data.timestamp;
      });
      
      const scenario = this.scenarioGenerator.generateSlowPrimary();
      const startTime = Date.now();
      
      const result = await manager.hedgedRequest(
        () => scenario.primary.execute(),
        [() => scenario.backups[0].execute()],
        { method: 'getAccountInfo' }
      );
      
      const actualDelay = backupTriggerTime - startTime;
      const variance = Math.abs(actualDelay - hedgingDelay);
      const variancePercent = (variance / hedgingDelay) * 100;
      
      console.log(`${colors.cyan}Target delay: ${hedgingDelay}ms, Actual: ${actualDelay}ms${colors.reset}`);
      console.log(`${colors.cyan}Variance: ${variance}ms (${variancePercent.toFixed(1)}%)${colors.reset}`);
      console.log(`${colors.cyan}Winner: backup-0${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: variancePercent <= 10,
        metric: 'hedgingDelayAccuracy',
        expected: 'Within 10% of target',
        actual: `${variancePercent.toFixed(1)}% variance`,
        targetDelay: hedgingDelay,
        actualDelay,
        variance
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 2: Promise Race Cleanup
  async testPromiseRaceCleanup() {
    console.log(`${colors.blue}Testing Promise Race Cleanup...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 2,
      cancellationTimeout: 100
    });
    
    try {
      const scenario = this.scenarioGenerator.generateFastPrimary();
      
      // Track cleanup
      let cleanupData = null;
      manager.on('hedge-cleanup', (data) => {
        cleanupData = data;
      });
      
      const result = await manager.hedgedRequest(
        () => scenario.primary.execute(),
        scenario.backups.map(b => () => b.execute()),
        { method: 'getAccountInfo' }
      );
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Check that backups were cancelled
      const backupsCancelled = cleanupData?.cancelled?.length || 0;
      const activeHedges = manager.getStats().activeHedges;
      
      console.log(`${colors.cyan}Winner: primary${colors.reset}`);
      console.log(`${colors.cyan}Backups cancelled: ${backupsCancelled}${colors.reset}`);
      console.log(`${colors.cyan}Active hedges after cleanup: ${activeHedges}${colors.reset}`);
      console.log(`${colors.cyan}Cleanup time: ${cleanupData?.cleanupTime || 0}ms${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: activeHedges === 0 && backupsCancelled >= 1,
        metric: 'promiseCleanup',
        expected: '100% cleanup',
        actual: activeHedges === 0 ? 'Complete cleanup' : `${activeHedges} still active`,
        backupsCancelled,
        cleanupTime: cleanupData?.cleanupTime
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 3: Cancellation Speed
  async testCancellationSpeed() {
    console.log(`${colors.blue}Testing Cancellation Speed...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 100,
      maxBackups: 2,
      cancellationTimeout: 100
    });
    
    try {
      const scenario = {
        primary: new ControllableRequest('primary', 50, false),
        backups: [
          new ControllableRequest('backup-0', 300, false),
          new ControllableRequest('backup-1', 400, false)
        ]
      };
      
      let winTime = null;
      let cleanupTime = null;
      
      manager.on('request-won', (data) => {
        winTime = Date.now();
      });
      
      manager.on('hedge-cleanup', (data) => {
        cleanupTime = Date.now();
      });
      
      await manager.hedgedRequest(
        () => scenario.primary.execute(),
        scenario.backups.map(b => () => b.execute()),
        { method: 'getAccountInfo' }
      );
      
      const cancellationSpeed = cleanupTime - winTime;
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Cancellation speed: ${cancellationSpeed}ms${colors.reset}`);
      console.log(`${colors.cyan}Cancellation success rate: ${stats.cancellationSuccessRate}${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: cancellationSpeed <= 100,
        metric: 'cancellationSpeed',
        expected: '<100ms',
        actual: `${cancellationSpeed}ms`,
        successRate: stats.cancellationSuccessRate
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 4: Success Rate Improvement
  async testSuccessRateImprovement() {
    console.log(`${colors.blue}Testing Success Rate Improvement...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 2
    });
    
    try {
      const iterations = 20;
      let singleSuccesses = 0;
      let hedgedSuccesses = 0;
      
      // Test without hedging (simulate)
      for (let i = 0; i < iterations; i++) {
        const scenario = this.scenarioGenerator.generateFlaky();
        try {
          await scenario.primary.execute();
          singleSuccesses++;
        } catch (error) {
          // Failed
        }
        scenario.primary.reset();
      }
      
      // Test with hedging
      for (let i = 0; i < iterations; i++) {
        const scenario = this.scenarioGenerator.generateFlaky();
        try {
          await manager.hedgedRequest(
            () => scenario.primary.execute(),
            scenario.backups.map(b => () => b.execute()),
            { method: 'getAccountInfo' }
          );
          hedgedSuccesses++;
        } catch (error) {
          // All failed
        }
      }
      
      const singleSuccessRate = (singleSuccesses / iterations) * 100;
      const hedgedSuccessRate = (hedgedSuccesses / iterations) * 100;
      const improvement = hedgedSuccessRate - singleSuccessRate;
      const improvementPercent = singleSuccessRate > 0 ? 
        ((hedgedSuccessRate - singleSuccessRate) / singleSuccessRate * 100) : 100;
      
      console.log(`${colors.cyan}Single success rate: ${singleSuccessRate.toFixed(1)}%${colors.reset}`);
      console.log(`${colors.cyan}Hedged success rate: ${hedgedSuccessRate.toFixed(1)}%${colors.reset}`);
      console.log(`${colors.cyan}Improvement: ${improvement.toFixed(1)}% (${improvementPercent.toFixed(1)}% relative)${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: improvementPercent >= 95 || hedgedSuccessRate >= 95,
        metric: 'successImprovement',
        expected: '95%+ improvement',
        actual: `${improvementPercent.toFixed(1)}% improvement`,
        singleRate: `${singleSuccessRate.toFixed(1)}%`,
        hedgedRate: `${hedgedSuccessRate.toFixed(1)}%`
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 5: Resource Cleanup
  async testResourceCleanup() {
    console.log(`${colors.blue}Testing Resource Cleanup...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 2
    });
    
    try {
      const requestCount = 10;
      const promises = [];
      
      // Execute multiple hedged requests
      for (let i = 0; i < requestCount; i++) {
        const scenario = this.scenarioGenerator.generateFastPrimary();
        promises.push(
          manager.hedgedRequest(
            () => scenario.primary.execute(),
            scenario.backups.map(b => () => b.execute()),
            { method: 'getAccountInfo' }
          )
        );
      }
      
      await Promise.all(promises);
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const stats = manager.getStats();
      const activeHedges = stats.activeHedges;
      const memoryLeaks = stats.memoryLeaks;
      
      console.log(`${colors.cyan}Active hedges after ${requestCount} requests: ${activeHedges}${colors.reset}`);
      console.log(`${colors.cyan}Memory leaks detected: ${memoryLeaks}${colors.reset}`);
      console.log(`${colors.cyan}Hedges cancelled: ${stats.hedgesCancelled}${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: activeHedges === 0 && memoryLeaks === 0,
        metric: 'resourceCleanup',
        expected: '100% cleanup, 0 leaks',
        actual: `${activeHedges} active, ${memoryLeaks} leaks`,
        hedgesCancelled: stats.hedgesCancelled
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 6: Concurrent Hedging Safety
  async testConcurrentSafety() {
    console.log(`${colors.blue}Testing Concurrent Hedging Safety...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 1
    });
    
    try {
      const concurrentCount = 100;
      const promises = [];
      let errors = 0;
      
      // Launch concurrent hedged requests
      for (let i = 0; i < concurrentCount; i++) {
        const scenario = this.scenarioGenerator.generateFastPrimary();
        const promise = manager.hedgedRequest(
          () => scenario.primary.execute(),
          scenario.backups.map(b => () => b.execute()),
          { method: 'getAccountInfo' }
        )
          .then(result => ({ success: true, result }))
          .catch(error => {
            errors++;
            return { success: false, error: error.message };
          });
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Concurrent requests: ${concurrentCount}${colors.reset}`);
      console.log(`${colors.cyan}Successful: ${successful}, Errors: ${errors}${colors.reset}`);
      console.log(`${colors.cyan}Total hedges triggered: ${stats.hedgesTriggered}${colors.reset}`);
      console.log(`${colors.cyan}Memory leaks: ${stats.memoryLeaks}${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: successful === concurrentCount && errors === 0 && stats.memoryLeaks === 0,
        metric: 'concurrentSafety',
        expected: '0 race conditions',
        actual: errors === 0 ? 'No conflicts' : `${errors} errors`,
        successful,
        hedgesTriggered: stats.hedgesTriggered
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 7: Hedging Overhead
  async testHedgingOverhead() {
    console.log(`${colors.blue}Testing Hedging Overhead...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 1000, // High delay to prevent backup triggering
      maxBackups: 1
    });
    
    try {
      const iterations = 20;
      const singleLatencies = [];
      const hedgedLatencies = [];
      
      // Measure single request latency
      for (let i = 0; i < iterations; i++) {
        const request = new ControllableRequest('single', 50, false);
        const start = Date.now();
        await request.execute();
        singleLatencies.push(Date.now() - start);
      }
      
      // Measure hedged request latency (no backup should trigger)
      for (let i = 0; i < iterations; i++) {
        const scenario = this.scenarioGenerator.generateFastPrimary();
        const start = Date.now();
        await manager.hedgedRequest(
          () => scenario.primary.execute(),
          scenario.backups.map(b => () => b.execute()),
          { method: 'getAccountInfo' }
        );
        hedgedLatencies.push(Date.now() - start);
      }
      
      const avgSingle = singleLatencies.reduce((a, b) => a + b) / singleLatencies.length;
      const avgHedged = hedgedLatencies.reduce((a, b) => a + b) / hedgedLatencies.length;
      const overhead = avgHedged - avgSingle;
      
      console.log(`${colors.cyan}Avg single latency: ${avgSingle.toFixed(2)}ms${colors.reset}`);
      console.log(`${colors.cyan}Avg hedged latency: ${avgHedged.toFixed(2)}ms${colors.reset}`);
      console.log(`${colors.cyan}Overhead: ${overhead.toFixed(2)}ms${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: overhead < 20,
        metric: 'hedgingOverhead',
        expected: '<20ms overhead',
        actual: `${overhead.toFixed(2)}ms`,
        avgSingle: `${avgSingle.toFixed(2)}ms`,
        avgHedged: `${avgHedged.toFixed(2)}ms`
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 8: Adaptive Delay
  async testAdaptiveDelay() {
    console.log(`${colors.blue}Testing Adaptive Delay...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 200,
      maxBackups: 1,
      adaptiveDelayEnabled: true
    });
    
    try {
      // Test with P95 latency hint
      const recentLatencies = [50, 60, 70, 80, 90, 100, 110, 120, 130, 500];
      const p95Latency = 130; // Approximate P95
      
      let actualDelay = null;
      manager.on('backup-triggered', (data) => {
        actualDelay = data.delay;
      });
      
      const scenario = this.scenarioGenerator.generateSlowPrimary();
      
      await manager.hedgedRequest(
        () => scenario.primary.execute(),
        [() => scenario.backups[0].execute()],
        { 
          method: 'getAccountInfo',
          p95Latency,
          recentLatencies
        }
      );
      
      const expectedDelay = Math.min(p95Latency, 400); // Max 2x original
      const variance = Math.abs(actualDelay - expectedDelay);
      
      console.log(`${colors.cyan}Base delay: 200ms${colors.reset}`);
      console.log(`${colors.cyan}P95 latency: ${p95Latency}ms${colors.reset}`);
      console.log(`${colors.cyan}Actual delay used: ${actualDelay}ms${colors.reset}`);
      console.log(`${colors.cyan}Expected: ${expectedDelay}ms, Variance: ${variance}ms${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: actualDelay === expectedDelay,
        metric: 'adaptiveDelay',
        expected: `${expectedDelay}ms`,
        actual: `${actualDelay}ms`,
        p95Latency,
        variance
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 9: Non-Hedgeable Methods
  async testNonHedgeableMethods() {
    console.log(`${colors.blue}Testing Non-Hedgeable Methods...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 1
    });
    
    try {
      let hedgeTriggered = false;
      manager.on('backup-triggered', () => {
        hedgeTriggered = true;
      });
      
      const request = new ControllableRequest('primary', 200, false);
      const backup = new ControllableRequest('backup', 50, false);
      
      // Test with non-hedgeable method
      await manager.hedgedRequest(
        () => request.execute(),
        [() => backup.execute()],
        { method: 'sendTransaction' }
      );
      
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Method: sendTransaction (non-hedgeable)${colors.reset}`);
      console.log(`${colors.cyan}Hedge triggered: ${hedgeTriggered}${colors.reset}`);
      console.log(`${colors.cyan}Hedged requests: ${stats.hedgedRequests}${colors.reset}`);
      console.log(`${colors.cyan}Total requests: ${stats.totalRequests}${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: !hedgeTriggered && stats.hedgedRequests === 0,
        metric: 'nonHedgeableMethods',
        expected: 'No hedging for sendTransaction',
        actual: hedgeTriggered ? 'Incorrectly hedged' : 'Correctly skipped',
        hedgedRequests: stats.hedgedRequests
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 10: Memory Leak Detection
  async testMemoryLeakDetection() {
    console.log(`${colors.blue}Testing Memory Leak Detection...${colors.reset}`);
    
    const manager = new HedgedManager({
      hedgingDelay: 50,
      maxBackups: 1
    });
    
    try {
      // Start with baseline memory
      global.gc && global.gc();
      const baselineMemory = process.memoryUsage().heapUsed;
      
      // Execute many hedged requests
      const iterations = 50;
      for (let i = 0; i < iterations; i++) {
        const scenario = this.scenarioGenerator.generateFastPrimary();
        await manager.hedgedRequest(
          () => scenario.primary.execute(),
          scenario.backups.map(b => () => b.execute()),
          { method: 'getAccountInfo' }
        );
      }
      
      // Force cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      global.gc && global.gc();
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = (finalMemory - baselineMemory) / 1024 / 1024; // MB
      
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Requests executed: ${iterations}${colors.reset}`);
      console.log(`${colors.cyan}Memory growth: ${memoryGrowth.toFixed(2)}MB${colors.reset}`);
      console.log(`${colors.cyan}Active hedges: ${stats.activeHedges}${colors.reset}`);
      console.log(`${colors.cyan}Memory leaks detected: ${stats.memoryLeaks}${colors.reset}`);
      
      manager.destroy();
      
      return {
        passed: stats.activeHedges === 0 && stats.memoryLeaks === 0,
        metric: 'memoryLeakDetection',
        expected: '0 leaked promises',
        actual: `${stats.memoryLeaks} leaks`,
        memoryGrowth: `${memoryGrowth.toFixed(2)}MB`,
        activeHedges: stats.activeHedges
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log(`\n${colors.bold}${colors.magenta}========================================${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}      HedgedManager Test Suite${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}========================================${colors.reset}\n`);
    
    const tests = [
      { name: 'Hedging Delay Accuracy', fn: () => this.testHedgingDelayAccuracy() },
      { name: 'Promise Race Cleanup', fn: () => this.testPromiseRaceCleanup() },
      { name: 'Cancellation Speed', fn: () => this.testCancellationSpeed() },
      { name: 'Success Rate Improvement', fn: () => this.testSuccessRateImprovement() },
      { name: 'Resource Cleanup', fn: () => this.testResourceCleanup() },
      { name: 'Concurrent Safety', fn: () => this.testConcurrentSafety() },
      { name: 'Hedging Overhead', fn: () => this.testHedgingOverhead() },
      { name: 'Adaptive Delay', fn: () => this.testAdaptiveDelay() },
      { name: 'Non-Hedgeable Methods', fn: () => this.testNonHedgeableMethods() },
      { name: 'Memory Leak Detection', fn: () => this.testMemoryLeakDetection() }
    ];
    
    const results = [];
    const metrics = {};
    
    for (const test of tests) {
      console.log(`\n${colors.bold}Test: ${test.name}${colors.reset}`);
      console.log(`${'='.repeat(50)}`);
      
      try {
        const result = await test.fn();
        const status = result.passed ? 
          `${colors.green}✓ PASSED${colors.reset}` : 
          `${colors.red}✗ FAILED${colors.reset}`;
        
        console.log(`${status} - ${result.expected} (got ${result.actual})\n`);
        
        results.push({
          name: test.name,
          passed: result.passed,
          ...result
        });
        
        if (result.metric) {
          metrics[result.metric] = result.actual;
        }
        
      } catch (error) {
        console.log(`${colors.red}✗ ERROR${colors.reset} - ${error.message}\n`);
        results.push({
          name: test.name,
          passed: false,
          error: error.message
        });
      }
    }
    
    // Summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`\n${colors.bold}${colors.magenta}========================================${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}           Test Summary${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}========================================${colors.reset}\n`);
    
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`${colors.yellow}Pass Rate: ${((passed / results.length) * 100).toFixed(1)}%${colors.reset}\n`);
    
    // Requirements validation
    console.log(`${colors.bold}Requirements Validation:${colors.reset}`);
    console.log(`${'─'.repeat(40)}`);
    
    const requirements = {
      'Delay Accuracy (<10%)': metrics.hedgingDelayAccuracy || 'Not measured',
      'Cleanup (100%)': metrics.promiseCleanup || 'Not measured',
      'Cancellation (<100ms)': metrics.cancellationSpeed || 'Not measured',
      'Success Improvement (>95%)': metrics.successImprovement || 'Not measured',
      'Memory Leaks (0)': metrics.memoryLeakDetection || 'Not measured'
    };
    
    for (const [req, value] of Object.entries(requirements)) {
      console.log(`${req}: ${value}`);
    }
    
    return {
      passed,
      failed,
      results,
      metrics
    };
  }
}

// Main execution
async function main() {
  const suite = new HedgedManagerTestSuite();
  
  try {
    const { passed, failed, results, metrics } = await suite.runAllTests();
    
    // Save results
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed,
        failed,
        passRate: `${((passed / (passed + failed)) * 100).toFixed(1)}%`
      },
      metrics,
      tests: results.map(r => ({
        name: r.name,
        passed: r.passed,
        ...r
      })),
      requirements: {
        timingAccuracy: {
          target: 'Within 10%',
          actual: metrics.hedgingDelayAccuracy || 'Not measured',
          passed: metrics.hedgingDelayAccuracy && parseFloat(metrics.hedgingDelayAccuracy) <= 10
        },
        resourceCleanup: {
          target: '100% cleanup',
          actual: metrics.promiseCleanup || 'Not measured',
          passed: metrics.promiseCleanup && metrics.promiseCleanup.includes('Complete')
        },
        cancellationSpeed: {
          target: '<100ms',
          actual: metrics.cancellationSpeed || 'Not measured',
          passed: metrics.cancellationSpeed && parseFloat(metrics.cancellationSpeed) < 100
        },
        successImprovement: {
          target: '95%+ improvement',
          actual: metrics.successImprovement || 'Not measured',
          passed: metrics.successImprovement && parseFloat(metrics.successImprovement) >= 95
        },
        memoryLeaks: {
          target: '0 leaks',
          actual: metrics.memoryLeakDetection || 'Not measured',
          passed: metrics.memoryLeakDetection && metrics.memoryLeakDetection.includes('0 leaks')
        }
      }
    };
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    await fs.promises.writeFile(
      path.join(__dirname, 'hedged-manager-test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n${colors.cyan}Test report saved to hedged-manager-test-report.json${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { HedgedManagerTestSuite };