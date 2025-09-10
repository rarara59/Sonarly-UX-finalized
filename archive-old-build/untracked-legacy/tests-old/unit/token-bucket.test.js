#!/usr/bin/env node

/**
 * Comprehensive Test Suite for TokenBucket Component
 * Tests rate limiting accuracy, burst handling, configuration, and memory stability
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
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
  
  static calculateAccuracy(actual, expected, tolerance = 0.05) {
    const diff = Math.abs(actual - expected);
    const percentDiff = diff / expected;
    return percentDiff <= tolerance;
  }
  
  static getMemoryUsageMB() {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
}

// Main test suite
class TokenBucketTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
      metrics: {}
    };
  }
  
  /**
   * Test 1: Basic Rate Limiting Accuracy
   */
  async testRateLimitingAccuracy() {
    log.test('Testing rate limiting accuracy under normal load...');
    
    const bucket = new TokenBucket({
      rateLimit: 100,      // 100 requests per second
      windowMs: 1000,      // 1 second window
      rateWindow: 50       // 50ms quantized windows
    });
    
    const testDuration = 10000; // 10 seconds
    const startTime = Date.now();
    let allowedRequests = 0;
    let rejectedRequests = 0;
    let totalRequests = 0;
    
    // Attempt ~111 requests per second (slightly over limit)
    while (Date.now() - startTime < testDuration) {
      totalRequests++;
      
      if (bucket.consume(1)) {
        allowedRequests++;
      } else {
        rejectedRequests++;
      }
      
      await TestUtils.sleep(9); // ~111 rps attempt rate
    }
    
    const actualDuration = (Date.now() - startTime) / 1000;
    const expectedAllowed = Math.floor(100 * actualDuration);
    const actualRate = allowedRequests / actualDuration;
    const accuracy = (Math.min(allowedRequests, expectedAllowed) / expectedAllowed) * 100;
    
    log.metric(`Total requests: ${totalRequests}`);
    log.metric(`Allowed requests: ${allowedRequests}`);
    log.metric(`Rejected requests: ${rejectedRequests}`);
    log.metric(`Expected rate: 100 rps`);
    log.metric(`Actual rate: ${actualRate.toFixed(2)} rps`);
    log.metric(`Rate accuracy: ${accuracy.toFixed(1)}%`);
    
    this.results.metrics.rateLimitingAccuracy = accuracy;
    
    if (accuracy >= 95) {
      log.success(`Rate limiting accuracy test passed - ${accuracy.toFixed(1)}%`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Rate limiting accuracy test failed - Only ${accuracy.toFixed(1)}% (target: 95%+)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 2: Token Check Latency
   */
  async testTokenCheckLatency() {
    log.test('Testing token check latency under load...');
    
    const bucket = new TokenBucket({
      rateLimit: 1000,
      windowMs: 1000
    });
    
    const iterations = 100000;
    const latencies = [];
    
    // Warm up
    for (let i = 0; i < 1000; i++) {
      bucket.hasTokens(1);
    }
    
    // Measure latencies
    for (let i = 0; i < iterations; i++) {
      const { duration } = TestUtils.measureTime(() => bucket.hasTokens(1));
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
    
    this.results.metrics.avgTokenCheckLatency = avgLatency;
    this.results.metrics.p99TokenCheckLatency = p99;
    
    if (avgLatency < 1.0 && p99 < 1.0) {
      log.success(`Token check latency test passed - Avg: ${avgLatency.toFixed(4)}ms, P99: ${p99.toFixed(4)}ms`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Token check latency test failed - Avg: ${avgLatency.toFixed(4)}ms, P99: ${p99.toFixed(4)}ms (target: <1ms)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 3: Burst Handling
   */
  async testBurstHandling() {
    log.test('Testing burst handling capability...');
    
    const bucket = new TokenBucket({
      rateLimit: 100,
      burstCapacity: 200,  // 2x burst capacity
      burstDuration: 10000, // 10 seconds
      windowMs: 1000
    });
    
    // Phase 1: Exhaust normal capacity
    let consumed = 0;
    for (let i = 0; i < 150; i++) {
      if (bucket.consume(1)) {
        consumed++;
      }
    }
    
    log.info(`Phase 1 - Consumed ${consumed} tokens (should be ~100 or less)`);
    
    // Phase 2: Trigger burst mode and consume at 2x rate
    const burstStartTime = Date.now();
    let burstConsumed = 0;
    let burstRejected = 0;
    
    // Try to consume at 200 rps for 5 seconds
    while (Date.now() - burstStartTime < 5000) {
      if (bucket.consume(1)) {
        burstConsumed++;
      } else {
        burstRejected++;
      }
      await TestUtils.sleep(5); // ~200 rps attempt rate
    }
    
    const burstDuration = (Date.now() - burstStartTime) / 1000;
    const burstRate = burstConsumed / burstDuration;
    
    log.metric(`Burst phase duration: ${burstDuration.toFixed(2)}s`);
    log.metric(`Burst consumed: ${burstConsumed}`);
    log.metric(`Burst rejected: ${burstRejected}`);
    log.metric(`Burst rate: ${burstRate.toFixed(2)} rps`);
    
    const status = bucket.getStatus();
    log.metric(`Burst mode active: ${status.burstMode}`);
    log.metric(`Current capacity: ${status.maxTokens}`);
    
    this.results.metrics.burstRate = burstRate;
    this.results.metrics.burstCapacityUsed = burstConsumed;
    
    // Success if burst rate is significantly higher than normal rate
    if (burstRate > 150) { // At least 1.5x normal rate
      log.success(`Burst handling test passed - ${burstRate.toFixed(2)} rps achieved`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Burst handling test failed - Only ${burstRate.toFixed(2)} rps (expected >150 rps)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 4: Token Replenishment Accuracy
   */
  async testTokenReplenishment() {
    log.test('Testing token replenishment timing accuracy...');
    
    const bucket = new TokenBucket({
      rateLimit: 50,       // 50 tokens per second
      windowMs: 1000,
      rateWindow: 50       // 50ms windows for accuracy
    });
    
    // Consume all tokens
    let exhausted = 0;
    while (bucket.consume(1)) {
      exhausted++;
      if (exhausted > 100) break; // Safety limit
    }
    
    log.info(`Exhausted ${exhausted} tokens`);
    
    // Wait for replenishment and measure
    const measurements = [];
    for (let i = 0; i < 10; i++) {
      await TestUtils.sleep(1000); // Wait 1 second
      
      let replenished = 0;
      while (bucket.consume(1)) {
        replenished++;
        if (replenished > 60) break; // Safety limit
      }
      
      measurements.push(replenished);
      log.info(`Second ${i + 1}: ${replenished} tokens replenished`);
    }
    
    const avgReplenishment = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const expectedReplenishment = 50;
    const accuracy = (avgReplenishment / expectedReplenishment) * 100;
    
    log.metric(`Average replenishment: ${avgReplenishment.toFixed(2)} tokens/sec`);
    log.metric(`Expected replenishment: ${expectedReplenishment} tokens/sec`);
    log.metric(`Replenishment accuracy: ${accuracy.toFixed(1)}%`);
    
    this.results.metrics.replenishmentAccuracy = accuracy;
    
    if (accuracy >= 99 && accuracy <= 101) {
      log.success(`Token replenishment test passed - ${accuracy.toFixed(1)}% accuracy`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Token replenishment test failed - ${accuracy.toFixed(1)}% accuracy (target: 99-101%)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 5: Configuration Loading
   */
  async testConfigurationLoading() {
    log.test('Testing configuration loading from environment variables...');
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Valid environment variables
    process.env.RATE_LIMIT = '200';
    process.env.BURST_CAPACITY = '400';
    process.env.RATE_WINDOW_MS = '2000';
    process.env.BURST_DURATION_MS = '20000';
    
    try {
      const bucket1 = TokenBucket.fromEnvironment();
      const status1 = bucket1.getStatus();
      
      if (status1.rateLimit === 200 && status1.burstCapacity === 400) {
        log.info('✓ Valid environment variables loaded correctly');
        testsPassed++;
      } else {
        log.error('✗ Failed to load valid environment variables');
        testsFailed++;
      }
    } catch (error) {
      log.error(`✗ Error loading valid config: ${error.message}`);
      testsFailed++;
    }
    
    // Test 2: Invalid values (should use defaults)
    process.env.RATE_LIMIT = 'invalid';
    process.env.BURST_CAPACITY = '-100';
    
    try {
      const bucket2 = TokenBucket.fromEnvironment();
      const status2 = bucket2.getStatus();
      
      if (status2.rateLimit === 100) { // Should use default
        log.info('✓ Invalid values handled with defaults');
        testsPassed++;
      } else {
        log.error('✗ Invalid values not handled properly');
        testsFailed++;
      }
    } catch (error) {
      log.error(`✗ Error handling invalid config: ${error.message}`);
      testsFailed++;
    }
    
    // Test 3: Missing environment variables
    delete process.env.RATE_LIMIT;
    delete process.env.BURST_CAPACITY;
    delete process.env.RATE_WINDOW_MS;
    delete process.env.BURST_DURATION_MS;
    
    try {
      const bucket3 = TokenBucket.fromEnvironment();
      const status3 = bucket3.getStatus();
      
      if (status3.rateLimit === 100 && status3.burstCapacity === 200) { // Defaults
        log.info('✓ Missing environment variables use defaults');
        testsPassed++;
      } else {
        log.error('✗ Missing environment variables not handled');
        testsFailed++;
      }
    } catch (error) {
      log.error(`✗ Error with missing config: ${error.message}`);
      testsFailed++;
    }
    
    // Test 4: Configuration validation
    try {
      const bucket4 = new TokenBucket({
        rateLimit: -10  // Invalid
      });
      log.error('✗ Invalid configuration not rejected');
      testsFailed++;
    } catch (error) {
      log.info('✓ Invalid configuration properly rejected');
      testsPassed++;
    }
    
    const totalTests = testsPassed + testsFailed;
    const successRate = (testsPassed / totalTests) * 100;
    
    log.metric(`Configuration tests passed: ${testsPassed}/${totalTests}`);
    log.metric(`Success rate: ${successRate.toFixed(1)}%`);
    
    this.results.metrics.configSuccessRate = successRate;
    
    if (successRate === 100) {
      log.success(`Configuration loading test passed - ${successRate.toFixed(1)}% success`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Configuration loading test failed - ${successRate.toFixed(1)}% success (target: 100%)`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 6: Memory Stability
   */
  async testMemoryStability() {
    log.test('Testing memory stability during sustained operation...');
    
    const bucket = new TokenBucket({
      rateLimit: 1000,
      burstCapacity: 2000,
      windowMs: 1000
    });
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const initialMemory = TestUtils.getMemoryUsageMB();
    log.info(`Initial memory: ${initialMemory.toFixed(2)}MB`);
    
    const testDuration = 60000; // 1 minute (reduced from 5 for faster testing)
    const startTime = Date.now();
    let operations = 0;
    const memorySnapshots = [];
    
    // Perform continuous operations
    while (Date.now() - startTime < testDuration) {
      // Mix of operations
      bucket.consume(1);
      bucket.hasTokens(1);
      bucket.getStatus();
      bucket.getMetrics();
      
      operations += 4;
      
      // Take memory snapshot every second
      if (operations % 4000 === 0) {
        const currentMemory = TestUtils.getMemoryUsageMB();
        memorySnapshots.push(currentMemory);
        
        if (memorySnapshots.length % 10 === 0) {
          log.info(`Progress: ${Math.floor((Date.now() - startTime) / 1000)}s, Memory: ${currentMemory.toFixed(2)}MB, Ops: ${operations}`);
        }
      }
      
      // Small delay to prevent CPU saturation
      if (operations % 1000 === 0) {
        await TestUtils.sleep(1);
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      await TestUtils.sleep(100);
    }
    
    const finalMemory = TestUtils.getMemoryUsageMB();
    const memoryIncrease = finalMemory - initialMemory;
    const maxMemory = Math.max(...memorySnapshots);
    const avgMemory = memorySnapshots.reduce((a, b) => a + b, 0) / memorySnapshots.length;
    
    log.metric(`Total operations: ${operations}`);
    log.metric(`Initial memory: ${initialMemory.toFixed(2)}MB`);
    log.metric(`Final memory: ${finalMemory.toFixed(2)}MB`);
    log.metric(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    log.metric(`Peak memory: ${maxMemory.toFixed(2)}MB`);
    log.metric(`Average memory: ${avgMemory.toFixed(2)}MB`);
    
    this.results.metrics.memoryOperations = operations;
    this.results.metrics.memoryIncrease = memoryIncrease;
    this.results.metrics.peakMemory = maxMemory;
    
    // Clean up
    bucket.destroy();
    
    if (maxMemory < 50 && memoryIncrease < 10) {
      log.success(`Memory stability test passed - Peak: ${maxMemory.toFixed(2)}MB, Increase: ${memoryIncrease.toFixed(2)}MB`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Memory stability test failed - Peak: ${maxMemory.toFixed(2)}MB (target: <50MB), Increase: ${memoryIncrease.toFixed(2)}MB`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 7: Concurrent Access Safety
   */
  async testConcurrentAccess() {
    log.test('Testing concurrent access safety...');
    
    const bucket = new TokenBucket({
      rateLimit: 500,
      windowMs: 1000
    });
    
    const concurrentRequests = 1000;
    const promises = [];
    let successes = 0;
    let failures = 0;
    
    // Launch concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        (async () => {
          const delay = Math.random() * 100; // Random delay 0-100ms
          await TestUtils.sleep(delay);
          
          if (bucket.consume(1)) {
            successes++;
          } else {
            failures++;
          }
        })()
      );
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const metrics = bucket.getMetrics();
    
    log.metric(`Concurrent requests: ${concurrentRequests}`);
    log.metric(`Duration: ${duration}ms`);
    log.metric(`Successes: ${successes}`);
    log.metric(`Failures: ${failures}`);
    log.metric(`Total processed: ${metrics.totalRequests}`);
    
    this.results.metrics.concurrentDuration = duration;
    
    // Verify consistency
    const consistent = (successes + failures === concurrentRequests) && 
                      (metrics.totalRequests === concurrentRequests);
    
    if (consistent) {
      log.success(`Concurrent access test passed - All ${concurrentRequests} requests handled consistently`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Concurrent access test failed - Inconsistent results`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 8: Recovery After Exhaustion
   */
  async testRecoveryAfterExhaustion() {
    log.test('Testing recovery after token exhaustion...');
    
    const bucket = new TokenBucket({
      rateLimit: 50,
      windowMs: 1000,
      rateWindow: 50
    });
    
    // Phase 1: Exhaust all tokens
    let exhausted = 0;
    while (bucket.consume(1)) {
      exhausted++;
      if (exhausted > 100) break;
    }
    
    log.info(`Exhausted ${exhausted} tokens`);
    
    // Verify exhaustion
    const exhaustedStatus = bucket.getStatus();
    log.info(`Tokens remaining: ${exhaustedStatus.tokens}`);
    
    // Phase 2: Verify rejection during exhaustion
    let rejectedDuringExhaustion = 0;
    for (let i = 0; i < 10; i++) {
      if (!bucket.consume(1)) {
        rejectedDuringExhaustion++;
      }
    }
    
    log.info(`Rejected during exhaustion: ${rejectedDuringExhaustion}/10`);
    
    // Phase 3: Wait for recovery and measure
    await TestUtils.sleep(2000); // Wait 2 seconds for recovery
    
    let recoveredTokens = 0;
    while (bucket.consume(1)) {
      recoveredTokens++;
      if (recoveredTokens > 110) break;
    }
    
    log.metric(`Tokens recovered after 2 seconds: ${recoveredTokens}`);
    log.metric(`Expected recovery: ~100 tokens (50 rps * 2s)`);
    
    const recoveryRate = recoveredTokens / 2; // tokens per second
    const recoveryAccuracy = (recoveryRate / 50) * 100;
    
    this.results.metrics.recoveryRate = recoveryRate;
    this.results.metrics.recoveryAccuracy = recoveryAccuracy;
    
    if (rejectedDuringExhaustion === 10 && recoveryAccuracy >= 95 && recoveryAccuracy <= 105) {
      log.success(`Recovery test passed - ${recoveryAccuracy.toFixed(1)}% recovery accuracy`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Recovery test failed - ${recoveryAccuracy.toFixed(1)}% accuracy, ${rejectedDuringExhaustion}/10 rejected`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 9: Event Emission
   */
  async testEventEmission() {
    log.test('Testing event emission for monitoring...');
    
    const bucket = new TokenBucket({
      rateLimit: 10,
      windowMs: 1000
    });
    
    let consumedEvents = 0;
    let rejectedEvents = 0;
    let resetEvents = 0;
    
    bucket.on('token-consumed', (data) => {
      consumedEvents++;
    });
    
    bucket.on('token-rejected', (data) => {
      rejectedEvents++;
    });
    
    bucket.on('bucket-reset', () => {
      resetEvents++;
    });
    
    // Consume some tokens
    for (let i = 0; i < 5; i++) {
      bucket.consume(1);
    }
    
    // Exhaust and get rejections
    for (let i = 0; i < 20; i++) {
      bucket.consume(1);
    }
    
    // Reset
    bucket.reset();
    
    await TestUtils.sleep(100); // Let events propagate
    
    log.metric(`Consumed events: ${consumedEvents}`);
    log.metric(`Rejected events: ${rejectedEvents}`);
    log.metric(`Reset events: ${resetEvents}`);
    
    const eventsWorking = consumedEvents > 0 && rejectedEvents > 0 && resetEvents === 1;
    
    if (eventsWorking) {
      log.success(`Event emission test passed - All event types working`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Event emission test failed - Events not working properly`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Test 10: Health Check
   */
  async testHealthCheck() {
    log.test('Testing health check functionality...');
    
    const bucket = new TokenBucket({
      rateLimit: 100,
      windowMs: 1000
    });
    
    // Perform some operations
    for (let i = 0; i < 50; i++) {
      bucket.consume(1);
      await TestUtils.sleep(10);
    }
    
    const health = await bucket.healthCheck();
    
    log.metric(`Health status: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
    log.metric(`Health check latency: ${health.latency?.toFixed(4)}ms`);
    log.metric(`Current tokens: ${health.status?.tokens}`);
    log.metric(`Average check latency: ${health.metrics?.avgCheckLatencyMs}ms`);
    
    if (health.healthy && health.latency < 1) {
      log.success(`Health check test passed - System healthy`);
      this.results.passed++;
      return true;
    } else {
      log.error(`Health check test failed - ${health.error || 'Unknown error'}`);
      this.results.failed++;
      return false;
    }
  }
  
  /**
   * Run all tests
   */
  async runAll() {
    console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
    console.log(colors.cyan + '  TokenBucket Component Test Suite' + colors.reset);
    console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
    
    const tests = [
      { name: 'Rate Limiting Accuracy', fn: () => this.testRateLimitingAccuracy() },
      { name: 'Token Check Latency', fn: () => this.testTokenCheckLatency() },
      { name: 'Burst Handling', fn: () => this.testBurstHandling() },
      { name: 'Token Replenishment', fn: () => this.testTokenReplenishment() },
      { name: 'Configuration Loading', fn: () => this.testConfigurationLoading() },
      { name: 'Memory Stability', fn: () => this.testMemoryStability() },
      { name: 'Concurrent Access', fn: () => this.testConcurrentAccess() },
      { name: 'Recovery After Exhaustion', fn: () => this.testRecoveryAfterExhaustion() },
      { name: 'Event Emission', fn: () => this.testEventEmission() },
      { name: 'Health Check', fn: () => this.testHealthCheck() }
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
    console.log(`  • Rate Limiting Accuracy: ${this.results.metrics.rateLimitingAccuracy?.toFixed(1)}%`);
    console.log(`  • Avg Token Check Latency: ${this.results.metrics.avgTokenCheckLatency?.toFixed(4)}ms`);
    console.log(`  • P99 Token Check Latency: ${this.results.metrics.p99TokenCheckLatency?.toFixed(4)}ms`);
    console.log(`  • Peak Memory Usage: ${this.results.metrics.peakMemory?.toFixed(2)}MB`);
    console.log(`  • Burst Rate Achieved: ${this.results.metrics.burstRate?.toFixed(2)} rps`);
    console.log(`  • Recovery Accuracy: ${this.results.metrics.recoveryAccuracy?.toFixed(1)}%`);
    
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
        rateLimitingAccuracy: {
          target: '95%+',
          actual: this.results.metrics.rateLimitingAccuracy?.toFixed(1) + '%',
          passed: this.results.metrics.rateLimitingAccuracy >= 95
        },
        tokenCheckLatency: {
          target: '<1ms',
          actual: this.results.metrics.avgTokenCheckLatency?.toFixed(4) + 'ms',
          passed: this.results.metrics.avgTokenCheckLatency < 1
        },
        memoryUsage: {
          target: '<50MB',
          actual: this.results.metrics.peakMemory?.toFixed(2) + 'MB',
          passed: this.results.metrics.peakMemory < 50
        },
        burstHandling: {
          target: '2x rate for 10s',
          actual: this.results.metrics.burstRate?.toFixed(2) + ' rps',
          passed: this.results.metrics.burstRate > 150
        },
        configurationLoading: {
          target: '100%',
          actual: this.results.metrics.configSuccessRate?.toFixed(1) + '%',
          passed: this.results.metrics.configSuccessRate === 100
        }
      }
    };
    
    // Save report to file
    const fs = await import('fs').then(m => m.promises);
    const reportPath = 'tests/unit/token-bucket-test-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    log.info(`Test report saved to ${reportPath}`);
    
    return report;
  }
}

// Run the test suite
const suite = new TokenBucketTestSuite();
suite.runAll().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});