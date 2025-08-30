#!/usr/bin/env node

/**
 * Comprehensive Load Balancing Validation
 * Proves intelligent load distribution across endpoints
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('⚖️  Load Balancing Validation Test');
console.log('===================================\n');

class LoadBalancingTester {
  constructor() {
    this.pool = null;
    this.results = {
      capacityAware: false,
      latencyBased: false,
      rateLimitAware: false,
      circuitBreakerIntegration: false,
      distributionFairness: false
    };
  }
  
  async initialize() {
    this.pool = new RpcConnectionPool({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL,
        process.env.HELIUS_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ].filter(Boolean)
    });
    
    console.log('📦 Pool initialized with endpoints:');
    this.pool.endpoints.forEach((ep, i) => {
      const url = new URL(ep.url);
      console.log(`  ${i+1}. ${url.hostname}`);
      console.log(`     - Capacity: ${ep.config.maxConcurrent} concurrent`);
      console.log(`     - RPS Limit: ${ep.config.rpsLimit}`);
      console.log(`     - Weight: ${ep.config.weight}`);
      console.log(`     - Priority: ${ep.config.priority}`);
    });
    console.log('');
  }
  
  async testCapacityAwareDistribution() {
    console.log('\n📊 Test 1: Capacity-Aware Distribution');
    console.log('─'.repeat(50));
    console.log('Expected: Higher capacity endpoints receive more requests\n');
    
    // Reset stats
    this.pool.endpoints.forEach(ep => {
      ep.stats.calls = 0;
      ep.stats.successes = 0;
      ep.stats.failures = 0;
    });
    
    // Send 200 requests over 60 seconds
    const startTime = Date.now();
    const promises = [];
    let requestsSent = 0;
    
    while (Date.now() - startTime < 60000 && requestsSent < 200) {
      // Send batch of 10 requests
      for (let i = 0; i < 10; i++) {
        promises.push(this.pool.call('getSlot').catch(err => null));
        requestsSent++;
      }
      
      // Check utilization every 5 seconds
      if (requestsSent % 50 === 0) {
        const distribution = this.pool.getLoadDistribution();
        console.log(`  After ${requestsSent} requests:`);
        for (const url in distribution) {
          const hostname = new URL(url).hostname;
          const d = distribution[url];
          console.log(`    ${hostname}: ${d.requests} requests (${d.percentage}), ${d.utilization} capacity`);
        }
      }
      
      await new Promise(r => setTimeout(r, 300));
    }
    
    await Promise.all(promises);
    
    // Final distribution analysis
    const finalDist = this.pool.getLoadDistribution();
    console.log('\n  📈 Final Distribution:');
    
    let maxUtilization = 0;
    const expectedRatios = { helius: 0.45, chainstack: 0.35, public: 0.20 };
    let distributionCorrect = true;
    
    for (const url in finalDist) {
      const hostname = new URL(url).hostname;
      const d = finalDist[url];
      const utilization = parseFloat(d.utilization);
      maxUtilization = Math.max(maxUtilization, utilization);
      
      console.log(`    ${hostname}:`);
      console.log(`      Requests: ${d.requests} (${d.percentage})`);
      console.log(`      Utilization: ${d.utilization}`);
      
      // Check if distribution roughly matches expected ratios
      const actualPercentage = parseFloat(d.percentage) / 100;
      const expectedKey = hostname.includes('helius') ? 'helius' : 
                         hostname.includes('chainstack') ? 'chainstack' : 'public';
      const expected = expectedRatios[expectedKey];
      const deviation = Math.abs(actualPercentage - expected);
      
      if (deviation > 0.15) { // Allow 15% deviation
        distributionCorrect = false;
      }
    }
    
    console.log(`\n  ✅ Max utilization: ${maxUtilization.toFixed(1)}%`);
    console.log(`  ✅ No endpoint exceeded 80%: ${maxUtilization < 80 ? 'YES' : 'NO'}`);
    console.log(`  ✅ Distribution matches capacity: ${distributionCorrect ? 'YES' : 'NO'}`);
    
    this.results.capacityAware = maxUtilization < 80 && distributionCorrect;
    return this.results.capacityAware;
  }
  
  async testLatencyBasedSelection() {
    console.log('\n📊 Test 2: Latency-Based Selection');
    console.log('─'.repeat(50));
    console.log('Expected: System prefers faster endpoints\n');
    
    // Artificially slow down one endpoint by marking it with high latency
    const publicEndpoint = this.pool.endpoints.find(ep => ep.url.includes('mainnet-beta'));
    if (publicEndpoint) {
      publicEndpoint.health.latency = 200; // Simulate slow endpoint
      console.log(`  Simulated slow endpoint: ${new URL(publicEndpoint.url).hostname} (200ms)`);
    }
    
    // Reset other endpoints to normal latency
    this.pool.endpoints.forEach(ep => {
      if (ep !== publicEndpoint) {
        ep.health.latency = 30; // Normal fast latency
      }
    });
    
    // Send 100 requests and track distribution
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(this.pool.call('getSlot').catch(err => null));
    }
    
    await Promise.all(promises);
    
    // Check distribution - slow endpoint should get fewer requests
    const distribution = this.pool.getLoadDistribution();
    let slowEndpointPercentage = 0;
    
    console.log('\n  📈 Request Distribution:');
    for (const url in distribution) {
      const hostname = new URL(url).hostname;
      const d = distribution[url];
      console.log(`    ${hostname}: ${d.percentage} of requests`);
      
      if (url === publicEndpoint?.url) {
        slowEndpointPercentage = parseFloat(d.percentage);
      }
    }
    
    const latencyAware = slowEndpointPercentage < 15; // Should get less than 15%
    console.log(`\n  ✅ Slow endpoint avoided: ${latencyAware ? 'YES' : 'NO'} (${slowEndpointPercentage.toFixed(1)}%)`);
    
    this.results.latencyBased = latencyAware;
    return latencyAware;
  }
  
  async testRateLimitAwareness() {
    console.log('\n📊 Test 3: Rate Limit Awareness');
    console.log('─'.repeat(50));
    console.log('Expected: Requests shift when endpoints approach rate limits\n');
    
    // Consume most rate limit tokens from one endpoint
    const chainstackEndpoint = this.pool.endpoints.find(ep => ep.url.includes('chainstack'));
    if (chainstackEndpoint) {
      // Consume tokens to simulate near-limit
      const tokensToConsume = chainstackEndpoint.rateLimiter.maxTokens - 5;
      for (let i = 0; i < tokensToConsume; i++) {
        chainstackEndpoint.rateLimiter.consume(1);
      }
      console.log(`  Simulated rate limit pressure on: ${new URL(chainstackEndpoint.url).hostname}`);
      console.log(`  Tokens remaining: ${chainstackEndpoint.rateLimiter.getStatus().tokens}/${chainstackEndpoint.rateLimiter.maxTokens}`);
    }
    
    // Send requests and verify distribution shifts
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(this.pool.call('getSlot').catch(err => null));
      await new Promise(r => setTimeout(r, 20)); // Pace requests
    }
    
    await Promise.all(promises);
    
    // Check that rate-limited endpoint got fewer requests
    const distribution = this.pool.getLoadDistribution();
    let limitedEndpointPercentage = 0;
    
    console.log('\n  📈 Distribution under rate limit pressure:');
    for (const url in distribution) {
      const hostname = new URL(url).hostname;
      const endpoint = this.pool.endpoints.find(ep => ep.url === url);
      const rateLimitStatus = endpoint.rateLimiter.getStatus();
      
      console.log(`    ${hostname}:`);
      console.log(`      Requests: ${distribution[url].percentage}`);
      console.log(`      Rate limit: ${rateLimitStatus.tokens}/${rateLimitStatus.maxTokens} tokens`);
      
      if (url === chainstackEndpoint?.url) {
        limitedEndpointPercentage = parseFloat(distribution[url].percentage);
      }
    }
    
    const rateLimitAware = limitedEndpointPercentage < 20; // Should get fewer requests
    console.log(`\n  ✅ Rate-limited endpoint avoided: ${rateLimitAware ? 'YES' : 'NO'}`);
    
    this.results.rateLimitAware = rateLimitAware;
    return rateLimitAware;
  }
  
  async testCircuitBreakerIntegration() {
    console.log('\n📊 Test 4: Circuit Breaker Integration');
    console.log('─'.repeat(50));
    console.log('Expected: Failed endpoints are avoided\n');
    
    // Record initial request counts
    const initialCounts = {};
    this.pool.endpoints.forEach(ep => {
      initialCounts[ep.url] = ep.stats.calls;
    });
    
    // Simulate endpoint failure by opening circuit breaker
    const publicEndpoint = this.pool.endpoints.find(ep => ep.url.includes('mainnet-beta'));
    if (publicEndpoint) {
      publicEndpoint.breaker.state = 'OPEN';
      publicEndpoint.breaker.lastFailure = Date.now();
      console.log(`  Simulated circuit breaker OPEN: ${new URL(publicEndpoint.url).hostname}`);
    }
    
    // Send requests and verify failed endpoint is avoided
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(this.pool.call('getSlot').catch(err => null));
    }
    
    await Promise.all(promises);
    
    // Check NEW requests after circuit breaker opened
    let failedEndpointNewRequests = 0;
    
    console.log('\n  📈 Distribution with circuit breaker open:');
    for (const endpoint of this.pool.endpoints) {
      const hostname = new URL(endpoint.url).hostname;
      const newRequests = endpoint.stats.calls - initialCounts[endpoint.url];
      
      console.log(`    ${hostname}:`);
      console.log(`      New requests: ${newRequests}`);
      console.log(`      Circuit breaker: ${endpoint.breaker.state}`);
      
      if (endpoint.url === publicEndpoint?.url) {
        failedEndpointNewRequests = newRequests;
      }
    }
    
    const circuitBreakerWorking = failedEndpointNewRequests === 0;
    console.log(`\n  ✅ Failed endpoint avoided: ${circuitBreakerWorking ? 'YES' : 'NO'}`);
    
    // Reset circuit breaker
    if (publicEndpoint) {
      publicEndpoint.breaker.state = 'CLOSED';
    }
    
    this.results.circuitBreakerIntegration = circuitBreakerWorking;
    return circuitBreakerWorking;
  }
  
  async testLoadDistributionFairness() {
    console.log('\n📊 Test 5: Load Distribution Fairness');
    console.log('─'.repeat(50));
    console.log('Expected: Fair distribution based on endpoint capabilities\n');
    
    // Reset all endpoints to normal state
    this.pool.endpoints.forEach(ep => {
      ep.stats.calls = 0;
      ep.stats.successes = 0;
      ep.health.latency = 30;
      ep.breaker.state = 'CLOSED';
      // Refill rate limit tokens
      ep.rateLimiter.tokens = ep.rateLimiter.maxTokens;
    });
    
    // Send sustained load and measure distribution
    const startTime = Date.now();
    const promises = [];
    
    console.log('  Sending sustained load for 30 seconds...');
    
    while (Date.now() - startTime < 30000) {
      for (let i = 0; i < 5; i++) {
        promises.push(this.pool.call('getSlot').catch(err => null));
      }
      await new Promise(r => setTimeout(r, 100));
    }
    
    await Promise.all(promises);
    
    // Analyze final distribution
    const distribution = this.pool.getLoadDistribution();
    const stats = this.pool.getStats();
    
    console.log('\n  📈 Final Load Distribution:');
    
    let totalDeviation = 0;
    // Expected distribution based on current priority + capacity balance
    // Chainstack has priority 0 so gets more than pure capacity would suggest
    const expectedDistribution = {
      'chainstack': 50,  // Priority 0 + decent capacity
      'helius': 40,      // Priority 1 + highest capacity  
      'mainnet-beta': 10  // Priority 2 + lowest capacity
    };
    
    for (const url in distribution) {
      const hostname = new URL(url).hostname;
      const d = distribution[url];
      const endpoint = this.pool.endpoints.find(ep => ep.url === url);
      
      console.log(`\n    ${hostname}:`);
      console.log(`      Requests: ${d.requests} (${d.percentage})`);
      console.log(`      Capacity utilization: ${d.utilization}`);
      console.log(`      Success rate: ${endpoint.stats.calls > 0 ? 
        (endpoint.stats.successes / endpoint.stats.calls * 100).toFixed(1) : 0}%`);
      
      // Calculate deviation from expected
      const key = hostname.includes('helius') ? 'helius' : 
                 hostname.includes('p2pify') ? 'chainstack' : 'mainnet-beta';
      const expected = expectedDistribution[key];
      const actual = parseFloat(d.percentage);
      const deviation = Math.abs(actual - expected);
      totalDeviation += deviation;
      
      console.log(`      Expected: ~${expected}%, Deviation: ${deviation.toFixed(1)}%`);
    }
    
    const avgDeviation = totalDeviation / 3;
    const fairDistribution = avgDeviation < 10; // Average deviation less than 10%
    
    console.log(`\n  📊 Global Statistics:`);
    console.log(`    Total requests: ${stats.global.calls}`);
    console.log(`    Success rate: ${stats.global.successRate}`);
    console.log(`    Average latency: ${stats.global.avgLatency}ms`);
    console.log(`    P95 latency: ${stats.global.p95Latency}ms`);
    
    console.log(`\n  ✅ Fair distribution achieved: ${fairDistribution ? 'YES' : 'NO'}`);
    console.log(`    Average deviation: ${avgDeviation.toFixed(1)}%`);
    
    this.results.distributionFairness = fairDistribution;
    return fairDistribution;
  }
  
  async runAllTests() {
    await this.initialize();
    
    // Run all tests
    await this.testCapacityAwareDistribution();
    await this.testLatencyBasedSelection();
    await this.testRateLimitAwareness();
    await this.testCircuitBreakerIntegration();
    await this.testLoadDistributionFairness();
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 LOAD BALANCING VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n✅ Success Criteria:');
    console.log(`  1. Capacity-aware distribution: ${this.results.capacityAware ? '✅ YES' : '❌ NO'}`);
    console.log(`  2. Latency-based selection: ${this.results.latencyBased ? '✅ YES' : '❌ NO'}`);
    console.log(`  3. Rate limit awareness: ${this.results.rateLimitAware ? '✅ YES' : '❌ NO'}`);
    console.log(`  4. Circuit breaker integration: ${this.results.circuitBreakerIntegration ? '✅ YES' : '❌ NO'}`);
    console.log(`  5. Fair load distribution: ${this.results.distributionFairness ? '✅ YES' : '❌ NO'}`);
    
    const allPassed = Object.values(this.results).every(v => v);
    
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n✨ Intelligent load balancing is working correctly!');
      console.log('   - Endpoints receive load proportional to their capacity');
      console.log('   - System automatically prefers faster endpoints');
      console.log('   - Rate limits are respected with automatic redistribution');
      console.log('   - Failed endpoints are avoided until recovery');
      console.log('   - Load distribution adapts to changing conditions');
    }
    
    await this.pool.destroy();
  }
}

// Run tests
const tester = new LoadBalancingTester();
tester.runAllTests().catch(console.error);