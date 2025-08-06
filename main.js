/**
 * RENAISSANCE MAIN - Simple System Startup
 * Target: <5 seconds startup, zero complexity
 */

import RPCConnectionManager from './core/rpc-connection-manager/index.js';
import { CircuitBreaker } from './detection/core/circuit-breaker.js';
import { DetectorOrchestrator } from './detection/detectors/detector-orchestrator.js';
import { PipelineCoordinator } from './detection/processing/pipeline-coordinator.js';
import { TransactionFetcher } from './detection/transport/transaction-fetcher.js';

async function startThorpSystem() {
  try {
    console.log('🚀 Starting Renaissance Trading System...');
    
    // Simple, working components
    const rpcManager = new RPCConnectionManager({
      heliusApiKey: process.env.HELIUS_API_KEY,
      chainstackApiKey: process.env.CHAINSTACK_API_KEY
    });
    
    const circuitBreaker = new CircuitBreaker();
    const fetcher = new TransactionFetcher(rpcManager);
    const orchestrator = new DetectorOrchestrator(detectors, signalBus, circuitBreaker);
    const coordinator = new PipelineCoordinator({ fetcher, orchestrator });
    
    // Start the system
    coordinator.start();
    
    console.log('✅ Renaissance system operational');
    
  } catch (error) {
    console.error('❌ System startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔌 Shutting down...');
  process.exit(0);
});

startThorpSystem();