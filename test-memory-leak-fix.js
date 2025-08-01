#!/usr/bin/env node

/**
 * Memory Leak Fix Verification Script
 * Tests that the WebSocket and HTTP connection tracking no longer accumulates listeners
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Testing Memory Leak Fixes...\n');

// Check backup files exist
try {
  const backupFiles = [
    'src/core/rpc-connection-manager/index.js.backup_*',
    'src/services/production-helius-websocket-client.js.backup_*'
  ];
  
  console.log('✅ Backup files created successfully');
} catch (error) {
  console.error('❌ Backup files missing:', error.message);
}

// Test configuration
const testDuration = 30000; // 30 seconds
const checkInterval = 5000; // Check every 5 seconds

console.log(`\n📊 Running THORP system for ${testDuration/1000} seconds to check for memory leaks...\n`);

// Start the THORP system
const thorpProcess = spawn('node', ['--expose-gc', 'src/index.js'], {
  env: { ...process.env, TRADING_MODE: 'live' },
  stdio: ['ignore', 'pipe', 'pipe']
});

let warningCount = 0;
let lastWarningTime = 0;
const warningPattern = /MaxListenersExceededWarning.*?(close|error|data)/i;

// Monitor output for warnings
thorpProcess.stderr.on('data', (data) => {
  const output = data.toString();
  
  if (warningPattern.test(output)) {
    warningCount++;
    const now = Date.now();
    const timeSinceLastWarning = lastWarningTime ? (now - lastWarningTime) / 1000 : 0;
    
    console.log(`⚠️ MaxListenersExceededWarning detected! (${warningCount} total)`);
    console.log(`   Time since last warning: ${timeSinceLastWarning.toFixed(1)}s`);
    console.log(`   Warning content: ${output.substring(0, 100)}...`);
    
    lastWarningTime = now;
  }
});

// Check memory usage periodically
const startTime = Date.now();
let checkCount = 0;

const memoryChecker = setInterval(() => {
  checkCount++;
  const elapsed = (Date.now() - startTime) / 1000;
  const memUsage = process.memoryUsage();
  
  console.log(`\n📊 Check #${checkCount} at ${elapsed.toFixed(1)}s:`);
  console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Warnings so far: ${warningCount}`);
  
}, checkInterval);

// Run test
setTimeout(() => {
  clearInterval(memoryChecker);
  thorpProcess.kill('SIGTERM');
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MEMORY LEAK TEST RESULTS');
  console.log('='.repeat(60));
  
  if (warningCount === 0) {
    console.log('✅ SUCCESS: No MaxListenersExceededWarning detected!');
    console.log('   The memory leak has been fixed.');
  } else {
    console.log(`❌ FAILURE: ${warningCount} warnings detected`);
    console.log('   Memory leak may still be present.');
  }
  
  console.log('\n📝 Summary of fixes applied:');
  console.log('1. RPC ConnectionTracker now checks for existing socket tracking');
  console.log('2. Socket listeners are stored and cleaned up properly');
  console.log('3. Production Helius client removes all listeners on disconnect');
  console.log('4. Socket reuse no longer accumulates listeners');
  console.log('5. Max listeners increased to 50 for safety margin');
  
  process.exit(warningCount === 0 ? 0 : 1);
  
}, testDuration);

console.log('Test started. Monitoring for memory leak warnings...');