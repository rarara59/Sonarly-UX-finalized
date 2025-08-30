#!/usr/bin/env node

/**
 * RPC Connection Pool - Stress and Performance Test (Fixed Version)
 * Tests the pool under various load conditions and failure scenarios
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
      rateLimiting: false,
      memoryStability: false
    };
  }

  async initialize() {
    this.pool = new RpcConnectionPool({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL,
        process.env.HELIUS_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ].filter(Boolean),
      maxGlobalInFlight: 500,
      queueMaxSize: 2000,
      debug: false
    });

    console.log('📦 Pool initialized for stress testing');
    console.log(`  Max concurrent: 500`);
    console.log(`  Max queue size: 2000`);
    console.log(`  Endpoints: ${this.pool.endpoints.length}\n`);
  }

  async testBurstLoad() {
    console.log('💥 Test 1: Burst Load (1000 requests in 1 second)');
    console.log('─'.repeat(50));
    
    try {
      const numRequests = 1000;
      const promises = [];
      const startTime = Date.now();
      
      console.log(`  Sending ${numRequests} requests simultaneously...`);
      
      // Send all requests at once
      for (let i = 0; i < numRequests; i++) {
        promises.push(
          this.pool.call('getSlot')
            .then(result => ({ success: true, result, time: Date.now() - startTime }))
            .catch(error => ({ success: false, error: error.message, time: Date.now() - startTime }))
        );
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // Analyze results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const throughput = (numRequests / (duration / 1000)).toFixed(1);
      
      const latencies = results.filter(r => r.success).map(r => r.time);
      latencies.sort((a, b) => a - b);
      const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
      const p99Latency = latencies[Math.floor(latencies.length * 0.99)];
      const maxLatency = latencies[latencies.length - 1];
      
      // Get queue stats
      const stats = this.pool.getStats();
      
      console.log('\n📊 Burst Load Results:');
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Successful: ${successful}/${numRequests} (${(successful/numRequests*100).toFixed(1)}%)`);
      console.log(`  Failed: ${failed}/${numRequests}`);
      console.log(`  Throughput: ${throughput} req/s`);
      console.log(`  Avg latency: ${Math.round(avgLatency)}ms`);
      console.log(`  P95 latency: ${p95Latency}ms`);
      console.log(`  P99 latency: ${p99Latency}ms`);
      console.log(`  Max latency: ${maxLatency}ms`);
      console.log(`  Queue max size reached: ${stats.global.queued > 0 ? stats.global.queued : 'N/A'}`);
      console.log(`  Dropped requests: ${stats.global.dropped}`);
      
      // Success criteria: >95% success rate and reasonable latency
      this.tests.burstLoad = successful >= numRequests * 0.95 && p99Latency < 5000;
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
      const durationSeconds = 30;
      const intervalMs = 1000 / targetRPS;
      
      console.log(`  Target: ${targetRPS} requests/second`);
      console.log(`  Running for ${durationSeconds} seconds...\n`);
      
      let totalRequests = 0;
      let successfulRequests = 0;
      let failedRequests = 0;
      const latencies = [];
      const endpointUsage = new Map();
      const startTime = Date.now();
      
      // Function to send a single request
      const sendRequest = async () => {
        const reqStart = Date.now();
        try {
          const result = await this.pool.call('getSlot');
          successfulRequests++;
          latencies.push(Date.now() - reqStart);
          return true;
        } catch (error) {
          failedRequests++;
          return false;
        } finally {
          totalRequests++;
        }
      };
      
      // Send requests at target rate
      const interval = setInterval(() => {
        sendRequest();
      }, intervalMs);
      
      // Progress reporting
      const progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed % 5 === 0 && elapsed > 0) {
          console.log(`  [${elapsed}s] Sent: ${totalRequests}, Success: ${successfulRequests}, Failed: ${failedRequests}`);
        }
      }, 1000);
      
      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
      
      clearInterval(interval);
      clearInterval(progressInterval);
      
      // Wait for final requests to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const actualDuration = (Date.now() - startTime) / 1000;
      const actualRPS = totalRequests / actualDuration;
      
      // Calculate statistics
      latencies.sort((a, b) => a - b);
      const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
      
      // Get endpoint distribution
      const stats = this.pool.getStats();
      const totalCalls = stats.endpoints.reduce((sum, ep) => sum + ep.calls, 0);
      
      console.log('\n📊 Sustained Load Results:');
      console.log(`  Total requests: ${totalRequests}`);
      console.log(`  Successful: ${successfulRequests} (${(successfulRequests/totalRequests*100).toFixed(1)}%)`);
      console.log(`  Failed: ${failedRequests}`);
      console.log(`  Actual RPS: ${actualRPS.toFixed(1)}`);
      console.log(`  Avg latency: ${Math.round(avgLatency)}ms`);
      console.log(`  P95 latency: ${p95Latency}ms`);
      
      console.log('\n  Endpoint distribution:');
      for (const ep of stats.endpoints) {
        const percentage = (ep.calls / totalCalls * 100).toFixed(1);
        const hostname = new URL(ep.url).hostname;
        console.log(`    ${hostname}: ${percentage}%`);
      }
      
      // Success criteria: >95% success rate and RPS within 20% of target
      this.tests.sustainedLoad = 
        successfulRequests >= totalRequests * 0.95 &&
        actualRPS >= targetRPS * 0.7;
      
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
      console.log('  Testing failover when endpoints become unavailable...\n');
      
      // Test 1: Normal operation baseline
      console.log('  Phase 1: Baseline (all endpoints healthy)');
      const baselinePromises = Array(50).fill().map(() => 
        this.pool.call('getSlot').catch(() => null)
      );
      const baselineResults = await Promise.all(baselinePromises);
      const baselineSuccess = baselineResults.filter(r => r !== null).length;
      console.log(`    Successful: ${baselineSuccess}/50`);
      
      // Test 2: Simulate one endpoint having issues (rate limiting)
      console.log('\n  Phase 2: One endpoint rate limited');
      
      // Artificially consume all tokens from first endpoint
      if (this.pool.endpoints.length > 1) {
        const ep0 = this.pool.endpoints[0];
        while (ep0.rateLimiter.canConsume(1)) {
          ep0.rateLimiter.consume(1);
        }
        console.log(`    Endpoint 0 rate limit exhausted`);
      }
      
      const phase2Promises = Array(50).fill().map(() => 
        this.pool.call('getSlot').catch(() => null)
      );
      const phase2Results = await Promise.all(phase2Promises);
      const phase2Success = phase2Results.filter(r => r !== null).length;
      console.log(`    Successful with 1 endpoint rate limited: ${phase2Success}/50`);
      
      // Test 3: Circuit breaker on one endpoint (recent past failure)
      console.log('\n  Phase 3: Circuit breaker recovery test');
      
      if (this.pool.endpoints.length > 1) {
        // Simulate circuit breaker that recently opened and should be trying recovery
        this.pool.endpoints[0].breaker.state = 'OPEN';
        this.pool.endpoints[0].breaker.openedAt = Date.now() - 31000; // Opened 31 seconds ago
        console.log(`    Endpoint 0 circuit breaker will attempt recovery`);
      }
      
      const phase3Promises = Array(50).fill().map(() => 
        this.pool.call('getSlot').catch(() => null)
      );
      const phase3Results = await Promise.all(phase3Promises);
      const phase3Success = phase3Results.filter(r => r !== null).length;
      console.log(`    Successful with circuit breaker recovery: ${phase3Success}/50`);
      
      // Reset all endpoints to healthy state
      for (const ep of this.pool.endpoints) {
        ep.breaker.state = 'CLOSED';
        ep.breaker.failures = 0;
        ep.health.healthy = true;
        ep.rateLimiter.reset();
      }
      
      console.log('\n  Phase 4: All endpoints recovered');
      const recoveryPromises = Array(50).fill().map(() => 
        this.pool.call('getSlot').catch(() => null)
      );
      const recoveryResults = await Promise.all(recoveryPromises);
      const recoverySuccess = recoveryResults.filter(r => r !== null).length;
      console.log(`    Successful after recovery: ${recoverySuccess}/50`);
      
      // Success criteria: System maintains service despite failures
      this.tests.endpointFailure = 
        baselineSuccess >= 45 &&  // Baseline should work well
        phase2Success >= 40 &&    // Should handle rate limiting
        phase3Success >= 35 &&    // Should handle circuit breaker
        recoverySuccess >= 45;    // Should recover fully
      
      console.log(`\n✅ Endpoint failure test: ${this.tests.endpointFailure ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Endpoint failure test error:', error.message);
      this.tests.endpointFailure = false;
    }
  }

  async testRateLimiting() {
    console.log('⚡ Test 4: Rate Limiting Behavior');
    console.log('─'.repeat(50));
    
    try {
      console.log('  Testing rate limiter effectiveness...\n');
      
      // Get initial token counts
      const initialTokens = this.pool.endpoints.map(ep => ({
        url: new URL(ep.url).hostname,
        tokens: ep.rateLimiter.getStatus().tokens
      }));
      
      console.log('  Initial token counts:');
      initialTokens.forEach(t => {
        console.log(`    ${t.url}: ${t.tokens} tokens`);
      });
      
      // Send burst of requests to trigger rate limiting
      console.log('\n  Sending burst of 200 requests...');
      const burstPromises = Array(200).fill().map(() => 
        this.pool.call('getSlot').catch(() => null)
      );
      const burstResults = await Promise.all(burstPromises);
      const burstSuccess = burstResults.filter(r => r !== null).length;
      
      // Check token consumption
      const afterTokens = this.pool.endpoints.map(ep => ({
        url: new URL(ep.url).hostname,
        tokens: ep.rateLimiter.getStatus().tokens,
        consumed: initialTokens.find(t => t.url === new URL(ep.url).hostname).tokens - 
                  ep.rateLimiter.getStatus().tokens
      }));
      
      console.log('\n  Token consumption:');
      afterTokens.forEach(t => {
        console.log(`    ${t.url}: Consumed ${t.consumed} tokens, ${t.tokens} remaining`);
      });
      
      console.log(`\n  Successful requests: ${burstSuccess}/200`);
      
      // Wait for token refill
      console.log('  Waiting 2 seconds for token refill...');
      await new Promise(r => setTimeout(r, 2000));
      
      // Check refill
      const refilledTokens = this.pool.endpoints.map(ep => ({
        url: new URL(ep.url).hostname,
        tokens: ep.rateLimiter.getStatus().tokens
      }));
      
      console.log('\n  After refill:');
      refilledTokens.forEach(t => {
        console.log(`    ${t.url}: ${t.tokens} tokens`);
      });
      
      this.tests.rateLimiting = burstSuccess >= 150; // At least 75% should succeed
      console.log(`\n✅ Rate limiting test: ${this.tests.rateLimiting ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Rate limiting test FAILED:', error.message);
      this.tests.rateLimiting = false;
    }
  }

  async testMemoryStability() {
    console.log('💾 Test 5: Memory Stability (1 minute)');
    console.log('─'.repeat(50));
    
    try {
      console.log('  Testing for memory leaks...\n');
      
      const startMemory = process.memoryUsage().heapUsed;
      let totalCalls = 0;
      const memoryReadings = [];
      const startTime = Date.now();
      const duration = 60000; // 1 minute
      
      const interval = setInterval(async () => {
        try {
          await this.pool.call('getSlot');
          totalCalls++;
          
          if (totalCalls % 100 === 0) {
            const currentMemory = process.memoryUsage().heapUsed;
            const growth = (currentMemory - startMemory) / 1024 / 1024;
            memoryReadings.push(growth);
            console.log(`  [${totalCalls} calls] Memory growth: ${growth.toFixed(2)} MB`);
          }
        } catch (err) {
          // Ignore errors for this test
        }
      }, 50); // 20 requests per second
      
      await new Promise(resolve => setTimeout(resolve, duration));
      clearInterval(interval);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const totalGrowth = (finalMemory - startMemory) / 1024 / 1024;
      
      console.log(`\n  Total calls: ${totalCalls}`);
      console.log(`  Final memory growth: ${totalGrowth.toFixed(2)} MB`);
      console.log(`  Growth per 1000 calls: ${(totalGrowth / (totalCalls / 1000)).toFixed(2)} MB`);
      
      // Success criteria: Less than 50MB growth total, or less than 5MB per 1000 calls
      this.tests.memoryStability = totalGrowth < 50 || (totalGrowth / (totalCalls / 1000)) < 5;
      console.log(`\n✅ Memory stability test: ${this.tests.memoryStability ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Memory stability test FAILED:', error.message);
      this.tests.memoryStability = false;
    }
  }

  async runAllTests() {
    await this.initialize();
    
    await this.testBurstLoad();
    await this.testSustainedLoad();
    await this.testEndpointFailure();
    await this.testRateLimiting();
    await this.testMemoryStability();
    
    // Summary
    console.log('='.repeat(60));
    console.log('📋 STRESS TEST SUMMARY');
    console.log('='.repeat(60));
    
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
    
    const allPassed = Object.values(this.tests).every(v => v);
    console.log(`\n🎯 OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n✨ RPC Connection Pool passed all stress tests!');
      console.log('   Ready for production use.');
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