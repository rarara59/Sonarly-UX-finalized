// Thorp V1 - Enhanced Pattern Recognition Service
// Implements improved manipulation detection and cross-timeframe correlation

import winston from 'winston';
import mongoose, { Document, Schema, Model   /**
   * Get aggregated pattern statistics across timeframes
   * @param tokenAddress Token address to get statistics for
   * @param network Network the token is on
   * @returns Aggregated pattern statistics
   */
  async getAggregatedPatternStats(
    tokenAddress: string,
    network: string
  ): Promise<{
    patternCount: number;
    manipulationDetected: boolean;
    manipulationType?: ManipulationType;
    manipulationConfidence?: number;
    fastTimeframePatterns: {
      count: number;
      patterns: {
        type: PatternType;
        confidence: number;
        status: PatternStatus;
        hasCorrelation: boolean;
      }[];
    };
    slowTimeframePatterns: {
      count: number;
      patterns: {
        type: PatternType;
        confidence: number;
        status: PatternStatus;
        hasCorrelation: boolean;
      }[];
    };
    correlations: {
      count: number;
      averageStrength: number;
      byType: Record<string, number>;
    };
    smartMoneyActivity: {
      active: boolean;
      netBuys: number;
      walletCount: number;
    };
    aggregatedConfidence: number;
  }> {
    try {
      // Get all patterns for the token
      const fastPatterns = await Pattern.find({
        tokenAddress,
        network,
        timeframe: TimeframeType.FAST,
        status: { $in: [PatternStatus.FORMING, PatternStatus.CONFIRMED] }
      });
      
      const slowPatterns = await Pattern.find({
        tokenAddress,
        network,
        timeframe: TimeframeType.SLOW,
        status: { $in: [PatternStatus.FORMING, PatternStatus.CONFIRMED] }
      });
      
      // Check for manipulation detection
      const manipulationInfo = {
        detected: false,
        type: ManipulationType.NONE,
        confidence: 0
      };
      
      // Check if any pattern has manipulation detection
      for (const pattern of [...fastPatterns, ...slowPatterns]) {
        if (pattern.manipulationDetection?.detected && 
            pattern.manipulationDetection.confidence > manipulationInfo.confidence) {
          manipulationInfo.detected = true;
          manipulationInfo.type = pattern.manipulationDetection.type;
          manipulationInfo.confidence = pattern.manipulationDetection.confidence;
        }
      }
      
      // Count correlations by type
      const correlationsByType: Record<string, number> = {
        'confirmation': 0,
        'divergence': 0,
        'continuation': 0,
        'none': 0
      };
      
      let totalCorrelationStrength = 0;
      let correlationCount = 0;
      
      // Process fast patterns for correlation data
      for (const pattern of fastPatterns) {
        if (pattern.crossTimeframeCorrelation?.correlatedPatternId) {
          correlationsByType[pattern.crossTimeframeCorrelation.correlationType]++;
          totalCorrelationStrength += pattern.crossTimeframeCorrelation.correlationStrength;
          correlationCount++;
        }
      }
      
      // Get smart money activity data
      const smartMoneyActivity = await smartMoneyService.getActivityForToken(tokenAddress, network);
      
      // Calculate aggregated confidence
      let aggregatedConfidence = 0;
      
      if (fastPatterns.length > 0 || slowPatterns.length > 0) {
        // Calculate base confidence from patterns
        const patternConfidenceSum = [
          ...fastPatterns.map(p => p.confidence),
          ...slowPatterns.map(p => p.confidence)
        ].reduce((sum, conf) => sum + conf, 0);
        
        const avgPatternConfidence = patternConfidenceSum / 
          (fastPatterns.length + slowPatterns.length);
        
        // Adjust based on correlations
        const correlationBonus = correlationCount > 0 ? 
          (totalCorrelationStrength / correlationCount) * 0.2 : 0;
        
        // Reduce confidence if manipulation detected
        const manipulationPenalty = manipulationInfo.detected ?
          manipulationInfo.confidence * 0.3 : 0;
        
        // Add smart money bonus if active
        const smartMoneyBonus = smartMoneyActivity?.active ? 10 : 0;
        
        // Calculate final confidence
        aggregatedConfidence = Math.min(100, Math.max(0, 
          avgPatternConfidence + correlationBonus - manipulationPenalty + smartMoneyBonus
        ));
      }
      
      return {
        patternCount: fastPatterns.length + slowPatterns.length,
        manipulationDetected: manipulationInfo.detected,
        manipulationType: manipulationInfo.type,
        manipulationConfidence: manipulationInfo.confidence > 0 ? manipulationInfo.confidence : undefined,
        fastTimeframePatterns: {
          count: fastPatterns.length,
          patterns: fastPatterns.map(p => ({
            type: p.patternType,
            confidence: p.confidence,
            status: p.status,
            hasCorrelation: !!p.crossTimeframeCorrelation?.correlatedPatternId
          }))
        },
        slowTimeframePatterns: {
          count: slowPatterns.length,
          patterns: slowPatterns.map(p => ({
            type: p.patternType,
            confidence: p.confidence,
            status: p.status,
            hasCorrelation: !!p.crossTimeframeCorrelation?.correlatedPatternId
          }))
        },
        correlations: {
          count: correlationCount,
          averageStrength: correlationCount > 0 ? 
            totalCorrelationStrength / correlationCount : 0,
          byType: correlationsByType
        },
        smartMoneyActivity: {
          active: smartMoneyActivity?.active || false,
          netBuys: smartMoneyActivity?.netBuys || 0,
          walletCount: smartMoneyActivity?.walletCount || 0
        },
        aggregatedConfidence: Math.round(aggregatedConfidence)
      };
    } catch (error) {
      this.logger.error(`Error getting aggregated pattern stats for ${tokenAddress}:`, error);
      return {
        patternCount: 0,
        manipulationDetected: false,
        fastTimeframePatterns: { count: 0, patterns: [] },
        slowTimeframePatterns: { count: 0, patterns: [] },
        correlations: { count: 0, averageStrength: 0, byType: {} },
        smartMoneyActivity: { active: false, netBuys: 0, walletCount: 0 },
        aggregatedConfidence: 0
      };
    }
  }
} from 'mongoose';
import * as ta from 'technicalindicators';
import marketDataService, { CandleData } from './market-data-service';
import externalWalletScraper from './external-wallet-scraper';
import smartMoneyService from './smart-money-detection'; // Import smart money service
import config from '../config';

