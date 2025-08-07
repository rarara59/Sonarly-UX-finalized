#!/usr/bin/env node

/**
 * RENAISSANCE TEST #4: STRING MATH/NaN CONTAMINATION
 * 
 * Testing: Mathematical operations and type coercion throughout token analysis
 * Scenario: RPC data arrives as strings, calculations mix types, NaN propagation
 * Impact: Wrong calculations = Bad trades, corrupted risk analysis = Lost money
 */

console.log('🧪 RENAISSANCE TEST #4: String Math/NaN Contamination');
console.log('📍 Testing: JavaScript type coercion and mathematical operations');
console.log('🎯 Scenario: RPC returns strings, calculations mix types');
console.log('💰 Impact: Wrong math = Bad trades, NaN contamination = Corrupted analysis\n');

// Simulate mathematical operations from various parts of the token analysis
class MathOperationsSimulator {
    constructor() {
        this.calculations = [];
        this.errors = [];
    }

    // Test volume calculations (common source of string math bugs)
    calculateVolumeToLiquidityRatio(volume24h, lpValueUSD, testContext) {
        const context = `Volume/Liquidity Ratio (${testContext})`;
        console.log(`  Testing: ${context}`);
        console.log(`    Inputs: volume24h=${JSON.stringify(volume24h)}, lpValueUSD=${JSON.stringify(lpValueUSD)}`);
        
        try {
            // CRITICAL CALCULATION: This pattern appears in the codebase
            let ratio;
            if (lpValueUSD > 0 && volume24h > 0) {
                ratio = volume24h / lpValueUSD;
            } else {
                ratio = 0;
            }
            
            console.log(`    Result: ${ratio} (type: ${typeof ratio})`);
            
            // Check for contamination
            if (isNaN(ratio)) {
                return { 
                    success: false, 
                    issue: 'NaN_RESULT', 
                    result: ratio,
                    moneyImpact: 'HIGH - Volume analysis corrupted'
                };
            }
            
            if (ratio === Infinity || ratio === -Infinity) {
                return {
                    success: false,
                    issue: 'INFINITY_RESULT',
                    result: ratio,
                    moneyImpact: 'MEDIUM - Invalid ratio breaks filtering'
                };
            }
            
            return { 
                success: true, 
                result: ratio,
                moneyImpact: 'NONE - Calculation correct'
            };
            
        } catch (error) {
            console.log(`    ❌ CRASH: ${error.message}`);
            return { 
                success: false, 
                crashed: true, 
                error: error.message,
                moneyImpact: 'CRITICAL - Math operation crash'
            };
        }
    }

    // Test holder percentage calculations
    calculateHolderPercentage(holderAmount, totalSupply, testContext) {
        const context = `Holder Percentage (${testContext})`;
        console.log(`  Testing: ${context}`);
        console.log(`    Inputs: holderAmount=${JSON.stringify(holderAmount)}, totalSupply=${JSON.stringify(totalSupply)}`);
        
        try {
            // CRITICAL CALCULATION: Pattern from holder analysis
            let percentage;
            if (totalSupply > 0) {
                percentage = (Number(holderAmount) / totalSupply) * 100;
            } else {
                percentage = 0;
            }
            
            console.log(`    Result: ${percentage}% (type: ${typeof percentage})`);
            
            if (isNaN(percentage)) {
                return { 
                    success: false, 
                    issue: 'NaN_PERCENTAGE', 
                    result: percentage,
                    moneyImpact: 'HIGH - Security analysis corrupted'
                };
            }
            
            if (percentage > 100 || percentage < 0) {
                return {
                    success: false,
                    issue: 'INVALID_PERCENTAGE',
                    result: percentage,
                    moneyImpact: 'MEDIUM - Wrong security assessment'
                };
            }
            
            return { 
                success: true, 
                result: percentage,
                moneyImpact: 'NONE - Security calculation correct'
            };
            
        } catch (error) {
            console.log(`    ❌ CRASH: ${error.message}`);
            return { 
                success: false, 
                crashed: true, 
                error: error.message,
                moneyImpact: 'CRITICAL - Security calculation crash'
            };
        }
    }

