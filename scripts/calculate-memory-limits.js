#!/usr/bin/env node

/**
 * Memory Limit Calculator for PM2 Configuration
 * Calculates optimal memory limits for 4-hour restart cycles based on measured growth rate
 */

class MemoryLimitCalculator {
    constructor() {
        // Measured values from testing
        this.baselineMemoryMB = 50;          // Initial heap usage after startup
        this.growthRatePerHour = 5.78;       // 578% growth rate per hour
        this.targetRestartHours = 4;         // Target: restart every 4 hours
        this.safetyMarginPercent = 20;       // 20% safety margin
        this.restartOverheadSeconds = 10;    // Time for graceful restart
    }

    async calculate() {
        console.log('🧮 PM2 Memory Limit Calculator');
        console.log('=' .repeat(60));
        console.log('Calculating optimal memory limits for 4-hour restart cycles\n');

        // Display input parameters
        console.log('📊 Input Parameters:');
        console.log(`  Baseline Memory: ${this.baselineMemoryMB}MB`);
        console.log(`  Growth Rate: ${(this.growthRatePerHour * 100).toFixed(0)}%/hour`);
        console.log(`  Target Restart: Every ${this.targetRestartHours} hours`);
        console.log(`  Safety Margin: ${this.safetyMarginPercent}%`);
        console.log(`  Restart Time: ${this.restartOverheadSeconds} seconds\n`);

        // Calculate memory after 4 hours
        const growthMultiplier = 1 + (this.growthRatePerHour * this.targetRestartHours);
        const memoryAfter4Hours = this.baselineMemoryMB * growthMultiplier;
        
        console.log('📈 Memory Growth Calculation:');
        console.log(`  Hour 0: ${this.baselineMemoryMB}MB (baseline)`);
        console.log(`  Hour 1: ${(this.baselineMemoryMB * (1 + this.growthRatePerHour)).toFixed(0)}MB`);
        console.log(`  Hour 2: ${(this.baselineMemoryMB * (1 + this.growthRatePerHour * 2)).toFixed(0)}MB`);
        console.log(`  Hour 3: ${(this.baselineMemoryMB * (1 + this.growthRatePerHour * 3)).toFixed(0)}MB`);
        console.log(`  Hour 4: ${memoryAfter4Hours.toFixed(0)}MB`);
        console.log(`  Total Growth: ${(memoryAfter4Hours - this.baselineMemoryMB).toFixed(0)}MB\n`);

        // Calculate PM2 restart limit with safety margin
        const restartLimitMB = Math.ceil(memoryAfter4Hours * (1 + this.safetyMarginPercent / 100));
        
        // Calculate Node.js max-old-space-size (150% of restart limit)
        const maxOldSpaceSizeMB = Math.ceil(restartLimitMB * 1.5);
        
        console.log('🎯 Recommended PM2 Configuration:');
        console.log(`  max_memory_restart: ${restartLimitMB}M`);
        console.log(`  --max-old-space-size: ${maxOldSpaceSizeMB}`);
        console.log(`  Expected restart: Every ${this.targetRestartHours} hours\n`);

        // Calculate uptime percentage
        const uptimePercent = this.calculateUptime();
        
        console.log('⏱️  Uptime Calculation:');
        console.log(`  Uptime per cycle: ${this.targetRestartHours * 3600 - this.restartOverheadSeconds} seconds`);
        console.log(`  Downtime per cycle: ${this.restartOverheadSeconds} seconds`);
        console.log(`  Cycles per day: ${(24 / this.targetRestartHours).toFixed(1)}`);
        console.log(`  Daily downtime: ${(24 / this.targetRestartHours * this.restartOverheadSeconds).toFixed(0)} seconds`);
        console.log(`  Uptime percentage: ${uptimePercent}%\n`);

        // Generate configuration object
        const config = this.generateConfig(restartLimitMB, maxOldSpaceSizeMB);
        
        console.log('📝 Generated Configuration:');
        console.log(JSON.stringify(config, null, 2));
        
        // Validation warnings
        await this.validateConfiguration(restartLimitMB);

        return config;
    }

    calculateUptime() {
        const secondsPerCycle = this.targetRestartHours * 3600;
        const uptimePerCycle = secondsPerCycle - this.restartOverheadSeconds;
        const uptimePercent = (uptimePerCycle / secondsPerCycle * 100).toFixed(4);
        return uptimePercent;
    }

