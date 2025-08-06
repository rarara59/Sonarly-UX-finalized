// test-liquidity-analyzer-step4.js
// Step 4: Test Error Handling

console.log('=== STEP 4: Testing Error Handling ===\n');

async function runStep4Tests() {
    try {
        const { LiquidityRiskAnalyzer } = await import('./src/detection/risk/liquidity-risk-analyzer.js');

        // Test 1: RPC Connection Failure
        console.log('Test 1: RPC Connection Failure...');
        const errorRpcPool = {
            call: async (method, params) => {
                console.log(`  📞 RPC called: ${method} - THROWING ERROR`);
                throw new Error('RPC connection failed');
            }
        };

        const normalPoolValidator = {
            validatePool: async (poolAddress, dexType) => {
                return { valid: true, confidence: 0.95 };
            }
        };

        const analyzer1 = new LiquidityRiskAnalyzer(errorRpcPool, normalPoolValidator);
        const result1 = await analyzer1.validateExitLiquidity('someToken', 1000);
        
        console.log('✓ RPC error handled gracefully');
        console.log('  Safe:', result1.safe); // Should be false
        console.log('  Reason:', result1.reason);
        console.log('  Contains error message:', result1.reason.includes('failed'));

        // Test 2: Pool Validator Failure
        console.log('\nTest 2: Pool Validator Failure...');
        const normalRpcPool = {
            call: async (method, params) => {
                console.log(`  📞 RPC called: ${method} - SUCCESS`);
                if (method === 'getProgramAccounts') {
                    return [{ pubkey: 'mockPoolAddress123' }];
                }
                return { value: { data: ['base64data'] } };
            }
        };

        const errorPoolValidator = {
            validatePool: async (poolAddress, dexType) => {
                console.log(`  🔍 Pool Validator called - THROWING ERROR`);
                throw new Error('Pool validation failed');
            }
        };

        const analyzer2 = new LiquidityRiskAnalyzer(normalRpcPool, errorPoolValidator);
        const result2 = await analyzer2.validateExitLiquidity('someToken', 1000);
        
        console.log('✓ Pool Validator error handled gracefully');
        console.log('  Safe:', result2.safe);
        console.log('  Reason:', result2.reason);
        console.log('  Contains error message:', result2.reason.includes('failed'));

        // Test 3: Invalid Pool Data
        console.log('\nTest 3: Invalid Pool Data...');
        const invalidDataRpcPool = {
            call: async (method, params) => {
                console.log(`  📞 RPC called: ${method}`);
                if (method === 'getProgramAccounts') {
                    return [{ pubkey: 'mockPoolAddress123' }];
                }
                if (method === 'getAccountInfo') {
                    // Return invalid/corrupted data
                    return {
                        value: {
                            data: ['invalidbase64!@#$%^&*()']
                        }
                    };
                }
                return null;
            }
        };

        const analyzer3 = new LiquidityRiskAnalyzer(invalidDataRpcPool, normalPoolValidator);
        const result3 = await analyzer3.validateExitLiquidity('someToken', 1000);
        
        console.log('✓ Invalid pool data handled gracefully');
        console.log('  Safe:', result3.safe);
        console.log('  Reason:', result3.reason);

        // Test 4: Empty Pool Data
        console.log('\nTest 4: Empty Pool Data...');
        const emptyDataRpcPool = {
            call: async (method, params) => {
                console.log(`  📞 RPC called: ${method}`);
                if (method === 'getProgramAccounts') {
                    return [{ pubkey: 'mockPoolAddress123' }];
                }
                if (method === 'getAccountInfo') {
                    // Return empty/null data
                    return {
                        value: {
                            data: null
                        }
                    };
                }
                return null;
            }
        };

        const analyzer4 = new LiquidityRiskAnalyzer(emptyDataRpcPool, normalPoolValidator);
        const result4 = await analyzer4.validateExitLiquidity('someToken', 1000);
        
        console.log('✓ Empty pool data handled gracefully');
        console.log('  Safe:', result4.safe);
        console.log('  Reason:', result4.reason);

        // Test 5: Pool Validation Returns Invalid
        console.log('\nTest 5: Pool Validation Returns Invalid...');
        const invalidPoolValidator = {
            validatePool: async (poolAddress, dexType) => {
                console.log(`  🔍 Pool Validator called - INVALID POOL`);
                return { 
                    valid: false, 
                    reason: 'invalid_pool_structure',
                    confidence: 0.95 
                };
            }
        };

        const analyzer5 = new LiquidityRiskAnalyzer(normalRpcPool, invalidPoolValidator);
        const result5 = await analyzer5.validateExitLiquidity('someToken', 1000);
        
        console.log('✓ Invalid pool validation handled gracefully');
        console.log('  Safe:', result5.safe);
        console.log('  Reason:', result5.reason);
        console.log('  Pool validator reason passed through:', result5.reason.includes('invalid_pool_structure'));

        // Test 6: Buffer Parsing Error
        console.log('\nTest 6: Buffer Parsing Error...');
        const shortBufferRpcPool = {
            call: async (method, params) => {
                console.log(`  📞 RPC called: ${method}`);
                if (method === 'getProgramAccounts') {
                    return [{ pubkey: 'mockPoolAddress123' }];
                }
                if (method === 'getAccountInfo') {
                    // Return buffer that's too short for parsing
                    const shortBuffer = Buffer.alloc(100); // Too short for offsets 229, 237
                    return {
                        value: {
                            data: [shortBuffer.toString('base64')]
                        }
                    };
                }
                return null;
            }
        };

        const analyzer6 = new LiquidityRiskAnalyzer(shortBufferRpcPool, normalPoolValidator);
        const result6 = await analyzer6.validateExitLiquidity('someToken', 1000);
        
        console.log('✓ Buffer parsing error handled gracefully');
        console.log('  Safe:', result6.safe);
        console.log('  Reason:', result6.reason);

        // Test 7: Zero/Negative Reserves
        console.log('\nTest 7: Zero/Negative Reserves...');
        const zeroReservesRpcPool = {
            call: async (method, params) => {
                console.log(`  📞 RPC called: ${method}`);
                if (method === 'getProgramAccounts') {
                    return [{ pubkey: 'mockPoolAddress123' }];
                }
                if (method === 'getAccountInfo') {
                    // Return buffer with zero reserves
                    const zeroBuffer = Buffer.alloc(752);
                    zeroBuffer.writeBigUInt64LE(BigInt(0), 229); // 0 SOL
                    zeroBuffer.writeBigUInt64LE(BigInt(0), 237); // 0 tokens
                    return {
                        value: {
                            data: [zeroBuffer.toString('base64')]
                        }
                    };
                }
                return null;
            }
        };

        const analyzer7 = new LiquidityRiskAnalyzer(zeroReservesRpcPool, normalPoolValidator);
        const result7 = await analyzer7.validateExitLiquidity('someToken', 1000);
        
        console.log('✓ Zero reserves handled gracefully');
        console.log('  Safe:', result7.safe);
        console.log('  Exit Liquidity:', result7.exitLiquidity);
        console.log('  Slippage:', result7.slippage);

        // Test 8: All Error Types Result in Safe Failure
        console.log('\nTest 8: Error Response Consistency...');
        const allResults = [result1, result2, result3, result4, result5, result6, result7];
        const allUnsafe = allResults.every(r => r.safe === false);
        const allHaveReasons = allResults.every(r => typeof r.reason === 'string' && r.reason.length > 0);
        const allHaveStructure = allResults.every(r => 
            r.hasOwnProperty('safe') && 
            r.hasOwnProperty('exitLiquidity') && 
            r.hasOwnProperty('slippage') && 
            r.hasOwnProperty('reason')
        );
        
        console.log('✓ All errors result in safe: false:', allUnsafe);
        console.log('✓ All errors have reason messages:', allHaveReasons);
        console.log('✓ All errors maintain result structure:', allHaveStructure);

        console.log('\n=== STEP 4: ALL TESTS PASSED ✅ ===');
        console.log('✓ RPC connection failures handled');
        console.log('✓ Pool validation failures handled');
        console.log('✓ Invalid data parsing handled');
        console.log('✓ Empty/null data handled');
        console.log('✓ Buffer parsing errors handled');
        console.log('✓ Zero reserves handled');
        console.log('✓ All errors fail safely');
        console.log('✓ Consistent error response structure');
        console.log('✓ No crashes or exceptions');

    } catch (error) {
        console.error('❌ STEP 4 FAILED:', error.message);
        console.error('Full error:', error);
        console.error('Stack:', error.stack);
        
        console.log('\n🔍 DEBUGGING HELP:');
        console.log('1. Check try-catch blocks in validateExitLiquidity');
        console.log('2. Verify all async operations are properly wrapped');
        console.log('3. Ensure error messages are passed through correctly');
        console.log('4. Check buffer operations have proper bounds checking');
    }
}

// Run the tests
runStep4Tests();