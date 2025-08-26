/**
 * RPC Pool Utilities - Salvaged Components
 * File: src/detection/transport/rpc-pool-utils.js
 * Extracted clean, working components from existing implementation
 */

// --- Utility Functions (Salvaged from lines 10-27) ---
export function redactUrl(u) {
  try {
    const url = new URL(u);
    if (url.searchParams.has('api-key')) url.searchParams.set('api-key', 'REDACTED');
    return url.toString();
  } catch {
    return u || null;
  }
}

export function envInt(key, def) {
  const v = process.env[key];
  return v !== undefined && v !== '' ? Number(v) : def;
}

export function envBool(key, def) {
  const v = process.env[key];
  if (v === undefined) return def;
  return String(v).toLowerCase() === 'true';
}

// --- Default Endpoint Configuration (Salvaged from lines 92-111) ---
export function getDefaultEndpoints() {
  const heliusUrl = process.env.HELIUS_RPC_URL;
  const chainstackUrl = process.env.CHAINSTACK_RPC_URL;
  const publicUrl = process.env.PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
  
  if (!heliusUrl || !chainstackUrl) {
    throw new Error("Required RPC endpoints missing: HELIUS_RPC_URL, CHAINSTACK_RPC_URL");
  }
  
  return {
    helius: {
      url: heliusUrl,
      priority: 1,
      maxRequestsPerSecond: envInt('HELIUS_RPS_LIMIT', 100),
      timeout: envInt('HELIUS_TIMEOUT_MS', 500),
      weight: envInt('HELIUS_WEIGHT', 100),
      concurrencyLimit: envInt('HELIUS_CONCURRENCY_LIMIT', 20)
    },
    chainstack: {
      url: chainstackUrl,
      priority: 2,
      maxRequestsPerSecond: envInt('CHAINSTACK_RPS_LIMIT', 50),
      timeout: envInt('CHAINSTACK_TIMEOUT_MS', 800),
      weight: envInt('CHAINSTACK_WEIGHT', 80),
      concurrencyLimit: envInt('CHAINSTACK_CONCURRENCY_LIMIT', 15)
    },
    public: {
      url: publicUrl,
      priority: 3,
      maxRequestsPerSecond: envInt('PUBLIC_RPS_LIMIT', 10),
      timeout: envInt('PUBLIC_TIMEOUT_MS', 1500),
      weight: envInt('PUBLIC_WEIGHT', 40),
      concurrencyLimit: envInt('PUBLIC_CONCURRENCY_LIMIT', 5)
    }
  };
}

// --- Startup Configuration Logging (Salvaged from lines 29-90) ---
export function createStartupConfigLog(endpoints) {
  const endpointConfigs = [
    { name: 'helius',    urlKey: 'HELIUS_RPC_URL',    weight: 'HELIUS_WEIGHT',    rps: 'HELIUS_RPS_LIMIT',    conc: 'HELIUS_CONCURRENCY_LIMIT',    to: 'HELIUS_TIMEOUT_MS' },
    { name: 'chainstack',urlKey: 'CHAINSTACK_RPC_URL',weight: 'CHAINSTACK_WEIGHT',rps: 'CHAINSTACK_RPS_LIMIT',conc: 'CHAINSTACK_CONCURRENCY_LIMIT',to: 'CHAINSTACK_TIMEOUT_MS' },
    { name: 'public',    urlKey: 'PUBLIC_RPC_URL',    weight: 'PUBLIC_WEIGHT',    rps: 'PUBLIC_RPS_LIMIT',    conc: 'PUBLIC_CONCURRENCY_LIMIT',    to: 'PUBLIC_TIMEOUT_MS' }
  ].filter(e => process.env[e.urlKey]);

  const epSummary = endpointConfigs.map(e => ({
    endpoint: e.name,
    url: redactUrl(process.env[e.urlKey]),
    weight: envInt(e.weight, null),
    rps_limit: envInt(e.rps, null),
    concurrency_limit: envInt(e.conc, null),
    timeout_ms: envInt(e.to, null),
  }));

  const summary = {
    rpc_config_summary: {
      endpoints_loaded: epSummary.length,
      endpoints: epSummary,
      queue: {
        max_size: envInt('RPC_QUEUE_MAX_SIZE', null),
        deadline_ms: envInt('RPC_QUEUE_DEADLINE_MS', null),
        reject_fast_ms: envInt('RPC_QUEUE_REJECT_FAST_MS', null),
        reject_code: process.env.RPC_QUEUE_REJECT_CODE || null
      },
      hedging: {
        enabled: envBool('RPC_HEDGING_ENABLED', false),
        delay_ms: envInt('RPC_HEDGING_DELAY_MS', null),
        max_extra: envInt('RPC_HEDGING_MAX_EXTRA', null),
        abort_on_primary_success: envBool('RPC_ABORT_HEDGE_ON_PRIMARY_SUCCESS', false),
      },
      health: {
        interval_ms: envInt('RPC_HEALTH_INTERVAL_MS', null),
        jitter_ms: envInt('RPC_HEALTH_JITTER_MS', null),
        probe_timeout_ms: envInt('RPC_HEALTH_PROBE_TIMEOUT_MS', null),
        probe_rps_limit: envInt('RPC_HEALTH_PROBE_RPS_LIMIT', null),
        startup_healthcheck: envBool('RPC_STARTUP_HEALTHCHECK', false),
      },
      breaker: {
        enabled: envBool('RPC_BREAKER_ENABLED', false),
        failure_threshold: envInt('RPC_BREAKER_FAILURE_THRESHOLD', null),
        cooldown_ms: envInt('RPC_BREAKER_COOLDOWN_MS', null),
        half_open_probes: envInt('RPC_BREAKER_HALF_OPEN_PROBES', null),
      },
      keep_alive: {
        enabled: envBool('RPC_KEEP_ALIVE_ENABLED', false),
        sockets: envInt('RPC_KEEP_ALIVE_SOCKETS', null),
        timeout_ms: envInt('RPC_KEEP_ALIVE_TIMEOUT_MS', null),
      },
    }
  };

  return summary;
}

// --- RPC Request Payload Builder (Salvaged from lines 246-252) ---
export function createRpcPayload(method, params, requestId) {
  return {
    jsonrpc: '2.0',
    id: requestId,
    method,
    params: params || []
  };
}

// --- Rate Limit Validation ---
export function canMakeRequest(endpoint) {
  const now = Date.now();
  
  // Reset per-second counter if needed
  if (now - (endpoint.lastSecondReset || 0) > 1000) {
    endpoint.requestsThisSecond = 0;
    endpoint.lastSecondReset = now;
  }
  
  return endpoint.requestsThisSecond < endpoint.maxRequestsPerSecond;
}

// --- Outcome Classification for Structured Logging ---
export function determineOutcome(success, error) {
  if (success) return 'ok';
  if (!error) return 'error';
  
  const message = (error.message || '').toLowerCase();
  if (message.includes('timeout') || message.includes('abort')) return 'timeout';
  if (message.includes('rate limit') || message.includes('429')) return 'rate_limited';
  if (message.includes('circuit') || message.includes('breaker')) return 'breaker_open';
  if (message.includes('network') || message.includes('connection')) return 'network_error';
  return 'error';
}