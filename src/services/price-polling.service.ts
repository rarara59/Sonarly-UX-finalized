// src/services/price-polling.service.ts
import { PerformanceMonitoringService } from './performance-monitoring.service';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

interface ActiveTrade {
  tokenAddress: string;
  detectionTimestamp: Date;
  status: string;
  _id: any;
}

export class PricePollingService {
  private performanceMonitor: PerformanceMonitoringService;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private pollCount: number = 0;

  constructor() {
    // Initialize with MongoDB connection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection required. Make sure mongoose is connected before creating PricePollingService.');
    }
    this.performanceMonitor = new PerformanceMonitoringService(db);
  }

  /**
   * Start the price polling service
   */
  async startPolling(intervalMinutes: number = 5): Promise<void> {
    if (this.isRunning) {
      logger.info('💰 Price polling already running');
      return;
    }

    logger.info(`🚀 Starting price polling every ${intervalMinutes} minutes`);
    this.isRunning = true;

    // Run immediately, then on interval
    await this.pollActiveTrades();
    
    this.intervalId = setInterval(async () => {
      try {
        await this.pollActiveTrades();
      } catch (error) {
        logger.error('💥 Error in price polling cycle:', error);
      }
    }, intervalMinutes * 60 * 1000);

    logger.info('✅ Price polling service started successfully');
  }

  /**
   * Stop the price polling service
   */
  async stopPolling(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    logger.info('🛑 Price polling service stopped');
  }

  /**
   * Get polling statistics
   */
  getStats(): { isRunning: boolean; pollCount: number } {
    return {
      isRunning: this.isRunning,
      pollCount: this.pollCount
    };
  }

  /**
   * Main polling logic - fetch prices for all active trades
   */
  private async pollActiveTrades(): Promise<void> {
    try {
      this.pollCount++;
      const activeTrades = await this.getActiveTrades();
      
      if (activeTrades.length === 0) {
        logger.debug(`📊 Poll #${this.pollCount}: No active trades to monitor`);
        return;
      }

      logger.info(`💰 Poll #${this.pollCount}: Monitoring ${activeTrades.length} active trades`);

      // Process trades in batches to avoid overwhelming APIs
      const batchSize = 5;
      for (let i = 0; i < activeTrades.length; i += batchSize) {
        const batch = activeTrades.slice(i, i + batchSize);
        await this.processTradeBatch(batch);
        
        // Small delay between batches
        if (i + batchSize < activeTrades.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info(`✅ Poll #${this.pollCount}: Completed price updates for ${activeTrades.length} trades`);

    } catch (error) {
      logger.error(`💥 Poll #${this.pollCount}: Error polling active trades:`, error);
    }
  }

  /**
   * Process a batch of trades for price updates
   */
  private async processTradeBatch(trades: ActiveTrade[]): Promise<void> {
    const promises = trades.map(async (trade) => {
      try {
        const currentPrice = await this.getCurrentTokenPrice(trade.tokenAddress);
        if (currentPrice > 0) {
          await this.performanceMonitor.updateTradePrice(trade.tokenAddress, currentPrice);
          logger.debug(`📈 Updated ${trade.tokenAddress}: $${currentPrice.toFixed(6)}`);
        } else {
          logger.warn(`⚠️  Failed to get price for ${trade.tokenAddress}`);
        }
      } catch (error) {
        logger.error(`💥 Error updating price for ${trade.tokenAddress}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Fetch active trades from the database
   */
  private async getActiveTrades(): Promise<ActiveTrade[]> {
    try {
      // Get the trade outcomes collection
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const collection = db.collection('trade_outcomes');
      
      // Find trades that are still active and within 48 hours
      const activeTrades = await collection.find({
        status: { $in: ['active', 'monitoring'] },
        // Only track for 48 hours max
        detectionTimestamp: { 
          $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) 
        }
      }).toArray();

      return activeTrades.map(trade => ({
        tokenAddress: trade.tokenAddress,
        detectionTimestamp: trade.detectionTimestamp,
        status: trade.status,
        _id: trade._id
      }));

    } catch (error) {
      logger.error('💥 Error fetching active trades from database:', error);
      return [];
    }
  }

  /**
   * Get current token price using multiple sources
   */
  private async getCurrentTokenPrice(tokenAddress: string): Promise<number> {
    try {
      // Method 1: Jupiter Price API (best for Solana tokens)
      const jupiterPrice = await this.getJupiterPrice(tokenAddress);
      if (jupiterPrice > 0) {
        return jupiterPrice;
      }

      // Method 2: DexScreener API (fallback)
      const dexScreenerPrice = await this.getDexScreenerPrice(tokenAddress);
      if (dexScreenerPrice > 0) {
        return dexScreenerPrice;
      }

      // Method 3: CoinGecko API (for established tokens)
      const coinGeckoPrice = await this.getCoinGeckoPrice(tokenAddress);
      if (coinGeckoPrice > 0) {
        return coinGeckoPrice;
      }

      logger.warn(`⚠️  No price sources available for ${tokenAddress}`);
      return 0;
      
    } catch (error) {
      logger.error(`💥 Error fetching price for ${tokenAddress}:`, error);
      return 0;
    }
  }

  /**
   * Get price from Jupiter API with retry logic
   */
  private async getJupiterPrice(tokenAddress: string): Promise<number> {
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`https://price.jup.ag/v4/price?ids=${tokenAddress}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Jupiter API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.data && data.data[tokenAddress]) {
          return parseFloat(data.data[tokenAddress].price);
        }

        return 0;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    logger.debug(`Jupiter price fetch failed after ${maxRetries} attempts for ${tokenAddress}:`, lastError);
    return 0;
  }

  /**
   * Get price from DexScreener API with retry logic
   */
  private async getDexScreenerPrice(tokenAddress: string): Promise<number> {
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`DexScreener API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
          // Use the pair with highest liquidity
          const bestPair = data.pairs.reduce((best: any, current: any) => 
            parseFloat(current.liquidity?.usd || '0') > parseFloat(best.liquidity?.usd || '0') ? current : best
          );
          
          return parseFloat(bestPair.priceUsd || '0');
        }

        return 0;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    logger.debug(`DexScreener price fetch failed after ${maxRetries} attempts for ${tokenAddress}:`, lastError);
    return 0;
  }

  /**
   * Get price from CoinGecko API (for established tokens)
   */
  private async getCoinGeckoPrice(tokenAddress: string): Promise<number> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenAddress}&vs_currencies=usd`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data[tokenAddress] && data[tokenAddress].usd) {
        return parseFloat(data[tokenAddress].usd);
      }

      return 0;
    } catch (error) {
      logger.debug(`CoinGecko price fetch failed for ${tokenAddress}:`, error);
      return 0;
    }
  }

  /**
   * Manual method to add a test trade for validation
   */
  async addTestTrade(tokenAddress: string, initialPrice: number): Promise<void> {
    try {
      // Create properly structured trade object matching PerformanceMonitoringService.recordNewTrade schema
      const tradeData = {
        tokenAddress,
        tokenSymbol: 'TEST',
        initialPrice: initialPrice,
        signalScores: {
          smartWallet: 85,
          lpAnalysis: 90,
          marketContext: 80
        },
        overallScore: 85,
        lpValueUSD: 50000,
        quoteToken: 'SOL',
        marketContext: {
          solPrice: 150.0,  // Required field - current SOL price in USD
          marketCap: 1000000, // Optional field
          volume24h: 500000   // Optional field
        }
      };
      
      await this.performanceMonitor.recordNewTrade(tradeData);
      
      logger.info(`✅ Test trade added: ${tokenAddress} at ${initialPrice}`);
    } catch (error) {
      logger.error(`💥 Error adding test trade:`, error);
    }
  }
}

// Standalone script for running the price poller
export async function runPricePolling(): Promise<void> {
  // Connect to MongoDB first
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    } as any);
    logger.info('🔌 Connected to MongoDB for price polling');
  }

  // Now create poller with connected database
  const poller = new PricePollingService();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('\n🛑 Shutting down price polling service...');
    await poller.stopPolling();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\n🛑 Shutting down price polling service...');
    await poller.stopPolling();
    process.exit(0);
  });

  await poller.startPolling(5); // Poll every 5 minutes
  logger.info('💰 Price polling service is running. Press Ctrl+C to stop.');
  
  // Keep the process alive
  process.stdin.resume();
}

// If this file is run directly
if (require.main === module) {
  runPricePolling().catch((error) => {
    logger.error('💥 Fatal error in price polling service:', error);
    process.exit(1);
  });
}