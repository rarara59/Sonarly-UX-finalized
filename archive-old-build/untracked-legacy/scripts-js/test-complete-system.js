import { ModularEdgeCalculatorComplete } from './modular-edge-calculator-complete-js.js';

class ComprehensiveSystemTest {
  constructor() {
    this.calculator = new ModularEdgeCalculatorComplete(console);
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Running Comprehensive System Tests...');
    
    // Test 1: High-quality token should qualify
    await this.testHighQualityToken();
    
    // Test 2: Low-quality token should reject
    await this.testLowQualityToken();
    
    // Test 3: Medium-quality token threshold testing
    await this.testMediumQualityToken();
    
    // Test 4: Edge case testing
    await this.testEdgeCases();
    
    // Test 5: Performance testing
    await this.testPerformance();
    
    this.generateReport();
  }

  async testHighQualityToken() {
    console.log('\n📊 Test 1: High-Quality Token (Should QUALIFY)');
    
    const result = await this.calculator.evaluateToken(
      'X69GKB2f_high_quality_test',
      0.001,
      3 // 3 minutes old
    );
    
    const passed = result.isQualified && result.confidence >= 75;
    
    this.testResults.push({
      test: 'High-Quality Token',
      passed,
      confidence: result.confidence,
      qualified: result.isQualified,
      expected: 'QUALIFIED',
      actual: result.isQualified ? 'QUALIFIED' : 'REJECTED'
    });
    
    console.log(`${passed ? '✅' : '❌'} Result: ${result.confidence.toFixed(1)}% - ${result.isQualified ? 'QUALIFIED' : 'REJECTED'}`);
  }

  async testLowQualityToken() {
    console.log('\n📊 Test 2: Low-Quality Token (Should REJECT)');
    
    const result = await this.calculator.evaluateToken(
      'Fcfw6R48_low_quality_test',
      0.0005,
      25 // 25 minutes old
    );
    
    const passed = !result.isQualified && result.confidence < 75;
    
    this.testResults.push({
      test: 'Low-Quality Token',
      passed,
      confidence: result.confidence,
      qualified: result.isQualified,
      expected: 'REJECTED',
      actual: result.isQualified ? 'QUALIFIED' : 'REJECTED'
    });
    
    console.log(`${passed ? '✅' : '❌'} Result: ${result.confidence.toFixed(1)}% - ${result.isQualified ? 'QUALIFIED' : 'REJECTED'}`);
  }

  async testMediumQualityToken() {
    console.log('\n📊 Test 3: Medium-Quality Token (Threshold Test)');
    
    const result = await this.calculator.evaluateToken(
      'MEDIUM_test_token_threshold',
      0.0008,
      8 // 8 minutes old
    );
    
    const passed = result.confidence >= 40 && result.confidence <= 90;
    
    this.testResults.push({
      test: 'Medium-Quality Token',
      passed,
      confidence: result.confidence,
      qualified: result.isQualified,
      expected: 'VARIABLE',
      actual: result.isQualified ? 'QUALIFIED' : 'REJECTED'
    });
    
    console.log(`${passed ? '✅' : '❌'} Result: ${result.confidence.toFixed(1)}% - ${result.isQualified ? 'QUALIFIED' : 'REJECTED'}`);
  }

  async testEdgeCases() {
    console.log('\n📊 Test 4: Edge Cases');
    
    // Test very fresh token
    const freshResult = await this.calculator.evaluateToken(
      'FRESH_1min_token',
      0.002,
      1 // 1 minute old
    );
    
    // Test older token
    const oldResult = await this.calculator.evaluateToken(
      'OLD_60min_token',
      0.0003,
      60 // 60 minutes old
    );
    
    const freshPassed = freshResult.confidence > oldResult.confidence;
    
    this.testResults.push({
      test: 'Age Differentiation',
      passed: freshPassed,
      confidence: `Fresh: ${freshResult.confidence.toFixed(1)}%, Old: ${oldResult.confidence.toFixed(1)}%`,
      qualified: `Fresh: ${freshResult.isQualified}, Old: ${oldResult.isQualified}`,
      expected: 'Fresh > Old',
      actual: freshPassed ? 'Fresh > Old' : 'Old >= Fresh'
    });
    
    console.log(`${freshPassed ? '✅' : '❌'} Fresh: ${freshResult.confidence.toFixed(1)}% vs Old: ${oldResult.confidence.toFixed(1)}%`);
  }

  async testPerformance() {
    console.log('\n📊 Test 5: Performance Testing');
    
    const startTime = Date.now();
    
    // Test 10 token evaluations
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(this.calculator.evaluateToken(
        `PERF_test_token_${i}`,
        0.001,
        Math.floor(Math.random() * 30) + 1
      ));
    }
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / 10;
    
    const passed = avgTime < 1000; // Under 1 second per token
    
    this.testResults.push({
      test: 'Performance',
      passed,
      confidence: `${avgTime.toFixed(0)}ms avg`,
      qualified: `${results.filter(r => r.isQualified).length}/10 qualified`,
      expected: '<1000ms',
      actual: `${avgTime.toFixed(0)}ms`
    });
    
    console.log(`${passed ? '✅' : '❌'} Average: ${avgTime.toFixed(0)}ms per token (${totalTime}ms total)`);
  }

  generateReport() {
    console.log('\n📋 COMPREHENSIVE TEST REPORT');
    console.log('=' * 50);
    
    const passedTests = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;
    
    console.log(`Overall: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log('');
    
    this.testResults.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
      console.log(`   Expected: ${result.expected}, Actual: ${result.actual}`);
      console.log(`   Confidence: ${result.confidence}, Qualified: ${result.qualified}`);
      console.log('');
    });
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION');
    } else {
      console.log('⚠️  SOME TESTS FAILED - REVIEW REQUIRED');
    }
  }
}

// Run tests
const testSuite = new ComprehensiveSystemTest();
testSuite.runAllTests().catch(console.error);