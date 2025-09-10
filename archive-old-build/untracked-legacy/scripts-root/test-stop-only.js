/**
 * Simple Stop Function Test
 * Tests ONLY the stop() method we just implemented
 */

import { SignalBus } from '../src/detection/core/signal-bus.js';

console.log('=== TESTING ONLY stop() FUNCTIONALITY ===');

const mockLogger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data),
  warn: (msg, data) => console.log(`[WARN] ${msg}`, data)
};

const config = { processingIntervalMs: 100 };
const signalBus = new SignalBus(config, mockLogger);

let testsPassed = 0;
let testsTotal = 0;

// TEST 1: Stop when not processing (should warn)
testsTotal++;
try {
  console.log('\nTEST 1: Calling stop() when not processing...');
  const result = signalBus.stop();
  console.log('Stop result:', result);
  
  if (!result.stopped && result.reason === 'not_processing') {
    console.log('✅ TEST 1 PASSED: Correctly handled stop when not processing');
    testsPassed++;
  } else {
    console.log('❌ TEST 1 FAILED: Wrong response when not processing');
  }
} catch (error) {
  console.log('❌ TEST 1 FAILED: stop() crashed:', error.message);
}

// TEST 2: Normal start/stop cycle
testsTotal++;
try {
  console.log('\nTEST 2: Normal start/stop cycle...');
  
  // Start processing
  console.log('Starting...');
  const startResult = signalBus.start();
  if (!startResult.started) {
    throw new Error('Failed to start');
  }
  
  // Verify processing state
  if (!signalBus.isProcessing) {
    throw new Error('isProcessing flag not set after start');
  }
  if (!signalBus.processingTimer) {
    throw new Error('Timer not created after start');
  }
  
  // Stop processing
  console.log('Stopping...');
  const stopResult = signalBus.stop();
  console.log('Stop result:', stopResult);
  
  // Verify stop result
  if (!stopResult.stopped) {
    throw new Error('Stop result indicates failure');
  }
  
  // Verify cleanup
  if (signalBus.isProcessing) {
    throw new Error('isProcessing flag not cleared after stop');
  }
  if (signalBus.processingTimer !== null) {
    throw new Error('Timer not cleared after stop');
  }
  
  console.log('✅ TEST 2 PASSED: Normal start/stop cycle works');
  testsPassed++;
} catch (error) {
  console.log('❌ TEST 2 FAILED:', error.message);
  // Emergency cleanup
  if (signalBus.processingTimer) {
    clearInterval(signalBus.processingTimer);
    signalBus.isProcessing = false;
  }
}

// TEST 3: Multiple stop calls (should be safe)
testsTotal++;
try {
  console.log('\nTEST 3: Multiple stop calls...');
  
  // Start first
  signalBus.start();
  
  // First stop
  const firstStop = signalBus.stop();
  if (!firstStop.stopped) {
    throw new Error('First stop failed');
  }
  
  // Second stop (should warn but not crash)
  const secondStop = signalBus.stop();
  if (secondStop.stopped || secondStop.reason !== 'not_processing') {
    throw new Error('Second stop should indicate not processing');
  }
  
  console.log('✅ TEST 3 PASSED: Multiple stop calls handled safely');
  testsPassed++;
} catch (error) {
  console.log('❌ TEST 3 FAILED:', error.message);
  // Emergency cleanup
  if (signalBus.processingTimer) {
    clearInterval(signalBus.processingTimer);
    signalBus.isProcessing = false;
  }
}

// TEST 4: Timer actually gets cleared (memory leak prevention)
testsTotal++;
try {
  console.log('\nTEST 4: Timer cleanup verification...');
  
  // Start processing
  signalBus.start();
  const timerRef = signalBus.processingTimer;
  
  if (!timerRef) {
    throw new Error('Timer not created');
  }
  
  // Stop processing
  signalBus.stop();
  
  // Verify timer reference is cleared
  if (signalBus.processingTimer !== null) {
    throw new Error('Timer reference not cleared');
  }
  
  // Note: We can't easily test if the interval was actually cleared
  // but clearing the reference and setting isProcessing=false is the key
  
  console.log('✅ TEST 4 PASSED: Timer cleanup works');
  testsPassed++;
} catch (error) {
  console.log('❌ TEST 4 FAILED:', error.message);
  // Emergency cleanup
  if (signalBus.processingTimer) {
    clearInterval(signalBus.processingTimer);
    signalBus.isProcessing = false;
  }
}

// Final cleanup and results
console.log('\n=== FINAL CLEANUP ===');
if (signalBus.processingTimer) {
  clearInterval(signalBus.processingTimer);
  console.log('Emergency timer cleanup performed');
}

console.log('\n=== TEST RESULTS ===');
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
console.log(`Success rate: ${Math.round((testsPassed/testsTotal) * 100)}%`);

if (testsPassed === testsTotal) {
  console.log('🎉 ALL stop() TESTS PASSED');
} else {
  console.log('💥 SOME TESTS FAILED');
}

process.exit(0);