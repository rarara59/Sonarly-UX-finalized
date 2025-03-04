// Thorp V1 - External Wallet Data Scraper
// Scrapes and integrates data from paid smart wallet services

import axios, { AxiosResponse } from 'axios';
import cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import winston from 'winston';
import mongoose, { Document, Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

// Interface for external wallet source configuration
interface WalletSource {
  enabled: boolean;
  url: string;
  authToken: string;
  fetchInterval: number;
  lastFetch: number;
  requiresLogin: boolean;
  loginCredentials?: {
    username: string;
    password: string;
  };
}

// Interface for wallet sources
interface WalletSources {
  [key: string]: WalletSource;
}

// Interface for scraper statistics
interface ScraperStats {
  totalScraped: number;
  newWallets: number;
  updatedWallets: number;
  failedWallets: number;
  lastScrapeTime: Date | null;
  scrapingInProgress: boolean;
}

// Interface for wallet filter options
interface WalletFilterOptions {
  category?: string;
  tags?: string[];
  minSuccessRate?: number;
  minTrades?: number;
  sortBy?: 'performance' | 'trades' | 'followers' | 'lastUpdated';
  limit?: number;
  skip?: number;
}

// Interface for wallet pagination results
interface WalletPaginationResult {
  wallets: IExternalWallet[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// Known token interface
interface KnownToken {
  address: string;
  symbol: string;
  firstTraded?: Date;
  lastTraded?: Date;
  profitLoss?: number;
}

// Performance metrics interface
interface PerformanceMetrics {
  successRate?: number;
  totalTrades?: number;
  profitableTrades?: number;
  averageReturn?: number;
  biggestWin?: number;
  biggestLoss?: number;
}

// External wallet interface
interface IExternalWallet extends Document {
  address: string;
  source: string;
  externalId?: string;
  label?: string;
  tags: string[];
  category?: string;
  performance: PerformanceMetrics;
  knownTokens: KnownToken[];
  lastActivity?: Date;
  followersCount?: number;
  riskScore?: number;
  trustScore?: number;
  lastUpdated: Date;
  metadataVersion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Recent token interface for performance history
interface RecentToken {
  address: string;
  symbol: string;
  profit: boolean;
  returnPercentage: number;
}

// Wallet performance history interface
interface IWalletPerformanceHistory extends Document {
  walletAddress: string;
  date: Date;
  successRate?: number;
  totalTrades?: number;
  profitableTrades?: number;
  averageReturn?: number;
  cumulativeReturn?: number;
  recentTokens: RecentToken[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Scraped wallet data interface
interface ScrapedWalletData {
  address: string;
  label?: string;
  tags?: string[];
  category?: string;
  performance?: PerformanceMetrics;
  followersCount?: number;
  externalId?: string;
  recentTokens?: RecentToken[];
}

// External Wallet Schema
const externalWalletSchema = new Schema<IExternalWallet>({
  address: { type: String, required: true, unique: true, index: true },
  source: { type: String, required: true, index: true },
  externalId: { type: String },
  label: { type: String },
  tags: [{ type: String, index: true }],
  category: { type: String, index: true },
  performance: {
    successRate: { type: Number },
    totalTrades: { type: Number },
    profitableTrades: { type: Number },
    averageReturn: { type: Number },
    biggestWin: { type: Number },
    biggestLoss: { type: Number }
  },
  knownTokens: [{
    address: { type: String },
    symbol: { type: String },
    firstTraded: { type: Date },
    lastTraded: { type: Date },
    profitLoss: { type: Number }
  }],
  lastActivity: { type: Date },
  followersCount: { type: Number },
  riskScore: { type: Number },
  trustScore: { type: Number },
  lastUpdated: { type: Date, default: Date.now },
  metadataVersion: { type: Number, default: 1 }
}, { timestamps: true });

// Create model if it doesn't exist yet
const ExternalWallet: Model<IExternalWallet> = mongoose.models.ExternalWallet as Model<IExternalWallet> || 
  mongoose.model<IExternalWallet>('ExternalWallet', externalWalletSchema);

// Historical Performance Schema for tracking wallet performance over time
const walletPerformanceHistorySchema = new Schema<IWalletPerformanceHistory>({
  walletAddress: { type: String, required: true, index: true },
  date: { type: Date, default: Date.now, index: true },
  successRate: { type: Number },
  totalTrades: { type: Number },
  profitableTrades: { type: Number },
  averageReturn: { type: Number },
  cumulativeReturn: { type: Number },
  recentTokens: [{ 
    address: { type: String },
    symbol: { type: String },
    profit: { type: Boolean },
    returnPercentage: { type: Number }
  }]
}, { timestamps: true });

// Create model if it doesn't exist yet
const WalletPerformanceHistory: Model<IWalletPerformanceHistory> = 
  mongoose.models.WalletPerformanceHistory as Model<IWalletPerformanceHistory> || 
  mongoose.model<IWalletPerformanceHistory>('WalletPerformanceHistory', walletPerformanceHistorySchema);

class ExternalWalletScraper {
  private logger: winston.Logger;
  private sources: WalletSources;
  private browser: Browser | null;
  private stats: ScraperStats;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'external-wallet-scraper' },
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
    
    // Scraping sources configuration
    this.sources = {
      // Configuration for the first source (example: Nansen)
      nansen: {
        enabled: config.externalWallets.sources.nansen.enabled,
        url: config.externalWallets.sources.nansen.url,
        authToken: config.externalWallets.sources.nansen.authToken,
        fetchInterval: 3600000, // 1 hour
        lastFetch: 0,
        requiresLogin: true,
        loginCredentials: {
          username: config.externalWallets.sources.nansen.username,
          password: config.externalWallets.sources.nansen.password
        }
      },
      // Configuration for the second source (example: Dune)
      dune: {
        enabled: config.externalWallets.sources.dune.enabled,
        url: config.externalWallets.sources.dune.url,
        authToken: config.externalWallets.sources.dune.authToken,
        fetchInterval: 7200000, // 2 hours
        lastFetch: 0,
        requiresLogin: false
      }
      // Add more sources as needed
    };
    
    // Browser instance for Puppeteer
    this.browser = null;
    
    // Stats
    this.stats = {
      totalScraped: 0,
      newWallets: 0,
      updatedWallets: 0,
      failedWallets: 0,
      lastScrapeTime: null,
      scrapingInProgress: false
    };
  }
  
  // Initialize scraper
  async init(): Promise<boolean> {
    try {
      // Launch headless browser for scraping
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      
      this.logger.info('External wallet scraper initialized');
      
      // Start scheduled scraping
      this.scheduleScrapingJobs();
      
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize wallet scraper:', error);
      return false;
    }
  }
  
  // Schedule scraping jobs based on source configurations
  scheduleScrapingJobs(): void {
    Object.keys(this.sources).forEach(sourceName => {
      const source = this.sources[sourceName];
      if (source.enabled) {
        this.logger.info(`Scheduling scraping job for ${sourceName}`);
        
        // Initial scrape
        setTimeout(() => {
          this.scrapeSource(sourceName);
        }, 10000 + Math.random() * 30000); // Random delay to avoid all sources starting at once
        
        // Recurring scrape
        setInterval(() => {
          this.scrapeSource(sourceName);
        }, source.fetchInterval);
      }
    });
  }
  
  // Scrape data from a specific source
  async scrapeSource(sourceName: string): Promise<void> {
    const source = this.sources[sourceName];
    if (!source || !source.enabled) return;
    
    // Check if we should run based on the interval
    if (Date.now() - source.lastFetch < source.fetchInterval) {
      return;
    }
    
    // Mark as in progress
    this.stats.scrapingInProgress = true;
    this.stats.lastScrapeTime = new Date();
    
    this.logger.info(`Starting scrape for ${sourceName}`);
    
    try {
      let walletData: ScrapedWalletData[] = [];
      
      // Different scraping methods based on source
      switch (sourceName) {
        case 'nansen':
          walletData = await this.scrapeNansen();
          break;
        case 'dune':
          walletData = await this.scrapeDune();
          break;
        default:
          this.logger.warn(`Unknown source: ${sourceName}`);
          return;
      }
      
      // Process scraped wallet data
      if (walletData && walletData.length > 0) {
        await this.processWalletData(walletData, sourceName);
        
        // Update source metadata
        source.lastFetch = Date.now();
        this.stats.totalScraped += walletData.length;
        
        this.logger.info(`Successfully scraped ${walletData.length} wallets from ${sourceName}`);
      } else {
        this.logger.warn(`No wallet data found from ${sourceName}`);
      }
    } catch (error) {
      this.logger.error(`Error scraping from ${sourceName}:`, error);
    } finally {
      this.stats.scrapingInProgress = false;
    }
  }
  
  // Scrape wallet data from Nansen
  async scrapeNansen(): Promise<ScrapedWalletData[]> {
    this.logger.info('Scraping wallet data from Nansen');
    
    try {
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }
      
      const page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to login page if required
      if (this.sources.nansen.requiresLogin) {
        await page.goto(this.sources.nansen.url + '/login', { waitUntil: 'networkidle2' });
        
        // Fill login form
        await page.type('#username', this.sources.nansen.loginCredentials!.username);
        await page.type('#password', this.sources.nansen.loginCredentials!.password);
        await page.click('button[type="submit"]');
        
        // Wait for login to complete
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
      
      // Navigate to smart money dashboard or API endpoint
      await page.goto(this.sources.nansen.url + '/smart-money-dashboard', { waitUntil: 'networkidle2' });
      
      // Wait for the data to load
      await page.waitForSelector('.wallet-list-item', { timeout: 30000 });
      
      // Extract wallet data
      const walletData = await page.evaluate(() => {
        const wallets: ScrapedWalletData[] = [];
        const walletElements = document.querySelectorAll('.wallet-list-item');
        
        walletElements.forEach(element => {
          // Extract data from the element
          const address = element.getAttribute('data-address');
          if (!address) return;
          
          const label = element.querySelector('.wallet-label')?.textContent?.trim();
          const tags: string[] = [];
          element.querySelectorAll('.tag').forEach(tag => {
            const tagText = tag.textContent?.trim();
            if (tagText) tags.push(tagText);
          });
          
          const performanceText = element.querySelector('.performance-metrics')?.textContent;
          const followersText = element.querySelector('.followers-count')?.textContent;
          
          // Parse performance data
          let performance: PerformanceMetrics = {};
          if (performanceText) {
            const successRateMatch = performanceText.match(/Success Rate: (\d+\.?\d*)%/);
            const totalTradesMatch = performanceText.match(/Total Trades: (\d+)/);
            const avgReturnMatch = performanceText.match(/Avg Return: (\d+\.?\d*)%/);
            
            performance = {
              successRate: successRateMatch ? parseFloat(successRateMatch[1]) : undefined,
              totalTrades: totalTradesMatch ? parseInt(totalTradesMatch[1]) : undefined,
              averageReturn: avgReturnMatch ? parseFloat(avgReturnMatch[1]) : undefined
            };
          }
          
          // Parse followers count
          const followersCount = followersText ? parseInt(followersText.replace(/[^\d]/g, '')) : undefined;
          
          wallets.push({
            address,
            label,
            tags,
            category: element.getAttribute('data-category') || undefined,
            performance,
            followersCount,
            externalId: element.getAttribute('data-id') || undefined
          });
        });
        
        return wallets;
      });
      
      // Close the page
      await page.close();
      
      return walletData;
    } catch (error) {
      this.logger.error('Error scraping from Nansen:', error);
      return [];
    }
  }
  
  // Scrape wallet data from Dune
  async scrapeDune(): Promise<ScrapedWalletData[]> {
    this.logger.info('Scraping wallet data from Dune');
    
    try {
      // For Dune, we'll use API approach instead of scraping
      const response = await axios.get<{ wallets: any[] }>(
        this.sources.dune.url + '/api/smart-wallets', 
        {
          headers: {
            'Authorization': `Bearer ${this.sources.dune.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.wallets) {
        // Transform the API response to our standard format
        const walletData: ScrapedWalletData[] = response.data.wallets.map(wallet => ({
          address: wallet.address,
          label: wallet.name || undefined,
          tags: wallet.tags || [],
          category: wallet.category || undefined,
          performance: {
            successRate: wallet.success_rate,
            totalTrades: wallet.total_trades,
            profitableTrades: wallet.profitable_trades,
            averageReturn: wallet.average_return
          },
          followersCount: wallet.followers || 0,
          externalId: wallet.id
        }));
        
        return walletData;
      }
      
      return [];
    } catch (error) {
      this.logger.error('Error fetching data from Dune API:', error);
      return [];
    }
  }
  
  // Process and store wallet data
  async processWalletData(walletData: ScrapedWalletData[], sourceName: string): Promise<void> {
    for (const wallet of walletData) {
      try {
        // Check if wallet already exists
        const existingWallet = await ExternalWallet.findOne({ address: wallet.address });
        
        if (existingWallet) {
          // Update existing wallet
          const updates: Partial<IExternalWallet> = {
            label: wallet.label || existingWallet.label,
            tags: wallet.tags || existingWallet.tags,
            category: wallet.category || existingWallet.category,
            followersCount: wallet.followersCount || existingWallet.followersCount,
            lastUpdated: new Date(),
            metadataVersion: existingWallet.metadataVersion + 1
          };
          
          // Update performance if provided
          if (wallet.performance) {
            updates.performance = {
              ...existingWallet.performance,
              ...wallet.performance
            };
            
            // Create performance history record if significant changes
            if (this.shouldCreatePerformanceHistory(existingWallet, wallet)) {
              await this.createPerformanceHistoryRecord(wallet);
            }
          }
          
          await ExternalWallet.updateOne({ address: wallet.address }, { $set: updates });
          this.stats.updatedWallets++;
        } else {
          // Create new wallet record
          const newWallet = new ExternalWallet({
            address: wallet.address,
            source: sourceName,
            externalId: wallet.externalId,
            label: wallet.label,
            tags: wallet.tags || [],
            category: wallet.category,
            performance: wallet.performance || {},
            followersCount: wallet.followersCount,
            lastUpdated: new Date()
          });
          
          await newWallet.save();
          this.stats.newWallets++;
          
          // Create initial performance history
          if (wallet.performance) {
            await this.createPerformanceHistoryRecord(wallet);
          }
        }
      } catch (error) {
        this.logger.error(`Error processing wallet ${wallet.address}:`, error);
        this.stats.failedWallets++;
      }
    }
  }
  
  // Determine if we should create a performance history record
  shouldCreatePerformanceHistory(existingWallet: IExternalWallet, newWalletData: ScrapedWalletData): boolean {
    // If no existing performance data, create history
    if (!existingWallet.performance) return true;
    
    // If total trades increased significantly
    if (newWalletData.performance?.totalTrades &&
        existingWallet.performance.totalTrades &&
        newWalletData.performance.totalTrades > existingWallet.performance.totalTrades + 5) {
      return true;
    }
    
    // If success rate changed significantly
    if (newWalletData.performance?.successRate !== undefined &&
        existingWallet.performance.successRate !== undefined &&
        Math.abs(newWalletData.performance.successRate - existingWallet.performance.successRate) > 5) {
      return true;
    }
    
    // Create history every 7 days regardless of changes
    const lastUpdatedTime = new Date(existingWallet.lastUpdated).getTime();
    if (Date.now() - lastUpdatedTime > 7 * 24 * 60 * 60 * 1000) {
      return true;
    }
    
    return false;
  }
  
  // Create wallet performance history record
  async createPerformanceHistoryRecord(wallet: ScrapedWalletData): Promise<void> {
    try {
      const historyRecord = new WalletPerformanceHistory({
        walletAddress: wallet.address,
        date: new Date(),
        successRate: wallet.performance?.successRate,
        totalTrades: wallet.performance?.totalTrades,
        profitableTrades: wallet.performance?.profitableTrades,
        averageReturn: wallet.performance?.averageReturn,
        cumulativeReturn: wallet.performance?.averageReturn, // Simplified for now
        recentTokens: wallet.recentTokens || []
      });
      
      await historyRecord.save();
      this.logger.debug(`Created performance history for ${wallet.address}`);
    } catch (error) {
      this.logger.error(`Error creating performance history for ${wallet.address}:`, error);
    }
  }
  
  // Get all smart wallets with optional filtering
  async getSmartWallets(options: WalletFilterOptions = {}): Promise<WalletPaginationResult> {
    try {
      const query: any = {};
      
      // Apply filters if provided
      if (options.category) {
        query.category = options.category;
      }
      
      if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
      }
      
      if (options.minSuccessRate) {
        query['performance.successRate'] = { $gte: options.minSuccessRate };
      }
      
      if (options.minTrades) {
        query['performance.totalTrades'] = { $gte: options.minTrades };
      }
      
      // Apply sorting
      const sortOptions: any = {};
      if (options.sortBy === 'performance') {
        sortOptions['performance.successRate'] = -1;
      } else if (options.sortBy === 'trades') {
        sortOptions['performance.totalTrades'] = -1;
      } else if (options.sortBy === 'followers') {
        sortOptions.followersCount = -1;
      } else {
        sortOptions.lastUpdated = -1;
      }
      
      // Execute query
      const wallets = await ExternalWallet.find(query)
        .sort(sortOptions)
        .limit(options.limit || 100)
        .skip(options.skip || 0);
      
      // Get total count for pagination
      const totalCount = await ExternalWallet.countDocuments(query);
      
      return {
        wallets,
        totalCount,
        page: options.skip ? Math.floor(options.skip / options.limit!) + 1 : 1,
        pageSize: options.limit || 100,
        pageCount: Math.ceil(totalCount / (options.limit || 100))
      };
    } catch (error) {
      this.logger.error('Error fetching smart wallets:', error);
      throw error;
    }
  }
  
  // Get wallet performance history
  async getWalletPerformanceHistory(address: string, period = 30): Promise<IWalletPerformanceHistory[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);
      
      const history = await WalletPerformanceHistory.find({
        walletAddress: address,
        date: { $gte: startDate }
      }).sort({ date: 1 });
      
      return history;
    } catch (error) {
      this.logger.error(`Error fetching performance history for ${address}:`, error);
      throw error;
    }
  }
  
  // Get statistics about the scraper
  getStats(): ScraperStats {
    return this.stats;
  }
  
  // Force an immediate scrape of a specific source
  async forceScrape(sourceName: string): Promise<void> {
    if (!this.sources[sourceName]) {
      throw new Error(`Unknown source: ${sourceName}`);
    }
    
    this.sources[sourceName].lastFetch = 0; // Reset last fetch time
    return this.scrapeSource(sourceName);
  }
  
  // Clean up resources
  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    this.logger.info('External wallet scraper shut down');
  }
}

export default new ExternalWalletScraper();