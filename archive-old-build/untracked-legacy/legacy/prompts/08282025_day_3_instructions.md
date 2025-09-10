# Day 3: Circuit Breaker Integration & Signal Bus Implementation

**MISSION**: Enhance existing working foundation with production-grade circuit breaker integration and event-driven signal bus while preserving all current functionality.

**EXISTING WORKING FOUNDATION TO PRESERVE**:
- RPC connection pool with real Solana mainnet integration (54ms latency)
- Circuit breaker implementation (impl/circuit-breaker.real.js) with three-state functionality
- Multi-endpoint failover (Helius → Chainstack → Public)
- Configuration and logging systems
- All safety patterns and production enhancements

---

## MONEY-LOSING FAILURE SCENARIOS TO PREVENT

### **CRITICAL FAILURE #1: Cascade Failure During Network Congestion**
**Current Risk**: Circuit breaker exists but not properly integrated as fault isolation boundary → single endpoint failure cascades to entire system shutdown.
**Financial Impact**: System completely unavailable during Solana network congestion when meme coin opportunities are highest.
**Business Context**: Retail competitors manually switch endpoints in 3-5 minutes. System must auto-isolate failures in <1 second.

### **CRITICAL FAILURE #2: Signal Processing Chaos During Viral Events** 
**Current Risk**: No event bus system → components communicate directly → system overload during viral meme events → complete processing failure.
**Financial Impact**: Miss 100% of trading opportunities during highest-volume periods that generate 80% of profits.
**Business Context**: Viral meme coins create 10-100x normal signal volume. System must handle gracefully or lose peak opportunities.

### **CRITICAL FAILURE #3: Subscriber Isolation Failures**
**Current Risk**: One component crash kills entire signal processing pipeline.
**Financial Impact**: Single validation error stops all trade signal processing.
**Business Context**: Need fault isolation so validation failures don't kill execution pipeline.

### **CRITICAL FAILURE #4: Event Ordering Corruption**
**Current Risk**: No event ordering guarantees → out-of-order signals → wrong trading decisions based on stale data.
**Financial Impact**: Trading on stale price data = consistent losses.
**Business Context**: Meme coin prices change rapidly. Processing signals out of order = trading on wrong prices.

### **CRITICAL FAILURE #5: System Overload Death Spiral**
**Current Risk**: No backpressure handling in event processing → queue exhaustion → system crashes during peak opportunities.
**Financial Impact**: System fails exactly when trading volume and profits are maximum.
**Business Context**: Need priority-based processing to handle critical signals during overload.

---

## CIRCUIT BREAKER INTEGRATION REQUIREMENTS

### **CURRENT STATE**: Working circuit breaker in impl/circuit-breaker.real.js
### **REQUIRED**: Separate circuit breaker module with RPC pool integration

#### **Integration Architecture Pattern**
```javascript
// REQUIRED PATTERN: Circuit breaker as separate fault isolation boundary

class RpcConnectionPool {
  constructor(config, dependencies) {
    this.circuitBreaker = dependencies.circuitBreaker; // Injected, not embedded
    // ... existing functionality preserved
  }
  
  async call(method, params, options = {}) {
    // CRITICAL: Use circuit breaker to wrap RPC calls for fault isolation
    return await this.circuitBreaker.execute(`rpc_${method}`, async () => {
      return await this._executeRpcCall(method, params, options);
    });
  }
}

// Circuit breaker protects system without being embedded in RPC pool
const rpcPool = new RpcConnectionPool(config, { circuitBreaker });
```

#### **Per-Endpoint Isolation Pattern**
```javascript
// REQUIRED PATTERN: Isolate failures per endpoint, not globally

class EndpointCircuitBreaker {
  constructor() {
    this.endpointBreakers = new Map(); // One breaker per endpoint
  }
  
  async executeOnEndpoint(endpoint, operation) {
    let breaker = this.endpointBreakers.get(endpoint.url);
    if (!breaker) {
      breaker = new CircuitBreaker({
        name: `endpoint_${endpoint.url}`,
        failureThreshold: 5,
        cooldownMs: 60000
      });
      this.endpointBreakers.set(endpoint.url, breaker);
    }
    
    return await breaker.execute(operation);
  }
}
```

