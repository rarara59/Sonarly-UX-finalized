/**
 * RENAISSANCE TEST #12: NETWORK PARTITION HANDLING
 * 
 * What: System behavior during network connectivity issues
 * How: Simulate network splits, intermittent connectivity, DNS failures
 * Why: Network issues are common during high-load events
 * Money Impact: HIGH - Network issues during viral events = System isolation
 * 
 * Run: node test_12_network_partition.js
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';
import { performance } from 'perf_hooks';

// Network simulation states
const NETWORK_STATES = {
    HEALTHY: 'healthy',
    SLOW: 'slow',
    INTERMITTENT: 'intermittent', 
    PARTIAL: 'partial',
    DNS_FAILURE: 'dns_failure',
    COMPLETE_OUTAGE: 'complete_outage',
    PACKET_LOSS: 'packet_loss',
    HIGH_LATENCY: 'high_latency'
};

// Enhanced Mock RPC Manager for network testing
class NetworkPartitionRpcManager {
    constructor() {
        this.networkState = NETWORK_STATES.HEALTHY;
        this.endpoints = [
            'https://helius.rpc.endpoint.com',
            'https://chainstack.backup.com',
            'https://fallback.solana.com'
        ];
        this.currentEndpoint = 0;
        this.endpointHealth = new Map();
        this.callHistory = [];
        this.rotationCount = 0;
        this.networkStats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            timeouts: 0,
            dnsFailures: 0,
            connectionErrors: 0
        };
        
        // Initialize endpoint health
        this.endpoints.forEach(endpoint => {
            this.endpointHealth.set(endpoint, {
                healthy: true,
                lastFailure: null,
                consecutiveFailures: 0,
                totalCalls: 0,
                successRate: 100
            });
        });
    }
    
    async call(method, params) {
        this.networkStats.totalCalls++;
        const endpoint = this.endpoints[this.currentEndpoint];
        const health = this.endpointHealth.get(endpoint);
        health.totalCalls++;
        
        const callStart = performance.now();
        const callRecord = {
            timestamp: Date.now(),
            method,
            endpoint,
            networkState: this.networkState,
            success: false,
            error: null,
            latency: 0
        };
        
        try {
            // Simulate network conditions based on current state
            const result = await this._simulateNetworkCall(method, params);
            
            callRecord.success = true;
            callRecord.latency = performance.now() - callStart;
            this.networkStats.successfulCalls++;
            
            // Update endpoint health
            health.consecutiveFailures = 0;
            health.successRate = (health.successRate * 0.9) + (100 * 0.1); // Moving average
            
            this.callHistory.push(callRecord);
            return result;
            
        } catch (error) {
            callRecord.error = error.message;
            callRecord.latency = performance.now() - callStart;
            this.networkStats.failedCalls++;
            
            // Update endpoint health
            health.consecutiveFailures++;
            health.lastFailure = Date.now();
            health.successRate = (health.successRate * 0.9) + (0 * 0.1); // Moving average
            
            // Track specific error types
            if (error.code === 'TIMEOUT') {
                this.networkStats.timeouts++;
            } else if (error.code === 'DNS_FAILURE') {
                this.networkStats.dnsFailures++;
            } else if (error.code === 'CONNECTION_ERROR') {
                this.networkStats.connectionErrors++;
            }
            
            this.callHistory.push(callRecord);
            throw error;
        }
    }
    
    async _simulateNetworkCall(method, params) {
        const endpoint = this.endpoints[this.currentEndpoint];
        
        switch (this.networkState) {
            case NETWORK_STATES.HEALTHY:
                await this._sleep(Math.random() * 50 + 10); // 10-60ms normal latency
                break;
                
            case NETWORK_STATES.SLOW:
                await this._sleep(Math.random() * 2000 + 500); // 500-2500ms slow
                break;
                
            case NETWORK_STATES.INTERMITTENT:
                if (Math.random() < 0.4) { // 40% failure rate
                    throw new Error('INTERMITTENT_FAILURE: Connection lost');
                }
                await this._sleep(Math.random() * 200 + 50);
                break;
                
            case NETWORK_STATES.PARTIAL:
                // Only certain endpoints work
                if (this.currentEndpoint === 0) {
                    throw new Error('PRIMARY_ENDPOINT_DOWN: Network partition');
                }
                await this._sleep(Math.random() * 100 + 20);
                break;
                
            case NETWORK_STATES.DNS_FAILURE:
                throw new Error('DNS_FAILURE: Cannot resolve hostname');
                
            case NETWORK_STATES.COMPLETE_OUTAGE:
                throw new Error('NETWORK_DOWN: Complete connectivity loss');
                
            case NETWORK_STATES.PACKET_LOSS:
                if (Math.random() < 0.2) { // 20% packet loss
                    throw new Error('PACKET_LOSS: Request timeout');
                }
                await this._sleep(Math.random() * 500 + 100); // Variable latency
                break;
                
            case NETWORK_STATES.HIGH_LATENCY:
                await this._sleep(Math.random() * 5000 + 1000); // 1-6 second latency
                break;
                
            default:
                await this._sleep(50);
        }
        
        // Return appropriate mock response
        return this._getMockResponse(method, params);
    }
    
    _getMockResponse(method, params) {
        if (method === 'getTokenSupply') {
            return {
                value: {
                    amount: '1000000000',
                    decimals: 9,
                    uiAmount: 1000
                }
            };
        } else if (method === 'getTokenLargestAccounts') {
            return {
                value: [
                    { amount: '500000000', owner: 'TestOwner1' },
                    { amount: '300000000', owner: 'TestOwner2' }
                ]
            };
        } else if (method === 'getAccountInfo') {
            return {
                value: {
                    data: {
                        parsed: {
                            info: {
                                decimals: 9,
                                supply: '1000000000',
                                mintAuthority: null,
                                freezeAuthority: null,
                                isInitialized: true
                            }
                        }
                    }
                }
            };
        }
        
        return { value: {} };
    }
    
    async rotateEndpoint() {
        this.rotationCount++;
        this.currentEndpoint = (this.currentEndpoint + 1) % this.endpoints.length;
        
        // Simulate endpoint rotation delay
        await this._sleep(Math.random() * 100 + 50);
        
        console.log(`🔄 Rotated to endpoint ${this.currentEndpoint}: ${this.endpoints[this.currentEndpoint]}`);
    }
    
    // Network state control methods
    setNetworkState(state) {
        console.log(`🌐 Network state changed: ${this.networkState} → ${state}`);
        this.networkState = state;
    }
    
    simulateNetworkRecovery() {
        this.networkState = NETWORK_STATES.HEALTHY;
        // Reset some endpoint health
        this.endpointHealth.forEach(health => {
            health.consecutiveFailures = Math.max(0, health.consecutiveFailures - 1);
        });
    }
    
    simulateEndpointFailure(endpointIndex) {
        const endpoint = this.endpoints[endpointIndex];
        const health = this.endpointHealth.get(endpoint);
        health.healthy = false;
        health.consecutiveFailures = 10;
        health.lastFailure = Date.now();
    }
    
    getNetworkStats() {
        const totalCalls = this.networkStats.totalCalls;
        const successRate = totalCalls > 0 ? (this.networkStats.successfulCalls / totalCalls) * 100 : 0;
        const avgLatency = this.callHistory.length > 0 ? 
            this.callHistory.reduce((sum, call) => sum + call.latency, 0) / this.callHistory.length : 0;
        
        return {
            ...this.networkStats,
            successRate: Math.round(successRate * 10) / 10,
            avgLatency: Math.round(avgLatency * 10) / 10,
            endpointRotations: this.rotationCount,
            currentEndpoint: this.currentEndpoint,
            networkState: this.networkState,
            endpointHealth: Object.fromEntries(this.endpointHealth)
        };
    }
    
    getRecentFailures(minutes = 5) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.callHistory
            .filter(call => call.timestamp > cutoff && !call.success)
            .map(call => ({
                timestamp: call.timestamp,
                endpoint: call.endpoint,
                error: call.error,
                networkState: call.networkState
            }));
    }
    
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    reset() {
        this.networkState = NETWORK_STATES.HEALTHY;
        this.currentEndpoint = 0;
        this.rotationCount = 0;
        this.callHistory = [];
        this.networkStats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            timeouts: 0,
            dnsFailures: 0,
            connectionErrors: 0
        };
        
        // Reset endpoint health
        this.endpointHealth.forEach(health => {
            health.healthy = true;
            health.lastFailure = null;
            health.consecutiveFailures = 0;
            health.totalCalls = 0;
            health.successRate = 100;
        });
    }
}

// Network resilience monitoring
class NetworkResilienceMonitor {
    constructor() {
        this.scenarios = [];
        this.currentScenario = null;
    }
    
    startScenario(name, description) {
        this.currentScenario = {
            name,
            description,
            startTime: Date.now(),
            startPerf: performance.now(),
            events: [],
            metrics: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                avgResponseTime: 0,
                maxResponseTime: 0,
                endpointRotations: 0
            }
        };
        
        console.log(`📊 Starting network scenario: ${name}`);
        console.log(`   ${description}`);
    }
    
    recordEvent(type, details) {
        if (!this.currentScenario) return;
        
        this.currentScenario.events.push({
            type,
            timestamp: Date.now(),
            details
        });
    }
    
    endScenario(finalStats) {
        if (!this.currentScenario) return null;
        
        this.currentScenario.endTime = Date.now();
        this.currentScenario.endPerf = performance.now();
        this.currentScenario.duration = this.currentScenario.endTime - this.currentScenario.startTime;
        this.currentScenario.perfDuration = this.currentScenario.endPerf - this.currentScenario.startPerf;
        this.currentScenario.finalStats = finalStats;
        
        const scenario = { ...this.currentScenario };
        this.scenarios.push(scenario);
        
        console.log(`📊 Completed scenario: ${scenario.name} (${scenario.duration}ms)`);
        
        this.currentScenario = null;
        return scenario;
    }
    
    getResilienceReport() {
        return {
            totalScenarios: this.scenarios.length,
            scenarios: this.scenarios.map(scenario => ({
                name: scenario.name,
                duration: scenario.duration,
                successRate: scenario.finalStats?.successRate || 0,
                avgLatency: scenario.finalStats?.avgLatency || 0,
                endpointRotations: scenario.finalStats?.endpointRotations || 0,
                eventCount: scenario.events.length
            })),
            overallMetrics: this._calculateOverallMetrics()
        };
    }
    
    _calculateOverallMetrics() {
        if (this.scenarios.length === 0) return {};
        
        const totalDuration = this.scenarios.reduce((sum, s) => sum + s.duration, 0);
        const avgDuration = totalDuration / this.scenarios.length;
        const totalRotations = this.scenarios.reduce((sum, s) => sum + (s.finalStats?.endpointRotations || 0), 0);
        
        return {
            avgScenarioDuration: Math.round(avgDuration),
            totalEndpointRotations: totalRotations,
            scenariosCompleted: this.scenarios.length
        };
    }
}

// Test utilities
function createTestToken(index = 0, overrides = {}) {
    const baseAddress = `NetworkToken${index.toString().padStart(3, '0')}ABC456DEF789GHI`;
    return {
        tokenMint: baseAddress,
        address: baseAddress,
        baseMint: baseAddress,
        lpValueUSD: 5000 + (index * 100),
        detectedAt: Date.now() - (index * 1000),
        name: `Network Test Token ${index}`,
        symbol: `NET${index}`,
        uniqueWallets: 50 + index,
        ageMinutes: Math.floor(index / 10),
        ...overrides
    };
}

// Test Results Tracking
class TestResults {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.networkStats = {};
        this.resilienceReport = null;
    }
    
    add(name, passed, details = {}) {
        this.tests.push({ 
            name, 
            passed, 
            details,
            timestamp: Date.now() 
        });
        if (passed) {
            this.passed++;
        } else {
            this.failed++;
        }
    }
    
    setNetworkStats(stats) {
        this.networkStats = stats;
    }
    
    setResilienceReport(report) {
        this.resilienceReport = report;
    }
    
    summary() {
        console.log('\n=== TEST #12: NETWORK PARTITION HANDLING RESULTS ===');
        console.log(`Total Tests: ${this.tests.length}`);
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
        
        // Network resilience summary
        if (this.networkStats.totalCalls > 0) {
            console.log(`\n🌐 NETWORK RESILIENCE:`);
            console.log(`  Total Network Calls: ${this.networkStats.totalCalls}`);
            console.log(`  Success Rate: ${this.networkStats.successRate}%`);
            console.log(`  Average Latency: ${this.networkStats.avgLatency}ms`);
            console.log(`  Endpoint Rotations: ${this.networkStats.endpointRotations}`);
            console.log(`  Timeout Events: ${this.networkStats.timeouts}`);
            console.log(`  DNS Failures: ${this.networkStats.dnsFailures}`);
        }
        
        if (this.resilienceReport) {
            console.log(`\n📊 RESILIENCE SCENARIOS:`);
            this.resilienceReport.scenarios.forEach(scenario => {
                console.log(`  ${scenario.name}: ${scenario.successRate}% success, ${scenario.avgLatency}ms latency, ${scenario.endpointRotations} rotations`);
            });
        }
        
        if (this.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.tests.filter(t => !t.passed).forEach(test => {
                const error = test.details.error || 'Unknown failure';
                console.log(`  - ${test.name}: ${error}`);
            });
        }
        
        // Deployment recommendation
        console.log('\n🚨 DEPLOYMENT DECISION:');
        const highFailureRate = this.failed / this.tests.length > 0.3;
        const poorNetworkResilience = this.networkStats.successRate < 80;
        const excessiveTimeouts = this.networkStats.timeouts > this.networkStats.totalCalls * 0.2;
        
        if (this.failed === 0 && !poorNetworkResilience) {
            console.log('✅ DEPLOY IMMEDIATELY - Excellent network resilience');
        } else if (!highFailureRate && !excessiveTimeouts) {
            console.log('⚠️ DEPLOY WITH MONITORING - Good resilience with minor network handling issues');
        } else if (poorNetworkResilience || excessiveTimeouts) {
            console.log('🚫 DO NOT DEPLOY - Poor network resilience will cause isolation during viral events');
        } else {
            console.log('🚫 DO NOT DEPLOY - Network partition handling insufficient for production');
        }
    }
}

// Main test execution
async function runTest12() {
    console.log('🚀 Starting Renaissance Test #12: Network Partition Handling');
    console.log('Target: System behavior during network connectivity issues');
    console.log('Money Impact: HIGH - Network issues during viral events = System isolation\n');
    
    const results = new TestResults();
    const mockRpc = new NetworkPartitionRpcManager();
    const monitor = new NetworkResilienceMonitor();
    
    // Initialize filter service
    const filterService = new TieredTokenFilterService({
        rpcManager: mockRpc
    });
    
    await filterService.initialize();
    
    try {
        // ==================== TEST 12.1: Healthy Network Baseline ====================
        console.log('🌐 Test 12.1: Healthy Network Baseline');
        
        try {
            monitor.startScenario('Healthy Network', 'Establish baseline performance with good connectivity');
            
            const baselineTokens = Array.from({ length: 10 }, (_, i) => createTestToken(i));
            const baselineStart = performance.now();
            
            const baselinePromises = baselineTokens.map(token => filterService.processToken(token));
            const baselineResults = await Promise.allSettled(baselinePromises);
            const baselineTime = performance.now() - baselineStart;
            
            const baselineProcessed = baselineResults.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const baselineSuccessful = baselineProcessed >= 8; // At least 80% success
            const baselineFast = baselineTime < 2000; // Under 2 seconds
            
            const baselineStats = mockRpc.getNetworkStats();
            monitor.endScenario(baselineStats);
            
            results.add('12.1.1 - Healthy network baseline', baselineSuccessful && baselineFast, {
                processed: baselineProcessed,
                totalTime: Math.round(baselineTime),
                successRate: baselineStats.successRate,
                avgLatency: baselineStats.avgLatency,
                error: baselineSuccessful ? null : `Only ${baselineProcessed}/10 tokens processed`
            });
            
            console.log(`  ${baselineSuccessful && baselineFast ? '✅' : '❌'} Baseline: ${baselineProcessed}/10 processed in ${Math.round(baselineTime)}ms, ${baselineStats.successRate}% success rate`);
            
        } catch (error) {
            results.add('12.1.1 - Healthy network baseline', false, { error: error.message });
            console.log(`  ❌ Baseline test failed: ${error.message}`);
        }
        
        // ==================== TEST 12.2: Slow Network Conditions ====================
        console.log('\n🐌 Test 12.2: Slow Network Conditions');
        
        try {
            mockRpc.setNetworkState(NETWORK_STATES.SLOW);
            monitor.startScenario('Slow Network', 'High latency conditions (500-2500ms per request)');
            
            const slowTokens = Array.from({ length: 5 }, (_, i) => createTestToken(i + 100));
            const slowStart = performance.now();
            
            const slowPromises = slowTokens.map(token => filterService.processToken(token));
            const slowResults = await Promise.allSettled(slowPromises);
            const slowTime = performance.now() - slowStart;
            
            const slowProcessed = slowResults.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const slowSuccessful = slowProcessed >= 4; // At least 80% success
            const slowReasonable = slowTime < 30000; // Under 30 seconds for 5 tokens
            
            const slowStats = mockRpc.getNetworkStats();
            monitor.endScenario(slowStats);
            
            results.add('12.2.1 - Slow network handling', slowSuccessful && slowReasonable, {
                processed: slowProcessed,
                totalTime: Math.round(slowTime),
                avgLatency: slowStats.avgLatency,
                error: slowSuccessful && slowReasonable ? null : `Slow network: ${slowProcessed}/5 processed in ${Math.round(slowTime)}ms`
            });
            
            console.log(`  ${slowSuccessful && slowReasonable ? '✅' : '❌'} Slow network: ${slowProcessed}/5 processed in ${Math.round(slowTime)}ms, avg ${Math.round(slowStats.avgLatency)}ms latency`);
            
        } catch (error) {
            results.add('12.2.1 - Slow network handling', false, { error: error.message });
            console.log(`  ❌ Slow network test failed: ${error.message}`);
        }
        
        // ==================== TEST 12.3: Intermittent Connectivity ====================
        console.log('\n⚡ Test 12.3: Intermittent Connectivity');
        
        try {
            mockRpc.setNetworkState(NETWORK_STATES.INTERMITTENT);
            monitor.startScenario('Intermittent Network', '40% failure rate with random connection drops');
            
            const intermittentTokens = Array.from({ length: 15 }, (_, i) => createTestToken(i + 200));
            const intermittentStart = performance.now();
            
            const intermittentPromises = intermittentTokens.map(token => filterService.processToken(token));
            const intermittentResults = await Promise.allSettled(intermittentPromises);
            const intermittentTime = performance.now() - intermittentStart;
            
            const intermittentProcessed = intermittentResults.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const intermittentResilient = intermittentProcessed >= 10; // At least 66% success despite 40% network failures
            const intermittentRecovered = intermittentTime < 60000; // Under 1 minute
            
            const intermittentStats = mockRpc.getNetworkStats();
            monitor.endScenario(intermittentStats);
            
            results.add('12.3.1 - Intermittent connectivity resilience', intermittentResilient && intermittentRecovered, {
                processed: intermittentProcessed,
                totalTime: Math.round(intermittentTime),
                networkSuccessRate: intermittentStats.successRate,
                rotations: intermittentStats.endpointRotations,
                error: intermittentResilient ? null : `Poor resilience: ${intermittentProcessed}/15 processed`
            });
            
            console.log(`  ${intermittentResilient && intermittentRecovered ? '✅' : '❌'} Intermittent: ${intermittentProcessed}/15 processed in ${Math.round(intermittentTime)}ms, ${intermittentStats.endpointRotations} rotations`);
            
        } catch (error) {
            results.add('12.3.1 - Intermittent connectivity resilience', false, { error: error.message });
            console.log(`  ❌ Intermittent connectivity test failed: ${error.message}`);
        }
        
        // ==================== TEST 12.4: Partial Network Partition ====================
        console.log('\n🔀 Test 12.4: Partial Network Partition');
        
        try {
            mockRpc.setNetworkState(NETWORK_STATES.PARTIAL);
            monitor.startScenario('Partial Partition', 'Primary endpoint down, backup endpoints available');
            
            const partialTokens = Array.from({ length: 10 }, (_, i) => createTestToken(i + 300));
            const partialStart = performance.now();
            
            const partialPromises = partialTokens.map(token => filterService.processToken(token));
            const partialResults = await Promise.allSettled(partialPromises);
            const partialTime = performance.now() - partialStart;
            
            const partialProcessed = partialResults.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const partialFailover = partialProcessed >= 8; // At least 80% success via failover
            const partialRotated = mockRpc.getNetworkStats().endpointRotations > 0; // Should have rotated endpoints
            
            const partialStats = mockRpc.getNetworkStats();
            monitor.endScenario(partialStats);
            
            results.add('12.4.1 - Partial partition failover', partialFailover && partialRotated, {
                processed: partialProcessed,
                totalTime: Math.round(partialTime),
                rotations: partialStats.endpointRotations,
                currentEndpoint: partialStats.currentEndpoint,
                error: partialFailover && partialRotated ? null : `Failover failed: ${partialProcessed}/10 processed, ${partialStats.endpointRotations} rotations`
            });
            
            console.log(`  ${partialFailover && partialRotated ? '✅' : '❌'} Partial partition: ${partialProcessed}/10 processed, ${partialStats.endpointRotations} rotations to endpoint ${partialStats.currentEndpoint}`);
            
        } catch (error) {
            results.add('12.4.1 - Partial partition failover', false, { error: error.message });
            console.log(`  ❌ Partial partition test failed: ${error.message}`);
        }
        
        // ==================== TEST 12.5: DNS Resolution Failures ====================
        console.log('\n🔍 Test 12.5: DNS Resolution Failures');
        
        try {
            mockRpc.setNetworkState(NETWORK_STATES.DNS_FAILURE);
            monitor.startScenario('DNS Failure', 'All endpoints return DNS resolution errors');
            
            const dnsTokens = Array.from({ length: 5 }, (_, i) => createTestToken(i + 400));
            const dnsStart = performance.now();
            
            const dnsPromises = dnsTokens.map(token => filterService.processToken(token));
            const dnsResults = await Promise.allSettled(dnsPromises);
            const dnsTime = performance.now() - dnsStart;
            
            // DNS failures should be handled gracefully - system should not crash
            const dnsGraceful = dnsResults.every(r => r.status === 'fulfilled'); // No crashes
            const dnsFastFailure = dnsTime < 10000; // Fail fast, under 10 seconds
            
            const dnsStats = mockRpc.getNetworkStats();
            monitor.endScenario(dnsStats);
            
            results.add('12.5.1 - DNS failure handling', dnsGraceful && dnsFastFailure, {
                systemCrashed: !dnsGraceful,
                totalTime: Math.round(dnsTime),
                dnsFailures: dnsStats.dnsFailures,
                error: dnsGraceful ? null : 'System crashed during DNS failures'
            });
            
            console.log(`  ${dnsGraceful && dnsFastFailure ? '✅' : '❌'} DNS failure: System ${dnsGraceful ? 'stable' : 'crashed'} in ${Math.round(dnsTime)}ms, ${dnsStats.dnsFailures} DNS failures`);
            
        } catch (error) {
            results.add('12.5.1 - DNS failure handling', false, { error: error.message });
            console.log(`  ❌ DNS failure test failed: ${error.message}`);
        }
        
        // ==================== TEST 12.6: Complete Network Outage ====================
        console.log('\n📡 Test 12.6: Complete Network Outage');
        
        try {
            mockRpc.setNetworkState(NETWORK_STATES.COMPLETE_OUTAGE);
            monitor.startScenario('Complete Outage', 'Total network connectivity loss');
            
            const outageTokens = Array.from({ length: 5 }, (_, i) => createTestToken(i + 500));
            const outageStart = performance.now();
            
            const outagePromises = outageTokens.map(token => filterService.processToken(token));
            const outageResults = await Promise.allSettled(outagePromises);
            const outageTime = performance.now() - outageStart;
            
            // Complete outage - system should handle gracefully and fail fast
            const outageGraceful = outageResults.every(r => r.status === 'fulfilled');
            const outageFastFail = outageTime < 15000; // Fail fast, under 15 seconds
            
            const outageStats = mockRpc.getNetworkStats();
            monitor.endScenario(outageStats);
            
            results.add('12.6.1 - Complete outage handling', outageGraceful && outageFastFail, {
                systemStable: outageGraceful,
                totalTime: Math.round(outageTime),
                totalFailures: outageStats.failedCalls,
                error: outageGraceful ? null : 'System unstable during complete outage'
            });
            
            console.log(`  ${outageGraceful && outageFastFail ? '✅' : '❌'} Complete outage: System ${outageGraceful ? 'stable' : 'unstable'} in ${Math.round(outageTime)}ms`);
            
        } catch (error) {
            results.add('12.6.1 - Complete outage handling', false, { error: error.message });
            console.log(`  ❌ Complete outage test failed: ${error.message}`);
        }
        
        // ==================== TEST 12.7: Packet Loss Simulation ====================
        console.log('\n📦 Test 12.7: Packet Loss Simulation');
        
        try {
            mockRpc.setNetworkState(NETWORK_STATES.PACKET_LOSS);
            monitor.startScenario('Packet Loss', '20% packet loss with variable latency');
            
            const packetTokens = Array.from({ length: 20 }, (_, i) => createTestToken(i + 600));
            const packetStart = performance.now();
            
            const packetPromises = packetTokens.map(token => filterService.processToken(token));
            const packetResults = await Promise.allSettled(packetPromises);
            const packetTime = performance.now() - packetStart;
            
            const packetProcessed = packetResults.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const packetResilient = packetProcessed >= 15; // At least 75% success despite 20% packet loss
            const packetReasonable = packetTime < 45000; // Under 45 seconds for 20 tokens
            
            const packetStats = mockRpc.getNetworkStats();
            monitor.endScenario(packetStats);
            
            results.add('12.7.1 - Packet loss resilience', packetResilient && packetReasonable, {
                processed: packetProcessed,
                totalTime: Math.round(packetTime),
                successRate: Math.round((packetProcessed / packetTokens.length) * 100),
                timeouts: packetStats.timeouts,
                error: packetResilient ? null: `Poor packet loss handling: ${packetProcessed}/20 processed`
            });
            
            console.log(`  ${packetResilient && packetReasonable ? '✅' : '❌'} Packet loss: ${packetProcessed}/20 processed (${Math.round((packetProcessed / packetTokens.length) * 100)}%) in ${Math.round(packetTime)}ms`);
            
        } catch (error) {
            results.add('12.7.1 - Packet loss resilience', false, { error: error.message });
            console.log(`  ❌ Packet loss test failed: ${error.message}`);
        }
        
        // ==================== TEST 12.8: Network Recovery ====================
        console.log('\n🔄 Test 12.8: Network Recovery');
        
        try {
            mockRpc.simulateNetworkRecovery(); 
            monitor.startScenario('Network Recovery', 'System recovery after network issues resolved');
            
            const recoveryTokens = Array.from({ length: 10 }, (_, i) => createTestToken(i + 700));
            const recoveryStart = performance.now();
            
            const recoveryPromises = recoveryTokens.map(token => filterService.processToken(token));
            const recoveryResults = await Promise.allSettled(recoveryPromises);
            const recoveryTime = performance.now() - recoveryStart;
            
            const recoveryProcessed = recoveryResults.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const recoveryComplete = recoveryProcessed >= 9; // At least 90% success after recovery
            const recoveryFast = recoveryTime < 5000; // Fast recovery under 5 seconds
            
            const recoveryStats = mockRpc.getNetworkStats();
            monitor.endScenario(recoveryStats);
            
            results.add('12.8.1 - Network recovery performance', recoveryComplete && recoveryFast, {
                processed: recoveryProcessed,
                totalTime: Math.round(recoveryTime),
                finalSuccessRate: recoveryStats.successRate,
                error: recoveryComplete && recoveryFast ? null : `Slow recovery: ${recoveryProcessed}/10 in ${Math.round(recoveryTime)}ms`
            });
            
            console.log(`  ${recoveryComplete && recoveryFast ? '✅' : '❌'} Recovery: ${recoveryProcessed}/10 processed in ${Math.round(recoveryTime)}ms, ${Math.round(recoveryStats.successRate)}% final success rate`);
            
        } catch (error) {
            results.add('12.8.1 - Network recovery performance', false, { error: error.message });
            console.log(`  ❌ Network recovery test failed: ${error.message}`);
        }
        
        // ==================== TEST 12.9: System Health During Network Issues ====================
        console.log('\n🏥 Test 12.9: Health Monitoring During Network Issues');
        
        try {
            const healthCheck = await filterService.healthCheck();
            const healthWorking = healthCheck && typeof healthCheck.healthy === 'boolean';
            const hasNetworkStats = healthCheck?.stats && typeof healthCheck.stats.processed === 'number';
            
            // Health system should work even after network stress
            results.add('12.9.1 - Health monitoring resilience', healthWorking && hasNetworkStats, {
                healthy: healthCheck?.healthy,
                processed: healthCheck?.stats?.processed || 0,
                rateLimitHits: healthCheck?.stats?.rateLimitHits || 0,
                error: healthWorking ? null : 'Health monitoring failed after network stress'
            });
            
            console.log(`  ${healthWorking && hasNetworkStats ? '✅' : '❌'} Health monitoring: healthy=${healthCheck?.healthy}, processed=${healthCheck?.stats?.processed || 0}`);
            
        } catch (error) {
            results.add('12.9.1 - Health monitoring resilience', false, { error: error.message });
            console.log(`  ❌ Health monitoring test failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Test suite execution failed:', error);
        results.add('Test Suite Execution', false, { error: error.message });
    } finally {
        // Collect final statistics
        const finalStats = mockRpc.getNetworkStats();
        const resilienceReport = monitor.getResilienceReport();
        
        results.setNetworkStats(finalStats);
        results.setResilienceReport(resilienceReport);
        
        // Cleanup
        try {
            mockRpc.reset();
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
    runTest12()
        .then(results => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test execution failed:', error);
            process.exit(1);
        });
}

export { runTest12, NetworkPartitionRpcManager, NetworkResilienceMonitor, NETWORK_STATES };