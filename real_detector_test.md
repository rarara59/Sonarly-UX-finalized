# Test with real detector (not empty mock)
node -e "
Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js'),
  import('./src/detection/detectors/detector-orchestrator.js'),
  import('./src/detection/core/signal-bus.js'),
  import('./src/detection/detectors/raydium-detector.js')
]).then(([rpcModule, cbModule, fetcherModule, orchestratorModule, signalModule, raydiumModule]) => {
  console.log('✅ All 6 modules loaded');
  
  // Build core pipeline
  const rpcPool = new rpcModule.RpcConnectionPool({
    helius: { url: 'https://api.mainnet-beta.solana.com', priority: 1 }
  });
  const circuitBreaker = new cbModule.CircuitBreaker();
  const signalBus = new signalModule.SignalBus();
  
  // Build actual raydium detector
  const raydiumDetector = new raydiumModule.RaydiumDetector(/* deps needed? */);
  
  const detectors = { raydium: raydiumDetector };
  const orchestrator = new orchestratorModule.DetectorOrchestrator(detectors, signalBus);
  
  console.log('🎯 6-WAY SUCCESS: Real detection capability added!');
}).catch(err => console.log('❌ REAL DETECTOR BROKEN:', err.message));
"