# CRITICAL FIX: Performance Monitoring Enhancements (Renaissance Production Grade)

## Problem Analysis

**Root Cause:** Limited performance monitoring and metrics collection prevents optimization, troubleshooting, and real-time visibility into system performance during critical meme coin trading periods.

**Evidence from Production Logs:**
```
📊 System Health: 7 services, 0m uptime, 18.9MB peak
🧠 Memory: 19MB (OK) | GC: 0 forced
📊 SCAN COMPLETE: 0 candidates, 33ms, efficiency: 4856.3%
[Minimal metrics, no trend analysis, no performance alerting]
```

**Trading Impact:** 
- **Blind Performance**: Cannot identify bottlenecks during viral meme token launches
- **No SLA Monitoring**: No measurement against sub-100ms trading requirements
- **Reactive Debugging**: Performance issues discovered after revenue loss
- **Capacity Planning**: No data for scaling decisions during high-volume periods

## Current Limited Monitoring

**File:** Various services with basic console output
**Issue:** Ad-hoc performance logging without structured metrics collection

```javascript
// BROKEN: Basic console output without trends or alerting
console.log(`📊 System Health: 7 services, 0m uptime, 18.9MB peak`);
console.log(`📊 SCAN COMPLETE: 0 candidates, 33ms, efficiency: 4856.3%`);
// SHOULD BE: Comprehensive metrics with alerting, trends, and business correlation
```

## Renaissance-Grade Fix

### Part 1: Comprehensive Performance Metrics System

Create this new file: `./src/monitoring/performance-metrics.js`

