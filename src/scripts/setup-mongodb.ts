// src/scripts/setup-mongodb.ts
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

async function setupMongoDB() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thorpv1';
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
    
    // Get the database - add non-null assertion
    const db = mongoose.connection.db!; // Added ! to assert it's not null
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = [
      'smart_wallets',
      'wallet_performance_history',
      'transactions',
      'pattern_analysis'
    ];
    
    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        await db.createCollection(collection);
        logger.info(`Created collection: ${collection}`);
      } else {
        logger.info(`Collection already exists: ${collection}`);
      }
    }
    
    // Create indexes
    await db.collection('smart_wallets').createIndex({ address: 1 }, { unique: true });
    await db.collection('smart_wallets').createIndex({ category: 1 });
    await db.collection('smart_wallets').createIndex({ "performanceMetrics.winRate": -1 });
    await db.collection('smart_wallets').createIndex({ confidenceScore: -1 });
    await db.collection('smart_wallets').createIndex({ lastTradeAt: -1 });
    await db.collection('smart_wallets').createIndex({ isActive: 1 });
    await db.collection('smart_wallets').createIndex({ "memeTokenMetrics.returns4xRate": -1 });
    await db.collection('smart_wallets').createIndex({ predictedSuccessRate: -1 });
    
    // Add other indexes for remaining collections
    
    logger.info('MongoDB setup completed successfully');
  } catch (error) {
    logger.error('MongoDB setup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the setup
setupMongoDB().catch(console.error);