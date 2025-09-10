// run-all-tests.js
async function runAllTests() {
  console.log('🧪 RENAISSANCE DETECTOR TEST SUITE\n');
  
  const tests = [
    { name: 'Basic Initialization', file: './test-detector-init.js' },
    { name: 'Token Validation', file: './test-token-validation.js' },
    { name: 'Binary Parsing', file: './test-binary-parsing.js' },
    { name: 'RPC Integration', file: './test-rpc-integration.js' },
    { name: 'Live Detection (30s)', file: './test-live-detection.js' }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`🧪 Running: ${test.name}`);
    try {
      const result = await import(test.file);
      if (result) passed++;
      console.log(`✅ ${test.name}: PASSED\n`);
    } catch (error) {
      console.error(`❌ ${test.name}: FAILED - ${error.message}\n`);
    }
  }
  
  console.log(`📊 TEST RESULTS: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED - Your detector is ready for production!');
  } else {
    console.log('⚠️ Some tests failed - check the error messages above');
  }
}

runAllTests();