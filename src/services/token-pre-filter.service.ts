// src/services/token-pre-filter.service.ts

import { SmartMoneyValidatorService } from './smart-money-validator.service';
import { TokenTrackingDataService, tokenTrackingDataService } from './token-tracking-data.service';
import { LiquidityPoolCreationDetector } from './liquidity-pool-creation-detector.service';
import { BatchTokenProcessor } from './batch-token-processor.service';
import { ModularEdgeCalculator } from "./modular-edge-calculator.service";

export interface NewTokenEvent {
  address: string;
  name: string;
  symbol: string;
  lpValueUSD: number;
  uniqueHolders: number;
  buyTransactions: number;
  marketCap: number;          // 🆕 Added
  volume24h: number;          // 🆕 Added
  dex: 'Raydium' | 'Orca' | 'Meteora' | string;
  hasMintAuthority: boolean;
  hasFreezeAuthority: boolean;
  largestHolderPercentage: number;
  firstSeenTimestamp: number; // UNIX timestamp
  currentTimestamp: number; // UNIX timestamp
  smartWalletsInteracted: string[]; // array of wallet addresses
}

export interface TokenPreFilterResult {
  passed: boolean;
  rejectionReasons: string[];
  score: number;
  evaluationTime: number;
  overrideTriggered?: boolean;
  smartWalletScore?: number;
  highestTierDetected?: string;
  confidenceSources?: string[];
  earlyLPConfidence?: number;
}

export class TokenPreFilterService {
  // 🚀 Updated thresholds based on business partner recommendations
  private static readonly THRESHOLDS = {
    MIN_LIQUIDITY_USD: 8000,          // Keep existing - LP minimum
    MIN_MARKET_CAP: 100000,           // 🆕 $100K minimum market cap
    MIN_VOLUME_24H: 100000,           // 🆕 $100K minimum 24h volume
    MIN_UNIQUE_HOLDERS: 300,          // 📈 Updated from 25 to 300
    MIN_BUY_TRANSACTIONS: 500,        // 📈 Updated from 10 to 500
    MAX_HOLDER_CONCENTRATION: 30,     // 📉 Updated from 50% to 30%
    MINT_AUTHORITY_GRACE_PERIOD: 3,   // Keep existing
    SMART_WALLET_OVERLAP_COUNT: 2,    // Keep existing
    SMART_WALLET_RECENCY_WINDOW: 3,   // Keep existing
    LP_DETECTION_RECENCY: 10,         // Keep existing - minutes
  };

  private static readonly APPROVED_DEXES = ['Raydium', 'Orca', 'Meteora'];
  private static batchProcessor: BatchTokenProcessor;

  static initialize() {
    if (!this.batchProcessor) {
      this.batchProcessor = new BatchTokenProcessor(new ModularEdgeCalculator(console));
      this.batchProcessor.start();
    }
  }

  static async evaluateToken(input: NewTokenEvent): Promise<TokenPreFilterResult> {
    const rejectionReasons: string[] = [];
    const timeSinceFirstSeen = (input.currentTimestamp - input.firstSeenTimestamp) / 60;

    let score = this.calculateBaseScore(input);
    const confidenceSources: string[] = [];

    // Early LP detection integration
    const lpEvent = {
      tokenAddress: input.address,
      lpValueUSD: input.lpValueUSD,
      quoteToken: 'USDC', // You may want to detect this from your data
      timestamp: input.firstSeenTimestamp,
      deployer: 'UNKNOWN', // You'll need this from your data source  
      hasInitialBuys: input.buyTransactions > 0,
      dex: input.dex,
      txHash: 'UNKNOWN' // You'll need this from your data source
    };
    const liquiditySignal = LiquidityPoolCreationDetector.evaluate(lpEvent);
    const isRecentLP = (input.currentTimestamp - input.firstSeenTimestamp) / 60 <= this.THRESHOLDS.LP_DETECTION_RECENCY;
    const earlyLPConfidence = liquiditySignal.confidence;

    if (isRecentLP && earlyLPConfidence > 0.6) {
      score += earlyLPConfidence * 0.1; // modest boost
      confidenceSources.push('EarlyLPDetection');
    } else {
      rejectionReasons.push('No recent LP detection');
    }

    // Inject smart wallet validation override
    const validation = await SmartMoneyValidatorService.validateBuyers(input.address);
    const shouldOverride = validation.smartWalletScore >= 0.75;

    if (shouldOverride) {
      await tokenTrackingDataService.saveValidationResult(input.address, validation);
      confidenceSources.push('SmartMoneyOverride');
      return {
        passed: true,
        rejectionReasons: [],
        score: Math.min(1.0, validation.smartWalletScore + 0.1),
        evaluationTime: Date.now(),
        overrideTriggered: true,
        smartWalletScore: validation.smartWalletScore,
        highestTierDetected: validation.highestTierDetected,
        confidenceSources,
        earlyLPConfidence
      };
    }

    // Standard filtering with updated thresholds
    this.checkLiquidity(input, rejectionReasons);
    this.checkMarketCap(input, rejectionReasons);        // 🆕 New check
    this.checkVolume(input, rejectionReasons);           // 🆕 New check
    this.checkHolders(input, rejectionReasons);
    this.checkBuyTransactions(input, rejectionReasons);
    this.checkDEX(input, rejectionReasons);
    this.checkMintAuthority(input, timeSinceFirstSeen, rejectionReasons);
    this.checkFreezeAuthority(input, rejectionReasons);
    this.checkHolderConcentration(input, rejectionReasons);
    this.checkMetadata(input, rejectionReasons);

    const passed = rejectionReasons.length === 0;
    if (!passed) score = 0;

    await tokenTrackingDataService.saveValidationResult(input.address, {
      smartWalletScore: validation.smartWalletScore,
      highestTierDetected: validation.highestTierDetected,
      isSmartMoneyToken: false,
    });

    return {
      passed,
      rejectionReasons,
      score,
      evaluationTime: Date.now(),
      smartWalletScore: validation.smartWalletScore,
      highestTierDetected: validation.highestTierDetected,
      confidenceSources,
      earlyLPConfidence
    };
  }

