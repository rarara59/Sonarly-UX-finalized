// test-rpc-integration.js
async function testRPCIntegration() {
  console.log('🧪 TEST 4: RPC Integration');
  
  // Import your RPC manager
  const RPCConnectionManager = (await import('../core/rpc-connection-manager/index.js')).default;
  
  try {
    const rpcManager = new RPCConnectionManager();
    
    // Test basic connectivity
    const slot = await rpcManager.call('getSlot', []);
    console.log('✅ RPC Connected - Current slot:', slot);
    
    // Test token validation call
    const solTokenInfo = await rpcManager.call('getTokenSupply', ['So11111111111111111111111111111111111111112']);
    console.log('✅ Token supply call works:', solTokenInfo ? 'Success' : 'Failed');
    
    return true;
  } catch (error) {
    console.error('❌ RPC Integration failed:', error.message);
    return false;
  }
}

testRPCIntegration();