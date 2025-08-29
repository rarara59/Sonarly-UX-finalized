// File: system/health-monitor.js
// Fast health checking for trading components

import { createStructuredLogger } from '../src/logger/structured-logger.js';
import { ConfigManager } from './config-manager.js';

export class HealthMonitor {
  constructor() {
    this.components = new Map();
    this.healthStatus = new Map();
    this.logger = createStructuredLogger('HealthMonitor');
    this.config = new ConfigManager();
  }

  /**
   * Register component for health monitoring
   */
  register(name, component, healthCheckFn = null) {
    this.components.set(name, {
      component,
      healthCheck: healthCheckFn || this.defaultHealthCheck.bind(this, component)
    });
    
    this.healthStatus.set(name, {
      healthy: true,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      error: null
    });
    
    this.logger.debug('Component registered for health monitoring', { name });
  }

  /**
   * Default health check function
   */
  async defaultHealthCheck(component) {
    if (typeof component.isHealthy === 'function') {
      return await component.isHealthy();
    }
    
    // For RPC components, try a simple call
    if (typeof component.call === 'function') {
      try {
        const result = await Promise.race([
          component.call('getSlot', []),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 1000)
          )
        ]);
        return typeof result === 'number' && result > 0;
      } catch {
        return false;
      }
    }
    
    // Default: assume healthy if component exists
    return !!component;
  }

  /**
   * Check health of single component (fast, <100ms requirement)
   */
  async checkComponent(name) {
    const registration = this.components.get(name);
    if (!registration) {
      return { healthy: false, error: 'Component not registered' };
    }

    const timeoutMs = this.config.get('HEALTH_CHECK_TIMEOUT_MS', 100);
    
    try {
      const healthCheckPromise = registration.healthCheck();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      );
      
      const healthy = await Promise.race([healthCheckPromise, timeoutPromise]);
      
      const status = {
        healthy: !!healthy,
        lastCheck: new Date(),
        consecutiveFailures: healthy ? 0 : (this.healthStatus.get(name)?.consecutiveFailures || 0) + 1,
        error: null
      };
      
      this.healthStatus.set(name, status);
      return status;
      
    } catch (error) {
      const status = {
        healthy: false,
        lastCheck: new Date(),
        consecutiveFailures: (this.healthStatus.get(name)?.consecutiveFailures || 0) + 1,
        error: error.message
      };
      
      this.healthStatus.set(name, status);
      return status;
    }
  }

  /**
   * Check all components health (parallel, fast)
   */
  async checkAll() {
    const componentNames = Array.from(this.components.keys());
    const healthChecks = componentNames.map(name => 
      this.checkComponent(name).then(status => ({ name, status }))
    );
    
    const results = await Promise.allSettled(healthChecks);
    const healthReport = {};
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        healthReport[result.value.name] = result.value.status;
      } else {
        // Health check itself failed
        const errorStatus = {
          healthy: false,
          lastCheck: new Date(),
          consecutiveFailures: 999,
          error: result.reason.message
        };
        healthReport.unknown = errorStatus;
      }
    }
    
    return healthReport;
  }

  /**
   * Get current health status without new checks
   */
  getStatus() {
    return Object.fromEntries(this.healthStatus);
  }

  /**
   * Check if system is healthy for trading
   */
  isSystemHealthy() {
    for (const status of this.healthStatus.values()) {
      if (!status.healthy) {
        return false;
      }
    }
    return true;
  }
}
