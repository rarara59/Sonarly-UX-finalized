// fakes/circuit-breaker.fake.js
// DAY: 2 (RECOVERY)
// FAKE: Deterministic circuit-breaking with probe control and strict timings
// SCENARIO SUPPORT: normal, always-open, always-closed, flapping, probe-limited, slow-recovery

/**
 * Deterministic fake circuit breaker for development/testing with scenario-based behavior
 */
class CircuitBreakerFake {
  constructor(config, deps, scenario = 'normal') {
    // Validate required dependencies
    if (!deps?.logger) throw new Error('deps.logger is required');
    if (!deps?.clock) throw new Error('deps.clock is required');
    if (!config) throw new Error('config is required');

    // Validate config
    this._validateConfig(config);

    this.config = config;
    this.deps = deps;
    this.scenario = scenario;

    // Circuit breaker state
    this.state = 'CLOSED';  // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.failureCount = 0;
    this.lastFailureTimeMs = 0;
    this.lastSuccessTimeMs = deps.clock.now();
    this.halfOpenInFlight = 0;
    this.stateChangeTimeMs = deps.clock.now();

    // Rolling window tracking
    this.failures = [];  // {timeMs, errorCode, durationMs}
    this.successes = [];  // {timeMs, durationMs}

    // Metrics tracking
    this.totalCalls = 0;
    this.totalSuccesses = 0;
    this.totalFailures = 0;
    this.stateTransitions = [];
    this.capturedLogs = [];

    // Initialize scenario-specific state
    this._initializeScenario(scenario);
  }

  // CORE CONTRACT METHODS (strict compliance)

