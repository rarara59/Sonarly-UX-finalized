// src/signal-modules/lp-analysis-signal.module.ts

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from '../interfaces/signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

// Add this after the imports at the top of the file
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`RPC call timeout after ${timeoutMs}ms`)), timeoutMs)
  );
  
  return Promise.race([promise, timeoutPromise]);
};

export class LPAnalysisSignalModule extends SignalModule {
  constructor(config: SignalModuleConfig) {
    super('lp-analysis', config);
  }

  getRequiredTrack(): 'FAST' | 'SLOW' | 'BOTH' {
    return 'BOTH'; // LP analysis works for both tracks
  }

  getSignalType(): keyof DetectionSignals {
    return 'lpAnalysis';
  }

  async execute(context: SignalContext): Promise<SignalResult> {
    const startTime = performance.now();
    
    try {
      // Get optimized token data based on age (UPDATED TO PASS CONTEXT)
      const tokenData = await this.getTokenFundamentals(context.tokenAddress, context.rpcManager, context);
      
      let confidence = 0;
      
      // Score LP characteristics (same algorithm as original)
      if (tokenData.lpValueUSD >= 10000) confidence += 25;
      else if (tokenData.lpValueUSD >= 5000) confidence += 15;
      else if (tokenData.lpValueUSD >= 1000) confidence += 5;
      
      if (tokenData.holderCount >= 50) confidence += 20;
      else if (tokenData.holderCount >= 25) confidence += 15;
      else if (tokenData.holderCount >= 10) confidence += 5;
      
      if (tokenData.mintDisabled) confidence += 15;
      if (!tokenData.freezeAuthority) confidence += 10;
      if (tokenData.contractVerified) confidence += 10;
      if (tokenData.topWalletPercent < 0.3) confidence += 15;
      if (tokenData.dexCount >= 2) confidence += 5;
      
      const data = {
        ...tokenData,
        confidence
      };

      return {
        confidence,
        data,
        processingTime: performance.now() - startTime,
        source: 'lp-analysis-module',
        version: this.config.version
      };
    } catch (error) {
      context.logger.error('LP analysis signal failed:', error);
      
      return {
        confidence: 0,
        data: {
          lpValueUSD: 0,
          holderCount: 0,
          mintDisabled: false,
          freezeAuthority: true,
          contractVerified: false,
          topWalletPercent: 1.0,
          dexCount: 1,
          confidence: 0
        },
        processingTime: performance.now() - startTime,
        source: 'lp-analysis-module',
        version: this.config.version
      };
    }
  }

  // OPTIMIZED: Age-based analysis routing
  private async getTokenFundamentals(tokenAddress: string, rpcManager: any, context: SignalContext): Promise<any> {
    try {
      // Get token age from context
      const tokenAge = context.tokenAgeMinutes;
      
      if (tokenAge < 2) {
        // TOO FRESH: Skip heavy analysis, minimal data only
        return await this.getMinimalTokenAnalysis(tokenAddress, rpcManager);
      } else if (tokenAge <= 15) {
        // SWEET SPOT: Fast path for meme coin trading window
        return await this.getFastTokenAnalysis(tokenAddress, rpcManager);
      } else {
        // ESTABLISHED: Deep analysis for older tokens
        return await this.getDeepTokenAnalysis(tokenAddress, rpcManager);
      }
      
    } catch (error) {
      // Conservative fallback
      return {
        lpValueUSD: 0,
        holderCount: 0,
        mintDisabled: false,
        freezeAuthority: true,
        contractVerified: false,
        topWalletPercent: 1.0,
        dexCount: 1
      };
    }
  }

  // MINIMAL PATH: For very fresh tokens (< 2 minutes) 
  private async getMinimalTokenAnalysis(tokenAddress: string, rpcManager: any): Promise<any> {
    try {
      // Only the most basic info for very fresh tokens
      const tokenSupply = await withTimeout(rpcManager.getTokenSupply(tokenAddress), 5000).catch(() => null);
      
      // Conservative fallback for very fresh tokens
      return {
        lpValueUSD: 1000, // Conservative baseline
        holderCount: 0,
        mintDisabled: false,
        freezeAuthority: true,
        contractVerified: tokenSupply !== null,
        topWalletPercent: 1.0, // Assume high concentration
        dexCount: 1
      };
      
    } catch (error) {
      return {
        lpValueUSD: 500, // Very conservative
        holderCount: 0,
        mintDisabled: false,
        freezeAuthority: true,
        contractVerified: false,
        topWalletPercent: 1.0,
        dexCount: 1
      };
    }
  }

