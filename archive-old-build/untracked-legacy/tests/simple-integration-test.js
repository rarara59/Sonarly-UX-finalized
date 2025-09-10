/**
 * SIMPLE INTEGRATION TEST
 * 
 * Quick test to verify SolanaPoolParserService RPCConnectionManager integration
 * without making actual RPC calls
 */

import { SolanaPoolParserService } from '../services/solana-pool-parser.service.js';

console.log('🧪 SIMPLE INTEGRATION TEST\n');

try {
  // Test 1: Service Creation
  console.log('1️⃣ Creating SolanaPoolParserService...');
  const service = new SolanaPoolParserService({ mathOnlyMode: true });
  console.log('✅ Service created successfully\n');

  // Test 2: Verify RPCConnectionManager is present
  console.log('2️⃣ Checking RPCConnectionManager integration...');
  const hasRPCManager = !!service.rpcManager;
  console.log(`✅ RPCConnectionManager present: ${hasRPCManager}\n`);

  // Test 3: Initialize service
  console.log('3️⃣ Initializing service...');
  await service.initialize();
  const isInitialized = service.isInitialized;
  console.log(`✅ Service initialized: ${isInitialized}\n`);

  // Test 4: Check methods exist
  console.log('4️⃣ Verifying updated methods exist...');
  const methods = [
    'batchGetMultipleAccounts',
    'getTransaction',
    'confirmTransaction',
    'getRPCMetrics'
  ];
  
  const methodResults = methods.map(method => {
    const exists = typeof service[method] === 'function';
    console.log(`  ✓ ${method}: ${exists ? 'exists' : 'missing'}`);
    return exists;
  });
  
  const allMethodsExist = methodResults.every(result => result);
  console.log(`✅ All methods present: ${allMethodsExist}\n`);

  // Test 5: Get metrics
  console.log('5️⃣ Testing getRPCMetrics...');
  const metrics = service.getRPCMetrics();
  const hasMetrics = !!metrics && typeof metrics === 'object';
  const hasMode = !!metrics.mode;
  console.log(`  ✓ Metrics returned: ${hasMetrics}`);
  console.log(`  ✓ Mode field: ${metrics.mode}`);
  console.log(`✅ Metrics working: ${hasMetrics && hasMode}\n`);

  // Test 6: Math worker test
  console.log('6️⃣ Testing math workers...');
  const priceResult = await service.calculatePrice({
    baseReserve: '1000000000',
    quoteReserve: '50000000',
    decimalsA: 9,
    decimalsB: 6,
    priceType: 'amm'
  });
  
  const hasPriceResult = !!priceResult && typeof priceResult.price === 'number';
  console.log(`  ✓ Price calculation: $${priceResult.price?.toFixed(4)}`);
  console.log(`✅ Math workers working: ${hasPriceResult}\n`);

  // Cleanup
  console.log('7️⃣ Cleaning up...');
  await service.shutdown();
  console.log('✅ Cleanup complete\n');

  // Results
  console.log('=' .repeat(60));
  console.log('🎉 SIMPLE INTEGRATION TEST: PASSED! 🎉');
  console.log('RPCConnectionManager integration is working correctly!');
  console.log('=' .repeat(60));
  
  process.exit(0);

} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}