  /**
   * Check if a request is permitted at this instant
   * @param {{requestId: string, deadlineMs?: number}} context
   * @returns {Promise<CircuitBreakerResult>}
   */
  async canPass(context) {
    const startTime = this.deps.clock.now();
    this.totalCalls++;

    try {
      // Validation
      const validationResult = this._validateCanPassContext(context);
      if (!validationResult.ok) {
        this._logOperation(context?.requestId || 'unknown', 'canPass', 'validation_error', 0);
        return validationResult;
      }

      // Check deadline
      if (context.deadlineMs !== undefined && this.deps.clock.now() >= context.deadlineMs) {
        this._logOperation(context.requestId, 'canPass', 'timeout', this.deps.clock.now() - startTime);
        return {
          ok: false,
          error: { code: 'TIMEOUT', message: 'Request deadline exceeded' }
        };
      }

      // Update state based on time progression
      this._updateState();

      // Scenario-specific behavior overrides
      const scenarioResult = this._applyScenarioBehavior('canPass', context);
      if (scenarioResult) {
        this._logOperation(context.requestId, 'canPass', scenarioResult.ok ? 'success' : 'denied', this.deps.clock.now() - startTime);
        return scenarioResult;
      }

      // Normal circuit breaker logic
      switch (this.state) {
        case 'CLOSED':
          this._logOperation(context.requestId, 'canPass', 'success', this.deps.clock.now() - startTime);
          return { ok: true, data: { state: this.state } };

        case 'OPEN':
          this._logOperation(context.requestId, 'canPass', 'denied', this.deps.clock.now() - startTime);
          return {
            ok: false,
            error: { code: 'RATE_LIMITED', message: `Circuit breaker OPEN (${this.failureCount} failures)` }
          };

        case 'HALF_OPEN':
          if (this.halfOpenInFlight >= this.config.halfOpenMaxInFlight) {
            this._logOperation(context.requestId, 'canPass', 'denied', this.deps.clock.now() - startTime);
            return {
              ok: false,
              error: { code: 'RATE_LIMITED', message: `HALF_OPEN probe limit exceeded (${this.halfOpenInFlight}/${this.config.halfOpenMaxInFlight})` }
            };
          }

          this.halfOpenInFlight++;
          this._logOperation(context.requestId, 'canPass', 'success', this.deps.clock.now() - startTime);
          return { ok: true, data: { state: this.state } };

        default:
          this._logOperation(context.requestId, 'canPass', 'internal_error', this.deps.clock.now() - startTime);
          return {
            ok: false,
            error: { code: 'INVARIANT_BREACH', message: `Invalid breaker state: ${this.state}` }
          };
      }

    } catch (error) {
      this._logOperation(context?.requestId || 'unknown', 'canPass', 'internal_error', this.deps.clock.now() - startTime);
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Unexpected error: ${error.message}` }
      };
    }
  }

  /**
   * Record a success outcome with duration
   * @param {{requestId: string, durationMs: number}} result
   * @returns {Promise<CircuitBreakerResult>}
   */
  async recordSuccess(result) {
    const startTime = this.deps.clock.now();

    try {
      // Validation
      const validationResult = this._validateSuccessResult(result);
      if (!validationResult.ok) {
        this._logOperation(result?.requestId || 'unknown', 'recordSuccess', 'validation_error', 0);
        return validationResult;
      }

      // Record success
      this.totalSuccesses++;
      this.lastSuccessTimeMs = this.deps.clock.now();
      this.successes.push({
        timeMs: this.deps.clock.now(),
        durationMs: result.durationMs,
        requestId: result.requestId
      });

      // Clean old entries from rolling window
      this._cleanRollingWindow();

      // State transitions based on success
      const previousState = this.state;
      
      if (this.state === 'HALF_OPEN') {
        this.halfOpenInFlight = Math.max(0, this.halfOpenInFlight - 1);
        
        // Scenario override for slow recovery
        if (this.scenario === 'slow-recovery') {
          // Stay in HALF_OPEN longer
          if (this.halfOpenInFlight === 0) {
            const successCount = this.successes.filter(s => s.timeMs > this.stateChangeTimeMs).length;
            if (successCount >= 3) {  // Require 3 successes instead of 1
              this._transitionTo('CLOSED', 'Multiple successes in HALF_OPEN');
            }
          }
        } else {
          // Normal recovery - single success transitions to CLOSED
          if (this.halfOpenInFlight === 0) {
            this._transitionTo('CLOSED', 'Success in HALF_OPEN');
          }
        }
      }

      // Reset failure count on success in CLOSED state
      if (this.state === 'CLOSED') {
        const timeSinceLastFailure = this.deps.clock.now() - this.lastFailureTimeMs;
        const successResetMs = this.config.successResetMs || this.config.rollingWindowMs;
        
        if (timeSinceLastFailure > successResetMs) {
          this.failureCount = 0;
        }
      }

      this._logOperation(result.requestId, 'recordSuccess', 'success', this.deps.clock.now() - startTime);
      return { ok: true, data: { state: this.state } };

    } catch (error) {
      this._logOperation(result.requestId, 'recordSuccess', 'internal_error', this.deps.clock.now() - startTime);
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Unexpected error: ${error.message}` }
      };
    }
  }

  /**
   * Record a failure outcome with classification
   * @param {{requestId: string, durationMs: number, errorCode: string, message?: string}} result
   * @returns {Promise<CircuitBreakerResult>}
   */
  async recordFailure(result) {
    const startTime = this.deps.clock.now();

    try {
      // Validation
      const validationResult = this._validateFailureResult(result);
      if (!validationResult.ok) {
        this._logOperation(result?.requestId || 'unknown', 'recordFailure', 'validation_error', 0);
        return validationResult;
      }

      // Check if this should count as a failure (latency threshold)
      const shouldCountAsFailure = result.durationMs > this.config.maxLatencyMs || 
                                  this._isErrorCodeFailure(result.errorCode);

      if (shouldCountAsFailure) {
        this.totalFailures++;
        this.failureCount++;
        this.lastFailureTimeMs = this.deps.clock.now();
        
        this.failures.push({
          timeMs: this.deps.clock.now(),
          durationMs: result.durationMs,
          errorCode: result.errorCode,
          message: result.message,
          requestId: result.requestId
        });
      }

      // Clean old entries from rolling window
      this._cleanRollingWindow();

      // State transitions based on failure
      const previousState = this.state;

      if (this.state === 'HALF_OPEN') {
        this.halfOpenInFlight = Math.max(0, this.halfOpenInFlight - 1);
        if (shouldCountAsFailure) {
          this._transitionTo('OPEN', `Failure in HALF_OPEN: ${result.errorCode}`);
        }
      } else if (this.state === 'CLOSED' && shouldCountAsFailure) {
        if (this.failureCount >= this.config.failureThreshold) {
          this._transitionTo('OPEN', `Failure threshold reached: ${this.failureCount}/${this.config.failureThreshold}`);
        }
      }

      this._logOperation(result.requestId, 'recordFailure', shouldCountAsFailure ? 'failure_recorded' : 'ignored', this.deps.clock.now() - startTime);
      return { ok: true, data: { state: this.state } };

    } catch (error) {
      this._logOperation(result.requestId, 'recordFailure', 'internal_error', this.deps.clock.now() - startTime);
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Unexpected error: ${error.message}` }
      };
    }
  }

  /**
   * Get current state snapshot (no side effects)
   * @param {{requestId: string}} context
   * @returns {Promise<{ok:true, data:{state: BreakerState, metrics: Record<string, number>}} | {ok:false, error:{code:string, message:string}}>}
   */
  async getState(context) {
    try {
      // Validation
      if (!context?.requestId || typeof context.requestId !== 'string' || context.requestId.trim() === '') {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'context.requestId is required and must be non-empty string' }
        };
      }

      // Update state based on time (read-only update)
      this._updateState();

      const now = this.deps.clock.now();
      const recentFailures = this.failures.filter(f => now - f.timeMs <= this.config.rollingWindowMs);
      const recentSuccesses = this.successes.filter(s => now - s.timeMs <= this.config.rollingWindowMs);

      const metrics = {
        state: this.state,
        failureCount: this.failureCount,
        halfOpenInFlight: this.halfOpenInFlight,
        totalCalls: this.totalCalls,
        totalSuccesses: this.totalSuccesses,
        totalFailures: this.totalFailures,
        recentFailures: recentFailures.length,
        recentSuccesses: recentSuccesses.length,
        timeSinceLastFailureMs: this.lastFailureTimeMs > 0 ? now - this.lastFailureTimeMs : -1,
        timeSinceLastSuccessMs: now - this.lastSuccessTimeMs,
        timeSinceStateChangeMs: now - this.stateChangeTimeMs,
        stateTransitionCount: this.stateTransitions.length
      };

      this._logOperation(context.requestId, 'getState', 'success', 1);
      return { ok: true, data: { state: this.state, metrics } };

    } catch (error) {
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `State snapshot failed: ${error.message}` }
      };
    }
  }

  // CONVENIENCE METHODS (must call core methods)

  /**
   * Simplified success recording with auto-generated request ID
   */
  async recordQuickSuccess(durationMs) {
    const requestId = this.deps.uuid ? this.deps.uuid() : `success_${this.totalCalls + 1}_${this.deps.clock.now()}`;
    return this.recordSuccess({ requestId, durationMs });
  }

  /**
   * Simplified failure recording with auto-generated request ID
   */
  async recordQuickFailure(durationMs, errorCode, message) {
    const requestId = this.deps.uuid ? this.deps.uuid() : `failure_${this.totalCalls + 1}_${this.deps.clock.now()}`;
    return this.recordFailure({ requestId, durationMs, errorCode, message });
  }

  /**
   * Check if request can pass with auto-generated request ID
   */
  async quickCanPass() {
    const requestId = this.deps.uuid ? this.deps.uuid() : `check_${this.totalCalls + 1}_${this.deps.clock.now()}`;
    return this.canPass({ requestId });
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(requestId, fn) {
    const canPassResult = await this.canPass({ requestId });
    if (!canPassResult.ok) {
      return canPassResult;
    }

    const startTime = this.deps.clock.now();
    try {
      const result = await fn();
      const durationMs = this.deps.clock.now() - startTime;
      await this.recordSuccess({ requestId, durationMs });
      return { ok: true, data: result };
    } catch (error) {
      const durationMs = this.deps.clock.now() - startTime;
      await this.recordFailure({ requestId, durationMs, errorCode: 'EXECUTION_ERROR', message: error.message });
      return { ok: false, error: { code: 'EXECUTION_ERROR', message: error.message } };
    }
  }

  // DEVELOPER HELPERS (productivity)

  /**
   * Get captured structured logs for testing/debugging
   */
  getCapturedLogs() {
    return [...this.capturedLogs];
  }

  /**
   * Get total operation count
   */
  getInvocationCount() {
    return this.totalCalls;
  }

  /**
   * Get detailed circuit breaker statistics
   */
  getStats() {
    const now = this.deps.clock.now();
    const recentFailures = this.failures.filter(f => now - f.timeMs <= this.config.rollingWindowMs);
    const recentSuccesses = this.successes.filter(s => now - s.timeMs <= this.config.rollingWindowMs);

    return {
      scenario: this.scenario,
      state: this.state,
      failureCount: this.failureCount,
      halfOpenInFlight: this.halfOpenInFlight,
      totalCalls: this.totalCalls,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      successRate: this.totalCalls > 0 ? this.totalSuccesses / this.totalCalls : 0,
      recentFailureRate: (recentFailures.length + recentSuccesses.length) > 0 ? recentFailures.length / (recentFailures.length + recentSuccesses.length) : 0,
      stateTransitions: [...this.stateTransitions],
      timeSinceLastFailureMs: this.lastFailureTimeMs > 0 ? now - this.lastFailureTimeMs : -1,
      timeSinceStateChangeMs: now - this.stateChangeTimeMs,
      capturedLogs: this.capturedLogs.length
    };
  }

  /**
   * Reset all statistics and state
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTimeMs = 0;
    this.lastSuccessTimeMs = this.deps.clock.now();
    this.halfOpenInFlight = 0;
    this.stateChangeTimeMs = this.deps.clock.now();
    this.failures = [];
    this.successes = [];
    this.totalCalls = 0;
    this.totalSuccesses = 0;
    this.totalFailures = 0;
    this.stateTransitions = [];
    this.capturedLogs = [];
    this._initializeScenario(this.scenario);
  }

  /**
   * Force state transition for testing
   */
  forceState(newState, reason = 'Manual override') {
    if (!['CLOSED', 'OPEN', 'HALF_OPEN'].includes(newState)) {
      throw new Error(`Invalid state: ${newState}`);
    }
    this._transitionTo(newState, reason);
  }

  /**
   * Switch scenario for testing different behaviors
   */
  setScenario(newScenario) {
    this.scenario = newScenario;
    this._initializeScenario(newScenario);
  }

  // PRIVATE IMPLEMENTATION METHODS

  _validateConfig(config) {
    const required = ['failureThreshold', 'cooldownMs', 'halfOpenMaxInFlight', 'rollingWindowMs', 'maxLatencyMs'];
    for (const field of required) {
      if (typeof config[field] !== 'number' || config[field] < 0) {
        throw new Error(`config.${field} must be number >= 0`);
      }
    }

    if (!Number.isInteger(config.failureThreshold) || config.failureThreshold < 1) {
      throw new Error('config.failureThreshold must be integer >= 1');
    }
  }

  _validateCanPassContext(context) {
    if (!context?.requestId || typeof context.requestId !== 'string' || context.requestId.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'context.requestId is required and must be non-empty string' }
      };
    }

    if (context.deadlineMs !== undefined) {
      if (!Number.isInteger(context.deadlineMs) || context.deadlineMs < 0) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'context.deadlineMs must be integer >= 0' }
        };
      }
    }

    return { ok: true };
  }

  _validateSuccessResult(result) {
    if (!result?.requestId || typeof result.requestId !== 'string' || result.requestId.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'result.requestId is required and must be non-empty string' }
      };
    }

    if (!Number.isInteger(result.durationMs) || result.durationMs < 0) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'result.durationMs must be integer >= 0' }
      };
    }

    return { ok: true };
  }

  _validateFailureResult(result) {
    const successValidation = this._validateSuccessResult(result);
    if (!successValidation.ok) return successValidation;

    if (!result.errorCode || typeof result.errorCode !== 'string' || result.errorCode.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'result.errorCode is required and must be non-empty string' }
      };
    }

    return { ok: true };
  }

  _updateState() {
    const now = this.deps.clock.now();
    
    // OPEN -> HALF_OPEN transition
    if (this.state === 'OPEN') {
      const cooldownDuration = this.config.cooldownMs + this._getJitter();
      if (now - this.stateChangeTimeMs >= cooldownDuration) {
        this._transitionTo('HALF_OPEN', 'Cooldown period elapsed');
      }
    }
  }

  _transitionTo(newState, reason) {
    if (this.state === newState) return;

    const transition = {
      from: this.state,
      to: newState,
      reason,
      timeMs: this.deps.clock.now()
    };

    this.stateTransitions.push(transition);
    this.state = newState;
    this.stateChangeTimeMs = this.deps.clock.now();

    if (newState === 'HALF_OPEN') {
      this.halfOpenInFlight = 0;
    } else if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.halfOpenInFlight = 0;
    }

    this.deps.logger.info('Circuit breaker state transition', transition);
  }

  _cleanRollingWindow() {
    const cutoff = this.deps.clock.now() - this.config.rollingWindowMs;
    this.failures = this.failures.filter(f => f.timeMs > cutoff);
    this.successes = this.successes.filter(s => s.timeMs > cutoff);
  }

  _isErrorCodeFailure(errorCode) {
    // Consider certain error codes as circuit breaker failures
    const failureCodes = ['TIMEOUT', 'DEPENDENCY_UNAVAILABLE', 'INTERNAL', 'INVARIANT_BREACH'];
    return failureCodes.includes(errorCode);
  }

  _getJitter() {
    if (!this.config.jitterMs || !this.deps.rng) return 0;
    return Math.floor(this.deps.rng() * this.config.jitterMs);
  }

  _applyScenarioBehavior(operation, context) {
    switch (this.scenario) {
      case 'always-open':
        if (operation === 'canPass') {
          return {
            ok: false,
            error: { code: 'RATE_LIMITED', message: 'Scenario: always-open' }
          };
        }
        break;

      case 'always-closed':
        if (operation === 'canPass') {
          return { ok: true, data: { state: 'CLOSED' } };
        }
        break;

      case 'probe-limited':
        if (operation === 'canPass' && this.state === 'HALF_OPEN') {
          // Artificially limit probes more than config
          if (this.halfOpenInFlight >= 1) {
            return {
              ok: false,
              error: { code: 'RATE_LIMITED', message: 'Scenario: probe-limited (1 max)' }
            };
          }
        }
        break;
    }
    return null; // Use normal behavior
  }

  _initializeScenario(scenario) {
    switch (scenario) {
      case 'always-open':
        this.state = 'OPEN';
        this.failureCount = this.config.failureThreshold;
        break;
        
      case 'always-closed':
        this.state = 'CLOSED';
        this.failureCount = 0;
        break;
        
      case 'flapping':
        // Will transition states frequently during operation
        this.state = 'HALF_OPEN';
        this.halfOpenInFlight = 0;
        break;

      default:
        // Normal initialization already done in constructor
        break;
    }
  }

  _logOperation(requestId, operation, outcome, durationMs) {
    const logEntry = {
      requestId,
      operation,
      outcome,
      durationMs: Math.round(durationMs * 100) / 100,
      state: this.state,
      failureCount: this.failureCount,
      timestamp: this.deps.clock.now()
    };

    this.capturedLogs.push(logEntry);
    this.deps.logger.info('Circuit breaker operation', logEntry);
  }
}

export { CircuitBreakerFake };