#!/usr/bin/env node

/**
 * PM2 Configuration Calculator
 * Generates optimized PM2 config based on measured memory patterns
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PM2ConfigCalculator {
  constructor() {
    // Configuration parameters
    this.config = {
      safetyMargin: 0.20,          // 20% safety buffer
      targetCycleDuration: 14400,   // 4 hours in seconds
      minRestartInterval: 10800,   // 3.5 hours minimum
      maxRestartInterval: 16200,   // 4.5 hours maximum
      baseMemoryMB: 150,           // Base Node.js memory
      maxMemoryMB: 512,            // Maximum allowed memory
      instances: 1,                // Number of PM2 instances
      execMode: 'fork'             // PM2 execution mode
    };
    
    // Memory analysis results
    this.memoryAnalysis = {
      baselineMemory: 0,
      growthRate: 0,
      componentGrowth: {},
      projectedUsage: {},
      recommendedLimits: {}
    };
  }
  
  /**
   * Load and analyze memory data
   */
  async analyzeMemoryData() {
    console.log('📊 Analyzing memory growth data...\n');
    
    try {
      // Load memory data from baseline test
      const memoryDataPath = path.join(__dirname, '..', 'results', 'memory-growth-data.json');
      const memoryData = JSON.parse(await fs.readFile(memoryDataPath, 'utf-8'));
      
      // Load baseline metrics
      const metricsPath = path.join(__dirname, '..', 'results', 'baseline-metrics.json');
      const metrics = JSON.parse(await fs.readFile(metricsPath, 'utf-8'));
      
      // Extract key metrics
      this.memoryAnalysis.baselineMemory = this.parseMemoryValue(metrics.memory.summary.baselineMemory);
      this.memoryAnalysis.currentMemory = this.parseMemoryValue(metrics.memory.summary.currentMemory);
      this.memoryAnalysis.totalGrowth = this.parseMemoryValue(metrics.memory.summary.totalGrowth);
      this.memoryAnalysis.growthRate = this.parseMemoryValue(metrics.memory.summary.growthRate.replace('/s', ''));
      this.memoryAnalysis.testDuration = metrics.memory.summary.testDuration;
      
      // Analyze component-specific growth
      this.memoryAnalysis.componentGrowth = memoryData.componentAnalysis || metrics.memory.componentGrowth;
      
      // Calculate growth patterns
      this.calculateGrowthPatterns(memoryData.snapshots || []);
      
      console.log('✅ Memory analysis complete\n');
      
      return this.memoryAnalysis;
      
    } catch (error) {
      console.error('❌ Error loading memory data:', error.message);
      
      // Use default values if data not available
      console.log('⚠️  Using default memory values\n');
      this.memoryAnalysis = {
        baselineMemory: 7 * 1024 * 1024, // 7 MB
        currentMemory: 7.5 * 1024 * 1024, // 7.5 MB
        totalGrowth: 500 * 1024, // 500 KB
        growthRate: 3.57 * 1024, // 3.57 KB/s
        testDuration: 300, // 5 minutes
        componentGrowth: {}
      };
      
      return this.memoryAnalysis;
    }
  }
  
  /**
   * Calculate memory growth patterns
   */
  calculateGrowthPatterns(snapshots) {
    if (snapshots.length < 2) {
      console.log('⚠️  Insufficient snapshots for pattern analysis\n');
      return;
    }
    
    // Linear regression for growth trend
    const times = snapshots.map(s => s.elapsed / 1000); // Convert to seconds
    const memories = snapshots.map(s => s.total);
    
    const n = times.length;
    const sumX = times.reduce((a, b) => a + b, 0);
    const sumY = memories.reduce((a, b) => a + b, 0);
    const sumXY = times.reduce((total, x, i) => total + x * memories[i], 0);
    const sumX2 = times.reduce((total, x) => total + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    this.memoryAnalysis.growthPattern = {
      slope: slope, // bytes per second
      intercept: intercept,
      r2: this.calculateR2(times, memories, slope, intercept)
    };
    
    console.log(`📈 Growth Pattern: ${this.formatBytes(slope)}/s (R² = ${this.memoryAnalysis.growthPattern.r2.toFixed(3)})\n`);
  }
  
  /**
   * Calculate R-squared for regression
   */
  calculateR2(x, y, slope, intercept) {
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssTotal = y.reduce((total, yi) => total + Math.pow(yi - yMean, 2), 0);
    const ssResidual = x.reduce((total, xi, i) => {
      const predicted = slope * xi + intercept;
      return total + Math.pow(y[i] - predicted, 2);
    }, 0);
    
    return 1 - (ssResidual / ssTotal);
  }
  
  /**
   * Calculate PM2 memory limits
   */
  calculateMemoryLimits() {
    console.log('🧮 Calculating PM2 memory limits...\n');
    
    const growthPerSecond = this.memoryAnalysis.growthRate || 3.57 * 1024;
    const baseMemory = this.memoryAnalysis.baselineMemory || 7 * 1024 * 1024;
    
    // Project memory usage for different time periods
    const projections = {
      '1hour': baseMemory + (growthPerSecond * 3600),
      '2hour': baseMemory + (growthPerSecond * 7200),
      '3hour': baseMemory + (growthPerSecond * 10800),
      '4hour': baseMemory + (growthPerSecond * 14400),
      '6hour': baseMemory + (growthPerSecond * 21600),
      '8hour': baseMemory + (growthPerSecond * 28800)
    };
    
    this.memoryAnalysis.projectedUsage = projections;
    
    // Calculate recommended limits with safety margin
    const fourHourProjection = projections['4hour'];
    const withSafetyMargin = fourHourProjection * (1 + this.config.safetyMargin);
    
    // Add base Node.js memory
    const totalMemoryNeeded = this.config.baseMemoryMB * 1024 * 1024 + withSafetyMargin;
    
    // Round up to nearest 50MB
    const recommendedLimitMB = Math.ceil(totalMemoryNeeded / (50 * 1024 * 1024)) * 50;
    
    // Ensure within bounds
    const finalLimitMB = Math.min(Math.max(recommendedLimitMB, 200), this.config.maxMemoryMB);
    
    this.memoryAnalysis.recommendedLimits = {
      calculated: recommendedLimitMB,
      final: finalLimitMB,
      reasoning: recommendedLimitMB !== finalLimitMB ? 
        `Adjusted from ${recommendedLimitMB}MB to ${finalLimitMB}MB (max: ${this.config.maxMemoryMB}MB)` :
        'Within acceptable bounds'
    };
    
    // Calculate optimal restart interval
    const memoryBudget = (finalLimitMB - this.config.baseMemoryMB) * 1024 * 1024;
    const optimalRestartSeconds = (memoryBudget * 0.8) / growthPerSecond; // Use 80% of budget
    
    this.memoryAnalysis.restartInterval = {
      optimal: Math.round(optimalRestartSeconds),
      hours: (optimalRestartSeconds / 3600).toFixed(1),
      cron: this.generateCronSchedule(optimalRestartSeconds)
    };
    
    console.log('📋 Memory Projections:');
    Object.entries(projections).forEach(([period, memory]) => {
      console.log(`  ${period}: ${this.formatBytes(memory)}`);
    });
    
    console.log(`\n🎯 Recommended PM2 Memory Limit: ${finalLimitMB}MB`);
    console.log(`⏰ Optimal Restart Interval: ${this.memoryAnalysis.restartInterval.hours} hours\n`);
    
    return this.memoryAnalysis.recommendedLimits;
  }
  
  /**
   * Generate cron schedule for restarts
   */
  generateCronSchedule(intervalSeconds) {
    const hours = Math.round(intervalSeconds / 3600);
    
    // Create cron pattern for restart every N hours
    if (hours <= 4) {
      return `0 */${hours} * * *`; // Every N hours
    } else if (hours <= 6) {
      return '0 */6 * * *'; // Every 6 hours
    } else if (hours <= 8) {
      return '0 0,8,16 * * *'; // 3 times daily
    } else {
      return '0 0,12 * * *'; // Twice daily
    }
  }
  
  /**
   * Generate PM2 ecosystem configuration
   */
  async generatePM2Config() {
    console.log('⚙️  Generating PM2 ecosystem configuration...\n');
    
    const config = {
      apps: [{
        name: 'meme-detector',
        script: './src/index.js',
        instances: this.config.instances,
        exec_mode: this.config.execMode,
        
        // Memory management
        max_memory_restart: `${this.memoryAnalysis.recommendedLimits.final}M`,
        
        // Restart policy
        cron_restart: this.memoryAnalysis.restartInterval.cron,
        autorestart: true,
        restart_delay: 4000,
        max_restarts: 10,
        min_uptime: '10s',
        
        // Environment
        env: {
          NODE_ENV: 'production',
          NODE_OPTIONS: '--max-old-space-size=512',
          MEMORY_LIMIT_MB: this.memoryAnalysis.recommendedLimits.final,
          RESTART_INTERVAL_HOURS: this.memoryAnalysis.restartInterval.hours
        },
        
        // Monitoring
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        merge_logs: true,
        
        // Advanced options
        kill_timeout: 5000,
        listen_timeout: 10000,
        shutdown_with_message: true,
        
        // Memory monitoring
        monitor: {
          memory: true,
          cpu: true
        }
      }],
      
      // Deploy configuration (optional)
      deploy: {
        production: {
          user: 'node',
          host: 'localhost',
          ref: 'origin/main',
          repo: 'git@github.com:user/meme-detector.git',
          path: '/var/www/meme-detector',
          'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
        }
      }
    };
    
    // Add development configuration
    const devApp = {
      ...config.apps[0],
      name: 'meme-detector-dev',
      env: {
        ...config.apps[0].env,
        NODE_ENV: 'development',
        DEBUG: 'detector:*'
      },
      max_memory_restart: '256M',
      cron_restart: null, // No cron restart in dev
      watch: ['src', 'scripts'],
      ignore_watch: ['node_modules', 'logs', 'results'],
      watch_delay: 1000
    };
    
    config.apps.push(devApp);
    
    // Save configuration
    const configPath = path.join(__dirname, '..', 'ecosystem.config.js');
    const configContent = `/**
 * PM2 Ecosystem Configuration
 * Generated based on memory analysis from trading load baseline
 * 
 * Memory Limit: ${this.memoryAnalysis.recommendedLimits.final}MB
 * Restart Interval: ${this.memoryAnalysis.restartInterval.hours} hours
 * Growth Rate: ${this.formatBytes(this.memoryAnalysis.growthRate)}/s
 */

module.exports = ${JSON.stringify(config, null, 2)};

// Memory Analysis Summary
/*
Baseline Memory: ${this.formatBytes(this.memoryAnalysis.baselineMemory)}
Growth Rate: ${this.formatBytes(this.memoryAnalysis.growthRate)}/s
4-Hour Projection: ${this.formatBytes(this.memoryAnalysis.projectedUsage['4hour'])}
Safety Margin: ${(this.config.safetyMargin * 100)}%
Final Limit: ${this.memoryAnalysis.recommendedLimits.final}MB

Component Growth Analysis:
${this.formatComponentGrowth()}
*/`;
    
    await fs.writeFile(configPath, configContent);
    console.log(`✅ PM2 configuration saved to: ecosystem.config.js\n`);
    
    return config;
  }
  
  /**
   * Format component growth for comment
   */
  formatComponentGrowth() {
    const components = this.memoryAnalysis.componentGrowth;
    if (!components || Object.keys(components).length === 0) {
      return '- No component data available';
    }
    
    return Object.entries(components)
      .map(([name, data]) => {
        const growth = data.totalGrowth || 0;
        const trend = data.trend || 'unknown';
        return `- ${name}: ${growth} bytes (${trend})`;
      })
      .join('\n');
  }
  
  /**
   * Generate monitoring scripts
   */
  async generateMonitoringScripts() {
    console.log('📊 Generating memory monitoring scripts...\n');
    
    const monitorScript = `#!/usr/bin/env node

/**
 * PM2 Memory Monitor
 * Tracks memory usage and alerts on thresholds
 */

import pm2 from 'pm2';
import fs from 'fs/promises';

const MEMORY_THRESHOLD = ${this.memoryAnalysis.recommendedLimits.final} * 0.9; // 90% of limit
const CHECK_INTERVAL = 30000; // 30 seconds
const LOG_FILE = './logs/memory-monitor.log';

async function monitorMemory() {
  pm2.connect((err) => {
    if (err) {
      console.error('PM2 connection error:', err);
      process.exit(2);
    }
    
    setInterval(() => {
      pm2.describe('meme-detector', async (err, processDescription) => {
        if (err) {
          console.error('Process description error:', err);
          return;
        }
        
        if (processDescription.length === 0) {
          console.log('Process not found');
          return;
        }
        
        const proc = processDescription[0];
        const memoryMB = proc.monit.memory / (1024 * 1024);
        const cpuPercent = proc.monit.cpu;
        
        const logEntry = {
          timestamp: new Date().toISOString(),
          memory: memoryMB.toFixed(2) + 'MB',
          cpu: cpuPercent + '%',
          uptime: proc.pm2_env.pm_uptime,
          restarts: proc.pm2_env.restart_time
        };
        
        // Check threshold
        if (memoryMB > MEMORY_THRESHOLD) {
          logEntry.alert = 'MEMORY_HIGH';
          console.warn(\`⚠️ Memory usage high: \${memoryMB.toFixed(2)}MB / \${${this.memoryAnalysis.recommendedLimits.final}}MB\`);
        }
        
        // Log to file
        await fs.appendFile(LOG_FILE, JSON.stringify(logEntry) + '\\n').catch(console.error);
        
        console.log(\`Memory: \${memoryMB.toFixed(2)}MB | CPU: \${cpuPercent}% | Uptime: \${Math.floor(proc.pm2_env.pm_uptime / 1000)}s\`);
      });
    }, CHECK_INTERVAL);
  });
}

// Start monitoring
monitorMemory().catch(console.error);

console.log('🔍 PM2 Memory Monitor started');
console.log(\`Threshold: \${MEMORY_THRESHOLD}MB\`);
console.log(\`Check interval: \${CHECK_INTERVAL / 1000}s\`);
`;
    
    const monitorPath = path.join(__dirname, 'monitor-pm2-memory.js');
    await fs.writeFile(monitorPath, monitorScript);
    console.log('✅ Memory monitor script saved to: scripts/monitor-pm2-memory.js\n');
  }
  
  /**
   * Generate summary report
   */
  generateReport() {
    console.log('=' .repeat(60));
    console.log('📋 PM2 CONFIGURATION SUMMARY');
    console.log('=' .repeat(60) + '\n');
    
    console.log('Memory Analysis:');
    console.log(`  Baseline: ${this.formatBytes(this.memoryAnalysis.baselineMemory)}`);
    console.log(`  Growth Rate: ${this.formatBytes(this.memoryAnalysis.growthRate)}/s`);
    console.log(`  Test Duration: ${this.memoryAnalysis.testDuration}s`);
    
    console.log('\nProjected Memory Usage:');
    Object.entries(this.memoryAnalysis.projectedUsage).forEach(([period, memory]) => {
      console.log(`  ${period}: ${this.formatBytes(memory)}`);
    });
    
    console.log('\nPM2 Configuration:');
    console.log(`  Memory Limit: ${this.memoryAnalysis.recommendedLimits.final}MB`);
    console.log(`  Safety Margin: ${(this.config.safetyMargin * 100)}%`);
    console.log(`  Restart Interval: ${this.memoryAnalysis.restartInterval.hours} hours`);
    console.log(`  Cron Schedule: ${this.memoryAnalysis.restartInterval.cron}`);
    
    console.log('\nComponent Growth:');
    if (this.memoryAnalysis.componentGrowth) {
      Object.entries(this.memoryAnalysis.componentGrowth).forEach(([name, data]) => {
        if (data.totalGrowth > 0) {
          console.log(`  ${name}: ${data.totalGrowth} bytes (${data.trend || 'stable'})`);
        }
      });
    }
    
    console.log('\n' + '=' .repeat(60));
  }
  
  // Helper methods
  
  parseMemoryValue(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    
    const match = str.match(/([\d.]+)\s*([KMGT]?B)?/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'B';
    
    const multipliers = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };
    
    return value * (multipliers[unit.toUpperCase()] || 1);
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Main execution
async function main() {
  console.log('=' .repeat(60));
  console.log('🚀 PM2 CONFIGURATION CALCULATOR');
  console.log('=' .repeat(60) + '\n');
  
  const calculator = new PM2ConfigCalculator();
  
  try {
    // Analyze memory data
    await calculator.analyzeMemoryData();
    
    // Calculate memory limits
    calculator.calculateMemoryLimits();
    
    // Generate PM2 configuration
    await calculator.generatePM2Config();
    
    // Generate monitoring scripts
    await calculator.generateMonitoringScripts();
    
    // Generate report
    calculator.generateReport();
    
    console.log('✅ PM2 configuration generation complete!');
    console.log('=' .repeat(60));
    
    return calculator.memoryAnalysis;
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { PM2ConfigCalculator };