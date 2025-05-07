// src/services/liquidity-pool-creation-detector.service.ts

/**
 * Detects when a new liquidity pool is created on Solana
 * and evaluates whether it’s likely to lead to a meme coin pump.
 *
 * This is the *earliest possible signal*—no trades, no tweets, just capital commitment.
 * We model it using capital-weighted priors and pool anatomy heuristics.
 */

type LiquidityPoolEvent = {
    tokenAddress: string;
    lpValueUSD: number;
    quoteToken: 'USDC' | 'USDT' | 'SOL' | string;
    timestamp: number; // UNIX
    deployer: string; // wallet
    hasInitialBuys: boolean; // at time of pool creation
    dex: 'Raydium' | 'Orca' | 'Meteora' | string;
    txHash: string;
  };
  
  type LPDetectionResult = {
    passed: boolean;
    reason?: string;
    confidence: number; // 0.0 – 1.0
  };
  
  export class LiquidityPoolCreationDetector {
    // --- Configurable thresholds ---
    private static readonly MIN_LP_USD = 4000;
    private static readonly MIN_CONFIDENCE = 0.65;
    private static readonly APPROVED_DEXES = new Set(['Raydium', 'Orca', 'Meteora']);
    private static readonly STABLE_QUOTES = new Set(['USDC', 'USDT']);
  
    public static evaluate(event: LiquidityPoolEvent): LPDetectionResult {
      const {
        lpValueUSD,
        quoteToken,
        dex,
        hasInitialBuys,
      } = event;
  
      // Early rejection: unapproved DEX
      if (!this.APPROVED_DEXES.has(dex)) {
        return { passed: false, reason: `Unrecognized DEX: ${dex}`, confidence: 0.1 };
      }
  
      // Early rejection: low capital
      if (lpValueUSD < 1000) {
        return { passed: false, reason: 'LP too small (< $1k)', confidence: 0.1 };
      }
  
      // Scoring system — weighted probability model
      let score = 0;
  
      // Capital injection
      if (lpValueUSD >= 8000) score += 0.45;
      else if (lpValueUSD >= 4000) score += 0.3;
      else score += 0.15;
  
      // Stable-pair bias
      if (this.STABLE_QUOTES.has(quoteToken)) score += 0.25;
      else score += 0.1; // lesser confidence with SOL pairs
  
      // Early buys present?
      if (hasInitialBuys) score += 0.25;
  
      // Bias boost: known meme-preferred DEX
      if (dex === 'Raydium') score += 0.05;
  
      const confidence = Math.min(score, 1.0);
  
      return {
        passed: confidence >= this.MIN_CONFIDENCE,
        reason: confidence >= this.MIN_CONFIDENCE ? undefined : 'Confidence below threshold',
        confidence,
      };
    }
  }