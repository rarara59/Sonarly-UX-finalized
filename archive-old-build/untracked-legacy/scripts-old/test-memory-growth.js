#!/usr/bin/env node

/**
 * Memory Growth Test - Validates <2%/hour growth requirement
 */

import { SystemOrchestrator } from '../system/orchestrator.js';
import { performance } from 'perf_hooks';
import fs from 'fs';

class MemoryGrowthTest {
    constructor() {
        this.results = {
            startTime: 0,
            endTime: 0,
            memorySnapshots: [],
            successRate: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0
        };
        this.orchestrator = null;
        this.rpcPool = null;
        this.isRunning = false;
        this.testDurationMs = 10 * 60 * 1000; // 10 minutes for proper measurement
        this.concurrentRequests = 20;
        this.snapshotIntervalMs = 60000; // Every minute
    }

    async run() {
        console.log('💾 Memory Growth Testing with Cleanup Fixes');
        console.log('=' .repeat(50));
        console.log(`Testing memory growth over ${this.testDurationMs/60000} minutes`);
        console.log(`Target: <2%/hour growth rate\n`);

        try {
            await this.setup();
            await this.executeMemoryTest();
            this.analyzeResults();
            return this.calculateSuccess();
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
        
        // Force garbage collection at start if available
        if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('  ✅ Test environment ready with memory fixes');
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

    async executeMemoryTest() {
        console.log('📊 Starting memory growth test...');
        console.log('─'.repeat(40));
        
        this.results.startTime = performance.now();
        this.isRunning = true;
        
        // Initial memory snapshot
        this.captureMemorySnapshot('Initial');
        
        // Start monitoring
        const monitoringInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(monitoringInterval);
                return;
            }
            this.captureMemorySnapshot('During');
        }, this.snapshotIntervalMs);
        
