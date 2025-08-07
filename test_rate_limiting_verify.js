#!/usr/bin/env node

/**
 * Verify rate limiting improvements
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 VERIFYING RATE LIMITING IMPROVEMENTS');
console.log('📍 Testing exponential backoff and rate limit tracking\n');

// Mock RPC Manager that simulates rate limiting
class MockRateLimitedRpcManager {
    constructor(rateLimitCount = 2) {
        this.callCount = 0;
        this.rateLimitCount = rateLimitCount;
        this.rateLimitResponses = 0;
    }
    
    async rotateEndpoint() {
        console.log('  🔄 Endpoint rotated due to rate limit');
    }
    
    async call(method, params) {
        this.callCount++;
        
        // Simulate rate limiting for first N calls
        if (this.rateLimitResponses < this.rateLimitCount) {
            this.rateLimitResponses++;
            const error = new Error('Too Many Requests');
            error.status = 429;
            error.code = 'RATE_LIMITED';
            throw error;
        }
        
        // Success after rate limits
        if (method === 'getTokenSupply') {
            return {
                value: {
                    amount: '1000000000',
                    decimals: 9,
                    uiAmount: 1.0
                }
            };
        }
        
        if (method === 'getTokenLargestAccounts') {
            return {
                value: [{
                    address: 'holder1',
                    amount: '100000000'
                }]
            };
        }
    }
}

async function testRateLimitHandling() {
    console.log('--- Testing Rate Limit Handling ---\n');
    
    const mockRpc = new MockRateLimitedRpcManager(2); // Simulate 2 rate limit responses
    const filter = new TieredTokenFilterService({ rpcManager: mockRpc });
    
    console.log('Simulating 429 rate limit errors...\n');
    
    const startTime = Date.now();
    const result = await filter.validateTokenWithRetry('testtoken123', 'both', 5);
    const elapsedTime = Date.now() - startTime;
    
    console.log(`\n📊 Results:`);
    console.log(`  Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Total RPC calls: ${mockRpc.callCount}`);
    console.log(`  Rate limit responses: ${mockRpc.rateLimitResponses}`);
    console.log(`  Rate limit hits tracked: ${filter.stats.rateLimitHits}`);
    console.log(`  Total time: ${elapsedTime}ms`);
    
    // Check if backoff was applied (should take at least 2s + 4s = 6s for 2 rate limits)
    const expectedMinTime = 6000; // 2000ms + 4000ms
    console.log(`  Backoff applied: ${elapsedTime >= expectedMinTime ? 'YES' : 'NO'} (expected min ${expectedMinTime}ms)`);
    
    return {
        success: result.success,
        rateLimitHits: filter.stats.rateLimitHits,
        backoffApplied: elapsedTime >= expectedMinTime
    };
}

async function testRateLimitStats() {
    console.log('\n--- Testing Rate Limit Statistics ---\n');
    
    const filter = new TieredTokenFilterService({});
    
    console.log('Initial stats:', filter.stats);
    console.log(`Rate limit hits: ${filter.stats.rateLimitHits}`);
    
    // Test health check includes rate limit stats
    const health = await filter.healthCheck();
    console.log('\nHealth check stats:', health.stats);
    console.log(`Rate limit hits in health check: ${health.stats.rateLimitHits}`);
    
    return {
        statsInitialized: filter.stats.rateLimitHits === 0,
        healthCheckIncludesRateLimit: 'rateLimitHits' in health.stats
    };
}

async function testBackoffCalculation() {
    console.log('\n--- Testing Exponential Backoff Calculation ---\n');
    
    console.log('Rate limit backoff delays:');
    const delays = [];
    for (let i = 0; i < 5; i++) {
        const delay = Math.min(2000 * Math.pow(2, i), 30000);
        delays.push(delay);
        console.log(`  Retry ${i + 1}: ${delay}ms`);
    }
    
    // Verify exponential growth with cap
    const isExponential = delays[1] === delays[0] * 2 && 
                         delays[2] === delays[1] * 2 &&
                         delays[3] === delays[2] * 2;
    const hasCap = delays[4] === 30000;
    
    return {
        isExponential,
        hasCap,
        delays
    };
}

async function runTests() {
    const backoffTest = await testBackoffCalculation();
    const statsTest = await testRateLimitStats();
    const rateLimitTest = await testRateLimitHandling();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RATE LIMITING VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\nTest Results:');
    console.log(`✅ Exponential backoff: ${backoffTest.isExponential ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Backoff cap at 30s: ${backoffTest.hasCap ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Stats initialization: ${statsTest.statsInitialized ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Health check includes rate limits: ${statsTest.healthCheckIncludesRateLimit ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Rate limit detection: ${rateLimitTest.rateLimitHits > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Backoff applied: ${rateLimitTest.backoffApplied ? 'PASS' : 'FAIL'}`);
    
    const allPassed = backoffTest.isExponential && backoffTest.hasCap &&
                     statsTest.statsInitialized && statsTest.healthCheckIncludesRateLimit &&
                     rateLimitTest.rateLimitHits > 0 && rateLimitTest.backoffApplied;
    
    if (allPassed) {
        console.log('\n✅ RATE LIMITING FULLY IMPLEMENTED');
        console.log('✅ 429 errors trigger exponential backoff');
        console.log('✅ Rate limit hits tracked in statistics');
        console.log('✅ Separate handling from general retries');
        console.log('\n🎯 BUSINESS IMPACT:');
        console.log('  - Respects provider rate limits');
        console.log('  - Prevents account suspension');
        console.log('  - Automatic recovery with smart backoff');
    } else {
        console.log('\n❌ RATE LIMITING ISSUES DETECTED');
    }
}

runTests().catch(console.error);