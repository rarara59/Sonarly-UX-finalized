#!/usr/bin/env node

/**
 * Memory Growth Monitor for PM2
 * Tracks memory growth patterns to validate 4-hour restart cycles
 */

import { spawn } from 'child_process';
import fs from 'fs';

class MemoryGrowthMonitor {
    constructor() {
        this.monitoringDuration = 4 * 60 * 60 * 1000; // 4 hours
        this.sampleInterval = 60 * 1000; // Sample every minute
        this.samples = [];
        this.startMemory = null;
        this.peakMemory = 0;
    }

    async run() {
        console.log('📊 Memory Growth Monitor');
        console.log('=' .repeat(60));
        console.log('Monitoring memory growth to validate 4-hour restart prediction\n');

        // Check if system is running
        const status = await this.getSystemStatus();
        if (!status || status.status !== 'online') {
            console.log('❌ System not running. Please start with:');
            console.log('   pm2 start ecosystem.config.js');
            return;
        }

        console.log('📈 Initial Status:');
        console.log(`  Process: ${status.name}`);
        console.log(`  Memory: ${status.memory}`);
        console.log(`  Uptime: ${status.uptime}`);
        console.log(`  Restarts: ${status.restarts}\n`);

        // Parse initial memory
        this.startMemory = this.parseMemoryMB(status.memory);
        
        console.log('🔄 Starting 4-hour monitoring cycle...');
        console.log('  Sampling every minute');
        console.log('  Expected memory at 4 hours: ~1200MB');
        console.log('  Restart threshold: 1448MB\n');

        await this.startMonitoring();
    }

