// src/types/market.ts

export interface PriceData {
    price: number;
    liquidity: number;
    volume?: number;
  }
  
  export interface HistoricalPrice {
    timestamp: number;
    price: number;
    volume: number;
    liquidity: number;
  }
  
  export interface TokenInfo extends PriceData {
    address: string;
    priceChange1h: number;
    priceChange4h: number;
    priceChange24h: number;
    volatility: number;
    lastUpdate: number;
  }