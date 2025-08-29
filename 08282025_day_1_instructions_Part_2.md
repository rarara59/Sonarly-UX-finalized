# Session 1: System Protection - Backpressure Management & Graceful Shutdown

**MISSION**: Build critical system protection components that prevent money-losing failures during high-stress trading conditions.

**EXISTING WORKING FOUNDATION** (Claude Code Session 1):
- RPC pool with all 5 critical safety patterns (CS1-CS5) 
- Comprehensive configuration system with 35+ variable validation
- Enhanced production logger with request tracing
- Idempotency manager preventing duplicate trade processing
- Ordered event bus ensuring correct signal sequence
- Real Solana mainnet integration with 54ms latency

---

## MONEY-LOSING FAILURE SCENARIOS TO PREVENT

### **CRITICAL FAILURE #1: System Overload Death Spiral**
**Current Risk**: Viral meme events create 10x normal load → request queue exhaustion → system crashes during peak profit opportunities.
**Financial Impact**: BONK viral event created 50x normal Solana traffic. System must survive or miss entire opportunity (80% of total profits come from viral events).
**Required Solution**: Priority-based backpressure management that maintains critical operations during overload.

### **CRITICAL FAILURE #2: Uncontrolled Shutdown Data Loss**
**Current Risk**: System restart/crash during active trading → lose track of open positions → incomplete trades = capital loss.
**Financial Impact**: Lost trades during system maintenance = partial fills = capital erosion.
**Required Solution**: Graceful shutdown that waits for active trades to complete before system termination.

---

## COMPONENT #1: BACKPRESSURE MANAGEMENT SYSTEM

### **Implementation Requirements**
```javascript
// REQUIRED PATTERN: Priority-based request handling with graceful degradation
class BackpressureManager {
  constructor(config) {
    this.maxQueueSize = config.maxQueueSize || 10000;
    this.warningThreshold = config.warningThreshold || 0.8;     // 80% utilization
    this.criticalThreshold = config.criticalThreshold || 0.95;   // 95% utilization
    this.currentLoad = 0;
    this.metrics = {
      rejectedRequests: 0,
      totalRequests: 0,
      peakLoad: 0
    };
  }
  
  canAcceptRequest(priority = 'normal') {
    // CRITICAL: Reject non-critical requests before system death
    const utilization = this.currentLoad / this.maxQueueSize;
    
    if (utilization > this.criticalThreshold) {
      if (priority !== 'critical') {
        this.metrics.rejectedRequests++;
        return { 
          accepted: false, 
          reason: 'CRITICAL_OVERLOAD',
          utilization: Math.round(utilization * 100)
        };
      }
    }
    
    if (utilization > this.warningThreshold && priority === 'low') {
      this.metrics.rejectedRequests++;
      return { 
        accepted: false, 
        reason: 'WARNING_THRESHOLD_EXCEEDED',
        utilization: Math.round(utilization * 100)
      };
    }
    
    if (this.currentLoad >= this.maxQueueSize) {
      this.metrics.rejectedRequests++;
      return { accepted: false, reason: 'QUEUE_FULL' };
    }
    
    this.metrics.totalRequests++;
    this.currentLoad++;
    this.metrics.peakLoad = Math.max(this.metrics.peakLoad, this.currentLoad);
    
    return { accepted: true, utilization: Math.round(utilization * 100) };
  }
  
  releaseRequest() {
    if (this.currentLoad > 0) {
      this.currentLoad--;
    }
  }
  
  getStats() {
    const utilization = this.currentLoad / this.maxQueueSize;
    return {
      currentLoad: this.currentLoad,
      maxQueueSize: this.maxQueueSize,
      utilization: Math.round(utilization * 100),
      rejectionRate: this.metrics.totalRequests > 0 
        ? this.metrics.rejectedRequests / this.metrics.totalRequests 
        : 0,
      peakLoad: this.metrics.peakLoad,
      status: utilization > this.criticalThreshold ? 'CRITICAL' 
             : utilization > this.warningThreshold ? 'WARNING' 
             : 'HEALTHY'
    };
  }
}
```

### **Integration with Existing RPC Pool**
```javascript
// REQUIRED PATTERN: Protect RPC calls without changing interface
class ProtectedRpcPool {
  constructor(rpcPool, backpressureManager) {
    this.rpcPool = rpcPool;
    this.backpressureManager = backpressureManager;
  }
  
  async call(method, params, options = {}) {
    const priority = options.priority || 'normal';
    
    // Check backpressure before making RPC call
    const requestCheck = this.backpressureManager.canAcceptRequest(priority);
    if (!requestCheck.accepted) {
      return {
        ok: false,
        error: {
          code: 'BACKPRESSURE_REJECTED',
          message: `Request rejected: ${requestCheck.reason}`,
          utilization: requestCheck.utilization
        }
      };
    }
    
    try {
      const result = await this.rpcPool.call(method, params, options);
      return result;
    } finally {
      this.backpressureManager.releaseRequest();
    }
  }
}
```

