import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';
import RPCConnectionManager from './src/core/rpc-connection-manager/index.js';

async function testTokenFilter() {
    console.log('🔍 Testing Token Filter Service...\n');
    
    // Use the RPC manager proxy directly
    const rpcManager = RPCConnectionManager;
    
    // Initialize token filter
    const tokenFilter = new TieredTokenFilterService({
        rpcManager: rpcManager
    });
    
    await tokenFilter.initialize();
    
    // Test with a mock LP candidate
    const testCandidate = {
        tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        poolAddress: 'TestPool123',
        dex: 'Raydium',
        type: 'LIQUIDITY_ADD',
        signature: 'test-signature',
        detectedAt: Date.now(),
        lpValueUSD: 5000,
        confidence: 10,
        binaryConfidence: 0.85
    };
    
    console.log('📦 Testing with candidate:', testCandidate);
    
    const result = await tokenFilter.processToken(testCandidate);
    
    console.log('\n📊 Result:', JSON.stringify(result, null, 2));
    
    process.exit(0);
}

testTokenFilter().catch(console.error);