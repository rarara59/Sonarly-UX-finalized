// src/services/jupiter-monitor.ts

import axios from 'axios';
import { PriceData, TokenInfo, HistoricalPrice } from '../types/market';

interface JupiterConfig {
  rpcEndpoint: string;
}

export class JupiterMonitor {
  private readonly jupiterApiUrl = 'https://quote-api.jup.ag/v6';
  private priceHistory: Map<string, HistoricalPrice[]>;
  private lastUpdate: Map<string, number>;
  
  constructor(config: JupiterConfig) {
    this.priceHistory = new Map();
    this.lastUpdate = new Map();
  }

  async trackToken(tokenAddress: string, interval: number = 5 * 60 * 1000) { // 5 minutes default
    if (!this.priceHistory.has(tokenAddress)) {
      this.priceHistory.set(tokenAddress, []);
    }

    // Start tracking
    setInterval(async () => {
      try {
        const priceData = await this.getPriceData(tokenAddress);
        this.updatePriceHistory(tokenAddress, priceData);
      } catch (error) {
        console.error(`Error tracking token ${tokenAddress}:`, error);
      }
    }, interval);
  }

  private updatePriceHistory(tokenAddress: string, priceData: PriceData) {
    const history = this.priceHistory.get(tokenAddress) || [];
    const timestamp = Date.now();

    history.push({
      timestamp,
      price: priceData.price,
      volume: priceData.volume || 0,
      liquidity: priceData.liquidity || 0
    });

    // Keep last 48 hours of data (assuming 5-minute intervals)
    const fortyEightHoursAgo = timestamp - (48 * 60 * 60 * 1000);
    const filteredHistory = history.filter(h => h.timestamp > fortyEightHoursAgo);
    
    this.priceHistory.set(tokenAddress, filteredHistory);
    this.lastUpdate.set(tokenAddress, timestamp);
  }

  async getPriceData(tokenAddress: string): Promise<PriceData> {
    try {
      const quoteToken = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
      
      const response = await axios.get(`${this.jupiterApiUrl}/quote`, {
        params: {
          inputMint: tokenAddress,
          outputMint: quoteToken,
          amount: '1000000', // 1 USDC
          slippageBps: 50
        }
      });

      const price = response.data.inAmount / response.data.outAmount;
      const liquidity = response.data.otherAmountThreshold || 0;

      return {
        price,
        liquidity,
        volume: response.data.marketInfos?.[0]?.volume24h || 0
      };
    } catch (error) {
      console.error('Error getting price data:', error);
      throw error;
    }
  }

  getHistoricalPrices(tokenAddress: string, timeframe: '1h' | '4h' | '24h' | '48h'): HistoricalPrice[] {
    const history = this.priceHistory.get(tokenAddress) || [];
    const now = Date.now();
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '48h': 48 * 60 * 60 * 1000
    };

    return history.filter(h => h.timestamp > now - timeframes[timeframe]);
  }

  calculatePriceChange(tokenAddress: string, timeframe: '1h' | '4h' | '24h' | '48h'): number {
    const history = this.getHistoricalPrices(tokenAddress, timeframe);
    if (history.length < 2) return 0;

    const oldest = history[0].price;
    const newest = history[history.length - 1].price;
    return ((newest - oldest) / oldest) * 100;
  }

  calculateVolatility(tokenAddress: string, timeframe: '1h' | '4h' | '24h' | '48h'): number {
    const prices = this.getHistoricalPrices(tokenAddress, timeframe).map(h => h.price);
    if (prices.length < 2) return 0;

    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(12 * 24); // Annualized volatility
  }
}

export const createJupiterMonitor = (config: JupiterConfig) => {
  return new JupiterMonitor(config);
};