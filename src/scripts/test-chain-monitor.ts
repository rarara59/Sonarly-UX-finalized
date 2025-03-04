// src/scripts/test-chain-monitor.ts

import { ChainMonitor } from '../services/apis/solana/chain-monitor';

async function testChainMonitor() {
    const monitor = new ChainMonitor();
    
    // Test wallet address (a known active wallet)
    const testWallet = '3uTzTX5GBSfbW7eM9R9k95H7Txe32Qw3Z25MtyD1UhrU';
    
    console.log('Starting chain monitor test...');
    
    try {
        console.log(`Monitoring wallet: ${testWallet}`);
        const transactions = await monitor.monitorWallet(testWallet);
        
        console.log('\nTotal transactions found:', transactions.length);
        
        if (transactions.length > 0) {
            console.log('\nMost recent transaction:');
            console.log(JSON.stringify(transactions[0], null, 2));
            
            // Group transactions by token
            const tokenGroups = transactions.reduce((acc, tx) => {
                const token = tx.tokenSymbol || 'Unknown';
                acc[token] = (acc[token] || 0) + 1;
                return acc;
            }, {});
            
            console.log('\nTransactions by token:');
            console.log(JSON.stringify(tokenGroups, null, 2));
        }
        
    } catch (error) {
        console.error('Error during test:', error);
    }
}

// Run the test
testChainMonitor()
    .then(() => console.log('Test completed'))
    .catch(console.error);