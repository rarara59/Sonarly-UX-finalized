# PROMPT: PM2 Health Monitor Script

## SINGLE FOCUS
Create system health monitoring that tracks trading performance and PM2 process status

## FILE TO CREATE
**CREATE**: `scripts/monitor-system-health.js`

## REQUIRED IMPORTS
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { createStructuredLogger } from '../src/logger/structured-logger.js';
```

## COMPLETE IMPLEMENTATION REQUIRED

### PM2 Health Monitor Class
```javascript
const execAsync = promisify(exec);
const logger = createStructuredLogger({ level: 'info' });

class TradingSystemHealthMonitor {
  constructor() {
    this.monitoring = false;
    this.healthHistory = [];
    this.alertThresholds = {
      maxMemoryMB: 300,
      maxCpuPercent: 80,
      minSuccessRate: 0.95,
      maxRestartFrequency: 3 // per hour
    };
    this.lastAlerts = new Map();
  }
  
  async startMonitoring(intervalMinutes = 5) {
    this.monitoring = true;
    
    console.log(`Starting trading system health monitoring (every ${intervalMinutes} minutes)`);
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkSystemHealth();
    }, intervalMinutes * 60 * 1000);
    
    // Initial health check
    await this.checkSystemHealth();
  }
  
  async checkSystemHealth() {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      pm2_status: null,
      system_resources: null,
      trading_performance: null,
      alerts_triggered: []
    };
    
    try {
      // Check PM2 process status
      healthCheck.pm2_status = await this.getPM2Status();
      
      // Check system resources
      healthCheck.system_resources = await this.getSystemResources();
      
      // Check trading performance (if detection system is running)
      healthCheck.trading_performance = await this.getTradingPerformance();
      
      // Evaluate alerts
      healthCheck.alerts_triggered = this.evaluateAlerts(healthCheck);
      
      // Send alerts if needed
      if (healthCheck.alerts_triggered.length > 0) {
        await this.sendAlerts(healthCheck.alerts_triggered);
      }
      
      this.healthHistory.push(healthCheck);
      
      // Keep only last 24 hours of history
      this.pruneHealthHistory();
      
      // Log summary
      logger.info('Health check completed', {
        processes_online: healthCheck.pm2_status.online_count,
        total_memory_mb: healthCheck.system_resources.total_memory_mb,
        alerts_count: healthCheck.alerts_triggered.length
      });
      
    } catch (error) {
      logger.error('Health check failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  async getPM2Status() {
    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      
      const processStats = processes.map(proc => ({
        name: proc.name,
        pid: proc.pid,
        status: proc.pm2_env?.status,
        memory_mb: Math.round((proc.monit?.memory || 0) / 1024 / 1024),
        cpu_percent: proc.monit?.cpu || 0,
        restarts: proc.pm2_env?.restart_time || 0,
        uptime_ms: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0
      }));
      
      const onlineCount = processStats.filter(p => p.status === 'online').length;
      const totalMemoryMB = processStats.reduce((sum, p) => sum + p.memory_mb, 0);
      const avgCpuPercent = processStats.length > 0 ? 
        processStats.reduce((sum, p) => sum + p.cpu_percent, 0) / processStats.length : 0;
      
      return {
        total_processes: processStats.length,
        online_count: onlineCount,
        stopped_count: processStats.filter(p => p.status !== 'online').length,
        total_memory_mb: totalMemoryMB,
        avg_cpu_percent: avgCpuPercent,
        total_restarts: processStats.reduce((sum, p) => sum + p.restarts, 0),
        processes: processStats
      };
      
    } catch (error) {
      return {
        error: 'PM2_NOT_ACCESSIBLE',
        message: error.message
      };
    }
  }
  
  async getSystemResources() {
    const memoryUsage = process.memoryUsage();
    
    return {
      node_memory: {
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external_mb: Math.round(memoryUsage.external / 1024 / 1024)
      },
      uptime_hours: Math.round(process.uptime() / 3600 * 100) / 100,
      timestamp: Date.now()
    };
  }
  
  async getTradingPerformance() {
    try {
      // Try to read recent trading performance data
      // This would connect to your actual detection system's metrics
      
      // For now, return placeholder that checks if detection system responds
      return {
        detection_system_responsive: true,
        last_signal_timestamp: null,
        signals_generated_last_hour: 0,
        estimated_competitive_edge_seconds: 297 // From RN1 results
      };
      
    } catch (error) {
      return {
        detection_system_responsive: false,
        error: error.message
      };
    }
  }
  
  evaluateAlerts(healthCheck) {
    const alerts = [];
    
    // PM2 process alerts
    if (healthCheck.pm2_status.online_count === 0) {
      alerts.push({
        type: 'CRITICAL',
        category: 'PM2_ALL_PROCESSES_DOWN',
        message: 'All PM2 processes stopped',
        impact: 'NO_TRADING_CAPABILITY'
      });
    } else if (healthCheck.pm2_status.stopped_count > 0) {
      alerts.push({
        type: 'WARNING',
        category: 'PM2_SOME_PROCESSES_DOWN',
        message: `${healthCheck.pm2_status.stopped_count} processes stopped`,
        impact: 'REDUCED_TRADING_CAPABILITY'
      });
    }
    
    // Memory alerts
    if (healthCheck.pm2_status.total_memory_mb > this.alertThresholds.maxMemoryMB) {
      alerts.push({
        type: 'WARNING',
        category: 'HIGH_MEMORY_USAGE',
        message: `Memory usage: ${healthCheck.pm2_status.total_memory_mb}MB`,
        impact: 'POTENTIAL_RESTART_NEEDED'
      });
    }
    
    // CPU alerts
    if (healthCheck.pm2_status.avg_cpu_percent > this.alertThresholds.maxCpuPercent) {
      alerts.push({
        type: 'WARNING',
        category: 'HIGH_CPU_USAGE',
        message: `CPU usage: ${healthCheck.pm2_status.avg_cpu_percent}%`,
        impact: 'PERFORMANCE_DEGRADATION'
      });
    }
    
    // Restart frequency alerts
    const recentRestarts = this.calculateRecentRestarts();
    if (recentRestarts > this.alertThresholds.maxRestartFrequency) {
      alerts.push({
        type: 'CRITICAL',
        category: 'FREQUENT_RESTARTS',
        message: `${recentRestarts} restarts in last hour`,
        impact: 'SYSTEM_INSTABILITY'
      });
    }
    
    return alerts;
  }
  
  async sendAlerts(alerts) {
    for (const alert of alerts) {
      const alertKey = `${alert.category}_${Math.floor(Date.now() / 3600000)}`; // Hour-based deduplication
      
      // Avoid spam by checking if we sent this alert recently
      if (this.lastAlerts.has(alertKey)) {
        continue;
      }
      
      this.lastAlerts.set(alertKey, Date.now());
      
      // Log alert (could extend to SMS/email)
      logger.warn('TRADING SYSTEM ALERT', {
        type: alert.type,
        category: alert.category,
        message: alert.message,
        impact: alert.impact,
        timestamp: new Date().toISOString()
      });
      
      console.warn(`🚨 ${alert.type}: ${alert.message}`);
    }
  }
  
  calculateRecentRestarts() {
    // Count restarts in last hour from health history
    const oneHourAgo = Date.now() - 3600000;
    const recentChecks = this.healthHistory.filter(h => 
      new Date(h.timestamp).getTime() > oneHourAgo
    );
    
    if (recentChecks.length < 2) return 0;
    
    const earliestRestarts = recentChecks[0]?.pm2_status?.total_restarts || 0;
    const latestRestarts = recentChecks[recentChecks.length - 1]?.pm2_status?.total_restarts || 0;
    
    return latestRestarts - earliestRestarts;
  }
  
  pruneHealthHistory() {
    const twentyFourHoursAgo = Date.now() - 24 * 3600000;
    this.healthHistory = this.healthHistory.filter(h => 
      new Date(h.timestamp).getTime() > twentyFourHoursAgo
    );
  }
  
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoring = false;
      console.log('Health monitoring stopped');
    }
  }
  
  async generateHealthReport() {
    const report = {
      report_time: new Date().toISOString(),
      monitoring_duration_hours: this.healthHistory.length > 0 ? 
        (Date.now() - new Date(this.healthHistory[0].timestamp).getTime()) / 3600000 : 0,
      current_status: this.healthHistory.length > 0 ? this.healthHistory[this.healthHistory.length - 1] : null,
      performance_summary: this.calculatePerformanceSummary(),
      alert_summary: this.calculateAlertSummary(),
      recommendations: this.generateRecommendations()
    };
    
    await fs.writeFile('results/system-health-report.json', JSON.stringify(report, null, 2));
    return report;
  }
}

// Export for use by startup script
export { TradingSystemHealthMonitor };

// If run directly, start monitoring
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new TradingSystemHealthMonitor();
  
  process.on('SIGINT', async () => {
    console.log('\nStopping health monitoring...');
    monitor.stopMonitoring();
    await monitor.generateHealthReport();
    process.exit(0);
  });
  
  monitor.startMonitoring(5); // Monitor every 5 minutes
}
```

## SUCCESS CRITERIA
- Monitors PM2 processes every 5 minutes
- Tracks memory, CPU, and restart patterns
- Generates alerts for critical issues
- Creates health reports for analysis
- Runs continuously without performance impact