#!/usr/bin/env node

/**
 * Test monitor validation and telemetry in RPC Connection Pool V2
 */

import RpcConnectionPoolV2 from '../src/detection/transport/rpc-connection-pool-v2.js';

console.log('🔍 Monitor Validation Test');
console.log('==========================\n');

// Test 1: Valid monitor
console.log('✅ Test 1: Valid monitor with all required methods');
try {
  const validMonitor = {
    recordLatency: (method, latency, endpoint) => {
      console.log(`  Telemetry: ${method} took ${latency}ms on ${new URL(endpoint).hostname}`);
    },
    recordError: (method, error, endpoint) => {
      console.log(`  Telemetry: ${method} failed on ${endpoint}: ${error.message}`);
    },
    recordSuccess: (method, endpoint) => {
      console.log(`  Telemetry: ${method} succeeded on ${new URL(endpoint).hostname}`);
    },
    check: async () => {
      return true;
    }
  };
  
  const pool = new RpcConnectionPoolV2({ monitor: validMonitor });
  console.log('  ✅ Valid monitor accepted');
  
  // Test a call to see telemetry
  const result = await pool.call('getSlot');
  console.log(`  Result: Slot ${result}`);
  
  await pool.destroy();
} catch (error) {
  console.log(`  ❌ Unexpected error: ${error.message}`);
}

console.log('\n❌ Test 2: Invalid monitor missing required method');
try {
  const invalidMonitor = {
    recordLatency: () => {},
    // Missing recordError and recordSuccess
  };
  
  const pool = new RpcConnectionPoolV2({ monitor: invalidMonitor });
  console.log('  ❌ Should have thrown error');
  await pool.destroy();
} catch (error) {
  console.log(`  ✅ Correctly rejected: ${error.message}`);
}

console.log('\n❌ Test 3: Invalid monitor with non-function method');
try {
  const invalidMonitor = {
    recordLatency: () => {},
    recordError: 'not a function', // Invalid type
    recordSuccess: () => {}
  };
  
  const pool = new RpcConnectionPoolV2({ monitor: invalidMonitor });
  console.log('  ❌ Should have thrown error');
  await pool.destroy();
} catch (error) {
  console.log(`  ✅ Correctly rejected: ${error.message}`);
}

console.log('\n✅ Test 4: Monitor with optional check method');
try {
  const monitorWithCheck = {
    recordLatency: () => {},
    recordError: () => {},
    recordSuccess: () => {},
    check: async () => {
      console.log('  Monitor health check called');
      return { status: 'healthy', timestamp: Date.now() };
    }
  };
  
  const pool = new RpcConnectionPoolV2({ monitor: monitorWithCheck });
  console.log('  ✅ Monitor with check method accepted');
  
  const health = await pool.checkHealth();
  console.log(`  Health check result: ${health.healthy ? 'healthy' : 'unhealthy'}`);
  console.log(`  Monitor status:`, health.monitorStatus);
  
  await pool.destroy();
} catch (error) {
  console.log(`  ❌ Unexpected error: ${error.message}`);
}

console.log('\n❌ Test 5: Invalid check method return type');
try {
  const invalidCheckMonitor = {
    recordLatency: () => {},
    recordError: () => {},
    recordSuccess: () => {},
    check: () => 'invalid return type' // Should return Promise or boolean
  };
  
  const pool = new RpcConnectionPoolV2({ monitor: invalidCheckMonitor });
  console.log('  ❌ Should have thrown error');
  await pool.destroy();
} catch (error) {
  console.log(`  ✅ Correctly rejected: ${error.message}`);
}

console.log('\n✅ Test 6: No monitor (should work without telemetry)');
try {
  const pool = new RpcConnectionPoolV2(); // No monitor
  console.log('  ✅ Pool created without monitor');
  
  const result = await pool.call('getSlot');
  console.log(`  Result: Slot ${result} (no telemetry recorded)`);
  
  await pool.destroy();
  console.log('  ✅ Works correctly without monitor');
} catch (error) {
  console.log(`  ❌ Unexpected error: ${error.message}`);
}

console.log('\n✅ Monitor validation complete!');