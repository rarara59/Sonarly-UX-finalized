#!/usr/bin/env node
// src/scripts/chainedge-scraper-run.ts
import * as dotenv from 'dotenv';
import { connectToDatabase } from '../utils/database';
import { logger } from '../utils/logger';
import { getChainEDGEScraper } from '../services/chainedge-scraper';
import { getRiskManagerModule } from '../services/risk-manager-module';
// Import config if it exists, otherwise create a placeholder
let config: any;
try {
  config = require('../config').default || require('../config');
} catch (e) {
  config = {};
  logger.warn('Config import failed, using default values');
}

// Initialize environment variables
dotenv.config();

/**
 * Main script function
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting ChainEDGE scraper script');
    
    // Connect to database
    await connectToDatabase();
    logger.info('Database connection established');

    // Initialize risk manager module
    // We'll try to use the module directly without dependencies if they don't exist
    let riskManager;
    try {
      riskManager = getRiskManagerModule(null, null);
      logger.info('Risk management module initialized');
    } catch (error) {
      logger.warn('Risk management module initialization failed, continuing without it', error);
    }
    
    // Configure and initialize ChainEDGE scraper
    const scraper = getChainEDGEScraper({
      baseUrl: process.env.CHAINEDGE_URL || 'https://app.chainedge.io',
      username: process.env.CHAINEDGE_USERNAME || '',
      password: process.env.CHAINEDGE_PASSWORD || '',
      minWinRate: Number(process.env.CHAINEDGE_MIN_WIN_RATE || 75),
      minPnL: Number(process.env.CHAINEDGE_MIN_PNL || 50000),
      minTrades: Number(process.env.CHAINEDGE_MIN_TRADES || 30),
      minBuyValue: Number(process.env.CHAINEDGE_MIN_BUY_VALUE || 500),
      scrapeInterval: Number(process.env.CHAINEDGE_SCRAPE_INTERVAL || 3600000),
      walletCategories: {
        sniper: process.env.CHAINEDGE_ENABLE_SNIPER !== 'false',
        gemSpotter: process.env.CHAINEDGE_ENABLE_GEM_SPOTTER !== 'false',
        earlyMover: process.env.CHAINEDGE_ENABLE_EARLY_MOVER !== 'false'
      },
      timeframeFilters: {
        fastTimeframe: process.env.CHAINEDGE_ENABLE_FAST_TIMEFRAME !== 'false',
        slowTimeframe: process.env.CHAINEDGE_ENABLE_SLOW_TIMEFRAME !== 'false'
      }
    });

    // Initialize the scraper
    const initialized = await scraper.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize ChainEDGE scraper');
    }
    logger.info('ChainEDGE scraper initialized successfully');

    // Determine execution mode
    const runMode = process.argv[2] || 'scheduled';
    
    if (runMode === 'once') {
      // Run once and exit
      logger.info('Running ChainEDGE scraper once');
      await scraper.scrapeWallets();
      logger.info('Scrape completed, shutting down');
      await scraper.shutdown();
      process.exit(0);
    } else {
      // Run on schedule
      logger.info(`Starting scheduled scraping every ${scraper.getConfig().scrapeInterval / 60000} minutes`);
      await scraper.startScheduledScraping();
      
      // Keep the process running
      logger.info('ChainEDGE scraper is running in scheduled mode');
      
      // Handle process termination
      process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down...');
        await scraper.shutdown();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down...');
        await scraper.shutdown();
        process.exit(0);
      });
    }
  } catch (error) {
    logger.error('Error in ChainEDGE scraper script:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error('Unhandled error in main:', error);
  process.exit(1);
});