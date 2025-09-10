/**
 * Test execute method - Complete circuit breaker integration
 * Run with: node test-execute-complete.js
 */

import { CircuitBreaker, CircuitBreakerError } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing Complete Circuit Breaker Execute Method...\n');

// Test 1: Successful operation in CLOSED state
console.log('Test 1: Successful operation in CLOSED state');
try {
  const breaker = new CircuitBreaker('test');
  
  const result = await breaker.execute(async () => {
    return 'success';
  });
  
  if (result === 'success' && breaker.stats.successCount === 1 && breaker.stats.totalRequests === 1) {
    console.log('✅ Successful operation executed correctly');
  } else {
    console.log('❌ Successful operation failed. Result:', result, 'Stats:', breaker.stats);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 2: Failed operation in CLOSED state (infrastructure failure)
console.log('\nTest 2: Failed operation in CLOSED state (infrastructure failure)');
try {
  const breaker = new CircuitBreaker('test');
  
  try {
    await breaker.execute(async () => {
      const error = new Error('Connection timeout');
      error.code = 'ETIMEDOUT';
      throw error;
    });
    console.log('❌ Should have thrown error');
  } catch (error) {
    if (error.code === 'ETIMEDOUT' && breaker.stats.failureCount === 1 && breaker.stats.totalRequests === 1) {
      console.log('✅ Infrastructure failure recorded correctly');
    } else {
      console.log('❌ Infrastructure failure not handled correctly');
    }
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 3: Failed operation that shouldn't trip circuit (client error)
console.log('\nTest 3: Failed operation that shouldnt trip circuit (client error)');
try {
  const breaker = new CircuitBreaker('test');
  
  try {
    await breaker.execute(async () => {
      const error = new Error('Bad Request');
      error.status = 400;
      throw error;
    });
    console.log('❌ Should have thrown error');
  } catch (error) {
    if (error.status === 400 && breaker.stats.failureCount === 0 && breaker.stats.totalRequests === 1) {
      console.log('✅ Client error passed through without tripping circuit');
    } else {
      console.log('❌ Client error not handled correctly. Failures:', breaker.stats.failureCount);
    }
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 4: Circuit opens after failure threshold
console.log('\nTest 4: Circuit opens after failure threshold (3 failures, threshold 3)');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 3 });
  
  // Record 3 failures
  for (let i = 0; i < 3; i++) {
    try {
      await breaker.execute(async () => {
        const error = new Error('Server Error');
        error.status = 500;
        throw error;
      });
    } catch (error) {
      // Expected to fail
    }
  }
  
  if (breaker.state === 'OPEN' && breaker.stats.failureCount === 3) {
    console.log('✅ Circuit opened after threshold reached');
  } else {
    console.log('❌ Circuit should be OPEN. State:', breaker.state, 'Failures:', breaker.stats.failureCount);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 5: OPEN state rejects requests immediately
console.log('\nTest 5: OPEN state rejects requests immediately');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 1 });
  
  // Trip the circuit
  try {
    await breaker.execute(async () => {
      throw new Error('ETIMEDOUT');
    });
  } catch (error) {
    // Expected
  }
  
  // Now try to execute - should be rejected
  try {
    await breaker.execute(async () => {
      return 'should not execute';
    });
    console.log('❌ Should have been rejected');
  } catch (error) {
    if (error instanceof CircuitBreakerError && error.state === 'OPEN' && breaker.stats.rejectedRequests === 1) {
      console.log('✅ OPEN circuit correctly rejected request');
    } else {
      console.log('❌ Request not rejected correctly. Error:', error.constructor.name, 'Rejected:', breaker.stats.rejectedRequests);
    }
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 6: State timing transition (OPEN → HALF-OPEN)
console.log('\nTest 6: State timing transition (OPEN → HALF-OPEN)');
try {
  const breaker = new CircuitBreaker('test', { 
    failureThreshold: 1, 
    cooldownMs: 10, // Very short for testing
    jitterMs: 0 
  });
  
  // Trip the circuit
  try {
    await breaker.execute(async () => {
      throw new Error('ETIMEDOUT');
    });
  } catch (error) {
    // Expected
  }
  
  // Wait for cooldown
  await new Promise(resolve => setTimeout(resolve, 15));
  
  // Check state - should transition to HALF-OPEN
  const state = breaker.getState();
  if (state === 'HALF-OPEN') {
    console.log('✅ State transitioned from OPEN to HALF-OPEN after cooldown');
  } else {
    console.log('❌ State should be HALF-OPEN after cooldown. State:', state);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 7: HALF-OPEN to CLOSED on success
console.log('\nTest 7: HALF-OPEN to CLOSED on success');
try {
  const breaker = new CircuitBreaker('test', { 
    failureThreshold: 1, 
    cooldownMs: 10,
    jitterMs: 0 
  });
  
  // Trip circuit and wait for cooldown
  try {
    await breaker.execute(async () => {
      throw new Error('ETIMEDOUT');
    });
  } catch (error) {}
  
  await new Promise(resolve => setTimeout(resolve, 15));
  
  // Execute successful operation in HALF-OPEN
  const result = await breaker.execute(async () => {
    return 'recovery success';
  });
  
  if (result === 'recovery success' && breaker.state === 'CLOSED') {
    console.log('✅ Circuit recovered from HALF-OPEN to CLOSED on success');
  } else {
    console.log('❌ Circuit recovery failed. State:', breaker.state, 'Result:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 8: HALF-OPEN to OPEN on failure
console.log('\nTest 8: HALF-OPEN to OPEN on failure');
try {
  const breaker = new CircuitBreaker('test', { 
    failureThreshold: 1, 
    cooldownMs: 10,
    jitterMs: 0 
  });
  
  // Trip circuit and wait for cooldown
  try {
    await breaker.execute(async () => {
      throw new Error('ETIMEDOUT');
    });
  } catch (error) {}
  
  await new Promise(resolve => setTimeout(resolve, 15));
  
  // Execute failing operation in HALF-OPEN
  try {
    await breaker.execute(async () => {
      const error = new Error('Still failing');
      error.status = 503;
      throw error;
    });
  } catch (error) {
    // Expected to fail
  }
  
  if (breaker.state === 'OPEN') {
    console.log('✅ Circuit returned to OPEN after failure in HALF-OPEN');
  } else {
    console.log('❌ Circuit should return to OPEN. State:', breaker.state);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

console.log('\n🏁 Complete circuit breaker testing finished!');
console.log('\n📝 Summary: Full circuit breaker functionality');
console.log('- Execute operations in CLOSED state');
console.log('- Record successes and failures correctly');
console.log('- Distinguish infrastructure vs client errors');
console.log('- Transition to OPEN at failure threshold');
console.log('- Reject requests immediately when OPEN');
console.log('- Transition OPEN → HALF-OPEN after cooldown');
console.log('- Transition HALF-OPEN → CLOSED on success');
console.log('- Transition HALF-OPEN → OPEN on failure');
console.log('- Complete state machine implementation');