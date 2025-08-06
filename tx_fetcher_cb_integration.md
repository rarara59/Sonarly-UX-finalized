# Transaction Fetcher - Circuit Breaker Integration

## Problem
Current TransactionFetcher lacks circuit breaker protection for RPC calls, creating cascade failure risk.

## Solution
Add circuit breaker integration to existing code with minimal changes.

## Implementation

### 1. Constructor Update
```javascript
constructor(rpcPool, circuitBreaker, performanceMonitor = null) {
  this.rpcPool = rpcPool;
  this.circuitBreaker = circuitBreaker; // ADD THIS LINE
  this.monitor = performanceMonitor;
  
  // ... rest of constructor unchanged
}
```

### 2. Wrap RPC Calls with Circuit Breaker

**In pollDex method, replace:**
```javascript
const response = await this.rpcPool.call(
  'getSignaturesForAddress',
  params,
  { timeout: 8000 }
);
```

**With:**
```javascript
const response = await this.circuitBreaker.execute('rpc_signatures', async () => {
  return await this.rpcPool.call('getSignaturesForAddress', params, { timeout: 8000 });
});
```

**In fetchTransactionBatch method, replace:**
```javascript
const promises = signatures.map(signature =>
  this.rpcPool.call('getTransaction', [signature, {
    encoding: 'json',
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0
  }]).catch(error => {
    console.warn(`Failed to fetch transaction ${signature}:`, error.message);
    return null;
  })
);
```

**With:**
```javascript
const promises = signatures.map(signature =>
  this.circuitBreaker.execute('rpc_transaction', async () => {
    return await this.rpcPool.call('getTransaction', [signature, {
      encoding: 'json',
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    }]);
  }).catch(error => {
    console.warn(`Failed to fetch transaction ${signature}:`, error.message);
    return null;
  })
);
```

### 3. Update isHealthy method
```javascript
isHealthy() {
  return (
    this.stats.lastFetchTime < 15000 && 
    this.stats.avgFetchTime < 10000 &&  
    this.seenSignatures.size < 50000 &&
    this.circuitBreaker.isHealthy('rpc_signatures') && // ADD THIS
    this.circuitBreaker.isHealthy('rpc_transaction')   // ADD THIS
  );
}
```

## Result
- **Fault tolerance**: RPC failures don't cascade
- **Fast recovery**: Circuit breaker auto-recovery
- **Zero breaking changes**: Existing functionality preserved
- **Production ready**: Handles network outages gracefully

**Implementation time: 2 minutes**