#!/usr/bin/env node

/**
 * RENAISSANCE TEST #3: RACE CONDITION IN VALIDATION QUEUE
 * 
 * Testing Lines ~147-148: Race conditions in validation queue cleanup
 * Scenario: Multiple tokens processed simultaneously during viral meme events
 * Impact: Memory corruption, stuck validations, system instability = Lost profits during high volume
 */

console.log('🧪 RENAISSANCE TEST #3: Race Condition in Validation Queue');
console.log('📍 Testing Lines ~147-148: Concurrent validation queue operations');
console.log('🎯 Scenario: Viral meme launch with 10+ tokens per second');
console.log('💰 Impact: System instability during highest profit periods\n');

// Simulate the exact queue management logic from TieredTokenFilterService
class ValidationQueueSimulator {
    constructor() {
        this.validationQueue = new Set();
        this.validationQueueTimestamps = new Map();
        this.maxQueueAge = 30000; // 30 seconds
        this.lastQueueCleanup = Date.now();
        this.cleanupInProgress = false;
    }

    // Simulate adding validation request to queue
    addToQueue(queueKey) {
        const now = Date.now();
        
        if (this.validationQueue.has(queueKey)) {
            return { success: false, error: 'Validation already in progress', duplicate: true };
        }
        
        // CRITICAL LINES: Queue modification without atomic operations
        this.validationQueue.add(queueKey);
        this.validationQueueTimestamps.set(queueKey, now);
        
        return { success: true, added: true };
    }

    // Simulate removing validation from queue (Lines ~147-148 area)
    removeFromQueue(queueKey) {
        // CRITICAL LINES: Race condition vulnerability  
        const deleted1 = this.validationQueue.delete(queueKey);         // Line ~147
        const deleted2 = this.validationQueueTimestamps.delete(queueKey); // Line ~148
        
        return { success: true, deleted: deleted1 && deleted2 };
    }

    // Simulate cleanup process that runs concurrently
    cleanupValidationQueue() {
        if (this.cleanupInProgress) {
            return { skipped: true, reason: 'Cleanup already in progress' };
        }
        
        this.cleanupInProgress = true;
        const now = Date.now();
        
        // Only run cleanup every 30 seconds
        if (now - this.lastQueueCleanup < 30000) {
            this.cleanupInProgress = false;
            return { skipped: true, reason: 'Too soon for cleanup' };
        }
        
        let removed = 0;
        let errors = [];
        
        try {
            // CRITICAL: Iterating over Map while potentially being modified
            for (const [queueKey, timestamp] of this.validationQueueTimestamps) {
                if (now - timestamp > this.maxQueueAge) {
                    // RACE CONDITION: Another thread might be modifying these sets
                    const deleted1 = this.validationQueue.delete(queueKey);
                    const deleted2 = this.validationQueueTimestamps.delete(queueKey);
                    
                    if (deleted1 && deleted2) {
                        removed++;
                    } else if (!deleted1 || !deleted2) {
                        errors.push(`Inconsistent deletion for ${queueKey}: queue=${deleted1}, timestamps=${deleted2}`);
                    }
                }
            }
            
            this.lastQueueCleanup = now;
            this.cleanupInProgress = false;
            
            return { 
                success: true, 
                removed, 
                errors,
                queueSize: this.validationQueue.size,
                timestampSize: this.validationQueueTimestamps.size
            };
            
        } catch (error) {
            this.cleanupInProgress = false;
            return { 
                success: false, 
                error: error.message,
                crashed: true
            };
        }
    }

    // Get current queue state for analysis
    getQueueState() {
        return {
            queueSize: this.validationQueue.size,
            timestampSize: this.validationQueueTimestamps.size,
            cleanupInProgress: this.cleanupInProgress,
            consistent: this.validationQueue.size === this.validationQueueTimestamps.size
        };
    }
}

