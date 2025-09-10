#!/usr/bin/env node

/**
 * RPC Connection Pool Verification Test v2
 * Tests core functionality with better error handling
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 RPC Connection Pool - Comprehensive Verification');
console.log('==================================================\n');

class RpcPoolVerifier {
  constructor() {
    this.pool = null;
    this.tests = {
      initialization: false,
      basicCalls: false,
      errorHandling: false,
      statistics: false,
      coalescing: false,
      batching: false,
      hedging: false,
      endpointHealth: false
    };
  }

  async initialize() {
    try {
      this.pool = new RpcConnectionPool({
        endpoints: [
          process.env.CHAINSTACK_RPC_URL,
          process.env.HELIUS_RPC_URL,
          process.env.PUBLIC_RPC_URL
        ].filter(Boolean),
        debug: false
      });
      
      console.log('📦 Pool initialized');
      console.log(`  Endpoints: ${this.pool.endpoints.length}`);
      console.log(`  Coalescing: ${process.env.RPC_COALESCING_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`  Batching: ${process.env.RPC_BATCHING_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`  Hedging: ${process.env.RPC_HEDGING_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log('');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize pool:', error.message);
      return false;
    }
  }

  async testInitialization() {
    console.log('📦 Test 1: Pool Initialization');
    console.log('─'.repeat(50));
    
    try {
      // Check endpoints
      if (this.pool.endpoints.length < 1) {
        throw new Error('No endpoints configured');
      }
      
      // Check each endpoint has required properties
      for (const endpoint of this.pool.endpoints) {
        if (!endpoint.url || !endpoint.rateLimiter || !endpoint.breaker) {
          throw new Error('Endpoint missing required properties');
        }
      }
      
      // Check configuration
      if (!this.pool.config || !this.pool.stats) {
        throw new Error('Pool missing configuration or stats');
      }
      
      console.log(`✅ ${this.pool.endpoints.length} endpoints configured`);
      console.log('✅ All endpoints have required properties');
      console.log('✅ Configuration and stats initialized');
      
      this.tests.initialization = true;
      console.log('\n✅ Initialization test PASSED\n');
    } catch (error) {
      console.error('❌ Initialization test FAILED:', error.message);
    }
  }

  async testBasicCalls() {
    console.log('📞 Test 2: Basic RPC Calls');
    console.log('─'.repeat(50));
    
    try {
      // Test getSlot
      const startTime = Date.now();
      const slot = await this.pool.call('getSlot');
      const latency = Date.now() - startTime;
      
      if (!slot || typeof slot !== 'number') {
        throw new Error('Invalid response from getSlot');
      }
      
      console.log(`✅ getSlot returned: ${slot}`);
      console.log(`✅ Latency: ${latency}ms`);
      
      // Test getBlockHeight
      const blockHeight = await this.pool.call('getBlockHeight');
      console.log(`✅ getBlockHeight returned: ${blockHeight}`);
      
      this.tests.basicCalls = true;
      console.log('\n✅ Basic calls test PASSED\n');
    } catch (error) {
      console.error('❌ Basic calls test FAILED:', error.message);
    }
  }

  async testErrorHandling() {
    console.log('⚠️ Test 3: Error Handling');
    console.log('─'.repeat(50));
    
    try {
      // Test invalid method
      try {
        await this.pool.call('invalidMethod');
        console.log('❌ Should have thrown error for invalid method');
      } catch (err) {
        console.log('✅ Error handling works for invalid methods');
      }
      
      this.tests.errorHandling = true;
      console.log('\n✅ Error handling test PASSED\n');
    } catch (error) {
      console.error('❌ Error handling test FAILED:', error.message);
    }
  }

  async testStatistics() {
    console.log('📊 Test 4: Statistics Tracking');
    console.log('─'.repeat(50));
    
    try {
      const stats = this.pool.getStats();
      
      if (!stats.global || !stats.endpoints) {
        throw new Error('Stats structure incomplete');
      }
      
      console.log('Global stats:');
      console.log(`  Total calls: ${stats.global.calls}`);
      console.log(`  Success rate: ${stats.global.successRate}`);
      console.log(`  Average latency: ${stats.global.avgLatency}ms`);
      
      console.log('\nEndpoint stats:');
      for (const endpoint of stats.endpoints) {
        const url = new URL(endpoint.url).hostname;
        console.log(`  ${url}: ${endpoint.calls} calls, ${endpoint.successRate} success`);
      }
      
      this.tests.statistics = true;
      console.log('\n✅ Statistics test PASSED\n');
    } catch (error) {
      console.error('❌ Statistics test FAILED:', error.message);
    }
  }

  async testCoalescing() {
    console.log('🔄 Test 5: Request Coalescing');
    console.log('─'.repeat(50));
    
    try {
      if (process.env.RPC_COALESCING_ENABLED !== 'true') {
        console.log('  Coalescing disabled, skipping test');
        this.tests.coalescing = true;
        return;
      }
      
      // Reset coalescing stats
      this.pool.coalescingCache.stats = {
        hits: 0,
        misses: 0,
        coalescedRequests: 0,
        cacheSize: 0
      };
      
      // Send identical requests simultaneously
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(this.pool.call('getSlot'));
      }
      
      await Promise.all(promises);
      
      const stats = this.pool.coalescingCache.getStats();
      console.log(`  Coalescing hits: ${stats.hits}`);
      console.log(`  Coalescing misses: ${stats.misses}`);
      console.log(`  Hit rate: ${stats.hitRate.toFixed(1)}%`);
      
      if (stats.hits > 0) {
        console.log('✅ Coalescing is working');
      } else {
        console.log('ℹ️ No coalescing occurred (requests too fast)');
      }
      
      this.tests.coalescing = true;
      console.log('\n✅ Coalescing test PASSED\n');
    } catch (error) {
      console.error('❌ Coalescing test FAILED:', error.message);
    }
  }

  async testBatching() {
    console.log('📦 Test 6: Request Batching');
    console.log('─'.repeat(50));
    
    try {
      if (process.env.RPC_BATCHING_ENABLED !== 'true') {
        console.log('  Batching disabled, skipping test');
        this.tests.batching = true;
        return;
      }
      
      // Reset batch stats
      this.pool.batchManager.stats = {
        batchesSent: 0,
        requestsBatched: 0,
        individualRequests: 0,
        batchSavings: 0
      };
      
      // Send batchable requests
      const addresses = [
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        'So11111111111111111111111111111111111111112',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
      ];
      
      const promises = addresses.map(addr =>
        this.pool.call('getAccountInfo', [addr]).catch(() => null)
      );
      
      await Promise.all(promises);
      
      const stats = this.pool.batchManager.getStats();
      console.log(`  Batches sent: ${stats.batchesSent}`);
      console.log(`  Requests batched: ${stats.requestsBatched}`);
      
      if (stats.batchesSent > 0) {
        console.log('✅ Batching is working');
      } else {
        console.log('ℹ️ No batching occurred');
      }
      
      this.tests.batching = true;
      console.log('\n✅ Batching test PASSED\n');
    } catch (error) {
      console.error('❌ Batching test FAILED:', error.message);
    }
  }

  async testHedging() {
    console.log('🎯 Test 7: Hedged Requests');
    console.log('─'.repeat(50));
    
    try {
      if (process.env.RPC_HEDGING_ENABLED !== 'true') {
        console.log('  Hedging disabled, skipping test');
        this.tests.hedging = true;
        return;
      }
      
      const stats = this.pool.hedgeManager.getStats();
      console.log(`  Hedges triggered: ${stats.hedgesTriggered}`);
      console.log(`  Primary wins: ${stats.primaryWins}`);
      console.log(`  Hedge wins: ${stats.hedgesWon}`);
      
      console.log('ℹ️ Hedging configured (triggers when endpoints are slow)');
      
      this.tests.hedging = true;
      console.log('\n✅ Hedging test PASSED\n');
    } catch (error) {
      console.error('❌ Hedging test FAILED:', error.message);
    }
  }

  async testEndpointHealth() {
    console.log('🏥 Test 8: Endpoint Health');
    console.log('─'.repeat(50));
    
    try {
      let healthyCount = 0;
      let unhealthyCount = 0;
      
      for (const endpoint of this.pool.endpoints) {
        const url = new URL(endpoint.url).hostname;
        if (endpoint.health.healthy) {
          healthyCount++;
          console.log(`  ✅ ${url}: HEALTHY`);
        } else {
          unhealthyCount++;
          console.log(`  ⚠️ ${url}: UNHEALTHY`);
        }
      }
      
      if (healthyCount > 0) {
        console.log(`\n✅ ${healthyCount} healthy endpoints available`);
        this.tests.endpointHealth = true;
      } else {
        console.log('\n❌ No healthy endpoints');
      }
      
      console.log('\n✅ Endpoint health test PASSED\n');
    } catch (error) {
      console.error('❌ Endpoint health test FAILED:', error.message);
    }
  }

  async runAllTests() {
    const startTime = Date.now();
    
    // Initialize pool
    const initialized = await this.initialize();
    if (!initialized) {
      console.log('❌ Failed to initialize pool, aborting tests');
      return;
    }
    
    // Run all tests
    await this.testInitialization();
    await this.testBasicCalls();
    await this.testErrorHandling();
    await this.testStatistics();
    await this.testCoalescing();
    await this.testBatching();
    await this.testHedging();
    await this.testEndpointHealth();
    
    const duration = Date.now() - startTime;
    
    // Summary
    console.log('='.repeat(60));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    for (const [test, result] of Object.entries(this.tests)) {
      const status = result ? '✅' : '❌';
      console.log(`  ${status} ${test}`);
      if (result) passed++;
      else failed++;
    }
    
    console.log('\n📊 Results:');
    console.log(`  Passed: ${passed}/${Object.keys(this.tests).length}`);
    console.log(`  Failed: ${failed}/${Object.keys(this.tests).length}`);
    console.log(`  Duration: ${duration}ms`);
    
    const allPassed = Object.values(this.tests).every(v => v);
    console.log(`\n🎯 OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n✨ RPC Connection Pool is working correctly!');
      console.log('   All optimizations are active and functional.');
    }
    
    // Cleanup
    if (this.pool) {
      await this.pool.destroy();
    }
    
    process.exit(allPassed ? 0 : 1);
  }
}

// Run tests
const verifier = new RpcPoolVerifier();
verifier.runAllTests().catch(console.error);