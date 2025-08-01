import { SmartWalletSignalJS } from './src/signal-modules/smart-wallet-signal.module.js';
import rpcManager from './src/services/working-rpc-manager.js';

console.log('=== TESTING SMARTWALLET WITH WORKING RPC ===');

const timeout = setTimeout(() => {
  console.log('❌ Integration test hung');
  process.exit(1);
}, 20000);

try {
  console.log('1. Testing RPC manager...');
  const testAccounts = await rpcManager.getTokenAccountsByOwner(
    '11111111111111111111111111111112',
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }
  );
  console.log('✅ RPC manager works, returned', testAccounts.value?.length || 0, 'accounts');
  
  console.log('2. Testing SmartWalletSignalJS...');
  const signal = new SmartWalletSignalJS();
  
  const context = {
    tokenAddress: '11111111111111111111111111111112',
    rpcManager: rpcManager,
    logger: {
      info: (msg) => console.log('[INFO]', msg),
      warn: (msg) => console.log('[WARN]', msg),
      error: (msg) => console.log('[ERROR]', msg)
    }
  };
  
  const result = await signal.execute(context);
  
  clearTimeout(timeout);
  console.log('✅ SUCCESS: SmartWallet analysis completed');
  console.log('Confidence:', result.confidence);
  console.log('Processing time:', result.processingTime, 'ms');
  
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ Integration error:', error.message);
  console.log('Stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
}
