import TradingDashboardServer from './monitoring/web-dashboard-server.js';

// Create mock global objects for testing
global.performanceMetrics = {
  getMetrics: () => ({
    rpcCalls: { total: 1000, successful: 950, failed: 50, successRate: 0.95 },
    performance: { scan_latency_p50: 45, validation_latency_p50: 25 }
  }),
  getHistoricalData: (hours) => [],
  getRecentAlerts: () => [
    { timestamp: Date.now(), severity: 'warning', message: 'Test alert', metric: 'latency', value: 120, threshold: 100 }
  ],
  getPerformanceStats: () => ({
    scan_latency_p50: 45,
    scan_latency_p95: 95,
    validation_latency_p50: 25,
    validation_success_rate_percent: 95,
    rpc_failure_rate_percent: 5,
    candidate_rate_per_minute: 10,
    scan_rate_per_minute: 12,
    memory_mb: 256,
    uptime_seconds: 3600
  })
};

global.tradingDashboard = {
  getDashboardData: () => ({
    tradingEfficiency: 85.5,
    avgTokenDetection: 45,
    avgTokenValidation: 25,
    memeReadiness: 92.0,
    systemHealth: { status: 'healthy' },
    alerts: [],
    tradingMetrics: {}
  })
};

console.log('🚀 Starting Web Dashboard Server (Test Mode)...');
const dashboardServer = new TradingDashboardServer();
dashboardServer.start();

console.log('✅ Dashboard running in test mode');
console.log('📊 Visit: http://localhost:3000/dashboard');
console.log('🔗 API: http://localhost:3000/api/metrics');
console.log('Press Ctrl+C to stop...');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down dashboard server...');
  dashboardServer.stop();
  process.exit(0);
});