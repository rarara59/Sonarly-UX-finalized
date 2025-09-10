// src/signal-modules/transaction-pattern-signal.module.ts

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from './signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

// Add this after the imports at the top of the file
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`RPC call timeout after ${timeoutMs}ms`)), timeoutMs)
  );
  
  return Promise.race([promise, timeoutPromise]);
};

export class TransactionPatternSignalModule extends SignalModule {
    constructor(config: SignalModuleConfig) {
      super('transaction-pattern', config);
    }
  
    getRequiredTrack(): 'FAST' | 'SLOW' | 'BOTH' {
      return 'FAST'; // Transaction patterns for fast track
    }
  
    getSignalType(): keyof DetectionSignals {
      return 'transactionPattern';
    }
  
    async execute(context: SignalContext): Promise<SignalResult> {
      const startTime = performance.now();
      
      try {
        const txData = await this.getTransactionPatternData(context.tokenAddress, context.rpcManager);
        
        let confidence = 0;
        
        // Strong buy pressure (same algorithm)
        if (txData.buyPressure >= 0.8) confidence += 35;
        else if (txData.buyPressure >= 0.6) confidence += 20;
        else if (txData.buyPressure >= 0.5) confidence += 5;
        
        // Unique buyers
        if (txData.uniqueBuyers >= 20) confidence += 25;
        else if (txData.uniqueBuyers >= 10) confidence += 15;
        
        // Reasonable transaction sizes
        if (txData.avgTransactionSize < 50000 && txData.avgTransactionSize > 100) confidence += 20;
        
        // Low bot detection
        if (txData.botDetectionScore <= 0.2) confidence += 20;
        
        const data = {
          ...txData,
          confidence
        };
  
        return {
          confidence,
          data,
          processingTime: performance.now() - startTime,
          source: 'transaction-pattern-module',
          version: this.config.version
        };
      } catch (error) {
        context.logger.error('Transaction pattern signal failed:', error);
        
        return {
          confidence: 0,
          data: {
            buyPressure: 0.4,
            uniqueBuyers: 0,
            avgTransactionSize: 0,
            botDetectionScore: 0.8,
            confidence: 0
          },
          processingTime: performance.now() - startTime,
          source: 'transaction-pattern-module',
          version: this.config.version
        };
      }
    }
  
