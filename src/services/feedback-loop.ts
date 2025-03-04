// src/services/feedback-loop.ts
import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import patternRecognitionService, { IPattern, PatternType, TimeframeType, PatternStatus } from './pattern-recognition-service';
import edgeCalculatorService from './edge-calculator-service';
import riskManagementService from './risk-management-service';
import smartMoneyDetectionService from './smart-money-detection';
import config from '../config';

// Types and interfaces
export interface OptimizationResult {
  optimizationType: 'patternParameters' | 'edgeFactorWeights' | 'riskParameters';
  date: Date;
  previousConfiguration: any;
  optimizedConfiguration: any;
  performanceImprovement: number;
  confidence: number;
}

export interface IPerformanceSnapshot extends Document {
  date: Date;
  patternStats: {
    totalPatterns: number;
    completedPatterns: number;
    successfulPatterns: number;
    successRate: number;
    averageReturn: number;
    byTimeframe: Record<TimeframeType, {
      successRate: number;
      averageReturn: number;
    }>;
    byPatternType: Record<PatternType, {
      count: number;
      successRate: number;
      averageReturn: number;
    }>;
  };
  edgeStats: {
    totalCalculations: number;
    calculatedCount: number;
    executedCount: number;
    expiredCount: number;
    rejectedCount: number;
    averageConfidenceScore: number;
    averageRiskRewardRatio: number;
    successRate: number;
    byConfidenceLevel: Record<string, {
      count: number;
      successRate: number;
    }>;
  };
  factorWeights: Record<string, number>;
  patternCriteria: Record<TimeframeType, Record<PatternType, any>>;
  riskParameters: {
    positionSizingMethod: string;
    maxRiskPerTrade: number;
    maxOpenPositions: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema definitions
const performanceSnapshotSchema = new Schema<IPerformanceSnapshot>({
  date: { type: Date, required: true, index: true },
  patternStats: {
    totalPatterns: { type: Number, required: true },
    completedPatterns: { type: Number, required: true },
    successfulPatterns: { type: Number, required: true },
    successRate: { type: Number, required: true },
    averageReturn: { type: Number, required: true },
    byTimeframe: { type: Schema.Types.Mixed, required: true },
    byPatternType: { type: Schema.Types.Mixed, required: true }
  },
  edgeStats: {
    totalCalculations: { type: Number, required: true },
    calculatedCount: { type: Number, required: true },
    executedCount: { type: Number, required: true },
    expiredCount: { type: Number, required: true },
    rejectedCount: { type: Number, required: true },
    averageConfidenceScore: { type: Number, required: true },
    averageRiskRewardRatio: { type: Number, required: true },
    successRate: { type: Number, required: true },
    byConfidenceLevel: { type: Schema.Types.Mixed, required: true }
  },
  factorWeights: { type: Schema.Types.Mixed, required: true },
  patternCriteria: { type: Schema.Types.Mixed, required: true },
  riskParameters: {
    positionSizingMethod: { type: String, required: true },
    maxRiskPerTrade: { type: Number, required: true },
    maxOpenPositions: { type: Number, required: true }
  }
}, { timestamps: true });

// Create model if it doesn't exist yet
const PerformanceSnapshot: Model<IPerformanceSnapshot> = mongoose.models.PerformanceSnapshot as Model<IPerformanceSnapshot> ||
  mongoose.model<IPerformanceSnapshot>('PerformanceSnapshot', performanceSnapshotSchema);

// Schema for optimization results
const optimizationResultSchema = new Schema<OptimizationResult>({
  optimizationType: { 
    type: String, 
    required: true, 
    enum: ['patternParameters', 'edgeFactorWeights', 'riskParameters'] 
  },
  date: { type: Date, required: true, default: Date.now },
  previousConfiguration: { type: Schema.Types.Mixed, required: true },
  optimizedConfiguration: { type: Schema.Types.Mixed, required: true },
  performanceImprovement: { type: Number, required: true },
  confidence: { type: Number, required: true }
}, { timestamps: true });

// Create model if it doesn't exist yet
const OptimizationResultModel = mongoose.models.OptimizationResult as Model<OptimizationResult> ||
  mongoose.model<OptimizationResult>('OptimizationResult', optimizationResultSchema);

class FeedbackLoopService {
  private logger: winston.Logger;
  private snapshotInterval: NodeJS.Timeout | null;
  private optimizationInterval: NodeJS.Timeout | null;
  private targetSuccessRate: number;
  private targetSuccessRateRange: number;
  private minOptimizationInterval: number; // Minimum hours between optimizations
  private minCompletedPatterns: number; // Minimum patterns required for optimization
  private snapshotIntervalHours: number;
  private optimizationIntervalHours: number;
  private performanceHistory: IPerformanceSnapshot[];
  private lastOptimization: Record<string, Date>;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'feedback-loop' },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
    
    // Initialize variables
    this.snapshotInterval = null;
    this.optimizationInterval = null;
    this.performanceHistory = [];
    this.lastOptimization = {
      patternParameters: new Date(0),
      edgeFactorWeights: new Date(0),
      riskParameters: new Date(0)
    };
    
    // Configuration
    this.targetSuccessRate = 75; // Target 75% success rate (midpoint of 74-76%)
    this.targetSuccessRateRange = 1; // +/- 1% acceptable range
    this.minOptimizationInterval = 24; // Minimum 24 hours between optimizations
    this.minCompletedPatterns = 50; // Need at least 50 completed patterns for optimization
    
    // Intervals
    this.snapshotIntervalHours = 6; // Take snapshots every 6 hours
    this.optimizationIntervalHours = 24; // Check for optimization daily
  }
  
