/**
 * Test _recordFailure method - Run with: node test-record-failure.js
 */

import { CircuitBreaker } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing _recordFailure Method...\n');

// Test 1: Failure count increments
console.log('Test 1: Failure count increments correctly');
try {
  const breaker = new CircuitBreaker('test');
  
  const initialCount = breaker.stats.failureCount;
  breaker._recordFailure();
  
  if (breaker.stats.failureCount === initialCount + 1) {
    console.log('✅ Failure count incremented from', initialCount, 'to', breaker.stats.failureCount);
  } else {
    console.log('❌ Failure count not incremented correctly. Expected:', initialCount + 1, 'Got:', breaker.stats.failureCount);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 2: Total requests increments
console.log('\nTest 2: Total requests increments correctly');
try {
  const breaker = new CircuitBreaker('test');
  
  const initialTotal = breaker.stats.totalRequests;
  breaker._recordFailure();
  
  if (breaker.stats.totalRequests === initialTotal + 1) {
    console.log('✅ Total requests incremented from', initialTotal, 'to', breaker.stats.totalRequests);
  } else {
    console.log('❌ Total requests not incremented correctly. Expected:', initialTotal + 1, 'Got:', breaker.stats.totalRequests);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 3: Multiple failures accumulate
console.log('\nTest 3: Multiple failures accumulate correctly');
try {
  const breaker = new CircuitBreaker('test');
  
  breaker._recordFailure();
  breaker._recordFailure();
  breaker._recordFailure();
  
  if (breaker.stats.failureCount === 3 && breaker.stats.totalRequests === 3) {
    console.log('✅ Multiple failures accumulated correctly: failures=3, total=3');
  } else {
    console.log('❌ Multiple failures not accumulated correctly. Failures:', breaker.stats.failureCount, 'Total:', breaker.stats.totalRequests);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 4: State remains CLOSED below threshold
console.log('\nTest 4: State remains CLOSED below threshold (3 failures, threshold 5)');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 5 });
  
  breaker._recordFailure();
  breaker._recordFailure();
  breaker._recordFailure();
  
  if (breaker.state === 'CLOSED' && breaker.stats.failureCount === 3) {
    console.log('✅ State remains CLOSED below threshold');
  } else {
    console.log('❌ State should be CLOSED. State:', breaker.state, 'Failures:', breaker.stats.failureCount);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 5: State transitions to OPEN at threshold
console.log('\nTest 5: State transitions to OPEN at threshold (5 failures, threshold 5)');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 5 });
  
  // Record failures up to threshold
  for (let i = 0; i < 5; i++) {
    breaker._recordFailure();
  }
  
  if (breaker.state === 'OPEN' && breaker.stats.failureCount === 5) {
    console.log('✅ State transitioned to OPEN at threshold');
    console.log('   openedAt timestamp set:', breaker.openedAt ? 'Yes' : 'No');
  } else {
    console.log('❌ State should be OPEN. State:', breaker.state, 'Failures:', breaker.stats.failureCount);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 6: State transitions to OPEN above threshold
console.log('\nTest 6: State transitions to OPEN above threshold (6 failures, threshold 5)');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 5 });
  
  // Record failures beyond threshold
  for (let i = 0; i < 6; i++) {
    breaker._recordFailure();
  }
  
  if (breaker.state === 'OPEN' && breaker.stats.failureCount === 6) {
    console.log('✅ State transitioned to OPEN above threshold');
  } else {
    console.log('❌ State should be OPEN. State:', breaker.state, 'Failures:', breaker.stats.failureCount);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 7: Edge case - threshold of 1
console.log('\nTest 7: Edge case - threshold of 1');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 1 });
  
  breaker._recordFailure();
  
  if (breaker.state === 'OPEN' && breaker.stats.failureCount === 1) {
    console.log('✅ State transitioned to OPEN with threshold of 1');
  } else {
    console.log('❌ State should be OPEN with threshold=1. State:', breaker.state, 'Failures:', breaker.stats.failureCount);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 8: Stats timestamp is updated
console.log('\nTest 8: Stats lastStateChange is updated');
try {
  const breaker = new CircuitBreaker('test');
  const originalTimestamp = breaker.stats.lastStateChange;
  
  // Small delay to ensure timestamp difference
  await new Promise(resolve => setTimeout(resolve, 1));
  
  breaker._recordFailure();
  
  if (breaker.stats.lastStateChange > originalTimestamp) {
    console.log('✅ lastStateChange timestamp updated');
  } else {
    console.log('❌ lastStateChange timestamp not updated');
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 9: Transition from HALF-OPEN on failure
console.log('\nTest 9: Transition from HALF-OPEN to OPEN on failure');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 1 });
  
  // Force to HALF-OPEN state
  breaker.forceState('HALF-OPEN');
  
  breaker._recordFailure();
  
  if (breaker.state === 'OPEN') {
    console.log('✅ State transitioned from HALF-OPEN to OPEN on failure');
  } else {
    console.log('❌ Should transition to OPEN from HALF-OPEN. State:', breaker.state);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

console.log('\n🏁 _recordFailure testing complete!');
console.log('\n📝 Summary: Testing failure recording and state transitions');
console.log('- Should increment failure count');
console.log('- Should increment total requests');
console.log('- Should accumulate multiple failures');
console.log('- Should keep state CLOSED below threshold');
console.log('- Should transition to OPEN at/above threshold');
console.log('- Should handle edge cases (threshold=1)');
console.log('- Should update stats timestamps');
console.log('- Should work from any initial state');