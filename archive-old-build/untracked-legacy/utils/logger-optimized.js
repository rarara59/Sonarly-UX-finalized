import pino from 'pino';
import { randomUUID } from 'crypto';

// Create a simpler, faster pino instance without heavy formatters
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Remove slow formatters and serializers for speed
  // Use default fast JSON output
});

// Endpoint aliasing for security
const ENDPOINT_ALIASES = {
  'https://mainnet.helius-rpc.com': 'helius',
  'https://solana-mainnet.chainstacklabs.com': 'chainstack',
  'https://api.mainnet-beta.solana.com': 'public'
};

export function getEndpointAlias(url) {
  if (!url) return 'unknown';
  for (const [baseUrl, alias] of Object.entries(ENDPOINT_ALIASES)) {
    if (url.startsWith(baseUrl)) return alias;
  }
  return 'unknown';
}

export const generateRequestId = () => randomUUID();

// Request ID counter for more compact IDs when needed
let requestIdCounter = 0;
const REQUEST_ID_MAX = 1000000;

export function generateCompactRequestId() {
  requestIdCounter = (requestIdCounter + 1) % REQUEST_ID_MAX;
  const timestamp = Date.now().toString(36);
  const counter = requestIdCounter.toString(36).padStart(4, '0');
  return `req_${timestamp}_${counter}`;
}

export function logRpcOperation(requestId, endpoint, operation, startTime, outcome, error = null) {
  const latencyMs = Date.now() - startTime;
  
  const logData = {
    request_id: requestId,
    endpoint: endpoint,
    operation: operation,
    latency_ms: latencyMs,
    outcome: outcome
  };
  
  if (error) {
    // Apply secret redaction to error messages
    logData.error = redactSecretsInText(error?.message || 'Unknown error');
    logData.error_type = error?.constructor?.name || 'Error';
    
    if (process.env.RPC_ERROR_STACKS === 'true') {
      logData.error_stack = redactSecretsInText(error?.stack || 'No stack available');
    }
  }
  
  // Apply final redaction pass to entire log data
  const redactedLogData = redactLogData(logData);
  
  switch (outcome) {
    case 'ok':
      logger.info('RPC operation completed', redactedLogData);
      break;
    case 'timeout':
    case 'rate_limited':
      logger.warn('RPC operation degraded', redactedLogData);
      break;
    case 'breaker_open':
    case 'error':
      logger.error('RPC operation failed', redactedLogData);
      break;
    default:
      logger.warn('RPC operation unknown outcome', redactedLogData);
  }
}

export function logConfigSnapshot(snapshot) {
  const logData = {
    config_version: snapshot.config_version || snapshot.configHash,
    loaded_at: snapshot.timestamp,
    endpoints_count: snapshot.config?.rpc?.endpoints ? Object.keys(snapshot.config.rpc.endpoints).length : 0,
    breaker_enabled: snapshot.config?.rpc?.circuitBreaker?.enabled,
    hedging_enabled: snapshot.config?.rpc?.hedging?.enabled,
    keep_alive_enabled: snapshot.config?.network?.keepAlive?.enabled,
    health_interval_ms: snapshot.config?.rpc?.healthCheckInterval,
    config_snapshot: snapshot.config
  };
  
  // Apply comprehensive secret redaction
  const redactedLogData = redactLogData(logData);
  
  logger.info('Configuration loaded', redactedLogData);
}

// FIXED ISSUE 5: Accurate keep-alive logging with correct field names
export function logKeepAliveConfig(agentConfig) {
  logger.info('HTTP agent configured', {
    keep_alive: {
      enabled: agentConfig.keepAlive,
      max_sockets: agentConfig.maxSockets,
      max_free_sockets: agentConfig.maxFreeSockets,
      keep_alive_msecs: agentConfig.keepAliveMsecs,  // FIXED - correct field name
      agent_type: agentConfig.protocol === 'https:' ? 'https' : 'http'
    }
  });
}

// ADD THIS NEW FUNCTION for connection monitoring:
export function logConnectionStats(endpoint, stats) {
  logger.debug('Connection statistics', {
    endpoint: endpoint,
    socket_reuse: stats.connection_reuse_evidence,
    avg_request_time_ms: stats.avg_time_per_request,
    successful_requests: stats.successful_requests,
    total_requests: stats.total_requests,
    agent_max_sockets: stats.agent_stats.max_sockets,
    keep_alive_enabled: stats.agent_stats.keep_alive_enabled
  });
}

export function logHealthProbe(endpoint, startTime, outcome, error = null) {
  const latencyMs = Date.now() - startTime;
  
  const logData = {
    message: 'Health probe completed',
    endpoint: endpoint,
    latency_ms: latencyMs,
    outcome: outcome,
    probe_time: new Date().toISOString()
  };
  
  if (error) {
    logData.error = error?.message || 'Health check failed';
  }
  
  if (outcome === 'ok') {
    logger.debug('Health probe completed', logData);
  } else {
    logger.warn('Health probe failed', logData);
  }
}

// ADD THESE ENHANCED SECRET-SAFE LOGGING FUNCTIONS

