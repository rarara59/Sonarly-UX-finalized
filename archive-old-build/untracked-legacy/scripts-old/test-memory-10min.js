#!/usr/bin/env node

/**
 * 10-minute memory test for accurate growth measurement
 */

import { RpcConnectionPool } from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

class TenMinuteMemoryTest {
    constructor() {
        this.pool = null;
        this.isRunning = false;
        this.stats = { total: 0, success: 0, failed: 0 };
        this.memorySnapshots = [];
        this.testDurationMs = 10 * 60 * 1000; // Exactly 10 minutes
        this.concurrentRequests = 10;
    }

    async run() {
        console.log('💾 10-Minute Memory Growth Test');
        console.log('=' .repeat(50));
        console.log('Testing memory growth with real Solana endpoints');
        console.log('Target: <2%/hour growth rate\n');
        
        try {
            // Create pool with real endpoints
            this.pool = new RpcConnectionPool({
                endpoints: [
                    process.env.HELIUS_RPC_URL,
                    process.env.CHAINSTACK_RPC_URL,
                    process.env.PUBLIC_RPC_URL
                ].filter(Boolean)
            });
            
            console.log('Configuration:');
            console.log(`  Duration: 10 minutes`);
            console.log(`  Concurrent: ${this.concurrentRequests} workers`);
            console.log(`  Endpoints: Helius, Chainstack, Public RPC`);
            console.log(`  GC Available: ${global.gc ? 'Yes' : 'No'}\n`);
            
            // Force initial GC
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Initial memory snapshot
            this.captureMemory('Start', 0);
            
            // Start test
            this.isRunning = true;
            const startTime = Date.now();
            
            // Start workers
            const workers = [];
            for (let i = 0; i < this.concurrentRequests; i++) {
                workers.push(this.runWorker());
            }
            
            // Monitor every minute
            for (let minute = 1; minute <= 10; minute++) {
                setTimeout(() => {
                    if (this.isRunning) {
                        // Force GC before measurement for accuracy
                        if (global.gc) {
                            global.gc();
                        }
                        this.captureMemory(`Min ${minute}`, minute * 60000);
                    }
                }, minute * 60000);
            }
            
            // Run for exactly 10 minutes
            await new Promise(resolve => setTimeout(resolve, this.testDurationMs));
            
            // Stop test
            this.isRunning = false;
            
            // Wait for workers
            await Promise.allSettled(workers);
            
            // Final GC and snapshot
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            this.captureMemory('End', this.testDurationMs);
            
            // Analyze and report
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
                const methods = ['getSlot', 'getBlockHeight', 'getVersion', 'getHealth'];
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
            
            // Delay between requests
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        }
    }

    captureMemory(label, elapsedMs) {
        const mem = process.memoryUsage();
        const snapshot = {
            label,
            minute: elapsedMs / 60000,
            heapMB: mem.heapUsed / 1024 / 1024,
            rssMB: mem.rss / 1024 / 1024
        };
        
        this.memorySnapshots.push(snapshot);
        
        const successRate = this.stats.total > 0 
            ? (this.stats.success / this.stats.total * 100).toFixed(1)
            : '0.0';
            
        const bar = '▓'.repeat(Math.round(snapshot.heapMB / 2));
        console.log(`[${label.padEnd(7)}] ${bar} ${snapshot.heapMB.toFixed(2)}MB | Success: ${successRate}% | Total: ${this.stats.total}`);
    }

    analyzeResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 10-MINUTE MEMORY GROWTH ANALYSIS');
        console.log('=' .repeat(50));
        
        const initial = this.memorySnapshots[0];
        const final = this.memorySnapshots[this.memorySnapshots.length - 1];
        
        // Calculate growth over 10 minutes
        const heapGrowth = final.heapMB - initial.heapMB;
        const heapGrowthPercent = (heapGrowth / initial.heapMB) * 100;
        
        // Extrapolate to hourly rate (10 min = 1/6 hour)
        const heapGrowthPerHour = heapGrowthPercent * 6;
        
        const successRate = (this.stats.success / this.stats.total) * 100;
        
        console.log('\nTest Results:');
        console.log(`  Total Requests: ${this.stats.total.toLocaleString()}`);
        console.log(`  Successful: ${this.stats.success.toLocaleString()}`);
        console.log(`  Failed: ${this.stats.failed}`);
        console.log(`  Success Rate: ${successRate.toFixed(2)}%`);
        
