// src/services/edge-calculator-service.ts
import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import patternRecognitionService, { IPattern, PatternStatus, PatternType } from './pattern-recognition-service';
import marketDataService from './market-data-service';
import externalWalletScraper from './external-wallet-scraper';
import rpcConnectionManager from './rpc-connection-manager';
import { config } from '../config';
import { PublicKey } from '@solana/web3.js';

// Types and interfaces
export enum EdgeStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
  REJECTED = 'rejected'
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low',   // 0-20%
  LOW = 'low',             // 21-40%
  MEDIUM = 'medium',       // 41-60%
  HIGH = 'high',           // 61-80%
  VERY_HIGH = 'very_high'  // 81-100%
}

export enum TradeDirection {
  LONG = 'long',
  SHORT = 'short'
}

export interface EdgeFactor {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  metadata?: any;
}

export interface TargetLevel {
  price: number;
  probability: number;
  expectedReturn: number;
  timeframeHours: number;
}

export interface IEdgeCalculation extends Document {
  tokenAddress: string;
  network: string;
  symbol: string;
  timestamp: Date;
  status: EdgeStatus;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  direction: TradeDirection;
  currentPrice: number;
  primaryTarget: TargetLevel;
  secondaryTarget?: TargetLevel;
  stopLoss: number;
  expectedValue: number;
  potentialRisk: number;
  potentialReward: number;
  riskRewardRatio: number;
  kellySizing?: number;
  factors: EdgeFactor[];
  patternIds: mongoose.Types.ObjectId[];
  smartMoneySignals: {
    walletCount: number;
    netBuys: number;
    buyPressure: number;
    metadata?: any;
  };
  marketConditions: {
    liquidityScore: number;
    manipulationScore: number;
    volatilityScore: number;
    marketContext?: any;
    metadata?: any;
  };
  executionDetails?: {
    executedAt?: Date;
    executionPrice?: number;
    outputJson?: string;
  };
  notes?: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema definition
const edgeCalculationSchema = new Schema<IEdgeCalculation>({
  tokenAddress: { type: String, required: true, index: true },
  network: { type: String, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(EdgeStatus),
    default: EdgeStatus.PENDING,
    index: true 
  },
  confidenceLevel: { 
    type: String, 
    required: true,
    enum: Object.values(ConfidenceLevel),
    index: true
  },
  confidenceScore: { type: Number, required: true, min: 0, max: 100 },
  direction: { 
    type: String, 
    required: true, 
    enum: Object.values(TradeDirection)
  },
  currentPrice: { type: Number, required: true },
  primaryTarget: {
    price: { type: Number, required: true },
    probability: { type: Number, required: true },
    expectedReturn: { type: Number, required: true },
    timeframeHours: { type: Number, required: true }
  },
  secondaryTarget: {
    price: { type: Number },
    probability: { type: Number },
    expectedReturn: { type: Number },
    timeframeHours: { type: Number }
  },
  stopLoss: { type: Number, required: true },
  expectedValue: { type: Number, required: true },
  potentialRisk: { type: Number, required: true },
  potentialReward: { type: Number, required: true },
  riskRewardRatio: { type: Number, required: true },
  kellySizing: { type: Number },
  factors: [{
    name: { type: String, required: true },
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    weightedScore: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed }
  }],
  patternIds: [{ type: Schema.Types.ObjectId, ref: 'Pattern' }],
  smartMoneySignals: {
    walletCount: { type: Number, required: true },
    netBuys: { type: Number, required: true },
    buyPressure: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  marketConditions: {
    liquidityScore: { type: Number, required: true },
    manipulationScore: { type: Number, required: true },
    volatilityScore: { type: Number, required: true },
    marketContext: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed }
  },
  executionDetails: {
    executedAt: { type: Date },
    executionPrice: { type: Number },
    outputJson: { type: String }
  },
  notes: { type: String },
  tags: [{ type: String }]
}, { timestamps: true });

// Create model if it doesn't exist yet
const EdgeCalculation: Model<IEdgeCalculation> = mongoose.models.EdgeCalculation as Model<IEdgeCalculation> || 
  mongoose.model<IEdgeCalculation>('EdgeCalculation', edgeCalculationSchema);

