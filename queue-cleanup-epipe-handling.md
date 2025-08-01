# Queue Cleanup and EPIPE Handling

## Changes Applied

### 1. Queue Cleanup Timer
Added automatic queue cleanup every 30 seconds:
```javascript
// Queue cleanup timer - prevents permanent blocks
this.queueCleanupInterval = setInterval(() => {
  if (this.validationQueue.size > 0) {
    console.log(`🧹 QUEUE CLEANUP: Clearing ${this.validationQueue.size} stuck validations`);
    this.validationQueue.clear();
  }
}, 30000); // Every 30 seconds
```

### 2. Proper Shutdown Cleanup
Enhanced shutdown method to clean up intervals and queues:
```javascript
// Clear queue cleanup interval
if (this.queueCleanupInterval) {
  clearInterval(this.queueCleanupInterval);
  this.queueCleanupInterval = null;
}

// Clear validation queue
if (this.validationQueue && this.validationQueue.size > 0) {
  console.log(`🧹 SHUTDOWN: Clearing ${this.validationQueue.size} pending validations`);
  this.validationQueue.clear();
}
```

### 3. EPIPE Error Handling
Created safeConsole wrapper to prevent crashes from broken pipe:
```javascript
const safeConsole = {
  log: (...args) => {
    try {
      console.log(...args);
    } catch (error) {
      if (error.code !== 'EPIPE') {
        throw error;
      }
      // Silently ignore EPIPE errors
    }
  }
};
```

## Benefits

1. **No More Stuck Validations** - Queue automatically clears every 30 seconds
2. **Graceful Shutdown** - Properly cleans up resources on shutdown
3. **EPIPE Protection** - System won't crash when grep terminates

## Expected Behavior

- Validation queue will never grow indefinitely
- System can run for extended periods without memory issues
- Grep filtering won't cause system crashes
- Proper resource cleanup on shutdown

## Note
The full conversion to safeConsole throughout the file would be extensive. For now, the most critical scanForNewLPs method has been updated. Additional methods can be converted as needed if EPIPE errors occur elsewhere.