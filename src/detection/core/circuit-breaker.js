// src/core/circuit-breaker.js
export class CircuitBreaker {
  constructor() {
    this.maxServices = 1000;
    this.failures = new Map(); // service -> count
    this.lastFailure = new Map(); // service -> timestamp
    this.maxFailures = 5;
    this.cooldownMs = 5000; // 5 seconds for faster meme coin trading
  }
  
  isOpen(service) {
    const failures = this.failures.get(service) || 0;
    const lastFail = this.lastFailure.get(service) || 0;
    
    return failures >= this.maxFailures && 
           (Date.now() - lastFail) < this.cooldownMs;
  }
  
  canExecute(service) {
    return !this.isOpen(service);
  }
  
  async call(service, operation) {
    if (this.isOpen(service)) {
      return this.getFallback(service);
    }
    
    try {
      const result = await operation();
      this.recordSuccess(service);
      return result;
    } catch (error) {
      this.recordFailure(service);
      throw error;
    }
  }
  
  recordFailure(service) {
    if (this.failures.size >= this.maxServices) {
      const oldestService = this.failures.keys().next().value;
      this.failures.delete(oldestService);
      this.lastFailure.delete(oldestService);
    }
    const current = this.failures.get(service) || 0;
    this.failures.set(service, current + 1);
    this.lastFailure.set(service, Date.now());
  }
  
  recordSuccess(service) {
    this.failures.delete(service);
    this.lastFailure.delete(service);
  }
  
  getFallback(service) {
    const fallbacks = {
      rpc: { error: 'RPC_DOWN', useBackup: true },
      tokenValidation: { isValid: true, confidence: 0.1 }
    };
    return fallbacks[service] || { error: 'SERVICE_DOWN' };
  }
  
  // Execute method for TransactionFetcher compatibility
  async execute(service, operation) {
    // If only one argument, treat it as the operation
    if (typeof service === 'function' && !operation) {
      operation = service;
      service = 'default';
    }
    
    // Use existing call method logic
    return this.call(service, operation);
  }
  
  getState() {
    // Return overall state based on all services
    for (const [service, failures] of this.failures) {
      if (this.isOpen(service)) {
        return 'OPEN';
      }
    }
    return 'CLOSED';
  }
  
  isHealthy() {
    // System is healthy if no circuits are open
    return this.getState() === 'CLOSED';
  }
}