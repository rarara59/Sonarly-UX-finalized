// src/services/modular-signal-integration.service.ts

import winston from 'winston';
import { ModularEdgeCalculator } from './modular-edge-calculator.service';

export class ModularSignalIntegration {
  private modularCalculator: ModularEdgeCalculator;
  private logger: winston.Logger;
  private isInitialized: boolean = false;

  constructor(logger: winston.Logger, originalCalculator?: any) {
    this.logger = logger;
    // Initialize with optional original calculator reference
    this.modularCalculator = new ModularEdgeCalculator(logger, originalCalculator);
    this.isInitialized = true;
    
    this.logger.info(`🎯 Modular signal system initialized with ${this.getSignalStats().totalModules} modules`);
  }

  // Main evaluation method that replaces your original edge calculator call
  async evaluateToken(
    tokenAddress: string,
    currentPrice: number,
    tokenAgeMinutes: number,
    useModular: boolean = true  // Default to modular system
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Modular signal system not initialized');
    }

    this.logger.info(`🔧 Using MODULAR edge calculator for ${tokenAddress} (age: ${tokenAgeMinutes}min)`);
    return await this.modularCalculator.evaluateToken(tokenAddress, currentPrice, tokenAgeMinutes);
  }

  // A/B testing setup methods
  setupSmartWalletABTest(): void {
    // Example: Test different smart wallet weights
    this.modularCalculator.setupABTest('smart-wallet', 
      {
        enabled: true,
        weight: 0.6,        // Original weight
        version: '1.0.0',
        priority: 100,
        abTestGroup: 'A'
      },
      {
        enabled: true,
        weight: 0.8,        // Higher weight test
        version: '2.0.0', 
        priority: 100,
        abTestGroup: 'B'
      }
    );

    this.logger.info('🧪 Smart wallet A/B test configured: 60% vs 80% weight');
  }

  setupLPAnalysisABTest(): void {
    // Example: Test LP analysis with different thresholds
    this.modularCalculator.setupABTest('lp-analysis',
      {
        enabled: true,
        weight: 0.25,       // Original
        version: '1.0.0',
        priority: 90,
        abTestGroup: 'A'
      },
      {
        enabled: true,
        weight: 0.35,       // Higher LP importance
        version: '2.0.0',
        priority: 90,
        abTestGroup: 'B'
      }
    );

    this.logger.info('🧪 LP analysis A/B test configured: 25% vs 35% weight');
  }

  // Module management methods
  enableModule(moduleName: string): void {
    const module = this.modularCalculator.getSignalRegistry().getModule(moduleName);
    if (module) {
      this.logger.info(`✅ Module ${moduleName} is available and enabled`);
    } else {
      this.logger.warn(`❌ Module ${moduleName} not found`);
    }
  }

  disableModule(moduleName: string): void {
    this.modularCalculator.unregisterSignalModule(moduleName);
    this.logger.info(`❌ Disabled signal module: ${moduleName}`);
  }

  // Statistics and monitoring
  getSignalStats(): any {
    if (!this.isInitialized) {
      return { error: 'Modular system not initialized' };
    }
    
    return this.modularCalculator.getSignalStats();
  }

  getModulePerformance(): any {
    // Performance tracking placeholder
    return {
      totalEvaluations: 0,
      avgProcessingTime: 0,
      moduleBreakdown: {}
    };
  }

  // Health check method
  isHealthy(): boolean {
    return this.isInitialized && this.getSignalStats().totalModules > 0;
  }

  // Get list of available modules by track
  getAvailableModules(track?: 'FAST' | 'SLOW'): string[] {
    if (!track) {
      return this.modularCalculator.getSignalRegistry().getAllModules().map(m => m.getName());
    }
    
    return this.modularCalculator.getSignalRegistry()
      .getModulesForTrack(track)
      .map(m => m.getName());
  }
}

// Export singleton for easy use
export const modularSignalIntegration = new ModularSignalIntegration(
  winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
  })
);

// Usage examples for your existing code:
/*
// Replace your existing edge calculator call
const result = await modularSignalIntegration.evaluateToken(tokenAddress, currentPrice, tokenAgeMinutes);

// A/B testing
modularSignalIntegration.setupSmartWalletABTest();

// Get statistics
const stats = modularSignalIntegration.getSignalStats();
console.log(`Active modules: ${stats.enabledModules}/${stats.totalModules}`);

// Health check
if (modularSignalIntegration.isHealthy()) {
  // System is ready
}
*/