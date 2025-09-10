// =============================================================================
// ENHANCED SMART WALLET MODEL - Integrates Tier System with Your Existing Model
// src/models/smartWallet.ts - REPLACE YOUR EXISTING FILE WITH THIS
// =============================================================================

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IWalletTransaction } from './externalWallet';

// Interface for pattern recognition metrics (EXISTING - UNCHANGED)
export interface IPatternMetrics {
  patternType: string;  // 'breakout', 'accumulation', 'v-recovery', etc.
  successRate: number;
  avgMultiplier: number;
  avgHoldTime: number;
  sampleSize: number;
  lastUpdated: Date;
}

// Interface for meme coin specific metrics (EXISTING - UNCHANGED)
export interface IMemeTokenMetrics {
  returns4xRate: number;       // How often wallet achieves 4x returns
  avgEntryTiming: number;      // How early they get in (percentile)
  avgExitEfficiency: number;   // How close to top they exit (percentile)
  memeTokenWinRate: number;    // Specific to meme tokens
  memeTokenAvgMultiplier: number;
  fastTimeframePreference: number; // 0-100 scale for 1-4h preference
  slowTimeframePreference: number; // 0-100 scale for 4-48h preference
}

// ===== NEW: TIER SYSTEM INTERFACE =====
export interface ITierMetrics {
  tier: 1 | 2 | 3;                    // Wallet tier (1=Premium, 2=Solid, 3=Monitor)
  weight_multiplier: number;           // Signal weight (5.0, 3.0, 1.0)
  priority: 'premium' | 'solid' | 'monitor';
  ens_name?: string;                   // ENS name if available
  
  // Historical performance from our dataset
  historical_trade_count: number;
  historical_avg_roi: number;
  historical_total_pnl: number;
  historical_avg_pnl_per_trade: number;
  days_before_data_pull: number;
  data_source_date: Date;
  
  // Tier-specific metrics
  tier_confidence_score: number;       // How confident we are in this tier placement
  tier_last_updated: Date;
}

// ===== STATIC METHODS INTERFACE =====
interface ISmartWalletModel extends Model<ISmartWallet> {
  getByTier(tier: 1 | 2 | 3): any;
  getActiveWallets(): any;
  getTierDistribution(): any;
}

// Enhanced Smart Wallet document interface (EXTENDS YOUR EXISTING)
export interface ISmartWallet extends Document {
  address: string;
  network: string;
  category: string[];  // Allow multiple categories
  labels: string[];    // Custom labels
  
  // Core metrics (EXISTING - UNCHANGED)
  winRate: number;
  totalPnL: number;
  successfulTrades: number;
  totalTrades: number;
  memeTokenTrades: number;
  
  // Time-related (EXISTING - UNCHANGED)
  avgHoldTime: string;
  firstSeen: Date;
  lastUpdated: Date;
  lastActive: Date;
  isActive: boolean;
  
  // Enhanced metrics for targeting 74-76% success (EXISTING - UNCHANGED)
  reputationScore: number;
  confidenceScore: number;
  predictedSuccessRate: number;
  
  // 4x target specific metrics (EXISTING - UNCHANGED)
  memeTokenMetrics: IMemeTokenMetrics;
  
  // Pattern recognition (EXISTING - UNCHANGED)
  patternMetrics: IPatternMetrics[];
  
  // Historical data (EXISTING - UNCHANGED)
  transactions: IWalletTransaction[];
  
  // ===== NEW: TIER SYSTEM INTEGRATION =====
  tierMetrics: ITierMetrics;
  
  // Additional metadata (EXISTING - ENHANCED)
  metadata: {
    preferredTokens: string[];
    tradingFrequency: string;
    primaryStrategies: string[];
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    targetTokenTypes: string[];
    [key: string]: any;
  };
}

// ===== SCHEMAS =====