  /**
   * Initialize the feedback loop service
   */
  async init(): Promise<boolean> {
    try {
      // Load recent performance history
      await this.loadPerformanceHistory();
      
      // Start the snapshot scheduler
      this.startSnapshotScheduler();
      
      // Start the optimization scheduler
      this.startOptimizationScheduler();
      
      this.logger.info('Feedback loop service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize feedback loop service:', error);
      return false;
    }
  }
  
  /**
   * Load recent performance history from database
   */
  private async loadPerformanceHistory(): Promise<void> {
    try {
      // Get last 30 days of performance snapshots
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const snapshots = await PerformanceSnapshot.find({
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: 1 });
      
      this.performanceHistory = snapshots;
      
      this.logger.info(`Loaded ${snapshots.length} performance snapshots`);
    } catch (error) {
      this.logger.error('Error loading performance history:', error);
      throw error;
    }
  }
  
  /**
   * Start the snapshot scheduler
   */
  private startSnapshotScheduler(): void {
    // Clear any existing interval
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    
    // Take snapshots at the configured interval
    this.snapshotInterval = setInterval(async () => {
      try {
        await this.takePerformanceSnapshot();
      } catch (error) {
        this.logger.error('Error in snapshot scheduler:', error);
      }
    }, this.snapshotIntervalHours * 60 * 60 * 1000);
    
    this.logger.info(`Snapshot scheduler started (interval: ${this.snapshotIntervalHours} hours)`);
  }
  
  /**
   * Start the optimization scheduler
   */
  private startOptimizationScheduler(): void {
    // Clear any existing interval
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    
    // Check for optimization opportunities at the configured interval
    this.optimizationInterval = setInterval(async () => {
      try {
        // Take a fresh snapshot before optimization
        await this.takePerformanceSnapshot();
        
        // Check if optimization is needed
        await this.checkAndOptimize();
      } catch (error) {
        this.logger.error('Error in optimization scheduler:', error);
      }
    }, this.optimizationIntervalHours * 60 * 60 * 1000);
    
    this.logger.info(`Optimization scheduler started (interval: ${this.optimizationIntervalHours} hours)`);
  }
  
  /**
   * Take a snapshot of current system performance
   */
  async takePerformanceSnapshot(): Promise<IPerformanceSnapshot> {
    try {
      // Get pattern statistics
      const patternStats = await patternRecognitionService.getPatternStats();
      
      // Get edge calculator statistics
      const edgeStats = await edgeCalculatorService.getEdgeStats();
      
      // Get additional success rate for executed edges
      const executedEdgeSuccessRate = await this.calculateExecutedEdgeSuccessRate();
      
      // Get current factor weights
      const factorWeights = this.getCurrentFactorWeights();
      
      // Get current pattern criteria
      const patternCriteria = this.getCurrentPatternCriteria();
      
      // Get risk management parameters
      const riskParameters = this.getCurrentRiskParameters();
      
      // Create snapshot
      const snapshot: Partial<IPerformanceSnapshot> = {
        date: new Date(),
        patternStats: {
          totalPatterns: patternStats.totalPatterns,
          completedPatterns: patternStats.completedPatterns,
          successfulPatterns: patternStats.successfulPatterns,
          successRate: patternStats.successRate,
          averageReturn: patternStats.averageReturn,
          byTimeframe: this.getPatternStatsByTimeframe(patternStats),
          byPatternType: patternStats.statsByType as any
        },
        edgeStats: {
          totalCalculations: edgeStats.totalCalculations,
          calculatedCount: edgeStats.calculatedCount,
          executedCount: edgeStats.executedCount,
          expiredCount: edgeStats.expiredCount,
          rejectedCount: edgeStats.rejectedCount,
          averageConfidenceScore: edgeStats.averageConfidenceScore,
          averageRiskRewardRatio: edgeStats.averageRiskRewardRatio,
          successRate: executedEdgeSuccessRate,
          byConfidenceLevel: edgeStats.byConfidenceLevel as any
        },
        factorWeights,
        patternCriteria,
        riskParameters
      };
      
      // Save snapshot to database
      const newSnapshot = new PerformanceSnapshot(snapshot);
      await newSnapshot.save();
      
      // Add to in-memory history
      this.performanceHistory.push(newSnapshot);
      
      // Keep only last 30 days in memory
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      this.performanceHistory = this.performanceHistory.filter(s => s.date >= thirtyDaysAgo);
      
      this.logger.info(`Performance snapshot taken: ${newSnapshot.patternStats.successRate.toFixed(2)}% success rate`);
      
      return newSnapshot;
    } catch (error) {
      this.logger.error('Error taking performance snapshot:', error);
      throw error;
    }
  }
  
