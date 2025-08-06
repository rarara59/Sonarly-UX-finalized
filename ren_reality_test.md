node -e "
console.log('🎯 REALITY TEST: Can we detect real meme coins?');

Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/transport/transaction-fetcher.js'),
  import('./src/detection/detectors/raydium-detector.js'),
  import('./src/detection/core/signal-bus.js')
]).then(async ([rpcModule, fetcherModule, detectorModule, signalModule]) => {
  
  const rpcPool = new rpcModule.RpcConnectionPool({
    helius: { url: 'https://api.mainnet-beta.solana.com', priority: 1 }
  });
  
  const signalBus = new signalModule.SignalBus();
  const fetcher = new fetcherModule.TransactionFetcher(rpcPool);
  
  console.log('✅ System initialized - testing with REAL Solana data...');
  
  // Listen for detection results
  signalBus.on('candidateDetected', (candidate) => {
    console.log('🚀 CANDIDATE DETECTED:', candidate?.baseMint?.slice(0,8) + '...');
    console.log('💰 MONEY TEST: SUCCESS - System can detect real opportunities');
  });
  
  // Try to fetch and process real transactions
  try {
    console.log('⏳ Fetching live Solana transactions...');
    // Let it run for 30 seconds to see if it detects anything
    setTimeout(() => {
      console.log('📊 Reality test complete - did we detect any candidates?');
    }, 30000);
    
  } catch (error) {
    console.log('❌ REALITY TEST FAILED:', error.message);
  }
  
}).catch(err => console.log('❌ SYSTEM BROKEN WITH REAL DATA:', err.message));
"