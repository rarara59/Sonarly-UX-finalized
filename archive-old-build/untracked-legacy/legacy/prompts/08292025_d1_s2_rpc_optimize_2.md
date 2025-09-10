Fix the missing request queuing and backpressure handling that causes system failure during viral meme event traffic spikes.

CRITICAL PERFORMANCE FAILURE:
- Current: Requests fail immediately when capacity exceeded (fail-fast approach)
- Problem: No queuing during viral events when 100+ tokens need simultaneous analysis
- Impact: System drops profitable opportunities during highest-volume periods  
- Result: Biggest profit scenarios (viral meme events) cause complete system failure

SINGLE FOCUS: REQUEST QUEUING WITH INTELLIGENT BACKPRESSURE

FILE TO MODIFY:
- src/detection/transport/rpc-connection-pool.js

SPECIFIC METHODS TO IMPLEMENT:
- Method: processRequestWithQueuing() - new method to replace direct execution
- Method: manageRequestQueues() - per-endpoint queue management
- Update: call() method to integrate queuing logic
- Add: Request prioritization system for trading signals

CURRENT BROKEN PATTERN:
The existing system likely has basic global queuing but lacks:
- Per-endpoint request queues (causes head-of-line blocking)
- Intelligent backpressure signaling to upstream systems
- Request prioritization (trading signals vs health checks)
- Proper deadline management for queued requests
- Integration with rate limiting and load balancing

REQUIRED IMPLEMENTATION:

1. **Add Request Queue Management System:**
```javascript
class RequestQueue {
  constructor(maxSize = 100, deadlineMs = 5000) {
    this.maxSize = maxSize;
    this.deadlineMs = deadlineMs;
    this.queue = [];
    this.processing = false;
  }
  
  enqueue(request) {
    // Check if queue is full
    if (this.queue.length >= this.maxSize) {
      throw new Error('Request queue full - backpressure activated');
    }
    
    // Add request with metadata
    const queuedRequest = {
      ...request,
      queuedAt: Date.now(),
      deadline: Date.now() + this.deadlineMs,
      priority: this.calculatePriority(request)
    };
    
    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(req => req.priority < queuedRequest.priority);
    if (insertIndex === -1) {
      this.queue.push(queuedRequest);
    } else {
      this.queue.splice(insertIndex, 0, queuedRequest);
    }
    
    return queuedRequest;
  }
  
  dequeue() {
    // Remove expired requests first
    this.removeExpiredRequests();
    
    // Return highest priority request
    return this.queue.shift() || null;
  }
  
  calculatePriority(request) {
    // Higher numbers = higher priority
    const basePriority = 50;
    
    // Trading signal analysis gets highest priority
    if (request.method === 'getTokenSupply' || 
        request.method === 'getTokenLargestAccounts') {
      return basePriority + 30; // Priority 80
    }
    
    // Market data requests get medium priority
    if (request.method === 'getSlot' || 
        request.method === 'getBlockHeight') {
      return basePriority + 10; // Priority 60
    }
    
    // Health checks get lower priority
    if (request.method === 'getVersion' || 
        request.method === 'getHealth') {
      return basePriority - 10; // Priority 40
    }
    
    return basePriority; // Default priority 50
  }
  
  removeExpiredRequests() {
    const now = Date.now();
    const originalLength = this.queue.length;
    
    this.queue = this.queue.filter(req => req.deadline > now);
    
    const expired = originalLength - this.queue.length;
    if (expired > 0) {
      console.log(`Removed ${expired} expired requests from queue`);
    }
  }
  
  getStats() {
    return {
      size: this.queue.length,
      maxSize: this.maxSize,
      oldestRequest: this.queue.length > 0 ? 
        Date.now() - this.queue[this.queue.length - 1].queuedAt : 0,
      priorityDistribution: this.getPriorityDistribution()
    };
  }
  
  getPriorityDistribution() {
    const distribution = {};
    for (const request of this.queue) {
      const bucket = Math.floor(request.priority / 10) * 10;
      distribution[bucket] = (distribution[bucket] || 0) + 1;
    }
    return distribution;
  }
}
```

