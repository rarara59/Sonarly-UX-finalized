// src/tests/data-handler-test.ts
import DataHandler from '../services/dataHandler';

async function testDataHandler() {
    try {
        // Test transaction
        const testTransaction = {
            hash: '0x' + Math.random().toString(16).slice(2),
            timestamp: new Date(),
            tokenAddress: '0xTestToken',
            pairAddress: '0xTestPair',
            price: 1.0,
            volume: 1000.0,
            type: 'BUY' as const,
            walletAddress: '0xTestWallet'
        };

        // Save transaction
        console.log('Saving test transaction...');
        const savedTx = await DataHandler.saveTransaction(testTransaction);
        console.log('Transaction saved:', savedTx);

        // Get wallet info
        console.log('\nFetching wallet info...');
        const walletInfo = await DataHandler.getWalletInfo(testTransaction.walletAddress);
        console.log('Wallet info:', walletInfo);

        // Get transactions for wallet
        console.log('\nFetching wallet transactions...');
        const transactions = await DataHandler.getTransactionsByWallet(testTransaction.walletAddress);
        console.log('Wallet transactions:', transactions);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Optional: Add cleanup code here if needed
        process.exit(0);
    }
}

testDataHandler();