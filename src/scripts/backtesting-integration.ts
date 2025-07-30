// src/scripts/backtesting-integration.ts

import { DataInputHelper } from '../services/data-input-helper.service';
import { BacktestingService } from '../services/backtesting.service';
import { ModularSignalIntegration } from '../services/modular-signal-integration.service';
import { createLogger, format, transports } from 'winston';

// Main integration class
class BacktestingIntegration {
  private logger;
  public dataHelper: DataInputHelper;
  private backtestingService: BacktestingService;
  private modularSignals: ModularSignalIntegration;
  
  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/backtesting-integration.log' })
      ]
    });
    
    this.dataHelper = new DataInputHelper();
    this.backtestingService = new BacktestingService();
    this.modularSignals = new ModularSignalIntegration(this.logger);
  }
  
  // 🎯 MAIN COMMAND: Complete backtesting workflow
  async runFullBacktestWorkflow(): Promise<void> {
    this.logger.info('🚀 Starting full backtesting workflow...');
    
    try {
      // Step 1: Show current trade data summary
      this.logger.info('📊 Step 1: Analyzing current trade data...');
      const summary = await this.dataHelper.getTradeDataSummary();
      
      if (summary.totalTrades === 0) {
        this.logger.warn('⚠️ No trade data found. Please add some trades first.');
        await this.showDataInputOptions();
        return;
      }
      
      this.logger.info(`✅ Found ${summary.totalTrades} trades (${summary.successRate.toFixed(1)}% success rate)`);
      
      // Step 2: Load historical data into backtesting service
      this.logger.info('📥 Step 2: Loading trade data into backtesting service...');
      await this.backtestingService.loadDataFromHelper(this.dataHelper);
      
      // Step 3: Run backtest
      this.logger.info('🧪 Step 3: Running backtest against modular signal system...');
      const performance = await this.backtestingService.runBacktest({
        includeFailures: true,
        minMarketCap: 0
      });
      
      // Step 4: Analyze results and provide recommendations
      this.logger.info('📈 Step 4: Analyzing results...');
      await this.analyzeBacktestResults(performance);
      
      this.logger.info('🎉 Full backtesting workflow completed successfully!');
      
    } catch (error) {
      this.logger.error('❌ Backtesting workflow failed:', error);
      throw error;
    }
  }
  
  // 📝 DATA INPUT: Help user add trade data
  async showDataInputOptions(): Promise<void> {
    this.logger.info('📝 DATA INPUT OPTIONS:');
    this.logger.info('');
    this.logger.info('1️⃣ QUICK ADD SUCCESSFUL TRADE:');
    this.logger.info('   await integration.addQuickSuccess("TOKEN_ADDRESS", "SYMBOL", 4.2, 14);');
    this.logger.info('');
    this.logger.info('2️⃣ ADD DETAILED TRADE:');
    this.logger.info('   await integration.addDetailedTrade({...});');
    this.logger.info('');
    this.logger.info('3️⃣ GENERATE CSV TEMPLATE:');
    this.logger.info('   await integration.generateCSVTemplate();');
    this.logger.info('');
    this.logger.info('4️⃣ IMPORT FROM CSV:');
    this.logger.info('   await integration.importCSV("path/to/trades.csv");');
    
    // Generate template for immediate use
    const templatePath = await this.dataHelper.generateCSVTemplate();
    this.logger.info(`📋 CSV template created at: ${templatePath}`);
  }
  
  // 🚀 CONVENIENCE: Quick success trade
  async addQuickSuccess(tokenAddress: string, symbol: string, returnMultiple: number, daysHeld: number = 14): Promise<void> {
    await this.dataHelper.addQuickSuccess(tokenAddress, symbol, returnMultiple, daysHeld);
    this.logger.info(`✅ Added quick success: ${symbol} - ${returnMultiple}x return`);
  }
  
  // 💥 CONVENIENCE: Quick failure trade
  async addQuickFailure(tokenAddress: string, symbol: string, lossPercentage: number = 50): Promise<void> {
    await this.dataHelper.addQuickFailure(tokenAddress, symbol, lossPercentage);
    this.logger.info(`💥 Added quick failure: ${symbol} - ${lossPercentage}% loss`);
  }
  
  // 📊 CONVENIENCE: Import CSV
  async importCSV(csvPath: string): Promise<void> {
    await this.dataHelper.importTradesFromCSV(csvPath);
    this.logger.info(`📥 Imported trades from: ${csvPath}`);
  }
  
  // 📋 CONVENIENCE: Generate CSV template
  async generateCSVTemplate(outputPath?: string): Promise<string> {
    const path = await this.dataHelper.generateCSVTemplate(outputPath);
    this.logger.info(`📋 CSV template generated: ${path}`);
    return path;
  }
  
  // 🔍 ANALYSIS: Test single token with current signals
  async testTokenWithCurrentSignals(tokenAddress: string): Promise<void> {
    this.logger.info(`🔍 Testing token ${tokenAddress} with current modular signals...`);
    
    try {
      const currentPrice = 100; // placeholder for test price
      const tokenAgeMinutes = 30; // recent token
      const result = await this.modularSignals.evaluateToken(tokenAddress, currentPrice, tokenAgeMinutes);
      
      this.logger.info('🎯 SIGNAL RESULTS:', {
        finalScore: result.finalScore.toFixed(3),
        confidence: result.confidence.toFixed(1) + '%',
        isQualified: result.isQualified ? '✅ QUALIFIED' : '❌ NOT QUALIFIED',
        primaryPath: result.primaryPath,
        detectionPaths: result.detectionPaths
      });
      
      this.logger.info('📊 INDIVIDUAL SIGNALS:');
      Object.entries(result.signals).forEach(([signal, data]: [string, any]) => {
        this.logger.info(`   ${signal}: ${data.confidence || 0}% confidence`);
      });
      
    } catch (error) {
      this.logger.error(`Failed to test token ${tokenAddress}:`, error);
    }
  }
  
  // 📈 ANALYSIS: Signal performance analysis
  async analyzeSignalPerformance(): Promise<void> {
    this.logger.info('📈 Analyzing individual signal performance...');
    
    try {
      const signalNames = [
        'smart-wallet', 'lp-analysis', 'holder-velocity', 
        'transaction-pattern', 'deep-holder-analysis', 
        'social-signals', 'technical-pattern', 'market-context'
      ];
      
      for (const signalName of signalNames) {
        const performance = await this.backtestingService.getSignalPerformance(signalName);
        this.logger.info(`📊 ${signalName}:`, performance);
      }
      
    } catch (error) {
      this.logger.error('Failed to analyze signal performance:', error);
    }
  }
  
  // 🎯 OPTIMIZATION: Get weight adjustment recommendations
  async getOptimizationRecommendations(): Promise<void> {
    this.logger.info('🎯 Generating optimization recommendations...');
    
    try {
      // This would analyze your trade data and suggest improvements
      const summary = await this.dataHelper.getTradeDataSummary();
      
      this.logger.info('💡 OPTIMIZATION RECOMMENDATIONS:');
      
      if (summary.successRate < 70) {
        this.logger.info('🔴 Success rate below target (70%). Consider:');
        this.logger.info('   - Raising minimum confidence thresholds');
        this.logger.info('   - Focusing on top-performing signals');
        this.logger.info('   - Adding more selective filters');
      } else if (summary.successRate > 80) {
        this.logger.info('🟢 Excellent success rate! Consider:');
        this.logger.info('   - Increasing position sizes');
        this.logger.info('   - Lowering thresholds to find more opportunities');
        this.logger.info('   - Scaling up with higher confidence');
      }
      
      if (summary.avgReturn < 3) {
        this.logger.info('🔶 Average return below target (4x). Consider:');
        this.logger.info('   - Holding winners longer');
        this.logger.info('   - Focusing on higher momentum signals');
        this.logger.info('   - Improving exit timing');
      }
      
    } catch (error) {
      this.logger.error('Failed to generate recommendations:', error);
    }
  }
  
  // Private helper methods
  
  private async analyzeBacktestResults(performance: any): Promise<void> {
    this.logger.info('📊 BACKTEST RESULTS ANALYSIS:');
    this.logger.info('');
    
    // Overall performance
    this.logger.info('🎯 OVERALL PERFORMANCE:');
    this.logger.info(`   Total Tokens Tested: ${performance.totalTokens}`);
    this.logger.info(`   Accuracy: ${performance.accuracy.toFixed(1)}%`);
    this.logger.info(`   Thorp Success Rate: ${performance.thorpEdge.thorpSuccessRate.toFixed(1)}%`);
    this.logger.info(`   Edge over Market: +${performance.thorpEdge.edgePoints.toFixed(1)} points`);
    this.logger.info(`   Average Expected Return: ${performance.avgExpectedReturn.toFixed(2)}x`);
    this.logger.info(`   Average Actual Return: ${performance.avgActualReturn.toFixed(2)}x`);
    this.logger.info('');
    
    // Signal rankings
    this.logger.info('🏆 TOP PERFORMING SIGNALS:');
    const signalEntries = Object.entries(performance.signalPerformance);
    const topSignals = signalEntries
      .sort(([,a], [,b]) => (b as any).contributionToSuccess - (a as any).contributionToSuccess)
      .slice(0, 5);
    
    topSignals.forEach(([signal, perf]: [string, any], index) => {
      this.logger.info(`   ${index + 1}. ${signal}: ${perf.contributionToSuccess.toFixed(1)}% contribution to success`);
    });
    this.logger.info('');
    
    // Edge analysis
    if (performance.thorpEdge.edgePoints > 50) {
      this.logger.info('🟢 STRONG EDGE DETECTED:');
      this.logger.info(`   Your system has a ${performance.thorpEdge.edgePoints.toFixed(1)} point edge over market`);
      this.logger.info(`   Kelly optimal sizing: ${(performance.thorpEdge.kellyOptimal * 100).toFixed(1)}%`);
      this.logger.info('   ✅ System is performing well - consider scaling up');
    } else if (performance.thorpEdge.edgePoints > 20) {
      this.logger.info('🔶 MODERATE EDGE:');
      this.logger.info(`   ${performance.thorpEdge.edgePoints.toFixed(1)} point edge - room for improvement`);
      this.logger.info('   🔧 Focus on optimizing signal weights and thresholds');
    } else {
      this.logger.info('🔴 LOW EDGE WARNING:');
      this.logger.info(`   Only ${performance.thorpEdge.edgePoints.toFixed(1)} point edge over market`);
      this.logger.info('   ⚠️ Consider significant system improvements before scaling');
    }
    this.logger.info('');
    
    // Recommendations
    await this.getOptimizationRecommendations();
  }
}

