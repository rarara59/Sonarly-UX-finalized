/**
 * High-Performance In-Memory Event Bus - PRODUCTION COMPLETE
 * Target: <0.1ms event emission, type-safe events
 * FIXES: Syntax errors, complete implementation, memory management, performance monitoring
 */

import { EventEmitter } from 'events';

export class SignalBus extends EventEmitter {
  constructor(circuitBreaker = null, performanceMonitor = null) {
    super();
    this.setMaxListeners(100); // High-frequency trading needs many listeners
    
    // External dependencies
    this.circuitBreaker = circuitBreaker;
    this.performanceMonitor = performanceMonitor;
    
    // Performance tracking with bounded memory
    this.metrics = {
      eventsEmitted: 0,
      totalLatency: 0,
      averageLatency: 0,
      lastEventTime: 0,
      eventCounts: new Map(),
      listenerCounts: new Map(),
      lastCleanup: Date.now()
    };
    
    // Performance thresholds for monitoring
    this.performanceThresholds = {
      maxLatency: 0.1, // 0.1ms max per event
      maxEvents: 10000, // Events per second
      memoryLimit: 50 * 1024 * 1024, // 50MB
      mapCleanupInterval: 300000, // 5 minutes
      maxMapSize: 1000 // Prevent unbounded growth
    };
    
    // Event type validation for type safety - removed hardcoded restrictions
    
    // Setup periodic cleanup to prevent memory leaks
    this.setupPeriodicCleanup();
  }
  
  // FIXED: High-performance event emission with monitoring
  emit(eventType, data) {
    const startTime = performance.now();
    
    try {
      // FIXED: Type safety validation
      if (!this.validateEventType(eventType)) {
        console.warn(`Invalid event type: ${eventType}`);
        return false;
      }
      
      // FIXED: Circuit breaker protection
      if (this.circuitBreaker && !this.shouldEmitEvent(eventType)) {
        return false;
      }
      
      // FIXED: Actual event emission (synchronous for speed)
      const result = super.emit(eventType, data);
      
      // FIXED: Performance tracking
      const latency = performance.now() - startTime;
      this.updateMetrics(eventType, latency);
      
      // FIXED: Performance monitoring integration with correct method
      if (this.performanceMonitor && typeof this.performanceMonitor.recordCycle === 'function') {
        this.performanceMonitor.recordCycle(latency, 1, true);
      }
      
      // FIXED: Performance threshold checking
      this.checkPerformanceThresholds(latency);
      
      return result;
      
    } catch (error) {
      console.error('SignalBus emit error:', error);
      return false;
    }
  }
  
  // FIXED: Enhanced listener registration with tracking
  on(eventType, listener, options = {}) {
    // Type validation
    if (!this.validateEventType(eventType)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }
    
    // Call parent method
    const result = super.on(eventType, listener);
    
    // FIXED: Track listener counts for memory monitoring
    this.updateListenerCount(eventType, 1);
    
    return result;
  }
  
  // FIXED: Enhanced listener removal with tracking
  off(eventType, listener) {
    const result = super.off(eventType, listener);
    
    // Update listener count
    this.updateListenerCount(eventType, -1);
    
    return result;
  }
  
  // FIXED: Type safety validation - minimal validation only
  validateEventType(eventType) {
    // Basic string validation only - no artificial restrictions
    return typeof eventType === 'string' && 
           eventType.length > 0 &&
           eventType.length < 100 &&
           /^[a-zA-Z][a-zA-Z0-9_]*$/.test(eventType);
  }
  
  // FIXED: Circuit breaker integration
  shouldEmitEvent(eventType) {
    if (!this.circuitBreaker) return true;
    
    // Check if circuit breaker allows this event type
    if (typeof this.circuitBreaker.canExecute === 'function') {
      return this.circuitBreaker.canExecute(`signalBus_${eventType}`);
    }
    
    return true;
  }
  
  // FIXED: Performance metrics update with division by zero protection
  updateMetrics(eventType, latency) {
    this.metrics.eventsEmitted++;
    this.metrics.totalLatency += latency;
    
    // FIXED: Prevent division by zero
    this.metrics.averageLatency = this.metrics.eventsEmitted > 0 
      ? this.metrics.totalLatency / this.metrics.eventsEmitted 
      : 0;
    
    this.metrics.lastEventTime = Date.now();
    
    // FIXED: Bounded map growth to prevent memory leaks
    if (this.metrics.eventCounts.size < this.performanceThresholds.maxMapSize) {
      const currentCount = this.metrics.eventCounts.get(eventType) || 0;
      this.metrics.eventCounts.set(eventType, currentCount + 1);
    }
  }
  
