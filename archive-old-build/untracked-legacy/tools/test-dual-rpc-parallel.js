/**
 * Test Dual RPC Parallel Implementation
 * Validates parallel execution strategies and performance improvements
 */

import { EnhancedRpcConnectionPool } from '../detection/transport/enhanced-rpc-pool.js';
import { ParallelRpcExecutor } from '../detection/transport/parallel-rpc-executor.js';
import { DualEndpointStrategy } from '../detection/transport/dual-endpoint-strategy.js';

console.log('🧪 Testing Dual RPC Parallel Implementation\n');

// Mock endpoints for testing
const mockEndpoints = {
  fast1: {
    name: 'fast1',
    url: 'https://fast1.example.com',
    priority: 1,
    maxRequestsPerSecond: 150,
    timeout: 3000,
    latency: 20 // Simulated latency
  },
  fast2: {
    name: 'fast2',
    url: 'https://fast2.example.com',
    priority: 1,
    maxRequestsPerSecond: 150,
    timeout: 3000,
    latency: 25
  },
  reliable1: {
    name: 'reliable1',
    url: 'https://reliable1.example.com',
    priority: 2,
    maxRequestsPerSecond: 50,
    timeout: 5000,
    latency: 40
  },
  slow: {
    name: 'slow',
    url: 'https://slow.example.com',
    priority: 3,
    maxRequestsPerSecond: 10,
    timeout: 8000,
    latency: 100
  }
};

// Mock fetch for testing
global.fetch = async (url, options) => {
  const endpoint = Object.values(mockEndpoints).find(e => e.url === url);
  
  if (!endpoint) {
    throw new Error('Unknown endpoint');
  }
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, endpoint.latency));
  
  // Parse request
  const request = JSON.parse(options.body);
  
  // Simulate responses
  let result = null;
  switch (request.method) {
    case 'getAccountInfo':
      result = {
        value: {
          owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          data: 'mock_token_data',
          lamports: 1000000
        }
      };
      break;
    case 'getSignaturesForAddress':
      result = Array(10).fill(null).map((_, i) => ({
        signature: `sig_${i}_${Date.now()}`,
        blockTime: Date.now() - i * 1000
      }));
      break;
    default:
      result = { success: true, endpoint: endpoint.name };
  }
  
  return {
    ok: true,
    json: async () => ({
      jsonrpc: '2.0',
      id: request.id,
      result
    })
  };
};

