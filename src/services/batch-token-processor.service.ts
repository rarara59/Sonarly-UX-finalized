// src/services/batch-token-processor.service.ts
import winston from 'winston';
import { ModularEdgeCalculator } from './modular-edge-calculator.service';
interface TokenBatch {
  tokenAddress: string;
  currentPrice: number;
  tokenAgeMinutes: number;
  priority: 'high' | 'normal' | 'low';
  source: string;
  timestamp: number;
}

interface BatchProcessingConfig {
  maxConcurrency: number;
  batchSize: number;
  processIntervalMs: number;
  priorityWeights: {
    high: number;
    normal: number;
    low: number;
  };
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
  };
}

interface BatchProcessingStats {
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  averageProcessingTimeMs: number;
  currentQueueSize: number;
  throughputPerMinute: number;
  lastProcessedAt: Date;
}

interface ProcessingResult {
  tokenAddress: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTimeMs: number;
  retryCount: number;
}

export class BatchTokenProcessor {
  private logger: winston.Logger;
  private processingQueue: TokenBatch[];
  private processing: boolean;
  private config: BatchProcessingConfig;
  private stats: BatchProcessingStats;
  private processingPromises: Map<string, Promise<ProcessingResult>>;
  private processInterval?: NodeJS.Timeout;
  constructor(private edgeCalculator: ModularEdgeCalculator) {

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'batch-token-processor' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    this.edgeCalculator = edgeCalculator;
    this.processingQueue = [];
    this.processing = false;
    this.processingPromises = new Map();

    // Default configuration (can be overridden)
    this.config = {
      maxConcurrency: 5, // Process 5 tokens simultaneously
      batchSize: 20, // Process up to 20 tokens per batch cycle
      processIntervalMs: 2000, // Check for new batches every 2 seconds
      priorityWeights: {
        high: 3, // 3x weight for high priority tokens
        normal: 1,
        low: 0.5
      },
      retryConfig: {
        maxRetries: 2,
        retryDelayMs: 5000
      }
    };

    this.stats = {
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      averageProcessingTimeMs: 0,
      currentQueueSize: 0,
      throughputPerMinute: 0,
      lastProcessedAt: new Date()
    };

    this.logger.info('🚀 Batch Token Processor initialized', {
      maxConcurrency: this.config.maxConcurrency,
      batchSize: this.config.batchSize
    });
  }

  /**
   * Start the batch processing system
   */
  start(): void {
    if (this.processing) {
      this.logger.warn('Batch processor already running');
      return;
    }

    this.processing = true;
    this.processInterval = setInterval(() => {
      this.processBatch().catch(error => {
        this.logger.error('Batch processing error:', error);
      });
    }, this.config.processIntervalMs);

    this.logger.info('🔄 Batch processing started');
  }

  /**
   * Stop the batch processing system
   */
  async stop(): Promise<void> {
    this.processing = false;
    
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = undefined;
    }

    // Wait for current processing to complete
    const activePromises = Array.from(this.processingPromises.values());
    if (activePromises.length > 0) {
      this.logger.info(`⏳ Waiting for ${activePromises.length} active processing tasks to complete...`);
      await Promise.allSettled(activePromises);
    }

