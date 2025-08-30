Fix the broken load balancing algorithm that causes endpoint overload and poor request distribution.

CRITICAL PERFORMANCE FAILURE:
- Current: Simple endpoint selection ignores load, latency, and capacity
- Problem: Requests pile up on single endpoint while others remain idle  
- Impact: Endpoint overload triggers circuit breakers unnecessarily
- Result: System fails under load despite having available endpoint capacity

SINGLE FOCUS: INTELLIGENT LOAD BALANCING

FILE TO MODIFY:
- src/detection/transport/rpc-connection-pool.js

SPECIFIC METHOD TO REPLACE:
- Method: selectEndpoint() (approximately line 180-220)
- Current logic: Basic priority + simple availability check
- Required: Multi-factor weighted scoring with capacity awareness

CURRENT BROKEN PATTERN:
The existing selectEndpoint() method likely uses:
- Simple priority ordering without load consideration
- Binary available/unavailable logic
- No consideration of endpoint capacity utilization
- No latency-based selection optimization
- No rate limit token awareness in selection

REQUIRED IMPLEMENTATION:

1. **Replace selectEndpoint() Method with Intelligent Algorithm:**
```javascript
selectBestEndpoint() {
  // Filter endpoints that are actually available
  const available = this.endpoints.filter(ep => {
    // Circuit breaker check - skip OPEN breakers
    if (ep.breaker.state === 'OPEN') {
      // Check if cooldown period has passed
      const cooldownMs = 30000; // 30 seconds
      if (Date.now() - ep.breaker.lastFailure > cooldownMs) {
        ep.breaker.state = 'HALF_OPEN';
        ep.breaker.halfOpenTests = 0;
      } else {
        return false;
      }
    }
    
    // Limit half-open tests to prevent thrashing
    if (ep.breaker.state === 'HALF_OPEN' && ep.breaker.halfOpenTests >= 2) {
      return false;
    }
    
    // Health check - skip unhealthy endpoints
    if (!ep.health.healthy && ep.health.lastCheck > 0) {
      return false;
    }
    
    // Rate limit check - skip endpoints with no tokens
    if (!ep.rateLimiter.canConsume(1)) {
      return false;
    }
    
    // Capacity check - skip completely saturated endpoints
    if (ep.stats.inFlight >= ep.config.maxConcurrent) {
      return false;
    }
    
    return true;
  });
  
  if (available.length === 0) {
    return null;
  }
  
  // If only one endpoint available, use it
  if (available.length === 1) {
    return available[0];
  }
  
  // Multi-factor scoring for intelligent selection
  let bestEndpoint = null;
  let bestScore = -1;
  
  for (const endpoint of available) {
    const score = this.calculateEndpointScore(endpoint);
    
    if (score > bestScore) {
      bestScore = score;
      bestEndpoint = endpoint;
    }
  }
  
  return bestEndpoint;
}
```

2. **Add Multi-Factor Scoring Method:**
```javascript
calculateEndpointScore(endpoint) {
  // Factor 1: Capacity utilization (higher available capacity = better)
  const capacityFactor = 1 - (endpoint.stats.inFlight / endpoint.config.maxConcurrent);
  const capacityScore = Math.pow(capacityFactor, 2) * 100; // Exponential preference for available capacity
  
  // Factor 2: Latency performance (lower latency = better)
  const targetLatency = 30; // Target 30ms latency
  const actualLatency = endpoint.health.latency || targetLatency;
  const latencyScore = Math.max(0, Math.min(100, (targetLatency / actualLatency) * 100));
  
  // Factor 3: Rate limit availability (more tokens = better)
  const rateLimitStatus = endpoint.rateLimiter.getStatus();
  const rateLimitScore = (rateLimitStatus.tokens / rateLimitStatus.maxTokens) * 100;
  
  // Factor 4: Success rate history (higher success = better)
  const totalCalls = endpoint.stats.calls || 1;
  const successRate = endpoint.stats.successes / totalCalls;
  const successScore = successRate * 100;
  
  // Factor 5: Priority weight (endpoint configuration preference)
  const priorityScore = endpoint.config.weight || 10;
  
  // Factor 6: Circuit breaker state bonus/penalty
  const breakerScore = endpoint.breaker.state === 'CLOSED' ? 20 : 
                      endpoint.breaker.state === 'HALF_OPEN' ? 10 : 0;
  
  // Weighted combination of all factors
  const compositeScore = (
    capacityScore * 0.30 +     // 30% - Most important: available capacity
    latencyScore * 0.25 +      // 25% - Critical: response speed
    rateLimitScore * 0.20 +    // 20% - Important: rate limit headroom  
    successScore * 0.15 +      // 15% - Moderate: historical reliability
    priorityScore * 0.05 +     // 5% - Minor: configuration preference
    breakerScore * 0.05        // 5% - Minor: circuit breaker bonus
  );
  
  return compositeScore;
}
```

