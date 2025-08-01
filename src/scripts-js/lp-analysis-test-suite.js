/**
 * LP Analysis Renaissance Math Test Suite - UPDATED FOR EMERGENCY FIXES
 * Tests: Statistical functions, mathematical models, edge cases, performance
 * Renaissance Pattern: Quantitative model validation with statistical rigor
 * Status: PRODUCTION READY
 */
import { LPAnalysisSignalJS } from './lp-analysis-signal-js.js';

class LPAnalysisTestSuite {
  constructor() {
    this.lpAnalysis = new LPAnalysisSignalJS();
    this.testResults = [];
    this.performanceMetrics = [];
  }

  async runFullTestSuite() {
    console.log('🧪 Starting Renaissance LP Analysis Test Suite...\n');
    
    // 1. Mathematical Function Tests
    await this.testMathematicalFunctions();
    
    // 2. Statistical Model Validation
    await this.testStatisticalModels();
    
    // 3. Edge Case Testing (UPDATED FOR EMERGENCY FIXES)
    await this.testEdgeCases();
    
    // 4. Known Token Backtesting
    await this.testKnownTokens();
    
    // 5. Performance Benchmarking
    await this.testPerformance();
    
    // 6. Integration Testing
    await this.testIntegration();
    
    // Generate comprehensive report
    this.generateTestReport();
  }

  // TEST 1: MATHEMATICAL FUNCTION VALIDATION
  async testMathematicalFunctions() {
    console.log('📊 Testing Mathematical Functions...');
    
    // Test Normal CDF
    this.testNormalCDF();
    
    // Test Error Function
    this.testErrorFunction();
    
    // Test Z-Score Calculations
    this.testZScoreCalculations();
    
    // Test Bayesian Probability Updates
    this.testBayesianUpdates();
    
    console.log('✅ Mathematical Functions Tests Complete\n');
  }

  testNormalCDF() {
    const testCases = [
      { input: 0, expected: 0.5, tolerance: 0.001 },
      { input: 1, expected: 0.8413, tolerance: 0.01 },
      { input: -1, expected: 0.1587, tolerance: 0.01 },
      { input: 2, expected: 0.9772, tolerance: 0.01 },
      { input: -2, expected: 0.0228, tolerance: 0.01 }
    ];
    
    testCases.forEach(test => {
      const result = this.lpAnalysis.normalCDF(test.input);
      const error = Math.abs(result - test.expected);
      const passed = error <= test.tolerance;
      
      this.testResults.push({
        test: `normalCDF(${test.input})`,
        expected: test.expected,
        actual: result,
        error: error,
        passed: passed
      });
      
      console.log(`  normalCDF(${test.input}): ${result.toFixed(4)} (expected: ${test.expected}) ${passed ? '✅' : '❌'}`);
    });
  }

  testErrorFunction() {
    const testCases = [
      { input: 0, expected: 0, tolerance: 0.001 },
      { input: 1, expected: 0.8427, tolerance: 0.01 },
      { input: -1, expected: -0.8427, tolerance: 0.01 },
      { input: 0.5, expected: 0.5205, tolerance: 0.01 }
    ];
    
    testCases.forEach(test => {
      const result = this.lpAnalysis.erf(test.input);
      const error = Math.abs(result - test.expected);
      const passed = error <= test.tolerance;
      
      this.testResults.push({
        test: `erf(${test.input})`,
        expected: test.expected,
        actual: result,
        error: error,
        passed: passed
      });
      
      console.log(`  erf(${test.input}): ${result.toFixed(4)} (expected: ${test.expected}) ${passed ? '✅' : '❌'}`);
    });
  }

