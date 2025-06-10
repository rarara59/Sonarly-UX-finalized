// src/services/classification-history.service.ts

import { ClassificationHistory, IClassificationHistory } from '../models/classificationHistory';
import { logger } from '../utils/logger';

export type TokenStatus = 'fresh' | 'established' | 'rejected' | 'watchlist' | 'dormant' | 'unqualified';

export interface ClassificationUpdate {
  token_address: string;
  new_status: TokenStatus;
  reason: string;
  edge_score: number;
  age_minutes: number;
  tx_count: number;
  holder_count: number;
  metadata_verified: boolean;
  volume_24h?: number;
  liquidity_usd?: number;
  smart_wallet_entries?: number;
}

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

export class ClassificationHistoryService {
  
  /**
   * Create or update token classification
   */
  async updateClassification(update: ClassificationUpdate): Promise<IClassificationHistory> {
    try {
      const existingRecord = await ClassificationHistory.findOne({ 
        token_address: update.token_address 
      });

      if (existingRecord) {
        // Update existing record
        existingRecord.previous_status = existingRecord.current_status;
        existingRecord.current_status = update.new_status;
        existingRecord.updated_at = new Date();
        existingRecord.reason = update.reason;
        existingRecord.edge_score = update.edge_score;
        existingRecord.age_minutes = update.age_minutes;
        existingRecord.tx_count = update.tx_count;
        existingRecord.holder_count = update.holder_count;
        existingRecord.metadata_verified = update.metadata_verified;
        existingRecord.last_reevaluated_at = new Date();
        existingRecord.reevaluation_count += 1;
        
        if (update.volume_24h !== undefined) existingRecord.volume_24h = update.volume_24h;
        if (update.liquidity_usd !== undefined) existingRecord.liquidity_usd = update.liquidity_usd;
        if (update.smart_wallet_entries !== undefined) existingRecord.smart_wallet_entries = update.smart_wallet_entries;

        return await existingRecord.save();
      } else {
        // Create new record
        const newRecord = new ClassificationHistory({
          token_address: update.token_address,
          current_status: update.new_status,
          reason: update.reason,
          edge_score: update.edge_score,
          age_minutes: update.age_minutes,
          tx_count: update.tx_count,
          holder_count: update.holder_count,
          metadata_verified: update.metadata_verified,
          volume_24h: update.volume_24h || 0,
          liquidity_usd: update.liquidity_usd || 0,
          smart_wallet_entries: update.smart_wallet_entries || 0,
          first_detected_at: new Date(),
          last_reevaluated_at: new Date(),
          reevaluation_count: 0
        });

        return await newRecord.save();
      }
    } catch (error) {
      logger.error('Error updating classification:', error);
      throw error;
    }
  }

  /**
   * Get current classification for a token
   */
  async getClassification(token_address: string): Promise<IClassificationHistory | null> {
    return await ClassificationHistory.findOne({ token_address });
  }

