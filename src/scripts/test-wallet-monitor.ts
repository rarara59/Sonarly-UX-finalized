// src/scripts/test-wallet-monitor.ts

import { ChainMonitor } from '../services/apis/solana/chain-monitor';

interface TokenSummary {
    [key: string]: number;
}

async function testWalletMonitor() {
    console.log('Testing wallet monitoring...');
    
    // Known active Solana wallet (Jupiter Exchange)
    const testWallet = 'JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo';
    
    try {
        const monitor = new ChainMonitor();
        console.log(`Monitoring wallet: ${testWallet}`);
        
        const transactions = await monitor.monitorWallet(testWallet);
        
        console.log('\nFound', transactions.length, 'transactions');
        
        if (transactions.length > 0) {
            // Group transactions by token
            const tokenSummary = transactions.reduce<TokenSummary>((acc, tx) => {
                const token = tx.tokenSymbol || 'Unknown';
                acc[token] = (acc[token] || 0) + 1;
                return acc;
            }, {});
            
            console.log('\nTransactions by token type:');
            console.log(JSON.stringify(tokenSummary, null, 2));
            
            console.log('\nMost recent transaction:');
            console.log(JSON.stringify(transactions[0], null, 2));
        }
        
        console.log('\nWallet monitoring test completed successfully! ✅');
    } catch (error) {
        console.error('Error monitoring wallet:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
    }
}

testWalletMonitor()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });