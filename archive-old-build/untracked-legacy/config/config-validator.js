import { URL } from 'url';

export class ConfigurationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConfigurationError';
    this.details = details;
  }
}

export class ConfigValidator {
  static validateConfig() {
    const errors = [];
    
    // Enhanced placeholder detection
    this.checkPlaceholders(errors);
    
    // Required variables validation
    this.validateRequiredVars(errors);
    
    // URL format validation
    this.validateUrls(errors);
    
    // Type validation with robust parsing
    this.validateTypes(errors);
    
    // Range validation
    this.validateRanges(errors);
    
    // COMPLETE: All timing and logical relationships
    this.validateRelationships(errors);
    
    if (errors.length > 0) {
      throw new ConfigurationError('Configuration validation failed', { errors });
    }
    
    return this.buildValidatedConfig();
  }
  
  static checkPlaceholders(errors) {
    const envVars = [
      'HELIUS_RPC_URL',
      'CHAINSTACK_RPC_URL', 
      'PUBLIC_RPC_URL'
    ];
    
    envVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        try {
          const url = new URL(value);
          
          // Enhanced query parameter placeholder detection
          if (url.search) {
            const queryPlaceholders = [
              /\$\{[^}]*\}/g,           // ${VAR}
              /<[A-Z_]+>/g,             // <YOUR_KEY>
              /your[-_]?key/ig,         // your_key, your-key, yourkey
              /api[-_]?key[-_]?here/ig, // api_key_here, api-key-here
              /\[YOUR[^\]]*\]/ig,       // [YOUR_KEY_HERE]
              /\{[A-Z_]+\}/g,           // {API_KEY}
              /INSERT[-_]?[A-Z_]+/ig    // INSERT_KEY, INSERT_TOKEN
            ];
            
            queryPlaceholders.forEach(pattern => {
              if (pattern.test(url.search)) {
                errors.push(`${varName} query contains placeholder pattern: ${url.search}`);
              }
            });
          }
          
