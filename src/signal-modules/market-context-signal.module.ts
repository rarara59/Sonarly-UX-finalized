// src/signal-modules/market-context-signal.module.ts

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from '../interfaces/signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

// Add this after the imports at the top of the file
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`RPC call timeout after ${timeoutMs}ms`)), timeoutMs)
  );
  
  return Promise.race([promise, timeoutPromise]);
};

export class MarketContextSignalModule extends SignalModule {
    constructor(config: SignalModuleConfig) {
      super('market-context', config);
    }
  
    getRequiredTrack(): 'FAST' | 'SLOW' | 'BOTH' {
      return 'BOTH'; // Market context applies to both tracks
    }
  
    getSignalType(): keyof DetectionSignals {
      return 'marketContext';
    }
  
    async execute(context: SignalContext): Promise<SignalResult> {
      const startTime = performance.now();
      
      try {
        // OPTIMIZATION: Wrap entire execution with 3-second timeout for FAST track
        const contextData = await withTimeout(
          this.getMarketContextData(),
          3000  // Max 3 seconds for entire market context analysis
        );
        
        let confidence = 50; // Neutral base
        
        // SOL trend
        if (contextData.solTrend >= 0.05) confidence += 25;
        else if (contextData.solTrend <= -0.1) confidence -= 25;
        
        // Volatility
        if (contextData.solVolatility <= 0.05) confidence += 15;
        else if (contextData.solVolatility >= 0.15) confidence -= 15;
        
        // Meme market health
        if (contextData.memeMarketHealth >= 0.7) confidence += 10;
        
        confidence = Math.max(0, Math.min(100, confidence));
        
        const data = {
          ...contextData,
          confidence
        };
  
        return {
          confidence,
          data,
          processingTime: performance.now() - startTime,
          source: 'market-context-module',
          version: this.config.version
        };
      } catch (error) {
        // Fast fallback for timeout or any other error
        return {
          confidence: 50,
          data: {
            solTrend: 0,
            solVolatility: 0.05,
            memeMarketHealth: 0.5,
            confidence: 50
          },
          processingTime: performance.now() - startTime,
          source: 'market-context-module',
          version: this.config.version
        };
      }
    }
  
    // OPTIMIZATION: Simplified and faster market context analysis
    private async getMarketContextData(): Promise<any> {
      try {
        // OPTIMIZATION: Use Promise.allSettled with fast timeouts for parallel execution
        const [solMarketResult, memeMarketResult] = await Promise.allSettled([
          withTimeout(this.fetchSOLMarketDataFast(), 2000),  // 2s max for SOL data
          withTimeout(this.analyzeMemeMarketHealthFast(), 2000)  // 2s max for meme data
        ]);
        
        const solMarketData = solMarketResult.status === 'fulfilled' ? 
          solMarketResult.value : { trend: 0, volatility: 0.05 };
        const memeMarketData = memeMarketResult.status === 'fulfilled' ? 
          memeMarketResult.value : { health: 0.5 };
        
        return {
          solTrend: solMarketData.trend,
          solVolatility: solMarketData.volatility,
          memeMarketHealth: memeMarketData.health
        };
        
      } catch (error) {
        // Conservative fallback (neutral market conditions)
        return {
          solTrend: 0,
          solVolatility: 0.05,
          memeMarketHealth: 0.5
        };
      }
    }
  
    // OPTIMIZATION: Much faster SOL market data fetching
    private async fetchSOLMarketDataFast(): Promise<any> {
      // METHOD 1: Jupiter API (fastest and most reliable) - WRAPPED WITH TIMEOUT
      try {
        const jupiterResponse = await withTimeout(
          fetch('https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112'),
          1500  // Reduced from 15s to 1.5s
        );
        
        if (jupiterResponse.ok) {
          const jupiterData = await jupiterResponse.json();
          const solData = jupiterData.data?.['So11111111111111111111111111111111111111112'];
          
          if (solData) {
            const currentPrice = solData.price;
            // OPTIMIZATION: Use lightweight trend calculation
            const { trend, volatility } = await this.calculateSOLMetricsLightweight(currentPrice);
            
            return {
              currentPrice,
              trend,
              volatility,
              dataAgeHours: 0.5
            };
          }
        }
      } catch (jupiterError) {
        // Continue to fallback
      }
      
      // METHOD 2: Fast on-chain fallback with minimal calls
      return await this.estimateSOLFromMinimalChainData();
    }