```javascript
/**
 * Renaissance-grade performance monitoring system optimized for trading
 * Features: real-time metrics, alerting, trend analysis, business correlation
 */
const EventEmitter = require('events');

class PerformanceMetrics extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.service = options.service || 'thorp-trading';
    this.environment = process.env.NODE_ENV || 'development';
    this.startTime = Date.now();
    
    // Trading-specific SLA thresholds
    this.slaThresholds = {
      tokenDetectionLatency: 100,     // 100ms max for token detection
      validationLatency: 50,          // 50ms max for validation
      scanCycleLatency: 2000,         // 2s max for full scan cycle
      memoryUsagePercent: 80,         // 80% max memory usage
      cpuUsagePercent: 70,            // 70% max CPU usage
      errorRatePercent: 1,            // 1% max error rate
      signalGenerationRate: 10        // Min 10 signals per hour during active markets
    };
    
    // Metrics storage with time-series data
    this.metrics = {
      // System metrics
      memory: new TimeSeries(300),          // 5 minutes of data
      cpu: new TimeSeries(300),
      uptime: new TimeSeries(300),
      
      // Trading metrics
      scanLatency: new TimeSeries(1000),    // 16+ minutes of scan data
      validationLatency: new TimeSeries(500),
      tokenDetectionRate: new TimeSeries(300),
      signalGenerationRate: new TimeSeries(300),
      
      // Business metrics
      candidatesGenerated: new TimeSeries(300),
      successfulValidations: new TimeSeries(300),
      potentialRevenue: new TimeSeries(300),
      
      // Error tracking
      errorRate: new TimeSeries(300),
      rpcFailures: new TimeSeries(300),
      validationFailures: new TimeSeries(300)
    };
    
    // Performance counters
    this.counters = {
      totalScans: 0,
      totalCandidates: 0,
      totalValidations: 0,
      successfulValidations: 0,
      rpcCalls: 0,
      rpcFailures: 0,
      alertsTriggered: 0
    };
    
    // Percentile tracking for latency analysis
    this.latencyPercentiles = {
      scanLatency: new PercentileTracker(),
      validationLatency: new PercentileTracker(),
      tokenDetection: new PercentileTracker()
    };
    
    // Alert state tracking
    this.alertStates = new Map();
    
    // Initialize monitoring
    this.initializeSystemMonitoring();
    this.initializeHealthChecks();
    
    console.log(`📊 Performance Metrics initialized: slaMode=${this.environment === 'production'}`);
  }
  
  /**
   * Record system performance metrics
   */
  recordSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const timestamp = Date.now();
    
    // Memory metrics (in MB)
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    this.metrics.memory.add(heapUsedMB, timestamp);
    
    // CPU metrics (convert microseconds to percentage)
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 10000; // Rough approximation
    this.metrics.cpu.add(cpuPercent, timestamp);
    
    // Uptime
    this.metrics.uptime.add(process.uptime(), timestamp);
    
    // Check SLA violations
    this.checkSLAViolations('memory', memoryUsagePercent);
    this.checkSLAViolations('cpu', cpuPercent);
  }
  
  /**
   * Record trading-specific performance metrics
   */
  recordTradingMetrics(type, value, metadata = {}) {
    const timestamp = Date.now();
    
    switch (type) {
      case 'scanLatency':
        this.metrics.scanLatency.add(value, timestamp);
        this.latencyPercentiles.scanLatency.add(value);
        this.counters.totalScans++;
        this.checkSLAViolations('scanCycleLatency', value);
        break;
        
      case 'validationLatency':
        this.metrics.validationLatency.add(value, timestamp);
        this.latencyPercentiles.validationLatency.add(value);
        this.counters.totalValidations++;
        this.checkSLAViolations('validationLatency', value);
        break;
        
      case 'tokenDetection':
        this.metrics.tokenDetectionRate.add(value, timestamp);
        this.latencyPercentiles.tokenDetection.add(value);
        this.checkSLAViolations('tokenDetectionLatency', value);
        break;
        
      case 'candidateGenerated':
        this.metrics.candidatesGenerated.add(1, timestamp);
        this.counters.totalCandidates++;
        break;
        
      case 'validationSuccess':
        this.metrics.successfulValidations.add(1, timestamp);
        this.counters.successfulValidations++;
        break;
        
      case 'rpcFailure':
        this.metrics.rpcFailures.add(1, timestamp);
        this.counters.rpcFailures++;
        break;
        
      case 'potentialRevenue':
        // Estimate potential revenue from successful signals
        this.metrics.potentialRevenue.add(value, timestamp);
        break;
    }
    
    // Emit metric event for real-time monitoring
    this.emit('metric', { type, value, metadata, timestamp });
  }
  
  /**
   * Check for SLA violations and trigger alerts
   */
  checkSLAViolations(metric, value) {
    const threshold = this.slaThresholds[metric];
    if (!threshold) return;
    
    const isViolation = value > threshold;
    const alertKey = `sla_${metric}`;
    const currentlyAlerting = this.alertStates.get(alertKey);
    
    if (isViolation && !currentlyAlerting) {
      // New SLA violation
      this.alertStates.set(alertKey, true);
      this.counters.alertsTriggered++;
      
      this.emit('alert', {
        type: 'sla_violation',
        metric: metric,
        value: value,
        threshold: threshold,
        severity: this.getAlertSeverity(metric, value, threshold),
        timestamp: Date.now()
      });
      
    } else if (!isViolation && currentlyAlerting) {
      // SLA violation resolved
      this.alertStates.set(alertKey, false);
      
      this.emit('alert', {
        type: 'sla_resolved',
        metric: metric,
        value: value,
        threshold: threshold,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Get alert severity based on how much threshold is exceeded
   */
  getAlertSeverity(metric, value, threshold) {
    const exceedPercent = ((value - threshold) / threshold) * 100;
    
    if (exceedPercent > 100) return 'critical';      // >200% of threshold
    if (exceedPercent > 50) return 'high';           // >150% of threshold
    if (exceedPercent > 20) return 'medium';         // >120% of threshold
    return 'low';                                    // >100% of threshold
  }
  
  /**
   * Calculate comprehensive performance statistics
   */
  getPerformanceStats() {
    const now = Date.now();
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    // Calculate rates (per minute)
    const scanRate = this.counters.totalScans / (uptime / 60);
    const candidateRate = this.counters.totalCandidates / (uptime / 60);
    const validationSuccessRate = this.counters.successfulValidations / Math.max(this.counters.totalValidations, 1) * 100;
    const rpcFailureRate = this.counters.rpcFailures / Math.max(this.counters.rpcCalls, 1) * 100;
    
    return {
      // System metrics
      uptime_seconds: uptime,
      memory_mb: memUsage.heapUsed / 1024 / 1024,
      memory_total_mb: memUsage.heapTotal / 1024 / 1024,
      
      // Performance metrics
      scan_rate_per_minute: scanRate,
      candidate_rate_per_minute: candidateRate,
      validation_success_rate_percent: validationSuccessRate,
      rpc_failure_rate_percent: rpcFailureRate,
      
      // Latency percentiles
      scan_latency_p50: this.latencyPercentiles.scanLatency.getPercentile(50),
      scan_latency_p95: this.latencyPercentiles.scanLatency.getPercentile(95),
      scan_latency_p99: this.latencyPercentiles.scanLatency.getPercentile(99),
      
      validation_latency_p50: this.latencyPercentiles.validationLatency.getPercentile(50),
      validation_latency_p95: this.latencyPercentiles.validationLatency.getPercentile(95),
      
      // Business metrics
      total_candidates: this.counters.totalCandidates,
      successful_validations: this.counters.successfulValidations,
      alerts_triggered: this.counters.alertsTriggered,
      
      // Current alert states
      active_alerts: Array.from(this.alertStates.entries()).filter(([_, active]) => active).map(([alert, _]) => alert)
    };
  }
  
  /**
   * Initialize system monitoring with periodic collection
   */
  initializeSystemMonitoring() {
    // Collect system metrics every 5 seconds
    setInterval(() => {
      this.recordSystemMetrics();
    }, 5000);
    
    // Generate performance reports every minute
    setInterval(() => {
      this.generatePerformanceReport();
    }, 60000);
  }
  
  /**
   * Initialize health checks for critical components
   */
  initializeHealthChecks() {
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Perform comprehensive health checks
   */
  async performHealthChecks() {
    const health = {
      status: 'healthy',
      checks: {},
      timestamp: Date.now()
    };
    
    try {
      // Memory health check
      const memUsage = process.memoryUsage();
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      health.checks.memory = {
        status: memPercent < 80 ? 'healthy' : 'unhealthy',
        usage_percent: memPercent,
        heap_used_mb: memUsage.heapUsed / 1024 / 1024
      };
      
      // Performance health check
      const scanLatencyP95 = this.latencyPercentiles.scanLatency.getPercentile(95);
      health.checks.performance = {
        status: scanLatencyP95 < this.slaThresholds.scanCycleLatency ? 'healthy' : 'unhealthy',
        scan_latency_p95: scanLatencyP95,
        threshold: this.slaThresholds.scanCycleLatency
      };
      
      // Error rate health check
      const errorRate = this.counters.rpcFailures / Math.max(this.counters.rpcCalls, 1) * 100;
      health.checks.error_rate = {
        status: errorRate < this.slaThresholds.errorRatePercent ? 'healthy' : 'unhealthy',
        error_rate_percent: errorRate,
        threshold: this.slaThresholds.errorRatePercent
      };
      
      // Overall health status
      const unhealthyChecks = Object.values(health.checks).filter(check => check.status === 'unhealthy');
      health.status = unhealthyChecks.length === 0 ? 'healthy' : 'unhealthy';
      
      // Emit health status
      this.emit('health', health);
      
    } catch (error) {
      health.status = 'error';
      health.error = error.message;
      this.emit('health', health);
    }
  }
  
  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport() {
    const stats = this.getPerformanceStats();
    const report = {
      timestamp: new Date().toISOString(),
      service: this.service,
      environment: this.environment,
      uptime_minutes: Math.floor(stats.uptime_seconds / 60),
      ...stats
    };
    
    this.emit('performance_report', report);
    
    // Log summary (structured for monitoring systems)
    console.log(`PERFORMANCE_REPORT: ${JSON.stringify(report)}`);
  }
}

/**
 * Time series data structure for metrics storage
 */
class TimeSeries {
  constructor(maxPoints = 300) {
    this.maxPoints = maxPoints;
    this.data = [];
  }
  
  add(value, timestamp = Date.now()) {
    this.data.push({ value, timestamp });
    
    // Keep only recent data points
    if (this.data.length > this.maxPoints) {
      this.data = this.data.slice(-this.maxPoints);
    }
  }
  
  getRecent(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.data.filter(point => point.timestamp > cutoff);
  }
  
  getAverage(minutes = 5) {
    const recent = this.getRecent(minutes);
    if (recent.length === 0) return 0;
    
    const sum = recent.reduce((total, point) => total + point.value, 0);
    return sum / recent.length;
  }
  
  getMax(minutes = 5) {
    const recent = this.getRecent(minutes);
    if (recent.length === 0) return 0;
    
    return Math.max(...recent.map(point => point.value));
  }
}

/**
 * Percentile tracker for latency analysis
 */
class PercentileTracker {
  constructor(maxSamples = 1000) {
    this.maxSamples = maxSamples;
    this.samples = [];
  }
  
  add(value) {
    this.samples.push(value);
    
    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }
  
  getPercentile(p) {
    if (this.samples.length === 0) return 0;
    
    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

module.exports = { PerformanceMetrics, TimeSeries, PercentileTracker };
```

