// src/services/reclassification-scheduler.service.ts

import { ClassificationHistoryService } from './classification-history.service';
import SmartMoneyValidatorService from './smart-money-validator.service'; // FIXED: Default import
import { IClassificationHistory } from '../legacy/classificationHistory';
import logger from '../utils/logger';
import cron from 'node-cron';

// FIXED: Define ReclassificationContext interface locally
export interface ReclassificationContext {
  current_time: Date;
  smart_wallet_activity: boolean;
  volume_spike: boolean;
  metadata_changed: boolean;
  holder_growth: boolean;
  pattern_signal_spike: boolean;
  is_honeypot: boolean;
  is_rug: boolean;
  mint_reused: boolean;
  similar_token_exists: boolean;
  paired_with_known_token: boolean;
  smart_wallet_dump_ratio?: number;
}

// FIXED: Define ReclassificationResult interface
interface ReclassificationResult {
  shouldReclassify: boolean;
  newStatus?: 'fresh-gem' | 'established' | 'rejected' | 'under-review';
  reason?: string;
  flags?: any;
}

export interface ReclassificationEvent {
  type: 'smart_wallet_entry' | 'volume_spike' | 'metadata_change' | 'tx_surge' | 'lp_update';
  token_address: string;
  timestamp: Date;
  data: any;
}

interface ReclassificationFlags {
  is_late_blooming?: boolean;
  is_early_established?: boolean;
  is_delayed_hot?: boolean;
  is_false_positive?: boolean;
  is_reborn?: boolean;
  is_edge_plateau?: boolean;
  is_echo?: boolean;
  is_sidecar?: boolean;
  is_reversal?: boolean;
  alert_suppressed?: boolean;
}

interface EdgeScoreRefreshFunction {
  (token_address: string): Promise<number | null>;
}

export class ReclassificationSchedulerService {
  private classificationService: ClassificationHistoryService;
  private smartMoneyValidator: typeof SmartMoneyValidatorService; // FIXED: Correct type
  private isRunning: boolean = false;
  private eventQueue: ReclassificationEvent[] = [];
  private eventDeduplication: Set<string> = new Set();
  private scheduledJobs: Map<string, any> = new Map();
  private lastJobHeartbeat: Map<string, number> = new Map();
  private edgeScoreRefreshFn?: EdgeScoreRefreshFunction;
  
