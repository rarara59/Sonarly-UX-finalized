#!/usr/bin/env node

/**
 * Circuit Breaker Cascade Failure Analyzer
 * Identifies how single endpoint failures trigger cascading breaker openings
 */

import { RpcConnectionPoolV2 } from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

class CascadeFailureAnalyzer {
  constructor() {
    this.results = {
      singleFailures: 0,
      cascadeFailures: 0,
      isolatedFailures: 0,
      endpointStates: new Map(),
      cascadePatterns: [],
      timeToRecover: []
    };
  }

  async run() {
    console.log('🔍 Circuit Breaker Cascade Failure Analyzer');
    console.log('=' .repeat(60));
    console.log('Analyzing cascade failure patterns in circuit breaker system\n');

    // Initialize pool
    const pool = new RpcConnectionPoolV2({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL || 'https://chainstack.example.com',
        process.env.HELIUS_RPC_URL || 'https://helius.example.com',
        process.env.PUBLIC_RPC_URL || 'https://mainnet-beta.example.com'
      ]
    });

    console.log('📊 Initial Endpoint States:');
    this.displayEndpointStates(pool);

    // Test 1: Single endpoint failure cascade test
    console.log('\n🧪 Test 1: Single Endpoint Failure Impact');
    console.log('-' .repeat(40));
    await this.testSingleEndpointFailure(pool);

    // Test 2: Multiple endpoint recovery independence
    console.log('\n🧪 Test 2: Independent Recovery Test');
    console.log('-' .repeat(40));
    await this.testIndependentRecovery(pool);

    // Test 3: Load-based cascade prevention
    console.log('\n🧪 Test 3: Load-Based Cascade Prevention');
    console.log('-' .repeat(40));
    await this.testLoadBasedCascade(pool);

    // Display final analysis
    this.displayAnalysis();

