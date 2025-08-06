console.log('🔧 TESTING APPLIED FIXES: Quick validation');

Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),  
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js'),
  import('./src/detection/core/signal-bus.js')
]).then(async ([rpcModule, cbModule, fetcherModule, signalModule]) => {

  console.log('✅ Testing fix components...');
  
  // Test CircuitBreaker execute method
  const circuitBreaker = new cbModule.CircuitBreaker();
  if (typeof circuitBreaker.execute !== 'function') {
    throw new Error('❌ CircuitBreaker missing execute method');
  }
  console.log('✅ CircuitBreaker execute method exists');
  
  // Test RPC with new timeout
  const rpcPool = new rpcModule.RpcConnectionPool({
    helius: { url: 'https://api.mainnet-beta.solana.com', priority: 1 }
  });
  
  // Test TransactionFetcher with rate limiting
  const transactionFetcher = new fetcherModule.TransactionFetcher(rpcPool, circuitBreaker);
  if (!transactionFetcher.minInterval) {
    console.log('⚠️  Rate limiting may not be implemented');
  } else {
    console.log('✅ Rate limiting configured:', transactionFetcher.minInterval + 'ms');
  }
  
  console.log('🚀 Testing live RPC call...');
  const startTime = Date.now();
  
  try {
    const result = await rpcPool.call('getLatestBlockhash');
    const elapsed = Date.now() - startTime;
    console.log('✅ RPC call succeeded in', elapsed + 'ms');
    
    if (elapsed < 50) {
      console.log('⚠️  Very fast response - may be cached');
    } else if (elapsed > 5000) {  
      console.log('⚠️  Slow response but within timeout');
    } else {
      console.log('✅ Normal response time for mainnet');
    }
    
  } catch (error) {
    if (error.message.includes('timeout after 30ms')) {
      console.log('❌ TIMEOUT FIX FAILED - still using 30ms timeout');
    } else if (error.message.includes('429')) {
      console.log('❌ RATE LIMITING FIX NEEDED - getting HTTP 429');
    } else {
      console.log('⚠️  Other RPC error:', error.message);
    }
  }
  
  console.log('\\n📊 FIX VALIDATION COMPLETE');
  console.log('🎯 System ready for full E2E test if all checks passed');
  
  process.exit(0);
  
}).catch(err => {
  console.log('❌ FIX VALIDATION FAILED:', err.message);
  process.exit(1);
});

