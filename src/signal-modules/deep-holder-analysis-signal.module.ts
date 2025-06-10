// src/signal-modules/deep-holder-analysis-signal.module.ts

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from '../interfaces/signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

export class DeepHolderAnalysisSignalModule extends SignalModule {
  constructor(config: SignalModuleConfig) {
    super('deep-holder-analysis', config);
  }

  getRequiredTrack(): 'FAST' | 'SLOW' | 'BOTH' {
    return 'SLOW'; // Deep holder analysis for slow track only
  }

  getSignalType(): keyof DetectionSignals {
    return 'deepHolderAnalysis'; // ← FIXED: Correct key name
  }

  async execute(context: SignalContext): Promise<SignalResult> {
    const startTime = performance.now();
    
    try {
      const holderData = await this.getDeepHolderData(context.tokenAddress, context.rpcManager);
      
      let confidence = 0;
      
      // Good Gini coefficient (lower = better distribution)
      if (holderData.giniCoefficient <= 0.4) confidence += 40;
      else if (holderData.giniCoefficient <= 0.6) confidence += 25;
      else if (holderData.giniCoefficient <= 0.8) confidence += 10;
      
      // Low whale count
      if (holderData.whaleCount <= 2) confidence += 35;
      else if (holderData.whaleCount <= 5) confidence += 20;
      else if (holderData.whaleCount <= 10) confidence += 10;
      
      // High organic growth
      if (holderData.organicGrowth >= 0.8) confidence += 25;
      else if (holderData.organicGrowth >= 0.6) confidence += 15;
      else if (holderData.organicGrowth >= 0.4) confidence += 5;

      // Low address similarity (less sybil risk)
      if (holderData.addressSimilarity <= 0.1) confidence += 10;
      else if (holderData.addressSimilarity <= 0.2) confidence += 5;
      
      const data = {
        giniCoefficient: holderData.giniCoefficient,
        whaleCount: holderData.whaleCount,
        organicGrowth: holderData.organicGrowth,
        addressSimilarity: holderData.addressSimilarity,
        confidence
      };

      return {
        confidence,
        data,
        processingTime: performance.now() - startTime,
        source: 'deep-holder-analysis-module',
        version: this.config.version
      };
    } catch (error) {
      context.logger.error('Deep holder analysis signal failed:', error);
      
      return {
        confidence: 0,
        data: {
          giniCoefficient: 1.0, // Worst case: perfect inequality
          whaleCount: 99,       // Worst case: many whales
          organicGrowth: 0.0,   // Worst case: no organic growth
          addressSimilarity: 1.0, // Worst case: high similarity
          confidence: 0
        },
        processingTime: performance.now() - startTime,
        source: 'deep-holder-analysis-module',
        version: this.config.version
      };
    }
  }

  // Extract the sophisticated deep holder analysis (~400 lines preserved!)
  private async getDeepHolderData(tokenAddress: string, rpcManager: any): Promise<any> {
    try {
      // METHOD 1: Get all current token holders using Chainstack high-performance
      const [tokenAccounts, tokenSupply] = await Promise.all([
        rpcManager.getTokenAccountsByOwner(tokenAddress, undefined, 'chainstack').catch(() => []),
        rpcManager.getTokenSupply(tokenAddress, 'chainstack').catch(() => null)
      ]);
      
      if (tokenAccounts.length === 0 || !tokenSupply) {
        return { 
          giniCoefficient: 0.9, 
          whaleCount: 50, 
          organicGrowth: 0.2, 
          addressSimilarity: 0.8 
        };
      }
      
      // Extract and sort holder balances
      const holderBalances = tokenAccounts
        .map((account: any) => {
          const balance = parseFloat(account.account?.data?.parsed?.info?.tokenAmount?.amount || 0);
          const decimals = account.account?.data?.parsed?.info?.tokenAmount?.decimals || 0;
          const actualBalance = balance / Math.pow(10, decimals);
          const ownerAddress = account.account?.data?.parsed?.info?.owner || 'unknown';
          
          return {
            address: ownerAddress,
            balance: actualBalance,
            rawBalance: balance
          };
        })
        .filter((holder: any) => holder.balance > 0)
        .sort((a: any, b: any) => b.balance - a.balance);
      
      if (holderBalances.length < 3) {
        return { 
          giniCoefficient: 0.95, 
          whaleCount: 20, 
          organicGrowth: 0.1, 
          addressSimilarity: 0.9 
        };
      }
      
      const totalSupply = parseFloat(tokenSupply.amount) / Math.pow(10, tokenSupply.decimals || 0);
      const holderCount = holderBalances.length;
      
      // METHOD 2: Calculate Gini coefficient for distribution equality
      const giniCoefficient = this.calculateGiniCoefficient(holderBalances, totalSupply);
      
      // METHOD 3: Count whales (holders with >1% of supply)
      const whaleCount = this.calculateWhaleCount(holderBalances, totalSupply);
      
      // METHOD 4: Analyze organic growth patterns
      const organicGrowth = await this.analyzeOrganicGrowthPatterns(tokenAddress, holderBalances, rpcManager);
      
      // METHOD 5: Calculate address similarity for sybil detection
      const addressSimilarity = this.calculateAddressSimilarity(holderBalances);
      
      return { 
        giniCoefficient, 
        whaleCount, 
        organicGrowth, 
        addressSimilarity 
      };
      
    } catch (error) {
      return { 
        giniCoefficient: 0.8, 
        whaleCount: 25, 
        organicGrowth: 0.3, 
        addressSimilarity: 0.7 
      };
    }
  }
  
