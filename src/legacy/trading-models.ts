// src/models/trading-models.ts

import mongoose, { Document, Schema } from 'mongoose';

// Enums
export enum TradeStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum PositionSizeStrategy {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FIXED_PERCENTAGE = 'FIXED_PERCENTAGE',
  KELLY_CRITERION = 'KELLY_CRITERION',
  VOLATILITY_ADJUSTED = 'VOLATILITY_ADJUSTED',
  RISK_PARITY = 'RISK_PARITY'
}

export enum PatternTimeframe {
  FAST = 'FAST',  // 1-4 hours
  SLOW = 'SLOW'   // 4-48 hours
}

// Interfaces
export interface ITrade extends Document {
  edgeCalculationId: mongoose.Types.ObjectId | string;
  tokenAddress: string;
  network: string;
  symbol: string;
  timestamp: Date;
  status: TradeStatus;
  direction: 'BUY' | 'SELL';
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
  patternTimeframe: PatternTimeframe;
  riskRewardRatio: number;
  expectedValue: number;
  targetReturn: number; // To track progress toward 4x minimum target
  portfolioWeightPercentage: number;
  correlatedPositions: string[];
  totalExposure: number;
  exposureLimit: number;
  exposureBreakdown: {
    token: number;
    sector: number;
    network: number;
  };
  // Solana-specific fields
  solanaNetwork: 'mainnet' | 'testnet' | 'devnet';
  smartMoneySignals: {
    detected: boolean;
    walletCount: number;
    confidence: number;
    significantWallets: string[];
  };
  contractSafetyVerification: {
    verified: boolean;
    score: number;
    issues: string[];
  };
  patternRecognition: {
    patternName: string;
    confidence: number;
    historicalSuccessRate: number;
  };
  notes: string;
  tags: string[];
  exitPrice?: number;
  exitTime?: Date;
  pnl?: number;
  pnlPercentage?: number;
  result?: TradeResult;
}

export interface IPortfolio extends Document {
  name: string;
  description?: string;
  initialCapital: number;
  currentValue: number;
  cashBalance: number;
  trades: ITrade[];
  performance: {
    totalPnl: number;
    pnlPercentage: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    maxDrawdown: number;
    sharpeRatio?: number;
    successRate: number;  // Track against 74-76% target
    avgReturn: number;    // Track against 4x minimum return
  };
  riskParameters: {
    maxPositionSize: number;
    maxExposure: number;
    maxDailyTrades: number;
    targetSuccessRate: {
      min: number;  // 74%
      max: number;  // 76%
    };
    minRequiredReturn: number;  // 4x
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeResult {
  successful: boolean;
  pnl: number;
  pnlPercentage: number;
  returnMultiple: number;  // Track 4x return target
  holdTimeHours: number;
  exitReason: string;
  targetReached: boolean;
  tags: string[];
}

// Schemas
const TradeSchema = new Schema<ITrade>({
  edgeCalculationId: { type: Schema.Types.ObjectId, required: true },
  tokenAddress: { type: String, required: true },
  network: { type: String, required: true, default: 'solana' },
  symbol: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: Object.values(TradeStatus), default: TradeStatus.PENDING },
  direction: { type: String, enum: ['BUY', 'SELL'], required: true, default: 'BUY' },
  entryPrice: { type: Number, required: true },
  targetPrice: { type: Number, required: true },
  stopLossPrice: { type: Number, required: true },
  positionSize: { type: Number, required: true },
  positionSizeUSD: { type: Number, required: true },
  maxPositionSizeUSD: { type: Number, required: true },
  confidence: { type: Number, required: true },
  riskAmount: { type: Number, required: true },
  positionSizeStrategy: { type: String, enum: Object.values(PositionSizeStrategy), required: true },
  sizeJustification: { type: String, required: true },
  riskPercentage: { type: Number, required: true },
  maxDrawdownPercentage: { type: Number, required: true },
  timeframeHours: { type: Number, required: true },
  patternTimeframe: { type: String, enum: Object.values(PatternTimeframe), required: true },
  riskRewardRatio: { type: Number, required: true },
  expectedValue: { type: Number, required: true },
  targetReturn: { type: Number, required: true, default: 4 }, // 4x minimum target
  portfolioWeightPercentage: { type: Number, required: true },
  correlatedPositions: [{ type: String }],
  totalExposure: { type: Number, required: true },
  exposureLimit: { type: Number, required: true },
  exposureBreakdown: {
    token: { type: Number, required: true },
    sector: { type: Number, required: true },
    network: { type: Number, required: true }
  },
  // Solana-specific fields
  solanaNetwork: { type: String, enum: ['mainnet', 'testnet', 'devnet'], default: 'mainnet' },
  smartMoneySignals: {
    detected: { type: Boolean, default: false },
    walletCount: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    significantWallets: [{ type: String }]
  },
  contractSafetyVerification: {
    verified: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    issues: [{ type: String }]
  },
  patternRecognition: {
    patternName: { type: String },
    confidence: { type: Number, default: 0 },
    historicalSuccessRate: { type: Number, default: 0 }
  },
  notes: { type: String },
  tags: [{ type: String }],
  exitPrice: { type: Number },
  exitTime: { type: Date },
  pnl: { type: Number },
  pnlPercentage: { type: Number },
  result: {
    successful: { type: Boolean },
    pnl: { type: Number },
    pnlPercentage: { type: Number },
    returnMultiple: { type: Number },  // Track 4x return target
    holdTimeHours: { type: Number },
    exitReason: { type: String },
    targetReached: { type: Boolean },
    tags: [{ type: String }]
  }
}, { timestamps: true });

const PortfolioSchema = new Schema<IPortfolio>({
  name: { type: String, required: true },
  description: { type: String },
  initialCapital: { type: Number, required: true },
  currentValue: { type: Number, required: true },
  cashBalance: { type: Number, required: true },
  trades: [{ type: Schema.Types.ObjectId, ref: 'Trade' }],
  performance: {
    totalPnl: { type: Number, required: true },
    pnlPercentage: { type: Number, required: true },
    winRate: { type: Number, required: true },
    averageWin: { type: Number, required: true },
    averageLoss: { type: Number, required: true },
    maxDrawdown: { type: Number, required: true },
    sharpeRatio: { type: Number },
    successRate: { type: Number, default: 0 },  // Track against 74-76% target
    avgReturn: { type: Number, default: 0 }    // Track against 4x minimum return
  },
  riskParameters: {
    maxPositionSize: { type: Number, required: true },
    maxExposure: { type: Number, required: true },
    maxDailyTrades: { type: Number, required: true },
    targetSuccessRate: {
      min: { type: Number, default: 74 },
      max: { type: Number, default: 76 }
    },
    minRequiredReturn: { type: Number, default: 4 }  // 4x
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
export const Trade = mongoose.model<ITrade>('Trade', TradeSchema);
export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);