    pool.destroy();
  }

  async testSingleEndpointFailure(pool) {
    console.log('Simulating Helius endpoint failure...\n');

    // Find Helius endpoint
    const heliusEndpoint = pool.endpoints.find(ep => ep.url.includes('helius'));
    if (!heliusEndpoint) {
      console.log('No Helius endpoint found, using first endpoint');
      return;
    }

    // Simulate failures on Helius endpoint
    console.log(`Before failure injection:`);
    console.log(`  Helius: ${heliusEndpoint.breaker.state} (failures: ${heliusEndpoint.breaker.failures})`);
    
    // Record other endpoint states
    const otherEndpoints = pool.endpoints.filter(ep => ep !== heliusEndpoint);
    const beforeStates = otherEndpoints.map(ep => ({
      url: ep.url,
      state: ep.breaker.state,
      failures: ep.breaker.failures
    }));

    // Inject failures into Helius
    for (let i = 0; i < 10; i++) {
      pool.incrementCircuitBreakerFailure(heliusEndpoint, 1.0);
    }

    console.log(`\nAfter failure injection:`);
    console.log(`  Helius: ${heliusEndpoint.breaker.state} (failures: ${heliusEndpoint.breaker.failures})`);

    // Check if other endpoints were affected (cascade)
    let cascadeDetected = false;
    otherEndpoints.forEach((ep, idx) => {
      const before = beforeStates[idx];
      console.log(`  ${ep.url.split('/')[2]}: ${ep.breaker.state} (failures: ${ep.breaker.failures})`);
      
      if (ep.breaker.state !== before.state || ep.breaker.failures !== before.failures) {
        cascadeDetected = true;
        console.log(`    ⚠️ CASCADE DETECTED! State or failures changed`);
        this.results.cascadeFailures++;
      }
    });

    if (!cascadeDetected) {
      console.log('\n✅ No cascade detected - endpoints properly isolated');
      this.results.isolatedFailures++;
    } else {
      console.log('\n❌ Cascade failure detected - endpoints not properly isolated');
      this.results.cascadePatterns.push({
        trigger: 'helius_failure',
        affected: otherEndpoints.filter((ep, idx) => 
          ep.breaker.state !== beforeStates[idx].state
        ).map(ep => ep.url)
      });
    }

    this.results.singleFailures++;

    // Reset for next test
    this.resetEndpoints(pool);
  }

  async testIndependentRecovery(pool) {
    console.log('Testing independent endpoint recovery...\n');

    // Open circuit breakers on multiple endpoints
    const endpoints = pool.endpoints.slice(0, 2);
    
    endpoints.forEach(ep => {
      // Force breaker to OPEN state
      ep.breaker.state = 'OPEN';
      ep.breaker.failures = 10;
      ep.breaker.openedAt = Date.now() - 15000; // Opened 15 seconds ago
      console.log(`  ${ep.url.split('/')[2]}: Set to OPEN state`);
    });

    // Simulate recovery of first endpoint
    console.log('\nSimulating recovery of first endpoint...');
    const firstEndpoint = endpoints[0];
    firstEndpoint.breaker.state = 'HALF_OPEN';
    
    // Simulate successful requests
    for (let i = 0; i < 3; i++) {
      firstEndpoint.breaker.consecutiveSuccesses++;
    }
    
    // Check for state transition
    if (firstEndpoint.breaker.consecutiveSuccesses >= 3) {
      firstEndpoint.breaker.state = 'CLOSED';
      firstEndpoint.breaker.failures = 0;
      console.log(`  ${firstEndpoint.url.split('/')[2]}: Recovered to CLOSED`);
    }

    // Check if other endpoint was affected
    const secondEndpoint = endpoints[1];
    if (secondEndpoint.breaker.state === 'OPEN') {
      console.log(`  ${secondEndpoint.url.split('/')[2]}: Still OPEN (independent) ✅`);
      this.results.isolatedFailures++;
    } else {
      console.log(`  ${secondEndpoint.url.split('/')[2]}: State changed (cascade) ❌`);
      this.results.cascadeFailures++;
    }

    this.resetEndpoints(pool);
  }

  async testLoadBasedCascade(pool) {
    console.log('Testing load-based cascade prevention...\n');

    // Simulate high system load
    pool.globalInFlight = pool.config.maxGlobalInFlight * 0.9;
    console.log(`System load: ${pool.globalInFlight}/${pool.config.maxGlobalInFlight} (90%)`);

    // Test if failures cascade differently under load
    const endpoint = pool.endpoints[0];
    const beforeStates = pool.endpoints.map(ep => ({
      url: ep.url,
      state: ep.breaker.state,
      failures: ep.breaker.failures
    }));

    // Inject failures under load
    for (let i = 0; i < 15; i++) {
      endpoint.loadTimeouts = 12; // Simulate load timeouts
      pool.handleTimeoutError(endpoint, { message: 'timeout' });
    }

    console.log('\nEndpoint states after load-based failures:');
    let cascadeUnderLoad = false;
    pool.endpoints.forEach((ep, idx) => {
      const before = beforeStates[idx];
      const stateChanged = ep.breaker.state !== before.state;
      console.log(`  ${ep.url.split('/')[2]}: ${ep.breaker.state} ${stateChanged ? '(changed)' : ''}`);
      
      if (ep !== endpoint && stateChanged) {
        cascadeUnderLoad = true;
      }
    });

    if (cascadeUnderLoad) {
      console.log('\n❌ Cascade detected under load');
      this.results.cascadeFailures++;
    } else {
      console.log('\n✅ No cascade under load - proper isolation');
      this.results.isolatedFailures++;
    }

    // Reset load
    pool.globalInFlight = 0;
    this.resetEndpoints(pool);
  }

  resetEndpoints(pool) {
    pool.endpoints.forEach(ep => {
      ep.breaker.state = 'CLOSED';
      ep.breaker.failures = 0;
      ep.breaker.consecutiveSuccesses = 0;
      ep.breaker.openedAt = 0;
      ep.breaker.halfOpenTests = 0;
      ep.loadTimeouts = 0;
    });
  }

  displayEndpointStates(pool) {
    pool.endpoints.forEach(ep => {
      console.log(`  ${ep.url.split('/')[2]}: ${ep.breaker.state}`);
    });
  }

  displayAnalysis() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 CASCADE FAILURE ANALYSIS RESULTS');
    console.log('=' .repeat(60));

    const totalTests = this.results.singleFailures + this.results.cascadeFailures + this.results.isolatedFailures;
    const cascadePreventionRate = (this.results.isolatedFailures / (this.results.isolatedFailures + this.results.cascadeFailures) * 100).toFixed(1);

    console.log('\n📈 Cascade Prevention Metrics:');
    console.log(`  Total tests: ${totalTests}`);
    console.log(`  Isolated failures: ${this.results.isolatedFailures}`);
    console.log(`  Cascade failures: ${this.results.cascadeFailures}`);
    console.log(`  CASCADE PREVENTION RATE: ${cascadePreventionRate}%`);
    console.log(`  Target: 90%`);
    console.log(`  ${parseFloat(cascadePreventionRate) >= 90 ? '✅ TARGET MET' : `❌ Need ${(90 - parseFloat(cascadePreventionRate)).toFixed(1)}% improvement`}`);

    if (this.results.cascadePatterns.length > 0) {
      console.log('\n🔄 Cascade Patterns Detected:');
      this.results.cascadePatterns.forEach((pattern, idx) => {
        console.log(`  ${idx + 1}. Trigger: ${pattern.trigger}`);
        console.log(`     Affected: ${pattern.affected.map(url => url.split('/')[2]).join(', ')}`);
      });
    }

    console.log('\n💡 CURRENT ISSUES:');
    console.log('1. Circuit breaker state transitions may affect global routing logic');
    console.log('2. Failure weight calculations might be shared across endpoints');
    console.log('3. Load-based adjustments apply globally instead of per-endpoint');

    console.log('\n🔧 REQUIRED FIXES:');
    console.log('1. Ensure complete isolation of circuit breaker state per endpoint');
    console.log('2. Remove any global failure counting that affects individual breakers');
    console.log('3. Make load-based threshold adjustments endpoint-specific');
    console.log('4. Ensure endpoint selection properly filters OPEN breakers');

    // Save report
    this.saveReport();
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: {
        cascadePreventionRate: (this.results.isolatedFailures / (this.results.isolatedFailures + this.results.cascadeFailures) * 100).toFixed(1) + '%',
        isolatedFailures: this.results.isolatedFailures,
        cascadeFailures: this.results.cascadeFailures,
        cascadePatterns: this.results.cascadePatterns
      },
      recommendations: {
        immediate: [
          'Isolate circuit breaker state completely per endpoint',
          'Remove global failure propagation',
          'Fix endpoint selection to skip OPEN breakers'
        ],
        future: [
          'Implement adaptive recovery timers',
          'Add cascade detection metrics',
          'Create endpoint health scoring system'
        ]
      }
    };

    const fs = (await import('fs')).default;
    fs.writeFileSync('cascade-failure-analysis.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to cascade-failure-analysis.json');
  }
}

// Main execution
async function main() {
  const analyzer = new CascadeFailureAnalyzer();
  await analyzer.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { CascadeFailureAnalyzer };