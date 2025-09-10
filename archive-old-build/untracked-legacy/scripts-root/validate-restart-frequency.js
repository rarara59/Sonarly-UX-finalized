#!/usr/bin/env node

/**
 * PM2 Restart Frequency Validator
 * Tests and validates that restarts occur every 4 hours as configured
 */

import { spawn } from 'child_process';
import fs from 'fs';

class RestartFrequencyValidator {
    constructor() {
        this.testDurationHours = 8;  // Test for 8 hours to see 2 restart cycles
        this.expectedRestartHours = 4;
        this.toleranceMinutes = 30;  // ±30 minutes tolerance
        this.checkIntervalMinutes = 5;
        this.restartLog = [];
        this.memoryLog = [];
    }

    async run() {
        console.log('🔄 PM2 Restart Frequency Validator');
        console.log('=' .repeat(60));
        console.log(`Testing restart frequency over ${this.testDurationHours} hours`);
        console.log(`Expected: Restart every ${this.expectedRestartHours} hours ±${this.toleranceMinutes} minutes\n`);

        // Check if PM2 is running with thorp-system
        const isRunning = await this.checkPM2Running();
        if (!isRunning) {
            console.log('⚠️  System not running. Starting with optimized configuration...');
            await this.startSystem();
        }

        // Get initial status
        const initialStatus = await this.getPM2Status();
        if (initialStatus) {
            console.log('📊 Initial Status:');
            console.log(`  Process: ${initialStatus.name}`);
            console.log(`  Status: ${initialStatus.status}`);
            console.log(`  Memory: ${initialStatus.memory}`);
            console.log(`  Restarts: ${initialStatus.restarts}`);
            console.log(`  Uptime: ${initialStatus.uptime}\n`);
            
            this.initialRestartCount = initialStatus.restarts;
        }

        // Start monitoring
        console.log('📈 Starting monitoring...');
        console.log('  Checking every 5 minutes for memory and restart status');
        console.log(`  Test duration: ${this.testDurationHours} hours\n`);

        await this.monitorRestarts();
    }

    async checkPM2Running() {
        return new Promise((resolve) => {
            const pm2 = spawn('pm2', ['status'], { stdio: 'pipe' });
            let output = '';
            
            pm2.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            pm2.on('close', (code) => {
                resolve(output.includes('thorp-system') && output.includes('online'));
            });
        });
    }