/**
 * Redact secrets from any log data before output
 * @param {any} data - Data to redact secrets from
 * @returns {any} Data with secrets redacted
 */
function redactLogData(data) {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    return redactSecretsInText(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => redactLogData(item));
  }
  
  if (typeof data === 'object') {
    const redacted = {};
    Object.keys(data).forEach(key => {
      // Check if key name suggests secrets
      if (/url|endpoint|auth|key|token|secret|password|credential|connection/i.test(key)) {
        if (typeof data[key] === 'string') {
          if (key.toLowerCase().includes('url') || key.toLowerCase().includes('endpoint')) {
            redacted[key] = redactSecretsInUrl(data[key]);
          } else {
            redacted[key] = '[REDACTED]';
          }
        } else {
          redacted[key] = redactLogData(data[key]);
        }
      } else {
        redacted[key] = redactLogData(data[key]);
      }
    });
    return redacted;
  }
  
  return data;
}

/**
 * Helper function to redact secrets from text (import from config if available)
 */
function redactSecretsInText(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  let redacted = text;
  
  const secretPatterns = [
    // API keys and tokens - reduced threshold to catch shorter keys
    { pattern: /\b(api[_-]?key|token|auth[_-]?key|secret[_-]?key)[\s:=]+([A-Za-z0-9_-]{5,})\b/gi, replacement: '$1=[REDACTED]' },
    // Bearer tokens - reduced threshold
    { pattern: /\b(bearer\s+)([A-Za-z0-9_-]{5,})\b/gi, replacement: '$1[REDACTED]' },
    // Authorization headers
    { pattern: /\b(authorization[\s:=]+)([A-Za-z0-9+/=]{20,})\b/gi, replacement: '$1[REDACTED]' },
    // Common key prefixes - reduced threshold
    { pattern: /\b(sk_|pk_|api_|auth_|token_)([A-Za-z0-9_-]{3,})\b/gi, replacement: '$1[REDACTED]' },
    // Long hex strings (including 0x prefix)
    { pattern: /\b(0x)?[a-f0-9]{32,}\b/gi, replacement: '[REDACTED_HEX]' },
    // Base64 patterns
    { pattern: /\b[A-Za-z0-9+/]{32,}={0,2}\b/g, replacement: '[REDACTED_BASE64]' },
    // Password fields
    { pattern: /\b(password|passwd|pwd)[\s:=]+([^\s,}]+)/gi, replacement: '$1=[REDACTED]' }
  ];
  
  secretPatterns.forEach(({ pattern, replacement }) => {
    redacted = redacted.replace(pattern, replacement);
  });
  
  return redacted;
}

/**
 * Helper function to redact secrets from URLs
 */
function redactSecretsInUrl(urlString) {
  try {
    const url = new URL(urlString);
    let redacted = `${url.protocol}//${url.hostname}`;
    
    if (url.port && !((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80'))) {
      redacted += `:${url.port}`;
    }
    
    // Redact path segments that look like secrets
    if (url.pathname && url.pathname !== '/') {
      const segments = url.pathname.split('/').map(seg => {
        if (seg && (/^[A-Za-z0-9_-]{20,}$/.test(seg) || /key|token|auth|secret/i.test(seg))) {
          return '[REDACTED]';
        }
        return seg;
      });
      redacted += segments.join('/');
    }
    
    if (url.search) {
      redacted += '?[REDACTED]';
    }
    
    return redacted;
  } catch {
    return '[REDACTED_INVALID_URL]';
  }
}

// ADD new function for general secret-safe logging
export function logSecretSafe(level, message, data = {}) {
  const redactedData = redactLogData(data);
  
  switch (level) {
    case 'debug':
      logger.debug(message, redactedData);
      break;
    case 'info':
      logger.info(message, redactedData);
      break;
    case 'warn':
      logger.warn(message, redactedData);
      break;
    case 'error':
      logger.error(message, redactedData);
      break;
    default:
      logger.info(message, redactedData);
  }
}

// ADD function for emergency secret scanning in existing logs
export function scanForSecrets(logEntry) {
  const secrets = [];
  const logString = typeof logEntry === 'string' ? logEntry : JSON.stringify(logEntry);
  
  const secretPatterns = [
    { pattern: /\b[A-Za-z0-9_-]{32,}\b/g, type: 'Long alphanumeric string' },
    { pattern: /\b[a-f0-9]{32,}\b/gi, type: 'Hex string' },
    { pattern: /\b[A-Za-z0-9+/]{32,}={0,2}\b/g, type: 'Base64 string' },
    { pattern: /\b(sk_|pk_|api_|auth_|token_)[A-Za-z0-9_-]{15,}\b/gi, type: 'API key prefix' },
    { pattern: /[?&](api[_-]?key|token|auth|secret)=([^&\s]+)/gi, type: 'URL parameter secret' }
  ];
  
  secretPatterns.forEach(({ pattern, type }) => {
    const matches = logString.match(pattern);
    if (matches) {
      matches.forEach(match => {
        secrets.push({ type, value: match, length: match.length });
      });
    }
  });
  
  return secrets;
}

export { logger };