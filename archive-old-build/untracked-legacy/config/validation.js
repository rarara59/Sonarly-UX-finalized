/**
 * Configuration Validation System
 * Ensures all required environment variables and settings are properly configured
 */

import os from 'os';

export class EnvironmentValidator {
  constructor() {
    // Required variables for all environments
    this.requiredVars = [
      'NODE_ENV',
      'LOG_LEVEL',
      'INSTANCE_ID'
    ];
    
    // Production-specific required variables
    this.productionRequiredVars = [
      'SESSION_SECRET',
      'API_RATE_LIMIT',
      'CORS_ORIGIN',
      'HEALTH_CHECK_PORT',
      'SSL_CERT_PATH',
      'SSL_KEY_PATH',
      'MAX_POSITION_SIZE',
      'MAX_DAILY_LOSS'
    ];
    
    // Trading-specific required variables
    this.tradingRequiredVars = [
      'TRADING_MODE',
      'ENABLE_PAPER_TRADING',
      'RPC_ENDPOINT',
      'WEBSOCKET_ENDPOINT'
    ];
    
    // Optional but recommended variables
    this.recommendedVars = [
      'WORKER_PROCESSES',
      'CONNECTION_POOL_SIZE',
      'CACHE_TTL',
      'DB_POOL_MAX',
      'CLUSTER_WORKERS'
    ];
    
    // Variable constraints
    this.constraints = {
      NODE_ENV: {
        valid: ['development', 'testing', 'staging', 'production'],
        type: 'string'
      },
      LOG_LEVEL: {
        valid: ['error', 'warn', 'info', 'debug', 'trace'],
        type: 'string'
      },
      API_RATE_LIMIT: {
        min: 10,
        max: 10000,
        type: 'number'
      },
      WORKER_PROCESSES: {
        min: 1,
        max: 16,
        type: 'number'
      },
      CONNECTION_POOL_SIZE: {
        min: 1,
        max: 100,
        type: 'number'
      },
      CACHE_TTL: {
        min: 0,
        max: 86400, // 24 hours
        type: 'number'
      },
      MAX_POSITION_SIZE: {
        min: 0.001,
        max: 1000000,
        type: 'number'
      },
      MAX_DAILY_LOSS: {
        min: 0.01,
        max: 1.0,
        type: 'number'
      }
    };
  }
  
