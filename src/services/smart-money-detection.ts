// src/services/smart-money-detection.ts
import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import axios from 'axios';
import externalWalletScraper from './external-wallet-scraper';
import rpcConnectionManager from './rpc-connection-manager';
import config from '../config';

// Types and interfaces
export interface ISmartWallet extends Document {
  address: string;
  network: string;
  score: number;           // 0-100 score based on historical performance
  successRate: number;     // Percentage of successful trades
  profitFactor: number;    // Average profit / average loss
  transactionCount: number;
  lastUpdated: Date;
  tags: string[];
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWalletActivity {
  buys: number;
  sells: number;
  netBuys: number;
  buyVolume: number;
  sellVolume: number;
  netVolume: number;
  walletCount: number;
  topWallets: Array<{
    address: string;
    score: number;
    action: 'buy' | 'sell';
    amount: number;
  }>;
}

export interface ITransactionData {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  tokenAddress?: string;
  tokenAmount?: string;
  tokenSymbol?: string;
  type: 'buy' | 'sell' | 'transfer' | 'other';
  gasPrice: string;
  gasUsed?: string;
}

// Schema definitions
const smartWalletSchema = new Schema<ISmartWallet>({
  address: { type: String, required: true, unique: true, index: true },
  network: { type: String, required: true, index: true },
  score: { type: Number, required: true, min: 0, max: 100, index: true },
  successRate: { type: Number, required: true, min: 0, max: 100 },
  profitFactor: { type: Number, required: true, min: 0 },
  transactionCount: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, required: true, default: Date.now, index: true },
  tags: [{ type: String }],
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Create model if it doesn't exist yet
const SmartWallet: Model<ISmartWallet> = mongoose.models.SmartWallet as Model<ISmartWallet> ||
  mongoose.model<ISmartWallet>('SmartWallet', smartWalletSchema);

// Known DEX contracts for identifying trades
const knownDexContracts: Record<string, string[]> = {
  'ethereum': [
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
    '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router
    '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f'  // Sushiswap Router
  ],
  'solana': [
    // Raydium, Jupiter, etc. program IDs would go here
  ]
};

class SmartMoneyDetectionService {
  private logger: winston.Logger;
  private smartWallets: Map<string, ISmartWallet>;
  private networkTokens: Map<string, Set<string>>;  // network -> token addresses
  private updateInterval: NodeJS.Timeout | null;
  private walletScoreThreshold: number;
  private externalScoreWeight: number;
  private historicalPerformanceWeight: number;
  private recentActivityWeight: number;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'smart-money-detection' },
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
    
    this.smartWallets = new Map();
    this.networkTokens = new Map();
    this.updateInterval = null;
    
    // Configuration
    this.walletScoreThreshold = 70;  // Minimum score to be considered "smart money"
    this.externalScoreWeight = 0.4;  // Weight for external data source score
    this.historicalPerformanceWeight = 0.4;  // Weight for historical performance
    this.recentActivityWeight = 0.2;  // Weight for recent activity
  }
  
  /**
   * Initialize smart money detection service
   */
  async init(): Promise<boolean> {
    try {
      // Load smart wallets from database
      await this.loadSmartWallets();
      
      // Initialize network tokens map
      await this.initializeNetworkTokens();
      
      // Start the wallet update scheduler
      this.startWalletUpdateScheduler();
      
      this.logger.info('Smart money detection service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize smart money detection service:', error);
      return false;
    }
  }
  
  /**
   * Load smart wallets from database
   */
  private async loadSmartWallets(): Promise<void> {
    try {
      const wallets = await SmartWallet.find({});
      
      for (const wallet of wallets) {
        // Use lowercase address as key for case-insensitive lookup
        this.smartWallets.set(wallet.address.toLowerCase(), wallet);
      }
      
      this.logger.info(`Loaded ${this.smartWallets.size} smart wallets`);
    } catch (error) {
      this.logger.error('Error loading smart wallets:', error);
      throw error;
    }
  }
  
  /**
   * Initialize network tokens map
   */
  private async initializeNetworkTokens(): Promise<void> {
    // This would be populated from your token tracking service
    // For now, just initialize empty sets for supported networks
    this.networkTokens.set('ethereum', new Set());
    this.networkTokens.set('solana', new Set());
  }
  
