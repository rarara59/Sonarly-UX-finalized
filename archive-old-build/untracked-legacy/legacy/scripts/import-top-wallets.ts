// src/scripts/import-top-wallets.ts
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import ExternalWallet from '../models/externalWallet';

// Load environment variables
config();

// Simple console logger (avoiding the problematic logger)
const log = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error || '')
};

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp');
    log.info('Connected to MongoDB');
    return true;
  } catch (error) {
    log.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// Read and parse CSV file
function readCSV(filePath: string): any[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    return records;
  } catch (error) {
    log.error('Failed to read CSV file:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a path to the CSV file: npx ts-node src/scripts/import-top-wallets.ts data/top_wallets.csv');
      process.exit(1);
    }
    
    const filePath = path.resolve(args[0]);
    log.info(`Starting import from CSV file: ${filePath}`);
    
    // Connect to MongoDB
    const mongoConnected = await connectToMongoDB();
    if (!mongoConnected) {
      process.exit(1);
    }
    
    // Read CSV data
    const wallets = readCSV(filePath);
    log.info(`Read ${wallets.length} wallets from CSV file`);
    
    // Import each wallet
    let successCount = 0;
    let errorCount = 0;
    
    for (const walletData of wallets) {
      try {
        // Check if wallet already exists
        const existingWallet = await ExternalWallet.findOne({ address: walletData.address });
        
        if (existingWallet) {
          log.info(`Updating existing wallet: ${walletData.address}`);
          
          // Update existing wallet
          existingWallet.category = walletData.category;
          existingWallet.winRate = parseFloat(walletData.success_rate);
          existingWallet.totalTrades = parseInt(walletData.total_trades);
          existingWallet.successfulTrades = parseInt(walletData.successful_trades);
          existingWallet.lastUpdated = new Date();
          
          // Update metadata if it exists
          if (existingWallet.metadata) {
            existingWallet.metadata.achieves4xScore = parseFloat(walletData.four_x_rate);
          } else {
            // Create basic metadata if it doesn't exist
            existingWallet.metadata = {
              preferredTokens: [],
              tradingFrequency: 'Medium',
              lastActiveTimestamp: new Date(),
              achieves4xScore: parseFloat(walletData.four_x_rate)
            };
          }
          
          await existingWallet.save();
          successCount++;
        } else {
          log.info(`Creating new wallet: ${walletData.address}`);
          
          // Create new wallet
          const newWallet = new ExternalWallet({
            address: walletData.address,
            network: 'solana',
            label: walletData.wallet_name || `Wallet ${walletData.address.slice(0, 8)}`,
            category: walletData.category || 'Unknown',
            winRate: parseFloat(walletData.success_rate),
            totalPnL: parseFloat(walletData.total_pnl || '0'),
            successfulTrades: parseInt(walletData.successful_trades),
            totalTrades: parseInt(walletData.total_trades),
            avgHoldTime: '24h 0m', // Default placeholder
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastActivity: new Date(),
            isActive: true,
            reputationScore: 0, // Will be calculated by pre-save hook
            transactions: [], // We don't have transaction details here
            metadata: {
              preferredTokens: [],
              tradingFrequency: 'Medium',
              lastActiveTimestamp: new Date(),
              achieves4xScore: parseFloat(walletData.four_x_rate)
            }
          });
          
          await newWallet.save();
          successCount++;
        }
      } catch (error) {
        log.error(`Error processing wallet ${walletData.address}:`, error);
        errorCount++;
      }
    }
    
    log.info(`Import completed with ${successCount} successes and ${errorCount} errors`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    log.info('Disconnected from MongoDB');
  } catch (error) {
    log.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the script
main();