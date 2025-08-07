// RENAISSANCE TEST #23: THROUGHPUT LIMITS DURING VIRAL EVENTS
// Critical Capacity Testing: Maximum sustainable token processing rate
// Target: Find system throughput ceiling and identify bottlenecks
// Financial Impact: Throughput limits = Direct opportunity loss

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

class Test23ThroughputLimits {
  constructor() {
    this.testResults = [];
    this.throughputData = [];
    this.bottleneckAnalysis = {};
    this.performanceMetrics = {
      baseline: null,
      concurrent: null,
      saturation: null,
      sustained: null
    };
  }

  // SCENARIO 1: BASELINE THROUGHPUT (Sequential Processing)
  async testBaselineThroughput() {
    console.log('\n📏 SCENARIO 1: BASELINE THROUGHPUT');
    console.log('Method: Sequential token processing');
    console.log('Target: Establish single-threaded performance baseline');
    console.log('Financial Impact: Baseline = Minimum guaranteed throughput\n');

    const mockRpcConnection = {
      callCount: 0,
      avgDelay: 0,
      call: async (method, params) => {
        this.callCount = (this.callCount || 0) + 1;
        
        // Realistic RPC delay with slight variation
        const delay = 75 + Math.random() * 50; // 75-125ms
        this.avgDelay = ((this.avgDelay || 0) * (this.callCount - 1) + delay) / this.callCount;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (method === 'getTokenLargestAccounts') {
          return {
            context: { slot: 123456789 + this.callCount },
            value: this.generateMockHolders(3)
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

    console.log('🚀 Starting baseline throughput test...\n');

    const tokenCount = 50; // Reasonable number for baseline
    const tokens = this.generateTestTokens(tokenCount, 'baseline');
    
    const startTime = Date.now();
    const results = [];
    const processingTimes = [];

    // Process tokens sequentially (one at a time)
    for (let i = 0; i < tokens.length; i++) {
      const tokenStartTime = Date.now();
      
      try {
        console.log(`📊 Processing token ${i + 1}/${tokenCount}: ${tokens[i].tokenMint.substring(0, 8)}...`);
        
        const result = await service.processToken(tokens[i]);
        
        const processingTime = Date.now() - tokenStartTime;
        processingTimes.push(processingTime);
        results.push(result);
        
        console.log(`  ${result.approved ? '✅' : '❌'} ${result.reason || 'approved'} (${processingTime}ms)`);
        
      } catch (error) {
        console.log(`  💥 Error: ${error.message}`);
        results.push({ error: error.message });
      }
      
      // Brief pause to avoid overwhelming logs
      if (i < tokens.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Calculate baseline metrics
    const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const tokensPerSecond = (tokenCount / (totalTime / 1000));
    const successfulProcessing = results.filter(r => !r.error).length;
    const successRate = (successfulProcessing / tokenCount) * 100;
    
    console.log('\n📏 BASELINE THROUGHPUT RESULTS:');
    console.log(`Total tokens processed: ${tokenCount}`);
    console.log(`Successful processing: ${successfulProcessing}`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log(`Total processing time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log(`Baseline throughput: ${tokensPerSecond.toFixed(2)} tokens/second`);
    console.log(`Average RPC delay: ${mockRpcConnection.avgDelay.toFixed(0)}ms`);
    
    // Store baseline metrics
    this.performanceMetrics.baseline = {
      tokensPerSecond,
      avgProcessingTime,
      successRate,
      totalTime,
      rpcDelay: mockRpcConnection.avgDelay
    };
    
    // Success criteria for baseline
    const passed = successRate >= 95 && tokensPerSecond >= 2.0;
    
    if (passed) {
      console.log('✅ BASELINE THROUGHPUT: ACCEPTABLE');
      console.log(`System can process at least ${tokensPerSecond.toFixed(1)} tokens/second sequentially`);
    } else {
      console.log('❌ BASELINE THROUGHPUT: TOO LOW');
      if (successRate < 95) console.log(`  - Success rate too low: ${successRate}%`);
      if (tokensPerSecond < 2.0) console.log(`  - Throughput too slow: ${tokensPerSecond} tokens/s`);
    }
    
    return { passed, metrics: this.performanceMetrics.baseline };
  }

  // SCENARIO 2: CONCURRENT THROUGHPUT (Parallel Processing)
  async testConcurrentThroughput() {
    console.log('\n🔄 SCENARIO 2: CONCURRENT THROUGHPUT');
    console.log('Method: Parallel token processing at multiple concurrency levels');
    console.log('Target: Find optimal concurrency for maximum throughput');
    console.log('Financial Impact: Higher concurrency = More opportunities captured\n');

    const concurrencyLevels = [5, 10, 15, 25, 35, 50];
    const concurrencyResults = [];
    
    for (const concurrency of concurrencyLevels) {
      console.log(`\n🔄 Testing concurrency level: ${concurrency}`);
      
      const mockRpcConnection = {
        activeCalls: 0,
        maxActiveCalls: 0,
        callCount: 0,
        call: async (method, params) => {
          this.activeCalls = (this.activeCalls || 0) + 1;
          this.maxActiveCalls = Math.max(this.maxActiveCalls || 0, this.activeCalls);
          this.callCount = (this.callCount || 0) + 1;
          
          // Simulate connection pool stress
          const baseDelay = 50;
          const stressDelay = this.activeCalls > 20 ? (this.activeCalls - 20) * 10 : 0;
          const totalDelay = baseDelay + stressDelay;
          
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          
          this.activeCalls--;
          
          if (method === 'getTokenLargestAccounts') {
            return {
              context: { slot: 123456789 + this.callCount },
              value: this.generateMockHolders(2)
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

      const tokenCount = concurrency * 4; // 4 tokens per concurrency slot
      const tokens = this.generateTestTokens(tokenCount, 'concurrent');
      
      const startTime = Date.now();
      const processingTimes = [];
      let successCount = 0;
      let errorCount = 0;
      
      // Process tokens with controlled concurrency
      const promises = [];
      for (let i = 0; i < tokens.length; i += concurrency) {
        const batch = tokens.slice(i, i + concurrency);
        
        const batchPromises = batch.map(async (token, batchIndex) => {
          const tokenStartTime = Date.now();
          
          try {
            const result = await service.processToken(token);
            const processingTime = Date.now() - tokenStartTime;
            processingTimes.push(processingTime);
            
            if (result.approved) successCount++;
            
            return result;
          } catch (error) {
            errorCount++;
            return { error: error.message };
          }
        });
        
        promises.push(...batchPromises);
        
        // Wait for batch to complete before starting next batch
        await Promise.all(batchPromises);
        
        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const totalTime = Date.now() - startTime;
      
      // Calculate concurrency metrics
      const avgProcessingTime = processingTimes.length > 0 ? 
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0;
      const tokensPerSecond = tokenCount / (totalTime / 1000);
      const successRate = (successCount / tokenCount) * 100;
      
      const result = {
        concurrency,
        tokenCount,
        tokensPerSecond,
        avgProcessingTime,
        successRate,
        maxActiveCalls: mockRpcConnection.maxActiveCalls,
        errorCount,
        totalTime
      };
      
      concurrencyResults.push(result);
      
      console.log(`  Throughput: ${tokensPerSecond.toFixed(2)} tokens/second`);
      console.log(`  Success rate: ${successRate.toFixed(1)}%`);
      console.log(`  Max concurrent calls: ${mockRpcConnection.maxActiveCalls}`);
      console.log(`  Avg processing time: ${avgProcessingTime.toFixed(0)}ms`);
      
      // Brief pause between concurrency tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Find optimal concurrency level
    const bestResult = concurrencyResults.reduce((best, current) => 
      current.tokensPerSecond > best.tokensPerSecond && current.successRate >= 95 ? current : best
    );
    
    console.log('\n🔄 CONCURRENT THROUGHPUT RESULTS:');
    console.log('Concurrency Level | Throughput | Success Rate | Avg Time');
    console.log('------------------|------------|--------------|----------');
    concurrencyResults.forEach(r => {
      const marker = r === bestResult ? ' ⭐' : '   ';
      console.log(`${marker} ${r.concurrency.toString().padStart(13)} | ${r.tokensPerSecond.toFixed(2).padStart(10)} | ${r.successRate.toFixed(1).padStart(11)}% | ${r.avgProcessingTime.toFixed(0).padStart(8)}ms`);
    });
    
    console.log(`\n🎯 OPTIMAL CONCURRENCY: ${bestResult.concurrency}`);
    console.log(`Maximum throughput: ${bestResult.tokensPerSecond.toFixed(2)} tokens/second`);
    console.log(`Success rate: ${bestResult.successRate.toFixed(1)}%`);
    
    // Store concurrent metrics
    this.performanceMetrics.concurrent = bestResult;
    
    const passed = bestResult.tokensPerSecond >= 10 && bestResult.successRate >= 95;
    
    if (passed) {
      console.log('✅ CONCURRENT THROUGHPUT: EXCELLENT');
      console.log(`System achieves ${bestResult.tokensPerSecond.toFixed(1)} tokens/second with concurrency`);
    } else {
      console.log('❌ CONCURRENT THROUGHPUT: INSUFFICIENT');
      if (bestResult.tokensPerSecond < 10) console.log(`  - Throughput too low: ${bestResult.tokensPerSecond} tokens/s`);
      if (bestResult.successRate < 95) console.log(`  - Success rate too low: ${bestResult.successRate}%`);
    }
    
    return { passed, metrics: this.performanceMetrics.concurrent, allResults: concurrencyResults };
  }

  // SCENARIO 3: SATURATION POINT (System Limits)
  async testSaturationPoint() {
    console.log('\n🌊 SCENARIO 3: SYSTEM SATURATION POINT');
    console.log('Method: Exponentially increase load until system saturates');
    console.log('Target: Find maximum sustainable throughput');
    console.log('Financial Impact: Saturation point = Hard limit on opportunities\n');

    // Use optimal concurrency from previous test
    const optimalConcurrency = this.performanceMetrics.concurrent?.concurrency || 25;
    console.log(`Using optimal concurrency: ${optimalConcurrency}`);

    const loadLevels = [50, 100, 200, 300, 500, 750, 1000]; // Number of tokens to process
    const saturationResults = [];
    let saturated = false;
    
    for (const tokenCount of loadLevels) {
      if (saturated) break;
      
      console.log(`\n🌊 Testing load level: ${tokenCount} tokens`);
      
      const mockRpcConnection = {
        activeCalls: 0,
        maxActiveCalls: 0,
        totalCalls: 0,
        failedCalls: 0,
        call: async (method, params) => {
          this.activeCalls = (this.activeCalls || 0) + 1;
          this.maxActiveCalls = Math.max(this.maxActiveCalls || 0, this.activeCalls);
          this.totalCalls = (this.totalCalls || 0) + 1;
          
          // Simulate system stress with increasing load
          const baseDelay = 30;
          const stressMultiplier = Math.min(this.activeCalls / 10, 5); // Up to 5x delay under stress
          const totalDelay = baseDelay * (1 + stressMultiplier);
          
          // Simulate occasional failures under extreme load
          if (this.activeCalls > 50 && Math.random() < 0.02) {
            this.failedCalls++;
            this.activeCalls--;
            throw new Error('SYSTEM_OVERLOADED');
          }
          
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          
          this.activeCalls--;
          
          if (method === 'getTokenLargestAccounts') {
            return {
              context: { slot: 123456789 + this.totalCalls },
              value: this.generateMockHolders(1) // Minimal data under load
            };
          }
          
          if (method === 'getTokenSupply') {
            return {
              context: { slot: 123456789 },
              value: { 
                amount: String(Math.floor(Math.random() * 10000000000)),
                decimals: 9
              }
            };
          }
          
          return null;
        }
      };

      const service = new TieredTokenFilterService();
      service.rpcManager = mockRpcConnection;

      const tokens = this.generateTestTokens(tokenCount, 'saturation');
      
      const startTime = Date.now();
      let processedCount = 0;
      let errorCount = 0;
      const processingTimes = [];
      
      // Process with optimal concurrency
      const promises = [];
      for (let i = 0; i < tokens.length; i += optimalConcurrency) {
        const batch = tokens.slice(i, i + optimalConcurrency);
        
        const batchPromises = batch.map(async (token) => {
          const tokenStartTime = Date.now();
          
          try {
            const result = await service.processToken(token);
            const processingTime = Date.now() - tokenStartTime;
            processingTimes.push(processingTime);
            processedCount++;
            return result;
          } catch (error) {
            errorCount++;
            return { error: error.message };
          }
        });
        
        promises.push(...batchPromises);
      }
      
      // Wait for all tokens to process
      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      const tokensPerSecond = tokenCount / (totalTime / 1000);
      const successRate = (processedCount / tokenCount) * 100;
      const avgProcessingTime = processingTimes.length > 0 ? 
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0;
      
      const result = {
        tokenCount,
        tokensPerSecond,
        successRate,
        avgProcessingTime,
        maxActiveCalls: mockRpcConnection.maxActiveCalls,
        failedCalls: mockRpcConnection.failedCalls,
        errorCount,
        totalTime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
      };
      
      saturationResults.push(result);
      
      console.log(`  Throughput: ${tokensPerSecond.toFixed(2)} tokens/second`);
      console.log(`  Success rate: ${successRate.toFixed(1)}%`);
      console.log(`  Processing time: ${avgProcessingTime.toFixed(0)}ms`);
      console.log(`  Memory usage: ${result.memoryUsage.toFixed(1)}MB`);
      console.log(`  Failed calls: ${mockRpcConnection.failedCalls}`);
      
      // Check for saturation signs
      const previousResult = saturationResults[saturationResults.length - 2];
      if (previousResult) {
        const throughputDrop = (previousResult.tokensPerSecond - tokensPerSecond) / previousResult.tokensPerSecond;
        const successDrop = previousResult.successRate - successRate;
        
        if (throughputDrop > 0.2 || successDrop > 10 || successRate < 80) {
          console.log(`  🌊 SATURATION DETECTED!`);
          console.log(`    Throughput drop: ${(throughputDrop * 100).toFixed(1)}%`);
          console.log(`    Success rate drop: ${successDrop.toFixed(1)}%`);
          saturated = true;
        }
      }
      
      // Brief pause between load tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Find peak performance before saturation
    const peakResult = saturationResults.reduce((best, current) => 
      current.tokensPerSecond > best.tokensPerSecond && current.successRate >= 90 ? current : best
    );
    
    console.log('\n🌊 SATURATION POINT RESULTS:');
    console.log('Load Level | Throughput | Success Rate | Memory | Failed Calls');
    console.log('-----------|------------|--------------|--------|-------------');
    saturationResults.forEach(r => {
      const marker = r === peakResult ? ' 🎯' : '   ';
      console.log(`${marker} ${r.tokenCount.toString().padStart(8)} | ${r.tokensPerSecond.toFixed(2).padStart(10)} | ${r.successRate.toFixed(1).padStart(11)}% | ${r.memoryUsage.toFixed(0).padStart(6)}MB | ${r.failedCalls.toString().padStart(11)}`);
    });
    
    console.log(`\n🎯 PEAK THROUGHPUT: ${peakResult.tokensPerSecond.toFixed(2)} tokens/second`);
    console.log(`Maximum load: ${peakResult.tokenCount} tokens`);
    console.log(`Success rate at peak: ${peakResult.successRate.toFixed(1)}%`);
    
    // Store saturation metrics
    this.performanceMetrics.saturation = peakResult;
    
    const passed = peakResult.tokensPerSecond >= 15 && peakResult.successRate >= 90;
    
    if (passed) {
      console.log('✅ SATURATION POINT: EXCELLENT CAPACITY');
      console.log(`System can sustain ${peakResult.tokensPerSecond.toFixed(1)} tokens/second at peak load`);
    } else {
      console.log('❌ SATURATION POINT: LIMITED CAPACITY');
      if (peakResult.tokensPerSecond < 15) console.log(`  - Peak throughput too low: ${peakResult.tokensPerSecond} tokens/s`);
      if (peakResult.successRate < 90) console.log(`  - Success rate too low at peak: ${peakResult.successRate}%`);
    }
    
    return { passed, metrics: this.performanceMetrics.saturation, allResults: saturationResults };
  }

  // SCENARIO 4: SUSTAINED THROUGHPUT (Endurance Test)
  async testSustainedThroughput() {
    console.log('\n⏱️ SCENARIO 4: SUSTAINED THROUGHPUT');
    console.log('Method: Maintain peak throughput for extended duration');
    console.log('Target: Validate system can sustain peak performance');
    console.log('Financial Impact: Sustained throughput = Reliable opportunity capture\n');

    // Use 80% of peak throughput for sustainability
    const peakThroughput = this.performanceMetrics.saturation?.tokensPerSecond || 20;
    const sustainedTarget = peakThroughput * 0.8;
    const testDurationMinutes = 2; // 2-minute endurance test
    
    console.log(`Peak throughput: ${peakThroughput.toFixed(2)} tokens/second`);
    console.log(`Sustained target: ${sustainedTarget.toFixed(2)} tokens/second`);
    console.log(`Test duration: ${testDurationMinutes} minutes\n`);

    const mockRpcConnection = {
      call: async (method, params) => {
        // Consistent performance for endurance test
        await new Promise(resolve => setTimeout(resolve, 40 + Math.random() * 20));
        
        if (method === 'getTokenLargestAccounts') {
          return {
            context: { slot: 123456789 },
            value: this.generateMockHolders(2)
          };
        }
        
        if (method === 'getTokenSupply') {
          return {
            context: { slot: 123456789 },
            value: { 
              amount: String(Math.floor(Math.random() * 10000000000)),
              decimals: 9
            }
          };
        }
        
        return null;
      }
    };

    const service = new TieredTokenFilterService();
    service.rpcManager = mockRpcConnection;

    const totalDurationMs = testDurationMinutes * 60 * 1000;
    const tokensToGenerate = Math.ceil(sustainedTarget * (totalDurationMs / 1000));
    const optimalConcurrency = this.performanceMetrics.concurrent?.concurrency || 25;
    
    console.log(`Generating ${tokensToGenerate} tokens for ${testDurationMinutes}-minute test`);
    console.log(`Using concurrency: ${optimalConcurrency}\n`);

    const tokens = this.generateTestTokens(tokensToGenerate, 'sustained');
    
    const startTime = Date.now();
    const intervalResults = [];
    let processedCount = 0;
    let errorCount = 0;
    
    // Process tokens continuously
    const promises = [];
    let tokenIndex = 0;
    
    // Start processing interval tracking
    const intervalMs = 30000; // 30-second intervals
    const intervalTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentThroughput = processedCount / (elapsed / 1000);
      
      intervalResults.push({
        timeElapsed: elapsed / 1000,
        tokensProcessed: processedCount,
        currentThroughput,
        errors: errorCount
      });
      
      console.log(`⏱️ ${(elapsed / 1000).toFixed(0)}s: ${processedCount} tokens (${currentThroughput.toFixed(2)} tokens/s, ${errorCount} errors)`);
      
      if (elapsed >= totalDurationMs) {
        clearInterval(intervalTimer);
      }
    }, intervalMs);
    
    // Process tokens with controlled timing
    while (tokenIndex < tokens.length && (Date.now() - startTime) < totalDurationMs) {
      const batchSize = Math.min(optimalConcurrency, tokens.length - tokenIndex);
      const batch = tokens.slice(tokenIndex, tokenIndex + batchSize);
      
      const batchPromises = batch.map(async (token) => {
        try {
          const result = await service.processToken(token);
          processedCount++;
          return result;
        } catch (error) {
          errorCount++;
          return { error: error.message };
        }
      });
      
      promises.push(...batchPromises);
      tokenIndex += batchSize;
      
      // Brief pause to control rate
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Wait for remaining tokens to complete
    await Promise.all(promises);
    clearInterval(intervalTimer);
    
    const totalTime = Date.now() - startTime;
    const actualThroughput = processedCount / (totalTime / 1000);
    const successRate = (processedCount / (processedCount + errorCount)) * 100;
    
    // Calculate throughput stability
    const throughputValues = intervalResults.map(r => r.currentThroughput).filter(t => t > 0);
    const avgThroughput = throughputValues.reduce((a, b) => a + b, 0) / throughputValues.length;
    const maxThroughput = Math.max(...throughputValues);
    const minThroughput = Math.min(...throughputValues);
    const throughputVariation = ((maxThroughput - minThroughput) / avgThroughput) * 100;
    
    console.log('\n⏱️ SUSTAINED THROUGHPUT RESULTS:');
    console.log(`Test duration: ${(totalTime / 1000).toFixed(1)} seconds`);
    console.log(`Tokens processed: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log(`Average throughput: ${avgThroughput.toFixed(2)} tokens/second`);
    console.log(`Actual throughput: ${actualThroughput.toFixed(2)} tokens/second`);
    console.log(`Throughput variation: ${throughputVariation.toFixed(1)}%`);
    console.log(`Target throughput: ${sustainedTarget.toFixed(2)} tokens/second`);
    
    // Store sustained metrics
    this.performanceMetrics.sustained = {
      targetThroughput: sustainedTarget,
      actualThroughput,
      avgThroughput,
      throughputVariation,
      successRate,
      testDurationSeconds: totalTime / 1000,
      tokensProcessed: processedCount,
      intervalResults
    };
    
    // Success criteria
    const throughputMet = avgThroughput >= sustainedTarget * 0.9; // Within 90% of target
    const stabilityGood = throughputVariation <= 30; // Less than 30% variation
    const reliabilityGood = successRate >= 95;
    
    const passed = throughputMet && stabilityGood && reliabilityGood;
    
    if (passed) {
      console.log('✅ SUSTAINED THROUGHPUT: EXCELLENT');
      console.log(`System maintains ${avgThroughput.toFixed(1)} tokens/second over ${testDurationMinutes} minutes`);
    } else {
      console.log('❌ SUSTAINED THROUGHPUT: INSUFFICIENT');
      if (!throughputMet) console.log(`  - Failed to meet target: ${avgThroughput.toFixed(2)} vs ${sustainedTarget.toFixed(2)} tokens/s`);
      if (!stabilityGood) console.log(`  - Unstable performance: ${throughputVariation.toFixed(1)}% variation`);
      if (!reliabilityGood) console.log(`  - Low reliability: ${successRate.toFixed(1)}% success rate`);
    }
    
    return { passed, metrics: this.performanceMetrics.sustained };
  }

  // COMPREHENSIVE THROUGHPUT ANALYSIS
  async runComprehensiveTest() {
    console.log('==================================================');
    console.log('RENAISSANCE TEST #23: THROUGHPUT LIMITS');
    console.log('Critical Capacity: Maximum sustainable processing rate');
    console.log('Financial Impact: Throughput limits = Direct opportunity loss');
    console.log('==================================================\n');

    const testResults = {
      baseline: null,
      concurrent: null,
      saturation: null,
      sustained: null,
      overallPassed: false
    };

    console.log('🚀 Starting comprehensive throughput testing...\n');
    
    // Run all throughput test scenarios
    testResults.baseline = await this.testBaselineThroughput();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    testResults.concurrent = await this.testConcurrentThroughput();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    testResults.saturation = await this.testSaturationPoint();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    testResults.sustained = await this.testSustainedThroughput();

    // Overall assessment
    const allPassed = testResults.baseline.passed && 
                      testResults.concurrent.passed && 
                      testResults.saturation.passed && 
                      testResults.sustained.passed;
    
    testResults.overallPassed = allPassed;

    // Final throughput analysis
    console.log('\n==================================================');
    console.log('THROUGHPUT LIMITS TEST RESULTS');
    console.log('==================================================');
    console.log(`📏 Baseline Throughput: ${testResults.baseline.passed ? '✅ PASSED' : '❌ FAILED'} (${this.performanceMetrics.baseline?.tokensPerSecond.toFixed(2)} tokens/s)`);
    console.log(`🔄 Concurrent Throughput: ${testResults.concurrent.passed ? '✅ PASSED' : '❌ FAILED'} (${this.performanceMetrics.concurrent?.tokensPerSecond.toFixed(2)} tokens/s)`);
    console.log(`🌊 Saturation Point: ${testResults.saturation.passed ? '✅ PASSED' : '❌ FAILED'} (${this.performanceMetrics.saturation?.tokensPerSecond.toFixed(2)} tokens/s)`);
    console.log(`⏱️ Sustained Throughput: ${testResults.sustained.passed ? '✅ PASSED' : '❌ FAILED'} (${this.performanceMetrics.sustained?.avgThroughput.toFixed(2)} tokens/s)`);
    
    // Bottleneck analysis
    console.log('\n🔍 BOTTLENECK ANALYSIS:');
    const baselineRate = this.performanceMetrics.baseline?.tokensPerSecond || 0;
    const concurrentRate = this.performanceMetrics.concurrent?.tokensPerSecond || 0;
    const saturationRate = this.performanceMetrics.saturation?.tokensPerSecond || 0;
    
    console.log(`Sequential processing: ${baselineRate.toFixed(2)} tokens/s`);
    console.log(`Parallel processing gain: ${((concurrentRate / baselineRate - 1) * 100).toFixed(1)}%`);
    console.log(`System saturation at: ${saturationRate.toFixed(2)} tokens/s`);
    console.log(`Optimal concurrency level: ${this.performanceMetrics.concurrent?.concurrency || 'Unknown'}`);
    
    if (allPassed) {
      console.log('\n🎯 THROUGHPUT LIMITS: PRODUCTION READY');
      console.log(`Maximum sustainable throughput: ${saturationRate.toFixed(2)} tokens/second`);
      console.log('System can capture opportunities at viral event speeds');
      console.log('Competitive advantage maintained during peak loads');
    } else {
      console.log('\n🚨 THROUGHPUT LIMITS: CAPACITY INSUFFICIENT');
      console.log('System cannot handle viral event loads = Miss opportunities');
      console.log('IMMEDIATE OPTIMIZATION REQUIRED for throughput scaling');
    }
    
    console.log('\n💰 FINANCIAL IMPACT ASSESSMENT:');
    if (allPassed) {
      console.log('✅ System can process viral token volumes without missing opportunities');
      console.log(`✅ Peak capacity: ${saturationRate.toFixed(0)} tokens/minute during viral events`);
      console.log('✅ Sustained performance validated for extended viral periods');
      console.log('✅ Competitive advantage: Process 10x+ more tokens than retail');
    } else {
      console.log('❌ Throughput limitations = Direct opportunity loss');
      console.log('❌ Cannot capture full viral event potential');
      console.log('❌ Lost competitive advantage during peak profit windows');
      console.log('❌ Revenue impact: Critical - System cannot scale to demand');
    }
    
    return testResults;
  }

  // Helper Methods
  generateTestTokens(count, testType) {
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
      const tokenAddr = baseAddr.slice(0, -4) + String(i).padStart(4, '0');
      
      const token = {
        tokenMint: tokenAddr,
        address: tokenAddr, // Both fields for compatibility
        createdAt: Date.now() - Math.random() * 300000, // Random age within last 5 minutes
        lpValueUSD: Math.random() * (testType === 'saturation' ? 2000 : 5000),
        uniqueWallets: Math.floor(Math.random() * 30) + 5,
        buyToSellRatio: Math.random() * 10 + 1,
        avgTransactionSpread: Math.random() * 120 + 30,
        transactionSizeVariation: Math.random() * 0.8 + 0.2,
        volume24h: Math.random() * 50000,
        dex: Math.random() > 0.6 ? 'raydium' : 'pump.fun'
      };
      
      tokens.push(token);
    }
    
    return tokens;
  }

  generateMockHolders(count) {
    const holders = [];
    for (let i = 0; i < count; i++) {
      holders.push({
        address: `Holder${i}${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        amount: String(Math.floor(Math.random() * 1000000000))
      });
    }
    return holders;
  }
}

// Execute the comprehensive throughput limits test
const test = new Test23ThroughputLimits();
test.runComprehensiveTest().catch(console.error);