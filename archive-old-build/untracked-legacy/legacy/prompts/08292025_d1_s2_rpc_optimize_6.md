Implement request coalescing to reduce RPC call volume by 5-10x during viral meme event traffic spikes.

CRITICAL PERFORMANCE PROBLEM:
- Current: Multiple agents request identical data simultaneously (100+ duplicate getTokenSupply calls)
- Result: 1.8% burst success rate, 54% sustained success rate during viral events
- Root cause: No deduplication of identical RPC requests across concurrent operations

SINGLE FOCUS: IN-FLIGHT REQUEST COALESCING

FILE TO MODIFY:
- src/detection/transport/rpc-connection-pool.js

SPECIFIC IMPLEMENTATION LOCATION:
- Method: call() (approximately line 80-120)
- Add coalescing layer before request execution
- Implement request deduplication with TTL-based cache

CURRENT PROBLEM PATTERN:
Multiple agents simultaneously call:
```javascript
pool.call('getTokenSupply', ['TokenMintA']) // Agent 1
pool.call('getTokenSupply', ['TokenMintA']) // Agent 2 (duplicate)
pool.call('getTokenSupply', ['TokenMintA']) // Agent 3 (duplicate)
```
This creates 3 identical RPC calls when 1 would suffice.

REQUIRED IMPLEMENTATION:

1. **Create Request Coalescing Cache:**
```javascript
class RequestCoalescingCache {
  constructor(defaultTTL = 250) {
    this.cache = new Map(); // key -> { promise, expiresAt, requestCount }
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      coalescedRequests: 0,
      cacheSize: 0
    };
  }
  
  generateKey(method, params, commitment = 'confirmed') {
    // Create deterministic key for identical requests
    return JSON.stringify({ method, params: params || [], commitment });
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    this.stats.hits++;
    entry.requestCount++;
    this.stats.coalescedRequests++;
    return entry.promise;
  }
  
  set(key, promise, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      promise,
      expiresAt,
      requestCount: 1,
      createdAt: Date.now()
    });
    
    this.stats.misses++;
    this.cleanup(); // Remove expired entries
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    this.stats.cacheSize = this.cache.size;
  }
  
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100,
      coalescingEfficiency: this.stats.coalescedRequests / this.stats.misses
    };
  }
}
```

2. **Integrate Coalescing into RPC Pool:**
```javascript
// In RpcConnectionPoolV2 constructor:
this.coalescingCache = new RequestCoalescingCache(
  parseInt(process.env.RPC_COALESCING_TTL_MS) || 250
);

// In call() method, add coalescing layer:
async call(method, params = [], options = {}) {
  if (this.isDestroyed) {
    throw new Error('RPC pool has been destroyed');
  }
  
  // Generate coalescing key
  const coalescingKey = this.coalescingCache.generateKey(
    method, 
    params, 
    options.commitment || 'confirmed'
  );
  
  // Check if identical request is already in flight
  const existingPromise = this.coalescingCache.get(coalescingKey);
  if (existingPromise) {
    // Return the existing promise - multiple waiters share same result
    return existingPromise;
  }
  
  // Create new request and cache the promise
  const requestPromise = this.executeNewRequest(method, params, options);
  this.coalescingCache.set(coalescingKey, requestPromise);
  
  // Clean up cache entry after completion (success or failure)
  requestPromise.finally(() => {
    // Allow cache TTL to handle cleanup naturally
    // Don't immediately delete to allow brief result sharing
  });
  
  return requestPromise;
}
```

3. **Create executeNewRequest Method:**
```javascript
async executeNewRequest(method, params, options) {
  // Handle requestId overflow
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
  
  // Execute using existing logic (tryImmediateExecution or queue)
  try {
    const result = await this.tryImmediateExecution(request);
    return result;
  } catch (capacityError) {
    return this.queueRequestWithBackpressure(request);
  }
}
```

4. **Add Configuration Support:**
```javascript
// Add to .env template:
RPC_COALESCING_ENABLED=true
RPC_COALESCING_TTL_MS=250
RPC_COALESCING_MAX_CACHE_SIZE=10000

// Add coalescing toggle:
if (process.env.RPC_COALESCING_ENABLED !== 'true') {
  // Skip coalescing, use original call() logic
  return this.executeNewRequest(method, params, options);
}
```

5. **Update Statistics Integration:**
```javascript
getStats() {
  const existingStats = /* existing getStats logic */;
  
  return {
    ...existingStats,
    coalescing: this.coalescingCache.getStats()
  };
}
```

VALIDATION REQUIREMENTS:
Create validation that proves request coalescing reduces RPC call volume dramatically:

1. **Deduplication Effectiveness**
   - Send 100 identical requests simultaneously (same method + params)
   - Verify only 1 actual RPC call is made to external endpoints
   - Show 99 requests receive the same result from coalescing cache
   - Measure coalescing hit rate (should be >90% for identical requests)

2. **TTL Behavior Verification**  
   - Send identical request, wait for TTL expiration (250ms default)
   - Send same request again after TTL expires
   - Verify second request generates new RPC call (cache miss)
   - Show that requests within TTL window share results

3. **Mixed Request Handling**
   - Send mix of identical and unique requests concurrently
   - Verify identical requests coalesce while unique requests execute independently
   - Show coalescing doesn't interfere with different method/param combinations
   - Confirm cache size stays bounded and cleanup works

4. **Viral Event Simulation** 
   - Simulate 1000 concurrent requests with 80% overlap (800 duplicates, 200 unique)
   - Measure actual RPC calls made vs requests received
   - Show 5-10x reduction in actual external calls
   - Verify all requests receive correct responses

5. **Error Handling**
   - Test that coalesced requests all receive the same error when RPC fails
   - Verify failed requests don't stay in cache after completion
   - Show error scenarios don't break coalescing for subsequent requests
   - Confirm cache cleanup works correctly after failures

SUCCESS CRITERIA:
- Identical requests result in only 1 external RPC call with multiple waiters sharing result
- Cache hit rate >90% during duplicate request bursts
- 5-10x reduction in actual RPC calls during viral event simulation  
- All coalesced requests receive identical results (success or error)
- Cache TTL behavior works correctly (250ms default window)
- Memory usage stays bounded with automatic cleanup

INTEGRATION REQUIREMENTS:
- Maintain all existing RpcConnectionPool interface compatibility
- Preserve rate limiting, load balancing, circuit breaker, and queuing functionality
- Keep existing error handling and retry mechanisms
- Do not break agent integration, monitoring, or statistics

TRADING SYSTEM CONTEXT:
Request coalescing is critical for viral meme event handling:
- Multiple agents analyzing same token simultaneously create identical RPC requests
- Coalescing transforms 100 duplicate getTokenSupply calls into 1 shared call
- Reduces provider rate limit pressure during high-opportunity periods
- Enables system to handle 5-10x more concurrent token analysis

ENVIRONMENT VARIABLES TO ADD:
```bash
# ========= REQUEST COALESCING =========
RPC_COALESCING_ENABLED=true
RPC_COALESCING_TTL_MS=250
RPC_COALESCING_MAX_CACHE_SIZE=10000
```

Run comprehensive coalescing validation and demonstrate 5-10x reduction in actual RPC calls during duplicate request scenarios while maintaining 100% result accuracy and compatibility with all existing functionality.