// src/scripts/seed-database.ts
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { program } from 'commander';
import readline from 'readline';
import ExternalWallet from '../models/externalWallet';
import WalletPerformanceHistory from '../models/walletPerformanceHistory';
import TokenMetadata from '../models/tokenMetadata';
import SmartWallet from '../models/smartWallet';
import { connectToDatabase } from '../utils/database';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Import sample data
import { 
  sampleExternalWallets, 
  samplePerformanceHistory,
  sampleTokens,
  sampleSmartWallets 
} from './seed-data';

// Define dataset sizes
const datasetSizes = {
  small: {
    wallets: 3,
    history: 4,
    tokens: 3,
    smartWallets: 2
  },
  full: {
    wallets: sampleExternalWallets.length,
    history: samplePerformanceHistory.length,
    tokens: sampleTokens.length,
    smartWallets: sampleSmartWallets.length
  }
};

// Setup command line options
program
  .option('-f, --full', 'Seed with full dataset')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('-r, --retries <number>', 'Number of connection retries', '5')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--force-prod', 'Force run on production (USE WITH EXTREME CAUTION)')
  .parse(process.argv);

const options = program.opts();

// Set log level based on verbose flag
if (options.verbose) {
  logger.level = 'debug';
  logger.debug('Verbose logging enabled');
}

/**
 * Check if MongoDB is using a replica set (required for transactions)
 */
async function isReplicaSet(): Promise<boolean> {
  try {
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    return serverStatus.repl !== undefined;
  } catch (error) {
    logger.warn('Could not determine if MongoDB is using a replica set:', error);
    return false;
  }
}

/**
 * Connect to the database with retry logic
 */
