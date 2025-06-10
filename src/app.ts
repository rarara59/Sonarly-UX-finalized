// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

import { connectToDatabase, isDatabaseConnected, getDatabaseConnectionStatus } from './config/database';
import heliusWebhookHandler from './services/webhooks/helius-handler'; // ✅ Correct path
import './scripts/token-discovery-loop'; // Side effect import to start discovery loop

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register webhook handler
app.use('/', heliusWebhookHandler);

// DB Health middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!isDatabaseConnected()) {
    console.warn('⚠️ Database not connected');
  }
  next();
});

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
    console.log('⚙️  Starting server – attempting DB connection...');
    await connectToDatabase();
    console.log('✅ DB connection successful, starting Express...');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;