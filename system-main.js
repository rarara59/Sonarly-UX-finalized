/**
 * Renaissance Meme Coin Detection System - Main Orchestrator
 * Initializes and coordinates all 8 core modules
 * Target: <5 second startup, graceful shutdown, health monitoring
 */

import { RpcConnectionPool } from './src/detection/transport/rpc-connection-pool.js';
import { CircuitBreaker } from './src/detection/core/circuit-breaker.js';
import { TransactionFetcher } from './src/detection/transport/transaction-fetcher.js';
import { SignalBus } from './src/detection/core/signal-bus.js';
import { TokenValidator } from './src/detection/validation/token-validator.js';
import { PoolValidator } from './src/detection/validation/pool-validator.js';
import { RaydiumDetector } from './src/detection/detectors/raydium-detector.js';
// Import DetectorOrchestrator when available
// import { DetectorOrchestrator } from './src/detection/orchestration/detector-orchestrator.js';

export class MemeDetectionSystem {
  constructor() {
    this.components = {};
    this.isRunning = false;
    this.shutdownCallbacks = [];
    
    // System metrics
    this.startTime = null;
    this.stats = {
      uptime: 0,
      totalTransactions: 0,
      detections: 0,
      errors: 0
    };
    
    console.log('🚀 Renaissance Meme Detection System initializing...');
  }
  
  // Initialize all components in dependency order
  async initialize() {
    try {
      console.log('1️⃣ Initializing core infrastructure...');
      
      // Layer 1: Core Infrastructure
      this.components.rpcPool = new RpcConnectionPool();
      await this.waitForHealthy(this.components.rpcPool, 'RPC Connection Pool');
      
      this.components.circuitBreaker = new CircuitBreaker();
      this.components.signalBus = new SignalBus();
      
      console.log('2️⃣ Initializing validation layer...');
      
      // Layer 2: Validation Services
      this.components.tokenValidator = new TokenValidator(
        this.components.rpcPool, 
        this.components.circuitBreaker
      );
      
      this.components.poolValidator = new PoolValidator(
        this.components.rpcPool
      );
      
      await this.waitForHealthy(this.components.tokenValidator, 'Token Validator');
      await this.waitForHealthy(this.components.poolValidator, 'Pool Validator');
      
      console.log('3️⃣ Initializing detection layer...');
      
      // Layer 3: Detection Services
      this.components.raydiumDetector = new RaydiumDetector(
        this.components.signalBus,
        this.components.tokenValidator,
        this.components.poolValidator,
        this.components.circuitBreaker
      );
      
      console.log('4️⃣ Initializing transaction processing...');
      
      // Layer 4: Transaction Processing
      this.components.transactionFetcher = new TransactionFetcher(
        this.components.rpcPool,
        this.components.circuitBreaker
      );
      
      // TODO: Initialize DetectorOrchestrator when available
      // this.components.detectorOrchestrator = new DetectorOrchestrator(...);
      
      console.log('5️⃣ Setting up signal routing...');
      this.setupSignalRouting();
      
      console.log('✅ All components initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ System initialization failed:', error.message);
      await this.cleanup();
      throw error;
    }
  }
  
