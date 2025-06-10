// src/utils/logger.ts
interface Logger {
  setVerbosity?: (level: string) => void;
}

import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create scraper-specific logs directory
const scraperLogsDir = path.join(logsDir, 'scraper');
if (!fs.existsSync(scraperLogsDir)) {
  fs.mkdirSync(scraperLogsDir);
}

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack, context }) => {
    return `${timestamp} [${level.toUpperCase()}]${context ? ` [${context}]` : ''}: ${message} ${stack ? '\n' + stack : ''}`;
  })
);

// Create console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, context }) => {
    return `${timestamp} [${level}]${context ? ` [${context}]` : ''}: ${message}`;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'thorpv1' },
  transports: [
    // Write to all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Console output for development
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
    }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Create a dedicated scraper logger with debug level
export const createScraperLogger = (scraperName: string) => {
  const scraperLogFile = path.join(scraperLogsDir, `${scraperName}.log`);
  
  const scraperLogger = logger.child({ context: scraperName });
  
  // Add a file transport specific to this scraper
  scraperLogger.add(
    new winston.transports.File({
      filename: scraperLogFile,
      level: 'debug', // Capture all levels for scraper
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );
  
  // Function to change log level
  (scraperLogger as any).setVerbosity = (level: string) => {
    // Update level for all transports
    scraperLogger.transports.forEach(t => {
      t.level = level;
    });
    
    return scraperLogger;
  };
  
  return scraperLogger;
};

// Create a stream object for Morgan integration (if using Express)
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;