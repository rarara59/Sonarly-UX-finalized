#!/usr/bin/env node

/**
 * Memory test with real endpoints for accurate measurement
 */

import { RpcConnectionPool } from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

class RealEndpointMemoryTest {
    constructor(durationMinutes = 2) {
        this.pool = null;
        this.isRunning = false;
        this.stats = { total: 0, success: 0, failed: 0 };
        this.memorySnapshots = [];
        this.testDurationMs = durationMinutes * 60 * 1000;
        this.concurrentRequests = 10; // Start with 10 to avoid rate limits
    }

    async run() {
        console.log('💾 Memory Test with Real Endpoints');
        console.log('=' .repeat(50));
        console.log(`Duration: ${this.testDurationMs / 60000} minutes`);
        console.log(`Concurrent Requests: ${this.concurrentRequests}`);
        console.log('Using real Solana mainnet endpoints from .env\n');
        
        try {
            // Create pool with real endpoints from environment
            this.pool = new RpcConnectionPool({
                endpoints: [
                    process.env.HELIUS_RPC_URL,
                    process.env.CHAINSTACK_RPC_URL,
                    process.env.PUBLIC_RPC_URL
                ].filter(Boolean),
                maxGlobalInFlight: 50,
                queueMaxSize: 500
            });
            
            console.log('✅ Pool created with real endpoints:');
            console.log('   - Helius (Priority 1)');
            console.log('   - Chainstack (Priority 2)');
            console.log('   - Public RPC (Priority 3)\n');
            
            // Force initial GC if available
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Capture initial memory
            this.captureMemory('Initial', 0);
            
            // Start test
            this.isRunning = true;
            const startTime = Date.now();
            
            // Start workers
            const workers = [];
            for (let i = 0; i < this.concurrentRequests; i++) {
                workers.push(this.runWorker(i));
            }
            
            // Monitor memory every 30 seconds
            const monitorInterval = setInterval(() => {
                if (!this.isRunning) {
                    clearInterval(monitorInterval);
                    return;
                }
                const elapsed = Date.now() - startTime;
                this.captureMemory(`${Math.round(elapsed/1000)}s`, elapsed);
                
                // Force GC periodically if available
                if (global.gc && Math.random() < 0.3) {
                    global.gc();
                }
            }, 30000);
            
            // Run for test duration
            await new Promise(resolve => setTimeout(resolve, this.testDurationMs));
            
            // Stop test
            this.isRunning = false;
            clearInterval(monitorInterval);
            
            // Wait for workers to finish
            await Promise.allSettled(workers);
            
            // Final GC and memory capture
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 500));
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
        let localFailed = 0;
        