async function connectWithRetry(retries: number): Promise<boolean> {
  const MAX_BACKOFF_MS = 30000; // Cap max backoff delay at 30 seconds
  let attemptsMade = 0;
  
  while (attemptsMade <= retries) {
    try {
      await connectToDatabase();
      logger.info(`Connected to MongoDB after ${attemptsMade} ${attemptsMade === 1 ? 'retry' : 'retries'}`);
      return true;
    } catch (error) {
      attemptsMade++;
      
      if (attemptsMade > retries) {
        logger.error(`Failed to connect to MongoDB after ${attemptsMade} attempts:`, error);
        return false;
      }
      
      // Calculate backoff with capped maximum
      const delay = Math.min(Math.pow(2, attemptsMade) * 1000, MAX_BACKOFF_MS);
      logger.warn(`Connection failed, retrying in ${delay}ms... (Attempt ${attemptsMade}/${retries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false; // Should never reach this due to the loop conditions
}

/**
 * Check if database is production or staging
 */
function isProductionOrStaging(dbUri: string): boolean {
  const productionKeywords = ['prod', 'production', 'staging', 'live', 'real'];
  return productionKeywords.some(keyword => dbUri.toLowerCase().includes(keyword));
}

/**
 * Confirm database clearing with user prompt
 */
async function confirmDbClear(): Promise<boolean> {
  if (options.yes) return true;
  
  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp';
  
  // Check for production databases
  if (isProductionOrStaging(dbUri) && !options.forceProd) {
    logger.error('⛔ Refusing to seed a production/staging database. Check your MONGODB_URI environment variable.');
    logger.error('If you really need to seed production, use the --force-prod flag (NOT RECOMMENDED)');
    return false;
  }
  
  // Additional warning for force-prod
  if (options.forceProd && isProductionOrStaging(dbUri)) {
    logger.warn('⚠️ ⚠️ ⚠️ WARNING: Preparing to seed what appears to be a PRODUCTION database! ⚠️ ⚠️ ⚠️');
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`This will wipe your database at ${dbUri}. Continue? (y/N) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Clear all collections
 */
async function clearCollections(): Promise<void> {
  try {
    logger.info('Clearing existing data...');
    
    const collections = [
      { model: ExternalWallet, name: 'external wallets' },
      { model: WalletPerformanceHistory, name: 'performance history' },
      { model: TokenMetadata, name: 'tokens' },
      { model: SmartWallet, name: 'smart wallets' }
    ];
    
    // Delete one collection at a time for better error messages
    for (const { model, name } of collections) {
      try {
        const result = await model.deleteMany({});
        logger.info(`Cleared ${name}: ${result.deletedCount} documents removed`);
      } catch (error) {
        logger.error(`Error clearing ${name}:`, error);
        throw error; // Re-throw to be caught by the outer try/catch
      }
    }
  } catch (error) {
    logger.error('Failed to clear collections:', error);
    throw error; // Re-throw to abort the seeding process
  }
}

/**
 * Verify seed results
 */
async function verifySeedResults(expected: Record<string, number>): Promise<boolean> {
  const counts = {
    wallets: await ExternalWallet.countDocuments(),
    history: await WalletPerformanceHistory.countDocuments(),
    tokens: await TokenMetadata.countDocuments(),
    smartWallets: await SmartWallet.countDocuments()
  };
  
  logger.info('Verification counts:', counts);
  
  const matchesExpected = 
    counts.wallets === expected.wallets &&
    counts.history === expected.history &&
    counts.tokens === expected.tokens &&
    counts.smartWallets === expected.smartWallets;
  
  if (!matchesExpected) {
    logger.warn('Document counts do not match expected values:');
    logger.warn(`Expected: ${JSON.stringify(expected)}`);
    logger.warn(`Actual: ${JSON.stringify(counts)}`);
  }
  
  return matchesExpected;
}

/**
 * Seed the database with sample data
 */
async function seedDatabase() {
  let errorCount = 0;
  let successCount = 0;
  const startTime = Date.now();
  
  try {
    // Determine dataset size based on options
    const datasetSize = options.full ? 'full' : 'small';
    const dataset = datasetSizes[datasetSize];
    
    logger.info(`Seeding database with ${datasetSize} dataset...`);
    
    // Check if MongoDB is using a replica set (required for transactions)
    const hasReplicaSet = await isReplicaSet();
    if (!hasReplicaSet) {
      logger.warn('WARNING: MongoDB is not using a replica set. Transactions will not be used, which means seeding will not be atomic.');
      logger.warn('If an error occurs during seeding, the database may be left in a partially seeded state.');
    }
    
    // Insert function with or without transaction support
    const insertData = async () => {
      // Function to insert a single collection
      const insertCollection = async<T>(
        name: string, 
        model: mongoose.Model<T>, 
        data: any[], 
        session?: mongoose.ClientSession
      ): Promise<boolean> => {
        try {
          const itemsToInsert = data.slice(0, dataset[name.toLowerCase()]);
          
          logger.debug(`Inserting ${itemsToInsert.length} ${name}...`);
          const items = await model.insertMany(itemsToInsert, { session });
          
          logger.info(`✅ Inserted ${items.length} ${name}`);
          successCount++;
          return true;
        } catch (error) {
          logger.error(`Failed to insert ${name}:`, error);
          errorCount++;
          return false;
        }
      };
      
      if (hasReplicaSet) {
        // Use transaction for atomic operations
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          
          // Insert all collections - abort on any failure
          if (
            !await insertCollection('wallets', ExternalWallet, sampleExternalWallets, session) ||
            !await insertCollection('history', WalletPerformanceHistory, samplePerformanceHistory, session) ||
            !await insertCollection('tokens', TokenMetadata, sampleTokens, session) ||
            !await insertCollection('smartWallets', SmartWallet, sampleSmartWallets, session)
          ) {
            // At least one insert failed
            await session.abortTransaction();
            logger.error('Transaction aborted due to errors');
            return false;
          }
          
          // All inserts succeeded
          await session.commitTransaction();
          logger.info('✅ Transaction committed successfully');
          return true;
        } catch (error) {
          // Something else went wrong
          await session.abortTransaction();
          logger.error('Transaction aborted due to unexpected error:', error);
          return false;
        } finally {
          session.endSession();
        }
      } else {
        // No transaction support - do our best without it
        let success = true;
        
        // Try all inserts, tracking success/failure
        success = await insertCollection('wallets', ExternalWallet, sampleExternalWallets) && success;
        success = await insertCollection('history', WalletPerformanceHistory, samplePerformanceHistory) && success;
        success = await insertCollection('tokens', TokenMetadata, sampleTokens) && success;
        success = await insertCollection('smartWallets', SmartWallet, sampleSmartWallets) && success;
        
        return success;
      }
    };
    
    // Insert the data
    const success = await insertData();
    
    // Verify the results
    const expectedCounts = {
      wallets: dataset.wallets,
      history: dataset.history,
      tokens: dataset.tokens,
      smartWallets: dataset.smartWallets
    };
    
    const verified = await verifySeedResults(expectedCounts);
    
    if (success && verified) {
      logger.info('✅ Database seeding completed successfully');
    } else if (success && !verified) {
      logger.warn('⚠️ Database seeding completed but verification failed');
      errorCount++;
    } else {
      logger.error('❌ Database seeding failed');
    }
    
  } catch (error) {
    logger.error('Error during database seeding:', error);
    errorCount++;
  } finally {
    const duration = Date.now() - startTime;
    logger.info(`Seeding operation completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    
    // Close the connection
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    } catch (disconnectError) {
      logger.error('Error disconnecting from MongoDB:', disconnectError);
      errorCount++;
    }
    
    // Return appropriate exit code
    if (errorCount > 0) {
      process.exit(1);
    }
  }
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now();
  
  // Connect to database with retry
  const maxRetries = parseInt(options.retries) || 5;
  const connected = await connectWithRetry(maxRetries);
  
  if (!connected) {
    logger.error('Could not connect to database. Aborting seed.');
    process.exit(1);
  }
  
  // Confirm database clearing
  const confirmed = await confirmDbClear();
  
  if (!confirmed) {
    logger.info('Seed cancelled by user');
    await mongoose.disconnect();
    process.exit(0);
  }
  
  // Clear collections
  try {
    await clearCollections();
  } catch (error) {
    logger.error('Failed to clear collections. Aborting seed.');
    await mongoose.disconnect();
    process.exit(1);
  }
  
  // Seed database
  await seedDatabase();
  
  const totalDuration = Date.now() - startTime;
  logger.info(`Total operation completed in ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
}

// Run the main function
main();