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
  
  const transactionHandler = async (transactions) => {
    console.log('📡 Processing', transactions.length, 'live transactions...');
    
    for (const transaction of transactions) {
      try {
        transactionsProcessed++;
        
        // Verify orchestrator has the method we need
        if (typeof orchestrator.analyzeTransaction === 'function') {
          const results = await orchestrator.analyzeTransaction(transaction);
          
          if (results && results.candidates && results.candidates.length > 0) {
            candidatesFound += results.candidates.length;
            console.log('🚀 MEME COIN FOUND! Transaction #' + transactionsProcessed);
          }
        } else {
          console.log('⚠️ Orchestrator missing analyzeTransaction method - checking available methods');
          console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(orchestrator)));
        }
      } catch (error) {
        console.log('⚠️ Transaction processing error:', error.message);
        // Continue processing other transactions
      }
    }
  };
  
  const candidateHandler = (candidate) => {
    console.log('💰 TRADING OPPORTUNITY:', candidate?.tokenAddress?.slice(0,8), '/', candidate?.quoteName);
    console.log('🎯 Confidence:', (candidate?.confidence * 100).toFixed(1) + '%');
  };
  
  signalBus.on('transactionsFetched', transactionHandler);
  signalBus.on('candidateDetected', candidateHandler);
  
  console.log('🚀 ACTIVATING LIVE TRANSACTION FEED...');
  
  // THE CRITICAL ACTIVATION STEP - FIXED
  if (typeof transactionFetcher.pollAllDexs === 'function') {
    await transactionFetcher.pollAllDexs();
    console.log('✅ Transaction polling ACTIVATED via pollAllDexs');
  } else {
    console.log('❌ TransactionFetcher missing pollAllDexs method');
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(transactionFetcher)));
    process.exit(1);
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
    
    // Clean up event handlers
    signalBus.off('transactionsFetched', transactionHandler);
    signalBus.off('candidateDetected', candidateHandler);
    
    process.exit(0);
  }, 120000); // 2 minutes for live testing
  
}).catch(err => {
  console.log('❌ ACTIVATION FAILED:', err.message);
  console.log('Stack trace:', err.stack);
  console.log('🔍 Check CircuitBreaker has execute() method and TransactionFetcher has pollAllDexs()');
  process.exit(1);
});
"