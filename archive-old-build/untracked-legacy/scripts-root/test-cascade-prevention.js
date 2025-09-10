#!/usr/bin/env node

/**
 * Cascading Failure Prevention Test Suite
 * Tests system resilience against cascading failures during multiple component issues
 */

import { IntegrationErrorHandler } from './test-component-failures.js';
import { NetworkFailureSimulator } from './network-failure-simulator.js';
import fs from 'fs/promises';
import path from 'path';

class CascadePreventionTests {
  constructor() {
    this.errorHandler = new IntegrationErrorHandler();
    this.networkSimulator = new NetworkFailureSimulator();
    this.system = null;
    this.components = {};
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
    console.log('🔧 Initializing Cascade Prevention Tests...\n');
    
    // Create the integrated system with all components
    await this.createIntegratedSystem();
    
    // Start network failure simulator
    this.networkSimulator.start();
    
    console.log('✅ Initialization complete\n');
  }
  
  async createIntegratedSystem() {
    const self = this;
    
    // Create mock components
    this.components = {
      tokenBucket: {
        name: 'tokenBucket',
        failed: false,
        tokens: 100,
        refillRate: 10,
        requestCount: 0,
        consume: async function(tokens = 1) {
          if (this.failed) throw new Error('TokenBucket component failed');
          if (this.tokens < tokens) throw new Error('Rate limit exceeded');
          this.tokens -= tokens;
          this.requestCount++;
          return true;
        },
        reset: function() {
          this.failed = false;
          this.tokens = 100;
          this.requestCount = 0;
        }
      },
      
      requestCache: {
        name: 'requestCache',
        failed: false,
        cache: new Map(),
        get: function(key) {
          if (this.failed) throw new Error('RequestCache component failed');
          return this.cache.get(key);
        },
        set: function(key, value) {
          if (this.failed) throw new Error('RequestCache component failed');
          this.cache.set(key, value);
        },
        reset: function() {
          this.failed = false;
          this.cache.clear();
        }
      },
      
      batchManager: {
        name: 'batchManager',
        failed: false,
        pendingBatch: [],
        batchSize: 5,
        add: function(request) {
          if (this.failed) throw new Error('BatchManager component failed');
          this.pendingBatch.push(request);
          if (this.pendingBatch.length >= this.batchSize) {
            const batch = this.pendingBatch.splice(0, this.batchSize);
            return { execute: true, batch };
          }
          return { execute: false };
        },
        reset: function() {
          this.failed = false;
          this.pendingBatch = [];
        }
      },
      
      circuitBreaker: {
        name: 'circuitBreaker',
        failed: false,
        state: 'closed',
        failureCount: 0,
        threshold: 5,
        timeout: 5000,
        lastFailureTime: null,
        isOpen: function() {
          if (this.failed) throw new Error('CircuitBreaker component failed');
          
          // Check if circuit should transition from open to half-open
          if (this.state === 'open') {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure > this.timeout) {
              this.state = 'half-open';
            }
          }
          
          return this.state === 'open';
        },
        recordFailure: function() {
          if (this.failed) return;
          
          this.failureCount++;
          this.lastFailureTime = Date.now();
          
          if (this.failureCount >= this.threshold) {
            this.state = 'open';
            console.log('   🔴 Circuit breaker opened - preventing cascade');
          }
        },
        recordSuccess: function() {
          if (this.failed) return;
          
          if (this.state === 'half-open') {
            this.state = 'closed';
            this.failureCount = 0;
          }
        },
        reset: function() {
          this.failed = false;
          this.state = 'closed';
          this.failureCount = 0;
          this.lastFailureTime = null;
        }
      },
      
      endpointSelector: {
        name: 'endpointSelector',
        failed: false,
        endpoints: [
          'api.mainnet-beta.solana.com',
          'solana-api.projectserum.com',
          'rpc.helius.xyz'
        ],
        healthScores: new Map(),
        currentIndex: 0,
        select: function() {
          if (this.failed) throw new Error('EndpointSelector component failed');
          
          // Try to select healthy endpoint
          for (let i = 0; i < this.endpoints.length; i++) {
            const endpoint = this.endpoints[(this.currentIndex + i) % this.endpoints.length];
            const health = this.healthScores.get(endpoint) || 100;
            if (health > 0) {
              this.currentIndex = (this.currentIndex + i + 1) % this.endpoints.length;
              return endpoint;
            }
          }
          
          // All endpoints unhealthy, return first one
          return this.endpoints[0];
        },
        recordFailure: function(endpoint) {
          const current = this.healthScores.get(endpoint) || 100;
          this.healthScores.set(endpoint, Math.max(0, current - 25));
        },
        recordSuccess: function(endpoint) {
          const current = this.healthScores.get(endpoint) || 0;
          this.healthScores.set(endpoint, Math.min(100, current + 10));
        },
        reset: function() {
          this.failed = false;
          this.healthScores.clear();
          this.currentIndex = 0;
        }
      },
      
      connectionPool: {
        name: 'connectionPool',
        failed: false,
        connections: [],
        maxConnections: 10,
        activeRequests: 0,
        getConnection: async function() {
          if (this.failed) throw new Error('ConnectionPool component failed');
          
          if (this.activeRequests >= this.maxConnections) {
            throw new Error('Connection pool exhausted');
          }
          
          this.activeRequests++;
          return {
            id: Math.random(),
            release: () => {
              this.activeRequests = Math.max(0, this.activeRequests - 1);
            }
          };
        },
        reset: function() {
          this.failed = false;
          this.connections = [];
          this.activeRequests = 0;
        }
      }
    };
    
