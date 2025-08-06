import { Schema, model, Document, CallbackError, Model } from 'mongoose';
import logger from '../utils/logger';

// Define the reclassification flags interface
export interface ReclassificationFlags {
  is_late_blooming?: boolean;
  is_early_established?: boolean;
  is_delayed_hot?: boolean;
  is_false_positive?: boolean;
  is_reborn?: boolean;
  is_edge_plateau?: boolean;
  is_echo?: boolean;
  is_sidecar?: boolean;
  is_reversal?: boolean;
}

// Define the main document interface
export interface IClassificationHistory extends Document {
  token_address: string;
  current_status: 'fresh-gem' | 'established' | 'rejected' | 'under-review';
  previous_status?: 'fresh-gem' | 'established' | 'rejected' | 'under-review' | null;
  status_changed_at: Date;
  reason: string;
  edge_score: number;
  age_minutes: number;
  tx_count: number;
  holder_count: number;
  metadata_verified: boolean;
  first_detected_at: Date;
  last_reevaluated_at: Date;
  reevaluation_count: number;
  smart_wallet_entries: number;
  volume_24h: number;
  liquidity_usd: number;
  reclassificationFlags: ReclassificationFlags;
  alert_suppressed: boolean;
  alert_suppressed_until?: Date | null;
  alert_suppressed_reason?: string | null;
  source: 'manual' | 'batch_processor' | 'webhook' | 'scheduled_task';
  updated_by: string;
  schema_version: number;
  change_count: number;
  created_at: Date;
  updated_at: Date;

  // Instance methods
  getIsLateBlooming(): boolean;
  getIsEarlyEstablished(): boolean;
  getIsDelayedHot(): boolean;
  getIsFalsePositive(): boolean;
  getIsReborn(): boolean;
  getIsEdgePlateau(): boolean;
  getIsEcho(): boolean;
  getIsSidecar(): boolean;
  getIsReversal(): boolean;
}
export interface IClassificationHistoryModel extends Model<IClassificationHistory> {
  getStatusCounts(): Promise<any>; // You can strongly type this if you want
  findByStatus(status: string, limit?: number): any;
  findByEdgeScore(minScore: number, limit?: number): any;
  findBySource(source: string, limit?: number): any;
  findSuppressedAlerts(): any;
}

// Define the schema with proper typing
const classificationHistorySchema = new Schema<IClassificationHistory>({
  token_address: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: (v: string): boolean => {
        return Boolean(v && v.length >= 32 && v.length <= 44);
      },
      message: 'Token address must be a valid Solana address (32-44 characters)'
    }
  },
  current_status: {
    type: String,
    enum: ['fresh-gem', 'established', 'rejected', 'under-review'],
    required: true,
    index: true
  },
  previous_status: {
    type: String,
    enum: ['fresh-gem', 'established', 'rejected', 'under-review'],
    default: null
  },
  status_changed_at: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500,
    validate: {
      validator: (v: string): boolean => {
        return Boolean(v && v.trim().length > 0);
      },
      message: 'Reason cannot be empty'
    }
  },
  edge_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true,
    validate: {
      validator: (v: number): boolean => {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Edge score must be a valid number'
    }
  },
  age_minutes: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  tx_count: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  holder_count: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  metadata_verified: {
    type: Boolean,
    required: true,
    default: false
  },
  first_detected_at: {
    type: Date,
    required: true,
    index: true
  },
  last_reevaluated_at: {
    type: Date,
    required: true,
    index: true
  },
  reevaluation_count: {
    type: Number,
    default: 0,
    min: 0
  },
  smart_wallet_entries: {
    type: Number,
    default: 0,
    min: 0
  },
  volume_24h: {
    type: Number,
    default: 0,
    min: 0
  },
  liquidity_usd: {
    type: Number,
    default: 0,
    min: 0
  },
  reclassificationFlags: {
    is_late_blooming: { type: Boolean, default: false },
    is_early_established: { type: Boolean, default: false },
    is_delayed_hot: { type: Boolean, default: false },
    is_false_positive: { type: Boolean, default: false },
    is_reborn: { type: Boolean, default: false },
    is_edge_plateau: { type: Boolean, default: false },
    is_echo: { type: Boolean, default: false },
    is_sidecar: { type: Boolean, default: false },
    is_reversal: { type: Boolean, default: false }
  },
  alert_suppressed: {
    type: Boolean,
    default: false,
    index: true
  },
  alert_suppressed_until: {
    type: Date,
    default: null
  },
  alert_suppressed_reason: {
    type: String,
    default: null,
    maxlength: 200
  },
  source: {
    type: String,
    enum: ['manual', 'batch_processor', 'webhook', 'scheduled_task'],
    required: true,
    index: true
  },
  updated_by: {
    type: String,
    required: true,
    default: 'system',
    maxlength: 100
  },
  schema_version: {
    type: Number,
    required: true,
    default: 2,
    index: true
  },
  change_count: {
    type: Number,
    default: 0,
    min: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { updatedAt: 'updated_at' },
  collection: 'classification_history'
});

