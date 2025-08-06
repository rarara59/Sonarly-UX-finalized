// Renaissance Event System - Production Ready
export const EVENTS = {
  CANDIDATE_DETECTED: 'candidateDetected',
  TRADE_READY: 'tradeReady',
  ERROR: 'error'
};

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  
  // Production-grade emit with error isolation
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (!callbacks) return;
    
    // Error isolation: bad callback doesn't crash others
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error('Event callback error:', error);
      }
    }
  }
  
  // Register listener
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }
  
  // Unsubscribe to prevent memory leaks
  off(eventType, callback) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}