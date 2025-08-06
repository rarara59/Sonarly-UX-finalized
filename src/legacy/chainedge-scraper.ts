import * as puppeteer from 'puppeteer';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import ExternalWallet, { IExternalWallet } from '../models/externalWallet';
import { connectToDatabase } from '../utils/database';
import { ClassifiedTransaction, EnhancedWalletData } from '../types/wallet';
import { config } from '.';

// Configuration type
interface ChainEDGEConfig {
  baseUrl: string;
  username: string;
  password: string;
  minWinRate: number;
  minPnL: number;
  minTrades: number;
  minTokensTraded: number;
  minBuyValue: number;
  scrapeInterval: number; // in milliseconds
  walletCategories: {
    sniper: boolean;
    gemSpotter: boolean;
    earlyMover: boolean;
  };
  timeframeFilters: {
    fastTimeframe: boolean; // 1-4 hour trades
    slowTimeframe: boolean; // 4-48 hour trades
  };
  targetSuccessRate: {
    min: number;
    max: number;
  };
  dataCacheTTL: number;
  parallelProcessing: boolean;
  maxRetries: number;
  retryDelay: number;
  cacheDirectory: string;
  adaptiveThresholds: boolean;
}

// Other interfaces
interface TimeframeMetrics {
  totalTrades: number;
  successfulTrades: number;
  winRate: number;
  avgMultiplier: number;
  avgHoldTime: number;
}

interface SelectorHistory {
  selector: string;
  successCount: number;
  failCount: number;
  lastSuccess: Date | null;
  lastFail: Date | null;
}

interface ScrapingJobStats {
  startTime: Date;
  endTime: Date | null;
  category: string;
  walletsFound: number;
  highQualityWallets: number;
  errors: string[];
  success: boolean;
  currentSuccessRate: number | null;
}

export class ChainEDGEScraper {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;
  private config: ChainEDGEConfig;
  private isLoggedIn = false;
  private isRunning = false;
  private stats = {
    totalWalletsSeen: 0,
    walletsProcessed: 0,
    transactionsProcessed: 0,
    highValueWallets: 0,
    scrapingJobs: [] as ScrapingJobStats[],
    lastSuccessRate: null as number | null,
    adaptiveThresholdAdjustments: 0
  };

  private selectorHistory: Record<string, Record<string, SelectorHistory>> = {};
  private walletCache: Map<string, { data: EnhancedWalletData, timestamp: number }> = new Map();
  private knownSuccessfulWallets: Set<string> = new Set();
  private activeScrapingJobs: number = 0;
  private categorySuccessRates: Record<string, number> = {
    'Sniper': 0,
    'Gem Spotter': 0,
    'Early Mover': 0
  };
  private crossCategoryWallets: Map<string, string[]> = new Map();

