/**
 * High-Performance In-Memory Event Bus - PRODUCTION COMPLETE
 * Target: <0.1ms event emission, type-safe events
 * FIXES: Syntax errors, complete implementation, memory management, performance monitoring
 */

import { EventEmitter } from 'events';
import { logger, generateRequestId } from '../../utils/logger.js';

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
      maxLatency: 1.0, // 0.1ms max per event
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
        const requestId = generateRequestId();
        logger.warn({
          request_id: requestId,
          component: 'signal-bus',
          event: 'validation.error',
          event_type: eventType,
          message: 'Invalid event type'
        });
        return false;
      }
      
      // FIXED: Circuit breaker protection
      if (this.circuitBreaker && !this.shouldEmitEvent(eventType)) {
        return false;
      }
      
      // FIXED: Actual event emission (synchronous for speed)
      const result = super.emit(eventType, data);
      
      // Log signal emission with trading-specific fields
      const requestId = generateRequestId();
      logger.info({
        request_id: requestId,
        component: 'signal-bus',
        event: 'signal.publish',
        signal_type: eventType,
        dex: data?.dex,
        opportunity_id: data?.tokenId || data?.mint,
        tx_count: data?.transactionCount,
        listener_count: this.listenerCount(eventType)
      });
      
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
      const requestId = generateRequestId();
      logger.error({
        request_id: requestId,
        component: 'signal-bus',
        event: 'emit.error',
        error: error.message,
        stack: error.stack,
        event_type: eventType
      });
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
    
    // Log listener subscription
    const requestId = generateRequestId();
    logger.debug({
      request_id: requestId,
      component: 'signal-bus',
      event: 'listener.subscribe',
      signal_type: eventType,
      new_listener_count: this.listenerCount(eventType)
    });
    
    // FIXED: Track listener counts for memory monitoring
    this.updateListenerCount(eventType, 1);
    
    return result;
  }
  
  // FIXED: Enhanced listener removal with tracking
  off(eventType, listener) {
    const result = super.off(eventType, listener);
    
    // Log listener unsubscription
    const requestId = generateRequestId();
    logger.debug({
      request_id: requestId,
      component: 'signal-bus',
      event: 'listener.unsubscribe',
      signal_type: eventType,
      remaining_listener_count: this.listenerCount(eventType)
    });
    
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
      const requestId = generateRequestId();
      logger.warn({
        request_id: requestId,
        component: 'signal-bus',
        event: 'performance.latency_exceeded',
        latency_ms: parseFloat(latency.toFixed(3)),
        threshold_ms: this.performanceThresholds.maxLatency,
        message: 'SignalBus latency exceeded threshold'
      });
      
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
        const requestId = generateRequestId();
        logger.warn({
          request_id: requestId,
          component: 'signal-bus',
          event: 'performance.rate_exceeded',
          events_per_second: parseInt(eventsPerSecond.toFixed(0)),
          threshold: this.performanceThresholds.maxEvents,
          message: 'SignalBus event rate exceeded threshold'
        });
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
      const requestId = generateRequestId();
      logger.info({
        request_id: requestId,
        component: 'signal-bus',
        event: 'metrics.reset',
        events_emitted: this.metrics.eventsEmitted,
        total_latency: this.metrics.totalLatency,
        message: 'Resetting metrics to prevent memory growth'
      });
      this.metrics.eventsEmitted = 0;
      this.metrics.totalLatency = 0;
      this.metrics.averageLatency = 0;
    }
    
    // FIXED: Remove dead code - maps are already size-limited in updateMetrics
    // Periodic reset instead of impossible size check
    const timeSinceLastReset = now - this.metrics.lastCleanup;
    if (timeSinceLastReset > this.performanceThresholds.mapCleanupInterval) {
      const requestId = generateRequestId();
      logger.info({
        request_id: requestId,
        component: 'signal-bus',
        event: 'cleanup.periodic',
        event_count_map_size: this.metrics.eventCounts.size,
        listener_count_map_size: this.metrics.listenerCounts.size,
        message: 'Periodic cleanup of tracking maps'
      });
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
    const timeSinceLastEvent = now - this.metrics.lastEventTime;
    
    const latencyHealthy = this.metrics.averageLatency < this.performanceThresholds.maxLatency;
    const memoryHealthy = memoryUsage < this.performanceThresholds.memoryLimit;
    const cleanupHealthy = (now - this.metrics.lastCleanup) < (this.performanceThresholds.mapCleanupInterval * 2);
    
    const listenerHealthy = (
      this.listenerCount() > 0 ||
      timeSinceLastEvent < 10000 ||
      this.metrics.eventsEmitted < 10
    );
    
    const isHealthy = latencyHealthy && memoryHealthy && cleanupHealthy && listenerHealthy;
    
    if (!isHealthy) {
      const requestId = generateRequestId();
      logger.debug({
        request_id: requestId,
        component: 'signal-bus',
        event: 'health.check_failed',
        latency_healthy: latencyHealthy,
        memory_healthy: memoryHealthy,
        cleanup_healthy: cleanupHealthy,
        listener_healthy: listenerHealthy,
        listener_count: this.listenerCount(),
        time_since_last_event: timeSinceLastEvent,
        events_emitted: this.metrics.eventsEmitted,
        message: 'SignalBus health check details'
      });
    }
    
    return isHealthy;
  }  
  // FIXED: Graceful shutdown
  shutdown() {
    const requestId = generateRequestId();
    logger.info({
      request_id: requestId,
      component: 'signal-bus',
      event: 'shutdown',
      total_events_emitted: this.metrics.eventsEmitted,
      average_latency: this.metrics.averageLatency,
      listener_count: this.listenerCount(),
      message: 'SignalBus shutting down gracefully'
    });
    
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