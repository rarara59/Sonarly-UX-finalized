node -e "
console.log('🎯 CORRECTED DETECTION TEST: Proper architecture integration');

Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/core/signal-bus.js'),
  import('./src/detection/validation/token-validator.js'),
  import('./src/detection/detectors/raydium-detector.js'),
  import('./src/detection/detectors/detector-orchestrator.js')
]).then(async ([rpcModule, cbModule, signalModule, validatorModule, raydiumModule, orchestratorModule]) => {

  console.log('✅ All 6 modules loaded');
  
  // Step 1: Create core dependencies
  const rpcPool = new rpcModule.RpcConnectionPool({
    helius: { url: 'https://api.mainnet-beta.solana.com', priority: 1 }
  });
  const circuitBreaker = new cbModule.CircuitBreaker();
  const signalBus = new signalModule.SignalBus();
  const tokenValidator = new validatorModule.TokenValidator(rpcPool, circuitBreaker);
  
  console.log('✅ Core dependencies created');
  
  // Step 2: Create RaydiumDetector with all required dependencies
  const raydiumDetector = new raydiumModule.RaydiumDetector(
    signalBus, 
    tokenValidator, 
    circuitBreaker
  );
  
  console.log('✅ RaydiumDetector created');
  
  // Step 3: Create detectors object in format orchestrator expects
  const detectors = {
    raydium: raydiumDetector,
    pumpfun: null,  // Not implemented yet
    orca: null      // Not implemented yet  
  };
  
  // Step 4: Create DetectorOrchestrator with proper structure
  const orchestrator = new orchestratorModule.DetectorOrchestrator(
    detectors, 
    signalBus, 
    circuitBreaker
  );
  
  console.log('✅ DetectorOrchestrator created with raydium detector');
  
  // Step 5: Listen for actual detection results
  let candidatesFound = 0;
  signalBus.on('candidateDetected', (candidate) => {
    candidatesFound++;
    console.log('🚀 CANDIDATE #' + candidatesFound + ':', candidate?.tokenAddress?.slice(0,8) + '...');
    console.log('💰 TOKEN PAIR:', candidate?.quoteName);
  });
  
  signalBus.on('candidateBatchDetected', (batch) => {
    console.log('📊 BATCH DETECTED:', batch.candidates.length, 'candidates in batch');
  });
  
  console.log('⏳ Testing REAL detection capability for 60 seconds...');
  console.log('🎯 Waiting for actual Solana meme coin launches...');
  
  setTimeout(() => {
    console.log('\\n📊 DETECTION TEST COMPLETE');
    console.log('💰 Total candidates found:', candidatesFound);
    console.log('🎯 Orchestrator stats:', orchestrator.getStats());
    
    if (candidatesFound > 0) {
      console.log('🎉 SUCCESS: System can detect real meme coins!');
    } else {
      console.log('❓ No candidates found - system working but no launches detected in test window');
    }
    
    process.exit(0);
  }, 60000);

}).catch(err => {
  console.log('❌ DETECTION TEST FAILED:', err.message);
  console.log('🔍 Error details:', err.stack);
});
"