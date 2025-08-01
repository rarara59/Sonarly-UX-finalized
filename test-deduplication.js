import rpcManager from './src/services/rpc-connection-manager.js';

async function testDeduplication() {
  console.log('Testing request deduplication...');
  
  // Use the singleton instance directly
  
  // Make 5 identical requests simultaneously
  const testAddress = 'So11111111111111111111111111111111111111112'; // WSOL
  
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(rpcManager.getAccountInfo(testAddress, 1));
  }
  
  console.log('Executing 5 identical requests...');
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`✅ All 5 requests completed in ${endTime - startTime}ms`);
    console.log(`Results identical: ${results.every(r => JSON.stringify(r) === JSON.stringify(results[0]))}`);
    
    // Check deduplication stats
    const stats = rpcManager.dedupStats;
    console.log(`Dedup stats: ${stats.hits} hits, ${stats.misses} misses, ${stats.savings} API calls saved`);
    
    if (stats.hits > 0) {
      console.log('✅ Request deduplication working correctly');
    } else {
      console.log('❌ Request deduplication not working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDeduplication();
