// src/models/classificationHistory.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IClassificationHistory extends Document {
  token_address: string;
  current_status: 'fresh' | 'established' | 'rejected' | 'watchlist' | 'dormant' | 'unqualified';
  previous_status?: 'fresh' | 'established' | 'rejected' | 'watchlist' | 'dormant' | 'unqualified';
  updated_at: Date;
  reason: string;
  edge_score: number;
  age_minutes: number;
  tx_count: number;
  holder_count: number;
  metadata_verified: boolean;
  
  // Additional fields for reclassification logic
  first_detected_at: Date;
  last_reevaluated_at: Date;
  reevaluation_count: number;
  smart_wallet_entries: number;
  volume_24h?: number;
  liquidity_usd?: number;
  
  // Flags for specific use cases
  is_late_blooming: boolean;
  is_early_established: boolean;
  is_delayed_hot: boolean;
  is_false_positive: boolean;
  is_reborn: boolean;
  is_edge_plateau: boolean;
  is_echo: boolean;
  is_sidecar: boolean;
  is_reversal: boolean;
  
  // Alert suppression
  alert_suppressed: boolean;
  alert_suppressed_until?: Date;
  alert_suppressed_reason?: string;
}

const ClassificationHistorySchema: Schema = new Schema({
  token_address: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  current_status: {
    type: String,
    enum: ['fresh', 'established', 'rejected', 'watchlist', 'dormant', 'unqualified'],
    required: true,
    index: true
  },
  previous_status: {
    type: String,
    enum: ['fresh', 'established', 'rejected', 'watchlist', 'dormant', 'unqualified'],
    default: null
  },
  updated_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  reason: {
    type: String,
    required: true
  },
  edge_score: {
    type: Number,
    required: true,
    index: true
  },
  age_minutes: {
    type: Number,
    required: true,
    index: true
  },
  tx_count: {
    type: Number,
    required: true,
    default: 0
  },
  holder_count: {
    type: Number,
    required: true,
    default: 0
  },
  metadata_verified: {
    type: Boolean,
    required: true,
    default: false
  },
  
  // Additional tracking fields
  first_detected_at: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  last_reevaluated_at: {
    type: Date,
    default: Date.now
  },
  reevaluation_count: {
    type: Number,
    default: 0
  },
  smart_wallet_entries: {
    type: Number,
    default: 0
  },
  volume_24h: {
    type: Number,
    default: 0
  },
  liquidity_usd: {
    type: Number,
    default: 0
  },
  
  // Use case flags
  is_late_blooming: {
    type: Boolean,
    default: false,
    index: true
  },
  is_early_established: {
    type: Boolean,
    default: false,
    index: true
  },
  is_delayed_hot: {
    type: Boolean,
    default: false,
    index: true
  },
  is_false_positive: {
    type: Boolean,
    default: false,
    index: true
  },
  is_reborn: {
    type: Boolean,
    default: false,
    index: true
  },
  is_edge_plateau: {
    type: Boolean,
    default: false,
    index: true
  },
  is_echo: {
    type: Boolean,
    default: false,
    index: true
  },
  is_sidecar: {
    type: Boolean,
    default: false,
    index: true
  },
  is_reversal: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Alert suppression
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
    default: null
  }
}, {
  timestamps: true,
  collection: 'classification_history'
});

// Compound indexes for efficient queries
ClassificationHistorySchema.index({ current_status: 1, age_minutes: 1 });
ClassificationHistorySchema.index({ current_status: 1, edge_score: -1 });
ClassificationHistorySchema.index({ first_detected_at: 1, current_status: 1 });
ClassificationHistorySchema.index({ last_reevaluated_at: 1, current_status: 1 });
ClassificationHistorySchema.index({ alert_suppressed: 1, alert_suppressed_until: 1 });

// TTL index for automatic cleanup of old rejected tokens (optional)
ClassificationHistorySchema.index(
  { updated_at: 1 }, 
  { 
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: { current_status: 'rejected' }
  }
);

export const ClassificationHistory = mongoose.model<IClassificationHistory>(
  'ClassificationHistory', 
  ClassificationHistorySchema
);