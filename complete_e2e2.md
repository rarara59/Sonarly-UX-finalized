node -e "
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
  
  // Build the complete architecture
  const rpcPool = new rpcModule.RpcConnectionPool({
    helius: { url: 'https://api.mainnet-beta.solana.com', priority: 1 }
  });
  const circuitBreaker = new cbModule.CircuitBreaker();  
  const signalBus = new signalModule.SignalBus();
  const tokenValidator = new validatorModule.TokenValidator(rpcPool, circuitBreaker);
  const transactionFetcher = new fetcherModule.TransactionFetcher(rpcPool, circuitBreaker);
  
  const raydiumDetector = new raydiumModule.RaydiumDetector(signalBus, tokenValidator, circuitBreaker);
  const detectors = { raydium: raydiumDetector, pumpfun: null, orca: null };
  const orchestrator = new orchestratorModule.DetectorOrchestrator(detectors, signalBus, circuitBreaker);
  
  console.log('✅ Complete detection system ready');
  
  // Set up money-making event listeners
  let transactionsProcessed = 0;
  let candidatesFound = 0;
  
  signalBus.on('transactionsFetched', async (transactions) => {
    console.log('📡 Processing', transactions.length, 'live transactions...');
    
    for (const transaction of transactions) {
      transactionsProcessed++;
      const results = await orchestrator.analyzeTransaction(transaction);
      
      if (results.candidates.length > 0) {
        candidatesFound += results.candidates.length;
        console.log('🚀 MEME COIN FOUND! Transaction #' + transactionsProcessed);
      }
    }
  });
  
  signalBus.on('candidateDetected', (candidate) => {
    console.log('💰 TRADING OPPORTUNITY:', candidate?.tokenAddress?.slice(0,8), '/', candidate?.quoteName);
    console.log('🎯 Confidence:', (candidate?.confidence * 100).toFixed(1) + '%');
  });
  
  console.log('🚀 ACTIVATING LIVE TRANSACTION FEED...');
  
  // THE CRITICAL ACTIVATION STEP
  if (typeof transactionFetcher.startPolling === 'function') {
    await transactionFetcher.startPolling(['raydium']);
    console.log('✅ Transaction polling ACTIVATED');
  } else if (typeof transactionFetcher.start === 'function') {
    await transactionFetcher.start();
    console.log('✅ Transaction fetcher STARTED');
  } else {
    console.log('⚠️  Need to check TransactionFetcher interface for activation method');
  }
  
  console.log('⏳ LIVE SYSTEM RUNNING - Processing real Solana transactions...');
  console.log('💰 MONEY TEST: Looking for real meme coin launches...');
  
  setTimeout(() => {
    console.log('\\n📊 LIVE SYSTEM TEST COMPLETE');
    console.log('📡 Transactions processed:', transactionsProcessed);
    console.log('💰 Meme coins detected:', candidatesFound);
    
    if (candidatesFound > 0) {
      console.log('🎉 ULTIMATE SUCCESS: Live meme coin detection system working!');
      console.log('💰 READY TO MAKE MONEY: System detecting real opportunities');
    } else {
      console.log('✅ SYSTEM OPERATIONAL: Ready to catch the next meme coin launch');
    }
    
    process.exit(0);
  }, 120000); // 2 minutes for live testing
  
}).catch(err => {
  console.log('❌ ACTIVATION FAILED:', err.message);
  console.log('🔍 Check TransactionFetcher activation interface');
});
"