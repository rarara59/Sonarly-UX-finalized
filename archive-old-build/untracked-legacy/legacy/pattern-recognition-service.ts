// Thorp V1 - Pattern Recognition Service
// Implements dual timeframe pattern detection for fast (1-4h) and slow (4-48h) patterns

import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import * as ta from 'technicalindicators';
import marketDataService, { CandleData } from './market-data-service';
import externalWalletScraper from './external-wallet-scraper';
import config from '.';

// Set up technical indicators with increased precision
ta.setConfig('precision', 8);

// Types and interfaces
export enum PatternType {
  // Fast patterns (1-4 hour timeframe)
  BREAKOUT = 'breakout',
  V_RECOVERY = 'vRecovery',
  BULL_FLAG = 'bullFlag',
  ACCUMULATION = 'accumulation',
  
  // Slow patterns (4-48 hour timeframe)
  CUP_AND_HANDLE = 'cupAndHandle',
  INVERSE_HEAD_SHOULDERS = 'inverseHeadAndShoulders',
  ROUNDED_BOTTOM = 'roundedBottom',
  SMART_MONEY_ACCUMULATION = 'smartMoneyAccumulation'
}

export enum PatternStatus {
  FORMING = 'forming',
  CONFIRMED = 'confirmed',
  INVALIDATED = 'invalidated',
  COMPLETED = 'completed'
}

export enum TimeframeType {
  FAST = 'fast',
  SLOW = 'slow'
}

export interface PatternRelationship {
  patternId: mongoose.Types.ObjectId;
  relationship: 'confirmation' | 'divergence' | 'continuation';
}

export interface PatternOutcome {
  successful: boolean;
  maxReturn: number;
  timeToTarget?: number; // In milliseconds
  notes?: string;
}

export interface SmartMoneyActivity {
  buys: number;
  sells: number;
  netBuys: number;
  walletCount: number;
}

export interface PatternIndicators {
  [key: string]: any;
}

export interface PriceAction {
  prices: number[];
  volumes: number[];
  timestamps: Date[];
}

export interface IPattern extends Document {
  tokenAddress: string;
  network: string;
  patternType: PatternType;
  timeframe: TimeframeType;
  startTime: Date;
  endTime?: Date;
  status: PatternStatus;
  confidence: number;
  targetPrice?: number;
  stopLossPrice?: number;
  initialPrice: number;
  highestPrice?: number;
  lowestPrice?: number;
  currentPrice: number;
  priceAction: PriceAction;
  indicators: PatternIndicators;
  smartMoneyActivity: SmartMoneyActivity;
  relatedPatterns: PatternRelationship[];
  outcome?: PatternOutcome;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Pattern criteria interface for configuration
export interface PatternCriteria {
  [key: string]: number | string | boolean;
}

// Schema definitions
const patternSchema = new Schema<IPattern>({
  tokenAddress: { type: String, required: true, index: true },
  network: { type: String, required: true, index: true },
  patternType: { 
    type: String, 
    required: true, 
    enum: Object.values(PatternType),
    index: true 
  },
  timeframe: { 
    type: String, 
    required: true, 
    enum: Object.values(TimeframeType),
    index: true 
  },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(PatternStatus),
    index: true 
  },
  confidence: { type: Number, required: true, min: 0, max: 100 },
  targetPrice: { type: Number },
  stopLossPrice: { type: Number },
  initialPrice: { type: Number, required: true },
  highestPrice: { type: Number },
  lowestPrice: { type: Number },
  currentPrice: { type: Number, required: true },
  priceAction: {
    prices: [{ type: Number }],
    volumes: [{ type: Number }],
    timestamps: [{ type: Date }]
  },
  indicators: { type: Schema.Types.Mixed },
  smartMoneyActivity: {
    buys: { type: Number, default: 0 },
    sells: { type: Number, default: 0 },
    netBuys: { type: Number, default: 0 },
    walletCount: { type: Number, default: 0 }
  },
  relatedPatterns: [{
    patternId: { type: Schema.Types.ObjectId, ref: 'Pattern' },
    relationship: { type: String, enum: ['confirmation', 'divergence', 'continuation'] }
  }],
  outcome: {
    successful: { type: Boolean },
    maxReturn: { type: Number },
    timeToTarget: { type: Number }, // In milliseconds
    notes: { type: String }
  },
  tags: [{ type: String }]
}, { timestamps: true });

// Create model if it doesn't exist yet
const Pattern: Model<IPattern> = mongoose.models.Pattern as Model<IPattern> || 
  mongoose.model<IPattern>('Pattern', patternSchema);

