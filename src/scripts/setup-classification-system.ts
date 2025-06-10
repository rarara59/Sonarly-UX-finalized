// src/scripts/setup-classification-system.ts

import mongoose from 'mongoose';
import { ClassificationHistory } from '../models/classificationHistory';
import { ClassificationIntegrationService } from '../services/classification-integration.service';
import { logger } from '../utils/logger';

/**
 * Setup script for the classification system
 * Run this once to initialize the database and test the system
 */
async function setupClassificationSystem() {
  try {
    logger.info('🚀 Setting up Thorp Classification System...');

    // Connect to MongoDB (using your existing connection)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp');
      logger.info('✅ Connected to MongoDB');
    }

    // Create indexes for classification_history collection
    await createDatabaseIndexes();

    // Initialize the classification integration service
    const integrationService = new ClassificationIntegrationService();
    await integrationService.initialize();
    logger.info('✅ Classification integration service initialized');

    // Run a test classification
    await runTestClassification(integrationService);

    // Show system status
    await showSystemStatus(integrationService);

    logger.info('🎉 Classification system setup complete!');
    
  } catch (error) {
    logger.error('❌ Failed to setup classification system:', error);
    throw error;
  }
}

/**
 * Create necessary database indexes
 */
async function createDatabaseIndexes(): Promise<void> {
  logger.info('📊 Creating database indexes...');

  try {
    const indexes = [
      { token_address: 1 },
      { current_status: 1, edge_score: -1 },
      { first_detected_at: 1, current_status: 1 },
      { last_reevaluated_at: 1, current_status: 1 },
      { alert_suppressed: 1, alert_suppressed_until: 1 },
      { current_status: 1, age_minutes: 1 },
      // Compound indexes for efficient queries
      { current_status: 1, edge_score: -1, updated_at: -1 }
    ];

    for (const index of indexes) {
      await ClassificationHistory.collection.createIndex(index);
    }

    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.warn('⚠️ Some indexes may already exist:', error.message);
  }
}

/**
 * Run a test classification to verify the system works
 */
async function runTestClassification(integrationService: ClassificationIntegrationService): Promise<void> {
  logger.info('🧪 Running test classification...');

  const testToken = {
    token_address: 'TEST_' + Date.now(),
    edge_score: 87,
    classification: 'fresh' as const,
    reason: 'Test token - high confidence fresh gem',
    metrics: {
      age_minutes: 15,
      tx_count: 45,
      holder_count: 23,
      metadata_verified: true,
      volume_24h: 50000,
      liquidity_usd: 25000,
      smart_wallet_entries: 3
    },
    signals: {
      smart_wallet_activity: true,
      volume_spike: false,
      pattern_signal_spike: true
    }
  };

  const result = await integrationService.processToken(testToken);
  
  logger.info('✅ Test classification completed:', {
    shouldAlert: result.shouldAlert,
    classification: result.classification,
    reason: result.reason
  });

  // Test getting token status
  const status = await integrationService.getTokenStatus(testToken.token_address);
  logger.info('✅ Token status retrieved:', status);
}

/**
 * Show current system status
 */
async function showSystemStatus(integrationService: ClassificationIntegrationService): Promise<void> {
  logger.info('📊 System Status:');

  const stats = await integrationService.getSystemStats();
  
  console.log('┌─────────────────────────────────────┐');
  console.log('│        CLASSIFICATION SYSTEM       │');
  console.log('├─────────────────────────────────────┤');
  console.log(`│ Total Tokens: ${stats.totalTokens.toString().padEnd(18)} │`);
  console.log('├─────────────────────────────────────┤');
  console.log('│ Tokens by Status:                   │');
  Object.entries(stats.tokensByStatus).forEach(([status, count]) => {
    console.log(`│ ${status.padEnd(12)}: ${count.toString().padEnd(14)} │`);
  });
  console.log('├─────────────────────────────────────┤');
  console.log('│ Scheduler Status:                   │');
  console.log(`│ Running: ${stats.schedulerStatus.isRunning ? 'Yes' : 'No'} ${' '.repeat(21)} │`);
  console.log(`│ Queue Length: ${stats.schedulerStatus.queueLength.toString().padEnd(16)} │`);
  console.log(`│ Jobs: ${stats.schedulerStatus.scheduledJobs.length.toString().padEnd(24)} │`);
  console.log('└─────────────────────────────────────┘');
}

/**
 * Integration example for your existing BatchTokenProcessor
 */
function showIntegrationExample(): void {
  logger.info(`
🔗 INTEGRATION EXAMPLE:

// In your existing BatchTokenProcessor.service.ts:

import { ClassificationIntegrationService } from './classification-integration.service';

class BatchTokenProcessor {
  private classificationService = new ClassificationIntegrationService();

  async processToken(tokenData: any) {
    // Your existing edge calculation logic...
    const edgeScore = await this.calculateEdgeScore(tokenData);
    
    // Create classification result
    const classificationResult = {
      token_address: tokenData.address,
      edge_score: edgeScore,
      classification: 'fresh', // Will be determined by classification service
      reason: 'Initial processing',
      metrics: {
        age_minutes: tokenData.ageMinutes,
        tx_count: tokenData.transactions.length,
        holder_count: tokenData.uniqueHolders,
        metadata_verified: tokenData.metadataVerified,
        volume_24h: tokenData.volume24h,
        liquidity_usd: tokenData.liquidityUsd,
        smart_wallet_entries: tokenData.smartWalletCount
      },
      signals: {
        smart_wallet_activity: tokenData.smartWalletActivity,
        volume_spike: tokenData.volumeSpike,
        pattern_signal_spike: tokenData.patternSignals.length > 0
      }
    };

    // Process through classification system
    const result = await this.classificationService.processToken(classificationResult);
    
    // Send alert if needed
    if (result.shouldAlert) {
      await this.alertService.sendAlert({
        type: edgeScore >= 92 ? 'ultra-premium' : 'high-confidence',
        token: tokenData,
        edgeScore,
        classification: result.classification
      });
    }
  }
}

🔧 NEXT STEPS:

1. Add the classification models to your existing services:
   - Copy classificationHistory.ts to src/models/
   
2. Install dependencies if needed:
   npm install node-cron

3. Add to your ThorpOrchestrator startup:
   await this.classificationService.initialize();

4. Add external event handling for webhooks:
   await this.classificationService.handleExternalEvent({
     type: 'honeypot_detected',
     token_address: address,
     data: { confidence: 0.95 }
   });
  `);
}

// Run setup if called directly
if (require.main === module) {
  setupClassificationSystem()
    .then(() => {
      showIntegrationExample();
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupClassificationSystem };