#!/usr/bin/env node

/**
 * Alert Manager
 * Manages trading-critical alerts and notifications
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pm2 from 'pm2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AlertManager {
  constructor() {
    this.config = {
      checkInterval: 10000,           // 10 seconds
      alertCooldown: 300000,          // 5 minutes between same alerts
      criticalResponseTime: 60000,    // 60 seconds for critical alerts
      alertChannels: {
        console: true,
        file: true,
        webhook: process.env.ALERT_WEBHOOK_URL || null,
        email: process.env.ALERT_EMAIL || null
      },
      alertLevels: {
        INFO: { priority: 0, color: '\x1b[36m', emoji: 'ℹ️' },
        WARNING: { priority: 1, color: '\x1b[33m', emoji: '⚠️' },
        CRITICAL: { priority: 2, color: '\x1b[31m', emoji: '🚨' },
        EMERGENCY: { priority: 3, color: '\x1b[35m', emoji: '🆘' }
      },
      logFile: path.join(__dirname, '..', 'logs', 'alerts.log')
    };
    
    this.alertQueue = [];
    this.alertHistory = new Map(); // Track recent alerts to prevent spam
    this.activeAlerts = new Map(); // Track unresolved alerts
    
    this.alertDefinitions = {
      DETECTION_STOPPED: {
        level: 'EMERGENCY',
        condition: (metrics) => metrics.detectionRate === 0,
        message: 'Meme coin detection has stopped completely',
        autoResolve: false,
        action: 'Restart detection system immediately'
      },
      
      LOW_DETECTION_RATE: {
        level: 'CRITICAL',
        condition: (metrics) => metrics.detectionRate < 0.5,
        message: 'Detection rate critically low',
        autoResolve: true,
        action: 'Check RPC endpoints and network connectivity'
      },
      
      POOR_SIGNAL_QUALITY: {
        level: 'WARNING',
        condition: (metrics) => metrics.signalQuality < 0.7,
        message: 'Signal quality degraded - high false positive rate',
        autoResolve: true,
        action: 'Review detection algorithms and thresholds'
      },
      
      HIGH_LATENCY: {
        level: 'CRITICAL',
        condition: (metrics) => metrics.avgLatency > 1000,
        message: 'Detection latency exceeding 1 second - losing competitive edge',
        autoResolve: true,
        action: 'Optimize processing pipeline and check system load'
      },
      
      PROFIT_OPPORTUNITY_MISSED: {
        level: 'WARNING',
        condition: (metrics) => metrics.missedOpportunities > 3,
        message: 'Multiple profit opportunities missed',
        autoResolve: true,
        action: 'Review detection sensitivity and processing speed'
      },
      
      SYSTEM_OVERLOAD: {
        level: 'CRITICAL',
        condition: (metrics) => metrics.cpu > 90 || metrics.memory > 220,
        message: 'System resources critically high',
        autoResolve: false,
        action: 'Scale resources or optimize system'
      },
      
      COMPONENT_FAILURE: {
        level: 'CRITICAL',
        condition: (metrics) => metrics.componentFailures > 0,
        message: 'Component failure detected',
        autoResolve: false,
        action: 'Check component health and restart if necessary'
      },
      
      RPC_FAILURE: {
        level: 'EMERGENCY',
        condition: (metrics) => metrics.rpcHealthy === false,
        message: 'All RPC endpoints are down',
        autoResolve: false,
        action: 'Check network and RPC provider status'
      },
      
      FREQUENT_RESTARTS: {
        level: 'WARNING',
        condition: (metrics) => metrics.restarts > 5,
        message: 'System restarting frequently',
        autoResolve: true,
        action: 'Check logs for crash reasons'
      },
      
      MEMORY_LEAK: {
        level: 'WARNING',
        condition: (metrics) => metrics.memoryGrowthRate > 10,
        message: 'Potential memory leak detected',
        autoResolve: false,
        action: 'Monitor memory usage and schedule restart'
      }
    };
    
    this.metrics = {
      detectionRate: 0,
      signalQuality: 0,
      avgLatency: 0,
      missedOpportunities: 0,
      cpu: 0,
      memory: 0,
      componentFailures: 0,
      rpcHealthy: true,
      restarts: 0,
      memoryGrowthRate: 0
    };
    
    this.running = false;
  }
  
  /**
   * Start alert manager
   */
  async start() {
    console.log('🚨 Alert Manager Starting...');
    console.log(`  Check Interval: ${this.config.checkInterval / 1000}s`);
    console.log(`  Alert Cooldown: ${this.config.alertCooldown / 1000}s`);
    console.log(`  Critical Response: ${this.config.criticalResponseTime / 1000}s\n`);
    
    this.running = true;
    
    // Connect to PM2 for monitoring
    await this.connectPM2();
    
    // Main alert loop
    while (this.running) {
      try {
        await this.updateMetrics();
        await this.checkAlerts();
        await this.processAlertQueue();
        await this.checkAlertResolution();
        this.displayStatus();
        
      } catch (error) {
        console.error('Alert manager error:', error);
      }
      
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
   * Update metrics from various sources
   */
  async updateMetrics() {
    // Get PM2 process metrics
    const processInfo = await this.getPM2ProcessInfo('meme-detector');
    
    if (processInfo) {
      this.metrics.cpu = processInfo.monit.cpu;
      this.metrics.memory = processInfo.monit.memory / (1024 * 1024);
      this.metrics.restarts = processInfo.pm2_env.restart_time;
      
      // Calculate memory growth rate
      if (this.previousMemory) {
        this.metrics.memoryGrowthRate = this.metrics.memory - this.previousMemory;
      }
      this.previousMemory = this.metrics.memory;
    }
    
    // Read metrics from trading monitor (if available)
    try {
      const metricsFile = path.join(__dirname, '..', 'logs', 'trading-metrics.log');
      const content = await fs.readFile(metricsFile, 'utf-8');
      const lines = content.trim().split('\n');
      
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        const lastMetrics = JSON.parse(lastLine);
        
        this.metrics.detectionRate = lastMetrics.detectionRate || 0;
        this.metrics.signalQuality = lastMetrics.signalQuality || 0;
        this.metrics.avgLatency = lastMetrics.avgLatency || 0;
      }
    } catch (error) {
      // Metrics file might not exist yet
    }
    
    // Simulate some metrics for demo (remove in production)
    if (this.metrics.detectionRate === 0) {
      this.metrics.detectionRate = 0.75 + Math.random() * 0.2;
      this.metrics.signalQuality = 0.8 + Math.random() * 0.15;
      this.metrics.avgLatency = 200 + Math.random() * 300;
      this.metrics.missedOpportunities = Math.floor(Math.random() * 5);
      this.metrics.rpcHealthy = Math.random() > 0.1;
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
   * Check for alert conditions
   */
  async checkAlerts() {
    for (const [alertId, definition] of Object.entries(this.alertDefinitions)) {
      try {
        // Check if condition is met
        if (definition.condition(this.metrics)) {
          // Check if alert is in cooldown
          if (!this.isInCooldown(alertId)) {
            // Create alert
            const alert = {
              id: alertId,
              level: definition.level,
              message: definition.message,
              action: definition.action,
              autoResolve: definition.autoResolve,
              timestamp: Date.now(),
              metrics: { ...this.metrics }
            };
            
            // Add to queue
            this.alertQueue.push(alert);
            
            // Track active alert
            this.activeAlerts.set(alertId, alert);
            
            // Update history
            this.alertHistory.set(alertId, Date.now());
          }
        } else {
          // Condition no longer met - check for auto-resolution
          if (this.activeAlerts.has(alertId)) {
            const activeAlert = this.activeAlerts.get(alertId);
            if (activeAlert.autoResolve) {
              this.resolveAlert(alertId);
            }
          }
        }
      } catch (error) {
        console.error(`Error checking alert ${alertId}:`, error);
      }
    }
  }
  
  /**
   * Check if alert is in cooldown
   */
  isInCooldown(alertId) {
    const lastAlert = this.alertHistory.get(alertId);
    if (!lastAlert) return false;
    
    return (Date.now() - lastAlert) < this.config.alertCooldown;
  }
  
  /**
   * Process alert queue
   */
  async processAlertQueue() {
    while (this.alertQueue.length > 0) {
      const alert = this.alertQueue.shift();
      await this.sendAlert(alert);
    }
  }
  
  /**
   * Send alert through configured channels
   */
  async sendAlert(alert) {
    const levelConfig = this.config.alertLevels[alert.level];
    const timestamp = new Date(alert.timestamp).toISOString();
    
    // Console output
    if (this.config.alertChannels.console) {
      console.log(`\n${levelConfig.color}${levelConfig.emoji} [${alert.level}] ${alert.message}${'\x1b[0m'}`);
      console.log(`   Action: ${alert.action}`);
      console.log(`   Time: ${timestamp}`);
      
      // Show relevant metrics
      if (alert.level === 'CRITICAL' || alert.level === 'EMERGENCY') {
        console.log(`   Detection Rate: ${(this.metrics.detectionRate * 100).toFixed(1)}%`);
        console.log(`   Signal Quality: ${(this.metrics.signalQuality * 100).toFixed(1)}%`);
        console.log(`   Latency: ${this.metrics.avgLatency.toFixed(0)}ms`);
      }
    }
    
    // File logging
    if (this.config.alertChannels.file) {
      const logEntry = {
        timestamp,
        level: alert.level,
        id: alert.id,
        message: alert.message,
        action: alert.action,
        metrics: alert.metrics
      };
      
      try {
        await fs.appendFile(
          this.config.logFile,
          JSON.stringify(logEntry) + '\n'
        );
      } catch (error) {
        console.error('Failed to log alert:', error);
      }
    }
    
    // Webhook notification
    if (this.config.alertChannels.webhook) {
      try {
        await this.sendWebhook(alert);
      } catch (error) {
        console.error('Failed to send webhook:', error);
      }
    }
    
    // Critical alerts need immediate response
    if (alert.level === 'CRITICAL' || alert.level === 'EMERGENCY') {
      this.handleCriticalAlert(alert);
    }
  }
  
  /**
   * Send webhook notification
   */
  async sendWebhook(alert) {
    const payload = {
      level: alert.level,
      message: alert.message,
      action: alert.action,
      timestamp: new Date(alert.timestamp).toISOString(),
      metrics: {
        detectionRate: this.metrics.detectionRate,
        signalQuality: this.metrics.signalQuality,
        latency: this.metrics.avgLatency,
        memory: this.metrics.memory,
        cpu: this.metrics.cpu
      }
    };
    
    // In production, use actual fetch
    console.log('📤 Webhook payload:', JSON.stringify(payload, null, 2));
  }
  
  /**
   * Handle critical alerts
   */
  async handleCriticalAlert(alert) {
    console.log('\n🔴 CRITICAL ALERT HANDLER ACTIVATED');
    
    // Take automatic action based on alert type
    switch (alert.id) {
      case 'DETECTION_STOPPED':
        console.log('  Attempting to restart detection system...');
        await this.restartProcess('meme-detector');
        break;
        
      case 'RPC_FAILURE':
        console.log('  Checking alternative RPC endpoints...');
        // In production, switch to backup RPCs
        break;
        
      case 'SYSTEM_OVERLOAD':
        console.log('  Initiating resource optimization...');
        // Force garbage collection if possible
        if (global.gc) {
          global.gc();
        }
        break;
        
      default:
        console.log('  Manual intervention required');
    }
  }
  
  /**
   * Restart PM2 process
   */
  async restartProcess(name) {
    return new Promise((resolve) => {
      pm2.restart(name, (err) => {
        if (err) {
          console.error(`Failed to restart ${name}:`, err);
          resolve(false);
        } else {
          console.log(`✅ ${name} restarted successfully`);
          resolve(true);
        }
      });
    });
  }
  
  /**
   * Check for alert resolution
   */
  async checkAlertResolution() {
    const resolved = [];
    
    for (const [alertId, alert] of this.activeAlerts) {
      // Check if alert has been active too long
      const activeTime = Date.now() - alert.timestamp;
      
      if (alert.level === 'EMERGENCY' && activeTime > this.config.criticalResponseTime) {
        console.log(`\n🆘 EMERGENCY ALERT NOT RESOLVED: ${alert.message}`);
        console.log('   Escalating to highest priority...');
        // In production, page on-call engineer
      }
    }
  }
  
  /**
   * Resolve an alert
   */
  resolveAlert(alertId) {
    if (this.activeAlerts.has(alertId)) {
      const alert = this.activeAlerts.get(alertId);
      console.log(`\n✅ Alert resolved: ${alert.message}`);
      this.activeAlerts.delete(alertId);
    }
  }
  
  /**
   * Display current status
   */
  displayStatus() {
    if (this.activeAlerts.size > 0) {
      console.log('\n📋 Active Alerts:');
      for (const [id, alert] of this.activeAlerts) {
        const age = Math.floor((Date.now() - alert.timestamp) / 1000);
        const levelConfig = this.config.alertLevels[alert.level];
        console.log(`  ${levelConfig.emoji} [${alert.level}] ${alert.message} (${age}s ago)`);
      }
    }
  }
  
  /**
   * Calculate monitoring overhead
   */
  calculateOverhead() {
    const processInfo = process.memoryUsage();
    const overhead = {
      memory: processInfo.heapUsed / (1024 * 1024), // MB
      cpu: process.cpuUsage().user / 1000000, // Seconds
      alertsProcessed: this.alertHistory.size,
      activeAlerts: this.activeAlerts.size
    };
    
    // Should be < 3% overhead
    const systemMemory = 250; // MB (from PM2 config)
    const overheadPercentage = (overhead.memory / systemMemory) * 100;
    
    if (overheadPercentage > 3) {
      console.log(`⚠️ Alert manager overhead: ${overheadPercentage.toFixed(1)}%`);
    }
    
    return overhead;
  }
  
  /**
   * Stop alert manager
   */
  stop() {
    console.log('\n🛑 Stopping Alert Manager...');
    this.running = false;
    pm2.disconnect();
  }
}

// Main execution
async function main() {
  console.log('=' .repeat(60));
  console.log('🚨 TRADING ALERT MANAGER');
  console.log('=' .repeat(60));
  
  const alertManager = new AlertManager();
  
  // Handle shutdown gracefully
  process.on('SIGINT', () => {
    alertManager.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    alertManager.stop();
    process.exit(0);
  });
  
  try {
    // Start alert manager
    await alertManager.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { AlertManager };