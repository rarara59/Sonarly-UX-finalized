import dotenv from 'dotenv';
dotenv.config();
import RPCConnectionManager from '../core/rpc-connection-manager/index.js';

async function testQueueSystem() {
  console.log('🧪 Testing queue system fix...');
  
  const rpc = new RPCConnectionManager();
  
  try {
    console.log('📞 Testing rpcManager.call() method...');
    console.log('🔍 Testing with Helius endpoint specifically...');
    const result = await rpc.call('getVersion', [], undefined, 'chainstack');
    console.log('✅ SUCCESS: Queue system working!');
    console.log('📊 Result:', result);
    
    await rpc.shutdown();
    console.log('🎉 Queue test successful!');
  } catch (error) {
    console.log('❌ Queue test failed:', error.message);
  }
}

testQueueSystem();