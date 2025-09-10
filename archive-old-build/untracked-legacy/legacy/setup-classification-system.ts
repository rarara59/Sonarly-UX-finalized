import mongoose from 'mongoose';
import { ClassificationHistory } from './classificationHistory';
import { ClassificationAuditTrail } from './classificationAuditTrail';
import { ClassificationHistoryService } from '../services/classification-history.service';
import { ClassificationIntegrationService, TokenProcessingResult } from '../services/classification-integration.service';
import { ReclassificationSchedulerService } from '../services/reclassification-scheduler.service';
import logger from '../utils/logger';

// FIXED: Import the actual connection function instead of just the config file
import { connectToDatabase } from './database';

interface TestTokenData {
  address: string;
  metrics: {
    age_minutes: number;
    tx_count: number;
    holder_count: number;
    metadata_verified: boolean;
    smart_wallet_entries: number;
    volume_24h: number;
    liquidity_usd: number;
    edge_score: number;
  };
}

async function setupClassificationSystem(): Promise<void> {
  try {
    logger.info('🚀 Starting Classification System Setup...');

    // FIXED: Actually connect to the database
    logger.info('⏳ Connecting to database...');
    const mongooseConnection = await connectToDatabase();
    logger.info('✅ Database connected');

    // Create indexes
    logger.info('📋 Creating database indexes...');
    await createIndexes();

    // Initialize services
    logger.info('🔧 Initializing services...');
    const classificationService = new ClassificationHistoryService();
    
    // FIXED: Pass database connection to enable performance monitoring and alerts
    const db = mongooseConnection.connection.db;
    const integrationService = new ClassificationIntegrationService(db);
    const schedulerService = new ReclassificationSchedulerService();

    // Only initialize the integration service (others don't need initialization)
    await integrationService.initialize();

    // Test with sample data
    logger.info('🧪 Testing with sample data...');
    await testWithSampleData(integrationService);

    // Show system status
    logger.info('📊 System Status:');
    await showSystemStatus(integrationService);

    logger.info('✅ Classification System Setup Complete!');
    logger.info('');
    logger.info('🎯 Next Steps:');
    logger.info('   1. Run: npm run classification:validate');
    logger.info('   2. Monitor with: npm run health:classification');
    logger.info('   3. View stats with: npm run classification:stats');

  } catch (error) {
    logger.error('❌ Setup failed:', error);
    throw error;
  }
}

async function createIndexes(): Promise<void> {
  try {
    // Create indexes for ClassificationHistory
    const classificationIndexes = [
      { token_address: 1 },
      { current_status: 1, edge_score: -1 },
      { current_status: 1, first_detected_at: -1 },
      { edge_score: -1, last_reevaluated_at: -1 },
      { alert_suppressed: 1, current_status: 1 },
      { source: 1, created_at: -1 }
    ];

    for (const index of classificationIndexes) {
      await (ClassificationHistory as any).collection.createIndex(index as any);
    }

    // Create indexes for ClassificationAuditTrail
    await (ClassificationAuditTrail as any).createIndexes();

    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.warn('⚠️ Some indexes may already exist:', (error as Error).message);
  }
}

async function testWithSampleData(integrationService: ClassificationIntegrationService): Promise<void> {
  // Define test tokens with correct structure
  const testTokens: TestTokenData[] = [
    {
      address: 'DemoToken1FreshGem123456789012345678',
      metrics: {
        age_minutes: 30,
        tx_count: 25,
        holder_count: 15,
        metadata_verified: true,
        smart_wallet_entries: 3,
        volume_24h: 50000,
        liquidity_usd: 25000,
        edge_score: 87
      }
    },
    {
      address: 'DemoToken2Established123456789012345678',
      metrics: {
        age_minutes: 120,
        tx_count: 150,
        holder_count: 75,
        metadata_verified: true,
        smart_wallet_entries: 8,
        volume_24h: 200000,
        liquidity_usd: 100000,
        edge_score: 92
      }
    },
    {
      address: 'DemoToken3Rejected123456789012345678',
      metrics: {
        age_minutes: 45,
        tx_count: 5,
        holder_count: 3,
        metadata_verified: false,
        smart_wallet_entries: 0,
        volume_24h: 1000,
        liquidity_usd: 500,
        edge_score: 35
      }
    }
  ];

  // Process test tokens
  for (const testToken of testTokens) {
    try {
      const result = await integrationService.processToken(testToken);
      logger.info(`✅ Processed ${testToken.address}: ${result.classification} (${result.reason})`);

      // Test status retrieval
      const status = await integrationService.getTokenStatus(testToken.address);
      logger.info(`📊 Status check: ${status.classification}, Edge: ${status.edgeScore}`);
    } catch (error) {
      logger.error(`❌ Error processing test token ${testToken.address}:`, error);
    }
  }
}

async function showSystemStatus(integrationService: ClassificationIntegrationService): Promise<void> {
  try {
    const stats = await integrationService.getSystemStats();
    
    logger.info('📈 Classification Statistics:');
    
    // Type-safe handling of statusData
    const tokensByStatus = stats.tokensByStatus || {};
    const statusData: Array<[string, number]> = Object.entries(tokensByStatus)
      .map(([key, value]) => [key, Number(value)]);

    if (statusData.some(([, count]) => Number(count) > 0)) {
      statusData.forEach(([status, count]) => {
        logger.info(`   ${status}: ${count} tokens`);
      });
    } else {
      logger.info('   No tokens classified yet');
    }

    logger.info(`📊 Recent Activity: ${stats.recentActivity} changes`);
    logger.info(`🔇 Suppressed Alerts: ${stats.suppressedAlerts}`);
    logger.info(`🟢 System Status: ${stats.isInitialized ? 'Ready' : 'Not Ready'}`);

  } catch (error) {
    logger.error('❌ Error getting system status:', error);
  }
}

// Example usage demonstrations
async function demonstrateIntegrationExamples(): Promise<void> {
  logger.info('📖 Integration Examples:');
  logger.info('');
  logger.info('1. Process tokens from batch processor:');
  logger.info('   const integrationService = new ClassificationIntegrationService();');
  logger.info('   await integrationService.processBatch(discoveredTokens);');
  logger.info('');
  logger.info('2. Handle smart money detection webhook:');
  logger.info('   await integrationService.handleExternalEvent({');
  logger.info('     type: "smart_money_detected",');
  logger.info('     token_address: address,');
  logger.info('     data: { confidence: 0.95 }');
  logger.info('   });');
  logger.info('');
  logger.info('3. Handle external events (webhooks, API alerts):');
  logger.info('   await integrationService.handleExternalEvent({');
  logger.info('     type: "honeypot_detected",');
  logger.info('     token_address: address,');
  logger.info('     data: { confidence: 0.95 }');
  logger.info('   });');
  logger.info('');
  logger.info('💡 See project documentation for complete integration examples.');
}

// Run setup if called directly
if (require.main === module) {
  setupClassificationSystem()
    .then(() => {
      logger.info('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Setup failed:', error);
      process.exit(1);
    });
}