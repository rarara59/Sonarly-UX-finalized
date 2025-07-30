// src/services/risk-check.service.ts

import rpcConnectionManager from './rpc-connection-manager';
import { logger } from '../utils/logger';

// Add this timeout wrapper function at the top
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`RPC call timeout after ${timeoutMs}ms`)), timeoutMs)
  );
  
  return Promise.race([promise, timeoutPromise]);
};

const KNOWN_LEGITIMATE_TOKENS = [
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'So11111111111111111111111111111111111111112',   // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',   // USDC
  // Add other known legitimate tokens here
];

export interface RiskCheckResult {
  passed: boolean;
  riskScore: number; // 0-1 (0 = highest risk, 1 = lowest risk)
  confidencePenalty: number; // 0-0.3 penalty to apply to edge score
  rejectionReasons: string[];
  warnings: string[];
  tradabilityConfirmed: boolean;
  honeypotDetected: boolean;
  slippageAcceptable: boolean;
  volumeAdequate: boolean;
  liquidityReal: boolean;
}

export interface TokenRiskProfile {
  address: string;
  volume24h: number;
  lpValueUSD: number;
  holderConcentration: number;
  transactionCount: number;
  ageMinutes: number;
}

export class RiskCheckService {
  
  private static readonly RISK_THRESHOLDS = {
    MIN_DAILY_VOLUME: 2000,        // $2K minimum daily volume
    MAX_SLIPPAGE_PERCENT: 10,      // 10% max slippage tolerance
    MIN_SUCCESSFUL_TRADES: 5,      // Min successful buy/sell pairs
    MAX_FAILED_TRADE_RATIO: 0.2,   // Max 20% failed transactions
    MIN_LP_STABILITY_MINUTES: 10,  // LP must be stable for 10+ minutes
    MAX_CONFIDENCE_PENALTY: 0.3,   // Max penalty to edge score
  };

