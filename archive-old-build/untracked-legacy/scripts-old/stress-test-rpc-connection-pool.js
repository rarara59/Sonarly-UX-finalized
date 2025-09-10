#!/usr/bin/env node

/**
 * Stress Test - RPC Connection Pool
 * Tests performance under high load and extreme conditions
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔥 RPC Connection Pool - Stress Test');
console.log('=====================================\n');

class StressTester {
  constructor() {
    this.pool = null;
    this.tests = {
      burstLoad: false,
      sustainedLoad: false,
      endpointFailure: false,
      mixedErrors: false,
      queueStress: false
    };
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      maxLatency: 0,
      throughput: 0
    };
  }

  async initialize() {
    this.pool = new RpcConnectionPool({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL,
        process.env.HELIUS_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ].filter(Boolean),
      debug: false,
      maxGlobalInFlight: 500,
      maxQueueSize: 2000
    });
    
    console.log('📦 Pool initialized for stress testing');
    console.log(`  Max concurrent: ${this.pool.config.maxGlobalInFlight}`);
    console.log(`  Max queue size: ${this.pool.config.maxQueueSize}`);
    console.log(`  Endpoints: ${this.pool.endpoints.length}\n`);
  }

  async testBurstLoad() {
    console.log('💥 Test 1: Burst Load (1000 requests in 1 second)');
    console.log('─'.repeat(50));
    
    try {
      const promises = [];
      const latencies = [];
      const startTime = Date.now();
      
      // Send 1000 requests as fast as possible
      for (let i = 0; i < 1000; i++) {
        const reqStartTime = Date.now();
        promises.push(
          this.pool.call('getSlot')
            .then(() => {
              latencies.push(Date.now() - reqStartTime);
              return true;
            })
            .catch(() => false)
        );
      }
      
      console.log('  Sent 1000 requests, waiting for responses...');
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => r).length;
      const failed = results.filter(r => !r).length;
      
      // Calculate statistics
      latencies.sort((a, b) => a - b);
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95 = latencies[Math.floor(latencies.length * 0.95)];
      const p99 = latencies[Math.floor(latencies.length * 0.99)];
      const maxLatency = latencies[latencies.length - 1];
      
      console.log('\n📊 Burst Load Results:');
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Successful: ${successful}/1000 (${(successful/10).toFixed(1)}%)`);
      console.log(`  Failed: ${failed}/1000`);
      console.log(`  Throughput: ${(1000 / (duration / 1000)).toFixed(1)} req/s`);
      console.log(`  Avg latency: ${avgLatency.toFixed(0)}ms`);
      console.log(`  P95 latency: ${p95}ms`);
      console.log(`  P99 latency: ${p99}ms`);
      console.log(`  Max latency: ${maxLatency}ms`);
      
      // Check queue behavior
      const stats = this.pool.getStats();
      console.log(`  Queue max size reached: ${stats.global.maxQueueLength || 'N/A'}`);
      console.log(`  Dropped requests: ${stats.global.dropped || 0}`);
      
      // Success criteria: handle at least 50% of burst
      this.tests.burstLoad = successful >= 500;
      console.log(`\n✅ Burst load test: ${this.tests.burstLoad ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Burst load test FAILED:', error.message);
      this.tests.burstLoad = false;
    }
  }

  async testSustainedLoad() {
    console.log('🏃 Test 2: Sustained Load (100 req/s for 30 seconds)');
    console.log('─'.repeat(50));
    
    try {
      const targetRPS = 100;
      const duration = 30000; // 30 seconds
      const interval = 1000 / targetRPS;
      
      let successCount = 0;
      let failCount = 0;
      const latencies = [];
      const startTime = Date.now();
      let requestsSent = 0;
      
      console.log(`  Target: ${targetRPS} requests/second`);
      console.log('  Running for 30 seconds...\n');
      
      const sendRequest = async () => {
        const reqStart = Date.now();
        try {
          await this.pool.call('getSlot');
          successCount++;
          latencies.push(Date.now() - reqStart);
        } catch (err) {
          failCount++;
        }
      };
      
      // Send requests at target rate
      const intervalId = setInterval(() => {
        if (Date.now() - startTime >= duration) {
          clearInterval(intervalId);
          return;
        }
        sendRequest();
        requestsSent++;
        
        // Progress update every 5 seconds
        if (requestsSent % (targetRPS * 5) === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          console.log(`  [${elapsed.toFixed(0)}s] Sent: ${requestsSent}, Success: ${successCount}, Failed: ${failCount}`);
        }
      }, interval);
      
      // Wait for test to complete
      await new Promise(resolve => setTimeout(resolve, duration + 2000));
      
      const actualDuration = Date.now() - startTime;
      const actualRPS = requestsSent / (actualDuration / 1000);
      
      // Calculate statistics
      latencies.sort((a, b) => a - b);
      const avgLatency = latencies.length > 0 ? 
        latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
      
      console.log('\n📊 Sustained Load Results:');
      console.log(`  Total requests: ${requestsSent}`);
      console.log(`  Successful: ${successCount} (${(successCount/requestsSent*100).toFixed(1)}%)`);
      console.log(`  Failed: ${failCount}`);
      console.log(`  Actual RPS: ${actualRPS.toFixed(1)}`);
      console.log(`  Avg latency: ${avgLatency.toFixed(0)}ms`);
      console.log(`  P95 latency: ${p95}ms`);
      
      // Check endpoint health
      const distribution = this.pool.getLoadDistribution();
      console.log('\n  Endpoint distribution:');
      for (const url in distribution) {
        const hostname = new URL(url).hostname;
        console.log(`    ${hostname}: ${distribution[url].percentage}`);
      }
      
      // Success criteria: maintain 80%+ success rate
      this.tests.sustainedLoad = (successCount / requestsSent) >= 0.8;
      console.log(`\n✅ Sustained load test: ${this.tests.sustainedLoad ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Sustained load test FAILED:', error.message);
      this.tests.sustainedLoad = false;
    }
  }

  async testEndpointFailure() {
    console.log('💔 Test 3: Endpoint Failure Recovery');
    console.log('─'.repeat(50));
    
    try {
      // Simulate endpoint failures
      console.log('  Simulating endpoint failures...');
      
      // Save original states for all endpoints
      const originalStates = this.pool.endpoints.map(ep => ({
        breakerState: ep.breaker.state,
        breakerFailures: ep.breaker.failures,
        breakerOpenedAt: ep.breaker.openedAt,
        healthHealthy: ep.health.healthy,
        healthLastCheck: ep.health.lastCheck
      }));
      
      // Mark first endpoint as having circuit breaker open (but not health.healthy = false)
      // This simulates network issues without completely disabling the endpoint
      if (this.pool.endpoints.length > 1) {
        this.pool.endpoints[0].breaker.state = 'OPEN';
        this.pool.endpoints[0].breaker.openedAt = Date.now();
        this.pool.endpoints[0].breaker.failures = 10;
        console.log(`  Endpoint 0 circuit breaker OPENED`);
      }
      
      // Send requests and verify failover
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(this.pool.call('getSlot').catch(() => null));
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r !== null).length;
      
      console.log(`  Sent 100 requests with 1 endpoint circuit open`);
      console.log(`  Successful: ${successful}/100`);
      
      // Now open circuit breaker on second endpoint (but keep at least one working)
      if (this.pool.endpoints.length > 2) {
        this.pool.endpoints[1].breaker.state = 'OPEN';
        this.pool.endpoints[1].breaker.openedAt = Date.now();
        this.pool.endpoints[1].breaker.failures = 10;
        console.log(`\n  Endpoint 1 circuit breaker OPENED`);
        console.log('  Only 1 endpoint remaining with closed breaker...');
      }
      
      // Send more requests with only one endpoint having closed breaker
      const promises2 = [];
      for (let i = 0; i < 50; i++) {
        promises2.push(this.pool.call('getSlot').catch(() => null));
      }
      
      const results2 = await Promise.all(promises2);
      const successful2 = results2.filter(r => r !== null).length;
      
      console.log(`  Sent 50 requests with 2 circuit breakers open`);
      console.log(`  Successful: ${successful2}/50`);
      
      // Restore original states for all endpoints
      this.pool.endpoints.forEach((ep, i) => {
        if (originalStates[i]) {
          ep.breaker.state = originalStates[i].breakerState;
          ep.breaker.failures = originalStates[i].breakerFailures;
          ep.breaker.openedAt = originalStates[i].breakerOpenedAt;
          ep.health.healthy = originalStates[i].healthHealthy;
          ep.health.lastCheck = originalStates[i].healthLastCheck;
          ep.breaker.consecutiveSuccesses = 0;
        }
      });
      
      console.log('\n  Endpoints recovered to healthy state');
      
      // Small delay to ensure state propagation
      await new Promise(r => setTimeout(r, 100));
      
      // Test recovery
      const promises3 = [];
      for (let i = 0; i < 50; i++) {
        promises3.push(this.pool.call('getSlot').catch(() => null));
      }
      
      const results3 = await Promise.all(promises3);
      const successful3 = results3.filter(r => r !== null).length;
      
      console.log(`  Sent 50 requests after recovery`);
      console.log(`  Successful: ${successful3}/50`);
      
      // Success criteria: maintain service even with failures
      // With 1 endpoint down: should have >50% success
      // With 2 endpoints down: should have some success (if 1 remains)
      // After recovery: should have >80% success
      const criteria1 = successful > 50; // >50% with 1 down
      const criteria2 = this.pool.endpoints.length > 2 ? successful2 > 0 : true; // some success if endpoint remains
      const criteria3 = successful3 > 40; // >80% after recovery
      this.tests.endpointFailure = criteria1 && criteria2 && criteria3;
      console.log(`\n✅ Endpoint failure test: ${this.tests.endpointFailure ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Endpoint failure test FAILED:', error.message);
      this.tests.endpointFailure = false;
    }
  }

  async testMixedErrors() {
    console.log('🌀 Test 4: Mixed Error Conditions');
    console.log('─'.repeat(50));
    
    try {
      console.log('  Simulating mixed error conditions...');
      
      // Setup: Create various error conditions
      const endpoint0 = this.pool.endpoints[0];
      const endpoint1 = this.pool.endpoints[1];
      const endpoint2 = this.pool.endpoints[2];
      
      // Endpoint 0: Rate limited
      endpoint0.rateLimiter.tokens = 0;
      console.log('  Endpoint 0: Rate limited');
      
      // Endpoint 1: High latency
      endpoint1.health.latency = 500;
      console.log('  Endpoint 1: High latency (500ms)');
      
      // Endpoint 2: Intermittent failures
      let failureCount = 0;
      const originalCall = endpoint2.call;
      endpoint2.call = function(...args) {
        failureCount++;
        if (failureCount % 3 === 0) {
          return Promise.reject(new Error('Simulated failure'));
        }
        return originalCall.apply(this, args);
      };
      console.log('  Endpoint 2: 33% failure rate');
      
      // Send mixed load
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 200; i++) {
        promises.push(
          this.pool.call('getSlot')
            .then(() => true)
            .catch(() => false)
        );
        
        // Add some delay to spread requests
        if (i % 10 === 0) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      const successful = results.filter(r => r).length;
      
      console.log('\n📊 Mixed Error Results:');
      console.log(`  Total requests: 200`);
      console.log(`  Successful: ${successful} (${(successful/2).toFixed(1)}%)`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Throughput: ${(200 / (duration / 1000)).toFixed(1)} req/s`);
      
      // Check how system adapted
      const stats = this.pool.getStats();
      console.log('\n  System adaptation:');
      console.log(`    Circuit breakers opened: ${this.pool.endpoints.filter(ep => ep.breaker.state === 'OPEN').length}`);
      console.log(`    Rate limit backoffs: ${this.pool.endpoints.filter(ep => ep.rateLimitBackoff && ep.rateLimitBackoff.until > Date.now()).length}`);
      
      // Restore endpoint 2
      endpoint2.call = originalCall;
      
      // Success criteria: handle at least 60% despite mixed errors
      this.tests.mixedErrors = successful >= 120;
      console.log(`\n✅ Mixed errors test: ${this.tests.mixedErrors ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Mixed errors test FAILED:', error.message);
      this.tests.mixedErrors = false;
    }
  }

  async testQueueStress() {
    console.log('📦 Test 5: Queue Stress Test');
    console.log('─'.repeat(50));
    
    try {
      // Saturate all endpoints to force queueing
      for (const endpoint of this.pool.endpoints) {
        endpoint.stats.inFlight = endpoint.config.maxConcurrent - 1;
      }
      
      console.log('  Endpoints nearly saturated, flooding with requests...');
      
      const promises = [];
      const queueMetrics = {
        maxLength: 0,
        dropped: 0,
        processed: 0
      };
      
      // Send 500 requests rapidly
      for (let i = 0; i < 500; i++) {
        promises.push(
          this.pool.call('getSlot')
            .then(() => {
              queueMetrics.processed++;
              return true;
            })
            .catch(err => {
              if (err.message.includes('Queue full')) {
                queueMetrics.dropped++;
              }
              return false;
            })
        );
        
        // Track max queue length
        if (this.pool.requestQueue.length > queueMetrics.maxLength) {
          queueMetrics.maxLength = this.pool.requestQueue.length;
        }
      }
      
      console.log(`  Max queue length reached: ${queueMetrics.maxLength}`);
      
      // Gradually free up endpoints
      setTimeout(() => {
        for (const endpoint of this.pool.endpoints) {
          endpoint.stats.inFlight = 0;
        }
        this.pool.processQueue();
      }, 1000);
      
      // Wait for all requests
      const results = await Promise.all(promises);
      const successful = results.filter(r => r).length;
      
      console.log('\n📊 Queue Stress Results:');
      console.log(`  Total requests: 500`);
      console.log(`  Processed: ${queueMetrics.processed}`);
      console.log(`  Dropped: ${queueMetrics.dropped}`);
      console.log(`  Max queue depth: ${queueMetrics.maxLength}`);
      console.log(`  Success rate: ${(successful/500*100).toFixed(1)}%`);
      
      // Success criteria: process at least 80% without crashes
      this.tests.queueStress = successful >= 400;
      console.log(`\n✅ Queue stress test: ${this.tests.queueStress ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Queue stress test FAILED:', error.message);
      this.tests.queueStress = false;
    }
  }

  async runAllTests() {
    const startTime = Date.now();
    
    await this.initialize();
    
    await this.testBurstLoad();
    await this.testSustainedLoad();
    await this.testEndpointFailure();
    await this.testMixedErrors();
    await this.testQueueStress();
    
    const duration = Date.now() - startTime;
    
    // Summary
    console.log('=' .repeat(60));
    console.log('📋 STRESS TEST SUMMARY');
    console.log('=' .repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    for (const [test, result] of Object.entries(this.tests)) {
      const status = result ? '✅' : '❌';
      console.log(`  ${status} ${test}`);
      if (result) passed++;
      else failed++;
    }
    
    // Final statistics
    const finalStats = this.pool.getStats();
    console.log('\n📊 Final Pool Statistics:');
    console.log(`  Total calls: ${finalStats.global.calls}`);
    console.log(`  Success rate: ${finalStats.global.successRate}`);
    console.log(`  Average latency: ${finalStats.global.avgLatency}ms`);
    console.log(`  P95 latency: ${finalStats.global.p95Latency}ms`);
    
    console.log('\n📊 Test Results:');
    console.log(`  Passed: ${passed}/${Object.keys(this.tests).length}`);
    console.log(`  Failed: ${failed}/${Object.keys(this.tests).length}`);
    console.log(`  Duration: ${(duration/1000).toFixed(1)} seconds`);
    
    const allPassed = Object.values(this.tests).every(v => v);
    console.log(`\n🎯 OVERALL: ${allPassed ? '✅ ALL STRESS TESTS PASSED' : '❌ SOME STRESS TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n✨ RPC Connection Pool handles stress conditions excellently!');
      console.log('   - Burst load handling: ✅');
      console.log('   - Sustained throughput: ✅');
      console.log('   - Failure recovery: ✅');
      console.log('   - Mixed error resilience: ✅');
      console.log('   - Queue management: ✅');
    }
    
    // Cleanup
    if (this.pool) {
      await this.pool.destroy();
    }
    
    process.exit(allPassed ? 0 : 1);
  }
}

// Run tests
const tester = new StressTester();
tester.runAllTests().catch(console.error);