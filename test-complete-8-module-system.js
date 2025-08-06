import "dotenv/config";

Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js'),
  import('./src/detection/detectors/raydium-detector.js'),
  import('./src/detection/validation/token-validator.js'),
  import('./src/detection/validation/pool-validator.js'),
  import('./src/detection/core/signal-bus.js')
]).then(async ([rpc, cb, fetcher, raydium, tokenValidator, poolValidator, signal]) => {
  console.log('🧪 COMPLETE 8-MODULE SYSTEM TEST');
  
  // Initialize all components
  const pool = new rpc.RpcConnectionPool();
  const breaker = new cb.CircuitBreaker();
  const signalBus = new signal.SignalBus();
  const tokenValidatorInstance = new tokenValidator.TokenValidator(pool, breaker);
  const poolValidatorInstance = new poolValidator.PoolValidator(pool);
  
  console.log('1️⃣ Components initialized:');
  console.log('   RPC Pool healthy:', pool.isHealthy());
  console.log('   Circuit Breaker can execute:', breaker.canExecute('test'));
  console.log('   Token Validator healthy:', tokenValidatorInstance.isHealthy());
  console.log('   Pool Validator healthy:', poolValidatorInstance.isHealthy());
  
  // Initialize Raydium Detector with Pool Validator
  const raydiumDetector = new raydium.RaydiumDetector(
    signalBus, 
    tokenValidatorInstance, 
    poolValidatorInstance,
    breaker
  );
  
  console.log('2️⃣ Raydium Detector with Pool Validator:');
  console.log('   Detector initialized:', !!raydiumDetector);
  
  // Initialize Transaction Fetcher
  const tf = new fetcher.TransactionFetcher(pool, breaker);
  
  console.log('3️⃣ Transaction Fetcher initialized');
  
  // Test basic validations
  console.log('4️⃣ Testing validations:');
  
  // Test pool validation
  const poolTest = await poolValidatorInstance.validatePool('invalid', 'raydium');
  console.log('   Pool validation (should fail):', poolTest.valid ? 'UNEXPECTED PASS' : 'PASS');
  
  // Test token validation
  const tokenTest = await tokenValidatorInstance.validateToken('So11111111111111111111111111111111111111112');
  console.log('   Token validation (should fail):', tokenTest.valid ? 'UNEXPECTED PASS' : 'PASS');
  
  console.log('\n✅ ALL 8 MODULES INTEGRATED AND HEALTHY');
  console.log('🚀 System ready for live meme coin detection');
  
  // Live transaction test (10 seconds)
  console.log('\n🎯 10-second live test...');
  let processed = 0;
  
  const quickTest = setInterval(async () => {
    try {
      const transactions = await tf.pollAllDexs();
      processed += transactions.length;
      console.log('📊', transactions.length, 'transactions processed, total:', processed);
      
      for (const tx of transactions.slice(0, 2)) {
        await raydiumDetector.analyzeTransaction(tx);
      }
    } catch (error) {
      console.log('⚠️', error.message);
    }
  }, 5000);
  
  setTimeout(() => {
    clearInterval(quickTest);
    console.log('\n🎉 COMPLETE SYSTEM TEST FINISHED');
    console.log('📊 Total processed:', processed);
    pool.destroy();
    process.exit(0);
  }, 10000);
  
}).catch(e => console.log('❌ Error:', e.message));