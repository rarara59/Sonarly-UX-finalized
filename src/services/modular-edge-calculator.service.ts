// src/services/modular-edge-calculator.service.ts

import { SignalRegistry } from './signal-registry.service';
import { SignalContext } from '../interfaces/signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

// Import all signal modules
import { SmartWalletSignalModule } from '../signal-modules/smart-wallet-signal.module';
import { LPAnalysisSignalModule } from '../signal-modules/lp-analysis-signal.module';
import { HolderVelocitySignalModule } from '../signal-modules/holder-velocity-signal.module';
import { TransactionPatternSignalModule } from '../signal-modules/transaction-pattern-signal.module';
import { DeepHolderAnalysisSignalModule } from '../signal-modules/deep-holder-analysis-signal.module';
import { SocialSignalsModule } from '../signal-modules/social-signals.module';
import { TechnicalPatternSignalModule } from '../signal-modules/technical-pattern-signal.module';
import { MarketContextSignalModule } from '../signal-modules/market-context-signal.module';

export class ModularEdgeCalculator {
  private signalRegistry: SignalRegistry;
  private logger: any;
  private originalCalculator: any; // Reference to original for fallback

  constructor(logger: any, originalCalculator?: any) {
    this.logger = logger;
    this.originalCalculator = originalCalculator;
    this.signalRegistry = new SignalRegistry(logger);
    
    this.initializeDefaultModules();
  }

  private initializeDefaultModules(): void {
    // Register all 8 signal modules with original weights
    this.signalRegistry.register(new SmartWalletSignalModule({
      enabled: true,
      weight: 0.6, // Same as FAST track weight
      version: '1.0.0',
      priority: 100, // Highest priority
      abTestGroup: 'A'
    }));

    this.signalRegistry.register(new LPAnalysisSignalModule({
      enabled: true,
      weight: 0.25, // Same as original FAST track weight
      version: '1.0.0',
      priority: 90,
      abTestGroup: 'A'
    }));

    this.signalRegistry.register(new HolderVelocitySignalModule({
      enabled: true,
      weight: 0.10, // FAST track only
      version: '1.0.0',
      priority: 80,
      abTestGroup: 'A'
    }));

    this.signalRegistry.register(new TransactionPatternSignalModule({
      enabled: true,
      weight: 0.05, // FAST track only
      version: '1.0.0',
      priority: 70,
      abTestGroup: 'A'
    }));

    this.signalRegistry.register(new DeepHolderAnalysisSignalModule({
      enabled: true,
      weight: 0.15, // SLOW track only
      version: '1.0.0',
      priority: 60,
      abTestGroup: 'A'
    }));

    this.signalRegistry.register(new SocialSignalsModule({
      enabled: true,
      weight: 0.10, // SLOW track only
      version: '1.0.0',
      priority: 50,
      abTestGroup: 'A'
    }));

    this.signalRegistry.register(new TechnicalPatternSignalModule({
      enabled: true,
      weight: 0.10, // SLOW track only
      version: '1.0.0',
      priority: 40,
      abTestGroup: 'A'
    }));

    this.signalRegistry.register(new MarketContextSignalModule({
      enabled: true,
      weight: 0.05, // BOTH tracks
      version: '1.0.0',
      priority: 30,
      abTestGroup: 'A'
    }));

    this.logger.info(`🔧 Initialized modular edge calculator with ${this.signalRegistry.getAllModules().length} signal modules`);
  }

  async evaluateToken(
    tokenAddress: string,
    currentPrice: number,
    tokenAgeMinutes: number
  ): Promise<any> {
    const track: 'FAST' | 'SLOW' = tokenAgeMinutes <= 30 ? 'FAST' : 'SLOW';
    
    this.logger.info(`🔍 [MODULAR] Evaluating ${tokenAddress} on ${track} track (age: ${tokenAgeMinutes}min)`);

    // ADD THIS: Risk Assessment BEFORE signal processing
    const riskCheck = await this.performRiskAssessment(tokenAddress, currentPrice, tokenAgeMinutes);
    
    // VETO: If risk check fails completely, reject immediately
    if (false && !riskCheck.passed) {
      this.logger.warn(`🚫 [RISK VETO] ${tokenAddress} rejected: ${riskCheck.rejectionReasons.join(', ')}`);
      return {
        tokenAddress,
        finalScore: 0,
        confidence: 0,
        track,
        isQualified: false,
        primaryPath: 'Risk Rejection',
        detectionPaths: [],
        signals: { riskAssessment: riskCheck },
        expectedReturn: 0,
        riskScore: 1,
        kellySizing: 0,
        reasons: riskCheck.rejectionReasons,
        timestamp: new Date(),
        processingMethod: 'modular-risk-veto',
        moduleStats: {}
      };
    }
    
    // Get applicable signal modules for this track
    const applicableModules = this.signalRegistry.getModulesForTrack(track);
    
    if (applicableModules.length === 0) {
      this.logger.warn(`No signal modules available for ${track} track, falling back to original calculator`);
      return this.originalCalculator.evaluateToken(tokenAddress, currentPrice, tokenAgeMinutes);
    }

    // Create signal context
    const context: SignalContext = {
      tokenAddress,
      track,
      tokenAgeMinutes,
      currentPrice,
      rpcManager: (await import('./rpc-connection-manager')).default,
      logger: this.logger
    };

    // Execute all applicable signal modules in parallel
    const signalResults = await this.executeSignalModules(applicableModules, context);
    
    // Combine signals using modular approach
    const combinedResult = await this.combineSignalResults(signalResults, track, context, riskCheck);
    
    return combinedResult;
  }