    // Test buy-to-sell ratio calculations
    calculateBuyToSellRatio(buyCount, sellCount, testContext) {
        const context = `Buy/Sell Ratio (${testContext})`;
        console.log(`  Testing: ${context}`);
        console.log(`    Inputs: buyCount=${JSON.stringify(buyCount)}, sellCount=${JSON.stringify(sellCount)}`);
        
        try {
            // CRITICAL CALCULATION: Organic activity analysis
            let ratio;
            if (sellCount > 0) {
                ratio = parseFloat(buyCount) / parseFloat(sellCount);
            } else {
                ratio = parseFloat(buyCount) > 0 ? Infinity : 0;
            }
            
            console.log(`    Result: ${ratio} (type: ${typeof ratio})`);
            
            if (isNaN(ratio)) {
                return { 
                    success: false, 
                    issue: 'NaN_RATIO', 
                    result: ratio,
                    moneyImpact: 'HIGH - Organic analysis corrupted'
                };
            }
            
            // Infinity might be valid for new tokens with only buys
            return { 
                success: true, 
                result: ratio,
                valid: Number.isFinite(ratio),
                moneyImpact: 'NONE - Organic analysis working'
            };
            
        } catch (error) {
            console.log(`    ❌ CRASH: ${error.message}`);
            return { 
                success: false, 
                crashed: true, 
                error: error.message,
                moneyImpact: 'CRITICAL - Organic analysis crash'
            };
        }
    }

    // Test supply calculations (from previous tests, but check math operations)
    calculateSupplyBasedMetrics(supply, decimals, testContext) {
        const context = `Supply Metrics (${testContext})`;
        console.log(`  Testing: ${context}`);
        console.log(`    Inputs: supply=${JSON.stringify(supply)}, decimals=${JSON.stringify(decimals)}`);
        
        try {
            // CRITICAL CALCULATIONS: Supply-based math
            const supplyInt = parseInt(supply);
            const decimalsInt = parseInt(decimals);
            
            // Calculate UI amount
            const uiAmount = supplyInt / Math.pow(10, decimalsInt);
            
            // Calculate supply in millions for display
            const supplyInMillions = supplyInt / 1000000;
            
            console.log(`    Results: uiAmount=${uiAmount}, millions=${supplyInMillions}`);
            
            const issues = [];
            if (isNaN(supplyInt)) issues.push('NaN_SUPPLY');
            if (isNaN(decimalsInt)) issues.push('NaN_DECIMALS'); 
            if (isNaN(uiAmount)) issues.push('NaN_UI_AMOUNT');
            if (isNaN(supplyInMillions)) issues.push('NaN_MILLIONS');
            
            if (issues.length > 0) {
                return { 
                    success: false, 
                    issue: issues.join(','), 
                    results: { uiAmount, supplyInMillions },
                    moneyImpact: 'HIGH - Supply display corrupted'
                };
            }
            
            return { 
                success: true, 
                results: { uiAmount, supplyInMillions },
                moneyImpact: 'NONE - Supply calculations correct'
            };
            
        } catch (error) {
            console.log(`    ❌ CRASH: ${error.message}`);
            return { 
                success: false, 
                crashed: true, 
                error: error.message,
                moneyImpact: 'CRITICAL - Supply calculation crash'
            };
        }
    }

    // Test score calculations (risk analysis)
    calculateRiskScore(components, testContext) {
        const context = `Risk Score (${testContext})`;
        console.log(`  Testing: ${context}`);
        console.log(`    Components:`, JSON.stringify(components, null, 2));
        
        try {
            // CRITICAL CALCULATION: Risk scoring for trading decisions
            let totalScore = 0;
            let validComponents = 0;
            
            for (const [key, value] of Object.entries(components)) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    totalScore += numValue;
                    validComponents++;
                }
            }
            
            const averageScore = validComponents > 0 ? totalScore / validComponents : 0;
            const normalizedScore = Math.max(0, Math.min(1, averageScore)); // 0-1 range
            
            console.log(`    Result: ${normalizedScore} (${validComponents}/${Object.keys(components).length} valid)`);
            
