#!/usr/bin/env node

/**
 * Market Volatility Performance Test
 * Validates system performance during extreme market conditions
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ViralEventSimulator } from './simulate-viral-events.js';

// Import system components - using mock implementations for testing
// In production, these would be imported from the actual adapter files

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock component implementations for testing
class TokenBucket {
  constructor(config) {
    this.rateLimit = config.rateLimit || 100;
    this.maxTokens = config.maxTokens || 200;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
  
  async acquire() {
    // Refill tokens
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.rateLimit);
    this.lastRefill = now;
    
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }
}

class CircuitBreaker {
  constructor(config) {
    this.threshold = config.threshold || 10;
    this.timeout = config.timeout || 30000;
    this.resetTimeout = config.resetTimeout || 10000;
    this.failures = 0;
    this.successes = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.lastFailTime = null;
  }
  
  getState() {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN' && this.lastFailTime) {
      if (Date.now() - this.lastFailTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      }
    }
    return this.state;
  }
  
  recordSuccess() {
    this.successes++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = 0;
    }
  }
  
  recordFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

class ConnectionPoolCore {
  constructor(config) {
    this.maxSockets = config.maxSockets || 50;
    this.timeout = config.timeout || 5000;
    this.keepAlive = config.keepAlive || true;
    this.maxFreeSockets = config.maxFreeSockets || 10;
    this.activeSockets = 0;
  }
  
  async getConnection() {
    if (this.activeSockets < this.maxSockets) {
      this.activeSockets++;
      return { id: Math.random().toString(36) };
    }
    return null;
  }
  
  releaseConnection(conn) {
    if (this.activeSockets > 0) {
      this.activeSockets--;
    }
  }
}

class EndpointSelector {
  constructor(config) {
    this.endpoints = config.endpoints || [];
    this.strategy = config.strategy || 'round-robin';
    this.healthCheckInterval = config.healthCheckInterval || 30000;
    this.currentIndex = 0;
    this.healthyEndpoints = [...this.endpoints];
  }
  
  async select() {
    if (this.healthyEndpoints.length === 0) {
      return null;
    }
    
    if (this.strategy === 'round-robin') {
      const endpoint = this.healthyEndpoints[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.healthyEndpoints.length;
      return endpoint;
    }
    
    // Random selection as fallback
    return this.healthyEndpoints[Math.floor(Math.random() * this.healthyEndpoints.length)];
  }
  
  markUnhealthy(endpoint) {
    this.healthyEndpoints = this.healthyEndpoints.filter(e => e !== endpoint);
  }
}

class RequestCache {
  constructor(config) {
    this.maxSize = config.maxSize || 1000;
    this.ttl = config.ttl || 10000;
    this.cache = new Map();
  }
  
  async get(key) {
    const entry = this.cache.get(key);
    if (entry) {
      if (Date.now() - entry.timestamp < this.ttl) {
        return entry.value;
      }
      this.cache.delete(key);
    }
    return null;
  }
  
  async set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }
}

class BatchManager {
  constructor(config) {
    this.maxBatchSize = config.maxBatchSize || 20;
    this.batchTimeout = config.batchTimeout || 100;
    this.maxQueueSize = config.maxQueueSize || 1000;
    this.queue = [];
  }
  
  async add(request) {
    if (this.queue.length < this.maxQueueSize) {
      this.queue.push(request);
      return true;
    }
    return false;
  }
  
  async flush() {
    const batch = this.queue.splice(0, this.maxBatchSize);
    return batch;
  }
}

class HedgedManager {
  constructor(config) {
    this.hedgeDelay = config.hedgeDelay || 100;
    this.maxHedges = config.maxHedges || 2;
    this.activeHedges = 0;
  }
  
  async hedge(request) {
    if (this.activeHedges < this.maxHedges) {
      this.activeHedges++;
      setTimeout(() => this.activeHedges--, this.hedgeDelay);
      return true;
    }
    return false;
  }
}

class MarketVolatilityTest {
  constructor() {
    this.components = {
      rateLimiter: new TokenBucket({
        rateLimit: 100,
        maxTokens: 200
      }),
      
      circuitBreaker: new CircuitBreaker({
        threshold: 10,
        timeout: 30000,
        resetTimeout: 10000
      }),
      
      connectionPool: new ConnectionPoolCore({
        maxSockets: 50,
        timeout: 5000,
        keepAlive: true,
        maxFreeSockets: 10
      }),
      
      endpointSelector: new EndpointSelector({
        endpoints: [
          'https://api.mainnet-beta.solana.com',
          'https://solana-api.projectserum.com',
          'https://rpc.ankr.com/solana'
        ],
        strategy: 'round-robin',
        healthCheckInterval: 30000
      }),
      
      requestCache: new RequestCache({
        maxSize: 1000,
        ttl: 10000
      }),
      
      batchManager: new BatchManager({
        maxBatchSize: 20,
        batchTimeout: 100,
        maxQueueSize: 1000
      }),
      
      hedgedManager: new HedgedManager({
        hedgeDelay: 100,
        maxHedges: 2
      })
    };
    
    this.simulator = new ViralEventSimulator();
    
    this.metrics = {
      startTime: null,
      endTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      detectionAccuracy: 0,
      circuitBreakerTrips: 0,
      endpointFailovers: 0,
      componentFailures: [],
      recoveryTimes: [],
      profitOpportunities: {
        detected: 0,
        missed: 0,
        falsePositives: 0
      },
      performanceDuringSpikes: []
    };
    
    this.testConfig = {
      duration: 60000,             // 1 minute (optimized for demo)
      baseRequestRate: 10,        // 10 RPS baseline
      viralEventFrequency: 4,     // 4 events per minute
      targetAccuracy: 0.70,        // 70% accuracy target
      maxRecoveryTime: 120000,    // 2 minutes max recovery
      profitThreshold: 100        // 100x volume indicates profit opportunity
    };
  }
  
  /**
   * Process request through system components
   */
  async processRequest(request, networkCondition = 'NORMAL') {
    const startTime = Date.now();
    const result = {
      success: false,
      latency: 0,
      componentMetrics: {},
      errors: []
    };
    
    try {
      // 1. Rate limiting
      const rateLimitStart = Date.now();
      const canProceed = await this.components.rateLimiter.acquire();
      result.componentMetrics.rateLimiter = Date.now() - rateLimitStart;
      
      if (!canProceed) {
        result.errors.push('Rate limit exceeded');
        return result;
      }
      
      // 2. Circuit breaker check
      const circuitStart = Date.now();
      if (this.components.circuitBreaker.getState() === 'OPEN') {
        this.metrics.circuitBreakerTrips++;
        
        // Allow some requests through during profit opportunities
        if (request.isProfitOpportunity && Math.random() < 0.3) {
          // 30% chance to bypass for profit opportunities
        } else {
          result.errors.push('Circuit breaker open');
          result.componentMetrics.circuitBreaker = Date.now() - circuitStart;
          return result;
        }
      }
      result.componentMetrics.circuitBreaker = Date.now() - circuitStart;
      
      // 3. Endpoint selection
      const endpointStart = Date.now();
      const endpoint = await this.components.endpointSelector.select();
      result.componentMetrics.endpointSelector = Date.now() - endpointStart;
      
      if (!endpoint) {
        this.metrics.endpointFailovers++;
        result.errors.push('No healthy endpoints');
        return result;
      }
      
      // 4. Check cache
      const cacheStart = Date.now();
      const cacheKey = `${request.type}_${request.tokenAddress}`;
      const cached = await this.components.requestCache.get(cacheKey);
      result.componentMetrics.requestCache = Date.now() - cacheStart;
      
      if (cached) {
        result.success = true;
        result.cached = true;
        result.latency = Date.now() - startTime;
        return result;
      }
      
      // 5. Simulate network request with conditions
      const requestLatency = this.simulateNetworkLatency(networkCondition, request.shouldFail);
      await new Promise(resolve => setTimeout(resolve, requestLatency));
      
      // 6. Handle failure scenarios
      if (request.shouldFail) {
        if (Math.random() < 0.6) { // 60% of failures are recoverable
          this.components.circuitBreaker.recordFailure();
          
          // Try hedged request
          const hedgedStart = Date.now();
          const hedgeSuccess = Math.random() < 0.4; // 40% hedge success rate
          result.componentMetrics.hedgedManager = Date.now() - hedgedStart;
          
          if (!hedgeSuccess) {
            result.errors.push('Request failed after hedging');
            return result;
          }
        } else {
          result.errors.push('Unrecoverable failure');
          return result;
        }
      }
      
      // 7. Record success
      this.components.circuitBreaker.recordSuccess();
      await this.components.requestCache.set(cacheKey, { data: 'mock_data' });
      
      result.success = true;
      result.latency = Date.now() - startTime;
      
    } catch (error) {
      result.errors.push(error.message);
      result.latency = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * Simulate network latency based on conditions
   */
  simulateNetworkLatency(condition, willFail) {
    const baseLatencies = {
      NORMAL: 50,
      DEGRADED: 200,
      CONGESTED: 500,
      EXTREME: 2000
    };
    
    let latency = baseLatencies[condition] || baseLatencies.NORMAL;
    
    // Add jitter
    latency += Math.random() * 100 - 50;
    
    // Failed requests often timeout
    if (willFail) {
      latency *= 2;
    }
    
    return Math.max(10, Math.min(5000, latency)); // 10ms to 5s
  }
  
  /**
   * Detect profit opportunities
   */
  detectProfitOpportunity(event) {
    // High volume + specific patterns indicate profit opportunity
    const isProfitOpportunity = 
      event.volumeMultiplier >= this.testConfig.profitThreshold &&
      (event.type === 'WHALE_BUY' || 
       event.type === 'INFLUENCER_SHILL' || 
       event.type === 'LAUNCH_FRENZY');
    
    if (isProfitOpportunity) {
      // Simulate detection accuracy during high volatility
      const detected = Math.random() < this.metrics.detectionAccuracy;
      
      if (detected) {
        this.metrics.profitOpportunities.detected++;
      } else {
        this.metrics.profitOpportunities.missed++;
      }
      
      // Check for false positives
      if (!isProfitOpportunity && detected) {
        this.metrics.profitOpportunities.falsePositives++;
      }
    }
    
    return isProfitOpportunity;
  }
  
  /**
   * Test component isolation
   */
  async testComponentIsolation(failureScenario) {
    const isolationResults = {
      timestamp: Date.now(),
      scenario: failureScenario,
      cascaded: false,
      affectedComponents: [],
      recoveryTime: 0
    };
    
    // Simulate component failure
    const failedComponent = failureScenario.component;
    isolationResults.affectedComponents.push(failedComponent);
    
    // Check if failure cascades
    const cascadeChance = {
      rateLimiter: 0.1,      // 10% cascade chance
      circuitBreaker: 0.05,  // 5% cascade chance
      connectionPool: 0.3,   // 30% cascade chance
      endpointSelector: 0.4, // 40% cascade chance
      requestCache: 0.1,     // 10% cascade chance
      batchManager: 0.2,     // 20% cascade chance
      hedgedManager: 0.15    // 15% cascade chance
    };
    
    if (Math.random() < (cascadeChance[failedComponent] || 0.1)) {
      isolationResults.cascaded = true;
      
      // Randomly affect other components
      const otherComponents = Object.keys(this.components).filter(c => c !== failedComponent);
      const numAffected = Math.floor(Math.random() * 3) + 1; // 1-3 additional components
      
      for (let i = 0; i < numAffected && i < otherComponents.length; i++) {
        const randomComponent = otherComponents[Math.floor(Math.random() * otherComponents.length)];
        if (!isolationResults.affectedComponents.includes(randomComponent)) {
          isolationResults.affectedComponents.push(randomComponent);
        }
      }
    }
    
    // Simulate recovery
    const baseRecoveryTime = 5000; // 5 seconds base
    const additionalTime = isolationResults.cascaded ? 
      isolationResults.affectedComponents.length * 10000 : // 10s per cascaded component
      0;
    
    isolationResults.recoveryTime = baseRecoveryTime + additionalTime + Math.random() * 5000;
    
    // Wait for recovery
    await new Promise(resolve => setTimeout(resolve, isolationResults.recoveryTime));
    
    this.metrics.componentFailures.push(isolationResults);
    this.metrics.recoveryTimes.push(isolationResults.recoveryTime);
    
    return isolationResults;
  }
  
  /**
   * Run volatility test
   */
  async runVolatilityTest() {
    console.log('🔥 Starting Market Volatility Test\n');
    console.log(`Duration: ${this.testConfig.duration / 1000} seconds`);
    console.log(`Target Accuracy: ${this.testConfig.targetAccuracy * 100}%`);
    console.log(`Max Recovery Time: ${this.testConfig.maxRecoveryTime / 1000} seconds\n`);
    
    this.metrics.startTime = Date.now();
    const endTime = Date.now() + this.testConfig.duration;
    
    // Generate viral events schedule
    const events = [];
    let nextEventTime = Date.now() + 5000; // First event after 5 seconds
    
    while (nextEventTime < endTime) {
      events.push({
        time: nextEventTime,
        event: this.simulator.generateViralEvent()
      });
      nextEventTime += (60000 / this.testConfig.viralEventFrequency) + Math.random() * 10000;
    }
    
    let currentEventIndex = 0;
    let currentEvent = null;
    let networkCondition = 'NORMAL';
    
    // Main test loop
    while (Date.now() < endTime) {
      // Check for viral events
      if (currentEventIndex < events.length && Date.now() >= events[currentEventIndex].time) {
        currentEvent = events[currentEventIndex].event;
        currentEventIndex++;
        
        console.log(`\n🚀 ${currentEvent.name} Started!`);
        console.log(`  Volume: ${currentEvent.volumeMultiplier}x`);
        console.log(`  Failure Rate: ${(currentEvent.failureRate * 100).toFixed(0)}%`);
        
        // Update network condition based on event
        if (currentEvent.failureRate > 0.5) {
          networkCondition = 'EXTREME';
        } else if (currentEvent.failureRate > 0.25) {
          networkCondition = 'CONGESTED';
        } else {
          networkCondition = 'DEGRADED';
        }
        
        // Check for profit opportunity
        this.detectProfitOpportunity(currentEvent);
        
        // Test component isolation during high stress
        if (currentEvent.volumeMultiplier > 500 && Math.random() < 0.3) {
          const failureScenario = {
            component: Object.keys(this.components)[Math.floor(Math.random() * 7)],
            reason: 'High volume stress'
          };
          
          console.log(`  ⚠️ Testing component isolation: ${failureScenario.component}`);
          const isolation = await this.testComponentIsolation(failureScenario);
          
          if (isolation.cascaded) {
            console.log(`  ❌ Failure cascaded to: ${isolation.affectedComponents.join(', ')}`);
          } else {
            console.log(`  ✅ Failure isolated to: ${failureScenario.component}`);
          }
        }
      }
      
      // Reset to normal if event ended
      if (currentEvent && Date.now() > currentEvent.endTime) {
        console.log(`  Event ended. Returning to normal operations.`);
        currentEvent = null;
        networkCondition = 'NORMAL';
      }
      
      // Calculate request rate
      const requestRate = currentEvent ? 
        this.testConfig.baseRequestRate * currentEvent.volumeMultiplier :
        this.testConfig.baseRequestRate;
      
      // Process batch of requests
      const batchSize = Math.min(100, Math.floor(requestRate / 10)); // Process in batches
      const requests = [];
      
      for (let i = 0; i < batchSize; i++) {
        const request = {
          id: `test_${Date.now()}_${i}`,
          type: currentEvent ? 
            this.simulator.selectRequestType(currentEvent.pattern) : 
            'balanceCheck',
          tokenAddress: this.simulator.generateTokenAddress(),
          shouldFail: currentEvent ? 
            Math.random() < currentEvent.failureRate : 
            Math.random() < 0.05, // 5% baseline failure
          isProfitOpportunity: currentEvent && currentEvent.volumeMultiplier > this.testConfig.profitThreshold
        };
        
        requests.push(this.processRequest(request, networkCondition));
      }
      
      // Wait for batch to complete
      const results = await Promise.all(requests);
      
      // Update metrics
      this.metrics.totalRequests += results.length;
      this.metrics.successfulRequests += results.filter(r => r.success).length;
      this.metrics.failedRequests += results.filter(r => !r.success).length;
      
      // Track performance during spike
      if (currentEvent) {
        const spikeAccuracy = results.filter(r => r.success).length / results.length;
        this.metrics.performanceDuringSpikes.push({
          timestamp: Date.now(),
          eventType: currentEvent.type,
          volumeMultiplier: currentEvent.volumeMultiplier,
          accuracy: spikeAccuracy,
          averageLatency: results.reduce((sum, r) => sum + r.latency, 0) / results.length
        });
      }
      
      // Update running accuracy
      this.metrics.detectionAccuracy = this.metrics.successfulRequests / this.metrics.totalRequests;
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.metrics.endTime = Date.now();
    
    return this.generateResults();
  }
  
  /**
   * Generate test results
   */
  generateResults() {
    const duration = (this.metrics.endTime - this.metrics.startTime) / 1000;
    const overallAccuracy = this.metrics.successfulRequests / this.metrics.totalRequests;
    const averageRecoveryTime = this.metrics.recoveryTimes.length > 0 ?
      this.metrics.recoveryTimes.reduce((a, b) => a + b, 0) / this.metrics.recoveryTimes.length :
      0;
    
    // Calculate accuracy during spikes
    const spikeAccuracy = this.metrics.performanceDuringSpikes.length > 0 ?
      this.metrics.performanceDuringSpikes.reduce((sum, s) => sum + s.accuracy, 0) / 
      this.metrics.performanceDuringSpikes.length :
      0;
    
    // Check for cascading failures
    const cascadingFailures = this.metrics.componentFailures.filter(f => f.cascaded);
    
    const results = {
      summary: {
        testDuration: `${duration} seconds`,
        totalRequests: this.metrics.totalRequests,
        successRate: `${(overallAccuracy * 100).toFixed(2)}%`,
        accuracyDuringSpikes: `${(spikeAccuracy * 100).toFixed(2)}%`,
        circuitBreakerTrips: this.metrics.circuitBreakerTrips,
        endpointFailovers: this.metrics.endpointFailovers,
        componentFailures: this.metrics.componentFailures.length,
        cascadingFailures: cascadingFailures.length,
        averageRecoveryTime: `${(averageRecoveryTime / 1000).toFixed(1)} seconds`,
        maxRecoveryTime: `${(Math.max(...this.metrics.recoveryTimes) / 1000).toFixed(1)} seconds`
      },
      
      profitOpportunities: this.metrics.profitOpportunities,
      
      performanceByVolume: this.categorizePerformanceByVolume(),
      
      validation: {
        accuracyTarget: overallAccuracy >= this.testConfig.targetAccuracy,
        spikeAccuracyTarget: spikeAccuracy >= this.testConfig.targetAccuracy,
        recoveryTimeTarget: averageRecoveryTime <= this.testConfig.maxRecoveryTime,
        circuitBreakerFunction: this.metrics.circuitBreakerTrips > 0,
        endpointFailoverFunction: this.metrics.endpointFailovers > 0,
        cascadePreventionTarget: cascadingFailures.length === 0 || 
                                 (cascadingFailures.length / this.metrics.componentFailures.length) < 0.2
      },
      
      recommendations: this.generateRecommendations(overallAccuracy, spikeAccuracy, cascadingFailures)
    };
    
    return results;
  }
  
  /**
   * Categorize performance by volume levels
   */
  categorizePerformanceByVolume() {
    const categories = {
      low: { range: '1x-10x', data: [] },
      medium: { range: '10x-100x', data: [] },
      high: { range: '100x-500x', data: [] },
      extreme: { range: '500x+', data: [] }
    };
    
    for (const spike of this.metrics.performanceDuringSpikes) {
      if (spike.volumeMultiplier < 10) {
        categories.low.data.push(spike);
      } else if (spike.volumeMultiplier < 100) {
        categories.medium.data.push(spike);
      } else if (spike.volumeMultiplier < 500) {
        categories.high.data.push(spike);
      } else {
        categories.extreme.data.push(spike);
      }
    }
    
    // Calculate averages for each category
    for (const category of Object.values(categories)) {
      if (category.data.length > 0) {
        category.averageAccuracy = 
          (category.data.reduce((sum, d) => sum + d.accuracy, 0) / category.data.length * 100).toFixed(2) + '%';
        category.averageLatency = 
          (category.data.reduce((sum, d) => sum + d.averageLatency, 0) / category.data.length).toFixed(0) + 'ms';
        category.count = category.data.length;
        delete category.data; // Remove raw data from output
      } else {
        category.averageAccuracy = 'N/A';
        category.averageLatency = 'N/A';
        category.count = 0;
      }
    }
    
    return categories;
  }
  
  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(overallAccuracy, spikeAccuracy, cascadingFailures) {
    const recommendations = [];
    
    if (spikeAccuracy < this.testConfig.targetAccuracy) {
      recommendations.push('Increase connection pool size for high-volume periods');
      recommendations.push('Implement adaptive rate limiting based on market conditions');
    }
    
    if (this.metrics.circuitBreakerTrips > 10) {
      recommendations.push('Tune circuit breaker thresholds to reduce false trips during volatility');
    }
    
    if (cascadingFailures.length > 0) {
      recommendations.push('Improve component isolation with better error boundaries');
      recommendations.push('Implement bulkheads pattern to prevent cascade failures');
    }
    
    if (this.metrics.profitOpportunities.missed > this.metrics.profitOpportunities.detected) {
      recommendations.push('Prioritize profit opportunity detection during high volatility');
      recommendations.push('Implement priority queue for high-value token detections');
    }
    
    if (Math.max(...this.metrics.recoveryTimes) > this.testConfig.maxRecoveryTime) {
      recommendations.push('Optimize recovery procedures to meet 2-minute target');
    }
    
    return recommendations;
  }
}

// Main execution
async function main() {
  console.log('=' .repeat(60));
  console.log('🔥 MARKET VOLATILITY PERFORMANCE TEST');
  console.log('=' .repeat(60) + '\n');
  
  const test = new MarketVolatilityTest();
  
  try {
    // Run test
    const results = await test.runVolatilityTest();
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'results', 'volatility-performance.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    
    // Display results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('=' .repeat(60) + '\n');
    
    console.log('Summary:');
    for (const [key, value] of Object.entries(results.summary)) {
      console.log(`  ${key}: ${value}`);
    }
    
    console.log('\nProfit Opportunities:');
    console.log(`  Detected: ${results.profitOpportunities.detected}`);
    console.log(`  Missed: ${results.profitOpportunities.missed}`);
    console.log(`  False Positives: ${results.profitOpportunities.falsePositives}`);
    
    console.log('\nPerformance by Volume:');
    for (const [level, data] of Object.entries(results.performanceByVolume)) {
      console.log(`  ${level} (${data.range}):`);
      console.log(`    Events: ${data.count}`);
      console.log(`    Accuracy: ${data.averageAccuracy}`);
      console.log(`    Latency: ${data.averageLatency}`);
    }
    
    console.log('\n✅ Validation Results:');
    for (const [criterion, passed] of Object.entries(results.validation)) {
      console.log(`  ${passed ? '✅' : '❌'} ${criterion}`);
    }
    
    if (results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      results.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    
    console.log(`\n✅ Results saved to: results/volatility-performance.json`);
    
    // Check if all validation criteria passed
    const allPassed = Object.values(results.validation).every(v => v);
    if (allPassed) {
      console.log('\n🎉 All validation criteria PASSED!');
    } else {
      console.log('\n⚠️ Some validation criteria failed. Review recommendations.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MarketVolatilityTest };