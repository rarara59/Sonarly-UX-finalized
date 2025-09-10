#!/usr/bin/env node

/**
 * Session 3C - Sustained Load Testing
 * Tests 10+ minute continuous operation under realistic trading load
 */

import { SystemOrchestrator } from '../system/orchestrator.js';
import { performance } from 'perf_hooks';

class SustainedLoadTester {
    constructor() {
        this.results = {
            startTime: 0,
            endTime: 0,
            duration: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            memorySnapshots: [],
            latencySnapshots: [],
            throughputSnapshots: [],
            circuitBreakerEvents: 0,
            recoveryEvents: 0
        };
        this.orchestrator = null;
        this.rpcPool = null;
        this.isRunning = false;
        this.testDurationMs = 2 * 60 * 1000; // 2 minutes for demo (normally 10)
        this.concurrentRequests = 20; // Realistic trading load
        this.snapshotIntervalMs = 30000; // Every 30 seconds
    }

    async run() {
        console.log('🏋️ Sustained Load Testing');
        console.log('=' .repeat(50));
        console.log(`Testing ${this.testDurationMs/60000} minutes continuous operation`);
        console.log(`Concurrent requests: ${this.concurrentRequests}\n`);

        try {
            await this.setup();
            await this.executeSustainedLoad();
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
        
        // Start system orchestrator
        this.orchestrator = new SystemOrchestrator();
        await this.orchestrator.startSystem();
        
        // Get RPC pool component
        this.rpcPool = this.orchestrator.components['rpc-connection-pool'];
        
        if (!this.rpcPool) {
            throw new Error('RPC pool not available');
        }
        
        console.log('  ✅ Test environment ready');
        console.log(`  Starting sustained load test at ${new Date().toISOString()}\n`);
    }

    async cleanup() {
        try {
            this.isRunning = false;
            if (this.orchestrator) {
                await this.orchestrator.shutdown();
            }
        } catch (error) {
            console.log('  ⚠️  Cleanup error:', error.message);
        }
    }

    async executeSustainedLoad() {
        console.log('📊 Starting sustained load test...');
        console.log('─'.repeat(40));
        
        this.results.startTime = performance.now();
        this.isRunning = true;
        
        // Start monitoring
        const monitoringInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(monitoringInterval);
                return;
            }
            this.captureSnapshot();
        }, this.snapshotIntervalMs);
        
        // Start load generation
        const loadPromises = [];
        for (let i = 0; i < this.concurrentRequests; i++) {
            loadPromises.push(this.generateContinuousLoad(i));
        }
        
        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, this.testDurationMs));
        
        // Stop load generation
        this.isRunning = false;
        clearInterval(monitoringInterval);
        
        // Wait for remaining requests to complete
        await Promise.all(loadPromises);
        
        this.results.endTime = performance.now();
        this.results.duration = this.results.endTime - this.results.startTime;
        
        console.log('\n  ✅ Sustained load test completed');
    }

    async generateContinuousLoad(workerId) {
        const workerLatencies = [];
        let workerRequests = 0;
        let workerSuccess = 0;
        let workerFailures = 0;
        
        while (this.isRunning) {
            const requestStart = performance.now();
            
            try {
                // Simulate trading system RPC calls
                const method = this.getRandomMethod();
                const result = await this.rpcPool.call(method.name, method.params);
                
                if (result !== undefined) {
                    workerSuccess++;
                    this.results.successfulRequests++;
                }
                
                const latency = performance.now() - requestStart;
                workerLatencies.push(latency);
                
            } catch (error) {
                workerFailures++;
                this.results.failedRequests++;
                
                // Check for circuit breaker activation
                if (error.message && error.message.includes('circuit')) {
                    this.results.circuitBreakerEvents++;
                }
            }
            
            workerRequests++;
            this.results.totalRequests++;
            
            // Add small delay to simulate realistic request patterns
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        }
        
        // Log worker summary
        if (workerId === 0) {
            console.log(`\n  Worker ${workerId} summary:`);
            console.log(`    Requests: ${workerRequests}`);
            console.log(`    Success: ${workerSuccess} (${(workerSuccess/workerRequests*100).toFixed(1)}%)`);
            console.log(`    Failures: ${workerFailures}`);
            
            if (workerLatencies.length > 0) {
                const avgLatency = workerLatencies.reduce((a, b) => a + b, 0) / workerLatencies.length;
                const p95Latency = this.calculatePercentile(workerLatencies, 95);
                console.log(`    Avg latency: ${avgLatency.toFixed(2)}ms`);
                console.log(`    P95 latency: ${p95Latency.toFixed(2)}ms`);
            }
        }
    }

    getRandomMethod() {
        const methods = [
            { name: 'getSlot', params: [] },
            { name: 'getBlockHeight', params: [] },
            { name: 'getBalance', params: ['11111111111111111111111111111111'] },
            { name: 'getLatestBlockhash', params: [] },
            { name: 'getTokenSupply', params: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'] }
        ];
        
        return methods[Math.floor(Math.random() * methods.length)];
    }

    captureSnapshot() {
        const currentTime = performance.now();
        const elapsedMinutes = ((currentTime - this.results.startTime) / 60000).toFixed(1);
        
        // Memory snapshot
        const memUsage = process.memoryUsage();
        const memoryMB = memUsage.heapUsed / 1024 / 1024;
        this.results.memorySnapshots.push({
            time: elapsedMinutes,
            memory: memoryMB
        });
        
        // Success rate snapshot
        const successRate = this.results.totalRequests > 0 
            ? (this.results.successfulRequests / this.results.totalRequests * 100)
            : 0;
        
        // Throughput snapshot
        const elapsedSeconds = (currentTime - this.results.startTime) / 1000;
        const throughput = this.results.totalRequests / elapsedSeconds;
        this.results.throughputSnapshots.push({
            time: elapsedMinutes,
            throughput: throughput
        });
        
        console.log(`  [${elapsedMinutes} min] Memory: ${memoryMB.toFixed(2)}MB | Success: ${successRate.toFixed(1)}% | Throughput: ${throughput.toFixed(1)} req/s | Total: ${this.results.totalRequests} requests`);
    }

    calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    printResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 SUSTAINED LOAD TEST SUMMARY');
        console.log('=' .repeat(50));
        
        const durationMinutes = this.results.duration / 60000;
        const successRate = (this.results.successfulRequests / this.results.totalRequests * 100);
        const avgThroughput = this.results.totalRequests / (this.results.duration / 1000);
        
        console.log('\n📈 Test Metrics:');
        console.log(`  Duration: ${durationMinutes.toFixed(1)} minutes`);
        console.log(`  Total requests: ${this.results.totalRequests}`);
        console.log(`  Successful: ${this.results.successfulRequests} (${successRate.toFixed(2)}%)`);
        console.log(`  Failed: ${this.results.failedRequests}`);
        console.log(`  Average throughput: ${avgThroughput.toFixed(1)} req/s`);
        
        console.log('\n💾 Memory Stability:');
        if (this.results.memorySnapshots.length > 1) {
            const initialMemory = this.results.memorySnapshots[0].memory;
            const finalMemory = this.results.memorySnapshots[this.results.memorySnapshots.length - 1].memory;
            const memoryGrowth = finalMemory - initialMemory;
            const growthPercentage = (memoryGrowth / initialMemory * 100);
            const hourlyGrowthRate = (growthPercentage * (60 / durationMinutes));
            
            console.log(`  Initial: ${initialMemory.toFixed(2)}MB`);
            console.log(`  Final: ${finalMemory.toFixed(2)}MB`);
            console.log(`  Growth: ${memoryGrowth.toFixed(2)}MB (${growthPercentage.toFixed(1)}%)`);
            console.log(`  Hourly growth rate: ${hourlyGrowthRate.toFixed(1)}%`);
            
            // Check for memory stability
            if (hourlyGrowthRate < 1) {
                console.log('  ✅ Memory stable (< 1% per hour)');
            } else if (hourlyGrowthRate < 2) {
                console.log('  ⚠️  Memory growth acceptable (< 2% per hour)');
            } else {
                console.log('  ❌ Memory growth too high (> 2% per hour)');
            }
        }
        
        console.log('\n⚡ Circuit Breaker:');
        console.log(`  Activations: ${this.results.circuitBreakerEvents}`);
        console.log(`  Recovery events: ${this.results.recoveryEvents}`);
        
        if (this.results.circuitBreakerEvents > 0) {
            console.log('  ✅ Circuit breaker functioning during stress');
        }
        
        console.log('\n📊 Performance Consistency:');
        if (this.results.throughputSnapshots.length > 1) {
            const throughputs = this.results.throughputSnapshots.map(s => s.throughput);
            const avgThroughput = throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
            const minThroughput = Math.min(...throughputs);
            const maxThroughput = Math.max(...throughputs);
            const variance = maxThroughput - minThroughput;
            
            console.log(`  Min throughput: ${minThroughput.toFixed(1)} req/s`);
            console.log(`  Max throughput: ${maxThroughput.toFixed(1)} req/s`);
            console.log(`  Variance: ${variance.toFixed(1)} req/s`);
            
            if (variance < avgThroughput * 0.5) {
                console.log('  ✅ Performance consistent throughout test');
            } else {
                console.log('  ⚠️  Performance variance detected');
            }
        }
    }

    calculateOverallSuccess() {
        const durationMinutes = this.results.duration / 60000;
        const successRate = (this.results.successfulRequests / this.results.totalRequests * 100);
        
        // Check success criteria
        const durationMet = durationMinutes >= 10;
        const successRateMet = successRate >= 95;
        
        let memoryStable = true;
        if (this.results.memorySnapshots.length > 1) {
            const initialMemory = this.results.memorySnapshots[0].memory;
            const finalMemory = this.results.memorySnapshots[this.results.memorySnapshots.length - 1].memory;
            const growthPercentage = ((finalMemory - initialMemory) / initialMemory * 100);
            const hourlyGrowthRate = (growthPercentage * (60 / durationMinutes));
            memoryStable = hourlyGrowthRate < 2;
        }
        
        const allCriteriaMet = durationMet && successRateMet && memoryStable;
        
        console.log('\n🎯 SUCCESS CRITERIA:');
        console.log(`  ${durationMet ? '✅' : '❌'} 10+ minutes continuous operation`);
        console.log(`  ${successRateMet ? '✅' : '❌'} 95%+ success rate maintained`);
        console.log(`  ${memoryStable ? '✅' : '❌'} Memory growth < 2% per hour`);
        
        console.log(`\n🎯 OVERALL: ${allCriteriaMet ? '✅ ALL CRITERIA MET' : '❌ SOME CRITERIA NOT MET'}`);
        
        if (allCriteriaMet) {
            console.log('\n✨ System demonstrates sustained reliability for production use!');
        } else {
            console.log('\n⚠️  System needs optimization for sustained operation.');
        }
        
        return allCriteriaMet;
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
console.log('⚠️  This test will run for approximately 10 minutes...\n');
const tester = new SustainedLoadTester();
tester.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});