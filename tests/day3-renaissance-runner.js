#!/usr/bin/env node

/**
 * THORP DAY 3 RENAISSANCE TEST RUNNER
 * 
 * Simple test runner following Renaissance principles:
 * - Fast execution
 * - Clear output  
 * - Deterministic results
 * - Focus on money-critical validation
 */

import { RenaissanceTestSuite } from './day3-renaissance-tests.js';

// ===== SIMPLE COMMAND LINE INTERFACE =====
const args = process.argv.slice(2);
const command = args[0] || 'test';

function showUsage() {
  console.log(`
THORP DAY 3 RENAISSANCE TEST RUNNER

Usage:
  node day3-renaissance-runner.js [command]

Commands:
  test      Run all Day 3 production tests (default)
  quick     Run essential tests only (P3.1-P3.4)
  p3        Run P3 checkpoints only
  integration Run integration test only
  memory    Run memory leak test only

Options:
  --expose-gc   Enable garbage collection (recommended for memory test)

Examples:
  node day3-renaissance-runner.js test
  node --expose-gc day3-renaissance-runner.js memory
  node day3-renaissance-runner.js quick

Exit codes:
  0 = All tests passed - Ready for Day 4
  1 = Some tests failed - Fix before Day 4
`);
}

// ===== QUICK TEST SUITE =====
class QuickTestSuite extends RenaissanceTestSuite {
  async runQuickTests() {
    console.log('⚡ QUICK RENAISSANCE TESTS (Essential Only)');
    console.log('');

    const tests = [
      this.testP31_ExactFailureThreshold(),
      this.testP32_QuarantineProof(),
      this.testP33_SingleProbeExclusivity(),
      this.testP34_NoFalseTrips()
    ];

    const results = await Promise.allSettled(tests);
    const allPassed = results.every((result, index) => 
      result.status === 'fulfilled' && result.value === true
    );

    const passCount = this.results.filter(r => r.passed).length;
    const failCount = this.results.filter(r => !r.passed).length;

    console.log('');
    console.log(`📊 QUICK TEST RESULTS: ${passCount} passed, ${failCount} failed`);
    
    if (allPassed) {
      console.log('✅ Essential circuit breaker behavior validated');
      console.log('🚀 Ready for signal bus and integration testing');
    } else {
      console.error('❌ Critical circuit breaker issues found');
      console.error('🚨 Fix before proceeding');
    }

    return allPassed;
  }
}

// ===== MAIN EXECUTION =====
async function main() {
  try {
    switch (command) {
      case 'help':
      case '--help':
      case '-h':
        showUsage();
        process.exit(0);
        break;

      case 'quick':
        const quickSuite = new QuickTestSuite();
        const quickResult = await quickSuite.runQuickTests();
        process.exit(quickResult ? 0 : 1);
        break;

      case 'p3':
        const p3Suite = new RenaissanceTestSuite();
        console.log('🎯 P3 CHECKPOINT VALIDATION ONLY');
        console.log('');
        
        const p3Tests = [
          p3Suite.testP31_ExactFailureThreshold(),
          p3Suite.testP32_QuarantineProof(),
          p3Suite.testP33_SingleProbeExclusivity(),
          p3Suite.testP34_NoFalseTrips(),
          p3Suite.testP35_SignalBusLoadWithOrdering()
        ];

        const p3Results = await Promise.allSettled(p3Tests);
        const p3Passed = p3Results.every(r => r.status === 'fulfilled' && r.value);
        
        console.log('');
        if (p3Passed) {
          console.log('✅ All P3 checkpoints PASSED - Circuit breaker and signal bus ready');
        } else {
          console.error('❌ Some P3 checkpoints FAILED - Critical issues found');
        }
        
        process.exit(p3Passed ? 0 : 1);
        break;

      case 'integration':
        const integrationSuite = new RenaissanceTestSuite();
        console.log('🔗 INTEGRATION TEST ONLY');
        console.log('');
        
        const integrationResult = await integrationSuite.testBasicIntegration();
        
        console.log('');
        if (integrationResult) {
          console.log('✅ Integration test PASSED');
        } else {
          console.error('❌ Integration test FAILED');
        }
        
        process.exit(integrationResult ? 0 : 1);
        break;

      case 'memory':
        if (!global.gc) {
          console.error('❌ Memory test requires --expose-gc flag');
          console.log('Usage: node --expose-gc day3-renaissance-runner.js memory');
          process.exit(1);
        }
        
        const memorySuite = new RenaissanceTestSuite();
        console.log('🧠 MEMORY LEAK TEST ONLY');
        console.log('');
        
        const memoryResult = await memorySuite.testMemoryLeakDetection();
        
        console.log('');
        if (memoryResult) {
          console.log('✅ Memory test PASSED - No leaks detected');
        } else {
          console.error('❌ Memory test FAILED - Leaks detected');
        }
        
        process.exit(memoryResult ? 0 : 1);
        break;

      case 'test':
      default:
        console.log('🎯 STARTING FULL RENAISSANCE TEST SUITE');
        console.log('');
        
        const fullSuite = new RenaissanceTestSuite();
        const allPassed = await fullSuite.runAllTests();
        
        process.exit(allPassed ? 0 : 1);
        break;
    }

  } catch (error) {
    console.error('💥 Test runner crashed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ===== ENVIRONMENT CHECKS =====
function checkEnvironment() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    console.error(`❌ Node.js ${nodeVersion} not supported. Requires Node.js 18+`);
    process.exit(1);
  }
  
  // Check memory (fixed calculation)
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  
  console.log(`Memory: ${heapUsedMB.toFixed(1)}MB used, ${heapTotalMB.toFixed(1)}MB total`);
  
  // Only warn if actually problematic
  if (heapTotalMB < 100) {
    console.warn(`⚠️  Low total heap: ${heapTotalMB.toFixed(1)}MB (may need more memory)`);
  }
}

// Run environment checks and main function
checkEnvironment();
main();