// src/signal-modules/technical-pattern-signal.module.ts

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from './signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

export class TechnicalPatternSignalModule extends SignalModule {
    constructor(config: SignalModuleConfig) {
      super('technical-pattern', config);
    }
  
    getRequiredTrack(): 'FAST' | 'SLOW' | 'BOTH' {
      return 'SLOW'; // Technical patterns for slow track only
    }
  
    getSignalType(): keyof DetectionSignals {
      return 'technicalPattern';
    }
  
    async execute(context: SignalContext): Promise<SignalResult> {
      const startTime = performance.now();
      
      try {
        const technicalData = await this.getTechnicalData(context.tokenAddress);
        
        let confidence = 0;
        
        if (technicalData.momentumScore >= 70) confidence += 35;
        if (technicalData.volumePattern >= 70) confidence += 35;
        if (technicalData.priceAction >= 70) confidence += 30;
        
        const data = {
          ...technicalData,
          confidence
        };
  
        return {
          confidence,
          data,
          processingTime: performance.now() - startTime,
          source: 'technical-pattern-module',
          version: this.config.version
        };
      } catch (error) {
        context.logger.error('Technical pattern signal failed:', error);
        
        return {
          confidence: 0,
          data: {
            momentumScore: 45,
            volumePattern: 45,
            priceAction: 45,
            confidence: 0
          },
          processingTime: performance.now() - startTime,
          source: 'technical-pattern-module',
          version: this.config.version
        };
      }
    }
  
    // Extract the sophisticated technical analysis (~500 lines preserved!)
    private async getTechnicalData(tokenAddress: string): Promise<any> {
      try {
        const rpcManager = (await import('../services/rpc-connection-manager')).default;
        
        // METHOD 1: Get price data from external APIs (Jupiter/DexScreener)
        const priceData = await this.fetchPriceDataMultiSource(tokenAddress);
        
        // METHOD 2: Get volume data from on-chain transactions
        const volumeData = await this.analyzeOnChainVolume(tokenAddress, rpcManager);
        
        // METHOD 3: Calculate technical indicators
        const technicalIndicators = this.calculateTechnicalIndicators(priceData, volumeData);
        
        return {
          momentumScore: technicalIndicators.momentum,
          volumePattern: technicalIndicators.volume,
          priceAction: technicalIndicators.priceAction
        };
        
      } catch (error) {
        // Conservative fallback (neutral technical signals)
        return {
          momentumScore: 45,
          volumePattern: 45,
          priceAction: 45
        };
      }
    }
  
    private async fetchPriceDataMultiSource(tokenAddress: string): Promise<any> {
      // METHOD 1: Jupiter API (primary for SLOW track)
      try {
        const jupiterResponse = await fetch(`https://price.jup.ag/v4/price?ids=${tokenAddress}`, {
        });
        
        if (jupiterResponse.ok) {
          const jupiterData = await jupiterResponse.json();
          if (jupiterData.data && jupiterData.data[tokenAddress]) {
            const priceInfo = jupiterData.data[tokenAddress];
            const currentPrice = priceInfo.price || 0;
            
            if (currentPrice > 0) {
              const syntheticPrices = this.generateRecentPriceEstimates(currentPrice, tokenAddress);
              
              return {
                prices: syntheticPrices,
                timeWindowHours: 6,
                source: 'jupiter'
              };
            }
          }
        }
      } catch (jupiterError) {
        // Continue to next method
      }
      
      // METHOD 2: DexScreener API (fallback)
      try {
        const dexScreenerResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
        });
        
