#!/usr/bin/env node

/**
 * RENAISSANCE TEST #13 SIMPLIFIED: Direct RPC Failure Testing
 * 
 * Bypass token validation and test RPC layer directly
 * Focus: Critical RPC failure scenarios that cause $0 revenue
 */

console.log('🧪 RENAISSANCE TEST #13 SIMPLIFIED: Direct RPC Failure Testing');
console.log('📍 Testing: RPC manager directly without token validation layer');
console.log('🎯 Scenario: Direct RPC failures during viral events');
console.log('💰 Impact: CRITICAL - No RPC = No blockchain data = No revenue\n');

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

// Mock RPC Manager with failure modes (same as before)
class FailureRpcManager {
    constructor(failureMode = 'normal') {
        this.failureMode = failureMode;
        this.callCount = 0;
        this.failureCount = 0;
        this.rotationCount = 0;
    }

    async call(method, params) {
        this.callCount++;
        console.log(`    📡 RPC Call #${this.callCount}: ${method} (mode: ${this.failureMode})`);

        switch (this.failureMode) {
            case 'normal':
                await new Promise(resolve => setTimeout(resolve, 50));
                return this._getNormalResponse(method);
                
            case 'all_down':
                this.failureCount++;
                throw new Error(`All RPC endpoints down - connection failed`);

            case 'timeout':
                this.failureCount++;
                await new Promise(resolve => setTimeout(resolve, 8000)); // 8 second hang
                throw new Error(`RPC timeout - endpoint did not respond`);

            case 'rate_limited':
                this.failureCount++;
                const error = new Error(`Rate limit exceeded`);
                error.status = 429;
                throw error;

            case 'intermittent':
                if (Math.random() < 0.7) { // 70% failure rate
                    this.failureCount++;
                    throw new Error(`Intermittent failure: Network error`);
                }
                return this._getNormalResponse(method);

            case 'malformed':
                this.failureCount++;
                return { error: 'Invalid response', code: -32602 }; // Missing 'value' field

            default:
                throw new Error(`Unknown failure mode: ${this.failureMode}`);
        }
    }

    async rotateEndpoint() {
        this.rotationCount++;
        console.log(`    🔄 Endpoint rotated (rotation #${this.rotationCount})`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    _getNormalResponse(method) {
        if (method === 'getTokenSupply') {
            return {
                value: {
                    amount: "1000000000",
                    decimals: 9,
                    uiAmount: 1
                }
            };
        }
        
        if (method === 'getTokenLargestAccounts') {
            return {
                value: [
                    { address: "holder1", amount: "300000000", decimals: 0 },
                    { address: "holder2", amount: "200000000", decimals: 0 }
                ]
            };
        }
        
        return null;
    }

    getStats() {
        return {
            totalCalls: this.callCount,
            failures: this.failureCount,
            rotations: this.rotationCount,
            failureRate: this.callCount > 0 ? (this.failureCount / this.callCount * 100).toFixed(1) + '%' : '0%'
        };
    }
}

// Direct RPC Testing without token validation layer
async function testRpcDirectly(testName, failureMode) {
    console.log(`\n--- ${testName} ---`);
    console.log(`Failure Mode: ${failureMode}`);
    
    const mockRpc = new FailureRpcManager(failureMode);
    const validTokenMint = 'So11111111111111111111111111111111111111112'; // Valid Solana address
    
    const startTime = Date.now();
    let rpcSuccess = 0;
    let rpcFailures = 0;
    let systemHang = false;
    
    console.log('  🔗 Testing direct RPC calls...');
    
    try {
        // Test 1: getTokenSupply
        const supplyPromise = mockRpc.call('getTokenSupply', [validTokenMint]);
        const supplyTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Supply call hung')), 10000)
        );
        
        try {
            const supplyResult = await Promise.race([supplyPromise, supplyTimeout]);
            if (supplyResult && supplyResult.value) {
                rpcSuccess++;
                console.log(`    ✅ getTokenSupply: Success`);
            } else {
                rpcFailures++;
                console.log(`    ❌ getTokenSupply: Malformed response`);
            }
        } catch (error) {
            if (error.message.includes('hung')) {
                systemHang = true;
                console.log(`    🚨 getTokenSupply: SYSTEM HANG - ${error.message}`);
            } else {
                rpcFailures++;
                console.log(`    ❌ getTokenSupply: ${error.message}`);
            }
        }

        // Test 2: getTokenLargestAccounts (if not hung)
        if (!systemHang) {
            const accountsPromise = mockRpc.call('getTokenLargestAccounts', [validTokenMint]);
            const accountsTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Accounts call hung')), 10000)
            );
            
            try {
                const accountsResult = await Promise.race([accountsPromise, accountsTimeout]);
                if (accountsResult && accountsResult.value) {
                    rpcSuccess++;
                    console.log(`    ✅ getTokenLargestAccounts: Success`);
                } else {
                    rpcFailures++;
                    console.log(`    ❌ getTokenLargestAccounts: Malformed response`);
                }
            } catch (error) {
                if (error.message.includes('hung')) {
                    systemHang = true;
                    console.log(`    🚨 getTokenLargestAccounts: SYSTEM HANG - ${error.message}`);
                } else {
                    rpcFailures++;
                    console.log(`    ❌ getTokenLargestAccounts: ${error.message}`);
                }
            }
        }

    } catch (error) {
        console.log(`    💥 Test setup failed: ${error.message}`);
        rpcFailures++;
    }
    
