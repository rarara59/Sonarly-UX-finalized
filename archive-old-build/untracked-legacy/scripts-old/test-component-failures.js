#!/usr/bin/env node

/**
 * Component Failure Test Suite
 * Tests system resilience when individual components fail
 */

import { RpcConnectionPoolAdapter } from '../src/adapters/rpc-connection-pool.adapter.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Integration Error Handler
 * Isolates component failures and provides graceful degradation
 */
class IntegrationErrorHandler {
  constructor() {
    this.failedComponents = new Set();
    this.errorLog = [];
    this.componentHealth = new Map();
    this.isolationMode = true;
  }
  
  /**
   * Handle component error with isolation
   */
  handleComponentError(componentName, error, context = {}) {
    // Log the error
    this.errorLog.push({
      timestamp: Date.now(),
      component: componentName,
      error: error.message,
      stack: error.stack,
      context
    });
    
    // Mark component as failed
    this.failedComponents.add(componentName);
    
    // Update health status
    this.componentHealth.set(componentName, {
      status: 'failed',
      lastError: error.message,
      failedAt: Date.now(),
      attempts: (this.componentHealth.get(componentName)?.attempts || 0) + 1
    });
    
    console.log(`⚠️  Component failed: ${componentName} - ${error.message}`);
    
    // Return isolation decision
    return {
      shouldIsolate: this.isolationMode,
      fallbackStrategy: this.getFallbackStrategy(componentName),
      canContinue: this.canSystemContinue()
    };
  }
  
  /**
   * Get fallback strategy for failed component
   */
  getFallbackStrategy(componentName) {
    const strategies = {
      tokenBucket: 'bypass-rate-limiting',
      requestCache: 'direct-requests',
      batchManager: 'individual-requests',
      circuitBreaker: 'bypass-protection',
      endpointSelector: 'round-robin',
      hedgedManager: 'single-request',
      connectionPool: 'emergency-fallback'
    };
    
    return strategies[componentName] || 'default-bypass';
  }
  
  /**
   * Check if system can continue operating
   */
  canSystemContinue() {
    const criticalComponents = ['connectionPool'];
    const failedCritical = Array.from(this.failedComponents)
      .filter(c => criticalComponents.includes(c));
    
    return failedCritical.length === 0;
  }
  
  /**
   * Attempt to recover failed component
   */
  async attemptRecovery(componentName) {
    const health = this.componentHealth.get(componentName);
    
    if (!health || health.status !== 'failed') {
      return false;
    }
    
    // Check if enough time has passed for recovery attempt
    const timeSinceFailure = Date.now() - health.failedAt;
    const minRecoveryTime = 5000 * Math.min(health.attempts, 5); // Exponential backoff
    
    if (timeSinceFailure < minRecoveryTime) {
      return false;
    }
    
    console.log(`🔄 Attempting recovery for: ${componentName}`);
    
    // Remove from failed set to allow retry
    this.failedComponents.delete(componentName);
    this.componentHealth.set(componentName, {
      status: 'recovering',
      lastError: health.lastError,
      recoveryStarted: Date.now(),
      attempts: health.attempts
    });
    
    return true;
  }
  
  /**
   * Get system health percentage
   */
  getSystemHealth() {
    const totalComponents = 7;
    const healthyComponents = totalComponents - this.failedComponents.size;
    return (healthyComponents / totalComponents) * 100;
  }
  
  /**
   * Reset error handler
   */
  reset() {
    this.failedComponents.clear();
    this.errorLog = [];
    this.componentHealth.clear();
  }
}

/**
 * Component Failure Test Suite
 */
class ComponentFailureTests {
  constructor() {
    this.errorHandler = new IntegrationErrorHandler();
    this.pool = null;
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
    console.log('🔧 Initializing Component Failure Tests...\n');
    
    // Initialize RPC pool adapter
    await RpcConnectionPoolAdapter.initialize();
    
    // Import factory
    const { default: factory } = await import('../src/detection/transport/component-factory.js');
    this.factory = factory;
    
    // Create mock components with failure injection
    await this.createTestComponents();
    
    console.log('✅ Initialization complete\n');
  }
  
