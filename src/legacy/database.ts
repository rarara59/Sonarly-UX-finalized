// src/config/database.ts
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connection options
const connectionOptions: mongoose.ConnectOptions = {
  // Set the maximum number of connections in the pool
  maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 5,
  
  // Set the minimum number of connections in the pool  
  minPoolSize: process.env.NODE_ENV === 'production' ? 5 : 1,
  
  // Socket timeout (in milliseconds)
  socketTimeoutMS: 45000,
  
  // Time to wait before failing initial connection
  connectTimeoutMS: 30000,
  
  // Server selection timeout and max query time
  serverSelectionTimeoutMS: 30000,  // 30 seconds to find MongoDB server
  
  // Whether to buffer commands when the connection is lost
  bufferCommands: true,
  
  // If true, this connection will use createIndex() instead of ensureIndex()
  autoIndex: process.env.NODE_ENV !== 'production',
};

// Cached connection
let cachedConnection: typeof mongoose | null = null;

// Connection states
const STATES = {
  disconnected: 0,
  connected: 1,
  connecting: 2,
  disconnecting: 3,
};

/**
 * Connect to MongoDB
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // If we already have a connection, return it
  if (cachedConnection && mongoose.connection.readyState === STATES.connected) {
    return cachedConnection;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp-project';

  try {
    // Connect to MongoDB
    const connection = await mongoose.connect(MONGODB_URI, connectionOptions);
    
    // Cache the connection
    cachedConnection = connection;
    
    // Log connection success
    console.log('🔌 Connected to MongoDB successfully');

    // Set up connection event listeners for monitoring
    setupConnectionMonitoring();
    
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Set up event listeners for the MongoDB connection
 */
function setupConnectionMonitoring() {
  // When successfully connected
  mongoose.connection.on('connected', () => {
    console.log('🔌 Mongoose connected to MongoDB');
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', () => {
    console.log('❌ Mongoose disconnected from MongoDB');
    
    // Try to reconnect if not already reconnecting and in production
    if (process.env.NODE_ENV === 'production') {
      handleReconnection();
    }
  });

  // If the connection throws an error
  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
    
    // In production, try to reconnect
    if (process.env.NODE_ENV === 'production') {
      handleReconnection();
    }
  });

  // When the Node process ends, close the Mongoose connection
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
  });
}

// Keep track of reconnection attempts
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL_MS = 5000; // 5 seconds

/**
 * Handle reconnection logic with exponential backoff
 */
async function handleReconnection() {
  // If already reconnecting or max attempts reached, do nothing
  if (mongoose.connection.readyState === STATES.connecting || 
      reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return;
  }

  reconnectAttempts++;
  
  // Calculate backoff time (exponential with jitter)
  const backoff = Math.min(
    RECONNECT_INTERVAL_MS * Math.pow(1.5, reconnectAttempts) + 
    Math.floor(Math.random() * 1000), // Add jitter
    60000 // Cap at 1 minute
  );
  
  console.log(`Attempting to reconnect to MongoDB in ${backoff}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  
  // Wait for backoff period
  await new Promise(resolve => setTimeout(resolve, backoff));
  
  try {
    // Try to connect again
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp-project', connectionOptions);
    
    // Reset reconnect attempts on successful connection
    reconnectAttempts = 0;
    
    console.log('Successfully reconnected to MongoDB');
  } catch (error) {
    console.error('Reconnection attempt failed:', error);
    
    // If max attempts reached, exit process (for containerized environments, this allows restart)
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && process.env.NODE_ENV === 'production') {
      console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts, exiting process`);
      process.exit(1);
    }
  }
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (mongoose.connection.readyState !== STATES.disconnected) {
    await mongoose.connection.close();
    cachedConnection = null;
    console.log('MongoDB connection closed');
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === STATES.connected;
}

/**
 * Get database connection status as string
 */
export function getDatabaseConnectionStatus(): string {
  const state = mongoose.connection.readyState;
  switch (state) {
    case STATES.connected:
      return 'connected';
    case STATES.connecting:
      return 'connecting';
    case STATES.disconnecting:
      return 'disconnecting';
    case STATES.disconnected:
      return 'disconnected';
    default:
      return 'unknown';
  }
}

// Export mongoose instance
export { mongoose };