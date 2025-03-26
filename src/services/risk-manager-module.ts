// src/services/risk-manager-module.ts

import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { Trade, Portfolio, IPortfolio, ITrade, TradeStatus, TradeResult, PositionSizeStrategy } from '../models/trading-models';
import { IEdgeCalculation } from './edge-calculator-service';
import { config } from '../config';

/**
 * Risk parameters interface that follows the recommendation
 */
export interface RiskParameters {
  maxPositionSizePercent: number;
  stopLossPercent: number;
  trailingStopActivation: number;
  maxDrawdownPercent: number;
  maxDailyTrades: number;
  maxExposurePercent: number;
  minVolumeDollars: number;
  blacklistedPatterns: string[];
  volatilityThreshold: number;
  liquidityThresholdDollars: number;
}

/**
 * Position sizing result interface
 */
export interface PositionSizingResult {
  positionSize: number;
  positionSizeUSD: number;
  stopLossLevel: number;
  maxLoss: number;
  trailingStopLevel: number | null;
  riskRewardRatio: number;
  entryConfidence: 'LOW' | 'MEDIUM' | 'HIGH';
  strategy: PositionSizeStrategy;
  justification: string;
}

/**
 * Risk check result interface
 */
export interface RiskCheckResult {
  approved: boolean;
  reason?: string;
  riskScore: number;
  adjustedEdgeScore?: number;
}

/**
 * Risk Manager Module - Implementation based on the recommendation
 * Serves as a bridge between edge calculation and execution
 */
export class RiskManagerModule {
  private riskConfig!: RiskParameters;
  private configPath: string;
  private dailyTradeCount: number = 0;
  private totalPortfolioValue: number;
  private currentExposure: number = 0;
  private lastResetDate: Date = new Date();
  private enhancedRiskService: any; // Reference to enhanced risk service
  private baseRiskService: any; // Reference to base risk service

  constructor(
    baseRiskService: any,
    enhancedRiskService: any,
    configPath: string = path.join(process.cwd(), 'config', 'risk-config.json'),
    totalPortfolioValue: number = 100000 // Default $100k if not provided
  ) {
    this.configPath = configPath;
    this.totalPortfolioValue = totalPortfolioValue;
    this.baseRiskService = baseRiskService;
    this.enhancedRiskService = enhancedRiskService;
    this.loadRiskConfig();
    
    // Reset trade count at the beginning of each day
    this.setupDailyReset();
    
    logger.info('Risk Manager Module initialized with portfolio value: $' + totalPortfolioValue);
  }

