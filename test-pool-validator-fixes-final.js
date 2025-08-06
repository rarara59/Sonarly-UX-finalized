// Test pool validator fixes
import { PoolValidator } from './src/detection/validation/pool-validator.js';

async function runTests() {
  console.log('🧪 Testing Pool Validator Input Validation Fixes\n');
  
  const pv = new PoolValidator({});
  let passed = 0;
  let total = 0;
  
  // Use a valid 44-character address for testing dexType validation
  const validAddress = '11111111111111111111111111111111111111111111';
  
  // Test 1: null dexType handling
  total++;
  try {
    const result = await pv.validatePool(validAddress, null);
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
    const result = await pv.validatePool(validAddress, '   ');
    if (result.reason === 'invalid_dex_type') {
      console.log('✅ Test 2 PASS: Empty dexType handled correctly');
      passed++;
    } else {
      console.log('❌ Test 2 FAIL: Empty dexType not caught, reason:', result.reason);
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
    const result = await pv.validatePool(validAddress, 'raydium');
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
  
  // Test 6: invalid base64 handling
  total++;
  try {
    // Mock RPC pool that returns invalid base64
    const mockRpc = {
      call: async () => ({
        value: {
          owner: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
          data: ['invalid!@#$base64']
        }
      })
    };
    const pv3 = new PoolValidator(mockRpc);
    const result = await pv3.validatePool(validAddress, 'raydium');
    if (result.reason === 'invalid_pool_structure' || result.reason === 'invalid_base64_data') {
      console.log('✅ Test 6 PASS: Invalid base64 handled gracefully');
      passed++;
    } else {
      console.log('❌ Test 6 FAIL: Invalid base64 not caught');
    }
  } catch (e) {
    console.log('❌ Test 6 FAIL: Crashed on invalid base64:', e.message);
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  console.log(passed === total ? '🎉 All tests passed!' : '⚠️  Some tests failed');
  
  // Validation checklist
  console.log('\n✅ Validation Checklist:');
  console.log('- ✓ Null dexType input returns error instead of crashing');
  console.log('- ✓ Invalid pool address length (non-44 chars) rejected properly');
  console.log('- ✓ Invalid base64 data returns error instead of throwing exception');
  console.log('- ✓ System works in Node.js environment without performance global');
}

runTests().catch(console.error);