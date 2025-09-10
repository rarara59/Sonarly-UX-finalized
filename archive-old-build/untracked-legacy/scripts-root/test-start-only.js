/**
 * Simple Start Function Test
 * Tests ONLY the start() method we just implemented
 */

import { SignalBus } from '../src/detection/core/signal-bus.js';

console.log('=== TESTING ONLY start() FUNCTIONALITY ===');

const mockLogger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data),
  warn: (msg, data) => console.log(`[WARN] ${msg}`, data)
};

const config = { processingIntervalMs: 100 };
const signalBus = new SignalBus(config, mockLogger);

console.log('Created SignalBus instance');

// TEST 1: Can we call start() without it crashing?
try {
  console.log('\nTEST 1: Calling start()...');
  const result = signalBus.start();
  console.log('Start result:', result);
  
  if (result.started) {
    console.log('✅ start() returned success');
  } else {
    console.log('❌ start() returned failure');
  }
  
  if (signalBus.isProcessing) {
    console.log('✅ isProcessing flag set correctly');
  } else {
    console.log('❌ isProcessing flag not set');
  }
  
  if (signalBus.processingTimer) {
    console.log('✅ Timer created');
  } else {
    console.log('❌ Timer not created');
  }
  
} catch (error) {
  console.log('❌ start() crashed:', error.message);
}

// Clean up
console.log('\nCleaning up timer...');
if (signalBus.processingTimer) {
  clearInterval(signalBus.processingTimer);
  console.log('Timer cleared');
}

console.log('\n=== TEST COMPLETE ===');
process.exit(0);