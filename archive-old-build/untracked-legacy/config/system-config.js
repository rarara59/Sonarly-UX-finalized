/**
 * THORP SYSTEM CONFIGURATION
 * 
 * Centralized configuration management with environment validation,
 * Renaissance-grade defaults, and production-ready settings.
 * 
 * Features:
 * - Environment variable validation
 * - Service-specific configuration sections
 * - Production vs development settings
 * - Configuration validation and error handling
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpus } from 'os';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Environment configuration with validation
 */
function validateEnvironment() {
  const required = ['HELIUS_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Warn about optional but recommended variables
  const recommended = ['CHAINSTACK_API_KEY', 'NODE_ENV'];
  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn(`[CONFIG] Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }
}

/**
 * Get environment-specific settings
 */
function getEnvironmentSettings() {
  const env = process.env.NODE_ENV || 'development';
  
  const settings = {
    development: {
      logLevel: 'debug',
      enableMetrics: true,
      healthCheckInterval: 10000, // 10s for dev
      circuitBreakerThreshold: 3, // Lower threshold for dev
      maxMemoryUsageMB: 1024, // 1GB for dev
      enableStatisticalAnalysis: true
    },
    production: {
      logLevel: 'info',
      enableMetrics: true,
      healthCheckInterval: 5000, // 5s for prod
      circuitBreakerThreshold: 10, // Higher threshold for prod
      maxMemoryUsageMB: 4096, // 4GB for prod
      enableStatisticalAnalysis: true
    },
    test: {
      logLevel: 'error',
      enableMetrics: false,
      healthCheckInterval: 30000, // 30s for test
      circuitBreakerThreshold: 2, // Very low for testing
      maxMemoryUsageMB: 512, // 512MB for test
      enableStatisticalAnalysis: false
    }
  };
  
  return settings[env] || settings.development;
}

/**
 * Load package.json for version info
 */
function getVersionInfo() {
  try {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return {
      version: packageJson.version || '1.0.0',
      name: packageJson.name || 'thorp-trading-system'
    };
  } catch (error) {
    console.warn('[CONFIG] Could not load package.json:', error.message);
    return {
      version: '1.0.0',
      name: 'thorp-trading-system'
    };
  }
}

/**
 * RPC Connection Manager Configuration
 */
function getRPCConfig() {
  return {
    heliusApiKey: process.env.HELIUS_API_KEY,
    chainstackApiKey: process.env.CHAINSTACK_API_KEY,
    
    // Connection settings
    maxConnections: parseInt(process.env.RPC_MAX_CONNECTIONS) || 10,
    connectionTimeout: parseInt(process.env.RPC_CONNECTION_TIMEOUT) || 30000,
    requestTimeout: parseInt(process.env.RPC_REQUEST_TIMEOUT) || 15000,
    
    // WebSocket settings
    enableWebSocket: false, // Disabled - using HTTP polling
    websocketReconnectInterval: parseInt(process.env.RPC_WS_RECONNECT_INTERVAL) || 3000,
    websocketMaxReconnects: parseInt(process.env.RPC_WS_MAX_RECONNECTS) || 50,
    
    // Performance settings
    enableMemoryMonitoring: process.env.RPC_MEMORY_MONITORING !== 'false',
    enablePrometheusMetrics: process.env.RPC_PROMETHEUS_METRICS !== 'false',
    
    // Rate limiting
    rateLimit: {
      requests: parseInt(process.env.RPC_RATE_LIMIT_REQUESTS) || 100,
      period: parseInt(process.env.RPC_RATE_LIMIT_PERIOD) || 1000, // 1 second
      burst: parseInt(process.env.RPC_RATE_LIMIT_BURST) || 150
    }
  };
}

/**
 * Circuit Breaker Configuration
 */
function getCircuitBreakerConfig() {
  const envSettings = getEnvironmentSettings();
  
  return {
    // Basic thresholds
    failureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD) || envSettings.circuitBreakerThreshold,
    successThreshold: parseInt(process.env.CB_SUCCESS_THRESHOLD) || 3,
    
    // Timing
    timeout: parseInt(process.env.CB_TIMEOUT) || 30000, // 30s
    resetTimeout: parseInt(process.env.CB_RESET_TIMEOUT) || 30000, // 30s
    monitoringWindow: parseInt(process.env.CB_MONITORING_WINDOW) || 60000, // 1 minute
    
    // Memory management
    maxRecentRequests: parseInt(process.env.CB_MAX_RECENT_REQUESTS) || 1000,
    
    // Bulkhead pattern
    bulkheadConcurrency: parseInt(process.env.CB_BULKHEAD_CONCURRENCY) || 50,
    halfOpenRetryLimit: parseInt(process.env.CB_HALF_OPEN_RETRY_LIMIT) || 1,
    
    // Statistical analysis
    enableStatisticalAnalysis: envSettings.enableStatisticalAnalysis,
    statisticalSignificanceThreshold: parseFloat(process.env.CB_STATISTICAL_THRESHOLD) || 0.05,
    
    // Error classification
    infrastructureErrors: [
      'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET',
      'EPIPE', 'EHOSTUNREACH', 'ENETUNREACH', 'CIRCUIT_BREAKER_TIMEOUT'
    ]
  };
}

/**
 * Worker Pool Configuration
 */
function getWorkerPoolConfig() {
  const cpuCount = parseInt(process.env.WORKER_POOL_SIZE) || cpus().length;
  
  return {
    // Worker settings - ULTRA memory optimized
    maxWorkers: Math.min(parseInt(process.env.WORKER_MAX_WORKERS) || 2, 2), // Hard limit 2 workers
    minWorkers: parseInt(process.env.WORKER_MIN_WORKERS) || 1,
    workerScript: process.env.WORKER_SCRIPT || './src/workers/math-worker.js',
    
    // Task management - ULTRA memory optimized
    taskTimeout: parseInt(process.env.WORKER_TASK_TIMEOUT) || 3000, // 3s
    maxQueueSize: parseInt(process.env.WORKER_MAX_QUEUE_SIZE) || 1000, // Hard limit 1000
    
    // Health monitoring
    healthCheckInterval: parseInt(process.env.WORKER_HEALTH_CHECK_INTERVAL) || 10000, // 10s
    workerRestartThreshold: parseInt(process.env.WORKER_RESTART_THRESHOLD) || 5,
    
    // Performance
    enableWorkerMetrics: process.env.WORKER_ENABLE_METRICS !== 'false',
    taskPriorityLevels: parseInt(process.env.WORKER_PRIORITY_LEVELS) || 3
  };
}

/**
 * Batch Processor Configuration
 */
function getBatchProcessorConfig() {
  return {
    // Batch settings - ULTRA memory optimized
    maxBatchSize: parseInt(process.env.BATCH_MAX_SIZE) || 20, // Hard limit 20
    batchTimeout: parseInt(process.env.BATCH_TIMEOUT) || 100, // 100ms
    maxConcurrentBatches: parseInt(process.env.BATCH_MAX_CONCURRENT) || 2, // Hard limit 2
    
    // Priority queues - ULTRA memory optimized
    priorityLevels: parseInt(process.env.BATCH_PRIORITY_LEVELS) || 2, // Hard limit 2
    highPriorityThreshold: parseInt(process.env.BATCH_HIGH_PRIORITY_THRESHOLD) || 1000, // SOL value
    
    // Rate limiting
    rateLimit: {
      requests: parseInt(process.env.BATCH_RATE_LIMIT_REQUESTS) || 1000,
      period: parseInt(process.env.BATCH_RATE_LIMIT_PERIOD) || 1000, // 1 second
      burstLimit: parseInt(process.env.BATCH_RATE_LIMIT_BURST) || 1500
    },
    
    // Performance monitoring
    enableMetrics: process.env.BATCH_ENABLE_METRICS !== 'false',
    metricsCollectionInterval: parseInt(process.env.BATCH_METRICS_INTERVAL) || 30000 // 30s
  };
}

/**
 * Solana Pool Parser Configuration
 */
function getSolanaPoolParserConfig() {
  return {
    // Processing limits
    processingRateLimit: parseInt(process.env.SOLANA_PROCESSING_RATE_LIMIT) || 100, // tokens per minute
    maxPoolsCache: parseInt(process.env.SOLANA_MAX_POOLS_CACHE) || 500, // ULTRA reduced to 500
    cacheCleanupInterval: parseInt(process.env.SOLANA_CACHE_CLEANUP_INTERVAL) || 300000, // 5 minutes
    
    // Pool filtering
    minLPValueUSD: parseFloat(process.env.SOLANA_MIN_LP_VALUE_USD) || 1000, // $1k minimum
    maxLPValueUSD: parseFloat(process.env.SOLANA_MAX_LP_VALUE_USD) || 10000000, // $10M maximum
    
    // Supported DEXs
    supportedDEXs: (process.env.SOLANA_SUPPORTED_DEXS || 'Raydium,Orca,Jupiter').split(','),
    
    // Performance settings
    enableBatchProcessing: process.env.SOLANA_ENABLE_BATCH_PROCESSING !== 'false',
    batchSize: parseInt(process.env.SOLANA_BATCH_SIZE) || 50,
    
    // Error handling
    maxRetries: parseInt(process.env.SOLANA_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.SOLANA_RETRY_DELAY) || 1000 // 1s
  };
}

/**
 * LP Scanner Configuration
 */
function getLPScannerConfig() {
  return {
    // Enable automatic LP detection (true by default unless explicitly set to 'false')
    enabled: process.env.LP_SCANNER_ENABLED !== 'false',
    
    // Data source for LP detection
    source: process.env.LP_SCANNER_SOURCE || 'HELIUS',
    
    // Scanning interval in milliseconds
    intervalMs: parseInt(process.env.LP_SCANNER_INTERVAL) || 2000, // 2 seconds - faster scanning
    
    // Lookback window for baseline calibration
    lookbackSlots: parseInt(process.env.LP_SCANNER_LOOKBACK_SLOTS) || 200, // increased window for better coverage
    
    // Performance settings
    maxTransactionsPerScan: parseInt(process.env.LP_SCANNER_MAX_TRANSACTIONS) || 50, // increased to 50 transactions
    scanTimeout: parseInt(process.env.LP_SCANNER_TIMEOUT) || 8000, // 8s timeout for more transactions
    
    // Filter settings
    enablePumpFunDetection: process.env.LP_SCANNER_ENABLE_PUMP_FUN !== 'false',
    enableRaydiumDetection: process.env.LP_SCANNER_ENABLE_RAYDIUM !== 'false',
    enableOrcaDetection: process.env.LP_SCANNER_ENABLE_ORCA !== 'false'
  };
}

/**
 * System-wide Configuration
 */
function getSystemConfig() {
  const envSettings = getEnvironmentSettings();
  const versionInfo = getVersionInfo();
  
  return {
    // System info
    name: versionInfo.name,
    version: versionInfo.version,
    environment: process.env.NODE_ENV || 'development',
    
    // Timing
    maxStartupTimeMs: parseInt(process.env.SYSTEM_MAX_STARTUP_TIME) || 30000, // 30s
    shutdownTimeoutMs: parseInt(process.env.SYSTEM_SHUTDOWN_TIMEOUT) || 15000, // 15s
    healthCheckIntervalMs: envSettings.healthCheckInterval,
    
    // Memory management - EXTREME optimization
    maxMemoryUsageMB: parseInt(process.env.SYSTEM_MAX_MEMORY_MB) || 400, // Hard limit 400MB
    enableGarbageCollection: process.env.SYSTEM_ENABLE_GC !== 'false',
    gcInterval: parseInt(process.env.SYSTEM_GC_INTERVAL) || 30000, // 30 seconds
    
    // Monitoring
    enableMetrics: envSettings.enableMetrics,
    logLevel: envSettings.logLevel,
    enableHealthEndpoint: process.env.SYSTEM_ENABLE_HEALTH_ENDPOINT !== 'false',
    healthEndpointPort: parseInt(process.env.SYSTEM_HEALTH_PORT) || 3001,
    
    // Trading settings
    enableTradingSignals: process.env.SYSTEM_ENABLE_TRADING_SIGNALS !== 'false',
    tradingSignalThreshold: parseFloat(process.env.SYSTEM_TRADING_SIGNAL_THRESHOLD) || 0.8,
    
    // Emergency settings
    emergencyShutdownThreshold: parseFloat(process.env.SYSTEM_EMERGENCY_SHUTDOWN_THRESHOLD) || 0.1, // 10% health
    enableEmergencyMode: process.env.SYSTEM_ENABLE_EMERGENCY_MODE !== 'false',
    
    // Redis Feature Store Configuration
    featureStore: {
      enabled: false,
      environment: process.env.NODE_ENV || 'development',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0
      }
    }
  };
}

/**
 * Validate configuration
 */
function validateConfiguration(config) {
  const errors = [];
  
  // Validate RPC configuration
  if (!config.rpc.heliusApiKey) {
    errors.push('HELIUS_API_KEY is required');
  }
  
  // Validate numeric ranges
  if (config.system.maxMemoryUsageMB < 256) {
    errors.push('System memory limit too low (minimum 256MB)');
  }
  
  if (config.workerPool.maxWorkers < 1) {
    errors.push('Worker pool must have at least 1 worker');
  }
  
  if (config.batchProcessor.maxBatchSize < 1) {
    errors.push('Batch processor must have batch size >= 1');
  }
  
  // Validate timeout relationships
  if (config.system.shutdownTimeoutMs >= config.system.maxStartupTimeMs) {
    errors.push('Shutdown timeout should be less than startup timeout');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Create complete system configuration
 */
export function createSystemConfiguration() {
  try {
    // Validate environment first
    validateEnvironment();
    
    // Build configuration
    const config = {
      system: getSystemConfig(),
      rpc: getRPCConfig(),
      circuitBreaker: getCircuitBreakerConfig(),
      workerPool: getWorkerPoolConfig(),
      batchProcessor: getBatchProcessorConfig(),
      solanaParser: getSolanaPoolParserConfig(),
      lpScanner: getLPScannerConfig()
    };
    
    // Validate configuration
    validateConfiguration(config);
    
    console.log(`[CONFIG] System configuration loaded successfully (env: ${config.system.environment})`);
    
    return config;
    
  } catch (error) {
    console.error('[CONFIG] Configuration loading failed:', error.message);
    throw error;
  }
}

/**
 * Export individual configuration sections for convenience
 */
export const getConfig = {
  system: getSystemConfig,
  rpc: getRPCConfig,
  circuitBreaker: getCircuitBreakerConfig,
  workerPool: getWorkerPoolConfig,
  batchProcessor: getBatchProcessorConfig,
  solanaParser: getSolanaPoolParserConfig,
  lpScanner: getLPScannerConfig
};

export default createSystemConfiguration;