import { 
  ClassificationHistory, 
  IClassificationHistory
} from '../models/classificationHistory';
import { ClassificationAuditTrail } from '../models/classificationAuditTrail';
import logger from '../utils/logger';

// Define types locally to avoid conflicts
type TokenStatus = 'fresh-gem' | 'established' | 'rejected' | 'under-review';

interface ClassificationChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'status_change' | 'edge_score_update' | 'flag_update';
}

interface ClassificationUpdate {
  current_status?: TokenStatus;
  previous_status?: TokenStatus;
  reason?: string;
  edge_score?: number;
  tx_count?: number;
  holder_count?: number;
  metadata_verified?: boolean;
  reevaluation_count?: number;
  smart_wallet_entries?: number;
  volume_24h?: number;
  liquidity_usd?: number;
  reclassificationFlags?: any;
  alert_suppressed?: boolean;
  alert_suppressed_until?: Date;
  alert_suppressed_reason?: string;
  source?: 'manual' | 'batch_processor' | 'webhook' | 'scheduled_task';
  updated_by?: string;
}

interface ValidationResult {
  matches: boolean;
  score: number;
  reasons: string[];
  error?: string;
}

export class ClassificationHistoryService {
  
  async createClassification(data: any): Promise<IClassificationHistory> {
    try {
      const classification = new ClassificationHistory({
        ...data,
        first_detected_at: new Date(),
        last_reevaluated_at: new Date(),
        status_changed_at: new Date()
      });
      
      await classification.save();
      logger.info(`Created classification for ${data.token_address}: ${data.current_status}`);
      return classification;
    } catch (error) {
      logger.error('Error creating classification:', error);
      throw error;
    }
  }

  async updateClassification(tokenAddress: string, update: Partial<ClassificationUpdate>): Promise<IClassificationHistory | null> {
    try {
      const existingRecord = await ClassificationHistory.findOne({ token_address: tokenAddress });
      
      if (!existingRecord) {
        logger.warn(`No classification found for token ${tokenAddress}`);
        return null;
      }

      // Track changes for audit
      const changes: ClassificationChange[] = [];
      
      // Handle status change
      if (update.current_status && update.current_status !== existingRecord.current_status) {
        changes.push({
          field: 'current_status',
          oldValue: existingRecord.current_status,
          newValue: update.current_status,
          changeType: 'status_change'
        });
        existingRecord.previous_status = existingRecord.current_status;
        existingRecord.current_status = update.current_status;
        existingRecord.status_changed_at = new Date();
      }

      // Handle other updates
      if (update.edge_score !== undefined) {
        if (Math.abs(existingRecord.edge_score - update.edge_score) >= 5) {
          changes.push({
            field: 'edge_score',
            oldValue: existingRecord.edge_score,
            newValue: update.edge_score,
            changeType: 'edge_score_update'
          });
        }
        existingRecord.edge_score = update.edge_score;
      }

      // Update other fields
      if (update.reason) existingRecord.reason = update.reason;
      if (update.tx_count !== undefined) existingRecord.tx_count = update.tx_count;
      if (update.holder_count !== undefined) existingRecord.holder_count = update.holder_count;
      if (update.metadata_verified !== undefined) existingRecord.metadata_verified = update.metadata_verified;
      if (update.smart_wallet_entries !== undefined) existingRecord.smart_wallet_entries = update.smart_wallet_entries;
      if (update.volume_24h !== undefined) existingRecord.volume_24h = update.volume_24h;
      if (update.liquidity_usd !== undefined) existingRecord.liquidity_usd = update.liquidity_usd;
      if (update.reclassificationFlags) existingRecord.reclassificationFlags = update.reclassificationFlags;
      if (update.alert_suppressed !== undefined) existingRecord.alert_suppressed = update.alert_suppressed;
      if (update.alert_suppressed_until) existingRecord.alert_suppressed_until = update.alert_suppressed_until;
      if (update.alert_suppressed_reason) existingRecord.alert_suppressed_reason = update.alert_suppressed_reason;
      if (update.source) existingRecord.source = update.source;
      if (update.updated_by) existingRecord.updated_by = update.updated_by;

      existingRecord.last_reevaluated_at = new Date();
      existingRecord.reevaluation_count = (existingRecord.reevaluation_count || 0) + 1;

      await existingRecord.save();

      // Create audit trail for significant changes
      if (changes.length > 0) {
        await this.createAuditTrail(existingRecord, changes, update.source || 'unknown');
      }

      logger.info(`Updated classification for ${tokenAddress}`);
      return existingRecord;
    } catch (error) {
      logger.error(`Error updating classification for ${tokenAddress}:`, error);
      throw error;
    }
  }

  async getByTokenAddress(tokenAddress: string): Promise<IClassificationHistory | null> {
    try {
      return await ClassificationHistory.findOne({ token_address: tokenAddress });
    } catch (error) {
      logger.error(`Error getting classification for ${tokenAddress}:`, error);
      throw error;
    }
  }