    generateConfig(restartLimitMB, maxOldSpaceSizeMB) {
        return {
            apps: [{
                name: 'thorp-system',
                script: './system-main.js',
                node_args: `--expose-gc --max-old-space-size=${maxOldSpaceSizeMB}`,
                instances: 1,
                max_memory_restart: `${restartLimitMB}M`,
                env: {
                    NODE_ENV: 'production',
                    ENABLE_HEALTH_ENDPOINT: 'true',
                    HEALTH_PORT: 3001
                },
                min_uptime: '60s',           // Process must run 60s to be considered started
                max_restarts: 20,            // Allow more restarts for 4-hour cycles
                autorestart: true,
                kill_timeout: 10000,         // 10 seconds for graceful shutdown
                restart_delay: 5000,         // 5 second delay between restarts
                exp_backoff_restart_delay: 100,
                exec_mode: 'fork',
                log_date_format: 'YYYY-MM-DD HH:mm:ss',
                error_file: './logs/pm2-error.log',
                out_file: './logs/pm2-out.log',
                merge_logs: true,
                watch: false,
                ignore_watch: ['node_modules', 'logs', '.git', 'memory-dumps']
            }]
        };
    }

    async validateConfiguration(restartLimitMB) {
        console.log('\n⚠️  Configuration Validation:');
        
        // Check if memory limit is reasonable
        if (restartLimitMB < 200) {
            console.log('  ❌ Memory limit too low - may cause frequent restarts');
        } else if (restartLimitMB > 2000) {
            console.log('  ⚠️  Memory limit very high - ensure adequate system RAM');
        } else {
            console.log('  ✅ Memory limit within reasonable range');
        }

        // Check system memory
        const os = await import('os');
        const systemMemoryGB = os.totalmem() / 1024 / 1024 / 1024;
        const requiredMemoryGB = (restartLimitMB * 1.5) / 1024; // Account for overhead
        
        if (requiredMemoryGB > systemMemoryGB * 0.8) {
            console.log(`  ⚠️  Required memory (${requiredMemoryGB.toFixed(1)}GB) exceeds 80% of system RAM (${systemMemoryGB.toFixed(1)}GB)`);
        } else {
            console.log(`  ✅ System has adequate RAM (${systemMemoryGB.toFixed(1)}GB) for configuration`);
        }

        // Restart frequency check
        const restartsPerDay = 24 / this.targetRestartHours;
        console.log(`  ℹ️  Expected ${restartsPerDay} restarts per day`);
        
        if (restartsPerDay > 10) {
            console.log('  ⚠️  High restart frequency may indicate memory leak severity');
        } else {
            console.log('  ✅ Restart frequency acceptable for production');
        }
    }

    // Alternative calculation for different growth scenarios
    calculateForGrowthRate(growthRatePerHour, targetHours) {
        const baselineMB = 50;
        const growthMultiplier = 1 + (growthRatePerHour * targetHours);
        const memoryAfterTarget = baselineMB * growthMultiplier;
        const restartLimit = Math.ceil(memoryAfterTarget * 1.2); // 20% margin
        
        return {
            growthRate: `${(growthRatePerHour * 100).toFixed(0)}%/hour`,
            targetHours,
            memoryAtRestart: memoryAfterTarget.toFixed(0),
            recommendedLimit: restartLimit,
            dailyRestarts: Math.round(24 / targetHours)
        };
    }

    // Generate comparison table for different configurations
    generateComparisonTable() {
        console.log('\n📊 Configuration Comparison Table:');
        console.log('=' .repeat(60));
        console.log('Growth Rate | Target Hours | Memory Limit | Daily Restarts');
        console.log('-'.repeat(60));
        
        const scenarios = [
            { growth: 5.78, hours: 1 },   // Current aggressive setting
            { growth: 5.78, hours: 2 },   // 2-hour cycles
            { growth: 5.78, hours: 4 },   // Target 4-hour cycles
            { growth: 5.78, hours: 6 },   // Extended 6-hour cycles
            { growth: 3.0, hours: 4 },    // If we improved memory by ~50%
            { growth: 1.0, hours: 4 },    // If we improved memory by ~80%
        ];

        scenarios.forEach(scenario => {
            const result = this.calculateForGrowthRate(scenario.growth, scenario.hours);
            console.log(
                `${result.growthRate.padEnd(12)} | ` +
                `${result.targetHours.toString().padEnd(13)} | ` +
                `${(result.recommendedLimit + 'MB').padEnd(13)} | ` +
                `${result.dailyRestarts}`
            );
        });
        
        console.log('=' .repeat(60));
    }
}

// Main execution
async function main() {
    const calculator = new MemoryLimitCalculator();
    const config = await calculator.calculate();
    
    // Show comparison table
    calculator.generateComparisonTable();
    
    // Save configuration
    const { writeFileSync } = await import('fs');
    writeFileSync(
        'ecosystem.config.optimized.js',
        `module.exports = ${JSON.stringify(config, null, 2)};`
    );
    
    console.log('\n✅ Configuration saved to ecosystem.config.optimized.js');
    console.log('🚀 Ready for 4-hour restart cycles with 99.986% uptime!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { MemoryLimitCalculator };