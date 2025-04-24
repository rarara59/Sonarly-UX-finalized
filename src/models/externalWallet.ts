// src/models/externalWallet.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for wallet transaction
export interface IWalletTransaction {
  tokenSymbol: string;
  tokenAddress: string;
  buyPrice: number;
  sellPrice: number;
  buyAmount: number;
  sellAmount: number;
  buyTimestamp: Date;
  sellTimestamp: Date | null;
  pnlValue: number;
  pnlPercentage: number;
  transactionValue: number;
  chain: string;
  isSuccessful: boolean;
  transactionHash?: string; // Add transaction hash for reference
  holdTime?: string; // Add hold time metric
  timeframe?: 'fast' | 'slow' | 'other'; // Add timeframe classification
}

// Interface for external wallet document
export interface IExternalWallet extends Document {
  address: string;
  network: string;
  category: string; // 'Sniper', 'Gem Spotter', 'Early Mover'
  winRate: number;
  totalPnL: number;
  successfulTrades: number;
  totalTrades: number;
  avgHoldTime: string;
  firstSeen: Date;
  lastUpdated: Date;
  lastActivity: Date; // Track last activity date
  isActive: boolean;
  reputationScore: number;
  transactions: IWalletTransaction[];
  returns4xRate: number; // Percentage of trades that achieve 4x or better returns
  fastTimeframePreference: number; // 0-100 scale for 1-4h preference
  slowTimeframePreference: number; // 0-100 scale for 4-48h preference
  exitEfficiencyScore: number; // 0-100 scale, how close to the top they typically exit
  predictedSuccessRate: number; // Calculated prediction of success rate
  confidenceScore: number; // Confidence in the prediction (0-100)
  metadata: {
    preferredTokens: string[];
    tradingFrequency: string;
    lastActiveTimestamp: Date;
    achieves4xScore?: number; // Percentage of trades that achieve 4x
    fastTimeframeStats?: {
      count: number;
      successRate: number;
      avgMultiplier: number;
    };
    slowTimeframeStats?: {
      count: number;
      successRate: number;
      avgMultiplier: number;
    };
    memeTokenStats?: {
      count: number;
      successRate: number;
      avgMultiplier: number;
    };
    entryTimingScore?: number; // How early they get in (percentile)
    [key: string]: any;
  };
}

// Create the schema
const WalletTransactionSchema = new Schema<IWalletTransaction>({
  tokenSymbol: { type: String, required: true },
  tokenAddress: { type: String, required: true },
  buyPrice: { type: Number, default: 0 },
  sellPrice: { type: Number, default: 0 },
  buyAmount: { type: Number, default: 0 },
  sellAmount: { type: Number, default: 0 },
  buyTimestamp: { type: Date, required: true },
  sellTimestamp: { type: Date, default: null },
  pnlValue: { type: Number, default: 0 },
  pnlPercentage: { type: Number, default: 0 },
  transactionValue: { type: Number, default: 0 },
  chain: { type: String, default: 'solana' },
  isSuccessful: { type: Boolean, default: false },
  transactionHash: { type: String },
  holdTime: { type: String },
  timeframe: { type: String, enum: ['fast', 'slow', 'other'] }
});

const ExternalWalletSchema = new Schema<IExternalWallet>({
  address: { type: String, required: true, unique: true, index: true },
  network: { type: String, required: true, index: true, default: 'solana' },
  category: { type: String, required: true, index: true },
  winRate: { type: Number, default: 0 },
  totalPnL: { type: Number, default: 0 },
  successfulTrades: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  avgHoldTime: { type: String, default: '' },
  firstSeen: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  reputationScore: { type: Number, default: 0 },
  transactions: [WalletTransactionSchema],
  metadata: {
    preferredTokens: [{ type: String }],
    tradingFrequency: { type: String, default: 'Medium' },
    lastActiveTimestamp: { type: Date, default: Date.now },
    achieves4xScore: { type: Number, default: 0 },
    fastTimeframeStats: {
      count: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
      avgMultiplier: { type: Number, default: 0 }
    },
    slowTimeframeStats: {
      count: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
      avgMultiplier: { type: Number, default: 0 }
    },
    memeTokenStats: {
      count: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
      avgMultiplier: { type: Number, default: 0 }
    },
    entryTimingScore: { type: Number, default: 0 },
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create indexes to optimize queries
ExternalWalletSchema.index({ category: 1, winRate: -1 });
ExternalWalletSchema.index({ category: 1, totalPnL: -1 });
ExternalWalletSchema.index({ reputationScore: -1 });
ExternalWalletSchema.index({ 'metadata.achieves4xScore': -1 });
ExternalWalletSchema.index({ lastActivity: -1 });

// Calculate reputation score before saving
ExternalWalletSchema.pre('save', function(next) {
  // Calculate a reputation score based on win rate, PnL, and number of trades
  if (this.totalTrades > 0) {
    // Weights for different factors
    const winRateWeight = 0.4;
    const pnlWeight = 0.3;
    const tradesWeight = 0.2;
    const achieves4xWeight = 0.1;
    
    // Normalize PnL to a 0-100 scale (assuming 100k is a good PnL)
    const normalizedPnL = Math.min(100, (this.totalPnL / 100000) * 100);
    
    // Normalize trades count (assuming 500 trades is a good number)
    const normalizedTrades = Math.min(100, (this.totalTrades / 500) * 100);
    
    // Get 4x achievement score (default to 0 if not exists)
    const achieves4xScore = this.metadata.achieves4xScore || 0;
    
    this.reputationScore = Math.round(
      (this.winRate * winRateWeight) + 
      (normalizedPnL * pnlWeight) + 
      (normalizedTrades * tradesWeight) +
      (achieves4xScore * achieves4xWeight)
    );
  }
  next();
});

// Create model if it doesn't exist yet
const ExternalWallet: Model<IExternalWallet> = mongoose.models.ExternalWallet as Model<IExternalWallet> ||
  mongoose.model<IExternalWallet>('ExternalWallet', ExternalWalletSchema);

export default ExternalWallet;