// src/services/performance-integration.service.ts
import winston from 'winston';
import PerformanceMonitoringService from './performance-monitoring.service';
import { ModularSignalIntegration } from './modular-signal-integration.service';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

interface TokenDetection {
  tokenAddress: string;
  tokenSymbol: string;
  initialPrice: number;
  detectionSignals: DetectionSignals;
  overallScore: number;
  lpValueUSD: number;
  quoteToken: string;
  marketContext: {
    solPrice: number;
    marketCap?: number;
    volume24h?: number;
  };
}

interface PriceUpdate {
  tokenAddress: string;
  newPrice: number;
  timestamp: Date;
  marketCap?: number;
  volume24h?: number;
}

interface TradeConfiguration {
  targetMultiplier: number; // Default: 4 (for 4x target)
  stopLossPercentage?: number; // Optional stop loss
  timeoutHours?: number; // Auto-close trades after X hours
  priceUpdateIntervalMs: number; // How often to check prices
}

export class PerformanceIntegrationService {
  private logger: winston.Logger;
  private performanceService: PerformanceMonitoringService;
  private signalIntegration: ModularSignalIntegration;
  private config: TradeConfiguration;
  private activeTrades: Map<string, string> = new Map(); // tokenAddress -> tradeId
  private priceMonitorInterval?: NodeJS.Timeout;

  constructor(
    performanceService: PerformanceMonitoringService,
    signalIntegration: ModularSignalIntegration,
    config: Partial<TradeConfiguration> = {}
  ) {
    this.performanceService = performanceService;
    this.signalIntegration = signalIntegration;
    this.logger = this.initializeLogger();
    
    this.config = {
      targetMultiplier: 4,
      stopLossPercentage: -50, // Stop loss at -50%
      timeoutHours: 48, // Close trades after 48 hours
      priceUpdateIntervalMs: 60000, // Check prices every minute
      ...config
    };

    this.startPriceMonitoring();
  }

