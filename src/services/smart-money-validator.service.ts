// src/services/smart-money-validator.service.ts
import SmartWallet from '../legacy/smartWallet';
import rpcConnectionManager from './rpc-connection-manager'; 
import { logger } from '../utils/logger';

export interface SmartMoneyValidationResult {
  overlapCount: number;
  overlappedWallets: string[];
  smartWalletScore: number;
  timeBasedSignalStrength: number;
  isSmartMoneyToken: boolean;
  buyConcentration: number;
  highestTierDetected: string;
}

/**
 * SmartMoneyValidatorService
 *
 * Optimized validator for identifying tokens with 4x potential
 * by analyzing smart wallet activity patterns.
 */
export class SmartMoneyValidatorService {
  // Time window constants (in milliseconds)
  private static readonly PRIME_TIME_WINDOW = 3 * 60 * 1000; // 3 minutes
  private static readonly EARLY_TIME_WINDOW = 10 * 60 * 1000; // 10 minutes

  // Smart wallet tier weights
  private static readonly WALLET_WEIGHTS = {
    tier1: 1.0,
    tier2: 0.7,
    tier3: 0.4
  };

  /**
   * Check if token buyers overlap with known smart wallets
   */
  static async validateBuyers(tokenAddress: string): Promise<SmartMoneyValidationResult> {
    try {
      const buyersWithTime = await rpcConnectionManager.getTokenBuyersWithTimestamps(tokenAddress);

      if (buyersWithTime.length === 0) {
        logger.info(`No buyers found for token ${tokenAddress}`);
        return this.createEmptyResult();
      }

      const smartWalletsWithTier = await SmartWallet.find();
      const smartWalletMap = new Map(
        smartWalletsWithTier.map(w => [w.address.toLowerCase(), w.tierMetrics?.tier || 3])
      );

      const launchTime = Math.min(...buyersWithTime.map((b: { timestamp: number }) => b.timestamp));

      const overlappedWalletsData = buyersWithTime
        .filter((b: { address: string }) => smartWalletMap.has(b.address.toLowerCase()))
        .map((b: { address: string; timestamp: number; amount: number }) => ({
          address: b.address.toLowerCase(),
          tier: smartWalletMap.get(b.address.toLowerCase()) || 'tier3',
          timeSinceLaunch: b.timestamp - launchTime,
          amount: b.amount
        }));

      const overlappedWallets = overlappedWalletsData.map((w: { address: string }) => w.address);
      const overlapCount = overlappedWallets.length;
      const tierValues = overlappedWalletsData.map((w: { address: string; tier: string | 1 | 2 | 3; timeSinceLaunch: number; amount: number }) => {
      const tier = w.tier || 3;
      return typeof tier === "string" ? tier : `tier${tier}`;
    });
      const highestTierDetected = this.getHighestTier(tierValues);
      const smartWalletScore = this.calculateSmartWalletScore(overlappedWalletsData);
      const timeBasedSignalStrength = this.calculateTimeSignalStrength(overlappedWalletsData, launchTime);
      const buyConcentration = this.calculateBuyConcentration(overlappedWalletsData, buyersWithTime);

      const isSmartMoneyToken = this.evaluateSmartMoneyStatus(
        overlapCount,
        smartWalletScore,
        timeBasedSignalStrength,
        buyConcentration,
        highestTierDetected
      );

      logger.info(`Token ${tokenAddress} has ${overlapCount} smart wallet overlaps with score ${smartWalletScore.toFixed(2)}.`);

      return {
        overlapCount,
        overlappedWallets,
        smartWalletScore,
        timeBasedSignalStrength,
        buyConcentration,
        isSmartMoneyToken,
        highestTierDetected
      };
    } catch (err) {
      logger.error(`Error validating smart money for token ${tokenAddress}:`, err);
      return this.createEmptyResult();
    }
  }

