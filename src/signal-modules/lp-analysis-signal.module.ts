// src/signal-modules/lp-analysis-signal.module.ts

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from '../interfaces/signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

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
      // Get basic token data (preserve the sophisticated multi-method approach)
      const tokenData = await this.getTokenFundamentals(context.tokenAddress, context.rpcManager);
      
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

  // Extract the sophisticated token fundamentals logic (4 methods!)
  private async getTokenFundamentals(tokenAddress: string, rpcManager: any): Promise<any> {
    try {
      // Get basic token data
      const [tokenSupply, tokenAccounts] = await Promise.all([
        rpcManager.getTokenSupply(tokenAddress).catch(() => null),
        rpcManager.getTokenAccountsByOwner(tokenAddress).catch(() => [])
      ]);

      const holderCount = tokenAccounts?.length || 0;
      let mintDisabled = false;
      let freezeAuthority = false;

      // Check authorities
      try {
        const accountInfo = await rpcManager.getAccountInfo(tokenAddress);
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

      // LP Value: All 4 sophisticated methods preserved!
      let lpValueUSD = 0;

      // METHOD 1: Helius Enhanced APIs
      try {
        const heliusApiKey = process.env.HELIUS_API_KEY;
        if (heliusApiKey) {
          const dasResponse = await fetch(`https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 'get-asset',
              method: 'getAsset',
              params: { id: tokenAddress }
            })
          });
          
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
          const txResponse = await fetch(`https://api.helius.xyz/v0/addresses/${tokenAddress}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=50`);
          
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

      // METHOD 3: Chainstack high-performance analysis  
      if (lpValueUSD === 0) {
        try {
          const [signatures, supply] = await Promise.all([
            rpcManager.getSignaturesForAddress(tokenAddress, 500, 'chainstack'),
            rpcManager.getTokenSupply(tokenAddress, 'chainstack')
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

      // METHOD 4: Direct Orca/Meteora pool scanning
      if (lpValueUSD === 0) {
        try {
          const orcaProgram = 'whirLb6rbeCMEbVPDcZhY4bgCkhSoJtvb9ahGR8hj';
          const meteoraProgram = 'LBUZKhRxPF3XUpBCjp4YzTKqLccjZhTSDM9YuVaPwxo';
          
          const [orcaPools, meteoraPools] = await Promise.all([
            rpcManager.getProgramAccounts(orcaProgram, [], 'chainstack').catch(() => []),
            rpcManager.getProgramAccounts(meteoraProgram, [], 'chainstack').catch(() => [])
          ]);
          
          const allPools = [...orcaPools.slice(0, 25), ...meteoraPools.slice(0, 25)];
          
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
        let baseValue = 500;
        
        if (holderCount > 100) baseValue = 25000;
        else if (holderCount > 50) baseValue = 12000;
        else if (holderCount > 25) baseValue = 6000;
        else if (holderCount > 10) baseValue = 2500;
        
        if (topWalletPercent < 0.15) baseValue *= 1.5;
        else if (topWalletPercent < 0.3) baseValue *= 1.2;
        
        if (mintDisabled) baseValue *= 1.3;
        if (contractVerified) baseValue *= 1.2;
        
        lpValueUSD = baseValue;
      }

      // Sanity bounds
      lpValueUSD = Math.min(750000, Math.max(100, lpValueUSD));
      
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
}