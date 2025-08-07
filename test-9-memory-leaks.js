/**
 * TEST #9: Memory Leaks Under Load - 24/7 Operation Simulation
 * Renaissance Production Test for TieredTokenFilterService
 * 
 * CRITICAL: Tests memory accumulation during continuous trading operations
 * FOCUS: Prevent system crashes during profitable 24/7 periods
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

// Mock RPC Manager with configurable response patterns
class MockRpcManager {
    constructor(responsePattern = 'normal') {
        this.responsePattern = responsePattern;
        this.callCount = 0;
        this.rotationCount = 0;
        this.responseCache = new Map();
    }

    async call(method, params) {
        this.callCount++;
        
        // Simulate various RPC response patterns
        switch (this.responsePattern) {
            case 'high_volume':
                // Fast responses for high-volume testing
                return this.getMockResponse(method, params);
                
            case 'variable_latency':
                // Add random delays (10-500ms)
                await new Promise(resolve => 
                    setTimeout(resolve, 10 + Math.random() * 490)
                );
                return this.getMockResponse(method, params);
                
            case 'occasional_failures':
                // 5% failure rate
                if (Math.random() < 0.05) {
                    throw new Error('OCCASIONAL_RPC_FAILURE');
                }
                return this.getMockResponse(method, params);
                
            default:
                return this.getMockResponse(method, params);
        }
    }

    async rotateEndpoint() {
        this.rotationCount++;
    }

    getMockResponse(method, params) {
        const tokenMint = params?.[0] || 'defaultToken';
        const cacheKey = `${method}-${tokenMint}`;
        
        // Use cache occasionally to test cache behavior
        if (this.responseCache.has(cacheKey) && Math.random() < 0.1) {
            return this.responseCache.get(cacheKey);
        }
        
        let response;
        switch (method) {
            case 'getTokenSupply':
                response = {
                    value: {
                        amount: (Math.floor(Math.random() * 1000000000) + 100000000).toString(),
                        decimals: 9,
                        uiAmount: Math.floor(Math.random() * 1000) + 100
                    }
                };
                break;
                
            case 'getTokenLargestAccounts':
                const numHolders = Math.floor(Math.random() * 10) + 5;
                const holders = [];
                for (let i = 0; i < numHolders; i++) {
                    holders.push({
                        amount: (Math.floor(Math.random() * 100000000) + 1000000).toString(),
                        address: `holder${i}_${tokenMint.substring(0, 8)}`
                    });
                }
                response = { value: holders };
                break;
                
            case 'getAccountInfo':
                response = {
                    value: {
                        data: {
                            parsed: {
                                info: {
                                    decimals: 9,
                                    supply: (Math.floor(Math.random() * 1000000000) + 100000000).toString(),
                                    mintAuthority: Math.random() < 0.3 ? 'authority123' : null,
                                    freezeAuthority: Math.random() < 0.2 ? 'freeze123' : null,
                                    isInitialized: true
                                }
                            }
                        }
                    }
                };
                break;
                
            default:
                response = { value: null };
        }
        
        // Cache some responses
        if (Math.random() < 0.2) {
            this.responseCache.set(cacheKey, response);
        }
        
        return response;
    }
}

// Generate realistic token candidates with variety
function generateTokenCandidate(index, timeVariation = true) {
    const baseTokens = [
        'So11111111111111111111111111111111111111112', // Wrapped SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'mSoLzYCxHdYgdziU2hgzx9xyUixwCkn2sXMTqhgBvYr',  // mSOL
    ];
    
    // Create varied token mints
    const baseToken = baseTokens[index % baseTokens.length];
    const tokenMint = baseToken.substring(0, 32) + 
                     index.toString().padStart(12, '0');
    
    // Vary token properties realistically
    const ageMinutes = timeVariation ? 
        Math.floor(Math.random() * 1440) + 1 : // 1-1440 minutes (24 hours)
        Math.floor(Math.random() * 30) + 1;    // 1-30 minutes (fresh gems)
    
    const baseLP = Math.random() * 50000 + 1000; // $1K - $51K
    const volatility = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation
    
    return {
        tokenMint: tokenMint,
        lpValueUSD: Math.floor(baseLP * volatility),
        largestHolderPercentage: Math.floor(Math.random() * 40) + 10, // 10-50%
        uniqueWallets: Math.floor(Math.random() * 200) + 20, // 20-220
        buyToSellRatio: Math.random() * 10 + 0.5, // 0.5-10.5
        avgTransactionSpread: Math.floor(Math.random() * 10) + 1,
        transactionSizeVariation: Math.random() * 0.8 + 0.1,
        volume24h: Math.floor(Math.random() * 100000) + 10000,
        createdAt: Date.now() - (ageMinutes * 60 * 1000),
        hasMintAuthority: Math.random() < 0.4,
        hasFreezeAuthority: Math.random() < 0.3,
        dex: ['raydium', 'orca', 'jupiter'][Math.floor(Math.random() * 3)],
        
        // Add extra metadata that might accumulate
        metadata: {
            name: `Token_${index}`,
            symbol: `TKN${index}`,
            description: `Test token number ${index} with various properties`,
            tags: ['test', 'token', `batch_${Math.floor(index / 100)}`],
            socialLinks: {
                twitter: `https://twitter.com/token${index}`,
                telegram: `https://t.me/token${index}`,
                website: `https://token${index}.com`
            },
            // Potentially memory-heavy data
            transactionHistory: new Array(Math.floor(Math.random() * 50)).fill(null).map((_, i) => ({
                signature: `sig_${index}_${i}`,
                timestamp: Date.now() - (i * 60000),
                amount: Math.random() * 1000
            }))
        }
    };
}

// Memory monitoring utilities
function getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            arrayBuffers: usage.arrayBuffers,
            rss: usage.rss
        };
    } else {
        // Browser environment - estimate using performance
        return {
            heapUsed: performance.memory?.usedJSHeapSize || 0,
            heapTotal: performance.memory?.totalJSHeapSize || 0,
            external: 0,
            arrayBuffers: 0,
            rss: 0
        };
    }
}

function formatMemory(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function forceGarbageCollection() {
    if (typeof global !== 'undefined' && global.gc) {
        global.gc();
        return true;
    }
    return false;
}

// Test #9.1: High-Volume Token Processing
async function test9_1_HighVolumeProcessing() {
    console.log('\n🧪 TEST #9.1: High-Volume Token Processing');
    console.log('=' .repeat(50));
    
    const mockRpcManager = new MockRpcManager('high_volume');
    const service = new TieredTokenFilterService({ 
        rpcManager: mockRpcManager 
    });
    
    await service.initialize();
    
    const TOKEN_COUNT = 1000; // Process 1000 tokens
    const BATCH_SIZE = 100;   // Check memory every 100 tokens
    
    console.log(`📊 Processing ${TOKEN_COUNT} tokens in batches of ${BATCH_SIZE}...`);
    
    const startTime = performance.now();
    const startMemory = getMemoryUsage();
    const memorySnapshots = [];
    
    let totalApproved = 0;
    let totalRejected = 0;
    let errors = 0;
    
    for (let batch = 0; batch < TOKEN_COUNT / BATCH_SIZE; batch++) {
        const batchStart = performance.now();
        const batchTokens = [];
        
        // Generate batch of tokens
        for (let i = 0; i < BATCH_SIZE; i++) {
            const tokenIndex = batch * BATCH_SIZE + i;
            batchTokens.push(generateTokenCandidate(tokenIndex));
        }
        
        // Process batch
        const batchResults = await Promise.allSettled(
            batchTokens.map(token => service.processToken(token))
        );
        
        // Count results
        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                if (result.value.approved) {
                    totalApproved++;
                } else {
                    totalRejected++;
                }
            } else {
                errors++;
            }
        }
        
        const batchTime = performance.now() - batchStart;
        const currentMemory = getMemoryUsage();
        const heapGrowth = currentMemory.heapUsed - startMemory.heapUsed;
        
        memorySnapshots.push({
            batch: batch + 1,
            tokensProcessed: (batch + 1) * BATCH_SIZE,
            heapUsed: currentMemory.heapUsed,
            heapGrowth: heapGrowth,
            batchTime: batchTime,
            cacheSize: service.metadataCache?.size || 0,
            queueSize: service.validationQueue?.size || 0
        });
        
        console.log(`  Batch ${batch + 1}/${TOKEN_COUNT/BATCH_SIZE}: ${batchTime.toFixed(0)}ms, ` +
                   `heap: ${formatMemory(currentMemory.heapUsed)} (${heapGrowth >= 0 ? '+' : ''}${formatMemory(heapGrowth)}), ` +
                   `cache: ${service.metadataCache?.size || 0}`);
        
        // Force GC every 5 batches to test cleanup
        if (batch % 5 === 4) {
            const gcTriggered = forceGarbageCollection();
            if (gcTriggered) {
                console.log(`    🗑️ Forced GC after ${(batch + 1) * BATCH_SIZE} tokens`);
            }
        }
    }
    
    const totalTime = performance.now() - startTime;
    const finalMemory = getMemoryUsage();
    const totalHeapGrowth = finalMemory.heapUsed - startMemory.heapUsed;
    
    console.log('\n📈 HIGH-VOLUME PROCESSING RESULTS:');
    console.log(`  Total tokens processed: ${TOKEN_COUNT}`);
    console.log(`  Total processing time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  Average time per token: ${(totalTime / TOKEN_COUNT).toFixed(2)}ms`);
    console.log(`  Approved tokens: ${totalApproved}`);
    console.log(`  Rejected tokens: ${totalRejected}`);
    console.log(`  Processing errors: ${errors}`);
    console.log(`  Success rate: ${((totalApproved + totalRejected) / TOKEN_COUNT * 100).toFixed(1)}%`);
    console.log(`  Final heap usage: ${formatMemory(finalMemory.heapUsed)}`);
    console.log(`  Total heap growth: ${formatMemory(totalHeapGrowth)}`);
    console.log(`  Final cache size: ${service.metadataCache?.size || 0}`);
    console.log(`  Final queue size: ${service.validationQueue?.size || 0}`);
    console.log(`  RPC calls made: ${mockRpcManager.callCount}`);
    
    return {
        tokensProcessed: TOKEN_COUNT,
        totalTime,
        memoryGrowth: totalHeapGrowth,
        finalCacheSize: service.metadataCache?.size || 0,
        finalQueueSize: service.validationQueue?.size || 0,
        successRate: (totalApproved + totalRejected) / TOKEN_COUNT,
        memorySnapshots,
        rpcCalls: mockRpcManager.callCount
    };
}

// Test #9.2: Extended Operation Simulation (24-hour simulation)
async function test9_2_ExtendedOperation() {
    console.log('\n🧪 TEST #9.2: Extended Operation Simulation');
    console.log('=' .repeat(50));
    
    const mockRpcManager = new MockRpcManager('variable_latency');
    const service = new TieredTokenFilterService({ 
        rpcManager: mockRpcManager 
    });
    
    await service.initialize();
    
    // Simulate 24 hours of operation with varying load
    const SIMULATION_HOURS = 1; // Compressed to 1 hour for testing
    const TOKENS_PER_MINUTE = 5; // Realistic load
    const TOTAL_TOKENS = SIMULATION_HOURS * 60 * TOKENS_PER_MINUTE;
    const CHECK_INTERVAL = 50; // Check memory every 50 tokens
    
    console.log(`📊 Simulating ${SIMULATION_HOURS} hour(s) of operation...`);
    console.log(`   Expected tokens: ~${TOTAL_TOKENS}`);
    console.log(`   Target rate: ${TOKENS_PER_MINUTE} tokens/minute`);
    
    const startTime = performance.now();
    const startMemory = getMemoryUsage();
    const memoryProfile = [];
    
    let tokensProcessed = 0;
    let peakMemory = startMemory.heapUsed;
    let memoryLeakDetected = false;
    
    while (tokensProcessed < TOTAL_TOKENS) {
        // Process tokens in small batches to simulate realistic load
        const batchSize = Math.min(5, TOTAL_TOKENS - tokensProcessed);
        const batchPromises = [];
        
        for (let i = 0; i < batchSize; i++) {
            const token = generateTokenCandidate(tokensProcessed + i, true);
            batchPromises.push(service.processToken(token));
        }
        
        await Promise.allSettled(batchPromises);
        tokensProcessed += batchSize;
        
        // Memory check every CHECK_INTERVAL tokens
        if (tokensProcessed % CHECK_INTERVAL === 0) {
            const currentMemory = getMemoryUsage();
            const heapGrowth = currentMemory.heapUsed - startMemory.heapUsed;
            
            if (currentMemory.heapUsed > peakMemory) {
                peakMemory = currentMemory.heapUsed;
            }
            
            // Memory leak detection: sustained growth over 100MB
            if (heapGrowth > 100 * 1024 * 1024) { // 100MB
                memoryLeakDetected = true;
            }
            
            memoryProfile.push({
                tokensProcessed,
                timestamp: Date.now(),
                heapUsed: currentMemory.heapUsed,
                heapGrowth,
                cacheSize: service.metadataCache?.size || 0,
                queueSize: service.validationQueue?.size || 0
            });
            
            const progressPercent = (tokensProcessed / TOTAL_TOKENS * 100).toFixed(1);
            console.log(`  Progress: ${progressPercent}% (${tokensProcessed}/${TOTAL_TOKENS}) - ` +
                       `Heap: ${formatMemory(currentMemory.heapUsed)}, ` +
                       `Cache: ${service.metadataCache?.size || 0}`);
        }
        
        // Small delay to simulate realistic processing rhythm
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const totalTime = performance.now() - startTime;
    const finalMemory = getMemoryUsage();
    const totalGrowth = finalMemory.heapUsed - startMemory.heapUsed;
    
    console.log('\n📈 EXTENDED OPERATION RESULTS:');
    console.log(`  Simulation duration: ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
    console.log(`  Tokens processed: ${tokensProcessed}`);
    console.log(`  Processing rate: ${(tokensProcessed / (totalTime / 1000 / 60)).toFixed(1)} tokens/minute`);
    console.log(`  Initial heap: ${formatMemory(startMemory.heapUsed)}`);
    console.log(`  Final heap: ${formatMemory(finalMemory.heapUsed)}`);
    console.log(`  Peak heap: ${formatMemory(peakMemory)}`);
    console.log(`  Net growth: ${formatMemory(totalGrowth)}`);
    console.log(`  Memory leak detected: ${memoryLeakDetected ? '⚠️ YES' : '✅ NO'}`);
    console.log(`  Final cache size: ${service.metadataCache?.size || 0}`);
    console.log(`  Final queue size: ${service.validationQueue?.size || 0}`);
    
    return {
        tokensProcessed,
        simulationTimeMs: totalTime,
        memoryGrowth: totalGrowth,
        peakMemory: peakMemory - startMemory.heapUsed,
        memoryLeakDetected,
        finalCacheSize: service.metadataCache?.size || 0,
        memoryProfile,
        processingRate: tokensProcessed / (totalTime / 1000 / 60)
    };
}

// Test #9.3: Cache Behavior Under Stress
async function test9_3_CacheStress() {
    console.log('\n🧪 TEST #9.3: Cache Behavior Under Stress');
    console.log('=' .repeat(50));
    
    const mockRpcManager = new MockRpcManager('occasional_failures');
    const service = new TieredTokenFilterService({ 
        rpcManager: mockRpcManager 
    });
    
    await service.initialize();
    
    const CACHE_STRESS_TOKENS = 2000; // Exceed cache limits
    const MAX_CACHE_SIZE = 1000; // From service configuration
    
    console.log(`📊 Testing cache behavior with ${CACHE_STRESS_TOKENS} unique tokens...`);
    console.log(`   Max cache size: ${MAX_CACHE_SIZE}`);
    
    const startTime = performance.now();
    const startMemory = getMemoryUsage();
    
    let cacheHits = 0;
    let cacheMisses = 0;
    let maxCacheSize = 0;
    const cacheGrowthProfile = [];
    
    for (let i = 0; i < CACHE_STRESS_TOKENS; i++) {
        // Create unique tokens to force cache growth
        const token = generateTokenCandidate(i, false); // No time variation for cache testing
        
        try {
            const result = await service.processToken(token);
            
            const currentCacheSize = service.metadataCache?.size || 0;
            if (currentCacheSize > maxCacheSize) {
                maxCacheSize = currentCacheSize;
            }
            
            // Record cache growth every 100 tokens
            if (i % 100 === 0) {
                const currentMemory = getMemoryUsage();
                cacheGrowthProfile.push({
                    tokensProcessed: i,
                    cacheSize: currentCacheSize,
                    heapUsed: currentMemory.heapUsed,
                    heapGrowth: currentMemory.heapUsed - startMemory.heapUsed
                });
                
                console.log(`  Processed ${i} tokens - Cache size: ${currentCacheSize}, ` +
                           `Heap: ${formatMemory(currentMemory.heapUsed)}`);
            }
            
        } catch (error) {
            console.log(`  Error processing token ${i}: ${error.message}`);
        }
    }
    
    const totalTime = performance.now() - startTime;
    const finalMemory = getMemoryUsage();
    const finalCacheSize = service.metadataCache?.size || 0;
    
    console.log('\n📈 CACHE STRESS TEST RESULTS:');
    console.log(`  Tokens processed: ${CACHE_STRESS_TOKENS}`);
    console.log(`  Processing time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  Max cache size reached: ${maxCacheSize}`);
    console.log(`  Final cache size: ${finalCacheSize}`);
    console.log(`  Cache size controlled: ${maxCacheSize <= MAX_CACHE_SIZE * 1.2 ? '✅ YES' : '❌ NO'}`);
    console.log(`  Memory growth: ${formatMemory(finalMemory.heapUsed - startMemory.heapUsed)}`);
    console.log(`  RPC calls made: ${mockRpcManager.callCount}`);
    
    return {
        tokensProcessed: CACHE_STRESS_TOKENS,
        maxCacheSize,
        finalCacheSize,
        cacheControlled: maxCacheSize <= MAX_CACHE_SIZE * 1.2,
        memoryGrowth: finalMemory.heapUsed - startMemory.heapUsed,
        cacheGrowthProfile,
        rpcCalls: mockRpcManager.callCount
    };
}

// Execute all Test #9 scenarios
async function executeTest9() {
    console.log('\n🏁 EXECUTING TEST #9: MEMORY LEAKS UNDER LOAD');
    console.log('=' .repeat(60));
    console.log('Renaissance Production Test - Focus: 24/7 memory stability');
    
    try {
        // Force GC at start if available
        const initialGC = forceGarbageCollection();
        if (initialGC) {
            console.log('🗑️ Forced initial garbage collection');
        }
        
        // Run all test scenarios
        const highVolumeResults = await test9_1_HighVolumeProcessing();
        const extendedOpResults = await test9_2_ExtendedOperation();
        const cacheStressResults = await test9_3_CacheStress();
        
        // Final comprehensive analysis
        console.log('\n🎯 COMPREHENSIVE TEST #9 RESULTS');
        console.log('=' .repeat(60));
        
        const totalTokensProcessed = highVolumeResults.tokensProcessed + 
                                   extendedOpResults.tokensProcessed + 
                                   cacheStressResults.tokensProcessed;
        
        const totalMemoryGrowth = highVolumeResults.memoryGrowth + 
                                extendedOpResults.memoryGrowth + 
                                cacheStressResults.memoryGrowth;
        
        console.log('\n🚨 CRITICAL FINDINGS:');
        
        // Memory leak detection
        if (extendedOpResults.memoryLeakDetected) {
            console.log('  ❌ CRITICAL: Memory leak detected during extended operation');
        } else {
            console.log('  ✅ No memory leaks detected during extended operation');
        }
        
        // Cache size control
        if (cacheStressResults.cacheControlled) {
            console.log('  ✅ Cache size properly controlled under stress');
        } else {
            console.log(`  ⚠️ WARNING: Cache grew beyond limits (${cacheStressResults.maxCacheSize})`);
        }
        
        // Overall memory management
        const avgMemoryPerToken = totalMemoryGrowth / totalTokensProcessed;
        if (avgMemoryPerToken > 1024) { // 1KB per token
            console.log(`  ⚠️ WARNING: High memory usage per token (${formatMemory(avgMemoryPerToken)})`);
        } else {
            console.log(`  ✅ Efficient memory usage per token (${formatMemory(avgMemoryPerToken)})`);
        }
        
        // Processing performance
        const avgTimePerToken = highVolumeResults.totalTime / highVolumeResults.tokensProcessed;
        if (avgTimePerToken > 100) { // > 100ms per token
            console.log(`  ⚠️ WARNING: Slow processing under load (${avgTimePerToken.toFixed(2)}ms per token)`);
        } else {
            console.log(`  ✅ Fast processing maintained under load (${avgTimePerToken.toFixed(2)}ms per token)`);
        }
        
        console.log('\n💰 PRODUCTION IMPACT ANALYSIS:');
        console.log(`  Total tokens processed: ${totalTokensProcessed.toLocaleString()}`);
        console.log(`  Total memory growth: ${formatMemory(totalMemoryGrowth)}`);
        console.log(`  Cache efficiency: ${cacheStressResults.finalCacheSize}/${cacheStressResults.maxCacheSize} entries`);
        console.log(`  24/7 viability: ${!extendedOpResults.memoryLeakDetected && cacheStressResults.cacheControlled ? '✅ YES' : '❌ NO'}`);
        console.log(`  Restart frequency needed: ${extendedOpResults.memoryLeakDetected ? 'Daily' : 'Weekly+'}`);
        
        return {
            highVolumeResults,
            extendedOpResults,
            cacheStressResults,
            overallHealth: !extendedOpResults.memoryLeakDetected && 
                          cacheStressResults.cacheControlled && 
                          avgMemoryPerToken < 1024,
            totalTokensProcessed,
            totalMemoryGrowth
        };
        
    } catch (error) {
        console.error('\n❌ TEST EXECUTION FAILED:', error.message);
        console.error('Stack:', error.stack);
        return { error: error.message, failed: true };
    }
}

// Execute if run directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
    executeTest9().then(results => {
        console.log('\n✅ Test #9 execution completed');
        if (results.failed) {
            process.exit(1);
        }
    });
}

export { executeTest9 };