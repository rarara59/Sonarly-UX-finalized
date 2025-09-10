# CRITICAL FIX: Extract Performance Monitor for <30ms Tracking

## Problem Statement
No real-time visibility into whether system meets <30ms latency targets for meme coin trading. Need to extract performance monitoring from monolith to track SLA violations, alert on performance degradation, and optimize bottlenecks.

## Solution Overview
Extract PerformanceMonitor class with real-time latency tracking, SLA contract enforcement, automated alerting, and component-level performance analysis optimized for trading speed requirements.

## Implementation

### File: `src/monitoring/performance-monitor.js`

```javascript
/**
 * Performance Monitor - Real-time <30ms latency tracking
 * SLA contract enforcement with automated alerting
 * Target: Continuous performance tracking, instant violation detection
 */

export class PerformanceMonitor {
  constructor(options = {}) {
    // Performance contracts (SLA targets)
    this.performanceContracts = {
      tokenValidator: {
        maxLatency: 3, // ms
        minCacheHitRate: 0.95,
        maxErrorRate: 0.001
      },
      rpcConnection: {
        maxLatency: 10, // ms
        minThroughput: 1000, // requests/min
        maxFailureRate: 0.05
      },
      batchOptimizer: {
        maxLatency: 25, // ms
        minBatchSize: 5,
        maxMemoryUsage: 100 // MB
      },
      httpClient: {
        maxLatency: 5, // ms
        minPoolEfficiency: 0.8,
        maxConnectionTime: 1000 // ms
      },
      endToEnd: {
        maxLatency: 30, // ms - CRITICAL for meme coin trading
        minUptime: 0.999,
        maxBacklog: 50 // transactions
      }
    };
    
    // Alert thresholds
    this.alertThresholds = {
      critical: {
        latencyMultiplier: 2.0, // 2x SLA = critical
        errorRateThreshold: 0.1, // 10% error rate
        uptimeThreshold: 0.99 // Below 99% uptime
      },
      warning: {
        latencyMultiplier: 1.5, // 1.5x SLA = warning
        errorRateThreshold: 0.05, // 5% error rate
        uptimeThreshold: 0.995 // Below 99.5% uptime
      }
    };
    
    // Performance metrics storage
    this.metrics = new Map();
    this.alerts = new Map();
    this.trends = new Map();
    
    // Real-time tracking
    this.activeRequests = new Map();
    this.recentLatencies = new Map(); // Rolling window for averages
    this.windowSize = options.windowSize || 100; // Keep last 100 samples
    
    // Alert handlers
    this.alertHandlers = new Map();
    this.alertCooldowns = new Map();
    this.alertCooldownTime = options.alertCooldownTime || 60000; // 1 minute
    
    // System-wide tracking
    this.systemStats = {
      startTime: Date.now(),
      totalRequests: 0,
      totalErrors: 0,
      totalLatency: 0,
      uptime: 1.0,
      lastHealthCheck: Date.now()
    };
    
    // Initialize components
    this.initializeMetrics();
    this.startPerformanceTracking();
  }

  // Initialize metrics for all components
  initializeMetrics() {
    for (const componentName of Object.keys(this.performanceContracts)) {
      this.metrics.set(componentName, {
        latencies: [],
        errors: 0,
        successes: 0,
        totalRequests: 0,
        avgLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        errorRate: 0,
        throughput: 0,
        lastUpdate: Date.now(),
        violations: []
      });
      
      this.recentLatencies.set(componentName, []);
      this.trends.set(componentName, {
        latencyTrend: 'stable', // stable, increasing, decreasing
        errorTrend: 'stable',
        throughputTrend: 'stable'
      });
    }
  }

  // Record latency for a component
  recordLatency(componentName, latency, success = true) {
    const startTime = performance.now();
    
    if (!this.metrics.has(componentName)) {
      console.warn(`Unknown component: ${componentName}`);
      return;
    }
    
    const metrics = this.metrics.get(componentName);
    const recentLatencies = this.recentLatencies.get(componentName);
    
    // Update basic metrics
    metrics.totalRequests++;
    this.systemStats.totalRequests++;
    
    if (success) {
      metrics.successes++;
    } else {
      metrics.errors++;
      this.systemStats.totalErrors++;
    }
    
    // Add to latency tracking
    metrics.latencies.push(latency);
    recentLatencies.push({ latency, timestamp: Date.now(), success });
    
    // Maintain rolling window
    if (recentLatencies.length > this.windowSize) {
      recentLatencies.shift();
    }
    
    // Update derived metrics
    this.updateDerivedMetrics(componentName);
    
    // Check for SLA violations
    this.checkSLAViolations(componentName, latency, success);
    
    // Update system-wide stats
    this.systemStats.totalLatency += latency;
    metrics.lastUpdate = Date.now();
    
    // Track monitoring overhead
    const monitoringLatency = performance.now() - startTime;
    if (monitoringLatency > 1.0) {
      console.warn(`Performance monitoring overhead: ${monitoringLatency.toFixed(2)}ms`);
    }
  }

  // Update derived metrics (averages, percentiles, rates)
  updateDerivedMetrics(componentName) {
    const metrics = this.metrics.get(componentName);
    const recentLatencies = this.recentLatencies.get(componentName);
    
    if (recentLatencies.length === 0) return;
    
    // Calculate average latency from recent samples
    const latencySum = recentLatencies.reduce((sum, sample) => sum + sample.latency, 0);
    metrics.avgLatency = latencySum / recentLatencies.length;
    
    // Calculate percentiles
    const sortedLatencies = recentLatencies
      .map(sample => sample.latency)
      .sort((a, b) => a - b);
    
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);
    
    metrics.p95Latency = sortedLatencies[p95Index] || 0;
    metrics.p99Latency = sortedLatencies[p99Index] || 0;
    
    // Calculate error rate from recent samples
    const recentErrors = recentLatencies.filter(sample => !sample.success).length;
    metrics.errorRate = recentLatencies.length > 0 ? recentErrors / recentLatencies.length : 0;
    
    // Calculate throughput (requests per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentSamples = recentLatencies.filter(sample => sample.timestamp > oneMinuteAgo);
    metrics.throughput = recentSamples.length; // requests in last minute
    
    // Update trends
    this.updateTrends(componentName);
  }

  // Update performance trends
  updateTrends(componentName) {
    const metrics = this.metrics.get(componentName);
    const trends = this.trends.get(componentName);
    const recentLatencies = this.recentLatencies.get(componentName);
    
    if (recentLatencies.length < 10) return; // Need minimum samples
    
    // Analyze latency trend (last 25% vs previous 25%)
    const totalSamples = recentLatencies.length;
    const quarterSize = Math.floor(totalSamples / 4);
    
    const recentQuarter = recentLatencies.slice(-quarterSize);
    const previousQuarter = recentLatencies.slice(-quarterSize * 2, -quarterSize);
    
    if (previousQuarter.length > 0) {
      const recentAvg = recentQuarter.reduce((sum, s) => sum + s.latency, 0) / recentQuarter.length;
      const previousAvg = previousQuarter.reduce((sum, s) => sum + s.latency, 0) / previousQuarter.length;
      
      const changeRatio = recentAvg / previousAvg;
      
      if (changeRatio > 1.2) {
        trends.latencyTrend = 'increasing';
      } else if (changeRatio < 0.8) {
        trends.latencyTrend = 'decreasing';
      } else {
        trends.latencyTrend = 'stable';
      }
      
      // Similar analysis for error rate
      const recentErrors = recentQuarter.filter(s => !s.success).length / recentQuarter.length;
      const previousErrors = previousQuarter.filter(s => !s.success).length / previousQuarter.length;
      
      if (recentErrors > previousErrors * 1.5) {
        trends.errorTrend = 'increasing';
      } else if (recentErrors < previousErrors * 0.5) {
        trends.errorTrend = 'decreasing';
      } else {
        trends.errorTrend = 'stable';
      }
    }
  }

  // Check for SLA violations and trigger alerts
  checkSLAViolations(componentName, latency, success) {
    const contract = this.performanceContracts[componentName];
    const metrics = this.metrics.get(componentName);
    
    if (!contract) return;
    
    const violations = [];
    
    // Check latency violation
    if (latency > contract.maxLatency) {
      violations.push({
        type: 'LATENCY_VIOLATION',
        component: componentName,
        measured: latency,
        threshold: contract.maxLatency,
        severity: latency > contract.maxLatency * 2 ? 'critical' : 'warning',
        timestamp: Date.now()
      });
    }
    
    // Check error rate violation
    if (metrics.errorRate > contract.maxErrorRate) {
      violations.push({
        type: 'ERROR_RATE_VIOLATION',
        component: componentName,
        measured: metrics.errorRate,
        threshold: contract.maxErrorRate,
        severity: metrics.errorRate > 0.1 ? 'critical' : 'warning',
        timestamp: Date.now()
      });
    }
    
    // Check cache hit rate (if applicable)
    if (contract.minCacheHitRate && componentName === 'tokenValidator') {
      // This would be passed in via recordCacheHit method
    }
    
    // Process violations
    violations.forEach(violation => {
      this.handleViolation(violation);
      metrics.violations.push(violation);
    });
  }

  // Handle SLA violations with alerting
  handleViolation(violation) {
    const alertKey = `${violation.component}_${violation.type}`;
    const now = Date.now();
    
    // Check cooldown
    if (this.alertCooldowns.has(alertKey)) {
      const lastAlert = this.alertCooldowns.get(alertKey);
      if (now - lastAlert < this.alertCooldownTime) {
        return; // Still in cooldown
      }
    }
    
    // Record alert
    this.alertCooldowns.set(alertKey, now);
    this.alerts.set(alertKey, violation);
    
    // Trigger alert handlers
    this.triggerAlert(violation);
    
    // Console logging for immediate visibility
    const message = `🚨 ${violation.severity.toUpperCase()} ALERT: ${violation.type} in ${violation.component}`;
    const details = `Measured: ${violation.measured} | Threshold: ${violation.threshold}`;
    
    if (violation.severity === 'critical') {
      console.error(message);
      console.error(details);
    } else {
      console.warn(message);
      console.warn(details);
    }
  }

  // Trigger alert handlers
  triggerAlert(violation) {
    const handlers = this.alertHandlers.get(violation.type) || [];
    
    handlers.forEach(handler => {
      try {
        handler(violation);
      } catch (error) {
        console.error(`Alert handler error:`, error);
      }
    });
    
    // Default alert actions
    if (violation.component === 'endToEnd' && violation.severity === 'critical') {
      this.handleCriticalLatencyViolation(violation);
    }
  }

  // Handle critical end-to-end latency violations
  handleCriticalLatencyViolation(violation) {
    console.error('🔥 CRITICAL: End-to-end latency exceeds trading thresholds!');
    console.error(`Measured: ${violation.measured}ms | Target: ${violation.threshold}ms`);
    
    // Could trigger automatic performance optimizations here
    // For example: clear caches, restart connections, etc.
  }

  // Register alert handler
  onAlert(violationType, handler) {
    if (!this.alertHandlers.has(violationType)) {
      this.alertHandlers.set(violationType, []);
    }
    this.alertHandlers.get(violationType).push(handler);
  }

  // Record cache hit for cache-enabled components
  recordCacheHit(componentName, isHit) {
    const metrics = this.metrics.get(componentName);
    if (!metrics) return;
    
    // Update cache metrics (would need to be added to metrics structure)
    if (!metrics.cacheStats) {
      metrics.cacheStats = { hits: 0, misses: 0, hitRate: 0 };
    }
    
    if (isHit) {
      metrics.cacheStats.hits++;
    } else {
      metrics.cacheStats.misses++;
    }
    
    const total = metrics.cacheStats.hits + metrics.cacheStats.misses;
    metrics.cacheStats.hitRate = total > 0 ? metrics.cacheStats.hits / total : 0;
    
    // Check cache hit rate SLA
    const contract = this.performanceContracts[componentName];
    if (contract.minCacheHitRate && metrics.cacheStats.hitRate < contract.minCacheHitRate) {
      this.handleViolation({
        type: 'CACHE_HIT_RATE_VIOLATION',
        component: componentName,
        measured: metrics.cacheStats.hitRate,
        threshold: contract.minCacheHitRate,
        severity: 'warning',
        timestamp: Date.now()
      });
    }
  }

  // Record custom metric
  recordMetric(componentName, metricName, value) {
    const metrics = this.metrics.get(componentName);
    if (!metrics) return;
    
    if (!metrics.customMetrics) {
      metrics.customMetrics = new Map();
    }
    
    metrics.customMetrics.set(metricName, {
      value,
      timestamp: Date.now()
    });
  }

  // Start performance tracking loop
  startPerformanceTracking() {
    // Update system uptime every 10 seconds
    setInterval(() => {
      const now = Date.now();
      const uptime = (now - this.systemStats.startTime) / 1000;
      this.systemStats.uptime = uptime;
      this.systemStats.lastHealthCheck = now;
      
      // Check overall system health
      this.checkSystemHealth();
      
    }, 10000);
    
    // Clean old violations every 5 minutes
    setInterval(() => {
      this.cleanOldViolations();
    }, 300000);
  }

  // Check overall system health
  checkSystemHealth() {
    const totalRequests = this.systemStats.totalRequests;
    const totalErrors = this.systemStats.totalErrors;
    const overallErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    
    // Check system-wide error rate
    if (overallErrorRate > 0.05) { // 5% system error rate
      this.handleViolation({
        type: 'SYSTEM_ERROR_RATE_VIOLATION',
        component: 'system',
        measured: overallErrorRate,
        threshold: 0.05,
        severity: overallErrorRate > 0.1 ? 'critical' : 'warning',
        timestamp: Date.now()
      });
    }
    
    // Calculate system average latency
    const systemAvgLatency = totalRequests > 0 ? this.systemStats.totalLatency / totalRequests : 0;
    
    // Log system health periodically
    console.log('📊 System Health Check:', {
      uptime: `${(this.systemStats.uptime / 3600).toFixed(1)}h`,
      totalRequests,
      errorRate: `${(overallErrorRate * 100).toFixed(2)}%`,
      avgLatency: `${systemAvgLatency.toFixed(1)}ms`,
      activeAlerts: this.alerts.size
    });
  }

  // Clean old violations (keep last 24 hours)
  cleanOldViolations() {
    const cutoffTime = Date.now() - 86400000; // 24 hours
    
    for (const [componentName, metrics] of this.metrics) {
      metrics.violations = metrics.violations.filter(
        violation => violation.timestamp > cutoffTime
      );
    }
    
    // Clean old alerts
    for (const [alertKey, violation] of this.alerts) {
      if (violation.timestamp < cutoffTime) {
        this.alerts.delete(alertKey);
      }
    }
  }

  // Get comprehensive performance report
  getPerformanceReport() {
    const report = {
      timestamp: Date.now(),
      systemStats: { ...this.systemStats },
      components: {},
      alerts: Array.from(this.alerts.values()),
      trends: Object.fromEntries(this.trends),
      overallHealth: this.getOverallHealth()
    };
    
    // Add component metrics
    for (const [componentName, metrics] of this.metrics) {
      const contract = this.performanceContracts[componentName];
      report.components[componentName] = {
        ...metrics,
        contract,
        health: this.getComponentHealth(componentName),
        trend: this.trends.get(componentName)
      };
    }
    
    return report;
  }

  // Get component health score (0-100)
  getComponentHealth(componentName) {
    const metrics = this.metrics.get(componentName);
    const contract = this.performanceContracts[componentName];
    
    if (!metrics || !contract) return 0;
    
    let healthScore = 100;
    
    // Penalize latency violations
    if (metrics.avgLatency > contract.maxLatency) {
      const latencyPenalty = Math.min(50, (metrics.avgLatency / contract.maxLatency - 1) * 100);
      healthScore -= latencyPenalty;
    }
    
    // Penalize error rate violations
    if (metrics.errorRate > contract.maxErrorRate) {
      const errorPenalty = Math.min(30, metrics.errorRate * 100);
      healthScore -= errorPenalty;
    }
    
    // Penalize recent violations
    const recentViolations = metrics.violations.filter(
      v => Date.now() - v.timestamp < 300000 // Last 5 minutes
    ).length;
    healthScore -= Math.min(20, recentViolations * 5);
    
    return Math.max(0, healthScore);
  }

  // Get overall system health
  getOverallHealth() {
    const componentHealths = Array.from(this.metrics.keys())
      .map(name => this.getComponentHealth(name));
    
    if (componentHealths.length === 0) return 100;
    
    return componentHealths.reduce((sum, health) => sum + health, 0) / componentHealths.length;
  }

  // Get current performance statistics
  getStats() {
    return {
      systemStats: this.systemStats,
      activeAlerts: this.alerts.size,
      totalViolations: Array.from(this.metrics.values())
        .reduce((sum, metrics) => sum + metrics.violations.length, 0),
      overallHealth: this.getOverallHealth(),
      monitoringOverhead: this.getMonitoringOverhead()
    };
  }

  // Calculate monitoring overhead
  getMonitoringOverhead() {
    // Estimate based on number of tracked components and recent activity
    const componentCount = this.metrics.size;
    const recentActivity = Array.from(this.recentLatencies.values())
      .reduce((sum, latencies) => sum + latencies.length, 0);
    
    return {
      componentCount,
      recentSamples: recentActivity,
      estimatedOverhead: `${(componentCount * 0.1 + recentActivity * 0.001).toFixed(2)}ms`
    };
  }

  // Health check
  isHealthy() {
    return this.getOverallHealth() > 80; // Above 80% health
  }

  // Clear all metrics (for testing)
  clearMetrics() {
    this.metrics.clear();
    this.alerts.clear();
    this.trends.clear();
    this.recentLatencies.clear();
    this.alertCooldowns.clear();
    
    this.systemStats = {
      startTime: Date.now(),
      totalRequests: 0,
      totalErrors: 0,
      totalLatency: 0,
      uptime: 1.0,
      lastHealthCheck: Date.now()
    };
    
    this.initializeMetrics();
  }
}
```

