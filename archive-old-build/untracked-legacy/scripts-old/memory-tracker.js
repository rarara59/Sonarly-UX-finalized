/**
 * Memory Tracker Module
 * Tracks memory usage per component with mathematical precision
 */

import { performance } from 'perf_hooks';
import v8 from 'v8';

class MemoryTracker {
  constructor() {
    this.measurements = [];
    this.componentSnapshots = new Map();
    this.startTime = Date.now();
    this.baselineMemory = null;
    
    // Component tracking
    this.componentRefs = new Map();
    this.componentNames = [
      'rateLimiter',
      'circuitBreaker', 
      'connectionPool',
      'endpointSelector',
      'requestCache',
      'batchManager',
      'hedgedManager'
    ];
  }
  
  /**
   * Initialize baseline memory measurement
   */
  initializeBaseline() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    this.baselineMemory = this.captureMemorySnapshot();
    console.log('📊 Memory baseline established:', this.formatBytes(this.baselineMemory.total));
    
    return this.baselineMemory;
  }
  
  /**
   * Register component for tracking
   */
  registerComponent(name, componentRef) {
    this.componentRefs.set(name, componentRef);
    
    // Initialize component snapshot
    this.componentSnapshots.set(name, {
      initial: this.estimateObjectSize(componentRef),
      current: 0,
      growth: 0,
      measurements: []
    });
  }
  
  /**
   * Capture current memory snapshot
   */
  captureMemorySnapshot() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    return {
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      total: memUsage.heapUsed + memUsage.external,
      heapStats: {
        totalHeapSize: heapStats.total_heap_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        mallocedMemory: heapStats.malloced_memory,
        peakMallocedMemory: heapStats.peak_malloced_memory
      }
    };
  }
  
  /**
   * Measure memory for all components
   */
  measureComponents() {
    const componentMeasurements = {};
    
    for (const [name, ref] of this.componentRefs) {
      const snapshot = this.componentSnapshots.get(name);
      const currentSize = this.estimateObjectSize(ref);
      
      snapshot.current = currentSize;
      snapshot.growth = currentSize - snapshot.initial;
      snapshot.measurements.push({
        timestamp: Date.now(),
        size: currentSize,
        growth: snapshot.growth
      });
      
      // Keep only last 100 measurements per component
      if (snapshot.measurements.length > 100) {
        snapshot.measurements.shift();
      }
      
      componentMeasurements[name] = {
        current: currentSize,
        initial: snapshot.initial,
        growth: snapshot.growth,
        growthPercent: ((snapshot.growth / snapshot.initial) * 100).toFixed(2) + '%'
      };
    }
    
    return componentMeasurements;
  }
  
  /**
   * Record memory measurement
   */
  recordMeasurement() {
    const snapshot = this.captureMemorySnapshot();
    const components = this.measureComponents();
    
    const measurement = {
      ...snapshot,
      components,
      totalGrowth: this.baselineMemory ? 
        snapshot.total - this.baselineMemory.total : 0
    };
    
    this.measurements.push(measurement);
    
    // Keep only last 1000 measurements
    if (this.measurements.length > 1000) {
      this.measurements.shift();
    }
    
    return measurement;
  }
  
  /**
   * Calculate memory growth rate
   */
  calculateGrowthRate() {
    if (this.measurements.length < 2) {
      return 0;
    }
    
    const recentMeasurements = this.measurements.slice(-10);
    const firstMeasure = recentMeasurements[0];
    const lastMeasure = recentMeasurements[recentMeasurements.length - 1];
    
    const memoryDiff = lastMeasure.total - firstMeasure.total;
    const timeDiff = (lastMeasure.timestamp - firstMeasure.timestamp) / 1000; // seconds
    
    return memoryDiff / timeDiff; // bytes per second
  }
  
  /**
   * Get component-specific growth analysis
   */
  analyzeComponentGrowth() {
    const analysis = {};
    
    for (const [name, snapshot] of this.componentSnapshots) {
      const measurements = snapshot.measurements;
      if (measurements.length < 2) continue;
      
      // Calculate linear regression for growth trend
      const n = measurements.length;
      const times = measurements.map((m, i) => i);
      const sizes = measurements.map(m => m.size);
      
      const sumX = times.reduce((a, b) => a + b, 0);
      const sumY = sizes.reduce((a, b) => a + b, 0);
      const sumXY = times.reduce((total, x, i) => total + x * sizes[i], 0);
      const sumX2 = times.reduce((total, x) => total + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      analysis[name] = {
        currentSize: snapshot.current,
        totalGrowth: snapshot.growth,
        growthRate: slope, // bytes per measurement
        averageSize: sumY / n,
        trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
        projectedSize60Min: intercept + slope * 120 // 120 measurements in 60 min
      };
    }
    
    return analysis;
  }
  
  /**
   * Estimate object size (simplified)
   */
  estimateObjectSize(obj) {
    const seen = new WeakSet();
    
    function sizeOf(obj) {
      if (obj === null || obj === undefined) return 0;
      
      const type = typeof obj;
      
      // Primitives
      if (type === 'boolean') return 4;
      if (type === 'number') return 8;
      if (type === 'string') return obj.length * 2;
      if (type === 'symbol') return 0;
      
      // Objects and arrays
      if (type === 'object') {
        if (seen.has(obj)) return 0;
        seen.add(obj);
        
        let size = 0;
        
        if (Array.isArray(obj)) {
          size = 8; // Array overhead
          for (const item of obj) {
            size += sizeOf(item);
          }
        } else if (obj instanceof Map) {
          size = 16; // Map overhead
          for (const [key, value] of obj) {
            size += sizeOf(key) + sizeOf(value);
          }
        } else if (obj instanceof Set) {
          size = 16; // Set overhead
          for (const item of obj) {
            size += sizeOf(item);
          }
        } else {
          size = 16; // Object overhead
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              size += sizeOf(key) + sizeOf(obj[key]);
            }
          }
        }
        
        return size;
      }
      
      return 0;
    }
    
    return sizeOf(obj);
  }
  
  /**
   * Generate memory report
   */
  generateReport() {
    const current = this.captureMemorySnapshot();
    const componentAnalysis = this.analyzeComponentGrowth();
    const growthRate = this.calculateGrowthRate();
    
    return {
      summary: {
        testDuration: (Date.now() - this.startTime) / 1000, // seconds
        totalMeasurements: this.measurements.length,
        currentMemory: this.formatBytes(current.total),
        baselineMemory: this.formatBytes(this.baselineMemory?.total || 0),
        totalGrowth: this.formatBytes(current.total - (this.baselineMemory?.total || 0)),
        growthRate: this.formatBytes(growthRate) + '/s',
        projectedHourlyGrowth: this.formatBytes(growthRate * 3600)
      },
      components: componentAnalysis,
      heapStats: current.heapStats,
      measurements: this.measurements.slice(-20) // Last 20 measurements
    };
  }
  
  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Start automatic tracking
   */
  startTracking(intervalMs = 30000) {
    this.trackingInterval = setInterval(() => {
      const measurement = this.recordMeasurement();
      console.log(`📊 Memory: ${this.formatBytes(measurement.total)} | Growth: ${this.formatBytes(measurement.totalGrowth)}`);
    }, intervalMs);
  }
  
  /**
   * Stop tracking
   */
  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }
}

export { MemoryTracker };