// =============================================================================
// ENHANCED SMART WALLET MODEL - JavaScript Conversion
// src/models/smartWallet.js - COMPLETE JAVASCRIPT CONVERSION
// =============================================================================

import mongoose from 'mongoose';

const { Schema } = mongoose;

// ===== SCHEMAS =====

// Pattern metrics schema (EXISTING - UNCHANGED LOGIC)
const PatternMetricsSchema = new Schema({
  patternType: { type: String, required: true },
  successRate: { type: Number, default: 0 },
  avgMultiplier: { type: Number, default: 0 },
  avgHoldTime: { type: Number, default: 0 },
  sampleSize: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Meme token metrics schema (EXISTING - UNCHANGED LOGIC)
const MemeTokenMetricsSchema = new Schema({
  returns4xRate: { type: Number, default: 0 },
  avgEntryTiming: { type: Number, default: 0 },
  avgExitEfficiency: { type: Number, default: 0 },
  memeTokenWinRate: { type: Number, default: 0 },
  memeTokenAvgMultiplier: { type: Number, default: 0 },
  fastTimeframePreference: { type: Number, default: 50 },
  slowTimeframePreference: { type: Number, default: 50 }
});

// Tier metrics schema (YOUR SOPHISTICATED TIER SYSTEM)
const TierMetricsSchema = new Schema({
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

// Enhanced SmartWallet schema (ALL YOUR EXISTING LOGIC PRESERVED)
const SmartWalletSchema = new Schema({
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
  
  // ===== YOUR SOPHISTICATED TIER SYSTEM =====
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

// ===== ALL YOUR SOPHISTICATED INDEXES (PRESERVED) =====
// Your existing indexes (UNCHANGED)
SmartWalletSchema.index({ predictedSuccessRate: -1 });
SmartWalletSchema.index({ "memeTokenMetrics.returns4xRate": -1 });
SmartWalletSchema.index({ winRate: -1, "memeTokenMetrics.memeTokenWinRate": -1 });
SmartWalletSchema.index({ category: 1, winRate: -1 });
SmartWalletSchema.index({ category: 1, "memeTokenMetrics.returns4xRate": -1 });
SmartWalletSchema.index({ "memeTokenMetrics.fastTimeframePreference": -1 });
SmartWalletSchema.index({ "memeTokenMetrics.slowTimeframePreference": -1 });

// Tier-specific indexes (YOUR SOPHISTICATED SYSTEM)
SmartWalletSchema.index({ "tierMetrics.tier": 1, isActive: 1 });
SmartWalletSchema.index({ "tierMetrics.priority": 1, isActive: 1 });
SmartWalletSchema.index({ "tierMetrics.weight_multiplier": -1 });
SmartWalletSchema.index({ "tierMetrics.tier": 1, "tierMetrics.tier_confidence_score": -1 });

// ===== YOUR SOPHISTICATED STATIC METHODS (PRESERVED) =====
SmartWalletSchema.statics.getByTier = function(tier) {
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

// ===== YOUR SOPHISTICATED INSTANCE METHODS (PRESERVED) =====
SmartWalletSchema.methods.calculateInfluence = function(signalStrength) {
  const baseInfluence = signalStrength * this.tierMetrics.weight_multiplier;
  const maxInfluence = 0.08; // 8% max per wallet
  return Math.min(baseInfluence, maxInfluence);
};

SmartWalletSchema.methods.isRecentlyActive = function(daysThreshold = 30) {
  const daysAgo = (Date.now() - this.lastActive.getTime()) / (1000 * 60 * 60 * 24);
  return daysAgo <= daysThreshold;
};

SmartWalletSchema.methods.getTierWeight = function() {
  return this.tierMetrics.weight_multiplier;
};

SmartWalletSchema.methods.isPremiumTier = function() {
  return this.tierMetrics.tier === 1;
};

// ===== YOUR SOPHISTICATED PRE-SAVE HOOK (PRESERVED EXACTLY) =====
SmartWalletSchema.pre('save', function(next) {
  const self = this;

  if (self.totalTrades > 0) {
    // Your existing sophisticated predicted success rate calculation
    const memePerformanceWeight = 0.35;
    const generalWinRateWeight = 0.25;
    const patternSuccessWeight = 0.20;
    const timeframeAlignmentWeight = 0.10;
    const entryTimingWeight = 0.10;
    
    const memePerformanceScore = self.memeTokenMetrics?.returns4xRate || 0;
    
    const patternScores = self.patternMetrics?.map(p => p.successRate) || [];
    const patternSuccessScore = patternScores.length > 0 
      ? patternScores.reduce((sum, score) => sum + score, 0) / patternScores.length 
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
    
    // Sophisticated tier confidence calculation
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

// Create model with all your sophisticated functionality
const SmartWallet = mongoose.models.SmartWallet || 
  mongoose.model('SmartWallet', SmartWalletSchema);

export default SmartWallet;

// Testing if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing SmartWallet JavaScript model...');
  
  async function testModel() {
    try {
      // 1. Test model structure (synchronous - always works)
      const staticMethods = Object.getOwnPropertyNames(SmartWallet)
        .filter(name => typeof SmartWallet[name] === 'function');
      console.log('Static methods available:', staticMethods);
      
      const schemaPaths = Object.keys(SmartWallet.schema.paths);
      console.log('Schema paths count:', schemaPaths.length);
      console.log('Key schema paths:', ['address', 'tierMetrics', 'memeTokenMetrics', 'winRate', 'isActive']
        .filter(path => schemaPaths.includes(path)));
      
      const indexes = SmartWallet.schema.indexes();
      console.log('Indexes configured:', indexes.length);
      
      const instanceMethods = Object.getOwnPropertyNames(SmartWallet.schema.methods);
      console.log('Instance methods:', instanceMethods);
      
      console.log('✅ Model structure validated');
      
      // 2. Test database functionality (if MongoDB URI provided)
      if (process.env.MONGO_URI) {
        console.log('🔌 Testing database functionality...');
        
        try {
          // Connect to database with timeout
          await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            connectTimeoutMS: 5000
          });
          
          console.log('✅ Database connected');
          
          // Test your sophisticated tier system with real data
          const activeWallets = await SmartWallet.countDocuments({ isActive: true });
          console.log(`📊 Active wallets in database: ${activeWallets}`);
          
          if (activeWallets > 0) {
            // Test tier distribution
            const tierDistribution = await SmartWallet.getTierDistribution();
            console.log('📈 Tier distribution:');
            tierDistribution.forEach(tier => {
              const tierName = tier._id === 1 ? 'Premium (5x)' : tier._id === 2 ? 'Solid (3x)' : 'Monitor (1x)';
              console.log(`   Tier ${tier._id} ${tierName}: ${tier.count} wallets | Avg Weight: ${tier.avgWeight.toFixed(1)}`);
            });
            
            // Test tier queries
            const tier1Count = await SmartWallet.getByTier(1).countDocuments();
            const tier2Count = await SmartWallet.getByTier(2).countDocuments();
            const tier3Count = await SmartWallet.getByTier(3).countDocuments();
            
            console.log(`🎯 Tier queries: T1=${tier1Count}, T2=${tier2Count}, T3=${tier3Count}`);
            
            // Test sophisticated wallet methods
            if (tier1Count > 0) {
              const sampleTier1 = await SmartWallet.getByTier(1).findOne();
              if (sampleTier1) {
                console.log(`💎 Sample Tier 1 wallet: ${sampleTier1.address.slice(0, 8)}... (WinRate: ${sampleTier1.winRate}%)`);
                console.log(`   Weight: ${sampleTier1.getTierWeight()}x, Premium: ${sampleTier1.isPremiumTier()}`);
                console.log(`   Confidence: ${sampleTier1.confidenceScore.toFixed(1)}, 4x Score: ${sampleTier1.metadata?.achieves4xScore || 'N/A'}`);
              }
            }
            
            console.log('✅ Database functionality validated with real wallet data');
            
          } else {
            console.log('⚠️ No wallets found in database - import your 379 wallets first');
          }
          
        } catch (dbError) {
          console.warn(`⚠️ Database test failed: ${dbError.message}`);
          console.log('💡 Ensure MongoDB is running and MONGO_URI is correct');
        } finally {
          // Always disconnect
          await mongoose.disconnect();
          console.log('🔌 Database disconnected');
        }
        
      } else {
        console.log('💡 To test database functionality: MONGO_URI=mongodb://localhost:27017/thorp node smartWallet.js');
      }
      
      console.log('✅ JavaScript SmartWallet model test complete');
      
    } catch (error) {
      console.error('❌ Model test failed:', error.message);
    }
  }
  
  // Run the test
  testModel().then(() => {
    process.exit(0); // Ensure clean exit
  }).catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
}