// src/services/telegram-bot.service.ts

// TelegramBot will be imported lazily when needed
// REMOVED: import TelegramBot from 'node-telegram-bot-api';

import winston from 'winston';
import { TelegramConfig } from '../types/telegram';

// Import the existing TokenAlert interface from AlertSystemService
// TODO: This should be imported from the actual location where TokenAlert is defined
// For now, keeping the interface definition here until we locate the source
interface TokenAlert {
  id: string;
  timestamp: Date;
  tokenAddress: string;
  tokenSymbol: string;
  edgeScore: number;
  alertType: 'HIGH_CONFIDENCE' | 'ULTRA_PREMIUM' | 'SMART_MONEY_SIGNAL';
  confidence: number;
  
  // Price & Market Data
  currentPrice: number;
  marketCap?: number;
  lpValueUSD: number;
  quoteToken: string;
  
  // Signal Breakdown
  signalScores: {
    [signalName: string]: number;
  };
  
  // Smart Money Analysis
  smartMoneyMetrics: {
    tier1Wallets: number;
    tier2Wallets: number;
    totalSmartWallets: number;
    avgWalletTier: number;
    recentActivity: boolean;
  };
  
  // Risk Assessment
  riskFactors: string[];
  riskScore: number;
  
  // Market Context
  marketContext: {
    solPrice: number;
    marketCondition: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    volumeProfile: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  
  // Action Recommended
  recommendedAction: 'BUY' | 'MONITOR' | 'WAIT';
  positionSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  timeHorizon: '6H' | '12H' | '24H' | '48H';
}

export class TelegramBotService {
  private bot?: any;  // TelegramBot type - will be dynamically imported
  private config: TelegramConfig;
  private logger: winston.Logger;
  private isInitialized: boolean = false;

  constructor(config: TelegramConfig, logger: winston.Logger) {
    this.config = config;
    this.logger = logger;
    
    // DON'T create TelegramBot here - wait until initialize() is called
    // this.bot will remain undefined until needed
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled || !this.config.botToken) {
      this.logger.info('Telegram bot disabled or token not provided');
      return;
    }

    try {
      // Lazy import TelegramBot only when initializing
      const TelegramBot = (await import('node-telegram-bot-api')).default;
      this.bot = new TelegramBot(this.config.botToken, { polling: false });
      
      // Verify bot token and get bot info
      const botInfo = await this.bot.getMe();
      this.logger.info('Telegram bot initialized successfully', { 
        botName: botInfo.username,
        botId: botInfo.id 
      });
      
      this.isInitialized = true;
      
      // Send startup notification
      await this.sendMessage('🚀 Thorp Alert System Online\nReady to deliver trading signals.');
      
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot', { error });
      throw error;
    }
  }

  async sendAlert(alert: TokenAlert): Promise<boolean> {
    if (!this.isInitialized || !this.config.enabled) {
      this.logger.debug('Telegram bot not ready, skipping alert', { 
        tokenSymbol: alert.tokenSymbol 
      });
      return false;
    }

    try {
      const message = this.formatAlertMessage(alert);
      await this.sendMessageWithRetry(message);
      
      this.logger.info('Telegram alert sent successfully', {
        tokenSymbol: alert.tokenSymbol,
        alertType: alert.alertType,
        edgeScore: alert.edgeScore
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to send Telegram alert', { 
        error, 
        tokenSymbol: alert.tokenSymbol 
      });
      return false;
    }
  }

