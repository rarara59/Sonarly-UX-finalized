// Thorp V1 - Risk Management Service
// Implements position sizing, exposure limits, and risk evaluation

import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import edgeCalculatorService, { 
  IEdgeCalculation, 
  EdgeStatus, 
  ConfidenceLevel 
} from './edge-calculator-service';
import config from '.';

// Types and interfaces
export enum TradeStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum TradeResult {
  WIN = 'win',
  LOSS = 'loss',
  BREAKEVEN = 'breakeven',
  UNKNOWN = 'unknown'
}

export enum PositionSizeStrategy {
  FIXED_AMOUNT = 'fixed_amount',
  PERCENTAGE_OF_CAPITAL = 'percentage_of_capital',
  KELLY_CRITERION = 'kelly_criterion',
  VOLATILITY_ADJUSTED = 'volatility_adjusted',
  CONFIDENCE_BASED = 'confidence_based'
}

export interface ITrade extends Document {
  edgeCalculationId: mongoose.Types.ObjectId;
  tokenAddress: string;
  network: string;
  symbol: string;
  timestamp: Date;
  status: TradeStatus;
  direction: string;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  positionSize: number;
  positionSizeUSD: number;
  maxPositionSizeUSD: number;
  confidence: number;
  riskAmount: number;
  positionSizeStrategy: PositionSizeStrategy;
  sizeJustification: string;
  riskPercentage: number;
  maxDrawdownPercentage: number;
  timeframeHours: number;
  exitPrice?: number;
  exitTimestamp?: Date;
  result?: TradeResult;
  resultPercentage?: number;
  riskRewardRatio: number;
  expectedValue: number;
  portfolioWeightPercentage: number;
  correlatedPositions: string[];
  totalExposure: number;
  exposureLimit: number;
  exposureBreakdown: {
    token: number;
    sector: number;
    network: number;
  };
  notes?: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPortfolio extends Document {
  portfolioId: string;
  timestamp: Date;
  totalCapitalUSD: number;
  allocatedCapitalUSD: number;
  availableCapitalUSD: number;
  exposureLimits: {
    maxOverallPercentage: number;
    maxTokenPercentage: number;
    maxSectorPercentage: number;
    maxNetworkPercentage: number;
  };
  currentExposure: {
    overallPercentage: number;
    tokens: Record<string, number>;
    sectors: Record<string, number>;
    networks: Record<string, number>;
  };
  activeTrades: number;
  pendingTrades: number;
  profitLoss: {
    totalPercentage: number;
    totalUSD: number;
    daily: {
      date: string;
      percentage: number;
      usd: number;
    }[];
  };
  drawdown: {
    current: number;
    max: number;
  };
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TokenSectorInfo {
  token: string;
  network: string;
  sector: string;
  correlations: string[];
}

// Schema definitions
const tradeSchema = new Schema<ITrade>({
  edgeCalculationId: { type: Schema.Types.ObjectId, ref: 'EdgeCalculation', required: true, index: true },
  tokenAddress: { type: String, required: true, index: true },
  network: { type: String, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(TradeStatus),
    default: TradeStatus.PENDING,
    index: true 
  },
  direction: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  targetPrice: { type: Number, required: true },
  stopLossPrice: { type: Number, required: true },
  positionSize: { type: Number, required: true },
  positionSizeUSD: { type: Number, required: true },
  maxPositionSizeUSD: { type: Number, required: true },
  confidence: { type: Number, required: true },
  riskAmount: { type: Number, required: true },
  positionSizeStrategy: { 
    type: String, 
    required: true, 
    enum: Object.values(PositionSizeStrategy)
  },
  sizeJustification: { type: String, required: true },
  riskPercentage: { type: Number, required: true },
  maxDrawdownPercentage: { type: Number, required: true },
  timeframeHours: { type: Number, required: true },
  exitPrice: { type: Number },
  exitTimestamp: { type: Date },
  result: { 
    type: String, 
    enum: Object.values(TradeResult)
  },
  resultPercentage: { type: Number },
  riskRewardRatio: { type: Number, required: true },
  expectedValue: { type: Number, required: true },
  portfolioWeightPercentage: { type: Number, required: true },
  correlatedPositions: [{ type: String }],
  totalExposure: { type: Number, required: true },
  exposureLimit: { type: Number, required: true },
  exposureBreakdown: {
    token: { type: Number, required: true },
    sector: { type: Number, required: true },
    network: { type: Number, required: true }
  },
  notes: { type: String },
  tags: [{ type: String }]
}, { timestamps: true });

const portfolioSchema = new Schema<IPortfolio>({
  portfolioId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  totalCapitalUSD: { type: Number, required: true },
  allocatedCapitalUSD: { type: Number, required: true },
  availableCapitalUSD: { type: Number, required: true },
  exposureLimits: {
    maxOverallPercentage: { type: Number, required: true },
    maxTokenPercentage: { type: Number, required: true },
    maxSectorPercentage: { type: Number, required: true },
    maxNetworkPercentage: { type: Number, required: true },
  },
  currentExposure: {
    overallPercentage: { type: Number, required: true },
    tokens: { type: Map, of: Number },
    sectors: { type: Map, of: Number },
    networks: { type: Map, of: Number }
  },
  activeTrades: { type: Number, required: true },
  pendingTrades: { type: Number, required: true },
  profitLoss: {
    totalPercentage: { type: Number, required: true },
    totalUSD: { type: Number, required: true },
    daily: [{
      date: { type: String, required: true },
      percentage: { type: Number, required: true },
      usd: { type: Number, required: true }
    }]
  },
  drawdown: {
    current: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  notes: { type: String }
}, { timestamps: true });

// Create models if they don't exist yet
const Trade: Model<ITrade> = mongoose.models.Trade as Model<ITrade> || 
  mongoose.model<ITrade>('Trade', tradeSchema);

const Portfolio: Model<IPortfolio> = mongoose.models.Portfolio as Model<IPortfolio> || 
  mongoose.model<IPortfolio>('Portfolio', portfolioSchema);

class RiskManagementService {
  private logger: winston.Logger;
  private maxRiskPerTradePercentage: number;
  private maxOverallExposurePercentage: number;
  private maxTokenExposurePercentage: number;
  private maxSectorExposurePercentage: number;
  private maxNetworkExposurePercentage: number;
  private defaultDrawdownLimit: number;
  private defaultPositionSizeStrategy: PositionSizeStrategy;
  private portfolioId: string;
  private tokenSectors: Map<string, TokenSectorInfo>;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'risk-management-service' },
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
    
    // Configure risk parameters
    this.maxRiskPerTradePercentage = 2.0; // Maximum 2% risk per trade
    this.maxOverallExposurePercentage = 50.0; // Maximum 50% overall exposure
    this.maxTokenExposurePercentage = 10.0; // Maximum 10% exposure per token
    this.maxSectorExposurePercentage = 20.0; // Maximum 20% exposure per sector
    this.maxNetworkExposurePercentage = 30.0; // Maximum 30% exposure per network
    this.defaultDrawdownLimit = 25.0; // Default 25% maximum drawdown limit
    this.defaultPositionSizeStrategy = PositionSizeStrategy.KELLY_CRITERION;
    this.portfolioId = 'default'; // Default portfolio ID
    
    // Initialize token sector mapping
    this.tokenSectors = new Map<string, TokenSectorInfo>();
    this.initializeTokenSectors();
  }
  
  /**
   * Initialize the risk management service
   */
  async init(): Promise<boolean> {
    try {
      // Initialize or load portfolio
      await this.initializePortfolio();
      
      this.logger.info('Risk management service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize risk management service:', error);
      return false;
    }
  }
  
  /**
   * Initialize or load portfolio
   */
  private async initializePortfolio(): Promise<void> {
    try {
      // Check if portfolio exists
      let portfolio = await Portfolio.findOne({ portfolioId: this.portfolioId });
      
      if (!portfolio) {
        // Create new portfolio
        portfolio = new Portfolio({
          portfolioId: this.portfolioId,
          timestamp: new Date(),
          totalCapitalUSD: config.riskManagement.initialCapital || 100000, // Default $100K
          allocatedCapitalUSD: 0,
          availableCapitalUSD: config.riskManagement.initialCapital || 100000,
          exposureLimits: {
            maxOverallPercentage: this.maxOverallExposurePercentage,
            maxTokenPercentage: this.maxTokenExposurePercentage,
            maxSectorPercentage: this.maxSectorExposurePercentage,
            maxNetworkPercentage: this.maxNetworkExposurePercentage
          },
          currentExposure: {
            overallPercentage: 0,
            tokens: {},
            sectors: {},
            networks: {}
          },
          activeTrades: 0,
          pendingTrades: 0,
          profitLoss: {
            totalPercentage: 0,
            totalUSD: 0,
            daily: []
          },
          drawdown: {
            current: 0,
            max: 0
          },
          notes: 'Initial portfolio setup'
        });
        
        await portfolio.save();
        this.logger.info(`Created new portfolio with ID ${this.portfolioId}`);
      } else {
        this.logger.info(`Loaded existing portfolio with ID ${this.portfolioId}`);
      }
    } catch (error) {
      this.logger.error('Error initializing portfolio:', error);
      throw error;
    }
  }
  
  /**
   * Initialize token sector mappings
   */
  private initializeTokenSectors(): void {
    // In production, this would be loaded from a database or API
    // For now, using some example mappings
    
    // Example token sector mapping for Ethereum
    this.tokenSectors.set('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', { // UNI
      token: 'UNI',
      network: 'ethereum',
      sector: 'defi',
      correlations: ['SUSHI', 'CAKE']
    });
    
    this.tokenSectors.set('0x6b175474e89094c44da98b954eedeac495271d0f', { // DAI
      token: 'DAI',
      network: 'ethereum',
      sector: 'stablecoin',
      correlations: ['USDC', 'USDT']
    });
    
    this.tokenSectors.set('0x514910771af9ca656af840dff83e8264ecf986ca', { // LINK
      token: 'LINK',
      network: 'ethereum',
      sector: 'oracle',
      correlations: ['BAND', 'API3']
    });
  }
  
  /**
   * Get token sector info
   */
  private getTokenSectorInfo(tokenAddress: string, network: string): TokenSectorInfo {
    const key = `${tokenAddress.toLowerCase()}`;
    
    if (this.tokenSectors.has(key)) {
      return this.tokenSectors.get(key)!;
    }
    
    // Default info if not found
    return {
      token: tokenAddress.substring(0, 8),
      network,
      sector: 'unknown',
      correlations: []
    };
  }
  
  /**
   * Evaluate trade for an edge calculation
   */
  async evaluateTrade(edgeCalculationId: string): Promise<ITrade | null> {
    try {
      // Get edge calculation
      const edge = await edgeCalculatorService.getEdgeCalculationById(edgeCalculationId);
      
      if (!edge) {
        this.logger.warn(`Edge calculation ${edgeCalculationId} not found`);
        return null;
      }
      
      if (edge.status !== EdgeStatus.CALCULATED) {
        this.logger.warn(`Edge calculation ${edgeCalculationId} is not in CALCULATED status`);
        return null;
      }
      
      // Check if we already have a trade for this edge calculation
      const existingTrade = await Trade.findOne({ edgeCalculationId: edge._id });
      
      if (existingTrade) {
        this.logger.info(`Trade already exists for edge calculation ${edgeCalculationId}`);
        return existingTrade;
      }
      
      // Get current portfolio
      const portfolio = await Portfolio.findOne({ portfolioId: this.portfolioId });
      
      if (!portfolio) {
        this.logger.error('Portfolio not found');
        return null;
      }
      
      // Get token sector information
      const sectorInfo = this.getTokenSectorInfo(edge.tokenAddress, edge.network);
      
      // Check exposure limits
      const exposureResult = await this.checkExposureLimits(
        edge.tokenAddress,
        edge.network,
        sectorInfo.sector
      );
      
      if (!exposureResult.approved) {
        this.logger.warn(`Exposure limit exceeded for ${edge.symbol}: ${exposureResult.reason}`);
        
        // Create trade with CANCELLED status
        const rejectedTrade = new Trade({
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
          sizeJustification: `Exposure limit exceeded: ${exposureResult.reason}`,
          riskPercentage: 0,
          maxDrawdownPercentage: this.defaultDrawdownLimit,
          timeframeHours: edge.primaryTarget.timeframeHours,
          riskRewardRatio: edge.riskRewardRatio,
          expectedValue: edge.expectedValue,
          portfolioWeightPercentage: 0,
          correlatedPositions: sectorInfo.correlations,
          totalExposure: exposureResult.currentExposure.overallPercentage,
          exposureLimit: portfolio.exposureLimits.maxOverallPercentage,
          exposureBreakdown: {
            token: exposureResult.currentExposure.tokenPercentage,
            sector: exposureResult.currentExposure.sectorPercentage,
            network: exposureResult.currentExposure.networkPercentage
          },
          notes: `Trade automatically cancelled. ${exposureResult.reason}`,
          tags: [edge.symbol, edge.network, sectorInfo.sector, 'cancelled', 'exposure_limit']
        });
        
        await rejectedTrade.save();
        this.logger.info(`Created cancelled trade for ${edge.symbol} due to exposure limits`);
        
        return rejectedTrade;
      }
      
      // Calculate position size
      const positionSizeResult = await this.calculatePositionSize(
        edge,
        portfolio.totalCapitalUSD,
        portfolio.availableCapitalUSD,
        exposureResult
      );
      
      // Create trade
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
        stopLossPrice: edge.stopLoss,
        positionSize: positionSizeResult.positionSize,
        positionSizeUSD: positionSizeResult.positionSizeUSD,
        maxPositionSizeUSD: positionSizeResult.maxPositionSizeUSD,
        confidence: edge.confidenceScore,
        riskAmount: positionSizeResult.riskAmount,
        positionSizeStrategy: positionSizeResult.strategy,
        sizeJustification: positionSizeResult.justification,
        riskPercentage: positionSizeResult.riskPercentage,
        maxDrawdownPercentage: this.defaultDrawdownLimit,
        timeframeHours: edge.primaryTarget.timeframeHours,
        riskRewardRatio: edge.riskRewardRatio,
        expectedValue: edge.expectedValue,
        portfolioWeightPercentage: (positionSizeResult.positionSizeUSD / portfolio.totalCapitalUSD) * 100,
        correlatedPositions: sectorInfo.correlations,
        totalExposure: exposureResult.currentExposure.overallPercentage,
        exposureLimit: portfolio.exposureLimits.maxOverallPercentage,
        exposureBreakdown: {
          token: exposureResult.currentExposure.tokenPercentage,
          sector: exposureResult.currentExposure.sectorPercentage,
          network: exposureResult.currentExposure.networkPercentage
        },
        notes: `Trade generated with ${edge.confidenceScore.toFixed(1)}% confidence and ${edge.riskRewardRatio.toFixed(2)} risk/reward.`,
        tags: [edge.symbol, edge.network, sectorInfo.sector, positionSizeResult.strategy]
      });
      
      await trade.save();
      
      // Update portfolio with pending trade
      await this.updatePortfolioWithPendingTrade(trade);
      
      this.logger.info(`Created trade for ${edge.symbol} with position size $${positionSizeResult.positionSizeUSD.toFixed(2)}`);
      
      return trade;
    } catch (error) {
      this.logger.error(`Error evaluating trade for edge ${edgeCalculationId}:`, error);
      return null;
    }
  }
  
  /**
   * Check exposure limits for a new trade
   */
  private async checkExposureLimits(
    tokenAddress: string,
    network: string,
    sector: string
  ): Promise<{
    approved: boolean;
    reason?: string;
    currentExposure: {
      overallPercentage: number;
      tokenPercentage: number;
      sectorPercentage: number;
      networkPercentage: number;
    };
  }> {
    try {
      // Get portfolio
      const portfolio = await Portfolio.findOne({ portfolioId: this.portfolioId });
      
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }
      
      // Get active trades
      const activeTrades = await Trade.find({
        status: { $in: [TradeStatus.PENDING, TradeStatus.ACTIVE] }
      });
      
      // Calculate current exposure
      let totalExposureUSD = activeTrades.reduce((sum, trade) => sum + trade.positionSizeUSD, 0);
      let tokenExposureUSD = activeTrades
        .filter(t => t.tokenAddress === tokenAddress)
        .reduce((sum, trade) => sum + trade.positionSizeUSD, 0);
      let sectorExposureUSD = activeTrades
        .filter(t => this.getTokenSectorInfo(t.tokenAddress, t.network).sector === sector)
        .reduce((sum, trade) => sum + trade.positionSizeUSD, 0);
      let networkExposureUSD = activeTrades
        .filter(t => t.network === network)
        .reduce((sum, trade) => sum + trade.positionSizeUSD, 0);
      
      // Calculate percentages
      const totalCapitalUSD = portfolio.totalCapitalUSD;
      const overallPercentage = (totalExposureUSD / totalCapitalUSD) * 100;
      const tokenPercentage = (tokenExposureUSD / totalCapitalUSD) * 100;
      const sectorPercentage = (sectorExposureUSD / totalCapitalUSD) * 100;
      const networkPercentage = (networkExposureUSD / totalCapitalUSD) * 100;
      
      // Check limits
      if (overallPercentage >= this.maxOverallExposurePercentage) {
        return {
          approved: false,
          reason: `Overall exposure (${overallPercentage.toFixed(2)}%) exceeds limit (${this.maxOverallExposurePercentage}%)`,
          currentExposure: {
            overallPercentage,
            tokenPercentage,
            sectorPercentage,
            networkPercentage
          }
        };
      }
      
      if (tokenPercentage >= this.maxTokenExposurePercentage) {
        return {
          approved: false,
          reason: `Token exposure (${tokenPercentage.toFixed(2)}%) exceeds limit (${this.maxTokenExposurePercentage}%)`,
          currentExposure: {
            overallPercentage,
            tokenPercentage,
            sectorPercentage,
            networkPercentage
          }
        };
      }
      
      if (sectorPercentage >= this.maxSectorExposurePercentage) {
        return {
          approved: false,
          reason: `Sector exposure (${sectorPercentage.toFixed(2)}%) exceeds limit (${this.maxSectorExposurePercentage}%)`,
          currentExposure: {
            overallPercentage,
            tokenPercentage,
            sectorPercentage,
            networkPercentage
          }
        };
      }
      
      if (networkPercentage >= this.maxNetworkExposurePercentage) {
        return {
          approved: false,
          reason: `Network exposure (${networkPercentage.toFixed(2)}%) exceeds limit (${this.maxNetworkExposurePercentage}%)`,
          currentExposure: {
            overallPercentage,
            tokenPercentage,
            sectorPercentage,
            networkPercentage
          }
        };
      }
      
      // All checks passed
      return {
        approved: true,
        currentExposure: {
          overallPercentage,
          tokenPercentage,
          sectorPercentage,
          networkPercentage
        }
      };
    } catch (error) {
      this.logger.error('Error checking exposure limits:', error);
      throw error;
    }
  }
  
  /**
   * Calculate position size for a trade
   */
  private async calculatePositionSize(
    edge: IEdgeCalculation,
    totalCapitalUSD: number,
    availableCapitalUSD: number,
    exposureInfo: any
  ): Promise<{
    positionSize: number;
    positionSizeUSD: number;
    maxPositionSizeUSD: number;
    riskAmount: number;
    riskPercentage: number;
    strategy: PositionSizeStrategy;
    justification: string;
  }> {
    try {
      // Default to selected strategy
      let strategy = this.defaultPositionSizeStrategy;
      let positionSizeUSD = 0;
      let justification = '';
      
      // Calculate risk parameters
      const riskPerTrade = this.maxRiskPerTradePercentage / 100; // Convert to decimal
      const riskAmount = totalCapitalUSD * riskPerTrade;
      
      // Calculate stop loss distance
      const stopLossDistance = Math.abs(edge.currentPrice - edge.stopLoss);
      const stopLossPercentage = (stopLossDistance / edge.currentPrice) * 100;
      
      // Calculate different position sizing options
      const positionSizeOptions: Record<PositionSizeStrategy, {
        size: number;
        score: number;
        justification: string;
      }> = {
        [PositionSizeStrategy.FIXED_AMOUNT]: {
          size: 0,
          score: 0,
          justification: ''
        },
        [PositionSizeStrategy.PERCENTAGE_OF_CAPITAL]: {
          size: 0,
          score: 0,
          justification: ''
        },
        [PositionSizeStrategy.KELLY_CRITERION]: {
          size: 0,
          score: 0,
          justification: ''
        },
        [PositionSizeStrategy.VOLATILITY_ADJUSTED]: {
          size: 0,
          score: 0,
          justification: ''
        },
        [PositionSizeStrategy.CONFIDENCE_BASED]: {
          size: 0,
          score: 0,
          justification: ''
        }
      };
      
      // 1. Fixed amount - Simple 1R position sizing
      const fixedAmountSize = riskAmount / (stopLossPercentage / 100) * edge.currentPrice;
      positionSizeOptions[PositionSizeStrategy.FIXED_AMOUNT] = {
        size: fixedAmountSize,
        score: 60, // Base score for simple sizing
        justification: `Fixed risk amount of $${riskAmount.toFixed(2)} (${this.maxRiskPerTradePercentage}% of capital)`
      };
      
      // 2. Percentage of capital - Based on confidence
      let percentageOfCapital = 0;
      
      if (edge.confidenceScore >= 80) {
        percentageOfCapital = 0.05; // 5%
      } else if (edge.confidenceScore >= 70) {
        percentageOfCapital = 0.03; // 3%
      } else if (edge.confidenceScore >= 60) {
        percentageOfCapital = 0.02; // 2%
      } else {
        percentageOfCapital = 0.01; // 1%
      }
      
      const percentageSize = totalCapitalUSD * percentageOfCapital;
      positionSizeOptions[PositionSizeStrategy.PERCENTAGE_OF_CAPITAL] = {
        size: percentageSize,
        score: 70, // Slightly better than fixed
        justification: `${(percentageOfCapital * 100).toFixed(1)}% of total capital ($${totalCapitalUSD.toFixed(2)}) based on ${edge.confidenceScore.toFixed(1)}% confidence`
      };
      
      // 3. Kelly Criterion - Based on probability and risk/reward
      const winProbability = edge.primaryTarget.probability;
      const rr = edge.riskRewardRatio;
      
      // Kelly formula: f* = (bp - q) / b
      // where: p = win probability, q = loss probability, b = odds received on win
      const kellyPercentage = Math.max(0, (winProbability * rr - (1 - winProbability)) / rr);
      
      // Use half-Kelly for safety
      const halfKellyPercentage = kellyPercentage / 2;
      
      const kellySize = totalCapitalUSD * halfKellyPercentage;
      positionSizeOptions[PositionSizeStrategy.KELLY_CRITERION] = {
        size: kellySize,
        score: 85, // Higher score for more sophisticated method
        justification: `Half-Kelly criterion: ${(halfKellyPercentage * 100).toFixed(2)}% of capital using win probability ${(winProbability * 100).toFixed(1)}% and R/R ${rr.toFixed(2)}`
      };
      
      // 4. Volatility adjusted - Adjust position size based on volatility
      // This is a placeholder - in production would use actual volatility metrics
      const volatilityFactor = stopLossPercentage > 10 ? 0.5 : stopLossPercentage > 5 ? 0.7 : 1.0;
      const volatilitySize = kellySize * volatilityFactor;
      
      positionSizeOptions[PositionSizeStrategy.VOLATILITY_ADJUSTED] = {
        size: volatilitySize,
        score: 80, // Good score for volatility consideration
        justification: `Volatility adjusted Kelly using factor ${volatilityFactor.toFixed(2)} based on ${stopLossPercentage.toFixed(2)}% stop loss distance`
      };
      
      // 5. Confidence based - Adjust position size based on confidence score
      
// Create a singleton instance and export it
export const riskManagementService = new RiskManagementService();