console.log('🧪 Testing RPC call...');

try {
  const { default: RPCConnectionManager } = await import('../core/rpc-connection-manager/index.js');
  
  console.log('📡 Creating RPC manager...');
  const rpcManager = new RPCConnectionManager();
  
  // Wait a moment for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('🔍 Testing getVersion call...');
  const version = await rpcManager.call('getVersion');
  console.log('✅ Version result:', version);
  
  console.log('🔍 Testing getEpochInfo call...');
  const epochInfo = await rpcManager.call('getEpochInfo');
  console.log('✅ Epoch info:', {
    epoch: epochInfo.epoch,
    slotIndex: epochInfo.slotIndex
  });
  
  console.log('🎉 All RPC calls successful!');
  
  // Clean shutdown
  await rpcManager.shutdown();
  
} catch (error) {
  console.error('❌ RPC call failed:', error.message);
}

process.exit(0);
