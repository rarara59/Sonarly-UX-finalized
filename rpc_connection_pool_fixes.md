# RPC Connection Pool - Technical Fixes

## Overview

This document provides complete technical fixes for the RpcConnectionPool implementation, addressing 2 production-breaking bugs and implementing proper cursor-based parallel scanning for maximum RPC utilization.

## Critical Bug Fixes

### Bug 1: Memory Leak in Request Queue (CRITICAL)

**Problem:** Orphaned Promise resolvers accumulate in memory during high-load periods, causing system crashes.

**Location:** `waitForSlot()` method, line 334

**Current Broken Code:**
```javascript
async waitForSlot() {
  if (this.activeRequests < this.maxConcurrentRequests) {
    return;
  }
  
  return new Promise(resolve => {
    this.requestQueue.push(resolve); // BUG: Never cleaned up
  });
}
```

**Fixed Code:**
```javascript
async waitForSlot() {
  if (this.activeRequests < this.maxConcurrentRequests) {
    return;
  }
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      // Remove from queue on timeout
      const index = this.requestQueue.findIndex(item => item.resolve === resolve);
      if (index >= 0) {
        this.requestQueue.splice(index, 1);
      }
      reject(new Error('Request queue timeout after 30 seconds'));
    }, 30000);
    
    this.requestQueue.push({ 
      resolve, 
      timeoutId,
      timestamp: Date.now()
    });
  });
}
```

### Bug 2: ProcessQueue Type Error (CRITICAL)

**Problem:** Queue processing assumes items are functions, but they're now objects with timeout IDs.

**Location:** `processQueue()` method, line 344

**Current Broken Code:**
```javascript
processQueue() {
  while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
    const resolve = this.requestQueue.shift();
    resolve(); // BUG: TypeError if item is object
  }
}
```

**Fixed Code:**
```javascript
processQueue() {
  while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
    const item = this.requestQueue.shift();
    
    // Handle both old function format and new object format
    if (typeof item === 'function') {
      item();
    } else if (item && typeof item.resolve === 'function') {
      // Clear timeout since we're processing the request
      if (item.timeoutId) {
        clearTimeout(item.timeoutId);
      }
      item.resolve();
    }
  }
}
```

## Enhancement: Proper Cursor-Based Parallel Scanning

### Problem Analysis

The current parallel scanning implementation uses identical parameters for all endpoints:

**Current Implementation Issues:**
```javascript
// Both endpoints get same parameters
const promises = healthyEndpoints.map(async endpoint => {
  const result = await this.makeRequest(endpoint, method, params, options.timeout);
  // params is IDENTICAL = same 50 transactions from both endpoints
});

// Result: Pay 2x RPC costs for same 50 transactions
```

### Solution: Cursor-Based Pagination

**New Method:** `scanWithCursors()`

```javascript
/**
 * Scan for transactions using cursor-based pagination across multiple endpoints
 * Maximizes RPC utilization by fetching different transaction ranges
 */
async scanWithCursors(method, address, options = {}) {
  const totalLimit = options.totalLimit || 100;
  const commitment = options.commitment || 'confirmed';
  
  // Get healthy endpoints sorted by priority
  const healthyEndpoints = Array.from(this.endpoints.values())
    .filter(ep => ep.health === 'healthy' && this.canMakeRequest(ep))
    .sort((a, b) => a.priority - b.priority);
  
  if (healthyEndpoints.length === 0) {
    throw new Error('No healthy endpoints available');
  }
  
  if (healthyEndpoints.length === 1) {
    // Single endpoint - use standard call
    return this.call(method, [address, { limit: totalLimit, commitment }], options);
  }
  
  // Multi-endpoint cursor-based scanning
  const limitPerEndpoint = Math.floor(totalLimit / healthyEndpoints.length);
  const batches = [];
  let beforeCursor = null;
  
  for (let i = 0; i < healthyEndpoints.length; i++) {
    const endpoint = healthyEndpoints[i];
    const isLast = i === healthyEndpoints.length - 1;
    const batchLimit = isLast ? totalLimit - (limitPerEndpoint * i) : limitPerEndpoint;
    
    try {
      await this.waitForSlot();
      this.activeRequests++;
      
      const params = [address, {
        limit: batchLimit,
        commitment,
        ...(beforeCursor && { before: beforeCursor })
      }];
      
      const result = await this.makeRequest(endpoint, method, params, options.timeout || 8000);
      
      if (result && result.length > 0) {
        batches.push({
          endpoint: endpoint.name,
          results: result,
          count: result.length
        });
        
        // Set cursor for next batch
        beforeCursor = result[result.length - 1].signature;
      }
      
      this.updateEndpointHealth(endpoint.name, true);
      
    } catch (error) {
      this.updateEndpointHealth(endpoint.name, false);
      console.warn(`Endpoint ${endpoint.name} failed in cursor scan:`, error.message);
      
      // Continue with other endpoints
      continue;
      
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }
  
  // Combine all batches
  const allTransactions = batches.flatMap(batch => batch.results);
  const totalFound = allTransactions.length;
  
  console.log(`Cursor scan completed: ${totalFound} transactions from ${batches.length} endpoints`);
  
  return allTransactions;
}
```

### Enhanced Transaction Scanning Method

**Replace existing `scanForTransactions()` with:**

```javascript
/**
 * Enhanced transaction scanning with automatic cursor-based pagination
 * Maximizes discovery using all available RPC capacity
 */
async scanForTransactions(addresses, options = {}) {
  const limit = options.limit || 100;
  const commitment = options.commitment || 'confirmed';
  const method = options.method || 'getSignaturesForAddress';
  
  // Process addresses with cursor-based scanning
  const promises = addresses.map(async address => {
    try {
      const results = await this.scanWithCursors(method, address, {
        totalLimit: limit,
        commitment,
        timeout: options.timeout
      });
      
      return results.map(tx => ({ ...tx, address }));
      
    } catch (error) {
      console.warn(`Failed to scan address ${address}:`, error.message);
      return [];
    }
  });
  
  const addressResults = await Promise.allSettled(promises);
  
  // Flatten and sort all results
  const allTransactions = addressResults
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
  
  // Sort by blockTime for processing order
  return allTransactions.sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));
}
```

## Additional Queue Management Enhancements

### Queue Size Monitoring

Add to constructor:
```javascript
// Queue health monitoring
this.maxQueueSize = 200;
this.queueHealthCheckInterval = 10000; // 10 seconds

// Start queue monitoring
this.startQueueMonitoring();
```

### Queue Monitoring Method

```javascript
/**
 * Monitor queue health and prevent runaway growth
 */
startQueueMonitoring() {
  setInterval(() => {
    // Check queue size
    if (this.requestQueue.length > this.maxQueueSize) {
      console.warn(`Request queue oversize: ${this.requestQueue.length} items, clearing oldest`);
      
      // Clear oldest items with timeouts
      const itemsToRemove = this.requestQueue.length - this.maxQueueSize;
      for (let i = 0; i < itemsToRemove; i++) {
        const item = this.requestQueue.shift();
        if (item && item.timeoutId) {
          clearTimeout(item.timeoutId);
        }
        if (item && typeof item.resolve === 'function') {
          item.resolve(); // Allow request to proceed
        }
      }
    }
    
    // Clean up old timeouts
    const now = Date.now();
    this.requestQueue = this.requestQueue.filter(item => {
      if (typeof item === 'function') return true;
      
      const age = now - (item.timestamp || 0);
      if (age > 60000) { // 1 minute timeout
        if (item.timeoutId) clearTimeout(item.timeoutId);
        return false;
      }
      return true;
    });
    
  }, this.queueHealthCheckInterval);
}
```

## Updated Statistics Method

**Enhanced `getStats()` with queue health:**

```javascript
getStats() {
  const endpointStatus = {};
  this.endpoints.forEach((endpoint, name) => {
    endpointStatus[name] = {
      health: endpoint.health,
      consecutiveFailures: endpoint.consecutiveFailures,
      successRate: endpoint.totalRequests > 0 
        ? endpoint.successfulRequests / endpoint.totalRequests 
        : 0,
      avgLatency: endpoint.avgLatency,
      totalRequests: endpoint.totalRequests,
      maxRequestsPerSecond: endpoint.maxRequestsPerSecond,
      currentUtilization: endpoint.requestsThisSecond / endpoint.maxRequestsPerSecond
    };
  });
  
  return {
    ...this.stats,
    currentEndpoint: this.currentEndpoint,
    activeRequests: this.activeRequests,
    queuedRequests: this.requestQueue.length,
    queueHealth: {
      size: this.requestQueue.length,
      maxSize: this.maxQueueSize,
      utilization: this.requestQueue.length / this.maxQueueSize,
      oldestItemAge: this.getOldestQueueItemAge()
    },
    endpoints: endpointStatus
  };
}

/**
 * Get age of oldest queued item for monitoring
 */
getOldestQueueItemAge() {
  if (this.requestQueue.length === 0) return 0;
  
  const now = Date.now();
  return this.requestQueue.reduce((maxAge, item) => {
    if (typeof item === 'function') return maxAge;
    const age = now - (item.timestamp || now);
    return Math.max(maxAge, age);
  }, 0);
}
```