class PatternRecognitionService {
  private logger: winston.Logger;
  private activePatterns: Map<TimeframeType, Map<string, IPattern>>;
  private timeframes: Record<TimeframeType, {
    interval: string;
    candleTimeframe: string;
    periodsToKeep: number;
    scanInterval: number;
  }>;
  private patternDefinitions: Record<TimeframeType, Record<PatternType, PatternCriteria>>;
  private scanIntervalIds: Record<TimeframeType, NodeJS.Timeout | null>;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'pattern-recognition-service' },
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
    
    // Initialize active patterns
    this.activePatterns = new Map([
      [TimeframeType.FAST, new Map()],
      [TimeframeType.SLOW, new Map()]
    ]);
    
    // Initialize timeframes
    this.timeframes = {
      [TimeframeType.FAST]: {
        interval: '1-4h', // Human-readable
        candleTimeframe: '15m', // 15-minute candles for 1-4h patterns
        periodsToKeep: 20, // Keep last 20 periods (5 hours)
        scanInterval: 15 * 60 * 1000 // 15 minutes
      },
      [TimeframeType.SLOW]: {
        interval: '4-48h', // Human-readable
        candleTimeframe: '1h', // 1-hour candles for 4-48h patterns
        periodsToKeep: 60, // Keep last 60 periods (2.5 days)
        scanInterval: 60 * 60 * 1000 // 1 hour
      }
    };
    
    // Initialize scan interval IDs
    this.scanIntervalIds = {
      [TimeframeType.FAST]: null,
      [TimeframeType.SLOW]: null
    };
    
    // Initialize pattern definitions
    this.patternDefinitions = {
      // Fast patterns (1-4 hour timeframe)
      [TimeframeType.FAST]: {
        [PatternType.BREAKOUT]: {
          minConsolidationPeriods: 6, // Minimum periods of consolidation
          breakoutVolumeMultiplier: 2.0, // Volume increase for breakout
          minPriceIncrease: 0.05, // 5% minimum price increase
          confirmationPeriods: 2, // Periods to confirm breakout
          maxLookbackPeriods: 24 // Maximum periods to look back
        },
        [PatternType.V_RECOVERY]: {
          minDropPercentage: 0.10, // 10% minimum drop
          minRecoveryPercentage: 0.08, // 8% minimum recovery
          maxRecoveryTime: 12, // Maximum recovery time in periods
          volumeIncreaseThreshold: 1.5 // Volume increase for recovery
        },
        [PatternType.BULL_FLAG]: {
          minInitialMove: 0.15, // 15% minimum initial upward move
          consolidationTimeMin: 3, // Minimum consolidation periods
          consolidationTimeMax: 12, // Maximum consolidation periods
          maxRetracement: 0.5, // Maximum retracement of initial move
          volumeDecreaseThreshold: 0.7 // Volume decrease during consolidation
        },
        [PatternType.ACCUMULATION]: {
          minPeriods: 8, // Minimum periods of sideways movement
          maxPriceVariation: 0.05, // Maximum price variation during accumulation
          volumeIncreaseEnd: 1.8, // Volume increase at end of accumulation
          smartMoneyThreshold: 3 // Minimum smart money wallets involved
        }
      },
      
      // Slow patterns (4-48 hour timeframe)
      [TimeframeType.SLOW]: {
        [PatternType.CUP_AND_HANDLE]: {
          minCupDepth: 0.15, // 15% minimum cup depth
          maxCupDepth: 0.5, // 50% maximum cup depth
          minCupLength: 10, // Minimum cup length in periods
          maxCupLength: 40, // Maximum cup length in periods
          maxHandleRetracement: 0.4, // Maximum handle retracement
          minHandleLength: 5, // Minimum handle length in periods
          maxHandleLength: 15 // Maximum handle length in periods
        },
        [PatternType.INVERSE_HEAD_SHOULDERS]: {
          minPatternDepth: 0.12, // 12% minimum pattern depth
          maxShoulderAsymmetry: 0.3, // Maximum asymmetry between shoulders
          necklineVariation: 0.05, // Maximum neckline variation
          minHeadDepth: 0.15, // Minimum head depth relative to shoulders
          confirmationBreakout: 0.03 // Minimum breakout above neckline
        },
        [PatternType.ROUNDED_BOTTOM]: {
          minBottomDepth: 0.2, // 20% minimum depth from start to bottom
          minBottomLength: 15, // Minimum length in periods
          maxBottomLength: 60, // Maximum length in periods
          minRoundingScore: 0.7, // Minimum rounding score (0-1)
          volumePattern: 'decreasing-then-increasing' // Volume pattern requirement
        },
        [PatternType.SMART_MONEY_ACCUMULATION]: {
          minSmartWallets: 5, // Minimum number of smart wallets
          minNetBuyPercentage: 0.6, // Minimum 60% of transactions are buys
          minAccumulationPeriods: 12, // Minimum accumulation periods
          maxPriceIncreaseDuringAccumulation: 0.1 // Maximum price increase during accumulation
        }
      }
    };
  }
  
  /**
   * Initialize the pattern recognition service
   */
  async init(): Promise<boolean> {
    try {
      // Load active patterns from database
      await this.loadActivePatterns();
      
      // Start pattern scanners
      this.startPatternScanners();
      
      this.logger.info('Pattern recognition service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize pattern recognition service:', error);
      return false;
    }
  }
  
  /**
   * Load active patterns from database
   */
  private async loadActivePatterns(): Promise<void> {
    try {
      // Load fast timeframe active patterns
      const fastPatterns = await Pattern.find({
        timeframe: TimeframeType.FAST,
        status: { $in: [PatternStatus.FORMING, PatternStatus.CONFIRMED] }
      });
      
      for (const pattern of fastPatterns) {
        const key = `${pattern.tokenAddress}-${pattern.network}-${pattern.patternType}`;
        this.activePatterns.get(TimeframeType.FAST)!.set(key, pattern);
      }
      
      // Load slow timeframe active patterns
      const slowPatterns = await Pattern.find({
        timeframe: TimeframeType.SLOW,
        status: { $in: [PatternStatus.FORMING, PatternStatus.CONFIRMED] }
      });
      
      for (const pattern of slowPatterns) {
        const key = `${pattern.tokenAddress}-${pattern.network}-${pattern.patternType}`;
        this.activePatterns.get(TimeframeType.SLOW)!.set(key, pattern);
      }
      
      this.logger.info(`Loaded ${fastPatterns.length} active fast patterns and ${slowPatterns.length} active slow patterns`);
    } catch (error) {
      this.logger.error('Error loading active patterns:', error);
    }
  }
  
  /**
   * Start pattern scanners for each timeframe
   */
  startPatternScanners(): void {
    // Clear any existing intervals
    if (this.scanIntervalIds[TimeframeType.FAST]) {
      clearInterval(this.scanIntervalIds[TimeframeType.FAST]!);
    }
    
    if (this.scanIntervalIds[TimeframeType.SLOW]) {
      clearInterval(this.scanIntervalIds[TimeframeType.SLOW]!);
    }
    
    // Start fast pattern scanner
    this.scanIntervalIds[TimeframeType.FAST] = setInterval(() => {
      this.scanForPatterns(TimeframeType.FAST);
    }, this.timeframes[TimeframeType.FAST].scanInterval);
    
    // Start slow pattern scanner
    this.scanIntervalIds[TimeframeType.SLOW] = setInterval(() => {
      this.scanForPatterns(TimeframeType.SLOW);
    }, this.timeframes[TimeframeType.SLOW].scanInterval);
    
    this.logger.info('Pattern scanners started');
  }
  
  /**
   * Scan for patterns in the specified timeframe
   */
  async scanForPatterns(timeframe: TimeframeType): Promise<void> {
    this.logger.debug(`Scanning for ${timeframe} patterns`);
    
    try {
      // Get tokens to scan - this would come from your token discovery or watchlist
      const tokensToScan = await this.getTokensToScan(timeframe);
      
      for (const token of tokensToScan) {
        try {
          // Get market data for the token
          const marketData = await this.getMarketData(token.address, token.network, timeframe);
          
          if (!marketData || marketData.candles.length < 10) {
            continue; // Not enough data
          }
          
          // Check for new patterns
          await this.detectNewPatterns(token, marketData, timeframe);
          
          // Update existing patterns
          await this.updateActivePatterns(token, marketData, timeframe);
        } catch (error) {
          this.logger.error(`Error scanning patterns for ${token.symbol}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Error in ${timeframe} pattern scanner:`, error);
    }
  }
  
  /**
   * Get market data for pattern analysis
   */
  private async getMarketData(address: string, network: string, timeframe: TimeframeType): Promise<{
    candles: CandleData[];
    smartMoneyActivity?: SmartMoneyActivity;
  } | null> {
    try {
      // Get candle data from market service
      const candles = await marketDataService.getMarketHistory(
        address, 
        network, 
        this.timeframes[timeframe].candleTimeframe
      );
      
      if (!candles || candles.length === 0) {
        return null;
      }
      
      // Get smart money activity if needed
      let smartMoneyActivity: SmartMoneyActivity | undefined;
      
      try {
        // This is a placeholder - in production connect to your wallet analysis system
        smartMoneyActivity = {
          buys: Math.floor(Math.random() * 15),
          sells: Math.floor(Math.random() * 5),
          netBuys: Math.floor(Math.random() * 10),
          walletCount: Math.floor(Math.random() * 10)
        };
      } catch (err) {
        this.logger.warn(`Could not get smart money activity for ${address}`);
      }
      
      return {
        candles,
        smartMoneyActivity
      };
    } catch (error) {
      this.logger.error(`Error getting market data for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Detect new patterns in market data
   */
  private async detectNewPatterns(
    token: { address: string; network: string; symbol: string }, 
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity }, 
    timeframe: TimeframeType
  ): Promise<void> {
    const patterns = this.patternDefinitions[timeframe];
    
    // Check each pattern type
    for (const [patternType, criteria] of Object.entries(patterns)) {
      // Skip if we already have an active pattern of this type for this token
      const patternKey = `${token.address}-${token.network}-${patternType}`;
      if (this.activePatterns.get(timeframe)!.has(patternKey)) {
        continue;
      }
      
      // Detect pattern based on type
      let detected = false;
      let patternData = null;
      
      switch (patternType) {
        case PatternType.BREAKOUT:
          [detected, patternData] = this.detectBreakoutPattern(marketData, criteria);
          break;
        case PatternType.V_RECOVERY:
          [detected, patternData] = this.detectVRecoveryPattern(marketData, criteria);
          break;
        case PatternType.BULL_FLAG:
          [detected, patternData] = this.detectBullFlagPattern(marketData, criteria);
          break;
        case PatternType.ACCUMULATION:
        case PatternType.SMART_MONEY_ACCUMULATION:
          [detected, patternData] = this.detectAccumulationPattern(marketData, criteria);
          break;
        case PatternType.CUP_AND_HANDLE:
          [detected, patternData] = this.detectCupAndHandlePattern(marketData, criteria);
          break;
        case PatternType.INVERSE_HEAD_SHOULDERS:
          [detected, patternData] = this.detectInverseHeadAndShouldersPattern(marketData, criteria);
          break;
        case PatternType.ROUNDED_BOTTOM:
          [detected, patternData] = this.detectRoundedBottomPattern(marketData, criteria);
          break;
        default:
          detected = false;
      }
      
      // If pattern detected, create a new pattern record
      if (detected && patternData) {
        await this.createPattern(token, patternType as PatternType, patternData, timeframe);
      }
    }
  }
  
  /**
   * Create a new pattern record
   */
  private async createPattern(
    token: { address: string; network: string; symbol: string },
    patternType: PatternType,
    patternData: any,
    timeframe: TimeframeType
  ): Promise<IPattern | null> {
    try {
      const newPattern = new Pattern({
        tokenAddress: token.address,
        network: token.network,
        patternType,
        timeframe,
        startTime: patternData.startTime,
        status: PatternStatus.FORMING,
        confidence: patternData.confidence,
        targetPrice: patternData.targetPrice,
        stopLossPrice: patternData.stopLossPrice,
        initialPrice: patternData.initialPrice,
        currentPrice: patternData.currentPrice,
        highestPrice: patternData.currentPrice,
        lowestPrice: patternData.currentPrice,
        priceAction: {
          prices: patternData.prices,
          volumes: patternData.volumes,
          timestamps: patternData.timestamps
        },
        indicators: patternData.indicators,
        smartMoneyActivity: patternData.smartMoneyActivity || {
          buys: 0,
          sells: 0,
          netBuys: 0,
          walletCount: 0
        },
        tags: [token.symbol, timeframe, patternType]
      });
      
      const savedPattern = await newPattern.save();
      
      // Add to active patterns
      const patternKey = `${token.address}-${token.network}-${patternType}`;
      this.activePatterns.get(timeframe)!.set(patternKey, savedPattern);
      
      this.logger.info(`Created new ${timeframe} ${patternType} pattern for ${token.symbol}`);
      
      // Look for correlations with other timeframe
      await this.findPatternCorrelations(savedPattern);
      
      return savedPattern;
    } catch (error) {
      this.logger.error(`Error creating pattern for ${token.symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Update active patterns with new market data
   */
  private async updateActivePatterns(
    token: { address: string; network: string; symbol: string },
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    timeframe: TimeframeType
  ): Promise<void> {
    // Get all active patterns for this token
    const patterns = Array.from(this.activePatterns.get(timeframe)!.values())
      .filter(p => p.tokenAddress === token.address && p.network === token.network);
    
    for (const pattern of patterns) {
      try {
        // Update pattern with latest data
        const updated = await this.updatePattern(pattern, marketData);
        
        // If pattern is no longer active, remove from active patterns
        if (updated.status === PatternStatus.COMPLETED || updated.status === PatternStatus.INVALIDATED) {
          const patternKey = `${token.address}-${token.network}-${pattern.patternType}`;
          this.activePatterns.get(timeframe)!.delete(patternKey);
        }
      } catch (error) {
        this.logger.error(`Error updating pattern ${pattern._id}:`, error);
      }
    }
  }
  
  /**
   * Update a specific pattern with new market data
   */
  private async updatePattern(
    pattern: IPattern,
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity }
  ): Promise<IPattern> {
    try {
      const latestCandle = marketData.candles[marketData.candles.length - 1];
      
      // Update pattern data
      const updates: Partial<IPattern> = {
        currentPrice: latestCandle.close,
        highestPrice: Math.max(pattern.highestPrice || pattern.initialPrice, latestCandle.high),
        lowestPrice: Math.min(pattern.lowestPrice || pattern.initialPrice, latestCandle.low)
      };
      
      // Add the latest candle data to the price action
      const priceAction = {
        prices: [...pattern.priceAction.prices, latestCandle.close],
        volumes: [...pattern.priceAction.volumes, latestCandle.volume],
        timestamps: [...pattern.priceAction.timestamps, latestCandle.timestamp]
      };
      
      updates.priceAction = priceAction;
      
      // Update smart money activity if available
      if (marketData.smartMoneyActivity) {
        updates.smartMoneyActivity = marketData.smartMoneyActivity;
      }
      
      // Check if pattern is confirmed or invalidated
      let newStatus = pattern.status;
      let outcome: PatternOutcome | undefined;
      
      // Pattern-specific validation rules
      switch (pattern.patternType) {
        case PatternType.BREAKOUT:
          [newStatus, outcome] = this.validateBreakoutPattern(pattern, marketData.candles);
          break;
        case PatternType.V_RECOVERY:
          [newStatus, outcome] = this.validateVRecoveryPattern(pattern, marketData.candles);
          break;
        case PatternType.BULL_FLAG:
          [newStatus, outcome] = this.validateBullFlagPattern(pattern, marketData.candles);
          break;
        case PatternType.ACCUMULATION:
        case PatternType.SMART_MONEY_ACCUMULATION:
          [newStatus, outcome] = this.validateAccumulationPattern(pattern, marketData.candles);
          break;
        case PatternType.CUP_AND_HANDLE:
          [newStatus, outcome] = this.validateCupAndHandlePattern(pattern, marketData.candles);
          break;
        case PatternType.INVERSE_HEAD_SHOULDERS:
          [newStatus, outcome] = this.validateInverseHeadAndShouldersPattern(pattern, marketData.candles);
          break;
        case PatternType.ROUNDED_BOTTOM:
          [newStatus, outcome] = this.validateRoundedBottomPattern(pattern, marketData.candles);
          break;
      }
      
      // Update status and outcome if changed
      if (newStatus !== pattern.status) {
        updates.status = newStatus;
        
        // Log status change
        this.logger.info(`Pattern ${pattern._id} status changed from ${pattern.status} to ${newStatus}`);
        
        // If completed or invalidated, set end time
        if (newStatus === PatternStatus.COMPLETED || newStatus === PatternStatus.INVALIDATED) {
          updates.endTime = new Date();
        }
      }
      
      // Update outcome if we have one
      if (outcome) {
        updates.outcome = outcome;
      }
      
      // Update pattern in database
      await Pattern.findByIdAndUpdate(pattern._id, { $set: updates });
      
      // Return updated pattern
      return {
        ...pattern.toObject(),
        ...updates
      } as IPattern;
    } catch (error) {
      this.logger.error(`Error updating pattern ${pattern._id}:`, error);
      throw error;
    }
  }
  
  /**
   * Find correlations between patterns in different timeframes
   */
  private async findPatternCorrelations(pattern: IPattern): Promise<void> {
    try {
      // Determine the other timeframe
      const otherTimeframe = pattern.timeframe === TimeframeType.FAST ? 
        TimeframeType.SLOW : TimeframeType.FAST;
      
      // Find active patterns for the same token in the other timeframe
      const otherPatterns = Array.from(this.activePatterns.get(otherTimeframe)!.values())
        .filter(p => p.tokenAddress === pattern.tokenAddress && p.network === pattern.network);
      
      for (const otherPattern of otherPatterns) {
        // Determine relationship type
        let relationship: 'confirmation' | 'divergence' | 'continuation' = 'continuation';
        
        // If both patterns suggest same direction, it's confirmation
        if ((this.isUptrendPattern(pattern.patternType) && this.isUptrendPattern(otherPattern.patternType)) ||
            (this.isDowntrendPattern(pattern.patternType) && this.isDowntrendPattern(otherPattern.patternType))) {
          relationship = 'confirmation';
        }
        // If patterns suggest opposite directions, it's divergence
        else if ((this.isUptrendPattern(pattern.patternType) && this.isDowntrendPattern(otherPattern.patternType)) ||
                 (this.isDowntrendPattern(pattern.patternType) && this.isUptrendPattern(otherPattern.patternType))) {
          relationship = 'divergence';
        }
        
        // Update both patterns with the relationship
        await Pattern.updateOne(
          { _id: pattern._id },
          { 
            $push: { 
              relatedPatterns: {
                patternId: otherPattern._id,
                relationship
              }
            }
          }
        );
        
        await Pattern.updateOne(
          { _id: otherPattern._id },
          { 
            $push: { 
              relatedPatterns: {
                patternId: pattern._id,
                relationship
              }
            }
          }
        );
        
        this.logger.debug(`Created ${relationship} relationship between patterns ${pattern._id} and ${otherPattern._id}`);
      }
    } catch (error) {
      this.logger.error(`Error finding pattern correlations for ${pattern._id}:`, error);
    }
  }
  
  // Helper Methods
  
  /**
   * Helper method to determine if pattern typically indicates uptrend
   */
  private isUptrendPattern(patternType: PatternType): boolean {
    const uptrendPatterns = [
      PatternType.BREAKOUT, 
      PatternType.V_RECOVERY, 
      PatternType.BULL_FLAG, 
      PatternType.CUP_AND_HANDLE, 
      PatternType.INVERSE_HEAD_SHOULDERS, 
      PatternType.ROUNDED_BOTTOM, 
      PatternType.ACCUMULATION, 
      PatternType.SMART_MONEY_ACCUMULATION
    ];
    return uptrendPatterns.includes(patternType);
  }
  
  /**
   * Helper method to determine if pattern typically indicates downtrend
   */
  private isDowntrendPattern(patternType: PatternType): boolean {
    // Note: Currently all implemented patterns are uptrend patterns
    // This would include bearish patterns like headAndShoulders, doubleTop, etc.
    return false;
  }
  
  // Pattern Detection Methods
  
  /**
   * Detect breakout pattern
   */
  private detectBreakoutPattern(
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    criteria: PatternCriteria
  ): [boolean, any | null] {
    try {
      const { candles } = marketData;
      
      // Need enough data for detection
      if (candles.length < Number(criteria.maxLookbackPeriods)) {
        return [false, null];
      }
      
      // Calculate Bollinger Bands for volatility and consolidation
      const period = Math.min(candles.length, 14);
      const priceData = candles.map(c => c.close);
      const volumeData = candles.map(c => c.volume);
      
      const sma = ta.SMA.calculate({ period, values: priceData });
      
      const bollingerBands = ta.BollingerBands.calculate({
        period,
        values: priceData,
        stdDev: 2
      });
      
      // Look for consolidation followed by breakout
      const lookbackPeriods = Math.min(Number(criteria.maxLookbackPeriods), candles.length - period);
      let consolidationStart = -1;
      let consolidationEnd = -1;
      
      // Find consolidation period (where price stays within bollinger bands with low volatility)
      for (let i = candles.length - lookbackPeriods; i < candles.length - 2; i++) {
        const bbIndex = i - (candles.length - bollingerBands.length);
        if (bbIndex < 0) continue;
        
        const bandwidth = (bollingerBands[bbIndex].upper - bollingerBands[bbIndex].lower) / bollingerBands[bbIndex].middle;
        
        // Start of consolidation
        if (bandwidth < 0.05 && consolidationStart === -1) {
          consolidationStart = i;
        }
        // End of consolidation
        else if (bandwidth > 0.08 && consolidationStart !== -1 && consolidationEnd === -1) {
          consolidationEnd = i;
          break;
        }
      }
      
      // Check if we found a consolidation period of sufficient length
      if (consolidationStart !== -1 && 
          (consolidationEnd !== -1 || candles.length - consolidationStart >= Number(criteria.minConsolidationPeriods))) {
        
        if (consolidationEnd === -1) {
          consolidationEnd = candles.length - 2;
        }
        
        // Check for breakout in the last candle
        const lastPrice = candles[candles.length - 1].close;
        const consolidationPrices = candles.slice(consolidationStart, consolidationEnd + 1).map(c => c.close);
        const consolidationHigh = Math.max(...consolidationPrices);
        const priceIncrease = (lastPrice - consolidationHigh) / consolidationHigh;
        
        // Calculate average volume during consolidation
        const consolidationVolumes = candles.slice(consolidationStart, consolidationEnd + 1).map(c => c.volume);
        const avgConsolidationVolume = consolidationVolumes.reduce((sum, vol) => sum + vol, 0) / consolidationVolumes.length;
        
        // Check breakout criteria
        if (priceIncrease > Number(criteria.minPriceIncrease) && 
            candles[candles.length - 1].volume > avgConsolidationVolume * Number(criteria.breakoutVolumeMultiplier)) {
          
          // Calculate confidence score
          const confidenceScore = Math.min(100, 
            60 + 
            (priceIncrease / Number(criteria.minPriceIncrease)) * 20 + 
            (candles[candles.length - 1].volume / (avgConsolidationVolume * Number(criteria.breakoutVolumeMultiplier))) * 20
          );
          
          // Calculate target price (based on breakout height)
          const consolidationLow = Math.min(...consolidationPrices);
          const breakoutHeight = consolidationHigh - consolidationLow;
          const targetPrice = lastPrice + breakoutHeight;
          const stopLossPrice = consolidationHigh * 0.98; // 2% below breakout level
          
          // Return pattern data
          return [true, {
            confidence: confidenceScore,
            startTime: candles[consolidationStart].timestamp,
            initialPrice: candles[consolidationStart].close,
            currentPrice: lastPrice,
            targetPrice,
            stopLossPrice,
            prices: candles.slice(consolidationStart).map(c => c.close),
            volumes: candles.slice(consolidationStart).map(c => c.volume),
            timestamps: candles.slice(consolidationStart).map(c => c.timestamp),
            indicators: {
              sma: sma.slice(-10),
              bollingerBands: bollingerBands.slice(-10)
            },
            smartMoneyActivity: marketData.smartMoneyActivity
          }];
        }
      }
      
      return [false, null];
    } catch (error) {
      this.logger.error('Error detecting breakout pattern:', error);
      return [false, null];
    }
  }
  
  // Other pattern detection and validation methods would be implemented here
  // For brevity, I'll include placeholder implementations
  
  private detectVRecoveryPattern(
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    criteria: PatternCriteria
  ): [boolean, any | null] {
    // Implementation would be similar to detectBreakoutPattern
    return [false, null];
  }
  
  private detectBullFlagPattern(
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    criteria: PatternCriteria
  ): [boolean, any | null] {
    // Implementation would be similar to detectBreakoutPattern
    return [false, null];
  }
  
  private detectAccumulationPattern(
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    criteria: PatternCriteria
  ): [boolean, any | null] {
    // Implementation would be similar to detectBreakoutPattern
    return [false, null];
  }
  
  private detectCupAndHandlePattern(
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    criteria: PatternCriteria
  ): [boolean, any | null] {
    // Implementation would be similar to detectBreakoutPattern
    return [false, null];
  }
  
  private detectInverseHeadAndShouldersPattern(
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    criteria: PatternCriteria
  ): [boolean, any | null] {
    // Implementation would be similar to detectBreakoutPattern
    return [false, null];
  }
  
  private detectRoundedBottomPattern(
    marketData: { candles: CandleData[]; smartMoneyActivity?: SmartMoneyActivity },
    criteria: PatternCriteria
  ): [boolean, any | null] {
    // Implementation would be similar to detectBreakoutPattern
    return [false, null];
  }
  
  // Pattern validation methods
  
  private validateBreakoutPattern(pattern: IPattern, candles: CandleData[]): [PatternStatus, PatternOutcome | undefined] {
    const currentPrice = candles[candles.length - 1].close;
    
    // Check if price reached target
    if (pattern.targetPrice && currentPrice >= pattern.targetPrice) {
      return [PatternStatus.COMPLETED, {
        successful: true,
        maxReturn: (currentPrice - pattern.initialPrice) / pattern.initialPrice,
        timeToTarget: new Date().getTime() - pattern.startTime.getTime(),
        notes: 'Target price reached'
      }];
    }
    
    // Check if stop loss triggered
    if (pattern.stopLossPrice && currentPrice <= pattern.stopLossPrice) {
      return [PatternStatus.INVALIDATED, {
        successful: false,
        maxReturn: pattern.highestPrice ? (pattern.highestPrice - pattern.initialPrice) / pattern.initialPrice : 0,
        notes: 'Stop loss triggered'
      }];
    }
    
    // Check if breakout failed (price back below breakout level)
    if (pattern.status === PatternStatus.CONFIRMED && currentPrice < pattern.initialPrice) {
      return [PatternStatus.INVALIDATED, {
        successful: false,
        maxReturn: pattern.highestPrice ? (pattern.highestPrice - pattern.initialPrice) / pattern.initialPrice : 0,
        notes: 'Breakout failed, price returned below breakout level'
      }];
    }
    
    // Update status to confirmed if forming and price continues up
    if (pattern.status === PatternStatus.FORMING && currentPrice > pattern.currentPrice * 1.03) {
      return [PatternStatus.CONFIRMED, undefined];
    }
    
    return [pattern.status, undefined];
  }
  
  private validateVRecoveryPattern(pattern: IPattern, candles: CandleData[]): [PatternStatus, PatternOutcome | undefined] {
    // Similar implementation to validateBreakoutPattern
    return [pattern.status, undefined];
  }
  
  private validateBullFlagPattern(pattern: IPattern, candles: CandleData[]): [PatternStatus, PatternOutcome | undefined] {
    // Similar implementation to validateBreakoutPattern
    return [pattern.status, undefined];
  }
  
  private validateAccumulationPattern(pattern: IPattern, candles: CandleData[]): [PatternStatus, PatternOutcome | undefined] {
    // Similar implementation to validateBreakoutPattern
    return [pattern.status, undefined];
  }
  
  private validateCupAndHandlePattern(pattern: IPattern, candles: CandleData[]): [PatternStatus, PatternOutcome | undefined] {
    // Similar implementation to validateBreakoutPattern
    return [pattern.status, undefined];
  }
  
  private validateInverseHeadAndShouldersPattern(pattern: IPattern, candles: CandleData[]): [PatternStatus, PatternOutcome | undefined] {
    // Similar implementation to validateBreakoutPattern
    return [pattern.status, undefined];
  }
  
  private validateRoundedBottomPattern(pattern: IPattern, candles: CandleData[]): [PatternStatus, PatternOutcome | undefined] {
    // Similar implementation to validateBreakoutPattern
    return [pattern.status, undefined];
  }
  
  // Get tokens to scan - in production this would connect to your discovery or watchlist system
  private async getTokensToScan(timeframe: TimeframeType): Promise<{ address: string; network: string; symbol: string }[]> {
    // Mock implementation - in production, get from database or API
    return [
      { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', network: 'ethereum', symbol: 'UNI' },
      { address: '0x514910771af9ca656af840dff83e8264ecf986ca', network: 'ethereum', symbol: 'LINK' },
      { address: '0x6b175474e89094c44da98b954eedeac495271d0f', network: 'ethereum', symbol: 'DAI' }
    ];
  }
  
  /**
   * Get active patterns with optional filtering
   */
  async getActivePatterns(options: {
    timeframe?: TimeframeType;
    network?: string;
    tokenAddress?: string;
    patternType?: PatternType;
    status?: PatternStatus;
  } = {}): Promise<IPattern[]> {
    const query: any = {};
    
    if (options.timeframe) {
      query.timeframe = options.timeframe;
    }
    
    if (options.network) {
      query.network = options.network;
    }
    
    if (options.tokenAddress) {
      query.tokenAddress = options.tokenAddress;
    }
    
    if (options.patternType) {
      query.patternType = options.patternType;
    }
    
    if (options.status) {
      query.status = options.status;
    } else {
      // Default to only active patterns
      query.status = { $in: [PatternStatus.FORMING, PatternStatus.CONFIRMED] };
    }
    
    return Pattern.find(query).sort({ createdAt: -1 });
  }
  
  /**
   * Get pattern by ID
   */
  async getPatternById(id: string): Promise<IPattern | null> {
    return Pattern.findById(id);
  }
  
  /**
   * Get patterns for a specific token
   */
  async getPatternsByToken(tokenAddress: string, network: string): Promise<IPattern[]> {
    return Pattern.find({
      tokenAddress,
      network
    }).sort({ createdAt: -1 });
  }
  
  /**
   * Get pattern success statistics
   */
  async getPatternStats(): Promise<{
    totalPatterns: number;
    completedPatterns: number;
    successfulPatterns: number;
    successRate: number;
    averageReturn: number;
    statsByType: Record<string, {
      count: number;
      successCount: number;
      successRate: number;
      averageReturn: number;
    }>;
  }> {
    // Get all completed patterns
    const completedPatterns = await Pattern.find({
      status: { $in: [PatternStatus.COMPLETED, PatternStatus.INVALIDATED] }
    });
    
    const totalPatterns = completedPatterns.length;
    const successfulPatterns = completedPatterns.filter(p => 
      p.status === PatternStatus.COMPLETED && p.outcome?.successful
    ).length;
    
    // Calculate average return for successful patterns
    const successfulReturns = completedPatterns
      .filter(p => p.status === PatternStatus.COMPLETED && p.outcome?.successful)
      .map(p => p.outcome?.maxReturn || 0);
    
    const averageReturn = successfulReturns.length > 0 
      ? successfulReturns.reduce((sum, val) => sum + val, 0) / successfulReturns.length
      : 0;
    
    // Calculate stats by pattern type
    const statsByType: Record<string, {
      count: number;
      successCount: number;
      successRate: number;
      averageReturn: number;
    }> = {};
    
    // Group patterns by type
    const patternsByType = completedPatterns.reduce((acc, pattern) => {
      const type = pattern.patternType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(pattern);
      return acc;
    }, {} as Record<string, IPattern[]>);
    
    // Calculate stats for each type
    for (const [type, patterns] of Object.entries(patternsByType)) {
      const typeSuccessfulPatterns = patterns.filter(p => 
        p.status === PatternStatus.COMPLETED && p.outcome?.successful
      );
      
      const typeSuccessfulReturns = typeSuccessfulPatterns.map(p => p.outcome?.maxReturn || 0);
      
      statsByType[type] = {
        count: patterns.length,
        successCount: typeSuccessfulPatterns.length,
        successRate: patterns.length > 0 ? (typeSuccessfulPatterns.length / patterns.length) * 100 : 0,
        averageReturn: typeSuccessfulReturns.length > 0 
          ? typeSuccessfulReturns.reduce((sum, val) => sum + val, 0) / typeSuccessfulReturns.length
          : 0
      };
    }
    
    return {
      totalPatterns,
      completedPatterns: totalPatterns,
      successfulPatterns,
      successRate: totalPatterns > 0 ? (successfulPatterns / totalPatterns) * 100 : 0,
      averageReturn,
      statsByType
    };
  }
  
  /**
   * Manually create a pattern (for backfilling or testing)
   */
  async createManualPattern(patternData: Partial<IPattern>): Promise<IPattern | null> {
    try {
      const requiredFields = [
        'tokenAddress', 'network', 'patternType', 'timeframe', 
        'startTime', 'initialPrice', 'currentPrice'
      ];
      
      for (const field of requiredFields) {
        if (!patternData[field as keyof typeof patternData]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      const newPattern = new Pattern({
        ...patternData,
        status: patternData.status || PatternStatus.FORMING,
        confidence: patternData.confidence || 70,
        priceAction: patternData.priceAction || {
          prices: [patternData.initialPrice],
          volumes: [0],
          timestamps: [patternData.startTime]
        },
        smartMoneyActivity: patternData.smartMoneyActivity || {
          buys: 0,
          sells: 0,
          netBuys: 0,
          walletCount: 0
        },
        tags: patternData.tags || []
      });
      
      const savedPattern = await newPattern.save();
      
      // Add to active patterns if still active
      if (savedPattern.status === PatternStatus.FORMING || savedPattern.status === PatternStatus.CONFIRMED) {
        const patternKey = `${savedPattern.tokenAddress}-${savedPattern.network}-${savedPattern.patternType}`;
        this.activePatterns.get(savedPattern.timeframe)!.set(patternKey, savedPattern);
      }
      
      return savedPattern;
    } catch (error) {
      this.logger.error('Error creating manual pattern:', error);
      return null;
    }
  }
  
  /**
   * Stop pattern scanners
   */
  stop(): void {
    if (this.scanIntervalIds[TimeframeType.FAST]) {
      clearInterval(this.scanIntervalIds[TimeframeType.FAST]!);
      this.scanIntervalIds[TimeframeType.FAST] = null;
    }
    
    if (this.scanIntervalIds[TimeframeType.SLOW]) {
      clearInterval(this.scanIntervalIds[TimeframeType.SLOW]!);
      this.scanIntervalIds[TimeframeType.SLOW] = null;
    }
    
    this.logger.info('Pattern scanners stopped');
  }
}

export default new PatternRecognitionService();