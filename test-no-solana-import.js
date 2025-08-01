import https from 'https';

console.log('=== TESTING WITHOUT SOLANA IMPORTS ===');

const timeout = setTimeout(() => {
  console.log('❌ Test hung');
  process.exit(1);
}, 8000);

try {
  console.log('1. Testing simple RPC call without Solana imports...');
  
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getTokenAccountsByOwner',
    params: [
      '11111111111111111111111111111112',  // Raw string instead of PublicKey
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' }
    ]
  });
  
  const options = {
    hostname: 'mainnet.helius-rpc.com',
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    },
    timeout: 5000,
    family: 4
  };
  
  const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
      console.log('✅ RPC call successful without Solana imports');
      console.log('Response length:', responseData.length);
      clearTimeout(timeout);
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
    clearTimeout(timeout);
  });
  
  req.on('timeout', () => {
    console.log('❌ Request timed out');
    req.destroy();
    clearTimeout(timeout);
  });
  
  req.write(data);
  req.end();
  
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ Error:', error.message);
}
