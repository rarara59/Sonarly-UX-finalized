import rpcManager from './src/services/rpc-connection-manager.js';

console.log('=== TESTING RPC MANAGER ONLY ===');

const timeout = setTimeout(() => {
  console.log('❌ RPC Manager test hung');
  process.exit(1);
}, 10000);

try {
  console.log('1. Getting endpoint statuses...');
  const endpoints = rpcManager.getEndpointStatuses();
  console.log('Active endpoints:', endpoints.filter(e => e.active).map(e => e.name));
  
  console.log('2. Testing simple RPC call...');
  const testAddress = '11111111111111111111111111111112';
  const accountInfo = await rpcManager.getAccountInfo(testAddress);
  console.log('Account info received:', !!accountInfo);
  
  console.log('3. Testing token accounts call...');
  const tokenAccounts = await rpcManager.getTokenAccountsByOwner(testAddress, 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  console.log('Token accounts received:', tokenAccounts.length);
  
  clearTimeout(timeout);
  console.log('✅ RPC Manager test completed successfully');
  
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ RPC Manager error:', error.message);
}
