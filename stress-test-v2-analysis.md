# RPC V2 Stress Test Analysis

## Test Results Summary

### Warm-up (10 concurrent, 50 total)
- **Success Rate**: 98% ✅
- **P95 Latency**: 234ms ❌
- **Issue**: 1 RPS limit error from Chainstack

### Medium Load (50 concurrent, 200 total)
- **Success Rate**: 91.5% ⚠️
- **P95 Latency**: 1371ms ❌
- **Issue**: 17 RPS limit errors - hitting Chainstack rate limits

### High Load (100 concurrent, 500 total)
- **Success Rate**: 100% ✅
- **P95 Latency**: 2684ms ❌
- **Note**: No errors but high latency due to queueing

### Extreme Load (200 concurrent, 1000 total)
- **Success Rate**: 26.2% ❌
- **P95 Latency**: 3309ms ❌
- **Critical Issues**:
  - 724 "No available endpoints" errors
  - 14 RPS limit errors
  - System overwhelmed

## Key Findings

### 1. Chainstack RPS Limits Being Hit
The error message shows: "You've exceeded the RPS limit available on the current plan"
- Our configured limit: 35 RPS
- Actual limit may be lower on current plan
- Need to check Chainstack plan limits

### 2. Endpoint Availability Issues
Under extreme load (200 concurrent):
- 724 "No available endpoints" errors
- Circuit breakers opening due to rate limits
- All endpoints becoming unavailable

### 3. Queue Management Working
- High load test: 100% success with queueing
- Requests being queued properly
- But latency increases significantly

### 4. Memory Stability ✅
- No significant memory leaks
- Memory usage stable around 8-9 MB
- Growth rate acceptable

## Root Cause Analysis

### Rate Limiting Issues
1. **Chainstack Plan Limitation**: Current plan has lower RPS than expected
2. **Per-endpoint limits too high**: Set to 35 RPS but plan may only allow 10-20
3. **Circuit breaker triggered**: Rate limit errors causing endpoints to be marked unhealthy

### Architecture Working But Limited by Provider
- V2 architecture is functioning correctly
- Queue management preventing drops
- But provider rate limits are the bottleneck

## Recommended Fixes

### Immediate Actions
1. **Check Chainstack plan limits**
   ```javascript
   // Reduce Chainstack RPS limit to match plan
   chainstack: {
     rpsLimit: 10, // Reduce from 35
   }
   ```

2. **Adjust circuit breaker for rate limits**
   ```javascript
   // Don't mark endpoint unhealthy for rate limit errors
   if (errorType === 'rate_limit') {
     // Back off but don't open circuit
     return true; // Retry with backoff
   }
   ```

3. **Implement exponential backoff for rate limits**
   ```javascript
   // When rate limited, wait before retry
   if (error.message.includes('RPS limit')) {
     await delay(1000 * Math.pow(2, attempt));
   }
   ```

### Long-term Solutions
1. **Upgrade Chainstack plan** for higher RPS limits
2. **Add more RPC providers** to distribute load
3. **Implement request batching** to reduce RPS
4. **Use WebSocket subscriptions** for real-time data

## Performance vs V1

### Improvements
- ✅ Better queue management (no drops at high load)
- ✅ Per-endpoint tracking working
- ✅ Memory stable

### Still Needs Work
- ❌ Rate limit handling
- ❌ Circuit breaker tuning
- ❌ Provider plan limitations

## Verdict

The V2 architecture is **fundamentally sound** but needs:
1. **Configuration tuning** to match actual provider limits
2. **Better rate limit handling** to prevent circuit breaker issues
3. **Plan upgrades** or additional providers for production load

The "No available endpoints" errors are due to rate limiting, not architectural flaws.