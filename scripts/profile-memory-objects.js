#!/usr/bin/env node

/**
 * Memory profiling script to identify object retention patterns
 * Uses Node.js built-in profiling capabilities
 */

import { RpcConnectionPool } from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';
import v8 from 'v8';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

class MemoryProfiler {
    constructor() {
        this.pool = null;
        this.isRunning = false;
        this.stats = { total: 0, success: 0, failed: 0 };
        this.memorySnapshots = [];
        this.objectCounts = new Map();
        this.testDurationMs = 5 * 60 * 1000; // 5 minutes
        this.snapshotInterval = 30000; // 30 seconds
        this.concurrentRequests = 10;
        this.heapDumpCount = 0;
    }

    async run() {
        console.log('🔬 Memory Object Profiling Tool');
        console.log('=' .repeat(60));
        console.log('Profiling object retention patterns with real endpoints');
        console.log('Target: Identify objects causing 615%/hour memory growth\n');
        
        try {
            // Create output directory for heap dumps
            const dumpDir = 'memory-dumps';
            if (!fs.existsSync(dumpDir)) {
                fs.mkdirSync(dumpDir);
            }
            
            // Create pool with real endpoints
            this.pool = new RpcConnectionPool({
                endpoints: [
                    process.env.HELIUS_RPC_URL,
                    process.env.CHAINSTACK_RPC_URL,
                    process.env.PUBLIC_RPC_URL
                ].filter(Boolean)
            });
            
            console.log('Configuration:');
            console.log(`  Duration: 5 minutes`);
            console.log(`  Snapshots: Every 30 seconds`);
            console.log(`  Concurrent: ${this.concurrentRequests} workers`);
            console.log(`  Endpoints: Helius, Chainstack, Public RPC`);
            console.log(`  GC Available: ${global.gc ? 'Yes' : 'No'}\n`);
            
            // Initial cleanup and snapshot
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.captureSnapshot('Initial', 0);
            this.captureObjectCounts('Initial');
            
            // Take initial heap dump
            this.writeHeapDump('initial');
            
            // Start test
            this.isRunning = true;
            const startTime = Date.now();
            
            // Start workers
            const workers = [];
            for (let i = 0; i < this.concurrentRequests; i++) {
                workers.push(this.runWorker(i));
            }
            
            // Monitor every 30 seconds
            const monitorInterval = setInterval(() => {
                if (!this.isRunning) {
                    clearInterval(monitorInterval);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const minutes = (elapsed / 60000).toFixed(1);
                
                // Force GC before measurement
                if (global.gc) {
                    global.gc();
                }
                
                this.captureSnapshot(`${minutes}min`, elapsed);
                this.captureObjectCounts(`${minutes}min`);
                
                // Take heap dump every minute
                if (elapsed % 60000 < 30000 && this.heapDumpCount < 5) {
                    this.writeHeapDump(`${Math.round(elapsed/60000)}min`);
                }
            }, this.snapshotInterval);
            
            // Run for test duration
            await new Promise(resolve => setTimeout(resolve, this.testDurationMs));
            
            // Stop test
            this.isRunning = false;
            
            // Wait for workers
            await Promise.allSettled(workers);
            
            // Final cleanup and snapshot
            if (global.gc) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.captureSnapshot('Final', this.testDurationMs);
            this.captureObjectCounts('Final');
            
            // Take final heap dump
            this.writeHeapDump('final');
            
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
            localRequests++;
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        }
        
        if (workerId === 0) {
            console.log(`Worker 0 completed: ${localRequests} requests`);
        }
    }

    captureSnapshot(label, elapsedMs) {
        const mem = process.memoryUsage();
        const heapStats = v8.getHeapStatistics();
        
        const snapshot = {
            label,
            minute: elapsedMs / 60000,
            heapMB: mem.heapUsed / 1024 / 1024,
            rssMB: mem.rss / 1024 / 1024,
            externalMB: mem.external / 1024 / 1024,
            arrayBuffersMB: (mem.arrayBuffers || 0) / 1024 / 1024,
            totalHeapMB: heapStats.total_heap_size / 1024 / 1024,
            heapContexts: heapStats.number_of_native_contexts,
            detachedContexts: heapStats.number_of_detached_contexts
        };
        
        this.memorySnapshots.push(snapshot);
        
        const successRate = this.stats.total > 0 
            ? (this.stats.success / this.stats.total * 100).toFixed(1)
            : '0.0';
        
        console.log(`[${label.padEnd(7)}] Heap: ${snapshot.heapMB.toFixed(2)}MB | External: ${snapshot.externalMB.toFixed(2)}MB | Contexts: ${snapshot.heapContexts} | Success: ${successRate}%`);
    }

    captureObjectCounts(label) {
        // Track key object patterns we suspect
        const counts = {
            label,
            poolEndpoints: this.pool.endpoints.length,
            poolQueueSize: this.getQueueSize(),
            poolRequestId: this.pool.requestId,
            globalLatencies: this.getGlobalLatenciesSize(),
            circuitBreakerEvents: this.getCircuitBreakerEvents(),
            endpointLatencies: this.getEndpointLatencies(),
            timestamp: Date.now()
        };
        
        this.objectCounts.set(label, counts);
    }

    getQueueSize() {
        try {
            return this.pool.requestQueue ? this.pool.requestQueue.length : 0;
        } catch {
            return 0;
        }
    }

    getGlobalLatenciesSize() {
        try {
            return this.pool.globalLatencies ? this.pool.globalLatencies.length : 0;
        } catch {
            return 0;
        }
    }

    getCircuitBreakerEvents() {
        let total = 0;
        try {
            for (const ep of this.pool.endpoints) {
                if (ep.breaker && ep.breaker.events) {
                    total += ep.breaker.events.length;
                }
            }
        } catch {}
        return total;
    }

    getEndpointLatencies() {
        let total = 0;
        try {
            for (const ep of this.pool.endpoints) {
                if (ep.latencySamples) {
                    total += ep.latencySamples.length;
                }
            }
        } catch {}
        return total;
    }

    writeHeapDump(label) {
        try {
            const filename = `memory-dumps/heap-${label}-${Date.now()}.heapsnapshot`;
            v8.writeHeapSnapshot(filename);
            console.log(`📸 Heap dump saved: ${filename}`);
            this.heapDumpCount++;
        } catch (error) {
            console.error(`Failed to write heap dump: ${error.message}`);
        }
    }

    analyzeResults() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 MEMORY PROFILING ANALYSIS');
        console.log('=' .repeat(60));
        
        const initial = this.memorySnapshots[0];
        const final = this.memorySnapshots[this.memorySnapshots.length - 1];
        
        // Calculate growth
        const heapGrowth = final.heapMB - initial.heapMB;
        const heapGrowthPercent = (heapGrowth / initial.heapMB) * 100;
        const heapGrowthPerHour = heapGrowthPercent * 12; // 5 min = 1/12 hour
        
        const externalGrowth = final.externalMB - initial.externalMB;
        const contextGrowth = final.heapContexts - initial.heapContexts;
        
        const successRate = (this.stats.success / this.stats.total) * 100;
        
        console.log('\nTest Results:');
        console.log(`  Total Requests: ${this.stats.total.toLocaleString()}`);
        console.log(`  Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`  Throughput: ${(this.stats.total / 300).toFixed(1)} req/s`);
        
        console.log('\nMemory Growth:');
        console.log(`  Heap: ${initial.heapMB.toFixed(2)}MB → ${final.heapMB.toFixed(2)}MB (+${heapGrowth.toFixed(2)}MB)`);
        console.log(`  External: ${initial.externalMB.toFixed(2)}MB → ${final.externalMB.toFixed(2)}MB (+${externalGrowth.toFixed(2)}MB)`);
        console.log(`  Contexts: ${initial.heapContexts} → ${final.heapContexts} (+${contextGrowth})`);
        console.log(`  Growth Rate: ${heapGrowthPerHour.toFixed(2)}%/hour`);
        
        console.log('\nObject Count Analysis:');
        const initialCounts = this.objectCounts.get('Initial');
        const finalCounts = this.objectCounts.get('Final');
        
        if (initialCounts && finalCounts) {
            console.log(`  Request Queue: ${initialCounts.poolQueueSize} → ${finalCounts.poolQueueSize} (+${finalCounts.poolQueueSize - initialCounts.poolQueueSize})`);
            console.log(`  Request ID: ${initialCounts.poolRequestId} → ${finalCounts.poolRequestId} (${finalCounts.poolRequestId - initialCounts.poolRequestId} requests)`);
            console.log(`  Global Latencies: ${initialCounts.globalLatencies} → ${finalCounts.globalLatencies} (+${finalCounts.globalLatencies - initialCounts.globalLatencies})`);
            console.log(`  CB Events: ${initialCounts.circuitBreakerEvents} → ${finalCounts.circuitBreakerEvents} (+${finalCounts.circuitBreakerEvents - initialCounts.circuitBreakerEvents})`);
            console.log(`  EP Latencies: ${initialCounts.endpointLatencies} → ${finalCounts.endpointLatencies} (+${finalCounts.endpointLatencies - initialCounts.endpointLatencies})`);
        }
        
        console.log('\nMemory Trend (5 minutes):');
        for (const snapshot of this.memorySnapshots) {
            const bar = '█'.repeat(Math.round(snapshot.heapMB / 2));
            console.log(`  ${snapshot.label.padEnd(7)} ${bar} ${snapshot.heapMB.toFixed(2)}MB`);
        }
        
        // Identify likely causes
        console.log('\n🔍 Likely Memory Leak Sources:');
        const suspects = [];
        
        if (finalCounts.globalLatencies - initialCounts.globalLatencies > 100) {
            suspects.push('Global latencies array growing unbounded');
        }
        if (finalCounts.circuitBreakerEvents - initialCounts.circuitBreakerEvents > 50) {
            suspects.push('Circuit breaker events accumulating');
        }
        if (finalCounts.poolQueueSize > 100) {
            suspects.push('Request queue not draining properly');
        }
        if (contextGrowth > 5) {
            suspects.push('V8 contexts not being released');
        }
        if (externalGrowth > 10) {
            suspects.push('External memory (buffers) not freed');
        }
        
        if (suspects.length > 0) {
            suspects.forEach(s => console.log(`  ⚠️  ${s}`));
        } else {
            console.log('  ℹ️  No obvious accumulation patterns detected');
        }
        
        // Generate detailed report
        this.generateReport(heapGrowthPerHour, successRate, suspects);
        
        return heapGrowthPerHour < 10;
    }

    generateReport(growthRate, successRate, suspects) {
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: '5 minutes',
            totalRequests: this.stats.total,
            successRate: successRate.toFixed(2) + '%',
            memoryGrowthPerHour: growthRate.toFixed(2) + '%',
            heapDumps: this.heapDumpCount,
            memorySnapshots: this.memorySnapshots,
            objectCounts: Array.from(this.objectCounts.entries()).map(([k, v]) => ({...v, label: k})),
            suspectedLeaks: suspects,
            recommendations: []
        };
        
        // Add recommendations based on findings
        if (growthRate > 100) {
            report.recommendations.push('CRITICAL: Memory growth exceeds 100%/hour');
        }
        
        const finalCounts = this.objectCounts.get('Final');
        const initialCounts = this.objectCounts.get('Initial');
        
        if (finalCounts.globalLatencies > 1000) {
            report.recommendations.push('Implement globalLatencies array cleanup or use ring buffer');
        }
        if (finalCounts.circuitBreakerEvents > 100) {
            report.recommendations.push('Add circuit breaker event pruning with time window');
        }
        if (finalCounts.poolQueueSize > 500) {
            report.recommendations.push('Force drain request queue on destroy()');
        }
        
        fs.writeFileSync('memory-profile-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to memory-profile-report.json');
        console.log('📸 Heap dumps saved in memory-dumps/ directory');
        console.log('\nTo analyze heap dumps:');
        console.log('  1. Open Chrome DevTools');
        console.log('  2. Go to Memory tab');
        console.log('  3. Load the .heapsnapshot files');
        console.log('  4. Compare snapshots to find growing objects');
    }
}

// Run profiler
console.log(global.gc ? '✅ Running with --expose-gc for accurate measurement\n' : '⚠️  Running without --expose-gc (less accurate)\n');

const profiler = new MemoryProfiler();
profiler.run().then(success => {
    console.log(success ? '\n✅ Memory growth < 10%/hour' : '\n❌ Memory growth exceeds target');
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});