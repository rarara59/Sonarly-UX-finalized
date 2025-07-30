// src/services/realtime-feedback.service.ts

import { ModularSignalIntegration } from './modular-signal-integration.service';
import { createLogger, format, transports, Logger } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';

// Tracked token structure
interface TrackedToken {
  address: string;
  symbol: string;
  
  // Discovery data
  discoveryDate: Date;
  discoveryPrice: number;
  
  // Thorp's prediction
  thorpPrediction: {
    finalScore: number;
    confidence: number;
    isQualified: boolean;
    primaryPath: string;
    detectionPaths: string[];
    expectedReturn: number;
    signalScores: { [key: string]: number };
  };
  
  // Current tracking data
  currentPrice: number;
  currentReturn: number; // current multiple (e.g., 2.5x)
  maxPrice: number;
  maxReturn: number;
  lastUpdated: Date;
  
  // Outcome status
  status: 'TRACKING' | 'SUCCESS' | 'FAILURE' | 'EXPIRED';
  outcomeDate?: Date;
  
  // Tracking parameters
  targetReturn: number; // e.g., 4.0 for 4x
  maxTrackingDays: number;
  stopLossPercent: number; // e.g., -50% for failure
  
  // Metadata
  trackingId: string;
  dataSource: 'PRICE_API' | 'RPC' | 'MANUAL';
}

// Learning data structure
interface SignalLearning {
  signalName: string;
  
  // Performance metrics
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  
  // Confidence analysis
  avgConfidenceWhenCorrect: number;
  avgConfidenceWhenWrong: number;
  confidenceCalibration: number; // how well confidence predicts accuracy
  
  // Return prediction analysis
  avgExpectedReturn: number;
  avgActualReturn: number;
  returnPredictionError: number;
  
  // Weight adjustment
  currentWeight: number;
  recommendedWeight: number;
  lastAdjusted: Date;
  
  // Trend analysis
  recentPerformance: number[]; // last 10 outcomes
  isImproving: boolean;
}

// Feedback system configuration
interface FeedbackConfig {
  // Tracking parameters
  maxConcurrentTracking: number;
  defaultTrackingDays: number;
  defaultTargetReturn: number;
  defaultStopLoss: number;
  
  // Learning parameters
  minSampleSize: number; // min predictions before adjusting weights
  learningRate: number; // how quickly to adjust weights
  maxWeightChange: number; // max weight change per adjustment
  
  // Update intervals
  priceUpdateInterval: number; // ms between price checks
  learningUpdateInterval: number; // ms between learning updates
  
  // Thresholds
  successThreshold: number; // return multiple for success (e.g., 4.0)
  failureThreshold: number; // loss percent for failure (e.g., -50)
  confidenceThreshold: number; // min confidence to track token
}

export class RealtimeFeedbackService {
  private logger: Logger;
  private modularSignals: ModularSignalIntegration;
  private config: FeedbackConfig;
  
  // Tracking data
  private trackedTokens: Map<string, TrackedToken> = new Map();
  private signalLearning: Map<string, SignalLearning> = new Map();
  
  // Active intervals
  private priceUpdateInterval?: NodeJS.Timeout;
  private learningInterval?: NodeJS.Timeout;
  
  // File paths
  private dataDirectory: string;
  private trackedTokensFile: string;
  private learningDataFile: string;
  
  constructor(config?: Partial<FeedbackConfig>) {
    this.logger = this.initializeLogger();
    this.modularSignals = new ModularSignalIntegration(this.logger);
    
    // Default configuration
    this.config = {
      maxConcurrentTracking: 50,
      defaultTrackingDays: 30,
      defaultTargetReturn: 4.0,
      defaultStopLoss: -50,
      minSampleSize: 5,
      learningRate: 0.1,
      maxWeightChange: 0.2,
      priceUpdateInterval: 5 * 60 * 1000, // 5 minutes
      learningUpdateInterval: 60 * 60 * 1000, // 1 hour
      successThreshold: 4.0,
      failureThreshold: -50,
      confidenceThreshold: 60,
      ...config
    };
    
    // Initialize file paths
    this.dataDirectory = path.join(process.cwd(), 'data', 'feedback');
    this.trackedTokensFile = path.join(this.dataDirectory, 'tracked-tokens.json');
    this.learningDataFile = path.join(this.dataDirectory, 'signal-learning.json');
    
    this.ensureDataDirectory();
    this.initializeSignalLearning();
  }
  
