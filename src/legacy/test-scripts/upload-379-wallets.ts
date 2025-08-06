// src/scripts/upload-379-wallets.ts

console.log('=== SCRIPT STARTED ===');

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

import mongoose from 'mongoose';
import SmartWallet from '../models/smartWallet';
import { config } from '../config/app-config';
import * as fs from 'fs';
import Papa from 'papaparse';

interface WalletCSVRow {
  wallet_address: string;
  final_assigned_tier: string;
  num_4x_trades: number;
  avg_roi: number;
  early_entry_score: number;
  hold_score: number;
}

function mapTierData(tierStr: string) {
  if (tierStr === "Tier 1") return { tier: 1, weight: 5.0, priority: "premium" };
  if (tierStr === "Tier 2") return { tier: 2, weight: 3.0, priority: "solid" };
  return { tier: 3, weight: 1.0, priority: "monitor" };
}

async function uploadWallets() {
  console.log('=== SCRIPT STARTED ===');
  try {
    const csvData = fs.readFileSync('./data/Final_Master_Wallet_List_with_Explicit_Tiering.csv', 'utf8');
    const parsed = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    const rows: WalletCSVRow[] = parsed.data as WalletCSVRow[];

    await mongoose.connect(config.database.uri);
    console.log('Connected to MongoDB');
    console.log('Deleting old wallets...');
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('deleteMany timeout')), 10000)
    );
    await Promise.race([SmartWallet.deleteMany({}), timeout]);
    console.log('Deleted old wallets');

    const wallets = rows.map(row => {
      const { wallet_address, final_assigned_tier, num_4x_trades, avg_roi, early_entry_score, hold_score } = row;
      const tierInfo = mapTierData(final_assigned_tier);

      return {
        address: wallet_address,
        network: "solana",
        category: ["trader"],
        labels: [`thorp-tier-${tierInfo.tier}`, tierInfo.priority],
        winRate: null,
        totalPnL: null,
        successfulTrades: null,
        totalTrades: null,
        memeTokenTrades: null,
        avgHoldTime: tierInfo.tier === 1 ? "2-4 hours" : tierInfo.tier === 2 ? "4-8 hours" : "8-24 hours",
        firstSeen: new Date('2024-08-01'),
        lastActive: new Date('2025-04-22'),
        isActive: true,
        memeTokenMetrics: {
          returns4xRate: null,
          avgEntryTiming: early_entry_score,
          avgExitEfficiency: hold_score,
          memeTokenWinRate: null,
          memeTokenAvgMultiplier: avg_roi / 100,
          fastTimeframePreference: tierInfo.tier === 1 ? 85 : tierInfo.tier === 2 ? 75 : 60,
          slowTimeframePreference: tierInfo.tier === 1 ? 15 : tierInfo.tier === 2 ? 25 : 40
        },
        tierMetrics: {
          tier: tierInfo.tier,
          weight_multiplier: tierInfo.weight,
          priority: tierInfo.priority,
          ens_name: null,
          historical_trade_count: null,
          historical_avg_roi: avg_roi,
          historical_total_pnl: null,
          historical_avg_pnl_per_trade: null,
          days_before_data_pull: 17.0,
          data_source_date: new Date('2025-04-22'),
          tier_confidence_score: tierInfo.tier === 1 ? 95.0 : tierInfo.tier === 2 ? 90.0 : 75.0,
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
    });

    await SmartWallet.insertMany(wallets);

    const tier1Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 1 });
    const tier2Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 2 });
    const tier3Count = await SmartWallet.countDocuments({ 'tierMetrics.tier': 3 });

    const tier1Weight = tier1Count * 5.0;
    const tier2Weight = tier2Count * 3.0;
    const tier3Weight = tier3Count * 1.0;
    const totalWeight = tier1Weight + tier2Weight + tier3Weight;

    console.log('UPLOAD SUMMARY');
    console.log(`Tier 1: ${tier1Count} wallets`);
    console.log(`Tier 2: ${tier2Count} wallets`);
    console.log(`Tier 3: ${tier3Count} wallets`);
    console.log('TIER POWER');
    console.log(`Tier 1 Power: ${tier1Weight} (${((tier1Weight / totalWeight) * 100).toFixed(1)}%)`);
    console.log(`Tier 2 Power: ${tier2Weight} (${((tier2Weight / totalWeight) * 100).toFixed(1)}%)`);
    console.log(`Tier 3 Power: ${tier3Weight} (${((tier3Weight / totalWeight) * 100).toFixed(1)}%)`);
    console.log(`Total Tier Power: ${totalWeight}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Upload failed', err);
    process.exit(1);
  }
}

uploadWallets();