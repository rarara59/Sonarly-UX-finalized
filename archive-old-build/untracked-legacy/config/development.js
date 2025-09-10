/**
 * Development Configuration - Renaissance Trading System
 * Development-specific settings with debugging and convenience features
 */

import { BaseConfig } from './base.js';

export const DevelopmentConfig = {
  extends: 'base',
  
  // Development environment marker
  environment: 'development',
  
  // Logging configuration for development
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: 'simple',
    destination: 'console',
    console: true,                 // Enable console output
    structured: false,             // Human-readable format
    sanitized: false,              // Show full error details
    enableColors: true,            // Colorized output
    enableTimestamps: true,
    enablePrettyPrint: true,
    enableAsync: true,             // Async logging for performance
    bufferSize: 100,
    flushInterval: 1000,           // 1 second
    samplingRates: {
      transaction: 1.0,            // 100% in development
      validation: 1.0,             // 100% in development
      parsing: 0.1,                // 10% in development
      scoring: 1.0,                // 100% in development
      general: 1.0                 // Always log general events
    },
    // Verbose logging for all modules
    modules: {
      trading: 'debug',
      rpc: 'debug',
      websocket: 'debug',
      database: 'debug',
      api: 'debug'
    }
  },
  
  // Security configuration for development (relaxed)
  security: {
    // CORS configuration - allow all origins
    cors: {
      origin: '*',
      credentials: true,
      optionsSuccessStatus: 200
    },
    
    // Rate limiting - higher limits for development
    rateLimit: {
      windowMs: 60000,             // 1 minute
      max: 10000,                  // 10k requests per minute
      message: 'Development rate limit exceeded',
      skip: () => true             // Skip rate limiting in dev
    },
    
    // Minimal security headers for development
    helmet: {
      contentSecurityPolicy: false, // Disable CSP for development
      hsts: false                  // Disable HSTS for local development
    },
    
    // Session configuration for development
    session: {
      secret: 'development-secret-key-not-for-production',
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: false,             // Allow HTTP in development
        httpOnly: false,           // Allow JS access for debugging
        maxAge: 86400000,          // 24 hours
        sameSite: 'lax'
      }
    },
    
    // Relaxed validation for development
    validation: {
      strictMode: false,
      validateAllInputs: false,
      sanitizeOutputs: false,
      enableCSRFProtection: false,
      maxRequestSize: '50mb',      // Larger size for testing
      parameterLimit: 10000
    }
  },
  
  // Performance settings for development
  performance: {
    // Disable V8 optimizations for better debugging
    enableV8Optimizations: false,
    disableDebugging: false,
    enableJITCompilation: false,
    optimizeForSize: false,
    
    // Disable caching for fresh data
    compression: false,
    enableCaching: false,
    enableEtags: false,
    
    // Lower limits for local development
    maxConcurrentRequests: 100,
    requestQueueSize: 500,
    workerThreads: 2,
    
    // Database settings for development
    database: {
      enableConnectionPooling: true,
      preparedStatements: false,   // Easier debugging
      queryCache: false,           // Fresh data
      connectionLimit: 10,
      enableQueryLogging: true     // Log all queries
    }
  },
  
  // Error handling for development
  errorHandling: {
    exposeStackTrace: true,        // Show full stack traces
    sanitizeErrors: false,         // Show full error details
    logErrors: true,               // Log all errors
    genericMessages: false,        // Show specific error messages
    errorCodes: true,
    includeErrorDetails: true,
    // Detailed error response format
    errorResponse: {
      success: false,
      error: {
        code: null,
        message: null,
        details: null,
        stack: null,
        timestamp: null
      }
    }
  },
  
  // Monitoring configuration for development
  monitoring: {
    enableMetrics: true,
    enableTracing: true,           // Full tracing for debugging
    sampleRate: 1.0,               // 100% sampling
    enableHealthChecks: true,
    healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT) || 3001,
    
    // Verbose metrics collection
    metrics: {
      system: true,
      http: true,
      database: true,
      trading: true,
      custom: true,
      detailed: true               // Extra detailed metrics
    },
    
    // Lower thresholds for testing alerts
    alerts: {
      cpuThreshold: 50,            // Alert at 50% CPU
      memoryThreshold: 60,         // Alert at 60% memory
      errorRateThreshold: 0.01,    // Alert at 1% error rate
      latencyThreshold: 500        // Alert at 500ms latency
    }
  },
  
  // Trading-specific development settings
  trading: {
    ...BaseConfig.trading,
    enableLiveTrading: false,      // Disable live trading
    enableTestMode: true,          // Enable test mode
    enablePaperTrading: true,      // Force paper trading
    requireConfirmation: false,    // No confirmation needed
    maxPositionSize: 100,          // Lower limits for testing
    maxDailyLoss: 1.0,             // No daily loss limit in dev
    enableCircuitBreaker: false,   // Disable circuit breaker
    mockExternalAPIs: true,        // Mock external services
    simulateLatency: true,         // Simulate network latency
    simulatedLatencyMs: 100        // 100ms simulated latency
  },
  
  // Network configuration for development
  network: {
    ...BaseConfig.network,
    enableSSL: false,              // No SSL in development
    enableHTTP2: false,            // Use HTTP/1.1
    trustProxy: false,             // Don't trust proxy headers
    bindAddress: '0.0.0.0',        // Bind to all interfaces
    port: parseInt(process.env.PORT) || 3000
  },
  
  // Development-specific features
  development: {
    enableHotReload: true,         // Hot module reload
    enableSourceMaps: true,        // Source map support
    enableVerboseErrors: true,     // Verbose error messages
    enableDebugEndpoints: true,    // Debug API endpoints
    enableSwagger: true,           // API documentation
    enableGraphiQL: true,          // GraphQL playground
    enableProfiler: true,          // Performance profiler
    
    // Development tools
    tools: {
      enableREPL: true,            // Interactive REPL
      enableInspector: true,       // Node.js inspector
      inspectorPort: 9229,         // Inspector port
      enableRemoteDebugging: true  // Remote debugging support
    },
    
    // Mock data generation
    mockData: {
      enabled: true,
      generateSampleTrades: true,
      generateHistoricalData: true,
      mockDataCount: 1000
    }
  },
  
  // Deployment configuration for development
  deployment: {
    cluster: {
      enabled: false,              // No clustering in development
      workers: 1
    },
    gracefulShutdown: {
      enabled: false,              // Immediate shutdown
      timeout: 0
    },
    healthCheck: {
      interval: 60000,             // 1 minute
      timeout: 10000,              // 10 seconds
      unhealthyThreshold: 5,
      healthyThreshold: 1
    }
  }
};

export default DevelopmentConfig;