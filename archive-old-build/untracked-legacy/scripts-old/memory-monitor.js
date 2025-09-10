#!/usr/bin/env node

/**
 * Memory Monitor
 * Tracks system memory usage and growth patterns
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import v8 from 'v8';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MemoryMonitor {
  constructor(config = {}) {
    this.config = {
      sampleInterval: config.sampleInterval || 30000,  // 30 seconds default
      saveInterval: config.saveInterval || 60000,      // Save every minute
      maxSamples: config.maxSamples || 1000,           // Maximum samples to keep in memory
      outputPath: config.outputPath || path.join(__dirname, '..', 'results', 'memory-samples.json'),
      enableHeapSnapshot: config.enableHeapSnapshot || false,
      heapSnapshotInterval: config.heapSnapshotInterval || 300000, // 5 minutes
      ...config
    };
    
    this.samples = [];
    this.startTime = null;
    this.isMonitoring = false;
    this.samplingInterval = null;
    this.saveInterval = null;
    this.heapSnapshotInterval = null;
    
    this.metrics = {
      initial: null,
      current: null,
      peak: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
        timestamp: null
      },
      average: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      growthRate: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      }
    };
  }
  
  /**
   * Start memory monitoring
   */
  async start() {
    if (this.isMonitoring) {
      console.log('⚠️ Memory monitor already running');
      return;
    }
    
    console.log('🔍 Starting Memory Monitor');
    console.log(`  Sample Interval: ${this.config.sampleInterval / 1000}s`);
    console.log(`  Save Interval: ${this.config.saveInterval / 1000}s`);
    console.log(`  Output Path: ${this.config.outputPath}`);
    
    this.isMonitoring = true;
    this.startTime = Date.now();
    
    // Take initial sample
    this.metrics.initial = this.takeSample();
    this.samples.push(this.metrics.initial);
    
    // Start sampling interval
    this.samplingInterval = setInterval(() => {
      this.collectSample();
    }, this.config.sampleInterval);
    
    // Start save interval
    this.saveInterval = setInterval(async () => {
      await this.saveData();
    }, this.config.saveInterval);
    
    // Start heap snapshot interval if enabled
    if (this.config.enableHeapSnapshot) {
      this.heapSnapshotInterval = setInterval(async () => {
        await this.takeHeapSnapshot();
      }, this.config.heapSnapshotInterval);
    }
    
    console.log('✅ Memory monitoring started\n');
  }
  
  /**
   * Stop memory monitoring
   */
  async stop() {
    if (!this.isMonitoring) {
      return;
    }
    
    console.log('\n🛑 Stopping Memory Monitor');
    
    this.isMonitoring = false;
    
    // Clear intervals
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }
    
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    
    if (this.heapSnapshotInterval) {
      clearInterval(this.heapSnapshotInterval);
      this.heapSnapshotInterval = null;
    }
    
    // Take final sample
    const finalSample = this.takeSample();
    this.samples.push(finalSample);
    
    // Calculate final metrics
    this.calculateMetrics();
    
    // Save final data
    await this.saveData();
    
    // Generate report
    this.generateReport();
  }
  
  /**
   * Take a memory sample
   */
  takeSample() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    return {
      timestamp: Date.now(),
      elapsed: this.startTime ? Date.now() - this.startTime : 0,
      process: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      v8: {
        totalHeapSize: heapStats.total_heap_size,
        totalHeapSizeExecutable: heapStats.total_heap_size_executable,
        totalPhysicalSize: heapStats.total_physical_size,
        totalAvailableSize: heapStats.total_available_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        mallocedMemory: heapStats.malloced_memory,
        peakMallocedMemory: heapStats.peak_malloced_memory,
        doesZapGarbage: heapStats.does_zap_garbage,
        numberOfNativeContexts: heapStats.number_of_native_contexts,
        numberOfDetachedContexts: heapStats.number_of_detached_contexts
      },
      formatted: {
        rss: this.formatBytes(memUsage.rss),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        external: this.formatBytes(memUsage.external),
        percentUsed: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)
      }
    };
  }
  
  /**
   * Collect a sample and update metrics
   */
  collectSample() {
    const sample = this.takeSample();
    this.samples.push(sample);
    
    // Update current
    this.metrics.current = sample;
    
    // Update peak
    if (sample.process.heapUsed > this.metrics.peak.heapUsed) {
      this.metrics.peak.heapUsed = sample.process.heapUsed;
      this.metrics.peak.timestamp = sample.timestamp;
    }
    
    if (sample.process.heapTotal > this.metrics.peak.heapTotal) {
      this.metrics.peak.heapTotal = sample.process.heapTotal;
    }
    
    if (sample.process.external > this.metrics.peak.external) {
      this.metrics.peak.external = sample.process.external;
    }
    
    if (sample.process.arrayBuffers > this.metrics.peak.arrayBuffers) {
      this.metrics.peak.arrayBuffers = sample.process.arrayBuffers;
    }
    
    // Limit samples in memory
    if (this.samples.length > this.config.maxSamples) {
      this.samples.shift();
    }
    
    // Calculate growth rate (if we have enough samples)
    if (this.samples.length >= 2) {
      this.calculateGrowthRate();
    }
    
    // Log current status
    this.logStatus(sample);
  }
  
  /**
   * Calculate memory growth rate
   */
  calculateGrowthRate() {
    if (this.samples.length < 2) return;
    
    // Get samples from last 5 minutes (or all if less)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentSamples = this.samples.filter(s => s.timestamp > fiveMinutesAgo);
    
    if (recentSamples.length < 2) {
      recentSamples.push(...this.samples.slice(-2));
    }
    
    const firstSample = recentSamples[0];
    const lastSample = recentSamples[recentSamples.length - 1];
    const timeDiff = (lastSample.timestamp - firstSample.timestamp) / 1000; // seconds
    
    if (timeDiff > 0) {
      // Calculate growth rates (bytes per second)
      this.metrics.growthRate.heapUsed = 
        (lastSample.process.heapUsed - firstSample.process.heapUsed) / timeDiff;
      
      this.metrics.growthRate.heapTotal = 
        (lastSample.process.heapTotal - firstSample.process.heapTotal) / timeDiff;
      
      this.metrics.growthRate.external = 
        (lastSample.process.external - firstSample.process.external) / timeDiff;
      
      this.metrics.growthRate.rss = 
        (lastSample.process.rss - firstSample.process.rss) / timeDiff;
    }
  }
  
  /**
   * Calculate aggregate metrics
   */
  calculateMetrics() {
    if (this.samples.length === 0) return;
    
    // Calculate averages
    let totalHeapUsed = 0;
    let totalHeapTotal = 0;
    let totalExternal = 0;
    let totalRss = 0;
    
    for (const sample of this.samples) {
      totalHeapUsed += sample.process.heapUsed;
      totalHeapTotal += sample.process.heapTotal;
      totalExternal += sample.process.external;
      totalRss += sample.process.rss;
    }
    
    const count = this.samples.length;
    this.metrics.average.heapUsed = totalHeapUsed / count;
    this.metrics.average.heapTotal = totalHeapTotal / count;
    this.metrics.average.external = totalExternal / count;
    this.metrics.average.rss = totalRss / count;
  }
  
  /**
   * Log current memory status
   */
  logStatus(sample) {
    const growthRate = this.metrics.growthRate.heapUsed;
    const growthStr = growthRate > 0 
      ? `+${this.formatBytes(growthRate)}/s` 
      : `${this.formatBytes(growthRate)}/s`;
    
    console.log(
      `📊 Memory: ${sample.formatted.heapUsed}/${sample.formatted.heapTotal} ` +
      `(${sample.formatted.percentUsed}% used) | ` +
      `Growth: ${growthStr} | ` +
      `Peak: ${this.formatBytes(this.metrics.peak.heapUsed)}`
    );
  }
  
  /**
   * Save memory data to file
   */
  async saveData() {
    const data = {
      metadata: {
        startTime: this.startTime,
        lastUpdate: Date.now(),
        sampleInterval: this.config.sampleInterval,
        totalSamples: this.samples.length
      },
      metrics: this.metrics,
      samples: this.samples
    };
    
    try {
      await fs.writeFile(
        this.config.outputPath,
        JSON.stringify(data, null, 2)
      );
      console.log(`💾 Memory data saved (${this.samples.length} samples)`);
    } catch (error) {
      console.error('Failed to save memory data:', error);
    }
  }
  
  /**
   * Take a heap snapshot (V8 specific)
   */
  async takeHeapSnapshot() {
    if (!this.config.enableHeapSnapshot) return;
    
    const timestamp = Date.now();
    const filename = `heap-snapshot-${timestamp}.heapsnapshot`;
    const filepath = path.join(__dirname, '..', 'results', filename);
    
    try {
      const snapshot = v8.writeHeapSnapshot();
      await fs.writeFile(filepath, snapshot);
      console.log(`📸 Heap snapshot saved: ${filename}`);
    } catch (error) {
      console.error('Failed to take heap snapshot:', error);
    }
  }
  
  /**
   * Generate memory report
   */
  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 MEMORY MONITORING REPORT');
    console.log('=' .repeat(60));
    
    const duration = Date.now() - this.startTime;
    console.log('\n⏱️ Monitoring Duration:');
    console.log(`  Total Time: ${(duration / 1000).toFixed(1)}s`);
    console.log(`  Total Samples: ${this.samples.length}`);
    
    console.log('\n📊 Memory Usage:');
    console.log(`  Initial: ${this.formatBytes(this.metrics.initial?.process.heapUsed || 0)}`);
    console.log(`  Current: ${this.formatBytes(this.metrics.current?.process.heapUsed || 0)}`);
    console.log(`  Peak: ${this.formatBytes(this.metrics.peak.heapUsed)}`);
    console.log(`  Average: ${this.formatBytes(this.metrics.average.heapUsed)}`);
    
    console.log('\n📈 Growth Analysis:');
    const totalGrowth = (this.metrics.current?.process.heapUsed || 0) - 
                       (this.metrics.initial?.process.heapUsed || 0);
    console.log(`  Total Growth: ${this.formatBytes(totalGrowth)}`);
    console.log(`  Growth Rate: ${this.formatBytes(this.metrics.growthRate.heapUsed)}/s`);
    
    if (this.metrics.growthRate.heapUsed > 0 && duration > 0) {
      const projectedHourly = this.metrics.growthRate.heapUsed * 3600;
      console.log(`  Projected (1hr): ${this.formatBytes(projectedHourly)}`);
      console.log(`  Projected (24hr): ${this.formatBytes(projectedHourly * 24)}`);
    }
    
    console.log('\n💾 System Memory:');
    console.log(`  RSS Peak: ${this.formatBytes(this.metrics.peak.heapTotal)}`);
    console.log(`  External Peak: ${this.formatBytes(this.metrics.peak.external)}`);
    console.log(`  ArrayBuffers Peak: ${this.formatBytes(this.metrics.peak.arrayBuffers)}`);
    
    // Memory health assessment
    console.log('\n🏥 Memory Health:');
    const growthRateMBPerHour = (this.metrics.growthRate.heapUsed * 3600) / (1024 * 1024);
    
    if (growthRateMBPerHour < 1) {
      console.log('  ✅ Excellent - No significant memory leak detected');
    } else if (growthRateMBPerHour < 10) {
      console.log('  ⚠️ Good - Minor memory growth detected');
    } else if (growthRateMBPerHour < 50) {
      console.log('  ⚠️ Warning - Moderate memory growth detected');
    } else {
      console.log('  ❌ Critical - Significant memory leak likely');
    }
    
    console.log('\n' + '=' .repeat(60));
  }
  
  /**
   * Get current memory metrics
   */
  getMetrics() {
    return {
      metadata: {
        startTime: this.startTime,
        lastUpdate: Date.now(),
        sampleInterval: this.config.sampleInterval,
        totalSamples: this.samples.length
      },
      metrics: this.metrics,
      samples: this.samples
    };
  }
  
  /**
   * Get memory samples
   */
  getSamples() {
    return [...this.samples];
  }
  
  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Math.abs(bytes);
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    const formatted = value.toFixed(2);
    const sign = bytes < 0 ? '-' : '';
    return `${sign}${formatted}${units[unitIndex]}`;
  }
  
  /**
   * Start monitoring (simplified version for use by other scripts)
   */
  startMonitoring(interval = null) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = Date.now();
    const sampleInterval = interval || this.config.sampleInterval;
    
    // Take initial sample
    this.metrics.initial = this.takeSample();
    this.samples.push(this.metrics.initial);
    
    // Set up sampling interval
    this.samplingInterval = setInterval(() => {
      this.collectSample();
    }, sampleInterval);
  }
  
  /**
   * Stop monitoring (simplified version for use by other scripts)
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }
    
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    
    if (this.heapSnapshotInterval) {
      clearInterval(this.heapSnapshotInterval);
      this.heapSnapshotInterval = null;
    }
    
    // Take final sample
    const finalSample = this.takeSample();
    this.samples.push(finalSample);
    
    // Calculate final metrics
    this.calculateMetrics();
  }
  
  /**
   * Get current metrics (simplified)
   */
  getCurrentMetrics() {
    return {
      process: process.memoryUsage(),
      v8: v8.getHeapStatistics(),
      timestamp: Date.now(),
      elapsed: this.startTime ? Date.now() - this.startTime : 0
    };
  }
  
  /**
   * Reset monitor
   */
  reset() {
    this.samples = [];
    this.metrics = {
      initial: null,
      current: null,
      peak: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
        timestamp: null
      },
      average: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      growthRate: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      }
    };
    this.startTime = null;
  }
}

// Main execution for testing
async function main() {
  console.log('🧪 Testing Memory Monitor\n');
  
  const monitor = new MemoryMonitor({
    sampleInterval: 5000,  // Sample every 5 seconds for testing
    saveInterval: 15000    // Save every 15 seconds
  });
  
  // Start monitoring
  await monitor.start();
  
  // Simulate memory usage
  console.log('📈 Simulating memory usage for 30 seconds...\n');
  
  const arrays = [];
  const interval = setInterval(() => {
    // Allocate some memory
    const arr = new Array(100000).fill(Math.random());
    arrays.push(arr);
    
    // Sometimes clear old arrays
    if (arrays.length > 5 && Math.random() > 0.7) {
      arrays.shift();
    }
  }, 2000);
  
  // Run for 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Stop simulation
  clearInterval(interval);
  
  // Stop monitoring
  await monitor.stop();
  
  console.log('\n✅ Memory monitor test complete');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default MemoryMonitor;