import { SmartWalletSignalJS } from './src/signal-modules/smart-wallet-signal.module.js';
import rpcManager from './src/services/rpc-connection-manager.js';

console.log('Testing SmartWalletSignalJS with real RPC manager...');

// Check RPC manager status
console.log('RPC Manager endpoints:', rpcManager.getEndpointStatuses());

const signal = new SmartWalletSignalJS();

const context = {
  tokenAddress: '11111111111111111111111111111112', // System program address (safe test)
  rpcManager: rpcManager,  // Use the real RPC manager
  logger: {
    info: (msg) => console.log('[INFO]', msg),
    warn: (msg) => console.log('[WARN]', msg),
    error: (msg) => console.log('[ERROR]', msg)
  }
};

const timeout = setTimeout(() => {
  console.log('TIMEOUT: Test hung after 20 seconds');
  process.exit(1);
}, 20000);

try {
  console.log('Starting SmartWalletSignalJS execution...');
  const result = await signal.execute(context);
  clearTimeout(timeout);
  console.log('SUCCESS: Individual analysis completed');
  console.log('Confidence:', result.confidence);
  console.log('Processing time:', result.processingTime, 'ms');
  console.log('Active endpoints:', rpcManager.getEndpointStatuses().filter(e => e.active).length);
} catch (error) {
  clearTimeout(timeout);
  console.log('ERROR:', error.message);
  console.log('Stack:', error.stack);
}