3. **Update Method References:**
Replace any calls to the old selectEndpoint() method:
- In executeRequest() method: change to `selectBestEndpoint()`
- Maintain same return value contract (endpoint object or null)

4. **Add Load Distribution Tracking:**
```javascript
// Add to getStats() method for monitoring
getLoadDistribution() {
  const distribution = {};
  let totalRequests = 0;
  
  for (const endpoint of this.endpoints) {
    const requests = endpoint.stats.calls;
    totalRequests += requests;
    distribution[endpoint.url] = {
      requests,
      percentage: 0, // Calculate after total known
      inFlight: endpoint.stats.inFlight,
      capacity: endpoint.config.maxConcurrent,
      utilization: (endpoint.stats.inFlight / endpoint.config.maxConcurrent * 100).toFixed(1) + '%'
    };
  }
  
  // Calculate percentages
  for (const url in distribution) {
    distribution[url].percentage = ((distribution[url].requests / totalRequests) * 100).toFixed(1) + '%';
  }
  
  return distribution;
}
```

VALIDATION REQUIREMENTS:
Create validation that proves intelligent load balancing works:

1. **Capacity-Aware Distribution**
   - Send 200+ requests across all endpoints over 60 seconds
   - Verify that higher-capacity endpoints receive proportionally more requests
   - Show that no endpoint exceeds 80% capacity utilization during normal load
   - Confirm requests avoid saturated endpoints

2. **Latency-Based Selection**
   - Create artificial latency difference between endpoints (simulate network conditions)
   - Verify system prefers faster endpoints over slower ones
   - Show that latency measurements influence endpoint selection decisions
   - Confirm average response time improves with intelligent selection

3. **Rate Limit Awareness**
   - Test behavior when endpoints approach rate limits
   - Verify requests automatically shift to endpoints with available rate limit tokens
   - Show that rate-limited endpoints are avoided until tokens replenish
   - Confirm zero rate limit violations during intelligent distribution

4. **Circuit Breaker Integration**
   - Simulate endpoint failures to trigger circuit breaker
   - Verify load automatically redistributes to healthy endpoints
   - Test half-open state behavior and gradual recovery
   - Show that failed endpoints don't receive requests until proven healthy

5. **Load Distribution Fairness**
   - Measure request distribution across all three endpoints
   - Verify distribution matches endpoint capacity and performance ratios
   - Show that no endpoint is consistently overloaded or underutilized  
   - Confirm system adapts to changing endpoint conditions

SUCCESS CRITERIA:
- Request distribution matches endpoint capacity ratios (Helius 60%, ChainStack 30%, Public 10%)
- No endpoint exceeds 80% capacity utilization during sustained load
- System automatically avoids slow, rate-limited, or failed endpoints
- Average response time improves by 15-30% through optimal endpoint selection
- Load balancing adapts in real-time to changing endpoint conditions

INTEGRATION REQUIREMENTS:
- Maintain existing RpcConnectionPool interface and method signatures
- Preserve compatibility with agent integration and rate limiting fixes
- Keep all existing error handling and statistics tracking
- Do not break circuit breaker or health monitoring functionality

TRADING SYSTEM CONTEXT:
Intelligent load balancing is critical for meme coin trading during viral events:
- Prevents endpoint overload when analyzing 50-100+ tokens simultaneously
- Ensures fastest possible response times by using optimal endpoints
- Maintains system reliability when individual endpoints have issues
- Maximizes throughput by efficiently utilizing all available RPC capacity

TEST SCENARIOS:
1. **Normal Trading:** 10-20 concurrent requests distributed optimally
2. **Viral Event:** 100+ concurrent requests with intelligent load balancing
3. **Endpoint Degradation:** One endpoint becomes slow, load shifts to others  
4. **Rate Limit Pressure:** Endpoints approaching limits, automatic redistribution
5. **Mixed Conditions:** Simultaneous latency differences, capacity limits, and failures

Run comprehensive load balancing validation and demonstrate that the system intelligently distributes load based on endpoint capacity, performance, and availability while maintaining optimal response times.