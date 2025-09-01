/**
 * Token Bucket Rate Limiter
 * Extracted from rpc-connection-pool.js for standalone use
 * Provides rate limiting with burst capacity and accurate token replenishment
 */

import { EventEmitter } from 'events';

export class TokenBucket extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration with environment variable support
    this.rateLimit = config.rateLimit || 
                     parseInt(process.env.RATE_LIMIT) || 
                     parseInt(process.env.RPS_LIMIT) || 
                     100; // requests per second
    
    this.burstCapacity = config.burstCapacity || 
                         parseInt(process.env.BURST_CAPACITY) || 
                         this.rateLimit * 2; // 2x burst by default
    
    this.windowMs = config.windowMs || 
                    parseInt(process.env.RATE_WINDOW_MS) || 
                    1000; // 1 second window
    
    this.burstDuration = config.burstDuration || 
                         parseInt(process.env.BURST_DURATION_MS) || 
                         10000; // 10 seconds burst duration
    
    // NEW: Quantized timing support for higher accuracy
    this.rateWindow = config.rateWindow || 
                      parseInt(process.env.RATE_WINDOW_QUANTUM_MS) || 
                      50; // 50ms quantized windows for better accuracy
    this.ratePeriod = this.windowMs || 1000; // Period in ms (default 1 second)
    // Calculate tokens per window more precisely
    this.tokensPerWindow = (this.rateLimit * this.rateWindow) / this.ratePeriod;
    
    // Initialize token bucket
    this.maxTokens = this.rateLimit;
    this.tokens = Math.min(5, this.rateLimit); // Start with fewer tokens to prevent initial burst
    this.refillRate = this.rateLimit; // tokens per second (not per millisecond)
    this.lastRefill = Date.now();
    
    // Burst mode tracking
    this.burstMode = false;
    this.burstStartTime = null;
    this.burstTokensUsed = 0;
    
    // Metrics tracking
    this.metrics = {
      totalRequests: 0,
      allowedRequests: 0,
      rejectedRequests: 0,
      totalTokensConsumed: 0,
      burstActivations: 0,
      lastCheckLatency: 0,
      avgCheckLatency: 0,
      checkCount: 0
    };
    
    // Memory optimization - clear old metrics periodically
    this.metricsResetInterval = setInterval(() => {
      this.resetMetrics();
    }, 3600000); // Reset every hour
    
    // Configuration validation
    this.validateConfiguration();
  }
  
  /**
   * Validate configuration values
   */
  validateConfiguration() {
    if (this.rateLimit <= 0) {
      throw new Error('Rate limit must be positive');
    }
    
    if (this.burstCapacity < this.rateLimit) {
      console.warn('Burst capacity less than rate limit, setting to rate limit');
      this.burstCapacity = this.rateLimit;
    }
    
    if (this.windowMs <= 0) {
      throw new Error('Window must be positive');
    }
    
    if (this.burstDuration <= 0) {
      throw new Error('Burst duration must be positive');
    }
  }
  
  /**
   * Check if tokens are available (main interface method)
   */
  hasTokens(count = 1) {
    const startTime = process.hrtime.bigint();
    
    // Refill tokens based on time passed
    this.refill();
    
    // Check burst mode timeout
    this.checkBurstTimeout();
    
    const hasTokens = this.tokens >= count;
    
    // Track metrics
    const endTime = process.hrtime.bigint();
    const latencyNs = Number(endTime - startTime);
    const latencyMs = latencyNs / 1000000;
    
    this.metrics.lastCheckLatency = latencyMs;
    this.metrics.checkCount++;
    this.metrics.avgCheckLatency = 
      (this.metrics.avgCheckLatency * (this.metrics.checkCount - 1) + latencyMs) / 
      this.metrics.checkCount;
    
    return hasTokens;
  }
  
  /**
   * Check if tokens can be consumed without actually consuming
   */
  canConsume(tokens = 1) {
    return this.hasTokens(tokens);
  }
  
  /**
   * Consume tokens if available
   */
  consume(tokens = 1) {
    this.metrics.totalRequests++;
    
    if (this.hasTokens(tokens)) {
      this.tokens -= tokens;
      this.metrics.allowedRequests++;
      this.metrics.totalTokensConsumed += tokens;
      
      // Track burst usage
      if (this.burstMode) {
        this.burstTokensUsed += tokens;
      }
      
      // Emit event for monitoring
      this.emit('token-consumed', {
        tokens,
        remaining: Math.floor(this.tokens),
        burstMode: this.burstMode
      });
      
      return true;
    }
    
    // Check if we can enter burst mode
    if (!this.burstMode && this.canEnterBurstMode()) {
      this.enterBurstMode();
      return this.consume(tokens); // Retry with burst capacity
    }
    
    this.metrics.rejectedRequests++;
    
    // Emit event for monitoring
    this.emit('token-rejected', {
      tokens,
      remaining: Math.floor(this.tokens),
      burstMode: this.burstMode
    });
    
    return false;
  }
  
  /**
   * Refill tokens based on time passed using quantized windows for accuracy
   */
  refill() {
    const now = Date.now();
    const windowsSinceRefill = Math.floor((now - this.lastRefill) / this.rateWindow);
    
    if (windowsSinceRefill >= 1) {
      // Use integer math for precise token calculation
      const tokensToAdd = windowsSinceRefill * this.tokensPerWindow;
      
      // Apply appropriate max based on mode
      const currentMax = this.burstMode ? this.burstCapacity : this.maxTokens;
      this.tokens = Math.min(currentMax, this.tokens + tokensToAdd);
      
      // Update lastRefill to exact window boundary for accuracy
      this.lastRefill += (windowsSinceRefill * this.rateWindow);
    }
  }
  
  /**
   * Check if burst mode can be entered
   */
  canEnterBurstMode() {
    // Don't allow burst if already in burst mode
    if (this.burstMode) {
      return false;
    }
    
    // Don't allow burst if recently used
    if (this.burstStartTime && 
        Date.now() - this.burstStartTime < this.burstDuration * 2) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Enter burst mode
   */
  enterBurstMode() {
    this.burstMode = true;
    this.burstStartTime = Date.now();
    this.burstTokensUsed = 0;
    this.maxTokens = this.burstCapacity;
    this.metrics.burstActivations++;
    
    // Immediately add some burst tokens
    this.tokens = Math.min(this.burstCapacity, this.tokens + this.rateLimit);
    
    this.emit('burst-activated', {
      capacity: this.burstCapacity,
      duration: this.burstDuration
    });
  }
  
  /**
   * Exit burst mode
   */
  exitBurstMode() {
    this.burstMode = false;
    this.maxTokens = this.rateLimit;
    
    // Cap tokens at normal rate
    this.tokens = Math.min(this.rateLimit, this.tokens);
    
    this.emit('burst-deactivated', {
      tokensUsed: this.burstTokensUsed,
      duration: Date.now() - this.burstStartTime
    });
  }
  
  /**
   * Check if burst mode should timeout
   */
  checkBurstTimeout() {
    if (this.burstMode && 
        Date.now() - this.burstStartTime >= this.burstDuration) {
      this.exitBurstMode();
    }
  }
  
  /**
   * Get current status
   */
  getStatus() {
    this.refill();
    this.checkBurstTimeout();
    
    return {
      tokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
      utilization: ((this.maxTokens - this.tokens) / this.maxTokens * 100).toFixed(1) + '%',
      burstMode: this.burstMode,
      rateLimit: this.rateLimit,
      burstCapacity: this.burstCapacity
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    const accuracy = this.metrics.totalRequests > 0 
      ? (this.metrics.rejectedRequests / this.metrics.totalRequests * 100).toFixed(2)
      : '0.00';
    
    return {
      ...this.metrics,
      rejectionAccuracy: accuracy + '%',
      avgCheckLatencyMs: this.metrics.avgCheckLatency.toFixed(3),
      memoryUsageMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    };
  }
  
  /**
   * Reset metrics to prevent memory growth
   */
  resetMetrics() {
    // Keep running totals but reset averages
    this.metrics.avgCheckLatency = this.metrics.lastCheckLatency;
    this.metrics.checkCount = 1;
    
    // Emit metrics before reset for monitoring
    this.emit('metrics-reset', this.getMetrics());
  }
  
  /**
   * Reset token bucket to initial state
   */
  reset() {
    this.tokens = Math.min(5, this.rateLimit);
    this.lastRefill = Date.now();
    this.burstMode = false;
    this.burstStartTime = null;
    this.burstTokensUsed = 0;
    
    this.emit('bucket-reset');
  }
  
  /**
   * Health check for monitoring
   */
  async healthCheck() {
    const startTime = process.hrtime.bigint();
    
    try {
      // Test basic operations
      this.refill();
      const status = this.getStatus();
      
      const healthy = 
        status.tokens >= 0 &&
        status.tokens <= status.maxTokens &&
        this.metrics.avgCheckLatency < 1.0; // Less than 1ms average
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;
      
      return {
        healthy,
        latency: latencyMs,
        status,
        metrics: this.getMetrics()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.metricsResetInterval) {
      clearInterval(this.metricsResetInterval);
      this.metricsResetInterval = null;
    }
    this.removeAllListeners();
  }
  
  /**
   * Static factory method for configuration from environment
   */
  static fromEnvironment() {
    return new TokenBucket({
      rateLimit: parseInt(process.env.RATE_LIMIT) || 
                 parseInt(process.env.RPS_LIMIT) || 
                 100,
      burstCapacity: parseInt(process.env.BURST_CAPACITY) || 
                     parseInt(process.env.RATE_LIMIT) * 2 || 
                     200,
      windowMs: parseInt(process.env.RATE_WINDOW_MS) || 1000,
      burstDuration: parseInt(process.env.BURST_DURATION_MS) || 10000
    });
  }
}

// Export for backward compatibility
export default TokenBucket;