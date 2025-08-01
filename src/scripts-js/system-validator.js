/**
 * SMART WALLET SYSTEM TEST & VALIDATION
 * 
 * Comprehensive testing suite for the enhanced Thorp system
 * - Component validation
 * - Performance benchmarking  
 * - Signal accuracy testing
 * - Integration verification
 */

const { SmartWalletNetworkAnalyzer } = require('./smart-wallet-signal.js');
const { EnhancedThorpRealtimeSystem } = require('./system-integration.js');

class ThorpSystemValidator {
  constructor() {
    this.testResults = {
      componentTests: {},
      performanceTests: {},
      integrationTests: {},
      signalAccuracyTests: {}
    };
    
    this.performanceBenchmarks = {
      maxLatency: 100,           // 100ms max processing time
      minAccuracy: 0.65,         // 65% minimum signal accuracy
      maxMemoryUsage: 50,        // 50MB max memory usage
      minThroughput: 10          // 10 signals per second
    };
  }

  async runFullValidation() {
    console.log('=== THORP SYSTEM VALIDATION SUITE ===');
    console.log('Starting comprehensive system validation...\n');
    
    try {
      // 1. Component-level tests
      await this.runComponentTests();
      
      // 2. Performance benchmarks
      await this.runPerformanceTests();
      
      // 3. Integration validation
      await this.runIntegrationTests();
      
      // 4. Signal accuracy validation
      await this.runSignalAccuracyTests();
      
      // 5. Generate final report
      this.generateValidationReport();
      
    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // COMPONENT TESTS
  // =============================================================================

  async runComponentTests() {
    console.log('1. COMPONENT TESTS');
    console.log('==================');
    
    // Test Smart Wallet Analyzer
    const smartWalletResults = await this.testSmartWalletAnalyzer();
    this.testResults.componentTests.smartWallet = smartWalletResults;
    
    // Test System Integration
    const integrationResults = await this.testSystemIntegration();
    this.testResults.componentTests.integration = integrationResults;
    
    console.log('Component tests completed.\n');
  }

  async testSmartWalletAnalyzer() {
    console.log('Testing Smart Wallet Network Analyzer...');
    
    const analyzer = new SmartWalletNetworkAnalyzer();
    const testTransactions = this.generateTestTransactions(100);
    
    const startTime = performance.now();
    const result = await analyzer.analyzeSmartWalletSignal('test_token', testTransactions);
    const processingTime = performance.now() - startTime;
    
    const testsPassed = {
      hasResult: result !== null,
      hasSignal: result.signal && typeof result.signal.score === 'number',
      hasConfidence: result.signal && typeof result.signal.confidence === 'number',
      hasNetworkMetrics: result.networkMetrics && typeof result.networkMetrics.nodeCount === 'number',
      processingTimeOK: processingTime < this.performanceBenchmarks.maxLatency,
      validScore: result.signal && result.signal.score >= 0 && result.signal.score <= 1,
      validConfidence: result.signal && result.signal.confidence >= 0 && result.signal.confidence <= 1
    };
    
    const passCount = Object.values(testsPassed).filter(passed => passed).length;
    const totalTests = Object.keys(testsPassed).length;
    
    console.log(`  ✓ Smart Wallet Analyzer: ${passCount}/${totalTests} tests passed`);
    console.log(`  ✓ Processing time: ${processingTime.toFixed(2)}ms`);
    console.log(`  ✓ Signal score: ${result.signal.score.toFixed(3)}`);
    console.log(`  ✓ Confidence: ${result.signal.confidence.toFixed(3)}`);
    
    return {
      passed: passCount === totalTests,
      score: passCount / totalTests,
      processingTime: processingTime,
      details: testsPassed,
      result: result
    };
  }

  async testSystemIntegration() {
    console.log('Testing Enhanced Thorp System Integration...');
    
    const system = new EnhancedThorpRealtimeSystem();
    await system.initialize();
    
    const testResult = await system.runSystemTest();
    
    const testsPassed = {
      hasRecommendation: testResult.recommendation && testResult.recommendation.action,
      hasSignalBreakdown: testResult.signalBreakdown && 
                         testResult.signalBreakdown.statistical &&
                         testResult.signalBreakdown.bayesian &&
                         testResult.signalBreakdown.smartWallet,
      hasSmartWalletMetrics: testResult.smartWalletMetrics &&
                            typeof testResult.smartWalletMetrics.score === 'number',
      validTimestamp: testResult.timestamp && testResult.timestamp > 0,
      hasThresholdCheck: testResult.passedThresholds &&
                        typeof testResult.passedThresholds.confidence === 'boolean'
    };
    
    const passCount = Object.values(testsPassed).filter(passed => passed).length;
    const totalTests = Object.keys(testsPassed).length;
    
    console.log(`  ✓ System Integration: ${passCount}/${totalTests} tests passed`);
    console.log(`  ✓ Final signal score: ${testResult.score.toFixed(3)}`);
    console.log(`  ✓ Recommendation: ${testResult.recommendation.action}`);
    
    return {
      passed: passCount === totalTests,
      score: passCount / totalTests,
      details: testsPassed,
      result: testResult
    };
  }

  // =============================================================================
  // PERFORMANCE TESTS
  // =============================================================================

  async runPerformanceTests() {
    console.log('2. PERFORMANCE TESTS');
    console.log('====================');
    
    // Latency test
    const latencyResults = await this.testLatencyBenchmark();
    this.testResults.performanceTests.latency = latencyResults;
    
    // Throughput test
    const throughputResults = await this.testThroughputBenchmark();
    this.testResults.performanceTests.throughput = throughputResults;
    
    // Memory usage test
    const memoryResults = await this.testMemoryUsage();
    this.testResults.performanceTests.memory = memoryResults;
    
    console.log('Performance tests completed.\n');
  }

  async testLatencyBenchmark() {
    console.log('Testing processing latency...');
    
    const system = new EnhancedThorpRealtimeSystem();
    await system.initialize();
    
    const testCases = 10;
    const latencies = [];
    
    for (let i = 0; i < testCases; i++) {
      const mockEvent = this.generateMockLPEvent(`test_token_${i}`);
      
      const startTime = performance.now();
      await system.processLPCreationEvent(mockEvent);
      const latency = performance.now() - startTime;
      
      latencies.push(latency);
    }
    
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);
    
    const passed = avgLatency < this.performanceBenchmarks.maxLatency;
    
    console.log(`  ✓ Average latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`  ✓ Max latency: ${maxLatency.toFixed(2)}ms`);
    console.log(`  ✓ Min latency: ${minLatency.toFixed(2)}ms`);
    console.log(`  ✓ Benchmark passed: ${passed}`);
    
    return {
      passed: passed,
      avgLatency: avgLatency,
      maxLatency: maxLatency,
      minLatency: minLatency,
      benchmark: this.performanceBenchmarks.maxLatency
    };
  }

  async testThroughputBenchmark() {
    console.log('Testing system throughput...');
    
    const system = new EnhancedThorpRealtimeSystem();
    await system.initialize();
    
    const testDuration = 5000; // 5 seconds
    const startTime = Date.now();
    let processedSignals = 0;
    
    while (Date.now() - startTime < testDuration) {
      const mockEvent = this.generateMockLPEvent(`throughput_test_${processedSignals}`);
      await system.processLPCreationEvent(mockEvent);
      processedSignals++;
    }
    
    const actualDuration = (Date.now() - startTime) / 1000; // seconds
    const throughput = processedSignals / actualDuration;
    
    const passed = throughput >= this.performanceBenchmarks.minThroughput;
    
    console.log(`  ✓ Signals processed: ${processedSignals}`);
    console.log(`  ✓ Test duration: ${actualDuration.toFixed(2)}s`);
    console.log(`  ✓ Throughput: ${throughput.toFixed(2)} signals/sec`);
    console.log(`  ✓ Benchmark passed: ${passed}`);
    
    return {
      passed: passed,
      throughput: throughput,
      processedSignals: processedSignals,
      duration: actualDuration,
      benchmark: this.performanceBenchmarks.minThroughput
    };
  }

  async testMemoryUsage() {
    console.log('Testing memory usage...');
    
    const system = new EnhancedThorpRealtimeSystem();
    await system.initialize();
    
    // Process multiple tokens to build up memory usage
    for (let i = 0; i < 50; i++) {
      const mockEvent = this.generateMockLPEvent(`memory_test_${i}`);
      await system.processLPCreationEvent(mockEvent);
    }
    
    const status = system.getSystemStatus();
    const memoryUsageKB = status.bufferStats.bufferMemoryUsage;
    const memoryUsageMB = memoryUsageKB / 1024;
    
    const passed = memoryUsageMB < this.performanceBenchmarks.maxMemoryUsage;
    
    console.log(`  ✓ Buffer memory usage: ${memoryUsageMB.toFixed(2)}MB`);
    console.log(`  ✓ Tokens cached: ${status.bufferStats.tokensCached}`);
    console.log(`  ✓ Benchmark passed: ${passed}`);
    
    return {
      passed: passed,
      memoryUsageMB: memoryUsageMB,
      tokensCached: status.bufferStats.tokensCached,
      benchmark: this.performanceBenchmarks.maxMemoryUsage
    };
  }

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  async runIntegrationTests() {
    console.log('3. INTEGRATION TESTS');
    console.log('====================');
    
    // Test signal combination logic
    const signalCombinationResults = await this.testSignalCombination();
    this.testResults.integrationTests.signalCombination = signalCombinationResults;
    
    // Test threshold validation
    const thresholdResults = await this.testThresholdValidation();
    this.testResults.integrationTests.thresholds = thresholdResults;
    
    console.log('Integration tests completed.\n');
  }

  async testSignalCombination() {
    console.log('Testing signal combination logic...');
    
    const system = new EnhancedThorpRealtimeSystem();
    await system.initialize();
    
    // Test different signal combinations
    const testCases = [
      { name: 'High Statistical, Low Bayesian, High Smart', 
        statistical: 0.9, bayesian: 0.3, smart: 0.8 },
      { name: 'Low Statistical, High Bayesian, Medium Smart', 
        statistical: 0.2, bayesian: 0.9, smart: 0.5 },
      { name: 'Medium All Signals', 
        statistical: 0.6, bayesian: 0.6, smart: 0.6 },
      { name: 'Low All Signals', 
        statistical: 0.2, bayesian: 0.2, smart: 0.2 }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      // Mock the individual signals
      const statisticalSignal = { score: testCase.statistical, pValue: 0.01, isSignificant: true };
      const bayesianSignal = { highQuality: testCase.bayesian, mediumQuality: 0.3, lowQuality: 0.2 };
      const smartWalletSignal = { 
        signal: { score: testCase.smart, confidence: 0.8 },
        significance: { isSignificant: true }
      };
      
      const combined = system.combineSignalsRenaissanceStyle(
        statisticalSignal, 
        bayesianSignal, 
        smartWalletSignal, 
        'test_token'
      );
      
      results.push({
        testCase: testCase.name,
        inputs: testCase,
        output: combined.riskAdjustedScore,
        confidence: combined.confidence,
        agreement: combined.signalAgreement
      });
      
      console.log(`  ✓ ${testCase.name}: score=${combined.riskAdjustedScore.toFixed(3)}, confidence=${combined.confidence.toFixed(3)}`);
    }
    
    return {
      passed: results.length === testCases.length,
      results: results
    };
  }

  async testThresholdValidation() {
    console.log('Testing threshold validation...');
    
    const system = new EnhancedThorpRealtimeSystem();
    await system.initialize();
    
    // Test various confidence levels
    const confidenceLevels = [0.9, 0.7, 0.6, 0.5, 0.3, 0.1];
    const results = [];
    
    for (const confidence of confidenceLevels) {
      const mockCombinedSignal = {
        riskAdjustedScore: 0.7,
        confidence: confidence,
        signalBreakdown: {
          statistical: { confidence: 0.8 },
          bayesian: { confidence: 0.6 },
          smartWallet: { confidence: confidence }
        },
        smartWalletMetrics: { significantWallets: 5 }
      };
      
      const validated = system.validateAndScore(mockCombinedSignal, 'test_token');
      
      results.push({
        inputConfidence: confidence,
        outputScore: validated.score,
        outputConfidence: validated.confidence,
        passedConfidenceThreshold: validated.passedThresholds.confidence,
        recommendation: validated.recommendation.action
      });
      
      console.log(`  ✓ Confidence ${confidence}: action=${validated.recommendation.action}, passed=${validated.passedThresholds.confidence}`);
    }
    
    return {
      passed: true,
      results: results
    };
  }

  // =============================================================================
  // SIGNAL ACCURACY TESTS
  // =============================================================================

  async runSignalAccuracyTests() {
    console.log('4. SIGNAL ACCURACY TESTS');
    console.log('========================');
    
    // Test against known good/bad scenarios
    const accuracyResults = await this.testSignalAccuracy();
    this.testResults.signalAccuracyTests.accuracy = accuracyResults;
    
    console.log('Signal accuracy tests completed.\n');
  }

  async testSignalAccuracy() {
    console.log('Testing signal accuracy against known scenarios...');
    
    const system = new EnhancedThorpRealtimeSystem();
    await system.initialize();
    
    // Define test scenarios with expected outcomes
    const scenarios = [
      {
        name: 'High Quality Token',
        lpData: { volume: 100000, liquidity: 500000, holders: 500 },
        expectedAction: ['STRONG_BUY', 'BUY'],
        expectedMinScore: 0.6
      },
      {
        name: 'Medium Quality Token',
        lpData: { volume: 50000, liquidity: 100000, holders: 150 },
        expectedAction: ['BUY', 'WATCH'],
        expectedMinScore: 0.4
      },
      {
        name: 'Low Quality Token',
        lpData: { volume: 5000, liquidity: 20000, holders: 30 },
        expectedAction: ['WATCH', 'PASS'],
        expectedMinScore: 0.0
      },
      {
        name: 'Very Low Quality Token',
        lpData: { volume: 1000, liquidity: 5000, holders: 5 },
        expectedAction: ['PASS'],
        expectedMinScore: 0.0
      }
    ];
    
    let correctPredictions = 0;
    const results = [];
    
    for (const scenario of scenarios) {
      const mockEvent = {
        tokenAddress: `scenario_${scenario.name.replace(/\s+/g, '_').toLowerCase()}`,
        lpData: scenario.lpData,
        timestamp: Date.now()
      };
      
      const result = await system.processLPCreationEvent(mockEvent);
      
      const actionCorrect = scenario.expectedAction.includes(result.recommendation.action);
      const scoreCorrect = result.score >= scenario.expectedMinScore;
      const predictionCorrect = actionCorrect && scoreCorrect;
      
      if (predictionCorrect) correctPredictions++;
      
      results.push({
        scenario: scenario.name,
        expectedAction: scenario.expectedAction,
        actualAction: result.recommendation.action,
        expectedMinScore: scenario.expectedMinScore,
        actualScore: result.score,
        correct: predictionCorrect
      });
      
      console.log(`  ✓ ${scenario.name}: ${result.recommendation.action} (score: ${result.score.toFixed(3)}) - ${predictionCorrect ? 'CORRECT' : 'INCORRECT'}`);
    }
    
    const accuracy = correctPredictions / scenarios.length;
    const passed = accuracy >= this.performanceBenchmarks.minAccuracy;
    
    console.log(`  ✓ Overall accuracy: ${(accuracy * 100).toFixed(1)}% (${correctPredictions}/${scenarios.length})`);
    console.log(`  ✓ Benchmark passed: ${passed}`);
    
    return {
      passed: passed,
      accuracy: accuracy,
      correctPredictions: correctPredictions,
      totalScenarios: scenarios.length,
      results: results,
      benchmark: this.performanceBenchmarks.minAccuracy
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  generateTestTransactions(count) {
    const transactions = [];
    const wallets = [];
    
    // Generate a network of wallets
    for (let i = 0; i < 20; i++) {
      wallets.push(`wallet_${i}`);
    }
    
    for (let i = 0; i < count; i++) {
      const from = wallets[Math.floor(Math.random() * wallets.length)];
      let to = wallets[Math.floor(Math.random() * wallets.length)];
      
      // Ensure from !== to
      while (to === from) {
        to = wallets[Math.floor(Math.random() * wallets.length)];
      }
      
      transactions.push({
        from: from,
        to: to,
        amount: Math.random() * 10000 + 100,
        timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000, // Last 24 hours
        signature: `sig_${Math.random().toString(36).substr(2, 9)}`
      });
    }
    
    return transactions;
  }

  generateMockLPEvent(tokenAddress) {
    return {
      tokenAddress: tokenAddress,
      lpData: {
        volume: Math.random() * 100000 + 10000,
        liquidity: Math.random() * 500000 + 50000,
        priceImpact: Math.random() * 0.05,
        holders: Math.floor(Math.random() * 300) + 50
      },
      timestamp: Date.now()
    };
  }

  generateValidationReport() {
    console.log('=== VALIDATION REPORT ===');
    
    const componentScore = this.calculateAverageScore(this.testResults.componentTests);
    const performanceScore = this.calculatePerformanceScore();
    const integrationScore = this.calculateAverageScore(this.testResults.integrationTests);
    const accuracyScore = this.testResults.signalAccuracyTests.accuracy?.accuracy || 0;
    
    const overallScore = (componentScore + performanceScore + integrationScore + accuracyScore) / 4;
    
    console.log(`Component Tests: ${(componentScore * 100).toFixed(1)}%`);
    console.log(`Performance Tests: ${(performanceScore * 100).toFixed(1)}%`);
    console.log(`Integration Tests: ${(integrationScore * 100).toFixed(1)}%`);
    console.log(`Signal Accuracy: ${(accuracyScore * 100).toFixed(1)}%`);
    console.log(`-------------------------`);
    console.log(`OVERALL SCORE: ${(overallScore * 100).toFixed(1)}%`);
    
    if (overallScore >= 0.8) {
      console.log('🎉 SYSTEM READY FOR PRODUCTION DEPLOYMENT');
    } else if (overallScore >= 0.6) {
      console.log('⚠️ SYSTEM NEEDS MINOR IMPROVEMENTS');
    } else {
      console.log('❌ SYSTEM REQUIRES MAJOR FIXES BEFORE DEPLOYMENT');
    }
    
    console.log('========================\n');
    
    return {
      overallScore: overallScore,
      componentScore: componentScore,
      performanceScore: performanceScore,
      integrationScore: integrationScore,
      accuracyScore: accuracyScore,
      readyForProduction: overallScore >= 0.8
    };
  }

  calculateAverageScore(testCategory) {
    const scores = Object.values(testCategory).map(test => test.score || (test.passed ? 1 : 0));
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  calculatePerformanceScore() {
    const performance = this.testResults.performanceTests;
    let score = 0;
    let count = 0;
    
    if (performance.latency) {
      score += performance.latency.passed ? 1 : 0;
      count++;
    }
    
    if (performance.throughput) {
      score += performance.throughput.passed ? 1 : 0;
      count++;
    }
    
    if (performance.memory) {
      score += performance.memory.passed ? 1 : 0;
      count++;
    }
    
    return count > 0 ? score / count : 0;
  }
}

// Main execution function
async function runValidation() {
  const validator = new ThorpSystemValidator();
  
  try {
    const report = await validator.runFullValidation();
    return report;
  } catch (error) {
    console.error('Validation failed:', error);
    return null;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThorpSystemValidator, runValidation };
} else if (typeof window !== 'undefined') {
  window.ThorpSystemValidator = ThorpSystemValidator;
  window.runValidation = runValidation;
}

// Auto-run if called directly
if (require.main === module) {
  runValidation().then(report => {
    if (report && report.readyForProduction) {
      process.exit(0); // Success
    } else {
      process.exit(1); // Failure
    }
  });
}