2. **Initialize Per-Endpoint Queues:**
```javascript
// In initializeEndpoints() method, add request queue for each endpoint
return {
  url,
  index,
  config: endpointConfig,
  rateLimiter: new TokenBucket(endpointConfig.rpsLimit),
  requestQueue: new RequestQueue(endpointConfig.queueMaxSize || 50),
  // ... existing endpoint properties
};
```

3. **Replace call() Method with Queuing Logic:**
```javascript
async call(method, params = [], options = {}) {
  if (this.isDestroyed) {
    throw new Error('RPC pool has been destroyed');
  }
  
  // Create request object
  const request = {
    id: this.generateRequestId(),
    method,
    params,
    options,
    timestamp: Date.now(),
    attempts: 0,
    deferred: this.createDeferred()
  };
  
  try {
    // Try immediate execution first
    const result = await this.tryImmediateExecution(request);
    return result;
  } catch (capacityError) {
    // If immediate execution fails due to capacity, queue the request
    return this.queueRequestWithBackpressure(request);
  }
}
```

4. **Add Intelligent Request Processing:**
```javascript
async tryImmediateExecution(request) {
  // Check global capacity
  if (this.globalInFlight >= this.config.maxGlobalInFlight) {
    throw new Error('Global capacity exceeded - queuing required');
  }
  
  // Find available endpoint
  const endpoint = this.selectBestEndpoint();
  if (!endpoint) {
    throw new Error('No available endpoints - queuing required');
  }
  
  // Check endpoint-specific capacity
  if (endpoint.stats.inFlight >= endpoint.config.maxConcurrent) {
    throw new Error('Endpoint capacity exceeded - queuing required');
  }
  
  // Execute immediately
  return this.executeRequestOnEndpoint(request, endpoint);
}

async queueRequestWithBackpressure(request) {
  // Find best endpoint for queuing (even if currently busy)
  const endpoint = this.selectEndpointForQueuing();
  
  if (!endpoint) {
    throw new Error('No endpoints available for queuing');
  }
  
  try {
    // Queue the request
    const queuedRequest = endpoint.requestQueue.enqueue(request);
    
    // Start queue processing for this endpoint
    this.processEndpointQueue(endpoint);
    
    // Return promise that resolves when request is processed
    return queuedRequest.deferred.promise;
    
  } catch (queueError) {
    // Queue is full - implement backpressure
    if (queueError.message.includes('queue full')) {
      // Signal backpressure to upstream systems
      this.signalBackpressure(request);
      
      // Try other endpoints
      return this.tryAlternativeEndpoints(request);
    }
    
    throw queueError;
  }
}
```

5. **Add Queue Processing Logic:**
```javascript
async processEndpointQueue(endpoint) {
  // Prevent multiple queue processors for same endpoint
  if (endpoint.queueProcessing) {
    return;
  }
  
  endpoint.queueProcessing = true;
  
  try {
    while (true) {
      // Check if endpoint can handle more requests
      if (endpoint.stats.inFlight >= endpoint.config.maxConcurrent) {
        break; // Endpoint at capacity
      }
      
      // Check global capacity
      if (this.globalInFlight >= this.config.maxGlobalInFlight) {
        break; // System at capacity
      }
      
      // Check rate limits
      if (!endpoint.rateLimiter.canConsume(1)) {
        break; // Rate limited
      }
      
      // Get next request from queue
      const request = endpoint.requestQueue.dequeue();
      if (!request) {
        break; // No more requests
      }
      
      // Process the request
      try {
        const result = await this.executeRequestOnEndpoint(request, endpoint);
        request.deferred.resolve(result);
      } catch (error) {
        // Handle request failure
        const shouldRetry = this.shouldRetryRequest(request, error, endpoint);
        if (shouldRetry && request.attempts < 3) {
          // Re-queue for retry
          request.attempts++;
          endpoint.requestQueue.enqueue(request);
        } else {
          request.deferred.reject(error);
        }
      }
      
      // Small delay to prevent tight loops
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  } finally {
    endpoint.queueProcessing = false;
    
    // If there are still queued requests, schedule next processing
    if (endpoint.requestQueue.queue.length > 0) {
      setTimeout(() => this.processEndpointQueue(endpoint), 10);
    }
  }
}
```

