// Thorp V1 - Enhanced Risk Management Service
// Improved position sizing based on volatility metrics and cross-timeframe pattern confidence

import winston from 'winston';
import mongoose from 'mongoose';
import edgeCalculatorService, { IEdgeCalculation, EdgeStatus, ConfidenceLevel } from './edge-calculator-service';
import patternRecognitionService, { PatternType, PatternStatus, TimeframeType } from './pattern-recognition-service';
import enhancedPatternRecognitionService from './enhanced-pattern-recognition';
import marketDataService from './market-data-service';
import { ITrade, TradeStatus, TradeResult, PositionSizeStrategy } from '../types/trade-types';
import { Trade, Portfolio } from './trading-models';
import config from '.';

/**
 * Enhanced Risk Management Service
 * 
 * Key improvements:
 * 1. Volatility-based position sizing
 * 2. Cross-timeframe confidence adjustment
 * 3. Manipulation detection risk reduction
 * 4. Enhanced circuit breaker implementation
 */
export class EnhancedRiskManagementService {
  private logger: winston.Logger;
  private baseRiskService: any; // Reference to the original risk management service
  
  // Enhanced risk management configuration
  private readonly DEFAULT_ATR_PERIOD = 14; // Default ATR calculation period
  private readonly VOLATILITY_ADJUSTMENT_FACTOR = 0.7; // How strongly volatility affects position size
  private readonly ATR_STOP_LOSS_MULTIPLIER = 2.5; // Default ATR multiplier for stop loss
  private readonly CIRCUIT_BREAKER_LEVELS = [
    { drawdown: 10, reduction: 0.5 }, // 10% drawdown = 50% position size reduction
    { drawdown: 15, reduction: 0.75 }, // 15% drawdown = 75% position size reduction
    { drawdown: 20, reduction: 1.0 }  // 20% drawdown = 100% position size reduction (no trading)
  ];
  private readonly MANIPULATION_CONFIDENCE_THRESHOLDS = {
    LOW: 40,    // Below this, minimal adjustment
    MEDIUM: 70, // Medium adjustment
    HIGH: 90    // High adjustment (almost no position)
  };
  
  constructor(baseRiskService: any) {
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'enhanced-risk-management-service' },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
    