  /**
   * Check if optimization is needed and perform it
   */
  private async checkAndOptimize(): Promise<void> {
    if (this.performanceHistory.length < 2) {
      this.logger.info('Not enough performance history for optimization');
      return;
    }
    
    // Get the latest snapshot
    const latestSnapshot = this.performanceHistory[this.performanceHistory.length - 1];
    
    // Check if we're hitting the target success rate
    const currentSuccessRate = latestSnapshot.patternStats.successRate;
    const inTargetRange = Math.abs(currentSuccessRate - this.targetSuccessRate) <= this.targetSuccessRateRange;
    
    if (inTargetRange) {
      this.logger.info(`Current success rate (${currentSuccessRate.toFixed(2)}%) is within target range (${this.targetSuccessRate ± this.targetSuccessRateRange}%)`);
      return;
    }
    
    // Check if we have enough completed patterns for meaningful optimization
    if (latestSnapshot.patternStats.completedPatterns < this.minCompletedPatterns) {
      this.logger.info(`Not enough completed patterns for optimization (${latestSnapshot.patternStats.completedPatterns}/${this.minCompletedPatterns})`);
      return;
    }
    
    // Determine what to optimize based on timing and performance
    const now = new Date();
    const hoursSinceLastPatternOptimization = (now.getTime() - this.lastOptimization.patternParameters.getTime()) / (60 * 60 * 1000);
    const hoursSinceLastEdgeOptimization = (now.getTime() - this.lastOptimization.edgeFactorWeights.getTime()) / (60 * 60 * 1000);
    const hoursSinceLastRiskOptimization = (now.getTime() - this.lastOptimization.riskParameters.getTime()) / (60 * 60 * 1000);
    
    // Prioritize optimization based on time since last optimization and potential impact
    let optimizationType: 'patternParameters' | 'edgeFactorWeights' | 'riskParameters' | null = null;
    
    // If success rate is far from target, optimize edge factors first
    if (Math.abs(currentSuccessRate - this.targetSuccessRate) > 5 && hoursSinceLastEdgeOptimization >= this.minOptimizationInterval) {
      optimizationType = 'edgeFactorWeights';
    }
    // If pattern performance is inconsistent, optimize pattern parameters
    else if (this.hasInconsistentPatternPerformance() && hoursSinceLastPatternOptimization >= this.minOptimizationInterval) {
      optimizationType = 'patternParameters';
    }
    // Otherwise, optimize risk parameters
    else if (hoursSinceLastRiskOptimization >= this.minOptimizationInterval) {
      optimizationType = 'riskParameters';
    }
    
    // Perform the selected optimization
    if (optimizationType) {
      this.logger.info(`Performing ${optimizationType} optimization`);
      
      try {
        let result: OptimizationResult | null = null;
        
        switch (optimizationType) {
          case 'patternParameters':
            result = await this.optimizePatternParameters();
            break;
          case 'edgeFactorWeights':
            result = await this.optimizeEdgeFactorWeights();
            break;
          case 'riskParameters':
            result = await this.optimizeRiskParameters();
            break;
        }
        
        if (result) {
          // Save optimization result
          await new OptimizationResultModel(result).save();
          
          // Update last optimization time
          this.lastOptimization[optimizationType] = new Date();
          
          this.logger.info(`${optimizationType} optimization completed with ${result.performanceImprovement.toFixed(2)}% improvement`);
        }
      } catch (error) {
        this.logger.error(`Error during ${optimizationType} optimization:`, error);
      }
    } else {
      this.logger.info('No optimization needed at this time');
    }
  }
  
  /**
   * Calculate success rate for executed edge calculations
   */
  private async calculateExecutedEdgeSuccessRate(): Promise<number> {
    try {
      // In production, this would analyze completed trades to determine success rate
      // For now, return a mock value close to the target
      return Math.random() * 10 + 70; // 70-80% success rate
    } catch (error) {
      this.logger.error('Error calculating executed edge success rate:', error);
      return 0;
    }
  }
  
  /**
   * Get pattern statistics by timeframe
   */
  private getPatternStatsByTimeframe(patternStats: any): Record<TimeframeType, {
    successRate: number;
    averageReturn: number;
  }> {
    // Group pattern stats by timeframe
    const byTimeframe: Record<TimeframeType, {
      count: number;
      successCount: number;
      totalReturn: number;
    }> = {
      [TimeframeType.FAST]: { count: 0, successCount: 0, totalReturn: 0 },
      [TimeframeType.SLOW]: { count: 0, successCount: 0, totalReturn: 0 }
    };
    
    // Analyze pattern stats by type
    for (const [type, stats] of Object.entries(patternStats.statsByType)) {
      const timeframe = this.getPatternTimeframe(type as PatternType);
      byTimeframe[timeframe].count += (stats as any).count;
      byTimeframe[timeframe].successCount += (stats as any).successCount;
      byTimeframe[timeframe].totalReturn += (stats as any).averageReturn * (stats as any).successCount;
    }
    
    // Calculate success rates and average returns
    return {
      [TimeframeType.FAST]: {
        successRate: byTimeframe[TimeframeType.FAST].count > 0 ? 
          (byTimeframe[TimeframeType.FAST].successCount / byTimeframe[TimeframeType.FAST].count) * 100 : 0,
        averageReturn: byTimeframe[TimeframeType.FAST].successCount > 0 ? 
          byTimeframe[TimeframeType.FAST].totalReturn / byTimeframe[TimeframeType.FAST].successCount : 0
      },
      [TimeframeType.SLOW]: {
        successRate: byTimeframe[TimeframeType.SLOW].count > 0 ? 
          (byTimeframe[TimeframeType.SLOW].successCount / byTimeframe[TimeframeType.SLOW].count) * 100 : 0,
        averageReturn: byTimeframe[TimeframeType.SLOW].successCount > 0 ? 
          byTimeframe[TimeframeType.SLOW].totalReturn / byTimeframe[TimeframeType.SLOW].successCount : 0
      }
    };
  }
  
  /**
   * Determine the timeframe for a pattern type
   */
  private getPatternTimeframe(patternType: PatternType): TimeframeType {
    const fastPatterns = [
      PatternType.BREAKOUT,
      PatternType.V_RECOVERY,
      PatternType.BULL_FLAG,
      PatternType.ACCUMULATION
    ];
    
    return fastPatterns.includes(patternType) ? TimeframeType.FAST : TimeframeType.SLOW;
  }
  
  /**
   * Get current factor weights from edge calculator
   */
  private getCurrentFactorWeights(): Record<string, number> {
    // In production, this would get the actual weights from your edge calculator
    return {
      patternConfidence: 30,
      patternType: 10,
      patternTimeframe: 10,
      smartMoneyActivity: 25,
      marketLiquidity: 5,
      marketManipulation: 10,
      marketVolatility: 5,
      historicalSuccess: 5
    };
  }
  
