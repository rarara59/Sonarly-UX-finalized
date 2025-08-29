// fakes/rpc-pool.fake.js
// DAY: 2 (RECOVERY)
// FAKE: RPC connection pooling with failover, deadlines, precision-safe payload handling
// SCENARIO SUPPORT: normal, rate-limited, timeout, all-endpoints-down, breaker-denial, precision-test

/**
 * Deterministic fake RPC pool for development/testing with scenario-based behavior
 */
class RpcPoolFake {
  constructor(config, deps, scenario = 'normal') {
    // Validate required dependencies
    if (!deps?.logger) throw new Error('deps.logger is required');
    if (!deps?.clock) throw new Error('deps.clock is required');
    if (!config?.endpoints?.length) throw new Error('config.endpoints must be non-empty array');
    
    this.config = config;
    this.deps = deps;
    this.scenario = scenario;
    
    // Deterministic state tracking
    this.invocationCount = 0;
    this.capturedLogs = [];
    this.endpointStats = new Map();
    this.inFlightCount = 0;
    this.queueSize = 0;
    
    // Initialize endpoint stats deterministically
    config.endpoints.forEach((endpoint, index) => {
      this.endpointStats.set(endpoint.url, {
        url: endpoint.url,
        weight: endpoint.weight,
        inFlight: 0,
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        emaLatencyMs: 50 + (index * 10), // Deterministic base latency
        recentErrorRate: scenario === 'degraded' ? 0.15 : 0.02,
        state: this._getEndpointState(endpoint.url, scenario),
        lastUsedMs: deps.clock.now() - (index * 1000)
      });
    });

    // Scenario-specific initialization
    this._initializeScenario(scenario);
  }

  // CORE CONTRACT METHODS (strict compliance)

