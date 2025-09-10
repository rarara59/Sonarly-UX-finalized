/**
 * WORKER POOL MANAGER TEST SUITE - DIRECT NODE EXECUTION
 * 
 * Renaissance-grade worker pool testing without Jest framework.
 * Tests dynamic scaling, fault tolerance, performance, and production scenarios.
 * 
 * Usage: node src/tests/worker-pool.test.js
 */

import WorkerPoolManager from '../services/worker-pool-manager.service.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  minWorkers: 2,
  maxWorkers: 4,
  idleTimeout: 1000,    // 1 second for faster testing
  taskTimeout: 5000,    // 5 seconds
  queueMaxSize: 100,
  workerScript: join(__dirname, '../workers/parsing-worker.js')
  //workerScript: join(__dirname, '../workers/test-worker.js')  // FORCE OVERRIDE
};

// Test utilities
class TestRunner {
  constructor() {
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.startTime = Date.now();
  }

  async test(name, testFn) {
    this.testCount++;
    process.stdout.write(`\n🧪 ${name}... `);
    
    try {
      await testFn();
      this.passCount++;
      console.log('✅ PASS');
    } catch (error) {
      this.failCount++;
      console.log('❌ FAIL');
      console.log(`   Error: ${error.message}`);
      if (error.stack) {
        console.log(`   ${error.stack.split('\n')[1]?.trim()}`);
      }
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertGreaterThan(actual, threshold, message) {
    if (actual <= threshold) {
      throw new Error(message || `Expected ${actual} > ${threshold}`);
    }
  }

  assertLessThan(actual, threshold, message) {
    if (actual >= threshold) {
      throw new Error(message || `Expected ${actual} < ${threshold}`);
    }
  }

  summary() {
    const totalTime = Date.now() - this.startTime;
    console.log('\n' + '='.repeat(60));
    console.log(`📊 TEST SUMMARY`);
    console.log(`Total Tests: ${this.testCount}`);
    console.log(`✅ Passed: ${this.passCount}`);
    console.log(`❌ Failed: ${this.failCount}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`🎯 Success Rate: ${((this.passCount/this.testCount)*100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    if (this.failCount === 0) {
      console.log('🎉 ALL TESTS PASSED - Worker Pool is Production Ready!');
    } else {
      console.log(`⚠️  ${this.failCount} tests failed - Review implementation`);
    }
  }
}

// Main test execution
async function runWorkerPoolTests() {
  console.log('🚀 WORKER POOL MANAGER - PRODUCTION GRADE TESTS');
  console.log(`📍 CPU cores available: ${os.cpus().length}`);
  console.log(`📁 Test worker script: ${TEST_CONFIG.workerScript}`);
  
  const runner = new TestRunner();
  let workerPool;

  // Helper function to create fresh pool
  async function createFreshPool() {
    if (workerPool) {
      await workerPool.shutdown();
    }
    workerPool = new WorkerPoolManager(TEST_CONFIG);
    return workerPool;
  }

  // Helper function to cleanup
  async function cleanup() {
    if (workerPool) {
      await workerPool.shutdown();
      workerPool = null;
    }
  }

  try {
    // ========================================
    // TEST CATEGORY 1: POOL INITIALIZATION
    // ========================================
    
    await runner.test('Pool initializes with minimum workers', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const metrics = workerPool.getMetrics();
      runner.assertEqual(metrics.activeWorkers, TEST_CONFIG.minWorkers, 'Should have minimum workers');
      runner.assertEqual(metrics.queueLength, 0, 'Queue should be empty');
      runner.assertEqual(workerPool.workers.size, TEST_CONFIG.minWorkers, 'Worker map should match');
      
      console.log(`   ℹ️  Pool initialized with ${metrics.activeWorkers} workers`);
    });

    await runner.test('Worker script validation works', async () => {
      const invalidPool = new WorkerPoolManager({
        ...TEST_CONFIG,
        workerScript: '/nonexistent/path/worker.js'
      });
      
      let errorThrown = false;
      try {
        await invalidPool.initialize();
      } catch (error) {
        errorThrown = true;
        runner.assert(error.message.includes('Worker script not found'), 'Should throw script not found error');
      }
      
      runner.assert(errorThrown, 'Should throw error for invalid worker script');
    });

    await runner.test('Initialization event is emitted', async () => {
      await createFreshPool();
      
      let initEvent = null;
      workerPool.on('initialized', (event) => {
        initEvent = event;
      });
      
      await workerPool.initialize();
      
      runner.assert(initEvent !== null, 'Initialization event should be emitted');
      runner.assertEqual(initEvent.minWorkers, TEST_CONFIG.minWorkers, 'Event should contain min workers');
      runner.assertEqual(initEvent.maxWorkers, TEST_CONFIG.maxWorkers, 'Event should contain max workers');
    });

    // ========================================
    // TEST CATEGORY 2: TASK EXECUTION
    // ========================================

    await runner.test('Mathematical operations execute correctly', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const testData = {
        operation: 'kellyCriterion',
        parameters: {
          winRate: 0.6,
          avgWin: 1.5,
          avgLoss: 1.0
        }
      };
      
      const startTime = Date.now();
      const result = await workerPool.executeTask('mathematicalOperations', testData);
      const executionTime = Date.now() - startTime;
      
      runner.assertLessThan(executionTime, 100, 'Should execute in <100ms');
      runner.assert(result.kellyFraction !== undefined, 'Should return Kelly fraction');
      runner.assertGreaterThan(result.kellyFraction, 0, 'Kelly fraction should be positive');
      runner.assertLessThan(result.kellyFraction, 1, 'Kelly fraction should be < 1');
      
      console.log(`   ℹ️  Kelly criterion: ${result.kellyFraction.toFixed(4)} in ${executionTime}ms`);
    });

    await runner.test('Concurrent tasks execute efficiently', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const taskCount = 10;
      const taskPromises = [];
      
      for (let i = 0; i < taskCount; i++) {
        const testData = {
          operation: 'kellyCriterion',
          parameters: {
            winRate: 0.5 + (i * 0.01),
            avgWin: 1.2,
            avgLoss: 1.0
          }
        };
        taskPromises.push(workerPool.executeTask('mathematicalOperations', testData));
      }
      
      const startTime = Date.now();
      const results = await Promise.all(taskPromises);
      const totalTime = Date.now() - startTime;
      
      runner.assertEqual(results.length, taskCount, 'All tasks should complete');
      results.forEach((result, i) => {
        runner.assert(result.kellyFraction !== undefined, `Task ${i} should return result`);
      });
      
      const avgTimePerTask = totalTime / taskCount;
      runner.assertLessThan(avgTimePerTask, 100, 'Average time per task should be <100ms');
      
      console.log(`   ℹ️  ${taskCount} tasks in ${totalTime}ms (${avgTimePerTask.toFixed(1)}ms avg)`);
    });

    await runner.test('Risk calculations execute within performance limits', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const testData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.1),
        positions: [100000],
        correlations: [[1]],
        volatility: 0.2
      };
      
      const startTime = Date.now();
      const result = await workerPool.executeTask('riskCalculations', testData);
      const executionTime = Date.now() - startTime;
      
      runner.assertLessThan(executionTime, 100, 'Should execute in <100ms');
      runner.assert(result.var95 !== undefined, 'Should return VaR 95%');
      runner.assert(result.sharpeRatio !== undefined, 'Should return Sharpe ratio');
      runner.assert(result.maxDrawdown !== undefined, 'Should return max drawdown');
      
      console.log(`   ℹ️  Risk calc: VaR95=${result.var95.toFixed(4)}, Sharpe=${result.sharpeRatio.toFixed(2)} in ${executionTime}ms`);
    });