#### **Time-Based Quarantine with Jitter**
```javascript
// REQUIRED PATTERN: Prevent thundering herd during recovery

class CircuitBreakerWithJitter {
  calculateRecoveryTime(cooldownMs) {
    // Add jitter to prevent all circuits opening/closing simultaneously
    const jitter = Math.random() * 0.1 * cooldownMs; // 10% jitter
    return cooldownMs + jitter;
  }
  
  shouldAttemptRecovery() {
    const now = Date.now();
    const recoveryTime = this.lastFailureTime + this.calculateRecoveryTime(this.cooldownMs);
    return now >= recoveryTime;
  }
}
```

---

## SIGNAL BUS IMPLEMENTATION REQUIREMENTS

### **EVENT-DRIVEN COMMUNICATION ARCHITECTURE**

#### **Bounded Event Queues with Size Limits**
```javascript
// REQUIRED PATTERN: Prevent memory exhaustion during viral events

class SignalBus {
  constructor(config = {}) {
    this.topics = new Map();
    this.maxQueueSize = config.maxQueueSize || 10000;
    this.maxSubscribers = config.maxSubscribers || 100;
  }
  
  publish(topic, event) {
    const topicData = this.topics.get(topic);
    if (!topicData) return false;
    
    // CRITICAL: Bounded queues prevent memory exhaustion
    if (topicData.queue.length >= this.maxQueueSize) {
      this.metrics.recordDroppedEvent(topic, 'QUEUE_FULL');
      return false;
    }
    
    topicData.queue.push({
      ...event,
      timestamp: Date.now(),
      sequence: this.getNextSequence(topic)
    });
    
    this.processQueue(topic);
    return true;
  }
}
```

#### **Subscriber Isolation Pattern**
```javascript
// REQUIRED PATTERN: One subscriber crash doesn't kill others

class IsolatedSubscriberManager {
  async deliverToSubscriber(subscriber, event) {
    try {
      await subscriber.handler(event);
      this.recordSuccess(subscriber.id);
    } catch (error) {
      // CRITICAL: Isolate subscriber failures
      this.recordFailure(subscriber.id, error);
      this.logger.error('Subscriber failed - continuing with others', {
        subscriberId: subscriber.id,
        topic: event.topic,
        error: error.message
      });
      
      // Don't let one bad subscriber kill event processing
      if (this.getFailureRate(subscriber.id) > 0.5) {
        this.quarantineSubscriber(subscriber.id);
      }
    }
  }
}
```

#### **Event Ordering Guarantees**
```javascript
// REQUIRED PATTERN: Ensure signals processed in correct order

class OrderedEventProcessor {
  constructor() {
    this.sequenceCounters = new Map(); // topic -> sequence
    this.pendingEvents = new Map();    // topic -> ordered buffer
  }
  
  processInOrder(topic, event) {
    const expectedSequence = this.getExpectedSequence(topic);
    
    if (event.sequence === expectedSequence) {
      // Process immediately
      this.deliverEvent(topic, event);
      this.incrementSequence(topic);
      
      // Check for buffered events that can now be processed
      this.processBufferedEvents(topic);
    } else if (event.sequence > expectedSequence) {
      // Buffer out-of-order event
      this.bufferEvent(topic, event);
    } else {
      // Duplicate or very old event - ignore
      this.recordDuplicateEvent(topic, event);
    }
  }
}
```

#### **Critical vs Normal Event Prioritization**
```javascript
// REQUIRED PATTERN: Handle critical signals during overload

class PriorityEventQueue {
  constructor() {
    this.criticalQueue = [];   // High priority (system health, errors)
    this.normalQueue = [];     // Normal priority (trade signals) 
    this.lowQueue = [];        // Low priority (metrics, logging)
  }
  
  enqueue(event, priority = 'normal') {
    const eventWithPriority = { ...event, priority, enqueuedAt: Date.now() };
    
    switch (priority) {
      case 'critical':
        this.criticalQueue.push(eventWithPriority);
        break;
      case 'normal':
        this.normalQueue.push(eventWithPriority);
        break;
      case 'low':
        this.lowQueue.push(eventWithPriority);
        break;
    }
    
    this.processQueues();
  }
  
  dequeue() {
    // Process critical events first
    if (this.criticalQueue.length > 0) {
      return this.criticalQueue.shift();
    }
    
    // During overload, limit normal processing
    if (this.isOverloaded() && Math.random() > 0.5) {
      return null; // Skip normal events during overload
    }
    
    if (this.normalQueue.length > 0) {
      return this.normalQueue.shift();
    }
    
    if (this.lowQueue.length > 0) {
      return this.lowQueue.shift();
    }
    
    return null;
  }
}
```

---

## INTEGRATION WITH EXISTING FOUNDATION

### **PRESERVE ALL EXISTING FUNCTIONALITY**
- Keep working RPC pool with real Solana integration
- Maintain 54ms latency performance 
- Preserve all safety patterns (CS1-CS5)
- Keep configuration and logging systems
- Maintain all existing test suites

### **ENHANCE WITHOUT BREAKING**
```javascript
// INTEGRATION PATTERN: Add circuit breaker and signal bus without modifying core RPC pool logic

// Current working pattern (PRESERVE THIS):
const rpcPool = new RpcConnectionPool(config, dependencies);
const result = await rpcPool.call('getVersion', []);

// Enhanced pattern (ADD THIS LAYER):
const circuitBreakerManager = new CircuitBreakerManager(config);
const signalBus = new SignalBus(config);

// Wire circuit breaker as fault isolation boundary
const protectedRpcPool = circuitBreakerManager.protect(rpcPool);

// Wire signal bus for component communication
signalBus.subscribe('rpc_call_completed', (event) => {
  // Handle RPC completion events
});

// Usage remains the same but now has fault isolation and event communication
const result = await protectedRpcPool.call('getVersion', []);
```

---

## COMPREHENSIVE VALIDATION REQUIREMENTS

### **CIRCUIT BREAKER VALIDATION TESTS**

#### **P3.1: Failure Threshold Testing**
```javascript
// Test: Circuit breaker trips on N consecutive failures
async function testFailureThreshold() {
  const breaker = new CircuitBreaker({ failureThreshold: 3 });
  
  // Simulate 2 failures - should stay CLOSED
  for (let i = 0; i < 2; i++) {
    try {
      await breaker.execute(() => Promise.reject(new Error('Simulated failure')));
    } catch (e) { /* expected */ }
  }
  assert(breaker.getState() === 'CLOSED', 'Should stay CLOSED after 2 failures');
  
  // 3rd failure should OPEN the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error('Simulated failure')));
  } catch (e) { /* expected */ }
  assert(breaker.getState() === 'OPEN', 'Should OPEN after 3 failures');
}
```

#### **P3.2: Cooldown Period Testing**
```javascript
// Test: Circuit breaker respects cooldown period
async function testCooldownPeriod() {
  const breaker = new CircuitBreaker({ 
    failureThreshold: 1, 
    cooldownMs: 2000 
  });
  
  // Trip the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error('Trip circuit')));
  } catch (e) { /* expected */ }
  
  // Should be OPEN immediately after trip
  assert(breaker.getState() === 'OPEN', 'Should be OPEN after trip');
  
  // Should still be OPEN before cooldown expires
  await new Promise(resolve => setTimeout(resolve, 1000));
  assert(breaker.getState() === 'OPEN', 'Should stay OPEN during cooldown');
  
  // Should be HALF-OPEN after cooldown expires
  await new Promise(resolve => setTimeout(resolve, 1500));
  assert(breaker.getState() === 'HALF_OPEN', 'Should be HALF_OPEN after cooldown');
}
```

#### **P3.3: Recovery Verification Testing**
```javascript
// Test: Circuit breaker transitions HALF_OPEN -> CLOSED on success
async function testRecoveryTransition() {
  const breaker = new CircuitBreaker({ 
    failureThreshold: 1, 
    cooldownMs: 100 
  });
  
  // Trip the circuit and wait for HALF_OPEN
  await tripCircuitAndWaitForHalfOpen(breaker);
  
  // Successful call should close circuit
  const result = await breaker.execute(() => Promise.resolve('success'));
  assert(result === 'success', 'Should return successful result');
  assert(breaker.getState() === 'CLOSED', 'Should be CLOSED after successful recovery');
}
```

#### **P3.4: False Trip Prevention Testing**
```javascript
// Test: Circuit breaker doesn't trip on temporary failures
async function testFalseTrip Prevention() {
  const breaker = new CircuitBreaker({ 
    failureThreshold: 5,
    resetTimeoutMs: 1000 
  });
  
  // Mix of failures and successes should not trip circuit
  const results = [];
  for (let i = 0; i < 10; i++) {
    try {
      const result = await breaker.execute(() => {
        return i % 3 === 0 ? Promise.reject(new Error('Intermittent failure')) 
                            : Promise.resolve(`success-${i}`);
      });
      results.push(result);
    } catch (e) {
      results.push(`error-${i}`);
    }
  }
  
  assert(breaker.getState() === 'CLOSED', 'Should stay CLOSED with intermittent failures');
  assert(results.filter(r => r.startsWith('success')).length >= 5, 'Should have successful calls');
}
```

