#!/usr/bin/env node

/**
 * Comprehensive Test Suite for EndpointSelector Component
 * Tests round-robin distribution, health filtering, failover, and weighted selection
 */

import { EndpointSelector } from '../../src/detection/transport/endpoint-selector.js';
import { performance } from 'perf_hooks';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  metric: (msg) => console.log(`${colors.magenta}📊 ${msg}${colors.reset}`)
};

// Mock endpoint class for testing
class MockEndpoint {
  constructor(id, config = {}) {
    this.id = id;
    this.url = config.url || `https://endpoint-${id}.example.com`;
    this.healthy = config.healthy !== false;
    this.weight = config.weight || 1;
    this.priority = config.priority || 0;
    this.latency = config.latency || 10;
    this.successRate = config.successRate || 1.0;
    this.requestCount = 0;
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      avgLatency: 0
    };
  }
  
  setHealth(healthy) {
    this.healthy = healthy;
  }
  
  async execute() {
    this.requestCount++;
    this.stats.requests++;
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, this.latency));
    
    // Simulate success/failure based on rate
    if (Math.random() < this.successRate) {
      this.stats.successes++;
      this.stats.totalLatency += this.latency;
      this.stats.avgLatency = this.stats.totalLatency / this.stats.successes;
      return { success: true, endpoint: this.id };
    } else {
      this.stats.failures++;
      throw new Error(`Endpoint ${this.id} failed`);
    }
  }
  
  reset() {
    this.requestCount = 0;
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      avgLatency: 0
    };
  }
  
  getStats() {
    return {
      ...this.stats,
      healthy: this.healthy,
      weight: this.weight,
      priority: this.priority
    };
  }
}

// Test utilities
class TestUtils {
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static measureTime(fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, duration: end - start };
  }
  
  static async measureAsyncTime(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  }
  
  static getMemoryUsageMB() {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  
  static calculateDistributionVariance(distribution, expectedPercentage) {
    const maxVariance = Math.max(...Object.values(distribution).map(val => 
      Math.abs(val - expectedPercentage)
    ));
    return maxVariance;
  }
}

