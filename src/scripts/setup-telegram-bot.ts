import mongoose from 'mongoose';
import { AlertSystemService } from '../services/alert-system.service';
import PerformanceMonitoringService from '../services/performance-monitoring.service';
import { TelegramConfig } from '../types/telegram';
import logger from '../utils/logger';

// Import the actual connection function
import { connectToDatabase } from '../config/database';

interface TelegramEnvironmentCheck {
  botToken: boolean;
  chatId: boolean;
  configured: boolean;
}

async function setupTelegramBot(): Promise<void> {
  try {
    logger.info('🚀 Starting Telegram Bot Setup...');

    // Check environment variables first
    logger.info('🔍 Checking environment configuration...');
    const envCheck = checkEnvironmentVariables();
    
    if (!envCheck.configured) {
      throw new Error('Telegram environment variables not properly configured');
    }

    // Connect to database
    logger.info('⏳ Connecting to database...');
    const mongooseConnection = await connectToDatabase();
    logger.info('✅ Database connected');

    // Initialize services
    logger.info('🔧 Initializing Alert System with Telegram...');
    const db = mongooseConnection.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const performanceMonitoring = new PerformanceMonitoringService(db);
    
    const telegramConfig: TelegramConfig = {
      enabled: true,
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
      retryConfig: {
        maxRetries: parseInt(process.env.TELEGRAM_MAX_RETRIES || '3'),
        baseDelayMs: parseInt(process.env.TELEGRAM_RETRY_DELAY || '1000'),
        exponentialBackoff: process.env.TELEGRAM_EXPONENTIAL_BACKOFF !== 'false'
      }
    };

    const alertSystem = new AlertSystemService(performanceMonitoring, {
      telegram: telegramConfig,
      edgeScoreThreshold: 85,
      consoleOutput: true,
      fileOutput: false // Disable file output for setup
    });

    // Wait a moment for Telegram bot to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test Telegram connection
    logger.info('🧪 Testing Telegram connection...');
    await testTelegramConnection(alertSystem);

    // Send test alert if requested
    const shouldSendTest = process.argv.includes('--test') || process.env.SEND_TEST_ALERT === 'true';
    if (shouldSendTest) {
      logger.info('📨 Sending test alert...');
      await sendTestAlert(alertSystem);
    }

    // Show system status
    logger.info('📊 System Status:');
    await showSystemStatus(alertSystem);

    logger.info('✅ Telegram Bot Setup Complete!');
    logger.info('');
    logger.info('🎯 Next Steps:');
    logger.info('   1. Run: npm run telegram:test');
    logger.info('   2. Add to your discovery loop: AlertSystemService with Telegram config');
    logger.info('   3. Monitor alerts in your Telegram chat');

  } catch (error) {
    logger.error('❌ Setup failed:', error);
    throw error;
  }
}

function checkEnvironmentVariables(): TelegramEnvironmentCheck {
  const botToken = !!process.env.TELEGRAM_BOT_TOKEN;
  const chatId = !!process.env.TELEGRAM_CHAT_ID;
  
  logger.info('🔐 Environment Variables:');
  logger.info(`   TELEGRAM_BOT_TOKEN: ${botToken ? '✅ Set' : '❌ Missing'}`);
  logger.info(`   TELEGRAM_CHAT_ID: ${chatId ? '✅ Set' : '❌ Missing'}`);
  
  if (!botToken) {
    logger.error('❌ TELEGRAM_BOT_TOKEN is required. Get it from @BotFather on Telegram.');
  }
  
  if (!chatId) {
    logger.error('❌ TELEGRAM_CHAT_ID is required. Send a message to your bot and check the webhook.');
  }

  return {
    botToken,
    chatId,
    configured: botToken && chatId
  };
}

async function testTelegramConnection(alertSystem: AlertSystemService): Promise<void> {
  try {
    const telegramStatus = alertSystem.getTelegramStatus();
    
    logger.info('📱 Telegram Status:');
    logger.info(`   Enabled: ${telegramStatus.enabled ? '✅' : '❌'}`);
    logger.info(`   Configured: ${telegramStatus.configured ? '✅' : '❌'}`);
    logger.info(`   Ready: ${telegramStatus.ready ? '✅' : '❌'}`);

    if (telegramStatus.ready) {
      const testResult = await alertSystem.testTelegramConnection();
      if (testResult) {
        logger.info('✅ Telegram connection test successful');
      } else {
        logger.error('❌ Telegram connection test failed');
      }
    } else {
      logger.warn('⚠️ Telegram bot not ready - check configuration');
    }
  } catch (error) {
    logger.error('❌ Error testing Telegram connection:', error);
  }
}

