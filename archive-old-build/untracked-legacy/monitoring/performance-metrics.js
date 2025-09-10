/**
 * Renaissance-grade performance monitoring system optimized for trading
 * Features: real-time metrics, alerting, trend analysis, business correlation
 */
import { EventEmitter } from 'events';

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
  
  /**
   * Get current metrics for web dashboard
   */
  getMetrics() {
    const stats = this.getPerformanceStats();
    return {
      rpcCalls: {
        total: this.counters.totalRequests,
        successful: this.counters.successfulRequests,
        failed: this.counters.failedRequests,
        successRate: this.counters.totalRequests > 0 ? 
          this.counters.successfulRequests / this.counters.totalRequests : 0
      },
      performance: stats,
      realtime: {
        scanLatency: this.latestMetrics.scanLatency || 0,
        validationLatency: this.latestMetrics.validationLatency || 0,
        memoryUsage: this.latestMetrics.memory || 0,
        cpuUsage: this.latestMetrics.cpu || 0
      }
    };
  }
  
  /**
   * Get dashboard data for web interface
   */
  getDashboardData() {
    const stats = this.getPerformanceStats();
    const readiness = this.assessMemeCoinReadiness();
    
    return {
      tradingEfficiency: this.calculateTradingEfficiency(),
      avgTokenDetection: stats.scan_latency_p50 || 0,
      avgTokenValidation: stats.validation_latency_p50 || 0,
      memeReadiness: readiness.readiness_percent || 0,
      systemHealth: {
        status: readiness.ready ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };
  }
  
  /**
   * Get historical data for charts
   */
  getHistoricalData(hours = 1) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const history = [];
    
    // Get scan latency history
    const scanData = this.metrics.scanLatency.samples.filter(s => s.timestamp > cutoff);
    scanData.forEach(sample => {
      history.push({
        timestamp: sample.timestamp,
        metric: 'scanLatency',
        value: sample.value
      });
    });
    
    return history;
  }
  
  /**
   * Get recent alerts for dashboard
   */
  getRecentAlerts() {
    const cutoff = Date.now() - (60 * 60 * 1000); // Last hour
    return this.alertHistory
      .filter(alert => alert.timestamp > cutoff)
      .map(alert => ({
        timestamp: alert.timestamp,
        severity: alert.severity,
        message: `${alert.type}: ${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold
      }));
  }
  
  /**
   * Calculate trading efficiency score
   */
  calculateTradingEfficiency() {
    const stats = this.getPerformanceStats();
    
    // Weight different factors
    const latencyScore = Math.max(0, 100 - (stats.scan_latency_p95 / 20)); // 20ms = 100 points
    const successScore = stats.validation_success_rate_percent;
    const reliabilityScore = Math.max(0, 100 - (stats.rpc_failure_rate_percent * 10));
    const throughputScore = Math.min(100, stats.candidate_rate_per_minute * 10);
    
    return ((latencyScore * 0.3) + (successScore * 0.3) + (reliabilityScore * 0.2) + (throughputScore * 0.2));
  }
  
  /**
   * Assess readiness for meme coin trading
   */
  assessMemeCoinReadiness() {
    const stats = this.getPerformanceStats();
    
    const criteria = {
      low_latency: stats.scan_latency_p95 < 100,
      high_throughput: stats.scan_rate_per_minute > 5,
      stable_memory: stats.memory_mb < 500,
      low_errors: stats.rpc_failure_rate_percent < 2,
      responsive: stats.validation_latency_p95 < 50
    };
    
    const readyCount = Object.values(criteria).filter(Boolean).length;
    const readinessPercent = (readyCount / Object.keys(criteria).length) * 100;
    
    return {
      ready: readinessPercent >= 80,
      readiness_percent: readinessPercent,
      criteria: criteria
    };
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

export { PerformanceMetrics, TimeSeries, PercentileTracker };