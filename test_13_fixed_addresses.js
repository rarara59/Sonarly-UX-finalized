#!/usr/bin/env node

/**
 * RENAISSANCE TEST #13 FINAL: RPC Endpoint Failures with Valid Solana Addresses
 * 
 * Testing: Complete RPC failure scenarios with proper base58 addresses
 * Fix: Generate valid Solana token addresses that pass validation
 */

console.log('🧪 RENAISSANCE TEST #13 FINAL: RPC Failures with Valid Addresses');
console.log('📍 Testing: RPC failures with properly formatted Solana addresses');
console.log('🎯 Scenario: RPC providers fail with valid token addresses');
console.log('💰 Impact: CRITICAL - Verify RPC reliability with real addresses\n');

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

// Generate valid base58 Solana addresses
function generateValidSolanaAddress() {
    // Base58 alphabet (excludes 0, O, I, l to avoid confusion)
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    
    // Generate 44 character base58 address (maximum length)
    let address = '';
    for (let i = 0; i < 44; i++) {
        address += base58Chars[Math.floor(Math.random() * base58Chars.length)];
    }
    
    return address;
}

// Use real Solana token addresses for testing
const REAL_SOLANA_ADDRESSES = [
    'So11111111111111111111111111111111111111112', // Wrapped SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
];

// Mock RPC Manager with comprehensive failure modes (same as before)
class FailureRpcManager {
    constructor(failureMode = 'normal', endpoints = ['helius', 'chainstack', 'backup']) {
        this.failureMode = failureMode;
        this.endpoints = endpoints;
        this.currentEndpoint = 0;
        this.callCount = 0;
        this.failureCount = 0;
        this.rotationCount = 0;
        this.networkDelay = 50;
    }

    async call(method, params) {
        this.callCount++;
        const currentEndpointName = this.endpoints[this.currentEndpoint];
        
        console.log(`    📡 RPC Call #${this.callCount}: ${method} via ${currentEndpointName} (mode: ${this.failureMode})`);

        switch (this.failureMode) {
            case 'normal':
                return await this._simulateNormalResponse(method, params);
                
            case 'primary_down':
                if (this.currentEndpoint === 0) {
                    this.failureCount++;
                    throw new Error(`Primary endpoint (${currentEndpointName}) is down - Connection refused`);
                }
                return await this._simulateNormalResponse(method, params);

            case 'all_endpoints_down':
                this.failureCount++;
                throw new Error(`All RPC endpoints down - ${currentEndpointName} connection failed`);

            case 'timeout':
                this.failureCount++;
                await new Promise(resolve => setTimeout(resolve, 10000));
                throw new Error(`RPC timeout - ${currentEndpointName} did not respond`);

            case 'rate_limited':
                this.failureCount++;
                const rateLimitError = new Error(`Rate limit exceeded on ${currentEndpointName}`);
                rateLimitError.status = 429;
                rateLimitError.code = 'RATE_LIMITED';
                throw rateLimitError;

            case 'intermittent':
                if (Math.random() < 0.7) {
                    this.failureCount++;
                    throw new Error(`Intermittent failure on ${currentEndpointName}: Network error`);
                }
                return await this._simulateNormalResponse(method, params);

            case 'slow_responses':
                const slowDelay = 2000 + (Math.random() * 3000);
                await new Promise(resolve => setTimeout(resolve, slowDelay));
                return await this._simulateNormalResponse(method, params);

            case 'malformed_responses':
                this.failureCount++;
                if (method === 'getTokenSupply') {
                    return { error: 'Invalid token mint', code: -32602 };
                }
                if (method === 'getTokenLargestAccounts') {
                    return { value: "invalid_data_structure" };
                }
                return null;

            default:
                throw new Error(`Unknown failure mode: ${this.failureMode}`);
        }
    }

