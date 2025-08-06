import { main, MemeDetectionSystem } from './system-main.js';

async function testSystemMain() {
  console.log('🧪 Testing System Main Orchestrator...');
  
  const system = new MemeDetectionSystem();
  
  try {
    // Test initialization
    console.log('1. Testing initialization...');
    await system.initialize();
    console.log('   ✅ Initialization successful');
    
    // Test health check
    console.log('2. Testing health check...');
    const health = system.getSystemHealth();
    console.log('   Health:', health.overall ? '✅ Healthy' : '❌ Unhealthy');
    
    // Test stats
    console.log('3. Testing stats...');
    const stats = system.getStats();
    console.log('   Stats available:', !!stats);
    
    // Cleanup
    console.log('4. Testing cleanup...');
    await system.shutdown();
    console.log('   ✅ Cleanup successful');
    
    console.log('\n🎉 System Main test completed successfully!');
    
  } catch (error) {
    console.error('❌ System Main test failed:', error.message);
    await system.cleanup();
    throw error;
  }
}

testSystemMain().catch(console.error);