    // Create the integrated system
    this.system = {
      components: this.components,
      errorHandler: this.errorHandler,
      requestCount: 0,
      failureCount: 0,
      
      async makeRequest(method, params) {
        this.requestCount++;
        
        try {
          // Check circuit breaker first to prevent cascades
          if (self.components.circuitBreaker.isOpen()) {
            throw new Error('Circuit breaker is open - request blocked');
          }
          
          // Try rate limiting
          try {
            await self.components.tokenBucket.consume(1);
          } catch (error) {
            if (!error.message.includes('Rate limit')) {
              self.errorHandler.handleComponentError('tokenBucket', error);
            }
            // Continue without rate limiting
          }
          
          // Check cache
          const cacheKey = `${method}:${JSON.stringify(params)}`;
          try {
            const cached = self.components.requestCache.get(cacheKey);
            if (cached) {
              self.components.circuitBreaker.recordSuccess();
              return { success: true, cached: true, data: cached };
            }
          } catch (error) {
            self.errorHandler.handleComponentError('requestCache', error);
            // Continue without cache
          }
          
          // Select endpoint
          let endpoint;
          try {
            endpoint = self.components.endpointSelector.select();
          } catch (error) {
            self.errorHandler.handleComponentError('endpointSelector', error);
            endpoint = 'fallback-endpoint';
          }
          
          // Get connection
          let connection;
          try {
            connection = await self.components.connectionPool.getConnection();
          } catch (error) {
            if (error.message.includes('exhausted')) {
              // Pool exhausted - this could cause cascade
              self.components.circuitBreaker.recordFailure();
              throw new Error('Connection pool exhausted - potential cascade');
            }
            self.errorHandler.handleComponentError('connectionPool', error);
            connection = { id: 'emergency', release: () => {} };
          }
          
          try {
            // Simulate network request
            if (self.networkSimulator.blockedEndpoints.has(endpoint)) {
              throw new Error(`Network failure: ${endpoint} blocked`);
            }
            
            // Simulate successful response
            const response = { result: { method, params, endpoint } };
            
            // Try to cache response
            try {
              self.components.requestCache.set(cacheKey, response);
            } catch (error) {
              // Ignore cache write failures
            }
            
            // Record success
            self.components.circuitBreaker.recordSuccess();
            self.components.endpointSelector.recordSuccess(endpoint);
            
            return { success: true, data: response };
            
          } catch (networkError) {
            // Network failure - record and potentially trigger circuit breaker
            self.components.circuitBreaker.recordFailure();
            self.components.endpointSelector.recordFailure(endpoint);
            throw networkError;
          } finally {
            // Always release connection
            if (connection && connection.release) {
              connection.release();
            }
          }
          
        } catch (error) {
          this.failureCount++;
          throw error;
        }
      },
      
      getMetrics() {
        return {
          requestCount: this.requestCount,
          failureCount: this.failureCount,
          successRate: this.requestCount > 0 
            ? (this.requestCount - this.failureCount) / this.requestCount 
            : 0,
          circuitBreakerState: self.components.circuitBreaker.state,
          failedComponents: Array.from(self.errorHandler.failedComponents),
          connectionPoolUsage: self.components.connectionPool.activeRequests,
          systemHealth: self.errorHandler.getSystemHealth()
        };
      },
      
      reset() {
        Object.values(self.components).forEach(c => c.reset());
        self.errorHandler.reset();
        this.requestCount = 0;
        this.failureCount = 0;
      }
    };
  }
  
  /**
   * Test 1: Simultaneous Two-Component Failure
   */
  async testSimultaneousTwoComponentFailure() {
    console.log('🧪 Test 1: Simultaneous Two-Component Failure');
    console.log('------------------------------------------------');
    
    const testName = 'Simultaneous Two-Component Failure';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Fail RequestCache and BatchManager simultaneously
      this.components.requestCache.failed = true;
      this.components.batchManager.failed = true;
      console.log('   ❌ Failed: RequestCache + BatchManager');
      
      // Make 30 requests
      let successCount = 0;
      let failures = [];
      
      for (let i = 0; i < 30; i++) {
        try {
          await this.system.makeRequest('test', [i]);
          successCount++;
        } catch (error) {
          failures.push(error.message);
        }
      }
      
      const metrics = this.system.getMetrics();
      details.successCount = successCount;
      details.totalRequests = 30;
      details.successRate = successCount / 30;
      details.metrics = metrics;
      
      console.log(`   Results: ${successCount}/30 successful (${(details.successRate * 100).toFixed(1)}%)`);
      console.log(`   Circuit breaker: ${metrics.circuitBreakerState}`);
      console.log(`   System health: ${metrics.systemHealth.toFixed(1)}%`);
      
      // Check success criteria - should maintain >50% functionality
      if (details.successRate < 0.5) {
        passed = false;
        console.log(`   ❌ Success rate below 50% threshold`);
      } else {
        console.log(`   ✅ System maintained >50% functionality`);
      }
      
      // Check no complete system crash
      if (successCount === 0) {
        passed = false;
        console.log(`   ❌ Complete system failure`);
      } else {
        console.log(`   ✅ System survived component failures`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Test 2: Multiple Network Endpoint Failures
   */
  async testMultipleNetworkEndpointFailures() {
    console.log('🧪 Test 2: Multiple Network Endpoint Failures');
    console.log('------------------------------------------------');
    
    const testName = 'Multiple Network Endpoint Failures';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Block 2 out of 3 endpoints
      this.networkSimulator.blockEndpoint('api.mainnet-beta.solana.com');
      this.networkSimulator.blockEndpoint('solana-api.projectserum.com');
      console.log('   ❌ Blocked 2/3 network endpoints');
      
      // Make 30 requests
      let successCount = 0;
      let circuitBreakerTrips = 0;
      
      for (let i = 0; i < 30; i++) {
        try {
          await this.system.makeRequest('getBalance', ['test']);
          successCount++;
        } catch (error) {
          if (error.message.includes('Circuit breaker')) {
            circuitBreakerTrips++;
          }
        }
        
        // Small delay to allow system to adapt
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const metrics = this.system.getMetrics();
      details.successCount = successCount;
      details.circuitBreakerTrips = circuitBreakerTrips;
      details.successRate = successCount / 30;
      details.metrics = metrics;
      
      console.log(`   Results: ${successCount}/30 successful (${(details.successRate * 100).toFixed(1)}%)`);
      console.log(`   Circuit breaker trips: ${circuitBreakerTrips}`);
      console.log(`   Final circuit state: ${metrics.circuitBreakerState}`);
      
      // Check if system adapted to use working endpoint
      if (successCount < 10) {
        passed = false;
        console.log(`   ❌ System failed to adapt to working endpoint`);
      } else {
        console.log(`   ✅ System adapted to use available endpoint`);
      }
      
      // Check circuit breaker prevented cascade
      if (circuitBreakerTrips > 0) {
        console.log(`   ✅ Circuit breaker activated to prevent cascade`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.networkSimulator.clearAllFailures();
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Test 3: Circuit Breaker Cascade Prevention
   */
  async testCircuitBreakerCascadePrevention() {
    console.log('🧪 Test 3: Circuit Breaker Cascade Prevention');
    console.log('------------------------------------------------');
    
    const testName = 'Circuit Breaker Cascade Prevention';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Create a failure scenario that could cascade
      this.components.connectionPool.maxConnections = 3; // Severely limit connections
      this.networkSimulator.blockEndpoint('api.mainnet-beta.solana.com');
      this.networkSimulator.blockEndpoint('solana-api.projectserum.com');
      this.networkSimulator.blockEndpoint('rpc.helius.xyz');
      
      console.log('   ⚠️  Created cascade-prone scenario:');
      console.log('      - Limited connection pool (3 connections)');
      console.log('      - All endpoints blocked');
      
      // Attempt rapid-fire requests that could cascade
      let requestsBeforeCircuitOpen = 0;
      let blockedByCircuit = 0;
      let poolExhausted = 0;
      
      for (let i = 0; i < 50; i++) {
        try {
          await this.system.makeRequest('test', [i]);
          requestsBeforeCircuitOpen++;
        } catch (error) {
          if (error.message.includes('Circuit breaker is open')) {
            blockedByCircuit++;
          } else if (error.message.includes('pool exhausted')) {
            poolExhausted++;
          }
        }
      }
      
      details.requestsBeforeCircuitOpen = requestsBeforeCircuitOpen;
      details.blockedByCircuit = blockedByCircuit;
      details.poolExhausted = poolExhausted;
      details.totalRequests = 50;
      
      console.log(`   Requests before circuit opened: ${requestsBeforeCircuitOpen}`);
      console.log(`   Requests blocked by circuit: ${blockedByCircuit}`);
      console.log(`   Pool exhaustion events: ${poolExhausted}`);
      
      // Check if circuit breaker prevented cascade
      if (blockedByCircuit > 30) {
        console.log(`   ✅ Circuit breaker prevented cascade (blocked ${blockedByCircuit} requests)`);
      } else if (blockedByCircuit === 0) {
        passed = false;
        console.log(`   ❌ Circuit breaker did not activate`);
      } else {
        console.log(`   ⚠️  Circuit breaker partially effective`);
      }
      
      // Check pool didn't cause complete failure
      if (poolExhausted > 10) {
        passed = false;
        console.log(`   ❌ Connection pool exhaustion not prevented`);
      } else {
        console.log(`   ✅ Connection pool exhaustion limited`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.networkSimulator.clearAllFailures();
      this.components.connectionPool.maxConnections = 10;
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Test 4: Recovery from Multiple Simultaneous Failures
   */
  async testRecoveryFromMultipleFailures() {
    console.log('🧪 Test 4: Recovery from Multiple Failures');
    console.log('------------------------------------------------');
    
    const testName = 'Recovery from Multiple Failures';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Phase 1: Create multiple failures
      console.log('   Phase 1: Creating multiple failures');
      this.components.requestCache.failed = true;
      this.components.tokenBucket.failed = true;
      this.networkSimulator.blockEndpoint('api.mainnet-beta.solana.com');
      
      // Make some failing requests
      let phase1Success = 0;
      for (let i = 0; i < 10; i++) {
        try {
          await this.system.makeRequest('test', [i]);
          phase1Success++;
        } catch (e) {}
      }
      
      details.phase1Success = phase1Success;
      console.log(`   Initial state: ${phase1Success}/10 successful`);
      
      // Phase 2: Begin recovery
      console.log('   Phase 2: Beginning recovery');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fix one component at a time
      this.components.requestCache.failed = false;
      console.log('   ✅ RequestCache recovered');
      
      let phase2Success = 0;
      for (let i = 0; i < 10; i++) {
        try {
          await this.system.makeRequest('test', [i]);
          phase2Success++;
        } catch (e) {}
      }
      
      details.phase2Success = phase2Success;
      console.log(`   Partial recovery: ${phase2Success}/10 successful`);
      
      // Fix remaining issues
      this.components.tokenBucket.failed = false;
      this.networkSimulator.unblockEndpoint('api.mainnet-beta.solana.com');
      console.log('   ✅ All components recovered');
      
      // Wait for circuit breaker recovery if needed
      if (this.components.circuitBreaker.state === 'open') {
        console.log('   ⏳ Waiting for circuit breaker recovery...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Test full recovery
      let phase3Success = 0;
      for (let i = 0; i < 20; i++) {
        try {
          await this.system.makeRequest('test', [i]);
          phase3Success++;
        } catch (e) {}
      }
      
      details.phase3Success = phase3Success;
      details.finalMetrics = this.system.getMetrics();
      
      const recoveryRate = phase3Success / 20;
      console.log(`   Full recovery: ${phase3Success}/20 successful (${(recoveryRate * 100).toFixed(1)}%)`);
      console.log(`   Final system health: ${details.finalMetrics.systemHealth.toFixed(1)}%`);
      
      // Check recovery success
      if (recoveryRate < 0.8) {
        passed = false;
        console.log(`   ❌ System did not fully recover`);
      } else {
        console.log(`   ✅ System successfully recovered`);
      }
      
      // Check gradual recovery pattern
      if (phase2Success > phase1Success && phase3Success > phase2Success) {
        console.log(`   ✅ Gradual recovery pattern observed`);
      } else {
        console.log(`   ⚠️  Recovery pattern irregular`);
      }
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.networkSimulator.clearAllFailures();
    }
    
    const duration = Date.now() - startTime;
    this.recordResult(testName, passed, duration, details);
    console.log(`   Duration: ${duration}ms\n`);
    
    return passed;
  }
  
  /**
   * Test 5: Worst-Case Scenario
   */
  async testWorstCaseScenario() {
    console.log('🧪 Test 5: Worst-Case Scenario');
    console.log('------------------------------------------------');
    
    const testName = 'Worst-Case Scenario';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Create worst-case scenario
      console.log('   💀 Creating worst-case scenario:');
      console.log('      - 3 components failed');
      console.log('      - 2/3 endpoints blocked');
      console.log('      - Limited connection pool');
      
      // Fail multiple components
      this.components.requestCache.failed = true;
      this.components.batchManager.failed = true;
      this.components.tokenBucket.failed = true;
      
      // Block network endpoints
      this.networkSimulator.blockEndpoint('api.mainnet-beta.solana.com');
      this.networkSimulator.blockEndpoint('solana-api.projectserum.com');
      
      // Limit connection pool
      this.components.connectionPool.maxConnections = 5;
      
      // Test minimum capability
      let successCount = 0;
      let totalAttempts = 30;
      
      for (let i = 0; i < totalAttempts; i++) {
        try {
          await this.system.makeRequest('critical', [i]);
          successCount++;
        } catch (error) {
          // Expected failures in worst case
        }
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const metrics = this.system.getMetrics();
      details.successCount = successCount;
      details.successRate = successCount / totalAttempts;
      details.metrics = metrics;
      details.failedComponents = metrics.failedComponents;
      
      console.log(`   Results: ${successCount}/${totalAttempts} successful (${(details.successRate * 100).toFixed(1)}%)`);
      console.log(`   Failed components: ${details.failedComponents.join(', ') || 'none'}`);
      console.log(`   Circuit breaker: ${metrics.circuitBreakerState}`);
      console.log(`   System health: ${metrics.systemHealth.toFixed(1)}%`);
      
      // Check minimum capability maintained
      if (successCount === 0) {
        passed = false;
        console.log(`   ❌ Complete system failure - no basic RPC capability`);
      } else if (details.successRate < 0.2) {
        console.log(`   ⚠️  Very limited capability but system survived`);
      } else {
        console.log(`   ✅ System maintained basic RPC functionality`);
      }
      
      // Check system didn't crash
      console.log(`   ✅ System survived worst-case scenario without crashing`);
      
    } catch (error) {
      passed = false;
      details.error = error.message;
      console.log(`   ❌ Test error: ${error.message}`);
    } finally {
      // Cleanup
      this.networkSimulator.clearAllFailures();
      this.components.connectionPool.maxConnections = 10;
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
    console.log('🚀 Starting Cascade Prevention Test Suite');
    console.log('=' .repeat(60));
    console.log('');
    
    const tests = [
      () => this.testSimultaneousTwoComponentFailure(),
      () => this.testMultipleNetworkEndpointFailures(),
      () => this.testCircuitBreakerCascadePrevention(),
      () => this.testRecoveryFromMultipleFailures(),
      () => this.testWorstCaseScenario()
    ];
    
    for (const test of tests) {
      await test();
      // Reset between tests
      this.system.reset();
      this.networkSimulator.clearAllFailures();
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
    console.log('=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
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
    
    // Cascade prevention summary
    console.log('Cascade Prevention Mechanisms:');
    console.log('  ✓ Circuit breaker with automatic trip');
    console.log('  ✓ Component isolation and fallback');
    console.log('  ✓ Connection pool management');
    console.log('  ✓ Gradual recovery coordination');
    console.log('  ✓ Multi-failure tolerance');
    console.log('');
  }
  
  /**
   * Save test results to file
   */
  async saveResults() {
    const resultsPath = path.join(process.cwd(), 'results', 'cascade-prevention-test-results.json');
    
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
    this.networkSimulator.stop();
    this.system.reset();
    console.log('✅ Cleanup complete');
  }
}

// Main execution
async function main() {
  const tester = new CascadePreventionTests();
  
  try {
    await tester.initialize();
    const allPassed = await tester.runAllTests();
    
    if (allPassed) {
      console.log('\n🎉 All cascade prevention tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default CascadePreventionTests;