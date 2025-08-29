#!/usr/bin/env node

/**
 * RPC Connection Pool V2 Stress Test
 * Accurate performance measurement for meme coin trading scenarios
 */

import RpcConnectionPoolV2 from '../src/detection/transport/rpc-connection-pool-v2.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 RPC Connection Pool V2 Stress Test');
console.log('=====================================\n');

class StressTest {
  constructor() {
    this.pool = null;
    this.results = {
      phases: [],
      memory: [],
      errors: []
    };
  }
  
  async initialize() {
    console.log('📦 Initializing RPC Connection Pool V2...');
    
    this.pool = new RpcConnectionPoolV2({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL,
        process.env.HELIUS_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ].filter(Boolean)
    });
    
    // Listen for events
    this.pool.on('high-latency', (data) => {
      console.log(`⚠️  High latency detected: Endpoint ${data.endpoint} - ${data.latency}ms`);
    });
    
    this.pool.on('breaker-open', (endpoint) => {
      console.log(`🔴 Circuit breaker opened for endpoint ${endpoint}`);
    });
    
    this.pool.on('breaker-closed', (endpoint) => {
      console.log(`🟢 Circuit breaker closed for endpoint ${endpoint}`);
    });
    
    console.log('✅ Pool initialized with endpoints:');
    this.pool.endpoints.forEach((ep, i) => {
      const url = new URL(ep.url);
      console.log(`   ${i + 1}. ${url.hostname} (RPS: ${ep.config.rpsLimit}, Weight: ${ep.config.weight})`);
    });
    console.log('');
  }
  
  async runPhase(name, concurrency, duration, burstSize = 0) {
    console.log(`\n📊 Phase: ${name}`);
    console.log('─'.repeat(50));
    console.log(`Concurrency: ${concurrency}, Duration: ${duration}s${burstSize ? `, Burst: ${burstSize}` : ''}`);
    
    const phase = {
      name,
      concurrency,
      duration,
      requests: [],
      startTime: Date.now(),
      endTime: 0
    };
    
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    let activeRequests = 0;
    let completedRequests = 0;
    let failedRequests = 0;
    
    // Execute requests
    const endTime = Date.now() + (duration * 1000);
    const requests = [];
    
    // Initial burst if specified
    if (burstSize > 0) {
      console.log(`🚀 Sending burst of ${burstSize} requests...`);
      for (let i = 0; i < burstSize; i++) {
        requests.push(this.executeRequest(phase));
      }
      activeRequests += burstSize;
    }
    
    // Continuous load
    const interval = setInterval(() => {
      if (Date.now() > endTime) {
        clearInterval(interval);
        return;
      }
      
      // Maintain concurrent requests
      while (activeRequests < concurrency && Date.now() < endTime) {
        requests.push(this.executeRequest(phase));
        activeRequests++;
      }
    }, 10);
    
    // Helper to track request completion
    const executeRequestWrapper = async (request) => {
      try {
        await request;
        completedRequests++;
      } catch (error) {
        failedRequests++;
      } finally {
        activeRequests--;
      }
    };
    
    // Track all requests
    const trackedRequests = requests.map(request => executeRequestWrapper(request));
    
    // Wait for duration
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    clearInterval(interval);
    
    // Wait for remaining requests (max 5 seconds)
    const cleanupStart = Date.now();
    while (activeRequests > 0 && Date.now() - cleanupStart < 5000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    phase.endTime = Date.now();
    
    // Calculate statistics
    const latencies = phase.requests
      .filter(r => r.success)
      .map(r => r.latency)
      .sort((a, b) => a - b);
    
    const successful = phase.requests.filter(r => r.success).length;
    const failed = phase.requests.filter(r => !r.success).length;
    
    phase.stats = {
      total: phase.requests.length,
      successful,
      failed,
      successRate: phase.requests.length > 0 ? (successful / phase.requests.length * 100).toFixed(2) : 0,
      avgLatency: latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : 0,
      minLatency: latencies[0] || 0,
      maxLatency: latencies[latencies.length - 1] || 0,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] || 0,
      throughput: ((phase.endTime - phase.startTime) / 1000) > 0 
        ? (phase.requests.length / ((phase.endTime - phase.startTime) / 1000)).toFixed(2)
        : 0,
      memoryDelta: (process.memoryUsage().heapUsed / 1024 / 1024) - startMemory
    };
    
    this.results.phases.push(phase);
    
    // Print results
    console.log(`\n📈 Results:`);
    console.log(`   Total Requests: ${phase.stats.total}`);
    console.log(`   Success Rate: ${phase.stats.successRate}% (${successful}/${phase.stats.total})`);
    console.log(`   Throughput: ${phase.stats.throughput} req/s`);
    console.log(`\n⏱️  Latency:`);
    console.log(`   Min: ${phase.stats.minLatency}ms`);
    console.log(`   Avg: ${phase.stats.avgLatency}ms`);
    console.log(`   P50: ${phase.stats.p50Latency}ms`);
    console.log(`   P95: ${phase.stats.p95Latency}ms ${phase.stats.p95Latency < 30 ? '✅' : '❌'}`);
    console.log(`   P99: ${phase.stats.p99Latency}ms`);
    console.log(`   Max: ${phase.stats.maxLatency}ms`);
    console.log(`\n💾 Memory Delta: ${phase.stats.memoryDelta.toFixed(2)} MB`);
    
    // Get pool statistics
    const poolStats = this.pool.getStats();
    console.log(`\n🔄 Pool Statistics:`);
    console.log(`   Global:`);
    console.log(`     Success Rate: ${poolStats.global.successRate}`);
    console.log(`     In Flight: ${poolStats.global.inFlight}`);
    console.log(`     Queue Length: ${poolStats.global.queueLength}`);
    console.log(`     Dropped: ${poolStats.global.dropped}`);
    
    console.log(`\n   Per Endpoint:`);
    poolStats.endpoints.forEach((ep, i) => {
      const url = new URL(ep.url);
      console.log(`     ${i + 1}. ${url.hostname}:`);
      console.log(`        Success Rate: ${ep.successRate}`);
      console.log(`        Avg Latency: ${ep.avgLatency}ms`);
      console.log(`        Circuit: ${ep.breaker}`);
      console.log(`        Rate Limit: ${ep.rateLimit}`);
      console.log(`        Health: ${ep.health}`);
    });
    
    return phase.stats;
  }
  
  async executeRequest(phase) {
    const startTime = Date.now();
    
    try {
      const result = await this.pool.call('getSlot');
      const latency = Date.now() - startTime;
      
      const request = {
        success: true,
        latency,
        timestamp: Date.now(),
        result
      };
      
      phase.requests.push(request);
      return request;
      
    } catch (error) {
      const request = {
        success: false,
        latency: Date.now() - startTime,
        timestamp: Date.now(),
        error: error.message
      };
      
      phase.requests.push(request);
      this.results.errors.push({
        phase: phase.name,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  async runMemoryTest(duration) {
    console.log(`\n📊 Phase: Memory Stability Test`);
    console.log('─'.repeat(50));
    console.log(`Duration: ${duration} minutes`);
    
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const endTime = Date.now() + (duration * 60 * 1000);
    let iteration = 0;
    
    while (Date.now() < endTime) {
      // Sustained moderate load
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          this.pool.call('getSlot').catch(() => {})
        );
      }
      
      await Promise.all(promises);
      
      // Check memory every 30 seconds
      if (++iteration % 30 === 0) {
        const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const delta = currentMemory - startMemory;
        const rate = delta / (iteration / 60); // MB per minute
        
        this.results.memory.push({
          timestamp: Date.now(),
          memory: currentMemory,
          delta,
          rate
        });
        
        console.log(`   Memory: ${currentMemory.toFixed(2)} MB (Δ ${delta.toFixed(2)} MB, Rate: ${rate.toFixed(2)} MB/min)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalDelta = finalMemory - startMemory;
    const rate = totalDelta / duration;
    
    console.log(`\n📈 Memory Test Results:`);
    console.log(`   Initial: ${startMemory.toFixed(2)} MB`);
    console.log(`   Final: ${finalMemory.toFixed(2)} MB`);
    console.log(`   Total Delta: ${totalDelta.toFixed(2)} MB`);
    console.log(`   Growth Rate: ${rate.toFixed(2)} MB/min ${rate < 2 ? '✅' : '❌'}`);
    
    return rate;
  }
  
  async runFullTest() {
    try {
      await this.initialize();
      
      console.log('\n' + '='.repeat(50));
      console.log('🏁 STARTING STRESS TEST PHASES');
      console.log('='.repeat(50));
      
      // Phase 1: Normal Trading (baseline)
      await this.runPhase('Normal Trading', 5, 10);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Phase 2: Moderate Load
      await this.runPhase('Moderate Load', 20, 10);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Phase 3: High Load
      await this.runPhase('High Load', 50, 10);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Phase 4: Viral Event Simulation (burst + sustained)
      await this.runPhase('Viral Event', 100, 10, 200);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Phase 5: Memory stability
      const memoryRate = await this.runMemoryTest(2);
      
      // Final summary
      console.log('\n' + '='.repeat(50));
      console.log('📊 FINAL TEST SUMMARY');
      console.log('='.repeat(50));
      
      const targetsMet = {
        p95Latency: false,
        successRate: false,
        memoryStability: memoryRate < 2,
        viralEvent: false
      };
      
      // Check each phase
      for (const phase of this.results.phases) {
        console.log(`\n${phase.name}:`);
        console.log(`  Success Rate: ${phase.stats.successRate}% ${phase.stats.successRate > 99.5 ? '✅' : '❌'}`);
        console.log(`  P95 Latency: ${phase.stats.p95Latency}ms ${phase.stats.p95Latency < 30 ? '✅' : '❌'}`);
        console.log(`  Throughput: ${phase.stats.throughput} req/s`);
        
        if (phase.stats.p95Latency < 30) targetsMet.p95Latency = true;
        if (phase.stats.successRate > 99.5) targetsMet.successRate = true;
        if (phase.name === 'Viral Event' && phase.stats.successRate > 99.5) {
          targetsMet.viralEvent = true;
        }
      }
      
      console.log('\n📋 Performance Targets:');
      console.log(`  P95 < 30ms: ${targetsMet.p95Latency ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`  Success Rate > 99.5%: ${targetsMet.successRate ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`  Memory Growth < 2MB/min: ${targetsMet.memoryStability ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`  Viral Event Handling: ${targetsMet.viralEvent ? '✅ PASSED' : '❌ FAILED'}`);
      
      const allPassed = Object.values(targetsMet).every(v => v);
      console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TARGETS MET' : '❌ TARGETS NOT MET'}`);
      
      // Cleanup
      await this.pool.destroy();
      console.log('\n✅ Test complete, pool destroyed');
      
      process.exit(allPassed ? 0 : 1);
      
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      if (this.pool) await this.pool.destroy();
      process.exit(1);
    }
  }
}

// Run test
const test = new StressTest();
test.runFullTest();