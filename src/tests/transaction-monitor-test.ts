// src/tests/transaction-monitor-test.ts
import transactionMonitor from '../services/transactionMonitor';
import { ITransaction } from '../types/database';

async function testTransactionMonitor() {
    // Helper function to create test transactions
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
        console.log('Starting Transaction Monitor tests...\n');

        // Test 1: High Volume Detection
        console.log('Test 1: High Volume Detection');
        const highVolumeTx = createTestTransaction(15000); // Above high threshold
        await transactionMonitor.monitorTransaction(highVolumeTx);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for event processing
        console.log('High volume test completed\n');

        // Test 2: Frequent Trading Detection
        console.log('Test 2: Frequent Trading Detection');
        const wallet = '0xFrequentTrader';
        for (let i = 0; i < 4; i++) {
            const tx = createTestTransaction(1000, 'BUY', wallet);
            await transactionMonitor.monitorTransaction(tx);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('Frequent trading test completed\n');

        // Test 3: Mixed Transaction Types
        console.log('Test 3: Mixed Transaction Types');
        const mixedWallet = '0xMixedTrader';
        await transactionMonitor.monitorTransaction(
            createTestTransaction(2000, 'BUY', mixedWallet)
        );
        await transactionMonitor.monitorTransaction(
            createTestTransaction(2000, 'SELL', mixedWallet)
        );
        console.log('Mixed transaction types test completed\n');

        // Test 4: Multiple Wallets
        console.log('Test 4: Multiple Wallets Monitoring');
        const wallets = ['0xWallet1', '0xWallet2', '0xWallet3'];
        for (const wallet of wallets) {
            await transactionMonitor.monitorTransaction(
                createTestTransaction(3000, 'BUY', wallet)
            );
        }
        console.log('Multiple wallets test completed\n');

        // Test 5: Edge Cases
        console.log('Test 5: Edge Cases');
        // Test exact threshold values
        await transactionMonitor.monitorTransaction(
            createTestTransaction(10000) // Exactly high threshold
        );
        await transactionMonitor.monitorTransaction(
            createTestTransaction(5000)  // Exactly medium threshold
        );
        console.log('Edge cases test completed\n');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        console.log('All tests completed. Press Ctrl+C to exit.');
    }
}

// Run the tests
testTransactionMonitor();