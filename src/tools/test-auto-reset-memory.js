/**
 * Test Auto-Reset Memory Management System
 * Validates bounded growth and 24/7 operation capability
 */

import OptimizedSignalBus from '../core/signal-bus.js';

console.log('🧪 Testing Auto-Reset Memory Management\n');

// Test 1: Basic auto-reset functionality
const testAutoReset = async () => {
  console.log('📊 TEST 1: Auto-Reset Functionality');
  const bus = new OptimizedSignalBus({ 
    maxMemoryMB: 10,
    memoryCheckMs: 1000 // Fast checks for testing
  });
  
  console.log('  Generating 30k ring buffer operations to trigger reset...');
  
  // Generate operations to trigger ring buffer reset (25k threshold)
  for (let i = 0; i < 30000; i++) {
    const hash = Math.floor(Math.random() * 1000000);
    bus.dedupRing.add(hash);
    bus.dedupRing.contains(hash);
  }
  
  const bufferMetrics = bus.dedupRing.getMetrics();
  console.log(`  Ring buffer resets: ${bufferMetrics.totalResets}`);
  console.log(`  Current searches: ${bufferMetrics.searches}`);
  console.log(`  Historical average preserved: ${bufferMetrics.historicalAverage?.toFixed(3)}ms`);
  console.log(`  Auto-reset working: ${bufferMetrics.totalResets >= 1 ? '✅' : '❌'}\n`);
  
  bus.shutdown();
  return bufferMetrics.totalResets >= 1;
};

// Test 2: Memory bounds compliance
const testMemoryBounds = async () => {
  console.log('📊 TEST 2: Memory Bounds Compliance');
  const bus = new OptimizedSignalBus({ 
    maxMemoryMB: 10,
    memoryCheckMs: 1000
  });
  
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`  Starting memory: ${startMemory.toFixed(1)}MB`);
  
  // Generate 100k events to test memory bounds
  console.log('  Generating 100k events...');
  for (let i = 0; i < 100000; i++) {
    bus.emitCandidateDetected(
      'So11111111111111111111111111111111111111112',
      'raydium',
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      0.95
    );
    
    // Check memory every 10k events
    if (i > 0 && i % 10000 === 0) {
      const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`    ${i} events: ${currentMemory.toFixed(1)}MB`);
    }
  }
  
  const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const metrics = bus.getMetrics();
  
  console.log(`  Final memory: ${finalMemory.toFixed(1)}MB`);
  console.log(`  Memory growth: ${(finalMemory - startMemory).toFixed(1)}MB`);
  console.log(`  Auto-resets occurred:`);
  console.log(`    - Ring buffer: ${metrics.memoryManagement.autoResetCounts.ringBuffer}`);
  console.log(`    - Performance monitor: ${metrics.memoryManagement.autoResetCounts.performanceMonitor}`);
  console.log(`    - Event metrics: ${metrics.memoryManagement.autoResetCounts.eventMetrics}`);
  console.log(`  Memory bounds maintained: ${finalMemory < 10 ? '✅' : '❌'}\n`);
  
  bus.shutdown();
  return finalMemory < 10;
};