  async getByStatus(status: TokenStatus, limit: number = 50): Promise<IClassificationHistory[]> {
    try {
      return await ClassificationHistory.find({ current_status: status })
        .sort({ edge_score: -1, created_at: -1 })
        .limit(limit);
    } catch (error) {
      logger.error(`Error getting classifications by status ${status}:`, error);
      throw error;
    }
  }

  async getHighEdgeScore(minScore: number = 85, limit: number = 50): Promise<IClassificationHistory[]> {
    try {
      return await ClassificationHistory.find({
        edge_score: { $gte: minScore },
        current_status: { $in: ['fresh-gem', 'established'] }
      })
        .sort({ edge_score: -1, created_at: -1 })
        .limit(limit);
    } catch (error) {
      logger.error(`Error getting high edge score classifications:`, error);
      throw error;
    }
  }

  async markAsDormant(tokenAddress: string, reason: string): Promise<void> {
    try {
      const existing = await ClassificationHistory.findOne({ token_address: tokenAddress });
      if (!existing) {
        logger.warn(`Cannot mark ${tokenAddress} as dormant - not found`);
        return;
      }

      existing.previous_status = existing.current_status;
      existing.current_status = 'rejected'; // Use 'rejected' instead of 'dormant'
      existing.reason = reason;
      existing.last_reevaluated_at = new Date();
      existing.status_changed_at = new Date();

      await existing.save();
      logger.info(`Marked ${tokenAddress} as dormant: ${reason}`);
    } catch (error) {
      logger.error(`Error marking ${tokenAddress} as dormant:`, error);
      throw error;
    }
  }

  async suppressAlert(tokenAddress: string, reason: string, suppressUntil?: Date): Promise<void> {
    try {
      await ClassificationHistory.updateOne(
        { token_address: tokenAddress },
        {
          $set: {
            alert_suppressed: true,
            alert_suppressed_reason: reason,
            alert_suppressed_until: suppressUntil,
            updated_at: new Date()
          }
        }
      );
      logger.info(`Suppressed alerts for ${tokenAddress}: ${reason}`);
    } catch (error) {
      logger.error(`Error suppressing alerts for ${tokenAddress}:`, error);
      throw error;
    }
  }

  async unsuppressAlert(tokenAddress: string): Promise<void> {
    try {
      await ClassificationHistory.updateOne(
        { token_address: tokenAddress },
        {
          $set: {
            alert_suppressed: false,
            alert_suppressed_reason: null,
            alert_suppressed_until: null,
            updated_at: new Date()
          }
        }
      );
      logger.info(`Unsuppressed alerts for ${tokenAddress}`);
    } catch (error) {
      logger.error(`Error unsuppressing alerts for ${tokenAddress}:`, error);
      throw error;
    }
  }

  async validateReclassification(tokenAddress: string, newStatus: TokenStatus, context: any): Promise<ValidationResult> {
    try {
      const existing = await ClassificationHistory.findOne({ token_address: tokenAddress });
      
      if (!existing) {
        return {
          matches: false,
          score: 0,
          reasons: ['Token not found in classification history'],
          error: 'Token not found'
        };
      }

      const reasons: string[] = [];
      let score = 0;

      // Validate status transition
      const validTransitions: Record<TokenStatus, TokenStatus[]> = {
        'fresh-gem': ['established', 'rejected'],
        'established': ['rejected', 'under-review'],
        'rejected': ['under-review'],
        'under-review': ['fresh-gem', 'established', 'rejected']
      };

      const allowedTransitions = validTransitions[existing.current_status];
      if (!allowedTransitions.includes(newStatus)) {
        reasons.push(`Invalid transition from ${existing.current_status} to ${newStatus}`);
      } else {
        score += 25;
        reasons.push('Valid status transition');
      }

      // Check timing constraints
      const hoursSinceLastChange = (Date.now() - existing.status_changed_at.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastChange < 1) {
        reasons.push('Recent status change (< 1 hour ago)');
      } else {
        score += 25;
        reasons.push('Sufficient time since last change');
      }

      // Validate edge score requirements
      if (context.edge_score) {
        if (newStatus === 'fresh-gem' && context.edge_score >= 75) {
          score += 25;
          reasons.push('Edge score meets fresh-gem criteria');
        } else if (newStatus === 'established' && context.edge_score >= 70) {
          score += 25;
          reasons.push('Edge score meets established criteria');
        } else if (newStatus === 'rejected' && context.edge_score < 50) {
          score += 25;
          reasons.push('Edge score supports rejection');
        } else {
          reasons.push('Edge score does not support new status');
        }
      }

      return {
        matches: score >= 75,
        score,
        reasons
      };

    } catch (error) {
      return { matches: false, score: 0, reasons: ['Validation error'], error: (error as Error).message };
    }
  }