6. **Add Backpressure Signaling:**
```javascript
signalBackpressure(request) {
  // Emit backpressure event for upstream systems to handle
  this.emit('backpressure', {
    queueSizes: this.endpoints.map(ep => ep.requestQueue.getStats()),
    globalInFlight: this.globalInFlight,
    maxGlobalInFlight: this.config.maxGlobalInFlight,
    timestamp: Date.now(),
    droppedRequest: {
      method: request.method,
      priority: request.priority,
      age: Date.now() - request.timestamp
    }
  });
}

selectEndpointForQueuing() {
  // Select endpoint with smallest queue and best capacity prospects
  return this.endpoints
    .filter(ep => ep.breaker.state !== 'OPEN' && ep.health.healthy)
    .sort((a, b) => {
      // Sort by queue utilization and endpoint capacity
      const aScore = (a.requestQueue.queue.length / a.requestQueue.maxSize) * 0.6 +
                     (a.stats.inFlight / a.config.maxConcurrent) * 0.4;
      const bScore = (b.requestQueue.queue.length / b.requestQueue.maxSize) * 0.6 +
                     (b.stats.inFlight / b.config.maxConcurrent) * 0.4;
      return aScore - bScore;
    })[0] || null;
}
```

VALIDATION REQUIREMENTS:
Create validation that proves request queuing and backpressure work correctly:

1. **Queue Capacity Management**
   - Send 500+ requests simultaneously to exceed immediate capacity
   - Verify requests are queued when immediate execution impossible
   - Show that queues respect maximum size limits per endpoint
   - Confirm queue processing works correctly as capacity becomes available

2. **Request Prioritization**
   - Mix high-priority trading requests with low-priority health checks
   - Verify trading signal analysis requests get processed first
   - Show that priority ordering is maintained within queues
   - Confirm low-priority requests still get processed eventually

3. **Backpressure Behavior**
   - Fill all endpoint queues to maximum capacity
   - Verify backpressure events are emitted with proper metadata
   - Show that system degrades gracefully without crashing
   - Test alternative endpoint selection when primary queues full

4. **Viral Event Simulation**
   - Simulate 100+ concurrent token analysis requests (viral meme event)
   - Verify system handles burst without dropping requests
   - Show intelligent distribution across endpoint queues
   - Confirm all requests eventually complete within deadline limits

5. **Queue Processing Efficiency**
   - Measure queue processing latency (request queued → executed)
   - Verify processing starts immediately when capacity available
   - Show that expired requests are removed from queues properly
   - Confirm no memory leaks during sustained high-queue periods

SUCCESS CRITERIA:
- System handles 500+ concurrent requests without dropping any within deadline
- Trading signal requests get 90%+ priority over health check requests
- Backpressure events provide actionable metadata for upstream systems
- Queue processing latency averages <100ms when capacity becomes available
- Zero memory leaks during sustained viral event simulation (10+ minutes)

INTEGRATION REQUIREMENTS:
- Maintain all existing RpcConnectionPool interface compatibility
- Preserve agent integration, rate limiting, load balancing, and circuit breaker logic
- Keep all existing statistics and monitoring functionality
- Do not break existing error handling or retry mechanisms

TRADING SYSTEM CONTEXT:
Request queuing is essential for profitable meme coin trading:
- Viral events generate 50-100+ simultaneous analysis requests
- Biggest profit opportunities occur during highest-load periods
- System must handle burst traffic without losing trading opportunities
- Queuing prevents system failure during most profitable market conditions

TEST SCENARIOS:
1. **Normal Trading:** 10-20 requests processed immediately without queuing
2. **Capacity Burst:** 100+ requests queued and processed in priority order
3. **Sustained Viral Event:** 10+ minutes of continuous high request volume
4. **Mixed Priority Load:** Trading signals mixed with health checks and data requests
5. **Queue Overflow:** Test backpressure behavior when all queues reach capacity

Run comprehensive queuing validation and demonstrate that the system gracefully handles viral meme event traffic through intelligent request queuing, prioritization, and backpressure signaling.