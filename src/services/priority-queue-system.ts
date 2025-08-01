// Thorp V1 - Priority Queue System
// Manages transaction processing with multi-tier priority levels

import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import { EventEmitter } from 'events';
import { config } from '../legacy';

// Define priority tier type
type PriorityTier = 'high' | 'medium' | 'low';

// Processing configuration interface
interface ProcessingConfig {
  batchSize: number;
  interval: number;
  maxAttempts: number;
  retryDelay: number;
}

// Metrics interface
interface QueueMetrics {
  queued: Record<PriorityTier, number>;
  processed: Record<PriorityTier, number>;
  failed: Record<PriorityTier, number>;
  processing: Record<PriorityTier, number>;
}

// Transaction interface
interface ITransaction extends Document {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gas: string;
  input: string;
  timestamp: number;
  network: string;
  priority: number;
  priorityTier: PriorityTier;
  processed: boolean;
  processingAttempts: number;
  lastProcessingAttempt?: Date;
  processingComplete: boolean;
  processingResult?: any;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Queue status interface
interface QueueStatus {
  pending: Array<{
    _id: PriorityTier;
    count: number;
    avgPriority: number;
  }>;
  recentlyProcessed: number;
  recentlyFailed: number;
  processing: Record<PriorityTier, number>;
  currentRate: {
    processed: Record<PriorityTier, number>;
    failed: Record<PriorityTier, number>;
  };
}

// Transaction Schema
const transactionSchema = new Schema<ITransaction>({
  hash: { type: String, required: true, index: true },
  blockNumber: { type: Number, required: true, index: true },
  from: { type: String, required: true, index: true },
  to: { type: String, required: true, index: true },
  value: { type: String, required: true },
  gasPrice: { type: String, required: true },
  gas: { type: String, required: true },
  input: { type: String, required: true },
  timestamp: { type: Number, required: true, index: true },
  network: { type: String, required: true, index: true },
  // Priority Queue fields
  priority: { type: Number, default: 0, index: true }, // 0-100 score
  priorityTier: { type: String, enum: ['high', 'medium', 'low'], default: 'low', index: true },
  processed: { type: Boolean, default: false, index: true },
  processingAttempts: { type: Number, default: 0 },
  lastProcessingAttempt: { type: Date },
  processingComplete: { type: Boolean, default: false },
  processingResult: { type: Schema.Types.Mixed },
  processedAt: { type: Date }
}, { timestamps: true });

// Create model if it doesn't exist yet
const Transaction: Model<ITransaction> = mongoose.models.Transaction as Model<ITransaction> || 
  mongoose.model<ITransaction>('Transaction', transactionSchema);

class PriorityQueueSystem extends EventEmitter {
  private logger: winston.Logger;
  private processingConfig: Record<PriorityTier, ProcessingConfig>;
  private metrics: QueueMetrics;

  constructor() {
    super();
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'priority-queue-system' },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
    
    // Queue processing configuration
    this.processingConfig = {
      high: {
        batchSize: 50,
        interval: 5000, // 5 seconds
        maxAttempts: 5,
        retryDelay: 30000 // 30 seconds
      },
      medium: {
        batchSize: 100,
        interval: 15000, // 15 seconds
        maxAttempts: 3,
        retryDelay: 60000 // 1 minute
      },
      low: {
        batchSize: 200,
        interval: 30000, // 30 seconds
        maxAttempts: 2,
        retryDelay: 120000 // 2 minutes
      }
    };
    
    // Metrics
    this.metrics = {
      queued: { high: 0, medium: 0, low: 0 },
      processed: { high: 0, medium: 0, low: 0 },
      failed: { high: 0, medium: 0, low: 0 },
      processing: { high: 0, medium: 0, low: 0 }
    };
    
    // Start queue processors
    this.startProcessors();
    
    // Start metrics updater
    this.startMetricsUpdater();
  }
  