  private async createAuditTrail(record: IClassificationHistory, changes: ClassificationChange[], source: string): Promise<void> {
    try {
      const auditRecord = new ClassificationAuditTrail({
        token_address: record.token_address,
        change_type: changes[0]?.changeType || 'status_change',
        source_service: source,
        previous_status: record.previous_status,
        new_status: record.current_status,
        previous_edge_score: changes.find(c => c.field === 'edge_score')?.oldValue,
        new_edge_score: changes.find(c => c.field === 'edge_score')?.newValue,
        field_changes: changes.map(c => ({
          field_name: c.field,
          old_value: c.oldValue,
          new_value: c.newValue,
          change_type: 'modified' as const
        })),
        processing_time_ms: 0,
        trigger_reason: record.reason || 'Classification update',
        system_context: {}
      });

      await auditRecord.save();
    } catch (error) {
      logger.error('Error creating audit trail:', error);
    }
  }

  async getRecentActivity(hours: number = 24): Promise<any[]> {
    try {
      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const records = await ClassificationHistory.find({
        status_changed_at: { $gte: cutoffDate }
      })
        .sort({ status_changed_at: -1 })
        .limit(100);

      return records.map(record => {
        // Use getter methods instead of direct property access
        const flagsSummary: string[] = [];
        if (record.getIsLateBlooming()) flagsSummary.push('late_blooming');
        if (record.getIsEarlyEstablished()) flagsSummary.push('early_established');
        if (record.getIsDelayedHot()) flagsSummary.push('delayed_hot');
        if (record.getIsFalsePositive()) flagsSummary.push('false_positive');
        if (record.getIsReborn()) flagsSummary.push('reborn');
        if (record.getIsEdgePlateau()) flagsSummary.push('edge_plateau');
        if (record.getIsEcho()) flagsSummary.push('echo');
        if (record.getIsSidecar()) flagsSummary.push('sidecar');
        if (record.getIsReversal()) flagsSummary.push('reversal');

        return {
          token_address: record.token_address,
          statusChange: { from: record.previous_status as TokenStatus, to: record.current_status as TokenStatus },
          edge_score: record.edge_score,
          timestamp: record.status_changed_at,
          reason: record.reason,
          flags: flagsSummary,
          reevaluation_count: record.reevaluation_count
        };
      });
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const [statusCounts, avgEdgeScore, totalTokens, recentChanges] = await Promise.all([
        ClassificationHistory.getStatusCounts(),
        ClassificationHistory.aggregate([
          { $group: { _id: null, avgEdgeScore: { $avg: '$edge_score' } } }
        ]),
        ClassificationHistory.countDocuments({}),
        ClassificationHistory.countDocuments({
          status_changed_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        statusCounts,
        avgEdgeScore: avgEdgeScore[0]?.avgEdgeScore || 0,
        totalTokens,
        recentChanges
      };
    } catch (error) {
      logger.error('Error getting statistics:', error);
      throw error;
    }
  }

  async findPendingReevaluations(): Promise<IClassificationHistory[]> {
    try {
      const cutoffTime = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago
      
      return await ClassificationHistory.find({
        current_status: { $in: ['fresh-gem', 'established', 'under-review'] },
        last_reevaluated_at: { $lt: cutoffTime },
        alert_suppressed: false
      })
        .sort({ edge_score: -1, last_reevaluated_at: 1 })
        .limit(50);
    } catch (error) {
      logger.error('Error finding pending reevaluations:', error);
      throw error;
    }
  }

  async bulkUpdateFlags(updates: Array<{ token_address: string; flags: any }>): Promise<void> {
    try {
      const operations = updates.map(update => ({
        updateOne: {
          filter: { token_address: update.token_address },
          update: {
            $set: {
              'reclassificationFlags': update.flags,
              updated_at: new Date()
            }
          }
        }
      }));

      const result = await ClassificationHistory.bulkWrite(operations);
      logger.info(`Bulk updated flags for ${result.modifiedCount} tokens`);
    } catch (error) {
      logger.error('Error in bulk flag update:', error);
      throw error;
    }
  }

  async applyFlagsOnly(
    token_address: string,
    flags: Partial<{
      is_late_blooming: boolean;
      is_early_established: boolean;
      is_delayed_hot: boolean;
      is_false_positive: boolean;
      is_reborn: boolean;
      is_edge_plateau: boolean;
      is_echo: boolean;
      is_sidecar: boolean;
      is_reversal: boolean;
    }>
  ): Promise<void> {
    try {
      const updateFields: any = {};
      
      Object.entries(flags).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          updateFields[`reclassificationFlags.${key}`] = value;
        }
      });

      if (Object.keys(updateFields).length === 0) {
        logger.warn(`No valid flags provided for ${token_address}`);
        return;
      }

      await ClassificationHistory.updateOne(
        { token_address },
        {
          $set: updateFields,
          updated_at: new Date()
        }
      );
      logger.debug(`Applied flags to ${token_address}:`, updateFields);
    } catch (error) {
      logger.error('Error applying flags only:', error);
      throw error;
    }
  }

  async cleanupOldRecords(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      
      const result = await ClassificationHistory.deleteMany({
        current_status: 'rejected',
        updated_at: { $lt: cutoffDate }
      });
      logger.info(`Cleaned up ${result.deletedCount} old rejected records`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old records:', error);
      throw error;
    }
  }
}