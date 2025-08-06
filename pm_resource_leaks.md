# FIX: Performance Monitor Resource Leaks

## Issue
setTimeout not tracked and no shutdown method causes resource leaks. Metrics never calculated so monitoring shows zero data.

## Files to Change
- `src/core/performance-monitor.js`

## Required Changes
1. Track setTimeout in triggerAlert method
2. Add shutdown method for resource cleanup
3. Calculate metrics on demand in getSnapshot

## Commands

```bash
# Track setTimeout in triggerAlert method
sed -i '/setTimeout(() => this.alerts.delete(alertKey), 60000);/c\    this.timeouts.push(setTimeout(() => this.alerts.delete(alertKey), 60000));' src/core/performance-monitor.js

# Add shutdown method after reset method
sed -i '/reset() {/,/^  }/a\\n  // Cleanup resources for graceful shutdown\n  shutdown() {\n    this.intervals.forEach(clearInterval);\n    this.timeouts.forEach(clearTimeout);\n    this.intervals = [];\n    this.timeouts = [];\n  }' src/core/performance-monitor.js

# Calculate fresh metrics at start of getSnapshot
sed -i '/getSnapshot() {/a\    // Calculate fresh metrics for accurate snapshot\n    this.metrics.forEach((_, serviceName) => this.updateServiceMetrics(serviceName));' src/core/performance-monitor.js
```

## Test Fix

```bash
# Test timeout tracking
node -e "
import('./src/core/performance-monitor.js').then(({PerformanceMonitor}) => {
  const pm = new PerformanceMonitor();
  pm.triggerAlert('test', 'TEST_ALERT', {});
  console.log('Timeouts tracked:', pm.timeouts.length > 0);
});"

# Test shutdown method
node -e "
import('./src/core/performance-monitor.js').then(({PerformanceMonitor}) => {
  const pm = new PerformanceMonitor();
  console.log('Shutdown method exists:', typeof pm.shutdown === 'function');
  pm.shutdown();
  console.log('Resources cleaned:', pm.intervals.length === 0 && pm.timeouts.length === 0);
});"

# Test metrics calculation
node -e "
import('./src/core/performance-monitor.js').then(({PerformanceMonitor}) => {
  const pm = new PerformanceMonitor();
  pm.recordLatency('signalBus', 0.05, true);
  pm.recordLatency('signalBus', 0.07, true);
  const snapshot = pm.getSnapshot();
  console.log('Metrics calculated:', snapshot.services.signalBus.avgLatency > 0);
});"
```

## Validation Checklist
- [ ] setTimeout calls are tracked in timeouts array
- [ ] shutdown method exists and clears all resources  
- [ ] getSnapshot returns calculated metrics (avgLatency > 0)
- [ ] No resource leaks after shutdown
- [ ] Metrics show real data instead of zeros