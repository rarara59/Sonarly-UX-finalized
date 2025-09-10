import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TradingDashboardServer {
  constructor() {
    this.app = express();
    this.port = 3000;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
    
    // CORS headers for real-time updates
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  setupRoutes() {
    // Main dashboard page
    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
    });

    // API endpoints for real-time data
    this.app.get('/api/metrics', (req, res) => {
      try {
        const metrics = global.performanceMetrics ? global.performanceMetrics.getMetrics() : {};
        const dashboard = global.tradingDashboard ? global.tradingDashboard.getDashboardData() : {};
        
        res.json({
          timestamp: Date.now(),
          metrics: metrics,
          dashboard: dashboard,
          system: this.getSystemInfo()
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
      }
    });

    // Historical data endpoint
    this.app.get('/api/history', (req, res) => {
      try {
        const hours = parseInt(req.query.hours) || 1;
        const history = global.performanceMetrics ? 
          global.performanceMetrics.getHistoricalData(hours) : [];
        
        res.json({
          history: history,
          timeRange: `${hours} hours`
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history', details: error.message });
      }
    });

    // Alert history endpoint
    this.app.get('/api/alerts', (req, res) => {
      try {
        const alerts = global.performanceMetrics ? 
          global.performanceMetrics.getRecentAlerts() : [];
        
        res.json({
          alerts: alerts,
          totalCount: alerts.length
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts', details: error.message });
      }
    });

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
          performanceMetrics: !!global.performanceMetrics,
          tradingDashboard: !!global.tradingDashboard,
          lpDetector: true // Assume running if web dashboard is accessible
        }
      };
      
      res.json(health);
    });
  }

  getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: Date.now()
    };
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`📊 Web Dashboard Server: http://localhost:${this.port}/dashboard`);
      console.log(`🔗 API Endpoints: http://localhost:${this.port}/api/metrics`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 Web Dashboard Server stopped');
    }
  }
}

export default TradingDashboardServer;