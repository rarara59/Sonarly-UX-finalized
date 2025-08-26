/**
 * Configuration Manager - Renaissance Trading System
 * Dynamic configuration loading with environment-specific overrides
 */

import crypto from 'crypto';
import { BaseConfig } from './base.js';
import { ProductionConfig } from './production.js';
import { DevelopmentConfig } from './development.js';
import { environmentValidator } from './validation.js';
import { ConfigValidator } from './config-validator.js';

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
   * Validate final configuration using enhanced validator
   */
  validateConfiguration() {
    // Use the enhanced ConfigValidator for comprehensive validation
    const validatedConfig = ConfigValidator.validateConfig();
    
    // If validation passes, we can optionally merge validated config
    // For now, just ensure validation passes
    if (!validatedConfig) {
      throw new Error('Configuration validation failed');
    }
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

/**
 * P1.6 Configuration Snapshot and Audit Trail Functions
 */

/**
 * Creates a stable hash of configuration object
 * Recursively sorts keys and creates SHA256 hash
 */
function createStableConfigHash(config) {
  const sortedConfig = JSON.stringify(config, Object.keys(config).sort());
  return crypto.createHash('sha256').update(sortedConfig).digest('hex');
}

/**
 * Redacts secrets from URLs including path, query, and auth parameters
 */
function redactSecretsInUrl(urlString) {
  try {
    const url = new URL(urlString);
    let redactedUrl = `${url.protocol}//${url.hostname}`;
    
    // Add port if not default
    if (url.port && 
        !((url.protocol === 'https:' && url.port === '443') || 
          (url.protocol === 'http:' && url.port === '80'))) {
      redactedUrl += `:${url.port}`;
    }
    
    // ENHANCED: Helper function to identify secret-looking segments
    const looksLikeSecret = (segment) => {
      if (!segment || segment.length < 8) return false;
      
      return (
        // Long alphanumeric strings (likely API keys) - reduced threshold to 15
        /^[A-Za-z0-9_-]{15,}$/.test(segment) ||
        // Hex strings (crypto keys)
        /^[a-f0-9]{32,}$/i.test(segment) ||
        // Base64-like strings
        /^[A-Za-z0-9+/]{20,}={0,2}$/.test(segment) ||
        // Contains key-related terms
        /key|token|auth|secret|api|credential|pass/i.test(segment) ||
        // UUID patterns
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(segment) ||
        // Common API key prefixes
        /^(sk_|pk_|api_|auth_|token_)/i.test(segment) ||
        // Long numeric strings
        /^\d{15,}$/.test(segment)
      );
    };
    
    // ENHANCED: Redact ALL path segments that look like secrets (not just last)
    if (url.pathname && url.pathname !== '/') {
      const pathSegments = url.pathname.split('/').map(segment => {
        if (segment && looksLikeSecret(segment)) {
          return '[REDACTED]';
        }
        return segment;
      });
      redactedUrl += pathSegments.join('/');
    }
    
    // ENHANCED: Always redact query parameters (comprehensive patterns)
    if (url.search) {
      // Check if query contains obvious secrets before blanket redaction
      const queryParams = new URLSearchParams(url.search);
      const hasSecrets = Array.from(queryParams.entries()).some(([key, value]) => {
        return (
          // Key names that indicate secrets
          /key|token|auth|secret|password|credential|api|access/i.test(key) ||
          // Values that look like secrets
          looksLikeSecret(value)
        );
      });
      
      if (hasSecrets) {
        redactedUrl += '?[REDACTED]';
      } else {
        // If no obvious secrets, redact selectively
        const redactedParams = new URLSearchParams();
        queryParams.forEach((value, key) => {
          if (/key|token|auth|secret|password|credential|api/i.test(key) || looksLikeSecret(value)) {
            redactedParams.set(key, '[REDACTED]');
          } else {
            redactedParams.set(key, value);
          }
        });
        redactedUrl += '?' + redactedParams.toString();
      }
    }
    
    // ENHANCED: Redact authentication in URL (username:password@host)
    if (url.username || url.password) {
      // Replace the hostname section to include auth redaction
      const hostPart = url.hostname + (url.port && 
        !((url.protocol === 'https:' && url.port === '443') || 
          (url.protocol === 'http:' && url.port === '80')) ? `:${url.port}` : '');
      redactedUrl = redactedUrl.replace(hostPart, `[REDACTED_AUTH]@${hostPart}`);
    }
    
    return redactedUrl;
    
  } catch (error) {
    // If URL parsing fails, apply basic redaction patterns to raw string
    let redacted = urlString;
    
    // Redact common secret patterns in raw strings
    const secretPatterns = [
      // API keys in query strings
      /([?&])(api[_-]?key|token|auth|secret|password)=([^&]+)/gi,
      // Long alphanumeric strings that look like keys
      /\b[A-Za-z0-9_-]{32,}\b/g,
      // Hex strings
      /\b[a-f0-9]{32,}\b/gi,
      // Base64-like strings
      /\b[A-Za-z0-9+/]{20,}={0,2}\b/g
    ];
    
    secretPatterns.forEach(pattern => {
      redacted = redacted.replace(pattern, (match, prefix, key, value) => {
        if (prefix && key) {
          return `${prefix}${key}=[REDACTED]`;
        }
        return '[REDACTED]';
      });
    });
    
    return redacted.length !== urlString.length ? redacted : '[REDACTED_INVALID_URL]';
  }
}

// ENHANCED: Add comprehensive secret redaction for any text content
function redactSecretsInText(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  let redacted = text;
  
  // Common secret patterns in logs and configuration
  const secretPatterns = [
    // API keys and tokens - reduced threshold to catch shorter keys
    { pattern: /\b(api[_-]?key|token|auth[_-]?key|secret[_-]?key)[\s:=]+([A-Za-z0-9_-]{5,})\b/gi, replacement: '$1=[REDACTED]' },
    // Bearer tokens - reduced threshold
    { pattern: /\b(bearer\s+)([A-Za-z0-9_-]{5,})\b/gi, replacement: '$1[REDACTED]' },
    // Authorization headers
    { pattern: /\b(authorization[\s:=]+)([A-Za-z0-9+/=]{20,})\b/gi, replacement: '$1[REDACTED]' },
    // Common key prefixes - reduced threshold
    { pattern: /\b(sk_|pk_|api_|auth_|token_)([A-Za-z0-9_-]{3,})\b/gi, replacement: '$1[REDACTED]' },
    // UUIDs that might be secrets
    { pattern: /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, replacement: '[REDACTED_UUID]' },
    // Long hex strings (including 0x prefix)
    { pattern: /\b(0x)?[a-f0-9]{32,}\b/gi, replacement: '[REDACTED_HEX]' },
    // Base64 patterns
    { pattern: /\b[A-Za-z0-9+/]{32,}={0,2}\b/g, replacement: '[REDACTED_BASE64]' },
    // Password fields
    { pattern: /\b(password|passwd|pwd)[\s:=]+([^\s,}]+)/gi, replacement: '$1=[REDACTED]' },
    // Private keys
    { pattern: /(-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----)(.*?)(-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----)/gis, replacement: '$1[REDACTED]$3' }
  ];
  
  secretPatterns.forEach(({ pattern, replacement }) => {
    redacted = redacted.replace(pattern, replacement);
  });
  
  return redacted;
}

