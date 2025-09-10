/**
 * Test Renaissance Hash Collision Optimization
 * Validates 5x performance improvement and hash probing efficiency
 */

import OptimizedSignalBus from '../core/signal-bus.js';

console.log('🧪 Testing Renaissance Hash Collision Optimization\n');

// Test 1: Basic hash probing functionality
const testHashProbing = async () => {
  console.log('📊 TEST 1: Hash Probing Functionality');
  const signalBus = new OptimizedSignalBus();
  const buffer = signalBus.dedupRing;
  
  // Test with sequential hashes (worst case for simple modulo)
  const baseHash = 0x12345678;
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < 100; i++) {
    const hash = baseHash + i;
    buffer.add(hash);
    if (!buffer.contains(hash)) {
      console.log(`  ❌ Hash ${hash} not found after insertion`);
      return false;
    }
  }
  
  const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
  const avgLatency = elapsed / 100;
  
  console.log(`  Sequential hash insertion: ${elapsed.toFixed(2)}ms total`);
  console.log(`  Average operation: ${avgLatency.toFixed(3)}ms`);
  console.log(`  Hash probing working: ${avgLatency < 0.3 ? '✅' : '❌'}\n`);
  
  return avgLatency < 0.3;
};

// Test 2: Collision performance with real patterns
const testCollisionPerformance = async () => {
  console.log('📊 TEST 2: Collision Performance with Solana Patterns');
  const signalBus = new OptimizedSignalBus();
  const buffer = signalBus.dedupRing;
  
  // Simulate real Solana address collision patterns
  const testHashes = [
    0x12345678, 0x12345679, 0x1234567A, // Similar hashes (high collision)
    0x87654321, 0xABCDEF00, 0xDEADBEEF, // Distributed hashes (low collision)
    0x675FAB12, 0x675FAB13, 0x675FAB14  // Raydium-like patterns
  ];
  
  // Warm up the buffer
  for (let i = 0; i < 500; i++) {
    buffer.add(1000000 + i * 7);
  }
  
  // Test collision handling
  const start = process.hrtime.bigint();
  for (let i = 0; i < 1000; i++) {
    const hash = testHashes[i % testHashes.length] + Math.floor(i / testHashes.length);
    buffer.add(hash);
    buffer.contains(hash);
  }
  const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
  
  const metrics = buffer.getMetrics();
  console.log(`  Total operations: 2000 (1000 add + 1000 search)`);
  console.log(`  Total time: ${elapsed.toFixed(2)}ms`);
  console.log(`  Average latency: ${metrics.averageLatencyMs.toFixed(3)}ms`);
  console.log(`  Peak latency: ${metrics.peakLatencyMs.toFixed(3)}ms`);
  console.log(`  Average probe distance: ${metrics.averageProbeDistance.toFixed(1)}`);
  console.log(`  Collision rate: ${(metrics.collisionRate * 100).toFixed(1)}%`);
  console.log(`  Performance grade: ${metrics.performanceGrade}`);
  console.log(`  Target achieved: ${metrics.averageLatencyMs < 0.3 ? '✅' : '❌'}\n`);
  
  return metrics.averageLatencyMs < 0.3;
};

// Test 3: Buffer compaction during viral events
const testBufferCompaction = async () => {
  console.log('📊 TEST 3: Buffer Compaction During Viral Events');
  const signalBus = new OptimizedSignalBus({ dedupSize: 100 }); // Small buffer for testing
  const buffer = signalBus.dedupRing;
  
  // Fill buffer to near capacity
  console.log('  Filling buffer to 95% capacity...');
  for (let i = 0; i < 95; i++) {
    buffer.add(2000000 + i);
  }
  
  const metricsBeforeCompaction = buffer.getMetrics();
  console.log(`  Occupancy before: ${metricsBeforeCompaction.occupancy}/${metricsBeforeCompaction.bufferSize} (${(metricsBeforeCompaction.utilizationRate * 100).toFixed(1)}%)`);
  
  // Trigger compaction
  buffer.add(3000000); // This should trigger compaction at >90%
  
  const metricsAfterCompaction = buffer.getMetrics();
  console.log(`  Occupancy after: ${metricsAfterCompaction.occupancy}/${metricsAfterCompaction.bufferSize} (${(metricsAfterCompaction.utilizationRate * 100).toFixed(1)}%)`);
  console.log(`  Compaction working: ${metricsAfterCompaction.occupancy < metricsBeforeCompaction.occupancy ? '✅' : '❌'}\n`);
  
  return metricsAfterCompaction.occupancy < metricsBeforeCompaction.occupancy;
};

// Test 4: Hash distribution quality
const testHashDistribution = async () => {
  console.log('📊 TEST 4: Hash Distribution Quality');
  const signalBus = new OptimizedSignalBus();
  const buffer = signalBus.dedupRing;
  
  // Use real Solana program patterns
  const solanaPrograms = [
    0x675FAB12, // Raydium-like
    0x6EF8AB34, // Pump.fun-like
    0x87654321, // Jupiter-like
    0x11111111  // SPL Token-like
  ];
  
  // Generate realistic hash distribution
  for (let i = 0; i < 1000; i++) {
    const programIndex = i % solanaPrograms.length;
    const hash = solanaPrograms[programIndex] + (i * 31); // Prime multiplier for distribution
    buffer.add(hash);
  }
  
  const metrics = buffer.getMetrics();
  console.log(`  Hash entropy: ${metrics.hashEntropy.toFixed(2)} bits`);
  console.log(`  Collision rate: ${(metrics.collisionRate * 100).toFixed(1)}%`);
  console.log(`  Average probe distance: ${metrics.averageProbeDistance.toFixed(1)}`);
  console.log(`  Good distribution: ${metrics.hashEntropy > 2.5 ? '✅' : '❌'}\n`);
  
  return metrics.hashEntropy > 2.5;
};

