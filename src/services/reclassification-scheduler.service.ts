// src/services/reclassification-scheduler.service.ts

import { ClassificationHistoryService, ReclassificationContext } from './classification-history.service';
import { SmartMoneyValidator } from './smart-money-validator.service';
import { logger } from '../utils/logger';
import cron from 'node-cron';

export interface ReclassificationEvent {
  type: 'smart_wallet_entry' | 'volume_spike' | 'metadata_change' | 'tx_surge' | 'lp_update';
  token_address: string;
  timestamp: Date;
  data: any;
}

export class ReclassificationSchedulerService {
  private classificationService: ClassificationHistoryService;
  private smartMoneyValidator: SmartMoneyValidator;
  private isRunning: boolean = false;
  private eventQueue: ReclassificationEvent[] = [];
  private scheduledJobs: Map<string, any> = new Map();

  constructor() {
    this.classificationService = new ClassificationHistoryService();
    this.smartMoneyValidator = new SmartMoneyValidator();
  }

  /**
   * Start the reclassification scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Reclassification scheduler already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting reclassification scheduler...');

    // Schedule different time window checks
    this.scheduleJob('fast-check', '*/5 * * * *', () => this.processFastReevaluation()); // Every 5 minutes
    this.scheduleJob('medium-check', '*/30 * * * *', () => this.processMediumReevaluation()); // Every 30 minutes  
    this.scheduleJob('slow-check', '0 */6 * * *', () => this.processSlowReevaluation()); // Every 6 hours
    this.scheduleJob('cleanup', '0 2 * * *', () => this.processCleanup()); // Daily at 2 AM

    // Start event processing loop
    this.startEventProcessing();