  static async filterTokenBatch(tokens: NewTokenEvent[]): Promise<NewTokenEvent[]> {
    const results = await Promise.all(tokens.map(async token => {
      // Initialize batch processor if not done
      TokenPreFilterService.initialize();

      // Calculate age in minutes
      const ageMinutes = (token.currentTimestamp - token.firstSeenTimestamp) / 60;

      // Add to batch processing instead of direct evaluation
      const priority = ageMinutes <= 30 ? 'high' : 'normal';
      this.batchProcessor.addToken(
        token.address,
        0.001, // currentPrice placeholder
        ageMinutes,
        priority,
        'pre-filter'
      );

      // Return a placeholder result since batch processing is async
      const result = {
        passed: true,
        rejectionReasons: ['Added to batch processing queue'],
        score: 0.75,
        evaluationTime: Date.now(),
        smartWalletScore: 0.75,
        highestTierDetected: 'pending',
        confidenceSources: ['batch'],
        earlyLPConfidence: 0.75
      };

      return { token, result };
    }));

    const passCount = results.filter(r => r.result.passed).length;
    console.log(`Filtered ${tokens.length} tokens. ${passCount} passed (${Math.round(passCount / tokens.length * 100)}%)`);

    return results
      .filter(item => item.result.passed)
      .sort((a, b) => b.result.score - a.result.score)
      .map(item => item.token);
  }

  private static calculateBaseScore(input: NewTokenEvent): number {
    return (
      0.5 +
      Math.min(input.lpValueUSD / 20000, 1) * 0.1 +
      Math.min(input.marketCap / 500000, 1) * 0.15 +      // 🆕 Market cap factor
      Math.min(input.volume24h / 200000, 1) * 0.15 +      // 🆕 Volume factor
      Math.min(input.uniqueHolders / 500, 1) * 0.1 +
      Math.min(input.buyTransactions / 1000, 1) * 0.1 +
      input.smartWalletsInteracted.length * 0.05
    );
  }

  private static checkLiquidity(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (input.lpValueUSD < this.THRESHOLDS.MIN_LIQUIDITY_USD) {
      rejectionReasons.push(`LP below $${this.THRESHOLDS.MIN_LIQUIDITY_USD} threshold`);
    }
  }

  // 🆕 New market cap check
  private static checkMarketCap(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (input.marketCap < this.THRESHOLDS.MIN_MARKET_CAP) {
      rejectionReasons.push(`Market cap below $${this.THRESHOLDS.MIN_MARKET_CAP.toLocaleString()} threshold`);
    }
  }

  // 🆕 New volume check
  private static checkVolume(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (input.volume24h < this.THRESHOLDS.MIN_VOLUME_24H) {
      rejectionReasons.push(`24h volume below $${this.THRESHOLDS.MIN_VOLUME_24H.toLocaleString()} threshold`);
    }
  }

  private static checkHolders(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (input.uniqueHolders < this.THRESHOLDS.MIN_UNIQUE_HOLDERS) {
      rejectionReasons.push(`Fewer than ${this.THRESHOLDS.MIN_UNIQUE_HOLDERS} unique holders`);
    }
  }

  private static checkBuyTransactions(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (input.buyTransactions < this.THRESHOLDS.MIN_BUY_TRANSACTIONS) {
      rejectionReasons.push(`Fewer than ${this.THRESHOLDS.MIN_BUY_TRANSACTIONS} buy transactions`);
    }
  }

  private static checkDEX(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (!this.APPROVED_DEXES.includes(input.dex)) {
      rejectionReasons.push(`DEX not in approved list: ${input.dex}`);
    }
  }

  private static checkMintAuthority(input: NewTokenEvent, timeSinceFirstSeen: number, rejectionReasons: string[]): void {
    if (input.hasMintAuthority && timeSinceFirstSeen > this.THRESHOLDS.MINT_AUTHORITY_GRACE_PERIOD) {
      rejectionReasons.push(`Mint authority still present after ${this.THRESHOLDS.MINT_AUTHORITY_GRACE_PERIOD} minutes`);
    }
  }

  private static checkFreezeAuthority(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (input.hasFreezeAuthority) {
      rejectionReasons.push('Freeze authority exists');
    }
  }

  private static checkHolderConcentration(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (input.largestHolderPercentage > this.THRESHOLDS.MAX_HOLDER_CONCENTRATION) {
      rejectionReasons.push(`Largest holder controls >${this.THRESHOLDS.MAX_HOLDER_CONCENTRATION}% of supply`);
    }
  }

  private static checkMetadata(input: NewTokenEvent, rejectionReasons: string[]): void {
    if (!input.name || !input.symbol) {
      rejectionReasons.push('Missing token name or symbol');
    }
  }
}
