/**
 * PARSING WORKER DEBUG TEST
 * 
 * Minimal test to isolate parsing worker communication failures.
 * Tests basic worker functionality before complex mathematical operations.
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ParsingWorkerDebugger {
  constructor() {
    this.workerScript = join(__dirname, '../workers/parsing-worker.js');
    this.testResults = [];
  }

  async runDiagnostics() {
    console.log('🔍 PARSING WORKER DIAGNOSTIC TEST');
    console.log('=' * 50);
    console.log(`Worker script: ${this.workerScript}`);

    try {
      await this.testWorkerCreation();
      await this.testBasicCommunication();
      await this.testSimpleTask();
      await this.testMathematicalOperation();
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
    }

    this.printResults();
  }

  /**
   * Test 1: Basic worker creation
   */
  async testWorkerCreation() {
    console.log('\n📋 Test 1: Worker Creation');
    
    return new Promise((resolve, reject) => {
      let worker;
      const timeout = setTimeout(() => {
        if (worker) worker.terminate();
        reject(new Error('Worker creation timeout'));
      }, 3000);

      try {
        worker = new Worker(this.workerScript, {
          workerData: { workerId: 'debug-1' }
        });

        worker.on('error', (error) => {
          clearTimeout(timeout);
          console.log(`❌ Worker error: ${error.message}`);
          this.testResults.push({ test: 'Worker Creation', passed: false, error: error.message });
          reject(error);
        });

        worker.on('exit', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            console.log('✅ Worker created and exited cleanly');
            this.testResults.push({ test: 'Worker Creation', passed: true });
            resolve();
          } else {
            const error = `Worker exited with code ${code}`;
            console.log(`❌ ${error}`);
            this.testResults.push({ test: 'Worker Creation', passed: false, error });
            reject(new Error(error));
          }
        });

        // Let worker initialize, then terminate
        setTimeout(() => {
          worker.terminate();
        }, 1000);

      } catch (error) {
        clearTimeout(timeout);
        console.log(`❌ Failed to create worker: ${error.message}`);
        this.testResults.push({ test: 'Worker Creation', passed: false, error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Test 2: Basic message communication
   */
  async testBasicCommunication() {
    console.log('\n📋 Test 2: Basic Communication');
    
    return new Promise((resolve, reject) => {
      let worker;
      const timeout = setTimeout(() => {
        if (worker) worker.terminate();
        reject(new Error('Communication timeout'));
      }, 5000);

      try {
        worker = new Worker(this.workerScript, {
          workerData: { workerId: 'debug-2' }
        });

        let messageReceived = false;

        worker.on('message', (message) => {
          console.log(`📨 Received message:`, message);
          messageReceived = true;
          
          if (message.error) {
            console.log(`❌ Worker returned error: ${message.error}`);
            this.testResults.push({ test: 'Basic Communication', passed: false, error: message.error });
          } else {
            console.log('✅ Communication successful');
            this.testResults.push({ test: 'Basic Communication', passed: true });
          }
          
          clearTimeout(timeout);
          worker.terminate();
          resolve();
        });

        worker.on('error', (error) => {
          clearTimeout(timeout);
          console.log(`❌ Worker error: ${error.message}`);
          this.testResults.push({ test: 'Basic Communication', passed: false, error: error.message });
          worker.terminate();
          reject(error);
        });

        worker.on('exit', (code) => {
          clearTimeout(timeout);
          if (!messageReceived) {
            const error = `Worker exited without sending message (code ${code})`;
            console.log(`❌ ${error}`);
            this.testResults.push({ test: 'Basic Communication', passed: false, error });
            reject(new Error(error));
          }
        });

        // Send a simple unknown task to test error handling
        console.log('📤 Sending test message...');
        worker.postMessage({
          taskId: 1,
          type: 'ping',
          data: {},
          timestamp: Date.now()
        });

      } catch (error) {
        clearTimeout(timeout);
        console.log(`❌ Communication test failed: ${error.message}`);
        this.testResults.push({ test: 'Basic Communication', passed: false, error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Test 3: Simple parsing task
   */
  async testSimpleTask() {
    console.log('\n📋 Test 3: Simple Parsing Task');
    
    return new Promise((resolve, reject) => {
      let worker;
      const timeout = setTimeout(() => {
        if (worker) worker.terminate();
        reject(new Error('Simple task timeout'));
      }, 5000);

      try {
        worker = new Worker(this.workerScript, {
          workerData: { workerId: 'debug-3' }
        });

        worker.on('message', (message) => {
          console.log(`📨 Task result:`, message);
          clearTimeout(timeout);
          
          if (message.error) {
            console.log(`❌ Task failed: ${message.error}`);
            this.testResults.push({ test: 'Simple Parsing Task', passed: false, error: message.error });
          } else {
            console.log('✅ Simple task successful');
            this.testResults.push({ test: 'Simple Parsing Task', passed: true });
          }
          
          worker.terminate();
          resolve();
        });

        worker.on('error', (error) => {
          clearTimeout(timeout);
          console.log(`❌ Worker error: ${error.message}`);
          this.testResults.push({ test: 'Simple Parsing Task', passed: false, error: error.message });
          worker.terminate();
          reject(error);
        });

        // Test calculatePrice - simpler than full LP parsing
        console.log('📤 Sending calculatePrice task...');
        worker.postMessage({
          taskId: 2,
          type: 'calculatePrice',
          data: {
            baseReserve: '1000000000',
            quoteReserve: '500000000',
            decimalsA: 9,
            decimalsB: 6,
            priceType: 'amm'
          },
          timestamp: Date.now()
        });

      } catch (error) {
        clearTimeout(timeout);
        console.log(`❌ Simple task test failed: ${error.message}`);
        this.testResults.push({ test: 'Simple Parsing Task', passed: false, error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Test 4: Mathematical operation (the failing test)
   */
  async testMathematicalOperation() {
    console.log('\n📋 Test 4: Mathematical Operation');
    
    return new Promise((resolve, reject) => {
      let worker;
      const timeout = setTimeout(() => {
        if (worker) worker.terminate();
        reject(new Error('Mathematical operation timeout'));
      }, 8000); // Longer timeout

      try {
        worker = new Worker(this.workerScript, {
          workerData: { workerId: 'debug-4' }
        });

        worker.on('message', (message) => {
          console.log(`📨 Math result:`, JSON.stringify(message, null, 2));
          clearTimeout(timeout);
          
          if (message.error) {
            console.log(`❌ Math operation failed: ${message.error}`);
            this.testResults.push({ test: 'Mathematical Operation', passed: false, error: message.error });
          } else {
            console.log('✅ Mathematical operation successful');
            this.testResults.push({ test: 'Mathematical Operation', passed: true });
          }
          
          worker.terminate();
          resolve();
        });

        worker.on('error', (error) => {
          clearTimeout(timeout);
          console.log(`❌ Worker error: ${error.message}`);
          this.testResults.push({ test: 'Mathematical Operation', passed: false, error: error.message });
          worker.terminate();
          reject(error);
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            console.log(`⚠️  Worker exited with code ${code}`);
          }
        });

        // Test the exact operation that's failing
        console.log('📤 Sending kellyCriterion task...');
        worker.postMessage({
          taskId: 3,
          type: 'mathematicalOperations',
          data: {
            operation: 'kellyCriterion',
            parameters: {
              winRate: 0.6,
              avgWin: 1.5,
              avgLoss: 1.0
            }
          },
          timestamp: Date.now()
        });

      } catch (error) {
        clearTimeout(timeout);
        console.log(`❌ Mathematical operation test failed: ${error.message}`);
        this.testResults.push({ test: 'Mathematical Operation', passed: false, error: error.message });
        reject(error);
      }
    });
  }

  printResults() {
    console.log('\n' + '=' * 50);
    console.log('📊 DIAGNOSTIC RESULTS');
    console.log('=' * 50);
    
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.test}: ${status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const passCount = this.testResults.filter(r => r.passed).length;
    const totalCount = this.testResults.length;
    
    console.log(`\nSummary: ${passCount}/${totalCount} tests passed`);
    
    if (passCount === totalCount) {
      console.log('🎉 All diagnostics passed - worker is functional');
    } else {
      console.log('⚠️  Some diagnostics failed - investigate issues above');
    }
  }
}

// Execute diagnostics
const diagnosticRunner = new ParsingWorkerDebugger();
diagnosticRunner.runDiagnostics().catch(console.error);