### Part 2: Trading-Specific Metrics Dashboard

Create this new file: `./src/monitoring/trading-dashboard.js`

```javascript
/**
 * Real-time trading performance dashboard optimized for meme coin trading
 */
const { PerformanceMetrics } = require('./performance-metrics');

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
        console.log(`   ${alert.severity.toUpperCase()}: ${alert.metric} (${age}s ago)`);
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
}

module.exports = { TradingDashboard };
```

### Part 3: Integrate Performance Monitoring into Main Services

**File:** `./src/services/liquidity-pool-creation-detector.service.js`

Add performance monitoring integration:

```javascript
// Add at the top of the file
const { PerformanceMetrics } = require('../monitoring/performance-metrics');
const { TradingDashboard } = require('../monitoring/trading-dashboard');

// Add to constructor
constructor(config) {
  // ... existing constructor code ...
  
  // Initialize performance monitoring
  this.performanceMetrics = new PerformanceMetrics({
    service: 'lp-detector'
  });
  
  this.tradingDashboard = new TradingDashboard(this.performanceMetrics);
  
  // Set up metric collection
  this.setupMetricCollection();
  
  console.log('📊 Performance monitoring initialized');
}

/**
 * Set up automated metric collection
 */
setupMetricCollection() {
  // Track RPC calls
  const originalRpcCall = this.rpcManager.call;
  this.rpcManager.call = async (...args) => {
    const start = Date.now();
    this.performanceMetrics.counters.rpcCalls++;
    
    try {
      const result = await originalRpcCall.apply(this.rpcManager, args);
      this.performanceMetrics.recordTradingMetrics('rpcLatency', Date.now() - start);
      return result;
    } catch (error) {
      this.performanceMetrics.recordTradingMetrics('rpcFailure', 1);
      throw error;
    }
  };
}

// Update existing scan method with performance tracking
async scanForNewLPCreations() {
  const scanStart = Date.now();
  
  // ... existing scan logic ...
  
  const scanDuration = Date.now() - scanStart;
  
  // Record performance metrics
  this.performanceMetrics.recordTradingMetrics('scanLatency', scanDuration, {
    candidates_found: candidates.length,
    transactions_processed: processedCount
  });
  
  // Record business metrics
  if (candidates.length > 0) {
    candidates.forEach(candidate => {
      this.performanceMetrics.recordTradingMetrics('candidateGenerated', 1, {
        type: candidate.type,
        confidence: candidate.confidence
      });
      
      // Estimate potential revenue (simplified)
      const potentialRevenue = this.estimatePotentialRevenue(candidate);
      this.performanceMetrics.recordTradingMetrics('potentialRevenue', potentialRevenue);
    });
  }
  
  return candidates;
}

// Add validation performance tracking
async validateMemeOpportunity(tokenMint, type = 'both', signature = null) {
  const validationStart = Date.now();
  
  try {
    const result = await this.originalValidation(tokenMint, type, signature);
    
    const validationDuration = Date.now() - validationStart;
    
    if (result.isValid) {
      this.performanceMetrics.recordTradingMetrics('validationSuccess', 1, {
        token: tokenMint.substring(0, 8),
        type: type,
        duration_ms: validationDuration
      });
    }
    
    this.performanceMetrics.recordTradingMetrics('validationLatency', validationDuration);
    
    return result;
    
  } catch (error) {
    this.performanceMetrics.recordTradingMetrics('validationFailure', 1, {
      error: error.message,
      token: tokenMint.substring(0, 8)
    });
    throw error;
  }
}

/**
 * Estimate potential revenue from trading opportunity (simplified)
 */
estimatePotentialRevenue(candidate) {
  // Simplified revenue estimation based on confidence and liquidity
  const baseRevenue = 100; // $100 base
  const confidenceMultiplier = candidate.confidence || 0.5;
  const liquidityFactor = candidate.liquidity ? Math.log10(candidate.liquidity) : 1;
  
  return baseRevenue * confidenceMultiplier * liquidityFactor;
}
```