---

## COMPONENT #2: GRACEFUL SHUTDOWN MANAGER

### **Implementation Requirements**
```javascript
// REQUIRED PATTERN: Protect active trades during shutdown
class GracefulShutdownManager {
  constructor(config = {}) {
    this.activeOperations = new Set();
    this.activeTrades = new Set();
    this.isShuttingDown = false;
    this.shutdownTimeout = config.shutdownTimeoutMs || 30000;  // 30 seconds for trades
    this.forceTimeout = config.forceTimeoutMs || 60000;        // 60 seconds absolute max
    
    // Register signal handlers immediately
    process.on('SIGTERM', () => this.initiateShutdown('SIGTERM'));
    process.on('SIGINT', () => this.initiateShutdown('SIGINT'));
    process.on('SIGUSR1', () => this.initiateShutdown('SIGUSR1'));
  }
  
  registerOperation(operationType, operationId, metadata = {}) {
    const operation = {
      type: operationType,
      id: operationId,
      startTime: Date.now(),
      ...metadata
    };
    
    if (operationType === 'TRADE') {
      this.activeTrades.add(operation);
    } else {
      this.activeOperations.add(operation);
    }
    
    return operation;
  }
  
  completeOperation(operationId) {
    // Remove from both sets (safe to call on non-existent items)
    for (const op of this.activeTrades) {
      if (op.id === operationId) {
        this.activeTrades.delete(op);
        break;
      }
    }
    
    for (const op of this.activeOperations) {
      if (op.id === operationId) {
        this.activeOperations.delete(op);
        break;
      }
    }
  }
  
  async initiateShutdown(signal) {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }
    
    console.log(`Graceful shutdown initiated by ${signal}`);
    console.log(`Active trades: ${this.activeTrades.size}`);
    console.log(`Active operations: ${this.activeOperations.size}`);
    
    this.isShuttingDown = true;
    
    // Set absolute force timeout
    const forceTimeout = setTimeout(() => {
      console.log('Force timeout reached - terminating immediately');
      process.exit(1);
    }, this.forceTimeout);
    
    // Wait for critical trades to complete first (higher priority)
    if (this.activeTrades.size > 0) {
      console.log('Waiting for active trades to complete...');
      
      const tradeTimeout = setTimeout(() => {
        console.log(`Trade timeout - ${this.activeTrades.size} trades remaining`);
      }, this.shutdownTimeout);
      
      while (this.activeTrades.size > 0 && Date.now() - this.shutdownStartTime < this.shutdownTimeout) {
        console.log(`Waiting for ${this.activeTrades.size} trades...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      clearTimeout(tradeTimeout);
      
      if (this.activeTrades.size === 0) {
        console.log('All trades completed');
      } else {
        console.log(`${this.activeTrades.size} trades did not complete in time`);
      }
    }
    
    // Wait for other operations (shorter timeout)
    const operationTimeout = setTimeout(() => {
      console.log('Operation timeout - forcing shutdown');
    }, Math.min(this.shutdownTimeout, 10000));
    
    while (this.activeOperations.size > 0) {
      console.log(`Waiting for ${this.activeOperations.size} operations...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    clearTimeout(operationTimeout);
    clearTimeout(forceTimeout);
    
    console.log('Graceful shutdown complete');
    process.exit(0);
  }
  
  getShutdownStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      activeTrades: this.activeTrades.size,
      activeOperations: this.activeOperations.size,
      tradeDetails: Array.from(this.activeTrades).map(t => ({
        id: t.id,
        type: t.type,
        duration: Date.now() - t.startTime
      }))
    };
  }
}
```

---

## INTEGRATION WITH EXISTING SYSTEM

### **Configuration Integration**
```javascript
// ADD TO thorp-config.js:
backpressure: {
  enabled: parseBoolean(process.env.ENABLE_BACKPRESSURE_MANAGEMENT) || true,
  maxQueueSize: parseInt(process.env.BACKPRESSURE_MAX_QUEUE_SIZE) || 10000,
  warningThreshold: parseFloat(process.env.BACKPRESSURE_WARNING_THRESHOLD) || 0.8,
  criticalThreshold: parseFloat(process.env.BACKPRESSURE_CRITICAL_THRESHOLD) || 0.95
},

shutdown: {
  enabled: parseBoolean(process.env.ENABLE_GRACEFUL_SHUTDOWN) || true,
  shutdownTimeoutMs: parseInt(process.env.SHUTDOWN_TIMEOUT_MS) || 30000,
  forceTimeoutMs: parseInt(process.env.FORCE_SHUTDOWN_TIMEOUT_MS) || 60000
}
```

### **System Startup Integration**
```javascript
// INTEGRATION PATTERN: Layer over existing components
const config = loadThorpConfig();
const backpressureManager = new BackpressureManager(config.backpressure);
const shutdownManager = new GracefulShutdownManager(config.shutdown);

// Wrap existing RPC pool with backpressure protection
const protectedRpcPool = new ProtectedRpcPool(rpcPool, backpressureManager);

// Export for use by rest of system
export { protectedRpcPool as rpcPool, shutdownManager, backpressureManager };
```

---

## COMPREHENSIVE TESTING REQUIREMENTS

### **YOU MUST CREATE AND RUN THESE TESTS**

#### **Test 1: Backpressure Under Normal Load**
```javascript
// FILE: scripts/test-backpressure-normal.js
async function testBackpressureNormalOperation() {
  const backpressure = new BackpressureManager({ 
    maxQueueSize: 100,
    warningThreshold: 0.8,
    criticalThreshold: 0.95
  });
  
  console.log('Testing backpressure under normal load...');
  
  // Normal load should all be accepted
  for (let i = 0; i < 70; i++) {
    const result = backpressure.canAcceptRequest('normal');
    assert(result.accepted === true, `Request ${i} should be accepted`);
  }
  
  const stats = backpressure.getStats();
  assert(stats.status === 'HEALTHY', 'Should be healthy under normal load');
  assert(stats.utilization === 70, 'Utilization should be 70%');
  
  console.log('✅ Normal load test passed');
}
```

#### **Test 2: Backpressure Priority Handling**
```javascript
// FILE: scripts/test-backpressure-priority.js
async function testBackpressurePriorityHandling() {
  const backpressure = new BackpressureManager({ 
    maxQueueSize: 100,
    warningThreshold: 0.8,
    criticalThreshold: 0.95
  });
  
  console.log('Testing backpressure priority handling...');
  
  // Fill to warning threshold
  for (let i = 0; i < 85; i++) {
    backpressure.canAcceptRequest('normal');
  }
  
  // Should reject low priority at warning threshold
  const lowResult = backpressure.canAcceptRequest('low');
  assert(lowResult.accepted === false, 'Should reject low priority at warning threshold');
  
  // Fill to critical threshold  
  for (let i = 85; i < 96; i++) {
    backpressure.canAcceptRequest('normal');
  }
  
  // Should reject normal priority at critical threshold
  const normalResult = backpressure.canAcceptRequest('normal');
  assert(normalResult.accepted === false, 'Should reject normal priority at critical threshold');
  
  // Should still accept critical priority
  const criticalResult = backpressure.canAcceptRequest('critical');
  assert(criticalResult.accepted === true, 'Should accept critical priority even at critical threshold');
  
  console.log('✅ Priority handling test passed');
}
```

#### **Test 3: Viral Event Simulation**
```javascript
// FILE: scripts/test-viral-event-simulation.js
async function testViralEventHandling() {
  const backpressure = new BackpressureManager({ maxQueueSize: 1000 });
  
  console.log('Simulating BONK viral event (10x normal load)...');
  
  const requests = [];
  const startTime = Date.now();
  
  // Simulate sudden load spike
  for (let i = 0; i < 5000; i++) {
    const priority = Math.random() < 0.1 ? 'critical' 
                   : Math.random() < 0.8 ? 'normal' 
                   : 'low';
    
    const result = backpressure.canAcceptRequest(priority);
    requests.push({ priority, accepted: result.accepted });
    
    if (result.accepted) {
      // Simulate request completion
      setTimeout(() => backpressure.releaseRequest(), Math.random() * 100);
    }
  }
  
  const duration = Date.now() - startTime;
  const stats = backpressureManager.getStats();
  
  const criticalAccepted = requests.filter(r => r.priority === 'critical' && r.accepted).length;
  const criticalTotal = requests.filter(r => r.priority === 'critical').length;
  const criticalAcceptanceRate = criticalAccepted / criticalTotal;
  
  console.log(`Viral event processed in ${duration}ms`);
  console.log(`System status: ${stats.status}`);
  console.log(`Critical acceptance rate: ${Math.round(criticalAcceptanceRate * 100)}%`);
  console.log(`Overall rejection rate: ${Math.round(stats.rejectionRate * 100)}%`);
  
  // Critical requests should have high acceptance rate
  assert(criticalAcceptanceRate > 0.9, `Critical acceptance rate should be >90%, got ${Math.round(criticalAcceptanceRate * 100)}%`);
  assert(duration < 1000, 'Viral event processing should complete in <1 second');
  
  console.log('✅ Viral event simulation test passed');
}
```

#### **Test 4: Graceful Shutdown with Active Trades**
```javascript
// FILE: scripts/test-graceful-shutdown.js
async function testGracefulShutdownWithTrades() {
  console.log('Testing graceful shutdown with active trades...');
  
  const shutdownManager = new GracefulShutdownManager({
    shutdownTimeoutMs: 3000,
    forceTimeoutMs: 5000
  });
  
  // Register active trades and operations
  shutdownManager.registerOperation('TRADE', 'bonk_buy_1', { token: 'BONK', amount: 1000 });
  shutdownManager.registerOperation('TRADE', 'pepe_sell_1', { token: 'PEPE', amount: 2000 });
  shutdownManager.registerOperation('RPC_CALL', 'rpc_call_1');
  
  const shutdownPromise = new Promise((resolve) => {
    const originalExit = process.exit;
    let exitCalled = false;
    
    process.exit = (code) => {
      if (!exitCalled) {
        exitCalled = true;
        process.exit = originalExit; // Restore
        resolve({ code, duration: Date.now() - startTime });
      }
    };
    
    const startTime = Date.now();
    shutdownManager.initiateShutdown('TEST_SIGNAL');
  });
  
  // Simulate trades completing over time
  setTimeout(() => {
    shutdownManager.completeOperation('rpc_call_1');
    console.log('RPC operation completed');
  }, 500);
  
  setTimeout(() => {
    shutdownManager.completeOperation('bonk_buy_1');
    console.log('BONK trade completed');
  }, 1500);
  
  setTimeout(() => {
    shutdownManager.completeOperation('pepe_sell_1');
    console.log('PEPE trade completed');
  }, 2000);
  
  const result = await shutdownPromise;
  
  console.log(`Shutdown completed in ${result.duration}ms with exit code ${result.code}`);
  
  assert(result.code === 0, 'Should exit cleanly when all operations complete');
  assert(result.duration >= 2000, 'Should wait for trades to complete');
  assert(result.duration < 4000, 'Should not wait longer than necessary');
  
  console.log('✅ Graceful shutdown test passed');
}
```

#### **Test 5: Real Solana Integration with Protection**
```javascript
// FILE: scripts/test-protected-rpc-integration.js
async function testProtectedRpcWithSolana() {
  console.log('Testing protected RPC calls with real Solana...');
  
  const config = loadThorpConfig();
  const originalRpcPool = new RpcConnectionPool(config.rpc, dependencies);
  const backpressureManager = new BackpressureManager(config.backpressure);
  const protectedRpcPool = new ProtectedRpcPool(originalRpcPool, backpressureManager);
  
  // Normal priority calls should work
  const normalResult = await protectedRpcPool.call('getVersion', [], { priority: 'normal' });
  assert(normalResult.ok === true, 'Normal priority RPC call should succeed');
  console.log('✅ Normal priority call successful');
  
  // Fill backpressure to critical level
  for (let i = 0; i < backpressureManager.maxQueueSize * 0.96; i++) {
    backpressureManager.canAcceptRequest('normal');
  }
  
  // Normal calls should be rejected
  const rejectedResult = await protectedRpcPool.call('getBlockHeight', [], { priority: 'normal' });
  assert(rejectedResult.ok === false, 'Normal priority should be rejected at critical load');
  assert(rejectedResult.error.code === 'BACKPRESSURE_REJECTED', 'Should have backpressure rejection error');
  
  // Critical calls should still work
  const criticalResult = await protectedRpcPool.call('getBlockHeight', [], { priority: 'critical' });
  assert(criticalResult.ok === true, 'Critical priority call should succeed even at critical load');
  
  console.log('✅ Protected RPC integration test passed');
}
```

---

## FILES TO CREATE

1. **src/components/backpressure-manager.js** - System overload protection
2. **src/utils/graceful-shutdown.js** - Safe shutdown with active operation protection  
3. **src/adapters/protected-rpc-pool.js** - RPC pool wrapper with backpressure protection
4. **scripts/test-backpressure-normal.js** - Normal load testing
5. **scripts/test-backpressure-priority.js** - Priority handling testing
6. **scripts/test-viral-event-simulation.js** - High load simulation
7. **scripts/test-graceful-shutdown.js** - Shutdown protection testing
8. **scripts/test-protected-rpc-integration.js** - Real Solana integration testing

## CRITICAL SUCCESS CRITERIA

**You must RUN all tests and show me the results. Both components must:**

1. **Backpressure Manager**: Handle 5000 requests with priority-based acceptance/rejection
2. **Graceful Shutdown**: Wait for active trades to complete before system termination
3. **Real Solana Integration**: Protected RPC calls work with actual mainnet
4. **Memory Stability**: No memory leaks during viral event simulation
5. **Performance**: All tests complete in <30 seconds total

**The system must be ready for Session 2 with proven backpressure protection and graceful shutdown capabilities.**