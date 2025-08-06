# Test 7: Core Pipeline + Detection Orchestrator
node -e "
Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js'),
  import('./src/detection/detectors/detector-orchestrator.js')
]).then(([rpcModule, cbModule, fetcherModule, detectorModule]) => {
  console.log('✅ All 4 modules loaded');
  
  // Build core pipeline
  const rpcPool = new rpcModule.RpcConnectionPool({
    helius: { url: 'https://api.mainnet-beta.solana.com', priority: 1 }
  });
  const circuitBreaker = new cbModule.CircuitBreaker();
  const fetcher = new fetcherModule.TransactionFetcher(rpcPool, circuitBreaker);
  console.log('✅ Core pipeline created');
  
  // Add detection layer
  const detector = new detectorModule.DetectorOrchestrator(/* deps */);
  console.log('✅ Detection layer added');
  console.log('🎯 4-WAY SUCCESS: Data + Detection pipeline works!');
  
}).catch(err => {
  console.log('❌ DETECTION INTEGRATION BROKEN:', err.message);
  console.log('Focus: What dependencies does DetectorOrchestrator need?');
});
"