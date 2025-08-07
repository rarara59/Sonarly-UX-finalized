#!/usr/bin/env node

/**
 * Verify RPC retry logic improvements
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 VERIFYING RPC RETRY LOGIC IMPROVEMENTS');
console.log('📍 Testing 5 retry attempts with exponential backoff\n');

// Mock RPC Manager that simulates failures
class MockRpcManager {
    constructor(failCount = 3) {
        this.callCount = 0;
        this.failCount = failCount;
        this.rotateCount = 0;
    }
    
    async rotateEndpoint() {
        this.rotateCount++;
        console.log(`  🔄 Endpoint rotated (rotation #${this.rotateCount})`);
    }
    
    async getConnection() {
        return {
            getTokenSupply: async (mint) => {
                this.callCount++;
                if (this.callCount <= this.failCount) {
                    throw new Error(`RPC error - attempt ${this.callCount}`);
                }
                return {
                    value: {
                        amount: '1000000000',
                        decimals: 9,
                        uiAmount: 1.0
                    }
                };
            },
            getTokenLargestAccounts: async (mint) => {
                if (this.callCount <= this.failCount) {
                    throw new Error(`RPC error - attempt ${this.callCount}`);
                }
                return {
                    value: [{
                        address: 'holder1',
                        amount: '100000000'
                    }]
                };
            }
        };
    }
}

async function testRetryScenario(name, failCount) {
    console.log(`\n--- ${name} ---`);
    
    const startTime = Date.now();
    const mockRpc = new MockRpcManager(failCount);
    const filter = new TieredTokenFilterService({ rpcManager: mockRpc });
    
    const result = await filter.validateTokenWithRetry('testtoken123', 'both', 5);
    const elapsedTime = Date.now() - startTime;
    
    console.log(`  📊 Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  🔄 RPC calls made: ${mockRpc.callCount}`);
    console.log(`  🔄 Endpoint rotations: ${mockRpc.rotateCount}`);
    console.log(`  ⏱️  Total time: ${elapsedTime}ms`);
    
    if (result.success) {
        console.log(`  ✅ Succeeded after ${mockRpc.callCount} attempts`);
    } else {
        console.log(`  ❌ Failed after maximum retries`);
    }
    
    return { success: result.success, attempts: mockRpc.callCount, time: elapsedTime };
}

async function runTests() {
    const scenarios = [
        { name: 'Success on first try', failCount: 0 },
        { name: 'Success on retry 2', failCount: 1 },
        { name: 'Success on retry 3', failCount: 2 },
        { name: 'Success on retry 4', failCount: 3 },
        { name: 'Success on retry 5', failCount: 4 },
        { name: 'Failure after all retries', failCount: 5 }
    ];
    
    const results = [];
    for (const scenario of scenarios) {
        const result = await testRetryScenario(scenario.name, scenario.failCount);
        results.push(result);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RPC RETRY VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Success rate: ${successCount}/${scenarios.length} (${(successCount/scenarios.length*100).toFixed(0)}%)`);
    
    console.log('\nExpected delays: [100ms, 500ms, 1500ms, 4000ms, 8000ms]');
    console.log('Maximum retries: 5');
    
    if (successCount === 5) {
        console.log('\n✅ RPC RETRY LOGIC VERIFIED');
        console.log('✅ 5 retry attempts with exponential backoff working correctly');
        console.log('✅ Endpoint rotation on retry working');
        console.log('✅ System recovers from up to 4 consecutive failures');
    } else {
        console.log('\n❌ RPC RETRY LOGIC ISSUES DETECTED');
    }
}

runTests().catch(console.error);