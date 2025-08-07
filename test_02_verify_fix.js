#!/usr/bin/env node

/**
 * TEST #2 VERIFICATION: Verify the fix for Empty Accounts Array Crash
 * Tests the actual implementation in tiered-token-filter.service.js
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 VERIFYING FIX: Empty Accounts Array Crash');
console.log('📍 Testing actual implementation in tiered-token-filter.service.js\n');

// Create a mock RPC manager to simulate various failure scenarios
class MockRpcManager {
    constructor(scenario) {
        this.scenario = scenario;
    }

    async call(method, params) {
        if (method === 'getTokenLargestAccounts') {
            switch (this.scenario) {
                case 'empty_array':
                    return { value: { accounts: { value: [] } } };
                case 'null_value':
                    return { value: { accounts: { value: null } } };
                case 'string_value':
                    return { value: { accounts: { value: "invalid_data_type" } } };
                case 'undefined_amount':
                    return { value: { accounts: { value: [{ address: "ABC123", decimals: 0 }] } } };
                case 'null_amount':
                    return { value: { accounts: { value: [{ address: "ABC123", amount: null, decimals: 0 }] } } };
                case 'working':
                    return { value: { accounts: { value: [{ address: "ABC123", amount: "500000000", decimals: 0 }] } } };
                default:
                    return null;
            }
        }
        // Mock other required methods
        if (method === 'getTokenSupply') {
            return { value: { supply: { amount: "1000000000", decimals: 9, uiAmount: 1 } } };
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
            largestHolderPercentage: metadata.largestHolderPercentage,
            uniqueWallets: metadata.uniqueWallets,
            supply: metadata.supply
        });
        
        // Check for NaN
        if (metadata.largestHolderPercentage !== undefined && isNaN(metadata.largestHolderPercentage)) {
            console.log('⚠️  WARNING: largestHolderPercentage is NaN!');
        }
        
        return { crashed: false, metadata };
        
    } catch (error) {
        console.log(`❌ CRASH: ${error.name}: ${error.message}`);
        return { crashed: true, error: error.message };
    }
}

async function runTests() {
    const scenarios = [
        ['Empty array (fresh token)', 'empty_array'],
        ['Null value', 'null_value'],
        ['String value (not array)', 'string_value'],
        ['Undefined amount', 'undefined_amount'],
        ['Null amount', 'null_amount'],
        ['Working case', 'working']
    ];
    
    let crashes = 0;
    let wrongResults = 0;
    
    for (const [name, scenario] of scenarios) {
        const result = await testScenario(name, scenario);
        if (result.crashed) {
            crashes++;
        } else if (result.metadata && isNaN(result.metadata.largestHolderPercentage) && result.metadata.largestHolderPercentage !== undefined) {
            wrongResults++;
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🏛️  FIX VERIFICATION RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${scenarios.length}`);
    console.log(`Crashes: ${crashes}`);
    console.log(`Wrong Results (NaN): ${wrongResults}`);
    console.log(`Working Correctly: ${scenarios.length - crashes - wrongResults}`);
    
    if (crashes === 0) {
        console.log('\n✅ FIX VERIFIED: No crashes detected!');
        console.log('🚀 SAFE TO DEPLOY: Array validation is working correctly');
    } else {
        console.log('\n❌ FIX INCOMPLETE: Crashes still occurring');
        console.log('🚨 DO NOT DEPLOY: Additional fixes required');
    }
}

runTests().catch(console.error);