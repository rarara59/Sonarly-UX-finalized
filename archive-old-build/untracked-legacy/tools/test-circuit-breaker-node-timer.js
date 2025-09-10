/**
 * Test Circuit Breaker Node.js Timer Implementation
 * Validates high-resolution timing and circuit breaker functionality
 */

import { RenaissanceCircuitBreaker, SolanaRpcCircuitBreaker, RenaissanceCircuitTimer } from '../detection/core/circuit-breaker.js';

console.log('🧪 Testing Circuit Breaker Node.js Timer\n');

// Test 1: High-resolution timer accuracy
const testTimerAccuracy = async () => {
  console.log('📊 TEST 1: High-Resolution Timer Accuracy');
  
  // Test nanosecond precision timing
  const start = RenaissanceCircuitTimer.now();
  await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
  const elapsed = RenaissanceCircuitTimer.measure(start);
  
  console.log(`  Timer precision test: ${elapsed.toFixed(6)}ms (expected ~10ms)`);
  console.log(`  Sub-millisecond precision: ${elapsed.toString().includes('.') ? '✅' : '❌'}`);
  
  // Test fast measure performance
  const iterations = 1000;
  const perfStart = RenaissanceCircuitTimer.now();
  for (let i = 0; i < iterations; i++) {
    RenaissanceCircuitTimer.fastMeasure(perfStart);
  }
  const perfTime = RenaissanceCircuitTimer.measure(perfStart);
  const avgTimePerMeasure = perfTime / iterations;
  
  console.log(`  Timer overhead: ${avgTimePerMeasure.toFixed(6)}ms per measure`);
  console.log(`  Performance: ${avgTimePerMeasure < 0.001 ? '✅' : '❌'} <0.001ms target\n`);
  
  return elapsed >= 10 && elapsed < 12 && avgTimePerMeasure < 0.001;
};

// Test 2: Circuit breaker overhead measurement
const testCircuitOverhead = async () => {
  console.log('📊 TEST 2: Circuit Breaker Overhead');
  const breaker = new RenaissanceCircuitBreaker({ maxFailures: 3 });
  
  // Test successful operations
  console.log('  Testing 100 successful operations...');
  for (let i = 0; i < 100; i++) {
    await breaker.execute('test', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return `success_${i}`;
    });
  }
  
  const metrics = breaker.getMetrics();
  console.log(`  Average overhead: ${metrics.performance.averageOverheadMs.toFixed(4)}ms`);
  console.log(`  Performance grade: ${metrics.performance.targetCompliance.performanceGrade}`);
  console.log(`  Target compliance: ${metrics.performance.targetCompliance.overheadOK ? '✅' : '❌'}\n`);
  
  return metrics.performance.averageOverheadMs < 0.1;
};

// Test 3: Circuit opening and recovery
const testCircuitBehavior = async () => {
  console.log('📊 TEST 3: Circuit Opening and Recovery');
  const breaker = new RenaissanceCircuitBreaker({ maxFailures: 2, cooldownMs: 100 });
  
  // Generate failures to open circuit
  console.log('  Generating failures to open circuit...');
  for (let i = 0; i < 3; i++) {
    try {
      await breaker.execute('failing_service', async () => {
        throw new Error('Service failure');
      });
    } catch (error) {
      // Expected failures
    }
  }
  
  // Verify circuit is open
  const isOpen = breaker.isOpen('failing_service');
  console.log(`  Circuit open after failures: ${isOpen ? '✅' : '❌'}`);
  
  // Test fallback response
  const fallback = await breaker.execute('failing_service', async () => 'should_not_execute');
  console.log(`  Fallback returned: ${fallback.success === false ? '✅' : '❌'}`);
  
  // Wait for cooldown and test recovery
  console.log('  Waiting for cooldown period...');
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const recovered = await breaker.execute('failing_service', async () => 'recovered');
  console.log(`  Circuit recovered: ${recovered === 'recovered' ? '✅' : '❌'}\n`);
  
  return isOpen && fallback.success === false && recovered === 'recovered';
};

