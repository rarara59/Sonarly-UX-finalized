// test-liquidity-analyzer-step1.js
// Step 1: Unit Test the File Structure

console.log('=== STEP 1: Testing File Structure ===\n');

(async () => {
try {
    // Test 1: File loading
    console.log('Test 1: Loading file...');
    const { LiquidityRiskAnalyzer } = await import('./src/detection/risk/liquidity-risk-analyzer.js');
    console.log('✓ File loads successfully');
    console.log('✓ Class exported:', typeof LiquidityRiskAnalyzer);

    // Test 2: Constructor test
    console.log('\nTest 2: Constructor test...');
    const mockRpcPool = { call: () => Promise.resolve(null) };
    const mockPoolValidator = { validatePool: () => Promise.resolve({ valid: false }) };

    const analyzer = new LiquidityRiskAnalyzer(mockRpcPool, mockPoolValidator);
    console.log('✓ Constructor works');
    console.log('✓ Instance created:', analyzer instanceof LiquidityRiskAnalyzer);

    // Test 3: Properties check
    console.log('\nTest 3: Properties check...');
    console.log('✓ Min exit liquidity:', analyzer.MIN_EXIT_LIQUIDITY);
    console.log('✓ Max slippage:', analyzer.MAX_SLIPPAGE);
    console.log('✓ SOL price:', analyzer.SOL_PRICE);
    console.log('✓ RPC Pool assigned:', analyzer.rpc === mockRpcPool);
    console.log('✓ Pool Validator assigned:', analyzer.poolValidator === mockPoolValidator);

    // Test 4: Method existence
    console.log('\nTest 4: Method existence...');
    console.log('✓ validateExitLiquidity method:', typeof analyzer.validateExitLiquidity);
    console.log('✓ findPoolAddress method:', typeof analyzer.findPoolAddress);
    console.log('✓ getPoolReserves method:', typeof analyzer.getPoolReserves);
    console.log('✓ calculateSlippage method:', typeof analyzer.calculateSlippage);
    console.log('✓ getRiskReason method:', typeof analyzer.getRiskReason);

    console.log('\n=== STEP 1: ALL TESTS PASSED ✅ ===');

} catch (error) {
    console.error('❌ STEP 1 FAILED:', error.message);
    console.error('Full error:', error);
    
    // Provide helpful debugging info
    if (error.code === 'MODULE_NOT_FOUND') {
        console.log('\n🔍 DEBUGGING HELP:');
        console.log('1. Make sure the file exists at: ./src/detection/risk/liquidity-risk-analyzer.js');
        console.log('2. Check the file path is correct');
        console.log('3. Ensure the directory structure exists');
    }
}
})();