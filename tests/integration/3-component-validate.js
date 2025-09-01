#!/usr/bin/env node

/**
 * Validation Test: TokenBucket + CircuitBreaker + ConnectionPoolCore
 * Tests 3-component integration without network calls
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';

class MockExecutor {
  constructor() {
    this.requestCount = 0;
    this.failurePattern = [];
    this.shouldFail = false;
  }
  
  setFailurePattern(pattern) {
    this.failurePattern = pattern;
  }
  
  async execute(operation) {
    this.requestCount++;
    
    // Check if this request should fail based on pattern
    if (this.failurePattern.length > 0) {
      const shouldFail = this.failurePattern[this.requestCount - 1] || false;
      if (shouldFail) {
        throw new Error('Simulated failure');
      }
    }
    
    if (this.shouldFail) {
      throw new Error('Forced failure');
    }
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
    
    return {
      success: true,
      data: `Result for ${operation}`,
      timestamp: Date.now()
    };
  }
}

async function validateThreeComponentChain() {
  console.log('=' .repeat(60));
  console.log('3-Component Chain Validation');
  console.log('TokenBucket + CircuitBreaker + ConnectionPoolCore');
  console.log('=' .repeat(60));
  
  const results = {
    tests: [],
    passed: 0,
    failed: 0
  };
  
  // Test 1: Component Initialization
  console.log('\n📝 Test 1: Component Initialization');
  
  let rateLimiter, circuitBreaker, connectionPool;
  
  try {
    rateLimiter = new TokenBucket({
      rateLimit: 50,
      windowMs: 1000,
      maxBurst: 75
    });
    console.log('✅ TokenBucket initialized (50 rps)');
    results.tests.push({ name: 'TokenBucket init', passed: true });
    results.passed++;
  } catch (error) {
    console.log('❌ TokenBucket initialization failed:', error.message);
    results.tests.push({ name: 'TokenBucket init', passed: false });
    results.failed++;
  }
  
  try {
    circuitBreaker = new CircuitBreaker({
      threshold: 6,
      timeout: 30000,
      windowSize: 10000,
      cooldownTime: 1000 // Short cooldown for testing
    });
    console.log('✅ CircuitBreaker initialized (threshold: 6)');
    results.tests.push({ name: 'CircuitBreaker init', passed: true });
    results.passed++;
  } catch (error) {
    console.log('❌ CircuitBreaker initialization failed:', error.message);
    results.tests.push({ name: 'CircuitBreaker init', passed: false });
    results.failed++;
  }
  
  try {
    connectionPool = new ConnectionPoolCore({
      maxSockets: 20,
      maxSocketsPerHost: 10
    });
    console.log('✅ ConnectionPoolCore initialized (20 sockets)');
    results.tests.push({ name: 'ConnectionPoolCore init', passed: true });
    results.passed++;
  } catch (error) {
    console.log('❌ ConnectionPoolCore initialization failed:', error.message);
    results.tests.push({ name: 'ConnectionPoolCore init', passed: false });
    results.failed++;
  }
  
  // Test 2: Circuit Breaker Opens After 6 Failures
  console.log('\n📝 Test 2: Circuit Breaker Activation (6 failures)');
  
  try {
    const cb = new CircuitBreaker({
      threshold: 6,
      timeout: 30000,
      windowSize: 10000
    });
    
    const mockExecutor = new MockExecutor();
    mockExecutor.shouldFail = true;
    
    let openedAfterSix = false;
    let failureCount = 0;
    
    cb.on('open', () => {
      if (failureCount === 6) {
        openedAfterSix = true;
      }
    });
    
    // Send 8 failing requests
    for (let i = 0; i < 8; i++) {
      try {
        await cb.execute(`test_${i}`, () => mockExecutor.execute(`op_${i}`));
      } catch (error) {
        failureCount++;
        const metrics = cb.getMetrics();
        console.log(`  Request ${i + 1}: Failed | State: ${metrics.state} | Failures: ${metrics.failures}`);
      }
    }
    
    const finalMetrics = cb.getMetrics();
    
    if (finalMetrics.state === 'OPEN' && openedAfterSix) {
      console.log('✅ Circuit opened after exactly 6 failures');
      results.tests.push({ name: 'Circuit opens at threshold', passed: true });
      results.passed++;
    } else {
      console.log(`❌ Circuit did not open correctly (state: ${finalMetrics.state})`);
      results.tests.push({ name: 'Circuit opens at threshold', passed: false });
      results.failed++;
    }
    
  } catch (error) {
    console.log('❌ Circuit breaker test failed:', error.message);
    results.tests.push({ name: 'Circuit opens at threshold', passed: false });
    results.failed++;
  }
  
  // Test 3: Request Flow Through All Components
  console.log('\n📝 Test 3: Request Flow Through 3 Components');
  
  try {
    const rl = new TokenBucket({
      rateLimit: 10,
      windowMs: 100
    });
    
    const cb = new CircuitBreaker({
      threshold: 6,
      timeout: 30000
    });
    
    const cp = new ConnectionPoolCore({
      maxSockets: 5
    });
    
    const mockExecutor = new MockExecutor();
    
    async function makeRequest(id) {
      // Step 1: Rate limiting
      if (!rl.consume(1)) {
        return { success: false, reason: 'rate_limited' };
      }
      
      // Step 2: Circuit breaker check
      const cbMetrics = cb.getMetrics();
      if (cbMetrics.state === 'OPEN') {
        return { success: false, reason: 'circuit_open' };
      }
      
      // Step 3: Get connection
      const agent = cp.getAgent('https');
      if (!agent) {
        return { success: false, reason: 'no_connection' };
      }
      
      // Step 4: Execute through circuit breaker
      try {
        const result = await cb.execute(`req_${id}`, () => mockExecutor.execute(`op_${id}`));
        return { success: true, data: result };
      } catch (error) {
        return { success: false, reason: 'execution_failed' };
      }
    }
    
    // Send 15 requests
    const requestResults = [];
    for (let i = 0; i < 15; i++) {
      const result = await makeRequest(i);
      requestResults.push(result);
    }
    
    const successCount = requestResults.filter(r => r.success).length;
    const rateLimited = requestResults.filter(r => r.reason === 'rate_limited').length;
    
    console.log(`  Requests: 15`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Rate Limited: ${rateLimited}`);
    console.log(`  Chain Integration: ${successCount > 0 && rateLimited > 0 ? '✅' : '❌'}`);
    
    if (successCount > 0 && rateLimited > 0) {
      console.log('✅ Request flow through all components working');
      results.tests.push({ name: '3-component flow', passed: true });
      results.passed++;
    } else {
      console.log('❌ Component chain not working correctly');
      results.tests.push({ name: '3-component flow', passed: false });
      results.failed++;
    }
    
  } catch (error) {
    console.log('❌ Request flow test failed:', error.message);
    results.tests.push({ name: '3-component flow', passed: false });
    results.failed++;
  }
  
  // Test 4: Circuit Protection During Failures
  console.log('\n📝 Test 4: Circuit Protection During Failures');
  
  try {
    const cb = new CircuitBreaker({
      threshold: 6,
      timeout: 30000,
      cooldownTime: 1000
    });
    
    const mockExecutor = new MockExecutor();
    
    // Set failure pattern: first 7 fail, rest succeed
    mockExecutor.setFailurePattern([
      true, true, true, true, true, true, true, // 7 failures to open circuit
      false, false, false, false, false // These would succeed if allowed
    ]);
    
    const results = [];
    let circuitOpenCount = 0;
    
    for (let i = 0; i < 12; i++) {
      try {
        const result = await cb.execute(`test_${i}`, () => mockExecutor.execute(`op_${i}`));
        results.push({ success: true, data: result });
      } catch (error) {
        const metrics = cb.getMetrics();
        if (metrics.state === 'OPEN') {
          circuitOpenCount++;
          results.push({ success: false, reason: 'circuit_open' });
        } else {
          results.push({ success: false, reason: 'execution_failed' });
        }
      }
    }
    
    const protectedRequests = results.filter(r => r.reason === 'circuit_open').length;
    console.log(`  Total Requests: 12`);
    console.log(`  Protected by Circuit: ${protectedRequests}`);
    console.log(`  System Protected: ${protectedRequests > 0 ? '✅' : '❌'}`);
    
    if (protectedRequests > 0) {
      console.log('✅ Circuit breaker protects system during failures');
      results.tests.push({ name: 'Circuit protection', passed: true });
      results.passed++;
    } else {
      console.log('❌ Circuit breaker not protecting correctly');
      results.tests.push({ name: 'Circuit protection', passed: false });
      results.failed++;
    }
    
  } catch (error) {
    console.log('❌ Circuit protection test failed:', error.message);
    results.tests.push({ name: 'Circuit protection', passed: false });
    results.failed++;
  }
  
  // Test 5: Recovery After Cooldown
  console.log('\n📝 Test 5: Recovery After Cooldown');
  
  try {
    const cb = new CircuitBreaker({
      threshold: 6,
      cooldownTime: 500, // Short cooldown for testing
      windowSize: 5000
    });
    
    const mockExecutor = new MockExecutor();
    mockExecutor.shouldFail = true;
    
    // Open the circuit
    for (let i = 0; i < 7; i++) {
      try {
        await cb.execute(`fail_${i}`, () => mockExecutor.execute(`op_${i}`));
      } catch (error) {
        // Expected failures
      }
    }
    
    const openMetrics = cb.getMetrics();
    console.log(`  State after failures: ${openMetrics.state}`);
    
    // Wait for cooldown
    console.log('  Waiting for cooldown...');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Try recovery with good requests
    mockExecutor.shouldFail = false;
    let recoverySuccess = false;
    
    try {
      await cb.execute('recovery_test', () => mockExecutor.execute('recovery_op'));
      recoverySuccess = true;
    } catch (error) {
      recoverySuccess = false;
    }
    
    const afterMetrics = cb.getMetrics();
    console.log(`  State after recovery attempt: ${afterMetrics.state}`);
    console.log(`  Recovery: ${recoverySuccess || afterMetrics.state === 'HALF_OPEN' ? '✅' : '❌'}`);
    
    if (recoverySuccess || afterMetrics.state === 'HALF_OPEN' || afterMetrics.state === 'CLOSED') {
      console.log('✅ Circuit breaker can recover after cooldown');
      results.tests.push({ name: 'Recovery capability', passed: true });
      results.passed++;
    } else {
      console.log('❌ Circuit breaker recovery not working');
      results.tests.push({ name: 'Recovery capability', passed: false });
      results.failed++;
    }
    
  } catch (error) {
    console.log('❌ Recovery test failed:', error.message);
    results.tests.push({ name: 'Recovery capability', passed: false });
    results.failed++;
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Validation Summary:');
  console.log('-' .repeat(40));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${(results.passed / results.tests.length * 100).toFixed(1)}%`);
  
  console.log('\n✅ Success Criteria Validation:');
  const criteria = {
    '3 components initialize': results.tests.filter(t => t.name.includes('init')).every(t => t.passed),
    'Circuit opens after 6 failures': results.tests.find(t => t.name === 'Circuit opens at threshold')?.passed || false,
    'System continues after circuit opens': results.tests.find(t => t.name === 'Circuit protection')?.passed || false,
    'Recovery capability works': results.tests.find(t => t.name === 'Recovery capability')?.passed || false,
    'Chain integrity maintained': results.tests.find(t => t.name === '3-component flow')?.passed || false
  };
  
  let allCriteriaMet = true;
  for (const [criterion, met] of Object.entries(criteria)) {
    console.log(`${met ? '✅' : '❌'} ${criterion}`);
    if (!met) allCriteriaMet = false;
  }
  
  console.log('\n' + '=' .repeat(60));
  if (allCriteriaMet) {
    console.log('🎉 3-component integration validation successful!');
    console.log('TokenBucket + CircuitBreaker + ConnectionPoolCore working together');
    console.log('Circuit breaker threshold of 6 confirmed');
  } else {
    console.log('⚠️ Some validation criteria not met');
  }
  console.log('=' .repeat(60));
  
  return allCriteriaMet;
}

// Run validation
validateThreeComponentChain()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });