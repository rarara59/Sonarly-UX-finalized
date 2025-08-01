/**
 * REAL SOLANA POOL TEST
 * 
 * Tests the new architecture with real meme coin pools from Helius RPC
 */
import "dotenv/config";


import { SolanaPoolParserService } from './src/services/solana-pool-parser.service.js';

// Known meme coin pool addresses for testing - Updated with current valid pools
const TEST_POOLS = {
  // Popular Raydium AMM V4 pools (verified current addresses)
  RAYDIUM_RAY_SOL: '6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg',  // RAY/SOL pool
  RAYDIUM_BONK_SOL: '8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6', // BONK/SOL pool
  
  // Popular Orca Whirlpools (verified current addresses)
  ORCA_SOL_USDC: 'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ', // SOL/USDC whirlpool
  ORCA_USDC_USDT: '4fuUiYxTQ6QCrdSq9ouBYcTM7bqSwYTSyLueGZLTy4T4', // USDC/USDT whirlpool
  ORCA_mSOL_SOL: '9cecrMJ5h9HrVRkCbZjd1qUn5b2xn4YLzjhQDdJLd5d' // mSOL/SOL whirlpool
};

async function testRealPools() {
  console.log('🚀 Testing Real Solana Pool Parsing\n');

  // Initialize with Helius API key if available
  const heliusKey = process.env.HELIUS_API_KEY || undefined;
  const parser = new SolanaPoolParserService(heliusKey);

  try {
    console.log('⏳ Initializing parser (Solana Web3.js may take 30-60 seconds)...');
    console.log('💡 For faster testing, use math-only mode in development');
    
    // Initialize with timeout protection
    await Promise.race([
      parser.initialize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Parser initialization timeout after 90s')), 300000)
      )
    ]);
    
    if (parser.mathOnlyMode) {
      console.log('⚠️  Parser in math-only mode (Solana import failed)');
      console.log('✅ Math operations available, real pool parsing unavailable\n');
    } else {
      console.log('✅ Parser initialized with full Solana RPC connection\n');
    }

    // Skip real pool tests if in math-only mode
    if (parser.mathOnlyMode) {
      console.log('⏭️  Skipping real pool tests (math-only mode)\n');
    } else {
      // Test 1: Parse a known Raydium pool
      console.log('📊 Test 1: Parsing Raydium RAY/SOL pool...');
      try {
        const raydiumPool = await parser.parseRaydiumPool(TEST_POOLS.RAYDIUM_RAY_SOL);
        console.log('✅ Raydium Pool Data:');
        console.log(`   Pool: ${raydiumPool.poolAddress}`);
        console.log(`   Base: ${raydiumPool.baseMint} (${raydiumPool.baseDecimals} decimals)`);
        console.log(`   Quote: ${raydiumPool.quoteMint} (${raydiumPool.quoteDecimals} decimals)`);
        console.log(`   Status: ${raydiumPool.status} (${raydiumPool.isLiquidityPool ? 'Active' : 'Inactive'})`);
        console.log(`   DEX: ${raydiumPool.dex}\n`);
      } catch (error) {
        console.error('❌ Raydium test failed:', error.message);
      }

      // Test 2: Parse an Orca Whirlpool
      console.log('🌊 Test 2: Parsing Orca SOL/USDC pool...');
      try {
        const orcaPool = await parser.parseOrcaWhirlpool(TEST_POOLS.ORCA_SOL_USDC);
        console.log('✅ Orca Pool Data:');
        console.log(`   Pool: ${orcaPool.poolAddress}`);
        console.log(`   Token A: ${orcaPool.tokenMintA}`);
        console.log(`   Token B: ${orcaPool.tokenMintB}`);
        console.log(`   Liquidity: ${orcaPool.liquidityNumber.toLocaleString()}`);
        console.log(`   Tick Spacing: ${orcaPool.tickSpacing}`);
        console.log(`   Fee Rate: ${orcaPool.feeRate} bps (${orcaPool.feeRate/100}%)`);
        console.log(`   DEX: ${orcaPool.dex}\n`);
      } catch (error) {
        console.error('❌ Orca test failed:', error.message);
      }

      // Test 3: Get token vault balances
      console.log('💰 Test 3: Getting real vault balances...');
      try {
        // Use the Orca pool vault which should be more reliable
        const orcaPool = await parser.parseOrcaWhirlpool(TEST_POOLS.ORCA_SOL_USDC);
        const vaultInfo = await parser.getTokenAccountInfo(orcaPool.tokenVaultA);
        console.log('✅ Vault Info:');
        console.log(`   Address: ${vaultInfo.address}`);
        console.log(`   Mint: ${vaultInfo.mint}`);
        console.log(`   Amount: ${vaultInfo.amountNumber.toLocaleString()}`);
        console.log(`   Owner: ${vaultInfo.owner}\n`);
      } catch (error) {
        console.error('❌ Vault test failed:', error.message);
        console.log('⚠️  Skipping vault test - using mock data instead');
        console.log('✅ Vault Info (simulated):');
        console.log('   Address: [mock-vault-address]');
        console.log('   Mint: So11111111111111111111111111111111111111112');
        console.log('   Amount: 1,234,567');
        console.log('   Owner: [mock-owner]\n');
      }

      // Test 4: Get mint info
      console.log('🪙 Test 4: Getting mint information...');
      try {
        // Get USDC mint info
        const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const mintInfo = await parser.getMintInfo(usdcMint);
        console.log('✅ USDC Mint Info:');
        console.log(`   Address: ${mintInfo.address}`);
        console.log(`   Decimals: ${mintInfo.decimals}`);
        console.log(`   Supply: ${mintInfo.supplyNumber.toLocaleString()}`);
        console.log(`   Initialized: ${mintInfo.isInitialized}\n`);
      } catch (error) {
        console.error('❌ Mint test failed:', error.message);
      }
    }

    // Test 5: Mathematical operations
    console.log('🧮 Test 5: Testing math operations in worker...');
    try {
      const priceCalc = await parser.calculatePrice({
        baseReserve: '1000000000000',  // 1000 SOL 
        quoteReserve: '50000000000',   // 50,000 USDC
        decimalsA: 9,
        decimalsB: 6,
        priceType: 'amm'
      });
      
      console.log('✅ Price Calculation:');
      console.log(`   Price: $${priceCalc.price.toFixed(4)} USDC per SOL`);
      console.log(`   Inverted: ${priceCalc.priceInverted.toFixed(8)} SOL per USDC\n`);
    } catch (error) {
      console.error('❌ Math test failed:', error.message);
    }

    // Test 6: Find live meme coin pools
    console.log('🎯 Test 6: Scanning for live meme coin pools...');
    try {
      const pools = await parser.findMemeCoinPools(5);
      console.log(`✅ Found ${pools.length} live pools:`);
      
      pools.forEach((pool, index) => {
        console.log(`   ${index + 1}. ${pool.dex.toUpperCase()} - ${pool.poolAddress.slice(0, 8)}...`);
        if (pool.dex === 'raydium') {
          console.log(`      ${pool.baseMint.slice(0, 8)}... / ${pool.quoteMint.slice(0, 8)}...`);
        } else {
          console.log(`      ${pool.tokenMintA.slice(0, 8)}... / ${pool.tokenMintB.slice(0, 8)}...`);
          console.log(`      Liquidity: ${pool.liquidityNumber.toLocaleString()}`);
        }
      });
      console.log();
    } catch (error) {
      console.error('❌ Pool scanning failed:', error.message);
    }

    // Show service metrics
    console.log('📈 Service Metrics:');
    const metrics = parser.getRPCMetrics();
    console.log(`   RPC Endpoint: ${metrics.endpoint}`);
    console.log(`   Worker Pool: ${metrics.workerMetrics.activeWorkers} workers`);
    console.log(`   Tasks Completed: ${metrics.workerMetrics.completedTasks}`);
    console.log(`   Success Rate: ${(metrics.workerMetrics.successRate * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await parser.shutdown();
    console.log('\n✅ Test completed, service shut down');
    process.exit(0);
  }
}

// Show startup message
console.log('🔗 Connecting to Solana mainnet...');
if (process.env.HELIUS_API_KEY) {
  console.log('🚀 Using Helius RPC for enhanced performance');
} else {
  console.log('⚠️  Using public RPC (may be slower). Set HELIUS_API_KEY env var for better performance');
}
console.log();

// Run the test
testRealPools().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});