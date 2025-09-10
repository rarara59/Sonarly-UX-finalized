// src/utils/database.ts

import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * Global connection variable to reuse the connection
 */
let cachedConnection: mongoose.Connection | null = null;

/**
 * Connect to MongoDB database
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cachedConnection) {
    logger.info('Using existing MongoDB connection');
    return cachedConnection;
  }

  try {
    // Get MongoDB URI from environment variables
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thorpv1';
    
    // Connect to MongoDB
    const connection = await mongoose.connect(uri);
    cachedConnection = mongoose.connection;
    
    // Log connection details with proper null checks
    const host = connection.connection.host || 'unknown-host';
    const port = connection.connection.port || 'unknown-port';
    const dbName = connection.connection.db?.databaseName || 'unknown-db';
    
    logger.info(`Successfully connected to MongoDB (${host}:${port}/${dbName})`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      cachedConnection = null;
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
    logger.info('Disconnected from MongoDB');
  }
}