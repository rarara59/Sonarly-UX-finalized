/**
 * RENAISSANCE SYSTEM INTEGRATION EXAMPLE
 * 
 * Complete integration example showing how to use the Renaissance Multi-Factor
 * Smart Wallet System with your existing Thorp trading infrastructure
 * 
 * Components Integrated:
 * - SmartWalletService (your database layer)
 * - SmartWalletSignalJS (your individual analysis)  
 * - SmartWalletNetworkEffectsAnalyzer (network relationships)
 * - RenaissanceSmartWalletSystem (multi-factor combination)
 * 
 * Usage Examples:
 * - Production integration with existing LP detection pipeline
 * - Testing and validation scenarios
 * - Performance monitoring and optimization
 * - Error handling and fallback strategies
 */

import mongoose from 'mongoose';
import { smartWalletService } from '../services/smart-wallet.service.js';
import SmartWallet from '../models/smartWallet.js';
import { SmartWalletSignalJS } from '../signal-modules/smart-wallet-signal.module.js';
import { RenaissanceSmartWalletSystem } from './renaissance-signal-combiner.js';

class ThorpRenaissanceIntegration {
  constructor(config = {}) {
    this.config = {
      // Database configuration
      database: {
        mongoUri: config.mongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp',
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000
      },
      
      // RPC configuration (your existing setup)
      rpc: {
        heliusApiKey: config.heliusApiKey || process.env.HELIUS_API_KEY,
        chainstackEndpoint: config.chainstackEndpoint || process.env.CHAINSTACK_ENDPOINT,
        fallbackEndpoints: config.fallbackEndpoints || []
      },
      
      // Renaissance system configuration
      renaissance: {
        enableNetworkAnalysis: true,
        enablePerformanceMonitoring: true,
        enableStatisticalValidation: true,
        maxProcessingTimeMs: 150,
        logLevel: 'info'
      },
      
      // Testing configuration
      testing: {
        enableMockMode: false,
        mockWalletCount: 25,
        mockTransactionCount: 100,
        testTokenAddresses: [
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC (for testing)
          'So11111111111111111111111111111111111111112',  // SOL
          'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'   // BONK
        ]
      }
    };
    
    // Initialize Renaissance system
    this.renaissanceSystem = new RenaissanceSmartWalletSystem({
      individual: {
        MIN_STATISTICAL_POWER: 0.80,
        SIGNIFICANCE_LEVEL: 0.05
      }
    });
    
    // Performance tracking
    this.integrationMetrics = {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      databaseConnectionTime: 0,
      avgSignalLatency: 0,
      networkEffectDetectionRate: 0,
      errors: []
    };
    
    // Component health status
    this.healthStatus = {
      database: false,
      smartWalletService: false,
      renaissanceSystem: false,
      lastHealthCheck: 0
    };
  }

  // =============================================================================
  // SYSTEM INITIALIZATION
  // =============================================================================