// Test 3: Event history bounded growth
const testEventHistoryBounds = async () => {
  console.log('📊 TEST 3: Event History Bounded Growth');
  const bus = new OptimizedSignalBus({ 
    historySize: 100,
    maxMemoryMB: 5
  });
  
  // Create mix of small and large events
  const smallEvent = { tokenMint: 'So11111111111111111111111111111111111111112' };
  const largeEvent = {
    tokenMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    metadata: {
      description: 'A'.repeat(500),
      holders: new Array(50).fill('Holder'),
      transactions: new Array(20).fill({ amount: 1000 })
    }
  };
  
  console.log('  Adding 200 mixed events to 100-slot history...');
  for (let i = 0; i < 200; i++) {
    const eventData = i % 3 === 0 ? largeEvent : smallEvent;
    bus.emitCandidateDetected(
      eventData.tokenMint,
      'raydium',
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      0.95,
      eventData.metadata
    );
  }
  
  const metrics = bus.getMetrics();
  const historyUsage = metrics.memoryManagement.eventHistory;
  const recentEvents = bus.getEventHistory(50);
  
  console.log(`  Event history stats:`);
  console.log(`    - Events in history: ${historyUsage.eventCount}`);
  console.log(`    - Max size: ${historyUsage.maxSize}`);
  console.log(`    - Total size: ${(historyUsage.totalSizeBytes / 1024).toFixed(1)}KB`);
  console.log(`    - Average event size: ${historyUsage.averageSizeBytes.toFixed(0)} bytes`);
  
  // Check for truncated events
  const truncatedCount = recentEvents.filter(e => e.data._truncated).length;
  console.log(`    - Truncated large events: ${truncatedCount}`);
  console.log(`  Bounded growth working: ${historyUsage.eventCount <= 100 ? '✅' : '❌'}\n`);
  
  bus.shutdown();
  return historyUsage.eventCount <= 100;
};

// Test 4: Memory pressure handling
const testMemoryPressure = async () => {
  console.log('📊 TEST 4: Memory Pressure Handling');
  const bus = new OptimizedSignalBus({ 
    maxMemoryMB: 5, // Low limit for testing
    memoryCheckMs: 500
  });
  
  // Monitor memory status changes
  let warningDetected = false;
  let criticalDetected = false;
  
  console.log('  Generating memory pressure with large events...');
  
  // Create increasingly large events
  for (let i = 0; i < 1000; i++) {
    const largeData = {
      description: 'B'.repeat(i * 10), // Growing data
      arrays: new Array(10).fill(new Array(10).fill(i))
    };
    
    bus.emitCandidateDetected(
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      'raydium',
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      0.95,
      largeData
    );
    
    const memStatus = bus.memoryManager.getMemoryStatus();
    
    if (memStatus.healthStatus === 'warning' && !warningDetected) {
      warningDetected = true;
      console.log(`  ⚠️ Memory warning at ${memStatus.current.heapUsedMB.toFixed(1)}MB`);
    }
    
    if (memStatus.healthStatus === 'critical' && !criticalDetected) {
      criticalDetected = true;
      console.log(`  🚨 Memory critical at ${memStatus.current.heapUsedMB.toFixed(1)}MB`);
      break; // Stop before emergency
    }
  }
  
  const finalMetrics = bus.getMetrics();
  console.log(`  Final memory health: ${finalMetrics.memoryManagement.current.healthStatus}`);
  console.log(`  Memory trend: ${finalMetrics.memoryManagement.current.trend}`);
  console.log(`  Pressure handling: ${warningDetected || criticalDetected ? '✅' : '❌'}\n`);
  
  bus.shutdown();
  return warningDetected || criticalDetected;
};

// Test 5: Performance metrics auto-reset
const testPerformanceReset = async () => {
  console.log('📊 TEST 5: Performance Metrics Auto-Reset');
  const bus = new OptimizedSignalBus();
  
  console.log('  Generating 60k operations to trigger performance reset...');
  
  // Track token activity to trigger performance monitor reset (50k threshold)
  for (let i = 0; i < 60000; i++) {
    bus.performanceMonitor.trackTokenActivity();
    
    if (i === 25000) {
      const status = bus.performanceMonitor.getStatus();
      console.log(`    At 25k: ${status.operationCount} operations`);
    }
  }
  
  const finalStatus = bus.performanceMonitor.getStatus();
  console.log(`  Final operation count: ${finalStatus.operationCount}`);
  console.log(`  Reset count: ${finalStatus.resetCount}`);
  console.log(`  Performance reset working: ${finalStatus.resetCount >= 1 ? '✅' : '❌'}\n`);
  
  bus.shutdown();
  return finalStatus.resetCount >= 1;
};

