// src/services/wallet-import.service.ts
import path from 'path';
import { ExternalWallet, WalletPerformanceHistory } from '../models';
import { logger } from '../utils/logger';
import { walletMetrics } from './wallet-metrics';
import { ImportedWalletData, WalletDataValidationResult, MemeTokenMetrics } from '../types/wallet-types';

export class WalletImportService {
  /**
   * Maximum number of retry attempts for a wallet import
   */
  private readonly MAX_RETRIES = 3;
  
  /**
   * Process wallet data and import into database
   * @param data Array of wallet data objects
   * @returns Object with success and error counts
   */
  public async importWalletData(data: any[]): Promise<{ success: number, errors: number, retries: number }> {
    let successCount = 0;
    let errorCount = 0;
    let retryCount = 0;
    
    logger.info(`Processing ${data.length} wallet records`);
    
    // Track failed wallets for retry
    const failedWallets: { data: any, attempts: number }[] = [];
    
    for (const row of data) {
      try {
        // Validate the data first
        const validation = this.validateWalletData(row);
        if (!validation.isValid) {
          logger.warn(`Validation failed for wallet ${row.address || 'unknown'}: ${validation.errors.join(', ')}`);
          errorCount++;
          continue;
        }
        
        // Process the wallet
        await this.processWallet(row);
        successCount++;
      } catch (error) {
        logger.error(`Error processing wallet ${row.address}: ${error instanceof Error ? error.message : String(error)}`);
        failedWallets.push({ data: row, attempts: 1 });
        errorCount++;
      }
    }
    
    // Retry failed wallets
    if (failedWallets.length > 0) {
      logger.info(`Retrying ${failedWallets.length} failed wallets...`);
      
      for (let i = 0; i < failedWallets.length; i++) {
        const { data: row, attempts } = failedWallets[i];
        
        if (attempts < this.MAX_RETRIES) {
          try {
            // Exponential backoff - wait longer for each retry
            const backoffMs = Math.pow(2, attempts) * 1000;
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            
            logger.info(`Retry attempt ${attempts} for wallet ${row.address}`);
            await this.processWallet(row);
            
            // Success! Remove from failed list, update counts
            successCount++;
            errorCount--;
            retryCount++;
            failedWallets.splice(i, 1);
            i--; // Adjust index since we removed an item
          } catch (error) {
            logger.error(`Retry ${attempts} failed for wallet ${row.address}: ${error instanceof Error ? error.message : String(error)}`);
            failedWallets[i].attempts++;
          }
        }
      }
    }
    
    return { success: successCount, errors: errorCount, retries: retryCount };
  }
  
  /**
   * Validate wallet data before processing
   */
  private validateWalletData(data: any): WalletDataValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!data.address) {
      errors.push('Missing required field: address');
    } else if (!/^[A-Za-z0-9]{32,44}$/.test(data.address)) {
      errors.push('Invalid address format');
    }
    
    // Numeric fields validation
    const numericFields = [
      'successRate', 'totalTrades', 'profitableTrades', 'returns4xRate',
      'fastTimeframePreference', 'slowTimeframePreference'
    ];
    
    for (const field of numericFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const value = parseFloat(data[field]);
        if (isNaN(value)) {
          errors.push(`Invalid numeric value for ${field}: ${data[field]}`);
        }
      }
    }
    
    // Date fields validation
    const dateFields = ['lastActivity'];
    for (const field of dateFields) {
      if (data[field] && isNaN(Date.parse(data[field]))) {
        errors.push(`Invalid date format for ${field}: ${data[field]}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Process a single wallet record
   */
  private async processWallet(row: any): Promise<void> {
    // Calculate specialized metrics for 74-76% success target
    const predictedSuccessRate = walletMetrics.calculatePredictedSuccessRate(row);
    const confidenceScore = walletMetrics.calculateConfidenceScore(row);
    const patternMetrics = walletMetrics.parsePatternMetrics(row);
    
    // Set up meme token metrics
    const memeTokenMetrics: MemeTokenMetrics = {
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
            tags: walletMetrics.parseArrayField(row.tags, existingWallet.tags),
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
              targetedTimeframes: walletMetrics.parseArrayField(row.targetedTimeframes, existingWallet.metadata?.targetedTimeframes),
              primaryStrategies: walletMetrics.parseArrayField(row.primaryStrategies, existingWallet.metadata?.primaryStrategies),
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
        tags: walletMetrics.parseArrayField(row.tags),
        category: row.category,
        performance: {
          successRate: parseFloat(row.successRate) || 0,
          totalTrades: parseInt(row.totalTrades) || 0,
          profitableTrades: parseInt(row.profitableTrades) || 0,
          averageReturn: parseFloat(row.averageReturn) || 0,
          biggestWin: parseFloat(row.biggestWin) || 0,
          biggestLoss: parseFloat(row.biggestLoss) || 0
        },
        knownTokens: walletMetrics.parseArrayField(row.knownTokens),
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
          targetedTimeframes: walletMetrics.parseArrayField(row.targetedTimeframes),
          primaryStrategies: walletMetrics.parseArrayField(row.primaryStrategies),
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
          recentTokens: walletMetrics.parseArrayField(row.recentTokens)
        });
        
        await historyRecord.save();
      }
    }
  }
}

export const walletImport = new WalletImportService();