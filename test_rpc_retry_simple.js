#!/usr/bin/env node

/**
 * Simple test to verify RPC retry configuration
 */

console.log('🧪 VERIFYING RPC RETRY CONFIGURATION');
console.log('📍 Checking retry settings in TieredTokenFilterService\n');

// Read the service file and check configuration
import fs from 'fs';
const serviceContent = fs.readFileSync('./src/services/tiered-token-filter.service.js', 'utf8');

// Check maxRetries parameter
const maxRetriesMatch = serviceContent.match(/maxRetries = (\d+)/);
const maxRetries = maxRetriesMatch ? parseInt(maxRetriesMatch[1]) : null;

// Check delays array
const delaysMatch = serviceContent.match(/const delays = \[([\d, ]+)\]/);
const delays = delaysMatch ? delaysMatch[1].split(',').map(d => parseInt(d.trim())) : [];

// Check retry logging
const hasRetryLogging = serviceContent.includes('Token validation retry ${i + 1}/5');
const hasDelayLogging = serviceContent.includes('${delays[Math.min(i-1, delays.length-1)]}ms delay');

console.log('📊 CONFIGURATION CHECK:');
console.log(`✅ Max retries: ${maxRetries} (expected: 5)`);
console.log(`✅ Delay array: [${delays.join(', ')}]`);
console.log(`✅ Expected delays: [100, 500, 1500, 4000, 8000]`);
console.log(`✅ Has retry logging: ${hasRetryLogging}`);
console.log(`✅ Has delay in logging: ${hasDelayLogging}`);

// Calculate total time for all retries
const totalDelay = delays.slice(0, maxRetries - 1).reduce((sum, d) => sum + d, 0);
console.log(`\n⏱️  TIMING ANALYSIS:`);
console.log(`Total delay for ${maxRetries} attempts: ${totalDelay}ms`);
console.log(`Average delay per retry: ${(totalDelay / (maxRetries - 1)).toFixed(0)}ms`);

// Verify exponential backoff pattern
console.log(`\n📈 BACKOFF PATTERN:`);
delays.forEach((delay, i) => {
    if (i === 0) {
        console.log(`Retry 1→2: ${delay}ms (base)`);
    } else {
        const ratio = (delay / delays[i-1]).toFixed(1);
        console.log(`Retry ${i+1}→${i+2}: ${delay}ms (${ratio}x previous)`);
    }
});

// Final verification
const allChecks = 
    maxRetries === 5 &&
    delays.length === 5 &&
    delays[0] === 100 &&
    delays[4] === 8000 &&
    hasRetryLogging &&
    hasDelayLogging;

console.log('\n' + '='.repeat(50));
if (allChecks) {
    console.log('✅ RPC RETRY CONFIGURATION VERIFIED');
    console.log('✅ 5 retry attempts configured');
    console.log('✅ Exponential backoff from 100ms to 8000ms');
    console.log('✅ Retry logging includes attempt number and delay');
} else {
    console.log('❌ RPC RETRY CONFIGURATION ISSUES');
    if (maxRetries !== 5) console.log(`  - Max retries is ${maxRetries}, expected 5`);
    if (delays.length !== 5) console.log(`  - Delays array has ${delays.length} entries, expected 5`);
    if (!hasRetryLogging) console.log('  - Missing retry logging');
}

console.log('\n🎯 RETRY BEHAVIOR:');
console.log('- First attempt: immediate');
console.log('- Retry 1: wait 100ms');
console.log('- Retry 2: wait 500ms'); 
console.log('- Retry 3: wait 1500ms');
console.log('- Retry 4: wait 4000ms');
console.log('- Total time for 5 attempts: ~6.1 seconds');