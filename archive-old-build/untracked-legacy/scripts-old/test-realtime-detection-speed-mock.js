#!/usr/bin/env node

/**
 * Mock Real-Time Detection Speed Test
 * Tests the detection speed analyzer with simulated data
 */

import fs from 'fs/promises';
import { createStructuredLogger } from '../src/logger/structured-logger.js';
import { DetectionSpeedAnalyzer } from './detection-speed-analyzer.js';

// Mock RPC Manager
class MockRpcManager {
  constructor() {
    this.callCount = 0;
    this.circuitBreaker = { trips: 0 };
  }
  
  async call(method, params) {
    this.callCount++;
    
    // Simulate successful RPC responses
    if (method === 'getSlot') {
      return 123456789;
    } else if (method === 'getAccountInfo') {
      return {
        value: {
          data: 'mock_pool_data_base64',
          owner: 'RAYDIUM_AMM_V4',
          lamports: 1000000
        }
      };
    } else if (method === 'getTokenSupply') {
      return {
        value: {
          amount: '1000000000000',
          decimals: 9,
          uiAmountString: '1000'
        }
      };
    }
    
    return { value: null };
  }
  
  getCircuitBreakerStats() {
    return {
      mock: { trips: this.circuitBreaker.trips, state: 'CLOSED' }
    };
  }
}

// Mock Event Simulator with realistic latencies
class MockEventSimulator {
  constructor(rpcManager, logger) {
    this.rpcManager = rpcManager;
    this.logger = logger;
  }
  
  generateRealtimeEvents(count = 20) {
    const events = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      events.push({
        timestamp: new Date(now + i * 1000).toISOString(), // 1 second apart
        signature: `mock_sig_${i}`,
        programId: 'RAYDIUM_AMM_V4',
        mint: `mock_mint_${i}`,
        pool: `mock_pool_${i}`,
        lpAmount: Math.floor(Math.random() * 1000000000).toString(),
        eventId: `mock_event_${now}_${i}`
      });
    }
    
    return events;
  }
  
  async simulateRealtimeDetection(events) {
    const results = [];
    
    for (const event of events) {
      // Simulate realistic detection latencies (500ms to 5000ms)
      const baseLatency = 500;
      const variableLatency = Math.random() * 4500;
      const detectionLatencyMs = baseLatency + variableLatency;
      
      // 95% success rate
      const success = Math.random() > 0.05;
      
      // Simulate detection delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      results.push({
        eventId: event.eventId,
        eventTimestamp: event.timestamp,
        detectionLatencyMs: Math.round(detectionLatencyMs),
        success,
        signal: success ? {
          eventId: event.eventId,
          mint: event.mint,
          score: Math.floor(Math.random() * 50) + 20,
          recommendation: Math.random() > 0.3 ? 'BUY' : 'SKIP',
          confidence: Math.random()
        } : null,
        error: success ? null : 'Simulated RPC failure'
      });
    }
    
    return results;
  }
}

