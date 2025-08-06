// src/scripts/wallet-update-runner.ts
// Run with: npm run ts-node src/scripts/wallet-update-runner.ts

import * as fs from 'fs';
import * as Papa from 'papaparse';
import { connectToDatabase } from '../config/database';
import SmartWallet from '../models/smartWallet';
import { ISmartWallet } from '../models/smartWallet';
import { logger } from '../utils/logger';

interface CSVWalletData {
  wallet_address: string;
  previous_tier_v1: string;
  previous_tier_v2: string | null;
  final_assigned_tier: string;
  num_4x_trades: number;
  avg_roi: number;
  early_entry_score: number;
  hold_score: number;
}

// Configuration
const CSV_FILE_PATH = './Final_Master_Wallet_List_with_Explicit_Tiering.csv';

async function updateSmartWallets(): Promise<{
  success: boolean;
  totalInserted: number;
  finalCount: number;
  tierDistribution: Array<{ _id: string; count: number }>;
}> {
  
  try {
    logger.info('🚀 Starting smart wallet update process...');
    
    // 1. Connect to database using existing config
    await connectToDatabase();
    
    // 2. Read and parse CSV
    logger.info('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const parsedData = Papa.parse<CSVWalletData>(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    logger.info(`✅ Loaded ${parsedData.data.length} wallets from CSV`);
    
    // 3. Backup existing data
    logger.info('💾 Creating backup...');
    const backupCollectionName = `smart_wallets_backup_${Date.now()}`;
    const existingWallets = await SmartWallet.find({}).lean();
    
    if (existingWallets.length > 0) {
      const db = SmartWallet.db;
      await db.collection(backupCollectionName).insertMany(existingWallets);
      logger.info(`✅ Backed up ${existingWallets.length} wallets to ${backupCollectionName}`);
    }
    
    // 4. Clear existing wallets
    logger.info('🗑️ Clearing existing wallets...');
    const deleteResult = await SmartWallet.deleteMany({});
    logger.info(`✅ Deleted ${deleteResult.deletedCount} existing wallets`);
    
    // 5. Transform CSV data
    logger.info('🔄 Transforming data...');
    const transformedWallets: Partial<ISmartWallet>[] = parsedData.data.map((row: CSVWalletData) => {
      const now = new Date();
      const estimatedTotalTrades = Math.max(row.num_4x_trades * 2, 10);
      const successRate = row.num_4x_trades / estimatedTotalTrades;
      
      const tierMap: { [key: string]: string } = {
        'Tier 1': 'tier1',
        'Tier 2': 'tier2', 
        'Tier 3': 'tier3'
      };
      
      return {
        address: row.wallet_address,
        tier: tierMap[row.final_assigned_tier] || 'tier3',
        '4xTrades': row.num_4x_trades || 0,
        totalTrades: estimatedTotalTrades,
        avgROI: row.avg_roi > 1000 ? row.avg_roi / 10000 : row.avg_roi,
        lastActivity: now,
        entryTiming: {
          avgLagMinutes: Math.max(1, 15 - (row.early_entry_score || 0))
        },
        holdBehavior: {
          avgHoldHrs: Math.max(1, row.hold_score || 24),
          earlyExits: Math.floor(estimatedTotalTrades * 0.1)
        },
        isBlacklisted: false,
        achieves4xScore: Math.min(1.0, row.num_4x_trades / 10),
        earlyAdoptionScore: row.early_entry_score || 0,
        predictedSuccessRate: Math.min(0.95, Math.max(0.1, successRate)),
        confidenceScore: Math.min(0.95, Math.max(0.1, 
          (row.num_4x_trades / 15) + 
          Math.min(0.2, (row.early_entry_score || 0) / 100) +
          Math.min(0.1, (row.hold_score || 0) / 100)
        )),
        successfulTrades: row.num_4x_trades || 0,
        winRate: successRate * 100,
        isActive: true,
        isVerified: true,
        firstSeen: now,
        lastUpdated: now,
        
        // Metadata for tracking
        metadata: {
          previousTierV1: row.previous_tier_v1,
          previousTierV2: row.previous_tier_v2,
          importedAt: now,
          source: 'csv_import_v3'
        }
      };
    });
    
    // 6. Insert new wallets in batches
    logger.info('📥 Inserting new wallets...');
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < transformedWallets.length; i += batchSize) {
      const batch = transformedWallets.slice(i, i + batchSize);
      try {
        const result = await SmartWallet.insertMany(batch, { ordered: false });
        totalInserted += result.length;
        logger.info(`   Batch ${Math.floor(i/batchSize) + 1}: ${result.length} wallets`);
      } catch (error) {
        logger.error(`   ❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, error);
      }
    }
    
    // 7. Create indexes
    logger.info('🔍 Creating indexes...');
    await SmartWallet.createIndexes([
      { address: 1 },
      { tier: 1 },
      { '4xTrades': -1 },
      { predictedSuccessRate: -1 },
      { lastActivity: -1 }
    ]);
    
    // 8. Validate results
    logger.info('✅ Validating results...');
    const finalCount = await SmartWallet.countDocuments();
    const tierDistribution = await SmartWallet.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 } } }
    ]);
    
    logger.info(`\n📊 UPDATE SUMMARY:`);
    logger.info(`   Total wallets inserted: ${totalInserted}`);
    logger.info(`   Final count: ${finalCount}`);
    logger.info(`   Tier distribution:`);
    tierDistribution.forEach(tier => {
      logger.info(`      ${tier._id}: ${tier.count} wallets`);
    });
    
    // 9. Show sample wallets
    const sampleWallets = await SmartWallet.find({}).limit(3).lean();
    logger.info(`\n📋 Sample wallets:`);
    sampleWallets.forEach(wallet => {
      logger.info(`   ${wallet.address}: ${wallet.tier}, 4x trades: ${wallet['4xTrades']}`);
    });
    
    logger.info('\n🎉 Smart wallet update completed successfully!');
    
    return {
      success: true,
      totalInserted,
      finalCount,
      tierDistribution
    };
    
  } catch (error) {
    logger.error('❌ Error during wallet update:', error);
    throw error;
  }
}

// Export for use in other modules
export { updateSmartWallets };

// Allow running as standalone script
async function main() {
  try {
    await updateSmartWallets();
    logger.info('✅ Process completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Process failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}