/**
 * External Wallet Data Importer Tool
 * 
 * This script imports wallet data from CSV/Excel files into the database.
 * Usage: ts-node src/scripts/import-wallet-data.ts path/to/data.xlsx
 */

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import winston from 'winston';
import { ExternalWallet, WalletPerformanceHistory } from '../models'; // Import your models

// Load environment variables
config();

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'wallet-import.log' })
  ]
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp');
    logger.info('Connected to MongoDB');
    return true;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// Parse file extension and read file
function readDataFile(filePath: string): any[] {
  const extension = path.extname(filePath).toLowerCase();
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const workbook = XLSX.readFile(filePath, { 
    cellDates: true, 
    cellNF: false, 
    cellText: false 
  });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  return XLSX.utils.sheet_to_json(worksheet);
}

// Process wallet data and import into database
async function importWalletData(data: any[]): Promise<{ success: number, errors: number }> {
  let successCount = 0;
  let errorCount = 0;
  
  logger.info(`Processing ${data.length} wallet records`);
  
  for (const row of data) {
    try {
      // Validate required fields
      if (!row.address) {
        logger.warn('Skipping row without address');
        errorCount++;
        continue;
      }
      
      // Check if wallet already exists
      const existingWallet = await ExternalWallet.findOne({ address: row.address });
      
      if (existingWallet) {
        logger.info(`Updating existing wallet: ${row.address}`);
        
        // Update existing wallet
        await ExternalWallet.updateOne(
          { address: row.address },
          {
            $set: {
              label: row.label || existingWallet.label,
              tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : existingWallet.tags,
              category: row.category || existingWallet.category,
              performance: {
                successRate: row.successRate || existingWallet.performance?.successRate,
                totalTrades: row.totalTrades || existingWallet.performance?.totalTrades,
                profitableTrades: row.profitableTrades || existingWallet.performance?.profitableTrades,
                averageReturn: row.averageReturn || existingWallet.performance?.averageReturn,
                biggestWin: row.biggestWin || existingWallet.performance?.biggestWin,
                biggestLoss: row.biggestLoss || existingWallet.performance?.biggestLoss
              },
              followersCount: row.followers || existingWallet.followersCount,
              riskScore: row.riskScore || existingWallet.riskScore,
              trustScore: row.trustScore || existingWallet.trustScore,
              lastUpdated: new Date(),
              metadataVersion: existingWallet.metadataVersion + 1
            }
          }
        );
      } else {
        logger.info(`Creating new wallet: ${row.address}`);
        
        // Create new wallet
        const newWallet = new ExternalWallet({
          address: row.address,
          source: 'import',
          externalId: row.externalId || `import-${Date.now()}`,
          label: row.label,
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          category: row.category,
          performance: {
            successRate: row.successRate,
            totalTrades: row.totalTrades,
            profitableTrades: row.profitableTrades,
            averageReturn: row.averageReturn,
            biggestWin: row.biggestWin,
            biggestLoss: row.biggestLoss
          },
          knownTokens: [],
          lastActivity: row.lastActivity ? new Date(row.lastActivity) : new Date(),
          followersCount: row.followers,
          riskScore: row.riskScore,
          trustScore: row.trustScore,
          lastUpdated: new Date(),
          metadataVersion: 1
        });
        
        await newWallet.save();
        
        // Create initial performance record
        if (row.successRate || row.totalTrades) {
          const historyRecord = new WalletPerformanceHistory({
            walletAddress: row.address,
            date: new Date(),
            successRate: row.successRate,
            totalTrades: row.totalTrades,
            profitableTrades: row.profitableTrades,
            averageReturn: row.averageReturn,
            recentTokens: []
          });
          
          await historyRecord.save();
        }
      }
      
      successCount++;
    } catch (error) {
      logger.error(`Error processing wallet ${row.address}:`, error);
      errorCount++;
    }
  }
  
  return { success: successCount, errors: errorCount };
}

// Main function
async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a file path: ts-node src/scripts/import-wallet-data.ts path/to/data.xlsx');
      process.exit(1);
    }
    
    const filePath = args[0];
    logger.info(`Starting import from file: ${filePath}`);
    
    // Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      process.exit(1);
    }
    
    // Read data file
    const data = readDataFile(filePath);
    logger.info(`Read ${data.length} records from file`);
    
    // Import data
    const result = await importWalletData(data);
    
    logger.info(`Import completed with ${result.success} successful imports and ${result.errors} errors`);
    
    // Disconnect from database
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the script
main();