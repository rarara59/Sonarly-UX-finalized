// COMPLETE RENAISSANCE SIGNAL PIPELINE VALIDATION TEST
// Tests end-to-end: LP Detection → Smart Wallet Analysis → Signal Generation

import { RealSmartWalletSignalJS } from '../signal-modules/real-smart-wallet-signal.js';

// Mock RPC Manager for testing (replace with your actual rpc-connection-manager-fixed.js)
class MockRPCManager {
  constructor() {
    this.name = 'MockRPCManager';
    this.callCount = 0;
  }

  async call(method, params) {
    this.callCount++;
    console.log(`[MockRPC] Call ${this.callCount}: ${method} with params:`, params?.slice(0, 2));
    
    // Simulate realistic RPC responses based on method
    switch (method) {
      case 'getTokenAccountsByOwner':
        return this.mockTokenAccountsResponse(params[0], params[1]);
      
      case 'getSignaturesForAddress':
        return this.mockSignaturesResponse(params[0]);
      
      case 'getTransaction':
        return this.mockTransactionResponse(params[0]);
      
      default:
        return { result: null };
    }
  }

  mockTokenAccountsResponse(walletAddress, filter) {
    // Simulate 30% of wallets having the token (realistic for meme coins)
    const hasToken = Math.random() < 0.3;
    
    if (!hasToken) {
      return { result: { value: [] } };
    }

    // Simulate token holding
    return {
      result: {
        value: [{
          account: {
            data: {
              parsed: {
                info: {
                  mint: filter.mint,
                  tokenAmount: {
                    uiAmount: Math.random() * 10000, // Random balance
                    amount: Math.floor(Math.random() * 10000000).toString()
                  }
                }
              }
            }
          }
        }]
      }
    };
  }

  mockSignaturesResponse(walletAddress) {
    // Simulate recent transaction activity
    const numTxs = Math.floor(Math.random() * 10) + 5; // 5-15 recent transactions
    const signatures = [];
    
    for (let i = 0; i < numTxs; i++) {
      signatures.push({
        signature: `mock_signature_${i}_${walletAddress.slice(-8)}`,
        blockTime: Math.floor(Date.now() / 1000) - (i * 3600) // Hours ago
      });
    }
    
    return { result: signatures };
  }

  mockTransactionResponse(signature) {
    // Simulate DEX transaction with token activity
    const isTokenTx = Math.random() < 0.4; // 40% involve the target token
    
    if (!isTokenTx) {
      return {
        result: {
          meta: { logMessages: ['Some other transaction'] },
          transaction: { message: { accountKeys: [], instructions: [] } }
        }
      };
    }

    // Mock a DEX swap transaction
    return {
      result: {
        meta: {
          logMessages: [
            'Program log: Instruction: Swap',
            'Program log: Transfer 1000 tokens',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success'
          ],
          innerInstructions: []
        },
        transaction: {
          message: {
            accountKeys: [
              'mock_wallet_address',
              'mock_token_address', 
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            ],
            instructions: [{
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              accounts: [0, 1, 2]
            }]
          }
        }
      }
    };
  }
}

// Test Logger
class TestLogger {
  info(message) {
    console.log(`[INFO] ${message}`);
  }
  
  warn(message) {
    console.log(`[WARN] ${message}`);
  }
  
  error(message) {
    console.log(`[ERROR] ${message}`);
  }
  
  debug(message) {
    console.log(`[DEBUG] ${message}`);
  }
}

