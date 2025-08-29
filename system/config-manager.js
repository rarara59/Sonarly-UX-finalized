// File: system/config-manager.js
// Environment-based configuration management

export class ConfigManager {
  constructor() {
    this.config = new Map();
    this.validators = new Map();
    this.loadEnvironment();
  }

  /**
   * Load configuration from environment variables
   */
  loadEnvironment() {
    // Trading system configuration
    this.set('TRADING_ENABLED', process.env.TRADING_ENABLED === 'true');
    this.set('USE_FAKES', process.env.USE_FAKES === 'true');
    this.set('LOG_LEVEL', process.env.LOG_LEVEL || 'info');
    
    // RPC configuration
    this.set('HELIUS_RPC_URL', process.env.HELIUS_RPC_URL);
    this.set('CHAINSTACK_RPC_URL', process.env.CHAINSTACK_RPC_URL);
    this.set('PUBLIC_RPC_URL', process.env.PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');
    
    // Performance configuration
    this.set('RPC_DEFAULT_RPS_LIMIT', parseInt(process.env.RPC_DEFAULT_RPS_LIMIT) || 50);
    this.set('RPC_DEFAULT_CONCURRENCY_LIMIT', parseInt(process.env.RPC_DEFAULT_CONCURRENCY_LIMIT) || 10);
    this.set('RPC_DEFAULT_TIMEOUT_MS', parseInt(process.env.RPC_DEFAULT_TIMEOUT_MS) || 2000);
    
    // Health monitoring
    this.set('HEALTH_CHECK_TIMEOUT_MS', parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS) || 100);
    this.set('HEALTH_CHECK_INTERVAL_MS', parseInt(process.env.HEALTH_CHECK_INTERVAL_MS) || 30000);
  }

  /**
   * Set configuration value with optional validation
   */
  set(key, value, validator = null) {
    if (validator) {
      const validationResult = validator(value);
      if (!validationResult.valid) {
        throw new Error(`Invalid config for ${key}: ${validationResult.reason}`);
      }
    }
    
    this.config.set(key, value);
    if (validator) {
      this.validators.set(key, validator);
    }
  }

  /**
   * Get configuration value with optional default
   */
  get(key, defaultValue = undefined) {
    return this.config.has(key) ? this.config.get(key) : defaultValue;
  }

  /**
   * Get all configuration as object
   */
  getAll() {
    return Object.fromEntries(this.config);
  }

  /**
   * Validate all configuration
   */
  validate() {
    const errors = [];
    
    for (const [key, validator] of this.validators) {
      const value = this.config.get(key);
      const result = validator(value);
      if (!result.valid) {
        errors.push(`${key}: ${result.reason}`);
      }
    }
    
    // Required RPC URLs when not using fakes
    if (!this.get('USE_FAKES')) {
      if (!this.get('HELIUS_RPC_URL')) {
        errors.push('HELIUS_RPC_URL: Required when USE_FAKES=false');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}