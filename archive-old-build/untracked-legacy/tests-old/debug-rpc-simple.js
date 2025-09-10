import rpcManager from './src/services/rpc-connection-manager.js';

async function debugRPC() {
  console.log('Starting simple RPC debug...');
  
  // Check if manager exists
  console.log('RPC Manager exists:', !!rpcManager);
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(rpcManager)).filter(name => name !== 'constructor'));
  
  // Check endpoint status
  console.log('Endpoint statuses:', rpcManager.getEndpointStatuses());
  
  // Try a simple call with timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Test timeout after 10 seconds')), 10000);
  });
  
  try {
    console.log('Attempting simple RPC call...');
    const result = await Promise.race([
      rpcManager.getAccountInfo('So11111111111111111111111111111111111111112', 1),
      timeoutPromise
    ]);
    console.log('✅ RPC call successful:', !!result);
  } catch (error) {
    console.log('❌ RPC call failed:', error.message);
  }
}

debugRPC();
