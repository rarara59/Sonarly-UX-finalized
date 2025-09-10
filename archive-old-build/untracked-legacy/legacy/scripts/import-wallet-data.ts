// src/scripts/import-wallet-data.ts
import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileParser } from '../services/file-parser';
import { walletImport } from '../services/wallet-import.service';
import { logger } from '../utils/logger';

// Load environment variables
config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp');
    logger.info('Connected to MongoDB');
    return true;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a file path: ts-node src/scripts/import-wallet-data.ts path/to/data.xlsx');
      process.exit(1);
    }
    
    const filePath = args[0];
    logger.info(`Starting import from file: ${filePath}`);
    
    // Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      process.exit(1);
    }
    
    // Read data file using the file parser service
    const data = fileParser.readDataFile(filePath);
    
    // Import data using the wallet import service
    const result = await walletImport.importWalletData(data);
    
    logger.info(`Import completed with:
- ${result.success} successful imports
- ${result.errors} errors
- ${result.retries} successful retries`);
    
    // Disconnect from database
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the script
main();