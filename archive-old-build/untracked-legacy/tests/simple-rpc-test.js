import RPCConnectionManager from '../core/rpc-connection-manager/index.js';

console.log('🚀 Starting simple RPC test...');

try {
  console.log('📡 Creating RPC manager...');
  const rpcManager = new RPCConnectionManager();
  
  console.log('✅ RPC manager created successfully!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}

console.log('✅ Test complete - exiting...');
process.exit(0);
