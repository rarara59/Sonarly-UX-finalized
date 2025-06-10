// src/services/classification-integration.service.ts

import { ClassificationHistoryService, TokenStatus } from './classification-history.service';
import { ReclassificationSchedulerService, ReclassificationEvent } from './reclassification-scheduler.service';
import { AlertSystemService } from './alert-system.service';
import { logger } from '../utils/logger';

export interface TokenProcessingResult {
  token_address: string;
  edge_score: number;
  classification: TokenStatus;
  reason: string;
  metrics: {
    age_minutes: number;
    tx_count: number;
    holder_count: number;
    metadata_verified: boolean;
    volume_24h?: number;
    liquidity_usd?: number;
    smart_wallet_entries?: number;
  };
  signals?: {
    smart_wallet_activity: boolean;
    volume_spike: boolean;
    pattern_signal_spike: boolean;
  };
}

export class ClassificationIntegrationService {
  private classificationService: ClassificationHistoryService;
  private schedulerService: ReclassificationSchedulerService;
  private alertService: AlertSystemService;

  constructor() {
    this.classificationService = new ClassificationHistoryService();
    this.schedulerService = new ReclassificationSchedulerService();
    this.alertService = new AlertSystemService();
  }

  /**
   * Initialize the classification system
   */
  async initialize(): Promise<void> {
    logger.info('Initializing classification integration system...');
    
    try {
      // Start the reclassification scheduler
      await this.schedulerService.start();
      
      logger.info('Classification integration system initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize classification integration system:', error);
      throw error;
    }
  }

  /**
   * Process a token through the classification system
   * This is called from your existing BatchTokenProcessor
   */
  async processToken(result: TokenProcessingResult): Promise<{
    shouldAlert: boolean;
    classification: TokenStatus;
    reason: string;
  }> {
    try {
      // Check if token already exists in classification history
      const existingClassification = await this.classificationService.getClassification(result.token_address);
      
      // Determine initial classification based on edge score and metrics
      const classification = this.determineInitialClassification(result);
      
      // Update classification history
      await this.classificationService.updateClassification({
        token_address: result.token_address,
        new_status: classification,
        reason: result.reason,
        edge_score: result.edge_score,
        age_minutes: result.metrics.age_minutes,
        tx_count: result.metrics.tx_count,
        holder_count: result.metrics.holder_count,
        metadata_verified: result.metrics.metadata_verified,
        volume_24h: result.metrics.volume_24h,
        liquidity_usd: result.metrics.liquidity_usd,
        smart_wallet_entries: result.metrics.smart_wallet_entries
      });

      // Check if alerts should be suppressed
      const alertSuppressed = await this.classificationService.isAlertSuppressed(result.token_address);
      
      // Determine if we should send an alert
      const shouldAlert = this.shouldSendAlert(classification, result.edge_score, alertSuppressed);

      // Generate reclassification events if needed
      if (result.signals) {
        this.generateReclassificationEvents(result);
      }

      logger.info(`Processed token ${result.token_address}: ${classification} (edge: ${result.edge_score}, alert: ${shouldAlert})`);

      return {
        shouldAlert,
        classification,
        reason: result.reason
      };

    } catch (error) {
      logger.error(`Error processing token ${result.token_address}:`, error);
      throw error;
    }
  }

  /**
   * Determine initial classification based on token metrics
   */
  private determineInitialClassification(result: TokenProcessingResult): TokenStatus {
    const { edge_score, metrics } = result;
    
    // High confidence tokens (≥85 edge score)
    if (edge_score >= 85) {
      if (metrics.age_minutes <= 30) {
        return 'fresh';
      } else if (metrics.age_minutes <= 1440) { // 24 hours
        return 'established';
      } else {
        return 'watchlist';
      }
    }
    
    // Medium confidence tokens (70-84 edge score)
    if (edge_score >= 70) {
      return 'watchlist';
    }
    
    // Low confidence tokens (< 70 edge score)
    if (edge_score < 50) {
      return 'rejected';
    }
    
    return 'unqualified';
  }