### Part 4: Add Startup Integration

**File:** `./src/index.js`

Add performance monitoring to main application:

```javascript
// Add after existing imports
const { PerformanceMetrics } = require('./monitoring/performance-metrics');
const { TradingDashboard } = require('./monitoring/trading-dashboard');

// Add early in startup
console.log('📊 Initializing performance monitoring...');

const globalMetrics = new PerformanceMetrics({
  service: 'thorp-main'
});

const globalDashboard = new TradingDashboard(globalMetrics);

// Track application startup time
const appStartTime = Date.now();

// ... existing initialization code ...

// Record successful startup
const startupDuration = Date.now() - appStartTime;
globalMetrics.recordTradingMetrics('startupLatency', startupDuration);

console.log(`📊 Application started in ${startupDuration}ms`);
console.log('📊 Real-time performance monitoring active');
console.log('📊 Dashboard available at intervals in console output');

// Graceful shutdown with metrics
process.on('SIGINT', () => {
  console.log('📊 Shutting down performance monitoring...');
  const finalStats = globalMetrics.getPerformanceStats();
  console.log(`📊 Final Performance Summary: ${JSON.stringify(finalStats, null, 2)}`);
});
```

## Implementation Steps

1. **Create the monitoring infrastructure** (`performance-metrics.js`, `trading-dashboard.js`)

