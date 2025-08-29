// adapters/logger.js
// RENAISSANCE ADAPTER: Switches between fake/real logger implementations
// PURPOSE: Enable contract-first testing with zero leakage between LLMs

import { LoggerFake } from '../fakes/logger.fake.js';
import { Logger } from '../impl/logger.real.js';

class LoggerAdapter {
  constructor() {
    this.implementation = null;
  }
  
  static async create(dependencies) {
    const adapter = new LoggerAdapter();
    
    if (process.env.USE_FAKES === 'true') {
      // Use your existing fake for testing
      const scenario = process.env.LOGGER_SCENARIO || 'normal';
      adapter.implementation = new LoggerFake(dependencies, scenario);
    } else {
      // Use real implementation for production
      adapter.implementation = new Logger(dependencies);
    }
    
    return adapter;
  }
  
  // Proxy all contract methods to implementation
  async emit(entry) {
    return this.implementation.emit(entry);
  }
  
  async withContext(baseContext) {
    return this.implementation.withContext(baseContext);
  }
  
  // Test helper method (only available in fakes)
  getCapturedLogs() {
    if (this.implementation.getCapturedLogs) {
      return this.implementation.getCapturedLogs();
    }
    return [];
  }
  
  // Convenience methods (if your real implementation has them)
  generateRequestId() {
    if (this.implementation.generateRequestId) {
      return this.implementation.generateRequestId();
    }
    // Fallback for fakes that might not have this method
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ES modules export only (package.json has "type": "module")
export { LoggerAdapter };