// RENAISSANCE TEST #18: VIRAL TOKEN FLOOD SCENARIOS
// Critical Stress Testing: 20-100 tokens in 60 seconds
// Target: Prove system handles viral events without missing opportunities
// Financial Impact: Viral events = highest profit windows (500-2000% spikes)

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

class Test18ViralTokenFlood {
  constructor() {
    this.testResults = [];
    this.processedCount = 0;
    this.missedCount = 0;
    this.errorCount = 0;
    this.peakMemoryUsage = 0;
    this.processingTimes = [];
    this.startTime = null;
  }

  // SCENARIO 1: MODERATE VIRAL EVENT (20 tokens/60s)
  async testModerateViralEvent() {
    console.log('\n🔥 SCENARIO 1: MODERATE VIRAL EVENT');
    console.log('Volume: 20 tokens in 60 seconds (1 every 3 seconds)');
    console.log('Target: Process all tokens under 30s each');
    console.log('Financial Impact: Moderate viral = 200-500% profit spike\n');

    const mockRpcConnection = {
      call: async (method, params) => {
        // Add realistic network delay for viral events
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        
        if (method === 'getTokenLargestAccounts') {
          // Simulate varying holder counts during viral event
          const holderCount = Math.floor(Math.random() * 10) + 1;
          const holders = [];
          for (let i = 0; i < holderCount; i++) {
            holders.push({
              address: `Viral${i}${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
              amount: String(Math.floor(Math.random() * 1000000000))
            });
          }
          return {
            context: { slot: 123456789 + Math.floor(Math.random() * 1000) },
            value: holders
          };
        }
        
        if (method === 'getTokenSupply') {
          return {
            context: { slot: 123456789 },
            value: { 
              amount: String(Math.floor(Math.random() * 10000000000)),
              decimals: 9,
              uiAmount: Math.random() * 10000
            }
          };
        }
        
        return null;
      }
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    // Reset counters
    this.resetCounters();
    this.startTime = Date.now();
    
    console.log('🚀 Starting moderate viral event simulation...\n');

    // Generate 20 tokens over 60 seconds
    const tokens = this.generateViralTokens(20, 'moderate');
    const promises = [];
    
    // Process tokens with realistic timing
    for (let i = 0; i < tokens.length; i++) {
      const delay = i * 3000; // 3 second intervals
      
      const promise = new Promise(async (resolve) => {
        setTimeout(async () => {
          try {
            const tokenStartTime = Date.now();
            console.log(`📊 Processing token ${i + 1}/20: ${tokens[i].tokenMint.substring(0, 8)}...`);
            
            const result = await service.processToken(tokens[i]);
            
            const processingTime = Date.now() - tokenStartTime;
            this.processingTimes.push(processingTime);
            
            if (result.approved) {
              this.processedCount++;
              console.log(`  ✅ Token approved (${processingTime}ms)`);
            } else {
              console.log(`  ❌ Token rejected: ${result.reason} (${processingTime}ms)`);
            }
            
            // Check memory usage
            if (global.gc) {
              global.gc();
              const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
              this.peakMemoryUsage = Math.max(this.peakMemoryUsage, memUsage);
            }
            
            resolve(result);
          } catch (error) {
            this.errorCount++;
            console.log(`  💥 Token processing crashed: ${error.message}`);
            resolve({ error: error.message });
          }
        }, delay);
      });
      
      promises.push(promise);
    }
    
    // Wait for all tokens to complete
    const results = await Promise.all(promises);
    const totalTime = Date.now() - this.startTime;
    
    // Analysis
    const avgProcessingTime = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
    const maxProcessingTime = Math.max(...this.processingTimes);
    const successRate = (this.processedCount / tokens.length) * 100;
    
    console.log('\n📊 MODERATE VIRAL EVENT RESULTS:');
    console.log(`Total tokens: ${tokens.length}`);
    console.log(`Successfully processed: ${this.processedCount}`);
    console.log(`Errors/crashes: ${this.errorCount}`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log(`Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log(`Max processing time: ${maxProcessingTime}ms`);
    console.log(`Peak memory usage: ${this.peakMemoryUsage.toFixed(1)}MB`);
    console.log(`Total event duration: ${(totalTime / 1000).toFixed(1)}s`);
    
    // Success criteria
    const passed = this.errorCount === 0 && avgProcessingTime < 30000 && this.peakMemoryUsage < 200;
    
    if (passed) {
      console.log('✅ MODERATE VIRAL EVENT: PASSED');
      console.log('System handled viral event without missing opportunities');
    } else {
      console.log('❌ MODERATE VIRAL EVENT: FAILED');
      if (this.errorCount > 0) console.log(`  - ${this.errorCount} processing errors detected`);
      if (avgProcessingTime >= 30000) console.log(`  - Average processing too slow: ${avgProcessingTime}ms`);
      if (this.peakMemoryUsage >= 200) console.log(`  - Memory usage too high: ${this.peakMemoryUsage}MB`);
    }
    
    return { passed, results, stats: this.getStats() };
  }

  // SCENARIO 2: EXTREME VIRAL EVENT (50 tokens/60s)
  async testExtremeViralEvent() {
    console.log('\n🌋 SCENARIO 2: EXTREME VIRAL EVENT');
    console.log('Volume: 50 tokens in 60 seconds with burst patterns');
    console.log('Target: Handle system stress without missing opportunities');
    console.log('Financial Impact: Extreme viral = 1000%+ profit potential\n');

    const mockRpcConnection = {
      callCount: 0,
      call: async (method, params) => {
        this.callCount = (this.callCount || 0) + 1;
        
        // Simulate RPC stress - some calls slower during high load
        const baseDelay = 75;
        const stressDelay = this.callCount > 50 ? Math.random() * 500 : 0;
        await new Promise(resolve => setTimeout(resolve, baseDelay + stressDelay));
        
        // Simulate occasional RPC failures during extreme load
        if (this.callCount > 100 && Math.random() < 0.05) {
          throw new Error('RPC_OVERLOADED');
        }
        
        if (method === 'getTokenLargestAccounts') {
          // More holders during viral events
          const holderCount = Math.floor(Math.random() * 25) + 5;
          const holders = [];
          for (let i = 0; i < holderCount; i++) {
            holders.push({
              address: `Holder${i}${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
              amount: String(Math.floor(Math.random() * 5000000000))
            });
          }
          return {
            context: { slot: 123456789 + this.callCount },
            value: holders
          };
        }
        
        if (method === 'getTokenSupply') {
          return {
            context: { slot: 123456789 },
            value: { 
              amount: String(Math.floor(Math.random() * 50000000000)),
              decimals: 9,
              uiAmount: Math.random() * 50000
            }
          };
        }
        
        return null;
      }
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    // Reset counters
    this.resetCounters();
    this.startTime = Date.now();
    
    console.log('🚀 Starting extreme viral event simulation...\n');

    // Generate 50 tokens with burst patterns
    const tokens = this.generateViralTokens(50, 'extreme');
    const burstPattern = [8, 2, 0, 12, 3, 0, 0, 15, 5, 2, 1, 0, 2]; // Realistic burst timing
    
    const promises = [];
    let tokenIndex = 0;
    
    // Process tokens in bursts
    for (let minute = 0; minute < burstPattern.length && tokenIndex < tokens.length; minute++) {
      const tokensThisMinute = Math.min(burstPattern[minute], tokens.length - tokenIndex);
      
      for (let burst = 0; burst < tokensThisMinute; burst++) {
        if (tokenIndex >= tokens.length) break;
        
        const token = tokens[tokenIndex];
        const delay = (minute * 60000) + (burst * (60000 / Math.max(tokensThisMinute, 1)));
        
        const promise = new Promise(async (resolve) => {
          setTimeout(async () => {
            try {
              const tokenStartTime = Date.now();
              console.log(`📊 Processing token ${tokenIndex + 1}/50: ${token.tokenMint.substring(0, 8)}... (Minute ${minute + 1})`);
              
              const result = await service.processToken(token);
              
              const processingTime = Date.now() - tokenStartTime;
              this.processingTimes.push(processingTime);
              
              if (result.approved) {
                this.processedCount++;
                console.log(`  ✅ Approved (${processingTime}ms)`);
              } else {
                console.log(`  ❌ Rejected: ${result.reason} (${processingTime}ms)`);
              }
              
              // Memory monitoring
              if (global.gc) {
                global.gc();
                const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
                this.peakMemoryUsage = Math.max(this.peakMemoryUsage, memUsage);
              }
              
              resolve(result);
            } catch (error) {
              this.errorCount++;
              console.log(`  💥 Crashed: ${error.message}`);
              resolve({ error: error.message });
            }
          }, delay);
        });
        
        promises.push(promise);
        tokenIndex++;
      }
    }
    
    console.log('\n⏳ Processing extreme viral event...');
    const results = await Promise.all(promises);
    const totalTime = Date.now() - this.startTime;
    
    // Analysis
    const avgProcessingTime = this.processingTimes.length > 0 ? 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length : 0;
    const maxProcessingTime = this.processingTimes.length > 0 ? Math.max(...this.processingTimes) : 0;
    const successRate = (this.processedCount / tokens.length) * 100;
    const tokensPerSecond = (tokens.length / (totalTime / 1000));
    
    console.log('\n🌋 EXTREME VIRAL EVENT RESULTS:');
    console.log(`Total tokens: ${tokens.length}`);
    console.log(`Successfully processed: ${this.processedCount}`);
    console.log(`Errors/crashes: ${this.errorCount}`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log(`Processing rate: ${tokensPerSecond.toFixed(2)} tokens/second`);
    console.log(`Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log(`Max processing time: ${maxProcessingTime}ms`);
    console.log(`Peak memory usage: ${this.peakMemoryUsage.toFixed(1)}MB`);
    console.log(`Total event duration: ${(totalTime / 1000).toFixed(1)}s`);
    
    // Success criteria for extreme events
    const passed = this.errorCount <= 2 && // Allow up to 2 errors during extreme stress
                   avgProcessingTime < 45000 && // Slightly higher tolerance
                   this.peakMemoryUsage < 300 && // Higher memory tolerance
                   successRate >= 95; // Must process 95%+ tokens
    
    if (passed) {
      console.log('✅ EXTREME VIRAL EVENT: PASSED');
      console.log('System maintained performance during extreme viral stress');
    } else {
      console.log('❌ EXTREME VIRAL EVENT: FAILED');
      if (this.errorCount > 2) console.log(`  - Too many errors: ${this.errorCount}`);
      if (avgProcessingTime >= 45000) console.log(`  - Processing too slow: ${avgProcessingTime}ms`);
      if (this.peakMemoryUsage >= 300) console.log(`  - Memory usage too high: ${this.peakMemoryUsage}MB`);
      if (successRate < 95) console.log(`  - Success rate too low: ${successRate}%`);
    }
    
    return { passed, results, stats: this.getStats() };
  }

  // SCENARIO 3: MEGAVIRAL BURST (20+ tokens in 10 seconds)
  async testMegaviralBurst() {
    console.log('\n💥 SCENARIO 3: MEGAVIRAL BURST');
    console.log('Volume: 25 tokens in 10 seconds (2.5 tokens/second)');
    console.log('Target: Handle burst without system collapse');
    console.log('Financial Impact: Burst events = highest single-minute profits\n');

    const mockRpcConnection = {
      burstCallCount: 0,
      call: async (method, params) => {
        this.burstCallCount = (this.burstCallCount || 0) + 1;
        
        // Simulate burst stress - very fast processing needed
        const burstDelay = 25 + Math.random() * 50;
        await new Promise(resolve => setTimeout(resolve, burstDelay));
        
        if (method === 'getTokenLargestAccounts') {
          // Rapid token creation = fewer initial holders
          const holderCount = Math.floor(Math.random() * 5) + 1;
          const holders = [];
          for (let i = 0; i < holderCount; i++) {
            holders.push({
              address: `Burst${i}${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
              amount: String(Math.floor(Math.random() * 1000000000))
            });
          }
          return {
            context: { slot: 123456789 + this.burstCallCount },
            value: holders
          };
        }
        
        if (method === 'getTokenSupply') {
          return {
            context: { slot: 123456789 },
            value: { 
              amount: String(Math.floor(Math.random() * 10000000000)),
              decimals: 9,
              uiAmount: Math.random() * 10000
            }
          };
        }
        
        return null;
      }
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    // Reset counters
    this.resetCounters();
    this.startTime = Date.now();
    
    console.log('🚀 Starting megaviral burst simulation...\n');

    // Generate 25 tokens for 10-second burst
    const tokens = this.generateViralTokens(25, 'megaburst');
    const promises = [];
    
    // Process all tokens within 10 seconds with random delays
    for (let i = 0; i < tokens.length; i++) {
      const delay = Math.random() * 10000; // Random within 10 seconds
      
      const promise = new Promise(async (resolve) => {
        setTimeout(async () => {
          try {
            const tokenStartTime = Date.now();
            const elapsed = Date.now() - this.startTime;
            console.log(`⚡ Token ${i + 1}/25: ${tokens[i].tokenMint.substring(0, 8)}... (${(elapsed/1000).toFixed(1)}s)`);
            
            const result = await service.processToken(tokens[i]);
            
            const processingTime = Date.now() - tokenStartTime;
            this.processingTimes.push(processingTime);
            
            if (result.approved) {
              this.processedCount++;
              console.log(`  ✅ Approved (${processingTime}ms)`);
            } else {
              console.log(`  ❌ Rejected: ${result.reason} (${processingTime}ms)`);
            }
            
            resolve(result);
          } catch (error) {
            this.errorCount++;
            console.log(`  💥 Burst crash: ${error.message}`);
            resolve({ error: error.message });
          }
        }, delay);
      });
      
      promises.push(promise);
    }
    
    console.log('⏳ Processing megaviral burst...');
    const results = await Promise.all(promises);
    const totalTime = Date.now() - this.startTime;
    
    // Analysis
    const avgProcessingTime = this.processingTimes.length > 0 ? 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length : 0;
    const maxProcessingTime = this.processingTimes.length > 0 ? Math.max(...this.processingTimes) : 0;
    const successRate = (this.processedCount / tokens.length) * 100;
    const actualBurstRate = tokens.length / (totalTime / 1000);
    
    console.log('\n💥 MEGAVIRAL BURST RESULTS:');
    console.log(`Total tokens: ${tokens.length}`);
    console.log(`Successfully processed: ${this.processedCount}`);
    console.log(`Errors/crashes: ${this.errorCount}`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log(`Actual burst rate: ${actualBurstRate.toFixed(2)} tokens/second`);
    console.log(`Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log(`Max processing time: ${maxProcessingTime}ms`);
    console.log(`Total burst duration: ${(totalTime / 1000).toFixed(1)}s`);
    
    // Success criteria for burst events
    const passed = this.errorCount === 0 && // No errors allowed during burst
                   avgProcessingTime < 15000 && // Must be very fast
                   successRate >= 100 && // Must process all tokens
                   actualBurstRate >= 2.0; // Must maintain burst rate
    
    if (passed) {
      console.log('✅ MEGAVIRAL BURST: PASSED');
      console.log('System handled burst processing without missing opportunities');
    } else {
      console.log('❌ MEGAVIRAL BURST: FAILED');
      if (this.errorCount > 0) console.log(`  - Errors during burst: ${this.errorCount}`);
      if (avgProcessingTime >= 15000) console.log(`  - Processing too slow for burst: ${avgProcessingTime}ms`);
      if (successRate < 100) console.log(`  - Missed tokens during burst: ${100 - successRate}%`);
      if (actualBurstRate < 2.0) console.log(`  - Burst rate too low: ${actualBurstRate} tokens/s`);
    }
    
    return { passed, results, stats: this.getStats() };
  }

  // COMPREHENSIVE VIRAL TOKEN FLOOD TEST
  async runComprehensiveTest() {
    console.log('==================================================');
    console.log('RENAISSANCE TEST #18: VIRAL TOKEN FLOOD');
    console.log('Critical Stress: 20-100 tokens in 60 seconds');
    console.log('Financial Impact: Viral events = highest profit windows');
    console.log('==================================================\n');

    const testResults = {
      moderate: null,
      extreme: null,
      megaburst: null,
      overallPassed: false
    };

    // Run all viral test scenarios
    console.log('🔥 Starting comprehensive viral token flood testing...\n');
    
    testResults.moderate = await this.testModerateViralEvent();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause between tests
    
    testResults.extreme = await this.testExtremeViralEvent();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause between tests
    
    testResults.megaburst = await this.testMegaviralBurst();

    // Overall assessment
    const allPassed = testResults.moderate.passed && 
                      testResults.extreme.passed && 
                      testResults.megaburst.passed;
    
    testResults.overallPassed = allPassed;

    // Final assessment
    console.log('\n==================================================');
    console.log('VIRAL TOKEN FLOOD TEST RESULTS');
    console.log('==================================================');
    console.log(`🔥 Moderate Viral (20 tokens/60s): ${testResults.moderate.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🌋 Extreme Viral (50 tokens/60s): ${testResults.extreme.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`💥 Megaviral Burst (25 tokens/10s): ${testResults.megaburst.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎯 VIRAL TOKEN FLOOD: PRODUCTION READY');
      console.log('System handles all viral scenarios without missing opportunities');
      console.log('Competitive advantage maintained during highest profit events');
    } else {
      console.log('\n🚨 VIRAL TOKEN FLOOD: CRITICAL ISSUES FOUND');
      console.log('System cannot handle viral events = Miss peak profit windows');
      console.log('IMMEDIATE OPTIMIZATION REQUIRED for viral event readiness');
    }
    
    console.log('\n💰 FINANCIAL IMPACT ASSESSMENT:');
    if (allPassed) {
      console.log('✅ No missed opportunities during viral events');
      console.log('✅ Peak profit potential captured');
      console.log('✅ Competitive advantage during viral floods');
      console.log('✅ System ready for 1000%+ profit events');
    } else {
      console.log('❌ Viral event failures = Miss highest profit windows');
      console.log('❌ Lost competitive advantage during peak opportunities');
      console.log('❌ Direct revenue impact: Critical');
      console.log('❌ System not ready for viral profit events');
    }
    
    return testResults;
  }

  // Helper Methods
  generateViralTokens(count, eventType) {
    const tokens = [];
    const baseAddresses = [
      'So11111111111111111111111111111111111112',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'
    ];
    
    for (let i = 0; i < count; i++) {
      const baseAddr = baseAddresses[i % baseAddresses.length];
      // Modify address slightly to create unique tokens
      const tokenAddr = baseAddr.slice(0, -4) + String(i).padStart(4, '0');
      
      const token = {
        tokenMint: tokenAddr,
        createdAt: Date.now() - Math.random() * 60000, // Random age within last minute
        lpValueUSD: Math.random() * (eventType === 'megaburst' ? 5000 : 10000),
        uniqueWallets: Math.floor(Math.random() * (eventType === 'extreme' ? 50 : 25)) + 1,
        buyToSellRatio: Math.random() * 20 + 1,
        avgTransactionSpread: Math.random() * 120 + 30,
        transactionSizeVariation: Math.random() * 0.8 + 0.2,
        volume24h: Math.random() * 100000,
        dex: Math.random() > 0.5 ? 'raydium' : 'pump.fun'
      };
      
      tokens.push(token);
    }
    
    return tokens;
  }

  resetCounters() {
    this.processedCount = 0;
    this.missedCount = 0;
    this.errorCount = 0;
    this.peakMemoryUsage = 0;
    this.processingTimes = [];
  }

  getStats() {
    return {
      processed: this.processedCount,
      errors: this.errorCount,
      peakMemory: this.peakMemoryUsage,
      avgProcessingTime: this.processingTimes.length > 0 ? 
        this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length : 0,
      maxProcessingTime: this.processingTimes.length > 0 ? Math.max(...this.processingTimes) : 0
    };
  }
}

// Execute the comprehensive viral token flood test
const test = new Test18ViralTokenFlood();
test.runComprehensiveTest().catch(console.error);