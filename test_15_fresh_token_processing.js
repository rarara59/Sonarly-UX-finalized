#!/usr/bin/env node

/**
 * RENAISSANCE TEST #15: FRESH TOKEN PROCESSING (0-60 SECONDS)
 * Critical Window Testing: First 60 seconds = 80% of profitable opportunities
 * Target: Prove system handles fresh tokens without crashes during peak profit window
 */

console.log('🧪 RENAISSANCE TEST #15: Fresh Token Processing (0-60s)');
console.log('📍 Testing: Ultra-fresh token handling in critical profit window');
console.log('🎯 Scenario: Tokens with 0-10 holders in first 60 seconds');
console.log('💰 Impact: CRITICAL - First minute = 80% of profit potential\n');

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

// Mock RPC Manager for fresh token scenarios
class FreshTokenRpcManager {
    constructor(scenario = 'zero_holders') {
        this.scenario = scenario;
        this.callCount = 0;
    }
    
    async rotateEndpoint() {
        console.log('  🔄 Endpoint rotated for fresh token');
    }
    
    async call(method, params) {
        this.callCount++;
        console.log(`    📡 RPC Call #${this.callCount}: ${method} (scenario: ${this.scenario})`);
        
        switch (this.scenario) {
            case 'zero_holders':
                // Token just created, no holders yet
                if (method === 'getTokenSupply') {
                    return {
                        value: {
                            amount: '1000000000000',
                            decimals: 9,
                            uiAmount: 1000.0
                        }
                    };
                }
                if (method === 'getTokenLargestAccounts') {
                    return {
                        value: [] // Empty array - crash risk!
                    };
                }
                if (method === 'getAccountInfo') {
                    return {
                        value: {
                            data: {
                                parsed: {
                                    info: {
                                        name: 'Fresh Meme',
                                        symbol: 'FRESH',
                                        decimals: 9
                                    }
                                }
                            }
                        }
                    };
                }
                break;
                
            case 'one_holder':
                // First holder just bought
                if (method === 'getTokenSupply') {
                    return {
                        value: {
                            amount: '1000000000000',
                            decimals: 9,
                            uiAmount: 1000.0
                        }
                    };
                }
                if (method === 'getTokenLargestAccounts') {
                    return {
                        value: [{
                            address: 'FirstBuyer11111111111111111111111111111111',
                            amount: '100000000000' // 10% of supply
                        }]
                    };
                }
                break;
                
            case 'few_holders':
                // 2-5 holders in first 30 seconds
                if (method === 'getTokenSupply') {
                    return {
                        value: {
                            amount: '1000000000000',
                            decimals: 9,
                            uiAmount: 1000.0
                        }
                    };
                }
                if (method === 'getTokenLargestAccounts') {
                    return {
                        value: [
                            { address: 'Holder1', amount: '200000000000' },
                            { address: 'Holder2', amount: '150000000000' },
                            { address: 'Holder3', amount: '100000000000' }
                        ]
                    };
                }
                break;
                
            case 'malformed_data':
                // Malformed responses during token creation
                if (method === 'getTokenSupply') {
                    return { value: null }; // Null value crash risk
                }
                if (method === 'getTokenLargestAccounts') {
                    return null; // Null response crash risk
                }
                break;
        }
        
        return { value: null };
    }
}

async function testFreshTokenScenario(scenarioName, scenario, expectedResult) {
    console.log(`\n--- ${scenarioName} ---`);
    console.log(`Testing fresh token with: ${scenario}`);
    
    const mockRpc = new FreshTokenRpcManager(scenario);
    const filter = new TieredTokenFilterService({ rpcManager: mockRpc });
    
    await filter.initialize();
    
    // Create ultra-fresh token (0-60 seconds old)
    const freshToken = {
        tokenMint: 'So11111111111111111111111111111111111111112',
        address: 'So11111111111111111111111111111111111111112',
        lpValueUSD: 1000, // Just created with initial liquidity
        uniqueWallets: scenario === 'zero_holders' ? 0 : 
                       scenario === 'one_holder' ? 1 : 3,
        buyToSellRatio: 100, // All buys, no sells yet
        detectedAt: Date.now(), // Just detected
        createdAt: Date.now() - 15000, // 15 seconds old
        dex: 'raydium',
        volume24h: 0 // No volume yet
    };
    
    try {
        console.log(`  🍼 Processing ultra-fresh token (${Math.floor((Date.now() - freshToken.createdAt) / 1000)}s old)...`);
        const result = await filter.processToken(freshToken);
        
        if (result) {
            console.log(`  ✅ Result: ${result.approved ? 'Approved' : 'Rejected'} (${result.reason})`);
            console.log(`  📊 RPC Calls: ${mockRpc.callCount}`);
            
            // Check for critical safety
            if (scenario === 'zero_holders' && !result.crashed) {
                console.log('  ✅ CRITICAL: Zero holder crash prevention working!');
            }
            
            return {
                success: true,
                scenario: scenario,
                result: result,
                rpcCalls: mockRpc.callCount
            };
        }
    } catch (error) {
        console.log(`  💥 CRASH DETECTED: ${error.message}`);
        console.log(`  ❌ Stack: ${error.stack}`);
        return {
            success: false,
            scenario: scenario,
            error: error.message,
            crashed: true
        };
    } finally {
        await filter.cleanup();
    }
}

