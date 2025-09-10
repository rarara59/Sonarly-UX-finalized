/**
 * Manual Circuit Breaker Test - Run with: node test-circuit-breaker.js
 * Testing _validateConfig method specifically
 */

import { CircuitBreaker, CircuitBreakerError } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing Circuit Breaker _validateConfig Method...\n');

// Test 1: Valid default configuration
console.log('Test 1: Valid Default Configuration');
try {
  const breaker = new CircuitBreaker('test-endpoint');
  console.log('✅ Default config accepted:', {
    failureThreshold: breaker.config.failureThreshold,
    successThreshold: breaker.config.successThreshold,
    cooldownMs: breaker.config.cooldownMs,
    timeoutMs: breaker.config.timeoutMs,
    jitterMs: breaker.config.jitterMs
  });
} catch (error) {
  console.log('❌ Default config failed:', error.message);
}

// Test 2: Valid custom configuration
console.log('\nTest 2: Valid Custom Configuration');
try {
  const breaker = new CircuitBreaker('custom-endpoint', {
    failureThreshold: 3,
    successThreshold: 2,
    cooldownMs: 30000,
    timeoutMs: 1000,
    jitterMs: 1000
  });
  console.log('✅ Custom config accepted:', {
    failureThreshold: breaker.config.failureThreshold,
    successThreshold: breaker.config.successThreshold,
    cooldownMs: breaker.config.cooldownMs,
    timeoutMs: breaker.config.timeoutMs,
    jitterMs: breaker.config.jitterMs
  });
} catch (error) {
  console.log('❌ Custom config failed:', error.message);
}

// Test 3: Invalid failureThreshold (negative)
console.log('\nTest 3: Invalid failureThreshold (negative)');
try {
  new CircuitBreaker('invalid1', { failureThreshold: -1 });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected negative failureThreshold:', error.message);
}

// Test 4: Invalid failureThreshold (zero)
console.log('\nTest 4: Invalid failureThreshold (zero)');
try {
  new CircuitBreaker('invalid2', { failureThreshold: 0 });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected zero failureThreshold:', error.message);
}

// Test 5: Invalid failureThreshold (float)
console.log('\nTest 5: Invalid failureThreshold (float)');
try {
  new CircuitBreaker('invalid3', { failureThreshold: 3.5 });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected float failureThreshold:', error.message);
}

// Test 6: Invalid successThreshold (negative)
console.log('\nTest 6: Invalid successThreshold (negative)');
try {
  new CircuitBreaker('invalid4', { successThreshold: -1 });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected negative successThreshold:', error.message);
}

// Test 7: Invalid cooldownMs (negative)
console.log('\nTest 7: Invalid cooldownMs (negative)');
try {
  new CircuitBreaker('invalid5', { cooldownMs: -1000 });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected negative cooldownMs:', error.message);
}

// Test 8: Invalid cooldownMs (zero)
console.log('\nTest 8: Invalid cooldownMs (zero)');
try {
  new CircuitBreaker('invalid6', { cooldownMs: 0 });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected zero cooldownMs:', error.message);
}

// Test 9: Invalid timeoutMs (negative)
console.log('\nTest 9: Invalid timeoutMs (negative)');
try {
  new CircuitBreaker('invalid7', { timeoutMs: -500 });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected negative timeoutMs:', error.message);
}

// Test 10: Invalid jitterMs (negative)
console.log('\nTest 10: Invalid jitterMs (negative)');
try {
  new CircuitBreaker('invalid8', { jitterMs: -1000 });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected negative jitterMs:', error.message);
}

// Test 11: Invalid jitter >= cooldown
console.log('\nTest 11: Invalid jitterMs >= cooldownMs');
try {
  new CircuitBreaker('invalid9', { 
    cooldownMs: 1000, 
    jitterMs: 1000 
  });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected jitterMs >= cooldownMs:', error.message);
}

// Test 12: Invalid jitter > cooldown
console.log('\nTest 12: Invalid jitterMs > cooldownMs');
try {
  new CircuitBreaker('invalid10', { 
    cooldownMs: 1000, 
    jitterMs: 1500 
  });
  console.log('❌ Should have thrown error but didnt');
} catch (error) {
  console.log('✅ Correctly rejected jitterMs > cooldownMs:', error.message);
}

// Test 13: Valid edge case - zero jitter
console.log('\nTest 13: Valid Edge Case - Zero jitterMs');
try {
  const breaker = new CircuitBreaker('edge-case', { jitterMs: 0 });
  console.log('✅ Zero jitterMs accepted:', breaker.config.jitterMs);
} catch (error) {
  console.log('❌ Zero jitterMs should be valid:', error.message);
}

// Test 14: Non-number types
console.log('\nTest 14: Non-number types should be rejected');
try {
  new CircuitBreaker('invalid11', { failureThreshold: 'invalid' });
  console.log('❌ Should have rejected string failureThreshold');
} catch (error) {
  console.log('✅ Correctly rejected string failureThreshold:', error.message);
}

console.log('\n🏁 _validateConfig testing complete!');
console.log('\n📝 Summary: Testing configuration validation');
console.log('- Should accept valid default values');
console.log('- Should accept valid custom values'); 
console.log('- Should reject negative thresholds');
console.log('- Should reject zero where inappropriate');
console.log('- Should reject float thresholds');
console.log('- Should reject negative timeouts');
console.log('- Should reject jitter >= cooldown');
console.log('- Should accept zero jitter (edge case)');
console.log('- Should reject non-number types');