    async startSystem() {
        return new Promise((resolve) => {
            console.log('🚀 Starting system with optimized configuration...');
            const pm2 = spawn('pm2', ['start', 'ecosystem.config.js'], { stdio: 'inherit' });
            
            pm2.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ System started successfully\n');
                } else {
                    console.log('❌ Failed to start system\n');
                }
                resolve(code === 0);
            });
        });
    }

    async getPM2Status() {
        return new Promise((resolve) => {
            const pm2 = spawn('pm2', ['describe', 'thorp-system'], { stdio: 'pipe' });
            let output = '';
            
            pm2.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            pm2.on('close', (code) => {
                if (code === 0) {
                    // Parse PM2 describe output
                    const status = output.includes('online') ? 'online' : 'stopped';
                    const restarts = output.match(/restarts\s+│\s+(\d+)/);
                    const memory = output.match(/memory\s+│\s+([\d.]+\s*[MG]B)/);
                    const uptime = output.match(/uptime\s+│\s+([^\│]+)/);
                    const created = output.match(/created at\s+│\s+([^\│]+)/);
                    
                    resolve({
                        name: 'thorp-system',
                        status,
                        restarts: restarts ? parseInt(restarts[1]) : 0,
                        memory: memory ? memory[1].trim() : 'unknown',
                        uptime: uptime ? uptime[1].trim() : 'unknown',
                        created: created ? created[1].trim() : 'unknown'
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    async monitorRestarts() {
        const startTime = Date.now();
        const endTime = startTime + (this.testDurationHours * 60 * 60 * 1000);
        const checkInterval = this.checkIntervalMinutes * 60 * 1000;
        
        let lastRestartCount = this.initialRestartCount;
        let restartTimes = [];
        
        const monitor = setInterval(async () => {
            const now = Date.now();
            const elapsedHours = ((now - startTime) / (1000 * 60 * 60)).toFixed(2);
            
            // Check if test duration exceeded
            if (now >= endTime) {
                clearInterval(monitor);
                this.analyzeResults(restartTimes);
                return;
            }
            
            // Get current status
            const status = await this.getPM2Status();
            if (status) {
                // Log memory and status
                this.memoryLog.push({
                    timestamp: new Date().toISOString(),
                    elapsedHours: parseFloat(elapsedHours),
                    memory: status.memory,
                    restarts: status.restarts,
                    uptime: status.uptime
                });
                
                // Check for restart
                if (status.restarts > lastRestartCount) {
                    const restartOccurred = {
                        timestamp: new Date().toISOString(),
                        elapsedHours: parseFloat(elapsedHours),
                        restartNumber: status.restarts,
                        memory: status.memory
                    };
                    
                    restartTimes.push(restartOccurred);
                    lastRestartCount = status.restarts;
                    
                    console.log(`\n🔄 RESTART DETECTED at ${elapsedHours} hours!`);
                    console.log(`  Restart #${status.restarts}`);
                    console.log(`  Memory before restart: ${status.memory}`);
                    
                    // Calculate time since last restart
                    if (restartTimes.length > 1) {
                        const lastRestart = restartTimes[restartTimes.length - 2];
                        const timeSinceLastRestart = restartOccurred.elapsedHours - lastRestart.elapsedHours;
                        console.log(`  Time since last restart: ${timeSinceLastRestart.toFixed(2)} hours`);
                        
                        // Check if within expected range
                        const expectedMin = this.expectedRestartHours - (this.toleranceMinutes / 60);
                        const expectedMax = this.expectedRestartHours + (this.toleranceMinutes / 60);
                        
                        if (timeSinceLastRestart >= expectedMin && timeSinceLastRestart <= expectedMax) {
                            console.log(`  ✅ Within expected range (${expectedMin.toFixed(1)}-${expectedMax.toFixed(1)} hours)`);
                        } else {
                            console.log(`  ⚠️  Outside expected range (${expectedMin.toFixed(1)}-${expectedMax.toFixed(1)} hours)`);
                        }
                    }
                } else {
                    // Regular status update
                    process.stdout.write(`\r[${elapsedHours}h] Memory: ${status.memory.padEnd(8)} | Restarts: ${status.restarts} | Uptime: ${status.uptime}`);
                }
            }
        }, checkInterval);
        
        console.log('Monitoring started. Updates every 5 minutes...\n');
    }

    analyzeResults(restartTimes) {
        console.log('\n\n' + '=' .repeat(60));
        console.log('📊 RESTART FREQUENCY ANALYSIS');
        console.log('=' .repeat(60));
        
        console.log(`\nTest Duration: ${this.testDurationHours} hours`);
        console.log(`Total Restarts: ${restartTimes.length}`);
        console.log(`Expected Restarts: ${Math.floor(this.testDurationHours / this.expectedRestartHours)}`);
        
        if (restartTimes.length === 0) {
            console.log('\n❌ No restarts detected during test period');
            console.log('   This may indicate memory limit is too high');
            this.saveReport(restartTimes, false);
            return;
        }
        
        // Calculate restart intervals
        console.log('\n🔄 Restart Timeline:');
        let intervals = [];
        
        for (let i = 0; i < restartTimes.length; i++) {
            const restart = restartTimes[i];
            console.log(`  Restart ${i + 1}: ${restart.elapsedHours.toFixed(2)} hours`);
            
            if (i > 0) {
                const interval = restart.elapsedHours - restartTimes[i - 1].elapsedHours;
                intervals.push(interval);
                console.log(`    Interval: ${interval.toFixed(2)} hours`);
            }
        }
        
        // Calculate statistics
        if (intervals.length > 0) {
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const minInterval = Math.min(...intervals);
            const maxInterval = Math.max(...intervals);
            
            console.log('\n📈 Restart Interval Statistics:');
            console.log(`  Average: ${avgInterval.toFixed(2)} hours`);
            console.log(`  Minimum: ${minInterval.toFixed(2)} hours`);
            console.log(`  Maximum: ${maxInterval.toFixed(2)} hours`);
            console.log(`  Target: ${this.expectedRestartHours} hours ±${this.toleranceMinutes} minutes`);
            
            // Validate against target
            const expectedMin = this.expectedRestartHours - (this.toleranceMinutes / 60);
            const expectedMax = this.expectedRestartHours + (this.toleranceMinutes / 60);
            
            const allWithinRange = intervals.every(i => i >= expectedMin && i <= expectedMax);
            const avgWithinRange = avgInterval >= expectedMin && avgInterval <= expectedMax;
            
            console.log('\n✅ Validation Results:');
            console.log(`  All intervals within range: ${allWithinRange ? '✅ Yes' : '❌ No'}`);
            console.log(`  Average within range: ${avgWithinRange ? '✅ Yes' : '❌ No'}`);
            
            // Calculate uptime
            const totalDowntimeSeconds = restartTimes.length * 10; // 10 seconds per restart
            const totalUptimeSeconds = (this.testDurationHours * 3600) - totalDowntimeSeconds;
            const uptimePercent = (totalUptimeSeconds / (this.testDurationHours * 3600) * 100).toFixed(4);
            
            console.log('\n⏱️  Uptime Statistics:');
            console.log(`  Total downtime: ${totalDowntimeSeconds} seconds`);
            console.log(`  Uptime percentage: ${uptimePercent}%`);
            console.log(`  Target uptime: 99.93%`);
            
            const success = allWithinRange || avgWithinRange;
            
            if (success) {
                console.log('\n🎉 SUCCESS: Restart frequency meets 4-hour target!');
            } else {
                console.log('\n⚠️  WARNING: Restart frequency deviates from 4-hour target');
            }
            
            this.saveReport(restartTimes, success);
        }
    }

    saveReport(restartTimes, success) {
        const report = {
            timestamp: new Date().toISOString(),
            testDurationHours: this.testDurationHours,
            expectedRestartHours: this.expectedRestartHours,
            toleranceMinutes: this.toleranceMinutes,
            restarts: restartTimes,
            memoryLog: this.memoryLog,
            success: success,
            configuration: {
                max_memory_restart: '1448M',
                max_old_space_size: 2172,
                expected_restarts_per_day: 6
            }
        };
        
        fs.writeFileSync('restart-frequency-validation.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to restart-frequency-validation.json');
    }
}

// Main execution
async function main() {
    const validator = new RestartFrequencyValidator();
    await validator.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { RestartFrequencyValidator };