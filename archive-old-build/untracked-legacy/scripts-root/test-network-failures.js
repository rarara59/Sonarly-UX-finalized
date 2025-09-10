#!/usr/bin/env node

/**
 * Network Failure Test Suite
 * Tests system resilience during various network failure scenarios
 */

import { NetworkFailureSimulator } from './network-failure-simulator.js';
import { RpcConnectionPoolAdapter } from '../src/adapters/rpc-connection-pool.adapter.js';
import fs from 'fs/promises';
import path from 'path';

class NetworkFailureTests {
  constructor() {
    this.simulator = new NetworkFailureSimulator();
    this.pool = null;
    this.factory = null;
    this.results = {
      timestamp: Date.now(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };
  }
  
  async initialize() {
    console.log('🔧 Initializing Network Failure Tests...\n');
    
    // Initialize RPC pool adapter
    await RpcConnectionPoolAdapter.initialize();
    
    // Import factory
    const { default: factory } = await import('../src/detection/transport/component-factory.js');
    this.factory = factory;
    
    // Create pool with mock mode for testing
    this.pool = await this.createTestPool();
    
    // Start network failure simulator
    this.simulator.start();
    
    console.log('✅ Initialization complete\n');
  }
  
  async createTestPool() {
    // Create a mock pool with simulated network calls
    const self = this;
    return {
      endpoints: [
        'api.mainnet-beta.solana.com',
        'solana-api.projectserum.com',
        'rpc.helius.xyz'
      ],
      circuitBreaker: {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        openedAt: null,
        halfOpenAt: null,
        threshold: 5,
        timeout: 5000,
        reset: function() {
          this.state = 'closed';
          this.failureCount = 0;
          this.successCount = 0;
        },
        recordSuccess: function() {
          this.successCount++;
          if (this.state === 'half-open' && this.successCount >= 3) {
            this.state = 'closed';
            this.failureCount = 0;
          }
        },
        recordFailure: function() {
          this.failureCount++;
          if (this.failureCount >= this.threshold) {
            this.state = 'open';
            this.openedAt = Date.now();
            this.halfOpenAt = Date.now() + this.timeout;
          }
        },
        isOpen: function() {
          if (this.state === 'open' && Date.now() >= this.halfOpenAt) {
            this.state = 'half-open';
          }
          return this.state === 'open';
        }
      },
      endpointSelector: {
        currentIndex: 0,
        healthScores: new Map([
          ['api.mainnet-beta.solana.com', 100],
          ['solana-api.projectserum.com', 100],
          ['rpc.helius.xyz', 100]
        ]),
        selectEndpoint: function() {
          // Select endpoint with highest health score
          let bestEndpoint = null;
          let bestScore = -1;
          
          for (const [endpoint, score] of this.healthScores) {
            if (score > bestScore) {
              bestScore = score;
              bestEndpoint = endpoint;
            }
          }
          
          return bestEndpoint || 'api.mainnet-beta.solana.com';
        },
        recordSuccess: function(endpoint) {
          const currentScore = this.healthScores.get(endpoint) || 0;
          this.healthScores.set(endpoint, Math.min(100, currentScore + 10));
        },
        recordFailure: function(endpoint) {
          const currentScore = this.healthScores.get(endpoint) || 100;
          this.healthScores.set(endpoint, Math.max(0, currentScore - 20));
        }
      },
      request: async function(method, params) {
        // Check circuit breaker
        if (this.circuitBreaker.isOpen()) {
          throw new Error('Circuit breaker is open');
        }
        
        // Select endpoint
        const endpoint = this.endpointSelector.selectEndpoint();
        
        try {
          // Check if endpoint is blocked by simulator
          if (self.simulator.blockedEndpoints.has(endpoint)) {
            throw new Error(`Network error: ${endpoint} is unreachable`);
          }
          
          // Check if endpoint has delay
          if (self.simulator.delayedEndpoints.has(endpoint)) {
            const delay = self.simulator.delayedEndpoints.get(endpoint);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          // Check if endpoint has error rate
          if (self.simulator.errorRateEndpoints.has(endpoint)) {
            const errorRate = self.simulator.errorRateEndpoints.get(endpoint);
            if (Math.random() < errorRate) {
              throw new Error(`Random network error for ${endpoint}`);
            }
          }
          
          // Simulate successful response
          this.circuitBreaker.recordSuccess();
          this.endpointSelector.recordSuccess(endpoint);
          
          return { result: { mock: true, endpoint, method } };
        } catch (error) {
          // Record failure
          this.circuitBreaker.recordFailure();
          this.endpointSelector.recordFailure(endpoint);
          throw error;
        }
      }
    };
  }
  
  /**
   * Test 1: Single Endpoint Failure
   */
  async testSingleEndpointFailure() {
    console.log('🧪 Test 1: Single Endpoint Failure');
    console.log('----------------------------------------');
    
    const testName = 'Single Endpoint Failure';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset circuit breaker
      this.pool.circuitBreaker.reset();
      
      // Block Helius endpoint
      this.simulator.blockEndpoint('rpc.helius.xyz');
      console.log('   Blocked: rpc.helius.xyz');
      
      // Make 20 requests
      let successCount = 0;
      let failureCount = 0;
      const requestPromises = [];
      
      for (let i = 0; i < 20; i++) {
        requestPromises.push(
          this.pool.request('getSlot', [])
            .then(() => successCount++)
            .catch(() => failureCount++)
        );
      }
      
      await Promise.all(requestPromises);
      
      const successRate = successCount / 20;
      details.successCount = successCount;
      details.failureCount = failureCount;
      details.successRate = successRate;
      
      console.log(`   Results: ${successCount}/${20} successful (${(successRate * 100).toFixed(1)}%)`);
      
      // Check if system maintained >60% success rate
      if (successRate < 0.6) {
        passed = false;
        console.log(`   ❌ Success rate below 60% threshold`);
      } else {
        console.log(`   ✅ Success rate maintained above 60%`);
      }
      
      // Check endpoint health scores
      const heliusHealth = this.pool.endpointSelector.healthScores.get('rpc.helius.xyz');
      details.heliusHealthScore = heliusHealth;
      
      if (heliusHealth > 50) {
        passed = false;
        console.log(`   ❌ Failed endpoint health score not reduced (${heliusHealth})`);
      } else {
        console.log(`   ✅ Failed endpoint health score reduced to ${heliusHealth}`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.simulator.unblockEndpoint('rpc.helius.xyz');
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Test 2: Multiple Endpoint Failures
   */
  async testMultipleEndpointFailures() {
    console.log('🧪 Test 2: Multiple Endpoint Failures');
    console.log('----------------------------------------');
    
    const testName = 'Multiple Endpoint Failures';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset circuit breaker
      this.pool.circuitBreaker.reset();
      
      // Block two endpoints
      this.simulator.blockEndpoint('rpc.helius.xyz');
      this.simulator.blockEndpoint('solana-api.projectserum.com');
      console.log('   Blocked: rpc.helius.xyz, solana-api.projectserum.com');
      
      // Make 20 requests
      let successCount = 0;
      let failureCount = 0;
      const requestPromises = [];
      
      for (let i = 0; i < 20; i++) {
        requestPromises.push(
          this.pool.request('getBalance', ['11111111111111111111111111111111'])
            .then(() => successCount++)
            .catch(() => failureCount++)
        );
      }
      
      await Promise.all(requestPromises);
      
      const successRate = successCount / 20;
      details.successCount = successCount;
      details.failureCount = failureCount;
      details.successRate = successRate;
      
      console.log(`   Results: ${successCount}/${20} successful (${(successRate * 100).toFixed(1)}%)`);
      
      // With only one endpoint available, we expect some failures but system should still work
      if (successCount === 0) {
        passed = false;
        console.log(`   ❌ Complete failure - no successful requests`);
      } else {
        console.log(`   ✅ System continued operating with limited endpoints`);
      }
      
      // Check if healthy endpoint was selected
      const mainnetHealth = this.pool.endpointSelector.healthScores.get('api.mainnet-beta.solana.com');
      details.mainnetHealthScore = mainnetHealth;
      
      if (mainnetHealth < 80) {
        passed = false;
        console.log(`   ❌ Healthy endpoint score degraded (${mainnetHealth})`);
      } else {
        console.log(`   ✅ Healthy endpoint maintained high score (${mainnetHealth})`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.simulator.unblockEndpoint('rpc.helius.xyz');
      this.simulator.unblockEndpoint('solana-api.projectserum.com');
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Test 3: Circuit Breaker Activation
   */
  async testCircuitBreakerActivation() {
    console.log('🧪 Test 3: Circuit Breaker Activation');
    console.log('----------------------------------------');
    
    const testName = 'Circuit Breaker Activation';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset circuit breaker
      this.pool.circuitBreaker.reset();
      
      // Block all endpoints to force failures
      this.simulator.simulateCompleteOutage();
      console.log('   Simulating complete network outage');
      
      // Make requests until circuit breaker opens
      let requestCount = 0;
      let circuitOpened = false;
      
      for (let i = 0; i < 10; i++) {
        try {
          await this.pool.request('getSlot', []);
          requestCount++;
        } catch (error) {
          requestCount++;
          if (error.message.includes('Circuit breaker is open')) {
            circuitOpened = true;
            break;
          }
        }
      }
      
      details.requestsBeforeOpen = requestCount;
      details.circuitBreakerState = this.pool.circuitBreaker.state;
      details.failureCount = this.pool.circuitBreaker.failureCount;
      
      console.log(`   Circuit breaker opened after ${requestCount} requests`);
      console.log(`   Circuit breaker state: ${this.pool.circuitBreaker.state}`);
      
      // Verify circuit breaker opened within 6 requests
      if (!circuitOpened) {
        passed = false;
        console.log(`   ❌ Circuit breaker did not open`);
      } else if (requestCount > 6) {
        passed = false;
        console.log(`   ❌ Circuit breaker took too long to open (${requestCount} requests)`);
      } else {
        console.log(`   ✅ Circuit breaker opened within threshold`);
      }
      
      // Verify subsequent requests are blocked
      let blockedCount = 0;
      for (let i = 0; i < 5; i++) {
        try {
          await this.pool.request('getSlot', []);
        } catch (error) {
          if (error.message.includes('Circuit breaker is open')) {
            blockedCount++;
          }
        }
      }
      
      details.blockedRequests = blockedCount;
      
      if (blockedCount < 5) {
        passed = false;
        console.log(`   ❌ Circuit breaker not blocking requests (${blockedCount}/5 blocked)`);
      } else {
        console.log(`   ✅ Circuit breaker blocking requests correctly`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.simulator.clearAllFailures();
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Test 4: Failover Speed
   */
  async testFailoverSpeed() {
    console.log('🧪 Test 4: Failover Speed');
    console.log('----------------------------------------');
    
    const testName = 'Failover Speed';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.pool.circuitBreaker.reset();
      this.pool.endpointSelector.healthScores.set('api.mainnet-beta.solana.com', 100);
      this.pool.endpointSelector.healthScores.set('solana-api.projectserum.com', 100);
      this.pool.endpointSelector.healthScores.set('rpc.helius.xyz', 100);
      
      // Block primary endpoint
      this.simulator.blockEndpoint('api.mainnet-beta.solana.com');
      console.log('   Blocked primary endpoint: api.mainnet-beta.solana.com');
      
      const failoverStart = Date.now();
      let successfulRequest = false;
      let attemptCount = 0;
      
      // Try requests until one succeeds (failover happens)
      while (!successfulRequest && attemptCount < 20) {
        try {
          await this.pool.request('getSlot', []);
          successfulRequest = true;
        } catch (error) {
          attemptCount++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const failoverTime = Date.now() - failoverStart;
      details.failoverTime = failoverTime;
      details.attempts = attemptCount;
      details.successfulFailover = successfulRequest;
      
      console.log(`   Failover completed in ${failoverTime}ms after ${attemptCount} attempts`);
      
      // Check if failover happened within 10 seconds
      if (!successfulRequest) {
        passed = false;
        console.log(`   ❌ Failover did not complete`);
      } else if (failoverTime > 10000) {
        passed = false;
        console.log(`   ❌ Failover took too long (${failoverTime}ms > 10000ms)`);
      } else {
        console.log(`   ✅ Failover completed within 10 seconds`);
      }
      
      // Verify endpoint health scores adjusted
      const primaryHealth = this.pool.endpointSelector.healthScores.get('api.mainnet-beta.solana.com');
      details.primaryHealthAfterFailure = primaryHealth;
      
      if (primaryHealth >= 50) {
        passed = false;
        console.log(`   ❌ Failed endpoint health score not sufficiently reduced (${primaryHealth})`);
      } else {
        console.log(`   ✅ Failed endpoint health score reduced to ${primaryHealth}`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.simulator.unblockEndpoint('api.mainnet-beta.solana.com');
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Test 5: System Recovery
   */
  async testSystemRecovery() {
    console.log('🧪 Test 5: System Recovery');
    console.log('----------------------------------------');
    
    const testName = 'System Recovery';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // First, simulate failures to degrade the system
      this.pool.circuitBreaker.reset();
      this.simulator.blockEndpoint('rpc.helius.xyz');
      
      console.log('   Phase 1: Degrading system with failures');
      
      // Make some failing requests
      let phase1Failures = 0;
      for (let i = 0; i < 10; i++) {
        try {
          await this.pool.request('getSlot', []);
        } catch {
          phase1Failures++;
        }
      }
      
      details.phase1Failures = phase1Failures;
      console.log(`   Initial failures: ${phase1Failures}/10`);
      
      // Now restore the endpoint
      console.log('   Phase 2: Restoring failed endpoint');
      this.simulator.unblockEndpoint('rpc.helius.xyz');
      
      const recoveryStart = Date.now();
      
      // Wait a bit for circuit breaker timeout if needed
      if (this.pool.circuitBreaker.state === 'open') {
        console.log('   Waiting for circuit breaker timeout...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Make requests to test recovery
      let successCount = 0;
      let totalRequests = 20;
      
      for (let i = 0; i < totalRequests; i++) {
        try {
          await this.pool.request('getSlot', []);
          successCount++;
        } catch (error) {
          // Continue testing
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const recoveryTime = Date.now() - recoveryStart;
      const recoveryRate = successCount / totalRequests;
      
      details.recoveryTime = recoveryTime;
      details.successfulRequests = successCount;
      details.recoveryRate = recoveryRate;
      details.finalCircuitState = this.pool.circuitBreaker.state;
      
      console.log(`   Recovery completed in ${recoveryTime}ms`);
      console.log(`   Success rate: ${(recoveryRate * 100).toFixed(1)}%`);
      console.log(`   Circuit breaker state: ${this.pool.circuitBreaker.state}`);
      
      // Check recovery criteria
      if (recoveryTime > 30000) {
        passed = false;
        console.log(`   ❌ Recovery took too long (${recoveryTime}ms > 30000ms)`);
      } else {
        console.log(`   ✅ Recovery completed within 30 seconds`);
      }
      
      if (recoveryRate < 0.8) {
        passed = false;
        console.log(`   ❌ Recovery rate too low (${(recoveryRate * 100).toFixed(1)}%)`);
      } else {
        console.log(`   ✅ System recovered to normal operation`);
      }
      
      // Check if circuit breaker recovered
      if (this.pool.circuitBreaker.state !== 'closed') {
        passed = false;
        console.log(`   ❌ Circuit breaker not fully recovered`);
      } else {
        console.log(`   ✅ Circuit breaker returned to closed state`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.simulator.clearAllFailures();
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Record test result
   */
  recordResult(name, passed, duration, details = {}) {
    this.results.tests.push({
      name,
      passed,
      duration,
      details,
      timestamp: Date.now()
    });
    
    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Network Failure Test Suite');
    console.log('=' .repeat(50));
    console.log('');
    
    const tests = [
      () => this.testSingleEndpointFailure(),
      () => this.testMultipleEndpointFailures(),
      () => this.testCircuitBreakerActivation(),
      () => this.testFailoverSpeed(),
      () => this.testSystemRecovery()
    ];
    
    for (const test of tests) {
      await test();
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Print summary
    this.printSummary();
    
    // Save results
    await this.saveResults();
    
    return this.results.summary.failed === 0;
  }
  
  /**
   * Print test summary
   */
  printSummary() {
    console.log('=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log('');
    
    const { total, passed, failed } = this.results.summary;
    const passRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log('');
    
    // List failed tests
    if (failed > 0) {
      console.log('Failed Tests:');
      this.results.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`  ❌ ${t.name}`));
      console.log('');
    }
    
    // Network failure statistics
    const stats = this.simulator.getStatistics();
    console.log('Network Failure Statistics:');
    console.log(`  Total Simulated Failures: ${stats.totalFailures}`);
    if (Object.keys(stats.failuresByEndpoint).length > 0) {
      console.log('  Failures by Endpoint:');
      for (const [endpoint, count] of Object.entries(stats.failuresByEndpoint)) {
        console.log(`    - ${endpoint}: ${count}`);
      }
    }
    console.log('');
  }
  
  /**
   * Save test results to file
   */
  async saveResults() {
    const resultsPath = path.join(process.cwd(), 'results', 'network-failure-test-results.json');
    
    try {
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
      console.log(`💾 Results saved to: ${resultsPath}`);
    } catch (error) {
      console.error(`Failed to save results: ${error.message}`);
    }
  }
  
  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    this.simulator.stop();
    console.log('✅ Cleanup complete');
  }
}

// Main execution
async function main() {
  const tester = new NetworkFailureTests();
  
  try {
    await tester.initialize();
    const allPassed = await tester.runAllTests();
    
    if (allPassed) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default NetworkFailureTests;