/**
 * Production Configuration - Renaissance Trading System
 * Production-specific settings with security hardening and performance optimization
 */

import { BaseConfig } from './base.js';

export const ProductionConfig = {
  extends: 'base',
  
  // Production environment marker
  environment: 'production',
  
  // Logging configuration for production
  logging: {
    level: process.env.LOG_LEVEL || 'warn',
    format: 'json',
    destination: process.env.LOG_PATH || '/var/log/trading/app.log',
    console: false,                // No console output in production
    structured: true,              // JSON format for log aggregation
    sanitized: true,               // Remove sensitive data from logs
    enableAsync: true,             // Always async in production
    bufferSize: 500,              // Larger buffer for production
    flushInterval: 5000,          // 5 seconds
    samplingRates: {
      transaction: 0.01,          // 1% sampling in production
      validation: 0.05,           // 5% sampling in production
      parsing: 0.001,             // 0.1% sampling in production
      scoring: 0.02,              // 2% sampling in production
      general: 1.0                // Always log general events
    },
    rotation: {
      maxSize: '100MB',
      maxFiles: 10,
      compress: true,
      datePattern: 'YYYY-MM-DD'
    },
    // Specific log levels by module
    modules: {
      trading: 'warn',
      rpc: 'error',
      websocket: 'warn',
      database: 'error',
      api: 'warn'
    }
  },
  
  // Security configuration for production
  security: {
    // CORS configuration
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || [],
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400                // 24 hours
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 60000,             // 1 minute
      max: parseInt(process.env.API_RATE_LIMIT) || 1000,
      message: 'Rate limit exceeded',
      standardHeaders: true,
      legacyHeaders: false,
      // Different limits for different endpoints
      endpoints: {
        '/api/trade': 100,         // 100 trades per minute
        '/api/data': 1000,         // 1000 data requests per minute
        '/api/auth': 10            // 10 auth attempts per minute
      }
    },
    
    // Helmet security headers
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,          // 1 year
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'same-origin' }
    },
    
    // Authentication and session
    session: {
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,              // HTTPS only
        httpOnly: true,
        maxAge: 3600000,           // 1 hour
        sameSite: 'strict'
      }
    },
    
    // Input validation
    validation: {
      strictMode: true,
      validateAllInputs: true,
      sanitizeOutputs: true,
      enableCSRFProtection: true,
      maxRequestSize: '10mb',
      parameterLimit: 1000
    }
  },
  
  // Performance optimization for production
  performance: {
    // V8 optimizations
    enableV8Optimizations: true,
    disableDebugging: true,
    enableJITCompilation: true,
    optimizeForSize: true,
    
    // Caching
    compression: true,
    enableCaching: true,
    cacheMaxAge: parseInt(process.env.CACHE_TTL) || 300,
    enableEtags: true,
    
    // Resource limits
    maxConcurrentRequests: 1000,
    requestQueueSize: 5000,
    workerThreads: parseInt(process.env.WORKER_THREADS) || 4,
    
    // Database optimizations
    database: {
      enableConnectionPooling: true,
      preparedStatements: true,
      queryCache: true,
      connectionLimit: 100
    }
  },
  
  // Error handling for production
  errorHandling: {
    exposeStackTrace: false,       // Never expose stack traces
    sanitizeErrors: true,          // Clean error messages
    logErrors: true,               // Log all errors
    genericMessages: true,         // Use generic error messages
    errorCodes: true,              // Use error codes instead of messages
    // Error response format
    errorResponse: {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred processing your request'
      }
    }
  },
  
  // Monitoring configuration for production
  monitoring: {
    enableMetrics: true,
    enableTracing: false,          // Disable tracing to reduce overhead
    sampleRate: 0.01,              // 1% sampling for performance
    enableHealthChecks: true,
    healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT) || 3001,
    
    // Metrics to collect
    metrics: {
      system: true,                // CPU, memory, etc.
      http: true,                  // HTTP request metrics
      database: true,              // Database query metrics
      trading: true,               // Trading-specific metrics
      custom: true                 // Custom business metrics
    },
    
    // Alerting thresholds
    alerts: {
      cpuThreshold: 80,            // Alert at 80% CPU
      memoryThreshold: 85,         // Alert at 85% memory
      errorRateThreshold: 0.05,    // Alert at 5% error rate
      latencyThreshold: 1000       // Alert at 1s latency
    }
  },
  
  // Trading-specific production settings
  trading: {
    ...BaseConfig.trading,
    enableLiveTrading: true,
    enableTestMode: false,
    requireConfirmation: true,     // Require confirmation for large trades
    maxPositionSize: parseInt(process.env.MAX_POSITION_SIZE) || 1000,
    maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS) || 0.05, // 5%
    enableCircuitBreaker: true,
    circuitBreakerThreshold: 0.10  // 10% loss triggers circuit breaker
  },
  
  // Network configuration for production
  network: {
    ...BaseConfig.network,
    enableSSL: true,
    sslCert: process.env.SSL_CERT_PATH,
    sslKey: process.env.SSL_KEY_PATH,
    enableHTTP2: true,
    trustProxy: true               // Trust proxy headers
  },
  
  // Deployment configuration
  deployment: {
    cluster: {
      enabled: true,
      workers: parseInt(process.env.CLUSTER_WORKERS) || 'auto',
      restartDelay: 1000,
      maxRestarts: 10
    },
    gracefulShutdown: {
      enabled: true,
      timeout: 30000               // 30 seconds
    },
    healthCheck: {
      interval: 30000,             // 30 seconds
      timeout: 5000,               // 5 seconds
      unhealthyThreshold: 3,
      healthyThreshold: 2
    }
  }
};

export default ProductionConfig;