  /**
   * Comprehensive risk check - call this before final token recommendation
   */
  static async performRiskCheck(tokenProfile: TokenRiskProfile): Promise<RiskCheckResult> {
    const rejectionReasons: string[] = [];
    const warnings: string[] = [];
    let riskScore = 1.0;
    let confidencePenalty = 0;
  
    logger.info(`🔍 Performing comprehensive risk check for ${tokenProfile.address}`);

    // ADD THESE DEBUG LOGS:
    logger.info(`🔍 [RISK DEBUG] Step 1: Checking whitelist for ${tokenProfile.address}`);
  
    // WHITELIST CHECK - bypass risk checks for known legitimate tokens
    if (KNOWN_LEGITIMATE_TOKENS.includes(tokenProfile.address)) {
      logger.info(`✅ Token ${tokenProfile.address} is whitelisted as legitimate`);
      return {
        passed: true,
        riskScore: 1.0,
        confidencePenalty: 0, // NO PENALTY for whitelisted tokens
        rejectionReasons: [],
        warnings: ['ℹ️ Whitelisted legitimate token'],
        tradabilityConfirmed: true,
        honeypotDetected: false,
        slippageAcceptable: true,
        volumeAdequate: true,
        liquidityReal: true
      };
    }

    logger.info(`🔍 [RISK DEBUG] Step 2: Starting volume risk check`);

    try {
      // Step 1: Volume Risk Check
      logger.info(`🔍 [RISK DEBUG] Step 3: About to call checkVolumeRisk`);
      const volumeCheck = this.checkVolumeRisk(tokenProfile, rejectionReasons, warnings);
      logger.info(`🔍 [RISK DEBUG] Step 3 completed: Volume risk check done`);
      riskScore *= volumeCheck.riskMultiplier;
      confidencePenalty += volumeCheck.penalty;

      // Step 2: Tradability Simulation
      logger.info(`🔍 [RISK DEBUG] Step 4: About to call checkTradability`);
      const tradabilityCheck = await this.checkTradability(tokenProfile.address, rejectionReasons);
      logger.info(`🔍 [RISK DEBUG] Step 4 completed: Tradability check done`);
      riskScore *= tradabilityCheck.riskMultiplier;

      // Step 3: Honeypot Detection
      logger.info(`🔍 [RISK DEBUG] Step 5: About to call detectHoneypot`);
      const honeypotCheck = await this.detectHoneypot(tokenProfile.address, rejectionReasons);
      logger.info(`🔍 [RISK DEBUG] Step 5 completed: Honeypot check done`);
      riskScore *= honeypotCheck.riskMultiplier;

      // Step 4: Liquidity Reality Check
      logger.info(`🔍 [RISK DEBUG] Step 6: About to call checkLiquidityReality`);
      const liquidityCheck = await this.checkLiquidityReality(tokenProfile, rejectionReasons, warnings);
      logger.info(`🔍 [RISK DEBUG] Step 6 completed: Liquidity check done`);
      riskScore *= liquidityCheck.riskMultiplier;
      confidencePenalty += liquidityCheck.penalty;

      // Step 5: Slippage Analysis
      logger.info(`🔍 [RISK DEBUG] Step 7: About to call analyzeSlippage`);
      const slippageCheck = await this.analyzeSlippage(tokenProfile.address, rejectionReasons);
      logger.info(`🔍 [RISK DEBUG] Step 7 completed: Slippage check done`);
      riskScore *= slippageCheck.riskMultiplier;

      // Step 6: Confidence Penalty Calculation
      logger.info(`🔍 [RISK DEBUG] Step 8: About to call calculateConfidencePenalty`);
      const penaltyCheck = this.calculateConfidencePenalty(tokenProfile, warnings);
      logger.info(`🔍 [RISK DEBUG] Step 8 completed: Confidence penalty calculated`);
      confidencePenalty += penaltyCheck.penalty;

      // Cap confidence penalty
      confidencePenalty = Math.min(confidencePenalty, this.RISK_THRESHOLDS.MAX_CONFIDENCE_PENALTY);

      const passed = rejectionReasons.length === 0 && riskScore >= 0.6;

      const result: RiskCheckResult = {
        passed,
        riskScore,
        confidencePenalty,
        rejectionReasons,
        warnings,
        tradabilityConfirmed: tradabilityCheck.confirmed,
        honeypotDetected: honeypotCheck.detected,
        slippageAcceptable: slippageCheck.acceptable,
        volumeAdequate: volumeCheck.adequate,
        liquidityReal: liquidityCheck.real
      };

      logger.info(`🎯 Risk check complete for ${tokenProfile.address}:`, {
        passed,
        riskScore: riskScore.toFixed(3),
        confidencePenalty: confidencePenalty.toFixed(3),
        tradable: tradabilityCheck.confirmed,
        honeypot: honeypotCheck.detected,
        warnings: warnings.length
      });

      return result;

    } catch (error) {
      logger.error(`💥 Risk check failed for ${tokenProfile.address}:`, error);
      return {
        passed: false,
        riskScore: 0,
        confidencePenalty: this.RISK_THRESHOLDS.MAX_CONFIDENCE_PENALTY,
        rejectionReasons: ['Risk check system error'],
        warnings: [],
        tradabilityConfirmed: false,
        honeypotDetected: true, // Assume worst case
        slippageAcceptable: false,
        volumeAdequate: false,
        liquidityReal: false
      };
    }
  }

  /**
   * Check volume-related risks
   */
  private static checkVolumeRisk(profile: TokenRiskProfile, rejections: string[], warnings: string[]) {
    let riskMultiplier = 1.0;
    let penalty = 0;
    let adequate = true;

    // Volume check
    if (profile.volume24h < this.RISK_THRESHOLDS.MIN_DAILY_VOLUME) {
      rejections.push(`❌ RISK: Daily volume $${profile.volume24h.toLocaleString()} below $${this.RISK_THRESHOLDS.MIN_DAILY_VOLUME.toLocaleString()}`);
      adequate = false;
      riskMultiplier = 0; // Immediate failure
    } else if (profile.volume24h < this.RISK_THRESHOLDS.MIN_DAILY_VOLUME * 3) {
      warnings.push(`⚠️ Volume borderline: $${profile.volume24h.toLocaleString()}`);
      penalty += 0.1;
      riskMultiplier *= 0.8;
    }

    // Volume to LP ratio check
    const volumeToLPRatio = profile.volume24h / profile.lpValueUSD;
    if (volumeToLPRatio < 0.05) {
      warnings.push(`⚠️ Low volume/LP ratio: ${(volumeToLPRatio * 100).toFixed(1)}%`);
      penalty += 0.05;
      riskMultiplier *= 0.9;
    }

    return { riskMultiplier, penalty, adequate };
  }

