/**
 * Test that circuit breaker correctly updates timestamps on each transition
 * This is the expected behavior - each transition should reset timers
 */

import { CircuitBreaker } from './src/detection/core/circuit-breaker.js';

console.log('🔧 Testing Timestamp Updates on Each Transition...\n');

// Helper to sleep for a given time
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  // Test 1: Each call to _transitionToOpen should update timestamps
  console.log('Test 1: Multiple transitions to OPEN update timestamps');
  try {
    const breaker = new CircuitBreaker('test', { 
      cooldownMs: 1000, 
      jitterMs: 0 // No jitter for predictable testing
    });
    
    // First transition
    breaker._transitionToOpen();
    const firstOpenedAt = breaker.openedAt;
    const firstHalfOpenAt = breaker.halfOpenAt;
    const firstStateChange = breaker.stats.lastStateChange.getTime();
    
    // Wait a bit
    await sleep(50);
    
    // Second transition
    breaker._transitionToOpen();
    const secondOpenedAt = breaker.openedAt;
    const secondHalfOpenAt = breaker.halfOpenAt;
    const secondStateChange = breaker.stats.lastStateChange.getTime();
    
    // Verify timestamps were updated
    if (secondOpenedAt > firstOpenedAt) {
      console.log('✅ openedAt updated on second transition');
      console.log(`   First: ${firstOpenedAt}, Second: ${secondOpenedAt}`);
    } else {
      console.log('❌ openedAt NOT updated on second transition');
    }
    
    if (secondHalfOpenAt > firstHalfOpenAt) {
      console.log('✅ halfOpenAt updated on second transition');
      console.log(`   First: ${firstHalfOpenAt}, Second: ${secondHalfOpenAt}`);
    } else {
      console.log('❌ halfOpenAt NOT updated on second transition');
    }
    
    if (secondStateChange > firstStateChange) {
      console.log('✅ lastStateChange updated on second transition');
    } else {
      console.log('❌ lastStateChange NOT updated on second transition');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 2: Verify cooldown period resets on each transition
  console.log('\nTest 2: Cooldown period resets on each transition');
  try {
    const breaker = new CircuitBreaker('test', { 
      cooldownMs: 100, 
      jitterMs: 0 
    });
    
    // First open
    breaker._transitionToOpen();
    const firstCooldownEnd = breaker.halfOpenAt;
    
    // Wait 60ms (more than half the cooldown)
    await sleep(60);
    
    // Open again - should reset the cooldown
    breaker._transitionToOpen();
    const secondCooldownEnd = breaker.halfOpenAt;
    
    // The new cooldown end should be ~60ms later than the first
    const difference = secondCooldownEnd - firstCooldownEnd;
    
    if (difference >= 50 && difference <= 70) {
      console.log('✅ Cooldown period correctly reset');
      console.log(`   Difference: ${difference}ms (expected ~60ms)`);
    } else {
      console.log('❌ Cooldown period not reset correctly');
      console.log(`   Difference: ${difference}ms (expected ~60ms)`);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 3: Rapid transitions should each get new timestamps
  console.log('\nTest 3: Rapid transitions each get unique timestamps');
  try {
    const breaker = new CircuitBreaker('test', { 
      cooldownMs: 1000, 
      jitterMs: 0 
    });
    
    const timestamps = [];
    
    // Make 5 rapid transitions
    for (let i = 0; i < 5; i++) {
      breaker._transitionToOpen();
      timestamps.push({
        openedAt: breaker.openedAt,
        halfOpenAt: breaker.halfOpenAt
      });
      await sleep(1); // Tiny delay to ensure time advances
    }
    
    // Check that all timestamps are unique and increasing
    let allUnique = true;
    let allIncreasing = true;
    
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i].openedAt <= timestamps[i-1].openedAt) {
        allIncreasing = false;
      }
      if (timestamps[i].openedAt === timestamps[i-1].openedAt) {
        allUnique = false;
      }
    }
    
    if (allIncreasing) {
      console.log('✅ All timestamps are increasing');
    } else {
      console.log('❌ Timestamps are not strictly increasing');
    }
    
    if (allUnique) {
      console.log('✅ All timestamps are unique');
    } else {
      console.log('❌ Some timestamps are duplicated');
    }
    
    // Show the progression
    console.log('   Timestamp progression:');
    timestamps.forEach((ts, i) => {
      console.log(`   ${i+1}. openedAt: ${ts.openedAt}, halfOpenAt: ${ts.halfOpenAt}`);
    });
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 4: Verify behavior matches circuit breaker pattern
  console.log('\nTest 4: Behavior matches circuit breaker pattern expectations');
  try {
    const breaker = new CircuitBreaker('test', { 
      cooldownMs: 200, 
      jitterMs: 0 
    });
    
    console.log('Simulating real-world scenario:');
    
    // Initial failure opens circuit
    breaker._transitionToOpen();
    const initialOpen = breaker.halfOpenAt;
    console.log(`   Circuit opened, will try again at: ${new Date(initialOpen).toISOString()}`);
    
    // Wait 100ms (half cooldown)
    await sleep(100);
    
    // Another failure while open should reset the timer
    // This prevents the circuit from transitioning to half-open too soon
    breaker._transitionToOpen();
    const resetOpen = breaker.halfOpenAt;
    console.log(`   Another failure detected, timer reset to: ${new Date(resetOpen).toISOString()}`);
    
    if (resetOpen > initialOpen) {
      console.log('✅ Timer correctly extended after additional failure');
      console.log(`   Extended by: ${resetOpen - initialOpen}ms`);
    } else {
      console.log('❌ Timer not extended after additional failure');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n🏁 Timestamp update testing complete!');
  console.log('\n📝 Summary: Circuit Breaker Timestamp Behavior');
  console.log('- Each transition to OPEN updates ALL timestamps');
  console.log('- Cooldown period resets on each transition');
  console.log('- This prevents premature recovery attempts');
  console.log('- Matches standard circuit breaker pattern');
  console.log('- Ensures consistent cooldown after latest failure');
}

// Run the tests
runTests().catch(console.error);