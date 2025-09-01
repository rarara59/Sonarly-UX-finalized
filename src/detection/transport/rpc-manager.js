/**
 * RpcManager - Orchestrator for RPC Request Processing
 * 
 * Coordinates 7 components in optimal flow for meme coin trading:
 * 1. TokenBucket - Rate limiting
 * 2. CircuitBreaker - Failure protection
 * 3. EndpointSelector - Endpoint selection
 * 4. RequestCache - Response caching
 * 5. BatchManager - Request batching
 * 6. HedgedManager - Parallel requests
 * 7. ConnectionPool - Actual RPC execution
 */

import { EventEmitter } from 'events';

class RpcManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration with sensible defaults
    this.config = {
      enableRateLimiting: config.enableRateLimiting !== false,
      enableCircuitBreaker: config.enableCircuitBreaker !== false,
      enableCaching: config.enableCaching !== false,
      enableBatching: config.enableBatching !== false,
      enableHedging: config.enableHedging !== false,
      maxOrchestratorMemory: config.maxOrchestratorMemory || 10 * 1024 * 1024, // 10MB
      initTimeout: config.initTimeout || 5000, // 5 seconds
      gracefulDegradation: config.gracefulDegradation !== false,
      ...config
    };
    
    // Component references (will be injected)
    this.components = {
      tokenBucket: null,
      circuitBreaker: null,
      endpointSelector: null,
      requestCache: null,
      batchManager: null,
      hedgedManager: null,
      connectionPool: null
    };
    
    // Component health tracking
    this.componentHealth = {
      tokenBucket: { healthy: false, lastError: null },
      circuitBreaker: { healthy: false, lastError: null },
      endpointSelector: { healthy: false, lastError: null },
      requestCache: { healthy: false, lastError: null },
      batchManager: { healthy: false, lastError: null },
      hedgedManager: { healthy: false, lastError: null },
      connectionPool: { healthy: false, lastError: null }
    };
    
    // Orchestration metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      orchestrationOverhead: [],
      componentFailures: new Map(),
      startupTime: 0,
      memoryUsage: 0
    };
    
    // Request tracking for graceful degradation
    this.activeRequests = new Map();
    this.requestIdCounter = 0;
  }

  /**
   * Initialize components in dependency order
   * @param {Object} components - Component instances to inject
   */
  async initialize(components) {
    const startTime = Date.now();
    
    try {
      // Validate all required components
      this.validateComponents(components);
      
      // Phase 1: Core components (no dependencies)
      await this.initializePhase1(components);
      
      // Phase 2: Dependent components
      await this.initializePhase2(components);
      
      // Phase 3: Complex components with multiple dependencies
      await this.initializePhase3(components);
      
      // Verify initialization completed within timeout
      const initDuration = Date.now() - startTime;
      if (initDuration > this.config.initTimeout) {
        throw new Error(`Initialization took ${initDuration}ms, exceeding ${this.config.initTimeout}ms timeout`);
      }
      
      this.metrics.startupTime = initDuration;
      this.emit('initialized', { duration: initDuration, components: Object.keys(this.components) });
      
      return true;
    } catch (error) {
      this.emit('initialization-failed', error);
      throw error;
    }
  }

  /**
   * Phase 1: Initialize core components without dependencies
   */
  async initializePhase1(components) {
    // TokenBucket - Rate limiting (no dependencies)
    if (components.tokenBucket) {
      try {
        this.components.tokenBucket = components.tokenBucket;
        if (typeof this.components.tokenBucket.initialize === 'function') {
          await this.components.tokenBucket.initialize();
        }
        this.componentHealth.tokenBucket.healthy = true;
      } catch (error) {
        this.handleComponentFailure('tokenBucket', error);
      }
    }
    
    // ConnectionPool - Core RPC execution (no dependencies)
    if (components.connectionPool) {
      try {
        this.components.connectionPool = components.connectionPool;
        if (typeof this.components.connectionPool.initialize === 'function') {
          await this.components.connectionPool.initialize();
        }
        this.componentHealth.connectionPool.healthy = true;
      } catch (error) {
        this.handleComponentFailure('connectionPool', error);
      }
    }
  }

  /**
   * Phase 2: Initialize components with single dependencies
   */
  async initializePhase2(components) {
    // EndpointSelector - Needs ConnectionPool
    if (components.endpointSelector && this.componentHealth.connectionPool.healthy) {
      try {
        this.components.endpointSelector = components.endpointSelector;
        if (typeof this.components.endpointSelector.initialize === 'function') {
          await this.components.endpointSelector.initialize(this.components.connectionPool);
        }
        this.componentHealth.endpointSelector.healthy = true;
      } catch (error) {
        this.handleComponentFailure('endpointSelector', error);
      }
    }
    
    // RequestCache - Independent but benefits from being early
    if (components.requestCache) {
      try {
        this.components.requestCache = components.requestCache;
        if (typeof this.components.requestCache.initialize === 'function') {
          await this.components.requestCache.initialize();
        }
        this.componentHealth.requestCache.healthy = true;
      } catch (error) {
        this.handleComponentFailure('requestCache', error);
      }
    }
  }

  /**
   * Phase 3: Initialize complex components
   */
  async initializePhase3(components) {
    // CircuitBreaker - Can wrap other components
    if (components.circuitBreaker) {
      try {
        this.components.circuitBreaker = components.circuitBreaker;
        if (typeof this.components.circuitBreaker.initialize === 'function') {
          await this.components.circuitBreaker.initialize();
        }
        this.componentHealth.circuitBreaker.healthy = true;
      } catch (error) {
        this.handleComponentFailure('circuitBreaker', error);
      }
    }
    
    // BatchManager - Needs ConnectionPool
    if (components.batchManager && this.componentHealth.connectionPool.healthy) {
      try {
        this.components.batchManager = components.batchManager;
        if (typeof this.components.batchManager.initialize === 'function') {
          await this.components.batchManager.initialize(this.components.connectionPool);
        }
        this.componentHealth.batchManager.healthy = true;
      } catch (error) {
        this.handleComponentFailure('batchManager', error);
      }
    }
    
    // HedgedManager - Needs ConnectionPool and EndpointSelector
    if (components.hedgedManager && 
        this.componentHealth.connectionPool.healthy && 
        this.componentHealth.endpointSelector.healthy) {
      try {
        this.components.hedgedManager = components.hedgedManager;
        if (typeof this.components.hedgedManager.initialize === 'function') {
          await this.components.hedgedManager.initialize(
            this.components.connectionPool,
            this.components.endpointSelector
          );
        }
        this.componentHealth.hedgedManager.healthy = true;
      } catch (error) {
        this.handleComponentFailure('hedgedManager', error);
      }
    }
  }

  /**
   * Main orchestration method - coordinates all components
   */
  async call(method, params, options = {}) {
    const requestId = ++this.requestIdCounter;
    const startTime = Date.now();
    
    // Track active request
    this.activeRequests.set(requestId, {
      method,
      params,
      options,
      startTime,
      componentsUsed: []
    });
    
    try {
      this.metrics.totalRequests++;
      
      // Step 1: Rate limiting check (fail fast if over limit)
      if (this.config.enableRateLimiting && this.componentHealth.tokenBucket.healthy) {
        try {
          const hasTokens = await this.components.tokenBucket.hasTokens(1);
          if (!hasTokens) {
            throw new RateLimitError('Rate limit exceeded');
          }
          await this.components.tokenBucket.consume(1);
          this.activeRequests.get(requestId).componentsUsed.push('tokenBucket');
        } catch (error) {
          if (!this.config.gracefulDegradation) throw error;
          this.handleComponentFailure('tokenBucket', error);
        }
      }
      
      // Step 2: Circuit breaker protection (wrap entire call chain)
      const executeRequest = async () => {
        // Step 3: Endpoint selection (choose best available endpoint)
        let endpoint = null;
        if (this.componentHealth.endpointSelector.healthy) {
          try {
            endpoint = await this.components.endpointSelector.selectEndpoint(method, options);
            this.activeRequests.get(requestId).componentsUsed.push('endpointSelector');
          } catch (error) {
            if (!this.config.gracefulDegradation) throw error;
            this.handleComponentFailure('endpointSelector', error);
            // Fallback to connection pool's default endpoint
            endpoint = null;
          }
        }
        
        // Step 4: Request caching (check for duplicate/cached requests)
        if (this.config.enableCaching && this.componentHealth.requestCache.healthy) {
          try {
            const cacheKey = this.generateCacheKey(method, params);
            const cachedResult = await this.components.requestCache.get(cacheKey);
            if (cachedResult) {
              this.activeRequests.get(requestId).componentsUsed.push('requestCache');
              return cachedResult;
            }
          } catch (error) {
            if (!this.config.gracefulDegradation) throw error;
            this.handleComponentFailure('requestCache', error);
          }
        }
        
        // Step 5: Request batching (combine with other requests if possible)
        const executeBatchedRequest = async () => {
          // Step 6: Hedged requests (parallel requests for critical calls)
          if (this.config.enableHedging && 
              this.componentHealth.hedgedManager.healthy && 
              this.shouldHedge(method, options)) {
            try {
              const primaryRequest = () => this.executePoolRequest(endpoint, method, params);
              const backupEndpoint = this.componentHealth.endpointSelector.healthy ?
                await this.components.endpointSelector.selectBackupEndpoint() : null;
              
              const backupRequests = backupEndpoint ? 
                [() => this.executePoolRequest(backupEndpoint, method, params)] : [];
              
              const result = await this.components.hedgedManager.hedgedRequest(
                primaryRequest,
                backupRequests,
                options.hedgeDelay || 100
              );
              
              this.activeRequests.get(requestId).componentsUsed.push('hedgedManager');
              return result;
            } catch (error) {
              if (!this.config.gracefulDegradation) throw error;
              this.handleComponentFailure('hedgedManager', error);
              // Fallback to direct execution
              return this.executePoolRequest(endpoint, method, params);
            }
          } else {
            // Direct execution without hedging
            return this.executePoolRequest(endpoint, method, params);
          }
        };
        
        // Execute with or without batching
        if (this.config.enableBatching && 
            this.componentHealth.batchManager.healthy && 
            this.shouldBatch(method)) {
          try {
            const result = await this.components.batchManager.addRequest(
              method,
              params,
              executeBatchedRequest
            );
            this.activeRequests.get(requestId).componentsUsed.push('batchManager');
            return result;
          } catch (error) {
            if (!this.config.gracefulDegradation) throw error;
            this.handleComponentFailure('batchManager', error);
            // Fallback to direct execution
            return executeBatchedRequest();
          }
        } else {
          return executeBatchedRequest();
        }
      };
      
      // Execute with or without circuit breaker
      let result;
      if (this.config.enableCircuitBreaker && this.componentHealth.circuitBreaker.healthy) {
        try {
          result = await this.components.circuitBreaker.execute(
            `rpc_${method}`,
            executeRequest
          );
          this.activeRequests.get(requestId).componentsUsed.push('circuitBreaker');
        } catch (error) {
          if (!this.config.gracefulDegradation) throw error;
          this.handleComponentFailure('circuitBreaker', error);
          // Fallback to direct execution
          result = await executeRequest();
        }
      } else {
        result = await executeRequest();
      }
      
      // Cache successful result
      if (this.config.enableCaching && this.componentHealth.requestCache.healthy && result) {
        try {
          const cacheKey = this.generateCacheKey(method, params);
          await this.components.requestCache.set(cacheKey, result, options.cacheTTL);
        } catch (error) {
          // Caching failure is non-critical
          this.emit('cache-error', error);
        }
      }
      
      // Track orchestration overhead
      const orchestrationTime = Date.now() - startTime;
      this.metrics.orchestrationOverhead.push(orchestrationTime);
      if (this.metrics.orchestrationOverhead.length > 1000) {
        this.metrics.orchestrationOverhead.shift();
      }
      
      this.metrics.successfulRequests++;
      this.emit('request-complete', {
        requestId,
        method,
        duration: orchestrationTime,
        componentsUsed: this.activeRequests.get(requestId).componentsUsed
      });
      
      return result;
      
    } catch (error) {
      this.metrics.failedRequests++;
      this.emit('request-failed', {
        requestId,
        method,
        error,
        componentsUsed: this.activeRequests.get(requestId).componentsUsed
      });
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Execute request through connection pool
   */
  async executePoolRequest(endpoint, method, params) {
    if (!this.componentHealth.connectionPool.healthy) {
      throw new Error('ConnectionPool is not healthy');
    }
    
    try {
      if (endpoint) {
        return await this.components.connectionPool.executeWithEndpoint(endpoint, method, params);
      } else {
        return await this.components.connectionPool.execute(method, params);
      }
    } catch (error) {
      this.emit('pool-error', { endpoint, method, error });
      throw error;
    }
  }

  /**
   * Determine if request should be hedged
   */
  shouldHedge(method, options) {
    // Critical methods for trading
    const criticalMethods = [
      'getAccountInfo',
      'getBalance',
      'getTransaction',
      'sendTransaction'
    ];
    
    return options.hedge === true || 
           (options.hedge !== false && criticalMethods.includes(method));
  }

  /**
   * Determine if request should be batched
   */
  shouldBatch(method) {
    // Methods that benefit from batching
    const batchableMethods = [
      'getMultipleAccounts',
      'getAccountInfo',
      'getBalance'
    ];
    
    return batchableMethods.includes(method);
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(method, params) {
    return `${method}:${JSON.stringify(params)}`;
  }

  /**
   * Handle component failure with isolation
   */
  handleComponentFailure(componentName, error) {
    this.componentHealth[componentName].healthy = false;
    this.componentHealth[componentName].lastError = error;
    
    // Track failure
    if (!this.metrics.componentFailures.has(componentName)) {
      this.metrics.componentFailures.set(componentName, 0);
    }
    this.metrics.componentFailures.set(
      componentName,
      this.metrics.componentFailures.get(componentName) + 1
    );
    
    this.emit('component-failure', {
      component: componentName,
      error,
      canDegrade: this.config.gracefulDegradation
    });
    
    // Attempt recovery after delay
    setTimeout(() => {
      this.attemptComponentRecovery(componentName);
    }, 30000); // 30 seconds
  }

  /**
   * Attempt to recover failed component
   */
  async attemptComponentRecovery(componentName) {
    try {
      const component = this.components[componentName];
      if (component && typeof component.healthCheck === 'function') {
        const isHealthy = await component.healthCheck();
        if (isHealthy) {
          this.componentHealth[componentName].healthy = true;
          this.componentHealth[componentName].lastError = null;
          this.emit('component-recovered', componentName);
        }
      }
    } catch (error) {
      // Recovery failed, will retry later
      setTimeout(() => {
        this.attemptComponentRecovery(componentName);
      }, 60000); // 1 minute
    }
  }

  /**
   * Validate all required components are provided
   */
  validateComponents(components) {
    const required = ['connectionPool']; // Minimum required component
    
    for (const componentName of required) {
      if (!components[componentName]) {
        throw new Error(`Required component '${componentName}' not provided`);
      }
    }
  }

  /**
   * Get current system health status
   */
  getHealth() {
    const healthyComponents = Object.values(this.componentHealth)
      .filter(health => health.healthy).length;
    const totalComponents = Object.keys(this.componentHealth).length;
    const healthPercentage = (healthyComponents / totalComponents) * 100;
    
    return {
      healthy: healthPercentage >= 80, // 80% capability threshold
      healthPercentage,
      components: { ...this.componentHealth },
      metrics: {
        totalRequests: this.metrics.totalRequests,
        successRate: this.metrics.totalRequests > 0 ?
          (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) : 0,
        avgOrchestrationOverhead: this.metrics.orchestrationOverhead.length > 0 ?
          (this.metrics.orchestrationOverhead.reduce((a, b) => a + b, 0) / 
           this.metrics.orchestrationOverhead.length).toFixed(2) : 0,
        startupTime: this.metrics.startupTime,
        activeRequests: this.activeRequests.size
      }
    };
  }

  /**
   * Gracefully shutdown all components
   */
  async shutdown() {
    // Wait for active requests to complete (with timeout)
    const shutdownTimeout = 5000;
    const startTime = Date.now();
    
    while (this.activeRequests.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Shutdown components in reverse order
    const shutdownOrder = [
      'hedgedManager',
      'batchManager',
      'requestCache',
      'circuitBreaker',
      'endpointSelector',
      'connectionPool',
      'tokenBucket'
    ];
    
    for (const componentName of shutdownOrder) {
      const component = this.components[componentName];
      if (component && typeof component.shutdown === 'function') {
        try {
          await component.shutdown();
        } catch (error) {
          this.emit('shutdown-error', { component: componentName, error });
        }
      }
    }
    
    this.emit('shutdown-complete');
  }
}

// Custom error classes
class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export { RpcManager, RateLimitError };
export default RpcManager;