  /**
   * Get current pattern criteria
   */
  private getCurrentPatternCriteria(): Record<TimeframeType, Record<PatternType, any>> {
    // In production, this would get the actual pattern criteria
    // For now, return mock data that matches your pattern recognition service
    return {
      [TimeframeType.FAST]: {
        [PatternType.BREAKOUT]: {
          minConsolidationPeriods: 6,
          breakoutVolumeMultiplier: 2.0,
          minPriceIncrease: 0.05,
          confirmationPeriods: 2,
          maxLookbackPeriods: 24
        },
        [PatternType.V_RECOVERY]: {
          minDropPercentage: 0.10,
          minRecoveryPercentage: 0.08,
          maxRecoveryTime: 12,
          volumeIncreaseThreshold: 1.5
        },
        [PatternType.BULL_FLAG]: {
          minInitialMove: 0.15,
          consolidationTimeMin: 3,
          consolidationTimeMax: 12,
          maxRetracement: 0.5,
          volumeDecreaseThreshold: 0.7
        },
        [PatternType.ACCUMULATION]: {
          minPeriods: 8,
          maxPriceVariation: 0.05,
          volumeIncreaseEnd: 1.8,
          smartMoneyThreshold: 3
        }
      },
      [TimeframeType.SLOW]: {
        [PatternType.CUP_AND_HANDLE]: {
          minCupDepth: 0.15,
          maxCupDepth: 0.5,
          minCupLength: 10,
          maxCupLength: 40,
          maxHandleRetracement: 0.4,
          minHandleLength: 5,
          maxHandleLength: 15
        },
        [PatternType.INVERSE_HEAD_SHOULDERS]: {
          minPatternDepth: 0.12,
          maxShoulderAsymmetry: 0.3,
          necklineVariation: 0.05,
          minHeadDepth: 0.15,
          confirmationBreakout: 0.03
        },
        [PatternType.ROUNDED_BOTTOM]: {
          minBottomDepth: 0.2,
          minBottomLength: 15,
          maxBottomLength: 60,
          minRoundingScore: 0.7,
          volumePattern: 'decreasing-then-increasing'
        },
        [PatternType.SMART_MONEY_ACCUMULATION]: {
          minSmartWallets: 5,
          minNetBuyPercentage: 0.6,
          minAccumulationPeriods: 12,
          maxPriceIncreaseDuringAccumulation: 0.1
        }
      }
    };
  }
  
  /**
   * Get current risk management parameters
   */
  private getCurrentRiskParameters(): {
    positionSizingMethod: string;
    maxRiskPerTrade: number;
    maxOpenPositions: number;
  } {
    // In production, this would get the actual parameters from your risk management service
    return {
      positionSizingMethod: 'fixed-percent',
      maxRiskPerTrade: 2.0, // 2% of capital per trade
      maxOpenPositions: 5
    };
  }
  
  /**
   * Check if pattern performance is inconsistent across types
   */
  private hasInconsistentPatternPerformance(): boolean {
    if (this.performanceHistory.length === 0) {
      return false;
    }
    
    const latestSnapshot = this.performanceHistory[this.performanceHistory.length - 1];
    const patternTypes = Object.keys(latestSnapshot.patternStats.byPatternType);
    
    if (patternTypes.length < 2) {
      return false;
    }
    
    // Calculate standard deviation of success rates
    const successRates = patternTypes.map(type => 
      (latestSnapshot.patternStats.byPatternType as any)[type].successRate
    );
    
    const avg = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    const variance = successRates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / successRates.length;
    const stdDev = Math.sqrt(variance);
    
    // If standard deviation is high, pattern performance is inconsistent
    return stdDev > 15; // Over 15% standard deviation is considered inconsistent
  }
  
  /**
   * Optimize pattern parameters
   */
  private async optimizePatternParameters(): Promise<OptimizationResult | null> {
    try {
      // Get current pattern criteria
      const currentCriteria = this.getCurrentPatternCriteria();
      
      // Analyze pattern performance to identify underperforming patterns
      const underperformingPatterns = await this.identifyUnderperformingPatterns();
      
      if (underperformingPatterns.length === 0) {
        this.logger.info('No underperforming patterns identified');
        return null;
      }
      
      // Create optimized criteria by adjusting parameters for underperforming patterns
      const optimizedCriteria = this.createOptimizedPatternCriteria(
        currentCriteria,
        underperformingPatterns
      );
      
      // Simulate performance improvement
      const performanceImprovement = this.simulatePatternOptimizationImprovement(
        underperformingPatterns,
        optimizedCriteria
      );
      
      // Only apply changes if improvement is significant
      if (performanceImprovement < 1.0) { // Less than 1% improvement
        this.logger.info(`Pattern optimization improvement (${performanceImprovement.toFixed(2)}%) is too small`);
        return null;
      }
      
      // Apply optimized criteria to pattern recognition service
      // In production, this would update the actual pattern criteria
      this.logger.info(`Applying optimized pattern criteria with expected ${performanceImprovement.toFixed(2)}% improvement`);
      
      // Record optimization result
      return {
        optimizationType: 'patternParameters',
        date: new Date(),
        previousConfiguration: currentCriteria,
        optimizedConfiguration: optimizedCriteria,
        performanceImprovement,
        confidence: this.calculateOptimizationConfidence(performanceImprovement, underperformingPatterns.length)
      };
    } catch (error) {
      this.logger.error('Error optimizing pattern parameters:', error);
      return null;
    }
  }
  
