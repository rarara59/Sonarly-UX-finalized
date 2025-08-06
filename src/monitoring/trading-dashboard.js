/**
 * Real-time trading performance dashboard optimized for meme coin trading
 */
import { PerformanceMetrics } from './performance-metrics.js';

class TradingDashboard {
  constructor(performanceMetrics) {
    this.metrics = performanceMetrics;
    this.dashboardData = {
      tradingMetrics: {},
      systemHealth: {},
      alerts: [],
      trends: {}
    };
    
    // Listen to metrics events
    this.metrics.on('metric', (metric) => this.updateDashboard(metric));
    this.metrics.on('alert', (alert) => this.handleAlert(alert));
    this.metrics.on('health', (health) => this.updateHealth(health));
    this.metrics.on('performance_report', (report) => this.updateTrends(report));
    
    // Start dashboard updates
    this.initializeDashboard();
  }
  
  /**
   * Initialize real-time dashboard with periodic updates
   */
  initializeDashboard() {
    // Update dashboard every 10 seconds
    setInterval(() => {
      this.generateDashboardOutput();
    }, 10000);
    
    // Generate detailed report every 5 minutes
    setInterval(() => {
      this.generateDetailedReport();
    }, 300000);
  }
  
  /**
   * Update dashboard with new metric
   */
  updateDashboard(metric) {
    const category = this.categorizeMetric(metric.type);
    
    if (!this.dashboardData.tradingMetrics[category]) {
      this.dashboardData.tradingMetrics[category] = [];
    }
    
    this.dashboardData.tradingMetrics[category].push({
      ...metric,
      category
    });
    
    // Keep only recent metrics (last 100 per category)
    this.dashboardData.tradingMetrics[category] = 
      this.dashboardData.tradingMetrics[category].slice(-100);
  }
  
  /**
   * Handle alert events
   */
  handleAlert(alert) {
    this.dashboardData.alerts.unshift(alert);
    
    // Keep only recent alerts (last 50)
    this.dashboardData.alerts = this.dashboardData.alerts.slice(0, 50);
    
    // Log critical alerts immediately
    if (alert.severity === 'critical') {
      console.log(`🚨 CRITICAL ALERT: ${alert.type} - ${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`);
    }
  }
  
  /**
   * Update system health status
   */
  updateHealth(health) {
    this.dashboardData.systemHealth = health;
  }
  
  /**
   * Update performance trends
   */
  updateTrends(report) {
    if (!this.dashboardData.trends.reports) {
      this.dashboardData.trends.reports = [];
    }
    
    this.dashboardData.trends.reports.push(report);
    
    // Keep only recent reports (last 60 = 1 hour of data)
    this.dashboardData.trends.reports = 
      this.dashboardData.trends.reports.slice(-60);
  }
  
  /**
   * Categorize metrics for dashboard organization
   */
  categorizeMetric(metricType) {
    const categories = {
      'scanLatency': 'performance',
      'validationLatency': 'performance',
      'tokenDetection': 'trading',
      'candidateGenerated': 'trading',
      'validationSuccess': 'trading',
      'rpcFailure': 'errors',
      'potentialRevenue': 'business'
    };
    
    return categories[metricType] || 'other';
  }
  
  /**
   * Generate real-time dashboard output
   */
  generateDashboardOutput() {
    const stats = this.metrics.getPerformanceStats();
    const activeAlerts = this.dashboardData.alerts.filter(a => 
      Date.now() - a.timestamp < 300000 // Last 5 minutes
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 THORP TRADING PERFORMANCE DASHBOARD');
    console.log('='.repeat(80));
    
    // System Overview
    console.log(`🎯 System Status: ${this.dashboardData.systemHealth.status || 'unknown'}`);
    console.log(`⏰ Uptime: ${Math.floor(stats.uptime_seconds / 60)} minutes`);
    console.log(`💾 Memory: ${stats.memory_mb.toFixed(1)}MB / ${stats.memory_total_mb.toFixed(1)}MB`);
    console.log(`🚨 Active Alerts: ${activeAlerts.length}`);
    
    console.log('\n📈 TRADING PERFORMANCE:');
    console.log(`   Scan Rate: ${stats.scan_rate_per_minute.toFixed(1)}/min`);
    console.log(`   Candidates: ${stats.total_candidates} (${stats.candidate_rate_per_minute.toFixed(1)}/min)`);
    console.log(`   Validation Success: ${stats.validation_success_rate_percent.toFixed(1)}%`);
    console.log(`   RPC Failure Rate: ${stats.rpc_failure_rate_percent.toFixed(1)}%`);
    
    console.log('\n⚡ LATENCY ANALYSIS:');
    console.log(`   Scan P50/P95/P99: ${stats.scan_latency_p50.toFixed(0)}ms / ${stats.scan_latency_p95.toFixed(0)}ms / ${stats.scan_latency_p99.toFixed(0)}ms`);
    console.log(`   Validation P50/P95: ${stats.validation_latency_p50.toFixed(0)}ms / ${stats.validation_latency_p95.toFixed(0)}ms`);
    
    // Recent alerts
    if (activeAlerts.length > 0) {
      console.log('\n🚨 RECENT ALERTS:');
      activeAlerts.slice(0, 3).forEach(alert => {
        const age = Math.floor((Date.now() - alert.timestamp) / 1000);
        console.log(`   ${(alert.severity || 'info').toUpperCase()}: ${alert.metric} (${age}s ago)`);
      });
    }
    
    console.log('='.repeat(80) + '\n');
  }
  
  /**
   * Generate detailed performance analysis report
   */
  generateDetailedReport() {
    const stats = this.metrics.getPerformanceStats();
    const trends = this.calculateTrends();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overall_health: this.dashboardData.systemHealth.status,
        trading_efficiency: this.calculateTradingEfficiency(),
        performance_score: this.calculatePerformanceScore(),
        meme_coin_readiness: this.assessMemeCoinReadiness()
      },
      current_metrics: stats,
      trends: trends,
      recommendations: this.generateRecommendations(stats, trends)
    };
    
