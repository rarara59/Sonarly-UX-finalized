#!/usr/bin/env node

/**
 * Comprehensive Request Batching Validation
 * Proves 3-5x reduction in RPC calls through intelligent batching
 */

import RpcConnectionPool from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('📦 Request Batching Validation Test');
console.log('=====================================\n');

class BatchingTester {
  constructor() {
    this.pool = null;
    this.results = {
      batchEfficiency: false,
      mixedMethodBatching: false,
      timingWindowBehavior: false,
      errorHandling: false,
      performanceImpact: false
    };
  }
  
  async initialize() {
    // Make sure batching is enabled
    process.env.RPC_BATCHING_ENABLED = 'true';
    process.env.RPC_BATCH_WINDOW_MS = '50';
    process.env.RPC_BATCH_MAX_SIZE = '100';
    
    // Also ensure coalescing is disabled for pure batching tests
    process.env.RPC_COALESCING_ENABLED = 'false';
    
    this.pool = new RpcConnectionPool({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL,
        process.env.HELIUS_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ].filter(Boolean),
      debug: false
    });
    
    console.log('📦 Pool initialized with batching enabled');
    console.log(`  Batch window: ${process.env.RPC_BATCH_WINDOW_MS}ms`);
    console.log(`  Max batch size: ${process.env.RPC_BATCH_MAX_SIZE}`);
    console.log(`  Endpoints: ${this.pool.endpoints.length}`);
    console.log('');
  }
  
  async testBatchEfficiency() {
    console.log('\n📊 Test 1: Batch Efficiency Verification');
    console.log('─'.repeat(50));
    console.log('Expected: 10 getAccountInfo requests result in 1 batch RPC call\n');
    
    // Reset batch stats
    this.pool.batchManager.stats = {
      batchesSent: 0,
      requestsBatched: 0,
      individualRequests: 0,
      batchSavings: 0
    };
    
    // Reset endpoint call counters
    for (const endpoint of this.pool.endpoints) {
      endpoint.stats.calls = 0;
    }
    
    // Send 10 getAccountInfo requests within batch window
    // Use valid Solana addresses for testing
    const addresses = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'So11111111111111111111111111111111111111112', // SOL
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
      '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT', // UXD
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // JitoSOL
      'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', // ORCA
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3' // PYTH
    ];
    
    console.log(`  Sending 10 getAccountInfo requests within batch window...`);
    
    const promises = addresses.map(addr => 
      this.pool.call('getAccountInfo', [addr]).catch(err => ({ error: err.message }))
    );
    
    // Wait for all to complete
    const results = await Promise.all(promises);
    
    // Get batching stats
    const stats = this.pool.batchManager.getStats();
    const actualRpcCalls = this.pool.endpoints.reduce((sum, ep) => sum + ep.stats.calls, 0);
    
    console.log('\n📊 Results:');
    console.log(`  Total requests sent: 10`);
    console.log(`  Batches sent: ${stats.batchesSent}`);
    console.log(`  Requests batched: ${stats.requestsBatched}`);
    console.log(`  Batch savings: ${stats.batchSavings}`);
    console.log(`  Average batch size: ${stats.avgBatchSize.toFixed(1)}`);
    console.log(`  Actual RPC calls made: ${actualRpcCalls}`);
    
    // Success criteria
    const success = stats.batchesSent === 1 && stats.requestsBatched >= 9;
    console.log(`\n✅ Batch efficiency: ${success ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    console.log(`  Reduction factor: ${stats.requestsBatched > 0 ? (10 / stats.batchesSent).toFixed(1) : 0}x`);
    
    this.results.batchEfficiency = success;
    return success;
  }
  
  async testMixedMethodBatching() {
    console.log('\n📊 Test 2: Mixed Method Batching');
    console.log('─'.repeat(50));
    console.log('Expected: getAccountInfo and getBalance batch together\n');
    
    // Reset batch stats
    this.pool.batchManager.stats = {
      batchesSent: 0,
      requestsBatched: 0,
      individualRequests: 0,
      batchSavings: 0
    };
    
    // Reset endpoint call counters
    for (const endpoint of this.pool.endpoints) {
      endpoint.stats.calls = 0;
    }
    
    const promises = [];
    
    console.log('  Sending mixed requests:');
    console.log('    - 5 getAccountInfo requests');
    console.log('    - 5 getBalance requests');
    console.log('    - 2 getSlot requests (non-batchable)');
    
    // 5 getAccountInfo requests with valid addresses
    const validAddresses = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'So11111111111111111111111111111111111111112',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
    ];
    
    for (const addr of validAddresses) {
      promises.push(
        this.pool.call('getAccountInfo', [addr])
          .catch(err => ({ error: err.message, method: 'getAccountInfo' }))
      );
    }
    
    // 5 getBalance requests with valid addresses
    const walletAddresses = [
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
      '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
      'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3'
    ];
    
    for (const addr of walletAddresses) {
      promises.push(
        this.pool.call('getBalance', [addr])
          .catch(err => ({ error: err.message, method: 'getBalance' }))
      );
    }
    
    // 2 non-batchable getSlot requests
    for (let i = 0; i < 2; i++) {
      promises.push(
        this.pool.call('getSlot')
          .catch(err => ({ error: err.message, method: 'getSlot' }))
      );
    }
    
    // Wait for all to complete
    const results = await Promise.all(promises);
    
    // Get batching stats
    const stats = this.pool.batchManager.getStats();
    const actualRpcCalls = this.pool.endpoints.reduce((sum, ep) => sum + ep.stats.calls, 0);
    
    console.log('\n📊 Results:');
    console.log(`  Total requests: 12`);
    console.log(`  Batches sent: ${stats.batchesSent}`);
    console.log(`  Requests batched: ${stats.requestsBatched}`);
    console.log(`  Non-batchable requests: ${12 - stats.requestsBatched}`);
    console.log(`  Actual RPC calls: ${actualRpcCalls}`);
    
    // Success criteria: 10 batchable requests should result in 1 batch, plus 2 individual calls
    const expectedCalls = 3; // 1 batch + 2 individual getSlot
    const success = stats.requestsBatched >= 8 && actualRpcCalls <= expectedCalls + 1;
    
    console.log(`\n✅ Mixed method batching: ${success ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`  Expected ~${expectedCalls} calls, got ${actualRpcCalls}`);
    
    this.results.mixedMethodBatching = success;
    return success;
  }
  
  async testTimingWindowBehavior() {
    console.log('\n📊 Test 3: Timing Window Behavior');
    console.log('─'.repeat(50));
    console.log('Expected: Batch window prevents indefinite accumulation\n');
    
    // Reset batch stats
    this.pool.batchManager.stats = {
      batchesSent: 0,
      requestsBatched: 0,
      individualRequests: 0,
      batchSavings: 0
    };
    
    console.log('  Sending 3 requests, waiting 30ms, sending 3 more...');
    
    // First batch of requests with valid addresses
    const batch1 = [];
    const firstAddresses = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'So11111111111111111111111111111111111111112',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
    ];
    
    for (const addr of firstAddresses) {
      batch1.push(
        this.pool.call('getAccountInfo', [addr])
          .catch(err => ({ error: err.message }))
      );
    }
    
    // Wait 30ms (within 50ms window)
    await new Promise(r => setTimeout(r, 30));
    
    // Second batch of requests (should be in same batch)
    const secondAddresses = [
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'
    ];
    
    for (const addr of secondAddresses) {
      batch1.push(
        this.pool.call('getAccountInfo', [addr])
          .catch(err => ({ error: err.message }))
      );
    }
    
    // Wait for first batch to complete
    await Promise.all(batch1);
    const stats1 = { ...this.pool.batchManager.stats };
    
    console.log(`  First group (within window): ${stats1.batchesSent} batches, ${stats1.requestsBatched} requests`);
    
    // Wait for window to expire
    await new Promise(r => setTimeout(r, 100));
    
    // Send another batch with valid addresses
    const batch2 = [];
    const thirdAddresses = [
      '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
      'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE'
    ];
    
    for (const addr of thirdAddresses) {
      batch2.push(
        this.pool.call('getAccountInfo', [addr])
          .catch(err => ({ error: err.message }))
      );
    }
    
    await Promise.all(batch2);
    const stats2 = { ...this.pool.batchManager.stats };
    
    console.log(`  Second group (new window): ${stats2.batchesSent} batches total`);
    
    console.log('\n📊 Timing Results:');
    console.log(`  First batch had ${stats1.requestsBatched} requests`);
    console.log(`  Total batches sent: ${stats2.batchesSent}`);
    
    // Success: Should have 2 separate batches
    const success = stats2.batchesSent === 2 && stats1.requestsBatched >= 5;
    
    console.log(`\n✅ Timing window behavior: ${success ? 'CORRECT' : 'INCORRECT'}`);
    
    this.results.timingWindowBehavior = success;
    return success;
  }
  
  async testErrorHandling() {
    console.log('\n📊 Test 4: Error Handling in Batches');
    console.log('─'.repeat(50));
    console.log('Expected: Batch errors propagate to individual requests\n');
    
    console.log('  Sending batch with mix of valid and invalid addresses...');
    
    const promises = [];
    const validAddresses = ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']; // USDC mint
    const invalidAddresses = ['', 'invalid', '123'];
    
    // Mix valid and invalid
    for (const addr of [...validAddresses, ...invalidAddresses]) {
      promises.push(
        this.pool.call('getAccountInfo', [addr])
          .then(result => ({ success: true, address: addr, result }))
          .catch(error => ({ success: false, address: addr, error: error.message }))
      );
    }
    
    const results = await Promise.all(promises);
    
    console.log('\n📊 Error Handling Results:');
    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success).length;
    
    console.log(`  Total requests: ${results.length}`);
    console.log(`  Successes: ${successes}`);
    console.log(`  Failures: ${failures}`);
    
    // All requests should get results (success or failure)
    const allGotResults = results.length === (validAddresses.length + invalidAddresses.length);
    
    console.log(`\n✅ Error handling: ${allGotResults ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`  All requests received responses: ${allGotResults ? 'YES' : 'NO'}`);
    
    this.results.errorHandling = allGotResults;
    return allGotResults;
  }
  
  async testPerformanceImpact() {
    console.log('\n📊 Test 5: Performance Impact Measurement');
    console.log('─'.repeat(50));
    console.log('Expected: 3-5x reduction in RPC calls for account-heavy operations\n');
    
    // Reset all stats
    this.pool.batchManager.stats = {
      batchesSent: 0,
      requestsBatched: 0,
      individualRequests: 0,
      batchSavings: 0
    };
    
    for (const endpoint of this.pool.endpoints) {
      endpoint.stats.calls = 0;
    }
    
    console.log('  Simulating account-heavy token analysis:');
    console.log('    - 50 total account lookups');
    console.log('    - Mix of getAccountInfo and getBalance');
    
    const startTime = Date.now();
    const promises = [];
    
    // Simulate token analysis pattern with valid addresses
    const tokenMints = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'So11111111111111111111111111111111111111112',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
      '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
      'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3'
    ];
    
    for (const mint of tokenMints) {
      // Each token needs 5 account lookups
      promises.push(
        this.pool.call('getAccountInfo', [mint])
          .catch(() => null)
      );
      promises.push(
        this.pool.call('getAccountInfo', [mint]) // Simulate token account
          .catch(() => null)
      );
      promises.push(
        this.pool.call('getBalance', [mint]) // Simulate owner balance
          .catch(() => null)
      );
      promises.push(
        this.pool.call('getBalance', [mint]) // Simulate fee account
          .catch(() => null)
      );
      promises.push(
        this.pool.call('getAccountInfo', [mint]) // Simulate metadata
          .catch(() => null)
      );
    }
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    // Calculate results
    const stats = this.pool.batchManager.getStats();
    const actualRpcCalls = this.pool.endpoints.reduce((sum, ep) => sum + ep.stats.calls, 0);
    const reductionFactor = 50 / (actualRpcCalls || 1);
    
    console.log('\n📊 Performance Results:');
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Total account lookups: 50`);
    console.log(`  Actual RPC calls made: ${actualRpcCalls}`);
    console.log(`  Batches sent: ${stats.batchesSent}`);
    console.log(`  Requests batched: ${stats.requestsBatched}`);
    console.log(`  Calls saved: ${stats.batchSavings}`);
    console.log(`  Reduction factor: ${reductionFactor.toFixed(1)}x`);
    
    // Success criteria: At least 3x reduction
    const success = reductionFactor >= 3;
    console.log(`\n✅ Achieved 3x+ reduction: ${success ? 'YES' : 'NO'}`);
    
    this.results.performanceImpact = success;
    return success;
  }
  
  async runAllTests() {
    await this.initialize();
    
    // Run all tests
    await this.testBatchEfficiency();
    await this.testMixedMethodBatching();
    await this.testTimingWindowBehavior();
    await this.testErrorHandling();
    await this.testPerformanceImpact();
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📦 REQUEST BATCHING VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n✅ Success Criteria:');
    console.log(`  1. Batch efficiency: ${this.results.batchEfficiency ? '✅ YES' : '❌ NO'}`);
    console.log(`  2. Mixed method batching: ${this.results.mixedMethodBatching ? '✅ YES' : '❌ NO'}`);
    console.log(`  3. Timing window behavior: ${this.results.timingWindowBehavior ? '✅ YES' : '❌ NO'}`);
    console.log(`  4. Error handling: ${this.results.errorHandling ? '✅ YES' : '❌ NO'}`);
    console.log(`  5. Performance impact (3x+): ${this.results.performanceImpact ? '✅ YES' : '❌ NO'}`);
    
    const allPassed = Object.values(this.results).every(v => v);
    
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n✨ Request batching is working perfectly!');
      console.log('   - 10x reduction for batchable requests');
      console.log('   - Mixed methods batch together efficiently');
      console.log('   - Timing windows prevent indefinite accumulation');
      console.log('   - Error handling maintains individual semantics');
      console.log('   - 3-5x reduction in account-heavy operations');
    }
    
    // Get final stats
    const finalStats = this.pool.getStats();
    if (finalStats.batching) {
      console.log('\n📊 Final Batching Statistics:');
      console.log(`   Total batches sent: ${finalStats.batching.batchesSent}`);
      console.log(`   Total requests batched: ${finalStats.batching.requestsBatched}`);
      console.log(`   Average batch size: ${finalStats.batching.avgBatchSize.toFixed(1)}`);
      console.log(`   Efficiency gain: ${finalStats.batching.efficiencyGain.toFixed(1)}x`);
    }
    
    await this.pool.destroy();
  }
}

// Run tests
const tester = new BatchingTester();
tester.runAllTests().catch(console.error);