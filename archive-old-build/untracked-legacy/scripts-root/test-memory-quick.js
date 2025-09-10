#!/usr/bin/env node

/**
 * Quick 2-minute memory test to verify improvements
 */

import { SystemOrchestrator } from '../system/orchestrator.js';
import { performance } from 'perf_hooks';

class QuickMemoryTest {
    constructor() {
        this.orchestrator = null;
        this.rpcPool = null;
        this.isRunning = false;
        this.testDurationMs = 2 * 60 * 1000; // 2 minutes quick test
        this.memorySnapshots = [];
        this.stats = { total: 0, success: 0, failed: 0 };
    }

    async run() {
        console.log('💾 Quick Memory Test (2 minutes)');
        console.log('=' .repeat(50));
        
        try {
            await this.setup();
            await this.runLoadTest();
            return this.analyzeResults();
        } catch (error) {
            console.error('❌ Error:', error);
            return false;
        } finally {
            await this.cleanup();
        }
    }

    async setup() {
        console.log('Setting up...');
        this.orchestrator = new SystemOrchestrator();
        await this.orchestrator.startSystem();
        this.rpcPool = this.orchestrator.components['rpc-connection-pool'];
        
        // Force GC if available
        if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('✅ Ready with memory fixes\n');
    }

    async cleanup() {
        this.isRunning = false;
        if (this.orchestrator) {
            await this.orchestrator.shutdown();
        }
    }

    async runLoadTest() {
        console.log('Starting load test...');
        this.isRunning = true;
        const startTime = Date.now();
        
        // Capture initial memory
        this.captureMemory('Start');
        
        // Monitor every 30 seconds
        const monitor = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(monitor);
                return;
            }
            this.captureMemory('During');
        }, 30000);
        
        // Generate load
        const workers = [];
        for (let i = 0; i < 20; i++) {
            workers.push(this.generateLoad());
        }
        
        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, this.testDurationMs));
        
        this.isRunning = false;
        clearInterval(monitor);
        await Promise.allSettled(workers);
        
        // Final memory after GC
        if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        this.captureMemory('Final');
        
        console.log('\n✅ Test completed');
    }

    async generateLoad() {
        while (this.isRunning) {
            try {
                const methods = ['getSlot', 'getBlockHeight', 'getVersion'];
                const method = methods[Math.floor(Math.random() * methods.length)];
                
                await this.rpcPool.call(method, [], { 
                    failoverBudgetMs: 5000,
                    timeout: 3000 
                });
                
                this.stats.success++;
            } catch (error) {
                this.stats.failed++;
            }
            
            this.stats.total++;
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        }
    }

    captureMemory(label) {
        const mem = process.memoryUsage();
        const snapshot = {
            label,
            time: Date.now(),
            heapMB: mem.heapUsed / 1024 / 1024,
            rssMB: mem.rss / 1024 / 1024
        };
        
        this.memorySnapshots.push(snapshot);
        
        const successRate = this.stats.total > 0 
            ? (this.stats.success / this.stats.total * 100).toFixed(1)
            : 0;
            
        console.log(`[${label}] Heap: ${snapshot.heapMB.toFixed(2)}MB | RSS: ${snapshot.rssMB.toFixed(2)}MB | Success: ${successRate}% | Requests: ${this.stats.total}`);
    }

    analyzeResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 RESULTS');
        console.log('=' .repeat(50));
        
        const initial = this.memorySnapshots[0];
        const final = this.memorySnapshots[this.memorySnapshots.length - 1];
        
        const heapGrowth = final.heapMB - initial.heapMB;
        const heapGrowthPercent = (heapGrowth / initial.heapMB) * 100;
        const heapGrowthPerHour = heapGrowthPercent * 30; // 2 min = 1/30 hour
        
        const successRate = (this.stats.success / this.stats.total) * 100;
        
        console.log('\nMemory Growth:');
        console.log(`  Heap: ${initial.heapMB.toFixed(2)}MB → ${final.heapMB.toFixed(2)}MB`);
        console.log(`  Growth: ${heapGrowth.toFixed(2)}MB (${heapGrowthPercent.toFixed(1)}%)`);
        console.log(`  Projected/Hour: ${heapGrowthPerHour.toFixed(1)}%`);
        
        console.log('\nPerformance:');
        console.log(`  Requests: ${this.stats.total}`);
        console.log(`  Success Rate: ${successRate.toFixed(1)}%`);
        
        const memoryOk = heapGrowthPerHour < 2;
        const successOk = successRate >= 90;
        
        console.log('\n🎯 Targets:');
        console.log(`  ${memoryOk ? '✅' : '❌'} Memory <2%/hour (${heapGrowthPerHour.toFixed(1)}%)`);
        console.log(`  ${successOk ? '✅' : '❌'} Success ≥90% (${successRate.toFixed(1)}%)`);
        
        const passed = memoryOk && successOk;
        console.log(`\n${passed ? '✅ PASSED - Memory fixes working!' : '❌ FAILED - Issues remain'}`);
        
        return passed;
    }
}

// Run test
const test = new QuickMemoryTest();
test.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});