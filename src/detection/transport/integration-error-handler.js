/**
 * Integration Error Handler for RPC System
 * Provides error classification, component isolation, fallback strategies,
 * and automatic recovery mechanisms for the 7-component architecture
 */

import { EventEmitter } from 'events';

export class IntegrationErrorHandler extends EventEmitter {
  constructor(rpcManager) {
    super();
    
    this.rpcManager = rpcManager;
    
    // Error classification types
    this.ERROR_TYPES = {
      COMPONENT_ERROR: 'COMPONENT_ERROR',
      NETWORK_ERROR: 'NETWORK_ERROR',
      SYSTEM_ERROR: 'SYSTEM_ERROR',
      CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
      TIMEOUT_ERROR: 'TIMEOUT_ERROR'
    };
    
    // Component names for tracking
    this.COMPONENTS = {
      TOKEN_BUCKET: 'tokenBucket',
      CIRCUIT_BREAKER: 'circuitBreaker',
      ENDPOINT_SELECTOR: 'endpointSelector',
      CONNECTION_POOL: 'connectionPoolCore',
      REQUEST_CACHE: 'requestCache',
      BATCH_MANAGER: 'batchManager',
      HEDGED_MANAGER: 'hedgedManager'
    };
    
    // Component health tracking
    this.componentHealth = {};
    this.failureCount = {};
    this.recoveryThreshold = 3; // Successful checks before re-integration
    this.recoveryChecks = {};
    this.isolatedComponents = new Set();
    
    // Initialize health tracking for all components
    Object.values(this.COMPONENTS).forEach(component => {
      this.componentHealth[component] = {
        healthy: true,
        lastError: null,
        failureCount: 0,
        lastFailureTime: null,
        recoveryAttempts: 0
      };
      this.failureCount[component] = 0;
      this.recoveryChecks[component] = 0;
    });
    
    // Metrics tracking
    this.metrics = {
      totalErrors: 0,
      componentErrors: {},
      networkErrors: 0,
      systemErrors: 0,
      configurationErrors: 0,
      timeoutErrors: 0,
      fallbacksUsed: 0,
      successfulRecoveries: 0,
      isolationEvents: 0,
      reintegrationEvents: 0
    };
    
    // Initialize component error counters
    Object.values(this.COMPONENTS).forEach(component => {
      this.metrics.componentErrors[component] = 0;
    });
    
    // Start recovery monitoring
    this.startRecoveryMonitoring();
  }
  
  /**
   * Classify error type based on error characteristics
   */
  classifyError(error) {
    // Check for component-specific errors
    if (error.component || error.isComponentError) {
      return {
        type: this.ERROR_TYPES.COMPONENT_ERROR,
        component: error.component,
        message: error.message || 'Component failure'
      };
    }
    
    // Check for network errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNRESET' ||
        error.code === 'EPIPE' ||
        error.message?.includes('network') ||
        error.message?.includes('socket')) {
      return {
        type: this.ERROR_TYPES.NETWORK_ERROR,
        message: error.message || 'Network failure'
      };
    }
    
    // Check for timeout errors
    if (error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT' ||
        error.message?.includes('timeout')) {
      return {
        type: this.ERROR_TYPES.TIMEOUT_ERROR,
        message: error.message || 'Request timeout'
      };
    }
    
    // Check for configuration errors
    if (error.message?.includes('configuration') ||
        error.message?.includes('invalid') ||
        error.message?.includes('missing')) {
      return {
        type: this.ERROR_TYPES.CONFIGURATION_ERROR,
        message: error.message || 'Configuration error'
      };
    }
    
