/**
 * SCAM PROTECTION ENGINE - Renaissance Test Script
 * Tests the exact scenarios that would cause the critical bugs
 */

// Mock dependencies for testing
class MockRPCPool {
    async execute(callback) {
        return await callback(new MockConnection());
    }
}

class MockConnection {
    async getTokenLargestAccounts(tokenAddress, commitment) {
        // Test different scenarios
        if (tokenAddress === 'ZERO_SUPPLY_TOKEN') {
            return {
                value: [
                    { amount: '0' },
                    { amount: '0' }
                ]
            };
        }
        
        if (tokenAddress === 'FRESH_TOKEN') {
            return {
                value: []
            };
        }
        
        if (tokenAddress === 'HIGH_CONCENTRATION_TOKEN') {
            return {
                value: [
                    { amount: '900000000' }, // 90% concentration
                    { amount: '100000000' }  // 10% concentration
                ]
            };
        }
        
        if (tokenAddress === 'NORMAL_TOKEN') {
            return {
                value: [
                    { amount: '100000000' }, // 10% each
                    { amount: '100000000' },
                    { amount: '100000000' },
                    { amount: '100000000' },
                    { amount: '100000000' },
                    { amount: '100000000' },
                    { amount: '100000000' },
                    { amount: '100000000' },
                    { amount: '100000000' },
                    { amount: '100000000' }
                ]
            };
        }
        
        if (tokenAddress === 'MALFORMED_AMOUNTS') {
            return {
                value: [
                    { amount: 'invalid_number' },
                    { amount: null },
                    { amount: undefined },
                    { amount: '1000000' }
                ]
            };
        }
        
        throw new Error('RPC connection failed');
    }
    
    async getParsedAccountInfo(tokenAddress) {
        if (tokenAddress === 'MINT_AUTHORITY_TOKEN') {
            return {
                value: {
                    data: {
                        parsed: {
                            info: {
                                mintAuthority: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                                freezeAuthority: null,
                                decimals: 9,
                                supply: '1000000000000000000'
                            }
                        }
                    }
                }
            };
        }
        
        if (tokenAddress === 'NULL_AUTHORITY_TOKEN') {
            return {
                value: {
                    data: {
                        parsed: {
                            info: {
                                mintAuthority: null,
                                freezeAuthority: null,
                                decimals: 9,
                                supply: '1000000000000000000'
                            }
                        }
                    }
                }
            };
        }
        
        if (tokenAddress === 'NULL_VALUE_TOKEN') {
            return { value: null };
        }
        
        if (tokenAddress === 'UNPARSEABLE_TOKEN') {
            return {
                value: {
                    data: null
                }
            };
        }
        
        return {
            value: {
                data: {
                    parsed: {
                        info: {
                            mintAuthority: null,
                            freezeAuthority: null,
                            decimals: 9,
                            supply: '1000000000000000000'
                        }
                    }
                }
            }
        };
    }
    
    async getVersion() {
        return { 'solana-core': '1.16.0' };
    }
}

class MockSignalBus {
    constructor() {
        this.events = [];
    }
    
    emit(event, data) {
        this.events.push({ event, data });
        console.log(`📡 Signal emitted: ${event}`, data);
    }
}

class MockLogger {
    debug(...args) { console.log('🔍 DEBUG:', ...args); }
    warn(...args) { console.log('⚠️  WARN:', ...args); }
    error(...args) { console.log('❌ ERROR:', ...args); }
}

