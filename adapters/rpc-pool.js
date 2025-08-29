// adapters/rpc-pool.js
// DAY: 2 (RECOVERY)
// ADAPTER: Seamless fake/real switching with developer productivity focus
// CONTRACT COMPLIANCE: Strict interface adherence with helpful error messages

import { RpcPoolFake } from '../fakes/rpc-pool.fake.js';

/**
 * Production-ready adapter that seamlessly switches between fake and real RPC pool implementations
 * Maintains strict contract compliance while providing developer convenience features
 */
class RpcPoolAdapter {
  constructor() {
    this.implementation = null;
  }

  /**
   * Factory method with deterministic dependency injection and environment-based switching
   * @param {Object} config - RPC pool configuration
   * @param {Object} dependencies - Injected dependencies (logger, clock, breaker, etc.)
   * @param {string} [scenario='normal'] - Fake scenario for testing (ignored in real mode)
   * @returns {Promise<RpcPoolAdapter>}
   */
  static async create(config, dependencies, scenario = 'normal') {
    const adapter = new RpcPoolAdapter();
    
    if (process.env.USE_FAKES === 'true') {
      // Development/testing mode - use deterministic fake
      console.log(`[RpcPool Adapter] Using FAKE implementation (scenario: ${scenario})`);
      adapter.implementation = new RpcPoolFake(config, dependencies, scenario);
    } else {
      // Production mode - use real implementation
      console.log(`[RpcPool Adapter] Using REAL implementation`);
      const { RpcPool } = await import('../impl/rpc-pool.real.js');
      
      // Use the actual RpcPool implementation
      adapter.implementation = new RpcPool(config, dependencies);
    }
    
    return adapter;
  }

  // PROXY ALL METHODS - Core contract methods (strict interface compliance)

  /**
   * Submit JSON-RPC call through pool with failover and deadline control
   * @param {string} method
   * @param {unknown[]|Record<string, unknown>|undefined} params
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async call(method, params, options) {
    return this.implementation.call(method, params, options);
  }

  /**
   * Get instantaneous health snapshot
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async getHealth(context) {
    return this.implementation.getHealth(context);
  }

  // PROXY ALL METHODS - Convenience methods (developer productivity)

  /**
   * Simplified call method with auto-generated request ID
   * @param {string} method
   * @param {unknown[]|Record<string, unknown>|undefined} params
   * @returns {Promise<Object>}
   */
  async quickCall(method, params) {
    return this.implementation.quickCall(method, params);
  }

  /**
   * Call with deadline convenience
   * @param {string} method
   * @param {unknown[]|Record<string, unknown>|undefined} params
   * @param {number} deadlineMs
   * @returns {Promise<Object>}
   */
  async callWithDeadline(method, params, deadlineMs) {
    return this.implementation.callWithDeadline(method, params, deadlineMs);
  }

  /**
   * Batch call convenience
   * @param {Array<{method: string, params?: unknown}>} calls
   * @returns {Promise<Array<Object>>}
   */
  async batchCall(calls) {
    return this.implementation.batchCall(calls);
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
   * Get method invocation statistics (fake mode only)
   * @returns {number}
   */
  getInvocationCount() {
    return this.implementation.getInvocationCount();
  }

  /**
   * Get detailed pool statistics
   * @returns {Object}
   */
  getStats() {
    return this.implementation.getStats();
  }

  /**
   * Reset all statistics and logs (fake mode only)
   */
  reset() {
    return this.implementation.reset();
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
   * Get implementation instance for advanced debugging (use carefully)
   * @returns {Object}
   */
  _getImplementation() {
    console.warn('[RpcPool Adapter] Direct implementation access - use for debugging only');
    return this.implementation;
  }
}

export { RpcPoolAdapter };