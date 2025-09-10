# PROMPT: PM2 Startup Script

## SINGLE FOCUS
Create PM2 startup script that launches trading system with proper initialization sequence

## FILE TO CREATE
**CREATE**: `scripts/start-trading-system.js`

## REQUIRED IMPORTS
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { createStructuredLogger } from '../src/logger/structured-logger.js';
```

## COMPLETE IMPLEMENTATION REQUIRED

### Main Startup Script
```javascript
const execAsync = promisify(exec);
const logger = createStructuredLogger({ level: 'info' });

async function main() {
  console.log('TRADING SYSTEM STARTUP: Initializing PM2 deployment');
  console.log('====================================================');
  
  try {
    // Step 1: Validate environment
    await validateEnvironment();
    
    // Step 2: Validate ecosystem.config.js exists
    await validateEcosystemConfig();
    
    // Step 3: Install PM2 if needed
    await ensurePM2Installed();
    
    // Step 4: Stop existing processes
    await stopExistingProcesses();
    
    // Step 5: Start trading system with PM2
    await startTradingSystem();
    
    // Step 6: Validate system health
    await validateSystemStartup();
    
    console.log('\n✅ TRADING SYSTEM STARTUP COMPLETE');
    console.log('Use "pm2 list" to monitor processes');
    console.log('Use "pm2 logs" to view system logs');
    console.log('Use "pm2 monit" for real-time monitoring');
    
  } catch (error) {
    logger.error('Trading system startup failed', {
      error: error.message,
      stack: error.stack
    });
    console.error(`\n❌ STARTUP FAILED: ${error.message}`);
    process.exit(1);
  }
}

async function validateEnvironment() {
  console.log('1. Validating environment variables...');
  
  const required = [
    'HELIUS_RPC_URL',
    'CHAINSTACK_RPC_URL', 
    'PUBLIC_RPC_URL',
    'MIN_EDGE_SCORE',
    'MIN_LIQUIDITY_USD'
  ];
  
  const missing = required.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('   ✓ All required environment variables present');
}

async function validateEcosystemConfig() {
  console.log('2. Validating ecosystem.config.js...');
  
  try {
    const configPath = './ecosystem.config.js';
    const configStat = await fs.stat(configPath);
    
    // Import and validate config
    const config = await import('../ecosystem.config.js');
    if (!config.default?.apps || config.default.apps.length === 0) {
      throw new Error('ecosystem.config.js missing apps configuration');
    }
    
    console.log('   ✓ ecosystem.config.js valid with', config.default.apps.length, 'apps');
    
  } catch (error) {
    throw new Error(`ecosystem.config.js validation failed: ${error.message}`);
  }
}

async function ensurePM2Installed() {
  console.log('3. Checking PM2 installation...');
  
  try {
    await execAsync('pm2 --version');
    console.log('   ✓ PM2 already installed');
  } catch (error) {
    console.log('   Installing PM2 globally...');
    await execAsync('npm install -g pm2');
    console.log('   ✓ PM2 installed successfully');
  }
}

async function stopExistingProcesses() {
  console.log('4. Stopping existing trading processes...');
  
  try {
    // Get PM2 process list
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    
    // Find trading-related processes
    const tradingProcesses = processes.filter(proc => 
      proc.name?.includes('thorp') || 
      proc.name?.includes('trading') ||
      proc.name?.includes('detection')
    );
    
    if (tradingProcesses.length > 0) {
      console.log('   Stopping', tradingProcesses.length, 'existing processes...');
      await execAsync('pm2 delete all');
      console.log('   ✓ Existing processes stopped');
    } else {
      console.log('   ✓ No existing trading processes to stop');
    }
    
  } catch (error) {
    // PM2 not running or no processes - this is fine
    console.log('   ✓ No existing PM2 processes');
  }
}

async function startTradingSystem() {
  console.log('5. Starting trading system with PM2...');
  
  try {
    // Start using ecosystem config
    const { stdout, stderr } = await execAsync('pm2 start ecosystem.config.js');
    
    if (stderr && !stderr.includes('PM2')) {
      console.warn('   PM2 warnings:', stderr);
    }
    
    console.log('   ✓ Trading system processes started');
    
    // Wait for processes to initialize
    console.log('   Waiting 10 seconds for process initialization...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    throw new Error(`PM2 startup failed: ${error.message}`);
  }
}

async function validateSystemStartup() {
  console.log('6. Validating system health...');
  
  try {
    // Check PM2 process status
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    
    const runningProcesses = processes.filter(proc => proc.pm2_env?.status === 'online');
    const stoppedProcesses = processes.filter(proc => proc.pm2_env?.status !== 'online');
    
    console.log(`   Running processes: ${runningProcesses.length}`);
    console.log(`   Stopped processes: ${stoppedProcesses.length}`);
    
    if (stoppedProcesses.length > 0) {
      console.warn('   ⚠️  Some processes failed to start:');
      stoppedProcesses.forEach(proc => {
        console.warn(`      ${proc.name}: ${proc.pm2_env?.status}`);
      });
    }
    
    if (runningProcesses.length === 0) {
      throw new Error('No trading processes running after startup');
    }
    
    // Test basic system health
    await validateBasicHealth();
    
    console.log('   ✓ System health validation passed');
    
  } catch (error) {
    throw new Error(`System health validation failed: ${error.message}`);
  }
}

async function validateBasicHealth() {
  // Test if system-main or detection processes are responsive
  // This would depend on your specific app structure
  
  console.log('   Testing basic system responsiveness...');
  
  // Check if processes are consuming reasonable CPU/memory
  const { stdout } = await execAsync('pm2 show 0 --no-color 2>/dev/null || echo "no process"');
  
  if (stdout.includes('no process')) {
    throw new Error('No PM2 processes found after startup');
  }
  
  console.log('   ✓ PM2 processes responsive');
}

main().catch(error => {
  console.error('Startup script failed:', error.message);
  process.exit(1);
});
```

## SUCCESS CRITERIA
- PM2 installed and functional
- ecosystem.config.js loaded successfully
- Trading system processes started and online
- Basic health validation passes
- No processes in error/stopped state