            if (isNaN(normalizedScore)) {
                return { 
                    success: false, 
                    issue: 'NaN_SCORE', 
                    result: normalizedScore,
                    moneyImpact: 'CRITICAL - Risk analysis completely broken'
                };
            }
            
            if (validComponents === 0) {
                return {
                    success: false,
                    issue: 'NO_VALID_COMPONENTS',
                    result: normalizedScore,
                    moneyImpact: 'HIGH - No risk data available'
                };
            }
            
            return { 
                success: true, 
                result: normalizedScore,
                validComponents: validComponents,
                moneyImpact: 'NONE - Risk calculation working'
            };
            
        } catch (error) {
            console.log(`    ❌ CRASH: ${error.message}`);
            return { 
                success: false, 
                crashed: true, 
                error: error.message,
                moneyImpact: 'CRITICAL - Risk scoring system crash'
            };
        }
    }
}

// Test mathematical operations with various problematic inputs
function testMathOperations(testName, inputs, calculator) {
    console.log(`\n--- ${testName} ---`);
    
    const results = [];
    
    // Volume/Liquidity Ratio Test
    if (inputs.volume && inputs.liquidity) {
        const result = calculator.calculateVolumeToLiquidityRatio(
            inputs.volume, inputs.liquidity, testName
        );
        results.push({ type: 'volume_ratio', ...result });
    }
    
    // Holder Percentage Test
    if (inputs.holderAmount && inputs.totalSupply) {
        const result = calculator.calculateHolderPercentage(
            inputs.holderAmount, inputs.totalSupply, testName
        );
        results.push({ type: 'holder_percentage', ...result });
    }
    
    // Buy/Sell Ratio Test
    if (inputs.buyCount !== undefined && inputs.sellCount !== undefined) {
        const result = calculator.calculateBuyToSellRatio(
            inputs.buyCount, inputs.sellCount, testName
        );
        results.push({ type: 'buy_sell_ratio', ...result });
    }
    
    // Supply Metrics Test
    if (inputs.supply && inputs.decimals) {
        const result = calculator.calculateSupplyBasedMetrics(
            inputs.supply, inputs.decimals, testName
        );
        results.push({ type: 'supply_metrics', ...result });
    }
    
    // Risk Score Test
    if (inputs.riskComponents) {
        const result = calculator.calculateRiskScore(
            inputs.riskComponents, testName
        );
        results.push({ type: 'risk_score', ...result });
    }
    
    // Analyze results
    let crashes = 0, nanIssues = 0, mathErrors = 0, working = 0;
    
    results.forEach(result => {
        if (result.crashed) crashes++;
        else if (result.issue && result.issue.includes('NaN')) nanIssues++;
        else if (result.issue) mathErrors++;
        else working++;
    });
    
    return {
        results,
        summary: { crashes, nanIssues, mathErrors, working, total: results.length }
    };
}

console.log('Testing mathematical operations with various RPC data types...\n');