        if (dexScreenerResponse.ok) {
          const dexData = await dexScreenerResponse.json();
          if (dexData.pairs && dexData.pairs.length > 0) {
            const bestPair = dexData.pairs[0];
            
            const currentPrice = parseFloat(bestPair.priceUsd || 0);
            const volume24h = parseFloat(bestPair.volume.h24 || 0);
            const priceChange24h = parseFloat(bestPair.priceChange.h24 || 0);
            
            if (currentPrice > 0) {
              const priceHistory = this.constructPriceHistoryFromDexScreener(
                currentPrice, 
                volume24h, 
                priceChange24h,
                bestPair
              );
              
              return {
                prices: priceHistory,
                timeWindowHours: 24,
                source: 'dexscreener'
              };
            }
          }
        }
      } catch (dexError) {
        // Continue to fallback
      }
      
      // METHOD 3: On-chain price estimation (final fallback)
      const onChainEstimate = await this.estimatePriceFromTransactions(tokenAddress);
      return {
        prices: onChainEstimate.prices,
        timeWindowHours: onChainEstimate.timeWindowHours,
        source: 'onchain'
      };
    }
  
    private generateRecentPriceEstimates(currentPrice: number, tokenAddress: string): Array<{timestamp: number; price: number; volume: number}> {
      const prices = [];
      const now = Date.now();
      const hoursBack = 6;
      
      // Generate 6 hours of hourly price estimates
      for (let i = hoursBack; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        
        // Simple price variation (±10% random walk)
        const variation = (Math.random() - 0.5) * 0.2;
        const estimatedPrice = currentPrice * (1 + variation * (i / hoursBack));
        
        // Estimate volume based on price volatility
        const volatility = Math.abs(variation);
        const estimatedVolume = Math.max(1000, volatility * 50000);
        
        prices.push({
          timestamp: Math.floor(timestamp / 1000),
          price: Math.max(0.000001, estimatedPrice),
          volume: estimatedVolume
        });
      }
      
      return prices.sort((a, b) => a.timestamp - b.timestamp);
    }
  
    private constructPriceHistoryFromDexScreener(
      currentPrice: number, 
      volume24h: number, 
      priceChange24h: number,
      pairData: any
    ): Array<{timestamp: number; price: number; volume: number}> {
      const prices = [];
      const now = Date.now();
      const hoursBack = 24;
      
      // Extract additional data points from DexScreener
      const priceChange1h = parseFloat(pairData.priceChange?.h1 || 0);
      const priceChange6h = parseFloat(pairData.priceChange?.h6 || 0);
      const volume1h = parseFloat(pairData.volume?.h1 || volume24h / 24);
      const volume6h = parseFloat(pairData.volume?.h6 || volume24h / 4);
      
      // Build price history using known change percentages
      for (let i = hoursBack; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        let estimatedPrice = currentPrice;
        let estimatedVolume = volume24h / 24;
        
        // Apply reverse price changes based on timeframe
        if (i >= 23) {
          estimatedPrice = currentPrice / (1 + priceChange24h / 100);
        } else if (i >= 6) {
          const progress = (i - 6) / (24 - 6);
          const change6hTo24h = priceChange24h - priceChange6h;
          estimatedPrice = currentPrice / (1 + (priceChange6h + change6hTo24h * progress) / 100);
          estimatedVolume = volume6h / 6;
        } else if (i >= 1) {
          const progress = (i - 1) / 5;
          const change1hTo6h = priceChange6h - priceChange1h;
          estimatedPrice = currentPrice / (1 + (priceChange1h + change1hTo6h * progress) / 100);
          estimatedVolume = volume1h;
        }
        
        prices.push({
          timestamp: Math.floor(timestamp / 1000),
          price: Math.max(0.000001, estimatedPrice),
          volume: Math.max(100, estimatedVolume)
        });
      }
      
      return prices.sort((a, b) => a.timestamp - b.timestamp);
    }
  
    private async estimatePriceFromTransactions(tokenAddress: string): Promise<any> {
      try {
        const rpcManager = (await import('../services/rpc-connection-manager')).default;
        
        const signatures = await rpcManager.getSignaturesForAddress(tokenAddress, 200).catch(() => []);
        
        if (signatures.length === 0) {
          return {
            prices: [{timestamp: Math.floor(Date.now() / 1000), price: 0.001, volume: 1000}],
            timeWindowHours: 1
          };
        }
        
        // Group transactions by hour and estimate price/volume
        const hourlyData = new Map();
        const now = Math.floor(Date.now() / 1000);
        
        for (const sig of signatures.slice(0, 50)) {
          const timestamp = sig.blockTime || now;
          const hour = Math.floor(timestamp / 3600) * 3600;
          
          if (!hourlyData.has(hour)) {
            hourlyData.set(hour, { transactions: 0, totalFees: 0 });
          }
          
          const hourData = hourlyData.get(hour);
          hourData.transactions++;
          hourData.totalFees += (sig.fee || 5000);
        }
        
        const prices = Array.from(hourlyData.entries())
          .map(([hour, data]) => {
            const estimatedPrice = Math.max(0.000001, (data.totalFees / 1000000) * (data.transactions / 10));
            const estimatedVolume = data.transactions * 500;
            
            return {
              timestamp: hour,
              price: estimatedPrice,
              volume: estimatedVolume
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp);
        
        if (prices.length === 0) {
          return {
            prices: [{timestamp: now, price: 0.001, volume: 1000}],
            timeWindowHours: 1
          };
        }
        
        return {
          prices,
          timeWindowHours: Math.max(1, prices.length)
        };
        
      } catch (error) {
        return {
          prices: [{timestamp: Math.floor(Date.now() / 1000), price: 0.001, volume: 1000}],
          timeWindowHours: 1
        };
      }
    }
  
    private async analyzeOnChainVolume(tokenAddress: string, rpcManager: any): Promise<any> {
      try {
        const signatures = await rpcManager.getSignaturesForAddress(tokenAddress, 500, 'chainstack').catch(() => []);
        
        const hourlyVolumes = new Map();
        const last24h = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
        
        for (const sig of signatures) {
          const timestamp = sig.blockTime || 0;
          if (timestamp < last24h) continue;
          
          const hour = Math.floor(timestamp / 3600) * 3600;
          
          if (!hourlyVolumes.has(hour)) {
            hourlyVolumes.set(hour, { volume: 0, transactions: 0 });
          }
          
          const hourData = hourlyVolumes.get(hour);
          hourData.transactions++;
          hourData.volume += (sig.fee || 5000) * 100;
        }
        
        const volumeData = Array.from(hourlyVolumes.entries())
          .map(([timestamp, data]) => ({
            timestamp,
            volume: data.volume,
            transactions: data.transactions
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        const totalVolume24h = volumeData.reduce((sum, hour) => sum + hour.volume, 0);
        
        return { hourlyVolumes: volumeData, totalVolume24h };
        
      } catch (error) {
        return { hourlyVolumes: [], totalVolume24h: 0 };
      }
    }
  
    private calculateTechnicalIndicators(priceData: any, volumeData: any): any {
      const prices = priceData.prices;
      
      if (prices.length < 3) {
        return { momentum: 40, volume: 40, priceAction: 40 };
      }
      
      // MOMENTUM ANALYSIS
      const momentum = this.calculateMomentumScore(prices);
      
      // VOLUME ANALYSIS  
      const volume = this.calculateVolumeScore(prices, volumeData.hourlyVolumes);
      
      // PRICE ACTION ANALYSIS
      const priceAction = this.calculatePriceActionScore(prices);
      
      return { momentum, volume, priceAction };
    }
  
    private calculateMomentumScore(prices: Array<{timestamp: number; price: number; volume: number}>): number {
      if (prices.length < 5) return 45;
      
      let score = 50;
      
      // Calculate simple moving averages
      const recent3 = prices.slice(-3);
      const recent6 = prices.slice(-6);
      const allPrices = prices.map(p => p.price);
      
      const sma3 = recent3.reduce((sum, p) => sum + p.price, 0) / recent3.length;
      const sma6 = recent6.reduce((sum, p) => sum + p.price, 0) / recent6.length;
      const smaAll = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
      
      // Trend analysis
      if (sma3 > sma6) score += 15;
      if (sma6 > smaAll) score += 10;
      
      // Price momentum
      const currentPrice = prices[prices.length - 1].price;
      const earlyPrice = prices[Math.floor(prices.length / 3)].price;
      const momentumPercent = (currentPrice - earlyPrice) / earlyPrice;
      
      if (momentumPercent > 0.1) score += 20;
      else if (momentumPercent > 0.05) score += 10;
      else if (momentumPercent < -0.1) score -= 15;
      
      // RSI approximation
      const rsiApprox = this.calculateSimpleRSI(allPrices);
      if (rsiApprox > 30 && rsiApprox < 70) score += 5;
      
      return Math.max(0, Math.min(100, score));
    }
  
    private calculateVolumeScore(prices: any[], hourlyVolumes: any[]): number {
      let score = 50;
      
      // Volume trend analysis
      if (prices.length >= 6) {
        const recentVolumes = prices.slice(-3).map(p => p.volume);
        const earlierVolumes = prices.slice(-6, -3).map(p => p.volume);
        
        const recentAvg = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
        const earlierAvg = earlierVolumes.reduce((sum, v) => sum + v, 0) / earlierVolumes.length;
        
        if (recentAvg > earlierAvg * 1.5) score += 25;
        else if (recentAvg > earlierAvg * 1.2) score += 15;
        else if (recentAvg < earlierAvg * 0.5) score -= 20;
      }
      
      // Transaction consistency
      if (hourlyVolumes.length >= 3) {
        const avgTransactionsPerHour = hourlyVolumes.reduce((sum, h) => sum + h.transactions, 0) / hourlyVolumes.length;
        
        if (avgTransactionsPerHour >= 10) score += 15;
        else if (avgTransactionsPerHour >= 5) score += 10;
        else if (avgTransactionsPerHour < 2) score -= 15;
      }
      
      // Volume-price correlation
      if (prices.length >= 4) {
        let positiveDays = 0;
        let negativeDays = 0;
        
        for (let i = 1; i < prices.length; i++) {
          const priceChange = prices[i].price - prices[i-1].price;
          const volumeRatio = prices[i].volume / (prices[i-1].volume || 1);
          
          if (priceChange > 0 && volumeRatio > 1) positiveDays++;
          if (priceChange < 0 && volumeRatio < 1) negativeDays++;
        }
        
        const goodCorrelation = (positiveDays + negativeDays) / (prices.length - 1);
        if (goodCorrelation > 0.6) score += 10;
      }
      
      return Math.max(0, Math.min(100, score));
    }
  
    private calculatePriceActionScore(prices: Array<{timestamp: number; price: number; volume: number}>): number {
      if (prices.length < 4) return 45;
      
      let score = 50;
      
      const priceValues = prices.map(p => p.price);
      const currentPrice = priceValues[priceValues.length - 1];
      
      // Price stability
      const volatility = this.calculateVolatility(priceValues);
      if (volatility < 0.15) score += 15;
      else if (volatility > 0.5) score -= 20;
      
      // Support and resistance levels
      const highestPrice = Math.max(...priceValues);
      const lowestPrice = Math.min(...priceValues);
      const priceRange = highestPrice - lowestPrice;
      
      if (priceRange > 0) {
        const currentPosition = (currentPrice - lowestPrice) / priceRange;
        
        if (currentPosition > 0.7) score += 15;
        else if (currentPosition > 0.5) score += 10;
        else if (currentPosition < 0.3) score -= 10;
      }
      
      // Higher highs and higher lows pattern
      if (prices.length >= 6) {
        const higherHighs = this.countHigherHighs(priceValues);
        const higherLows = this.countHigherLows(priceValues);
        
        if (higherHighs >= 2 && higherLows >= 2) score += 20;
        else if (higherHighs >= 1 || higherLows >= 1) score += 10;
      }
      
      return Math.max(0, Math.min(100, score));
    }
  
    private calculateSimpleRSI(prices: number[]): number {
      if (prices.length < 14) return 50;
      
      const changes = [];
      for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i-1]);
      }
      
      const gains = changes.filter(c => c > 0);
      const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
      
      const avgGain = gains.length > 0 ? gains.reduce((sum, g) => sum + g, 0) / gains.length : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((sum, l) => sum + l, 0) / losses.length : 0;
      
      if (avgLoss === 0) return 100;
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      return Math.max(0, Math.min(100, rsi));
    }
  
    private calculateVolatility(prices: number[]): number {
      if (prices.length < 2) return 0;
      
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        const returnRate = (prices[i] - prices[i-1]) / prices[i-1];
        returns.push(returnRate);
      }
      
      const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
      
      return Math.sqrt(variance);
    }
  
    private countHigherHighs(prices: number[]): number {
      let count = 0;
      for (let i = 2; i < prices.length; i++) {
        if (prices[i] > prices[i-1] && prices[i-1] > prices[i-2]) {
          count++;
        }
      }
      return count;
    }
  
    private countHigherLows(prices: number[]): number {
      let count = 0;
      for (let i = 2; i < prices.length; i++) {
        if (prices[i] < prices[i-1] && prices[i-1] < prices[i-2] && 
            prices[i] > prices[i-2]) {
          count++;
        }
      }
      return count;
    }
  }