  constructor(config?: Partial<ChainEDGEConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'https://app.chainedge.io',
      username: config?.username || process.env.CHAINEDGE_USERNAME || '',
      password: config?.password || process.env.CHAINEDGE_PASSWORD || '',
      minWinRate: config?.minWinRate || 75,
      minPnL: config?.minPnL || 50000,
      minTrades: config?.minTrades || 30,
      minTokensTraded: config?.minTokensTraded || 10,
      minBuyValue: config?.minBuyValue || 500,
      scrapeInterval: config?.scrapeInterval || 3600000,
      walletCategories: {
        sniper: config?.walletCategories?.sniper !== undefined ? config.walletCategories.sniper : true,
        gemSpotter: config?.walletCategories?.gemSpotter !== undefined ? config.walletCategories.gemSpotter : true,
        earlyMover: config?.walletCategories?.earlyMover !== undefined ? config.walletCategories.earlyMover : true,
      },
      timeframeFilters: {
        fastTimeframe: config?.timeframeFilters?.fastTimeframe !== undefined ? config.timeframeFilters.fastTimeframe : true,
        slowTimeframe: config?.timeframeFilters?.slowTimeframe !== undefined ? config.timeframeFilters.slowTimeframe : true,
      },
      targetSuccessRate: {
        min: config?.targetSuccessRate?.min || 74,
        max: config?.targetSuccessRate?.max || 76
      },
      dataCacheTTL: config?.dataCacheTTL || 24 * 60 * 60 * 1000,
      parallelProcessing: config?.parallelProcessing || false,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
      cacheDirectory: config?.cacheDirectory || path.join(process.cwd(), 'cache'),
      adaptiveThresholds: config?.adaptiveThresholds !== undefined ? config.adaptiveThresholds : true
    };

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.config.cacheDirectory)) {
      fs.mkdirSync(this.config.cacheDirectory, { recursive: true });
    }

    // Initialize selector history for categories
    const categories = ['Sniper', 'Gem Spotter', 'Early Mover'];
    const selectorTypes = [
      'categoryButton', 'filterButton', 'winRateInput', 
      'pnlInput', 'tradesInput', 'submitButton'
    ];

    categories.forEach(category => {
      this.selectorHistory[category] = {};
      selectorTypes.forEach(type => {
        this.selectorHistory[category][type] = {
          selector: '',
          successCount: 0,
          failCount: 0,
          lastSuccess: null,
          lastFail: null
        };
      });
    });

    // Load cached wallet data if available
    this.loadWalletCache();

    // Validate config
    this.validateConfig();
  }

  // Add this method to your ChainEDGEScraper class
