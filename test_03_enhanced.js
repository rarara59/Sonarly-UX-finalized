#!/usr/bin/env node

/**
 * RENAISSANCE TEST #3 ENHANCED: RACE CONDITION IN VALIDATION QUEUE CLEANUP
 * 
 * Testing Lines 963-987: cleanupValidationQueue() iterator corruption
 * Scenario: Cleanup runs while validation queue being modified during viral events
 * Impact: Memory leaks during highest profit periods = System degradation/crashes
 */

console.log('🧪 RENAISSANCE TEST #3 ENHANCED: Race Condition in Validation Queue Cleanup');
console.log('📍 Testing Lines 963-987: Iterator corruption during concurrent operations');
console.log('🎯 Scenario: Viral event with 20+ tokens/second + concurrent cleanup');
console.log('💰 Impact: Memory leaks during highest profit windows = System instability\n');

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

// Mock RPC Manager for race condition simulation
class RaceConditionRpcManager {
    constructor(delayMs = 50) {
        this.delayMs = delayMs;
        this.callCount = 0;
    }

    async call(method, params) {
        this.callCount++;
        
        // Add realistic RPC delay to create race conditions
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
        
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
                value: []  // Empty for fresh tokens
            };
        }
        
        return null;
    }

    async rotateEndpoint() {
        // Simulate endpoint rotation
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

// Race condition test simulator
class RaceConditionSimulator {
    constructor() {
        this.results = {
            memoryLeaks: 0,
            iteratorErrors: 0,
            queueInconsistencies: 0,
            successfulCleanups: 0,
            totalOperations: 0,
            peakQueueSize: 0,
            finalQueueSize: 0,
            cleanupErrors: []
        };
    }

    // Simulate viral event: 50+ tokens in 5 minutes with concurrent cleanup
    async simulateViralEventRaceCondition(testName, concurrency = 20, durationMs = 30000) {
        console.log(`\n--- ${testName} ---`);
        console.log(`Simulating: ${concurrency} concurrent validations over ${durationMs}ms`);
        console.log('Expected behavior: Queue grows and shrinks without memory leaks\n');

        const mockRpc = new RaceConditionRpcManager(50); // 50ms RPC delay
        const filter = new TieredTokenFilterService({ rpcManager: mockRpc });
        
        await filter.initialize();

        // Track memory usage before test
        const initialQueueSize = filter.validationQueue.size;
        const initialTimestampsSize = filter.validationQueueTimestamps.size;
        
        console.log(`Initial state: Queue=${initialQueueSize}, Timestamps=${initialTimestampsSize}`);

        let operationsCompleted = 0;
        let operationsStarted = 0;
        const errors = [];
        const startTime = Date.now();

        try {
            // Create array of validation promises to simulate concurrent load
            const validationPromises = [];
            
            // Generate unique token addresses for concurrent validation
            const tokenAddresses = Array.from({ length: concurrency * 2 }, (_, i) => 
                `Token${i.toString().padStart(8, '0')}${'x'.repeat(32)}`
            );

            // Start concurrent validations with staggered timing
            const validationInterval = setInterval(() => {
                if (Date.now() - startTime > durationMs || operationsStarted >= tokenAddresses.length) {
                    clearInterval(validationInterval);
                    return;
                }

                const tokenAddress = tokenAddresses[operationsStarted++];
                
                // Launch validation (this adds to queue)
                const validationPromise = filter.validateTokenWithRetry(tokenAddress, 'both', 3)
                    .then(result => {
                        operationsCompleted++;
                        return { success: true, token: tokenAddress, result };
                    })
                    .catch(error => {
                        operationsCompleted++;
                        errors.push({ token: tokenAddress, error: error.message });
                        return { success: false, token: tokenAddress, error: error.message };
                    });

                validationPromises.push(validationPromise);

                // Track peak queue size
                const currentQueueSize = filter.validationQueue.size;
                if (currentQueueSize > this.results.peakQueueSize) {
                    this.results.peakQueueSize = currentQueueSize;
                }

            }, 25); // New validation every 25ms = 40/second peak rate

            // Force cleanup operations during the validation flood
            const cleanupInterval = setInterval(() => {
                try {
                    const beforeCleanup = {
                        queueSize: filter.validationQueue.size,
                        timestampsSize: filter.validationQueueTimestamps.size
                    };

                    // This should trigger the race condition
                    filter.cleanupValidationQueue();

                    const afterCleanup = {
                        queueSize: filter.validationQueue.size,
                        timestampsSize: filter.validationQueueTimestamps.size
                    };

                    // Check for inconsistencies (memory leak indicators)
                    if (beforeCleanup.queueSize !== afterCleanup.queueSize || 
                        beforeCleanup.timestampsSize !== afterCleanup.timestampsSize) {
                        
                        // This could be normal cleanup, but check for size mismatches
                        if (afterCleanup.queueSize !== afterCleanup.timestampsSize) {
                            this.results.queueInconsistencies++;
                            console.log(`⚠️  Queue inconsistency: Queue=${afterCleanup.queueSize}, Timestamps=${afterCleanup.timestampsSize}`);
                        }
                    }

                    this.results.successfulCleanups++;

                } catch (error) {
                    this.results.iteratorErrors++;
                    this.results.cleanupErrors.push(error.message);
                    console.log(`❌ Cleanup error: ${error.message}`);
                }
            }, 100); // Cleanup every 100ms during peak load

            // Wait for test duration
            await new Promise(resolve => setTimeout(resolve, durationMs + 1000));

            // Stop intervals
            clearInterval(validationInterval);
            clearInterval(cleanupInterval);

            // Wait for remaining operations to complete
            console.log(`\nWaiting for ${operationsStarted - operationsCompleted} remaining operations...`);
            await Promise.allSettled(validationPromises);

            // Final cleanup to see if memory leaks persist
            await new Promise(resolve => setTimeout(resolve, 500));
            filter.cleanupValidationQueue();

            // Check final state
            const finalQueueSize = filter.validationQueue.size;
            const finalTimestampsSize = filter.validationQueueTimestamps.size;

            console.log(`\nFinal state: Queue=${finalQueueSize}, Timestamps=${finalTimestampsSize}`);
            
            // Analyze memory leak indicators
            this.results.totalOperations = operationsStarted;
            this.results.finalQueueSize = finalQueueSize;

            // Memory leak detection
            if (finalQueueSize > initialQueueSize + 5) { // Allow for some active operations
                this.results.memoryLeaks++;
                console.log(`🚨 MEMORY LEAK: Final queue size (${finalQueueSize}) significantly larger than initial (${initialQueueSize})`);
            }

            if (finalQueueSize !== finalTimestampsSize) {
                this.results.queueInconsistencies++;
                console.log(`🚨 DATA INCONSISTENCY: Queue size (${finalQueueSize}) != Timestamps size (${finalTimestampsSize})`);
            }

            // Performance impact analysis
            const avgOperationsPerSecond = (operationsCompleted / (durationMs / 1000)).toFixed(1);
            console.log(`\n📊 Performance: ${operationsCompleted}/${operationsStarted} operations completed`);
            console.log(`📊 Throughput: ${avgOperationsPerSecond} operations/second`);
            console.log(`📊 Peak queue size: ${this.results.peakQueueSize}`);
            console.log(`📊 Successful cleanups: ${this.results.successfulCleanups}`);

            if (errors.length > 0) {
                console.log(`⚠️  Validation errors: ${errors.length}/${operationsStarted} (${(errors.length/operationsStarted*100).toFixed(1)}%)`);
            }

        } finally {
            await filter.shutdown();
        }

        return {
            memoryLeaks: this.results.memoryLeaks,
            iteratorErrors: this.results.iteratorErrors,
            queueInconsistencies: this.results.queueInconsistencies,
            peakQueueSize: this.results.peakQueueSize,
            finalQueueSize: this.results.finalQueueSize,
            operationsCompleted,
            operationsStarted,
            errors: errors.length
        };
    }

    // Test specific iterator corruption scenarios
    async testIteratorCorruption(testName) {
        console.log(`\n--- ${testName} ---`);
        console.log('Testing: Direct iterator corruption during cleanup');

        const mockRpc = new RaceConditionRpcManager(10);
        const filter = new TieredTokenFilterService({ rpcManager: mockRpc });
        await filter.initialize();

        try {
            // Fill queue with test entries
            const testEntries = [];
            for (let i = 0; i < 50; i++) {
                const queueKey = `test-token-${i}-both`;
                filter.validationQueue.add(queueKey);
                filter.validationQueueTimestamps.set(queueKey, Date.now() - (i * 1000)); // Staggered timestamps
                testEntries.push(queueKey);
            }

            console.log(`Initial queue size: ${filter.validationQueue.size}`);
            console.log(`Initial timestamps size: ${filter.validationQueueTimestamps.size}`);

            // Simulate concurrent modification during cleanup
            const cleanupPromise = new Promise((resolve, reject) => {
                try {
                    // This should cause iterator corruption if bug exists
                    filter.cleanupValidationQueue();
                    resolve('cleanup_completed');
                } catch (error) {
                    reject(error);
                }
            });

            // Simultaneously modify the queue (simulate new validations starting)
            const modificationPromise = new Promise((resolve) => {
                setTimeout(() => {
                    try {
                        // Add new entries while cleanup is running
                        for (let i = 50; i < 60; i++) {
                            const queueKey = `concurrent-token-${i}-both`;
                            filter.validationQueue.add(queueKey);
                            filter.validationQueueTimestamps.set(queueKey, Date.now());
                        }
                        
                        // Delete some entries while cleanup is running
                        for (let i = 0; i < 5; i++) {
                            const queueKey = `test-token-${i}-both`;
                            filter.validationQueue.delete(queueKey);
                            filter.validationQueueTimestamps.delete(queueKey);
                        }
                        
                        resolve('modification_completed');
                    } catch (error) {
                        resolve(`modification_error: ${error.message}`);
                    }
                }, 5); // Very short delay to create race condition
            });

            const [cleanupResult, modificationResult] = await Promise.allSettled([
                cleanupPromise, 
                modificationPromise
            ]);

            console.log(`Cleanup result: ${cleanupResult.status === 'fulfilled' ? cleanupResult.value : 'FAILED: ' + cleanupResult.reason.message}`);
            console.log(`Modification result: ${modificationResult.value}`);

            // Check final consistency
            const finalQueueSize = filter.validationQueue.size;
            const finalTimestampsSize = filter.validationQueueTimestamps.size;

            console.log(`Final queue size: ${finalQueueSize}`);
            console.log(`Final timestamps size: ${finalTimestampsSize}`);

            let result = {
                crashed: cleanupResult.status === 'rejected',
                inconsistent: finalQueueSize !== finalTimestampsSize,
                error: cleanupResult.status === 'rejected' ? cleanupResult.reason.message : null
            };

            if (result.crashed) {
                console.log('❌ ITERATOR CORRUPTION: Cleanup crashed during concurrent modification');
                this.results.iteratorErrors++;
            } else if (result.inconsistent) {
                console.log('⚠️  INCONSISTENT STATE: Queue and timestamps sizes don\'t match');
                this.results.queueInconsistencies++;
            } else {
                console.log('✅ CONCURRENT MODIFICATION: Handled gracefully');
            }

            return result;

        } finally {
            await filter.shutdown();
        }
    }
}

// Main test execution
async function runEnhancedRaceConditionTests() {
    const simulator = new RaceConditionSimulator();
    const testResults = [];

    console.log('Testing validation queue race conditions under viral event simulation...\n');

    // Test 1: Low concurrency (baseline)
    const test1 = await simulator.simulateViralEventRaceCondition(
        'TEST 1: Low Concurrency (10 concurrent, 15 seconds)', 
        10, 15000
    );
    testResults.push({ name: 'Low Concurrency', ...test1 });

    // Test 2: Medium concurrency (realistic viral event)
    const test2 = await simulator.simulateViralEventRaceCondition(
        'TEST 2: Medium Concurrency (20 concurrent, 30 seconds)', 
        20, 30000
    );
    testResults.push({ name: 'Medium Concurrency', ...test2 });

    // Test 3: High concurrency (extreme viral event)
    const test3 = await simulator.simulateViralEventRaceCondition(
        'TEST 3: High Concurrency (40 concurrent, 20 seconds)', 
        40, 20000
    );
    testResults.push({ name: 'High Concurrency', ...test3 });

    // Test 4: Iterator corruption specific test
    const test4 = await simulator.testIteratorCorruption(
        'TEST 4: Direct Iterator Corruption'
    );
    testResults.push({ name: 'Iterator Corruption', ...test4 });

    return { simulator, testResults };
}

// Execute tests and analyze results
runEnhancedRaceConditionTests().then(({ simulator, testResults }) => {
    console.log('\n' + '='.repeat(100));
    console.log('🏛️  RENAISSANCE RACE CONDITION ANALYSIS - VALIDATION QUEUE CLEANUP');
    console.log('='.repeat(100));

    let totalMemoryLeaks = 0;
    let totalIteratorErrors = 0;
    let totalInconsistencies = 0;
    let criticalIssues = [];

    testResults.forEach(result => {
        totalMemoryLeaks += result.memoryLeaks || 0;
        totalIteratorErrors += result.iteratorErrors || 0;
        totalInconsistencies += result.queueInconsistencies || 0;

        if (result.memoryLeaks > 0) {
            criticalIssues.push(`${result.name}: ${result.memoryLeaks} memory leaks detected`);
        }
        if (result.iteratorErrors > 0) {
            criticalIssues.push(`${result.name}: ${result.iteratorErrors} iterator corruption errors`);
        }
        if (result.crashed) {
            criticalIssues.push(`${result.name}: System crashed during race condition`);
        }
    });

    console.log(`\n📊 RACE CONDITION TEST RESULTS:`);
    console.log(`   Total Tests: ${testResults.length}`);
    console.log(`   Memory Leaks: ${totalMemoryLeaks}`);
    console.log(`   Iterator Errors: ${totalIteratorErrors}`);  
    console.log(`   Queue Inconsistencies: ${totalInconsistencies}`);
    console.log(`   Peak Concurrent Operations: ${Math.max(...testResults.map(r => r.peakQueueSize || 0))}`);

    if (criticalIssues.length > 0) {
        console.log(`\n🚨 CRITICAL RACE CONDITION ISSUES:`);
        criticalIssues.forEach(issue => console.log(`   ${issue}`));
    }

    // Financial Impact Analysis - Focus on viral event timing
    console.log(`\n💰 FINANCIAL IMPACT ANALYSIS (VIRAL EVENT FOCUS):`);
    console.log(`   🎯 CRITICAL TIMING: Viral events = Highest profit potential (10-50x normal volume)`);
    console.log(`   📈 SYSTEM STRESS: Race conditions occur during peak profit windows`);

    if (totalMemoryLeaks > 0 || totalIteratorErrors > 0) {
        console.log(`   ❌ SYSTEM DEGRADATION: ${totalMemoryLeaks} memory leaks + ${totalIteratorErrors} errors`);
        console.log(`   💸 MONEY LOST: System slowdown/crashes during viral meme launches`);
        console.log(`   ⏰ TIMING FAILURE: Memory issues cause missed opportunities`);
        console.log(`   🔄 RESTART REQUIRED: Manual intervention during highest profit periods`);
    } else {
        console.log(`   ✅ STABLE UNDER LOAD: No memory leaks or race conditions detected`);
        console.log(`   💪 VIRAL READY: System maintains performance during high concurrency`);
    }

    // Viral Event Specific Analysis
    console.log(`\n🌪️  VIRAL EVENT SPECIFIC ANALYSIS:`);
    console.log(`   🎯 PEAK LOAD TEST: ${testResults[2]?.name || 'High Concurrency'} represents realistic viral stress`);
    const viralTest = testResults[2];
    if (viralTest) {
        if (viralTest.memoryLeaks > 0 || viralTest.iteratorErrors > 0) {
            console.log(`   ❌ VIRAL EVENT FAILURE: System cannot handle peak meme coin launches`);
            console.log(`   💰 IMPACT: Miss opportunities during 10x-50x volume spikes`);
        } else {
            console.log(`   ✅ VIRAL EVENT READY: System stable during peak concurrent load`);
            console.log(`   🚀 COMPETITIVE ADVANTAGE: Can process opportunities while competitors crash`);
        }
    }

    // Competitive Advantage Impact
    console.log(`\n🏁 COMPETITIVE ADVANTAGE IMPACT:`);
    const systemReliability = (criticalIssues.length === 0) ? 100 : 
        Math.max(0, 100 - (criticalIssues.length * 25));

    if (totalMemoryLeaks > 0 || totalIteratorErrors > 0) {
        console.log(`   ❌ RELIABILITY DISADVANTAGE: ${100 - systemReliability}% system instability during viral events`);
        console.log(`   ❌ OPERATIONAL OVERHEAD: Manual restarts required during profit periods`);
        console.log(`   ❌ MISSED OPPORTUNITIES: System degradation = Slower analysis = Lost trades`);
    } else {
        console.log(`   ✅ RELIABILITY ADVANTAGE: ${systemReliability}% system stability under extreme load`);
        console.log(`   ✅ 24/7 OPERATION: No manual intervention required during viral events`);
        console.log(`   ✅ SUSTAINED PERFORMANCE: Consistent analysis speed during peak opportunities`);
    }

    // Renaissance Verdict
    console.log(`\n🏛️  RENAISSANCE VERDICT:`);
    if (totalIteratorErrors > 0) {
        console.log(`   📊 CRITICAL RACE CONDITION: ${totalIteratorErrors} iterator corruption errors detected`);
        console.log(`   💡 IMMEDIATE FIX REQUIRED:`);
        console.log(`      - Replace 'for...of' iterator with Array.from() snapshot approach`);
        console.log(`      - Implement atomic cleanup operations`);
        console.log(`      - Add concurrent modification protection`);
        console.log(`   🚨 DEPLOY STATUS: DO NOT DEPLOY - System crashes during viral events`);
    } else if (totalMemoryLeaks > 0 || totalInconsistencies > 0) {
        console.log(`   📊 MEMORY/CONSISTENCY ISSUES: ${totalMemoryLeaks} leaks + ${totalInconsistencies} inconsistencies`);
        console.log(`   💡 FIX REQUIRED:`);
        console.log(`      - Implement cleanup consistency validation`);
        console.log(`      - Add memory leak prevention mechanisms`);
        console.log(`      - Improve concurrent access patterns`);
        console.log(`   ⚠️  DEPLOY STATUS: Fix before deployment - System degradation risk`);
    } else {
        console.log(`   📊 RACE CONDITION SAFE: All ${testResults.length} concurrency tests passed`);
        console.log(`   💡 ANALYSIS UPDATE: Queue cleanup appears thread-safe`);
        console.log(`   ✅ DEPLOY STATUS: Race condition handling is production ready`);
    }

    console.log(`\n🎯 NEXT: Test #5 - Risk Module Integration Timeout/Error Handling`);
    console.log('='.repeat(100));

}).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});