// Import IWalletTransaction from your models to extend it
import { IWalletTransaction, IExternalWallet } from '../models/externalWallet';

/**
 * Extends the base wallet transaction with timeframe and performance metrics
 */
export interface ClassifiedTransaction extends IWalletTransaction {
  timeframe: 'fast' | 'slow' | 'other';
  holdTimeMinutes: number;
  multiplier: number;
  meta?: {
    timeframeSuccessRate?: number;
    isMemeToken?: boolean;
    entryTimingScore?: number;
  };
}

/**
 * Interface for timeframe-specific performance metrics
 */
export interface TimeframeMetrics {
  totalTrades: number;
  successfulTrades: number;
  winRate: number;
  avgMultiplier: number;
  avgHoldTime: number;
}

/**
 * Enhanced wallet data with additional analytics and metrics
 */
export interface EnhancedWalletData extends Partial<IExternalWallet> {
  fastTimeframeMetrics?: TimeframeMetrics;
  slowTimeframeMetrics?: TimeframeMetrics;
  memeTokenMetrics?: {
    totalTrades: number;
    successfulTrades: number;
    winRate: number;
    avgMultiplier: number;
  };
  patternSuccessRates?: Record<string, number>;
  entryTiming?: number;
  exitEfficiency?: number;
  recentTransactions?: ClassifiedTransaction[];
  predictedSuccessRate?: number;
  confidenceScore?: number;
  categoryCrossover?: string[];
  returns4xConsistency?: number;
}