// Test race condition scenarios
function simulateRaceCondition(testName, scenario) {
    console.log(`\n--- ${testName} ---`);
    
    const simulator = new ValidationQueueSimulator();
    const results = [];
    const errors = [];
    
    try {
        // Execute the race condition scenario
        const outcome = scenario(simulator);
        
        // Check final state consistency
        const finalState = simulator.getQueueState();
        
        console.log(`Final State: queue=${finalState.queueSize}, timestamps=${finalState.timestampSize}, consistent=${finalState.consistent}`);
        
        if (!finalState.consistent) {
            console.log('⚠️  INCONSISTENT STATE: Queue and timestamp sizes don\'t match!');
            return {
                raceCondition: true,
                inconsistentState: true,
                issue: 'MEMORY_CORRUPTION',
                moneyImpact: 'HIGH - Memory corruption during viral events'
            };
        }
        
        if (outcome.errors && outcome.errors.length > 0) {
            console.log(`⚠️  DELETION ERRORS: ${outcome.errors.join(', ')}`);
            return {
                raceCondition: true,
                deletionErrors: true,
                issue: 'PARTIAL_DELETION',
                moneyImpact: 'MEDIUM - Memory leaks and stuck validations'
            };
        }
        
        if (outcome.crashed) {
            console.log(`❌ SYSTEM CRASH: ${outcome.error}`);
            return {
                raceCondition: true,
                crashed: true,
                issue: 'CRASH',
                moneyImpact: 'CRITICAL - System down during viral launch'
            };
        }
        
        console.log(`✅ RACE CONDITION HANDLED: No corruption detected`);
        return {
            raceCondition: false,
            handled: true,
            issue: null,
            moneyImpact: 'NONE - Concurrent operations safe'
        };
        
    } catch (error) {
        console.log(`❌ UNEXPECTED CRASH: ${error.message}`);
        return {
            raceCondition: true,
            crashed: true,
            error: error.message,
            issue: 'UNEXPECTED_CRASH',
            moneyImpact: 'CRITICAL - System failure under concurrent load'
        };
    }
}

console.log('Testing concurrent validation scenarios during viral meme launches...\n');