// Pattern metrics schema (EXISTING - UNCHANGED)
const PatternMetricsSchema = new Schema<IPatternMetrics>({
  patternType: { type: String, required: true },
  successRate: { type: Number, default: 0 },
  avgMultiplier: { type: Number, default: 0 },
  avgHoldTime: { type: Number, default: 0 },
  sampleSize: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Meme token metrics schema (EXISTING - UNCHANGED)
const MemeTokenMetricsSchema = new Schema<IMemeTokenMetrics>({
  returns4xRate: { type: Number, default: 0 },
  avgEntryTiming: { type: Number, default: 0 },
  avgExitEfficiency: { type: Number, default: 0 },
  memeTokenWinRate: { type: Number, default: 0 },
  memeTokenAvgMultiplier: { type: Number, default: 0 },
  fastTimeframePreference: { type: Number, default: 50 },
  slowTimeframePreference: { type: Number, default: 50 }
});

// ===== NEW: TIER METRICS SCHEMA =====
const TierMetricsSchema = new Schema<ITierMetrics>({
  tier: { 
    type: Number, 
    required: true, 
    enum: [1, 2, 3],
    index: true 
  },
  weight_multiplier: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10,
    index: true
  },
  priority: { 
    type: String, 
    required: true,
    enum: ['premium', 'solid', 'monitor'],
    index: true 
  },
  ens_name: { type: String, default: 'Unknown' },
  
  // Historical performance metrics
  historical_trade_count: { type: Number, default: 0 },
  historical_avg_roi: { type: Number, default: 0 },
  historical_total_pnl: { type: Number, default: 0 },
  historical_avg_pnl_per_trade: { type: Number, default: 0 },
  days_before_data_pull: { type: Number, default: 0 },
  data_source_date: { type: Date, default: () => new Date('2025-04-22') },
  
  // Tier confidence
  tier_confidence_score: { type: Number, default: 0, min: 0, max: 100 },
  tier_last_updated: { type: Date, default: Date.now }
});

// Enhanced SmartWallet schema (EXTENDS YOUR EXISTING)
const SmartWalletSchema = new Schema<ISmartWallet>({
  // ===== EXISTING FIELDS (UNCHANGED) =====
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
  
  transactions: [Schema.Types.Mixed],
  
  // ===== NEW: TIER SYSTEM =====
  tierMetrics: { 
    type: TierMetricsSchema, 
    required: true,
    index: true
  },
  
  // ===== EXISTING METADATA (UNCHANGED) =====
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

// ===== ENHANCED INDEXES (ADDS TO YOUR EXISTING) =====
// Your existing indexes (UNCHANGED)
SmartWalletSchema.index({ predictedSuccessRate: -1 });
SmartWalletSchema.index({ "memeTokenMetrics.returns4xRate": -1 });
SmartWalletSchema.index({ winRate: -1, "memeTokenMetrics.memeTokenWinRate": -1 });
SmartWalletSchema.index({ category: 1, winRate: -1 });
SmartWalletSchema.index({ category: 1, "memeTokenMetrics.returns4xRate": -1 });
SmartWalletSchema.index({ "memeTokenMetrics.fastTimeframePreference": -1 });
SmartWalletSchema.index({ "memeTokenMetrics.slowTimeframePreference": -1 });

// NEW: Tier-specific indexes
SmartWalletSchema.index({ "tierMetrics.tier": 1, isActive: 1 });
SmartWalletSchema.index({ "tierMetrics.priority": 1, isActive: 1 });
SmartWalletSchema.index({ "tierMetrics.weight_multiplier": -1 });
SmartWalletSchema.index({ "tierMetrics.tier": 1, "tierMetrics.tier_confidence_score": -1 });

// ===== STATIC METHODS (NEW) =====
SmartWalletSchema.statics.getByTier = function(tier: 1 | 2 | 3) {
  return this.find({ 
    'tierMetrics.tier': tier, 
    isActive: true 
  }).sort({ 'tierMetrics.weight_multiplier': -1 });
};

SmartWalletSchema.statics.getActiveWallets = function() {  
  return this.find({ isActive: true })
    .sort({ 
      'tierMetrics.tier': 1, 
      'tierMetrics.weight_multiplier': -1 
    });
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

// ===== INSTANCE METHODS (NEW) =====
SmartWalletSchema.methods.calculateInfluence = function(signalStrength: number): number {
  const baseInfluence = signalStrength * this.tierMetrics.weight_multiplier;
  const maxInfluence = 0.08; // 8% max per wallet
  return Math.min(baseInfluence, maxInfluence);
};

SmartWalletSchema.methods.isRecentlyActive = function(daysThreshold: number = 30): boolean {
  const daysAgo = (Date.now() - this.lastActive.getTime()) / (1000 * 60 * 60 * 24);
  return daysAgo <= daysThreshold;
};

SmartWalletSchema.methods.getTierWeight = function(): number {
  return this.tierMetrics.weight_multiplier;
};

SmartWalletSchema.methods.isPremiumTier = function(): boolean {
  return this.tierMetrics.tier === 1;
};

// ===== ENHANCED PRE-SAVE HOOK (EXTENDS YOUR EXISTING) =====
SmartWalletSchema.pre<ISmartWallet>('save', function(next) {
  const self = this as ISmartWallet;

  if (self.totalTrades > 0) {
    // Your existing predicted success rate calculation
    const memePerformanceWeight = 0.35;
    const generalWinRateWeight = 0.25;
    const patternSuccessWeight = 0.20;
    const timeframeAlignmentWeight = 0.10;
    const entryTimingWeight = 0.10;
    
    const memePerformanceScore = self.memeTokenMetrics?.returns4xRate || 0;
    
    const patternScores = self.patternMetrics?.map((p: IPatternMetrics) => p.successRate) || [];
    const patternSuccessScore = patternScores.length > 0 
      ? patternScores.reduce((sum: number, score: number) => sum + score, 0) / patternScores.length 
      : 0;
    
    const targetFastPreference = 60;
    const targetSlowPreference = 40;
    const fastDiff = Math.abs((self.memeTokenMetrics?.fastTimeframePreference || 50) - targetFastPreference);
    const slowDiff = Math.abs((self.memeTokenMetrics?.slowTimeframePreference || 50) - targetSlowPreference);
    const timeframeAlignmentScore = 100 - ((fastDiff + slowDiff) / 2);
    
    const entryTimingScore = self.memeTokenMetrics?.avgEntryTiming || 0;
    
    self.predictedSuccessRate = (
      (memePerformanceScore * memePerformanceWeight) +
      (self.winRate * generalWinRateWeight) +
      (patternSuccessScore * patternSuccessWeight) +
      (timeframeAlignmentScore * timeframeAlignmentWeight) +
      (entryTimingScore * entryTimingWeight)
    );
    
    const minSampleSize = 30;
    const sampleSizeFactor = Math.min(1, self.totalTrades / minSampleSize);
    const recentActivityFactor = self.isActive ? 1 : 0.7;
    self.confidenceScore = self.predictedSuccessRate * sampleSizeFactor * recentActivityFactor;
    
    // Tier confidence calculation
    if (self.tierMetrics) {
      const tierExpectedPerformance = self.tierMetrics.tier === 1 ? 85 : 
                                     self.tierMetrics.tier === 2 ? 70 : 55;
      const performanceAlignment = 100 - Math.abs(self.predictedSuccessRate - tierExpectedPerformance);
      const historicalDataFactor = Math.min(1, self.tierMetrics.historical_trade_count / 50);
      
      self.tierMetrics.tier_confidence_score = performanceAlignment * historicalDataFactor;
      self.tierMetrics.tier_last_updated = new Date();
    }
  }
  next();
});

// Create model (UNCHANGED)
const SmartWallet: ISmartWalletModel = mongoose.models.SmartWallet as ISmartWalletModel ||
  mongoose.model<ISmartWallet>('SmartWallet', SmartWalletSchema) as ISmartWalletModel;

export default SmartWallet;

// =============================================================================
// ENHANCED SEED SCRIPT - INTEGRATES WITH YOUR EXISTING MODEL
// src/scripts/seed-smart-wallets.ts - REPLACE YOUR EXISTING FILE WITH THIS
// =============================================================================

import { config } from '../config/app-config';

// ===== 55-WALLET DATASET MAPPED TO YOUR SCHEMA =====
const THORP_SMART_WALLETS = [
  // ===== TIER 1: PREMIUM WALLETS (10 wallets, 5x weight) =====
  {
    address: "RFSqPtn1JfavGiUD4HJsZyYXvZsycxf31hnYfbyG6iB",
    network: "solana",
    category: ["early-mover", "premium-trader"],
    labels: ["thorp-tier-1", "premium"],
    
    // Core metrics mapped from our data
    winRate: 0.995,  // four_x_success_rate
    totalPnL: 6316657,
    successfulTrades: 199,  // trade_count * four_x_success_rate
    totalTrades: 200,
    memeTokenTrades: 200,
    
    // Time-related
    avgHoldTime: "2-4 hours",
    firstSeen: new Date('2024-10-01'),
    lastActive: new Date('2025-04-04T16:36:24-07:00'),
    isActive: true,
    
    // Meme token metrics
    memeTokenMetrics: {
      returns4xRate: 0.995,
      avgEntryTiming: 95,  // Very early entry
      avgExitEfficiency: 90,
      memeTokenWinRate: 0.995,
      memeTokenAvgMultiplier: 199.11,
      fastTimeframePreference: 85,
      slowTimeframePreference: 15
    },
    
    // Tier system
    tierMetrics: {
      tier: 1 as const,
      weight_multiplier: 5.0,
      priority: 'premium' as const,
      ens_name: 'early mover',
      historical_trade_count: 200,
      historical_avg_roi: 19910.99,
      historical_total_pnl: 6316657,
      historical_avg_pnl_per_trade: 31583.29,
      days_before_data_pull: 17.0,
      data_source_date: new Date('2025-04-22'),
      tier_confidence_score: 95,
      tier_last_updated: new Date()
    },
    
    // Enhanced metadata
    metadata: {
      preferredTokens: ["meme-coins", "solana-tokens"],
      tradingFrequency: "High",
      primaryStrategies: ["early-entry", "momentum-trading"],
      riskProfile: 'aggressive' as const,
      targetTokenTypes: ["meme", "new-launches"]
    }
  },
  // ... (Continue with remaining 54 wallets - I'll provide structure for next batch)
];

// ===== ENHANCED SEEDING FUNCTION =====
async function seedSmartWallets() {
  try {
    console.log('🚀 Starting Thorp Smart Wallet Upload...');
    
    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing wallets
    await SmartWallet.deleteMany({});
    console.log('🧹 Cleared existing smart wallets');
    
    // Insert wallets in batches
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < THORP_SMART_WALLETS.length; i += batchSize) {
      const batch = THORP_SMART_WALLETS.slice(i, i + batchSize);
      await SmartWallet.insertMany(batch);
      insertedCount += batch.length;
      console.log(`📦 Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(THORP_SMART_WALLETS.length/batchSize)} (${insertedCount} wallets)`);
    }
    
    // Verify upload with tier distribution
    const tierDistribution = await SmartWallet.getTierDistribution();
    console.log('📊 Upload Summary:');
    tierDistribution.forEach((tier: any) => {
      const tierName = tier._id === 1 ? 'Premium' : tier._id === 2 ? 'Solid' : 'Monitor';
      console.log(`   Tier ${tier._id} (${tierName}): ${tier.count} wallets | Avg Weight: ${tier.avgWeight.toFixed(1)}`);
    });
    
    console.log(`✅ Successfully seeded ${insertedCount} smart wallets with tier system!`);
    
  } catch (error) {
    console.error('❌ Smart wallet upload failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// ===== EXECUTION =====
if (require.main === module) {
  seedSmartWallets().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}

export { seedSmartWallets, THORP_SMART_WALLETS };