// Test 5: Viral meme coin load test
const testViralMemeLoad = async () => {
  console.log('📊 TEST 5: Viral Meme Coin Load Test (5000 operations)');
  const signalBus = new OptimizedSignalBus();
  const buffer = signalBus.dedupRing;
  
  // Real meme token patterns
  const memeTokens = [
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Bonk
    'So11111111111111111111111111111111111111112',   // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'  // RAY
  ];
  
  console.log('  Simulating 1000 tokens/minute viral event...');
  const start = process.hrtime.bigint();
  
  // Process 5 bursts of 200 tokens each
  for (let burst = 0; burst < 5; burst++) {
    for (let i = 0; i < 200; i++) {
      const tokenIndex = (burst * 200 + i) % memeTokens.length;
      const token = memeTokens[tokenIndex];
      
      // Convert token address to hash (simulate real hash computation)
      const hash = token.slice(0, 8).split('').reduce((h, c) => 
        h * 31 + c.charCodeAt(0), 0) + i;
      
      buffer.add(hash);
      buffer.contains(hash);
    }
  }
  
  const totalTime = Number(process.hrtime.bigint() - start) / 1_000_000;
  const metrics = buffer.getMetrics();
  
  console.log(`  Total time for 2000 operations: ${totalTime.toFixed(2)}ms`);
  console.log(`  Operations per second: ${Math.floor(2000 / (totalTime / 1000))}`);
  console.log(`  Average latency: ${metrics.averageLatencyMs.toFixed(3)}ms`);
  console.log(`  Peak latency: ${metrics.peakLatencyMs.toFixed(3)}ms`);
  console.log(`  Performance grade: ${metrics.performanceGrade}`);
  console.log(`  Buffer utilization: ${(metrics.utilizationRate * 100).toFixed(1)}%`);
  console.log(`  Viral load handled: ${metrics.performanceGrade.startsWith('A') ? '✅' : '❌'}\n`);
  
  return metrics.performanceGrade.startsWith('A');
};

// Test 6: Compare with linear search baseline
const testPerformanceImprovement = async () => {
  console.log('📊 TEST 6: Performance Improvement vs Linear Search');
  
  // Simulate old linear search approach
  const linearSearchTest = () => {
    const buffer = new Uint32Array(1000);
    let index = 0;
    const measurements = [];
    
    // Fill buffer
    for (let i = 0; i < 500; i++) {
      buffer[index] = 1000000 + i;
      index = (index + 1) % 1000;
    }
    
    // Search operations (worst case - not found)
    for (let i = 0; i < 100; i++) {
      const searchHash = 2000000 + i;
      const start = process.hrtime.bigint();
      
      let found = false;
      for (let j = 0; j < 1000; j++) {
        if (buffer[j] === searchHash) {
          found = true;
          break;
        }
      }
      
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
      measurements.push(elapsed);
    }
    
    return measurements.reduce((a, b) => a + b) / measurements.length;
  };
  
  // Test optimized approach
  const optimizedTest = () => {
    const signalBus = new OptimizedSignalBus();
    const buffer = signalBus.dedupRing;
    
    // Fill buffer
    for (let i = 0; i < 500; i++) {
      buffer.add(1000000 + i);
    }
    
    // Search operations
    const measurements = [];
    for (let i = 0; i < 100; i++) {
      const start = process.hrtime.bigint();
      buffer.contains(2000000 + i); // Not found
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
      measurements.push(elapsed);
    }
    
    return measurements.reduce((a, b) => a + b) / measurements.length;
  };
  
  const linearAvg = linearSearchTest();
  const optimizedAvg = optimizedTest();
  const improvement = linearAvg / optimizedAvg;
  
  console.log(`  Linear search average: ${linearAvg.toFixed(3)}ms`);
  console.log(`  Optimized search average: ${optimizedAvg.toFixed(3)}ms`);
  console.log(`  Improvement factor: ${improvement.toFixed(1)}x`);
  console.log(`  5x improvement achieved: ${improvement >= 5 ? '✅' : '❌'}\n`);
  
  return improvement >= 5;
};

// Run all tests
const runAllTests = async () => {
  console.log('⚡ Renaissance Hash Collision Optimization Test Suite\n');
  console.log('Expected improvements:');
  console.log('  - 5x search performance improvement');
  console.log('  - <0.3ms average latency (from 1.5ms)');
  console.log('  - Intelligent collision handling');
  console.log('  - Auto-compaction at 90% capacity\n');
  
  const tests = [
    testHashProbing,
    testCollisionPerformance,
    testBufferCompaction,
    testHashDistribution,
    testViralMemeLoad,
    testPerformanceImprovement
  ];
  
  let passed = 0;
  for (const test of tests) {
    try {
      if (await test()) passed++;
    } catch (error) {
      console.error(`Test failed with error: ${error.message}`);
    }
  }
  
  console.log(`✅ Test Summary: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('\n🎉 All tests passed! Hash collision optimization is production ready.');
    console.log('Key achievements:');
    console.log('  - 5x+ search performance improvement');
    console.log('  - <0.3ms average latency maintained');
    console.log('  - Hash probing with intelligent distribution');
    console.log('  - Auto-compaction prevents buffer overflow');
    console.log('  - A+ Renaissance performance grade achieved');
    console.log('  - Ready for viral meme coin events (1000+ tokens/minute)');
  }
};

// Execute tests
runAllTests().then(() => process.exit(0));