  /**
   * Identify underperforming patterns
   */
  private async identifyUnderperformingPatterns(): Promise<Array<{
    patternType: PatternType;
    timeframe: TimeframeType;
    successRate: number;
    targetSuccessRate: number;
    underperformingParameters: string[];
  }>> {
    try {
      // Get completed patterns
      const completedPatterns = await Pattern.find({
        status: { $in: [PatternStatus.COMPLETED, PatternStatus.INVALIDATED] }
      });
      
      // Get pattern stats
      const patternStats = await patternRecognitionService.getPatternStats();
      
      // Identify patterns with success rates below target
      const underperformingPatterns: Array<{
        patternType: PatternType;
        timeframe: TimeframeType;
        successRate: number;
        targetSuccessRate: number;
        underperformingParameters: string[];
      }> = [];
      
      for (const [type, stats] of Object.entries(patternStats.statsByType)) {
        const typeStats = stats as any;
        
        // Skip patterns with too few samples
        if (typeStats.count < 10) {
          continue;
        }
        
        // Check if success rate is below target
        if (typeStats.successRate < this.targetSuccessRate - 5) { // At least 5% below target
          const timeframe = this.getPatternTimeframe(type as PatternType);
          
          // Analyze failed patterns to identify problematic parameters
          const failedPatterns = completedPatterns.filter(p => 
            p.patternType === type && 
            (p.status === PatternStatus.INVALIDATED || 
             (p.status === PatternStatus.COMPLETED && p.outcome?.successful === false))
          );
          
          const underperformingParameters = this.identifyUnderperformingParameters(failedPatterns, type as PatternType);
          
          underperformingPatterns.push({
            patternType: type as PatternType,
            timeframe,
            successRate: typeStats.successRate,
            targetSuccessRate: this.targetSuccessRate,
            underperformingParameters
          });
        }
      }
      
      return underperformingPatterns;
    } catch (error) {
      this.logger.error('Error identifying underperforming patterns:', error);
      return [];
    }
  }
  
  /**
   * Identify parameters that correlate with pattern failure
   */
  private identifyUnderperformingParameters(
    failedPatterns: IPattern[],
    patternType: PatternType
  ): string[] {
    // This would use statistical analysis to identify parameters correlated with failure
    // For now, return sample parameters based on pattern type
    
    switch (patternType) {
      case PatternType.BREAKOUT:
        return ['minConsolidationPeriods', 'breakoutVolumeMultiplier'];
      case PatternType.V_RECOVERY:
        return ['minDropPercentage', 'maxRecoveryTime'];
      case PatternType.BULL_FLAG:
        return ['consolidationTimeMax', 'maxRetracement'];
      case PatternType.ACCUMULATION:
        return ['minPeriods', 'smartMoneyThreshold'];
      case PatternType.CUP_AND_HANDLE:
        return ['minCupDepth', 'maxHandleRetracement'];
      case PatternType.INVERSE_HEAD_SHOULDERS:
        return ['minPatternDepth', 'necklineVariation'];
      case PatternType.ROUNDED_BOTTOM:
        return ['minBottomLength', 'minRoundingScore'];
      case PatternType.SMART_MONEY_ACCUMULATION:
        return ['minSmartWallets', 'minNetBuyPercentage'];
      default:
        return [];
    }
  }
  
/**
 * Create optimized pattern criteria
 */
private createOptimizedPatternCriteria(
    currentCriteria: Record<TimeframeType, Record<PatternType, any>>,
    underperformingPatterns: Array<{
      patternType: PatternType;
      timeframe: TimeframeType;
      successRate: number;
      targetSuccessRate: number;
      underperformingParameters: string[];
    }>
  ): Record<TimeframeType, Record<PatternType, any>> {
    // Create a deep copy of current criteria
    const optimizedCriteria = JSON.parse(JSON.stringify(currentCriteria));
   
   // Adjust parameters for each underperforming pattern
   for (const pattern of underperformingPatterns) {
     const { patternType, timeframe, underperformingParameters } = pattern;
     
     for (const param of underperformingParameters) {
       // Get current value
       const currentValue = optimizedCriteria[timeframe][patternType][param];
       
       // Adjust parameter based on parameter type and pattern type
       switch (param) {
         // Threshold parameters - make more stringent
         case 'minConsolidationPeriods':
         case 'minDropPercentage':
         case 'minRecoveryPercentage':
         case 'minInitialMove':
         case 'minPeriods':
         case 'minCupDepth':
         case 'minPatternDepth':
         case 'minHeadDepth':
         case 'minBottomDepth':
         case 'minRoundingScore':
         case 'minSmartWallets':
         case 'minNetBuyPercentage':
         case 'minAccumulationPeriods':
         case 'breakoutVolumeMultiplier':
         case 'volumeIncreaseThreshold':
         case 'volumeIncreaseEnd':
         case 'smartMoneyThreshold':
         case 'confirmationBreakout':
           // Increase min thresholds by 10-20%
           optimizedCriteria[timeframe][patternType][param] = +(currentValue * (1 + Math.random() * 0.1 + 0.1)).toFixed(2);
           break;
           
         // Max parameters - make more restrictive
         case 'maxRecoveryTime':
         case 'consolidationTimeMax':
         case 'maxRetracement':
         case 'maxPriceVariation':
         case 'maxCupDepth':
         case 'maxCupLength':
         case 'maxHandleRetracement':
         case 'maxHandleLength':
         case 'maxShoulderAsymmetry':
         case 'necklineVariation':
         case 'maxBottomLength':
         case 'maxPriceIncreaseDuringAccumulation':
           // Decrease max thresholds by 10-20%
           optimizedCriteria[timeframe][patternType][param] = +(currentValue * (0.9 - Math.random() * 0.1)).toFixed(2);
           break;
           
         // Min length parameters - balance between too short and too long
         case 'consolidationTimeMin':
         case 'minCupLength':
         case 'minHandleLength':
         case 'minBottomLength':
           // Adjust by +/- 20% based on current success rate
           const adjustmentFactor = pattern.successRate < pattern.targetSuccessRate * 0.8 ? 
             (1 + Math.random() * 0.2) : (1 - Math.random() * 0.2);
           optimizedCriteria[timeframe][patternType][param] = Math.max(2, Math.round(currentValue * adjustmentFactor));
           break;
           
         // Special parameters
         case 'maxLookbackPeriods':
           // Adjust lookback based on performance
           optimizedCriteria[timeframe][patternType][param] = Math.round(currentValue * (0.8 + Math.random() * 0.4));
           break;
           
         case 'volumeDecreaseThreshold':
           // Adjust volume thresholds more precisely
           optimizedCriteria[timeframe][patternType][param] = +(currentValue * (0.95 + Math.random() * 0.1)).toFixed(2);
           break;
       }
     }
   }
   
   return optimizedCriteria;
 }
 
