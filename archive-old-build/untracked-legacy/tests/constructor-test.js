console.log('🧪 Testing RPC Manager constructor...');

try {
  const { default: RPCConnectionManager } = await import('../core/rpc-connection-manager/index.js');
  console.log('✅ Import successful!');
  
  console.log('📡 Creating RPC manager...');
  const rpcManager = new RPCConnectionManager();
  console.log('✅ RPC manager created successfully!');
  
  console.log('🔍 RPC manager type:', typeof rpcManager);
  console.log('📊 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(rpcManager)).slice(0, 5));
  
  console.log('✅ Constructor test complete!');
  
} catch (error) {
  console.error('❌ Constructor failed:', error.message);
  console.error('Stack:', error.stack);
}

process.exit(0);
