/**
 * Test _recordSuccess method - Run with: node test-record-success.js
 */

import { CircuitBreaker } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing _recordSuccess Method...\n');

// Test 1: Success count increments
console.log('Test 1: Success count increments correctly');
try {
  const breaker = new CircuitBreaker('test');
  
  const initialCount = breaker.stats.successCount;
  breaker._recordSuccess();
  
  if (breaker.stats.successCount === initialCount + 1) {
    console.log('✅ Success count incremented from', initialCount, 'to', breaker.stats.successCount);
  } else {
    console.log('❌ Success count not incremented correctly. Expected:', initialCount + 1, 'Got:', breaker.stats.successCount);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 2: Total requests increments
console.log('\nTest 2: Total requests increments correctly');
try {
  const breaker = new CircuitBreaker('test');
  
  const initialTotal = breaker.stats.totalRequests;
  breaker._recordSuccess();
  
  if (breaker.stats.totalRequests === initialTotal + 1) {
    console.log('✅ Total requests incremented from', initialTotal, 'to', breaker.stats.totalRequests);
  } else {
    console.log('❌ Total requests not incremented correctly. Expected:', initialTotal + 1, 'Got:', breaker.stats.totalRequests);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 3: Failure count resets to zero
console.log('\nTest 3: Failure count resets to zero (circuit healing)');
try {
  const breaker = new CircuitBreaker('test');
  
  // Set up some failures first
  breaker.stats.failureCount = 3;
  
  breaker._recordSuccess();
  
  if (breaker.stats.failureCount === 0) {
    console.log('✅ Failure count reset to zero after success');
  } else {
    console.log('❌ Failure count should be reset to 0, got:', breaker.stats.failureCount);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 4: Multiple successes accumulate
console.log('\nTest 4: Multiple successes accumulate correctly');
try {
  const breaker = new CircuitBreaker('test');
  
  breaker._recordSuccess();
  breaker._recordSuccess();
  breaker._recordSuccess();
  
  if (breaker.stats.successCount === 3 && breaker.stats.totalRequests === 3) {
    console.log('✅ Multiple successes accumulated correctly: successes=3, total=3');
  } else {
    console.log('❌ Multiple successes not accumulated correctly. Successes:', breaker.stats.successCount, 'Total:', breaker.stats.totalRequests);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 5: State remains CLOSED when already CLOSED
console.log('\nTest 5: State remains CLOSED when already CLOSED');
try {
  const breaker = new CircuitBreaker('test');
  
  breaker._recordSuccess();
  
  if (breaker.state === 'CLOSED') {
    console.log('✅ State remains CLOSED after success');
  } else {
    console.log('❌ State should remain CLOSED, got:', breaker.state);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 6: Stats timestamp is updated
console.log('\nTest 6: Stats lastStateChange is updated');
try {
  const breaker = new CircuitBreaker('test');
  const originalTimestamp = breaker.stats.lastStateChange;
  
  // Small delay to ensure timestamp difference
  await new Promise(resolve => setTimeout(resolve, 1));
  
  breaker._recordSuccess();
  
  if (breaker.stats.lastStateChange > originalTimestamp) {
    console.log('✅ lastStateChange timestamp updated');
  } else {
    console.log('❌ lastStateChange timestamp not updated');
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 7: Success after failures resets failure count
console.log('\nTest 7: Success after failures resets failure count');
try {
  const breaker = new CircuitBreaker('test');
  
  // Record some failures
  breaker._recordFailure();
  breaker._recordFailure();
  
  // Record success
  breaker._recordSuccess();
  
  if (breaker.stats.failureCount === 0 && breaker.stats.successCount === 1 && breaker.stats.totalRequests === 3) {
    console.log('✅ Success resets failures correctly: failures=0, successes=1, total=3');
  } else {
    console.log('❌ Stats incorrect after mixed operations');
    console.log('   Failures:', breaker.stats.failureCount, 'Successes:', breaker.stats.successCount, 'Total:', breaker.stats.totalRequests);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 8: Transition from HALF-OPEN to CLOSED (if _transitionToClosed exists)
console.log('\nTest 8: Transition from HALF-OPEN to CLOSED');
try {
  const breaker = new CircuitBreaker('test');
  
  // Force to HALF-OPEN state
  breaker.forceState('HALF-OPEN');
  
  if (typeof breaker._transitionToClosed === 'function') {
    breaker._recordSuccess();
    
    if (breaker.state === 'CLOSED') {
      console.log('✅ State transitioned from HALF-OPEN to CLOSED on success');
    } else {
      console.log('❌ Should transition to CLOSED from HALF-OPEN. State:', breaker.state);
    }
  } else {
    // _transitionToClosed not implemented yet
    try {
      breaker._recordSuccess();
      console.log('⚠️  _transitionToClosed method not implemented yet - will be tested later');
    } catch (error) {
      if (error.message.includes('_transitionToClosed is not a function')) {
        console.log('⚠️  _transitionToClosed method not implemented yet - expected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 9: Success from OPEN state (should not transition)
console.log('\nTest 9: Success from OPEN state (should not transition)');
try {
  const breaker = new CircuitBreaker('test');
  
  // Force to OPEN state
  breaker.forceState('OPEN');
  
  breaker._recordSuccess();
  
  if (breaker.state === 'OPEN') {
    console.log('✅ State remains OPEN after success (correct - needs cooldown first)');
  } else {
    console.log('❌ State should remain OPEN, got:', breaker.state);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

console.log('\n🏁 _recordSuccess testing complete!');
console.log('\n📝 Summary: Testing success recording and circuit healing');
console.log('- Should increment success count');
console.log('- Should increment total requests');
console.log('- Should reset failure count (circuit healing)');
console.log('- Should accumulate multiple successes');
console.log('- Should update stats timestamps');
console.log('- Should transition from HALF-OPEN to CLOSED');
console.log('- Should remain CLOSED when already CLOSED');
console.log('- Should remain OPEN (needs cooldown period first)');