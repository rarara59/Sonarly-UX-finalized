#!/usr/bin/env node

/**
 * Verify endpoint rotation improvements
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

console.log('🧪 VERIFYING ENDPOINT ROTATION IMPROVEMENTS');
console.log('📍 Testing automatic endpoint rotation on RPC failures\n');

// Mock RPC Manager that simulates failures and tracks rotations
class MockRpcManager {
    constructor() {
        this.endpoints = ['primary', 'secondary', 'tertiary'];
        this.currentIndex = 0;
        this.rotationCount = 0;
        this.callCount = 0;
        this.failUntilRotation = 2; // Fail first 2 calls per endpoint
    }
    
    getCurrentEndpoint() {
        return this.endpoints[this.currentIndex];
    }
    
    async rotateEndpoint() {
        this.rotationCount++;
        this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
        this.failUntilRotation = 2; // Reset fail counter for new endpoint
        console.log(`  🔄 Rotated to endpoint: ${this.getCurrentEndpoint()} (rotation #${this.rotationCount})`);
    }
    
    async call(method, params) {
        this.callCount++;
        
        // Simulate failures until rotation
        if (this.failUntilRotation > 0) {
            this.failUntilRotation--;
            throw new Error(`RPC call failed on ${this.getCurrentEndpoint()}`);
        }
        
        // Success after rotation
        if (method === 'getTokenSupply') {
            return {
                value: {
                    amount: '1000000000',
                    decimals: 9,
                    uiAmount: 1.0
                }
            };
        }
        
        if (method === 'getTokenLargestAccounts') {
            return {
                value: [{
                    address: 'holder1',
                    amount: '100000000'
                }]
            };
        }
    }
}

async function testEndpointRotation() {
    console.log('--- Testing Endpoint Rotation on Failures ---\n');
    
    const mockRpc = new MockRpcManager();
    const filter = new TieredTokenFilterService({ rpcManager: mockRpc });
    
    console.log(`Starting endpoint: ${mockRpc.getCurrentEndpoint()}`);
    console.log('Simulating RPC failures that trigger rotation...\n');
    
    const startTime = Date.now();
    const result = await filter.validateTokenWithRetry('testtoken123', 'both', 5);
    const elapsedTime = Date.now() - startTime;
    
    console.log(`\n📊 Results:`);
    console.log(`  Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Total RPC calls: ${mockRpc.callCount}`);
    console.log(`  Endpoint rotations: ${mockRpc.rotationCount}`);
    console.log(`  Final endpoint: ${mockRpc.getCurrentEndpoint()}`);
    console.log(`  Total time: ${elapsedTime}ms`);
    
    // Check stats from filter
    console.log(`\n📈 Filter Statistics:`);
    console.log(`  Tracked rotations: ${filter.stats.endpointRotations}`);
    
    return {
        success: result.success,
        rotations: mockRpc.rotationCount,
        trackedRotations: filter.stats.endpointRotations
    };
}

async function testRotationTracking() {
    console.log('\n--- Testing Rotation Statistics Tracking ---\n');
    
    const filter = new TieredTokenFilterService({});
    
    console.log(`Initial stats:`, filter.stats);
    console.log(`Endpoint rotations: ${filter.stats.endpointRotations}`);
    
    return filter.stats.endpointRotations === 0;
}

async function runTests() {
    console.log('Running endpoint rotation tests...\n');
    
    // Test 1: Verify stats initialization
    const statsInit = await testRotationTracking();
    
    // Test 2: Test rotation on failures
    const rotationTest = await testEndpointRotation();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENDPOINT ROTATION VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\nTest Results:');
    console.log(`✅ Stats initialization: ${statsInit ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Rotation on failure: ${rotationTest.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Rotation tracking: ${rotationTest.trackedRotations > 0 ? 'PASS' : 'FAIL'}`);
    
    const allPassed = statsInit && rotationTest.success && rotationTest.trackedRotations > 0;
    
    if (allPassed) {
        console.log('\n✅ ENDPOINT ROTATION VERIFIED');
        console.log('✅ Automatic rotation on RPC failures working');
        console.log('✅ Rotation statistics tracking enabled');
        console.log('✅ System resilient to endpoint failures');
    } else {
        console.log('\n❌ ENDPOINT ROTATION ISSUES DETECTED');
    }
}

runTests().catch(console.error);