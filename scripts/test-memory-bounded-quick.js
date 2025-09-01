#!/usr/bin/env node

/**
 * Quick 2-minute memory test with bounded structures
 */

import { RpcConnectionPool } from '../src/detection/transport/rpc-connection-pool.js';

class QuickBoundedMemoryTest {
    constructor() {
        this.pool = null;
        this.isRunning = false;
        this.stats = { total: 0, success: 0, failed: 0 };
        this.memorySnapshots = [];
    }

    async run() {
        console.log('💾 Quick Memory Test with Bounds (2 minutes)');
        console.log('=' .repeat(50));
        
        try {
            this.pool = new RpcConnectionPool({
                endpoints: [
                    'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
                    'https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY',
                    'https://api.mainnet-beta.solana.com'
                ]
            });
            
            console.log('✅ Pool created with memory bounds');
            console.log('   MAX_QUEUE=500, MAX_SAMPLES=64, MAX_CB_EVENTS=50\n');
            
            // Force initial GC
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Initial snapshot
            this.captureMemory('Initial');
            
            this.isRunning = true;
            const startTime = Date.now();
            
            // Start workers
            const workers = [];
            for (let i = 0; i < 20; i++) {
                workers.push(this.runWorker());
            }
            
            // Monitor every 30 seconds
            const intervals = [30000, 60000, 90000];
            for (const interval of intervals) {
                setTimeout(() => {
                    if (this.isRunning) {
                        this.captureMemory(`${interval/1000}s`);
                    }
                }, interval);
            }
            
            // Run for 2 minutes
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            
            this.isRunning = false;
            await Promise.allSettled(workers);
            
            // Final snapshot after GC
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            this.captureMemory('Final');
            
            return this.analyzeResults();
            
        } catch (error) {
            console.error('❌ Error:', error);
            return false;
        } finally {
            if (this.pool) {
                await this.pool.destroy();
            }
        }
    }

    async runWorker() {
        while (this.isRunning) {
            try {
                const methods = ['getSlot', 'getBlockHeight', 'getVersion'];
                const method = methods[Math.floor(Math.random() * methods.length)];
                
                await this.pool.call(method, [], {
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
            heapMB: mem.heapUsed / 1024 / 1024,
            rssMB: mem.rss / 1024 / 1024
        };
        
        this.memorySnapshots.push(snapshot);
        
        const successRate = this.stats.total > 0 
            ? (this.stats.success / this.stats.total * 100).toFixed(1)
            : 0;
            
        console.log(`[${label.padEnd(8)}] Heap: ${snapshot.heapMB.toFixed(2)}MB | RSS: ${snapshot.rssMB.toFixed(2)}MB | Success: ${successRate}% | Total: ${this.stats.total}`);
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
        
        console.log('\nMemory:');
        console.log(`  Initial: ${initial.heapMB.toFixed(2)}MB`);
        console.log(`  Final: ${final.heapMB.toFixed(2)}MB`);
        console.log(`  Growth: ${heapGrowth.toFixed(2)}MB (${heapGrowthPercent.toFixed(1)}%)`);
        console.log(`  Projected/Hour: ${heapGrowthPerHour.toFixed(2)}%`);
        
        console.log('\nPerformance:');
        console.log(`  Total: ${this.stats.total}`);
        console.log(`  Success: ${successRate.toFixed(1)}%`);
        
        const memoryOk = heapGrowthPerHour < 2;
        const successOk = successRate >= 90;
        
        console.log('\n🎯 Targets:');
        console.log(`  ${memoryOk ? '✅' : '❌'} Memory <2%/hour (${heapGrowthPerHour.toFixed(2)}%)`);
        console.log(`  ${successOk ? '✅' : '❌'} Success ≥90% (${successRate.toFixed(1)}%)`);
        
        const passed = memoryOk && successOk;
        console.log(`\n${passed ? '✅ PASSED - Memory bounds working!' : '❌ FAILED'}`);
        
        if (memoryOk) {
            console.log('\n✨ Memory growth under control! Ready for 24/7 operation.');
        }
        
        return passed;
    }
}

// Run test
const test = new QuickBoundedMemoryTest();
test.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});