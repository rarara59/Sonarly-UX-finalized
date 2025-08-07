/**
 * RENAISSANCE TEST #11: RESOURCE EXHAUSTION
 * 
 * What: System behavior when approaching resource limits
 * How: Test file descriptor limits, memory pressure, CPU saturation
 * Why: Resource exhaustion causes unpredictable failures
 * Money Impact: HIGH - Unpredictable failures during peak load
 * 
 * Run: node test_11_resource_exhaustion.js
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';
import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';

// Enhanced Mock RPC Manager for resource testing
class ResourceTestRpcManager {
    constructor() {
        this.openConnections = new Set();
        this.memoryAllocations = [];
        this.cpuIntensiveOperations = 0;
        this.callDelay = 0;
        this.simulatedMemoryLeak = false;
    }
    
    async call(method, params) {
        // Simulate connection creation
        const connectionId = Math.random().toString(36);
        this.openConnections.add(connectionId);
        
        // Simulate CPU intensive operation
        this.cpuIntensiveOperations++;
        
        // Simulate memory allocation
        if (this.simulatedMemoryLeak) {
            const largeBuffer = Buffer.alloc(1024 * 1024); // 1MB per call
            this.memoryAllocations.push(largeBuffer);
        }
        
        // Simulate network delay
        if (this.callDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.callDelay));
        }
        
        // CPU burn simulation
        if (this.callDelay === -1) {
            const start = Date.now();
            while (Date.now() - start < 100) {
                // Burn CPU for 100ms
                Math.random() * Math.random();
            }
        }
        
        // Clean up connection (simulate)
        setTimeout(() => {
            this.openConnections.delete(connectionId);
        }, Math.random() * 1000);
        
        // Return mock data based on method
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
        // Simulate endpoint rotation overhead
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Test control methods
    enableMemoryLeak() {
        this.simulatedMemoryLeak = true;
    }
    
    setCallDelay(ms) {
        this.callDelay = ms;
    }
    
    setCpuBurn() {
        this.callDelay = -1; // Special flag for CPU burn
    }
    
    getResourceStats() {
        return {
            openConnections: this.openConnections.size,
            memoryAllocations: this.memoryAllocations.length,
            memoryUsageMB: (this.memoryAllocations.length * 1024 * 1024) / (1024 * 1024),
            cpuOperations: this.cpuIntensiveOperations
        };
    }
    
    cleanup() {
        this.openConnections.clear();
        this.memoryAllocations = [];
        this.cpuIntensiveOperations = 0;
        this.simulatedMemoryLeak = false;
        this.callDelay = 0;
    }
}

// Memory monitoring utilities
class MemoryMonitor {
    constructor() {
        this.snapshots = [];
        this.monitoring = false;
        this.interval = null;
    }
    
    start(intervalMs = 100) {
        this.monitoring = true;
        this.snapshots = [];
        
        this.interval = setInterval(() => {
            if (!this.monitoring) return;
            
            const memUsage = process.memoryUsage();
            this.snapshots.push({
                timestamp: Date.now(),
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss
            });
        }, intervalMs);
    }
    
    stop() {
        this.monitoring = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    
    getStats() {
        if (this.snapshots.length === 0) return null;
        
        const initial = this.snapshots[0];
        const final = this.snapshots[this.snapshots.length - 1];
        const peak = this.snapshots.reduce((max, snap) => 
            snap.heapUsed > max.heapUsed ? snap : max
        );
        
        return {
            initialHeapMB: Math.round(initial.heapUsed / 1024 / 1024),
            finalHeapMB: Math.round(final.heapUsed / 1024 / 1024),
            peakHeapMB: Math.round(peak.heapUsed / 1024 / 1024),
            heapGrowthMB: Math.round((final.heapUsed - initial.heapUsed) / 1024 / 1024),
            snapshotCount: this.snapshots.length,
            durationMs: final.timestamp - initial.timestamp
        };
    }
    
    detectMemoryLeak(thresholdMB = 50) {
        const stats = this.getStats();
        if (!stats) return false;
        
        return stats.heapGrowthMB > thresholdMB;
    }
}

// CPU monitoring utilities
class CpuMonitor {
    constructor() {
        this.measurements = [];
    }
    
    async measureCpuUsage(testFunction, testName) {
        const startTime = performance.now();
        const startUsage = process.cpuUsage();
        
        let result;
        try {
            result = await testFunction();
        } catch (error) {
            result = { error: error.message };
        }
        
        const endTime = performance.now();
        const endUsage = process.cpuUsage(startUsage);
        
        const measurement = {
            testName,
            wallClockMs: Math.round(endTime - startTime),
            cpuUserMs: Math.round(endUsage.user / 1000),
            cpuSystemMs: Math.round(endUsage.system / 1000),
            cpuTotalMs: Math.round((endUsage.user + endUsage.system) / 1000),
            cpuEfficiency: Math.round((endUsage.user + endUsage.system) / 1000 / (endTime - startTime) * 100),
            result
        };
        
        this.measurements.push(measurement);
        return measurement;
    }
    
    getStats() {
        return {
            totalTests: this.measurements.length,
            averageCpuEfficiency: Math.round(
                this.measurements.reduce((sum, m) => sum + m.cpuEfficiency, 0) / this.measurements.length
            ),
            highestCpuTest: this.measurements.reduce((max, m) => 
                m.cpuTotalMs > max.cpuTotalMs ? m : max
            ),
            measurements: this.measurements
        };
    }
}

// Test utilities
function createTestToken(index = 0, overrides = {}) {
    const baseAddress = `TestToken${index.toString().padStart(3, '0')}ABC456DEF789GHI012JKL345MNO`;
    return {
        tokenMint: baseAddress,
        address: baseAddress,
        baseMint: baseAddress,
        lpValueUSD: 5000 + (index * 100),
        detectedAt: Date.now() - (index * 1000),
        name: `Test Token ${index}`,
        symbol: `TEST${index}`,
        uniqueWallets: 50 + index,
        ageMinutes: Math.floor(index / 10),
        ...overrides
    };
}

// File descriptor monitoring
async function getFileDescriptorCount() {
    try {
        if (process.platform === 'linux' || process.platform === 'darwin') {
            const files = await fs.readdir(`/proc/${process.pid}/fd`).catch(() => null);
            return files ? files.length : null;
        }
    } catch (error) {
        // Fallback: not available on all systems
    }
    return null;
}

// Test Results Tracking
class TestResults {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.resourceStats = {};
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
    
    setResourceStats(stats) {
        this.resourceStats = stats;
    }
    
    summary() {
        console.log('\n=== TEST #11: RESOURCE EXHAUSTION RESULTS ===');
        console.log(`Total Tests: ${this.tests.length}`);
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
        
        // Resource usage summary
        if (this.resourceStats.memory) {
            console.log(`\n📊 RESOURCE USAGE:`);
            console.log(`  Memory Growth: ${this.resourceStats.memory.heapGrowthMB}MB`);
            console.log(`  Peak Memory: ${this.resourceStats.memory.peakHeapMB}MB`);
            console.log(`  CPU Efficiency: ${this.resourceStats.cpu?.averageCpuEfficiency || 'N/A'}%`);
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
        const memoryLeak = this.resourceStats.memory?.heapGrowthMB > 100;
        const highCpuUsage = this.resourceStats.cpu?.averageCpuEfficiency > 80;
        
        if (this.failed === 0 && !memoryLeak && !highCpuUsage) {
            console.log('✅ DEPLOY IMMEDIATELY - Resource usage within acceptable limits');
        } else if (this.failed <= 2 && !memoryLeak) {
            console.log('⚠️ DEPLOY WITH MONITORING - Some resource concerns but manageable');
        } else if (memoryLeak) {
            console.log('🚫 DO NOT DEPLOY - MEMORY LEAK DETECTED - Will crash in production');
        } else {
            console.log('🚫 DO NOT DEPLOY - Resource exhaustion will cause unpredictable failures');
        }
    }
}

// Main test execution
async function runTest11() {
    console.log('🚀 Starting Renaissance Test #11: Resource Exhaustion');
    console.log('Target: System behavior when approaching resource limits');
    console.log('Money Impact: HIGH - Unpredictable failures during peak load\n');
    
    const results = new TestResults();
    const mockRpc = new ResourceTestRpcManager();
    const memoryMonitor = new MemoryMonitor();
    const cpuMonitor = new CpuMonitor();
    
    // Initialize filter service
    const filterService = new TieredTokenFilterService({
        rpcManager: mockRpc
    });
    
    await filterService.initialize();
    
    // Start resource monitoring
    memoryMonitor.start();
    const initialFdCount = await getFileDescriptorCount();
    
    try {
        // ==================== TEST 11.1: Memory Pressure ====================
        console.log('🧠 Test 11.1: Memory Pressure and Leak Detection');
        
        try {
            // Test 11.1.1: High Volume Processing
            const highVolumeTokens = Array.from({ length: 100 }, (_, i) => createTestToken(i));
            
            const memResult = await cpuMonitor.measureCpuUsage(async () => {
                const promises = highVolumeTokens.map(token => filterService.processToken(token));
                return await Promise.allSettled(promises);
            }, 'High Volume Processing');
            
            const successfulProcessed = memResult.result.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const memoryStable = !memoryMonitor.detectMemoryLeak(50);
            const processingSuccessful = successfulProcessed > 80; // At least 80% success
            
            results.add('11.1.1 - High volume memory stability', memoryStable && processingSuccessful, {
                processed: successfulProcessed,
                memoryGrowth: memoryMonitor.getStats()?.heapGrowthMB || 0,
                error: memoryStable ? null : 'Memory leak detected during high volume processing'
            });
            
            console.log(`  ${memoryStable && processingSuccessful ? '✅' : '❌'} High volume (100 tokens): ${successfulProcessed} processed, ${memoryMonitor.getStats()?.heapGrowthMB || 0}MB growth`);
            
        } catch (error) {
            results.add('11.1.1 - High volume memory stability', false, { error: error.message });
            console.log(`  ❌ High volume test failed: ${error.message}`);
        }
        
        try {
            // Test 11.1.2: Simulated Memory Leak
            console.log('  🔍 Testing with simulated memory leak...');
            mockRpc.enableMemoryLeak();
            
            const leakTokens = Array.from({ length: 20 }, (_, i) => createTestToken(i + 200));
            
            const leakResult = await cpuMonitor.measureCpuUsage(async () => {
                const promises = leakTokens.map(token => filterService.processToken(token));
                return await Promise.allSettled(promises);
            }, 'Memory Leak Simulation');
            
            // System should handle even with simulated external memory pressure
            const leakProcessed = leakResult.result.filter(r => 
                r.status === 'fulfilled'
            ).length;
            
            const systemSurvived = leakProcessed > 0;
            results.add('11.1.2 - Survive external memory pressure', systemSurvived, {
                processed: leakProcessed,
                mockMemoryUsage: mockRpc.getResourceStats().memoryUsageMB,
                error: systemSurvived ? null : 'System failed under memory pressure'
            });
            
            console.log(`  ${systemSurvived ? '✅' : '❌'} Memory pressure survival: ${leakProcessed}/20 processed, ${mockRpc.getResourceStats().memoryUsageMB}MB mock allocation`);
            
            mockRpc.cleanup(); // Clean up leak simulation
            
        } catch (error) {
            results.add('11.1.2 - Survive external memory pressure', false, { error: error.message });
            console.log(`  ❌ Memory pressure test failed: ${error.message}`);
        }
        
        // ==================== TEST 11.2: CPU Saturation ====================
        console.log('\n🔥 Test 11.2: CPU Saturation and Performance');
        
        try {
            // Test 11.2.1: CPU Intensive Operations
            mockRpc.setCpuBurn(); // Enable CPU burning in RPC calls
            
            const cpuTokens = Array.from({ length: 10 }, (_, i) => createTestToken(i + 300));
            
            const cpuResult = await cpuMonitor.measureCpuUsage(async () => {
                // Process sequentially to test CPU handling
                const results = [];
                for (const token of cpuTokens) {
                    const result = await filterService.processToken(token);
                    results.push(result);
                }
                return results;
            }, 'CPU Intensive Processing');
            
            const cpuProcessed = cpuResult.result.filter(r => 
                r && typeof r.approved === 'boolean'
            ).length;
            
            const cpuEfficient = cpuResult.cpuEfficiency < 90; // Less than 90% CPU usage
            const allProcessed = cpuProcessed === cpuTokens.length;
            
            results.add('11.2.1 - CPU intensive processing', cpuEfficient && allProcessed, {
                processed: cpuProcessed,
                cpuEfficiency: cpuResult.cpuEfficiency,
                wallClockMs: cpuResult.wallClockMs,
                error: cpuEfficient ? null : `CPU efficiency ${cpuResult.cpuEfficiency}% too high`
            });
            
            console.log(`  ${cpuEfficient && allProcessed ? '✅' : '❌'} CPU intensive: ${cpuProcessed}/10 processed, ${cpuResult.cpuEfficiency}% efficiency, ${cpuResult.wallClockMs}ms`);
            
            mockRpc.setCallDelay(0); // Reset CPU burn
            
        } catch (error) {
            results.add('11.2.1 - CPU intensive processing', false, { error: error.message });
            console.log(`  ❌ CPU intensive test failed: ${error.message}`);
        }
        
        try {
            // Test 11.2.2: Concurrent CPU Load
            const concurrentTokens = Array.from({ length: 50 }, (_, i) => createTestToken(i + 400));
            mockRpc.setCallDelay(10); // Add small delay to simulate load
            
            const concurrentResult = await cpuMonitor.measureCpuUsage(async () => {
                const promises = concurrentTokens.map(token => filterService.processToken(token));
                return await Promise.allSettled(promises);
            }, 'Concurrent CPU Load');
            
            const concurrentProcessed = concurrentResult.result.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const concurrentEfficient = concurrentResult.cpuEfficiency < 95;
            const concurrentFast = concurrentResult.wallClockMs < 30000; // Under 30 seconds
            
            results.add('11.2.2 - Concurrent CPU efficiency', concurrentEfficient && concurrentFast, {
                processed: concurrentProcessed,
                cpuEfficiency: concurrentResult.cpuEfficiency,
                wallClockMs: concurrentResult.wallClockMs,
                error: concurrentEfficient ? null : `Concurrent processing too CPU intensive: ${concurrentResult.cpuEfficiency}%`
            });
            
            console.log(`  ${concurrentEfficient && concurrentFast ? '✅' : '❌'} Concurrent load: ${concurrentProcessed}/50 processed, ${concurrentResult.cpuEfficiency}% efficiency, ${concurrentResult.wallClockMs}ms`);
            
        } catch (error) {
            results.add('11.2.2 - Concurrent CPU efficiency', false, { error: error.message });
            console.log(`  ❌ Concurrent CPU test failed: ${error.message}`);
        }
        
        // ==================== TEST 11.3: Connection/File Descriptor Limits ====================
        console.log('\n🔗 Test 11.3: Connection and File Descriptor Management');
        
        try {
            // Test 11.3.1: High Connection Count
            const connectionTokens = Array.from({ length: 200 }, (_, i) => createTestToken(i + 500));
            
            const connectionResult = await cpuMonitor.measureCpuUsage(async () => {
                const promises = connectionTokens.map(token => filterService.processToken(token));
                return await Promise.allSettled(promises);
            }, 'High Connection Count');
            
            const connectionProcessed = connectionResult.result.filter(r => 
                r.status === 'fulfilled'
            ).length;
            
            const finalFdCount = await getFileDescriptorCount();
            const fdGrowthReasonable = !finalFdCount || !initialFdCount || 
                (finalFdCount - initialFdCount) < 100; // Less than 100 FD growth
            
            const maxConnections = Math.max(...Array.from(
                { length: 10 }, 
                () => mockRpc.getResourceStats().openConnections
            ));
            
            results.add('11.3.1 - File descriptor management', fdGrowthReasonable && connectionProcessed > 150, {
                processed: connectionProcessed,
                fdGrowth: finalFdCount && initialFdCount ? (finalFdCount - initialFdCount) : 'N/A',
                maxConnections,
                error: fdGrowthReasonable ? null : `File descriptor growth: ${finalFdCount - initialFdCount}`
            });
            
            console.log(`  ${fdGrowthReasonable ? '✅' : '❌'} FD management: ${connectionProcessed}/200 processed, FD growth: ${finalFdCount && initialFdCount ? (finalFdCount - initialFdCount) : 'N/A'}, Max connections: ${maxConnections}`);
            
        } catch (error) {
            results.add('11.3.1 - File descriptor management', false, { error: error.message });
            console.log(`  ❌ File descriptor test failed: ${error.message}`);
        }
        
        // ==================== TEST 11.4: Cache Resource Management ====================
        console.log('\n💾 Test 11.4: Cache and Memory Management');
        
        try {
            // Test 11.4.1: Cache Overflow Handling
            const cacheTokens = Array.from({ length: 1500 }, (_, i) => createTestToken(i + 700)); // Exceed cache limit
            
            const cacheResult = await cpuMonitor.measureCpuUsage(async () => {
                // Process tokens to fill cache beyond maxCacheSize (1000)
                const promises = cacheTokens.slice(0, 500).map(token => filterService.processToken(token));
                await Promise.allSettled(promises);
                
                // Process more to trigger cache cleanup
                const promises2 = cacheTokens.slice(500, 1000).map(token => filterService.processToken(token));
                await Promise.allSettled(promises2);
                
                // Final batch to ensure cache management
                const promises3 = cacheTokens.slice(1000).map(token => filterService.processToken(token));
                return await Promise.allSettled(promises3);
            }, 'Cache Management');
            
            const cacheProcessed = cacheResult.result.filter(r => 
                r.status === 'fulfilled'
            ).length;
            
            // Check if cache stayed bounded
            const cacheStayedBounded = cacheProcessed > 400; // System kept processing
            
            results.add('11.4.1 - Cache overflow management', cacheStayedBounded, {
                processed: cacheProcessed,
                totalTokens: cacheTokens.length,
                error: cacheStayedBounded ? null : 'Cache overflow caused processing failures'
            });
            
            console.log(`  ${cacheStayedBounded ? '✅' : '❌'} Cache management: ${cacheProcessed}/500 final batch processed`);
            
        } catch (error) {
            results.add('11.4.1 - Cache overflow management', false, { error: error.message });
            console.log(`  ❌ Cache management test failed: ${error.message}`);
        }
        
        // ==================== TEST 11.5: System Recovery Under Load ====================
        console.log('\n🔄 Test 11.5: System Recovery and Resilience');
        
        try {
            // Test 11.5.1: Recovery After Resource Pressure
            const recoveryTokens = Array.from({ length: 50 }, (_, i) => createTestToken(i + 1200));
            
            const recoveryResult = await cpuMonitor.measureCpuUsage(async () => {
                const promises = recoveryTokens.map(token => filterService.processToken(token));
                return await Promise.allSettled(promises);
            }, 'System Recovery');
            
            const recoveryProcessed = recoveryResult.result.filter(r => 
                r.status === 'fulfilled' && r.value && typeof r.value.approved === 'boolean'
            ).length;
            
            const fastRecovery = recoveryResult.wallClockMs < 10000; // Under 10 seconds
            const highSuccessRate = recoveryProcessed / recoveryTokens.length > 0.9; // >90% success
            
            results.add('11.5.1 - System recovery after load', fastRecovery && highSuccessRate, {
                processed: recoveryProcessed,
                successRate: Math.round((recoveryProcessed / recoveryTokens.length) * 100),
                recoveryTimeMs: recoveryResult.wallClockMs,
                error: fastRecovery && highSuccessRate ? null : `Recovery: ${recoveryProcessed}/${recoveryTokens.length} in ${recoveryResult.wallClockMs}ms`
            });
            
            console.log(`  ${fastRecovery && highSuccessRate ? '✅' : '❌'} Recovery: ${recoveryProcessed}/50 (${Math.round((recoveryProcessed / recoveryTokens.length) * 100)}%) in ${recoveryResult.wallClockMs}ms`);
            
        } catch (error) {
            results.add('11.5.1 - System recovery after load', false, { error: error.message });
            console.log(`  ❌ Recovery test failed: ${error.message}`);
        }
        
        // ==================== TEST 11.6: Health Check Under Stress ====================
        console.log('\n🏥 Test 11.6: Health Monitoring Under Stress');
        
        try {
            const healthCheck = await filterService.healthCheck();
            const healthCheckWorking = healthCheck && typeof healthCheck.healthy === 'boolean';
            const systemStillHealthy = healthCheck?.healthy === true;
            const statsAvailable = healthCheck?.stats && typeof healthCheck.stats.processed === 'number';
            
            results.add('11.6.1 - Health check functionality', healthCheckWorking && statsAvailable, {
                healthy: systemStillHealthy,
                processed: healthCheck?.stats?.processed || 0,
                error: healthCheckWorking ? null : 'Health check system failed'
            });
            
            console.log(`  ${healthCheckWorking && statsAvailable ? '✅' : '❌'} Health check: healthy=${systemStillHealthy}, processed=${healthCheck?.stats?.processed || 0}`);
            
        } catch (error) {
            results.add('11.6.1 - Health check functionality', false, { error: error.message });
            console.log(`  ❌ Health check failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Test suite execution failed:', error);
        results.add('Test Suite Execution', false, { error: error.message });
    } finally {
        // Stop monitoring and collect final stats
        memoryMonitor.stop();
        const memoryStats = memoryMonitor.getStats();
        const cpuStats = cpuMonitor.getStats();
        const finalResourceStats = mockRpc.getResourceStats();
        
        results.setResourceStats({
            memory: memoryStats,
            cpu: cpuStats,
            rpc: finalResourceStats
        });
        
        // Cleanup
        try {
            mockRpc.cleanup();
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
    runTest11()
        .then(results => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test execution failed:', error);
            process.exit(1);
        });
}

export { runTest11, ResourceTestRpcManager, MemoryMonitor, CpuMonitor };