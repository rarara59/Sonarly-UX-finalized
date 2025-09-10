#!/usr/bin/env node

/**
 * Trading Performance Monitor
 * Tracks detection rates, signal quality, and competitive timing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pm2 from 'pm2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TradingMonitor {
  constructor() {
    this.config = {
      checkInterval: 30000,        // 30 seconds
      metricsWindow: 300000,       // 5 minutes rolling window
      alertThresholds: {
        detectionRate: 0.7,        // Alert if < 70% detection rate
        signalQuality: 0.8,        // Alert if < 80% signal quality
        competitiveTiming: 500,    // Alert if > 500ms average latency
        errorRate: 0.1,            // Alert if > 10% error rate
        memoryUsage: 200,          // Alert if > 200MB memory
        cpuUsage: 80               // Alert if > 80% CPU
      },
      logFile: path.join(__dirname, '..', 'logs', 'trading-metrics.log')
    };
    
    this.metrics = {
      detectionRate: {
        attempts: 0,
        successes: 0,
        rate: 0,
        trend: 'stable'
      },
      signalQuality: {
        totalSignals: 0,
        validSignals: 0,
        falsePositives: 0,
        quality: 0
      },
      competitiveTiming: {
        measurements: [],
        average: 0,
        median: 0,
        p95: 0
      },
      systemHealth: {
        memory: 0,
        cpu: 0,
        uptime: 0,
        restarts: 0,
        errors: 0
      },
      tradingPerformance: {
        opportunitiesDetected: 0,
        profitableSignals: 0,
        estimatedProfit: 0,
        competitiveAdvantage: 0
      }
    };
    
    this.history = {
      detectionRates: [],
      signalQualities: [],
      timings: [],
      alerts: []
    };
    
    this.monitoring = false;
  }
  
  /**
   * Start monitoring
   */
  async start() {
    console.log('🔍 Trading Monitor Starting...');
    console.log(`  Check Interval: ${this.config.checkInterval / 1000}s`);
    console.log(`  Metrics Window: ${this.config.metricsWindow / 1000}s\n`);
    
    this.monitoring = true;
    
    // Connect to PM2
    await this.connectPM2();
    
    // Main monitoring loop
    while (this.monitoring) {
      try {
        await this.collectMetrics();
        await this.analyzePerformance();
        await this.checkThresholds();
        await this.logMetrics();
        
        // Display current status
        this.displayStatus();
        
      } catch (error) {
        console.error('Monitor error:', error);
      }
      
      // Wait for next check
      await new Promise(resolve => setTimeout(resolve, this.config.checkInterval));
    }
  }
  
  /**
   * Connect to PM2
   */
  async connectPM2() {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Failed to connect to PM2:', err);
          reject(err);
        } else {
          console.log('✅ Connected to PM2');
          resolve();
        }
      });
    });
  }
  
  /**
   * Collect metrics from system
   */
  async collectMetrics() {
    // Get PM2 process info
    const processInfo = await this.getPM2ProcessInfo('meme-detector');
    
    if (processInfo) {
      // System health metrics
      this.metrics.systemHealth.memory = processInfo.monit.memory / (1024 * 1024); // MB
      this.metrics.systemHealth.cpu = processInfo.monit.cpu;
      this.metrics.systemHealth.uptime = Date.now() - processInfo.pm2_env.created_at;
      this.metrics.systemHealth.restarts = processInfo.pm2_env.restart_time;
      
      // Simulate detection metrics (in production, these would come from the actual system)
      this.simulateDetectionMetrics();
      
      // Update competitive timing
      this.updateCompetitiveTiming();
    }
  }
  
  /**
   * Get PM2 process information
   */
  async getPM2ProcessInfo(name) {
    return new Promise((resolve) => {
      pm2.describe(name, (err, processDescription) => {
        if (err || !processDescription || processDescription.length === 0) {
          resolve(null);
        } else {
          resolve(processDescription[0]);
        }
      });
    });
  }
  
  /**
   * Simulate detection metrics (replace with actual metrics in production)
   */
  simulateDetectionMetrics() {
    // Detection rate simulation
    const attempts = Math.floor(Math.random() * 100) + 50;
    const successes = Math.floor(attempts * (0.7 + Math.random() * 0.25));
    
    this.metrics.detectionRate.attempts += attempts;
    this.metrics.detectionRate.successes += successes;
    this.metrics.detectionRate.rate = this.metrics.detectionRate.successes / 
                                       this.metrics.detectionRate.attempts;
    
    // Signal quality simulation
    const newSignals = Math.floor(Math.random() * 20) + 10;
    const validSignals = Math.floor(newSignals * (0.8 + Math.random() * 0.15));
    const falsePositives = newSignals - validSignals;
    
    this.metrics.signalQuality.totalSignals += newSignals;
    this.metrics.signalQuality.validSignals += validSignals;
    this.metrics.signalQuality.falsePositives += falsePositives;
    this.metrics.signalQuality.quality = this.metrics.signalQuality.validSignals / 
                                         this.metrics.signalQuality.totalSignals;
    
    // Trading performance
    this.metrics.tradingPerformance.opportunitiesDetected += Math.floor(Math.random() * 5);
    this.metrics.tradingPerformance.profitableSignals += Math.floor(Math.random() * 3);
    this.metrics.tradingPerformance.estimatedProfit += Math.random() * 10000;
  }
  
  /**
   * Update competitive timing metrics
   */
  updateCompetitiveTiming() {
    // Simulate timing measurements (in production, measure actual detection latency)
    const newTiming = 150 + Math.random() * 200; // 150-350ms
    
    this.metrics.competitiveTiming.measurements.push(newTiming);
    
    // Keep only recent measurements
    const cutoff = Date.now() - this.config.metricsWindow;
    this.metrics.competitiveTiming.measurements = 
      this.metrics.competitiveTiming.measurements.slice(-100); // Keep last 100
    
    // Calculate statistics
    if (this.metrics.competitiveTiming.measurements.length > 0) {
      const sorted = [...this.metrics.competitiveTiming.measurements].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      
      this.metrics.competitiveTiming.average = sum / sorted.length;
      this.metrics.competitiveTiming.median = sorted[Math.floor(sorted.length / 2)];
      this.metrics.competitiveTiming.p95 = sorted[Math.floor(sorted.length * 0.95)];
    }
  }
  
  /**
   * Analyze trading performance
   */
  async analyzePerformance() {
    // Calculate competitive advantage
    const baselineLatency = 3000; // 3 seconds for manual traders
    const ourLatency = this.metrics.competitiveTiming.average;
    this.metrics.tradingPerformance.competitiveAdvantage = 
      (baselineLatency - ourLatency) / baselineLatency * 100;
    
    // Trend analysis for detection rate
    this.history.detectionRates.push({
      timestamp: Date.now(),
      rate: this.metrics.detectionRate.rate
    });
    
    // Keep only recent history
    const cutoff = Date.now() - this.config.metricsWindow;
    this.history.detectionRates = this.history.detectionRates.filter(h => h.timestamp > cutoff);
    
    // Calculate trend
    if (this.history.detectionRates.length > 2) {
      const recent = this.history.detectionRates.slice(-3);
      const avgRecent = recent.reduce((sum, h) => sum + h.rate, 0) / recent.length;
      const older = this.history.detectionRates.slice(0, -3);
      const avgOlder = older.reduce((sum, h) => sum + h.rate, 0) / older.length || avgRecent;
      
      if (avgRecent > avgOlder * 1.05) {
        this.metrics.detectionRate.trend = 'improving';
      } else if (avgRecent < avgOlder * 0.95) {
        this.metrics.detectionRate.trend = 'degrading';
      } else {
        this.metrics.detectionRate.trend = 'stable';
      }
    }
  }
  
  /**
   * Check alert thresholds
   */
  async checkThresholds() {
    const alerts = [];
    
    // Detection rate alert
    if (this.metrics.detectionRate.rate < this.config.alertThresholds.detectionRate) {
      alerts.push({
        level: 'WARNING',
        metric: 'Detection Rate',
        value: `${(this.metrics.detectionRate.rate * 100).toFixed(1)}%`,
        threshold: `${(this.config.alertThresholds.detectionRate * 100)}%`,
        message: 'Detection rate below threshold'
      });
    }
    
    // Signal quality alert
    if (this.metrics.signalQuality.quality < this.config.alertThresholds.signalQuality) {
      alerts.push({
        level: 'WARNING',
        metric: 'Signal Quality',
        value: `${(this.metrics.signalQuality.quality * 100).toFixed(1)}%`,
        threshold: `${(this.config.alertThresholds.signalQuality * 100)}%`,
        message: 'Signal quality degraded'
      });
    }
    
    // Competitive timing alert
    if (this.metrics.competitiveTiming.average > this.config.alertThresholds.competitiveTiming) {
      alerts.push({
        level: 'CRITICAL',
        metric: 'Detection Latency',
        value: `${this.metrics.competitiveTiming.average.toFixed(0)}ms`,
        threshold: `${this.config.alertThresholds.competitiveTiming}ms`,
        message: 'Detection latency too high - losing competitive edge'
      });
    }
    
    // Memory usage alert
    if (this.metrics.systemHealth.memory > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        level: 'WARNING',
        metric: 'Memory Usage',
        value: `${this.metrics.systemHealth.memory.toFixed(0)}MB`,
        threshold: `${this.config.alertThresholds.memoryUsage}MB`,
        message: 'High memory usage detected'
      });
    }
    
    // Process alerts
    if (alerts.length > 0) {
      for (const alert of alerts) {
        await this.sendAlert(alert);
      }
      this.history.alerts.push(...alerts.map(a => ({ ...a, timestamp: Date.now() })));
    }
  }
  
  /**
   * Send alert
   */
  async sendAlert(alert) {
    console.log(`\n🚨 ALERT [${alert.level}]: ${alert.message}`);
    console.log(`   ${alert.metric}: ${alert.value} (threshold: ${alert.threshold})`);
    
    // In production, send to alert manager
    if (process.env.ALERT_WEBHOOK_URL) {
      // Send webhook notification
      try {
        const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: alert.level,
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold,
            message: alert.message,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to send alert:', error);
      }
    }
  }
  
  /**
   * Log metrics to file
   */
  async logMetrics() {
    const logEntry = {
      timestamp: new Date().toISOString(),
      detectionRate: this.metrics.detectionRate.rate,
      signalQuality: this.metrics.signalQuality.quality,
      avgLatency: this.metrics.competitiveTiming.average,
      p95Latency: this.metrics.competitiveTiming.p95,
      memory: this.metrics.systemHealth.memory,
      cpu: this.metrics.systemHealth.cpu,
      opportunities: this.metrics.tradingPerformance.opportunitiesDetected,
      profitableSignals: this.metrics.tradingPerformance.profitableSignals,
      estimatedProfit: this.metrics.tradingPerformance.estimatedProfit,
      competitiveAdvantage: this.metrics.tradingPerformance.competitiveAdvantage
    };
    
    try {
      await fs.appendFile(
        this.config.logFile,
        JSON.stringify(logEntry) + '\n'
      );
    } catch (error) {
      console.error('Failed to log metrics:', error);
    }
  }
  
  /**
   * Display current status
   */
  displayStatus() {
    console.log('\n📊 Trading Performance Metrics');
    console.log('=' .repeat(50));
    
    console.log('\n🎯 Detection Performance:');
    console.log(`  Rate: ${(this.metrics.detectionRate.rate * 100).toFixed(1)}% (${this.metrics.detectionRate.trend})`);
    console.log(`  Quality: ${(this.metrics.signalQuality.quality * 100).toFixed(1)}%`);
    console.log(`  False Positives: ${this.metrics.signalQuality.falsePositives}`);
    
    console.log('\n⚡ Competitive Timing:');
    console.log(`  Average: ${this.metrics.competitiveTiming.average.toFixed(0)}ms`);
    console.log(`  Median: ${this.metrics.competitiveTiming.median.toFixed(0)}ms`);
    console.log(`  P95: ${this.metrics.competitiveTiming.p95.toFixed(0)}ms`);
    console.log(`  Advantage: ${this.metrics.tradingPerformance.competitiveAdvantage.toFixed(1)}%`);
    
    console.log('\n💰 Trading Results:');
    console.log(`  Opportunities: ${this.metrics.tradingPerformance.opportunitiesDetected}`);
    console.log(`  Profitable: ${this.metrics.tradingPerformance.profitableSignals}`);
    console.log(`  Est. Profit: $${this.metrics.tradingPerformance.estimatedProfit.toFixed(2)}`);
    
    console.log('\n🖥️ System Health:');
    console.log(`  Memory: ${this.metrics.systemHealth.memory.toFixed(1)}MB`);
    console.log(`  CPU: ${this.metrics.systemHealth.cpu}%`);
    console.log(`  Uptime: ${(this.metrics.systemHealth.uptime / 3600000).toFixed(1)}h`);
    console.log(`  Restarts: ${this.metrics.systemHealth.restarts}`);
    
    if (this.history.alerts.length > 0) {
      const recentAlerts = this.history.alerts.slice(-3);
      console.log('\n⚠️ Recent Alerts:');
      for (const alert of recentAlerts) {
        const time = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`  [${time}] ${alert.level}: ${alert.message}`);
      }
    }
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    console.log('\n🛑 Stopping Trading Monitor...');
    this.monitoring = false;
    pm2.disconnect();
  }
  
  /**
   * Calculate performance overhead
   */
  calculateOverhead() {
    const processInfo = process.memoryUsage();
    const overhead = {
      memory: processInfo.heapUsed / (1024 * 1024), // MB
      cpu: process.cpuUsage().user / 1000000 // Seconds
    };
    
    return overhead;
  }
}

// Main execution
async function main() {
  console.log('=' .repeat(60));
  console.log('📈 TRADING PERFORMANCE MONITOR');
  console.log('=' .repeat(60));
  
  const monitor = new TradingMonitor();
  
  // Handle shutdown gracefully
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    monitor.stop();
    process.exit(0);
  });
  
  try {
    // Start monitoring
    await monitor.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TradingMonitor };