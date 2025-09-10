/**
 * Circuit Breaker State Machine
 * Extracted from rpc-connection-pool.js for standalone use
 * Provides failure protection with CLOSED/OPEN/HALF_OPEN state transitions
 */

import { EventEmitter } from 'events';

// Circuit breaker states
const States = {
  CLOSED: 'CLOSED',       // Normal operation, requests pass through
  OPEN: 'OPEN',           // Circuit open, requests fail fast
  HALF_OPEN: 'HALF_OPEN'  // Testing if service recovered
};

export class CircuitBreaker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration with environment variable support
    this.failureThreshold = config.failureThreshold || 
                            parseInt(process.env.CIRCUIT_FAILURE_THRESHOLD) || 
                            parseInt(process.env.RPC_BREAKER_THRESHOLD) || 
                            5;
    
    this.successThreshold = config.successThreshold || 
                            parseInt(process.env.CIRCUIT_SUCCESS_THRESHOLD) || 
                            3; // Successful calls to close from HALF_OPEN
    
    this.cooldownPeriod = config.cooldownPeriod || 
                          parseInt(process.env.CIRCUIT_COOLDOWN_MS) || 
                          parseInt(process.env.RPC_BREAKER_COOLDOWN) || 
                          30000; // 30 seconds default
    
    this.halfOpenTests = config.halfOpenTests || 
                         parseInt(process.env.CIRCUIT_HALF_OPEN_TESTS) || 
                         2; // Max tests in HALF_OPEN state
    
    this.volumeThreshold = config.volumeThreshold || 
                           parseInt(process.env.CIRCUIT_VOLUME_THRESHOLD) || 
                           10; // Minimum requests before opening
    
    this.errorThresholdPercentage = config.errorThresholdPercentage || 
                                    parseFloat(process.env.CIRCUIT_ERROR_PERCENTAGE) || 
                                    50; // Error percentage to open circuit
    
    // Per-service circuit breaker states
    this.services = new Map();
    
    // Global configuration
    this.enabled = config.enabled !== false && 
                   process.env.CIRCUIT_BREAKER_ENABLED !== 'false';
    
    // Metrics tracking
    this.metrics = {
      totalExecutions: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      stateTransitions: 0,
      servicesTracked: 0,
      lastCheckLatency: 0,
      avgCheckLatency: 0,
      checkCount: 0
    }