    // ========================================
    // TEST CATEGORY 3: DYNAMIC SCALING
    // ========================================

    await runner.test('Workers scale up under load', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const initialWorkers = workerPool.workers.size;
      const taskPromises = [];
      const taskCount = 8; // More than min workers
      
      for (let i = 0; i < taskCount; i++) {
        const testData = {
          operation: 'kellyCriterion',
          parameters: { winRate: 0.6, avgWin: 1.2, avgLoss: 1.0 }
        };
        taskPromises.push(workerPool.executeTask('mathematicalOperations', testData));
        
        // Small delay to allow scaling
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const scaledWorkers = workerPool.workers.size;
      runner.assertGreaterThan(scaledWorkers, initialWorkers, 'Should scale up workers');
      runner.assertLessThan(scaledWorkers, TEST_CONFIG.maxWorkers + 1, 'Should not exceed max workers');
      
      console.log(`   ℹ️  Scaled from ${initialWorkers} to ${scaledWorkers} workers`);
      
      await Promise.all(taskPromises);
    });

    await runner.test('Workers respect maximum limit', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const taskPromises = [];
      const excessiveTasks = TEST_CONFIG.maxWorkers * 3;
      
      for (let i = 0; i < excessiveTasks; i++) {
        const testData = {
          operation: 'kellyCriterion',
          parameters: { winRate: 0.55, avgWin: 1.1, avgLoss: 1.0 }
        };
        taskPromises.push(workerPool.executeTask('mathematicalOperations', testData));
      }
      
      // Allow scaling to occur
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const workerCount = workerPool.workers.size;
      runner.assertLessThan(workerCount, TEST_CONFIG.maxWorkers + 1, 'Should respect max worker limit');
      
      console.log(`   ℹ️  Worker count ${workerCount} respects limit ${TEST_CONFIG.maxWorkers}`);
      
      await Promise.all(taskPromises);
    });

    // ========================================
    // TEST CATEGORY 4: ERROR HANDLING
    // ========================================

    await runner.test('Invalid tasks are handled gracefully', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      let errorThrown = false;
      try {
        await workerPool.executeTask('invalidTaskType', {});
      } catch (error) {
        errorThrown = true;
        runner.assert(error.message.includes('Unknown task type'), 'Should throw unknown task type error');
      }
      
      runner.assert(errorThrown, 'Should throw error for invalid task');
      
      // Verify pool still functions
      const validTask = {
        operation: 'kellyCriterion',
        parameters: { winRate: 0.6, avgWin: 1.2, avgLoss: 1.0 }
      };
      
      const result = await workerPool.executeTask('mathematicalOperations', validTask);
      runner.assert(result.kellyFraction !== undefined, 'Pool should still function after error');
    });

    // ========================================
    // TEST CATEGORY 5: PERFORMANCE METRICS
    // ========================================

    await runner.test('Performance metrics are tracked accurately', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const initialMetrics = workerPool.getMetrics();
      
      // Execute several tasks
      const taskPromises = [];
      for (let i = 0; i < 5; i++) {
        const testData = {
          operation: 'kellyCriterion',
          parameters: { winRate: 0.6, avgWin: 1.2, avgLoss: 1.0 }
        };
        taskPromises.push(workerPool.executeTask('mathematicalOperations', testData));
      }
      
      await Promise.all(taskPromises);
      
      const finalMetrics = workerPool.getMetrics();
      
      runner.assertEqual(finalMetrics.totalTasks, initialMetrics.totalTasks + 5, 'Should track total tasks');
      runner.assertEqual(finalMetrics.completedTasks, initialMetrics.completedTasks + 5, 'Should track completed tasks');
      runner.assertGreaterThan(finalMetrics.successRate, 0.9, 'Should have high success rate');
      runner.assertGreaterThan(finalMetrics.avgExecutionTime, 0, 'Should track execution time');
      
      console.log(`   ℹ️  Metrics: ${finalMetrics.totalTasks} total, ${(finalMetrics.successRate*100).toFixed(1)}% success`);
    });

    // ========================================
    // TEST CATEGORY 6: MEMORY MANAGEMENT
    // ========================================

    await runner.test('Memory cleanup works correctly', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const initialPending = workerPool.pendingTasks.size;
      
      const testData = {
        operation: 'kellyCriterion',
        parameters: { winRate: 0.6, avgWin: 1.2, avgLoss: 1.0 }
      };
      
      await workerPool.executeTask('mathematicalOperations', testData);
      
      const finalPending = workerPool.pendingTasks.size;
      runner.assertEqual(finalPending, initialPending, 'Completed tasks should be cleaned up');
      
      console.log(`   ℹ️  Pending tasks: ${finalPending} (properly cleaned up)`);
    });

    await runner.test('Graceful shutdown works correctly', async () => {
      await createFreshPool();
      await workerPool.initialize();
      
      const initialWorkers = workerPool.workers.size;
      runner.assertGreaterThan(initialWorkers, 0, 'Should have workers before shutdown');
      
      await workerPool.shutdown();
      
      runner.assertEqual(workerPool.workers.size, 0, 'All workers should be terminated');
      
      console.log(`   ℹ️  Shutdown complete: ${initialWorkers} workers terminated`);
    });

  } finally {
    await cleanup();
  }

  runner.summary();
  return runner.failCount === 0;
}

// Execute tests
runWorkerPoolTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });