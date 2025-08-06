# IMPLEMENTATION: Web Dashboard for Trading System Monitoring

## Overview
Create a professional web dashboard accessible at `http://localhost:3000/dashboard` for real-time monitoring of the THORP trading system performance, metrics, and alerts.

## File Structure to Create

```
src/
├── monitoring/
│   ├── web-dashboard-server.js    (NEW - Express server)
│   └── web-dashboard-routes.js    (NEW - API routes)
├── public/
│   ├── dashboard.html             (NEW - Main dashboard page)
│   ├── styles.css                 (NEW - Dashboard styles)
│   └── dashboard.js               (NEW - Frontend JavaScript)
└── index.js                       (MODIFY - Add dashboard startup)
```

## Implementation Steps

### Step 1: Create Web Dashboard Server
**File:** `src/monitoring/web-dashboard-server.js`

```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');

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

module.exports = TradingDashboardServer;
```

### Step 2: Create Dashboard HTML
**File:** `src/public/dashboard.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>THORP Trading System Dashboard</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <!-- Header -->
        <header class="dashboard-header">
            <h1>🎯 THORP Trading System</h1>
            <div class="status-indicator">
                <span id="connection-status" class="status-dot connected"></span>
                <span id="last-update">Connecting...</span>
            </div>
        </header>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">
            <!-- Key Metrics Cards -->
            <div class="metric-card efficiency">
                <h3>Trading Efficiency</h3>
                <div class="metric-value" id="trading-efficiency">---%</div>
                <div class="metric-label" id="efficiency-status">Loading...</div>
            </div>

            <div class="metric-card detection">
                <h3>Token Detection</h3>
                <div class="metric-value" id="token-detection">---ms</div>
                <div class="metric-label" id="detection-status">Loading...</div>
            </div>

            <div class="metric-card validation">
                <h3>Token Validation</h3>
                <div class="metric-value" id="token-validation">---ms</div>
                <div class="metric-label" id="validation-status">Loading...</div>
            </div>

            <div class="metric-card readiness">
                <h3>Meme Coin Readiness</h3>
                <div class="metric-value" id="meme-readiness">---%</div>
                <div class="metric-label" id="readiness-status">Loading...</div>
            </div>

            <!-- Performance Chart -->
            <div class="chart-card">
                <h3>Performance Trends</h3>
                <canvas id="performance-chart"></canvas>
            </div>

            <!-- Alert History -->
            <div class="alert-card">
                <h3>Recent Alerts</h3>
                <div id="alert-list" class="alert-list">
                    <div class="loading">Loading alerts...</div>
                </div>
            </div>

            <!-- System Health -->
            <div class="health-card">
                <h3>System Health</h3>
                <div id="health-status" class="health-grid">
                    <div class="health-item">
                        <span class="health-label">Memory:</span>
                        <span class="health-value" id="memory-usage">Loading...</span>
                    </div>
                    <div class="health-item">
                        <span class="health-label">Uptime:</span>
                        <span class="health-value" id="system-uptime">Loading...</span>
                    </div>
                    <div class="health-item">
                        <span class="health-label">RPC Calls:</span>
                        <span class="health-value" id="rpc-calls">Loading...</span>
                    </div>
                    <div class="health-item">
                        <span class="health-label">Success Rate:</span>
                        <span class="health-value" id="success-rate">Loading...</span>
                    </div>
                </div>
            </div>

            <!-- Detailed Metrics -->
            <div class="details-card">
                <h3>Detailed Metrics</h3>
                <div id="detailed-metrics" class="metrics-grid">
                    <div class="loading">Loading detailed metrics...</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="dashboard-footer">
            <span>Renaissance-Grade Trading System</span>
            <span id="footer-timestamp">Last Updated: --</span>
        </footer>
    </div>

    <script src="dashboard.js"></script>
</body>
</html>
```

### Step 3: Create Dashboard Styles
**File:** `src/public/styles.css`

```css
/* Renaissance Trading Dashboard Styles */
:root {
  --primary-color: #1a1a2e;
  --secondary-color: #16213e;
  --accent-color: #0f3460;
  --success-color: #00ff88;
  --warning-color: #ffa500;
  --danger-color: #ff4757;
  --text-primary: #ffffff;
  --text-secondary: #b8b8b8;
  --card-bg: #2a2a4a;
  --border-color: #3a3a5a;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: var(--text-primary);
  min-height: 100vh;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
  padding: 20px 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  border: 1px solid var(--border-color);
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(45deg, var(--success-color), #00ccff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-dot.connected { background: var(--success-color); }
.status-dot.disconnected { background: var(--danger-color); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

/* Metric Cards */
.metric-card {
  background: var(--card-bg);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 255, 136, 0.1);
}

.metric-card h3 {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.efficiency .metric-value { color: var(--success-color); }
.detection .metric-value { color: #00ccff; }
.validation .metric-value { color: #ff6b6b; }
.readiness .metric-value { color: var(--warning-color); }

.metric-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Chart Card */
.chart-card {
  grid-column: span 2;
  background: var(--card-bg);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.chart-card h3 {
  margin-bottom: 20px;
  color: var(--text-primary);
}

/* Alert Card */
.alert-card {
  background: var(--card-bg);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.alert-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 4px solid var(--danger-color);
}

.alert-item.warning { border-left-color: var(--warning-color); }
.alert-item.info { border-left-color: #00ccff; }

.alert-message {
  flex: 1;
  font-size: 0.9rem;
}

.alert-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Health Card */
.health-card {
  background: var(--card-bg);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.health-grid {
  display: grid;
  gap: 15px;
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.health-label {
  color: var(--text-secondary);
}

.health-value {
  font-weight: 600;
  color: var(--text-primary);
}

/* Details Card */
.details-card {
  grid-column: span 2;
  background: var(--card-bg);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.metric-item {
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  text-align: center;
}

.metric-item .label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.metric-item .value {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Footer */
.dashboard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 15px 0;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Loading States */
.loading {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
  padding: 20px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-card,
  .details-card {
    grid-column: span 1;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}

/* Status Classes */
.status-excellent { color: var(--success-color); }
.status-good { color: #00ccff; }
.status-warning { color: var(--warning-color); }
.status-critical { color: var(--danger-color); }
```

### Step 4: Create Dashboard JavaScript
**File:** `src/public/dashboard.js`

```javascript
// THORP Trading Dashboard Frontend
class TradingDashboard {
  constructor() {
    this.apiUrl = '/api';
    this.updateInterval = 10000; // 10 seconds
    this.chart = null;
    this.isConnected = false;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing THORP Trading Dashboard...');
    
    // Initialize chart
    this.initChart();
    
    // Start data updates
    this.startDataUpdates();
    
    // Initial data load
    await this.updateDashboard();
  }

  initChart() {
    const ctx = document.getElementById('performance-chart').getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Trading Efficiency %',
            data: [],
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            tension: 0.4
          },
          {
            label: 'Token Detection (ms)',
            data: [],
            borderColor: '#00ccff',
            backgroundColor: 'rgba(0, 204, 255, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#b8b8b8' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: { color: '#b8b8b8' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: { color: '#b8b8b8' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  startDataUpdates() {
    setInterval(() => {
      this.updateDashboard();
    }, this.updateInterval);
  }

  async updateDashboard() {
    try {
      const [metricsResponse, alertsResponse] = await Promise.all([
        fetch(`${this.apiUrl}/metrics`),
        fetch(`${this.apiUrl}/alerts`)
      ]);

      if (!metricsResponse.ok || !alertsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const metricsData = await metricsResponse.json();
      const alertsData = await alertsResponse.json();

      this.updateConnectionStatus(true);
      this.updateMetrics(metricsData);
      this.updateAlerts(alertsData.alerts);
      this.updateSystemHealth(metricsData);
      this.updateChart(metricsData);
      
    } catch (error) {
      console.error('Dashboard update failed:', error);
      this.updateConnectionStatus(false);
    }
  }

  updateConnectionStatus(connected) {
    const statusDot = document.getElementById('connection-status');
    const lastUpdate = document.getElementById('last-update');
    
    this.isConnected = connected;
    
    if (connected) {
      statusDot.className = 'status-dot connected';
      lastUpdate.textContent = `Connected • ${new Date().toLocaleTimeString()}`;
    } else {
      statusDot.className = 'status-dot disconnected';
      lastUpdate.textContent = 'Disconnected';
    }
  }

  updateMetrics(data) {
    const { dashboard } = data;
    
    if (dashboard) {
      // Trading Efficiency
      const efficiency = dashboard.tradingEfficiency || 0;
      document.getElementById('trading-efficiency').textContent = `${efficiency.toFixed(1)}%`;
      document.getElementById('efficiency-status').textContent = this.getEfficiencyStatus(efficiency);
      
      // Token Detection
      const detection = dashboard.avgTokenDetection || 0;
      document.getElementById('token-detection').textContent = `${detection.toFixed(0)}ms`;
      document.getElementById('detection-status').textContent = detection < 100 ? '✅ Under SLA' : '⚠️ Above SLA';
      
      // Token Validation
      const validation = dashboard.avgTokenValidation || 0;
      document.getElementById('token-validation').textContent = `${validation.toFixed(0)}ms`;
      document.getElementById('validation-status').textContent = validation < 50 ? '✅ Under SLA' : '⚠️ Above SLA';
      
      // Meme Coin Readiness
      const readiness = dashboard.memeReadiness || 0;
      document.getElementById('meme-readiness').textContent = `${readiness.toFixed(1)}%`;
      document.getElementById('readiness-status').textContent = this.getReadinessStatus(readiness);
    }
    
    // Update footer timestamp
    document.getElementById('footer-timestamp').textContent = 
      `Last Updated: ${new Date().toLocaleString()}`;
  }

  updateAlerts(alerts) {
    const alertList = document.getElementById('alert-list');
    
    if (!alerts || alerts.length === 0) {
      alertList.innerHTML = '<div class="loading">No recent alerts</div>';
      return;
    }

    const alertHtml = alerts.slice(0, 10).map(alert => {
      const time = new Date(alert.timestamp).toLocaleTimeString();
      const severity = alert.severity || 'info';
      
      return `
        <div class="alert-item ${severity}">
          <div class="alert-message">${alert.message}</div>
          <div class="alert-time">${time}</div>
        </div>
      `;
    }).join('');

    alertList.innerHTML = alertHtml;
  }

  updateSystemHealth(data) {
    const { metrics, system } = data;
    
    if (system) {
      // Memory Usage
      const memoryMB = (system.memory.heapUsed / 1024 / 1024).toFixed(1);
      document.getElementById('memory-usage').textContent = `${memoryMB} MB`;
      
      // Uptime
      const uptimeHours = (system.uptime / 3600).toFixed(1);
      document.getElementById('system-uptime').textContent = `${uptimeHours}h`;
    }
    
    if (metrics) {
      // RPC Calls
      const totalCalls = metrics.rpcCalls?.total || 0;
      document.getElementById('rpc-calls').textContent = totalCalls.toLocaleString();
      
      // Success Rate
      const successRate = metrics.rpcCalls?.successRate || 0;
      document.getElementById('success-rate').textContent = `${(successRate * 100).toFixed(1)}%`;
    }
  }

  updateChart(data) {
    const { dashboard } = data;
    
    if (!dashboard || !this.chart) return;

    const now = new Date().toLocaleTimeString();
    const maxDataPoints = 20;

    // Add new data point
    this.chart.data.labels.push(now);
    this.chart.data.datasets[0].data.push(dashboard.tradingEfficiency || 0);
    this.chart.data.datasets[1].data.push(dashboard.avgTokenDetection || 0);

    // Remove old data points
    if (this.chart.data.labels.length > maxDataPoints) {
      this.chart.data.labels.shift();
      this.chart.data.datasets[0].data.shift();
      this.chart.data.datasets[1].data.shift();
    }

    this.chart.update('none');
  }

  getEfficiencyStatus(efficiency) {
    if (efficiency >= 90) return 'EXCELLENT';
    if (efficiency >= 80) return 'GOOD';
    if (efficiency >= 70) return 'FAIR';
    return 'NEEDS ATTENTION';
  }

  getReadinessStatus(readiness) {
    if (readiness >= 95) return 'READY TO TRADE';
    if (readiness >= 85) return 'MOSTLY READY';
    if (readiness >= 75) return 'PREPARING';
    return 'NOT READY';
  }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
  new TradingDashboard();
});
```

### Step 5: Integrate with Main Application
**File:** `src/index.js` (Add to existing file)

```javascript
// Add these imports at the top
const TradingDashboardServer = require('./monitoring/web-dashboard-server');

// Add this after the existing monitoring setup (around where global.performanceMetrics is set)
console.log('🚀 Initializing Web Dashboard Server...');
global.dashboardServer = new TradingDashboardServer();
global.dashboardServer.start();

// Add graceful shutdown for the web dashboard (in existing shutdown handler)
process.on('SIGINT', () => {
  console.log('\n🔌 Received SIGINT, initiating graceful shutdown...');
  
  // ... existing shutdown code ...
  
  // Add dashboard server shutdown
  if (global.dashboardServer) {
    global.dashboardServer.stop();
  }
  
  // ... rest of existing shutdown code ...
});
```

### Step 6: Install Required Dependencies
Add to your package.json or install via npm:

```bash
npm install express cors
```

## Expected Results

After implementation, you will have:

1. **Web Dashboard Access**: `http://localhost:3000/dashboard`
2. **API Endpoints**: 
   - `http://localhost:3000/api/metrics` (Real-time data)
   - `http://localhost:3000/api/alerts` (Alert history)
   - `http://localhost:3000/api/health` (System health)
3. **Real-time Updates**: Dashboard refreshes every 10 seconds
4. **Performance Charts**: Live trending of key metrics
5. **Professional Interface**: Clean, responsive design optimized for trading

## Validation Steps

1. Start your trading system: `node src/index.js`
2. Look for: `📊 Web Dashboard Server: http://localhost:3000/dashboard`
3. Open browser to: `http://localhost:3000/dashboard`
4. Verify real-time data updates every 10 seconds
5. Check API endpoints work: `http://localhost:3000/api/metrics`

This implementation provides a production-grade web interface for monitoring your Renaissance-style trading system with real-time performance visibility.