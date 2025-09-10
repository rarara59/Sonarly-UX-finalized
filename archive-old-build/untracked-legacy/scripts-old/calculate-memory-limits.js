import pm2 from 'pm2';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MemoryLimitCalculator {
    constructor() {
        this.components = [
            'price-monitor',
            'transaction-monitor',
            'metadata-fetcher',
            'market-analyzer',
            'data-aggregator',
            'transaction-executor',
            'risk-manager'
        ];
        
        // Current PM2 limits
        this.currentLimits = {
            'price-monitor': '320M',
            'transaction-monitor': '320M',
            'metadata-fetcher': '256M',
            'market-analyzer': '512M',
            'data-aggregator': '384M',
            'transaction-executor': '512M',
            'risk-manager': '384M'
        };
        
        // Safety margins for different component types
        this.safetyMargins = {
            'price-monitor': 1.3,         // 30% buffer
            'transaction-monitor': 1.3,    // 30% buffer
            'metadata-fetcher': 1.25,      // 25% buffer
            'market-analyzer': 1.4,        // 40% buffer (more volatile)
            'data-aggregator': 1.35,       // 35% buffer
            'transaction-executor': 1.4,    // 40% buffer (critical)
            'risk-manager': 1.35           // 35% buffer (critical)
        };
        
        this.memoryData = {};
        this.resultsDir = path.join(__dirname, '..', 'results');
        this.configPath = path.join(__dirname, '..', 'ecosystem.config.js');
    }

    formatMemory(bytes) {
        const mb = bytes / (1024 * 1024);
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(2)}G`;
        }
        return `${Math.ceil(mb)}M`;
    }

    parseMemoryLimit(limit) {
        const match = limit.match(/^(\d+(?:\.\d+)?)([MG])$/);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2];
        
        return unit === 'G' ? value * 1024 * 1024 * 1024 : value * 1024 * 1024;
    }

    async collectMemoryData(durationMinutes = 5) {
        console.log(`\nCollecting memory usage data for ${durationMinutes} minutes...`);
        console.log('================================================');
        
        return new Promise((resolve, reject) => {
            pm2.connect((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const samples = [];
                const startTime = Date.now();
                const endTime = startTime + (durationMinutes * 60 * 1000);
                let sampleCount = 0;
                
                const interval = setInterval(() => {
                    pm2.list((err, processes) => {
                        if (err) {
                            clearInterval(interval);
                            pm2.disconnect();
                            reject(err);
                            return;
                        }
                        
                        sampleCount++;
                        const currentSample = {};
                        
                        for (const proc of processes) {
                            const component = this.components.find(c => proc.name === c);
                            if (component && proc.pm2_env && proc.pm2_env.status === 'online') {
                                const memoryUsage = proc.monit ? proc.monit.memory : 0;
                                currentSample[component] = memoryUsage;
                                
                                if (!this.memoryData[component]) {
                                    this.memoryData[component] = {
                                        samples: [],
                                        peak: 0,
                                        average: 0,
                                        p95: 0,
                                        p99: 0,
                                        restarts: proc.pm2_env.restart_time || 0
                                    };
                                }
                                
                                this.memoryData[component].samples.push(memoryUsage);
                                this.memoryData[component].peak = Math.max(
                                    this.memoryData[component].peak, 
                                    memoryUsage
                                );
                            }
                        }
                        
                        samples.push({
                            timestamp: Date.now(),
                            data: currentSample
                        });
                        
                        // Progress update
                        const elapsed = Date.now() - startTime;
                        const progress = (elapsed / (durationMinutes * 60 * 1000)) * 100;
                        process.stdout.write(`\rProgress: ${progress.toFixed(1)}% | Samples: ${sampleCount}`);
                        
                        if (Date.now() >= endTime) {
                            clearInterval(interval);
                            pm2.disconnect();
                            console.log('\n\nData collection complete!');
                            resolve(samples);
                        }
                    });
                }, 5000); // Sample every 5 seconds
            });
        });
    }

    calculateStatistics() {
        console.log('\nCalculating memory statistics...');
        console.log('================================');
        
        for (const component of this.components) {
            if (!this.memoryData[component]) continue;
            
            const samples = this.memoryData[component].samples;
            if (samples.length === 0) continue;
            
            // Sort for percentile calculations
            const sorted = [...samples].sort((a, b) => a - b);
            
            // Calculate statistics
            const sum = samples.reduce((acc, val) => acc + val, 0);
            const average = sum / samples.length;
            const p95Index = Math.floor(samples.length * 0.95);
            const p99Index = Math.floor(samples.length * 0.99);
            
            this.memoryData[component].average = average;
            this.memoryData[component].p95 = sorted[p95Index];
            this.memoryData[component].p99 = sorted[p99Index];
            this.memoryData[component].min = sorted[0];
            this.memoryData[component].max = sorted[sorted.length - 1];
            
            // Calculate standard deviation
            const variance = samples.reduce((acc, val) => 
                acc + Math.pow(val - average, 2), 0) / samples.length;
            this.memoryData[component].stdDev = Math.sqrt(variance);
            
            // Memory growth analysis
            if (samples.length > 10) {
                const firstQuarter = samples.slice(0, Math.floor(samples.length / 4));
                const lastQuarter = samples.slice(-Math.floor(samples.length / 4));
                
                const firstAvg = firstQuarter.reduce((acc, val) => acc + val, 0) / firstQuarter.length;
                const lastAvg = lastQuarter.reduce((acc, val) => acc + val, 0) / lastQuarter.length;
                
                this.memoryData[component].growthTrend = ((lastAvg - firstAvg) / firstAvg) * 100;
            }
        }
    }

    calculateOptimalLimits() {
        console.log('\nCalculating optimal memory limits...');
        console.log('=====================================');
        
        const recommendations = {};
        
        for (const component of this.components) {
            if (!this.memoryData[component]) {
                recommendations[component] = {
                    current: this.currentLimits[component],
                    recommended: this.currentLimits[component],
                    reason: 'No data collected'
                };
                continue;
            }
            
            const data = this.memoryData[component];
            const currentLimit = this.parseMemoryLimit(this.currentLimits[component]);
            const safetyMargin = this.safetyMargins[component];
            
            // Base calculation on P99 with safety margin
            let recommendedLimit = data.p99 * safetyMargin;
            
            // Adjust based on growth trend
            if (data.growthTrend && data.growthTrend > 10) {
                // Significant growth detected, add extra buffer
                recommendedLimit *= 1.1;
            }
            
            // Ensure minimum headroom
            const minHeadroom = 50 * 1024 * 1024; // 50MB minimum
            if (recommendedLimit - data.peak < minHeadroom) {
                recommendedLimit = data.peak + minHeadroom;
            }
            
            // Round up to nearest 32MB for cleaner values
            const roundTo = 32 * 1024 * 1024;
            recommendedLimit = Math.ceil(recommendedLimit / roundTo) * roundTo;
            
            // Compare with current limit
            const difference = ((recommendedLimit - currentLimit) / currentLimit) * 100;
            
            recommendations[component] = {
                current: this.currentLimits[component],
                recommended: this.formatMemory(recommendedLimit),
                currentBytes: currentLimit,
                recommendedBytes: recommendedLimit,
                difference: difference.toFixed(1),
                statistics: {
                    average: this.formatMemory(data.average),
                    p95: this.formatMemory(data.p95),
                    p99: this.formatMemory(data.p99),
                    peak: this.formatMemory(data.peak),
                    growthTrend: data.growthTrend ? `${data.growthTrend.toFixed(1)}%` : 'N/A'
                },
                reason: this.getRecommendationReason(difference, data)
            };
            
            // Display results
            console.log(`\n${component}:`);
            console.log(`  Current limit: ${this.currentLimits[component]}`);
            console.log(`  Recommended:   ${recommendations[component].recommended}`);
            console.log(`  Difference:    ${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`);
            console.log(`  Statistics:`);
            console.log(`    - Average: ${recommendations[component].statistics.average}`);
            console.log(`    - P95:     ${recommendations[component].statistics.p95}`);
            console.log(`    - P99:     ${recommendations[component].statistics.p99}`);
            console.log(`    - Peak:    ${recommendations[component].statistics.peak}`);
            console.log(`    - Growth:  ${recommendations[component].statistics.growthTrend}`);
            console.log(`  Reason: ${recommendations[component].reason}`);
        }
        
        return recommendations;
    }

    getRecommendationReason(difference, data) {
        if (Math.abs(difference) < 5) {
            return 'Current limit is optimal';
        } else if (difference > 20) {
            if (data.growthTrend > 10) {
                return 'Increase recommended due to memory growth trend';
            }
            return 'Increase recommended based on observed usage';
        } else if (difference < -20) {
            if (data.restarts > 0) {
                return 'Keep current limit despite lower usage due to restarts';
            }
            return 'Decrease possible but current limit provides good safety margin';
        } else {
            return 'Minor adjustment recommended';
        }
    }

    async generateEcosystemConfig(recommendations) {
        console.log('\n\nGenerating updated ecosystem.config.js...');
        console.log('=========================================');
        
        const config = `module.exports = {
    apps: [
        {
            name: 'price-monitor',
            script: './src/monitors/price-monitor.js',
            instances: 1,
            max_memory_restart: '${recommendations['price-monitor'].recommended}',
            env: {
                NODE_ENV: 'production',
                COMPONENT: 'price-monitor'
            }
        },
        {
            name: 'transaction-monitor',
            script: './src/monitors/transaction-monitor.js',
            instances: 1,
            max_memory_restart: '${recommendations['transaction-monitor'].recommended}',
            env: {
                NODE_ENV: 'production',
                COMPONENT: 'transaction-monitor'
            }
        },
        {
            name: 'metadata-fetcher',
            script: './src/services/metadata-fetcher.js',
            instances: 1,
            max_memory_restart: '${recommendations['metadata-fetcher'].recommended}',
            env: {
                NODE_ENV: 'production',
                COMPONENT: 'metadata-fetcher'
            }
        },
        {
            name: 'market-analyzer',
            script: './src/analyzers/market-analyzer.js',
            instances: 1,
            max_memory_restart: '${recommendations['market-analyzer'].recommended}',
            env: {
                NODE_ENV: 'production',
                COMPONENT: 'market-analyzer'
            }
        },
        {
            name: 'data-aggregator',
            script: './src/services/data-aggregator.js',
            instances: 1,
            max_memory_restart: '${recommendations['data-aggregator'].recommended}',
            env: {
                NODE_ENV: 'production',
                COMPONENT: 'data-aggregator'
            }
        },
        {
            name: 'transaction-executor',
            script: './src/services/transaction-executor.js',
            instances: 1,
            max_memory_restart: '${recommendations['transaction-executor'].recommended}',
            env: {
                NODE_ENV: 'production',
                COMPONENT: 'transaction-executor'
            }
        },
        {
            name: 'risk-manager',
            script: './src/services/risk-manager.js',
            instances: 1,
            max_memory_restart: '${recommendations['risk-manager'].recommended}',
            env: {
                NODE_ENV: 'production',
                COMPONENT: 'risk-manager'
            }
        }
    ]
};`;
        
        const backupPath = `${this.configPath}.backup-${Date.now()}`;
        
        try {
            // Create backup
            const currentConfig = await fs.readFile(this.configPath, 'utf8');
            await fs.writeFile(backupPath, currentConfig);
            console.log(`Backup created: ${backupPath}`);
            
            // Write new config
            const newConfigPath = `${this.configPath}.recommended`;
            await fs.writeFile(newConfigPath, config);
            console.log(`Recommended config written to: ${newConfigPath}`);
            console.log('\nTo apply the new configuration:');
            console.log(`  1. Review: cat ${newConfigPath}`);
            console.log(`  2. Apply: cp ${newConfigPath} ${this.configPath}`);
            console.log(`  3. Reload: pm2 reload ecosystem.config.js`);
            
        } catch (error) {
            console.error('Error generating config:', error);
        }
    }

    async saveReport(recommendations) {
        const report = {
            timestamp: new Date().toISOString(),
            currentLimits: this.currentLimits,
            recommendations: recommendations,
            rawData: this.memoryData,
            summary: {
                totalCurrentMemory: 0,
                totalRecommendedMemory: 0,
                componentsNeedingIncrease: [],
                componentsCanDecrease: [],
                optimalComponents: []
            }
        };
        
        // Calculate summary
        for (const [component, rec] of Object.entries(recommendations)) {
            report.summary.totalCurrentMemory += rec.currentBytes;
            report.summary.totalRecommendedMemory += rec.recommendedBytes;
            
            const diff = parseFloat(rec.difference);
            if (diff > 10) {
                report.summary.componentsNeedingIncrease.push({
                    component,
                    increase: `${diff.toFixed(1)}%`
                });
            } else if (diff < -10) {
                report.summary.componentsCanDecrease.push({
                    component,
                    decrease: `${Math.abs(diff).toFixed(1)}%`
                });
            } else {
                report.summary.optimalComponents.push(component);
            }
        }
        
        report.summary.totalCurrentMemory = this.formatMemory(report.summary.totalCurrentMemory);
        report.summary.totalRecommendedMemory = this.formatMemory(report.summary.totalRecommendedMemory);
        
        // Save report
        await fs.mkdir(this.resultsDir, { recursive: true });
        const reportPath = path.join(this.resultsDir, `memory-limits-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n\nDetailed report saved to: ${reportPath}`);
        
        return report;
    }
}

// Main execution
async function main() {
    const calculator = new MemoryLimitCalculator();
    
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const durationMinutes = args[0] ? parseInt(args[0]) : 5;
        
        console.log('Memory Limit Calculator');
        console.log('======================');
        console.log(`This tool will collect memory usage data and recommend optimal PM2 memory limits.`);
        console.log(`Collection duration: ${durationMinutes} minutes`);
        console.log('\nEnsure all components are running under normal load for accurate results.');
        
        // Collect memory data
        await calculator.collectMemoryData(durationMinutes);
        
        // Calculate statistics
        calculator.calculateStatistics();
        
        // Calculate optimal limits
        const recommendations = calculator.calculateOptimalLimits();
        
        // Generate new ecosystem config
        await calculator.generateEcosystemConfig(recommendations);
        
        // Save detailed report
        await calculator.saveReport(recommendations);
        
        console.log('\n\nCalculation complete!');
        
    } catch (error) {
        console.error('\nError:', error);
        process.exit(1);
    }
}

// Run if executed directly  
main();

export default MemoryLimitCalculator;