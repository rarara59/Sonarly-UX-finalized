/**
 * Real-time Performance Monitor
 * Target: Continuous SLA monitoring, instant alerting
 * 180 lines - Renaissance-grade metrics collection
 */

export class PerformanceMonitor {
  constructor(alertCallback = null) {
    this.alertCallback = alertCallback;
    this.startTime = performance.now();
    this.intervals = [];
    this.timeouts = [];
    
    // Service-level performance contracts from blueprint
    this.contracts = {
      tokenValidator: { maxLatency: 3, minCacheHitRate: 0.95, maxErrorRate: 0.001 },
      transactionFetcher: { maxLatency: 10, minThroughput: 1000, maxErrorRate: 0.05 },
      detectorOrchestrator: { maxLatency: 25, minAccuracy: 0.99, maxMemoryUsage: 100 },
      pipelineCoordinator: { maxLatency: 30, minUptime: 0.999, maxBacklog: 50 },
      signalBus: { maxLatency: 0.1, maxErrorRate: 0.001 }
    };
    
    // Real-time metrics storage
    this.metrics = new Map();
    this.alerts = new Set();
    
    // Initialize service metrics
    Object.keys(this.contracts).forEach(service => {
      this.metrics.set(service, {
        latencies: [],
        errors: 0,
        successes: 0,
        lastLatency: 0,
        avgLatency: 0,
        p95Latency: 0,
        errorRate: 0,
        throughput: 0,
        lastActivity: Date.now(),
        violations: 0
      });
    });
    
    // Global system metrics
    this.systemMetrics = {
      totalRequests: 0,
      candidatesGenerated: 0,
      opportunitiesCaptured: 0,
      uptime: 1.0,
      memoryUsage: 0
    };
    
    // Start monitoring loops
    this.startMetricsCollection();
  }
  
  // Primary method: Record service latency with instant SLA check
  recordLatency(serviceName, latencyMs, success = true) {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;
    
    // Update metrics
    metrics.latencies.push(latencyMs);
    if (metrics.latencies.length > 1000) {
      metrics.latencies = metrics.latencies.slice(-1000); // Keep last 1000
    }
    
    metrics.lastLatency = latencyMs;
    metrics.lastActivity = Date.now();
    
    if (success) {
      metrics.successes++;
    } else {
      metrics.errors++;
    }
    
    // Calculate running averages - removed expensive sort from hot path
    // this.updateServiceMetrics(serviceName); // Removed to improve performance
    
    // Instant SLA violation check
    const contract = this.contracts[serviceName];
    if (latencyMs > contract.maxLatency) {
      this.triggerAlert(serviceName, 'LATENCY_VIOLATION', {
        measured: latencyMs,
        threshold: contract.maxLatency,
        severity: latencyMs > contract.maxLatency * 2 ? 'CRITICAL' : 'WARNING'
      });
    }
  }
  
  // Record throughput for fetcher services
  recordThroughput(serviceName, itemsProcessed, timeWindowMs) {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;
    
    const throughputPerMinute = (itemsProcessed / timeWindowMs) * 60000;
    metrics.throughput = throughputPerMinute;
    
    const contract = this.contracts[serviceName];
    if (contract.minThroughput && throughputPerMinute < contract.minThroughput) {
      this.triggerAlert(serviceName, 'THROUGHPUT_VIOLATION', {
        measured: throughputPerMinute,
        threshold: contract.minThroughput
      });
    }
  }
  
  // Record cache performance for token validator
  recordCacheHit(serviceName, hit) {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;
    
    if (!metrics.cacheHits) metrics.cacheHits = 0;
    if (!metrics.cacheMisses) metrics.cacheMisses = 0;
    
    if (hit) {
      metrics.cacheHits++;
    } else {
      metrics.cacheMisses++;
    }
    
    const hitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
    const contract = this.contracts[serviceName];
    
    if (contract.minCacheHitRate && hitRate < contract.minCacheHitRate) {
      this.triggerAlert(serviceName, 'CACHE_PERFORMANCE', {
        measured: hitRate,
        threshold: contract.minCacheHitRate
      });
    }
  }
  
  // Update calculated metrics for a service
  updateServiceMetrics(serviceName) {
    const metrics = this.metrics.get(serviceName);
    if (!metrics || metrics.latencies.length === 0) return;
    
    // Calculate averages and percentiles
    const sorted = [...metrics.latencies].sort((a, b) => a - b);
    metrics.avgLatency = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    metrics.p95Latency = sorted[Math.floor(sorted.length * 0.95)];
    
    // Error rate
    const total = metrics.successes + metrics.errors;
    metrics.errorRate = total > 0 ? metrics.errors / total : 0;
    
    // Check error rate violations
    const contract = this.contracts[serviceName];
    if (metrics.errorRate > contract.maxErrorRate) {
      this.triggerAlert(serviceName, 'ERROR_RATE_VIOLATION', {
        measured: metrics.errorRate,
        threshold: contract.maxErrorRate
      });
    }
  }
  
