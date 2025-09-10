/**
 * Test _calculateCooldownWithJitter method - Run with: node test-calculate-cooldown-with-jitter.js
 */

import { CircuitBreaker } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing _calculateCooldownWithJitter Method...\n');

// Test 1: Base cooldown with zero jitter
console.log('Test 1: Base cooldown (5000ms) with zero jitter');
try {
  const breaker = new CircuitBreaker('test', { 
    cooldownMs: 5000, 
    jitterMs: 0 
  });
  
  const result = breaker._calculateCooldownWithJitter();
  if (result === 5000) {
    console.log('✅ Zero jitter returns exact cooldown time:', result);
  } else {
    console.log('❌ Expected 5000ms with zero jitter, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 2: Cooldown with jitter - should be within range
console.log('\nTest 2: Cooldown (5000ms) with jitter (1000ms) - range check');
try {
  const breaker = new CircuitBreaker('test', { 
    cooldownMs: 5000, 
    jitterMs: 1000 
  });
  
  const results = [];
  // Run multiple times to test randomness
  for (let i = 0; i < 10; i++) {
    results.push(breaker._calculateCooldownWithJitter());
  }
  
  const allInRange = results.every(result => 
    result >= 5000 && result <= 6000
  );
  
  if (allInRange) {
    console.log('✅ All results within expected range (5000-6000ms)');
    console.log(`   Sample results: [${results.slice(0, 3).map(r => Math.round(r)).join(', ')}...]`);
  } else {
    console.log('❌ Some results outside range (5000-6000ms):', results);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 3: Different cooldown values
console.log('\nTest 3: Different cooldown (10000ms) with jitter (2000ms)');
try {
  const breaker = new CircuitBreaker('test', { 
    cooldownMs: 10000, 
    jitterMs: 2000 
  });
  
  const result = breaker._calculateCooldownWithJitter();
  if (result >= 10000 && result <= 12000) {
    console.log('✅ Result within expected range (10000-12000ms):', Math.round(result));
  } else {
    console.log('❌ Result outside range (10000-12000ms):', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 4: Small values - edge case
console.log('\nTest 4: Small cooldown (100ms) with jitter (50ms)');
try {
  const breaker = new CircuitBreaker('test', { 
    cooldownMs: 100, 
    jitterMs: 50 
  });
  
  const result = breaker._calculateCooldownWithJitter();
  if (result >= 100 && result <= 150) {
    console.log('✅ Small values work correctly:', Math.round(result));
  } else {
    console.log('❌ Small values outside range (100-150ms):', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 5: Randomness test - multiple calls should produce different results
console.log('\nTest 5: Randomness test - multiple calls should vary');
try {
  const breaker = new CircuitBreaker('test', { 
    cooldownMs: 5000, 
    jitterMs: 1000 
  });
  
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(Math.round(breaker._calculateCooldownWithJitter()));
  }
  
  // Check if we have at least some variation (not all identical)
  const uniqueValues = new Set(results);
  if (uniqueValues.size > 1) {
    console.log('✅ Multiple calls produce different results:', results);
  } else {
    // Could be coincidental with zero jitter or very small jitter
    console.log('⚠️  All results identical (could be valid with small jitter):', results);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 6: Always positive result
console.log('\nTest 6: Result is always positive');
try {
  const breaker = new CircuitBreaker('test', { 
    cooldownMs: 1000, 
    jitterMs: 500 
  });
  
  const results = [];
  for (let i = 0; i < 10; i++) {
    results.push(breaker._calculateCooldownWithJitter());
  }
  
  const allPositive = results.every(result => result > 0);
  if (allPositive) {
    console.log('✅ All results are positive values');
  } else {
    console.log('❌ Some results are not positive:', results);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 7: Default configuration values
console.log('\nTest 7: Default configuration (60000ms cooldown, 5000ms jitter)');
try {
  const breaker = new CircuitBreaker('test'); // Use defaults
  
  const result = breaker._calculateCooldownWithJitter();
  if (result >= 60000 && result <= 65000) {
    console.log('✅ Default config produces expected range:', Math.round(result));
  } else {
    console.log('❌ Default config outside range (60000-65000ms):', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

console.log('\n🏁 _calculateCooldownWithJitter testing complete!');
console.log('\n📝 Summary: Testing cooldown + jitter calculation');
console.log('- Should return base cooldown + random jitter');
console.log('- Should respect configured cooldown and jitter values');
console.log('- Should produce values within expected ranges');
console.log('- Should handle edge cases (zero jitter, small values)');
console.log('- Should always return positive values');
console.log('- Should produce randomness when jitter > 0');