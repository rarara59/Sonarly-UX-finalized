// src/services/apis/solana/chain-monitor.ts

import { 
    Connection, 
    PublicKey, 
    ParsedTransactionWithMeta,
    ParsedInstruction,
    ConnectionConfig
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { config } from '../../../config';

interface TransactionData {
    hash: string;
    value: string | number;
    timeStamp: number;
    from: string;
    to: string;
    tokenSymbol: string;
    contractAddress: string;
}

export class ChainMonitor {
    private connection: Connection;
    private usdcMint: PublicKey;
    private usdtMint: PublicKey;
    private scanLimit: number;

    constructor() {
        const connectionConfig: ConnectionConfig = {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        };

        this.connection = new Connection(config.solanaRpcEndpoint, connectionConfig);
        this.usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        this.usdtMint = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
        this.scanLimit = 10; // Reduced for testing
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async retryWithBackoff<T>(
        operation: () => Promise<T>,
        maxRetries: number = 5,
        baseDelay: number = 1000
    ): Promise<T> {
        let retries = 0;
        while (true) {
            try {
                return await operation();
            } catch (err) {
                const error = err as Error;
                if (retries >= maxRetries) {
                    throw error;
                }
                
                if (error.message.includes('429')) {
                    const delay = baseDelay * Math.pow(2, retries);
                    console.log(`Rate limited. Retrying after ${delay}ms...`);
                    await this.sleep(delay);
                    retries++;
                } else {
                    throw error;
                }
            }
        }
    }

    async monitorWallet(address: string): Promise<TransactionData[]> {
        try {
            const walletPubkey = new PublicKey(address);
            
            // Get USDC transactions with retry logic
            const usdcAccount = getAssociatedTokenAddressSync(this.usdcMint, walletPubkey);
            const usdcSigs = await this.retryWithBackoff(() => 
                this.connection.getSignaturesForAddress(usdcAccount, { limit: this.scanLimit })
            );
            
            // Wait between requests to avoid rate limiting
            await this.sleep(1000);
            
            // Get USDT transactions
            const usdtAccount = getAssociatedTokenAddressSync(this.usdtMint, walletPubkey);
            const usdtSigs = await this.retryWithBackoff(() => 
                this.connection.getSignaturesForAddress(usdtAccount, { limit: this.scanLimit })
            );

            // Combine signatures
            const signatures = [...usdcSigs, ...usdtSigs];
            
            // Process in smaller batches
            const batchSize = 5;
            const transactions: ParsedTransactionWithMeta[] = [];
            
            for (let i = 0; i < signatures.length; i += batchSize) {
                const batch = signatures.slice(i, i + batchSize);
                await this.sleep(1000); // Wait between batches
                
                const batchTxs = await this.retryWithBackoff(() =>
                    this.connection.getParsedTransactions(
                        batch.map(sig => sig.signature),
                        { maxSupportedTransactionVersion: 0 }
                    )
                );
                
                transactions.push(...batchTxs.filter((tx): tx is ParsedTransactionWithMeta => tx !== null));
            }

            return this.normalizeTransactions(transactions);
        } catch (err) {
            const error = err as Error;
            throw new Error(`Failed to monitor wallet: ${error?.message || 'Unknown error'}`);
        }
    }

    private normalizeTransactions(transactions: ParsedTransactionWithMeta[]): TransactionData[] {
        return transactions
            .filter(tx => tx?.meta?.err === null && tx.transaction.message?.instructions?.length)
            .flatMap(tx => {
                const instructions = tx.transaction.message.instructions
                    .filter((inst): inst is ParsedInstruction => 
                        'parsed' in inst && 'program' in inst
                    );

                return instructions
                    .filter(instruction => 
                        instruction.program === 'spl-token' &&
                        instruction.parsed?.type === 'transfer' &&
                        instruction.parsed?.info?.tokenAmount
                    )
                    .map(instruction => ({
                        hash: tx.transaction.signatures[0] || "",
                        value: instruction.parsed.info.tokenAmount?.amount || "0",
                        timeStamp: tx.blockTime || 0,
                        from: instruction.parsed.info.source || "",
                        to: instruction.parsed.info.destination || "",
                        tokenSymbol: instruction.parsed.info.tokenAmount?.symbol || "Unknown",
                        contractAddress: instruction.parsed.info.mint || "0"
                    }));
            })
            .reverse();
    }
}