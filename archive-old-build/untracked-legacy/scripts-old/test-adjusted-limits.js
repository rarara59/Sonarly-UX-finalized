#!/usr/bin/env node

/**
 * Test RPC pool with adjusted rate limits
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('📊 Testing RPC Pool with Adjusted Limits');
console.log('=========================================\n');

async function runTest(name, concurrent, total) {
  const pool = new RpcConnectionPool();
  
  console.log(`\n🔄 ${name}`);
  console.log(`Concurrent: ${concurrent}, Total: ${total}`);
  console.log('─'.repeat(40));
  
  const startTime = Date.now();
  const promises = [];
  let completed = 0;
  
  // Create batches to respect rate limits
  for (let i = 0; i < total; i++) {
    // Add delay between batches to respect rate limits
    if (i > 0 && i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`  Progress: ${i}/${total} requests sent...`);
    }
    
    promises.push(
      pool.call('getSlot').then(
        () => { completed++; return true; },
        (err) => { 
          // Log first few errors only
          if (promises.length < 5) {
            console.log(`  Error: ${err.message.substring(0, 50)}...`);
          }
          return false; 
        }
      )
    );
    
    // Limit concurrent requests
    if (promises.length >= concurrent) {
      await Promise.race(promises);
    }
  }
  
  const results = await Promise.all(promises);
  const elapsed = Date.now() - startTime;
  const successful = results.filter(r => r).length;
  
  console.log(`\n📈 Results:`);
  console.log(`  Total: ${total}`);
  console.log(`  Successful: ${successful} (${(successful/total*100).toFixed(1)}%)`);
  console.log(`  Failed: ${total - successful}`);
  console.log(`  Time: ${elapsed}ms`);
  console.log(`  Throughput: ${(total/(elapsed/1000)).toFixed(2)} req/s`);
  
  const stats = pool.getStats();
  console.log(`\n⏱️ Latency:`);
  console.log(`  P50: ${stats.global.p50Latency}ms`);
  console.log(`  P95: ${stats.global.p95Latency}ms ${stats.global.p95Latency < 30 ? '✅' : '⚠️'}`);
  console.log(`  P99: ${stats.global.p99Latency}ms`);
  
  console.log(`\n📍 Endpoint Distribution:`);
  stats.endpoints.forEach(ep => {
    if (ep.calls > 0) {
      const url = new URL(ep.url);
      console.log(`  ${url.hostname}:`);
      console.log(`    Calls: ${ep.calls}`);
      console.log(`    Success: ${ep.successRate}`);
      console.log(`    Avg Latency: ${ep.avgLatency}ms`);
      console.log(`    Rate Limit: ${ep.rateLimit}`);
      console.log(`    Circuit: ${ep.breaker}`);
    }
  });
  
  await pool.destroy();
  
  return successful === total;
}

async function main() {
  console.log('Testing with rate-limit aware batching...\n');
  
  // Test 1: Within limits
  await runTest('Test 1: Light Load (5 concurrent)', 5, 20);
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: At limit
  await runTest('Test 2: At Limit (10 concurrent)', 10, 30);
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Above limit with batching
  await runTest('Test 3: Above Limit with Batching (20 concurrent)', 20, 50);
  
  console.log('\n✅ Testing complete!');
}

main().catch(console.error);