  // Wait for component to become healthy
  async waitForHealthy(component, name, maxWait = 10000) {
    const start = Date.now();
    
    while (Date.now() - start < maxWait) {
      if (component.isHealthy && component.isHealthy()) {
        console.log(`   ✅ ${name} healthy`);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`${name} failed to become healthy within ${maxWait}ms`);
  }
  
  // Setup signal routing between components
  setupSignalRouting() {
    // Route Raydium detections
    this.components.signalBus.on('raydiumLpDetected', (data) => {
      console.log('🎯 New LP detected:', data.candidate?.tokenAddress);
      this.stats.detections++;
      
      // TODO: Route to additional processors when available
      // Forward to Scam Protection Engine, etc.
    });
    
    // Route system health events
    this.components.signalBus.on('systemHealth', (data) => {
      if (!data.healthy) {
        console.warn('⚠️ System health degraded:', data.component);
      }
    });
    
    // Route errors
    this.components.signalBus.on('error', (data) => {
      console.error('🚨 System error:', data.message);
      this.stats.errors++;
    });
  }
  
  // Start the detection system
  async start() {
    if (this.isRunning) {
      console.log('⚠️ System already running');
      return;
    }
    
    try {
      console.log('🚀 Starting meme coin detection system...');
      
      this.startTime = Date.now();
      this.isRunning = true;
      
      // Start transaction polling
      this.startTransactionPolling();
      
      // Start system monitoring
      this.startSystemMonitoring();
      
      console.log('🎉 System started successfully!');
      console.log('📊 Monitoring for meme coin opportunities...');
      
      return true;
      
    } catch (error) {
      console.error('❌ System start failed:', error.message);
      this.isRunning = false;
      throw error;
    }
  }
  
  // Start transaction polling loop
  startTransactionPolling() {
    const poll = async () => {
      if (!this.isRunning) return;
      
      try {
        const transactions = await this.components.transactionFetcher.pollAllDexs();
        this.stats.totalTransactions += transactions.length;
        
        if (transactions.length > 0) {
          console.log(`📊 Processing ${transactions.length} transactions...`);
          
          // Process transactions through Raydium detector
          for (const tx of transactions) {
            await this.components.raydiumDetector.analyzeTransaction(tx);
          }
        }
        
      } catch (error) {
        console.error('⚠️ Transaction polling error:', error.message);
        this.stats.errors++;
      }
      
      // Schedule next poll
      setTimeout(poll, 5000); // 5 second intervals
    };
    
    // Start polling
    poll();
  }
  
  // Start system monitoring
  startSystemMonitoring() {
    const monitor = () => {
      if (!this.isRunning) return;
      
      this.stats.uptime = Date.now() - this.startTime;
      
      // Health check all components
      const health = this.getSystemHealth();
      
      if (!health.overall) {
        console.warn('🚨 System health degraded:', health.issues);
      }
      
      // Log stats every 60 seconds
      if (this.stats.uptime % 60000 < 5000) {
        console.log('📈 System Stats:', {
          uptime: Math.round(this.stats.uptime / 1000) + 's',
          transactions: this.stats.totalTransactions,
          detections: this.stats.detections,
          errors: this.stats.errors
        });
      }
      
      setTimeout(monitor, 5000);
    };
    
    monitor();
  }
  
  // Get comprehensive system health
  getSystemHealth() {
    const health = {
      overall: true,
      components: {},
      issues: []
    };
    
    for (const [name, component] of Object.entries(this.components)) {
      if (component.isHealthy) {
        const componentHealth = component.isHealthy();
        health.components[name] = componentHealth;
        
        if (!componentHealth) {
          health.overall = false;
          health.issues.push(name);
        }
      } else {
        health.components[name] = 'unknown';
      }
    }
    
    return health;
  }
  
  // Get system statistics
  getStats() {
    return {
      ...this.stats,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      isRunning: this.isRunning,
      health: this.getSystemHealth()
    };
  }
  
  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down system...');
    
    this.isRunning = false;
    
    // Run shutdown callbacks
    for (const callback of this.shutdownCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('⚠️ Shutdown callback error:', error.message);
      }
    }
    
    await this.cleanup();
    
    console.log('✅ System shutdown complete');
  }
  
  // Cleanup resources
  async cleanup() {
    if (this.components.rpcPool && this.components.rpcPool.destroy) {
      this.components.rpcPool.destroy();
    }
    
    if (this.components.signalBus && this.components.signalBus.removeAllListeners) {
      this.components.signalBus.removeAllListeners();
    }
    
    // Clear components
    this.components = {};
  }
  
  // Register shutdown callback
  onShutdown(callback) {
    this.shutdownCallbacks.push(callback);
  }
}

// Main execution function
export async function main() {
  const system = new MemeDetectionSystem();
  
  try {
    // Initialize system
    await system.initialize();
    
    // Start detection
    await system.start();
    
    // Handle process signals
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down...');
      await system.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      await system.shutdown();
      process.exit(0);
    });
    
    // Keep process alive
    return system;
    
  } catch (error) {
    console.error('💥 System failed to start:', error.message);
    process.exit(1);
  }
}

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
