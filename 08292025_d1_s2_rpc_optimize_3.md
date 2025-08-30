Fix the overly aggressive circuit breaker that incorrectly opens on rate limiting and load conditions instead of actual endpoint failures.

CRITICAL PERFORMANCE FAILURE:
- Current: Circuit breaker opens on 429 rate limit errors (incorrect behavior)
- Problem: Rate limiting treated as endpoint failure instead of backoff signal
- Impact: Healthy endpoints marked as failed, reducing available capacity
- Result: System capacity artificially reduced during high-load periods (viral events)

SINGLE FOCUS: INTELLIGENT CIRCUIT BREAKER LOGIC

FILE TO MODIFY:
- src/detection/transport/rpc-connection-pool.js

SPECIFIC METHODS TO REPLACE:
- Method: handleFailure() (approximately line 340-380)
- Method: classifyError() (approximately line 400-420) 
- Related: Circuit breaker state logic in selectBestEndpoint()

CURRENT BROKEN PATTERN:
The existing circuit breaker logic treats all errors equally:
- 429 rate limit errors trigger circuit breaker opening (WRONG)
- Timeout during high load treated as endpoint failure (WRONG)
- Binary OPEN/CLOSED states without gradual recovery (SUBOPTIMAL)
- No distinction between temporary vs permanent failure conditions

REQUIRED IMPLEMENTATION:

1. **Enhance Error Classification Method:**
```javascript
classifyError(error) {
  const message = error.message.toLowerCase();
  const status = error.status || error.statusCode;
  
  // Rate limiting - should trigger backoff, not circuit opening
  if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return { type: 'rate_limit', severity: 'temporary', circuitImpact: 'none' };
  }
  
  // Timeout errors - context dependent
  if (message.includes('timeout') || message.includes('etimedout')) {
    return { type: 'timeout', severity: 'moderate', circuitImpact: 'conditional' };
  }
  
  // Network connectivity issues - actual failures
  if (message.includes('econnrefused') || message.includes('enotfound') || 
      message.includes('network') || message.includes('dns')) {
    return { type: 'network', severity: 'high', circuitImpact: 'immediate' };
  }
  
  // Server errors - distinguish between types
  if (status >= 500 || message.includes('500') || message.includes('502') || 
      message.includes('503') || message.includes('504')) {
    return { type: 'server_error', severity: 'high', circuitImpact: 'gradual' };
  }
  
  // Invalid response/parsing errors
  if (message.includes('invalid json') || message.includes('parse') || 
      message.includes('malformed')) {
    return { type: 'response_error', severity: 'moderate', circuitImpact: 'gradual' };
  }
  
  // Unknown errors - treat conservatively
  return { type: 'unknown', severity: 'moderate', circuitImpact: 'gradual' };
}
```

2. **Replace handleFailure() with Intelligent Logic:**
```javascript
handleFailure(request, error, endpoint = null) {
  if (!endpoint) {
    // Find the endpoint that failed
    endpoint = this.endpoints.find(ep => ep.stats.inFlight > 0) || 
               this.endpoints[0]; // fallback
  }
  
  const errorInfo = this.classifyError(error);
  
  // Update endpoint statistics
  endpoint.stats.inFlight = Math.max(0, endpoint.stats.inFlight - 1);
  endpoint.stats.failures++;
  
  // Handle different error types with appropriate responses
  switch (errorInfo.type) {
    case 'rate_limit':
      this.handleRateLimitError(endpoint, errorInfo);
      break;
      
    case 'timeout':
      this.handleTimeoutError(endpoint, errorInfo);
      break;
      
    case 'network':
    case 'server_error':
      this.handleActualFailure(endpoint, errorInfo);
      break;
      
    case 'response_error':
    case 'unknown':
      this.handleUnknownFailure(endpoint, errorInfo);
      break;
  }
  
  // Determine if request should be retried
  return this.shouldRetryRequest(request, errorInfo, endpoint);
}
```

3. **Add Specialized Error Handlers:**
```javascript
handleRateLimitError(endpoint, errorInfo) {
  // Rate limit errors should NOT open circuit breaker
  // Instead, reduce available rate limit tokens temporarily
  if (endpoint.rateLimiter) {
    endpoint.rateLimiter.tokens = Math.max(0, endpoint.rateLimiter.tokens - 10);
  }
  
  // Apply temporary backoff without circuit breaker impact
  endpoint.rateLimitBackoff = {
    until: Date.now() + 5000, // 5 second backoff
    multiplier: (endpoint.rateLimitBackoff?.multiplier || 1) * 1.5
  };
  
  // Log rate limit event but don't count toward circuit breaker
  console.log(`Rate limit backoff applied to endpoint ${endpoint.index}`);
}

handleTimeoutError(endpoint, errorInfo) {
  // Timeout during high system load should not immediately open circuit
  const systemLoad = this.globalInFlight / this.config.maxGlobalInFlight;
  
  if (systemLoad > 0.8) {
    // High system load - timeout is likely load-related, not endpoint failure
    endpoint.loadTimeouts = (endpoint.loadTimeouts || 0) + 1;
    
    // Only count toward circuit breaker if excessive load timeouts
    if (endpoint.loadTimeouts > 10) {
      this.incrementCircuitBreakerFailure(endpoint, 0.5); // Half weight
    }
  } else {
    // Low system load - timeout likely indicates endpoint problem
    this.incrementCircuitBreakerFailure(endpoint, 1.0); // Full weight
  }
}

handleActualFailure(endpoint, errorInfo) {
  // These are real endpoint failures that should impact circuit breaker
  this.incrementCircuitBreakerFailure(endpoint, 1.0);
  
  // Set last failure time for circuit breaker cooldown calculations
  endpoint.breaker.lastFailure = Date.now();
}

handleUnknownFailure(endpoint, errorInfo) {
  // Conservative approach - count toward circuit breaker but with reduced weight
  this.incrementCircuitBreakerFailure(endpoint, 0.7);
}
```

