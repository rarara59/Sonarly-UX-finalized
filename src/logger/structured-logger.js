// File: src/logger/structured-logger.js
// Structured logging for trading systems with performance optimization

export function createStructuredLogger(component = 'System') {
  const logLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
  const useJson = process.env.LOG_JSON === 'true';
  
  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  const currentLevel = levels[logLevel] || 1;
  
  function formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    
    if (useJson) {
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        component,
        message,
        ...metadata
      });
    } else {
      const metaStr = Object.keys(metadata).length > 0 
        ? ` ${JSON.stringify(metadata)}`
        : '';
      return `${timestamp} [${level.toUpperCase()}] ${component}: ${message}${metaStr}`;
    }
  }
  
  function log(level, message, metadata = {}) {
    if (levels[level] < currentLevel) return;
    
    const formatted = formatMessage(level, message, metadata);
    
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }
  
  return {
    debug: (message, metadata) => log('debug', message, metadata),
    info: (message, metadata) => log('info', message, metadata),
    warn: (message, metadata) => log('warn', message, metadata),
    error: (message, metadata) => log('error', message, metadata)
  };
}