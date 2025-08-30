Implement RPC request batching to reduce network overhead by 3-5x for account-heavy meme coin analysis operations.

CRITICAL PERFORMANCE PROBLEM:
- Current: Multiple sequential account calls for token analysis (getAccountInfo × 5 per token)
- Result: High latency and RPC quota consumption during multi-token viral events
- Root cause: No batching of batchable Solana RPC methods

SINGLE FOCUS: RPC REQUEST BATCHING

FILE TO MODIFY:
- src/detection/transport/rpc-connection-pool.js

SPECIFIC IMPLEMENTATION LOCATION:
- Add new method: callBatch() for explicit batching
- Add automatic batching layer for compatible methods
- Integrate with existing call() method and coalescing system

CURRENT INEFFICIENT PATTERN:
Token analysis requires multiple account lookups:
```javascript
await pool.call('getAccountInfo', [tokenAccount1]);
await pool.call('getAccountInfo', [tokenAccount2]); 
await pool.call('getAccountInfo', [tokenAccount3]);
await pool.call('getBalance', [walletAddress1]);
await pool.call('getBalance', [walletAddress2]);
```
This generates 5 separate RPC calls when 2 batched calls would suffice.

REQUIRED IMPLEMENTATION:

1. **Create Batch Request Manager:**
```javascript
class BatchRequestManager {
  constructor(batchWindow = 50, maxBatchSize = 100) {
    this.batchWindow = batchWindow; // ms to wait for more requests
    this.maxBatchSize = maxBatchSize;
    this.pendingBatches = new Map(); // method -> { requests: [], timer: timeout }
    this.stats = {
      batchesSent: 0,
      requestsBatched: 0,
      individualRequests: 0,
      batchSavings: 0
    };
  }
  
  // Methods that can be batched efficiently
  getBatchableMethod(method) {
    const batchMethods = {
      'getAccountInfo': 'getMultipleAccounts',
      'getBalance': 'getMultipleAccounts', // Can batch balance requests
      'getProgramAccounts': null, // Cannot batch efficiently
      'getTokenSupply': null, // Individual calls only
      'getSlot': null // Individual calls only
    };
    return batchMethods[method];
  }
  
  canBatch(method) {
    return this.getBatchableMethod(method) !== null;
  }
  
  addToBatch(method, params, options, deferred) {
    const batchMethod = this.getBatchableMethod(method);
    if (!batchMethod) {
      return false; // Cannot batch this method
    }
    
    const batchKey = this.createBatchKey(method, options);
    
    if (!this.pendingBatches.has(batchKey)) {
      this.pendingBatches.set(batchKey, {
        method: batchMethod,
        requests: [],
        timer: null,
        options
      });
    }
    
    const batch = this.pendingBatches.get(batchKey);
    batch.requests.push({
      originalMethod: method,
      params,
      deferred,
      addedAt: Date.now()
    });
    
    // Start batch timer if first request
    if (batch.requests.length === 1) {
      batch.timer = setTimeout(() => {
        this.executeBatch(batchKey);
      }, this.batchWindow);
    }
    
    // Execute immediately if batch is full
    if (batch.requests.length >= this.maxBatchSize) {
      clearTimeout(batch.timer);
      this.executeBatch(batchKey);
    }
    
    return true;
  }
  
  createBatchKey(method, options) {
    // Group by method and commitment level
    const commitment = options.commitment || 'confirmed';
    return `${method}:${commitment}`;
  }
  
  async executeBatch(batchKey) {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;
    
    this.pendingBatches.delete(batchKey);
    clearTimeout(batch.timer);
    
    try {
      const result = await this.processBatch(batch);
      this.stats.batchesSent++;
      this.stats.requestsBatched += batch.requests.length;
      this.stats.batchSavings += batch.requests.length - 1; // Saved calls
      
    } catch (error) {
      // Reject all requests in batch
      batch.requests.forEach(req => {
        req.deferred.reject(error);
      });
    }
  }
  
  async processBatch(batch) {
    // This will be called by RPC pool's actual execution logic
    const addresses = batch.requests.map(req => {
      if (req.originalMethod === 'getAccountInfo') {
        return req.params[0]; // Address is first parameter
      } else if (req.originalMethod === 'getBalance') {
        return req.params[0]; // Address is first parameter
      }
      return null;
    }).filter(Boolean);
    
    // Return batch execution promise
    return { batchMethod: batch.method, addresses, batch };
  }
  
  getStats() {
    return {
      ...this.stats,
      avgBatchSize: this.stats.requestsBatched / (this.stats.batchesSent || 1),
      efficiencyGain: this.stats.batchSavings / (this.stats.requestsBatched || 1)
    };
  }
}
```

2. **Integrate Batching into RPC Pool:**
```javascript
// In RpcConnectionPoolV2 constructor:
this.batchManager = new BatchRequestManager(
  parseInt(process.env.RPC_BATCH_WINDOW_MS) || 50,
  parseInt(process.env.RPC_BATCH_MAX_SIZE) || 100
);

// Modify call() method to support batching:
async call(method, params = [], options = {}) {
  if (this.isDestroyed) {
    throw new Error('RPC pool has been destroyed');
  }
  
  // Skip batching if disabled
  if (process.env.RPC_BATCHING_ENABLED !== 'true') {
    return this.callWithoutBatching(method, params, options);
  }
  
  // Try to add to batch for compatible methods
  if (this.batchManager.canBatch(method)) {
    const deferred = this.createDeferred();
    const added = this.batchManager.addToBatch(method, params, options, deferred);
    if (added) {
      return deferred.promise;
    }
  }
  
  // Fall back to individual call (with coalescing)
  return this.callWithoutBatching(method, params, options);
}

// Keep original logic as fallback
async callWithoutBatching(method, params, options) {
  // Original call() implementation with coalescing
  // (existing code)
}
```

