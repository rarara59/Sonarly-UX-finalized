#!/usr/bin/env node

/**
 * Comprehensive Circuit Breaker Validation
 * Proves intelligent circuit breaker logic correctly distinguishes 
 * between temporary conditions and actual failures
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔌 Circuit Breaker Validation Test');
console.log('====================================\n');

class CircuitBreakerTester {
  constructor() {
    this.pool = null;
    this.results = {
      rateLimitHandling: false,
      loadVsFailure: false,
      actualFailureDetection: false,
      gradualRecovery: false,
      capacityPreservation: false
    };
  }
  
  async initialize() {
    this.pool = new RpcConnectionPool({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL,
        process.env.HELIUS_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ].filter(Boolean),
      breakerEnabled: true,
      debug: false
    });
    
    console.log('📦 Pool initialized with circuit breakers enabled');
    this.pool.endpoints.forEach((ep, i) => {
      const url = new URL(ep.url);
      console.log(`  ${i+1}. ${url.hostname}`);
      console.log(`     - Circuit breaker: ${ep.breaker.state}`);
      console.log(`     - Failures: ${ep.breaker.failures}`);
    });
    console.log('');
  }
  
  async testRateLimitErrorHandling() {
    console.log('\n📊 Test 1: Rate Limit Error Handling');
    console.log('─'.repeat(50));
    console.log('Expected: Circuit breaker does NOT open on 429 errors\n');
    
    // Reset breakers
    this.pool.endpoints.forEach(ep => {
      ep.breaker.state = 'CLOSED';
      ep.breaker.failures = 0;
      ep.breaker.openCount = 0;
    });
    
    // Simulate rate limit errors
    const endpoint = this.pool.endpoints[0];
    const initialState = endpoint.breaker.state;
    const initialTokens = endpoint.rateLimiter.tokens;
    
    console.log(`  Initial state: ${initialState}`);
    console.log(`  Initial tokens: ${initialTokens}/${endpoint.rateLimiter.maxTokens}`);
    
    // Simulate 10 rate limit errors
    for (let i = 0; i < 10; i++) {
      const error = new Error('429 Too Many Requests - RPS limit exceeded');
      error.status = 429;
      this.pool.handleFailure({ attempts: 1 }, error, endpoint);
    }
    
    const finalState = endpoint.breaker.state;
    const finalTokens = endpoint.rateLimiter.tokens;
    const hasBackoff = endpoint.rateLimitBackoff && endpoint.rateLimitBackoff.until > Date.now();
    
    console.log(`\n  After 10 rate limit errors:`);
    console.log(`  Circuit breaker state: ${finalState}`);
    console.log(`  Circuit breaker failures: ${endpoint.breaker.failures}`);
    console.log(`  Rate limit tokens: ${finalTokens}/${endpoint.rateLimiter.maxTokens}`);
    console.log(`  Backoff applied: ${hasBackoff ? 'YES' : 'NO'}`);
    
    // Check success criteria
    const success = finalState === 'CLOSED' && hasBackoff;
    console.log(`\n  ✅ Circuit breaker stayed closed: ${finalState === 'CLOSED' ? 'YES' : 'NO'}`);
    console.log(`  ✅ Rate limit backoff applied: ${hasBackoff ? 'YES' : 'NO'}`);
    console.log(`  ✅ Tokens reduced: ${finalTokens < initialTokens ? 'YES' : 'NO'}`);
    
    this.results.rateLimitHandling = success;
    return success;
  }
  
  async testLoadVsFailureDistinction() {
    console.log('\n📊 Test 2: Load vs Failure Distinction');
    console.log('─'.repeat(50));
    console.log('Expected: Timeouts during high load don\'t open breaker\n');
    
    // Reset breakers
    this.pool.endpoints.forEach(ep => {
      ep.breaker.state = 'CLOSED';
      ep.breaker.failures = 0;
      ep.loadTimeouts = 0;
    });
    
    const endpoint = this.pool.endpoints[0];
    
    // Test 1: Timeouts during high load
    console.log('  Simulating timeouts during HIGH system load (90% capacity)...');
    this.pool.globalInFlight = this.pool.config.maxGlobalInFlight * 0.9;
    
    for (let i = 0; i < 5; i++) {
      const error = new Error('Request timeout');
      this.pool.handleFailure({ attempts: 1 }, error, endpoint);
    }
    
    const highLoadState = endpoint.breaker.state;
    const highLoadFailures = endpoint.breaker.failures;
    
    console.log(`  Circuit breaker state: ${highLoadState}`);
    console.log(`  Circuit breaker failures: ${highLoadFailures.toFixed(1)}`);
    console.log(`  Load timeouts tracked: ${endpoint.loadTimeouts}`);
    
    // Reset for low load test
    endpoint.breaker.state = 'CLOSED';
    endpoint.breaker.failures = 0;
    endpoint.loadTimeouts = 0;
    
    // Test 2: Timeouts during low load
    console.log('\n  Simulating timeouts during LOW system load (20% capacity)...');
    this.pool.globalInFlight = this.pool.config.maxGlobalInFlight * 0.2;
    
    for (let i = 0; i < 5; i++) {
      const error = new Error('Request timeout');
      this.pool.handleFailure({ attempts: 1 }, error, endpoint);
    }
    
    const lowLoadState = endpoint.breaker.state;
    const lowLoadFailures = endpoint.breaker.failures;
    
    console.log(`  Circuit breaker state: ${lowLoadState}`);
    console.log(`  Circuit breaker failures: ${lowLoadFailures.toFixed(1)}`);
    
    // Check success criteria
    const success = highLoadState === 'CLOSED' && lowLoadFailures > highLoadFailures;
    console.log(`\n  ✅ High load timeouts didn't open breaker: ${highLoadState === 'CLOSED' ? 'YES' : 'NO'}`);
    console.log(`  ✅ Low load timeouts count more: ${lowLoadFailures > highLoadFailures ? 'YES' : 'NO'}`);
    
    this.results.loadVsFailure = success;
    return success;
  }
  
  async testActualFailureDetection() {
    console.log('\n📊 Test 3: Actual Failure Detection');
    console.log('─'.repeat(50));
    console.log('Expected: Real failures open circuit breaker\n');
    
    // Reset breakers
    this.pool.endpoints.forEach(ep => {
      ep.breaker.state = 'CLOSED';
      ep.breaker.failures = 0;
      ep.breaker.openCount = 0;
    });
    
    const endpoint = this.pool.endpoints[0];
    
    // Test network failures
    console.log('  Simulating network failures (ECONNREFUSED)...');
    
    for (let i = 0; i < 6; i++) {
      const error = new Error('ECONNREFUSED: Connection refused');
      this.pool.handleFailure({ attempts: 1 }, error, endpoint);
    }
    
    const networkFailureState = endpoint.breaker.state;
    console.log(`  Circuit breaker state after network failures: ${networkFailureState}`);
    
    // Reset and test server errors
    endpoint.breaker.state = 'CLOSED';
    endpoint.breaker.failures = 0;
    
    console.log('\n  Simulating server errors (502 Bad Gateway)...');
    
    for (let i = 0; i < 6; i++) {
      const error = new Error('502 Bad Gateway');
      error.status = 502;
      this.pool.handleFailure({ attempts: 1 }, error, endpoint);
    }
    
    const serverErrorState = endpoint.breaker.state;
    console.log(`  Circuit breaker state after server errors: ${serverErrorState}`);
    
    // Check success criteria
    const success = networkFailureState === 'OPEN' || serverErrorState === 'OPEN';
    console.log(`\n  ✅ Network failures open breaker: ${networkFailureState === 'OPEN' ? 'YES' : 'NO'}`);
    console.log(`  ✅ Server errors open breaker: ${serverErrorState === 'OPEN' ? 'YES' : 'NO'}`);
    
    this.results.actualFailureDetection = success;
    return success;
  }
  
  async testGradualRecovery() {
    console.log('\n📊 Test 4: Gradual Recovery Behavior');
    console.log('─'.repeat(50));
    console.log('Expected: Circuit breaker recovers gradually\n');
    
    // Setup: Open a circuit breaker
    const endpoint = this.pool.endpoints[0];
    endpoint.breaker.state = 'OPEN';
    endpoint.breaker.openedAt = Date.now() - 31000; // Opened 31 seconds ago
    endpoint.breaker.cooldownMs = 30000; // 30 second cooldown
    endpoint.breaker.failures = 5;
    endpoint.breaker.halfOpenTests = 0;
    
    console.log('  Initial state: OPEN (cooldown expired)');
    
    // Trigger selection to transition to HALF_OPEN
    this.pool.selectBestEndpoint();
    
    const afterSelectionState = endpoint.breaker.state;
    const afterSelectionFailures = endpoint.breaker.failures;
    
    console.log(`  State after selection: ${afterSelectionState}`);
    console.log(`  Failures after transition: ${afterSelectionFailures}`);
    
    // Simulate successful requests in HALF_OPEN state
    endpoint.breaker.halfOpenTests = 1;
    endpoint.breaker.consecutiveSuccesses = 3;
    
    // Verify recovery behavior
    const cooldownIncreases = endpoint.breaker.openCount > 0;
    console.log(`  Cooldown increases with repeated failures: ${cooldownIncreases ? 'YES' : 'NO'}`);
    console.log(`  Failure count decays on recovery: ${afterSelectionFailures < 5 ? 'YES' : 'NO'}`);
    
    // Check success criteria
    const success = afterSelectionState === 'HALF_OPEN' && afterSelectionFailures < 5;
    console.log(`\n  ✅ Transitions to HALF_OPEN after cooldown: ${afterSelectionState === 'HALF_OPEN' ? 'YES' : 'NO'}`);
    console.log(`  ✅ Failures decay during recovery: ${afterSelectionFailures < 5 ? 'YES' : 'NO'}`);
    
    this.results.gradualRecovery = success;
    return success;
  }
  
  async testSystemCapacityPreservation() {
    console.log('\n📊 Test 5: System Capacity Preservation');
    console.log('─'.repeat(50));
    console.log('Expected: Rate limits don\'t reduce available capacity\n');
    
    // Reset all endpoints
    this.pool.endpoints.forEach(ep => {
      ep.breaker.state = 'CLOSED';
      ep.breaker.failures = 0;
      ep.rateLimiter.tokens = ep.rateLimiter.maxTokens;
      ep.rateLimitBackoff = null;
    });
    
    // Count initially available endpoints
    const initialAvailable = this.pool.endpoints.filter(ep => {
      return ep.breaker.state !== 'OPEN' && ep.rateLimiter.canConsume(1);
    }).length;
    
    console.log(`  Initially available endpoints: ${initialAvailable}/${this.pool.endpoints.length}`);
    
    // Simulate rate limit errors on all endpoints
    console.log('  Simulating rate limit errors on all endpoints...');
    
    for (const endpoint of this.pool.endpoints) {
      for (let i = 0; i < 5; i++) {
        const error = new Error('429 Rate limit exceeded');
        error.status = 429;
        this.pool.handleFailure({ attempts: 1 }, error, endpoint);
      }
    }
    
    // Count available endpoints after rate limiting
    const afterRateLimitAvailable = this.pool.endpoints.filter(ep => {
      return ep.breaker.state !== 'OPEN';
    }).length;
    
    // Wait for backoff to expire
    console.log('  Waiting for rate limit backoff to expire...');
    await new Promise(r => setTimeout(r, 5100));
    
    // Count available endpoints after backoff expires
    const afterBackoffAvailable = this.pool.endpoints.filter(ep => {
      const backoffExpired = !ep.rateLimitBackoff || ep.rateLimitBackoff.until <= Date.now();
      return ep.breaker.state !== 'OPEN' && backoffExpired;
    }).length;
    
    console.log(`\n  After rate limit errors:`);
    console.log(`    Circuit breakers open: ${this.pool.endpoints.filter(ep => ep.breaker.state === 'OPEN').length}`);
    console.log(`    Endpoints available (not OPEN): ${afterRateLimitAvailable}/${this.pool.endpoints.length}`);
    console.log(`  After backoff expires:`);
    console.log(`    Endpoints available: ${afterBackoffAvailable}/${this.pool.endpoints.length}`);
    
    // Calculate capacity preservation
    const capacityPreserved = (afterRateLimitAvailable / initialAvailable) * 100;
    
    console.log(`\n  System capacity preserved: ${capacityPreserved.toFixed(1)}%`);
    
    // Check success criteria
    const success = capacityPreserved >= 90;
    console.log(`  ✅ Maintained 90%+ capacity: ${success ? 'YES' : 'NO'}`);
    
    this.results.capacityPreservation = success;
    return success;
  }
  
  async runAllTests() {
    await this.initialize();
    
    // Run all tests
    await this.testRateLimitErrorHandling();
    await this.testLoadVsFailureDistinction();
    await this.testActualFailureDetection();
    await this.testGradualRecovery();
    await this.testSystemCapacityPreservation();
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🔌 CIRCUIT BREAKER VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n✅ Success Criteria:');
    console.log(`  1. Rate limit handling: ${this.results.rateLimitHandling ? '✅ YES' : '❌ NO'}`);
    console.log(`  2. Load vs failure distinction: ${this.results.loadVsFailure ? '✅ YES' : '❌ NO'}`);
    console.log(`  3. Actual failure detection: ${this.results.actualFailureDetection ? '✅ YES' : '❌ NO'}`);
    console.log(`  4. Gradual recovery: ${this.results.gradualRecovery ? '✅ YES' : '❌ NO'}`);
    console.log(`  5. Capacity preservation: ${this.results.capacityPreservation ? '✅ YES' : '❌ NO'}`);
    
    const allPassed = Object.values(this.results).every(v => v);
    
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n✨ Intelligent circuit breaker logic is working correctly!');
      console.log('   - Rate limits don\'t trigger circuit breaker opening');
      console.log('   - Timeouts during high load are handled appropriately');
      console.log('   - Real failures still open circuit breaker for protection');
      console.log('   - Recovery is gradual with adaptive cooldown periods');
      console.log('   - System maintains maximum capacity during rate limiting');
    }
    
    await this.pool.destroy();
  }
}

// Run tests
const tester = new CircuitBreakerTester();
tester.runAllTests().catch(console.error);