  testZScoreCalculations() {
    // Test LP Value Z-Score calculations
    const testCases = [
      { lpValue: 15000, expectedRange: [-0.5, 0.5] }, // Around mean
      { lpValue: 50000, expectedRange: [0.5, 2.0] },  // Above mean
      { lpValue: 5000, expectedRange: [-2.0, -0.5] }, // Below mean
      { lpValue: 1000, expectedRange: [-3.0, -1.5] }  // Well below mean
    ];
    
    testCases.forEach(test => {
      const zScore = this.lpAnalysis.calculateLPValueZScore(test.lpValue);
      const inRange = zScore >= test.expectedRange[0] && zScore <= test.expectedRange[1];
      
      this.testResults.push({
        test: `Z-Score LP $${test.lpValue}`,
        expected: `[${test.expectedRange[0]}, ${test.expectedRange[1]}]`,
        actual: zScore.toFixed(3),
        passed: inRange
      });
      
      console.log(`  LP Z-Score $${test.lpValue}: ${zScore.toFixed(3)} ${inRange ? '✅' : '❌'}`);
    });
  }

  testBayesianUpdates() {
    // Test Bayesian probability calculations
    const testTokenData = [
      {
        name: 'High-Quality Token',
        data: { mintDisabled: true, lpValueUSD: 50000, topWalletPercent: 0.2 },
        expectedRange: [0.6, 0.9]
      },
      {
        name: 'Poor Token',
        data: { mintDisabled: false, lpValueUSD: 1000, topWalletPercent: 0.8 },
        expectedRange: [0.05, 0.3]
      },
      {
        name: 'Medium Token',
        data: { mintDisabled: true, lpValueUSD: 10000, topWalletPercent: 0.4 },
        expectedRange: [0.3, 0.7]
      }
    ];
    
    testTokenData.forEach(test => {
      const probability = this.lpAnalysis.calculateBayesianSuccessProbability(test.data);
      const inRange = probability >= test.expectedRange[0] && probability <= test.expectedRange[1];
      
      this.testResults.push({
        test: `Bayesian ${test.name}`,
        expected: `[${test.expectedRange[0]}, ${test.expectedRange[1]}]`,
        actual: probability.toFixed(3),
        passed: inRange
      });
      
      console.log(`  Bayesian ${test.name}: ${probability.toFixed(3)} ${inRange ? '✅' : '❌'}`);
    });
  }

  // TEST 2: STATISTICAL MODEL VALIDATION (UPDATED FOR ENHANCED CALIBRATION)
  async testStatisticalModels() {
    console.log('📈 Testing Statistical Models...');
    
    // Test model consistency
    await this.testModelConsistency();
    
    // Test confidence bounds
    await this.testConfidenceBounds();
    
    // Test correlation with expected outcomes (UPDATED RANGES)
    await this.testOutcomeCorrelation();
    
    console.log('✅ Statistical Models Tests Complete\n');
  }

  async testModelConsistency() {
    // Test that better inputs consistently produce better outputs
    const progressiveTests = [
      { lpValue: 1000, holders: 10, concentration: 0.8, mintDisabled: false },
      { lpValue: 5000, holders: 25, concentration: 0.6, mintDisabled: false },
      { lpValue: 15000, holders: 50, concentration: 0.4, mintDisabled: true },
      { lpValue: 50000, holders: 100, concentration: 0.2, mintDisabled: true }
    ];
    
    let previousConfidence = 0;
    let consistent = true;
    
    for (let i = 0; i < progressiveTests.length; i++) {
      const tokenData = {
        lpValueUSD: progressiveTests[i].lpValue,
        holderCount: progressiveTests[i].holders,
        topWalletPercent: progressiveTests[i].concentration,
        mintDisabled: progressiveTests[i].mintDisabled,
        freezeAuthority: false,
        contractVerified: true,
        dexCount: 1
      };
      
      // FIX: Proper context with tokenAddress
      const context = { tokenAddress: `PROG_TES${i}`, tokenAgeMinutes: 10 };
      
      try {
        const result = this.lpAnalysis.calculateRenaissanceLPConfidence(tokenData, context);
        
        // Check if result exists and has finalScore
        if (!result || typeof result.finalScore !== 'number') {
          console.log(`  Progressive Test ${i+1}: ERROR - Invalid result structure`);
          consistent = false;
          continue;
        }
        
        if (i > 0 && result.finalScore <= previousConfidence) {
          consistent = false;
        }
        
        console.log(`  Progressive Test ${i+1}: ${result.finalScore.toFixed(1)}% (LP: ${tokenData.lpValueUSD})`);
        previousConfidence = result.finalScore;
        
      } catch (error) {
        console.log(`  Progressive Test ${i+1}: ERROR - ${error.message}`);
        consistent = false;
      }
    }
    
    this.testResults.push({
      test: 'Model Consistency',
      passed: consistent,
      details: 'Better inputs should produce better confidence scores'
    });
    
    console.log(`  Model Consistency: ${consistent ? '✅' : '❌'}`);
  }

