/**
 * Simple Logger without Pino to avoid hanging issues
 */
import { randomUUID } from 'crypto';

// Simple console-based logger
const logger = {
  level: process.env.LOG_LEVEL || 'info',
  
  debug: (msg, data) => {
    if (logger.level === 'debug') {
      console.log(`[DEBUG] ${msg}`, data || '');
    }
  },
  
  info: (msg, data) => {
    if (['debug', 'info'].includes(logger.level)) {
      console.log(`[INFO] ${msg}`, data || '');
    }
  },
  
  warn: (msg, data) => {
    if (['debug', 'info', 'warn'].includes(logger.level)) {
      console.warn(`[WARN] ${msg}`, data || '');
    }
  },
  
  error: (msg, data) => {
    console.error(`[ERROR] ${msg}`, data || '');
  }
};

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
    logData.error = error?.message || 'Unknown error';
    logData.error_type = error?.constructor?.name || 'Error';
    
    if (process.env.RPC_ERROR_STACKS === 'true') {
      logData.error_stack = error?.stack || 'No stack available';
    }
  }
  
  switch (outcome) {
    case 'ok':
      logger.info('RPC operation completed', logData);
      break;
    case 'timeout':
    case 'rate_limited':
      logger.warn('RPC operation degraded', logData);
      break;
    case 'breaker_open':
    case 'error':
      logger.error('RPC operation failed', logData);
      break;
    default:
      logger.warn('RPC operation unknown outcome', logData);
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
  
  logger.info('Configuration loaded', logData);
}

export function logKeepAliveConfig(agentConfig) {
  logger.info('HTTP agent configured', {
    keep_alive: {
      enabled: agentConfig.keepAlive,
      max_sockets: agentConfig.maxSockets,
      max_free_sockets: agentConfig.maxFreeSockets,
      keep_alive_msecs: agentConfig.keepAliveMsecs,
      agent_type: agentConfig.protocol === 'https:' ? 'https' : 'http'
    }
  });
}

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

export function logSecretSafe(level, message, data = {}) {
  switch (level) {
    case 'debug':
      logger.debug(message, data);
      break;
    case 'info':
      logger.info(message, data);
      break;
    case 'warn':
      logger.warn(message, data);
      break;
    case 'error':
      logger.error(message, data);
      break;
    default:
      logger.info(message, data);
  }
}

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