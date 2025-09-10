/**
 * Test _shouldTransitionToOpen method - Run with: node test-should-transition-to-open.js
 */

import { CircuitBreaker } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing _shouldTransitionToOpen Method...\n');

// Test 1: Below threshold should not transition
console.log('Test 1: Below threshold (2 failures, threshold 5) should not transition');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 5 });
  
  // Manually set failure count below threshold
  breaker.stats.failureCount = 2;
  
  const result = breaker._shouldTransitionToOpen();
  if (result === false) {
    console.log('✅ Correctly returned false for failures below threshold');
  } else {
    console.log('❌ Should return false when failures < threshold, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 2: At threshold should transition
console.log('\nTest 2: At threshold (5 failures, threshold 5) should transition');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 5 });
  
  // Manually set failure count at threshold
  breaker.stats.failureCount = 5;
  
  const result = breaker._shouldTransitionToOpen();
  if (result === true) {
    console.log('✅ Correctly returned true for failures at threshold');
  } else {
    console.log('❌ Should return true when failures = threshold, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 3: Above threshold should transition
console.log('\nTest 3: Above threshold (7 failures, threshold 5) should transition');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 5 });
  
  // Manually set failure count above threshold
  breaker.stats.failureCount = 7;
  
  const result = breaker._shouldTransitionToOpen();
  if (result === true) {
    console.log('✅ Correctly returned true for failures above threshold');
  } else {
    console.log('❌ Should return true when failures > threshold, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 4: Zero failures should not transition
console.log('\nTest 4: Zero failures should not transition');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 3 });
  
  // Failure count should be 0 by default
  const result = breaker._shouldTransitionToOpen();
  if (result === false) {
    console.log('✅ Correctly returned false for zero failures');
  } else {
    console.log('❌ Should return false for zero failures, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 5: Edge case - threshold of 1
console.log('\nTest 5: Edge case - threshold of 1, with 1 failure');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 1 });
  
  breaker.stats.failureCount = 1;
  
  const result = breaker._shouldTransitionToOpen();
  if (result === true) {
    console.log('✅ Correctly returned true for threshold of 1 with 1 failure');
  } else {
    console.log('❌ Should return true for threshold=1, failures=1, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 6: Different threshold value
console.log('\nTest 6: Custom threshold (3) with 2 failures');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 3 });
  
  breaker.stats.failureCount = 2;
  
  const result = breaker._shouldTransitionToOpen();
  if (result === false) {
    console.log('✅ Correctly returned false for 2 failures with threshold 3');
  } else {
    console.log('❌ Should return false for failures < threshold, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 7: Custom threshold (3) with 3 failures
console.log('\nTest 7: Custom threshold (3) with 3 failures');
try {
  const breaker = new CircuitBreaker('test', { failureThreshold: 3 });
  
  breaker.stats.failureCount = 3;
  
  const result = breaker._shouldTransitionToOpen();
  if (result === true) {
    console.log('✅ Correctly returned true for 3 failures with threshold 3');
  } else {
    console.log('❌ Should return true for failures = threshold, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

console.log('\n🏁 _shouldTransitionToOpen testing complete!');
console.log('\n📝 Summary: Testing threshold comparison logic');
console.log('- Should return false when failures < threshold');
console.log('- Should return true when failures >= threshold');
console.log('- Should work with different threshold values');
console.log('- Should handle edge cases (threshold=1, zero failures)');
console.log('- Should be pure function (no side effects)');