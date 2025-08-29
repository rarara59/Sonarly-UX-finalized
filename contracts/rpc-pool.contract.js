// contracts/rpc-pool.contract.js
// DAY: 2
// GOALS: RPC connection pooling with failover, deadlines, precision-safe payload handling
// COMPONENTS: rpc-pool
// SYSTEM/CONSTRAINTS/RULES: Interface-only; strict validation; exact return types; error taxonomy; deterministic deps;
// no network calls in constructors; injectable clock/rng; structured logging: {requestId, durationMs, outcome}

/**
 * @typedef {Object} RpcEndpoint
 * @property {string} url - Required HTTPS/WSS URL; non-empty; scheme required; must be unique within config.
 * @property {number} weight - Integer ≥ 0; scheduling weight.
 * @property {number} rpsCap - Integer ≥ 0; per-endpoint rate cap.
 * @property {number} timeoutMs - Integer ≥ 1; per-attempt timeout.
 */

/**
 * @typedef {Object} RpcPoolDeps
 * @property {{ now: () => number }} clock - Deterministic clock for deadlines/metrics.
 * @property {{ random: () => number }} [rng] - Optional deterministic RNG (0≤x<1) for tie-breaks/jitter.
 * @property {{ uuid: () => string }} [uuid] - Optional deterministic UUID for request correlation.
 * @property {import('./logger.contract.js').LoggerContract} logger - Structured logger (required).
 * @property {{ // optional breaker surface without coupling
 *   canPass: (ctx: {requestId: string, deadlineMs?: number}) => Promise<{ok:boolean, data?:{state:string}, error?:{code:string, message:string}}>
 *   recordSuccess: (r: {requestId: string, durationMs: number}) => Promise<{ok:boolean, data?:unknown, error?:{code:string, message:string}}>
 *   recordFailure: (r: {requestId: string, durationMs: number, errorCode: string, message?: string}) => Promise<{ok:boolean, data?:unknown, error?:{code:string, message:string}}>
 * }} [breaker]
 */

/**
 * @typedef {Object} RpcPoolConfig
 * @property {RpcEndpoint[]} endpoints - Required non-empty array; URLs unique; max length reasonable (≤32).
 * @property {number} maxConcurrency - Integer ≥ 1; poolwide in-flight cap.
 * @property {number} queueCapacity - Integer ≥ 0; pending requests buffer size.
 * @property {number} globalTimeoutMs - Integer ≥ 1; absolute call cap (includes retries).
 * @property {number} retryBackoffMs - Integer ≥ 0; deterministic base backoff between attempts.
 * @property {number} maxRetries - Integer ≥ 0; total attempts including primary.
 * @property {boolean} preferFastest - Bias routing to lowest EMA latency when true.
 */

/**
 * @typedef {Object} RpcCallOptions
 * @property {string} requestId - Required non-empty identifier (trace correlation).
 * @property {number} [deadlineMs] - Optional absolute epoch ms; must be ≥ deps.clock.now().
 * @property {number} [maxLatencyMs] - Optional integer ≥ 1; per-attempt cap if stricter than endpoint.
 * @property {boolean} [idempotent] - Enables safe retry semantics.
 * @property {'balanced'|'primary'|'latency-biased'} [routing] - Default 'balanced'.
 */

/**
 * @typedef {Object} RpcPoolResult
 * @property {boolean} ok
 * @property {any} [data] // JSON-RPC result, precision-safe (big integers returned as strings)
 * @property {{ code:
 *  'VALIDATION_ERROR'|'RATE_LIMITED'|'TIMEOUT'|'DEPENDENCY_UNAVAILABLE'|'NOT_FOUND'|'CONFLICT'|'INVARIANT_BREACH'|'INTERNAL',
 *  message: string }} [error]
 */

class RpcPoolContract {
  /**
   * @constructor
   * @param {RpcPoolConfig} config - Pure configuration object. Validate only; no I/O in ctor.
   * @param {RpcPoolDeps} deps - Deterministic injected dependencies (logger required).
   * @throws {Error} Always 'Not implemented' (contract only).
   */
  constructor(config, deps) { throw new Error('Not implemented'); }

  /**
   * Submit a JSON-RPC call through the pool with failover and deadline control.
   * Financial requirements: precision preservation; bounded latency; deterministic retry/failover.
   * Validation:
   * - method: required, non-empty ASCII string
   * - params: optional; JSON-serializable; BigInt disallowed (use decimal-string)
   * - options.requestId: required, non-empty
   * - options.deadlineMs: if provided, integer ≥ deps.clock.now()
   * - options.maxLatencyMs: if provided, integer ≥ 1
   * - options.routing: if provided, one of 'balanced'|'primary'|'latency-biased'
   * Errors:
   * - VALIDATION_ERROR: any invalid input (including non-serializable params)
   * - RATE_LIMITED: pool/endpoint RPS or concurrency exceeded; breaker denial
   * - TIMEOUT: per-attempt or global timeout/deadline exceeded
   * - DEPENDENCY_UNAVAILABLE: all endpoints unhealthy/unavailable
   * - NOT_FOUND: method not found (normalized from endpoint)
   * - CONFLICT: unsafe retry on non-idempotent call detected
   * - INVARIANT_BREACH: internal pool state violation detected
   * - INTERNAL: unexpected failure
   * @param {string} method
   * @param {unknown[]|Record<string, unknown>|undefined} params
   * @param {RpcCallOptions} options
   * @returns {Promise<RpcPoolResult>}
   */
  async call(method, params, options) { throw new Error('Not implemented'); }

  /**
   * Get instantaneous health snapshot for routing and observability.
   * Validation:
   * - context.requestId: required, non-empty
   * Errors:
   * - INTERNAL
   * @param {{ requestId: string }} context
   * @returns {Promise<
   *   { ok: true, data: { 
   *       endpoints: Array<{ url: string, inFlight: number, emaLatencyMs: number, recentErrorRate: number, state: 'HEALTHY'|'DEGRADED'|'DOWN' }>
   *     } } 
   *   | { ok: false, error: { code: 'INTERNAL', message: string } }
   * >}
   */
  async getHealth(context) { throw new Error('Not implemented'); }
}

export { RpcPoolContract };