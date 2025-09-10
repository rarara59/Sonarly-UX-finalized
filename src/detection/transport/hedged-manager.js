/**
 * Hedged Manager - Parallel Request Coordination with Backup Triggering
 * Extracted from rpc-connection-pool.js for standalone use
 * Implements hedged requests pattern for improved tail latency
 */

import { EventEmitter } from 'events';

export class HedgedManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration with environment variable support
    this.hedgingDelay = config.hedgingDelay || 
                        parseInt(process.env.RPC_HEDGING_DELAY_MS) || 
                        parseInt(process.env.HEDGING_DELAY_MS) || 
                        200; // milliseconds to wait before triggering backup
    
    this.maxBackups = config.maxBackups || 
                      parseInt(process.env.RPC_HEDGING_MAX_EXTRA) || 
                      parseInt(process.env.MAX_BACKUP_REQUESTS) || 
                      1; // maximum number of backup requests
    
    this.adaptiveDelayEnabled = config.adaptiveDelayEnabled !== false && 
                                process.env.ADAPTIVE_HEDGING_ENABLED !== 'false';
    
    this.cancellationTimeout = config.cancellationTimeout || 
                               parseInt(process.env.HEDGING_CANCELLATION_TIMEOUT_MS) || 
                               100; // ms to wait for cancellation
    
    // Methods that should not be hedged (side-effect operations)
    this.nonHedgeMethods = config.nonHedgeMethods || [
      'sendTransaction',
      'simulateTransaction',
      'sendRawTransaction',
      'requestAirdrop'
    ];
    
    // Tracking active hedged requests
    this.activeHedges = new Map(); // requestId -> HedgeInfo
    
    // Statistics tracking
    this.stats = {
      totalRequests: 0,
      hedgedRequests: 0,
      hedgesTriggered: 0,
      hedgesWon: 0,
      hedgesCancelled: 0,
      primaryWins: 0,
      avgLatencyImprovement: 0,
      totalLatencyImprovement: 0,
      cancellationSuccess: 0,
      cancellationFailures: 0,
      memoryLeaks: 0
    }
