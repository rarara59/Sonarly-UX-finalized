/**
 * ENHANCED WORKER ERROR DIAGNOSIS
 * 
 * Captures detailed error output from worker thread to identify
 * the exact cause of exit code 1 failures.
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class EnhancedWorkerDebugger {
  constructor() {
    this.workerScript = join(__dirname, '../workers/parsing-worker.js');
  }

  async diagnoseWorkerError() {
    console.log('🔍 ENHANCED WORKER ERROR DIAGNOSIS');
    console.log('=' * 50);
    console.log(`Worker script: ${this.workerScript}`);

    return new Promise((resolve) => {
      let worker;
      let errorCaptured = false;
      let stderrOutput = '';
      let stdoutOutput = '';

      const timeout = setTimeout(() => {
        if (worker && !errorCaptured) {
          console.log('⏰ Worker timeout - forcing termination');
          worker.terminate();
          resolve();
        }
      }, 5000);

      try {
        // Create worker with stdio capture
        worker = new Worker(this.workerScript, {
          workerData: { workerId: 'error-diagnosis' },
          stderr: true,
          stdout: true
        });

        console.log('📋 Worker created, monitoring for errors...');

        // Capture stderr (error output)
        if (worker.stderr) {
          worker.stderr.on('data', (data) => {
            stderrOutput += data.toString();
            console.log('❌ STDERR:', data.toString().trim());
          });
        }

        // Capture stdout (console.log output)
        if (worker.stdout) {
          worker.stdout.on('data', (data) => {
            stdoutOutput += data.toString();
            console.log('📝 STDOUT:', data.toString().trim());
          });
        }

        // Monitor worker messages
        worker.on('message', (message) => {
          console.log('📨 Worker message:', message);
        });

        // Monitor worker errors
        worker.on('error', (error) => {
          errorCaptured = true;
          clearTimeout(timeout);
          
          console.log('❌ WORKER ERROR DETAILS:');
          console.log(`   Error: ${error.message}`);
          console.log(`   Stack: ${error.stack}`);
          console.log(`   Code: ${error.code || 'undefined'}`);
          
          if (stderrOutput) {
            console.log('❌ STDERR OUTPUT:');
            console.log(stderrOutput);
          }
          
          if (stdoutOutput) {
            console.log('📝 STDOUT OUTPUT:');
            console.log(stdoutOutput);
          }
          
          worker.terminate();
          resolve();
        });

        // Monitor worker exit
        worker.on('exit', (code, signal) => {
          clearTimeout(timeout);
          
          console.log(`🚪 WORKER EXIT DETAILS:`);
          console.log(`   Exit code: ${code}`);
          console.log(`   Signal: ${signal || 'none'}`);
          
          if (code !== 0) {
            console.log('❌ NON-ZERO EXIT CODE ANALYSIS:');
            
            if (stderrOutput) {
              console.log('❌ STDERR CONTENT:');
              console.log(stderrOutput);
            } else {
              console.log('   No stderr output captured');
            }
            
            if (stdoutOutput) {
              console.log('📝 STDOUT CONTENT:');
              console.log(stdoutOutput);
            } else {
              console.log('   No stdout output captured');
            }
            
            // Analyze common exit code 1 causes
            console.log('\n🔧 COMMON EXIT CODE 1 CAUSES:');
            console.log('   1. Syntax errors in worker file');
            console.log('   2. Missing dependencies (@solana/web3.js)');
            console.log('   3. Import path errors');
            console.log('   4. Uncaught exceptions during initialization');
            console.log('   5. Module resolution failures');
            
          } else {
            console.log('✅ Worker exited cleanly');
          }
          
          resolve();
        });

        // Give worker time to initialize
        setTimeout(() => {
          if (!errorCaptured) {
            console.log('⏱️  Worker running for 2 seconds, terminating for analysis...');
            worker.terminate();
          }
        }, 2000);

      } catch (error) {
        clearTimeout(timeout);
        console.log('❌ FAILED TO CREATE WORKER:');
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
        resolve();
      }
    });
  }

  async testDirectImport() {
    console.log('\n🔍 TESTING DIRECT WORKER IMPORT');
    console.log('=' * 40);
    
    try {
      // This will show us if there are syntax/import errors
      console.log('📋 Attempting to import worker file directly...');
      
      const startTime = Date.now();
      await import(this.workerScript);
      const importTime = Date.now() - startTime;
      
      console.log(`❌ UNEXPECTED: Worker imported successfully in ${importTime}ms`);
      console.log('   This should have triggered isMainThread exit');
      
    } catch (error) {
      console.log('✅ EXPECTED: Worker import failed (isMainThread check working)');
      console.log(`   Error: ${error.message}`);
      
      // Analyze the error type
      if (error.message.includes('Cannot resolve')) {
        console.log('🔧 DIAGNOSIS: Module resolution error');
        console.log('   Check import paths in worker file');
      } else if (error.message.includes('SyntaxError')) {
        console.log('🔧 DIAGNOSIS: Syntax error in worker file');
        console.log('   Check for syntax issues');
      } else if (error.message.includes('parentPort')) {
        console.log('🔧 DIAGNOSIS: ParentPort issue still exists');
        console.log('   Check isMainThread implementation');
      } else {
        console.log('🔧 DIAGNOSIS: Unknown import error');
        console.log(`   Full error: ${error.stack}`);
      }
    }
  }
}

// Execute enhanced diagnosis
const diagnosticTool = new EnhancedWorkerDebugger();

async function runDiagnosis() {
  await diagnosticTool.diagnoseWorkerError();
  await diagnosticTool.testDirectImport();
  
  console.log('\n' + '=' * 50);
  console.log('🎯 NEXT STEPS:');
  console.log('1. Review error output above');
  console.log('2. Fix identified issues');
  console.log('3. Re-run diagnosis');
  console.log('4. Proceed to Day 2.4 when worker is stable');
}

runDiagnosis().catch(console.error);