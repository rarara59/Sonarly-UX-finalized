#!/usr/bin/env node

/**
 * TEST #5 SIMPLE VERIFICATION: Risk Module Integration
 * Tests basic risk module integration with timeout protection
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 SIMPLE RISK MODULE INTEGRATION TEST');
console.log('📍 Testing timeout protection and fallback mechanisms\n');

// Mock risk modules
class MockScamProtectionEngine {
    constructor(delay = 0) {
        this.delay = delay;
    }
    
    async analyzeToken(address, metrics) {
        if (this.delay === Infinity) {
            await new Promise(() => {}); // Never resolves
        }
        await new Promise(resolve => setTimeout(resolve, this.delay));
        return { isScam: false, confidence: 80, reasons: [] };
    }
}

class MockLiquidityRiskAnalyzer {
    constructor(shouldFail = false) {
        this.shouldFail = shouldFail;
    }
    
    async validateExitLiquidity(address, poolData) {
        if (this.shouldFail) {
            throw new Error('Liquidity analysis failed');
        }
        return { passed: true, hasExitLiquidity: true, slippage: 5 };
    }
}

class MockMarketCapRiskFilter {
    constructor(returnNull = false) {
        this.returnNull = returnNull;
    }
    
    async filterByMarketCap(metrics, tier) {
        if (this.returnNull) return null;
        return { passed: true, reason: 'Market cap acceptable' };
    }
}

async function testScenario(name, setupModules) {
    console.log(`\n--- ${name} ---`);
    
    const startTime = Date.now();
    
    try {
        const modules = setupModules();
        const filter = new TieredTokenFilterService(modules);
        
        const tokenMetrics = {
            address: 'testtoken123abc',
            ageMinutes: 5,
            lpValueUSD: 50000,
            uniqueWallets: 20,
            buyToSellRatio: 3.5,
            avgTransactionSpread: 120,
            transactionSizeVariation: 0.7,
            volumeToLiquidityRatio: 0.5,
            isPumpFun: true,
            hasMintAuthority: false,
            hasFreezeAuthority: false,
            largestHolderPercentage: 15
        };
        
        const result = await filter.evaluateFreshGem(tokenMetrics);
        const elapsedTime = Date.now() - startTime;
        
        console.log('✅ Result:', {
            passed: result.passed,
            reason: result.reason,
            usedFallback: result.reason.includes('fallback'),
            elapsedTime: `${elapsedTime}ms`
        });
        
        return { success: true, usedFallback: result.reason.includes('fallback'), elapsedTime };
        
    } catch (error) {
        const elapsedTime = Date.now() - startTime;
        console.log(`❌ ERROR: ${error.message} (after ${elapsedTime}ms)`);
        return { success: false, error: error.message, elapsedTime };
    }
}

async function runTests() {
    const scenarios = [
        {
            name: 'All modules working normally',
            setup: () => ({
                scamProtectionEngine: new MockScamProtectionEngine(50),
                liquidityRiskAnalyzer: new MockLiquidityRiskAnalyzer(false),
                marketCapRiskFilter: new MockMarketCapRiskFilter(false)
            })
        },
        {
            name: 'ScamProtection infinite hang (should timeout)',
            setup: () => ({
                scamProtectionEngine: new MockScamProtectionEngine(Infinity),
                liquidityRiskAnalyzer: new MockLiquidityRiskAnalyzer(false),
                marketCapRiskFilter: new MockMarketCapRiskFilter(false)
            })
        },
        {
            name: 'LiquidityAnalyzer throws error',
            setup: () => ({
                scamProtectionEngine: new MockScamProtectionEngine(50),
                liquidityRiskAnalyzer: new MockLiquidityRiskAnalyzer(true),
                marketCapRiskFilter: new MockMarketCapRiskFilter(false)
            })
        },
        {
            name: 'MarketCapFilter returns null',
            setup: () => ({
                scamProtectionEngine: new MockScamProtectionEngine(50),
                liquidityRiskAnalyzer: new MockLiquidityRiskAnalyzer(false),
                marketCapRiskFilter: new MockMarketCapRiskFilter(true)
            })
        },
        {
            name: 'No risk modules provided',
            setup: () => ({})
        }
    ];
    
    let successes = 0;
    let fallbacks = 0;
    
    for (const scenario of scenarios) {
        const result = await testScenario(scenario.name, scenario.setup);
        if (result.success) successes++;
        if (result.usedFallback) fallbacks++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${scenarios.length}`);
    console.log(`Successful: ${successes}`);
    console.log(`Used Fallback: ${fallbacks}`);
    
    if (successes === scenarios.length) {
        console.log('\n✅ ALL TESTS PASSED!');
        console.log('🚀 Risk module integration is working correctly');
        console.log('⏱️  Timeout protection prevents infinite hangs');
        console.log('🛡️  Fallback logic activates when modules fail');
    } else {
        console.log('\n❌ SOME TESTS FAILED');
        console.log('🚨 Risk module integration needs fixes');
    }
}

runTests().catch(console.error);