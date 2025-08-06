# FIX: Signal Bus Critical Performance Bugs

## Issue
Events per second calculation uses wrong time window logic causing false alerts, and JSON.stringify fails on Maps causing memory monitoring failures during high-volume trading.

## Files to Change
- `src/detection/core/signal-bus.js` (lines 101-104, 175-181, 221-227)

## Required Changes
1. Replace instantaneous event rate calculation with time-window based tracking
2. Fix Map serialization in memory usage estimation
3. Replace regex validation with fast character-based validation
4. Add rate tracker initialization in constructor

## Commands

```bash
# Add rate tracker to constructor after line 24
sed -i '/lastCleanup: Date\.now()/a\    };\n\n    // Rate tracking for accurate events/sec calculation\n    this.rateTracker = {\n      events: [],\n      windowMs: 1000\n    };' src/detection/core/signal-bus.js

# Replace regex validation with fast character validation
sed -i '/\/\^/,/test(eventType)/c\    if (typeof eventType !== "string" || eventType.length === 0 || eventType.length >= 100) {\n      return false;\n    }\n    \n    // Fast character validation\n    const firstChar = eventType.charCodeAt(0);\n    if (!((firstChar >= 65 && firstChar <= 90) || (firstChar >= 97 && firstChar <= 122))) {\n      return false;\n    }\n    \n    return true;' src/detection/core/signal-bus.js

# Replace events per second calculation with time window approach
sed -i '/const timeSinceLastEvent/,/}/c\    // Track events over time window\n    const now = Date.now();\n    this.rateTracker.events.push(now);\n    \n    // Remove events older than window\n    this.rateTracker.events = this.rateTracker.events.filter(\n      timestamp => now - timestamp < this.rateTracker.windowMs\n    );\n    \n    const eventsPerSecond = this.rateTracker.events.length;\n    if (eventsPerSecond > this.performanceThresholds.maxEvents) {\n      console.warn(`SignalBus sustained rate exceeded: ${eventsPerSecond}/s`);\n    }' src/detection/core/signal-bus.js

# Fix Map serialization in memory estimation
sed -i '/const metricsSize = JSON\.stringify/,/return metricsSize/c\    // Calculate actual Map memory usage\n    let mapSize = 0;\n    mapSize += this.metrics.eventCounts.size * 50;\n    mapSize += this.metrics.listenerCounts.size * 50;\n    \n    const baseSize = 1000;\n    const listenersSize = this.listenerCount() * 100;\n    \n    return baseSize + mapSize + listenersSize;' src/detection/core/signal-bus.js
```

## Test Fix

```bash
# Test event type validation performance
node -e "const {SignalBus} = require('./src/detection/core/signal-bus.js'); const bus = new SignalBus(); console.log('Valid:', bus.validateEventType('testEvent')); console.log('Invalid:', bus.validateEventType('123invalid'));"

# Test memory usage calculation doesn't crash
node -e "const {SignalBus} = require('./src/detection/core/signal-bus.js'); const bus = new SignalBus(); bus.emit('test', {}); console.log('Memory usage:', bus.estimateMemoryUsage());"

# Test rate tracking works correctly
node -e "const {SignalBus} = require('./src/detection/core/signal-bus.js'); const bus = new SignalBus(); bus.emit('test1', {}); bus.emit('test2', {}); console.log('Rate tracker initialized:', !!bus.rateTracker);"
```

**Validation Checklist**
* Event type validation completes without regex performance penalty
* Memory usage estimation returns numeric value without JSON.stringify errors
* Rate tracker properly filters events by time window instead of instantaneous calculation
* Signal bus initializes without errors and maintains performance metrics
* Events per second calculation uses sustained rate over time window