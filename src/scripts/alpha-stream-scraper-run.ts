#!/usr/bin/env node
// src/scripts/alpha-stream-scraper-run.ts

import dotenv from 'dotenv';
import { connectToDatabase } from '../utils/database';
import { logger } from '../utils/logger';
import { getAlphaStreamScraper } from '../services/alpha-stream-scraper';
import { getRiskManagerModule } from '../services/risk-manager-module';
import riskManagementService from '../services/risk-management-service';
import EnhancedRiskManagementService from '../services/enhanced-risk-management';
import config from '../config';

// Initialize environment variables
dotenv.config();

/**
 * Main script function
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting Alpha Stream scraper script');
    
    // Connect to database
    await connectToDatabase();
    logger.info('Database connection established');
    
    // Initialize enhanced risk management service (if needed)
    const enhancedRiskService = new EnhancedRiskManagementService(riskManagementService);
    await enhancedRiskService.init();
    
    // Initialize risk manager module
    const riskManager = getRiskManagerModule(
      riskManagementService,
      enhancedRiskService
    );
    logger.info('Risk management services initialized');
    
    // Configure and initialize Alpha Stream scraper
    const scraper = getAlphaStreamScraper({
      baseUrl: process.env.ALPHA_STREAM_URL || 'https://alphastream.io',
      username: process.env.ALPHA_STREAM_USERNAME || '',
      password: process.env.ALPHA_STREAM_PASSWORD || '',
      minWinRate: Number(process.env.ALPHA_STREAM_MIN_WIN_RATE || 75),
      minPnL: Number(process.env.ALPHA_STREAM_MIN_PNL || 50000),
      minTrades: Number(process.env.ALPHA_STREAM_MIN_TRADES || 30),
      minBuyValue: Number(process.env.ALPHA_STREAM_MIN_BUY_VALUE || 500),
      scrapeInterval: Number(process.env.ALPHA_STREAM_SCRAPE_INTERVAL || 3600000),
      walletCategories: {
        sniper: process.env.ALPHA_STREAM_ENABLE_SNIPER !== 'false',
        gemSpotter: process.env.ALPHA_STREAM_ENABLE_GEM_SPOTTER !== 'false',
        earlyMover: process.env.ALPHA_STREAM_ENABLE_EARLY_MOVER !== 'false'
      },
      timeframeFilters: {
        fastTimeframe: process.env.ALPHA_STREAM_ENABLE_FAST_TIMEFRAME !== 'false',
        slowTimeframe: process.env.ALPHA_STREAM_ENABLE_SLOW_TIMEFRAME !== 'false'
      }
    });
    
    // Initialize the scraper
    const initialized = await scraper.initialize();
    
    if (!initialized) {
      throw new Error('Failed to initialize Alpha Stream scraper');
    }
    
    logger.info('Alpha Stream scraper initialized successfully');
    
    // Determine execution mode
    const runMode = process.argv[2] || 'scheduled';
    
    if (runMode === 'once') {
      // Run once and exit
      logger.info('Running Alpha Stream scraper once');
      await scraper.scrapeWallets();
      logger.info('Scrape completed, shutting down');
      await scraper.shutdown();
      process.exit(0);
    } else {
      // Run on schedule
      logger.info(`Starting scheduled scraping every ${scraper.getConfig().scrapeInterval / 60000} minutes`);
      await scraper.startScheduledScraping();
      
      // Keep the process running
      logger.info('Alpha Stream scraper is running in scheduled mode');
      
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
    logger.error('Error in Alpha Stream scraper script:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error('Unhandled error in main:', error);
  process.exit(1);
});