 /**
  * Simulate pattern optimization improvement
  */
 private simulatePatternOptimizationImprovement(
   underperformingPatterns: Array<{
     patternType: PatternType;
     timeframe: TimeframeType;
     successRate: number;
     targetSuccessRate: number;
     underperformingParameters: string[];
   }>,
   optimizedCriteria: Record<TimeframeType, Record<PatternType, any>>
 ): number {
   // In production, this would run historical simulations to estimate improvement
   // For now, use a simplified model based on the number of adjusted parameters
   
   let totalCurrentSuccessRate = 0;
   let totalTargetSuccessRate = 0;
   let totalPatterns = 0;
   
   for (const pattern of underperformingPatterns) {
     const patternCount = Math.floor(Math.random() * 50) + 10; // 10-60 patterns
     totalPatterns += patternCount;
     totalCurrentSuccessRate += pattern.successRate * patternCount;
     
     // Estimate improvement based on parameter adjustments
     const estimatedImprovement = Math.min(
       pattern.targetSuccessRate - pattern.successRate,
       pattern.underperformingParameters.length * 2 + Math.random() * 5
     );
     
     totalTargetSuccessRate += (pattern.successRate + estimatedImprovement) * patternCount;
   }
   
   // Calculate overall improvement
   const currentOverallRate = totalCurrentSuccessRate / totalPatterns;
   const targetOverallRate = totalTargetSuccessRate / totalPatterns;
   
   return targetOverallRate - currentOverallRate;
 }
 
 /**
  * Optimize edge factor weights
  */
 private async optimizeEdgeFactorWeights(): Promise<OptimizationResult | null> {
   try {
     // Get current factor weights
     const currentWeights = this.getCurrentFactorWeights();
     
     // Analyze edge performance by factor
     const factorCorrelations = await this.analyzeFactorCorrelations();
     
     if (Object.keys(factorCorrelations).length === 0) {
       this.logger.info('No factor correlations identified');
       return null;
     }
     
     // Create optimized weights based on correlations
     const optimizedWeights = this.createOptimizedFactorWeights(
       currentWeights,
       factorCorrelations
     );
     
     // Simulate performance improvement
     const performanceImprovement = this.simulateWeightOptimizationImprovement(
       currentWeights,
       optimizedWeights,
       factorCorrelations
     );
     
     // Only apply changes if improvement is significant
     if (performanceImprovement < 1.0) { // Less than 1% improvement
       this.logger.info(`Weight optimization improvement (${performanceImprovement.toFixed(2)}%) is too small`);
       return null;
     }
     
     // Apply optimized weights to edge calculator
     // In production, this would actually update the weights
     this.logger.info(`Applying optimized factor weights with expected ${performanceImprovement.toFixed(2)}% improvement`);
     edgeCalculatorService.setFactorWeights(optimizedWeights);
     
     // Record optimization result
     return {
       optimizationType: 'edgeFactorWeights',
       date: new Date(),
       previousConfiguration: currentWeights,
       optimizedConfiguration: optimizedWeights,
       performanceImprovement,
       confidence: this.calculateOptimizationConfidence(performanceImprovement, Object.keys(factorCorrelations).length)
     };
   } catch (error) {
     this.logger.error('Error optimizing edge factor weights:', error);
     return null;
   }
 }
 
 /**
  * Analyze correlations between edge factors and success
  */
 private async analyzeFactorCorrelations(): Promise<Record<string, number>> {
   try {
     // In production, this would analyze edge calculation history and outcomes
     // For now, return mock correlations
     return {
       patternConfidence: 0.75,
       patternType: 0.62,
       patternTimeframe: 0.58,
       smartMoneyActivity: 0.82,
       marketLiquidity: 0.45,
       marketManipulation: 0.70,
       marketVolatility: 0.52,
       historicalSuccess: 0.68
     };
   } catch (error) {
     this.logger.error('Error analyzing factor correlations:', error);
     return {};
   }
 }
 