  private initializeLogger(): Logger {
    return createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: { service: 'realtime-feedback' },
      transports: [
        new transports.File({ filename: 'logs/feedback.log' }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });
  }
  
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataDirectory, { recursive: true });
    } catch (error) {
      this.logger.warn('Could not create feedback data directory:', error);
    }
  }
  
  // 🚀 MAIN METHODS: Start/Stop the feedback system
  
  async startFeedbackLoop(): Promise<void> {
    this.logger.info('🔄 Starting real-time feedback loop...');
    
    try {
      // Load existing data
      await this.loadData();
      
      // Start price monitoring
      this.startPriceMonitoring();
      
      // Start learning updates
      this.startLearningLoop();
      
      this.logger.info(`✅ Feedback loop started - tracking ${this.trackedTokens.size} tokens`);
      
    } catch (error) {
      this.logger.error('Failed to start feedback loop:', error);
      throw error;
    }
  }
  
  async stopFeedbackLoop(): Promise<void> {
    this.logger.info('⏹️ Stopping real-time feedback loop...');
    
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = undefined;
    }
    
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = undefined;
    }
    
    await this.saveData();
    this.logger.info('✅ Feedback loop stopped and data saved');
  }
  
  // 🎯 CORE FUNCTIONALITY: Auto-track tokens Thorp recommends
  
  async evaluateAndTrack(tokenAddress: string, currentPrice: number): Promise<any> {
    this.logger.info(`🔍 Evaluating and potentially tracking: ${tokenAddress}`);
    
    try {
      // Get Thorp's evaluation - FIX: Add the missing tokenAgeMinutes parameter
      const thorpResult = await this.modularSignals.evaluateToken(tokenAddress, currentPrice, 45);
      
      // Check if token qualifies for tracking
      if (thorpResult.isQualified && thorpResult.confidence >= this.config.confidenceThreshold) {
        await this.startTrackingToken(tokenAddress, currentPrice, thorpResult);
        
        this.logger.info(`✅ Started tracking ${tokenAddress} (Confidence: ${thorpResult.confidence.toFixed(1)}%)`);
      } else {
        this.logger.info(`❌ Token ${tokenAddress} did not qualify for tracking`);
      }
      
      return thorpResult;
      
    } catch (error) {
      this.logger.error(`Failed to evaluate token ${tokenAddress}:`, error);
      throw error;
    }
  }
  
  private async startTrackingToken(
    tokenAddress: string, 
    discoveryPrice: number, 
    thorpResult: any
  ): Promise<void> {
    
    // Check if we're already tracking this token
    if (this.trackedTokens.has(tokenAddress)) {
      this.logger.warn(`Already tracking ${tokenAddress}`);
      return;
    }
    
    // Check if we've hit our tracking limit
    if (this.trackedTokens.size >= this.config.maxConcurrentTracking) {
      this.logger.warn(`Tracking limit reached (${this.config.maxConcurrentTracking}), not tracking ${tokenAddress}`);
      return;
    }
    
    const trackedToken: TrackedToken = {
      address: tokenAddress,
      symbol: thorpResult.signals?.lpAnalysis?.symbol || 'UNKNOWN',
      discoveryDate: new Date(),
      discoveryPrice,
      thorpPrediction: {
        finalScore: thorpResult.finalScore,
        confidence: thorpResult.confidence,
        isQualified: thorpResult.isQualified,
        primaryPath: thorpResult.primaryPath,
        detectionPaths: thorpResult.detectionPaths,
        expectedReturn: thorpResult.expectedReturn,
        signalScores: this.extractSignalScores(thorpResult)
      },
      currentPrice: discoveryPrice,
      currentReturn: 1.0,
      maxPrice: discoveryPrice,
      maxReturn: 1.0,
      lastUpdated: new Date(),
      status: 'TRACKING',
      targetReturn: this.config.defaultTargetReturn,
      maxTrackingDays: this.config.defaultTrackingDays,
      stopLossPercent: this.config.defaultStopLoss,
      trackingId: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataSource: 'PRICE_API'
    };
    
    this.trackedTokens.set(tokenAddress, trackedToken);
    await this.saveData();
    
    this.logger.info(`📊 Started tracking ${tokenAddress}: Target ${this.config.defaultTargetReturn}x, Stop ${this.config.defaultStopLoss}%`);
  }
  
  // 📊 PRICE MONITORING: Track performance of flagged tokens
  
  private startPriceMonitoring(): void {
    this.priceUpdateInterval = setInterval(async () => {
      await this.updateAllTokenPrices();
    }, this.config.priceUpdateInterval);
    
    this.logger.info(`📈 Price monitoring started (${this.config.priceUpdateInterval / 1000}s interval)`);
  }
  
  private async updateAllTokenPrices(): Promise<void> {
    const trackingTokens = Array.from(this.trackedTokens.values())
      .filter(token => token.status === 'TRACKING');
    
    if (trackingTokens.length === 0) return;
    
    this.logger.debug(`📊 Updating prices for ${trackingTokens.length} tracked tokens...`);
    
    const updatePromises = trackingTokens.map(token => this.updateTokenPrice(token));
    await Promise.allSettled(updatePromises);
    
    await this.saveData();
  }
  
  private async updateTokenPrice(token: TrackedToken): Promise<void> {
    try {
      // Get current price (you'd implement actual price fetching here)
      const currentPrice = await this.fetchTokenPrice(token.address);
      
      if (currentPrice <= 0) {
        this.logger.warn(`Invalid price for ${token.address}: ${currentPrice}`);
        return;
      }
      
      // Update token data
      const currentReturn = currentPrice / token.discoveryPrice;
      const previousReturn = token.currentReturn;
      
      token.currentPrice = currentPrice;
      token.currentReturn = currentReturn;
      token.lastUpdated = new Date();
      
      // Update max price/return
      if (currentReturn > token.maxReturn) {
        token.maxPrice = currentPrice;
        token.maxReturn = currentReturn;
      }
      
      // Check for outcome
      await this.checkTokenOutcome(token, previousReturn, currentReturn);
      
    } catch (error) {
      this.logger.error(`Failed to update price for ${token.address}:`, error);
    }
  }
  
  private async checkTokenOutcome(
    token: TrackedToken, 
    previousReturn: number, 
    currentReturn: number
  ): Promise<void> {
    
    // Check for success (hit target return)
    if (currentReturn >= token.targetReturn && token.status === 'TRACKING') {
      await this.recordTokenOutcome(token, 'SUCCESS');
      this.logger.info(`🎉 SUCCESS: ${token.symbol} hit ${currentReturn.toFixed(2)}x (Target: ${token.targetReturn}x)`);
      return;
    }
    
    // Check for failure (hit stop loss)
    const lossPercent = ((currentReturn - 1) * 100);
    if (lossPercent <= token.stopLossPercent && token.status === 'TRACKING') {
      await this.recordTokenOutcome(token, 'FAILURE');
      this.logger.info(`💥 FAILURE: ${token.symbol} hit ${lossPercent.toFixed(1)}% loss (Stop: ${token.stopLossPercent}%)`);
      return;
    }
    
    // Check for expiration (max tracking days)
    const daysSinceDiscovery = (Date.now() - token.discoveryDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDiscovery >= token.maxTrackingDays && token.status === 'TRACKING') {
      await this.recordTokenOutcome(token, 'EXPIRED');
      this.logger.info(`⏰ EXPIRED: ${token.symbol} tracking expired after ${daysSinceDiscovery.toFixed(1)} days`);
      return;
    }
    
    // Log significant moves
    if (Math.abs(currentReturn - previousReturn) > 0.5) { // 50%+ move
      this.logger.info(`📈 ${token.symbol}: ${previousReturn.toFixed(2)}x → ${currentReturn.toFixed(2)}x`);
    }
  }
  
  private async recordTokenOutcome(token: TrackedToken, outcome: 'SUCCESS' | 'FAILURE' | 'EXPIRED'): Promise<void> {
    token.status = outcome;
    token.outcomeDate = new Date();
    
    // Update signal learning data
    await this.updateSignalLearning(token, outcome);
    
    // Save outcome for future analysis
    await this.saveOutcomeRecord(token, outcome);
    
    this.logger.info(`📝 Recorded outcome: ${token.symbol} = ${outcome} (${token.currentReturn.toFixed(2)}x)`);
  }
  
  // 🧠 LEARNING ENGINE: Adjust signal weights based on outcomes
  
  private startLearningLoop(): void {
    this.learningInterval = setInterval(async () => {
      await this.runLearningUpdate();
    }, this.config.learningUpdateInterval);
    
    this.logger.info(`🧠 Learning loop started (${this.config.learningUpdateInterval / 1000}s interval)`);
  }
  
  private async runLearningUpdate(): Promise<void> {
    this.logger.info('🧠 Running learning update...');
    
    try {
      // Update signal learning metrics
      await this.updateAllSignalLearning();
      
      // Adjust signal weights based on performance
      await this.adjustSignalWeights();
      
      // Generate learning insights
      await this.generateLearningInsights();
      
      await this.saveData();
      
      this.logger.info('✅ Learning update completed');
      
    } catch (error) {
      this.logger.error('Learning update failed:', error);
    }
  }
  
  private async updateSignalLearning(token: TrackedToken, outcome: string): Promise<void> {
    const signalScores = token.thorpPrediction.signalScores;
    
    for (const [signalName, confidence] of Object.entries(signalScores)) {
      let learning = this.signalLearning.get(signalName);
      
      if (!learning) {
        learning = this.createEmptySignalLearning(signalName);
        this.signalLearning.set(signalName, learning);
      }
      
      // Update metrics
      learning.totalPredictions++;
      
      const wasCorrect = (outcome === 'SUCCESS' && token.thorpPrediction.isQualified) ||
                        (outcome === 'FAILURE' && !token.thorpPrediction.isQualified);
      
      if (wasCorrect) {
        learning.correctPredictions++;
        learning.avgConfidenceWhenCorrect = this.updateAverage(
          learning.avgConfidenceWhenCorrect, 
          confidence, 
          learning.correctPredictions
        );
      } else {
        learning.avgConfidenceWhenWrong = this.updateAverage(
          learning.avgConfidenceWhenWrong, 
          confidence, 
          learning.totalPredictions - learning.correctPredictions
        );
      }
      
      // Update accuracy
      learning.accuracy = (learning.correctPredictions / learning.totalPredictions) * 100;
      
      // Update return prediction
      learning.avgExpectedReturn = this.updateAverage(
        learning.avgExpectedReturn,
        token.thorpPrediction.expectedReturn,
        learning.totalPredictions
      );
      
      learning.avgActualReturn = this.updateAverage(
        learning.avgActualReturn,
        token.currentReturn,
        learning.totalPredictions
      );
      
      learning.returnPredictionError = Math.abs(learning.avgExpectedReturn - learning.avgActualReturn);
      
      // Update recent performance
      learning.recentPerformance.push(wasCorrect ? 1 : 0);
      if (learning.recentPerformance.length > 10) {
        learning.recentPerformance.shift();
      }
      
      // Check if improving
      const recentAccuracy = learning.recentPerformance.reduce((a, b) => a + b, 0) / learning.recentPerformance.length;
      learning.isImproving = recentAccuracy > learning.accuracy / 100;
    }
  }
  
  private async adjustSignalWeights(): Promise<void> {
    for (const [signalName, learning] of this.signalLearning) {
      if (learning.totalPredictions < this.config.minSampleSize) continue;
      
      // Calculate recommended weight based on performance
      const baseWeight = 1.0; // Default weight
      const accuracyMultiplier = learning.accuracy / 70; // 70% is target accuracy
      const confidenceCalibration = this.calculateConfidenceCalibration(learning);
      
      const recommendedWeight = Math.max(0.1, Math.min(2.0, 
        baseWeight * accuracyMultiplier * confidenceCalibration
      ));
      
      // Apply learning rate to limit changes
      const weightChange = (recommendedWeight - learning.currentWeight) * this.config.learningRate;
      const clampedChange = Math.max(-this.config.maxWeightChange, 
                                   Math.min(this.config.maxWeightChange, weightChange));
      
      learning.recommendedWeight = learning.currentWeight + clampedChange;
      learning.lastAdjusted = new Date();
      
      if (Math.abs(clampedChange) > 0.01) {
        this.logger.info(`🎛️ Adjusted ${signalName} weight: ${learning.currentWeight.toFixed(3)} → ${learning.recommendedWeight.toFixed(3)}`);
        learning.currentWeight = learning.recommendedWeight;
      }
    }
  }
  
  // 📊 MONITORING & INSIGHTS
  
  getTrackingStatus(): any {
    const tokens = Array.from(this.trackedTokens.values());
    const activeTokens = tokens.filter(t => t.status === 'TRACKING');
    const completedTokens = tokens.filter(t => t.status !== 'TRACKING');
    
    const successfulTokens = tokens.filter(t => t.status === 'SUCCESS');
    const failedTokens = tokens.filter(t => t.status === 'FAILURE');
    
    return {
      totalTracked: tokens.length,
      activelyTracking: activeTokens.length,
      completed: completedTokens.length,
      successful: successfulTokens.length,
      failed: failedTokens.length,
      successRate: completedTokens.length > 0 ? 
        (successfulTokens.length / completedTokens.length) * 100 : 0,
      avgReturnOnSuccess: successfulTokens.length > 0 ?
        successfulTokens.reduce((sum, t) => sum + t.currentReturn, 0) / successfulTokens.length : 0
    };
  }
  
  getSignalPerformance(): SignalLearning[] {
    return Array.from(this.signalLearning.values())
      .sort((a, b) => b.accuracy - a.accuracy);
  }
  
  async generateDailyReport(): Promise<void> {
    const status = this.getTrackingStatus();
    const signalPerf = this.getSignalPerformance();
    
    const report = {
      date: new Date().toISOString().split('T')[0],
      trackingStatus: status,
      signalPerformance: signalPerf.slice(0, 5), // Top 5 signals
      recommendations: this.generateRecommendations(status, signalPerf)
    };
    
    const reportPath = path.join(this.dataDirectory, `daily-report-${report.date}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    this.logger.info(`📊 Daily report generated: ${reportPath}`);
  }
  
  // Private helper methods
  
  private async fetchTokenPrice(tokenAddress: string): Promise<number> {
    // Placeholder - implement actual price fetching
    // This would typically call a price API or RPC
    return Math.random() * 10; // Stub for testing
  }
  
  private extractSignalScores(thorpResult: any): { [key: string]: number } {
    const scores: { [key: string]: number } = {};
    
    if (thorpResult.moduleStats) {
      for (const [signal, stats] of Object.entries(thorpResult.moduleStats)) {
        scores[signal] = (stats as any).confidence || 0;
      }
    }
    
    return scores;
  }
  
  private initializeSignalLearning(): void {
    const signalNames = [
      'smart-wallet', 'lp-analysis', 'holder-velocity',
      'transaction-pattern', 'deep-holder-analysis', 
      'social-signals', 'technical-pattern', 'market-context'
    ];
    
    for (const signalName of signalNames) {
      if (!this.signalLearning.has(signalName)) {
        this.signalLearning.set(signalName, this.createEmptySignalLearning(signalName));
      }
    }
  }
  
  private createEmptySignalLearning(signalName: string): SignalLearning {
    return {
      signalName,
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      avgConfidenceWhenCorrect: 0,
      avgConfidenceWhenWrong: 0,
      confidenceCalibration: 1,
      avgExpectedReturn: 0,
      avgActualReturn: 0,
      returnPredictionError: 0,
      currentWeight: 1.0,
      recommendedWeight: 1.0,
      lastAdjusted: new Date(),
      recentPerformance: [],
      isImproving: true
    };
  }
  
  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }
  
  private calculateConfidenceCalibration(learning: SignalLearning): number {
    // How well does confidence predict accuracy?
    // This is a simplified calculation
    const confidenceDiff = Math.abs(learning.avgConfidenceWhenCorrect - learning.avgConfidenceWhenWrong);
    return Math.max(0.5, Math.min(1.5, 1 + (confidenceDiff / 100)));
  }
  
  private async updateAllSignalLearning(): Promise<void> {
    // This would analyze all completed tokens and update learning
    // Implementation depends on specific requirements
  }
  
  private async generateLearningInsights(): Promise<void> {
    const insights = [];
    
    for (const learning of this.signalLearning.values()) {
      if (learning.totalPredictions >= this.config.minSampleSize) {
        if (learning.accuracy < 60) {
          insights.push(`🔴 ${learning.signalName} accuracy low: ${learning.accuracy.toFixed(1)}%`);
        } else if (learning.accuracy > 80) {
          insights.push(`🟢 ${learning.signalName} performing well: ${learning.accuracy.toFixed(1)}%`);
        }
        
        if (learning.isImproving) {
          insights.push(`📈 ${learning.signalName} is improving`);
        }
      }
    }
    
    if (insights.length > 0) {
      this.logger.info('💡 LEARNING INSIGHTS:', insights);
    }
  }
  
  private generateRecommendations(status: any, signalPerf: SignalLearning[]): string[] {
    const recommendations = [];
    
    if (status.successRate < 60) {
      recommendations.push("🔴 Success rate below target. Consider raising confidence thresholds.");
    }
    
    if (signalPerf.length > 0) {
      const topSignal = signalPerf[0];
      if (topSignal.accuracy > 75) {
        recommendations.push(`🟢 ${topSignal.signalName} is top performer (${topSignal.accuracy.toFixed(1)}%). Consider increasing weight.`);
      }
    }
    
    return recommendations;
  }
  
  private async saveData(): Promise<void> {
    try {
      // Save tracked tokens
      const tokensData = Array.from(this.trackedTokens.entries());
      await fs.writeFile(this.trackedTokensFile, JSON.stringify(tokensData, null, 2));
      
      // Save learning data
      const learningData = Array.from(this.signalLearning.entries());
      await fs.writeFile(this.learningDataFile, JSON.stringify(learningData, null, 2));
      
    } catch (error) {
      this.logger.error('Failed to save data:', error);
    }
  }
  
  private async loadData(): Promise<void> {
    try {
      // Load tracked tokens
      const tokensContent = await fs.readFile(this.trackedTokensFile, 'utf-8');
      const tokensData = JSON.parse(tokensContent);
      this.trackedTokens = new Map(tokensData);
      
      // Load learning data
      const learningContent = await fs.readFile(this.learningDataFile, 'utf-8');
      const learningData = JSON.parse(learningContent);
      this.signalLearning = new Map(learningData);
      
      this.logger.info(`📥 Loaded ${this.trackedTokens.size} tracked tokens and ${this.signalLearning.size} signal learning records`);
      
    } catch (error) {
      this.logger.info('No existing data found, starting fresh');
    }
  }
  
  private async saveOutcomeRecord(token: TrackedToken, outcome: string): Promise<void> {
    const record = {
      ...token,
      finalOutcome: outcome,
      recordedAt: new Date()
    };
    
    const outcomesDir = path.join(this.dataDirectory, 'outcomes');
    await fs.mkdir(outcomesDir, { recursive: true });
    
    const outcomeFile = path.join(outcomesDir, `outcome-${token.trackingId}.json`);
    await fs.writeFile(outcomeFile, JSON.stringify(record, null, 2));
  }
}

export { TrackedToken, SignalLearning, FeedbackConfig };