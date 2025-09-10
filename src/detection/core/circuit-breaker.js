/**
 * Circuit Breaker - Fault isolation for RPC endpoints
 * 
 * Implements three-state circuit breaker pattern:
 * CLOSED -> OPEN -> HALF-OPEN -> CLOSED
 * 
 * Prevents cascading failures by monitoring operation success/failure rates
 * and temporarily blocking requests when failure thresholds are exceeded.
 */

/**
 * Error thrown when circuit breaker rejects a request
 */
class CircuitBreakerError extends Error {
  constructor(endpointId, state) {
    super(`Circuit breaker ${state} for endpoint: ${endpointId}`);
    this.name = 'CircuitBreakerError';
    this.endpointId = endpointId;
    this.state = state;
  }
}

/**
 * Statistics tracking for circuit breaker operations
 */
class CircuitBreakerStats {
  constructor() {
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.rejectedRequests = 0;
    this.lastStateChange = new Date();
  }
}

/**
 * Circuit Breaker implementation with three-state pattern
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit tripped, requests rejected immediately
 * - HALF-OPEN: Testing recovery, limited requests allowed
 */
class CircuitBreaker {
  /**
   * Create a new Circuit Breaker
   * @param {string} endpointId - Unique identifier for the protected endpoint
   * @param {Object} config - Configuration options
   * @param {number} config.failureThreshold - Number of failures before opening circuit (default: 5)
   * @param {number} config.successThreshold - Number of successes to close circuit (default: 1) 
   * @param {number} config.cooldownMs - Time to wait before attempting recovery (default: 60000)
   * @param {number} config.timeoutMs - Request timeout in milliseconds (default: 2000)
   * @param {number} config.jitterMs - Random variance in cooldown timing (default: 5000)
   * @param {Function} config.isFailure - Custom function to classify errors as failures
   */
  constructor(endpointId, config = {}) {
    this.endpointId = endpointId;
    this.config = this._validateConfig(config);
    this.state = 'CLOSED';
    this.stats = new CircuitBreakerStats();
    this.openedAt = null;
    this.halfOpenAt = null;
    this.isFailureFn = config.isFailure || this._defaultIsFailure.bind(this);
  }

  /**
   * Execute operation with circuit breaker protection
   * @param {Function} operation - Async function to execute
   * @returns {Promise<any>} - Result of operation
   * @throws {CircuitBreakerError} - When circuit is OPEN
   */
  async execute(operation) {
    this._updateStateBasedOnTiming();
    
    if (this.state === 'OPEN') {
      this.stats.rejectedRequests++;
      throw new CircuitBreakerError(this.endpointId, 'OPEN');
    }
    
    try {
      const result = await operation();
      this._recordSuccess();
      return result;
    } catch (error) {
      if (this.isFailureFn(error)) {
        this._recordFailure();
      } else {
        // Count as request but not failure for client errors
        this.stats.totalRequests++;
      }
      throw error;
    }
  }

  /**
   * Get current circuit state with timing updates
   * @returns {string} - Current state: 'CLOSED' | 'OPEN' | 'HALF-OPEN'
   */
  getState() {
    this._updateStateBasedOnTiming();
    return this.state;
  }

  /**
   * Get circuit statistics snapshot
   * @returns {Object} - Copy of current statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Force circuit to specific state (for testing only)
   * @param {string} targetState - Target state to force
   */
  forceState(targetState) {
    this.state = targetState;
    this.stats.lastStateChange = new Date();
  }

  // Private helper methods

  /**
   * Validate and normalize configuration parameters
   * @param {Object} config - Raw configuration object
   * @returns {Object} - Validated configuration
   * @private
   */
  _validateConfig(config) {
    const defaults = {
      failureThreshold: 5,
      successThreshold: 1,
      cooldownMs: 60000,
      timeoutMs: 2000,
      jitterMs: 5000
    };

    const validated = { ...defaults, ...config };

    this._validateThresholds(validated);
    this._validateTimings(validated);
    this._validateJitterConfiguration(validated);

    return validated;
  }

  /**
   * Validate threshold configuration parameters
   * @param {Object} config - Configuration to validate
   * @private
   */
  _validateThresholds(config) {
    if (!Number.isInteger(config.failureThreshold) || config.failureThreshold <= 0) {
      throw new Error(`failureThreshold must be positive integer, got: ${config.failureThreshold}`);
    }
    
    if (!Number.isInteger(config.successThreshold) || config.successThreshold <= 0) {
      throw new Error(`successThreshold must be positive integer, got: ${config.successThreshold}`);
    }
  }