// Test function
async function testScamProtectionEngine() {
    console.log('🧪 RENAISSANCE SCAM PROTECTION ENGINE TESTS\n');
    
    // Import the actual engine (you'll need to adjust path)
    let ScamProtectionEngine;
    try {
        // Try to import - adjust path as needed
        ScamProtectionEngine = require('./src/detection/risk/scam-protection-engine.js');
    } catch (error) {
        console.log('❌ Import failed - save the artifact as scam-protection-engine.js first');
        console.log('Error:', error.message);
        return;
    }
    
    const rpcPool = new MockRPCPool();
    const signalBus = new MockSignalBus();
    const logger = new MockLogger();
    
    const engine = new ScamProtectionEngine(rpcPool, signalBus, logger);
    
    console.log('✅ Engine initialized successfully\n');
    
    // TEST 1: Zero supply handling (Critical Bug #1 fix)
    console.log('🔬 TEST 1: Zero Supply Token (Bug #1 fix)');
    try {
        const result = await engine.analyzeToken('ZERO_SUPPLY_TOKEN');
        console.log('Result:', result);
        console.log(result.isScam ? '❌ FAIL: Should not flag fresh tokens as scams' : '✅ PASS: Handles zero supply correctly');
    } catch (error) {
        console.log('❌ FAIL: Crashed on zero supply:', error.message);
    }
    console.log('');
    
    // TEST 2: Malformed amounts (NaN protection)
    console.log('🔬 TEST 2: Malformed Account Amounts');
    try {
        const result = await engine.analyzeToken('MALFORMED_AMOUNTS');
        console.log('Result:', result);
        console.log('✅ PASS: Handles malformed amounts without crashing');
    } catch (error) {
        console.log('❌ FAIL: Crashed on malformed amounts:', error.message);
    }
    console.log('');
    
    // TEST 3: Confidence calculation type safety (Critical Bug #2 fix)
    console.log('🔬 TEST 3: Confidence Calculation Type Safety');
    try {
        const reasons = ['High concentration: 90% in top 10 holders', 'Low holder count: 5 holders'];
        const confidence = engine.calculateScamConfidence(reasons);
        console.log('Confidence:', confidence, typeof confidence);
        console.log(typeof confidence === 'number' && confidence === 70 ? '✅ PASS: Confidence calculation correct' : '❌ FAIL: Wrong confidence or type');
    } catch (error) {
        console.log('❌ FAIL: Confidence calculation crashed:', error.message);
    }
    console.log('');
    
    // TEST 4: Null pointer protection (Critical Bug #3 fix)
    console.log('🔬 TEST 4: Null Pointer Protection');
    try {
        const result = await engine.analyzeToken('NULL_VALUE_TOKEN');
        console.log('Result:', result);
        console.log('✅ PASS: Handles null RPC responses without crashing');
    } catch (error) {
        console.log('❌ FAIL: Crashed on null response:', error.message);
    }
    console.log('');
    
    // TEST 5: High concentration detection
    console.log('🔬 TEST 5: High Concentration Scam Detection');
    try {
        const result = await engine.analyzeToken('HIGH_CONCENTRATION_TOKEN');
        console.log('Result:', result);
        console.log(result.isScam && result.confidence > 70 ? '✅ PASS: Correctly detects high concentration scam' : '❌ FAIL: Missed high concentration scam');
    } catch (error) {
        console.log('❌ FAIL: High concentration test crashed:', error.message);
    }
    console.log('');
    
    // TEST 6: Mint authority detection
    console.log('🔬 TEST 6: Mint Authority Detection');
    try {
        const result = await engine.analyzeToken('MINT_AUTHORITY_TOKEN');
        console.log('Result:', result);
        console.log(result.reasons.some(r => r.includes('Active mint authority')) ? '✅ PASS: Detects active mint authority' : '❌ FAIL: Missed mint authority');
    } catch (error) {
        console.log('❌ FAIL: Mint authority test crashed:', error.message);
    }
    console.log('');
    
    // TEST 7: Normal token (should not be flagged)
    console.log('🔬 TEST 7: Normal Token (Should Pass)');
    try {
        const result = await engine.analyzeToken('NORMAL_TOKEN');
        console.log('Result:', result);
        console.log(!result.isScam ? '✅ PASS: Normal token not flagged as scam' : '❌ FAIL: False positive on normal token');
    } catch (error) {
        console.log('❌ FAIL: Normal token test crashed:', error.message);
    }
    console.log('');
    
    // TEST 8: Performance test
    console.log('🔬 TEST 8: Performance Test');
    const startTime = Date.now();
    try {
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(engine.analyzeToken('NORMAL_TOKEN'));
        }
        await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / 10;
        console.log(`Average analysis time: ${avgTime}ms`);
        console.log(avgTime < 50 ? '✅ PASS: Performance within acceptable limits' : '❌ FAIL: Too slow for production');
    } catch (error) {
        console.log('❌ FAIL: Performance test crashed:', error.message);
    }
    console.log('');
    
    // TEST 9: Health check
    console.log('🔬 TEST 9: Health Check');
    try {
        const health = await engine.healthCheck();
        console.log('Health:', health);
        console.log(health.status === 'healthy' ? '✅ PASS: Health check working' : '❌ FAIL: Health check failed');
    } catch (error) {
        console.log('❌ FAIL: Health check crashed:', error.message);
    }
    console.log('');
    
    // TEST 10: Signal bus integration
    console.log('🔬 TEST 10: Signal Bus Integration');
    const initialEventCount = signalBus.events.length;
    try {
        await engine.analyzeToken('HIGH_CONCENTRATION_TOKEN');
        const scamEvents = signalBus.events.filter(e => e.event === 'scam_detected');
        console.log(scamEvents.length > 0 ? '✅ PASS: Scam detection signals emitted' : '❌ FAIL: No scam signals emitted');
    } catch (error) {
        console.log('❌ FAIL: Signal test crashed:', error.message);
    }
    console.log('');
    
    // Final stats
    console.log('📊 FINAL STATS:');
    console.log(engine.getStats());
    
    console.log('\n🏁 TESTS COMPLETE');
    console.log('If all tests pass, the engine is ready for integration!');
}

// Run the tests
testScamProtectionEngine().catch(console.error);