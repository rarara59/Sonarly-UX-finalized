// src/tests/alert-system-test.ts
import alertService from '../services/alertService';
import mongoose from 'mongoose';

async function testAlertSystem() {
    try {
        console.log('Starting Alert System tests...\n');

        // Test 1: Create different types of alerts
        console.log('Test 1: Creating different types of alerts');
        const alerts = await Promise.all([
            alertService.createAlert({
                type: 'VOLUME',
                severity: 'HIGH',
                message: 'Test high volume alert',
                metadata: {
                    walletAddress: '0xTestWallet',
                    volume: 15000,
                    transactionHash: '0xtest1'
                },
                timestamp: new Date(),
                status: 'NEW'
            }),
            alertService.createAlert({
                type: 'PRICE',
                severity: 'MEDIUM',
                message: 'Test price impact alert',
                metadata: {
                    walletAddress: '0xTestWallet',
                    priceImpact: 0.05,
                    transactionHash: '0xtest2'
                },
                timestamp: new Date(),
                status: 'NEW'
            })
        ]);
        console.log('Created alerts:', alerts.length);

        // Test 2: Fetch active alerts
        console.log('\nTest 2: Fetching active alerts');
        const activeAlerts = await alertService.getActiveAlerts();
        console.log('Active alerts:', activeAlerts.length);

        // Test 3: Acknowledge an alert
        console.log('\nTest 3: Acknowledging alert');
        if (alerts[0]) {
            const acknowledged = await alertService.acknowledgeAlert(alerts[0]._id);
            console.log('Alert acknowledged:', acknowledged?.status);
        }

        // Test 4: Resolve an alert
        console.log('\nTest 4: Resolving alert');
        if (alerts[1]) {
            const resolved = await alertService.resolveAlert(alerts[1]._id);
            console.log('Alert resolved:', resolved?.status);
        }

        // Test 5: Filter alerts
        console.log('\nTest 5: Filtering alerts');
        const highSeverityAlerts = await alertService.getAlerts({ severity: 'HIGH' });
        console.log('High severity alerts:', highSeverityAlerts.length);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        console.log('\nAll tests completed. Press Ctrl+C to exit.');
    }
}

// Run the tests
testAlertSystem();