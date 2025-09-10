/**
 * BatchManager Component Testing
 * Comprehensive test suite for request batching and response routing
 */

import { BatchManager } from '../../src/detection/transport/batch-manager.js';

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

// Mock Batch Executor
class MockBatchExecutor {
  constructor() {
    this.executionCount = 0;
    this.requestsProcessed = 0;
    this.executionLog = [];
    this.simulateErrors = false;
    this.responseDelay = 10;
  }

  async execute(method, params, options) {
    this.executionCount++;
    const batchSize = Array.isArray(params) ? params.length : 1;
    this.requestsProcessed += batchSize;
    
    const execution = {
      executionId: this.executionCount,
      method,
      batchSize,
      timestamp: Date.now()
    };
    this.executionLog.push(execution);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, this.responseDelay));
    
    if (this.simulateErrors) {
      throw new Error('Simulated batch execution error');
    }
    
    // Return appropriate response based on method
    if (method === 'getMultipleAccounts') {
      // Return account data for each address
      return {
        value: params.map(address => ({
          lamports: Math.floor(Math.random() * 1000000),
          owner: 'mockOwner',
          data: `data_${address}`,
          executable: false
        }))
      };
    } else if (method === 'getSignatureStatuses') {
      // Return status for each signature
      return {
        value: params.map(sig => ({
          slot: Math.floor(Math.random() * 100000),
          confirmations: Math.floor(Math.random() * 32),
          err: null,
          confirmationStatus: 'confirmed'
        }))
      };
    }
    
    // Generic response
    return {
      value: params.map((p, i) => ({
        id: i,
        result: `result_${i}`,
        param: p
      }))
    };
  }

  reset() {
    this.executionCount = 0;
    this.requestsProcessed = 0;
    this.executionLog = [];
    this.simulateErrors = false;
  }

  getStats() {
    return {
      executionCount: this.executionCount,
      requestsProcessed: this.requestsProcessed,
      avgBatchSize: this.executionCount > 0 ? 
        this.requestsProcessed / this.executionCount : 0
    };
  }
}

// Request Pattern Generator
class RequestPatternGenerator {
  constructor() {
    this.patterns = {
      sequential: this.generateSequential.bind(this),
      concurrent: this.generateConcurrent.bind(this),
      mixed: this.generateMixed.bind(this),
      bursty: this.generateBursty.bind(this)
    };
  }

  generateSequential(count, method = 'getAccountInfo', delayMs = 5) {
    const requests = [];
    for (let i = 0; i < count; i++) {
      requests.push({
        method,
        params: [`address_${i}`],
        options: { commitment: 'confirmed' },
        delay: i * delayMs
      });
    }
    return requests;
  }

  generateConcurrent(count, method = 'getAccountInfo') {
    const requests = [];
    for (let i = 0; i < count; i++) {
      requests.push({
        method,
        params: [`address_${i}`],
        options: { commitment: 'confirmed' },
        delay: 0
      });
    }
    return requests;
  }

  generateMixed(count) {
    const requests = [];
    const methods = ['getAccountInfo', 'getBalance', 'getSignatureStatuses', 'getSlot'];
    
    for (let i = 0; i < count; i++) {
      const method = methods[i % methods.length];
      const params = method === 'getSignatureStatuses' ? 
        [[`sig_${i}`]] : [`param_${i}`];
      
      requests.push({
        method,
        params,
        options: { commitment: 'confirmed' },
        delay: Math.random() * 10
      });
    }
    return requests;
  }

  generateBursty(bursts, burstSize) {
    const requests = [];
    for (let b = 0; b < bursts; b++) {
      for (let i = 0; i < burstSize; i++) {
        requests.push({
          method: 'getAccountInfo',
          params: [`burst${b}_address${i}`],
          options: { commitment: 'confirmed' },
          delay: b * 100 // 100ms between bursts
        });
      }
    }
    return requests;
  }
}

