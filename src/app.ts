// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectToDatabase, isDatabaseConnected, getDatabaseConnectionStatus } from './config/database';
import dotenv from 'dotenv';

// Import routes (you would have these)
// import walletRoutes from './routes/wallet.routes';
// import tokenRoutes from './routes/token.routes';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin resource sharing
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Database health check middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!isDatabaseConnected()) {
    console.warn('Database is not connected, request may fail');
    // You could decide to reject requests that need DB access when DB is down
    // or let them through and fail gracefully
  }
  next();
});

// Routes
// app.use('/api/wallets', walletRoutes);
// app.use('/api/tokens', tokenRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const dbStatus = getDatabaseConnectionStatus();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      connected: isDatabaseConnected()
    },
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.method} ${req.originalUrl} not found` 
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start the server
async function startServer() {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

// Export for testing
export default app;