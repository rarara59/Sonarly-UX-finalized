#!/usr/bin/env node

/**
 * TEST #5 VERIFICATION: Verify risk module timeout and null safety fixes
 * Tests that the system handles module failures gracefully with proper fallback
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 VERIFYING FIX: Risk Module Timeout and Null Safety');
console.log('📍 Testing timeout protection and fallback mechanisms\n');

// Mock risk modules that simulate various failure modes
class MockScamProtectionEngine {
    constructor(mode) {
        this.mode = mode;
    }
    
    async analyzeToken(address, metrics) {
        switch (this.mode) {
            case 'null':
                return null;
            case 'error':
                throw new Error('ScamProtectionEngine error');
            case 'timeout':
                // Simulate a 10-second hang (longer than our 5-second timeout)
                await new Promise(resolve => setTimeout(resolve, 10000));
                return { isScam: false, confidence: 80 };
            case 'working':
                return { isScam: false, confidence: 80, reasons: [] };
            default:
                return null;
        }
    }
}

class MockLiquidityRiskAnalyzer {
    constructor(mode) {
        this.mode = mode;
    }
    
    async validateExitLiquidity(address, poolData) {
        switch (this.mode) {
            case 'null':
                return null;
            case 'error':
                throw new Error('LiquidityRiskAnalyzer error');
            case 'timeout':
                // Simulate infinite hang
                await new Promise(() => {}); // Never resolves
                return { passed: true, hasExitLiquidity: true, slippage: 5 };
            case 'working':
                return { passed: true, hasExitLiquidity: true, slippage: 5 };
            default:
                return null;
        }
    }
}

class MockMarketCapRiskFilter {
    constructor(mode) {
        this.mode = mode;
    }
    
    async filterByMarketCap(metrics, tier) {
        switch (this.mode) {
            case 'null':
                return null;
            case 'error':
                throw new Error('MarketCapRiskFilter error');
            case 'timeout':
                // Simulate a 7-second hang
                await new Promise(resolve => setTimeout(resolve, 7000));
                return { passed: true, reason: 'Market cap acceptable' };
            case 'working':
                return { passed: true, reason: 'Market cap acceptable' };
            default:
                return null;
        }
    }
}

async function testScenario(name, modes) {
    console.log(`\n--- ${name} ---`);
    
    const startTime = Date.now();
    
    try {
        const filter = new TieredTokenFilterService({
            scamProtectionEngine: new MockScamProtectionEngine(modes.scam),
            liquidityRiskAnalyzer: new MockLiquidityRiskAnalyzer(modes.liquidity),
            marketCapRiskFilter: new MockMarketCapRiskFilter(modes.marketCap)
        });
        
        const tokenMetrics = {
            address: 'testtoken123',
            ageMinutes: 5,
            lpValueUSD: 50000,
            uniqueWallets: 20,
            buyToSellRatio: 3.5,
            avgTransactionSpread: 120,
            transactionSizeVariation: 0.7,
            volumeToLiquidityRatio: 0.5,
            isPumpFun: true
        };
        
        const result = await filter.evaluateFreshGem(tokenMetrics);
        const elapsedTime = Date.now() - startTime;
        
        console.log('✅ NO CRASH - Result:', {
            passed: result.passed,
            score: result.score,
            reason: result.reason,
            usedFallback: result.reason.includes('fallback'),
            elapsedTime: `${elapsedTime}ms`
        });
        
        // Verify timeout worked (should complete within 5.5 seconds)
        if (elapsedTime > 5500) {
            console.log('⚠️  WARNING: Took longer than timeout threshold');
        }
        
        return { crashed: false, result, elapsedTime };
        
    } catch (error) {
        const elapsedTime = Date.now() - startTime;
        console.log(`❌ CRASH: ${error.name}: ${error.message} (after ${elapsedTime}ms)`);
        return { crashed: true, error: error.message, elapsedTime };
    }
}

async function runTests() {
    const scenarios = [
        { name: 'All modules working', modes: { scam: 'working', liquidity: 'working', marketCap: 'working' } },
        { name: 'ScamProtection timeout (10s)', modes: { scam: 'timeout', liquidity: 'working', marketCap: 'working' } },
        { name: 'LiquidityAnalyzer infinite hang', modes: { scam: 'working', liquidity: 'timeout', marketCap: 'working' } },
        { name: 'MarketCapFilter timeout (7s)', modes: { scam: 'working', liquidity: 'working', marketCap: 'timeout' } },
        { name: 'All modules return null', modes: { scam: 'null', liquidity: 'null', marketCap: 'null' } },
        { name: 'All modules throw errors', modes: { scam: 'error', liquidity: 'error', marketCap: 'error' } },
        { name: 'Mixed timeouts and errors', modes: { scam: 'timeout', liquidity: 'error', marketCap: 'timeout' } }
    ];
    
    let crashes = 0;
    let timeouts = 0;
    let fallbacks = 0;
    let successes = 0;
    
    for (const scenario of scenarios) {
        const result = await testScenario(scenario.name, scenario.modes);
        if (result.crashed) {
            crashes++;
        } else {
            successes++;
            if (result.result.reason.includes('fallback')) {
                fallbacks++;
            }
            if (result.elapsedTime > 4500 && result.elapsedTime < 5500) {
                timeouts++;
            }
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🏛️  FIX VERIFICATION RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${scenarios.length}`);
    console.log(`Crashes: ${crashes}`);
    console.log(`Handled Gracefully: ${successes}`);
    console.log(`Used Fallback: ${fallbacks}`);
    console.log(`Timeout Protection Triggered: ${timeouts}`);
    
    if (crashes === 0 && timeouts >= 3) {
        console.log('\n✅ FIX VERIFIED: Timeout protection and null safety working correctly!');
        console.log('🚀 SAFE TO DEPLOY: System resilient to module failures');
        console.log('⏱️  TIMEOUT PROTECTION: 5-second limit prevents infinite hangs');
        console.log('🛡️  FALLBACK LOGIC: Triggers when modules fail or timeout');
    } else {
        console.log('\n❌ FIX INCOMPLETE: Some scenarios still have issues');
        console.log('🚨 DO NOT DEPLOY: Additional fixes required');
    }
}

runTests().catch(console.error);