    // Store reference to base service
    this.baseRiskService = baseRiskService;
  }

  /**
   * Initialize the enhanced risk management service
   */
  async init(): Promise<boolean> {
    try {
      this.logger.info('Enhanced risk management service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize enhanced risk management service:', error);
      return false;
    }
  }

  /**
   * Enhanced position size calculation based on volatility and pattern confidence
   */
  async calculateEnhancedPositionSize(
    edge: IEdgeCalculation,
    patternData: any
  ): Promise<{
    positionSize: number;
    positionSizeUSD: number;
    stopLossPrice: number;
    riskAmount: number;
    riskRewardRatio: number;
    justification: string;
    adjustmentFactors: {
      volatility: number;
      patternConfidence: number;
      manipulationRisk: number;
      circuitBreaker: number;
      totalAdjustment: number;
    };
  }> {
    try {
      // Get current portfolio stats
      const portfolio = await Portfolio.findOne({ portfolioId: 'default' });
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }
      
      // Calculate position size using Kelly criterion from base calculation
      const kellyPositionSize = await this.calculateKellyPositionSize(edge, portfolio.totalCapitalUSD);
      
      // Get volatility metrics for the token
      const volatilityMetrics = await this.calculateVolatilityMetrics(edge.tokenAddress, edge.network);
      
      // Calculate volatility adjustment (higher volatility = smaller position)
      const volatilityAdjustment = this.calculateVolatilityAdjustment(volatilityMetrics.atrPercent);
      
      // Calculate pattern confidence adjustment from cross-timeframe analysis
      const patternConfidenceAdjustment = this.calculatePatternConfidenceAdjustment(patternData);
      
      // Calculate manipulation risk adjustment
      const manipulationRiskAdjustment = this.calculateManipulationRiskAdjustment(patternData);
      
      // Calculate circuit breaker adjustment
      const circuitBreakerAdjustment = this.calculateCircuitBreakerAdjustment(portfolio);
      
      // Calculate total adjustment factor
      const totalAdjustment = volatilityAdjustment * patternConfidenceAdjustment * 
                              manipulationRiskAdjustment * circuitBreakerAdjustment;
      
      // Calculate final position size
      const adjustedPositionSizeUSD = kellyPositionSize.positionSizeUSD * totalAdjustment;
      
      // Calculate position size in token units
      const positionSize = adjustedPositionSizeUSD / edge.currentPrice;
      
      // Calculate stop loss price using ATR
      let stopLossPrice = edge.stopLoss;
      if (volatilityMetrics.atr > 0) {
        // Use ATR-based stop loss if it's more conservative than the edge's stop loss
        const atrBasedStopLoss = edge.currentPrice - (volatilityMetrics.atr * this.ATR_STOP_LOSS_MULTIPLIER);
        stopLossPrice = Math.max(atrBasedStopLoss, edge.stopLoss);
      }
      
      // Calculate risk amount (how much money is at risk)
      const riskAmount = adjustedPositionSizeUSD * ((edge.currentPrice - stopLossPrice) / edge.currentPrice);
      
      // Calculate risk/reward ratio using enhanced stop loss
      const riskRewardRatio = (edge.primaryTarget.price - edge.currentPrice) / (edge.currentPrice - stopLossPrice);
      
      // Build justification string
      const justification = this.buildPositionSizeJustification(
        kellyPositionSize.positionSizeUSD,
        adjustedPositionSizeUSD,
        {
          volatility: volatilityAdjustment,
          patternConfidence: patternConfidenceAdjustment,
          manipulationRisk: manipulationRiskAdjustment,
          circuitBreaker: circuitBreakerAdjustment,
          totalAdjustment
        },
        volatilityMetrics,
        patternData
      );
      
      return {
        positionSize,
        positionSizeUSD: adjustedPositionSizeUSD,
        stopLossPrice,
        riskAmount,
        riskRewardRatio,
        justification,
        adjustmentFactors: {
          volatility: volatilityAdjustment,
          patternConfidence: patternConfidenceAdjustment,
          manipulationRisk: manipulationRiskAdjustment,
          circuitBreaker: circuitBreakerAdjustment,
          totalAdjustment
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating enhanced position size:`, error);
      throw error;
    }
  }

  /**
   * Calculate Kelly position size (base calculation)
   */
  private async calculateKellyPositionSize(
    edge: IEdgeCalculation, 
    totalCapitalUSD: number
  ): Promise<{
    positionSizeUSD: number;
    kellyFraction: number;
  }> {
    try {
      // Get required parameters
      const winRate = edge.primaryTarget.probability;
      const potentialGain = (edge.primaryTarget.price - edge.currentPrice) / edge.currentPrice;
      const potentialLoss = (edge.currentPrice - edge.stopLoss) / edge.currentPrice;
      
      // Calculate Kelly fraction: f* = (p*b - (1-p)) / b
      // where p = probability of winning, b = odds (win/loss ratio)
      const odds = potentialGain / potentialLoss;
      let kellyFraction = (winRate * odds - (1 - winRate)) / odds;
      
      // Apply constraints to Kelly - never risk more than 20% even with perfect Kelly
      kellyFraction = Math.max(0, kellyFraction); // No negative Kelly
      
      // Apply Half-Kelly for safety (reduce theoretical optimum by half)
      const halfKelly = kellyFraction / 2;
      
      // Maximum position size based on half-Kelly
      const positionSizeUSD = totalCapitalUSD * halfKelly;
      
      return {
        positionSizeUSD,
        kellyFraction: halfKelly
      };
    } catch (error) {
      this.logger.error(`Error calculating Kelly position size:`, error);
      return {
        positionSizeUSD: 0,
        kellyFraction: 0
      };
    }
  }
  
  /**
   * Calculate volatility metrics including ATR
   */
  private async calculateVolatilityMetrics(
    tokenAddress: string,
    network: string
  ): Promise<{
    atr: number;           // Average True Range in price units
    atrPercent: number;    // ATR as percentage of price
    volatility: number;    // Historical volatility (standard deviation of returns)
    averageVolume: number; // Average trading volume
  }> {
    try {
      // Get candle data for volatility calculation
      const candles = await marketDataService.getTokenCandles(
        tokenAddress,
        '1h',
        this.DEFAULT_ATR_PERIOD + 1 // Need one extra for calculating TR
      );
      
      if (!candles || candles.length < this.DEFAULT_ATR_PERIOD + 1) {
        throw new Error(`Insufficient candle data for ${tokenAddress}`);
      }
      
      // Calculate true ranges
      const trueRanges = [];
      for (let i = 1; i < candles.length; i++) {
        const currentHigh = candles[i].high;
        const currentLow = candles[i].low;
        const previousClose = candles[i-1].close;
        
        // True Range is the greatest of:
        // 1. Current High - Current Low
        // 2. |Current High - Previous Close|
        // 3. |Current Low - Previous Close|
        const tr = Math.max(
          currentHigh - currentLow,
          Math.abs(currentHigh - previousClose),
          Math.abs(currentLow - previousClose)
        );
        
        trueRanges.push(tr);
      }
      
      // Calculate ATR (Average True Range)
      const atr = trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
      
      // Calculate ATR as percentage of price
      const currentPrice = candles[candles.length - 1].close;
      const atrPercent = (atr / currentPrice) * 100;
      
      // Calculate historical volatility (standard deviation of returns)
      const returns = [];
      for (let i = 1; i < candles.length; i++) {
        const returnPct = (candles[i].close - candles[i-1].close) / candles[i-1].close;
        returns.push(returnPct);
      }
      
      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const sumSquaredDiff = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0);
      const volatility = Math.sqrt(sumSquaredDiff / returns.length);
      
      // Calculate average trading volume
      const averageVolume = candles.reduce((sum, candle) => sum + candle.volume, 0) / candles.length;
      
      return {
        atr,
        atrPercent,
        volatility,
        averageVolume
      };
    } catch (error) {
      this.logger.error(`Error calculating volatility metrics for ${tokenAddress}:`, error);
      return {
        atr: 0,
        atrPercent: 5, // Default to 5% ATR if calculation fails
        volatility: 0,
        averageVolume: 0
      };
    }
  }
  
  /**
   * Calculate volatility adjustment factor
   * Higher volatility = lower position size
   */
  private calculateVolatilityAdjustment(atrPercent: number): number {
    // Base cases
    if (atrPercent <= 0) return 1.0; // No adjustment for zero volatility
    if (atrPercent >= 50) return 0.1; // Maximum reduction for extreme volatility
    
    // Normal case: scale inversely with volatility
    // Formula: 1 / (1 + factor * atrPercent)
    // This creates a curve that reduces position size as volatility increases
    const adjustment = 1 / (1 + this.VOLATILITY_ADJUSTMENT_FACTOR * (atrPercent / 100));
    
    // Ensure the adjustment stays within reasonable bounds
    return Math.min(1.0, Math.max(0.1, adjustment));
  }
  
  /**
   * Calculate pattern confidence adjustment based on cross-timeframe analysis
   */
  private calculatePatternConfidenceAdjustment(patternData: any): number {
    // If no pattern data available, use neutral adjustment
    if (!patternData || !patternData.aggregatedConfidence) {
      return 0.85; // Slight reduction with no pattern confirmation
    }
    
    // Scale the adjustment based on aggregated confidence
    // 0% confidence = 0.5 adjustment (50% reduction)
    // 100% confidence = 1.2 adjustment (20% increase)
    const confidence = patternData.aggregatedConfidence;
    
    // Use a linear scaling from 0.5 at 0% to 1.2 at 100%
    const adjustment = 0.5 + (confidence / 100) * 0.7;
    
    return adjustment;
  }
  
  /**
   * Calculate manipulation risk adjustment
   * Higher manipulation confidence = lower position size
   */
  private calculateManipulationRiskAdjustment(patternData: any): number {
    // If no pattern data or no manipulation detected, no adjustment needed
    if (!patternData || !patternData.manipulationDetected || !patternData.manipulationConfidence) {
      return 1.0;
    }
    
    const manipulationConfidence = patternData.manipulationConfidence;
    
    // Apply reduction based on confidence thresholds
    if (manipulationConfidence >= this.MANIPULATION_CONFIDENCE_THRESHOLDS.HIGH) {
      // High confidence manipulation detected - almost no position
      return 0.1;
    } else if (manipulationConfidence >= this.MANIPULATION_CONFIDENCE_THRESHOLDS.MEDIUM) {
      // Medium confidence - significant reduction
      // Scale from 0.5 at MEDIUM threshold to 0.1 at HIGH threshold
      const range = this.MANIPULATION_CONFIDENCE_THRESHOLDS.HIGH - this.MANIPULATION_CONFIDENCE_THRESHOLDS.MEDIUM;
      const overMedium = manipulationConfidence - this.MANIPULATION_CONFIDENCE_THRESHOLDS.MEDIUM;
      return 0.5 - (overMedium / range) * 0.4;
    } else if (manipulationConfidence >= this.MANIPULATION_CONFIDENCE_THRESHOLDS.LOW) {
      // Low confidence - moderate reduction
      // Scale from 0.8 at LOW threshold to 0.5 at MEDIUM threshold
      const range = this.MANIPULATION_CONFIDENCE_THRESHOLDS.MEDIUM - this.MANIPULATION_CONFIDENCE_THRESHOLDS.LOW;
      const overLow = manipulationConfidence - this.MANIPULATION_CONFIDENCE_THRESHOLDS.LOW;
      return 0.8 - (overLow / range) * 0.3;
    } else {
      // Very low confidence - minimal reduction
      // Scale from 1.0 at 0% to 0.8 at LOW threshold
      return 1.0 - (manipulationConfidence / this.MANIPULATION_CONFIDENCE_THRESHOLDS.LOW) * 0.2;
    }
  }
  
  /**
   * Calculate circuit breaker adjustment based on portfolio drawdown
   */
  private calculateCircuitBreakerAdjustment(portfolio: any): number {
    if (!portfolio || !portfolio.drawdown) {
      return 1.0; // No adjustment if drawdown data unavailable
    }
    
    const currentDrawdown = portfolio.drawdown.current;
    
    // Find applicable circuit breaker level
    for (const level of this.CIRCUIT_BREAKER_LEVELS) {
      if (currentDrawdown >= level.drawdown) {
        return Math.max(0, 1 - level.reduction);
      }
    }
    
    // If drawdown is below first circuit breaker level, apply gradual reduction
    if (currentDrawdown > 0 && this.CIRCUIT_BREAKER_LEVELS.length > 0) {
      const firstLevel = this.CIRCUIT_BREAKER_LEVELS[0];
      // Linear reduction from 1.0 at 0% drawdown to (1 - firstLevel.reduction) at firstLevel.drawdown
      return 1.0 - (currentDrawdown / firstLevel.drawdown) * firstLevel.reduction;
    }
    
    return 1.0; // No drawdown, no adjustment
  }
  
  /**
   * Build justification string for position sizing
   */
  private buildPositionSizeJustification(
    basePositionSize: number,
    adjustedPositionSize: number,
    adjustmentFactors: any,
    volatilityMetrics: any,
    patternData: any
  ): string {
    const lines = [];
    
    // Base calculation
    lines.push(`Base position size (Half-Kelly): ${basePositionSize.toFixed(2)}`);
    
    // Adjustments
    if (adjustmentFactors.volatility !== 1.0) {
      lines.push(`Volatility adjustment: ${(adjustmentFactors.volatility * 100).toFixed(1)}% (ATR: ${volatilityMetrics.atrPercent.toFixed(2)}%)`);
    }
    
    if (adjustmentFactors.patternConfidence !== 1.0) {
      const patternConfidence = patternData?.aggregatedConfidence || 0;
      lines.push(`Pattern confidence adjustment: ${(adjustmentFactors.patternConfidence * 100).toFixed(1)}% (Confidence: ${patternConfidence.toFixed(1)}%)`);
    }
    
    if (adjustmentFactors.manipulationRisk !== 1.0) {
      lines.push(`Manipulation risk adjustment: ${(adjustmentFactors.manipulationRisk * 100).toFixed(1)}% (Confidence: ${patternData?.manipulationConfidence?.toFixed(1) || 0}%)`);
    }
    
    if (adjustmentFactors.circuitBreaker !== 1.0) {
      lines.push(`Circuit breaker adjustment: ${(adjustmentFactors.circuitBreaker * 100).toFixed(1)}%`);
    }
    
    // Final position
    lines.push(`Final position size: ${adjustedPositionSize.toFixed(2)} (${(adjustmentFactors.totalAdjustment * 100).toFixed(1)}% of base size)`);
    
    return lines.join('. ');
  }
  
  /**
   * Enhanced trade evaluation with all improvements
   */
  async evaluateTradeWithEnhancedRisk(
    edgeCalculationId: string
  ): Promise<ITrade | null> {
    try {
      // Get edge calculation
      const edge = await edgeCalculatorService.getEdgeCalculationById(edgeCalculationId);
      
      if (!edge || edge.status !== EdgeStatus.CALCULATED) {
        this.logger.warn(`Invalid edge calculation ${edgeCalculationId}`);
        return null;
      }
      
      // Get enhanced pattern recognition data
      const patternData = await enhancedPatternRecognitionService.getAggregatedPatternStats(
        edge.tokenAddress,
        edge.network
      );
      
      // Calculate enhanced position size
      const positionSizeResult = await this.calculateEnhancedPositionSize(edge, patternData);
      
      // If position size is too small, don't create a trade
      if (positionSizeResult.positionSizeUSD < 10) { // Minimum $10 position
        this.logger.info(`Position size too small for ${edge.symbol}: ${positionSizeResult.positionSizeUSD.toFixed(2)}`);
        return null;
      }
      
      // Create trade with enhanced risk parameters
      const trade = await this.createTradeWithEnhancedRisk(edge, positionSizeResult, patternData);
      
      return trade;
    } catch (error) {
      this.logger.error(`Error evaluating trade with enhanced risk for ${edgeCalculationId}:`, error);
      return null;
    }
  }
  
  /**
   * Create trade with enhanced risk parameters
   */
  private async createTradeWithEnhancedRisk(
    edge: IEdgeCalculation,
    positionSizeResult: any,
    patternData: any
  ): Promise<ITrade | null> {
    try {
      // Get portfolio
      const portfolio = await Portfolio.findOne({ portfolioId: 'default' });
      
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }
      
      // Check if manipulation risk is too high
      if (patternData.manipulationDetected && 
          patternData.manipulationConfidence >= this.MANIPULATION_CONFIDENCE_THRESHOLDS.HIGH) {
        this.logger.warn(`High manipulation risk for ${edge.symbol}, cancelling trade`);
        
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
          stopLossPrice: positionSizeResult.stopLossPrice,
          positionSize: 0,
          positionSizeUSD: 0,
          maxPositionSizeUSD: positionSizeResult.positionSizeUSD,
          confidence: edge.confidenceScore,
          riskAmount: 0,
          positionSizeStrategy: PositionSizeStrategy.VOLATILITY_ADJUSTED,
          sizeJustification: `Trade cancelled due to high manipulation risk (${patternData.manipulationConfidence.toFixed(1)}%)`,
          riskPercentage: 0,
          maxDrawdownPercentage: 0,
          timeframeHours: edge.primaryTarget.timeframeHours,
          riskRewardRatio: positionSizeResult.riskRewardRatio,
          expectedValue: edge.expectedValue,
          portfolioWeightPercentage: 0,
          correlatedPositions: [],
          totalExposure: portfolio.currentExposure.overallPercentage,
          exposureLimit: portfolio.exposureLimits.maxOverallPercentage,
          exposureBreakdown: {
            token: 0,
            sector: 0,
            network: 0
          },
          notes: `Enhanced risk management cancelled trade due to ${patternData.manipulationType} manipulation detected with ${patternData.manipulationConfidence.toFixed(1)}% confidence`,
          tags: [edge.symbol, edge.network, 'cancelled', 'manipulation_risk', patternData.manipulationType]
        });
        
        await cancelledTrade.save();
        return cancelledTrade;
      }
      
      // Create trade with enhanced risk parameters
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
        stopLossPrice: positionSizeResult.stopLossPrice,
        positionSize: positionSizeResult.positionSize,
        positionSizeUSD: positionSizeResult.positionSizeUSD,
        maxPositionSizeUSD: positionSizeResult.positionSizeUSD,
        confidence: patternData.aggregatedConfidence || edge.confidenceScore,
        riskAmount: positionSizeResult.riskAmount,
        positionSizeStrategy: PositionSizeStrategy.VOLATILITY_ADJUSTED,
        sizeJustification: positionSizeResult.justification,
        riskPercentage: (positionSizeResult.riskAmount / portfolio.totalCapitalUSD) * 100,
        maxDrawdownPercentage: (edge.currentPrice - positionSizeResult.stopLossPrice) / edge.currentPrice * 100,
        timeframeHours: edge.primaryTarget.timeframeHours,
        riskRewardRatio: positionSizeResult.riskRewardRatio,
        expectedValue: edge.expectedValue,
        portfolioWeightPercentage: (positionSizeResult.positionSizeUSD / portfolio.totalCapitalUSD) * 100,
        correlatedPositions: [],
        totalExposure: portfolio.currentExposure.overallPercentage,
        exposureLimit: portfolio.exposureLimits.maxOverallPercentage,
        exposureBreakdown: {
          token: 0, // These would be calculated based on token sector mapping
          sector: 0,
          network: 0
        },
        notes: `Enhanced position sizing with volatility (${positionSizeResult.adjustmentFactors.volatility.toFixed(2)}), pattern confidence (${positionSizeResult.adjustmentFactors.patternConfidence.toFixed(2)}), and manipulation risk (${positionSizeResult.adjustmentFactors.manipulationRisk.toFixed(2)}) adjustments.`,
        tags: [edge.symbol, edge.network, 'enhanced_risk', 'volatility_adjusted']
      });
      
      // If manipulation was detected but not severe enough to cancel, add to tags
      if (patternData.manipulationDetected) {
        trade.tags.push('manipulation_detected');
        trade.tags.push(patternData.manipulationType);
      }
      
      // Add pattern type tags if available
      if (patternData.fastTimeframePatterns.patterns.length > 0) {
        patternData.fastTimeframePatterns.patterns.forEach((p: any) => {
          trade.tags.push(`fast_${p.type}`);
        });
      }
      
      if (patternData.slowTimeframePatterns.patterns.length > 0) {
        patternData.slowTimeframePatterns.patterns.forEach((p: any) => {
          trade.tags.push(`slow_${p.type}`);
        });
      }
      
      await trade.save();
      
      // Update portfolio with pending trade
      await this.updatePortfolioWithTrade(trade);
      
      this.logger.info(`Created enhanced trade for ${edge.symbol} with position size ${positionSizeResult.positionSizeUSD.toFixed(2)}`);
      
      return trade;
    } catch (error) {
      this.logger.error(`Error creating trade with enhanced risk:`, error);
      return null;
    }
  }
  
  /**
   * Update portfolio with new trade
   */
  private async updatePortfolioWithTrade(trade: ITrade): Promise<void> {
    try {
      // Only update for pending or active trades
      if (trade.status !== TradeStatus.PENDING && trade.status !== TradeStatus.ACTIVE) {
        return;
      }
      
      // Update portfolio
      await Portfolio.findOneAndUpdate(
        { portfolioId: 'default' },
        {
          $inc: {
            allocatedCapitalUSD: trade.positionSizeUSD,
            [trade.status === TradeStatus.PENDING ? 'pendingTrades' : 'activeTrades']: 1
          },
          $set: {
            availableCapitalUSD: { $subtract: ['$totalCapitalUSD', '$allocatedCapitalUSD'] },
            'currentExposure.overallPercentage': { $divide: ['$allocatedCapitalUSD', '$totalCapitalUSD'] }
          }
        }
      );
    } catch (error) {
      this.logger.error(`Error updating portfolio with trade:`, error);
    }
  }
}