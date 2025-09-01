#!/usr/bin/env node

/**
 * PM2 Memory Restart Test
 * Simulates memory growth to test automatic PM2 restart at 150MB limit
 */

import { spawn } from 'child_process';
import fs from 'fs';

class PM2MemoryRestartTest {
    constructor() {
        this.memoryHogs = [];
        this.testDuration = 5 * 60 * 1000; // 5 minutes max
        this.memoryTarget = 160; // MB - exceed 150MB limit
        this.checkInterval = 5000; // Check every 5 seconds
    }

    async run() {
        console.log('🧪 PM2 Memory Restart Test');
        console.log('=' .repeat(50));
        console.log('This test will gradually increase memory usage to trigger PM2 restart');
        console.log(`Target: Exceed 150MB limit (aiming for ${this.memoryTarget}MB)\n`);

        // Check if running under PM2
        if (!process.env.PM2_HOME) {
            console.log('⚠️  WARNING: Not running under PM2');
            console.log('   This test should be run as: pm2 start scripts/test-pm2-memory-restart.js');
            console.log('   Or use the main app with PM2: pm2 start ecosystem.config.js\n');
        }

        // Start memory allocation
        console.log('📈 Starting memory allocation...');
        this.startMemoryGrowth();

        // Monitor memory and PM2 status
        this.monitorMemory();

        // Keep process alive
        console.log('🔄 Test running... Memory will grow until PM2 restarts the process');
        console.log('   Press Ctrl+C to stop\n');

        // Set test timeout
        setTimeout(() => {
            console.log('⏱️  Test timeout reached (5 minutes)');
            this.cleanup();
            process.exit(0);
        }, this.testDuration);
    }

    startMemoryGrowth() {
        // Allocate memory gradually
        const allocateChunk = () => {
            try {
                // Allocate 5MB chunk
                const chunk = Buffer.alloc(5 * 1024 * 1024);
                chunk.fill('a');
                this.memoryHogs.push(chunk);

                const currentMB = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log(`   Allocated chunk #${this.memoryHogs.length} - Current heap: ${currentMB.toFixed(2)}MB`);

                // Continue allocation if below target
                if (currentMB < this.memoryTarget) {
                    setTimeout(allocateChunk, 2000); // Allocate every 2 seconds
                } else {
                    console.log(`\n✅ Target memory reached: ${currentMB.toFixed(2)}MB`);
                    console.log('⏳ Waiting for PM2 to trigger restart...\n');
                }
            } catch (error) {
                console.error(`❌ Allocation error: ${error.message}`);
            }
        };

        // Start allocation after 2 seconds
        setTimeout(allocateChunk, 2000);
    }

    monitorMemory() {
        const monitor = setInterval(() => {
            const mem = process.memoryUsage();
            const stats = {
                heapMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
                rssMB: (mem.rss / 1024 / 1024).toFixed(2),
                externalMB: (mem.external / 1024 / 1024).toFixed(2),
                pid: process.pid,
                uptime: process.uptime().toFixed(0),
                pm2Instance: process.env.PM2_INSTANCE_ID || 'N/A'
            };

            console.log(`📊 Memory Status: Heap=${stats.heapMB}MB, RSS=${stats.rssMB}MB, PID=${stats.pid}, Uptime=${stats.uptime}s`);

            // Check if we're approaching limit
            if (parseFloat(stats.rssMB) > 140) {
                console.log('⚠️  Approaching PM2 memory limit (150MB)...');
            }

            // Log to file for analysis
            this.logStats(stats);

        }, this.checkInterval);

        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            console.log('\n🛑 SIGTERM received - PM2 is restarting the process!');
            clearInterval(monitor);
            this.cleanup();
            process.exit(0);
        });

        process.on('SIGINT', () => {
            console.log('\n🛑 SIGINT received - User interrupted');
            clearInterval(monitor);
            this.cleanup();
            process.exit(0);
        });
    }

    logStats(stats) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ...stats
        };

        // Append to log file
        fs.appendFileSync('pm2-memory-test.log', JSON.stringify(logEntry) + '\n');
    }

    cleanup() {
        console.log('🧹 Cleaning up memory...');
        this.memoryHogs = [];
        if (global.gc) {
            global.gc();
        }
    }
}

// Check PM2 environment
function checkPM2Environment() {
    console.log('🔍 PM2 Environment Check:');
    console.log(`   PM2_HOME: ${process.env.PM2_HOME || 'Not set'}`);
    console.log(`   PM2_INSTANCE_ID: ${process.env.PM2_INSTANCE_ID || 'Not set'}`);
    console.log(`   PM2_PROCESS_NAME: ${process.env.pm_exec_path || 'Not set'}`);
    console.log(`   Node Args: ${process.execArgv.join(' ') || 'None'}`);
    console.log('');
}

// Main execution
async function main() {
    checkPM2Environment();
    
    const test = new PM2MemoryRestartTest();
    await test.run();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { PM2MemoryRestartTest };