    // OPTIMIZATION: Lightweight SOL metrics calculation
    private async calculateSOLMetricsLightweight(currentPrice: number): Promise<any> {
      try {
        const rpcManager = (await import('../services/rpc-connection-manager')).default;
        
        // OPTIMIZATION: Only get 50 signatures instead of 500-1000
        const signatures = await withTimeout(
          rpcManager.getSignaturesForAddress('So11111111111111111111111111111111111111112', 50, 'helius'),
          1000  // 1s timeout
        ).catch(() => []);
        
        if (signatures.length < 10) {
          return { trend: 0, volatility: 0.05 };
        }
        
        // Quick trend analysis using just signature timing
        const now = Math.floor(Date.now() / 1000);
        const recent1h = signatures.filter((sig: any) => (sig.blockTime || 0) >= now - 3600);
        const recent3h = signatures.filter((sig: any) => (sig.blockTime || 0) >= now - 10800);
        
        let trend = 0;
        if (recent3h.length > 5) {
          const recentActivity = recent1h.length;
          const avgActivity = recent3h.length / 3;
          
          if (avgActivity > 0) {
            trend = (recentActivity - avgActivity) / avgActivity * 0.05;
          }
        }
        
        // Simple volatility estimation from fee variance
        const recentFees = signatures.slice(0, 20).map((s: any) => s.fee || 5000);
        const avgFee = recentFees.reduce((sum: number, fee: number) => sum + fee, 0) / recentFees.length;
        const feeVariance = recentFees.reduce((sum: number, fee: number) => sum + Math.pow(fee - avgFee, 2), 0) / recentFees.length;
        const volatility = Math.sqrt(feeVariance) / avgFee || 0.05;
        
        return {
          trend: Math.max(-0.15, Math.min(0.15, trend)),
          volatility: Math.max(0.01, Math.min(0.3, volatility))
        };
        
      } catch (error) {
        return { trend: 0, volatility: 0.05 };
      }
    }
  
    // OPTIMIZATION: Minimal chain data analysis
    private async estimateSOLFromMinimalChainData(): Promise<any> {
      try {
        const rpcManager = (await import('../services/rpc-connection-manager')).default;
        
        // OPTIMIZATION: Only get 20 signatures for very fast analysis
        const signatures = await withTimeout(
          rpcManager.getSignaturesForAddress('So11111111111111111111111111111111111111112', 20, 'helius'),
          800  // 0.8s timeout
        ).catch(() => []);
        
        if (signatures.length === 0) {
          return {
            currentPrice: 120,
            trend: 0,
            volatility: 0.08,
            dataAgeHours: 6
          };
        }
        
        // Simple activity-based metrics
        const now = Math.floor(Date.now() / 1000);
        const recentSigs = signatures.filter((s: any) => (s.blockTime || 0) >= now - 3600);
        const activityScore = Math.min(100, recentSigs.length * 5);
        
        // Estimate price and trends from activity
        const estimatedPrice = 100 + (activityScore - 50) * 0.5;
        const trend = (recentSigs.length > 10) ? 0.02 : -0.01;
        const volatility = Math.max(0.03, Math.min(0.12, recentSigs.length / 50));
        
        return {
          currentPrice: estimatedPrice,
          trend,
          volatility,
          dataAgeHours: 1
        };
        
      } catch (error) {
        return {
          currentPrice: 120,
          trend: 0,
          volatility: 0.08,
          dataAgeHours: 6
        };
      }
    }