  /**
   * Validate environment configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Check NODE_ENV first
    if (!process.env.NODE_ENV) {
      errors.push('NODE_ENV is not set. Defaulting to development mode.');
      process.env.NODE_ENV = 'development';
    }
    
    // Validate required variables
    this.validateRequiredVars(errors);
    
    // Validate production-specific variables
    if (isProduction) {
      this.validateProductionVars(errors);
    }
    
    // Validate trading variables if trading is enabled
    if (process.env.ENABLE_TRADING !== 'false') {
      this.validateTradingVars(errors);
    }
    
    // Validate RPC endpoints (required for system operation)
    this.validateRpcEndpoints(errors);
    
    // Check recommended variables
    this.checkRecommendedVars(warnings);
    
    // Validate constraints
    this.validateConstraints(errors);
    
    // Validate timing relationships
    this.validateTimingRelationships(errors);
    
    // Validate file paths
    this.validateFilePaths(errors, isProduction);
    
    // Security validations
    this.validateSecurity(errors, warnings, isProduction);
    
    // Performance validations
    this.validatePerformance(warnings);
    
    // Report results
    this.reportValidationResults(errors, warnings);
    
    // Throw if critical errors
    if (errors.length > 0 && isProduction) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      environment: process.env.NODE_ENV
    };
  }
  
  /**
   * Validate required variables
   */
  validateRequiredVars(errors) {
    this.requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    });
  }
  
  /**
   * Validate production-specific variables
   */
  validateProductionVars(errors) {
    this.productionRequiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required production variable: ${varName}`);
      }
    });
    
    // Special validation for SESSION_SECRET
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters long');
    }
    
    // Validate CORS_ORIGIN format
    if (process.env.CORS_ORIGIN) {
      const origins = process.env.CORS_ORIGIN.split(',');
      origins.forEach(origin => {
        if (!this.isValidUrl(origin.trim())) {
          errors.push(`Invalid CORS_ORIGIN URL: ${origin}`);
        }
      });
    }
  }
  
  /**
   * Validate trading-specific variables
   */
  validateTradingVars(errors) {
    this.tradingRequiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required trading variable: ${varName}`);
      }
    });
    
    // Validate RPC endpoint
    if (process.env.RPC_ENDPOINT && !this.isValidUrl(process.env.RPC_ENDPOINT)) {
      errors.push('Invalid RPC_ENDPOINT URL');
    }
    
    // Validate WebSocket endpoint
    if (process.env.WEBSOCKET_ENDPOINT && !this.isValidWebSocketUrl(process.env.WEBSOCKET_ENDPOINT)) {
      errors.push('Invalid WEBSOCKET_ENDPOINT URL');
    }
  }
  
  /**
   * Validate RPC endpoints - at least one must be configured
   */
  validateRpcEndpoints(errors) {
    // Check for at least one valid RPC endpoint
    const rpcEndpoints = [
      'HELIUS_RPC_URL',
      'CHAINSTACK_RPC_URL',
      'PUBLIC_RPC_URL',
      'RPC_ENDPOINT'
    ];
    
    let hasValidEndpoint = false;
    const missingEndpoints = [];
    
    for (const endpoint of rpcEndpoints) {
      const url = process.env[endpoint];
      // Check if URL exists and is not empty
      if (!url || !url.trim()) {
        missingEndpoints.push(endpoint);
        continue;
      }
      
      // Check if it's not a placeholder or invalid value
      if (url !== 'undefined' && url !== 'null' && 
          !url.includes('YOUR_') && !url.includes('test_key_') && 
          !url.includes('<') && !url.includes('${')) {
        hasValidEndpoint = true;
        break;
      }
    }
    
    // In testing mode, allow test keys but still require at least one endpoint
    if (!hasValidEndpoint && process.env.NODE_ENV === 'testing') {
      for (const endpoint of rpcEndpoints) {
        const url = process.env[endpoint];
        // Allow test keys in testing mode
        if (url && url.trim() && url !== 'undefined' && url !== 'null') {
          // Even with test_key_, it's still a valid endpoint for testing
          if (url.includes('test_key_') || url.includes('test-')) {
            hasValidEndpoint = true;
            break;
          }
        }
      }
    }
    
    // Debug logging
    if (process.env.DEBUG_VALIDATION) {
      console.log('RPC Validation Debug:');
      console.log('  hasValidEndpoint:', hasValidEndpoint);
      console.log('  missingEndpoints:', missingEndpoints);
      console.log('  NODE_ENV:', process.env.NODE_ENV);
    }
    
    if (!hasValidEndpoint) {
      errors.push(`Missing required RPC endpoints. At least one of the following must be configured: ${rpcEndpoints.join(', ')}`);
      if (missingEndpoints.includes('HELIUS_RPC_URL')) {
        errors.push('HELIUS_RPC_URL is not configured');
      }
    }
  }
  
  /**
   * Check recommended variables
   */
  checkRecommendedVars(warnings) {
    this.recommendedVars.forEach(varName => {
      if (!process.env[varName]) {
        warnings.push(`Recommended environment variable not set: ${varName}`);
      }
    });
  }
  
  /**
   * Validate variable constraints
   */
  validateConstraints(errors) {
    Object.entries(this.constraints).forEach(([varName, constraint]) => {
      const value = process.env[varName];
      if (!value) return;
      
      // Type validation
      if (constraint.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`${varName} must be a number, got: ${value}`);
          return;
        }
        
        // Range validation
        if (constraint.min !== undefined && numValue < constraint.min) {
          errors.push(`${varName} must be >= ${constraint.min}, got: ${numValue}`);
        }
        if (constraint.max !== undefined && numValue > constraint.max) {
          errors.push(`${varName} must be <= ${constraint.max}, got: ${numValue}`);
        }
      }
      
      // Enum validation
      if (constraint.valid && !constraint.valid.includes(value)) {
        errors.push(`${varName} must be one of: ${constraint.valid.join(', ')}, got: ${value}`);
      }
    });
  }
  
  /**
   * Validate timing relationships between configuration values
   */
  validateTimingRelationships(errors) {
    // Health monitoring timing relationships
    const healthInterval = parseInt(process.env.RPC_HEALTH_INTERVAL_MS, 10) || 30000;
    const healthJitter = parseInt(process.env.RPC_HEALTH_JITTER_MS, 10) || 0;
    const healthProbeTimeout = parseInt(process.env.RPC_HEALTH_PROBE_TIMEOUT_MS, 10) || 5000;
    
    // Validate health timing relationships
    if (healthJitter > healthInterval) {
      errors.push(`RPC_HEALTH_JITTER_MS (${healthJitter}ms) must be ≤ RPC_HEALTH_INTERVAL_MS (${healthInterval}ms)`);
    }
    if (healthProbeTimeout >= healthInterval) {
      errors.push(`RPC_HEALTH_PROBE_TIMEOUT_MS (${healthProbeTimeout}ms) must be < RPC_HEALTH_INTERVAL_MS (${healthInterval}ms)`);
    }
    
    // Request/Queue timing relationships
    const requestTimeout = parseInt(process.env.RPC_DEFAULT_TIMEOUT_MS, 10) || 5000;
    const queueDeadline = parseInt(process.env.RPC_QUEUE_DEADLINE_MS, 10) || 10000;
    
    if (requestTimeout >= queueDeadline) {
      errors.push(`RPC_DEFAULT_TIMEOUT_MS (${requestTimeout}ms) must be < RPC_QUEUE_DEADLINE_MS (${queueDeadline}ms)`);
    }
    
    // Keep-alive configuration validation
    const keepAliveEnabled = process.env.RPC_KEEP_ALIVE_ENABLED !== 'false';
    const keepAliveSockets = parseInt(process.env.RPC_KEEP_ALIVE_SOCKETS, 10) || 50;
    const keepAliveTimeout = parseInt(process.env.RPC_KEEP_ALIVE_TIMEOUT_MS, 10) || 60000;
    
    if (keepAliveEnabled) {
      if (keepAliveSockets < 1 || keepAliveSockets > 1000) {
        errors.push(`RPC_KEEP_ALIVE_SOCKETS must be between 1 and 1000, got: ${keepAliveSockets}`);
      }
      if (keepAliveTimeout < 1000 || keepAliveTimeout > 5 * 60 * 1000) {
        errors.push(`RPC_KEEP_ALIVE_TIMEOUT_MS must be between 1000ms and 5 minutes, got: ${keepAliveTimeout}ms`);
      }
    }
    
    // Circuit breaker timing
    const breakerCooldown = parseInt(process.env.RPC_BREAKER_COOLDOWN_MS, 10) || 30000;
    if (breakerCooldown < requestTimeout) {
      errors.push(`RPC_BREAKER_COOLDOWN_MS (${breakerCooldown}ms) should be >= RPC_DEFAULT_TIMEOUT_MS (${requestTimeout}ms)`);
    }
  }
  
  /**
   * Validate file paths
   */
  validateFilePaths(errors, isProduction) {
    const pathVars = ['SSL_CERT_PATH', 'SSL_KEY_PATH', 'LOG_PATH'];
    
    pathVars.forEach(varName => {
      const path = process.env[varName];
      if (!path) return;
      
      // In production, these paths should exist or be writable
      if (isProduction && (varName === 'SSL_CERT_PATH' || varName === 'SSL_KEY_PATH')) {
        // Note: Actual file existence check would require fs module
        if (!path.startsWith('/')) {
          errors.push(`${varName} should be an absolute path in production`);
        }
      }
    });
  }
  
  /**
   * Validate security settings
   */
  validateSecurity(errors, warnings, isProduction) {
    if (isProduction) {
      // Check for default or weak secrets
      const secretVars = ['SESSION_SECRET', 'JWT_SECRET', 'ENCRYPTION_KEY'];
      const weakSecrets = ['secret', 'password', 'changeme', 'default'];
      
      secretVars.forEach(varName => {
        const value = process.env[varName];
        if (value && weakSecrets.some(weak => value.toLowerCase().includes(weak))) {
          errors.push(`${varName} appears to be a weak or default value`);
        }
      });
      
      // Ensure HTTPS in production
      if (process.env.ENABLE_SSL !== 'true' && !process.env.SSL_CERT_PATH) {
        warnings.push('SSL/HTTPS should be enabled in production');
      }
    }
  }
  
  /**
   * Validate performance settings
   */
  validatePerformance(warnings) {
    // Check worker process count
    const workers = parseInt(process.env.WORKER_PROCESSES);
    const cpuCount = os.cpus().length;
    
    if (workers && workers > cpuCount * 2) {
      warnings.push(`WORKER_PROCESSES (${workers}) is more than 2x CPU count (${cpuCount})`);
    }
    
    // Check memory settings
    const maxOldSpace = process.env.NODE_OPTIONS?.match(/--max-old-space-size=(\d+)/)?.[1];
    if (maxOldSpace && parseInt(maxOldSpace) < 1024) {
      warnings.push('Consider increasing --max-old-space-size for production workloads');
    }
  }
  
  /**
   * Report validation results
   */
  reportValidationResults(errors, warnings) {
    console.log('\n========================================');
    console.log('Environment Configuration Validation');
    console.log('========================================');
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Configuration validation passed!');
    } else {
      if (errors.length > 0) {
        console.log(`❌ Errors (${errors.length}):`);
        errors.forEach(error => console.log(`   - ${error}`));
        console.log('');
      }
      
      if (warnings.length > 0) {
        console.log(`⚠️  Warnings (${warnings.length}):`);
        warnings.forEach(warning => console.log(`   - ${warning}`));
        console.log('');
      }
    }
    
    console.log('========================================\n');
  }
  
  /**
   * Check if URL is valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if WebSocket URL is valid
   */
  isValidWebSocketUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const environmentValidator = new EnvironmentValidator();
export default environmentValidator;