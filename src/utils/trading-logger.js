/**
 * Renaissance-grade high-performance logger optimized for trading systems
 * Features: async logging, structured format, performance metrics, sampling
 */
class TradingLogger {
  constructor(options = {}) {
    this.level = process.env.LOG_LEVEL || options.level || 'info';
    this.environment = process.env.NODE_ENV || 'development';
    this.service = options.service || 'thorp-trading';
    this.version = options.version || '1.0.0';
    
    // Performance optimizations
    this.isProduction = this.environment === 'production';
    this.enableAsync = options.enableAsync !== false;
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 1000; // 1 second
    
    // Sampling for high-frequency events
    this.samplingRates = {
      transaction: this.isProduction ? 0.01 : 1.0,    // 1% in prod, 100% in dev
      validation: this.isProduction ? 0.05 : 1.0,     // 5% in prod, 100% in dev
      parsing: this.isProduction ? 0.001 : 0.1,       // 0.1% in prod, 10% in dev
      scoring: this.isProduction ? 0.02 : 1.0,        // 2% in prod, 100% in dev
      general: 1.0                                     // Always log general events
    };
    
    // Log levels (RFC 5424)
    this.levels = {
      error: 0,
      warn: 1, 
      info: 2,
      debug: 3,
      trace: 4
    };
    
    this.currentLevel = this.levels[this.level] || this.levels.info;
    
    // Async buffer for high-performance logging
    this.logBuffer = [];
    this.metricsBuffer = [];
    
    // Performance counters
    this.stats = {
      logsGenerated: 0,
      logsWritten: 0,
      logsSampled: 0,
      bytesWritten: 0,
      avgLogTime: 0
    };
    
    // Initialize async flushing
    if (this.enableAsync) {
      this.initializeAsyncFlushing();
    }
    
    console.log(`📊 Trading Logger initialized: level=${this.level}, env=${this.environment}, async=${this.enableAsync}`);
  }
  
  /**
   * Initialize async log flushing for high-performance operation
   */
  initializeAsyncFlushing() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
    
    // Graceful shutdown handling
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }
  
  /**
   * High-performance error logging (always logged)
   */
  error(message, meta = {}) {
    this.log('error', message, meta, 1.0); // Always log errors
  }
  
  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta, 1.0); // Always log warnings
  }
  
  /**
   * Info level logging  
   */
  info(message, meta = {}) {
    this.log('info', message, meta, this.samplingRates.general);
  }
  
  /**
   * Debug level logging (heavily sampled in production)
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta, this.samplingRates.general);
  }
  
  /**
   * Transaction-specific logging (sampled for performance)
   */
  transaction(message, meta = {}) {
    this.log('info', message, { ...meta, category: 'transaction' }, this.samplingRates.transaction);
  }
  
  /**
   * Validation-specific logging (sampled for performance)
   */
  validation(message, meta = {}) {
    this.log('debug', message, { ...meta, category: 'validation' }, this.samplingRates.validation);
  }
  
  /**
   * Parsing-specific logging (heavily sampled)
   */
  parsing(message, meta = {}) {
    this.log('debug', message, { ...meta, category: 'parsing' }, this.samplingRates.parsing);
  }
  
  /**
   * Scoring-specific logging (sampled for performance)
   */
  scoring(message, meta = {}) {
    this.log('debug', message, { ...meta, category: 'scoring' }, this.samplingRates.scoring);
  }
  
  /**
   * Performance metrics logging (always captured)
   */
  metric(name, value, tags = {}) {
    const metric = {
      timestamp: Date.now(),
      metric: name,
      value: value,
      tags: {
        service: this.service,
        version: this.version,
        environment: this.environment,
        ...tags
      }
    };
    
    if (this.enableAsync) {
      this.metricsBuffer.push(metric);
    } else {
      this.writeMetric(metric);
    }
  }
  
  /**
   * Core logging function with sampling and performance optimization
   */
  log(level, message, meta = {}, samplingRate = 1.0) {
    // Level check (fast return)
    if (this.levels[level] > this.currentLevel) {
      return;
    }
    
    // Sampling check (fast return for high-frequency logs)
    if (samplingRate < 1.0 && Math.random() > samplingRate) {
      this.stats.logsSampled++;
      return;
    }
    
    const startTime = performance.now();
    
    // Structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      service: this.service,
      version: this.version,
      environment: this.environment,
      message: message,
      meta: meta,
      pid: process.pid
    };
    
    // Performance tracking
    this.stats.logsGenerated++;
    
    if (this.enableAsync && level !== 'error') {
      // Async logging for non-errors
      this.logBuffer.push(logEntry);
      
      // Emergency flush if buffer is full
      if (this.logBuffer.length >= this.bufferSize) {
        this.flushLogs();
      }
    } else {
      // Synchronous logging for errors and when async is disabled
      this.writeLog(logEntry);
    }
    
    // Update performance stats
    const logTime = performance.now() - startTime;
    this.stats.avgLogTime = (this.stats.avgLogTime + logTime) / 2;
  }
  
  /**
   * Write log entry to output (optimized for performance)
   */
  writeLog(logEntry) {
    try {
      const logString = JSON.stringify(logEntry);
      console.log(logString);
      
      this.stats.logsWritten++;
      this.stats.bytesWritten += logString.length;
    } catch (error) {
      // Fallback to simple logging if JSON serialization fails
      console.log(`${logEntry.timestamp} [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
    }
  }
  
  /**
   * Write metric to output
   */
  writeMetric(metric) {
    // In production, this would send to Prometheus, StatsD, etc.
    // For now, we'll use a simple console output with a prefix
    console.log(`METRIC: ${metric.metric}=${metric.value} ${JSON.stringify(metric.tags)}`);
  }
  
  /**
   * Flush buffered logs asynchronously
   */
  flushLogs() {
    if (this.logBuffer.length === 0 && this.metricsBuffer.length === 0) {
      return;
    }
    
    // Flush logs
    const logsToFlush = this.logBuffer.splice(0);
    logsToFlush.forEach(logEntry => this.writeLog(logEntry));
    
    // Flush metrics
    const metricsToFlush = this.metricsBuffer.splice(0);
    metricsToFlush.forEach(metric => this.writeMetric(metric));
  }
  
  /**
   * Get logger performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      bufferSize: this.logBuffer.length,
      metricsBufferSize: this.metricsBuffer.length,
      samplingRates: this.samplingRates,
      level: this.level,
      environment: this.environment
    };
  }
  
  /**
   * Graceful shutdown with log flushing
   */
  shutdown() {
    console.log('📊 Trading Logger shutting down...');
    this.flushLogs();
    
    const stats = this.getStats();
    console.log(`📊 Logger Stats: generated=${stats.logsGenerated}, written=${stats.logsWritten}, sampled=${stats.logsSampled}, avgTime=${stats.avgLogTime.toFixed(2)}ms`);
  }
}

// Create singleton instance
const logger = new TradingLogger({
  service: 'thorp-trading',
  version: '1.0.0',
  enableAsync: true
});

export default logger;