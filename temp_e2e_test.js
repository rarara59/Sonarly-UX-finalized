
console.log('🎯 FINAL ACTIVATION TEST: Live transaction processing');

Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),  
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js'),
  import('./src/detection/core/signal-bus.js'),
  import('./src/detection/validation/token-validator.js'),
  import('./src/detection/detectors/raydium-detector.js'),
  import('./src/detection/detectors/detector-orchestrator.js')
]).then(async ([rpcModule, cbModule, fetcherModule, signalModule, validatorModule, raydiumModule, orchestratorModule]) => {

  console.log('✅ Complete system loading...');
  
  const rpcPool = new rpcModule.RpcConnectionPool({
    helius: { url: 'https://mainnet.helius-rpc.com/?api-key=17ee86cb-f234-493b-94a3-fb5d93f08874', priority: 1 }
  });
  const circuitBreaker = new cbModule.CircuitBreaker();  
  const signalBus = new signalModule.SignalBus();
  const tokenValidator = new validatorModule.TokenValidator(rpcPool, circuitBreaker);
  const transactionFetcher = new fetcherModule.TransactionFetcher(rpcPool, circuitBreaker);
  
  const raydiumDetector = new raydiumModule.RaydiumDetector(signalBus, tokenValidator, circuitBreaker);
  const detectors = { raydium: raydiumDetector, pumpfun: null, orca: null };
  const orchestrator = new orchestratorModule.DetectorOrchestrator(detectors, signalBus, circuitBreaker);
  
  console.log('✅ Complete detection system ready');
  
  let transactionsProcessed = 0;
  let candidatesFound = 0;
  
  signalBus.on('transactionsFetched', async (transactions) => {
    console.log('📡 Processing', transactions.length, 'live transactions...');
    for (const transaction of transactions) {
      try {
        transactionsProcessed++;
        if (typeof orchestrator.analyzeTransaction === 'function') {
          const results = await orchestrator.analyzeTransaction(transaction);
          if (results && results.candidates && results.candidates.length > 0) {
            candidatesFound += results.candidates.length;
            console.log('🚀 MEME COIN FOUND! Transaction #' + transactionsProcessed);
          }
        }
      } catch (error) {
        console.log('⚠️ Transaction processing error:', error.message);
      }
    }
  });
  
  signalBus.on('candidateDetected', (candidate) => {
    console.log('💰 TRADING OPPORTUNITY:', candidate?.tokenAddress?.slice(0,8));
  });
  
  console.log('🚀 ACTIVATING LIVE TRANSACTION FEED...');
  
  if (typeof transactionFetcher.pollAllDexs === 'function') {
    await transactionFetcher.pollAllDexs();
    console.log('✅ Transaction polling ACTIVATED via pollAllDexs');
  } else {
    console.log('❌ TransactionFetcher missing pollAllDexs method');
    process.exit(1);
  }
  
  console.log('⏳ LIVE SYSTEM RUNNING - Processing real Solana transactions...');
  
  setTimeout(() => {
    console.log('\\n📊 LIVE SYSTEM TEST COMPLETE');
    console.log('📡 Transactions processed:', transactionsProcessed);
    console.log('💰 Meme coins detected:', candidatesFound);
    process.exit(0);
  }, 120000);
  
}).catch(err => {
  console.log('❌ ACTIVATION FAILED:', err.message);
  process.exit(1);
});