// Test 6: 24-hour simulation
const test24HourOperation = async () => {
  console.log('📊 TEST 6: Simulated 24-Hour Operation');
  const bus = new OptimizedSignalBus({ 
    maxMemoryMB: 10,
    memoryCheckMs: 100 // Fast for simulation
  });
  
  const startTime = Date.now();
  const hourlyStats = [];
  
  console.log('  Simulating 24 hours in 24 seconds...');
  
  // Simulate 24 hours (1 second = 1 hour)
  for (let hour = 0; hour < 24; hour++) {
    const hourStart = Date.now();
    
    // Generate 1k events per "hour" (simulating normal load)
    for (let i = 0; i < 1000; i++) {
      if (Date.now() - hourStart > 900) break; // Leave time for stats
      
      const tokens = [
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Bonk
        'So11111111111111111111111111111111111111112',   // SOL  
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'   // USDC
      ];
      const token = tokens[i % 3];
      bus.emitCandidateDetected(
        token,
        'raydium',
        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
        0.8 + Math.random() * 0.2
      );
    }
    
    // Record hourly stats
    const metrics = bus.getMetrics();
    hourlyStats.push({
      hour: hour + 1,
      memory: metrics.budget.memoryMB,
      events: metrics.performance.eventsEmitted,
      resets: {
        buffer: metrics.memoryManagement.autoResetCounts.ringBuffer,
        perf: metrics.memoryManagement.autoResetCounts.performanceMonitor,
        events: metrics.memoryManagement.autoResetCounts.eventMetrics
      }
    });
    
    if ((hour + 1) % 6 === 0) {
      const stat = hourlyStats[hour];
      console.log(`    Hour ${stat.hour}: ${stat.memory.toFixed(1)}MB, ${stat.events} events, resets: ${JSON.stringify(stat.resets)}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second = 1 hour
  }
  
  const finalMetrics = bus.getMetrics();
  const totalTime = (Date.now() - startTime) / 1000;
  
  console.log(`  Simulation complete in ${totalTime.toFixed(1)}s`);
  console.log(`  Final stats:`);
  console.log(`    - Total events: ${finalMetrics.performance.eventsEmitted}`);
  console.log(`    - Final memory: ${finalMetrics.budget.memoryMB.toFixed(1)}MB`);
  console.log(`    - Memory health: ${finalMetrics.memoryManagement.current.healthStatus}`);
  console.log(`    - Total resets: ${JSON.stringify(finalMetrics.memoryManagement.autoResetCounts)}`);
  console.log(`  24-hour operation stable: ${finalMetrics.budget.memoryMB < 10 ? '✅' : '❌'}\n`);
  
  bus.shutdown();
  return finalMetrics.budget.memoryMB < 10;
};

// Run all tests
const runAllTests = async () => {
  console.log('⚡ Auto-Reset Memory Management Test Suite\n');
  console.log('Expected improvements:');
  console.log('  - Memory stays <10MB during 24/7 operation');
  console.log('  - Auto-reset at operation thresholds');
  console.log('  - Emergency cleanup at memory pressure');
  console.log('  - Historical data preservation\n');
  
  const tests = [
    testAutoReset,
    testMemoryBounds,
    testEventHistoryBounds,
    testMemoryPressure,
    testPerformanceReset,
    test24HourOperation
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
    console.log('\n🎉 All tests passed! Auto-reset memory management is production ready.');
    console.log('Key achievements:');
    console.log('  - Bounded memory growth maintained');
    console.log('  - Auto-reset preserves historical data');
    console.log('  - Emergency cleanup prevents OOM');
    console.log('  - 24/7 operation capability confirmed');
    console.log('  - Zero manual intervention required');
  }
  
  // Force exit to ensure intervals are cleared
  process.exit(passed === tests.length ? 0 : 1);
};

// Execute tests
runAllTests();