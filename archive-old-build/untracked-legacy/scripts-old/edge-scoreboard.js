/**
 * Edge Scoreboard - Competitive Advantage Measurement System
 * Measures our detection speed advantage over retail traders
 */

export class EdgeScoreboard {
  constructor() {
    this.edgeResults = [];
    this.retailBaselineMs = {
      p50: 180000,  // 3 minutes - median retail detection time
      p95: 420000   // 7 minutes - 95th percentile retail detection
    };
    this.stats = {
      totalDetections: 0,
      capturedWithin30s: 0,
      capturedWithin10s: 0,
      capturedWithin5s: 0,
      fastestDetectionMs: Infinity,
      slowestDetectionMs: 0
    };
  }
  
  /**
   * Record a detection event and calculate competitive edge
   */
  recordDetection(lpEvent, detectionResult) {
    const lpCreateTime = new Date(lpEvent.timestamp);
    const detectionTime = new Date(detectionResult.timestamp);
    
    const ourLatencyMs = detectionTime - lpCreateTime;
    const retailLatencyMs = this.estimateRetailDetection(lpEvent);
    const edgeSeconds = (retailLatencyMs - ourLatencyMs) / 1000;
    
    const result = {
      eventId: lpEvent.eventId || lpEvent.signature,
      lpCreateTime: lpCreateTime.toISOString(),
      detectionTime: detectionTime.toISOString(),
      ourLatencyMs,
      retailLatencyMs,
      edgeSeconds,
      capturedWithin30s: ourLatencyMs <= 30000,
      capturedWithin10s: ourLatencyMs <= 10000,
      capturedWithin5s: ourLatencyMs <= 5000,
      signal: detectionResult.signal
    };
    
    this.edgeResults.push(result);
    this.updateStats(result);
    
    return result;
  }
  
  /**
   * Update running statistics
   */
  updateStats(result) {
    this.stats.totalDetections++;
    
    if (result.capturedWithin30s) this.stats.capturedWithin30s++;
    if (result.capturedWithin10s) this.stats.capturedWithin10s++;
    if (result.capturedWithin5s) this.stats.capturedWithin5s++;
    
    if (result.ourLatencyMs < this.stats.fastestDetectionMs) {
      this.stats.fastestDetectionMs = result.ourLatencyMs;
    }
    if (result.ourLatencyMs > this.stats.slowestDetectionMs) {
      this.stats.slowestDetectionMs = result.ourLatencyMs;
    }
  }
  
  /**
   * Generate comprehensive edge summary
   */
  generateEdgeSummary() {
    if (this.edgeResults.length === 0) {
      return {
        events_total: 0,
        message: 'No detections recorded'
      };
    }
    
    const ourLatencies = this.edgeResults.map(r => r.ourLatencyMs);
    const edgeSeconds = this.edgeResults.map(r => r.edgeSeconds);
    const captureRate30s = this.stats.capturedWithin30s / this.stats.totalDetections;
    const captureRate10s = this.stats.capturedWithin10s / this.stats.totalDetections;
    const captureRate5s = this.stats.capturedWithin5s / this.stats.totalDetections;
    
    return {
      events_total: this.edgeResults.length,
      our_detection_latency_ms: {
        min: Math.min(...ourLatencies),
        p25: this.calculatePercentile(ourLatencies, 0.25),
        p50: this.calculatePercentile(ourLatencies, 0.5),
        p75: this.calculatePercentile(ourLatencies, 0.75),
        p95: this.calculatePercentile(ourLatencies, 0.95),
        p99: this.calculatePercentile(ourLatencies, 0.99),
        max: Math.max(...ourLatencies),
        mean: this.calculateMean(ourLatencies)
      },
      retail_detection_latency_ms: this.retailBaselineMs,
      edge_seconds: {
        min: Math.min(...edgeSeconds),
        median: this.calculatePercentile(edgeSeconds, 0.5),
        p75: this.calculatePercentile(edgeSeconds, 0.75),
        p95: this.calculatePercentile(edgeSeconds, 0.95),
        max: Math.max(...edgeSeconds),
        mean: this.calculateMean(edgeSeconds)
      },
      opportunity_capture_rates: {
        within_5s_pct: Math.round(captureRate5s * 100),
        within_10s_pct: Math.round(captureRate10s * 100),
        within_30s_pct: Math.round(captureRate30s * 100)
      },
      competitive_advantage: this.assessCompetitiveAdvantage(edgeSeconds)
    };
  }
  