;
    
    // Memory management
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleHedges();
    }, 30000); // Clean up every 30 seconds
    
    // Validate configuration
    this.validateConfiguration();
  }
  
  /**
   * Initialize the HedgedManager (compatibility method)
   */
  async initialize() {
    // Component is already initialized in constructor
    return true;
  }
  
  /**
   * Validate configuration values
   */
  validateConfiguration() {
    if (this.hedgingDelay <= 0) {
      throw new Error('Hedging delay must be positive');
    }
    
    if (this.maxBackups < 0) {
      throw new Error('Max backups cannot be negative');
    }
    
    if (this.cancellationTimeout <= 0) {
      throw new Error('Cancellation timeout must be positive');
    }
  }
  
  /**
   * Execute a hedged request with automatic backup triggering
   */
  async hedgedRequest(primaryRequest, backupRequests = [], options = {}) {
    const requestId = options.requestId || this.generateRequestId();
    const method = options.method || 'unknown';
    const startTime = Date.now();
    
    this.stats.totalRequests++;
    
    // Ensure primaryRequest is a function
    if (typeof primaryRequest !== 'function') {
      throw new Error('primaryRequest must be a function');
    }
    
    // Check if method should be hedged
    if (!this.shouldHedge(method, options)) {
      // Execute primary only
      try {
        const result = await primaryRequest();
        this.emit('request-completed', {
          requestId,
          source: 'primary',
          latency: Date.now() - startTime,
          hedged: false
        });
        return result;
      } catch (error) {
        this.emit('request-failed', {
          requestId,
          source: 'primary',
          error: error.message,
          hedged: false
        });
        throw error;
      }
    }
    
    this.stats.hedgedRequests++;
    
    // Create hedge tracking
    const hedgeInfo = {
      requestId,
      method,
      startTime,
      primaryPromise: null,
      backupPromises: [],
      timers: [],
      resolved: false,
      winner: null,
      cancelled: []
    };
    
    this.activeHedges.set(requestId, hedgeInfo);
    
    try {
      // Wrap primary request with tracking
      hedgeInfo.primaryPromise = this.wrapRequest(
        primaryRequest(),
        'primary',
        hedgeInfo
      );
      
      // Schedule backup requests
      this.scheduleBackups(backupRequests, hedgeInfo, options);
      
      // Race all requests
      const result = await this.raceRequests(hedgeInfo);
      
      // Cleanup and return
      await this.cleanupHedge(requestId);
      
      return result;
    } catch (error) {
      await this.cleanupHedge(requestId);
      throw error;
    }
  }
  
  /**
   * Check if a request should be hedged
   */
  shouldHedge(method, options = {}) {
    // Skip non-hedgeable methods
    if (this.nonHedgeMethods.includes(method)) {
      return false;
    }
    
    // Skip if explicitly disabled
    if (options.disableHedging === true) {
      return false;
    }
    
    // Don't check for backups here - they're passed separately to hedgedRequest
    return true;
  }
  
  /**
   * Calculate adaptive hedging delay based on recent latencies
   */
  calculateHedgingDelay(options = {}) {
    if (!this.adaptiveDelayEnabled) {
      return this.hedgingDelay;
    }
    
    // Use P95 latency if provided
    if (options.p95Latency && options.p95Latency > 0) {
      return Math.min(options.p95Latency, this.hedgingDelay * 2);
    }
    
    // Use recent latencies if provided
    if (options.recentLatencies && options.recentLatencies.length >= 5) {
      const sorted = [...options.recentLatencies].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95 = sorted[p95Index];
      return Math.min(p95, this.hedgingDelay * 2);
    }
    
    return this.hedgingDelay;
  }
  
  /**
   * Schedule backup requests with proper timing
   */
  scheduleBackups(backupRequests, hedgeInfo, options = {}) {
    if (!backupRequests || backupRequests.length === 0) {
      return;
    }
    
    const effectiveDelay = this.calculateHedgingDelay(options);
    const maxBackups = Math.min(backupRequests.length, this.maxBackups);
    
    for (let i = 0; i < maxBackups; i++) {
      const backupRequest = backupRequests[i];
      const delay = effectiveDelay * (i + 1); // Stagger backups
      
      const timer = setTimeout(() => {
        // Check if already resolved
        if (hedgeInfo.resolved) {
          return;
        }
        
        this.stats.hedgesTriggered++;
        
        // Execute backup request
        const backupPromise = this.wrapRequest(
          backupRequest(),
          `backup-${i}`,
          hedgeInfo
        );
        
        hedgeInfo.backupPromises.push(backupPromise);
        
        this.emit('backup-triggered', {
          requestId: hedgeInfo.requestId,
          backupIndex: i,
          delay,
          timestamp: Date.now()
        });
      }, delay);
      
      hedgeInfo.timers.push({ timer, scheduledTime: Date.now() + delay, index: i });
    }
  }
  
  /**
   * Wrap a request promise with tracking
   */
  wrapRequest(promise, source, hedgeInfo) {
    const startTime = Date.now();
    
    return promise
      .then(result => {
        const latency = Date.now() - startTime;
        
        // Check if this is the winner
        if (!hedgeInfo.resolved) {
          hedgeInfo.resolved = true;
          hedgeInfo.winner = source;
          
          if (source === 'primary') {
            this.stats.primaryWins++;
          } else {
            this.stats.hedgesWon++;
            const improvement = this.calculateLatencyImprovement(hedgeInfo, latency);
            this.stats.totalLatencyImprovement += improvement;
          }
          
          this.emit('request-won', {
            requestId: hedgeInfo.requestId,
            winner: source,
            latency
          });
        }
        
        return { result, source, latency };
      })
      .catch(error => {
        const latency = Date.now() - startTime;
        
        this.emit('request-error', {
          requestId: hedgeInfo.requestId,
          source,
          error: error.message || error,
          latency
        });
        
        // Re-throw to participate in race
        throw { error, source, latency };
      });
  }
  
  /**
   * Race all active requests
   */
  async raceRequests(hedgeInfo) {
    // Wait for primary to be set up
    if (!hedgeInfo.primaryPromise) {
      throw new Error('No primary promise available');
    }
    
    // If no backups scheduled yet, just return primary
    if (hedgeInfo.backupPromises.length === 0) {
      // Wait for backups to be scheduled or primary to complete
      const maxWait = this.hedgingDelay * (this.maxBackups + 1);
      const waitForBackups = new Promise((resolve) => {
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          if (hedgeInfo.backupPromises.length > 0 || hedgeInfo.resolved || checkCount > maxWait / 10) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 10);
      });
      
      await waitForBackups;
    }
    
    // Get all active promises
    const allPromises = [
      hedgeInfo.primaryPromise,
      ...hedgeInfo.backupPromises
    ];
    
    // Use Promise.race to get first successful result
    try {
      const result = await Promise.race(allPromises);
      return result.result;
    } catch (firstError) {
      // If first one fails, wait for all to complete/fail
      const results = await Promise.allSettled(allPromises);
      
      // Check if any succeeded
      for (const result of results) {
        if (result.status === 'fulfilled') {
          return result.value.result;
        }
      }
      
      // All failed - collect errors
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason?.error?.message || r.reason?.error || r.reason);
      
      const combinedError = new Error(`All requests failed: ${errors.join(', ')}`);
      combinedError.errors = errors;
      throw combinedError;
    }
  }
  
  /**
   * Calculate latency improvement from hedging
   */
  calculateLatencyImprovement(hedgeInfo, actualLatency) {
    if (!hedgeInfo.winner || hedgeInfo.winner === 'primary') {
      return 0;
    }
    
    // Estimate what primary latency would have been
    const hedgingDelay = this.calculateHedgingDelay();
    const backupIndex = parseInt(hedgeInfo.winner.split('-')[1] || 0);
    const triggerDelay = hedgingDelay * (backupIndex + 1);
    
    // Improvement is the time saved by using backup
    return Math.max(0, triggerDelay - actualLatency);
  }
  
  /**
   * Clean up a hedged request
   */
  async cleanupHedge(requestId) {
    const hedgeInfo = this.activeHedges.get(requestId);
    if (!hedgeInfo) {
      return;
    }
    
    const cleanupStart = Date.now();
    
    // Cancel pending timers
    for (const timerInfo of hedgeInfo.timers) {
      clearTimeout(timerInfo.timer);
      
      // Track if backup was cancelled before triggering
      if (Date.now() < timerInfo.scheduledTime) {
        this.stats.hedgesCancelled++;
        hedgeInfo.cancelled.push(`backup-${timerInfo.index}`);
      }
    }
    
    // Mark hedge as resolved if not already
    hedgeInfo.resolved = true;
    
    // Emit cleanup event
    this.emit('hedge-cleanup', {
      requestId,
      winner: hedgeInfo.winner,
      cancelled: hedgeInfo.cancelled,
      cleanupTime: Date.now() - cleanupStart
    });
    
    // Track cancellation speed
    const cleanupTime = Date.now() - cleanupStart;
    if (cleanupTime <= this.cancellationTimeout) {
      this.stats.cancellationSuccess++;
    } else {
      this.stats.cancellationFailures++;
    }
    
    // Remove from active hedges
    this.activeHedges.delete(requestId);
  }
  
  /**
   * Clean up stale hedges (memory leak prevention)
   */
  cleanupStaleHedges() {
    const now = Date.now();
    const staleTimeout = 60000; // 1 minute
    let cleaned = 0;
    
    for (const [requestId, hedgeInfo] of this.activeHedges.entries()) {
      if (now - hedgeInfo.startTime > staleTimeout) {
        this.cleanupHedge(requestId);
        cleaned++;
        this.stats.memoryLeaks++;
      }
    }
    
    if (cleaned > 0) {
      this.emit('stale-hedges-cleaned', {
        count: cleaned,
        remaining: this.activeHedges.size
      });
    }
  }
  
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `hedge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    const avgImprovement = this.stats.hedgesWon > 0
      ? Math.round(this.stats.totalLatencyImprovement / this.stats.hedgesWon)
      : 0;
    
    const hedgeSuccessRate = this.stats.hedgesTriggered > 0
      ? (this.stats.hedgesWon / this.stats.hedgesTriggered * 100).toFixed(1)
      : '0.0';
    
    const cancellationRate = (this.stats.cancellationSuccess + this.stats.cancellationFailures) > 0
      ? (this.stats.cancellationSuccess / (this.stats.cancellationSuccess + this.stats.cancellationFailures) * 100).toFixed(1)
      : '100.0';
    
    return {
      ...this.stats,
      avgLatencyImprovement: avgImprovement,
      hedgeSuccessRate: hedgeSuccessRate + '%',
      cancellationSuccessRate: cancellationRate + '%',
      activeHedges: this.activeHedges.size,
      memoryUsageMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      hedgedRequests: 0,
      hedgesTriggered: 0,
      hedgesWon: 0,
      hedgesCancelled: 0,
      primaryWins: 0,
      avgLatencyImprovement: 0,
      totalLatencyImprovement: 0,
      cancellationSuccess: 0,
      cancellationFailures: 0,
      memoryLeaks: 0
    };
    
    this.emit('stats-reset');
  }
  
  /**
   * Health check
   */
  async healthCheck() {
    const startTime = process.hrtime.bigint();
    
    try {
      // Check for memory leaks
      const hasMemoryLeaks = this.stats.memoryLeaks > 0;
      
      // Check cancellation performance
      const cancellationRate = (this.stats.cancellationSuccess + this.stats.cancellationFailures) > 0
        ? this.stats.cancellationSuccess / (this.stats.cancellationSuccess + this.stats.cancellationFailures)
        : 1;
      
      const healthy = !hasMemoryLeaks && cancellationRate >= 0.9 && this.activeHedges.size < 1000;
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;
      
      return {
        healthy,
        latency: latencyMs,
        activeHedges: this.activeHedges.size,
        memoryLeaks: this.stats.memoryLeaks,
        cancellationRate: (cancellationRate * 100).toFixed(1) + '%',
        stats: this.getStats()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
  
  /**
   * Clear all active hedges
   */
  async clear() {
    // Cleanup all active hedges
    const promises = [];
    for (const requestId of this.activeHedges.keys()) {
      promises.push(this.cleanupHedge(requestId));
    }
    
    await Promise.all(promises);
    
    this.emit('cleared', {
      hedgesCleaned: promises.length
    });
  }
  
  /**
   * Destroy the manager
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
    this.removeAllListeners();
  }
  
  /**
   * Static factory method for configuration from environment
   */
  static fromEnvironment() {
    return new HedgedManager({
      hedgingDelay: parseInt(process.env.RPC_HEDGING_DELAY_MS) || 
                    parseInt(process.env.HEDGING_DELAY_MS) || 
                    200,
      maxBackups: parseInt(process.env.RPC_HEDGING_MAX_EXTRA) || 
                  parseInt(process.env.MAX_BACKUP_REQUESTS) || 
                  1,
      adaptiveDelayEnabled: process.env.ADAPTIVE_HEDGING_ENABLED !== 'false',
      cancellationTimeout: parseInt(process.env.HEDGING_CANCELLATION_TIMEOUT_MS) || 100
    });
  }
}

// Export for backward compatibility
export default HedgedManager;