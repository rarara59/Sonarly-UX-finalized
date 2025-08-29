// contracts/circuit-breaker.contract.js
// DAY: 2
// GOALS: Deterministic circuit-breaking with probe control and strict timings
// COMPONENTS: circuit-breaker
// SYSTEM/CONSTRAINTS/RULES as in logger.contract.js

/**
 * @typedef {Object} CircuitBreakerDeps
 * @property {{now: () => number}} clock - Deterministic clock for state transitions.
 * @property {{random: () => number}} [rng] - Optional deterministic RNG for jitter (0≤x<1).
 * @property {{uuid: () => string}} [uuid] - Optional deterministic UUID.
 * @property {import('./logger.contract.js').LoggerContract} logger - Structured logger.
 */

/**
 * @typedef {'CLOSED'|'OPEN'|'HALF_OPEN'} BreakerState
 */

/**
 * @typedef {Object} CircuitBreakerConfig
 * @property {number} failureThreshold - Integer ≥ 1; consecutive failures to OPEN.
 * @property {number} cooldownMs - Integer ≥ 0; OPEN → HALF_OPEN after this window.
 * @property {number} halfOpenMaxInFlight - Integer ≥ 1; allowed concurrent probes.
 * @property {number} rollingWindowMs - Integer ≥ 1; window for failure-rate calculations.
 * @property {number} maxLatencyMs - Integer ≥ 1; treat >maxLatencyMs as failure.
 * @property {number} [successResetMs] - Integer ≥ 0; time in CLOSED with no failure to reset counters.
 * @property {number} [jitterMs] - Integer ≥ 0; optional deterministic jitter applied to cooldown.
 */

/**
 * @typedef {Object} CircuitBreakerResult
 * @property {boolean} ok
 * @property {any} [data]
 * @property {{code: string, message: string}} [error] // VALIDATION_ERROR | RATE_LIMITED | TIMEOUT | CONFLICT | INVARIANT_BREACH | INTERNAL
 */

class CircuitBreakerContract {
  /**
   * @constructor
   * @param {CircuitBreakerConfig} config - Pure config; validated, no IO.
   * @param {CircuitBreakerDeps} deps - Injected deterministic deps (no network in ctor).
   * @throws {Error} Always 'Not implemented'.
   */
  constructor(config, deps) { throw new Error('Not implemented'); }

  /**
   * Check if a request is permitted at this instant.
   * Validation:
   * - context.requestId: required, non-empty
   * - deadlineMs: optional integer ≥ 0 (absolute epoch ms)
   * Errors:
   * - RATE_LIMITED: breaker OPEN or HALF_OPEN limit exceeded
   * - TIMEOUT: decision exceeded deadline
   * - INTERNAL: unexpected
   * @param {{requestId: string, deadlineMs?: number}} context
   * @returns {Promise<CircuitBreakerResult>} // data = {state: BreakerState}
   */
  async canPass(context) { throw new Error('Not implemented'); }

  /**
   * Record a success outcome with duration.
   * Validation:
   * - durationMs: integer ≥ 0
   * - requestId: non-empty
   * Errors:
   * - VALIDATION_ERROR | TIMEOUT | INTERNAL
   * @param {{requestId: string, durationMs: number}} result
   * @returns {Promise<CircuitBreakerResult>} // data = {state: BreakerState}
   */
  async recordSuccess(result) { throw new Error('Not implemented'); }

  /**
   * Record a failure outcome with classification.
   * Validation:
   * - durationMs: integer ≥ 0
   * - errorCode: non-empty string error taxonomy
   * - requestId: non-empty
   * Errors:
   * - VALIDATION_ERROR | TIMEOUT | INTERNAL
   * @param {{requestId: string, durationMs: number, errorCode: string, message?: string}} result
   * @returns {Promise<CircuitBreakerResult>} // data = {state: BreakerState}
   */
  async recordFailure(result) { throw new Error('Not implemented'); }

  /**
   * Get current state snapshot (no side effects).
   * Errors:
   * - INTERNAL
   * @param {{requestId: string}} context
   * @returns {Promise<{ok:true, data:{state: BreakerState, metrics: Record<string, number>}} | {ok:false, error:{code:string, message:string}}>}
   */
  async getState(context) { throw new Error('Not implemented'); }
}

export { CircuitBreakerContract };