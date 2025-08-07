#!/usr/bin/env node

/**
 * RENAISSANCE TEST #1 (CORRECTED): NULL SUPPLY DATA CRASH
 * 
 * CORRECTED: Proper data structure matching validateTokenWithRetry() return format
 * Testing Line 458: parseInt(supplyResult.data.supply.amount)
 * Scenario: RPC returns various failure modes during high load
 * Impact: System crash during viral meme coin launch = Lost profits
 */

console.log('🧪 RENAISSANCE TEST #1 (CORRECTED): NULL Supply Data Crash');
console.log('📍 Testing Line 458: parseInt(supplyResult.data.supply.amount)');
console.log('🎯 Scenario: validateTokenWithRetry() failure modes during viral launch');
console.log('🔧 CORRECTED: Proper data structure matching production code\n');

// Simulate the exact code path from fetchTokenMetadataRobust() calling validateTokenWithRetry()
function simulateSupplyParsing(supplyResult, testName) {
    console.log(`\n--- ${testName} ---`);
    console.log('Supply Result Structure:', JSON.stringify(supplyResult, null, 2));
    
    try {
        // EXACT CODE PATH: validateTokenWithRetry() returns supplyResult
        // Then Line 458-459 in fetchTokenMetadataRobust():
        const supply = parseInt(supplyResult.data.supply.amount);
        const decimals = parseInt(supplyResult.data.supply.decimals) || 9;
        
        console.log(`✅ RESULT: supply = ${supply}, decimals = ${decimals}`);
        
        // Check for NaN contamination (critical for money calculations)
        if (isNaN(supply)) {
            console.log('⚠️  NaN CONTAMINATION: Supply calculation will break all subsequent math!');
            return { 
                crashed: false, 
                wrongResult: true, 
                supply: supply,
                issue: 'NaN_CONTAMINATION',
                moneyImpact: 'HIGH - Breaks holder percentage, market cap calculations' 
            };
        }
        
        // Check for negative/invalid values
        if (supply < 0) {
            console.log('⚠️  INVALID SUPPLY: Negative supply will break security calculations!');
            return {
                crashed: false,
                wrongResult: true,
                supply: supply,
                issue: 'NEGATIVE_SUPPLY',
                moneyImpact: 'MEDIUM - Invalid security analysis'
            };
        }
        
        return { 
            crashed: false, 
            wrongResult: false, 
            supply: supply,
            decimals: decimals,
            issue: null,
            moneyImpact: 'NONE - Works correctly' 
        };
        
    } catch (error) {
        console.log(`❌ SYSTEM CRASH: ${error.name}: ${error.message}`);
        return { 
            crashed: true, 
            wrongResult: false, 
            error: error.message,
            issue: 'CRASH',
            moneyImpact: 'CRITICAL - System down during profit window' 
        };
    }
}

console.log('Testing with CORRECTED data structures matching validateTokenWithRetry()...\n');

// CORRECTED TEST SCENARIOS - Matching actual validateTokenWithRetry() return format
const testScenarios = [
    {
        name: 'SCENARIO 1: validateTokenWithRetry() returns null (complete failure)',
        result: null
    },
    {
        name: 'SCENARIO 2: validateTokenWithRetry() success=false',
        result: { success: false, error: 'RPC timeout' }
    },
    {
        name: 'SCENARIO 3: validateTokenWithRetry() missing data field',
        result: { success: true }
    },
    {
        name: 'SCENARIO 4: validateTokenWithRetry() data.supply is null',
        result: { success: true, data: { supply: null } }
    },
    {
        name: 'SCENARIO 5: validateTokenWithRetry() data.supply missing amount (common)',
        result: { 
            success: true, 
            data: { 
                supply: { 
                    decimals: 9,
                    uiAmount: 1.0,
                    uiAmountString: "1.0"
                } 
            } 
        }
    },
    {
        name: 'SCENARIO 6: validateTokenWithRetry() data.supply.amount is undefined',
        result: { 
            success: true, 
            data: { 
                supply: { 
                    amount: undefined,
                    decimals: 9 
                } 
            } 
        }
    },
    {
        name: 'SCENARIO 7: validateTokenWithRetry() data.supply.amount is empty string',
        result: { 
            success: true, 
            data: { 
                supply: { 
                    amount: "",
                    decimals: 9 
                } 
            } 
        }
    },
    {
        name: 'SCENARIO 8: validateTokenWithRetry() data.supply.amount is non-numeric',
        result: { 
            success: true, 
            data: { 
                supply: { 
                    amount: "invalid_number",
                    decimals: 9 
                } 
            } 
        }
    },
    {
        name: 'SCENARIO 9: validateTokenWithRetry() working case (control)',
        result: { 
            success: true, 
            data: { 
                supply: { 
                    amount: "1000000000",
                    decimals: 9,
                    uiAmount: 1.0,
                    uiAmountString: "1.0"
                } 
            } 
        }
    },
    {
        name: 'SCENARIO 10: validateTokenWithRetry() zero supply (edge case)',
        result: { 
            success: true, 
            data: { 
                supply: { 
                    amount: "0",
                    decimals: 9 
                } 
            } 
        }
    }
];

// Run all corrected test scenarios
const results = [];

