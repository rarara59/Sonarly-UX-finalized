/**
 * GC Performance Monitoring and Metrics Collection
 * Tracks garbage collection impact on trading performance
 */

import { gcManager } from '../memory/gcManager.js';

export class GCMetrics {
  constructor() {
    this.metrics = {
      gcEvents: [],
      performanceImpact: [],
      memorySnapshots: [],
      alerts: []
    };
    
    this.thresholds = {
      gcDurationWarning: 5,     // ms
      gcDurationCritical: 15,   // ms
      heapWarning: 0.80,        // 80%
      heapCritical: 0.95,       // 95%
      gcFrequencyAlert: 4       // per minute
    };
    
    this.monitoring = {
      isActive: false,
      lastReport: Date.now(),
      reportInterval: 60000     // 1 minute
    };
  }
  
  /**
   * Start monitoring GC performance
   */
  startMonitoring() {
    if (this.monitoring.isActive) return;
    
    this.monitoring.isActive = true;
    console.log('📊 GC performance monitoring started');
    
    // Monitor GC events from gcManager
    this.monitorGCEvents();
    
    // Take periodic memory snapshots
    this.startMemorySnapshots();
    
    // Generate periodic reports
    this.startPeriodicReports();
  }
  
  /**
   * Track GC event and measure impact
   */
  trackGCEvent(duration, heapBefore, heapAfter) {
    const event = {
      timestamp: Date.now(),
      duration: duration,
      heapBefore: heapBefore,
      heapAfter: heapAfter,
      heapFreed: heapBefore - heapAfter,
      heapTotal: process.memoryUsage().heapTotal,
      heapUtilization: heapAfter / process.memoryUsage().heapTotal
    };
    
    this.metrics.gcEvents.push(event);
    
    // Keep only last 1000 events
    if (this.metrics.gcEvents.length > 1000) {
      this.metrics.gcEvents.shift();
    }
    
    // Check for alerts
    this.checkAlertConditions(event);
    
    // Gauge metrics for external monitoring
    this.publishMetrics(event);
  }
  
  /**
   * Monitor GC events from gcManager
   */
  monitorGCEvents() {
    // Hook into gcManager stats
    setInterval(() => {
      const stats = gcManager.getStats();
      if (stats.recentGCEvents && stats.recentGCEvents.length > 0) {
        const latestEvent = stats.recentGCEvents[stats.recentGCEvents.length - 1];
        
        // Track if it's a new event
        const lastTracked = this.metrics.gcEvents[this.metrics.gcEvents.length - 1];
        if (!lastTracked || lastTracked.timestamp !== latestEvent.timestamp) {
          this.trackGCEvent(
            latestEvent.duration,
            latestEvent.heapBefore,
            latestEvent.heapAfter
          );
        }
      }
    }, 1000); // Check every second
  }
  
  /**
   * Take periodic memory snapshots
   */
  startMemorySnapshots() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const snapshot = {
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        arrayBuffers: memUsage.arrayBuffers || 0,
        heapUtilization: memUsage.heapUsed / memUsage.heapTotal
      };
      
      this.metrics.memorySnapshots.push(snapshot);
      
