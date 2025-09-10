#!/usr/bin/env node

// Quick test version of extended load test
console.log('Starting quick test...');

const mockPool = {
  request: async (method, params) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (Math.random() > 0.2) {
      return { result: 'ok' };
    }
    throw new Error('Simulated failure');
  }
};

async function runQuickTest() {
  let successCount = 0;
  let failCount = 0;
  
  console.log('Making 10 test requests...');
  
  for (let i = 0; i < 10; i++) {
    try {
      await mockPool.request('test', []);
      successCount++;
      console.log(`Request ${i+1}: SUCCESS`);
    } catch (error) {
      failCount++;
      console.log(`Request ${i+1}: FAILED`);
    }
  }
  
  console.log(`\nResults: ${successCount} successful, ${failCount} failed`);
  console.log(`Success rate: ${(successCount/10*100).toFixed(1)}%`);
}

runQuickTest().then(() => {
  console.log('Test complete');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});