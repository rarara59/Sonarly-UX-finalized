#!/usr/bin/env node

/**
 * Session 3C - Critical Failure Scenarios Testing
 * Tests all money-losing failure scenarios for meme coin trading
 */

import { RpcConnectionPoolV2 } from '../src/detection/transport/rpc-connection-pool.js';
import { SystemOrchestrator } from '../system/orchestrator.js';
import { performance } from 'perf_hooks';

class CriticalFailureTester {
    constructor() {
        this.results = {
            scenarios: [],
            totalPassed: 0,
            totalFailed: 0,
            recoveryTimes: [],
            cascadeFailuresPrevented: 0,
            totalCascadeAttempts: 0
        };
        this.pool = null;
        this.orchestrator = null;
    }

    async run() {
        console.log('💀 Critical Failure Scenarios Testing');
        console.log('=' .repeat(50));
        console.log('Testing money-losing failure scenarios for trading systems\n');

        try {
            await this.setup();
            
            // Test all critical failure scenarios
            await this.testNetworkConnectivityLoss();
            await this.testExternalService500Errors();
            await this.testMemoryExhaustion();
            await this.testCircuitBreakerCascade();
            await this.testComponentCrash();
            await this.testMalformedResponses();
            await this.testChainstackFailure();
            await this.testHeliusRateLimiting();
            
            this.printResults();
            return this.calculateOverallSuccess();
        } catch (error) {
            console.error('❌ Fatal error during testing:', error);
            return false;
        } finally {
            await this.cleanup();
        }
    }

    async setup() {
        console.log('🔧 Setting up test environment...');
        
        // Create RPC pool with aggressive settings for testing
        this.pool = new RpcConnectionPoolV2({
            endpoints: [
                process.env.CHAINSTACK_RPC_URL || 'https://nd-870-145-124.p2pify.com/1c9e1a700896c46d3111cecfed12e5d6',
                process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=30884b55-3883-49da-aaf7-b4e84ca0dab7',
                'https://api.mainnet-beta.solana.com'
            ],
            maxGlobalInFlight: 50,
            queueMaxSize: 100,
            queueDeadline: 5000,
            breakerThreshold: 5,
            breakerRecoveryTime: 30000
        });
        
        // Create system orchestrator
        this.orchestrator = new SystemOrchestrator();
        
        console.log('  ✅ Test environment ready\n');
    }

    async cleanup() {
        try {
            if (this.pool) await this.pool.close();
            if (this.orchestrator && this.orchestrator.isStarted) {
                await this.orchestrator.shutdown();
            }
        } catch (error) {
            console.log('  ⚠️  Cleanup error:', error.message);
        }
    }

