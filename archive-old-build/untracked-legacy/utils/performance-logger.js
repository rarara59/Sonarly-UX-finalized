/**
 * Performance-optimized logging utilities for high-frequency trading
 */
import logger from './trading-logger.js';

/**
 * High-performance function timer with automatic logging
 */
class PerformanceTimer {
  constructor(operation, category = 'general') {
    this.operation = operation;
    this.category = category;
    this.startTime = performance.now();
    this.startMemory = process.memoryUsage();
  }
  
  end(meta = {}) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    const duration = endTime - this.startTime;
    const memoryDelta = endMemory.heapUsed - this.startMemory.heapUsed;
    
    // Log performance metrics
    logger.metric(`${this.category}_duration_ms`, duration, {
      operation: this.operation,
      ...meta
    });
    
    logger.metric(`${this.category}_memory_bytes`, memoryDelta, {
      operation: this.operation,
      ...meta
    });
    
    // Log slow operations (>100ms)
    if (duration > 100) {
      logger.warn(`Slow operation detected: ${this.operation}`, {
        duration_ms: duration,
        memory_delta_bytes: memoryDelta,
        category: this.category,
        ...meta
      });
    }
    
    return { duration, memoryDelta };
  }
}

/**
 * Create a performance timer
 */
function createTimer(operation, category = 'general') {
  return new PerformanceTimer(operation, category);
}

/**
 * Sampling decorator for high-frequency functions
 */
function withSampling(originalFunction, samplingRate = 0.01, category = 'general') {
  return function(...args) {
    if (Math.random() <= samplingRate) {
      const timer = createTimer(originalFunction.name, category);
      const result = originalFunction.apply(this, args);
      timer.end();
      return result;
    }
    return originalFunction.apply(this, args);
  };
}

/**
 * Batch logging for high-frequency events
 */
class BatchLogger {
  constructor(category, flushInterval = 5000) {
    this.category = category;
    this.flushInterval = flushInterval;
    this.events = [];
    this.counters = new Map();
    
    setInterval(() => this.flush(), flushInterval);
  }
  
  log(event, data = {}) {
    this.events.push({ event, data, timestamp: Date.now() });
    
    // Update counters
    const counter = this.counters.get(event) || 0;
    this.counters.set(event, counter + 1);
    
    // Emergency flush if too many events
    if (this.events.length > 1000) {
      this.flush();
    }
  }
  
  flush() {
    if (this.events.length === 0) return;
    
    // Log summary statistics
    const summary = Array.from(this.counters.entries()).map(([event, count]) => ({
      event,
      count,
      category: this.category
    }));
    
    logger.info(`Batch summary for ${this.category}`, {
      total_events: this.events.length,
      unique_events: this.counters.size,
      summary: summary
    });
    
    // Log metrics
    this.counters.forEach((count, event) => {
      logger.metric(`${this.category}_${event}_count`, count, {
        category: this.category,
        interval_ms: this.flushInterval
      });
    });
    
    // Clear buffers
    this.events = [];
    this.counters.clear();
  }
}

export {
  logger,
  createTimer,
  withSampling,
  BatchLogger,
  PerformanceTimer
};