    // OPTIMIZATION: Much faster meme market health analysis
    private async analyzeMemeMarketHealthFast(): Promise<any> {
      try {
        // METHOD 1: Fast API call with reduced scope
        const memeHealthFromApis = await this.fetchMemeMarketFromAPIsFast();
        
        if (memeHealthFromApis.health > 0) {
          return memeHealthFromApis;
        }
        
        // METHOD 2: Ultra-lightweight on-chain estimation
        return await this.estimateMemeHealthMinimal();
        
      } catch (error) {
        return { health: 0.5, tokensAnalyzed: 0 };
      }
    }
  
    // OPTIMIZATION: Faster API call with minimal data
    private async fetchMemeMarketFromAPIsFast(): Promise<any> {
      try {
        // OPTIMIZATION: Shorter timeout and reduced data request
        const dexResponse = await withTimeout(
          fetch('https://api.dexscreener.com/latest/dex/search/?q=SOL'),
          1200  // Reduced from 15s to 1.2s
        );
        
        if (dexResponse.ok) {
          const dexData = await dexResponse.json();
          const pairs = dexData.pairs || [];
          
          // OPTIMIZATION: Only analyze first 10 pairs instead of 25
          const memeCoins = pairs
            .filter((pair: any) => {
              const marketCap = parseFloat(pair.fdv || 0);
              const volume24h = parseFloat(pair.volume?.h24 || 0);
              return marketCap > 100000 && marketCap < 100000000 && volume24h > 10000;
            })
            .slice(0, 10);  // Reduced from 25 to 10
          
          if (memeCoins.length === 0) {
            return { health: 0.4, tokensAnalyzed: 0 };
          }
          
          // OPTIMIZATION: Simplified health calculation
          let positiveTokens = 0;
          let totalPerformance = 0;
          
          memeCoins.forEach((pair: any) => {
            const change24h = parseFloat(pair.priceChange?.h24 || 0);
            totalPerformance += change24h;
            if (change24h > 0) positiveTokens++;
          });
          
          const avgPerformance = totalPerformance / memeCoins.length;
          const positiveRatio = positiveTokens / memeCoins.length;
          
          // Simple health scoring
          let health = 0.5;
          
          if (avgPerformance > 10) health += 0.20;
          else if (avgPerformance > 0) health += 0.10;
          else if (avgPerformance < -20) health -= 0.20;
          
          if (positiveRatio > 0.6) health += 0.15;
          else if (positiveRatio < 0.4) health -= 0.15;
          
          health = Math.max(0.1, Math.min(1, health));
          
          return { health, tokensAnalyzed: memeCoins.length };
        }
      } catch (apiError) {
        // Continue to fallback
      }
      
      return { health: 0, tokensAnalyzed: 0 };
    }
  
    // OPTIMIZATION: Ultra-minimal on-chain meme health estimation
    private async estimateMemeHealthMinimal(): Promise<any> {
      try {
        const rpcManager = (await import('../services/rpc-connection-manager')).default;
        
        // OPTIMIZATION: Only check a few program accounts with tiny limit
        const raydiumPools = await withTimeout(
          rpcManager.getProgramAccounts('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', {
            dataSize: 752,
            limit: 5  // Only get 5 pools
          }),
          800  // 0.8s timeout
        ).catch(() => []);
        
        if (raydiumPools.length === 0) {
          return { health: 0.3, tokensAnalyzed: 0 };
        }
        
        // Very simple analysis - just check if pools exist and have data
        let healthyPools = 0;
        
        raydiumPools.forEach((pool: any) => {
          const poolInfo = pool.account?.data?.parsed?.info;
          if (poolInfo) {
            const valueA = parseFloat(poolInfo.tokenAmountA?.amount || 0);
            const valueB = parseFloat(poolInfo.tokenAmountB?.amount || 0);
            
            if (valueA > 0 && valueB > 0) {
              healthyPools++;
            }
          }
        });
        
        const poolHealthRatio = raydiumPools.length > 0 ? healthyPools / raydiumPools.length : 0;
        const health = Math.max(0.2, Math.min(0.8, poolHealthRatio * 0.6 + 0.2));
        
        return { health, tokensAnalyzed: healthyPools };
        
      } catch (error) {
        return { health: 0.4, tokensAnalyzed: 0 };
      }
    }
  }