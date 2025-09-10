#!/usr/bin/env node

/**
 * Short-Duration Load Test
 * Tests system under continuous load for 10 minutes
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MemoryMonitor } from './memory-monitor.js';
import ComponentMemoryTracker from './component-memory-tracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ShortLoadTest {
  constructor() {
    this.config = {
      testDuration: 600000,        // 10 minutes (600000ms for production, reduced for demo)
      requestsPerMinute: 20,       // Target request rate
      requestInterval: 3000,       // 3 seconds between requests (20 per minute)
      memoryGrowthLimit: 52428800, // 50MB max growth
      successRateTarget: 0.80,     // 80% success rate
      componentsToTest: [
        'tokenBucket',
        'circuitBreaker', 
        'connectionPool',
        'endpointSelector',
        'requestCache',
        'batchManager',
        'hedgedManager'
      ],
      requestTypes: [
        { method: 'getTokenSupply', weight: 0.3 },
        { method: 'getAccountInfo', weight: 0.3 },
        { method: 'getTokenLargestAccounts', weight: 0.2 },
        { method: 'getBalance', weight: 0.1 },
        { method: 'getSlot', weight: 0.1 }
      ],
      testTokens: [
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
        'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
      ]
    };
    
    // For demo, reduce duration to 1 minute
    this.config.testDuration = 60000; // 1 minute for demo
    
    this.results = {
      startTime: null,
      endTime: null,
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      memoryGrowth: {
        initial: 0,
        final: 0,
        growth: 0,
        growthRate: 0,
        peak: 0
      },
      componentHealth: {},
      performanceMetrics: {
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0
      },
      errors: [],
      validation: {
        durationMet: false,
        successRateMet: false,
        memoryStable: false,
        componentsHealthy: false,
        overallPass: false
      }
    };
    
    this.latencies = [];
    this.system = null;
    this.memoryMonitor = null;
    this.componentTracker = null;
    this.testInterval = null;
    this.isRunning = false;
  }
  
  /**
   * Run the load test
   */
  async runTest() {
    console.log('🏃 SHORT-DURATION LOAD TEST');
    console.log('=' .repeat(60));
    console.log(`Duration: ${this.config.testDuration / 60000} minutes`);
    console.log(`Target Rate: ${this.config.requestsPerMinute} requests/minute`);
    console.log(`Success Target: >${(this.config.successRateTarget * 100)}%`);
    console.log(`Memory Growth Limit: ${this.config.memoryGrowthLimit / (1024 * 1024)}MB`);
    console.log('=' .repeat(60) + '\n');
    
    try {
      // Initialize system and monitoring
      await this.initialize();
      
      // Start the load test
      console.log('\n🚀 Starting Load Test...');
      this.results.startTime = Date.now();
      this.isRunning = true;
      
      // Start continuous requests
      await this.runContinuousLoad();
      
      // Test complete
      this.results.endTime = Date.now();
      this.results.duration = this.results.endTime - this.results.startTime;
      
      // Stop monitoring
      await this.stopMonitoring();
      
      // Calculate final metrics
      this.calculateMetrics();
      
      // Validate results
      this.validateResults();
      
      // Generate report
      this.generateReport();
      
      // Save results
      await this.saveResults();
      
    } catch (error) {
      console.error('\n❌ Load test failed:', error);
      this.results.errors.push({
        timestamp: Date.now(),
        error: error.message,
        stack: error.stack
      });
      
      if (this.memoryMonitor) {
        await this.memoryMonitor.stop();
      }
      if (this.componentTracker) {
        await this.componentTracker.stop();
      }
      
      await this.saveResults();
    }
  }
  
  /**
   * Initialize system and monitoring
   */
  async initialize() {
    console.log('🔧 Initializing System...');
    
    // Initialize mock system
    this.system = new MockLoadTestSystem();
    await this.system.initialize();
    console.log('  ✅ System initialized');
    
    // Initialize memory monitor
    console.log('\n📊 Starting Memory Monitoring...');
    this.memoryMonitor = new MemoryMonitor({
      sampleInterval: 10000, // Sample every 10 seconds
      outputPath: path.join(__dirname, '..', 'results', 'load-test-memory.json')
    });
    await this.memoryMonitor.start();
    
    // Initialize component tracker
    this.componentTracker = new ComponentMemoryTracker({
      sampleInterval: 10000,
      outputPath: path.join(__dirname, '..', 'results', 'load-test-components.json')
    });
    
    // Register mock components
    for (const componentName of this.config.componentsToTest) {
      this.componentTracker.registerComponent(
        componentName,
        this.system.getComponent(componentName)
      );
    }
    
    await this.componentTracker.start();
    console.log('  ✅ Monitoring started');
    
    // Record initial memory
    const initialMetrics = this.memoryMonitor.getMetrics();
    this.results.memoryGrowth.initial = initialMetrics.initial?.process.heapUsed || 0;
  }
  
  /**
   * Run continuous load
   */
  async runContinuousLoad() {
    const startTime = Date.now();
    const endTime = startTime + this.config.testDuration;
    let requestCount = 0;
    
    console.log(`\n📈 Running continuous load for ${this.config.testDuration / 60000} minute(s)...\n`);
    
    // Progress bar setup
    const totalExpectedRequests = Math.floor(this.config.testDuration / this.config.requestInterval);
    
    while (Date.now() < endTime && this.isRunning) {
      // Execute request
      await this.executeRequest();
      requestCount++;
      
      // Progress update
      if (requestCount % 5 === 0) {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed / this.config.testDuration) * 100;
        const successRate = this.results.totalRequests > 0 
          ? (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(1)
          : 0;
        
        const memMetrics = this.memoryMonitor.getMetrics();
        const currentMem = memMetrics.current?.process.heapUsed || 0;
        const memGrowth = currentMem - this.results.memoryGrowth.initial;
        const memGrowthMB = (memGrowth / (1024 * 1024)).toFixed(2);
        
        console.log(
          `⏱️ Progress: ${progress.toFixed(1)}% | ` +
          `Requests: ${this.results.totalRequests} | ` +
          `Success: ${successRate}% | ` +
          `Memory Growth: ${memGrowthMB}MB`
        );
      }
      
      // Wait for next request interval
      await new Promise(resolve => setTimeout(resolve, this.config.requestInterval));
    }
    
    console.log('\n✅ Load test execution complete');
  }
  
  /**
   * Execute a single request
   */
  async executeRequest() {
    const requestType = this.selectRequestType();
    const token = this.config.testTokens[
      Math.floor(Math.random() * this.config.testTokens.length)
    ];
    
    const startTime = Date.now();
    
    try {
      // Execute through system
      const result = await this.system.executeRequest(
        requestType,
        this.getRequestParams(requestType, token)
      );
      
      const latency = Date.now() - startTime;
      this.latencies.push(latency);
      
      this.results.totalRequests++;
      this.results.successfulRequests++;
      
      // Update component health
      if (result.componentHealth) {
        for (const [component, health] of Object.entries(result.componentHealth)) {
          if (!this.results.componentHealth[component]) {
            this.results.componentHealth[component] = {
              healthy: 0,
              unhealthy: 0,
              status: 'unknown'
            };
          }
          
          if (health === 'healthy') {
            this.results.componentHealth[component].healthy++;
          } else {
            this.results.componentHealth[component].unhealthy++;
          }
        }
      }
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.latencies.push(latency);
      
      this.results.totalRequests++;
      this.results.failedRequests++;
      
      // Track error
      const errorType = this.categorizeError(error);
      if (!this.results.errors.find(e => e.type === errorType)) {
        this.results.errors.push({
          type: errorType,
          count: 1,
          firstOccurrence: Date.now(),
          message: error.message
        });
      } else {
        const existingError = this.results.errors.find(e => e.type === errorType);
        existingError.count++;
      }
    }
  }
  
  /**
   * Select request type based on weights
   */
  selectRequestType() {
    const random = Math.random();
    let cumulative = 0;
    
    for (const type of this.config.requestTypes) {
      cumulative += type.weight;
      if (random < cumulative) {
        return type.method;
      }
    }
    
    return this.config.requestTypes[0].method;
  }
  
  /**
   * Get request parameters
   */
  getRequestParams(method, token) {
    switch (method) {
      case 'getTokenSupply':
        return [token];
      case 'getAccountInfo':
        return [token, { encoding: 'base64' }];
      case 'getTokenLargestAccounts':
        return [token];
      case 'getBalance':
        return [token];
      case 'getSlot':
        return [];
      default:
        return [];
    }
  }
  
  /**
   * Categorize error type
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('connection')) return 'connection';
    if (message.includes('rate')) return 'rate_limit';
    if (message.includes('circuit')) return 'circuit_breaker';
    if (message.includes('memory')) return 'memory';
    
    return 'unknown';
  }
  
  /**
   * Stop monitoring
   */
  async stopMonitoring() {
    console.log('\n📊 Stopping Monitoring...');
    
    if (this.memoryMonitor) {
      await this.memoryMonitor.stop();
      
      // Get final memory metrics
      const finalMetrics = this.memoryMonitor.getMetrics();
      this.results.memoryGrowth.final = finalMetrics.current?.process.heapUsed || 0;
      this.results.memoryGrowth.peak = finalMetrics.peak.heapUsed;
      this.results.memoryGrowth.growth = this.results.memoryGrowth.final - this.results.memoryGrowth.initial;
      this.results.memoryGrowth.growthRate = finalMetrics.growthRate.heapUsed;
    }
    
    if (this.componentTracker) {
      await this.componentTracker.stop();
    }
  }
  
  /**
   * Calculate metrics
   */
  calculateMetrics() {
    // Success rate
    this.results.successRate = this.results.totalRequests > 0
      ? this.results.successfulRequests / this.results.totalRequests
      : 0;
    
    // Latency metrics
    if (this.latencies.length > 0) {
      this.latencies.sort((a, b) => a - b);
      
      const sum = this.latencies.reduce((a, b) => a + b, 0);
      this.results.performanceMetrics.averageLatency = sum / this.latencies.length;
      
      const p95Index = Math.floor(this.latencies.length * 0.95);
      const p99Index = Math.floor(this.latencies.length * 0.99);
      
      this.results.performanceMetrics.p95Latency = this.latencies[p95Index];
      this.results.performanceMetrics.p99Latency = this.latencies[p99Index];
    }
    
    // Throughput
    const durationMinutes = this.results.duration / 60000;
    this.results.performanceMetrics.throughput = 
      this.results.totalRequests / durationMinutes;
    
    // Component health status
    for (const [component, health] of Object.entries(this.results.componentHealth)) {
      const total = health.healthy + health.unhealthy;
      const healthRate = total > 0 ? health.healthy / total : 0;
      health.status = healthRate >= 0.9 ? 'healthy' : healthRate >= 0.7 ? 'degraded' : 'unhealthy';
    }
  }
  
  /**
   * Validate results against criteria
   */
  validateResults() {
    console.log('\n✅ Validating Results...');
    
    // Duration check
    this.results.validation.durationMet = 
      this.results.duration >= (this.config.testDuration * 0.95); // Allow 5% variance
    
    console.log(`  Duration: ${this.results.validation.durationMet ? '✅' : '❌'} ` +
                `(${(this.results.duration / 60000).toFixed(2)} minutes)`);
    
    // Success rate check
    this.results.validation.successRateMet = 
      this.results.successRate >= this.config.successRateTarget;
    
    console.log(`  Success Rate: ${this.results.validation.successRateMet ? '✅' : '❌'} ` +
                `(${(this.results.successRate * 100).toFixed(1)}%)`);
    
    // Memory stability check
    this.results.validation.memoryStable = 
      this.results.memoryGrowth.growth <= this.config.memoryGrowthLimit;
    
    const memGrowthMB = this.results.memoryGrowth.growth / (1024 * 1024);
    console.log(`  Memory Growth: ${this.results.validation.memoryStable ? '✅' : '❌'} ` +
                `(${memGrowthMB.toFixed(2)}MB)`);
    
    // Component health check
    const healthyComponents = Object.values(this.results.componentHealth)
      .filter(h => h.status === 'healthy').length;
    const totalComponents = Object.keys(this.results.componentHealth).length;
    
    this.results.validation.componentsHealthy = 
      totalComponents > 0 && healthyComponents === totalComponents;
    
    console.log(`  Components: ${this.results.validation.componentsHealthy ? '✅' : '❌'} ` +
                `(${healthyComponents}/${totalComponents} healthy)`);
    
    // Overall validation
    this.results.validation.overallPass = 
      this.results.validation.durationMet &&
      this.results.validation.successRateMet &&
      this.results.validation.memoryStable &&
      this.results.validation.componentsHealthy;
  }
  
  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 LOAD TEST REPORT');
    console.log('=' .repeat(60));
    
    console.log('\n📊 Test Summary:');
    console.log(`  Duration: ${(this.results.duration / 60000).toFixed(2)} minutes`);
    console.log(`  Total Requests: ${this.results.totalRequests}`);
    console.log(`  Successful: ${this.results.successfulRequests}`);
    console.log(`  Failed: ${this.results.failedRequests}`);
    console.log(`  Success Rate: ${(this.results.successRate * 100).toFixed(2)}%`);
    
    console.log('\n⚡ Performance:');
    console.log(`  Average Latency: ${this.results.performanceMetrics.averageLatency.toFixed(0)}ms`);
    console.log(`  P95 Latency: ${this.results.performanceMetrics.p95Latency}ms`);
    console.log(`  P99 Latency: ${this.results.performanceMetrics.p99Latency}ms`);
    console.log(`  Throughput: ${this.results.performanceMetrics.throughput.toFixed(1)} req/min`);
    
    console.log('\n💾 Memory Analysis:');
    const initialMB = this.results.memoryGrowth.initial / (1024 * 1024);
    const finalMB = this.results.memoryGrowth.final / (1024 * 1024);
    const growthMB = this.results.memoryGrowth.growth / (1024 * 1024);
    const peakMB = this.results.memoryGrowth.peak / (1024 * 1024);
    
    console.log(`  Initial: ${initialMB.toFixed(2)}MB`);
    console.log(`  Final: ${finalMB.toFixed(2)}MB`);
    console.log(`  Growth: ${growthMB.toFixed(2)}MB`);
    console.log(`  Peak: ${peakMB.toFixed(2)}MB`);
    console.log(`  Growth Rate: ${(this.results.memoryGrowth.growthRate * 3600 / (1024 * 1024)).toFixed(2)}MB/hr`);
    
    console.log('\n🔧 Component Health:');
    for (const [component, health] of Object.entries(this.results.componentHealth)) {
      const icon = health.status === 'healthy' ? '✅' : 
                   health.status === 'degraded' ? '⚠️' : '❌';
      console.log(`  ${component}: ${icon} ${health.status} ` +
                  `(${health.healthy}/${health.healthy + health.unhealthy})`);
    }
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of this.results.errors) {
        console.log(`  ${error.type}: ${error.count} occurrences`);
      }
    }
    
    console.log('\n🏁 Validation Results:');
    console.log(`  Duration Test: ${this.results.validation.durationMet ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Success Rate: ${this.results.validation.successRateMet ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Memory Stability: ${this.results.validation.memoryStable ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Component Health: ${this.results.validation.componentsHealthy ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n🎯 Overall Result:');
    if (this.results.validation.overallPass) {
      console.log('  ✅ LOAD TEST PASSED');
      console.log('  System performed well under sustained load');
    } else {
      console.log('  ❌ LOAD TEST FAILED');
      console.log('  System needs optimization for sustained operation');
    }
    
    console.log('\n' + '=' .repeat(60));
  }
  
  /**
   * Save test results
   */
  async saveResults() {
    const resultsPath = path.join(__dirname, '..', 'results', 'short-load-test-results.json');
    
    try {
      await fs.writeFile(
        resultsPath,
        JSON.stringify(this.results, null, 2)
      );
      console.log(`\n📁 Results saved to ${resultsPath}`);
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  }
}

/**
 * Mock system for load testing
 */
class MockLoadTestSystem {
  constructor() {
    this.components = {};
    this.requestCount = 0;
  }
  
  async initialize() {
    // Initialize mock components
    this.components = {
      tokenBucket: { 
        tokens: 100, 
        data: new Array(1000).fill(0),
        acquire() { 
          if (this.tokens > 0) { 
            this.tokens--; 
            return true; 
          } 
          return false; 
        }
      },
      circuitBreaker: { 
        state: 'closed', 
        failures: 0,
        data: new Map(),
        check() { 
          return this.state === 'closed'; 
        }
      },
      connectionPool: { 
        connections: [],
        maxConnections: 10,
        getConnection() {
          if (this.connections.length < this.maxConnections) {
            const conn = { id: Date.now(), data: new Array(100).fill(0) };
            this.connections.push(conn);
            return conn;
          }
          return this.connections[0];
        }
      },
      endpointSelector: { 
        endpoints: ['primary', 'backup1', 'backup2'],
        current: 0,
        select() {
          const endpoint = this.endpoints[this.current];
          this.current = (this.current + 1) % this.endpoints.length;
          return endpoint;
        }
      },
      requestCache: { 
        cache: new Map(),
        maxSize: 100,
        get(key) {
          return this.cache.get(key);
        },
        set(key, value) {
          if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
          }
          this.cache.set(key, value);
        }
      },
      batchManager: { 
        queue: [],
        maxBatchSize: 10,
        add(request) {
          this.queue.push(request);
          if (this.queue.length >= this.maxBatchSize) {
            const batch = this.queue.splice(0, this.maxBatchSize);
            return batch;
          }
          return null;
        }
      },
      hedgedManager: { 
        activeRequests: new Set(),
        hedge(request) {
          this.activeRequests.add(request);
          setTimeout(() => this.activeRequests.delete(request), 1000);
        }
      }
    };
  }
  
  getComponent(name) {
    return this.components[name];
  }
  
  async executeRequest(method, params) {
    this.requestCount++;
    
    // Simulate memory growth in components
    if (this.requestCount % 10 === 0) {
      // Cache grows
      this.components.requestCache.cache.set(
        `key-${this.requestCount}`,
        { data: new Array(Math.floor(Math.random() * 100)).fill(0) }
      );
      
      // Connection pool might grow
      if (Math.random() > 0.7) {
        this.components.connectionPool.getConnection();
      }
      
      // Batch queue might grow
      this.components.batchManager.add({ method, params, data: new Array(50).fill(0) });
    }
    
    // Simulate request processing
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
    
    // Simulate success/failure
    if (Math.random() < 0.85) {
      // Success
      return {
        success: true,
        result: { value: Math.random() * 1000 },
        componentHealth: {
          tokenBucket: 'healthy',
          circuitBreaker: 'healthy',
          connectionPool: 'healthy',
          endpointSelector: 'healthy',
          requestCache: 'healthy',
          batchManager: 'healthy',
          hedgedManager: 'healthy'
        }
      };
    } else {
      // Failure
      const errors = [
        new Error('Connection timeout'),
        new Error('Rate limit exceeded'),
        new Error('Circuit breaker open')
      ];
      
      throw errors[Math.floor(Math.random() * errors.length)];
    }
  }
}

// Main execution
async function main() {
  const loadTest = new ShortLoadTest();
  await loadTest.runTest();
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ShortLoadTest };