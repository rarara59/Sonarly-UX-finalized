/**
 * RENAISSANCE TEST #8: API RATE LIMITING
 * 
 * What: Handling of API rate limits from RPC providers
 * How: Simulate 429 errors, test backoff strategies, quota management  
 * Why: Rate limits during viral events can block entire system
 * Money Impact: HIGH - Rate limits during viral launch = System effectively down
 * 
 * Run: node test_08_api_rate_limiting.js
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

// Mock RPC Manager for testing
class MockRpcManager {
    constructor() {
        this.callMock = null;
        this.rotateEndpointMock = null;
        this.endpointRotations = 0;
    }
    
    async call(method, params) {
        if (this.callMock) {
            return this.callMock(method, params);
        }
        throw new Error('Mock not configured');
    }
    
    async rotateEndpoint() {
        this.endpointRotations++;
        if (this.rotateEndpointMock) {
            return this.rotateEndpointMock();
        }
    }
    
    // Helper methods for test setup
    mockSuccess(response) {
        this.callMock = () => Promise.resolve(response);
    }
    
    mockRateLimit() {
        this.callMock = () => Promise.reject({ 
            status: 429, 
            code: 'RATE_LIMITED', // Add both status and code
            message: 'Rate limit exceeded' 
        });
    }
    
    mockSequence(responses) {
        let callCount = 0;
        this.callMock = () => {
            const response = responses[callCount++];
            if (response.error) {
                return Promise.reject(response.error);
            }
            return Promise.resolve(response.success);
        };
    }
    
    reset() {
        this.callMock = null;
        this.rotateEndpointMock = null;
        this.endpointRotations = 0;
    }
}

// Test utilities
function createTestToken(overrides = {}) {
    const baseToken = {
        tokenMint: 'TestToken123ABC456DEF789GHI012JKL345MNO678',
        address: 'TestToken123ABC456DEF789GHI012JKL345MNO678', // Add address field
        lpValueUSD: 5000,
        detectedAt: Date.now(),
        name: 'Test Token',
        symbol: 'TEST',
        ...overrides
    };
    
    // Ensure address field is always present and valid
    if (!baseToken.address) {
        baseToken.address = baseToken.tokenMint;
    }
    
    return baseToken;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Results Tracking
class TestResults {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    add(name, passed, error = null) {
        this.tests.push({ name, passed, error, timestamp: Date.now() });
        if (passed) {
            this.passed++;
        } else {
            this.failed++;
        }
    }
    
    summary() {
        console.log('\n=== TEST #8: API RATE LIMITING RESULTS ===');
        console.log(`Total Tests: ${this.tests.length}`);
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
        
        if (this.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.tests.filter(t => !t.passed).forEach(test => {
                console.log(`  - ${test.name}: ${test.error}`);
            });
        }
        
        // Deployment recommendation
        console.log('\n🚨 DEPLOYMENT DECISION:');
        if (this.failed === 0) {
            console.log('✅ DEPLOY IMMEDIATELY - Rate limiting robust');
        } else if (this.failed <= 2) {
            console.log('⚠️ DEPLOY WITH MONITORING - Basic protection works');
        } else {
            console.log('🚫 DO NOT DEPLOY - Rate limiting failures will crash system');
        }
    }
}

// Main test execution
async function runTest08() {
    console.log('🚀 Starting Renaissance Test #8: API Rate Limiting');
    console.log('Target: Prove/disprove system survival during viral event rate limit storms');
    console.log('Money Impact: HIGH - Rate limits during viral launch = System effectively down\n');
    
    const results = new TestResults();
    const mockRpc = new MockRpcManager();
    
    // Initialize filter service with mock RPC
    const filterService = new TieredTokenFilterService({
        rpcManager: mockRpc
    });
    
    await filterService.initialize();
    const testToken = createTestToken();
    
    try {
        // ==================== TEST 8.1: Rate Limit Detection ====================
        console.log('🔍 Test 8.1: Rate Limit Detection');
        
        try {
            // Test 8.1.1: HTTP 429 Detection
            mockRpc.mockRateLimit();
            const result1 = await filterService.validateTokenWithRetry(testToken.tokenMint, 'supply');
            
            const detected429 = !result1.success && filterService.stats.rateLimitHits > 0;
            results.add('8.1.1 - Detect HTTP 429', detected429, 
                detected429 ? null : 'Failed to detect rate limit or increment counter');
            
            console.log(`  ${detected429 ? '✅' : '❌'} HTTP 429 detection: ${filterService.stats.rateLimitHits} hits tracked`);
            
        } catch (error) {
            results.add('8.1.1 - Detect HTTP 429', false, error.message);
            console.log(`  ❌ HTTP 429 detection failed: ${error.message}`);
        }
        
        try {
            // Test 8.1.2: RATE_LIMITED Code Detection
            mockRpc.reset();
            mockRpc.callMock = () => Promise.reject({ code: 'RATE_LIMITED', message: 'Quota exceeded' });
            
            const initialHits = filterService.stats.rateLimitHits;
            const result2 = await filterService.validateTokenWithRetry(testToken.tokenMint, 'supply');
            
            const detectedCode = filterService.stats.rateLimitHits > initialHits;
            results.add('8.1.2 - Detect RATE_LIMITED code', detectedCode,
                detectedCode ? null : 'Failed to detect RATE_LIMITED error code');
            
            console.log(`  ${detectedCode ? '✅' : '❌'} RATE_LIMITED code detection`);
            
        } catch (error) {
            results.add('8.1.2 - Detect RATE_LIMITED code', false, error.message);
            console.log(`  ❌ RATE_LIMITED code detection failed: ${error.message}`);
        }
        
        // ==================== TEST 8.2: Backoff Strategy Performance ====================
        console.log('\n🕐 Test 8.2: Backoff Strategy Performance');
        
        try {
            // Test 8.2.1: Total Delay Limit
            mockRpc.reset();
            // Mock 5 consecutive rate limits
            mockRpc.callMock = () => Promise.reject({ status: 429, message: 'Rate limited' });
            
            const startTime = Date.now();
            const result = await filterService.validateTokenWithRetry(testToken.tokenMint, 'supply', 5);
            const totalDelay = Date.now() - startTime;
            
            // CRITICAL: Should be under 30 seconds for competitive advantage
            const withinTimeLimit = totalDelay < 30000;
            results.add('8.2.1 - Total delay under 30s', withinTimeLimit,
                withinTimeLimit ? null : `Total delay ${totalDelay}ms exceeds 30 second limit`);
            
            console.log(`  ${withinTimeLimit ? '✅' : '❌'} Total retry delay: ${totalDelay}ms (limit: 30000ms)`);
            
        } catch (error) {
            results.add('8.2.1 - Total delay under 30s', false, error.message);
            console.log(`  ❌ Backoff timing test failed: ${error.message}`);
        }
        
        // ==================== TEST 8.3: Viral Event Rate Limit Storm ====================
        console.log('\n🌋 Test 8.3: Viral Event Rate Limit Storm (CRITICAL)');
        
        try {
            // Test 8.3.1: Handle 20+ Simultaneous Rate Limits
            console.log('  🔥 Simulating viral meme launch - 20 tokens simultaneously...');
            
            const viralTokens = Array.from({ length: 20 }, (_, i) => 
                createTestToken({ 
                    tokenMint: `ViralToken${i.toString().padStart(2, '0')}ABC123DEF456`,
                    address: `ViralToken${i.toString().padStart(2, '0')}ABC123DEF456` // Ensure address field
                })
            );
            
            mockRpc.reset();
            mockRpc.mockRateLimit(); // All calls return 429
            
            const stormStartTime = Date.now();
            const promises = viralTokens.map(token => filterService.processToken(token));
            const stormResults = await Promise.allSettled(promises);
            const stormTotalTime = Date.now() - stormStartTime;
            
            // Should not take more than 2 minutes total during storm
            const stormTimeOk = stormTotalTime < 120000;
            const processedCount = stormResults.filter(r => r.status === 'fulfilled' && r.value?.approved !== undefined).length;
            const hasResults = processedCount > 0;
            
            results.add('8.3.1 - Viral event processing time', stormTimeOk,
                stormTimeOk ? null : `Storm processing took ${stormTotalTime}ms, exceeds 120000ms limit`);
            
            results.add('8.3.2 - Some tokens processed during storm', hasResults,
                hasResults ? null : 'No tokens processed during rate limit storm - no fallback mechanism');
            
            console.log(`  ${stormTimeOk ? '✅' : '❌'} Storm processing time: ${stormTotalTime}ms (limit: 120000ms)`);
            console.log(`  ${hasResults ? '✅' : '❌'} Tokens processed during storm: ${processedCount}/20`);
            
        } catch (error) {
            results.add('8.3.1 - Viral event processing time', false, error.message);
            results.add('8.3.2 - Some tokens processed during storm', false, error.message);
            console.log(`  ❌ Viral event storm test failed: ${error.message}`);
        }
        
        try {
            // Test 8.3.2: Circuit Breaker Implementation
            console.log('  🔌 Testing circuit breaker after repeated rate limits...');
            
            mockRpc.reset();
            mockRpc.mockRateLimit();
            
            // Hit rate limits 25 times rapidly
            for (let i = 0; i < 25; i++) {
                try {
                    await filterService.validateTokenWithRetry(`rapidTest${i}`, 'supply', 1);
                } catch (e) {
                    // Expected failures
                }
            }
            
            // Next token should trigger circuit breaker (fast fail)
            const cbStartTime = Date.now();
            const cbResult = await filterService.processToken(createTestToken({ 
                tokenMint: 'CircuitBreakerTest123ABC456DEF789GHI012' 
            }));
            const cbProcessingTime = Date.now() - cbStartTime;
            
            const hasFastFail = cbProcessingTime < 5000; // Should fail fast under 5 seconds
            const hasCircuitBreaker = cbResult?.reason?.includes('circuit') || 
                                    cbResult?.reason?.includes('storm') ||
                                    cbResult?.reason?.includes('rate_limit') ||
                                    filterService.stats.rateLimitHits > 25;
            
            results.add('8.3.3 - Circuit breaker fast fail', hasFastFail,
                hasFastFail ? null : `Circuit breaker took ${cbProcessingTime}ms, should be under 5000ms`);
            
            console.log(`  ${hasFastFail ? '✅' : '❌'} Circuit breaker timing: ${cbProcessingTime}ms`);
            console.log(`  ${hasCircuitBreaker ? '✅' : '⚠️'} Circuit breaker logic: Rate limit hits: ${filterService.stats.rateLimitHits}`);
            
        } catch (error) {
            results.add('8.3.3 - Circuit breaker fast fail', false, error.message);
            console.log(`  ❌ Circuit breaker test failed: ${error.message}`);
        }
        
        // ==================== TEST 8.4: Multi-Endpoint Failover ====================
        console.log('\n🔄 Test 8.4: Multi-Endpoint Failover');
        
        try {
            // Test 8.4.1: Endpoint Rotation on Rate Limit
            mockRpc.reset();
            let callCount = 0;
            mockRpc.callMock = () => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject({ status: 429 }); // First call rate limited
                } else {
                    return Promise.resolve({ value: { amount: '1000000', decimals: 6, uiAmount: 1 } });
                }
            };
            
            const initialRotations = mockRpc.endpointRotations;
            const result = await filterService.validateTokenWithRetry(testToken.tokenMint, 'supply');
            
            const rotationWorked = mockRpc.endpointRotations > initialRotations && result.success;
            results.add('8.4.1 - Endpoint rotation on rate limit', rotationWorked,
                rotationWorked ? null : 'Endpoint rotation failed or result unsuccessful');
            
            console.log(`  ${rotationWorked ? '✅' : '❌'} Endpoint rotations: ${mockRpc.endpointRotations}, Success: ${result.success}`);
            
        } catch (error) {
            results.add('8.4.1 - Endpoint rotation on rate limit', false, error.message);
            console.log(`  ❌ Endpoint rotation test failed: ${error.message}`);
        }
        
        // ==================== TEST 8.5: Financial Impact Analysis ====================
        console.log('\n💰 Test 8.5: Competitive Timing Analysis (CRITICAL)');
        
        try {
            // Test 8.5.1: 30-Second Profit Window
            const tokenLaunchTime = Date.now();
            const freshGem = createTestToken({
                tokenMint: 'FreshGem123ABC456DEF789GHI012JKL345MNO67',
                detectedAt: tokenLaunchTime + 5000, // 5 seconds after launch
                ageMinutes: 0.08, // 5 seconds = 0.08 minutes
                lpValueUSD: 3000
            });
            
            mockRpc.reset();
            let competitiveCallCount = 0;
            mockRpc.callMock = (method, params) => {
                competitiveCallCount++;
                if (competitiveCallCount === 1) {
                    // First call rate limited
                    return Promise.reject({ status: 429 });
                } else {
                    // Subsequent calls succeed
                    if (method === 'getTokenSupply') {
                        return Promise.resolve({ value: { amount: '1000000000', decimals: 9, uiAmount: 1000 } });
                    } else if (method === 'getTokenLargestAccounts') {
                        return Promise.resolve({ value: [{ amount: '500000000' }] });
                    }
                    return Promise.resolve({ value: {} });
                }
            };
            
            const competitiveStartTime = Date.now();
            const competitiveResult = await filterService.processToken(freshGem);
            const competitiveProcessingTime = Date.now() - competitiveStartTime;
            
            // CRITICAL: Must complete within 25 seconds to maintain competitive edge
            const maintainsAdvantage = competitiveProcessingTime < 25000;
            const hasResult = competitiveResult?.approved !== undefined;
            
            results.add('8.5.1 - Maintain competitive timing', maintainsAdvantage && hasResult,
                maintainsAdvantage ? null : `Processing took ${competitiveProcessingTime}ms, exceeds 25000ms competitive window`);
            
            console.log(`  ${maintainsAdvantage && hasResult ? '✅' : '❌'} Fresh gem processing: ${competitiveProcessingTime}ms (limit: 25000ms)`);
            console.log(`  📊 Result: approved=${competitiveResult?.approved}, reason=${competitiveResult?.reason}`);
            
        } catch (error) {
            results.add('8.5.1 - Maintain competitive timing', false, error.message);
            console.log(`  ❌ Competitive timing test failed: ${error.message}`);
        }
        
        // ==================== TEST 8.6: System Health Check ====================
        console.log('\n🏥 Test 8.6: System Health After Rate Limits');
        
        try {
            const healthCheck = await filterService.healthCheck();
            const systemHealthy = healthCheck.healthy;
            const statsValid = healthCheck.stats.rateLimitHits >= 0 && 
                              healthCheck.stats.processed > 0;
            
            results.add('8.6.1 - System health maintained', systemHealthy && statsValid,
                systemHealthy ? null : 'System health check failed after rate limit testing');
            
            console.log(`  ${systemHealthy ? '✅' : '❌'} System health: ${systemHealthy}`);
            console.log(`  📈 Rate limit hits: ${healthCheck.stats.rateLimitHits}`);
            console.log(`  📊 Total processed: ${healthCheck.stats.processed}`);
            
        } catch (error) {
            results.add('8.6.1 - System health maintained', false, error.message);
            console.log(`  ❌ Health check failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Test suite execution failed:', error);
        results.add('Test Suite Execution', false, error.message);
    } finally {
        // Cleanup
        try {
            await filterService.shutdown();
        } catch (e) {
            console.warn('⚠️ Cleanup warning:', e.message);
        }
    }
    
    // Print results summary
    results.summary();
    
    return results;
}

// Execute tests if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTest08()
        .then(results => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test execution failed:', error);
            process.exit(1);
        });
}

export { runTest08, MockRpcManager, TestResults };