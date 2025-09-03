#!/usr/bin/env node

/**
 * Detection Speed Analyzer
 * Measures competitive edge vs retail traders and validates system performance
 */

import { createStructuredLogger } from '../src/logger/structured-logger.js';

class DetectionSpeedAnalyzer {
  constructor(logger) {
    this.logger = logger || createStructuredLogger({ level: 'info' });
    this.measurements = [];
    this.retailBaseline = {
      fast: 180000,    // 3 minutes (experienced retail trader)
      average: 300000, // 5 minutes (typical retail trader)
      slow: 420000     // 7 minutes (slow retail trader)
    };
  }
  
  // Main analysis function
  analyzeDetectionResults(results) {
    this.measurements = results.filter(r => r.success);
    
    if (this.measurements.length === 0) {
      return {
        error: 'No successful detections to analyze',
        recommendation: 'FIX_DETECTION_PIPELINE_FIRST'
      };
    }
    
    const latencies = this.measurements.map(r => r.detectionLatencyMs);
    const allResults = results;
    
    const analysis = {
      performance_summary: {
        total_events: allResults.length,
        successful_detections: this.measurements.length,
        failed_detections: allResults.length - this.measurements.length,
        success_rate_pct: Math.round((this.measurements.length / allResults.length) * 100)
      },
      latency_analysis: {
        median_ms: this.calculatePercentile(latencies, 0.5),
        p95_ms: this.calculatePercentile(latencies, 0.95),
        p99_ms: this.calculatePercentile(latencies, 0.99),
        max_ms: Math.max(...latencies),
        within_30s_pct: this.calculateCaptureRate(latencies, 30000),
        within_10s_pct: this.calculateCaptureRate(latencies, 10000),
        within_5s_pct: this.calculateCaptureRate(latencies, 5000)
      },
      competitive_edge: this.calculateCompetitiveEdge(latencies)
    };
    
    this.logger.info('Detection speed analysis complete', {
      median_latency_ms: analysis.latency_analysis.median_ms,
      edge_seconds: analysis.competitive_edge.vs_average_retail_seconds,
      classification: analysis.competitive_edge.edge_classification
    });
    
    return analysis;
  }
  
  // Percentile calculation
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }
  
  // Capture rate calculation
  calculateCaptureRate(latencies, thresholdMs) {
    if (latencies.length === 0) return 0;
    
    const withinThreshold = latencies.filter(l => l <= thresholdMs).length;
    return Math.round((withinThreshold / latencies.length) * 100);
  }
  
  // Competitive edge calculation
  calculateCompetitiveEdge(ourLatencies) {
    const ourMedian = this.calculatePercentile(ourLatencies, 0.5);
    
    const edgeVsFast = (this.retailBaseline.fast - ourMedian) / 1000;
    const edgeVsAverage = (this.retailBaseline.average - ourMedian) / 1000;
    const edgeVsSlow = (this.retailBaseline.slow - ourMedian) / 1000;
    
    return {
      vs_fast_retail_seconds: Math.round(edgeVsFast),
      vs_average_retail_seconds: Math.round(edgeVsAverage), 
      vs_slow_retail_seconds: Math.round(edgeVsSlow),
      edge_classification: this.classifyEdge(ourMedian),
      profit_potential: this.assessProfitPotential(ourMedian),
      our_median_ms: ourMedian,
      retail_baseline_ms: this.retailBaseline.average
    };
  }
  
  // Edge classification
  classifyEdge(ourMedianMs) {
    const edgeSeconds = (this.retailBaseline.average - ourMedianMs) / 1000;
    
    if (edgeSeconds >= 240) return 'EXCEPTIONAL'; // 4+ minutes faster
    if (edgeSeconds >= 180) return 'STRONG';      // 3+ minutes faster  
    if (edgeSeconds >= 120) return 'GOOD';        // 2+ minutes faster
    if (edgeSeconds >= 60) return 'MARGINAL';     // 1+ minutes faster
    return 'INSUFFICIENT';                        // <1 minute faster
  }
  
  // Profit potential assessment
  assessProfitPotential(ourMedianMs) {
    const edgeSeconds = (this.retailBaseline.average - ourMedianMs) / 1000;
    
    if (edgeSeconds >= 180) return 'HIGH_PROFIT_POTENTIAL';
    if (edgeSeconds >= 120) return 'MODERATE_PROFIT_POTENTIAL';
    if (edgeSeconds >= 60) return 'LOW_PROFIT_POTENTIAL';
    return 'UNPROFITABLE';
  }
  
  // Success criteria validation
  validateSuccessCriteria(analysis, memoryGrowthMB, circuitTripRate) {
    return {
      processing_speed_99pct_within_30s: analysis.latency_analysis.within_30s_pct >= 99,
      reliability_95pct_success: analysis.performance_summary.success_rate_pct >= 95,
      competitive_edge_120s_minimum: analysis.competitive_edge.vs_average_retail_seconds >= 120,
      memory_efficiency_under_100mb: memoryGrowthMB < 100,
      system_stability_under_5pct_trips: circuitTripRate < 5,
      edge_classification_acceptable: !['INSUFFICIENT', 'MARGINAL'].includes(analysis.competitive_edge.edge_classification),
      profit_potential_viable: analysis.competitive_edge.profit_potential !== 'UNPROFITABLE'
    };
  }
  
  // Generate summary report
  generateSummaryReport(analysis, successCriteria, testDurationMs) {
    const passCount = Object.values(successCriteria).filter(Boolean).length;
    const totalCriteria = Object.keys(successCriteria).length;
    
    return {
      overall_grade: passCount >= (totalCriteria - 1) ? 'PRODUCTION_READY' : 'NEEDS_FIXES',
      criteria_passed: `${passCount}/${totalCriteria}`,
      competitive_advantage: {
        edge_seconds: analysis.competitive_edge.vs_average_retail_seconds,
        classification: analysis.competitive_edge.edge_classification,
        profit_viable: successCriteria.profit_potential_viable
      },
      system_performance: {
        median_detection_ms: analysis.latency_analysis.median_ms,
        success_rate: analysis.performance_summary.success_rate_pct,
        test_duration_s: Math.round(testDurationMs / 1000)
      },
      deployment_readiness: passCount >= (totalCriteria - 1)
    };
  }
}

export { DetectionSpeedAnalyzer };