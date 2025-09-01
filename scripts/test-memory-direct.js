#!/usr/bin/env node

/**
 * Direct memory test without orchestrator overhead
 */

import { RpcConnectionPool } from '../src/detection/transport/rpc-connection-pool.js';

class DirectMemoryTest {
    constructor() {
        this.pool = null;
        this.isRunning = false;
        this.stats = { total: 0, success: 0, failed: 0 };
        this.memorySnapshots = [];
    }

    async run() {
        console.log('💾 Direct Memory Test (2 minutes)');
        console.log('=' .repeat(50));
        
        try {
            // Direct pool creation
            this.pool = new RpcConnectionPool({
                endpoints: [
                    'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
                    'https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY',
                    'https://api.mainnet-beta.solana.com'
                ],
                maxGlobalInFlight: 50,
                queueMaxSize: 500
            });
            
            console.log('✅ Pool created with memory fixes\n');
            
            // Force initial GC
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Capture initial memory
            this.captureMemory('Initial');
            
            // Run load test
            this.isRunning = true;
            const startTime = Date.now();
            
            // Start workers
            const workers = [];
            for (let i = 0; i < 20; i++) {
                workers.push(this.runWorker());
            }
            
            // Monitor memory every 30 seconds
            const monitor = setInterval(() => {
                this.captureMemory('During');
            }, 30000);
            
            // Run for 2 minutes
            await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
            
            // Stop test
            this.isRunning = false;
            clearInterval(monitor);
            
            // Wait for workers
            await Promise.allSettled(workers);
            
            // Final GC and memory capture
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            this.captureMemory('Final');
            
            // Analyze results
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
                
                const result = await this.pool.call(method, [], {
                    failoverBudgetMs: 5000,
                    timeout: 3000
                });
                
                if (result !== undefined) {
                    this.stats.success++;
                }
            } catch (error) {
                this.stats.failed++;
            }
            
            this.stats.total++;
            
            // Small delay
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
            
        console.log(`[${label}] Heap: ${snapshot.heapMB.toFixed(2)}MB | RSS: ${snapshot.rssMB.toFixed(2)}MB | Success: ${successRate}% | Requests: ${this.stats.total}`);
    }

    analyzeResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 DIRECT TEST RESULTS');
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
        console.log(`  Projected/Hour: ${heapGrowthPerHour.toFixed(1)}%`);
        
        console.log('\nPerformance:');
        console.log(`  Total: ${this.stats.total}`);
        console.log(`  Success: ${successRate.toFixed(1)}%`);
        
        const memoryOk = heapGrowthPerHour < 2;
        const successOk = successRate >= 90;
        
        console.log('\n🎯 Targets:');
        console.log(`  ${memoryOk ? '✅' : '❌'} Memory <2%/hour (actual: ${heapGrowthPerHour.toFixed(1)}%)`);
        console.log(`  ${successOk ? '✅' : '❌'} Success ≥90% (actual: ${successRate.toFixed(1)}%)`);
        
        const passed = memoryOk && successOk;
        console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (memoryOk) {
            console.log('\n✨ Memory fixes are working! Growth is under control.');
        } else {
            console.log('\n⚠️  Memory growth still too high. Further investigation needed.');
        }
        
        return passed;
    }
}

// Run test
console.log('Running direct pool test (bypassing orchestrator)...\n');
const test = new DirectMemoryTest();
test.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});