  // Configuration
  private readonly MAX_QUEUE_LENGTH = 1000;
  private readonly RECLASSIFICATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
  private readonly DEDUPLICATION_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly JOB_HEARTBEAT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor(edgeScoreRefreshFn?: EdgeScoreRefreshFunction) {
    this.classificationService = new ClassificationHistoryService();
    this.smartMoneyValidator = SmartMoneyValidatorService; // FIXED: Use class directly
    this.edgeScoreRefreshFn = edgeScoreRefreshFn;
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
    this.scheduleJob('health-check', '*/15 * * * *', () => this.checkJobHealth()); // Every 15 minutes

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
   * Add event to processing queue with deduplication
   */
  addEvent(event: ReclassificationEvent): void {
    // Check queue overflow
    if (this.eventQueue.length >= this.MAX_QUEUE_LENGTH) {
      logger.warn(`Event queue at capacity (${this.MAX_QUEUE_LENGTH}), dropping oldest events`);
      this.eventQueue.splice(0, 100); // Remove oldest 100 events
      this.cleanupDeduplication();
    }

    // Create deduplication key
    const dedupKey = `${event.token_address}-${event.type}-${Math.floor(event.timestamp.getTime() / this.DEDUPLICATION_WINDOW_MS)}`;
    
    if (this.eventDeduplication.has(dedupKey)) {
      logger.debug(`Duplicate event ignored: ${event.type} for ${event.token_address}`);
      return;
    }

    this.eventDeduplication.add(dedupKey);
    this.eventQueue.push(event);
    
    // Process immediately for high-priority events
    if (['smart_wallet_entry', 'volume_spike'].includes(event.type)) {
      setImmediate(() => this.processEvent(event));
    }
  }

  /**
   * Clean up old deduplication entries
   */
  private cleanupDeduplication(): void {
    const cutoffTime = Date.now() - this.DEDUPLICATION_WINDOW_MS;
    const currentWindow = Math.floor(Date.now() / this.DEDUPLICATION_WINDOW_MS);
    
    // Clear old deduplication entries (simple heuristic)
    if (this.eventDeduplication.size > 10000) {
      logger.info('Clearing deduplication cache');
      this.eventDeduplication.clear();
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
      // FIXED: Use getByTokenAddress instead of getClassification
      const record = await this.classificationService.getByTokenAddress(event.token_address);
      
      if (!record) {
        logger.warn(`⚠️ Reclassification event for missing token: ${event.token_address} (${event.type})`);
        return;
      }

      // Check cooldown period
      const timeSinceLastUpdate = Date.now() - record.last_reevaluated_at.getTime();
      if (timeSinceLastUpdate < this.RECLASSIFICATION_COOLDOWN_MS) {
        logger.debug(`Reclassification cooldown active for ${event.token_address} (${Math.round(timeSinceLastUpdate / 1000)}s ago)`);
        return;
      }

      const context = await this.buildReclassificationContext(event);
      // FIXED: Use our own reclassification logic instead of non-existent method
      const result = await this.applyReclassificationLogic(record, context);

      if (result.shouldReclassify) {
        // Refresh edge score if function provided
        let updatedEdgeScore = record.edge_score;
        if (this.edgeScoreRefreshFn) {
          const refreshedScore = await this.edgeScoreRefreshFn(event.token_address);
          if (refreshedScore !== null) {
            updatedEdgeScore = refreshedScore;
            logger.debug(`Edge score refreshed for ${event.token_address}: ${record.edge_score} → ${refreshedScore}`);
          }
        }

        // FIXED: Use correct method signature for updateClassification
        await this.classificationService.updateClassification(event.token_address, {
          current_status: result.newStatus!,
          reason: result.reason!,
          edge_score: updatedEdgeScore,
          tx_count: record.tx_count,
          holder_count: record.holder_count,
          metadata_verified: record.metadata_verified,
          source: 'scheduled_task',
          updated_by: 'reclassification_scheduler'
        });

        // Apply flags if provided (FIXED: separate from status update)
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
    
    // FIXED: Use findPendingReevaluations instead of non-existent method
    const tokens = await this.classificationService.findPendingReevaluations();
    const youngTokens = tokens.filter((token: IClassificationHistory) => {
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
    
    // FIXED: Use findPendingReevaluations instead of non-existent method
    const tokens = await this.classificationService.findPendingReevaluations();
    const mediumAgeTokens = tokens.filter((token: IClassificationHistory) => {
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
    
    // FIXED: Use findPendingReevaluations instead of non-existent method
    const tokens = await this.classificationService.findPendingReevaluations();
    const oldTokens = tokens.filter((token: IClassificationHistory) => {
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
      // FIXED: Use getByTokenAddress instead of getClassification
      const record = await this.classificationService.getByTokenAddress(token_address);
      
      if (!record) {
        logger.warn(`⚠️ Scheduled reevaluation for missing token: ${token_address} (${cycle} cycle)`);
        return;
      }

      // Check cooldown period for scheduled reevaluations too
      const timeSinceLastUpdate = Date.now() - record.last_reevaluated_at.getTime();
      if (timeSinceLastUpdate < this.RECLASSIFICATION_COOLDOWN_MS) {
        logger.debug(`Scheduled reevaluation cooldown active for ${token_address} (${cycle})`);
        return;
      }

      // Build context for reevaluation
      const context = await this.buildReclassificationContext({
        type: 'smart_wallet_entry', // FIXED: Provide valid event type
        token_address,
        timestamp: new Date(),
        data: { cycle }
      });

      // FIXED: Use our own reclassification logic
      const result = await this.applyReclassificationLogic(record, context);

      if (result.shouldReclassify) {
        // Refresh edge score for scheduled reevaluations
        let updatedEdgeScore = record.edge_score;
        if (this.edgeScoreRefreshFn) {
          const refreshedScore = await this.edgeScoreRefreshFn(token_address);
          if (refreshedScore !== null) {
            updatedEdgeScore = refreshedScore;
            logger.debug(`Edge score refreshed during ${cycle} reevaluation: ${record.edge_score} → ${refreshedScore}`);
          }
        }

        // FIXED: Use correct method signature for updateClassification
        await this.classificationService.updateClassification(token_address, {
          current_status: result.newStatus!,
          reason: `${result.reason} (${cycle} cycle)`,
          edge_score: updatedEdgeScore,
          tx_count: record.tx_count,
          holder_count: record.holder_count,
          metadata_verified: record.metadata_verified,
          source: 'scheduled_task',
          updated_by: 'reclassification_scheduler'
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
   * FIXED: Create our own reclassification logic using real data
   */
  private async applyReclassificationLogic(
    record: IClassificationHistory,
    context: ReclassificationContext
  ): Promise<ReclassificationResult> {
    
    const ageMinutes = Math.floor((Date.now() - record.first_detected_at.getTime()) / 60000);
    const timeSinceLastUpdate = Math.floor((Date.now() - record.last_reevaluated_at.getTime()) / 60000);
    
    // Rule 1: Fresh gems that have aged should become established
    if (record.current_status === 'fresh-gem' && ageMinutes > 60 && record.edge_score >= 70) {
      return {
        shouldReclassify: true,
        newStatus: 'established',
        reason: `Fresh gem matured to established (age: ${ageMinutes}m, edge: ${record.edge_score})`,
        flags: { is_early_established: true }
      };
    }

    // Rule 2: Low-performing tokens should be rejected
    if (record.edge_score < 50 && record.current_status !== 'rejected') {
      return {
        shouldReclassify: true,
        newStatus: 'rejected',
        reason: `Low edge score rejection (${record.edge_score})`,
        flags: { is_false_positive: true }
      };
    }

    // Rule 3: Under-review tokens with improved scores
    if (record.current_status === 'under-review' && record.edge_score >= 75) {
      const newStatus = ageMinutes <= 60 ? 'fresh-gem' : 'established';
      return {
        shouldReclassify: true,
        newStatus,
        reason: `Review completed - edge score improved to ${record.edge_score}`,
        flags: ageMinutes > 60 ? { is_late_blooming: true } : {}
      };
    }

    // Rule 4: Smart wallet activity context
    if (context.smart_wallet_activity && record.current_status === 'rejected' && record.edge_score >= 60) {
      return {
        shouldReclassify: true,
        newStatus: 'under-review',
        reason: 'Smart wallet activity detected on rejected token',
        flags: { is_reborn: true }
      };
    }

    // Rule 5: Volume spike context
    if (context.volume_spike && record.current_status === 'under-review' && record.edge_score >= 70) {
      return {
        shouldReclassify: true,
        newStatus: ageMinutes <= 60 ? 'fresh-gem' : 'established',
        reason: 'Volume spike confirmed quality',
        flags: { is_delayed_hot: true }
      };
    }

    // No reclassification needed
    return { shouldReclassify: false };
  }

  /**
   * Build reclassification context
   */
  private async buildReclassificationContext(event: ReclassificationEvent): Promise<ReclassificationContext> {
    // FIXED: Use real smart money validation if available
    let smartWalletActivity = false;
    try {
      const smartMoneyResult = await this.smartMoneyValidator.validateBuyers(event.token_address);
      smartWalletActivity = smartMoneyResult.isSmartMoneyToken;
    } catch (error) {
      logger.debug(`Could not validate smart money for ${event.token_address}:`, error);
    }
    
    return {
      current_time: new Date(),
      smart_wallet_activity: smartWalletActivity || event.type === 'smart_wallet_entry',
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
   * Apply reclassification flags to database record (FIXED: no longer corrupts metrics)
   */
  private async applyReclassificationFlags(token_address: string, flags: any): Promise<void> {
    try {
      // Validate flags object structure
      const validatedFlags = this.validateAndSanitizeFlags(flags);
      if (Object.keys(validatedFlags).length === 0) {
        logger.warn(`No valid flags to apply for ${token_address}`);
        return;
      }

      // Use the dedicated flag-only update method
      await this.classificationService.applyFlagsOnly(token_address, validatedFlags);

      logger.debug(`Applied flags to ${token_address}:`, validatedFlags);
    } catch (error) {
      logger.error(`Error applying flags to ${token_address}:`, error);
    }
  }

  /**
   * Validate and sanitize flags object
   */
  private validateAndSanitizeFlags(flags: any): ReclassificationFlags {
    if (!flags || typeof flags !== 'object') {
      return {};
    }

    const validatedFlags: ReclassificationFlags = {};
    const allowedFlags = [
      'is_late_blooming', 'is_early_established', 'is_delayed_hot', 
      'is_false_positive', 'is_reborn', 'is_edge_plateau', 
      'is_echo', 'is_sidecar', 'is_reversal', 'alert_suppressed'
    ];

    allowedFlags.forEach(flag => {
      if (flag in flags && typeof flags[flag] === 'boolean') {
        (validatedFlags as any)[flag] = flags[flag];
      }
    });

    return validatedFlags;
  }

  /**
   * Schedule a cron job with heartbeat monitoring
   */
  private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>): void {
    const wrappedTask = async () => {
      try {
        // Update heartbeat before task
        this.lastJobHeartbeat.set(name, Date.now());
        await task();
        // Update heartbeat after successful completion
        this.lastJobHeartbeat.set(name, Date.now());
      } catch (error) {
        logger.error(`Error in scheduled job ${name}:`, error);
        // Still update heartbeat to show job attempted to run
        this.lastJobHeartbeat.set(name, Date.now());
      }
    };

    // FIXED: Remove unsupported 'scheduled' option
    const job = cron.schedule(cronExpression, wrappedTask, {
      timezone: 'UTC'
    });

    job.start();
    this.scheduledJobs.set(name, job);
    this.lastJobHeartbeat.set(name, Date.now());
    logger.info(`Scheduled job '${name}' with expression: ${cronExpression}`);
  }

  /**
   * Check job health and restart if needed
   */
  private async checkJobHealth(): Promise<void> {
    const now = Date.now();
    
    for (const [jobName, lastHeartbeat] of this.lastJobHeartbeat.entries()) {
      const timeSinceHeartbeat = now - lastHeartbeat;
      
      if (timeSinceHeartbeat > this.JOB_HEARTBEAT_TIMEOUT_MS) {
        logger.warn(`Job ${jobName} heartbeat timeout (${Math.round(timeSinceHeartbeat / 1000)}s). Attempting restart...`);
        
        // Stop existing job
        const existingJob = this.scheduledJobs.get(jobName);
        if (existingJob) {
          existingJob.stop();
        }
        
        // Restart job based on name
        this.restartJobByName(jobName);
      }
    }
  }

  /**
   * Restart a specific job by name
   */
  private restartJobByName(jobName: string): void {
    switch (jobName) {
      case 'fast-check':
        this.scheduleJob('fast-check', '*/5 * * * *', () => this.processFastReevaluation());
        break;
      case 'medium-check':
        this.scheduleJob('medium-check', '*/30 * * * *', () => this.processMediumReevaluation());
        break;
      case 'slow-check':
        this.scheduleJob('slow-check', '0 */6 * * *', () => this.processSlowReevaluation());
        break;
      case 'cleanup':
        this.scheduleJob('cleanup', '0 2 * * *', () => this.processCleanup());
        break;
      case 'health-check':
        this.scheduleJob('health-check', '*/15 * * * *', () => this.checkJobHealth());
        break;
      default:
        logger.error(`Unknown job name for restart: ${jobName}`);
    }
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
    queueCapacity: number;
    deduplicationSize: number;
    jobHeartbeats: Record<string, { lastSeen: string; healthy: boolean }>;
    configuration: {
      maxQueueLength: number;
      cooldownMs: number;
      deduplicationWindowMs: number;
      heartbeatTimeoutMs: number;
    };
  } {
    const now = Date.now();
    const jobHeartbeats: Record<string, { lastSeen: string; healthy: boolean }> = {};
    
    for (const [jobName, lastHeartbeat] of this.lastJobHeartbeat.entries()) {
      const timeSinceHeartbeat = now - lastHeartbeat;
      jobHeartbeats[jobName] = {
        lastSeen: new Date(lastHeartbeat).toISOString(),
        healthy: timeSinceHeartbeat < this.JOB_HEARTBEAT_TIMEOUT_MS
      };
    }

    return {
      isRunning: this.isRunning,
      queueLength: this.eventQueue.length,
      queueCapacity: Math.round((this.eventQueue.length / this.MAX_QUEUE_LENGTH) * 100),
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      deduplicationSize: this.eventDeduplication.size,
      jobHeartbeats,
      configuration: {
        maxQueueLength: this.MAX_QUEUE_LENGTH,
        cooldownMs: this.RECLASSIFICATION_COOLDOWN_MS,
        deduplicationWindowMs: this.DEDUPLICATION_WINDOW_MS,
        heartbeatTimeoutMs: this.JOB_HEARTBEAT_TIMEOUT_MS
      }
    };
  }

  /**
   * Set edge score refresh function
   */
  setEdgeScoreRefreshFunction(fn: EdgeScoreRefreshFunction): void {
    this.edgeScoreRefreshFn = fn;
    logger.info('Edge score refresh function configured');
  }

  /**
   * Force cleanup of event queue and deduplication cache
   */
  forceCleanup(): void {
    const queueBefore = this.eventQueue.length;
    const dedupBefore = this.eventDeduplication.size;
    
    this.eventQueue.splice(0, Math.floor(this.eventQueue.length / 2));
    this.eventDeduplication.clear();
    
    logger.info(`Force cleanup completed: queue ${queueBefore} → ${this.eventQueue.length}, dedup ${dedupBefore} → 0`);
  }
}