// File: system/orchestrator.js
// Complete system lifecycle management

import { componentFactory } from './component-factory.js';
import { HealthMonitor } from './health-monitor.js';
import { ConfigManager } from './config-manager.js';
import { createStructuredLogger } from '../src/logger/structured-logger.js';

export class SystemOrchestrator {
  constructor() {
    this.config = new ConfigManager();
    this.logger = createStructuredLogger('SystemOrchestrator');
    this.healthMonitor = new HealthMonitor();
    this.components = {};
    this.isStarted = false;
    this.startupOrder = [];
    this.shutdownPromise = null;
  }

  /**
   * Register component types and their factories
   */
  registerComponents() {
    // Register RPC connection pool
    componentFactory.register(
      'rpc-connection-pool',
      async (config, logger) => {
        const { RpcConnectionPool } = await import('../src/detection/transport/rpc-connection-pool.js');
        const poolConfig = {
          endpoints: [
            config.get('HELIUS_RPC_URL'),
            config.get('CHAINSTACK_RPC_URL'),
            config.get('PUBLIC_RPC_URL')
          ].filter(Boolean),
          rpsLimit: parseInt(config.get('RPC_DEFAULT_RPS_LIMIT')) || 50,
          concurrency: parseInt(config.get('RPC_DEFAULT_CONCURRENCY_LIMIT')) || 10,
          timeout: parseInt(config.get('RPC_DEFAULT_TIMEOUT_MS')) || 2000,
          breakerEnabled: config.get('RPC_BREAKER_ENABLED') === 'true',
          keepAliveEnabled: config.get('RPC_KEEP_ALIVE_ENABLED') === 'true'
        };
        
        return new RpcConnectionPool(poolConfig);
      },
      async (config, logger) => {
        const { RpcConnectionPoolFake } = await import('../src/adapters/rpc-connection-pool.fake.js');
        return new RpcConnectionPoolFake(logger);
      }
    );

    this.logger.info('Components registered with factory');
  }

  /**
   * Start system in proper dependency order
   */
  async startSystem() {
    if (this.isStarted) {
      throw new Error('System already started');
    }

    this.logger.info('Starting trading system...');

    try {
      // Validate configuration first
      const configValidation = this.config.validate();
      if (!configValidation.valid) {
        throw new Error(`Configuration invalid: ${configValidation.errors.join(', ')}`);
      }

      // Register all component types
      this.registerComponents();

      // Start components in dependency order
      this.startupOrder = ['rpc-connection-pool'];
      
      for (const componentType of this.startupOrder) {
        this.logger.info(`Starting ${componentType}...`);
        
        const component = await componentFactory.create(componentType);
        this.components[componentType] = component;
        
        // Register with health monitor
        this.healthMonitor.register(componentType, component);
        
        this.logger.info(`${componentType} started successfully`);
      }

      // Initial health check
      const healthStatus = await this.healthMonitor.checkAll();
      const unhealthyComponents = Object.entries(healthStatus)
        .filter(([_, status]) => !status.healthy)
        .map(([name]) => name);

      if (unhealthyComponents.length > 0) {
        throw new Error(`Unhealthy components after startup: ${unhealthyComponents.join(', ')}`);
      }

      this.isStarted = true;
      this.logger.info('Trading system started successfully', {
        components: Object.keys(this.components),
        useFakes: this.config.get('USE_FAKES')
      });

      // Start periodic health monitoring
      this.startHealthMonitoring();

      return {
        components: this.components,
        health: healthStatus,
        config: this.config.getAll()
      };

    } catch (error) {
      this.logger.error('System startup failed', { error: error.message });
      await this.shutdown();
      throw error;
    }
  }

  /**
   * Start periodic health monitoring
   */
  startHealthMonitoring() {
    const intervalMs = this.config.get('HEALTH_CHECK_INTERVAL_MS', 30000);
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthStatus = await this.healthMonitor.checkAll();
        const unhealthyComponents = Object.entries(healthStatus)
          .filter(([_, status]) => !status.healthy);

        if (unhealthyComponents.length > 0) {
          this.logger.warn('Unhealthy components detected', {
            unhealthy: unhealthyComponents.map(([name, status]) => ({
              name,
              consecutiveFailures: status.consecutiveFailures,
              error: status.error
            }))
          });
        }
      } catch (error) {
        this.logger.error('Health check failed', { error: error.message });
      }
    }, intervalMs);
  }

  /**
   * Graceful system shutdown
   */
  async shutdown() {
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.shutdownPromise = this._performShutdown();
    return this.shutdownPromise;
  }

  async _performShutdown() {
    this.logger.info('Shutting down trading system...');

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Shutdown components in reverse order
    const shutdownOrder = [...this.startupOrder].reverse();
    
    for (const componentType of shutdownOrder) {
      const component = this.components[componentType];
      if (!component) continue;

      try {
        if (typeof component.shutdown === 'function') {
          await component.shutdown();
        }
        this.logger.info(`${componentType} shut down successfully`);
      } catch (error) {
        this.logger.error(`Failed to shutdown ${componentType}`, { error: error.message });
      }
    }

    // Clear factory instances
    componentFactory.clear();
    
    this.components = {};
    this.isStarted = false;
    this.shutdownPromise = null;

    this.logger.info('Trading system shut down complete');
  }

  /**
   * Get system status
   */
  async getStatus() {
    return {
      started: this.isStarted,
      components: Object.keys(this.components),
      health: await this.healthMonitor.checkAll(),
      config: this.config.getAll()
    };
  }
}