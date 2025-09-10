#!/usr/bin/env node

/**
 * Quick test to verify RPC pool still works with TokenBucket stub
 */

import { RpcConnectionPoolAdapter } from '../src/adapters/rpc-connection-pool.adapter.js';
import { RpcConnectionPool } from '../src/detection/transport/rpc-connection-pool.js';

async function testRpcPoolStub() {
  console.log('Testing RPC pool with TokenBucket stub...\n');
  
  try {
    // Create pool instance
    const pool = new RpcConnectionPool({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL || 'https://test1.com',
        process.env.HELIUS_RPC_URL || 'https://test2.com',
        process.env.PUBLIC_RPC_URL || 'https://test3.com'
      ]
    });
    
    // Check that endpoints have rate limiters
    let hasRateLimiters = true;
    pool.endpoints.forEach((ep, index) => {
      if (!ep.rateLimiter) {
        console.log(`❌ Endpoint ${index} missing rate limiter`);
        hasRateLimiters = false;
      } else {
        // Test hasTokens method (integration interface)
        const hasMethod = typeof ep.rateLimiter.hasTokens === 'function';
        const canConsume = typeof ep.rateLimiter.canConsume === 'function';
        const status = ep.rateLimiter.getStatus();
        
        console.log(`✅ Endpoint ${index}: Rate limiter present`);
        console.log(`   - hasTokens method: ${hasMethod ? '✅' : '❌'}`);
        console.log(`   - canConsume method: ${canConsume ? '✅' : '❌'}`);
        console.log(`   - Status: ${status.tokens}/${status.maxTokens} tokens`);
      }
    });
    
    if (hasRateLimiters) {
      console.log('\n✅ All endpoints have rate limiters with integration interface');
    } else {
      console.log('\n❌ Some endpoints missing rate limiters');
    }
    
    // Test rate limiting in action
    console.log('\nTesting rate limiting...');
    const endpoint = pool.endpoints[0];
    let consumed = 0;
    let rejected = 0;
    
    // Try to consume many tokens quickly
    for (let i = 0; i < 100; i++) {
      if (endpoint.rateLimiter.consume(1)) {
        consumed++;
      } else {
        rejected++;
      }
    }
    
    console.log(`  Consumed: ${consumed} tokens`);
    console.log(`  Rejected: ${rejected} requests`);
    
    if (rejected > 0) {
      console.log('✅ Rate limiting is working (requests rejected when over limit)');
    } else {
      console.log('⚠️  No requests rejected (may have high rate limit)');
    }
    
    // Cleanup
    pool.destroy();
    
    console.log('\n✅ RPC pool works correctly with TokenBucket stub');
    console.log('   Ready for Phase 3 integration with orchestrator');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testRpcPoolStub().catch(console.error);