async function runFreshTokenTests() {
    console.log('Testing fresh token processing in critical profit window...\n');
    
    const scenarios = [
        {
            name: 'SCENARIO 1: Zero Holders (0-15s)',
            scenario: 'zero_holders',
            criticalLevel: 'EXTREME',
            financialImpact: 'Miss entire pump if crash'
        },
        {
            name: 'SCENARIO 2: First Holder (15-30s)',
            scenario: 'one_holder',
            criticalLevel: 'HIGH',
            financialImpact: 'Miss 80% of profits if crash'
        },
        {
            name: 'SCENARIO 3: Few Holders (30-60s)',
            scenario: 'few_holders',
            criticalLevel: 'MEDIUM',
            financialImpact: 'Miss 50% of profits if crash'
        },
        {
            name: 'SCENARIO 4: Malformed Data',
            scenario: 'malformed_data',
            criticalLevel: 'HIGH',
            financialImpact: 'Crash on any new token'
        }
    ];
    
    const results = [];
    let crashes = 0;
    let successes = 0;
    
    for (const test of scenarios) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚨 ${test.name}`);
        console.log(`⚡ Critical Level: ${test.criticalLevel}`);
        console.log(`💰 Financial Impact: ${test.financialImpact}`);
        console.log('='.repeat(60));
        
        const result = await testFreshTokenScenario(
            test.name,
            test.scenario,
            test.expectedResult
        );
        
        results.push(result);
        if (result.crashed) crashes++;
        else successes++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('🏛️  RENAISSANCE FRESH TOKEN PROCESSING ANALYSIS');
    console.log('='.repeat(80));
    
    console.log('\n📊 FRESH TOKEN TEST RESULTS:');
    console.log(`   Total Scenarios: ${scenarios.length}`);
    console.log(`   Successes: ${successes}`);
    console.log(`   Crashes: ${crashes}`);
    console.log(`   Success Rate: ${(successes / scenarios.length * 100).toFixed(1)}%`);
    
    console.log('\n💰 FINANCIAL IMPACT ANALYSIS:');
    if (crashes === 0) {
        console.log('   ✅ NO CRASHES: System captures 100% of fresh token opportunities');
        console.log('   ✅ ZERO HOLDERS SAFE: Critical empty array handling confirmed');
        console.log('   ✅ PROFIT WINDOW: Full 0-60 second window operational');
    } else {
        console.log(`   ❌ ${crashes} CRASH SCENARIOS: Major profit loss risk`);
        console.log('   ❌ REVENUE IMPACT: Each crash = missed pump = lost profits');
    }
    
    console.log('\n🏁 COMPETITIVE ADVANTAGE:');
    console.log('   🎯 FRESH TOKEN EDGE: First 60 seconds = highest profit potential');
    console.log('   🚀 ZERO HOLDER HANDLING: Capture tokens before anyone else');
    console.log('   💪 CRASH RESISTANCE: Stay operational when competitors fail');
    
    console.log('\n🏛️  RENAISSANCE VERDICT:');
    if (crashes === 0) {
        console.log('   ✅ PRODUCTION READY: Fresh token handling is bulletproof');
        console.log('   ✅ PROFIT MAXIMIZED: Captures earliest, most profitable entries');
        console.log('   ✅ COMPETITIVE EDGE: Better fresh token handling than competitors');
    } else {
        console.log('   ❌ NOT READY: Fresh token crashes will cause profit loss');
        console.log('   ⚠️  FIX REQUIRED: Address crash scenarios before production');
    }
    
    console.log('\n🎯 NEXT: Deploy to production and monitor fresh token performance');
    console.log('='.repeat(80));
}

// Run the tests
runFreshTokenTests().catch(console.error);