    this.logger.info('⏹️ Batch processing stopped');
  }

  /**
   * Add token to processing queue
   */
  addToken(
    tokenAddress: string,
    currentPrice: number,
    tokenAgeMinutes: number,
    priority: 'high' | 'normal' | 'low' = 'normal',
    source: string = 'unknown'
  ): void {
    // Check if token is already in queue or currently processing
    const existingInQueue = this.processingQueue.find(t => t.tokenAddress === tokenAddress);
    const currentlyProcessing = this.processingPromises.has(tokenAddress);

    if (existingInQueue || currentlyProcessing) {
      this.logger.debug(`Token ${tokenAddress} already in queue or processing, skipping`);
      return;
    }

    const batch: TokenBatch = {
      tokenAddress,
      currentPrice,
      tokenAgeMinutes,
      priority,
      source,
      timestamp: Date.now()
    };

    this.processingQueue.push(batch);
    this.updateQueueStats();

    this.logger.debug(`📥 Added token to queue: ${tokenAddress} (priority: ${priority}, queue size: ${this.processingQueue.length})`);
  }

  /**
   * Add multiple tokens to queue
   */
  addTokens(tokens: Array<{
    tokenAddress: string;
    currentPrice: number;
    tokenAgeMinutes: number;
    priority?: 'high' | 'normal' | 'low';
    source?: string;
  }>): void {
    tokens.forEach(token => {
      this.addToken(
        token.tokenAddress,
        token.currentPrice,
        token.tokenAgeMinutes,
        token.priority || 'normal',
        token.source || 'batch'
      );
    });

    this.logger.info(`📥 Added ${tokens.length} tokens to processing queue`);
  }

  /**
   * Process a batch of tokens with concurrency control
   */
  private async processBatch(): Promise<void> {
    if (this.processingQueue.length === 0) {
      return; // Nothing to process
    }

    // Sort queue by priority and age
    this.sortQueueByPriority();

    // Get tokens to process (limited by batch size and available concurrency)
    const availableConcurrency = this.config.maxConcurrency - this.processingPromises.size;
    if (availableConcurrency <= 0) {
      this.logger.debug('⏸️ Max concurrency reached, waiting for slots to free up...');
      return;
    }

    const tokensToProcess = this.processingQueue.splice(0, Math.min(
      this.config.batchSize,
      availableConcurrency
    ));

    if (tokensToProcess.length === 0) return;

    this.logger.info(`🔄 Processing batch of ${tokensToProcess.length} tokens (${this.processingPromises.size}/${this.config.maxConcurrency} slots used)`);

    // Start processing tokens in parallel
    const batchPromises = tokensToProcess.map(token => this.processTokenWithRetry(token));
    
    // Don't await here - let them run concurrently
    // The individual promises will clean themselves up when done
    batchPromises.forEach((promise, index) => {
      const token = tokensToProcess[index];
      this.processingPromises.set(token.tokenAddress, promise);
      
      // Clean up when done
      promise.finally(() => {
        this.processingPromises.delete(token.tokenAddress);
      });
    });

    this.updateQueueStats();
  }

  /**
   * Sort processing queue by priority and age
   */
  private sortQueueByPriority(): void {
    this.processingQueue.sort((a, b) => {
      // First sort by priority
      const priorityDiff = this.config.priorityWeights[b.priority] - this.config.priorityWeights[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by age (older tokens processed first within same priority)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Process a single token with retry logic
   */
  private async processTokenWithRetry(token: TokenBatch): Promise<ProcessingResult> {
    const startTime = Date.now();
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        this.logger.debug(`🔍 Processing token ${token.tokenAddress} (attempt ${attempt + 1}/${this.config.retryConfig.maxRetries + 1})`);
        
        const result = await this.edgeCalculator.evaluateToken(
          token.tokenAddress,
          token.currentPrice,
          token.tokenAgeMinutes
        );

        const processingTime = Date.now() - startTime;
        this.updateProcessingStats(processingTime, true);

        this.logger.info(`✅ Successfully processed ${token.tokenAddress} in ${processingTime}ms (${result.isQualified ? 'QUALIFIED' : 'NOT QUALIFIED'})`);

        return {
          tokenAddress: token.tokenAddress,
          success: true,
          result,
          processingTimeMs: processingTime,
          retryCount: attempt
        };

      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.logger.warn(`❌ Processing failed for ${token.tokenAddress} (attempt ${attempt + 1}): ${errorMessage}`);

        // Wait before retry (except on last attempt)
        if (attempt < this.config.retryConfig.maxRetries) {
          await this.delay(this.config.retryConfig.retryDelayMs);
        }
      }
    }

    // All retries failed
    const processingTime = Date.now() - startTime;
    this.updateProcessingStats(processingTime, false);

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    this.logger.error(`💥 Failed to process ${token.tokenAddress} after ${this.config.retryConfig.maxRetries + 1} attempts: ${errorMessage}`);

    return {
      tokenAddress: token.tokenAddress,
      success: false,
      error: errorMessage,
      processingTimeMs: processingTime,
      retryCount: this.config.retryConfig.maxRetries
    };
  }

  /**
   * Process tokens and return results (useful for manual batch processing)
   */
  async processTokensNow(tokens: Array<{
    tokenAddress: string;
    currentPrice: number;
    tokenAgeMinutes: number;
    priority?: 'high' | 'normal' | 'low';
  }>): Promise<ProcessingResult[]> {
    const batchStartTime = Date.now();
    
    this.logger.info(`🚀 Processing immediate batch of ${tokens.length} tokens`);

    // Use p-limit style concurrency control
    const results: ProcessingResult[] = [];
    const batches = this.chunkArray(tokens, this.config.maxConcurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(token => {
        const tokenBatch: TokenBatch = {
          tokenAddress: token.tokenAddress,
          currentPrice: token.currentPrice,
          tokenAgeMinutes: token.tokenAgeMinutes,
          priority: token.priority || 'normal',
          source: 'immediate',
          timestamp: Date.now()
        };
        
        return this.processTokenWithRetry(tokenBatch);
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            tokenAddress: 'unknown',
            success: false,
            error: result.reason,
            processingTimeMs: 0,
            retryCount: 0
          });
        }
      });
    }

    const totalTime = Date.now() - batchStartTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    this.logger.info(`✅ Immediate batch complete: ${successful} successful, ${failed} failed in ${totalTime}ms`);

    return results;
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(processingTimeMs: number, success: boolean): void {
    this.stats.totalProcessed++;
    
    if (success) {
      this.stats.totalSuccessful++;
    } else {
      this.stats.totalFailed++;
    }

    // Update average processing time
    this.stats.averageProcessingTimeMs = 
      (this.stats.averageProcessingTimeMs * (this.stats.totalProcessed - 1) + processingTimeMs) / 
      this.stats.totalProcessed;

    this.stats.lastProcessedAt = new Date();

    // Calculate throughput (tokens per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // This is a simplified throughput calculation
    // In production, you'd want to track a sliding window
    this.stats.throughputPerMinute = this.stats.totalProcessed > 0 ? 
      (this.stats.totalProcessed / ((now - this.stats.lastProcessedAt.getTime()) / 60000)) : 0;
  }

  /**
   * Update queue statistics
   */
  private updateQueueStats(): void {
    this.stats.currentQueueSize = this.processingQueue.length;
  }

  /**
   * Get current processing statistics
   */
  getStats(): BatchProcessingStats {
    this.updateQueueStats();
    return { ...this.stats };
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    queueSize: number;
    activeProcessing: number;
    maxConcurrency: number;
    priorityBreakdown: Record<string, number>;
  } {
    const priorityBreakdown: Record<string, number> = { high: 0, normal: 0, low: 0 };
    
    this.processingQueue.forEach(token => {
      priorityBreakdown[token.priority]++;
    });

    return {
      queueSize: this.processingQueue.length,
      activeProcessing: this.processingPromises.size,
      maxConcurrency: this.config.maxConcurrency,
      priorityBreakdown
    };
  }

  /**
   * Update batch processing configuration
   */
  updateConfig(newConfig: Partial<BatchProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('🔧 Batch processing config updated', this.config);
  }

  /**
   * Clear the processing queue
   */
  clearQueue(): void {
    const clearedCount = this.processingQueue.length;
    this.processingQueue = [];
    this.updateQueueStats();
    
    this.logger.info(`🗑️ Cleared ${clearedCount} tokens from processing queue`);
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Health check method
   */
  isHealthy(): boolean {
    const stats = this.getStats();
    const queueStatus = this.getQueueStatus();
    
    // Consider unhealthy if:
    // - Queue is too large (> 100 tokens)
    // - Success rate is too low (< 70%)
    // - Not processing anything for too long (> 5 minutes)
    
    const queueTooLarge = queueStatus.queueSize > 100;
    const successRate = stats.totalProcessed > 0 ? stats.totalSuccessful / stats.totalProcessed : 1;
    const lowSuccessRate = successRate < 0.7 && stats.totalProcessed > 10;
    const staleProcessing = (Date.now() - stats.lastProcessedAt.getTime()) > 300000; // 5 minutes
    
    const isHealthy = !queueTooLarge && !lowSuccessRate && !staleProcessing;
    
    if (!isHealthy) {
      this.logger.warn('🚨 Batch processor health check failed', {
        queueTooLarge,
        lowSuccessRate,
        staleProcessing,
        successRate,
        queueSize: queueStatus.queueSize
      });
    }
    
    return isHealthy;
  }
}

// Export singleton instance for easy integration
export default BatchTokenProcessor;
