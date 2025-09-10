// src/services/alpha-stream-scraper.ts

import puppeteer from 'puppeteer';
import winston from 'winston';
import ExternalWallet, { IExternalWallet, IWalletTransaction } from '../models/externalWallet';
import { logger } from '../utils/logger';
import config from '.';

// Scraper configuration type
interface AlphaStreamConfig {
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
}

// Time-specific success metrics interface
interface TimeframeMetrics {
  totalTrades: number;
  successfulTrades: number;
  winRate: number;
  avgMultiplier: number;
  avgHoldTime: number; // in minutes
}

// Transaction with timeframe classification
interface ClassifiedTransaction extends IWalletTransaction {
  timeframe: 'fast' | 'slow' | 'other';
  holdTimeMinutes: number;
  multiplier: number;
}

// Enhanced wallet data with timeframe-specific metrics
interface EnhancedWalletData extends Partial<IExternalWallet> {
  fastTimeframeMetrics?: TimeframeMetrics;
  slowTimeframeMetrics?: TimeframeMetrics;
  memeTokenMetrics?: {
    totalTrades: number;
    successfulTrades: number;
    winRate: number;
    avgMultiplier: number;
  };
  patternSuccessRates?: Record<string, number>;
  entryTiming?: number; // How early they typically get in (percentile)
  exitEfficiency?: number; // How close to top they typically exit (percentile)
  recentTransactions?: ClassifiedTransaction[];
}

export class AlphaStreamScraper {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;
  private config: AlphaStreamConfig;
  private isLoggedIn = false;
  private isRunning = false;
  private stats = {
    totalWalletsSeen: 0,
    walletsProcessed: 0,
    transactionsProcessed: 0,
    highValueWallets: 0,
  };

  constructor(config?: Partial<AlphaStreamConfig>) {
    // Default configuration with values optimized for meme coin detection
    this.config = {
      baseUrl: config?.baseUrl || 'https://alphastream.io',
      username: config?.username || process.env.ALPHA_STREAM_USERNAME || '',
      password: config?.password || process.env.ALPHA_STREAM_PASSWORD || '',
      minWinRate: config?.minWinRate || 75, // Targeting high win rate for 74-76% success goal
      minPnL: config?.minPnL || 50000, // Minimum $50k profit to ensure quality
      minTrades: config?.minTrades || 30, // Statistically significant number
      minTokensTraded: config?.minTokensTraded || 10, // Ensure diverse trading history
      minBuyValue: config?.minBuyValue || 500, // Minimum buy value to filter out small trades
      scrapeInterval: config?.scrapeInterval || 3600000, // Default 1 hour
      walletCategories: {
        sniper: config?.walletCategories?.sniper !== undefined ? config.walletCategories.sniper : true,
        gemSpotter: config?.walletCategories?.gemSpotter !== undefined ? config.walletCategories.gemSpotter : true,
        earlyMover: config?.walletCategories?.earlyMover !== undefined ? config.walletCategories.earlyMover : true,
      },
      timeframeFilters: {
        fastTimeframe: config?.timeframeFilters?.fastTimeframe !== undefined ? config.timeframeFilters.fastTimeframe : true,
        slowTimeframe: config?.timeframeFilters?.slowTimeframe !== undefined ? config.timeframeFilters.slowTimeframe : true,
      }
    };

    // Validate config
    this.validateConfig();
  }

  /**
   * Validate configuration parameters
   */
  private validateConfig(): void {
    if (!this.config.username || !this.config.password) {
      throw new Error('Alpha Stream username and password are required');
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
  }

  /**
   * Initialize the scraper
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing Alpha Stream scraper');
      
      // Launch browser with stealth mode for better detection avoidance
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-infobars',
          '--window-size=1920,1080',
          '--disable-gpu'
        ],
        ignoreHTTPSErrors: true
      });
      
      // Create a new page
      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36');
      
      // Set viewport size
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      // Enable stealth mode
      await this.page.evaluateOnNewDocument(() => {
        // Hide webdriver
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
        
        // Hide Chrome
        window.navigator.chrome = {
          runtime: {} as any
        };
        
        // Hide Automation
        window.navigator.languages = ['en-US', 'en'];
        
        // Overwrite permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => {
          return (parameters.name === 'notifications' 
            ? Promise.resolve({ state: Notification.permission }) 
            : originalQuery(parameters)) as any;
        };
      });
      
      // Log in to Alpha Stream
      await this.login();
      
      logger.info('Alpha Stream scraper initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Alpha Stream scraper:', error instanceof Error ? error.message : String(error));
      await this.cleanup();
      return false;
    }
  }

  /**
   * Log in to Alpha Stream
   */
  private async login(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      logger.info('Logging in to Alpha Stream');
      
      // Navigate to the login page
      await this.page.goto(`${this.config.baseUrl}/login`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Wait for login form to load
      await this.page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email"]', { timeout: 10000 });
      
      // Fill in login form using the selectors from screenshots
      // Looking for email/username input
      const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="email"]';
      await this.page.type(emailSelector, this.config.username);
      
      // Looking for password input
      const passwordSelector = 'input[type="password"], input[name="password"], input[placeholder*="password"]';
      await this.page.type(passwordSelector, this.config.password);
      
      // Click login button
      const loginButtonSelector = 'button[type="submit"], button:contains("Sign In"), button:contains("Login")';
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
        this.page.click(loginButtonSelector)
      ]);
      
