// fakes/logger.fake.js
// RENAISSANCE FAKE IMPLEMENTATION: Deterministic logger fake for testing
// CONTRACT: LoggerContract compliance with predictable test scenarios

/**
 * @typedef {Object} LoggerDeps
 * @property {{ now: () => number }} clock - Deterministic monotonic-ish clock returning epoch ms.
 * @property {{ uuid: () => string }} [uuid] - Deterministic UUID source for child contexts.
 */

/**
 * @typedef {'trace'|'debug'|'info'|'warn'|'error'|'fatal'} LogLevel
 */

/**
 * @typedef {Object} LogContext
 * @property {string} requestId - Required. Non-empty, stable per-request identifier.
 * @property {number} [durationMs] - Optional. Integer ≥ 0; measured latency.
 * @property {'success'|'failure'|'partial'} [outcome] - Optional operation outcome.
 * @property {Record<string, string|number|boolean|null>} [tags] - Flat, JSON-serializable metadata.
 */

/**
 * @typedef {Object} LogEntry
 * @property {LogLevel} level - Required.
 * @property {string} message - Required non-empty string, max 2048 chars.
 * @property {LogContext} context - Required structured context.
 * @property {unknown} [data] - Optional JSON-serializable payload.
 */

/**
 * @typedef {Object} LoggerResult
 * @property {boolean} ok
 * @property {undefined} [data]
 * @property {{ code: 'VALIDATION_ERROR'|'DEPENDENCY_UNAVAILABLE'|'RATE_LIMITED'|'TIMEOUT'|'INTERNAL', message: string }} [error]
 */

/**
 * Deterministic Logger Fake for Testing
 * Supports scenario switching for predictable test behavior
 */
class LoggerFake {
  /**
   * @param {LoggerDeps} deps - Injected deterministic dependencies
   * @param {string} [scenario='normal'] - Test scenario: 'normal', 'rate_limited', 'validation_error', 'internal_error'
   */
  constructor(deps, scenario = 'normal') {
    if (!deps || typeof deps !== 'object') {
      throw new Error('LoggerDeps required');
    }
    
    if (!deps.clock || typeof deps.clock.now !== 'function') {
      throw new Error('deps.clock.now function required');
    }
    
    this.clock = deps.clock;
    this.uuid = deps.uuid || { 
      uuid: () => `fake_req_${this.clock.now()}_${this._deterministicId()}` 
    };
    this.scenario = scenario;
    
    // Deterministic state for scenarios
    this.emitCount = 0;
    this.childCount = 0;
    
    // Validation sets (finance-grade: pre-allocated)
    this.validLevels = new Set(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
    this.validOutcomes = new Set(['success', 'failure', 'partial']);
    
    // Base context for child loggers
    this.baseContext = {};
    
    // Captured logs for test verification
    this.capturedLogs = [];
  }

  /**
   * Generate deterministic ID (no randomness)
   * @private
   */
  _deterministicId() {
    return (this.emitCount * 1000 + this.childCount).toString(36);
  }

  /**
   * Validate LogEntry (same as production but deterministic)
   * @private
   * @param {LogEntry} entry
   */
  _validateEntry(entry) {
    // Scenario: Always fail validation
    if (this.scenario === 'validation_error') {
      return { 
        ok: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Fake validation error for testing' } 
      };
    }
    
    // Standard validation
    if (!entry || typeof entry !== 'object') {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry must be object' } };
    }
    
    if (!entry.level || !this.validLevels.has(entry.level)) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.level must be valid LogLevel' } };
    }
    
    if (!entry.message || typeof entry.message !== 'string' || entry.message.length === 0) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.message must be non-empty string' } };
    }
    