/**
 * Generates an immutable configuration snapshot with audit information
 */
function generateConfigSnapshot() {
  if (!configManager.initialized) {
    // Return placeholder snapshot when config is not yet initialized
    return Object.freeze({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      instanceId: 'not-initialized',
      configHash: 'pending',
      config_version: '0'.repeat(64),  // Placeholder 64-char hash for uninitialized state
      sanitizedConfigHash: 'pending',
      version: 'unknown',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      config: Object.freeze({
        status: 'Configuration not yet initialized',
        note: 'Config snapshot will be generated after initialization'
      })
    });
  }
  
  const rawConfig = configManager.getAll();
  
  // Create hash of all config values for versioning (before redaction)
  const configVersion = createStableConfigHash(rawConfig);
  
  // Deep clone for redaction
  const redactedConfig = JSON.parse(JSON.stringify(rawConfig));
  
  // Apply comprehensive secret redaction
  function redactConfigRecursively(obj, path = '') {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => redactConfigRecursively(item, `${path}[${index}]`));
    }
    
    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof obj[key] === 'string') {
        // Check if key name suggests it contains secrets
        if (/url|endpoint|connection|auth|credential|key|token|secret|password/i.test(key)) {
          if (key.toLowerCase().includes('url') || key.toLowerCase().includes('endpoint')) {
            // Apply URL redaction
            obj[key] = redactSecretsInUrl(obj[key]);
          } else {
            // Apply text redaction
            obj[key] = redactSecretsInText(obj[key]);
          }
        } else {
          // Apply general text redaction to catch any missed secrets
          const originalValue = obj[key];
          const redactedValue = redactSecretsInText(obj[key]);
          if (redactedValue !== originalValue) {
            obj[key] = redactedValue;
          }
        }
      } else if (typeof obj[key] === 'object') {
        obj[key] = redactConfigRecursively(obj[key], currentPath);
      }
    });
    
    return obj;
  }
  
  // Apply recursive redaction
  redactConfigRecursively(redactedConfig);
  
  const sanitized = redactedConfig;
  
  return Object.freeze({
    timestamp: new Date().toISOString(),
    environment: configManager.getEnvironment(),
    instanceId: rawConfig.system?.instanceId || 'unknown',
    configHash: `sha256:${configVersion}`,
    config_version: configVersion,  // Direct property for test compatibility
    sanitizedConfigHash: createStableConfigHash(sanitized),
    version: rawConfig.system?.version || 'unknown',
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    config: Object.freeze(sanitized)
  });
}