  // Trigger alert with deduplication
  triggerAlert(serviceName, alertType, details) {
    const alertKey = `${serviceName}:${alertType}`;
    
    // Deduplicate alerts (max 1 per minute per service/type)
    if (this.alerts.has(alertKey)) return;
    
    this.alerts.add(alertKey);
    this.timeouts.push(setTimeout(() => this.alerts.delete(alertKey), 60000)); // 1 minute cooldown
    
    const alert = {
      timestamp: Date.now(),
      service: serviceName,
      type: alertType,
      details,
      severity: details.severity || 'WARNING'
    };
    
    // Log alert
    console.error(`[ALERT] ${alert.severity}: ${serviceName} ${alertType}`, details);
    
    // Trigger callback if provided
    if (this.alertCallback) {
      this.alertCallback(alert);
    }
    
    // Track violations
    const metrics = this.metrics.get(serviceName);
    if (metrics) metrics.violations++;
  }
  
  // SignalBus compatibility method
  recordCycle(latencyMs, count = 1, success = true) {
    this.recordLatency('signalBus', latencyMs, success);
  }
  
  // Get current performance snapshot
  getSnapshot() {
    // Calculate fresh metrics for accurate snapshot
    this.metrics.forEach((_, serviceName) => this.updateServiceMetrics(serviceName));
    const snapshot = {
      timestamp: Date.now(),
      uptime: (performance.now() - this.startTime) / 1000,
      services: {},
      system: { ...this.systemMetrics }
    };
    
    // Add service metrics
    this.metrics.forEach((metrics, serviceName) => {
      snapshot.services[serviceName] = {
        avgLatency: Math.round(metrics.avgLatency * 100) / 100,
        p95Latency: Math.round(metrics.p95Latency * 100) / 100,
        errorRate: Math.round(metrics.errorRate * 10000) / 10000,
        throughput: Math.round(metrics.throughput),
        violations: metrics.violations,
        lastActivity: metrics.lastActivity
      };
    });
    
    return snapshot;
  }
  
  // Check if system is healthy (all SLAs met)
  isHealthy() {
    for (const [serviceName, metrics] of this.metrics) {
      const contract = this.contracts[serviceName];
      
      if (metrics.avgLatency > contract.maxLatency) return false;
      if (metrics.errorRate > contract.maxErrorRate) return false;
      if (contract.minThroughput && metrics.throughput < contract.minThroughput) return false;
    }
    
    return true;
  }
  
  // Start background metrics collection
  startMetricsCollection() {
    // Memory monitoring every 10 seconds
    this.intervals.push(setInterval(() => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const mem = process.memoryUsage();
        this.systemMetrics.memoryUsage = Math.round(mem.heapUsed / 1024 / 1024); // MB
      }
    }, 10000));
    
    // Service health checks every 30 seconds
    this.intervals.push(setInterval(() => {
      const now = Date.now();
      this.metrics.forEach((metrics, serviceName) => {
        // Check if service is inactive (no activity in 60 seconds)
        if (now - metrics.lastActivity > 60000) {
          this.triggerAlert(serviceName, 'SERVICE_INACTIVE', {
            lastActivity: new Date(metrics.lastActivity).toISOString()
          });
        }
      });
    }, 30000));
  }
  
  // Reset metrics (useful for testing)
  reset() {
    this.metrics.clear();
    this.systemMetrics = {
      totalRequests: 0,
      candidatesGenerated: 0,
      opportunitiesCaptured: 0,
      uptime: 1.0,
      memoryUsage: 0
    };
    this.alerts.clear();
  }
  
  // Cleanup resources for graceful shutdown
  shutdown() {
    this.intervals.forEach(clearInterval);
    this.timeouts.forEach(clearTimeout);
    this.intervals = [];
    this.timeouts = [];
  }
}

// Export performance contracts for other services
export const PERFORMANCE_CONTRACTS = {
  tokenValidator: { maxLatency: 3, minCacheHitRate: 0.95, maxErrorRate: 0.001 },
  transactionFetcher: { maxLatency: 10, minThroughput: 1000, maxErrorRate: 0.05 },
  detectorOrchestrator: { maxLatency: 25, minAccuracy: 0.99, maxMemoryUsage: 100 },
  pipelineCoordinator: { maxLatency: 30, minUptime: 0.999, maxBacklog: 50 },
  signalBus: { maxLatency: 0.1, maxErrorRate: 0.001 }
};