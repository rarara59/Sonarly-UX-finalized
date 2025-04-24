// src/types/wallet-types.ts

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

// New interfaces for wallet data import process

/**
 * Interface for imported wallet data
 */
export interface ImportedWalletData {
  address: string;
  label?: string;
  category?: string;
  externalId?: string;
  tags?: string | string[];
  
  // Performance metrics
  successRate?: number | string;
  totalTrades?: number | string;
  profitableTrades?: number | string;
  averageReturn?: number | string;
  biggestWin?: number | string;
  biggestLoss?: number | string;
  
  // Enhanced 4x metrics
  returns4xRate?: number | string;
  avgEntryTiming?: number | string;
  avgExitEfficiency?: number | string;
  memeTokenWinRate?: number | string;
  memeTokenAvgMultiplier?: number | string;
  fastTimeframePreference?: number | string;
  slowTimeframePreference?: number | string;
  highVolatilitySuccess?: number | string;
  
  // Pattern metrics
  patternMetrics?: string | any[] | Record<string, any>;
  
  // Additional fields
  lastActivity?: string | Date;
  followers?: number | string;
  riskScore?: number | string;
  trustScore?: number | string;
  knownTokens?: string | string[];
  targetedTimeframes?: string | string[];
  primaryStrategies?: string | string[];
  recentTokens?: string | string[];
  achieves4xScore?: number | string;
  
  // Pattern specific fields
  pattern1Type?: string;
  pattern1Success?: number | string;
  pattern1Multiplier?: number | string;
  pattern1HoldTime?: number | string;
  pattern1SampleSize?: number | string;
  // ...up to pattern5
  
  [key: string]: any; // Allow additional fields
}

/**
 * Interface for wallet data validation result
 */
export interface WalletDataValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Interface for pattern metrics
 */
export interface PatternMetric {
  patternType: string;
  successRate: number;
  avgMultiplier: number;
  avgHoldTime: number;
  sampleSize: number;
  lastUpdated: Date;
}

/**
 * Interface for meme token metrics
 */
export interface MemeTokenMetrics {
  returns4xRate: number;
  avgEntryTiming: number;
  avgExitEfficiency: number;
  memeTokenWinRate: number;
  memeTokenAvgMultiplier: number;
  fastTimeframePreference: number;
  slowTimeframePreference: number;
  highVolatilitySuccess: number;
}

/**
 * Interface for wallet performance
 */
export interface WalletPerformance {
  successRate: number;
  totalTrades: number;
  profitableTrades: number;
  averageReturn: number;
  biggestWin: number;
  biggestLoss: number;
}