3. **Add Batch Execution Logic:**
```javascript
async executeBatchRequest(batchMethod, addresses, originalBatch, options) {
  // Handle getMultipleAccounts batch
  if (batchMethod === 'getMultipleAccounts') {
    try {
      const batchResult = await this.executeNewRequest(
        'getMultipleAccounts',
        [addresses, { encoding: 'jsonParsed', ...options }],
        options
      );
      
      // Distribute results back to individual requests
      originalBatch.requests.forEach((req, index) => {
        const accountData = batchResult.value[index];
        
        if (req.originalMethod === 'getAccountInfo') {
          req.deferred.resolve({ value: accountData });
        } else if (req.originalMethod === 'getBalance') {
          // Extract balance from account data
          const balance = accountData ? accountData.lamports : 0;
          req.deferred.resolve({ value: balance });
        }
      });
      
    } catch (error) {
      // Reject all requests in batch
      originalBatch.requests.forEach(req => {
        req.deferred.reject(error);
      });
    }
  }
}
```

4. **Add Explicit Batch Method:**
```javascript
async callBatch(requests) {
  // Explicit batching for advanced users
  // requests = [{ method, params, options? }]
  
  const batchableRequests = requests.filter(req => 
    this.batchManager.canBatch(req.method)
  );
  
  const individualRequests = requests.filter(req => 
    !this.batchManager.canBatch(req.method)
  );
  
  const results = [];
  
  // Process batchable requests
  if (batchableRequests.length > 0) {
    const batchPromise = this.processBatchRequests(batchableRequests);
    results.push(batchPromise);
  }
  
  // Process individual requests
  for (const req of individualRequests) {
    results.push(this.call(req.method, req.params, req.options));
  }
  
  return Promise.all(results);
}
```

5. **Update Configuration:**
```javascript
// Add to .env:
RPC_BATCHING_ENABLED=true
RPC_BATCH_WINDOW_MS=50
RPC_BATCH_MAX_SIZE=100
RPC_BATCH_TIMEOUT_MS=5000
```

6. **Integration with Statistics:**
```javascript
getStats() {
  const existingStats = /* existing logic */;
  
  return {
    ...existingStats,
    coalescing: this.coalescingCache.getStats(),
    batching: this.batchManager.getStats()
  };
}
```

VALIDATION REQUIREMENTS:
Create validation that proves request batching reduces RPC call volume and improves performance:

1. **Batch Efficiency Verification**
   - Send 10 getAccountInfo requests within batch window (50ms)
   - Verify only 1 getMultipleAccounts call is made to external RPC
   - Show all 10 requests receive correct individual account data
   - Measure batch efficiency ratio (9 calls saved out of 10)

2. **Mixed Method Batching**
   - Send mix of 5 getAccountInfo + 5 getBalance requests simultaneously
   - Verify they batch together into single getMultipleAccounts call
   - Show getAccountInfo requests get account data, getBalance requests get lamport values
   - Confirm non-batchable methods (getTokenSupply) still execute individually

3. **Timing Window Behavior**
   - Send 3 requests immediately, wait 30ms, send 3 more requests
   - Verify first batch executes after 50ms window, second batch starts new window
   - Show timing window prevents indefinite request accumulation
   - Confirm max batch size triggers immediate execution

4. **Error Handling in Batches**
   - Create batch with mix of valid and invalid addresses
   - Verify individual requests receive appropriate success/error responses
   - Show batch failure propagates errors to all constituent requests
   - Confirm error in one batch doesn't affect other batches

5. **Performance Impact Measurement**
   - Compare latency of 10 sequential getAccountInfo vs 1 batched call
   - Measure total RPC call reduction during account-heavy token analysis
   - Show 3-5x reduction in actual external calls for batchable operations
   - Verify batching doesn't increase latency beyond batch window

SUCCESS CRITERIA:
- Batchable methods (getAccountInfo, getBalance) automatically batch when sent within 50ms window
- 3-5x reduction in actual RPC calls for account-heavy operations
- All batched requests receive correct individual responses
- Non-batchable methods still execute normally without batching interference
- Batch window timing works correctly (50ms default)
- Error handling maintains individual request semantics within batches

INTEGRATION REQUIREMENTS:
- Maintain complete compatibility with existing call() method interface
- Preserve coalescing, rate limiting, load balancing, and circuit breaker functionality
- Keep existing error handling and retry mechanisms for both batched and individual calls
- Do not break agent integration, monitoring, or statistics collection

TRADING SYSTEM CONTEXT:
Request batching is critical for multi-token meme coin analysis:
- Token risk assessment requires 3-5 account lookups per token
- Viral events involve analyzing 50-100+ tokens simultaneously
- Batching reduces 500 individual account calls to ~100 batch calls
- Lower RPC usage leaves more quota for other critical trading operations

ENVIRONMENT VARIABLES TO ADD:
```bash
# ========= REQUEST BATCHING =========
RPC_BATCHING_ENABLED=true
RPC_BATCH_WINDOW_MS=50
RPC_BATCH_MAX_SIZE=100
RPC_BATCH_TIMEOUT_MS=5000
```

Run comprehensive batching validation and demonstrate 3-5x reduction in actual RPC calls for account-heavy operations while maintaining 100% accuracy of individual request responses and compatibility with all existing functionality including request coalescing.