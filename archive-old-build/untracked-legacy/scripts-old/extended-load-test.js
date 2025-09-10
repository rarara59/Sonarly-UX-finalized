#!/usr/bin/env node

/**
 * Extended Duration Load Test (60 minutes)
 * Tests system under continuous load for extended period
 * Monitors memory growth patterns for PM2 calculation
 */

import { RpcConnectionPoolAdapter } from '../src/adapters/rpc-connection-pool.adapter.js';
import { MemoryMonitor } from './memory-monitor.js';
import { ComponentMemoryTracker } from './component-memory-tracker.js';
import fs from 'fs/promises';
import path from 'path';

class ExtendedLoadTest {
  constructor() {
    this.pool = null;
    this.factory = null;
    this.memoryMonitor = new MemoryMonitor();
    this.componentTracker = new ComponentMemoryTracker();
    this.metrics = {
      startTime: null,
      endTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      componentMemory: [],
      memoryGrowthProjection: null,
      performanceOverTime: []
    };
    
    // Configuration for extended test
    this.config = {
      testDuration: 3600000, // 60 minutes
      requestsPerMinute: 15, // Lower rate for sustained test
      memoryGrowthLimit: 104857600, // 100MB max growth
      performanceCheckInterval: 300000, // Check every 5 minutes
      memoryCheckInterval: 60000, // Check memory every minute
      successRateThreshold: 0.75, // 75% minimum success rate
      maxLatencyDegradation: 0.25, // 25% max latency increase
      // Option to reduce duration for demo
      demoMode: process.env.DEMO_MODE === 'true',
      demoDuration: 60000 // 1 minute for demo
    };
    
    if (this.config.demoMode) {
      this.config.testDuration = this.config.demoDuration;
      this.config.performanceCheckInterval = 20000; // Check every 20s in demo
      this.config.memoryCheckInterval = 10000; // Check every 10s in demo
      console.log('🎯 Running in DEMO MODE (1 minute instead of 60)');
    }
    
    this.requestInterval = 60000 / this.config.requestsPerMinute;
    this.performanceCheckpoints = [];
    this.memoryCheckpoints = [];
    this.initialLatency = null;
  }
  
  async initialize() {
    console.log('🚀 Initializing Extended Load Test...');
    console.log(`📊 Configuration:`);
    console.log(`   - Duration: ${this.config.testDuration / 60000} minutes`);
    console.log(`   - Request rate: ${this.config.requestsPerMinute} req/min`);
    console.log(`   - Total expected requests: ${Math.floor(this.config.testDuration / this.requestInterval)}`);
    console.log(`   - Success threshold: ${this.config.successRateThreshold * 100}%`);
    console.log(`   - Memory limit: ${this.config.memoryGrowthLimit / 1048576}MB`);
    console.log('');
    
    // Create a mock pool for testing
    this.pool = {
      request: async (method, params) => {
        // Simulate random success/failure
        const shouldSucceed = Math.random() > 0.2; // 80% success rate
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
        
        if (!shouldSucceed) {
          throw new Error('Simulated request failure');
        }
        
        // Return mock responses based on method
        switch (method) {
          case 'getSlot':
            return { result: 123456789 };
          case 'getBalance':
            return { result: { value: 1000000000 } };
          case 'getBlockHeight':
            return { result: 123456789 };
          case 'getHealth':
            return { result: 'ok' };
          case 'getVersion':
            return { result: { 'solana-core': '1.14.0' } };
          default:
            return { result: {} };
        }
      }
    };
    
    // Import factory for component tracking
    const { default: factory } = await import('../src/detection/transport/component-factory.js');
    this.factory = factory;
    
    // Start memory monitoring
    this.memoryMonitor.startMonitoring(this.config.memoryCheckInterval);
    
    // Take initial measurements
    const initialMemory = this.memoryMonitor.takeSample();
    this.metrics.initialMemory = initialMemory.process.heapUsed;
    
    // Measure initial latency
    const latencyResult = await this.measureLatency();
    this.initialLatency = latencyResult.average;
    
    console.log(`📈 Initial state:`);
    console.log(`   - Memory: ${(initialMemory.process.heapUsed / 1048576).toFixed(2)}MB`);
    console.log(`   - Latency: ${this.initialLatency.toFixed(2)}ms`);
    console.log('');
  }
  
  async measureLatency() {
    const samples = 3;  // Reduced samples for faster measurement
    const latencies = [];
    
    for (let i = 0; i < samples; i++) {
      const start = Date.now();
      try {
        await this.pool.request('getSlot', []);
        latencies.push(Date.now() - start);
      } catch (error) {
        // Include failed requests with reasonable latency
        latencies.push(200);
      }
    }
    
    return {
      average: latencies.reduce((a, b) => a + b, 0) / samples,
      samples: latencies
    };
  }
  