          // Enhanced path segment placeholder detection
          const pathSegments = url.pathname.split('/').filter(Boolean);
          pathSegments.forEach((segment, index) => {
            const pathPlaceholders = [
              /^[A-Z0-9_]{20,}$/,        // Long ALLCAPS (likely API key)
              /^[a-f0-9]{32,}$/,         // Hex string (likely key)
              /YOUR[-_]?[A-Z_]+/i,       // YOUR_SOMETHING
              /<[A-Z_]+>/,               // <PLACEHOLDER>
              /\$\{[^}]*\}/,             // ${VAR}
              /\{[A-Z_]+\}/,             // {API_KEY}
              /INSERT[-_]?[A-Z_]+/i,     // INSERT_KEY
              /REPLACE[-_]?[A-Z_]+/i,    // REPLACE_KEY
              /ADD[-_]?[A-Z_]+/i         // ADD_KEY
            ];
            
            // Only flag if it looks like a key AND contains key-related context
            const hasKeyContext = /key|token|auth|secret|api|access/i.test(segment);
            const isLastSegment = index === pathSegments.length - 1;
            
            pathPlaceholders.forEach(pattern => {
              if (pattern.test(segment) && (hasKeyContext || isLastSegment)) {
                errors.push(`${varName} path segment contains placeholder: ${segment}`);
              }
            });
          });
          
        } catch (urlError) {
          // If URL parsing fails, check raw value for obvious placeholders
          const rawPlaceholders = [
            /\$\{[^}]*\}/,
            /<[A-Z_]+>/,
            /YOUR[-_]?[A-Z_]+/i,
            /\{[A-Z_]+\}/,
            /INSERT[-_]?[A-Z_]+/i
          ];
          
          rawPlaceholders.forEach(pattern => {
            if (pattern.test(value)) {
              errors.push(`${varName} contains placeholder pattern: ${value}`);
            }
          });
        }
      }
    });
  }
  
  static validateRequiredVars(errors) {
    const required = [
      'HELIUS_RPC_URL',
      'CHAINSTACK_RPC_URL',
      'PUBLIC_RPC_URL',
      'RPC_DEFAULT_RPS_LIMIT',
      'RPC_DEFAULT_CONCURRENCY_LIMIT',
      'RPC_DEFAULT_TIMEOUT_MS',
      'RPC_QUEUE_DEADLINE_MS'
    ];
    
    const requiredBooleans = [
      'RPC_BREAKER_ENABLED',
      'RPC_HEDGING_ENABLED',
      'RPC_KEEP_ALIVE_ENABLED'
    ];
    
    required.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`${varName} is required`);
      }
    });
    
    requiredBooleans.forEach(varName => {
      if (process.env[varName] === undefined) {
        errors.push(`${varName} is required (must be 'true' or 'false')`);
      }
    });
  }
  
  static validateUrls(errors) {
    const urlVars = [
      'HELIUS_RPC_URL',
      'CHAINSTACK_RPC_URL', 
      'PUBLIC_RPC_URL'
    ];
    
    urlVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol)) {
            errors.push(`${varName} must use http or https protocol`);
          }
          
          // Additional URL validation
          if (!url.hostname) {
            errors.push(`${varName} must have a valid hostname`);
          }
          
          // Validate common RPC endpoint patterns
          if (varName.includes('HELIUS') && !url.hostname.includes('helius')) {
            errors.push(`${varName} hostname should contain 'helius' for Helius RPC`);
          }
          
          if (varName.includes('CHAINSTACK') && !url.hostname.includes('chainstack')) {
            errors.push(`${varName} hostname should contain 'chainstack' for ChainStack RPC`);
          }
          
        } catch (error) {
          errors.push(`${varName} is not a valid URL: ${value}`);
        }
      }
    });
  }
  
  static validateTypes(errors) {
    const numericVars = [
      'RPC_DEFAULT_RPS_LIMIT',
      'RPC_DEFAULT_CONCURRENCY_LIMIT',
      'RPC_DEFAULT_TIMEOUT_MS',
      'RPC_RATE_WINDOW_MS',
      'RPC_MAX_IN_FLIGHT_GLOBAL',
      'RPC_QUEUE_MAX_SIZE',
      'RPC_QUEUE_DEADLINE_MS',
      'RPC_BREAKER_FAILURE_THRESHOLD',
      'RPC_BREAKER_COOLDOWN_MS',
      'RPC_HEDGING_DELAY_MS',
      'RPC_KEEP_ALIVE_SOCKETS',
      'RPC_KEEP_ALIVE_MSECS',
      'RPC_HEALTH_INTERVAL_MS',
      'RPC_HEALTH_JITTER_MS',
      'RPC_HEALTH_PROBE_TIMEOUT_MS',
      'RPC_HEALTH_PROBE_RPS_LIMIT'
    ];
    
    numericVars.forEach(varName => {
      const value = process.env[varName];
      if (value !== undefined) {
        const trimmed = value.trim();
        
        // Handle leading zeros and whitespace properly
        if (!/^\d+$/.test(trimmed)) {
          errors.push(`${varName} must be a positive integer: "${value}"`);
          return;
        }
        
        const parsed = parseInt(trimmed, 10);
        
        if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0) {
          errors.push(`${varName} must be a non-negative integer: "${value}"`);
        }
        
        // Additional numeric validation
        if (parsed > Number.MAX_SAFE_INTEGER) {
          errors.push(`${varName} exceeds maximum safe integer: ${parsed}`);
        }
      }
    });
    
    const booleanVars = [
      'RPC_BREAKER_ENABLED',
      'RPC_HEDGING_ENABLED',
      'RPC_KEEP_ALIVE_ENABLED',
      'ALPHA_SNIFF_ENABLED',
      'TRADING_ENABLED'
    ];
    
    booleanVars.forEach(varName => {
      const value = process.env[varName];
      if (value !== undefined) {
        // Strict boolean validation - only 'true' or 'false' allowed
        if (!['true', 'false'].includes(value)) {
          errors.push(`${varName} must be exactly 'true' or 'false': "${value}"`);
        }
      }
    });
  }
  
  static validateRanges(errors) {
    const ranges = {
      'RPC_DEFAULT_TIMEOUT_MS': { min: 100, max: 30000 },
      'RPC_DEFAULT_RPS_LIMIT': { min: 1, max: 1000 },
      'RPC_DEFAULT_CONCURRENCY_LIMIT': { min: 1, max: 100 },
      'RPC_QUEUE_MAX_SIZE': { min: 10, max: 10000 },
      'RPC_QUEUE_DEADLINE_MS': { min: 1000, max: 60000 },
      'RPC_BREAKER_FAILURE_THRESHOLD': { min: 1, max: 50 },
      'RPC_BREAKER_COOLDOWN_MS': { min: 1000, max: 300000 },
      'RPC_HEDGING_DELAY_MS': { min: 50, max: 5000 },
      'RPC_KEEP_ALIVE_SOCKETS': { min: 1, max: 200 },
      'RPC_KEEP_ALIVE_MSECS': { min: 1000, max: 300000 },
      'RPC_HEALTH_INTERVAL_MS': { min: 5000, max: 300000 },
      'RPC_HEALTH_JITTER_MS': { min: 0, max: 30000 },
      'RPC_HEALTH_PROBE_TIMEOUT_MS': { min: 100, max: 10000 },
      'RPC_HEALTH_PROBE_RPS_LIMIT': { min: 1, max: 100 },
      'RPC_RATE_WINDOW_MS': { min: 100, max: 10000 },
      'RPC_MAX_IN_FLIGHT_GLOBAL': { min: 10, max: 10000 }
    };
    
    Object.entries(ranges).forEach(([varName, range]) => {
      const value = parseInt(process.env[varName]?.trim(), 10);
      if (!isNaN(value)) {
        if (value < range.min || value > range.max) {
          errors.push(`${varName} must be between ${range.min} and ${range.max}: ${value}`);
        }
      }
    });
    
    // Special zero value validation
    const noZeroVars = [
      'RPC_DEFAULT_TIMEOUT_MS',
      'RPC_BREAKER_FAILURE_THRESHOLD',
      'RPC_QUEUE_DEADLINE_MS',
      'RPC_DEFAULT_RPS_LIMIT',
      'RPC_DEFAULT_CONCURRENCY_LIMIT'
    ];
    
    noZeroVars.forEach(varName => {
      const value = parseInt(process.env[varName]?.trim(), 10);
      if (value === 0) {
        errors.push(`${varName} cannot be zero`);
      }
    });
  }
  
  static validateRelationships(errors) {
    // Parse all timing values
    const rpsLimit = parseInt(process.env.RPC_DEFAULT_RPS_LIMIT?.trim(), 10);
    const timeoutMs = parseInt(process.env.RPC_DEFAULT_TIMEOUT_MS?.trim(), 10);
    const queueDeadlineMs = parseInt(process.env.RPC_QUEUE_DEADLINE_MS?.trim(), 10);
    const maxInFlight = parseInt(process.env.RPC_MAX_IN_FLIGHT_GLOBAL?.trim(), 10);
    const healthProbeRps = parseInt(process.env.RPC_HEALTH_PROBE_RPS_LIMIT?.trim() || '2', 10);
    const breakerCooldown = parseInt(process.env.RPC_BREAKER_COOLDOWN_MS?.trim(), 10);
    const probeTimeout = parseInt(process.env.RPC_HEALTH_PROBE_TIMEOUT_MS?.trim() || '1000', 10);
    const healthInterval = parseInt(process.env.RPC_HEALTH_INTERVAL_MS?.trim() || '30000', 10);
    const healthJitter = parseInt(process.env.RPC_HEALTH_JITTER_MS?.trim() || '5000', 10);
    const hedgingDelay = parseInt(process.env.RPC_HEDGING_DELAY_MS?.trim(), 10);
    const rateWindow = parseInt(process.env.RPC_RATE_WINDOW_MS?.trim() || '1000', 10);
    
    // CRITICAL RELATIONSHIP 1: RPC timeout < queue deadline
    // Prevents requests from outliving queue, avoiding classic stall
    if (!isNaN(timeoutMs) && !isNaN(queueDeadlineMs)) {
      if (timeoutMs >= queueDeadlineMs) {
        errors.push(`Request timeout (${timeoutMs}ms) must be < queue deadline (${queueDeadlineMs}ms) to prevent request stalls`);
      }
    }
    
    // CRITICAL RELATIONSHIP 2: Health jitter ≤ interval
    // Prevents monolithic gaps in probing
    if (!isNaN(healthInterval) && !isNaN(healthJitter)) {
      if (healthJitter > healthInterval) {
        errors.push(`Health jitter (${healthJitter}ms) must be ≤ interval (${healthInterval}ms) to prevent probe gaps`);
      }
    }
    
    // CRITICAL RELATIONSHIP 3: Health probe timeout < interval
    // Prevents long-running sockets
    if (!isNaN(healthInterval) && !isNaN(probeTimeout)) {
      if (probeTimeout >= healthInterval) {
        errors.push(`Health probe timeout (${probeTimeout}ms) must be < interval (${healthInterval}ms) to prevent socket overlap`);
      }
    }
    
    // CRITICAL RELATIONSHIP 4: RPS × timeout ≤ max-in-flight
    // Prevents resource exhaustion
    if (!isNaN(rpsLimit) && !isNaN(timeoutMs) && !isNaN(maxInFlight)) {
      const estimatedInFlight = rpsLimit * (timeoutMs / 1000);
      if (estimatedInFlight > maxInFlight) {
        errors.push(`RPS (${rpsLimit}) × timeout (${timeoutMs}ms) = ${estimatedInFlight.toFixed(0)} requests exceeds max in-flight (${maxInFlight})`);
      }
    }
    
    // RELATIONSHIP 5: Health probe RPS ≤ global RPS
    // Prevents health probes from consuming all RPC quota
    if (!isNaN(healthProbeRps) && !isNaN(rpsLimit)) {
      if (healthProbeRps > rpsLimit) {
        errors.push(`Health probe RPS (${healthProbeRps}) exceeds global RPS limit (${rpsLimit})`);
      }
    }
    
    // RELATIONSHIP 6: Circuit breaker cooldown ≥ probe timeout
    // Ensures breaker doesn't trip during normal probe operations
    if (!isNaN(breakerCooldown) && !isNaN(probeTimeout)) {
      if (breakerCooldown < probeTimeout) {
        errors.push(`Breaker cooldown (${breakerCooldown}ms) must be ≥ probe timeout (${probeTimeout}ms)`);
      }
    }
    
    // RELATIONSHIP 7: Hedging consistency
    // Prevents configuration where hedging delay is set but hedging is disabled
    const hedgingEnabled = process.env.RPC_HEDGING_ENABLED === 'true';
    if (!hedgingEnabled && !isNaN(hedgingDelay) && hedgingDelay > 0) {
      errors.push(`Hedging delay (${hedgingDelay}ms) set but RPC_HEDGING_ENABLED=false`);
    }
    
    // RELATIONSHIP 8: Rate window sanity
    // Ensures rate limiting window is reasonable
    if (!isNaN(rateWindow) && !isNaN(timeoutMs)) {
      if (rateWindow > timeoutMs) {
        errors.push(`Rate window (${rateWindow}ms) should not exceed request timeout (${timeoutMs}ms)`);
      }
    }
    
    // RELATIONSHIP 9: Health probe timeout vs request timeout
    // Health probes should not have longer timeouts than regular requests
    if (!isNaN(probeTimeout) && !isNaN(timeoutMs)) {
      if (probeTimeout > timeoutMs) {
        errors.push(`Health probe timeout (${probeTimeout}ms) should not exceed request timeout (${timeoutMs}ms)`);
      }
    }
    
    // RELATIONSHIP 10: Breaker threshold vs RPS
    // Breaker should trip before exhausting all concurrent connections
    if (!isNaN(rpsLimit) && !isNaN(timeoutMs)) {
      const breakerThreshold = parseInt(process.env.RPC_BREAKER_FAILURE_THRESHOLD?.trim(), 10);
      if (!isNaN(breakerThreshold)) {
        const maxFailuresPerSecond = rpsLimit;
        if (breakerThreshold > maxFailuresPerSecond * 2) {
          errors.push(`Breaker threshold (${breakerThreshold}) too high for RPS (${rpsLimit}) - may not trip in time`);
        }
      }
    }
  }
  
  static buildValidatedConfig() {
    const getEnvInt = (name, defaultValue) => {
      const value = process.env[name]?.trim();
      return value ? parseInt(value, 10) : defaultValue;
    };
    
    const getBool = (name, defaultValue = false) => {
      const value = process.env[name];
      return value === 'true' ? true : value === 'false' ? false : defaultValue;
    };
    
    return {
      endpoints: {
        helius: {
          url: process.env.HELIUS_RPC_URL,
          weight: getEnvInt('HELIUS_WEIGHT', 60),
          rps: getEnvInt('HELIUS_RPS_LIMIT', getEnvInt('RPC_DEFAULT_RPS_LIMIT', 50)),
          concurrency: getEnvInt('HELIUS_CONCURRENCY_LIMIT', getEnvInt('RPC_DEFAULT_CONCURRENCY_LIMIT', 10)),
          timeout: getEnvInt('HELIUS_TIMEOUT_MS', getEnvInt('RPC_DEFAULT_TIMEOUT_MS', 2000))
        },
        chainstack: {
          url: process.env.CHAINSTACK_RPC_URL,
          weight: getEnvInt('CHAINSTACK_WEIGHT', 30),
          rps: getEnvInt('CHAINSTACK_RPS_LIMIT', Math.floor(getEnvInt('RPC_DEFAULT_RPS_LIMIT', 50) * 0.8)),
          concurrency: getEnvInt('CHAINSTACK_CONCURRENCY_LIMIT', getEnvInt('RPC_DEFAULT_CONCURRENCY_LIMIT', 10)),
          timeout: getEnvInt('CHAINSTACK_TIMEOUT_MS', getEnvInt('RPC_DEFAULT_TIMEOUT_MS', 2000) + 500)
        },
        public: {
          url: process.env.PUBLIC_RPC_URL,
          weight: getEnvInt('PUBLIC_WEIGHT', 10),
          rps: getEnvInt('PUBLIC_RPS_LIMIT', Math.floor(getEnvInt('RPC_DEFAULT_RPS_LIMIT', 50) * 0.2)),
          concurrency: getEnvInt('PUBLIC_CONCURRENCY_LIMIT', Math.floor(getEnvInt('RPC_DEFAULT_CONCURRENCY_LIMIT', 10) * 0.5)),
          timeout: getEnvInt('PUBLIC_TIMEOUT_MS', getEnvInt('RPC_DEFAULT_TIMEOUT_MS', 2000) * 2)
        }
      },
      breaker: {
        enabled: getBool('RPC_BREAKER_ENABLED', true),
        threshold: getEnvInt('RPC_BREAKER_FAILURE_THRESHOLD', 5),
        cooldown: getEnvInt('RPC_BREAKER_COOLDOWN_MS', 60000)
      },
      hedging: {
        enabled: getBool('RPC_HEDGING_ENABLED', true),
        delay: getEnvInt('RPC_HEDGING_DELAY_MS', 200),
        maxExtra: getEnvInt('RPC_HEDGING_MAX_EXTRA', 1)
      },
      queue: {
        maxSize: getEnvInt('RPC_QUEUE_MAX_SIZE', 1000),
        deadline: getEnvInt('RPC_QUEUE_DEADLINE_MS', 5000)
      },
      keepAlive: {
        enabled: getBool('RPC_KEEP_ALIVE_ENABLED', true),
        sockets: getEnvInt('RPC_KEEP_ALIVE_SOCKETS', 50),
        msecs: getEnvInt('RPC_KEEP_ALIVE_MSECS', 30000)
      },
      health: {
        interval: getEnvInt('RPC_HEALTH_INTERVAL_MS', 30000),
        jitter: getEnvInt('RPC_HEALTH_JITTER_MS', 5000),
        probeTimeout: getEnvInt('RPC_HEALTH_PROBE_TIMEOUT_MS', 1000),
        probeRpsLimit: getEnvInt('RPC_HEALTH_PROBE_RPS_LIMIT', 2)
      },
      rateWindow: getEnvInt('RPC_RATE_WINDOW_MS', 1000),
      maxInFlight: getEnvInt('RPC_MAX_IN_FLIGHT_GLOBAL', 200)
    };
  }
}