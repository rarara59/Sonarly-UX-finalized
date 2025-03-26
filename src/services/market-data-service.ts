// src/services/market-data-service.ts
import axios from 'axios';
import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import NodeCache from 'node-cache';
import { config } from '../config'; // Fixed import to use named export
import rpcConnectionManager from './rpc-connection-manager';
import { PublicKey } from '@solana/web3.js';

// Types and interfaces
export interface TokenPrice {
  price: number;
  priceChange24h: number;
  priceChange1h?: number;
  timestamp: Date;
}

export interface TokenLiquidity {
  token0Reserve: number; // e.g., WSOL
  token1Reserve: number; // The target token
  totalLiquidityUSD: number;
  pairAddress: string;
  exchange: string;
  timestamp: Date;
}

export interface TokenVolumeData {
  volume24h: number;
  volume7d: number;
  volumeChange24h: number;
  transactions24h: number;
  buys24h: number;
  sells24h: number;
  timestamp: Date;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  network: string;
  createdAt: Date;
  totalSupply: string;
  circulatingSupply?: string;
  logoURL?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  description?: string;
  tags?: string[];
}

export interface LiquidityDistribution {
  exchange: string;
  percentage: number;
  liquidityUSD: number;
  pairAddress: string;
}

export interface TokenSwapRoute {
  fromToken: string;
  toToken: string;
  exchanges: string[];
  estimatedOutput: number;
  priceImpact: number;
  path: string[];
}

export interface TokenMarketData {
  tokenAddress: string; // Fixed: changed from token: TokenMetadata
  metadata: TokenMetadata; // New field to hold the token metadata
  price: TokenPrice;
  liquidity: TokenLiquidity[];
  volume: TokenVolumeData;
  liquidityDistribution: LiquidityDistribution[];
  topHolders?: { address: string; percentage: number }[];
  manipulationScore?: number;
  volatilityScore?: number;
}

export interface CandleData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketHistory {
  tokenAddress: string; // Fixed: Changed from token: string
  network: string;
  timeframe: string;
  candles: CandleData[];
  lastUpdated: Date;
}