4. **Add Gradual Circuit Breaker Logic:**
```javascript
incrementCircuitBreakerFailure(endpoint, weight = 1.0) {
  endpoint.breaker.failures += weight;
  endpoint.breaker.consecutiveSuccesses = 0;
  
  // Dynamic threshold based on error patterns
  const baseThreshold = 5;
  const loadFactor = this.globalInFlight / this.config.maxGlobalInFlight;
  const adjustedThreshold = baseThreshold * (1 + loadFactor); // Higher threshold during load
  
  if (endpoint.breaker.failures >= adjustedThreshold && endpoint.breaker.state === 'CLOSED') {
    endpoint.breaker.state = 'OPEN';
    endpoint.breaker.openedAt = Date.now();
    endpoint.breaker.cooldownMs = Math.min(60000, 10000 * Math.pow(1.5, endpoint.breaker.openCount || 0));
    endpoint.breaker.openCount = (endpoint.breaker.openCount || 0) + 1;
    
    console.log(`Circuit breaker OPENED for endpoint ${endpoint.index}, cooldown: ${endpoint.breaker.cooldownMs}ms`);
  }
}
```

5. **Add Request Retry Decision Logic:**
```javascript
shouldRetryRequest(request, errorInfo, endpoint) {
  // Don't retry if too many attempts already
  if (request.attempts >= 3) {
    return false;
  }
  
  // Retry logic based on error type
  switch (errorInfo.type) {
    case 'rate_limit':
      return true; // Always retry rate limit errors with backoff
      
    case 'timeout':
      // Retry timeouts unless they're excessive
      return (endpoint.loadTimeouts || 0) < 5;
      
    case 'network':
      return false; // Network errors unlikely to resolve quickly
      
    case 'server_error':
      return Math.random() > 0.5; // 50% retry chance for server errors
      
    default:
      return true; // Conservative retry for unknown errors
  }
}
```

VALIDATION REQUIREMENTS:
Create validation that proves intelligent circuit breaker logic works:

1. **Rate Limit Error Handling**
   - Simulate 429 rate limit responses from RPC providers
   - Verify circuit breaker does NOT open on rate limit errors
   - Show that backoff mechanism is applied instead of circuit opening
   - Confirm endpoints remain available after rate limit recovery

2. **Load vs Failure Distinction**
   - Test timeout errors during high system load (80%+ capacity)
   - Verify timeouts during load don't immediately open circuit breaker
   - Test timeout errors during low system load (confirm they DO impact breaker)
   - Show adaptive threshold behavior based on system load

3. **Actual Failure Detection**
   - Simulate real network failures (connection refused, DNS failures)
   - Verify circuit breaker opens appropriately for actual endpoint failures
   - Test server error responses (500, 502, 503) and gradual circuit response
   - Confirm circuit breaker protects system from truly failed endpoints

4. **Gradual Recovery Behavior**
   - Test circuit breaker cooldown periods and half-open state
   - Verify gradual recovery with limited test requests
   - Show that recovered endpoints return to full service progressively
   - Confirm circuit breaker adapts cooldown based on failure history

5. **System Capacity Preservation**
   - During viral event simulation (100+ concurrent requests)
   - Show that healthy endpoints remain available despite rate limiting
   - Verify system maintains maximum possible capacity during high load
   - Confirm no artificial capacity reduction due to incorrect circuit opening

SUCCESS CRITERIA:
- Zero circuit breaker openings due to rate limit (429) errors
- Timeout-based circuit openings reduce by 70%+ during high system load  
- Actual endpoint failures still trigger circuit breaker protection appropriately
- System maintains 90%+ of available RPC capacity during rate limit conditions
- Circuit breaker recovery time adapts based on failure patterns and system load

INTEGRATION REQUIREMENTS:
- Maintain existing RpcConnectionPool interface and statistics
- Preserve compatibility with agent integration, rate limiting, and load balancing
- Keep existing health monitoring and endpoint selection logic
- Do not break request queuing or backpressure mechanisms

TRADING SYSTEM CONTEXT:
Intelligent circuit breaker logic is critical during viral meme events:
- Prevents healthy endpoints from being incorrectly marked as failed
- Maintains maximum system capacity when analyzing 50-100+ tokens
- Distinguishes between temporary conditions (rate limits) and real failures
- Ensures system degrades gracefully rather than losing capacity artificially

TEST SCENARIOS:
1. **Rate Limit Storm:** Multiple endpoints hit rate limits simultaneously
2. **High Load Timeouts:** System at 90%+ capacity with occasional timeouts  
3. **Mixed Failure Conditions:** Rate limits + real failures + high load
4. **Endpoint Recovery:** Circuit breaker recovery after various failure types
5. **Sustained Viral Event:** 10+ minutes of high load with mixed error conditions

Run comprehensive circuit breaker validation and demonstrate that the system correctly distinguishes between temporary conditions and actual endpoint failures while preserving maximum available capacity.