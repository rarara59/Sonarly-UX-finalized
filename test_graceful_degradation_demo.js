#!/usr/bin/env node

/**
 * Demo of graceful degradation behavior
 */

console.log('🧪 GRACEFUL DEGRADATION BEHAVIOR DEMO');
console.log('📍 Demonstrating partial failure handling\n');

// Simulate the partial success logic
async function simulatePartialFailureHandling() {
    console.log('Simulating RPC calls with partial failures...\n');
    
    const scenarios = [
        {
            name: 'Scenario 1: Both calls succeed',
            hasSuccess: true,
            data: { supply: 'supply data', accounts: 'accounts data' },
            expected: 'Immediate success return'
        },
        {
            name: 'Scenario 2: Only supply succeeds',
            hasSuccess: true,
            data: { supply: 'supply data' },
            expected: 'Immediate success return'
        },
        {
            name: 'Scenario 3: Only accounts succeed',
            hasSuccess: true,
            data: { accounts: 'accounts data' },
            expected: 'Immediate success return'
        },
        {
            name: 'Scenario 4: All calls fail (no data)',
            hasSuccess: false,
            data: {},
            expected: 'Complete failure'
        },
        {
            name: 'Scenario 5: Partial data exists after retries',
            hasSuccess: false,
            data: { supply: 'partial supply' },
            expected: 'Partial success with tracking'
        }
    ];
    
    let partialFailures = 0;
    
    for (const scenario of scenarios) {
        console.log(`\n${scenario.name}:`);
        console.log(`  hasSuccess: ${scenario.hasSuccess}`);
        console.log(`  data: ${JSON.stringify(scenario.data)}`);
        
        // Apply the logic from the service
        if (scenario.hasSuccess) {
            console.log(`  → Result: SUCCESS (immediate return)`);
            console.log(`  → Partial: NO`);
        } else {
            // Check if we have partial data
            if (!scenario.hasSuccess && !scenario.data.supply && !scenario.data.accounts) {
                console.log(`  → Result: FAILED (no data available)`);
            } else {
                partialFailures++;
                console.log(`  → Result: SUCCESS (partial data)`);
                console.log(`  → Partial: YES`);
                console.log(`  → Partial failures counter: ${partialFailures}`);
            }
        }
        console.log(`  Expected: ${scenario.expected}`);
    }
    
    return partialFailures;
}

// Simulate cached data fallback
async function simulateCachedDataFallback() {
    console.log('\n\n--- Cached Data Fallback Demo ---\n');
    
    const metadata = { partial: true, supply: '1000000' };
    
    console.log('Metadata fetch returned:', metadata);
    
    if (metadata?.partial) {
        console.log('📋 Partial flag detected, checking for cached data...');
        
        const cachedData = {
            supply: '500000',
            name: 'Cached Token',
            symbol: 'CACHED',
            decimals: 9
        };
        
        console.log('Cached data found:', cachedData);
        console.log('📋 Using cached data due to partial RPC failure');
        
        const merged = { ...cachedData, ...metadata, cached: true };
        console.log('Merged result:', merged);
        
        return merged;
    }
    
    return metadata;
}

// Run the simulation
async function runDemo() {
    const partialCount = await simulatePartialFailureHandling();
    const cachedResult = await simulateCachedDataFallback();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 GRACEFUL DEGRADATION DEMO RESULTS');
    console.log('='.repeat(60));
    console.log(`\nPartial failures tracked: ${partialCount}`);
    console.log(`Cached data used: ${cachedResult.cached ? 'YES' : 'NO'}`);
    console.log('\n🎯 KEY BEHAVIORS:');
    console.log('  1. Immediate success when any RPC call succeeds');
    console.log('  2. Partial success after all retries with some data');
    console.log('  3. Complete failure only when no data available');
    console.log('  4. Cached data supplements partial results');
    console.log('  5. Statistics track partial failure occurrences');
}

runDemo().catch(console.error);