    logger.info('Reclassification scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Stop all scheduled jobs
    this.scheduledJobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped scheduled job: ${name}`);
    });
    this.scheduledJobs.clear();

    logger.info('Reclassification scheduler stopped');
  }

  /**
   * Add event to processing queue
   */
  addEvent(event: ReclassificationEvent): void {
    this.eventQueue.push(event);
    
    // Process immediately for high-priority events
    if (['smart_wallet_entry', 'volume_spike'].includes(event.type)) {
      setImmediate(() => this.processEvent(event));
    }
  }

  /**
   * Process events from queue
   */
  private async startEventProcessing(): Promise<void> {
    const processLoop = async () => {
      if (!this.isRunning) return;

      try {
        // Process up to 10 events per iteration
        const eventsToProcess = this.eventQueue.splice(0, 10);
        
        for (const event of eventsToProcess) {
          await this.processEvent(event);
        }
      } catch (error) {
        logger.error('Error in event processing loop:', error);
      }

      // Continue processing if running
      if (this.isRunning) {
        setTimeout(processLoop, 1000); // Process every second
      }
    };

    processLoop();
  }

  /**
   * Process individual reclassification event
   */
  private async processEvent(event: ReclassificationEvent): Promise<void> {
    try {
      const record = await this.classificationService.getClassification(event.token_address);
      if (!record) return;

      const context = await this.buildReclassificationContext(event);
      const result = await this.classificationService.applyReclassificationLogic(record, context);

      if (result.shouldReclassify) {
        await this.classificationService.updateClassification({
          token_address: event.token_address,
          new_status: result.newStatus!,
          reason: result.reason!,
          edge_score: record.edge_score, // Keep existing score for now
          age_minutes: Math.floor((Date.now() - record.first_detected_at.getTime()) / 60000),
          tx_count: record.tx_count,
          holder_count: record.holder_count,
          metadata_verified: record.metadata_verified
        });

        // Apply flags if provided
        if (result.flags) {
          await this.applyReclassificationFlags(event.token_address, result.flags);
        }

        logger.info(`Reclassified token ${event.token_address}: ${record.current_status} → ${result.newStatus} (${result.reason})`);
      }
    } catch (error) {
      logger.error(`Error processing reclassification event for ${event.token_address}:`, error);
    }
  }

  /**
   * Fast reevaluation (5 minutes) - Check tokens < 30 minutes old
   */
  private async processFastReevaluation(): Promise<void> {
    logger.info('Running fast reevaluation (5min cycle)...');
    
    const tokens = await this.classificationService.getTokensForReevaluation(5);
    const youngTokens = tokens.filter(token => {
      const ageMinutes = Math.floor((Date.now() - token.first_detected_at.getTime()) / 60000);
      return ageMinutes <= 30;
    });

    for (const token of youngTokens) {
      await this.reevaluateToken(token.token_address, 'fast');
    }

    logger.info(`Fast reevaluation completed. Processed ${youngTokens.length} tokens`);
  }

  /**
   * Medium reevaluation (30 minutes) - Check tokens 30m-24h old
   */
  private async processMediumReevaluation(): Promise<void> {
    logger.info('Running medium reevaluation (30min cycle)...');
    
    const tokens = await this.classificationService.getTokensForReevaluation(30);
    const mediumAgeTokens = tokens.filter(token => {
      const ageMinutes = Math.floor((Date.now() - token.first_detected_at.getTime()) / 60000);
      return ageMinutes > 30 && ageMinutes <= 1440; // 30m to 24h
    });

    for (const token of mediumAgeTokens) {
      await this.reevaluateToken(token.token_address, 'medium');
    }

    logger.info(`Medium reevaluation completed. Processed ${mediumAgeTokens.length} tokens`);
  }

  /**
   * Slow reevaluation (6 hours) - Check tokens > 24h old
   */
  private async processSlowReevaluation(): Promise<void> {
    logger.info('Running slow reevaluation (6h cycle)...');
    
    const tokens = await this.classificationService.getTokensForReevaluation(360); // 6 hours
    const oldTokens = tokens.filter(token => {
      const ageMinutes = Math.floor((Date.now() - token.first_detected_at.getTime()) / 60000);
      return ageMinutes > 1440; // > 24h
    });

    for (const token of oldTokens) {
      await this.reevaluateToken(token.token_address, 'slow');
    }

    logger.info(`Slow reevaluation completed. Processed ${oldTokens.length} tokens`);
  }

  /**
   * Reevaluate a specific token
   */
  private async reevaluateToken(token_address: string, cycle: 'fast' | 'medium' | 'slow'): Promise<void> {
    try {
      const record = await this.classificationService.getClassification(token_address);
      if (!record) return;

      // Build context for reevaluation
      const context = await this.buildReclassificationContext({
        type: 'scheduled_check',
        token_address,
        timestamp: new Date(),
        data: { cycle }
      } as any);

      const result = await this.classificationService.applyReclassificationLogic(record, context);

      if (result.shouldReclassify) {
        await this.classificationService.updateClassification({
          token_address,
          new_status: result.newStatus!,
          reason: `${result.reason} (${cycle} cycle)`,
          edge_score: record.edge_score,
          age_minutes: Math.floor((Date.now() - record.first_detected_at.getTime()) / 60000),
          tx_count: record.tx_count,
          holder_count: record.holder_count,
          metadata_verified: record.metadata_verified
        });

        if (result.flags) {
          await this.applyReclassificationFlags(token_address, result.flags);
        }

        logger.info(`Scheduled reclassification (${cycle}): ${token_address} → ${result.newStatus}`);
      }
    } catch (error) {
      logger.error(`Error in scheduled reevaluation for ${token_address}:`, error);
    }
  }

  /**
   * Build reclassification context
   */
  private async buildReclassificationContext(event: ReclassificationEvent): Promise<ReclassificationContext> {
    // This would integrate with your existing services to gather real data
    // For now, providing a framework structure
    
    return {
      current_time: new Date(),
      smart_wallet_activity: event.type === 'smart_wallet_entry',
      volume_spike: event.type === 'volume_spike',
      metadata_changed: event.type === 'metadata_change',
      holder_growth: event.data?.holder_growth || false,
      pattern_signal_spike: event.data?.pattern_signal_spike || false,
      is_honeypot: event.data?.is_honeypot || false,
      is_rug: event.data?.is_rug || false,
      mint_reused: event.data?.mint_reused || false,
      similar_token_exists: event.data?.similar_token_exists || false,
      paired_with_known_token: event.data?.paired_with_known_token || false,
      smart_wallet_dump_ratio: event.data?.smart_wallet_dump_ratio
    };
  }

  /**
   * Apply reclassification flags to database record
   */
  private async applyReclassificationFlags(token_address: string, flags: any): Promise<void> {
    const updateData: any = {};
    
    // Map flags to database fields
    if (flags.is_late_blooming) updateData.is_late_blooming = true;
    if (flags.is_early_established) updateData.is_early_established = true;
    if (flags.is_delayed_hot) updateData.is_delayed_hot = true;
    if (flags.is_false_positive) updateData.is_false_positive = true;
    if (flags.is_reborn) updateData.is_reborn = true;
    if (flags.is_edge_plateau) updateData.is_edge_plateau = true;
    if (flags.is_echo) updateData.is_echo = true;
    if (flags.is_sidecar) updateData.is_sidecar = true;
    if (flags.is_reversal) updateData.is_reversal = true;
    if (flags.alert_suppressed) updateData.alert_suppressed = true;

    if (Object.keys(updateData).length > 0) {
      await this.classificationService.updateClassification({
        token_address,
        new_status: 'watchlist', // Placeholder
        reason: 'Flag update',
        edge_score: 0,
        age_minutes: 0,
        tx_count: 0,
        holder_count: 0,
        metadata_verified: false,
        ...updateData
      });
    }
  }

  /**
   * Schedule a cron job
   */
  private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>): void {
    const job = cron.schedule(cronExpression, async () => {
      try {
        await task();
      } catch (error) {
        logger.error(`Error in scheduled job ${name}:`, error);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.scheduledJobs.set(name, job);
    logger.info(`Scheduled job '${name}' with expression: ${cronExpression}`);
  }

  /**
   * Cleanup old records
   */
  private async processCleanup(): Promise<void> {
    logger.info('Running daily cleanup...');
    const deletedCount = await this.classificationService.cleanupOldRecords(7);
    logger.info(`Cleanup completed. Removed ${deletedCount} old records`);
  }

  /**
   * Get scheduler status
   */
  getStatus(): { 
    isRunning: boolean; 
    queueLength: number; 
    scheduledJobs: string[];
  } {
    return {
      isRunning: this.isRunning,
      queueLength: this.eventQueue.length,
      scheduledJobs: Array.from(this.scheduledJobs.keys())
    };
  }
}