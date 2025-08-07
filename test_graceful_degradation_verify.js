#!/usr/bin/env node

/**
 * Verify graceful degradation improvements
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 VERIFYING GRACEFUL DEGRADATION IMPROVEMENTS');
console.log('📍 Testing partial failure handling and cached data fallback\n');

// Mock RPC Manager that simulates partial failures
class MockPartialFailureRpcManager {
    constructor(failurePattern = 'partial') {
        this.callCount = 0;
        this.failurePattern = failurePattern;
    }
    
    async rotateEndpoint() {
        console.log('  🔄 Endpoint rotated due to partial failure');
    }
    
    async call(method, params) {
        this.callCount++;
        
        // Simulate different failure patterns
        if (this.failurePattern === 'supply-only') {
            if (method === 'getTokenSupply') {
                throw new Error('RPC request failed');
            }
            return {
                value: [{
                    address: 'holder1',
                    amount: '100000000'
                }]
            };
        }
        
        if (this.failurePattern === 'accounts-only') {
            if (method === 'getTokenLargestAccounts') {
                throw new Error('RPC request failed');
            }
            return {
                value: {
                    amount: '1000000000',
                    decimals: 9,
                    uiAmount: 1.0
                }
            };
        }
        
        if (this.failurePattern === 'all-fail') {
            throw new Error('RPC request failed');
        }
        
        // Success case
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

async function testPartialSuccess() {
    console.log('--- Testing Partial Success Scenarios ---\n');
    
    // Test 1: Supply fails, accounts succeed
    const mockRpc1 = new MockPartialFailureRpcManager('supply-only');
    const filter1 = new TieredTokenFilterService({ rpcManager: mockRpc1 });
    
    console.log('Test 1: Supply fails, accounts succeed');
    const result1 = await filter1.validateTokenWithRetry('testtoken1', 'both', 5);
    console.log(`  Result: ${result1.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Partial: ${result1.partial ? 'YES' : 'NO'}`);
    console.log(`  Has data: ${result1.data ? 'YES' : 'NO'}`);
    console.log(`  Data keys: ${result1.data ? Object.keys(result1.data).join(', ') : 'none'}`);
    console.log(`  Partial failures: ${filter1.stats.partialFailures}\n`);
    
    // Test 2: Accounts fail, supply succeeds
    const mockRpc2 = new MockPartialFailureRpcManager('accounts-only');
    const filter2 = new TieredTokenFilterService({ rpcManager: mockRpc2 });
    
    console.log('Test 2: Accounts fail, supply succeeds');
    const result2 = await filter2.validateTokenWithRetry('testtoken2', 'both', 5);
    console.log(`  Result: ${result2.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Partial: ${result2.partial ? 'YES' : 'NO'}`);
    console.log(`  Has data: ${result2.data ? 'YES' : 'NO'}`);
    console.log(`  Data keys: ${result2.data ? Object.keys(result2.data).join(', ') : 'none'}`);
    console.log(`  Partial failures: ${filter2.stats.partialFailures}\n`);
    
    // Test 3: All fail
    const mockRpc3 = new MockPartialFailureRpcManager('all-fail');
    const filter3 = new TieredTokenFilterService({ rpcManager: mockRpc3 });
    
    console.log('Test 3: All RPC calls fail');
    const result3 = await filter3.validateTokenWithRetry('testtoken3', 'both', 2);
    console.log(`  Result: ${result3.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Error: ${result3.error || 'none'}`);
    console.log(`  Partial failures: ${filter3.stats.partialFailures}\n`);
    
    return {
        test1Passed: result1.success && result1.partial && result1.data,
        test2Passed: result2.success && result2.partial && result2.data,
        test3Passed: !result3.success && result3.error,
        partialFailuresTracked: filter1.stats.partialFailures > 0 || filter2.stats.partialFailures > 0
    };
}

async function testCachedDataFallback() {
    console.log('--- Testing Cached Data Fallback ---\n');
    
    const filter = new TieredTokenFilterService({});
    
    // Mock the getCachedMetadata method to return cached data
    filter.getCachedMetadata = (tokenMint) => {
        console.log(`  🔍 getCachedMetadata called for ${tokenMint}`);
        return {
            supply: '500000000',
            decimals: 9,
            name: 'Cached Token',
            symbol: 'CACHED',
            cachedAt: Date.now()
        };
    };
    
    // Test metadata fetch with partial result
    const tokenCandidate = {
        tokenMint: 'testtoken123',
        poolAddress: 'pool123',
        dex: 'raydium'
    };
    
    // Mock fetchTokenMetadataRobust to return partial data
    const originalMethod = filter.fetchTokenMetadataRobust;
    filter.fetchTokenMetadataRobust = async () => {
        return { partial: true, supply: '1000000000' };
    };
    
    console.log('Testing cached data usage on partial failure...');
    const metrics = await filter.gatherTokenMetrics('testtoken123', tokenCandidate);
    
    console.log(`  Metrics returned: ${metrics ? 'YES' : 'NO'}`);
    if (metrics) {
        console.log(`  Has cached flag: ${metrics.cached ? 'YES' : 'NO'}`);
        console.log(`  Name from cache: ${metrics.name}`);
        console.log(`  Supply (merged): ${metrics.supply}`);
    }
    
    // Restore original method
    filter.fetchTokenMetadataRobust = originalMethod;
    
    return {
        cachedDataUsed: metrics && metrics.cached && metrics.name === 'Cached Token'
    };
}

async function testHealthCheckStats() {
    console.log('--- Testing Health Check Statistics ---\n');
    
    const filter = new TieredTokenFilterService({});
    
    // Simulate some partial failures
    filter.stats.partialFailures = 5;
    filter.stats.rateLimitHits = 3;
    filter.stats.processed = 100;
    
    const health = await filter.healthCheck();
    console.log('Health check stats:', health.stats);
    console.log(`  Includes partialFailures: ${'partialFailures' in health.stats ? 'YES' : 'NO'}`);
    console.log(`  Partial failures value: ${health.stats.partialFailures}`);
    
    return {
        statsIncluded: 'partialFailures' in health.stats,
        correctValue: health.stats.partialFailures === 5
    };
}

async function runTests() {
    const partialSuccessTests = await testPartialSuccess();
    const cachedDataTest = await testCachedDataFallback();
    const healthCheckTest = await testHealthCheckStats();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 GRACEFUL DEGRADATION VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\nTest Results:');
    console.log(`✅ Partial supply failure handled: ${partialSuccessTests.test1Passed ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Partial accounts failure handled: ${partialSuccessTests.test2Passed ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Complete failure handled: ${partialSuccessTests.test3Passed ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Partial failures tracked: ${partialSuccessTests.partialFailuresTracked ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Cached data fallback: ${cachedDataTest.cachedDataUsed ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Health check includes stats: ${healthCheckTest.statsIncluded ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Stats value correct: ${healthCheckTest.correctValue ? 'PASS' : 'FAIL'}`);
    
    const allPassed = partialSuccessTests.test1Passed && partialSuccessTests.test2Passed &&
                     partialSuccessTests.test3Passed && partialSuccessTests.partialFailuresTracked &&
                     cachedDataTest.cachedDataUsed && healthCheckTest.statsIncluded &&
                     healthCheckTest.correctValue;
    
    if (allPassed) {
        console.log('\n✅ GRACEFUL DEGRADATION FULLY IMPLEMENTED');
        console.log('✅ System continues with partial RPC data');
        console.log('✅ Cached data used as fallback');
        console.log('✅ Partial failures tracked in statistics');
        console.log('\n🎯 BUSINESS IMPACT:');
        console.log('  - Improved resilience during RPC issues');
        console.log('  - Reduced false negatives from temporary failures');
        console.log('  - Better user experience with cached fallbacks');
    } else {
        console.log('\n❌ GRACEFUL DEGRADATION ISSUES DETECTED');
    }
}

runTests().catch(console.error);