// MATHEMATICAL EDGE CASE SCENARIOS
const mathTestScenarios = [
    {
        name: 'SCENARIO 1: All string inputs (common RPC format)',
        inputs: {
            volume: "1000000",
            liquidity: "50000", 
            holderAmount: "300000000",
            totalSupply: "1000000000",
            buyCount: "25",
            sellCount: "10",
            supply: "1000000000",
            decimals: "9",
            riskComponents: {
                security: "0.8",
                organic: "0.6",
                liquidity: "0.7"
            }
        }
    },
    {
        name: 'SCENARIO 2: Mixed string/number types',
        inputs: {
            volume: 1000000,
            liquidity: "50000",
            holderAmount: "300000000",
            totalSupply: 1000000000,
            buyCount: 25,
            sellCount: "10",
            supply: "1000000000", 
            decimals: 9,
            riskComponents: {
                security: 0.8,
                organic: "0.6",
                liquidity: "0.7"
            }
        }
    },
    {
        name: 'SCENARIO 3: Empty strings and zeros',
        inputs: {
            volume: "",
            liquidity: "0",
            holderAmount: "",
            totalSupply: "0",
            buyCount: "",
            sellCount: "0",
            supply: "",
            decimals: "0",
            riskComponents: {
                security: "",
                organic: "0",
                liquidity: ""
            }
        }
    },
    {
        name: 'SCENARIO 4: Undefined and null values',
        inputs: {
            volume: undefined,
            liquidity: null,
            holderAmount: undefined,
            totalSupply: null,
            buyCount: undefined,
            sellCount: null,
            supply: undefined,
            decimals: null,
            riskComponents: {
                security: undefined,
                organic: null,
                liquidity: undefined
            }
        }
    },
    {
        name: 'SCENARIO 5: Invalid number formats',
        inputs: {
            volume: "1,000,000",
            liquidity: "50K",
            holderAmount: "300M",
            totalSupply: "1B",
            buyCount: "25.5.5",
            sellCount: "10.abc",
            supply: "1e9",
            decimals: "9.0",
            riskComponents: {
                security: "80%",
                organic: "0.6.2",
                liquidity: "high"
            }
        }
    },
    {
        name: 'SCENARIO 6: Extreme values',
        inputs: {
            volume: "999999999999999999999",
            liquidity: "0.000001",
            holderAmount: "999999999999999999999", 
            totalSupply: "1",
            buyCount: "999999",
            sellCount: "1",
            supply: "999999999999999999999",
            decimals: "18",
            riskComponents: {
                security: "999",
                organic: "-0.5",
                liquidity: "0.000001"
            }
        }
    },
    {
        name: 'SCENARIO 7: Fresh token (minimal data)',
        inputs: {
            volume: "0",
            liquidity: "1000",
            holderAmount: "1000000000",
            totalSupply: "1000000000",
            buyCount: "5",
            sellCount: "0",
            supply: "1000000000",
            decimals: "9",
            riskComponents: {
                security: "0.5",
                organic: "0.3",
                liquidity: "0.2"
            }
        }
    }
];

// Run all mathematical operation tests
const calculator = new MathOperationsSimulator();
const allResults = [];

mathTestScenarios.forEach(scenario => {
    const result = testMathOperations(scenario.name, scenario.inputs, calculator);
    allResults.push({
        scenario: scenario.name,
        ...result
    });
});

// Renaissance Analysis
console.log('\n' + '='.repeat(110));
console.log('🏛️  RENAISSANCE MATHEMATICAL OPERATIONS ANALYSIS');
console.log('='.repeat(110));

let totalCrashes = 0;
let totalNanIssues = 0; 
let totalMathErrors = 0;
let totalWorking = 0;
let totalOperations = 0;
let criticalIssues = [];

allResults.forEach(result => {
    totalCrashes += result.summary.crashes;
    totalNanIssues += result.summary.nanIssues;
    totalMathErrors += result.summary.mathErrors;
    totalWorking += result.summary.working;
    totalOperations += result.summary.total;
    
    if (result.summary.crashes > 0) {
        criticalIssues.push(`${result.scenario.split(':')[0]}: ${result.summary.crashes} math crashes`);
    }
    if (result.summary.nanIssues > 0) {
        criticalIssues.push(`${result.scenario.split(':')[0]}: ${result.summary.nanIssues} NaN contaminations`);
    }
});

console.log(`\n📊 MATHEMATICAL OPERATIONS TEST RESULTS:`);
console.log(`   Total Operations: ${totalOperations}`);
console.log(`   System Crashes: ${totalCrashes}`);
console.log(`   NaN Contaminations: ${totalNanIssues}`); 
console.log(`   Math Errors: ${totalMathErrors}`);
console.log(`   Working Correctly: ${totalWorking}`);

