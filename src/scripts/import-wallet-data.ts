/**
 * Enhanced Wallet Data Importer Tool
 * 
 * This script imports wallet data from CSV/Excel files into the database,
 * with special focus on metrics for 74-76% success rate with 4x returns.
 * 
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

/**
 * Calculate predicted success rate with focus on 74-76% target
 * 
 * This function uses weighted metrics to predict likelihood of achieving
 * the target 74-76% success rate with 4x returns
 */
function calculatePredictedSuccessRate(data: any): number {
  // Factors most relevant for targeting 74-76% success rate with 4x returns
  const memePerformanceWeight = 0.35;   // Meme token specific performance
  const generalWinRateWeight = 0.25;    // Overall win rate
  const patternSuccessWeight = 0.20;    // Success with specific patterns
  const timeframeAlignmentWeight = 0.10; // Match with target timeframes
  const entryTimingWeight = 0.10;       // Early entry ability
  
  // Extract or default the values
  const memePerformanceScore = parseFloat(data.returns4xRate) || 0;
  const generalWinRate = parseFloat(data.successRate) || 0;
  
  // Pattern success - calculate from pattern metrics if available
  let patternSuccessScore = 0;
  if (data.patternMetrics) {
    try {
      const patterns = typeof data.patternMetrics === 'string' 
        ? JSON.parse(data.patternMetrics) 
        : data.patternMetrics;
      
      if (Array.isArray(patterns) && patterns.length > 0) {
        patternSuccessScore = patterns.reduce((sum, p) => sum + (p.successRate || 0), 0) / patterns.length;
      }
    } catch (e) {
      // If parsing fails, leave patternSuccessScore as 0
      logger.warn(`Failed to parse pattern metrics for wallet ${data.address}`);
    }
  }
  
  // Timeframe alignment (how well the wallet's preference matches target timeframes)
  const targetFastPreference = 60; // Prefer fast patterns slightly more for meme coins
  const targetSlowPreference = 40;
  const fastPref = parseFloat(data.fastTimeframePreference) || 50;
  const slowPref = parseFloat(data.slowTimeframePreference) || 50;
  const fastDiff = Math.abs(fastPref - targetFastPreference);
  const slowDiff = Math.abs(slowPref - targetSlowPreference);
  const timeframeAlignmentScore = 100 - ((fastDiff + slowDiff) / 2);
  
  // Entry timing score - how early they typically get in
  const entryTimingScore = parseFloat(data.avgEntryTiming) || 0;
  
  // Calculate the weighted score
  return (
    (memePerformanceScore * memePerformanceWeight) +
    (generalWinRate * generalWinRateWeight) +
    (patternSuccessScore * patternSuccessWeight) +
    (timeframeAlignmentScore * timeframeAlignmentWeight) +
    (entryTimingScore * entryTimingWeight)
  );
}

/**
 * Calculate confidence score based on data quality and sample size
 */
function calculateConfidenceScore(data: any): number {
  const predictedRate = calculatePredictedSuccessRate(data);
  
  // Account for sample size - more trades = more confidence
  const totalTrades = parseInt(data.totalTrades) || 0;
  const minSampleSize = 30; // Minimum trades for full confidence
  const sampleSizeFactor = Math.min(1, totalTrades / minSampleSize);
  
  // Account for recency - more recent activity = more confidence
  const lastActivity = data.lastActivity ? new Date(data.lastActivity) : new Date();
  const daysSinceActivity = (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0.5, 1 - (daysSinceActivity / 90)); // Reduce confidence for wallets inactive over 90 days
  
  // Account for data completeness
  const dataCompleteness = 
    (data.successRate ? 0.3 : 0) +
    (data.returns4xRate ? 0.3 : 0) +
    (data.avgEntryTiming ? 0.2 : 0) +
    (data.patternMetrics ? 0.2 : 0);
  
  return predictedRate * sampleSizeFactor * recencyFactor * (0.5 + 0.5 * dataCompleteness);
}

/**
 * Parse pattern metrics from various input formats
 */
function parsePatternMetrics(data: any): any[] {
  if (!data.patternMetrics) return [];
  
  try {
    // If it's a string, try to parse as JSON
    if (typeof data.patternMetrics === 'string') {
      return JSON.parse(data.patternMetrics);
    }
    
    // If it's already an array, use it directly
    if (Array.isArray(data.patternMetrics)) {
      return data.patternMetrics;
    }
    
    // If it's individual columns like pattern1Success, pattern1Type, etc.
    const patterns = [];
    for (let i = 1; i <= 5; i++) { // Support up to 5 patterns
      const typeKey = `pattern${i}Type`;
      const successKey = `pattern${i}Success`;
      
      if (data[typeKey] && data[successKey]) {
        patterns.push({
          patternType: data[typeKey],
          successRate: parseFloat(data[successKey]),
          avgMultiplier: parseFloat(data[`pattern${i}Multiplier`]) || 0,
          avgHoldTime: parseFloat(data[`pattern${i}HoldTime`]) || 0,
          sampleSize: parseInt(data[`pattern${i}SampleSize`]) || 0,
          lastUpdated: new Date()
        });
      }
    }
    return patterns;
  } catch (e) {
    logger.warn(`Failed to parse pattern metrics: ${e}`);
    return [];
  }
}

