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