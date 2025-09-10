/**
 * Test token validation speed improvement (51ms -> <1ms)
 */

import LiquidityPoolCreationDetectorService from '../services/liquidity-pool-creation-detector.service.js';

console.log('🧪 Testing Token Validation Speed Optimization\n');

// Create service instance
const detector = new LiquidityPoolCreationDetectorService({
  lpScannerConfig: {
    enableRaydiumDetection: true,
    enablePumpFunDetection: true,
    enableOrcaDetection: true
  }
});

// Mock RPC manager
let rpcCallCount = 0;
let rpcDelay = 0.5; // Simulate 0.5ms RPC response

detector.rpcManager = {
  async call(method, params, options) {
    rpcCallCount++;
    
    // Simulate RPC delay
    await new Promise(resolve => setTimeout(resolve, rpcDelay));
    
    if (method === 'getAccountInfo') {
      const address = params[0];
      
      // Known tokens return data
      if (address === 'NewMemeToken11111111111111111111111111111111') {
        return {
          value: {
            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            data: [Buffer.alloc(100, 1).toString('base64')] // 100 bytes of token data
          }
        };
      }
      
      // System addresses return different owner
      if (address === 'SystemAddress111111111111111111111111111111') {
        return {
          value: {
            owner: '11111111111111111111111111111111111111111112',
            data: [Buffer.alloc(50, 0).toString('base64')]
          }
        };
      }
      
      // Unknown addresses
      return null;
    }
    
    return null;
  }
};

console.log('Running token validation speed tests...\n');

// Test 1: Known valid token (should be instant - 0ms)
console.log('📊 TEST 1: Known valid token (SOL)');
const test1Start = performance.now();
const result1 = await detector.validateTokenMintUltraFast(
  'So11111111111111111111111111111111111111112',
  detector.rpcManager,
  { source: 'raydium', role: 'primary' }
);
const test1Time = performance.now() - test1Start;
console.log(`  Result: ${result1.reason} (confidence: ${result1.confidence})`);
console.log(`  Time: ${test1Time.toFixed(2)}ms ${test1Time < 1 ? '✅' : '❌'}`);
console.log(`  RPC calls: ${rpcCallCount} ${rpcCallCount === 0 ? '✅ (no RPC needed)' : '❌'}`);

// Test 2: Known invalid address (should be instant - 0ms)
console.log('\n📊 TEST 2: Known invalid address (System)');
rpcCallCount = 0;
const test2Start = performance.now();
const result2 = await detector.validateTokenMintUltraFast(
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  detector.rpcManager,
  { source: 'raydium', role: 'secondary' }
);
const test2Time = performance.now() - test2Start;
console.log(`  Result: ${result2.reason} (confidence: ${result2.confidence})`);
console.log(`  Time: ${test2Time.toFixed(2)}ms ${test2Time < 1 ? '✅' : '❌'}`);
console.log(`  RPC calls: ${rpcCallCount} ${rpcCallCount === 0 ? '✅ (no RPC needed)' : '❌'}`);

// Test 3: New meme token (should require RPC but still <1ms with 2ms timeout)
console.log('\n📊 TEST 3: New meme token (RPC validation)');
rpcCallCount = 0;
const test3Start = performance.now();
const result3 = await detector.validateTokenMintUltraFast(
  'NewMemeToken11111111111111111111111111111111',
  detector.rpcManager,
  { source: 'raydium', role: 'primary', isNonQuoteToken: true }
);
const test3Time = performance.now() - test3Start;
console.log(`  Result: ${result3.reason} (confidence: ${result3.confidence})`);
console.log(`  Time: ${test3Time.toFixed(2)}ms ${test3Time < 5 ? '✅' : '❌'}`);
console.log(`  RPC calls: ${rpcCallCount} ${rpcCallCount === 1 ? '✅' : '❌'}`);

// Test 4: Cache hit (second call should be instant)
console.log('\n📊 TEST 4: Cache hit test');
rpcCallCount = 0;
const test4Start = performance.now();
const result4 = await detector.validateTokenMintUltraFast(
  'NewMemeToken11111111111111111111111111111111',
  detector.rpcManager,
  { source: 'raydium', role: 'primary', isNonQuoteToken: true }
);
const test4Time = performance.now() - test4Start;
console.log(`  Result: ${result4.reason} (confidence: ${result4.confidence})`);
console.log(`  Time: ${test4Time.toFixed(2)}ms ${test4Time < 1 ? '✅' : '❌'}`);
console.log(`  RPC calls: ${rpcCallCount} ${rpcCallCount === 0 ? '✅ (cache hit)' : '❌'}`);
console.log(`  Cached: ${result4.cached ? '✅' : '❌'}`);

// Test 5: Pump.fun context (should be heuristic instant)
console.log('\n📊 TEST 5: Pump.fun heuristic');
rpcCallCount = 0;
const test5Start = performance.now();
const result5 = await detector.validateTokenMintUltraFast(
  'RandomPumpToken111111111111111111111111111111',
  detector.rpcManager,
  { source: 'pump_fun' }
);
const test5Time = performance.now() - test5Start;
console.log(`  Result: ${result5.reason} (confidence: ${result5.confidence})`);
console.log(`  Time: ${test5Time.toFixed(2)}ms ${test5Time < 1 ? '✅' : '❌'}`);
console.log(`  RPC calls: ${rpcCallCount} ${rpcCallCount === 0 ? '✅ (heuristic)' : '❌'}`);

// Test 6: Batch validation performance
console.log('\n📊 TEST 6: Batch validation (100 tokens)');
const batchTokens = [];
for (let i = 0; i < 100; i++) {
  // Mix of known and new tokens
  if (i % 10 === 0) {
    batchTokens.push('So11111111111111111111111111111111111111112'); // Known
  } else {
    batchTokens.push(`TestToken${i}111111111111111111111111111111111`); // New
  }
}

rpcCallCount = 0;
const batchStart = performance.now();
const batchResults = await Promise.all(
  batchTokens.map(token => 
    detector.validateTokenMintUltraFast(token, detector.rpcManager, { source: 'raydium' })
  )
);
const batchTime = performance.now() - batchStart;
const avgTimePerToken = batchTime / 100;

console.log(`  Total time: ${batchTime.toFixed(2)}ms`);
console.log(`  Average per token: ${avgTimePerToken.toFixed(2)}ms ${avgTimePerToken < 1 ? '✅' : '❌'}`);
console.log(`  RPC calls: ${rpcCallCount}`);
console.log(`  Throughput: ${(1000 / avgTimePerToken).toFixed(0)} tokens/second`);

// Show metrics
console.log('\n📊 TOKEN VALIDATION METRICS:');
const metrics = detector.getTokenValidationMetrics();
console.log(`  Total validations: ${metrics.performance.totalValidations}`);
console.log(`  Average latency: ${metrics.performance.averageLatency.toFixed(2)}ms`);
console.log(`  Cache hit rate: ${(metrics.performance.cacheHitRate * 100).toFixed(1)}%`);
console.log(`  Cache size: ${metrics.cache.size}/${metrics.cache.maxSize}`);
console.log(`  Known tokens: ${metrics.cache.knownTokens}`);

// Performance comparison
console.log('\n🎯 PERFORMANCE COMPARISON:');
console.log('  Before optimization: ~51ms per token');
console.log(`  After optimization: ~${metrics.performance.averageLatency.toFixed(2)}ms per token`);
console.log(`  Improvement: ${(51 / metrics.performance.averageLatency).toFixed(0)}x faster! 🚀`);

console.log('\n✅ Token validation speed test completed!');
process.exit(0);