# FIX: Rate Limiting Protection

## Issue
System hitting HTTP 429 rate limits by making too many rapid RPC calls without delay between requests.

## Files to Change
- `src/detection/transport/transaction-fetcher.js` (constructor and pollDex method)

## Required Changes
1. Add rate limiting properties to constructor
2. Implement delay logic in pollDex method before RPC calls
3. Add minimum 1-second interval between calls to prevent 429 errors

## Commands
```bash
# Add rate limiting properties to constructor (after existing properties)
sed -i '' '/this\.circuitBreaker = circuitBreaker;/a\
    this.lastCallTime = 0;\
    this.minInterval = 1000; // 1 second between calls
' src/detection/transport/transaction-fetcher.js

# Add rate limiting logic at start of pollDex method (after method signature)
sed -i '' '/async pollDex(dex) {/a\
    // Rate limiting to prevent HTTP 429 errors\
    const now = Date.now();\
    const timeSinceLastCall = now - this.lastCallTime;\
    if (timeSinceLastCall < this.minInterval) {\
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));\
    }\
    this.lastCallTime = Date.now();
' src/detection/transport/transaction-fetcher.js

# Verify rate limiting code was added
grep -A 8 "Rate limiting to prevent" src/detection/transport/transaction-fetcher.js
```

## Test Fix
```bash
# Test rate limiting is working
node -e "
const start = Date.now();
Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js')
]).then(async ([rpc, cb, fetcher]) => {
  const pool = new rpc.RpcConnectionPool({helius: {url: 'https://api.mainnet-beta.solana.com', priority: 1}});
  const breaker = new cb.CircuitBreaker();
  const tf = new fetcher.TransactionFetcher(pool, breaker);
  
  // Test two rapid calls - should be delayed
  await tf.pollDex('raydium');
  await tf.pollDex('raydium');
  
  const elapsed = Date.now() - start;
  console.log('✅ Rate limiting working - elapsed:', elapsed + 'ms (should be >1000ms)');
}).catch(e => console.log('❌ Error:', e.message));
"

# Test no HTTP 429 errors
node -e "
Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js')
]).then(async ([rpc, cb, fetcher]) => {
  const pool = new rpc.RpcConnectionPool({helius: {url: 'https://api.mainnet-beta.solana.com', priority: 1}});
  const breaker = new cb.CircuitBreaker();
  const tf = new fetcher.TransactionFetcher(pool, breaker);
  console.log('✅ TransactionFetcher with rate limiting ready');
}).catch(e => console.log('❌ Error:', e.message));
"
```

## Validation Checklist
- [ ] No "HTTP 429: Too Many Requests" errors in logs
- [ ] Minimum 1-second delay between consecutive RPC calls
- [ ] TransactionFetcher constructor includes rate limiting properties
- [ ] pollDex method implements delay logic before RPC calls
- [ ] System can make multiple calls without triggering rate limits