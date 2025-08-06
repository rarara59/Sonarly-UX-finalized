// Thorp V1 - Execution Planning Service
// Implements route optimization, slippage management, and execution planning

import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import riskManagementService, { ITrade, TradeStatus } from './risk-management-service';
import marketDataService, { TokenSwapRoute } from './market-data-service';
import config from '.';

// Types and interfaces
export enum ExecutionStatus {
  PLANNED = 'planned',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ExecutionStrategy {
  MARKET_ORDER = 'market_order',
  LIMIT_ORDER = 'limit_order',
  TWAP = 'twap', // Time-Weighted Average Price
  SCALED_ENTRY = 'scaled_entry',
  ICEBERG = 'iceberg'
}

export enum ExecutionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface ExecutionStep {
  stepNumber: number;
  description: string;
  amount: number;
  amountUSD: number;
  targetTime?: Date;
  completed: boolean;
  executionPrice?: number;
  executionTime?: Date;
  slippage?: number;
  txHash?: string;
  error?: string;
}

export interface RouteDetails {
  path: string[];
  exchanges: string[];
  estimatedOutput: number;
  priceImpact: number;
  gasEstimateUSD?: number;
  minOutputGuarantee?: number;
}

export interface IExecutionPlan extends Document {
  tradeId: mongoose.Types.ObjectId;
  tokenAddress: string;
  tokenSymbol: string;
  network: string;
  timestamp: Date;
  status: ExecutionStatus;
  strategy: ExecutionStrategy;
  direction: string;
  priority: ExecutionPriority;
  totalAmount: number;
  totalAmountUSD: number;
  targetEntryPrice: number;
  maxAcceptableSlippage: number;
  maxGasPriceGwei?: number;
  maxGasCostUSD?: number;
  routeDetails: RouteDetails;
  steps: ExecutionStep[];
  completedSteps: number;
  totalSteps: number;
  startTime?: Date;
  endTime?: Date;
  averageExecutionPrice?: number;
  totalExecutedAmount?: number;
  totalExecutedAmountUSD?: number;
  actualSlippage?: number;
  actualGasUsedUSD?: number;
  success: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema definition
const executionPlanSchema = new Schema<IExecutionPlan>({
  tradeId: { type: Schema.Types.ObjectId, ref: 'Trade', required: true, index: true },
  tokenAddress: { type: String, required: true, index: true },
  tokenSymbol: { type: String, required: true, index: true },
  network: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(ExecutionStatus),
    default: ExecutionStatus.PLANNED,
    index: true 
  },
  strategy: { 
    type: String, 
    required: true,
    enum: Object.values(ExecutionStrategy),
    index: true
  },
  direction: { type: String, required: true },
  priority: { 
    type: String, 
    required: true,
    enum: Object.values(ExecutionPriority),
    default: ExecutionPriority.MEDIUM,
    index: true
  },
  totalAmount: { type: Number, required: true },
  totalAmountUSD: { type: Number, required: true },
  targetEntryPrice: { type: Number, required: true },
  maxAcceptableSlippage: { type: Number, required: true },
  maxGasPriceGwei: { type: Number },
  maxGasCostUSD: { type: Number },
  routeDetails: {
    path: [{ type: String }],
    exchanges: [{ type: String }],
    estimatedOutput: { type: Number },
    priceImpact: { type: Number },
    gasEstimateUSD: { type: Number },
    minOutputGuarantee: { type: Number }
  },
  steps: [{
    stepNumber: { type: Number, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    amountUSD: { type: Number, required: true },
    targetTime: { type: Date },
    completed: { type: Boolean, default: false, required: true },
    executionPrice: { type: Number },
    executionTime: { type: Date },
    slippage: { type: Number },
    txHash: { type: String },
    error: { type: String }
  }],
  completedSteps: { type: Number, default: 0, required: true },
  totalSteps: { type: Number, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  averageExecutionPrice: { type: Number },
  totalExecutedAmount: { type: Number },
  totalExecutedAmountUSD: { type: Number },
  actualSlippage: { type: Number },
  actualGasUsedUSD: { type: Number },
  success: { type: Boolean, default: false, required: true },
  notes: { type: String }
}, { timestamps: true });

// Create model if it doesn't exist yet
const ExecutionPlan: Model<IExecutionPlan> = mongoose.models.ExecutionPlan as Model<IExecutionPlan> || 
  mongoose.model<IExecutionPlan>('ExecutionPlan', executionPlanSchema);

class ExecutionPlanningService {
  private logger: winston.Logger;
  private defaultMaxSlippage: number;
  private defaultMaxGasPriceGwei: number;
  private defaultStrategy: ExecutionStrategy;
  private baseAssetAddress: Record<string, string>;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'execution-planning-service' },
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
    
    // Configure defaults
    this.defaultMaxSlippage = 1.0; // 1% max slippage by default
    this.defaultMaxGasPriceGwei = 50; // 50 Gwei max gas price by default
    this.defaultStrategy = ExecutionStrategy.SCALED_ENTRY;
    
    // Common base assets by network
    this.baseAssetAddress = {
      ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
      polygon: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
      solana: 'So11111111111111111111111111111111111111112' // Wrapped SOL
    };
  }
  
