// File: system/component-factory.js
// Universal Component Factory - Creates any component based on environment config

import { ConfigManager } from './config-manager.js';
import { createStructuredLogger } from '../src/logger/structured-logger.js';

export class ComponentFactory {
  constructor() {
    this.config = new ConfigManager();
    this.logger = createStructuredLogger('ComponentFactory');
    this.registry = new Map();
    this.instances = new Map();
  }

  /**
   * Register a component type with its factory functions
   */
  register(componentType, realFactory, fakeFactory = null) {
    this.registry.set(componentType, { realFactory, fakeFactory });
    this.logger.debug('Component registered', { componentType, hasFake: !!fakeFactory });
  }

  /**
   * Create component instance based on configuration
   */
  async create(componentType, options = {}) {
    const registration = this.registry.get(componentType);
    if (!registration) {
      throw new Error(`Unknown component type: ${componentType}`);
    }

    const useFakes = options.useFakes ?? this.config.get('USE_FAKES', false);
    const instanceKey = `${componentType}_${useFakes ? 'fake' : 'real'}`;

    // Return singleton if already created
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey);
    }

    const factory = useFakes && registration.fakeFactory 
      ? registration.fakeFactory 
      : registration.realFactory;

    if (!factory) {
      throw new Error(`No ${useFakes ? 'fake' : 'real'} factory for ${componentType}`);
    }

    try {
      const component = await factory(this.config, this.logger);
      this.instances.set(instanceKey, component);
      
      this.logger.info('Component created', { 
        componentType, 
        useFakes, 
        instanceKey 
      });
      
      return component;
    } catch (error) {
      this.logger.error('Component creation failed', { 
        componentType, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get all active component instances
   */
  getInstances() {
    return Object.fromEntries(this.instances);
  }

  /**
   * Clear all instances (for testing)
   */
  clear() {
    this.instances.clear();
    this.logger.debug('All component instances cleared');
  }
}

// Global factory instance
export const componentFactory = new ComponentFactory();