Fix the per-endpoint rate limiting violations that are causing provider 429 errors and potential blacklisting.

CRITICAL PERFORMANCE FAILURE:
- Current: Global rate limiting violates individual RPC provider limits
- Problem: System exceeds Helius (45 rps), ChainStack (35 rps), Public (8 rps) limits
- Impact: Providers return 429 errors, system marked as abusive, potential blacklisting
- Result: Cascading failures as "good" endpoints get blocked

SINGLE FOCUS: PER-ENDPOINT RATE LIMITING

FILE TO MODIFY:
- src/detection/transport/rpc-connection-pool.js

SPECIFIC IMPLEMENTATION LOCATIONS:
1. **New TokenBucket class** - Add before RpcConnectionPoolV2 class definition
2. **Endpoint initialization** - Modify initializeEndpoints() method (~line 70)
3. **Rate limit checking** - Replace checkRateLimit() method (~line 240) 
4. **Endpoint configuration** - Update ENDPOINT_CONFIGS object (~line 20)

CURRENT BROKEN PATTERN:
The existing code has basic per-endpoint rate limiting but it's not properly implemented:
- Token bucket refill logic is flawed
- No proper RPS limit enforcement per provider
- Global limits override per-endpoint limits

REQUIRED IMPLEMENTATION:

1. **Create Proper TokenBucket Class:**
```javascript
class TokenBucket {
  constructor(rpsLimit, windowMs = 1000) {
    this.maxTokens = rpsLimit;
    this.tokens = rpsLimit;
    this.refillRate = rpsLimit / (windowMs / 1000); // tokens per millisecond
    this.lastRefill = Date.now();
    this.windowMs = windowMs;
  }
  
  canConsume(tokens = 1) {
    this.refill();
    return this.tokens >= tokens;
  }
  
  consume(tokens = 1) {
    if (this.canConsume(tokens)) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
  
  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  getStatus() {
    this.refill();
    return {
      tokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
      utilization: ((this.maxTokens - this.tokens) / this.maxTokens * 100).toFixed(1) + '%'
    };
  }
}
```

2. **Update ENDPOINT_CONFIGS with Accurate Limits:**
```javascript
const ENDPOINT_CONFIGS = {
  helius: {
    pattern: /helius/i,
    rpsLimit: 45,  // Conservative limit below actual
    weight: 60,
    maxConcurrent: 20,
    timeout: 2000,
    priority: 1
  },
  chainstack: {
    pattern: /chainstack|p2pify/i,
    rpsLimit: 35,  // Conservative limit below actual  
    weight: 30,
    maxConcurrent: 15,
    timeout: 1500,
    priority: 0
  },
  public: {
    pattern: /mainnet-beta/i,
    rpsLimit: 8,   // Well below public RPC limits
    weight: 10,
    maxConcurrent: 5,
    timeout: 3000,
    priority: 2
  }
};
```

3. **Initialize TokenBucket for Each Endpoint:**
In initializeEndpoints() method, add TokenBucket initialization:
```javascript
return {
  url,
  index,
  config: endpointConfig,
  // Add token bucket rate limiting
  rateLimiter: new TokenBucket(endpointConfig.rpsLimit),
  // ... existing endpoint properties
};
```

4. **Replace checkRateLimit() Method:**
Replace the existing flawed rate limiting logic:
```javascript
checkRateLimit(endpoint) {
  return endpoint.rateLimiter.consume(1);
}
```

5. **Add Rate Limit Status Tracking:**
In selectEndpoint() method, check rate limit availability:
```javascript
// Filter available endpoints
const available = this.endpoints.filter(ep => {
  // ... existing filters
  
  // Check if endpoint has available rate limit tokens
  if (!ep.rateLimiter.canConsume(1)) {
    return false;
  }
  
  return true;
});
```

VALIDATION REQUIREMENTS:
Create validation that proves per-endpoint rate limiting works:

1. **Individual Endpoint RPS Compliance**
   - Test each endpoint individually under sustained load
   - Verify Helius endpoint never exceeds 45 requests per second
   - Verify ChainStack endpoint never exceeds 35 requests per second  
   - Verify Public endpoint never exceeds 8 requests per second
   - Show token bucket refill behavior over time

2. **Rate Limit Distribution Testing**
   - Send 200+ requests over 60 seconds
   - Verify requests are distributed across endpoints appropriately
   - Show that when one endpoint hits rate limit, requests route to others
   - Confirm no single endpoint gets overloaded

3. **Provider Error Prevention**  
   - Run sustained load test for 10+ minutes
   - Monitor for 429 (rate limit exceeded) responses from providers
   - Verify zero 429 errors occur during normal operation
   - Test recovery behavior when rate limits reset

4. **Token Bucket Accuracy**
   - Verify token refill happens at correct rate
   - Test edge cases: burst usage, sustained usage, idle periods
   - Confirm token count accuracy matches RPS limits
   - Show utilization percentages are calculated correctly

SUCCESS CRITERIA:
- Zero 429 rate limit errors from any RPC provider during sustained testing
- Each endpoint respects its individual RPS limit (measured over 60-second windows)
- Requests distribute intelligently when rate limits are approached
- Token bucket refill behavior is mathematically correct
- System maintains >99% success rate while respecting all rate limits

INTEGRATION REQUIREMENTS:
- Maintain all existing RpcConnectionPool interfaces
- Preserve circuit breaker and health monitoring functionality
- Keep existing endpoint selection logic (but add rate limit filtering)
- Do not break agent integration from previous fix

TRADING SYSTEM CONTEXT:
Proper rate limiting is critical for meme coin trading reliability:
- Prevents provider blacklisting during high-volume trading periods
- Ensures system remains operational during viral meme events  
- Maintains access to all three RPC providers for maximum reliability
- Prevents cascade failures when one provider becomes unavailable

TEST SCENARIOS:
1. **Normal Load:** 10-20 concurrent requests distributed appropriately
2. **Burst Load:** 100+ requests in 10 seconds, proper queuing and distribution
3. **Sustained Load:** 60+ seconds of continuous requests, zero rate violations
4. **Provider Recovery:** Test behavior when rate limits reset after being exhausted

Run comprehensive rate limiting validation and show that all endpoints operate within their limits while maintaining system throughput and reliability.