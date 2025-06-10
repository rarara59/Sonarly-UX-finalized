// src/types/token-types.ts

export interface TokenMetadata {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    projectUrl?: string;
    description?: string;
    iconUrl?: string;
    network: string;
  }
  
  export interface TokenVolumeData {
    address: string;
    network: string;
    volume24h: number;
    volume7d: number;
    volume30d: number;
  }
  
  export interface CandleData {
    timestamp: number; // Unix timestamp
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }
  
  export interface TokenMarketData {
    address: string;
    network: string;
    marketCap: number;
    price: number;
    volume24h: number;
    liquidityUSD: number;
    holders: number;
    updatedAt: Date;
  }
  
  export interface LiquidityDistribution {
    range: string;
    liquidityUSD: number;
  }
  
  export interface TokenSwapRoute {
    fromToken: string;
    toToken: string;
    path: string[];
    expectedOutput: number;
  }