/**
 * Get RPC endpoints configuration for health monitoring
 * @returns {Array} Array of endpoint objects with name and url
 */
function getRpcEndpoints() {
  const endpoints = [];
  
  // Add Helius if configured
  if (process.env.HELIUS_RPC_URL) {
    endpoints.push({
      name: 'helius',
      url: process.env.HELIUS_RPC_URL
    });
  }
  
  // Add ChainStack if configured
  if (process.env.CHAINSTACK_RPC_URL) {
    endpoints.push({
      name: 'chainstack', 
      url: process.env.CHAINSTACK_RPC_URL
    });
  }
  
  // Always add public RPC as fallback
  endpoints.push({
    name: 'public',
    url: process.env.PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
  });
  
  return endpoints;
}

/**
 * Get health monitoring configuration
 * @returns {Object} Health monitor configuration object
 */
function getHealthConfig() {
  return {
    interval: parseInt(process.env.RPC_HEALTH_INTERVAL_MS) || 30000,
    jitter: parseInt(process.env.RPC_HEALTH_JITTER_MS) || 5000,
    probeTimeout: parseInt(process.env.RPC_HEALTH_PROBE_TIMEOUT_MS) || 1000,
    probeRpsLimit: parseInt(process.env.RPC_HEALTH_PROBE_RPS_LIMIT) || 2
  };
}

/**
 * Get rate limit budgets configuration
 * @returns {Map} Map of endpoint names to rate limit configurations
 */
function getRateLimitBudgets() {
  const budgets = new Map();
  
  // Default rate limits
  const defaultRpsLimit = parseInt(process.env.RPC_DEFAULT_RPS_LIMIT) || 50;
  const defaultConcurrency = parseInt(process.env.RPC_DEFAULT_CONCURRENCY_LIMIT) || 10;
  
  // Configure budgets for each endpoint
  if (process.env.HELIUS_RPC_URL) {
    budgets.set('helius', {
      rpsLimit: defaultRpsLimit,
      concurrencyLimit: defaultConcurrency,
      windowMs: parseInt(process.env.RPC_RATE_WINDOW_MS) || 1000
    });
  }
  
  if (process.env.CHAINSTACK_RPC_URL) {
    budgets.set('chainstack', {
      rpsLimit: defaultRpsLimit,
      concurrencyLimit: defaultConcurrency,
      windowMs: parseInt(process.env.RPC_RATE_WINDOW_MS) || 1000
    });
  }
  
  budgets.set('public', {
    rpsLimit: 10, // Lower limit for public RPC
    concurrencyLimit: 5,
    windowMs: parseInt(process.env.RPC_RATE_WINDOW_MS) || 1000
  });
  
  return budgets;
}

// Export function to generate snapshot lazily
/**
 * Get HTTP agent configuration with keep-alive settings
 * @returns {Object} HTTP agent configuration
 */
function getHttpAgentConfig() {
  return {
    keepAlive: {
      enabled: String(process.env.RPC_KEEP_ALIVE_ENABLED || 'true') !== 'false',
      // msecs is the TCP keep-alive probe interval; also expose freeSocketTimeout if needed
      msecs: parseInt(process.env.RPC_KEEP_ALIVE_TIMEOUT_MS, 10) || 60000,
      sockets: parseInt(process.env.RPC_KEEP_ALIVE_SOCKETS, 10) || 50,
      // Optional: freeSocketTimeout alignment
      freeSocketTimeout: parseInt(process.env.RPC_KEEP_ALIVE_TIMEOUT_MS, 10) || 60000,
    }
  };
}

export { 
  generateConfigSnapshot, 
  redactSecretsInUrl, 
  redactSecretsInText,
  getRpcEndpoints,
  getHealthConfig,
  getRateLimitBudgets,
  getHttpAgentConfig
};