async function main() {
  const logger = createStructuredLogger({ level: 'info' });
  
  try {
    console.log('\n🚀 MOCK REAL-TIME DETECTION SPEED TEST');
    console.log('Testing analyzer logic with simulated data\n');
    
    // Initialize mock components
    const rpcManager = new MockRpcManager();
    const simulator = new MockEventSimulator(rpcManager, logger);
    const analyzer = new DetectionSpeedAnalyzer(logger);
    
    // Generate events
    logger.info('Generating 20 mock LP events');
    const events = simulator.generateRealtimeEvents(20);
    
    // Save events
    const eventsData = events.map(e => JSON.stringify(e)).join('\n');
    await fs.writeFile('data/mock-lp-events.ndjson', eventsData);
    
    // Measure system resources
    const memoryBefore = process.memoryUsage().heapUsed;
    const testStartTime = Date.now();
    
    // Run detection test
    logger.info('Starting mock detection pipeline test');
    const detectionResults = await simulator.simulateRealtimeDetection(events);
    
    const testEndTime = Date.now();
    const memoryAfter = process.memoryUsage().heapUsed;
    const testDurationMs = testEndTime - testStartTime;
    const memoryGrowthMB = (memoryAfter - memoryBefore) / (1024 * 1024);
    
    logger.info('Mock detection test completed', {
      duration_ms: testDurationMs,
      memory_growth_mb: memoryGrowthMB,
      events_processed: detectionResults.length
    });
    
    // Analyze results
    const speedAnalysis = analyzer.analyzeDetectionResults(detectionResults);
    
    if (speedAnalysis.error) {
      throw new Error(speedAnalysis.error);
    }
    
    // Get circuit breaker stats
    const circuitStats = rpcManager.getCircuitBreakerStats();
    const totalTrips = Object.values(circuitStats).reduce((sum, stats) => sum + (stats.trips || 0), 0);
    const tripRate = events.length > 0 ? totalTrips / events.length : 0;
    
    // Validate success criteria
    const successCriteria = analyzer.validateSuccessCriteria(
      speedAnalysis,
      memoryGrowthMB,
      tripRate * 100
    );
    
    // Generate summary report
    const summaryReport = analyzer.generateSummaryReport(
      speedAnalysis,
      successCriteria,
      testDurationMs
    );
    
    // Compile final results
    const finalResults = {
      test_metadata: {
        test_type: 'MOCK-REALTIME-DETECTION',
        events_total: events.length,
        test_duration_ms: testDurationMs,
        memory_growth_mb: Math.round(memoryGrowthMB * 100) / 100,
        timestamp: new Date().toISOString()
      },
      success_criteria_validation: successCriteria,
      performance_analysis: speedAnalysis,
      summary_report: summaryReport
    };
    
    // Save results
    await fs.writeFile(
      'results/mock-detection-speed-results.json',
      JSON.stringify(finalResults, null, 2)
    );
    
    // Print detailed results
    console.log('\n=== DETECTION SPEED ANALYSIS RESULTS ===');
    console.log('\n📊 Performance Metrics:');
    console.log(`  • Total Events: ${speedAnalysis.performance_summary.total_events}`);
    console.log(`  • Successful: ${speedAnalysis.performance_summary.successful_detections}`);
    console.log(`  • Failed: ${speedAnalysis.performance_summary.failed_detections}`);
    console.log(`  • Success Rate: ${speedAnalysis.performance_summary.success_rate_pct}%`);
    
    console.log('\n⏱️  Latency Analysis:');
    console.log(`  • Median: ${speedAnalysis.latency_analysis.median_ms}ms`);
    console.log(`  • P95: ${speedAnalysis.latency_analysis.p95_ms}ms`);
    console.log(`  • P99: ${speedAnalysis.latency_analysis.p99_ms}ms`);
    console.log(`  • Max: ${speedAnalysis.latency_analysis.max_ms}ms`);
    
    console.log('\n📈 Capture Rates:');
    console.log(`  • Within 5s: ${speedAnalysis.latency_analysis.within_5s_pct}%`);
    console.log(`  • Within 10s: ${speedAnalysis.latency_analysis.within_10s_pct}%`);
    console.log(`  • Within 30s: ${speedAnalysis.latency_analysis.within_30s_pct}%`);
    
    console.log('\n🏆 Competitive Edge:');
    console.log(`  • Our Median: ${speedAnalysis.competitive_edge.our_median_ms}ms`);
    console.log(`  • vs Fast Retail: ${speedAnalysis.competitive_edge.vs_fast_retail_seconds}s advantage`);
    console.log(`  • vs Average Retail: ${speedAnalysis.competitive_edge.vs_average_retail_seconds}s advantage`);
    console.log(`  • vs Slow Retail: ${speedAnalysis.competitive_edge.vs_slow_retail_seconds}s advantage`);
    console.log(`  • Classification: ${speedAnalysis.competitive_edge.edge_classification}`);
    console.log(`  • Profit Potential: ${speedAnalysis.competitive_edge.profit_potential}`);
    
    console.log('\n✅ Success Criteria:');
    for (const [criterion, passed] of Object.entries(successCriteria)) {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const formatted = criterion.replace(/_/g, ' ');
      console.log(`  ${status} - ${formatted}`);
    }
    
    console.log('\n📋 Summary Report:');
    console.log(`  • Overall Grade: ${summaryReport.overall_grade}`);
    console.log(`  • Criteria Passed: ${summaryReport.criteria_passed}`);
    console.log(`  • Deployment Ready: ${summaryReport.deployment_readiness ? 'YES' : 'NO'}`);
    
    console.log('\n💾 Results saved to: results/mock-detection-speed-results.json');
    
    // Exit with appropriate code
    process.exit(summaryReport.deployment_readiness ? 0 : 1);
    
  } catch (error) {
    logger.error('Mock test failed', {
      error: error.message,
      stack: error.stack
    });
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('Test execution failed:', error.message);
  process.exit(1);
});