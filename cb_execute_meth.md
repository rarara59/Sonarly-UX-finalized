# FIX: Circuit Breaker Execute Method

## Issue
TransactionFetcher calling circuitBreaker.execute() method that doesn't exist, causing system crashes.

## Files to Change
- `src/detection/core/circuit-breaker.js` (add execute method to class)

## Required Changes
1. Add execute method to CircuitBreaker class
2. Implement circuit breaker logic with operation execution
3. Handle success/failure tracking and error propagation

## Commands
```bash
# Add execute method before the closing brace of CircuitBreaker class
sed -i '' '/^}$/i\
\
  async execute(operation) {\
    // Check if circuit is open (too many failures)\
    if (this.state === "OPEN") {\
      throw new Error("Circuit breaker is OPEN - too many failures");\
    }\
    \
    try {\
      // Execute the operation (RPC call, etc.)\
      const result = await operation();\
      \
      // Reset failure count on success\
      this.onSuccess();\
      \
      return result;\
    } catch (error) {\
      // Track the failure\
      this.onFailure();\
      \
      // Re-throw the error so caller can handle it\
      throw error;\
    }\
  }
' src/detection/core/circuit-breaker.js

# Verify execute method was added
grep -A 20 "async execute" src/detection/core/circuit-breaker.js

# Check that method is properly placed within class
tail -10 src/detection/core/circuit-breaker.js
```

## Test Fix
```bash
# Test CircuitBreaker execute method exists and works
node -e "
import('./src/detection/core/circuit-breaker.js').then(module => {
  const cb = new module.CircuitBreaker();
  if (typeof cb.execute === 'function') {
    console.log('✅ CircuitBreaker.execute method exists');
    return cb.execute(() => Promise.resolve('test'));
  } else {
    throw new Error('execute method missing');
  }
}).then(result => console.log('✅ Execute method works, returned:', result)).catch(e => console.log('❌ Error:', e.message));
"

# Test with TransactionFetcher integration
node -e "
Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/core/circuit-breaker.js'),
  import('./src/detection/transport/transaction-fetcher.js')
]).then(([rpc, cb, fetcher]) => {
  const pool = new rpc.RpcConnectionPool({helius: {url: 'https://api.mainnet-beta.solana.com', priority: 1}});
  const breaker = new cb.CircuitBreaker();
  const tf = new fetcher.TransactionFetcher(pool, breaker);
  console.log('✅ TransactionFetcher + CircuitBreaker integration working');
}).catch(e => console.log('❌ Error:', e.message));
"
```

## Validation Checklist
- [ ] CircuitBreaker class has execute method defined
- [ ] execute method handles operation execution and error tracking
- [ ] TransactionFetcher can instantiate without "execute is not a function" error
- [ ] Circuit breaker tracks successes and failures properly
- [ ] System integration test passes without circuit breaker errors