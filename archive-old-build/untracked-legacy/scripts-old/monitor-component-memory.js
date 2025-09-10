import pm2 from 'pm2';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComponentMemoryMonitor {
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
        
        this.memoryLimits = {
            'price-monitor': '320M',
            'transaction-monitor': '320M',
            'metadata-fetcher': '256M',
            'market-analyzer': '512M',
            'data-aggregator': '384M',
            'transaction-executor': '512M',
            'risk-manager': '384M'
        };
        
        this.alertThreshold = 0.8; // Alert at 80% of limit
        this.memoryHistory = {};
        this.alerts = [];
        this.trendWindow = 60; // 60 samples for trend analysis
        this.monitoringInterval = null;
        this.resultsDir = path.join(__dirname, '..', 'results');
    }

    parseMemoryLimit(limit) {
        const match = limit.match(/^(\d+)([MG])$/);
        if (!match) return 0;
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        return unit === 'G' ? value * 1024 * 1024 * 1024 : value * 1024 * 1024;
    }

    formatMemory(bytes) {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)}MB`;
    }

    analyzeMemoryTrend(component, history) {
        if (history.length < 5) return null;
        
        // Calculate moving average and trend
        const recent = history.slice(-10);
        const older = history.slice(-20, -10);
        
        if (older.length === 0) return null;
        
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        
        const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        // Calculate standard deviation for volatility
        const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
        const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
        const stdDev = Math.sqrt(variance);
        const volatility = (stdDev / mean) * 100;
        
        // Predict time to limit based on growth rate
        const currentMemory = history[history.length - 1];
        const limit = this.parseMemoryLimit(this.memoryLimits[component]);
        const remainingMemory = limit - currentMemory;
        
        let timeToLimit = null;
        if (growthRate > 0 && remainingMemory > 0) {
            const avgGrowthPerSample = (recentAvg - olderAvg) / 10;
            if (avgGrowthPerSample > 0) {
                timeToLimit = Math.ceil(remainingMemory / avgGrowthPerSample);
            }
        }
        
        return {
            growthRate: growthRate.toFixed(2),
            volatility: volatility.toFixed(2),
            currentUsage: this.formatMemory(currentMemory),
            averageUsage: this.formatMemory(mean),
            peakUsage: this.formatMemory(Math.max(...history)),
            timeToLimit: timeToLimit ? `${timeToLimit * 5} seconds` : 'N/A'
        };
    }

    checkAlerts(component, memoryUsage, limit) {
        const usagePercent = (memoryUsage / limit) * 100;
        const alertThresholdPercent = this.alertThreshold * 100;
        
        if (usagePercent >= alertThresholdPercent) {
            const alert = {
                timestamp: new Date().toISOString(),
                component,
                level: usagePercent >= 90 ? 'CRITICAL' : 'WARNING',
                message: `Memory usage at ${usagePercent.toFixed(1)}% of limit`,
                usage: this.formatMemory(memoryUsage),
                limit: this.memoryLimits[component],
                percentage: usagePercent.toFixed(1)
            };
            
            this.alerts.push(alert);
            console.log(`\n🚨 ALERT [${alert.level}]: ${component} - ${alert.message}`);
            console.log(`   Usage: ${alert.usage} / ${alert.limit}`);
            
            // Check for memory leak patterns
            const history = this.memoryHistory[component];
            if (history && history.length >= 20) {
                const trend = this.analyzeMemoryTrend(component, history);
                if (trend && parseFloat(trend.growthRate) > 5) {
                    console.log(`   ⚠️  Potential memory leak detected - Growth rate: ${trend.growthRate}%`);
                    console.log(`   Time to limit: ${trend.timeToLimit}`);
                }
            }
            
            return alert;
        }
        
        return null;
    }

    async getComponentMemory() {
        return new Promise((resolve, reject) => {
            pm2.list((err, processes) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const memoryData = {};
                
                for (const proc of processes) {
                    const component = this.components.find(c => proc.name === c);
                    if (component && proc.pm2_env && proc.pm2_env.status === 'online') {
                        const memoryUsage = proc.monit ? proc.monit.memory : 0;
                        const limit = this.parseMemoryLimit(this.memoryLimits[component]);
                        
                        memoryData[component] = {
                            usage: memoryUsage,
                            limit: limit,
                            percentage: (memoryUsage / limit) * 100,
                            status: proc.pm2_env.status,
                            cpu: proc.monit ? proc.monit.cpu : 0,
                            restarts: proc.pm2_env.restart_time || 0,
                            uptime: proc.pm2_env.pm_uptime || 0
                        };
                        
                        // Track history
                        if (!this.memoryHistory[component]) {
                            this.memoryHistory[component] = [];
                        }
                        this.memoryHistory[component].push(memoryUsage);
                        
                        // Keep only recent history
                        if (this.memoryHistory[component].length > this.trendWindow) {
                            this.memoryHistory[component].shift();
                        }
                        
                        // Check for alerts
                        this.checkAlerts(component, memoryUsage, limit);
                    }
                }
                
                resolve(memoryData);
            });
        });
    }

    async startMonitoring(intervalMs = 5000) {
        console.log('Starting Component Memory Monitor...');
        console.log('================================');
        console.log(`Monitoring interval: ${intervalMs}ms`);
        console.log(`Alert threshold: ${this.alertThreshold * 100}%`);
        console.log(`Components: ${this.components.join(', ')}`);
        console.log('================================\n');
        
        // Ensure results directory exists
        await fs.mkdir(this.resultsDir, { recursive: true });
        
        return new Promise((resolve) => {
            pm2.connect((err) => {
                if (err) {
                    console.error('Failed to connect to PM2:', err);
                    process.exit(1);
                }
                
                let sampleCount = 0;
                const startTime = Date.now();
                
                this.monitoringInterval = setInterval(async () => {
                    try {
                        sampleCount++;
                        const memoryData = await this.getComponentMemory();
                        const runtime = Math.floor((Date.now() - startTime) / 1000);
                        
                        // Display current status
                        console.log(`\n[${new Date().toISOString()}] Sample #${sampleCount} (Runtime: ${runtime}s)`);
                        console.log('Component Memory Status:');
                        console.log('------------------------');
                        
                        for (const [component, data] of Object.entries(memoryData)) {
                            const statusIcon = data.percentage >= 80 ? '🔴' : 
                                              data.percentage >= 60 ? '🟡' : '🟢';
                            
                            console.log(`${statusIcon} ${component.padEnd(20)} | ` +
                                      `${this.formatMemory(data.usage).padStart(10)} / ${this.memoryLimits[component].padStart(5)} | ` +
                                      `${data.percentage.toFixed(1)}% | ` +
                                      `CPU: ${data.cpu}% | ` +
                                      `Restarts: ${data.restarts}`);
                            
                            // Show trend analysis every 10 samples
                            if (sampleCount % 10 === 0 && this.memoryHistory[component]) {
                                const trend = this.analyzeMemoryTrend(component, this.memoryHistory[component]);
                                if (trend) {
                                    console.log(`   └─ Trend: Growth ${trend.growthRate}% | Volatility ${trend.volatility}% | Peak ${trend.peakUsage}`);
                                }
                            }
                        }
                        
                        // Save monitoring data periodically
                        if (sampleCount % 20 === 0) {
                            await this.saveMonitoringReport(memoryData, runtime);
                        }
                        
                    } catch (error) {
                        console.error('Monitoring error:', error);
                    }
                }, intervalMs);
                
                resolve();
            });
        });
    }

    async saveMonitoringReport(currentData, runtime) {
        const report = {
            timestamp: new Date().toISOString(),
            runtime: runtime,
            currentMemory: currentData,
            memoryTrends: {},
            alerts: this.alerts.slice(-50), // Last 50 alerts
            summary: {
                totalAlerts: this.alerts.length,
                criticalAlerts: this.alerts.filter(a => a.level === 'CRITICAL').length,
                warningAlerts: this.alerts.filter(a => a.level === 'WARNING').length,
                componentsNearLimit: []
            }
        };
        
        // Add trend analysis
        for (const component of this.components) {
            if (this.memoryHistory[component] && this.memoryHistory[component].length >= 5) {
                report.memoryTrends[component] = this.analyzeMemoryTrend(
                    component, 
                    this.memoryHistory[component]
                );
                
                // Check if component is near limit
                if (currentData[component] && currentData[component].percentage >= 70) {
                    report.summary.componentsNearLimit.push({
                        component,
                        percentage: currentData[component].percentage.toFixed(1),
                        usage: this.formatMemory(currentData[component].usage)
                    });
                }
            }
        }
        
        // Calculate system-wide statistics
        const allUsages = Object.values(currentData).map(d => d.usage);
        const allLimits = Object.values(currentData).map(d => d.limit);
        const totalUsage = allUsages.reduce((sum, val) => sum + val, 0);
        const totalLimit = allLimits.reduce((sum, val) => sum + val, 0);
        
        report.summary.systemMemory = {
            totalUsage: this.formatMemory(totalUsage),
            totalLimit: this.formatMemory(totalLimit),
            percentage: ((totalUsage / totalLimit) * 100).toFixed(1)
        };
        
        const reportPath = path.join(this.resultsDir, `memory-monitor-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📊 Monitoring report saved to: ${reportPath}`);
        
        return report;
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            pm2.disconnect();
            console.log('\nMonitoring stopped');
        }
    }
}

// Main execution
async function main() {
    const monitor = new ComponentMemoryMonitor();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, stopping monitor...');
        monitor.stopMonitoring();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, stopping monitor...');
        monitor.stopMonitoring();
        process.exit(0);
    });
    
    try {
        // Start monitoring with 5-second intervals
        await monitor.startMonitoring(5000);
        
        // Keep the process running
        process.stdin.resume();
        
    } catch (error) {
        console.error('Failed to start monitoring:', error);
        process.exit(1);
    }
}

// Run if executed directly
main();

export default ComponentMemoryMonitor;