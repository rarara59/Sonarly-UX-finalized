// classification-integration.service.ts

import { ClassificationHistoryService } from './classification-history.service';
import { ReclassificationSchedulerService } from './reclassification-scheduler.service';
import { AlertSystemService } from './alert-system.service';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { ClassificationHistory, IClassificationHistory } from '../legacy/classificationHistory';
import { MongoClient, Db } from 'mongodb';
import logger from '../utils/logger';

// Fixed TokenStatus type to match model enum exactly
type TokenStatus = 'fresh-gem' | 'established' | 'rejected' | 'under-review';

// Export type for setup script
export interface TokenProcessingResult {
  shouldAlert: boolean;
  classification: TokenStatus;
  reason: string;
}

interface ClassificationResult {
  shouldAlert: boolean;
  classification: TokenStatus;
  reason: string;
}

// FIXED: Removed null from previous_status to match ClassificationHistoryService expectations
interface ClassificationUpdate {
  token_address: string;
  current_status: TokenStatus;
  previous_status?: TokenStatus; // FIXED: Removed | null
  reason: string;
  edge_score: number;
  age_minutes: number; // FIXED: Add missing age_minutes field
  tx_count: number;
  holder_count: number;
  metadata_verified: boolean;
  reevaluation_count: number;
  smart_wallet_entries: number;
  volume_24h: number;
  liquidity_usd: number;
  reclassificationFlags: any;
  source: 'manual' | 'batch_processor' | 'webhook' | 'scheduled_task';
  updated_by: string;
}

interface TokenMetrics {
  age_minutes: number;
  tx_count: number;
  holder_count: number;
  metadata_verified: boolean;
  smart_wallet_entries: number;
  volume_24h: number;
  liquidity_usd: number;
  edge_score: number;
}

interface TokenData {
  address: string;
  metrics: TokenMetrics;
  classification?: TokenStatus;
}

interface ClassificationStats {
  classification: TokenStatus | null;
  edgeScore: number | null;
  ageMinutes: number | null;
  alertSuppressed: boolean;
  reclassificationFlags: string[];
}

export class ClassificationIntegrationService {
  private classificationService = new ClassificationHistoryService();
  private schedulerService = new ReclassificationSchedulerService();
  private performanceService?: PerformanceMonitoringService; // FIXED: Optional since we may not have DB
  private alertService?: AlertSystemService; // FIXED: Optional since it depends on performance service
  private isInitialized = false;
  private db?: Db; // FIXED: Add database connection property

  // FIXED: Constructor accepts optional database connection
  constructor(db?: Db) {
    this.db = db;
    
    // FIXED: Only create performance service if database available
    if (db) {
      this.performanceService = new PerformanceMonitoringService(db);
      this.alertService = new AlertSystemService(this.performanceService);
    } else {
      logger.warn('No database connection provided - Performance monitoring and alerts disabled');
    }
  }

  async initialize(): Promise<void> {
    try {
      logger.info('🔄 Initializing Classification Integration Service...');
      
      // FIXED: ClassificationHistoryService doesn't have initialize() method
      // Just verify the service is working by testing database connection
      
      // FIXED: Use start() instead of initialize() for scheduler
      await this.schedulerService.start();
      
      // FIXED: AlertSystemService doesn't have initialize() method
      // The constructor already initializes it
      
      const count = await ClassificationHistory.countDocuments({});
      logger.info(`📊 Classification DB check: ${count} records`);
      
      this.isInitialized = true;
      logger.info('✅ Initialization complete');
    } catch (err) {
      logger.error('❌ Initialization failed:', err);
      throw err;
    }
  }

  async processBatch(tokens: TokenData[]): Promise<void> {
    if (!this.isInitialized) throw new Error('Service not initialized');
    for (const token of tokens) {
      try {
        await this.processToken(token);
      } catch (err) {
        logger.error(`❌ Error processing token ${token.address}:`, err);
      }
    }
  }

  async processToken(tokenData: TokenData): Promise<ClassificationResult> {
    const { address, metrics } = tokenData;
    const existing = await this.classificationService.getByTokenAddress(address);
    const result = this.determineInitialClassification(metrics, existing);

    if (existing) {
      await this.updateExistingClassification(existing, result, metrics);
    } else {
      await this.createNewClassification(address, result, metrics);
    }

    if (result.shouldAlert) {
      // FIXED: Use addEvent() instead of scheduleReclassification()
      this.schedulerService.addEvent({
        type: 'smart_wallet_entry', // FIXED: Provide proper event type
        token_address: address,
        timestamp: new Date(),
        data: { trigger: 'alert_triggered' }
      });
    }

    return result;
  }

  private determineInitialClassification(
    metrics: TokenMetrics,
    existing?: IClassificationHistory | null
  ): ClassificationResult {
    const { edge_score, age_minutes, tx_count, holder_count, metadata_verified } = metrics;

    if (!metadata_verified) {
      return { shouldAlert: false, classification: 'rejected', reason: 'Metadata not verified' };
    }

    if (edge_score < 50) {
      return { shouldAlert: false, classification: 'rejected', reason: `Low edge score: ${edge_score}` };
    }

    if (age_minutes <= 60 && edge_score >= 75 && tx_count >= 10) {
      return {
        shouldAlert: edge_score >= 85,
        classification: 'fresh-gem',
        reason: `Fresh gem candidate: age=${age_minutes}, edge=${edge_score}, tx=${tx_count}`
      };
    }

    if (age_minutes > 60 && edge_score >= 70 && holder_count >= 50) {
      return {
        shouldAlert: edge_score >= 90,
        classification: 'established',
        reason: `Established token: age=${age_minutes}, edge=${edge_score}, holders=${holder_count}`
      };
    }

    if (edge_score >= 60) {
      return { shouldAlert: false, classification: 'under-review', reason: `Manual review: edge=${edge_score}` };
    }

    return { shouldAlert: false, classification: 'rejected', reason: `Rejected: edge=${edge_score}` };
  }

