// src/services/token-tracking-data-enhanced.service.ts
// ENHANCED VERSION: Integrates your existing service with our smart wallet tier system

import { FilterQuery, Model, UpdateQuery, ClientSession, PipelineStage } from 'mongoose';
import axios from 'axios';
import CircuitBreaker from 'opossum';
import { z } from 'zod';
import TokenTrackingData, { ITokenTrackingData } from '../models/tokenTrackingData';
import SmartWallet from '../models/smartWallet'; // Our tier system
import { logger } from '../utils/logger';
import { config } from '../config/app-config';
import { StatsD } from 'hot-shots';

// --- Your existing interfaces (UNCHANGED) ---
export interface SmartMoneyUpdate {
  totalWallets: number;
  sniperWallets?: number;
  gemSpotterWallets?: number;
  earlyMoverWallets?: number;
  buyToSellRatio: number;
  is4xCandidate?: boolean;
  predictedSuccessRate?: number;
}

export interface TokenPriceUpdate {
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  holderCount?: number;
  timestamp: Date;
}

export interface PatternUpdate {
  patternType: string;
  confidence: number;
  timeframe: 'fast' | 'slow';
}

// --- Your existing service class with tier integration ---
export class EnhancedTokenTrackingDataService {
  private model: Model<ITokenTrackingData>;
  private priceCB: CircuitBreaker<[string], TokenPriceUpdate>;
  private patternCB: CircuitBreaker<[string], PatternUpdate[]>;
  private smartMoneyCB: CircuitBreaker<[string], SmartMoneyUpdate>;

  constructor(model?: Model<ITokenTrackingData>) {
    this.model = model || TokenTrackingData;

    // Your existing circuit breakers (UNCHANGED)
    this.priceCB = new CircuitBreaker(this.fetchExternalPriceData.bind(this), {
      timeout: 10_000, errorThresholdPercentage: 50, resetTimeout: 30_000
    });
    this.patternCB = new CircuitBreaker(this.fetchPatternDetection.bind(this), {
      timeout: 15_000, errorThresholdPercentage: 50, resetTimeout: 60_000
    });
    
    // ENHANCED: Circuit breaker now uses our tier system
    this.smartMoneyCB = new CircuitBreaker(this.fetchSmartMoneyDataWithTiers.bind(this), {
      timeout: 10_000, errorThresholdPercentage: 50, resetTimeout: 30_000
    });
    
    this.setupCircuitBreakerListeners();
  }

  // ===== NEW: TIER-BASED SMART MONEY ANALYSIS =====
  