  // FAST PATH: Optimized analysis for meme coin sweet spot (2-15 minutes)
  private async getFastTokenAnalysis(tokenAddress: string, rpcManager: any): Promise<any> {
    try {
      // Only get essential data with small requests
      const [tokenSupply, smallAccountSample] = await Promise.all([
        withTimeout(rpcManager.getTokenSupply(tokenAddress), 10000).catch(() => null),
        withTimeout(rpcManager.getTokenAccountsByOwner(tokenAddress, { limit: 20 }), 10000).catch(() => [])
      ]);

      const holderCount = smallAccountSample?.length || 0;
      
      // Quick authority check
      let mintDisabled = false;
      let freezeAuthority = false;
      try {
        const accountInfo = await withTimeout(rpcManager.getAccountInfo(tokenAddress), 5000);
        if (accountInfo?.data) {
          mintDisabled = !accountInfo.data.mintAuthority || 
                        accountInfo.data.mintAuthority === '11111111111111111111111111111111';
          freezeAuthority = accountInfo.data.freezeAuthority && 
                           accountInfo.data.freezeAuthority !== '11111111111111111111111111111111';
        }
      } catch (authorityError) {
        // Silent fail for authority check
      }

      // Simple concentration check (top 3 wallets only)
      let topWalletPercent = 0;
      if (smallAccountSample.length > 0 && tokenSupply?.amount) {
        try {
          const sortedAccounts = smallAccountSample
            .map((acc: any) => ({
              balance: parseFloat(acc.account?.data?.parsed?.info?.tokenAmount?.amount || 0)
            }))
            .sort((a: any, b: any) => b.balance - a.balance);

          if (sortedAccounts.length > 0) {
            const totalSupply = parseFloat(tokenSupply.amount);
            const topWalletBalance = sortedAccounts[0].balance;
            topWalletPercent = totalSupply > 0 ? topWalletBalance / totalSupply : 0;
          }
        } catch (concentrationError) {
          // Silent fail
        }
      }

      // Fast LP estimation based on basic metrics
      let lpValueUSD = 0;
      
      // Only try ONE quick method for new tokens
      try {
        // Quick signature sample (much smaller - REDUCED FROM 500 to 20!)
        const signatures = await withTimeout(
          rpcManager.getSignaturesForAddress(tokenAddress, 20), // Only 20 instead of 500!
          5000
        );

        if (signatures.length > 0) {
          // Simple estimation based on activity
          const recentSigs = signatures.filter((sig: any) => {
            const sigTime = sig.blockTime || 0;
            const minutes10Ago = Math.floor(Date.now() / 1000) - (10 * 60); // Last 10 minutes
            return sigTime >= minutes10Ago;
          });

          if (recentSigs.length > 0) {
            // Conservative estimation for new tokens
            lpValueUSD = Math.min(10000, recentSigs.length * 250 + holderCount * 100);
          }
        }
      } catch (quickSigError) {
        // Use fallback
      }

      // Fallback estimation for new tokens
      if (lpValueUSD === 0) {
        let baseValue = 2000; // Conservative for 2-15 minute tokens
        
        if (holderCount > 10) baseValue = 4000;
        if (holderCount > 5) baseValue = 3000;
        
        if (topWalletPercent < 0.5) baseValue *= 1.2;
        if (mintDisabled) baseValue *= 1.1;
        
        lpValueUSD = baseValue;
      }

      // Conservative bounds for new tokens
      lpValueUSD = Math.min(25000, Math.max(1000, lpValueUSD));
      
      return {
        lpValueUSD,
        holderCount,
        mintDisabled,
        freezeAuthority,
        contractVerified: tokenSupply !== null,
        topWalletPercent: Math.min(1, Math.max(0, topWalletPercent)),
        dexCount: 1
      };
      
    } catch (error) {
      // Fast fallback
      return {
        lpValueUSD: 2000,
        holderCount: 0,
        mintDisabled: false,
        freezeAuthority: true,
        contractVerified: false,
        topWalletPercent: 1.0,
        dexCount: 1
      };
    }
  }