;
    
    // Memory optimization - cleanup old services periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldServices();
    }, 300000); // Every 5 minutes
    
    // Configuration validation
    this.validateConfiguration();
  }
  
  /**
   * Initialize the CircuitBreaker (compatibility method)
   */
  async initialize() {
    // Component is already initialized in constructor
    return true;
  }
  
  /**
   * Validate configuration values
   */
  validateConfiguration() {
    if (this.failureThreshold <= 0) {
      throw new Error('Failure threshold must be positive');
    }
    
    if (this.successThreshold <= 0) {
      throw new Error('Success threshold must be positive');
    }
    
    if (this.cooldownPeriod <= 0) {
      throw new Error('Cooldown period must be positive');
    }
    
    if (this.errorThresholdPercentage < 0 || this.errorThresholdPercentage > 100) {
      throw new Error('Error threshold percentage must be between 0 and 100');
    }
  }
  
  /**
   * Get or create service state
   */
  getServiceState(serviceName) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, {
        state: States.CLOSED,
        failures: 0,
        consecutiveSuccesses: 0,
        lastFailureTime: 0,
        openedAt: 0,
        halfOpenTestCount: 0,
        requestCount: 0,
        errorCount: 0,
        lastActivity: Date.now(),
        stats: {
          totalCalls: 0,
          totalFailures: 0,
          totalSuccesses: 0,
          stateChanges: 0
        }
      });
      this.metrics.servicesTracked++;
    }
    
    const service = this.services.get(serviceName);
    service.lastActivity = Date.now();
    return service;
  }
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute(serviceName, fn) {
    const startTime = process.hrtime.bigint();
    
    if (!this.enabled) {
      // Circuit breaker disabled, pass through
      return await fn();
    }
    
    const service = this.getServiceState(serviceName);
    
    // Track metrics
    this.metrics.totalExecutions++;
    service.stats.totalCalls++;
    service.requestCount++;
    
    // Check circuit state
    const canExecute = this.canExecute(service);
    
    if (!canExecute) {
      // Circuit is OPEN, fail fast
      const error = new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
      error.code = 'CIRCUIT_BREAKER_OPEN';
      error.service = serviceName;
      
      this.metrics.totalFailures++;
      
      // Track latency
      this.updateLatencyMetrics(startTime);
      
      throw error;
    }
    
    // Track if we're in HALF_OPEN state
    const wasHalfOpen = service.state === States.HALF_OPEN;
    if (wasHalfOpen) {
      service.halfOpenTestCount++;
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // Success - update state
      this.onSuccess(serviceName, service);
      
      // Track latency
      this.updateLatencyMetrics(startTime);
      
      return result;
      
    } catch (error) {
      // Failure - update state
      this.onFailure(serviceName, service, error);
      
      // Track latency
      this.updateLatencyMetrics(startTime);
      
      throw error;
    }
  }
  
  /**
   * Check if request can be executed based on circuit state
   */
  canExecute(service) {
    switch (service.state) {
      case States.CLOSED:
        return true;
        
      case States.OPEN:
        // Check if cooldown period has passed
        const timeSinceOpen = Date.now() - service.openedAt;
        if (timeSinceOpen >= this.cooldownPeriod) {
          // Transition to HALF_OPEN
          this.transitionTo(service, States.HALF_OPEN);
          service.halfOpenTestCount = 0;
          return true;
        }
        return false;
        
      case States.HALF_OPEN:
        // Allow limited tests in HALF_OPEN state
        return service.halfOpenTestCount < this.halfOpenTests;
        
      default:
        return false;
    }
  }
  
  /**
   * Handle successful execution
   */
  onSuccess(serviceName, service) {
    this.metrics.totalSuccesses++;
    service.stats.totalSuccesses++;
    service.consecutiveSuccesses++;
    
    switch (service.state) {
      case States.HALF_OPEN:
        // Check if we have enough successes to close
        if (service.consecutiveSuccesses >= this.successThreshold) {
          this.transitionTo(service, States.CLOSED);
          service.failures = 0;
          service.consecutiveSuccesses = 0;
          service.halfOpenTestCount = 0;
          service.errorCount = 0;
          service.requestCount = 0;
          
          this.emit('circuit-closed', {
            service: serviceName,
            timestamp: Date.now()
          });
        }
        break;
        
      case States.CLOSED:
        // Reset failure count on success in CLOSED state
        if (service.failures > 0) {
          service.failures = Math.max(0, service.failures - 0.5); // Decay failures
        }
        break;
    }
  }
  
  /**
   * Handle failed execution
   */
  onFailure(serviceName, service, error) {
    this.metrics.totalFailures++;
    service.stats.totalFailures++;
    service.failures++;
    service.consecutiveSuccesses = 0;
    service.lastFailureTime = Date.now();
    service.errorCount++;
    
    switch (service.state) {
      case States.HALF_OPEN:
        // Single failure in HALF_OPEN reopens circuit
        this.transitionTo(service, States.OPEN);
        service.openedAt = Date.now();
        
        this.emit('circuit-opened', {
          service: serviceName,
          error: error.message,
          timestamp: Date.now()
        });
        break;
        
      case States.CLOSED:
        // Check if we should open the circuit
        if (this.shouldOpen(service)) {
          this.transitionTo(service, States.OPEN);
          service.openedAt = Date.now();
          
          this.emit('circuit-opened', {
            service: serviceName,
            error: error.message,
            failures: service.failures,
            timestamp: Date.now()
          });
        }
        break;
    }
  }
  
  /**
   * Check if circuit should open based on failure conditions
   */
  shouldOpen(service) {
    // Check absolute failure threshold
    if (service.failures >= this.failureThreshold) {
      return true;
    }
    
    // Check percentage-based threshold if we have enough volume
    if (service.requestCount >= this.volumeThreshold) {
      const errorPercentage = (service.errorCount / service.requestCount) * 100;
      if (errorPercentage >= this.errorThresholdPercentage) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Transition to a new state
   */
  transitionTo(service, newState) {
    const oldState = service.state;
    service.state = newState;
    service.stats.stateChanges++;
    this.metrics.stateTransitions++;
    
    this.emit('state-change', {
      oldState,
      newState,
      timestamp: Date.now()
    });
  }
  
  /**
   * Update latency metrics
   */
  updateLatencyMetrics(startTime) {
    const endTime = process.hrtime.bigint();
    const latencyNs = Number(endTime - startTime);
    const latencyMs = latencyNs / 1000000;
    
    this.metrics.lastCheckLatency = latencyMs;
    this.metrics.checkCount++;
    this.metrics.avgCheckLatency = 
      (this.metrics.avgCheckLatency * (this.metrics.checkCount - 1) + latencyMs) / 
      this.metrics.checkCount;
  }
  
  /**
   * Get current state for a service
   */
  getState(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return States.CLOSED;
    }
    
    // Check if OPEN circuit should transition to HALF_OPEN
    if (service.state === States.OPEN) {
      const timeSinceOpen = Date.now() - service.openedAt;
      if (timeSinceOpen >= this.cooldownPeriod) {
        service.state = States.HALF_OPEN;
        service.halfOpenTestCount = 0;
      }
    }
    
    return service.state;
  }
  
  /**
   * Reset circuit breaker for a service
   */
  reset(serviceName) {
    if (this.services.has(serviceName)) {
      const service = this.services.get(serviceName);
      service.state = States.CLOSED;
      service.failures = 0;
      service.consecutiveSuccesses = 0;
      service.lastFailureTime = 0;
      service.openedAt = 0;
      service.halfOpenTestCount = 0;
      service.errorCount = 0;
      service.requestCount = 0;
      
      this.emit('circuit-reset', {
        service: serviceName,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Force open circuit for a service
   */
  forceOpen(serviceName) {
    const service = this.getServiceState(serviceName);
    this.transitionTo(service, States.OPEN);
    service.openedAt = Date.now();
    
    this.emit('circuit-forced-open', {
      service: serviceName,
      timestamp: Date.now()
    });
  }
  
  /**
   * Force close circuit for a service
   */
  forceClose(serviceName) {
    const service = this.getServiceState(serviceName);
    this.transitionTo(service, States.CLOSED);
    service.failures = 0;
    service.consecutiveSuccesses = 0;
    
    this.emit('circuit-forced-closed', {
      service: serviceName,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get statistics for a service
   */
  getServiceStats(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return null;
    }
    
    return {
      state: service.state,
      failures: service.failures,
      consecutiveSuccesses: service.consecutiveSuccesses,
      requestCount: service.requestCount,
      errorCount: service.errorCount,
      errorPercentage: service.requestCount > 0 
        ? ((service.errorCount / service.requestCount) * 100).toFixed(2) + '%'
        : '0%',
      stats: service.stats,
      lastActivity: service.lastActivity,
      timeSinceLastFailure: service.lastFailureTime > 0 
        ? Date.now() - service.lastFailureTime 
        : null
    };
  }
  
  /**
   * Get all service states
   */
  getAllServiceStates() {
    const states = {};
    for (const [name, service] of this.services) {
      states[name] = {
        state: this.getState(name),
        failures: service.failures,
        stats: service.stats
      };
    }
    return states;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgCheckLatencyMs: this.metrics.avgCheckLatency.toFixed(3),
      servicesTracked: this.services.size,
      statesBreakdown: this.getStatesBreakdown()
    };
  }
  
  /**
   * Get breakdown of services by state
   */
  getStatesBreakdown() {
    const breakdown = {
      [States.CLOSED]: 0,
      [States.OPEN]: 0,
      [States.HALF_OPEN]: 0
    };
    
    for (const service of this.services.values()) {
      breakdown[service.state]++;
    }
    
    return breakdown;
  }
  
  /**
   * Clean up old inactive services
   */
  cleanupOldServices() {
    const now = Date.now();
    const inactivityThreshold = 3600000; // 1 hour
    
    for (const [name, service] of this.services) {
      if (now - service.lastActivity > inactivityThreshold && 
          service.state === States.CLOSED) {
        this.services.delete(name);
        this.metrics.servicesTracked--;
      }
    }
  }
  
  /**
   * Health check for monitoring
   */
  async healthCheck() {
    const startTime = process.hrtime.bigint();
    
    try {
      // Test basic operations
      const testService = '__health_check__';
      const state = this.getState(testService);
      
      const healthy = 
        this.metrics.avgCheckLatency < 1.0 && // Less than 1ms average
        this.services.size < 10000; // Not tracking too many services
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;
      
      // Clean up test service
      this.services.delete(testService);
      
      return {
        healthy,
        latency: latencyMs,
        metrics: this.getMetrics(),
        statesBreakdown: this.getStatesBreakdown()
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
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.services.clear();
    this.removeAllListeners();
  }
  
  /**
   * Static factory method for configuration from environment
   */
  static fromEnvironment() {
    return new CircuitBreaker({
      failureThreshold: parseInt(process.env.CIRCUIT_FAILURE_THRESHOLD) || 5,
      successThreshold: parseInt(process.env.CIRCUIT_SUCCESS_THRESHOLD) || 3,
      cooldownPeriod: parseInt(process.env.CIRCUIT_COOLDOWN_MS) || 30000,
      halfOpenTests: parseInt(process.env.CIRCUIT_HALF_OPEN_TESTS) || 2,
      volumeThreshold: parseInt(process.env.CIRCUIT_VOLUME_THRESHOLD) || 10,
      errorThresholdPercentage: parseFloat(process.env.CIRCUIT_ERROR_PERCENTAGE) || 50,
      enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false'
    });
  }
}

// Export states for external use
export { States };

// Export for backward compatibility
export default CircuitBreaker;