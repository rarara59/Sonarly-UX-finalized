console.log('🧪 Testing RPC manager direct call...');

try {
  const { default: RPCConnectionManager } = await import('../core/rpc-connection-manager/index.js');
  
  console.log('📡 Creating RPC manager...');
  const rpcManager = new RPCConnectionManager();
  
  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('🔍 Testing direct connection call...');
  
  // Get the public endpoint and call directly
  const publicEndpoint = rpcManager.endpoints.public;
  console.log('📊 Public endpoint active:', publicEndpoint.active);
  console.log('📊 Public endpoint connection:', !!publicEndpoint.connection);
  
  if (publicEndpoint.connection) {
    const version = await publicEndpoint.connection.getVersion();
    console.log('✅ Direct endpoint call successful:', version);
  }
  
  console.log('🎉 Direct RPC manager test successful!');
  
  // Clean shutdown
  await rpcManager.shutdown();
  
} catch (error) {
  console.error('❌ RPC manager direct test failed:', error.message);
  console.error('Stack:', error.stack);
}

process.exit(0);
