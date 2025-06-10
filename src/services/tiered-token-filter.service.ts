// src/services/tiered-token-filter.service.ts

import { logger } from '../utils/logger';

export interface TieredFilterResult {
  tier: 'fresh-gem' | 'established' | 'rejected';
  passed: boolean;
  score: number;
  securityScore: number;
  organicScore: number;
  rejectionReasons: string[];
  riskLevel: 'high' | 'medium' | 'low';
}

export interface TokenMetrics {
  address: string;
  ageMinutes: number;
  uniqueHolders: number;
  transactionCount: number;
  marketCap: number;
  volume24h: number;
  lpValueUSD: number;
  largestHolderPercentage: number;
  hasMintAuthority: boolean;
  hasFreezeAuthority: boolean;
  smartWalletScore: number;
  // New organic activity metrics
  uniqueWallets: number;
  avgTransactionSpread: number;
  buyToSellRatio: number;
  transactionSizeVariation: number;
  volumeToLiquidityRatio: number;
  priceStability: number;
}

export class TieredTokenFilter {
  
  // Fresh Gem Criteria (0-30 minutes old)
  private static readonly FRESH_GEM_CRITERIA = {
    security: {
      mintAuthorityRenounced: true,
      freezeAuthorityRenounced: true,
      topHolderMaxPercent: 30,
      lpValueMinUSD: 8000,
      developerHoldingMax: 50, // More lenient for fresh tokens
    },
    quality: {
      minUniqueWallets: 15,
      minTransactions: 25,
      minMarketCap: 10000,        // $10K minimum
      minVolume: 5000,            // $5K minimum volume
      minSmartWalletScore: 0.6,   // Lower threshold but still required
    },
    organic: {
      minUniqueWallets: 15,
      minTransactionSpread: 2,     // Minutes
      minBuyToSellRatio: 1.2,
      minTransactionVariation: 0.2,
      minVolumeToLiquidityRatio: 0.05,
      maxPriceVolatility: 0.7,     // 70% max price swing
    }
  };

  // Established Token Criteria (30+ minutes old)
  private static readonly ESTABLISHED_CRITERIA = {
    quality: {
      minHolders: 300,
      minTransactions: 500,
      minMarketCap: 100000,       // $100K
      minVolume: 100000,          // $100K
      maxTopHolderPercent: 30,
      minSmartWalletScore: 0.4,   // Lower reliance on smart wallets
    },
    security: {
      mintAuthorityRenounced: false,  // More lenient - time has proven it
      freezeAuthorityRenounced: true, // Still important
      maxTopHolderPercent: 30,
    }
  };

  /**
   * Main filtering method - determines tier and pass/fail
   */
  static evaluateToken(metrics: TokenMetrics): TieredFilterResult {
    const rejectionReasons: string[] = [];
    
    // Determine which tier to evaluate against
    const isFreshToken = metrics.ageMinutes <= 30;
    
    if (isFreshToken) {
      return this.evaluateFreshGem(metrics);
    } else {
      return this.evaluateEstablishedToken(metrics);
    }
  }

  /**
   * Evaluate fresh gem (0-30 minutes old)
   */
  private static evaluateFreshGem(metrics: TokenMetrics): TieredFilterResult {
    const rejectionReasons: string[] = [];
    let securityScore = 0;
    let organicScore = 0;
    let qualityScore = 0;

    // Security Checks (Must Pass ALL)
    const securityChecks = this.checkFreshGemSecurity(metrics, rejectionReasons);
    securityScore = securityChecks.score;

    // Quality Checks  
    const qualityChecks = this.checkFreshGemQuality(metrics, rejectionReasons);
    qualityScore = qualityChecks.score;

    // Organic Activity Checks (Must Pass 3 of 5)
    const organicChecks = this.checkOrganicActivity(metrics, rejectionReasons);
    organicScore = organicChecks.score;

    // Fresh gems must pass security + quality + organic activity
    const passed = securityChecks.passed && qualityChecks.passed && organicChecks.passed;
    const overallScore = (securityScore + qualityScore + organicScore) / 3;

    logger.info(`Fresh gem evaluation for ${metrics.address}:`, {
      security: securityScore,
      quality: qualityScore,  
      organic: organicScore,
      passed
    });

    return {
      tier: 'fresh-gem',
      passed,
      score: overallScore,
      securityScore,
      organicScore,
      rejectionReasons,
      riskLevel: 'high'
    };
  }

