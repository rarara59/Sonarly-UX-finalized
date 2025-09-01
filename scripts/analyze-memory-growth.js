#!/usr/bin/env node

/**
 * Memory growth analysis script
 * Analyzes memory profile reports and identifies specific leak patterns
 */

import fs from 'fs';
import path from 'path';

class MemoryGrowthAnalyzer {
    constructor() {
        this.report = null;
        this.patterns = [];
    }

    loadReport(filename = 'memory-profile-report.json') {
        try {
            const data = fs.readFileSync(filename, 'utf8');
            this.report = JSON.parse(data);
            console.log(`✅ Loaded report from ${filename}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load report: ${error.message}`);
            return false;
        }
    }

    analyze() {
        if (!this.report) {
            console.error('No report loaded');
            return;
        }

        console.log('\n🔬 MEMORY GROWTH PATTERN ANALYSIS');
        console.log('=' .repeat(60));
        
        // Analyze object count growth
        this.analyzeObjectGrowth();
        
        // Analyze memory snapshots
        this.analyzeMemoryTrend();
        
        // Identify leak patterns
        this.identifyLeakPatterns();
        
        // Generate fix recommendations
        this.generateFixRecommendations();
    }

    analyzeObjectGrowth() {
        console.log('\n📈 Object Count Growth Analysis:');
        
        const counts = this.report.objectCounts;
        if (!counts || counts.length < 2) {
            console.log('  Insufficient data');
            return;
        }
        
        const initial = counts[0];
        const final = counts[counts.length - 1];
        
        // Calculate growth rates
        const growthRates = {
            queue: this.calculateGrowth(initial.poolQueueSize, final.poolQueueSize),
            globalLatencies: this.calculateGrowth(initial.globalLatencies, final.globalLatencies),
            cbEvents: this.calculateGrowth(initial.circuitBreakerEvents, final.circuitBreakerEvents),
            epLatencies: this.calculateGrowth(initial.endpointLatencies, final.endpointLatencies)
        };
        
        console.log(`  Request Queue: ${initial.poolQueueSize} → ${final.poolQueueSize} (${growthRates.queue})`);
        console.log(`  Global Latencies: ${initial.globalLatencies} → ${final.globalLatencies} (${growthRates.globalLatencies})`);
        console.log(`  CB Events: ${initial.circuitBreakerEvents} → ${final.circuitBreakerEvents} (${growthRates.cbEvents})`);
        console.log(`  EP Latencies: ${initial.endpointLatencies} → ${final.endpointLatencies} (${growthRates.epLatencies})`);
        
        // Track patterns
        if (final.globalLatencies > initial.globalLatencies + 100) {
            this.patterns.push({
                type: 'unbounded-array',
                location: 'globalLatencies',
                growth: final.globalLatencies - initial.globalLatencies,
                severity: 'high'
            });
        }
        
        if (final.circuitBreakerEvents > initial.circuitBreakerEvents + 50) {
            this.patterns.push({
                type: 'event-accumulation',
                location: 'circuit breaker events',
                growth: final.circuitBreakerEvents - initial.circuitBreakerEvents,
                severity: 'medium'
            });
        }
    }

    analyzeMemoryTrend() {
        console.log('\n📊 Memory Growth Trend:');
        
        const snapshots = this.report.memorySnapshots;
        if (!snapshots || snapshots.length < 2) {
            console.log('  Insufficient data');
            return;
        }
        
        // Calculate linear regression for heap growth
        const points = snapshots.map(s => ({
            x: s.minute,
            y: s.heapMB
        }));
        
        const regression = this.linearRegression(points);
        const growthPerMinute = regression.slope;
        const growthPerHour = growthPerMinute * 60;
        
        console.log(`  Linear Growth Rate: ${growthPerMinute.toFixed(3)} MB/min`);
        console.log(`  Projected Hourly: ${growthPerHour.toFixed(2)} MB/hour`);
        console.log(`  R² Correlation: ${regression.r2.toFixed(3)}`);
        
        // Check for acceleration
        const firstHalf = snapshots.slice(0, Math.floor(snapshots.length / 2));
        const secondHalf = snapshots.slice(Math.floor(snapshots.length / 2));
        
        const firstAvgGrowth = this.averageGrowthRate(firstHalf);
        const secondAvgGrowth = this.averageGrowthRate(secondHalf);
        
        if (secondAvgGrowth > firstAvgGrowth * 1.2) {
            console.log(`  ⚠️  Accelerating growth detected (${((secondAvgGrowth/firstAvgGrowth - 1) * 100).toFixed(1)}% faster)`);
            this.patterns.push({
                type: 'accelerating-growth',
                firstRate: firstAvgGrowth,
                secondRate: secondAvgGrowth,
                severity: 'high'
            });
        }
        
        // Visual trend
        console.log('\n  Memory Trend Graph:');
        for (const snapshot of snapshots) {
            const bar = '█'.repeat(Math.round(snapshot.heapMB));
            console.log(`  ${snapshot.label.padEnd(7)} ${bar} ${snapshot.heapMB.toFixed(2)}MB`);
        }
    }

