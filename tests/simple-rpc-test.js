import RPCConnectionManager from '../services/ideal-rpc-connection-manager.js';

console.log('🚀 Starting simple RPC test...');

try {
  console.log('📡 Creating RPC manager...');
  const rpcManager = new RPCConnectionManager();
  
  console.log('✅ RPC manager created successfully!');
  
  // Try one simple call
  console.log('🧪 Testing simple call...');
  const result = await rpcManager.call('getVersion');
  console.log('✅ Result:', result);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}

console.log('✅ Test complete - exiting...');
process.exit(0);