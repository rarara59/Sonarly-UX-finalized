/**
 * Base Configuration - Renaissance Trading System
 * Core system settings that apply to all environments
 */

export const BaseConfig = {
  // Core system settings
  system: {
    name: 'Renaissance Trading System',
    version: '2.0.0',
    timezone: 'UTC',
    locale: 'en-US',
    instanceId: process.env.INSTANCE_ID || 'default'
  },
  
  // Trading system defaults
  trading: {
    maxConcurrentTrades: 10,
    defaultSlippage: 0.005,        // 0.5%
    emergencyStopThreshold: 0.1,   // 10% portfolio loss
    heartbeatInterval: 1000,       // 1 second
    orderTimeoutMs: 5000,          // 5 seconds
    minOrderSize: 0.001,           // Minimum trade size
    maxOrderSize: 1000,            // Maximum trade size
    enablePaperTrading: process.env.ENABLE_PAPER_TRADING === 'true'
  },
  
  // Network and connectivity
  network: {
    requestTimeout: 5000,          // 5 seconds
    retryAttempts: 3,
    retryDelay: 1000,              // 1 second
    keepAliveTimeout: 30000,       // 30 seconds
    maxConcurrentRequests: 100,
    connectionPoolSize: parseInt(process.env.CONNECTION_POOL_SIZE) || 20
  },
  
  // RPC configuration
  rpc: {
    maxRetries: 3,
    retryDelay: 1000,
    requestTimeout: 10000,         // 10 seconds for RPC calls
    healthCheckInterval: 30000,    // 30 seconds
    circuitBreakerThreshold: 5,    // 5 failures before circuit opens
    circuitBreakerResetTime: 60000 // 1 minute
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableAsync: process.env.ENABLE_ASYNC_LOGGING !== 'false',
    bufferSize: 100,
    flushInterval: 1000,
    samplingRates: {
      transaction: 1.0,  // Default sampling rates (overridden per environment)
      validation: 1.0,
      parsing: 0.1,
      scoring: 1.0
    }
  },
  
  // WebSocket configuration
  websocket: {
    reconnectInterval: 5000,       // 5 seconds
    maxReconnectAttempts: 10,
    pingInterval: 30000,           // 30 seconds
    pongTimeout: 10000,            // 10 seconds
    messageQueueSize: 1000
  },
  
  // Database configuration
  database: {
    connectionTimeout: 5000,       // 5 seconds
    queryTimeout: 30000,           // 30 seconds
    poolMin: 2,
    poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30000,      // 30 seconds
    connectionRetryAttempts: 3
  },
  
  // Cache configuration
  cache: {
    defaultTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    maxKeys: 10000,
    checkPeriod: 600,              // 10 minutes
    enableCompression: true,
    enableCloneOnGet: false,       // Performance optimization
    enableCloneOnSet: false
  },
  
  // Monitoring and metrics
  monitoring: {
    metricsInterval: 60000,        // 1 minute
    healthCheckPath: '/health',
    readinessCheckPath: '/ready',
    livenessCheckPath: '/alive',
    metricsPath: '/metrics',
    enablePrometheus: true,
    enableCustomMetrics: true
  },
  
  // Worker configuration
  workers: {
    processes: parseInt(process.env.WORKER_PROCESSES) || 4,
    taskTimeout: 30000,            // 30 seconds per task
    maxTaskRetries: 3,
    gracefulShutdownTimeout: 10000 // 10 seconds
  },
  
  // Memory management (shared across environments)
  memory: {
    maxHeapUsageMB: 3500,
    gcInterval: 30000,             // 30 seconds
    enableMemoryMonitoring: true,
    memoryCheckInterval: 15000     // 15 seconds
  },
  
  // Feature flags (can be overridden by environment)
  features: {
    enableAdvancedAnalytics: true,
    enableMachineLearning: false,
    enableAutoTrading: true,
    enableBacktesting: true,
    enableRiskManagement: true,
    enablePortfolioOptimization: false
  }
};

export default BaseConfig;