// 🚀 MAIN EXECUTION FUNCTIONS

async function quickStart(): Promise<void> {
  console.log('🚀 THORP BACKTESTING - QUICK START');
  console.log('');
  
  const integration = new BacktestingIntegration();
  
  try {
    // Check if we have trade data
    const summary = await integration.dataHelper.getTradeDataSummary();
    
    if (summary.totalTrades === 0) {
      console.log('📝 No trade data found. Let\'s add some sample data...');
      
      // Add some sample trades for demonstration
      await integration.addQuickSuccess('So11111111111111111111111111111111111111112', 'SAMPLE1', 4.2, 14);
      await integration.addQuickSuccess('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'SAMPLE2', 6.1, 21);
      await integration.addQuickFailure('11111111111111111111111111111111', 'FAIL1', 60);
      
      console.log('✅ Added sample trades');
    }
    
    // Run full workflow
    await integration.runFullBacktestWorkflow();
    
  } catch (error) {
    console.error('❌ Quick start failed:', error);
  }
}

async function addRealTradeData(): Promise<void> {
  console.log('📝 ADD REAL TRADE DATA');
  console.log('');
  
  const integration = new BacktestingIntegration();
  
  // Generate CSV template
  const templatePath = await integration.generateCSVTemplate();
  console.log(`📋 CSV template created at: ${templatePath}`);
  console.log('');
  console.log('📝 NEXT STEPS:');
  console.log('1. Fill in the CSV template with your real trade data');
  console.log('2. Run: await importTradeData("path/to/your/trades.csv")');
  console.log('3. Run: await runBacktest()');
}

async function importTradeData(csvPath: string): Promise<void> {
  console.log(`📥 IMPORTING TRADE DATA FROM: ${csvPath}`);
  
  const integration = new BacktestingIntegration();
  
  try {
    await integration.importCSV(csvPath);
    console.log('✅ Import completed');
    
    // Show summary
    const summary = await integration.dataHelper.getTradeDataSummary();
    console.log('📊 UPDATED SUMMARY:', summary);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

async function runBacktest(): Promise<void> {
  console.log('🧪 RUNNING BACKTEST');
  
  const integration = new BacktestingIntegration();
  
  try {
    await integration.runFullBacktestWorkflow();
  } catch (error) {
    console.error('❌ Backtest failed:', error);
  }
}

async function testCurrentSystem(): Promise<void> {
  console.log('🔍 TESTING CURRENT SYSTEM');
  
  const integration = new BacktestingIntegration();
  
  // Test with a known token (USDC for example)
  await integration.testTokenWithCurrentSignals('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
}

// 📋 EXPORT FUNCTIONS FOR EASY USE

export {
  BacktestingIntegration,
  quickStart,
  addRealTradeData,
  importTradeData,
  runBacktest,
  testCurrentSystem
};

// 🎯 USAGE INSTRUCTIONS
/*
USAGE INSTRUCTIONS:

1. QUICK START (with sample data):
   npx ts-node src/scripts/backtesting-integration.ts quickStart

2. ADD YOUR REAL TRADE DATA:
   npx ts-node src/scripts/backtesting-integration.ts addRealTradeData

3. IMPORT TRADE DATA FROM CSV:
   npx ts-node src/scripts/backtesting-integration.ts importTradeData "path/to/trades.csv"

4. RUN BACKTEST:
   npx ts-node src/scripts/backtesting-integration.ts runBacktest

5. TEST CURRENT SYSTEM:
   npx ts-node src/scripts/backtesting-integration.ts testCurrentSystem

PROGRAMMATIC USAGE:

```typescript
import { BacktestingIntegration } from './src/scripts/backtesting-integration';

const integration = new BacktestingIntegration();

// Add your successful trades
await integration.addQuickSuccess('TOKEN_ADDRESS', 'SYMBOL', 4.2, 14);

// Run complete analysis
await integration.runFullBacktestWorkflow();

// Get optimization recommendations
await integration.getOptimizationRecommendations();
```

SAMPLE CSV FORMAT:
token_address,symbol,entry_date,entry_price,exit_price,exit_date,max_price,actual_return,outcome,notes
So11111111111111111111111111111111111111112,BONK,2024-01-15,0.000012,0.000048,2024-01-29,0.000052,4.0,SUCCESS,Strong community signal
*/

// Command line execution
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'quickStart':
      quickStart();
      break;
    case 'addRealTradeData':
      addRealTradeData();
      break;
    case 'importTradeData':
      if (!arg) {
        console.error('❌ Please provide CSV file path');
        process.exit(1);
      }
      importTradeData(arg);
      break;
    case 'runBacktest':
      runBacktest();
      break;
    case 'testCurrentSystem':
      testCurrentSystem();
      break;
    default:
      console.log('🎯 AVAILABLE COMMANDS:');
      console.log('  quickStart - Run quick demo with sample data');
      console.log('  addRealTradeData - Generate CSV template for your trades');
      console.log('  importTradeData <csv-path> - Import trades from CSV');
      console.log('  runBacktest - Run full backtest analysis');
      console.log('  testCurrentSystem - Test current signal system');
  }
}