#!/usr/bin/env node

/**
 * Component Memory Tracker
 * Tracks memory usage for individual system components
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MemoryMonitor } from './memory-monitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ComponentMemoryTracker {
  constructor(config = {}) {
    this.config = {
      sampleInterval: config.sampleInterval || 30000,  // 30 seconds
      componentsToTrack: config.componentsToTrack || [
        'tokenBucket',
        'circuitBreaker',
        'connectionPool',
        'endpointSelector',
        'requestCache',
        'batchManager',
        'hedgedManager'
      ],
      outputPath: config.outputPath || path.join(__dirname, '..', 'results', 'component-memory.json'),
      ...config
    };
    
    this.components = new Map();
    this.samples = [];
    this.startTime = null;
    this.isTracking = false;
    this.samplingInterval = null;
    
    // System memory monitor
    this.systemMonitor = new MemoryMonitor({
      sampleInterval: this.config.sampleInterval,
      outputPath: path.join(__dirname, '..', 'results', 'system-memory.json')
    });
    
    this.metrics = {
      perComponent: {},
      totalComponentMemory: 0,
      systemOverhead: 0,
      componentGrowthRates: {},
      memoryDistribution: {}
    };
    
    // Initialize component metrics
    for (const component of this.config.componentsToTrack) {
      this.metrics.perComponent[component] = {
        current: 0,
        initial: 0,
        peak: 0,
        average: 0,
        growthRate: 0,
        samples: []
      };
    }
  }
  
  /**
   * Register a component for tracking
   */
  registerComponent(name, instance) {
    if (!this.config.componentsToTrack.includes(name)) {
      console.warn(`⚠️ Component ${name} not in tracking list`);
      return;
    }
    
    this.components.set(name, {
      instance,
      initialSize: this.estimateObjectSize(instance),
      currentSize: 0,
      samples: []
    });
    
    console.log(`✅ Registered component: ${name}`);
  }
  
  /**
   * Start tracking
   */
  async start() {
    if (this.isTracking) {
      console.log('⚠️ Component tracker already running');
      return;
    }
    
    console.log('🔍 Starting Component Memory Tracker');
    console.log(`  Components: ${this.config.componentsToTrack.join(', ')}`);
    console.log(`  Sample Interval: ${this.config.sampleInterval / 1000}s`);
    
    this.isTracking = true;
    this.startTime = Date.now();
    
    // Start system monitor
    await this.systemMonitor.start();
    
    // Take initial sample
    this.collectComponentSample();
    
    // Start sampling interval
    this.samplingInterval = setInterval(() => {
      this.collectComponentSample();
    }, this.config.sampleInterval);
    
    console.log('✅ Component tracking started\n');
  }
  
  /**
   * Stop tracking
   */
  async stop() {
    if (!this.isTracking) {
      return;
    }
    
    console.log('\n🛑 Stopping Component Memory Tracker');
    
    this.isTracking = false;
    
    // Clear interval
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }
    
    // Stop system monitor
    await this.systemMonitor.stop();
    
    // Take final sample
    this.collectComponentSample();
    
    // Calculate final metrics
    this.calculateMetrics();
    
    // Save data
    await this.saveData();
    
    // Generate report
    this.generateReport();
  }
  
  /**
   * Collect memory sample for all components
   */
  collectComponentSample() {
    const sample = {
      timestamp: Date.now(),
      elapsed: this.startTime ? Date.now() - this.startTime : 0,
      components: {},
      totalComponentMemory: 0,
      systemMemory: process.memoryUsage().heapUsed
    };
    
    // Sample each component
    for (const [name, component] of this.components) {
      const size = this.estimateObjectSize(component.instance);
      
      sample.components[name] = size;
      sample.totalComponentMemory += size;
      
      // Update component metrics
      const metrics = this.metrics.perComponent[name];
      if (metrics) {
        metrics.current = size;
        metrics.peak = Math.max(metrics.peak, size);
        metrics.samples.push(size);
        
        // Keep only last 100 samples per component
        if (metrics.samples.length > 100) {
          metrics.samples.shift();
        }
        
        // Set initial if first sample
        if (metrics.initial === 0) {
          metrics.initial = size;
        }
      }
      
      // Update component data
      component.currentSize = size;
      component.samples.push({
        timestamp: sample.timestamp,
        size
      });
    }
    
    // Calculate system overhead
    sample.systemOverhead = sample.systemMemory - sample.totalComponentMemory;
    this.metrics.systemOverhead = sample.systemOverhead;
    
    // Store sample
    this.samples.push(sample);
    
    // Calculate growth rates
    this.calculateGrowthRates();
    
    // Log status
    this.logStatus(sample);
  }
  
  /**
   * Estimate object size in bytes
   */
  estimateObjectSize(obj) {
    const seen = new WeakSet();
    
    function sizeOf(obj) {
      if (obj === null || obj === undefined) return 0;
      
      const type = typeof obj;
      
      // Primitives
      switch (type) {
        case 'boolean': return 4;
        case 'number': return 8;
        case 'string': return obj.length * 2; // UTF-16
        case 'symbol': return 0;
        case 'bigint': return 8;
        case 'function': return 0; // Skip functions
      }
      
      // Check for circular references
      if (seen.has(obj)) return 0;
      seen.add(obj);
      
      let size = 0;
      
      // Arrays
      if (Array.isArray(obj)) {
        size += 24; // Array overhead
        for (const item of obj) {
          size += sizeOf(item) + 8; // Pointer overhead
        }
        return size;
      }
      
      // Buffers
      if (Buffer.isBuffer(obj)) {
        return obj.length;
      }
      
      // Maps
      if (obj instanceof Map) {
        size += 24; // Map overhead
        for (const [key, value] of obj) {
          size += sizeOf(key) + sizeOf(value) + 16;
        }
        return size;
      }
      
      // Sets
      if (obj instanceof Set) {
        size += 24; // Set overhead
        for (const item of obj) {
          size += sizeOf(item) + 8;
        }
        return size;
      }
      
      // Objects
      if (type === 'object') {
        size += 24; // Object overhead
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            size += key.length * 2 + 8; // Key string + pointer
            size += sizeOf(obj[key]);
          }
        }
      }
      
      return size;
    }
    
    return sizeOf(obj);
  }
  
  /**
   * Calculate growth rates for components
   */
  calculateGrowthRates() {
    if (this.samples.length < 2) return;
    
    // Get samples from last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentSamples = this.samples.filter(s => s.timestamp > fiveMinutesAgo);
    
    if (recentSamples.length < 2) {
      recentSamples.push(...this.samples.slice(-2));
    }
    
    const firstSample = recentSamples[0];
    const lastSample = recentSamples[recentSamples.length - 1];
    const timeDiff = (lastSample.timestamp - firstSample.timestamp) / 1000; // seconds
    
    if (timeDiff > 0) {
      // Calculate growth rate for each component
      for (const component of this.config.componentsToTrack) {
        const firstSize = firstSample.components[component] || 0;
        const lastSize = lastSample.components[component] || 0;
        const growth = (lastSize - firstSize) / timeDiff; // bytes per second
        
        this.metrics.perComponent[component].growthRate = growth;
        this.metrics.componentGrowthRates[component] = growth;
      }
      
      // Calculate total component growth
      const totalGrowth = (lastSample.totalComponentMemory - firstSample.totalComponentMemory) / timeDiff;
      this.metrics.totalComponentGrowthRate = totalGrowth;
    }
  }
  
  /**
   * Calculate aggregate metrics
   */
  calculateMetrics() {
    // Calculate averages for each component
    for (const component of this.config.componentsToTrack) {
      const metrics = this.metrics.perComponent[component];
      if (metrics.samples.length > 0) {
        const sum = metrics.samples.reduce((a, b) => a + b, 0);
        metrics.average = sum / metrics.samples.length;
      }
    }
    
    // Calculate memory distribution
    const totalMemory = Object.values(this.metrics.perComponent)
      .reduce((sum, m) => sum + m.current, 0);
    
    for (const component of this.config.componentsToTrack) {
      const metrics = this.metrics.perComponent[component];
      this.metrics.memoryDistribution[component] = 
        totalMemory > 0 ? (metrics.current / totalMemory) * 100 : 0;
    }
    
    this.metrics.totalComponentMemory = totalMemory;
  }
  
  /**
   * Log current status
   */
  logStatus(sample) {
    const totalMB = (sample.totalComponentMemory / (1024 * 1024)).toFixed(2);
    const systemMB = (sample.systemMemory / (1024 * 1024)).toFixed(2);
    const overheadMB = (sample.systemOverhead / (1024 * 1024)).toFixed(2);
    
    // Find largest component
    let largestComponent = '';
    let largestSize = 0;
    
    for (const [name, size] of Object.entries(sample.components)) {
      if (size > largestSize) {
        largestSize = size;
        largestComponent = name;
      }
    }
    
    const largestMB = (largestSize / (1024 * 1024)).toFixed(2);
    
    console.log(
      `🧩 Components: ${totalMB}MB | ` +
      `System: ${systemMB}MB | ` +
      `Overhead: ${overheadMB}MB | ` +
      `Largest: ${largestComponent} (${largestMB}MB)`
    );
  }
  
  /**
   * Save tracking data
   */
  async saveData() {
    const data = {
      metadata: {
        startTime: this.startTime,
        endTime: Date.now(),
        duration: Date.now() - this.startTime,
        sampleInterval: this.config.sampleInterval,
        totalSamples: this.samples.length,
        componentsTracked: this.config.componentsToTrack
      },
      metrics: this.metrics,
      samples: this.samples,
      systemMetrics: this.systemMonitor.getMetrics()
    };
    
    try {
      await fs.writeFile(
        this.config.outputPath,
        JSON.stringify(data, null, 2)
      );
      console.log(`💾 Component memory data saved`);
    } catch (error) {
      console.error('Failed to save component data:', error);
    }
  }
  
  /**
   * Generate tracking report
   */
  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 COMPONENT MEMORY REPORT');
    console.log('=' .repeat(60));
    
    const duration = Date.now() - this.startTime;
    console.log('\n⏱️ Tracking Duration:');
    console.log(`  Total Time: ${(duration / 1000).toFixed(1)}s`);
    console.log(`  Total Samples: ${this.samples.length}`);
    
    console.log('\n📊 Component Memory Usage:');
    for (const component of this.config.componentsToTrack) {
      const metrics = this.metrics.perComponent[component];
      const currentMB = (metrics.current / (1024 * 1024)).toFixed(3);
      const peakMB = (metrics.peak / (1024 * 1024)).toFixed(3);
      const growthKBPerHour = (metrics.growthRate * 3600 / 1024).toFixed(2);
      
      console.log(`\n  ${component}:`);
      console.log(`    Current: ${currentMB}MB`);
      console.log(`    Peak: ${peakMB}MB`);
      console.log(`    Growth: ${growthKBPerHour}KB/hr`);
    }
    
    console.log('\n📈 Memory Distribution:');
    const sortedComponents = Object.entries(this.metrics.memoryDistribution)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [component, percentage] of sortedComponents) {
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`  ${component.padEnd(20)} ${bar} ${percentage.toFixed(1)}%`);
    }
    
    console.log('\n💾 System Overview:');
    const totalComponentMB = (this.metrics.totalComponentMemory / (1024 * 1024)).toFixed(2);
    const overheadMB = (this.metrics.systemOverhead / (1024 * 1024)).toFixed(2);
    const systemMetrics = this.systemMonitor.getMetrics();
    const systemTotalMB = (systemMetrics.current?.process.heapUsed || 0) / (1024 * 1024);
    
    console.log(`  Total Component Memory: ${totalComponentMB}MB`);
    console.log(`  System Overhead: ${overheadMB}MB`);
    console.log(`  System Total: ${systemTotalMB.toFixed(2)}MB`);
    console.log(`  Component Percentage: ${((this.metrics.totalComponentMemory / (systemMetrics.current?.process.heapUsed || 1)) * 100).toFixed(1)}%`);
    
    // Identify potential memory issues
    console.log('\n🏥 Memory Health Analysis:');
    let issues = 0;
    
    for (const component of this.config.componentsToTrack) {
      const metrics = this.metrics.perComponent[component];
      const growthMBPerHour = (metrics.growthRate * 3600) / (1024 * 1024);
      
      if (growthMBPerHour > 1) {
        console.log(`  ⚠️ ${component}: High growth rate (${growthMBPerHour.toFixed(2)}MB/hr)`);
        issues++;
      }
    }
    
    if (issues === 0) {
      console.log('  ✅ All components show healthy memory patterns');
    }
    
    console.log('\n' + '=' .repeat(60));
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isTracking: this.isTracking,
      sampleCount: this.samples.length
    };
  }
}