// Test 1: Parallel RPC Executor Race Strategy
const testRaceStrategy = async () => {
  console.log('📊 TEST 1: Race Strategy Performance');
  
  const executor = new ParallelRpcExecutor(mockEndpoints);
  
  console.log('  Testing race with 4 endpoints...');
  const startTime = Date.now();
  
  try {
    const result = await executor.raceCall('getAccountInfo', ['TokenMint123'], {
      timeout: 100
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`  Race completed in: ${elapsed}ms`);
    console.log(`  Result received: ${result.value ? '✅' : '❌'}`);
    console.log(`  Faster than slowest: ${100 - elapsed > 0 ? '✅' : '❌'} (saved ${100 - elapsed}ms)`);
    
    // Check stats to see which endpoint won
    const stats = executor.getStats();
    console.log('  Endpoint performance:');
    Object.entries(stats).forEach(([endpoint, data]) => {
      if (data.calls > 0) {
        console.log(`    ${endpoint}: ${data.calls} calls, ${data.successes} successes`);
      }
    });
    
    return elapsed < 40; // Should complete near fastest endpoint time
    
  } catch (error) {
    console.error('  Race strategy failed:', error.message);
    return false;
  }
};

// Test 2: Consensus Strategy
const testConsensusStrategy = async () => {
  console.log('\n📊 TEST 2: Consensus Strategy Reliability');
  
  const executor = new ParallelRpcExecutor(mockEndpoints);
  
  console.log('  Testing consensus with 4 endpoints...');
  
  try {
    const result = await executor.consensusCall('getAccountInfo', ['TokenMint456'], {
      timeout: 150,
      minConsensus: 2
    });
    
    console.log(`  Consensus achieved: ${result ? '✅' : '❌'}`);
    console.log(`  Result has expected fields: ${result?.value?.owner ? '✅' : '❌'}`);
    
    const stats = executor.getStats();
    const successfulEndpoints = Object.values(stats).filter(s => s.successes > 0).length;
    console.log(`  Endpoints participating: ${successfulEndpoints}/4`);
    console.log(`  Minimum consensus (2) met: ${successfulEndpoints >= 2 ? '✅' : '❌'}\n`);
    
    return successfulEndpoints >= 2;
    
  } catch (error) {
    console.error('  Consensus strategy failed:', error.message);
    return false;
  }
};

// Test 3: Dual Endpoint Strategy
const testDualStrategy = async () => {
  console.log('📊 TEST 3: Dual Endpoint Strategy');
  
  const primary = [mockEndpoints.fast1, mockEndpoints.fast2];
  const secondary = [mockEndpoints.reliable1, mockEndpoints.slow];
  
  const dualStrategy = new DualEndpointStrategy(primary, secondary);
  
  console.log('  Testing dual execution with paired endpoints...');
  const startTime = Date.now();
  
  try {
    const result = await dualStrategy.executeDual('getSignaturesForAddress', ['Program123'], {
      timeout: 100,
      preferSpeed: true
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`  Dual execution completed in: ${elapsed}ms`);
    console.log(`  Result is array: ${Array.isArray(result) ? '✅' : '❌'}`);
    console.log(`  Result length: ${result?.length || 0}`);
    
    const stats = dualStrategy.getStats();
    console.log('  Pair performance:');
    stats.pairs.forEach(pair => {
      console.log(`    Pair ${pair.index}: ${pair.successRate.toFixed(2)} success rate, ${pair.avgLatency.toFixed(0)}ms avg`);
    });
    
    return elapsed < 50 && Array.isArray(result);
    
  } catch (error) {
    console.error('  Dual strategy failed:', error.message);
    return false;
  }
};

// Test 4: Enhanced RPC Pool Integration
const testEnhancedPool = async () => {
  console.log('\n📊 TEST 4: Enhanced RPC Pool Integration');
  
  const pool = new EnhancedRpcConnectionPool(mockEndpoints);
  
  // Test automatic strategy selection
  console.log('  Testing automatic strategy selection...');
  
  const tests = [
    { method: 'getAccountInfo', expected: 'race' },
    { method: 'getTransaction', expected: 'consensus' },
    { method: 'getSignaturesForAddress', expected: 'dual' }
  ];
  
  for (const test of tests) {
    const strategy = pool.selectOptimalStrategy(test.method, {});
    console.log(`    ${test.method}: ${strategy} (expected ${test.expected}) ${strategy === test.expected ? '✅' : '❌'}`);
  }
  
  // Test actual execution
  console.log('\n  Testing parallel execution...');
  const startTime = Date.now();
  
  try {
    const result = await pool.call('getAccountInfo', ['TokenMint789']);
    const elapsed = Date.now() - startTime;
    
    console.log(`  Execution time: ${elapsed}ms`);
    console.log(`  Result received: ${result ? '✅' : '❌'}`);
    console.log(`  Strategy usage:`, pool.strategyUsage);
    
    return elapsed < 50;
    
  } catch (error) {
    console.error('  Enhanced pool failed:', error.message);
    return false;
  }
};

// Test 5: Batch Operations
const testBatchOperations = async () => {
  console.log('\n📊 TEST 5: Batch Operations Performance');
  
  const pool = new EnhancedRpcConnectionPool(mockEndpoints);
  
  // Create batch of token validations
  const tokenMints = Array(20).fill(null).map((_, i) => `Token${i}`);
  
  console.log(`  Testing batch validation of ${tokenMints.length} tokens...`);
  const startTime = Date.now();
  
  try {
    const results = await pool.validateTokensFast(tokenMints);
    const elapsed = Date.now() - startTime;
    
    const validCount = results.filter(r => r.valid).length;
    console.log(`  Batch completed in: ${elapsed}ms`);
    console.log(`  Valid tokens: ${validCount}/${tokenMints.length}`);
    console.log(`  Average time per token: ${(elapsed / tokenMints.length).toFixed(1)}ms`);
    console.log(`  Performance improvement: ${elapsed < 200 ? '✅' : '❌'} (<200ms for 20 tokens)\n`);
    
    return elapsed < 200 && validCount === tokenMints.length;
    
  } catch (error) {
    console.error('  Batch operations failed:', error.message);
    return false;
  }
};

// Test 6: Failover and Error Handling
const testFailoverHandling = async () => {
  console.log('📊 TEST 6: Failover and Error Handling');
  
  // Modify mock to simulate failures
  const originalFetch = global.fetch;
  let failureCount = 0;
  
  global.fetch = async (url, options) => {
    // Fail fast endpoints initially
    if (url.includes('fast') && failureCount < 2) {
      failureCount++;
      throw new Error('Simulated endpoint failure');
    }
    return originalFetch(url, options);
  };
  
  const pool = new EnhancedRpcConnectionPool(mockEndpoints);
  
  console.log('  Testing failover with simulated failures...');
  
  try {
    const result = await pool.call('getAccountInfo', ['FailoverTest'], {
      strategy: 'dual'
    });
    
    console.log(`  Request succeeded despite failures: ${result ? '✅' : '❌'}`);
    console.log(`  Failures encountered: ${failureCount}`);
    console.log(`  Automatic failover worked: ${failureCount > 0 && result ? '✅' : '❌'}\n`);
    
    // Restore original fetch
    global.fetch = originalFetch;
    
    return result !== null;
    
  } catch (error) {
    console.error('  Failover test failed:', error.message);
    global.fetch = originalFetch;
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('⚡ Dual RPC Parallel Implementation Test Suite\n');
  console.log('Expected improvements:');
  console.log('  - 40-60% latency reduction through racing');
  console.log('  - 99.99% availability through redundancy');
  console.log('  - Automatic strategy selection');
  console.log('  - Seamless failover handling\n');
  
  const tests = [
    testRaceStrategy,
    testConsensusStrategy,
    testDualStrategy,
    testEnhancedPool,
    testBatchOperations,
    testFailoverHandling
  ];
  
  let passed = 0;
  for (const test of tests) {
    try {
      if (await test()) passed++;
    } catch (error) {
      console.error(`Test failed with error: ${error.message}`);
    }
  }
  
  console.log(`✅ Test Summary: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('\n🎉 All tests passed! Dual RPC parallel implementation is working correctly.');
    console.log('Key achievements:');
    console.log('  - Race strategy completes in <40ms (fastest endpoint time)');
    console.log('  - Consensus achieves agreement from multiple endpoints');
    console.log('  - Dual strategy balances speed and reliability');
    console.log('  - Batch operations process 20 tokens in <200ms');
    console.log('  - Automatic failover handles endpoint failures');
  }
  
  process.exit(passed === tests.length ? 0 : 1);
};

// Execute tests
runAllTests();