    // Extract the sophisticated transaction pattern analysis (~300 lines preserved!)
    private async getTransactionPatternData(tokenAddress: string, rpcManager: any): Promise<any> {
      try {
        // Get recent transaction signatures (WRAPPED WITH TIMEOUT)
        const signatures = await withTimeout(
          rpcManager.getSignaturesForAddress(tokenAddress, 500, 'chainstack'),
          15000
        ).catch(() => []);
        
        if (signatures.length === 0) {
          return { buyPressure: 0.5, uniqueBuyers: 0, avgTransactionSize: 0, botDetectionScore: 1 };
        }
        
        // Filter to recent 3 hours for FAST track relevance
        const threeHoursAgo = Math.floor(Date.now() / 1000) - (3 * 60 * 60);
        const recentSignatures = signatures.filter((sig: any) =>
          (sig.blockTime || 0) >= threeHoursAgo
        ).slice(0, 100);
        
        if (recentSignatures.length === 0) {
          return { buyPressure: 0.5, uniqueBuyers: 1, avgTransactionSize: 1000, botDetectionScore: 0.7 };
        }
        
        // Analyze transaction details
        const transactionAnalysis = {
          buyTransactions: 0,
          sellTransactions: 0,
          uniqueBuyerWallets: new Set<string>(),
          uniqueSellerWallets: new Set<string>(),
          transactionSizes: [] as number[],
          transactionTimings: [] as number[],
          walletFrequency: new Map<string, number>()
        };
        
        // Process transactions in parallel batches (5 at a time) with overall timeout
        const batchSize = 5;
        const processBatches = async () => {
          for (let i = 0; i < Math.min(20, recentSignatures.length); i += batchSize) {
            const batch = recentSignatures.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (sig: any) => {
              try {
                // WRAPPED getTransaction WITH TIMEOUT
                const transaction = await withTimeout(
                  rpcManager.getTransaction(sig.signature),
                  10000  // Reduced from 15000 to 10000
                );
                if (!transaction) return null;
                
                return this.analyzeTransactionForPatterns(transaction, tokenAddress, sig);
              } catch (txError) {
                return null;
              }
            });
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach(result => {
              if (result.status === 'fulfilled' && result.value) {
                const analysis = result.value;
                
                if (analysis.isBuy) {
                  transactionAnalysis.buyTransactions++;
                  transactionAnalysis.uniqueBuyerWallets.add(analysis.walletAddress);
                } else if (analysis.isSell) {
                  transactionAnalysis.sellTransactions++;
                  transactionAnalysis.uniqueSellerWallets.add(analysis.walletAddress);
                }
                
                if (analysis.transactionValue > 0) {
                  transactionAnalysis.transactionSizes.push(analysis.transactionValue);
                }
                
                if (analysis.blockTime > 0) {
                  transactionAnalysis.transactionTimings.push(analysis.blockTime);
                }
                
                const wallet = analysis.walletAddress;
                transactionAnalysis.walletFrequency.set(
                  wallet, 
                  (transactionAnalysis.walletFrequency.get(wallet) || 0) + 1
                );
              }
            });
          }
        };

        // Wrap the entire batch processing with timeout
        await withTimeout(processBatches(), 8000);  // 8 second max for all batches
        
        // Calculate buy pressure (buy/sell ratio)
        const totalDirectionalTx = transactionAnalysis.buyTransactions + transactionAnalysis.sellTransactions;
        let buyPressure = 0.5;
        
        if (totalDirectionalTx > 0) {
          buyPressure = transactionAnalysis.buyTransactions / totalDirectionalTx;
        } else if (recentSignatures.length > 5) {
          buyPressure = 0.6;
        }
        
        const uniqueBuyers = transactionAnalysis.uniqueBuyerWallets.size;
        
        let avgTransactionSize = 1000;
        if (transactionAnalysis.transactionSizes.length > 0) {
          const totalValue = transactionAnalysis.transactionSizes.reduce((sum, size) => sum + size, 0);
          avgTransactionSize = totalValue / transactionAnalysis.transactionSizes.length;
        }
        
        let botDetectionScore = this.calculateBotDetectionScore(
          transactionAnalysis.walletFrequency,
          transactionAnalysis.transactionSizes,
          transactionAnalysis.transactionTimings
        );
        
        // Apply sanity bounds
        buyPressure = Math.max(0, Math.min(1, buyPressure));
        avgTransactionSize = Math.max(50, Math.min(1000000, avgTransactionSize));
        botDetectionScore = Math.max(0, Math.min(1, botDetectionScore));
        
        return {
          buyPressure,
          uniqueBuyers,
          avgTransactionSize,
          botDetectionScore
        };
        
      } catch (error) {
        return {
          buyPressure: 0.4,
          uniqueBuyers: 0,
          avgTransactionSize: 0,
          botDetectionScore: 0.8
        };
      }
    }
  
    // Extract sophisticated transaction analysis helper methods
    private analyzeTransactionForPatterns(transaction: any, tokenAddress: string, signature: any): any {
      try {
        const blockTime = signature.blockTime || 0;
        const accounts = transaction?.transaction?.message?.accountKeys || [];
        const instructions = transaction?.transaction?.message?.instructions || [];
        
        let walletAddress = 'unknown';
        if (accounts.length > 0) {
          walletAddress = accounts[0] || signature.signature.slice(0, 44);
        }
        
        let isBuy = false;
        let isSell = false;
        let transactionValue = 0;
        
        // Method 1: Look for token transfers in pre/post token balances
        const preTokenBalances = transaction.meta?.preTokenBalances || [];
        const postTokenBalances = transaction.meta?.postTokenBalances || [];
        
        for (let i = 0; i < preTokenBalances.length; i++) {
          const preBalance = preTokenBalances[i];
          const postBalance = postTokenBalances[i];
          
          if (preBalance?.mint === tokenAddress && postBalance?.mint === tokenAddress) {
            const preAmount = parseFloat(preBalance?.uiTokenAmount?.amount || 0);
            const postAmount = parseFloat(postBalance?.uiTokenAmount?.amount || 0);
            const delta = postAmount - preAmount;
            
            if (delta > 0) {
              isBuy = true;
              transactionValue = Math.abs(delta);
            } else if (delta < 0) {
              isSell = true;
              transactionValue = Math.abs(delta);
            }
          }
        }
        
        // Method 2: Estimate from native transfers if token analysis failed
        if (transactionValue === 0) {
          const nativeTransfers = transaction.meta?.innerInstructions || [];
          if (nativeTransfers.length > 0) {
            const solAmount = transaction.meta?.fee || 5000;
            transactionValue = solAmount * 100;
          }
        }
        
        // Method 3: Fallback heuristics
        if (!isBuy && !isSell && instructions.length > 0) {
          const hasSwapInstructions = instructions.some((instr: any) =>
            instr.programId && (
              instr.programId.includes('whir') ||
              instr.programId.includes('jupiter') ||
              instr.programId.includes('raydium')
            )
          );
          
          if (hasSwapInstructions) {
            isBuy = true;
            transactionValue = 1000;
          }
        }
        
        return {
          isBuy,
          isSell,
          walletAddress,
          transactionValue,
          blockTime
        };
        
      } catch (error) {
        return null;
      }
    }
  
    private calculateBotDetectionScore(
      walletFrequency: Map<string, number>,
      transactionSizes: number[],
      transactionTimings: number[]
    ): number {
      let botScore = 0;
      
      // Factor 1: Wallet repetition
      const walletCounts = Array.from(walletFrequency.values());
      if (walletCounts.length > 0) {
        const avgTxPerWallet = walletCounts.reduce((sum, count) => sum + count, 0) / walletCounts.length;
        const highFrequencyWallets = walletCounts.filter(count => count >= 5).length;
        
        if (avgTxPerWallet > 3) botScore += 0.3;
        if (highFrequencyWallets > walletCounts.length * 0.3) botScore += 0.2;
      }
      
      // Factor 2: Transaction size uniformity
      if (transactionSizes.length >= 5) {
        const avgSize = transactionSizes.reduce((sum, size) => sum + size, 0) / transactionSizes.length;
        const variance = transactionSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / transactionSizes.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = avgSize > 0 ? standardDeviation / avgSize : 1;
        
        if (coefficientOfVariation < 0.1) botScore += 0.25;
      }
      
      // Factor 3: Timing patterns
      if (transactionTimings.length >= 5) {
        const intervals = [];
        for (let i = 1; i < transactionTimings.length; i++) {
          intervals.push(transactionTimings[i] - transactionTimings[i-1]);
        }
        
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
          const uniformIntervals = intervals.filter(interval => 
            Math.abs(interval - avgInterval) < avgInterval * 0.1
          ).length;
          
          if (uniformIntervals > intervals.length * 0.7) botScore += 0.25;
        }
      }
      
      return Math.min(1, botScore);
    }
  }