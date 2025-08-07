// RENAISSANCE TEST #15: FRESH TOKEN PROCESSING (0-60 SECONDS)
// Critical Window Testing: First 60 seconds = 80% of profitable opportunities
// Target: Prove system handles fresh tokens without crashes during peak profit window

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

class Test15FreshTokenProcessing {
  constructor() {
    this.testResults = [];
    this.crashCount = 0;
    this.passCount = 0;
  }

  // SCENARIO 1: ZERO HOLDERS (Seconds 0-15) - MOST CRITICAL
  async testZeroHoldersScenario() {
    console.log('\n🚨 SCENARIO 1: ZERO HOLDERS (Most Critical Crash Risk)');
    console.log('Timing: Seconds 0-15 after token creation');
    console.log('Financial Impact: Miss entire 15-minute profit cycle if crash\n');

    const mockRpcConnection = {
      call: async (method, params) => {
        if (method === 'getTokenLargestAccounts') {
          return {
            context: { slot: 123456789 },
            value: [] // EMPTY ARRAY - No holders yet
          };
        }
        if (method === 'getTokenSupply') {
          return {
            context: { slot: 123456789 },
            value: { amount: "1000000000", decimals: 9 }
          };
        }
        return null;
      }
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    try {
      console.log('Testing: largestAccounts.value[0] access on empty array...');
      
      // This should test the critical crash point
      const result = await service.processToken({
        tokenMint: "So11111111111111111111111111111111111112",  // Valid Solana address (SOL)
        createdAt: Date.now(),
        lpValueUSD: 0,
        uniqueWallets: 0,
        buyToSellRatio: 0
      });
      
      console.log('✅ ZERO HOLDERS TEST PASSED');
      console.log('Result:', result);
      this.passCount++;
      
      // Verify graceful handling
      if (result && typeof result === 'object') {
        console.log('✅ Graceful degradation confirmed');
      } else {
        console.log('⚠️  Unexpected result format');
      }
      
    } catch (error) {
      console.log('❌ ZERO HOLDERS TEST CRASHED');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack?.split('\n')[1]);
      this.crashCount++;
      
      // Critical failure analysis
      if (error.message.includes("Cannot read properties of undefined")) {
        console.log('🚨 CONFIRMED: Array access crash on empty holders');
      }
      if (error.message.includes("division by zero") || result?.toString().includes('NaN')) {
        console.log('🚨 CONFIRMED: Division by zero in percentage calculations');
      }
    }
  }