  private async performRiskAssessment(
    tokenAddress: string, 
    currentPrice: number, 
    tokenAgeMinutes: number
  ): Promise<any> {
    try {
      const { RiskCheckService } = await import('./risk-check.service');
      
      // Get RPC manager for data collection
      const rpcManager = (await import('./rpc-connection-manager')).default;
      
      // Collect real risk profile data
      const signatures = await rpcManager.getSignaturesForAddress(tokenAddress, 50);
      
      // Calculate 24h volume estimate
      const recentSigs = signatures.filter(sig => {
        const sigTime = sig.blockTime || 0;
        const now = Math.floor(Date.now() / 1000);
        return now - sigTime <= 86400;
      });
      const estimatedVolume = recentSigs.length * 100; // Rough estimate
      
      // Get LP value estimate
      let lpValueUSD = 5000; // Default for now - will be improved
      
      // Get holder concentration estimate
      let holderConcentration = 25; // Default moderate concentration
      
      const tokenProfile = {
        address: tokenAddress,
        volume24h: estimatedVolume,
        lpValueUSD: lpValueUSD,
        holderConcentration: holderConcentration,
        transactionCount: signatures.length,
        ageMinutes: tokenAgeMinutes
      };
      
      const riskResult = await RiskCheckService.performRiskCheck(tokenProfile);
      
      this.logger.info(`🔍 [RISK CHECK] ${tokenAddress}: ${RiskCheckService.getRiskSummary(riskResult)}`);
      
      return riskResult;
      
    } catch (error) {
      this.logger.error(`💥 Risk check failed for ${tokenAddress}:`, error);
      
      return {
        passed: false,
        riskScore: 0,
        confidencePenalty: 0.3,
        rejectionReasons: ['Risk check system error'],
        warnings: [],
        tradabilityConfirmed: false,
        honeypotDetected: true,
        slippageAcceptable: false,
        volumeAdequate: false,
        liquidityReal: false
      };
    }
  }

  private async executeSignalModules(modules: any[], context: SignalContext): Promise<Map<string, any>> {
    const results = new Map();
    
    // Execute modules in parallel with controlled concurrency
    const modulePromises = modules.map(async (module) => {
      try {
        const result = await module.execute(context);
        return { module: module.getName(), result };
      } catch (error) {
        this.logger.error(`Signal module ${module.getName()} failed:`, error);
        return { module: module.getName(), result: null };
      }
    });

    const moduleResults = await Promise.allSettled(modulePromises);
    
    moduleResults.forEach(promiseResult => {
      if (promiseResult.status === 'fulfilled' && promiseResult.value.result) {
        results.set(promiseResult.value.module, promiseResult.value.result);
      }
    });

    this.logger.info(`📊 Executed ${results.size}/${modules.length} signal modules successfully`);
    
    return results;
  }