    async getSystemStatus() {
        return new Promise((resolve) => {
            const pm2 = spawn('pm2', ['describe', 'thorp-system'], { stdio: 'pipe' });
            let output = '';
            
            pm2.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            pm2.on('close', (code) => {
                if (code === 0 && output.includes('online')) {
                    const status = output.includes('online') ? 'online' : 'stopped';
                    const memory = output.match(/memory\s+│\s+([\d.]+\s*[MG]B)/);
                    const uptime = output.match(/uptime\s+│\s+([^\│]+)/);
                    const restarts = output.match(/restarts\s+│\s+(\d+)/);
                    
                    resolve({
                        name: 'thorp-system',
                        status,
                        memory: memory ? memory[1].trim() : 'unknown',
                        uptime: uptime ? uptime[1].trim() : 'unknown',
                        restarts: restarts ? parseInt(restarts[1]) : 0
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    parseMemoryMB(memoryStr) {
        const match = memoryStr.match(/([\d.]+)\s*([MG])B/);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2];
            return unit === 'G' ? value * 1024 : value;
        }
        return 0;
    }

    async startMonitoring() {
        const startTime = Date.now();
        const endTime = startTime + this.monitoringDuration;
        let lastRestartCount = 0;
        let restartOccurred = false;

        const monitor = setInterval(async () => {
            const now = Date.now();
            const elapsedMinutes = Math.floor((now - startTime) / 60000);
            const elapsedHours = (elapsedMinutes / 60).toFixed(2);

            // Check if monitoring complete or restart occurred
            if (now >= endTime || restartOccurred) {
                clearInterval(monitor);
                this.analyzeGrowth();
                return;
            }

            // Get current status
            const status = await this.getSystemStatus();
            if (status) {
                const currentMemoryMB = this.parseMemoryMB(status.memory);
                
                // Track peak memory
                if (currentMemoryMB > this.peakMemory) {
                    this.peakMemory = currentMemoryMB;
                }

                // Record sample
                const sample = {
                    timestamp: new Date().toISOString(),
                    elapsedMinutes,
                    elapsedHours: parseFloat(elapsedHours),
                    memoryMB: currentMemoryMB,
                    growthMB: currentMemoryMB - this.startMemory,
                    growthPercent: ((currentMemoryMB - this.startMemory) / this.startMemory * 100).toFixed(2)
                };
                
                this.samples.push(sample);

                // Check for restart
                if (status.restarts > lastRestartCount) {
                    console.log(`\n🔄 RESTART DETECTED at ${elapsedHours} hours!`);
                    console.log(`  Memory before restart: ${currentMemoryMB.toFixed(0)}MB`);
                    console.log(`  Expected restart at: 1448MB`);
                    restartOccurred = true;
                    lastRestartCount = status.restarts;
                }

                // Display progress
                const progressBar = this.createProgressBar(elapsedMinutes, 240); // 240 minutes = 4 hours
                const growthRate = this.calculateGrowthRate();
                
                console.log(`\r[${elapsedHours}h] ${progressBar} Memory: ${currentMemoryMB.toFixed(0)}MB (+${sample.growthMB.toFixed(0)}MB) | Growth: ${growthRate}%/hr | Peak: ${this.peakMemory.toFixed(0)}MB`);

                // Predict restart time
                if (elapsedMinutes % 10 === 0 && elapsedMinutes > 0) {
                    this.predictRestart(currentMemoryMB, elapsedHours);
                }
            }
        }, this.sampleInterval);
    }

    createProgressBar(current, total) {
        const width = 20;
        const filled = Math.round((current / total) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    calculateGrowthRate() {
        if (this.samples.length < 2) return 0;
        
        const recentSamples = this.samples.slice(-5); // Last 5 minutes
        const firstSample = recentSamples[0];
        const lastSample = recentSamples[recentSamples.length - 1];
        
        const memoryGrowth = lastSample.memoryMB - firstSample.memoryMB;
        const timeHours = (lastSample.elapsedMinutes - firstSample.elapsedMinutes) / 60;
        
        if (timeHours === 0) return 0;
        
        const growthPerHour = (memoryGrowth / firstSample.memoryMB) * 100 / timeHours;
        return growthPerHour.toFixed(0);
    }

    predictRestart(currentMemoryMB, elapsedHours) {
        const restartThreshold = 1448; // MB
        const remainingMB = restartThreshold - currentMemoryMB;
        
        if (remainingMB <= 0) {
            console.log('\n⚠️  Memory exceeds restart threshold!');
            return;
        }

        // Calculate growth rate from samples
        if (this.samples.length > 5) {
            const growthPerMinute = (currentMemoryMB - this.startMemory) / this.samples.length;
            const minutesToRestart = remainingMB / growthPerMinute;
            const hoursToRestart = (minutesToRestart / 60).toFixed(1);
            
            console.log(`\n📍 Restart Prediction: ${hoursToRestart} hours remaining (at ${(parseFloat(elapsedHours) + parseFloat(hoursToRestart)).toFixed(1)} hours total)`);
        }
    }

    analyzeGrowth() {
        console.log('\n\n' + '=' .repeat(60));
        console.log('📊 MEMORY GROWTH ANALYSIS');
        console.log('=' .repeat(60));

        if (this.samples.length === 0) {
            console.log('❌ No data collected');
            return;
        }

        const lastSample = this.samples[this.samples.length - 1];
        
        console.log('\n📈 Growth Summary:');
        console.log(`  Duration: ${lastSample.elapsedHours.toFixed(2)} hours`);
        console.log(`  Starting Memory: ${this.startMemory.toFixed(0)}MB`);
        console.log(`  Final Memory: ${lastSample.memoryMB.toFixed(0)}MB`);
        console.log(`  Peak Memory: ${this.peakMemory.toFixed(0)}MB`);
        console.log(`  Total Growth: ${lastSample.growthMB.toFixed(0)}MB (${lastSample.growthPercent}%)`);
        
        // Calculate average growth rate
        const avgGrowthPerHour = lastSample.growthPercent / lastSample.elapsedHours;
        console.log(`  Average Growth Rate: ${avgGrowthPerHour.toFixed(0)}%/hour`);

        // Project to 4 hours
        const projectedMemoryAt4Hours = this.startMemory * (1 + (avgGrowthPerHour * 4) / 100);
        console.log(`  Projected at 4 hours: ${projectedMemoryAt4Hours.toFixed(0)}MB`);

        // Validate configuration
        console.log('\n✅ Configuration Validation:');
        const restartThreshold = 1448;
        console.log(`  Restart Threshold: ${restartThreshold}MB`);
        
        if (projectedMemoryAt4Hours < restartThreshold) {
            const margin = ((restartThreshold - projectedMemoryAt4Hours) / restartThreshold * 100).toFixed(1);
            console.log(`  ✅ Projected memory (${projectedMemoryAt4Hours.toFixed(0)}MB) below threshold`);
            console.log(`  Safety margin: ${margin}%`);
            
            // Calculate actual restart time
            const hoursToRestart = 4 * (restartThreshold / projectedMemoryAt4Hours);
            console.log(`  Expected restart at: ${hoursToRestart.toFixed(1)} hours`);
        } else {
            console.log(`  ⚠️  Projected memory (${projectedMemoryAt4Hours.toFixed(0)}MB) exceeds threshold`);
            console.log(`  Restart will occur earlier than 4 hours`);
        }

        // Generate growth chart
        this.displayGrowthChart();

        // Save detailed report
        this.saveReport();
    }

    displayGrowthChart() {
        console.log('\n📉 Memory Growth Chart:');
        console.log('   1500MB ┤');
        console.log('   1400MB ┤' + '-'.repeat(48) + ' Restart');
        console.log('   1200MB ┤');
        console.log('   1000MB ┤');
        console.log('    800MB ┤');
        console.log('    600MB ┤');
        console.log('    400MB ┤');
        console.log('    200MB ┤');
        console.log('      0MB └' + '─'.repeat(48));
        console.log('           0h        1h        2h        3h        4h');
    }

    saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            configuration: {
                max_memory_restart: '1448M',
                max_old_space_size: 2172,
                monitoring_duration_hours: 4
            },
            summary: {
                startMemoryMB: this.startMemory,
                peakMemoryMB: this.peakMemory,
                samples: this.samples.length,
                averageGrowthPerHour: this.samples.length > 0 ? 
                    (this.samples[this.samples.length - 1].growthPercent / 
                     this.samples[this.samples.length - 1].elapsedHours).toFixed(2) + '%' : '0%'
            },
            samples: this.samples
        };

        fs.writeFileSync('memory-growth-monitoring.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to memory-growth-monitoring.json');
    }
}

// Main execution
async function main() {
    const monitor = new MemoryGrowthMonitor();
    await monitor.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { MemoryGrowthMonitor };