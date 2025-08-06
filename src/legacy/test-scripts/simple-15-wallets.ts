// src/scripts/simple-15-wallets.ts
import mongoose from 'mongoose';
import SmartWallet from '../models/smartWallet';
import { config } from '../config/app-config';

const WALLETS = [
  {
    address: "RFSqPtn1JfavGiUD4HJsZyYXvZsycxf31hnYfbyG6iB",
    network: "solana",
    category: ["early-mover", "premium-trader"],
    labels: ["thorp-tier-1", "premium"],
    winRate: 0.995,
    totalPnL: 6316657,
    successfulTrades: 199,
    totalTrades: 200,
    memeTokenTrades: 200,
    avgHoldTime: "2-4 hours",
    firstSeen: new Date('2024-10-01'),
    lastActive: new Date('2025-04-04T23:36:24.000Z'),
    isActive: true,
    memeTokenMetrics: {
      returns4xRate: 0.995,
      avgEntryTiming: 94.2,
      avgExitEfficiency: 91.5,
      memeTokenWinRate: 0.995,
      memeTokenAvgMultiplier: 199.11,
      fastTimeframePreference: 88.7,
      slowTimeframePreference: 11.3
    },
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
      tier_confidence_score: 96.3,
      tier_last_updated: new Date()
    },
    metadata: {
      preferredTokens: ["meme-coins", "solana-tokens"],
      tradingFrequency: "High",
      primaryStrategies: ["early-entry", "high-conviction"],
      riskProfile: 'aggressive' as const,
      targetTokenTypes: ["meme", "new-launches"]
    }
  },
  {
    address: "215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP",
    network: "solana",
    category: ["early-mover", "premium-trader"],
    labels: ["thorp-tier-1", "premium"],
    winRate: 1.0,
    totalPnL: 4853267,
    successfulTrades: 188,
    totalTrades: 188,
    memeTokenTrades: 188,
    avgHoldTime: "2-4 hours",
    firstSeen: new Date('2024-10-01'),
    lastActive: new Date('2025-04-04T23:29:23.000Z'),
    isActive: true,
    memeTokenMetrics: {
      returns4xRate: 1.0,
      avgEntryTiming: 93.8,
      avgExitEfficiency: 89.2,
      memeTokenWinRate: 1.0,
      memeTokenAvgMultiplier: 324.58,
      fastTimeframePreference: 91.4,
      slowTimeframePreference: 8.6
    },
    tierMetrics: {
      tier: 1 as const,
      weight_multiplier: 5.0,
      priority: 'premium' as const,
      ens_name: 'early mover',
      historical_trade_count: 188,
      historical_avg_roi: 32457.83,
      historical_total_pnl: 4853267,
      historical_avg_pnl_per_trade: 25812.59,
      days_before_data_pull: 17.0,
      data_source_date: new Date('2025-04-22'),
      tier_confidence_score: 98.1,
      tier_last_updated: new Date()
    },
    metadata: {
      preferredTokens: ["meme-coins", "solana-tokens"],
      tradingFrequency: "High",
      primaryStrategies: ["early-entry", "high-conviction"],
      riskProfile: 'aggressive' as const,
      targetTokenTypes: ["meme", "new-launches"]
    }
  },
  {
    address: "9SkBXVd7egJTDdD4AGgKHUPCGADXoqxq5tbF3Efh5cNQ",
    network: "solana",
    category: ["solid-performer", "consistent-trader"],
    labels: ["thorp-tier-2", "solid"],
    winRate: 0.974,
    totalPnL: 759399,
    successfulTrades: 37,
    totalTrades: 38,
    memeTokenTrades: 38,
    avgHoldTime: "4-8 hours",
    firstSeen: new Date('2024-09-01'),
    lastActive: new Date('2025-04-03T05:14:19.000Z'),
    isActive: true,
    memeTokenMetrics: {
      returns4xRate: 0.974,
      avgEntryTiming: 78.3,
      avgExitEfficiency: 82.7,
      memeTokenWinRate: 0.974,
      memeTokenAvgMultiplier: 229.81,
      fastTimeframePreference: 72.1,
      slowTimeframePreference: 27.9
    },
    tierMetrics: {
      tier: 2 as const,
      weight_multiplier: 3.0,
      priority: 'solid' as const,
      ens_name: 'early mover',
      historical_trade_count: 38,
      historical_avg_roi: 22980.69,
      historical_total_pnl: 759399,
      historical_avg_pnl_per_trade: 19984.18,
      days_before_data_pull: 18.8,
      data_source_date: new Date('2025-04-22'),
      tier_confidence_score: 85.2,
      tier_last_updated: new Date()
    },
    metadata: {
      preferredTokens: ["meme-coins", "established-tokens"],
      tradingFrequency: "Medium",
      primaryStrategies: ["early-entry"],
      riskProfile: 'moderate' as const,
      targetTokenTypes: ["meme", "trending"]
    }
  },
  {
    address: "4t2bx5bqSL22xoNAh12eQNSfRbTt9AymK471TgchBst8",
    network: "solana",
    category: ["monitor", "emerging-trader"],
    labels: ["thorp-tier-3", "monitor"],
    winRate: 1.0,
    totalPnL: 950223,
    successfulTrades: 17,
    totalTrades: 17,
    memeTokenTrades: 17,
    avgHoldTime: "8-24 hours",
    firstSeen: new Date('2024-08-01'),
    lastActive: new Date('2025-04-04T12:16:26.000Z'),
    isActive: true,
    memeTokenMetrics: {
      returns4xRate: 1.0,
      avgEntryTiming: 62.4,
      avgExitEfficiency: 68.9,
      memeTokenWinRate: 1.0,
      memeTokenAvgMultiplier: 266.8,
      fastTimeframePreference: 55.7,
      slowTimeframePreference: 44.3
    },
    tierMetrics: {
      tier: 3 as const,
      weight_multiplier: 1.0,
      priority: 'monitor' as const,
      ens_name: 'early mover',
      historical_trade_count: 17,
      historical_avg_roi: 26681.09,
      historical_total_pnl: 950223,
      historical_avg_pnl_per_trade: 55895.47,
      days_before_data_pull: 17.5,
      data_source_date: new Date('2025-04-22'),
      tier_confidence_score: 71.8,
      tier_last_updated: new Date()
    },
    metadata: {
      preferredTokens: ["various-tokens"],
      tradingFrequency: "Low",
      primaryStrategies: ["early-entry"],
      riskProfile: 'conservative' as const,
      targetTokenTypes: ["established", "safe-bets"]
    }
  }
];

async function uploadWallets() {
  try {
    console.log(`🚀 Starting upload of ${WALLETS.length} smart wallets...`);
    
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');
    
    await SmartWallet.deleteMany({});
    console.log('🧹 Cleared existing smart wallets');
    
    await SmartWallet.insertMany(WALLETS);
    console.log(`✅ Inserted ${WALLETS.length} wallets`);
    
    const totalWallets = await SmartWallet.countDocuments();
    const tier1Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 1 });
    const tier2Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 2 });
    const tier3Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 3 });
    
    console.log('📊 Upload Summary:');
    console.log(`   Total wallets: ${totalWallets}`);
    console.log(`   Tier 1: ${tier1Count} wallets`);
    console.log(`   Tier 2: ${tier2Count} wallets`); 
    console.log(`   Tier 3: ${tier3Count} wallets`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

uploadWallets();