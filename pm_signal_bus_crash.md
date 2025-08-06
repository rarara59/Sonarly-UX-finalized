# FIX: Performance Monitor SignalBus Crash

## Issue
PerformanceMonitor missing recordCycle() method crashes SignalBus on startup. Sort operation on every event violates <0.1ms requirement.

## Files to Change
- `src/core/performance-monitor.js`

## Required Changes
1. Add missing recordCycle method for SignalBus compatibility
2. Fix contract property mismatch (maxFailureRate vs maxErrorRate)
3. Remove expensive sort operation from hot path
4. Add resource cleanup tracking

## Commands

```bash
# Add recordCycle method after recordLatency method
sed -i '/recordLatency(serviceName, latencyMs, success = true) {/,/^  }/a\\n  // SignalBus compatibility method\n  recordCycle(latencyMs, count = 1, success = true) {\n    this.recordLatency('\''signalBus'\'', latencyMs, success);\n  }' src/core/performance-monitor.js

# Fix contract property name mismatch
sed -i 's/maxFailureRate/maxErrorRate/g' src/core/performance-monitor.js

# Remove expensive updateServiceMetrics call from recordLatency
sed -i '/this\.updateServiceMetrics(serviceName);/d' src/core/performance-monitor.js

# Add signalBus to contracts for recordCycle compatibility
sed -i '/pipelineCoordinator: { maxLatency: 30, minUptime: 0.999, maxBacklog: 50 }/a\      signalBus: { maxLatency: 0.1, maxErrorRate: 0.001 }' src/core/performance-monitor.js

# Add resource tracking to constructor
sed -i '/this.systemMetrics = {/i\    this.intervals = [];\n    this.timeouts = [];' src/core/performance-monitor.js

# Store intervals in startMetricsCollection
sed -i 's/setInterval(/this.intervals.push(setInterval(/g' src/core/performance-monitor.js
```

## Test Fix

```bash
# Test recordCycle method exists
node -e "
import('./src/core/performance-monitor.js').then(({PerformanceMonitor}) => {
  const pm = new PerformanceMonitor();
  console.log('recordCycle exists:', typeof pm.recordCycle === 'function');
  pm.recordCycle(0.05, 1, true);
  console.log('recordCycle works without crash');
});"

# Test SignalBus integration
node -e "
Promise.all([
  import('./src/core/performance-monitor.js'),
  import('./src/core/signal-bus.js')
]).then(([{PerformanceMonitor}, {SignalBus}]) => {
  const pm = new PerformanceMonitor();
  const bus = new SignalBus(null, pm);
  bus.emit('testEvent', {test: true});
  console.log('✅ SignalBus + PerformanceMonitor integration works');
}).catch(err => console.log('❌ Integration failed:', err.message));"

# Test performance - should be fast without sort overhead
node -e "
import('./src/core/performance-monitor.js').then(({PerformanceMonitor}) => {
  const pm = new PerformanceMonitor();
  const start = performance.now();
  for(let i = 0; i < 1000; i++) {
    pm.recordCycle(0.05, 1, true);
  }
  const time = performance.now() - start;
  console.log('1000 recordCycle calls in', time.toFixed(2), 'ms');
  console.log('Meets performance target:', time < 100);
});"
```

## Validation Checklist
- [ ] recordCycle method exists and doesn't crash
- [ ] SignalBus integration works without TypeError  
- [ ] Contract properties use consistent naming (maxErrorRate)
- [ ] 1000 recordCycle calls complete in <100ms
- [ ] Resource tracking arrays added to constructor