  /**
   * REPLACES external API with our tier-weighted smart wallet analysis
   */
  private async fetchSmartMoneyDataWithTiers(tokenAddress: string): Promise<SmartMoneyUpdate> {
    try {
      logger.info(`Analyzing token ${tokenAddress} with tier-weighted smart wallets`);
      
      // Get all active smart wallets
      const activeWallets = await SmartWallet.find({ isActive: true }).exec();
      
      if (activeWallets.length === 0) {
        logger.warn('No active smart wallets found');
        return {
          totalWallets: 0,
          buyToSellRatio: 0,
          is4xCandidate: false,
          predictedSuccessRate: 0
        };
      }

      // SIMULATE: Check which wallets are "interested" in this token
      // In production, this would check actual wallet transactions for this token
      const interestedWallets = await this.getInterestedWallets(tokenAddress, activeWallets);
      
      if (interestedWallets.length === 0) {
        logger.debug(`No smart wallets interested in token ${tokenAddress}`);
        return {
          totalWallets: 0,
          buyToSellRatio: 0,
          is4xCandidate: false,
          predictedSuccessRate: 0
        };
      }

      // Calculate tier-weighted signals
      const tierWeightedAnalysis = this.calculateTierWeightedSignals(interestedWallets);
      
      // Categorize wallets by type (based on your existing interface)
      const walletCategorization = this.categorizeWallets(interestedWallets);
      
      const result: SmartMoneyUpdate = {
        totalWallets: interestedWallets.length,
        sniperWallets: walletCategorization.sniperWallets,
        gemSpotterWallets: walletCategorization.gemSpotterWallets,
        earlyMoverWallets: walletCategorization.earlyMoverWallets,
        buyToSellRatio: tierWeightedAnalysis.buyToSellRatio,
        is4xCandidate: tierWeightedAnalysis.is4xCandidate,
        predictedSuccessRate: tierWeightedAnalysis.predictedSuccessRate
      };

      logger.info(`Smart money analysis for ${tokenAddress}:`, {
        totalWallets: result.totalWallets,
        predictedSuccessRate: result.predictedSuccessRate,
        is4xCandidate: result.is4xCandidate
      });

      return result;

    } catch (error) {
      logger.error(`Error in tier-based smart money analysis for ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * SIMULATE: Determine which wallets are interested in this token
   * In production: Check actual transactions, holdings, or recent activity
   */
  private async getInterestedWallets(tokenAddress: string, allWallets: any[]): Promise<any[]> {
    // SIMULATION: For now, randomly select wallets based on their tier
    // Higher tier wallets more likely to be "interested"
    const interestedWallets = [];
    
    for (const wallet of allWallets) {
      const tier = wallet.tierMetrics.tier;
      
      // Probability of interest based on tier
      const interestProbability = tier === 1 ? 0.8 : tier === 2 ? 0.6 : 0.3;
      
      if (Math.random() < interestProbability) {
        interestedWallets.push(wallet);
      }
    }
    
    // Ensure at least one wallet is interested for testing
    if (interestedWallets.length === 0 && allWallets.length > 0) {
      interestedWallets.push(allWallets[0]);
    }
    
    return interestedWallets;
  }

  /**
   * Calculate tier-weighted signals for 4x prediction
   */
  private calculateTierWeightedSignals(interestedWallets: any[]) {
    let totalWeightedSignal = 0;
    let totalWeight = 0;
    
    // Base signal strength (could be dynamically calculated based on market conditions)
    const baseSignalStrength = 0.85; // Strong buy signal
    
    // Calculate weighted average
    for (const wallet of interestedWallets) {
      const weight = wallet.tierMetrics.weight_multiplier;
      const walletSignal = baseSignalStrength * (wallet.memeTokenMetrics.returns4xRate || 0.8);
      const weightedSignal = walletSignal * weight;
      
      totalWeightedSignal += weightedSignal;
      totalWeight += weight;
    }
    
    const averageWeightedSignal = totalWeight > 0 ? totalWeightedSignal / totalWeight : 0;
    const predictedSuccessRate = Math.min(95, averageWeightedSignal * 100); // Cap at 95%
    
    return {
      predictedSuccessRate: Math.round(predictedSuccessRate * 10) / 10, // Round to 1 decimal
      is4xCandidate: predictedSuccessRate >= 74, // Your 74-76% success target
      buyToSellRatio: 2.0 + (averageWeightedSignal * 2), // Higher signals = higher buy ratio
      totalWeightedSignal,
      totalWeight
    };
  }

  /**
   * Categorize wallets by type for your existing interface
   */
  private categorizeWallets(interestedWallets: any[]) {
    let sniperWallets = 0;
    let gemSpotterWallets = 0;
    let earlyMoverWallets = 0;
    
    for (const wallet of interestedWallets) {
      const categories = wallet.category || [];
      
      if (categories.includes('sniper')) sniperWallets++;
      if (categories.includes('gem-spotter')) gemSpotterWallets++;
      if (categories.includes('early-mover')) earlyMoverWallets++;
      
      // Default categorization based on tier if no specific category
      if (sniperWallets + gemSpotterWallets + earlyMoverWallets === 0) {
        if (wallet.tierMetrics.tier === 1) earlyMoverWallets++;
        else if (wallet.tierMetrics.tier === 2) gemSpotterWallets++;
        else sniperWallets++;
      }
    }
    
    return { sniperWallets, gemSpotterWallets, earlyMoverWallets };
  }

  // ===== YOUR EXISTING METHODS (UNCHANGED) =====
  
  /**
   * Update smart-money activity - now uses our tier system
   */
  async updateSmartMoneyActivity(
    address: string,
    smUpd: SmartMoneyUpdate,
    session?: ClientSession
  ): Promise<ITokenTrackingData|null> {
    // Your existing validation and update logic (UNCHANGED)
    const now = new Date();
    const op: UpdateQuery<ITokenTrackingData> = { $set: {} };
    
    // Map our tier system results to your existing schema
    if (smUpd.totalWallets !== undefined) op.$set!['smartMoneyActivity.totalWallets'] = smUpd.totalWallets;
    if (smUpd.buyToSellRatio !== undefined) op.$set!['smartMoneyActivity.buyToSellRatio'] = smUpd.buyToSellRatio;
    if (smUpd.sniperWallets !== undefined) op.$set!['smartMoneyActivity.sniperWallets'] = smUpd.sniperWallets;
    if (smUpd.gemSpotterWallets !== undefined) op.$set!['smartMoneyActivity.gemSpotterWallets'] = smUpd.gemSpotterWallets;
    if (smUpd.earlyMoverWallets !== undefined) op.$set!['smartMoneyActivity.earlyMoverWallets'] = smUpd.earlyMoverWallets;
    if (smUpd.is4xCandidate !== undefined) op.$set!['smartMoneyActivity.is4xCandidate'] = smUpd.is4xCandidate;
    if (smUpd.predictedSuccessRate !== undefined) op.$set!['smartMoneyActivity.predictedSuccessRate'] = smUpd.predictedSuccessRate;
    
    op.$set!['smartMoneyActivity.latestActivity'] = now;
    op.$set!['lastUpdated'] = now;
    
    return this.model.findOneAndUpdate(
      { address },
      op,
      { new: true, lean: true, session, runValidators: true, context: 'query' }
    ).exec();
  }

  // ===== PLACEHOLDER METHODS (Keep your existing implementations) =====
  
  private async fetchExternalPriceData(address: string): Promise<TokenPriceUpdate> {
    // Keep your existing implementation or add price fetching logic
    throw new Error('fetchExternalPriceData not implemented - use your existing version');
  }

  private async fetchPatternDetection(address: string): Promise<PatternUpdate[]> {
    // Keep your existing implementation or add pattern detection logic
    throw new Error('fetchPatternDetection not implemented - use your existing version');
  }

  private setupCircuitBreakerListeners() {
    // Keep your existing circuit breaker setup
    const attach = (cb: CircuitBreaker, name: string) => {
      ['open','close','halfOpen','fallback'].forEach(evt => {
        cb.on(evt, () => {
          const level = evt==='open'||evt==='fallback' ? 'warn' : 'info';
          logger[level](`${name} circuit ${evt}`, {});
        });
      });
    };
    
    attach(this.priceCB, 'priceData');
    attach(this.patternCB, 'patternDetection');
    attach(this.smartMoneyCB, 'smartMoneyTiers'); // Updated name
  }

  // ===== TEST METHOD =====
  
  /**
   * Test the tier integration with a mock token
   */
  async testTierIntegration(mockTokenAddress: string = 'So11111111111111111111111111111111111111112') {
    logger.info(`Testing tier integration with mock token: ${mockTokenAddress}`);
    
    try {
      const result = await this.fetchSmartMoneyDataWithTiers(mockTokenAddress);
      
      console.log('🎯 TIER INTEGRATION TEST RESULTS:');
      console.log(`   Token Address: ${mockTokenAddress}`);
      console.log(`   Total Wallets: ${result.totalWallets}`);
      console.log(`   Predicted Success Rate: ${result.predictedSuccessRate}%`);
      console.log(`   Is 4x Candidate: ${result.is4xCandidate}`);
      console.log(`   Buy/Sell Ratio: ${result.buyToSellRatio?.toFixed(2)}`);
      console.log(`   Early Movers: ${result.earlyMoverWallets}`);
      console.log(`   Gem Spotters: ${result.gemSpotterWallets}`);
      console.log(`   Snipers: ${result.sniperWallets}`);
      
      return result;
    } catch (error) {
      logger.error('Tier integration test failed:', error);
      throw error;
    }
  }
}

// Export enhanced service
export const enhancedTokenTrackingDataService = new EnhancedTokenTrackingDataService();