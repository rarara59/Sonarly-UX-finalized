// src/config/app-config.ts
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp-project',
    options: {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 5,
      minPoolSize: process.env.NODE_ENV === 'production' ? 5 : 1,
      serverSelectionTimeoutMS: 30000,  // 30 seconds to connect to server
      socketTimeoutMS: 45000,           // 45 seconds for individual operations
      connectTimeoutMS: 30000,          // 30 seconds to establish connection
      maxTimeMS: 40000,                 // 40 seconds maximum for any single query
    },
  },

  // Smart wallet configuration
  smartWallet: {
    defaultMinSuccessRate: parseFloat(process.env.DEFAULT_MIN_SUCCESS_RATE || '74'),
    defaultMaxSuccessRate: parseFloat(process.env.DEFAULT_MAX_SUCCESS_RATE || '76'),
    defaultMinEarlyAdoptionScore: parseFloat(process.env.DEFAULT_MIN_EARLY_ADOPTION_SCORE || '8.0'),
    defaultRecentActivityHours: parseInt(process.env.DEFAULT_RECENT_ACTIVITY_HOURS || '48', 10),
    // Add these missing properties:
    defaultMinWinRate: parseFloat(process.env.DEFAULT_MIN_WIN_RATE || '74'),
    defaultMinSuccessfulTrades: parseInt(process.env.DEFAULT_MIN_SUCCESSFUL_TRADES || '10', 10),
    defaultHighPerformersLimit: parseInt(process.env.DEFAULT_HIGH_PERFORMERS_LIMIT || '20', 10),
    defaultAchieves4xScore: parseFloat(process.env.DEFAULT_ACHIEVES_4X_SCORE || '40'),
    default4xLimit: parseInt(process.env.DEFAULT_4X_LIMIT || '5', 10),
  },

  // Pagination configuration
  pagination: {
    defaultPerPage: parseInt(process.env.DEFAULT_PER_PAGE || '25', 10),
    maxPerPage: parseInt(process.env.MAX_PER_PAGE || '100', 10),
  },

  // Solana API configuration
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com',
    heliusApiKey: process.env.HELIUS_API_KEY || '',
    chainstackApiKey: process.env.CHAINSTACK_API_KEY || '',
  },

  // Token market data configuration
  tokenMarketData: {
    birdeyeApiKey: process.env.BIRDEYE_API_KEY || '',
    refreshIntervalMinutes: parseInt(process.env.TOKEN_REFRESH_INTERVAL_MINUTES || '30', 10),
  },

  // Birdeye configuration (placeholder - not currently used)
  birdeye: {
    apiKey: process.env.BIRDEYE_API_KEY || '',
  },

  // Notification configuration
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileLogging: process.env.FILE_LOGGING === 'true',
    logsPath: process.env.LOGS_PATH || 'logs',
  },

  // Performance monitoring
  performance: {
    monitorSlowQueries: process.env.MONITOR_SLOW_QUERIES === 'true',
    slowQueryThresholdMs: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000', 10),
    enableMetrics: process.env.ENABLE_METRICS === 'true',
  },

  // Metrics configuration (for StatsD)
  metrics: {
    host: process.env.METRICS_HOST || 'localhost',
    port: parseInt(process.env.METRICS_PORT || '8125', 10),
  },

  // Token tracking configuration
  tokenTracking: {
    defaultMinPredictedSuccessRate: parseFloat(process.env.DEFAULT_MIN_PREDICTED_SUCCESS_RATE || '74'),
    defaultMinLiquidity: parseFloat(process.env.DEFAULT_MIN_LIQUIDITY || '10000'),
    defaultMaxManipulationScore: parseFloat(process.env.DEFAULT_MAX_MANIPULATION_SCORE || '70'),
    default4xCandidateLimit: parseInt(process.env.DEFAULT_4X_CANDIDATE_LIMIT || '20', 10),
  },

  // External APIs configuration (replaced by your tier system)
  externalApis: {
    priceDataUrl: process.env.PRICE_DATA_URL || 'http://localhost:3001/api',
    patternDetectionUrl: process.env.PATTERN_DETECTION_URL || 'http://localhost:3002/api',
    smartMoneyUrl: process.env.SMART_MONEY_URL || 'http://localhost:3003/api', // This is replaced by your 88.3% tier system
  },

  // External wallet configuration
  externalWallet: {
    default4xLimit: parseInt(process.env.EXTERNAL_WALLET_4X_LIMIT || '3', 10),
    defaultTopPerformersLimit: parseInt(process.env.EXTERNAL_WALLET_TOP_PERFORMERS_LIMIT || '5', 10),
    highAchieves4xThreshold: parseFloat(process.env.EXTERNAL_WALLET_4X_THRESHOLD || '40')
  },

  // RPC endpoint configuration
  solanaRpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://mainnet.helius-rpc.com',
};