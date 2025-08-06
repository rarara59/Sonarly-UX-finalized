// src/scripts/upload-all-55-wallets.ts
import mongoose from 'mongoose';
import SmartWallet from '../models/smartWallet';
import { config } from '../config/app-config';
import * as fs from 'fs';
import Papa from 'papaparse';

// All 55 target wallets with tier info
const WALLET_TIERS: Record<string, { tier: number; weight: number; priority: string }> = {
  // Tier 1: Premium (10 wallets, 5x weight)
  "RFSqPtn1JfavGiUD4HJsZyYXvZsycxf31hnYfbyG6iB": { tier: 1, weight: 5.0, priority: 'premium' },
  "215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP": { tier: 1, weight: 5.0, priority: 'premium' },
  "Ay9wnuZCRTceZJuRpGZnuwYZuWdsviM4cMiCwFoSQiPH": { tier: 1, weight: 5.0, priority: 'premium' },
  "Ehqd8q5rAN8V7Y7EGxYm3Tp4KPQMTVWQtzjSSPP3Upg3": { tier: 1, weight: 5.0, priority: 'premium' },
  "6kbwsSY4hL6WVadLRLnWV2irkMN2AvFZVAS8McKJmAtJ": { tier: 1, weight: 5.0, priority: 'premium' },
  "BZmxuXQ68QeZABbDFSzveHyrXCv5EG6Ut1ATw5qZgm2Q": { tier: 1, weight: 5.0, priority: 'premium' },
  "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm": { tier: 1, weight: 5.0, priority: 'premium' },
  "DfMxre4cKmvogbLrPigxmibVTTQDuzjdXojWzjCXXhzj": { tier: 1, weight: 5.0, priority: 'premium' },
  "FRa5xvWrvgYBHEukozdhJPCJRuJZcTn2WKj2u6L75Rmj": { tier: 1, weight: 5.0, priority: 'premium' },
  "8VZec6dMJhsAh7iPkdUoDqPtge35yn22xibonAqAEhMZ": { tier: 1, weight: 5.0, priority: 'premium' },
  
  // Tier 2: Solid (25 wallets, 3x weight)
  "9SkBXVd7egJTDdD4AGgKHUPCGADXoqxq5tbF3Efh5cNQ": { tier: 2, weight: 3.0, priority: 'solid' },
  "mW4PZB45isHmnjGkLpJvjKBzVS5NXzTJ8UDyug4gTsM": { tier: 2, weight: 3.0, priority: 'solid' },
  "HAN61KQbgzjDBC4RpZJ1ET8v32S4zdKAjoD7EApJ96q6": { tier: 2, weight: 3.0, priority: 'solid' },
  "7byPJ1nArieYopH1sR32BirQvEiA7hBNN5CPPPyzHDWC": { tier: 2, weight: 3.0, priority: 'solid' },
  "3kebnKw7cPdSkLRfiMEALyZJGZ4wdiSRvmoN4rD1yPzV": { tier: 2, weight: 3.0, priority: 'solid' },
  "BC8yiFFQWFEKrEEj75zYsuK3ZDCfv6QEeMRif9oZZ9TW": { tier: 2, weight: 3.0, priority: 'solid' },
  "Fj7sRd1dUmiXEVdZq8hhyA7uQKnTUKZZXPpVGYi2tAri": { tier: 2, weight: 3.0, priority: 'solid' },
  "FbBba8W8EgHVkiQHKr5WFL689uohUdQcH5UZA3FasiK8": { tier: 2, weight: 3.0, priority: 'solid' },
  "3daLWaPMpiw42nVGFS6pCBXECR7hEz4ThAEFvvcsggts": { tier: 2, weight: 3.0, priority: 'solid' },
  "CWvdyvKHEu8Z6QqGraJT3sLPyp9bJfFhoXcxUYRKC8ou": { tier: 2, weight: 3.0, priority: 'solid' },
  "2iCmwtaM14u5XijJ6Wx6pbxSqvvPbvzUVXAhk1B4aEtr": { tier: 2, weight: 3.0, priority: 'solid' },
  "KANYEsXAntLxYUE6GtPJ5CahFGpEbaSbd5xhNFYbvq3": { tier: 2, weight: 3.0, priority: 'solid' },
  "CU35ZDB4JptaBVQWiq1gZsR8kso6dz1bQj8uR3xGn2kK": { tier: 2, weight: 3.0, priority: 'solid' },
  "9yYya3F5EJoLnBNKW6z4bZvyQytMXzDcpU5D6yYr4jqL": { tier: 2, weight: 3.0, priority: 'solid' },
  "ECMvT4GQ59aWQVidtzarfvSr7vaZZUnvi1SvaurmtLRD": { tier: 2, weight: 3.0, priority: 'solid' },
  "4fxpWbsubzCYqHvQFtAGETa4zqm1PZeqq8TVUCUnhmeJ": { tier: 2, weight: 3.0, priority: 'solid' },
  "BR1VVREkrcUvrNGjSYGgy1zcN13dR6rX57AbSqgAY1xQ": { tier: 2, weight: 3.0, priority: 'solid' },
  "2ssNnQ777XH4JZktYq6dh6bcMz5xdwP89pzTLPpEPkzK": { tier: 2, weight: 3.0, priority: 'solid' },
  "57JMxCescrFBvb8bqjNwHPM9J7wPF12SV5KJa82HCd9B": { tier: 2, weight: 3.0, priority: 'solid' },
  "dVs7zZksjFuq73xbtUC62brFXYYuxCuPSG4wZeGiHck": { tier: 2, weight: 3.0, priority: 'solid' },
  "8zFZHuSRuDpuAR7J6FzwyF3vKNx4CVW3DFHJerQhc7Zd": { tier: 2, weight: 3.0, priority: 'solid' },
  "FyNrn5ELHtimjCscVqRK11Q59VaH3knzahtcaPpcmSro": { tier: 2, weight: 3.0, priority: 'solid' },
  "EU39HgkBDMZXYfYmGp7Kj1mqCDaUpdhXvCnSMrvACCr7": { tier: 2, weight: 3.0, priority: 'solid' },
  "Bpk7VVctpzXYx4BuPnZzs3VSSAWSAQJVq9VufFAq5p6b": { tier: 2, weight: 3.0, priority: 'solid' },
  "5TuiERc4X7EgZTxNmj8PHgzUAfNHZRLYHKp4DuiWevXv": { tier: 2, weight: 3.0, priority: 'solid' },
  
  // Tier 3: Monitor (20 wallets, 1x weight)
  "4t2bx5bqSL22xoNAh12eQNSfRbTt9AymK471TgchBst8": { tier: 3, weight: 1.0, priority: 'monitor' },
  "6MyPAg7CBDXJ6MW1odLEv1C7PbKmwi2BTvF1pA9d8Svj": { tier: 3, weight: 1.0, priority: 'monitor' },
  "7UkAiqXg5PNYrtjNDSgjRMEuXRaYkc5eePBvepGxLRrG": { tier: 3, weight: 1.0, priority: 'monitor' },
  "3nptjNHuusLfyduYekcXS3143FTmPsWhqFidGBZYbUpf": { tier: 3, weight: 1.0, priority: 'monitor' },
  "6m5sW6EAPAHncxnzapi1ZVJNRb9RZHQ3Bj7FD84X9rAF": { tier: 3, weight: 1.0, priority: 'monitor' },
  "5mtbmPwj2SMkxPP9c93s9oD9bmMdByTqepNarM9Y7u7e": { tier: 3, weight: 1.0, priority: 'monitor' },
  "72e6QM7gn9MH5u1YpgQbduexm4WAon1cnsSXPqKnLQec": { tier: 3, weight: 1.0, priority: 'monitor' },
  "Efqoo7tUd9bhrA8kEZ6YhtBbo2mhr6VLAKzQEsBTyUsk": { tier: 3, weight: 1.0, priority: 'monitor' },
  "J3ABW43nGVrY9jv3imVn79axjUyLErjRZUKCqwjAdXQr": { tier: 3, weight: 1.0, priority: 'monitor' },
  "H3hkk4iFeoiLP1nXxPDA1QSdx6xzQPSSZ3VgdYCJXKBm": { tier: 3, weight: 1.0, priority: 'monitor' },
  "8zh211LRYxP9fWyJKLVuEAjQck8hFWnW4SjGV32Rx6Jm": { tier: 3, weight: 1.0, priority: 'monitor' },
  "8sGi4W7ZQCDMgzA17eF57voRUveXyT4XPA8WTsj6HLT8": { tier: 3, weight: 1.0, priority: 'monitor' },
  "G3K9kWBDUmtnxypFZSzZDdMS9d8GWnZUrbsvobSJkwVG": { tier: 3, weight: 1.0, priority: 'monitor' },
  "6Ry3qYJt2WrMTfBdwVBNNDz4yqstqpaqr7Ko6BhWB2tD": { tier: 3, weight: 1.0, priority: 'monitor' },
  "CNudZYFgpbT26fidsiNrWfHeGTBMMeVWqruZXsEkcUPc": { tier: 3, weight: 1.0, priority: 'monitor' },
  "CcTMq5wKfCPtXtxb5fscsX55fc6UrksvdT4mpoCAhKkk": { tier: 3, weight: 1.0, priority: 'monitor' },
  "HS8BjVNAT4m36hLnD3GZvc74Y8iMVkx7pYhiMSDv1pWm": { tier: 3, weight: 1.0, priority: 'monitor' },
  "65jT5wk8FQyUWcSjgBsBRLU5NiSYGVYwRSKRiopPNAQ3": { tier: 3, weight: 1.0, priority: 'monitor' },
  "H7WkwWrQWTLNJfJhqjNV2DGM6hXxmvSBv7vEchQKa1ys": { tier: 3, weight: 1.0, priority: 'monitor' },
  "33kcDpJizLykZNBAMusicTqxAMSW1inMsmzHN1vE4JRh": { tier: 3, weight: 1.0, priority: 'monitor' }
};

