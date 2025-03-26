// src/models/smartWallet.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { IWalletTransaction } from './externalWallet';

// Interface for pattern recognition metrics
export interface IPatternMetrics {
  patternType: string;  // 'breakout', 'accumulation', 'v-recovery', etc.
  successRate: number;
  avgMultiplier: number;
  avgHoldTime: number;
  sampleSize: number;
  lastUpdated: Date;
}

// Interface for meme coin specific metrics
export interface IMemeTokenMetrics {
  returns4xRate: number;       // How often wallet achieves 4x returns
  avgEntryTiming: number;      // How early they get in (percentile)
  avgExitEfficiency: number;   // How close to top they exit (percentile)
  memeTokenWinRate: number;    // Specific to meme tokens
  memeTokenAvgMultiplier: number;
  fastTimeframePreference: number; // 0-100 scale for 1-4h preference
  slowTimeframePreference: number; // 0-100 scale for 4-48h preference
}

// Smart Wallet document interface
export interface ISmartWallet extends Document {
  address: string;
  network: string;
  category: string[];  // Allow multiple categories
  labels: string[];    // Custom labels
  
  // Core metrics
  winRate: number;
  totalPnL: number;
  successfulTrades: number;
  totalTrades: number;
  memeTokenTrades: number;
  
  // Time-related
  avgHoldTime: string;
  firstSeen: Date;
  lastUpdated: Date;
  lastActive: Date;
  isActive: boolean;
  
  // Enhanced metrics for targeting 74-76% success
  reputationScore: number;
  confidenceScore: number;
  predictedSuccessRate: number;
  
  // 4x target specific metrics
  memeTokenMetrics: IMemeTokenMetrics;
  
  // Pattern recognition
  patternMetrics: IPatternMetrics[];
  
  // Historical data
  transactions: IWalletTransaction[];
  
  // Additional metadata
  metadata: {
    preferredTokens: string[];
    tradingFrequency: string;
    primaryStrategies: string[];
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    targetTokenTypes: string[];
    [key: string]: any;
  };
}

// Create the schema
const PatternMetricsSchema = new Schema<IPatternMetrics>({
  patternType: { type: String, required: true },
  successRate: { type: Number, default: 0 },
  avgMultiplier: { type: Number, default: 0 },
  avgHoldTime: { type: Number, default: 0 },
  sampleSize: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const MemeTokenMetricsSchema = new Schema<IMemeTokenMetrics>({
  returns4xRate: { type: Number, default: 0 },
  avgEntryTiming: { type: Number, default: 0 },
  avgExitEfficiency: { type: Number, default: 0 },
  memeTokenWinRate: { type: Number, default: 0 },
  memeTokenAvgMultiplier: { type: Number, default: 0 },
  fastTimeframePreference: { type: Number, default: 50 },
  slowTimeframePreference: { type: Number, default: 50 }
});

const SmartWalletSchema = new Schema<ISmartWallet>({
  address: { type: String, required: true, unique: true, index: true },
  network: { type: String, required: true, index: true, default: 'solana' },
  category: [{ type: String, required: true, index: true }],
  labels: [{ type: String }],
  
  winRate: { type: Number, default: 0 },
  totalPnL: { type: Number, default: 0 },
  successfulTrades: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  memeTokenTrades: { type: Number, default: 0 },
  
  avgHoldTime: { type: String, default: '' },
  firstSeen: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  
  reputationScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },
  predictedSuccessRate: { type: Number, default: 0 },
  
  memeTokenMetrics: { type: MemeTokenMetricsSchema, default: () => ({}) },
  patternMetrics: [PatternMetricsSchema],
  
  transactions: { type: [Schema.Types.Mixed], default: [] },
  
  metadata: {
    preferredTokens: [{ type: String }],
    tradingFrequency: { type: String, default: 'Medium' },
    primaryStrategies: [{ type: String }],
    riskProfile: { type: String, default: 'moderate' },
    targetTokenTypes: [{ type: String }],
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create indexes to optimize queries specific to 74-76% success goal
SmartWalletSchema.index({ predictedSuccessRate: -1 });
SmartWalletSchema.index({ "memeTokenMetrics.returns4xRate": -1 });
SmartWalletSchema.index({ winRate: -1, "memeTokenMetrics.memeTokenWinRate": -1 });
SmartWalletSchema.index({ category: 1, winRate: -1 });
SmartWalletSchema.index({ category: 1, "memeTokenMetrics.returns4xRate": -1 });
SmartWalletSchema.index({ "memeTokenMetrics.fastTimeframePreference": -1 });
SmartWalletSchema.index({ "memeTokenMetrics.slowTimeframePreference": -1 });

// Calculate predicted success rate (targeting 74-76%)
SmartWalletSchema.pre('save', function(next) {
  if (this.totalTrades > 0) {
    // Factors most relevant for targeting 74-76% success rate with 4x returns
    const memePerformanceWeight = 0.35;
    const generalWinRateWeight = 0.25;
    const patternSuccessWeight = 0.20;
    const timeframeAlignmentWeight = 0.10;
    const entryTimingWeight = 0.10;
    
    // Calculate meme token performance score
    const memePerformanceScore = this.memeTokenMetrics?.returns4xRate || 0;
    
    // Calculate pattern success score (average of all patterns)
    const patternScores = this.patternMetrics?.map(p => p.successRate) || [];
    const patternSuccessScore = patternScores.length > 0 
      ? patternScores.reduce((sum, score) => sum + score, 0) / patternScores.length 
      : 0;
    
    // Calculate timeframe alignment (how well the wallet's preference matches target timeframes)
    const targetFastPreference = 60; // Prefer fast patterns slightly more based on project goals
    const targetSlowPreference = 40;
    const fastDiff = Math.abs((this.memeTokenMetrics?.fastTimeframePreference || 50) - targetFastPreference);
    const slowDiff = Math.abs((this.memeTokenMetrics?.slowTimeframePreference || 50) - targetSlowPreference);
    const timeframeAlignmentScore = 100 - ((fastDiff + slowDiff) / 2);
    
    // Calculate entry timing score
    const entryTimingScore = this.memeTokenMetrics?.avgEntryTiming || 0;
    
    // Calculate predicted success rate (weighted average)
    this.predictedSuccessRate = (
      (memePerformanceScore * memePerformanceWeight) +
      (this.winRate * generalWinRateWeight) +
      (patternSuccessScore * patternSuccessWeight) +
      (timeframeAlignmentScore * timeframeAlignmentWeight) +
      (entryTimingScore * entryTimingWeight)
    );
    
    // Calculate confidence score based on sample size
    const minSampleSize = 30; // Minimum trades for full confidence
    const sampleSizeFactor = Math.min(1, this.totalTrades / minSampleSize);
    const recentActivityFactor = this.isActive ? 1 : 0.7;
    this.confidenceScore = this.predictedSuccessRate * sampleSizeFactor * recentActivityFactor;
  }
  next();
});

// Create model
const SmartWallet: Model<ISmartWallet> = mongoose.models.SmartWallet as Model<ISmartWallet> ||
  mongoose.model<ISmartWallet>('SmartWallet', SmartWalletSchema);

export default SmartWallet;