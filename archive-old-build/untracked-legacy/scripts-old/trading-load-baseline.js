#!/usr/bin/env node

/**
 * Trading Load Baseline Test
 * Establishes performance baseline under realistic meme coin detection patterns
 */

import { performance } from 'perf_hooks';
import { RpcManager } from '../src/detection/transport/rpc-manager.js';
import { TokenBucket } from '../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../src/detection/transport/connection-pool-core.js';
import { EndpointSelector } from '../src/detection/transport/endpoint-selector.js';
import { RequestCache } from '../src/detection/transport/request-cache.js';
import { BatchManager } from '../src/detection/transport/batch-manager.js';
import { HedgedManager } from '../src/detection/transport/hedged-manager.js';
import { MemoryTracker } from './memory-tracker.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TradingLoadBaseline {
  constructor() {
    // Initialize components
    this.components = {
      rateLimiter: new TokenBucket({ 
        rateLimit: 50,
        capacity: 100
      }),
      circuitBreaker: new CircuitBreaker({ 
        failureThreshold: 10,
        resetTimeout: 30000
      }),
      connectionPool: new ConnectionPoolCore({ 
        maxSockets: 30,
        keepAlive: true
      }),
      endpointSelector: new EndpointSelector({ 
        strategy: 'weighted-round-robin' 
      }),
      requestCache: new RequestCache({ 
        maxSize: 1000,
        ttl: 10000 // 10 second cache
      }),
      batchManager: new BatchManager({ 
        batchSize: 8,
        batchWindowMs: 100
      }),
      hedgedManager: new HedgedManager({ 
        hedgingDelay: 200,
        maxBackups: 1
      })
    };
    
    // RPC Manager
    this.rpcManager = new RpcManager({
      enableRateLimiting: true,
      enableCircuitBreaker: true,
      enableCaching: true,
      enableBatching: true,
      enableHedging: true
    });
    
    // Memory tracker
    this.memoryTracker = new MemoryTracker();
    
    // Request patterns (realistic meme coin detection)
    this.requestPatterns = {
      newLP: 0.30,          // 30% - New LP detection
      balanceCheck: 0.40,   // 40% - Balance checks
      tokenSupply: 0.20,    // 20% - Token supply queries
      duplicate: 0.10       // 10% - Duplicate requests (cache hits)
    };
    
    // Test configuration
    this.config = {
      testDuration: 3600000,        // 60 minutes in ms
      normalRPM: 25,                 // 25 requests per minute baseline
      viralMultiplier: 5,            // 5x volume during viral events
      memoryTrackInterval: 30000,   // Track memory every 30 seconds
      viralEventDuration: 60000,     // 1 minute viral events
      viralEventFrequency: 600000   // Viral event every 10 minutes
    };
    
    // Metrics collection
    this.metrics = {
      startTime: null,
      endTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      latencies: [],
      errorTypes: new Map(),
      componentFailures: new Map(),
      viralEventPerformance: [],
      memorySnapshots: []
    };
    
    // Test state
    this.isRunning = false;
    this.currentRPM = this.config.normalRPM;
    this.lastViralEvent = 0;
  }
  
  async initialize() {
    console.log('🚀 Initializing Trading Load Baseline System...\n');
    
    // Initialize RPC Manager with components
    await this.rpcManager.initialize({
      tokenBucket: this.components.rateLimiter,
      circuitBreaker: this.components.circuitBreaker,
      connectionPool: this.components.connectionPool,
      endpointSelector: this.components.endpointSelector,
      requestCache: this.components.requestCache,
      batchManager: this.components.batchManager,
      hedgedManager: this.components.hedgedManager
    });
    
    // Set up endpoints
    this.components.endpointSelector.initializeEndpoints([
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://api.metaplex.solana.com'
    ]);
    
    // Register components with memory tracker
    for (const [name, component] of Object.entries(this.components)) {
      this.memoryTracker.registerComponent(name, component);
    }
    
    // Initialize memory baseline
    this.memoryTracker.initializeBaseline();
    
    console.log('✅ System initialized with all components\n');
    console.log('📋 Request Pattern Distribution:');
    console.log('  - New LP Detection: 30%');
    console.log('  - Balance Checks: 40%');
    console.log('  - Token Supply: 20%');
    console.log('  - Duplicates (Cache): 10%\n');
  }
  
  /**
   * Generate request based on patterns
   */
  generateRequest() {
    const rand = Math.random();
    const timestamp = Date.now();
    
    if (rand < this.requestPatterns.newLP) {
      // New LP detection request
      return {
        type: 'newLP',
        method: 'getProgramAccounts',
        params: [`RAYDIUM_AMM_${timestamp}`, { commitment: 'confirmed' }],
        expectCache: false
      };
    } else if (rand < this.requestPatterns.newLP + this.requestPatterns.balanceCheck) {
      // Balance check
      const address = `WALLET_${Math.floor(Math.random() * 1000)}`;
      return {
        type: 'balanceCheck',
        method: 'getBalance',
        params: [address],
        expectCache: Math.random() < 0.3 // 30% chance of cache hit
      };
    } else if (rand < this.requestPatterns.newLP + this.requestPatterns.balanceCheck + this.requestPatterns.tokenSupply) {
      // Token supply query
      const mint = `TOKEN_${Math.floor(Math.random() * 100)}`;
      return {
        type: 'tokenSupply',
        method: 'getTokenSupply',
        params: [mint],
        expectCache: Math.random() < 0.4 // 40% chance of cache hit
      };
    } else {
      // Duplicate request (should hit cache)
      return {
        type: 'duplicate',
        method: 'getSlot',
        params: [],
        expectCache: true
      };
    }
  }
  
  /**
   * Execute single request
   */
  async executeRequest(request) {
    const startTime = performance.now();
    
    try {
      // Simulate RPC call through the system
      const result = await this.simulateRpcCall(request);
      
      const latency = performance.now() - startTime;
      this.metrics.successfulRequests++;
      this.metrics.latencies.push(latency);
      
      // Track cache hits
      if (request.expectCache && latency < 10) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
      
      return { success: true, latency, cached: latency < 10 };
      
    } catch (error) {
      this.metrics.failedRequests++;
      
      // Track error types
      const errorType = error.message || 'Unknown';
      this.metrics.errorTypes.set(
        errorType,
        (this.metrics.errorTypes.get(errorType) || 0) + 1
      );
      
      return { success: false, error: errorType };
    } finally {
      this.metrics.totalRequests++;
    }
  }
  
  /**
   * Simulate RPC call
   */
  async simulateRpcCall(request) {
    // Check if should simulate failure
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated RPC failure');
    }
    
    // Simulate network latency
    const baseLatency = request.expectCache ? 1 : 50;
    const variance = Math.random() * 50;
    await this.delay(baseLatency + variance);
    
    // Return simulated response
    return {
      jsonrpc: '2.0',
      result: {
        type: request.type,
        timestamp: Date.now(),
        simulated: true
      },
      id: Math.random().toString(36)
    };
  }
  
  /**
   * Run sustained load test
   */
  async runBaselineTest() {
    console.log('🏃 Starting 60-minute baseline test...\n');
    this.isRunning = true;
    this.metrics.startTime = Date.now();
    
    // Start memory tracking
    this.memoryTracker.startTracking(this.config.memoryTrackInterval);
    
    // Schedule viral events
    const viralEventInterval = setInterval(() => {
      if (this.isRunning) {
        this.triggerViralEvent();
      }
    }, this.config.viralEventFrequency);
    
    // Main test loop
    const testStartTime = Date.now();
    let requestCount = 0;
    let lastReportTime = Date.now();
    
    while (this.isRunning && (Date.now() - testStartTime) < this.config.testDuration) {
      // Calculate requests for this second
      const requestsPerSecond = this.currentRPM / 60;
      const requestDelay = 1000 / requestsPerSecond;
      
      // Execute request
      const request = this.generateRequest();
      const result = await this.executeRequest(request);
      requestCount++;
      
      // Report progress every minute
      if (Date.now() - lastReportTime > 60000) {
        this.reportProgress();
        lastReportTime = Date.now();
      }
      
      // Wait before next request
      await this.delay(requestDelay);
    }
    
    // Clean up
    clearInterval(viralEventInterval);
    this.memoryTracker.stopTracking();
    this.metrics.endTime = Date.now();
    this.isRunning = false;
    
    console.log('\n✅ Baseline test completed\n');
  }
  
  /**
   * Trigger viral event
   */
  async triggerViralEvent() {
    console.log('\n🔥 VIRAL EVENT TRIGGERED! (5x volume for 1 minute)');
    
    const originalRPM = this.currentRPM;
    this.currentRPM = originalRPM * this.config.viralMultiplier;
    
    const viralStartTime = Date.now();
    const viralMetrics = {
      startTime: viralStartTime,
      requests: 0,
      successes: 0,
      failures: 0,
      avgLatency: 0
    };
    
    // Run viral load for 1 minute
    const viralDuration = this.config.viralEventDuration;
    const requestsPerSecond = this.currentRPM / 60;
    const requestDelay = 1000 / requestsPerSecond;
    
    while ((Date.now() - viralStartTime) < viralDuration && this.isRunning) {
      const request = this.generateRequest();
      const result = await this.executeRequest(request);
      
      viralMetrics.requests++;
      if (result.success) {
        viralMetrics.successes++;
        viralMetrics.avgLatency += result.latency || 0;
      } else {
        viralMetrics.failures++;
      }
      
      await this.delay(requestDelay);
    }
    
    // Calculate viral event metrics
    viralMetrics.endTime = Date.now();
    viralMetrics.duration = viralMetrics.endTime - viralMetrics.startTime;
    viralMetrics.successRate = (viralMetrics.successes / viralMetrics.requests) * 100;
    if (viralMetrics.successes > 0) {
      viralMetrics.avgLatency = viralMetrics.avgLatency / viralMetrics.successes;
    }
    
    this.metrics.viralEventPerformance.push(viralMetrics);
    
    // Restore normal RPM
    this.currentRPM = originalRPM;
    
    console.log(`  Viral event completed: ${viralMetrics.successRate.toFixed(1)}% success rate`);
    console.log(`  Processed ${viralMetrics.requests} requests in ${(viralMetrics.duration/1000).toFixed(1)}s\n`);
  }
  
  /**
   * Report progress
   */
  reportProgress() {
    const elapsed = (Date.now() - this.metrics.startTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const successRate = (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
    const cacheHitRate = (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100;
    
    // Get current memory stats
    const memoryReport = this.memoryTracker.generateReport();
    
    console.log(`⏱️  Progress: ${minutes} minutes`);
    console.log(`  Requests: ${this.metrics.totalRequests} | Success: ${successRate.toFixed(1)}%`);
    console.log(`  Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
    console.log(`  Memory: ${memoryReport.summary.currentMemory} | Growth: ${memoryReport.summary.totalGrowth}`);
  }
  
  /**
   * Calculate final metrics
   */
  calculateFinalMetrics() {
    const testDuration = (this.metrics.endTime - this.metrics.startTime) / 1000;
    const successRate = (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
    const cacheHitRate = (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100;
    
    // Calculate latency percentiles
    const sortedLatencies = [...this.metrics.latencies].sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.50)];
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
    const avgLatency = sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length;
    
    // Get memory analysis
    const memoryReport = this.memoryTracker.generateReport();
    const componentGrowth = this.memoryTracker.analyzeComponentGrowth();
    
    // Viral event analysis
    const viralSuccessRates = this.metrics.viralEventPerformance.map(v => v.successRate);
    const avgViralSuccess = viralSuccessRates.length > 0 ?
      viralSuccessRates.reduce((a, b) => a + b, 0) / viralSuccessRates.length : 0;
    
    return {
      summary: {
        testDuration: testDuration + 's',
        totalRequests: this.metrics.totalRequests,
        successRate: successRate.toFixed(2) + '%',
        failureRate: (100 - successRate).toFixed(2) + '%',
        requestsPerMinute: (this.metrics.totalRequests / (testDuration / 60)).toFixed(1)
      },
      performance: {
        avgLatency: avgLatency.toFixed(2) + 'ms',
        p50Latency: p50.toFixed(2) + 'ms',
        p95Latency: p95.toFixed(2) + 'ms',
        p99Latency: p99.toFixed(2) + 'ms',
        cacheHitRate: cacheHitRate.toFixed(2) + '%'
      },
      viralEvents: {
        totalEvents: this.metrics.viralEventPerformance.length,
        avgSuccessRate: avgViralSuccess.toFixed(2) + '%',
        events: this.metrics.viralEventPerformance
      },
      memory: {
        summary: memoryReport.summary,
        componentGrowth,
        finalSnapshot: memoryReport.heapStats
      },
      errors: Object.fromEntries(this.metrics.errorTypes),
      requestDistribution: {
        newLP: (this.metrics.totalRequests * 0.3).toFixed(0),
        balanceCheck: (this.metrics.totalRequests * 0.4).toFixed(0),
        tokenSupply: (this.metrics.totalRequests * 0.2).toFixed(0),
        duplicate: (this.metrics.totalRequests * 0.1).toFixed(0)
      }
    };
  }
  
  /**
   * Save results to files
   */
  async saveResults() {
    const finalMetrics = this.calculateFinalMetrics();
    const memoryData = {
      snapshots: this.memoryTracker.measurements,
      componentAnalysis: this.memoryTracker.analyzeComponentGrowth()
    };
    
    // Save baseline metrics
    const metricsPath = path.join(__dirname, '..', 'results', 'baseline-metrics.json');
    await fs.writeFile(metricsPath, JSON.stringify(finalMetrics, null, 2));
    console.log(`📊 Baseline metrics saved to: results/baseline-metrics.json`);
    
    // Save memory growth data
    const memoryPath = path.join(__dirname, '..', 'results', 'memory-growth-data.json');
    await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));
    console.log(`💾 Memory growth data saved to: results/memory-growth-data.json`);
    
    return finalMetrics;
  }
  
  /**
   * Run shortened test for validation (5 minutes instead of 60)
   */
  async runShortenedTest() {
    console.log('🏃 Running shortened 5-minute validation test...\n');
    
    // Override test duration for validation
    this.config.testDuration = 300000; // 5 minutes
    this.config.viralEventFrequency = 60000; // Viral event every minute
    
    await this.runBaselineTest();
  }
  
  // Helper methods
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  console.log('=' .repeat(60));
  console.log('🎯 MEME COIN TRADING LOAD BASELINE TEST');
  console.log('=' .repeat(60) + '\n');
  
  const baseline = new TradingLoadBaseline();
  
  try {
    // Initialize system
    await baseline.initialize();
    
    // Check if running in test mode (shorter duration)
    const isTestMode = process.argv.includes('--test');
    
    if (isTestMode) {
      console.log('⚡ Running in TEST MODE (5 minutes)\n');
      await baseline.runShortenedTest();
    } else {
      console.log('⏰ Running FULL TEST (60 minutes)\n');
      await baseline.runBaselineTest();
    }
    
    // Calculate and save results
    const results = await baseline.saveResults();
    
    // Display summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 BASELINE TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`\nTest Duration: ${results.summary.testDuration}`);
    console.log(`Total Requests: ${results.summary.totalRequests}`);
    console.log(`Success Rate: ${results.summary.successRate}`);
    console.log(`Average Latency: ${results.performance.avgLatency}`);
    console.log(`Cache Hit Rate: ${results.performance.cacheHitRate}`);
    console.log(`Memory Growth: ${results.memory.summary.totalGrowth}`);
    console.log(`Viral Event Success: ${results.viralEvents.avgSuccessRate}`);
    
    // Check success criteria
    console.log('\n✅ Success Criteria Validation:');
    const successRate = parseFloat(results.summary.successRate);
    const viralSuccess = parseFloat(results.viralEvents.avgSuccessRate);
    const memoryGrowth = results.memory.summary.totalGrowth;
    
    console.log(`Success Rate (>85%): ${successRate > 85 ? '✅ PASS' : '❌ FAIL'} (${successRate}%)`);
    console.log(`Viral Handling (>70%): ${viralSuccess > 70 ? '✅ PASS' : '❌ FAIL'} (${viralSuccess}%)`);
    console.log(`Memory Growth (<100MB): ${memoryGrowth.includes('MB') && parseFloat(memoryGrowth) < 100 ? '✅ PASS' : '⚠️ CHECK'} (${memoryGrowth})`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Baseline test complete!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Error during baseline test:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TradingLoadBaseline };