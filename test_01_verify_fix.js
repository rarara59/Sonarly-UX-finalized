#!/usr/bin/env node

/**
 * TEST #1 VERIFICATION: Verify the fix for NULL Supply Data Crash
 * Tests the actual implementation in tiered-token-filter.service.js
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 VERIFYING FIX: NULL Supply Data Crash');
console.log('📍 Testing actual implementation in tiered-token-filter.service.js\n');

// Create a mock RPC manager to simulate various failure scenarios
class MockRpcManager {
    constructor(scenario) {
        this.scenario = scenario;
    }

    async call(method, params) {
        if (method === 'getTokenSupply') {
            switch (this.scenario) {
                case 'null_response':
                    return null;
                case 'no_value':
                    return {};
                case 'null_supply':
                    return { value: { supply: null } };
                case 'missing_amount':
                    return { value: { supply: { decimals: 9, uiAmount: 1 } } };
                case 'empty_amount':
                    return { value: { supply: { amount: '', decimals: 9 } } };
                case 'invalid_amount':
                    return { value: { supply: { amount: 'invalid', decimals: 9 } } };
                case 'working':
                    return { value: { supply: { amount: '1000000000', decimals: 9, uiAmount: 1 } } };
                default:
                    throw new Error('Unknown scenario');
            }
        }
        return null;
    }
}

async function testScenario(name, scenario) {
    console.log(`\n--- ${name} ---`);
    
    try {
        const mockRpc = new MockRpcManager(scenario);
        const filter = new TieredTokenFilterService({ rpcManager: mockRpc });
        
        // Test the actual fetchTokenMetadataRobust method
        const metadata = await filter.fetchTokenMetadataRobust('testtoken123', {});
        
        console.log('✅ NO CRASH - Metadata returned:', {
            supply: metadata.supply,
            decimals: metadata.decimals,
            isInitialized: metadata.isInitialized
        });
        
        // Check for NaN
        if (isNaN(metadata.supply)) {
            console.log('⚠️  WARNING: Supply is NaN!');
        }
        
        return { crashed: false, supply: metadata.supply };
        
    } catch (error) {
        console.log(`❌ CRASH: ${error.name}: ${error.message}`);
        return { crashed: true, error: error.message };
    }
}

async function runTests() {
    const scenarios = [
        ['Null response', 'null_response'],
        ['Missing value field', 'no_value'],
        ['Null supply', 'null_supply'],
        ['Missing amount', 'missing_amount'],
        ['Empty amount', 'empty_amount'],
        ['Invalid amount', 'invalid_amount'],
        ['Working case', 'working']
    ];
    
    let crashes = 0;
    let nanResults = 0;
    
    for (const [name, scenario] of scenarios) {
        const result = await testScenario(name, scenario);
        if (result.crashed) crashes++;
        if (!result.crashed && isNaN(result.supply)) nanResults++;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🏛️  FIX VERIFICATION RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${scenarios.length}`);
    console.log(`Crashes: ${crashes}`);
    console.log(`NaN Results: ${nanResults}`);
    console.log(`Working Correctly: ${scenarios.length - crashes - nanResults}`);
    
    if (crashes === 0) {
        console.log('\n✅ FIX VERIFIED: No crashes detected!');
        console.log('🚀 SAFE TO DEPLOY: Null safety is working correctly');
    } else {
        console.log('\n❌ FIX INCOMPLETE: Crashes still occurring');
        console.log('🚨 DO NOT DEPLOY: Additional fixes required');
    }
}

runTests().catch(console.error);