#### **P3.5: Load Testing**
```javascript
// Test: Circuit breaker works correctly under high load
async function testCircuitBreakerUnderLoad() {
  const breaker = new CircuitBreaker({ 
    failureThreshold: 10,
    maxConcurrent: 100 
  });
  
  // Generate 1000 concurrent requests
  const promises = [];
  for (let i = 0; i < 1000; i++) {
    promises.push(
      breaker.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        if (Math.random() < 0.05) { // 5% failure rate
          throw new Error('Simulated failure under load');
        }
        return `result-${i}`;
      })
    );
  }
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  assert(successful > 900, 'Should handle most requests successfully');
  assert(breaker.getState() === 'CLOSED', 'Should remain stable under load');
}
```

### **SIGNAL BUS VALIDATION TESTS**

#### **Event Ordering Validation**
```javascript
// Test: Signal bus delivers events in correct order
async function testEventOrdering() {
  const signalBus = new SignalBus();
  const receivedEvents = [];
  
  signalBus.subscribe('test_topic', (event) => {
    receivedEvents.push(event);
  });
  
  // Publish events out of order
  signalBus.publish('test_topic', { data: 'third', sequence: 3 });
  signalBus.publish('test_topic', { data: 'first', sequence: 1 });
  signalBus.publish('test_topic', { data: 'second', sequence: 2 });
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  assert(receivedEvents.length === 3, 'Should receive all events');
  assert(receivedEvents[0].data === 'first', 'First event should be delivered first');
  assert(receivedEvents[1].data === 'second', 'Second event should be delivered second'); 
  assert(receivedEvents[2].data === 'third', 'Third event should be delivered third');
}
```

#### **Subscriber Isolation Testing**
```javascript
// Test: One subscriber crash doesn't affect others
async function testSubscriberIsolation() {
  const signalBus = new SignalBus();
  const goodSubscriberEvents = [];
  
  // Good subscriber
  signalBus.subscribe('test_topic', (event) => {
    goodSubscriberEvents.push(event);
  });
  
  // Bad subscriber that crashes
  signalBus.subscribe('test_topic', (event) => {
    throw new Error('Subscriber crash simulation');
  });
  
  // Publish event
  signalBus.publish('test_topic', { data: 'test_event' });
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  assert(goodSubscriberEvents.length === 1, 'Good subscriber should receive event');
  assert(goodSubscriberEvents[0].data === 'test_event', 'Good subscriber should receive correct data');
}
```

#### **Backpressure Management Testing**
```javascript
// Test: Signal bus handles overload gracefully
async function testBackpressureHandling() {
  const signalBus = new SignalBus({ maxQueueSize: 100 });
  
  // Fill queue to capacity
  for (let i = 0; i < 100; i++) {
    const published = signalBus.publish('test_topic', { data: `event-${i}` });
    assert(published === true, `Should accept event ${i}`);
  }
  
  // Next event should be rejected
  const overflowPublished = signalBus.publish('test_topic', { data: 'overflow' });
  assert(overflowPublished === false, 'Should reject event when queue full');
  
  const stats = signalBus.getStats();
  assert(stats.droppedEvents > 0, 'Should record dropped events');
}
```

---

## REAL SOLANA INTEGRATION TESTING

### **End-to-End Circuit Breaker with Real RPC**
```javascript
// Test: Circuit breaker protects real Solana RPC calls
async function testCircuitBreakerWithRealSolana() {
  const config = getRpcPoolConfig();
  const circuitBreaker = new CircuitBreaker({ failureThreshold: 3 });
  const rpcPool = new RpcConnectionPool(config, { circuitBreaker });
  
  // Normal operation should work
  const result1 = await rpcPool.call('getVersion', []);
  assert(result1.ok === true, 'Normal RPC call should succeed');
  
  // Simulate endpoint failures by using invalid endpoint
  const badConfig = { ...config, endpoints: [{ url: 'https://invalid-endpoint.com', weight: 1 }] };
  const badRpcPool = new RpcConnectionPool(badConfig, { circuitBreaker });
  
  // Multiple failures should trip circuit
  for (let i = 0; i < 5; i++) {
    try {
      await badRpcPool.call('getVersion', []);
    } catch (e) { /* expected failures */ }
  }
  
  assert(circuitBreaker.getState() === 'OPEN', 'Circuit should be OPEN after repeated failures');
}
```