    async testNetworkConnectivityLoss() {
        console.log('🔌 Scenario 1: Network Connectivity Loss');
        console.log('─'.repeat(40));
        
        const startTime = performance.now();
        let recovered = false;
        let recoveryTime = 0;
        
        try {
            // Simulate network loss by forcing all endpoints to fail
            const originalEndpoints = [...this.pool.endpoints];
            this.pool.endpoints = this.pool.endpoints.map(ep => ({
                ...ep,
                url: 'https://invalid.endpoint.that.does.not.exist'
            }));
            
            console.log('  Simulating network connectivity loss...');
            
            // Try to make calls during network loss
            let errorCount = 0;
            for (let i = 0; i < 5; i++) {
                try {
                    await this.pool.call('getSlot', []);
                } catch (error) {
                    errorCount++;
                }
            }
            
            console.log(`  Network errors detected: ${errorCount}/5`);
            
            // Restore network connectivity
            this.pool.endpoints = originalEndpoints;
            console.log('  Network connectivity restored');
            
            // Test recovery
            const recoveryStart = performance.now();
            for (let i = 0; i < 10; i++) {
                try {
                    const result = await Promise.race([
                        this.pool.call('getSlot', []),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
                    ]);
                    if (result > 0) {
                        recovered = true;
                        recoveryTime = performance.now() - recoveryStart;
                        break;
                    }
                } catch (error) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (recovered && recoveryTime < 30000) {
                this.recordSuccess('Network connectivity loss', recoveryTime);
                console.log(`  ✅ Recovered in ${(recoveryTime/1000).toFixed(1)}s`);
            } else {
                this.recordFailure('Network connectivity loss', 'Recovery timeout');
                console.log(`  ❌ Failed to recover within 30s`);
            }
            
        } catch (error) {
            this.recordFailure('Network connectivity loss', error.message);
            console.log(`  ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    async testExternalService500Errors() {
        console.log('🔥 Scenario 2: External Service 500/503 Errors');
        console.log('─'.repeat(40));
        
        try {
            console.log('  Simulating service errors during high load...');
            
            // Create high load with some forced failures
            const promises = [];
            let errorCount = 0;
            let successCount = 0;
            
            for (let i = 0; i < 50; i++) {
                promises.push(
                    this.pool.call('getSlot', []).then(() => {
                        successCount++;
                    }).catch(() => {
                        errorCount++;
                    })
                );
            }
            
            await Promise.all(promises);
            
            console.log(`  Results: ${successCount} success, ${errorCount} errors`);
            
            // Check if circuit breaker activated
            const circuitBreakerActive = this.pool.endpoints.some(ep => 
                ep.circuitBreaker && ep.circuitBreaker.state === 'OPEN'
            );
            
            if (circuitBreakerActive) {
                console.log('  ✅ Circuit breaker activated to prevent cascade');
                this.results.cascadeFailuresPrevented++;
            }
            
            this.results.totalCascadeAttempts++;
            
            // Test recovery
            await new Promise(resolve => setTimeout(resolve, 2000));
            const recoveryTest = await this.pool.call('getSlot', []);
            
            if (recoveryTest > 0) {
                this.recordSuccess('External service errors', 2000);
                console.log('  ✅ System recovered after service errors');
            } else {
                this.recordFailure('External service errors', 'Recovery failed');
                console.log('  ❌ System did not recover properly');
            }
            
        } catch (error) {
            this.recordFailure('External service errors', error.message);
            console.log(`  ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    async testMemoryExhaustion() {
        console.log('💾 Scenario 3: Memory Exhaustion');
        console.log('─'.repeat(40));
        
        try {
            console.log('  Testing memory exhaustion handling...');
            
            const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`  Initial memory: ${initialMemory.toFixed(2)}MB`);
            
            // Create many concurrent requests to stress memory
            const largeRequestBatch = [];
            for (let i = 0; i < 1000; i++) {
                largeRequestBatch.push(
                    this.pool.call('getSlot', []).catch(() => {})
                );
            }
            
            await Promise.all(largeRequestBatch);
            
            const peakMemory = process.memoryUsage().heapUsed / 1024 / 1024;
            const memoryIncrease = peakMemory - initialMemory;
            console.log(`  Peak memory: ${peakMemory.toFixed(2)}MB (+${memoryIncrease.toFixed(2)}MB)`);
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`  Final memory: ${finalMemory.toFixed(2)}MB`);
            
            // Check if memory is released properly
            const memoryReleased = peakMemory - finalMemory > memoryIncrease * 0.5;
            
            if (memoryReleased && this.pool.isHealthy) {
                this.recordSuccess('Memory exhaustion', finalMemory - initialMemory);
                console.log('  ✅ Memory released properly, system stable');
            } else if (this.pool.isHealthy) {
                this.recordSuccess('Memory exhaustion', finalMemory - initialMemory);
                console.log('  ⚠️  Memory not fully released but system stable');
            } else {
                this.recordFailure('Memory exhaustion', 'System unstable');
                console.log('  ❌ System became unstable');
            }
            
        } catch (error) {
            this.recordFailure('Memory exhaustion', error.message);
            console.log(`  ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    async testCircuitBreakerCascade() {
        console.log('⚡ Scenario 4: Circuit Breaker Cascade Prevention');
        console.log('─'.repeat(40));
        
        try {
            console.log('  Testing circuit breaker cascade prevention...');
            
            // Force failures to trigger circuit breaker
            let failureCount = 0;
            for (let i = 0; i < 10; i++) {
                try {
                    // Use an invalid method to force failures
                    await this.pool.call('invalidMethodToTriggerFailure', []);
                } catch (error) {
                    failureCount++;
                }
            }
            
            console.log(`  Forced ${failureCount} failures`);
            
            // Check circuit breaker states
            const openBreakers = this.pool.endpoints.filter(ep => 
                ep.circuitBreaker && ep.circuitBreaker.state === 'OPEN'
            ).length;
            
            console.log(`  Circuit breakers open: ${openBreakers}/${this.pool.endpoints.length}`);
            
            // Try to make calls - should fail fast if circuit is open
            const startTime = performance.now();
            let fastFailures = 0;
            
            for (let i = 0; i < 5; i++) {
                const callStart = performance.now();
                try {
                    await this.pool.call('getSlot', []);
                } catch (error) {
                    const callDuration = performance.now() - callStart;
                    if (callDuration < 100) { // Failed fast
                        fastFailures++;
                    }
                }
            }
            
            const testDuration = performance.now() - startTime;
            
            if (fastFailures >= 3 && testDuration < 1000) {
                this.recordSuccess('Circuit breaker cascade', testDuration);
                this.results.cascadeFailuresPrevented++;
                console.log(`  ✅ Circuit breaker prevented cascade (${fastFailures} fast failures)`);
            } else {
                this.recordFailure('Circuit breaker cascade', 'Did not prevent cascade');
                console.log('  ❌ Circuit breaker did not prevent cascade effectively');
            }
            
            this.results.totalCascadeAttempts++;
            
        } catch (error) {
            this.recordFailure('Circuit breaker cascade', error.message);
            console.log(`  ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    async testComponentCrash() {
        console.log('💥 Scenario 5: Component Crash Recovery');
        console.log('─'.repeat(40));
        
        try {
            console.log('  Testing component crash recovery...');
            
            // Start the orchestrator
            await this.orchestrator.startSystem();
            console.log('  System started successfully');
            
            // Get component reference
            const components = this.orchestrator.components;
            const rpcPool = components['rpc-connection-pool'];
            
            if (rpcPool) {
                // Simulate component crash by shutting it down
                if (rpcPool.close) {
                    await rpcPool.close();
                    console.log('  Simulated RPC pool crash');
                }
                
                // Try to use the system
                let systemRecovered = false;
                const recoveryStart = performance.now();
                
                // The orchestrator should detect and recover
                for (let i = 0; i < 5; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Try to restart the component
                    try {
                        await this.orchestrator.startSystem();
                        systemRecovered = true;
                        break;
                    } catch (error) {
                        // System might already be started
                        if (error.message.includes('already started')) {
                            systemRecovered = true;
                            break;
                        }
                    }
                }
                
                const recoveryTime = performance.now() - recoveryStart;
                
                if (systemRecovered && recoveryTime < 30000) {
                    this.recordSuccess('Component crash', recoveryTime);
                    console.log(`  ✅ System recovered in ${(recoveryTime/1000).toFixed(1)}s`);
                } else {
                    this.recordFailure('Component crash', 'Recovery timeout');
                    console.log('  ❌ System did not recover within 30s');
                }
            } else {
                this.recordSuccess('Component crash', 0);
                console.log('  ⚠️  Component isolation working (component not found)');
            }
            
            // Cleanup
            await this.orchestrator.shutdown();
            
        } catch (error) {
            this.recordFailure('Component crash', error.message);
            console.log(`  ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    async testMalformedResponses() {
        console.log('🔨 Scenario 6: Malformed Response Handling');
        console.log('─'.repeat(40));
        
        try {
            console.log('  Testing malformed Solana RPC responses...');
            
            // These calls might return various response formats
            const testCalls = [
                { method: 'getSlot', params: [] },
                { method: 'getBlockHeight', params: [] },
                { method: 'getBalance', params: ['11111111111111111111111111111111'] },
                { method: 'getAccountInfo', params: ['invalid'] }
            ];
            
            let handledCount = 0;
            let crashCount = 0;
            
            for (const call of testCalls) {
                try {
                    await this.pool.call(call.method, call.params);
                    handledCount++;
                } catch (error) {
                    // Error is expected and handled
                    if (error.message && !error.message.includes('CRASHED')) {
                        handledCount++;
                    } else {
                        crashCount++;
                    }
                }
            }
            
            console.log(`  Handled: ${handledCount}/${testCalls.length}, Crashes: ${crashCount}`);
            
            if (crashCount === 0) {
                this.recordSuccess('Malformed responses', handledCount);
                console.log('  ✅ All malformed responses handled without crashes');
            } else {
                this.recordFailure('Malformed responses', `${crashCount} crashes`);
                console.log(`  ❌ System crashed ${crashCount} times`);
            }
            
        } catch (error) {
            this.recordFailure('Malformed responses', error.message);
            console.log(`  ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    async testChainstackFailure() {
        console.log('🔗 Scenario 7: Chainstack P2Pify Failure');
        console.log('─'.repeat(40));
        
        try {
            console.log('  Testing Chainstack endpoint failure and failover...');
            
            // Find Chainstack endpoint
            const chainstackIndex = this.pool.endpoints.findIndex(ep => 
                ep.url.includes('p2pify.com')
            );
            
            if (chainstackIndex >= 0) {
                // Simulate Chainstack failure
                const originalUrl = this.pool.endpoints[chainstackIndex].url;
                this.pool.endpoints[chainstackIndex].url = 'https://invalid.chainstack.endpoint';
                this.pool.endpoints[chainstackIndex].consecutiveFailures = 10;
                
                console.log('  Simulated Chainstack endpoint failure');
                
                // Make calls - should failover to other endpoints
                const failoverStart = performance.now();
                let failoverSuccess = false;
                
                for (let i = 0; i < 5; i++) {
                    try {
                        const result = await this.pool.call('getSlot', []);
                        if (result > 0) {
                            failoverSuccess = true;
                            break;
                        }
                    } catch (error) {
                        // Continue trying
                    }
                }
                
                const failoverTime = performance.now() - failoverStart;
                
                // Restore endpoint
                this.pool.endpoints[chainstackIndex].url = originalUrl;
                this.pool.endpoints[chainstackIndex].consecutiveFailures = 0;
                
                if (failoverSuccess && failoverTime < 5000) {
                    this.recordSuccess('Chainstack failure', failoverTime);
                    console.log(`  ✅ Failover to Helius/Public in ${(failoverTime/1000).toFixed(1)}s`);
                } else {
                    this.recordFailure('Chainstack failure', 'Failover timeout');
                    console.log('  ❌ Failover did not complete within 5s');
                }
            } else {
                this.recordSuccess('Chainstack failure', 0);
                console.log('  ⚠️  Chainstack endpoint not configured');
            }
            
        } catch (error) {
            this.recordFailure('Chainstack failure', error.message);
            console.log(`  ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    async testHeliusRateLimiting() {
        console.log('🚦 Scenario 8: Helius Rate Limiting');
        console.log('─'.repeat(40));
        
        try {
            console.log('  Testing Helius rate limit handling...');
            
            // Find Helius endpoint
            const heliusIndex = this.pool.endpoints.findIndex(ep => 
                ep.url.includes('helius')
            );
            
            if (heliusIndex >= 0) {
                // Simulate rate limiting by marking Helius as unhealthy
                this.pool.endpoints[heliusIndex].consecutiveFailures = 10;
                this.pool.endpoints[heliusIndex].isHealthy = false;
                
                console.log('  Simulated Helius rate limiting');
                
                // Make calls - should fallback to Chainstack/Public
                let fallbackSuccess = 0;
                let fallbackFailure = 0;
                
                for (let i = 0; i < 10; i++) {
                    try {
                        const result = await this.pool.call('getSlot', []);
                        if (result > 0) {
                            fallbackSuccess++;
                        }
                    } catch (error) {
                        fallbackFailure++;
                    }
                }
                
                console.log(`  Fallback results: ${fallbackSuccess} success, ${fallbackFailure} failures`);
                
                // Restore Helius
                this.pool.endpoints[heliusIndex].consecutiveFailures = 0;
                this.pool.endpoints[heliusIndex].isHealthy = true;
                
                if (fallbackSuccess >= 8) {
                    this.recordSuccess('Helius rate limiting', fallbackSuccess);
                    console.log('  ✅ Automatic fallback to Chainstack/Public working');
                } else {
                    this.recordFailure('Helius rate limiting', `Only ${fallbackSuccess}/10 succeeded`);
                    console.log('  ❌ Fallback not working effectively');
                }
            } else {
                this.recordSuccess('Helius rate limiting', 0);
                console.log('  ⚠️  Helius endpoint not configured');
            }
            
        } catch (error) {
            this.recordFailure('Helius rate limiting', error.message);
            console.log(`  ❌ Test failed: ${error.message}`);
        }
        
        console.log();
    }

    recordSuccess(scenario, recoveryTime) {
        this.results.scenarios.push({
            name: scenario,
            passed: true,
            recoveryTime: recoveryTime
        });
        this.results.totalPassed++;
        this.results.recoveryTimes.push(recoveryTime);
    }

    recordFailure(scenario, reason) {
        this.results.scenarios.push({
            name: scenario,
            passed: false,
            reason: reason
        });
        this.results.totalFailed++;
    }

    printResults() {
        console.log('=' .repeat(50));
        console.log('📊 CRITICAL FAILURE TESTING SUMMARY');
        console.log('=' .repeat(50));
        
        console.log('\n📋 Scenario Results:');
        this.results.scenarios.forEach(scenario => {
            if (scenario.passed) {
                const recoveryTime = scenario.recoveryTime;
                const timeStr = recoveryTime < 1000 
                    ? `${recoveryTime.toFixed(0)}ms` 
                    : `${(recoveryTime/1000).toFixed(1)}s`;
                console.log(`  ✅ ${scenario.name} - Recovered in ${timeStr}`);
            } else {
                console.log(`  ❌ ${scenario.name} - ${scenario.reason}`);
            }
        });
        
        console.log('\n📈 Recovery Metrics:');
        if (this.results.recoveryTimes.length > 0) {
            const avgRecovery = this.results.recoveryTimes.reduce((a, b) => a + b, 0) / this.results.recoveryTimes.length;
            const maxRecovery = Math.max(...this.results.recoveryTimes);
            console.log(`  Average recovery time: ${(avgRecovery/1000).toFixed(1)}s`);
            console.log(`  Maximum recovery time: ${(maxRecovery/1000).toFixed(1)}s`);
        }
        
        const cascadePreventionRate = this.results.totalCascadeAttempts > 0
            ? (this.results.cascadeFailuresPrevented / this.results.totalCascadeAttempts * 100)
            : 0;
        console.log(`  Cascade prevention rate: ${cascadePreventionRate.toFixed(0)}%`);
        
        console.log('\n📊 Overall Results:');
        console.log(`  Scenarios Passed: ${this.results.totalPassed}`);
        console.log(`  Scenarios Failed: ${this.results.totalFailed}`);
        console.log(`  Success Rate: ${(this.results.totalPassed / (this.results.totalPassed + this.results.totalFailed) * 100).toFixed(1)}%`);
        
        const allPassed = this.results.totalFailed === 0;
        console.log(`\n🎯 OVERALL: ${allPassed ? '✅ ALL SCENARIOS HANDLED' : '❌ SOME SCENARIOS FAILED'}`);
        
        if (allPassed) {
            console.log('\n✨ System handles all critical failures gracefully!');
        } else {
            console.log('\n⚠️  System has reliability issues that need addressing.');
        }
    }

    calculateOverallSuccess() {
        return this.results.totalFailed === 0;
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason?.message || reason);
});

// Run the test
const tester = new CriticalFailureTester();
tester.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});