  // DEEP PATH: Full sophisticated analysis for established tokens (15+ minutes)
  private async getDeepTokenAnalysis(tokenAddress: string, rpcManager: any): Promise<any> {
    try {
      // Get basic token data with larger limits for established tokens
      const [tokenSupply, tokenAccounts] = await Promise.all([
        withTimeout(rpcManager.getTokenSupply(tokenAddress), 15000).catch(() => null),
        withTimeout(rpcManager.getTokenAccountsByOwner(tokenAddress), 15000).catch(() => [])
      ]);

      const holderCount = tokenAccounts?.length || 0;
      let mintDisabled = false;
      let freezeAuthority = false;

      // Check authorities
      try {
        const accountInfo = await withTimeout(rpcManager.getAccountInfo(tokenAddress), 15000);
        if (accountInfo?.data) {
          mintDisabled = !accountInfo.data.mintAuthority || 
                        accountInfo.data.mintAuthority === '11111111111111111111111111111111';
          freezeAuthority = accountInfo.data.freezeAuthority && 
                           accountInfo.data.freezeAuthority !== '11111111111111111111111111111111';
        }
      } catch (authorityError) {
        // Silent fail for authority check
      }

      // Calculate top wallet concentration
      let topWalletPercent = 0;
      if (tokenAccounts.length > 0 && tokenSupply?.amount) {
        try {
          const sortedAccounts = tokenAccounts
            .map((acc: any) => ({
              balance: parseFloat(acc.account?.data?.parsed?.info?.tokenAmount?.amount || 0)
            }))
            .sort((a: any, b: any) => b.balance - a.balance);

          if (sortedAccounts.length > 0) {
            const totalSupply = parseFloat(tokenSupply.amount);
            const topWalletBalance = sortedAccounts[0].balance;
            topWalletPercent = totalSupply > 0 ? topWalletBalance / totalSupply : 0;
          }
        } catch (concentrationError) {
          // Silent fail for concentration calc
        }
      }

      let contractVerified = false;
      try {
        contractVerified = tokenSupply !== null && tokenAccounts.length > 0;
      } catch (verificationError) {
        // Silent fail
      }

      // LP Value: All 4 sophisticated methods preserved for established tokens!
      let lpValueUSD = 0;

      // METHOD 1: Helius Enhanced APIs
      try {
        const heliusApiKey = process.env.HELIUS_API_KEY;
        if (heliusApiKey) {
          const dasResponse = await withTimeout(
            fetch(`https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-asset',
                method: 'getAsset',
                params: { id: tokenAddress }
              })
            }),
            15000
          );
          
          if (dasResponse.ok) {
            const dasData = await dasResponse.json();
            if (dasData.result?.price_info) {
              const priceInfo = dasData.result.price_info;
              lpValueUSD = parseFloat(priceInfo.total_liquidity || priceInfo.liquidity || 0);
            }
          }
        }
      } catch (dasError) {
        // Continue to next method
      }

      // METHOD 2: Enhanced Transaction Analysis
      if (lpValueUSD === 0 && process.env.HELIUS_API_KEY) {
        try {
          const txResponse = await withTimeout(
            fetch(`https://api.helius.xyz/v0/addresses/${tokenAddress}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=50`),
            15000
          );

          if (txResponse.ok) {
            const transactions = await txResponse.json();
            const recent24h = transactions.filter((tx: any) => {
              const txTime = new Date(tx.timestamp).getTime();
              const hours24Ago = Date.now() - (24 * 60 * 60 * 1000);
              return txTime >= hours24Ago;
            });
            
            if (recent24h.length > 0) {
              const avgTxValue = recent24h.reduce((sum: any, tx: any) => {
                const value = parseFloat(tx.native_transfers?.[0]?.amount || 0);
                return sum + value;
              }, 0) / recent24h.length;
              
              lpValueUSD = avgTxValue * recent24h.length * 15;
            }
          }
        } catch (txError) {
          // Continue to next method
        }
      }

      // METHOD 3: Chainstack high-performance analysis (REDUCED from 500 to 100 signatures)
      if (lpValueUSD === 0) {
        try {
          const [signatures, supply] = await Promise.all([
            withTimeout(rpcManager.getSignaturesForAddress(tokenAddress, 100, 'chainstack'), 15000), // REDUCED from 500
            withTimeout(rpcManager.getTokenSupply(tokenAddress, 'chainstack'), 15000)
          ]);

          if (signatures.length > 0) {
            const recent24h = signatures.filter((sig: any) => {
              const sigTime = sig.blockTime || 0;
              const hours24Ago = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
              return sigTime >= hours24Ago;
            });

            const recentValue = recent24h.reduce((total: any, sig: any) => {
              return total + (sig.fee || 5000) * 1000;
            }, 0);

            if (recentValue > 0 && tokenAccounts.length > 0) {
              lpValueUSD = Math.min(100000, recentValue * (tokenAccounts.length / 10));
            }
          }
        } catch (chainStackError) {
          // Continue to next method
        }
      }

      // METHOD 4: Direct Orca/Meteora pool scanning (REDUCED scope)
      if (lpValueUSD === 0) {
        try {
          const orcaProgram = 'whirLb6rbeCMEbVPDcZhY4bgCkhSoJtvb9ahGR8hj';
          const meteoraProgram = 'LBUZKhRxPF3XUpBCjp4YzTKqLccjZhTSDM9YuVaPwxo';
          
          const [orcaPools, meteoraPools] = await Promise.all([
            withTimeout(rpcManager.getProgramAccounts(orcaProgram, [], 'chainstack'), 10000).catch(() => []), // REDUCED timeout
            withTimeout(rpcManager.getProgramAccounts(meteoraProgram, [], 'chainstack'), 10000).catch(() => [])
          ]);
          
          const allPools = [...orcaPools.slice(0, 10), ...meteoraPools.slice(0, 10)]; // REDUCED from 25 to 10
          
          for (const pool of allPools) {
            try {
              const poolData = pool.account?.data?.parsed?.info;
              if (poolData && (poolData.tokenMintA === tokenAddress || poolData.tokenMintB === tokenAddress)) {
                const valueA = parseFloat(poolData.tokenAmountA?.amount || 0) / Math.pow(10, poolData.tokenAmountA?.decimals || 6);
                const valueB = parseFloat(poolData.tokenAmountB?.amount || 0) / Math.pow(10, poolData.tokenAmountB?.decimals || 6);
                
                const priceMap: Record<string, number> = { 'USDC': 1, 'USDT': 1, 'SOL': 130, 'WSOL': 130 };
                const symbolA = poolData.tokenAmountA?.symbol || '';
                const symbolB = poolData.tokenAmountB?.symbol || '';
                
                const poolValueUSD = (valueA * (priceMap[symbolA as keyof typeof priceMap] || 0)) + (valueB * (priceMap[symbolB as keyof typeof priceMap] || 0));
                lpValueUSD += poolValueUSD;
              }
            } catch (poolError) {
              continue;
            }
          }
        } catch (scanError) {
          // Continue to fallback
        }
      }

      // METHOD 5: Enhanced fallback estimation
      if (lpValueUSD === 0) {
        let baseValue = 5000; // Higher baseline for established tokens
        
        if (holderCount > 100) baseValue = 50000;
        else if (holderCount > 50) baseValue = 25000;
        else if (holderCount > 25) baseValue = 12000;
        else if (holderCount > 10) baseValue = 8000;
        
        if (topWalletPercent < 0.15) baseValue *= 1.5;
        else if (topWalletPercent < 0.3) baseValue *= 1.2;
        
        if (mintDisabled) baseValue *= 1.3;
        if (contractVerified) baseValue *= 1.2;
        
        lpValueUSD = baseValue;
      }

      // Sanity bounds for established tokens
      lpValueUSD = Math.min(750000, Math.max(1000, lpValueUSD));
      
      return {
        lpValueUSD,
        holderCount,
        mintDisabled,
        freezeAuthority,
        contractVerified,
        topWalletPercent: Math.min(1, Math.max(0, topWalletPercent)),
        dexCount: 1
      };
      
    } catch (error) {
      // Conservative fallback for established tokens
      return {
        lpValueUSD: 5000,
        holderCount: 0,
        mintDisabled: false,
        freezeAuthority: true,
        contractVerified: false,
        topWalletPercent: 1.0,
        dexCount: 1
      };
    }
  }
}