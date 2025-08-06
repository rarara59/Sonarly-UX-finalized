// Test pool validator fixes with debug
import { PoolValidator } from './src/detection/validation/pool-validator.js';

async function runTests() {
  console.log('🧪 Testing Pool Validator Input Validation Fixes\n');
  
  const pv = new PoolValidator({});
  let passed = 0;
  let total = 0;
  
  // Test 1: null dexType handling
  total++;
  try {
    const result = await pv.validatePool('test', null);
    console.log('Test 1 result:', result);
    if (result.reason === 'invalid_dex_type') {
      console.log('✅ Test 1 PASS: Null dexType handled correctly');
      passed++;
    } else {
      console.log('❌ Test 1 FAIL: Null dexType not caught, reason:', result.reason);
    }
  } catch (e) {
    console.log('❌ Test 1 FAIL: Crashed on null dexType:', e.message);
  }
  
  // Test 2: empty string dexType
  total++;
  try {
    const result = await pv.validatePool('test', '   ');
    console.log('Test 2 result:', result);
    if (result.reason === 'invalid_dex_type') {
      console.log('✅ Test 2 PASS: Empty dexType handled correctly');
      passed++;
    } else {
      console.log('❌ Test 2 FAIL: Empty dexType not caught, reason:', result.reason);
    }
  } catch (e) {
    console.log('❌ Test 2 FAIL: Crashed on empty dexType:', e.message);
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests`);
}

runTests().catch(console.error);