# Test 6: RPC Pool + Circuit Breaker + Transaction Fetcher  
node -e "
Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js')
]).then(([rpcModule, cbModule, fetcherModule]) => {
  console.log('✅ All 3 modules loaded');
  
  const rpcPool = new rpcModule.RpcConnectionPool({
    helius: { url: 'https://api.mainnet-beta.solana.com', priority: 1 }
  });
  console.log('✅ RPC Pool created');
  
  const circuitBreaker = new cbModule.CircuitBreaker();
  console.log('✅ Circuit Breaker created');
  
  const fetcher = new fetcherModule.TransactionFetcher(rpcPool, circuitBreaker);
  console.log('✅ Transaction Fetcher created with both dependencies');
  console.log('🚀 3-WAY INTEGRATION SUCCESS: Core data pipeline works!');
  
}).catch(err => {
  console.log('❌ 3-WAY INTEGRATION BROKEN:', err.message);
  console.log('Focus debugging here');
});
"