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
}

// Interface for external wallet document
export interface IExternalWallet extends Document {
  address: string;
  network: string;
  category: string; // Sniper, Gem Spotter, Early Mover
  winRate: number;
  totalPnL: number;
  successfulTrades: number;
  totalTrades: number;
  avgHoldTime: string;
  firstSeen: Date;
  lastUpdated: Date;
  isActive: boolean;
  reputationScore: number;
  transactions: IWalletTransaction[];
  metadata: {
    preferredTokens: string[];
    tradingFrequency: string;
    lastActiveTimestamp: Date;
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
  isSuccessful: { type: Boolean, default: false }
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
  isActive: { type: Boolean, default: true },
  reputationScore: { type: Number, default: 0 },
  transactions: [WalletTransactionSchema],
  metadata: {
    preferredTokens: [{ type: String }],
    tradingFrequency: { type: String, default: 'Medium' },
    lastActiveTimestamp: { type: Date, default: Date.now },
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create indexes to optimize queries
ExternalWalletSchema.index({ category: 1, winRate: -1 });
ExternalWalletSchema.index({ category: 1, totalPnL: -1 });
ExternalWalletSchema.index({ reputationScore: -1 });

// Calculate reputation score before saving
ExternalWalletSchema.pre('save', function(next) {
  // Calculate a reputation score based on win rate, PnL, and number of trades
  if (this.totalTrades > 0) {
    // Weights for different factors
    const winRateWeight = 0.4;
    const pnlWeight = 0.4;
    const tradesWeight = 0.2;
    
    // Normalize PnL to a 0-100 scale (assuming 100k is a good PnL)
    const normalizedPnL = Math.min(100, (this.totalPnL / 100000) * 100);
    
    // Normalize trades count (assuming 500 trades is a good number)
    const normalizedTrades = Math.min(100, (this.totalTrades / 500) * 100);
    
    this.reputationScore = (
      (this.winRate * winRateWeight) + 
      (normalizedPnL * pnlWeight) + 
      (normalizedTrades * tradesWeight)
    );
  }
  next();
});

// Create model if it doesn't exist yet
const ExternalWallet: Model<IExternalWallet> = mongoose.models.ExternalWallet as Model<IExternalWallet> ||
  mongoose.model<IExternalWallet>('ExternalWallet', ExternalWalletSchema);

export default ExternalWallet;