/**
 * TEST #14: Timeout Cascades - System-wide Slowness Detection
 * Renaissance Production Test for TieredTokenFilterService
 * 
 * CRITICAL: Tests how component timeouts cascade through the entire system
 * FOCUS: Prevent one slow module from killing competitive advantage
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

// Mock components with configurable delays to simulate real-world slowness
class MockSlowRpcManager {
    constructor(delayConfig = {}) {
        this.delayConfig = {
            baseDelay: delayConfig.baseDelay || 0,
            jitter: delayConfig.jitter || 0,
            failureDelay: delayConfig.failureDelay || 0,
            slowEndpoints: delayConfig.slowEndpoints || [],
            ...delayConfig
        };
        this.callCount = 0;
        this.currentEndpoint = 'primary';
        this.endpointCalls = new Map();
    }

    async call(method, params) {
        this.callCount++;
        this.endpointCalls.set(this.currentEndpoint, 
            (this.endpointCalls.get(this.currentEndpoint) || 0) + 1);

        // Calculate delay based on endpoint and configuration
        let delay = this.delayConfig.baseDelay;
        
        if (this.delayConfig.slowEndpoints.includes(this.currentEndpoint)) {
            delay += this.delayConfig.slowEndpointPenalty || 2000;
        }
        
        // Add jitter to simulate real network conditions
        if (this.delayConfig.jitter > 0) {
            delay += Math.random() * this.delayConfig.jitter;
        }
        
        // Method-specific delays
        const methodDelays = this.delayConfig.methodDelays || {};
        if (methodDelays[method]) {
            delay += methodDelays[method];
        }
        
        // Progressive degradation simulation
        if (this.delayConfig.degradation && this.callCount > this.delayConfig.degradation.threshold) {
            delay *= this.delayConfig.degradation.multiplier || 2;
        }

        // Apply the delay
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Simulate occasional failures that require retries
        if (this.delayConfig.failureRate && Math.random() < this.delayConfig.failureRate) {
            if (this.delayConfig.failureDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, this.delayConfig.failureDelay));
            }
            throw new Error(`SIMULATED_${method.toUpperCase()}_FAILURE`);
        }

        return this.getMockResponse(method, params);
    }

    async rotateEndpoint() {
        const endpoints = ['primary', 'secondary', 'tertiary'];
        const currentIndex = endpoints.indexOf(this.currentEndpoint);
        this.currentEndpoint = endpoints[(currentIndex + 1) % endpoints.length];
        
        // Endpoint rotation might have its own delay
        if (this.delayConfig.rotationDelay) {
            await new Promise(resolve => setTimeout(resolve, this.delayConfig.rotationDelay));
        }
    }

    getMockResponse(method, params) {
        // Standard mock responses - same as other tests
        switch (method) {
            case 'getTokenSupply':
                return {
                    value: {
                        amount: '1000000000',
                        decimals: 9,
                        uiAmount: 1000
                    }
                };
            case 'getTokenLargestAccounts':
                return {
                    value: [
                        { amount: '300000000', address: 'holder1' },
                        { amount: '200000000', address: 'holder2' }
                    ]
                };
            case 'getAccountInfo':
                return {
                    value: {
                        data: {
                            parsed: {
                                info: {
                                    decimals: 9,
                                    supply: '1000000000',
                                    mintAuthority: null,
                                    freezeAuthority: null,
                                    isInitialized: true
                                }
                            }
                        }
                    }
                };
            default:
                return { value: null };
        }
    }
}

// Mock slow external risk modules
class MockSlowScamProtectionEngine {
    constructor(delay = 0) {
        this.delay = delay;
        this.analysisCount = 0;
    }

    async analyzeToken(tokenAddress, tokenMetrics) {
        this.analysisCount++;
        
        if (this.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        
        return {
            isScam: false,
            confidence: 85,
            reasons: [],
            analysisTimeMs: this.delay
        };
    }
}

class MockSlowLiquidityRiskAnalyzer {
    constructor(delay = 0) {
        this.delay = delay;
        this.analysisCount = 0;
    }

    async validateExitLiquidity(tokenAddress, tokenMetrics) {
        this.analysisCount++;
        
        if (this.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        
        return {
            hasExitLiquidity: true,
            slippage: 5,
            analysisTimeMs: this.delay
        };
    }
}

class MockSlowMarketCapRiskFilter {
    constructor(delay = 0) {
        this.delay = delay;
        this.analysisCount = 0;
    }

    async filterByMarketCap(tokenMetrics, type) {
        this.analysisCount++;
        
        if (this.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        
        return {
            passed: true,
            reason: 'market_cap_acceptable',
            analysisTimeMs: this.delay
        };
    }
}

// Add string hash function for unique token generation
String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000;
};

// Generate VALID test token candidates with proper base58 addresses
function generateValidTokenMint(index) {
    // Use valid Solana token addresses as base
    const validTokens = [
        'So11111111111111111111111111111111111111112', // Wrapped SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        'mSoLzYCxHdYgdziU2hgzx9xyUixwCkn2sXMTqhgBvYr', // mSOL
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Bonk
    ];
    
    const baseToken = validTokens[index % validTokens.length];
    
    // Modify last few characters while keeping valid base58
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const indexStr = (index + 1000).toString(); // Ensure uniqueness
    
    let modifiedToken = baseToken;
    for (let i = 0; i < Math.min(indexStr.length, 8); i++) {
        const charIndex = parseInt(indexStr[i]) % base58Chars.length;
        const newChar = base58Chars[charIndex];
        modifiedToken = modifiedToken.slice(0, -(i+1)) + newChar + modifiedToken.slice(-i);
    }
    
    return modifiedToken;
}

function generateTokenCandidate(index, ageMinutes = 5) {
    const tokenMint = generateValidTokenMint(index);
    
    return {
        // Multiple address fields for robust extraction
        tokenMint: tokenMint,
        tokenAddress: tokenMint,
        address: tokenMint,
        baseMint: tokenMint,
        mint: tokenMint,
        
        lpValueUSD: 2500 + (index * 100),
        largestHolderPercentage: 25,
        uniqueWallets: 30 + index,
        buyToSellRatio: 2.5,
        avgTransactionSpread: 3,
        transactionSizeVariation: 0.3,
        volume24h: 50000,
        createdAt: Date.now() - (ageMinutes * 60 * 1000),
        hasMintAuthority: false,
        hasFreezeAuthority: false,
        dex: 'raydium'
    };
}

// Test #14.1: RPC Timeout Cascade
async function test14_1_RpcTimeoutCascade() {
    console.log('\n🧪 TEST #14.1: RPC Timeout Cascade');
    console.log('=' .repeat(50));
    
    const scenarios = [
        {
            name: 'Baseline (No Delays)',
            config: { baseDelay: 0 }
        },
        {
            name: 'Slow Primary RPC (500ms)',
            config: { 
                baseDelay: 500,
                slowEndpoints: ['primary'],
                slowEndpointPenalty: 500
            }
        },
        {
            name: 'Degrading Network (Progressive)',
            config: { 
                baseDelay: 100,
                jitter: 200,
                degradation: { threshold: 5, multiplier: 1.5 }
            }
        },
        {
            name: 'Method-Specific Slowness',
            config: { 
                baseDelay: 50,
                methodDelays: {
                    'getTokenSupply': 1000,        // Supply calls very slow
                    'getTokenLargestAccounts': 500  // Account calls slow
                }
            }
        },
        {
            name: 'High Failure Rate with Retry Delays',
            config: { 
                baseDelay: 100,
                failureRate: 0.3,
                failureDelay: 800
            }
        }
    ];

    const results = [];

    for (const scenario of scenarios) {
        console.log(`\n  📊 Testing scenario: ${scenario.name}`);
        
        const mockRpcManager = new MockSlowRpcManager(scenario.config);
        const service = new TieredTokenFilterService({ 
            rpcManager: mockRpcManager 
        });
        
        await service.initialize();
        
        const testTokens = Array(5).fill().map((_, i) => generateTokenCandidate(i + scenario.name.hashCode(), 10));
        const startTime = performance.now();
        
        const tokenResults = [];
        let totalSuccessful = 0;
        let totalFailed = 0;
        
        for (let i = 0; i < testTokens.length; i++) {
            const tokenStart = performance.now();
            
            try {
                const result = await service.processToken(testTokens[i]);
                const tokenTime = performance.now() - tokenStart;
                
                tokenResults.push({
                    tokenIndex: i,
                    success: true,
                    approved: result.approved,
                    processingTime: tokenTime,
                    reason: result.reason
                });
                totalSuccessful++;
                
            } catch (error) {
                const tokenTime = performance.now() - tokenStart;
                tokenResults.push({
                    tokenIndex: i,
                    success: false,
                    processingTime: tokenTime,
                    error: error.message
                });
                totalFailed++;
            }
        }
        
        const totalTime = performance.now() - startTime;
        const avgTimePerToken = tokenResults.reduce((sum, r) => sum + r.processingTime, 0) / tokenResults.length;
        const maxTimePerToken = Math.max(...tokenResults.map(r => r.processingTime));
        
        const scenarioResult = {
            scenario: scenario.name,
            config: scenario.config,
            totalTime,
            avgTimePerToken,
            maxTimePerToken,
            totalSuccessful,
            totalFailed,
            rpcCalls: mockRpcManager.callCount,
            endpointDistribution: Object.fromEntries(mockRpcManager.endpointCalls),
            tokenResults
        };
        
        results.push(scenarioResult);
        
        console.log(`     Total time: ${totalTime.toFixed(0)}ms`);
        console.log(`     Avg per token: ${avgTimePerToken.toFixed(0)}ms`);
        console.log(`     Max per token: ${maxTimePerToken.toFixed(0)}ms`);
        console.log(`     Success rate: ${totalSuccessful}/5`);
        console.log(`     RPC calls: ${mockRpcManager.callCount}`);
        
        // Check for competitive timing violations
        if (avgTimePerToken > 3000) { // 3 second threshold
            console.log(`     ⚠️ WARNING: Exceeds competitive timing (${avgTimePerToken.toFixed(0)}ms > 3000ms)`);
        }
    }
    
    return results;
}

// Test #14.2: External Module Timeout Cascade
async function test14_2_ExternalModuleTimeouts() {
    console.log('\n🧪 TEST #14.2: External Module Timeout Cascade');
    console.log('=' .repeat(50));
    
    const moduleScenarios = [
        {
            name: 'All Modules Fast',
            scamDelay: 0,
            liquidityDelay: 0,
            marketCapDelay: 0
        },
        {
            name: 'Slow Scam Protection (2s)',
            scamDelay: 2000,
            liquidityDelay: 0,
            marketCapDelay: 0
        },
        {
            name: 'Slow Liquidity Analysis (3s)',
            scamDelay: 0,
            liquidityDelay: 3000,
            marketCapDelay: 0
        },
        {
            name: 'All Modules Slow (1s each)',
            scamDelay: 1000,
            liquidityDelay: 1000,
            marketCapDelay: 1000
        },
        {
            name: 'Progressive Slowdown',
            scamDelay: 500,
            liquidityDelay: 1500,
            marketCapDelay: 2500
        }
    ];

    const results = [];

    for (const scenario of moduleScenarios) {
        console.log(`\n  📊 Testing scenario: ${scenario.name}`);
        
        const mockRpcManager = new MockSlowRpcManager({ baseDelay: 50 }); // Small RPC delay
        const scamEngine = new MockSlowScamProtectionEngine(scenario.scamDelay);
        const liquidityAnalyzer = new MockSlowLiquidityRiskAnalyzer(scenario.liquidityDelay);
        const marketCapFilter = new MockSlowMarketCapRiskFilter(scenario.marketCapDelay);
        
        const service = new TieredTokenFilterService({
            rpcManager: mockRpcManager,
            scamProtectionEngine: scamEngine,
            liquidityRiskAnalyzer: liquidityAnalyzer,
            marketCapRiskFilter: marketCapFilter
        });
        
        await service.initialize();
        
        // Test with fresh gems (triggers all risk modules)
        const freshGems = Array(3).fill().map((_, i) => generateTokenCandidate(i + scenario.name.hashCode() + 100, 5)); // 5 min old
        const startTime = performance.now();
        
        const tokenResults = [];
        
        for (let i = 0; i < freshGems.length; i++) {
            const tokenStart = performance.now();
            
            try {
                const result = await service.processToken(freshGems[i]);
                const tokenTime = performance.now() - tokenStart;
                
                tokenResults.push({
                    tokenIndex: i,
                    success: true,
                    approved: result.approved,
                    processingTime: tokenTime,
                    confidence: result.confidence
                });
                
            } catch (error) {
                const tokenTime = performance.now() - tokenStart;
                tokenResults.push({
                    tokenIndex: i,
                    success: false,
                    processingTime: tokenTime,
                    error: error.message
                });
            }
        }
        
        const totalTime = performance.now() - startTime;
        const avgTimePerToken = tokenResults.reduce((sum, r) => sum + r.processingTime, 0) / tokenResults.length;
        const maxTimePerToken = Math.max(...tokenResults.map(r => r.processingTime));
        
        const scenarioResult = {
            scenario: scenario.name,
            delays: scenario,
            totalTime,
            avgTimePerToken,
            maxTimePerToken,
            successCount: tokenResults.filter(r => r.success).length,
            approvedCount: tokenResults.filter(r => r.success && r.approved).length,
            moduleCallCounts: {
                scamEngine: scamEngine.analysisCount,
                liquidityAnalyzer: liquidityAnalyzer.analysisCount,
                marketCapFilter: marketCapFilter.analysisCount
            },
            tokenResults
        };
        
        results.push(scenarioResult);
        
        console.log(`     Total time: ${totalTime.toFixed(0)}ms`);
        console.log(`     Avg per token: ${avgTimePerToken.toFixed(0)}ms`);
        console.log(`     Max per token: ${maxTimePerToken.toFixed(0)}ms`);
        console.log(`     Module calls: Scam=${scamEngine.analysisCount}, Liquidity=${liquidityAnalyzer.analysisCount}, MarketCap=${marketCapFilter.analysisCount}`);
        
        // Check for timeout cascade effects
        const expectedMinTime = scenario.scamDelay + scenario.liquidityDelay + scenario.marketCapDelay;
        if (avgTimePerToken < expectedMinTime * 0.8) { // Should take at least 80% of expected time
            console.log(`     ✅ Parallel processing detected (faster than sequential)`);
        } else if (avgTimePerToken > expectedMinTime * 1.3) { // More than 30% overhead
            console.log(`     ⚠️ Potential cascade overhead detected`);
        }
    }
    
    return results;
}

// Test #14.3: Concurrent Request Timeout Impact
async function test14_3_ConcurrentTimeoutImpact() {
    console.log('\n🧪 TEST #14.3: Concurrent Request Timeout Impact');
    console.log('=' .repeat(50));
    
    const concurrencyScenarios = [
        {
            name: 'Sequential Processing',
            concurrency: 1,
            rpcDelay: 500
        },
        {
            name: 'Low Concurrency (3 parallel)',
            concurrency: 3,
            rpcDelay: 500
        },
        {
            name: 'High Concurrency (10 parallel)',
            concurrency: 10,
            rpcDelay: 500
        },
        {
            name: 'Extreme Concurrency (20 parallel)',
            concurrency: 20,
            rpcDelay: 500
        }
    ];

    const results = [];

    for (const scenario of concurrencyScenarios) {
        console.log(`\n  📊 Testing scenario: ${scenario.name}`);
        
        const mockRpcManager = new MockSlowRpcManager({ 
            baseDelay: scenario.rpcDelay,
            jitter: 100
        });
        
        const service = new TieredTokenFilterService({ 
            rpcManager: mockRpcManager 
        });
        
        await service.initialize();
        
        const testTokens = Array(20).fill().map((_, i) => generateTokenCandidate(i + scenario.name.hashCode() + 200, 15)); // 15 min old
        const startTime = performance.now();
        
        let results_batch = [];
        
        // Process tokens with specified concurrency
        for (let i = 0; i < testTokens.length; i += scenario.concurrency) {
            const batch = testTokens.slice(i, i + scenario.concurrency);
            const batchStart = performance.now();
            
            const batchPromises = batch.map(async (token, batchIndex) => {
                const tokenStart = performance.now();
                try {
                    const result = await service.processToken(token);
                    const tokenTime = performance.now() - tokenStart;
                    return {
                        tokenIndex: i + batchIndex,
                        success: true,
                        approved: result.approved,
                        processingTime: tokenTime
                    };
                } catch (error) {
                    const tokenTime = performance.now() - tokenStart;
                    return {
                        tokenIndex: i + batchIndex,
                        success: false,
                        processingTime: tokenTime,
                        error: error.message
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            const batchTime = performance.now() - batchStart;
            
            results_batch.push(...batchResults.map(r => ({ ...r, batchTime })));
        }
        
        const totalTime = performance.now() - startTime;
        const avgTimePerToken = results_batch.reduce((sum, r) => sum + r.processingTime, 0) / results_batch.length;
        const successCount = results_batch.filter(r => r.success).length;
        
        const scenarioResult = {
            scenario: scenario.name,
            concurrency: scenario.concurrency,
            totalTime,
            avgTimePerToken,
            throughput: (testTokens.length / totalTime * 1000).toFixed(2), // tokens per second
            successCount,
            totalTokens: testTokens.length,
            rpcCalls: mockRpcManager.callCount,
            endpointDistribution: Object.fromEntries(mockRpcManager.endpointCalls)
        };
        
        results.push(scenarioResult);
        
        console.log(`     Total time: ${totalTime.toFixed(0)}ms`);
        console.log(`     Avg per token: ${avgTimePerToken.toFixed(0)}ms`);
        console.log(`     Throughput: ${scenarioResult.throughput} tokens/second`);
        console.log(`     Success rate: ${successCount}/${testTokens.length}`);
        console.log(`     Total RPC calls: ${mockRpcManager.callCount}`);
    }
    
    return results;
}

// Execute all Test #14 scenarios
async function executeTest14() {
    console.log('\n🏁 EXECUTING TEST #14: TIMEOUT CASCADES - SYSTEM-WIDE SLOWNESS');
    console.log('=' .repeat(70));
    console.log('Renaissance Production Test - Focus: Timeout cascade prevention');
    
    try {
        // Run all test scenarios
        const rpcCascadeResults = await test14_1_RpcTimeoutCascade();
        const moduleTimeoutResults = await test14_2_ExternalModuleTimeouts();
        const concurrencyResults = await test14_3_ConcurrentTimeoutImpact();
        
        // Comprehensive analysis
        console.log('\n🎯 COMPREHENSIVE TEST #14 RESULTS');
        console.log('=' .repeat(70));
        
        console.log('\n🚨 CRITICAL FINDINGS:');
        
        // RPC cascade analysis
        const baselineRpc = rpcCascadeResults.find(r => r.scenario.includes('Baseline'));
        const worstRpc = rpcCascadeResults.reduce((worst, current) => 
            current.avgTimePerToken > worst.avgTimePerToken ? current : worst);
        
        if (worstRpc.avgTimePerToken > baselineRpc.avgTimePerToken * 3) {
            console.log(`  ❌ CRITICAL: RPC slowness causes ${(worstRpc.avgTimePerToken / baselineRpc.avgTimePerToken).toFixed(1)}x slowdown`);
        } else {
            console.log(`  ✅ RPC timeout handling acceptable (max ${(worstRpc.avgTimePerToken / baselineRpc.avgTimePerToken).toFixed(1)}x baseline)`);
        }
        
        // Module timeout analysis
        const fastModules = moduleTimeoutResults.find(r => r.scenario.includes('Fast'));
        const slowModules = moduleTimeoutResults.reduce((slowest, current) => 
            current.avgTimePerToken > slowest.avgTimePerToken ? current : slowest);
        
        if (slowModules.avgTimePerToken > 5000) { // 5 second threshold
            console.log(`  ❌ CRITICAL: External modules cause ${slowModules.avgTimePerToken.toFixed(0)}ms delays (> 5s threshold)`);
        } else {
            console.log(`  ✅ External module timeouts manageable (max ${slowModules.avgTimePerToken.toFixed(0)}ms)`);
        }
        
        // Concurrency impact analysis
        const sequentialResult = concurrencyResults.find(r => r.concurrency === 1);
        const highConcurrencyResult = concurrencyResults.find(r => r.concurrency === 10);
        
        if (highConcurrencyResult && sequentialResult) {
            const throughputImprovement = parseFloat(highConcurrencyResult.throughput) / parseFloat(sequentialResult.throughput);
            if (throughputImprovement > 3) {
                console.log(`  ✅ Excellent concurrency scaling (${throughputImprovement.toFixed(1)}x throughput improvement)`);
            } else if (throughputImprovement < 1.5) {
                console.log(`  ⚠️ WARNING: Poor concurrency scaling (only ${throughputImprovement.toFixed(1)}x improvement)`);
            } else {
                console.log(`  ✅ Good concurrency scaling (${throughputImprovement.toFixed(1)}x throughput improvement)`);
            }
        }
        
        console.log('\n💰 COMPETITIVE IMPACT ANALYSIS:');
        
        // Calculate worst-case processing times
        const worstCaseTime = Math.max(worstRpc.avgTimePerToken, slowModules.avgTimePerToken);
        if (worstCaseTime > 3000) {
            console.log(`  ❌ LOSES COMPETITIVE ADVANTAGE: ${worstCaseTime.toFixed(0)}ms worst case (> 3s threshold)`);
        } else {
            console.log(`  ✅ MAINTAINS COMPETITIVE ADVANTAGE: ${worstCaseTime.toFixed(0)}ms worst case (< 3s threshold)`);
        }
        
        // Opportunity cost calculation
        const opportunitiesMissed = worstCaseTime > 3000 ? 
            Math.floor((worstCaseTime - 3000) / 1000) : 0;
        
        console.log(`  Timeout cascade scenarios tested: ${rpcCascadeResults.length + moduleTimeoutResults.length}`);
        console.log(`  Worst-case processing time: ${worstCaseTime.toFixed(0)}ms`);
        console.log(`  Potential opportunities missed: ${opportunitiesMissed} per slow token`);
        
        return {
            rpcCascadeResults,
            moduleTimeoutResults,
            concurrencyResults,
            worstCaseTime,
            maintainsCompetitiveAdvantage: worstCaseTime <= 3000,
            overallHealth: worstCaseTime <= 5000 && // Reasonable timeout handling
                          (highConcurrencyResult ? parseFloat(highConcurrencyResult.throughput) > 2 : true) // Decent concurrency
        };
        
    } catch (error) {
        console.error('\n❌ TEST EXECUTION FAILED:', error.message);
        console.error('Stack:', error.stack);
        return { error: error.message, failed: true };
    }
}

// Execute if run directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
    executeTest14().then(results => {
        console.log('\n✅ Test #14 execution completed');
        if (results.failed) {
            process.exit(1);
        }
    });
}

export { executeTest14 };