        while (this.isRunning) {
            try {
                // Use various read-only methods
                const methods = [
                    'getSlot',
                    'getBlockHeight',
                    'getVersion',
                    'getHealth',
                    'getLatestBlockhash'
                ];
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
                localFailed++;
                this.stats.failed++;
                
                // Log first few errors for debugging
                if (this.stats.failed <= 5) {
                    console.log(`Worker ${workerId} error: ${error.message.substring(0, 50)}`);
                }
            }
            
            localRequests++;
            this.stats.total++;
            
            // Variable delay to avoid rate limiting
            const delay = 100 + Math.random() * 200;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Log worker summary
        if (workerId === 0) {
            console.log(`\nWorker 0 summary: ${localSuccess}/${localRequests} (${(localSuccess/localRequests*100).toFixed(1)}%)`);
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
            
        console.log(`[${label.padEnd(8)}] Heap: ${snapshot.heapMB.toFixed(2)}MB | RSS: ${snapshot.rssMB.toFixed(2)}MB | Success: ${successRate}% | Total: ${this.stats.total}`);
    }

    analyzeResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 MEMORY ANALYSIS WITH REAL ENDPOINTS');
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
        const heapGrowthPerHour = testDurationHours > 0 ? heapGrowthPercent / testDurationHours : heapGrowthPercent * 30;
        
        const successRate = (this.stats.success / this.stats.total) * 100;
        
        console.log('\nTest Configuration:');
        console.log(`  Duration: ${final.elapsedMinutes.toFixed(1)} minutes`);
        console.log(`  Total Requests: ${this.stats.total.toLocaleString()}`);
        console.log(`  Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`  Throughput: ${(this.stats.total / (final.elapsedMinutes * 60)).toFixed(1)} req/s`);
        
        console.log('\nMemory Growth:');
        console.log(`  Initial Heap: ${initial.heapMB.toFixed(2)}MB`);
        console.log(`  Final Heap: ${final.heapMB.toFixed(2)}MB`);
        console.log(`  Growth: ${heapGrowth.toFixed(2)}MB (${heapGrowthPercent.toFixed(1)}%)`);
        console.log(`  Growth/Hour: ${heapGrowthPerHour.toFixed(2)}%`);
        
        // Success criteria
        const memoryOk = heapGrowthPerHour < 2;
        const successOk = successRate >= 80;
        
        console.log('\n🎯 Success Criteria:');
        console.log(`  ${successOk ? '✅' : '❌'} Success rate ≥80% (actual: ${successRate.toFixed(1)}%)`);
        console.log(`  ${memoryOk ? '✅' : '❌'} Memory growth <2%/hour (actual: ${heapGrowthPerHour.toFixed(2)}%)`);
        
        const passed = memoryOk && successOk;
        
        if (successOk) {
            console.log('\n✅ VALID TEST - Success rate confirms endpoints working');
            
            if (memoryOk) {
                console.log('✅ MEMORY TARGET MET - Growth under 2%/hour');
                console.log('   System ready for 24/7 operation!');
            } else {
                console.log('❌ MEMORY TARGET NOT MET - Growth exceeds 2%/hour');
                console.log('   Further optimization needed');
            }
        } else {
            console.log('\n❌ INVALID TEST - Success rate too low for accurate measurement');
        }
        
        // Generate report
        this.generateReport(heapGrowthPerHour, successRate);
        
        return passed;
    }

    generateReport(growthRate, successRate) {
        const report = `# Memory Test with Real Endpoints

## Test Configuration
- Duration: ${(this.testDurationMs / 60000).toFixed(1)} minutes
- Concurrent Requests: ${this.concurrentRequests}
- Total Requests: ${this.stats.total.toLocaleString()}
- Failed Requests: ${this.stats.failed}

## Endpoints Used
- Helius: ${process.env.HELIUS_RPC_URL ? '✅ Configured' : '❌ Missing'}
- Chainstack: ${process.env.CHAINSTACK_RPC_URL ? '✅ Configured' : '❌ Missing'}
- Public RPC: ${process.env.PUBLIC_RPC_URL ? '✅ Configured' : '❌ Missing'}

## Results
- **Success Rate**: ${successRate.toFixed(1)}%
- **Memory Growth/Hour**: ${growthRate.toFixed(2)}%
- **Test Validity**: ${successRate >= 80 ? '✅ Valid' : '❌ Invalid (low success rate)'}

## Memory Snapshots
${this.memorySnapshots.map(s => 
  `| ${s.label} | ${s.heapMB.toFixed(2)}MB | ${s.rssMB.toFixed(2)}MB |`
).join('\n')}

## Verdict
${successRate >= 80 ? 
  (growthRate < 2 ? 
    '✅ **PASSED** - Memory growth under control with real endpoints' :
    '❌ **FAILED** - Memory growth exceeds target despite real endpoints') :
  '❌ **INVALID TEST** - Success rate too low for accurate measurement'}

---
*Test completed at ${new Date().toISOString()}*
`;

        fs.writeFileSync('memory-real-endpoints-results.md', report);
        console.log('\n📄 Report saved to memory-real-endpoints-results.md');
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const durationMinutes = args.includes('--quick') ? 2 : 10;

// Check for GC flag
if (!global.gc && durationMinutes >= 10) {
    console.log('⚠️  For best results with 10-minute test, run with:');
    console.log('   node --expose-gc scripts/test-memory-real-endpoints.js\n');
}

// Run test
const test = new RealEndpointMemoryTest(durationMinutes);
test.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});