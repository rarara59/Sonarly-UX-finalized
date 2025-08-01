import https from 'https';

console.log('=== TESTING NODE.JS NETWORKING ===');

const timeout = setTimeout(() => {
  console.log('❌ Node.js networking test hung');
  process.exit(1);
}, 8000);

try {
  console.log('1. Testing with Node.js https module...');
  
  // Use Node.js built-in https instead of axios
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getVersion',
    params: []
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
    family: 4  // Force IPv4 (common fix for networking issues)
  };
  
  const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
      console.log('✅ Node.js https request successful');
      console.log('Response:', responseData);
      clearTimeout(timeout);
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ Node.js https request failed:', error.message);
    clearTimeout(timeout);
  });
  
  req.on('timeout', () => {
    console.log('❌ Node.js https request timed out');
    req.destroy();
    clearTimeout(timeout);
  });
  
  req.write(data);
  req.end();
  
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ Node.js networking error:', error.message);
}
