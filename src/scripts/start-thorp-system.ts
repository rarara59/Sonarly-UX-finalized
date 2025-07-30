// src/scripts/start-thorp-system.ts
import { connectToDatabase } from '../config/database';
import PerformanceMonitoringService from '../services/performance-monitoring.service';
import AlertSystemService from '../services/alert-system.service';
import ThorpOrchestratorService from '../services/thorp-orchestrator.service';
import BatchTokenProcessorService from '../services/batch-token-processor.service';
import ModularEdgeCalculatorService from '../services/modular-edge-calculator.service';
// Import other services...

async function startThorpSystem() {
  try {
    console.log('🚀 Starting Complete Thorp System...');
    
    // Connect to database
    const db = await connectToDatabase();
    
    // Initialize core services
    const performanceMonitoring = new PerformanceMonitoringService(db);
    const alertSystem = new AlertSystemService(performanceMonitoring);
    const batchProcessor = new BatchTokenProcessorService();
    const edgeCalculator = new ModularEdgeCalculatorService();
    
    // Initialize orchestrator with all services
    const orchestrator = new ThorpOrchestratorService({
      batchProcessor,
      edgeCalculator,
      alertSystem,
      performanceMonitoring,
      // Add other services...
    });
    
    // Start the complete system
    await orchestrator.start();
    
    console.log('✅ Complete Thorp System Started!');
    console.log('🎯 Monitoring for 4x opportunities...');
    
  } catch (error) {
    console.error('❌ Failed to start system:', error);
    process.exit(1);
  }
}

startThorpSystem();