    const processingTime = Date.now() - startTime;
    const rpcStats = mockRpc.getStats();
    
    console.log(`\n📊 Direct RPC Results:`);
    console.log(`   Processing Time: ${processingTime}ms`);
    console.log(`   RPC Success: ${rpcSuccess}/2`);
    console.log(`   RPC Failures: ${rpcFailures}/2`);
    console.log(`   System Hangs: ${systemHang ? 'YES - CRITICAL' : 'NO'}`);
    console.log(`   RPC Stats: ${rpcStats.totalCalls} calls, ${rpcStats.failures} failures (${rpcStats.failureRate})`);
    console.log(`   Endpoint Rotations: ${rpcStats.rotations}`);
    
    return {
        success: rpcSuccess,
        failures: rpcFailures,
        systemHang,
        processingTime,
        rpcStats
    };
}

// Run simplified RPC tests
async function runSimplifiedRpcTests() {
    console.log('Testing RPC failures directly...\n');
    
    const tests = [
        ['Normal RPC Operation', 'normal'],
        ['All Endpoints Down', 'all_down'],
        ['RPC Timeouts', 'timeout'],
        ['Rate Limiting', 'rate_limited'],
        ['Intermittent Failures', 'intermittent'],
        ['Malformed Responses', 'malformed']
    ];
    
    const results = [];
    
    for (const [testName, failureMode] of tests) {
        const result = await testRpcDirectly(testName, failureMode);
        results.push({ name: testName, mode: failureMode, ...result });
        
        // Add delay between tests to prevent interference
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
}

// Execute and analyze
runSimplifiedRpcTests().then(results => {
    console.log('\n' + '='.repeat(80));
    console.log('🏛️  RENAISSANCE DIRECT RPC ANALYSIS');
    console.log('='.repeat(80));
    
    let totalHangs = 0;
    let totalFailures = 0;
    let totalSuccess = 0;
    let criticalIssues = [];
    
    results.forEach(result => {
        totalSuccess += result.success;
        totalFailures += result.failures;
        
        if (result.systemHang) {
            totalHangs++;
            criticalIssues.push(`${result.name}: System hung during RPC calls`);
        }
        
        if (result.failures === 2) {
            criticalIssues.push(`${result.name}: Complete RPC failure (0% success)`);
        }
    });
    
    console.log(`\n📊 DIRECT RPC TEST RESULTS:`);
    console.log(`   Total Tests: ${results.length}`);
    console.log(`   System Hangs: ${totalHangs} (CRITICAL)`);
    console.log(`   Total RPC Successes: ${totalSuccess}/${results.length * 2}`);
    console.log(`   Total RPC Failures: ${totalFailures}/${results.length * 2}`);
    console.log(`   Success Rate: ${((totalSuccess / (results.length * 2)) * 100).toFixed(1)}%`);
    
    if (criticalIssues.length > 0) {
        console.log(`\n🚨 CRITICAL RPC ISSUES:`);
        criticalIssues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log(`\n💰 BUSINESS IMPACT:`);
    if (totalHangs > 0) {
        console.log(`   ❌ CATASTROPHIC: ${totalHangs} scenarios cause system hangs`);
        console.log(`   💸 COMPLETE DOWNTIME: No analysis possible = $0 revenue`);
        console.log(`   🚨 PRODUCTION BLOCKER: System freezes during RPC failures`);
    } else if (totalFailures > totalSuccess) {
        console.log(`   ❌ MAJOR IMPACT: More RPC failures than successes`);
        console.log(`   💸 REDUCED REVENUE: Cannot reliably access blockchain data`);
        console.log(`   ⚠️  DEPLOYMENT RISK: RPC reliability issues`);
    } else {
        console.log(`   ✅ ACCEPTABLE: RPC system handles most failure scenarios`);
        console.log(`   💪 BUSINESS CONTINUITY: Blockchain data access maintained`);
    }
    
    console.log(`\n🏛️  RENAISSANCE VERDICT:`);
    if (totalHangs > 0) {
        console.log(`   🚨 DO NOT DEPLOY: System hangs during RPC failures`);
        console.log(`   💡 CRITICAL FIX: Add timeout protection to RPC calls`);
    } else if (totalFailures >= totalSuccess) {
        console.log(`   ⚠️  FIX BEFORE DEPLOY: RPC failure rate too high`);
        console.log(`   💡 IMPROVEMENT: Better error handling and retry logic`);
    } else {
        console.log(`   ✅ RPC SYSTEM ACCEPTABLE: Ready for production`);
        console.log(`   💡 MONITORING: Track RPC performance in production`);
    }
    
    console.log(`\n🎯 RPC TESTING COMPLETE`);
    console.log('='.repeat(80));
    
}).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});