  // Calculate priority score for a transaction
  async calculatePriorityScore(transaction: Partial<ITransaction>): Promise<number> {
    let score = 0;
    
    // 1. Check if from address is a known smart wallet (using your existing wallet analysis)
    const isSmartWallet = await this.checkSmartWallet(transaction.from as string);
    if (isSmartWallet) {
      score += 30;
    }
    
    // 2. Value-based priority (higher value = higher priority)
    const valueInEth = parseInt(transaction.value as string) / 1e18;
    if (valueInEth > 10) {
      score += 20;
    } else if (valueInEth > 1) {
      score += 10;
    } else if (valueInEth > 0.1) {
      score += 5;
    }
    
    // 3. Gas price priority (higher gas = likely more important)
    const gasPriceGwei = parseInt(transaction.gasPrice as string) / 1e9;
    if (gasPriceGwei > 100) {
      score += 10;
    } else if (gasPriceGwei > 50) {
      score += 5;
    }
    
    // 4. Contract interaction priority
    if (transaction.input && transaction.input !== '0x') {
      // It's a contract interaction
      score += 15;
      
      // Known token contract or DEX interactions get higher priority
      if (await this.isKnownContract(transaction.to as string)) {
        score += 10;
      }
    }
    
    // 5. Recency factor (newer transactions get priority)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - (transaction.timestamp as number);
    if (timeDiff < 60) { // Less than a minute old
      score += 10;
    } else if (timeDiff < 300) { // Less than 5 minutes old
      score += 5;
    }
    
    return Math.min(100, score); // Cap at 100
  }
  
  // Determine priority tier based on score
  determinePriorityTier(score: number): PriorityTier {
    if (score >= 50) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }
  
  // Add transaction to priority queue
  async addTransaction(transaction: Partial<ITransaction>): Promise<{ 
    transaction: Partial<ITransaction>; 
    priorityScore: number; 
    priorityTier: PriorityTier 
  }> {
    try {
      // Calculate priority score
      const priorityScore = await this.calculatePriorityScore(transaction);
      const priorityTier = this.determinePriorityTier(priorityScore);
      
      // Update transaction with priority information
      transaction.priority = priorityScore;
      transaction.priorityTier = priorityTier;
      
      // Save to database
      const result = await Transaction.updateOne(
        { hash: transaction.hash }, 
        transaction as ITransaction,
        { upsert: true }
      );
      
      this.logger.debug(`Added transaction ${transaction.hash} to ${priorityTier} queue with priority ${priorityScore}`);
      
      // Update metrics
      this.metrics.queued[priorityTier]++;
      
      return { transaction, priorityScore, priorityTier };
    } catch (error) {
      this.logger.error('Error adding transaction to queue:', error);
      throw error;
    }
  }
  
  // Process transactions in batches by priority tier
  async processTransactionBatch(tier: PriorityTier): Promise<void> {
    const config = this.processingConfig[tier];
    this.metrics.processing[tier]++;
    
    try {
      // Find batch of unprocessed transactions in this tier
      const transactions = await Transaction.find({
        priorityTier: tier,
        processed: false,
        processingAttempts: { $lt: config.maxAttempts },
        $or: [
          { lastProcessingAttempt: { $exists: false } },
          { lastProcessingAttempt: { $lt: new Date(Date.now() - config.retryDelay) } }
        ]
      })
      .sort({ priority: -1, timestamp: -1 })
      .limit(config.batchSize);
      
      if (transactions.length === 0) {
        this.metrics.processing[tier]--;
        return;
      }
      
      this.logger.info(`Processing ${transactions.length} ${tier} priority transactions`);
      
      // Update processing status
      const transactionIds = transactions.map(t => t._id);
      await Transaction.updateMany(
        { _id: { $in: transactionIds } },
        { 
          $inc: { processingAttempts: 1 },
          $set: { lastProcessingAttempt: new Date() }
        }
      );
      
      // Process each transaction
      for (const transaction of transactions) {
        try {
          // Emit event for transaction processor to handle
          this.emit('processTransaction', transaction);
          
          // Mark as processed (your actual processing will happen in the event listener)
          await Transaction.updateOne(
            { _id: transaction._id },
            { 
              $set: { 
                processed: true,
                processingComplete: true,
                processedAt: new Date(),
                processingResult: { success: true }
              }
            }
          );
          
          this.metrics.processed[tier]++;
        } catch (error) {
          this.logger.error(`Error processing transaction ${transaction.hash}:`, error);
          
          // Update transaction with error
          await Transaction.updateOne(
            { _id: transaction._id },
            { 
              $set: { 
                processingResult: { 
                  success: false, 
                  error: error instanceof Error ? error.message : String(error)
                }
              }
            }
          );
          
          this.metrics.failed[tier]++;
        }
      }
    } catch (error) {
      this.logger.error(`Error in ${tier} queue processor:`, error);
    } finally {
      this.metrics.processing[tier]--;
    }
  }
  
