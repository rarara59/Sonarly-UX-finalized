// src/interfaces/detection-signals.interface.ts

export interface DetectionSignals {
    // Smart Wallet Analysis (BOTH tracks)
    smartWallet: {
      detected: boolean;
      confidence: number;
      tier1Count: number;
      tier2Count: number;
      tier3Count: number;
      overlapCount: number;
      totalWeight: number;
      walletAddresses: string[];
    };
  
    // LP Analysis (BOTH tracks)
    lpAnalysis: {
      lpValueUSD: number;
      holderCount: number;
      mintDisabled: boolean;
      freezeAuthority: boolean;
      contractVerified: boolean;
      topWalletPercent: number;
      dexCount: number;
      confidence: number;
    };
  
    // Holder Velocity (FAST track only)
    holderVelocity: {
      growthRate: number;
      sybilRisk: number;
      concentrationRisk: number;
      velocityScore: number;
      confidence: number;
    };
  
    // Transaction Patterns (FAST track only)
    transactionPattern: {
      botDetectionScore: number;
      buySellRatio: number;
      avgTransactionSize: number;
      patternScore: number;
      confidence: number;
    };
  
    // Deep Holder Analysis (SLOW track only)
    deepHolderAnalysis: {
      giniCoefficient: number;
      whaleCount: number;
      organicGrowth: number;
      addressSimilarity: number;
      confidence: number;
    };
  
    // Social Signals (SLOW track only)
    socialSignals: {
      twitterMentions: number;
      sentimentScore: number;
      communityStrength: number;
      socialScore: number;
      confidence: number;
    };
  
    // Technical Patterns (SLOW track only)
    technicalPattern: {
      rsi: number;
      momentum: number;
      volumeAnalysis: number;
      supportResistance: number;
      confidence: number;
    };
  
    // Market Context (BOTH tracks)
    marketContext: {
      solMarketHealth: number;
      dexActivity: number;
      memeMarketSentiment: number;
      contextScore: number;
      confidence: number;
    };

    // Risk Assessment (BOTH tracks - runs FIRST)
    riskAssessment: {
      passed: boolean;
      riskScore: number;
      confidencePenalty: number;
      rejectionReasons: string[];
      warnings: string[];
      tradabilityConfirmed: boolean;
      honeypotDetected: boolean;
      slippageAcceptable: boolean;
      volumeAdequate: boolean;
      liquidityReal: boolean;
    };
  }