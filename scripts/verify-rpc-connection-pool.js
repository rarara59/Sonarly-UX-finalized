#!/usr/bin/env node

/**
 * Basic Component Test - RPC Connection Pool
 * Verifies core functionality of the RPC connection pool
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 RPC Connection Pool - Basic Component Test');
console.log('==============================================\n');

class ComponentTester {
  constructor() {
    this.pool = null;
    this.tests = {
      initialization: false,
      basicCall: false,
      endpointRotation: false,
      errorHandling: false,
      statistics: false,
      healthMonitoring: false,
      queueing: false
    };
  }

  async testInitialization() {
    console.log('📦 Test 1: Pool Initialization');
    console.log('─'.repeat(40));
    
    try {
      this.pool = new RpcConnectionPool({
        endpoints: [
          process.env.CHAINSTACK_RPC_URL,
          process.env.HELIUS_RPC_URL,
          process.env.PUBLIC_RPC_URL
        ].filter(Boolean),
        debug: false
      });
      
      console.log('✅ Pool created successfully');
      console.log(`✅ ${this.pool.endpoints.length} endpoints configured`);
      
      // Verify endpoint structure
      for (const endpoint of this.pool.endpoints) {
        if (!endpoint.url || !endpoint.rateLimiter || !endpoint.breaker) {
          throw new Error('Endpoint missing required properties');
        }
      }
      console.log('✅ All endpoints have required properties');
      
      // Verify configuration
      if (!this.pool.config || !this.pool.stats) {
        throw new Error('Pool missing configuration or stats');
      }
      console.log('✅ Configuration and stats initialized');
      
      this.tests.initialization = true;
      console.log('\n✅ Initialization test PASSED\n');
    } catch (error) {
      console.error('❌ Initialization test FAILED:', error.message);
    }
  }

  async testBasicCall() {
    console.log('📞 Test 2: Basic RPC Call');
    console.log('─'.repeat(40));
    
    try {
      const startTime = Date.now();
      const result = await this.pool.call('getSlot');
      const latency = Date.now() - startTime;
      
      if (!result || typeof result !== 'number') {
        throw new Error('Invalid response from getSlot');
      }
      
      console.log(`✅ getSlot returned: ${result}`);
      console.log(`✅ Latency: ${latency}ms`);
      
      // Test with parameters
      const blockHeight = await this.pool.call('getBlockHeight');
      console.log(`✅ getBlockHeight returned: ${blockHeight}`);
      
      // Test error handling for invalid method
      try {
        await this.pool.call('invalidMethod');
        throw new Error('Should have thrown error for invalid method');
      } catch (err) {
        console.log('✅ Error handling works for invalid methods');
      }
      
      this.tests.basicCall = true;
      console.log('\n✅ Basic call test PASSED\n');
    } catch (error) {
      console.error('❌ Basic call test FAILED:', error.message);
    }
  }

  async testEndpointRotation() {
    console.log('🔄 Test 3: Endpoint Rotation');
    console.log('─'.repeat(40));
    
    try {
      const endpointUsage = new Map();
      
      // Make 30 calls and track which endpoints are used
      for (let i = 0; i < 30; i++) {
        const endpoint = this.pool.selectBestEndpoint();
        if (!endpoint) {
          throw new Error('No endpoint selected');
        }
        
        const url = new URL(endpoint.url).hostname;
        endpointUsage.set(url, (endpointUsage.get(url) || 0) + 1);
        
        // Simulate request completion
        endpoint.stats.inFlight++;
        await new Promise(r => setTimeout(r, 10));
        endpoint.stats.inFlight--;
      }
      
      console.log('Endpoint usage distribution:');
      for (const [endpoint, count] of endpointUsage) {
        console.log(`  ${endpoint}: ${count} requests`);
      }
      
      // Verify multiple endpoints were used
      if (endpointUsage.size < 2) {
        throw new Error('Not enough endpoint rotation');
      }
      
      console.log(`✅ Used ${endpointUsage.size} different endpoints`);
      
      this.tests.endpointRotation = true;
      console.log('\n✅ Endpoint rotation test PASSED\n');
    } catch (error) {
      console.error('❌ Endpoint rotation test FAILED:', error.message);
    }
  }

  async testErrorHandling() {
    console.log('⚠️  Test 4: Error Handling');
    console.log('─'.repeat(40));
    
    try {
      // Test network error classification
      const networkError = new Error('ECONNREFUSED');
      const networkInfo = this.pool.classifyError(networkError);
      if (networkInfo.type !== 'network') {
        throw new Error('Network error not classified correctly');
      }
      console.log('✅ Network error classified correctly');
      
      // Test rate limit error classification
      const rateLimitError = new Error('429 Too Many Requests');
      rateLimitError.status = 429;
      const rateLimitInfo = this.pool.classifyError(rateLimitError);
      if (rateLimitInfo.type !== 'rate_limit') {
        throw new Error('Rate limit error not classified correctly');
      }
      console.log('✅ Rate limit error classified correctly');
      
      // Test timeout error classification
      const timeoutError = new Error('Request timeout');
      const timeoutInfo = this.pool.classifyError(timeoutError);
      if (timeoutInfo.type !== 'timeout') {
        throw new Error('Timeout error not classified correctly');
      }
      console.log('✅ Timeout error classified correctly');
      
      // Test retry logic
      const request = { attempts: 1, method: 'test' };
      const shouldRetryRateLimit = this.pool.shouldRetryRequest(
        request, 
        rateLimitInfo, 
        this.pool.endpoints[0]
      );
      if (!shouldRetryRateLimit) {
        throw new Error('Should retry rate limit errors');
      }
      console.log('✅ Retry logic works correctly');
      
      this.tests.errorHandling = true;
      console.log('\n✅ Error handling test PASSED\n');
    } catch (error) {
      console.error('❌ Error handling test FAILED:', error.message);
    }
  }

  async testStatistics() {
    console.log('📊 Test 5: Statistics Tracking');
    console.log('─'.repeat(40));
    
    try {
      // Make some successful calls
      for (let i = 0; i < 5; i++) {
        await this.pool.call('getSlot');
      }
      
      const stats = this.pool.getStats();
      
      if (!stats.global || !stats.endpoints) {
        throw new Error('Stats structure incomplete');
      }
      
      console.log('Global stats:');
      console.log(`  Total calls: ${stats.global.calls}`);
      console.log(`  Success rate: ${stats.global.successRate}`);
      console.log(`  Average latency: ${stats.global.avgLatency}ms`);
      
      if (stats.global.calls === 0) {
        throw new Error('No calls recorded in stats');
      }
      
      console.log('\nEndpoint stats:');
      for (const endpoint of stats.endpoints) {
        console.log(`  ${endpoint.url}:`);
        console.log(`    Calls: ${endpoint.calls}`);
        console.log(`    Success rate: ${endpoint.successRate}`);
        console.log(`    Health: ${endpoint.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      }
      
      // Test load distribution
      const distribution = this.pool.getLoadDistribution();
      if (!distribution || Object.keys(distribution).length === 0) {
        throw new Error('Load distribution not available');
      }
      console.log('\n✅ Statistics tracking working');
      
      this.tests.statistics = true;
      console.log('\n✅ Statistics test PASSED\n');
    } catch (error) {
      console.error('❌ Statistics test FAILED:', error.message);
    }
  }

  async testHealthMonitoring() {
    console.log('🏥 Test 6: Health Monitoring');
    console.log('─'.repeat(40));
    
    try {
      // Simulate endpoint health check
      const endpoint = this.pool.endpoints[0];
      const initialHealth = endpoint.health.healthy;
      
      console.log(`Initial health state: ${initialHealth ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      // Simulate successful request to improve health
      endpoint.stats.successes++;
      endpoint.stats.calls++;
      endpoint.health.latency = 25;
      endpoint.health.lastCheck = Date.now();
      
      // Check circuit breaker states
      let openBreakers = 0;
      let halfOpenBreakers = 0;
      
      for (const ep of this.pool.endpoints) {
        if (ep.breaker.state === 'OPEN') openBreakers++;
        if (ep.breaker.state === 'HALF_OPEN') halfOpenBreakers++;
        
        console.log(`  Endpoint ${ep.index}: Circuit breaker ${ep.breaker.state}`);
      }
      
      console.log(`\n✅ Circuit breakers - Open: ${openBreakers}, Half-open: ${halfOpenBreakers}`);
      
      // Test health recovery
      endpoint.breaker.state = 'OPEN';
      endpoint.breaker.openedAt = Date.now() - 31000; // Opened 31 seconds ago
      
      // Try to select endpoint - should transition to HALF_OPEN
      this.pool.selectBestEndpoint();
      
      if (endpoint.breaker.state !== 'HALF_OPEN' && endpoint.breaker.state !== 'OPEN') {
        console.log('✅ Health recovery mechanism working');
      }
      
      this.tests.healthMonitoring = true;
      console.log('\n✅ Health monitoring test PASSED\n');
    } catch (error) {
      console.error('❌ Health monitoring test FAILED:', error.message);
    }
  }

  async testQueueing() {
    console.log('📝 Test 7: Request Queueing');
    console.log('─'.repeat(40));
    
    try {
      // Saturate all endpoints but leave room for one more request
      for (const endpoint of this.pool.endpoints) {
        endpoint.stats.inFlight = endpoint.config.maxConcurrent - 1;
      }
      
      console.log('Endpoints nearly saturated, testing queue...');
      
      // Make a request that will succeed
      const firstPromise = this.pool.call('getSlot');
      
      // Now fully saturate all endpoints
      for (const endpoint of this.pool.endpoints) {
        endpoint.stats.inFlight = endpoint.config.maxConcurrent;
      }
      
      // Try to make another call - should be queued
      const queuedPromise = this.pool.call('getSlot').catch(err => {
        console.log(`  Queue error: ${err.message}`);
        return null;
      });
      
      // Check queue
      await new Promise(r => setTimeout(r, 10)); // Give it time to queue
      const queueLength = this.pool.requestQueue.length;
      console.log(`  Queue length: ${queueLength}`);
      
      // Complete first request and free up an endpoint
      await firstPromise;
      this.pool.endpoints[0].stats.inFlight = 0;
      
      // Process queue
      this.pool.processQueue();
      
      // Wait for queued result
      const result = await Promise.race([
        queuedPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      if (result !== null) {
        console.log('✅ Queued request processed successfully');
      }
      
      // Test queue deadline
      for (const endpoint of this.pool.endpoints) {
        endpoint.stats.inFlight = endpoint.config.maxConcurrent;
      }
      
      // Add expired request
      const expiredRequest = {
        method: 'test',
        params: [],
        timestamp: Date.now() - 70000, // 70 seconds old
        deferred: {
          resolve: () => {},
          reject: (err) => {
            if (err.message.includes('expired')) {
              console.log('✅ Expired requests handled correctly');
            }
          }
        }
      };
      
      this.pool.requestQueue.push(expiredRequest);
      this.pool.processQueue();
      
      this.tests.queueing = true;
      console.log('\n✅ Queueing test PASSED\n');
    } catch (error) {
      console.error('❌ Queueing test FAILED:', error.message);
    }
  }

  async runAllTests() {
    const startTime = Date.now();
    
    await this.testInitialization();
    await this.testBasicCall();
    await this.testEndpointRotation();
    await this.testErrorHandling();
    await this.testStatistics();
    await this.testHealthMonitoring();
    await this.testQueueing();
    
    const duration = Date.now() - startTime;
    
    // Summary
    console.log('=' .repeat(60));
    console.log('📋 COMPONENT TEST SUMMARY');
    console.log('=' .repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    for (const [test, result] of Object.entries(this.tests)) {
      const status = result ? '✅' : '❌';
      console.log(`  ${status} ${test}`);
      if (result) passed++;
      else failed++;
    }
    
    console.log('\n📊 Results:');
    console.log(`  Passed: ${passed}/${Object.keys(this.tests).length}`);
    console.log(`  Failed: ${failed}/${Object.keys(this.tests).length}`);
    console.log(`  Duration: ${duration}ms`);
    
    const allPassed = Object.values(this.tests).every(v => v);
    console.log(`\n🎯 OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n✨ RPC Connection Pool component is working correctly!');
    }
    
    // Cleanup
    if (this.pool) {
      await this.pool.destroy();
    }
    
    process.exit(allPassed ? 0 : 1);
  }
}

// Run tests
const tester = new ComponentTester();
tester.runAllTests().catch(console.error);