  /**
   * Determine if an alert should be sent
   */
  private shouldSendAlert(classification: TokenStatus, edgeScore: number, alertSuppressed: boolean): boolean {
    if (alertSuppressed) return false;
    
    // Ultra-Premium alerts (≥92 edge score)
    if (edgeScore >= 92 && ['fresh', 'established'].includes(classification)) {
      return true;
    }
    
    // High-Confidence alerts (≥85 edge score)
    if (edgeScore >= 85 && ['fresh', 'established'].includes(classification)) {
      return true;
    }
    
    // Smart-Money signals (watchlist with smart wallet activity)
    if (classification === 'watchlist' && edgeScore >= 75) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate reclassification events based on token signals
   */
  private generateReclassificationEvents(result: TokenProcessingResult): void {
    if (!result.signals) return;

    const events: ReclassificationEvent[] = [];

    if (result.signals.smart_wallet_activity) {
      events.push({
        type: 'smart_wallet_entry',
        token_address: result.token_address,
        timestamp: new Date(),
        data: { 
          edge_score: result.edge_score,
          smart_wallet_entries: result.metrics.smart_wallet_entries 
        }
      });
    }

    if (result.signals.volume_spike) {
      events.push({
        type: 'volume_spike',
        token_address: result.token_address,
        timestamp: new Date(),
        data: { 
          volume_24h: result.metrics.volume_24h,
          edge_score: result.edge_score 
        }
      });
    }

    if (result.signals.pattern_signal_spike) {
      events.push({
        type: 'tx_surge',
        token_address: result.token_address,
        timestamp: new Date(),
        data: { 
          tx_count: result.metrics.tx_count,
          edge_score: result.edge_score 
        }
      });
    }

    // Add events to scheduler queue
    events.forEach(event => this.schedulerService.addEvent(event));
  }

  /**
   * Handle external events (webhook, API, etc.)
   */
  async handleExternalEvent(event: {
    type: 'metadata_change' | 'lp_update' | 'honeypot_detected' | 'rug_detected';
    token_address: string;
    data: any;
  }): Promise<void> {
    const reclassificationEvent: ReclassificationEvent = {
      type: event.type as any,
      token_address: event.token_address,
      timestamp: new Date(),
      data: event.data
    };

    this.schedulerService.addEvent(reclassificationEvent);

    // Handle immediate suppression for honeypots/rugs
    if (['honeypot_detected', 'rug_detected'].includes(event.type)) {
      await this.classificationService.suppressAlerts(
        event.token_address,
        `${event.type.replace('_', ' ')} detected`,
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      );
    }
  }

  /**
   * Get classification status for a token
   */
  async getTokenStatus(token_address: string): Promise<{
    classification: TokenStatus | null;
    edgeScore: number | null;
    ageMinutes: number | null;
    alertSuppressed: boolean;
    reclassificationFlags: string[];
  }> {
    const record = await this.classificationService.getClassification(token_address);
    
    if (!record) {
      return {
        classification: null,
        edgeScore: null,
        ageMinutes: null,
        alertSuppressed: false,
        reclassificationFlags: []
      };
    }

    const ageMinutes = Math.floor((Date.now() - record.first_detected_at.getTime()) / 60000);
    const alertSuppressed = await this.classificationService.isAlertSuppressed(token_address);
    
    const flags = [];
    if (record.is_late_blooming) flags.push('late_blooming');
    if (record.is_early_established) flags.push('early_established');
    if (record.is_delayed_hot) flags.push('delayed_hot');
    if (record.is_false_positive) flags.push('false_positive');
    if (record.is_reborn) flags.push('reborn');
    if (record.is_edge_plateau) flags.push('edge_plateau');
    if (record.is_echo) flags.push('echo');
    if (record.is_sidecar) flags.push('sidecar');
    if (record.is_reversal) flags.push('reversal');

    return {
      classification: record.current_status,
      edgeScore: record.edge_score,
      ageMinutes,
      alertSuppressed,
      reclassificationFlags: flags
    };
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    totalTokens: number;
    tokensByStatus: Record<TokenStatus, number>;
    reclassificationStats: Record<string, number>;
    schedulerStatus: any;
  }> {
    // This would query your classification history for stats
    const schedulerStatus = this.schedulerService.getStatus();
    
    return {
      totalTokens: 0, // Implement actual count
      tokensByStatus: {
        fresh: 0,
        established: 0,
        rejected: 0,
        watchlist: 0,
        dormant: 0,
        unqualified: 0
      },
      reclassificationStats: {
        late_blooming: 0,
        early_established: 0,
        delayed_hot: 0,
        false_positive: 0,
        reborn: 0,
        edge_plateau: 0,
        echo: 0,
        sidecar: 0,
        reversal: 0
      },
      schedulerStatus
    };
  }

  /**
   * Shutdown the classification system
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down classification integration system...');
    await this.schedulerService.stop();
    logger.info('Classification integration system shutdown complete');
  }
}