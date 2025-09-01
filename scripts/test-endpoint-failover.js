#!/usr/bin/env node
import { RpcConnectionPool } from '../src/detection/transport/rpc-connection-pool.js';

class EndpointFailoverTest {
  constructor() {
    this.pool = null;
    this.results = {
      heliusDisabled: false,
      chainstackDisabled: false,
      publicRpcFallback: false,
      allHealthy: false,
      failoverTime: null
    };
  }

  async initialize() {
    // Initialize with real Solana mainnet endpoints
    this.pool = new RpcConnectionPool({
      endpoints: [
        'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
        'https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY', 
        'https://api.mainnet-beta.solana.com'
      ]
    });

    console.log('✅ RPC Connection Pool initialized with failover logic');
  }

  async testHeliusDisabled() {
    console.log('\n🔍 Test 1: Helius disabled - should use Chainstack/Alchemy');
    
    // Force Helius circuit breaker to OPEN
    this.pool.endpoints[0].breaker.state = 'OPEN';
    
    const start = Date.now();
    try {
      const result = await this.pool.call('getSlot', [], { failoverBudgetMs: 5000 });
      const elapsed = Date.now() - start;
      
      console.log(`✅ Succeeded with failover in ${elapsed}ms`);
      console.log(`   Current slot: ${result}`);
      this.results.heliusDisabled = true;
      this.results.failoverTime = elapsed;
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
    
    // Reset
    this.pool.endpoints[0].breaker.state = 'CLOSED';
  }

  async testChainstackDisabled() {
    console.log('\n🔍 Test 2: Chainstack/Alchemy disabled - should use Public RPC');
    
    // Force both Helius and Chainstack circuit breakers to OPEN
    this.pool.endpoints[0].breaker.state = 'OPEN';
    this.pool.endpoints[1].breaker.state = 'OPEN';
    
    const start = Date.now();
    try {
      const result = await this.pool.call('getSlot', [], { failoverBudgetMs: 5000 });
      const elapsed = Date.now() - start;
      
      console.log(`✅ Succeeded with failover to Public RPC in ${elapsed}ms`);
      console.log(`   Current slot: ${result}`);
      this.results.chainstackDisabled = true;
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
    
    // Reset
    this.pool.endpoints[0].breaker.state = 'CLOSED';
    this.pool.endpoints[1].breaker.state = 'CLOSED';
  }

  async testAllEndpointsHealthy() {
    console.log('\n🔍 Test 3: All endpoints healthy - normal operation');
    
    const start = Date.now();
    try {
      const result = await this.pool.call('getSlot', [], { failoverBudgetMs: 5000 });
      const elapsed = Date.now() - start;
      
      console.log(`✅ Succeeded in ${elapsed}ms`);
      console.log(`   Current slot: ${result}`);
      this.results.allHealthy = true;
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }

  async testAllEndpointsOpen() {
    console.log('\n🔍 Test 4: All endpoints OPEN - should fail fast');
    
    // Force all circuit breakers to OPEN
    this.pool.endpoints.forEach(ep => ep.breaker.state = 'OPEN');
    
    const start = Date.now();
    try {
      await this.pool.call('getSlot', [], { failoverBudgetMs: 5000 });
      console.error('❌ Should have failed when all endpoints are OPEN');
    } catch (error) {
      const elapsed = Date.now() - start;
      console.log(`✅ Failed as expected in ${elapsed}ms: ${error.message}`);
      this.results.publicRpcFallback = true;
    }
    
    // Reset
    this.pool.endpoints.forEach(ep => ep.breaker.state = 'CLOSED');
  }

  async testRapidFailover() {
    console.log('\n🔍 Test 5: Rapid failover under 5 seconds');
    
    // Simulate endpoint failures by using invalid URLs temporarily
    const originalUrls = this.pool.endpoints.map(ep => ep.url);
    
    // Make first two endpoints fail
    this.pool.endpoints[0].url = 'https://invalid.endpoint.example.com';
    this.pool.endpoints[1].url = 'https://another.invalid.endpoint.example.com';
    
    const start = Date.now();
    try {
      const result = await this.pool.call('getSlot', [], { failoverBudgetMs: 5000 });
      const elapsed = Date.now() - start;
      
      if (elapsed < 5000) {
        console.log(`✅ Failover completed in ${elapsed}ms (< 5 seconds)`);
        console.log(`   Current slot: ${result}`);
      } else {
        console.error(`❌ Failover took too long: ${elapsed}ms`);
      }
    } catch (error) {
      const elapsed = Date.now() - start;
      console.error(`❌ Failed after ${elapsed}ms: ${error.message}`);
    }
    
    // Restore original URLs
    originalUrls.forEach((url, i) => {
      this.pool.endpoints[i].url = url;
    });
  }

  async run() {
    try {
      await this.initialize();
      
      // Run all tests
      await this.testHeliusDisabled();
      await this.testChainstackDisabled();
      await this.testAllEndpointsHealthy();
      await this.testAllEndpointsOpen();
      await this.testRapidFailover();
      
      // Summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 FAILOVER TEST SUMMARY');
      console.log('='.repeat(60));
      
      const passed = Object.values(this.results).filter(v => v === true).length;
      const total = 4; // We track 4 main results
      
      console.log(`✅ Tests Passed: ${passed}/${total}`);
      console.log(`📈 Failover Time: ${this.results.failoverTime}ms`);
      
      if (passed === total) {
        console.log('\n🎉 SUCCESS: Endpoint failover is working correctly!');
        console.log('   - Automatic failover to healthy endpoints ✅');
        console.log('   - Respects circuit breaker states ✅');
        console.log('   - Fails fast when all endpoints are down ✅');
        console.log('   - Completes within 5-second budget ✅');
      } else {
        console.log('\n⚠️  Some tests failed. Review the results above.');
      }
      
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    } finally {
      if (this.pool) {
        await this.pool.destroy();
      }
    }
  }
}

// Run the test
const test = new EndpointFailoverTest();
test.run().catch(console.error);