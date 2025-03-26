// src/scripts/setup-database.ts
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../utils/database';
import SmartWallet from '../models/smartWallet';
import { logger } from '../utils/logger';

async function setupDatabase() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    logger.info('Connected to MongoDB');

    // Ensure indexes are created
    const indexInfo = await SmartWallet.collection.indexInformation();
    logger.info('Current indexes:', Object.keys(indexInfo));

    // Create additional compound indexes if needed
    if (!indexInfo['winRate_-1_memeTokenMetrics.returns4xRate_-1']) {
      await SmartWallet.collection.createIndex(
        { winRate: -1, "memeTokenMetrics.returns4xRate": -1 },
        { name: 'winRate_returns4x_compound' }
      );
      logger.info('Created compound index for win rate and 4x returns');
    }

    // Create TTL index for inactive wallets (optional, for cleanup)
    if (!indexInfo['lastActive_1']) {
      await SmartWallet.collection.createIndex(
        { lastActive: 1 },
        { 
          expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
          name: 'inactive_wallets_ttl'
        }
      );
      logger.info('Created TTL index for inactive wallets');
    }

    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error('Error setting up database:', error instanceof Error ? error.message : String(error));
  } finally {
    await disconnectFromDatabase();
  }
}

// Run the setup
setupDatabase();