  // FIXED: Listener count tracking with bounds
  updateListenerCount(eventType, delta) {
    if (this.metrics.listenerCounts.size < this.performanceThresholds.maxMapSize) {
      const currentCount = this.metrics.listenerCounts.get(eventType) || 0;
      const newCount = Math.max(0, currentCount + delta);
      
      if (newCount === 0) {
        this.metrics.listenerCounts.delete(eventType);
      } else {
        this.metrics.listenerCounts.set(eventType, newCount);
      }
    }
  }
  
  // FIXED: Performance threshold monitoring
  checkPerformanceThresholds(latency) {
    // Check latency threshold
    if (latency > this.performanceThresholds.maxLatency) {
      console.warn(`SignalBus latency exceeded threshold: ${latency.toFixed(3)}ms`);
      
      // Emit performance alert (avoid recursion by checking event type)
      if (this.listenerCount('performanceAlert') > 0) {
        super.emit('performanceAlert', {
          type: 'latency',
          value: latency,
          threshold: this.performanceThresholds.maxLatency,
          timestamp: Date.now()
        });
      }
    }
    
    // Check events per second
    const now = Date.now();
    const timeSinceLastEvent = now - this.metrics.lastEventTime;
    if (timeSinceLastEvent > 0) {
      const eventsPerSecond = 1000 / timeSinceLastEvent;
      if (eventsPerSecond > this.performanceThresholds.maxEvents) {
        console.warn(`SignalBus event rate exceeded threshold: ${eventsPerSecond.toFixed(0)}/s`);
      }
    }
  }
  
  // FIXED: Periodic cleanup to prevent memory leaks
  setupPeriodicCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.performanceThresholds.mapCleanupInterval);
  }
  
  // FIXED: Memory cleanup implementation
  performCleanup() {
    const now = Date.now();
    
    // Reset metrics if they're getting too large
    if (this.metrics.eventsEmitted > 1000000) {
      console.log('SignalBus: Resetting metrics to prevent memory growth');
      this.metrics.eventsEmitted = 0;
      this.metrics.totalLatency = 0;
      this.metrics.averageLatency = 0;
    }
    
    // FIXED: Remove dead code - maps are already size-limited in updateMetrics
    // Periodic reset instead of impossible size check
    const timeSinceLastReset = now - this.metrics.lastCleanup;
    if (timeSinceLastReset > this.performanceThresholds.mapCleanupInterval) {
      console.log('SignalBus: Periodic cleanup of tracking maps');
      this.metrics.eventCounts.clear();
      this.metrics.listenerCounts.clear();
    }
    
    this.metrics.lastCleanup = now;
  }
  
  // Event type methods removed - no longer using whitelist
  
  // FIXED: Get current performance metrics
  getMetrics() {
    return {
      ...this.metrics,
      listenerCount: this.listenerCount(),
      // eventTypes removed - no longer using whitelist,
      memoryUsage: this.estimateMemoryUsage()
    };
  }
  
  // FIXED: Estimate memory usage for monitoring
  estimateMemoryUsage() {
    // Rough estimate of memory usage
    const metricsSize = JSON.stringify(this.metrics).length;
    const eventTypesSize = 0; // No longer tracking event types
    const listenersSize = this.listenerCount() * 100; // Rough estimate per listener
    
    return metricsSize + eventTypesSize + listenersSize;
  }
  
  // FIXED: Health check for system monitoring
  isHealthy() {
    const memoryUsage = this.estimateMemoryUsage();
    const now = Date.now();
    
    return (
      this.metrics.averageLatency < this.performanceThresholds.maxLatency &&
      memoryUsage < this.performanceThresholds.memoryLimit &&
      (now - this.metrics.lastCleanup) < (this.performanceThresholds.mapCleanupInterval * 2) &&
      this.listenerCount() > 0 // System should have active listeners
    );
  }
  
  // FIXED: Graceful shutdown
  shutdown() {
    console.log('SignalBus: Shutting down gracefully');
    
    // Clear interval to prevent memory leaks
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Remove all listeners
    this.removeAllListeners();
    
    // Clear metrics
    this.metrics.eventCounts.clear();
    this.metrics.listenerCounts.clear();
    
    // Reset counters
    this.metrics.eventsEmitted = 0;
    this.metrics.totalLatency = 0;
    this.metrics.averageLatency = 0;
  }
}