    async rotateEndpoint() {
        this.rotationCount++;
        this.currentEndpoint = (this.currentEndpoint + 1) % this.endpoints.length;
        const newEndpoint = this.endpoints[this.currentEndpoint];
        console.log(`    🔄 Endpoint rotated to: ${newEndpoint} (rotation #${this.rotationCount})`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async _simulateNormalResponse(method, params) {
        await new Promise(resolve => setTimeout(resolve, this.networkDelay));

        if (method === 'getTokenSupply') {
            return {
                value: {
                    amount: "1000000000",
                    decimals: 9,
                    uiAmount: 1
                }
            };
        }
        
        if (method === 'getTokenLargestAccounts') {
            return {
                value: [
                    { address: "holder1", amount: "300000000", decimals: 0 },
                    { address: "holder2", amount: "200000000", decimals: 0 }
                ]
            };
        }

        if (method === 'getAccountInfo') {
            return {
                value: {
                    data: {
                        parsed: {
                            info: {
                                decimals: 9,
                                supply: "1000000000",
                                mintAuthority: null,
                                freezeAuthority: null,
                                isInitialized: true
                            }
                        }
                    }
                }
            };
        }
        
        return null;
    }

    getStats() {
        return {
            totalCalls: this.callCount,
            failures: this.failureCount,
            rotations: this.rotationCount,
            currentEndpoint: this.endpoints[this.currentEndpoint],
            failureRate: this.callCount > 0 ? (this.failureCount / this.callCount * 100).toFixed(1) + '%' : '0%'
        };
    }
}

// Test RPC failures with valid addresses
async function testRpcWithValidAddresses(testName, failureMode, tokenCount = 2) {
    console.log(`\n--- ${testName} ---`);
    console.log(`Failure Mode: ${failureMode}, Testing: ${tokenCount} tokens`);

    const mockRpc = new FailureRpcManager(failureMode);
    const filter = new TieredTokenFilterService({ rpcManager: mockRpc });
    await filter.initialize();

    // Create tokens with REAL Solana addresses
    const testTokens = Array.from({ length: tokenCount }, (_, i) => {
        const realAddress = REAL_SOLANA_ADDRESSES[i % REAL_SOLANA_ADDRESSES.length];
        return {
            tokenMint: realAddress,
            lpValueUSD: 10000 + (i * 2000),
            uniqueWallets: 30 + (i * 5),
            buyToSellRatio: 2.5 + (i * 0.3),
            detectedAt: Date.now() - (i * 60000),
            dex: 'raydium'
        };
    });

    const startTime = Date.now();
    let completed = 0;
    let failed = 0;
    const errors = [];

    console.log('  🔗 Processing tokens with valid Solana addresses...');

    try {
        for (let i = 0; i < testTokens.length; i++) {
            const token = testTokens[i];
            console.log(`  🪙 Processing Token ${i + 1}/${tokenCount}: ${token.tokenMint.substring(0, 12)}...`);
            
            try {
                const result = await filter.processToken(token);
                
                if (result && result.approved !== undefined) {
                    completed++;
                    console.log(`    ✅ Token ${i + 1}: ${result.approved ? 'Approved' : 'Rejected'} (${result.reason})`);
                } else {
                    failed++;
                    console.log(`    ❌ Token ${i + 1}: Invalid result structure`);
                }
                
            } catch (error) {
                failed++;
                errors.push({ token: i + 1, error: error.message });
                console.log(`    ❌ Token ${i + 1}: ${error.message}`);
            }
        }

    } catch (error) {
        console.log(`  💥 Test failed: ${error.message}`);
        failed += testTokens.length - completed;
    }

    const processingTime = Date.now() - startTime;
    const rpcStats = mockRpc.getStats();

    console.log(`\n📊 Test Results with Valid Addresses:`);
    console.log(`   Processing Time: ${processingTime}ms`);
    console.log(`   Tokens Completed: ${completed}/${tokenCount} (${(completed/tokenCount*100).toFixed(1)}%)`);
    console.log(`   Tokens Failed: ${failed}/${tokenCount} (${(failed/tokenCount*100).toFixed(1)}%)`);
    console.log(`   RPC Stats: ${rpcStats.totalCalls} calls, ${rpcStats.failures} failures (${rpcStats.failureRate})`);
    console.log(`   Endpoint Rotations: ${rpcStats.rotations}`);
    console.log(`   Current Endpoint: ${rpcStats.currentEndpoint}`);

    if (errors.length > 0) {
        console.log(`   Error Sample: ${errors[0]?.error}`);
    }

    await filter.shutdown();

    return {
        completed,
        failed,
        processingTime,
        rpcStats,
        totalRpcCalls: rpcStats.totalCalls,
        endpointRotations: rpcStats.rotations
    };
}

// Run tests with valid addresses
async function runValidAddressTests() {
    console.log('Testing RPC failures with valid Solana addresses...\n');
    
    const tests = [
        ['Normal RPC Operation', 'normal', 2],
        ['Primary Endpoint Down', 'primary_down', 2], 
        ['All Endpoints Down', 'all_endpoints_down', 1],
        ['RPC Timeouts', 'timeout', 1],
        ['Rate Limiting', 'rate_limited', 2],
        ['Intermittent Failures', 'intermittent', 3]
    ];
    
    const results = [];
    
    for (const [testName, failureMode, tokenCount] of tests) {
        const result = await testRpcWithValidAddresses(testName, failureMode, tokenCount);
        results.push({ name: testName, mode: failureMode, ...result });
        
        // Brief delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}

// Execute and analyze
runValidAddressTests().then(results => {
    console.log('\n' + '='.repeat(100));
    console.log('🏛️  RENAISSANCE RPC ANALYSIS WITH VALID ADDRESSES');
    console.log('='.repeat(100));
    
    let totalRpcCalls = 0;
    let totalRotations = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    let rpcSystemWorking = false;
    
    results.forEach(result => {
        totalRpcCalls += result.totalRpcCalls || 0;
        totalRotations += result.endpointRotations || 0;
        totalCompleted += result.completed || 0;
        totalFailed += result.failed || 0;
        
        if (result.totalRpcCalls > 0) {
            rpcSystemWorking = true;
        }
    });
    
    console.log(`\n📊 FINAL RPC TEST RESULTS:`);
    console.log(`   Total RPC Calls Made: ${totalRpcCalls}`);
    console.log(`   Total Endpoint Rotations: ${totalRotations}`);
    console.log(`   Total Tokens Completed: ${totalCompleted}`);
    console.log(`   Total Tokens Failed: ${totalFailed}`);
    console.log(`   RPC System Active: ${rpcSystemWorking ? 'YES' : 'NO'}`);
    
    console.log(`\n🏛️  RENAISSANCE VERDICT:`);
    if (!rpcSystemWorking) {
        console.log(`   ❌ CRITICAL: Still no RPC calls made - Address validation may still be failing`);
        console.log(`   🔍 DEBUG: Check if tokens are passing address validation`);
    } else if (totalRpcCalls > 0 && totalRotations > 0) {
        console.log(`   ✅ RPC SYSTEM WORKING: ${totalRpcCalls} calls made, ${totalRotations} endpoint rotations`);
        console.log(`   🎯 SUCCESS: RPC failure scenarios now being properly tested`);
    } else if (totalRpcCalls > 0) {
        console.log(`   ⚠️  PARTIAL SUCCESS: RPC calls working but no endpoint rotations detected`);
        console.log(`   🔧 ISSUE: Failover logic may need adjustment`);
    }
    
    console.log(`\n🎯 RPC TESTING WITH VALID ADDRESSES COMPLETE`);
    console.log('='.repeat(100));
    
}).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});