private async login(): Promise<void> {
  if (!this.page) {
    throw new Error('Browser not initialized');
  }

  try {
    logger.info('Logging in to ChainEDGE');

    // Navigate to the login page
    logger.info('Opening login page...');
    await this.page.goto(`${this.config.baseUrl}/login/?next=/`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Take screenshot for debugging
    await this.page.screenshot({ path: 'login-page.png' });
    logger.info('Login page screenshot saved to login-page.png');

    // Wait for login form to load
    await this.page.waitForSelector('input[type="email"], input[name="email"], input#email', { timeout: 10000 });

    // Add delay to ensure page is ready
    await this.page.waitForTimeout(1000);

    // Fill in login form
    logger.info('Filling login form...');
    const emailSelector = 'input[type="email"], input[name="email"], input#email';
    await this.page.type(emailSelector, this.config.username);

    const passwordSelector = 'input[type="password"], input[name="password"], input#password';
    await this.page.type(passwordSelector, this.config.password);

    // Take screenshot before clicking login
    await this.page.screenshot({ path: 'before-login-click.png' });

    // Click login button
    logger.info('Submitting login form...');
    const loginButtonSelector = 'button[type="submit"], button:contains("Sign In"), button:contains("Login")';
    await this.page.click(loginButtonSelector);
    
    // Wait for page to load after login
    await this.page.waitForTimeout(5000);
    
    // Take screenshot after login
    await this.page.screenshot({ path: 'after-login.png' });

    // Check if login was successful
    const loginSuccess = await this.page.evaluate(() => {
      // Look for elements that would indicate successful login
      return !document.querySelector('input[type="password"]') && 
             (document.querySelector('.dashboard, .home, .user-profile, .account') !== null);
    });

    if (!loginSuccess) {
      await this.page.screenshot({ path: 'login-failed.png' });
      throw new Error('Login failed - credentials may be incorrect');
    }

    this.isLoggedIn = true;
    logger.info('Successfully logged in to ChainEDGE');
  } catch (error) {
    logger.error('Failed to log in to ChainEDGE:', error);
    throw error;
  }
}

// Add this method to your ChainEDGEScraper class
public async initialize(): Promise<boolean> {
  try {
    logger.info('Initializing ChainEDGE scraper');
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Use visible browser during development
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1920,1080'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });
    
    // Create a new page
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Log in to ChainEDGE
    await this.login();
    
    logger.info('ChainEDGE scraper initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize ChainEDGE scraper:', error);
    await this.cleanup();
    return false;
  }
}

// Add this method to your ChainEDGEScraper class
public async checkConnection(): Promise<boolean> {
  try {
    logger.info('Checking connection to ChainEDGE...');
    
    // Initialize browser if needed
    if (!this.browser || !this.page) {
      this.browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
    }
    
    // Attempt to visit the homepage
    await this.page.goto(this.config.baseUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take a screenshot
    await this.page.screenshot({ path: 'connection-test.png' });
    
    // Check if we can access the page
    const pageTitle = await this.page.title();
    
    logger.info(`Connection test successful. Page title: ${pageTitle}`);
    return true;
  } catch (error) {
    logger.error('Connection test failed:', error);
    return false;
  }
}

// Add this method to your ChainEDGEScraper class
public async testAuthentication(): Promise<{success: boolean, details: any}> {
  try {
    logger.info('Starting authentication test...');
    
    // Check connection
    const connectionOk = await this.checkConnection();
    if (!connectionOk) {
      logger.error('Connection test failed. Cannot proceed with authentication test.');
      return {
        success: false,
        details: {
          error: 'Connection to site failed'
        }
      };
    }
    
    // Attempt login
    await this.login();
    
    // Verify login success
    const isLoggedIn = await this.page.evaluate(() => {
      // Check multiple indicators of logged-in state
      const hasLoginForm = !!document.querySelector('input[type="password"]');
      const hasLogoutButton = !!document.querySelector('a:contains("Logout"), .logout, [href*="logout"]');
      const hasUserInfo = !!document.querySelector('.user-info, .profile, .account');
      
      return {
        isLoggedIn: !hasLoginForm && (hasLogoutButton || hasUserInfo),
        elements: {
          loginForm: hasLoginForm,
          logoutButton: hasLogoutButton,
          userInfo: hasUserInfo
        },
        url: window.location.href
      };
    });
    
    // Take screenshot evidence
    await this.page.screenshot({ path: 'auth-test-result.png' });
    
    return {
      success: isLoggedIn.isLoggedIn,
      details: {
        ...isLoggedIn,
        credentialsUsed: {
          username: this.config.username,
          password: this.config.password ? '********' : 'not provided'
        }
      }
    };
  } catch (error) {
    logger.error('Authentication test failed:', error);
    return {
      success: false,
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

  getConfig(): ChainEDGEConfig {
    return this.config;
  }

  private validateConfig(): void {
    if (!this.config.username || !this.config.password) {
      throw new Error('ChainEDGE username and password are required');
    }

    // At least one wallet category must be enabled
    if (!this.config.walletCategories.sniper && 
        !this.config.walletCategories.gemSpotter && 
        !this.config.walletCategories.earlyMover) {
      throw new Error('At least one wallet category must be enabled');
    }

    // At least one timeframe filter must be enabled
    if (!this.config.timeframeFilters.fastTimeframe && 
        !this.config.timeframeFilters.slowTimeframe) {
      throw new Error('At least one timeframe filter must be enabled');
    }

    // Validate target success rate
    if (this.config.targetSuccessRate.min < 0 || 
        this.config.targetSuccessRate.max > 100 ||
        this.config.targetSuccessRate.min > this.config.targetSuccessRate.max) {
      throw new Error('Invalid target success rate range');
    }
  }

  private trackWalletCategory(address: string, category: string): void {
    const categories = this.crossCategoryWallets.get(address) || [];
    if (!categories.includes(category)) {
      categories.push(category);
      this.crossCategoryWallets.set(address, categories);
    }
  }

  // Make sure the shutdown method is defined as public, not private
  public async shutdown(): Promise<void> {
    this.isRunning = false;
    await this.cleanup();
    logger.info('ChainEDGE scraper shut down');
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }

    // Save cache before cleanup
    this.saveWalletCache();

    logger.info('Cleaned up ChainEDGE scraper resources');
  }

  private saveWalletCache(): void {
    try {
      const cacheData: Record<string, any> = {};

      this.walletCache.forEach((value, key) => {
        cacheData[key] = value;
      });

      const cachePath = path.join(this.config.cacheDirectory, 'wallet-cache.json');
      fs.writeFileSync(cachePath, JSON.stringify(cacheData), 'utf8');

      logger.info(`Saved ${this.walletCache.size} wallets to cache`);
    } catch (error) {
      logger.error('Error saving wallet cache:', error instanceof Error ? error.message : String(error));
    }
  }

  private loadWalletCache(): void {
    try {
      const cachePath = path.join(this.config.cacheDirectory, 'wallet-cache.json');

      if (fs.existsSync(cachePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

        Object.entries(cacheData).forEach(([key, value]: [string, any]) => {
          this.walletCache.set(key, value);
          
          // Also add to cross-category tracking if appropriate
          if (value.data.category) {
            this.trackWalletCategory(key, value.data.category);
          }
          
          // Add to known successful wallets if in target range
          if (value.data.winRate >= this.config.targetSuccessRate.min && 
              value.data.winRate <= this.config.targetSuccessRate.max) {
            this.knownSuccessfulWallets.add(key);
          }
        });

        logger.info(`Loaded ${this.walletCache.size} wallets from cache`);
      }
    } catch (error) {
      logger.error('Error loading wallet cache:', error instanceof Error ? error.message : String(error));
    }
  }

  async forceScrape(): Promise<void> {
    try {
      await this.scrapeWallets();
    } catch (error) {
      logger.error('Error in forced scrape:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  getStats(): any {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      isLoggedIn: this.isLoggedIn,
      targetSuccessRate: this.config.targetSuccessRate,
      categorySuccessRates: this.categorySuccessRates,
      crossCategoryWallets: this.crossCategoryWallets.size,
      cacheSize: this.walletCache.size,
      knownSuccessfulWallets: this.knownSuccessfulWallets.size
    };
  }

  // Add scrapeWallets method
  async scrapeWallets(): Promise<void> {
    if (!this.isLoggedIn || !this.page) {
      await this.initialize();
    }
    
    try {
      logger.info('Starting to scrape wallet data from ChainEDGE');
      
      // Implementation needed here
      
      logger.info(`Wallet data scraping completed. Stats: ${JSON.stringify(this.stats)}`);
    } catch (error) {
      logger.error('Error scraping wallet data:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Fixed: Add proper class method syntax for startScheduledScraping
  async startScheduledScraping(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scraper is already running');
      return;
    }

    try {
      this.isRunning = true;

      // Initial scrape
      await this.scrapeWallets();

      // Set up interval for recurring scrapes
      setInterval(async () => {
        if (!this.isRunning) return;

        try {
          // Only run if no active scraping jobs
          if (this.activeScrapingJobs === 0) {
            await this.scrapeWallets();
          } else {
            logger.warn(`Skipping scheduled scrape - ${this.activeScrapingJobs} active scraping jobs`);
          }
        } catch (error) {
          logger.error('Error in scheduled scrape:', error instanceof Error ? error.message : String(error));
          
          // Try to reinitialize if needed
          if (!this.isLoggedIn || !this.page) {
            logger.info('Attempting to reinitialize scraper...');
            await this.initialize();
          }
        }
      }, this.config.scrapeInterval);

      logger.info(`Scheduled scraping started with ${this.config.scrapeInterval / 60000} minute interval`);
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to start scheduled scraping:', error instanceof Error ? error.message : String(error));
    }
  }

  // Fixed: Add proper class method syntax for stopScheduledScraping
  async stopScheduledScraping(): Promise<void> {
    this.isRunning = false;
    logger.info('Scheduled scraping stopped');
  }
}

// Singleton implementation
let chainEDGEScraperInstance: ChainEDGEScraper | null = null;

export const getChainEDGEScraper = (config?: Partial<ChainEDGEConfig>): ChainEDGEScraper => {
  if (!chainEDGEScraperInstance) {
    chainEDGEScraperInstance = new ChainEDGEScraper(config);
  }
  return chainEDGEScraperInstance;
};