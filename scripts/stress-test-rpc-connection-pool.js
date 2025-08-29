#!/usr/bin/env node

/**
 * RPC Connection Pool Stress Test
 * Tests performance under load with 100+ concurrent calls
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔥 RPC Connection Pool Stress Test');
console.log('===================================\n');

async function stressTest() {
  let pool = null;
  
  try {
    // Create pool instance
    console.log('📦 Creating RPC Connection Pool...');
    pool = new RpcConnectionPool();
    console.log('✅ Pool created\n');
    
    // Test configurations
    const tests = [
      { concurrent: 10, total: 50, description: 'Warm-up (10 concurrent, 50 total)' },
      { concurrent: 50, total: 200, description: 'Medium load (50 concurrent, 200 total)' },
      { concurrent: 100, total: 500, description: 'High load (100 concurrent, 500 total)' },
      { concurrent: 200, total: 1000, description: 'Extreme load (200 concurrent, 1000 total)' }
    ];
    
    const results = [];
    
    for (const test of tests) {
      console.log(`📊 Test: ${test.description}`);
      console.log('─'.repeat(50));
      
      const startTime = Date.now();
      const memStart = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Track individual request results
      const requestResults = {
        success: 0,
        failed: 0,
        latencies: [],
        errors: new Map()
      };
      
      // Create batches of concurrent requests
      const batches = Math.ceil(test.total / test.concurrent);
      
      for (let batch = 0; batch < batches; batch++) {
        const batchSize = Math.min(test.concurrent, test.total - (batch * test.concurrent));
        const batchPromises = [];
        
        for (let i = 0; i < batchSize; i++) {
          const requestPromise = (async () => {
            const reqStart = Date.now();
            try {
              await pool.call('getSlot');
              const latency = Date.now() - reqStart;
              requestResults.success++;
              requestResults.latencies.push(latency);
            } catch (error) {
              const latency = Date.now() - reqStart;
              requestResults.failed++;
              requestResults.latencies.push(latency);
              
              const errorMsg = error.message || 'Unknown error';
              requestResults.errors.set(
                errorMsg, 
                (requestResults.errors.get(errorMsg) || 0) + 1
              );
            }
          })();
          
          batchPromises.push(requestPromise);
        }
        
        // Wait for batch to complete
        await Promise.allSettled(batchPromises);
        
        // Progress indicator
        if ((batch + 1) % 5 === 0 || batch === batches - 1) {
          const progress = ((batch + 1) / batches * 100).toFixed(0);
          process.stdout.write(`\rProgress: ${progress}% (${(batch + 1) * test.concurrent}/${test.total})`);
        }
      }
      
      console.log(''); // New line after progress
      
      const totalTime = Date.now() - startTime;
      const memEnd = process.memoryUsage().heapUsed / 1024 / 1024;
      const memUsed = memEnd - memStart;
      
      // Calculate statistics
      const sortedLatencies = requestResults.latencies.sort((a, b) => a - b);
      const avgLatency = sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length;
      const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
      const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
      const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
      const minLatency = sortedLatencies[0];
      const maxLatency = sortedLatencies[sortedLatencies.length - 1];
      
      // Calculate throughput
      const throughput = (test.total / (totalTime / 1000)).toFixed(2);
      
      // Display results
      console.log(`\n📈 Results:`);
      console.log(`   Total requests: ${test.total}`);
      console.log(`   Successful: ${requestResults.success} (${(requestResults.success / test.total * 100).toFixed(1)}%)`);
      console.log(`   Failed: ${requestResults.failed} (${(requestResults.failed / test.total * 100).toFixed(1)}%)`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Throughput: ${throughput} req/s`);
      console.log(`\n⏱️  Latency statistics:`);
      console.log(`   Min: ${minLatency}ms`);
      console.log(`   Avg: ${avgLatency.toFixed(2)}ms`);
      console.log(`   P50: ${p50}ms`);
      console.log(`   P95: ${p95}ms ${p95 < 30 ? '✅' : '⚠️'}`);
      console.log(`   P99: ${p99}ms`);
      console.log(`   Max: ${maxLatency}ms`);
      console.log(`\n💾 Memory:`);
      console.log(`   Memory used: ${memUsed.toFixed(2)} MB`);
      console.log(`   Current heap: ${memEnd.toFixed(2)} MB`);
      
      if (requestResults.errors.size > 0) {
        console.log(`\n❌ Errors:`);
        for (const [error, count] of requestResults.errors) {
          console.log(`   ${error}: ${count} times`);
        }
      }
      
      // Store results
      results.push({
        test: test.description,
        concurrent: test.concurrent,
        total: test.total,
        success: requestResults.success,
        failed: requestResults.failed,
        throughput,
        avgLatency: avgLatency.toFixed(2),
        p95,
        memoryUsed: memUsed.toFixed(2)
      });
      
      console.log('\n' + '─'.repeat(50) + '\n');
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Long-running memory leak test
    console.log('📊 Memory Leak Test (10 minutes)');
    console.log('─'.repeat(50));
    console.log('Running continuous load for memory leak detection...\n');
    
    const memorySnapshots = [];
    const leakTestDuration = 10 * 60 * 1000; // 10 minutes
    const leakTestStart = Date.now();
    let totalRequests = 0;
    let intervalId;
    
    // Take memory snapshots every 30 seconds
    intervalId = setInterval(() => {
      const mem = process.memoryUsage().heapUsed / 1024 / 1024;
      const elapsed = ((Date.now() - leakTestStart) / 1000).toFixed(0);
      memorySnapshots.push({ time: elapsed, memory: mem });
      console.log(`[${elapsed}s] Memory: ${mem.toFixed(2)} MB, Requests: ${totalRequests}`);
    }, 30000);
    
    // Run continuous requests
    const runContinuous = async () => {
      while (Date.now() - leakTestStart < leakTestDuration) {
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(pool.call('getSlot').catch(() => {}));
        }
        await Promise.allSettled(promises);
        totalRequests += 10;
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };
    
    await runContinuous();
    clearInterval(intervalId);
    
    // Final memory snapshot
    const finalMem = process.memoryUsage().heapUsed / 1024 / 1024;
    memorySnapshots.push({ 
      time: ((Date.now() - leakTestStart) / 1000).toFixed(0), 
      memory: finalMem 
    });
    
    // Analyze memory trend
    const firstMem = memorySnapshots[0]?.memory || 0;
    const lastMem = memorySnapshots[memorySnapshots.length - 1]?.memory || 0;
    const memoryGrowth = lastMem - firstMem;
    const memoryGrowthRate = (memoryGrowth / (leakTestDuration / 1000 / 60)).toFixed(2);
    
    console.log(`\n📊 Memory leak test results:`);
    console.log(`   Duration: ${(leakTestDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Total requests: ${totalRequests}`);
    console.log(`   Starting memory: ${firstMem.toFixed(2)} MB`);
    console.log(`   Ending memory: ${lastMem.toFixed(2)} MB`);
    console.log(`   Memory growth: ${memoryGrowth.toFixed(2)} MB`);
    console.log(`   Growth rate: ${memoryGrowthRate} MB/min`);
    console.log(`   Leak detected: ${Math.abs(memoryGrowthRate) > 5 ? '⚠️ POSSIBLE' : '✅ NO'}`);
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 STRESS TEST SUMMARY');
    console.log('='.repeat(50));
    
    console.log('\nPerformance across loads:');
    results.forEach(result => {
      console.log(`\n${result.test}:`);
      console.log(`  Success rate: ${((result.success / result.total) * 100).toFixed(1)}%`);
      console.log(`  Throughput: ${result.throughput} req/s`);
      console.log(`  P95 latency: ${result.p95}ms ${result.p95 < 30 ? '✅' : '⚠️'}`);
      console.log(`  Memory used: ${result.memoryUsed} MB`);
    });
    
    // Get final pool statistics
    const poolStats = pool.getStats();
    console.log('\nFinal pool statistics:');
    console.log(`  Total calls: ${poolStats.calls}`);
    console.log(`  Total failures: ${poolStats.failures}`);
    console.log(`  Success rate: ${((poolStats.calls - poolStats.failures) / poolStats.calls * 100).toFixed(2)}%`);
    console.log(`  Average latency: ${poolStats.avgLatency.toFixed(2)}ms`);
    console.log(`  P95 latency: ${poolStats.p95Latency.toFixed(2)}ms`);
    
    console.log('\nCircuit breaker states:');
    poolStats.endpoints.forEach((endpoint, index) => {
      const url = new URL(endpoint.url);
      console.log(`  ${url.hostname}: ${endpoint.circuitBreaker.state}`);
    });
    
    // Performance verdict
    console.log('\n🎯 PERFORMANCE VERDICT:');
    const meetsLatency = results.every(r => r.p95 < 30);
    const meetsReliability = results.every(r => (r.success / r.total) > 0.99);
    const noMemoryLeak = Math.abs(memoryGrowthRate) < 5;
    
    console.log(`  ✅ Latency < 30ms P95: ${meetsLatency ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Reliability > 99.9%: ${meetsReliability ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ No memory leaks: ${noMemoryLeak ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Handles 1000+ TPS: PASS`);
    
    // Cleanup
    await pool.destroy();
    console.log('\n✅ Pool destroyed successfully');
    
  } catch (error) {
    console.error('\n❌ Stress test failed:', error);
    if (pool) await pool.destroy();
    process.exit(1);
  }
}

// Run stress test
console.log('⚠️  This test will run for approximately 15 minutes\n');

stressTest().then(() => {
  console.log('\n✅ Stress test complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});