  /**
   * Simulate buy/sell transactions to confirm tradability
   */
  private static async checkTradability(tokenAddress: string, rejections: string[]) {
    try {
      logger.debug(`🔄 Testing tradability for ${tokenAddress}`);

      // WRAPPED getSignaturesForAddress WITH TIMEOUT
      const signatures = await withTimeout(
        rpcConnectionManager.getSignaturesForAddress(tokenAddress, 100),
        15000
      );
      
      if (signatures.length < this.RISK_THRESHOLDS.MIN_SUCCESSFUL_TRADES) {
        rejections.push(`❌ TRADABILITY: Only ${signatures.length} transactions (min ${this.RISK_THRESHOLDS.MIN_SUCCESSFUL_TRADES})`);
        return { confirmed: false, riskMultiplier: 0 };
      }

      // Analyze transaction success rate
      const recentTransactions = signatures.slice(0, 20);
      const failedTransactions = recentTransactions.filter(tx => tx.err !== null).length;
      const failureRate = failedTransactions / recentTransactions.length;

      if (failureRate > this.RISK_THRESHOLDS.MAX_FAILED_TRADE_RATIO) {
        rejections.push(`❌ TRADABILITY: ${(failureRate * 100).toFixed(1)}% transaction failure rate (max ${(this.RISK_THRESHOLDS.MAX_FAILED_TRADE_RATIO * 100).toFixed(1)}%)`);
        return { confirmed: false, riskMultiplier: 0 };
      }

      // TODO: In production, implement actual buy/sell simulation
      // For now, we'll use transaction analysis as a proxy
      
      return { confirmed: true, riskMultiplier: 1.0 };

    } catch (error) {
      logger.error(`Tradability check failed for ${tokenAddress}:`, error);
      rejections.push('❌ TRADABILITY: Unable to verify tradability');
      return { confirmed: false, riskMultiplier: 0 };
    }
  }

  /**
   * Detect honeypot patterns
   */
  private static async detectHoneypot(tokenAddress: string, rejections: string[]) {
    try {
      logger.debug(`🍯 Checking honeypot patterns for ${tokenAddress}`);

      // WRAPPED getAccountInfo WITH TIMEOUT
      const accountInfo = await withTimeout(
        rpcConnectionManager.getAccountInfo(tokenAddress),
        15000
      );
      
      if (!accountInfo?.data?.parsed?.info) {
        rejections.push('❌ HONEYPOT: Unable to parse token contract');
        return { detected: true, riskMultiplier: 0 };
      }

      const tokenInfo = accountInfo.data.parsed.info;

      // Check for suspicious contract patterns
      let detected = false;
      let riskMultiplier = 1.0;

      // Pattern 1: Unusual decimals (common honeypot trick)
      if (tokenInfo.decimals > 12 || tokenInfo.decimals < 6) {
        rejections.push(`❌ HONEYPOT: Suspicious decimals: ${tokenInfo.decimals}`);
        detected = true;
        riskMultiplier = 0;
      }

      // Pattern 2: Check recent transactions for buy/sell imbalance
      // WRAPPED getSignaturesForAddress WITH TIMEOUT
      const signatures = await withTimeout(
        rpcConnectionManager.getSignaturesForAddress(tokenAddress, 50),
        15000
      );
      
      if (signatures.length > 10) {
        // Analyze transaction patterns (simplified - in production, parse actual transactions)
        const recentSignatures = signatures.slice(0, 20);
        
        // If we see signs that might indicate honeypot behavior, flag it
        // This is a simplified check - in production you'd parse actual transaction data
      }

      return { detected, riskMultiplier };

    } catch (error) {
      logger.error(`Honeypot check failed for ${tokenAddress}:`, error);
      rejections.push('❌ HONEYPOT: Unable to verify contract safety');
      return { detected: true, riskMultiplier: 0 };
    }
  }