interface TradeRecord {
  tokenname: string;
  token_id: string;
  wallet: string;
  wallet_ens_name: string;
  pnl: number;
  roi: number;
  avgentry: number;
  avgexit: number;
  start_period: string;
}

async function loadAndProcessCSV(): Promise<Record<string, TradeRecord[]>> {
  console.log('📁 Loading CSV data...');
  
  const csvData = fs.readFileSync('./data/hello_world.csv', 'utf8');
  const parsed = Papa.parse(csvData, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  console.log(`📊 Loaded ${parsed.data.length} total trades from CSV`);

  // Filter for target wallets only
  const targetWallets = Object.keys(WALLET_TIERS);
  const filteredData = (parsed.data as TradeRecord[]).filter(row => 
    targetWallets.includes(row.wallet)
  );

  console.log(`🎯 Found ${filteredData.length} trades for target wallets`);

  // Group by wallet
  const walletGroups: Record<string, TradeRecord[]> = {};
  filteredData.forEach(trade => {
    if (!walletGroups[trade.wallet]) {
      walletGroups[trade.wallet] = [];
    }
    walletGroups[trade.wallet].push(trade);
  });

  console.log(`📈 Processed ${Object.keys(walletGroups).length} unique wallets`);
  return walletGroups;
}

function calculateWalletMetrics(trades: TradeRecord[]) {
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const avgROI = trades.reduce((sum, t) => sum + t.roi, 0) / trades.length;
  const avgEntry = trades.reduce((sum, t) => sum + t.avgentry, 0) / trades.length;
  const avgExit = trades.reduce((sum, t) => sum + t.avgexit, 0) / trades.length;
  const successfulTrades = trades.filter(t => t.pnl > 0).length;
  const winRate = successfulTrades / trades.length;
  const returns4xRate = trades.filter(t => t.roi >= 400).length / trades.length;
  
  return {
    totalTrades: trades.length,
    successfulTrades,
    totalPnL,
    avgROI,
    avgEntry,
    avgExit,
    winRate,
    returns4xRate,
    avgPnLPerTrade: totalPnL / trades.length,
    memeTokenAvgMultiplier: avgROI / 100
  };
}

function createWalletObject(address: string, trades: TradeRecord[]) {
  const tierInfo = WALLET_TIERS[address];
  const metrics = calculateWalletMetrics(trades);
  const ensName = trades[0].wallet_ens_name;

  // Determine category based on ENS name and performance
  const categories = [];
  if (ensName.includes('early')) categories.push('early-mover');
  if (ensName.includes('gem')) categories.push('gem-spotter');
  if (ensName.includes('sniper')) categories.push('sniper');
  if (categories.length === 0) categories.push('trader');

  // Add tier-based categories
  if (tierInfo.tier === 1) categories.push('premium-trader');
  if (tierInfo.tier === 2) categories.push('solid-performer', 'consistent-trader');
  if (tierInfo.tier === 3) categories.push('monitor', 'emerging-trader');

  return {
    address,
    network: "solana",
    category: categories,
    labels: [`thorp-tier-${tierInfo.tier}`, tierInfo.priority],
    winRate: Math.round(metrics.winRate * 1000) / 1000,
    totalPnL: Math.round(metrics.totalPnL),
    successfulTrades: metrics.successfulTrades,
    totalTrades: metrics.totalTrades,
    memeTokenTrades: metrics.totalTrades,
    avgHoldTime: tierInfo.tier === 1 ? "2-4 hours" : tierInfo.tier === 2 ? "4-8 hours" : "8-24 hours",
    firstSeen: new Date('2024-08-01'),
    lastActive: new Date('2025-04-22'),
    isActive: true,
    memeTokenMetrics: {
      returns4xRate: Math.round(metrics.returns4xRate * 1000) / 1000,
      avgEntryTiming: 85.0 + (tierInfo.tier === 1 ? 10 : tierInfo.tier === 2 ? 0 : -15),
      avgExitEfficiency: 80.0 + (tierInfo.tier === 1 ? 10 : tierInfo.tier === 2 ? 5 : -10),
      memeTokenWinRate: Math.round(metrics.winRate * 1000) / 1000,
      memeTokenAvgMultiplier: Math.round(metrics.memeTokenAvgMultiplier * 100) / 100,
      fastTimeframePreference: 60.0 + (tierInfo.tier === 1 ? 25 : tierInfo.tier === 2 ? 15 : 0),
      slowTimeframePreference: 40.0 - (tierInfo.tier === 1 ? 25 : tierInfo.tier === 2 ? 15 : 0)
    },
    tierMetrics: {
      tier: tierInfo.tier,
      weight_multiplier: tierInfo.weight,
      priority: tierInfo.priority,
      ens_name: ensName,
      historical_trade_count: metrics.totalTrades,
      historical_avg_roi: Math.round(metrics.avgROI * 100) / 100,
      historical_total_pnl: Math.round(metrics.totalPnL),
      historical_avg_pnl_per_trade: Math.round(metrics.avgPnLPerTrade),
      days_before_data_pull: 17.0,
      data_source_date: new Date('2025-04-22'),
      tier_confidence_score: 80.0 + (tierInfo.tier === 1 ? 15 : tierInfo.tier === 2 ? 10 : -5),
      tier_last_updated: new Date()
    },
    metadata: {
      preferredTokens: tierInfo.tier === 1 ? ["meme-coins", "solana-tokens"] : 
                      tierInfo.tier === 2 ? ["meme-coins", "established-tokens"] : ["various-tokens"],
      tradingFrequency: tierInfo.tier === 1 ? "High" : tierInfo.tier === 2 ? "Medium" : "Low",
      primaryStrategies: ["early-entry"],
      riskProfile: tierInfo.tier === 1 ? 'aggressive' : tierInfo.tier === 2 ? 'moderate' : 'conservative',
      targetTokenTypes: tierInfo.tier === 1 ? ["meme", "new-launches"] : 
                        tierInfo.tier === 2 ? ["meme", "trending"] : ["established", "safe-bets"]
    }
  };
}

async function uploadWallets() {
  try {
    console.log('🚀 Starting upload of 55 smart wallets with real CSV data...');
    
    // Load and process CSV data
    const walletTradeData = await loadAndProcessCSV();
    
    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing wallets
    await SmartWallet.deleteMany({});
    console.log('🧹 Cleared existing smart wallets');
    
    // Create wallet objects
    const wallets = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const [address, tierInfo] of Object.entries(WALLET_TIERS)) {
      const trades = walletTradeData[address];
      
      if (trades && trades.length > 0) {
        const walletObj = createWalletObject(address, trades);
        wallets.push(walletObj);
        processedCount++;
        
        console.log(`✅ ${address.slice(0, 8)}... (${tierInfo.priority}, ${trades.length} trades)`);
      } else {
        console.log(`⚠️  ${address.slice(0, 8)}... (${tierInfo.priority}) - No trades found in CSV`);
        skippedCount++;
      }
    }
    
    // Insert wallets
    if (wallets.length > 0) {
      await SmartWallet.insertMany(wallets);
      console.log(`✅ Inserted ${wallets.length} wallets`);
    }
    
    // Summary
    const tier1Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 1 });
    const tier2Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 2 });
    const tier3Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 3 });
    const totalWallets = await SmartWallet.countDocuments();
    
    console.log('\n📊 UPLOAD SUMMARY:');
    console.log(`   Total target wallets: 55`);
    console.log(`   Processed successfully: ${processedCount}`);
    console.log(`   Skipped (no CSV data): ${skippedCount}`); 
    console.log(`   Final database count: ${totalWallets}`);
    console.log(`   Tier 1 (Premium): ${tier1Count} wallets`);
    console.log(`   Tier 2 (Solid): ${tier2Count} wallets`);
    console.log(`   Tier 3 (Monitor): ${tier3Count} wallets`);
    
    // Calculate theoretical tier power
    const tier1Weight = tier1Count * 5.0;
    const tier2Weight = tier2Count * 3.0;
    const tier3Weight = tier3Count * 1.0;
    const totalWeight = tier1Weight + tier2Weight + tier3Weight;
    
    console.log('\n🎯 TIER POWER ANALYSIS:');
    console.log(`   Tier 1 Power: ${tier1Weight} (${((tier1Weight/totalWeight)*100).toFixed(1)}%)`);
    console.log(`   Tier 2 Power: ${tier2Weight} (${((tier2Weight/totalWeight)*100).toFixed(1)}%)`);
    console.log(`   Tier 3 Power: ${tier3Weight} (${((tier3Weight/totalWeight)*100).toFixed(1)}%)`);
    console.log(`   Total Weight: ${totalWeight}`);
    
    console.log('\n🎉 Ready for maximum tier power in token analysis!');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

uploadWallets();