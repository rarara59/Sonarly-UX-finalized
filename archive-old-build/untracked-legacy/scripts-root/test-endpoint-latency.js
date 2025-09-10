#!/usr/bin/env node

/**
 * Test individual endpoint latency
 */

import fetch from 'node-fetch';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 5000
});

async function testEndpoint(name, url) {
  console.log(`\nTesting ${name}:`);
  console.log('─'.repeat(50));
  
  const results = [];
  
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSlot',
          params: []
        }),
        agent: httpsAgent,
        timeout: 5000
      });
      
      const data = await response.json();
      const latency = Date.now() - start;
      results.push(latency);
      
      console.log(`  Attempt ${i + 1}: ${latency}ms - Slot: ${data.result?.toLocaleString() || 'ERROR'}`);
    } catch (error) {
      console.log(`  Attempt ${i + 1}: FAILED - ${error.message}`);
    }
  }
  
  if (results.length > 0) {
    const avg = results.reduce((a, b) => a + b, 0) / results.length;
    const min = Math.min(...results);
    const max = Math.max(...results);
    console.log(`\n  Stats: Min=${min}ms, Avg=${avg.toFixed(0)}ms, Max=${max}ms`);
  }
}

async function main() {
  console.log('🔍 Endpoint Latency Test');
  console.log('=' .repeat(50));
  
  // Test each endpoint
  await testEndpoint('Helius', process.env.HELIUS_RPC_URL);
  await testEndpoint('Chainstack', process.env.CHAINSTACK_RPC_URL);
  await testEndpoint('Public', process.env.PUBLIC_RPC_URL);
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Test complete\n');
  
  // Cleanup
  httpsAgent.destroy();
  process.exit(0);
}

main().catch(console.error);