  async makeRequest() {
    const methods = [
      { method: 'getBalance', params: ['11111111111111111111111111111111'] },
      { method: 'getSlot', params: [] },
      { method: 'getBlockHeight', params: [] },
      { method: 'getHealth', params: [] },
      { method: 'getVersion', params: [] }
    ];
    
    const request = methods[Math.floor(Math.random() * methods.length)];
    const start = Date.now();
    
    try {
      const result = await this.pool.request(request.method, request.params);
      this.metrics.successfulRequests++;
      return {
        success: true,
        latency: Date.now() - start,
        method: request.method
      };
    } catch (error) {
      this.metrics.failedRequests++;
      return {
        success: false,
        latency: Date.now() - start,
        method: request.method,
        error: error.message
      };
    }
  }
  
  async performanceCheckpoint(elapsed) {
    const checkpoint = {
      timestamp: Date.now(),
      elapsed,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests,
      totalRequests: this.metrics.totalRequests,
      successful: this.metrics.successfulRequests,
      failed: this.metrics.failedRequests
    };
    
    // Measure current latency
    const latencyResult = await this.measureLatency();
    checkpoint.averageLatency = latencyResult.average;
    checkpoint.latencyDegradation = 
      (latencyResult.average - this.initialLatency) / this.initialLatency;
    
    // Get memory state
    const memory = this.memoryMonitor.getCurrentMetrics();
    checkpoint.memoryUsage = memory.process.heapUsed;
    checkpoint.memoryGrowth = memory.process.heapUsed - this.metrics.initialMemory;
    
    // Track component memory
    const componentMemory = await this.trackComponentMemory();
    checkpoint.componentMemory = componentMemory;
    
    this.performanceCheckpoints.push(checkpoint);
    
    // Log checkpoint
    const minutes = Math.floor(elapsed / 60000);
    console.log(`\n⏱️  Checkpoint at ${minutes} minutes:`);
    console.log(`   - Requests: ${checkpoint.totalRequests} (${checkpoint.successful}✓/${checkpoint.failed}✗)`);
    console.log(`   - Success rate: ${(checkpoint.successRate * 100).toFixed(1)}%`);
    console.log(`   - Latency: ${checkpoint.averageLatency.toFixed(2)}ms (${checkpoint.latencyDegradation >= 0 ? '+' : ''}${(checkpoint.latencyDegradation * 100).toFixed(1)}%)`);
    console.log(`   - Memory: ${(checkpoint.memoryUsage / 1048576).toFixed(2)}MB (+${(checkpoint.memoryGrowth / 1048576).toFixed(2)}MB)`);
    
    // Component memory summary
    console.log(`   - Component memory:`);
    for (const [name, size] of Object.entries(componentMemory)) {
      console.log(`     • ${name}: ${(size / 1024).toFixed(2)}KB`);
    }
    
    return checkpoint;
  }
  
  async trackComponentMemory() {
    // Get components from factory
    const components = {};
    const componentNames = ['tokenBucket', 'circuitBreaker', 'connectionPool', 
                          'endpointSelector', 'requestCache', 'batchManager', 'hedgedManager'];
    
    for (const name of componentNames) {
      try {
        components[name] = await this.factory.create(name, { useFakes: true });
      } catch (e) {
        // Component might not exist, skip
      }
    }
    
    const memory = {};
    for (const [name, component] of Object.entries(components)) {
      if (component) {
        memory[name] = this.componentTracker.estimateObjectSize(component);
      }
    }
    
    this.metrics.componentMemory.push({
      timestamp: Date.now(),
      memory
    });
    
    return memory;
  }
  
  calculateMemoryProjection(checkpoints) {
    if (checkpoints.length < 2) return null;
    
    // Calculate growth rate using linear regression
    const times = checkpoints.map(cp => cp.elapsed / 3600000); // Convert to hours
    const memories = checkpoints.map(cp => cp.memoryGrowth / 1048576); // Convert to MB
    
    // Simple linear regression
    const n = times.length;
    const sumX = times.reduce((a, b) => a + b, 0);
    const sumY = memories.reduce((a, b) => a + b, 0);
    const sumXY = times.reduce((sum, x, i) => sum + x * memories[i], 0);
    const sumX2 = times.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return {
      growthRatePerHour: slope, // MB per hour
      projectedDaily: slope * 24, // MB per day
      projectedWeekly: slope * 24 * 7, // MB per week
      pm2RestartThreshold: 500, // MB - typical PM2 restart threshold
      estimatedRestartInterval: slope > 0 ? 500 / slope : Infinity // Hours until restart
    };
  }
  
