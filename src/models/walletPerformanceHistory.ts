// src/models/walletPerformanceHistory.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for recent token in performance history
export interface IRecentToken {
  address: string;
  symbol: string;
  profit: boolean;
  returnPercentage: number;
}

// Interface for wallet performance history
export interface IWalletPerformanceHistory extends Document {
  walletAddress: string;
  date: Date;
  successRate: number;
  totalTrades: number;
  profitableTrades: number;
  averageReturn: number;
  returns4xRate: number;
  confidenceScore: number;
  recentTokens: IRecentToken[];
}

// Schema for wallet performance history
const WalletPerformanceHistorySchema = new Schema<IWalletPerformanceHistory>({
  walletAddress: { type: String, required: true, index: true },
  date: { type: Date, default: Date.now, index: true },
  successRate: { type: Number },
  totalTrades: { type: Number },
  profitableTrades: { type: Number },
  averageReturn: { type: Number },
  returns4xRate: { type: Number },
  confidenceScore: { type: Number },
  recentTokens: [{
    address: { type: String },
    symbol: { type: String },
    profit: { type: Boolean },
    returnPercentage: { type: Number }
  }]
}, { timestamps: true });

// Create indexes for queries
WalletPerformanceHistorySchema.index({ walletAddress: 1, date: -1 });

// Create model
const WalletPerformanceHistory: Model<IWalletPerformanceHistory> = mongoose.models.WalletPerformanceHistory as Model<IWalletPerformanceHistory> ||
  mongoose.model<IWalletPerformanceHistory>('WalletPerformanceHistory', WalletPerformanceHistorySchema);

export default WalletPerformanceHistory;