    console.log(`📋 DETAILED PERFORMANCE REPORT: ${JSON.stringify(report, null, 2)}`);
    
    return report;
  }
  
  /**
   * Calculate performance trends over time
   */
  calculateTrends() {
    const reports = this.dashboardData.trends.reports || [];
    if (reports.length < 2) return {};
    
    const latest = reports[reports.length - 1];
    const previous = reports[Math.max(0, reports.length - 6)]; // 5 minutes ago
    
    return {
      scan_latency_trend: this.calculateTrend(previous.scan_latency_p95, latest.scan_latency_p95),
      validation_success_trend: this.calculateTrend(previous.validation_success_rate_percent, latest.validation_success_rate_percent),
      candidate_rate_trend: this.calculateTrend(previous.candidate_rate_per_minute, latest.candidate_rate_per_minute),
      memory_trend: this.calculateTrend(previous.memory_mb, latest.memory_mb),
      error_rate_trend: this.calculateTrend(previous.rpc_failure_rate_percent, latest.rpc_failure_rate_percent)
    };
  }
  
  calculateTrend(previous, current) {
    if (!previous || !current) return 'stable';
    
    const change = ((current - previous) / previous) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Calculate overall trading efficiency score (0-100)
   */
  calculateTradingEfficiency() {
    const stats = this.metrics.getPerformanceStats();
    
    // Weight different factors
    const latencyScore = Math.max(0, 100 - (stats.scan_latency_p95 / 20)); // 20ms = 100 points
    const successScore = stats.validation_success_rate_percent;
    const reliabilityScore = Math.max(0, 100 - (stats.rpc_failure_rate_percent * 10));
    const throughputScore = Math.min(100, stats.candidate_rate_per_minute * 10);
    
    return ((latencyScore * 0.3) + (successScore * 0.3) + (reliabilityScore * 0.2) + (throughputScore * 0.2));
  }
  
  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore() {
    const efficiency = this.calculateTradingEfficiency();
    const memoryScore = Math.max(0, 100 - (this.metrics.getPerformanceStats().memory_mb / 20)); // 2GB = 0 points
    const alertPenalty = this.dashboardData.alerts.length * 5; // 5 points per alert
    
    return Math.max(0, (efficiency * 0.7) + (memoryScore * 0.3) - alertPenalty);
  }
  
  /**
   * Assess readiness for meme coin trading bursts
   */
  assessMemeCoinReadiness() {
    const stats = this.metrics.getPerformanceStats();
    
    const criteria = {
      low_latency: stats.scan_latency_p95 < 100,           // <100ms scan latency
      high_throughput: stats.scan_rate_per_minute > 5,     // >5 scans per minute
      stable_memory: stats.memory_mb < 500,                // <500MB memory usage
      low_errors: stats.rpc_failure_rate_percent < 2,      // <2% error rate
      responsive: stats.validation_latency_p95 < 50        // <50ms validation
    };
    
    const readyCount = Object.values(criteria).filter(Boolean).length;
    const readinessPercent = (readyCount / Object.keys(criteria).length) * 100;
    
    return {
      ready: readinessPercent >= 80,
      readiness_percent: readinessPercent,
      criteria: criteria
    };
  }
  
  /**
   * Generate performance optimization recommendations
   */
  generateRecommendations(stats, trends) {
    const recommendations = [];
    
    // Latency recommendations
    if (stats.scan_latency_p95 > 1000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        issue: 'High scan latency',
        recommendation: 'Consider reducing transaction batch size or optimizing RPC calls'
      });
    }
    
    // Memory recommendations
    if (stats.memory_mb > 800) {
      recommendations.push({
        priority: 'medium',
        category: 'memory',
        issue: 'High memory usage',
        recommendation: 'Enable garbage collection optimization and review object lifecycle'
      });
    }
    
    // Error rate recommendations
    if (stats.rpc_failure_rate_percent > 5) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        issue: 'High RPC failure rate',
        recommendation: 'Add additional RPC endpoints and implement better retry logic'
      });
    }
    
    // Trend-based recommendations
    if (trends.scan_latency_trend === 'increasing') {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        issue: 'Increasing scan latency trend',
        recommendation: 'Monitor for performance regression and consider scaling up resources'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Get dashboard data for web interface
   */
  getDashboardData() {
    const stats = this.metrics.getPerformanceStats();
    const readiness = this.assessMemeCoinReadiness();
    
    return {
      tradingEfficiency: this.calculateTradingEfficiency(),
      avgTokenDetection: stats.scan_latency_p50 || 0,
      avgTokenValidation: stats.validation_latency_p50 || 0,
      memeReadiness: readiness.readiness_percent || 0,
      systemHealth: this.dashboardData.systemHealth,
      alerts: this.dashboardData.alerts,
      tradingMetrics: this.dashboardData.tradingMetrics
    };
  }
}

export { TradingDashboard };