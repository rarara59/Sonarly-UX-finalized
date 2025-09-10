/**
 * Test the RPC transaction fetching fix implementation
 */

import LiquidityPoolCreationDetectorService from '../services/liquidity-pool-creation-detector.service.js';

console.log('🧪 Testing RPC Transaction Fetching Fix\n');

// Create service instance with mock dependencies
const detector = new LiquidityPoolCreationDetectorService({
  lpScannerConfig: {
    enableRaydiumDetection: true,
    enablePumpFunDetection: true,
    enableOrcaDetection: true
  }
});

// Mock RPC manager
detector.rpcManager = {
  async call(method, params, options) {
    console.log(`🔍 RPC Call: ${method} with params:`, params[0]?.slice ? params[0].slice(0,8) + '...' : params);
    
    // Simulate different response scenarios
    const signature = params[0];
    
    // Test success case
    if (signature && signature.includes('success')) {
      return {
        transaction: {
          message: {
            accountKeys: [
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              '11111111111111111111111111111111111111111112',
              'SysvarRent111111111111111111111111111111111',
              '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium program
              'MemeToken11111111111111111111111111111111111'
            ],
            instructions: [
              {
                programIdIndex: 3, // Points to Raydium
                accounts: [0, 1, 2, 4],
                data: Buffer.from([0xe9, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]).toString('base64')
              }
            ]
          }
        }
      };
    }
    
    // Test retry case - fail first 2 attempts
    if (signature && signature.includes('retry')) {
      const attemptCount = detector.testRetryCount || 0;
      detector.testRetryCount = attemptCount + 1;
      
      if (attemptCount < 2) {
        throw new Error('Simulated RPC failure for retry test');
      }
      
      // Success on 3rd attempt
      return {
        transaction: {
          message: {
            accountKeys: ['Test1', 'Test2'],
            instructions: [{ programIdIndex: 0, accounts: [], data: 'AA==' }]
          }
        }
      };
    }
    
    // Test null response
    if (signature && signature.includes('notfound')) {
      return null;
    }
    
    // Default error
    throw new Error('Simulated RPC connection error');
  }
};

console.log('Testing transaction fetching with different scenarios...\n');

// Test 1: Successful fetch
console.log('📊 TEST 1: Successful transaction fetch');
try {
  const result1 = await detector.getTransactionDetails({ signature: 'success_test_123' });
  console.log(`✅ Success: Transaction fetched`, result1 ? 'successfully' : 'failed');
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 2: Cache hit
console.log('\n📊 TEST 2: Cache hit test');
try {
  const startTime = performance.now();
  const result2 = await detector.getTransactionDetails({ signature: 'success_test_123' });
  const cacheTime = performance.now() - startTime;
  console.log(`✅ Cache test: ${cacheTime < 5 ? 'Cache hit' : 'Cache miss'} (${cacheTime.toFixed(1)}ms)`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 3: Retry logic
console.log('\n📊 TEST 3: Retry logic test');
detector.testRetryCount = 0;
try {
  const result3 = await detector.getTransactionDetails({ signature: 'retry_test_456' });
  console.log(`✅ Retry test: Successfully fetched after ${detector.testRetryCount} attempts`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 4: Not found transaction
console.log('\n📊 TEST 4: Transaction not found');
try {
  const result4 = await detector.getTransactionDetails({ signature: 'notfound_test_789' });
  console.log(`✅ Not found test:`, result4 === null ? 'Correctly returned null' : 'Unexpected result');
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 5: Complete failure after retries
console.log('\n📊 TEST 5: Complete failure scenario');
try {
  const result5 = await detector.getTransactionDetails({ signature: 'fail_test_000' });
  console.log(`✅ Failure test:`, result5 === null ? 'Correctly handled failure' : 'Unexpected result');
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Show metrics
console.log('\n📊 TRANSACTION FETCHING METRICS:');
const metrics = detector.getTransactionFetchingMetrics();
console.log(`  Cache size: ${metrics.cacheSize}`);
console.log(`  Queue length: ${metrics.queueLength}`);
console.log(`  Current RPC: ${metrics.currentRpcEndpoint}`);
console.log(`  RPC failures:`, metrics.rpcFailures);

console.log('\n✅ RPC transaction fetching fix test completed!');

// Clean up
process.exit(0);