    identifyLeakPatterns() {
        console.log('\n🎯 Identified Leak Patterns:');
        
        if (this.patterns.length === 0) {
            console.log('  No significant patterns detected');
            return;
        }
        
        // Sort by severity
        this.patterns.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
        
        for (const pattern of this.patterns) {
            const icon = pattern.severity === 'high' ? '🔴' : 
                        pattern.severity === 'medium' ? '🟡' : '🟢';
            console.log(`  ${icon} ${pattern.type} in ${pattern.location || 'unknown'}`);
            if (pattern.growth) {
                console.log(`      Growth: +${pattern.growth} items`);
            }
        }
    }

    generateFixRecommendations() {
        console.log('\n💡 Specific Fix Recommendations:');
        
        const fixes = [];
        
        // Check global latencies
        const finalCounts = this.report.objectCounts[this.report.objectCounts.length - 1];
        if (finalCounts.globalLatencies > 1000) {
            fixes.push({
                priority: 1,
                location: 'src/detection/transport/rpc-connection-pool.js',
                line: 'globalLatencies array',
                fix: 'Implement ring buffer with fixed size (e.g., 1000 items)',
                code: `// Replace unbounded array with ring buffer
this.globalLatencies = new RingBuffer(1000);
// Or use simple array slice to maintain last N items
if (this.globalLatencies.length > 1000) {
    this.globalLatencies = this.globalLatencies.slice(-1000);
}`
            });
        }
        
        // Check circuit breaker events
        if (finalCounts.circuitBreakerEvents > 100) {
            fixes.push({
                priority: 2,
                location: 'Circuit breaker implementation',
                line: 'events array',
                fix: 'Add time-based pruning to keep only recent events',
                code: `// Prune old events (keep last 5 minutes)
const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
this.events = this.events.filter(e => e.timestamp > fiveMinutesAgo);`
            });
        }
        
        // Check request queue
        if (finalCounts.poolQueueSize > 500) {
            fixes.push({
                priority: 3,
                location: 'Request queue management',
                line: 'requestQueue array',
                fix: 'Ensure queue is properly drained and cleared',
                code: `// Clear queue on destroy
async destroy() {
    this.requestQueue = [];
    // Cancel pending requests
    for (const req of this.requestQueue) {
        req.reject(new Error('Pool destroyed'));
    }
}`
            });
        }
        
        // Memory growth rate check
        const growthRate = parseFloat(this.report.memoryGrowthPerHour);
        if (growthRate > 100) {
            fixes.push({
                priority: 1,
                location: 'Response handling',
                line: 'executeRpcCall method',
                fix: 'Ensure response objects are not retained in closures',
                code: `// Clear response reference after use
let response = await fetch(...);
const data = await response.json();
response = null; // Clear reference
return data;`
            });
        }
        
        // Display fixes
        fixes.sort((a, b) => a.priority - b.priority);
        for (const fix of fixes) {
            console.log(`\n  Priority ${fix.priority}: ${fix.location}`);
            console.log(`    Issue: ${fix.line}`);
            console.log(`    Fix: ${fix.fix}`);
            if (fix.code) {
                console.log(`    Code:\n${fix.code.split('\n').map(l => '      ' + l).join('\n')}`);
            }
        }
        
        // Save fixes to file
        this.saveFixes(fixes);
    }

    saveFixes(fixes) {
        const fixReport = {
            timestamp: new Date().toISOString(),
            memoryGrowthRate: this.report.memoryGrowthPerHour,
            patterns: this.patterns,
            fixes: fixes,
            implementation: fixes.map(f => ({
                file: 'src/detection/transport/rpc-connection-pool.js',
                priority: f.priority,
                location: f.location,
                change: f.fix,
                code: f.code
            }))
        };
        
        fs.writeFileSync('memory-fixes.json', JSON.stringify(fixReport, null, 2));
        console.log('\n📄 Fix recommendations saved to memory-fixes.json');
    }

    // Helper methods
    calculateGrowth(initial, final) {
        if (initial === 0) return final > 0 ? '+∞' : '0%';
        const percent = ((final - initial) / initial * 100).toFixed(1);
        return final > initial ? `+${percent}%` : `${percent}%`;
    }

    linearRegression(points) {
        const n = points.length;
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
        const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R²
        const yMean = sumY / n;
        const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
        const ssResidual = points.reduce((sum, p) => {
            const predicted = slope * p.x + intercept;
            return sum + Math.pow(p.y - predicted, 2);
        }, 0);
        const r2 = 1 - (ssResidual / ssTotal);
        
        return { slope, intercept, r2 };
    }

    averageGrowthRate(snapshots) {
        if (snapshots.length < 2) return 0;
        const first = snapshots[0];
        const last = snapshots[snapshots.length - 1];
        const timeDiff = last.minute - first.minute;
        if (timeDiff === 0) return 0;
        return (last.heapMB - first.heapMB) / timeDiff;
    }
}

// Run analyzer
const analyzer = new MemoryGrowthAnalyzer();

// Check if report exists
if (fs.existsSync('memory-profile-report.json')) {
    if (analyzer.loadReport()) {
        analyzer.analyze();
    }
} else {
    console.log('⚠️  No memory profile report found.');
    console.log('   Run: node --expose-gc scripts/profile-memory-objects.js');
    console.log('   Then run this analyzer again.');
}