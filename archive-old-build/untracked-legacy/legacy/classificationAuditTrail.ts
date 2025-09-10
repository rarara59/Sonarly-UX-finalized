import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// Define interfaces for nested objects
export interface FieldChange {
  field_name: string;
  old_value: any;
  new_value: any;
  change_type: 'added' | 'modified' | 'removed';
}

export interface RuleExecution {
  rule_name: string;
  rule_priority: number;
  executed_at: Date;
  execution_time_ms: number;
  result: 'passed' | 'failed' | 'skipped';
  conditions_met: string[];
  conditions_failed: string[];
}

export interface SystemContext {
  cpu_usage_percent?: number;
  memory_usage_mb?: number;
  active_connections?: number;
  queue_depth?: number;
  processing_latency_ms?: number;
}

// Define the main document interface
export interface IClassificationAuditTrail extends Document {
  token_address: string;
  audit_id: string;
  change_type: 'status_change' | 'edge_score_update' | 'flag_update' | 'alert_suppression' | 'manual_override' | 'scheduled_reevaluation' | 'external_trigger';
  source_service: string;
  correlation_id?: string;
  previous_status?: string;
  new_status?: string;
  previous_edge_score?: number;
  new_edge_score?: number;
  field_changes: FieldChange[];
  rule_executions: RuleExecution[];
  confidence_score?: number;
  processing_time_ms: number;
  batch_id?: string;
  trigger_reason: string;
  system_context: SystemContext;
  user_id?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;

  // Instance methods
  addFieldChange(fieldName: string, oldValue: any, newValue: any, changeType: 'added' | 'modified' | 'removed'): void;
  addRuleExecution(ruleName: string, priority: number, result: 'passed' | 'failed' | 'skipped', executionTimeMs: number): void;
  getChangesSummary(): string;
}

// Define the schema with proper typing - cast as any for Mongoose compatibility
const classificationAuditTrailSchema = new Schema({
  // Primary identification
  token_address: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: (v: string): boolean => {
        return Boolean(v && v.length >= 32 && v.length <= 44);
      },
      message: 'Token address must be a valid Solana address (32-44 characters)'
    }
  },
  audit_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4()
  },

  // Change classification
  change_type: {
    type: String,
    enum: ['status_change', 'edge_score_update', 'flag_update', 'alert_suppression', 'manual_override', 'scheduled_reevaluation', 'external_trigger'],
    required: true,
    index: true
  },
  source_service: {
    type: String,
    required: true,
    maxlength: 100,
    index: true
  },
  correlation_id: {
    type: String,
    index: true,
    maxlength: 100
  },

  // Status changes
  previous_status: {
    type: String,
    enum: ['fresh-gem', 'established', 'rejected', 'under-review']
  },
  new_status: {
    type: String,
    enum: ['fresh-gem', 'established', 'rejected', 'under-review']
  },

  // Edge score changes
  previous_edge_score: {
    type: Number,
    min: 0,
    max: 100
  },
  new_edge_score: {
    type: Number,
    min: 0,
    max: 100
  },

  // Detailed field changes
  field_changes: [{
    field_name: {
      type: String,
      required: true,
      maxlength: 100
    },
    old_value: Schema.Types.Mixed,
    new_value: Schema.Types.Mixed,
    change_type: {
      type: String,
      enum: ['added', 'modified', 'removed'],
      required: true
    }
  }],

  // Rule execution tracking
  rule_executions: [{
    rule_name: {
      type: String,
      required: true,
      maxlength: 100
    },
    rule_priority: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    executed_at: {
      type: Date,
      required: true,
      default: Date.now
    },
    execution_time_ms: {
      type: Number,
      required: true,
      min: 0
    },
    result: {
      type: String,
      enum: ['passed', 'failed', 'skipped'],
      required: true
    },
    conditions_met: [{
      type: String,
      maxlength: 200
    }],
    conditions_failed: [{
      type: String,
      maxlength: 200
    }]
  }],

  // Analysis metadata
  confidence_score: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  processing_time_ms: {
    type: Number,
    required: true,
    min: 0
  },
  batch_id: {
    type: String,
    index: true,
    maxlength: 100
  },
  trigger_reason: {
    type: String,
    required: true,
    maxlength: 500
  },

  // System context
  system_context: {
    cpu_usage_percent: {
      type: Number,
      min: 0,
      max: 100
    },
    memory_usage_mb: {
      type: Number,
      min: 0
    },
    active_connections: {
      type: Number,
      min: 0
    },
    queue_depth: {
      type: Number,
      min: 0
    },
    processing_latency_ms: {
      type: Number,
      min: 0
    }
  },

  // User tracking
  user_id: {
    type: String,
    maxlength: 100
  },
  user_agent: {
    type: String,
    maxlength: 500
  }
} as any, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'classification_audit_trail'
});