  /**
   * Load risk configuration from JSON file
   */
  private loadRiskConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        this.riskConfig = JSON.parse(configData);
        logger.info('Risk configuration loaded successfully');
      } else {
        // Use default risk parameters if config file doesn't exist
        this.riskConfig = {
          maxPositionSizePercent: 5, // Max 5% of capital per position
          stopLossPercent: 15, // 15% stop loss
          trailingStopActivation: 20, // Activate trailing stop at 20% profit
          maxDrawdownPercent: 25, // Maximum drawdown before halting trading
          maxDailyTrades: 10, // Maximum number of trades per day
          maxExposurePercent: 30, // Maximum portfolio exposure to meme coins
          minVolumeDollars: 50000, // Minimum 24h volume requirement
          blacklistedPatterns: ["rugpull_pattern", "honeypot_pattern"],
          volatilityThreshold: 200, // 200% max volatility threshold
          liquidityThresholdDollars: 20000 // Minimum liquidity requirement
        };
        
        // Create config directory if it doesn't exist
        const configDir = path.dirname(this.configPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        
        // Save default config to file
        fs.writeFileSync(
          this.configPath,
          JSON.stringify(this.riskConfig, null, 2)
        );
        logger.info('Default risk configuration created and saved');
      }
    } catch (error) {
      logger.error(`Failed to load risk configuration: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to load risk configuration');
    }
  }

  /**
   * Set up daily reset for trade count
   */
  private setupDailyReset(): void {
    // Check if we need to reset the daily trade count
    const currentDate = new Date();
    if (currentDate.getDate() !== this.lastResetDate.getDate() ||
        currentDate.getMonth() !== this.lastResetDate.getMonth() ||
        currentDate.getFullYear() !== this.lastResetDate.getFullYear()) {
      this.dailyTradeCount = 0;
      this.lastResetDate = currentDate;
      logger.info('Daily trade count reset to 0');
    }
    
    // Schedule the next reset for midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilReset = tomorrow.getTime() - currentDate.getTime();
    
    setTimeout(() => {
      this.dailyTradeCount = 0;
      this.lastResetDate = new Date();
      logger.info('Daily trade count reset to 0');
      this.setupDailyReset(); // Setup next day's reset
    }, timeUntilReset);
  }

  /**
   * Evaluate edge calculation through risk management
   * This is the main entry point that serves as the bridge between edge calculation and execution
   */
  async evaluateEdgeWithRiskManagement(
    edgeCalculationId: string,
    manipulationData?: {
      detected: boolean;
      type?: string;
      confidence?: number;
    }
  ): Promise<ITrade | null> {
    try {
      // First, get the edge calculation using the base risk service
      const edge = await this.baseRiskService.getEdgeCalculationById(edgeCalculationId);
      
      if (!edge) {
        logger.warn(`Edge calculation ${edgeCalculationId} not found`);
        return null;
      }
      
      // Check if daily trade count exceeds maximum
      if (this.dailyTradeCount >= this.riskConfig.maxDailyTrades) {
        logger.warn(`Maximum daily trade limit reached (${this.riskConfig.maxDailyTrades})`);
        
        // Create a cancelled trade record
        return await this.createCancelledTrade(
          edge, 
          "Maximum daily trade limit reached"
        );
      }
      
      // If manipulation was detected with high confidence, reject the trade
      if (manipulationData && manipulationData.detected && manipulationData.confidence && manipulationData.confidence > 75) {
        logger.warn(`High confidence manipulation detected (${manipulationData.confidence}%), cancelling trade`);
        
        return await this.createCancelledTrade(
          edge,
          `High confidence manipulation detected: ${manipulationData.type || 'unknown'} (${manipulationData.confidence}%)`
        );
      }
      
      // Get trading metrics for the token (volume, liquidity, volatility)
      const tradingMetrics = await this.getTokenTradingMetrics(edge.tokenAddress, edge.network);
      
      // Check risk criteria
      const riskCheckResult = this.checkRiskCriteria(
        edge.symbol,
        edge.confidenceScore,
        tradingMetrics.volume24h,
        tradingMetrics.liquidity,
        tradingMetrics.volatility,
        edge.patternName
      );
      
      if (!riskCheckResult.approved) {
        logger.warn(`Risk check failed for ${edge.symbol}: ${riskCheckResult.reason}`);
        
        // Create a cancelled trade record
        return await this.createCancelledTrade(
          edge, 
          riskCheckResult.reason || "Failed risk criteria check"
        );
      }
      
      // Apply manipulation adjustment to edge score if detected
      let adjustedEdgeScore = edge.confidenceScore;
      if (manipulationData && manipulationData.detected && manipulationData.confidence) {
        // Reduce edge score based on manipulation confidence
        const manipulationPenalty = manipulationData.confidence * 0.3;
        adjustedEdgeScore = Math.max(0, edge.confidenceScore - manipulationPenalty);
        logger.info(`Adjusted edge score for ${edge.symbol} from ${edge.confidenceScore.toFixed(1)}% to ${adjustedEdgeScore.toFixed(1)}% due to manipulation risk`);
      }
      
      // If edge score is too low after adjustment, cancel the trade
      if (adjustedEdgeScore < 50) {
        logger.warn(`Adjusted edge score too low for ${edge.symbol}: ${adjustedEdgeScore.toFixed(1)}%`);
        
        return await this.createCancelledTrade(
          edge,
          `Insufficient edge score after risk adjustments: ${adjustedEdgeScore.toFixed(1)}%`
        );
      }
      
      // If we pass all risk checks, calculate position size using enhanced risk service if available
      // or fall back to base calculation
      let positionSizingResult: PositionSizingResult;
      
      if (this.enhancedRiskService && typeof this.enhancedRiskService.calculateEnhancedPositionSize === 'function') {
        // Use the enhanced risk service for position sizing
        // Pass manipulation data if available for further adjustment
        const enhancedResult = await this.enhancedRiskService.calculateEnhancedPositionSize(
          edge, 
          manipulationData ? {
            manipulationDetected: manipulationData.detected,
            manipulationConfidence: manipulationData.confidence || 0,
            manipulationType: manipulationData.type || 'unknown'
          } : null
        );
        
        positionSizingResult = {
          positionSize: enhancedResult.positionSize,
          positionSizeUSD: enhancedResult.positionSizeUSD,
          stopLossLevel: enhancedResult.stopLossPrice,
          maxLoss: enhancedResult.riskAmount,
          trailingStopLevel: edge.currentPrice * (1 + (this.riskConfig.trailingStopActivation / 100)),
          riskRewardRatio: enhancedResult.riskRewardRatio,
          entryConfidence: this.getConfidenceLevel(adjustedEdgeScore),
          strategy: PositionSizeStrategy.VOLATILITY_ADJUSTED,
          justification: enhancedResult.justification
        };
      } else {
        // Fall back to base calculation
        positionSizingResult = await this.calculatePositionSize(
          edge,
          this.totalPortfolioValue,
          tradingMetrics.volatility,
          adjustedEdgeScore
        );
      }
      
      // If position size is too small, cancel the trade
      if (positionSizingResult.positionSizeUSD < 10) {
        logger.warn(`Position size too small for ${edge.symbol}: $${positionSizingResult.positionSizeUSD.toFixed(2)}`);
        
        return await this.createCancelledTrade(
          edge, 
          `Position size too small: $${positionSizingResult.positionSizeUSD.toFixed(2)}`
        );
      }
      
      // Create the trade
      const trade = await this.createTrade(edge, positionSizingResult);
      
      // Record trade for daily count
      this.recordTrade(positionSizingResult.positionSizeUSD);
      
      return trade;
    } catch (error) {
      logger.error(`Error in risk management evaluation: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Check if a trade meets all risk criteria
   */
  private checkRiskCriteria(
    token: string,
    edgeScore: number,
    volume24h: number,
    liquidity: number,
    volatility: number,
    patternName?: string
  ): RiskCheckResult {
    // Default risk result
    const result: RiskCheckResult = {
      approved: true,
      riskScore: 0
    };
    
    // Check if we've hit the maximum daily trades limit
    if (this.dailyTradeCount >= this.riskConfig.maxDailyTrades) {
      result.approved = false;
      result.reason = 'Maximum daily trade limit reached';
      logger.warn(`Risk check failed for ${token}: ${result.reason}`);
      return result;
    }
    
    // Check current portfolio exposure
    const currentExposurePercent = (this.currentExposure / this.totalPortfolioValue) * 100;
    if (currentExposurePercent >= this.riskConfig.maxExposurePercent) {
      result.approved = false;
      result.reason = `Maximum portfolio exposure reached (${currentExposurePercent.toFixed(2)}%)`;
      logger.warn(`Risk check failed for ${token}: ${result.reason}`);
      return result;
    }
    
    // Check trading volume
    if (volume24h < this.riskConfig.minVolumeDollars) {
      result.approved = false;
      result.reason = `Insufficient 24h volume: $${volume24h.toFixed(2)} (min: $${this.riskConfig.minVolumeDollars})`;
      logger.warn(`Risk check failed for ${token}: ${result.reason}`);
      return result;
    }
    
    // Check liquidity
    if (liquidity < this.riskConfig.liquidityThresholdDollars) {
      result.approved = false;
      result.reason = `Insufficient liquidity: $${liquidity.toFixed(2)} (min: $${this.riskConfig.liquidityThresholdDollars})`;
      logger.warn(`Risk check failed for ${token}: ${result.reason}`);
      return result;
    }
    
    // Check volatility
    if (volatility > this.riskConfig.volatilityThreshold) {
      result.approved = false;
      result.reason = `Excessive volatility: ${volatility.toFixed(2)}% (max: ${this.riskConfig.volatilityThreshold}%)`;
      logger.warn(`Risk check failed for ${token}: ${result.reason}`);
      return result;
    }
    
    // Check blacklisted patterns
    if (patternName && this.riskConfig.blacklistedPatterns.includes(patternName)) {
      result.approved = false;
      result.reason = `Blacklisted pattern detected: ${patternName}`;
      logger.warn(`Risk check failed for ${token}: ${result.reason}`);
      return result;
    }
    
    // Calculate risk score (0-100, where 0 is lowest risk)
    const volumeRisk = Math.max(0, 1 - (volume24h / (this.riskConfig.minVolumeDollars * 3)));
    const liquidityRisk = Math.max(0, 1 - (liquidity / (this.riskConfig.liquidityThresholdDollars * 3)));
    const volatilityRisk = Math.min(1, volatility / this.riskConfig.volatilityThreshold);
    
    result.riskScore = Math.round((volumeRisk * 0.3 + liquidityRisk * 0.3 + volatilityRisk * 0.4) * 100);
    
    // Adjust edge score based on risk score
    result.adjustedEdgeScore = Math.max(0, edgeScore - result.riskScore * 0.5);
    
    logger.info(`Risk check passed for ${token} with risk score: ${result.riskScore}, adjusted edge: ${result.adjustedEdgeScore}`);
    
    return result;
  }

  /**
   * Calculate position size for a given edge calculation
   */
  private async calculatePositionSize(
    edge: IEdgeCalculation,
    capitalBase: number,
    volatility: number,
    adjustedEdgeScore?: number
  ): Promise<PositionSizingResult> {
    // Get token price for calculations
    const currentPrice = edge.currentPrice;
    
    // Use adjusted edge score if provided
    const confidenceScore = adjustedEdgeScore || edge.confidenceScore;
    
    // Base position size calculation (Kelly criterion)
    const winRate = edge.primaryTarget.probability;
    const potentialGain = (edge.primaryTarget.price - currentPrice) / currentPrice;
    const potentialLoss = (currentPrice - edge.stopLoss) / currentPrice;
    
    // Kelly formula: f* = (p*b - q)/b where p = probability of win, q = probability of loss, b = odds
    const odds = potentialGain / potentialLoss;
    let kellyFraction = (winRate * odds - (1 - winRate)) / odds;
    
    // Apply half-Kelly for safety
    kellyFraction = Math.max(0, kellyFraction) / 2;
    
    // Apply maximum position size constraint
    const maxPositionPercent = this.riskConfig.maxPositionSizePercent / 100;
    const positionPercent = Math.min(kellyFraction, maxPositionPercent);
    
    // Calculate base position size
    let positionSizeUSD = capitalBase * positionPercent;
    
    // Apply volatility adjustment if volatility data is available
    let volatilityAdjustment = 1.0;
    if (volatility > 0) {
      // Higher volatility = smaller position size
      // We use a simple inverse relationship: lower = 1.0, higher = reduction
      const normalizedVolatility = volatility / this.riskConfig.volatilityThreshold;
      volatilityAdjustment = 1.0 - (normalizedVolatility * 0.7); // Max 70% reduction
      volatilityAdjustment = Math.max(0.3, volatilityAdjustment); // Minimum 30% of original size
      
      // Apply adjustment to position size
      positionSizeUSD *= volatilityAdjustment;
    }
    
    // Apply edge score adjustment - reduce position size for lower edge scores
    const edgeAdjustment = confidenceScore / 100;
    positionSizeUSD *= edgeAdjustment;
    
    // Calculate stop loss level
    const stopLossLevel = edge.stopLoss || currentPrice * (1 - (this.riskConfig.stopLossPercent / 100));
    
    // Calculate max loss in dollars
    const maxLoss = positionSizeUSD * (currentPrice - stopLossLevel) / currentPrice;
    
    // Calculate trailing stop level if applicable
    const trailingStopLevel = this.riskConfig.trailingStopActivation > 0 
      ? currentPrice * (1 + (this.riskConfig.trailingStopActivation / 100))
      : null;
    
    // Calculate risk/reward ratio
    const riskRewardRatio = potentialGain / potentialLoss;
    
    // Determine strategy and build justification
    let strategy = PositionSizeStrategy.KELLY_CRITERION;
    let justification = `Half-Kelly position sizing: ${(kellyFraction * 100).toFixed(2)}% of capital`;
    
    if (volatilityAdjustment < 1.0) {
      strategy = PositionSizeStrategy.VOLATILITY_ADJUSTED;
      justification = `${justification} with ${(volatilityAdjustment * 100).toFixed(1)}% volatility adjustment (${volatility.toFixed(1)}% vs ${this.riskConfig.volatilityThreshold}% max)`;
    }
    
    if (adjustedEdgeScore !== undefined && adjustedEdgeScore < edge.confidenceScore) {
      justification = `${justification} and edge score adjustment from ${edge.confidenceScore.toFixed(1)}% to ${adjustedEdgeScore.toFixed(1)}%`;
    }
    
    // Determine entry confidence level based on edge score
    let entryConfidence: 'LOW' | 'MEDIUM' | 'HIGH' = this.getConfidenceLevel(confidenceScore);
    
    // Calculate absolute position size in token units
    const positionSize = positionSizeUSD / currentPrice;
    
    return {
      positionSize,
      positionSizeUSD,
      stopLossLevel,
      maxLoss,
      trailingStopLevel,
      riskRewardRatio,
      entryConfidence,
      strategy,
      justification
    };
  }

  /**
   * Get token trading metrics including volume, liquidity, and volatility
   */
  private async getTokenTradingMetrics(
    tokenAddress: string,
    network: string
  ): Promise<{
    volume24h: number;
    liquidity: number;
    volatility: number;
  }> {
    try {
      // In a real implementation, this would fetch data from APIs
      // For now, we'll return placeholder data for testing
      
      // Placeholder implementation - in production, fetch from market data service
      return {
        volume24h: 500000, // $500k volume
        liquidity: 100000,  // $100k liquidity
        volatility: 50      // 50% volatility
      };
    } catch (error) {
      logger.error(`Failed to get token metrics: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return conservative defaults that won't block trades but will assign higher risk
      return {
        volume24h: this.riskConfig.minVolumeDollars * 1.5,
        liquidity: this.riskConfig.liquidityThresholdDollars * 1.5,
        volatility: this.riskConfig.volatilityThreshold * 0.5
      };
    }
  }

  /**
   * Create a new trade record based on edge calculation and position sizing
   */
  private async createTrade(
    edge: IEdgeCalculation,
    positionSizing: PositionSizingResult
  ): Promise<ITrade> {
    try {
      // Create new trade object
      const trade = new Trade({
        edgeCalculationId: edge._id,
        tokenAddress: edge.tokenAddress,
        network: edge.network,
        symbol: edge.symbol,
        timestamp: new Date(),
        status: TradeStatus.PENDING,
        direction: edge.direction,
        entryPrice: edge.currentPrice,
        targetPrice: edge.primaryTarget.price,
        stopLossPrice: positionSizing.stopLossLevel,
        positionSize: positionSizing.positionSize,
        positionSizeUSD: positionSizing.positionSizeUSD,
        maxPositionSizeUSD: positionSizing.positionSizeUSD,
        confidence: edge.confidenceScore,
        riskAmount: positionSizing.maxLoss,
        positionSizeStrategy: positionSizing.strategy,
        sizeJustification: positionSizing.justification,
        riskPercentage: (positionSizing.maxLoss / this.totalPortfolioValue) * 100,
        maxDrawdownPercentage: this.riskConfig.maxDrawdownPercent,
        timeframeHours: edge.primaryTarget.timeframeHours,
        riskRewardRatio: positionSizing.riskRewardRatio,
        expectedValue: edge.expectedValue,
        portfolioWeightPercentage: (positionSizing.positionSizeUSD / this.totalPortfolioValue) * 100,
        correlatedPositions: [],
        totalExposure: (this.currentExposure / this.totalPortfolioValue) * 100,
        exposureLimit: this.riskConfig.maxExposurePercent,
        exposureBreakdown: {
          token: 0, // Would be calculated from portfolio data
          sector: 0,
          network: 0
        },
        notes: `Trade generated with ${edge.confidenceScore.toFixed(1)}% confidence. ${positionSizing.justification}`,
        tags: [edge.symbol, edge.network, positionSizing.strategy, positionSizing.entryConfidence]
      });
      
      // Save trade to database
      await trade.save();
      
      logger.info(`Created trade for ${edge.symbol} with position size $${positionSizing.positionSizeUSD.toFixed(2)}`);
      
      return trade;
    } catch (error) {
      logger.error(`Error creating trade: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Create a cancelled trade record when risk checks fail
   */
  private async createCancelledTrade(
    edge: IEdgeCalculation,
    reason: string
  ): Promise<ITrade> {
    try {
      // Create cancelled trade record
      const cancelledTrade = new Trade({
        edgeCalculationId: edge._id,
        tokenAddress: edge.tokenAddress,
        network: edge.network,
        symbol: edge.symbol,
        timestamp: new Date(),
        status: TradeStatus.CANCELLED,
        direction: edge.direction,
        entryPrice: edge.currentPrice,
        targetPrice: edge.primaryTarget.price,
        stopLossPrice: edge.stopLoss,
        positionSize: 0,
        positionSizeUSD: 0,
        maxPositionSizeUSD: 0,
        confidence: edge.confidenceScore,
        riskAmount: 0,
        positionSizeStrategy: PositionSizeStrategy.FIXED_AMOUNT,
        sizeJustification: `Trade cancelled: ${reason}`,
        riskPercentage: 0,
        maxDrawdownPercentage: this.riskConfig.maxDrawdownPercent,
        timeframeHours: edge.primaryTarget.timeframeHours,
        riskRewardRatio: edge.riskRewardRatio,
        expectedValue: 0,
        portfolioWeightPercentage: 0,
        correlatedPositions: [],
        totalExposure: (this.currentExposure / this.totalPortfolioValue) * 100,
        exposureLimit: this.riskConfig.maxExposurePercent,
        exposureBreakdown: {
          token: 0,
          sector: 0,
          network: 0
        },
        notes: `Trade automatically cancelled. Reason: ${reason}`,
        tags: [edge.symbol, edge.network, 'cancelled', reason.replace(/\s+/g, '_').toLowerCase()]
      });
      
      // Save cancelled trade to database
      await cancelledTrade.save();
      
      logger.info(`Created cancelled trade for ${edge.symbol}: ${reason}`);
      
      return cancelledTrade;
    } catch (error) {
      logger.error(`Error creating cancelled trade: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Record a new trade to track daily limits
   */
  public recordTrade(positionSize: number): void {
    this.dailyTradeCount++;
    this.currentExposure += positionSize;
    logger.info(`Trade recorded. Daily count: ${this.dailyTradeCount}, Current exposure: $${this.currentExposure.toFixed(2)}`);
  }

  /**
   * Record trade exit to update exposure
   */
  public recordTradeExit(positionValue: number): void {
    this.currentExposure = Math.max(0, this.currentExposure - positionValue);
    logger.info(`Trade exit recorded. Current exposure: $${this.currentExposure.toFixed(2)}`);
  }

  /**
   * Update risk parameters
   */
  public updateRiskParameters(params: Partial<RiskParameters>): void {
    this.riskConfig = { ...this.riskConfig, ...params };
    
    // Save updated config to file
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(this.riskConfig, null, 2)
    );
    
    logger.info('Risk parameters updated and saved');
  }

  /**
   * Get current risk parameters
   */
  public getRiskParameters(): RiskParameters {
    return { ...this.riskConfig };
  }

  /**
   * Helper method to convert numeric confidence score to confidence level
   */
  private getConfidenceLevel(confidenceScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (confidenceScore >= 75) {
      return 'HIGH';
    } else if (confidenceScore >= 50) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }
}

// Export singleton instance
let riskManagerModuleInstance: RiskManagerModule | null = null;

/**
 * Get or create the risk manager module instance
 */
export const getRiskManagerModule = (
  baseRiskService: any,
  enhancedRiskService: any,
  portfolioValue?: number
): RiskManagerModule => {
  if (!riskManagerModuleInstance) {
    riskManagerModuleInstance = new RiskManagerModule(
      baseRiskService,
      enhancedRiskService,
      config.riskManagement?.configPath,
      portfolioValue || config.riskManagement?.initialCapital
    );
  }
  return riskManagerModuleInstance;
};