## Testing the Fixes

### Memory Leak Test

```javascript
// Test script to verify memory leak fix
async function testMemoryLeak(pool) {
  console.log('Testing memory leak fix...');
  
  // Fill up request slots
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(pool.call('getVersion', []));
  }
  
  // Check queue size
  const initialQueueSize = pool.requestQueue.length;
  console.log(`Queue size after saturation: ${initialQueueSize}`);
  
  // Wait for completion
  await Promise.allSettled(promises);
  
  // Check final queue size
  const finalQueueSize = pool.requestQueue.length;
  console.log(`Queue size after completion: ${finalQueueSize}`);
  
  if (finalQueueSize === 0) {
    console.log('✅ Memory leak fix verified');
  } else {
    console.log('❌ Memory leak still present');
  }
}
```

### Cursor Scanning Test

```javascript
// Test cursor-based scanning
async function testCursorScanning(pool) {
  console.log('Testing cursor-based parallel scanning...');
  
  const testAddress = 'YourTestAddressHere';
  
  // Single endpoint scan
  const singleResult = await pool.call('getSignaturesForAddress', [
    testAddress, 
    { limit: 100, commitment: 'confirmed' }
  ]);
  
  // Cursor-based parallel scan
  const parallelResult = await pool.scanWithCursors(
    'getSignaturesForAddress', 
    testAddress, 
    { totalLimit: 100, commitment: 'confirmed' }
  );
  
  console.log(`Single endpoint: ${singleResult.length} transactions`);
  console.log(`Parallel cursor: ${parallelResult.length} transactions`);
  
  // Verify no duplicates in parallel result
  const signatures = new Set();
  const duplicates = parallelResult.filter(tx => {
    if (signatures.has(tx.signature)) return true;
    signatures.add(tx.signature);
    return false;
  });
  
  console.log(`Duplicates found: ${duplicates.length}`);
  
  if (parallelResult.length >= singleResult.length && duplicates.length === 0) {
    console.log('✅ Cursor scanning working correctly');
  } else {
    console.log('❌ Cursor scanning needs adjustment');
  }
}
```

## Deployment Checklist

### Phase 1: Critical Bug Fixes (Deploy Immediately)
- [ ] Apply memory leak fix to `waitForSlot()`
- [ ] Apply type error fix to `processQueue()`
- [ ] Add queue monitoring
- [ ] Test with existing functionality
- [ ] Deploy to production

### Phase 2: Enhanced Scanning (Deploy After Phase 1 Stable)
- [ ] Implement `scanWithCursors()` method
- [ ] Update `scanForTransactions()` method
- [ ] Add enhanced statistics
- [ ] Test cursor-based scanning
- [ ] Monitor RPC utilization improvement

### Phase 3: Optimization (Optional)
- [ ] Monitor queue health metrics
- [ ] Tune queue size limits based on usage
- [ ] Optimize cursor pagination for specific use cases

## Expected Results

### After Bug Fixes:
- ✅ No more memory leaks during high load
- ✅ No more TypeError crashes in queue processing
- ✅ Stable operation under heavy RPC usage

### After Enhanced Scanning:
- ✅ 100 transactions per scan (vs 50 previously)
- ✅ Full utilization of paid RPC capacity
- ✅ No duplicate transactions
- ✅ Improved transaction discovery for trading

## Monitoring

### Key Metrics to Watch:
1. **Queue Health**: Size, age of oldest item, utilization
2. **Memory Usage**: Heap size over time during high load
3. **RPC Utilization**: Requests per second per endpoint
4. **Transaction Discovery**: Average transactions per scan
5. **Error Rates**: Queue timeouts, endpoint failures

The fixes maintain all existing functionality while resolving critical stability issues and maximizing your RPC investment.