// src/repositories/smart-wallet-repository.ts
import SmartWallet from '../legacy/smartWallet';
import { ISmartWallet } from '../legacy/smartWallet';
import { logger } from '../utils/logger';

export interface SmartWalletQueryOptions {
  minSuccessRate: number;
  minSuccessfulTrades: number;
  lookbackPeriod: number; // in days
  minConfidenceScore?: number;
}

/**
 * Repository for managing and querying smart wallets
 * Enhanced for 4x meme coin return identification
 */
class SmartWalletRepository {
  // Tier thresholds - calibrated for identifying 4x potential
  private readonly TIER_THRESHOLDS = {
    tier1: { successRate: 0.7, trades: 15, confidence: 0.8 },  // Elite wallets
    tier2: { successRate: 0.5, trades: 10, confidence: 0.6 },  // Good performers
    tier3: { successRate: 0.3, trades: 5, confidence: 0.4 }    // Average performers
  };

  /**
   * Get all smart wallet addresses without additional data
   * @returns Promise<string[]>
   */
  async getAllSmartWalletAddresses(): Promise<string[]> {
    try {
      const wallets = await SmartWallet.find({})
        .select('address')
        .lean();
      
      return wallets.map(wallet => wallet.address);
    } catch (error) {
      logger.error('Error fetching smart wallet addresses:', error);
      return [];
    }
  }

  /**
   * Get all smart wallets with tier information
   * Tiers are calculated based on success metrics
   * @returns Promise<Array<{address: string, tier: string}>>
   */
  async getAllSmartWalletsWithTier(): Promise<Array<{address: string, tier: string}>> {
    try {
      const wallets = await SmartWallet.find({})
        .select('address predictedSuccessRate successfulTrades confidenceScore')
        .lean();
      
      return wallets.map(wallet => ({
        address: wallet.address,
        tier: this.calculateWalletTier(wallet)
      }));
    } catch (error) {
      logger.error('Error fetching smart wallets with tiers:', error);
      return [];
    }
  }

  /**
   * Get qualified wallets based on specified criteria
   * @param opts Query options
   * @returns Promise<ISmartWallet[]>
   */
  async getQualifiedWallets(opts: SmartWalletQueryOptions): Promise<ISmartWallet[]> {
    const cutoffDate = new Date(Date.now() - opts.lookbackPeriod * 24 * 60 * 60 * 1000);

    const query: any = {
      predictedSuccessRate: { $gte: opts.minSuccessRate },
      successfulTrades: { $gte: opts.minSuccessfulTrades },
      lastActive: { $gte: cutoffDate }
    };

    if (opts.minConfidenceScore !== undefined) {
      query.confidenceScore = { $gte: opts.minConfidenceScore };
    }

    return SmartWallet.find(query)
      .sort({ predictedSuccessRate: -1, confidenceScore: -1 })
      .lean();
  }

  /**
   * Get wallets by tier
   * @param tier Tier to filter by (tier1, tier2, tier3)
   * @returns Promise<ISmartWallet[]>
   */
  async getWalletsByTier(tier: string): Promise<ISmartWallet[]> {
    try {
      const thresholds = this.TIER_THRESHOLDS[tier as keyof typeof this.TIER_THRESHOLDS];
      if (!thresholds) {
        throw new Error(`Invalid tier: ${tier}`);
      }

      return await SmartWallet.find({
        predictedSuccessRate: { $gte: thresholds.successRate },
        successfulTrades: { $gte: thresholds.trades },
        confidenceScore: { $gte: thresholds.confidence }
      }).lean();
    } catch (error) {
      logger.error(`Error fetching wallets for tier ${tier}:`, error);
      return [];
    }
  }

  /**
   * Calculate wallet tier based on performance metrics
   * Optimized for identifying wallets with high 4x success rate
   * @param wallet Wallet object with metrics
   * @returns string Tier classification
   */
  private calculateWalletTier(wallet: any): string {
    const { predictedSuccessRate, successfulTrades, confidenceScore } = wallet;
    
    // Check for tier1 qualification
    if (
      predictedSuccessRate >= this.TIER_THRESHOLDS.tier1.successRate &&
      successfulTrades >= this.TIER_THRESHOLDS.tier1.trades &&
      (confidenceScore ?? 0) >= this.TIER_THRESHOLDS.tier1.confidence
    ) {
      return 'tier1';
    }
    
    // Check for tier2 qualification
    if (
      predictedSuccessRate >= this.TIER_THRESHOLDS.tier2.successRate &&
      successfulTrades >= this.TIER_THRESHOLDS.tier2.trades &&
      (confidenceScore ?? 0) >= this.TIER_THRESHOLDS.tier2.confidence
    ) {
      return 'tier2';
    }
    
    // Check for tier3 qualification
    if (
      predictedSuccessRate >= this.TIER_THRESHOLDS.tier3.successRate &&
      successfulTrades >= this.TIER_THRESHOLDS.tier3.trades &&
      (confidenceScore ?? 0) >= this.TIER_THRESHOLDS.tier3.confidence
    ) {
      return 'tier3';
    }
    
    // Default to lowest tier if doesn't meet any criteria
    return 'tier3';
  }

  /**
   * Update wallet performance metrics
   * @param address Wallet address
   * @param metrics Updated metrics
   * @returns Promise<boolean>
   */
  async updateWalletMetrics(
    address: string, 
    metrics: {
      predictedSuccessRate?: number;
      successfulTrades?: number;
      confidenceScore?: number;
      lastActive?: Date;
    }
  ): Promise<boolean> {
    try {
      const result = await SmartWallet.updateOne(
        { address },
        { $set: metrics }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Error updating wallet metrics:', error);
      return false;
    }
  }
}

export default new SmartWalletRepository();