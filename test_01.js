#!/usr/bin/env node

/**
 * RENAISSANCE TEST #1: NULL SUPPLY DATA CRASH
 * 
 * Testing Line 458 crash scenario: parseInt(supplyResult.data.supply.amount)
 * Scenario: RPC returns null/undefined for supply.amount during high load
 * Impact: System crash during viral meme coin launch = Lost profits
 */

console.log('🧪 RENAISSANCE TEST #1: NULL Supply Data Crash');
console.log('📍 Testing Line 458: parseInt(supplyResult.data.supply.amount)');
console.log('🎯 Scenario: RPC failure during viral meme coin launch\n');

// Simulate the exact code from Line 458 in fetchTokenMetadataRobust()
function simulateSupplyParsing(supplyResult, testName) {
    console.log(`\n--- ${testName} ---`);
    console.log('Supply Result:', JSON.stringify(supplyResult, null, 2));
    
    try {
        // EXACT LINE 458 CODE FROM ORIGINAL
        const supply = parseInt(supplyResult.data.supply.amount);
        const decimals = parseInt(supplyResult.data.supply.decimals) || 9;
        
        console.log(`✅ RESULT: supply = ${supply}, decimals = ${decimals}`);
        
        // Check for NaN contamination
        if (isNaN(supply)) {
            console.log('⚠️  WARNING: Supply is NaN - Will contaminate calculations!');
            return { 
                crashed: false, 
                wrongResult: true, 
                supply: supply,
                moneyImpact: 'HIGH - NaN breaks all math calculations' 
            };
        }
        
        return { 
            crashed: false, 
            wrongResult: false, 
            supply: supply,
            moneyImpact: 'NONE - Works correctly' 
        };
        
    } catch (error) {
        console.log(`❌ CRASH: ${error.name}: ${error.message}`);
        return { 
            crashed: true, 
            wrongResult: false, 
            error: error.message,
            moneyImpact: 'CRITICAL - System down during profit window' 
        };
    }
}

// TEST SCENARIOS - Based on real Solana RPC failure modes

console.log('Testing scenarios based on actual Helius/ChainStack RPC failures...\n');

const testScenarios = [
    {
        name: 'SCENARIO 1: Complete NULL Response',
        data: null
    },
    {
        name: 'SCENARIO 2: Missing data field',
        data: { success: true }
    },
    {
        name: 'SCENARIO 3: Missing supply field', 
        data: { data: {} }
    },
    {
        name: 'SCENARIO 4: NULL supply',
        data: { data: { supply: null } }
    },
    {
        name: 'SCENARIO 5: Missing amount field (common RPC partial failure)',
        data: { data: { supply: { decimals: 9 } } }
    },
    {
        name: 'SCENARIO 6: Undefined amount field',
        data: { data: { supply: { amount: undefined, decimals: 9 } } }
    },
    {
        name: 'SCENARIO 7: Empty string amount',
        data: { data: { supply: { amount: '', decimals: 9 } } }
    },
    {
        name: 'SCENARIO 8: Non-numeric amount',
        data: { data: { supply: { amount: 'invalid', decimals: 9 } } }
    },
    {
        name: 'SCENARIO 9: Working case (control test)',
        data: { data: { supply: { amount: '1000000000', decimals: 9 } } }
    }
];

// Run all test scenarios
const results = [];

testScenarios.forEach(scenario => {
    const result = simulateSupplyParsing(scenario, scenario.name);
    results.push({
        scenario: scenario.name,
        ...result
    });
});

// Analysis
console.log('\n' + '='.repeat(80));
console.log('🏛️  RENAISSANCE SYSTEMATIC ANALYSIS');
console.log('='.repeat(80));

let crashCount = 0;
let wrongResultCount = 0;
let criticalIssues = [];

results.forEach(result => {
    if (result.crashed) {
        crashCount++;
        criticalIssues.push(`${result.scenario}: SYSTEM CRASH`);
    } else if (result.wrongResult) {
        wrongResultCount++;
        criticalIssues.push(`${result.scenario}: WRONG RESULT (${result.supply})`);
    }
});

console.log(`\n📊 TEST RESULTS:`);
console.log(`   Total Tests: ${results.length}`);
console.log(`   System Crashes: ${crashCount}`);
console.log(`   Wrong Results: ${wrongResultCount}`);
console.log(`   Working Correctly: ${results.length - crashCount - wrongResultCount}`);

if (criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES FOUND:`);
    criticalIssues.forEach(issue => console.log(`   ${issue}`));
}

// Financial Impact Analysis
console.log(`\n💰 FINANCIAL IMPACT ANALYSIS:`);
console.log(`   Crash During Viral Launch: ${crashCount > 0 ? 'LOSES $1000-$5000+ per incident' : 'No crash risk'}`);
console.log(`   Wrong Calculations: ${wrongResultCount > 0 ? 'LOSES money on bad trades' : 'No calculation errors'}`);
console.log(`   System Reliability: ${crashCount === 0 ? 'RELIABLE' : 'UNRELIABLE - Crashes in production'}`);

// Competitive Advantage Impact  
console.log(`\n🏁 COMPETITIVE ADVANTAGE IMPACT:`);
if (crashCount > 0) {
    console.log(`   ❌ DISADVANTAGE: System crashes while retail traders continue manually`);
    console.log(`   ❌ LOST OPPORTUNITIES: Each crash = missed 10-30 second profit window`);
    console.log(`   ❌ REPUTATION DAMAGE: Unreliable system loses user confidence`);
} else if (wrongResultCount > 0) {
    console.log(`   ⚠️  REDUCED ADVANTAGE: Wrong calculations lead to bad trades`);
    console.log(`   ⚠️  TRUST ISSUES: Users notice incorrect analysis results`);
} else {
    console.log(`   ✅ ADVANTAGE MAINTAINED: System handles RPC failures gracefully`);
    console.log(`   ✅ RELIABILITY EDGE: More stable than retail manual methods`);
}

// Renaissance Verdict
console.log(`\n🏛️  RENAISSANCE VERDICT:`);
if (crashCount > 0) {
    console.log(`   📊 BUG CONFIRMED: Line 458 parseInt() crash is REAL and CRITICAL`);
    console.log(`   💡 FIX REQUIRED: Add null safety: parseInt(supply?.amount || '0') || 0`);
    console.log(`   🚀 DEPLOY STATUS: DO NOT DEPLOY until fixed`);
} else if (wrongResultCount > 0) {
    console.log(`   📊 BUG CONFIRMED: Line 458 creates wrong results (NaN contamination)`);
    console.log(`   💡 FIX REQUIRED: Add NaN protection and validation`);
    console.log(`   🚀 DEPLOY STATUS: Fix before deployment`);
} else {
    console.log(`   📊 BUG NOT CONFIRMED: Line 458 handles failures correctly`);
    console.log(`   💡 NO FIX NEEDED: Code appears robust`);
    console.log(`   🚀 DEPLOY STATUS: This aspect is production ready`);
}

console.log(`\n🧪 TEST #1 COMPLETE - Ready for Test #2: Missing Amount Field Crash`);
console.log('='.repeat(80));