 /**
  * Create optimized factor weights based on correlations
  */
 private createOptimizedFactorWeights(
   currentWeights: Record<string, number>,
   factorCorrelations: Record<string, number>
 ): Record<string, number> {
   // Create a copy of current weights
   const optimizedWeights = { ...currentWeights };
   
   // Calculate total weights to maintain sum of 100
   const totalWeight = Object.values(currentWeights).reduce((sum, weight) => sum + weight, 0);
   
   // Sort factors by correlation
   const sortedFactors = Object.entries(factorCorrelations)
     .sort((a, b) => b[1] - a[1])
     .map(([factor]) => factor);
   
   // Calculate adjustment amounts (increase high correlation, decrease low correlation)
   const adjustmentAmount = 5; // 5% adjustment
   const factorsToIncrease = sortedFactors.slice(0, 3); // Top 3 factors
   const factorsToDecrease = sortedFactors.slice(-3); // Bottom 3 factors
   
   // Apply adjustments
   let totalAdjustment = 0;
   
   for (const factor of factorsToIncrease) {
     const increase = Math.min(adjustmentAmount, 100 - optimizedWeights[factor]);
     optimizedWeights[factor] += increase;
     totalAdjustment += increase;
   }
   
   for (const factor of factorsToDecrease) {
     const decrease = Math.min(adjustmentAmount, optimizedWeights[factor] - 1);
     optimizedWeights[factor] -= decrease;
     totalAdjustment -= decrease;
   }
   
   // If total adjustment is not zero, normalize weights
   if (totalAdjustment !== 0) {
     // Distribute excess/deficit across remaining factors
     const remainingFactors = Object.keys(optimizedWeights)
       .filter(factor => !factorsToIncrease.includes(factor) && !factorsToDecrease.includes(factor));
     
     const adjustmentPerFactor = totalAdjustment / remainingFactors.length;
     
     for (const factor of remainingFactors) {
       optimizedWeights[factor] -= adjustmentPerFactor;
     }
   }
   
   // Round weights to integers and ensure they sum to the original total
   let roundedTotal = 0;
   const roundedWeights: Record<string, number> = {};
   
   for (const [factor, weight] of Object.entries(optimizedWeights)) {
     roundedWeights[factor] = Math.round(weight);
     roundedTotal += roundedWeights[factor];
   }
   
   // Adjust for rounding errors to maintain total
   const diff = totalWeight - roundedTotal;
   if (diff !== 0) {
     // Add/subtract from the least important factor
     const leastImportantFactor = sortedFactors[sortedFactors.length - 1];
     roundedWeights[leastImportantFactor] += diff;
   }
   
   return roundedWeights;
 }
 
 /**
  * Simulate weight optimization improvement
  */
 private simulateWeightOptimizationImprovement(
   currentWeights: Record<string, number>,
   optimizedWeights: Record<string, number>,
   factorCorrelations: Record<string, number>
 ): number {
   // Calculate weighted correlation score for current weights
   let currentCorrelationScore = 0;
   let optimizedCorrelationScore = 0;
   
   for (const [factor, correlation] of Object.entries(factorCorrelations)) {
     currentCorrelationScore += currentWeights[factor] * correlation;
     optimizedCorrelationScore += optimizedWeights[factor] * correlation;
   }
   
   // Normalize correlation scores
   const totalWeight = Object.values(currentWeights).reduce((sum, weight) => sum + weight, 0);
   currentCorrelationScore /= totalWeight;
   optimizedCorrelationScore /= totalWeight;
   
   // Estimate improvement in success rate
   // This model assumes a linear relationship between correlation score and success rate
   const currentSuccessRate = this.getLatestSuccessRate();
   const maxPossibleImprovement = this.targetSuccessRate - currentSuccessRate;
   
   // Calculate the ratio of improvement in correlation score
   const correlationImprovement = (optimizedCorrelationScore - currentCorrelationScore) / currentCorrelationScore;
   
   // Estimate success rate improvement (with diminishing returns)
   const estimatedImprovement = Math.min(
     maxPossibleImprovement,
     correlationImprovement * 10 * Math.sqrt(currentSuccessRate / 100)
   );
   
   return Math.max(0, estimatedImprovement);
 }
 
 /**
  * Optimize risk management parameters
  */
 private async optimizeRiskParameters(): Promise<OptimizationResult | null> {
   try {
     // Get current risk parameters
     const currentParams = this.getCurrentRiskParameters();
     
     // Analyze risk/reward performance
     const riskRewardAnalysis = await this.analyzeRiskRewardPerformance();
     
     // Create optimized parameters based on analysis
     const optimizedParams = this.createOptimizedRiskParameters(
       currentParams,
       riskRewardAnalysis
     );
     
     // Simulate performance improvement
     const performanceImprovement = this.simulateRiskOptimizationImprovement(
       currentParams,
       optimizedParams,
       riskRewardAnalysis
     );
     
     // Only apply changes if improvement is significant
     if (performanceImprovement < 0.5) { // Less than 0.5% improvement
       this.logger.info(`Risk optimization improvement (${performanceImprovement.toFixed(2)}%) is too small`);
       return null;
     }
     
     // Apply optimized parameters to risk management service
     // In production, this would actually update the parameters
     this.logger.info(`Applying optimized risk parameters with expected ${performanceImprovement.toFixed(2)}% improvement`);
     
     // Record optimization result
     return {
       optimizationType: 'riskParameters',
       date: new Date(),
       previousConfiguration: currentParams,
       optimizedConfiguration: optimizedParams,
       performanceImprovement,
       confidence: this.calculateOptimizationConfidence(performanceImprovement, 3) // 3 parameters
     };
   } catch (error) {
     this.logger.error('Error optimizing risk parameters:', error);
     return null;
   }
 }
 
 /**
  * Analyze risk/reward performance
  */
 private async analyzeRiskRewardPerformance(): Promise<{
   optimalRiskPerTrade: number;
   optimalPositionCount: number;
   profitFactor: number;
 }> {
   try {
     // In production, this would analyze historical trades
     // For now, return mock analysis
     return {
       optimalRiskPerTrade: 1.5 + Math.random(), // 1.5-2.5%
       optimalPositionCount: 3 + Math.floor(Math.random() * 5), // 3-7
       profitFactor: 1.8 + Math.random() // 1.8-2.8
     };
   } catch (error) {
     this.logger.error('Error analyzing risk/reward performance:', error);
     return {
       optimalRiskPerTrade: 2.0,
       optimalPositionCount: 5,
       profitFactor: 2.0
     };
   }
 }
 