  /**
   * Get tokens that need reevaluation based on time windows
   */
  async getTokensForReevaluation(timeWindowMinutes: number): Promise<IClassificationHistory[]> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    return await ClassificationHistory.find({
      last_reevaluated_at: { $lt: cutoffTime },
      current_status: { $nin: ['rejected'] }, // Don't reevaluate rejected tokens
      alert_suppressed: false
    }).sort({ edge_score: -1 }).limit(100); // Prioritize by edge score
  }

  /**
   * Apply reclassification logic for the 9 use cases
   */
  async applyReclassificationLogic(
    record: IClassificationHistory, 
    context: ReclassificationContext
  ): Promise<{ shouldReclassify: boolean; newStatus?: TokenStatus; reason?: string; flags?: any }> {
    
    const ageMinutes = Math.floor((context.current_time.getTime() - record.first_detected_at.getTime()) / 60000);
    
    // 1. Late Blooming Fresh Gem (within 30m window)
    if (ageMinutes <= 30 && 
        record.current_status === 'unqualified' && 
        (context.smart_wallet_activity || context.volume_spike)) {
      return {
        shouldReclassify: true,
        newStatus: 'fresh',
        reason: 'Late blooming fresh gem - smart wallet activity detected within 30m window',
        flags: { is_late_blooming: true }
      };
    }

    // 2. Early Established Candidate (30m-24h window)
    if (ageMinutes > 30 && ageMinutes <= 1440 && 
        record.current_status === 'unqualified' &&
        (context.volume_spike || context.metadata_changed || context.holder_growth)) {
      return {
        shouldReclassify: true,
        newStatus: 'established',
        reason: 'Early established candidate - meeting established criteria within 24h',
        flags: { is_early_established: true }
      };
    }

    // 3. Delayed "Hot" Token (after 24h)
    if (ageMinutes > 1440 && 
        ['unqualified', 'rejected', 'dormant'].includes(record.current_status) &&
        (context.smart_wallet_activity || context.pattern_signal_spike)) {
      return {
        shouldReclassify: true,
        newStatus: 'watchlist',
        reason: 'Delayed hot token - surge after 24h with smart wallet re-entry',
        flags: { is_delayed_hot: true }
      };
    }

    // 4. False Positive Fresh Gem (within 5-10m)
    if (ageMinutes <= 10 && 
        record.current_status === 'fresh' &&
        (context.is_honeypot || context.is_rug)) {
      return {
        shouldReclassify: true,
        newStatus: 'rejected',
        reason: 'False positive fresh gem - honeypot/rug detected',
        flags: { is_false_positive: true, alert_suppressed: true }
      };
    }

    // 5. Reborn Token / Reused Mint
    if (context.mint_reused) {
      return {
        shouldReclassify: true,
        newStatus: 'watchlist',
        reason: 'Reborn token - mint address reused with altered metadata',
        flags: { is_reborn: true }
      };
    }

    // 6. Edge Plateau Token
    if (record.current_status === 'fresh' && 
        record.edge_score < 70 && // Edge degraded
        ageMinutes > 60 &&
        !context.volume_spike) {
      return {
        shouldReclassify: true,
        newStatus: 'dormant',
        reason: 'Edge plateau - strong initial edge flattened without rejection criteria',
        flags: { is_edge_plateau: true }
      };
    }

    // 7. Echo Token (duplicate metadata)
    if (context.similar_token_exists) {
      return {
        shouldReclassify: true,
        newStatus: 'rejected',
        reason: 'Echo token - potential spoof with similar metadata to high-performer',
        flags: { is_echo: true, alert_suppressed: true }
      };
    }

    // 8. Sidecar Token (tethered to ecosystem)
    if (context.paired_with_known_token && record.current_status === 'unqualified') {
      return {
        shouldReclassify: true,
        newStatus: 'watchlist',
        reason: 'Sidecar token - tethered to active ecosystem token',
        flags: { is_sidecar: true }
      };
    }

    // 9. Reversal Token (dump to reaccumulation)
    if (context.smart_wallet_dump_ratio !== undefined && 
        context.smart_wallet_dump_ratio < 0.3 && // More reentry than dump
        context.volume_spike &&
        record.current_status === 'rejected') {
      return {
        shouldReclassify: true,
        newStatus: 'watchlist',
        reason: 'Reversal token - smart wallet reaccumulation after initial dump',
        flags: { is_reversal: true }
      };
    }

    return { shouldReclassify: false };
  }

  /**
   * Suppress alerts for a token
   */
  async suppressAlerts(
    token_address: string, 
    reason: string, 
    suppressUntil?: Date
  ): Promise<void> {
    await ClassificationHistory.updateOne(
      { token_address },
      {
        alert_suppressed: true,
        alert_suppressed_reason: reason,
        alert_suppressed_until: suppressUntil || new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h default
      }
    );
  }

  /**
   * Check if alerts are suppressed for a token
   */
  async isAlertSuppressed(token_address: string): Promise<boolean> {
    const record = await ClassificationHistory.findOne({ token_address });
    
    if (!record || !record.alert_suppressed) return false;
    
    if (record.alert_suppressed_until && record.alert_suppressed_until < new Date()) {
      // Suppression expired, remove it
      await ClassificationHistory.updateOne(
        { token_address },
        { 
          alert_suppressed: false,
          alert_suppressed_until: null,
          alert_suppressed_reason: null
        }
      );
      return false;
    }
    
    return true;
  }

  /**
   * Get tokens by status with pagination
   */
  async getTokensByStatus(
    status: TokenStatus, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<IClassificationHistory[]> {
    return await ClassificationHistory
      .find({ current_status: status })
      .sort({ edge_score: -1, updated_at: -1 })
      .skip(offset)
      .limit(limit);
  }

  /**
   * Get audit trail for a token
   */
  async getAuditTrail(token_address: string): Promise<{
    current: IClassificationHistory | null;
    timeline: string[];
  }> {
    const record = await ClassificationHistory.findOne({ token_address });
    
    if (!record) {
      return { current: null, timeline: [] };
    }

    const timeline = [
      `${record.first_detected_at.toISOString()}: First detected`,
      `${record.updated_at.toISOString()}: ${record.previous_status || 'initial'} → ${record.current_status} (${record.reason})`,
      `Reevaluated ${record.reevaluation_count} times`,
      `Current edge score: ${record.edge_score}`
    ];

    return { current: record, timeline };
  }

  /**
   * Cleanup old records (for maintenance)
   */
  async cleanupOldRecords(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const result = await ClassificationHistory.deleteMany({
      current_status: 'rejected',
      updated_at: { $lt: cutoffDate }
    });

    logger.info(`Cleaned up ${result.deletedCount} old rejected records`);
    return result.deletedCount;
  }
}