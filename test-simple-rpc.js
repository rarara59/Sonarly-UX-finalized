import rpcManager from './src/services/simple-rpc-manager.js';
import { PublicKey } from '@solana/web3.js';

console.log('=== TESTING SIMPLE RPC MANAGER ===');

const timeout = setTimeout(() => {
  console.log('❌ Simple RPC test hung');
  process.exit(1);
}, 10000);

try {
  console.log('1. Testing getTokenAccountsByOwner...');
  const testAddress = new PublicKey('11111111111111111111111111111112');
  const tokenAccounts = await rpcManager.getTokenAccountsByOwner(
    testAddress,
    { mint: testAddress }
  );
  console.log('✅ getTokenAccountsByOwner works, returned:', tokenAccounts.length, 'accounts');
  
  clearTimeout(timeout);
  console.log('✅ Simple RPC Manager test completed successfully');
  
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ Simple RPC Manager error:', error.message);
}
