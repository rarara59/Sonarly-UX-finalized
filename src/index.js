/**
 * THORP TRADING SYSTEM - MAIN ENTRY POINT
 * 
 * Renaissance-grade trading system orchestration with complete
 * service lifecycle management and error handling.
 */

// Import system dependencies
import { createSystemConfiguration } from './config/system-config.js';
import { createThorpSystem } from './services/thorp-system.service.js';
import { ultraMemoryOptimizer } from './utils/memory-optimizer.js';

// ULTRA Memory Optimizer initialization
ultraMemoryOptimizer.startUltraOptimization();

/**
 * Main system startup
 */
async function startThorpSystem() {
  let thorpSystem = null;
  
  try {
    console.log('🚀 Starting Thorp Trading System...');
    console.log('📊 Renaissance-grade meme coin detection system');
    console.log('⚡ Real-time Solana trading with mathematical precision');
    console.log('💡 For optimal memory management, start with: node --expose-gc src/index.js');
    console.log('');
    
    // Load system configuration
    console.log('📝 Loading system configuration...');
    const config = createSystemConfiguration();
    
    console.log(`✅ Configuration loaded (env: ${config.system.environment})`);
    console.log(`📈 System: ${config.system.name} v${config.system.version}`);
    console.log(`🔧 Services: RPC, CircuitBreaker, BatchProcessor, WorkerPool, SolanaParser, WebSocketManager`);
    console.log('');
    
    // Create and initialize system orchestrator
    console.log('🏗️  Initializing system orchestrator...');
    // DEBUG: Creating thorpSystem...
    thorpSystem = createThorpSystem(config.system);
    // DEBUG: thorpSystem created successfully
    
    // Initialize all services in dependency order
    // DEBUG: Starting thorpSystem.initialize()...
    await thorpSystem.initialize();
    // DEBUG: thorpSystem.initialize() completed
    
    console.log('');
    console.log('✅ THORP SYSTEM FULLY OPERATIONAL');
    console.log('🎯 Ready for meme coin detection and trading');
    console.log('📡 Monitoring Solana mainnet via Helius Enhanced WebSocket');
    console.log('🧠 Renaissance mathematical algorithms active');
    console.log('');
    
    // Start health monitoring with memory stats
    const healthTimer = setInterval(() => {
      const health = thorpSystem.getSystemHealth();
      const memStats = ultraMemoryOptimizer.getStats();
      
      if (health.system.started) {
        const uptimeMinutes = Math.floor(health.system.uptime / 60000);
        const memoryUsageMB = health.system.memoryPeakMB.toFixed(1);
        
        console.log(`📊 System Health: ${Object.keys(health.services).length} services, ${uptimeMinutes}m uptime, ${memoryUsageMB}MB peak`);
        console.log(`🧠 Memory: ${memStats.current.memoryMB}MB (${memStats.current.status}) | GC: ${memStats.gc.forced} forced`);
        
        // Check for unhealthy services
        const unhealthyServices = Object.entries(health.services)
          .filter(([name, service]) => !service.healthy)
          .map(([name]) => name);
        
        if (unhealthyServices.length > 0) {
          console.warn(`⚠️  Unhealthy services: ${unhealthyServices.join(', ')}`);
        }
        
        // Force optimization if memory is high
        if (memStats.current.memoryMB > 350) {
          console.log(`🚨 High memory detected, forcing optimization...`);
          ultraMemoryOptimizer.forceOptimization();
        }
      }
    }, 60000); // Every minute
    
    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n🔌 Received ${signal}, initiating graceful shutdown...`);
      
      if (healthTimer) {
        clearInterval(healthTimer);
      }
      
      if (thorpSystem) {
        await thorpSystem.shutdown();
      }
      
      console.log('✅ Shutdown complete');
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Handle uncaught errors
    process.on('uncaughtException', async (error) => {
      console.error('🚨 UNCAUGHT EXCEPTION:', error);
      
      if (thorpSystem) {
        try {
          await thorpSystem.shutdown();
        } catch (shutdownError) {
          console.error('❌ Emergency shutdown failed:', shutdownError);
        }
      }
      
      process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason) => {
      console.error('🚨 UNHANDLED REJECTION:', reason);
      
      if (thorpSystem) {
        try {
          await thorpSystem.shutdown();
        } catch (shutdownError) {
          console.error('❌ Emergency shutdown failed:', shutdownError);
        }
      }
      
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ System startup failed:', error);
    
    if (thorpSystem) {
      try {
        await thorpSystem.shutdown();
      } catch (shutdownError) {
        console.error('❌ Emergency shutdown failed:', shutdownError);
      }
    }
    
    process.exit(1);
  }
}

/**
 * Start the system if this file is run directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  startThorpSystem().catch(error => {
    console.error('❌ Fatal error starting Thorp system:', error);
    process.exit(1);
  });
}

export { startThorpSystem };