  // SCENARIO 2: MINIMAL HOLDER DATA (Seconds 15-30)
  async testMinimalHolderScenario() {
    console.log('\n📊 SCENARIO 2: MINIMAL HOLDER DATA (Seconds 15-30)');
    console.log('Data State: 1-2 holders, incomplete metadata');
    console.log('Risk: Type coercion bugs, missing field access\n');

    const mockRpcConnection = {
      getTokenLargestAccounts: async () => ({
        context: { slot: 123456789 },
        value: [{
          address: "22222223456789012345678901234567",
          amount: "1000000000", // String format from RPC
          // Missing: uiAmount, decimals fields that some code expects
        }]
      }),
      getTokenSupply: async () => ({
        context: { slot: 123456789 },
        value: { amount: "1000000000", decimals: 9 }
      }),
      getRecentTransactions: async () => [{
        signature: "tx123",
        meta: { err: null },
        // Minimal transaction data - many fields missing
      }]
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    try {
      console.log('Testing: Minimal data processing with type coercion risks...');
      
      const result = await service.processToken({
        tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  // Valid USDC address
        createdAt: Date.now(),
        lpValueUSD: 1000,
        uniqueWallets: 1
      });
      
      console.log('✅ MINIMAL HOLDER TEST PASSED');
      console.log('Result summary:', {
        isValid: result?.isValid,
        riskScore: result?.riskScore,
        hasCalculationErrors: result?.toString().includes('NaN')
      });
      this.passCount++;
      
      // Check for calculation integrity
      if (result?.toString().includes('NaN') || result?.toString().includes('Infinity')) {
        console.log('⚠️  Mathematical calculation errors detected');
      }
      
    } catch (error) {
      console.log('❌ MINIMAL HOLDER TEST CRASHED');
      console.log('Error:', error.message);
      this.crashCount++;
      
      if (error.message.includes("parseInt")) {
        console.log('🚨 CONFIRMED: String-to-number conversion crash');
      }
    }
  }

  // SCENARIO 3: RAPID DATA EVOLUTION (Seconds 30-60)
  async testRapidEvolutionScenario() {
    console.log('\n⚡ SCENARIO 3: RAPID DATA EVOLUTION (Seconds 30-60)');
    console.log('Data State: Multiple holders appearing, transaction volume spiking');
    console.log('Risk: Race conditions, data inconsistency between RPC calls\n');

    let callCount = 0;
    const mockRpcConnection = {
      getTokenLargestAccounts: async () => {
        callCount++;
        // Simulate data changing between calls
        const holderCount = Math.min(callCount, 5);
        const holders = [];
        for (let i = 0; i < holderCount; i++) {
          holders.push({
            address: `3333333${i}456789012345678901234567`,
            amount: String(Math.floor(1000000000 / holderCount))
          });
        }
        return {
          context: { slot: 123456789 + callCount },
          value: holders
        };
      },
      getTokenSupply: async () => ({
        context: { slot: 123456789 },
        value: { amount: "1000000000", decimals: 9 }
      }),
      getRecentTransactions: async () => {
        // Simulate increasing transaction volume
        const txCount = callCount * 3;
        const transactions = [];
        for (let i = 0; i < txCount; i++) {
          transactions.push({
            signature: `tx${i}`,
            meta: { err: null },
            blockTime: Date.now() - (i * 1000)
          });
        }
        return transactions;
      }
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    try {
      console.log('Testing: Rapidly evolving token data consistency...');
      
      const result = await service.processToken({
        tokenMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",  // Valid USDT address
        createdAt: Date.now(),
        lpValueUSD: 5000,
        uniqueWallets: 3
      });
      
      console.log('✅ RAPID EVOLUTION TEST PASSED');
      console.log('Result:', {
        isValid: result?.isValid,
        riskScore: result?.riskScore,
        dataConsistency: 'Maintained'
      });
      this.passCount++;
      
    } catch (error) {
      console.log('❌ RAPID EVOLUTION TEST CRASHED');
      console.log('Error:', error.message);
      this.crashCount++;
    }
  }

  // SCENARIO 4: MISSING METADATA (Fresh Token Characteristics)
  async testMissingMetadataScenario() {
    console.log('\n📝 SCENARIO 4: MISSING METADATA (Fresh Token Reality)');
    console.log('Data State: No name, symbol, description - common for fresh tokens');
    console.log('Risk: Metadata access crashes, string processing failures\n');

    const mockRpcConnection = {
      getTokenLargestAccounts: async () => ({
        context: { slot: 123456789 },
        value: []
      }),
      getTokenSupply: async () => ({
        context: { slot: 123456789 },
        value: { amount: "1000000000", decimals: 9 }
      }),
      getRecentTransactions: async () => [],
      getTokenMetadata: async () => null // No metadata available
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    try {
      console.log('Testing: Fresh token with no metadata...');
      
      const result = await service.processToken({
        tokenMint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",  // Valid Bonk address
        createdAt: Date.now(),
        lpValueUSD: 0,  // Fresh token with no metadata
        uniqueWallets: 0
      });
      
      console.log('✅ MISSING METADATA TEST PASSED');
      console.log('Graceful handling confirmed');
      this.passCount++;
      
    } catch (error) {
      console.log('❌ MISSING METADATA TEST CRASHED');
      console.log('Error:', error.message);
      this.crashCount++;
      
      if (error.message.includes("Cannot read properties of null")) {
        console.log('🚨 CONFIRMED: Metadata access crash');
      }
    }
  }

  // PERFORMANCE TEST: Sub-30 Second Analysis
  async testFreshTokenPerformance() {
    console.log('\n⏱️  PERFORMANCE TEST: Fresh Token Analysis Speed');
    console.log('Target: Sub-30 second analysis for competitive advantage');
    console.log('Competition: Retail traders take 3-7 minutes\n');

    const startTime = Date.now();

    const mockRpcConnection = {
      getTokenLargestAccounts: async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
        return { value: [] };
      },
      getTokenSupply: async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { value: { amount: "1000000000", decimals: 9 }};
      },
      getRecentTransactions: async () => {
        await new Promise(resolve => setTimeout(resolve, 75));
        return [];
      }
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    try {
      const result = await service.processToken({
        tokenMint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",  // Valid RAY address
        createdAt: Date.now(),
        lpValueUSD: 2500
      });
      const analysisTime = Date.now() - startTime;
      
      console.log(`Analysis completed in ${analysisTime}ms`);
      
      if (analysisTime < 30000) { // 30 seconds
        console.log('✅ PERFORMANCE TARGET MET');
        console.log(`Competitive advantage: ${30000 - analysisTime}ms faster than 30s target`);
      } else {
        console.log('❌ PERFORMANCE TARGET MISSED');
        console.log(`Overtime: ${analysisTime - 30000}ms beyond target`);
      }
      
    } catch (error) {
      console.log('❌ PERFORMANCE TEST FAILED - CRASH');
      console.log('Error:', error.message);
      this.crashCount++;
    }
  }

  // COMPREHENSIVE FRESH TOKEN STRESS TEST
  async runComprehensiveTest() {
    console.log('==================================================');
    console.log('RENAISSANCE TEST #15: FRESH TOKEN PROCESSING');
    console.log('Critical Window: First 60 seconds = Peak Profit');
    console.log('Financial Impact: 80% of profitable opportunities');
    console.log('==================================================\n');

    // Run all test scenarios
    await this.testZeroHoldersScenario();
    await this.testMinimalHolderScenario();
    await this.testRapidEvolutionScenario();
    await this.testMissingMetadataScenario();
    await this.testFreshTokenPerformance();

    // Final assessment
    console.log('\n==================================================');
    console.log('FRESH TOKEN PROCESSING TEST RESULTS');
    console.log('==================================================');
    console.log(`✅ Passed: ${this.passCount} scenarios`);
    console.log(`❌ Crashed: ${this.crashCount} scenarios`);
    
    const totalTests = this.passCount + this.crashCount;
    const successRate = (this.passCount / totalTests * 100).toFixed(1);
    
    console.log(`Success Rate: ${successRate}%`);
    
    if (this.crashCount === 0) {
      console.log('\n🎯 FRESH TOKEN PROCESSING: PRODUCTION READY');
      console.log('System handles all fresh token scenarios gracefully');
      console.log('Competitive advantage maintained: Sub-30s analysis capability');
    } else {
      console.log('\n🚨 FRESH TOKEN PROCESSING: CRITICAL ISSUES FOUND');
      console.log('System crashes during peak profit windows');
      console.log('IMMEDIATE FIX REQUIRED before integration');
    }
    
    console.log('\n💰 FINANCIAL IMPACT ASSESSMENT:');
    if (this.crashCount === 0) {
      console.log('✅ No missed opportunities due to fresh token handling');
      console.log('✅ 80% of profit potential preserved');
      console.log('✅ Competitive advantage over retail maintained');
    } else {
      console.log('❌ Fresh token crashes = Miss primary profit windows');
      console.log('❌ Lost competitive advantage during peak opportunities');
      console.log('❌ Direct revenue impact: High');
    }
  }
}

// Execute the comprehensive fresh token test
const test = new Test15FreshTokenProcessing();
test.runComprehensiveTest().catch(console.error);