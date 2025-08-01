/**
 * MINIMAL WORKER TEST
 * 
 * Creates progressively complex workers to isolate the exact failure point
 * in the parsing worker initialization.
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MinimalWorkerTester {
  constructor() {
    this.testDir = join(__dirname, '../workers');
  }

  async runProgressiveTests() {
    console.log('🔍 MINIMAL WORKER PROGRESSIVE TESTING');
    console.log('=' * 50);

    try {
      await this.testBasicWorker();
      await this.testWorkerWithSolana();
      await this.testWorkerWithConstants();
      await this.testParsingSections();
      
    } catch (error) {
      console.error('❌ Progressive testing failed:', error.message);
    }
  }

  async testBasicWorker() {
    console.log('\n📋 Test 1: Basic Worker (No Imports)');
    
    const workerCode = `
import { parentPort, workerData, isMainThread } from 'worker_threads';

if (isMainThread) {
  console.log('⚠️  Basic worker should not be imported directly');
  process.exit(0);
}

console.log('✅ Basic worker started successfully');
const workerId = workerData?.workerId ?? 'basic';

parentPort.on('message', (message) => {
  console.log('📨 Basic worker received message:', message);
  parentPort.postMessage({ 
    success: true, 
    workerId,
    message: 'Basic worker functioning'
  });
});

console.log('Basic worker ready');
`;

    await this.testWorkerCode('basic-worker.js', workerCode);
  }

  async testWorkerWithSolana() {
    console.log('\n📋 Test 2: Worker With Solana Import');
    
    const workerCode = `
import { parentPort, workerData, isMainThread } from 'worker_threads';
import { PublicKey } from '@solana/web3.js';

if (isMainThread) {
  console.log('⚠️  Solana worker should not be imported directly');
  process.exit(0);
}

console.log('✅ Solana worker started successfully');
const workerId = workerData?.workerId ?? 'solana';

// Test Solana functionality
try {
  const testKey = new PublicKey('11111111111111111111111111111111');
  console.log('✅ Solana PublicKey creation works in worker');
} catch (error) {
  console.log('❌ Solana error in worker:', error.message);
  process.exit(1);
}

parentPort.on('message', (message) => {
  console.log('📨 Solana worker received message:', message);
  parentPort.postMessage({ 
    success: true, 
    workerId,
    message: 'Solana worker functioning'
  });
});

console.log('Solana worker ready');
`;

    await this.testWorkerCode('solana-worker.js', workerCode);
  }

  async testWorkerWithConstants() {
    console.log('\n📋 Test 3: Worker With Layout Constants');
    
    const workerCode = `
import { parentPort, workerData, isMainThread } from 'worker_threads';
import { PublicKey } from '@solana/web3.js';
import {
  RAYDIUM_LAYOUT_CONSTANTS,
  ORCA_LAYOUT_CONSTANTS,
  MINT_LAYOUT_CONSTANTS
} from '../constants/layout-constants.js';

if (isMainThread) {
  console.log('⚠️  Constants worker should not be imported directly');
  process.exit(0);
}

console.log('✅ Constants worker started successfully');
const workerId = workerData?.workerId ?? 'constants';

// Test constants availability
try {
  console.log('📊 Raydium base mint offset:', RAYDIUM_LAYOUT_CONSTANTS.BASE_MINT_OFFSET);
  console.log('📊 Orca tick spacing offset:', ORCA_LAYOUT_CONSTANTS.TICK_SPACING_OFFSET);
  console.log('📊 Mint decimals offset:', MINT_LAYOUT_CONSTANTS.DECIMALS_OFFSET);
  console.log('✅ Layout constants accessible in worker');
} catch (error) {
  console.log('❌ Constants error in worker:', error.message);
  process.exit(1);
}

parentPort.on('message', (message) => {
  console.log('📨 Constants worker received message:', message);
  parentPort.postMessage({ 
    success: true, 
    workerId,
    message: 'Constants worker functioning'
  });
});

console.log('Constants worker ready');
`;

    await this.testWorkerCode('constants-worker.js', workerCode);
  }

  async testParsingSections() {
    console.log('\n📋 Test 4: Parsing Worker Sections');
    
    // Test if specific parts of the parsing worker cause issues
    const workerCode = `
import { parentPort, workerData, isMainThread } from 'worker_threads';
import { PublicKey } from '@solana/web3.js';
import {
  RAYDIUM_LAYOUT_CONSTANTS,
  ORCA_LAYOUT_CONSTANTS,
  MINT_LAYOUT_CONSTANTS
} from '../constants/layout-constants.js';

if (isMainThread) {
  console.log('⚠️  Parsing sections worker should not be imported directly');
  process.exit(0);
}

console.log('✅ Parsing sections worker started');
const workerId = workerData?.workerId ?? 'parsing';

// Test global safety guards setup
let taskCount = 0;
let totalExecutionTime = 0;

process.on('uncaughtException', (err) => {
  console.error('❌ Worker uncaughtException:', err);
  parentPort?.postMessage({
    taskId: 0,
    error: 'uncaughtException: ' + err.message,
    workerId,
    type: 'internal'
  });
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error('❌ Worker unhandledRejection:', err);
  parentPort?.postMessage({
    taskId: 0,
    error: 'unhandledRejection: ' + err.message,
    workerId,
    type: 'internal'
  });
});

console.log('✅ Error handlers set up');

// Test message handler setup
parentPort.on('message', async (message) => {
  console.log('📨 Parsing worker received:', message);
  
  try {
    parentPort.postMessage({
      taskId: message.taskId || 1,
      result: { success: true, workerId },
      executionTime: 10,
      type: message.type || 'test'
    });
  } catch (error) {
    parentPort.postMessage({
      taskId: message.taskId || 1,
      error: error.message,
      workerId,
      type: message.type || 'test'
    });
  }
});

console.log('Parsing sections worker ready');
`;

    await this.testWorkerCode('parsing-sections-worker.js', workerCode);
  }

  async testWorkerCode(filename, code) {
    const workerPath = join(this.testDir, filename);
    
    try {
      // Write test worker file
      await fs.promises.writeFile(workerPath, code);
      console.log(`📝 Created test worker: ${filename}`);
      
      // Test the worker
      const success = await this.runWorkerTest(workerPath);
      
      // Cleanup
      await fs.promises.unlink(workerPath);
      
      if (success) {
        console.log(`✅ ${filename} test PASSED`);
      } else {
        console.log(`❌ ${filename} test FAILED`);
        throw new Error(`Worker test failed: ${filename}`);
      }
      
    } catch (error) {
      console.log(`❌ ${filename} error: ${error.message}`);
      
      // Cleanup on error
      try {
        await fs.promises.unlink(workerPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  async runWorkerTest(workerPath) {
    return new Promise((resolve) => {
      let worker;
      let success = false;
      let stderrOutput = '';

      const timeout = setTimeout(() => {
        if (worker) worker.terminate();
        console.log('⏰ Worker test timeout');
        resolve(false);
      }, 3000);

      try {
        worker = new Worker(workerPath, {
          workerData: { workerId: 'test' },
          stderr: true
        });

        if (worker.stderr) {
          worker.stderr.on('data', (data) => {
            stderrOutput += data.toString();
          });
        }

        worker.on('message', (message) => {
          console.log('📨 Test worker response:', message);
          success = true;
          clearTimeout(timeout);
          worker.terminate();
          resolve(true);
        });

        worker.on('error', (error) => {
          console.log(`❌ Worker error: ${error.message}`);
          clearTimeout(timeout);
          resolve(false);
        });

        worker.on('exit', (code) => {
          clearTimeout(timeout);
          
          if (code !== 0) {
            console.log(`❌ Worker exited with code ${code}`);
            if (stderrOutput) {
              console.log('❌ Stderr:', stderrOutput);
            }
            resolve(false);
          } else if (!success) {
            console.log('✅ Worker exited cleanly (no message test)');
            resolve(true);
          }
        });

        // Send test message after a brief delay
        setTimeout(() => {
          worker.postMessage({ 
            taskId: 1, 
            type: 'test', 
            data: { test: true },
            timestamp: Date.now()
          });
        }, 500);

      } catch (error) {
        clearTimeout(timeout);
        console.log(`❌ Failed to create worker: ${error.message}`);
        resolve(false);
      }
    });
  }
}

// Execute progressive tests
const tester = new MinimalWorkerTester();
tester.runProgressiveTests().catch(console.error);