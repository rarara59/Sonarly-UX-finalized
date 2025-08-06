/**
 * Renaissance-grade Garbage Collection Manager
 * Intelligent memory management optimized for high-frequency trading
 */

export class GCManager {
  constructor(options = {}) {
    this.config = {
      heapThreshold: 0.85,        // Trigger GC at 85% heap usage
      gcInterval: 30000,          // Check every 30 seconds
      maxGCTime: 10,              // Alert if GC takes >10ms
      enableVerboseLogging: true, // Log GC events for analysis
      ...options
    };
    
    this.metrics = {
      gcCount: 0,
      totalGCTime: 0,
      avgGCTime: 0,
      maxGCTime: 0,
      lastGCTime: Date.now(),
      memoryFreed: 0,
      gcEvents: []
    };
    
    this.state = {
      isEnabled: typeof global.gc === 'function',
      isAutoGCActive: false,
      isSuspended: false,
      lastHeapSnapshot: null
    };
    
    this.intervals = {
      autoGC: null,
      memoryCheck: null,
      metricsReport: null
    };
    
    this.initialize();
  }
  
  initialize() {
    if (!this.state.isEnabled) {
      console.warn('⚠️ GC not available - run with --expose-gc flag');
      console.warn('💡 For optimal memory management, start with: node --expose-gc src/index.js');
      return;
    }
    
    console.log('✅ GCManager initialized with manual GC control');
    console.log(`📊 Heap threshold: ${(this.config.heapThreshold * 100).toFixed(0)}%`);
    console.log(`⏱️  GC check interval: ${this.config.gcInterval / 1000}s`);
    
    // Start automatic GC management
    this.startAutomaticGC();
    
    // Start memory pressure monitoring
    this.startMemoryMonitoring();
    
    // Start metrics reporting
    this.startMetricsReporting();
  }
  
  /**
   * Start automatic garbage collection based on safe windows
   */
  startAutomaticGC() {
    if (!this.state.isEnabled || this.state.isAutoGCActive) return;
    
    this.state.isAutoGCActive = true;
    
    this.intervals.autoGC = setInterval(() => {
      if (!this.state.isSuspended) {
        this.checkAndPerformGC();
      }
    }, this.config.gcInterval);
    
    console.log('🔄 Automatic GC management started');
  }
  
  /**
   * Check memory pressure and perform GC if needed
   */
  async checkAndPerformGC() {
    const memUsage = process.memoryUsage();
    const heapRatio = memUsage.heapUsed / memUsage.heapTotal;
    
    // Store heap snapshot for analysis
    this.state.lastHeapSnapshot = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      timestamp: Date.now()
    };
    
