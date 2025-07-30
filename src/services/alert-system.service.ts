// src/services/alert-system.service.ts

/**
 * THORP ALERT SYSTEM SERVICE
 * 
 * INTEGRATION REQUIREMENTS:
 * This service requires complete upstream scoring analysis before processing alerts.
 * The upstream ModularEdgeCalculatorService must provide:
 * 
 * 1. Complete signal scores for all 8 modules
 * 2. Smart money analysis with tier breakdown (tier1Wallets, tier2Wallets, etc.)
 * 3. walletAnalysisComplete flag set to true
 * 4. All required market context data
 * 
 * DEPENDENCY CHAIN:
 * Discovery → Pre-validation → Smart Money Analysis → Edge Calculation → ALERT SYSTEM
 * 
 * The alert system will reject tokens if upstream analysis is incomplete.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import winston from 'winston';
import { EventEmitter } from 'events';
import PerformanceMonitoringService from './performance-monitoring.service';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramConfig, createTelegramConfig, PartialTelegramConfig } from '../types/telegram';

// Input Types - Strictly typed for upstream integration
interface TokenDataInput {
  tokenAddress: string;
  tokenSymbol: string;
  edgeScore: number;
  // REQUIRED: All 8 signal modules must provide scores (0-1 range)
  signalScores: {
    smartWallet: number;        // Priority 100, weight 0.6
    lpAnalysis: number;         // Weight 0.25  
    deepHolderAnalysis: number; // Standard signal
    transactionPattern: number; // Standard signal
    socialSignals: number;      // Standard signal
    technicalPattern: number;   // Standard signal
    marketContext: number;
    [key: string]: number;      // Standard signal
    riskAssessment: number;     // Standard signal
  };
  currentPrice: number;
  marketCap?: number;
  lpValueUSD: number;
  quoteToken: string;
  marketContext: {
    solPrice: number;
    marketCondition?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    volume24h?: number;
  };
  // CRITICAL: Smart money data must be complete from upstream analysis
  smartMoneyData: {
    tier1Wallets: number;          // Count of Tier 1 wallets detected
    tier2Wallets: number;          // Count of Tier 2 wallets detected  
    tier3Wallets: number;          // Count of Tier 3 wallets detected
    totalSmartWallets: number;     // Total smart wallets detected
    avgWalletTier: number;         // Average tier (1.0-3.0)
    recentActivity: boolean;       // Recent smart wallet activity detected
    walletAnalysisComplete: boolean; // MUST be true for alert processing
  };
}

interface WebhookRetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
}

// Alert Types
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

interface AlertConfig {
  // Thresholds
  edgeScoreThreshold: number;
  confidenceThreshold: number;
  
  // Output Methods
  consoleOutput: boolean;
  fileOutput: boolean;
  webhookUrl?: string;
  webhookRetry: WebhookRetryConfig;
  
  // Rate Limiting
  maxAlertsPerHour: number;
  duplicateFilterMinutes: number;
  
  // Alert Levels
  highConfidenceThreshold: number;
  ultraPremiumThreshold: number;
  
  // File Settings
  alertLogPath: string;
  maxLogFiles: number;
  maxLogSizeBytes: number;

  // Telegram
  telegram?: TelegramConfig;
}

interface AlertStats {
  totalAlerts: number;
  alertsToday: number;
  alertsThisHour: number;
  lastAlertTime?: Date;
  alertsByType: {
    HIGH_CONFIDENCE: number;
    ULTRA_PREMIUM: number;
    SMART_MONEY_SIGNAL: number;
  };
  successRate: number;
  averageEdgeScore: number;
}

export class AlertSystemService extends EventEmitter {
  private logger: winston.Logger;
  private performanceMonitoring: PerformanceMonitoringService;
  private config: AlertConfig;
  
  // Alert tracking
  private alertHistory: Map<string, TokenAlert> = new Map();
  private recentAlerts: Set<string> = new Set();
  private alertStats: AlertStats;
  
  // Rate limiting
  private hourlyAlertCount: number = 0;
  private lastHourReset: Date = new Date();

  // Telegram
  private telegramBot?: TelegramBotService;

  constructor(
    performanceMonitoring: PerformanceMonitoringService,
    config?: Partial<AlertConfig>
  ) {
    super();
    
    this.performanceMonitoring = performanceMonitoring;
    this.config = this.mergeConfig(config);
    this.logger = this.initializeLogger();
    this.alertStats = this.initializeStats();

    this.initializeTelegramBot();
    
    this.initializeAlertSystem();
    this.startCleanupTasks();
  }

  private mergeConfig(userConfig?: Partial<AlertConfig>): AlertConfig {
    const defaultConfig: AlertConfig = {
      // Thresholds
      edgeScoreThreshold: 85,
      confidenceThreshold: 75,
  
      // Output Methods
      consoleOutput: true,
      fileOutput: true,
      webhookRetry: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        exponentialBackoff: true,
      },
  
      // Rate Limiting
      maxAlertsPerHour: 10,
      duplicateFilterMinutes: 30,
  
      // Alert Levels
      highConfidenceThreshold: 85,
      ultraPremiumThreshold: 92,
  
      // File Settings
      alertLogPath: './logs/alerts',
      maxLogFiles: 30,
      maxLogSizeBytes: 10 * 1024 * 1024, // 10MB
  
      // Telegram Defaults
      telegram: {
        enabled: false,
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        retryConfig: {
          maxRetries: parseInt(process.env.TELEGRAM_MAX_RETRIES || '3'),
          baseDelayMs: parseInt(process.env.TELEGRAM_RETRY_DELAY || '1000'),
          exponentialBackoff: process.env.TELEGRAM_EXPONENTIAL_BACKOFF !== 'false'
        }
      }
    };
  
    const mergedConfig = { ...defaultConfig, ...userConfig };
  
    // Override Telegram config from environment if present
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      mergedConfig.telegram = createTelegramConfig({
        enabled: process.env.TELEGRAM_ENABLED === 'true',
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
      });
    }
    
    return mergedConfig;
  }

  private initializeLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'alert-system' },
      transports: [
        new winston.transports.File({ 
          filename: path.join(this.config.alertLogPath, 'alerts.log'),
          maxsize: this.config.maxLogSizeBytes,
          maxFiles: this.config.maxLogFiles
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  private initializeStats(): AlertStats {
    return {
      totalAlerts: 0,
      alertsToday: 0,
      alertsThisHour: 0,
      alertsByType: {
        HIGH_CONFIDENCE: 0,
        ULTRA_PREMIUM: 0,
        SMART_MONEY_SIGNAL: 0
      },
      successRate: 0,
      averageEdgeScore: 0
    };
  }

  private async initializeAlertSystem(): Promise<void> {
    try {
      // Ensure alert log directory exists
      await fs.mkdir(this.config.alertLogPath, { recursive: true });
      
      this.logger.info('🚨 Alert System initialized', {
        edgeThreshold: this.config.edgeScoreThreshold,
        maxHourlyAlerts: this.config.maxAlertsPerHour,
        outputMethods: {
          console: this.config.consoleOutput,
          file: this.config.fileOutput,
          webhook: !!this.config.webhookUrl
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize alert system:', error);
      throw error;
    }
  }

  // === MAIN ALERT PROCESSING ===

  async processTokenAlert(tokenData: TokenDataInput): Promise<boolean> {
    try {
      // Validate upstream integration requirements
      if (!this.validateUpstreamData(tokenData)) {
        return false;
      }

      // Check if should alert
      if (!this.shouldTriggerAlert(tokenData)) {
        return false;
      }

      // Create alert
      const alert = await this.createTokenAlert(tokenData);
      
      // Process alert
      await this.triggerAlert(alert);
      
      // Record in performance monitoring
      await this.recordAlertInPerformanceSystem(alert);
      
      return true;
    } catch (error) {
      this.logger.error('Failed to process token alert:', error);
      return false;
    }
  }

  private validateUpstreamData(tokenData: TokenDataInput): boolean {
    // Validate that upstream scoring system provided required data
    if (!tokenData.smartMoneyData.walletAnalysisComplete) {
      this.logger.error('Smart money analysis not complete', { 
        tokenAddress: tokenData.tokenAddress 
      });
      return false;
    }

    // Validate signal scores are present
    const requiredSignals = ['smartWallet', 'lpAnalysis', 'deepHolderAnalysis'];
    for (const signal of requiredSignals) {
      if (tokenData.signalScores[signal] === undefined) {
        this.logger.error('Missing required signal score', { 
          tokenAddress: tokenData.tokenAddress,
          missingSignal: signal 
        });
        return false;
      }
    }

    return true;
  }

  private shouldTriggerAlert(tokenData: any): boolean {
    // Check edge score threshold
    if (tokenData.edgeScore < this.config.edgeScoreThreshold) {
      return false;
    }

    // Check rate limiting
    if (!this.checkRateLimit()) {
      this.logger.warn('Alert rate limit exceeded', { 
        hourlyCount: this.hourlyAlertCount,
        maxPerHour: this.config.maxAlertsPerHour 
      });
      return false;
    }

    // Check for duplicates
    if (this.isDuplicateAlert(tokenData.tokenAddress)) {
      this.logger.debug('Duplicate alert filtered', { 
        tokenAddress: tokenData.tokenAddress 
      });
      return false;
    }

    return true;
  }

  private async createTokenAlert(tokenData: TokenDataInput): Promise<TokenAlert> {
    // Determine alert type and confidence
    const alertType = this.determineAlertType(tokenData.edgeScore, tokenData.signalScores);
    const confidence = this.calculateConfidence(tokenData);
    
    // Use real smart money metrics from upstream
    const smartMoneyMetrics = this.analyzeSmartMoneySignals(tokenData);
    
    // Assess risk factors
    const { riskFactors, riskScore } = this.assessRiskFactors(tokenData);
    
    // Determine recommended action
    const { recommendedAction, positionSize, timeHorizon } = this.getRecommendations(
      tokenData.edgeScore, 
      confidence, 
      riskScore
    );

    const alert: TokenAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      tokenAddress: tokenData.tokenAddress,
      tokenSymbol: tokenData.tokenSymbol,
      edgeScore: tokenData.edgeScore,
      alertType,
      confidence,
      
      currentPrice: tokenData.currentPrice,
      marketCap: tokenData.marketCap,
      lpValueUSD: tokenData.lpValueUSD,
      quoteToken: tokenData.quoteToken,
      
      signalScores: tokenData.signalScores,
      smartMoneyMetrics,
      riskFactors,
      riskScore,
      
      marketContext: {
        solPrice: tokenData.marketContext.solPrice,
        marketCondition: tokenData.marketContext.marketCondition || 'NEUTRAL',
        volumeProfile: this.categorizeVolume(tokenData.marketContext.volume24h)
      },
      
      recommendedAction,
      positionSize,
      timeHorizon
    };

    return alert;
  }

  private async triggerAlert(alert: TokenAlert): Promise<void> {
    // Update tracking
    this.alertHistory.set(alert.id, alert);
    this.recentAlerts.add(alert.tokenAddress);
    this.updateAlertStats(alert);

    // Output alert via configured methods
    if (this.config.consoleOutput) {
      this.outputConsoleAlert(alert);
    }

    if (this.config.fileOutput) {
      await this.outputFileAlert(alert);
    }

    if (this.config.webhookUrl) {
      await this.outputWebhookAlert(alert);
    }

    // Emit event for other services
    this.emit('alert', alert);

    this.logger.info('🚨 Alert triggered', {
      tokenSymbol: alert.tokenSymbol,
      edgeScore: alert.edgeScore,
      alertType: alert.alertType,
      confidence: alert.confidence
    });
  }

  private async recordAlertInPerformanceSystem(alert: TokenAlert): Promise<void> {
    try {
      const tradeId = await this.performanceMonitoring.recordNewTrade({
        tokenAddress: alert.tokenAddress,
        tokenSymbol: alert.tokenSymbol,
        initialPrice: alert.currentPrice,
        signalScores: alert.signalScores,
        overallScore: alert.edgeScore,
        lpValueUSD: alert.lpValueUSD,
        quoteToken: alert.quoteToken,
        marketContext: {
          solPrice: alert.marketContext.solPrice,
          marketCap: alert.marketCap,
          volume24h: alert.marketContext.volumeProfile === 'HIGH' ? 1000000 : 100000
        }
      });

      this.logger.info('Trade recorded in performance system', { 
        tradeId, 
        tokenSymbol: alert.tokenSymbol 
      });
    } catch (error) {
      this.logger.error('Failed to record trade in performance system:', error);
    }
  }

  // === ALERT OUTPUT METHODS ===

  private outputConsoleAlert(alert: TokenAlert): void {
    const alertSymbol = alert.alertType === 'ULTRA_PREMIUM' ? '🔥' : 
                       alert.alertType === 'HIGH_CONFIDENCE' ? '⚡' : '📊';
    
    console.log('\n' + '='.repeat(80));
    console.log(`${alertSymbol} ${alert.alertType} ALERT - ${alert.tokenSymbol} ${alertSymbol}`);
    console.log('='.repeat(80));
    console.log(`🎯 Edge Score: ${alert.edgeScore} | Confidence: ${alert.confidence}%`);
    console.log(`💰 Price: $${alert.currentPrice} | LP Value: $${alert.lpValueUSD.toLocaleString()}`);
    console.log(`🧠 Smart Money: T1:${alert.smartMoneyMetrics.tier1Wallets} T2:${alert.smartMoneyMetrics.tier2Wallets}`);
    console.log(`⚡ Action: ${alert.recommendedAction} (${alert.positionSize}) - ${alert.timeHorizon}`);
    console.log(`📊 Risk Score: ${alert.riskScore} | Factors: ${alert.riskFactors.join(', ')}`);
    console.log(`🔗 Address: ${alert.tokenAddress}`);
    console.log('='.repeat(80) + '\n');
  }

  private async outputFileAlert(alert: TokenAlert): Promise<void> {
    const alertFile = path.join(
      this.config.alertLogPath, 
      `alerts-${new Date().toISOString().split('T')[0]}.json`
    );

    try {
      const alertData = JSON.stringify(alert, null, 2) + ',\n';
      await fs.appendFile(alertFile, alertData);
    } catch (error) {
      this.logger.error('Failed to write alert to file:', error);
    }
  }

  private async outputWebhookAlert(alert: TokenAlert): Promise<void> {
    // 1. Send to webhook (existing functionality)
    if (this.config.webhookUrl) {
      await this.sendWebhookAlert(alert);
    }
  
    // 2. Send to Telegram (new functionality)
    if (this.telegramBot?.isReady()) {
      await this.sendTelegramAlert(alert);
    }
  }

  private async sendWebhookAlert(alert: TokenAlert): Promise<void> {
    const payload = {
      text: `🚨 ${alert.alertType} Alert: ${alert.tokenSymbol}`,
      attachments: [{
        color: alert.alertType === 'ULTRA_PREMIUM' ? 'danger' : 'warning',
        fields: [
          { title: 'Edge Score', value: alert.edgeScore.toString(), short: true },
          { title: 'Confidence', value: `${alert.confidence}%`, short: true },
          { title: 'Price', value: `${alert.currentPrice}`, short: true },
          { title: 'Action', value: alert.recommendedAction, short: true }
        ]
      }]
    };
  
    await this.sendWebhookWithRetry(payload);
  }
  
  private async sendTelegramAlert(alert: TokenAlert): Promise<void> {
    try {
      const success = await this.telegramBot!.sendAlert(alert);
  
      if (success) {
        this.logger.debug('Telegram alert sent successfully', {
          tokenSymbol: alert.tokenSymbol,
          alertType: alert.alertType
        });
      } else {
        this.logger.warn('Telegram alert failed to send', {
          tokenSymbol: alert.tokenSymbol
        });
      }
    } catch (error) {
      this.logger.error('Error sending Telegram alert', {
        error,
        tokenSymbol: alert.tokenSymbol
      });
    }
  }

  // Public method to test if Telegram bot is working
  public async testTelegramConnection(): Promise<boolean> {
    if (!this.telegramBot?.isReady()) {
      this.logger.warn('Telegram bot not ready for testing');
      return false;
    }

    return await this.telegramBot.testConnection();
  }

  // Public method to return Telegram config status
  public getTelegramStatus(): { enabled: boolean; ready: boolean; configured: boolean } {
    return {
      enabled: this.config.telegram?.enabled || false,
      ready: this.telegramBot?.isReady() || false,
      configured: !!(this.config.telegram?.botToken && this.config.telegram?.chatId)
    };
  }

  private async sendWebhookWithRetry(payload: any, attempt: number = 1): Promise<void> {
    try {
      const response = await fetch(this.config.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      this.logger.debug('Webhook sent successfully', { attempt });
      
    } catch (error) {
      const retryConfig = this.config.webhookRetry;
      
      if (attempt >= retryConfig.maxRetries) {
        this.logger.error('Webhook failed after all retries', { 
          error: (error as Error).message, 
          attempts: attempt,
          payload: JSON.stringify(payload)
        });
        return;
      }

      // Calculate delay with exponential backoff
      let delay = retryConfig.baseDelayMs;
      if (retryConfig.exponentialBackoff) {
        delay = Math.min(
          retryConfig.baseDelayMs * Math.pow(2, attempt - 1),
          retryConfig.maxDelayMs
        );
      }

      this.logger.warn('Webhook failed, retrying', { 
        error: (error as Error).message, 
        attempt, 
        nextRetryIn: delay 
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry
      return this.sendWebhookWithRetry(payload, attempt + 1);
    }
  }

  // === HELPER METHODS ===

  private determineAlertType(edgeScore: number, signalScores: any): TokenAlert['alertType'] {
    if (edgeScore >= this.config.ultraPremiumThreshold) {
      return 'ULTRA_PREMIUM';
    }
    
    if (edgeScore >= this.config.highConfidenceThreshold) {
      return 'HIGH_CONFIDENCE';
    }
    
    // Check if driven by smart money signals
    const smartWalletScore = signalScores.smartWallet || 0;
    if (smartWalletScore > 0.8) {
      return 'SMART_MONEY_SIGNAL';
    }
    
    return 'HIGH_CONFIDENCE';
  }

  private calculateConfidence(tokenData: TokenDataInput): number {
    let confidence = 0;
    
    // Base confidence from edge score
    confidence += Math.min(tokenData.edgeScore, 40);
    
    // Smart wallet activity bonus
    const smartWalletScore = tokenData.signalScores.smartWallet || 0;
    confidence += smartWalletScore * 30;
    
    // LP analysis bonus
    const lpScore = tokenData.signalScores.lpAnalysis || 0;
    confidence += lpScore * 20;
    
    // Market cap penalty for very small caps
    if (tokenData.marketCap && tokenData.marketCap < 100000) {
      confidence -= 10;
    }
    
    return Math.min(Math.max(confidence, 0), 100);
  }

  private analyzeSmartMoneySignals(tokenData: TokenDataInput): TokenAlert['smartMoneyMetrics'] {
    // Use real smart money data provided by upstream scoring system
    return {
      tier1Wallets: tokenData.smartMoneyData.tier1Wallets,
      tier2Wallets: tokenData.smartMoneyData.tier2Wallets,
      totalSmartWallets: tokenData.smartMoneyData.totalSmartWallets,
      avgWalletTier: tokenData.smartMoneyData.avgWalletTier,
      recentActivity: tokenData.smartMoneyData.recentActivity
    };
  }

  private assessRiskFactors(tokenData: TokenDataInput): { riskFactors: string[]; riskScore: number } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    if (!tokenData.marketCap || tokenData.marketCap < 50000) {
      riskFactors.push('VERY_LOW_MCAP');
      riskScore += 30;
    }

    if (tokenData.lpValueUSD < 10000) {
      riskFactors.push('LOW_LIQUIDITY');
      riskScore += 25;
    }

    if (!tokenData.signalScores.smartWallet || tokenData.signalScores.smartWallet < 0.3) {
      riskFactors.push('LIMITED_SMART_MONEY');
      riskScore += 20;
    }

    // Check smart money analysis completeness
    if (!tokenData.smartMoneyData.walletAnalysisComplete) {
      riskFactors.push('INCOMPLETE_ANALYSIS');
      riskScore += 15;
    }

    // Low tier 1 wallet activity
    if (tokenData.smartMoneyData.tier1Wallets === 0) {
      riskFactors.push('NO_TIER1_ACTIVITY');
      riskScore += 10;
    }

    return { riskFactors, riskScore: Math.min(riskScore, 100) };
  }

  private getRecommendations(edgeScore: number, confidence: number, riskScore: number): {
    recommendedAction: TokenAlert['recommendedAction'];
    positionSize: TokenAlert['positionSize'];
    timeHorizon: TokenAlert['timeHorizon'];
  } {
    let recommendedAction: TokenAlert['recommendedAction'] = 'MONITOR';
    let positionSize: TokenAlert['positionSize'] = 'SMALL';
    let timeHorizon: TokenAlert['timeHorizon'] = '24H';

    if (edgeScore >= 92 && confidence >= 85 && riskScore <= 30) {
      recommendedAction = 'BUY';
      positionSize = 'LARGE';
      timeHorizon = '6H';
    } else if (edgeScore >= 88 && confidence >= 75 && riskScore <= 50) {
      recommendedAction = 'BUY';
      positionSize = 'MEDIUM';
      timeHorizon = '12H';
    } else if (edgeScore >= 85 && confidence >= 65) {
      recommendedAction = 'BUY';
      positionSize = 'SMALL';
      timeHorizon = '24H';
    }

    return { recommendedAction, positionSize, timeHorizon };
  }

  private checkRateLimit(): boolean {
    const now = new Date();
    
    // Reset hourly counter if needed
    if (now.getTime() - this.lastHourReset.getTime() >= 3600000) {
      this.hourlyAlertCount = 0;
      this.lastHourReset = now;
    }
    
    return this.hourlyAlertCount < this.config.maxAlertsPerHour;
  }

  private isDuplicateAlert(tokenAddress: string): boolean {
    return this.recentAlerts.has(tokenAddress);
  }

  private updateAlertStats(alert: TokenAlert): void {
    this.alertStats.totalAlerts++;
    this.alertStats.alertsThisHour++;
    this.alertStats.lastAlertTime = alert.timestamp;
    this.alertStats.alertsByType[alert.alertType]++;
    
    // Update today's count
    const today = new Date().toDateString();
    const alertDate = alert.timestamp.toDateString();
    if (today === alertDate) {
      this.alertStats.alertsToday++;
    }
  }

  private categorizeVolume(volume24h?: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (!volume24h) return 'LOW';
    if (volume24h > 1000000) return 'HIGH';
    if (volume24h > 100000) return 'MEDIUM';
    return 'LOW';
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanupTasks(): void {
    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 3600000);

    // Reset hourly stats
    setInterval(() => {
      this.alertStats.alertsThisHour = 0;
    }, 3600000);
  }

  private cleanupOldAlerts(): void {
    const cutoff = new Date(Date.now() - this.config.duplicateFilterMinutes * 60 * 1000);
    
    for (const [id, alert] of this.alertHistory.entries()) {
      if (alert.timestamp < cutoff) {
        this.alertHistory.delete(id);
        this.recentAlerts.delete(alert.tokenAddress);
      }
    }
  }

  // === PUBLIC API ===

  getAlertStats(): AlertStats {
    return { ...this.alertStats };
  }

  getRecentAlerts(limit: number = 10): TokenAlert[] {
    return Array.from(this.alertHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Alert system config updated', newConfig);
  }

  /**
 * Initializes the Telegram bot if enabled in config
 */
private initializeTelegramBot(): void {
  if (this.config.telegram?.enabled && this.config.telegram.botToken) {
    try {
      this.telegramBot = new TelegramBotService(this.config.telegram, this.logger);

      this.telegramBot.initialize().catch(error => {
        this.logger.error('Failed to initialize Telegram bot', { error });
        this.telegramBot = undefined;
      });
    } catch (error) {
      this.logger.error('Error creating Telegram bot service', { error });
    }
  }
}

async shutdown(): Promise<void> {
  if (this.telegramBot) {
    await this.telegramBot.shutdown();
    this.logger.info('✅ Telegram bot shut down');
  }

  this.logger.info('🔒 Alert system shutdown complete');
}

}

export default AlertSystemService;