 /**
  * Create optimized risk parameters
  */
 private createOptimizedRiskParameters(
   currentParams: {
     positionSizingMethod: string;
     maxRiskPerTrade: number;
     maxOpenPositions: number;
   },
   analysis: {
     optimalRiskPerTrade: number;
     optimalPositionCount: number;
     profitFactor: number;
   }
 ): {
   positionSizingMethod: string;
   maxRiskPerTrade: number;
   maxOpenPositions: number;
 } {
   // Create a copy of current parameters
   const optimizedParams = { ...currentParams };
   
   // Adjust risk per trade based on analysis
   optimizedParams.maxRiskPerTrade = +(analysis.optimalRiskPerTrade).toFixed(1);
   
   // Adjust max open positions based on analysis
   optimizedParams.maxOpenPositions = Math.round(analysis.optimalPositionCount);
   
   // Keep the same position sizing method for now
   // In a more advanced implementation, this could switch between methods
   
   return optimizedParams;
 }
 
 /**
  * Simulate risk optimization improvement
  */
 private simulateRiskOptimizationImprovement(
   currentParams: {
     positionSizingMethod: string;
     maxRiskPerTrade: number;
     maxOpenPositions: number;
   },
   optimizedParams: {
     positionSizingMethod: string;
     maxRiskPerTrade: number;
     maxOpenPositions: number;
   },
   analysis: {
     optimalRiskPerTrade: number;
     optimalPositionCount: number;
     profitFactor: number;
   }
 ): number {
   // Calculate how close the optimized parameters are to the optimal values
   const currentRiskDistance = Math.abs(currentParams.maxRiskPerTrade - analysis.optimalRiskPerTrade);
   const optimizedRiskDistance = Math.abs(optimizedParams.maxRiskPerTrade - analysis.optimalRiskPerTrade);
   
   const currentPositionDistance = Math.abs(currentParams.maxOpenPositions - analysis.optimalPositionCount);
   const optimizedPositionDistance = Math.abs(optimizedParams.maxOpenPositions - analysis.optimalPositionCount);
   
   // Calculate improvement ratios
   const riskImprovement = currentRiskDistance > 0 ?
     (currentRiskDistance - optimizedRiskDistance) / currentRiskDistance : 0;
     
   const positionImprovement = currentPositionDistance > 0 ?
     (currentPositionDistance - optimizedPositionDistance) / currentPositionDistance : 0;
     
   // Combine improvements with weights
   const combinedImprovement = (riskImprovement * 0.6) + (positionImprovement * 0.4);
   
   // Convert to estimated success rate improvement
   // This assumes risk optimization has a smaller direct impact on success rate
   return combinedImprovement * 2.5;
 }
 
 /**
  * Calculate confidence level for optimization
  */
 private calculateOptimizationConfidence(
   performanceImprovement: number,
   factorCount: number
 ): number {
   // Higher improvement and more factors = higher confidence
   const improvementFactor = Math.min(1, performanceImprovement / 5); // Normalize to 0-1
   const dataFactor = Math.min(1, factorCount / 10); // Normalize to 0-1
   
   const historyFactor = Math.min(1, this.performanceHistory.length / 30); // More history = more confidence
   
   // Combine factors with weights
   return Math.min(100, Math.round(
     (improvementFactor * 0.5 + dataFactor * 0.3 + historyFactor * 0.2) * 100
   ));
 }
 
 /**
  * Get the latest success rate
  */
 private getLatestSuccessRate(): number {
   if (this.performanceHistory.length === 0) {
     return 70; // Reasonable default
   }
   
   const latestSnapshot = this.performanceHistory[this.performanceHistory.length - 1];
   return latestSnapshot.patternStats.successRate;
 }
 
 /**
  * Get performance history
  */
 async getPerformanceHistory(days: number = 30): Promise<IPerformanceSnapshot[]> {
   try {
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - days);
     
     return PerformanceSnapshot.find({
       date: { $gte: cutoffDate }
     }).sort({ date: 1 });
   } catch (error) {
     this.logger.error('Error getting performance history:', error);
     return [];
   }
 }
 
 /**
  * Get recent optimization results
  */
 async getOptimizationResults(limit: number = 10): Promise<OptimizationResult[]> {
   try {
     return OptimizationResultModel.find()
       .sort({ date: -1 })
       .limit(limit);
   } catch (error) {
     this.logger.error('Error getting optimization results:', error);
     return [];
   }
 }
 
 /**
  * Manually trigger optimization
  */
 async triggerOptimization(
   type: 'patternParameters' | 'edgeFactorWeights' | 'riskParameters'
 ): Promise<OptimizationResult | null> {
   try {
     // Take a fresh snapshot first
     await this.takePerformanceSnapshot();
     
     // Run the requested optimization
     let result: OptimizationResult | null = null;
     
     switch (type) {
       case 'patternParameters':
         result = await this.optimizePatternParameters();
         break;
       case 'edgeFactorWeights':
         result = await this.optimizeEdgeFactorWeights();
         break;
       case 'riskParameters':
         result = await this.optimizeRiskParameters();
         break;
     }
     
     if (result) {
       // Save optimization result
       await new OptimizationResultModel(result).save();
       
       // Update last optimization time
       this.lastOptimization[type] = new Date();
     }
     
     return result;
   } catch (error) {
     this.logger.error(`Error triggering ${type} optimization:`, error);
     return null;
   }
 }
 
 /**
  * Update target success rate
  */
 setTargetSuccessRate(rate: number, range: number = 1): void {
   this.targetSuccessRate = Math.min(100, Math.max(50, rate));
   this.targetSuccessRateRange = Math.max(0.1, range);
   
   this.logger.info(`Target success rate set to ${this.targetSuccessRate}% ±${this.targetSuccessRateRange}%`);
 }
 
 /**
  * Stop the feedback loop service
  */
 stop(): void {
   if (this.snapshotInterval) {
     clearInterval(this.snapshotInterval);
     this.snapshotInterval = null;
   }
   
   if (this.optimizationInterval) {
     clearInterval(this.optimizationInterval);
     this.optimizationInterval = null;
   }
   
   this.logger.info('Feedback loop service stopped');
 }
}

export default new FeedbackLoopService();