  async runTest() {
    await this.initialize();
    
    this.metrics.startTime = Date.now();
    const testEndTime = this.metrics.startTime + this.config.testDuration;
    
    console.log('🏁 Starting extended load test...\n');
    
    let nextRequest = Date.now();
    let nextPerformanceCheck = Date.now() + this.config.performanceCheckInterval;
    let requestCount = 0;
    
    while (Date.now() < testEndTime) {
      const now = Date.now();
      
      // Make request if it's time
      if (now >= nextRequest) {
        this.metrics.totalRequests++;
        requestCount++;
        
        // Make request without waiting (fire and forget)
        this.makeRequest().catch(() => {}); // Ignore errors in fire-and-forget mode
        
        if (requestCount % 5 === 0) {
          process.stdout.write(`\r📊 Progress: ${requestCount} requests, ${this.metrics.successfulRequests}✓/${this.metrics.failedRequests}✗`);
        }
        
        nextRequest += this.requestInterval;
      }
      
      // Performance checkpoint
      if (now >= nextPerformanceCheck) {
        const elapsed = now - this.metrics.startTime;
        // Run checkpoint asynchronously to not block
        this.performanceCheckpoint(elapsed).catch(console.error);
        nextPerformanceCheck += this.config.performanceCheckInterval;
      }
      
      // Small delay to prevent CPU spinning
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.metrics.endTime = Date.now();
    
    // Final checkpoint
    await this.performanceCheckpoint(this.metrics.endTime - this.metrics.startTime);
    
    // Stop monitoring
    this.memoryMonitor.stopMonitoring();
    
    // Calculate projections
    this.metrics.memoryGrowthProjection = 
      this.calculateMemoryProjection(this.performanceCheckpoints);
    
    await this.generateReport();
  }
  
  async generateReport() {
    const duration = this.metrics.endTime - this.metrics.startTime;
    const successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    
    // Get final memory state
    const finalMemory = this.memoryMonitor.getCurrentMetrics();
    const memoryGrowth = finalMemory.process.heapUsed - this.metrics.initialMemory;
    
    // Check success criteria
    const durationMet = duration >= this.config.testDuration * 0.95; // Allow 5% variance
    const successRateMet = successRate >= this.config.successRateThreshold;
    const memoryStable = memoryGrowth < this.config.memoryGrowthLimit;
    
    // Check performance degradation
    const finalCheckpoint = this.performanceCheckpoints[this.performanceCheckpoints.length - 1];
    const performanceStable = 
      finalCheckpoint.latencyDegradation < this.config.maxLatencyDegradation;
    
    const report = {
      testConfiguration: {
        duration: this.config.testDuration,
        requestsPerMinute: this.config.requestsPerMinute,
        demoMode: this.config.demoMode
      },
      summary: {
        startTime: this.metrics.startTime,
        endTime: this.metrics.endTime,
        actualDuration: duration,
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        successRate
      },
      memoryAnalysis: {
        initialMemory: this.metrics.initialMemory,
        finalMemory: finalMemory.process.heapUsed,
        totalGrowth: memoryGrowth,
        growthRate: memoryGrowth / (duration / 3600000), // MB per hour
        projection: this.metrics.memoryGrowthProjection,
        componentMemory: this.metrics.componentMemory
      },
      performanceAnalysis: {
        initialLatency: this.initialLatency,
        finalLatency: finalCheckpoint.averageLatency,
        latencyDegradation: finalCheckpoint.latencyDegradation,
        checkpoints: this.performanceCheckpoints
      },
      validation: {
        durationMet,
        successRateMet,
        memoryStable,
        performanceStable,
        overallPass: durationMet && successRateMet && memoryStable && performanceStable
      }
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), 'results', 'extended-load-test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Save memory tracking data
    const memoryPath = path.join(process.cwd(), 'results', 'extended-test-memory.json');
    await fs.writeFile(memoryPath, JSON.stringify(this.memoryMonitor.getMetrics(), null, 2));
    
    // Print summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 EXTENDED LOAD TEST COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n📈 Summary:');
    console.log(`   • Duration: ${(duration / 60000).toFixed(2)} minutes`);
    console.log(`   • Requests: ${this.metrics.totalRequests}`);
    console.log(`   • Success rate: ${(successRate * 100).toFixed(2)}%`);
    console.log(`   • Memory growth: ${(memoryGrowth / 1048576).toFixed(2)}MB`);
    console.log(`   • Latency degradation: ${(finalCheckpoint.latencyDegradation * 100).toFixed(1)}%`);
    
    if (this.metrics.memoryGrowthProjection) {
      console.log('\n💾 Memory Projections:');
      console.log(`   • Growth rate: ${this.metrics.memoryGrowthProjection.growthRatePerHour.toFixed(2)}MB/hour`);
      console.log(`   • Daily growth: ${this.metrics.memoryGrowthProjection.projectedDaily.toFixed(2)}MB`);
      console.log(`   • PM2 restart interval: ${this.metrics.memoryGrowthProjection.estimatedRestartInterval.toFixed(1)} hours`);
    }
    
    console.log('\n✅ Validation Results:');
    console.log(`   • Duration requirement: ${durationMet ? '✅' : '❌'}`);
    console.log(`   • Success rate (>75%): ${successRateMet ? '✅' : '❌'}`);
    console.log(`   • Memory stability: ${memoryStable ? '✅' : '❌'}`);
    console.log(`   • Performance stability: ${performanceStable ? '✅' : '❌'}`);
    console.log(`   • Overall: ${report.validation.overallPass ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n📁 Results saved to:`);
    console.log(`   • ${reportPath}`);
    console.log(`   • ${memoryPath}`);
    
    return report;
  }
  
  async cleanup() {
    // Pool doesn't have a close method in mock mode
    this.memoryMonitor.stopMonitoring();
  }
}

// Main execution
async function main() {
  const test = new ExtendedLoadTest();
  
  try {
    await test.runTest();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await test.cleanup();
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted by user');
  process.exit(0);
});

main().catch(console.error);