  // Start queue processors for each tier
  startProcessors(): void {
    // Start high priority processor
    setInterval(() => {
      this.processTransactionBatch('high');
    }, this.processingConfig.high.interval);
    
    // Start medium priority processor
    setInterval(() => {
      this.processTransactionBatch('medium');
    }, this.processingConfig.medium.interval);
    
    // Start low priority processor
    setInterval(() => {
      this.processTransactionBatch('low');
    }, this.processingConfig.low.interval);
    
    this.logger.info('Transaction queue processors started');
  }
  
  // Start metrics updater to keep queue statistics current
  startMetricsUpdater(): void {
    setInterval(async () => {
      try {
        // Update queue counts
        const queueCounts = await Transaction.aggregate([
          { 
            $match: { 
              processed: false,
              processingAttempts: { 
                $lt: 5 // Max attempts across all tiers
              }
            } 
          },
          { 
            $group: { 
              _id: '$priorityTier', 
              count: { $sum: 1 } 
            } 
          }
        ]);
        
        // Reset queued metrics
        this.metrics.queued = { high: 0, medium: 0, low: 0 };
        
        // Update with current counts
        for (const result of queueCounts) {
          if (this.metrics.queued[result._id as PriorityTier] !== undefined) {
            this.metrics.queued[result._id as PriorityTier] = result.count;
          }
        }
        
        this.logger.debug('Queue metrics updated', this.metrics);
      } catch (error) {
        this.logger.error('Error updating queue metrics:', error);
      }
    }, 30000); // Every 30 seconds
  }
  
  // Get current queue metrics
  getMetrics(): QueueMetrics {
    return this.metrics;
  }
  
  // Get queue status
  async getQueueStatus(): Promise<QueueStatus> {
    // Get pending transactions by tier
    const pendingByTier = await Transaction.aggregate([
      { 
        $match: { 
          processed: false,
          processingAttempts: { $lt: 5 }
        } 
      },
      { 
        $group: { 
          _id: '$priorityTier', 
          count: { $sum: 1 },
          avgPriority: { $avg: '$priority' }
        } 
      }
    ]);
    
    // Get recently processed count
    const recentlyProcessed = await Transaction.countDocuments({
      processingComplete: true,
      processedAt: { $gt: new Date(Date.now() - 3600000) } // Last hour
    });
    
    // Get failed count
    const recentlyFailed = await Transaction.countDocuments({
      processed: true,
      processingComplete: false,
      processingAttempts: { $gte: 1 },
      lastProcessingAttempt: { $gt: new Date(Date.now() - 3600000) } // Last hour
    });
    
    return {
      pending: pendingByTier,
      recentlyProcessed,
      recentlyFailed,
      processing: this.metrics.processing,
      currentRate: {
        processed: this.metrics.processed,
        failed: this.metrics.failed
      }
    };
  }
  
  // Mock methods - replace these with your actual implementations
  async checkSmartWallet(address: string): Promise<boolean> {
    // This would connect to your wallet analysis system
    // For now, return a mock response
    return Math.random() > 0.8; // 20% chance of being a smart wallet in mock
  }
  
  async isKnownContract(address: string): Promise<boolean> {
    // This would check against your contract database
    // For now, return a mock response
    return Math.random() > 0.5; // 50% chance in mock
  }
}

export default new PriorityQueueSystem();