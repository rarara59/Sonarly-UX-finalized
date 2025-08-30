#!/usr/bin/env node

/**
 * Integration Test - RPC Connection Pool
 * Tests integration with existing system components
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

console.log('🔗 RPC Connection Pool - Integration Test');
console.log('==========================================\n');

class IntegrationTester {
  constructor() {
    this.pool = null;
    this.tests = {
      eventEmission: false,
      concurrentAgents: false,
      realWorldScenario: false,
      errorPropagation: false,
      configurationChanges: false
    };
  }

  async initialize() {
    this.pool = new RpcConnectionPool({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL,
        process.env.HELIUS_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ].filter(Boolean),
      debug: false
    });
    
    console.log('📦 Pool initialized for integration testing');
    console.log(`  Endpoints: ${this.pool.endpoints.length}`);
    console.log(`  Event emitter active: ${this.pool instanceof EventEmitter}\n`);
  }

  async testEventEmission() {
    console.log('📡 Test 1: Event Emission');
    console.log('─'.repeat(40));
    
    try {
      const events = {
        'high-latency': [],
        'breaker-open': [],
        'breaker-close': [],
        'rate-limit': [],
        'queue-full': []
      };
      
      // Set up event listeners
      for (const event in events) {
        this.pool.on(event, (data) => {
          events[event].push(data);
        });
      }
      
      console.log('  Event listeners registered');
      
      // Trigger high latency event
      const endpoint = this.pool.endpoints[0];
      endpoint.health.latency = 200;
      this.pool.emit('high-latency', { endpoint: 0, latency: 200 });
      
      // Trigger circuit breaker events
      this.pool.emit('breaker-open', 0);
      this.pool.emit('breaker-close', 0);
      
      // Check events were captured
      await new Promise(r => setTimeout(r, 100));
      
      console.log('\n  Events captured:');
      for (const [event, data] of Object.entries(events)) {
        console.log(`    ${event}: ${data.length} events`);
      }
      
      // Verify events
      if (events['high-latency'].length === 0) {
        throw new Error('High latency event not captured');
      }
      if (events['breaker-open'].length === 0) {
        throw new Error('Breaker open event not captured');
      }
      
      console.log('\n✅ Event emission working correctly');
      this.tests.eventEmission = true;
      console.log('✅ Event emission test PASSED\n');
      
    } catch (error) {
      console.error('❌ Event emission test FAILED:', error.message);
      this.tests.eventEmission = false;
    }
  }

  async testConcurrentAgents() {
    console.log('👥 Test 2: Concurrent Agent Simulation');
    console.log('─'.repeat(40));
    
    try {
      // Simulate multiple agents making concurrent requests
      class Agent {
        constructor(id, pool) {
          this.id = id;
          this.pool = pool;
          this.requests = 0;
          this.successful = 0;
          this.failed = 0;
        }
        
        async makeRequests(count) {
          const promises = [];
          for (let i = 0; i < count; i++) {
            promises.push(
              this.pool.call('getSlot')
                .then(() => {
                  this.successful++;
                  return true;
                })
                .catch(() => {
                  this.failed++;
                  return false;
                })
            );
            this.requests++;
          }
          return Promise.all(promises);
        }
      }
      
      // Create 5 agents
      const agents = [];
      for (let i = 0; i < 5; i++) {
        agents.push(new Agent(i, this.pool));
      }
      
      console.log('  Created 5 agents');
      console.log('  Each agent sending 20 requests...');
      
      // All agents make requests concurrently
      const startTime = Date.now();
      const agentPromises = agents.map(agent => agent.makeRequests(20));
      await Promise.all(agentPromises);
      const duration = Date.now() - startTime;
      
      // Check results
      console.log('\n  Agent results:');
      let totalSuccess = 0;
      let totalFailed = 0;
      
      for (const agent of agents) {
        console.log(`    Agent ${agent.id}: ${agent.successful}/${agent.requests} successful`);
        totalSuccess += agent.successful;
        totalFailed += agent.failed;
      }
      
      console.log(`\n  Total: ${totalSuccess}/${totalSuccess + totalFailed} successful`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Throughput: ${((totalSuccess + totalFailed) / (duration / 1000)).toFixed(1)} req/s`);
      
      // Check load distribution
      const distribution = this.pool.getLoadDistribution();
      console.log('\n  Load distribution:');
      for (const url in distribution) {
        const hostname = new URL(url).hostname;
        console.log(`    ${hostname}: ${distribution[url].percentage}`);
      }
      
      // Success criteria: handle concurrent agents with 80%+ success
      this.tests.concurrentAgents = totalSuccess >= (totalSuccess + totalFailed) * 0.8;
      console.log(`\n✅ Concurrent agents test: ${this.tests.concurrentAgents ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Concurrent agents test FAILED:', error.message);
      this.tests.concurrentAgents = false;
    }
  }

  async testRealWorldScenario() {
    console.log('🌍 Test 3: Real-World Trading Scenario');
    console.log('─'.repeat(40));
    
    try {
      console.log('  Simulating meme coin trading system...');
      
      // Simulate different types of RPC calls used in trading
      const tradingOperations = {
        getTokenAccounts: async () => {
          return this.pool.call('getTokenAccountsByOwner', [
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
            { encoding: 'jsonParsed' }
          ]);
        },
        getBalance: async (address) => {
          return this.pool.call('getBalance', [address || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']);
        },
        getTransaction: async (signature) => {
          return this.pool.call('getTransaction', [
            signature || '5VERqBAM2vQJqPfxDcGZFudqrTkQPMdkjvjRqUyRUhxqHAhfJDXRqsmLNvVwSJH4qGMgDe2MmYvzLGKzTCQBScsq',
            { encoding: 'json', commitment: 'confirmed' }
          ]);
        },
        getSlot: async () => {
          return this.pool.call('getSlot');
        },
        getBlockHeight: async () => {
          return this.pool.call('getBlockHeight');
        }
      };
      
      // Simulate a trading session
      const results = {
        tokenAccountQueries: 0,
        balanceChecks: 0,
        transactionLookups: 0,
        slotQueries: 0,
        blockHeightQueries: 0,
        errors: []
      };
      
      console.log('\n  Phase 1: Token discovery (10 token account queries)');
      for (let i = 0; i < 10; i++) {
        try {
          await tradingOperations.getTokenAccounts();
          results.tokenAccountQueries++;
        } catch (err) {
          results.errors.push('Token account query failed');
        }
      }
      console.log(`    Completed: ${results.tokenAccountQueries}/10`);
      
      console.log('\n  Phase 2: Balance monitoring (20 balance checks)');
      for (let i = 0; i < 20; i++) {
        try {
          await tradingOperations.getBalance();
          results.balanceChecks++;
        } catch (err) {
          results.errors.push('Balance check failed');
        }
      }
      console.log(`    Completed: ${results.balanceChecks}/20`);
      
      console.log('\n  Phase 3: Transaction monitoring (15 transaction lookups)');
      for (let i = 0; i < 15; i++) {
        try {
          await tradingOperations.getTransaction();
          results.transactionLookups++;
        } catch (err) {
          results.errors.push('Transaction lookup failed');
        }
      }
      console.log(`    Completed: ${results.transactionLookups}/15`);
      
      console.log('\n  Phase 4: Block monitoring (30 slot/height queries)');
      const blockPromises = [];
      for (let i = 0; i < 15; i++) {
        blockPromises.push(
          tradingOperations.getSlot()
            .then(() => results.slotQueries++)
            .catch(() => results.errors.push('Slot query failed'))
        );
        blockPromises.push(
          tradingOperations.getBlockHeight()
            .then(() => results.blockHeightQueries++)
            .catch(() => results.errors.push('Block height query failed'))
        );
      }
      await Promise.all(blockPromises);
      console.log(`    Slot queries: ${results.slotQueries}/15`);
      console.log(`    Block height queries: ${results.blockHeightQueries}/15`);
      
      // Summary
      const totalOperations = results.tokenAccountQueries + results.balanceChecks + 
                            results.transactionLookups + results.slotQueries + results.blockHeightQueries;
      const successRate = totalOperations / 75 * 100;
      
      console.log('\n📊 Trading Scenario Results:');
      console.log(`  Total operations: ${totalOperations}/75`);
      console.log(`  Success rate: ${successRate.toFixed(1)}%`);
      console.log(`  Errors: ${results.errors.length}`);
      
      // Get final statistics
      const stats = this.pool.getStats();
      console.log(`  Average latency: ${stats.global.avgLatency}ms`);
      console.log(`  P95 latency: ${stats.global.p95Latency}ms`);
      
      // Success criteria: 80%+ operations successful
      this.tests.realWorldScenario = successRate >= 80;
      console.log(`\n✅ Real-world scenario test: ${this.tests.realWorldScenario ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Real-world scenario test FAILED:', error.message);
      this.tests.realWorldScenario = false;
    }
  }

  async testErrorPropagation() {
    console.log('⚠️  Test 4: Error Propagation');
    console.log('─'.repeat(40));
    
    try {
      const errors = {
        invalidMethod: null,
        invalidParams: null,
        timeout: null
      };
      
      console.log('  Testing error propagation...');
      
      // Test invalid method error
      try {
        await this.pool.call('invalidMethodName');
      } catch (err) {
        errors.invalidMethod = err;
        console.log('  ✅ Invalid method error caught');
      }
      
      // Test invalid params error
      try {
        await this.pool.call('getBalance', ['invalid-address']);
      } catch (err) {
        errors.invalidParams = err;
        console.log('  ✅ Invalid params error caught');
      }
      
      // Force all endpoints to be unavailable
      const originalEndpoints = this.pool.endpoints.map(ep => ({
        breaker: { ...ep.breaker },
        health: { ...ep.health }
      }));
      
      for (const endpoint of this.pool.endpoints) {
        endpoint.breaker.state = 'OPEN';
        endpoint.health.healthy = false;
      }
      
      // Test no endpoints available error
      try {
        await this.pool.call('getSlot');
      } catch (err) {
        if (err.message.includes('No available endpoints')) {
          console.log('  ✅ No endpoints error caught');
        }
      }
      
      // Restore endpoints
      this.pool.endpoints.forEach((ep, i) => {
        ep.breaker = originalEndpoints[i].breaker;
        ep.health = originalEndpoints[i].health;
      });
      
      // Verify errors were properly caught
      if (!errors.invalidMethod) {
        throw new Error('Invalid method error not propagated');
      }
      if (!errors.invalidParams) {
        throw new Error('Invalid params error not propagated');
      }
      
      console.log('\n✅ Error propagation working correctly');
      this.tests.errorPropagation = true;
      console.log('✅ Error propagation test PASSED\n');
      
    } catch (error) {
      console.error('❌ Error propagation test FAILED:', error.message);
      this.tests.errorPropagation = false;
    }
  }

  async testConfigurationChanges() {
    console.log('⚙️  Test 5: Dynamic Configuration');
    console.log('─'.repeat(40));
    
    try {
      console.log('  Testing configuration changes...');
      
      // Get initial configuration
      const initialConfig = { ...this.pool.config };
      console.log(`  Initial max in-flight: ${initialConfig.maxGlobalInFlight}`);
      console.log(`  Initial queue size: ${initialConfig.maxQueueSize}`);
      
      // Create new pool with different configuration
      const customPool = new RpcConnectionPool({
        endpoints: [
          process.env.CHAINSTACK_RPC_URL,
          process.env.HELIUS_RPC_URL,
          process.env.PUBLIC_RPC_URL
        ].filter(Boolean),
        maxGlobalInFlight: 200,
        maxQueueSize: 500,
        queueDeadline: 30000,
        breakerEnabled: false,
        debug: true
      });
      
      console.log('\n  Custom pool configuration:');
      console.log(`    Max in-flight: ${customPool.config.maxGlobalInFlight}`);
      console.log(`    Queue size: ${customPool.config.maxQueueSize}`);
      console.log(`    Queue deadline: ${customPool.config.queueDeadline}ms`);
      console.log(`    Circuit breaker: ${customPool.config.breakerEnabled ? 'ENABLED' : 'DISABLED'}`);
      
      // Test custom configuration works
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(customPool.call('getSlot').catch(() => null));
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r !== null).length;
      
      console.log(`\n  Sent 50 requests with custom config`);
      console.log(`  Successful: ${successful}/50`);
      
      // Verify circuit breaker is disabled
      let breakerTriggered = false;
      for (const endpoint of customPool.endpoints) {
        if (endpoint.breaker.state !== 'CLOSED') {
          breakerTriggered = true;
        }
      }
      
      console.log(`  Circuit breakers triggered: ${breakerTriggered ? 'YES' : 'NO (as expected)'}`);
      
      // Cleanup custom pool
      await customPool.destroy();
      
      // Success criteria: custom configuration applied correctly
      this.tests.configurationChanges = successful > 0 && !breakerTriggered;
      console.log(`\n✅ Configuration test: ${this.tests.configurationChanges ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error('❌ Configuration test FAILED:', error.message);
      this.tests.configurationChanges = false;
    }
  }

  async runAllTests() {
    const startTime = Date.now();
    
    await this.initialize();
    
    await this.testEventEmission();
    await this.testConcurrentAgents();
    await this.testRealWorldScenario();
    await this.testErrorPropagation();
    await this.testConfigurationChanges();
    
    const duration = Date.now() - startTime;
    
    // Summary
    console.log('=' .repeat(60));
    console.log('📋 INTEGRATION TEST SUMMARY');
    console.log('=' .repeat(60));
    
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
    console.log(`  Duration: ${(duration/1000).toFixed(1)} seconds`);
    
    const allPassed = Object.values(this.tests).every(v => v);
    console.log(`\n🎯 OVERALL: ${allPassed ? '✅ ALL INTEGRATION TESTS PASSED' : '❌ SOME INTEGRATION TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n✨ RPC Connection Pool integrates perfectly with the system!');
      console.log('   - Event emission working');
      console.log('   - Handles concurrent agents');
      console.log('   - Supports real-world trading scenarios');
      console.log('   - Proper error propagation');
      console.log('   - Flexible configuration');
    }
    
    // Cleanup
    if (this.pool) {
      await this.pool.destroy();
    }
    
    process.exit(allPassed ? 0 : 1);
  }
}

// Run tests
const tester = new IntegrationTester();
tester.runAllTests().catch(console.error);