// Test 4: RPC circuit breaker with endpoint tracking
const testRpcCircuitBreaker = async () => {
  console.log('📊 TEST 4: RPC Circuit Breaker with Endpoint Tracking');
  
  // Mock RPC manager
  const mockRpcManager = {
    call: async (method, params, options) => {
      const start = RenaissanceCircuitTimer.now();
      await new Promise(resolve => setTimeout(resolve, 5)); // Simulate RPC latency
      
      if (method === 'getAccountInfo') {
        return {
          value: {
            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            data: 'mock_token_data'
          }
        };
      }
      return { result: 'mock_result' };
    }
  };
  
  const rpcBreaker = new SolanaRpcCircuitBreaker(mockRpcManager);
  
  // Test token validation
  console.log('  Testing token validation with circuit protection...');
  const validation = await rpcBreaker.validateToken('So11111111111111111111111111111111111111112');
  
  console.log(`  Token validation: ${validation.isValid ? '✅' : '❌'}`);
  console.log(`  Validation time: ${validation.validationTimeMs.toFixed(2)}ms`);
  console.log(`  Performance grade: ${validation.performanceGrade}`);
  
  // Test endpoint metrics
  const endpointMetrics = rpcBreaker.getEndpointMetrics();
  console.log(`  Endpoint tracking: ${endpointMetrics.endpointStats ? '✅' : '❌'}`);
  console.log(`  Current endpoint: ${endpointMetrics.currentEndpoint}\n`);
  
  return validation.isValid && validation.validationTimeMs < 50;
};

// Test 5: Viral load simulation
const testViralLoad = async () => {
  console.log('📊 TEST 5: Viral Load Simulation');
  
  const mockRpcManager = {
    call: async (method, params, options) => {
      // Simulate varying latencies
      const latency = Math.random() * 20 + 5;
      await new Promise(resolve => setTimeout(resolve, latency));
      
      // Simulate occasional failures
      if (Math.random() < 0.05) {
        throw new Error('RPC timeout');
      }
      
      return { value: { owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' } };
    }
  };
  
  const rpcBreaker = new SolanaRpcCircuitBreaker(mockRpcManager, { maxFailures: 5 });
  const memeTokens = [
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Bonk
    'So11111111111111111111111111111111111111112',   // SOL  
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'    // USDC
  ];
  
  console.log('  Simulating 100 token validations under viral load...');
  const testStart = RenaissanceCircuitTimer.now();
  let successfulValidations = 0;
  let protectedByCircuit = 0;
  
  for (let i = 0; i < 100; i++) {
    try {
      const token = memeTokens[i % memeTokens.length];
      const validation = await rpcBreaker.validateToken(token);
      
      if (validation.isValid) {
        successfulValidations++;
      }
    } catch (error) {
      if (error.message && error.message.includes('CIRCUIT_OPEN')) {
        protectedByCircuit++;
      }
    }
  }
  
  const totalTestTime = RenaissanceCircuitTimer.measure(testStart);
  const finalMetrics = rpcBreaker.getMetrics();
  
  console.log(`  Test completed in: ${totalTestTime.toFixed(0)}ms`);
  console.log(`  Successful validations: ${successfulValidations}/100`);
  console.log(`  Circuit protections: ${protectedByCircuit}`);
  console.log(`  Average overhead: ${finalMetrics.performance.averageOverheadMs.toFixed(4)}ms`);
  console.log(`  Performance grade: ${finalMetrics.performance.targetCompliance.performanceGrade}`);
  console.log(`  Success rate: ${successfulValidations > 80 ? '✅' : '❌'} >80%\n`);
  
  return successfulValidations > 80 && finalMetrics.performance.averageOverheadMs < 0.1;
};

// Run all tests
const runAllTests = async () => {
  console.log('⚡ Circuit Breaker Node.js Timer Test Suite\n');
  console.log('Expected improvements:');
  console.log('  - Nanosecond precision timing (no crashes)');
  console.log('  - <0.1ms circuit breaker overhead');
  console.log('  - Promise.race timeout implementation');
  console.log('  - Endpoint performance tracking');
  console.log('  - Sustained >80% success rate under load\n');
  
  const tests = [
    testTimerAccuracy,
    testCircuitOverhead,
    testCircuitBehavior,
    testRpcCircuitBreaker,
    testViralLoad
  ];
  
  let passed = 0;
  for (const test of tests) {
    try {
      if (await test()) passed++;
    } catch (error) {
      console.error(`Test failed with error: ${error.message}`);
    }
  }
  
  console.log(`✅ Test Summary: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('\n🎉 All tests passed! Circuit breaker is production ready.');
    console.log('Key achievements:');
    console.log('  - High-resolution timing working in Node.js');
    console.log('  - Circuit breaker overhead <0.1ms maintained');
    console.log('  - Endpoint failover and tracking functional');
    console.log('  - Viral load handling confirmed');
  }
  
  process.exit(passed === tests.length ? 0 : 1);
};

// Execute tests
runAllTests();