#!/usr/bin/env node

import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Debug Agent Issue');
console.log('====================\n');

// Test 1: Direct HTTPS request without agent
console.log('Test 1: Without Agent');
const url = new URL(process.env.CHAINSTACK_RPC_URL);

let connectionCount = 0;
const originalRequest = https.request;
https.request = function(...args) {
  connectionCount++;
  console.log(`  New connection #${connectionCount}`);
  return originalRequest.apply(this, args);
};

// Make 3 requests without agent
for (let i = 0; i < 3; i++) {
  await new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`  Response ${i+1}: ${data.substring(0, 50)}...`);
        resolve();
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSlot',
      params: []
    }));
    req.end();
  });
}

console.log(`Total connections without agent: ${connectionCount}\n`);

// Test 2: With Agent
console.log('Test 2: With Agent');
connectionCount = 0;

const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 5
});

for (let i = 0; i < 3; i++) {
  await new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      },
      agent: agent // Using agent here
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`  Response ${i+1}: ${data.substring(0, 50)}...`);
        resolve();
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSlot',
      params: []
    }));
    req.end();
  });
}

console.log(`Total connections with agent: ${connectionCount}`);
console.log(`Connection reuse: ${connectionCount < 3 ? 'YES ✅' : 'NO ❌'}\n`);

// Test 3: Check our RPC pool
console.log('Test 3: RPC Pool Agent Check');
connectionCount = 0;

import('../src/detection/transport/rpc-connection-pool.js').then(async (module) => {
  const pool = new module.default({
    endpoints: [process.env.CHAINSTACK_RPC_URL],
    keepAliveEnabled: true
  });
  
  console.log(`  Pool agents size: ${pool.agents.size}`);
  console.log(`  Keep-alive enabled: ${pool.config.keepAliveEnabled}`);
  
  // Check if agent exists for endpoint
  const endpoint = pool.endpoints[0];
  const agent = pool.agents.get(endpoint.index);
  console.log(`  Agent for endpoint 0: ${agent ? 'EXISTS' : 'MISSING'}`);
  if (agent) {
    console.log(`    keepAlive: ${agent.keepAlive}`);
    console.log(`    maxSockets: ${agent.maxSockets}`);
  }
  
  // Make 3 calls
  for (let i = 0; i < 3; i++) {
    await pool.call('getSlot');
    console.log(`  Call ${i+1} complete, total connections: ${connectionCount}`);
  }
  
  console.log(`\nPool connection reuse: ${connectionCount < 3 ? 'YES ✅' : 'NO ❌'}`);
  
  await pool.destroy();
  agent.destroy();
});