    // Default to system error
    return {
      type: this.ERROR_TYPES.SYSTEM_ERROR,
      message: error.message || 'System error'
    };
  }
  
  /**
   * Handle error with appropriate isolation and fallback strategy
   */
  async handleError(error, context = {}) {
    const classification = this.classifyError(error);
    this.metrics.totalErrors++;
    
    // Track error by type
    switch (classification.type) {
      case this.ERROR_TYPES.COMPONENT_ERROR:
        this.metrics.componentErrors[classification.component]++;
        await this.handleComponentError(classification.component, error, context);
        break;
      case this.ERROR_TYPES.NETWORK_ERROR:
        this.metrics.networkErrors++;
        await this.handleNetworkError(error, context);
        break;
      case this.ERROR_TYPES.TIMEOUT_ERROR:
        this.metrics.timeoutErrors++;
        await this.handleTimeoutError(error, context);
        break;
      case this.ERROR_TYPES.CONFIGURATION_ERROR:
        this.metrics.configurationErrors++;
        await this.handleConfigurationError(error, context);
        break;
      default:
        this.metrics.systemErrors++;
        await this.handleSystemError(error, context);
    }
    
    // Emit error event for monitoring (safely)
    try {
      this.emit('error', {
        type: classification.type,
        component: classification.component,
        message: classification.message,
        context,
        timestamp: Date.now()
      });
    } catch (emitError) {
      // Ignore emission errors to prevent cascading failures
    }
    
    return classification;
  }
  
  /**
   * Handle component-specific errors with isolation
   */
  async handleComponentError(componentName, error, context) {
    const health = this.componentHealth[componentName];
    
    if (!health) {
      console.error(`Unknown component: ${componentName}`);
      return;
    }
    
    // Update health tracking
    health.healthy = false;
    health.lastError = error;
    health.failureCount++;
    health.lastFailureTime = Date.now();
    
    // Isolate component if failure threshold exceeded
    if (health.failureCount >= 3 && !this.isolatedComponents.has(componentName)) {
      await this.isolateComponent(componentName);
    }
    
    // Apply fallback strategy
    await this.applyFallbackStrategy(componentName, context);
  }
  
  /**
   * Isolate a failed component
   */
  async isolateComponent(componentName) {
    console.log(`🔒 Isolating component: ${componentName}`);
    this.isolatedComponents.add(componentName);
    this.metrics.isolationEvents++;
    
    // Notify RpcManager to disable component
    if (this.rpcManager && this.rpcManager.disableComponent) {
      await this.rpcManager.disableComponent(componentName);
    }
    
    // Reset recovery checks
    this.recoveryChecks[componentName] = 0;
    
    this.emit('component-isolated', {
      component: componentName,
      timestamp: Date.now()
    });
  }
  
  /**
   * Apply fallback strategy for failed component
   */
  async applyFallbackStrategy(componentName, context) {
    this.metrics.fallbacksUsed++;
    
    const strategies = {
      [this.COMPONENTS.TOKEN_BUCKET]: async () => {
        console.log('⚠️  TokenBucket failed - Disabling rate limiting');
        context.skipRateLimiting = true;
      },
      
      [this.COMPONENTS.CIRCUIT_BREAKER]: async () => {
        console.log('⚠️  CircuitBreaker failed - Using basic retry with backoff');
        context.useBasicRetry = true;
        context.retryAttempts = 3;
        context.retryDelay = 1000;
      },
      
      [this.COMPONENTS.ENDPOINT_SELECTOR]: async () => {
        console.log('⚠️  EndpointSelector failed - Using round-robin without health checks');
        context.useRoundRobin = true;
        context.skipHealthCheck = true;
      },
      
      [this.COMPONENTS.CONNECTION_POOL]: async () => {
        console.log('⚠️  ConnectionPool failed - Using basic HTTP requests');
        context.useBasicHttp = true;
        context.skipConnectionPool = true;
      },
      
      [this.COMPONENTS.REQUEST_CACHE]: async () => {
        console.log('⚠️  RequestCache failed - Disabling caching');
        context.skipCaching = true;
      },
      
      [this.COMPONENTS.BATCH_MANAGER]: async () => {
        console.log('⚠️  BatchManager failed - Sending individual requests');
        context.skipBatching = true;
        context.sendIndividual = true;
      },
      
      [this.COMPONENTS.HEDGED_MANAGER]: async () => {
        console.log('⚠️  HedgedManager failed - Using single requests');
        context.skipHedging = true;
        context.useSingleRequest = true;
      }
    };
    
    const strategy = strategies[componentName];
    if (strategy) {
      await strategy();
    }
    
    this.emit('fallback-applied', {
      component: componentName,
      context,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle network errors
   */
  async handleNetworkError(error, context) {
    console.error('🌐 Network error detected:', error.message);
    
    // Apply network error fallbacks
    context.useRetry = true;
    context.retryAttempts = 5;
    context.retryDelay = 2000;
    context.exponentialBackoff = true;
    
    // Use alternate endpoints if available
    if (this.rpcManager?.endpoints?.length > 1) {
      context.useAlternateEndpoint = true;
    }
  }
  
  /**
   * Handle timeout errors
   */
  async handleTimeoutError(error, context) {
    console.error('⏱️  Timeout error detected:', error.message);
    
    // Increase timeout for next attempt
    context.increaseTimeout = true;
    context.timeoutMultiplier = 2;
    
    // Use faster endpoint if available
    context.preferFastEndpoint = true;
  }
  
  /**
   * Handle configuration errors
   */
  async handleConfigurationError(error, context) {
    console.error('⚙️  Configuration error detected:', error.message);
    
    // Use default configuration
    context.useDefaultConfig = true;
    
    // Log for administrator attention
    this.emit('configuration-error', {
      error: error.message,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle system errors
   */
  async handleSystemError(error, context) {
    console.error('💥 System error detected:', error.message);
    
    // Apply conservative fallbacks
    context.useConservativeMode = true;
    context.reducedConcurrency = true;
    context.maxConcurrency = 5;
  }
  
  /**
   * Start monitoring for component recovery
   */
  startRecoveryMonitoring() {
    // Check for recovery every 10 seconds
    this.recoveryInterval = setInterval(async () => {
      for (const componentName of this.isolatedComponents) {
        await this.checkComponentRecovery(componentName);
      }
    }, 10000);
  }
  
  /**
   * Check if an isolated component has recovered
   */
  async checkComponentRecovery(componentName) {
    try {
      // Try to health check the component
      const isHealthy = await this.testComponentHealth(componentName);
      
      if (isHealthy) {
        this.recoveryChecks[componentName]++;
        
        // Re-integrate if threshold met
        if (this.recoveryChecks[componentName] >= this.recoveryThreshold) {
          await this.reintegrateComponent(componentName);
        }
      } else {
        // Reset recovery checks on failure
        this.recoveryChecks[componentName] = 0;
      }
    } catch (error) {
      // Ignore errors during recovery check
      this.recoveryChecks[componentName] = 0;
    }
  }
  
  /**
   * Test component health
   */
  async testComponentHealth(componentName) {
    // Get component from RpcManager
    if (!this.rpcManager || !this.rpcManager.components) {
      return false;
    }
    
    const component = this.rpcManager.components[componentName];
    if (!component) {
      return false;
    }
    
    // Check if component has health check method
    if (typeof component.healthCheck === 'function') {
      try {
        const health = await component.healthCheck();
        return health.healthy === true;
      } catch {
        return false;
      }
    }
    
    // Basic check - component exists and is initialized
    return component.initialized === true;
  }
  
  /**
   * Re-integrate a recovered component
   */
  async reintegrateComponent(componentName) {
    console.log(`✅ Re-integrating recovered component: ${componentName}`);
    
    // Remove from isolated set
    this.isolatedComponents.delete(componentName);
    
    // Reset health tracking
    const health = this.componentHealth[componentName];
    health.healthy = true;
    health.failureCount = 0;
    health.lastError = null;
    health.recoveryAttempts++;
    
    // Reset recovery checks
    this.recoveryChecks[componentName] = 0;
    
    // Notify RpcManager to re-enable component
    if (this.rpcManager && this.rpcManager.enableComponent) {
      await this.rpcManager.enableComponent(componentName);
    }
    
    this.metrics.successfulRecoveries++;
    this.metrics.reintegrationEvents++;
    
    this.emit('component-reintegrated', {
      component: componentName,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get current health status of all components
   */
  getHealthStatus() {
    const status = {
      healthy: true,
      isolatedComponents: Array.from(this.isolatedComponents),
      componentHealth: {}
    };
    
    Object.entries(this.componentHealth).forEach(([name, health]) => {
      status.componentHealth[name] = {
        healthy: health.healthy && !this.isolatedComponents.has(name),
        failureCount: health.failureCount,
        lastFailureTime: health.lastFailureTime,
        recoveryAttempts: health.recoveryAttempts
      };
      
      if (!health.healthy || this.isolatedComponents.has(name)) {
        status.healthy = false;
      }
    });
    
    return status;
  }
  
  /**
   * Get system capability percentage
   */
  getSystemCapability() {
    const totalComponents = Object.keys(this.COMPONENTS).length;
    const healthyComponents = totalComponents - this.isolatedComponents.size;
    return (healthyComponents / totalComponents) * 100;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      systemCapability: this.getSystemCapability(),
      isolatedComponents: this.isolatedComponents.size,
      healthyComponents: Object.keys(this.COMPONENTS).length - this.isolatedComponents.size
    };
  }
  
  /**
   * Create error with component attribution
   */
  createComponentError(componentName, message, originalError = null) {
    const error = new Error(`[${componentName}] ${message}`);
    error.component = componentName;
    error.isComponentError = true;
    error.originalError = originalError;
    return error;
  }
  
  /**
   * Reset component health tracking
   */
  resetComponentHealth(componentName) {
    if (this.componentHealth[componentName]) {
      this.componentHealth[componentName] = {
        healthy: true,
        lastError: null,
        failureCount: 0,
        lastFailureTime: null,
        recoveryAttempts: 0
      };
      this.failureCount[componentName] = 0;
      this.recoveryChecks[componentName] = 0;
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = null;
    }
    this.removeAllListeners();
  }
}