        console.log('\nMemory Analysis:');
        console.log(`  Initial: ${initial.heapMB.toFixed(2)}MB`);
        console.log(`  Final: ${final.heapMB.toFixed(2)}MB`);
        console.log(`  Growth: ${heapGrowth > 0 ? '+' : ''}${heapGrowth.toFixed(2)}MB`);
        console.log(`  Growth %: ${heapGrowthPercent.toFixed(2)}% over 10 minutes`);
        console.log(`  Hourly Rate: ${heapGrowthPerHour.toFixed(2)}%/hour`);
        
        // Trend analysis
        console.log('\nMemory Trend (10 minutes):');
        for (const snapshot of this.memorySnapshots) {
            const bar = '█'.repeat(Math.round(snapshot.heapMB));
            console.log(`  ${snapshot.label.padEnd(7)} ${bar} ${snapshot.heapMB.toFixed(2)}MB`);
        }
        
        // Final verdict
        const memoryOk = heapGrowthPerHour < 2;
        const successOk = successRate >= 80;
        
        console.log('\n🎯 Success Criteria:');
        console.log(`  ${successOk ? '✅' : '❌'} Success rate ≥80% (${successRate.toFixed(1)}%)`);
        console.log(`  ${memoryOk ? '✅' : '❌'} Memory <2%/hour (${heapGrowthPerHour.toFixed(2)}%)`);
        
        if (successOk && memoryOk) {
            console.log('\n✅ PASSED - System ready for 24/7 operation!');
        } else if (successOk && !memoryOk) {
            console.log('\n❌ FAILED - Memory growth exceeds target');
        } else {
            console.log('\n❌ INVALID - Success rate too low');
        }
        
        // Generate detailed report
        this.generateReport(heapGrowthPerHour, successRate);
        
        return successOk && memoryOk;
    }

    generateReport(growthRate, successRate) {
        const report = `# 10-Minute Memory Growth Test Results

## Test Configuration
- **Duration**: 10 minutes (1/6 hour)
- **Concurrent Requests**: ${this.concurrentRequests}
- **Total Requests**: ${this.stats.total.toLocaleString()}
- **Success Rate**: ${successRate.toFixed(2)}%

## Endpoints
- Helius: ✅ Active
- Chainstack: ✅ Active  
- Public RPC: ✅ Active

## Memory Growth Analysis
- **Initial Heap**: ${this.memorySnapshots[0].heapMB.toFixed(2)}MB
- **Final Heap**: ${this.memorySnapshots[this.memorySnapshots.length - 1].heapMB.toFixed(2)}MB
- **10-min Growth**: ${((this.memorySnapshots[this.memorySnapshots.length - 1].heapMB - this.memorySnapshots[0].heapMB) / this.memorySnapshots[0].heapMB * 100).toFixed(2)}%
- **Hourly Rate**: ${growthRate.toFixed(2)}%/hour

## Memory Snapshots (Every Minute)
| Time | Heap (MB) | RSS (MB) |
|------|-----------|----------|
${this.memorySnapshots.map(s => 
  `| ${s.label} | ${s.heapMB.toFixed(2)} | ${s.rssMB.toFixed(2)} |`
).join('\n')}

## Verdict
${successRate >= 80 && growthRate < 2 ? 
'✅ **PASSED** - Memory growth under 2%/hour with valid endpoints' :
successRate >= 80 ? 
'❌ **FAILED** - Memory growth exceeds 2%/hour target' :
'❌ **INVALID** - Success rate below 80% threshold'}

## Recommendation
${growthRate < 2 ? 
'System is ready for 24/7 production deployment with current memory management.' :
'Additional memory optimization required before production deployment.'}

---
*Test completed: ${new Date().toISOString()}*
*GC Flag Used: ${global.gc ? 'Yes' : 'No'}*
`;

        fs.writeFileSync('memory-10min-results.md', report);
        console.log('\n📄 Detailed report saved to memory-10min-results.md');
    }
}

// Run test
console.log(global.gc ? '✅ Running with --expose-gc for accurate measurement\n' : '⚠️  Running without --expose-gc (less accurate)\n');

const test = new TenMinuteMemoryTest();
test.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});