// Mock components for testing
class MockComponent {
  constructor(name, initialSize = 1000) {
    this.name = name;
    this.data = new Array(initialSize).fill(Math.random());
    this.cache = new Map();
    this.connections = [];
  }
  
  grow() {
    // Simulate memory growth
    this.data.push(...new Array(100).fill(Math.random()));
    this.cache.set(Date.now(), { data: new Array(50).fill(0) });
    
    // Clean up old cache entries sometimes
    if (this.cache.size > 10 && Math.random() > 0.7) {
      const keys = Array.from(this.cache.keys());
      this.cache.delete(keys[0]);
    }
  }
}

// Main execution for testing
async function main() {
  console.log('🧪 Testing Component Memory Tracker\n');
  
  const tracker = new ComponentMemoryTracker({
    sampleInterval: 5000  // Sample every 5 seconds for testing
  });
  
  // Create mock components
  const components = {
    tokenBucket: new MockComponent('tokenBucket', 500),
    circuitBreaker: new MockComponent('circuitBreaker', 300),
    connectionPool: new MockComponent('connectionPool', 2000),
    endpointSelector: new MockComponent('endpointSelector', 400),
    requestCache: new MockComponent('requestCache', 5000),
    batchManager: new MockComponent('batchManager', 1000),
    hedgedManager: new MockComponent('hedgedManager', 800)
  };
  
  // Register components
  for (const [name, component] of Object.entries(components)) {
    tracker.registerComponent(name, component);
  }
  
  // Start tracking
  await tracker.start();
  
  console.log('📈 Simulating component activity for 30 seconds...\n');
  
  // Simulate component activity
  const interval = setInterval(() => {
    // Random components grow
    const componentNames = Object.keys(components);
    const randomCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < randomCount; i++) {
      const randomComponent = componentNames[Math.floor(Math.random() * componentNames.length)];
      components[randomComponent].grow();
    }
  }, 2000);
  
  // Run for 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Stop simulation
  clearInterval(interval);
  
  // Stop tracking
  await tracker.stop();
  
  console.log('\n✅ Component memory tracker test complete');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ComponentMemoryTracker;