async function sendTestAlert(alertSystem: AlertSystemService): Promise<void> {
  // Create a realistic test alert using the TokenAlert structure
  const testTokenData = {
    tokenAddress: 'So11111111111111111111111111111111111111112', // SOL token address
    tokenSymbol: 'TEST',
    edgeScore: 92.5,
    signalScores: {
      smartWallet: 0.85,
      lpAnalysis: 0.72,
      deepHolderAnalysis: 0.45,
      transactionPattern: 0.60,
      socialSignals: 0.30,
      technicalPattern: 0.55,
      marketContext: 0.40,
      riskAssessment: 0.25
    },
    currentPrice: 0.00001234,
    marketCap: 125000,
    lpValueUSD: 50000,
    quoteToken: 'SOL',
    marketContext: {
      solPrice: 185.50,
      marketCondition: 'BULLISH' as const,
      volume24h: 75000
    },
    smartMoneyData: {
      tier1Wallets: 5,
      tier2Wallets: 8,
      tier3Wallets: 12,
      totalSmartWallets: 25,
      avgWalletTier: 2.1,
      recentActivity: true,
      walletAnalysisComplete: true
    }
  };

  try {
    const success = await alertSystem.processTokenAlert(testTokenData);
    
    if (success) {
      logger.info('✅ Test alert sent successfully');
      logger.info('📱 Check your Telegram chat for the test alert');
    } else {
      logger.warn('⚠️ Test alert processing failed - check logs for details');
    }
  } catch (error) {
    logger.error('❌ Error sending test alert:', error);
  }
}

async function showSystemStatus(alertSystem: AlertSystemService): Promise<void> {
  try {
    const telegramStatus = alertSystem.getTelegramStatus();
    const alertStats = alertSystem.getAlertStats();
    
    logger.info('📈 Alert System Statistics:');
    logger.info(`   Total Alerts: ${alertStats.totalAlerts}`);
    logger.info(`   Alerts Today: ${alertStats.alertsToday}`);
    logger.info(`   Success Rate: ${alertStats.successRate}%`);
    
    logger.info('📱 Telegram Integration:');
    logger.info(`   Status: ${telegramStatus.ready ? '🟢 Ready' : '🔴 Not Ready'}`);
    logger.info(`   Configuration: ${telegramStatus.configured ? '✅ Valid' : '❌ Invalid'}`);
    
    if (alertStats.lastAlertTime) {
      logger.info(`⏰ Last Alert: ${alertStats.lastAlertTime.toLocaleString()}`);
    }

  } catch (error) {
    logger.error('❌ Error getting system status:', error);
  }
}

// Example usage demonstrations
async function demonstrateIntegrationExamples(): Promise<void> {
  logger.info('📖 Integration Examples:');
  logger.info('');
  logger.info('1. Initialize AlertSystemService with Telegram:');
  logger.info('   const alertSystem = new AlertSystemService(performanceMonitoring, {');
  logger.info('     telegram: {');
  logger.info('       enabled: true,');
  logger.info('       botToken: process.env.TELEGRAM_BOT_TOKEN,');
  logger.info('       chatId: process.env.TELEGRAM_CHAT_ID');
  logger.info('     }');
  logger.info('   });');
  logger.info('');
  logger.info('2. Process token alerts (automatically sends to Telegram):');
  logger.info('   await alertSystem.processTokenAlert(tokenData);');
  logger.info('');
  logger.info('3. Test Telegram connection:');
  logger.info('   await alertSystem.testTelegramConnection();');
  logger.info('');
  logger.info('💡 Environment Variables Required:');
  logger.info('   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather');
  logger.info('   TELEGRAM_CHAT_ID=your_chat_id');
  logger.info('   TELEGRAM_ENABLED=true');
}

async function showEnvironmentSetup(): Promise<void> {
  logger.info('⚙️ Environment Setup Guide:');
  logger.info('');
  logger.info('1. Create Telegram Bot:');
  logger.info('   • Message @BotFather on Telegram');
  logger.info('   • Send /newbot command');
  logger.info('   • Choose bot name and username');
  logger.info('   • Copy the bot token');
  logger.info('');
  logger.info('2. Get Chat ID:');
  logger.info('   • Send a message to your bot');
  logger.info('   • Visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates');
  logger.info('   • Find your chat ID in the response');
  logger.info('');
  logger.info('3. Add to .env file:');
  logger.info('   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhiJklMnoPqrsTuvWxYz');
  logger.info('   TELEGRAM_CHAT_ID=123456789');
  logger.info('   TELEGRAM_ENABLED=true');
}

// Handle command line arguments
async function handleArguments(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    logger.info('🤖 Telegram Bot Setup Script');
    logger.info('');
    logger.info('Usage: npm run telegram:setup [options]');
    logger.info('');
    logger.info('Options:');
    logger.info('  --test              Send a test alert after setup');
    logger.info('  --env-guide         Show environment setup guide');
    logger.info('  --examples          Show integration examples');
    logger.info('  --help, -h          Show this help message');
    logger.info('');
    process.exit(0);
  }
  
  if (args.includes('--env-guide')) {
    await showEnvironmentSetup();
    process.exit(0);
  }
  
  if (args.includes('--examples')) {
    await demonstrateIntegrationExamples();
    process.exit(0);
  }
}

// Run setup if called directly
if (require.main === module) {
  handleArguments()
    .then(() => setupTelegramBot())
    .then(() => {
      logger.info('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Setup failed:', error);
      process.exit(1);
    });
}