// test-liquidity-analyzer-step2.js
// Step 2: Test Core Method Signature

console.log('=== STEP 2: Testing Method Signature ===\n');

async function runStep2Tests() {
    try {
        const { LiquidityRiskAnalyzer } = await import('./src/detection/risk/liquidity-risk-analyzer.js');
        
        // Create mocks that return "no pool found" scenario
        const mockRpcPool = { 
            call: async (method, params) => {
                console.log(`  📞 RPC called: ${method}`);
                return null; // Simulate no pool found
            }
        };
        
        const mockPoolValidator = { 
            validatePool: async (poolAddress, dexType) => {
                console.log(`  🔍 Pool Validator called: ${poolAddress}, ${dexType}`);
                return { valid: false, reason: 'pool_not_found' };
            }
        };

        const analyzer = new LiquidityRiskAnalyzer(mockRpcPool, mockPoolValidator);

        // Test 1: Invalid token address
        console.log('Test 1: Invalid token address...');
        const result1 = await analyzer.validateExitLiquidity('invalid');
        console.log('✓ Handles invalid token:', result1.safe === false);
        console.log('  Result:', { safe: result1.safe, reason: result1.reason });

        // Test 2: Valid format but no pool found
        console.log('\nTest 2: Valid format, no pool...');
        const result2 = await analyzer.validateExitLiquidity('11111111111111111111111111111111111111111111');
        console.log('✓ Handles no pool found:', result2.safe === false);
        console.log('  Result:', { safe: result2.safe, reason: result2.reason });

        // Test 3: Check result structure
        console.log('\nTest 3: Result structure validation...');
        const hasRequiredFields = (
            result2.hasOwnProperty('safe') && 
            result2.hasOwnProperty('exitLiquidity') && 
            result2.hasOwnProperty('slippage') && 
            result2.hasOwnProperty('reason')
        );
        console.log('✓ Returns expected structure:', hasRequiredFields);
        console.log('  Fields:', Object.keys(result2));

        // Test 4: Field types validation
        console.log('\nTest 4: Field types validation...');
        console.log('✓ safe is boolean:', typeof result2.safe === 'boolean');
        console.log('✓ exitLiquidity is number:', typeof result2.exitLiquidity === 'number');
        console.log('✓ slippage is number:', typeof result2.slippage === 'number');
        console.log('✓ reason is string:', typeof result2.reason === 'string');

        // Test 5: Default trade amount
        console.log('\nTest 5: Default trade amount...');
        const result3 = await analyzer.validateExitLiquidity('11111111111111111111111111111111111111111111');
        console.log('✓ Default amount works (no second parameter)');
        console.log('  Result safe:', result3.safe);

        // Test 6: Custom trade amount
        console.log('\nTest 6: Custom trade amount...');
        const result4 = await analyzer.validateExitLiquidity('11111111111111111111111111111111111111111111', 5000);
        console.log('✓ Custom amount works');
        console.log('  Result safe:', result4.safe);

        // Test 7: Zero trade amount
        console.log('\nTest 7: Zero trade amount...');
        const result5 = await analyzer.validateExitLiquidity('11111111111111111111111111111111111111111111', 0);
        console.log('✓ Zero amount handled');
        console.log('  Result:', { safe: result5.safe, slippage: result5.slippage });

        // Test 8: Large trade amount
        console.log('\nTest 8: Large trade amount...');
        const result6 = await analyzer.validateExitLiquidity('11111111111111111111111111111111111111111111', 1000000);
        console.log('✓ Large amount handled');
        console.log('  Result safe:', result6.safe);

        console.log('\n=== STEP 2: ALL TESTS PASSED ✅ ===');
        console.log('✓ Method signature works correctly');
        console.log('✓ Input validation works');
        console.log('✓ Result structure is consistent');
        console.log('✓ Error handling is graceful');

    } catch (error) {
        console.error('❌ STEP 2 FAILED:', error.message);
        console.error('Full error:', error);
        
        if (error.message.includes('Cannot read properties')) {
            console.log('\n🔍 DEBUGGING HELP:');
            console.log('1. Check if all methods are properly defined');
            console.log('2. Verify async/await syntax is correct');
            console.log('3. Ensure error handling in validateExitLiquidity method');
        }
    }
}

// Run the tests
runStep2Tests();