// Main test suite
class EndpointSelectorTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
      metrics: {}
    };
  }
  
  /**
   * Test 1: Round-Robin Distribution
   */
  async testRoundRobinDistribution() {
    log.test('Testing round-robin distribution across healthy endpoints...');
    
    const selector = new EndpointSelector({
      strategy: 'round-robin',
      healthCheckInterval: 1000
    });
    
    // Create 5 healthy endpoints
    const endpointUrls = [];
    for (let i = 0; i < 5; i++) {
      endpointUrls.push(`https://endpoint-${i}.example.com`);
    }
    
    selector.initializeEndpoints(endpointUrls);
    
    // Make 1000 selections
    const selections = 1000;
    const distribution = {};
    
    for (let i = 0; i < selections; i++) {
      const endpoint = selector.selectEndpoint();
      if (endpoint) {
        distribution[endpoint.id] = (distribution[endpoint.id] || 0) + 1;
      }
    }
    
    // Calculate distribution percentages
    const expectedPerEndpoint = selections / endpoints.length;
    const percentages = {};
    let maxVariance = 0;
    
    for (const [id, count] of Object.entries(distribution)) {
      percentages[id] = (count / selections) * 100;
      const variance = Math.abs(count - expectedPerEndpoint) / expectedPerEndpoint * 100;
      maxVariance = Math.max(maxVariance, variance);
    }
    
    log.metric(`Total selections: ${selections}`);
    log.metric(`Endpoints: ${endpoints.length}`);
    log.metric(`Expected per endpoint: ${expectedPerEndpoint}`);
    log.metric(`Distribution: ${JSON.stringify(distribution)}`);
    log.metric(`Max variance: ${maxVariance.toFixed(2)}%`);
    
    this.results.metrics.roundRobinVariance = maxVariance;
    
    if (maxVariance <= 5) {
      log.success(`Round-robin distribution test passed - Variance: ${maxVariance.toFixed(2)}%`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Round-robin distribution test failed - Variance: ${maxVariance.toFixed(2)}% (target: ≤5%)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 2: Health-Based Filtering
   */
  async testHealthFiltering() {
    log.test('Testing health-based endpoint filtering...');
    
    const selector = new EndpointSelector({
      strategy: 'round-robin',
      healthCheckInterval: 1000
    });
    
    // Create mix of healthy and unhealthy endpoints
    const endpoints = [
      { id: 'healthy-1', url: 'https://healthy-1.com', healthy: true },
      { id: 'unhealthy-1', url: 'https://unhealthy-1.com', healthy: false },
      { id: 'healthy-2', url: 'https://healthy-2.com', healthy: true },
      { id: 'unhealthy-2', url: 'https://unhealthy-2.com', healthy: false },
      { id: 'healthy-3', url: 'https://healthy-3.com', healthy: true }
    ];
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Make selections and verify only healthy endpoints are chosen
    const selections = 500;
    const selected = new Set();
    let unhealthySelected = 0;
    
    for (let i = 0; i < selections; i++) {
      const endpoint = selector.selectEndpoint();
      if (endpoint) {
        selected.add(endpoint.id);
        if (!endpoint.healthy) {
          unhealthySelected++;
        }
      }
    }
    
    const healthyEndpoints = endpoints.filter(e => e.healthy);
    const allHealthySelected = healthyEndpoints.every(e => selected.has(e.id));
    
    log.metric(`Total selections: ${selections}`);
    log.metric(`Healthy endpoints: ${healthyEndpoints.length}`);
    log.metric(`Unhealthy selected: ${unhealthySelected}`);
    log.metric(`All healthy selected: ${allHealthySelected}`);
    
    this.results.metrics.healthFilteringAccuracy = unhealthySelected === 0 ? 100 : 0;
    
    if (unhealthySelected === 0 && allHealthySelected) {
      log.success(`Health filtering test passed - 100% accuracy`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Health filtering test failed - ${unhealthySelected} unhealthy selections`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 3: Failover Speed
   */
  async testFailoverSpeed() {
    log.test('Testing failover speed after endpoint failure...');
    
    const selector = new EndpointSelector({
      strategy: 'round-robin',
      healthCheckInterval: 100
    });
    
    // Start with all healthy endpoints
    const endpoints = [
      { id: 'ep-1', url: 'https://ep-1.com', healthy: true },
      { id: 'ep-2', url: 'https://ep-2.com', healthy: true },
      { id: 'ep-3', url: 'https://ep-3.com', healthy: true }
    ];
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Get initial selection pattern
    const beforeFailure = [];
    for (let i = 0; i < 10; i++) {
      const endpoint = selector.selectEndpoint();
      if (endpoint) {
        beforeFailure.push(endpoint.id);
      }
    }
    
    // Mark one endpoint as unhealthy
    endpoints[1].healthy = false;
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Check how quickly failover happens
    let failoverCalls = 0;
    let foundHealthy = false;
    
    for (let i = 0; i < 10; i++) {
      failoverCalls++;
      const endpoint = selector.selectEndpoint();
      if (endpoint && endpoint.healthy) {
        foundHealthy = true;
        break;
      }
    }
    
    log.metric(`Calls before failover: ${beforeFailure.length}`);
    log.metric(`Failover detection calls: ${failoverCalls}`);
    log.metric(`Healthy endpoint found: ${foundHealthy}`);
    
    this.results.metrics.failoverSpeed = failoverCalls;
    
    if (failoverCalls === 1 && foundHealthy) {
      log.success(`Failover speed test passed - Immediate failover (1 call)`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Failover speed test failed - ${failoverCalls} calls needed`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 4: Recovery Detection
   */
  async testRecoveryDetection() {
    log.test('Testing recovery detection and endpoint re-inclusion...');
    
    const selector = new EndpointSelector({
      strategy: 'round-robin',
      healthCheckInterval: 100
    });
    
    // Start with one unhealthy endpoint
    const endpoints = [
      { id: 'ep-1', url: 'https://ep-1.com', healthy: true },
      { id: 'ep-2', url: 'https://ep-2.com', healthy: false },
      { id: 'ep-3', url: 'https://ep-3.com', healthy: true }
    ];
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Verify unhealthy endpoint is not selected
    const beforeRecovery = new Set();
    for (let i = 0; i < 20; i++) {
      const endpoint = selector.selectEndpoint();
      if (endpoint) {
        beforeRecovery.add(endpoint.id);
      }
    }
    
    // Mark endpoint as recovered
    const recoveryTime = Date.now();
    endpoints[1].healthy = true;
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Check how quickly recovered endpoint is included
    let recoveredIncluded = false;
    let checkTime = 0;
    const maxWait = 30000; // 30 seconds max
    
    while (!recoveredIncluded && checkTime < maxWait) {
      const endpoint = selector.selectEndpoint();
      if (endpoint && endpoint.id === 'ep-2') {
        recoveredIncluded = true;
        checkTime = Date.now() - recoveryTime;
        break;
      }
      
      // Small delay between checks
      await TestUtils.sleep(10);
      checkTime = Date.now() - recoveryTime;
    }
    
    log.metric(`Endpoints before recovery: ${Array.from(beforeRecovery).join(', ')}`);
    log.metric(`Recovery detected: ${recoveredIncluded}`);
    log.metric(`Time to include: ${checkTime}ms`);
    
    this.results.metrics.recoveryTime = checkTime;
    
    if (recoveredIncluded && checkTime < 30000) {
      log.success(`Recovery detection test passed - Included in ${checkTime}ms`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Recovery detection test failed - ${checkTime}ms (target: <30000ms)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 5: Selection Latency
   */
  async testSelectionLatency() {
    log.test('Testing selection latency performance...');
    
    const selector = new EndpointSelector({
      strategy: 'round-robin',
      healthCheckInterval: 1000
    });
    
    // Create 10 endpoints
    const endpoints = [];
    for (let i = 0; i < 10; i++) {
      endpoints.push({
        id: `endpoint-${i}`,
        url: `https://endpoint-${i}.com`,
        healthy: i % 3 !== 0, // Some unhealthy
        weight: Math.floor(Math.random() * 5) + 1
      });
    }
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Measure selection latencies
    const iterations = 10000;
    const latencies = [];
    
    // Warm up
    for (let i = 0; i < 100; i++) {
      selector.selectEndpoint();
    }
    
    // Measure
    for (let i = 0; i < iterations; i++) {
      const { duration } = TestUtils.measureTime(() => selector.selectEndpoint());
      latencies.push(duration);
    }
    
    // Calculate statistics
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(iterations * 0.5)];
    const p95 = sortedLatencies[Math.floor(iterations * 0.95)];
    const p99 = sortedLatencies[Math.floor(iterations * 0.99)];
    const maxLatency = sortedLatencies[iterations - 1];
    
    log.metric(`Iterations: ${iterations}`);
    log.metric(`Average latency: ${avgLatency.toFixed(4)}ms`);
    log.metric(`P50 latency: ${p50.toFixed(4)}ms`);
    log.metric(`P95 latency: ${p95.toFixed(4)}ms`);
    log.metric(`P99 latency: ${p99.toFixed(4)}ms`);
    log.metric(`Max latency: ${maxLatency.toFixed(4)}ms`);
    
    this.results.metrics.avgSelectionLatency = avgLatency;
    this.results.metrics.p99SelectionLatency = p99;
    
    if (avgLatency < 0.5 && p99 < 0.5) {
      log.success(`Selection latency test passed - Avg: ${avgLatency.toFixed(4)}ms, P99: ${p99.toFixed(4)}ms`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Selection latency test failed - Avg: ${avgLatency.toFixed(4)}ms (target: <0.5ms)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 6: Memory Overhead
   */
  async testMemoryOverhead() {
    log.test('Testing memory overhead for endpoint tracking...');
    
    const selector = new EndpointSelector({
      strategy: 'round-robin',
      healthCheckInterval: 1000
    });
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const initialMemory = TestUtils.getMemoryUsageMB();
    log.info(`Initial memory: ${initialMemory.toFixed(2)}MB`);
    
    // Create 10 endpoints with statistics
    const endpoints = [];
    for (let i = 0; i < 10; i++) {
      endpoints.push({
        id: `endpoint-${i}`,
        url: `https://endpoint-${i}.example.com`,
        healthy: true,
        weight: 1,
        stats: {
          requests: Math.floor(Math.random() * 1000),
          successes: Math.floor(Math.random() * 900),
          failures: Math.floor(Math.random() * 100),
          avgLatency: Math.random() * 100
        }
      });
    }
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Perform operations to populate internal state
    for (let i = 0; i < 1000; i++) {
      selector.selectEndpoint();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      await TestUtils.sleep(100);
    }
    
    const finalMemory = TestUtils.getMemoryUsageMB();
    const memoryIncrease = (finalMemory - initialMemory) * 1024; // Convert to KB
    
    log.metric(`Endpoints tracked: 10`);
    log.metric(`Initial memory: ${initialMemory.toFixed(2)}MB`);
    log.metric(`Final memory: ${finalMemory.toFixed(2)}MB`);
    log.metric(`Memory increase: ${memoryIncrease.toFixed(2)}KB`);
    
    this.results.metrics.memoryOverheadKB = memoryIncrease;
    
    if (memoryIncrease < 10) {
      log.success(`Memory overhead test passed - ${memoryIncrease.toFixed(2)}KB for 10 endpoints`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Memory overhead test failed - ${memoryIncrease.toFixed(2)}KB (target: <10KB)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 7: Weighted Selection
   */
  async testWeightedSelection() {
    log.test('Testing weighted endpoint selection...');
    
    const selector = new EndpointSelector({
      strategy: 'weighted',
      healthCheckInterval: 1000
    });
    
    // Create endpoints with different weights
    const endpoints = [
      { id: 'ep-1', url: 'https://ep-1.com', healthy: true, weight: 1 },
      { id: 'ep-2', url: 'https://ep-2.com', healthy: true, weight: 2 },
      { id: 'ep-3', url: 'https://ep-3.com', healthy: true, weight: 3 }
    ];
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Make selections and track distribution
    const selections = 6000; // Should give clean distribution
    const distribution = {};
    
    for (let i = 0; i < selections; i++) {
      const endpoint = selector.selectEndpoint();
      if (endpoint) {
        distribution[endpoint.id] = (distribution[endpoint.id] || 0) + 1;
      }
    }
    
    // Calculate expected distribution based on weights
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    const expectedDistribution = {};
    let maxError = 0;
    
    for (const ep of endpoints) {
      const expectedPercentage = (ep.weight / totalWeight) * 100;
      const actualPercentage = ((distribution[ep.id] || 0) / selections) * 100;
      expectedDistribution[ep.id] = expectedPercentage;
      
      const error = Math.abs(actualPercentage - expectedPercentage);
      maxError = Math.max(maxError, error);
      
      log.info(`${ep.id}: Expected ${expectedPercentage.toFixed(1)}%, Got ${actualPercentage.toFixed(1)}%`);
    }
    
    log.metric(`Total selections: ${selections}`);
    log.metric(`Distribution: ${JSON.stringify(distribution)}`);
    log.metric(`Max error: ${maxError.toFixed(2)}%`);
    
    this.results.metrics.weightedError = maxError;
    
    if (maxError <= 5) {
      log.success(`Weighted selection test passed - Max error: ${maxError.toFixed(2)}%`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Weighted selection test failed - Max error: ${maxError.toFixed(2)}% (target: ≤5%)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 8: Concurrent Selection Safety
   */
  async testConcurrentSafety() {
    log.test('Testing concurrent selection safety...');
    
    const selector = new EndpointSelector({
      strategy: 'round-robin',
      healthCheckInterval: 1000
    });
    
    // Create endpoints
    const endpoints = [];
    for (let i = 0; i < 5; i++) {
      endpoints.push({
        id: `endpoint-${i}`,
        url: `https://endpoint-${i}.com`,
        healthy: true
      });
    }
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Launch concurrent selections
    const concurrentCalls = 1000;
    const promises = [];
    const results = [];
    let errors = 0;
    
    for (let i = 0; i < concurrentCalls; i++) {
      promises.push(
        (async () => {
          try {
            const endpoint = selector.selectEndpoint();
            if (endpoint) {
              results.push(endpoint.id);
            }
          } catch (error) {
            errors++;
          }
        })()
      );
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    // Check distribution
    const distribution = {};
    for (const id of results) {
      distribution[id] = (distribution[id] || 0) + 1;
    }
    
    log.metric(`Concurrent calls: ${concurrentCalls}`);
    log.metric(`Duration: ${duration}ms`);
    log.metric(`Successful selections: ${results.length}`);
    log.metric(`Errors: ${errors}`);
    log.metric(`Distribution: ${JSON.stringify(distribution)}`);
    
    this.results.metrics.concurrentDuration = duration;
    this.results.metrics.concurrentErrors = errors;
    
    if (results.length === concurrentCalls && errors === 0) {
      log.success(`Concurrent safety test passed - ${concurrentCalls} selections without errors`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Concurrent safety test failed - ${errors} errors, ${results.length}/${concurrentCalls} successful`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 9: All Endpoints Down
   */
  async testAllEndpointsDown() {
    log.test('Testing behavior when all endpoints are down...');
    
    const selector = new EndpointSelector({
      strategy: 'round-robin',
      healthCheckInterval: 1000
    });
    
    // Create all unhealthy endpoints
    const endpoints = [
      { id: 'ep-1', url: 'https://ep-1.com', healthy: false },
      { id: 'ep-2', url: 'https://ep-2.com', healthy: false },
      { id: 'ep-3', url: 'https://ep-3.com', healthy: false }
    ];
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Try to select endpoints
    let selections = 0;
    let nullSelections = 0;
    
    for (let i = 0; i < 10; i++) {
      const endpoint = selector.selectEndpoint();
      selections++;
      if (endpoint === null || endpoint === undefined) {
        nullSelections++;
      }
    }
    
    log.metric(`Total selection attempts: ${selections}`);
    log.metric(`Null/undefined returns: ${nullSelections}`);
    
    this.results.metrics.allDownBehavior = nullSelections === selections;
    
    if (nullSelections === selections) {
      log.success(`All endpoints down test passed - Graceful handling`);
      this.results.passed++;
      return true;
    } else {
      log.error(`All endpoints down test failed - Unexpected behavior`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 10: Priority Handling
   */
  async testPriorityHandling() {
    log.test('Testing priority-based endpoint selection...');
    
    const selector = new EndpointSelector({
      strategy: 'priority',
      healthCheckInterval: 1000
    });
    
    // Create endpoints with different priorities
    const endpoints = [
      { id: 'low-priority', url: 'https://low.com', healthy: true, priority: 3 },
      { id: 'high-priority', url: 'https://high.com', healthy: true, priority: 1 },
      { id: 'medium-priority', url: 'https://medium.com', healthy: true, priority: 2 }
    ];
    
    selector.initializeEndpoints(endpoints.map(ep => ep.url || ep));
    
    // Make selections - should prefer high priority
    const selections = 100;
    const selected = [];
    
    for (let i = 0; i < selections; i++) {
      const endpoint = selector.selectEndpoint();
      if (endpoint) {
        selected.push(endpoint.id);
      }
    }
    
    // Count selections by priority
    const highPriorityCount = selected.filter(id => id === 'high-priority').length;
    const mediumPriorityCount = selected.filter(id => id === 'medium-priority').length;
    const lowPriorityCount = selected.filter(id => id === 'low-priority').length;
    
    log.metric(`High priority selections: ${highPriorityCount}`);
    log.metric(`Medium priority selections: ${mediumPriorityCount}`);
    log.metric(`Low priority selections: ${lowPriorityCount}`);
    
    this.results.metrics.priorityRespected = highPriorityCount > mediumPriorityCount && 
                                           mediumPriorityCount > lowPriorityCount;
    
    // With priority strategy, high priority should be selected most
    if (highPriorityCount >= mediumPriorityCount && mediumPriorityCount >= lowPriorityCount) {
      log.success(`Priority handling test passed - Priority order respected`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Priority handling test failed - Priority order not respected`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Run all tests
   */
  async runAll() {
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.cyan + '  EndpointSelector Component Test Suite' + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    const tests = [
      { name: 'Round-Robin Distribution', fn: () => this.testRoundRobinDistribution() },
      { name: 'Health Filtering', fn: () => this.testHealthFiltering() },
      { name: 'Failover Speed', fn: () => this.testFailoverSpeed() },
      { name: 'Recovery Detection', fn: () => this.testRecoveryDetection() },
      { name: 'Selection Latency', fn: () => this.testSelectionLatency() },
      { name: 'Memory Overhead', fn: () => this.testMemoryOverhead() },
      { name: 'Weighted Selection', fn: () => this.testWeightedSelection() },
      { name: 'Concurrent Safety', fn: () => this.testConcurrentSafety() },
      { name: 'All Endpoints Down', fn: () => this.testAllEndpointsDown() },
      { name: 'Priority Handling', fn: () => this.testPriorityHandling() }
    ];
    
    const startTime = Date.now();
    
    for (const test of tests) {
      console.log(`\n${colors.blue}[Test ${tests.indexOf(test) + 1}/${tests.length}] ${test.name}${colors.reset}`);
      console.log(colors.blue + '─'.repeat(50) + colors.reset);
      
      try {
        const result = await test.fn();
        this.results.tests.push({ 
          name: test.name, 
          passed: result,
          metrics: { ...this.results.metrics }
        });
      } catch (error) {
        log.error(`Test failed with error: ${error.message}`);
        console.error(error.stack);
        this.results.failed++;
        this.results.tests.push({ 
          name: test.name, 
          passed: false, 
          error: error.message 
        });
      }
      console.log();
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.cyan + '  Test Summary' + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    const total = this.results.passed + this.results.failed;
    const passRate = (this.results.passed / total * 100).toFixed(1);
    
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.blue}Total: ${total}${colors.reset}`);
    console.log(`${colors.yellow}Pass Rate: ${passRate}%${colors.reset}`);
    console.log(`${colors.magenta}Total Time: ${totalTime}s${colors.reset}\n`);
    
    // Key metrics summary
    console.log(colors.cyan + 'Key Metrics:' + colors.reset);
    console.log(`  • Round-Robin Variance: ${this.results.metrics.roundRobinVariance?.toFixed(2)}%`);
    console.log(`  • Health Filtering: ${this.results.metrics.healthFilteringAccuracy}%`);
    console.log(`  • Failover Speed: ${this.results.metrics.failoverSpeed} calls`);
    console.log(`  • Recovery Time: ${this.results.metrics.recoveryTime}ms`);
    console.log(`  • Avg Selection Latency: ${this.results.metrics.avgSelectionLatency?.toFixed(4)}ms`);
    console.log(`  • Memory Overhead: ${this.results.metrics.memoryOverheadKB?.toFixed(2)}KB`);
    
    // Detailed results
    console.log('\n' + colors.cyan + 'Detailed Results:' + colors.reset);
    for (const test of this.results.tests) {
      const icon = test.passed ? '✅' : '❌';
      const color = test.passed ? colors.green : colors.red;
      console.log(`  ${icon} ${color}${test.name}${colors.reset}`);
      if (test.error) {
        console.log(`     ${colors.red}Error: ${test.error}${colors.reset}`);
      }
    }
    
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    // Generate report
    await this.generateReport();
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
  
  /**
   * Generate test report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        passRate: ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1) + '%'
      },
      metrics: this.results.metrics,
      tests: this.results.tests,
      requirements: {
        distributionEvenness: {
          target: 'Within 5% variance',
          actual: `${this.results.metrics.roundRobinVariance?.toFixed(2)}% variance`,
          passed: this.results.metrics.roundRobinVariance <= 5
        },
        healthFiltering: {
          target: '100% accuracy',
          actual: `${this.results.metrics.healthFilteringAccuracy}% accuracy`,
          passed: this.results.metrics.healthFilteringAccuracy === 100
        },
        failoverSpeed: {
          target: '<1 selection call',
          actual: `${this.results.metrics.failoverSpeed} calls`,
          passed: this.results.metrics.failoverSpeed === 1
        },
        recoveryTime: {
          target: '<30 seconds',
          actual: `${this.results.metrics.recoveryTime}ms`,
          passed: this.results.metrics.recoveryTime < 30000
        },
        selectionLatency: {
          target: '<0.5ms',
          actual: `${this.results.metrics.avgSelectionLatency?.toFixed(4)}ms`,
          passed: this.results.metrics.avgSelectionLatency < 0.5
        }
      }
    };
    
    // Save report to file
    const fs = await import('fs').then(m => m.promises);
    const reportPath = 'tests/unit/endpoint-selector-test-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    log.info(`Test report saved to ${reportPath}`);
    
    return report;
  }
}

// Run the test suite
const suite = new EndpointSelectorTestSuite();
suite.runAll().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});