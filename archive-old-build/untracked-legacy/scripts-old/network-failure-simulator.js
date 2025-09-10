#!/usr/bin/env node

/**
 * Network Failure Simulator
 * Simulates various network failure conditions for testing resilience
 */

export class NetworkFailureSimulator {
  constructor() {
    this.blockedEndpoints = new Set();
    this.delayedEndpoints = new Map();
    this.errorRateEndpoints = new Map();
    this.simulationActive = false;
    this.failureLog = [];
    this.originalFetch = null;
  }
  
  /**
   * Start the network failure simulation
   */
  start() {
    if (this.simulationActive) {
      console.log('⚠️  Simulation already active');
      return;
    }
    
    console.log('🔌 Starting Network Failure Simulator');
    this.simulationActive = true;
    this.interceptNetworkCalls();
  }
  
  /**
   * Stop the network failure simulation
   */
  stop() {
    if (!this.simulationActive) {
      return;
    }
    
    console.log('🔌 Stopping Network Failure Simulator');
    this.simulationActive = false;
    this.restoreNetworkCalls();
    this.clearAllFailures();
  }
  
  /**
   * Intercept network calls to inject failures
   */
  interceptNetworkCalls() {
    // Store original fetch if not already stored
    if (!this.originalFetch) {
      this.originalFetch = global.fetch;
    }
    
    // Override global fetch
    global.fetch = async (url, options) => {
      const endpoint = this.extractEndpoint(url);
      
      // Check if endpoint is blocked
      if (this.blockedEndpoints.has(endpoint)) {
        this.logFailure('blocked', endpoint);
        throw new Error(`Network error: ${endpoint} is unreachable`);
      }
      
      // Check if endpoint has delay
      if (this.delayedEndpoints.has(endpoint)) {
        const delay = this.delayedEndpoints.get(endpoint);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Check if endpoint has error rate
      if (this.errorRateEndpoints.has(endpoint)) {
        const errorRate = this.errorRateEndpoints.get(endpoint);
        if (Math.random() < errorRate) {
          this.logFailure('error_rate', endpoint);
          throw new Error(`Random network error for ${endpoint}`);
        }
      }
      
      // Call original fetch
      return this.originalFetch(url, options);
    };
  }
  
  /**
   * Restore original network calls
   */
  restoreNetworkCalls() {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
    }
  }
  
  /**
   * Extract endpoint from URL
   */
  extractEndpoint(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
  
  /**
   * Block specific endpoint completely
   */
  blockEndpoint(endpoint) {
    this.blockedEndpoints.add(endpoint);
    console.log(`❌ Blocked endpoint: ${endpoint}`);
  }
  
  /**
   * Unblock specific endpoint
   */
  unblockEndpoint(endpoint) {
    this.blockedEndpoints.delete(endpoint);
    console.log(`✅ Unblocked endpoint: ${endpoint}`);
  }
  
  /**
   * Add delay to specific endpoint
   */
  delayEndpoint(endpoint, delayMs) {
    this.delayedEndpoints.set(endpoint, delayMs);
    console.log(`⏱️  Added ${delayMs}ms delay to: ${endpoint}`);
  }
  
  /**
   * Remove delay from endpoint
   */
  removeDelay(endpoint) {
    this.delayedEndpoints.delete(endpoint);
    console.log(`⏱️  Removed delay from: ${endpoint}`);
  }
  
  /**
   * Set error rate for endpoint (0-1)
   */
  setErrorRate(endpoint, rate) {
    if (rate < 0 || rate > 1) {
      throw new Error('Error rate must be between 0 and 1');
    }
    this.errorRateEndpoints.set(endpoint, rate);
    console.log(`⚠️  Set ${(rate * 100).toFixed(0)}% error rate for: ${endpoint}`);
  }
  
  /**
   * Remove error rate from endpoint
   */
  removeErrorRate(endpoint) {
    this.errorRateEndpoints.delete(endpoint);
    console.log(`⚠️  Removed error rate from: ${endpoint}`);
  }
  
  /**
   * Clear all failure conditions
   */
  clearAllFailures() {
    this.blockedEndpoints.clear();
    this.delayedEndpoints.clear();
    this.errorRateEndpoints.clear();
    console.log('🧹 Cleared all failure conditions');
  }
  
  /**
   * Log failure event
   */
  logFailure(type, endpoint) {
    const event = {
      timestamp: Date.now(),
      type,
      endpoint
    };
    this.failureLog.push(event);
  }
  
  /**
   * Get failure statistics
   */
  getStatistics() {
    const stats = {
      totalFailures: this.failureLog.length,
      failuresByEndpoint: {},
      failuresByType: {}
    };
    
    for (const event of this.failureLog) {
      // By endpoint
      if (!stats.failuresByEndpoint[event.endpoint]) {
        stats.failuresByEndpoint[event.endpoint] = 0;
      }
      stats.failuresByEndpoint[event.endpoint]++;
      
      // By type
      if (!stats.failuresByType[event.type]) {
        stats.failuresByType[event.type] = 0;
      }
      stats.failuresByType[event.type]++;
    }
    
    return stats;
  }
  
  /**
   * Simulate complete network outage
   */
  simulateCompleteOutage() {
    console.log('💥 Simulating complete network outage');
    const endpoints = [
      'api.mainnet-beta.solana.com',
      'solana-api.projectserum.com',
      'rpc.helius.xyz',
      'rpc.ankr.com'
    ];
    
    endpoints.forEach(endpoint => this.blockEndpoint(endpoint));
  }
  
  /**
   * Simulate partial network degradation
   */
  simulatePartialDegradation() {
    console.log('🌊 Simulating partial network degradation');
    const endpoints = [
      { endpoint: 'api.mainnet-beta.solana.com', delay: 2000, errorRate: 0.2 },
      { endpoint: 'solana-api.projectserum.com', delay: 3000, errorRate: 0.3 },
      { endpoint: 'rpc.helius.xyz', delay: 1000, errorRate: 0.1 }
    ];
    
    endpoints.forEach(({ endpoint, delay, errorRate }) => {
      this.delayEndpoint(endpoint, delay);
      this.setErrorRate(endpoint, errorRate);
    });
  }
  
  /**
   * Simulate endpoint-specific failure
   */
  simulateEndpointFailure(endpoint) {
    console.log(`💔 Simulating failure for: ${endpoint}`);
    this.blockEndpoint(endpoint);
  }
  
  /**
   * Simulate endpoint recovery
   */
  simulateEndpointRecovery(endpoint) {
    console.log(`💚 Simulating recovery for: ${endpoint}`);
    this.unblockEndpoint(endpoint);
    this.removeDelay(endpoint);
    this.removeErrorRate(endpoint);
  }
  
  /**
   * Get current simulation status
   */
  getStatus() {
    return {
      active: this.simulationActive,
      blockedEndpoints: Array.from(this.blockedEndpoints),
      delayedEndpoints: Array.from(this.delayedEndpoints.entries()).map(([endpoint, delay]) => ({
        endpoint,
        delay
      })),
      errorRateEndpoints: Array.from(this.errorRateEndpoints.entries()).map(([endpoint, rate]) => ({
        endpoint,
        errorRate: rate
      })),
      statistics: this.getStatistics()
    };
  }
}

// Export for use in tests
export default NetworkFailureSimulator;