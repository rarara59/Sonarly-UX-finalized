// src/scripts/import-from-sqlite.ts
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import { logger } from '../utils/logger';
import ExternalWallet from '../models/externalWallet'; // Direct import from model file
import WalletPerformanceHistory from '../models/walletPerformanceHistory'; // Direct import
import { ImportedWalletData } from '../types/wallet-types';

// Load environment variables
config();

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp');
    logger.info('Connected to MongoDB');
    return true;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// Open SQLite database
async function openSQLiteDB(dbPath: string) {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    logger.info(`Connected to SQLite database: ${dbPath}`);
    return db;
  } catch (error) {
    logger.error('Failed to open SQLite database:', error);
    throw error;
  }
}

// Calculate success rate from transaction data
function calculateSuccessRate(transactions: any[]): number {
  if (transactions.length === 0) return 0;
  
  const successfulTrades = transactions.filter(tx => tx.pnl > 0).length;
  return (successfulTrades / transactions.length) * 100;
}

// Calculate average hold time from transactions
function calculateAvgHoldTime(transactions: any[]): string {
  if (transactions.length === 0) return '0h 0m';
  
  // In a real implementation, you would calculate this from transaction timestamps
  // For now, we'll return a placeholder
  return '24h 0m';
}

// Calculate 4x return rate
function calculate4xRate(transactions: any[]): number {
  if (transactions.length === 0) return 0;
  
  const fourXTrades = transactions.filter(tx => tx.roi >= 4).length;
  return (fourXTrades / transactions.length) * 100;
}

// Process wallet data and import to MongoDB directly
// This bypasses the wallet-import.service.ts to avoid import issues
async function processAndImportWalletData(walletDataList: ImportedWalletData[]) {
  let successCount = 0;
  let errorCount = 0;
  let retryCount = 0;
  
  logger.info(`Processing ${walletDataList.length} wallet records`);
  
  for (const data of walletDataList) {
    try {
      // Check if wallet already exists
      const existingWallet = await ExternalWallet.findOne({ address: data.address });
      
      if (existingWallet) {
        logger.info(`Updating existing wallet: ${data.address}`);
        
        // Update existing wallet
        existingWallet.category = data.category || existingWallet.category;
        existingWallet.winRate = parseFloat(data.successRate?.toString() || '0') || existingWallet.winRate;
        existingWallet.totalPnL = parseFloat(data.totalPnL?.toString() || '0') || existingWallet.totalPnL;
        existingWallet.successfulTrades = parseInt(data.profitableTrades?.toString() || '0') || existingWallet.successfulTrades;
        existingWallet.totalTrades = parseInt(data.totalTrades?.toString() || '0') || existingWallet.totalTrades;
        existingWallet.avgHoldTime = data.avgHoldTime || existingWallet.avgHoldTime;
        existingWallet.lastUpdated = new Date();
        
        // Add 4x metrics if available
        if (data.returns4xRate) {
          if (!existingWallet.metadata) existingWallet.metadata = {};
          existingWallet.metadata.achieves4xScore = parseFloat(data.returns4xRate.toString());
        }
        
        // Save the updated wallet
        await existingWallet.save();
        successCount++;
      } else {
        logger.info(`Creating new wallet: ${data.address}`);
        
        // Create new wallet
        const newWallet = new ExternalWallet({
          address: data.address,
          network: 'solana',
          category: data.category || 'Unknown',
          winRate: parseFloat(data.successRate?.toString() || '0'),
          totalPnL: parseFloat(data.totalPnL?.toString() || '0'),
          successfulTrades: parseInt(data.profitableTrades?.toString() || '0'),
          totalTrades: parseInt(data.totalTrades?.toString() || '0'),
          avgHoldTime: data.avgHoldTime || '',
          firstSeen: new Date(),
          lastUpdated: new Date(),
          lastActivity: data.lastActivity ? new Date(data.lastActivity) : new Date(),
          isActive: true,
          
          // Initialize metadata
          metadata: {
            preferredTokens: data.knownTokens ? data.knownTokens.toString().split(',').map(t => t.trim()) : [],
            achieves4xScore: parseFloat(data.returns4xRate?.toString() || '0'),
            tradingFrequency: 'Medium',
            lastActiveTimestamp: new Date()
          }
        });
        
        await newWallet.save();
        
        // Create performance history record if available
        if (data.successRate || data.totalTrades) {
          try {
            const historyRecord = new WalletPerformanceHistory({
              walletAddress: data.address,
              date: new Date(),
              successRate: parseFloat(data.successRate?.toString() || '0'),
              totalTrades: parseInt(data.totalTrades?.toString() || '0'),
              profitableTrades: parseInt(data.profitableTrades?.toString() || '0'),
              returns4xRate: parseFloat(data.returns4xRate?.toString() || '0')
            });
            
            await historyRecord.save();
          } catch (historyError) {
            logger.warn(`Could not save history record for ${data.address}: ${historyError}`);
          }
        }
        
        successCount++;
      }
    } catch (error) {
      logger.error(`Error processing wallet ${data.address}: ${error instanceof Error ? error.message : String(error)}`);
      errorCount++;
    }
  }
  
  return { success: successCount, errors: errorCount, retries: retryCount };
}

