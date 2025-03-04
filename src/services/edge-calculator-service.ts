// src/services/edge-calculator-service.ts
import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import patternRecognitionService, { IPattern, PatternStatus, PatternType } from './pattern-recognition-service';
import marketDataService from './market-data-service';
import externalWalletScraper from './external-wallet-scraper';
import rpcConnectionManager from './rpc-connection-manager';
import config from '../config/config';
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
    
    // Configure factor weights
    this.factorWeights = {
      patternConfidence: 30,
      patternType: 10,
      patternTimeframe: 10,
      smartMoneyActivity: 25,
      marketLiquidity: 5,
      marketManipulation: 10,
      marketVolatility: 5,
      historicalSuccess: 5
    };
    
    // Set threshold values
    this.minimumConfidenceScore = 60; // Minimum score to consider a trade
    this.minimumRiskRewardRatio = 2.0; // Minimum risk/reward to consider a trade
    this.edgeThreshold = 65; // Minimum edge score to trigger a trade
    
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
      
      // Look for additional tokens with high activity using RPC manager
      // This will help find emerging opportunities before patterns are detected
      if (patterns.length < this.maxCalculationsPerRun / 2) {
        try {
          // For Solana, find tokens with recent transactions
          // Use Helius endpoint if available
          if (rpcConnectionManager.isEndpointActive('helius')) {
            // Get tokens with recent mints or high transaction volume
            const recentTokens = await rpcConnectionManager.getLatestTokens(20);
            
            for (const token of recentTokens) {
              // Extract token address from the token object
              const tokenAddress = token.address || token.mint;
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
    } catch (error) {
      this.logger.error('Error in edge opportunity scanner:', error);
    }
  }
  
  /**
   * Calculate edge for a specific token
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
      
      // 1. Calculate Pattern Factor
      const patternFactor = this.calculatePatternFactor(patterns);
      
      // 2. Calculate Smart Money Factor using RPC manager
      const smartMoneyFactor = await this.calculateSmartMoneyFactor(tokenAddress, network);
      
      // 3. Calculate Market Conditions Factor
      const marketConditionsFactor = await this.calculateMarketConditionsFactor(tokenAddress, network);
      
      // 4. Calculate Historical Success Factor
      const historicalSuccessFactor = await this.calculateHistoricalSuccessFactor(patterns);
      
      // Combine all factors
      const factors: EdgeFactor[] = [
        patternFactor,
        smartMoneyFactor,
        marketConditionsFactor,
        historicalSuccessFactor
      ];
      
      // Calculate overall confidence score
      const confidenceScore = factors.reduce((sum, factor) => sum + factor.weightedScore, 0);
      
      // Determine confidence level
      const confidenceLevel = this.determineConfidenceLevel(confidenceScore);
      
      // Skip if confidence score is too low
      if (confidenceScore < this.minimumConfidenceScore) {
        this.logger.debug(`Skipping edge calculation for ${tokenMetadata.symbol} - confidence too low (${confidenceScore})`);
        return null;
      }
      
      // Determine direction (currently only LONG is supported)
      const direction = TradeDirection.LONG;
      
      // Calculate targets and stop loss
      const targets = this.calculateTargets(tokenPrice.price, confidenceScore, patterns);
      const stopLoss = this.calculateStopLoss(tokenPrice.price, patterns);
      
      // Calculate risk/reward metrics
      const potentialRisk = tokenPrice.price - stopLoss;
      const potentialReward = targets.primaryTarget.price - tokenPrice.price;
      const riskRewardRatio = potentialReward / potentialRisk;
      
      // Skip if risk/reward is too low
      if (riskRewardRatio < this.minimumRiskRewardRatio) {
        this.logger.debug(`Skipping edge calculation for ${tokenMetadata.symbol} - risk/reward too low (${riskRewardRatio.toFixed(2)})`);
        return null;
      }
      
      // Calculate expected value
      const expectedValue = (targets.primaryTarget.probability * targets.primaryTarget.expectedReturn) -
        ((1 - targets.primaryTarget.probability) * (potentialRisk / tokenPrice.price));
      
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
        factors,
        patternIds: patterns.map(p => p._id),
        smartMoneySignals: smartMoneyFactor.metadata,
        marketConditions: marketConditionsFactor.metadata,
        tags: [tokenMetadata.symbol, network, ...patterns.map(p => p.patternType)]
      });
      
      // Determine if we have a trade opportunity
      if (confidenceScore >= this.edgeThreshold) {
        edge.notes = `High confidence trade opportunity detected with ${confidenceScore.toFixed(1)}% confidence score and ${riskRewardRatio.toFixed(2)} risk/reward ratio.`;
      } else {
        edge.notes = `Moderate confidence. Monitor for additional signals.`;
      }
      
      // Save edge calculation
      await edge.save();
      
      this.logger.info(`Calculated edge for ${tokenMetadata.symbol}: ${confidenceScore.toFixed(1)}% confidence, ${riskRewardRatio.toFixed(2)} R/R ratio`);
      
      return edge;
    } catch (error) {
      this.logger.error(`Error calculating edge for ${tokenAddress} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Calculate pattern factor
   */
  private calculatePatternFactor(patterns: IPattern[]): EdgeFactor {
    // Start with base scores
    let patternConfidenceScore = 0;
    let patternTypeScore = 0;
    let patternTimeframeScore = 0;
    
    // Pattern confidence factor
    if (patterns.length > 0) {
      // Average confidence across all patterns
      patternConfidenceScore = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    }
    
    // Pattern type factor
    const patternTypeWeights: Record<string, number> = {
      breakout: 0.9,
      vRecovery: 0.8,
      bullFlag: 0.85,
      cupAndHandle: 0.9,
      inverseHeadAndShoulders: 0.85,
      roundedBottom: 0.8,
      accumulation: 0.75,
      smartMoneyAccumulation: 0.95
    };
    
    let totalTypeWeight = 0;
    for (const pattern of patterns) {
      totalTypeWeight += patternTypeWeights[pattern.patternType] || 0.7;
    }
    
    if (patterns.length > 0) {
      patternTypeScore = (totalTypeWeight / patterns.length) * 100;
    }
    
    // Pattern timeframe factor - higher score for multiple timeframes
    const timeframes = new Set(patterns.map(p => p.timeframe));
    patternTimeframeScore = timeframes.size > 1 ? 100 : 60; // Higher score for multiple timeframes
    
    // Calculate weighted scores
    const patternConfidenceWeightedScore = patternConfidenceScore * (this.factorWeights.patternConfidence / 100);
    const patternTypeWeightedScore = patternTypeScore * (this.factorWeights.patternType / 100);
    const patternTimeframeWeightedScore = patternTimeframeScore * (this.factorWeights.patternTimeframe / 100);
    
    // Combine into a single pattern factor
    const patternFactorScore = patternConfidenceWeightedScore + patternTypeWeightedScore + patternTimeframeWeightedScore;
    const patternFactorWeight = this.factorWeights.patternConfidence + this.factorWeights.patternType + this.factorWeights.patternTimeframe;
    const patternFactorWeightedScore = patternFactorScore * (patternFactorWeight / 100);
    
    return {
      name: 'Pattern Analysis',
      score: patternFactorScore,
      weight: patternFactorWeight,
      weightedScore: patternFactorWeightedScore,
      metadata: {
        patternCount: patterns.length,
        timeframes: Array.from(timeframes),
        patternTypes: patterns.map(p => p.patternType),
        patternConfidences: patterns.map(p => p.confidence)
      }
    };
  }
  
  /**
   * Calculate smart money factor with RPC Manager integration
   */
  private async calculateSmartMoneyFactor(tokenAddress: string, network: string): Promise<EdgeFactor> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network for smart money analysis: ${network}`);
      }
      
      // Get smart wallets from your external wallet scraper service
      const smartWallets = await externalWalletScraper.getSmartWallets(network);
      
      if (!smartWallets || smartWallets.length === 0) {
        this.logger.warn('No smart wallets available for analysis');
        
        // Return a default factor if no smart wallets data
        return {
          name: 'Smart Money Activity',
          score: 50, // Neutral score
          weight: this.factorWeights.smartMoneyActivity,
          weightedScore: 50 * (this.factorWeights.smartMoneyActivity / 100),
          metadata: {
            walletCount: 0,
            buys: 0,
            sells: 0,
            netBuys: 0,
            buyPressure: 50
          }
        };
      }
      
      // Track activity from smart wallets for this token
      let walletCount = 0;
      let totalBuys = 0;
      let totalSells = 0;
      
      for (const wallet of smartWallets) {
        try {
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
                const tx = await rpcConnectionManager.getTransaction(sig.signature);
                
                if (tx && this.isTransactionInvolvingToken(tx, tokenAddress)) {
                  // Determine if this was a buy or sell
                  const isBuy = this.isTokenBuyTransaction(tx, wallet.address, tokenAddress);
                  const isSell = this.isTokenSellTransaction(tx, wallet.address, tokenAddress);
                  
                  if (isBuy) totalBuys++;
                  if (isSell) totalSells++;
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
      
      // Create smart money activity data
      const smartMoneyActivity = {
        walletCount,
        buys: totalBuys,
        sells: totalSells,
        netBuys: totalBuys - totalSells,
        buyPressure: 0
      };
      
      // Calculate buy pressure (ratio of buys to total transactions)
      const totalTransactions = totalBuys + totalSells;
      smartMoneyActivity.buyPressure = totalTransactions > 0 ? 
        (totalBuys / totalTransactions) * 100 : 50;
      
      // Calculate smart money score
      let smartMoneyScore = 0;
      
      // Score based on wallet count (more smart wallets = higher score)
      if (smartMoneyActivity.walletCount >= 8) {
        smartMoneyScore += 100;
      } else if (smartMoneyActivity.walletCount >= 5) {
        smartMoneyScore += 80;
      } else if (smartMoneyActivity.walletCount >= 3) {
        smartMoneyScore += 60;
      } else if (smartMoneyActivity.walletCount >= 1) {
        smartMoneyScore += 40;
      }
      
      // Score based on buy pressure (more buying = higher score)
      if (smartMoneyActivity.buyPressure >= 90) {
        smartMoneyScore += 100;
      } else if (smartMoneyActivity.buyPressure >= 75) {
        smartMoneyScore += 80;
      } else if (smartMoneyActivity.buyPressure >= 60) {
        smartMoneyScore += 60;
      } else if (smartMoneyActivity.buyPressure >= 50) {
        smartMoneyScore += 40;
      } else {
        smartMoneyScore += 0; // Less than 50% buy pressure is negative
      }
      
      // Average the scores
      smartMoneyScore = smartMoneyScore / 2;
      
      // Calculate weighted score
      const smartMoneyWeightedScore = smartMoneyScore * (this.factorWeights.smartMoneyActivity / 100);
      
      return {
        name: 'Smart Money Activity',
        score: smartMoneyScore,
        weight: this.factorWeights.smartMoneyActivity,
        weightedScore: smartMoneyWeightedScore,
        metadata: smartMoneyActivity
      };
    } catch (error) {
      this.logger.error(`Error calculating smart money factor for ${tokenAddress} on ${network}:`, error);
      
      // Return default factor on error
      return {
        name: 'Smart Money Activity',
        score: 50, // Neutral score
        weight: this.factorWeights.smartMoneyActivity,
        weightedScore: 50 * (this.factorWeights.smartMoneyActivity / 100),
        metadata: {
          walletCount: 0,
          buys: 0,
          sells: 0,
          netBuys: 0,
          buyPressure: 50
        }
      };
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
   * Calculate market conditions factor
   */
  private async calculateMarketConditionsFactor(tokenAddress: string, network: string): Promise<EdgeFactor> {
    try {
      // Get liquidity data
      const liquidityDistribution = await marketDataService.getTokenLiquidity(tokenAddress, network);
      const totalLiquidity = liquidityDistribution ? 
        liquidityDistribution.reduce((sum, item) => sum + item.liquidityUSD, 0) : 0;
      
      // Calculate manipulation score using RPC manager-enhanced methods
      const manipulationScore = await marketDataService.calculateManipulationScore(tokenAddress, network) || 50;
      
      // Get market data for volatility calculation
      const marketHistory = await marketDataService.getMarketHistory(tokenAddress, network, '15m', 96); // 24 hours
      
      // Calculate volatility score
      let volatilityScore = 50; // Default moderate volatility
      
      if (marketHistory && marketHistory.length > 0) {
        // Calculate price changes
        const priceChanges = [];
        for (let i = 1; i < marketHistory.length; i++) {
          const percentChange = ((marketHistory[i].close - marketHistory[i-1].close) / marketHistory[i-1].close) * 100;
          priceChanges.push(Math.abs(percentChange)); // Use absolute value
        }
        
        // Calculate average volatility
        const avgVolatility = priceChanges.reduce((sum, val) => sum + val, 0) / priceChanges.length;
        
        // Score based on volatility (moderate volatility is best)
        if (avgVolatility < 0.5) {
          volatilityScore = 40; // Too low volatility
        } else if (avgVolatility < 1.5) {
          volatilityScore = 60; // Low volatility
        } else if (avgVolatility < 3) {
          volatilityScore = 80; // Moderate volatility (good)
        } else if (avgVolatility < 5) {
          volatilityScore = 60; // High volatility
        } else {
          volatilityScore = 30; // Too high volatility
        }
      }
      
      // Calculate liquidity score
      let liquidityScore = 0;
      
      if (totalLiquidity >= 1000000) { // $1M+
        liquidityScore = 100;
      } else if (totalLiquidity >= 500000) { // $500K+
        liquidityScore = 80;
      } else if (totalLiquidity >= 100000) { // $100K+
        liquidityScore = 60;
      } else if (totalLiquidity >= 50000) { // $50K+
        liquidityScore = 40;
      } else if (totalLiquidity > 0) {
        liquidityScore = 20;
      }
      
      // Manipulation penalty (higher score = more manipulation = bad)
      // Invert so higher is better
      const manipulationFactor = 100 - manipulationScore;
      
      // Calculate overall market conditions score
      const marketLiquidityWeightedScore = liquidityScore * (this.factorWeights.marketLiquidity / 100);
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
          liquidityScore,
          manipulationScore,
          volatilityScore,
          totalLiquidityUSD: totalLiquidity
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating market conditions factor for ${tokenAddress} on ${network}:`, error);
      
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
   * Calculate historical success factor
   */
  private async calculateHistoricalSuccessFactor(patterns: IPattern[]): Promise<EdgeFactor> {
    try {
      // Get pattern statistics
      const patternStats = await patternRecognitionService.getPatternStats();
      
      if (!patternStats || patternStats.totalPatterns === 0) {
        // No historical data available
        return {
          name: 'Historical Success',
          score: 50, // Neutral score
          weight: this.factorWeights.historicalSuccess,
          weightedScore: 50 * (this.factorWeights.historicalSuccess / 100),
          metadata: {
            overallSuccessRate: 0,
            patternTypeSuccessRates: {}
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
      const avgSuccessRate = patternCount > 0 ? totalTypeSuccessRate / patternCount : patternStats.successRate;
      
      // Map success rate to score (0-100)
      const historicalSuccessScore = Math.min(100, avgSuccessRate);
      
      // Calculate weighted score
      const historicalSuccessWeightedScore = historicalSuccessScore * (this.factorWeights.historicalSuccess / 100);
      
      return {
        name: 'Historical Success',
        score: historicalSuccessScore,
        weight: this.factorWeights.historicalSuccess,
        weightedScore: historicalSuccessWeightedScore,
        metadata: {
          overallSuccessRate: patternStats.successRate,
          patternTypeSuccessRates
        }
      };
    } catch (error) {
      this.logger.error('Error calculating historical success factor:', error);
      
      // Return default factor on error
      return {
        name: 'Historical Success',
        score: 50, // Neutral score
        weight: this.factorWeights.historicalSuccess,
        weightedScore: 50 * (this.factorWeights.historicalSuccess / 100),
        metadata: {
          overallSuccessRate: 0,
          patternTypeSuccessRates: {}
        }
      };
    }
  }
  
  /**
   * Calculate targets based on patterns and confidence
   */
  private calculateTargets(
    currentPrice: number, 
    confidenceScore: number, 
    patterns: IPattern[]
  ): { primaryTarget: TargetLevel; secondaryTarget?: TargetLevel } {
    // Find pattern targets
    const patternTargets = patterns
      .filter(p => p.targetPrice !== undefined)
      .map(p => ({
        price: p.targetPrice!,
        confidence: p.confidence
      }));
    
    let primaryTarget: TargetLevel;
    let secondaryTarget: TargetLevel | undefined;
    
    if (patternTargets.length > 0) {
      // Sort by price (ascending)
      patternTargets.sort((a, b) => a.price - b.price);
      
      // Use median target for primary target
      const medianIndex = Math.floor(patternTargets.length / 2);
      const medianTarget = patternTargets[medianIndex];
      
      // Calculate expected return
      const primaryReturn = (medianTarget.price - currentPrice) / currentPrice;
      
      // Calculate probability based on confidence score
      // Higher confidence = higher probability
      const primaryProbability = 0.4 + (confidenceScore / 250); // Range: 0.4 - 0.8
      
      // Estimate timeframe based on pattern types
      const timeframeHours = this.estimateTimeframeHours(patterns);
      
      primaryTarget = {
        price: medianTarget.price,
        probability: primaryProbability,
        expectedReturn: primaryReturn,
        timeframeHours
      };
      
      // If we have multiple targets, use the highest for secondary target
      if (patternTargets.length > 1) {
        const highestTarget = patternTargets[patternTargets.length - 1];
        
        // Secondary target has lower probability
        const secondaryProbability = primaryProbability * 0.6; // 60% of primary probability
        const secondaryReturn = (highestTarget.price - currentPrice) / currentPrice;
        
        secondaryTarget = {
          price: highestTarget.price,
          probability: secondaryProbability,
          expectedReturn: secondaryReturn,
          timeframeHours: timeframeHours * 1.5 // 50% longer timeframe
        };
      }
    } else {
      // No pattern targets available, use confidence-based estimate
      const confidenceFactor = confidenceScore / 100; // 0-1
      
      // Target 1: Conservative target (15-30% gain)
      const primaryReturnPercentage = 0.15 + (confidenceFactor * 0.15); // 15-30%
      const primaryPrice = currentPrice * (1 + primaryReturnPercentage);
      const primaryProbability = 0.5 + (confidenceFactor * 0.2); // 50-70%
      
      primaryTarget = {
        price: primaryPrice,
        probability: primaryProbability,
        expectedReturn: primaryReturnPercentage,
        timeframeHours: 24 // Default 24 hours
      };
      
      // Target 2: Aggressive target (30-60% gain)
      const secondaryReturnPercentage = 0.3 + (confidenceFactor * 0.3); // 30-60%
      const secondaryPrice = currentPrice * (1 + secondaryReturnPercentage);
      const secondaryProbability = 0.3 + (confidenceFactor * 0.15); // 30-45%
      
      secondaryTarget = {
        price: secondaryPrice,
        probability: secondaryProbability,
        expectedReturn: secondaryReturnPercentage,
        timeframeHours: 48 // Default 48 hours
      };
    }
    
    return { primaryTarget, secondaryTarget };
  }
  
  /**
   * Calculate stop loss based on patterns
   */
  private calculateStopLoss(currentPrice: number, patterns: IPattern[]): number {
    // Find pattern stop losses
    const patternStopLosses = patterns
      .filter(p => p.stopLossPrice !== undefined)
      .map(p => p.stopLossPrice!);
    
    if (patternStopLosses.length > 0) {
      // Use highest stop loss (most conservative)
      return Math.max(...patternStopLosses);
    } else {
      // No pattern stop losses available, use default (5% below current price)
      return currentPrice * 0.95;
    }
  }
  
  /**
   * Estimate timeframe for target based on patterns
   */
  private estimateTimeframeHours(patterns: IPattern[]): number {
    // Default timeframes based on pattern types
    const patternTimeframes: Record<string, number> = {
      breakout: 6, // 6 hours
      vRecovery: 8, // 8 hours
      bullFlag: 12, // 12 hours
      accumulation: 24, // 24 hours
      cupAndHandle: 48, // 48 hours
      inverseHeadAndShoulders: 36, // 36 hours
      roundedBottom: 48, // 48 hours
      smartMoneyAccumulation: 36 // 36 hours
    };
    
    // Calculate average timeframe
    let totalHours = 0;
    let patternCount = 0;
    
    for (const pattern of patterns) {
      if (patternTimeframes[pattern.patternType]) {
        totalHours += patternTimeframes[pattern.patternType];
        patternCount++;
      }
    }
    
    // Return average or default to 24 hours
    return patternCount > 0 ? totalHours / patternCount : 24;
  }
  
  /**
   * Determine confidence level from score
   */
  private determineConfidenceLevel(confidenceScore: number): ConfidenceLevel {
    if (confidenceScore >= 80) {
      return ConfidenceLevel.VERY_HIGH;
    } else if (confidenceScore >= 60) {
      return ConfidenceLevel.HIGH;
    } else if (confidenceScore >= 40) {
      return ConfidenceLevel.MEDIUM;
    } else if (confidenceScore >= 20) {
      return ConfidenceLevel.LOW;
    } else {
      return ConfidenceLevel.VERY_LOW;
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
      
      return {
        totalCalculations,
        calculatedCount,
        executedCount,
        expiredCount,
        rejectedCount,
        averageConfidenceScore,
        averageRiskRewardRatio,
        byConfidenceLevel
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
   * New method using RPC Connection Manager
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
      
      return {
        totalTokens: holdings.length,
        tokenValues,
        totalValueUSD,
        topHoldings
      };
    } catch (error) {
      this.logger.error(`Error analyzing wallet holdings for ${walletAddress}:`, error);
      return null;
    }
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
}

export default new EdgeCalculatorService();