  private async createNewClassification(
    tokenAddress: string,
    result: ClassificationResult,
    metrics: TokenMetrics
  ): Promise<void> {
    const classificationData: ClassificationUpdate = {
      token_address: tokenAddress,
      current_status: result.classification,
      reason: result.reason,
      edge_score: metrics.edge_score,
      age_minutes: metrics.age_minutes, // FIXED: Add missing age_minutes field
      tx_count: metrics.tx_count,
      holder_count: metrics.holder_count,
      metadata_verified: metrics.metadata_verified,
      reevaluation_count: 0,
      smart_wallet_entries: metrics.smart_wallet_entries,
      volume_24h: metrics.volume_24h,
      liquidity_usd: metrics.liquidity_usd,
      reclassificationFlags: {},
      source: 'batch_processor',
      updated_by: 'classification_integration'
    };
    await this.classificationService.createClassification(classificationData);
    logger.info(`📝 Created classification for ${tokenAddress}: ${result.classification}`);
  }

  private async updateExistingClassification(
    existing: IClassificationHistory,
    result: ClassificationResult,
    metrics: TokenMetrics
  ): Promise<void> {
    const hasStatusChanged = existing.current_status !== result.classification;
    const scoreDelta = Math.abs(existing.edge_score - metrics.edge_score);
    if (!hasStatusChanged && scoreDelta < 5) return;

    // FIXED: Ensure previous_status is TokenStatus type, not null
    const update: Partial<ClassificationUpdate> = {
      current_status: result.classification,
      previous_status: existing.current_status, // FIXED: This is already TokenStatus type
      reason: result.reason,
      edge_score: metrics.edge_score,
      age_minutes: metrics.age_minutes, // FIXED: Add missing age_minutes field
      tx_count: metrics.tx_count,
      holder_count: metrics.holder_count,
      smart_wallet_entries: metrics.smart_wallet_entries,
      volume_24h: metrics.volume_24h,
      liquidity_usd: metrics.liquidity_usd,
      source: 'batch_processor',
      updated_by: 'classification_integration'
    };

    await this.classificationService.updateClassification(existing.token_address, update);
    logger.info(`🔄 Updated classification for ${existing.token_address}: ${existing.current_status} → ${result.classification}`);
  }

  async getTokenClassification(tokenAddress: string): Promise<ClassificationStats> {
    const record = await this.classificationService.getByTokenAddress(tokenAddress);
    if (!record) return {
      classification: null, edgeScore: null, ageMinutes: null, alertSuppressed: false, reclassificationFlags: []
    };

    const flags: string[] = [];
    if (record.getIsLateBlooming()) flags.push('late_blooming');
    if (record.getIsEarlyEstablished()) flags.push('early_established');
    if (record.getIsDelayedHot()) flags.push('delayed_hot');
    if (record.getIsFalsePositive()) flags.push('false_positive');
    if (record.getIsReborn()) flags.push('reborn');
    if (record.getIsEdgePlateau()) flags.push('edge_plateau');
    if (record.getIsEcho()) flags.push('echo');
    if (record.getIsSidecar()) flags.push('sidecar');
    if (record.getIsReversal()) flags.push('reversal');

    return {
      classification: record.current_status as TokenStatus,
      edgeScore: record.edge_score,
      ageMinutes: record.age_minutes,
      alertSuppressed: record.alert_suppressed,
      reclassificationFlags: flags
    };
  }

  // Alias method for setup script compatibility
  async getTokenStatus(tokenAddress: string): Promise<ClassificationStats> {
    return this.getTokenClassification(tokenAddress);
  }

  // Add getSystemStats method for setup script
  async getSystemStats(): Promise<any> {
    try {
      const [statusCounts, recentActivity, suppressedAlerts] = await Promise.all([
        ClassificationHistory.getStatusCounts(),
        this.classificationService.getRecentActivity ? this.classificationService.getRecentActivity(24) : [],
        ClassificationHistory.findSuppressedAlerts()
      ]);

      // Convert statusCounts to the format expected by setup script
      const tokensByStatus: { [key: string]: number } = {};
      if (Array.isArray(statusCounts)) {
        statusCounts.forEach((item: any) => {
          tokensByStatus[item._id] = item.count;
        });
      }

      return {
        statusCounts,
        tokensByStatus,
        recentActivity: Array.isArray(recentActivity) ? recentActivity.length : 0,
        suppressedAlerts: Array.isArray(suppressedAlerts) ? suppressedAlerts.length : 0,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      logger.error('❌ Error getting system stats:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('🔻 Shutting down Classification Integration Service...');
    
    // FIXED: Use stop() instead of shutdown()
    if (this.schedulerService) await this.schedulerService.stop();
    
    this.isInitialized = false;
    logger.info('✅ Shutdown complete');
  }

  // FIXED: Add method to set database connection after construction
  setDatabaseConnection(db: Db): void {
    this.db = db;
    this.performanceService = new PerformanceMonitoringService(db);
    this.alertService = new AlertSystemService(this.performanceService);
    logger.info('Database connection configured - Performance monitoring and alerts enabled');
  }

  // Helper method to check if full functionality is available
  hasFullFunctionality(): boolean {
    return !!(this.db && this.performanceService && this.alertService);
  }
}

export default ClassificationIntegrationService;