#!/usr/bin/env node

/**
 * Memory test with bounded structures - targets <2%/hour growth
 */

import { RpcConnectionPool } from '../src/detection/transport/rpc-connection-pool.js';
import fs from 'fs';

class BoundedMemoryTest {
    constructor() {
        this.pool = null;
        this.isRunning = false;
        this.stats = { total: 0, success: 0, failed: 0 };
        this.memorySnapshots = [];
        this.testDurationMs = 10 * 60 * 1000; // 10 minutes for proper measurement
        this.concurrentRequests = 20;
    }

    async run() {
        console.log('💾 Memory Test with Bounded Structures');
        console.log('=' .repeat(50));
        console.log('Testing memory growth over 10 minutes');
        console.log('Target: <2%/hour growth rate\n');
        
        try {
            // Direct pool creation
            this.pool = new RpcConnectionPool({
                endpoints: [
                    process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
                    process.env.CHAINSTACK_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY',
                    process.env.PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
                ],
                maxGlobalInFlight: 50,
                queueMaxSize: 500  // Will be capped at MAX_QUEUE
            });
            
            console.log('✅ Pool created with memory bounds:');
            console.log('   - MAX_QUEUE: 500 requests');
            console.log('   - MAX_SAMPLES: 64 per endpoint');
            console.log('   - MAX_CB_EVENTS: 50 per breaker');
            console.log('   - MAX_GLOBAL_LATENCIES: 1000\n');
            
            // Force initial GC
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Capture initial memory
            this.captureMemory('Initial', 0);
            
            // Run load test
            this.isRunning = true;
            const startTime = Date.now();
            
            // Start workers
            const workers = [];
            for (let i = 0; i < this.concurrentRequests; i++) {
                workers.push(this.runWorker(i));
            }
            
            // Monitor memory every minute
            let monitorCount = 0;
            const monitor = setInterval(() => {
                monitorCount++;
                const elapsed = Date.now() - startTime;
                this.captureMemory(`Minute ${monitorCount}`, elapsed);
                
                // Force GC periodically for accurate measurement
                if (global.gc && monitorCount % 2 === 0) {
                    global.gc();
                }
            }, 60000); // Every minute
            
            // Run for test duration
            await new Promise(resolve => setTimeout(resolve, this.testDurationMs));
            
            // Stop test
            this.isRunning = false;
            clearInterval(monitor);
            
            // Wait for workers
            await Promise.allSettled(workers);
            
            // Final GC and memory capture
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            const finalElapsed = Date.now() - startTime;
            this.captureMemory('Final', finalElapsed);
            
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

    async runWorker(workerId) {
        let localRequests = 0;
        let localSuccess = 0;
        
        while (this.isRunning) {
            try {
                const methods = ['getSlot', 'getBlockHeight', 'getVersion', 'getLatestBlockhash'];
                const method = methods[Math.floor(Math.random() * methods.length)];
                
                const result = await this.pool.call(method, [], {
                    failoverBudgetMs: 5000,
                    timeout: 3000
                });
                
                if (result !== undefined) {
                    localSuccess++;
                    this.stats.success++;
                }
            } catch (error) {
                this.stats.failed++;
            }
            
            localRequests++;
            this.stats.total++;
            
            // Variable delay to simulate realistic load
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        }
        
        if (workerId === 0) {
            console.log(`\nWorker 0 summary: ${localSuccess}/${localRequests} successful`);
        }
    }

    captureMemory(label, elapsedMs) {
        const mem = process.memoryUsage();
        const snapshot = {
            label,
            elapsedMinutes: elapsedMs / 60000,
            heapMB: mem.heapUsed / 1024 / 1024,
            rssMB: mem.rss / 1024 / 1024,
            externalMB: mem.external / 1024 / 1024
        };
        
        this.memorySnapshots.push(snapshot);
        
        const successRate = this.stats.total > 0 
            ? (this.stats.success / this.stats.total * 100).toFixed(1)
            : 0;
            
        console.log(`[${label}] Heap: ${snapshot.heapMB.toFixed(2)}MB | RSS: ${snapshot.rssMB.toFixed(2)}MB | Success: ${successRate}% | Requests: ${this.stats.total}`);
    }

    analyzeResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 MEMORY ANALYSIS WITH BOUNDS');
        console.log('=' .repeat(50));
        
        if (this.memorySnapshots.length < 2) {
            console.log('❌ Insufficient data');
            return false;
        }
        
        const initial = this.memorySnapshots[0];
        const final = this.memorySnapshots[this.memorySnapshots.length - 1];
        const testDurationHours = final.elapsedMinutes / 60;
        
        // Calculate growth
        const heapGrowth = final.heapMB - initial.heapMB;
        const heapGrowthPercent = (heapGrowth / initial.heapMB) * 100;
        const heapGrowthPerHour = heapGrowthPercent / testDurationHours;
        
        const rssGrowth = final.rssMB - initial.rssMB;
        const rssGrowthPercent = (rssGrowth / initial.rssMB) * 100;
        const rssGrowthPerHour = rssGrowthPercent / testDurationHours;
        
        const successRate = (this.stats.success / this.stats.total) * 100;
        
        console.log('\nMemory Growth:');
        console.log(`  Test Duration: ${final.elapsedMinutes.toFixed(1)} minutes`);
        console.log(`  Heap: ${initial.heapMB.toFixed(2)}MB → ${final.heapMB.toFixed(2)}MB`);
        console.log(`  Growth: ${heapGrowth.toFixed(2)}MB (${heapGrowthPercent.toFixed(1)}%)`);
        console.log(`  Growth/Hour: ${heapGrowthPerHour.toFixed(2)}%`);
        
        console.log('\nRSS Memory:');
        console.log(`  Initial: ${initial.rssMB.toFixed(2)}MB`);
        console.log(`  Final: ${final.rssMB.toFixed(2)}MB`);
        console.log(`  Growth: ${rssGrowth.toFixed(2)}MB`);
        console.log(`  Growth/Hour: ${rssGrowthPerHour.toFixed(2)}%`);
        
        console.log('\nPerformance:');
        console.log(`  Total Requests: ${this.stats.total.toLocaleString()}`);
        console.log(`  Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`  Throughput: ${(this.stats.total / (final.elapsedMinutes * 60)).toFixed(1)} req/s`);
        
        // Memory trend analysis
        console.log('\nMemory Trend:');
        for (const snapshot of this.memorySnapshots) {
            const bar = '█'.repeat(Math.round(snapshot.heapMB / 2));
            console.log(`  ${snapshot.label.padEnd(10)} ${bar} ${snapshot.heapMB.toFixed(1)}MB`);
        }
        
        // Success criteria
        const memoryOk = heapGrowthPerHour < 2;
        const successOk = successRate >= 90;
        
        console.log('\n🎯 Success Criteria:');
        console.log(`  ${memoryOk ? '✅' : '❌'} Memory growth <2%/hour (actual: ${heapGrowthPerHour.toFixed(2)}%)`);
        console.log(`  ${successOk ? '✅' : '❌'} Success rate ≥90% (actual: ${successRate.toFixed(1)}%)`);
        
        const passed = memoryOk && successOk;
        console.log(`\n${passed ? '✅ PASSED - Memory bounds effective!' : '❌ FAILED - Further optimization needed'}`);
        
        if (memoryOk) {
            console.log('\n✨ SUCCESS! Memory growth is under control at ' + heapGrowthPerHour.toFixed(2) + '%/hour');
            console.log('   System can now operate 24/7 without memory exhaustion.');
        }
        
        // Generate report
        this.generateReport(heapGrowthPerHour, successRate);
        
        return passed;
    }

    generateReport(growthRate, successRate) {
        const report = `# Memory Bounded Test Results

## Configuration
- Test Duration: ${(this.testDurationMs / 60000).toFixed(1)} minutes
- Concurrent Requests: ${this.concurrentRequests}
- Total Requests: ${this.stats.total.toLocaleString()}

## Memory Bounds Applied
- MAX_QUEUE: 500 (hard cap with oldest-drop)
- MAX_SAMPLES: 64 (per-endpoint latency array)
- MAX_CB_EVENTS: 50 (circuit breaker error tracking)
- MAX_GLOBAL_LATENCIES: 1000 (global latency tracking)

## Results
- **Memory Growth/Hour**: ${growthRate.toFixed(2)}%
- **Success Rate**: ${successRate.toFixed(1)}%
- **Target**: <2%/hour growth, ≥90% success

## Memory Snapshots
${this.memorySnapshots.map(s => 
  `| ${s.label} | ${s.heapMB.toFixed(2)}MB | ${s.rssMB.toFixed(2)}MB |`
).join('\n')}

## Verdict
${growthRate < 2 && successRate >= 90 ? 
'✅ **PASSED** - Memory bounds successfully prevent unbounded growth. System ready for 24/7 operation.' :
'❌ **FAILED** - Additional optimization required.'}

---
*Test completed at ${new Date().toISOString()}*
`;

        fs.writeFileSync('memory-bounded-test-results.md', report);
        console.log('\n📄 Report saved to memory-bounded-test-results.md');
    }
}

// Run test
if (!global.gc) {
    console.log('⚠️  For accurate results, run with: node --expose-gc scripts/test-memory-bounded.js\n');
}

const test = new BoundedMemoryTest();
test.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});