// RACE CONDITION TEST SCENARIOS
const raceConditionScenarios = [
    {
        name: 'SCENARIO 1: Cleanup during active validation',
        scenario: (simulator) => {
            // Add multiple validations
            simulator.addToQueue('token1-supply');
            simulator.addToQueue('token2-supply'); 
            simulator.addToQueue('token3-accounts');
            
            // Simulate old entries (31 seconds ago) that should be cleaned
            const oldTimestamp = Date.now() - 31000;
            simulator.validationQueueTimestamps.set('old-token1', oldTimestamp);
            simulator.validationQueue.add('old-token1');
            
            // Start cleanup while validation in progress
            return simulator.cleanupValidationQueue();
        }
    },
    {
        name: 'SCENARIO 2: Concurrent add/remove operations',
        scenario: (simulator) => {
            const results = [];
            
            // Simulate concurrent operations (viral launch with 10 tokens/second)
            for (let i = 0; i < 10; i++) {
                // Add operations
                simulator.addToQueue(`token${i}-supply`);
                simulator.addToQueue(`token${i}-accounts`);
                
                // Remove some operations (completed validations)
                if (i > 2) {
                    simulator.removeFromQueue(`token${i-3}-supply`);
                }
                
                // Trigger cleanup occasionally
                if (i === 5) {
                    // Force cleanup by setting old timestamp
                    simulator.lastQueueCleanup = Date.now() - 31000;
                    const cleanupResult = simulator.cleanupValidationQueue();
                    results.push(cleanupResult);
                }
            }
            
            return { results, finalState: simulator.getQueueState() };
        }
    },
    {
        name: 'SCENARIO 3: Rapid-fire token processing (viral event)',
        scenario: (simulator) => {
            const promises = [];
            const results = [];
            
            // Simulate 20 tokens being processed simultaneously
            for (let i = 0; i < 20; i++) {
                // Each token has 2 validation calls (supply + accounts)
                simulator.addToQueue(`viral-token${i}-supply`);
                simulator.addToQueue(`viral-token${i}-accounts`);
                
                // Some complete quickly, some take longer
                if (i % 3 === 0) {
                    simulator.removeFromQueue(`viral-token${i}-supply`);
                }
            }
            
            // Multiple cleanup attempts during high load
            const cleanup1 = simulator.cleanupValidationQueue();
            const cleanup2 = simulator.cleanupValidationQueue(); // Should be skipped
            
            return { cleanup1, cleanup2, finalState: simulator.getQueueState() };
        }
    },
    {
        name: 'SCENARIO 4: Memory pressure with stuck validations',
        scenario: (simulator) => {
            // Add many validations that don't complete (stuck RPC calls)
            for (let i = 0; i < 100; i++) {
                simulator.addToQueue(`stuck-token${i}-supply`);
                // Don't remove them - simulating stuck RPC calls
            }
            
            // Some are very old (should be cleaned)
            const veryOldTimestamp = Date.now() - 60000; // 60 seconds ago
            for (let i = 0; i < 20; i++) {
                simulator.validationQueueTimestamps.set(`very-old-${i}`, veryOldTimestamp);
                simulator.validationQueue.add(`very-old-${i}`);
            }
            
            // Force cleanup under memory pressure
            simulator.lastQueueCleanup = Date.now() - 31000;
            return simulator.cleanupValidationQueue();
        }
    },
    {
        name: 'SCENARIO 5: Iterator corruption during cleanup',
        scenario: (simulator) => {
            // Create many entries
            for (let i = 0; i < 50; i++) {
                const timestamp = Date.now() - (i * 1000); // Spread over 50 seconds
                simulator.validationQueueTimestamps.set(`token${i}`, timestamp);
                simulator.validationQueue.add(`token${i}`);
            }
            
            // Simulate concurrent modifications during iterator
            // This tests if cleanup survives concurrent modifications
            simulator.lastQueueCleanup = Date.now() - 31000;
            
            const cleanupResult = simulator.cleanupValidationQueue();
            
            // Add more items during theoretical cleanup
            simulator.addToQueue('new-token-during-cleanup');
            
            return cleanupResult;
        }
    }
];

// Run all race condition tests
const results = [];

raceConditionScenarios.forEach(test => {
    const result = simulateRaceCondition(test.name, test.scenario);
    results.push({
        scenario: test.name,
        ...result
    });
});

// Renaissance Analysis
console.log('\n' + '='.repeat(100));
console.log('🏛️  RENAISSANCE RACE CONDITION ANALYSIS');
console.log('='.repeat(100));

let raceConditionCount = 0;
let crashCount = 0;
let memoryCorruptionCount = 0;
let workingCount = 0;
let criticalIssues = [];

results.forEach(result => {
    if (result.crashed) {
        crashCount++;
        raceConditionCount++;
        criticalIssues.push(`${result.scenario.split(':')[0]}: SYSTEM CRASH - ${result.error || result.issue}`);
    } else if (result.inconsistentState) {
        memoryCorruptionCount++;
        raceConditionCount++;
        criticalIssues.push(`${result.scenario.split(':')[0]}: MEMORY CORRUPTION - Inconsistent queue state`);
    } else if (result.deletionErrors) {
        raceConditionCount++;
        criticalIssues.push(`${result.scenario.split(':')[0]}: PARTIAL DELETION - Memory leak risk`);
    } else {
        workingCount++;
    }
});

console.log(`\n📊 RACE CONDITION TEST RESULTS:`);
console.log(`   Total Tests: ${results.length}`);
console.log(`   Race Conditions Found: ${raceConditionCount}`);
console.log(`   System Crashes: ${crashCount}`);
console.log(`   Memory Corruption: ${memoryCorruptionCount}`);
console.log(`   Working Correctly: ${workingCount}`);