2. **Integrate performance tracking** into LP detection service with automated metric collection

3. **Add business metrics** for revenue estimation and trading opportunity tracking

4. **Configure SLA thresholds** based on meme coin trading requirements

5. **Test monitoring system** by running load tests and verifying metric collection

## Expected Monitoring Improvements

**Before Fix:**
- Basic console output with minimal metrics
- No trend analysis or performance history
- Reactive debugging after issues occur
- No business correlation or revenue tracking

**After Fix:**
- Comprehensive real-time dashboard with 10-second updates
- SLA monitoring with automatic alerting for violations
- Trend analysis and performance scoring
- Business metrics linking technical performance to revenue
- Detailed recommendations for optimization

## Validation Criteria

Look for these specific improvements in logs:
- `📊 THORP TRADING PERFORMANCE DASHBOARD` with real-time metrics
- `PERFORMANCE_REPORT:` with structured JSON for monitoring systems
- `🚨 CRITICAL ALERT:` for SLA violations with severity levels
- Latency percentiles (P50/P95/P99) for performance analysis
- Trading efficiency scores and meme coin readiness assessments

## Production Benefits

The enhanced monitoring system provides:
- **Real-time Visibility**: 10-second dashboard updates during trading
- **Proactive Alerting**: SLA violation detection before revenue impact
- **Performance Optimization**: Data-driven recommendations for improvements
- **Business Correlation**: Link technical metrics to trading performance
- **Trend Analysis**: Historical data for capacity planning and optimization

This is Renaissance-grade: comprehensive performance monitoring, real-time dashboards, SLA enforcement, and business-correlated metrics optimized for high-frequency meme coin trading requirements.