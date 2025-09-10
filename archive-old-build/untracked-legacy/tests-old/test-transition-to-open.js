/**
 * Test _transitionToOpen method - Run with: node test-transition-to-open.js
 */

import { CircuitBreaker } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing _transitionToOpen Method...\n');

// Test 1: State transition from CLOSED to OPEN
console.log('Test 1: State transition from CLOSED to OPEN');
try {
  const breaker = new CircuitBreaker('test');
  
  // Initial state should be CLOSED
  const initialState = breaker.state;
  
  // Transition to OPEN
  breaker._transitionToOpen();
  
  if (initialState === 'CLOSED' && breaker.state === 'OPEN') {
    console.log('✅ State correctly changed from CLOSED to OPEN');
  } else {
    console.log('❌ State transition failed. Initial:', initialState, 'Final:', breaker.state);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 2: openedAt timestamp is set
console.log('\nTest 2: openedAt timestamp is recorded');
try {
  const breaker = new CircuitBreaker('test');
  const beforeTime = Date.now();
  
  breaker._transitionToOpen();
  
  const afterTime = Date.now();
  
  if (breaker.openedAt >= beforeTime && breaker.openedAt <= afterTime) {
    console.log('✅ openedAt timestamp recorded correctly:', new Date(breaker.openedAt).toISOString());
  } else {
    console.log('❌ openedAt timestamp incorrect:', breaker.openedAt);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 3: halfOpenAt is calculated with jitter
console.log('\nTest 3: halfOpenAt is calculated correctly');
try {
  const breaker = new CircuitBreaker('test', {
    cooldownMs: 5000,
    jitterMs: 1000
  });
  
  breaker._transitionToOpen();
  
  const expectedMin = breaker.openedAt + 5000;
  const expectedMax = breaker.openedAt + 6000;
  
  if (breaker.halfOpenAt >= expectedMin && breaker.halfOpenAt <= expectedMax) {
    console.log('✅ halfOpenAt calculated within expected range');
    console.log(`   openedAt: ${breaker.openedAt}, halfOpenAt: ${breaker.halfOpenAt}`);
    console.log(`   cooldown period: ${breaker.halfOpenAt - breaker.openedAt}ms`);
  } else {
    console.log('❌ halfOpenAt outside expected range:', breaker.halfOpenAt);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 4: lastStateChange is updated
console.log('\nTest 4: Stats lastStateChange is updated');
try {
  const breaker = new CircuitBreaker('test');
  const originalStateChange = breaker.stats.lastStateChange;
  
  // Small delay to ensure timestamp difference
  await new Promise(resolve => setTimeout(resolve, 1));
  
  breaker._transitionToOpen();
  
  if (breaker.stats.lastStateChange > originalStateChange) {
    console.log('✅ lastStateChange timestamp updated');
  } else {
    console.log('❌ lastStateChange timestamp not updated');
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 5: Transition from HALF-OPEN to OPEN
console.log('\nTest 5: State transition from HALF-OPEN to OPEN');
try {
  const breaker = new CircuitBreaker('test');
  
  // Force to HALF-OPEN first
  breaker.forceState('HALF-OPEN');
  const initialState = breaker.state;
  
  // Transition to OPEN
  breaker._transitionToOpen();
  
  if (initialState === 'HALF-OPEN' && breaker.state === 'OPEN') {
    console.log('✅ State correctly changed from HALF-OPEN to OPEN');
  } else {
    console.log('❌ State transition failed. Initial:', initialState, 'Final:', breaker.state);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 6: Multiple calls update timestamps
console.log('\nTest 6: Multiple calls update timestamps correctly');
try {
  const breaker = new CircuitBreaker('test');
  
  breaker._transitionToOpen();
  const firstOpenedAt = breaker.openedAt;
  const firstHalfOpenAt = breaker.halfOpenAt;
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 5));
  
  breaker._transitionToOpen();
  const secondOpenedAt = breaker.openedAt;
  const secondHalfOpenAt = breaker.halfOpenAt;
  
  if (secondOpenedAt > firstOpenedAt && secondHalfOpenAt > firstHalfOpenAt) {
    console.log('✅ Multiple calls update timestamps correctly');
  } else {
    console.log('❌ Timestamps not updated on subsequent calls');
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 7: Different cooldown configurations
console.log('\nTest 7: Different cooldown configurations work correctly');
try {
  const breaker1 = new CircuitBreaker('test1', { cooldownMs: 1000, jitterMs: 0 });
  const breaker2 = new CircuitBreaker('test2', { cooldownMs: 10000, jitterMs: 2000 });
  
  breaker1._transitionToOpen();
  breaker2._transitionToOpen();
  
  const cooldown1 = breaker1.halfOpenAt - breaker1.openedAt;
  const cooldown2 = breaker2.halfOpenAt - breaker2.openedAt;
  
  if (cooldown1 === 1000 && cooldown2 >= 10000 && cooldown2 <= 12000) {
    console.log('✅ Different configurations produce correct cooldown periods');
    console.log(`   Config 1 cooldown: ${cooldown1}ms (expected: 1000ms)`);
    console.log(`   Config 2 cooldown: ${cooldown2}ms (expected: 10000-12000ms)`);
  } else {
    console.log('❌ Cooldown periods incorrect');
    console.log(`   Config 1: ${cooldown1}ms, Config 2: ${cooldown2}ms`);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

console.log('\n🏁 _transitionToOpen testing complete!');
console.log('\n📝 Summary: Testing state transition to OPEN');
console.log('- Should set state to "OPEN"');
console.log('- Should record openedAt timestamp');
console.log('- Should calculate halfOpenAt with jitter');
console.log('- Should update lastStateChange in stats');
console.log('- Should work from any initial state');
console.log('- Should handle multiple calls correctly');
console.log('- Should respect different cooldown configurations');