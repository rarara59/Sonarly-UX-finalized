import { SmartWalletSignalJS } from './src/signal-modules/smart-wallet-signal.module.js';
import rpcManager from './src/services/rpc-connection-manager.js';

console.log('=== DEBUGGING SmartWalletSignalJS ===');

// Step 1: Check RPC manager initialization
console.log('Step 1: Checking RPC manager...');
const endpoints = rpcManager.getEndpointStatuses();
console.log('Active endpoints:', endpoints.filter(e => e.active).map(e => e.name));

// Step 2: Initialize signal
console.log('Step 2: Initializing SmartWalletSignalJS...');
const signal = new SmartWalletSignalJS();
console.log('Signal initialized successfully');

// Step 3: Set up context with logging
console.log('Step 3: Setting up context...');
const context = {
  tokenAddress: '11111111111111111111111111111112',
  rpcManager: rpcManager,
  logger: {
    info: (msg) => console.log('[INFO]', msg),
    warn: (msg) => console.log('[WARN]', msg),
    error: (msg) => console.log('[ERROR]', msg)
  }
};

// Step 4: Add timeout with more specific location tracking
console.log('Step 4: Starting execution with timeout...');
const timeout = setTimeout(() => {
  console.log('❌ TIMEOUT: Process hung after 15 seconds');
  console.log('Last successful step was logged above');
  process.exit(1);
}, 15000);

try {
  console.log('Calling signal.execute()...');
  const result = await signal.execute(context);
  
  clearTimeout(timeout);
  console.log('✅ SUCCESS: Analysis completed');
  console.log('Confidence:', result.confidence);
  console.log('Processing time:', result.processingTime, 'ms');
  
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ ERROR:', error.message);
  console.log('Stack trace:', error.stack);
}
