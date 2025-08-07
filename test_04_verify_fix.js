#!/usr/bin/env node

/**
 * TEST #4 VERIFICATION: Verify the fix for Buy-to-Sell Ratio Division by Zero
 * Tests the calculateSafeBuyToSellRatio method
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 VERIFYING FIX: Buy-to-Sell Ratio Division by Zero');
console.log('📍 Testing calculateSafeBuyToSellRatio implementation\n');

// Test various ratio scenarios
async function runTests() {
    const filter = new TieredTokenFilterService({});
    
    const testCases = [
        { input: undefined, expected: 1.0, description: 'Undefined input' },
        { input: null, expected: 1.0, description: 'Null input' },
        { input: 0, expected: 0, description: 'Zero ratio' },
        { input: '2.5', expected: 2.5, description: 'Normal string ratio' },
        { input: 2.5, expected: 2.5, description: 'Normal number ratio' },
        { input: 'Infinity', expected: 100, description: 'String Infinity' },
        { input: Infinity, expected: 100, description: 'Number Infinity' },
        { input: -Infinity, expected: 100, description: 'Negative Infinity' },
        { input: NaN, expected: 100, description: 'NaN value' },
        { input: 150, expected: 100, description: 'Value > 100' },
        { input: -5, expected: 0, description: 'Negative value' },
        { input: '999', expected: 100, description: 'Large string value' },
        { input: 'invalid', expected: 100, description: 'Invalid string' },
        { input: '', expected: 1.0, description: 'Empty string' },
        { input: '0', expected: 0, description: 'String zero' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    console.log('Testing calculateSafeBuyToSellRatio method:\n');
    
    for (const test of testCases) {
        const result = filter.calculateSafeBuyToSellRatio(test.input);
        const success = result === test.expected;
        
        console.log(`${success ? '✅' : '❌'} ${test.description}`);
        console.log(`   Input: ${test.input}, Expected: ${test.expected}, Got: ${result}`);
        
        if (success) {
            passed++;
        } else {
            failed++;
        }
    }
    
    // Test Pump.fun adjustment scenario
    console.log('\nTesting Pump.fun adjustment scenario:');
    const mockCandidate = {
        lpValueUSD: '50000',
        buyToSellRatio: Infinity,  // Fresh token with no sells
        uniqueWallets: 10,
        isPumpFun: true
    };
    
    const metrics = await filter.gatherComprehensiveMetricsFixed('testtoken', mockCandidate);
    console.log(`✅ Pump.fun token with Infinity ratio: ${metrics.buyToSellRatio} (should be capped at 100)`);
    
    console.log('\n' + '='.repeat(80));
    console.log('🏛️  FIX VERIFICATION RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testCases.length + 1}`);
    console.log(`Passed: ${passed + (metrics.buyToSellRatio === 100 ? 1 : 0)}`);
    console.log(`Failed: ${failed + (metrics.buyToSellRatio === 100 ? 0 : 1)}`);
    
    if (failed === 0 && metrics.buyToSellRatio === 100) {
        console.log('\n✅ FIX VERIFIED: Division by zero protection working correctly!');
        console.log('🚀 SAFE TO DEPLOY: Buy-to-sell ratio capped at reasonable maximum');
    } else {
        console.log('\n❌ FIX INCOMPLETE: Some test cases failed');
        console.log('🚨 DO NOT DEPLOY: Additional fixes required');
    }
}

runTests().catch(console.error);