  /**
   * Evaluate established token (30+ minutes old)
   */
  private static evaluateEstablishedToken(metrics: TokenMetrics): TieredFilterResult {
    const rejectionReasons: string[] = [];
    const criteria = this.ESTABLISHED_CRITERIA;

    // Standard quality checks with partner's criteria
    if (metrics.uniqueHolders < criteria.quality.minHolders) {
      rejectionReasons.push(`Fewer than ${criteria.quality.minHolders} holders`);
    }
    
    if (metrics.transactionCount < criteria.quality.minTransactions) {
      rejectionReasons.push(`Fewer than ${criteria.quality.minTransactions} transactions`);
    }
    
    if (metrics.marketCap < criteria.quality.minMarketCap) {
      rejectionReasons.push(`Market cap below $${criteria.quality.minMarketCap.toLocaleString()}`);
    }
    
    if (metrics.volume24h < criteria.quality.minVolume) {
      rejectionReasons.push(`Volume below $${criteria.quality.minVolume.toLocaleString()}`);
    }
    
    if (metrics.largestHolderPercentage > criteria.quality.maxTopHolderPercent) {
      rejectionReasons.push(`Top holder owns >${criteria.quality.maxTopHolderPercent}%`);
    }

    // Basic security for established tokens
    if (metrics.hasFreezeAuthority) {
      rejectionReasons.push('Freeze authority still exists');
    }

    const passed = rejectionReasons.length === 0;
    const score = this.calculateEstablishedScore(metrics);

    return {
      tier: 'established',
      passed,
      score,
      securityScore: metrics.hasFreezeAuthority ? 0.5 : 1.0,
      organicScore: 1.0, // Assume organic if it survived 30+ minutes
      rejectionReasons,
      riskLevel: 'medium'
    };
  }

  /**
   * Check fresh gem security requirements
   */
  private static checkFreshGemSecurity(metrics: TokenMetrics, rejectionReasons: string[]) {
    const criteria = this.FRESH_GEM_CRITERIA.security;
    let score = 0;
    let passed = true;

    // Mint authority check
    if (metrics.hasMintAuthority) {
      rejectionReasons.push('Mint authority not renounced');
      passed = false;
    } else {
      score += 0.25;
    }

    // Freeze authority check  
    if (metrics.hasFreezeAuthority) {
      rejectionReasons.push('Freeze authority not renounced');
      passed = false;
    } else {
      score += 0.25;
    }

    // Top holder check
    if (metrics.largestHolderPercentage > criteria.topHolderMaxPercent) {
      rejectionReasons.push(`Top holder owns >${criteria.topHolderMaxPercent}%`);
      passed = false;
    } else {
      score += 0.25;
    }

    // Liquidity check
    if (metrics.lpValueUSD < criteria.lpValueMinUSD) {
      rejectionReasons.push(`LP below $${criteria.lpValueMinUSD}`);
      passed = false;
    } else {
      score += 0.25;
    }

    return { passed, score };
  }

  /**
   * Check fresh gem quality requirements
   */
  private static checkFreshGemQuality(metrics: TokenMetrics, rejectionReasons: string[]) {
    const criteria = this.FRESH_GEM_CRITERIA.quality;
    let score = 0;
    let passed = true;

    if (metrics.uniqueWallets < criteria.minUniqueWallets) {
      rejectionReasons.push(`Fewer than ${criteria.minUniqueWallets} unique wallets`);
      passed = false;
    } else {
      score += 0.2;
    }

    if (metrics.transactionCount < criteria.minTransactions) {
      rejectionReasons.push(`Fewer than ${criteria.minTransactions} transactions`);
      passed = false;
    } else {
      score += 0.2;
    }

    if (metrics.marketCap < criteria.minMarketCap) {
      rejectionReasons.push(`Market cap below $${criteria.minMarketCap.toLocaleString()}`);
      passed = false;
    } else {
      score += 0.2;
    }

    if (metrics.volume24h < criteria.minVolume) {
      rejectionReasons.push(`Volume below $${criteria.minVolume.toLocaleString()}`);
      passed = false;
    } else {
      score += 0.2;
    }

    if (metrics.smartWalletScore < criteria.minSmartWalletScore) {
      rejectionReasons.push(`Smart wallet score below ${criteria.minSmartWalletScore}`);
      passed = false;
    } else {
      score += 0.2;
    }

    return { passed, score };
  }