  /**
   * Initialize the execution planning service
   */
  async init(): Promise<boolean> {
    try {
      this.logger.info('Execution planning service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize execution planning service:', error);
      return false;
    }
  }
  
  /**
   * Create an execution plan for a trade
   */
  async createExecutionPlan(
    tradeId: string,
    options: {
      strategy?: ExecutionStrategy;
      maxSlippage?: number;
      maxGasPriceGwei?: number;
      priority?: ExecutionPriority;
    } = {}
  ): Promise<IExecutionPlan | null> {
    try {
      // Get trade details
      const trade = await riskManagementService.getTradeById(tradeId);
      
      if (!trade) {
        this.logger.warn(`Trade ${tradeId} not found`);
        return null;
      }
      
      if (trade.status !== TradeStatus.PENDING) {
        this.logger.warn(`Cannot create execution plan for trade ${tradeId} with status ${trade.status}`);
        return null;
      }
      
      // Check if an execution plan already exists
      const existingPlan = await ExecutionPlan.findOne({ tradeId: trade._id });
      
      if (existingPlan) {
        this.logger.info(`Execution plan already exists for trade ${tradeId}`);
        return existingPlan;
      }
      
      // Set strategy and parameters
      const strategy = options.strategy || this.defaultStrategy;
      const maxSlippage = options.maxSlippage || this.defaultMaxSlippage;
      const maxGasPriceGwei = options.maxGasPriceGwei || this.defaultMaxGasPriceGwei;
      const priority = options.priority || ExecutionPriority.MEDIUM;
      
      // Get optimal route for execution
      const route = await this.findOptimalRoute(
        trade.tokenAddress,
        trade.network,
        trade.positionSize,
        trade.entryPrice
      );
      
      if (!route) {
        this.logger.warn(`Could not find execution route for ${trade.symbol} on ${trade.network}`);
        return null;
      }
      
      // Generate execution steps based on strategy
      const steps = this.generateExecutionSteps(trade, strategy, route);
      
      // Create execution plan
      const executionPlan = new ExecutionPlan({
        tradeId: trade._id,
        tokenAddress: trade.tokenAddress,
        tokenSymbol: trade.symbol,
        network: trade.network,
        timestamp: new Date(),
        status: ExecutionStatus.PLANNED,
        strategy,
        direction: trade.direction,
        priority,
        totalAmount: trade.positionSize,
        totalAmountUSD: trade.positionSizeUSD,
        targetEntryPrice: trade.entryPrice,
        maxAcceptableSlippage: maxSlippage,
        maxGasPriceGwei,
        maxGasCostUSD: this.estimateGasCost(trade.network, maxGasPriceGwei),
        routeDetails: route,
        steps,
        completedSteps: 0,
        totalSteps: steps.length,
        success: false,
        notes: `Execution plan created for ${trade.symbol} ${trade.direction} trade of size $${trade.positionSizeUSD.toFixed(2)}`
      });
      
      await executionPlan.save();
      
      this.logger.info(`Created execution plan for trade ${tradeId} with ${steps.length} steps using ${strategy} strategy`);
      
      return executionPlan;
    } catch (error) {
      this.logger.error(`Error creating execution plan for trade ${tradeId}:`, error);
      return null;
    }
  }
  
  /**
   * Find optimal route for trade execution
   */
  private async findOptimalRoute(
    tokenAddress: string,
    network: string,
    amount: number,
    entryPrice:
    