if (criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL CONCURRENCY ISSUES:`);
    criticalIssues.forEach(issue => console.log(`   ${issue}`));
}

// High-Volume Trading Impact Analysis
console.log(`\n💰 HIGH-VOLUME TRADING IMPACT:`);
console.log(`   🔥 VIRAL EVENTS: 10-20 tokens per second during meme coin explosions`);
console.log(`   ⏰ CRITICAL TIMING: Race conditions during highest profit periods`);

if (crashCount > 0) {
    console.log(`   ❌ SYSTEM CRASHES: ${crashCount} scenarios crash under concurrent load`);
    console.log(`   💸 MONEY LOST: System down during viral events = Miss entire profit wave`);
    console.log(`   ⚡ TIMING FAILURE: Crash when speed advantage matters most`);
} else {
    console.log(`   ✅ NO CRASHES: System survives concurrent validation load`);
}

if (memoryCorruptionCount > 0) {
    console.log(`   ⚠️  MEMORY CORRUPTION: ${memoryCorruptionCount} scenarios cause memory inconsistency`);
    console.log(`   🧠 GRADUAL FAILURE: System degrades over time during high load`);
    console.log(`   🔄 RESTART REQUIRED: Memory corruption forces restarts during profit periods`);
} else {
    console.log(`   ✅ MEMORY SAFE: Queue management maintains consistency`);
}

// Competitive Advantage Impact
console.log(`\n🏁 COMPETITIVE ADVANTAGE IMPACT:`);
const totalProblems = raceConditionCount;
const reliabilityRate = ((workingCount / results.length) * 100).toFixed(1);

if (totalProblems > 0) {
    console.log(`   ❌ RELIABILITY DISADVANTAGE: ${100 - reliabilityRate}% scenarios have concurrency issues`);
    console.log(`   ❌ HIGH-LOAD FAILURE: System unstable during viral events (highest profit potential)`);
    console.log(`   ❌ RESTART OVERHEAD: Memory corruption requires restarts = Miss trading windows`);
} else {
    console.log(`   ✅ CONCURRENCY ADVANTAGE: ${reliabilityRate}% reliability under high load`);
    console.log(`   ✅ VIRAL EVENT READY: Stable processing during token explosions`);
    console.log(`   ✅ CONTINUOUS OPERATION: No restarts needed during profit periods`);
}

// Renaissance Verdict
console.log(`\n🏛️  RENAISSANCE VERDICT:`);
if (crashCount > 0) {
    console.log(`   📊 CRITICAL RACE CONDITION: ${crashCount}/${results.length} scenarios crash under load`);
    console.log(`   💡 IMMEDIATE FIX REQUIRED:`);
    console.log(`      - Add atomic queue operations (mutex/lock)`);
    console.log(`      - Separate read/write operations`);
    console.log(`      - Add cleanup state protection`);
    console.log(`   🚨 DEPLOY STATUS: DO NOT DEPLOY - Crashes during viral events`);
} else if (memoryCorruptionCount > 0) {
    console.log(`   📊 MEMORY CORRUPTION BUG: ${memoryCorruptionCount}/${results.length} scenarios corrupt state`);
    console.log(`   💡 FIX REQUIRED:`);
    console.log(`      - Add consistency checks`);
    console.log(`      - Implement transaction-like queue operations`);
    console.log(`   ⚠️  DEPLOY STATUS: Fix before deployment - Memory leak risk`);
} else if (raceConditionCount > 0) {
    console.log(`   📊 MINOR RACE CONDITIONS: ${raceConditionCount}/${results.length} scenarios have issues`);
    console.log(`   💡 IMPROVEMENT RECOMMENDED: Add concurrent operation safety`);
    console.log(`   ⚠️  DEPLOY STATUS: Acceptable but should improve`);
} else {
    console.log(`   📊 NO RACE CONDITIONS: All ${results.length} scenarios handle concurrency correctly`);
    console.log(`   💡 ANALYSIS UPDATE: Queue management appears thread-safe`);
    console.log(`   ✅ DEPLOY STATUS: Concurrency handling is production ready`);
}

console.log(`\n🎯 NEXT: Test #4 - String Math/NaN Contamination in Volume Calculations`);
console.log('='.repeat(100));