class EdgeCalculatorService {
  private logger: winston.Logger;
  private factorWeights: Record<string, number>;
  private minimumConfidenceScore: number;
  private minimumRiskRewardRatio: number;
  private edgeThreshold: number;
  private maxCalculationsPerRun: number;
  private scanIntervalMs: number;
  private scanIntervalId: NodeJS.Timeout | null;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'edge-calculator-service' },
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
    
    // Configure enhanced factor weights for better accuracy
    this.factorWeights = {
      patternConfidence: 22,       // Reduced slightly from 30
      patternType: 8,              // Reduced from 10
      patternTimeframe: 10,
      patternMultiTimeframe: 5,    // New factor for multi-timeframe correlation
      smartMoneyActivity: 20,      // Reduced from 25
      smartMoneyQuality: 5,        // New factor for smart money wallet quality
      marketLiquidity: 5,
      marketManipulation: 10,
      marketVolatility: 5,
      marketMomentum: 5,          // New factor for price momentum
      marketContext: 5,           // New factor for broader market conditions
      historicalSuccess: 5
    };
    
    // Set threshold values (target 74-76% success rate)
    this.minimumConfidenceScore = 62; // Slightly increased from 60
    this.minimumRiskRewardRatio = 2.2; // Increased from 2.0 for better risk management
    this.edgeThreshold = 68; // Slightly increased from 65
    
    // Set scan parameters
    this.maxCalculationsPerRun = 50;
    this.scanIntervalMs = 5 * 60 * 1000; // 5 minutes
    this.scanIntervalId = null;
  }
  
  /**
   * Initialize the edge calculator service
   */
  async init(): Promise<boolean> {
    try {
      // Start scheduled edge calculations
      this.startEdgeCalculator();
      
      this.logger.info('Edge calculator service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize edge calculator service:', error);
      return false;
    }
  }
  
  /**
   * Start the edge calculation scanner
   */
  startEdgeCalculator(): void {
    // Clear any existing interval
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
    }
    
    // Start edge calculator scanner
    this.scanIntervalId = setInterval(() => {
      this.scanForEdgeOpportunities();
    }, this.scanIntervalMs);
    
    this.logger.info('Edge calculator scanner started');
  }
  
  /**
   * Stop the edge calculation scanner
   */
  stopEdgeCalculator(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
    
    this.logger.info('Edge calculator scanner stopped');
  }
  
  /**
   * Scan for new edge calculation opportunities
   * Enhanced with RPC Manager integration
   */
  async scanForEdgeOpportunities(): Promise<void> {
    this.logger.debug('Scanning for edge opportunities');
    
    try {
      // Get active patterns that haven't been processed yet
      const patterns = await patternRecognitionService.getActivePatterns({
        status: PatternStatus.CONFIRMED
      });
      
      // Group patterns by token
      const patternsByToken: Record<string, IPattern[]> = {};
      
      for (const pattern of patterns) {
        const key = `${pattern.tokenAddress}-${pattern.network}`;
        if (!patternsByToken[key]) {
          patternsByToken[key] = [];
        }
        patternsByToken[key].push(pattern);
      }
      
      // Look for additional tokens with high activity using RPC manager's getLatestTokens method
      if (patterns.length < this.maxCalculationsPerRun / 2) {
        try {
          // For Solana, find tokens with recent transactions
          // Use Helius endpoint if available
          if (rpcConnectionManager.isEndpointActive('helius')) {
            // Get tokens with recent mints or high transaction volume
            const recentTokens = await rpcConnectionManager.getLatestTokens(20);
            
            for (const token of recentTokens) {
              // Extract token address from the token object
              const tokenAddress = token.mintAddress;
              if (!tokenAddress) continue;
              
              const network = 'solana';
              const key = `${tokenAddress}-${network}`;
              
              // Skip if we already have patterns for this token
              if (patternsByToken[key]) {
                continue;
              }
              
              // Check token activity level using RPC manager
              const signatures = await rpcConnectionManager.getSignaturesForAddress(tokenAddress, 50);
              
              if (signatures && signatures.length > 20) {
                // High activity token - calculate edge directly
                try {
                  await this.calculateEdge(tokenAddress, network, []);
                } catch (error) {
                  this.logger.error(`Error calculating edge for high activity token ${tokenAddress}:`, error);
                }
              }
            }
          } else {
            // If Helius is not available, use the regular RPC endpoint
            // Look for tokens with high transaction volume using Jupiter API or another method
            const activeTokens = await marketDataService.discoverNewTokens('solana', 10000);
            
            for (const token of activeTokens.slice(0, 10)) { // Limit to top 10
              const key = `${token.address}-${token.network}`;
              
              // Skip if we already have patterns for this token
              if (patternsByToken[key]) {
                continue;
              }
              
              // Check activity level
              const signatures = await rpcConnectionManager.getSignaturesForAddress(token.address, 50);
              
              if (signatures && signatures.length > 20) {
                // High activity token - calculate edge directly
                try {
                  await this.calculateEdge(token.address, token.network, []);
                } catch (error) {
                  this.logger.error(`Error calculating edge for discovered token ${token.address}:`, error);
                }
              }
            }
          }
        } catch (error) {
          this.logger.error('Error finding additional tokens with RPC manager:', error);
        }
      }
      
      // Sort tokens by pattern count (prioritize tokens with more signals)
      const tokenKeys = Object.keys(patternsByToken).sort((a, b) => 
        patternsByToken[b].length - patternsByToken[a].length
      );
      
      // Limit calculations per run
      const tokensToProcess = tokenKeys.slice(0, this.maxCalculationsPerRun);
      
      // Process each token
      for (const tokenKey of tokensToProcess) {
        const [tokenAddress, network] = tokenKey.split('-');
        
        // Check if we already have a recent calculation
        const recentCalculation = await EdgeCalculation.findOne({
          tokenAddress,
          network,
          status: { $in: [EdgeStatus.CALCULATED, EdgeStatus.EXECUTED] },
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });
        
        if (recentCalculation) {
          // Skip if we already have a recent calculation
          continue;
        }
        
        try {
          // Calculate edge for this token
          await this.calculateEdge(tokenAddress, network, patternsByToken[tokenKey]);
        } catch (error) {
          this.logger.error(`Error calculating edge for ${tokenKey}:`, error);
        }
      }
      
      // Expire old calculations
      await this.expireOldCalculations(24);
      
    } catch (error) {
      this.logger.error('Error in edge opportunity scanner:', error);
    }
  }
  
  /**
   * Calculate edge for a specific token
   * Enhanced implementation with multi-timeframe analysis, smart money weighting,
   * and improved mathematical edge calculation
   */
  async calculateEdge(
    tokenAddress: string, 
    network: string, 
    patterns: IPattern[]
  ): Promise<IEdgeCalculation | null> {
    try {
      if (network !== 'solana') {
        this.logger.warn(`Network ${network} not supported for edge calculation`);
        return null;
      }
      
      // Get token metadata and price
      const tokenMetadata = await marketDataService.getTokenMetadata(tokenAddress, network);
      if (!tokenMetadata) {
        this.logger.warn(`Could not get token metadata for ${tokenAddress} on ${network}`);
        return null;
      }
      
      const tokenPrice = await marketDataService.getTokenPrice(tokenAddress, network);
      if (!tokenPrice) {
        this.logger.warn(`Could not get token price for ${tokenAddress} on ${network}`);
        return null;
      }
      
      // 1. Calculate Pattern Factor with enhanced multi-timeframe analysis
      const patternFactor = await this.calculateEnhancedPatternFactor(patterns, tokenAddress, network);
      
      // 2. Calculate Smart Money Factor with more nuanced weighting
      const smartMoneyFactor = await this.calculateEnhancedSmartMoneyFactor(tokenAddress, network);
      
      // 3. Calculate Market Conditions Factor with broader market context
      const marketConditionsFactor = await this.calculateEnhancedMarketConditionsFactor(tokenAddress, network);
      
      // 4. Calculate Historical Success Factor with Bayesian adjustment
      const historicalSuccessFactor = await this.calculateEnhancedHistoricalSuccessFactor(patterns, tokenAddress);
      
      // 5. Calculate Price Action Momentum Factor (new)
      const momentumFactor = await this.calculateMomentumFactor(tokenAddress, network);
      
      // 6. Calculate Market Context Factor (new)
      const marketContextFactor = await this.calculateMarketContextFactor(network);
      
      // Combine all factors
      const factors: EdgeFactor[] = [
        patternFactor,
        smartMoneyFactor,
        marketConditionsFactor,
        historicalSuccessFactor,
        momentumFactor,
        marketContextFactor
      ];
      
      // Calculate overall confidence score with weighted dynamic adjustment
      const rawConfidenceScore = factors.reduce((sum, factor) => sum + factor.weightedScore, 0);
      
      // Apply dynamic adjustment based on factor correlation
      const adjustedConfidenceScore = this.applyDynamicConfidenceAdjustment(rawConfidenceScore, factors);
      
      // Round to one decimal place
      const confidenceScore = Math.round(adjustedConfidenceScore * 10) / 10;
      
      // Determine confidence level
      const confidenceLevel = this.determineConfidenceLevel(confidenceScore);
      
      // Skip if confidence score is too low
      if (confidenceScore < this.minimumConfidenceScore) {
        this.logger.debug(`Skipping edge calculation for ${tokenMetadata.symbol} - confidence too low (${confidenceScore})`);
        return null;
      }
      
      // Determine direction (supporting SHORT trading when appropriate)
      const direction = this.determineTradeDirection(patterns, momentumFactor);
      
      // Calculate targets and stop loss with advanced projection
      const targets = await this.calculateEnhancedTargets(tokenPrice.price, confidenceScore, patterns, tokenAddress, network, direction);
      const stopLoss = await this.calculateEnhancedStopLoss(tokenPrice.price, patterns, tokenAddress, network, direction);
      
      // Calculate risk/reward metrics
      const potentialRisk = direction === TradeDirection.LONG ? 
        tokenPrice.price - stopLoss : 
        stopLoss - tokenPrice.price;
      
      const potentialReward = direction === TradeDirection.LONG ? 
        targets.primaryTarget.price - tokenPrice.price : 
        tokenPrice.price - targets.primaryTarget.price;
      
      const riskRewardRatio = potentialReward / potentialRisk;
      
      // Skip if risk/reward is too low
      if (riskRewardRatio < this.minimumRiskRewardRatio) {
        this.logger.debug(`Skipping edge calculation for ${tokenMetadata.symbol} - risk/reward too low (${riskRewardRatio.toFixed(2)})`);
        return null;
      }
      
      // Calculate expected value using enhanced probability modeling
      const expectedValue = this.calculateEnhancedExpectedValue(
        tokenPrice.price,
        targets.primaryTarget,
        targets.secondaryTarget,
        stopLoss,
        direction
      );
      
      // Apply Kelly Criterion for optimal position sizing
      const kellySizing = this.calculateKellyPosition(
        targets.primaryTarget.probability,
        riskRewardRatio
      );
      
      // Create edge calculation record
      const edge = new EdgeCalculation({
        tokenAddress,
        network,
        symbol: tokenMetadata.symbol,
        timestamp: new Date(),
        status: EdgeStatus.CALCULATED,
        confidenceLevel,
        confidenceScore,
        direction,
        currentPrice: tokenPrice.price,
        primaryTarget: targets.primaryTarget,
        secondaryTarget: targets.secondaryTarget,
        stopLoss,
        expectedValue,
        potentialRisk,
        potentialReward,
        riskRewardRatio,
        kellySizing,
        factors,
        patternIds: patterns.map(p => p._id),
        smartMoneySignals: smartMoneyFactor.metadata,
        marketConditions: {
          ...marketConditionsFactor.metadata,
          marketContext: marketContextFactor.metadata
        },
        tags: [tokenMetadata.symbol, network, ...patterns.map(p => p.patternType)]
      });
      
      // Determine if we have a trade opportunity
      if (confidenceScore >= this.edgeThreshold) {
        edge.notes = `High confidence trade opportunity detected with ${confidenceScore.toFixed(1)}% confidence score and ${riskRewardRatio.toFixed(2)} risk/reward ratio. Kelly criterion suggests ${(kellySizing * 100).toFixed(1)}% position size.`;
      } else {
        edge.notes = `Moderate confidence. Monitor for additional signals. Kelly criterion suggests ${(kellySizing * 100).toFixed(1)}% position size if traded.`;
      }
      
      // Save edge calculation
      await edge.save();
      
      this.logger.info(`Calculated edge for ${tokenMetadata.symbol}: ${confidenceScore.toFixed(1)}% confidence, ${riskRewardRatio.toFixed(2)} R/R ratio, ${(kellySizing * 100).toFixed(1)}% Kelly size`);
      
      return edge;
    } catch (error) {
      this.logger.error(`Error calculating edge for ${tokenAddress} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Enhanced pattern factor calculation with multi-timeframe correlation analysis
   */
  private async calculateEnhancedPatternFactor(
    patterns: IPattern[],
    tokenAddress: string,
    network: string
  ): Promise<EdgeFactor> {
    try {
      // Start with base scores
      let patternConfidenceScore = 0;
      let patternTypeScore = 0;
      let patternTimeframeScore = 0;
      let patternMultiTimeframeScore = 0;
      
      // Pattern confidence factor
      if (patterns.length > 0) {
        // Average confidence across all patterns
        patternConfidenceScore = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
      }
      
      // Improved pattern type weights based on historical performance
      const patternTypeWeights: Record<string, number> = {
        breakout: 0.92,
        vRecovery: 0.82,
        bullFlag: 0.88,
        cupAndHandle: 0.91,
        inverseHeadAndShoulders: 0.86,
        roundedBottom: 0.82,
        accumulation: 0.78,
        smartMoneyAccumulation: 0.96,
        // Add support for bearish patterns
        headAndShoulders: 0.84,
        doubleTop: 0.87,
        bearishChannel: 0.81,
        wedgeDown: 0.83
      };
      
      let totalTypeWeight = 0;
      for (const pattern of patterns) {
        totalTypeWeight += patternTypeWeights[pattern.patternType] || 0.75;
      }
      
      if (patterns.length > 0) {
        patternTypeScore = (totalTypeWeight / patterns.length) * 100;
      }
      
      // Pattern timeframe analysis - higher score for multiple timeframes
      const timeframes = new Set(patterns.map(p => p.timeframe));
      
      // Basic timeframe score
      patternTimeframeScore = timeframes.size > 1 ? 90 : 60;
      
      // Enhanced multi-timeframe correlation analysis
      if (timeframes.size > 1) {
        // Check for patterns at multiple timeframes
        const timeframeGroups: Record<string, IPattern[]> = {};
        
        // Group patterns by timeframe
        for (const pattern of patterns) {
          if (!timeframeGroups[pattern.timeframe]) {
            timeframeGroups[pattern.timeframe] = [];
          }
          timeframeGroups[pattern.timeframe].push(pattern);
        }
        
        // Check if different timeframes show similar patterns
        // (higher score for consistent patterns across timeframes)
        const patternTypes = new Set<string>();
        Object.values(timeframeGroups).forEach(group => {
          group.forEach(pattern => patternTypes.add(pattern.patternType));
        });
        
        // Analyze consistency between timeframes
        // If same pattern types appear across multiple timeframes, it's very bullish
        if (patternTypes.size === 1) {
          // Same pattern across all timeframes - highest score
          patternMultiTimeframeScore = 100;
        } else if (patternTypes.size < timeframes.size) {
          // Some consistency in patterns - high score
          patternMultiTimeframeScore = 85;
        } else {
          // Different patterns at different timeframes - moderate score
          patternMultiTimeframeScore = 70;
        }
        
        // If we have no patterns, but the token has activity, check for lower timeframe patterns
        if (patterns.length === 0) {
          // Query for additional patterns in smaller timeframes
          const smallTimeframePatterns = await patternRecognitionService.detectPatterns(
            tokenAddress,
            network,
            ['1m', '5m', '15m'] // Small timeframes
          );
          
          if (smallTimeframePatterns && smallTimeframePatterns.length > 0) {
            patternMultiTimeframeScore = 50; // Lower score, but still consider these patterns
          }
        }
      } else if (patterns.length > 0) {
        // Single timeframe - lower but still valid score
        patternMultiTimeframeScore = 60;
      }
      
      // Calculate weighted scores
      const patternConfidenceWeightedScore = patternConfidenceScore * (this.factorWeights.patternConfidence / 100);
      const patternTypeWeightedScore = patternTypeScore * (this.factorWeights.patternType / 100);
      const patternTimeframeWeightedScore = patternTimeframeScore * (this.factorWeights.patternTimeframe / 100);
      const patternMultiTimeframeWeightedScore = patternMultiTimeframeScore * (this.factorWeights.patternMultiTimeframe / 100);
      
      // Combine into a single pattern factor
      const patternFactorScore = patternConfidenceWeightedScore + 
                                patternTypeWeightedScore + 
                                patternTimeframeWeightedScore + 
                                patternMultiTimeframeWeightedScore;
                                
      const patternFactorWeight = this.factorWeights.patternConfidence + 
                                this.factorWeights.patternType + 
                                this.factorWeights.patternTimeframe +
                                this.factorWeights.patternMultiTimeframe;
                                
      // Calculate final weighted score
      const patternFactorWeightedScore = (patternFactorScore / 4) * (patternFactorWeight / 100);
      
      return {
        name: 'Pattern Analysis',
        score: patternFactorScore / 4, // Normalize to 0-100 scale
        weight: patternFactorWeight,
        weightedScore: patternFactorWeightedScore,
        metadata: {
          patternCount: patterns.length,
          timeframes: Array.from(timeframes),
          patternTypes: patterns.map(p => p.patternType),
          patternConfidences: patterns.map(p => p.confidence),
          multiTimeframeScore: patternMultiTimeframeScore
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating enhanced pattern factor:`, error);
      
      // Return a default factor if there's an error
      return {
        name: 'Pattern Analysis',
        score: patterns.length > 0 ? 60 : 40,
        weight: this.factorWeights.patternConfidence + 
                this.factorWeights.patternType + 
                this.factorWeights.patternTimeframe +
                this.factorWeights.patternMultiTimeframe,
        weightedScore: (patterns.length > 0 ? 60 : 40) * 
                      ((this.factorWeights.patternConfidence + 
                        this.factorWeights.patternType + 
                        this.factorWeights.patternTimeframe +
                        this.factorWeights.patternMultiTimeframe) / 100),
        metadata: {
          patternCount: patterns.length,
          timeframes: Array.from(new Set(patterns.map(p => p.timeframe))),
          patternTypes: patterns.map(p => p.patternType)
        }
      };
    }
  }
  
  /**
   * Enhanced smart money factor with wallet quality assessment
   */
  private async calculateEnhancedSmartMoneyFactor(
    tokenAddress: string, 
    network: string
  ): Promise<EdgeFactor> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network for smart money analysis: ${network}`);
      }
      
      // Get smart wallets from external wallet scraper service
      const smartWallets = await externalWalletScraper.getSmartWallets(network);
      
      if (!smartWallets || smartWallets.length === 0) {
        this.logger.warn('No smart wallets available for analysis');
        
        // Return a default factor if no smart wallets data
        return {
          name: 'Smart Money Activity',
          score: 50, // Neutral score
          weight: this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality,
          weightedScore: 50 * ((this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality) / 100),
          metadata: {
            walletCount: 0,
            buys: 0,
            sells: 0,
            netBuys: 0,
            buyPressure: 50,
            walletQuality: {
              highPerformers: 0,
              mediumPerformers: 0,
              lowPerformers: 0
            }
          }
        };
      }
      
      // Track activity from smart wallets for this token
      let walletCount = 0;
      let totalBuys = 0;
      let totalSells = 0;
      
      // Enhanced wallet quality assessment
      let highPerformerCount = 0;
      let mediumPerformerCount = 0;
      let lowPerformerCount = 0;
      
      // Track token amount changes more precisely
      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      
      // Track timing of smart money activity
      const recentActivityTimestamps: number[] = [];
      
      for (const wallet of smartWallets) {
        try {
          // Use performance rating to categorize wallets (high, medium, low performers)
          if (wallet.performanceRating >= 8) {
            highPerformerCount++;
          } else if (wallet.performanceRating >= 6) {
            mediumPerformerCount++;
          } else {
            lowPerformerCount++;
          }
          
          // Get token accounts for this wallet using RPC manager
          const tokenAccounts = await rpcConnectionManager.getTokenAccountsByOwner(wallet.address);
          
          // Check if wallet holds the token
          const hasToken = tokenAccounts.some(account => 
            account.account?.data?.parsed?.info?.mint === tokenAddress && 
            parseFloat(account.account?.data?.parsed?.info?.tokenAmount?.uiAmount || '0') > 0
          );
          
          if (hasToken) {
            walletCount++;
          }
          
          // Get recent transactions for this wallet to find buys/sells
          const signatures = await rpcConnectionManager.getSignaturesForAddress(wallet.address, 50);
          
          if (signatures && signatures.length > 0) {
            for (const sig of signatures) {
              try {
                // Track timestamps for recency analysis
                if (sig.blockTime) {
                  recentActivityTimestamps.push(sig.blockTime);
                }
                
                const tx = await rpcConnectionManager.getTransaction(sig.signature);
                
                if (tx && this.isTransactionInvolvingToken(tx, tokenAddress)) {
                  // Determine if this was a buy or sell
                  const isBuy = this.isTokenBuyTransaction(tx, wallet.address, tokenAddress);
                  const isSell = this.isTokenSellTransaction(tx, wallet.address, tokenAddress);
                  
                  if (isBuy) {
                    totalBuys++;
                    // Try to extract the amount bought
                    const amount = this.extractTokenAmount(tx, tokenAddress);
                    if (amount > 0) {
                      totalBuyAmount += amount;
                    }
                  }
                  
                  if (isSell) {
                    totalSells++;
                    // Try to extract the amount sold
                    const amount = this.extractTokenAmount(tx, tokenAddress);
                    if (amount > 0) {
                      totalSellAmount += amount;
                    }
                  }
                }
              } catch (e) {
                // Skip errors for individual transactions
              }
            }
          }
        } catch (error) {
          this.logger.debug(`Error analyzing smart wallet ${wallet.address}:`, error);
        }
      }
      
      // Create smart money activity data with enhanced metrics
      const smartMoneyActivity = {
        walletCount,
        buys: totalBuys,
        sells: totalSells,
        netBuys: totalBuys - totalSells,
        buyPressure: 0,
        buyAmount: totalBuyAmount,
        sellAmount: totalSellAmount,
        netAmount: totalBuyAmount - totalSellAmount,
        walletQuality: {
          highPerformers: highPerformerCount,
          mediumPerformers: mediumPerformerCount,
          lowPerformers: lowPerformerCount
        },
        recencyScore: 0 // Will calculate below
      };
      
      // Calculate buy pressure (ratio of buys to total transactions)
      const totalTransactions = totalBuys + totalSells;
      smartMoneyActivity.buyPressure = totalTransactions > 0 ? 
        (totalBuys / totalTransactions) * 100 : 50;
      
      // Calculate recency score - more recent activity gets higher score
      if (recentActivityTimestamps.length > 0) {
        // Sort timestamps (most recent first)
        recentActivityTimestamps.sort((a, b) => b - a);
        
        // Calculate how recent the activity is (0-100 scale)
        const now = Math.floor(Date.now() / 1000);
        const mostRecent = recentActivityTimestamps[0];
        const hoursSinceLastActivity = (now - mostRecent) / 3600;
        
        // Score based on recency (higher score for more recent activity)
        // Within 1 hour = 100, 24 hours = 75, 48 hours = 50, 72 hours = 25, older = 0
        if (hoursSinceLastActivity <= 1) {
          smartMoneyActivity.recencyScore = 100;
        } else if (hoursSinceLastActivity <= 24) {
          smartMoneyActivity.recencyScore = 75 + (24 - hoursSinceLastActivity) / 24 * 25;
        } else if (hoursSinceLastActivity <= 48) {
          smartMoneyActivity.recencyScore = 50 + (48 - hoursSinceLastActivity) / 24 * 25;
        } else if (hoursSinceLastActivity <= 72) {
          smartMoneyActivity.recencyScore = 25 + (72 - hoursSinceLastActivity) / 24 * 25;
        } else {
          smartMoneyActivity.recencyScore = Math.max(0, 25 - (hoursSinceLastActivity - 72) / 24 * 5);
        }
      }
      
      // Calculate smart money activity score (0-100)
      let smartMoneyActivityScore = 0;
      
      // Score based on wallet count (more smart wallets = higher score)
      if (smartMoneyActivity.walletCount >= 8) {
        smartMoneyActivityScore += 100;
      } else if (smartMoneyActivity.walletCount >= 5) {
        smartMoneyActivityScore += 80;
      } else if (smartMoneyActivity.walletCount >= 3) {
        smartMoneyActivityScore += 60;
      } else if (smartMoneyActivity.walletCount >= 1) {
        smartMoneyActivityScore += 40;
      }
      
      // Score based on buy pressure (more buying = higher score)
      if (smartMoneyActivity.buyPressure >= 90) {
        smartMoneyActivityScore += 100;
      } else if (smartMoneyActivity.buyPressure >= 75) {
        smartMoneyActivityScore += 80;
      } else if (smartMoneyActivity.buyPressure >= 60) {
        smartMoneyActivityScore += 60;
      } else if (smartMoneyActivity.buyPressure >= 50) {
        smartMoneyActivityScore += 40;
      } else {
        smartMoneyActivityScore += 0; // Less than 50% buy pressure is negative
      }
      
      // Score based on recency (more recent = higher score)
      smartMoneyActivityScore += smartMoneyActivity.recencyScore;
      
      // Average the scores
      smartMoneyActivityScore = smartMoneyActivityScore / 3;
      
      // Calculate wallet quality score (0-100)
      let walletQualityScore = 0;
      
      // Weight high performers more heavily
      const weightedWalletCount = (highPerformerCount * 3) + (mediumPerformerCount * 1.5) + lowPerformerCount;
      const totalQualityWalletCount = highPerformerCount + mediumPerformerCount + lowPerformerCount;
      
      if (totalQualityWalletCount > 0) {
        // Score based on average weighted quality of wallets involved
        walletQualityScore = (weightedWalletCount / totalQualityWalletCount) * 33.33; // Scale to 0-100
      }
      
      // Add points for each high performer involved
      if (highPerformerCount >= 3) {
        walletQualityScore += 50;
      } else if (highPerformerCount >= 2) {
        walletQualityScore += 35;
      } else if (highPerformerCount >= 1) {
        walletQualityScore += 20;
      }
      
      // Add points for medium performers (but less than high performers)
      if (mediumPerformerCount >= 4) {
        walletQualityScore += 25;
      } else if (mediumPerformerCount >= 2) {
        walletQualityScore += 15;
      } else if (mediumPerformerCount >= 1) {
        walletQualityScore += 5;
      }
      
      // Cap the quality score at 100
      walletQualityScore = Math.min(100, walletQualityScore);
      
      // Calculate weighted scores
      const smartMoneyActivityWeightedScore = smartMoneyActivityScore * (this.factorWeights.smartMoneyActivity / 100);
      const walletQualityWeightedScore = walletQualityScore * (this.factorWeights.smartMoneyQuality / 100);
      
      // Calculate combined score and weight
      const smartMoneyScore = (smartMoneyActivityScore * (this.factorWeights.smartMoneyActivity / 100) + 
                              walletQualityScore * (this.factorWeights.smartMoneyQuality / 100)) / 
                              ((this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality) / 100);
                              
      const smartMoneyWeight = this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality;
      const smartMoneyWeightedScore = smartMoneyScore * (smartMoneyWeight / 100);
      
      return {
        name: 'Smart Money Activity',
        score: smartMoneyScore,
        weight: smartMoneyWeight,
        weightedScore: smartMoneyWeightedScore,
        metadata: {
          ...smartMoneyActivity,
          activityScore: smartMoneyActivityScore,
          qualityScore: walletQualityScore
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating enhanced smart money factor for ${tokenAddress} on ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Smart Money Activity',
        score: 50, // Neutral score
        weight: this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality,
        weightedScore: 50 * ((this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality) / 100),
        metadata: {
          walletCount: 0,
          buys: 0,
          sells: 0,
          netBuys: 0,
          buyPressure: 50,
          walletQuality: {
            highPerformers: 0,
            mediumPerformers: 0,
            lowPerformers: 0
          }
        }
      };
    }
  }
  
  /**
   * Extract token amount from a transaction
   */
  private extractTokenAmount(tx: any, tokenAddress: string): number {
    try {
      if (tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
        // Find the token balances
        const preTokenBalances = tx.meta.preTokenBalances.filter((b: any) => b.mint === tokenAddress);
        const postTokenBalances = tx.meta.postTokenBalances.filter((b: any) => b.mint === tokenAddress);
        
        if (preTokenBalances.length > 0 && postTokenBalances.length > 0) {
          // Calculate total change across all accounts
          let preTotalAmount = 0;
          let postTotalAmount = 0;
          
          for (const balance of preTokenBalances) {
            preTotalAmount += parseFloat(balance.uiTokenAmount?.uiAmount || '0');
          }
          
          for (const balance of postTokenBalances) {
            postTotalAmount += parseFloat(balance.uiTokenAmount?.uiAmount || '0');
          }
          
          // Return absolute value of the change
          return Math.abs(postTotalAmount - preTotalAmount);
        }
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Enhanced market conditions factor with advanced metrics
   */
  private async calculateEnhancedMarketConditionsFactor(
    tokenAddress: string,
    network: string
  ): Promise<EdgeFactor> {
    try {
      // Get liquidity data
      const liquidityDistribution = await marketDataService.getTokenLiquidity(tokenAddress, network);
      const totalLiquidity = liquidityDistribution ? 
        liquidityDistribution.reduce((sum, item) => sum + item.liquidityUSD, 0) : 0;
      
      // Calculate manipulation score using RPC manager-enhanced methods
      const manipulationScore = await marketDataService.calculateManipulationScore(tokenAddress, network) || 50;
      
      // Get market data for volatility calculation (multiple timeframes)
      const marketHistory15m = await marketDataService.getMarketHistory(tokenAddress, network, '15m', 96); // 24 hours in 15m
      const marketHistory1h = await marketDataService.getMarketHistory(tokenAddress, network, '1h', 48); // 48 hours in 1h
      const marketHistory4h = await marketDataService.getMarketHistory(tokenAddress, network, '4h', 42); // 7 days in 4h
      
      // Calculate volatility score with enhanced multi-timeframe approach
      let volatilityScore = this.calculateEnhancedVolatilityScore(
        marketHistory15m || [],
        marketHistory1h || [],
        marketHistory4h || []
      );
      
      // Calculate liquidity distribution score - penalize if liquidity is too concentrated
      let liquidityDistributionScore = 100; // Start with perfect score
      if (liquidityDistribution && liquidityDistribution.length > 0) {
        // Calculate concentration metrics
        const topExchangePercentage = liquidityDistribution[0].percentage;
        
        // Penalize if too concentrated in one exchange
        if (topExchangePercentage > 90) {
          liquidityDistributionScore = 60; // Severe concentration
        } else if (topExchangePercentage > 80) {
          liquidityDistributionScore = 70; // High concentration
        } else if (topExchangePercentage > 70) {
          liquidityDistributionScore = 80; // Moderate concentration
        } else if (topExchangePercentage > 60) {
          liquidityDistributionScore = 90; // Slight concentration
        }
        
        // Additional penalty if very few exchanges
        if (liquidityDistribution.length === 1) {
          liquidityDistributionScore -= 20; // Single exchange
        } else if (liquidityDistribution.length === 2) {
          liquidityDistributionScore -= 10; // Only two exchanges
        }
      }
      
      // Calculate liquidity score with more granular tiers
      let liquidityScore = 0;
      
      if (totalLiquidity >= 2000000) { // $2M+
        liquidityScore = 100;
      } else if (totalLiquidity >= 1000000) { // $1M+
        liquidityScore = 90;
      } else if (totalLiquidity >= 500000) { // $500K+
        liquidityScore = 80;
      } else if (totalLiquidity >= 250000) { // $250K+
        liquidityScore = 70;
      } else if (totalLiquidity >= 100000) { // $100K+
        liquidityScore = 60;
      } else if (totalLiquidity >= 50000) { // $50K+
        liquidityScore = 50;
      } else if (totalLiquidity >= 25000) { // $25K+
        liquidityScore = 40;
      } else if (totalLiquidity >= 10000) { // $10K+
        liquidityScore = 30;
      } else if (totalLiquidity > 0) {
        liquidityScore = 20;
      }
      
      // Manipulation penalty (higher score = more manipulation = bad)
      // Invert so higher is better
      const manipulationFactor = Math.max(0, 100 - manipulationScore);
      
      // Calculate combined liquidity score (blend of amount and distribution)
      const combinedLiquidityScore = (liquidityScore * 0.7) + (liquidityDistributionScore * 0.3);
      
      // Calculate overall market conditions score
      const marketLiquidityWeightedScore = combinedLiquidityScore * (this.factorWeights.marketLiquidity / 100);
      const marketManipulationWeightedScore = manipulationFactor * (this.factorWeights.marketManipulation / 100);
      const marketVolatilityWeightedScore = volatilityScore * (this.factorWeights.marketVolatility / 100);
      
      const marketConditionsScore = marketLiquidityWeightedScore + marketManipulationWeightedScore + marketVolatilityWeightedScore;
      const marketConditionsWeight = this.factorWeights.marketLiquidity + this.factorWeights.marketManipulation + this.factorWeights.marketVolatility;
      const marketConditionsWeightedScore = marketConditionsScore * (marketConditionsWeight / 100);
      
      return {
        name: 'Market Conditions',
        score: marketConditionsScore,
        weight: marketConditionsWeight,
        weightedScore: marketConditionsWeightedScore,
        metadata: {
          liquidityScore: combinedLiquidityScore,
          manipulationScore: manipulationFactor,
          volatilityScore,
          totalLiquidityUSD: totalLiquidity,
          liquidityDistribution: liquidityDistribution ? liquidityDistribution.slice(0, 3) : [],
          liquidityDistributionScore
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating enhanced market conditions factor for ${tokenAddress} on ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Market Conditions',
        score: 50, // Neutral score
        weight: this.factorWeights.marketLiquidity + this.factorWeights.marketManipulation + this.factorWeights.marketVolatility,
        weightedScore: 50 * ((this.factorWeights.marketLiquidity + this.factorWeights.marketManipulation + this.factorWeights.marketVolatility) / 100),
        metadata: {
          liquidityScore: 50,
          manipulationScore: 50,
          volatilityScore: 50,
          totalLiquidityUSD: 0
        }
      };
    }
  }
  
  /**
   * Enhanced volatility score calculation with multi-timeframe analysis
   */
  private calculateEnhancedVolatilityScore(
    shortCandles: any[], // 15m
    mediumCandles: any[], // 1h
    longCandles: any[] // 4h
  ): number {
    try {
      // Default score if no data available
      if (shortCandles.length === 0 && mediumCandles.length === 0 && longCandles.length === 0) {
        return 50; // Neutral score
      }
      
      // Calculate volatility for each timeframe
      const shortVolatility = this.calculateTimeframeVolatility(shortCandles);
      const mediumVolatility = this.calculateTimeframeVolatility(mediumCandles);
      const longVolatility = this.calculateTimeframeVolatility(longCandles);
      
      // Weight volatilities (more weight to longer timeframes)
      let weightedVolatility = 0;
      let totalWeight = 0;
      
      if (shortVolatility !== null) {
        weightedVolatility += shortVolatility * 1;
        totalWeight += 1;
      }
      
      if (mediumVolatility !== null) {
        weightedVolatility += mediumVolatility * 2;
        totalWeight += 2;
      }
      
      if (longVolatility !== null) {
        weightedVolatility += longVolatility * 3;
        totalWeight += 3;
      }
      
      // Calculate average weighted volatility
      const avgVolatility = totalWeight > 0 ? weightedVolatility / totalWeight : 2; // Default to 2 if no data
      
      // Score based on volatility (moderate volatility is best)
      let volatilityScore = 0;
      
      if (avgVolatility < 0.5) {
        volatilityScore = 40; // Too low volatility
      } else if (avgVolatility < 1.5) {
        volatilityScore = 60; // Low volatility
      } else if (avgVolatility < 3) {
        volatilityScore = 90; // Moderate volatility (good)
      } else if (avgVolatility < 5) {
        volatilityScore = 70; // Moderately high volatility
      } else if (avgVolatility < 8) {
        volatilityScore = 50; // High volatility
      } else if (avgVolatility < 12) {
        volatilityScore = 30; // Very high volatility
      } else {
        volatilityScore = 10; // Extremely high volatility
      }
      
      return volatilityScore;
    } catch (error) {
      // Return neutral score on error
      return 50;
    }
  }
  
  /**
   * Calculate volatility for a specific timeframe
   */
  private calculateTimeframeVolatility(candles: any[]): number | null {
    if (!candles || candles.length < 5) {
      return null; // Not enough data
    }
    
    try {
      // Calculate price changes
      const priceChanges = [];
      for (let i = 1; i < candles.length; i++) {
        const percentChange = ((candles[i].close - candles[i-1].close) / candles[i-1].close) * 100;
        priceChanges.push(Math.abs(percentChange)); // Use absolute value
      }
      
      // Calculate average volatility
      const avgVolatility = priceChanges.reduce((sum, val) => sum + val, 0) / priceChanges.length;
      
      return avgVolatility;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Calculate enhanced historical success factor with Bayesian adjustment
   */
  private async calculateEnhancedHistoricalSuccessFactor(
    patterns: IPattern[],
    tokenAddress: string
  ): Promise<EdgeFactor> {
    try {
      // Get pattern statistics
      const patternStats = await patternRecognitionService.getPatternStats();
      
      // Get token-specific historical performance
      const tokenHistory = await this.getTokenTradingHistory(tokenAddress);
      
      if (!patternStats || patternStats.totalPatterns === 0) {
        // No historical data available
        return {
          name: 'Historical Success',
          score: 50, // Neutral score
          weight: this.factorWeights.historicalSuccess,
          weightedScore: 50 * (this.factorWeights.historicalSuccess / 100),
          metadata: {
            overallSuccessRate: 0,
            patternTypeSuccessRates: {},
            tokenSpecificSuccessRate: 0
          }
        };
      }
      
      // Calculate historical success score based on pattern types
      let totalTypeSuccessRate = 0;
      let patternCount = 0;
      const patternTypeSuccessRates: Record<string, number> = {};
      
      for (const pattern of patterns) {
        if (patternStats.statsByType[pattern.patternType]) {
          const typeStats = patternStats.statsByType[pattern.patternType];
          const successRate = typeStats.successRate;
          
          patternTypeSuccessRates[pattern.patternType] = successRate;
          totalTypeSuccessRate += successRate;
          patternCount++;
        }
      }
      
      // Calculate average success rate
      const globalSuccessRate = patternStats.successRate;
      const patternSpecificSuccessRate = patternCount > 0 ? totalTypeSuccessRate / patternCount : globalSuccessRate;
      
      // Apply Bayesian adjustment if we have token-specific history
      let bayesianSuccessRate = patternSpecificSuccessRate;
      
      if (tokenHistory && tokenHistory.tradeCount > 0) {
        // Weight the token-specific data based on sample size
        const tokenWeight = Math.min(0.5, tokenHistory.tradeCount / 10); // Max 50% weight for token history
        const patternWeight = 1 - tokenWeight;
        
        // Blend token-specific and pattern-specific success rates
        bayesianSuccessRate = (tokenHistory.successRate * tokenWeight) + 
                              (patternSpecificSuccessRate * patternWeight);
      }
      
      // Map success rate to score (0-100)
      const historicalSuccessScore = Math.min(100, bayesianSuccessRate);
      
      // Calculate weighted score
      const historicalSuccessWeightedScore = historicalSuccessScore * (this.factorWeights.historicalSuccess / 100);
      
      return {
        name: 'Historical Success',
        score: historicalSuccessScore,
        weight: this.factorWeights.historicalSuccess,
        weightedScore: historicalSuccessWeightedScore,
        metadata: {
          overallSuccessRate: patternStats.successRate,
          patternTypeSuccessRates,
          tokenSpecificSuccessRate: tokenHistory ? tokenHistory.successRate : 0,
          tokenTradeCount: tokenHistory ? tokenHistory.tradeCount : 0,
          bayesianSuccessRate
        }
      };
    } catch (error) {
      this.logger.error('Error calculating enhanced historical success factor:', error);
      
      // Return default factor on error
      return {
        name: 'Historical Success',
        score: 50, // Neutral score
        weight: this.factorWeights.historicalSuccess,
        weightedScore: 50 * (this.factorWeights.historicalSuccess / 100),
        metadata: {
          overallSuccessRate: 0,
          patternTypeSuccessRates: {},
          tokenSpecificSuccessRate: 0
        }
      };
    }
  }
  
  /**
   * Get token-specific trading history
   */
  private async getTokenTradingHistory(tokenAddress: string): Promise<{
    successRate: number;
    tradeCount: number;
    profitFactor: number;
  } | null> {
    try {
      // Query historical edge calculations for this token
      const history = await EdgeCalculation.find({
        tokenAddress,
        status: EdgeStatus.EXECUTED
      });
      
      if (!history || history.length === 0) {
        return null; // No history available
      }
      
      // Calculate success metrics
      let successCount = 0;
      let totalProfit = 0;
      let totalLoss = 0;
      
      for (const trade of history) {
        if (!trade.executionDetails || !trade.executionDetails.executionPrice) continue;
        
        const entryPrice = trade.executionDetails.executionPrice;
        const targetPrice = trade.primaryTarget.price;
        const stopLossPrice = trade.stopLoss;
        
        // Determine if trade was successful (hit target before stop loss)
        // For simplicity, assume yes if this trade is in executed status
        // In a real implementation, you would track the actual outcome
        if (trade.direction === TradeDirection.LONG) {
          const profit = (targetPrice - entryPrice) / entryPrice;
          const loss = (entryPrice - stopLossPrice) / entryPrice;
          
          if (profit > 0) {
            successCount++;
            totalProfit += profit;
          } else {
            totalLoss += loss;
          }
        } else {
          // Short trade
          const profit = (entryPrice - targetPrice) / entryPrice;
          const loss = (stopLossPrice - entryPrice) / entryPrice;
          
          if (profit > 0) {
            successCount++;
            totalProfit += profit;
          } else {
            totalLoss += loss;
          }
        }
      }
      
      const successRate = (successCount / history.length) * 100;
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit;
      
      return {
        successRate,
        tradeCount: history.length,
        profitFactor
      };
    } catch (error) {
      this.logger.error(`Error getting token trading history for ${tokenAddress}:`, error);
      return null;
    }
  }
  
  /**
   * Calculate momentum factor (price action analysis)
   */
  private async calculateMomentumFactor(
    tokenAddress: string,
    network: string
  ): Promise<EdgeFactor> {
    try {
      // Get market history at multiple timeframes
      const shortTerm = await marketDataService.getMarketHistory(tokenAddress, network, '15m', 20); // Last 5 hours
      const mediumTerm = await marketDataService.getMarketHistory(tokenAddress, network, '1h', 24); // Last day
      const longTerm = await marketDataService.getMarketHistory(tokenAddress, network, '4h', 42); // Last week
      
      // Calculate momentum metrics
      const momentumMetrics = {
        shortTerm: this.calculateMomentumMetrics(shortTerm || []),
        mediumTerm: this.calculateMomentumMetrics(mediumTerm || []),
        longTerm: this.calculateMomentumMetrics(longTerm || []),
        direction: 'neutral' as 'bullish' | 'bearish' | 'neutral',
        strength: 0,
        divergence: false
      };
      
      // Determine overall momentum direction and strength
      let momentumScore = 50; // Start with neutral score
      
      // Short-term momentum (highest weight)
      if (momentumMetrics.shortTerm) {
        if (momentumMetrics.shortTerm.direction === 'bullish') {
          momentumScore += 20;
        } else if (momentumMetrics.shortTerm.direction === 'bearish') {
          momentumScore -= 20;
        }
        
        // Add strength component
        momentumScore += momentumMetrics.shortTerm.strength * 0.2;
      }
      
      // Medium-term momentum
      if (momentumMetrics.mediumTerm) {
        if (momentumMetrics.mediumTerm.direction === 'bullish') {
          momentumScore += 15;
        } else if (momentumMetrics.mediumTerm.direction === 'bearish') {
          momentumScore -= 15;
        }
        
        // Add strength component
        momentumScore += momentumMetrics.mediumTerm.strength * 0.15;
      }
      
      // Long-term momentum
      if (momentumMetrics.longTerm) {
        if (momentumMetrics.longTerm.direction === 'bullish') {
          momentumScore += 10;
        } else if (momentumMetrics.longTerm.direction === 'bearish') {
          momentumScore -= 10;
        }
        
        // Add strength component
        momentumScore += momentumMetrics.longTerm.strength * 0.1;
      }
      
      // Check for momentum divergence (bullish or bearish)
      let divergence = false;
      
      if (momentumMetrics.shortTerm && momentumMetrics.mediumTerm) {
        // Bullish divergence: Price making lower lows but momentum making higher lows
        if (momentumMetrics.shortTerm.price < momentumMetrics.mediumTerm.price &&
            momentumMetrics.shortTerm.rsi > momentumMetrics.mediumTerm.rsi) {
          divergence = true;
          momentumScore += 10; // Bonus for bullish divergence
          momentumMetrics.divergence = true;
        }
        
        // Bearish divergence: Price making higher highs but momentum making lower highs
        if (momentumMetrics.shortTerm.price > momentumMetrics.mediumTerm.price &&
            momentumMetrics.shortTerm.rsi < momentumMetrics.mediumTerm.rsi) {
          divergence = true;
          momentumScore -= 10; // Penalty for bearish divergence
          momentumMetrics.divergence = true;
        }
      }
      
      // Cap momentum score between 0-100
      momentumScore = Math.max(0, Math.min(100, momentumScore));
      
      // Set overall direction
      if (momentumScore >= 60) {
        momentumMetrics.direction = 'bullish';
      } else if (momentumScore <= 40) {
        momentumMetrics.direction = 'bearish';
      } else {
        momentumMetrics.direction = 'neutral';
      }
      
      // Set overall strength (0-10 scale)
      momentumMetrics.strength = Math.abs((momentumScore - 50) / 5);
      
      // Calculate weighted score
      const momentumWeightedScore = momentumScore * (this.factorWeights.marketMomentum / 100);
      
      return {
        name: 'Price Momentum',
        score: momentumScore,
        weight: this.factorWeights.marketMomentum,
        weightedScore: momentumWeightedScore,
        metadata: momentumMetrics
      };
    } catch (error) {
      this.logger.error(`Error calculating momentum factor for ${tokenAddress} on ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Price Momentum',
        score: 50, // Neutral score
        weight: this.factorWeights.marketMomentum,
        weightedScore: 50 * (this.factorWeights.marketMomentum / 100),
        metadata: {
          direction: 'neutral',
          strength: 0
        }
      };
    }
  }
  
  /**
   * Calculate momentum metrics for a specific timeframe
   */
  private calculateMomentumMetrics(candles: any[]): {
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    rsi: number;
    macd: number;
    price: number;
  } | null {
    if (!candles || candles.length < 5) {
      return null; // Not enough data
    }
    
    try {
      // Calculate RSI (Relative Strength Index)
      const rsi = this.calculateRSI(candles);
      
      // Calculate MACD (Moving Average Convergence Divergence)
      const macd = this.calculateMACD(candles);
      
      // Get current price
      const currentPrice = candles[candles.length - 1].close;
      
      // Determine direction based on indicators
      let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let strength = 0;
      
      // RSI rules
      if (rsi > 70) {
        direction = 'bearish'; // Overbought
        strength += (rsi - 70) / 3; // 0-10 scale
      } else if (rsi < 30) {
        direction = 'bullish'; // Oversold
        strength += (30 - rsi) / 3; // 0-10 scale
      } else if (rsi > 50) {
        direction = 'bullish'; // Momentum up
        strength += (rsi - 50) / 5; // 0-4 scale
      } else {
        direction = 'bearish'; // Momentum down
        strength += (50 - rsi) / 5; // 0-4 scale
      }
      
      // MACD rules (refine direction)
      if (macd > 0 && direction === 'bullish') {
        strength += 2; // Confirming bullish
      } else if (macd < 0 && direction === 'bearish') {
        strength += 2; // Confirming bearish
      } else if (macd > 0 && direction === 'bearish') {
        direction = 'neutral'; // Conflicting signals
        strength /= 2;
      } else if (macd < 0 && direction === 'bullish') {
        direction = 'neutral'; // Conflicting signals
        strength /= 2;
      }
      
      // Price trend (simple moving average)
      const shortSMA = this.calculateSMA(candles, 5);
      const longSMA = this.calculateSMA(candles, 14);
      
      if (shortSMA > longSMA && direction === 'bullish') {
        strength += 2; // Confirming bullish trend
      } else if (shortSMA < longSMA && direction === 'bearish') {
        strength += 2; // Confirming bearish trend
      } else if (shortSMA > longSMA && direction === 'bearish') {
        direction = 'neutral'; // Conflicting signals
        strength /= 2;
      } else if (shortSMA < longSMA && direction === 'bullish') {
        direction = 'neutral'; // Conflicting signals
        strength /= 2;
      }
      
      // Cap strength at 10
      strength = Math.min(10, strength);
      
      return {
        direction,
        strength,
        rsi,
        macd,
        price: currentPrice
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(candles: any[], periods: number = 14): number {
    if (candles.length < periods + 1) {
      return 50; // Not enough data, return neutral
    }
    
    try {
      let gains = 0;
      let losses = 0;
      
      // Calculate initial average gain/loss
      for (let i = 1; i <= periods; i++) {
        const change = candles[i].close - candles[i - 1].close;
        if (change >= 0) {
          gains += change;
        } else {
          losses -= change; // Convert to positive
        }
      }
      
      let avgGain = gains / periods;
      let avgLoss = losses / periods;
      
      // Calculate RSI using Wilder's smoothing method
      for (let i = periods + 1; i < candles.length; i++) {
        const change = candles[i].close - candles[i - 1].close;
        if (change >= 0) {
          avgGain = ((avgGain * (periods - 1)) + change) / periods;
          avgLoss = (avgLoss * (periods - 1)) / periods;
        } else {
          avgGain = (avgGain * (periods - 1)) / periods;
          avgLoss = ((avgLoss * (periods - 1)) - change) / periods;
        }
      }
      
      // Calculate RS and RSI
      if (avgLoss === 0) {
        return 100; // No losses, RSI = 100
      }
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      return rsi;
    } catch (error) {
      return 50; // Error, return neutral
    }
  }
  
  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(candles: any[]): number {
    try {
      const shortPeriod = 12;
      const longPeriod = 26;
      
      if (candles.length < longPeriod) {
        return 0; // Not enough data
      }
      
      // Calculate short EMA
      const shortEMA = this.calculateEMA(candles, shortPeriod);
      
      // Calculate long EMA
      const longEMA = this.calculateEMA(candles, longPeriod);
      
      // MACD is the difference between short and long EMAs
      return shortEMA - longEMA;
    } catch (error) {
      return 0; // Error, return neutral
    }
  }
  
  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(candles: any[], periods: number): number {
    try {
      // Start with SMA for initial value
      let sum = 0;
      for (let i = 0; i < periods; i++) {
        sum += candles[i].close;
      }
      let ema = sum / periods;
      
      // Multiplier: (2 / (Time periods + 1))
      const multiplier = 2 / (periods + 1);
      
      // Calculate EMA
      for (let i = periods; i < candles.length; i++) {
        ema = (candles[i].close - ema) * multiplier + ema;
      }
      
      return ema;
    } catch (error) {
      return candles[candles.length - 1].close; // Return latest price on error
    }
  }
  
  /**
   * Calculate SMA (Simple Moving Average)
   */
  private calculateSMA(candles: any[], periods: number): number {
    try {
      if (candles.length < periods) {
        return candles[candles.length - 1].close; // Not enough data
      }
      
      let sum = 0;
      for (let i = candles.length - periods; i < candles.length; i++) {
        sum += candles[i].close;
      }
      
      return sum / periods;
    } catch (error) {
      return candles[candles.length - 1].close; // Return latest price on error
    }
  }
  
  /**
   * Calculate market context factor (broader market conditions)
   */
  private async calculateMarketContextFactor(network: string): Promise<EdgeFactor> {
    try {
      if (network !== 'solana') {
        // Default market context for non-Solana networks
        return {
          name: 'Market Context',
          score: 50,
          weight: this.factorWeights.marketContext,
          weightedScore: 50 * (this.factorWeights.marketContext / 100),
          metadata: {
            marketTrend: 'neutral',
            marketVolatility: 'normal'
          }
        };
      }
      
      // For Solana, use network-wide metrics
      // 1. Check SOL price trend
      const solAddress = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
      const solPriceData = await marketDataService.getTokenPrice(solAddress, network);
      
      // 2. Check network-wide volatility and volume
      const solMarketHistory = await marketDataService.getMarketHistory(solAddress, network, '1h', 24);
      
      // Default values
      let marketTrendScore = 50;
      let marketVolatilityScore = 50;
      
      // Calculate market trend score
      if (solPriceData) {
        // Use 24h price change to determine market trend
        if (solPriceData.priceChange24h >= 10) {
          marketTrendScore = 90; // Strong bull market
        } else if (solPriceData.priceChange24h >= 5) {
          marketTrendScore = 75; // Bull market
        } else if (solPriceData.priceChange24h >= 2) {
          marketTrendScore = 65; // Slight bull market
        } else if (solPriceData.priceChange24h <= -10) {
          marketTrendScore = 10; // Strong bear market
        } else if (solPriceData.priceChange24h <= -5) {
          marketTrendScore = 25; // Bear market
        } else if (solPriceData.priceChange24h <= -2) {
          marketTrendScore = 35; // Slight bear market
        } else {
          marketTrendScore = 50; // Neutral market
        }
      }
      
      // Calculate market volatility score
      if (solMarketHistory && solMarketHistory.length > 0) {
        // Calculate SOL volatility
        const volatility = this.calculateTimeframeVolatility(solMarketHistory);
        
        if (volatility !== null) {
          // Score based on market volatility (lower is better for meme coins)
          if (volatility < 1) {
            marketVolatilityScore = 30; // Very low volatility - not good for meme coins
          } else if (volatility < 2) {
            marketVolatilityScore = 50; // Low volatility
          } else if (volatility < 4) {
            marketVolatilityScore = 80; // Moderate volatility - good for meme coins
          } else if (volatility < 7) {
            marketVolatilityScore = 70; // High volatility
          } else {
            marketVolatilityScore = 40; // Extreme volatility - not good for stable trading
          }
        }
      }
      
      // Combined market context score (weighted average)
      const marketContextScore = (marketTrendScore * 0.6) + (marketVolatilityScore * 0.4);
      
      // Calculate weighted score
      const marketContextWeightedScore = marketContextScore * (this.factorWeights.marketContext / 100);
      
      // Determine qualitative market descriptions
      let marketTrend: string;
      if (marketTrendScore >= 75) {
        marketTrend = 'strong_bull';
      } else if (marketTrendScore >= 60) {
        marketTrend = 'bull';
      } else if (marketTrendScore >= 45) {
        marketTrend = 'neutral';
      } else if (marketTrendScore >= 30) {
        marketTrend = 'bear';
      } else {
        marketTrend = 'strong_bear';
      }
      
      let marketVolatility: string;
      if (marketVolatilityScore >= 75) {
        marketVolatility = 'optimal';
      } else if (marketVolatilityScore >= 60) {
        marketVolatility = 'good';
      } else if (marketVolatilityScore >= 40) {
        marketVolatility = 'normal';
      } else {
        marketVolatility = 'unfavorable';
      }
      
      return {
        name: 'Market Context',
        score: marketContextScore,
        weight: this.factorWeights.marketContext,
        weightedScore: marketContextWeightedScore,
        metadata: {
          marketTrend,
          marketVolatility,
          solPriceChange24h: solPriceData?.priceChange24h || 0
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating market context factor for ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Market Context',
        score: 50,
        weight: this.factorWeights.marketContext,
        weightedScore: 50 * (this.factorWeights.marketContext / 100),
        metadata: {
          marketTrend: 'neutral',
          marketVolatility: 'normal'
        }
      };
    }
  }
  
  /**
   * Apply dynamic confidence adjustment based on factor correlations
   */
  private applyDynamicConfidenceAdjustment(
    rawScore: number,
    factors: EdgeFactor[]
  ): number {
    try {
      // Get primary factors
      const patternFactor = factors.find(f => f.name === 'Pattern Analysis');
      const smartMoneyFactor = factors.find(f => f.name === 'Smart Money Activity');
      const momentumFactor = factors.find(f => f.name === 'Price Momentum');
      
      // Default - no adjustment
      if (!patternFactor || !smartMoneyFactor || !momentumFactor) {
        return rawScore;
      }
      
      let adjustmentMultiplier = 1.0;
      
      // Calculate correlation between factors
      // When multiple factors align, confidence increases
      
      // Check if pattern and smart money align (both high or both low)
      const patternSmartMoneyAlignment = (patternFactor.score > 60 && smartMoneyFactor.score > 60) ||
                                        (patternFactor.score < 40 && smartMoneyFactor.score < 40);
                                        
      // Check if pattern and momentum align
      const patternMomentumAlignment = (patternFactor.score > 60 && momentumFactor.score > 60) ||
                                      (patternFactor.score < 40 && momentumFactor.score < 40);
                                      
      // Check if smart money and momentum align
      const smartMoneyMomentumAlignment = (smartMoneyFactor.score > 60 && momentumFactor.score > 60) ||
                                         (smartMoneyFactor.score < 40 && momentumFactor.score < 40);
      
      // Apply adjustments based on alignments
      if (patternSmartMoneyAlignment && patternMomentumAlignment && smartMoneyMomentumAlignment) {
        // All three factors align - strong signal
        adjustmentMultiplier = 1.15; // +15%
      } else if ((patternSmartMoneyAlignment && patternMomentumAlignment) || 
                (patternSmartMoneyAlignment && smartMoneyMomentumAlignment) ||
                (patternMomentumAlignment && smartMoneyMomentumAlignment)) {
        // Two alignments - good signal
        adjustmentMultiplier = 1.08; // +8%
      } else if (patternSmartMoneyAlignment || patternMomentumAlignment || smartMoneyMomentumAlignment) {
        // One alignment - slight boost
        adjustmentMultiplier = 1.03; // +3%
      } else {
        // No alignments - conflicting signals - reduce confidence
        adjustmentMultiplier = 0.95; // -5%
      }
      
      // Apply the adjustment
      const adjustedScore = rawScore * adjustmentMultiplier;
      
      // Cap at 100
      return Math.min(100, adjustedScore);
    } catch (error) {
      // On error, return the raw score
      return rawScore;
    }
  }
  
  /**
   * Determine trade direction based on patterns and momentum
   */
  private determineTradeDirection(
    patterns: IPattern[],
    momentumFactor: EdgeFactor
  ): TradeDirection {
    try {
      // Default to LONG for meme coins (most trades are bullish)
      let direction = TradeDirection.LONG;
      
      // Check for specific bearish patterns
      const bearishPatterns = patterns.filter(p => 
        ['headAndShoulders', 'doubleTop', 'bearishChannel', 'wedgeDown'].includes(p.patternType)
      );
      
      // Check momentum direction
      const momentumDirection = momentumFactor.metadata?.direction || 'neutral';
      
      // Decision logic:
      // 1. If we have explicit bearish patterns, consider SHORT
      // 2. If momentum is bearish, consider SHORT
      // 3. Otherwise, stick with LONG (default for meme coins)
      
      if (bearishPatterns.length > 0 && momentumDirection === 'bearish') {
        // Strong bearish signal - both patterns and momentum align
        direction = TradeDirection.SHORT;
      } else if (bearishPatterns.length > 0 && bearishPatterns.length > patterns.length / 2) {
        // Majority of patterns are bearish
        direction = TradeDirection.SHORT;
      } else if (momentumDirection === 'bearish' && momentumFactor.score < 30) {
        // Very strong bearish momentum
        direction = TradeDirection.SHORT;
      } else {
        // Default to long for meme coins
        direction = TradeDirection.LONG;
      }
      
      return direction;
    } catch (error) {
      // Default to LONG on error
      return TradeDirection.LONG;
    }
  }
  
  /**
   * Calculate enhanced targets with adaptive projection based on volatility
   */
  private async calculateEnhancedTargets(
    currentPrice: number,
    confidenceScore: number,
    patterns: IPattern[],
    tokenAddress: string,
    network: string,
    direction: TradeDirection
  ): Promise<{ primaryTarget: TargetLevel; secondaryTarget?: TargetLevel }> {
    try {
      // Get historical volatility to calibrate targets
      const marketHistory = await marketDataService.getMarketHistory(tokenAddress, network, '15m', 96);
      let volatility = 2; // Default volatility estimate (%)
      
      if (marketHistory && marketHistory.length > 10) {
        // Calculate actual volatility from market history
        const priceChanges = [];
        for (let i = 1; i < marketHistory.length; i++) {
          const percentChange = ((marketHistory[i].close - marketHistory[i-1].close) / marketHistory[i-1].close) * 100;
          priceChanges.push(Math.abs(percentChange));
        }
        
        // Average volatility
        volatility = priceChanges.reduce((sum, val) => sum + val, 0) / priceChanges.length;
      }
      
      // Find pattern targets
      const patternTargets = patterns
        .filter(p => p.targetPrice !== undefined)
        .map(p => ({
          price: p.targetPrice!,
          confidence: p.confidence
        }));
      
      let primaryTarget: TargetLevel;
      let secondaryTarget: TargetLevel | undefined;
      
      // Different logic for LONG vs SHORT
      if (direction === TradeDirection.LONG) {
        if (patternTargets.length > 0) {
          // Sort by price (ascending for LONG)
          patternTargets.sort((a, b) => a.price - b.price);
          
          // Use median target for primary target for LONG
          const medianIndex = Math.floor(patternTargets.length / 2);
          const medianTarget = patternTargets[medianIndex];
          
          // Calculate expected return
          const primaryReturn = (medianTarget.price - currentPrice) / currentPrice;
          
          // Calculate probability based on confidence score and market conditions
          // Higher confidence = higher probability
          const primaryProbability = 0.42 + (confidenceScore / 220); // Range: 0.42 - 0.87
          
          // Estimate timeframe based on pattern types and volatility
          const timeframeHours = this.estimateEnhancedTimeframeHours(
            patterns, 
            primaryReturn, 
            volatility
          );
          
          primaryTarget = {
            price: medianTarget.price,
            probability: primaryProbability,
            expectedReturn: primaryReturn,
            timeframeHours
          };
          
          // If we have multiple targets, use the higher target for secondary target
          if (patternTargets.length > 1) {
            const highIndex = Math.min(patternTargets.length - 1, medianIndex + 1);
            const highTarget = patternTargets[highIndex];
            
            // Secondary target has lower probability
            const secondaryProbability = primaryProbability * 0.7; // 70% of primary probability
            const secondaryReturn = (highTarget.price - currentPrice) / currentPrice;
            
            secondaryTarget = {
              price: highTarget.price,
              probability: secondaryProbability,
              expectedReturn: secondaryReturn,
              timeframeHours: timeframeHours * 1.5 // 50% longer timeframe
            };
          }
        } else {
          // No pattern targets available, use confidence-based estimate adjusted for volatility
          const confidenceFactor = confidenceScore / 100; // 0-1
          
          // Target 1: Conservative target (adjusted for volatility)
          // Higher volatility = higher potential targets
          const volatilityAdjustment = Math.min(1.5, Math.max(0.5, volatility / 2));
          const primaryReturnPercentage = (0.15 + (confidenceFactor * 0.15)) * volatilityAdjustment;
          const primaryPrice = currentPrice * (1 + primaryReturnPercentage);
          const primaryProbability = 0.5 + (confidenceFactor * 0.2); // 50-70%
          
          // Estimate timeframe based on volatility (higher volatility = shorter timeframe)
          const timeframeHours = Math.round(24 / Math.min(2, Math.max(0.5, volatility / 2)));
          
          primaryTarget = {
            price: primaryPrice,
            probability: primaryProbability,
            expectedReturn: primaryReturnPercentage,
            timeframeHours
          };
          
          // Target 2: Aggressive target
          const secondaryReturnPercentage = (0.3 + (confidenceFactor * 0.3)) * volatilityAdjustment;
          const secondaryPrice = currentPrice * (1 + secondaryReturnPercentage);
          const secondaryProbability = 0.3 + (confidenceFactor * 0.15); // 30-45%
          
          secondaryTarget = {
            price: secondaryPrice,
            probability: secondaryProbability,
            expectedReturn: secondaryReturnPercentage,
            timeframeHours: timeframeHours * 1.8 // 80% longer timeframe
          };
        }
      } else {
        // SHORT direction - targets are downside targets
        if (patternTargets.length > 0) {
          // Sort by price (descending for SHORT)
          patternTargets.sort((a, b) => b.price - a.price);
          
          // Use median target for primary target for SHORT
          const medianIndex = Math.floor(patternTargets.length / 2);
          const medianTarget = patternTargets[medianIndex];
          
          // Calculate expected return (for shorts, lower price = higher return)
          const primaryReturn = (currentPrice - medianTarget.price) / currentPrice;
          
          // Calculate probability (shorts typically have lower probability)
          const primaryProbability = 0.40 + (confidenceScore / 240); // Range: 0.40 - 0.82
          
          // Estimate timeframe based on pattern types and volatility
          const timeframeHours = this.estimateEnhancedTimeframeHours(
            patterns, 
            primaryReturn, 
            volatility
          );
          
          primaryTarget = {
            price: medianTarget.price,
            probability: primaryProbability,
            expectedReturn: primaryReturn,
            timeframeHours
          };
          
          // If we have multiple targets, use the lower target for secondary target
          if (patternTargets.length > 1) {
            const lowIndex = Math.max(0, medianIndex - 1);
            const lowTarget = patternTargets[lowIndex];
            
            // Secondary target has lower probability
            const secondaryProbability = primaryProbability * 0.65; // 65% of primary probability
            const secondaryReturn = (currentPrice - lowTarget.price) / currentPrice;
            
            secondaryTarget = {
              price: lowTarget.price,
              probability: secondaryProbability,
              expectedReturn: secondaryReturn,
              timeframeHours: timeframeHours * 1.7 // 70% longer timeframe
            };
          }
        } else {
          // No pattern targets available, use confidence-based estimate adjusted for volatility
          const confidenceFactor = confidenceScore / 100; // 0-1
          
          // Shorts typically have more conservative targets
          const volatilityAdjustment = Math.min(1.4, Math.max(0.5, volatility / 2.2));
          const primaryReturnPercentage = (0.12 + (confidenceFactor * 0.12)) * volatilityAdjustment;
          const primaryPrice = currentPrice * (1 - primaryReturnPercentage);
          const primaryProbability = 0.45 + (confidenceFactor * 0.18); // 45-63%
          
          // Estimate timeframe based on volatility
          const timeframeHours = Math.round(20 / Math.min(2, Math.max(0.5, volatility / 2.2)));
          
          primaryTarget = {
            price: primaryPrice,
            probability: primaryProbability,
            expectedReturn: primaryReturnPercentage,
            timeframeHours
          };
          
          // Target 2: More aggressive short target
          const secondaryReturnPercentage = (0.22 + (confidenceFactor * 0.26)) * volatilityAdjustment;
          const secondaryPrice = currentPrice * (1 - secondaryReturnPercentage);
          const secondaryProbability = 0.25 + (confidenceFactor * 0.15); // 25-40%
          
          secondaryTarget = {
            price: secondaryPrice,
            probability: secondaryProbability,
            expectedReturn: secondaryReturnPercentage,
            timeframeHours: timeframeHours * 2 // Twice as long timeframe
          };
        }
      }
      
      return { primaryTarget, secondaryTarget };
    } catch (error) {
      this.logger.error('Error calculating enhanced targets:', error);
      
      // Return default targets based on direction
      if (direction === TradeDirection.LONG) {
        // Default LONG targets (15% primary, 30% secondary)
        return {
          primaryTarget: {
            price: currentPrice * 1.15,
            probability: 0.6,
            expectedReturn: 0.15,
            timeframeHours: 24
          },
          secondaryTarget: {
            price: currentPrice * 1.3,
            probability: 0.4,
            expectedReturn: 0.3,
            timeframeHours: 48
          }
        };
      } else {
        // Default SHORT targets (10% primary, 20% secondary)
        return {
          primaryTarget: {
            price: currentPrice * 0.9,
            probability: 0.55,
            expectedReturn: 0.1,
            timeframeHours: 24
          },
          secondaryTarget: {
            price: currentPrice * 0.8,
            probability: 0.35,
            expectedReturn: 0.2,
            timeframeHours: 48
          }
        };
      }
    }
  }
  
  /**
   * Estimate target timeframe based on pattern types, expected return, and volatility
   */
  private estimateEnhancedTimeframeHours(
    patterns: IPattern[],
    expectedReturn: number,
    volatility: number
  ): number {
    try {
      // Default timeframes based on pattern types
      const patternTimeframes: Record<string, number> = {
        breakout: 6, // 6 hours
        vRecovery: 8, // 8 hours
        bullFlag: 12, // 12 hours
        accumulation: 24, // 24 hours
        cupAndHandle: 48, // 48 hours
        inverseHeadAndShoulders: 36, // 36 hours
        roundedBottom: 48, // 48 hours
        smartMoneyAccumulation: 36, // 36 hours
        headAndShoulders: 12, // 12 hours (bearish)
        doubleTop: 12, // 12 hours (bearish)
        bearishChannel: 18, // 18 hours (bearish)
        wedgeDown: 16 // 16 hours (bearish)
      };
      
      // Calculate base timeframe from patterns
      let totalHours = 0;
      let patternCount = 0;
      
      for (const pattern of patterns) {
        if (patternTimeframes[pattern.patternType]) {
          totalHours += patternTimeframes[pattern.patternType];
          patternCount++;
        }
      }
      
      // Use the average pattern timeframe, or default to 24 hours
      let baseTimeframe = patternCount > 0 ? totalHours / patternCount : 24;
      
      // Adjust timeframe based on expected return
      // Higher returns usually take longer
      const returnMultiplier = 1 + (expectedReturn * 2); // e.g., 20% return = 1.4x multiplier
      
      // Adjust timeframe based on volatility
      // Higher volatility usually means faster moves
      const volatilityMultiplier = Math.max(0.5, 2 / Math.max(1, volatility)); // Inverse relationship
      
      // Calculate final estimated timeframe
      const estimatedTimeframe = baseTimeframe * returnMultiplier * volatilityMultiplier;
      
      // Round to nearest hour and ensure minimum of 1 hour
      return Math.max(1, Math.round(estimatedTimeframe));
    } catch (error) {
      // Return default on error
      return 24;
    }
  }
  
  /**
   * Calculate enhanced stop loss with adaptive protection
   */
  private async calculateEnhancedStopLoss(
    currentPrice: number,
    patterns: IPattern[],
    tokenAddress: string,
    network: string,
    direction: TradeDirection
  ): number {
    try {
      // Get market data for volatility-based stop loss
      const marketHistory = await marketDataService.getMarketHistory(tokenAddress, network, '15m', 96);
      let volatility = 2; // Default volatility estimate (%)
      
      if (marketHistory && marketHistory.length > 10) {
        // Calculate actual volatility from market history
        const priceChanges = [];
        for (let i = 1; i < marketHistory.length; i++) {
          const percentChange = ((marketHistory[i].close - marketHistory[i-1].close) / marketHistory[i-1].close) * 100;
          priceChanges.push(Math.abs(percentChange));
        }
        
        // Average volatility
        volatility = priceChanges.reduce((sum, val) => sum + val, 0) / priceChanges.length;
      }
      
      // Find pattern stop losses
      const patternStopLosses = patterns
        .filter(p => p.stopLossPrice !== undefined)
        .map(p => p.stopLossPrice!);
      
      // Different logic based on direction
      if (direction === TradeDirection.LONG) {
        if (patternStopLosses.length > 0) {
          // For LONG trades, use highest stop loss from patterns (most conservative)
          const patternStop = Math.max(...patternStopLosses);
          
          // Calculate volatility-based stop loss (ATR-like approach)
          const volatilityStop = currentPrice * (1 - (volatility / 100 * 3)); // 3x average volatility
          
          // Use the higher of pattern stop and volatility stop
          return Math.max(patternStop, volatilityStop);
        } else {
          // No pattern stop losses available
          // Use volatility-based stop loss, adjusted for confidence
          const volatilityMultiplier = Math.min(5, Math.max(2, 10 / volatility));
          return currentPrice * (1 - (volatility / 100 * volatilityMultiplier));
        }
      } else {
        // SHORT direction - stop loss is above entry
        if (patternStopLosses.length > 0) {
          // For SHORT trades, use lowest stop loss from patterns (most conservative)
          const patternStop = Math.min(...patternStopLosses);
          
          // Calculate volatility-based stop loss (ATR-like approach)
          const volatilityStop = currentPrice * (1 + (volatility / 100 * 2.5)); // 2.5x average volatility
          
          // Use the lower of pattern stop and volatility stop
          return Math.min(patternStop, volatilityStop);
        } else {
          // No pattern stop losses available
          // Use volatility-based stop loss, adjusted for confidence
          const volatilityMultiplier = Math.min(4, Math.max(1.8, 8 / volatility));
          return currentPrice * (1 + (volatility / 100 * volatilityMultiplier));
        }
      }
    } catch (error) {
      this.logger.error(`Error calculating enhanced stop loss:`, error);
      
      // Default stop loss on error
      if (direction === TradeDirection.LONG) {
        return currentPrice * 0.95; // 5% below for LONG
      } else {
        return currentPrice * 1.05; // 5% above for SHORT
      }
    }
  }
  
  /**
   * Calculate enhanced expected value with multiple scenario analysis
   */
  private calculateEnhancedExpectedValue(
    currentPrice: number,
    primaryTarget: TargetLevel,
    secondaryTarget: TargetLevel | undefined,
    stopLoss: number,
    direction: TradeDirection
  ): number {
    try {
      // Calculate expected outcome with multiple scenarios
      
      // For LONG direction
      if (direction === TradeDirection.LONG) {
        // Scenario 1: Hit primary target
        const primaryProfit = (primaryTarget.price - currentPrice) / currentPrice;
        const primaryScenario = primaryProfit * primaryTarget.probability;
        
        // Scenario 2: Hit secondary target (if available)
        let secondaryScenario = 0;
        if (secondaryTarget) {
          const secondaryProfit = (secondaryTarget.price - currentPrice) / currentPrice;
          secondaryScenario = secondaryProfit * secondaryTarget.probability;
        }
        
        // Scenario 3: Hit stop loss
        const stopLoss = (stopLoss - currentPrice) / currentPrice; // Negative value
        
        // Calculate probability of hitting stop loss
        // (1 - probability of hitting any target)
        const stopLossProbability = 1 - (primaryTarget.probability + (secondaryTarget ? secondaryTarget.probability : 0));
        
        const stopLossScenario = stopLoss * stopLossProbability;
        
        // Calculate weighted expected value
        return primaryScenario + secondaryScenario + stopLossScenario;
      } 
      // For SHORT direction
      else {
        // Scenario 1: Hit primary target
        const primaryProfit = (currentPrice - primaryTarget.price) / currentPrice;
        const primaryScenario = primaryProfit * primaryTarget.probability;
        
        // Scenario 2: Hit secondary target (if available)
        let secondaryScenario = 0;
        if (secondaryTarget) {
          const secondaryProfit = (currentPrice - secondaryTarget.price) / currentPrice;
          secondaryScenario = secondaryProfit * secondaryTarget.probability;
        }
        
        // Scenario 3: Hit stop loss
        const stopLoss = (currentPrice - stopLoss) / currentPrice; // Negative value for shorts
        
        // Calculate probability of hitting stop loss
        const stopLossProbability = 1 - (primaryTarget.probability + (secondaryTarget ? secondaryTarget.probability : 0));
        
        const stopLossScenario = stopLoss * stopLossProbability;
        
        // Calculate weighted expected value
        return primaryScenario + secondaryScenario + stopLossScenario;
      }
    } catch (error) {
      // Return simple expected value on error
      if (direction === TradeDirection.LONG) {
        return ((primaryTarget.price - currentPrice) * primaryTarget.probability - 
               (currentPrice - stopLoss) * (1 - primaryTarget.probability)) / currentPrice;
      } else {
        return ((currentPrice - primaryTarget.price) * primaryTarget.probability - 
               (stopLoss - currentPrice) * (1 - primaryTarget.probability)) / currentPrice;
      }
    }
  }
  
  /**
   * Calculate optimal position size using Kelly Criterion
   */
  private calculateKellyPosition(
    winProbability: number,
    payoffRatio: number
  ): number {
    try {
      // Kelly formula: K% = (bp - q) / b
      // where:
      // b = odds received on the wager (payoffRatio)
      // p = probability of winning
      // q = probability of losing (1 - p)
      
      const p = winProbability;
      const q = 1 - p;
      const b = payoffRatio;
      
      // Calculate Kelly percentage
      const kellyPercentage = (b * p - q) / b;
      
      // Cap at 50% as risk management and prevent overconfidence
      return Math.max(0, Math.min(0.5, kellyPercentage));
    } catch (error) {
      // Default to 10% on error
      return 0.1;
    }
  }
  
  /**
   * Helper method to detect if a transaction involves a specific token
   */
  private isTransactionInvolvingToken(tx: any, tokenAddress: string): boolean {
    try {
      // Basic check for token involvement in a Solana transaction
      
      // 1. Check account keys for the token mint
      if (tx.transaction?.message?.accountKeys) {
        const accounts = tx.transaction.message.accountKeys;
        if (Array.isArray(accounts)) {
          for (const account of accounts) {
            if (account === tokenAddress) {
              return true;
            }
          }
        }
      }
      
      // 2. Check token balances (more reliable)
      if (tx.meta?.preTokenBalances && tx.meta.postTokenBalances) {
        for (const balance of [...tx.meta.preTokenBalances, ...tx.meta.postTokenBalances]) {
          if (balance.mint === tokenAddress) {
            return true;
          }
        }
      }
      
      // 3. Check logs for mentions of the token
      if (tx.meta?.logMessages) {
        for (const log of tx.meta.logMessages) {
          if (log.includes(tokenAddress)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Helper method to detect if a transaction is a token buy
   */
  private isTokenBuyTransaction(tx: any, walletAddress: string, tokenAddress: string): boolean {
    try {
      // Check if wallet received more tokens in this transaction
      if (tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
        // Find pre and post balances for this wallet and token
        const preBalance = tx.meta.preTokenBalances.find((b: any) => 
          b.owner === walletAddress && b.mint === tokenAddress
        );
        
        const postBalance = tx.meta.postTokenBalances.find((b: any) => 
          b.owner === walletAddress && b.mint === tokenAddress
        );
        
        // If post balance is higher than pre balance, it's a buy
        if (postBalance) {
          const postAmount = parseFloat(postBalance.uiTokenAmount?.uiAmount || '0');
          const preAmount = preBalance ? parseFloat(preBalance.uiTokenAmount?.uiAmount || '0') : 0;
          
          if (postAmount > preAmount) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Helper method to detect if a transaction is a token sell
   */
  private isTokenSellTransaction(tx: any, walletAddress: string, tokenAddress: string): boolean {
    try {
      // Check if wallet sent tokens in this transaction
      if (tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
        // Find pre and post balances for this wallet and token
        const preBalance = tx.meta.preTokenBalances.find((b: any) => 
          b.owner === walletAddress && b.mint === tokenAddress
        );
        
        const postBalance = tx.meta.postTokenBalances.find((b: any) => 
          b.owner === walletAddress && b.mint === tokenAddress
        );
        
        // If pre balance is higher than post balance, it's a sell
        if (preBalance) {
          const preAmount = parseFloat(preBalance.uiTokenAmount?.uiAmount || '0');
          const postAmount = postBalance ? parseFloat(postBalance.uiTokenAmount?.uiAmount || '0') : 0;
          
          if (preAmount > postAmount) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Mark edge calculation as executed
   */
  async markAsExecuted(id: string, executionPrice: number): Promise<IEdgeCalculation | null> {
    try {
      const edge = await EdgeCalculation.findById(id);
      
      if (!edge) {
        this.logger.warn(`Edge calculation ${id} not found`);
        return null;
      }
      
      if (edge.status !== EdgeStatus.CALCULATED) {
        this.logger.warn(`Cannot mark edge calculation ${id} as executed, current status: ${edge.status}`);
        return null;
      }
      
      edge.status = EdgeStatus.EXECUTED;
      edge.executionDetails = {
        executedAt: new Date(),
        executionPrice
      };
      
      await edge.save();
      
      this.logger.info(`Marked edge calculation ${id} as executed at price ${executionPrice}`);
      
      return edge;
    } catch (error) {
      this.logger.error(`Error marking edge calculation ${id} as executed:`, error);
      return null;
    }
  }
  
  /**
   * Get edge calculations with optional filtering
   */
  async getEdgeCalculations(options: {
    status?: EdgeStatus;
    confidenceLevel?: ConfidenceLevel;
    tokenAddress?: string;
    network?: string;
    minConfidenceScore?: number;
    minRiskRewardRatio?: number;
    limit?: number;
    skip?: number;
  } = {}): Promise<{
    edges: IEdgeCalculation[];
    totalCount: number;
    page: number;
    pageSize: number;
    pageCount: number;
  }> {
    try {
      const query: any = {};
      
      if (options.status) {
        query.status = options.status;
      }
      
      if (options.confidenceLevel) {
        query.confidenceLevel = options.confidenceLevel;
      }
      
      if (options.tokenAddress) {
        query.tokenAddress = options.tokenAddress;
      }
      
      if (options.network) {
        query.network = options.network;
      }
      
      if (options.minConfidenceScore) {
        query.confidenceScore = { $gte: options.minConfidenceScore };
      }
      
      if (options.minRiskRewardRatio) {
        query.riskRewardRatio = { $gte: options.minRiskRewardRatio };
      }
      
      const limit = options.limit || 20;
      const skip = options.skip || 0;
      
      // Execute query
      const edges = await EdgeCalculation.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
      
      // Get total count for pagination
      const totalCount = await EdgeCalculation.countDocuments(query);
      
      return {
        edges,
        totalCount,
        page: skip ? Math.floor(skip / limit) + 1 : 1,
        pageSize: limit,
        pageCount: Math.ceil(totalCount / limit)
      };
    } catch (error) {
      this.logger.error('Error fetching edge calculations:', error);
      throw error;
    }
  }
  
  /**
   * Get high confidence trade opportunities
   */
  async getTradeOpportunities(
    minConfidenceScore: number = 70,
    minRiskRewardRatio: number = 2.5
  ): Promise<IEdgeCalculation[]> {
    try {
      // Find high confidence calculated edges
      const opportunities = await EdgeCalculation.find({
        status: EdgeStatus.CALCULATED,
        confidenceScore: { $gte: minConfidenceScore },
        riskRewardRatio: { $gte: minRiskRewardRatio }
      }).sort({ confidenceScore: -1 });
      
      return opportunities;
    } catch (error) {
      this.logger.error('Error getting trade opportunities:', error);
      return [];
    }
  }
  
  /**
   * Get edge calculation by ID
   */
  async getEdgeCalculationById(id: string): Promise<IEdgeCalculation | null> {
    return EdgeCalculation.findById(id);
  }
  
  /**
   * Get edge calculation statistics
   */
  async getEdgeStats(): Promise<{
    totalCalculations: number;
    calculatedCount: number;
    executedCount: number;
    expiredCount: number;
    rejectedCount: number;
    averageConfidenceScore: number;
    averageRiskRewardRatio: number;
    byConfidenceLevel: Record<string, number>;
    successRate?: number;
    averageReturn?: number;
  }> {
    try {
      // Total count
      const totalCalculations = await EdgeCalculation.countDocuments();
      
      // Count by status
      const calculatedCount = await EdgeCalculation.countDocuments({ status: EdgeStatus.CALCULATED });
      const executedCount = await EdgeCalculation.countDocuments({ status: EdgeStatus.EXECUTED });
      const expiredCount = await EdgeCalculation.countDocuments({ status: EdgeStatus.EXPIRED });
      const rejectedCount = await EdgeCalculation.countDocuments({ status: EdgeStatus.REJECTED });
      
      // Average confidence score
      const confidenceResult = await EdgeCalculation.aggregate([
        { $group: { _id: null, avgConfidence: { $avg: '$confidenceScore' } } }
      ]);
      
      const averageConfidenceScore = confidenceResult.length > 0 ? confidenceResult[0].avgConfidence : 0;
      
      // Average risk/reward ratio
      const rrResult = await EdgeCalculation.aggregate([
        { $group: { _id: null, avgRR: { $avg: '$riskRewardRatio' } } }
      ]);
      
      const averageRiskRewardRatio = rrResult.length > 0 ? rrResult[0].avgRR : 0;
      
      // Count by confidence level
      const byConfidenceLevelResult = await EdgeCalculation.aggregate([
        { $group: { _id: '$confidenceLevel', count: { $sum: 1 } } }
      ]);
      
      const byConfidenceLevel: Record<string, number> = {};
      
      for (const level of byConfidenceLevelResult) {
        byConfidenceLevel[level._id] = level.count;
      }
      
      // Calculate success rate if we have executed trades
      let successRate;
      let averageReturn;
      
      if (executedCount > 0) {
        // This is a simplification - in a real system, you would track actual outcomes
        // For this example, assume trades with higher confidence have better outcomes
        const highConfidenceTradeCount = await EdgeCalculation.countDocuments({
          status: EdgeStatus.EXECUTED,
          confidenceScore: { $gte: 75 }
        });
        
        // Estimated success rate based on confidence distribution
        successRate = (highConfidenceTradeCount / executedCount) * 85 + 
                     ((executedCount - highConfidenceTradeCount) / executedCount) * 60;
                     
        // Simplified average return calculation
        const returnResult = await EdgeCalculation.aggregate([
          { $match: { status: EdgeStatus.EXECUTED } },
          { $group: { _id: null, avgReturn: { $avg: '$expectedValue' } } }
        ]);
        
        averageReturn = returnResult.length > 0 ? returnResult[0].avgReturn * 100 : undefined;
      }
      
      return {
        totalCalculations,
        calculatedCount,
        executedCount,
        expiredCount,
        rejectedCount,
        averageConfidenceScore,
        averageRiskRewardRatio,
        byConfidenceLevel,
        successRate,
        averageReturn
      };
    } catch (error) {
      this.logger.error('Error fetching edge calculation statistics:', error);
      
      return {
        totalCalculations: 0,
        calculatedCount: 0,
        executedCount: 0,
        expiredCount: 0,
        rejectedCount: 0,
        averageConfidenceScore: 0,
        averageRiskRewardRatio: 0,
        byConfidenceLevel: {}
      };
    }
  }
  
  /**
   * Expire old calculations
   */
  async expireOldCalculations(ageHours: number = 24): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - ageHours * 60 * 60 * 1000);
      
      const result = await EdgeCalculation.updateMany(
        {
          status: EdgeStatus.CALCULATED,
          timestamp: { $lt: cutoffTime }
        },
        {
          $set: { status: EdgeStatus.EXPIRED }
        }
      );
      
      this.logger.info(`Expired ${result.modifiedCount} old edge calculations`);
      
      return result.modifiedCount;
    } catch (error) {
      this.logger.error('Error expiring old calculations:', error);
      return 0;
    }
  }
  
  /**
   * Analyze wallet for token holdings
   * Enhanced method using RPC Connection Manager
   */
  async analyzeWalletHoldings(walletAddress: string, network: string = 'solana'): Promise<{
    totalTokens: number;
    tokenValues: { [symbol: string]: number };
    totalValueUSD: number;
    topHoldings: { 
      tokenAddress: string;
      symbol: string;
      amount: number;
      valueUSD: number;
      percentage: number;
    }[];
    potentialMemeCoins?: {
      tokenAddress: string;
      symbol: string;
      confidenceScore: number;
    }[];
  } | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network for wallet analysis: ${network}`);
      }
      
      // Use RPC manager to get token accounts
      const tokenAccounts = await rpcConnectionManager.getTokenAccountsByOwner(walletAddress);
      
      if (!tokenAccounts || tokenAccounts.length === 0) {
        return {
          totalTokens: 0,
          tokenValues: {},
          totalValueUSD: 0,
          topHoldings: []
        };
      }
      
      // Process each token
      const holdings = [];
      const tokenValues: { [symbol: string]: number } = {};
      let totalValueUSD = 0;
      
      // Track potential meme coins for further analysis
      const potentialMemeCoins = [];
      
      for (const account of tokenAccounts) {
        try {
          const tokenData = account.account?.data?.parsed?.info;
          if (!tokenData || !tokenData.mint || !tokenData.tokenAmount || tokenData.tokenAmount.uiAmount <= 0) {
            continue;
          }
          
          const tokenAddress = tokenData.mint;
          const amount = parseFloat(tokenData.tokenAmount.uiAmount);
          
          // Get token metadata and price
          const metadata = await marketDataService.getTokenMetadata(tokenAddress, network);
          const price = await marketDataService.getTokenPrice(tokenAddress, network);
          
          if (metadata && price) {
            const valueUSD = amount * price.price;
            
            holdings.push({
              tokenAddress,
              symbol: metadata.symbol,
              amount,
              valueUSD,
              percentage: 0 // Will calculate after summing total
            });
            
            tokenValues[metadata.symbol] = valueUSD;
            totalValueUSD += valueUSD;
            
            // Identify potential meme coins based on quick analysis
            const isNewToken = (new Date().getTime() - metadata.createdAt.getTime()) < 30 * 24 * 60 * 60 * 1000; // 30 days
            
            if (isNewToken) {
              // Look for token characteristics that suggest it might be a meme coin
              const possibleMeme = this.isPossibleMemeCoin(metadata);
              
              if (possibleMeme.isMeme) {
                potentialMemeCoins.push({
                  tokenAddress,
                  symbol: metadata.symbol,
                  confidenceScore: possibleMeme.score
                });
              }
            }
          }
        } catch (error) {
          this.logger.debug(`Error processing token account:`, error);
        }
      }
      
      // Calculate percentages and sort by value
      holdings.forEach(holding => {
        holding.percentage = totalValueUSD > 0 ? (holding.valueUSD / totalValueUSD) * 100 : 0;
      });
      
      // Sort by value
      const topHoldings = holdings
        .sort((a, b) => b.valueUSD - a.valueUSD)
        .slice(0, 10); // Top 10 holdings
      
      // Sort potential meme coins by confidence score
      potentialMemeCoins.sort((a, b) => b.confidenceScore - a.confidenceScore);
      
      return {
        totalTokens: holdings.length,
        tokenValues,
        totalValueUSD,
        topHoldings,
        potentialMemeCoins: potentialMemeCoins.length > 0 ? potentialMemeCoins : undefined
      };
    } catch (error) {
      this.logger.error(`Error analyzing wallet holdings for ${walletAddress}:`, error);
      return null;
    }
  }
  
  /**
   * Check if a token might be a meme coin based on metadata
   */
  private isPossibleMemeCoin(metadata: any): { isMeme: boolean; score: number } {
    let score = 0;
    
    // 1. Check name and symbol for common meme terms
    const memeTerms = [
      'doge', 'shib', 'inu', 'elon', 'moon', 'safe', 'cum', 'chad', 'based',
      'pepe', 'wojak', 'cat', 'dog', 'floki', 'rocket', 'lambo', 'diamond', 'hands',
      'ape', 'kong', 'chimp', 'yolo', 'fomo', 'pump', 'shitcoin', 'toshi', 'musk',
      'stonk', 'tendies', 'wife', 'boyfriend', 'bull', 'bear', 'babydoge', 'gme',
      'amc', 'meme', 'crypto', 'hodl', 'wojak', 'genius', 'maga', 'copium', 'wen'
    ];
    
    const nameAndSymbol = (metadata.name + ' ' + metadata.symbol).toLowerCase();
    
    for (const term of memeTerms) {
      if (nameAndSymbol.includes(term)) {
        score += 20;
        break;
      }
    }
    
    // 2. Check for all-caps symbol (common for meme coins)
    if (metadata.symbol === metadata.symbol.toUpperCase() && metadata.symbol.length >= 3) {
      score += 15;
    }
    
    // 3. Check for website/social links (less common for meme coins)
    if (!metadata.website && !metadata.twitter) {
      score += 15;
    }
    
    // 4. Name length (meme coins often have long names)
    if (metadata.name.length > 15) {
      score += 10;
    }
    
    // 5. Check for excessive emoji/special chars in name
    const specialCharsRegex = /[^a-zA-Z0-9\s]/g;
    const specialCharsCount = (metadata.name.match(specialCharsRegex) || []).length;
    if (specialCharsCount > 2) {
      score += 15;
    }
    
    // Cap score and determine if it's likely a meme coin
    score = Math.min(score, 100);
    
    return {
      isMeme: score >= 30, // 30% or higher suggests it might be a meme coin
      score
    };
  }
  
  /**
   * Reset factor weights
   */
  setFactorWeights(weights: Partial<Record<string, number>>): void {
    // Update provided weights
    for (const [factor, weight] of Object.entries(weights)) {
      if (this.factorWeights.hasOwnProperty(factor)) {
        this.factorWeights[factor] = weight;
      }
    }
    
    // Ensure weights sum to 100
    const totalWeight = Object.values(this.factorWeights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight !== 100) {
      // Normalize weights
      for (const factor in this.factorWeights) {
        this.factorWeights[factor] = (this.factorWeights[factor] / totalWeight) * 100;
      }
    }
    
    this.logger.info('Updated factor weights:', this.factorWeights);
  }
  
  /**
   * Update thresholds
   */
  updateThresholds(options: {
    minimumConfidenceScore?: number;
    minimumRiskRewardRatio?: number;
    edgeThreshold?: number;
  }): void {
    if (options.minimumConfidenceScore !== undefined) {
      this.minimumConfidenceScore = options.minimumConfidenceScore;
    }
    
    if (options.minimumRiskRewardRatio !== undefined) {
      this.minimumRiskRewardRatio = options.minimumRiskRewardRatio;
    }
    
    if (options.edgeThreshold !== undefined) {
      this.edgeThreshold = options.edgeThreshold;
    }
    
    this.logger.info('Updated thresholds:', {
      minimumConfidenceScore: this.minimumConfidenceScore,
      minimumRiskRewardRatio: this.minimumRiskRewardRatio,
      edgeThreshold: this.edgeThreshold
    });
  }
  
  /**
   * Backtest trade strategy with historical data
   */
  async backtestStrategy(
    options: {
      minConfidenceScore?: number;
      minRiskRewardRatio?: number;
      startDate?: Date;
      endDate?: Date;
      maxTrades?: number;
    } = {}
  ): Promise<{
    totalTrades: number;
    successRate: number;
    averageReturn: number;
    profitFactor: number;
    maxDrawdown: number;
    tradesByConfidence: Record<string, { count: number; successRate: number }>;
    trades: Array<{
      symbol: string;
      direction: TradeDirection;
      confidenceScore: number;
      riskRewardRatio: number;
      entryPrice: number;
      exitPrice: number;
      return: number;
      successful: boolean;
    }>;
  }> {
    try {
      // Set default options
      const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = options.endDate || new Date();
      const minConfidenceScore = options.minConfidenceScore || this.minimumConfidenceScore;
      const minRiskRewardRatio = options.minRiskRewardRatio || this.minimumRiskRewardRatio;
      const maxTrades = options.maxTrades || 100;
      
      // Get completed edge calculations for backtest
      const completedTrades = await EdgeCalculation.find({
        status: EdgeStatus.EXECUTED,
        confidenceScore: { $gte: minConfidenceScore },
        riskRewardRatio: { $gte: minRiskRewardRatio },
        timestamp: { $gte: startDate, $lte: endDate }
      }).sort({ timestamp: 1 }).limit(maxTrades);
      
      if (completedTrades.length === 0) {
        return {
          totalTrades: 0,
          successRate: 0,
          averageReturn: 0,
          profitFactor: 0,
          maxDrawdown: 0,
          tradesByConfidence: {},
          trades: []
        };
      }
      
      // Analyze trade results
      let successCount = 0;
      let totalReturn = 0;
      let totalProfit = 0;
      let totalLoss = 0;
      
      // Track consecutive losses for drawdown calculation
      let currentDrawdown = 0;
      let maxDrawdown = 0;
      
      // Group by confidence level
      const tradesByConfidence: Record<string, { count: number; successCount: number }> = {
        'very_high': { count: 0, successCount: 0 },
        'high': { count: 0, successCount: 0 },
        'medium': { count: 0, successCount: 0 },
        'low': { count: 0, successCount: 0 },
        'very_low': { count: 0, successCount: 0 }
      };
      
      // Process each trade
      const trades = [];
      
      for (const trade of completedTrades) {
        // For simplicity in backtesting, simulate a random outcome based on the confidence
        // In a real implementation, you would use actual price data to determine outcomes
        
        // Higher confidence = higher chance of success
        const successProbability = trade.confidenceScore / 100;
        const isSuccessful = Math.random() < successProbability;
        
        // Calculate return based on outcome
        let tradeReturn: number;
        let exitPrice: number;
        
        if (isSuccessful) {
          // Success - hit the primary target
          exitPrice = trade.primaryTarget.price;
          
          if (trade.direction === TradeDirection.LONG) {
            tradeReturn = (exitPrice - trade.currentPrice) / trade.currentPrice;
          } else {
            tradeReturn = (trade.currentPrice - exitPrice) / trade.currentPrice;
          }
          
          successCount++;
          totalProfit += tradeReturn;
          
          // Reset drawdown
          currentDrawdown = 0;
        } else {
          // Failure - hit stop loss
          exitPrice = trade.stopLoss;
          
          if (trade.direction === TradeDirection.LONG) {
            tradeReturn = (exitPrice - trade.currentPrice) / trade.currentPrice; // Negative
          } else {
            tradeReturn = (trade.currentPrice - exitPrice) / trade.currentPrice; // Negative
          }
          
          totalLoss += Math.abs(tradeReturn);
          
          // Update drawdown
          currentDrawdown += Math.abs(tradeReturn);
          maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
        }
        
        totalReturn += tradeReturn;
        
        // Update confidence level stats
        tradesByConfidence[trade.confidenceLevel].count++;
        if (isSuccessful) {
          tradesByConfidence[trade.confidenceLevel].successCount++;
        }
        
        // Add to trades array
        trades.push({
          symbol: trade.symbol,
          direction: trade.direction,
          confidenceScore: trade.confidenceScore,
          riskRewardRatio: trade.riskRewardRatio,
          entryPrice: trade.currentPrice,
          exitPrice,
          return: tradeReturn,
          successful: isSuccessful
        });
      }
      
      // Calculate final statistics
      const successRate = (successCount / completedTrades.length) * 100;
      const averageReturn = totalReturn / completedTrades.length * 100;
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit;
      
      // Calculate success rates by confidence level
      const tradesByConfidenceResult: Record<string, { count: number; successRate: number }> = {};
      
      for (const [level, data] of Object.entries(tradesByConfidence)) {
        if (data.count > 0) {
          tradesByConfidenceResult[level] = {
            count: data.count,
            successRate: (data.successCount / data.count) * 100
          };
        }
      }
      
      return {
        totalTrades: completedTrades.length,
        successRate,
        averageReturn,
        profitFactor,
        maxDrawdown,
        tradesByConfidence: tradesByConfidenceResult,
        trades
      };
    } catch (error) {
      this.logger.error('Error backtesting strategy:', error);
      
      return {
        totalTrades: 0,
        successRate: 0,
        averageReturn: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        tradesByConfidence: {},
        trades: []
      };
    }
  }
  
  /**
   * Generate a performance report for patterns and indicators
   */
  async generatePerformanceReport(): Promise<{
    patternPerformance: Record<string, { count: number; successRate: number; averageReturn: number }>;
    factorCorrelations: Array<{ factor: string; correlationWithSuccess: number }>;
    topPerformingCombinations: Array<{ factors: string[]; successRate: number; count: number }>;
    overallPerformance: {
      successRate: number;
      averageReturn: number;
      tradeCount: number;
    };
  }> {
    try {
      // Get completed trades
      const completedTrades = await EdgeCalculation.find({
        status: EdgeStatus.EXECUTED
      });
      
      if (completedTrades.length === 0) {
        return {
          patternPerformance: {},
          factorCorrelations: [],
          topPerformingCombinations: [],
          overallPerformance: {
            successRate: 0,
            averageReturn: 0,
            tradeCount: 0
          }
        };
      }
      
      // Calculate pattern performance
      const patternStats: Record<string, { count: number; successCount: number; totalReturn: number }> = {};
      
      // Calculate factor correlations
      const factorSuccessCorrelation: Record<string, { successSum: number; count: number; factorSum: number }> = {};
      
      // Track factor combinations
      const factorCombinations: Record<string, { successCount: number; count: number }> = {};
      
      // For each trade
      let overallSuccessCount = 0;
      let overallTotalReturn = 0;
      
      for (const trade of completedTrades) {
        // Determine if trade was successful (simplified)
        // In a real system, you would compare execution price to subsequent market data
        const isSuccessful = trade.confidenceScore >= 75; // Simplified for this example
        const tradeReturn = isSuccessful ? trade.potentialReward / trade.currentPrice : -trade.potentialRisk / trade.currentPrice;
        
        if (isSuccessful) {
          overallSuccessCount++;
        }
        
        overallTotalReturn += tradeReturn;
        
        // Update pattern stats
        for (const patternId of trade.patternIds) {
          // Fetch pattern type from database
          // This is a simplification - in a real system, you'd join with pattern collection
          const patternType = 'pattern_' + patternId.toString().substr(0, 5);
          
          if (!patternStats[patternType]) {
            patternStats[patternType] = { count: 0, successCount: 0, totalReturn: 0 };
          }
          
          patternStats[patternType].count++;
          if (isSuccessful) {
            patternStats[patternType].successCount++;
          }
          patternStats[patternType].totalReturn += tradeReturn;
        }
        
        // Update factor correlations
        for (const factor of trade.factors) {
          const factorName = factor.name;
          
          if (!factorSuccessCorrelation[factorName]) {
            factorSuccessCorrelation[factorName] = { successSum: 0, count: 0, factorSum: 0 };
          }
          
          factorSuccessCorrelation[factorName].count++;
          factorSuccessCorrelation[factorName].factorSum += factor.score;
          factorSuccessCorrelation[factorName].successSum += isSuccessful ? 100 : 0;
        }
        
        // Track factor combinations (simplification - just high/low for each factor)
        const factorComboKey = trade.factors
          .filter(f => f.score >= 70) // Only include strong factors
          .map(f => f.name)
          .sort()
          .join('_');
          
        if (factorComboKey && factorComboKey.length > 0) {
          if (!factorCombinations[factorComboKey]) {
            factorCombinations[factorComboKey] = { successCount: 0, count: 0 };
          }
          
          factorCombinations[factorComboKey].count++;
          if (isSuccessful) {
            factorCombinations[factorComboKey].successCount++;
          }
        }
      }
      
      // Format pattern performance results
      const patternPerformance: Record<string, { count: number; successRate: number; averageReturn: number }> = {};
      
      for (const [pattern, stats] of Object.entries(patternStats)) {
        if (stats.count >= 5) { // Only include patterns with sufficient data
          patternPerformance[pattern] = {
            count: stats.count,
            successRate: (stats.successCount / stats.count) * 100,
            averageReturn: (stats.totalReturn / stats.count) * 100
          };
        }
      }
      
      // Calculate factor correlations
      const factorCorrelations = [];
      
      for (const [factor, stats] of Object.entries(factorSuccessCorrelation)) {
        if (stats.count >= 5) { // Only include factors with sufficient data
          const factorAvg = stats.factorSum / stats.count;
          const successAvg = stats.successSum / stats.count;
          
          // Simple correlation (this is a simplification)
          // In a real system, you would use proper statistical correlation
          const correlation = (factorAvg / 100) * (successAvg / 100);
          
          factorCorrelations.push({
            factor,
            correlationWithSuccess: Math.round(correlation * 100) / 100
          });
        }
      }
      
      // Sort by correlation
      factorCorrelations.sort((a, b) => b.correlationWithSuccess - a.correlationWithSuccess);
      
      // Format top performing combinations
      const topPerformingCombinations = [];
      
      for (const [combo, stats] of Object.entries(factorCombinations)) {
        if (stats.count >= 3) { // Only include combinations with sufficient data
          topPerformingCombinations.push({
            factors: combo.split('_'),
            successRate: (stats.successCount / stats.count) * 100,
            count: stats.count
          });
        }
      }
      
      // Sort by success rate
      topPerformingCombinations.sort((a, b) => b.successRate - a.successRate);
      
      // Take top 5
      const topCombos = topPerformingCombinations.slice(0, 5);
      
      // Overall performance
      const overallPerformance = {
        successRate: (overallSuccessCount / completedTrades.length) * 100,
        averageReturn: (overallTotalReturn / completedTrades.length) * 100,
        tradeCount: completedTrades.length
      };
      
      return {
        patternPerformance,
        factorCorrelations,
        topPerformingCombinations: topCombos,
        overallPerformance
      };
    } catch (error) {
      this.logger.error('Error generating performance report:', error);
      
      return {
        patternPerformance: {},
        factorCorrelations: [],
        topPerformingCombinations: [],
        overallPerformance: {
          successRate: 0,
          averageReturn: 0,
          tradeCount: 0
        }
      };
    }
  }
}

export default new EdgeCalculatorService();// src/services/edge-calculator-service.ts
import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import patternRecognitionService, { IPattern, PatternStatus, PatternType } from './pattern-recognition-service';
import marketDataService from './market-data-service';
import externalWalletScraper from './external-wallet-scraper';
import rpcConnectionManager from './rpc-connection-manager';
import { config } from '../config';
import { PublicKey } from '@solana/web3.js';

// Types and interfaces
export enum EdgeStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
  REJECTED = 'rejected'
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low',   // 0-20%
  LOW = 'low',             // 21-40%
  MEDIUM = 'medium',       // 41-60%
  HIGH = 'high',           // 61-80%
  VERY_HIGH = 'very_high'  // 81-100%
}

export enum TradeDirection {
  LONG = 'long',
  SHORT = 'short'
}

export interface EdgeFactor {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  metadata?: any;
}

export interface TargetLevel {
  price: number;
  probability: number;
  expectedReturn: number;
  timeframeHours: number;
}

export interface IEdgeCalculation extends Document {
  tokenAddress: string;
  network: string;
  symbol: string;
  timestamp: Date;
  status: EdgeStatus;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  direction: TradeDirection;
  currentPrice: number;
  primaryTarget: TargetLevel;
  secondaryTarget?: TargetLevel;
  stopLoss: number;
  expectedValue: number;
  potentialRisk: number;
  potentialReward: number;
  riskRewardRatio: number;
  kellySizing?: number;
  factors: EdgeFactor[];
  patternIds: mongoose.Types.ObjectId[];
  smartMoneySignals: {
    walletCount: number;
    netBuys: number;
    buyPressure: number;
    metadata?: any;
  };
  marketConditions: {
    liquidityScore: number;
    manipulationScore: number;
    volatilityScore: number;
    marketContext?: any;
    metadata?: any;
  };
  executionDetails?: {
    executedAt?: Date;
    executionPrice?: number;
    outputJson?: string;
  };
  notes?: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema definition
const edgeCalculationSchema = new Schema<IEdgeCalculation>({
  tokenAddress: { type: String, required: true, index: true },
  network: { type: String, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(EdgeStatus),
    default: EdgeStatus.PENDING,
    index: true 
  },
  confidenceLevel: { 
    type: String, 
    required: true,
    enum: Object.values(ConfidenceLevel),
    index: true
  },
  confidenceScore: { type: Number, required: true, min: 0, max: 100 },
  direction: { 
    type: String, 
    required: true, 
    enum: Object.values(TradeDirection)
  },
  currentPrice: { type: Number, required: true },
  primaryTarget: {
    price: { type: Number, required: true },
    probability: { type: Number, required: true },
    expectedReturn: { type: Number, required: true },
    timeframeHours: { type: Number, required: true }
  },
  secondaryTarget: {
    price: { type: Number },
    probability: { type: Number },
    expectedReturn: { type: Number },
    timeframeHours: { type: Number }
  },
  stopLoss: { type: Number, required: true },
  expectedValue: { type: Number, required: true },
  potentialRisk: { type: Number, required: true },
  potentialReward: { type: Number, required: true },
  riskRewardRatio: { type: Number, required: true },
  kellySizing: { type: Number },
  factors: [{
    name: { type: String, required: true },
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    weightedScore: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed }
  }],
  patternIds: [{ type: Schema.Types.ObjectId, ref: 'Pattern' }],
  smartMoneySignals: {
    walletCount: { type: Number, required: true },
    netBuys: { type: Number, required: true },
    buyPressure: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  marketConditions: {
    liquidityScore: { type: Number, required: true },
    manipulationScore: { type: Number, required: true },
    volatilityScore: { type: Number, required: true },
    marketContext: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed }
  },
  executionDetails: {
    executedAt: { type: Date },
    executionPrice: { type: Number },
    outputJson: { type: String }
  },
  notes: { type: String },
  tags: [{ type: String }]
}, { timestamps: true });

// Create model if it doesn't exist yet
const EdgeCalculation: Model<IEdgeCalculation> = mongoose.models.EdgeCalculation as Model<IEdgeCalculation> || 
  mongoose.model<IEdgeCalculation>('EdgeCalculation', edgeCalculationSchema);

class EdgeCalculatorService {
  private logger: winston.Logger;
  private factorWeights: Record<string, number>;
  private minimumConfidenceScore: number;
  private minimumRiskRewardRatio: number;
  private edgeThreshold: number;
  private maxCalculationsPerRun: number;
  private scanIntervalMs: number;
  private scanIntervalId: NodeJS.Timeout | null;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'edge-calculator-service' },
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
    
    // Configure enhanced factor weights for better accuracy
    this.factorWeights = {
      patternConfidence: 22,       // Reduced slightly from 30
      patternType: 8,              // Reduced from 10
      patternTimeframe: 10,
      patternMultiTimeframe: 5,    // New factor for multi-timeframe correlation
      smartMoneyActivity: 20,      // Reduced from 25
      smartMoneyQuality: 5,        // New factor for smart money wallet quality
      marketLiquidity: 5,
      marketManipulation: 10,
      marketVolatility: 5,
      marketMomentum: 5,          // New factor for price momentum
      marketContext: 5,           // New factor for broader market conditions
      historicalSuccess: 5
    };
    
    // Set threshold values (target 74-76% success rate)
    this.minimumConfidenceScore = 62; // Slightly increased from 60
    this.minimumRiskRewardRatio = 2.2; // Increased from 2.0 for better risk management
    this.edgeThreshold = 68; // Slightly increased from 65
    
    // Set scan parameters
    this.maxCalculationsPerRun = 50;
    this.scanIntervalMs = 5 * 60 * 1000; // 5 minutes
    this.scanIntervalId = null;
  }
  
  /**
   * Initialize the edge calculator service
   */
  async init(): Promise<boolean> {
    try {
      // Start scheduled edge calculations
      this.startEdgeCalculator();
      
      this.logger.info('Edge calculator service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize edge calculator service:', error);
      return false;
    }
  }
  
  /**
   * Start the edge calculation scanner
   */
  startEdgeCalculator(): void {
    // Clear any existing interval
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
    }
    
    // Start edge calculator scanner
    this.scanIntervalId = setInterval(() => {
      this.scanForEdgeOpportunities();
    }, this.scanIntervalMs);
    
    this.logger.info('Edge calculator scanner started');
  }
  
  /**
   * Stop the edge calculation scanner
   */
  stopEdgeCalculator(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
    
    this.logger.info('Edge calculator scanner stopped');
  }
  
  /**
   * Scan for new edge calculation opportunities
   * Enhanced with RPC Manager integration
   */
  async scanForEdgeOpportunities(): Promise<void> {
    this.logger.debug('Scanning for edge opportunities');
    
    try {
      // Get active patterns that haven't been processed yet
      const patterns = await patternRecognitionService.getActivePatterns({
        status: PatternStatus.CONFIRMED
      });
      
      // Group patterns by token
      const patternsByToken: Record<string, IPattern[]> = {};
      
      for (const pattern of patterns) {
        const key = `${pattern.tokenAddress}-${pattern.network}`;
        if (!patternsByToken[key]) {
          patternsByToken[key] = [];
        }
        patternsByToken[key].push(pattern);
      }
      
      // Look for additional tokens with high activity using RPC manager's getLatestTokens method
      if (patterns.length < this.maxCalculationsPerRun / 2) {
        try {
          // For Solana, find tokens with recent transactions
          // Use Helius endpoint if available
          if (rpcConnectionManager.isEndpointActive('helius')) {
            // Get tokens with recent mints or high transaction volume
            const recentTokens = await rpcConnectionManager.getLatestTokens(20);
            
            for (const token of recentTokens) {
              // Extract token address from the token object
              const tokenAddress = token.mintAddress;
              if (!tokenAddress) continue;
              
              const network = 'solana';
              const key = `${tokenAddress}-${network}`;
              
              // Skip if we already have patterns for this token
              if (patternsByToken[key]) {
                continue;
              }
              
              // Check token activity level using RPC manager
              const signatures = await rpcConnectionManager.getSignaturesForAddress(tokenAddress, 50);
              
              if (signatures && signatures.length > 20) {
                // High activity token - calculate edge directly
                try {
                  await this.calculateEdge(tokenAddress, network, []);
                } catch (error) {
                  this.logger.error(`Error calculating edge for high activity token ${tokenAddress}:`, error);
                }
              }
            }
          } else {
            // If Helius is not available, use the regular RPC endpoint
            // Look for tokens with high transaction volume using Jupiter API or another method
            const activeTokens = await marketDataService.discoverNewTokens('solana', 10000);
            
            for (const token of activeTokens.slice(0, 10)) { // Limit to top 10
              const key = `${token.address}-${token.network}`;
              
              // Skip if we already have patterns for this token
              if (patternsByToken[key]) {
                continue;
              }
              
              // Check activity level
              const signatures = await rpcConnectionManager.getSignaturesForAddress(token.address, 50);
              
              if (signatures && signatures.length > 20) {
                // High activity token - calculate edge directly
                try {
                  await this.calculateEdge(token.address, token.network, []);
                } catch (error) {
                  this.logger.error(`Error calculating edge for discovered token ${token.address}:`, error);
                }
              }
            }
          }
        } catch (error) {
          this.logger.error('Error finding additional tokens with RPC manager:', error);
        }
      }
      
      // Sort tokens by pattern count (prioritize tokens with more signals)
      const tokenKeys = Object.keys(patternsByToken).sort((a, b) => 
        patternsByToken[b].length - patternsByToken[a].length
      );
      
      // Limit calculations per run
      const tokensToProcess = tokenKeys.slice(0, this.maxCalculationsPerRun);
      
      // Process each token
      for (const tokenKey of tokensToProcess) {
        const [tokenAddress, network] = tokenKey.split('-');
        
        // Check if we already have a recent calculation
        const recentCalculation = await EdgeCalculation.findOne({
          tokenAddress,
          network,
          status: { $in: [EdgeStatus.CALCULATED, EdgeStatus.EXECUTED] },
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });
        
        if (recentCalculation) {
          // Skip if we already have a recent calculation
          continue;
        }
        
        try {
          // Calculate edge for this token
          await this.calculateEdge(tokenAddress, network, patternsByToken[tokenKey]);
        } catch (error) {
          this.logger.error(`Error calculating edge for ${tokenKey}:`, error);
        }
      }
      
      // Expire old calculations
      await this.expireOldCalculations(24);
      
    } catch (error) {
      this.logger.error('Error in edge opportunity scanner:', error);
    }
  }
  
  /**
   * Calculate edge for a specific token
   * Enhanced implementation with multi-timeframe analysis, smart money weighting,
   * and improved mathematical edge calculation
   */
  async calculateEdge(
    tokenAddress: string, 
    network: string, 
    patterns: IPattern[]
  ): Promise<IEdgeCalculation | null> {
    try {
      if (network !== 'solana') {
        this.logger.warn(`Network ${network} not supported for edge calculation`);
        return null;
      }
      
      // Get token metadata and price
      const tokenMetadata = await marketDataService.getTokenMetadata(tokenAddress, network);
      if (!tokenMetadata) {
        this.logger.warn(`Could not get token metadata for ${tokenAddress} on ${network}`);
        return null;
      }
      
      const tokenPrice = await marketDataService.getTokenPrice(tokenAddress, network);
      if (!tokenPrice) {
        this.logger.warn(`Could not get token price for ${tokenAddress} on ${network}`);
        return null;
      }
      
      // 1. Calculate Pattern Factor with enhanced multi-timeframe analysis
      const patternFactor = await this.calculateEnhancedPatternFactor(patterns, tokenAddress, network);
      
      // 2. Calculate Smart Money Factor with more nuanced weighting
      const smartMoneyFactor = await this.calculateEnhancedSmartMoneyFactor(tokenAddress, network);
      
      // 3. Calculate Market Conditions Factor with broader market context
      const marketConditionsFactor = await this.calculateEnhancedMarketConditionsFactor(tokenAddress, network);
      
      // 4. Calculate Historical Success Factor with Bayesian adjustment
      const historicalSuccessFactor = await this.calculateEnhancedHistoricalSuccessFactor(patterns, tokenAddress);
      
      // 5. Calculate Price Action Momentum Factor (new)
      const momentumFactor = await this.calculateMomentumFactor(tokenAddress, network);
      
      // 6. Calculate Market Context Factor (new)
      const marketContextFactor = await this.calculateMarketContextFactor(network);
      
      // Combine all factors
      const factors: EdgeFactor[] = [
        patternFactor,
        smartMoneyFactor,
        marketConditionsFactor,
        historicalSuccessFactor,
        momentumFactor,
        marketContextFactor
      ];
      
      // Calculate overall confidence score with weighted dynamic adjustment
      const rawConfidenceScore = factors.reduce((sum, factor) => sum + factor.weightedScore, 0);
      
      // Apply dynamic adjustment based on factor correlation
      const adjustedConfidenceScore = this.applyDynamicConfidenceAdjustment(rawConfidenceScore, factors);
      
      // Round to one decimal place
      const confidenceScore = Math.round(adjustedConfidenceScore * 10) / 10;
      
      // Determine confidence level
      const confidenceLevel = this.determineConfidenceLevel(confidenceScore);
      
      // Skip if confidence score is too low
      if (confidenceScore < this.minimumConfidenceScore) {
        this.logger.debug(`Skipping edge calculation for ${tokenMetadata.symbol} - confidence too low (${confidenceScore})`);
        return null;
      }
      
      // Determine direction (supporting SHORT trading when appropriate)
      const direction = this.determineTradeDirection(patterns, momentumFactor);
      
      // Calculate targets and stop loss with advanced projection
      const targets = await this.calculateEnhancedTargets(tokenPrice.price, confidenceScore, patterns, tokenAddress, network, direction);
      const stopLoss = await this.calculateEnhancedStopLoss(tokenPrice.price, patterns, tokenAddress, network, direction);
      
      // Calculate risk/reward metrics
      const potentialRisk = direction === TradeDirection.LONG ? 
        tokenPrice.price - stopLoss : 
        stopLoss - tokenPrice.price;
      
      const potentialReward = direction === TradeDirection.LONG ? 
        targets.primaryTarget.price - tokenPrice.price : 
        tokenPrice.price - targets.primaryTarget.price;
      
      const riskRewardRatio = potentialReward / potentialRisk;
      
      // Skip if risk/reward is too low
      if (riskRewardRatio < this.minimumRiskRewardRatio) {
        this.logger.debug(`Skipping edge calculation for ${tokenMetadata.symbol} - risk/reward too low (${riskRewardRatio.toFixed(2)})`);
        return null;
      }
      
      // Calculate expected value using enhanced probability modeling
      const expectedValue = this.calculateEnhancedExpectedValue(
        tokenPrice.price,
        targets.primaryTarget,
        targets.secondaryTarget,
        stopLoss,
        direction
      );
      
      // Apply Kelly Criterion for optimal position sizing
      const kellySizing = this.calculateKellyPosition(
        targets.primaryTarget.probability,
        riskRewardRatio
      );
      
      // Create edge calculation record
      const edge = new EdgeCalculation({
        tokenAddress,
        network,
        symbol: tokenMetadata.symbol,
        timestamp: new Date(),
        status: EdgeStatus.CALCULATED,
        confidenceLevel,
        confidenceScore,
        direction,
        currentPrice: tokenPrice.price,
        primaryTarget: targets.primaryTarget,
        secondaryTarget: targets.secondaryTarget,
        stopLoss,
        expectedValue,
        potentialRisk,
        potentialReward,
        riskRewardRatio,
        kellySizing,
        factors,
        patternIds: patterns.map(p => p._id),
        smartMoneySignals: smartMoneyFactor.metadata,
        marketConditions: {
          ...marketConditionsFactor.metadata,
          marketContext: marketContextFactor.metadata
        },
        tags: [tokenMetadata.symbol, network, ...patterns.map(p => p.patternType)]
      });
      
      // Determine if we have a trade opportunity
      if (confidenceScore >= this.edgeThreshold) {
        edge.notes = `High confidence trade opportunity detected with ${confidenceScore.toFixed(1)}% confidence score and ${riskRewardRatio.toFixed(2)} risk/reward ratio. Kelly criterion suggests ${(kellySizing * 100).toFixed(1)}% position size.`;
      } else {
        edge.notes = `Moderate confidence. Monitor for additional signals. Kelly criterion suggests ${(kellySizing * 100).toFixed(1)}% position size if traded.`;
      }
      
      // Save edge calculation
      await edge.save();
      
      this.logger.info(`Calculated edge for ${tokenMetadata.symbol}: ${confidenceScore.toFixed(1)}% confidence, ${riskRewardRatio.toFixed(2)} R/R ratio, ${(kellySizing * 100).toFixed(1)}% Kelly size`);
      
      return edge;
    } catch (error) {
      this.logger.error(`Error calculating edge for ${tokenAddress} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Enhanced pattern factor calculation with multi-timeframe correlation analysis
   */
  private async calculateEnhancedPatternFactor(
    patterns: IPattern[],
    tokenAddress: string,
    network: string
  ): Promise<EdgeFactor> {
    try {
      // Start with base scores
      let patternConfidenceScore = 0;
      let patternTypeScore = 0;
      let patternTimeframeScore = 0;
      let patternMultiTimeframeScore = 0;
      
      // Pattern confidence factor
      if (patterns.length > 0) {
        // Average confidence across all patterns
        patternConfidenceScore = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
      }
      
      // Improved pattern type weights based on historical performance
      const patternTypeWeights: Record<string, number> = {
        breakout: 0.92,
        vRecovery: 0.82,
        bullFlag: 0.88,
        cupAndHandle: 0.91,
        inverseHeadAndShoulders: 0.86,
        roundedBottom: 0.82,
        accumulation: 0.78,
        smartMoneyAccumulation: 0.96,
        // Add support for bearish patterns
        headAndShoulders: 0.84,
        doubleTop: 0.87,
        bearishChannel: 0.81,
        wedgeDown: 0.83
      };
      
      let totalTypeWeight = 0;
      for (const pattern of patterns) {
        totalTypeWeight += patternTypeWeights[pattern.patternType] || 0.75;
      }
      
      if (patterns.length > 0) {
        patternTypeScore = (totalTypeWeight / patterns.length) * 100;
      }
      
      // Pattern timeframe analysis - higher score for multiple timeframes
      const timeframes = new Set(patterns.map(p => p.timeframe));
      
      // Basic timeframe score
      patternTimeframeScore = timeframes.size > 1 ? 90 : 60;
      
      // Enhanced multi-timeframe correlation analysis
      if (timeframes.size > 1) {
        // Check for patterns at multiple timeframes
        const timeframeGroups: Record<string, IPattern[]> = {};
        
        // Group patterns by timeframe
        for (const pattern of patterns) {
          if (!timeframeGroups[pattern.timeframe]) {
            timeframeGroups[pattern.timeframe] = [];
          }
          timeframeGroups[pattern.timeframe].push(pattern);
        }
        
        // Check if different timeframes show similar patterns
        // (higher score for consistent patterns across timeframes)
        const patternTypes = new Set<string>();
        Object.values(timeframeGroups).forEach(group => {
          group.forEach(pattern => patternTypes.add(pattern.patternType));
        });
        
        // Analyze consistency between timeframes
        // If same pattern types appear across multiple timeframes, it's very bullish
        if (patternTypes.size === 1) {
          // Same pattern across all timeframes - highest score
          patternMultiTimeframeScore = 100;
        } else if (patternTypes.size < timeframes.size) {
          // Some consistency in patterns - high score
          patternMultiTimeframeScore = 85;
        } else {
          // Different patterns at different timeframes - moderate score
          patternMultiTimeframeScore = 70;
        }
        
        // If we have no patterns, but the token has activity, check for lower timeframe patterns
        if (patterns.length === 0) {
          // Query for additional patterns in smaller timeframes
          const smallTimeframePatterns = await patternRecognitionService.detectPatterns(
            tokenAddress,
            network,
            ['1m', '5m', '15m'] // Small timeframes
          );
          
          if (smallTimeframePatterns && smallTimeframePatterns.length > 0) {
            patternMultiTimeframeScore = 50; // Lower score, but still consider these patterns
          }
        }
      } else if (patterns.length > 0) {
        // Single timeframe - lower but still valid score
        patternMultiTimeframeScore = 60;
      }
      
      // Calculate weighted scores
      const patternConfidenceWeightedScore = patternConfidenceScore * (this.factorWeights.patternConfidence / 100);
      const patternTypeWeightedScore = patternTypeScore * (this.factorWeights.patternType / 100);
      const patternTimeframeWeightedScore = patternTimeframeScore * (this.factorWeights.patternTimeframe / 100);
      const patternMultiTimeframeWeightedScore = patternMultiTimeframeScore * (this.factorWeights.patternMultiTimeframe / 100);
      
      // Combine into a single pattern factor
      const patternFactorScore = patternConfidenceWeightedScore + 
                                patternTypeWeightedScore + 
                                patternTimeframeWeightedScore + 
                                patternMultiTimeframeWeightedScore;
                                
      const patternFactorWeight = this.factorWeights.patternConfidence + 
                                this.factorWeights.patternType + 
                                this.factorWeights.patternTimeframe +
                                this.factorWeights.patternMultiTimeframe;
                                
      // Calculate final weighted score
      const patternFactorWeightedScore = (patternFactorScore / 4) * (patternFactorWeight / 100);
      
      return {
        name: 'Pattern Analysis',
        score: patternFactorScore / 4, // Normalize to 0-100 scale
        weight: patternFactorWeight,
        weightedScore: patternFactorWeightedScore,
        metadata: {
          patternCount: patterns.length,
          timeframes: Array.from(timeframes),
          patternTypes: patterns.map(p => p.patternType),
          patternConfidences: patterns.map(p => p.confidence),
          multiTimeframeScore: patternMultiTimeframeScore
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating enhanced pattern factor:`, error);
      
      // Return a default factor if there's an error
      return {
        name: 'Pattern Analysis',
        score: patterns.length > 0 ? 60 : 40,
        weight: this.factorWeights.patternConfidence + 
                this.factorWeights.patternType + 
                this.factorWeights.patternTimeframe +
                this.factorWeights.patternMultiTimeframe,
        weightedScore: (patterns.length > 0 ? 60 : 40) * 
                      ((this.factorWeights.patternConfidence + 
                        this.factorWeights.patternType + 
                        this.factorWeights.patternTimeframe +
                        this.factorWeights.patternMultiTimeframe) / 100),
        metadata: {
          patternCount: patterns.length,
          timeframes: Array.from(new Set(patterns.map(p => p.timeframe))),
          patternTypes: patterns.map(p => p.patternType)
        }
      };
    }
  }
  
  /**
   * Enhanced smart money factor with wallet quality assessment
   */
  private async calculateEnhancedSmartMoneyFactor(
    tokenAddress: string, 
    network: string
  ): Promise<EdgeFactor> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network for smart money analysis: ${network}`);
      }
      
      // Get smart wallets from external wallet scraper service
      const smartWallets = await externalWalletScraper.getSmartWallets(network);
      
      if (!smartWallets || smartWallets.length === 0) {
        this.logger.warn('No smart wallets available for analysis');
        
        // Return a default factor if no smart wallets data
        return {
          name: 'Smart Money Activity',
          score: 50, // Neutral score
          weight: this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality,
          weightedScore: 50 * ((this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality) / 100),
          metadata: {
            walletCount: 0,
            buys: 0,
            sells: 0,
            netBuys: 0,
            buyPressure: 50,
            walletQuality: {
              highPerformers: 0,
              mediumPerformers: 0,
              lowPerformers: 0
            }
          }
        };
      }
      
      // Track activity from smart wallets for this token
      let walletCount = 0;
      let totalBuys = 0;
      let totalSells = 0;
      
      // Enhanced wallet quality assessment
      let highPerformerCount = 0;
      let mediumPerformerCount = 0;
      let lowPerformerCount = 0;
      
      // Track token amount changes more precisely
      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      
      // Track timing of smart money activity
      const recentActivityTimestamps: number[] = [];
      
      for (const wallet of smartWallets) {
        try {
          // Use performance rating to categorize wallets (high, medium, low performers)
          if (wallet.performanceRating >= 8) {
            highPerformerCount++;
          } else if (wallet.performanceRating >= 6) {
            mediumPerformerCount++;
          } else {
            lowPerformerCount++;
          }
          
          // Get token accounts for this wallet using RPC manager
          const tokenAccounts = await rpcConnectionManager.getTokenAccountsByOwner(wallet.address);
          
          // Check if wallet holds the token
          const hasToken = tokenAccounts.some(account => 
            account.account?.data?.parsed?.info?.mint === tokenAddress && 
            parseFloat(account.account?.data?.parsed?.info?.tokenAmount?.uiAmount || '0') > 0
          );
          
          if (hasToken) {
            walletCount++;
          }
          
          // Get recent transactions for this wallet to find buys/sells
          const signatures = await rpcConnectionManager.getSignaturesForAddress(wallet.address, 50);
          
          if (signatures && signatures.length > 0) {
            for (const sig of signatures) {
              try {
                // Track timestamps for recency analysis
                if (sig.blockTime) {
                  recentActivityTimestamps.push(sig.blockTime);
                }
                
                const tx = await rpcConnectionManager.getTransaction(sig.signature);
                
                if (tx && this.isTransactionInvolvingToken(tx, tokenAddress)) {
                  // Determine if this was a buy or sell
                  const isBuy = this.isTokenBuyTransaction(tx, wallet.address, tokenAddress);
                  const isSell = this.isTokenSellTransaction(tx, wallet.address, tokenAddress);
                  
                  if (isBuy) {
                    totalBuys++;
                    // Try to extract the amount bought
                    const amount = this.extractTokenAmount(tx, tokenAddress);
                    if (amount > 0) {
                      totalBuyAmount += amount;
                    }
                  }
                  
                  if (isSell) {
                    totalSells++;
                    // Try to extract the amount sold
                    const amount = this.extractTokenAmount(tx, tokenAddress);
                    if (amount > 0) {
                      totalSellAmount += amount;
                    }
                  }
                }
              } catch (e) {
                // Skip errors for individual transactions
              }
            }
          }
        } catch (error) {
          this.logger.debug(`Error analyzing smart wallet ${wallet.address}:`, error);
        }
      }
      
      // Create smart money activity data with enhanced metrics
      const smartMoneyActivity = {
        walletCount,
        buys: totalBuys,
        sells: totalSells,
        netBuys: totalBuys - totalSells,
        buyPressure: 0,
        buyAmount: totalBuyAmount,
        sellAmount: totalSellAmount,
        netAmount: totalBuyAmount - totalSellAmount,
        walletQuality: {
          highPerformers: highPerformerCount,
          mediumPerformers: mediumPerformerCount,
          lowPerformers: lowPerformerCount
        },
        recencyScore: 0 // Will calculate below
      };
      
      // Calculate buy pressure (ratio of buys to total transactions)
      const totalTransactions = totalBuys + totalSells;
      smartMoneyActivity.buyPressure = totalTransactions > 0 ? 
        (totalBuys / totalTransactions) * 100 : 50;
      
      // Calculate recency score - more recent activity gets higher score
      if (recentActivityTimestamps.length > 0) {
        // Sort timestamps (most recent first)
        recentActivityTimestamps.sort((a, b) => b - a);
        
        // Calculate how recent the activity is (0-100 scale)
        const now = Math.floor(Date.now() / 1000);
        const mostRecent = recentActivityTimestamps[0];
        const hoursSinceLastActivity = (now - mostRecent) / 3600;
        
        // Score based on recency (higher score for more recent activity)
        // Within 1 hour = 100, 24 hours = 75, 48 hours = 50, 72 hours = 25, older = 0
        if (hoursSinceLastActivity <= 1) {
          smartMoneyActivity.recencyScore = 100;
        } else if (hoursSinceLastActivity <= 24) {
          smartMoneyActivity.recencyScore = 75 + (24 - hoursSinceLastActivity) / 24 * 25;
        } else if (hoursSinceLastActivity <= 48) {
          smartMoneyActivity.recencyScore = 50 + (48 - hoursSinceLastActivity) / 24 * 25;
        } else if (hoursSinceLastActivity <= 72) {
          smartMoneyActivity.recencyScore = 25 + (72 - hoursSinceLastActivity) / 24 * 25;
        } else {
          smartMoneyActivity.recencyScore = Math.max(0, 25 - (hoursSinceLastActivity - 72) / 24 * 5);
        }
      }
      
      // Calculate smart money activity score (0-100)
      let smartMoneyActivityScore = 0;
      
      // Score based on wallet count (more smart wallets = higher score)
      if (smartMoneyActivity.walletCount >= 8) {
        smartMoneyActivityScore += 100;
      } else if (smartMoneyActivity.walletCount >= 5) {
        smartMoneyActivityScore += 80;
      } else if (smartMoneyActivity.walletCount >= 3) {
        smartMoneyActivityScore += 60;
      } else if (smartMoneyActivity.walletCount >= 1) {
        smartMoneyActivityScore += 40;
      }
      
      // Score based on buy pressure (more buying = higher score)
      if (smartMoneyActivity.buyPressure >= 90) {
        smartMoneyActivityScore += 100;
      } else if (smartMoneyActivity.buyPressure >= 75) {
        smartMoneyActivityScore += 80;
      } else if (smartMoneyActivity.buyPressure >= 60) {
        smartMoneyActivityScore += 60;
      } else if (smartMoneyActivity.buyPressure >= 50) {
        smartMoneyActivityScore += 40;
      } else {
        smartMoneyActivityScore += 0; // Less than 50% buy pressure is negative
      }
      
      // Score based on recency (more recent = higher score)
      smartMoneyActivityScore += smartMoneyActivity.recencyScore;
      
      // Average the scores
      smartMoneyActivityScore = smartMoneyActivityScore / 3;
      
      // Calculate wallet quality score (0-100)
      let walletQualityScore = 0;
      
      // Weight high performers more heavily
      const weightedWalletCount = (highPerformerCount * 3) + (mediumPerformerCount * 1.5) + lowPerformerCount;
      const totalQualityWalletCount = highPerformerCount + mediumPerformerCount + lowPerformerCount;
      
      if (totalQualityWalletCount > 0) {
        // Score based on average weighted quality of wallets involved
        walletQualityScore = (weightedWalletCount / totalQualityWalletCount) * 33.33; // Scale to 0-100
      }
      
      // Add points for each high performer involved
      if (highPerformerCount >= 3) {
        walletQualityScore += 50;
      } else if (highPerformerCount >= 2) {
        walletQualityScore += 35;
      } else if (highPerformerCount >= 1) {
        walletQualityScore += 20;
      }
      
      // Add points for medium performers (but less than high performers)
      if (mediumPerformerCount >= 4) {
        walletQualityScore += 25;
      } else if (mediumPerformerCount >= 2) {
        walletQualityScore += 15;
      } else if (mediumPerformerCount >= 1) {
        walletQualityScore += 5;
      }
      
      // Cap the quality score at 100
      walletQualityScore = Math.min(100, walletQualityScore);
      
      // Calculate weighted scores
      const smartMoneyActivityWeightedScore = smartMoneyActivityScore * (this.factorWeights.smartMoneyActivity / 100);
      const walletQualityWeightedScore = walletQualityScore * (this.factorWeights.smartMoneyQuality / 100);
      
      // Calculate combined score and weight
      const smartMoneyScore = (smartMoneyActivityScore * (this.factorWeights.smartMoneyActivity / 100) + 
                              walletQualityScore * (this.factorWeights.smartMoneyQuality / 100)) / 
                              ((this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality) / 100);
                              
      const smartMoneyWeight = this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality;
      const smartMoneyWeightedScore = smartMoneyScore * (smartMoneyWeight / 100);
      
      return {
        name: 'Smart Money Activity',
        score: smartMoneyScore,
        weight: smartMoneyWeight,
        weightedScore: smartMoneyWeightedScore,
        metadata: {
          ...smartMoneyActivity,
          activityScore: smartMoneyActivityScore,
          qualityScore: walletQualityScore
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating enhanced smart money factor for ${tokenAddress} on ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Smart Money Activity',
        score: 50, // Neutral score
        weight: this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality,
        weightedScore: 50 * ((this.factorWeights.smartMoneyActivity + this.factorWeights.smartMoneyQuality) / 100),
        metadata: {
          walletCount: 0,
          buys: 0,
          sells: 0,
          netBuys: 0,
          buyPressure: 50,
          walletQuality: {
            highPerformers: 0,
            mediumPerformers: 0,
            lowPerformers: 0
          }
        }
      };
    }
  }
  
  /**
   * Extract token amount from a transaction
   */
  private extractTokenAmount(tx: any, tokenAddress: string): number {
    try {
      if (tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
        // Find the token balances
        const preTokenBalances = tx.meta.preTokenBalances.filter((b: any) => b.mint === tokenAddress);
        const postTokenBalances = tx.meta.postTokenBalances.filter((b: any) => b.mint === tokenAddress);
        
        if (preTokenBalances.length > 0 && postTokenBalances.length > 0) {
          // Calculate total change across all accounts
          let preTotalAmount = 0;
          let postTotalAmount = 0;
          
          for (const balance of preTokenBalances) {
            preTotalAmount += parseFloat(balance.uiTokenAmount?.uiAmount || '0');
          }
          
          for (const balance of postTokenBalances) {
            postTotalAmount += parseFloat(balance.uiTokenAmount?.uiAmount || '0');
          }
          
          // Return absolute value of the change
          return Math.abs(postTotalAmount - preTotalAmount);
        }
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Enhanced market conditions factor with advanced metrics
   */
  private async calculateEnhancedMarketConditionsFactor(
    tokenAddress: string,
    network: string
  ): Promise<EdgeFactor> {
    try {
      // Get liquidity data
      const liquidityDistribution = await marketDataService.getTokenLiquidity(tokenAddress, network);
      const totalLiquidity = liquidityDistribution ? 
        liquidityDistribution.reduce((sum, item) => sum + item.liquidityUSD, 0) : 0;
      
      // Calculate manipulation score using RPC manager-enhanced methods
      const manipulationScore = await marketDataService.calculateManipulationScore(tokenAddress, network) || 50;
      
      // Get market data for volatility calculation (multiple timeframes)
      const marketHistory15m = await marketDataService.getMarketHistory(tokenAddress, network, '15m', 96); // 24 hours in 15m
      const marketHistory1h = await marketDataService.getMarketHistory(tokenAddress, network, '1h', 48); // 48 hours in 1h
      const marketHistory4h = await marketDataService.getMarketHistory(tokenAddress, network, '4h', 42); // 7 days in 4h
      
      // Calculate volatility score with enhanced multi-timeframe approach
      let volatilityScore = this.calculateEnhancedVolatilityScore(
        marketHistory15m || [],
        marketHistory1h || [],
        marketHistory4h || []
      );
      
      // Calculate liquidity distribution score - penalize if liquidity is too concentrated
      let liquidityDistributionScore = 100; // Start with perfect score
      if (liquidityDistribution && liquidityDistribution.length > 0) {
        // Calculate concentration metrics
        const topExchangePercentage = liquidityDistribution[0].percentage;
        
        // Penalize if too concentrated in one exchange
        if (topExchangePercentage > 90) {
          liquidityDistributionScore = 60; // Severe concentration
        } else if (topExchangePercentage > 80) {
          liquidityDistributionScore = 70; // High concentration
        } else if (topExchangePercentage > 70) {
          liquidityDistributionScore = 80; // Moderate concentration
        } else if (topExchangePercentage > 60) {
          liquidityDistributionScore = 90; // Slight concentration
        }
        
        // Additional penalty if very few exchanges
        if (liquidityDistribution.length === 1) {
          liquidityDistributionScore -= 20; // Single exchange
        } else if (liquidityDistribution.length === 2) {
          liquidityDistributionScore -= 10; // Only two exchanges
        }
      }
      
      // Calculate liquidity score with more granular tiers
      let liquidityScore = 0;
      
      if (totalLiquidity >= 2000000) { // $2M+
        liquidityScore = 100;
      } else if (totalLiquidity >= 1000000) { // $1M+
        liquidityScore = 90;
      } else if (totalLiquidity >= 500000) { // $500K+
        liquidityScore = 80;
      } else if (totalLiquidity >= 250000) { // $250K+
        liquidityScore = 70;
      } else if (totalLiquidity >= 100000) { // $100K+
        liquidityScore = 60;
      } else if (totalLiquidity >= 50000) { // $50K+
        liquidityScore = 50;
      } else if (totalLiquidity >= 25000) { // $25K+
        liquidityScore = 40;
      } else if (totalLiquidity >= 10000) { // $10K+
        liquidityScore = 30;
      } else if (totalLiquidity > 0) {
        liquidityScore = 20;
      }
      
      // Manipulation penalty (higher score = more manipulation = bad)
      // Invert so higher is better
      const manipulationFactor = Math.max(0, 100 - manipulationScore);
      
      // Calculate combined liquidity score (blend of amount and distribution)
      const combinedLiquidityScore = (liquidityScore * 0.7) + (liquidityDistributionScore * 0.3);
      
      // Calculate overall market conditions score
      const marketLiquidityWeightedScore = combinedLiquidityScore * (this.factorWeights.marketLiquidity / 100);
      const marketManipulationWeightedScore = manipulationFactor * (this.factorWeights.marketManipulation / 100);
      const marketVolatilityWeightedScore = volatilityScore * (this.factorWeights.marketVolatility / 100);
      
      const marketConditionsScore = marketLiquidityWeightedScore + marketManipulationWeightedScore + marketVolatilityWeightedScore;
      const marketConditionsWeight = this.factorWeights.marketLiquidity + this.factorWeights.marketManipulation + this.factorWeights.marketVolatility;
      const marketConditionsWeightedScore = marketConditionsScore * (marketConditionsWeight / 100);
      
      return {
        name: 'Market Conditions',
        score: marketConditionsScore,
        weight: marketConditionsWeight,
        weightedScore: marketConditionsWeightedScore,
        metadata: {
          liquidityScore: combinedLiquidityScore,
          manipulationScore: manipulationFactor,
          volatilityScore,
          totalLiquidityUSD: totalLiquidity,
          liquidityDistribution: liquidityDistribution ? liquidityDistribution.slice(0, 3) : [],
          liquidityDistributionScore
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating enhanced market conditions factor for ${tokenAddress} on ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Market Conditions',
        score: 50, // Neutral score
        weight: this.factorWeights.marketLiquidity + this.factorWeights.marketManipulation + this.factorWeights.marketVolatility,
        weightedScore: 50 * ((this.factorWeights.marketLiquidity + this.factorWeights.marketManipulation + this.factorWeights.marketVolatility) / 100),
        metadata: {
          liquidityScore: 50,
          manipulationScore: 50,
          volatilityScore: 50,
          totalLiquidityUSD: 0
        }
      };
    }
  }
  
  /**
   * Enhanced volatility score calculation with multi-timeframe analysis
   */
  private calculateEnhancedVolatilityScore(
    shortCandles: any[], // 15m
    mediumCandles: any[], // 1h
    longCandles: any[] // 4h
  ): number {
    try {
      // Default score if no data available
      if (shortCandles.length === 0 && mediumCandles.length === 0 && longCandles.length === 0) {
        return 50; // Neutral score
      }
      
      // Calculate volatility for each timeframe
      const shortVolatility = this.calculateTimeframeVolatility(shortCandles);
      const mediumVolatility = this.calculateTimeframeVolatility(mediumCandles);
      const longVolatility = this.calculateTimeframeVolatility(longCandles);
      
      // Weight volatilities (more weight to longer timeframes)
      let weightedVolatility = 0;
      let totalWeight = 0;
      
      if (shortVolatility !== null) {
        weightedVolatility += shortVolatility * 1;
        totalWeight += 1;
      }
      
      if (mediumVolatility !== null) {
        weightedVolatility += mediumVolatility * 2;
        totalWeight += 2;
      }
      
      if (longVolatility !== null) {
        weightedVolatility += longVolatility * 3;
        totalWeight += 3;
      }
      
      // Calculate average weighted volatility
      const avgVolatility = totalWeight > 0 ? weightedVolatility / totalWeight : 2; // Default to 2 if no data
      
      // Score based on volatility (moderate volatility is best)
      let volatilityScore = 0;
      
      if (avgVolatility < 0.5) {
        volatilityScore = 40; // Too low volatility
      } else if (avgVolatility < 1.5) {
        volatilityScore = 60; // Low volatility
      } else if (avgVolatility < 3) {
        volatilityScore = 90; // Moderate volatility (good)
      } else if (avgVolatility < 5) {
        volatilityScore = 70; // Moderately high volatility
      } else if (avgVolatility < 8) {
        volatilityScore = 50; // High volatility
      } else if (avgVolatility < 12) {
        volatilityScore = 30; // Very high volatility
      } else {
        volatilityScore = 10; // Extremely high volatility
      }
      
      return volatilityScore;
    } catch (error) {
      // Return neutral score on error
      return 50;
    }
  }
  
  /**
   * Calculate volatility for a specific timeframe
   */
  private calculateTimeframeVolatility(candles: any[]): number | null {
    if (!candles || candles.length < 5) {
      return null; // Not enough data
    }
    
    try {
      // Calculate price changes
      const priceChanges = [];
      for (let i = 1; i < candles.length; i++) {
        const percentChange = ((candles[i].close - candles[i-1].close) / candles[i-1].close) * 100;
        priceChanges.push(Math.abs(percentChange)); // Use absolute value
      }
      
      // Calculate average volatility
      const avgVolatility = priceChanges.reduce((sum, val) => sum + val, 0) / priceChanges.length;
      
      return avgVolatility;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Calculate enhanced historical success factor with Bayesian adjustment
   */
  private async calculateEnhancedHistoricalSuccessFactor(
    patterns: IPattern[],
    tokenAddress: string
  ): Promise<EdgeFactor> {
    try {
      // Get pattern statistics
      const patternStats = await patternRecognitionService.getPatternStats();
      
      // Get token-specific historical performance
      const tokenHistory = await this.getTokenTradingHistory(tokenAddress);
      
      if (!patternStats || patternStats.totalPatterns === 0) {
        // No historical data available
        return {
          name: 'Historical Success',
          score: 50, // Neutral score
          weight: this.factorWeights.historicalSuccess,
          weightedScore: 50 * (this.factorWeights.historicalSuccess / 100),
          metadata: {
            overallSuccessRate: 0,
            patternTypeSuccessRates: {},
            tokenSpecificSuccessRate: 0
          }
        };
      }
      
      // Calculate historical success score based on pattern types
      let totalTypeSuccessRate = 0;
      let patternCount = 0;
      const patternTypeSuccessRates: Record<string, number> = {};
      
      for (const pattern of patterns) {
        if (patternStats.statsByType[pattern.patternType]) {
          const typeStats = patternStats.statsByType[pattern.patternType];
          const successRate = typeStats.successRate;
          
          patternTypeSuccessRates[pattern.patternType] = successRate;
          totalTypeSuccessRate += successRate;
          patternCount++;
        }
      }
      
      // Calculate average success rate
      const globalSuccessRate = patternStats.successRate;
      const patternSpecificSuccessRate = patternCount > 0 ? totalTypeSuccessRate / patternCount : globalSuccessRate;
      
      // Apply Bayesian adjustment if we have token-specific history
      let bayesianSuccessRate = patternSpecificSuccessRate;
      
      if (tokenHistory && tokenHistory.tradeCount > 0) {
        // Weight the token-specific data based on sample size
        const tokenWeight = Math.min(0.5, tokenHistory.tradeCount / 10); // Max 50% weight for token history
        const patternWeight = 1 - tokenWeight;
        
        // Blend token-specific and pattern-specific success rates
        bayesianSuccessRate = (tokenHistory.successRate * tokenWeight) + 
                              (patternSpecificSuccessRate * patternWeight);
      }
      
      // Map success rate to score (0-100)
      const historicalSuccessScore = Math.min(100, bayesianSuccessRate);
      
      // Calculate weighted score
      const historicalSuccessWeightedScore = historicalSuccessScore * (this.factorWeights.historicalSuccess / 100);
      
      return {
        name: 'Historical Success',
        score: historicalSuccessScore,
        weight: this.factorWeights.historicalSuccess,
        weightedScore: historicalSuccessWeightedScore,
        metadata: {
          overallSuccessRate: patternStats.successRate,
          patternTypeSuccessRates,
          tokenSpecificSuccessRate: tokenHistory ? tokenHistory.successRate : 0,
          tokenTradeCount: tokenHistory ? tokenHistory.tradeCount : 0,
          bayesianSuccessRate
        }
      };
    } catch (error) {
      this.logger.error('Error calculating enhanced historical success factor:', error);
      
      // Return default factor on error
      return {
        name: 'Historical Success',
        score: 50, // Neutral score
        weight: this.factorWeights.historicalSuccess,
        weightedScore: 50 * (this.factorWeights.historicalSuccess / 100),
        metadata: {
          overallSuccessRate: 0,
          patternTypeSuccessRates: {},
          tokenSpecificSuccessRate: 0
        }
      };
    }
  }
  
  /**
   * Get token-specific trading history
   */
  private async getTokenTradingHistory(tokenAddress: string): Promise<{
    successRate: number;
    tradeCount: number;
    profitFactor: number;
  } | null> {
    try {
      // Query historical edge calculations for this token
      const history = await EdgeCalculation.find({
        tokenAddress,
        status: EdgeStatus.EXECUTED
      });
      
      if (!history || history.length === 0) {
        return null; // No history available
      }
      
      // Calculate success metrics
      let successCount = 0;
      let totalProfit = 0;
      let totalLoss = 0;
      
      for (const trade of history) {
        if (!trade.executionDetails || !trade.executionDetails.executionPrice) continue;
        
        const entryPrice = trade.executionDetails.executionPrice;
        const targetPrice = trade.primaryTarget.price;
        const stopLossPrice = trade.stopLoss;
        
        // Determine if trade was successful (hit target before stop loss)
        // For simplicity, assume yes if this trade is in executed status
        // In a real implementation, you would track the actual outcome
        if (trade.direction === TradeDirection.LONG) {
          const profit = (targetPrice - entryPrice) / entryPrice;
          const loss = (entryPrice - stopLossPrice) / entryPrice;
          
          if (profit > 0) {
            successCount++;
            totalProfit += profit;
          } else {
            totalLoss += loss;
          }
        } else {
          // Short trade
          const profit = (entryPrice - targetPrice) / entryPrice;
          const loss = (stopLossPrice - entryPrice) / entryPrice;
          
          if (profit > 0) {
            successCount++;
            totalProfit += profit;
          } else {
            totalLoss += loss;
          }
        }
      }
      
      const successRate = (successCount / history.length) * 100;
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit;
      
      return {
        successRate,
        tradeCount: history.length,
        profitFactor
      };
    } catch (error) {
      this.logger.error(`Error getting token trading history for ${tokenAddress}:`, error);
      return null;
    }
  }
  
  /**
   * Calculate momentum factor (price action analysis)
   */
  private async calculateMomentumFactor(
    tokenAddress: string,
    network: string
  ): Promise<EdgeFactor> {
    try {
      // Get market history at multiple timeframes
      const shortTerm = await marketDataService.getMarketHistory(tokenAddress, network, '15m', 20); // Last 5 hours
      const mediumTerm = await marketDataService.getMarketHistory(tokenAddress, network, '1h', 24); // Last day
      const longTerm = await marketDataService.getMarketHistory(tokenAddress, network, '4h', 42); // Last week
      
      // Calculate momentum metrics
      const momentumMetrics = {
        shortTerm: this.calculateMomentumMetrics(shortTerm || []),
        mediumTerm: this.calculateMomentumMetrics(mediumTerm || []),
        longTerm: this.calculateMomentumMetrics(longTerm || []),
        direction: 'neutral' as 'bullish' | 'bearish' | 'neutral',
        strength: 0,
        divergence: false
      };
      
      // Determine overall momentum direction and strength
      let momentumScore = 50; // Start with neutral score
      
      // Short-term momentum (highest weight)
      if (momentumMetrics.shortTerm) {
        if (momentumMetrics.shortTerm.direction === 'bullish') {
          momentumScore += 20;
        } else if (momentumMetrics.shortTerm.direction === 'bearish') {
          momentumScore -= 20;
        }
        
        // Add strength component
        momentumScore += momentumMetrics.shortTerm.strength * 0.2;
      }
      
      // Medium-term momentum
      if (momentumMetrics.mediumTerm) {
        if (momentumMetrics.mediumTerm.direction === 'bullish') {
          momentumScore += 15;
        } else if (momentumMetrics.mediumTerm.direction === 'bearish') {
          momentumScore -= 15;
        }
        
        // Add strength component
        momentumScore += momentumMetrics.mediumTerm.strength * 0.15;
      }
      
      // Long-term momentum
      if (momentumMetrics.longTerm) {
        if (momentumMetrics.longTerm.direction === 'bullish') {
          momentumScore += 10;
        } else if (momentumMetrics.longTerm.direction === 'bearish') {
          momentumScore -= 10;
        }
        
        // Add strength component
        momentumScore += momentumMetrics.longTerm.strength * 0.1;
      }
      
      // Check for momentum divergence (bullish or bearish)
      let divergence = false;
      
      if (momentumMetrics.shortTerm && momentumMetrics.mediumTerm) {
        // Bullish divergence: Price making lower lows but momentum making higher lows
        if (momentumMetrics.shortTerm.price < momentumMetrics.mediumTerm.price &&
            momentumMetrics.shortTerm.rsi > momentumMetrics.mediumTerm.rsi) {
          divergence = true;
          momentumScore += 10; // Bonus for bullish divergence
          momentumMetrics.divergence = true;
        }
        
        // Bearish divergence: Price making higher highs but momentum making lower highs
        if (momentumMetrics.shortTerm.price > momentumMetrics.mediumTerm.price &&
            momentumMetrics.shortTerm.rsi < momentumMetrics.mediumTerm.rsi) {
          divergence = true;
          momentumScore -= 10; // Penalty for bearish divergence
          momentumMetrics.divergence = true;
        }
      }
      
      // Cap momentum score between 0-100
      momentumScore = Math.max(0, Math.min(100, momentumScore));
      
      // Set overall direction
      if (momentumScore >= 60) {
        momentumMetrics.direction = 'bullish';
      } else if (momentumScore <= 40) {
        momentumMetrics.direction = 'bearish';
      } else {
        momentumMetrics.direction = 'neutral';
      }
      
      // Set overall strength (0-10 scale)
      momentumMetrics.strength = Math.abs((momentumScore - 50) / 5);
      
      // Calculate weighted score
      const momentumWeightedScore = momentumScore * (this.factorWeights.marketMomentum / 100);
      
      return {
        name: 'Price Momentum',
        score: momentumScore,
        weight: this.factorWeights.marketMomentum,
        weightedScore: momentumWeightedScore,
        metadata: momentumMetrics
      };
    } catch (error) {
      this.logger.error(`Error calculating momentum factor for ${tokenAddress} on ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Price Momentum',
        score: 50, // Neutral score
        weight: this.factorWeights.marketMomentum,
        weightedScore: 50 * (this.factorWeights.marketMomentum / 100),
        metadata: {
          direction: 'neutral',
          strength: 0
        }
      };
    }
  }
  
  /**
   * Calculate momentum metrics for a specific timeframe
   */
  private calculateMomentumMetrics(candles: any[]): {
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    rsi: number;
    macd: number;
    price: number;
  } | null {
    if (!candles || candles.length < 5) {
      return null; // Not enough data
    }
    
    try {
      // Calculate RSI (Relative Strength Index)
      const rsi = this.calculateRSI(candles);
      
      // Calculate MACD (Moving Average Convergence Divergence)
      const macd = this.calculateMACD(candles);
      
      // Get current price
      const currentPrice = candles[candles.length - 1].close;
      
      // Determine direction based on indicators
      let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let strength = 0;
      
      // RSI rules
      if (rsi > 70) {
        direction = 'bearish'; // Overbought
        strength += (rsi - 70) / 3; // 0-10 scale
      } else if (rsi < 30) {
        direction = 'bullish'; // Oversold
        strength += (30 - rsi) / 3; // 0-10 scale
      } else if (rsi > 50) {
        direction = 'bullish'; // Momentum up
        strength += (rsi - 50) / 5; // 0-4 scale
      } else {
        direction = 'bearish'; // Momentum down
        strength += (50 - rsi) / 5; // 0-4 scale
      }
      
      // MACD rules (refine direction)
      if (macd > 0 && direction === 'bullish') {
        strength += 2; // Confirming bullish
      } else if (macd < 0 && direction === 'bearish') {
        strength += 2; // Confirming bearish
      } else if (macd > 0 && direction === 'bearish') {
        direction = 'neutral'; // Conflicting signals
        strength /= 2;
      } else if (macd < 0 && direction === 'bullish') {
        direction = 'neutral'; // Conflicting signals
        strength /= 2;
      }
      
      // Price trend (simple moving average)
      const shortSMA = this.calculateSMA(candles, 5);
      const longSMA = this.calculateSMA(candles, 14);
      
      if (shortSMA > longSMA && direction === 'bullish') {
        strength += 2; // Confirming bullish trend
      } else if (shortSMA < longSMA && direction === 'bearish') {
        strength += 2; // Confirming bearish trend
      } else if (shortSMA > longSMA && direction === 'bearish') {
        direction = 'neutral'; // Conflicting signals
        strength /= 2;
      } else if (shortSMA < longSMA && direction === 'bullish') {
        direction = 'neutral'; // Conflicting signals
        strength /= 2;
      }
      
      // Cap strength at 10
      strength = Math.min(10, strength);
      
      return {
        direction,
        strength,
        rsi,
        macd,
        price: currentPrice
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(candles: any[], periods: number = 14): number {
    if (candles.length < periods + 1) {
      return 50; // Not enough data, return neutral
    }
    
    try {
      let gains = 0;
      let losses = 0;
      
      // Calculate initial average gain/loss
      for (let i = 1; i <= periods; i++) {
        const change = candles[i].close - candles[i - 1].close;
        if (change >= 0) {
          gains += change;
        } else {
          losses -= change; // Convert to positive
        }
      }
      
      let avgGain = gains / periods;
      let avgLoss = losses / periods;
      
      // Calculate RSI using Wilder's smoothing method
      for (let i = periods + 1; i < candles.length; i++) {
        const change = candles[i].close - candles[i - 1].close;
        if (change >= 0) {
          avgGain = ((avgGain * (periods - 1)) + change) / periods;
          avgLoss = (avgLoss * (periods - 1)) / periods;
        } else {
          avgGain = (avgGain * (periods - 1)) / periods;
          avgLoss = ((avgLoss * (periods - 1)) - change) / periods;
        }
      }
      
      // Calculate RS and RSI
      if (avgLoss === 0) {
        return 100; // No losses, RSI = 100
      }
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      return rsi;
    } catch (error) {
      return 50; // Error, return neutral
    }
  }
  
  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(candles: any[]): number {
    try {
      const shortPeriod = 12;
      const longPeriod = 26;
      
      if (candles.length < longPeriod) {
        return 0; // Not enough data
      }
      
      // Calculate short EMA
      const shortEMA = this.calculateEMA(candles, shortPeriod);
      
      // Calculate long EMA
      const longEMA = this.calculateEMA(candles, longPeriod);
      
      // MACD is the difference between short and long EMAs
      return shortEMA - longEMA;
    } catch (error) {
      return 0; // Error, return neutral
    }
  }
  
  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(candles: any[], periods: number): number {
    try {
      // Start with SMA for initial value
      let sum = 0;
      for (let i = 0; i < periods; i++) {
        sum += candles[i].close;
      }
      let ema = sum / periods;
      
      // Multiplier: (2 / (Time periods + 1))
      const multiplier = 2 / (periods + 1);
      
      // Calculate EMA
      for (let i = periods; i < candles.length; i++) {
        ema = (candles[i].close - ema) * multiplier + ema;
      }
      
      return ema;
    } catch (error) {
      return candles[candles.length - 1].close; // Return latest price on error
    }
  }
  
  /**
   * Calculate SMA (Simple Moving Average)
   */
  private calculateSMA(candles: any[], periods: number): number {
    try {
      if (candles.length < periods) {
        return candles[candles.length - 1].close; // Not enough data
      }
      
      let sum = 0;
      for (let i = candles.length - periods; i < candles.length; i++) {
        sum += candles[i].close;
      }
      
      return sum / periods;
    } catch (error) {
      return candles[candles.length - 1].close; // Return latest price on error
    }
  }
  
  /**
   * Calculate market context factor (broader market conditions)
   */
  private async calculateMarketContextFactor(network: string): Promise<EdgeFactor> {
    try {
      if (network !== 'solana') {
        // Default market context for non-Solana networks
        return {
          name: 'Market Context',
          score: 50,
          weight: this.factorWeights.marketContext,
          weightedScore: 50 * (this.factorWeights.marketContext / 100),
          metadata: {
            marketTrend: 'neutral',
            marketVolatility: 'normal'
          }
        };
      }
      
      // For Solana, use network-wide metrics
      // 1. Check SOL price trend
      const solAddress = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
      const solPriceData = await marketDataService.getTokenPrice(solAddress, network);
      
      // 2. Check network-wide volatility and volume
      const solMarketHistory = await marketDataService.getMarketHistory(solAddress, network, '1h', 24);
      
      // Default values
      let marketTrendScore = 50;
      let marketVolatilityScore = 50;
      
      // Calculate market trend score
      if (solPriceData) {
        // Use 24h price change to determine market trend
        if (solPriceData.priceChange24h >= 10) {
          marketTrendScore = 90; // Strong bull market
        } else if (solPriceData.priceChange24h >= 5) {
          marketTrendScore = 75; // Bull market
        } else if (solPriceData.priceChange24h >= 2) {
          marketTrendScore = 65; // Slight bull market
        } else if (solPriceData.priceChange24h <= -10) {
          marketTrendScore = 10; // Strong bear market
        } else if (solPriceData.priceChange24h <= -5) {
          marketTrendScore = 25; // Bear market
        } else if (solPriceData.priceChange24h <= -2) {
          marketTrendScore = 35; // Slight bear market
        } else {
          marketTrendScore = 50; // Neutral market
        }
      }
      
      // Calculate market volatility score
      if (solMarketHistory && solMarketHistory.length > 0) {
        // Calculate SOL volatility
        const volatility = this.calculateTimeframeVolatility(solMarketHistory);
        
        if (volatility !== null) {
          // Score based on market volatility (lower is better for meme coins)
          if (volatility < 1) {
            marketVolatilityScore = 30; // Very low volatility - not good for meme coins
          } else if (volatility < 2) {
            marketVolatilityScore = 50; // Low volatility
          } else if (volatility < 4) {
            marketVolatilityScore = 80; // Moderate volatility - good for meme coins
          } else if (volatility < 7) {
            marketVolatilityScore = 70; // High volatility
          } else {
            marketVolatilityScore = 40; // Extreme volatility - not good for stable trading
          }
        }
      }
      
      // Combined market context score (weighted average)
      const marketContextScore = (marketTrendScore * 0.6) + (marketVolatilityScore * 0.4);
      
      // Calculate weighted score
      const marketContextWeightedScore = marketContextScore * (this.factorWeights.marketContext / 100);
      
      // Determine qualitative market descriptions
      let marketTrend: string;
      if (marketTrendScore >= 75) {
        marketTrend = 'strong_bull';
      } else if (marketTrendScore >= 60) {
        marketTrend = 'bull';
      } else if (marketTrendScore >= 45) {
        marketTrend = 'neutral';
      } else if (marketTrendScore >= 30) {
        marketTrend = 'bear';
      } else {
        marketTrend = 'strong_bear';
      }
      
      let marketVolatility: string;
      if (marketVolatilityScore >= 75) {
        marketVolatility = 'optimal';
      } else if (marketVolatilityScore >= 60) {
        marketVolatility = 'good';
      } else if (marketVolatilityScore >= 40) {
        marketVolatility = 'normal';
      } else {
        marketVolatility = 'unfavorable';
      }
      
      return {
        name: 'Market Context',
        score: marketContextScore,
        weight: this.factorWeights.marketContext,
        weightedScore: marketContextWeightedScore,
        metadata: {
          marketTrend,
          marketVolatility,
          solPriceChange24h: solPriceData?.priceChange24h || 0
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating market context factor for ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Market Context',
        score: 50,
        weight: this.factorWeights.marketContext,
        weightedScore: 50 * (this.factorWeights.marketContext / 100),
        metadata: {
          marketTrend: 'neutral',
          marketVolatility: 'normal'
        }
      };
    }
  }
  
  /**
   * Apply dynamic confidence adjustment based on factor correlations
   */
  private applyDynamicConfidenceAdjustment(
    rawScore: number,
    factors: EdgeFactor[]
  ): number {
    try {
      // Get primary factors
      const patternFactor = factors.find(f => f.name === 'Pattern Analysis');
      const smartMoneyFactor = factors.find(f => f.name === 'Smart Money Activity');
      const momentumFactor = factors.find(f => f.name === 'Price Momentum');
      
      // Default - no adjustment
      if (!patternFactor || !smartMoneyFactor || !momentumFactor) {
        return rawScore;
      }
      
      let adjustmentMultiplier = 1.0;
      
      // Calculate correlation between factors
      // When multiple factors align, confidence increases
      
      // Check if pattern and smart money align (both high or both low)
      const patternSmartMoneyAlignment = (patternFactor.score > 60 && smartMoneyFactor.score > 60) ||
                                        (patternFactor.score < 40 && smartMoneyFactor.score < 40);
                                        
      // Check if pattern and momentum align
      const patternMomentumAlignment = (patternFactor.score > 60 && momentumFactor.score > 60) ||
                                      (patternFactor.score < 40 && momentumFactor.score < 40);
                                      
      // Check if smart money and momentum align
      const smartMoneyMomentumAlignment = (smartMoneyFactor.score > 60 && momentumFactor.score > 60) ||
                                         (smartMoneyFactor.score < 40 && momentumFactor.score < 40);
      
      // Apply adjustments based on alignments
      if (patternSmartMoneyAlignment && patternMomentumAlignment && smartMoneyMomentumAlignment) {
        // All three factors align - strong signal
        adjustmentMultiplier = 1.15; // +15%
      } else if ((patternSmartMoneyAlignment && patternMomentumAlignment) || 
                (patternSmartMoneyAlignment && smartMoneyMomentumAlignment) ||
                (patternMomentumAlignment && smartMoneyMomentumAlignment)) {
        // Two alignments - good signal
        adjustmentMultiplier = 1.08; // +8%
      } else if (patternSmartMoneyAlignment || patternMomentumAlignment || smartMoneyMomentumAlignment) {
        // One alignment - slight boost
        adjustmentMultiplier = 1.03; // +3%
      } else {
        // No alignments - conflicting signals - reduce confidence
        adjustmentMultiplier = 0.95; // -5%
      }
      
      // Apply the adjustment
      const adjustedScore = rawScore * adjustmentMultiplier;
      
      // Cap at 100
      return Math.min(100, adjustedScore);
    } catch (error) {
      // On error, return the raw score
      return rawScore;
    }
  }
  
  /**
   * Determine trade direction based on patterns and momentum
   */
  private determineTradeDirection(
    patterns: IPattern[],
    momentumFactor: EdgeFactor
  ): TradeDirection {
    try {
      // Default to LONG for meme coins (most trades are bullish)
      let direction = TradeDirection.LONG;
      
      // Check for specific bearish patterns
      const bearishPatterns = patterns.filter(p => 
        ['headAndShoulders', 'doubleTop', 'bearishChannel', 'wedgeDown'].includes(p.patternType)
      );
      
      // Check momentum direction
      const momentumDirection = momentumFactor.metadata?.direction || 'neutral';
      
      // Decision logic:
      // 1. If we have explicit bearish patterns, consider SHORT
      // 2. If momentum is bearish, consider SHORT
      // 3. Otherwise, stick with LONG (default for meme coins)
      
      if (bearishPatterns.length > 0 && momentumDirection === 'bearish') {
        // Strong bearish signal - both patterns and momentum align
        direction = TradeDirection.SHORT;
      } else if (bearishPatterns.length > 0 && bearishPatterns.length > patterns.length / 2) {
        // Majority of patterns are bearish
        direction = TradeDirection.SHORT;
      } else if (momentumDirection === 'bearish' && momentumFactor.score < 30) {
        // Very strong bearish momentum
        direction = TradeDirection.SHORT;
      } else {
        // Default to long for meme coins
        direction = TradeDirection.LONG;
      }
      
      return direction;
    } catch (error) {
      // Default to LONG on error
      return TradeDirection.LONG;
    }
  }
  
  /**
   * Calculate enhanced targets with adaptive projection based on volatility
   */
  private async calculateEnhancedTargets(
    currentPrice: number,
    confidenceScore: number,
    patterns: IPattern[],
    tokenAddress: string,
    network: string,
    direction: TradeDirection
  ): Promise<{ primaryTarget: TargetLevel; secondaryTarget?: TargetLevel }> {
    try {
      // Get historical volatility to calibrate targets
      const marketHistory = await marketDataService.getMarketHistory(tokenAddress, network, '15m', 96);
      let volatility = 2; // Default volatility estimate (%)
      
      if (marketHistory && marketHistory.length > 10) {
        // Calculate actual volatility from market history
        const priceChanges = [];
        for (let i = 1; i < marketHistory.length; i++) {
          const percentChange = ((marketHistory[i].close - marketHistory[i-1].close) / marketHistory[i-1].close) * 100;
          priceChanges.push(Math.abs(percentChange));
        }
        
        // Average volatility
        volatility = priceChanges.reduce((sum, val) => sum + val, 0) / priceChanges.length;
      }
      
      // Find pattern targets
      const patternTargets = patterns
        .filter(p => p.targetPrice !== undefined)
        .map(p => ({
          price: p.targetPrice!,
          confidence: p.confidence
        }));
      
      let primaryTarget: TargetLevel;
      let secondaryTarget: TargetLevel | undefined;
      
      // Different logic for LONG vs SHORT
      if (direction === TradeDirection.LONG) {
        if (patternTargets.length > 0) {
          // Sort by price (ascending for LONG)
          patternTargets.sort((a, b) => a.price - b.price);
          
          // Use median target for primary target for LONG
          const medianIndex = Math.floor(patternTargets.length / 2);
          const medianTarget = patternTargets[medianIndex];
          
          // Calculate expected return
          const primaryReturn = (medianTarget.price - currentPrice) / currentPrice;
          
          // Calculate probability based on confidence score and market conditions
          // Higher confidence = higher probability
          const primaryProbability = 0.42 + (confidenceScore / 220); // Range: 0.42 - 0.87
          
          // Estimate timeframe based on pattern types and volatility
          const timeframeHours = this.estimateEnhancedTimeframeHours(
            patterns, 
            primaryReturn, 
            volatility
          );
          
          primaryTarget = {
            price: medianTarget.price,
            probability: primaryProbability,
            expectedReturn: primaryReturn,
            timeframeHours
          };
          
          // If we have multiple targets, use the higher target for secondary target
          if (patternTargets.length > 1) {
            const highIndex = Math.min(patternTargets.length - 1, medianIndex + 1);
            const highTarget = patternTargets[highIndex];
            
            // Secondary target has lower probability
            const secondaryProbability = primaryProbability * 0.7; // 70% of primary probability
            const secondaryReturn = (highTarget.price - currentPrice) / currentPrice;
            
            secondaryTarget = {
              price: highTarget.price,
              probability: secondaryProbability,
              expectedReturn: secondaryReturn,
              timeframeHours: timeframeHours * 1.5 // 50% longer timeframe
            };
          }
        } else {
          // No pattern targets available, use confidence-based estimate adjusted for volatility
          const confidenceFactor = confidenceScore / 100; // 0-1
          
          // Target 1: Conservative target (adjusted for volatility)
          // Higher volatility = higher potential targets
          const volatilityAdjustment = Math.min(1.5, Math.max(0.5, volatility / 2));
          const primaryReturnPercentage = (0.15 + (confidenceFactor * 0.15)) * volatilityAdjustment;
          const primaryPrice = currentPrice * (1 + primaryReturnPercentage);
          const primaryProbability = 0.5 + (confidenceFactor * 0.2); // 50-70%
          
          // Estimate timeframe based on volatility (higher volatility = shorter timeframe)
          const timeframeHours = Math.round(24 / Math.min(2, Math.max(0.5, volatility / 2)));
          
          primaryTarget = {
            price: primaryPrice,
            probability: primaryProbability,
            expectedReturn: primaryReturnPercentage,
            timeframeHours
          };
          
          // Target 2: Aggressive target
          const secondaryReturnPercentage = (0.3 + (confidenceFactor * 0.3)) * volatilityAdjustment;
          const secondaryPrice = currentPrice * (1 + secondaryReturnPercentage);
          const secondaryProbability = 0.3 + (confidenceFactor * 0.15); // 30-45%
          
          secondaryTarget = {
            price: secondaryPrice,
            probability: secondaryProbability,
            expectedReturn: secondaryReturnPercentage,
            timeframeHours: timeframeHours * 1.8 // 80% longer timeframe
          };
        }
      } else {
        // SHORT direction - targets are downside targets
        if (patternTargets.length > 0) {
          // Sort by price (descending for SHORT)
          patternTargets.sort((a, b) => b.price - a.price);
          
          // Use median target for primary target for SHORT
          const medianIndex = Math.floor(patternTargets.length / 2);
          const medianTarget = patternTargets[medianIndex];
          
          // Calculate expected return (for shorts, lower price = higher return)
          const primaryReturn = (currentPrice - medianTarget.price) / currentPrice;
          
          // Calculate probability (shorts typically have lower probability)
          const primaryProbability = 0.40 + (confidenceScore / 240); // Range: 0.40 - 0.82
          
          // Estimate timeframe based on pattern types and volatility
          const timeframeHours = this.estimateEnhancedTimeframeHours(
            patterns, 
            primaryReturn, 
            volatility
          );
          
          primaryTarget = {
            price: medianTarget.price,
            probability: primaryProbability,
            expectedReturn: primaryReturn,
            timeframeHours
          };
          
          // If we have multiple targets, use the lower target for secondary target
          if (patternTargets.length > 1) {
            const lowIndex = Math.max(0, medianIndex - 1);
            const lowTarget = patternTargets[lowIndex];
            
            // Secondary target has lower probability
            const secondaryProbability = primaryProbability * 0.65; // 65% of primary probability
            const secondaryReturn = (currentPrice - lowTarget.price) / currentPrice;
            
            secondaryTarget = {
              price: lowTarget.price,
              probability: secondaryProbability,
              expectedReturn: secondaryReturn,
              timeframeHours: timeframeHours * 1.7 // 70% longer timeframe
            };
          }
        } else {
          // No pattern targets available, use confidence-based estimate adjusted for volatility
          const confidenceFactor = confidenceScore / 100; // 0-1
          
          // Shorts typically have more conservative targets
          const volatilityAdjustment = Math.min(1.4, Math.max(0.5, volatility / 2.2));
          const primaryReturnPercentage = (0.12 + (confidenceFactor * 0.12)) * volatilityAdjustment;
          const primaryPrice = currentPrice * (1 - primaryReturnPercentage);
          const primaryProbability = 0.45 + (confidenceFactor * 0.18); // 45-63%
          
          // Estimate timeframe based on volatility
          const timeframeHours = Math.round(20 / Math.min(2, Math.max(0.5, volatility / 2.2)));
          
          primaryTarget = {
            price: primaryPrice,
            probability: primaryProbability,
            expectedReturn: primaryReturnPercentage,
            timeframeHours
          };
          
          // Target 2: More aggressive short target
          const secondaryReturnPercentage = (0.22 + (confidenceFactor * 0.26)) * volatilityAdjustment;
          const secondaryPrice = currentPrice * (1 - secondaryReturnPercentage);
          const secondaryProbability = 0.25 + (confidenceFactor * 0.15); // 25-40%
          
          secondaryTarget = {
            price: secondaryPrice,
            probability: secondaryProbability,
            expectedReturn: secondaryReturnPercentage,
            timeframeHours: timeframeHours * 2 // Twice as long timeframe
          };
        }
      }
      
      return { primaryTarget, secondaryTarget };
    } catch (error) {
      this.logger.error('Error calculating enhanced targets:', error);
      
      // Return default targets based on direction
      if (direction === TradeDirection.LONG) {
        // Default LONG targets (15% primary, 30% secondary)
        return {
          primaryTarget: {
            price: currentPrice * 1.15,
            probability: 0.6,
            expectedReturn: 0.15,
            timeframeHours: 24
          },
          secondaryTarget: {
            price: currentPrice * 1.3,
            probability: 0.4,
            expectedReturn: 0.3,
            timeframeHours: 48
          }
        };
      } else {
        // Default SHORT targets (10% primary, 20% secondary)
        return {
          primaryTarget: {
            price: currentPrice * 0.9,
            probability: 0.55,
            expectedReturn: 0.1,
            timeframeHours: 24
          },
          secondaryTarget: {
            price: currentPrice * 0.8,
            probability: 0.35,
            expectedReturn: 0.2,
            timeframeHours: 48
          }
        };
      }
    }
  }
  
  /**
   * Estimate target timeframe based on pattern types, expected return, and volatility
   */
  private estim