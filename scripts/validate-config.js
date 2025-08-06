#!/usr/bin/env node
/**
 * Configuration Validation Script
 * Validates environment configuration before deployment
 */

import { environmentValidator } from '../src/config/validation.js';
import { config } from '../src/config/index.js';
import fs from 'fs';
import path from 'path';

async function validateConfiguration() {
  console.log('========================================');
  console.log('Thorp Trading System - Configuration Validator');
  console.log('========================================\n');
  
  try {
    // First validate environment variables
    console.log('Step 1: Validating environment variables...');
    const envValidation = environmentValidator.validate();
    
    if (!envValidation.valid) {
      console.error('\n❌ Environment validation failed!');
      console.error('Please fix the errors above before deployment.');
      process.exit(1);
    }
    
    // Initialize and validate configuration
    console.log('\nStep 2: Loading and validating configuration...');
    await config.initialize();
    
    const environment = config.getEnvironment();
    const isProduction = config.isProduction();
    
    console.log(`\n✅ Configuration loaded for environment: ${environment}`);
    
    // Additional production checks
    if (isProduction) {
      console.log('\nStep 3: Running production-specific checks...');
      
      // Check SSL certificates exist
      const sslCert = process.env.SSL_CERT_PATH;
      const sslKey = process.env.SSL_KEY_PATH;
      
      if (sslCert && sslKey) {
        try {
          fs.accessSync(sslCert, fs.constants.R_OK);
          fs.accessSync(sslKey, fs.constants.R_OK);
          console.log('✅ SSL certificates found and readable');
        } catch (error) {
          console.error('❌ SSL certificates not found or not readable');
          process.exit(1);
        }
      }
      
      // Check log directory is writable
      const logPath = process.env.LOG_PATH || config.get('logging.destination');
      if (logPath && logPath !== 'console') {
        const logDir = path.dirname(logPath);
        try {
          fs.accessSync(logDir, fs.constants.W_OK);
          console.log('✅ Log directory is writable');
        } catch (error) {
          console.warn(`⚠️  Log directory not writable: ${logDir}`);
        }
      }
      
      // Validate trading limits
      const maxPosition = config.get('trading.maxPositionSize');
      const maxDailyLoss = config.get('trading.maxDailyLoss');
      
      if (maxPosition > 10000) {
        console.warn(`⚠️  High max position size: $${maxPosition}`);
      }
      
      if (maxDailyLoss > 0.1) {
        console.warn(`⚠️  High max daily loss: ${(maxDailyLoss * 100).toFixed(1)}%`);
      }
    }
    
    // Export sanitized configuration for review
    console.log('\nStep 4: Configuration summary...');
    const exportedConfig = config.export();
    
    // Display key configuration values
    console.log('\nKey Configuration Values:');
    console.log(`- Environment: ${environment}`);
    console.log(`- Log Level: ${config.get('logging.level')}`);
    console.log(`- Trading Mode: ${process.env.TRADING_MODE || 'default'}`);
    console.log(`- Paper Trading: ${config.get('trading.enablePaperTrading')}`);
    console.log(`- Max Position Size: $${config.get('trading.maxPositionSize')}`);
    console.log(`- Max Daily Loss: ${(config.get('trading.maxDailyLoss') * 100).toFixed(1)}%`);
    console.log(`- Worker Processes: ${config.get('workers.processes')}`);
    console.log(`- Cache TTL: ${config.get('cache.defaultTTL')}s`);
    
    if (isProduction) {
      console.log(`- SSL Enabled: ${process.env.ENABLE_SSL === 'true'}`);
      console.log(`- Rate Limit: ${config.get('security.rateLimit.max')} req/min`);
      console.log(`- CORS Origins: ${process.env.CORS_ORIGIN || 'Not configured'}`);
    }
    
    // Write validation report
    const reportPath = path.join(process.cwd(), 'config-validation-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      environment: environment,
      valid: true,
      errors: envValidation.errors,
      warnings: envValidation.warnings,
      configuration: exportedConfig
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Validation report written to: ${reportPath}`);
    
    // Final result
    console.log('\n========================================');
    console.log('✅ CONFIGURATION VALIDATION PASSED');
    console.log('========================================');
    console.log('\nYour configuration is ready for deployment!');
    
    // Exit successfully
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Configuration validation failed!');
    console.error(`Error: ${error.message}`);
    console.error('\nPlease check your environment configuration and try again.');
    process.exit(1);
  }
}

// Run validation
validateConfiguration();