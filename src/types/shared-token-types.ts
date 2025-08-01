// src/types/shared-token-types.ts

/**
 * Shared token types to prevent schema duplication across services
 */

export type TokenStatus = 'fresh' | 'established' | 'rejected' | 'watchlist' | 'dormant' | 'unqualified';

export interface TokenMetrics {
  age_minutes: number;
  tx_count: number;
  holder_count: number;
  metadata_verified: boolean;
  volume_24h?: number;
  liquidity_usd?: number;
  smart_wallet_entries?: number;
}

export interface TokenSnapshot extends TokenMetrics {
  token_address: string;
  edge_score: number;
  classification: TokenStatus;
  timestamp: Date;
}

export interface TokenSignals {
  smart_wallet_activity: boolean;
  volume_spike: boolean;
  pattern_signal_spike: boolean;
  metadata_changed?: boolean;
  holder_growth?: boolean;
}

export interface ClassificationUpdate {
  token_address: string;
  new_status: TokenStatus;
  reason: string;
  edge_score: number;
  metrics: TokenMetrics;
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

export interface AlertThresholdsConfig {
  ultraPremium: number;
  highConfidence: number;
  smartMoney: number;
  watchlistMinimum: number;
}

export interface TokenProcessingResult {
  token_address: string;
  edge_score: number;
  classification: TokenStatus;
  reason: string;
  metrics: TokenMetrics;
  signals?: TokenSignals;
}

export interface ClassificationValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ReclassificationRule {
  id: string;
  priority: number;
  condition: (record: any, context: ReclassificationContext) => boolean;
  action: (record: any, context: ReclassificationContext) => {
    newStatus: TokenStatus;
    reason: string;
    flags: any;
  };
  description?: string;
  category?: 'safety' | 'opportunity' | 'pattern' | 'performance';
}

export interface ClassificationChange {
  hasChanged: boolean;
  changeType: 'status' | 'score' | 'both' | 'none';
  scoreDiff?: number;
  statusChange?: { from: TokenStatus; to: TokenStatus };
  timestamp: Date;
}

export interface TokenClassificationHistory {
  token_address: string;
  current_status: TokenStatus;
  previous_status?: TokenStatus;
  edge_score: number;
  first_detected_at: Date;
  last_updated_at: Date;
  total_reevaluations: number;
  flags: {
    is_late_blooming: boolean;
    is_early_established: boolean;
    is_delayed_hot: boolean;
    is_false_positive: boolean;
    is_reborn: boolean;
    is_edge_plateau: boolean;
    is_echo: boolean;
    is_sidecar: boolean;
    is_reversal: boolean;
  };
}

/**
 * Validation utilities for shared types
 */
export class TokenTypeValidator {
  static validateTokenMetrics(metrics: any): ClassificationValidationResult {
    const errors: string[] = [];

    if (!metrics || typeof metrics !== 'object') {
      errors.push('metrics must be an object');
      return { isValid: false, errors };
    }

    if (typeof metrics.age_minutes !== 'number' || metrics.age_minutes < 0) {
      errors.push('age_minutes must be a non-negative number');
    }

    if (typeof metrics.tx_count !== 'number' || metrics.tx_count < 0) {
      errors.push('tx_count must be a non-negative number');
    }

    if (typeof metrics.holder_count !== 'number' || metrics.holder_count < 0) {
      errors.push('holder_count must be a non-negative number');
    }

    if (typeof metrics.metadata_verified !== 'boolean') {
      errors.push('metadata_verified must be a boolean');
    }

    if (metrics.volume_24h !== undefined && (typeof metrics.volume_24h !== 'number' || metrics.volume_24h < 0)) {
      errors.push('volume_24h must be a non-negative number');
    }

    if (metrics.liquidity_usd !== undefined && (typeof metrics.liquidity_usd !== 'number' || metrics.liquidity_usd < 0)) {
      errors.push('liquidity_usd must be a non-negative number');
    }

    if (metrics.smart_wallet_entries !== undefined && (typeof metrics.smart_wallet_entries !== 'number' || metrics.smart_wallet_entries < 0)) {
      errors.push('smart_wallet_entries must be a non-negative number');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateTokenStatus(status: any): boolean {
    const validStatuses: TokenStatus[] = ['fresh', 'established', 'rejected', 'watchlist', 'dormant', 'unqualified'];
    return validStatuses.includes(status);
  }

  static validateEdgeScore(score: any): boolean {
    return typeof score === 'number' && score >= 0 && score <= 100 && !isNaN(score);
  }
}

/**
 * Helper functions for token type operations
 */
export class TokenTypeHelpers {
  static createTokenSnapshot(
    address: string,
    metrics: TokenMetrics,
    edgeScore: number,
    classification: TokenStatus
  ): TokenSnapshot {
    return {
      token_address: address,
      edge_score: edgeScore,
      classification,
      timestamp: new Date(),
      ...metrics
    };
  }

  static calculateAgeMinutes(firstDetectedAt: Date): number {
    return Math.floor((Date.now() - firstDetectedAt.getTime()) / 60000);
  }

  static isSignificantScoreChange(oldScore: number, newScore: number, threshold: number = 5): boolean {
    return Math.abs(oldScore - newScore) >= threshold;
  }

  static formatClassificationChange(change: ClassificationChange): string {
    switch (change.changeType) {
      case 'status':
        return `${change.statusChange?.from} → ${change.statusChange?.to}`;
      case 'score':
        return `Score Δ${change.scoreDiff}`;
      case 'both':
        return `${change.statusChange?.from} → ${change.statusChange?.to}, Score Δ${change.scoreDiff}`;
      default:
        return 'No change';
    }
  }
}