    // Check if GC is needed based on heap usage
    if (heapRatio > this.config.heapThreshold) {
      if (this.config.enableVerboseLogging) {
        console.log(`📊 Heap usage: ${(heapRatio * 100).toFixed(1)}% - triggering GC`);
      }
      
      await this.forceCleanup();
    }
  }
  
  /**
   * Force garbage collection with timing and metrics
   */
  async forceCleanup() {
    if (!this.state.isEnabled || this.state.isSuspended) return;
    
    const startTime = process.hrtime.bigint();
    const memBefore = process.memoryUsage();
    
    try {
      // Perform garbage collection
      global.gc();
      
      // Calculate timing and memory freed
      const gcTime = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to ms
      const memAfter = process.memoryUsage();
      const memoryFreed = memBefore.heapUsed - memAfter.heapUsed;
      
      // Update metrics
      this.updateMetrics(gcTime, memBefore, memAfter);
      
      // Log if verbose or if GC took too long
      if (this.config.enableVerboseLogging || gcTime > this.config.maxGCTime) {
        const freedMB = (memoryFreed / 1024 / 1024).toFixed(1);
        const beforeMB = (memBefore.heapUsed / 1024 / 1024).toFixed(1);
        const afterMB = (memAfter.heapUsed / 1024 / 1024).toFixed(1);
        
        if (gcTime > this.config.maxGCTime) {
          console.warn(`⚠️ Slow GC: ${gcTime.toFixed(2)}ms (freed ${freedMB}MB)`);
        } else {
          console.log(`🧹 GC completed: ${beforeMB}MB → ${afterMB}MB (${gcTime.toFixed(2)}ms)`);
        }
      }
      
      return {
        success: true,
        duration: gcTime,
        memoryFreed: memoryFreed,
        heapBefore: memBefore.heapUsed,
        heapAfter: memAfter.heapUsed
      };
      
    } catch (error) {
      console.error('❌ GC error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update GC metrics
   */
  updateMetrics(duration, memBefore, memAfter) {
    this.metrics.gcCount++;
    this.metrics.totalGCTime += duration;
    this.metrics.avgGCTime = this.metrics.totalGCTime / this.metrics.gcCount;
    this.metrics.maxGCTime = Math.max(this.metrics.maxGCTime, duration);
    this.metrics.lastGCTime = Date.now();
    this.metrics.memoryFreed += (memBefore.heapUsed - memAfter.heapUsed);
    
    // Keep last 100 GC events for analysis
    this.metrics.gcEvents.push({
      timestamp: Date.now(),
      duration: duration,
      heapBefore: memBefore.heapUsed,
      heapAfter: memAfter.heapUsed,
      heapTotal: memBefore.heapTotal,
      external: memBefore.external,
      rss: memBefore.rss
    });
    
    if (this.metrics.gcEvents.length > 100) {
      this.metrics.gcEvents.shift();
    }
  }
  
  /**
   * Start memory pressure monitoring
   */
  startMemoryMonitoring() {
    this.intervals.memoryCheck = setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapRatio = memUsage.heapUsed / memUsage.heapTotal;
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      
      // Critical memory pressure alerts
      if (heapRatio > 0.95) {
        console.error(`🚨 CRITICAL memory pressure: ${(heapRatio * 100).toFixed(1)}% heap usage`);
        this.performEmergencyGC();
      } else if (heapRatio > 0.90) {
        console.warn(`⚠️ High memory pressure: ${(heapRatio * 100).toFixed(1)}% heap usage`);
      }
      
      // Check for memory leaks
      if (this.detectPotentialLeak()) {
        console.warn('⚠️ Potential memory leak detected - monitoring closely');
      }
    }, 15000); // Every 15 seconds
  }
  
  /**
   * Detect potential memory leaks
   */
  detectPotentialLeak() {
    if (this.metrics.gcEvents.length < 10) return false;
    
    // Analyze last 10 GC events
    const recentEvents = this.metrics.gcEvents.slice(-10);
    const firstEvent = recentEvents[0];
    const lastEvent = recentEvents[recentEvents.length - 1];
    
    // Check if heap usage is consistently growing despite GC
    const heapGrowth = lastEvent.heapAfter - firstEvent.heapAfter;
    const timeSpan = lastEvent.timestamp - firstEvent.timestamp;
    const growthRateMBPerHour = (heapGrowth / 1024 / 1024) / (timeSpan / 3600000);
    
    // Alert if growing more than 50MB per hour
    return growthRateMBPerHour > 50;
  }
  
  /**
   * Perform emergency GC (multiple cycles)
   */
  performEmergencyGC() {
    if (!this.state.isEnabled) return;
    
    console.log('🆘 Performing emergency GC (5 cycles)');
    const startTime = process.hrtime.bigint();
    
    for (let i = 0; i < 5; i++) {
      global.gc();
    }
    
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    console.log(`🆘 Emergency GC completed in ${duration.toFixed(2)}ms`);
  }
  
  /**
   * Start periodic metrics reporting
   */
  startMetricsReporting() {
    this.intervals.metricsReport = setInterval(() => {
      if (this.config.enableVerboseLogging) {
        const stats = this.getStats();
        console.log('📊 GC Manager Stats:', {
          gcCount: stats.gcCount,
          avgGCTime: `${stats.avgGCTime.toFixed(2)}ms`,
          maxGCTime: `${stats.maxGCTime.toFixed(2)}ms`,
          totalMemoryFreed: `${stats.totalMemoryFreedMB.toFixed(1)}MB`,
          heapUtilization: `${stats.heapUtilization.toFixed(1)}%`
        });
      }
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Suspend automatic GC (for critical trading periods)
   */
  suspendAutomaticGC() {
    this.state.isSuspended = true;
    if (this.config.enableVerboseLogging) {
      console.log('⏸️  Automatic GC suspended for critical operations');
    }
  }
  
  /**
   * Resume automatic GC
   */
  resumeAutomaticGC() {
    this.state.isSuspended = false;
    if (this.config.enableVerboseLogging) {
      console.log('▶️  Automatic GC resumed');
    }
    
    // Perform immediate check after resuming
    this.checkAndPerformGC();
  }
  
  /**
   * Get GC performance statistics
   */
  getStats() {
    const memUsage = process.memoryUsage();
    const heapUtilization = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    return {
      isEnabled: this.state.isEnabled,
      isAutoGCActive: this.state.isAutoGCActive,
      isSuspended: this.state.isSuspended,
      gcCount: this.metrics.gcCount,
      totalGCTime: this.metrics.totalGCTime,
      avgGCTime: this.metrics.avgGCTime,
      maxGCTime: this.metrics.maxGCTime,
      lastGCTime: this.metrics.lastGCTime,
      totalMemoryFreedMB: this.metrics.memoryFreed / 1024 / 1024,
      heapUsedMB: memUsage.heapUsed / 1024 / 1024,
      heapTotalMB: memUsage.heapTotal / 1024 / 1024,
      heapUtilization: heapUtilization,
      rssMB: memUsage.rss / 1024 / 1024,
      externalMB: memUsage.external / 1024 / 1024,
      recentGCEvents: this.metrics.gcEvents.slice(-5)
    };
  }
  
  /**
   * Shutdown GC manager
   */
  shutdown() {
    console.log('🔌 Shutting down GC Manager');
    
    // Clear all intervals
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    
    // Perform final GC
    if (this.state.isEnabled) {
      global.gc();
    }
    
    this.state.isAutoGCActive = false;
  }
}

// Export singleton instance
export const gcManager = new GCManager();
export default gcManager;