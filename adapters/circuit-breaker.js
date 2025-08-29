// adapters/circuit-breaker.js
// DAY: 2 (RECOVERY)
// ADAPTER: Seamless fake/real switching with developer productivity focus
// CONTRACT COMPLIANCE: Strict interface adherence with helpful error messages

import { CircuitBreakerFake } from '../fakes/circuit-breaker.fake.js';

/**
 * Production-ready adapter that seamlessly switches between fake and real circuit breaker implementations
 * Maintains strict contract compliance while providing developer convenience features
 */
class CircuitBreakerAdapter {
  constructor() {
    this.implementation = null;
  }

  /**
   * Factory method with deterministic dependency injection and environment-based switching
   * @param {Object} config - Circuit breaker configuration
   * @param {Object} dependencies - Injected dependencies (logger, clock, breaker, etc.)
   * @param {string} [scenario='normal'] - Fake scenario for testing (ignored in real mode)
   * @returns {Promise<CircuitBreakerAdapter>}
   */
  static async create(config, dependencies, scenario = 'normal') {
    const adapter = new CircuitBreakerAdapter();
    
    if (process.env.USE_FAKES === 'true') {
      // Development/testing mode - use deterministic fake
      console.log(`[CircuitBreaker Adapter] Using FAKE implementation (scenario: ${scenario})`);
      adapter.implementation = new CircuitBreakerFake(config, dependencies, scenario);
    } else {
      // Production mode - use real implementation
      console.log(`[CircuitBreaker Adapter] Using REAL implementation`);
      const { CircuitBreaker } = await import('../impl/circuit-breaker.real.js');
      
      // Use the actual CircuitBreaker implementation
      adapter.implementation = new CircuitBreaker(config, dependencies);
    }
    
    return adapter;
  }

  // PROXY ALL METHODS - Core contract methods (strict interface compliance)

  /**
   * Check if a request is permitted at this instant
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async canPass(context) {
    return this.implementation.canPass(context);
  }

  /**
   * Record a success outcome with duration
   * @param {Object} result
   * @returns {Promise<Object>}
   */
  async recordSuccess(result) {
    return this.implementation.recordSuccess(result);
  }

  /**
   * Record a failure outcome with classification
   * @param {Object} result
   * @returns {Promise<Object>}
   */
  async recordFailure(result) {
    return this.implementation.recordFailure(result);
  }

  /**
   * Get current state snapshot (no side effects)
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async getState(context) {
    return this.implementation.getState(context);
  }

  // PROXY ALL METHODS - Convenience methods (developer productivity)

  /**
   * Simplified success recording with auto-generated request ID
   * @param {number} durationMs
   * @returns {Promise<Object>}
   */
  async recordQuickSuccess(durationMs) {
    return this.implementation.recordQuickSuccess(durationMs);
  }

  /**
   * Simplified failure recording with auto-generated request ID
   * @param {number} durationMs
   * @param {string} errorCode
   * @param {string} message
   * @returns {Promise<Object>}
   */
  async recordQuickFailure(durationMs, errorCode, message) {
    return this.implementation.recordQuickFailure(durationMs, errorCode, message);
  }

  /**
   * Check if request can pass with auto-generated request ID
   * @returns {Promise<Object>}
   */
  async quickCanPass() {
    return this.implementation.quickCanPass();
  }

  /**
   * Execute function with circuit breaker protection
   * @param {string} requestId
   * @param {Function} fn
   * @returns {Promise<Object>}
   */
  async execute(requestId, fn) {
    return this.implementation.execute(requestId, fn);
  }

  // PROXY ALL METHODS - Developer helper methods (testing/debugging)

  /**
   * Get captured structured logs (fake mode only)
   * @returns {Array<Object>}
   */
  getCapturedLogs() {
    return this.implementation.getCapturedLogs();
  }

  /**
   * Get total operation count (fake mode only)
   * @returns {number}
   */
  getInvocationCount() {
    return this.implementation.getInvocationCount();
  }

  /**
   * Get detailed circuit breaker statistics
   * @returns {Object}
   */
  getStats() {
    return this.implementation.getStats();
  }

  /**
   * Reset all statistics and state (fake mode only)
   */
  reset() {
    return this.implementation.reset();
  }

  /**
   * Force state transition for testing (fake mode only)
   * @param {string} newState
   * @param {string} reason
   */
  forceState(newState, reason) {
    return this.implementation.forceState(newState, reason);
  }

  /**
   * Switch scenario for testing different behaviors (fake mode only)
   * @param {string} newScenario
   */
  setScenario(newScenario) {
    return this.implementation.setScenario(newScenario);
  }

  // DEVELOPER PRODUCTIVITY FEATURES

  /**
   * Check if currently using fake implementation
   * @returns {boolean}
   */
  isFake() {
    return process.env.USE_FAKES === 'true';
  }

  /**
   * Get implementation type for debugging
   * @returns {string}
   */
  getImplementationType() {
    return this.isFake() ? 'FAKE' : 'REAL';
  }

  /**
   * Validate that adapter is properly initialized
   * @returns {boolean}
   */
  isReady() {
    return this.implementation !== null;
  }

  /**
   * Get current circuit breaker state (convenience)
   * @returns {Promise<string>}
   */
  async getCurrentState() {
    const requestId = 'adapter_state_check';
    const result = await this.getState({ requestId });
    return result.ok ? result.data.state : 'UNKNOWN';
  }

  /**
   * Check if circuit breaker is healthy (convenience)
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    const state = await this.getCurrentState();
    return state === 'CLOSED' || state === 'HALF_OPEN';
  }

  /**
   * Get implementation instance for advanced debugging (use carefully)
   * @returns {Object}
   */
  _getImplementation() {
    console.warn('[CircuitBreaker Adapter] Direct implementation access - use for debugging only');
    return this.implementation;
  }
}

export { CircuitBreakerAdapter };