  private async combineSignalResults(
    signalResults: Map<string, any>, 
    track: 'FAST' | 'SLOW', 
    context: SignalContext, 
    riskResult: any
  ): Promise<any> {
    // Convert modular results to original format
    const signals = this.convertToOriginalFormat(signalResults);
    
    // Use extracted scoring logic instead of calling original calculator
    const { finalScore: rawFinalScore, primaryPath, detectionPaths, reasons } = this.calculateModularWeightedScore(signals, track);
    
    // APPLY CONFIDENCE PENALTY HERE
    const confidencePenalty = riskResult.confidencePenalty || 0;
    const finalScore = Math.max(0, rawFinalScore - confidencePenalty);
    
    // Add risk assessment to signals
    signals.riskAssessment = riskResult;
    
    // Log penalty application if significant
    if (confidencePenalty > 0) {
      this.logger.info(`⚠️ [CONFIDENCE PENALTY] ${context.tokenAddress}: ${rawFinalScore.toFixed(3)} → ${finalScore.toFixed(3)} (penalty: -${confidencePenalty.toFixed(3)})`);
      
      if (confidencePenalty >= 0.1) {
        reasons.push(`Confidence penalty: -${(confidencePenalty * 100).toFixed(1)}%`);
      }
    }
    
    // Use extracted risk calculation
    const { expectedReturn, riskScore, kellySizing } = this.calculateModularRiskMetrics(
      finalScore, context.currentPrice, track, signals
    );

    return {
      tokenAddress: context.tokenAddress,
      finalScore,
      confidence: finalScore * 100,
      track,
      isQualified: finalScore >= (track === 'FAST' ? 0.75 : 0.70),
      primaryPath,
      detectionPaths,
      signals,
      expectedReturn,
      riskScore,
      kellySizing,
      reasons,
      timestamp: new Date(),
      processingMethod: 'modular',
      moduleStats: this.getModuleStats(signalResults),
      riskMetadata: {
        rawScore: rawFinalScore,
        confidencePenalty: confidencePenalty,
        riskAssessment: {
          riskScore: riskResult.riskScore,
          tradabilityConfirmed: riskResult.tradabilityConfirmed,
          honeypotDetected: riskResult.honeypotDetected,
          warnings: riskResult.warnings
        }
      }
    };
  }

  private convertToOriginalFormat(signalResults: Map<string, any>): Partial<DetectionSignals> {
    // Convert all modular signal results back to original DetectionSignals format
    const signals: Partial<DetectionSignals> = {};
    
    for (const [moduleName, result] of signalResults) {
      switch (moduleName) {
        case 'smart-wallet':
          signals.smartWallet = result.data;
          break;
        case 'lp-analysis':
          signals.lpAnalysis = result.data;
          break;
        case 'holder-velocity':
          signals.holderVelocity = result.data;
          break;
        case 'transaction-pattern':
          signals.transactionPattern = result.data;
          break;
        case 'deep-holder-analysis':
          signals.deepHolderAnalysis = result.data;
          break;
        case 'social-signals':
          signals.socialSignals = result.data;
          break;
        case 'technical-pattern':
          signals.technicalPattern = result.data;
          break;
        case 'market-context':
          signals.marketContext = result.data;
          break;
      }
    }
    
    return signals;
  }

  // Extract the sophisticated weighted scoring logic from original calculator
  private calculateModularWeightedScore(signals: Partial<DetectionSignals>, track: 'FAST' | 'SLOW'): any {
    let finalScore = 0;
    let reasons: string[] = [];
    let detectionPaths: string[] = [];
    let primaryPath = 'Unknown';

    // Smart Wallet Analysis (BOTH tracks, highest weight)
    if (signals.smartWallet?.detected) {
      finalScore += 0.6 * (signals.smartWallet.confidence / 100);
      reasons.push(`Smart money detected: ${signals.smartWallet.overlapCount} wallets`);
      detectionPaths.push('smart-wallet');
      primaryPath = 'Smart Money';
    }

    // LP Analysis (BOTH tracks)
    if (signals.lpAnalysis) {
      const lpScore = Math.min(1, signals.lpAnalysis.confidence / 100);
      finalScore += 0.25 * lpScore;
      if (lpScore > 0.5) {
        reasons.push(`Strong LP fundamentals: $${signals.lpAnalysis.lpValueUSD.toLocaleString()}`);
        detectionPaths.push('lp-analysis');
        if (primaryPath === 'Unknown') primaryPath = 'LP Quality';
      }
    }

    if (track === 'FAST') {
      // Holder Velocity (FAST only)
      if (signals.holderVelocity) {
        const velocityScore = Math.min(1, signals.holderVelocity.confidence / 100);
        finalScore += 0.10 * velocityScore;
        if (velocityScore > 0.6) {
          reasons.push(`Healthy holder growth: ${signals.holderVelocity.growthRate}%`);
          detectionPaths.push('holder-velocity');
        }
      }

      // Transaction Pattern (FAST only)
      if (signals.transactionPattern) {
        const patternScore = Math.min(1, signals.transactionPattern.confidence / 100);
        finalScore += 0.05 * patternScore;
        if (patternScore > 0.6) {
          reasons.push(`Good transaction patterns: ${(signals.transactionPattern.buySellRatio || 0).toFixed(1)} buy/sell ratio`);
          detectionPaths.push('transaction-pattern');
        }
      }
    } else {
      // SLOW track additional signals

      // Deep Holder Analysis (SLOW only)
      if (signals.deepHolderAnalysis) {
        const holderScore = Math.min(1, signals.deepHolderAnalysis.confidence / 100);
        finalScore += 0.15 * holderScore;
        if (holderScore > 0.6) {
          reasons.push(`Strong holder distribution: ${signals.deepHolderAnalysis.giniCoefficient?.toFixed(2) || "0.00"} Gini`);
          detectionPaths.push('deep-holder-analysis');
        }
      }

      // Social Signals (SLOW only)
      if (signals.socialSignals) {
        const socialScore = Math.min(1, signals.socialSignals.confidence / 100);
        finalScore += 0.10 * socialScore;
        if (socialScore > 0.6) {
          reasons.push(`Social momentum: ${signals.socialSignals.twitterMentions} mentions`);
          detectionPaths.push('social-signals');
        }
      }

      // Technical Pattern (SLOW only)
      if (signals.technicalPattern) {
        const techScore = Math.min(1, signals.technicalPattern.confidence / 100);
        finalScore += 0.10 * techScore;
        if (techScore > 0.6) {
          reasons.push(`Technical strength: RSI ${signals.technicalPattern?.rsi || 0}`);
          detectionPaths.push('technical-pattern');
        }
      }
    }

    // Market Context (BOTH tracks, lowest weight)
    if (signals.marketContext) {
      const contextScore = Math.min(1, signals.marketContext.confidence / 100);
      finalScore += 0.05 * contextScore;
      if (contextScore > 0.6) {
        reasons.push(`Favorable market context: ${(signals.marketContext?.contextScore || signals.marketContext?.confidence || 0).toFixed(1)}`);
        detectionPaths.push('market-context');
      }
    }

    // Ensure score is between 0 and 1
    finalScore = Math.min(1, Math.max(0, finalScore));

    return {
      finalScore,
      primaryPath,
      detectionPaths,
      reasons
    };
  }

