import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRecentToken {
  symbol: string;
  address: string;
  successCount: number;
  totalCount: number;
}

export interface IWalletPerformanceHistory extends Document {
  walletAddress: string;
  date: Date;
  successRate: number;
  totalTrades: number;
  profitUsd: number;
  averageReturnPercent?: number;
  tags?: string[];
  tokens?: IRecentToken[];
  metadata?: Record<string, any>;
}

const WalletPerformanceHistorySchema = new Schema<IWalletPerformanceHistory>(
  {
    walletAddress: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    successRate: { type: Number, required: true },
    totalTrades: { type: Number, required: true },
    profitUsd: { type: Number, required: true },
    averageReturnPercent: { type: Number },
    tags: [{ type: String }],
    tokens: [{
      symbol: { type: String, required: true },
      address: { type: String, required: true },
      successCount: { type: Number, required: true },
      totalCount: { type: Number, required: true }
    }],
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
// Unique per‐wallet per‐day
WalletPerformanceHistorySchema.index(
  { walletAddress: 1, date: 1 },
  { unique: true }
);
// Fast date lookups
WalletPerformanceHistorySchema.index({ date: 1 });
// Token‐level filters
WalletPerformanceHistorySchema.index(
  { walletAddress: 1, 'tokens.symbol': 1 }
);

export const WalletPerformanceHistory: Model<IWalletPerformanceHistory> =
  mongoose.models.WalletPerformanceHistory ||
  mongoose.model<IWalletPerformanceHistory>(
    'WalletPerformanceHistory',
    WalletPerformanceHistorySchema
  );