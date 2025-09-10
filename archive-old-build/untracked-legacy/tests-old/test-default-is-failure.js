/**
 * Test _defaultIsFailure method - Run with: node test-default-is-failure.js
 */

import { CircuitBreaker } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing _defaultIsFailure Method...\n');

// Test 1: Network timeout should trip circuit
console.log('Test 1: Network timeout (ETIMEDOUT) should trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const timeoutError = new Error('Connection timeout');
  timeoutError.code = 'ETIMEDOUT';
  
  const result = breaker.isFailureFn(timeoutError);
  if (result === true) {
    console.log('✅ ETIMEDOUT correctly classified as failure');
  } else {
    console.log('❌ ETIMEDOUT should be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 2: Connection refused should trip circuit
console.log('\nTest 2: Connection refused (ECONNREFUSED) should trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const connError = new Error('Connection refused');
  connError.code = 'ECONNREFUSED';
  
  const result = breaker.isFailureFn(connError);
  if (result === true) {
    console.log('✅ ECONNREFUSED correctly classified as failure');
  } else {
    console.log('❌ ECONNREFUSED should be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 3: DNS resolution failure should trip circuit
console.log('\nTest 3: DNS failure (ENOTFOUND) should trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const dnsError = new Error('getaddrinfo ENOTFOUND');
  dnsError.code = 'ENOTFOUND';
  
  const result = breaker.isFailureFn(dnsError);
  if (result === true) {
    console.log('✅ ENOTFOUND correctly classified as failure');
  } else {
    console.log('❌ ENOTFOUND should be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 4: 5xx HTTP errors should trip circuit
console.log('\nTest 4: HTTP 500 error should trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const serverError = new Error('Internal Server Error');
  serverError.status = 500;
  
  const result = breaker.isFailureFn(serverError);
  if (result === true) {
    console.log('✅ HTTP 500 correctly classified as failure');
  } else {
    console.log('❌ HTTP 500 should be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 5: HTTP 503 error should trip circuit
console.log('\nTest 5: HTTP 503 error should trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const unavailableError = new Error('Service Unavailable');
  unavailableError.status = 503;
  
  const result = breaker.isFailureFn(unavailableError);
  if (result === true) {
    console.log('✅ HTTP 503 correctly classified as failure');
  } else {
    console.log('❌ HTTP 503 should be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 6: HTTP 429 (rate limit) should trip circuit
console.log('\nTest 6: HTTP 429 (rate limit) should trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const rateLimitError = new Error('Too Many Requests');
  rateLimitError.status = 429;
  
  const result = breaker.isFailureFn(rateLimitError);
  if (result === true) {
    console.log('✅ HTTP 429 correctly classified as failure');
  } else {
    console.log('❌ HTTP 429 should be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 7: HTTP 400 error should NOT trip circuit
console.log('\nTest 7: HTTP 400 error should NOT trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const clientError = new Error('Bad Request');
  clientError.status = 400;
  
  const result = breaker.isFailureFn(clientError);
  if (result === false) {
    console.log('✅ HTTP 400 correctly classified as non-failure');
  } else {
    console.log('❌ HTTP 400 should NOT be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 8: HTTP 404 error should NOT trip circuit
console.log('\nTest 8: HTTP 404 error should NOT trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const notFoundError = new Error('Not Found');
  notFoundError.status = 404;
  
  const result = breaker.isFailureFn(notFoundError);
  if (result === false) {
    console.log('✅ HTTP 404 correctly classified as non-failure');
  } else {
    console.log('❌ HTTP 404 should NOT be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 9: ValidationError should NOT trip circuit
console.log('\nTest 9: ValidationError should NOT trip circuit');
try {
  const breaker = new CircuitBreaker('test');
  const validationError = new Error('Invalid input data');
  validationError.name = 'ValidationError';
  
  const result = breaker.isFailureFn(validationError);
  if (result === false) {
    console.log('✅ ValidationError correctly classified as non-failure');
  } else {
    console.log('❌ ValidationError should NOT be classified as failure, got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 10: Unknown error should trip circuit (fail-safe)
console.log('\nTest 10: Unknown error should trip circuit (fail-safe)');
try {
  const breaker = new CircuitBreaker('test');
  const unknownError = new Error('Something went wrong');
  // No code, status, or name properties
  
  const result = breaker.isFailureFn(unknownError);
  if (result === true) {
    console.log('✅ Unknown error correctly classified as failure (fail-safe)');
  } else {
    console.log('❌ Unknown error should be classified as failure (fail-safe), got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

// Test 11: Null/undefined error should be handled safely
console.log('\nTest 11: Null error should be handled safely');
try {
  const breaker = new CircuitBreaker('test');
  
  const result = breaker.isFailureFn(null);
  if (result === true) {
    console.log('✅ Null error correctly classified as failure (fail-safe)');
  } else {
    console.log('❌ Null error should be classified as failure (fail-safe), got:', result);
  }
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

console.log('\n🏁 _defaultIsFailure testing complete!');
console.log('\n📝 Expected Implementation Requirements:');
console.log('- ETIMEDOUT, ECONNREFUSED, ENOTFOUND should return true');
console.log('- HTTP 5xx and 429 should return true'); 
console.log('- HTTP 4xx should return false');
console.log('- ValidationError should return false');
console.log('- Unknown/null errors should return true (fail-safe)');
console.log('- Must handle missing properties safely (error?.code, error?.status)');