  /**
   * Start the wallet update scheduler
   */
  private startWalletUpdateScheduler(): void {
    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Update wallets every 6 hours
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateExternalWalletData();
        await this.updateWalletPerformance();
      } catch (error) {
        this.logger.error('Error in wallet update scheduler:', error);
      }
    }, 6 * 60 * 60 * 1000);
    
    this.logger.info('Wallet update scheduler started');
  }
  
  /**
   * Update wallet data from external sources
   */
  async updateExternalWalletData(): Promise<void> {
    try {
      // Get wallet data from external scraper
      const externalWallets = await externalWalletScraper.getSmartWallets();
      
      // Process each wallet
      for (const externalWallet of externalWallets) {
        const address = externalWallet.address.toLowerCase();
        
        // Check if wallet already exists
        const existingWallet = this.smartWallets.get(address);
        
        if (existingWallet) {
          // Update existing wallet
          const updatedWallet = await SmartWallet.findByIdAndUpdate(
            existingWallet._id,
            {
              $set: {
                score: this.calculateWalletScore(existingWallet, externalWallet),
                lastUpdated: new Date(),
                metadata: {
                  ...existingWallet.metadata,
                  externalData: externalWallet
                }
              }
            },
            { new: true }
          );
          
          if (updatedWallet) {
            this.smartWallets.set(address, updatedWallet);
          }
        } else {
          // Create new wallet
          const newWallet = new SmartWallet({
            address: address,
            network: externalWallet.network || 'ethereum',
            score: externalWallet.score || 50,
            successRate: externalWallet.successRate || 0,
            profitFactor: externalWallet.profitFactor || 0,
            transactionCount: externalWallet.transactionCount || 0,
            lastUpdated: new Date(),
            tags: externalWallet.tags || [],
            metadata: {
              externalData: externalWallet
            }
          });
          
          const savedWallet = await newWallet.save();
          this.smartWallets.set(address, savedWallet);
        }
      }
      
      this.logger.info(`Updated ${externalWallets.length} wallets from external sources`);
    } catch (error) {
      this.logger.error('Error updating external wallet data:', error);
      throw error;
    }
  }
  
  /**
   * Update wallet performance based on transaction history
   */
  async updateWalletPerformance(): Promise<void> {
    try {
      // Process wallets in batches to avoid memory issues
      const batchSize = 100;
      const addresses = Array.from(this.smartWallets.keys());
      
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        await Promise.all(batch.map(address => this.updateSingleWalletPerformance(address)));
      }
      
      this.logger.info(`Updated performance for ${addresses.length} wallets`);
    } catch (error) {
      this.logger.error('Error updating wallet performance:', error);
    }
  }
  
  /**
   * Update performance metrics for a single wallet
   */
  private async updateSingleWalletPerformance(address: string): Promise<void> {
    try {
      const wallet = this.smartWallets.get(address);
      if (!wallet) return;
      
      // Get recent transactions (this would use your transaction database or RPC)
      const transactions = await this.getWalletTransactions(address, wallet.network, 100);
      
      // Analyze transactions to determine success rate and profit factor
      const { successRate, profitFactor, transactionCount } = await this.analyzeWalletTransactions(wallet, transactions);
      
      // Update wallet with new performance metrics
      const updatedWallet = await SmartWallet.findByIdAndUpdate(
        wallet._id,
        {
          $set: {
            successRate,
            profitFactor,
            transactionCount,
            score: this.calculateWalletScore(wallet, { successRate, profitFactor }),
            lastUpdated: new Date()
          }
        },
        { new: true }
      );
      
      if (updatedWallet) {
        this.smartWallets.set(address, updatedWallet);
      }
    } catch (error) {
      this.logger.error(`Error updating performance for wallet ${address}:`, error);
    }
  }
  
  /**
   * Get transactions for a wallet
   */
  private async getWalletTransactions(
    address: string,
    network: string,
    limit: number
  ): Promise<ITransactionData[]> {
    try {
      // In production, this would get data from your transaction database
      // or RPC node based on the wallet address
      
      // For now, return mock data
      return Array(limit).fill(0).map((_, i) => ({
        hash: `0x${i}${address.substring(2, 10)}`,
        blockNumber: 10000000 + i,
        timestamp: Math.floor(Date.now() / 1000) - i * 3600,
        from: Math.random() > 0.5 ? address : `0x${i}random`,
        to: Math.random() > 0.5 ? `0x${i}random` : address,
        value: (Math.random() * 10).toFixed(18),
        tokenAddress: Math.random() > 0.3 ? `0x${i}token` : undefined,
        tokenAmount: Math.random() > 0.3 ? (Math.random() * 1000).toFixed(18) : undefined,
        tokenSymbol: Math.random() > 0.3 ? 'TOKEN' : undefined,
        type: ['buy', 'sell', 'transfer', 'other'][Math.floor(Math.random() * 4)] as any,
        gasPrice: (Math.random() * 100).toFixed(9),
        gasUsed: (Math.random() * 200000).toFixed(0)
      }));
    } catch (error) {
      this.logger.error(`Error getting transactions for wallet ${address}:`, error);
      return [];
    }
  }
  
  /**
   * Analyze wallet transactions to determine performance metrics
   */
  private async analyzeWalletTransactions(
    wallet: ISmartWallet,
    transactions: ITransactionData[]
  ): Promise<{ successRate: number; profitFactor: number; transactionCount: number }> {
    // In production, this would analyze buy/sell pairs to determine profit/loss
    // Track holding periods, calculate ROI, etc.
    
    // For now, return mock metrics
    const successfulTrades = Math.floor(Math.random() * transactions.length * 0.8);
    const unsuccessfulTrades = Math.floor(transactions.length * 0.2);
    
    const successRate = transactions.length > 0 ? 
      (successfulTrades / transactions.length) * 100 : 0;
      
    const avgProfit = Math.random() * 0.3 + 0.1; // 10-40% average profit
    const avgLoss = Math.random() * 0.1 + 0.05; // 5-15% average loss
    
    const profitFactor = avgLoss > 0 ? avgProfit / avgLoss : avgProfit;
    
    return {
      successRate,
      profitFactor,
      transactionCount: wallet.transactionCount + transactions.length
    };
  }
  
  /**
   * Calculate wallet score based on various factors
   */
  private calculateWalletScore(
    wallet: ISmartWallet,
    externalData: any
  ): number {
    // Calculate weighted score
    let score = 0;
    
    // External data score
    const externalScore = externalData.score !== undefined ? 
      externalData.score : wallet.score;
    score += externalScore * this.externalScoreWeight;
    
    // Historical performance score
    const performanceScore = externalData.successRate !== undefined ?
      externalData.successRate : wallet.successRate;
    score += performanceScore * this.historicalPerformanceWeight;
    
    // Recent activity score (higher activity = higher score)
    const activityScore = Math.min(100, (wallet.transactionCount / 100) * 100);
    score += activityScore * this.recentActivityWeight;
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }
  
  /**
   * Check if an address is a smart money wallet
   */
  async isSmartWallet(address: string, network: string = 'ethereum'): Promise<boolean> {
    const wallet = this.smartWallets.get(address.toLowerCase());
    
    if (wallet && wallet.network === network) {
      return wallet.score >= this.walletScoreThreshold;
    }
    
    // Check if wallet exists in database but not in memory
    if (!wallet) {
      const dbWallet = await SmartWallet.findOne({ address: address.toLowerCase(), network });
      
      if (dbWallet) {
        this.smartWallets.set(address.toLowerCase(), dbWallet);
        return dbWallet.score >= this.walletScoreThreshold;
      }
    }
    
    return false;
  }
  
  /**
   * Get wallet score
   */
  async getWalletScore(address: string, network: string = 'ethereum'): Promise<number> {
    const wallet = this.smartWallets.get(address.toLowerCase());
    
    if (wallet && wallet.network === network) {
      return wallet.score;
    }
    
    // Check if wallet exists in database but not in memory
    if (!wallet) {
      const dbWallet = await SmartWallet.findOne({ address: address.toLowerCase(), network });
      
      if (dbWallet) {
        this.smartWallets.set(address.toLowerCase(), dbWallet);
        return dbWallet.score;
      }
    }
    
    return 0;
  }
  
  /**
   * Get smart money activity for a token
   */
  async getSmartMoneyActivity(
    tokenAddress: string,
    network: string = 'ethereum',
    timeframeHours: number = 24
  ): Promise<IWalletActivity> {
    try {
      // Get token transactions in the given timeframe
      const transactions = await this.getTokenTransactions(tokenAddress, network, timeframeHours);
      
      // Separate transactions by smart wallets
      const smartWalletTxs = await this.filterSmartWalletTransactions(transactions, network);
      
      // Count buys and sells
      let buys = 0;
      let sells = 0;
      let buyVolume = 0;
      let sellVolume = 0;
      
      // Track wallet actions
      const walletActions = new Map<string, {
        score: number;
        action: 'buy' | 'sell';
        amount: number;
      }>();
      
      for (const tx of smartWalletTxs) {
        const wallet = this.smartWallets.get(tx.from.toLowerCase());
        
        if (tx.type === 'buy') {
          buys++;
          buyVolume += parseFloat(tx.value) || 0;
          
          // Record wallet action
          if (wallet) {
            walletActions.set(tx.from.toLowerCase(), {
              score: wallet.score,
              action: 'buy',
              amount: parseFloat(tx.value) || 0
            });
          }
        } else if (tx.type === 'sell') {
          sells++;
          sellVolume += parseFloat(tx.value) || 0;
          
          // Record wallet action
          if (wallet) {
            walletActions.set(tx.from.toLowerCase(), {
              score: wallet.score,
              action: 'sell',
              amount: parseFloat(tx.value) || 0
            });
          }
        }
      }
      
      // Get top wallets by score
      const topWallets = Array.from(walletActions.entries())
        .map(([address, data]) => ({
          address,
          score: data.score,
          action: data.action,
          amount: data.amount
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      return {
        buys,
        sells,
        netBuys: buys - sells,
        buyVolume,
        sellVolume,
        netVolume: buyVolume - sellVolume,
        walletCount: walletActions.size,
        topWallets
      };
    } catch (error) {
      this.logger.error(`Error getting smart money activity for ${tokenAddress}:`, error);
      
      // Return empty activity on error
      return {
        buys: 0,
        sells: 0,
        netBuys: 0,
        buyVolume: 0,
        sellVolume: 0,
        netVolume: 0,
        walletCount: 0,
        topWallets: []
      };
    }
  }
  
  /**
   * Get token transactions
   */
  private async getTokenTransactions(
    tokenAddress: string,
    network: string,
    timeframeHours: number
  ): Promise<ITransactionData[]> {
    try {
      // In production, this would query your transaction database or RPC node
      // For now, return mock data
      return Array(50).fill(0).map((_, i) => ({
        hash: `0x${i}${tokenAddress.substring(2, 10)}`,
        blockNumber: 10000000 + i,
        timestamp: Math.floor(Date.now() / 1000) - i * (timeframeHours * 3600 / 50),
        from: `0x${Math.random().toString(16).substring(2, 10)}`,
        to: Math.random() > 0.5 ? tokenAddress : `0x${Math.random().toString(16).substring(2, 10)}`,
        value: (Math.random() * 10).toFixed(18),
        tokenAddress,
        tokenAmount: (Math.random() * 1000).toFixed(18),
        tokenSymbol: 'TOKEN',
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        gasPrice: (Math.random() * 100).toFixed(9),
        gasUsed: (Math.random() * 200000).toFixed(0)
      }));
    } catch (error) {
      this.logger.error(`Error getting token transactions for ${tokenAddress}:`, error);
      return [];
    }
  }
  
  /**
   * Filter transactions to only include those from smart wallets
   */
  private async filterSmartWalletTransactions(
    transactions: ITransactionData[],
    network: string
  ): Promise<ITransactionData[]> {
    const smartWalletTxs: ITransactionData[] = [];
    
    for (const tx of transactions) {
      // Check if sender is a smart wallet
      if (await this.isSmartWallet(tx.from, network)) {
        smartWalletTxs.push(tx);
      }
    }
    
    return smartWalletTxs;
  }
  
  /**
   * Get top smart wallets
   */
  async getTopSmartWallets(
    limit: number = 100,
    network: string = 'ethereum'
  ): Promise<ISmartWallet[]> {
    try {
      return SmartWallet.find({ network })
        .sort({ score: -1 })
        .limit(limit);
    } catch (error) {
      this.logger.error('Error getting top smart wallets:', error);
      return [];
    }
  }
  
  /**
   * Get smart wallet details
   */
  async getSmartWallet(address: string, network: string = 'ethereum'): Promise<ISmartWallet | null> {
    try {
      // Check in-memory cache first
      const cachedWallet = this.smartWallets.get(address.toLowerCase());
      if (cachedWallet && cachedWallet.network === network) {
        return cachedWallet;
      }
      
      // Check database
      const wallet = await SmartWallet.findOne({ address: address.toLowerCase(), network });
      
      if (wallet) {
        // Add to cache
        this.smartWallets.set(address.toLowerCase(), wallet);
      }
      
      return wallet;
    } catch (error) {
      this.logger.error(`Error getting smart wallet ${address}:`, error);
      return null;
    }
  }
  
  /**
   * Set wallet score threshold for smart money classification
   */
  setWalletScoreThreshold(threshold: number): void {
    this.walletScoreThreshold = Math.min(100, Math.max(0, threshold));
    this.logger.info(`Smart wallet threshold set to ${this.walletScoreThreshold}`);
  }
  
  /**
   * Add a smart wallet manually
   */
  async addSmartWallet(
    address: string,
    network: string = 'ethereum',
    initialScore: number = 70
  ): Promise<ISmartWallet | null> {
    try {
      // Check if wallet already exists
      const existing = await this.getSmartWallet(address, network);
      if (existing) {
        return existing;
      }
      
      // Create new wallet
      const newWallet = new SmartWallet({
        address: address.toLowerCase(),
        network,
        score: initialScore,
        successRate: 0,
        profitFactor: 0,
        transactionCount: 0,
        lastUpdated: new Date(),
        tags: ['manual']
      });
      
      const savedWallet = await newWallet.save();
      
      // Add to cache
      this.smartWallets.set(address.toLowerCase(), savedWallet);
      
      return savedWallet;
    } catch (error) {
      this.logger.error(`Error adding smart wallet ${address}:`, error);
      return null;
    }
  }
  
  /**
   * Stop the service
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.logger.info('Smart money detection service stopped');
  }
}

export default new SmartMoneyDetectionService();