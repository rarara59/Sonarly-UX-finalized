Implement hedged requests to improve P95 latency and reliability by sending parallel requests to different endpoints when primary responses are slow.

CRITICAL PERFORMANCE PROBLEM:
- Current: Single request to one endpoint with failover only after complete failure
- Result: High P95 latency when individual endpoints are slow but not failed
- Root cause: No proactive redundancy for tail latency scenarios during high load

SINGLE FOCUS: HEDGED REQUEST IMPLEMENTATION

FILE TO MODIFY:
- src/detection/transport/rpc-connection-pool.js

SPECIFIC IMPLEMENTATION LOCATION:
- Modify executeNewRequest() method to support hedged requests
- Add hedging logic before existing request execution
- Integrate with existing load balancing and circuit breaker systems

CURRENT LATENCY PROBLEM:
When primary endpoint is slow (but not failed):
```javascript
// Request to primary endpoint takes 300ms (slow but successful)
// System waits entire 300ms instead of trying backup endpoints
// P95 latency suffers even though other endpoints could respond in 50ms
```

REQUIRED IMPLEMENTATION:

1. **Create Hedged Request Manager:**
```javascript
class HedgedRequestManager {
  constructor() {
    this.activeHedges = new Map(); // requestId -> hedge tracking
    this.stats = {
      hedgesTriggered: 0,
      hedgesWon: 0,
      hedgesCancelled: 0,
      latencyImprovement: 0,
      primaryWins: 0
    };
  }
  
  calculateHedgingDelay(endpoint) {
    // Use recent P95 latency as hedge trigger point
    const recentLatencies = endpoint.stats.latencies.slice(-20);
    if (recentLatencies.length < 5) {
      return parseInt(process.env.RPC_HEDGING_DELAY_MS) || 200;
    }
    
    // Calculate P95 from recent samples
    const sorted = recentLatencies.sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95Latency = sorted[p95Index] || 200;
    
    // Hedge at 75% of P95 to catch tail latency
    return Math.max(50, Math.min(500, p95Latency * 0.75));
  }
  
  shouldHedge(request, primaryEndpoint) {
    // Skip hedging if disabled
    if (process.env.RPC_HEDGING_ENABLED !== 'true') {
      return false;
    }
    
    // Skip hedging for retries
    if (request.attempts > 0) {
      return false;
    }
    
    // Skip if not enough alternative endpoints
    const availableEndpoints = this.getAvailableEndpoints();
    if (availableEndpoints.length < 2) {
      return false;
    }
    
    // Skip for methods that shouldn't be hedged
    const nonHedgeMethods = ['sendTransaction', 'simulateTransaction'];
    if (nonHedgeMethods.includes(request.method)) {
      return false;
    }
    
    return true;
  }
  
  createHedge(requestId, primaryPromise, request, primaryEndpoint, alternativeEndpoints) {
    const hedgeDelay = this.calculateHedgingDelay(primaryEndpoint);
    const maxHedges = parseInt(process.env.RPC_HEDGING_MAX_EXTRA) || 1;
    
    const hedgeInfo = {
      primaryPromise,
      hedgePromises: [],
      timers: [],
      resolved: false,
      winner: null,
      startTime: Date.now()
    };
    
    this.activeHedges.set(requestId, hedgeInfo);
    
    // Set up hedging timer
    const hedgeTimer = setTimeout(() => {
      if (hedgeInfo.resolved) return;
      
      // Select alternative endpoint
      const altEndpoint = this.selectAlternativeEndpoint(
        primaryEndpoint, 
        alternativeEndpoints
      );
      
      if (altEndpoint) {
        this.stats.hedgesTriggered++;
        const hedgePromise = this.executeHedgeRequest(request, altEndpoint);
        hedgeInfo.hedgePromises.push(hedgePromise);
        
        // Set up additional hedges if configured
        if (hedgeInfo.hedgePromises.length < maxHedges) {
          const additionalTimer = setTimeout(() => {
            if (hedgeInfo.resolved) return;
            
            const secondAltEndpoint = this.selectAlternativeEndpoint(
              primaryEndpoint,
              alternativeEndpoints.filter(ep => ep !== altEndpoint)
            );
            
            if (secondAltEndpoint) {
              const secondHedge = this.executeHedgeRequest(request, secondAltEndpoint);
              hedgeInfo.hedgePromises.push(secondHedge);
            }
          }, hedgeDelay);
          
          hedgeInfo.timers.push(additionalTimer);
        }
      }
    }, hedgeDelay);
    
    hedgeInfo.timers.push(hedgeTimer);
    
    return hedgeInfo;
  }
  
  async raceWithHedges(requestId) {
    const hedgeInfo = this.activeHedges.get(requestId);
    if (!hedgeInfo) return hedgeInfo.primaryPromise;
    
    try {
      // Race primary against all hedges
      const allPromises = [
        hedgeInfo.primaryPromise.then(result => ({ result, source: 'primary' })),
        ...hedgeInfo.hedgePromises.map((p, i) => 
          p.then(result => ({ result, source: `hedge-${i}` }))
        )
      ];
      
      const winner = await Promise.race(allPromises);
      
      // Mark as resolved and cleanup
      hedgeInfo.resolved = true;
      hedgeInfo.winner = winner.source;
      
      const latencyImprovement = this.calculateLatencyImprovement(hedgeInfo);
      this.stats.latencyImprovement += latencyImprovement;
      
      if (winner.source === 'primary') {
        this.stats.primaryWins++;
      } else {
        this.stats.hedgesWon++;
      }
      
      this.cleanup(requestId);
      return winner.result;
      
    } catch (error) {
      // If all requests fail, return the error
      this.cleanup(requestId);
      throw error;
    }
  }
  
  cleanup(requestId) {
    const hedgeInfo = this.activeHedges.get(requestId);
    if (!hedgeInfo) return;
    
    // Clear all timers
    hedgeInfo.timers.forEach(timer => clearTimeout(timer));
    
    // Cancel remaining requests (best effort)
    hedgeInfo.hedgePromises.forEach(promise => {
      if (promise.cancel) {
        promise.cancel();
        this.stats.hedgesCancelled++;
      }
    });
    
    this.activeHedges.delete(requestId);
  }
  
  selectAlternativeEndpoint(primaryEndpoint, availableEndpoints) {
    // Select different endpoint with best score
    const alternatives = availableEndpoints.filter(ep => 
      ep.index !== primaryEndpoint.index &&
      ep.breaker.state !== 'OPEN' &&
      ep.health.healthy &&
      ep.stats.inFlight < ep.config.maxConcurrent
    );
    
    if (alternatives.length === 0) return null;
    
    // Choose endpoint with lowest current load
    return alternatives.sort((a, b) => {
      const aLoad = a.stats.inFlight / a.config.maxConcurrent;
      const bLoad = b.stats.inFlight / b.config.maxConcurrent;
      return aLoad - bLoad;
    })[0];
  }
  
  getStats() {
    const totalRequests = this.stats.hedgesTriggered || 1;
    return {
      ...this.stats,
      hedgeSuccessRate: (this.stats.hedgesWon / totalRequests) * 100,
      avgLatencyImprovement: this.stats.latencyImprovement / totalRequests
    };
  }
}
```

