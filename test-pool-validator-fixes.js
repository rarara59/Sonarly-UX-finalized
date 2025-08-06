// Test pool validator fixes
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
    if (result.reason === 'invalid_dex_type') {
      console.log('✅ Test 1 PASS: Null dexType handled correctly');
      passed++;
    } else {
      console.log('❌ Test 1 FAIL: Null dexType not caught');
    }
  } catch (e) {
    console.log('❌ Test 1 FAIL: Crashed on null dexType:', e.message);
  }
  
  // Test 2: empty string dexType
  total++;
  try {
    const result = await pv.validatePool('test', '   ');
    if (result.reason === 'invalid_dex_type') {
      console.log('✅ Test 2 PASS: Empty dexType handled correctly');
      passed++;
    } else {
      console.log('❌ Test 2 FAIL: Empty dexType not caught');
    }
  } catch (e) {
    console.log('❌ Test 2 FAIL: Crashed on empty dexType:', e.message);
  }
  
  // Test 3: invalid address length
  total++;
  try {
    const result = await pv.validatePool('shortaddr', 'raydium');
    if (result.reason === 'invalid_pool_address') {
      console.log('✅ Test 3 PASS: Invalid address length caught');
      passed++;
    } else {
      console.log('❌ Test 3 FAIL: Invalid address not caught');
    }
  } catch (e) {
    console.log('❌ Test 3 FAIL: Crashed on invalid address:', e.message);
  }
  
  // Test 4: valid 44-char address
  total++;
  try {
    const result = await pv.validatePool('11111111111111111111111111111111111111111111', 'raydium');
    if (result.reason !== 'invalid_pool_address') {
      console.log('✅ Test 4 PASS: Valid 44-char address accepted');
      passed++;
    } else {
      console.log('❌ Test 4 FAIL: Valid address rejected');
    }
  } catch (e) {
    console.log('❌ Test 4 FAIL: Crashed on valid address:', e.message);
  }
  
  // Test 5: performance fallback
  total++;
  try {
    delete global.performance;
    const pv2 = new PoolValidator({});
    console.log('✅ Test 5 PASS: Performance fallback works');
    passed++;
  } catch (e) {
    console.log('❌ Test 5 FAIL: Performance fallback failed:', e.message);
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  console.log(passed === total ? '🎉 All tests passed!' : '⚠️  Some tests failed');
}

runTests().catch(console.error);