// Test Suite
class BatchManagerTestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
    this.executor = new MockBatchExecutor();
    this.patternGenerator = new RequestPatternGenerator();
  }

  // Test 1: Batch Size Trigger
  async testBatchSizeTrigger() {
    console.log(`${colors.blue}Testing Batch Size Trigger...${colors.reset}`);
    
    const maxBatchSize = 5;
    const manager = new BatchManager({
      batchWindow: 1000, // Long window to test size trigger
      maxBatchSize,
      enableBatching: true
    });
    
    try {
      let batchExecuted = false;
      manager.on('batch-full', () => {
        batchExecuted = true;
      });
      
      // Add requests up to max batch size
      const promises = [];
      for (let i = 0; i < maxBatchSize; i++) {
        const promise = manager.addRequestWithExecutor(
          'getAccountInfo',
          [`address_${i}`],
          { commitment: 'confirmed' },
          this.executor.execute.bind(this.executor)
        );
        promises.push(promise);
      }
      
      // Wait for batch execution
      await Promise.all(promises);
      
      const stats = manager.getStats();
      const executorStats = this.executor.getStats();
      
      console.log(`${colors.cyan}Batch executed: ${batchExecuted}${colors.reset}`);
      console.log(`${colors.cyan}Batches sent: ${stats.batchesSent}, Requests batched: ${stats.requestsBatched}${colors.reset}`);
      console.log(`${colors.cyan}Executor calls: ${executorStats.executionCount}${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: batchExecuted && stats.batchesSent === 1 && 
                stats.requestsBatched === maxBatchSize && 
                executorStats.executionCount === 1,
        metric: 'batchSizeTrigger',
        expected: 'Batch executes at max size',
        actual: batchExecuted ? 'Executed at size limit' : 'Not executed',
        batchesSent: stats.batchesSent,
        requestsBatched: stats.requestsBatched
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 2: Batch Timeout Trigger
  async testBatchTimeoutTrigger() {
    console.log(`${colors.blue}Testing Batch Timeout Trigger...${colors.reset}`);
    
    const batchWindow = 50;
    const manager = new BatchManager({
      batchWindow,
      maxBatchSize: 100, // High limit to test timeout
      enableBatching: true
    });
    
    try {
      const startTime = Date.now();
      
      // Add just 2 requests (below max size)
      const promises = [];
      for (let i = 0; i < 2; i++) {
        promises.push(
          manager.addRequestWithExecutor(
            'getAccountInfo',
            [`address_${i}`],
            { commitment: 'confirmed' },
            this.executor.execute.bind(this.executor)
          )
        );
      }
      
      // Wait for timeout-based execution
      await Promise.all(promises);
      
      const executionTime = Date.now() - startTime;
      const timeoutAccuracy = Math.abs(executionTime - batchWindow);
      
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Execution time: ${executionTime}ms, Target: ${batchWindow}ms${colors.reset}`);
      console.log(`${colors.cyan}Timeout accuracy: ${timeoutAccuracy}ms${colors.reset}`);
      console.log(`${colors.cyan}Avg timeout accuracy: ${stats.avgTimeoutAccuracyMs}ms${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: timeoutAccuracy <= 10,
        metric: 'timeoutAccuracy',
        expected: 'Within 10ms of timeout',
        actual: `${timeoutAccuracy}ms variance`,
        executionTime,
        avgAccuracy: stats.avgTimeoutAccuracyMs
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 3: Response Routing Accuracy
  async testResponseRouting() {
    console.log(`${colors.blue}Testing Response Routing Accuracy...${colors.reset}`);
    
    const manager = new BatchManager({
      batchWindow: 50,
      maxBatchSize: 10,
      enableBatching: true
    });
    
    try {
      // Add multiple requests and track their responses
      const requests = [];
      const expectedResponses = new Map();
      
      for (let i = 0; i < 10; i++) {
        const address = `address_${i}`;
        expectedResponses.set(address, i);
        
        requests.push({
          address,
          promise: manager.addRequestWithExecutor(
            'getAccountInfo',
            [address],
            { commitment: 'confirmed' },
            this.executor.execute.bind(this.executor)
          )
        });
      }
      
      // Wait for all responses
      const responses = await Promise.all(requests.map(r => r.promise));
      
      // Verify each response corresponds to correct request
      let correctRouting = true;
      let mismatchCount = 0;
      
      requests.forEach((req, index) => {
        const response = responses[index];
        if (!response || !response.value) {
          correctRouting = false;
          mismatchCount++;
        }
        // Each request should get a unique response
        const data = response?.value?.data;
        if (data && !data.includes(req.address)) {
          correctRouting = false;
          mismatchCount++;
        }
      });
      
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Requests: ${requests.length}, Responses: ${responses.length}${colors.reset}`);
      console.log(`${colors.cyan}Correct routing: ${correctRouting}, Mismatches: ${mismatchCount}${colors.reset}`);
      console.log(`${colors.cyan}Batches sent: ${stats.batchesSent}${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: correctRouting && mismatchCount === 0,
        metric: 'responseRouting',
        expected: '100% accurate routing',
        actual: correctRouting ? '100% accurate' : `${mismatchCount} mismatches`,
        requestCount: requests.length,
        responseCount: responses.length
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 4: Mixed Request Types
  async testMixedRequestTypes() {
    console.log(`${colors.blue}Testing Mixed Request Types...${colors.reset}`);
    
    const manager = new BatchManager({
      batchWindow: 50,
      maxBatchSize: 100,
      enableBatching: true
    });
    
    try {
      const requests = this.patternGenerator.generateMixed(20);
      const promises = [];
      
      for (const req of requests) {
        await new Promise(resolve => setTimeout(resolve, req.delay));
        
        const promise = manager.addRequestWithExecutor(
          req.method,
          req.params,
          req.options,
          this.executor.execute.bind(this.executor)
        );
        
        if (promise) {
          promises.push(promise);
        }
      }
      
      // Wait for all that returned promises
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      const stats = manager.getStats();
      const executorStats = this.executor.getStats();
      
      const batchableCount = requests.filter(r => 
        r.method === 'getAccountInfo' || 
        r.method === 'getBalance' ||
        r.method === 'getSignatureStatuses'
      ).length;
      
      const reduction = batchableCount > 0 ? 
        ((batchableCount - executorStats.executionCount) / batchableCount * 100) : 0;
      
      console.log(`${colors.cyan}Total requests: ${requests.length}${colors.reset}`);
      console.log(`${colors.cyan}Batchable: ${batchableCount}, Batched: ${stats.requestsBatched}${colors.reset}`);
      console.log(`${colors.cyan}Individual: ${stats.individualRequests}${colors.reset}`);
      console.log(`${colors.cyan}Reduction: ${reduction.toFixed(1)}%${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: stats.requestsBatched > 0 && stats.individualRequests > 0,
        metric: 'mixedRequestHandling',
        expected: 'Handles mixed types',
        actual: `${stats.requestsBatched} batched, ${stats.individualRequests} individual`,
        reduction: `${reduction.toFixed(1)}%`,
        batchableCount
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 5: Batch Efficiency
  async testBatchEfficiency() {
    console.log(`${colors.blue}Testing Batch Efficiency...${colors.reset}`);
    
    const manager = new BatchManager({
      batchWindow: 30,
      maxBatchSize: 50,
      enableBatching: true
    });
    
    try {
      // Generate batchable requests
      const requests = this.patternGenerator.generateConcurrent(100, 'getAccountInfo');
      const promises = [];
      
      for (const req of requests) {
        const promise = manager.addRequestWithExecutor(
          req.method,
          req.params,
          req.options,
          this.executor.execute.bind(this.executor)
        );
        promises.push(promise);
      }
      
      await Promise.all(promises);
      
      const stats = manager.getStats();
      const executorStats = this.executor.getStats();
      
      const reduction = ((requests.length - executorStats.executionCount) / requests.length * 100);
      
      console.log(`${colors.cyan}Requests: ${requests.length}, Executions: ${executorStats.executionCount}${colors.reset}`);
      console.log(`${colors.cyan}Batches sent: ${stats.batchesSent}${colors.reset}`);
      console.log(`${colors.cyan}Avg batch size: ${stats.avgBatchSize}${colors.reset}`);
      console.log(`${colors.cyan}Reduction: ${reduction.toFixed(1)}%${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: reduction >= 80,
        metric: 'batchEfficiency',
        expected: '80%+ reduction',
        actual: `${reduction.toFixed(1)}% reduction`,
        batchesSent: stats.batchesSent,
        avgBatchSize: stats.avgBatchSize
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 6: Memory Efficiency
  async testMemoryEfficiency() {
    console.log(`${colors.blue}Testing Memory Efficiency...${colors.reset}`);
    
    const manager = new BatchManager({
      batchWindow: 50,
      maxBatchSize: 100,
      enableBatching: true
    });
    
    try {
      // Create large batch to test memory
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(
          manager.addRequestWithExecutor(
            'getAccountInfo',
            [`very_long_address_string_to_test_memory_usage_${i}`],
            { commitment: 'confirmed' },
            this.executor.execute.bind(this.executor)
          )
        );
      }
      
      // Wait for batch to form but not execute
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const metrics = manager.getMetrics();
      const memoryPerBatch = parseInt(metrics.avgMemoryPerBatchBytes);
      
      // Let batch execute
      await Promise.all(promises);
      
      console.log(`${colors.cyan}Avg memory per batch: ${memoryPerBatch} bytes${colors.reset}`);
      console.log(`${colors.cyan}Memory efficiency: ${metrics.memoryEfficiency}${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: memoryPerBatch < 1024,
        metric: 'memoryEfficiency',
        expected: '<1KB per batch',
        actual: `${memoryPerBatch} bytes`,
        memoryStatus: metrics.memoryEfficiency
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 7: Batch Formation Performance
  async testBatchFormationPerformance() {
    console.log(`${colors.blue}Testing Batch Formation Performance...${colors.reset}`);
    
    const manager = new BatchManager({
      batchWindow: 100,
      maxBatchSize: 1000,
      enableBatching: true
    });
    
    try {
      const requestCount = 500;
      const startTime = Date.now();
      const promises = [];
      
      // Add requests rapidly
      for (let i = 0; i < requestCount; i++) {
        const promise = manager.addRequestWithExecutor(
          'getAccountInfo',
          [`address_${i}`],
          { commitment: 'confirmed' },
          this.executor.execute.bind(this.executor)
        );
        promises.push(promise);
      }
      
      const formationTime = Date.now() - startTime;
      const avgFormationTime = formationTime / requestCount;
      
      // Wait for execution
      await Promise.all(promises);
      
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Requests added: ${requestCount}${colors.reset}`);
      console.log(`${colors.cyan}Total formation time: ${formationTime}ms${colors.reset}`);
      console.log(`${colors.cyan}Avg per request: ${avgFormationTime.toFixed(3)}ms${colors.reset}`);
      console.log(`${colors.cyan}Stats avg: ${stats.avgBatchFormationTimeMs}ms${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: avgFormationTime < 10,
        metric: 'batchFormationTime',
        expected: '<10ms per request',
        actual: `${avgFormationTime.toFixed(3)}ms`,
        totalRequests: requestCount,
        statsAvg: stats.avgBatchFormationTimeMs
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 8: Concurrent Safety
  async testConcurrentSafety() {
    console.log(`${colors.blue}Testing Concurrent Safety...${colors.reset}`);
    
    const manager = new BatchManager({
      batchWindow: 50,
      maxBatchSize: 100,
      enableBatching: true
    });
    
    try {
      const concurrentCount = 1000;
      const promises = [];
      
      // Launch many concurrent requests
      for (let i = 0; i < concurrentCount; i++) {
        const promise = manager.addRequestWithExecutor(
          'getAccountInfo',
          [`concurrent_${i}`],
          { commitment: 'confirmed' },
          this.executor.execute.bind(this.executor)
        )
          .then(result => ({ success: true, result }))
          .catch(error => ({ success: false, error: error.message }));
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Concurrent requests: ${concurrentCount}${colors.reset}`);
      console.log(`${colors.cyan}Successful: ${successful}, Failed: ${failed}${colors.reset}`);
      console.log(`${colors.cyan}Batches sent: ${stats.batchesSent}${colors.reset}`);
      console.log(`${colors.cyan}Requests batched: ${stats.requestsBatched}${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: successful === concurrentCount && failed === 0,
        metric: 'concurrentSafety',
        expected: '0 data corruption',
        actual: failed === 0 ? 'No corruption' : `${failed} failures`,
        successful,
        failed,
        batchesSent: stats.batchesSent
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 9: Error Handling
  async testErrorHandling() {
    console.log(`${colors.blue}Testing Error Handling...${colors.reset}`);
    
    const manager = new BatchManager({
      batchWindow: 50,
      maxBatchSize: 5,
      enableBatching: true
    });
    
    try {
      // Enable error simulation
      this.executor.simulateErrors = true;
      
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          manager.addRequestWithExecutor(
            'getAccountInfo',
            [`error_test_${i}`],
            { commitment: 'confirmed' },
            this.executor.execute.bind(this.executor)
          )
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err.message }))
        );
      }
      
      const results = await Promise.all(promises);
      const failures = results.filter(r => !r.success);
      const errorMessages = failures.filter(r => 
        r.error.includes('Simulated batch execution error')
      );
      
      console.log(`${colors.cyan}Total requests: ${promises.length}${colors.reset}`);
      console.log(`${colors.cyan}Failures: ${failures.length}${colors.reset}`);
      console.log(`${colors.cyan}Correct error propagation: ${errorMessages.length === failures.length}${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: failures.length === 5 && errorMessages.length === 5,
        metric: 'errorHandling',
        expected: 'All errors propagated',
        actual: `${failures.length} errors propagated correctly`,
        totalRequests: promises.length,
        failures: failures.length
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Test 10: Flush Operations
  async testFlushOperations() {
    console.log(`${colors.blue}Testing Flush Operations...${colors.reset}`);
    
    const manager = new BatchManager({
      batchWindow: 1000, // Long window
      maxBatchSize: 100,
      enableBatching: true
    });
    
    try {
      // Add requests but don't wait
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          manager.addRequestWithExecutor(
            'getAccountInfo',
            [`flush_test_${i}`],
            { commitment: 'confirmed' },
            this.executor.execute.bind(this.executor)
          )
        );
      }
      
      // Check pending batches before flush
      const beforeFlush = manager.getStats().pendingBatches;
      
      // Force flush
      manager.flushAll();
      
      // Wait for completion
      await Promise.all(promises);
      
      const afterFlush = manager.getStats().pendingBatches;
      const stats = manager.getStats();
      
      console.log(`${colors.cyan}Pending before flush: ${beforeFlush}${colors.reset}`);
      console.log(`${colors.cyan}Pending after flush: ${afterFlush}${colors.reset}`);
      console.log(`${colors.cyan}Batches sent: ${stats.batchesSent}${colors.reset}`);
      
      manager.destroy();
      this.executor.reset();
      
      return {
        passed: beforeFlush > 0 && afterFlush === 0 && stats.batchesSent > 0,
        metric: 'flushOperations',
        expected: 'Pending batches flushed',
        actual: afterFlush === 0 ? 'All flushed' : `${afterFlush} still pending`,
        beforeFlush,
        afterFlush,
        batchesSent: stats.batchesSent
      };
      
    } catch (error) {
      manager.destroy();
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log(`\n${colors.bold}${colors.magenta}========================================${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}      BatchManager Test Suite${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}========================================${colors.reset}\n`);
    
    const tests = [
      { name: 'Batch Size Trigger', fn: () => this.testBatchSizeTrigger() },
      { name: 'Batch Timeout Trigger', fn: () => this.testBatchTimeoutTrigger() },
      { name: 'Response Routing', fn: () => this.testResponseRouting() },
      { name: 'Mixed Request Types', fn: () => this.testMixedRequestTypes() },
      { name: 'Batch Efficiency', fn: () => this.testBatchEfficiency() },
      { name: 'Memory Efficiency', fn: () => this.testMemoryEfficiency() },
      { name: 'Batch Formation Performance', fn: () => this.testBatchFormationPerformance() },
      { name: 'Concurrent Safety', fn: () => this.testConcurrentSafety() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() },
      { name: 'Flush Operations', fn: () => this.testFlushOperations() }
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
      'Batch Efficiency (>80%)': metrics.batchEfficiency || 'Not measured',
      'Timeout Accuracy (<10ms)': metrics.timeoutAccuracy || 'Not measured',
      'Response Routing (100%)': metrics.responseRouting || 'Not measured',
      'Memory Per Batch (<1KB)': metrics.memoryEfficiency || 'Not measured',
      'Formation Time (<10ms)': metrics.batchFormationTime || 'Not measured'
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
  const suite = new BatchManagerTestSuite();
  
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
        batchEfficiency: {
          target: '80%+ reduction',
          actual: metrics.batchEfficiency || 'Not measured',
          passed: metrics.batchEfficiency && parseFloat(metrics.batchEfficiency) >= 80
        },
        timeoutAccuracy: {
          target: 'Within 10ms',
          actual: metrics.timeoutAccuracy || 'Not measured',
          passed: metrics.timeoutAccuracy && parseFloat(metrics.timeoutAccuracy) <= 10
        },
        responseRouting: {
          target: '100% accurate',
          actual: metrics.responseRouting || 'Not measured',
          passed: metrics.responseRouting && metrics.responseRouting.includes('100%')
        },
        memoryEfficiency: {
          target: '<1KB per batch',
          actual: metrics.memoryEfficiency || 'Not measured',
          passed: metrics.memoryEfficiency && parseInt(metrics.memoryEfficiency) < 1024
        },
        batchFormationTime: {
          target: '<10ms per request',
          actual: metrics.batchFormationTime || 'Not measured',
          passed: metrics.batchFormationTime && parseFloat(metrics.batchFormationTime) < 10
        }
      }
    };
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    await fs.promises.writeFile(
      path.join(__dirname, 'batch-manager-test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n${colors.cyan}Test report saved to batch-manager-test-report.json${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BatchManagerTestSuite };