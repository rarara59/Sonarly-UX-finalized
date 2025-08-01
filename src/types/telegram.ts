// src/types/telegram.ts
/**
 * Telegram Bot Configuration Interface
 * Used by AlertSystemService to configure Telegram output
 */
export interface TelegramConfig {
  /** Enable/disable Telegram alerts */
  enabled: boolean;
  /** Telegram bot token from BotFather */
  botToken: string;
  /** Chat ID where alerts will be sent */
  chatId: string;
  /** Retry configuration for failed messages - REQUIRED (defaults provided) */
  retryConfig: {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Base delay between retries in milliseconds */
    baseDelayMs: number;
    /** Whether to use exponential backoff for retries */
    exponentialBackoff: boolean;
  };
}

/**
 * Telegram Alert Status
 * Tracks the result of sending a Telegram alert
 */
export interface TelegramAlertResult {
  /** Whether the alert was sent successfully */
  success: boolean;
  /** Error message if sending failed */
  error?: string;
  /** Number of retry attempts made */
  attempts: number;
  /** Timestamp when alert was sent/failed */
  timestamp: Date;
}

/**
 * Default Telegram Configuration
 * Used when no custom config is provided
 */
export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  enabled: false,
  botToken: '',
  chatId: '',
  retryConfig: {
    maxRetries: 3,
    baseDelayMs: 1000,
    exponentialBackoff: true
  }
};

/**
 * Partial Telegram Configuration for merging
 * Used internally when merging user config with defaults
 */
export interface PartialTelegramConfig {
  enabled?: boolean;
  botToken?: string;
  chatId?: string;
  retryConfig?: {
    maxRetries?: number;
    baseDelayMs?: number;
    exponentialBackoff?: boolean;
  };
}

/**
 * Environment Variables for Telegram Configuration
 * Maps environment variables to TelegramConfig properties
 */
export interface TelegramEnvVars {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_ENABLED?: string;
  TELEGRAM_MAX_RETRIES?: string;
  TELEGRAM_RETRY_DELAY?: string;
  TELEGRAM_EXPONENTIAL_BACKOFF?: string;
}

/**
 * Utility function to create complete TelegramConfig from partial inputs
 * Ensures retryConfig is always present
 */
export function createTelegramConfig(partial: PartialTelegramConfig): TelegramConfig {
  return {
    enabled: partial.enabled ?? DEFAULT_TELEGRAM_CONFIG.enabled,
    botToken: partial.botToken ?? DEFAULT_TELEGRAM_CONFIG.botToken,
    chatId: partial.chatId ?? DEFAULT_TELEGRAM_CONFIG.chatId,
    retryConfig: {
      maxRetries: partial.retryConfig?.maxRetries ?? DEFAULT_TELEGRAM_CONFIG.retryConfig.maxRetries,
      baseDelayMs: partial.retryConfig?.baseDelayMs ?? DEFAULT_TELEGRAM_CONFIG.retryConfig.baseDelayMs,
      exponentialBackoff: partial.retryConfig?.exponentialBackoff ?? DEFAULT_TELEGRAM_CONFIG.retryConfig.exponentialBackoff
    }
  };
}