    if (entry.message.length > 2048) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.message exceeds 2048 chars' } };
    }
    
    if (!entry.context || typeof entry.context !== 'object') {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.context required' } };
    }
    
    if (!entry.context.requestId || typeof entry.context.requestId !== 'string' || entry.context.requestId.length === 0) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.context.requestId must be non-empty string' } };
    }
    
    if (entry.context.durationMs !== undefined) {
      if (!Number.isInteger(entry.context.durationMs) || entry.context.durationMs < 0) {
        return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.context.durationMs must be integer ≥ 0' } };
      }
    }
    
    if (entry.context.outcome !== undefined) {
      if (!this.validOutcomes.has(entry.context.outcome)) {
        return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.context.outcome must be success|failure|partial' } };
      }
    }
    
    if (entry.context.tags !== undefined) {
      if (typeof entry.context.tags !== 'object' || entry.context.tags === null || Array.isArray(entry.context.tags)) {
        return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.context.tags must be object' } };
      }
      
      for (const [key, value] of Object.entries(entry.context.tags)) {
        if (typeof key !== 'string' || key.length > 64) {
          return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'tags keys must be strings ≤ 64 chars' } };
        }
        
        const valueType = typeof value;
        if (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean' && value !== null) {
          return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'tags values must be primitive types' } };
        }
      }
    }
    
    if (entry.data !== undefined) {
      try {
        JSON.stringify(entry.data);
      } catch (error) {
        return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'entry.data must be JSON-serializable' } };
      }
    }
    
    return { ok: true };
  }

  /**
   * Check scenario-based rate limiting
   * @private
   */
  _checkScenarioLimits() {
    // Scenario: Always rate limited after 3rd call (4th and beyond fail)
    if (this.scenario === 'rate_limited' && this.emitCount > 3) {
      return { 
        ok: false, 
        error: { code: 'RATE_LIMITED', message: 'Fake rate limit exceeded for testing' } 
      };
    }
    
    // Scenario: Internal error on every 3rd call (deterministic but periodic)
    if (this.scenario === 'internal_error' && this.emitCount % 3 === 0) {
      return { 
        ok: false, 
        error: { code: 'INTERNAL', message: 'Fake internal error for testing' } 
      };
    }
    
    // Scenario: Timeout error (immediate for testing)
    if (this.scenario === 'timeout') {
      return { 
        ok: false, 
        error: { code: 'TIMEOUT', message: 'Fake timeout for testing' } 
      };
    }
    
    // Scenario: Dependency unavailable error (immediate for testing)
    if (this.scenario === 'dependency_unavailable') {
      return { 
        ok: false, 
        error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Fake dependency unavailable for testing' } 
      };
    }
    
    return { ok: true };
  }

  /**
   * Emit a single structured log entry.
   * @param {LogEntry} entry
   * @returns {Promise<LoggerResult>}
   */
  async emit(entry) {
    this.emitCount++;
    
    try {
      // Standard validation (includes validation_error scenario)
      const validation = this._validateEntry(entry);
      if (!validation.ok) {
        return validation;
      }
      
      // Scenario-based failures after validation
      const scenarioCheck = this._checkScenarioLimits();
      if (!scenarioCheck.ok) {
        return scenarioCheck;
      }
      
      // Capture log for test verification
      const capturedEntry = {
        ...entry,
        context: {
          ...this.baseContext,
          ...entry.context
        },
        timestamp: this.clock.now(),
        emitNumber: this.emitCount
      };
      
      this.capturedLogs.push(capturedEntry);
      
      return { ok: true };
    } catch (error) {
      return { ok: false, error: { code: 'INTERNAL', message: `Fake emit failure: ${error.message}` } };
    }
  }

  /**
   * Create a child logger with merged immutable context.
   * @param {LogContext} baseContext
   * @returns {Promise<{ ok: true, data: LoggerFake } | { ok: false, error: { code: 'VALIDATION_ERROR'|'INTERNAL', message: string } }>}
   */
  async withContext(baseContext) {
    this.childCount++;
    
    try {
      // Scenario: Internal error on 3rd child creation
      if (this.scenario === 'internal_error' && this.childCount === 3) {
        return { 
          ok: false, 
          error: { code: 'INTERNAL', message: 'Fake withContext internal error for testing' } 
        };
      }
      
      // Validate baseContext
      if (!baseContext || typeof baseContext !== 'object') {
        return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'baseContext must be object' } };
      }
      
      if (!baseContext.requestId || typeof baseContext.requestId !== 'string' || baseContext.requestId.length === 0) {
        return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'baseContext.requestId must be non-empty string' } };
      }
      
      // Validate tags if provided
      if (baseContext.tags !== undefined) {
        if (typeof baseContext.tags !== 'object' || baseContext.tags === null || Array.isArray(baseContext.tags)) {
          return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'baseContext.tags must be object' } };
        }
        
        for (const [key, value] of Object.entries(baseContext.tags)) {
          if (typeof key !== 'string' || key.length > 64) {
            return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'tags keys must be strings ≤ 64 chars' } };
          }
          
          const valueType = typeof value;
          if (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean' && value !== null) {
            return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'tags values must be primitive types' } };
          }
        }
      }
      
      // Create child logger fake with same scenario
      const childLogger = new LoggerFake({
        clock: this.clock,
        uuid: this.uuid
      }, this.scenario);
      
      // Merge base contexts
      childLogger.baseContext = {
        ...this.baseContext,
        ...baseContext
      };
      
      // Share captured logs array for test verification
      childLogger.capturedLogs = this.capturedLogs;
      
      return { ok: true, data: childLogger };
    } catch (error) {
      return { ok: false, error: { code: 'INTERNAL', message: `Fake withContext failure: ${error.message}` } };
    }
  }

  /**
   * TEST HELPER: Get captured logs for verification
   * @returns {Array} All captured log entries
   */
  getCapturedLogs() {
    return [...this.capturedLogs];
  }

  /**
   * TEST HELPER: Clear captured logs
   */
  clearCapturedLogs() {
    this.capturedLogs.length = 0;
  }

  /**
   * TEST HELPER: Get current scenario
   */
  getScenario() {
    return this.scenario;
  }

  /**
   * TEST HELPER: Get emit count
   */
  getEmitCount() {
    return this.emitCount;
  }
}

// Export for testing framework
export { LoggerFake };
export default LoggerFake;