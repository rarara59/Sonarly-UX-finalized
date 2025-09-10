#!/usr/bin/env node

/**
 * THORP DAY 3 SIMPLE RENAISSANCE MOCKS
 * 
 * Simplified, deterministic mocks focused on money-critical behaviors
 * No academic over-engineering - just what's needed for production validation
 */

import EventEmitter from 'events';

// ===== CIRCUIT BREAKER IMPLEMENTATION =====
export class CircuitBreaker extends EventEmitter {
  constructor(config = {}) {
    super();
    this.failureThreshold = config.failureThreshold || 5;
    this.cooldownMs = config.cooldownMs || 60000;
    this.halfOpenTimeoutMs = config.halfOpenTimeoutMs || 30000;
    
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.operationCount = 0;
    this.halfOpenProbeActive = false; // Prevent concurrent probes
  }

  getState() {
    // Check for state transitions
    if (this.state === 'OPEN' && this.lastFailureTime) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= this.cooldownMs) {
        // Don't auto-transition - wait for next call to trigger HALF-OPEN
        // This matches real circuit breaker behavior
      }
    }
    return this.state;
  }

  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    if (oldState !== newState) {
      this.emit('stateChange', newState, oldState);
    }
  }

  async execute(operationId, operation) {
    this.operationCount++;
    const currentState = this.getState();
    
    // Handle OPEN state - fast fail
    if (currentState === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure < this.cooldownMs) {
        // Still in cooldown - reject immediately
        throw new Error(`Circuit breaker OPEN - operation rejected`);
      } else {
        // Cooldown elapsed - transition to HALF-OPEN for single probe
        this.setState('HALF-OPEN');
      }
    }
    
    // Handle HALF-OPEN state - single probe only
    if (this.getState() === 'HALF-OPEN') {
      if (this.halfOpenProbeActive) {
        // Another probe is active - reject this one
        throw new Error(`Circuit breaker HALF-OPEN - probe in progress`);
      }
      this.halfOpenProbeActive = true;
    }
    
    try {
      const result = await operation();
      
      // Success handling
      this.successCount++;
      
      if (this.getState() === 'HALF-OPEN') {
        // Probe succeeded - transition to CLOSED
        this.setState('CLOSED');
        this.failureCount = 0;
        this.halfOpenProbeActive = false;
      }
      
      return result;
      
    } catch (error) {
      // Failure handling
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.getState() === 'HALF-OPEN') {
        // Probe failed - back to OPEN
        this.setState('OPEN');
        this.halfOpenProbeActive = false;
      } else if (this.getState() === 'CLOSED' && this.failureCount >= this.failureThreshold) {
        // Too many failures - trip to OPEN
        this.setState('OPEN');
      }
      
      throw error;
    }
  }

  getStats() {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      operationCount: this.operationCount,
      lastFailureTime: this.lastFailureTime,
      halfOpenProbeActive: this.halfOpenProbeActive
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.operationCount = 0;
    this.halfOpenProbeActive = false;
  }
}

// ===== SIGNAL BUS IMPLEMENTATION =====
export class SignalBus extends EventEmitter {
  constructor(config = {}, logger = console) {
    super();
    this.maxQueueSize = config.maxQueueSize || 1000;
    this.processingTimeoutMs = config.processingTimeoutMs || 5000;
    this.logger = logger;
    
    this.subscribers = new Map(); // topic -> array of handlers
    this.queues = new Map();      // topic -> array of messages
    this.processing = new Set();  // topics currently being processed
    
    this.stats = {
      published: 0,
      processed: 0,
      failed: 0,
      queueOverflows: 0,
      processingTimeouts: 0
    };
  }

  subscribe(topic, handler) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
      this.queues.set(topic, []);
    }
    
    this.subscribers.get(topic).push({
      handler,
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  publish(topic, message) {
    this.stats.published++;
    
    if (!this.queues.has(topic)) {
      // No subscribers - drop message
      return;
    }
    
    const queue = this.queues.get(topic);
    
    // Check queue size limit - backpressure handling
    if (queue.length >= this.maxQueueSize) {
      this.stats.queueOverflows++;
      // Drop oldest message to make room (simple drop policy)
      queue.shift();
    }
    
    // Add message to queue
    queue.push({
      topic,
      message,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
    
    // Process queue if not already processing
    if (!this.processing.has(topic)) {
      setImmediate(() => this.processQueue(topic));
    }
  }

  async processQueue(topic) {
    if (this.processing.has(topic)) {
      return; // Already processing this topic
    }
    
    this.processing.add(topic);
    
    try {
      const queue = this.queues.get(topic);
      const subscribers = this.subscribers.get(topic);
      
      while (queue && queue.length > 0 && subscribers) {
        const message = queue.shift();
        
        // Process with all subscribers - maintain ordering per topic
        for (const subscriber of subscribers) {
          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Processing timeout')), this.processingTimeoutMs);
            });
            
            const processingPromise = Promise.resolve(subscriber.handler(message.message));
            
            await Promise.race([processingPromise, timeoutPromise]);
            this.stats.processed++;
            
          } catch (error) {
            this.stats.failed++;
            
            if (error.message === 'Processing timeout') {
              this.stats.processingTimeouts++;
            }
            
            // Subscriber isolation - one failure doesn't stop others
            this.logger.error?.(`Signal processing failed for ${topic}`, {
              subscriberId: subscriber.id,
              error: error.message
            });
          }
        }
      }
    } finally {
      this.processing.delete(topic);
    }
  }

  getStats() {
    return {
      ...this.stats,
      activeTopics: this.subscribers.size,
      totalSubscribers: Array.from(this.subscribers.values()).reduce(
        (sum, subs) => sum + subs.length, 0
      ),
      queueSizes: Object.fromEntries(
        Array.from(this.queues.entries()).map(([topic, queue]) => [topic, queue.length])
      ),
      processingTopics: this.processing.size
    };
  }

  clear() {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
    this.processing.clear();
    this.stats = {
      published: 0,
      processed: 0,
      failed: 0,
      queueOverflows: 0,
      processingTimeouts: 0
    };
  }
}

export { CircuitBreaker as default };