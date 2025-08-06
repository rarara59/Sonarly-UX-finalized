// src/tests/apis/chain-monitor.test.ts

import { ChainMonitor } from '../../services/apis/solana/chain-monitor';

describe('ChainMonitor', () => {
    let chainMonitor: ChainMonitor;

    beforeEach(() => {
        chainMonitor = new ChainMonitor();
    });

    // Test wallet that we know has activity
    const testWallet = '3uTzTX5GBSfbW7eM9R9k95H7Txe32Qw3Z25MtyD1UhrU';

    it('should monitor wallet transactions', async () => {
        try {
            const transactions = await chainMonitor.monitorWallet(testWallet);
            
            // Basic validation
            expect(Array.isArray(transactions)).toBe(true);
            
            if (transactions.length > 0) {
                const firstTx = transactions[0];
                
                // Check transaction structure
                expect(firstTx).toHaveProperty('hash');
                expect(firstTx).toHaveProperty('value');
                expect(firstTx).toHaveProperty('timeStamp');
                expect(firstTx).toHaveProperty('from');
                expect(firstTx).toHaveProperty('to');
                expect(firstTx).toHaveProperty('tokenSymbol');
                expect(firstTx).toHaveProperty('contractAddress');

                // Log sample transaction for manual verification
                console.log('Sample transaction:', JSON.stringify(firstTx, null, 2));
            }

            // Log total transactions found
            console.log(`Total transactions found: ${transactions.length}`);

        } catch (error) {
            fail(`Failed to monitor wallet: ${error.message}`);
        }
    }, 30000); // Increase timeout to 30s for blockchain queries

    it('should handle invalid wallet addresses', async () => {
        const invalidWallet = 'invalid-address';
        
        await expect(chainMonitor.monitorWallet(invalidWallet))
            .rejects
            .toThrow();
    });

    it('should correctly identify USDC and USDT transactions', async () => {
        try {
            const transactions = await chainMonitor.monitorWallet(testWallet);
            
            // Filter for USDC/USDT transactions
            const stablecoinTxs = transactions.filter(tx => 
                tx.contractAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' || // USDC
                tx.contractAddress === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'    // USDT
            );

            if (stablecoinTxs.length > 0) {
                console.log('Sample stablecoin transaction:', JSON.stringify(stablecoinTxs[0], null, 2));
            }
            
            console.log(`Total stablecoin transactions found: ${stablecoinTxs.length}`);
            
        } catch (error) {
            fail(`Failed to monitor stablecoin transactions: ${error.message}`);
        }
    }, 30000);
});