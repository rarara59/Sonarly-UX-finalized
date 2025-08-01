/**
 * TEST SCRIPT FOR IDEAL RPC CONNECTION MANAGER
 * 
 * Save as: src/tests/test-ideal-rpc-manager.js
 * Run with: npm run test:ideal-rpc
 */

import dotenv from 'dotenv';
import RPCConnectionManager from '../core/rpc-connection-manager/index.js';

// Load environment variables
dotenv.config();

async function testIdealRPCManager() {
  console.log('🚀 Testing Ideal RPC Connection Manager...\n');
  
  let rpcManager;
  
  try {
    // Initialize the RPC manager
    console.log('📡 Initializing RPC Connection Manager...');
    rpcManager = new RPCConnectionManager();
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ RPC Manager initialized successfully!\n');
    
    // Test 1: Basic RPC call
    console.log('🧪 Test 1: Basic RPC call (getVersion)...');
    try {
      const version = await rpcManager.call('getVersion');
      console.log('✅ getVersion result:', version);
    } catch (error) {
      console.log('❌ getVersion failed:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Solana-specific call
    console.log('\n🧪 Test 2: Solana call (getEpochInfo)...');
    try {
      const epochInfo = await rpcManager.call('getEpochInfo');
      console.log('✅ getEpochInfo result:', {
        epoch: epochInfo.epoch,
        slotIndex: epochInfo.slotIndex,
        slotsInEpoch: epochInfo.slotsInEpoch
      });
    } catch (error) {
      console.log('❌ getEpochInfo failed:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Account info call
    console.log('\n🧪 Test 3: Account info (SOL mint)...');
    try {
      const solMint = 'So11111111111111111111111111111111111111112';
      const accountInfo = await rpcManager.call('getAccountInfo', [solMint]);
      console.log('✅ SOL mint account info:', {
        owner: accountInfo?.owner,
        lamports: accountInfo?.lamports,
        dataLength: accountInfo?.data?.length
      });
    } catch (error) {
      console.log('❌ getAccountInfo failed:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Check endpoint health
    console.log('\n🧪 Test 4: Endpoint health check...');
    const endpointStatuses = rpcManager.getEndpointStatuses();
    console.log('✅ Endpoint statuses:');
    for (const [name, status] of Object.entries(endpointStatuses)) {
      console.log(`  ${name}: health=${status.health}, active=${status.active}, calls=${status.callCount}`);
    }
    
    // Test 5: Performance stats
    console.log('\n🧪 Test 5: Performance statistics...');
    const perfStats = rpcManager.getPerformanceStats();
    console.log('✅ Performance stats:', {
      cacheSize: perfStats.cache.cacheSize,
      memoryUsage: perfStats.memory.current.heapUsed + 'MB',
      activeConnections: perfStats.connections.totals.active,
      wsConnections: perfStats.webSocket.overview.activeConnections
    });
    
    // Test 6: WebSocket functionality (if Helius key available)
    if (process.env.HELIUS_API_KEY) {
      console.log('\n🧪 Test 6: WebSocket subscription test...');
      try {
        const subscriptionId = await rpcManager.subscribeToAccountChanges(
          '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8' // Raydium program
        );
        console.log('✅ WebSocket subscription created:', subscriptionId);
        
        // Listen for LP events for 10 seconds
        console.log('👂 Listening for LP events for 10 seconds...');
        
        let eventCount = 0;
        const eventListener = (data) => {
          eventCount++;
          console.log(`📊 LP Event #${eventCount}:`, {
            tokenAddress: data.event?.tokenAddress,
            lpValueUSD: data.event?.lpValueUSD,
            dex: data.event?.dex
          });
        };
        
        rpcManager.on('lpEvent', eventListener);
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        rpcManager.off('lpEvent', eventListener);
        console.log(`✅ WebSocket test complete. Received ${eventCount} events.`);
        
      } catch (error) {
        console.log('❌ WebSocket test failed:', error.message);
      }
    } else {
      console.log('\n⚠️ Test 6: Skipped (no HELIUS_API_KEY)');
    }
    
    // Test 7: Memory monitoring
    console.log('\n🧪 Test 7: Memory monitoring...');
    const memoryStats = rpcManager.memoryMonitor.getMemoryStats();
    console.log('✅ Memory stats:', {
      heapUsed: memoryStats.current.heapUsed + 'MB',
      heapTotal: memoryStats.current.heapTotal + 'MB',
      rss: memoryStats.current.rss + 'MB',
      gcCount: memoryStats.stats.gcCount
    });
    
    // Test 8: Metrics endpoint
    console.log('\n🧪 Test 8: Metrics endpoint...');
    try {
      const response = await fetch('http://localhost:9090/health');
      if (response.ok) {
        const healthData = await response.json();
        console.log('✅ Health endpoint working:', {
          status: healthData.status,
          uptime: Math.round(healthData.uptime) + 's',
          endpoints: Object.keys(healthData.endpoints).length
        });
        
        console.log('📊 Prometheus metrics available at: http://localhost:9090/metrics');
      } else {
        console.log('❌ Health endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Metrics endpoint test failed:', error.message);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📊 Final Performance Summary:');
    const finalStats = rpcManager.getPerformanceStats();
    console.log({
      totalCalls: Object.values(rpcManager.getEndpointStatuses()).reduce((sum, ep) => sum + ep.callCount, 0),
      cacheHits: finalStats.cache.cacheSize,
      memoryUsage: finalStats.memory.current.heapUsed + 'MB',
      activeEndpoints: Object.values(rpcManager.getEndpointStatuses()).filter(ep => ep.active).length,
      healthyEndpoints: Object.values(rpcManager.getEndpointStatuses()).filter(ep => ep.health > 50).length
    });
    
  } catch (error) {
    console.error('💥 Critical error during testing:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean shutdown
    if (rpcManager) {
      console.log('\n🔄 Shutting down RPC Manager...');
      try {
        await rpcManager.shutdown();
        console.log('✅ Shutdown complete');
      } catch (error) {
        console.error('❌ Shutdown error:', error.message);
      }
    }
    
    // Exit process
    setTimeout(() => {
      console.log('👋 Test complete. Exiting...');
      process.exit(0);
    }, 1000);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Exiting...');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run the test
testIdealRPCManager().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});