  private initializeLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'performance-integration' },
      transports: [
        new winston.transports.File({ filename: 'performance-integration.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  // === MAIN INTEGRATION METHODS ===

  /**
   * Call this method whenever your system detects a new token opportunity
   * This will automatically start tracking its performance
   */
  async recordTokenDetection(detection: TokenDetection): Promise<string> {
    try {
      // Convert DetectionSignals to signal scores for performance tracking
      const signalScores = this.convertSignalsToScores(detection.detectionSignals);

      // Record the trade in performance monitoring
      const tradeId = await this.performanceService.recordNewTrade({
        tokenAddress: detection.tokenAddress,
        tokenSymbol: detection.tokenSymbol,
        initialPrice: detection.initialPrice,
        signalScores,
        overallScore: detection.overallScore,
        lpValueUSD: detection.lpValueUSD,
        quoteToken: detection.quoteToken,
        marketContext: detection.marketContext
      });

      // Add to active trades tracking
      this.activeTrades.set(detection.tokenAddress, tradeId);

      this.logger.info(`🎯 Started tracking: ${detection.tokenSymbol} (${detection.tokenAddress}) - Score: ${detection.overallScore.toFixed(2)}`);
      
      return tradeId;
    } catch (error) {
      this.logger.error('Failed to record token detection:', error);
      throw error;
    }
  }

  /**
   * Call this to update a token's current price
   * The system will automatically determine if targets are hit
   */
  async updateTokenPrice(update: PriceUpdate): Promise<void> {
    try {
      if (!this.activeTrades.has(update.tokenAddress)) {
        // Not an active trade we're tracking
        return;
      }

      await this.performanceService.updateTradePrice(
        update.tokenAddress, 
        update.newPrice
      );

      // Log significant price movements
      const priceChange = await this.calculatePriceChange(update.tokenAddress, update.newPrice);
      if (Math.abs(priceChange) > 50) { // Log moves > 50%
        this.logger.info(`📈 Price update: ${update.tokenAddress} - ${priceChange.toFixed(1)}% change`);
      }

    } catch (error) {
      this.logger.error(`Failed to update price for ${update.tokenAddress}:`, error);
    }
  }

  /**
   * Batch update multiple token prices at once for efficiency
   */
  async updateMultipleTokenPrices(updates: PriceUpdate[]): Promise<void> {
    const promises = updates.map(update => 
      this.updateTokenPrice(update).catch(error => 
        this.logger.error(`Batch price update failed for ${update.tokenAddress}:`, error)
      )
    );

    await Promise.allSettled(promises);
  }

  /**
   * Enhanced method that automatically evaluates a token AND starts tracking it
   */
  async evaluateAndTrackToken(tokenData: {
    tokenAddress: string;
    tokenSymbol: string;
    initialPrice: number;
    lpValueUSD: number;
    quoteToken: string;
    marketContext: {
      solPrice: number;
      marketCap?: number;
      volume24h?: number;
    };
    deployer?: string;
  }): Promise<{
    shouldTrade: boolean;
    signals: DetectionSignals;
    overallScore: number;
    tradeId?: string;
  }> {
    try {
      // Use your existing modular signal system to evaluate the token
      const evaluation = await this.signalIntegration.evaluateToken({
        address: tokenData.tokenAddress,
        symbol: tokenData.tokenSymbol,
        lpValueUSD: tokenData.lpValueUSD,
        quoteToken: tokenData.quoteToken,
        deployer: tokenData.deployer || 'unknown'
      });

      // If the token passes your criteria, automatically start tracking it
      if (evaluation.shouldTrade) {
        const tradeId = await this.recordTokenDetection({
          tokenAddress: tokenData.tokenAddress,
          tokenSymbol: tokenData.tokenSymbol,
          initialPrice: tokenData.initialPrice,
          detectionSignals: evaluation.signals,
          overallScore: evaluation.overallScore,
          lpValueUSD: tokenData.lpValueUSD,
          quoteToken: tokenData.quoteToken,
          marketContext: tokenData.marketContext
        });

        this.logger.info(`✅ Token evaluation passed - Now tracking: ${tokenData.tokenSymbol}`);
        
        return {
          shouldTrade: true,
          signals: evaluation.signals,
          overallScore: evaluation.overallScore,
          tradeId
        };
      }

      return {
        shouldTrade: false,
        signals: evaluation.signals,
        overallScore: evaluation.overallScore
      };

    } catch (error) {
      this.logger.error(`Failed to evaluate and track token ${tokenData.tokenAddress}:`, error);
      throw error;
    }
  }

  // === MONITORING AND MANAGEMENT ===

  /**
   * Get current performance dashboard data
   */
  async getPerformanceDashboard(): Promise<any> {
    return await this.performanceService.getLiveMetricsDashboard();
  }

  /**
   * Get active trades being tracked
   */
  getActiveTradesCount(): number {
    return this.activeTrades.size;
  }

  /**
   * Get list of active trades
   */
  getActiveTradeAddresses(): string[] {
    return Array.from(this.activeTrades.keys());
  }

  /**
   * Manually close a trade (for testing or manual intervention)
   */
  async closeTradeManually(tokenAddress: string, reason: string = 'manual_close'): Promise<void> {
    if (this.activeTrades.has(tokenAddress)) {
      // Update final price and status
      // Note: This would need the actual current price - you'd call this with current price
      this.logger.info(`🛑 Manually closing trade: ${tokenAddress} - Reason: ${reason}`);
      this.activeTrades.delete(tokenAddress);
    }
  }

  // === AUTOMATED PRICE MONITORING ===

  private startPriceMonitoring(): void {
    this.logger.info(`🔄 Starting automated price monitoring (${this.config.priceUpdateIntervalMs}ms intervals)`);
    
    this.priceMonitorInterval = setInterval(async () => {
      await this.monitorActiveTrades();
    }, this.config.priceUpdateIntervalMs);
  }

  private async monitorActiveTrades(): Promise<void> {
    if (this.activeTrades.size === 0) return;

    try {
      // This is where you'd integrate with your price feed service
      // For now, we'll create a stub method that you can replace with your actual price fetching
      const activeAddresses = Array.from(this.activeTrades.keys());
      await this.fetchAndUpdatePrices(activeAddresses);
      
    } catch (error) {
      this.logger.error('Error monitoring active trades:', error);
    }
  }

  /**
   * STUB METHOD - Replace this with your actual price fetching logic
   * This should fetch current prices from your RPC/price service
   */
  private async fetchAndUpdatePrices(tokenAddresses: string[]): Promise<void> {
    // TODO: Replace with actual price fetching from your RPC service
    // Example integration:
    /*
    for (const address of tokenAddresses) {
      try {
        const currentPrice = await yourPriceService.getTokenPrice(address);
        await this.updateTokenPrice({
          tokenAddress: address,
          newPrice: currentPrice,
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.warn(`Failed to fetch price for ${address}:`, error);
      }
    }
    */
    
    // For now, just log that we would be checking prices
    this.logger.debug(`Would check prices for ${tokenAddresses.length} active trades`);
  }

  // === HELPER METHODS ===

  private convertSignalsToScores(signals: DetectionSignals): { [signalName: string]: number } {
    return {
      smartWallet: signals.smartWallet?.overallScore || 0,
      lpAnalysis: signals.lpAnalysis?.overallScore || 0,
      deepHolderAnalysis: signals.deepHolderAnalysis?.overallScore || 0,
      transactionPattern: signals.transactionPattern?.overallScore || 0,
      socialSignals: signals.socialSignals?.overallScore || 0,
      technicalPattern: signals.technicalPattern?.overallScore || 0,
      marketContext: signals.marketContext?.overallScore || 0,
      riskAssessment: signals.riskAssessment?.overallScore || 0
    };
  }

  private async calculatePriceChange(tokenAddress: string, newPrice: number): Promise<number> {
    // This would typically fetch the initial price from your performance monitoring service
    // For now, return 0 as a stub
    return 0;
  }

  // === CLEANUP ===

  stop(): void {
    if (this.priceMonitorInterval) {
      clearInterval(this.priceMonitorInterval);
      this.priceMonitorInterval = undefined;
    }
    this.logger.info('Performance integration service stopped');
  }

  // === CONFIGURATION UPDATES ===

  updateConfig(newConfig: Partial<TradeConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Performance monitoring configuration updated:', newConfig);
    
    // Restart price monitoring with new interval if changed
    if (newConfig.priceUpdateIntervalMs && this.priceMonitorInterval) {
      this.stop();
      this.startPriceMonitoring();
    }
  }

  // === INTEGRATION HOOKS ===

  /**
   * Hook this into your LP Scanner when it finds new tokens
   */
  async onNewLPDetected(lpData: {
    tokenAddress: string;
    tokenSymbol: string;
    initialPrice: number;
    lpValueUSD: number;
    quoteToken: string;
    deployer?: string;
  }): Promise<void> {
    try {
      const result = await this.evaluateAndTrackToken({
        ...lpData,
        marketContext: {
          solPrice: 130, // You'd get this from your market service
          marketCap: lpData.lpValueUSD * 2, // Rough estimate
        }
      });

      if (result.shouldTrade) {
        this.logger.info(`🎯 LP Scanner → New trade started: ${lpData.tokenSymbol}`);
      } else {
        this.logger.debug(`❌ LP Scanner → Token rejected: ${lpData.tokenSymbol} (Score: ${result.overallScore.toFixed(2)})`);
      }
    } catch (error) {
      this.logger.error(`Failed to process LP detection for ${lpData.tokenAddress}:`, error);
    }
  }

  /**
   * Get performance statistics for reporting
   */
  async getPerformanceStats(): Promise<{
    activeTradesCount: number;
    successRate24h: number;
    averageReturn24h: number;
    topPerformingSignals: Array<{ name: string; accuracy: number }>;
  }> {
    const dashboard = await this.getPerformanceDashboard();
    
    return {
      activeTradesCount: this.getActiveTradesCount(),
      successRate24h: dashboard.currentSuccessRate,
      averageReturn24h: dashboard.averageReturn,
      topPerformingSignals: dashboard.signalPerformance
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 3)
    };
  }
}

export default PerformanceIntegrationService;