// Keep existing enums and interfaces

// Add new manipulation detection types
export enum ManipulationType {
  PUMP_AND_DUMP = 'pumpAndDump',
  WASH_TRADING = 'washTrading',
  SPOOFING = 'spoofing',
  LIQUIDITY_MANIPULATION = 'liquidityManipulation',
  MOMENTUM_IGNITION = 'momentumIgnition',
  NONE = 'none'
}

// Add manipulation detection result interface
export interface ManipulationDetectionResult {
  detected: boolean;
  type: ManipulationType;
  confidence: number;
  indicators: Record<string, any>;
  description: string;
}

// Add cross-timeframe correlation result interface
export interface CrossTimeframeCorrelation {
  fastPatternId?: mongoose.Types.ObjectId;
  slowPatternId?: mongoose.Types.ObjectId;
  correlationType: 'confirmation' | 'divergence' | 'continuation' | 'none';
  correlationStrength: number; // 0-100
  combinedConfidence: number; // 0-100
  timeframeDelta: number; // Time difference between patterns in ms
}

// Enhance pattern schema with manipulation detection data
const patternSchema = new Schema<IPattern>({
  // Keep existing schema fields...

  // Add new fields for manipulation detection
  manipulationDetection: {
    detected: { type: Boolean, default: false },
    type: { 
      type: String, 
      enum: Object.values(ManipulationType),
      default: ManipulationType.NONE
    },
    confidence: { type: Number, default: 0 },
    indicators: { type: Schema.Types.Mixed },
    description: { type: String },
  },
  
  // Add new fields for cross-timeframe correlation
  crossTimeframeCorrelation: {
    correlatedPatternId: { type: Schema.Types.ObjectId, ref: 'Pattern' },
    correlationType: { 
      type: String, 
      enum: ['confirmation', 'divergence', 'continuation', 'none'],
      default: 'none'
    },
    correlationStrength: { type: Number, default: 0 },
    combinedConfidence: { type: Number, default: 0 },
    timeframeDelta: { type: Number },
  }
});

// Create model if it doesn't exist yet
const Pattern: Model<IPattern> = mongoose.models.Pattern as Model<IPattern> || 
  mongoose.model<IPattern>('Pattern', patternSchema);

/**
 * Enhanced Pattern Recognition Service
 * 
 * This service extends the base pattern recognition service with:
 * 1. Advanced manipulation detection algorithms
 * 2. Cross-timeframe pattern correlation
 * 3. Smart money validation
 * 
 * It is designed to improve accuracy and reduce false positives by correlating
 * patterns across timeframes and detecting potential market manipulation.
 */
class EnhancedPatternRecognitionService {
  private logger: winston.Logger;
  private basePatternService: any; // Reference to the original pattern service
  
  // Manipulation detection thresholds
  private readonly MANIPULATION_THRESHOLDS = {
    // Pump and dump detection
    PUMP_MIN_PRICE_INCREASE: 25, // 25% minimum price increase in short time
    PUMP_MIN_VOLUME_SPIKE: 5, // 5x average volume
    PUMP_PRICE_DROP_THRESHOLD: 15, // 15% price drop after pump
    
    // Wash trading detection
    WASH_TRADE_MIN_ACTIONS: 10, // Minimum number of transactions
    WASH_TRADE_MIN_VOLUME: 10000, // Minimum volume to consider
    WASH_TRADE_VOLUME_PRICE_RATIO: 500, // Volume to price change ratio threshold
    
    // Spoofing detection
    SPOOF_LIQUIDITY_ADD_THRESHOLD: 50000, // Significant liquidity addition
    SPOOF_LIQUIDITY_REMOVE_PCT: 80, // % of added liquidity removed quickly
    SPOOF_TIME_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
    
    // Liquidity manipulation
    LIQUIDITY_MIN_REDUCTION: 40, // 40% liquidity reduction in short time
    LIQUIDITY_MIN_INITIAL: 10000, // Minimum initial liquidity
    
    // Momentum ignition
    MOMENTUM_MIN_CONSECUTIVE_TRADES: 5, // Minimum consecutive trades in same direction
    MOMENTUM_MIN_PRICE_IMPACT: 10, // 10% price movement threshold
    MOMENTUM_MAX_TIME_MS: 5 * 60 * 1000 // 5 minutes
  };

  // Cross-timeframe correlation weights
  private readonly CORRELATION_WEIGHTS = {
    PATTERN_TYPE_MATCH: 0.4, // Same pattern type across timeframes
    SMART_MONEY_CONFIRMATION: 0.3, // Smart money confirmed in both timeframes
    TIMING_ALIGNMENT: 0.2, // Patterns occurring in logical sequence
    VOLUME_CONFIRMATION: 0.1 // Volume patterns consistent across timeframes
  };
  
