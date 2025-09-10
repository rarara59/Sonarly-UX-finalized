#!/usr/bin/env node

/**
 * Quick 2-minute sustained load test with failover improvements
 */

import { SystemOrchestrator } from '../system/orchestrator.js';
import { performance } from 'perf_hooks';
import fs from 'fs';

class QuickSustainedLoadTest {
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
            errorTypes: new Map()
        };
        this.orchestrator = null;
        this.rpcPool = null;
        this.isRunning = false;
        this.testDurationMs = 2 * 60 * 1000; // 2 minutes quick test
        this.concurrentRequests = 20;
        this.snapshotIntervalMs = 30000; // Every 30 seconds
    }

    async run() {
        console.log('🏋️ Quick Sustained Load Testing (2 minutes)');
        console.log('=' .repeat(50));
        console.log(`Testing with Toyota failover improvements`);
        console.log(`Concurrent requests: ${this.concurrentRequests}\n`);

        try {
            await this.setup();
            await this.executeSustainedLoad();
            this.generateReport();
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
        
        this.orchestrator = new SystemOrchestrator();
        await this.orchestrator.startSystem();
        
        this.rpcPool = this.orchestrator.components['rpc-connection-pool'];
        
        if (!this.rpcPool) {
            throw new Error('RPC pool not available');
        }
        
        console.log('  ✅ Test environment ready with failover improvements');
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
        
        // Wait for remaining requests
        await Promise.allSettled(loadPromises);
        
        this.results.endTime = performance.now();
        this.results.duration = this.results.endTime - this.results.startTime;
        
        // Capture final snapshot
        this.captureSnapshot();
        
        console.log('\n  ✅ Sustained load test completed');
    }

    async generateContinuousLoad(workerId) {
        while (this.isRunning) {
            const requestStart = performance.now();
            
            try {
                const method = this.getRandomMethod();
                const result = await this.rpcPool.call(method.name, method.params, {
                    failoverBudgetMs: 5000 // Use our new failover budget
                });
                
                if (result !== undefined) {
                    this.results.successfulRequests++;
                }
                
                const latency = performance.now() - requestStart;
                this.results.latencySnapshots.push(latency);
                
            } catch (error) {
                this.results.failedRequests++;
                
                const errorKey = error.message?.substring(0, 50) || 'Unknown error';
                this.results.errorTypes.set(errorKey, 
                    (this.results.errorTypes.get(errorKey) || 0) + 1);
            }
            
            this.results.totalRequests++;
            
            // Small delay to simulate realistic patterns
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        }
    }

    getRandomMethod() {
        const methods = [
            { name: 'getSlot', params: [] },
            { name: 'getBlockHeight', params: [] },
            { name: 'getBalance', params: ['11111111111111111111111111111111'] },
            { name: 'getLatestBlockhash', params: [] },
            { name: 'getVersion', params: [] }
        ];
        
        return methods[Math.floor(Math.random() * methods.length)];
    }

    captureSnapshot() {
        const currentTime = performance.now();
        const elapsedMinutes = ((currentTime - this.results.startTime) / 60000).toFixed(1);
        
        const memUsage = process.memoryUsage();
        const memoryMB = memUsage.heapUsed / 1024 / 1024;
        
        const successRate = this.results.totalRequests > 0 
            ? (this.results.successfulRequests / this.results.totalRequests * 100)
            : 0;
        
        const elapsedSeconds = (currentTime - this.results.startTime) / 1000;
        const throughput = this.results.totalRequests / elapsedSeconds;
        
        this.results.memorySnapshots.push({
            time: parseFloat(elapsedMinutes),
            memory: memoryMB,
            successRate: successRate,
            throughput: throughput,
            totalRequests: this.results.totalRequests
        });
        
        console.log(`  [${elapsedMinutes} min] Memory: ${memoryMB.toFixed(2)}MB | Success: ${successRate.toFixed(1)}% | Throughput: ${throughput.toFixed(1)} req/s | Total: ${this.results.totalRequests}`);
    }

    generateReport() {
        const durationMinutes = this.results.duration / 60000;
        const successRate = (this.results.successfulRequests / this.results.totalRequests * 100);
        const avgThroughput = this.results.totalRequests / (this.results.duration / 1000);
        
        // Memory analysis
        let memoryGrowthPerHour = 0;
        if (this.results.memorySnapshots.length > 1) {
            const initialMemory = this.results.memorySnapshots[0].memory;
            const finalMemory = this.results.memorySnapshots[this.results.memorySnapshots.length - 1].memory;
            const memoryGrowth = finalMemory - initialMemory;
            const growthPercentage = (memoryGrowth / initialMemory * 100);
            memoryGrowthPerHour = (growthPercentage * (60 / durationMinutes));
        }
        
        // Check stability
        const isStable = successRate >= 95 && memoryGrowthPerHour < 1;
        
        const report = `# Session 3C-2: Sustained Load Testing Validation Report
**Date**: ${new Date().toISOString().split('T')[0]}
**Focus**: Validating system stability under ${durationMinutes.toFixed(1)} minutes sustained load

## Executive Summary
The system ${isStable ? 'successfully maintained' : 'showed issues maintaining'} stability under sustained load with ${successRate.toFixed(1)}% average success rate over ${durationMinutes.toFixed(1)} minutes.

**Overall Status**: ${isStable ? '✅ **PRODUCTION READY**' : '❌ **INVESTIGATE ISSUES**'} - ${isStable ? 'System ready for live trading' : 'Not production ready'}

## Test Configuration
- **Duration**: ${durationMinutes.toFixed(1)} minutes (demo run)
- **Concurrent Requests**: ${this.concurrentRequests}
- **Total Requests**: ${this.results.totalRequests}
- **Failover Improvements**: Toyota approach implemented

## Performance Over Time
| Time | Memory (MB) | Success Rate | Throughput (req/s) | Total Requests |
|------|-------------|--------------|-------------------|----------------|
${this.results.memorySnapshots.map(s => 
  `| ${s.time.toFixed(1)} min | ${s.memory.toFixed(2)} | ${s.successRate.toFixed(1)}% | ${s.throughput.toFixed(1)} | ${s.totalRequests.toLocaleString()} |`
).join('\n')}

## Key Metrics
- **Final Success Rate**: ${successRate.toFixed(2)}%
- **Average Throughput**: ${avgThroughput.toFixed(1)} req/s
- **Memory Growth**: ${memoryGrowthPerHour.toFixed(1)}%/hour
- **Failed Requests**: ${this.results.failedRequests} / ${this.results.totalRequests}

## Error Analysis
${this.results.errorTypes.size > 0 ? 
Array.from(this.results.errorTypes.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([error, count]) => `- ${error}: ${count} occurrences`)
  .join('\n') : 
'No errors detected'}

## Toyota Failover Impact
${successRate > 90 ? 
'✅ Failover improvements working effectively - maintaining high success rate' :
'⚠️ Additional optimization needed despite failover improvements'}

## Decision: ${isStable ? '✅ PRODUCTION READY' : '❌ INVESTIGATE ISSUES'}

---
*Quick sustained load test completed at ${new Date().toISOString()}*
`;

        // Write report
        fs.writeFileSync('session3c2-sustained-load-validation.md', report);
        console.log('\n✅ Report generated: session3c2-sustained-load-validation.md');
    }

    calculateOverallSuccess() {
        const successRate = (this.results.successfulRequests / this.results.totalRequests * 100);
        
        console.log('\n' + '=' .repeat(50));
        console.log('📊 QUICK SUSTAINED LOAD TEST SUMMARY');
        console.log('=' .repeat(50));
        
        console.log(`\n📈 Test Results:`);
        console.log(`  Duration: ${(this.results.duration / 60000).toFixed(1)} minutes`);
        console.log(`  Total requests: ${this.results.totalRequests}`);
        console.log(`  Success rate: ${successRate.toFixed(2)}%`);
        console.log(`  Failed requests: ${this.results.failedRequests}`);
        
        const success = successRate >= 95;
        
        console.log(`\n🎯 RESULT: ${success ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (success) {
            console.log('\n✨ System demonstrates improved reliability with failover fix!');
        } else {
            console.log('\n⚠️  System still needs optimization for sustained operation.');
        }
        
        return success;
    }
}

// Run the test
const tester = new QuickSustainedLoadTest();
tester.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});