  async createTestComponents() {
    // Create mock components that can be failed on demand
    this.components = {
      tokenBucket: {
        name: 'tokenBucket',
        failed: false,
        requestCount: 0,
        consume: async function(tokens = 1) {
          if (this.failed) {
            throw new Error('TokenBucket component failed');
          }
          this.requestCount++;
          return true;
        },
        reset: function() {
          this.failed = false;
          this.requestCount = 0;
        }
      },
      
      requestCache: {
        name: 'requestCache',
        failed: false,
        cache: new Map(),
        hitCount: 0,
        missCount: 0,
        get: function(key) {
          if (this.failed) {
            throw new Error('RequestCache component failed');
          }
          const value = this.cache.get(key);
          if (value) {
            this.hitCount++;
            return value;
          }
          this.missCount++;
          return null;
        },
        set: function(key, value) {
          if (this.failed) {
            throw new Error('RequestCache component failed');
          }
          this.cache.set(key, value);
        },
        reset: function() {
          this.failed = false;
          this.cache.clear();
          this.hitCount = 0;
          this.missCount = 0;
        }
      },
      
      batchManager: {
        name: 'batchManager',
        failed: false,
        batchCount: 0,
        requestCount: 0,
        batch: async function(requests) {
          if (this.failed) {
            throw new Error('BatchManager component failed');
          }
          this.batchCount++;
          this.requestCount += requests.length;
          return requests.map(r => ({ success: true, data: r }));
        },
        reset: function() {
          this.failed = false;
          this.batchCount = 0;
          this.requestCount = 0;
        }
      },
      
      circuitBreaker: {
        name: 'circuitBreaker',
        failed: false,
        state: 'closed',
        check: function() {
          if (this.failed) {
            throw new Error('CircuitBreaker component failed');
          }
          return this.state === 'closed';
        },
        reset: function() {
          this.failed = false;
          this.state = 'closed';
        }
      },
      
      endpointSelector: {
        name: 'endpointSelector',
        failed: false,
        endpoints: ['endpoint1', 'endpoint2', 'endpoint3'],
        currentIndex: 0,
        select: function() {
          if (this.failed) {
            throw new Error('EndpointSelector component failed');
          }
          const endpoint = this.endpoints[this.currentIndex];
          this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
          return endpoint;
        },
        reset: function() {
          this.failed = false;
          this.currentIndex = 0;
        }
      },
      
      hedgedManager: {
        name: 'hedgedManager',
        failed: false,
        requestCount: 0,
        execute: async function(request) {
          if (this.failed) {
            throw new Error('HedgedManager component failed');
          }
          this.requestCount++;
          return { success: true, data: request };
        },
        reset: function() {
          this.failed = false;
          this.requestCount = 0;
        }
      },
      
      connectionPool: {
        name: 'connectionPool',
        failed: false,
        connections: 5,
        requestCount: 0,
        getConnection: function() {
          if (this.failed) {
            throw new Error('ConnectionPool component failed');
          }
          this.requestCount++;
          return { id: Math.floor(Math.random() * this.connections) };
        },
        reset: function() {
          this.failed = false;
          this.requestCount = 0;
        }
      }
    };
    
    // Create integrated system with components
    this.system = this.createIntegratedSystem();
  }
  
