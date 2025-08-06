/**
 * Market Cap Risk Filter - Integration Test
 * Renaissance Standard: Test real scenarios that lose money
 */

import { MarketCapRiskFilter } from '../src/detection/risk/market-cap-risk-filter.js';

// Mock dependencies - minimal viable mocks
const mockRpcPool = {
    getConnection: () => Promise.resolve({})
};

const mockLogger = {
    error: (msg, err) => console.log(`[ERROR] ${msg}`, err?.message || ''),
    warn: (msg, err) => console.log(`[WARN] ${msg}`, err?.message || ''),
    info: (msg) => console.log(`[INFO] ${msg}`)
};

// Initialize filter
const filter = new MarketCapRiskFilter(mockRpcPool, mockLogger);

// TEST CASES - Real production scenarios
async function runIntegrationTests() {
    console.log('🚀 RENAISSANCE MARKET CAP FILTER INTEGRATION TESTS\n');
    
    let passed = 0;
    let failed = 0;
    
    // TEST 1: FRESH GEM - OPTIMAL RANGE (SHOULD PASS)
    console.log('TEST 1: Fresh Gem - Optimal Range ($500K)');
    try {
        const result = await filter.filterByMarketCap({
            marketCapUSD: 500000
        }, 'fresh_gem');
        
        if (result.passed && result.marketCapUSD === 500000 && result.riskLevel) {
            console.log('✅ PASS:', result.reason);
            console.log('   Risk Level:', result.riskLevel);
            passed++;
        } else {
            console.log('❌ FAIL: Expected pass but got:', result);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH:', error.message);
        failed++;
    }
    
    // TEST 2: FRESH GEM - TOO SMALL (SHOULD FAIL)
    console.log('\nTEST 2: Fresh Gem - Too Small ($25K - Liquidity Trap)');
    try {
        const result = await filter.filterByMarketCap({
            marketCapUSD: 25000
        }, 'fresh_gem');
        
        if (!result.passed && result.reason.includes('TOO_SMALL')) {
            console.log('✅ PASS:', result.reason);
            passed++;
        } else {
            console.log('❌ FAIL: Expected rejection but got:', result);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH:', error.message);
        failed++;
    }
    
    // TEST 3: FRESH GEM - TOO LARGE (SHOULD FAIL)
    console.log('\nTEST 3: Fresh Gem - Too Large ($10M - Whale Controlled)');
    try {
        const result = await filter.filterByMarketCap({
            marketCapUSD: 10000000
        }, 'fresh_gem');
        
        if (!result.passed && result.reason.includes('TOO_LARGE')) {
            console.log('✅ PASS:', result.reason);
            passed++;
        } else {
            console.log('❌ FAIL: Expected rejection but got:', result);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH:', error.message);
        failed++;
    }
    
    // TEST 4: ESTABLISHED TOKEN - OPTIMAL RANGE (SHOULD PASS)
    console.log('\nTEST 4: Established Token - Optimal Range ($1M)');
    try {
        const result = await filter.filterByMarketCap({
            marketCapUSD: 1000000
        }, 'established');
        
        if (result.passed && result.marketCapUSD === 1000000) {
            console.log('✅ PASS:', result.reason);
            passed++;
        } else {
            console.log('❌ FAIL: Expected pass but got:', result);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH:', error.message);
        failed++;
    }
    
    // TEST 5: CALCULATION FROM SUPPLY + PRICE (REAL SCENARIO)
    console.log('\nTEST 5: Market Cap Calculation - Supply + SOL Price');
    try {
        const result = await filter.filterByMarketCap({
            supply: 1000000,        // 1M tokens
            priceSOL: 0.002,       // 0.002 SOL per token
            // No direct marketCapUSD - force calculation
        }, 'fresh_gem');
        
        // Expected: 1M * 0.002 * 150 (SOL price) = $300K
        if (result.passed && result.marketCapUSD === 300000) {
            console.log('✅ PASS:', result.reason);
            console.log('   Calculated Market Cap: $' + result.marketCapUSD.toLocaleString());
            passed++;
        } else {
            console.log('❌ FAIL: Expected $300K calculation but got:', result);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH:', error.message);
        failed++;
    }
    
    // TEST 6: CALCULATION FROM LIQUIDITY (ESTIMATION)
    console.log('\nTEST 6: Market Cap Estimation - From Liquidity');
    try {
        const result = await filter.filterByMarketCap({
            liquiditySOL: 20,      // 20 SOL liquidity
            // No supply or direct cap - force liquidity estimation
        }, 'fresh_gem');
        
        // Expected: 20 * 150 (SOL price) * 10 = $30K (should fail - too small)
        if (!result.passed && result.reason.includes('TOO_SMALL')) {
            console.log('✅ PASS:', result.reason);
            console.log('   Estimated Market Cap: $' + result.marketCapUSD.toLocaleString());
            passed++;
        } else {
            console.log('❌ FAIL: Expected too small rejection but got:', result);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH:', error.message);
        failed++;
    }
    
    // TEST 7: DEFENSIVE - NULL TOKEN DATA (CRASH PREVENTION)
    console.log('\nTEST 7: Defensive Programming - Null Token Data');
    try {
        const result = await filter.filterByMarketCap(null);
        
        if (!result.passed && result.reason === 'TOKEN_DATA_MISSING') {
            console.log('✅ PASS:', result.reason);
            passed++;
        } else {
            console.log('❌ FAIL: Expected TOKEN_DATA_MISSING but got:', result);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH: Should not crash on null data:', error.message);
        failed++;
    }
    
    // TEST 8: DEFENSIVE - MALFORMED DATA (NaN PREVENTION)
    console.log('\nTEST 8: Defensive Programming - Malformed RPC Data');
    try {
        const result = await filter.filterByMarketCap({
            supply: "invalid_number",
            priceSOL: null,
            liquiditySOL: undefined
        });
        
        if (!result.passed && result.reason.includes('Unable to calculate')) {
            console.log('✅ PASS:', result.reason);
            passed++;
        } else {
            console.log('❌ FAIL: Expected calculation failure but got:', result);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH: Should not crash on malformed data:', error.message);
        failed++;
    }
    
    // TEST 9: PERFORMANCE - SPEED TEST
    console.log('\nTEST 9: Performance - Speed Requirement (<15ms)');
    try {
        const startTime = Date.now();
        
        // Run 10 filters to average timing
        for (let i = 0; i < 10; i++) {
            await filter.filterByMarketCap({
                marketCapUSD: 500000
            }, 'fresh_gem');
        }
        
        const avgTime = (Date.now() - startTime) / 10;
        
        if (avgTime < 15) {
            console.log(`✅ PASS: Average time ${avgTime.toFixed(2)}ms < 15ms requirement`);
            passed++;
        } else {
            console.log(`❌ FAIL: Average time ${avgTime.toFixed(2)}ms > 15ms requirement`);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH:', error.message);
        failed++;
    }
    
    // TEST 10: CONFIGURATION CHECK
    console.log('\nTEST 10: Configuration - Threshold Verification');
    try {
        const summary = filter.getFilterSummary();
        
        const expectedConfig = {
            fresh_gem_min: 50000,
            fresh_gem_max: 5000000,
            established_min: 250000,
            established_max: 50000000
        };
        
        const actualConfig = {
            fresh_gem_min: parseInt(summary.fresh_gem.min_cap.replace(/[$,]/g, '')),
            fresh_gem_max: parseInt(summary.fresh_gem.max_cap.replace(/[$,]/g, '')),
            established_min: parseInt(summary.established.min_cap.replace(/[$,]/g, '')),
            established_max: parseInt(summary.established.max_cap.replace(/[$,]/g, ''))
        };
        
        if (JSON.stringify(expectedConfig) === JSON.stringify(actualConfig)) {
            console.log('✅ PASS: All thresholds configured correctly');
            console.log('   Fresh Gem Range:', summary.fresh_gem.min_cap, '-', summary.fresh_gem.max_cap);
            console.log('   Established Range:', summary.established.min_cap, '-', summary.established.max_cap);
            passed++;
        } else {
            console.log('❌ FAIL: Threshold mismatch');
            console.log('   Expected:', expectedConfig);
            console.log('   Actual:', actualConfig);
            failed++;
        }
    } catch (error) {
        console.log('❌ CRASH:', error.message);
        failed++;
    }
    
    // FINAL RESULTS
    console.log('\n' + '='.repeat(60));
    console.log('🏁 INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ PASSED: ${passed}`);
    console.log(`❌ FAILED: ${failed}`);
    console.log(`📊 SUCCESS RATE: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
        console.log('\n🎯 ALL TESTS PASSED - READY FOR SYSTEM INTEGRATION');
        console.log('Next: Test with real RPC Pool and Token Data');
    } else {
        console.log('\n⚠️  SOME TESTS FAILED - FIX BEFORE PROCEEDING');
        console.log('Review failed tests and fix code issues');
    }
}

// RUN THE TESTS
runIntegrationTests().catch(console.error);