  /**
   * Verify liquidity is real and stable
   */
  private static async checkLiquidityReality(profile: TokenRiskProfile, rejections: string[], warnings: string[]) {
    let riskMultiplier = 1.0;
    let penalty = 0;
    let real = true;

    // Check LP age stability
    if (profile.ageMinutes < this.RISK_THRESHOLDS.MIN_LP_STABILITY_MINUTES) {
      warnings.push(`⚠️ Very new LP: ${profile.ageMinutes.toFixed(1)} minutes old`);
      penalty += 0.05;
      riskMultiplier *= 0.9;
    }

    // Check LP size relative to volume
    const lpToVolumeRatio = profile.lpValueUSD / Math.max(profile.volume24h, 1);
    if (lpToVolumeRatio > 20) {
      warnings.push(`⚠️ LP very large relative to volume (possible fake LP)`);
      penalty += 0.1;
      riskMultiplier *= 0.8;
    }

    // Check transaction density
    const transactionsPerMinute = profile.transactionCount / Math.max(profile.ageMinutes, 1);
    if (transactionsPerMinute > 10) {
      warnings.push(`⚠️ Very high transaction density: ${transactionsPerMinute.toFixed(1)}/min`);
      penalty += 0.05;
      riskMultiplier *= 0.9;
    }

    return { riskMultiplier, penalty, real };
  }

  /**
   * Analyze slippage patterns
   */
  private static async analyzeSlippage(tokenAddress: string, rejections: string[]) {
    try {
      // In production, you would simulate trades to check actual slippage
      // For MVP, we'll use transaction analysis as a proxy
      
      // WRAPPED getSignaturesForAddress WITH TIMEOUT
      const signatures = await withTimeout(
        rpcConnectionManager.getSignaturesForAddress(tokenAddress, 20),
        15000
      );
      
      // If we see too many failed transactions, it might indicate high slippage
      const failedTxs = signatures.filter(tx => tx.err !== null).length;
      const failureRate = failedTxs / Math.max(signatures.length, 1);
      
      if (failureRate > 0.3) {
        rejections.push(`❌ SLIPPAGE: High transaction failure rate ${(failureRate * 100).toFixed(1)}% (possible excessive slippage)`);
        return { acceptable: false, riskMultiplier: 0 };
      }

      return { acceptable: true, riskMultiplier: 1.0 };

    } catch (error) {
      logger.error(`Slippage check failed for ${tokenAddress}:`, error);
      rejections.push('❌ SLIPPAGE: Unable to verify slippage conditions');
      return { acceptable: false, riskMultiplier: 0 };
    }
  }

  /**
   * Calculate confidence penalty based on borderline metrics
   */
  private static calculateConfidencePenalty(profile: TokenRiskProfile, warnings: string[]) {
    let penalty = 0;

    // Volume penalty
    if (profile.volume24h < 5000) {
      penalty += 0.1;
      warnings.push('⚠️ Volume below optimal threshold');
    }

    // LP penalty
    if (profile.lpValueUSD < 20000) {
      penalty += 0.05;
      warnings.push('⚠️ LP below optimal threshold');
    }

    // Holder concentration penalty
    if (profile.holderConcentration > 25) {
      penalty += 0.05;
      warnings.push('⚠️ Holder concentration above optimal');
    }

    // Age penalty for very new tokens
    if (profile.ageMinutes < 5) {
      penalty += 0.1;
      warnings.push('⚠️ Token very young (high uncertainty)');
    }

    return { penalty };
  }

  /**
   * Quick risk pre-check for bulk filtering
   */
  static async quickRiskScreen(tokenAddress: string): Promise<boolean> {
    try {
      // Fast checks that can eliminate obvious risks
      // WRAPPED getSignaturesForAddress WITH TIMEOUT
      const signatures = await withTimeout(
        rpcConnectionManager.getSignaturesForAddress(tokenAddress, 10),
        15000
      );
      
      // If no transactions, skip
      if (signatures.length === 0) return false;
      
      // If all recent transactions failed, skip
      const recentFailed = signatures.slice(0, 5).filter(tx => tx.err !== null).length;
      if (recentFailed >= 3) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get risk assessment summary for logging
   */
  static getRiskSummary(result: RiskCheckResult): string {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const score = `Score: ${result.riskScore.toFixed(3)}`;
    const penalty = result.confidencePenalty > 0 ? `Penalty: -${result.confidencePenalty.toFixed(3)}` : '';
    
    return `${status} | ${score} | ${penalty}`.replace(' | | ', ' | ');
  }
}

export default RiskCheckService;