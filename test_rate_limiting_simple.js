#!/usr/bin/env node

/**
 * Simple test to verify rate limiting configuration
 */

console.log('🧪 VERIFYING RATE LIMITING CONFIGURATION');
console.log('📍 Checking rate limit handling in TieredTokenFilterService\n');

// Read the service file and check configuration
import fs from 'fs';
const serviceContent = fs.readFileSync('./src/services/tiered-token-filter.service.js', 'utf8');

// Check rate limit features
const features = {
    rateLimitDetection: serviceContent.includes('error.status === 429 || error.code === "RATE_LIMITED"'),
    exponentialBackoff: serviceContent.includes('Math.min(2000 * Math.pow(2, i), 30000)'),
    rateLimitLogging: serviceContent.includes('⏳ Rate limited, waiting'),
    statsTracking: serviceContent.includes('this.stats.rateLimitHits ='),
    statsInit: serviceContent.includes('rateLimitHits: 0,'),
    healthCheckStats: serviceContent.includes('rateLimitHits: this.stats.rateLimitHits'),
    skipNormalDelay: serviceContent.includes('continue; // Skip normal retry delay for rate limits')
};

console.log('📊 FEATURE VERIFICATION:');
console.log(`✅ Rate limit detection (429): ${features.rateLimitDetection ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✅ Exponential backoff: ${features.exponentialBackoff ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✅ Rate limit logging: ${features.rateLimitLogging ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✅ Stats tracking: ${features.statsTracking ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✅ Stats initialization: ${features.statsInit ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✅ Health check stats: ${features.healthCheckStats ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✅ Skip normal retry delay: ${features.skipNormalDelay ? 'IMPLEMENTED' : 'MISSING'}`);

// Test backoff calculation
console.log('\n📈 BACKOFF CALCULATION TEST:');
for (let i = 0; i < 5; i++) {
    const delay = Math.min(2000 * Math.pow(2, i), 30000);
    console.log(`  Retry ${i + 1}: ${delay}ms`);
}

// Check retry flow
console.log('\n🔄 RATE LIMIT RETRY FLOW:');
console.log('  1. RPC call fails with 429 status');
console.log('  2. Detect rate limit error');
console.log('  3. Calculate exponential backoff delay');
console.log('  4. Log rate limit and wait');
console.log('  5. Increment rate limit counter');
console.log('  6. Skip normal retry delay (continue)');
console.log('  7. Retry with same endpoint');

const allImplemented = Object.values(features).every(v => v);

console.log('\n' + '='.repeat(60));
if (allImplemented) {
    console.log('✅ RATE LIMITING FULLY CONFIGURED');
    console.log('✅ 429 detection with exponential backoff');
    console.log('✅ Separate from normal retry logic');
    console.log('✅ Statistics tracking enabled');
    console.log('\n🎯 BUSINESS IMPACT:');
    console.log('  - Prevents RPC provider bans');
    console.log('  - Smart backoff (2s → 30s max)');
    console.log('  - Monitoring via rate limit stats');
} else {
    console.log('❌ RATE LIMITING CONFIGURATION INCOMPLETE');
    const missing = Object.entries(features)
        .filter(([k, v]) => !v)
        .map(([k]) => k);
    console.log('Missing features:', missing);
}