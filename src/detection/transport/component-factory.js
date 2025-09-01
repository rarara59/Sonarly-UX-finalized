/**
 * ComponentFactory - Dependency Injection and Lifecycle Management
 * 
 * Creates and manages all RPC system components in correct dependency order:
 * Level 1: TokenBucket, CircuitBreaker, RequestCache (no dependencies)
 * Level 2: EndpointSelector, ConnectionPoolCore (configuration dependencies)
 * Level 3: BatchManager, HedgedManager (component dependencies)
 * Level 4: RpcManager (requires all components)
 */

import { EventEmitter } from 'events';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class ComponentFactory extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize metrics first
    this.metrics = {
      creationTime: {},
      healthCheckTime: {},
      totalCreationTime: 0,
      configValidationTime: 0
    };
    
    // Configuration with environment variable fallbacks
    this.config = this.loadConfiguration(config);
    
    // Component registry
    this.components = new Map();
    this.componentOrder = [];
    this.componentHealth = new Map();
    
    // Lifecycle state
    this.state = 'UNINITIALIZED'; // UNINITIALIZED -> INITIALIZING -> READY -> STOPPING -> STOPPED
  }

  /**
   * Load and validate configuration from environment and provided config
   */
  loadConfiguration(userConfig) {
    const startTime = Date.now();
    
    const config = {
      // TokenBucket configuration
      tokenBucket: {
        enabled: userConfig.tokenBucket?.enabled ?? process.env.RATE_LIMITING_ENABLED !== 'false',
        rateLimit: userConfig.tokenBucket?.rateLimit ?? (parseInt(process.env.RATE_LIMIT) || 100),
        ratePeriod: userConfig.tokenBucket?.ratePeriod ?? (parseInt(process.env.RATE_PERIOD) || 1000),
        burstCapacity: userConfig.tokenBucket?.burstCapacity ?? (parseInt(process.env.BURST_CAPACITY) || 150)
      },
      
      // CircuitBreaker configuration
      circuitBreaker: {
        enabled: userConfig.circuitBreaker?.enabled ?? process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
        failureThreshold: userConfig.circuitBreaker?.failureThreshold ?? (parseInt(process.env.FAILURE_THRESHOLD) || 5),
        resetTimeout: userConfig.circuitBreaker?.resetTimeout ?? (parseInt(process.env.RESET_TIMEOUT) || 30000),
        halfOpenRequests: userConfig.circuitBreaker?.halfOpenRequests ?? (parseInt(process.env.HALF_OPEN_REQUESTS) || 3)
      },
      
      // RequestCache configuration
      requestCache: {
        enabled: userConfig.requestCache?.enabled ?? process.env.CACHE_ENABLED !== 'false',
        maxSize: userConfig.requestCache?.maxSize ?? (parseInt(process.env.CACHE_MAX_SIZE) || 1000),
        defaultTTL: userConfig.requestCache?.defaultTTL ?? (parseInt(process.env.CACHE_DEFAULT_TTL) || 5000),
        cleanupInterval: userConfig.requestCache?.cleanupInterval ?? (parseInt(process.env.CACHE_CLEANUP_INTERVAL) || 60000)
      },
      
      // EndpointSelector configuration
      endpointSelector: {
        enabled: userConfig.endpointSelector?.enabled ?? true,
        endpoints: userConfig.endpointSelector?.endpoints ?? [
          process.env.HELIUS_RPC_URL,
          process.env.CHAINSTACK_RPC_URL,
          process.env.PUBLIC_RPC_URL
        ].filter(Boolean),
        healthCheckInterval: userConfig.endpointSelector?.healthCheckInterval ?? (parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000),
        selectionStrategy: userConfig.endpointSelector?.selectionStrategy ?? (process.env.SELECTION_STRATEGY || 'weighted')
      },
      
      // ConnectionPoolCore configuration
      connectionPoolCore: {
        enabled: userConfig.connectionPoolCore?.enabled ?? true,
        maxConnections: userConfig.connectionPoolCore?.maxConnections ?? (parseInt(process.env.MAX_CONNECTIONS) || 100),
        connectionTimeout: userConfig.connectionPoolCore?.connectionTimeout ?? (parseInt(process.env.CONNECTION_TIMEOUT) || 5000),
        requestTimeout: userConfig.connectionPoolCore?.requestTimeout ?? (parseInt(process.env.REQUEST_TIMEOUT) || 30000),
        keepAlive: userConfig.connectionPoolCore?.keepAlive ?? process.env.KEEP_ALIVE !== 'false',
        keepAliveTimeout: userConfig.connectionPoolCore?.keepAliveTimeout ?? (parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 60000)
      },
      
      // BatchManager configuration
      batchManager: {
        enabled: userConfig.batchManager?.enabled ?? process.env.BATCHING_ENABLED !== 'false',
        maxBatchSize: userConfig.batchManager?.maxBatchSize ?? (parseInt(process.env.MAX_BATCH_SIZE) || 100),
        batchWindow: userConfig.batchManager?.batchWindow ?? (parseInt(process.env.BATCH_WINDOW) || 50),
        maxPendingBatches: userConfig.batchManager?.maxPendingBatches ?? (parseInt(process.env.MAX_PENDING_BATCHES) || 10)
      },
      
      // HedgedManager configuration
      hedgedManager: {
        enabled: userConfig.hedgedManager?.enabled ?? process.env.HEDGING_ENABLED !== 'false',
        hedgeDelay: userConfig.hedgedManager?.hedgeDelay ?? (parseInt(process.env.HEDGE_DELAY) || 100),
        maxHedges: userConfig.hedgedManager?.maxHedges ?? (parseInt(process.env.MAX_HEDGES) || 2),
        criticalMethods: userConfig.hedgedManager?.criticalMethods ?? (process.env.CRITICAL_METHODS?.split(',') || [
          'getAccountInfo',
          'getBalance',
          'sendTransaction'
        ])
      },
      
      // RpcManager configuration
      rpcManager: {
        gracefulDegradation: userConfig.rpcManager?.gracefulDegradation ?? process.env.GRACEFUL_DEGRADATION !== 'false',
        maxOrchestratorMemory: userConfig.rpcManager?.maxOrchestratorMemory ?? (parseInt(process.env.MAX_ORCHESTRATOR_MEMORY) || 10485760),
        initTimeout: userConfig.rpcManager?.initTimeout ?? (parseInt(process.env.INIT_TIMEOUT) || 5000)
      },
      
      // Override with user config
      ...userConfig
    };
    
    this.metrics.configValidationTime = Date.now() - startTime;
    return config;
  }

  /**
   * Validate configuration before component creation
   */
  validateConfiguration() {
    const errors = [];
    
    // Validate required endpoints
    if (!this.config.endpointSelector.endpoints || this.config.endpointSelector.endpoints.length === 0) {
      errors.push('No RPC endpoints configured. Set HELIUS_RPC_URL, CHAINSTACK_RPC_URL, or PUBLIC_RPC_URL');
    }
    
    // Validate rate limiting
    if (this.config.tokenBucket.enabled && this.config.tokenBucket.rateLimit <= 0) {
      errors.push('Invalid rate limit configuration. RATE_LIMIT must be > 0');
    }
    
    // Validate circuit breaker
    if (this.config.circuitBreaker.enabled && this.config.circuitBreaker.failureThreshold <= 0) {
      errors.push('Invalid circuit breaker configuration. FAILURE_THRESHOLD must be > 0');
    }
    
    // Validate cache
    if (this.config.requestCache.enabled && this.config.requestCache.maxSize <= 0) {
      errors.push('Invalid cache configuration. CACHE_MAX_SIZE must be > 0');
    }
    
    // Validate connection pool
    if (this.config.connectionPoolCore.maxConnections <= 0) {
      errors.push('Invalid connection pool configuration. MAX_CONNECTIONS must be > 0');
    }
    
    // Validate batch manager
    if (this.config.batchManager.enabled && this.config.batchManager.maxBatchSize <= 0) {
      errors.push('Invalid batch configuration. MAX_BATCH_SIZE must be > 0');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
    
    return true;
  }

  /**
   * Create all components in dependency order
   */
  async createComponents() {
    const startTime = Date.now();
    this.state = 'INITIALIZING';
    
    try {
      // Validate configuration first
      this.validateConfiguration();
      
      // Level 1: Dependency-free components
      await this.createLevel1Components();
      
      // Level 2: Configuration-dependent components
      await this.createLevel2Components();
      
      // Level 3: Component-dependent components
      await this.createLevel3Components();
      
      // Level 4: Orchestrator
      await this.createLevel4Components();
      
      this.metrics.totalCreationTime = Date.now() - startTime;
      this.state = 'READY';
      
      this.emit('components-created', {
        components: Array.from(this.components.keys()),
        duration: this.metrics.totalCreationTime
      });
      
      return this.components;
      
    } catch (error) {
      this.state = 'ERROR';
      this.emit('creation-failed', error);
      throw error;
    }
  }

  /**
   * Level 1: Create dependency-free components
   */
  async createLevel1Components() {
    // TokenBucket
    if (this.config.tokenBucket.enabled) {
      const startTime = Date.now();
      const tokenBucket = await this.createTokenBucket();
      this.components.set('tokenBucket', tokenBucket);
      this.componentOrder.push('tokenBucket');
      this.metrics.creationTime.tokenBucket = Date.now() - startTime;
    }
    
    // CircuitBreaker
    if (this.config.circuitBreaker.enabled) {
      const startTime = Date.now();
      const circuitBreaker = await this.createCircuitBreaker();
      this.components.set('circuitBreaker', circuitBreaker);
      this.componentOrder.push('circuitBreaker');
      this.metrics.creationTime.circuitBreaker = Date.now() - startTime;
    }
    
    // RequestCache
    if (this.config.requestCache.enabled) {
      const startTime = Date.now();
      const requestCache = await this.createRequestCache();
      this.components.set('requestCache', requestCache);
      this.componentOrder.push('requestCache');
      this.metrics.creationTime.requestCache = Date.now() - startTime;
    }
  }

  /**
   * Level 2: Create configuration-dependent components
   */
  async createLevel2Components() {
    // EndpointSelector
    if (this.config.endpointSelector.enabled) {
      const startTime = Date.now();
      const endpointSelector = await this.createEndpointSelector();
      this.components.set('endpointSelector', endpointSelector);
      this.componentOrder.push('endpointSelector');
      this.metrics.creationTime.endpointSelector = Date.now() - startTime;
    }
    
    // ConnectionPoolCore
    if (this.config.connectionPoolCore.enabled) {
      const startTime = Date.now();
      const connectionPoolCore = await this.createConnectionPoolCore();
      this.components.set('connectionPoolCore', connectionPoolCore);
      this.componentOrder.push('connectionPoolCore');
      this.metrics.creationTime.connectionPoolCore = Date.now() - startTime;
    }
  }

  /**
   * Level 3: Create component-dependent components
   */
  async createLevel3Components() {
    // BatchManager (requires ConnectionPoolCore)
    if (this.config.batchManager.enabled && this.components.has('connectionPoolCore')) {
      const startTime = Date.now();
      const batchManager = await this.createBatchManager(this.components.get('connectionPoolCore'));
      this.components.set('batchManager', batchManager);
      this.componentOrder.push('batchManager');
      this.metrics.creationTime.batchManager = Date.now() - startTime;
    }
    
    // HedgedManager (requires EndpointSelector + ConnectionPoolCore)
    if (this.config.hedgedManager.enabled && 
        this.components.has('endpointSelector') && 
        this.components.has('connectionPoolCore')) {
      const startTime = Date.now();
      const hedgedManager = await this.createHedgedManager(
        this.components.get('endpointSelector'),
        this.components.get('connectionPoolCore')
      );
      this.components.set('hedgedManager', hedgedManager);
      this.componentOrder.push('hedgedManager');
      this.metrics.creationTime.hedgedManager = Date.now() - startTime;
    }
  }

  /**
   * Level 4: Create orchestrator with all components
   */
  async createLevel4Components() {
    // Import and create RpcManager
    const { RpcManager } = await import('./rpc-manager.js');
    
    const startTime = Date.now();
    const rpcManager = new RpcManager(this.config.rpcManager);
    
    // Inject all components
    const componentMap = {
      tokenBucket: this.components.get('tokenBucket'),
      circuitBreaker: this.components.get('circuitBreaker'),
      requestCache: this.components.get('requestCache'),
      endpointSelector: this.components.get('endpointSelector'),
      connectionPool: this.components.get('connectionPoolCore'),
      batchManager: this.components.get('batchManager'),
      hedgedManager: this.components.get('hedgedManager')
    };
    
    await rpcManager.initialize(componentMap);
    
    this.components.set('rpcManager', rpcManager);
    this.componentOrder.push('rpcManager');
    this.metrics.creationTime.rpcManager = Date.now() - startTime;
  }

  /**
   * Component creation methods (to be implemented with actual components)
   */
  async createTokenBucket() {
    // Placeholder - will be replaced with actual TokenBucket implementation
    return {
      type: 'TokenBucket',
      config: this.config.tokenBucket,
      async initialize() { return true; },
      async hasTokens(count) { return true; },
      async consume(count) { return true; },
      async healthCheck() { return { healthy: true, tokens: 100 }; },
      async shutdown() { return true; }
    };
  }

  async createCircuitBreaker() {
    // Placeholder - will be replaced with actual CircuitBreaker implementation
    return {
      type: 'CircuitBreaker',
      config: this.config.circuitBreaker,
      state: 'CLOSED',
      async initialize() { return true; },
      async execute(key, fn) { return fn(); },
      async healthCheck() { return { healthy: true, state: 'CLOSED' }; },
      async shutdown() { return true; }
    };
  }

  async createRequestCache() {
    // Placeholder - will be replaced with actual RequestCache implementation
    return {
      type: 'RequestCache',
      config: this.config.requestCache,
      cache: new Map(),
      async initialize() { return true; },
      async get(key) { return this.cache.get(key); },
      async set(key, value, ttl) { 
        this.cache.set(key, value);
        setTimeout(() => this.cache.delete(key), ttl);
        return true;
      },
      async healthCheck() { return { healthy: true, size: this.cache.size }; },
      async shutdown() { 
        this.cache.clear();
        return true;
      }
    };
  }

  async createEndpointSelector() {
    // Placeholder - will be replaced with actual EndpointSelector implementation
    return {
      type: 'EndpointSelector',
      config: this.config.endpointSelector,
      endpoints: this.config.endpointSelector.endpoints,
      currentIndex: 0,
      async initialize() { return true; },
      async selectEndpoint() { 
        const endpoint = this.endpoints[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
        return endpoint;
      },
      async selectBackupEndpoint() {
        return this.endpoints[(this.currentIndex + 1) % this.endpoints.length];
      },
      async healthCheck() { 
        return { healthy: true, availableEndpoints: this.endpoints.length };
      },
      async shutdown() { return true; }
    };
  }

  async createConnectionPoolCore() {
    // For now, use the existing RpcConnectionPoolV2 if available
    try {
      const { RpcConnectionPoolV2 } = await import('./rpc-connection-pool.js');
      return new RpcConnectionPoolV2(this.config.connectionPoolCore);
    } catch (error) {
      // Fallback to placeholder
      return {
        type: 'ConnectionPoolCore',
        config: this.config.connectionPoolCore,
        async initialize() { return true; },
        async execute(method, params) {
          return { jsonrpc: '2.0', id: 1, result: { method, params } };
        },
        async executeWithEndpoint(endpoint, method, params) {
          return { jsonrpc: '2.0', id: 1, result: { endpoint, method, params } };
        },
        async healthCheck() { return { healthy: true, connections: 0 }; },
        async shutdown() { return true; }
      };
    }
  }

  async createBatchManager(connectionPool) {
    // Placeholder - will be replaced with actual BatchManager implementation
    return {
      type: 'BatchManager',
      config: this.config.batchManager,
      connectionPool,
      pendingBatches: [],
      async initialize() { return true; },
      async addRequest(method, params, executor) {
        return executor([{ method, params }]);
      },
      async healthCheck() { 
        return { healthy: true, pendingBatches: this.pendingBatches.length };
      },
      async shutdown() { return true; }
    };
  }

  async createHedgedManager(endpointSelector, connectionPool) {
    // Placeholder - will be replaced with actual HedgedManager implementation
    return {
      type: 'HedgedManager',
      config: this.config.hedgedManager,
      endpointSelector,
      connectionPool,
      async initialize() { return true; },
      async hedgedRequest(primaryRequest, backupRequests, delay) {
        try {
          return await primaryRequest();
        } catch (error) {
          if (backupRequests.length > 0) {
            return await backupRequests[0]();
          }
          throw error;
        }
      },
      async healthCheck() { return { healthy: true, hedgesActive: 0 }; },
      async shutdown() { return true; }
    };
  }

  /**
   * Lifecycle management methods
   */
  async startAll() {
    if (this.state !== 'READY') {
      throw new Error(`Cannot start components in state: ${this.state}`);
    }
    
    for (const componentName of this.componentOrder) {
      const component = this.components.get(componentName);
      if (component && typeof component.start === 'function') {
        await component.start();
      }
    }
    
    this.emit('all-started');
  }

  async stopAll() {
    this.state = 'STOPPING';
    
    // Stop in reverse order
    for (let i = this.componentOrder.length - 1; i >= 0; i--) {
      const componentName = this.componentOrder[i];
      const component = this.components.get(componentName);
      
      if (component && typeof component.shutdown === 'function') {
        try {
          await component.shutdown();
        } catch (error) {
          this.emit('shutdown-error', { component: componentName, error });
        }
      }
    }
    
    this.state = 'STOPPED';
    this.emit('all-stopped');
  }

  /**
   * Health check all components
   */
  async healthCheckAll() {
    const healthResults = {};
    
    for (const [name, component] of this.components) {
      const startTime = Date.now();
      
      try {
        if (typeof component.healthCheck === 'function') {
          healthResults[name] = await component.healthCheck();
        } else {
          healthResults[name] = { healthy: true, type: component.type || 'unknown' };
        }
        
        this.metrics.healthCheckTime[name] = Date.now() - startTime;
        this.componentHealth.set(name, true);
        
      } catch (error) {
        healthResults[name] = { healthy: false, error: error.message };
        this.componentHealth.set(name, false);
        this.metrics.healthCheckTime[name] = Date.now() - startTime;
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      state: this.state,
      components: healthResults,
      metrics: {
        healthCheckTimes: this.metrics.healthCheckTime,
        avgHealthCheckTime: Object.values(this.metrics.healthCheckTime).reduce((a, b) => a + b, 0) / 
                           Object.keys(this.metrics.healthCheckTime).length || 0
      }
    };
  }

  /**
   * Get component by name
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Get all components
   */
  getAllComponents() {
    return Object.fromEntries(this.components);
  }

  /**
   * Get component creation order
   */
  getCreationOrder() {
    return [...this.componentOrder];
  }

  /**
   * Get factory metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      componentCount: this.components.size,
      healthyComponents: Array.from(this.componentHealth.values()).filter(h => h).length,
      state: this.state
    };
  }
}

export { ComponentFactory };
export default ComponentFactory;