// src/signal-modules/market-context-signal.module.ts

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from '../interfaces/signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

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
        const contextData = await this.getMarketContextData();
        
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
        context.logger.error('Market context signal failed:', error);
        
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
  
    // Extract the sophisticated market context analysis (~400 lines preserved!)
    private async getMarketContextData(): Promise<any> {
      try {
        // Parallel data fetching for performance
        const [solMarketData, memeMarketData] = await Promise.all([
          this.fetchSOLMarketData(),
          this.analyzeMemeMarketHealth()
        ]);
        
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
  
    private async fetchSOLMarketData(): Promise<any> {
      const rpcManager = (await import('../services/rpc-connection-manager')).default;
      
      // METHOD 1: Chainstack High-Performance DEX Analysis (primary)
      try {
        // Analyze recent DEX swaps to get real-time SOL price
        const solMarketData = await this.analyzeSOLDEXActivity(rpcManager);
        
        if (solMarketData.currentPrice > 0) {
          return {
            ...solMarketData,
            dataAgeHours: 0.05
          };
        }
      } catch (chainStackError) {
        // Continue to next method
      }
      
      // METHOD 2: Jupiter API (fallback for price discovery)
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const jupiterResponse = await fetch(
          'https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112',
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (jupiterResponse.ok) {
          const jupiterData = await jupiterResponse.json();
          const solData = jupiterData.data?.['So11111111111111111111111111111111111111112'];
          
          if (solData) {
            const currentPrice = solData.price;
            const { trend, volatility } = await this.calculateSOLMetricsFromPrice(currentPrice, rpcManager);
            
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
      
      // METHOD 3: Pure Chainstack on-chain analysis (final fallback)
      return await this.estimateSOLFromChainStackOnly(rpcManager);
    }

    private async analyzeSOLDEXActivity(rpcManager: any): Promise<any> {
      try {
        // Get recent DEX swap transactions for SOL price discovery
        const [raydiumSwaps, orcaSwaps, jupiterSwaps] = await Promise.all([
          this.getSOLSwapsFromDEX(rpcManager, '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'), // Raydium V4
          this.getSOLSwapsFromDEX(rpcManager, 'whirLb6rbeCMEbVPvDcZhY4bgCkhSoJtvb9ahGR8hj'), // Orca Whirlpools
          this.getSOLSwapsFromDEX(rpcManager, 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4') // Jupiter V6
        ]);
        
        const allSwaps = [...raydiumSwaps, ...orcaSwaps, ...jupiterSwaps]
          .filter(swap => swap.solPrice > 0)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 100);
        
        if (allSwaps.length < 5) {
          throw new Error('Insufficient DEX swap data for price discovery');
        }
        
        // Calculate current SOL price (weighted average of recent swaps)
        const recentSwaps = allSwaps.slice(0, 10);
        const totalVolume = recentSwaps.reduce((sum, swap) => sum + swap.volume, 0);
        const currentPrice = totalVolume > 0 ? 
          recentSwaps.reduce((sum, swap) => sum + (swap.solPrice * swap.volume), 0) / totalVolume :
          recentSwaps.reduce((sum, swap) => sum + swap.solPrice, 0) / recentSwaps.length;
        
        // Calculate trend and volatility
        const trend = this.calculateSOLTrendFromSwaps(allSwaps);
        const volatility = this.calculateSOLVolatilityFromSwaps(allSwaps);
        
        return { currentPrice, trend, volatility };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Chainstack DEX analysis failed: ${errorMessage}`);
      }
    }
  
    private async getSOLSwapsFromDEX(rpcManager: any, programId: string): Promise<any[]> {
      try {
        const signatures = await rpcManager.getSignaturesForAddress(programId, 200).catch(() => []);
        
        const swaps = [];
        const last24h = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
        
        for (const sig of signatures.slice(0, 20)) {
          if ((sig.blockTime || 0) < last24h) continue;
          
          try {
            const transaction = await rpcManager.getTransaction(sig.signature);
            if (!transaction) continue;
            
            const solSwapData = this.extractSOLPriceFromTransaction(transaction, sig.blockTime || 0);
            if (solSwapData) {
              swaps.push({
                ...solSwapData,
                dex: this.getDEXName(programId)
              });
            }
          } catch (txError) {
            continue;
          }
        }
        
        return swaps;
      } catch (error) {
        return [];
      }
    }
  
    private extractSOLPriceFromTransaction(transaction: any, timestamp: number): any {
      try {
        const preBalances = transaction.meta?.preTokenBalances || [];
        const postBalances = transaction.meta?.postTokenBalances || [];
        
        let solDelta = 0;
        let usdDelta = 0;
        
        for (let i = 0; i < preBalances.length; i++) {
          const preBalance = preBalances[i];
          const postBalance = postBalances[i];
          
          if (!preBalance || !postBalance) continue;
          
          const mint = preBalance.mint;
          const preBal = parseFloat(preBalance.uiTokenAmount?.amount || 0);
          const postBal = parseFloat(postBalance.uiTokenAmount?.amount || 0);
          const delta = postBal - preBal;
          
          // SOL movements
          if (mint === 'So11111111111111111111111111111111111111112') {
            solDelta += delta / 1e9;
          }
          // USDC movements
          else if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
            usdDelta += delta / 1e6;
          }
          // USDT movements
          else if (mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
            usdDelta += delta / 1e6;
          }
        }
        
        // Calculate SOL price
        if (Math.abs(solDelta) > 0.001 && Math.abs(usdDelta) > 1) {
          const solPrice = Math.abs(usdDelta / solDelta);
          const volume = Math.abs(usdDelta);
          
          if (solPrice >= 20 && solPrice <= 1000) {
            return {
              timestamp,
              solPrice,
              volume
            };
          }
        }
        
        return null;
      } catch (error) {
        return null;
      }
    }
  
    private calculateSOLTrendFromSwaps(swaps: Array<{timestamp: number; solPrice: number}>): number {
      try {
        if (swaps.length < 10) return 0;
        
        const now = Math.floor(Date.now() / 1000);
        const recent2h = swaps.filter((s: any) => s.timestamp >= now - 7200);
        const previous2h = swaps.filter((s: any) => s.timestamp >= now - 14400 && s.timestamp < now - 7200);
        
        if (recent2h.length === 0 || previous2h.length === 0) return 0;
        
        const recentAvgPrice = recent2h.reduce((sum: number, s: any) => sum + s.solPrice, 0) / recent2h.length;
        const previousAvgPrice = previous2h.reduce((sum: number, s: any) => sum + s.solPrice, 0) / previous2h.length;
        
        const trend = (recentAvgPrice - previousAvgPrice) / previousAvgPrice;
        
        return Math.max(-0.2, Math.min(0.2, trend));
      } catch (error) {
        return 0;
      }
    }
  
    private calculateSOLVolatilityFromSwaps(swaps: Array<{timestamp: number; solPrice: number}>): number {
      try {
        if (swaps.length < 5) return 0.05;
        
        const prices = swaps.map((s: any) => s.solPrice);
        const avgPrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;
        
        const variance = prices.reduce((sum: number, price: number) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
        const volatility = Math.sqrt(variance) / avgPrice;
        
        return Math.max(0.01, Math.min(0.5, volatility));
      } catch (error) {
        return 0.05;
      }
    }
  
    private async calculateSOLMetricsFromPrice(currentPrice: number, rpcManager: any): Promise<any> {
      // Use current price + Chainstack analysis for trend/volatility
      return this.analyzeSOLNetworkActivity(currentPrice, rpcManager);
    }
  
    private async analyzeSOLNetworkActivity(currentPrice: number, rpcManager: any): Promise<any> {
      try {
        const signatures = await rpcManager.getSignaturesForAddress(
          'So11111111111111111111111111111111111111112',
          500
        ).catch(() => []);
        
        if (signatures.length === 0) {
          return { trend: 0, volatility: 0.05 };
        }
        
        // Advanced trend analysis using transaction patterns
        const recent6h = signatures.filter((sig: any) => {
          const sigTime = sig.blockTime || 0;
          const hours6Ago = Math.floor(Date.now() / 1000) - (6 * 60 * 60);
          return sigTime >= hours6Ago;
        });
        
        const previous6h = signatures.filter((sig: any) => {
          const sigTime = sig.blockTime || 0;
          const hours12Ago = Math.floor(Date.now() / 1000) - (12 * 60 * 60);
          const hours6Ago = Math.floor(Date.now() / 1000) - (6 * 60 * 60);
          return sigTime >= hours12Ago && sigTime < hours6Ago;
        });
        
        let trend = 0;
        if (previous6h.length > 0) {
          const activityRatio = recent6h.length / previous6h.length;
          
          const recentAvgFee = recent6h.reduce((sum: number, sig: any) => sum + (sig.fee || 5000), 0) / recent6h.length;
          const previousAvgFee = previous6h.reduce((sum: number, sig: any) => sum + (sig.fee || 5000), 0) / previous6h.length;
          const feeRatio = recentAvgFee / previousAvgFee;
          
          trend = ((activityRatio - 1) * 0.05) + ((feeRatio - 1) * 0.03);
        }
        
        // Calculate volatility from transaction timing variance
        const recentTimings = recent6h.map((sig: any) => sig.blockTime || 0).sort((a: number, b: number) => a - b);
        let volatility = 0.05;
        
        if (recentTimings.length > 10) {
          const intervals = [];
          for (let i = 1; i < recentTimings.length; i++) {
            intervals.push(recentTimings[i] - recentTimings[i-1]);
          }
          
          const avgInterval = intervals.reduce((sum: number, interval: number) => sum + interval, 0) / intervals.length;
          const intervalVariance = intervals.reduce((sum: number, interval: number) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
          volatility = Math.sqrt(intervalVariance) / avgInterval || 0.05;
        }
        
        return {
          trend: Math.max(-0.15, Math.min(0.15, trend)),
          volatility: Math.max(0.01, Math.min(0.3, volatility))
        };
        
      } catch (error) {
        return { trend: 0, volatility: 0.05 };
      }
    }
  
    private async estimateSOLFromChainStackOnly(rpcManager: any): Promise<any> {
      try {
        const activityMetrics = await this.analyzeNetworkActivityMetrics(rpcManager);
        const estimatedPrice = this.estimateSOLPriceFromActivity(activityMetrics);
        const { trend, volatility } = activityMetrics;
        
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
  
    private async analyzeNetworkActivityMetrics(rpcManager: any): Promise<any> {
      try {
        const signatures = await rpcManager.getSignaturesForAddress(
          'So11111111111111111111111111111111111111112',
          1000
        ).catch(() => []);
        
        if (signatures.length === 0) {
          return { trend: 0, volatility: 0.05, activityScore: 50 };
        }
        
        const now = Math.floor(Date.now() / 1000);
        const recent1h = signatures.filter((s: any) => (s.blockTime || 0) >= now - 3600);
        const recent6h = signatures.filter((s: any) => (s.blockTime || 0) >= now - 21600);
        const recent24h = signatures.filter((s: any) => (s.blockTime || 0) >= now - 86400);
        
        // Activity trend analysis
        const hourlyActivity = recent1h.length;
        const avg6hActivity = recent6h.length / 6;
        const avg24hActivity = recent24h.length / 24;
        
        let trend = 0;
        if (avg24hActivity > 0) {
          const shortTermTrend = (hourlyActivity - avg6hActivity) / avg6hActivity;
          const longTermTrend = (avg6hActivity - avg24hActivity) / avg24hActivity;
          trend = (shortTermTrend * 0.7) + (longTermTrend * 0.3);
        }
        
        // Volatility from transaction fee patterns
        const recentFees = recent24h.map((s: any) => s.fee || 5000);
        const avgFee = recentFees.reduce((sum: number, fee: number) => sum + fee, 0) / recentFees.length;
        const feeVariance = recentFees.reduce((sum: number, fee: number) => sum + Math.pow(fee - avgFee, 2), 0) / recentFees.length;
        const volatility = Math.sqrt(feeVariance) / avgFee || 0.05;
        
        const activityScore = Math.min(100, (hourlyActivity / 10) * 10);
        
        return {
          trend: Math.max(-0.1, Math.min(0.1, trend)),
          volatility: Math.max(0.01, Math.min(0.2, volatility)),
          activityScore
        };
        
      } catch (error) {
        return { trend: 0, volatility: 0.05, activityScore: 50 };
      }
    }
  
    private estimateSOLPriceFromActivity(metrics: {activityScore: number}): number {
      const basePrice = 100;
      const activityMultiplier = 1 + (metrics.activityScore - 50) / 200;
      
      return Math.max(50, Math.min(300, basePrice * activityMultiplier));
    }
  
    private getDEXName(programId: string): string {
      const dexMap: Record<string, string> = {
        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium',
        'whirLb6rbeCMEbVPvDcZhY4bgCkhSoJtvb9ahGR8hj': 'Orca',
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter'
      };
      return dexMap[programId] || 'Unknown';
    }

    private async analyzeMemeMarketHealth(): Promise<any> {
      try {
        // METHOD 1: Analyze recent meme coin performance using external APIs
        const memeHealthFromApis = await this.fetchMemeMarketFromAPIs();
        
        if (memeHealthFromApis.health > 0) {
          return memeHealthFromApis;
        }
        
        // METHOD 2: Analyze meme market from on-chain activity
        return await this.estimateMemeHealthFromOnChain();
        
      } catch (error) {
        return { health: 0.5, tokensAnalyzed: 0 };
      }
    }
  
    private async fetchMemeMarketFromAPIs(): Promise<any> {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const dexResponse = await fetch(
          'https://api.dexscreener.com/latest/dex/search/?q=SOL',
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (dexResponse.ok) {
          const dexData = await dexResponse.json();
          const pairs = dexData.pairs || [];
          
          const memeCoins = pairs
            .filter((pair: any) => {
              const marketCap = parseFloat(pair.fdv || 0);
              const volume24h = parseFloat(pair.volume?.h24 || 0);
              return marketCap > 100000 && marketCap < 100000000 && volume24h > 10000;
            })
            .slice(0, 25);
          
          if (memeCoins.length === 0) {
            return { health: 0.4, tokensAnalyzed: 0 };
          }
          
          // Enhanced health calculation
          let totalPerformance = 0;
          let positiveTokens = 0;
          let highVolumeTokens = 0;
          let sustainedGrowthTokens = 0;
          
          memeCoins.forEach((pair: any) => {
            const change24h = parseFloat(pair.priceChange?.h24 || 0);
            const change6h = parseFloat(pair.priceChange?.h6 || 0);
            const volume24h = parseFloat(pair.volume?.h24 || 0);
            
            totalPerformance += change24h;
            if (change24h > 0) positiveTokens++;
            if (volume24h > 50000) highVolumeTokens++;
            if (change6h > 0 && change24h > 0) sustainedGrowthTokens++;
          });
          
          const avgPerformance = totalPerformance / memeCoins.length;
          const positiveRatio = positiveTokens / memeCoins.length;
          const highVolumeRatio = highVolumeTokens / memeCoins.length;
          const sustainedGrowthRatio = sustainedGrowthTokens / memeCoins.length;
          
          // Advanced health scoring
          let health = 0.5;
          
          if (avgPerformance > 15) health += 0.20;
          else if (avgPerformance > 5) health += 0.15;
          else if (avgPerformance > 0) health += 0.10;
          else if (avgPerformance < -25) health -= 0.25;
          
          if (positiveRatio > 0.75) health += 0.20;
          else if (positiveRatio > 0.6) health += 0.15;
          else if (positiveRatio > 0.5) health += 0.10;
          else if (positiveRatio < 0.3) health -= 0.20;
          
          if (highVolumeRatio > 0.6) health += 0.15;
          else if (highVolumeRatio > 0.4) health += 0.10;
          else if (highVolumeRatio < 0.2) health -= 0.10;
          
          if (sustainedGrowthRatio > 0.5) health += 0.15;
          else if (sustainedGrowthRatio > 0.3) health += 0.10;
          
          health = Math.max(0.1, Math.min(1, health));
          
          return { health, tokensAnalyzed: memeCoins.length };
        }
      } catch (apiError) {
        // Continue to fallback
      }
      
      return { health: 0, tokensAnalyzed: 0 };
    }
  
    private async estimateMemeHealthFromOnChain(): Promise<any> {
      try {
        const rpcManager = (await import('../services/rpc-connection-manager')).default;
        
        const [raydiumPools, orcaPools] = await Promise.all([
          rpcManager.getProgramAccounts('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', [
            { dataSize: 752 }
          ]).catch(() => []),
          rpcManager.getProgramAccounts('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', [
            { dataSize: 653 }
          ]).catch(() => [])
        ]);
        
        const allPools = [...raydiumPools.slice(0, 25), ...orcaPools.slice(0, 25)];
        
        if (allPools.length === 0) {
          return { health: 0.3, tokensAnalyzed: 0 };
        }
        
        let healthyPools = 0;
        let activeTokens = 0;
        
        const poolPromises = allPools.slice(0, 20).map(async (pool: any) => {
          try {
            const poolInfo = pool.account?.data?.parsed?.info;
            if (!poolInfo) return null;
            
            const valueA = parseFloat(poolInfo.tokenAmountA?.amount || 0);
            const valueB = parseFloat(poolInfo.tokenAmountB?.amount || 0);
            const mintA = poolInfo.tokenMintA;
            const mintB = poolInfo.tokenMintB;
            
            if (valueA > 0 && valueB > 0 && (mintA || mintB)) {
              const signatures = await rpcManager.getSignaturesForAddress(pool.pubkey, 50).catch(() => []);
              
              const recent24h = signatures.filter((sig: any) => {
                const sigTime = sig.blockTime || 0;
                const hours24Ago = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
                return sigTime >= hours24Ago;
              });
              
              return {
                healthy: true,
                recentActivity: recent24h.length,
                hasActivity: recent24h.length > 0
              };
            }
            
            return null;
          } catch (poolError) {
            return null;
          }
        });
        
        const poolAnalyses = await Promise.allSettled(poolPromises);
        
        poolAnalyses.forEach((result: any) => {
          if (result.status === 'fulfilled' && result.value) {
            const analysis = result.value;
            healthyPools++;
            if (analysis.hasActivity) activeTokens++;
          }
        });
        
        // Calculate comprehensive health score
        const poolHealthRatio = allPools.length > 0 ? healthyPools / Math.min(20, allPools.length) : 0;
        const activityRatio = healthyPools > 0 ? activeTokens / healthyPools : 0;
        
        const health = Math.max(0.2, Math.min(0.8, 
          (poolHealthRatio * 0.6) + (activityRatio * 0.4) + 0.1
        ));
        
        return { health, tokensAnalyzed: healthyPools };
        
      } catch (error) {
        return { health: 0.4, tokensAnalyzed: 0 };
      }
    }
  }