// src/services/wallet-metrics.ts
import { logger } from '../utils/logger';
import { PatternMetric } from '../types/wallet-types';

/**
 * Service for calculating wallet metrics
 */
export class WalletMetricsService {
  /**
   * Calculate predicted success rate with focus on 74-76% target
   * 
   * This function uses weighted metrics to predict likelihood of achieving
   * the target 74-76% success rate with 4x returns
   */
  public calculatePredictedSuccessRate(data: any): number {
    // Factors most relevant for targeting 74-76% success rate with 4x returns
    const memePerformanceWeight = 0.35;   // Meme token specific performance
    const generalWinRateWeight = 0.25;    // Overall win rate
    const patternSuccessWeight = 0.20;    // Success with specific patterns
    const timeframeAlignmentWeight = 0.10; // Match with target timeframes
    const entryTimingWeight = 0.10;       // Early entry ability
    
    // Extract or default the values
    const memePerformanceScore = parseFloat(data.returns4xRate) || 0;
    const generalWinRate = parseFloat(data.successRate) || 0;
    
    // Pattern success - calculate from pattern metrics if available
    let patternSuccessScore = 0;
    if (data.patternMetrics) {
      try {
        const patterns = typeof data.patternMetrics === 'string' 
          ? JSON.parse(data.patternMetrics) 
          : data.patternMetrics;
        
        if (Array.isArray(patterns) && patterns.length > 0) {
          patternSuccessScore = patterns.reduce((sum, p) => sum + (p.successRate || 0), 0) / patterns.length;
        }
      } catch (e) {
        // If parsing fails, leave patternSuccessScore as 0
        logger.warn(`Failed to parse pattern metrics for wallet ${data.address}`);
      }
    }
    
    // Timeframe alignment (how well the wallet's preference matches target timeframes)
    const targetFastPreference = 60; // Prefer fast patterns slightly more for meme coins
    const targetSlowPreference = 40;
    const fastPref = parseFloat(data.fastTimeframePreference) || 50;
    const slowPref = parseFloat(data.slowTimeframePreference) || 50;
    const fastDiff = Math.abs(fastPref - targetFastPreference);
    const slowDiff = Math.abs(slowPref - targetSlowPreference);
    const timeframeAlignmentScore = 100 - ((fastDiff + slowDiff) / 2);
    
    // Entry timing score - how early they typically get in
    const entryTimingScore = parseFloat(data.avgEntryTiming) || 0;
    
    // Calculate the weighted score
    return (
      (memePerformanceScore * memePerformanceWeight) +
      (generalWinRate * generalWinRateWeight) +
      (patternSuccessScore * patternSuccessWeight) +
      (timeframeAlignmentScore * timeframeAlignmentWeight) +
      (entryTimingScore * entryTimingWeight)
    );
  }

  /**
   * Calculate confidence score based on data quality and sample size
   */
  public calculateConfidenceScore(data: any): number {
    const predictedRate = this.calculatePredictedSuccessRate(data);
    
    // Account for sample size - more trades = more confidence
    const totalTrades = parseInt(data.totalTrades) || 0;
    const minSampleSize = 30; // Minimum trades for full confidence
    const sampleSizeFactor = Math.min(1, totalTrades / minSampleSize);
    
    // Account for recency - more recent activity = more confidence
    const lastActivity = data.lastActivity ? new Date(data.lastActivity) : new Date();
    const daysSinceActivity = (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0.5, 1 - (daysSinceActivity / 90)); // Reduce confidence for wallets inactive over 90 days
    
    // Account for data completeness
    const dataCompleteness = 
      (data.successRate ? 0.3 : 0) +
      (data.returns4xRate ? 0.3 : 0) +
      (data.avgEntryTiming ? 0.2 : 0) +
      (data.patternMetrics ? 0.2 : 0);
    
    return predictedRate * sampleSizeFactor * recencyFactor * (0.5 + 0.5 * dataCompleteness);
  }

  /**
   * Parse pattern metrics from various input formats
   */
  public parsePatternMetrics(data: any): PatternMetric[] {
    if (!data.patternMetrics) return [];
    
    try {
      // If it's a string, try to parse as JSON
      if (typeof data.patternMetrics === 'string') {
        return JSON.parse(data.patternMetrics);
      }
      
      // If it's already an array, use it directly
      if (Array.isArray(data.patternMetrics)) {
        return data.patternMetrics;
      }
      
      // If it's individual columns like pattern1Success, pattern1Type, etc.
      const patterns: PatternMetric[] = [];
      for (let i = 1; i <= 5; i++) { // Support up to 5 patterns
        const typeKey = `pattern${i}Type`;
        const successKey = `pattern${i}Success`;
        
        if (data[typeKey] && data[successKey]) {
          patterns.push({
            patternType: data[typeKey],
            successRate: parseFloat(data[successKey]),
            avgMultiplier: parseFloat(data[`pattern${i}Multiplier`]) || 0,
            avgHoldTime: parseFloat(data[`pattern${i}HoldTime`]) || 0,
            sampleSize: parseInt(data[`pattern${i}SampleSize`]) || 0,
            lastUpdated: new Date()
          });
        }
      }
      return patterns;
    } catch (e) {
      logger.warn(`Failed to parse pattern metrics: ${e}`);
      return [];
    }
  }

  /**
   * Parse array data from string format (comma separated)
   */
  public parseArrayField(value: any, defaultValue: any[] = []): any[] {
    if (!value) return defaultValue;
    
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    if (Array.isArray(value)) {
      return value;
    }
    
    return defaultValue;
  }
}

export const walletMetrics = new WalletMetricsService();