      // Keep only last 60 snapshots (1 hour at 1 per minute)
      if (this.metrics.memorySnapshots.length > 60) {
        this.metrics.memorySnapshots.shift();
      }
    }, 60000); // Every minute
  }
  
  /**
   * Check for alert conditions
   */
  checkAlertConditions(event) {
    const alerts = [];
    
    // GC duration alerts
    if (event.duration > this.thresholds.gcDurationCritical) {
      alerts.push({
        level: 'critical',
        type: 'gc_duration',
        message: `GC duration critical: ${event.duration.toFixed(2)}ms > ${this.thresholds.gcDurationCritical}ms`,
        value: event.duration
      });
    } else if (event.duration > this.thresholds.gcDurationWarning) {
      alerts.push({
        level: 'warning',
        type: 'gc_duration',
        message: `GC duration warning: ${event.duration.toFixed(2)}ms > ${this.thresholds.gcDurationWarning}ms`,
        value: event.duration
      });
    }
    
    // Heap utilization alerts
    if (event.heapUtilization > this.thresholds.heapCritical) {
      alerts.push({
        level: 'critical',
        type: 'heap_utilization',
        message: `Heap utilization critical: ${(event.heapUtilization * 100).toFixed(1)}% > ${(this.thresholds.heapCritical * 100)}%`,
        value: event.heapUtilization
      });
    } else if (event.heapUtilization > this.thresholds.heapWarning) {
      alerts.push({
        level: 'warning',
        type: 'heap_utilization',
        message: `Heap utilization warning: ${(event.heapUtilization * 100).toFixed(1)}% > ${(this.thresholds.heapWarning * 100)}%`,
        value: event.heapUtilization
      });
    }
    
    // GC frequency alerts
    const recentGCs = this.getRecentGCCount(60000); // Last minute
    if (recentGCs > this.thresholds.gcFrequencyAlert) {
      alerts.push({
        level: 'warning',
        type: 'gc_frequency',
        message: `High GC frequency: ${recentGCs} events in last minute > ${this.thresholds.gcFrequencyAlert}`,
        value: recentGCs
      });
    }
    
    // Log and store alerts
    alerts.forEach(alert => {
      console.log(`🚨 GC Alert [${alert.level}]: ${alert.message}`);
      this.metrics.alerts.push({
        ...alert,
        timestamp: Date.now()
      });
    });
    
    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
  }
  
  /**
   * Get count of recent GC events
   */
  getRecentGCCount(timeWindowMs) {
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.gcEvents.filter(event => event.timestamp > cutoff).length;
  }
  
  /**
   * Publish metrics for external monitoring systems
   */
  publishMetrics(event) {
    // These would typically be sent to a metrics aggregation service
    // For now, we'll just structure them
    const metrics = {
      'gc.duration_ms': event.duration,
      'gc.heap_before_mb': event.heapBefore / 1024 / 1024,
      'gc.heap_after_mb': event.heapAfter / 1024 / 1024,
      'gc.heap_freed_mb': event.heapFreed / 1024 / 1024,
      'gc.heap_utilization': event.heapUtilization,
      'gc.events_total': this.metrics.gcEvents.length
    };
    
    // Log for debugging (would normally send to metrics service)
    if (process.env.DEBUG_GC_METRICS) {
      console.log('📈 GC Metrics:', metrics);
    }
  }
  
  /**
   * Generate periodic performance reports
   */
  startPeriodicReports() {
    setInterval(() => {
      this.generateReport();
    }, this.monitoring.reportInterval);
  }
  
  /**
   * Generate comprehensive GC performance report
   */
  generateReport() {
    const stats = this.getGCStats();
    
    console.log('\n📊 === GC Performance Report ===');
    console.log(`📅 Period: Last ${(this.monitoring.reportInterval / 60000).toFixed(0)} minutes`);
    console.log(`🔢 GC Events: ${stats.eventCount}`);
    console.log(`⏱️  Avg Duration: ${stats.avgDuration.toFixed(2)}ms`);
    console.log(`⏱️  Max Duration: ${stats.maxDuration.toFixed(2)}ms`);
    console.log(`💾 Total Freed: ${stats.totalFreedMB.toFixed(1)}MB`);
    console.log(`📈 Heap Utilization: ${stats.currentHeapUtilization.toFixed(1)}%`);
    console.log(`🚨 Alerts: ${stats.recentAlerts} (W: ${stats.warningCount}, C: ${stats.criticalCount})`);
    
    if (stats.memoryTrend) {
      console.log(`📉 Memory Trend: ${stats.memoryTrend}`);
    }
    
    console.log('================================\n');
    
    this.monitoring.lastReport = Date.now();
  }
  
  /**
   * Get comprehensive GC statistics
   */
  getGCStats() {
    const now = Date.now();
    const recentWindow = this.monitoring.reportInterval;
    const recentEvents = this.metrics.gcEvents.filter(e => e.timestamp > now - recentWindow);
    
    // Calculate statistics
    const eventCount = recentEvents.length;
    const avgDuration = eventCount > 0 
      ? recentEvents.reduce((sum, e) => sum + e.duration, 0) / eventCount 
      : 0;
    const maxDuration = eventCount > 0 
      ? Math.max(...recentEvents.map(e => e.duration)) 
      : 0;
    const totalFreed = recentEvents.reduce((sum, e) => sum + e.heapFreed, 0);
    
    // Current memory state
    const memUsage = process.memoryUsage();
    const currentHeapUtilization = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    // Recent alerts
    const recentAlerts = this.metrics.alerts.filter(a => a.timestamp > now - recentWindow);
    const warningCount = recentAlerts.filter(a => a.level === 'warning').length;
    const criticalCount = recentAlerts.filter(a => a.level === 'critical').length;
    
    // Memory trend analysis
    const memoryTrend = this.analyzeMemoryTrend();
    
    return {
      eventCount,
      avgDuration,
      maxDuration,
      totalFreedMB: totalFreed / 1024 / 1024,
      currentHeapUtilization,
      recentAlerts: recentAlerts.length,
      warningCount,
      criticalCount,
      memoryTrend,
      memUsage: {
        heapUsedMB: memUsage.heapUsed / 1024 / 1024,
        heapTotalMB: memUsage.heapTotal / 1024 / 1024,
        rssMB: memUsage.rss / 1024 / 1024,
        externalMB: memUsage.external / 1024 / 1024
      }
    };
  }
  
  /**
   * Analyze memory trend
   */
  analyzeMemoryTrend() {
    if (this.metrics.memorySnapshots.length < 5) return 'insufficient_data';
    
    const recent = this.metrics.memorySnapshots.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const growthMB = (last.heapUsed - first.heapUsed) / 1024 / 1024;
    const timeSpanMin = (last.timestamp - first.timestamp) / 60000;
    const growthRate = growthMB / timeSpanMin; // MB per minute
    
    if (growthRate > 10) return 'rapid_growth';
    if (growthRate > 5) return 'moderate_growth';
    if (growthRate > 1) return 'slow_growth';
    if (growthRate < -1) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Get metrics for external reporting
   */
  getMetrics() {
    const stats = this.getGCStats();
    const gcManagerStats = gcManager.getStats();
    
    return {
      gc: {
        ...stats,
        manager: gcManagerStats
      },
      memory: stats.memUsage,
      alerts: {
        recent: this.metrics.alerts.slice(-10),
        counts: {
          warning: stats.warningCount,
          critical: stats.criticalCount
        }
      },
      performance: {
        gcImpact: this.calculateGCImpact(),
        memoryEfficiency: this.calculateMemoryEfficiency()
      }
    };
  }
  
  /**
   * Calculate GC impact on performance
   */
  calculateGCImpact() {
    if (this.metrics.gcEvents.length === 0) return 0;
    
    const recentEvents = this.metrics.gcEvents.slice(-10);
    const totalDuration = recentEvents.reduce((sum, e) => sum + e.duration, 0);
    const timeWindow = 60000; // 1 minute
    
    // Impact as percentage of time spent in GC
    return (totalDuration / timeWindow) * 100;
  }
  
  /**
   * Calculate memory efficiency
   */
  calculateMemoryEfficiency() {
    if (this.metrics.gcEvents.length === 0) return 100;
    
    const recentEvents = this.metrics.gcEvents.slice(-10);
    const avgFreedPerGC = recentEvents.reduce((sum, e) => sum + e.heapFreed, 0) / recentEvents.length;
    const avgHeapBefore = recentEvents.reduce((sum, e) => sum + e.heapBefore, 0) / recentEvents.length;
    
    // Efficiency as percentage of heap freed per GC
    return avgHeapBefore > 0 ? (avgFreedPerGC / avgHeapBefore) * 100 : 0;
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoring.isActive = false;
    console.log('📊 GC performance monitoring stopped');
  }
}

// Export singleton instance
export const gcMetrics = new GCMetrics();
export default gcMetrics;