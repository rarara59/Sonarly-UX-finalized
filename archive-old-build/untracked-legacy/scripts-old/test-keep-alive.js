#!/usr/bin/env node

import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Keep-Alive...\n');

const url = new URL(process.env.CHAINSTACK_RPC_URL);

// Create agent with explicit keep-alive
const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 5,
  maxFreeSockets: 5,
  timeout: 60000,
  scheduling: 'lifo'
});

console.log('Making sequential requests with same agent...\n');

async function makeRequest(id) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000'
      },
      agent: agent
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      // Check response headers
      if (id === 1) {
        console.log('Response headers:', res.headers);
      }
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - start;
        const result = JSON.parse(data);
        console.log(`Request ${id}: ${latency}ms - Slot: ${result.result}`);
        
        // Check socket reuse
        const socket = res.socket;
        console.log(`  Socket reused: ${socket && socket.reusedSocket ? 'YES' : 'NO'}`);
        console.log(`  Active sockets: ${Object.keys(agent.sockets).reduce((acc, key) => acc + agent.sockets[key].length, 0)}`);
        console.log(`  Free sockets: ${Object.keys(agent.freeSockets).reduce((acc, key) => acc + agent.freeSockets[key].length, 0)}`);
        
        resolve(latency);
      });
    });
    
    req.on('error', reject);
    
    req.on('socket', (socket) => {
      socket.on('connect', () => {
        console.log(`  Socket ${id}: NEW CONNECTION`);
      });
    });
    
    req.write(JSON.stringify({
      jsonrpc: '2.0',
      id: id,
      method: 'getSlot',
      params: []
    }));
    
    req.end();
  });
}

// Make sequential requests
const latencies = [];
for (let i = 1; i <= 5; i++) {
  const latency = await makeRequest(i);
  latencies.push(latency);
  await new Promise(r => setTimeout(r, 100)); // Small delay between requests
}

console.log('\nSummary:');
console.log(`Average latency: ${(latencies.reduce((a,b) => a+b, 0) / latencies.length).toFixed(2)}ms`);
console.log(`First request: ${latencies[0]}ms`);
console.log(`Last request: ${latencies[latencies.length-1]}ms`);

// Cleanup
agent.destroy();