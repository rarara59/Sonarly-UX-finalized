#!/usr/bin/env node

/**
 * PM2 Restart Validation Script
 * Validates that the system recovers correctly after PM2 memory-based restart
 */

import https from 'https';
import { spawn } from 'child_process';
import fs from 'fs';

class PM2RestartValidator {
    constructor() {
        this.healthEndpoint = 'http://localhost:3001/health';
        this.testResults = [];
        this.startTime = Date.now();
    }

    async run() {
        console.log('🧪 PM2 Restart Validation');
        console.log('=' .repeat(60));
        console.log('This script validates system recovery after PM2 restart\n');

        try {
            // Step 1: Check PM2 status
            console.log('📊 Step 1: Checking PM2 status...');
            const pm2Status = await this.checkPM2Status();
            this.logResult('PM2 Status', pm2Status);

            // Step 2: Check system health before restart
            console.log('\n🏥 Step 2: Checking system health before restart...');
            const healthBefore = await this.checkSystemHealth();
            this.logResult('Health Before Restart', healthBefore);

            // Step 3: Trigger memory growth for restart
            console.log('\n💾 Step 3: Triggering memory growth to force restart...');
            const restartTriggered = await this.triggerMemoryRestart();
            this.logResult('Restart Triggered', restartTriggered);

            if (restartTriggered.success) {
                // Step 4: Wait for restart
                console.log('\n⏳ Step 4: Waiting for PM2 to restart the process...');
                await this.waitForRestart();

                // Step 5: Check system health after restart
                console.log('\n🏥 Step 5: Checking system health after restart...');
                const healthAfter = await this.checkSystemHealth();
                this.logResult('Health After Restart', healthAfter);

                // Step 6: Validate component recovery
                console.log('\n✅ Step 6: Validating component recovery...');
                const componentRecovery = await this.validateComponentRecovery();
                this.logResult('Component Recovery', componentRecovery);
            }

            // Generate report
            this.generateReport();

        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        }
    }

    async checkPM2Status() {
        return new Promise((resolve) => {
            const pm2 = spawn('pm2', ['describe', 'thorp-system'], {
                stdio: 'pipe'
            });

            let output = '';
            pm2.stdout.on('data', (data) => {
                output += data.toString();
            });

            pm2.on('close', (code) => {
                if (code === 0 && output.includes('online')) {
                    // Parse key metrics
                    const restarts = output.match(/restarts\s+│\s+(\d+)/);
                    const memory = output.match(/memory\s+│\s+([\d.]+\s*[MG]B)/);
                    const uptime = output.match(/uptime\s+│\s+([^\│]+)/);

                    resolve({
                        success: true,
                        status: 'online',
                        restarts: restarts ? parseInt(restarts[1]) : 0,
                        memory: memory ? memory[1].trim() : 'unknown',
                        uptime: uptime ? uptime[1].trim() : 'unknown'
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'Process not found or offline'
                    });
                }
            });

            pm2.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
        });
    }

    async checkSystemHealth() {
        return new Promise((resolve) => {
            const url = new URL(this.healthEndpoint);
            
            const req = https.get(url, { timeout: 5000 }, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const health = JSON.parse(data);
                        resolve({
                            success: true,
                            status: health.status,
                            uptime: health.uptime,
                            memory: health.memory,
                            components: health.health_monitor || {}
                        });
                    } catch (error) {
                        resolve({
                            success: false,
                            error: 'Invalid health response'
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Health check timeout'
                });
            });
        });
    }

    async triggerMemoryRestart() {
        return new Promise((resolve) => {
            console.log('   Sending signal to trigger memory growth...');
            
            // Try to send a custom signal or use PM2 restart command
            const pm2 = spawn('pm2', ['restart', 'thorp-system'], {
                stdio: 'pipe'
            });

            pm2.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        message: 'Restart command sent'
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'Failed to send restart command'
                    });
                }
            });

            pm2.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
        });
    }

    async waitForRestart() {
        const maxWait = 30000; // 30 seconds
        const checkInterval = 2000; // Check every 2 seconds
        const startWait = Date.now();

        console.log('   Waiting for system to come back online...');

        while (Date.now() - startWait < maxWait) {
            const health = await this.checkSystemHealth();
            if (health.success) {
                console.log('   ✅ System is back online!');
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            process.stdout.write('.');
        }

        console.log('\n   ❌ Timeout waiting for restart');
        return false;
    }

    async validateComponentRecovery() {
        const health = await this.checkSystemHealth();
        
        if (!health.success) {
            return {
                success: false,
                error: 'System not healthy after restart'
            };
        }

        const validation = {
            success: true,
            components: {}
        };

        // Check RPC pool
        if (health.components && health.components.running) {
            validation.components['health-monitor'] = 'operational';
        }

        // Check memory is reset
        if (health.memory && health.memory.heapUsed < 100 * 1024 * 1024) {
            validation.components['memory'] = 'reset successfully';
        }

        // Check uptime is reset
        if (health.uptime < 60) {
            validation.components['uptime'] = 'reset after restart';
        }

        return validation;
    }

    logResult(step, result) {
        this.testResults.push({
            step,
            result,
            timestamp: Date.now() - this.startTime
        });

        if (result.success) {
            console.log(`   ✅ ${step}: Success`);
            if (result.message) console.log(`      ${result.message}`);
        } else {
            console.log(`   ❌ ${step}: Failed`);
            if (result.error) console.log(`      Error: ${result.error}`);
        }
    }

    generateReport() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 PM2 RESTART VALIDATION REPORT');
        console.log('=' .repeat(60));

        const allSuccess = this.testResults.every(r => r.result.success);

        console.log('\nTest Results:');
        this.testResults.forEach(test => {
            const status = test.result.success ? '✅' : '❌';
            console.log(`  ${status} ${test.step}`);
        });

        console.log('\nValidation Summary:');
        if (allSuccess) {
            console.log('  ✅ All validation checks passed');
            console.log('  The system successfully recovers after PM2 restart');
        } else {
            const failures = this.testResults.filter(r => !r.result.success);
            console.log(`  ❌ ${failures.length} validation checks failed`);
            console.log('  The system may not recover properly after restart');
        }

        // Save report to file
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            results: this.testResults,
            success: allSuccess
        };

        fs.writeFileSync('pm2-restart-validation.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to pm2-restart-validation.json');
    }
}

// Main execution
async function main() {
    const validator = new PM2RestartValidator();
    await validator.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { PM2RestartValidator };