// src/tests/monitor-alert-test.ts
import transactionMonitor from '../services/transactionMonitor';
import alertService from '../services/alertService';
import { ITransaction, IAlert } from '../types/database';
import { Types } from 'mongoose';

// Helper function to wait for database operations
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testMonitoringAndAlerts() {
    function createTestTransaction(
        volume: number,
        type: 'BUY' | 'SELL' = 'BUY',
        walletAddress: string = '0xTestWallet'
    ): ITransaction {
        return {
            hash: '0x' + Math.random().toString(16).slice(2),
            timestamp: new Date(),
            tokenAddress: '0xTestToken',
            pairAddress: '0xTestPair',
            price: 1.0,
            volume,
            type,
            walletAddress
        };
    }

    try {
        console.log('Starting Combined Monitoring and Alert System Test...\n');

        // Test 1: High Volume Alert
        console.log('Test 1: High Volume Alert');
        const highVolumeTx = createTestTransaction(15000);
        await transactionMonitor.monitorTransaction(highVolumeTx);
        await wait(1000); // Wait for alert to be created
        
        const volumeAlerts = await alertService.getAlerts({ 
            type: 'VOLUME' as IAlert['type']
        });
        console.log('High volume alerts created:', volumeAlerts.length);
        if (volumeAlerts.length > 0) {
            console.log('Volume Alert details:', JSON.stringify(volumeAlerts[0], null, 2));
        }

        // Test 2: Frequent Trading Alert
        console.log('\nTest 2: Frequent Trading Alert');
        const frequentWallet = '0xFrequentTrader';
        for (let i = 0; i < 4; i++) {
            await transactionMonitor.monitorTransaction(
                createTestTransaction(1000, 'BUY', frequentWallet)
            );
            await wait(100);
        }
        await wait(1000); // Wait for alerts to be created
        
        const frequencyAlerts = await alertService.getAlerts({ 
            type: 'FREQUENCY' as IAlert['type']
        });
        console.log('Frequency alerts created:', frequencyAlerts.length);
        if (frequencyAlerts.length > 0) {
            console.log('Frequency Alert details:', JSON.stringify(frequencyAlerts[0], null, 2));
        }

        // Test 3: Price Impact Alert
        console.log('\nTest 3: Price Impact Alert');
        const largeTx = createTestTransaction(20000);
        await transactionMonitor.monitorTransaction(largeTx);
        await wait(1000); // Wait for alert to be created
        
        const priceAlerts = await alertService.getAlerts({ 
            type: 'PRICE' as IAlert['type']
        });
        console.log('Price impact alerts created:', priceAlerts.length);
        if (priceAlerts.length > 0) {
            console.log('Price Alert details:', JSON.stringify(priceAlerts[0], null, 2));
        }

        // Test 4: Alert Management
        console.log('\nTest 4: Alert Management');
        if (volumeAlerts.length > 0 && volumeAlerts[0]._id) {
            const alertId = volumeAlerts[0]._id.toString();
            await alertService.acknowledgeAlert(alertId);
            await wait(500); // Wait for acknowledgment to be processed
            
            const acknowledgedAlert = await alertService.getAlerts({ 
                type: 'VOLUME' as IAlert['type'],
                status: 'ACKNOWLEDGED' as IAlert['status']
            });
            if (acknowledgedAlert.length > 0) {
                console.log('Alert successfully acknowledged:', acknowledgedAlert[0].status);
            }
        }

        // Test 5: System Summary
        await wait(1000); // Wait for all operations to complete
        const allAlerts = await alertService.getActiveAlerts();
        
        console.log('\nSystem Summary:');
        console.log('---------------');
        console.log('Total Active Alerts:', allAlerts.length);
        console.log('By Type:');
        console.log('- Volume Alerts:', volumeAlerts.length);
        console.log('- Frequency Alerts:', frequencyAlerts.length);
        console.log('- Price Alerts:', priceAlerts.length);
        console.log('\nAlert Statuses:');
        const statuses = allAlerts.reduce((acc: any, alert) => {
            acc[alert.status] = (acc[alert.status] || 0) + 1;
            return acc;
        }, {});
        Object.entries(statuses).forEach(([status, count]) => {
            console.log(`- ${status}: ${count}`);
        });

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        console.log('\nAll tests completed. Press Ctrl+C to exit.');
    }
}

// Run the tests
testMonitoringAndAlerts();