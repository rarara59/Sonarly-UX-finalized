// LEGACY: archived 2025-06-09 - deprecated 4KB version, replaced by smartWallet.ts (16KB)
// LEGACY: archived 2025-06-09 - deprecated 4KB version, replaced by smartWallet.ts (16KB)
// src/models/smartWallet.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// Simple interface matching your tier data
export interface ISmartWallet extends Document {
  address: string;
  network: string;
  category: string[];
  labels: string[];
  
  winRate: number;
  totalPnL: number;
  successfulTrades: number;
  totalTrades: number;
  memeTokenTrades: number;
  
  avgHoldTime: string;
  firstSeen: Date;
  lastActive: Date;
  isActive: boolean;
  
  memeTokenMetrics: {
    returns4xRate: number;
    avgEntryTiming: number;
    avgExitEfficiency: number;
    memeTokenWinRate: number;
    memeTokenAvgMultiplier: number;
    fastTimeframePreference: number;
    slowTimeframePreference: number;
  };
  
  tierMetrics: {
    tier: 1 | 2 | 3;
    weight_multiplier: number;
    priority: 'premium' | 'solid' | 'monitor';
    ens_name?: string;
    historical_trade_count: number;
    historical_avg_roi: number;
    historical_total_pnl: number;
    historical_avg_pnl_per_trade: number;
    days_before_data_pull: number;
    data_source_date: Date;
    tier_confidence_score: number;
    tier_last_updated: Date;
  };
  
  metadata: {
    preferredTokens: string[];
    tradingFrequency: string;
    primaryStrategies: string[];
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    targetTokenTypes: string[];
  };
}

// Simple schema
const SmartWalletSchema = new Schema<ISmartWallet>({
  address: { type: String, required: true, unique: true, index: true },
  network: { type: String, required: true, default: 'solana' },
  category: [{ type: String, required: true }],
  labels: [{ type: String }],
  
  winRate: { type: Number, default: 0 },
  totalPnL: { type: Number, default: 0 },
  successfulTrades: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  memeTokenTrades: { type: Number, default: 0 },
  
  avgHoldTime: { type: String, default: '' },
  firstSeen: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  
  memeTokenMetrics: {
    returns4xRate: { type: Number, default: 0 },
    avgEntryTiming: { type: Number, default: 0 },
    avgExitEfficiency: { type: Number, default: 0 },
    memeTokenWinRate: { type: Number, default: 0 },
    memeTokenAvgMultiplier: { type: Number, default: 0 },
    fastTimeframePreference: { type: Number, default: 50 },
    slowTimeframePreference: { type: Number, default: 50 }
  },
  
  tierMetrics: {
    tier: { type: Number, required: true, enum: [1, 2, 3] },
    weight_multiplier: { type: Number, required: true },
    priority: { type: String, required: true, enum: ['premium', 'solid', 'monitor'] },
    ens_name: { type: String, default: 'Unknown' },
    historical_trade_count: { type: Number, default: 0 },
    historical_avg_roi: { type: Number, default: 0 },
    historical_total_pnl: { type: Number, default: 0 },
    historical_avg_pnl_per_trade: { type: Number, default: 0 },
    days_before_data_pull: { type: Number, default: 0 },
    data_source_date: { type: Date, default: Date.now },
    tier_confidence_score: { type: Number, default: 0 },
    tier_last_updated: { type: Date, default: Date.now }
  },
  
  metadata: {
    preferredTokens: [{ type: String }],
    tradingFrequency: { type: String, default: 'Medium' },
    primaryStrategies: [{ type: String }],
    riskProfile: { type: String, default: 'moderate' },
    targetTokenTypes: [{ type: String }]
  }
}, {
  timestamps: true
});

// Static methods
SmartWalletSchema.statics.getByTier = function(tier: 1 | 2 | 3) {
  return this.find({ 'tierMetrics.tier': tier, isActive: true });
};

SmartWalletSchema.statics.getTierDistribution = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { 
      _id: '$tierMetrics.tier', 
      count: { $sum: 1 },
      avgWeight: { $avg: '$tierMetrics.weight_multiplier' }
    }},
    { $sort: { _id: 1 } }
  ]);
};

const SmartWallet: Model<ISmartWallet> = mongoose.models.SmartWallet as Model<ISmartWallet> ||
  mongoose.model<ISmartWallet>('SmartWallet', SmartWalletSchema);

export default SmartWallet;