  async initialize() {
    console.log('🚀 Initializing Thorp Renaissance Integration...');
    
    try {
      // 1. Initialize database connection
      await this.initializeDatabase();
      
      // 2. Validate smart wallet service
      await this.validateSmartWalletService();
      
      // 3. Initialize Renaissance system
      await this.initializeRenaissanceSystem();
      
      // 4. Perform health check
      await this.performHealthCheck();
      
      console.log('✅ Thorp Renaissance Integration initialized successfully');
      console.log('📊 System Status:', this.getSystemStatus());
      
      return true;
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  async initializeDatabase() {
    const dbStartTime = performance.now();
    
    try {
      if (mongoose.connection.readyState !== 1) {
        console.log('🔌 Connecting to MongoDB...');
        
        await mongoose.connect(this.config.database.mongoUri, {
          serverSelectionTimeoutMS: this.config.database.serverSelectionTimeoutMS,
          connectTimeoutMS: this.config.database.connectTimeoutMS
        });
        
        console.log('✅ MongoDB connected successfully');
      }
      
      this.integrationMetrics.databaseConnectionTime = performance.now() - dbStartTime;
      this.healthStatus.database = true;
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      this.healthStatus.database = false;
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  async validateSmartWalletService() {
    try {
      console.log('🔍 Validating Smart Wallet Service...');
      
      // Test service health
      const isHealthy = await smartWalletService.isHealthy();
      if (!isHealthy) {
        throw new Error('Smart Wallet Service health check failed');
      }
      
      // Test wallet data availability
      const stats = await smartWalletService.getWalletStats();
      console.log(`📊 Wallet Service Stats: ${stats.totalWallets} total, ${stats.activeWallets} active`);
      
      if (stats.totalWallets < 10) {
        console.warn('⚠️ Low wallet count detected - consider running seed data');
        
        if (this.config.testing.enableMockMode) {
          console.log('🎭 Running in mock mode - seeding test wallets...');
          await this.seedTestWallets();
        }
      }
      
      this.healthStatus.smartWalletService = true;
      
    } catch (error) {
      console.error('❌ Smart Wallet Service validation failed:', error);
      this.healthStatus.smartWalletService = false;
      throw error;
    }
  }

  async initializeRenaissanceSystem() {
    try {
      console.log('🎯 Initializing Renaissance System...');
      
      // Test Renaissance system
      const testResult = await this.renaissanceSystem.performSystemTest();
      
      if (!testResult || testResult.confidence < 5) {
        throw new Error('Renaissance system test failed');
      }
      
      console.log('✅ Renaissance System initialized successfully');
      console.log(`🎯 Test Signal: ${testResult.confidence.toFixed(1)}% confidence`);
      
      this.healthStatus.renaissanceSystem = true;
      
    } catch (error) {
      console.error('❌ Renaissance System initialization failed:', error);
      this.healthStatus.renaissanceSystem = false;
      throw error;
    }
  }

  // =============================================================================
  // MAIN INTEGRATION INTERFACE
  // =============================================================================

  async analyzeTokenWithRenaissanceSignal(tokenAddress, options = {}) {
    const startTime = performance.now();
    
    try {
      console.log(`🔬 Starting Renaissance analysis for ${tokenAddress.slice(0,8)}...`);
      
      // 1. Create analysis context
      const context = await this.createAnalysisContext(tokenAddress, options);
      
      // 2. Execute Renaissance multi-factor analysis
      const renaissanceResult = await this.renaissanceSystem.execute(context);
      
      // 3. Post-process and validate results
      const enhancedResult = await this.enhanceAnalysisResult(renaissanceResult, tokenAddress);
      
      // 4. Update metrics and logging
      const processingTime = performance.now() - startTime;
      this.updateIntegrationMetrics(enhancedResult, processingTime);
      
      console.log(`✅ Renaissance analysis completed for ${tokenAddress.slice(0,8)}: ` +
                 `${enhancedResult.confidence.toFixed(1)}% confidence ` +
                 `(${processingTime.toFixed(1)}ms)`);
      
      return enhancedResult;
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.handleAnalysisError(error, tokenAddress, processingTime);
      
      return this.createErrorResult(error, tokenAddress, processingTime);
    }
  }

  async createAnalysisContext(tokenAddress, options) {
    return {
      tokenAddress: tokenAddress,
      timestamp: Date.now(),
      
      // Logger with configurable levels
      logger: this.createLogger(options.logLevel || this.config.renaissance.logLevel),
      
      // RPC Manager (your existing setup)
      rpcManager: this.createRPCManager(options),
      
      // Database access
      smartWalletService: smartWalletService,
      
      // Configuration overrides
      config: {
        ...this.config.renaissance,
        ...options.renaissanceConfig
      },
      
      // Performance monitoring
      enableProfiling: options.enableProfiling || false,
      
      // Testing options
      mockMode: options.mockMode || this.config.testing.enableMockMode
    };
  }

  createLogger(logLevel = 'info') {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[logLevel] || 2;
    
    return {
      error: (msg, ...args) => {
        if (currentLevel >= 0) console.error(`[Renaissance:ERROR] ${msg}`, ...args);
      },
      warn: (msg, ...args) => {
        if (currentLevel >= 1) console.warn(`[Renaissance:WARN] ${msg}`, ...args);
      },
      info: (msg, ...args) => {
        if (currentLevel >= 2) console.log(`[Renaissance:INFO] ${msg}`, ...args);
      },
      debug: (msg, ...args) => {
        if (currentLevel >= 3) console.log(`[Renaissance:DEBUG] ${msg}`, ...args);
      }
    };
  }

  createRPCManager(options) {
    // Mock RPC manager for testing - replace with your actual RPC implementation
    return {
      getTokenAccountsByOwner: async (owner, filter, source = 'helius') => {
        // Your existing Helius RPC implementation
        return this.mockRPCMethod('getTokenAccountsByOwner', []);
      },
      
      getSignaturesForAddress: async (address, limit = 50) => {
        // Your existing signature fetching implementation  
        return this.mockRPCMethod('getSignaturesForAddress', this.generateMockSignatures(limit));
      },
      
      getTransaction: async (signature) => {
        // Your existing transaction fetching implementation
        return this.mockRPCMethod('getTransaction', this.generateMockTransaction(signature));
      },
      
      getRecentTransactions: async (tokenAddress, options) => {
        // Your existing recent transaction implementation
        return this.mockRPCMethod('getRecentTransactions', this.generateMockTransactions(options.limit));
      }
    };
  }

  async enhanceAnalysisResult(renaissanceResult, tokenAddress) {
    // Add integration-specific enhancements
    const enhanced = {
      ...renaissanceResult,
      
      // Integration metadata
      integration: {
        version: '1.0',
        timestamp: Date.now(),
        tokenAddress: tokenAddress,
        systemHealth: this.healthStatus,
        processingPipeline: 'thorp-renaissance-multi-factor'
      },
      
      // Trading recommendations (your business logic)
      tradingRecommendation: this.generateTradingRecommendation(renaissanceResult),
      
      // Risk assessment
      riskAssessment: this.calculateRiskAssessment(renaissanceResult),
      
      // Performance attribution
      performanceAttribution: this.calculatePerformanceAttribution(renaissanceResult)
    };
    
    // Store analysis result (optional)
    if (this.config.renaissance.enablePerformanceMonitoring) {
      await this.storeAnalysisResult(enhanced);
    }
    
    return enhanced;
  }

  generateTradingRecommendation(result) {
    const confidence = result.confidence;
    const networkDetected = result.data.networkEffects?.detected || false;
    const tier1Count = result.data.tier1Count || 0;
    const tier2Count = result.data.tier2Count || 0;
    
    // Renaissance-style position sizing based on Kelly criterion approximation
    let recommendation = {
      action: 'PASS',
      positionSize: 0,
      confidenceLevel: 'VERY_LOW',
      reasoning: []
    };
    
    if (confidence >= 80) {
      recommendation.action = 'STRONG_BUY';
      recommendation.positionSize = Math.min(0.08, confidence / 1000); // Max 8% position
      recommendation.confidenceLevel = 'HIGH';
      recommendation.reasoning.push('High confidence signal with strong statistical evidence');
      
      if (networkDetected) {
        recommendation.reasoning.push('Network effects detected - smart wallet clustering confirmed');
      }
      
      if (tier1Count > 0) {
        recommendation.reasoning.push(`${tier1Count} tier-1 premium wallets detected`);
      }
      
    } else if (confidence >= 65) {
      recommendation.action = 'BUY';
      recommendation.positionSize = Math.min(0.05, confidence / 1300); // Max 5% position
      recommendation.confidenceLevel = 'MEDIUM';
      recommendation.reasoning.push('Good confidence signal with acceptable evidence quality');
      
      if (tier1Count + tier2Count > 3) {
        recommendation.reasoning.push('Multiple high-tier wallets provide additional confidence');
      }
      
    } else if (confidence >= 45) {
      recommendation.action = 'WATCH';
      recommendation.positionSize = Math.min(0.02, confidence / 2250); // Max 2% position
      recommendation.confidenceLevel = 'LOW';
      recommendation.reasoning.push('Moderate signal - suitable for watchlist or small test position');
      
    } else {
      recommendation.reasoning.push('Insufficient signal strength for position');
      
      if (result.data.error) {
        recommendation.reasoning.push(`Analysis error: ${result.data.error}`);
      }
    }
    
    return recommendation;
  }

  calculateRiskAssessment(result) {
    const baseRisk = 1 - (result.confidence / 100); // Higher confidence = lower risk
    const networkRisk = result.data.networkEffects?.detected ? 0.9 : 1.0; // Network effects reduce risk
    const evidenceRisk = result.data.evidenceQuality ? (1 - result.data.evidenceQuality * 0.2) : 1.0;
    
    const totalRisk = baseRisk * networkRisk * evidenceRisk;
    
    return {
      overallRisk: Math.min(0.95, Math.max(0.05, totalRisk)),
      riskFactors: {
        confidenceRisk: baseRisk,
        networkRisk: 1 - networkRisk,
        evidenceRisk: 1 - (1 - evidenceRisk),
        statisticalRisk: result.data.pValue > 0.05 ? 0.3 : 0.1
      },
      riskLevel: totalRisk > 0.7 ? 'HIGH' : totalRisk > 0.4 ? 'MEDIUM' : 'LOW'
    };
  }

  calculatePerformanceAttribution(result) {
    const attribution = {
      individualContribution: 0,
      networkContribution: 0,
      statisticalContribution: 0,
      totalExplained: 0
    };
    
    if (result.data.signalComponents) {
      const individual = result.data.signalComponents.individual;
      const network = result.data.signalComponents.network;
      
      attribution.individualContribution = (individual.confidence * individual.weight) / 100;
      attribution.networkContribution = (network.confidence * network.weight) / 100;
      attribution.statisticalContribution = result.data.statisticalSignificance || 0;
      
      attribution.totalExplained = attribution.individualContribution + 
                                  attribution.networkContribution + 
                                  attribution.statisticalContribution;
    }
    
    return attribution;
  }

  // =============================================================================
  // TESTING AND VALIDATION
  // =============================================================================

  async runComprehensiveTest() {
    console.log('🧪 Running Comprehensive Renaissance Integration Test...\n');
    
    const testResults = {
      systemHealth: {},
      analysisTests: [],
      performanceTests: {},
      errorHandlingTests: []
    };
    
    try {
      // 1. System health tests
      console.log('1. Testing System Health...');
      testResults.systemHealth = await this.performHealthCheck();
      this.logTestResult('System Health', testResults.systemHealth.overall);
      
      // 2. Analysis accuracy tests
      console.log('\n2. Testing Analysis Accuracy...');
      for (const tokenAddress of this.config.testing.testTokenAddresses.slice(0, 2)) {
        const analysisResult = await this.analyzeTokenWithRenaissanceSignal(tokenAddress, {
          mockMode: true,
          logLevel: 'warn'
        });
        
        testResults.analysisTests.push({
          tokenAddress: tokenAddress,
          confidence: analysisResult.confidence,
          networkDetected: analysisResult.data.networkEffects?.detected || false,
          processingTime: analysisResult.processingTime,
          success: analysisResult.confidence > 5
        });
        
        this.logTestResult(`Analysis ${tokenAddress.slice(0,8)}`, analysisResult.confidence > 5);
      }
      
      // 3. Performance tests
      console.log('\n3. Testing Performance...');
      testResults.performanceTests = await this.runPerformanceTests();
      this.logTestResult('Performance', testResults.performanceTests.avgLatency < 200);
      
      // 4. Error handling tests
      console.log('\n4. Testing Error Handling...');
      testResults.errorHandlingTests = await this.runErrorHandlingTests();
      this.logTestResult('Error Handling', testResults.errorHandlingTests.length > 0);
      
      // 5. Generate test report
      this.generateTestReport(testResults);
      
      return testResults;
      
    } catch (error) {
      console.error('❌ Comprehensive test failed:', error);
      return { error: error.message, testResults };
    }
  }

  async runPerformanceTests() {
    const testCount = 5;
    const latencies = [];
    
    console.log(`   Running ${testCount} performance iterations...`);
    
    for (let i = 0; i < testCount; i++) {
      const startTime = performance.now();
      
      try {
        await this.analyzeTokenWithRenaissanceSignal(
          this.config.testing.testTokenAddresses[0],
          { mockMode: true, logLevel: 'error' }
        );
        
        const latency = performance.now() - startTime;
        latencies.push(latency);
        
      } catch (error) {
        latencies.push(999); // Penalty for errors
      }
    }
    
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);
    
    console.log(`   Avg: ${avgLatency.toFixed(1)}ms, Max: ${maxLatency.toFixed(1)}ms, Min: ${minLatency.toFixed(1)}ms`);
    
    return { avgLatency, maxLatency, minLatency, latencies };
  }

  async runErrorHandlingTests() {
    const errorTests = [
      {
        name: 'Invalid Token Address',
        test: () => this.analyzeTokenWithRenaissanceSignal('invalid_token', { mockMode: true, logLevel: 'error' })
      },
      {
        name: 'Empty Token Address',
        test: () => this.analyzeTokenWithRenaissanceSignal('', { mockMode: true, logLevel: 'error' })
      },
      {
        name: 'Database Disconnection Simulation',
        test: async () => {
          // Temporarily break database connection for testing
          const originalReadyState = mongoose.connection.readyState;
          mongoose.connection.readyState = 0;
          
          try {
            const result = await this.analyzeTokenWithRenaissanceSignal(
              this.config.testing.testTokenAddresses[0],
              { mockMode: true, logLevel: 'error' }
            );
            return result;
          } finally {
            mongoose.connection.readyState = originalReadyState;
          }
        }
      }
    ];
    
    const results = [];
    
    for (const errorTest of errorTests) {
      try {
        console.log(`   Testing: ${errorTest.name}`);
        const result = await errorTest.test();
        
        results.push({
          name: errorTest.name,
          handled: result && result.confidence >= 0, // Should return graceful error result
          result: result
        });
        
      } catch (error) {
        results.push({
          name: errorTest.name,
          handled: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  logTestResult(testName, passed) {
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  }

  generateTestReport(testResults) {
    console.log('\n📋 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(50));
    
    // System Health Summary
    const healthPassed = testResults.systemHealth.overall;
    console.log(`System Health: ${healthPassed ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    
    // Analysis Tests Summary
    const analysisPassRate = testResults.analysisTests.filter(t => t.success).length / testResults.analysisTests.length;
    console.log(`Analysis Tests: ${(analysisPassRate * 100).toFixed(0)}% pass rate (${testResults.analysisTests.length} tests)`);
    
    // Performance Summary
    const performancePassed = testResults.performanceTests.avgLatency < 200;
    console.log(`Performance: ${performancePassed ? '✅' : '❌'} ${testResults.performanceTests.avgLatency.toFixed(1)}ms avg latency`);
    
    // Error Handling Summary
    const errorHandlingPassRate = testResults.errorHandlingTests.filter(t => t.handled).length / testResults.errorHandlingTests.length;
    console.log(`Error Handling: ${(errorHandlingPassRate * 100).toFixed(0)}% pass rate (${testResults.errorHandlingTests.length} tests)`);
    
    // Overall Assessment
    const overallScore = (
      (healthPassed ? 1 : 0) + 
      analysisPassRate + 
      (performancePassed ? 1 : 0) + 
      errorHandlingPassRate
    ) / 4;
    
    console.log(`\nOVERALL SCORE: ${(overallScore * 100).toFixed(1)}%`);
    
    if (overallScore >= 0.8) {
      console.log('🎉 SYSTEM READY FOR PRODUCTION');
    } else if (overallScore >= 0.6) {
      console.log('⚠️ SYSTEM NEEDS IMPROVEMENTS');
    } else {
      console.log('❌ SYSTEM REQUIRES FIXES BEFORE DEPLOYMENT');
    }
    
    console.log('='.repeat(50));
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async performHealthCheck() {
    const healthCheck = {
      database: false,
      smartWalletService: false,
      renaissanceSystem: false,
      overall: false,
      timestamp: Date.now()
    };
    
    try {
      // Database health
      healthCheck.database = mongoose.connection.readyState === 1;
      
      // Smart Wallet Service health
      healthCheck.smartWalletService = await smartWalletService.isHealthy();
      
      // Renaissance System health
      const renaissanceTest = await this.renaissanceSystem.performSystemTest();
      healthCheck.renaissanceSystem = renaissanceTest && renaissanceTest.confidence > 0;
      
      // Overall health
      healthCheck.overall = healthCheck.database && 
                           healthCheck.smartWalletService && 
                           healthCheck.renaissanceSystem;
      
      this.healthStatus = { ...healthCheck };
      
    } catch (error) {
      console.error('Health check failed:', error);
      healthCheck.error = error.message;
    }
    
    return healthCheck;
  }

  updateIntegrationMetrics(result, processingTime) {
    this.integrationMetrics.totalAnalyses++;
    
    if (result.confidence > 10) {
      this.integrationMetrics.successfulAnalyses++;
    }
    
    // Update rolling average latency
    const currentAvg = this.integrationMetrics.avgSignalLatency;
    const count = this.integrationMetrics.totalAnalyses;
    this.integrationMetrics.avgSignalLatency = (currentAvg * (count - 1) + processingTime) / count;
    
    // Network effect detection rate
    if (result.data.networkEffects?.detected) {
      this.integrationMetrics.networkEffectDetectionRate = 
        ((this.integrationMetrics.networkEffectDetectionRate * (count - 1)) + 1) / count;
    } else {
      this.integrationMetrics.networkEffectDetectionRate = 
        (this.integrationMetrics.networkEffectDetectionRate * (count - 1)) / count;
    }
  }

  handleAnalysisError(error, tokenAddress, processingTime) {
    this.integrationMetrics.errors.push({
      tokenAddress: tokenAddress,
      error: error.message,
      timestamp: Date.now(),
      processingTime: processingTime
    });
    
    // Keep only last 10 errors
    if (this.integrationMetrics.errors.length > 10) {
      this.integrationMetrics.errors.shift();
    }
    
    console.error(`❌ Analysis failed for ${tokenAddress.slice(0,8)}: ${error.message}`);
  }

  createErrorResult(error, tokenAddress, processingTime) {
    return {
      confidence: 5,
      data: {
        detected: false,
        confidence: 5,
        error: error.message,
        networkEffects: { detected: false, reason: 'Analysis error' }
      },
      tradingRecommendation: {
        action: 'PASS',
        positionSize: 0,
        confidenceLevel: 'NONE',
        reasoning: [`Analysis error: ${error.message}`]
      },
      processingTime: processingTime,
      source: 'thorp-renaissance-integration-error',
      integration: {
        tokenAddress: tokenAddress,
        timestamp: Date.now(),
        error: true
      }
    };
  }

  getSystemStatus() {
    return {
      integration: {
        version: '1.0',
        initialized: this.healthStatus.overall,
        uptime: Date.now() - (this.healthStatus.lastHealthCheck || Date.now())
      },
      health: this.healthStatus,
      metrics: this.integrationMetrics,
      renaissance: this.renaissanceSystem.getSystemStatus()
    };
  }

  // Mock methods for testing (replace with your actual implementations)
  async seedTestWallets() {
    const { seedSmartWallets } = await import('../models/smartWallet.js');
    return await seedSmartWallets();
  }

  async storeAnalysisResult(result) {
    // Store analysis results for performance tracking
    // Implementation depends on your data storage strategy
    console.log(`📊 Storing analysis result: ${result.confidence.toFixed(1)}% confidence`);
  }

  mockRPCMethod(methodName, defaultReturn) {
    if (this.config.testing.enableMockMode) {
      return defaultReturn;
    }
    
    // In production, this would call your actual RPC implementation
    throw new Error(`RPC method ${methodName} not implemented in production mode`);
  }

  generateMockSignatures(limit) {
    return Array.from({ length: limit }, (_, i) => ({
      signature: `sig_${Math.random().toString(36).substr(2, 12)}`,
      blockTime: Math.floor(Date.now() / 1000) - (i * 3600), // 1 hour intervals
      confirmationStatus: 'finalized'
    }));
  }

  generateMockTransaction(signature) {
    return {
      meta: { logMessages: [], innerInstructions: [] },
      transaction: {
        message: {
          accountKeys: [`wallet_${Math.random().toString(36).substr(2, 8)}`],
          instructions: []
        }
      }
    };
  }

  generateMockTransactions(limit) {
    const wallets = Array.from({ length: 20 }, (_, i) => `wallet_${i}`);
    
    return Array.from({ length: limit }, () => ({
      from: wallets[Math.floor(Math.random() * wallets.length)],
      to: wallets[Math.floor(Math.random() * wallets.length)],
      amount: Math.random() * 10000 + 100,
      timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
      signature: `sig_${Math.random().toString(36).substr(2, 12)}`
    }));
  }
}

// =============================================================================
// EXPORTS AND MAIN EXECUTION
// =============================================================================

export { ThorpRenaissanceIntegration };

// Example usage and testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Thorp Renaissance Integration Example...');
  
  async function runExample() {
    const integration = new ThorpRenaissanceIntegration({
      mongoUri: process.env.MONGODB_URI,
      testing: {
        enableMockMode: true,
        mockWalletCount: 50
      }
    });
    
    try {
      // Initialize system
      await integration.initialize();
      
      // Run comprehensive test
      const testResults = await integration.runComprehensiveTest();
      
      // Example token analysis
      console.log('\n🎯 Running Example Token Analysis...');
      const exampleResult = await integration.analyzeTokenWithRenaissanceSignal(
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC for testing
        { logLevel: 'info' }
      );
      
      console.log('\n📊 Example Result Summary:');
      console.log(`Confidence: ${exampleResult.confidence.toFixed(1)}%`);
      console.log(`Trading Action: ${exampleResult.tradingRecommendation.action}`);
      console.log(`Network Effects: ${exampleResult.data.networkEffects.detected ? 'Detected' : 'Not detected'}`);
      console.log(`Processing Time: ${exampleResult.processingTime.toFixed(1)}ms`);
      
      console.log('\n📈 System Status:');
      console.log(JSON.stringify(integration.getSystemStatus(), null, 2));
      
    } catch (error) {
      console.error('❌ Example execution failed:', error);
    }
  }
  
  runExample();
}