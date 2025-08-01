import { FastSmartWalletSignalJS } from './src/signal-modules/fast-smart-wallet-signal.js';
import rpcManager from './src/services/working-rpc-manager.js';

console.log('=== TESTING FAST SMARTWALLET ===');

const timeout = setTimeout(() => {
  console.log('❌ Fast SmartWallet test hung');
  process.exit(1);
}, 10000);

try {
  console.log('1. Creating fast SmartWallet...');
  const signal = new FastSmartWalletSignalJS();
  console.log('✅ Fast SmartWallet created');
  
  console.log('2. Testing execution...');
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
  console.log('✅ SUCCESS: Fast SmartWallet completed');
  console.log('Confidence:', result.confidence);
  console.log('Processing time:', result.processingTime, 'ms');
  console.log('Active wallets:', result.data.overlapCount);
  console.log('Tier breakdown:', `T1:${result.data.tier1Count} T2:${result.data.tier2Count} T3:${result.data.tier3Count}`);
  
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ Fast SmartWallet error:', error.message);
}