### Integration with RPC Connection Pool

Update `src/transport/rpc-connection-pool.js` to use PerformanceMonitor:

```javascript
// Add to imports
import { PerformanceMonitor } from '../monitoring/performance-monitor.js';

// Add to constructor
constructor(endpoints, performanceMonitor = null) {
  // ... existing code ...
  
  // Initialize performance monitor
  this.monitor = performanceMonitor || new PerformanceMonitor();
  
  // Setup alert handlers
  this.setupPerformanceAlerts();
}

// Setup performance alerts
setupPerformanceAlerts() {
  // Alert on critical end-to-end latency
  this.monitor.onAlert('LATENCY_VIOLATION', (violation) => {
    if (violation.component === 'endToEnd' && violation.severity === 'critical') {
      console.error('🚨 TRADING SPEED ALERT: Exceeding 30ms target!');
      console.error(`Current: ${violation.measured}ms | Target: ${violation.threshold}ms`);
      
      // Could trigger automatic optimizations here
      this.optimizeForSpeed();
    }
  });
  
  // Alert on RPC connection issues
  this.monitor.onAlert('ERROR_RATE_VIOLATION', (violation) => {
    if (violation.component === 'rpcConnection') {
      console.warn(`🔧 RPC Connection Alert: ${violation.measured * 100}% error rate`);
      // Could trigger endpoint switching
    }
  });
}

// Optimize for speed when critical alerts trigger
optimizeForSpeed() {
  console.log('🚀 Triggering speed optimizations...');
  
  // Clear caches to force fresh data
  if (this.fastCache) {
    this.fastCache.clearCache();
  }
  
  // Reset connection pools
  if (this.httpClient) {
    this.httpClient.closeIdleConnections();
  }
  
  // Switch to fastest endpoint
  const fastestEndpoint = this.selectFastestEndpoint();
  if (fastestEndpoint) {
    console.log(`Switching to fastest endpoint: ${fastestEndpoint}`);
  }
}

// Update call method to record performance
async call(method, params = [], options = {}) {
  const startTime = Date.now();
  
  try {
    // ... existing validation and processing ...
    
    const result = await this.executeCall(method, params, options.timeout || 8000);
    
    // Record successful performance
    const latency = Date.now() - startTime;
    this.monitor.recordLatency('rpcConnection', latency, true);
    
    return result;
    
  } catch (error) {
    // Record failed performance
    const latency = Date.now() - startTime;
    this.monitor.recordLatency('rpcConnection', latency, false);
    
    throw error;
  }
}

// Add method to record end-to-end performance
async callWithEndToEndTracking(method, params = [], options = {}) {
  const startTime = Date.now();
  
  try {
    const result = await this.call(method, params, options);
    
    // Record end-to-end latency (critical for trading)
    const endToEndLatency = Date.now() - startTime;
    this.monitor.recordLatency('endToEnd', endToEndLatency, true);
    
    return result;
    
  } catch (error) {
    const endToEndLatency = Date.now() - startTime;
    this.monitor.recordLatency('endToEnd', endToEndLatency, false);
    
    throw error;
  }
}

// Update getStats method
getStats() {
  return {
    // ... existing stats ...
    performance: this.monitor.getPerformanceReport(),
    monitoring: this.monitor.getStats()
  };
}
```

