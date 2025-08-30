#!/usr/bin/env node

/**
 * Test HTTP Agent Integration and Performance
 * Verify connection reuse and measure latency improvements
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 HTTP Agent Performance Test');
console.log('================================\n');

// Track global HTTPS connections
let connectionCount = 0;
const originalHttpsRequest = https.request;
https.request = function(...args) {
  connectionCount++;
  return originalHttpsRequest.apply(this, args);
};

async function testWithoutAgents() {
  console.log('📊 Test 1: WITHOUT HTTP Agents (keep-alive disabled)');
  console.log('─'.repeat(50));
  
  // Create pool with agents disabled
  const pool = new RpcConnectionPool({
    keepAliveEnabled: false
  });
  
  connectionCount = 0;
  const latencies = [];
  
  // Warmup
  await pool.call('getSlot');
  
  // Test 20 sequential calls
  for (let i = 0; i < 20; i++) {
    const start = Date.now();
    await pool.call('getSlot');
    const latency = Date.now() - start;
    latencies.push(latency);
    
    if (i % 5 === 4) {
      console.log(`  Calls ${i-3}-${i+1}: Connections created: ${connectionCount}, Avg latency: ${
        latencies.slice(-5).reduce((a,b) => a+b, 0) / 5
      }ms`);
    }
  }
  
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies.sort((a, b) => a - b)[p95Index];
  
  console.log(`\n📈 Results WITHOUT agents:`);
  console.log(`  Total connections created: ${connectionCount}`);
  console.log(`  Average latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`  P95 latency: ${p95Latency}ms`);
  console.log(`  Connection reuse: ${connectionCount < 20 ? 'YES' : 'NO'}`);
  
  await pool.destroy();
  
  return { avgLatency, p95Latency, connections: connectionCount };
}

async function testWithAgents() {
  console.log('\n📊 Test 2: WITH HTTP Agents (keep-alive enabled)');
  console.log('─'.repeat(50));
  
  // Create pool with agents enabled (default)
  const pool = new RpcConnectionPool({
    keepAliveEnabled: true
  });
  
  // Verify agents are initialized
  console.log(`  Agents initialized: ${pool.agents.size} agents`);
  pool.agents.forEach((agent, index) => {
    console.log(`    Agent ${index}: keepAlive=${agent.keepAlive}, maxSockets=${agent.maxSockets}`);
  });
  
  connectionCount = 0;
  const latencies = [];
  
  // Warmup
  await pool.call('getSlot');
  console.log(`  Warmup complete, connections: ${connectionCount}`);
  
  connectionCount = 0; // Reset after warmup
  
  // Test 20 sequential calls
  for (let i = 0; i < 20; i++) {
    const start = Date.now();
    await pool.call('getSlot');
    const latency = Date.now() - start;
    latencies.push(latency);
    
    if (i % 5 === 4) {
      console.log(`  Calls ${i-3}-${i+1}: Connections created: ${connectionCount}, Avg latency: ${
        latencies.slice(-5).reduce((a,b) => a+b, 0) / 5
      }ms`);
    }
  }
  
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies.sort((a, b) => a - b)[p95Index];
  
  console.log(`\n📈 Results WITH agents:`);
  console.log(`  Total connections created: ${connectionCount}`);
  console.log(`  Average latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`  P95 latency: ${p95Latency}ms`);
  console.log(`  Connection reuse: ${connectionCount < 20 ? 'YES ✅' : 'NO ❌'}`);
  
  await pool.destroy();
  
  return { avgLatency, p95Latency, connections: connectionCount };
}

async function testConcurrent() {
  console.log('\n📊 Test 3: Concurrent Requests (testing connection pooling)');
  console.log('─'.repeat(50));
  
  const pool = new RpcConnectionPool({
    keepAliveEnabled: true
  });
  
  connectionCount = 0;
  
  // Warmup
  await pool.call('getSlot');
  connectionCount = 0; // Reset after warmup
  
  // Test 20 concurrent calls
  console.log('  Sending 20 concurrent requests...');
  const start = Date.now();
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(pool.call('getSlot'));
  }
  
  const results = await Promise.allSettled(promises);
  const elapsed = Date.now() - start;
  const successful = results.filter(r => r.status === 'fulfilled').length;
  
  console.log(`\n📈 Concurrent results:`);
  console.log(`  Successful: ${successful}/20`);
  console.log(`  Connections created: ${connectionCount}`);
  console.log(`  Total time: ${elapsed}ms`);
  console.log(`  Avg per request: ${(elapsed/20).toFixed(2)}ms`);
  console.log(`  Connection pooling: ${connectionCount <= 10 ? 'WORKING ✅' : 'NOT WORKING ❌'}`);
  
  await pool.destroy();
}

async function testAllEndpoints() {
  console.log('\n📊 Test 4: All Endpoints Performance');
  console.log('─'.repeat(50));
  
  const endpoints = [
    process.env.CHAINSTACK_RPC_URL,
    process.env.HELIUS_RPC_URL,
    process.env.PUBLIC_RPC_URL
  ].filter(Boolean);
  
  for (const endpoint of endpoints) {
    const url = new URL(endpoint);
    console.log(`\n  Testing ${url.hostname}:`);
    
    const pool = new RpcConnectionPool({
      endpoints: [endpoint],
      keepAliveEnabled: true
    });
    
    // Warmup
    await pool.call('getSlot');
    
    // Test 10 calls
    const latencies = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await pool.call('getSlot');
      latencies.push(Date.now() - start);
    }
    
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    
    console.log(`    Min: ${min}ms, Avg: ${avg.toFixed(2)}ms, Max: ${max}ms`);
    
    await pool.destroy();
  }
}

async function main() {
  try {
    // Test 1: Without agents
    const withoutAgents = await testWithoutAgents();
    
    // Test 2: With agents
    const withAgents = await testWithAgents();
    
    // Test 3: Concurrent
    await testConcurrent();
    
    // Test 4: All endpoints
    await testAllEndpoints();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 PERFORMANCE COMPARISON SUMMARY');
    console.log('='.repeat(50));
    
    const latencyImprovement = ((withoutAgents.avgLatency - withAgents.avgLatency) / withoutAgents.avgLatency * 100).toFixed(1);
    const connectionReduction = ((withoutAgents.connections - withAgents.connections) / withoutAgents.connections * 100).toFixed(1);
    
    console.log(`\nWithout HTTP Agents:`);
    console.log(`  Avg Latency: ${withoutAgents.avgLatency.toFixed(2)}ms`);
    console.log(`  P95 Latency: ${withoutAgents.p95Latency}ms`);
    console.log(`  Connections: ${withoutAgents.connections}`);
    
    console.log(`\nWith HTTP Agents:`);
    console.log(`  Avg Latency: ${withAgents.avgLatency.toFixed(2)}ms`);
    console.log(`  P95 Latency: ${withAgents.p95Latency}ms`);
    console.log(`  Connections: ${withAgents.connections}`);
    
    console.log(`\n🎯 IMPROVEMENTS:`);
    console.log(`  Latency Reduction: ${latencyImprovement}% ${latencyImprovement > 0 ? '✅' : '❌'}`);
    console.log(`  Connection Reduction: ${connectionReduction}% ${connectionReduction > 50 ? '✅' : '❌'}`);
    console.log(`  Target P95 <30ms: ${withAgents.p95Latency < 30 ? 'ACHIEVED ✅' : 'NOT MET ❌'}`);
    
    if (withAgents.connections < withoutAgents.connections / 2) {
      console.log(`\n✅ HTTP Agent integration is WORKING - connections are being reused!`);
    } else {
      console.log(`\n❌ HTTP Agent integration may have issues - connections not being reused efficiently`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();