2. **Integrate Hedging into RPC Pool:**
```javascript
// In RpcConnectionPoolV2 constructor:
this.hedgeManager = new HedgedRequestManager();

// Modify executeNewRequest to support hedging:
async executeNewRequest(method, params, options) {
  if (this.requestId >= Number.MAX_SAFE_INTEGER) {
    this.requestId = 0;
  }
  const requestId = ++this.requestId;
  
  const request = {
    id: requestId,
    method,
    params,
    options,
    timestamp: Date.now(),
    attempts: 0,
    deferred: this.createDeferred()
  };
  
  // Try immediate execution with hedging
  try {
    const result = await this.tryImmediateExecutionWithHedging(request);
    return result;
  } catch (capacityError) {
    return this.queueRequestWithBackpressure(request);
  }
}

async tryImmediateExecutionWithHedging(request) {
  // Check global capacity
  if (this.globalInFlight >= this.config.maxGlobalInFlight) {
    throw new Error('Global capacity exceeded - queuing required');
  }
  
  // Find primary endpoint
  const primaryEndpoint = this.selectBestEndpoint();
  if (!primaryEndpoint) {
    throw new Error('No available endpoints - queuing required');
  }
  
  // Execute primary request
  const primaryPromise = this.executeRequestOnEndpoint(request, primaryEndpoint);
  
  // Set up hedging if conditions are met
  if (this.hedgeManager.shouldHedge(request, primaryEndpoint)) {
    const availableEndpoints = this.endpoints.filter(ep => 
      ep.breaker.state !== 'OPEN' && ep.health.healthy
    );
    
    const hedgeInfo = this.hedgeManager.createHedge(
      request.id,
      primaryPromise,
      request,
      primaryEndpoint,
      availableEndpoints
    );
    
    // Race primary against hedges
    return await this.hedgeManager.raceWithHedges(request.id);
  }
  
  // No hedging - return primary result
  return await primaryPromise;
}
```

