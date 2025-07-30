// src/services/performance-services-setup.ts
import { MongoClient, Db } from 'mongodb';
import PerformanceMonitoringService from './performance-monitoring.service';
import PerformanceIntegrationService from './performance-integration.service';
import { ModularSignalIntegration } from './modular-signal-integration.service';
import RPCConnectionManager from './rpc-connection-manager';

/**
 * Centralized setup for all performance monitoring services
 */
export class PerformanceServicesSetup {
  private db: Db;
  private performanceMonitoring: PerformanceMonitoringService;
  private performanceIntegration: PerformanceIntegrationService;
  private signalIntegration: ModularSignalIntegration;

  constructor(db: Db) {
    this.db = db;
  }

  async initialize(): Promise<{
    performanceMonitoring: PerformanceMonitoringService;
    performanceIntegration: PerformanceIntegrationService;
  }> {
    try {
      console.log('🔧 Initializing Performance Monitoring Services...');

      // 1. Initialize Performance Monitoring Service
      this.performanceMonitoring = new PerformanceMonitoringService(this.db);
      console.log('✅ Performance Monitoring Service initialized');

      // 2. Initialize Modular Signal Integration (your existing service)
      this.signalIntegration = new ModularSignalIntegration();
      console.log('✅ Modular Signal Integration initialized');

      // 3. Initialize Performance Integration Service
      this.performanceIntegration = new PerformanceIntegrationService(
        this.performanceMonitoring,
        this.signalIntegration,
        {
          targetMultiplier: 4, // 4x target
          stopLossPercentage: -50, // Stop at -50%
          timeoutHours: 48, // Close trades after 48 hours
          priceUpdateIntervalMs: 60000 // Check prices every minute
        }
      );
      console.log('✅ Performance Integration Service initialized');

      // 4. Connect Performance Integration to RPC Connection Manager
      RPCConnectionManager.setPerformanceIntegration(this.performanceIntegration);
      console.log('✅ Performance Integration connected to RPC Connection Manager');

      console.log('🎯 Performance Monitoring fully initialized!');
      
      return {
        performanceMonitoring: this.performanceMonitoring,
        performanceIntegration: this.performanceIntegration
      };

    } catch (error) {
      console.error('❌ Failed to initialize Performance Monitoring Services:', error);
      throw error;
    }
  }

  /**
   * Get performance dashboard data
   */
  async getDashboard(): Promise<any> {
    if (!this.performanceIntegration) {
      throw new Error('Performance services not initialized');
    }
    return await this.performanceIntegration.getPerformanceDashboard();
  }

  /**
   * Get current performance stats
   */
  async getStats(): Promise<any> {
    if (!this.performanceIntegration) {
      throw new Error('Performance services not initialized');
    }
    return await this.performanceIntegration.getPerformanceStats();
  }

  /**
   * Shutdown all services cleanly
   */
  shutdown(): void {
    if (this.performanceIntegration) {
      this.performanceIntegration.stop();
    }
    console.log('🛑 Performance services shutdown complete');
  }
}

// Example usage in your main application
export async function setupPerformanceMonitoring(): Promise<PerformanceServicesSetup> {
  // Connect to MongoDB (adjust connection string as needed)
  const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  await mongoClient.connect();
  const db = mongoClient.db('thorp_meme_detector');

  const performanceSetup = new PerformanceServicesSetup(db);
  await performanceSetup.initialize();

  return performanceSetup;
}