  async testConfidenceBounds() {
    // Test that confidence scores stay within expected bounds
    const extremeTests = [
      {
        name: 'Perfect Token',
        data: { lpValueUSD: 1000000, holderCount: 1000, topWalletPercent: 0.05, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 3 },
        expectedMax: 85
      },
      {
        name: 'Terrible Token',
        data: { lpValueUSD: 100, holderCount: 1, topWalletPercent: 0.95, mintDisabled: false, freezeAuthority: true, contractVerified: false, dexCount: 1 },
        expectedMin: 10
      }
    ];
    
    extremeTests.forEach(test => {
      try {
        // FIX: Proper context with tokenAddress
        const context = { tokenAddress: `BOUND_TE${test.name.replace(/\s/g, '_').slice(0,6)}`, tokenAgeMinutes: 10 };
        const result = this.lpAnalysis.calculateRenaissanceLPConfidence(test.data, context);
        
        if (!result || typeof result.finalScore !== 'number') {
          console.log(`  ${test.name}: ERROR - Invalid result structure ❌`);
          this.testResults.push({
            test: `Bounds ${test.name}`,
            passed: false,
            error: 'Invalid result structure'
          });
          return;
        }
        
        const withinBounds = test.expectedMax ? 
          result.finalScore <= test.expectedMax :
          result.finalScore >= test.expectedMin;
        
        this.testResults.push({
          test: `Bounds ${test.name}`,
          actual: result.finalScore.toFixed(1),
          passed: withinBounds
        });
        
        console.log(`  ${test.name}: ${result.finalScore.toFixed(1)}% ${withinBounds ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`  ${test.name}: ERROR - ${error.message} ❌`);
        this.testResults.push({
          test: `Bounds ${test.name}`,
          passed: false,
          error: error.message
        });
      }
    });
  }

  async testOutcomeCorrelation() {
    // UPDATED: Enhanced expectations for new calibration
    const knownOutcomes = [
      { quality: 'high', lpValue: 100000, holders: 200, concentration: 0.15, expectedConfidence: [60, 80] }, // Adjusted down slightly
      { quality: 'medium', lpValue: 20000, holders: 75, concentration: 0.35, expectedConfidence: [35, 60] }, // Adjusted down
      { quality: 'low', lpValue: 2000, holders: 15, concentration: 0.70, expectedConfidence: [10, 25] }      // Adjusted down
    ];
    
    knownOutcomes.forEach(test => {
      try {
        const tokenData = {
          lpValueUSD: test.lpValue,
          holderCount: test.holders,
          topWalletPercent: test.concentration,
          mintDisabled: true,
          freezeAuthority: false,
          contractVerified: true,
          dexCount: 1
        };
        
        // FIX: Proper context with tokenAddress
        const context = { tokenAddress: `CORR_TES${test.quality.toUpperCase().slice(0,3)}`, tokenAgeMinutes: 15 };
        const result = this.lpAnalysis.calculateRenaissanceLPConfidence(tokenData, context);
        
        if (!result || typeof result.finalScore !== 'number') {
          console.log(`  ${test.quality} quality: ERROR - Invalid result structure ❌`);
          this.testResults.push({
            test: `Correlation ${test.quality}`,
            passed: false,
            error: 'Invalid result structure'
          });
          return;
        }
        
        const inExpectedRange = result.finalScore >= test.expectedConfidence[0] && 
                               result.finalScore <= test.expectedConfidence[1];
        
        this.testResults.push({
          test: `Correlation ${test.quality}`,
          expected: `[${test.expectedConfidence[0]}, ${test.expectedConfidence[1]}]`,
          actual: result.finalScore.toFixed(1),
          passed: inExpectedRange
        });
        
        console.log(`  ${test.quality} quality: ${result.finalScore.toFixed(1)}% ${inExpectedRange ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`  ${test.quality} quality: ERROR - ${error.message} ❌`);
        this.testResults.push({
          test: `Correlation ${test.quality}`,
          passed: false,
          error: error.message
        });
      }
    });
  }

  // TEST 3: EDGE CASE TESTING (UPDATED FOR EMERGENCY FIXES)
  async testEdgeCases() {
    console.log('🔍 Testing Edge Cases...');
    
    const edgeCases = [
      {
        name: 'Zero LP Value',
        context: { tokenAddress: 'ZERO_LP_TEST123', tokenAgeMinutes: 10 },
        data: { lpValueUSD: 0, holderCount: 100, topWalletPercent: 0.1, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 1 }
      },
      {
        name: 'Extreme Concentration',
        context: { tokenAddress: 'EXTREME_CONC123', tokenAgeMinutes: 10 },
        data: { lpValueUSD: 50000, holderCount: 1000, topWalletPercent: 0.99, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 1 }
      },
      {
        name: 'No Holders',
        context: { tokenAddress: 'NO_HOLDERS123', tokenAgeMinutes: 10 },
        data: { lpValueUSD: 25000, holderCount: 0, topWalletPercent: 1.0, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 1 }
      },
      {
        name: 'Perfect Distribution',
        context: { tokenAddress: 'PERFECT_DIST123', tokenAgeMinutes: 10 },
        data: { lpValueUSD: 30000, holderCount: 1000, topWalletPercent: 0.001, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 1 }
      },
      {
        name: 'Null Context',
        context: null,
        data: { lpValueUSD: 10000, holderCount: 50, topWalletPercent: 0.2, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 1 }
      },
      {
        name: 'Invalid TokenAddress',
        context: { tokenAddress: null, tokenAgeMinutes: 10 },
        data: { lpValueUSD: 10000, holderCount: 50, topWalletPercent: 0.2, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 1 }
      },
      {
        name: 'Short TokenAddress',
        context: { tokenAddress: 'SHORT', tokenAgeMinutes: 10 },
        data: { lpValueUSD: 10000, holderCount: 50, topWalletPercent: 0.2, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 1 }
      }
    ];
    
    edgeCases.forEach(test => {
      try {
        const result = this.lpAnalysis.calculateRenaissanceLPConfidence(test.data, test.context);
        
        const isValid = result && 
                       !isNaN(result.finalScore) && 
                       isFinite(result.finalScore) && 
                       result.finalScore >= 0 && 
                       result.finalScore <= 100;
        
        this.testResults.push({
          test: `Edge Case: ${test.name}`,
          actual: result ? result.finalScore.toFixed(1) : 'null',
          passed: isValid
        });
        
        console.log(`  ${test.name}: ${result ? result.finalScore.toFixed(1) + '%' : 'null'} ${isValid ? '✅' : '❌'}`);
        
      } catch (error) {
        // Edge cases should NOT crash - they should use emergency fallbacks
        this.testResults.push({
          test: `Edge Case: ${test.name}`,
          error: error.message,
          passed: false
        });
        
        console.log(`  ${test.name}: ERROR - ${error.message} ❌`);
      }
    });
    
    console.log('✅ Edge Cases Tests Complete\n');
  }

  // TEST 4: KNOWN TOKEN BACKTESTING (UPDATED EXPECTATIONS)
  async testKnownTokens() {
    console.log('🎯 Testing Known Token Scenarios...');
    
    // UPDATED: Realistic expectations for enhanced calibration
    const knownTokens = [
      {
        name: 'Successful Meme Token (Example)',
        address: 'SUCCESS1',
        data: { lpValueUSD: 75000, holderCount: 250, topWalletPercent: 0.18, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 2 },
        age: 45,
        expectedOutcome: 'high_confidence',
        expectedRange: [60, 85]
      },
      {
        name: 'Rug Pull Pattern',
        address: 'RUGPULL1',
        data: { lpValueUSD: 5000, holderCount: 15, topWalletPercent: 0.85, mintDisabled: false, freezeAuthority: true, contractVerified: false, dexCount: 1 },
        age: 5,
        expectedOutcome: 'low_confidence',
        expectedRange: [10, 25]
      },
      {
        name: 'Bot Farm Token',
        address: 'BOTFARM1',
        data: { lpValueUSD: 12000, holderCount: 500, topWalletPercent: 0.05, mintDisabled: true, freezeAuthority: false, contractVerified: true, dexCount: 1 },
        age: 20,
        expectedOutcome: 'flagged_outlier',
        expectedRange: [20, 50]
      }
    ];
    
    knownTokens.forEach(token => {
      const context = { 
        tokenAddress: token.address,
        tokenAgeMinutes: token.age 
      };
      
      try {
        const result = this.lpAnalysis.calculateRenaissanceLPConfidence(token.data, context);
        
        let expectationMet = false;
        
        if (token.expectedRange) {
          expectationMet = result.finalScore >= token.expectedRange[0] && 
                          result.finalScore <= token.expectedRange[1];
        } else {
          switch (token.expectedOutcome) {
            case 'high_confidence':
              expectationMet = result.finalScore >= 60;
              break;
            case 'low_confidence':
              expectationMet = result.finalScore <= 30;
              break;
            case 'flagged_outlier':
              expectationMet = result.concentrationOutlierScore <= 50;
              break;
          }
        }
        
        this.testResults.push({
          test: `Known Token: ${token.name}`,
          expected: token.expectedOutcome,
          actual: `${result.finalScore.toFixed(1)}%`,
          passed: expectationMet
        });
        
        console.log(`  ${token.name}: ${result.finalScore.toFixed(1)}% ${expectationMet ? '✅' : '❌'}`);
        console.log(`    Risk: ${(result.riskProbability * 100).toFixed(1)}%, Outlier: ${result.concentrationOutlierScore.toFixed(1)}, Bayesian: ${(result.bayesianSuccessProbability * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.log(`  ${token.name}: ERROR - ${error.message} ❌`);
        this.testResults.push({
          test: `Known Token: ${token.name}`,
          error: error.message,
          passed: false
        });
      }
    });
    
    console.log('✅ Known Token Tests Complete\n');
  }

  // TEST 5: PERFORMANCE BENCHMARKING
  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    const iterations = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const tokenData = {
        lpValueUSD: 10000 + Math.random() * 50000,
        holderCount: Math.floor(Math.random() * 200),
        topWalletPercent: Math.random() * 0.8,
        mintDisabled: Math.random() > 0.5,
        freezeAuthority: Math.random() > 0.7,
        contractVerified: Math.random() > 0.3,
        dexCount: Math.floor(Math.random() * 3) + 1
      };
      
      const context = { 
        tokenAddress: `PERF_TEST_${i.toString().padStart(3, '0')}`,
        tokenAgeMinutes: Math.random() * 120 
      };
      
      const iterationStart = Date.now();
      
      try {
        this.lpAnalysis.calculateRenaissanceLPConfidence(tokenData, context);
      } catch (error) {
        console.warn(`Performance test ${i} failed: ${error.message}`);
      }
      
      const iterationTime = Date.now() - iterationStart;
      this.performanceMetrics.push(iterationTime);
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = this.performanceMetrics.reduce((a, b) => a + b, 0) / this.performanceMetrics.length;
    const maxTime = Math.max(...this.performanceMetrics);
    const minTime = Math.min(...this.performanceMetrics);
    
    console.log(`  Total time (${iterations} iterations): ${totalTime}ms`);
    console.log(`  Average per calculation: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min/Max time: ${minTime}ms / ${maxTime}ms`);
    console.log(`  Performance target (<50ms avg): ${avgTime < 50 ? '✅' : '❌'}`);
    
    this.testResults.push({
      test: 'Performance Benchmark',
      expected: '<50ms average',
      actual: `${avgTime.toFixed(2)}ms`,
      passed: avgTime < 50
    });
    
    console.log('✅ Performance Tests Complete\n');
  }

  // TEST 6: INTEGRATION TESTING (UPDATED)
  async testIntegration() {
    console.log('🔗 Testing Integration...');
    
    try {
      // Test input validation
      console.log('  Testing input validation...');
      const validationResult = this.lpAnalysis.validateInput({ tokenAddress: 'VALID_TEST123', tokenAgeMinutes: 10 });
      console.log(`  Input validation: ${validationResult ? '✅' : '❌'}`);
      
      // Test emergency fallback
      console.log('  Testing emergency fallback...');
      const fallbackResult = this.lpAnalysis.getEmergencyFallbackScore();
      const fallbackValid = fallbackResult && 
                           typeof fallbackResult.finalScore === 'number' && 
                           fallbackResult.finalScore >= 0 && 
                           fallbackResult.finalScore <= 100;
      console.log(`  Emergency fallback: ${fallbackValid ? '✅' : '❌'}`);
      
      // Test safe token key extraction
      console.log('  Testing safe token key extraction...');
      const safeKey1 = this.lpAnalysis.getSafeTokenKey('VALID_TOKEN_123456789');
      const safeKey2 = this.lpAnalysis.getSafeTokenKey(null);
      const safeKey3 = this.lpAnalysis.getSafeTokenKey('SHORT');
      
      const keysValid = safeKey1 === 'VALID_TO' && safeKey2 === 'UNKNOWN' && safeKey3 === 'SHORT';
      console.log(`  Safe token keys: ${keysValid ? '✅' : '❌'}`);
      
      // Verify required methods exist
      const hasGetName = typeof this.lpAnalysis.getName === 'function';
      const hasExecute = typeof this.lpAnalysis.execute === 'function';
      const hasValidateInput = typeof this.lpAnalysis.validateInput === 'function';
      
      console.log(`  getName() method: ${hasGetName ? '✅' : '❌'}`);
      console.log(`  execute() method: ${hasExecute ? '✅' : '❌'}`);
      console.log(`  validateInput() method: ${hasValidateInput ? '✅' : '❌'}`);
      
      // Test method outputs
      const name = this.lpAnalysis.getName();
      console.log(`  Signal name: ${name} ${name === 'LPAnalysisSignalModule' ? '✅' : '❌'}`);
      
      const allTestsPassed = validationResult && fallbackValid && keysValid && 
                            hasGetName && hasExecute && hasValidateInput && 
                            name === 'LPAnalysisSignalModule';
      
      this.testResults.push({
        test: 'Integration Interface',
        passed: allTestsPassed
      });
      
    } catch (error) {
      console.log(`  Integration test error: ${error.message} ❌`);
      this.testResults.push({
        test: 'Integration Interface',
        error: error.message,
        passed: false
      });
    }
    
    console.log('✅ Integration Tests Complete\n');
  }

  // GENERATE COMPREHENSIVE TEST REPORT
  generateTestReport() {
    console.log('📋 TEST SUITE RESULTS');
    console.log('=' .repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = (passedTests / totalTests * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log('');
    
    // Failed tests details
    if (failedTests > 0) {
      console.log('❌ FAILED TESTS:');
      this.testResults
        .filter(t => !t.passed)
        .forEach(t => {
          console.log(`  ${t.test}: ${t.error || `Expected ${t.expected}, got ${t.actual}`}`);
        });
      console.log('');
    }
    
    // Performance summary
    if (this.performanceMetrics.length > 0) {
      const avgTime = this.performanceMetrics.reduce((a, b) => a + b, 0) / this.performanceMetrics.length;
      console.log('⚡ PERFORMANCE SUMMARY:');
      console.log(`  Average calculation time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Meets target (<50ms): ${avgTime < 50 ? '✅' : '❌'}`);
      console.log('');
    }
    
    // Overall assessment
    console.log('🎯 OVERALL ASSESSMENT:');
    if (passRate >= 95) {
      console.log('  Status: EXCELLENT ✅ Ready for production');
    } else if (passRate >= 85) {
      console.log('  Status: GOOD ✅ Minor issues to address');
    } else if (passRate >= 70) {
      console.log('  Status: ACCEPTABLE ⚠️ Some issues need fixing');
    } else {
      console.log('  Status: NEEDS WORK ❌ Major issues detected');
    }
    
    console.log('=' .repeat(50));
  }
}

export { LPAnalysisTestSuite };

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Running LP Analysis Renaissance Math Test Suite...\n');
  
  const testSuite = new LPAnalysisTestSuite();
  testSuite.runFullTestSuite().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}