  private calculateGiniCoefficient(
    holderBalances: Array<{address: string; balance: number}>, 
    totalSupply: number
  ): number {
    try {
      const balances = holderBalances.map(h => h.balance).sort((a, b) => a - b);
      const n = balances.length;
      
      if (n <= 1) return 1; // Perfect inequality with ≤1 holder
      
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        numerator += (2 * i - n + 1) * balances[i];
        denominator += balances[i];
      }
      
      if (denominator === 0) return 1;
      
      const gini = numerator / (n * denominator);
      return Math.max(0, Math.min(1, gini));
      
    } catch (error) {
      return 0.8; // Assume high inequality on calculation error
    }
  }
  
  private calculateWhaleCount(
    holderBalances: Array<{address: string; balance: number}>, 
    totalSupply: number
  ): number {
    try {
      // Define whale threshold: >1% of total supply
      const whaleThreshold = totalSupply * 0.01;
      
      const whaleCount = holderBalances
        .filter(holder => holder.balance >= whaleThreshold)
        .length;
      
      return Math.max(0, whaleCount);
      
    } catch (error) {
      return 50; // Conservative: assume many whales on error
    }
  }
  
  private async analyzeOrganicGrowthPatterns(
    tokenAddress: string,
    holderBalances: Array<{address: string; balance: number}>,
    rpcManager: any
  ): Promise<number> {
    try {
      // METHOD 1: Analyze recent wallet creation patterns
      let organicScore = 0.5; // Neutral baseline
      
      // Sample up to 20 holders for wallet age analysis (performance limit)
      const sampleHolders = holderBalances.slice(0, 20);
      let walletAgeAnalysis = { young: 0, medium: 0, old: 0 };
      
      // Check wallet ages by looking at their first transaction (simplified heuristic)
      for (const holder of sampleHolders.slice(0, 10)) { // Limit to 10 for performance
        try {
          const signatures = await rpcManager.getSignaturesForAddress(holder.address, 1000).catch(() => []);
          
          if (signatures.length > 0) {
            // Get oldest transaction to estimate wallet age
            const oldestTx = signatures[signatures.length - 1];
            const walletAge = (Date.now() / 1000) - (oldestTx.blockTime || 0);
            const ageInDays = walletAge / (24 * 60 * 60);
            
            if (ageInDays < 7) walletAgeAnalysis.young++;
            else if (ageInDays < 30) walletAgeAnalysis.medium++;
            else walletAgeAnalysis.old++;
          }
        } catch (walletError) {
          continue; // Skip problematic wallets
        }
      }
      
      // Score wallet age distribution (prefer mix of old and new wallets)
      const totalAnalyzed = walletAgeAnalysis.young + walletAgeAnalysis.medium + walletAgeAnalysis.old;
      if (totalAnalyzed > 0) {
        const youngRatio = walletAgeAnalysis.young / totalAnalyzed;
        const oldRatio = walletAgeAnalysis.old / totalAnalyzed;
        
        // Ideal: Some new interest (20-40%) but also established wallets (40%+)
        if (youngRatio >= 0.2 && youngRatio <= 0.4 && oldRatio >= 0.4) {
          organicScore += 0.25; // Excellent mix
        } else if (youngRatio >= 0.1 && oldRatio >= 0.3) {
          organicScore += 0.15; // Good mix
        } else if (youngRatio > 0.8) {
          organicScore -= 0.2; // Too many new wallets = suspicious
        }
      }
      
      // METHOD 2: Analyze balance distribution patterns for organic growth
      const balances = holderBalances.map(h => h.balance);
      
      // Check for natural power-law distribution (Pareto principle)
      if (balances.length >= 10) {
        const top20PercentIndex = Math.floor(balances.length * 0.2);
        const top20PercentSum = balances.slice(0, top20PercentIndex).reduce((sum, balance) => sum + balance, 0);
        const totalBalance = balances.reduce((sum, balance) => sum + balance, 0);
        const top20Ratio = top20PercentSum / totalBalance;
        
        // Natural distribution: top 20% should hold 60-80% (Pareto principle)
        if (top20Ratio >= 0.6 && top20Ratio <= 0.8) {
          organicScore += 0.15; // Natural distribution
        } else if (top20Ratio < 0.5) {
          organicScore += 0.1; // Unusually even (good)
        } else if (top20Ratio > 0.9) {
          organicScore -= 0.15; // Too concentrated
        }
      }
      
      // Apply bounds
      return Math.max(0.1, Math.min(1, organicScore));
      
    } catch (error) {
      return 0.5; // Neutral score on analysis failure
    }
  }
  
  private calculateAddressSimilarity(
    holderBalances: Array<{address: string; balance: number}>
  ): number {
    try {
      const addresses = holderBalances.map(h => h.address);
      let suspiciousCount = 0;
      
      // Check for sequential or similar patterns
      for (let i = 0; i < addresses.length - 1; i++) {
        const addr1 = addresses[i];
        const addr2 = addresses[i + 1];
        
        // Simple heuristic: check if addresses are too similar
        if (addr1 && addr2 && addr1.length === addr2.length) {
          let differences = 0;
          for (let j = 0; j < Math.min(addr1.length, 20); j++) {
            if (addr1[j] !== addr2[j]) differences++;
          }
          
          // If addresses differ by only 1-3 characters, suspicious
          if (differences <= 3) {
            suspiciousCount++;
          }
        }
      }
      
      const suspiciousRatio = addresses.length > 0 ? suspiciousCount / addresses.length : 0;
      return Math.max(0, Math.min(1, suspiciousRatio));
      
    } catch (error) {
      return 0.5; // Assume moderate similarity on error
    }
  }
}