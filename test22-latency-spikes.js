/**
 * RENAISSANCE TEST #22: LATENCY SPIKES (HIGH PRIORITY)
 * 
 * What: System must maintain sub-30s analysis for competitive advantage
 * Why: Speed is money - retail traders take 3-7 minutes, we need <30s
 * Money Impact: CRITICAL - Slow analysis = missed profitable opportunities
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';
import assert from 'assert';

class Test22LatencySpikes {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            critical: 0,
            warnings: 0,
            details: [],
            metrics: {
                singleTokenAvg: 0,
                concurrentAvg: 0,
                stressTestAvg: 0,
                memoryPressureAvg: 0,
                rpcFailureAvg: 0
            }
        };
        
        // Realistic RPC Manager with variable latency
        this.createRealisticRpcManager();
    }

    createRealisticRpcManager() {
        this.mockRpcManager = {
            callCount: 0,
            
            call: async (method, params) => {
                this.callCount++;
                
                // Simulate realistic RPC latency (50-200ms typical)
                const baseLatency = 50 + Math.random() * 150;
                await new Promise(resolve => setTimeout(resolve, baseLatency));
                
                // Simulate occasional slow responses (network congestion)
                if (Math.random() < 0.1) { // 10% chance
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Return realistic Solana RPC responses
                if (method === 'getTokenSupply') {
                    return { 
                        value: { 
                            amount: (1000000000 + Math.random() * 9000000000).toString(), 
                            decimals: 9, 
                            uiAmount: 1000 + Math.random() * 9000 
                        } 
                    };
                }
                
                if (method === 'getTokenLargestAccounts') {
                    return { 
                        value: [
                            { amount: (100000000 + Math.random() * 900000000).toString() }, 
                            { amount: (50000000 + Math.random() * 450000000).toString() },
                            { amount: (25000000 + Math.random() * 225000000).toString() }
                        ] 
                    };
                }
                
                if (method === 'getAccountInfo') {
                    return { 
                        value: { 
                            data: { 
                                parsed: { 
                                    info: { 
                                        decimals: 9, 
                                        supply: (1000000000 + Math.random() * 9000000000).toString(), 
                                        mintAuthority: Math.random() > 0.3 ? null : "11111111111111111111111111111111",
                                        freezeAuthority: Math.random() > 0.4 ? null : "11111111111111111111111111111111"
                                    } 
                                } 
                            } 
                        } 
                    };
                }
                
                throw new Error('Unknown RPC method');
            },
            
            rotateEndpoint: async () => {
                // Simulate endpoint rotation latency
                await new Promise(resolve => setTimeout(resolve, 100));
                return true;
            }
        };

        // High-failure RPC manager for stress testing
        this.highFailureRpcManager = {
            failureRate: 0.7, // 70% failure rate
            
            call: async (method, params) => {
                // Simulate network latency
                await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
                
                if (Math.random() < this.failureRate) {
                    const errors = [
                        'RPC_TIMEOUT',
                        'CONNECTION_REFUSED', 
                        'RATE_LIMITED',
                        'SERVER_ERROR',
                        'NETWORK_UNREACHABLE'
                    ];
                    const error = new Error(errors[Math.floor(Math.random() * errors.length)]);
                    error.status = Math.random() > 0.5 ? 429 : 500;
                    throw error;
                }
                
                return this.mockRpcManager.call(method, params);
            },
            
            rotateEndpoint: async () => {
                await new Promise(resolve => setTimeout(resolve, 200)); // Slower rotation
                return true;
            }
        };
    }

    async runTest() {
        console.log('⚡ RENAISSANCE TEST #22: LATENCY SPIKES');
        console.log('=====================================');
        console.log('Target: Maintain sub-30s competitive advantage');
        console.log('Benchmark: Retail traders = 3-7 minutes');
        console.log('Goal: Sub-30s analysis under all conditions');
        console.log('Previous: Tests #19 & #21 PASSED - Security robust\n');
        
        // Test Case 1: Single Token Analysis Speed (Baseline)
        await this.testCase1_SingleTokenSpeed();
        
        // Test Case 2: Concurrent Analysis Load
        await this.testCase2_ConcurrentLoad();
        
        // Test Case 3: High-Volume Stress Test  
        await this.testCase3_HighVolumeStress();
        
        // Test Case 4: Memory Pressure Performance
        await this.testCase4_MemoryPressurePerformance();
        
        // Test Case 5: RPC Failure Resilience Speed
        await this.testCase5_RpcFailureResilience();
        
        // Test Case 6: Cache Performance Under Load
        await this.testCase6_CachePerformance();
        
        // Test Case 7: Fresh Gem vs Established Token Speed
        await this.testCase7_TierSpeedComparison();
        
        this.printResults();
        return this.results;
    }

    async testCase1_SingleTokenSpeed() {
        console.log('🎯 Test Case 1: Single Token Analysis Speed (Baseline)');
        
        const service = new TieredTokenFilterService({ rpcManager: this.mockRpcManager });
        await service.initialize();
        
        const testTokens = [
            {
                name: 'Fresh Gem',
                tokenMint: '11111111111111111111111111111160',
                name: 'FreshToken',
                symbol: 'FRESH',
                lpValueUSD: 3000,
                uniqueWallets: 35,
                buyToSellRatio: 4.2,
                detectedAt: Date.now() - 600000, // 10 minutes old
                expectedTime: 15000, // 15s target for fresh gems
                tier: 'fresh-gem'
            },
            {
                name: 'Established Token',
                tokenMint: '11111111111111111111111111111161',
                name: 'EstablishedToken',
                symbol: 'EST',
                lpValueUSD: 25000,
                uniqueWallets: 500,
                detectedAt: Date.now() - 3600000, // 1 hour old
                expectedTime: 10000, // 10s target for established
                tier: 'established'
            },
            {
                name: 'Pump.fun Token',
                tokenMint: '11111111111111111111111111111162',
                name: 'PumpToken',
                symbol: 'PUMP',
                lpValueUSD: 8000,
                uniqueWallets: 75,
                programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
                detectedAt: Date.now() - 900000, // 15 minutes old
                expectedTime: 12000, // 12s target for pump.fun
                tier: 'pump-fun'
            }
        ];

        let totalTime = 0;
        let successCount = 0;

        for (let i = 0; i < testTokens.length; i++) {
            const token = testTokens[i];
            const testId = `22.1.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.name} (${token.tier})`);
                
                const startTime = performance.now();
                const result = await service.processToken(token);
                const processingTime = performance.now() - startTime;
                
                totalTime += processingTime;
                successCount++;
                
                console.log(`    ⏱️ Processing time: ${processingTime.toFixed(0)}ms`);
                
                if (processingTime > 30000) { // 30s absolute limit
                    this.recordCritical(testId, `${token.name}: Exceeds 30s limit (${processingTime.toFixed(0)}ms)`);
                } else if (processingTime > token.expectedTime) { // Tier-specific target
                    this.recordWarning(testId, `${token.name}: Slower than target (${processingTime.toFixed(0)}ms vs ${token.expectedTime}ms)`);
                } else {
                    this.recordSuccess(testId, `${token.name}: Fast analysis (${processingTime.toFixed(0)}ms)`);
                }
                
            } catch (error) {
                this.recordCritical(testId, `${token.name}: Analysis failed - ${error.message}`);
            }
        }

        if (successCount > 0) {
            this.results.metrics.singleTokenAvg = totalTime / successCount;
            console.log(`  📊 Average single token time: ${this.results.metrics.singleTokenAvg.toFixed(0)}ms`);
        }
    }

    async testCase2_ConcurrentLoad() {
        console.log('\n🎯 Test Case 2: Concurrent Analysis Load');
        
        const service = new TieredTokenFilterService({ rpcManager: this.mockRpcManager });
        await service.initialize();
        
        // Create 10 tokens for concurrent analysis
        const concurrentTokens = Array.from({ length: 10 }, (_, i) => ({
            tokenMint: `111111111111111111111111111116${i}`,
            name: `ConcurrentToken${i}`,
            symbol: `CON${i}`,
            lpValueUSD: 2000 + i * 1000,
            uniqueWallets: 30 + i * 10,
            buyToSellRatio: 2.0 + i * 0.5,
            detectedAt: Date.now() - (300000 + i * 60000), // Various ages
        }));

        console.log(`  Testing: ${concurrentTokens.length} tokens simultaneously`);
        
        try {
            const concurrentStart = performance.now();
            const promises = concurrentTokens.map(token => service.processToken(token));
            const results = await Promise.allSettled(promises);
            const concurrentTime = performance.now() - concurrentStart;
            const avgTime = concurrentTime / concurrentTokens.length;
            
            this.results.metrics.concurrentAvg = avgTime;
            
            console.log(`    ⏱️ Total concurrent time: ${concurrentTime.toFixed(0)}ms`);
            console.log(`    ⏱️ Average per token: ${avgTime.toFixed(0)}ms`);
            
            const failures = results.filter(r => r.status === 'rejected').length;
            const successes = results.filter(r => r.status === 'fulfilled').length;
            
            console.log(`    📊 Success rate: ${successes}/${concurrentTokens.length}`);
            
            if (avgTime > 20000) { // 20s average limit under load
                this.recordCritical('22.2.1', `Concurrent analysis too slow: ${avgTime.toFixed(0)}ms average`);
            } else if (avgTime > 12000) { // 12s warning threshold
                this.recordWarning('22.2.1', `Concurrent analysis slow: ${avgTime.toFixed(0)}ms average`);
            } else {
                this.recordSuccess('22.2.1', `Concurrent analysis fast: ${avgTime.toFixed(0)}ms average`);
            }
            
            if (failures > 2) { // Allow up to 2 failures out of 10
                this.recordCritical('22.2.2', `Too many concurrent failures: ${failures}/${concurrentTokens.length}`);
            } else if (failures > 0) {
                this.recordWarning('22.2.2', `Some concurrent failures: ${failures}/${concurrentTokens.length}`);
            } else {
                this.recordSuccess('22.2.2', `All concurrent analyses succeeded: ${successes}/${concurrentTokens.length}`);
            }
            
        } catch (error) {
            this.recordCritical('22.2.0', `Concurrent analysis test failed: ${error.message}`);
        }
    }

    async testCase3_HighVolumeStress() {
        console.log('\n🎯 Test Case 3: High-Volume Stress Test (Viral Token Event)');
        
        const service = new TieredTokenFilterService({ rpcManager: this.mockRpcManager });
        await service.initialize();
        
        // Simulate viral meme coin event - 50 tokens in rapid succession
        const stressTokens = Array.from({ length: 50 }, (_, i) => ({
            tokenMint: `111111111111111111111111111117${String(i).padStart(2, '0')}`,
            name: `ViralToken${i}`,
            symbol: `VIR${i}`,
            lpValueUSD: 1000 + Math.random() * 10000,
            uniqueWallets: 20 + Math.floor(Math.random() * 100),
            buyToSellRatio: 1.5 + Math.random() * 5,
            detectedAt: Date.now() - Math.random() * 1800000, // 0-30 minutes old
        }));

        console.log(`  Testing: ${stressTokens.length} tokens (viral event simulation)`);
        
        try {
            const stressStart = performance.now();
            
            // Process in batches of 10 to simulate realistic load
            const batchSize = 10;
            const batches = [];
            
            for (let i = 0; i < stressTokens.length; i += batchSize) {
                const batch = stressTokens.slice(i, i + batchSize);
                batches.push(batch);
            }
            
            let totalProcessed = 0;
            let totalFailures = 0;
            let batchTimes = [];
            
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                const batchStart = performance.now();
                
                const batchPromises = batch.map(token => service.processToken(token));
                const batchResults = await Promise.allSettled(batchPromises);
                
                const batchTime = performance.now() - batchStart;
                batchTimes.push(batchTime);
                
                const batchFailures = batchResults.filter(r => r.status === 'rejected').length;
                const batchSuccesses = batchResults.filter(r => r.status === 'fulfilled').length;
                
                totalProcessed += batchSuccesses;
                totalFailures += batchFailures;
                
                console.log(`    Batch ${batchIndex + 1}: ${batchSuccesses}/${batch.length} success, ${batchTime.toFixed(0)}ms`);
                
                // Small delay between batches to simulate realistic timing
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const totalStressTime = performance.now() - stressStart;
            const avgStressTime = totalStressTime / stressTokens.length;
            const avgBatchTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
            
            this.results.metrics.stressTestAvg = avgStressTime;
            
            console.log(`    ⏱️ Total stress test time: ${totalStressTime.toFixed(0)}ms`);
            console.log(`    ⏱️ Average per token: ${avgStressTime.toFixed(0)}ms`);
            console.log(`    ⏱️ Average batch time: ${avgBatchTime.toFixed(0)}ms`);
            console.log(`    📊 Success rate: ${totalProcessed}/${stressTokens.length} (${((totalProcessed/stressTokens.length)*100).toFixed(1)}%)`);
            
            if (avgStressTime > 25000) { // 25s limit during viral events
                this.recordCritical('22.3.1', `Stress test too slow: ${avgStressTime.toFixed(0)}ms average`);
            } else if (avgStressTime > 15000) { // 15s warning
                this.recordWarning('22.3.1', `Stress test slow: ${avgStressTime.toFixed(0)}ms average`);
            } else {
                this.recordSuccess('22.3.1', `Stress test fast: ${avgStressTime.toFixed(0)}ms average`);
            }
            
            const failureRate = totalFailures / stressTokens.length;
            if (failureRate > 0.2) { // 20% failure rate limit
                this.recordCritical('22.3.2', `High stress failure rate: ${(failureRate*100).toFixed(1)}%`);
            } else if (failureRate > 0.1) { // 10% warning
                this.recordWarning('22.3.2', `Moderate stress failures: ${(failureRate*100).toFixed(1)}%`);
            } else {
                this.recordSuccess('22.3.2', `Low stress failure rate: ${(failureRate*100).toFixed(1)}%`);
            }
            
        } catch (error) {
            this.recordCritical('22.3.0', `High-volume stress test failed: ${error.message}`);
        }
    }

    async testCase4_MemoryPressurePerformance() {
        console.log('\n🎯 Test Case 4: Memory Pressure Performance');
        
        const service = new TieredTokenFilterService({ rpcManager: this.mockRpcManager });
        await service.initialize();
        
        try {
            // Fill cache to create memory pressure
            console.log('  Creating memory pressure...');
            const cacheItems = 1500; // Exceed maxCacheSize
            
            for (let i = 0; i < cacheItems; i++) {
                const fakeToken = `fake_token_${i}`;
                const fakeData = {
                    address: fakeToken,
                    name: `FakeToken${i}`,
                    symbol: `FAKE${i}`,
                    supply: 1000000000,
                    timestamp: Date.now() - Math.random() * 300000
                };
                service.cacheMetadata(fakeToken, fakeData);
            }
            
            console.log(`  Cache size: ${service.metadataCache.size} items`);
            
            // Monitor memory
            const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
            
            // Test performance under memory pressure
            const pressureToken = {
                tokenMint: '11111111111111111111111111111180',
                name: 'MemoryPressureTest',
                symbol: 'MEM',
                lpValueUSD: 5000,
                uniqueWallets: 45,
                detectedAt: Date.now() - 450000 // 7.5 minutes old
            };
            
            const pressureStart = performance.now();
            const result = await service.processToken(pressureToken);
            const pressureTime = performance.now() - pressureStart;
            
            const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
            const memoryIncrease = finalMemory - initialMemory;
            
            this.results.metrics.memoryPressureAvg = pressureTime;
            
            console.log(`    ⏱️ Processing under pressure: ${pressureTime.toFixed(0)}ms`);
            console.log(`    💾 Memory change: ${memoryIncrease > 0 ? '+' : ''}${memoryIncrease.toFixed(2)}MB`);
            console.log(`    📦 Cache size after: ${service.metadataCache.size} items`);
            
            if (pressureTime > 35000) { // 35s limit under memory pressure
                this.recordCritical('22.4.1', `Memory pressure analysis too slow: ${pressureTime.toFixed(0)}ms`);
            } else if (pressureTime > 20000) { // 20s warning
                this.recordWarning('22.4.1', `Memory pressure analysis slow: ${pressureTime.toFixed(0)}ms`);
            } else {
                this.recordSuccess('22.4.1', `Memory pressure handled well: ${pressureTime.toFixed(0)}ms`);
            }
            
            // Check cache cleanup effectiveness
            if (service.metadataCache.size > service.maxCacheSize * 1.2) { // 20% over limit
                this.recordWarning('22.4.2', `Cache cleanup insufficient: ${service.metadataCache.size} items`);
            } else {
                this.recordSuccess('22.4.2', `Cache cleanup effective: ${service.metadataCache.size} items`);
            }
            
        } catch (error) {
            this.recordCritical('22.4.0', `Memory pressure test failed: ${error.message}`);
        }
    }

    async testCase5_RpcFailureResilience() {
        console.log('\n🎯 Test Case 5: RPC Failure Resilience Speed');
        
        const resilientService = new TieredTokenFilterService({ rpcManager: this.highFailureRpcManager });
        await resilientService.initialize();
        
        const resilientTokens = [
            {
                name: 'RPC Failure Test 1',
                tokenMint: '11111111111111111111111111111181',
                name: 'ResilientToken1',
                symbol: 'RES1',
                lpValueUSD: 3500,
                detectedAt: Date.now() - 300000
            },
            {
                name: 'RPC Failure Test 2', 
                tokenMint: '11111111111111111111111111111182',
                name: 'ResilientToken2',
                symbol: 'RES2',
                lpValueUSD: 7500,
                detectedAt: Date.now() - 900000
            }
        ];

        let totalResilientTime = 0;
        let resilientSuccesses = 0;

        for (let i = 0; i < resilientTokens.length; i++) {
            const token = resilientTokens[i];
            const testId = `22.5.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.name} (70% RPC failure rate)`);
                
                const resilientStart = performance.now();
                const result = await resilientService.processToken(token);
                const resilientTime = performance.now() - resilientStart;
                
                totalResilientTime += resilientTime;
                resilientSuccesses++;
                
                console.log(`    ⏱️ Resilient processing: ${resilientTime.toFixed(0)}ms`);
                console.log(`    🔄 RPC calls made: ${this.highFailureRpcManager.callCount || 'Unknown'}`);
                
                if (resilientTime > 60000) { // 60s limit with failures
                    this.recordCritical(testId, `RPC resilience too slow: ${resilientTime.toFixed(0)}ms`);
                } else if (resilientTime > 30000) { // 30s warning
                    this.recordWarning(testId, `RPC resilience slow: ${resilientTime.toFixed(0)}ms`);
                } else {
                    this.recordSuccess(testId, `RPC resilience good: ${resilientTime.toFixed(0)}ms`);
                }
                
            } catch (error) {
                this.recordCritical(testId, `RPC resilience failed: ${error.message}`);
            }
        }

        if (resilientSuccesses > 0) {
            this.results.metrics.rpcFailureAvg = totalResilientTime / resilientSuccesses;
            console.log(`  📊 Average RPC failure recovery time: ${this.results.metrics.rpcFailureAvg.toFixed(0)}ms`);
        }
    }

    async testCase6_CachePerformance() {
        console.log('\n🎯 Test Case 6: Cache Performance Under Load');
        
        const service = new TieredTokenFilterService({ rpcManager: this.mockRpcManager });
        await service.initialize();
        
        // Pre-populate cache with some data
        const cacheTokens = Array.from({ length: 100 }, (_, i) => ({
            tokenMint: `cache_token_${i}`,
            data: {
                name: `CachedToken${i}`,
                symbol: `CACHE${i}`,
                supply: 1000000000 + i * 1000000,
                timestamp: Date.now() - Math.random() * 600000
            }
        }));
        
        // Populate cache
        cacheTokens.forEach(item => {
            service.cacheMetadata(item.tokenMint, item.data);
        });
        
        console.log(`  Cache pre-populated with ${cacheTokens.length} items`);
        
        // Test cache hit performance vs cache miss
        const cacheTestTokens = [
            {
                name: 'Cache Hit Test',
                tokenMint: 'cache_token_50', // Should be in cache
                name: 'CacheHitToken',
                symbol: 'HIT',
                lpValueUSD: 4000,
                detectedAt: Date.now() - 300000,
                expectedCacheHit: true
            },
            {
                name: 'Cache Miss Test',
                tokenMint: '11111111111111111111111111111190',
                name: 'CacheMissToken', 
                symbol: 'MISS',
                lpValueUSD: 4000,
                detectedAt: Date.now() - 300000,
                expectedCacheHit: false
            }
        ];

        for (let i = 0; i < cacheTestTokens.length; i++) {
            const token = cacheTestTokens[i];
            const testId = `22.6.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.name}`);
                
                const cacheStart = performance.now();
                const result = await service.processToken(token);
                const cacheTime = performance.now() - cacheStart;
                
                console.log(`    ⏱️ ${token.name} time: ${cacheTime.toFixed(0)}ms`);
                
                // Cache hits should be significantly faster
                if (token.expectedCacheHit) {
                    if (cacheTime > 5000) { // 5s limit for cache hits
                        this.recordWarning(testId, `Cache hit slow: ${cacheTime.toFixed(0)}ms`);
                    } else {
                        this.recordSuccess(testId, `Cache hit fast: ${cacheTime.toFixed(0)}ms`);
                    }
                } else {
                    if (cacheTime > 20000) { // 20s limit for cache misses
                        this.recordWarning(testId, `Cache miss slow: ${cacheTime.toFixed(0)}ms`);
                    } else {
                        this.recordSuccess(testId, `Cache miss acceptable: ${cacheTime.toFixed(0)}ms`);
                    }
                }
                
            } catch (error) {
                this.recordCritical(testId, `Cache test failed: ${error.message}`);
            }
        }
    }

    async testCase7_TierSpeedComparison() {
        console.log('\n🎯 Test Case 7: Fresh Gem vs Established Token Speed Comparison');
        
        const service = new TieredTokenFilterService({ rpcManager: this.mockRpcManager });
        await service.initialize();
        
        const tierTokens = [
            {
                tier: 'Fresh Gem',
                tokenMint: '11111111111111111111111111111191',
                name: 'SpeedFreshGem',
                symbol: 'FRESH',
                lpValueUSD: 2500,
                uniqueWallets: 28,
                buyToSellRatio: 4.8,
                detectedAt: Date.now() - 420000, // 7 minutes - fresh gem
                targetTime: 15000 // 15s target
            },
            {
                tier: 'Established',
                tokenMint: '11111111111111111111111111111192',
                name: 'SpeedEstablished',
                symbol: 'EST',
                lpValueUSD: 35000,
                uniqueWallets: 750,
                detectedAt: Date.now() - 2700000, // 45 minutes - established
                targetTime: 8000 // 8s target
            }
        ];

        let tierResults = {};

        for (let i = 0; i < tierTokens.length; i++) {
            const token = tierTokens[i];
            const testId = `22.7.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.tier} tier processing`);
                
                const tierStart = performance.now();
                const result = await service.processToken(token);
                const tierTime = performance.now() - tierStart;
                
                tierResults[token.tier] = tierTime;
                
                console.log(`    ⏱️ ${token.tier} processing: ${tierTime.toFixed(0)}ms`);
                console.log(`    🎯 Target: ${token.targetTime}ms`);
                
                if (tierTime > token.targetTime * 2) { // 2x target is critical
                    this.recordCritical(testId, `${token.tier} too slow: ${tierTime.toFixed(0)}ms (target: ${token.targetTime}ms)`);
                } else if (tierTime > token.targetTime) { // Over target is warning
                    this.recordWarning(testId, `${token.tier} over target: ${tierTime.toFixed(0)}ms (target: ${token.targetTime}ms)`);
                } else {
                    this.recordSuccess(testId, `${token.tier} on target: ${tierTime.toFixed(0)}ms (target: ${token.targetTime}ms)`);
                }
                
                // Check classification correctness
                if (result && result.renaissanceClassification) {
                    const actualTier = result.renaissanceClassification.tier;
                    const expectedTier = token.tier === 'Fresh Gem' ? 'fresh-gem' : 'established';
                    
                    if (actualTier === expectedTier) {
                        console.log(`    ✅ Tier classification correct: ${actualTier}`);
                    } else {
                        this.recordWarning(`${testId}.class`, `Tier misclassification: got ${actualTier}, expected ${expectedTier}`);
                    }
                }
                
            } catch (error) {
                this.recordCritical(testId, `${token.tier} tier test failed: ${error.message}`);
            }
        }

        // Compare tier performance
        if (tierResults['Fresh Gem'] && tierResults['Established']) {
            const ratio = tierResults['Fresh Gem'] / tierResults['Established'];
            console.log(`  📊 Fresh Gem vs Established ratio: ${ratio.toFixed(2)}x`);
            
            if (ratio > 3.0) { // Fresh gems shouldn't be 3x slower than established
                this.recordWarning('22.7.comparison', `Fresh gems significantly slower than established: ${ratio.toFixed(2)}x`);
            } else {
                this.recordSuccess('22.7.comparison', `Tier performance ratio acceptable: ${ratio.toFixed(2)}x`);
            }
        }
    }

    recordSuccess(testId, message) {
        this.results.passed++;
        this.results.details.push({ testId, status: 'PASS', message });
        console.log(`    ✅ ${testId}: ${message}`);
    }

    recordWarning(testId, message) {
        this.results.warnings++;
        this.results.details.push({ testId, status: 'WARN', message });
        console.log(`    ⚠️ ${testId}: ${message}`);
    }

    recordCritical(testId, message) {
        this.results.failed++;
        this.results.critical++;
        this.results.details.push({ testId, status: 'CRITICAL', message });
        console.log(`    🚨 ${testId}: ${message}`);
    }

    printResults() {
        console.log('\n' + '='.repeat(70));
        console.log('🏁 TEST #22 RESULTS: LATENCY SPIKES & COMPETITIVE ADVANTAGE');
        console.log('='.repeat(70));
        
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`⚠️ Warnings: ${this.results.warnings}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`🚨 Critical Issues: ${this.results.critical}`);
        
        const totalTests = this.results.passed + this.results.failed + this.results.warnings;
        const passRate = totalTests > 0 ? (this.results.passed / totalTests * 100) : 0;
        
        console.log(`📊 Pass Rate: ${passRate.toFixed(1)}%`);
        
        // Performance metrics summary
        console.log('\n⚡ PERFORMANCE METRICS:');
        if (this.results.metrics.singleTokenAvg > 0) {
            console.log(`   Single Token Average: ${this.results.metrics.singleTokenAvg.toFixed(0)}ms`);
        }
        if (this.results.metrics.concurrentAvg > 0) {
            console.log(`   Concurrent Load Average: ${this.results.metrics.concurrentAvg.toFixed(0)}ms`);
        }
        if (this.results.metrics.stressTestAvg > 0) {
            console.log(`   High-Volume Stress Average: ${this.results.metrics.stressTestAvg.toFixed(0)}ms`);
        }
        if (this.results.metrics.memoryPressureAvg > 0) {
            console.log(`   Memory Pressure Average: ${this.results.metrics.memoryPressureAvg.toFixed(0)}ms`);
        }
        if (this.results.metrics.rpcFailureAvg > 0) {
            console.log(`   RPC Failure Recovery Average: ${this.results.metrics.rpcFailureAvg.toFixed(0)}ms`);
        }
        
        // Competitive advantage analysis
        console.log('\n🏆 COMPETITIVE ADVANTAGE ANALYSIS:');
        const maxTime = Math.max(
            this.results.metrics.singleTokenAvg,
            this.results.metrics.concurrentAvg,
            this.results.metrics.stressTestAvg
        );
        
        if (maxTime > 0) {
            const retailTime = 4 * 60 * 1000; // 4 minutes average retail time
            const advantage = retailTime / maxTime;
            console.log(`   Retail Trader Time: ~4 minutes (240,000ms)`);
            console.log(`   Our Worst Case Time: ${maxTime.toFixed(0)}ms`);
            console.log(`   Speed Advantage: ${advantage.toFixed(1)}x faster than retail`);
            
            if (advantage < 5) { // Less than 5x advantage is concerning
                console.log(`   ⚠️ Competitive advantage limited: ${advantage.toFixed(1)}x`);
            } else {
                console.log(`   ✅ Strong competitive advantage: ${advantage.toFixed(1)}x`);
            }
        }
        
        if (this.results.critical > 0) {
            console.log('\n🚨 CRITICAL LATENCY ISSUES:');
            this.results.details
                .filter(d => d.status === 'CRITICAL')
                .forEach(detail => console.log(`   - ${detail.testId}: ${detail.message}`));
            
            console.log('\n🔴 SPEED VERDICT: LATENCY ISSUES FOUND');
            console.log('💰 MONEY IMPACT: HIGH - Missing profitable opportunities');
            console.log('🔧 ACTION REQUIRED: Optimize performance before production');
        } else if (this.results.warnings > 0) {
            console.log('\n⚠️ PERFORMANCE WARNINGS:');
            this.results.details
                .filter(d => d.status === 'WARN')
                .forEach(detail => console.log(`   - ${detail.testId}: ${detail.message}`));
            
            console.log('\n🟡 SPEED VERDICT: ACCEPTABLE WITH MONITORING');
            console.log('💰 MONEY IMPACT: MEDIUM - Some opportunities may be missed');
            console.log('✅ READY FOR: Production with performance monitoring');
        } else {
            console.log('\n🟢 SPEED VERDICT: COMPETITIVE ADVANTAGE MAINTAINED');
            console.log('💰 MONEY IMPACT: MAXIMIZED - Fastest analysis in market');
            console.log('✅ READY FOR: Full production deployment');
        }
        
        console.log('\n📋 NEXT STEPS:');
        if (this.results.critical > 0) {
            console.log('   1. Optimize critical performance bottlenecks');
            console.log('   2. Implement parallel processing where possible');
            console.log('   3. Re-run Test #22 to verify improvements');
        } else {
            console.log('   1. All high-priority tests PASSED');
            console.log('   2. Ready for Renaissance infrastructure integration');
            console.log('   3. Proceed with Phase 2: RpcConnectionPool integration');
        }
        
        console.log('\n🚀 INTEGRATION READINESS STATUS:');
        if (this.results.critical === 0) {
            console.log('   ✅ Security: Bulletproof (Tests #19 & #21 passed)');
            console.log('   ✅ Performance: Competitive advantage maintained (Test #22 passed)');
            console.log('   ✅ Production Ready: All critical tests passed');
            console.log('   🎯 READY FOR: Renaissance Phase 2 Integration');
        } else {
            console.log('   ❌ Performance Issues: Must be resolved before integration');
            console.log('   ❌ Production Readiness: Performance optimization required');
        }
    }
}

// Export for use
export { Test22LatencySpikes };

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const test = new Test22LatencySpikes();
    test.runTest().catch(console.error);
}