### Usage Examples

```javascript
// Basic performance tracking
const rpcPool = new RpcConnectionPool();

// Call with end-to-end tracking
const result = await rpcPool.callWithEndToEndTracking(
  'getAccountInfo', 
  ['So11111111111111111111111111111111111111112']
);

// Check if meeting performance targets
const report = rpcPool.getStats().performance;
console.log(`Overall health: ${report.overallHealth.toFixed(1)}%`);

// Check for active alerts
if (report.alerts.length > 0) {
  console.log('Active performance alerts:', report.alerts);
}
```

## Performance Benefits

### Real-time Monitoring:
- **<30ms latency tracking** for end-to-end operations
- **SLA contract enforcement** with automatic violations
- **Trend analysis** to predict performance degradation
- **Component-level tracking** for bottleneck identification

### Automated Alerting:
- **Critical alerts** for trading speed violations
- **Warning alerts** for approaching thresholds  
- **Cooldown periods** prevent alert spam
- **Custom handlers** for automated responses

## Implementation Steps

1. **Create** `src/monitoring/performance-monitor.js` with provided code
2. **Update** `src/transport/rpc-connection-pool.js` with monitor integration
3. **Update** `src/validation/token-validator.js` to record performance
4. **Test** performance tracking with sample operations
5. **Configure** alert thresholds for your trading requirements

## Success Metrics

- **Monitoring Overhead**: <0.1ms per operation
- **Alert Accuracy**: 95%+ relevant alerts  
- **Response Time**: Instant violation detection
- **Coverage**: All critical components tracked

Both extractions provide critical security and observability for your meme coin trading system.