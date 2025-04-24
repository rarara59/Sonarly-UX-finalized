// src/config/app-config.ts
import dotenv from 'dotenv';

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
    },
  },
  
  // Smart wallet configuration
  smartWallet: {
    defaultMinSuccessRate: parseFloat(process.env.DEFAULT_MIN_SUCCESS_RATE || '74'),
    defaultMaxSuccessRate: parseFloat(process.env.DEFAULT_MAX_SUCCESS_RATE || '76'),
    defaultMinEarlyAdoptionScore: parseFloat(process.env.DEFAULT_MIN_EARLY_ADOPTION_SCORE || '8.0'),
    defaultRecentActivityHours: parseInt(process.env.DEFAULT_RECENT_ACTIVITY_HOURS || '48', 10),
  },
  
  // Pagination configuration
  pagination: {
    defaultPerPage: parseInt(process.env.DEFAULT_PER_PAGE || '25', 10),
    maxPerPage: parseInt(process.env.MAX_PER_PAGE || '100', 10),
  },
  
  // Solana API configuration
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    heliusApiKey: process.env.HELIUS_API_KEY || '',
    chainstackApiKey: process.env.CHAINSTACK_API_KEY || '',
  },
  
  // Token market data configuration
  tokenMarketData: {
    birdeyeApiKey: process.env.BIRDEYE_API_KEY || '',
    refreshIntervalMinutes: parseInt(process.env.TOKEN_REFRESH_INTERVAL_MINUTES || '30', 10),
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
};