  /**
   * Assess competitive advantage level
   */
  assessCompetitiveAdvantage(edgeSeconds) {
    const medianEdge = this.calculatePercentile(edgeSeconds, 0.5);
    const p75Edge = this.calculatePercentile(edgeSeconds, 0.75);
    
    let level = 'NONE';
    let description = '';
    
    if (medianEdge >= 240) {
      level = 'EXCEPTIONAL';
      description = '4+ minutes faster than retail (game-changing advantage)';
    } else if (medianEdge >= 180) {
      level = 'STRONG';
      description = '3+ minutes faster than retail (significant advantage)';
    } else if (medianEdge >= 120) {
      level = 'GOOD';
      description = '2+ minutes faster than retail (meaningful advantage)';
    } else if (medianEdge >= 60) {
      level = 'MODERATE';
      description = '1+ minute faster than retail (competitive)';
    } else if (medianEdge >= 30) {
      level = 'MINIMAL';
      description = '30+ seconds faster than retail (marginal advantage)';
    } else {
      level = 'NONE';
      description = 'No significant advantage over retail';
    }
    
    return {
      level,
      description,
      median_edge_seconds: Math.round(medianEdge),
      p75_edge_seconds: Math.round(p75Edge)
    };
  }
  
  /**
   * Estimate retail trader detection time
   */
  estimateRetailDetection(lpEvent) {
    // Simulate realistic retail trader delay distribution
    // Most retail traders take 3-7 minutes to detect new LPs
    // Using a skewed distribution with mode around 4 minutes
    
    const min = 180000;  // 3 minutes
    const max = 420000;  // 7 minutes
    const mode = 240000; // 4 minutes (most common)
    
    // Beta distribution approximation for realistic delay
    const random = Math.random();
    const skew = 2; // Skew towards faster detection
    const adjusted = Math.pow(random, skew);
    
    return min + adjusted * (max - min);
  }
  
  /**
   * Calculate percentile from array of numbers
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(percentile * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  /**
   * Calculate mean from array of numbers
   */
  calculateMean(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Reset scoreboard for new test
   */
  reset() {
    this.edgeResults = [];
    this.stats = {
      totalDetections: 0,
      capturedWithin30s: 0,
      capturedWithin10s: 0,
      capturedWithin5s: 0,
      fastestDetectionMs: Infinity,
      slowestDetectionMs: 0
    };
  }
  
  /**
   * Get detailed edge results
   */
  getDetailedResults() {
    return this.edgeResults;
  }
  
  /**
   * Export edge analysis for reporting
   */
  exportAnalysis() {
    const summary = this.generateEdgeSummary();
    
    return {
      timestamp: new Date().toISOString(),
      summary,
      statistics: this.stats,
      top_performers: this.edgeResults
        .sort((a, b) => b.edgeSeconds - a.edgeSeconds)
        .slice(0, 10)
        .map(r => ({
          eventId: r.eventId,
          ourLatencyMs: r.ourLatencyMs,
          edgeSeconds: Math.round(r.edgeSeconds),
          capturedIn: r.capturedWithin5s ? '5s' : 
                     r.capturedWithin10s ? '10s' : 
                     r.capturedWithin30s ? '30s' : '>30s'
        })),
      worst_performers: this.edgeResults
        .sort((a, b) => a.edgeSeconds - b.edgeSeconds)
        .slice(0, 10)
        .map(r => ({
          eventId: r.eventId,
          ourLatencyMs: r.ourLatencyMs,
          edgeSeconds: Math.round(r.edgeSeconds)
        }))
    };
  }
}

export default EdgeScoreboard;