import axios from 'axios';

console.log('=== MINIMAL RPC TEST ===');

const timeout = setTimeout(() => {
  console.log('❌ Minimal RPC test hung');
  process.exit(1);
}, 10000);

try {
  console.log('1. Testing direct Solana RPC call...');
  
  // Direct RPC call to public endpoint
  const response = await axios.post('https://mainnet.helius-rpc.com', {
    jsonrpc: '2.0',
    id: 1,
    method: 'getVersion',
    params: []
  }, {
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' }
  });
  
  console.log('✅ Direct RPC call successful');
  console.log('Solana version:', response.data.result);
  
  clearTimeout(timeout);
  
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ Direct RPC call failed:', error.message);
}
