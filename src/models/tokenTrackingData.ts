// src/models/tokenTrackingData.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITokenTrackingData extends Document {
  address: string;
  network: string;
  symbol: string;
  name: string;
  firstSeen: Date;
  lastUpdated: Date;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  totalSupply?: string;
  holderCount: number;
  smartMoneyActivity: {
    totalWallets: number;
    sniperWallets: number;
    gemSpotterWallets: number;
    earlyMoverWallets: number;
    buyToSellRatio: number;
    latestActivity: Date;
    is4xCandidate: boolean;
    predictedSuccessRate: number;
  };
  patterns: {
    fast: {
      hasPattern: boolean;
      patternType: string;
      confidence: number;
      detected: Date;
    };
    slow: {
      hasPattern: boolean;
      patternType: string;
      confidence: number;
      detected: Date;
    };
  };
  manipulationScore: number;
  tags: string[];
  metadata: any;
}

const TokenTrackingDataSchema = new Schema<ITokenTrackingData>(
  {
    address:         { type: String, required: true, unique: true },
    network:         { type: String, required: true },
    symbol:          { type: String, required: true },
    name:            { type: String, required: true },
    firstSeen:       { type: Date,   default: Date.now },
    lastUpdated:     { type: Date,   default: Date.now },
    price:           { type: Number, default: 0 },
    priceChange24h:  { type: Number, default: 0 },
    volume24h:       { type: Number, default: 0 },
    liquidity:       { type: Number, default: 0 },
    marketCap:       { type: Number, default: 0 },
    totalSupply:     { type: String },
    holderCount:     { type: Number, default: 0 },
    smartMoneyActivity: {
      totalWallets:          { type: Number, default: 0 },
      sniperWallets:         { type: Number, default: 0 },
      gemSpotterWallets:     { type: Number, default: 0 },
      earlyMoverWallets:     { type: Number, default: 0 },
      buyToSellRatio:        { type: Number, default: 0 },
      latestActivity:        { type: Date,   default: Date.now },
      is4xCandidate:         { type: Boolean, default: false },
      predictedSuccessRate:  { type: Number, default: 0 }
    },
    patterns: {
      fast: {
        hasPattern:  { type: Boolean, default: false },
        patternType: { type: String,  default: '' },
        confidence:  { type: Number,  default: 0 },
        detected:    { type: Date,    default: Date.now }
      },
      slow: {
        hasPattern:  { type: Boolean, default: false },
        patternType: { type: String,  default: '' },
        confidence:  { type: Number,  default: 0 },
        detected:    { type: Date,    default: Date.now }
      }
    },
    manipulationScore: { type: Number, default: 0 },
    tags:              [{ type: String }],
    metadata:          { type: Schema.Types.Mixed },
    // Pre‐materialized boolean for quick pattern queries
    hasAnyPattern:     { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'firstSeen', updatedAt: 'lastUpdated' }
  }
);

// ─── INDEXES ──────────────────────────────────────────────────────────────────
// 1. Unique constraints
TokenTrackingDataSchema.index({ address: 1 }, { unique: true });
TokenTrackingDataSchema.index({ symbol: 1, network: 1 }, { unique: true });

// 2. TTL for data retention (1 year)
TokenTrackingDataSchema.index(
  { lastUpdated: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 }
);

// 3. Pattern & tag lookups
TokenTrackingDataSchema.index({ hasAnyPattern: 1 });
TokenTrackingDataSchema.index({ tags: 1 });

// 4. 4x‐candidate compound index
TokenTrackingDataSchema.index(
  { 'smartMoneyActivity.is4xCandidate': 1, manipulationScore: 1 }
);

// 5. (Optional) Additional helpful indexes
TokenTrackingDataSchema.index({ 'smartMoneyActivity.predictedSuccessRate': -1 });
TokenTrackingDataSchema.index({
  'patterns.fast.hasPattern': 1,
  'patterns.slow.hasPattern': 1
});

const TokenTrackingData: Model<ITokenTrackingData> =
  mongoose.models.TokenTrackingData ||
  mongoose.model<ITokenTrackingData>(
    'TokenTrackingData',
    TokenTrackingDataSchema
  );

export default TokenTrackingData;