testScenarios.forEach(scenario => {
    const result = simulateSupplyParsing(scenario.result, scenario.name);
    results.push({
        scenario: scenario.name,
        ...result
    });
});

// Renaissance Analysis
console.log('\n' + '='.repeat(90));
console.log('🏛️  RENAISSANCE SYSTEMATIC ANALYSIS (CORRECTED)');
console.log('='.repeat(90));

let crashCount = 0;
let nanCount = 0;
let wrongResultCount = 0;
let workingCount = 0;
let criticalIssues = [];

results.forEach(result => {
    if (result.crashed) {
        crashCount++;
        criticalIssues.push(`${result.scenario.split(':')[0]}: SYSTEM CRASH - ${result.error}`);
    } else if (result.issue === 'NaN_CONTAMINATION') {
        nanCount++;
        criticalIssues.push(`${result.scenario.split(':')[0]}: NaN CONTAMINATION (supply=${result.supply})`);
    } else if (result.wrongResult) {
        wrongResultCount++;
        criticalIssues.push(`${result.scenario.split(':')[0]}: WRONG RESULT - ${result.issue}`);
    } else {
        workingCount++;
    }
});

console.log(`\n📊 CORRECTED TEST RESULTS:`);
console.log(`   Total Tests: ${results.length}`);
console.log(`   System Crashes: ${crashCount}`);
console.log(`   NaN Contamination: ${nanCount}`);
console.log(`   Other Wrong Results: ${wrongResultCount}`);
console.log(`   Working Correctly: ${workingCount}`);

if (criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES FOUND:`);
    criticalIssues.forEach(issue => console.log(`   ${issue}`));
}

// Financial Impact Analysis
console.log(`\n💰 FINANCIAL IMPACT ANALYSIS:`);
if (crashCount > 0) {
    console.log(`   System Crashes: ${crashCount} scenarios → LOSES $1000-$5000+ per incident`);
    console.log(`   Critical Window: Crashes during 10-30 second viral launch window`);
}
if (nanCount > 0) {
    console.log(`   NaN Contamination: ${nanCount} scenarios → WRONG CALCULATIONS = Bad trades`);
    console.log(`   Math Corruption: Breaks holder analysis, market cap, security scores`);
}
if (workingCount === results.length) {
    console.log(`   ✅ NO FINANCIAL RISK: All scenarios handled correctly`);
} else {
    console.log(`   ⚠️  FINANCIAL RISK: ${crashCount + nanCount + wrongResultCount} failure scenarios`);
}

// Competitive Advantage Impact  
console.log(`\n🏁 COMPETITIVE ADVANTAGE IMPACT:`);
const failureRate = ((crashCount + nanCount + wrongResultCount) / results.length * 100).toFixed(1);
if (crashCount > 0) {
    console.log(`   ❌ CRITICAL DISADVANTAGE: ${failureRate}% scenarios crash system`);
    console.log(`   ❌ RELIABILITY ISSUE: Retail traders more stable than our system`);
    console.log(`   ❌ LOST OPPORTUNITIES: Each crash = missed profit window during viral launches`);
} else if (nanCount > 0) {
    console.log(`   ⚠️  CALCULATION ERRORS: ${failureRate}% scenarios produce wrong results`);
    console.log(`   ⚠️  TRUST DEGRADATION: Users notice incorrect token analysis`);
    console.log(`   ⚠️  BAD TRADES: Wrong calculations lead to losing positions`);
} else {
    console.log(`   ✅ ADVANTAGE MAINTAINED: 100% scenarios handled correctly`);
    console.log(`   ✅ RELIABILITY EDGE: More stable than retail manual methods`);
    console.log(`   ✅ CONSISTENT PROFITS: Accurate calculations enable good trades`);
}

// Renaissance Verdict
console.log(`\n🏛️  RENAISSANCE VERDICT:`);
if (crashCount > 0) {
    console.log(`   📊 CRITICAL BUG CONFIRMED: Line 458 crashes in ${crashCount}/${results.length} scenarios`);
    console.log(`   💡 IMMEDIATE FIX REQUIRED:`);
    console.log(`      OLD: metadata.supply = parseInt(supplyResult.data.supply.amount);`);
    console.log(`      NEW: metadata.supply = parseInt(supplyResult.data?.supply?.amount || '0') || 0;`);
    console.log(`   🚨 DEPLOY STATUS: DO NOT DEPLOY - Critical crash risk`);
} else if (nanCount > 0) {
    console.log(`   📊 NaN BUG CONFIRMED: Line 458 creates NaN in ${nanCount}/${results.length} scenarios`);
    console.log(`   💡 FIX REQUIRED: Add NaN validation and fallback values`);
    console.log(`   ⚠️  DEPLOY STATUS: Fix before deployment - Calculation corruption risk`);
} else {
    console.log(`   📊 NO BUG FOUND: Line 458 handles all ${results.length} failure scenarios correctly`);
    console.log(`   💡 ANALYSIS UPDATE: Code appears more robust than initially assessed`);
    console.log(`   ✅ DEPLOY STATUS: This component appears production ready`);
}

console.log(`\n🎯 NEXT: Test #2 - Empty Accounts Array Crash (Line 311-314)`);
console.log('='.repeat(90));