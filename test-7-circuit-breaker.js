/**
 * TEST #7: Circuit Breaker Behavior - RPC Error Storm Simulation
 * Renaissance Production Test for TieredTokenFilterService
 * 
 * CRITICAL: Tests system behavior during RPC outages (highest profit periods)
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

// Mock RPC Manager that simulates various failure scenarios
class MockRpcManager {
    constructor(failureMode = 'none') {
        this.failureMode = failureMode;
        this.callCount = 0;
        this.rotationCount = 0;
        this.currentEndpoint = 'helius';
    }

    async call(method, params) {
        this.callCount++;
        
        switch (this.failureMode) {
            case 'total_failure':
                throw new Error('RPC_UNAVAILABLE');
                
            case 'rate_limited':
                throw new Error('RATE_LIMITED');
                
            case 'intermittent':
                if (this.callCount % 3 === 0) {
                    throw new Error('CONNECTION_TIMEOUT');
                }
                break;
                
            case 'recovery_test':
                // Fail first 5 calls, then succeed
                if (this.callCount <= 5) {
                    throw new Error('RATE_LIMITED');
                }
                break;
        }
        
        // Return mock successful responses
        return this.getMockResponse(method, params);
    }

    async rotateEndpoint() {
        this.rotationCount++;
        const endpoints = ['helius', 'chainstack', 'rpc-pool'];
        this.currentEndpoint = endpoints[this.rotationCount % endpoints.length];
        console.log(`🔄 Rotated to endpoint: ${this.currentEndpoint}`);
    }

    getMockResponse(method, params) {
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
                        { amount: '300000000', address: 'holder1...' },
                        { amount: '200000000', address: 'holder2...' },
                        { amount: '100000000', address: 'holder3...' }
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

// Generate valid test token candidates
function generateTokenCandidate(index, ageMinutes = 5) {
    const baseAddress = '11111111111111111111111111111111';
    const tokenMint = baseAddress.substring(0, 32-index.toString().length) + index.toString() + 'A1B2C3';
    
    return {
        tokenMint: tokenMint,
        lpValueUSD: 2000 + (index * 100), // Vary liquidity
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

// Test #7.1: RPC Error Storm Simulation
async function test7_1_ErrorStorm() {
    console.log('\n🧪 TEST #7.1: RPC Error Storm Simulation');
    console.log('=' .repeat(50));
    
    const mockRpcManager = new MockRpcManager('total_failure');
    const service = new TieredTokenFilterService({ 
        rpcManager: mockRpcManager 
    });
    
    await service.initialize();
    
    console.log('📊 Processing 5 tokens during total RPC failure...');
    const startTime = performance.now();
    const results = [];
    
    for (let i = 0; i < 5; i++) {
        const token = generateTokenCandidate(i);
        console.log(`\n  🔍 Processing token ${i + 1}: ${token.tokenMint.substring(0, 8)}...`);
        
        try {
            const result = await service.processToken(token);
            results.push({ tokenIndex: i, result, error: null });
            console.log(`  ✅ Result: ${result.approved ? 'APPROVED' : 'REJECTED'} (${result.reason})`);
        } catch (error) {
            results.push({ tokenIndex: i, result: null, error: error.message });
            console.log(`  ❌ Error: ${error.message}`);
        }
    }
    
    const totalTime = performance.now() - startTime;
    
    console.log('\n📈 TEST RESULTS:');
    console.log(`  Total processing time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Average time per token: ${(totalTime / 5).toFixed(2)}ms`);
    console.log(`  RPC calls attempted: ${mockRpcManager.callCount}`);
    console.log(`  Endpoint rotations: ${mockRpcManager.rotationCount}`);
    console.log(`  Successful processing: ${results.filter(r => r.result !== null).length}/5`);
    console.log(`  System crashes: ${results.filter(r => r.error !== null).length}`);
    
    return {
        results,
        totalTime,
        rpcCalls: mockRpcManager.callCount,
        rotations: mockRpcManager.rotationCount,
        crashed: results.some(r => r.error !== null)
    };
}

// Test #7.2: Recovery Pattern Test
async function test7_2_Recovery() {
    console.log('\n🧪 TEST #7.2: Recovery Pattern Test');
    console.log('=' .repeat(50));
    
    const mockRpcManager = new MockRpcManager('recovery_test');
    const service = new TieredTokenFilterService({ 
        rpcManager: mockRpcManager 
    });
    
    await service.initialize();
    
    const token = generateTokenCandidate(1, 10); // 10 minutes old (fresh gem)
    
    console.log('📊 Processing token during recovery simulation...');
    console.log('  First 5 RPC calls will fail, then recover');
    
    const startTime = performance.now();
    let result;
    let error = null;
    
    try {
        result = await service.processToken(token);
        console.log(`✅ Token processed successfully after recovery`);
        console.log(`   Approved: ${result.approved}`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log(`   Reason: ${result.reason}`);
    } catch (e) {
        error = e.message;
        console.log(`❌ Processing failed: ${error}`);
    }
    
    const totalTime = performance.now() - startTime;
    
    console.log('\n📈 RECOVERY TEST RESULTS:');
    console.log(`  Processing time: ${totalTime.toFixed(2)}ms`);
    console.log(`  RPC calls made: ${mockRpcManager.callCount}`);
    console.log(`  Endpoint rotations: ${mockRpcManager.rotationCount}`);
    console.log(`  Recovery successful: ${result !== null && !error}`);
    
    return {
        recoverySuccessful: result !== null && !error,
        totalTime,
        rpcCalls: mockRpcManager.callCount,
        result,
        error
    };
}

// Test #7.3: Intermittent Failure Pattern
async function test7_3_IntermittentFailures() {
    console.log('\n🧪 TEST #7.3: Intermittent Failure Pattern');
    console.log('=' .repeat(50));
    
    const mockRpcManager = new MockRpcManager('intermittent');
    const service = new TieredTokenFilterService({ 
        rpcManager: mockRpcManager 
    });
    
    await service.initialize();
    
    console.log('📊 Processing 10 tokens with intermittent failures (every 3rd call fails)...');
    const results = [];
    const startTime = performance.now();
    
    for (let i = 0; i < 10; i++) {
        const token = generateTokenCandidate(i, 8); // 8 minutes old
        
        try {
            const result = await service.processToken(token);
            results.push({ success: true, approved: result.approved });
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }
    
    const totalTime = performance.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const approvedCount = results.filter(r => r.success && r.approved).length;
    
    console.log('\n📈 INTERMITTENT FAILURE RESULTS:');
    console.log(`  Total processing time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Successful processing: ${successCount}/10`);
    console.log(`  Tokens approved: ${approvedCount}/${successCount}`);
    console.log(`  RPC calls made: ${mockRpcManager.callCount}`);
    console.log(`  Endpoint rotations: ${mockRpcManager.rotationCount}`);
    console.log(`  Average time per token: ${(totalTime / 10).toFixed(2)}ms`);
    
    return {
        successRate: successCount / 10,
        approvalRate: successCount > 0 ? approvedCount / successCount : 0,
        totalTime,
        rpcCalls: mockRpcManager.callCount,
        results
    };
}

// Execute all Test #7 scenarios
async function executeTest7() {
    console.log('\n🏁 EXECUTING TEST #7: CIRCUIT BREAKER BEHAVIOR');
    console.log('=' .repeat(60));
    console.log('Renaissance Production Test - Focus: System reliability during RPC failures');
    
    try {
        // Run all test scenarios
        const errorStormResults = await test7_1_ErrorStorm();
        const recoveryResults = await test7_2_Recovery();
        const intermittentResults = await test7_3_IntermittentFailures();
        
        // Summary analysis
        console.log('\n🎯 COMPREHENSIVE TEST #7 RESULTS');
        console.log('=' .repeat(60));
        
        console.log('\n🚨 CRITICAL FINDINGS:');
        
        if (errorStormResults.crashed) {
            console.log('  ❌ CRITICAL: System crashes during total RPC failure');
        } else {
            console.log('  ✅ System survives total RPC failure without crashing');
        }
        
        if (recoveryResults.recoverySuccessful) {
            console.log('  ✅ System recovers successfully when RPC comes back online');
        } else {
            console.log('  ❌ CRITICAL: System fails to recover after RPC restoration');
        }
        
        const avgIntermittentTime = intermittentResults.totalTime / 10;
        if (avgIntermittentTime > 3000) { // > 3 seconds per token
            console.log(`  ⚠️ WARNING: Slow processing during intermittent failures (${avgIntermittentTime.toFixed(0)}ms avg)`);
        } else {
            console.log(`  ✅ Acceptable processing speed during intermittent failures (${avgIntermittentTime.toFixed(0)}ms avg)`);
        }
        
        console.log('\n💰 MONEY IMPACT ANALYSIS:');
        console.log(`  RPC calls during error storm: ${errorStormResults.rpcCalls} (cost impact)`);
        console.log(`  Endpoint rotations triggered: ${errorStormResults.rotations + recoveryResults.rotations + intermittentResults.rpcCalls}`);
        console.log(`  Success rate during intermittent failures: ${(intermittentResults.successRate * 100).toFixed(1)}%`);
        
        return {
            errorStormResults,
            recoveryResults,
            intermittentResults,
            overallHealth: !errorStormResults.crashed && recoveryResults.recoverySuccessful && intermittentResults.successRate > 0.7
        };
        
    } catch (error) {
        console.error('\n❌ TEST EXECUTION FAILED:', error.message);
        console.error('Stack:', error.stack);
        return { error: error.message, failed: true };
    }
}

// Execute if run directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
    executeTest7().then(results => {
        console.log('\n✅ Test #7 execution completed');
        if (results.failed) {
            process.exit(1);
        }
    });
}

export { executeTest7 };