  /**
   * Validate timing configuration parameters
   * @param {Object} config - Configuration to validate
   * @private
   */
  _validateTimings(config) {
    if (typeof config.cooldownMs !== 'number' || config.cooldownMs <= 0) {
      throw new Error(`cooldownMs must be positive number, got: ${config.cooldownMs}`);
    }
    
    if (typeof config.timeoutMs !== 'number' || config.timeoutMs <= 0) {
      throw new Error(`timeoutMs must be positive number, got: ${config.timeoutMs}`);
    }
  }

  /**
   * Validate jitter configuration
   * @param {Object} config - Configuration to validate
   * @private
   */
  _validateJitterConfiguration(config) {
    if (typeof config.jitterMs !== 'number' || config.jitterMs < 0) {
      throw new Error(`jitterMs must be non-negative number, got: ${config.jitterMs}`);
    }

    if (config.jitterMs >= config.cooldownMs) {
      throw new Error(`jitterMs (${config.jitterMs}) must be less than cooldownMs (${config.cooldownMs})`);
    }
  }

  /**
   * Classify errors as circuit-breaking failures or pass-through errors
   * @param {Error} error - Error to classify
   * @returns {boolean} - true if error should trip circuit, false otherwise
   * @private
   */
  _defaultIsFailure(error) {
    const errorCode = error?.code;
    const errorStatus = error?.status;
    const errorName = error?.name;
    
    // Infrastructure failures that should trip circuit
    if (errorCode === 'ETIMEDOUT') return true;
    if (errorCode === 'ECONNREFUSED') return true;
    if (errorCode === 'ENOTFOUND') return true;
    if (errorStatus >= 500 && errorStatus < 600) return true;
    if (errorStatus === 429) return true;
    
    // Application errors that should NOT trip circuit
    if (errorStatus >= 400 && errorStatus < 500) return false;
    if (errorName === 'ValidationError') return false;
    
    // Unknown errors are treated as failures (fail-safe)
    return true;
  }

  /**
   * Check if failure count has reached the configured threshold
   * @returns {boolean} - true if circuit should open
   * @private
   */
  _shouldTransitionToOpen() {
    return this.stats.failureCount >= this.config.failureThreshold;
  }

  /**
   * Update circuit state based on elapsed time
   * Handles OPEN -> HALF-OPEN transition after cooldown period
   * @private
   */
  _updateStateBasedOnTiming() {
    if (this.state === 'OPEN' && this.halfOpenAt && Date.now() >= this.halfOpenAt) {
      this.state = 'HALF-OPEN';
      this.stats.lastStateChange = new Date();
    }
  }

  /**
   * Calculate cooldown period with random jitter
   * Prevents thundering herd when multiple circuits recover simultaneously
   * @returns {number} - Cooldown period in milliseconds
   * @private
   */
  _calculateCooldownWithJitter() {
    const jitter = Math.random() * this.config.jitterMs;
    const totalCooldown = this.config.cooldownMs + jitter;
    return Math.max(totalCooldown, 1);
  }

  /**
   * Transition circuit to OPEN state
   * Sets up cooldown period with jitter for recovery attempt
   * @private
   */
  _transitionToOpen() {
    this.state = 'OPEN';
    this.openedAt = Date.now();
    
    const cooldownPeriod = this._calculateCooldownWithJitter();
    this.halfOpenAt = this.openedAt + cooldownPeriod;
    
    this.stats.lastStateChange = new Date();
  }

  /**
   * Transition circuit to CLOSED state (fully recovered)
   * Clears all failure tracking and timing state
   * @private
   */
  _transitionToClosed() {
    this.state = 'CLOSED';
    this.openedAt = null;
    this.halfOpenAt = null;
    this.stats.failureCount = 0;
    this.stats.lastStateChange = new Date();
  }

  /**
   * Record successful operation
   * Updates stats and handles HALF-OPEN -> CLOSED transition
   * @private
   */
  _recordSuccess() {
    this.stats.successCount++;
    this.stats.totalRequests++;
    this.stats.lastStateChange = new Date();
    this.stats.failureCount = 0; // Circuit healing
    
    if (this.state === 'HALF-OPEN') {
      this._transitionToClosed();
    }
  }

  /**
   * Record failed operation
   * Updates stats and handles state transitions based on failure threshold
   * @private
   */
  _recordFailure() {
    this.stats.failureCount++;
    this.stats.totalRequests++;
    this.stats.lastStateChange = new Date();
    
    if (this._shouldTransitionToOpen()) {
      this._transitionToOpen();
    }
  }
}

export {
  CircuitBreaker,
  CircuitBreakerError,
  CircuitBreakerStats
};