if (criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL MATHEMATICAL ISSUES:`);
    criticalIssues.forEach(issue => console.log(`   ${issue}`));
}

// Trading Decision Impact Analysis
console.log(`\n💰 TRADING DECISION IMPACT:`);
console.log(`   🎯 CRITICAL CALCULATIONS: Risk scores, holder analysis, volume ratios`);
console.log(`   📊 DECISION DEPENDENCY: All trading decisions based on these calculations`);

if (totalCrashes > 0) {
    console.log(`   ❌ CALCULATION CRASHES: ${totalCrashes} operations crash on bad data`);
    console.log(`   💸 MONEY IMPACT: Cannot analyze tokens = Miss opportunities`);
    console.log(`   🚨 SYSTEM FAILURE: Math crashes prevent token processing`);
} else {
    console.log(`   ✅ NO CRASHES: All mathematical operations handle edge cases`);
}

if (totalNanIssues > 0) {
    console.log(`   ⚠️  NaN CONTAMINATION: ${totalNanIssues} operations produce NaN results`);
    console.log(`   🧮 CALCULATION CORRUPTION: NaN spreads through dependent calculations`);
    console.log(`   🎲 BAD TRADES: Wrong risk scores = Trade unsafe tokens`);
} else {
    console.log(`   ✅ NaN SAFE: No calculation contamination detected`);
}

if (totalMathErrors > 0) {
    console.log(`   ⚠️  MATH ERRORS: ${totalMathErrors} operations produce invalid results`);
    console.log(`   📉 ACCURACY LOSS: Wrong calculations = Poor trading decisions`);
} else {
    console.log(`   ✅ MATH ACCURATE: All calculations produce valid results`);
}

// Competitive Advantage Analysis
console.log(`\n🏁 COMPETITIVE ADVANTAGE IMPACT:`);
const successRate = ((totalWorking / totalOperations) * 100).toFixed(1);
const failureRate = (100 - successRate).toFixed(1);

if (totalCrashes + totalNanIssues > 0) {
    console.log(`   ❌ CALCULATION DISADVANTAGE: ${failureRate}% of operations have issues`);
    console.log(`   ❌ RELIABILITY PROBLEM: Math errors while retail uses manual validation`);
    console.log(`   ❌ ACCURACY ISSUES: Wrong calculations = Bad trades = Lost money`);
} else {
    console.log(`   ✅ CALCULATION ADVANTAGE: ${successRate}% accuracy in mathematical operations`);
    console.log(`   ✅ AUTOMATED PRECISION: More accurate than retail manual calculations`);
    console.log(`   ✅ CONSISTENT ANALYSIS: No human calculation errors under pressure`);
}

// Renaissance Verdict
console.log(`\n🏛️  RENAISSANCE VERDICT:`);
if (totalCrashes > 0) {
    console.log(`   📊 CRITICAL MATH BUGS: ${totalCrashes}/${totalOperations} operations crash`);
    console.log(`   💡 IMMEDIATE FIXES REQUIRED:`);
    console.log(`      - Add type validation before math operations`);
    console.log(`      - Implement safe parsing with fallbacks`);
    console.log(`      - Add NaN detection and recovery`);
    console.log(`   🚨 DEPLOY STATUS: DO NOT DEPLOY - Math system unreliable`);
} else if (totalNanIssues > 0) {
    console.log(`   📊 NaN CONTAMINATION: ${totalNanIssues}/${totalOperations} operations produce NaN`);
    console.log(`   💡 FIX REQUIRED:`);
    console.log(`      - Add NaN validation after calculations`);
    console.log(`      - Implement calculation result verification`);
    console.log(`      - Add fallback values for corrupted results`);
    console.log(`   ⚠️  DEPLOY STATUS: Fix before deployment - Calculation corruption risk`);
} else if (totalMathErrors > 0) {
    console.log(`   📊 MATH ERRORS: ${totalMathErrors}/${totalOperations} operations have issues`);
    console.log(`   💡 IMPROVEMENT RECOMMENDED: Add edge case handling`);
    console.log(`   ⚠️  DEPLOY STATUS: Acceptable but should improve accuracy`);
} else {
    console.log(`   📊 MATH OPERATIONS SECURE: All ${totalOperations} calculations handle edge cases correctly`);
    console.log(`   💡 ANALYSIS UPDATE: Mathematical system appears robust`);
    console.log(`   ✅ DEPLOY STATUS: Mathematical operations are production ready`);
}

console.log(`\n🎯 NEXT: Test #5 - Integration Module Timeout/Error Handling`);
console.log('='.repeat(110));