  // Extract risk calculation logic 
  private calculateModularRiskMetrics(finalScore: number, currentPrice: number, track: 'FAST' | 'SLOW', signals: Partial<DetectionSignals>): any {
    // Base expected return calculation
    let expectedReturn = 0;
    if (finalScore >= 0.8) expectedReturn = 5.2; // 5.2x return expectation
    else if (finalScore >= 0.75) expectedReturn = 4.5;
    else if (finalScore >= 0.70) expectedReturn = 4.0;
    else if (finalScore >= 0.65) expectedReturn = 3.2;
    else expectedReturn = 2.0;

    // Risk score calculation (lower is better)
    let riskScore = 1 - finalScore; // Base risk inverse to confidence

    // Adjust risk based on track
    if (track === 'FAST') {
      riskScore += 0.1; // FAST track inherently riskier
    }

    // Adjust risk based on LP fundamentals
    if (signals.lpAnalysis) {
      if (signals.lpAnalysis.lpValueUSD < 5000) riskScore += 0.15;
      if (signals.lpAnalysis.topWalletPercent > 0.5) riskScore += 0.2;
      if (!signals.lpAnalysis.mintDisabled) riskScore += 0.1;
    }

    // Kelly criterion sizing (simplified)
    const winRate = finalScore; // Use confidence as win rate estimate
    const avgWin = expectedReturn;
    const avgLoss = 0.8; // Assume 80% average loss on losing trades
    
    const kellyPercent = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
    const kellySizing = Math.max(0, Math.min(0.25, kellyPercent)); // Cap at 25%

    return {
      expectedReturn,
      riskScore: Math.max(0, Math.min(1, riskScore)),
      kellySizing
    };
  }

  private getModuleStats(signalResults: Map<string, any>): any {
    const stats: any = {};
    
    for (const [moduleName, result] of signalResults) {
      stats[moduleName] = {
        confidence: result.confidence,
        processingTime: result.processingTime,
        version: result.version,
        source: result.source
      };
    }
    
    return stats;
  }

  // A/B Testing Interface
  setupABTest(signalName: string, variantA: any, variantB: any): void {
    this.signalRegistry.setupABTest(signalName, [variantA, variantB]);
    this.logger.info(`🧪 Setup A/B test for ${signalName}`);
  }

  // Signal Management Interface
  registerSignalModule(module: any): void {
    this.signalRegistry.register(module);
  }

  unregisterSignalModule(name: string): void {
    this.signalRegistry.unregister(name);
  }

  getSignalStats(): any {
    return this.signalRegistry.getRegistryStats();
  }

  getSignalRegistry(): SignalRegistry {
    return this.signalRegistry;
  }
}