      // Check if login was successful
      const isLoggedIn = await this.page.evaluate(() => {
        // Check for elements that would indicate successful login (these are examples, adjust based on actual page)
        return !document.querySelector('input[type="password"]') && 
               (document.querySelector('button:contains("Logout")') !== null ||
                document.querySelector('[data-testid="sniper-filter"]') !== null ||
                document.querySelector('[data-testid="gem-spotter-filter"]') !== null);
      });
      
      if (!isLoggedIn) {
        throw new Error('Login failed - could not verify successful login');
      }
      
      this.isLoggedIn = true;
      logger.info('Successfully logged in to Alpha Stream');
    } catch (error) {
      logger.error('Failed to log in to Alpha Stream:', error instanceof Error ? error.message : String(error));
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Start scheduled scraping
   */
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
          await this.scrapeWallets();
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

  /**
   * Stop scheduled scraping
   */
  async stopScheduledScraping(): Promise<void> {
    this.isRunning = false;
    logger.info('Scheduled scraping stopped');
  }

  /**
   * Scrape wallet data from Alpha Stream
   */
  async scrapeWallets(): Promise<void> {
    if (!this.isLoggedIn || !this.page) {
      await this.initialize();
    }

    try {
      logger.info('Starting to scrape wallet data');
      
      // Get enabled wallet categories
      const categories: string[] = [];
      if (this.config.walletCategories.sniper) categories.push('Sniper');
      if (this.config.walletCategories.gemSpotter) categories.push('Gem Spotter');
      if (this.config.walletCategories.earlyMover) categories.push('Early Mover');
      
      // Process each category
      for (const category of categories) {
        await this.scrapeWalletsByCategory(category);
      }
      
      logger.info(`Wallet data scraping completed. Stats: ${JSON.stringify(this.stats)}`);
    } catch (error) {
      logger.error('Error scraping wallet data:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Scrape wallets for a specific category
   */
  private async scrapeWalletsByCategory(category: string): Promise<void> {
    if (!this.page) return;

    try {
      logger.info(`Scraping ${category} wallets`);
      
      // Navigate to main page
      await this.page.goto(this.config.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Wait for the page to fully load
      await this.page.waitForSelector('.filter, [data-testid="sniper-filter"], [data-testid="gem-spotter-filter"], [data-testid="early-mover-filter"]', { 
        timeout: 15000 
      });
      
      // Click on the appropriate filter button based on category
      // Use the selectors visible in screenshots
      if (category === 'Sniper') {
        await this.page.click('.sniper-filter, [data-testid="sniper-filter"], .filter:has-text("SNIPER")');
      } else if (category === 'Gem Spotter') {
        await this.page.click('.gem-spotter-filter, [data-testid="gem-spotter-filter"], .filter:has-text("GEM SPOTTER")');
      } else if (category === 'Early Mover') {
        await this.page.click('.early-mover-filter, [data-testid="early-mover-filter"], .filter:has-text("EARLY MOVER")');
      }
      
      // Wait for results to load
      await this.page.waitForTimeout(2000);
      
      // Click advanced filter button (from first screenshot)
      await this.page.click('.advanced-filter-button, button:contains("More Filters")');
      
      // Wait for filter modal to appear
      await this.page.waitForSelector('input[placeholder*="PNL"], input[name="pnl"]', { timeout: 5000 });
      
      // Set win rate filter
      const winRateInput = await this.page.$('input[placeholder*="Win Rate"], input[name="winRate"]');
      if (winRateInput) {
        await winRateInput.click({ clickCount: 3 }); // Select all text
        await winRateInput.type(this.config.minWinRate.toString());
      }
      
      // Set PNL filter
      const pnlInput = await this.page.$('input[placeholder*="PNL"], input[name="pnl"]');
      if (pnlInput) {
        await pnlInput.click({ clickCount: 3 });
        await pnlInput.type(this.config.minPnL.toString());
      }
      
      // Set trades filter
      const tradesInput = await this.page.$('input[placeholder*="Wallet"], input[name="trades"]');
      if (tradesInput) {
        await tradesInput.click({ clickCount: 3 });
        await tradesInput.type(this.config.minTrades.toString());
      }
      
      // Set min buy value
      const buyValueInput = await this.page.$('input[placeholder*="Min Buy"], input[name="minBuy"]');
      if (buyValueInput) {
        await buyValueInput.click({ clickCount: 3 });
        await buyValueInput.type(this.config.minBuyValue.toString());
      }
      
      // Apply filters
      const submitButton = await this.page.$('button:contains("Submit"), .submit-button');
      if (submitButton) {
        await Promise.all([
          this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
          submitButton.click()
        ]);
      }
      
      // Wait for results to load
      await this.page.waitForTimeout(3000);
      
      // Extract wallet data
      const wallets = await this.extractWalletData(category);
      this.stats.totalWalletsSeen += wallets.length;
      
      // Filter wallets to only those meeting our criteria
      const highQualityWallets = this.filterHighQualityWallets(wallets);
      this.stats.highValueWallets += highQualityWallets.length;
      
      logger.info(`Found ${wallets.length} ${category} wallets, ${highQualityWallets.length} meet high quality criteria`);
      
      // Process each high quality wallet
      for (const wallet of highQualityWallets) {
        // Save wallet to database
        await this.saveWallet(wallet);
        
        // Get detailed transaction data for the wallet
        await this.getWalletTransactions(wallet.address);
        
        this.stats.walletsProcessed++;
      }
      
      logger.info(`Processed ${highQualityWallets.length} ${category} wallets`);
    } catch (error) {
      logger.error(`Error scraping ${category} wallets:`, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Extract wallet data from the page
   */
  private async extractWalletData(category: string): Promise<EnhancedWalletData[]> {
    if (!this.page) return [];

    // Extract wallet data from the page using page.evaluate
    // This will use selectors based on the Alpha Stream screenshots
    return await this.page.evaluate((category) => {
      const wallets: EnhancedWalletData[] = [];
      
      // Get all wallet rows
      const walletRows = document.querySelectorAll('.wallet-row, [data-testid="wallet-row"], tr');
      
      walletRows.forEach(row => {
        try {
          // Extract address from the address column (visible in screenshot 4)
          const addressEl = row.querySelector('.address, [data-testid="address"]');
          // Extract the full address, not just the displayed shortened version
          let address = '';
          
          // Try different methods to extract the address
          if (addressEl) {
            // Either directly from text content
            address = addressEl.textContent?.trim() || '';
            
            // Or from data attribute if available
            if (address.includes('...') && addressEl.getAttribute('data-address')) {
              address = addressEl.getAttribute('data-address') || '';
            }
          }
          
          // If address not found in a regular element, look for it in a tooltip or title attribute
          if (!address || address.includes('...')) {
            const walletInfoEl = row.querySelector('[title*="0x"], [data-address]');
            if (walletInfoEl) {
              address = walletInfoEl.getAttribute('data-address') || 
                      walletInfoEl.getAttribute('title') || '';
            }
          }
          
          // Last resort: try to extract from onclick handler or other attributes
          if (!address || address.includes('...')) {
            const possibleElements = Array.from(row.querySelectorAll('*'));
            for (const el of possibleElements) {
              const onClick = el.getAttribute('onclick') || '';
              if (onClick.includes('wallet') && onClick.includes('0x')) {
                const match = onClick.match(/0x[a-fA-F0-9]{40}/);
                if (match) {
                  address = match[0];
                  break;
                }
              }
            }
          }
          
          // Skip if no valid address found
          if (!address || address.includes('...')) return;
          
          // Try to extract wallet info from hover tooltip if available (from screenshot 4)
          let winRate = 0;
          let totalPnL = 0;
          let successfulTrades = 0;
          let totalTrades = 0;
          let avgHoldTime = '';
          
          // Check for tooltip with detailed stats
          const tooltipContent = row.querySelector('.tooltip-content, .hover-info');
          if (tooltipContent) {
            const tooltipText = tooltipContent.textContent || '';
            
            // Extract win rate: "Win Rate:34.83%"
            const winRateMatch = tooltipText.match(/Win Rate:?\s*(\d+\.?\d*)%/);
            winRate = winRateMatch ? parseFloat(winRateMatch[1]) : 0;
            
            // Extract PnL: "PnL:$97.48K"
            const pnlMatch = tooltipText.match(/PnL:?\s*\$([0-9,.]+)([KM]?)/);
            if (pnlMatch) {
              const baseValue = parseFloat(pnlMatch[1].replace(/,/g, ''));
              const multiplier = pnlMatch[2] === 'K' ? 1000 : pnlMatch[2] === 'M' ? 1000000 : 1;
              totalPnL = baseValue * multiplier;
            }
            
            // Extract trades: "Successful Trades:225 | Total Trades:646"
            const tradesMatch = tooltipText.match(/Successful Trades:?\s*(\d+)\s*\|?\s*Total Trades:?\s*(\d+)/);
            if (tradesMatch) {
              successfulTrades = parseInt(tradesMatch[1]);
              totalTrades = parseInt(tradesMatch[2]);
            } else {
              // Alternative format: "225/646"
              const altTradesMatch = tooltipText.match(/(\d+)\/(\d+)/);
              if (altTradesMatch) {
                successfulTrades = parseInt(altTradesMatch[1]);
                totalTrades = parseInt(altTradesMatch[2]);
              }
            }
            
            // Extract avg hold time: "Avg Hold time: 2h 15m"
            const holdTimeMatch = tooltipText.match(/Avg Hold time:?\s*([0-9hmd\s]+)/);
            avgHoldTime = holdTimeMatch ? holdTimeMatch[1].trim() : '';
          }
          
          // If tooltip not found, try extracting from cells directly (based on the table in screenshot 7)
          if (winRate === 0 || totalPnL === 0) {
            // Look for win rate cell (often displayed as a percentage like "35%")
            const winRateEl = row.querySelector('.win-rate, [data-testid="win-rate"]');
            if (winRateEl) {
              const winRateText = winRateEl.textContent?.trim() || '';
              winRate = parseFloat(winRateText.replace('%', ''));
            }
            
            // Look for PnL cell
            const pnlEl = row.querySelector('.pnl, [data-testid="pnl"]');
            if (pnlEl) {
              const pnlText = pnlEl.textContent?.trim() || '0';
              if (pnlText.includes('K')) {
                totalPnL = parseFloat(pnlText.replace(/[^0-9.]/g, '')) * 1000;
              } else if (pnlText.includes('M')) {
                totalPnL = parseFloat(pnlText.replace(/[^0-9.]/g, '')) * 1000000;
              } else {
                totalPnL = parseFloat(pnlText.replace(/[^0-9.]/g, ''));
              }
            }
            
            // Look for trades cell (often in format "225/646")
            const tradesEl = row.querySelector('.trades, [data-testid="trades"]');
            if (tradesEl) {
              const tradesText = tradesEl.textContent?.trim() || '';
              const tradeParts = tradesText.split('/');
              if (tradeParts.length === 2) {
                successfulTrades = parseInt(tradeParts[0].trim());
                totalTrades = parseInt(tradeParts[1].trim());
              }
            }
            
            // Look for hold time cell
            const holdTimeEl = row.querySelector('.avg-hold-time, [data-testid="hold-time"]');
            if (holdTimeEl) {
              avgHoldTime = holdTimeEl.textContent?.trim() || '';
            }
          }
          
          // Add wallet to results if it has valid data
          if (address && (winRate > 0 || totalPnL > 0)) {
            wallets.push({
              address,
              network: 'solana', // From the tabs in screenshots 3, 5, 6
              category,
              winRate,
              totalPnL,
              successfulTrades,
              totalTrades,
              avgHoldTime,
              isActive: true,
              lastUpdated: new Date()
            });
          }
        } catch (error) {
          console.error('Error parsing wallet row:', error);
        }
      });
      
      return wallets;
    }, category);
  }

  /**
   * Filter to get only high quality wallets worth analyzing further
   */
  private filterHighQualityWallets(wallets: EnhancedWalletData[]): EnhancedWalletData[] {
    // Apply additional filtering to find the most promising wallets
    return wallets.filter(wallet => {
      // Must have sufficient win rate (this is key for our 74-76% target)
      if (wallet.winRate < this.config.minWinRate) return false;
      
      // Must have sufficient PnL to demonstrate real success
      if (wallet.totalPnL < this.config.minPnL) return false;
      
      // Must have enough trades for statistical significance
      if (wallet.totalTrades < this.config.minTrades) return false;
      
      // Check hold time to match our timeframe requirements
      if (this.config.timeframeFilters.fastTimeframe || this.config.timeframeFilters.slowTimeframe) {
        const holdTime = this.parseHoldTime(wallet.avgHoldTime);
        
        // If we only want fast timeframe wallets (1-4h)
        if (this.config.timeframeFilters.fastTimeframe && !this.config.timeframeFilters.slowTimeframe) {
          return holdTime <= 240; // 4 hours in minutes
        }
        
        // If we only want slow timeframe wallets (4-48h)
        if (!this.config.timeframeFilters.fastTimeframe && this.config.timeframeFilters.slowTimeframe) {
          return holdTime >= 240 && holdTime <= 2880; // Between 4 and 48 hours
        }
        
        // If we want both timeframes, no additional filtering needed
      }
      
      return true;
    });
  }

  /**
   * Parse hold time string to minutes
   * Convert strings like "2h 15m" to minutes
   */
  private parseHoldTime(holdTime: string): number {
    if (!holdTime) return 0;
    
    let totalMinutes = 0;
    
    // Extract hours
    const hourMatch = holdTime.match(/(\d+)\s*h/);
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    
    // Extract minutes
    const minuteMatch = holdTime.match(/(\d+)\s*m/);
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }
    
    // Extract days
    const dayMatch = holdTime.match(/(\d+)\s*d/);
    if (dayMatch) {
      totalMinutes += parseInt(dayMatch[1]) * 24 * 60;
    }
    
    return totalMinutes;
  }

  /**
   * Get and save wallet transactions
   */
  private async getWalletTransactions(address: string): Promise<void> {
    if (!this.page) return;

    try {
      logger.info(`Getting transactions for wallet ${address}`);
      
      // Navigate to wallet detail page
      await this.page.goto(`${this.config.baseUrl}/wallet/${address}`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Wait for transaction data to load
      await this.page.waitForSelector('table, .transaction-table, .tx-table', { 
        timeout: 15000 
      }).catch(() => {
        logger.warn(`No transaction table found for wallet ${address}`);
      });
      
      // Extract transaction data
      const transactions = await this.page.evaluate((minBuyValue) => {
        const txs: any[] = [];
        
        // Get all transaction rows
        const txRows = document.querySelectorAll('table tr, .transaction-row, .tx-row');
        
        if (txRows.length <= 1) { // Skip if only header row exists
          return txs;
        }
        
        txRows.forEach((row, index) => {
          // Skip header row
          if (index === 0 && row.querySelector('th')) return;
          
          try {
            // Extract transaction data based on columns from screenshot 7
            
            // BUY TOKEN column
            const buyTokenEl = row.querySelector('.buy-token, [data-testid="buy-token"]');
            const tokenSymbol = buyTokenEl ? buyTokenEl.textContent?.trim() : '';
            
            // Look for token address in various attributes
            let tokenAddress = '';
            const tokenAddressEl = row.querySelector('[data-token-address], [data-address]');
            if (tokenAddressEl) {
              tokenAddress = tokenAddressEl.getAttribute('data-token-address') || 
                            tokenAddressEl.getAttribute('data-address') || '';
            }
            
            // BUY PRICE column
            const buyPriceEl = row.querySelector('.buy-price, [data-testid="buy-price"]');
            let buyPrice = 0;
            if (buyPriceEl) {
              const buyPriceText = buyPriceEl.textContent?.trim() || '0';
              buyPrice = parseFloat(buyPriceText.replace(/[$,]/g, ''));
            }
            
            // Buy token amount
            const buyAmountEl = row.querySelector('.buy-amount, [data-testid="buy-amount"]');
            let buyAmount = 0;
            if (buyAmountEl) {
              const buyAmountText = buyAmountEl.textContent?.trim() || '0';
              
              // Handle K/M suffixes
              if (buyAmountText.includes('K')) {
                buyAmount = parseFloat(buyAmountText.replace(/[^0-9.]/g, '')) * 1000;
              } else if (buyAmountText.includes('M')) {
                buyAmount = parseFloat(buyAmountText.replace(/[^0-9.]/g, '')) * 1000000;
              } else {
                buyAmount = parseFloat(buyAmountText.replace(/[^0-9.]/g, ''));
              }
            }
            
            // BUY TIME
            const buyTimeEl = row.querySelector('.buy-time, [data-testid="time"]');
            let buyTimestamp = new Date();
            if (buyTimeEl) {
              const timeText = buyTimeEl.textContent?.trim() || '';
              const dateAttr = buyTimeEl.getAttribute('data-timestamp');
              
              if (dateAttr) {
                buyTimestamp = new Date(parseInt(dateAttr));
              } else {
                // Try to parse the time string (format from screenshot 7: 2025-02-25 04:15)
                try {
                  buyTimestamp = new Date(timeText);
                } catch (e) {
                  // Keep default timestamp if parsing fails
                }
              }
            }
            
            // SELL TOKEN column
            const sellTokenEl = row.querySelector('.sell-token, [data-testid="sell-token"]');
            
            // SELL PRICE column
            const sellPriceEl = row.querySelector('.sell-price, [data-testid="sell-price"]');
            let sellPrice = 0;
            if (sellPriceEl) {
              const sellPriceText = sellPriceEl.textContent?.trim() || '0';
              sellPrice = parseFloat(sellPriceText.replace(/[$,]/g, ''));
            }
            
            // Sell amount
            const sellAmountEl = row.querySelector('.sell-amount, [data-testid="sell-amount"]');
            let sellAmount = 0;
            if (sellAmountEl) {
              const sellAmountText = sellAmountEl.textContent?.trim() || '0';
              
              // Handle K/M suffixes
              if (sellAmountText.includes('K')) {
                sellAmount = parseFloat(sellAmountText.replace(/[^0-9.]/g, '')) * 1000;
              } else if (sellAmountText.includes('M')) {
                sellAmount = parseFloat(sellAmountText.replace(/[^0-9.]/g, '')) * 1000000;
              } else {
                sellAmount = parseFloat(sellAmountText.replace(/[^0-9.]/g, ''));
              }
            }
            
            // Sell timestamp
            const sellTimeEl = row.querySelector('.sell-time, [data-testid="sell-time"]');
            let sellTimestamp = null;
            if (sellTimeEl) {
              const timeText = sellTimeEl.textContent?.trim() || '';
              const dateAttr = sellTimeEl.getAttribute('data-timestamp');
              
              if (dateAttr) {
                sellTimestamp = new Date(parseInt(dateAttr));
              } else if (timeText && timeText !== '-') {
                try {
                  sellTimestamp = new Date(timeText);
                } catch (e) {
                  // Keep null if parsing fails
                }
              }
            }
            
            // PnL value
            const pnlEl = row.querySelector('.pnl, [data-testid="pnl"]');
            let pnlValue = 0;
            if (pnlEl) {
              const pnlText = pnlEl.textContent?.trim() || '0';
              
              // Handle K/M suffixes and signs
              let multiplier = 1;
              if (pnlText.includes('K')) {
                multiplier = 1000;
              } else if (pnlText.includes('M')) {
                multiplier = 1000000;
              }
              
              pnlValue = parseFloat(pnlText.replace(/[^0-9.-]/g, '')) * multiplier;
              
              // Handle negative values if the text contains a minus sign but got lost in parsing
              if (pnlText.includes('-') && pnlValue > 0) {
                pnlValue = -pnlValue;
              }
            }
            
            // PnL percentage
            const pnlPercentEl = row.querySelector('.pnl-percent, [data-testid="pnl-percent"]');
            let pnlPercentage = 0;
            if (pnlPercentEl) {
              const percentText = pnlPercentEl.textContent?.trim() || '0%';
              pnlPercentage = parseFloat(percentText.replace(/[^0-9.-]/g, ''));
              
              // Handle negative percentage
              if (percentText.includes('-') && pnlPercentage > 0) {
                pnlPercentage = -pnlPercentage;
              }
            } else if (sellPrice > 0 && buyPrice > 0) {
              // Calculate if not provided
              pnlPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
            }
            
            // Transaction value
            const txValueEl = row.querySelector('.tx-value, [data-testid="txn-value"]');
            let transactionValue = 0;
            if (txValueEl) {
              const valueText = txValueEl.textContent?.trim() || '0';
              
              // Handle K/M suffixes
              if (valueText.includes('K')) {
                transactionValue = parseFloat(valueText.replace(/[^0-9.]/g, '')) * 1000;
              } else if (valueText.includes('M')) {
                transactionValue = parseFloat(valueText.replace(/[^0-9.]/g, '')) * 1000000;
              } else {
                transactionValue = parseFloat(valueText.replace(/[^0-9.]/g, ''));
              }
            } else {
              // Calculate from buy price and amount if available
              transactionValue = buyPrice * buyAmount;
            }
            
            // Skip small transactions
            if (transactionValue < minBuyValue) {
              return;
            }
            
            // Chain column
            const chainEl = row.querySelector('.chain, [data-testid="chain"]');
            let chain = 'solana'; // Default from screenshots
            if (chainEl) {
              chain = chainEl.textContent?.trim().toLowerCase() || 'solana';
            }
            
            // Calculate holding period if we have both buy and sell timestamps
            let holdingPeriodMinutes = 0;
            if (sellTimestamp) {
              holdingPeriodMinutes = Math.round((sellTimestamp.getTime() - buyTimestamp.getTime()) / (1000 * 60));
            }
            
            // Create transaction object
            const tx = {
              tokenSymbol: tokenSymbol || 'Unknown',
              tokenAddress: tokenAddress || '',
              buyPrice,
              sellPrice,
              buyAmount,
              sellAmount,
              buyTimestamp,
              sellTimestamp,
              pnlValue,
              pnlPercentage,
              transactionValue,
              chain,
              isSuccessful: pnlValue > 0,
              // Enhanced fields for timeframe analysis
              holdTimeMinutes: holdingPeriodMinutes,
              timeframe: (holdingPeriodMinutes > 0 && holdingPeriodMinutes <= 240) ? 'fast' : 
                        (holdingPeriodMinutes > 240 && holdingPeriodMinutes <= 2880) ? 'slow' : 'other',
              multiplier: sellPrice > 0 ? (sellPrice / buyPrice) : 0
            };
            
            txs.push(tx);
          } catch (error) {
            console.error('Error parsing transaction row:', error);
          }
        });
        
        return txs;
      }, this.config.minBuyValue);
      
      // Skip if no transactions found
      if (!transactions || transactions.length === 0) {
        logger.warn(`No transactions found for wallet ${address}`);
        return;
      }
      
      // Process and analyze transactions to extract valuable metrics
      const enrichedTransactions = this.analyzeTransactions(transactions);
      
      // Save transactions to database
      await this.saveWalletTransactions(address, enrichedTransactions);
      
      this.stats.transactionsProcessed += transactions.length;
      logger.info(`Saved ${transactions.length} transactions for wallet ${address}`);
    } catch (error) {
      logger.error(`Error getting transactions for wallet ${address}:`, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Analyze transactions to extract key metrics for meme coin success
   */
  private analyzeTransactions(transactions: any[]): ClassifiedTransaction[] {
    // Categorize transactions by timeframe
    const fastTimeframeTransactions = transactions.filter(tx => 
      tx.holdTimeMinutes > 0 && tx.holdTimeMinutes <= 240);
    
    const slowTimeframeTransactions = transactions.filter(tx => 
      tx.holdTimeMinutes > 240 && tx.holdTimeMinutes <= 2880);
    
    // Analyze meme tokens (indicators: high volatility, >4x potential)
    const memeTokenTransactions = transactions.filter(tx => 
      (tx.pnlPercentage > 100 || tx.multiplier >= 2));
    
    // Calculate timeframe success rates
    const fastTimeframeSuccess = fastTimeframeTransactions.filter(tx => tx.isSuccessful).length / 
                               (fastTimeframeTransactions.length || 1);
    
    const slowTimeframeSuccess = slowTimeframeTransactions.filter(tx => tx.isSuccessful).length / 
                               (slowTimeframeTransactions.length || 1);
    
    // Enhance transactions with additional metadata
    return transactions.map(tx => ({
      ...tx,
      // Add metadata about this transaction type's success rate
      meta: {
        timeframeSuccessRate: tx.timeframe === 'fast' ? fastTimeframeSuccess * 100 : 
                            tx.timeframe === 'slow' ? slowTimeframeSuccess * 100 : 0,
        isMemeToken: memeTokenTransactions.some(m => 
          m.tokenAddress === tx.tokenAddress && m.tokenSymbol === tx.tokenSymbol),
        // Higher entry timing score means they got in earlier
        entryTimingScore: tx.multiplier >= 4 ? 100 : tx.multiplier >= 2 ? 75 : tx.multiplier >= 1.5 ? 50 : 25
      }
    }));
  }

  /**
   * Save wallet data to database with enhanced metrics
   */
  private async saveWallet(walletData: EnhancedWalletData): Promise<void> {
    try {
      // Check if wallet already exists
      let wallet = await ExternalWallet.findOne({ address: walletData.address });
      
      if (wallet) {
        // Update existing wallet with basic fields
        wallet.winRate = walletData.winRate || wallet.winRate;
        wallet.totalPnL = walletData.totalPnL || wallet.totalPnL;
        wallet.successfulTrades = walletData.successfulTrades || wallet.successfulTrades;
        wallet.totalTrades = walletData.totalTrades || wallet.totalTrades;
        wallet.avgHoldTime = walletData.avgHoldTime || wallet.avgHoldTime;
        wallet.category = walletData.category || wallet.category;
        wallet.lastUpdated = new Date();
        
        // Keep transactions intact - we'll update them separately
        
        await wallet.save();
        logger.info(`Updated wallet ${walletData.address}`);
      } else {
        // Create new wallet
        wallet = new ExternalWallet({
          address: walletData.address,
          network: walletData.network || 'solana',
          category: walletData.category,
          winRate: walletData.winRate || 0,
          totalPnL: walletData.totalPnL || 0,
          successfulTrades: walletData.successfulTrades || 0,
          totalTrades: walletData.totalTrades || 0,
          avgHoldTime: walletData.avgHoldTime || '',
          firstSeen: new Date(),
          lastUpdated: new Date(),
          isActive: true,
          transactions: [], // Start with empty transactions
          // Initialize metadata
          metadata: {
            preferredTokens: [],
            tradingFrequency: this.calculateTradingFrequency(walletData.totalTrades || 0),
            lastActiveTimestamp: new Date()
          }
        });
        
        await wallet.save();
        logger.info(`Created new wallet ${walletData.address}`);
      }
    } catch (error) {
      logger.error(`Error saving wallet ${walletData.address}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Save wallet transactions to database with timeframe analysis
   */
  private async saveWalletTransactions(address: string, transactions: ClassifiedTransaction[]): Promise<void> {
    try {
      // Get wallet from database
      const wallet = await ExternalWallet.findOne({ address });
      
      if (!wallet) {
        logger.error(`Wallet ${address} not found for transaction update`);
        return;
      }
      
      // Update transactions
      wallet.transactions = transactions;
      
      // Update metadata with enhanced metrics
      
      // 1. Calculate timeframe-specific metrics
      const fastTimeframeTransactions = transactions.filter(tx => tx.timeframe === 'fast');
      const slowTimeframeTransactions = transactions.filter(tx => tx.timeframe === 'slow');
      const memeTokenTransactions = transactions.filter(tx => 
        tx.meta?.isMemeToken || tx.multiplier >= 4 || tx.pnlPercentage >= 300);
      
      // 2. Calculate preferred tokens
      const tokenFrequency: Record<string, number> = {};
      transactions.forEach(tx => {
        const symbol = tx.tokenSymbol || 'unknown';
        tokenFrequency[symbol] = (tokenFrequency[symbol] || 0) + 1;
      });
      
      // Sort by frequency and get top 5
      const preferredTokens = Object.entries(tokenFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
      
      // 3. Calculate average multipliers
      const fastTimeframeMultiplier = this.calculateAverageMultiplier(fastTimeframeTransactions);
      const slowTimeframeMultiplier = this.calculateAverageMultiplier(slowTimeframeTransactions);
      const memeTokenMultiplier = this.calculateAverageMultiplier(memeTokenTransactions);
      
      // 4. Calculate success rates
      const fastTimeframeSuccessRate = this.calculateSuccessRate(fastTimeframeTransactions);
      const slowTimeframeSuccessRate = this.calculateSuccessRate(slowTimeframeTransactions);
      const memeTokenSuccessRate = this.calculateSuccessRate(memeTokenTransactions);
      
      // 5. Calculate entry timing
      const entryTimingScore = transactions
        .filter(tx => tx.meta?.entryTimingScore)
        .reduce((sum, tx) => sum + (tx.meta?.entryTimingScore || 0), 0) / 
        (transactions.filter(tx => tx.meta?.entryTimingScore).length || 1);
      
      // Update wallet with enhanced metrics
      wallet.metadata = {
        ...wallet.metadata,
        preferredTokens,
        tradingFrequency: this.calculateTradingFrequency(wallet.totalTrades),
        lastActiveTimestamp: new Date(),
        // Enhanced metrics for targeted meme coin detection
        fastTimeframeStats: {
          count: fastTimeframeTransactions.length,
          successRate: fastTimeframeSuccessRate,
          avgMultiplier: fastTimeframeMultiplier
        },
        slowTimeframeStats: {
          count: slowTimeframeTransactions.length,
          successRate: slowTimeframeSuccessRate,
          avgMultiplier: slowTimeframeMultiplier
        },
        memeTokenStats: {
          count: memeTokenTransactions.length,
          successRate: memeTokenSuccessRate,
          avgMultiplier: memeTokenMultiplier
        },
        entryTimingScore: entryTimingScore,
        // 4x score - specifically for our meme coin 4x minimum return goal
        achieves4xScore: this.calculate4xSuccessScore(transactions)
      };
      
      // Calculate the overall reputation score based on our goal
      const memeMultiplierWeight = 0.4;  // 40% weight for meme token multiplier
      const successRateWeight = 0.3;     // 30% weight for success rate
      const entryTimingWeight = 0.2;     // 20% weight for entry timing
      const tradeCountWeight = 0.1;      // 10% weight for trade count
      
      // Calculate score components
      const memeMultiplierScore = Math.min(100, (memeTokenMultiplier / 4) * 100); // Normalize to 4x target
      const successRateScore = wallet.winRate;
      const entryTimingScoreNormalized = entryTimingScore;
      const tradeCountScore = Math.min(100, (wallet.totalTrades / 50) * 100); // 50+ trades is ideal
      
      // Calculate weighted score
      const weightedScore = (
        memeMultiplierScore * memeMultiplierWeight +
        successRateScore * successRateWeight +
        entryTimingScoreNormalized * entryTimingWeight +
        tradeCountScore * tradeCountWeight
      );
      
      // Update reputation score
      wallet.reputationScore = weightedScore;
      
      // Save all updates
      await wallet.save();
      
      logger.info(`Updated wallet ${address} with ${transactions.length} transactions and enhanced metrics`);
    } catch (error) {
      logger.error(`Error saving transactions for wallet ${address}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Calculate average multiplier for a set of transactions
   */
  private calculateAverageMultiplier(transactions: ClassifiedTransaction[]): number {
    if (!transactions.length) return 0;
    
    // Filter to completed trades only
    const completedTrades = transactions.filter(tx => tx.sellTimestamp !== null);
    if (!completedTrades.length) return 0;
    
    // Calculate average multiplier
    return completedTrades.reduce((sum, tx) => sum + (tx.multiplier || 0), 0) / completedTrades.length;
  }

  /**
   * Calculate success rate for a set of transactions
   */
  private calculateSuccessRate(transactions: ClassifiedTransaction[]): number {
    if (!transactions.length) return 0;
    
    const successfulTrades = transactions.filter(tx => tx.isSuccessful).length;
    return (successfulTrades / transactions.length) * 100;
  }

  /**
   * Calculate trading frequency label
   */
  private calculateTradingFrequency(tradeCount: number): string {
    if (tradeCount >= 500) return 'Very High';
    if (tradeCount >= 200) return 'High';
    if (tradeCount >= 50) return 'Medium';
    if (tradeCount >= 10) return 'Low';
    return 'Very Low';
  }

  /**
   * Calculate 4x success score - specific to our project goal
   * Measures how often this wallet achieves 4x returns
   */
  private calculate4xSuccessScore(transactions: ClassifiedTransaction[]): number {
    if (!transactions.length) return 0;
    
    // Filter to completed trades only
    const completedTrades = transactions.filter(tx => tx.sellTimestamp !== null);
    if (!completedTrades.length) return 0;
    
    // Count trades with 4x or greater returns
    const fourXTrades = completedTrades.filter(tx => tx.multiplier >= 4).length;
    
    // Calculate percentage
    return (fourXTrades / completedTrades.length) * 100;
  }

  /**
   * Get wallet statistics for the highest quality wallets
   */
  async getHighQualityWallets(options: {
    minWinRate?: number;
    minReputation?: number;
    minMemeSuccess?: number;
    limit?: number;
  } = {}): Promise<IExternalWallet[]> {
    try {
      // Set default filters
      const minWinRate = options.minWinRate || 70;
      const minReputation = options.minReputation || 75;
      const minMemeSuccess = options.minMemeSuccess || 60;
      const limit = options.limit || 20;
      
      // Query for high quality wallets
      const wallets = await ExternalWallet.find({
        winRate: { $gte: minWinRate },
        reputationScore: { $gte: minReputation },
        'metadata.memeTokenStats.successRate': { $gte: minMemeSuccess },
        'metadata.achieves4xScore': { $gte: 30 } // At least 30% of trades achieve 4x
      })
      .sort({ reputationScore: -1 })
      .limit(limit);
      
      return wallets;
    } catch (error) {
      logger.error('Error getting high quality wallets:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Get statistics about the scraper
   */
  getStats(): any {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      isLoggedIn: this.isLoggedIn
    };
  }

  /**
   * Force an immediate scrape
   */
  async forceScrape(): Promise<void> {
    try {
      await this.scrapeWallets();
    } catch (error) {
      logger.error('Error in forced scrape:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }
    logger.info('Cleaned up Alpha Stream scraper resources');
  }

  /**
   * Shut down the scraper
   */
  async shutdown(): Promise<void> {
    this.isRunning = false;
    await this.cleanup();
    logger.info('Alpha Stream scraper shut down');
  }
}

// Create a singleton instance with default configuration
let alphaStreamScraperInstance: AlphaStreamScraper | null = null;

/**
 * Get or create the AlphaStreamScraper instance
 */
export const getAlphaStreamScraper = (config?: Partial<AlphaStreamConfig>): AlphaStreamScraper => {
  if (!alphaStreamScraperInstance) {
    alphaStreamScraperInstance = new AlphaStreamScraper(config);
  }
  return alphaStreamScraperInstance;
};

// Export the class and factory function
export default AlphaStreamScraper;