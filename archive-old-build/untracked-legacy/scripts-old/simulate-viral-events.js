#!/usr/bin/env node

/**
 * Viral Meme Coin Event Simulator
 * Simulates extreme market conditions with 1000x volume spikes
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ViralEventSimulator {
  constructor() {
    this.eventTypes = {
      WHALE_BUY: {
        name: 'Whale Buy Event',
        volumeMultiplier: 1000,
        duration: 30000, // 30 seconds
        failureRate: 0.3, // 30% request failures during event
        pattern: {
          newLP: 0.05,        // 5% - New LP detection (reduced during whale activity)
          balanceCheck: 0.70,  // 70% - Massive balance checking
          tokenSupply: 0.20,   // 20% - Supply verification
          duplicate: 0.05      // 5% - Duplicate requests
        }
      },
      
      INFLUENCER_SHILL: {
        name: 'Influencer Shill Event',
        volumeMultiplier: 500,
        duration: 45000, // 45 seconds
        failureRate: 0.25,
        pattern: {
          newLP: 0.60,        // 60% - Massive new LP scanning
          balanceCheck: 0.25,  // 25% - Balance checks
          tokenSupply: 0.10,   // 10% - Supply queries
          duplicate: 0.05      // 5% - Duplicates
        }
      },
      
      DEX_LISTING: {
        name: 'Major DEX Listing',
        volumeMultiplier: 800,
        duration: 60000, // 1 minute
        failureRate: 0.35,
        pattern: {
          newLP: 0.40,        // 40% - LP monitoring
          balanceCheck: 0.30,  // 30% - Balance tracking
          tokenSupply: 0.25,   // 25% - Supply verification
          duplicate: 0.05      // 5% - Duplicates
        }
      },
      
      NETWORK_CONGESTION: {
        name: 'Solana Network Congestion',
        volumeMultiplier: 100,
        duration: 120000, // 2 minutes
        failureRate: 0.60, // 60% failure rate
        pattern: {
          newLP: 0.20,        // 20% - Reduced LP detection
          balanceCheck: 0.30,  // 30% - Balance checks
          tokenSupply: 0.20,   // 20% - Supply queries
          duplicate: 0.30      // 30% - High retry/duplicate rate
        }
      },
      
      LAUNCH_FRENZY: {
        name: 'Token Launch Frenzy',
        volumeMultiplier: 1500, // 1500x normal volume
        duration: 20000, // 20 seconds of pure chaos
        failureRate: 0.45,
        pattern: {
          newLP: 0.80,        // 80% - Extreme LP creation scanning
          balanceCheck: 0.15,  // 15% - Some balance checks
          tokenSupply: 0.04,   // 4% - Minimal supply checks
          duplicate: 0.01      // 1% - Low duplicates (all unique tokens)
        }
      }
    };
    
    this.networkConditions = {
      NORMAL: {
        latency: 50,      // 50ms base latency
        jitter: 10,       // ±10ms jitter
        packetLoss: 0.01  // 1% packet loss
      },
      CONGESTED: {
        latency: 500,     // 500ms during congestion
        jitter: 200,      // ±200ms high jitter
        packetLoss: 0.15  // 15% packet loss
      },
      EXTREME: {
        latency: 2000,    // 2 second latency
        jitter: 1000,     // ±1 second jitter
        packetLoss: 0.30  // 30% packet loss
      }
    };
    
    this.statistics = {
      eventsSimulated: 0,
      totalRequests: 0,
      failedRequests: 0,
      maxConcurrentRequests: 0,
      averageLatency: 0,
      peakVolumeMultiplier: 0
    };
  }
  
  /**
   * Generate viral event
   */
  generateViralEvent(type = null) {
    const eventKeys = Object.keys(this.eventTypes);
    const eventType = type || eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const event = this.eventTypes[eventType];
    
    return {
      id: `viral_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: eventType,
      ...event,
      startTime: Date.now(),
      endTime: Date.now() + event.duration,
      tokenAddress: this.generateTokenAddress(),
      metadata: {
        marketCap: Math.floor(Math.random() * 100000000), // Up to $100M
        holders: Math.floor(Math.random() * 50000),       // Up to 50k holders
        volume24h: Math.floor(Math.random() * 10000000),  // Up to $10M daily volume
        priceChange: (Math.random() * 10000) - 1000      // -1000% to +9000%
      }
    };
  }
  
  /**
   * Simulate request pattern during viral event
   */
  simulateRequestPattern(event, requestsPerSecond) {
    const requests = [];
    const numRequests = Math.floor(requestsPerSecond * event.volumeMultiplier);
    
    for (let i = 0; i < numRequests; i++) {
      const requestType = this.selectRequestType(event.pattern);
      const shouldFail = Math.random() < event.failureRate;
      
      requests.push({
        id: `req_${Date.now()}_${i}`,
        type: requestType,
        tokenAddress: requestType === 'duplicate' ? event.tokenAddress : this.generateTokenAddress(),
        timestamp: Date.now(),
        shouldFail,
        latency: this.calculateLatency(event.failureRate),
        attempt: 1,
        maxAttempts: shouldFail ? 3 : 1
      });
    }
    
    // Update statistics
    this.statistics.totalRequests += numRequests;
    this.statistics.maxConcurrentRequests = Math.max(
      this.statistics.maxConcurrentRequests,
      numRequests
    );
    this.statistics.peakVolumeMultiplier = Math.max(
      this.statistics.peakVolumeMultiplier,
      event.volumeMultiplier
    );
    
    return requests;
  }
  
  /**
   * Select request type based on pattern probabilities
   */
  selectRequestType(pattern) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [type, probability] of Object.entries(pattern)) {
      cumulative += probability;
      if (rand < cumulative) {
        return type;
      }
    }
    
    return 'balanceCheck'; // Fallback
  }
  
  /**
   * Calculate latency based on network conditions
   */
  calculateLatency(failureRate) {
    let condition;
    
    if (failureRate > 0.5) {
      condition = this.networkConditions.EXTREME;
    } else if (failureRate > 0.25) {
      condition = this.networkConditions.CONGESTED;
    } else {
      condition = this.networkConditions.NORMAL;
    }
    
    const baseLatency = condition.latency;
    const jitter = (Math.random() - 0.5) * 2 * condition.jitter;
    
    return Math.max(10, baseLatency + jitter); // Minimum 10ms
  }
  
  /**
   * Simulate cascading failures
   */
  simulateCascadingFailure(componentFailureChance = 0.1) {
    const components = [
      'rateLimiter',
      'circuitBreaker',
      'connectionPool',
      'endpointSelector',
      'requestCache',
      'batchManager',
      'hedgedManager'
    ];
    
    const failures = [];
    let cascaded = false;
    
    for (const component of components) {
      const shouldFail = Math.random() < componentFailureChance;
      
      if (shouldFail || cascaded) {
        failures.push({
          component,
          timestamp: Date.now(),
          cascaded,
          recoveryTime: Math.floor(Math.random() * 30000) + 5000 // 5-35 seconds
        });
        
        // 30% chance of cascade
        if (!cascaded && Math.random() < 0.3) {
          cascaded = true;
          componentFailureChance *= 2; // Double failure chance for cascade
        }
      }
    }
    
    return failures;
  }
  
  /**
   * Generate token address
   */
  generateTokenAddress() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let address = '';
    for (let i = 0; i < 44; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }
  
  /**
   * Run viral event simulation
   */
  async runSimulation(duration = 60000, eventsPerMinute = 2) {
    console.log('🦠 Starting Viral Event Simulation');
    console.log(`  Duration: ${duration / 1000} seconds`);
    console.log(`  Events per minute: ${eventsPerMinute}\n`);
    
    const results = {
      startTime: Date.now(),
      endTime: null,
      events: [],
      failures: [],
      statistics: {}
    };
    
    const eventInterval = 60000 / eventsPerMinute;
    const numEvents = Math.floor(duration / eventInterval);
    
    // Generate all events instantly
    for (let i = 0; i < numEvents; i++) {
      const event = this.generateViralEvent();
      this.statistics.eventsSimulated++;
      
      console.log(`\n🚀 ${event.name} Started!`);
      console.log(`  Volume: ${event.volumeMultiplier}x`);
      console.log(`  Duration: ${event.duration / 1000}s`);
      console.log(`  Failure Rate: ${(event.failureRate * 100).toFixed(0)}%`);
      
      // Simulate requests for this event
      const requests = this.simulateRequestPattern(event, 10); // 10 base RPS
      
      // Check for cascading failures during high volume
      if (event.volumeMultiplier > 500) {
        const failures = this.simulateCascadingFailure(event.failureRate / 2);
        if (failures.length > 0) {
          console.log(`  ⚠️ Component failures: ${failures.map(f => f.component).join(', ')}`);
          results.failures.push(...failures);
        }
      }
      
      results.events.push({
        ...event,
        requestCount: requests.length,
        failedCount: requests.filter(r => r.shouldFail).length
      });
    }
    
    results.endTime = Date.now() + duration;
    results.statistics = this.statistics;
    
    return results;
  }
  
  /**
   * Generate summary report
   */
  generateReport(results) {
    const duration = (results.endTime - results.startTime) / 1000;
    const successRate = ((this.statistics.totalRequests - this.statistics.failedRequests) / 
                        this.statistics.totalRequests * 100) || 0;
    
    const report = {
      summary: {
        duration: `${duration} seconds`,
        eventsSimulated: this.statistics.eventsSimulated,
        totalRequests: this.statistics.totalRequests,
        requestsPerSecond: Math.floor(this.statistics.totalRequests / duration),
        peakVolumeMultiplier: `${this.statistics.peakVolumeMultiplier}x`,
        maxConcurrentRequests: this.statistics.maxConcurrentRequests,
        successRate: `${successRate.toFixed(2)}%`,
        componentFailures: results.failures.length,
        cascadingFailures: results.failures.filter(f => f.cascaded).length
      },
      
      eventBreakdown: {},
      
      networkImpact: {
        normalLatency: '50ms',
        congestedLatency: '500ms',
        extremeLatency: '2000ms',
        maxPacketLoss: '30%'
      },
      
      recommendations: []
    };
    
    // Event breakdown
    for (const event of results.events) {
      if (!report.eventBreakdown[event.type]) {
        report.eventBreakdown[event.type] = {
          count: 0,
          totalRequests: 0,
          failedRequests: 0,
          averageVolume: 0
        };
      }
      
      const breakdown = report.eventBreakdown[event.type];
      breakdown.count++;
      breakdown.totalRequests += event.requestCount;
      breakdown.failedRequests += event.failedCount;
      breakdown.averageVolume = 
        (breakdown.averageVolume * (breakdown.count - 1) + event.volumeMultiplier) / breakdown.count;
    }
    
    // Generate recommendations
    if (successRate < 70) {
      report.recommendations.push('Increase circuit breaker thresholds during viral events');
    }
    
    if (results.failures.filter(f => f.cascaded).length > 0) {
      report.recommendations.push('Improve component isolation to prevent cascading failures');
    }
    
    if (this.statistics.peakVolumeMultiplier > 1000) {
      report.recommendations.push('Consider horizontal scaling for extreme volume spikes');
    }
    
    return report;
  }
}

// Main execution
async function main() {
  console.log('=' .repeat(60));
  console.log('🦠 VIRAL MEME COIN EVENT SIMULATOR');
  console.log('=' .repeat(60) + '\n');
  
  const simulator = new ViralEventSimulator();
  
  try {
    // Run simulation
    const results = await simulator.runSimulation(
      120000,  // 2 minute simulation
      3        // 3 events per minute
    );
    
    // Generate report
    const report = simulator.generateReport(results);
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'results', 'viral-simulation.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(
      outputPath,
      JSON.stringify({ results, report }, null, 2)
    );
    
    // Display summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SIMULATION COMPLETE');
    console.log('=' .repeat(60) + '\n');
    
    console.log('Summary:');
    for (const [key, value] of Object.entries(report.summary)) {
      console.log(`  ${key}: ${value}`);
    }
    
    console.log('\nEvent Breakdown:');
    for (const [type, data] of Object.entries(report.eventBreakdown)) {
      console.log(`  ${type}:`);
      console.log(`    Count: ${data.count}`);
      console.log(`    Average Volume: ${data.averageVolume.toFixed(0)}x`);
      console.log(`    Success Rate: ${((data.totalRequests - data.failedRequests) / data.totalRequests * 100).toFixed(1)}%`);
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    
    console.log(`\n✅ Results saved to: results/viral-simulation.json`);
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ViralEventSimulator };