  /**
   * Validate multiple tokens and return only those passing smart money criteria
   */
  static async validateTokens(tokens: string[]): Promise<string[]> {
    const validTokens: string[] = [];

    for (const token of tokens) {
      const result = await this.validateBuyers(token);
      if (result.isSmartMoneyToken) {
        validTokens.push(token);
      }
    }

    return validTokens;
  }

  /**
   * Get full analysis output for a token
   */
  static async getDetailedAnalysis(tokenAddress: string): Promise<SmartMoneyValidationResult> {
    return this.validateBuyers(tokenAddress);
  }

  /**
   * Determine if a token qualifies as smart money
   */
  private static evaluateSmartMoneyStatus(
    overlapCount: number,
    smartWalletScore: number,
    timeBasedSignalStrength: number,
    buyConcentration: number,
    highestTierDetected: string
  ): boolean {
    if (overlapCount >= 2 && smartWalletScore >= 1.4) return true;
    if (overlapCount >= 1 && highestTierDetected === 'tier1' && timeBasedSignalStrength > 0.9) return true;
    if (overlapCount >= 1 && smartWalletScore >= 1.0 && timeBasedSignalStrength > 0.8) return true;
    if (buyConcentration > 0.3 && smartWalletScore >= 1.2) return true;
    return false;
  }

  /**
   * Return the highest tier found
   */
  private static getHighestTier(tiers: string[]): string {
    if (tiers.includes('tier1')) return 'tier1';
    if (tiers.includes('tier2')) return 'tier2';
    if (tiers.includes('tier3')) return 'tier3';
    return 'none';
  }

  /**
   * Score based on tier and timing
   */
  private static calculateSmartWalletScore(walletsData: any[]): number {
    if (walletsData.length === 0) return 0;

    return walletsData.reduce((score, wallet) => {
      const tierWeight = this.WALLET_WEIGHTS[wallet.tier as keyof typeof this.WALLET_WEIGHTS];
      let timeMultiplier = 1.0;
      if (wallet.timeSinceLaunch <= this.PRIME_TIME_WINDOW) {
        timeMultiplier = 1.5;
      } else if (wallet.timeSinceLaunch <= this.EARLY_TIME_WINDOW) {
        timeMultiplier = 1.2;
      }
      return score + (tierWeight * timeMultiplier);
    }, 0);
  }

  /**
   * Strength of wallet buys based on time clustering
   */
  private static calculateTimeSignalStrength(walletsData: any[], launchTime: number): number {
    if (walletsData.length < 2) return 0;

    const primeTimeWallets = walletsData.filter(w => w.timeSinceLaunch <= this.PRIME_TIME_WINDOW).length;
    const timeClusterScore = Math.min(1.0, primeTimeWallets / walletsData.length);

    const buyTimes = walletsData.map(w => w.timeSinceLaunch);
    const firstBuy = Math.min(...buyTimes);
    const lastBuy = Math.max(...buyTimes);
    const timeSpread = lastBuy - firstBuy;

    const normalizedTimeSpread = Math.min(1.0, timeSpread / (30 * 60 * 1000));
    const timeSpreadScore = 1.0 - normalizedTimeSpread;

    return (timeClusterScore * 0.7) + (timeSpreadScore * 0.3);
  }

  /**
   * How much of the total volume comes from smart wallets
   */
  private static calculateBuyConcentration(smartWallets: any[], allBuyers: any[]): number {
    if (smartWallets.length === 0 || allBuyers.length === 0) return 0;

    const smartWalletAmount = smartWallets.reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalAmount = allBuyers.reduce((sum, b) => sum + (b.amount || 0), 0);

    return totalAmount > 0 ? Math.min(1.0, smartWalletAmount / totalAmount) : 0;
  }

  /**
   * Default result when validation fails
   */
  private static createEmptyResult(): SmartMoneyValidationResult {
    return {
      overlapCount: 0,
      overlappedWallets: [],
      smartWalletScore: 0,
      timeBasedSignalStrength: 0,
      buyConcentration: 0,
      isSmartMoneyToken: false,
      highestTierDetected: 'none'
    };
  }
}

export default SmartMoneyValidatorService;