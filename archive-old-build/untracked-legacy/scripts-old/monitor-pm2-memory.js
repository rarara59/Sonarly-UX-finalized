#!/usr/bin/env node

/**
 * PM2 Memory Monitor
 * Tracks memory usage and alerts on thresholds
 */

import pm2 from 'pm2';
import fs from 'fs/promises';

const MEMORY_THRESHOLD = 250 * 0.9; // 90% of limit
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
          console.warn(`⚠️ Memory usage high: ${memoryMB.toFixed(2)}MB / ${250}MB`);
        }
        
        // Log to file
        await fs.appendFile(LOG_FILE, JSON.stringify(logEntry) + '\n').catch(console.error);
        
        console.log(`Memory: ${memoryMB.toFixed(2)}MB | CPU: ${cpuPercent}% | Uptime: ${Math.floor(proc.pm2_env.pm_uptime / 1000)}s`);
      });
    }, CHECK_INTERVAL);
  });
}

// Start monitoring
monitorMemory().catch(console.error);

console.log('🔍 PM2 Memory Monitor started');
console.log(`Threshold: ${MEMORY_THRESHOLD}MB`);
console.log(`Check interval: ${CHECK_INTERVAL / 1000}s`);