  /**
   * Check organic activity (must pass 3 of 5 criteria)
   */
  private static checkOrganicActivity(metrics: TokenMetrics, rejectionReasons: string[]) {
    const criteria = this.FRESH_GEM_CRITERIA.organic;
    let passedChecks = 0;
    let score = 0;

    // Check 1: Unique wallets
    if (metrics.uniqueWallets >= criteria.minUniqueWallets) {
      passedChecks++;
      score += 0.2;
    }

    // Check 2: Transaction time spread
    if (metrics.avgTransactionSpread >= criteria.minTransactionSpread) {
      passedChecks++;
      score += 0.2;
    }

    // Check 3: Buy/sell ratio
    if (metrics.buyToSellRatio >= criteria.minBuyToSellRatio) {
      passedChecks++;
      score += 0.2;
    }

    // Check 4: Transaction size variation
    if (metrics.transactionSizeVariation >= criteria.minTransactionVariation) {
      passedChecks++;
      score += 0.2;
    }

    // Check 5: Volume to liquidity ratio
    if (metrics.volumeToLiquidityRatio >= criteria.minVolumeToLiquidityRatio) {
      passedChecks++;
      score += 0.2;
    }

    const passed = passedChecks >= 3;
    
    if (!passed) {
      rejectionReasons.push(`Failed organic activity test (${passedChecks}/5 criteria passed, need 3)`);
    }

    return { passed, score };
  }

  /**
   * Calculate score for established tokens
   */
  private static calculateEstablishedScore(metrics: TokenMetrics): number {
    return Math.min(1.0, 
      0.3 + // Base score
      Math.min(metrics.uniqueHolders / 1000, 0.2) +
      Math.min(metrics.marketCap / 500000, 0.2) +
      Math.min(metrics.volume24h / 200000, 0.2) +
      Math.min(metrics.smartWalletScore, 0.1)
    );
  }

  /**
   * Get human-readable tier description
   */
  static getTierDescription(tier: string): string {
    switch (tier) {
      case 'fresh-gem':
        return '💎 Fresh Gem (High Risk/High Reward - Early Entry)';
      case 'established':
        return '🏛️ Established Quality (Medium Risk - Proven Metrics)';
      default:
        return '❌ Rejected';
    }
  }

  async filter(candidates: any[]): Promise<any[]> {
    logger.info(`Starting filter process for ${candidates.length} candidates`);
    const filtered = [];
    
    for (const candidate of candidates) {
      try {
        const tokenMetrics: TokenMetrics = {
          address: candidate.tokenAddress || candidate.address,
          ageMinutes: candidate.discoveredAt ? 
            Math.floor((Date.now() - candidate.discoveredAt.getTime()) / (1000 * 60)) : 0,
          uniqueHolders: candidate.uniqueHolders || 0,
          transactionCount: candidate.transactionCount || 0,
          marketCap: candidate.marketCap || 0,
          volume24h: candidate.volume24h || 0,
          lpValueUSD: candidate.lpValueUSD || 0,
          largestHolderPercentage: candidate.largestHolderPercentage || 0,
          hasMintAuthority: candidate.hasMintAuthority ?? true,
          hasFreezeAuthority: candidate.hasFreezeAuthority ?? true,
          smartWalletScore: candidate.smartWalletScore || 0,
          uniqueWallets: candidate.uniqueWallets || 0,
          avgTransactionSpread: candidate.avgTransactionSpread || 0,
          buyToSellRatio: candidate.buyToSellRatio || 0,
          transactionSizeVariation: candidate.transactionSizeVariation || 0,
          volumeToLiquidityRatio: candidate.volumeToLiquidityRatio || 0,
          priceStability: candidate.priceStability || 0
        };

        const evaluation = TieredTokenFilter.evaluateToken(tokenMetrics);
        
        if (evaluation.passed && evaluation.tier !== 'rejected') {
          filtered.push({
            ...candidate,
            tier: evaluation.tier,
            score: evaluation.score,
            securityScore: evaluation.securityScore,
            organicScore: evaluation.organicScore,
            riskLevel: evaluation.riskLevel,
            rejectionReasons: evaluation.rejectionReasons
          });
        } else {
        logger.info(`❌ Token ${tokenMetrics.address} rejected: ${evaluation.rejectionReasons.join(", ")} (score: ${evaluation.score})`);
        }
      } catch (error) {
        logger.error(`Error filtering token ${candidate.tokenAddress || candidate.address}:`, error);
        continue;
      }
    }
    
    logger.info(`Filtered ${candidates.length} candidates down to ${filtered.length} tokens`);
    return filtered;
  }
}

export default TieredTokenFilter;