  constructor(basePatternService: any) {
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'enhanced-pattern-recognition-service' },
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
    this.basePatternService = basePatternService;
  }

  /**
   * Initialize the enhanced pattern recognition service
   */
  async init(): Promise<boolean> {
    try {
      this.logger.info('Enhanced pattern recognition service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize enhanced pattern recognition service:', error);
      return false;
    }
  }

  /**
   * Enhanced pattern detection with manipulation checking
   * This wraps the original pattern detection and adds manipulation detection
   */
  async detectPatternsWithManipulationCheck(
    token: { address: string; network: string; symbol: string },
    timeframe: TimeframeType
  ): Promise<{
    patterns: IPattern[];
    manipulationDetected: boolean;
    details: ManipulationDetectionResult | null;
  }> {
    try {
      // Get market data for both timeframes to enable cross-checking
      const fastMarketData = await this.basePatternService.getMarketData(
        token.address, 
        token.network, 
        TimeframeType.FAST
      );
      
      const slowMarketData = await this.basePatternService.getMarketData(
        token.address, 
        token.network, 
        TimeframeType.SLOW
      );
      
      if (!fastMarketData || !slowMarketData) {
        this.logger.warn(`Insufficient market data for ${token.symbol}`);
        return { patterns: [], manipulationDetected: false, details: null };
      }
      
      // Check for manipulation using data from both timeframes
      const manipulationCheck = await this.detectManipulation(
        token, 
        fastMarketData, 
        slowMarketData
      );
      
      // Get patterns from the base service implementation
      let patterns: IPattern[] = [];
      
      // If no severe manipulation detected, detect patterns normally
      if (!manipulationCheck.detected || manipulationCheck.confidence < 80) {
        // Use the current timeframe's data for pattern detection
        const marketData = timeframe === TimeframeType.FAST ? fastMarketData : slowMarketData;
        
        // Detect patterns using the base service functionality
        await this.basePatternService.detectNewPatterns(token, marketData, timeframe);
        
        // Get active patterns for the token
        patterns = await Pattern.find({
          tokenAddress: token.address,
          network: token.network,
          timeframe: timeframe,
          status: { $in: [PatternStatus.FORMING, PatternStatus.CONFIRMED] }
        });
        
        // If manipulation was detected but not severe, attach detection info to patterns
        if (manipulationCheck.detected) {
          for (const pattern of patterns) {
            pattern.manipulationDetection = {
              detected: true,
              type: manipulationCheck.type,
              confidence: manipulationCheck.confidence,
              indicators: manipulationCheck.indicators,
              description: manipulationCheck.description
            };
            await pattern.save();
          }
        }
      } else {
        this.logger.warn(`Severe manipulation detected for ${token.symbol}, skipping pattern detection`);
      }
      
      return {
        patterns,
        manipulationDetected: manipulationCheck.detected,
        details: manipulationCheck.detected ? manipulationCheck : null
      };
    } catch (error) {
      this.logger.error(`Error in enhanced pattern detection for ${token.symbol}:`, error);
      return { patterns: [], manipulationDetected: false, details: null };
    }
  }

  /**
   * Advanced manipulation detection algorithm
   * Checks for multiple types of market manipulation
   */
  async detectManipulation(
    token: { address: string; network: string; symbol: string },
    fastMarketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    slowMarketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity }
  ): Promise<ManipulationDetectionResult> {
    try {
      // We'll check for several types of manipulation
      const results: ManipulationDetectionResult[] = [];
      
      // 1. Check for pump and dump patterns
      const pumpAndDumpResult = this.detectPumpAndDump(fastMarketData.candles);
      if (pumpAndDumpResult.detected) {
        results.push(pumpAndDumpResult);
      }
      
      // 2. Check for wash trading
      const washTradingResult = this.detectWashTrading(fastMarketData.candles, token);
      if (washTradingResult.detected) {
        results.push(washTradingResult);
      }
      
      // 3. Check for liquidity manipulation
      const liquidityResult = await this.detectLiquidityManipulation(token, fastMarketData, slowMarketData);
      if (liquidityResult.detected) {
        results.push(liquidityResult);
      }
      
      // 4. Check for momentum ignition
      const momentumResult = this.detectMomentumIgnition(fastMarketData.candles);
      if (momentumResult.detected) {
        results.push(momentumResult);
      }
      
      // If no manipulation detected, return negative result
      if (results.length === 0) {
        return {
          detected: false,
          type: ManipulationType.NONE,
          confidence: 0,
          indicators: {},
          description: "No manipulation detected"
        };
      }
      
      // Return the manipulation result with the highest confidence
      results.sort((a, b) => b.confidence - a.confidence);
      
      this.logger.warn(`Detected ${results[0].type} manipulation in ${token.symbol} with ${results[0].confidence}% confidence`);
      
      return results[0];
    } catch (error) {
      this.logger.error(`Error detecting manipulation for ${token.symbol}:`, error);
      
      // Return safe default on error
      return {
        detected: false,
        type: ManipulationType.NONE,
        confidence: 0,
        indicators: {},
        description: `Error during manipulation detection: ${error.message}`
      };
    }
  }

  /**
   * Detect pump and dump manipulation
   * Checks for rapid price increases followed by sharp declines
   */
  private detectPumpAndDump(candles: CandleData[]): ManipulationDetectionResult {
    if (candles.length < 10) {
      return {
        detected: false,
        type: ManipulationType.PUMP_AND_DUMP,
        confidence: 0,
        indicators: {},
        description: "Insufficient data for pump and dump detection"
      };
    }
    
    try {
      // Calculate baseline metrics
      const volumeData = candles.map(c => c.volume);
      const priceData = candles.map(c => c.close);
      
      // Calculate moving averages
      const volumeSMA = ta.SMA.calculate({ period: 5, values: volumeData });
      const priceSMA = ta.SMA.calculate({ period: 5, values: priceData });
      
      // Look for pump signals (sharp price increase with volume spike)
      let pumpDetected = false;
      let pumpConfidence = 0;
      let pumpIndex = -1;
      let maxPriceIncrease = 0;
      let maxVolumeRatio = 0;
      
      // Start checking after we have moving averages
      for (let i = 5; i < candles.length - 1; i++) {
        const priceChange = ((candles[i].close - candles[i-1].close) / candles[i-1].close) * 100;
        const volumeRatio = candles[i].volume / volumeSMA[i-5];
        
        if (priceChange > this.MANIPULATION_THRESHOLDS.PUMP_MIN_PRICE_INCREASE && 
            volumeRatio > this.MANIPULATION_THRESHOLDS.PUMP_MIN_VOLUME_SPIKE) {
          pumpDetected = true;
          pumpIndex = i;
          maxPriceIncrease = Math.max(maxPriceIncrease, priceChange);
          maxVolumeRatio = Math.max(maxVolumeRatio, volumeRatio);
          
          // Calculate confidence based on severity of the pump
          const priceContribution = Math.min(100, (priceChange / this.MANIPULATION_THRESHOLDS.PUMP_MIN_PRICE_INCREASE) * 50);
          const volumeContribution = Math.min(50, (volumeRatio / this.MANIPULATION_THRESHOLDS.PUMP_MIN_VOLUME_SPIKE) * 50);
          pumpConfidence = Math.max(pumpConfidence, priceContribution + volumeContribution);
        }
      }
      
      // If pump was detected, look for the dump
      let dumpDetected = false;
      let maxPriceDecrease = 0;
      
      if (pumpDetected && pumpIndex < candles.length - 2) {
        // Look at price action after the pump
        for (let i = pumpIndex + 1; i < candles.length; i++) {
          const priceChange = ((candles[i].close - candles[pumpIndex].close) / candles[pumpIndex].close) * 100;
          
          if (priceChange < -this.MANIPULATION_THRESHOLDS.PUMP_PRICE_DROP_THRESHOLD) {
            dumpDetected = true;
            maxPriceDecrease = Math.min(maxPriceDecrease, priceChange);
            
            // Adjust confidence based on dump severity
            const dumpContribution = Math.min(100, (Math.abs(priceChange) / this.MANIPULATION_THRESHOLDS.PUMP_PRICE_DROP_THRESHOLD) * 50);
            pumpConfidence = Math.min(100, pumpConfidence + dumpContribution * 0.5);
          }
        }
      }
      
      // Return result based on whether both pump and dump were detected
      if (pumpDetected && dumpDetected) {
        return {
          detected: true,
          type: ManipulationType.PUMP_AND_DUMP,
          confidence: pumpConfidence,
          indicators: {
            pumpIndex,
            maxPriceIncrease,
            maxPriceDecrease,
            maxVolumeRatio
          },
          description: `Detected pump (+${maxPriceIncrease.toFixed(2)}%) and dump (${maxPriceDecrease.toFixed(2)}%) pattern with ${maxVolumeRatio.toFixed(1)}x volume spike`
        };
      } else if (pumpDetected) {
        // If only pump detected, report with lower confidence
        return {
          detected: true,
          type: ManipulationType.PUMP_AND_DUMP,
          confidence: pumpConfidence * 0.6, // Lower confidence without dump confirmation
          indicators: {
            pumpIndex,
            maxPriceIncrease,
            maxVolumeRatio
          },
          description: `Detected potential pump (+${maxPriceIncrease.toFixed(2)}%) with ${maxVolumeRatio.toFixed(1)}x volume spike, but no subsequent dump yet`
        };
      }
      
      return {
        detected: false,
        type: ManipulationType.PUMP_AND_DUMP,
        confidence: 0,
        indicators: {},
        description: "No pump and dump pattern detected"
      };
    } catch (error) {
      this.logger.error("Error detecting pump and dump:", error);
      return {
        detected: false,
        type: ManipulationType.PUMP_AND_DUMP,
        confidence: 0,
        indicators: {},
        description: `Error during pump and dump detection: ${error.message}`
      };
    }
  }

  /**
   * Detect wash trading manipulation
   * Looks for high volume with minimal price impact
   */
  private detectWashTrading(
    candles: CandleData[], 
    token: { address: string; network: string; symbol: string }
  ): ManipulationDetectionResult {
    if (candles.length < 10) {
      return {
        detected: false,
        type: ManipulationType.WASH_TRADING,
        confidence: 0,
        indicators: {},
        description: "Insufficient data for wash trading detection"
      };
    }
    
    try {
      // Calculate volume to price change ratio across different periods
      const suspiciousPeriods = [];
      let totalVolume = 0;
      let priceRange = 0;
      
      // Look at the last day (or less if not enough data)
      const periodsToAnalyze = Math.min(candles.length, 24); // Assuming 1-hour candles
      const relevantCandles = candles.slice(candles.length - periodsToAnalyze);
      
      // Calculate total volume and price range
      totalVolume = relevantCandles.reduce((sum, candle) => sum + candle.volume, 0);
      const prices = relevantCandles.map(c => c.close);
      priceRange = Math.max(...prices) - Math.min(...prices);
      const priceRangePercent = (priceRange / Math.min(...prices)) * 100;
      
      // Calculate volume to price range ratio
      const volumeToPriceRatio = priceRangePercent > 0 ? totalVolume / priceRangePercent : totalVolume;
      
      // Look for periods with high volume but minimal price change
      for (let i = 1; i < relevantCandles.length; i++) {
        const priceChange = Math.abs((relevantCandles[i].close - relevantCandles[i-1].close) / relevantCandles[i-1].close) * 100;
        const volumeInPeriod = relevantCandles[i].volume;
        
        // Skip periods with very low volume
        if (volumeInPeriod < this.MANIPULATION_THRESHOLDS.WASH_TRADE_MIN_VOLUME) {
          continue;
        }
        
        // Calculate ratio of volume to price change
        const periodRatio = priceChange > 0 ? volumeInPeriod / priceChange : volumeInPeriod;
        
        // If ratio exceeds threshold, mark as suspicious
        if (periodRatio > this.MANIPULATION_THRESHOLDS.WASH_TRADE_VOLUME_PRICE_RATIO) {
          suspiciousPeriods.push({
            timestamp: relevantCandles[i].timestamp,
            volume: volumeInPeriod,
            priceChange,
            ratio: periodRatio
          });
        }
      }
      
      // Calculate confidence based on number and severity of suspicious periods
      let confidence = 0;
      
      if (suspiciousPeriods.length >= this.MANIPULATION_THRESHOLDS.WASH_TRADE_MIN_ACTIONS) {
        // Base confidence on number of suspicious periods
        const periodScore = Math.min(80, (suspiciousPeriods.length / this.MANIPULATION_THRESHOLDS.WASH_TRADE_MIN_ACTIONS) * 70);
        
        // Add contribution from overall volume/price ratio
        const ratioThresholdMultiple = volumeToPriceRatio / this.MANIPULATION_THRESHOLDS.WASH_TRADE_VOLUME_PRICE_RATIO;
        const ratioScore = Math.min(20, ratioThresholdMultiple * 10);
        
        confidence = periodScore + ratioScore;
      }
      
      return {
        detected: confidence >= 50,
        type: ManipulationType.WASH_TRADING,
        confidence,
        indicators: {
          suspiciousPeriods,
          totalVolume,
          priceRangePercent,
          volumeToPriceRatio
        },
        description: suspiciousPeriods.length > 0 
          ? `Detected ${suspiciousPeriods.length} periods of potential wash trading with ${volumeToPriceRatio.toFixed(0)} volume-to-price-change ratio`
          : "No wash trading pattern detected"
      };
    } catch (error) {
      this.logger.error("Error detecting wash trading:", error);
      return {
        detected: false,
        type: ManipulationType.WASH_TRADING,
        confidence: 0,
        indicators: {},
        description: `Error during wash trading detection: ${error.message}`
      };
    }
  }

  /**
   * Detect liquidity manipulation
   * Looks for significant rapid changes in liquidity
   */
  private async detectLiquidityManipulation(
    token: { address: string; network: string; symbol: string },
    fastMarketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    slowMarketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity }
  ): Promise<ManipulationDetectionResult> {
    try {
      // Get liquidity data from market service
      const liquidityData = await marketDataService.getTokenLiquidity(token.address);
      
      if (!liquidityData || !liquidityData.history || liquidityData.history.length < 5) {
        return {
          detected: false,
          type: ManipulationType.LIQUIDITY_MANIPULATION,
          confidence: 0,
          indicators: {},
          description: "Insufficient liquidity data for analysis"
        };
      }
      
      // Look for sudden liquidity withdrawals
      const liquidityHistory = liquidityData.history;
      const liquidityEvents = [];
      
      for (let i = 1; i < liquidityHistory.length; i++) {
        const current = liquidityHistory[i];
        const previous = liquidityHistory[i-1];
        
        // Skip if previous liquidity is below threshold
        if (previous.amount < this.MANIPULATION_THRESHOLDS.LIQUIDITY_MIN_INITIAL) {
          continue;
        }
        
        // Calculate percentage change
        const percentChange = ((current.amount - previous.amount) / previous.amount) * 100;
        
        // If there's a significant reduction in liquidity, record it
        if (percentChange < -this.MANIPULATION_THRESHOLDS.LIQUIDITY_MIN_REDUCTION) {
          liquidityEvents.push({
            timestamp: current.timestamp,
            previousAmount: previous.amount,
            currentAmount: current.amount,
            changePercent: percentChange,
            timeDelta: current.timestamp.getTime() - previous.timestamp.getTime()
          });
        }
      }
      
      // Calculate confidence based on number and severity of events
      let confidence = 0;
      
      if (liquidityEvents.length > 0) {
        // Calculate average severity
        const avgPercentChange = liquidityEvents.reduce((sum, event) => sum + Math.abs(event.changePercent), 0) / liquidityEvents.length;
        
        // Base confidence on severity and number of events
        const severityScore = Math.min(80, (avgPercentChange / this.MANIPULATION_THRESHOLDS.LIQUIDITY_MIN_REDUCTION) * 70);
        const countScore = Math.min(20, liquidityEvents.length * 5);
        
        confidence = severityScore + countScore;
      }
      
      return {
        detected: confidence >= 50,
        type: ManipulationType.LIQUIDITY_MANIPULATION,
        confidence,
        indicators: {
          liquidityEvents,
          currentLiquidity: liquidityHistory[liquidityHistory.length - 1].amount
        },
        description: liquidityEvents.length > 0
          ? `Detected ${liquidityEvents.length} instances of significant liquidity withdrawal, averaging ${Math.abs(liquidityEvents.reduce((sum, e) => sum + e.changePercent, 0) / liquidityEvents.length).toFixed(1)}% reduction`
          : "No liquidity manipulation detected"
      };
    } catch (error) {
      this.logger.error("Error detecting liquidity manipulation:", error);
      return {
        detected: false,
        type: ManipulationType.LIQUIDITY_MANIPULATION,
        confidence: 0,
        indicators: {},
        description: `Error during liquidity manipulation detection: ${error.message}`
      };
    }
  }

  /**
   * Detect momentum ignition manipulation
   * Looks for rapid consecutive trades in same direction to trigger algos
   */
  private detectMomentumIgnition(candles: CandleData[]): ManipulationDetectionResult {
    if (candles.length < 10) {
      return {
        detected: false,
        type: ManipulationType.MOMENTUM_IGNITION,
        confidence: 0,
        indicators: {},
        description: "Insufficient data for momentum ignition detection"
      };
    }
    
    try {
      // Look for series of rapid price movements in same direction
      let currentStreak = 1;
      let longestStreak = 1;
      let streakStartIndex = -1;
      let streakDirection = 0; // 1 for up, -1 for down
      let maxPriceChange = 0;
      
      // Start from most recent candles and work backwards
      for (let i = candles.length - 2; i >= 0; i--) {
        const currentChange = candles[i+1].close - candles[i].close;
        const currentChangePercent = (currentChange / candles[i].close) * 100;
        
        // If first comparison, set direction
        if (streakDirection === 0) {
          streakDirection = currentChange > 0 ? 1 : -1;
          streakStartIndex = i;
        }
        
        // If continuing in same direction
        if ((streakDirection > 0 && currentChange > 0) || 
            (streakDirection < 0 && currentChange < 0)) {
          currentStreak++;
          maxPriceChange += Math.abs(currentChangePercent);
          
          // Update longest streak if current is longer
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
        } else {
          // Reset streak
          currentStreak = 1;
          streakDirection = currentChange > 0 ? 1 : -1;
          streakStartIndex = i;
          maxPriceChange = Math.abs(currentChangePercent);
        }
        
        // If we've found a significant streak, no need to keep searching
        if (longestStreak >= this.MANIPULATION_THRESHOLDS.MOMENTUM_MIN_CONSECUTIVE_TRADES && 
            maxPriceChange >= this.MANIPULATION_THRESHOLDS.MOMENTUM_MIN_PRICE_IMPACT) {
          break;
        }
      }
      
      // Calculate confidence based on streak length and price impact
      let confidence = 0;
      
      if (longestStreak >= this.MANIPULATION_THRESHOLDS.MOMENTUM_MIN_CONSECUTIVE_TRADES) {
        // Calculate time span of the streak
        const streakEndIndex = streakStartIndex + longestStreak - 1;
        const streakTimeSpan = candles[streakEndIndex].timestamp.getTime() - candles[streakStartIndex].timestamp.getTime();
        
        // Only consider it manipulation if it happened within our time threshold
        if (streakTimeSpan <= this.MANIPULATION_THRESHOLDS.MOMENTUM_MAX_TIME_MS) {
          const streakScore = Math.min(50, (longestStreak / this.MANIPULATION_THRESHOLDS.MOMENTUM_MIN_CONSECUTIVE_TRADES) * 40);
          const priceScore = Math.min(50, (maxPriceChange / this.MANIPULATION_THRESHOLDS.MOMENTUM_MIN_PRICE_IMPACT) * 40);
          const timeScore = Math.min(20, (1 - (streakTimeSpan / this.MANIPULATION_THRESHOLDS.MOMENTUM_MAX_TIME_MS)) * 20);
          
          confidence = streakScore + priceScore + timeScore;
        }
      }
      
      return {
        detected: confidence >= 50,
        type: ManipulationType.MOMENTUM_IGNITION,
        confidence,
        indicators: {
          longestStreak,
          maxPriceChange,
          direction: streakDirection > 0 ? "up" : "down"
        },
        description: confidence >= 50
          ? `Detected ${longestStreak} consecutive ${streakDirection > 0 ? "up" : "down"} candles with ${maxPriceChange.toFixed(1)}% total price change`
          : "No momentum ignition pattern detected"
      };
    } catch (error) {
      this.logger.error("Error detecting momentum ignition:", error);
      return {
        detected: false,
        type: ManipulationType.MOMENTUM_IGNITION,
        confidence: 0,
        indicators: {},
        description: `Error during momentum ignition detection: ${error.message}`
      };
    }
  }

  /**
   * Enhanced cross-timeframe pattern correlation
   * Correlates patterns between fast and slow timeframes for higher confidence
   */
  async correlateTimeframePatterns(
    token: { address: string; network: string; symbol: string }
  ): Promise<CrossTimeframeCorrelation[]> {
    try {
      // Get active patterns for both timeframes
      const fastPatterns = await Pattern.find({
        tokenAddress: token.address,
        network: token.network,
        timeframe: TimeframeType.FAST,
        status: { $in: [PatternStatus.FORMING, PatternStatus.CONFIRMED] }
      });
      
      const slowPatterns = await Pattern.find({
        tokenAddress: token.address,
        network: token.network,
        timeframe: TimeframeType.SLOW,
        status: { $in: [PatternStatus.FORMING, PatternStatus.CONFIRMED] }
      });
      
      // If we don't have patterns in both timeframes, return empty result
      if (fastPatterns.length === 0 || slowPatterns.length === 0) {
        this.logger.debug(`Insufficient patterns for correlation in ${token.symbol}`);
        return [];
      }
      
      const correlations: CrossTimeframeCorrelation[] = [];
      
      // Check for correlations between each fast and slow pattern
      for (const fastPattern of fastPatterns) {
        for (const slowPattern of slowPatterns) {
          // Calculate correlation strength
          const correlation = this.calculatePatternCorrelation(fastPattern, slowPattern);
          
          // If correlation is strong enough, save it
          if (correlation.correlationStrength >= 50) {
            correlations.push(correlation);
            
            // Update both patterns with correlation data
            await this.updatePatternWithCorrelation(fastPattern._id, slowPattern._id, correlation);
            await this.updatePatternWithCorrelation(slowPattern._id, fastPattern._id, correlation);
          }
        }
      }
      
      this.logger.info(`Found ${correlations.length} cross-timeframe correlations for ${token.symbol}`);
      return correlations;
    } catch (error) {
      this.logger.error(`Error correlating patterns for ${token.symbol}:`, error);
      return [];
    }
  }
  
  /**
   * Calculate correlation between patterns in different timeframes
   */
  private calculatePatternCorrelation(
    fastPattern: IPattern,
    slowPattern: IPattern
  ): CrossTimeframeCorrelation {
    // Initialize correlation data
    const correlation: CrossTimeframeCorrelation = {
      fastPatternId: fastPattern._id,
      slowPatternId: slowPattern._id,
      correlationType: 'none',
      correlationStrength: 0,
      combinedConfidence: 0,
      timeframeDelta: fastPattern.startTime.getTime() - slowPattern.startTime.getTime()
    };
    
    // 1. Check if patterns are of the same type
    const patternTypeMatchScore = fastPattern.patternType === slowPattern.patternType
      ? 100 * this.CORRELATION_WEIGHTS.PATTERN_TYPE_MATCH
      : this.isRelatedPatternType(fastPattern.patternType, slowPattern.patternType)
        ? 60 * this.CORRELATION_WEIGHTS.PATTERN_TYPE_MATCH
        : 0;
    
    // 2. Check for smart money consistency
    const smartMoneyMatchScore = this.calculateSmartMoneyMatchScore(
      fastPattern.smartMoneyActivity,
      slowPattern.smartMoneyActivity
    ) * this.CORRELATION_WEIGHTS.SMART_MONEY_CONFIRMATION;
    
    // 3. Check for timing alignment
    const timingAlignmentScore = this.calculateTimingAlignmentScore(fastPattern, slowPattern)
      * this.CORRELATION_WEIGHTS.TIMING_ALIGNMENT;
    
    // 4. Check for volume pattern consistency
    const volumeConsistencyScore = this.calculateVolumeConsistencyScore(fastPattern, slowPattern)
      * this.CORRELATION_WEIGHTS.VOLUME_CONFIRMATION;
    
    // Calculate total correlation strength
    const totalCorrelationStrength = patternTypeMatchScore + smartMoneyMatchScore + 
      timingAlignmentScore + volumeConsistencyScore;
    
    correlation.correlationStrength = Math.round(totalCorrelationStrength);
    
    // Determine correlation type (confirmation, divergence, or continuation)
    correlation.correlationType = this.determineCorrelationType(fastPattern, slowPattern);
    
    // Calculate combined confidence
    correlation.combinedConfidence = Math.round(
      (fastPattern.confidence + slowPattern.confidence) / 2 * 
      (0.7 + 0.3 * (correlation.correlationStrength / 100))
    );
    
    return correlation;
  }
  
  /**
   * Check if two pattern types are related
   */
  private isRelatedPatternType(type1: PatternType, type2: PatternType): boolean {
    // Define groups of related pattern types
    const relatedPatternGroups = [
      // Breakout patterns
      [PatternType.BREAKOUT, PatternType.CUP_AND_HANDLE, PatternType.INVERSE_HEAD_SHOULDERS],
      
      // Accumulation patterns
      [PatternType.ACCUMULATION, PatternType.SMART_MONEY_ACCUMULATION, PatternType.ROUNDED_BOTTOM],
      
      // Recovery patterns
      [PatternType.V_RECOVERY, PatternType.BULL_FLAG]
    ];
    
    return relatedPatternGroups.some(group => 
      group.includes(type1) && group.includes(type2)
    );
  }
  
  /**
   * Calculate how well smart money activity matches between timeframes
   */
  private calculateSmartMoneyMatchScore(
    fastSmartMoney: SmartMoneyActivity,
    slowSmartMoney: SmartMoneyActivity
  ): number {
    // If either activity is missing, return neutral score
    if (!fastSmartMoney || !slowSmartMoney) {
      return 50;
    }
    
    // Calculate buy/sell ratio similarity
    const fastBuySellRatio = fastSmartMoney.buys / Math.max(1, fastSmartMoney.sells);
    const slowBuySellRatio = slowSmartMoney.buys / Math.max(1, slowSmartMoney.sells);
    
    // Use a sigmoid function to compare ratios (closer to 1 is better)
    const ratioDifference = Math.abs(fastBuySellRatio - slowBuySellRatio);
    const ratioDiffScore = 100 / (1 + Math.exp(ratioDifference - 0.5));
    
    // Check if both have positive net buys
    const buyDirectionMatch = (fastSmartMoney.netBuys > 0 && slowSmartMoney.netBuys > 0) ||
                             (fastSmartMoney.netBuys < 0 && slowSmartMoney.netBuys < 0);
    
    // Combine scores
    return buyDirectionMatch ? ratioDiffScore : ratioDiffScore * 0.5;
  }
  
  /**
   * Calculate how well the timing of patterns aligns
   */
  private calculateTimingAlignmentScore(fastPattern: IPattern, slowPattern: IPattern): number {
    // Typically, slow patterns should start before or around the same time as fast patterns
    const timeDifference = fastPattern.startTime.getTime() - slowPattern.startTime.getTime();
    
    if (timeDifference >= 0) {
      // Fast pattern starts after slow pattern (ideal)
      // Score decreases as the gap gets very large (more than 24 hours)
      const maxGapMs = 24 * 60 * 60 * 1000; // 24 hours
      return 100 - Math.min(100, (timeDifference / maxGapMs) * 50);
    } else {
      // Fast pattern starts before slow pattern (less ideal but possible)
      // Score decreases quickly
      const absTimeDiff = Math.abs(timeDifference);
      const maxGapMs = 6 * 60 * 60 * 1000; // 6 hours
      return Math.max(0, 70 - (absTimeDiff / maxGapMs) * 70);
    }
  }
  
  /**
   * Calculate how consistent volume patterns are across timeframes
   */
  private calculateVolumeConsistencyScore(fastPattern: IPattern, slowPattern: IPattern): number {
    // Get volume data from both patterns
    const fastVolumes = fastPattern.priceAction.volumes;
    const slowVolumes = slowPattern.priceAction.volumes;
    
    if (!fastVolumes || !slowVolumes || fastVolumes.length < 3 || slowVolumes.length < 3) {
      return 50; // Neutral score if insufficient data
    }
    
    // Calculate volume trends
    const fastVolumeTrend = this.calculateVolumeTrend(fastVolumes);
    const slowVolumeTrend = this.calculateVolumeTrend(slowVolumes);
    
    // Score based on trend similarity
    if (fastVolumeTrend === slowVolumeTrend) {
      return 100; // Perfect match
    } else if (fastVolumeTrend === 'flat' || slowVolumeTrend === 'flat') {
      return 70; // One is neutral
    } else {
      return 30; // Conflicting trends
    }
  }
  
  /**
   * Calculate volume trend (increasing, decreasing, or flat)
   */
  private calculateVolumeTrend(volumes: number[]): 'increasing' | 'decreasing' | 'flat' {
    if (volumes.length < 3) {
      return 'flat';
    }
    
    // Use linear regression to determine trend
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (let i = 0; i < volumes.length; i++) {
      sumX += i;
      sumY += volumes[i];
      sumXY += i * volumes[i];
      sumXX += i * i;
    }
    
    const n = volumes.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Determine trend based on slope and average volume
    const avgVolume = sumY / n;
    const normalizedSlope = slope / avgVolume;
    
    if (normalizedSlope > 0.1) {
      return 'increasing';
    } else if (normalizedSlope < -0.1) {
      return 'decreasing';
    } else {
      return 'flat';
    }
  }
  
  /**
   * Determine the type of correlation between patterns
   */
  private determineCorrelationType(
    fastPattern: IPattern,
    slowPattern: IPattern
  ): 'confirmation' | 'divergence' | 'continuation' | 'none' {
    // Determine if both patterns suggest the same direction
    const fastDirection = this.getPatternDirection(fastPattern.patternType);
    const slowDirection = this.getPatternDirection(slowPattern.patternType);
    
    if (fastDirection === 'neutral' || slowDirection === 'neutral') {
      return 'none';
    }
    
    if (fastDirection === slowDirection) {
      // Check if slow pattern started first
      if (slowPattern.startTime < fastPattern.startTime) {
        return 'continuation';
      } else {
        return 'confirmation';
      }
    } else {
      return 'divergence';
    }
  }
  
  /**
   * Get expected price direction for a pattern type
   */
  private getPatternDirection(patternType: PatternType): 'bullish' | 'bearish' | 'neutral' {
    const bullishPatterns = [
      PatternType.BREAKOUT,
      PatternType.V_RECOVERY,
      PatternType.BULL_FLAG,
      PatternType.ACCUMULATION,
      PatternType.CUP_AND_HANDLE,
      PatternType.INVERSE_HEAD_SHOULDERS,
      PatternType.ROUNDED_BOTTOM,
      PatternType.SMART_MONEY_ACCUMULATION
    ];
    
    // Note: In your implementation, you might have bearish patterns as well
    const bearishPatterns: PatternType[] = [];
    
    if (bullishPatterns.includes(patternType)) {
      return 'bullish';
    } else if (bearishPatterns.includes(patternType)) {
      return 'bearish';
    } else {
      return 'neutral';
    }
  }
  
  /**
   * Update a pattern with correlation data
   */
  private async updatePatternWithCorrelation(
    patternId: mongoose.Types.ObjectId,
    correlatedPatternId: mongoose.Types.ObjectId,
    correlation: CrossTimeframeCorrelation
  ): Promise<void> {
    try {
      await Pattern.findByIdAndUpdate(patternId, {
        $set: {
          'crossTimeframeCorrelation.correlatedPatternId': correlatedPatternId,
          'crossTimeframeCorrelation.correlationType': correlation.correlationType,
          'crossTimeframeCorrelation.correlationStrength': correlation.correlationStrength,
          'crossTimeframeCorrelation.combinedConfidence': correlation.combinedConfidence,
          'crossTimeframeCorrelation.timeframeDelta': correlation.timeframeDelta
        }
      });
    } catch (error) {
      this.logger.error(`Error updating pattern ${patternId} with correlation:`, error);
    }
  }