  private formatAlertMessage(alert: TokenAlert): string {
    // Choose emoji based on alert type
    const alertEmoji = this.getAlertEmoji(alert.alertType);
    const positionSizeSOL = this.calculatePositionSizeSOL(alert.positionSize, alert.edgeScore);
    
    // Format smart money metrics
    const smartMoneyText = `${alert.smartMoneyMetrics.tier1Wallets} Tier-1, ${alert.smartMoneyMetrics.tier2Wallets} Tier-2`;
    
    // Format key signals (only show significant ones)
    const keySignals = this.formatKeySignals(alert.signalScores);
    
    // Format risk factors
    const riskText = alert.riskFactors.length > 0 
      ? alert.riskFactors.slice(0, 3).join(', ') 
      : 'Low risk profile';

    return `${alertEmoji} **${alert.alertType} ALERT** (Score: ${alert.edgeScore.toFixed(1)})

**Token:** $${alert.tokenSymbol}
\`${alert.tokenAddress}\`

**Smart Wallets:** ${smartMoneyText} (${alert.smartMoneyMetrics.totalSmartWallets} total)
**LP Analysis:** $${this.formatNumber(alert.lpValueUSD)} liquidity
**Position:** ${positionSizeSOL} SOL (${alert.positionSize})
**Confidence:** ${alert.confidence}%

**Key Signals:**
${keySignals}

**Market Context:**
• Price: $${alert.currentPrice}
${alert.marketCap ? `• Market Cap: $${this.formatNumber(alert.marketCap)}` : ''}
• SOL Price: $${alert.marketContext.solPrice}
• Condition: ${alert.marketContext.marketCondition}

**Recommendation:** ${alert.recommendedAction} | **Horizon:** ${alert.timeHorizon}
**Risk:** ${alert.riskScore}/100 (${riskText})

---
*Alert ID: ${alert.id.slice(-8)}*
*Time: ${alert.timestamp.toLocaleTimeString()}*`;
  }

  private getAlertEmoji(alertType: TokenAlert['alertType']): string {
    switch (alertType) {
      case 'ULTRA_PREMIUM': return '🚨';
      case 'HIGH_CONFIDENCE': return '⚡';
      case 'SMART_MONEY_SIGNAL': return '📊';
      default: return '🔔';
    }
  }

  private calculatePositionSizeSOL(positionSize: string, edgeScore: number): string {
    // Use your existing position sizing logic from the handoff document
    if (edgeScore >= 95) return '0.5';
    if (edgeScore >= 90) return '0.3';
    if (edgeScore >= 85) return '0.1';
    return '0.05';
  }

  private formatKeySignals(signalScores: { [key: string]: number }): string {
    const significantSignals = Object.entries(signalScores)
      .filter(([_, score]) => score > 0.1) // Only show signals above 10%
      .sort(([_, a], [__, b]) => b - a) // Sort by score descending
      .slice(0, 4) // Top 4 signals
      .map(([signal, score]) => `• ${this.formatSignalName(signal)}: ${(score * 100).toFixed(1)}%`);

    return significantSignals.length > 0 
      ? significantSignals.join('\n')
      : '• Edge detection algorithms activated';
  }

  private formatSignalName(signalName: string): string {
    // Convert camelCase to readable format
    return signalName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('Smart Wallet', 'Smart Money')
      .replace('Lp Analysis', 'LP Analysis');
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  }

  private async sendMessage(text: string): Promise<void> {
    if (!this.isInitialized || !this.bot) return;
    
    await this.bot.sendMessage(this.config.chatId, text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  }

  private async sendMessageWithRetry(text: string, attempt: number = 1): Promise<void> {
    try {
      await this.sendMessage(text);
    } catch (error) {
      const { maxRetries, baseDelayMs, exponentialBackoff } = this.config.retryConfig;
      
      if (attempt >= maxRetries) {
        this.logger.error('Telegram message failed after all retries', {
          error: (error as Error).message,
          attempts: attempt,
          textPreview: text.substring(0, 100)
        });
        throw error;
      }

      // Calculate delay
      let delay = baseDelayMs;
      if (exponentialBackoff) {
        delay = baseDelayMs * Math.pow(2, attempt - 1);
      }

      this.logger.warn('Telegram message failed, retrying', {
        error: (error as Error).message,
        attempt,
        nextRetryIn: delay
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry
      return this.sendMessageWithRetry(text, attempt + 1);
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn('Cannot test connection - bot not initialized');
      return false;
    }

    try {
      const testMessage = `🧪 **Telegram Bot Test**\n\nConnection successful!\nTimestamp: ${new Date().toISOString()}`;
      await this.sendMessage(testMessage);
      this.logger.info('Telegram test message sent successfully');
      return true;
    } catch (error) {
      this.logger.error('Telegram test failed', { error });
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.config.enabled;
  }

  async shutdown(): Promise<void> {
    if (this.isInitialized) {
      try {
        await this.sendMessage('🔴 Thorp Alert System Shutting Down');
        this.logger.info('Telegram bot shutdown complete');
      } catch (error) {
        this.logger.error('Error during Telegram shutdown', { error });
      }
    }
  }
}