/**
 * Parse array data from string format (comma separated)
 */
function parseArrayField(value: any, defaultValue: any[] = []): any[] {
  if (!value) return defaultValue;
  
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  
  if (Array.isArray(value)) {
    return value;
  }
  
  return defaultValue;
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
      
      // Calculate specialized metrics for 74-76% success target
      const predictedSuccessRate = calculatePredictedSuccessRate(row);
      const confidenceScore = calculateConfidenceScore(row);
      const patternMetrics = parsePatternMetrics(row);
      
      // Set up meme token metrics
      const memeTokenMetrics = {
        returns4xRate: parseFloat(row.returns4xRate) || 0,
        avgEntryTiming: parseFloat(row.avgEntryTiming) || 0,
        avgExitEfficiency: parseFloat(row.avgExitEfficiency) || 0,
        memeTokenWinRate: parseFloat(row.memeTokenWinRate) || 0,
        memeTokenAvgMultiplier: parseFloat(row.memeTokenAvgMultiplier) || 0,
        fastTimeframePreference: parseFloat(row.fastTimeframePreference) || 50,
        slowTimeframePreference: parseFloat(row.slowTimeframePreference) || 50,
        highVolatilitySuccess: parseFloat(row.highVolatilitySuccess) || 0
      };
      
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
              tags: parseArrayField(row.tags, existingWallet.tags),
              category: row.category || existingWallet.category,
              performance: {
                successRate: parseFloat(row.successRate) || existingWallet.performance?.successRate,
                totalTrades: parseInt(row.totalTrades) || existingWallet.performance?.totalTrades,
                profitableTrades: parseInt(row.profitableTrades) || existingWallet.performance?.profitableTrades,
                averageReturn: parseFloat(row.averageReturn) || existingWallet.performance?.averageReturn,
                biggestWin: parseFloat(row.biggestWin) || existingWallet.performance?.biggestWin,
                biggestLoss: parseFloat(row.biggestLoss) || existingWallet.performance?.biggestLoss
              },
              followersCount: parseInt(row.followers) || existingWallet.followersCount,
              riskScore: parseFloat(row.riskScore) || existingWallet.riskScore,
              trustScore: parseFloat(row.trustScore) || existingWallet.trustScore,
              lastUpdated: new Date(),
              metadataVersion: existingWallet.metadataVersion + 1,
              
              // Enhanced metrics for 74-76% success rate with 4x returns
              predictedSuccessRate: predictedSuccessRate,
              confidenceScore: confidenceScore,
              patternMetrics: patternMetrics.length > 0 ? patternMetrics : existingWallet.patternMetrics,
              memeTokenMetrics: memeTokenMetrics,
              
              // Additional metadata
              metadata: {
                ...existingWallet.metadata,
                achieves4xScore: parseFloat(row.achieves4xScore) || existingWallet.metadata?.achieves4xScore || 0,
                targetedTimeframes: parseArrayField(row.targetedTimeframes, existingWallet.metadata?.targetedTimeframes),
                primaryStrategies: parseArrayField(row.primaryStrategies, existingWallet.metadata?.primaryStrategies),
                importSource: path.basename(process.argv[2]),
                lastImport: new Date()
              }
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
          tags: parseArrayField(row.tags),
          category: row.category,
          performance: {
            successRate: parseFloat(row.successRate) || 0,
            totalTrades: parseInt(row.totalTrades) || 0,
            profitableTrades: parseInt(row.profitableTrades) || 0,
            averageReturn: parseFloat(row.averageReturn) || 0,
            biggestWin: parseFloat(row.biggestWin) || 0,
            biggestLoss: parseFloat(row.biggestLoss) || 0
          },
          knownTokens: parseArrayField(row.knownTokens),
          lastActivity: row.lastActivity ? new Date(row.lastActivity) : new Date(),
          followersCount: parseInt(row.followers) || 0,
          riskScore: parseFloat(row.riskScore) || 0,
          trustScore: parseFloat(row.trustScore) || 0,
          
          // Enhanced metrics for 74-76% success rate with 4x returns
          predictedSuccessRate: predictedSuccessRate,
          confidenceScore: confidenceScore,
          patternMetrics: patternMetrics,
          memeTokenMetrics: memeTokenMetrics,
          
          lastUpdated: new Date(),
          metadataVersion: 1,
          
          // Additional metadata
          metadata: {
            achieves4xScore: parseFloat(row.achieves4xScore) || 0,
            targetedTimeframes: parseArrayField(row.targetedTimeframes),
            primaryStrategies: parseArrayField(row.primaryStrategies),
            importSource: path.basename(process.argv[2]),
            importDate: new Date()
          }
        });
        
        await newWallet.save();
        
        // Create initial performance record
        if (row.successRate || row.totalTrades) {
          const historyRecord = new WalletPerformanceHistory({
            walletAddress: row.address,
            date: new Date(),
            successRate: parseFloat(row.successRate) || 0,
            totalTrades: parseInt(row.totalTrades) || 0,
            profitableTrades: parseInt(row.profitableTrades) || 0,
            averageReturn: parseFloat(row.averageReturn) || 0,
            returns4xRate: parseFloat(row.returns4xRate) || 0,
            confidenceScore: confidenceScore,
            recentTokens: parseArrayField(row.recentTokens)
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