  /**
   * Submit JSON-RPC call through pool with failover and deadline control
   * @param {string} method
   * @param {unknown[]|Record<string, unknown>|undefined} params
   * @param {RpcCallOptions} options
   * @returns {Promise<RpcPoolResult>}
   */
  async call(method, params, options) {
    const startTime = this.deps.clock.now();
    const requestId = options?.requestId || 'unknown';
    
    this.invocationCount++;
    
    try {
      // VALIDATION_ERROR scenarios
      const validationResult = this._validateCall(method, params, options);
      if (!validationResult.ok) {
        this._logCall(requestId, method, 'validation_error', this.deps.clock.now() - startTime);
        return validationResult;
      }

      // Check deadline before processing
      const deadline = options?.deadlineMs || (startTime + this.config.globalTimeoutMs);
      if (this.deps.clock.now() >= deadline) {
        this._logCall(requestId, method, 'timeout', this.deps.clock.now() - startTime);
        return {
          ok: false,
          error: { code: 'TIMEOUT', message: 'Request deadline exceeded before processing' }
        };
      }

      // RATE_LIMITED scenarios
      if (this.scenario === 'rate-limited' || this.scenario === 'breaker-denial' || this.inFlightCount >= this.config.maxConcurrency) {
        this._logCall(requestId, method, 'rate_limited', this.deps.clock.now() - startTime);
        return {
          ok: false,
          error: { code: 'RATE_LIMITED', message: this.scenario === 'breaker-denial' ? 'Circuit breaker denial' : 'Pool concurrency limit exceeded' }
        };
      }

      // Check circuit breaker if available
      if (this.deps.breaker) {
        const breakerResult = await this.deps.breaker.canPass({ requestId, deadlineMs: deadline });
        if (!breakerResult.ok || (breakerResult.data && breakerResult.data.state === 'OPEN')) {
          this._logCall(requestId, method, 'breaker_denial', this.deps.clock.now() - startTime);
          return {
            ok: false,
            error: { code: 'RATE_LIMITED', message: 'Circuit breaker denial' }
          };
        }
      }

      // DEPENDENCY_UNAVAILABLE scenario
      if (this.scenario === 'all-endpoints-down') {
        this._logCall(requestId, method, 'dependency_unavailable', this.deps.clock.now() - startTime);
        return {
          ok: false,
          error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'All endpoints unhealthy' }
        };
      }

      // Simulate endpoint selection and request processing
      const endpoint = this._selectEndpoint(options.routing || 'balanced');
      const endpointStats = this.endpointStats.get(endpoint.url);
      
      this.inFlightCount++;
      endpointStats.inFlight++;
      endpointStats.totalRequests++;

      try {
        // Simulate network latency
        const simulatedLatency = this._getSimulatedLatency(endpoint, method);
        
        // Check timeout scenarios
        const maxLatency = Math.min(
          options.maxLatencyMs || Infinity,
          endpoint.timeoutMs,
          deadline - this.deps.clock.now()
        );
        
        if (simulatedLatency > maxLatency || this.scenario === 'timeout') {
          endpointStats.errorCount++;
          this._recordBreakerFailure(requestId, simulatedLatency, 'TIMEOUT');
          this._logCall(requestId, method, 'timeout', simulatedLatency);
          return {
            ok: false,
            error: { code: 'TIMEOUT', message: `Request timeout (${simulatedLatency}ms > ${maxLatency}ms)` }
          };
        }

        // Generate deterministic response based on method and scenario
        const response = this._generateResponse(method, params, requestId);
        
        // Success path
        endpointStats.successCount++;
        endpointStats.emaLatencyMs = this._updateEMA(endpointStats.emaLatencyMs, simulatedLatency);
        endpointStats.lastUsedMs = this.deps.clock.now();
        
        this._recordBreakerSuccess(requestId, simulatedLatency);
        this._logCall(requestId, method, 'success', simulatedLatency);
        
        return { ok: true, data: response };

      } finally {
        this.inFlightCount--;
        endpointStats.inFlight--;
      }

    } catch (error) {
      this._logCall(requestId, method, 'internal_error', this.deps.clock.now() - startTime);
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Unexpected error: ${error.message}` }
      };
    }
  }

  /**
   * Get instantaneous health snapshot
   * @param {{ requestId: string }} context
   * @returns {Promise<{ok: true, data: {...}} | {ok: false, error: {...}}>}
   */
  async getHealth(context) {
    try {
      // Validate context
      if (!context?.requestId || typeof context.requestId !== 'string' || context.requestId.trim() === '') {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'context.requestId is required and must be non-empty string' }
        };
      }

      const endpoints = [];
      for (const [url, stats] of this.endpointStats) {
        endpoints.push({
          url: stats.url,
          inFlight: stats.inFlight,
          emaLatencyMs: Math.round(stats.emaLatencyMs * 100) / 100, // Precision safe
          recentErrorRate: Math.round(stats.recentErrorRate * 10000) / 10000, // Precision safe
          state: stats.state
        });
      }

      this._logCall(context.requestId, 'getHealth', 'success', 1);

      return {
        ok: true,
        data: { endpoints }
      };

    } catch (error) {
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Health check failed: ${error.message}` }
      };
    }
  }

  // CONVENIENCE METHODS (must call core methods)

  /**
   * Simplified call method with auto-generated request ID
   */
  async quickCall(method, params = undefined) {
    const requestId = this.deps.uuid ? this.deps.uuid() : `req_${this.invocationCount + 1}_${this.deps.clock.now()}`;
    return this.call(method, params, { requestId });
  }

  /**
   * Call with deadline convenience
   */
  async callWithDeadline(method, params, deadlineMs) {
    const requestId = this.deps.uuid ? this.deps.uuid() : `deadline_${this.invocationCount + 1}`;
    return this.call(method, params, { requestId, deadlineMs });
  }

  /**
   * Batch call convenience (uses core call method)
   */
  async batchCall(calls) {
    const results = [];
    for (const { method, params } of calls) {
      const requestId = this.deps.uuid ? this.deps.uuid() : `batch_${this.invocationCount + 1}_${results.length}`;
      const result = await this.call(method, params, { requestId });
      results.push(result);
    }
    return results;
  }

  // DEVELOPER HELPERS (productivity)

  /**
   * Get captured structured logs for testing/debugging
   */
  getCapturedLogs() {
    return [...this.capturedLogs];
  }

  /**
   * Get method invocation statistics
   */
  getInvocationCount() {
    return this.invocationCount;
  }

  /**
   * Get detailed pool statistics
   */
  getStats() {
    const endpoints = [];
    for (const [url, stats] of this.endpointStats) {
      endpoints.push({
        ...stats,
        errorRate: stats.totalRequests > 0 ? stats.errorCount / stats.totalRequests : 0,
        avgLatencyMs: stats.emaLatencyMs
      });
    }

    return {
      scenario: this.scenario,
      invocationCount: this.invocationCount,
      currentInFlight: this.inFlightCount,
      currentQueueSize: this.queueSize,
      endpoints,
      totalLogs: this.capturedLogs.length
    };
  }

  /**
   * Reset all statistics and logs
   */
  reset() {
    this.invocationCount = 0;
    this.capturedLogs = [];
    this.inFlightCount = 0;
    this.queueSize = 0;
    
    for (const stats of this.endpointStats.values()) {
      stats.totalRequests = 0;
      stats.successCount = 0;
      stats.errorCount = 0;
      stats.inFlight = 0;
    }
  }

  /**
   * Switch scenario for testing different behaviors
   */
  setScenario(newScenario) {
    this.scenario = newScenario;
    this._initializeScenario(newScenario);
  }

  // PRIVATE IMPLEMENTATION METHODS

  _validateCall(method, params, options) {
    // Method validation
    if (!method || typeof method !== 'string' || method.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'method is required and must be non-empty string' }
      };
    }

    // ASCII validation for method
    if (!/^[\x00-\x7F]*$/.test(method)) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'method must be ASCII string' }
      };
    }

    // Options validation
    if (!options || typeof options !== 'object') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'options object is required' }
      };
    }

    // RequestId validation
    if (!options.requestId || typeof options.requestId !== 'string' || options.requestId.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'options.requestId is required and must be non-empty string' }
      };
    }

    // Deadline validation
    if (options.deadlineMs !== undefined) {
      if (!Number.isInteger(options.deadlineMs) || options.deadlineMs < this.deps.clock.now()) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'options.deadlineMs must be integer >= current time' }
        };
      }
    }

    // MaxLatency validation
    if (options.maxLatencyMs !== undefined) {
      if (!Number.isInteger(options.maxLatencyMs) || options.maxLatencyMs < 1) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'options.maxLatencyMs must be integer >= 1' }
        };
      }
    }

    // Routing validation
    if (options.routing !== undefined) {
      const validRouting = ['balanced', 'primary', 'latency-biased'];
      if (!validRouting.includes(options.routing)) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: `options.routing must be one of: ${validRouting.join(', ')}` }
        };
      }
    }

    // Params JSON serialization test
    if (params !== undefined) {
      try {
        JSON.stringify(params);
      } catch (e) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'params must be JSON-serializable' }
        };
      }

      // Check for BigInt (not allowed)
      const paramString = JSON.stringify(params);
      if (paramString.includes('BigInt')) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'BigInt in params not allowed, use decimal strings' }
        };
      }
    }

    return { ok: true };
  }

  _selectEndpoint(routing) {
    const healthyEndpoints = this.config.endpoints.filter(ep => {
      const stats = this.endpointStats.get(ep.url);
      return stats.state !== 'DOWN';
    });

    if (healthyEndpoints.length === 0) {
      return this.config.endpoints[0]; // Fallback
    }

    switch (routing) {
      case 'primary':
        return healthyEndpoints[0];
      
      case 'latency-biased':
        return healthyEndpoints.reduce((fastest, current) => {
          const fastestStats = this.endpointStats.get(fastest.url);
          const currentStats = this.endpointStats.get(current.url);
          return currentStats.emaLatencyMs < fastestStats.emaLatencyMs ? current : fastest;
        });
      
      case 'balanced':
      default:
        // Weighted selection based on deterministic hash of invocation count
        const hash = this.invocationCount % healthyEndpoints.length;
        return healthyEndpoints[hash];
    }
  }

  _getSimulatedLatency(endpoint, method) {
    const stats = this.endpointStats.get(endpoint.url);
    const baseLatency = stats.emaLatencyMs;
    
    // Deterministic jitter based on method and invocation count
    const jitter = ((this.invocationCount + method.length) % 20) - 10; // -10 to +10ms
    
    // Scenario-specific modifications
    let multiplier = 1;
    if (this.scenario === 'slow-network') multiplier = 3;
    if (this.scenario === 'timeout') multiplier = 10;
    
    return Math.max(1, Math.round(baseLatency * multiplier + jitter));
  }

  _generateResponse(method, params, requestId) {
    // Deterministic response generation based on method
    const seed = this._hashString(method + requestId) % 1000000;
    
    // Common Solana RPC methods with realistic responses
    const methodResponses = {
      'getAccountInfo': {
        value: {
          data: ['base64encodeddata', 'base64'],
          executable: false,
          lamports: 1000000 + seed,
          owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          rentEpoch: 361
        }
      },
      
      'getTokenLargestAccounts': {
        value: [
          { address: `${seed}TokenAccount1`, amount: `${1000000 + seed}`, decimals: 6, uiAmount: (1000000 + seed) / 1000000 },
          { address: `${seed}TokenAccount2`, amount: `${500000 + seed}`, decimals: 6, uiAmount: (500000 + seed) / 1000000 }
        ]
      },

      'getTokenSupply': {
        value: { amount: `${10000000 + seed}`, decimals: 6, uiAmount: (10000000 + seed) / 1000000 }
      },

      'getMultipleAccounts': {
        value: Array.from({ length: (params?.length || 1) }, (_, i) => ({
          data: [`data${seed + i}`, 'base64'],
          executable: false,
          lamports: 1000000 + seed + i,
          owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        }))
      },

      'getProgramAccounts': {
        value: [
          {
            account: {
              data: [`programdata${seed}`, 'base64'],
              executable: false,
              lamports: 2039280,
              owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            },
            pubkey: `ProgramAccount${seed}`
          }
        ]
      }
    };

    // Precision test scenarios
    if (this.scenario === 'precision-test') {
      return {
        value: {
          amount: '999999999999999999999', // Large number as string
          decimals: 18,
          precisionTest: true
        }
      };
    }

    return methodResponses[method] || { result: `mock_result_${seed}` };
  }

  _getEndpointState(url, scenario) {
    switch (scenario) {
      case 'all-endpoints-down':
        return 'DOWN';
      case 'degraded':
        return url.includes('primary') ? 'HEALTHY' : 'DEGRADED';
      case 'mixed-health':
        const hash = this._hashString(url) % 3;
        return ['HEALTHY', 'DEGRADED', 'DOWN'][hash];
      default:
        return 'HEALTHY';
    }
  }

  _initializeScenario(scenario) {
    // Update endpoint states based on scenario
    for (const [url, stats] of this.endpointStats) {
      stats.state = this._getEndpointState(url, scenario);
      
      // Adjust error rates
      switch (scenario) {
        case 'degraded':
          stats.recentErrorRate = 0.15;
          break;
        case 'all-endpoints-down':
          stats.recentErrorRate = 1.0;
          break;
        default:
          stats.recentErrorRate = 0.02;
      }
    }
  }

  _updateEMA(currentEMA, newValue, alpha = 0.1) {
    return currentEMA * (1 - alpha) + newValue * alpha;
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  _logCall(requestId, method, outcome, durationMs) {
    const logEntry = {
      requestId,
      method,
      outcome,
      durationMs: Math.round(durationMs * 100) / 100,
      timestamp: this.deps.clock.now(),
      inFlightCount: this.inFlightCount
    };

    this.capturedLogs.push(logEntry);

    // Also log through injected logger
    this.deps.logger.info('RPC call completed', logEntry);
  }

  async _recordBreakerSuccess(requestId, durationMs) {
    if (this.deps.breaker) {
      await this.deps.breaker.recordSuccess({ requestId, durationMs });
    }
  }

  async _recordBreakerFailure(requestId, durationMs, errorCode, message) {
    if (this.deps.breaker) {
      await this.deps.breaker.recordFailure({ requestId, durationMs, errorCode, message });
    }
  }
}

export { RpcPoolFake };