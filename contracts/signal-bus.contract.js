// contracts/signal-bus.contract.js
// DAY: 2
// GOALS: Deterministic intra-process pub/sub for trading signals with backpressure awareness
// COMPONENTS: signal-bus
// SYSTEM/CONSTRAINTS/RULES as in logger.contract.js

/**
 * @typedef {Object} SignalBusDeps
 * @property {{now: () => number}} clock
 * @property {{uuid: () => string}} uuid
 * @property {import('./logger.contract.js').LoggerContract} logger
 */

/**
 * @typedef {Object} SignalMessage
 * @property {string} topic - Required non-empty string; max 256 chars.
 * @property {string} requestId - Required non-empty.
 * @property {number} ts - Publish timestamp (epoch ms); must be integer and within ±5m of deps.clock.now().
 * @property {Record<string, unknown>} payload - JSON-serializable; no BigInt/functions.
 * @property {number} [priority] - Integer ≥ 0 (0=normal).
 */

/**
 * @typedef {Object} SubscriptionOptions
 * @property {string} requestId - Required non-empty.
 * @property {string[]} topics - Non-empty list; each non-empty; unique.
 * @property {number} bufferSize - Integer ≥ 1; maximum queued messages per subscriber.
 * @property {number} maxLagMs - Integer ≥ 0; messages older than this may be dropped with notice.
 */

/**
 * @typedef {Object} SignalBusResult
 * @property {boolean} ok
 * @property {any} [data]
 * @property {{code: string, message: string}} [error] 
 * // VALIDATION_ERROR | RATE_LIMITED | TIMEOUT | DEPENDENCY_UNAVAILABLE | CONFLICT | INVARIANT_BREACH | INTERNAL
 */

class SignalBusContract {
  /**
   * @constructor
   * @param {SignalBusDeps} deps - Deterministic deps; no IO on construction.
   * @throws {Error} Always 'Not implemented'.
   */
  constructor(deps) { throw new Error('Not implemented'); }

  /**
   * Publish a signal to one or more subscribers.
   * Validation:
   * - message.topic: required, non-empty, ≤256 chars
   * - message.requestId: required, non-empty
   * - message.ts: integer within ±300000 ms of now()
   * - payload: JSON-serializable
   * - priority: if provided, integer ≥ 0
   * Errors:
   * - VALIDATION_ERROR | RATE_LIMITED (backpressure) | TIMEOUT | INTERNAL
   * @param {SignalMessage} message
   * @returns {Promise<SignalBusResult>} // data = {delivered: number, dropped: number}
   */
  async publish(message) { throw new Error('Not implemented'); }

  /**
   * Subscribe to one or more topics; returns a subscription id.
   * Validation:
   * - options.requestId: required, non-empty
   * - topics: non-empty array, items unique and non-empty
   * - bufferSize: integer ≥ 1
   * - maxLagMs: integer ≥ 0
   * Errors:
   * - VALIDATION_ERROR | DEPENDENCY_UNAVAILABLE | INTERNAL
   * @param {SubscriptionOptions} options
   * @returns {Promise<{ok:true, data:{subscriptionId:string}} | {ok:false, error:{code:string, message:string}}>}
   */
  async subscribe(options) { throw new Error('Not implemented'); }

  /**
   * Unsubscribe by id.
   * Validation:
   * - subscriptionId: required, non-empty
   * Errors:
   * - VALIDATION_ERROR | NOT_FOUND | INTERNAL
   * @param {{requestId: string, subscriptionId: string}} input
   * @returns {Promise<SignalBusResult>}
   */
  async unsubscribe(input) { throw new Error('Not implemented'); }
}

export { SignalBusContract };