// Add compound indexes
classificationAuditTrailSchema.index({ token_address: 1, created_at: -1 });
classificationAuditTrailSchema.index({ change_type: 1, created_at: -1 });
classificationAuditTrailSchema.index({ source_service: 1, created_at: -1 });
classificationAuditTrailSchema.index({ batch_id: 1, created_at: -1 });
classificationAuditTrailSchema.index({ correlation_id: 1, created_at: -1 });
classificationAuditTrailSchema.index({ 'rule_executions.rule_name': 1, created_at: -1 });

// Instance Methods with proper typing
classificationAuditTrailSchema.methods.addFieldChange = function(
  this: IClassificationAuditTrail,
  fieldName: string,
  oldValue: any,
  newValue: any,
  changeType: 'added' | 'modified' | 'removed'
): void {
  const fieldChanges = this.field_changes as FieldChange[];
  fieldChanges.push({
    field_name: fieldName,
    old_value: oldValue,
    new_value: newValue,
    change_type: changeType
  });
};

classificationAuditTrailSchema.methods.addRuleExecution = function(
  this: IClassificationAuditTrail,
  ruleName: string,
  priority: number,
  result: 'passed' | 'failed' | 'skipped',
  executionTimeMs: number
): void {
  const ruleExecutions = this.rule_executions as RuleExecution[];
  ruleExecutions.push({
    rule_name: ruleName,
    rule_priority: priority,
    executed_at: new Date(),
    execution_time_ms: executionTimeMs,
    result,
    conditions_met: [],
    conditions_failed: []
  });
};

classificationAuditTrailSchema.methods.getChangesSummary = function(this: IClassificationAuditTrail): string {
  const fieldChanges = this.field_changes as FieldChange[];
  if (!fieldChanges || fieldChanges.length === 0) {
    return 'No field changes recorded';
  }

  const summary = fieldChanges.map((change: FieldChange) => {
    return `${change.field_name}: ${change.old_value} → ${change.new_value} (${change.change_type})`;
  }).join(', ');

  return summary;
};

// Static Methods
classificationAuditTrailSchema.statics.getTokenHistory = function(tokenAddress: string, limit: number = 50) {
  if (tokenAddress === 'ALL') {
    return this.find({})
      .sort({ created_at: -1 })
      .limit(limit);
  }
  
  return this.find({ token_address: tokenAddress })
    .sort({ created_at: -1 })
    .limit(limit);
};

classificationAuditTrailSchema.statics.getChangesByType = function(changeType: string, daysBack: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  return this.find({
    change_type: changeType,
    created_at: { $gte: cutoffDate }
  }).sort({ created_at: -1 });
};

classificationAuditTrailSchema.statics.getRulePerformance = function(ruleName?: string, daysBack: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  const pipeline: any[] = [
    {
      $match: {
        created_at: { $gte: cutoffDate },
        'rule_executions.0': { $exists: true }
      }
    },
    { $unwind: '$rule_executions' }
  ];
  
  if (ruleName) {
    pipeline.push({
      $match: { 'rule_executions.rule_name': ruleName }
    });
  }
  
  pipeline.push(
    {
      $group: {
        _id: '$rule_executions.rule_name',
        total_executions: { $sum: 1 },
        passed: {
          $sum: { $cond: [{ $eq: ['$rule_executions.result', 'passed'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$rule_executions.result', 'failed'] }, 1, 0] }
        },
        skipped: {
          $sum: { $cond: [{ $eq: ['$rule_executions.result', 'skipped'] }, 1, 0] }
        },
        avg_execution_time: { $avg: '$rule_executions.execution_time_ms' },
        max_execution_time: { $max: '$rule_executions.execution_time_ms' }
      }
    },
    {
      $addFields: {
        success_rate: {
          $round: [
            { $multiply: [{ $divide: ['$passed', '$total_executions'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { total_executions: -1 } }
  );
  
  return this.aggregate(pipeline);
};

classificationAuditTrailSchema.statics.getBatchSummary = function(batchId: string) {
  return this.aggregate([
    { $match: { batch_id: batchId } },
    {
      $group: {
        _id: '$change_type',
        count: { $sum: 1 },
        avg_processing_time: { $avg: '$processing_time_ms' },
        tokens_affected: { $addToSet: '$token_address' }
      }
    },
    {
      $addFields: {
        unique_tokens: { $size: '$tokens_affected' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Export the model
export const ClassificationAuditTrail = model<IClassificationAuditTrail>('ClassificationAuditTrail', classificationAuditTrailSchema as any);
export default ClassificationAuditTrail;