        // Start load generation
        const loadPromises = [];
        for (let i = 0; i < this.concurrentRequests; i++) {
            loadPromises.push(this.generateLoad(i));
        }
        
        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, this.testDurationMs));
        
        // Stop test
        this.isRunning = false;
        clearInterval(monitoringInterval);
        
        // Wait for workers to finish
        await Promise.allSettled(loadPromises);
        
        this.results.endTime = performance.now();
        
        // Final memory snapshot
        await new Promise(resolve => setTimeout(resolve, 2000)); // Let things settle
        if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.captureMemorySnapshot('Final');
        
        console.log('\n  ✅ Memory growth test completed');
    }

    async generateLoad(workerId) {
        let localRequests = 0;
        let localSuccess = 0;
        
        while (this.isRunning) {
            try {
                const method = this.getRandomMethod();
                const result = await this.rpcPool.call(method.name, method.params, {
                    failoverBudgetMs: 5000,
                    timeout: 3000
                });
                
                if (result !== undefined) {
                    localSuccess++;
                    this.results.successfulRequests++;
                }
            } catch (error) {
                this.results.failedRequests++;
            }
            
            localRequests++;
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

    captureMemorySnapshot(label) {
        const memUsage = process.memoryUsage();
        const elapsedMinutes = ((performance.now() - this.results.startTime) / 60000).toFixed(1);
        
        const snapshot = {
            timestamp: Date.now(),
            elapsedMinutes: parseFloat(elapsedMinutes),
            heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
            heapTotal: memUsage.heapTotal / 1024 / 1024,
            rss: memUsage.rss / 1024 / 1024,
            external: memUsage.external / 1024 / 1024,
            label: label
        };
        
        this.results.memorySnapshots.push(snapshot);
        
        const successRate = this.results.totalRequests > 0 
            ? (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(1)
            : 0;
        
        console.log(`  [${elapsedMinutes} min] ${label}: Heap ${snapshot.heapUsed.toFixed(2)}MB | RSS ${snapshot.rss.toFixed(2)}MB | Success ${successRate}% | Requests: ${this.results.totalRequests}`);
    }

    analyzeResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 MEMORY GROWTH ANALYSIS');
        console.log('=' .repeat(50));
        
        if (this.results.memorySnapshots.length < 2) {
            console.log('❌ Insufficient data for analysis');
            return;
        }
        
        const initial = this.results.memorySnapshots[0];
        const final = this.results.memorySnapshots[this.results.memorySnapshots.length - 1];
        const durationMinutes = (this.results.endTime - this.results.startTime) / 60000;
        
        // Calculate growth rates
        const heapGrowth = final.heapUsed - initial.heapUsed;
        const heapGrowthPercent = (heapGrowth / initial.heapUsed) * 100;
        const heapGrowthPerHour = (heapGrowthPercent * (60 / durationMinutes));
        
        const rssGrowth = final.rss - initial.rss;
        const rssGrowthPercent = (rssGrowth / initial.rss) * 100;
        const rssGrowthPerHour = (rssGrowthPercent * (60 / durationMinutes));
        
        // Success rate
        this.results.successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
        
        console.log('\n📈 Memory Usage:');
        console.log(`  Initial Heap: ${initial.heapUsed.toFixed(2)}MB`);
        console.log(`  Final Heap: ${final.heapUsed.toFixed(2)}MB`);
        console.log(`  Heap Growth: ${heapGrowth.toFixed(2)}MB (${heapGrowthPercent.toFixed(1)}%)`);
        console.log(`  Heap Growth/Hour: ${heapGrowthPerHour.toFixed(1)}%`);
        
        console.log('\n💾 RSS Memory:');
        console.log(`  Initial RSS: ${initial.rss.toFixed(2)}MB`);
        console.log(`  Final RSS: ${final.rss.toFixed(2)}MB`);
        console.log(`  RSS Growth: ${rssGrowth.toFixed(2)}MB (${rssGrowthPercent.toFixed(1)}%)`);
        console.log(`  RSS Growth/Hour: ${rssGrowthPerHour.toFixed(1)}%`);
        
        console.log('\n📊 Performance:');
        console.log(`  Total Requests: ${this.results.totalRequests}`);
        console.log(`  Success Rate: ${this.results.successRate.toFixed(2)}%`);
        console.log(`  Throughput: ${(this.results.totalRequests / (durationMinutes * 60)).toFixed(1)} req/s`);
        
        // Store key metrics for validation
        this.results.heapGrowthPerHour = heapGrowthPerHour;
        this.results.rssGrowthPerHour = rssGrowthPerHour;
    }

    calculateSuccess() {
        const memoryTarget = 2; // <2%/hour target
        const successRateTarget = 90; // Maintain 90%+ success
        
        const memoryMet = this.results.heapGrowthPerHour < memoryTarget;
        const successMet = this.results.successRate >= successRateTarget;
        
        console.log('\n🎯 SUCCESS CRITERIA:');
        console.log(`  ${memoryMet ? '✅' : '❌'} Memory growth <${memoryTarget}%/hour (actual: ${this.results.heapGrowthPerHour.toFixed(1)}%)`);
        console.log(`  ${successMet ? '✅' : '❌'} Success rate ≥${successRateTarget}% (actual: ${this.results.successRate.toFixed(1)}%)`);
        
        const allMet = memoryMet && successMet;
        
        console.log(`\n🎯 OVERALL: ${allMet ? '✅ ALL CRITERIA MET' : '❌ SOME CRITERIA NOT MET'}`);
        
        if (allMet) {
            console.log('\n✨ Memory fixes successful! System ready for 24/7 operation.');
        } else {
            console.log('\n⚠️  Memory or performance issues remain.');
        }
        
        // Generate report
        this.generateReport(allMet);
        
        return allMet;
    }

    generateReport(success) {
        const report = `# Memory Growth Test Results

## Test Configuration
- Duration: ${(this.testDurationMs / 60000).toFixed(1)} minutes
- Concurrent Requests: ${this.concurrentRequests}
- Total Requests: ${this.results.totalRequests}

## Memory Growth Analysis
- **Heap Growth/Hour**: ${this.results.heapGrowthPerHour.toFixed(2)}%
- **RSS Growth/Hour**: ${this.results.rssGrowthPerHour.toFixed(2)}%
- **Target**: <2%/hour
- **Result**: ${this.results.heapGrowthPerHour < 2 ? '✅ PASSED' : '❌ FAILED'}

## Performance Metrics
- **Success Rate**: ${this.results.successRate.toFixed(2)}%
- **Target**: ≥90%
- **Result**: ${this.results.successRate >= 90 ? '✅ PASSED' : '❌ FAILED'}

## Memory Snapshots
${this.results.memorySnapshots.map(s => 
  `| ${s.elapsedMinutes.toFixed(1)} min | ${s.heapUsed.toFixed(2)}MB | ${s.rss.toFixed(2)}MB | ${s.label} |`
).join('\n')}

## Conclusion
${success ? 
'✅ Memory cleanup fixes are working effectively. The system can now operate 24/7 without memory exhaustion.' :
'❌ Additional memory optimization needed to achieve production stability.'}

---
*Test completed at ${new Date().toISOString()}*
`;

        fs.writeFileSync('memory-growth-test-results.md', report);
        console.log('\n✅ Report saved to memory-growth-test-results.md');
    }
}

// Enable garbage collection if available
if (!global.gc) {
    console.log('⚠️  Running without --expose-gc flag. Memory measurements may be less accurate.');
    console.log('   For best results, run with: node --expose-gc scripts/test-memory-growth.js\n');
}

// Run the test
const tester = new MemoryGrowthTest();
tester.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});