Interval Storage and Cleanup

// CURRENT setupPeriodicCleanup (BROKEN):
setupPeriodicCleanup() {
  setInterval(() => {
    this.performCleanup();
  }, this.performanceThresholds.mapCleanupInterval);
}

// REQUIRED FIX:
setupPeriodicCleanup() {
  this.cleanupInterval = setInterval(() => {
    this.performCleanup();
  }, this.performanceThresholds.mapCleanupInterval);
}

// CURRENT shutdown (BROKEN):
shutdown() {
  console.log('SignalBus: Shutting down gracefully');
  this.removeAllListeners();
  // ... existing code
}

// REQUIRED FIX:
shutdown() {
  console.log('SignalBus: Shutting down gracefully');
  
  // Clear interval to prevent memory leaks
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
    this.cleanupInterval = null;
  }
  
  this.removeAllListeners();
  // ... existing code
}