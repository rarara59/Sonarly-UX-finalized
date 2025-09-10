const mongoose = require('mongoose');

async function setupMongoDB() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thorpv1';
    console.log(`Connecting to MongoDB at ${uri}`);
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // Create collections if they don't exist
    try {
      await db.createCollection("smart_wallets");
      console.log('Created smart_wallets collection');
    } catch (e) {
      console.log('smart_wallets collection may already exist');
    }
    
    try {
      await db.createCollection("wallet_performance_history");
      console.log('Created wallet_performance_history collection');
    } catch (e) {
      console.log('wallet_performance_history collection may already exist');
    }
    
    try {
      await db.createCollection("transactions");
      console.log('Created transactions collection');
    } catch (e) {
      console.log('transactions collection may already exist');
    }
    
    try {
      await db.createCollection("pattern_analysis");
      console.log('Created pattern_analysis collection');
    } catch (e) {
      console.log('pattern_analysis collection may already exist');
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
    
    console.log('All indexes created');
    console.log('MongoDB setup completed successfully');
  } catch (error) {
    console.error('MongoDB setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
setupMongoDB().catch(console.error);