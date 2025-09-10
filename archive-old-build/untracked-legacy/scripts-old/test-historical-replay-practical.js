#!/usr/bin/env node

/**
 * Practical Historical Replay Test
 * Uses reasonable time scaling for demonstration while maintaining realistic behavior
 */

import { HistoricalReplayTest } from './test-historical-replay-corrected.js';

class PracticalHistoricalReplayTest extends HistoricalReplayTest {
  constructor() {
    super();
    console.log('📊 Practical Test Mode: Using compressed timeline for demonstration');
  }
  
  /**
   * Override to create events with compressed timeline
   */
  async loadHistoricalEvents() {
    const originalEvents = await super.loadHistoricalEvents();
    
    // Compress the timeline - make events 1 second apart instead of 30+ seconds
    const baseTime = new Date('2024-08-15T18:00:00.000Z');
    const compressedEvents = originalEvents.map((event, index) => ({
      ...event,
      timestamp: new Date(baseTime.getTime() + index * 1000).toISOString(), // 1 second apart
      originalTimestamp: event.timestamp // Keep original for reference
    }));
    
    console.log(`Compressed ${compressedEvents.length} events to ${compressedEvents.length} seconds timeline`);
    return compressedEvents;
  }
  
  /**
   * Run practical speed tests
   */
  async runMultiSpeedTest(events) {
    const results = {};
    
    // Test at 1x speed (will complete in ~20 seconds)
    console.log('\n' + '='.repeat(60));
    console.log('RUNNING 1x SPEED REPLAY TEST');
    console.log(`Expected duration: ~${events.length} seconds`);
    console.log('='.repeat(60));
    
    this.replayer.reset();
    this.edgeScoreboard.reset();
    this.replayer.setEventProcessor(event => this.processEvent(event));
    
    const oneXStart = Date.now();
    const oneXResults = await this.replayer.replayEvents(events, 1.0);
    const oneXDuration = (Date.now() - oneXStart) / 1000;
    const oneXEdge = this.edgeScoreboard.generateEdgeSummary();
    const oneXStats = this.replayer.getStats();
    
    console.log(`\n1x speed test completed in ${oneXDuration.toFixed(1)} seconds`);
    
    results.oneX = {
      results: oneXResults,
      edge: oneXEdge,
      stats: oneXStats,
      duration: oneXDuration
    };
    
    // Test at 5x speed (will complete in ~4 seconds)
    console.log('\n' + '='.repeat(60));
    console.log('RUNNING 5x SPEED REPLAY TEST');
    console.log(`Expected duration: ~${events.length / 5} seconds`);
    console.log('='.repeat(60));
    
    this.replayer.reset();
    this.edgeScoreboard.reset();
    
    const fiveXStart = Date.now();
    const fiveXResults = await this.replayer.replayEvents(events, 5.0);
    const fiveXDuration = (Date.now() - fiveXStart) / 1000;
    const fiveXEdge = this.edgeScoreboard.generateEdgeSummary();
    const fiveXStats = this.replayer.getStats();
    
    console.log(`\n5x speed test completed in ${fiveXDuration.toFixed(1)} seconds`);
    
    results.fiveX = {
      results: fiveXResults,
      edge: fiveXEdge,
      stats: fiveXStats,
      duration: fiveXDuration
    };
    
    // Test at 10x speed for stress testing
    console.log('\n' + '='.repeat(60));
    console.log('BONUS: RUNNING 10x SPEED STRESS TEST');
    console.log(`Expected duration: ~${events.length / 10} seconds`);
    console.log('='.repeat(60));
    
    this.replayer.reset();
    this.edgeScoreboard.reset();
    
    const tenXStart = Date.now();
    const tenXResults = await this.replayer.replayEvents(events, 10.0);
    const tenXDuration = (Date.now() - tenXStart) / 1000;
    const tenXEdge = this.edgeScoreboard.generateEdgeSummary();
    const tenXStats = this.replayer.getStats();
    
    console.log(`\n10x speed test completed in ${tenXDuration.toFixed(1)} seconds`);
    
    results.tenX = {
      results: tenXResults,
      edge: tenXEdge,
      stats: tenXStats,
      duration: tenXDuration
    };
    
    return results;
  }
  
  /**
   * Generate enhanced final results
   */
  generateFinalResults(historicalEvents, testResults) {
    const baseResults = super.generateFinalResults(historicalEvents, testResults);
    
    // Add 10x speed results if available
    if (testResults.tenX) {
      const tenXProcessed30s = testResults.tenX.results.filter(r => r.processingTimeMs <= 30000).length;
      const tenXProcessedRate = (tenXProcessed30s / testResults.tenX.results.length) * 100;
      
      baseResults.test_summary.processed_within_30s_10x_pct = tenXProcessedRate.toFixed(1);
      baseResults.competitive_edge.tenX_speed = testResults.tenX.edge;
      
      // Add stress test validation
      baseResults.stress_test_validation = {
        '10x_speed_stability': tenXProcessedRate >= 70,
        'no_timer_storms': testResults.tenX.stats.failedCount === 0,
        'queue_management': testResults.tenX.stats.queuedCount > 0 ? 'Active' : 'Not needed'
      };
      
      // Test durations
      baseResults.test_durations = {
        oneX: `${testResults.oneX.duration.toFixed(1)}s`,
        fiveX: `${testResults.fiveX.duration.toFixed(1)}s`,
        tenX: `${testResults.tenX.duration.toFixed(1)}s`
      };
    }
    
    return baseResults;
  }
  
  /**
   * Print enhanced results summary
   */
  printResultsSummary(results) {
    super.printResultsSummary(results);
    
    if (results.stress_test_validation) {
      console.log('\nSTRESS TEST VALIDATION (10x Speed):');
      for (const [test, passed] of Object.entries(results.stress_test_validation)) {
        if (typeof passed === 'boolean') {
          const status = passed ? '✅ PASS' : '❌ FAIL';
          console.log(`  ${status} - ${test.replace(/_/g, ' ')}`);
        } else {
          console.log(`  ℹ️  ${test.replace(/_/g, ' ')}: ${passed}`);
        }
      }
    }
    
    if (results.test_durations) {
      console.log('\nTEST EXECUTION TIMES:');
      console.log(`  1x Speed: ${results.test_durations.oneX}`);
      console.log(`  5x Speed: ${results.test_durations.fiveX}`);
      console.log(`  10x Speed: ${results.test_durations.tenX}`);
    }
  }
}

// Execute practical test
async function main() {
  console.log('🚀 PRACTICAL HISTORICAL REPLAY TEST');
  console.log('Using compressed timeline for reasonable execution time\n');
  
  const test = new PracticalHistoricalReplayTest();
  
  try {
    const startTime = Date.now();
    const results = await test.run();
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n⏱️  Total test execution time: ${totalTime} seconds`);
    
    // Determine exit code based on critical criteria
    const criticalCriteriaMet = 
      results.success_criteria_validation['zero_silent_drops'] &&
      results.success_criteria_validation['processed_99pct_within_30s_at_1x'] &&
      results.success_criteria_validation['circuit_breaker_trips_lt_5pct'];
    
    if (criticalCriteriaMet) {
      console.log('✅ Critical success criteria met - System validated');
      process.exit(0);
    } else {
      console.log('⚠️  Some critical criteria not met - Review failures');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();