// SIGNAL PIPELINE TEST SUITE
class SignalPipelineTest {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    
    this.mockRpcManager = new MockRPCManager();
    this.testLogger = new TestLogger();
    this.smartWalletSignal = new RealSmartWalletSignalJS();
  }

  // REAL TOKEN ADDRESSES FOR TESTING
  getTestTokens() {
    return [
      {
        name: "BONK",
        address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        description: "Established meme coin with liquidity"
      },
      {
        name: "WIF", 
        address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
        description: "Popular dog-themed meme coin"
      },
      {
        name: "PEPE",
        address: "BzTHjEvFHYP6JnmWqfGJxFWqYzfb6bvkC5YRqPUNRz6P",
        description: "Pepe-themed token on Solana"
      }
    ];
  }

  async runTest(testName, testFunction) {
    this.testResults.totalTests++;
    
    try {
      console.log(`\n🧪 Running Test: ${testName}`);
      console.log('=' .repeat(50));
      
      const startTime = performance.now();
      const result = await testFunction();
      const duration = performance.now() - startTime;
      
      if (result.success) {
        this.testResults.passed++;
        console.log(`✅ PASSED (${duration.toFixed(0)}ms): ${testName}`);
      } else {
        this.testResults.failed++;
        console.log(`❌ FAILED: ${testName} - ${result.error}`);
        this.testResults.errors.push({ test: testName, error: result.error });
      }
      
      return result;
      
    } catch (error) {
      this.testResults.failed++;
      console.log(`💥 ERROR: ${testName} - ${error.message}`);
      this.testResults.errors.push({ test: testName, error: error.message });
      return { success: false, error: error.message };
    }
  }

  // TEST 1: Wallet Loading and Validation
  async testWalletLoading() {
    return this.runTest("Wallet Portfolio Loading", async () => {
      const context = {
        tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        rpcManager: this.mockRpcManager,
        logger: this.testLogger
      };

      const wallets = await this.smartWalletSignal.loadRealSmartWallets(context);
      
      // Validation checks
      if (wallets.length === 0) {
        return { success: false, error: "No wallets loaded" };
      }

      const tier1Count = wallets.filter(w => w.tier === 1).length;
      const tier2Count = wallets.filter(w => w.tier === 2).length;
      
      if (tier1Count === 0) {
        return { success: false, error: "No Tier 1 wallets found" };
      }

      // Check realistic win rates
      const perfectWinRates = wallets.filter(w => w.winRate >= 99).length;
      if (perfectWinRates > wallets.length * 0.1) {
        return { success: false, error: `Too many perfect win rates: ${perfectWinRates}/${wallets.length}` };
      }

      // Check Sharpe ratios
      const tier1WithSharpe = wallets.filter(w => w.tier === 1 && w.sharpeRatio >= 2.5).length;
      if (tier1WithSharpe < tier1Count * 0.8) {
        return { success: false, error: "Tier 1 wallets don't meet Sharpe requirements" };
      }

      console.log(`   📊 Portfolio: ${wallets.length} wallets (T1:${tier1Count}, T2:${tier2Count})`);
      console.log(`   📈 Win Rate Range: ${Math.min(...wallets.map(w => w.winRate)).toFixed(1)}% - ${Math.max(...wallets.map(w => w.winRate)).toFixed(1)}%`);
      console.log(`   🎯 Avg Sharpe Ratio: ${(wallets.reduce((sum, w) => sum + (w.sharpeRatio || 0), 0) / wallets.length).toFixed(2)}`);

      return { success: true, data: { walletCount: wallets.length, tier1Count, tier2Count } };
    });
  }

  // TEST 2: RPC Integration and Wallet Activity Detection
  async testWalletActivityDetection() {
    return this.runTest("Wallet Activity Detection", async () => {
      const context = {
        tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        rpcManager: this.mockRpcManager,
        logger: this.testLogger
      };

      const wallets = await this.smartWalletSignal.loadRealSmartWallets(context);
      const testWallet = wallets[0]; // Test with first wallet

      const activity = await this.smartWalletSignal.checkRealWalletTokenActivity(
        testWallet.address,
        context.tokenAddress,
        context.rpcManager,
        context.logger
      );

      if (!activity) {
        return { success: false, error: "No activity result returned" };
      }

      if (!['HOLDER', 'TRADER', 'RECENT', 'NONE'].includes(activity.activityType)) {
        return { success: false, error: `Invalid activity type: ${activity.activityType}` };
      }

      console.log(`   🔍 Activity: ${activity.activityType}, Confidence: ${activity.confidence}`);
      console.log(`   📞 RPC Calls Made: ${this.mockRpcManager.callCount}`);

      return { success: true, data: activity };
    });
  }

  // TEST 3: Signal Generation and Confidence Calculation
  async testSignalGeneration() {
    return this.runTest("Complete Signal Generation", async () => {
      const context = {
        tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        rpcManager: this.mockRpcManager,
        logger: this.testLogger
      };

      const signalResult = await this.smartWalletSignal.execute(context);

      // Validate signal structure
      if (!signalResult.confidence) {
        return { success: false, error: "No confidence score returned" };
      }

      if (signalResult.confidence < 5 || signalResult.confidence > 90) {
        return { success: false, error: `Confidence out of range: ${signalResult.confidence}%` };
      }

      if (!signalResult.data) {
        return { success: false, error: "No signal data returned" };
      }

      // Check Renaissance mathematical framework
      const data = signalResult.data;
      if (!data.pValue || !data.effectSize || !data.posteriorMean) {
        return { success: false, error: "Missing Renaissance statistical metrics" };
      }

      if (data.mathematicalFramework !== 'renaissance-real-implementation') {
        return { success: false, error: `Wrong framework: ${data.mathematicalFramework}` };
      }

      console.log(`   🎯 Signal Confidence: ${signalResult.confidence.toFixed(1)}%`);
      console.log(`   📊 Active Wallets: ${data.overlapCount}/${data.tier1Count + data.tier2Count + data.tier3Count}`);
      console.log(`   📈 Statistical Significance: p=${data.pValue.toFixed(4)}, Effect=${data.effectSize.toFixed(3)}`);
      console.log(`   ⚡ Processing Time: ${signalResult.processingTime.toFixed(0)}ms`);
      console.log(`   🔄 Real Data Flag: ${data.realData}`);

      return { success: true, data: signalResult };
    });
  }

  // TEST 4: Multiple Token Testing
  async testMultipleTokens() {
    return this.runTest("Multiple Token Analysis", async () => {
      const testTokens = this.getTestTokens();
      const results = [];

      for (const token of testTokens) {
        console.log(`   🪙 Testing ${token.name} (${token.address})`);
        
        const context = {
          tokenAddress: token.address,
          rpcManager: this.mockRpcManager,
          logger: this.testLogger
        };

        const result = await this.smartWalletSignal.execute(context);
        results.push({
          token: token.name,
          confidence: result.confidence,
          activeWallets: result.data.overlapCount,
          detected: result.data.detected
        });

        console.log(`      📊 ${token.name}: ${result.confidence.toFixed(1)}% confidence, ${result.data.overlapCount} active wallets`);
      }

      // Validate results variation (shouldn't all be identical)
      const confidences = results.map(r => r.confidence);
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      const variance = confidences.reduce((acc, conf) => acc + Math.pow(conf - avgConfidence, 2), 0) / confidences.length;

      if (variance < 10) {
        return { success: false, error: "Results too similar - possible mock data issue" };
      }

      return { success: true, data: results };
    });
  }

  // TEST 5: Performance and Timing Validation
  async testPerformance() {
    return this.runTest("Performance Benchmarking", async () => {
      const iterations = 5;
      const timings = [];

      for (let i = 0; i < iterations; i++) {
        const context = {
          tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          rpcManager: this.mockRpcManager,
          logger: this.testLogger
        };

        const startTime = performance.now();
        await this.smartWalletSignal.execute(context);
        const duration = performance.now() - startTime;
        
        timings.push(duration);
      }

      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTiming = Math.max(...timings);

      console.log(`   ⏱️  Average: ${avgTiming.toFixed(0)}ms`);
      console.log(`   🚀 Fastest: ${Math.min(...timings).toFixed(0)}ms`);
      console.log(`   🐌 Slowest: ${maxTiming.toFixed(0)}ms`);

      // Performance requirements
      if (avgTiming > 5000) {
        return { success: false, error: `Too slow: ${avgTiming.toFixed(0)}ms average` };
      }

      if (maxTiming > 10000) {
        return { success: false, error: `Max time exceeded: ${maxTiming.toFixed(0)}ms` };
      }

      return { success: true, data: { avgTiming, maxTiming } };
    });
  }

  // TEST 6: Market Condition Adaptation
  async testMarketConditions() {
    return this.runTest("Market Condition Adaptation", async () => {
      const conditions = ['bull', 'bear', 'volatile', 'normal'];
      const results = {};

      // Mock different market conditions
      const originalDetect = this.smartWalletSignal.detectMarketCondition;
      
      for (const condition of conditions) {
        // Override market detection
        this.smartWalletSignal.detectMarketCondition = () => condition;
        
        const context = {
          tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          rpcManager: this.mockRpcManager,
          logger: this.testLogger
        };

        const wallets = await this.smartWalletSignal.loadRealSmartWallets(context);
        results[condition] = {
          walletCount: wallets.length,
          tier1Count: wallets.filter(w => w.tier === 1).length,
          avgSharpe: wallets.reduce((sum, w) => sum + (w.sharpeRatio || 0), 0) / wallets.length
        };

        console.log(`   ${condition.toUpperCase()}: ${wallets.length} wallets, avg Sharpe ${results[condition].avgSharpe.toFixed(2)}`);
      }

      // Restore original function
      this.smartWalletSignal.detectMarketCondition = originalDetect;

      // Validate different strategies are applied
      const walletCounts = Object.values(results).map(r => r.walletCount);
      const hasVariation = Math.max(...walletCounts) !== Math.min(...walletCounts);

      if (!hasVariation) {
        return { success: false, error: "No market condition adaptation detected" };
      }

      return { success: true, data: results };
    });
  }

  // MAIN TEST RUNNER
  async runAllTests() {
    console.log('\n🚀 RENAISSANCE SIGNAL PIPELINE VALIDATION');
    console.log('==========================================');
    console.log('Testing complete end-to-end signal generation with real token addresses\n');

    // Run all test suites
    await this.testWalletLoading();
    await this.testWalletActivityDetection();
    await this.testSignalGeneration();
    await this.testMultipleTokens();
    await this.testPerformance();
    await this.testMarketConditions();

    // Final results
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`Total Tests: ${this.testResults.totalTests}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(1)}%`);

    if (this.testResults.errors.length > 0) {
      console.log('\n🔍 FAILED TESTS:');
      this.testResults.errors.forEach(error => {
        console.log(`   • ${error.test}: ${error.error}`);
      });
    }

    const allPassed = this.testResults.failed === 0;
    console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'} - ${allPassed ? 'READY FOR PRODUCTION' : 'NEEDS FIXES'}`);

    return {
      success: allPassed,
      results: this.testResults
    };
  }
}

// EXECUTION
async function runPipelineValidation() {
  const tester = new SignalPipelineTest();
  return await tester.runAllTests();
}

// For Node.js execution
if (typeof require !== 'undefined' && require.main === module) {
  runPipelineValidation().catch(console.error);
}

export { SignalPipelineTest, runPipelineValidation };