### **Signal Bus with Real Trading Events**
```javascript
// Test: Signal bus handles real meme coin trading signals
async function testSignalBusWithTradingEvents() {
  const signalBus = new SignalBus();
  const processedSignals = [];
  
  // Simulate trading signal processor
  signalBus.subscribe('trade_signal', (signal) => {
    processedSignals.push({
      token: signal.token,
      action: signal.action,
      timestamp: signal.timestamp,
      processedAt: Date.now()
    });
  });
  
  // Simulate meme coin detection events
  const memeTokens = ['BONK', 'PEPE', 'DOGE', 'SHIB'];
  for (const token of memeTokens) {
    signalBus.publish('trade_signal', {
      token,
      action: 'BUY',
      price: Math.random() * 0.001,
      confidence: 0.8,
      timestamp: Date.now()
    }, 'critical'); // Critical priority for trade signals
  }
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 200));
  
  assert(processedSignals.length === 4, 'Should process all trade signals');
  assert(processedSignals.every(s => s.action === 'BUY'), 'All signals should be BUY actions');
}
```

---

## FILES TO CREATE/ENHANCE

### **NEW FILES (Day 3 Specific)**
1. **src/detection/core/circuit-breaker.js** - Separate circuit breaker module with RPC pool integration
2. **src/detection/core/signal-bus.js** - Event-driven communication system
3. **src/detection/core/endpoint-circuit-manager.js** - Per-endpoint circuit breaker management
4. **scripts/test-circuit-breaker-integration.js** - Circuit breaker integration testing
5. **scripts/test-signal-bus.js** - Signal bus comprehensive testing
6. **scripts/test-day3-integration.js** - Combined circuit breaker + signal bus testing

### **ENHANCED FILES**
7. **src/components/rpc-connection-pool.js** - Integrate with separate circuit breaker module
8. **src/config/index.js** - Add signal bus and circuit breaker configuration
9. **package.json** - Add Day 3 testing scripts

### **TESTING FILES**
10. **scripts/test-phase3-checklist.js** - Validate all P3.1-P3.5 checklist requirements
11. **scripts/stress-test-day3.js** - High-load testing for circuit breaker and signal bus
12. **scripts/test-real-solana-integration-day3.js** - Real Solana testing with fault injection

---

## CRITICAL SUCCESS CRITERIA

### **CIRCUIT BREAKER REQUIREMENTS** 
- P3.1: Trips on exactly N consecutive failures (configurable threshold)
- P3.2: Respects cooldown period before attempting recovery
- P3.3: Transitions HALF_OPEN → CLOSED on successful recovery
- P3.4: Doesn't false trip on intermittent failures
- P3.5: Operates correctly under high concurrent load (100+ requests/sec)
- Integration: Works as separate module, not embedded in RPC pool
- Isolation: Per-endpoint failure isolation prevents cascade failures

### **SIGNAL BUS REQUIREMENTS**
- Bounded queues prevent memory exhaustion during viral events
- Subscriber isolation prevents component crashes from affecting others
- Event ordering guarantees ensure signals processed in correct sequence
- Backpressure handling maintains system stability during overload
- Priority-based processing handles critical signals during congestion
- Real-time delivery: <1ms latency for intra-system communication

### **INTEGRATION REQUIREMENTS**
- All existing functionality preserved (RPC pool, logging, configuration)
- Real Solana integration continues working with <60ms latency
- Circuit breaker protects RPC calls without changing call interface
- Signal bus enables component communication without tight coupling
- Memory usage remains stable during extended operation
- System startup/shutdown procedures work with new components

### **PRODUCTION READINESS**
- Comprehensive test coverage for all failure scenarios
- Load testing with 1000+ concurrent operations
- Fault injection testing with real network failures
- Performance validation under realistic trading loads
- Integration testing with existing Day 1-2 components
- Documentation for configuration and usage

**The enhanced system must provide fault isolation and event-driven communication ready for Day 4+ integration with transaction detection and signal processing components.**