#!/usr/bin/env node

/**
 * Simple test for calculateSafeBuyToSellRatio method
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

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

console.log('🧪 Testing calculateSafeBuyToSellRatio method:\n');

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

console.log('\n' + '='.repeat(50));
console.log(`Total: ${testCases.length}, Passed: ${passed}, Failed: ${failed}`);

if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED!');
} else {
    console.log('\n❌ Some tests failed');
}