// Main function
async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a path to the SQLite database: npx ts-node src/scripts/import-from-sqlite.ts data/hello.db');
      process.exit(1);
    }
    
    const dbPath = path.resolve(args[0]);
    logger.info(`Starting import from SQLite database: ${dbPath}`);
    
    // Connect to MongoDB
    const mongoConnected = await connectToMongoDB();
    if (!mongoConnected) {
      process.exit(1);
    }
    
    // Open SQLite database
    const db = await openSQLiteDB(dbPath);
    
    // Get all wallets
    const wallets = await db.all('SELECT * FROM WALLET');
    logger.info(`Found ${wallets.length} wallets in SQLite database`);
    
    // Prepare data for import
    const walletDataForImport: ImportedWalletData[] = [];
    
    // Process each wallet
    for (const wallet of wallets) {
      // Get all transactions for this wallet
      const transactions = await db.all(
        `SELECT t.*, token.tokenname 
         FROM TRANSACTION t 
         JOIN TOKEN token ON t.token_id = token.token_id 
         WHERE t.wallet = ?`, 
        [wallet.wallet]
      );
      
      // Skip wallets with no transactions
      if (transactions.length === 0) continue;
      
      // Calculate wallet metrics
      const totalPnL = transactions.reduce((sum, tx) => sum + tx.pnl, 0);
      const successRate = calculateSuccessRate(transactions);
      const avgHoldTime = calculateAvgHoldTime(transactions);
      const returns4xRate = calculate4xRate(transactions);
      
      // Count transactions in different timeframes
      // This is a placeholder - you'd need to calculate this based on actual transaction data
      const fastTimeframeCount = Math.floor(transactions.length * 0.4); // 40% fast
      const slowTimeframeCount = transactions.length - fastTimeframeCount;
      
      // Create wallet data object
      const walletData: ImportedWalletData = {
        address: wallet.wallet,
        label: wallet.wallet_ens_name || 'Imported from SQLite',
        category: returns4xRate > 50 ? 'Gem Spotter' : 
                  (fastTimeframeCount > slowTimeframeCount ? 'Sniper' : 'Early Mover'),
        
        // Performance metrics
        successRate: successRate,
        totalTrades: transactions.length,
        profitableTrades: transactions.filter(tx => tx.pnl > 0).length,
        totalPnL: totalPnL,
        avgHoldTime: avgHoldTime,
        
        // Enhanced 4x metrics
        returns4xRate: returns4xRate,
        avgEntryTiming: 75, // Placeholder - would need actual data
        avgExitEfficiency: 70, // Placeholder - would need actual data
        
        // Timeframe preferences
        fastTimeframePreference: (fastTimeframeCount / transactions.length) * 100,
        slowTimeframePreference: (slowTimeframeCount / transactions.length) * 100,
        
        // Known tokens
        knownTokens: [...new Set(transactions.map(tx => tx.tokenname))].join(','),
        
        // Last activity
        lastActivity: new Date().toISOString() // Placeholder - would use most recent transaction date
      };
      
      walletDataForImport.push(walletData);
    }
    
    logger.info(`Prepared ${walletDataForImport.length} wallets for import`);
    
    // Import data directly with our custom function (bypassing the service)
    const result = await processAndImportWalletData(walletDataForImport);
    
    logger.info(`Import completed with:
- ${result.success} successful imports
- ${result.errors} errors
- ${result.retries} successful retries`);
    
    // Close the database
    await db.close();
    logger.info('Closed SQLite database');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the script
main();