// Schema definitions
const tokenMetadataSchema = new Schema<TokenMetadata>({
  address: { type: String, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  decimals: { type: Number, required: true },
  network: { type: String, required: true, index: true },
  createdAt: { type: Date, required: true },
  totalSupply: { type: String, required: true },
  circulatingSupply: { type: String },
  logoURL: { type: String },
  website: { type: String },
  twitter: { type: String },
  telegram: { type: String },
  discord: { type: String },
  description: { type: String },
  tags: [{ type: String, index: true }]
}, { timestamps: true });

const tokenPriceSchema = new Schema<TokenPrice & Document>({
  tokenAddress: { type: String, required: true, index: true },
  network: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  priceChange24h: { type: Number, required: true },
  priceChange1h: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

const marketHistorySchema = new Schema<MarketHistory & Document>({
  tokenAddress: { type: String, required: true, index: true },
  network: { type: String, required: true, index: true },
  timeframe: { type: String, required: true, index: true }, // e.g., '1m', '5m', '15m', '1h', '4h', '1d'
  candles: [{
    timestamp: { type: Date, required: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true }
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Models
const TokenMetadata: Model<TokenMetadata> = mongoose.models.TokenMetadata as Model<TokenMetadata> || 
  mongoose.model<TokenMetadata>('TokenMetadata', tokenMetadataSchema);

const TokenPrice: Model<TokenPrice & Document> = mongoose.models.TokenPrice as Model<TokenPrice & Document> || 
  mongoose.model<TokenPrice & Document>('TokenPrice', tokenPriceSchema);

const MarketHistory: Model<MarketHistory & Document> = mongoose.models.MarketHistory as Model<MarketHistory & Document> || 
  mongoose.model<MarketHistory & Document>('MarketHistory', marketHistorySchema);

class MarketDataService {
  private logger: winston.Logger;
  private cache: NodeCache;
  private dexApis: Map<string, any>;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'market-data-service' },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
    
    // Initialize cache with 5 minute TTL by default
    this.cache = new NodeCache({ stdTTL: 300 });
    
    // Initialize DEX API connections
    this.dexApis = new Map();
    this.initializeDexApis();
  }
  
  private initializeDexApis() {
    // DEX Screener API
    this.dexApis.set('dexscreener', {
      baseUrl: 'https://api.dexscreener.com/latest',
      apiKey: '',
      rateLimit: 300 // 5 requests per minute
    });
    
    // Jupiter API (for Solana routing)
    this.dexApis.set('jupiter', {
      baseUrl: 'https://quote-api.jup.ag/v6',
      apiKey: '',
      rateLimit: 600 // 10 requests per minute
    });

    // Birdeye API (for Solana data)
    this.dexApis.set('birdeye', {
      baseUrl: 'https://public-api.birdeye.so',
      apiKey: config.birdeye?.apiKey || '',
      rateLimit: 600 // 10 requests per minute
    });
  }
  
  /**
   * Get token metadata from multiple sources
   */
  async getTokenMetadata(address: string, network: string): Promise<TokenMetadata | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      const cacheKey = `token-metadata-${network}-${address}`;
      
      // Check cache first
      const cachedData = this.cache.get<TokenMetadata>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Check database
      let tokenMetadata = await TokenMetadata.findOne({ address, network });
      
      if (!tokenMetadata) {
        // Fetch from APIs if not in database
        const metadata = await this.fetchTokenMetadata(address, network);
        
        if (metadata) {
          // Save to database
          tokenMetadata = new TokenMetadata(metadata);
          await tokenMetadata.save();
        } else {
          return null;
        }
      }
      
      // Cache result
      this.cache.set(cacheKey, tokenMetadata.toObject());
      
      return tokenMetadata.toObject();
    } catch (error) {
      this.logger.error(`Error fetching token metadata for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch token metadata from blockchain and APIs
   */
  private async fetchTokenMetadata(address: string, network: string): Promise<TokenMetadata | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      // First try to get token metadata directly from RPC Connection Manager
      try {
        // Get token account info using RPC manager
        const accountInfo = await rpcConnectionManager.getAccountInfo(address);
        
        if (accountInfo && accountInfo.data && accountInfo.data.parsed) {
          const parsedData = accountInfo.data.parsed.info;
          
          // Get token supply
          const tokenSupply = await rpcConnectionManager.getTokenSupply(address);
          
          const solanaTokenData = {
            address,
            network,
            name: parsedData.name || 'Unknown Token',
            symbol: parsedData.symbol || 'UNKNOWN',
            decimals: parsedData.decimals || 0,
            totalSupply: tokenSupply ? tokenSupply.toString() : '0',
            createdAt: new Date() // RPC doesn't provide creation date easily
          };

          // Try to enrich with API data
          const apiData = await this.fetchSolanaTokenApiData(address);
          if (apiData) {
            return {
              ...solanaTokenData,
              ...apiData
            };
          }
          
          return solanaTokenData;
        }
      } catch (error) {
        this.logger.debug(`Error fetching Solana token data from RPC for ${address}:`, error);
        // Fall back to Jupiter API
      }
      
      // Fall back to Jupiter API if RPC method failed
      return this.fetchSolanaTokenApiData(address);
    } catch (error) {
      this.logger.error(`Error fetching token metadata for ${address} on ${network}:`, error);
      return null;
    }
  }

  /**
   * Fetch Solana token data from APIs
   */
  private async fetchSolanaTokenApiData(address: string): Promise<TokenMetadata | null> {
    try {
      // Try Jupiter API first
      const jupiterApi = this.dexApis.get('jupiter');
      try {
        const response = await axios.get(`${jupiterApi.baseUrl}/tokens/${address}`);
        
        if (response.data && response.data.data) {
          const tokenData = response.data.data;
          return {
            address,
            network: 'solana',
            name: tokenData.name,
            symbol: tokenData.symbol,
            decimals: tokenData.decimals,
            totalSupply: tokenData.supply?.toString() || '0',
            logoURL: tokenData.logoURI,
            createdAt: new Date() // Jupiter doesn't provide creation date
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to get token data from Jupiter for ${address}:`, error);
      }
      
      // Try Birdeye API
      const birdeyeApi = this.dexApis.get('birdeye');
      try {
        const response = await axios.get(`${birdeyeApi.baseUrl}/public/token_info?address=${address}&chain=solana`, {
          headers: {
            'X-API-KEY': birdeyeApi.apiKey
          }
        });
        
        if (response.data && response.data.data && response.data.data.token) {
          const tokenData = response.data.data.token;
          return {
            address,
            network: 'solana',
            name: tokenData.name,
            symbol: tokenData.symbol,
            decimals: tokenData.decimals,
            totalSupply: tokenData.totalSupply?.toString() || '0',
            logoURL: tokenData.logoURI,
            website: tokenData.website,
            twitter: tokenData.twitter,
            telegram: tokenData.telegram,
            createdAt: new Date(tokenData.createdAt * 1000) || new Date()
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to get token data from Birdeye for ${address}:`, error);
      }
      
      // Try DexScreener API
      const dexscreenerApi = this.dexApis.get('dexscreener');
      try {
        const response = await axios.get(`${dexscreenerApi.baseUrl}/tokens/${address}`);
        
        if (response.data && response.data.pairs && response.data.pairs.length > 0) {
          const tokenData = response.data.pairs[0].baseToken;
          return {
            address,
            network: 'solana',
            name: tokenData.name,
            symbol: tokenData.symbol,
            decimals: 0, // DexScreener doesn't provide decimals
            totalSupply: '0', // DexScreener doesn't provide supply
            logoURL: tokenData.logoURI,
            createdAt: new Date()
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to get token data from DexScreener for ${address}:`, error);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error fetching Solana token data from APIs for ${address}:`, error);
      return null;
    }
  }
  
  /**
   * Get token accounts by owner
   */
  async getTokenAccountsByOwner(walletAddress: string, network: string): Promise<any[] | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      const cacheKey = `token-accounts-${network}-${walletAddress}`;
      
      // Check cache first
      const cachedData = this.cache.get<any[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Use RPC Connection Manager to get token accounts
      const tokenAccounts = await rpcConnectionManager.getTokenAccountsByOwner(walletAddress);
      
      if (tokenAccounts) {
        // Cache the result (short TTL for account data)
        this.cache.set(cacheKey, tokenAccounts, 60 * 2); // 2 minute TTL
        return tokenAccounts;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting token accounts for ${walletAddress} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Get current token price and 24h change
   */
  async getTokenPrice(address: string, network: string): Promise<TokenPrice | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      const cacheKey = `token-price-${network}-${address}`;
      
      // Check cache first (shorter TTL for prices)
      const cachedData = this.cache.get<TokenPrice>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Try to get from database first (recent price)
      const recentPrice = await TokenPrice.findOne({ 
        tokenAddress: address, 
        network,
        timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // last 5 minutes
      }).sort({ timestamp: -1 });
      
      if (recentPrice) {
        const priceData = {
          price: recentPrice.price,
          priceChange24h: recentPrice.priceChange24h,
          priceChange1h: recentPrice.priceChange1h,
          timestamp: recentPrice.timestamp
        };
        
        // Cache with shorter TTL for prices (1 minute)
        this.cache.set(cacheKey, priceData, 60);
        
        return priceData;
      }
      
      // Fetch from APIs if not in database or too old
      const priceData = await this.fetchTokenPrice(address, network);
      
      if (priceData) {
        // Save to database
        const newPrice = new TokenPrice({
          tokenAddress: address,
          network,
          ...priceData
        });
        await newPrice.save();
        
        // Cache with shorter TTL for prices (1 minute)
        this.cache.set(cacheKey, priceData, 60);
        
        return priceData;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting token price for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch token price from APIs for Solana
   */
  private async fetchTokenPrice(address: string, network: string): Promise<TokenPrice | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      // Try Birdeye API first
      const birdeyeApi = this.dexApis.get('birdeye');
      try {
        const response = await axios.get(`${birdeyeApi.baseUrl}/public/price?address=${address}&chain=solana`, {
          headers: {
            'X-API-KEY': birdeyeApi.apiKey
          }
        });
        
        if (response.data && response.data.data && response.data.data.value) {
          const priceData = response.data.data;
          return {
            price: priceData.value,
            priceChange24h: priceData.priceChange24h || 0,
            priceChange1h: priceData.priceChange1h || 0,
            timestamp: new Date()
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to get token price from Birdeye for ${address}:`, error);
      }
      
      // Try Jupiter API
      const jupiterApi = this.dexApis.get('jupiter');
      try {
        // Jupiter doesn't have a direct price API, so use the quote API with a small amount
        // This is a workaround to get the current price
        const WSOL_ADDRESS = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
        const response = await axios.get(`${jupiterApi.baseUrl}/quote`, {
          params: {
            inputMint: WSOL_ADDRESS,
            outputMint: address,
            amount: 1000000000 // 1 SOL in lamports
          }
        });
        
        if (response.data && response.data.data) {
          const quoteData = response.data.data;
          // Calculate price in SOL
          const price = parseInt(quoteData.outAmount) / 1000000000;
          
          return {
            price: price,
            priceChange24h: 0, // Jupiter doesn't provide this
            timestamp: new Date()
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to get token price from Jupiter for ${address}:`, error);
      }
      
      // Try DexScreener API
      const dexscreenerApi = this.dexApis.get('dexscreener');
      try {
        const response = await axios.get(`${dexscreenerApi.baseUrl}/tokens/${address}`);
        
        if (response.data && response.data.pairs && response.data.pairs.length > 0) {
          // Find the pair with highest liquidity
          const sortedPairs = response.data.pairs.sort((a: any, b: any) => 
            parseFloat(b.liquidity?.usd || '0') - parseFloat(a.liquidity?.usd || '0')
          );
          
          const pair = sortedPairs[0];
          return {
            price: parseFloat(pair.priceUsd),
            priceChange24h: parseFloat(pair.priceChange.h24),
            priceChange1h: parseFloat(pair.priceChange.h1),
            timestamp: new Date()
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to get token price from DexScreener for ${address}:`, error);
      }
      
      // Try on-chain DEX pools via RPC manager
      try {
        // This would be an advanced implementation querying Solana DEX pools
        // For now, only relying on APIs for price data
      } catch (error) {
        this.logger.debug(`Failed to calculate on-chain price for ${address}:`, error);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error fetching token price for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Get token volume data
   */
  async getTokenVolume(address: string, network: string): Promise<TokenVolumeData | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      const cacheKey = `token-volume-${network}-${address}`;
      
      // Check cache first
      const cachedData = this.cache.get<TokenVolumeData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch from APIs
      const volumeData = await this.fetchTokenVolume(address, network);
      
      if (volumeData) {
        // Cache result
        this.cache.set(cacheKey, volumeData, 60 * 10); // 10 minute TTL
        return volumeData;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting token volume for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch token volume from APIs
   */
  private async fetchTokenVolume(address: string, network: string): Promise<TokenVolumeData | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Try Birdeye API first
      const birdeyeApi = this.dexApis.get('birdeye');
      try {
        const response = await axios.get(`${birdeyeApi.baseUrl}/public/token_overview`, {
          params: {
            address: address,
            chain: 'solana'
          },
          headers: {
            'X-API-KEY': birdeyeApi.apiKey
          }
        });
        
        if (response.data && response.data.data) {
          const overview = response.data.data;
          const volume = overview.volume || {};
          const txns = overview.txns || {};
          
          return {
            volume24h: volume.h24 || 0,
            volume7d: volume.h7d || 0,
            volumeChange24h: volume.change24h || 0,
            transactions24h: (txns.h24?.buy || 0) + (txns.h24?.sell || 0),
            buys24h: txns.h24?.buy || 0,
            sells24h: txns.h24?.sell || 0,
            timestamp: new Date()
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to get token volume from Birdeye for ${address}:`, error);
      }
      
      // Try DexScreener API
      const dexscreenerApi = this.dexApis.get('dexscreener');
      try {
        const response = await axios.get(`${dexscreenerApi.baseUrl}/tokens/${address}`);
        
        if (response.data && response.data.pairs && response.data.pairs.length > 0) {
          // Aggregate volume data from all pairs
          let volume24h = 0;
          let volume7d = 0;
          let volumeChange24h = 0;
          let transactions24h = 0;
          let buys24h = 0;
          let sells24h = 0;
          
          response.data.pairs.forEach((pair: any) => {
            volume24h += parseFloat(pair.volume?.h24 || '0');
            volume7d += parseFloat(pair.volume?.h7d || '0');
            
            if (pair.txns) {
              buys24h += parseInt(pair.txns.h24?.buys || '0', 10);
              sells24h += parseInt(pair.txns.h24?.sells || '0', 10);
            }
          });
          
          transactions24h = buys24h + sells24h;
          
          // Calculate volume change
          const volumePrev24h = volume7d / 7; // Average daily volume over 7 days
          if (volumePrev24h > 0) {
            volumeChange24h = ((volume24h - volumePrev24h) / volumePrev24h) * 100;
          }
          
          return {
            volume24h,
            volume7d,
            volumeChange24h,
            transactions24h,
            buys24h,
            sells24h,
            timestamp: new Date()
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to get token volume from DexScreener for ${address}:`, error);
      }
      
      // Try on-chain analysis using RPC manager
      try {
        // Get recent transactions to estimate volume
        const signatures = await rpcConnectionManager.getSignaturesForAddress(address, 1000);
        
        if (signatures && signatures.length > 0) {
          // Estimate 24h transaction count
          const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
          const recentTxs = signatures.filter(sig => (sig.blockTime || 0) >= oneDayAgo);
          
          // This is just a rough estimate - real volume calculation would require
          // analyzing each transaction to extract actual amounts
          return {
            volume24h: 0, // Cannot accurately estimate without transaction analysis
            volume7d: 0,
            volumeChange24h: 0,
            transactions24h: recentTxs.length,
            buys24h: Math.floor(recentTxs.length * 0.6), // Rough estimate
            sells24h: Math.floor(recentTxs.length * 0.4), // Rough estimate
            timestamp: new Date()
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to estimate token volume from RPC for ${address}:`, error);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error fetching token volume for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Get historical market data for a token
   */
  async getMarketHistory(address: string, network: string, timeframe: string = '15m', limit: number = 200): Promise<CandleData[] | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      const cacheKey = `market-history-${network}-${address}-${timeframe}-${limit}`;
      
      // Check cache first
      const cachedData = this.cache.get<CandleData[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Check database
      const marketHistory = await MarketHistory.findOne({
        tokenAddress: address,
        network,
        timeframe
      });
      
      let candles: CandleData[] = [];
      
      if (marketHistory && marketHistory.lastUpdated > new Date(Date.now() - 15 * 60 * 1000)) {
        // Use database candles if recently updated (within 15 minutes)
        candles = marketHistory.candles.slice(-limit);
      } else {
        // Fetch from APIs
        candles = await this.fetchMarketHistory(address, network, timeframe, limit);
        
        if (candles && candles.length > 0) {
          // Save to database (upsert)
          await MarketHistory.updateOne(
            { tokenAddress: address, network, timeframe },
            {
              $set: { 
                candles,
                lastUpdated: new Date()
              }
            },
            { upsert: true }
          );
        } else if (marketHistory) {
          // If API fetch failed but we have database candles, use those
          candles = marketHistory.candles.slice(-limit);
        }
      }
      
      if (candles && candles.length > 0) {
        // Cache result
        this.cache.set(cacheKey, candles, 60 * 5); // 5 minute TTL
        return candles;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting market history for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch market history from APIs for Solana
   */
  private async fetchMarketHistory(address: string, network: string, timeframe: string, limit: number): Promise<CandleData[]> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      // Try Birdeye API first
      const birdeyeApi = this.dexApis.get('birdeye');
      try {
        const response = await axios.get(`${birdeyeApi.baseUrl}/public/candles`, {
          params: {
            address: address,
            chain: 'solana',
            type: timeframe,
            limit: limit
          },
          headers: {
            'X-API-KEY': birdeyeApi.apiKey
          }
        });
        
        if (response.data && response.data.data && response.data.data.items) {
          return response.data.data.items.map((item: any) => ({
            timestamp: new Date(item.unixTime * 1000),
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume
          }));
        }
      } catch (error) {
        this.logger.debug(`Failed to get market history from Birdeye for ${address}:`, error);
      }
      
      // Try DexScreener API (limited data)
      const dexscreenerApi = this.dexApis.get('dexscreener');
      try {
        const response = await axios.get(`${dexscreenerApi.baseUrl}/tokens/${address}`);
        
        if (response.data && response.data.pairs && response.data.pairs.length > 0) {
          const pair = response.data.pairs[0]; // Use the most liquid pair
          
          if (pair.priceChart) {
            // Convert price chart to candles format
            // This is an approximation as DexScreener doesn't provide OHLC
            return pair.priceChart.map((item: any) => ({
              timestamp: new Date(item[0]),
              open: item[1],
              high: item[1],
              low: item[1],
              close: item[1],
              volume: 0 // Not available
            }));
          }
        }
      } catch (error) {
        this.logger.debug(`Failed to get market history from DexScreener for ${address}:`, error);
      }
      
      // If API methods fail, try to reconstruct from transactions
      try {
        // Get recent signatures for this token
        const signatures = await rpcConnectionManager.getSignaturesForAddress(address, 100);
        
        if (signatures && signatures.length > 0) {
          // Sort by blockTime
          signatures.sort((a, b) => (a.blockTime || 0) - (b.blockTime || 0));
          
          // Create time buckets based on timeframe
          const timeframeMinutes = this.parseTimeframeMinutes(timeframe);
          if (!timeframeMinutes) return [];
          
          const buckets: Record<string, number[]> = {};
          const now = Math.floor(Date.now() / 1000);
          
          // Initialize buckets
          for (let i = 0; i < limit; i++) {
            const bucketTime = now - (i * timeframeMinutes * 60);
            buckets[bucketTime] = [];
          }
          
          // Fetch and analyze transactions for price data
          for (const sig of signatures) {
            if (!sig.blockTime) continue;
            
            try {
              const tx = await rpcConnectionManager.getTransaction(sig.signature);
              
              // This is a placeholder - in a real implementation you would:
              // 1. Detect if transaction is a swap/trade involving the token
              // 2. Extract price information
              // 3. Add to appropriate time bucket
              
              // For demonstration purposes only
              const bucketTime = sig.blockTime - (sig.blockTime % (timeframeMinutes * 60));
              if (buckets[bucketTime]) {
                buckets[bucketTime].push(0); // Placeholder for actual price
              }
            } catch (e) {
              // Skip errors for individual transactions
            }
          }
          
          // This is just a placeholder for how you would convert transaction data into candles
          // In a real implementation, you would analyze the transaction data to extract prices
          const syntheticCandles: CandleData[] = [];
          
          // Returning empty array since this is a complex implementation
          return syntheticCandles;
        }
      } catch (error) {
        this.logger.debug(`Failed to reconstruct market history from transactions for ${address}:`, error);
      }
      
      return [];
    } catch (error) {
      this.logger.error(`Error fetching market history for ${address} on ${network}:`, error);
      return [];
    }
  }
  
  /**
   * Helper to convert timeframe string to minutes
   */
  private parseTimeframeMinutes(timeframe: string): number | null {
    const match = timeframe.match(/^(\d+)([mhd])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'm': return value;
      case 'h': return value * 60;
      case 'd': return value * 60 * 24;
      default: return null;
    }
  }
  
  /**
   * Get token liquidity distribution across exchanges
   */
  async getTokenLiquidity(address: string, network: string): Promise<LiquidityDistribution[] | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      const cacheKey = `token-liquidity-${network}-${address}`;
      
      // Check cache first
      const cachedData = this.cache.get<LiquidityDistribution[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch from APIs
      const liquidityData = await this.fetchTokenLiquidity(address, network);
      
      if (liquidityData && liquidityData.length > 0) {
        // Cache result
        this.cache.set(cacheKey, liquidityData, 60 * 15); // 15 minute TTL
        return liquidityData;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting token liquidity for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch token liquidity from APIs for Solana
   */
  private async fetchTokenLiquidity(address: string, network: string): Promise<LiquidityDistribution[] | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Try Birdeye API first
      const birdeyeApi = this.dexApis.get('birdeye');
      try {
        const response = await axios.get(`${birdeyeApi.baseUrl}/public/pools`, {
          params: {
            address: address,
            chain: 'solana'
          },
          headers: {
            'X-API-KEY': birdeyeApi.apiKey
          }
        });
        
        if (response.data && response.data.data && response.data.data.items) {
          const pools = response.data.data.items;
          
          // Calculate total liquidity
          const totalLiquidity = pools.reduce((sum: number, pool: any) => 
            sum + (pool.liquidity || 0), 0
          );
          
          if (totalLiquidity === 0) return null;
          
          // Create distribution data
          const distribution = pools.map((pool: any) => ({
            exchange: pool.exchange,
            percentage: (pool.liquidity / totalLiquidity) * 100,
            liquidityUSD: pool.liquidity,
            pairAddress: pool.poolAddress
          }));
          
          // Sort by liquidity
          return distribution.sort((a: any, b: any) => b.liquidityUSD - a.liquidityUSD);
        }
      } catch (error) {
        this.logger.debug(`Failed to get token liquidity from Birdeye for ${address}:`, error);
      }
      
      // Try DexScreener API
      const dexscreenerApi = this.dexApis.get('dexscreener');
      try {
        const response = await axios.get(`${dexscreenerApi.baseUrl}/tokens/${address}`);
        
        if (response.data && response.data.pairs && response.data.pairs.length > 0) {
          const pairs = response.data.pairs;
          
          // Calculate total liquidity
          const totalLiquidity = pairs.reduce((sum: number, pair: any) => 
            sum + parseFloat(pair.liquidity?.usd || '0'), 0
          );
          
          if (totalLiquidity === 0) return null;
          
          // Create distribution data
          const distribution = pairs.map((pair: any) => {
            const liquidityUSD = parseFloat(pair.liquidity?.usd || '0');
            return {
              exchange: pair.dexId,
              percentage: (liquidityUSD / totalLiquidity) * 100,
              liquidityUSD,
              pairAddress: pair.pairAddress
            };
          });
          
          // Sort by liquidity
          return distribution.sort((a: any, b: any) => b.liquidityUSD - a.liquidityUSD);
        }
      } catch (error) {
        this.logger.debug(`Failed to get token liquidity from DexScreener for ${address}:`, error);
      }
      
      // Try on-chain method using RPC manager
      try {
        // This would be complex as it requires querying multiple Solana DEXes
        // For now, only relying on APIs for liquidity data
        
        // Sample code to fetch Raydium pools:
        const RAYDIUM_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
        
        const raydiumPools = await rpcConnectionManager.getProgramAccounts(RAYDIUM_PROGRAM_ID, [
          { memcmp: { offset: 8, bytes: address } }
        ]);
        
        // Processing Raydium pools would require specific knowledge of their data structure
        // This is just a placeholder for a real implementation
      } catch (error) {
        this.logger.debug(`Failed to get on-chain liquidity data for ${address}:`, error);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error fetching token liquidity for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Get complete market data for a token
   */
  async getTokenMarketData(address: string, network: string): Promise<TokenMarketData | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      const cacheKey = `token-market-data-${network}-${address}`;
      
      // Check cache first
      const cachedData = this.cache.get<TokenMarketData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Get token metadata
      const tokenMetadata = await this.getTokenMetadata(address, network);
      if (!tokenMetadata) {
        return null;
      }
      
      // Get price data
      const priceData = await this.getTokenPrice(address, network);
      if (!priceData) {
        return null;
      }
      
      // Get liquidity data
      const liquidityDistribution = await this.getTokenLiquidity(address, network) || [];
      
      // Get volume data
      const volumeData = await this.getTokenVolume(address, network);
      if (!volumeData) {
        return null;
      }
      
      // Calculate manipulation score
      const manipulationScore = await this.calculateManipulationScore(address, network);
      
      // Build complete market data object
      const marketData: TokenMarketData = {
        tokenAddress: address, // Changed from token: tokenMetadata
        metadata: tokenMetadata, // New field to hold the metadata
        price: priceData,
        liquidity: [], // Will be populated from distribution data
        volume: volumeData,
        liquidityDistribution,
        manipulationScore: manipulationScore || undefined
      };
      
      // Cache the result
      this.cache.set(cacheKey, marketData, 60 * 10); // 10 minute TTL
      
      return marketData;
    } catch (error) {
      this.logger.error(`Error getting token market data for ${address} on ${network}:`, error);
      return null;
    }
  }

  /**
   * Discover new tokens on Solana
   */
  async discoverNewTokens(network: string, minLiquidityUSD: number = 10000): Promise<TokenMetadata[]> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      const discoveredTokens: TokenMetadata[] = [];
      
      // First try using RPC Connection Manager's getLatestTokens method
      const isHeliusActive = rpcConnectionManager.isEndpointActive('helius');
      if (isHeliusActive) {
        try {
          // Use the new RPC Connection Manager method
          const recentTokens = await rpcConnectionManager.getLatestTokens(20, 5);
          
          for (const token of recentTokens) {
            const tokenAddress = token.mintAddress;
            
            // Get token metadata
            const tokenData = await this.getTokenMetadata(tokenAddress, network);
            
            if (tokenData) {
              discoveredTokens.push(tokenData);
            }
          }
          
          if (discoveredTokens.length > 0) {
            return discoveredTokens;
          }
        } catch (error) {
          this.logger.error(`Error discovering tokens with RPC connection manager on ${network}:`, error);
        }
      }
      
      // Try Birdeye API
      const birdeyeApi = this.dexApis.get('birdeye');
      try {
        const response = await axios.get(`${birdeyeApi.baseUrl}/public/trending_tokens`, {
          params: {
            chain: 'solana'
          },
          headers: {
            'X-API-KEY': birdeyeApi.apiKey
          }
        });
        
        if (response.data && response.data.data && response.data.data.items) {
          for (const token of response.data.data.items) {
            // Skip if liquidity is too low
            if (token.liquidity < minLiquidityUSD) {
              continue;
            }
            
            // Check if we already know this token
            const existingToken = await TokenMetadata.findOne({
              address: token.address,
              network
            });
            
            if (!existingToken) {
              // Get full token data
              const tokenData = await this.getTokenMetadata(token.address, network);
              
              if (tokenData) {
                discoveredTokens.push(tokenData);
              }
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error discovering tokens with Birdeye on ${network}:`, error);
      }
      
      // Try DexScreener API
      const dexscreenerApi = this.dexApis.get('dexscreener');
      try {
        const response = await axios.get(`${dexscreenerApi.baseUrl}/trending`, {
          params: {
            chainId: 'solana'
          }
        });
        
        if (response.data && response.data.pairs) {
          for (const pair of response.data.pairs) {
            // Skip if liquidity is too low
            if (parseFloat(pair.liquidity?.usd || '0') < minLiquidityUSD) {
              continue;
            }
            
            // Check if we already know this token
            const existingToken = await TokenMetadata.findOne({
              address: pair.baseToken.address,
              network
            });
            
            if (!existingToken) {
              // Get full token data
              const tokenData = await this.getTokenMetadata(pair.baseToken.address, network);
              
              if (tokenData) {
                discoveredTokens.push(tokenData);
              }
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error discovering tokens with DexScreener on ${network}:`, error);
      }
      
      return discoveredTokens;
    } catch (error) {
      this.logger.error(`Error discovering new tokens on ${network}:`, error);
      return [];
    }
  }

  /**
   * Analyze token security (using RPC manager)
   */
  async analyzeTokenSecurity(address: string, network: string): Promise<{
    hasMintAuthority: boolean;
    hasFreezingAuthority: boolean;
    supplyControlledByTeam: boolean;
    suspiciousTransactions: number;
    securityScore: number;
    warnings: string[];
  } | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network for token security analysis: ${network}`);
      }
      
      // Get token mint account info
      const mintInfo = await rpcConnectionManager.getAccountInfo(address);
      
      if (!mintInfo) {
        return null;
      }
      
      const warnings: string[] = [];
      let securityScore = 100; // Start with perfect score
      
      // Check if mint authority exists and is enabled
      const hasMintAuthority = !!mintInfo.data?.parsed?.info?.mintAuthority;
      if (hasMintAuthority) {
        warnings.push('Token has an active mint authority that can create new tokens');
        securityScore -= 30;
      }
      
      // Check if freeze authority exists
      const hasFreezingAuthority = !!mintInfo.data?.parsed?.info?.freezeAuthority;
      if (hasFreezingAuthority) {
        warnings.push('Token has a freeze authority that can freeze user accounts');
        securityScore -= 20;
      }
      
      // Get recent transactions to analyze for suspicious patterns
      const signatures = await rpcConnectionManager.getSignaturesForAddress(address, 50);
      let suspiciousTransactions = 0;
      
      // Simple logic to detect suspicious transactions - would be more sophisticated in practice
      if (signatures) {
        for (const sig of signatures.slice(0, 20)) {
          try {
            const tx = await rpcConnectionManager.getTransaction(sig.signature);
            
            // Look for specific instruction patterns that might indicate minting, privilege changes, etc.
            if (tx && tx.meta && tx.meta.logMessages) {
              const logs = tx.meta.logMessages;
              
              // Example: Check for mint instructions
              if (logs.some((log: string) => log.includes('Instruction: MintTo'))) {
                suspiciousTransactions++;
                securityScore -= 2; // Deduct points for each suspicious transaction
              }
              
              // Check for authority changes
              if (logs.some((log: string) => log.includes('Instruction: SetAuthority'))) {
                suspiciousTransactions++;
                securityScore -= 5;
              }
            }
          } catch (e) {
            // Skip errors for individual transactions
          }
        }
      }
      
      // Cap suspicious transaction deductions
      securityScore = Math.max(0, securityScore);
      
      // Analyze ownership concentration
      // This is a placeholder for a more complete implementation
      const supplyControlledByTeam = false;
      
      return {
        hasMintAuthority,
        hasFreezingAuthority,
        supplyControlledByTeam,
        suspiciousTransactions,
        securityScore,
        warnings
      };
    } catch (error) {
      this.logger.error(`Error analyzing token security for ${address} on ${network}:`, error);
      return null;
    }
  }

  /**
   * Get best swap route for a token on Solana
   */
  async getSwapRoute(fromToken: string, toToken: string, amount: string, network: string): Promise<TokenSwapRoute | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network for swap route: ${network}`);
      }
      
      // Use Jupiter API
      const jupiterApi = this.dexApis.get('jupiter');
      
      const response = await axios.get(`${jupiterApi.baseUrl}/quote`, {
        params: {
          inputMint: fromToken,
          outputMint: toToken,
          amount,
          slippageBps: 50 // 0.5% slippage
        }
      });
      
      if (response.data && response.data.data) {
        const routeData = response.data.data;
        
        return {
          fromToken,
          toToken,
          exchanges: routeData.marketInfos.map((market: any) => market.label),
          estimatedOutput: parseFloat(routeData.outAmount),
          priceImpact: parseFloat(routeData.priceImpactPct),
          path: [fromToken, ...routeData.marketInfos.map((market: any) => market.outputMint)]
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting swap route from ${fromToken} to ${toToken} on ${network}:`, error);
      return null;
    }
  }

  /**
   * Calculate manipulation score for a token
   * This is a composite metric that considers:
   * - Liquidity distribution (concentrated in one place is suspicious)
   * - Trading volume vs liquidity ratio
   * - Buy/sell transaction ratio
   * - Price volatility
   * - Holder concentration
   * Returns a score from 0-100 where higher is more likely to be manipulated
   */
  async calculateManipulationScore(address: string, network: string): Promise<number | null> {
    try {
      if (network !== 'solana') {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Get required data
      const liquidityDistribution = await this.getTokenLiquidity(address, network);
      const volumeData = await this.getTokenVolume(address, network);
      const marketHistory = await this.getMarketHistory(address, network, '15m', 96); // Last 24 hours
      
      if (!liquidityDistribution || !volumeData || !marketHistory) {
        return null;
      }
      
      // 1. Liquidity concentration score (0-25)
      const topLiquidityPercentage = liquidityDistribution[0]?.percentage || 0;
      const liquidityConcentrationScore = Math.min(25, (topLiquidityPercentage / 100) * 25);
      
      // 2. Volume to liquidity ratio score (0-25)
      const totalLiquidity = liquidityDistribution.reduce((sum, item) => sum + item.liquidityUSD, 0);
      const volumeToLiquidityRatio = volumeData.volume24h / totalLiquidity;
      
      // Very high volume compared to liquidity is suspicious
      let volumeToLiquidityScore = 0;
      if (volumeToLiquidityRatio > 5) {
        volumeToLiquidityScore = 25; // Extremely high turnover
      } else if (volumeToLiquidityRatio > 2) {
        volumeToLiquidityScore = 15 + ((volumeToLiquidityRatio - 2) / 3) * 10;
      } else if (volumeToLiquidityRatio > 1) {
        volumeToLiquidityScore = 5 + ((volumeToLiquidityRatio - 1)) * 10;
      } else if (volumeToLiquidityRatio > 0.5) {
        volumeToLiquidityScore = 5;
      }
      
      // 3. Buy/sell ratio score (0-20)
      const totalTxns = volumeData.buys24h + volumeData.sells24h;
      let buyToSellScore = 0;
      
      if (totalTxns > 10) { // Only count if there's significant activity
        const buyRatio = volumeData.buys24h / totalTxns;
        
        // Extreme buy or sell pressure can indicate manipulation
        if (buyRatio > 0.9 || buyRatio < 0.1) {
          buyToSellScore = 20;
        } else if (buyRatio > 0.8 || buyRatio < 0.2) {
          buyToSellScore = 15;
        } else if (buyRatio > 0.7 || buyRatio < 0.3) {
          buyToSellScore = 10;
        } else if (buyRatio > 0.65 || buyRatio < 0.35) {
          buyToSellScore = 5;
        }
      }
      
      // 4. Price volatility score (0-30)
      let volatilityScore = 0;
      
      if (marketHistory.length > 0) {
        // Calculate standard deviation of price changes
        const priceChanges = [];
        for (let i = 1; i < marketHistory.length; i++) {
          const percentChange = ((marketHistory[i].close - marketHistory[i-1].close) / marketHistory[i-1].close) * 100;
          priceChanges.push(percentChange);
        }
        
        // Calculate standard deviation
        const mean = priceChanges.reduce((sum, value) => sum + value, 0) / priceChanges.length;
        const variance = priceChanges.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / priceChanges.length;
        const stdDev = Math.sqrt(variance);
        
        // Score based on standard deviation of 15-min candles
        if (stdDev > 8) {
          volatilityScore = 30; // Extremely volatile
        } else if (stdDev > 5) {
          volatilityScore = 20 + ((stdDev - 5) / 3) * 10;
        } else if (stdDev > 3) {
          volatilityScore = 10 + ((stdDev - 3) / 2) * 10;
        } else if (stdDev > 1) {
          volatilityScore = ((stdDev - 1) / 2) * 10;
        }
      }

      // 5. Add on-chain transaction analysis using RPC manager
      let onChainManipulationScore = 0;
      try {
        // Get recent signatures for this token
        const signatures = await rpcConnectionManager.getSignaturesForAddress(address, 100);
        
        if (signatures && signatures.length > 0) {
          // Analyze transaction patterns
          const uniqueAccounts = new Set<string>();
          const transactionTimestamps: number[] = [];
          
          for (let i = 0; i < Math.min(signatures.length, 50); i++) {
            try {
              const sig = signatures[i];
              if (sig.blockTime) {
                transactionTimestamps.push(sig.blockTime);
              }
              
              const tx = await rpcConnectionManager.getTransaction(sig.signature);
              
              if (tx && tx.transaction && tx.transaction.message) {
                // Collect unique accounts involved
                tx.transaction.message.accountKeys.forEach((key: string) => {
                  uniqueAccounts.add(key);
                });
              }
            } catch (e) {
              // Skip errors for individual transactions
            }
          }
          
          // Calculate unique account ratio
          // Lower ratio indicates fewer unique accounts involved = higher manipulation risk
          const uniqueAccountRatio = uniqueAccounts.size / Math.min(signatures.length, 50);
          
          // Calculate transaction timing pattern
          // Sort timestamps
          transactionTimestamps.sort((a, b) => a - b);
          
          // Calculate time differences between transactions
          const timeDiffs = [];
          for (let i = 1; i < transactionTimestamps.length; i++) {
            timeDiffs.push(transactionTimestamps[i] - transactionTimestamps[i-1]);
          }
          
          // Check for unnaturally regular patterns
          let regularPatternCount = 0;
          for (let i = 1; i < timeDiffs.length; i++) {
            // If consecutive time differences are very similar, could indicate bot activity
            if (Math.abs(timeDiffs[i] - timeDiffs[i-1]) < 2) { // Within 2 seconds
              regularPatternCount++;
            }
          }
          
          // Score based on unique account ratio
          if (uniqueAccountRatio < 0.2) {
            onChainManipulationScore += 15; // Very concentrated activity
          } else if (uniqueAccountRatio < 0.4) {
            onChainManipulationScore += 10;
          } else if (uniqueAccountRatio < 0.6) {
            onChainManipulationScore += 5;
          }
          
          // Score based on regular transaction patterns
          if (regularPatternCount > 10) {
            onChainManipulationScore += 15; // Very regular transaction timing
          } else if (regularPatternCount > 5) {
            onChainManipulationScore += 10;
          } else if (regularPatternCount > 2) {
            onChainManipulationScore += 5;
          }
          
          // Cap on-chain manipulation score
          onChainManipulationScore = Math.min(30, onChainManipulationScore);
        }
      } catch (error) {
        this.logger.error(`Error in on-chain manipulation analysis for ${address}:`, error);
        // Continue with other score components
      }
      
      // Calculate final score
      const manipulationScore = Math.min(100, 
        liquidityConcentrationScore + 
        volumeToLiquidityScore + 
        buyToSellScore + 
        volatilityScore +
        onChainManipulationScore
      );
      
      return manipulationScore;
    } catch (error) {
      this.logger.error(`Error calculating manipulation score for ${address} on ${network}:`, error);
      return null;
    }
  }
}

export default new MarketDataService();