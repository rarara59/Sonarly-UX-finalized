/**
 * Configuration Manager - Renaissance Trading System
 * Dynamic configuration loading with environment-specific overrides
 */

import { BaseConfig } from './base.js';
import { ProductionConfig } from './production.js';
import { DevelopmentConfig } from './development.js';
import { environmentValidator } from './validation.js';

class ConfigurationManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = null;
    this.configCache = new Map();
    this.initialized = false;
  }
  
  /**
   * Initialize configuration system
   */
  async initialize() {
    if (this.initialized) {
      return this.config;
    }
    
    try {
      console.log('[CONFIG] Initializing configuration manager...');
      
      // Validate environment first
      const validation = environmentValidator.validate();
      
      if (!validation.valid && this.environment === 'production') {
        throw new Error('Configuration validation failed in production mode');
      }
      
      // Load configuration
      await this.load();
      
      this.initialized = true;
      return this.config;
      
    } catch (error) {
      console.error(`[CONFIG] Initialization failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load configuration based on environment
   */
  async load() {
    try {
      console.log(`[CONFIG] Loading configuration for environment: ${this.environment}`);
      
      // Start with base configuration
      let config = { ...BaseConfig };
      
      // Load environment-specific configuration
      const envConfig = await this.loadEnvironmentConfig();
      
      // Deep merge configurations
      this.config = this.mergeConfigs(config, envConfig);
      
      // Apply environment variable overrides
      this.applyEnvironmentOverrides();
      
      // Validate final configuration
      this.validateConfiguration();
      
      // Freeze configuration in production
      if (this.environment === 'production') {
        this.freezeConfiguration(this.config);
      }
      
      console.log(`[CONFIG] Configuration loaded successfully (env: ${this.environment})`);
      
    } catch (error) {
      console.error(`[CONFIG] Failed to load configuration: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load environment-specific configuration
   */
  async loadEnvironmentConfig() {
    switch (this.environment) {
      case 'production':
        return ProductionConfig;
      
      case 'development':
        return DevelopmentConfig;
      
      case 'testing':
        // Create testing config if needed
        return {
          ...DevelopmentConfig,
          environment: 'testing',
          logging: { ...DevelopmentConfig.logging, level: 'warn' },
          database: { ...BaseConfig.database, name: 'test_db' }
        };
      
      case 'staging':
        // Staging is like production but with some relaxed settings
        return {
          ...ProductionConfig,
          environment: 'staging',
          logging: { ...ProductionConfig.logging, level: 'info' },
          security: { ...ProductionConfig.security, rateLimit: { ...ProductionConfig.security.rateLimit, max: 5000 } }
        };
      
      default:
        console.warn(`[CONFIG] Unknown environment: ${this.environment}, using development`);
        return DevelopmentConfig;
    }
  }
  
  /**
   * Deep merge configurations
   */
  mergeConfigs(base, override) {
    // Custom deep merge implementation
    const deepMerge = (target, source) => {
      const output = { ...target };
      
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            // Recursively merge objects
            output[key] = deepMerge(target[key] || {}, source[key]);
          } else {
            // Replace primitives and arrays
            output[key] = source[key];
          }
        }
      }
      
      return output;
    };
    
    return deepMerge(base, override);
  }
  
  /**
   * Apply environment variable overrides
   */
  applyEnvironmentOverrides() {
    // Override specific configuration values with environment variables
    const overrides = {
      'system.instanceId': process.env.INSTANCE_ID,
      'logging.level': process.env.LOG_LEVEL,
      'trading.maxPositionSize': process.env.MAX_POSITION_SIZE ? parseInt(process.env.MAX_POSITION_SIZE) : undefined,
      'trading.maxDailyLoss': process.env.MAX_DAILY_LOSS ? parseFloat(process.env.MAX_DAILY_LOSS) : undefined,
      'trading.enablePaperTrading': process.env.ENABLE_PAPER_TRADING === 'true',
      'network.connectionPoolSize': process.env.CONNECTION_POOL_SIZE ? parseInt(process.env.CONNECTION_POOL_SIZE) : undefined,
      'cache.defaultTTL': process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : undefined,
      'workers.processes': process.env.WORKER_PROCESSES ? parseInt(process.env.WORKER_PROCESSES) : undefined,
      'database.poolMax': process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : undefined
    };
    
    // Apply overrides
    Object.entries(overrides).forEach(([path, value]) => {
      if (value !== undefined) {
        this.setNestedValue(this.config, path, value);
      }
    });
  }
  
  /**
   * Validate final configuration
   */
  validateConfiguration() {
    // Ensure critical values are present
    const requiredPaths = [
      'system.name',
      'system.version',
      'logging.level',
      'trading.maxConcurrentTrades',
      'network.requestTimeout'
    ];
    
    requiredPaths.forEach(path => {
      if (this.get(path) === undefined) {
        throw new Error(`Required configuration missing: ${path}`);
      }
    });
    
    // Validate value ranges
    const validations = [
      { path: 'trading.maxConcurrentTrades', min: 1, max: 1000 },
      { path: 'network.requestTimeout', min: 100, max: 60000 },
      { path: 'workers.processes', min: 1, max: 16 }
    ];
    
    validations.forEach(({ path, min, max }) => {
      const value = this.get(path);
      if (value !== undefined && (value < min || value > max)) {
        throw new Error(`Configuration value out of range: ${path} = ${value} (allowed: ${min}-${max})`);
      }
    });
  }
  
  /**
   * Get configuration value by path
   */
  get(path, defaultValue = undefined) {
    if (!this.initialized) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    
    // Check cache first
    if (this.configCache.has(path)) {
      return this.configCache.get(path);
    }
    
    // Get nested value
    const value = this.getNestedValue(this.config, path, defaultValue);
    
    // Cache the result
    this.configCache.set(path, value);
    
    return value;
  }
  
  /**
   * Get entire configuration object
   */
  getAll() {
    if (!this.initialized) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    
    // Return a frozen copy in production
    if (this.environment === 'production') {
      return Object.freeze({ ...this.config });
    }
    
    return { ...this.config };
  }
  
  /**
   * Get environment name
   */
  getEnvironment() {
    return this.environment;
  }
  
  /**
   * Check if in production mode
   */
  isProduction() {
    return this.environment === 'production';
  }
  
  /**
   * Check if in development mode
   */
  isDevelopment() {
    return this.environment === 'development';
  }
  
  /**
   * Get nested value from object
   */
  getNestedValue(obj, path, defaultValue) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    
    return result;
  }
  
  /**
   * Set nested value in object
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }
  
  /**
   * Freeze configuration object recursively
   */
  freezeConfiguration(obj) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] !== null && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')) {
        this.freezeConfiguration(obj[prop]);
      }
    });
  }
  
  /**
   * Reload configuration (development only)
   */
  async reload() {
    if (this.environment === 'production') {
      throw new Error('Configuration reload not allowed in production');
    }
    
    console.log('[CONFIG] Reloading configuration...');
    
    this.initialized = false;
    this.config = null;
    this.configCache.clear();
    
    return this.initialize();
  }
  
  /**
   * Export configuration for debugging
   */
  export() {
    if (this.environment === 'production') {
      // Sanitize sensitive values in production
      const sanitized = JSON.parse(JSON.stringify(this.config));
      this.sanitizeConfig(sanitized);
      return sanitized;
    }
    
    return this.getAll();
  }
  
  /**
   * Sanitize configuration for export
   */
  sanitizeConfig(config) {
    const sensitiveKeys = ['secret', 'password', 'key', 'token', 'credential'];
    
    const sanitize = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        } else if (typeof obj[key] === 'string') {
          const lowerKey = key.toLowerCase();
          if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            obj[key] = '***REDACTED***';
          }
        }
      });
    };
    
    sanitize(config);
  }
}

// Create singleton instance
const configManager = new ConfigurationManager();

// Export convenience functions
export const config = {
  initialize: () => configManager.initialize(),
  get: (path, defaultValue) => configManager.get(path, defaultValue),
  getAll: () => configManager.getAll(),
  getEnvironment: () => configManager.getEnvironment(),
  isProduction: () => configManager.isProduction(),
  isDevelopment: () => configManager.isDevelopment(),
  reload: () => configManager.reload(),
  export: () => configManager.export()
};

// Export the manager instance for advanced usage
export { configManager };
export default config;