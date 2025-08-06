// src/monitoring/simple-monitor.js
export class SimpleMonitor {
  constructor() {
    this.slowCalls = [];
    this.maxSlowCalls = 50; // Bounded storage
  }
  
  recordCall(component, latency) {
    if (latency > 30) {
      console.error(`🚨 SLOW ${component}: ${latency}ms`);
      
      // Add to bounded array
      this.slowCalls.push({ component, latency, time: Date.now() });
      
      // Maintain size limit (LRU eviction)
      if (this.slowCalls.length > this.maxSlowCalls) {
        this.slowCalls.shift(); // Remove oldest
      }
    }
    
    if (latency > 100) {
      console.error(`🔥 CRITICAL ${component}: ${latency}ms - TRADING SPEED VIOLATED`);
    }
  }
  
  getSlowCalls() {
    return this.slowCalls.slice(-10); // Last 10 slow calls
  }
  
  isHealthy() {
    const recent = this.slowCalls.filter(call => Date.now() - call.time < 60000);
    return recent.length < 5; // Less than 5 slow calls per minute
  }
}