3. **Add Configuration Support:**
```javascript
// Add to .env:
RPC_HEDGING_ENABLED=true
RPC_HEDGING_DELAY_MS=200
RPC_HEDGING_MAX_EXTRA=1
RPC_HEDGING_ABORT_ON_SUCCESS=true
```

4. **Update Statistics Integration:**
```javascript
getStats() {
  const existingStats = /* existing getStats logic */;
  
  return {
    ...existingStats,
    coalescing: this.coalescingCache.getStats(),
    batching: this.batchManager.getStats(),
    hedging: this.hedgeManager.getStats()
  };
}
```

VALIDATION REQUIREMENTS:
Create validation that proves hedged requests improve tail latency and reliability:

1. **Hedging Trigger Verification**
   - Simulate slow primary endpoint (300ms response time)
   - Verify hedge request triggers after calculated delay (P95 * 0.75)
   - Show primary and hedge requests execute in parallel
   - Confirm faster response wins and slower request is cancelled

2. **Latency Improvement Measurement**
   - Test scenario: Primary endpoint 300ms, alternative endpoint 50ms
   - Verify system returns result in ~50ms instead of waiting 300ms
   - Show P95 latency improvement when hedging is enabled vs disabled
   - Measure latency improvement statistics over multiple requests

3. **Alternative Endpoint Selection**
   - Verify hedges use different endpoints than primary
   - Show hedge endpoint selection considers load balancing and health
   - Confirm hedges skip failed or overloaded endpoints
   - Test hedge selection when multiple alternatives available

4. **Resource Management**
   - Verify hedge requests are cancelled when primary wins
   - Show proper cleanup of timers and promise racing
   - Confirm no memory leaks during sustained hedged operations
   - Test hedge limits (max 1-2 extra requests per primary)

5. **Method-Specific Hedging**
   - Verify read-only methods (getSlot, getAccountInfo) support hedging
   - Show write methods (sendTransaction) skip hedging appropriately
   - Test hedging disabled for retry attempts
   - Confirm configuration can enable/disable hedging globally

SUCCESS CRITERIA:
- Hedged requests improve P95 latency by 20-50% when endpoints have variable response times
- Hedge requests trigger at calculated delay based on endpoint P95 latency
- First response wins, slower responses are cancelled properly
- Hedging respects endpoint health and load balancing
- Resource cleanup prevents memory leaks during hedge operations
- Configuration allows hedging to be enabled/disabled per deployment

INTEGRATION REQUIREMENTS:
- Maintain all existing RpcConnectionPool functionality
- Preserve coalescing, batching, rate limiting, load balancing, and circuit breaker logic
- Keep existing error handling and retry mechanisms
- Do not break agent integration, monitoring, or statistics collection

TRADING SYSTEM CONTEXT:
Hedged requests are critical during viral meme events:
- High load causes variable endpoint response times
- Tail latency (P95/P99) impacts trading decision speed
- Hedging ensures sub-100ms responses even when primary endpoints are slow
- Improved reliability during market volatility when fastest response matters

ENVIRONMENT VARIABLES TO ADD:
```bash
# ========= HEDGED REQUESTS =========
RPC_HEDGING_ENABLED=true
RPC_HEDGING_DELAY_MS=200
RPC_HEDGING_MAX_EXTRA=1
RPC_HEDGING_ABORT_ON_SUCCESS=true
```

Run comprehensive hedging validation and demonstrate 20-50% P95 latency improvement when primary endpoints are slow, while maintaining proper resource cleanup and compatibility with all existing functionality including coalescing and batching.