// Pre-save middleware with proper typing
classificationHistorySchema.pre<IClassificationHistory>('save', function(next) {
  try {
    // Increment change count on modifications
    if (this.isModified() && !this.isNew) {
      this.change_count = (this.change_count || 0) + 1;
    }

    // Log significant changes
    if (this.isModified('current_status') || 
        (this.isModified('edge_score') && Math.abs((this.edge_score || 0) - (Number(this.get('edge_score')) || 0)) >= 5)) {
      logger.info('Classification updated', {
        token: this.token_address,
        status: this.current_status,
        edge_score: this.edge_score
      });
    }

    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

// Add compound indexes
classificationHistorySchema.index({ current_status: 1, edge_score: -1 });
classificationHistorySchema.index({ current_status: 1, first_detected_at: -1 });
classificationHistorySchema.index({ edge_score: -1, last_reevaluated_at: -1 });
classificationHistorySchema.index({ alert_suppressed: 1, current_status: 1 });
classificationHistorySchema.index({ source: 1, created_at: -1 });

// Instance Methods with proper typing
classificationHistorySchema.methods.getIsLateBlooming = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_late_blooming || false;
};

classificationHistorySchema.methods.getIsEarlyEstablished = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_early_established || false;
};

classificationHistorySchema.methods.getIsDelayedHot = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_delayed_hot || false;
};

classificationHistorySchema.methods.getIsFalsePositive = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_false_positive || false;
};

classificationHistorySchema.methods.getIsReborn = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_reborn || false;
};

classificationHistorySchema.methods.getIsEdgePlateau = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_edge_plateau || false;
};

classificationHistorySchema.methods.getIsEcho = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_echo || false;
};

classificationHistorySchema.methods.getIsSidecar = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_sidecar || false;
};

classificationHistorySchema.methods.getIsReversal = function(this: IClassificationHistory): boolean {
  return this.reclassificationFlags?.is_reversal || false;
};

// Static Methods
classificationHistorySchema.statics.findByStatus = function(status: string, limit: number = 50) {
  return this.find({ current_status: status })
    .sort({ edge_score: -1, created_at: -1 })
    .limit(limit);
};

classificationHistorySchema.statics.findByEdgeScore = function(minScore: number, limit: number = 50) {
  return this.find({ 
    edge_score: { $gte: minScore },
    current_status: { $in: ['fresh-gem', 'established'] }
  })
    .sort({ edge_score: -1, created_at: -1 })
    .limit(limit);
};

classificationHistorySchema.statics.findBySource = function(source: string, limit: number = 50) {
  return this.find({ source })
    .sort({ created_at: -1 })
    .limit(limit);
};

classificationHistorySchema.statics.getStatusCounts = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$current_status',
        count: { $sum: 1 },
        avg_edge_score: { $avg: '$edge_score' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

classificationHistorySchema.statics.findSuppressedAlerts = function() {
  return this.find({
    alert_suppressed: true,
    $or: [
      { alert_suppressed_until: null },
      { alert_suppressed_until: { $gt: new Date() } }
    ]
  }).sort({ created_at: -1 });
};

// Export the model
export const ClassificationHistory = model<IClassificationHistory, IClassificationHistoryModel>('ClassificationHistory', classificationHistorySchema);
export default ClassificationHistory;