  createIntegratedSystem() {
    const self = this;
    
    return {
      async makeRequest(method, params) {
        const results = {
          componentResults: {},
          errors: [],
          success: true
        };
        
        try {
          // 1. Rate limiting
          try {
            await self.components.tokenBucket.consume(1);
            results.componentResults.tokenBucket = 'passed';
          } catch (error) {
            const isolation = self.errorHandler.handleComponentError('tokenBucket', error);
            if (isolation.fallbackStrategy === 'bypass-rate-limiting') {
              results.componentResults.tokenBucket = 'bypassed';
            } else {
              throw error;
            }
          }
          
          // 2. Cache check
          const cacheKey = `${method}:${JSON.stringify(params)}`;
          try {
            const cached = self.components.requestCache.get(cacheKey);
            if (cached) {
              results.componentResults.requestCache = 'hit';
              return { ...results, data: cached };
            }
            results.componentResults.requestCache = 'miss';
          } catch (error) {
            const isolation = self.errorHandler.handleComponentError('requestCache', error);
            if (isolation.fallbackStrategy === 'direct-requests') {
              results.componentResults.requestCache = 'bypassed';
            } else {
              throw error;
            }
          }
          
          // 3. Circuit breaker check
          try {
            if (!self.components.circuitBreaker.check()) {
              throw new Error('Circuit breaker is open');
            }
            results.componentResults.circuitBreaker = 'passed';
          } catch (error) {
            if (!error.message.includes('Circuit breaker is open')) {
              const isolation = self.errorHandler.handleComponentError('circuitBreaker', error);
              if (isolation.fallbackStrategy === 'bypass-protection') {
                results.componentResults.circuitBreaker = 'bypassed';
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }
          
          // 4. Endpoint selection
          let endpoint;
          try {
            endpoint = self.components.endpointSelector.select();
            results.componentResults.endpointSelector = endpoint;
          } catch (error) {
            const isolation = self.errorHandler.handleComponentError('endpointSelector', error);
            if (isolation.fallbackStrategy === 'round-robin') {
              endpoint = 'fallback-endpoint';
              results.componentResults.endpointSelector = 'fallback';
            } else {
              throw error;
            }
          }
          
          // 5. Connection pool
          let connection;
          try {
            connection = self.components.connectionPool.getConnection();
            results.componentResults.connectionPool = `connection-${connection.id}`;
          } catch (error) {
            const isolation = self.errorHandler.handleComponentError('connectionPool', error);
            if (!isolation.canContinue) {
              throw new Error('Critical component failure: connectionPool');
            }
            connection = { id: 'emergency' };
            results.componentResults.connectionPool = 'emergency';
          }
          
          // 6. Execute request (with batching or hedging)
          let response;
          try {
            // Try batch manager
            if (Math.random() > 0.5 && !self.components.batchManager.failed) {
              response = await self.components.batchManager.batch([{ method, params }]);
              results.componentResults.batchManager = 'used';
            } else if (!self.components.hedgedManager.failed) {
              response = await self.components.hedgedManager.execute({ method, params });
              results.componentResults.hedgedManager = 'used';
            } else {
              response = { success: true, data: { method, params } };
              results.componentResults.execution = 'direct';
            }
          } catch (error) {
            const componentName = error.message.includes('BatchManager') ? 'batchManager' : 'hedgedManager';
            const isolation = self.errorHandler.handleComponentError(componentName, error);
            response = { success: true, data: { method, params } };
            results.componentResults[componentName] = 'failed-bypassed';
          }
          
          // 7. Cache successful response
          if (!self.components.requestCache.failed) {
            try {
              self.components.requestCache.set(cacheKey, response);
            } catch (error) {
              // Ignore cache write failures
            }
          }
          
          return { ...results, data: response };
          
        } catch (error) {
          results.success = false;
          results.error = error.message;
          throw error;
        }
      },
      
      getSystemHealth() {
        return self.errorHandler.getSystemHealth();
      },
      
      reset() {
        Object.values(self.components).forEach(c => c.reset());
        self.errorHandler.reset();
      }
    };
  }
  
  /**
   * Test 1: TokenBucket Failure
   */
  async testTokenBucketFailure() {
    console.log('🧪 Test 1: TokenBucket Component Failure');
    console.log('----------------------------------------');
    
    const testName = 'TokenBucket Failure';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Make some successful requests first
      let baselineSuccess = 0;
      for (let i = 0; i < 10; i++) {
        try {
          await this.system.makeRequest('getSlot', []);
          baselineSuccess++;
        } catch (e) {}
      }
      details.baselineSuccess = baselineSuccess;
      console.log(`   Baseline: ${baselineSuccess}/10 successful`);
      
      // Fail the TokenBucket component
      this.components.tokenBucket.failed = true;
      console.log('   ❌ TokenBucket component failed');
      
      // Test system continues operating
      let degradedSuccess = 0;
      let bypassCount = 0;
      
      for (let i = 0; i < 20; i++) {
        try {
          const result = await this.system.makeRequest('getBalance', ['11111111111111111111111111111111']);
          degradedSuccess++;
          if (result.componentResults.tokenBucket === 'bypassed') {
            bypassCount++;
          }
        } catch (e) {}
      }
      
      details.degradedSuccess = degradedSuccess;
      details.bypassCount = bypassCount;
      details.systemHealth = this.system.getSystemHealth();
      
      const successRate = degradedSuccess / 20;
      console.log(`   Degraded mode: ${degradedSuccess}/20 successful (${(successRate * 100).toFixed(1)}%)`);
      console.log(`   Rate limiting bypassed: ${bypassCount} times`);
      console.log(`   System health: ${details.systemHealth.toFixed(1)}%`);
      
      // Check success criteria
      if (successRate < 0.7) {
        passed = false;
        console.log(`   ❌ Success rate below 70% threshold`);
      } else {
        console.log(`   ✅ System maintained >70% functionality`);
      }
      
      if (bypassCount === 0) {
        passed = false;
        console.log(`   ❌ Fallback strategy not activated`);
      } else {
        console.log(`   ✅ Fallback strategy activated correctly`);
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
   * Test 2: RequestCache Failure
   */
  async testRequestCacheFailure() {
    console.log('🧪 Test 2: RequestCache Component Failure');
    console.log('----------------------------------------');
    
    const testName = 'RequestCache Failure';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Prime the cache with some data
      for (let i = 0; i < 5; i++) {
        await this.system.makeRequest(`test${i}`, [i]);
      }
      
      // Test cache hits before failure
      let cacheHits = 0;
      for (let i = 0; i < 5; i++) {
        const result = await this.system.makeRequest(`test${i}`, [i]);
        if (result.componentResults.requestCache === 'hit') {
          cacheHits++;
        }
      }
      details.baselineCacheHits = cacheHits;
      console.log(`   Baseline cache hits: ${cacheHits}/5`);
      
      // Fail the RequestCache component
      this.components.requestCache.failed = true;
      console.log('   ❌ RequestCache component failed');
      
      // Test system continues without caching
      let degradedSuccess = 0;
      let directRequests = 0;
      
      for (let i = 0; i < 20; i++) {
        try {
          const result = await this.system.makeRequest(`test${i % 5}`, [i % 5]);
          degradedSuccess++;
          if (result.componentResults.requestCache === 'bypassed') {
            directRequests++;
          }
        } catch (e) {}
      }
      
      details.degradedSuccess = degradedSuccess;
      details.directRequests = directRequests;
      details.systemHealth = this.system.getSystemHealth();
      
      const successRate = degradedSuccess / 20;
      console.log(`   Degraded mode: ${degradedSuccess}/20 successful (${(successRate * 100).toFixed(1)}%)`);
      console.log(`   Direct requests (cache bypassed): ${directRequests}`);
      console.log(`   System health: ${details.systemHealth.toFixed(1)}%`);
      
      // Check success criteria
      if (successRate < 0.7) {
        passed = false;
        console.log(`   ❌ Success rate below 70% threshold`);
      } else {
        console.log(`   ✅ System maintained >70% functionality`);
      }
      
      if (directRequests === 0) {
        passed = false;
        console.log(`   ❌ Cache bypass not working`);
      } else {
        console.log(`   ✅ Cache gracefully degraded to direct requests`);
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
   * Test 3: BatchManager Failure
   */
  async testBatchManagerFailure() {
    console.log('🧪 Test 3: BatchManager Component Failure');
    console.log('----------------------------------------');
    
    const testName = 'BatchManager Failure';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Fail the BatchManager component
      this.components.batchManager.failed = true;
      console.log('   ❌ BatchManager component failed');
      
      // Test system falls back to individual requests
      let successCount = 0;
      let fallbackCount = 0;
      
      for (let i = 0; i < 20; i++) {
        try {
          const result = await this.system.makeRequest('getSlot', []);
          successCount++;
          
          if (result.componentResults.batchManager === 'failed-bypassed' ||
              result.componentResults.hedgedManager === 'used' ||
              result.componentResults.execution === 'direct') {
            fallbackCount++;
          }
        } catch (e) {}
      }
      
      details.successCount = successCount;
      details.fallbackCount = fallbackCount;
      details.systemHealth = this.system.getSystemHealth();
      
      const successRate = successCount / 20;
      console.log(`   Results: ${successCount}/20 successful (${(successRate * 100).toFixed(1)}%)`);
      console.log(`   Fallback to individual requests: ${fallbackCount}`);
      console.log(`   System health: ${details.systemHealth.toFixed(1)}%`);
      
      // Check success criteria
      if (successRate < 0.7) {
        passed = false;
        console.log(`   ❌ Success rate below 70% threshold`);
      } else {
        console.log(`   ✅ System maintained >70% functionality`);
      }
      
      if (fallbackCount === 0) {
        passed = false;
        console.log(`   ❌ No fallback to individual requests`);
      } else {
        console.log(`   ✅ Successfully fell back to individual request processing`);
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
   * Test 4: Error Isolation
   */
  async testErrorIsolation() {
    console.log('🧪 Test 4: Component Error Isolation');
    console.log('----------------------------------------');
    
    const testName = 'Error Isolation';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Fail multiple non-critical components
      this.components.tokenBucket.failed = true;
      this.components.requestCache.failed = true;
      this.components.batchManager.failed = true;
      console.log('   ❌ Failed: TokenBucket, RequestCache, BatchManager');
      
      // Check that other components still work
      let healthyComponents = [];
      
      // Test CircuitBreaker
      try {
        this.components.circuitBreaker.check();
        healthyComponents.push('circuitBreaker');
      } catch (e) {}
      
      // Test EndpointSelector
      try {
        this.components.endpointSelector.select();
        healthyComponents.push('endpointSelector');
      } catch (e) {}
      
      // Test ConnectionPool
      try {
        this.components.connectionPool.getConnection();
        healthyComponents.push('connectionPool');
      } catch (e) {}
      
      // Test HedgedManager
      try {
        await this.components.hedgedManager.execute({ test: true });
        healthyComponents.push('hedgedManager');
      } catch (e) {}
      
      details.healthyComponents = healthyComponents;
      details.failedComponents = Array.from(this.errorHandler.failedComponents);
      details.systemHealth = this.system.getSystemHealth();
      
      console.log(`   Healthy components: ${healthyComponents.join(', ')}`);
      console.log(`   Failed components isolated: ${details.failedComponents.join(', ')}`);
      console.log(`   System health: ${details.systemHealth.toFixed(1)}%`);
      
      // Make requests to test system still works
      let successCount = 0;
      for (let i = 0; i < 10; i++) {
        try {
          await this.system.makeRequest('test', []);
          successCount++;
        } catch (e) {}
      }
      
      details.requestSuccess = successCount;
      const successRate = successCount / 10;
      
      console.log(`   Request success rate: ${(successRate * 100).toFixed(1)}%`);
      
      // Check isolation effectiveness
      if (healthyComponents.length < 4) {
        passed = false;
        console.log(`   ❌ Healthy components affected by failures`);
      } else {
        console.log(`   ✅ Failed components properly isolated`);
      }
      
      if (successRate < 0.7) {
        passed = false;
        console.log(`   ❌ System functionality below 70%`);
      } else {
        console.log(`   ✅ System maintained >70% functionality`);
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
   * Test 5: Component Recovery
   */
  async testComponentRecovery() {
    console.log('🧪 Test 5: Component Recovery');
    console.log('----------------------------------------');
    
    const testName = 'Component Recovery';
    const startTime = Date.now();
    let passed = true;
    const details = {};
    
    try {
      // Reset system
      this.system.reset();
      
      // Fail a component
      this.components.tokenBucket.failed = true;
      console.log('   ❌ TokenBucket component failed');
      
      // Make some requests with failed component
      let failedStateSuccess = 0;
      for (let i = 0; i < 5; i++) {
        try {
          await this.system.makeRequest('test', []);
          failedStateSuccess++;
        } catch (e) {}
      }
      details.failedStateSuccess = failedStateSuccess;
      
      // Wait for recovery window
      console.log('   ⏳ Waiting for recovery window...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Attempt recovery
      const canRecover = await this.errorHandler.attemptRecovery('tokenBucket');
      details.recoveryAttempted = canRecover;
      
      if (canRecover) {
        // Fix the component
        this.components.tokenBucket.failed = false;
        console.log('   ✅ TokenBucket component recovered');
        
        // Test system with recovered component
        let recoveredSuccess = 0;
        let tokenBucketActive = 0;
        
        for (let i = 0; i < 10; i++) {
          try {
            const result = await this.system.makeRequest('test', []);
            recoveredSuccess++;
            if (result.componentResults.tokenBucket === 'passed') {
              tokenBucketActive++;
            }
          } catch (e) {}
        }
        
        details.recoveredSuccess = recoveredSuccess;
        details.tokenBucketActive = tokenBucketActive;
        
        const recoveryRate = recoveredSuccess / 10;
        console.log(`   Post-recovery success: ${recoveredSuccess}/10 (${(recoveryRate * 100).toFixed(1)}%)`);
        console.log(`   TokenBucket reintegrated: ${tokenBucketActive}/10 requests`);
        
        if (tokenBucketActive === 0) {
          passed = false;
          console.log(`   ❌ Component not reintegrated after recovery`);
        } else {
          console.log(`   ✅ Component successfully reintegrated`);
        }
        
        if (recoveryRate < 0.9) {
          passed = false;
          console.log(`   ❌ System not fully recovered`);
        } else {
          console.log(`   ✅ System fully recovered`);
        }
      } else {
        passed = false;
        console.log(`   ❌ Recovery not attempted`);
      }
      
      details.finalSystemHealth = this.system.getSystemHealth();
      console.log(`   Final system health: ${details.finalSystemHealth.toFixed(1)}%`);
      
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
    console.log('🚀 Starting Component Failure Test Suite');
    console.log('=' .repeat(50));
    console.log('');
    
    const tests = [
      () => this.testTokenBucketFailure(),
      () => this.testRequestCacheFailure(),
      () => this.testBatchManagerFailure(),
      () => this.testErrorIsolation(),
      () => this.testComponentRecovery()
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
    
    // Component failure statistics
    console.log('Component Failure Handling:');
    console.log(`  Error Handler: IntegrationErrorHandler`);
    console.log(`  Isolation Mode: Enabled`);
    console.log(`  Fallback Strategies: Component-specific`);
    console.log(`  Recovery Capability: Exponential backoff`);
    console.log('');
  }
  
  /**
   * Save test results to file
   */
  async saveResults() {
    const resultsPath = path.join(process.cwd(), 'results', 'component-failure-test-results.json');
    
    try {
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
      console.log(`💾 Results saved to: ${resultsPath}`);
    } catch (error) {
      console.error(`Failed to save results: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  const tester = new ComponentFailureTests();
  
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
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { IntegrationErrorHandler, ComponentFailureTests as default };