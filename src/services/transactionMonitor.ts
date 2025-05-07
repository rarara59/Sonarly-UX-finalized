// src/services/transactionMonitor.ts
import { EventEmitter } from 'events';
import { ITransaction } from '../types/database';
import dataHandler from './dataHandler';
import alertService from './alertService';
import { TokenPreFilterService } from './token-pre-filter.service';

interface MonitoringThresholds {
    volume: {
        high: number;
        medium: number;
    };
    frequency: {
        timeWindowMs: number;
        maxTransactions: number;
    };
    priceImpact: {
        significant: number;
        major: number;
    };
}

class TransactionMonitor extends EventEmitter {
    private thresholds: MonitoringThresholds;
    private recentTransactions: Map<string, ITransaction[]>; // walletAddress -> transactions

    constructor() {
        super();
        this.thresholds = {
            volume: {
                high: 10000,    // USDC/USD value
                medium: 5000
            },
            frequency: {
                timeWindowMs: 5 * 60 * 1000, // 5 minutes
                maxTransactions: 3
            },
            priceImpact: {
                significant: 0.05, // 5%
                major: 0.10      // 10%
            }
        };
        this.recentTransactions = new Map();

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.on('transaction', this.processTransaction.bind(this));
        this.on('highVolume', this.handleHighVolume.bind(this));
        this.on('frequentTrading', this.handleFrequentTrading.bind(this));
        this.on('priceImpact', this.handlePriceImpact.bind(this));
    }

    public async monitorTransaction(transaction: ITransaction) {
        try {
            // Store transaction
            await this.storeTransaction(transaction);

            // Emit transaction event for processing
            this.emit('transaction', transaction);

            // Run checks
            await this.checkVolume(transaction);
            await this.checkFrequency(transaction);
            await this.checkPriceImpact(transaction);

        } catch (error) {
            console.error('Error monitoring transaction:', error);
            throw error;
        }
    }

    private async storeTransaction(transaction: ITransaction) {
        const walletAddress = transaction.walletAddress;
        if (!this.recentTransactions.has(walletAddress)) {
            this.recentTransactions.set(walletAddress, []);
        }
        this.recentTransactions.get(walletAddress)?.push(transaction);

        // Keep only recent transactions within time window
        const cutoffTime = Date.now() - this.thresholds.frequency.timeWindowMs;
        this.recentTransactions.set(
            walletAddress,
            this.recentTransactions.get(walletAddress)?.filter(tx => 
                tx.timestamp.getTime() > cutoffTime) || []
        );
    }

    private async processTransaction(transaction: ITransaction) {
        try {
            // Log transaction processing
            console.log(`Processing transaction ${transaction.hash} from wallet ${transaction.walletAddress}`);
            
            // STEP: Filter logic — only run on new tokens
            if (transaction.isNewTokenLaunch) {
                const filterResult = TokenPreFilterService.evaluateToken({
                    address: transaction.tokenAddress,
                    name: transaction.tokenName,
                    symbol: transaction.tokenSymbol,
                    lpValueUSD: transaction.lpValueUSD,
                    uniqueHolders: transaction.uniqueHolders,
                    buyTransactions: transaction.buyTxCount,
                    dex: transaction.dexName,
                    hasMintAuthority: transaction.hasMintAuthority,
                    hasFreezeAuthority: transaction.hasFreezeAuthority,
                    largestHolderPercentage: transaction.largestHolderPercent,
                    firstSeenTimestamp: transaction.tokenFirstSeenTimestamp,
                    currentTimestamp: Date.now() / 1000,
                    smartWalletsInteracted: transaction.smartWallets || []
                });
  
                if (!filterResult.passed) {
                    console.log(`Token ${transaction.tokenAddress} rejected by pre-filter:`, filterResult.rejectionReasons);
                    return; // Exit early — skip analysis for junk token
                }
            }

            // Store in database via dataHandler
            await dataHandler.saveTransaction(transaction);

        } catch (error) {
            console.error('Error processing transaction:', error);
            throw error;
        }
    }

    private async checkVolume(transaction: ITransaction) {
        if (transaction.volume >= this.thresholds.volume.high) {
            this.emit('highVolume', {
                level: 'high',
                transaction,
                volume: transaction.volume
            });
        } else if (transaction.volume >= this.thresholds.volume.medium) {
            this.emit('highVolume', {
                level: 'medium',
                transaction,
                volume: transaction.volume
            });
        }
    }

    private async checkFrequency(transaction: ITransaction) {
        const walletTxs = this.recentTransactions.get(transaction.walletAddress) || [];
        if (walletTxs.length >= this.thresholds.frequency.maxTransactions) {
            this.emit('frequentTrading', {
                wallet: transaction.walletAddress,
                transactionCount: walletTxs.length,
                timeWindow: this.thresholds.frequency.timeWindowMs / 1000 // Convert to seconds
            });
        }
    }

    private async checkPriceImpact(transaction: ITransaction) {
        // In a real implementation, you'd compare with previous price
        // For now, we'll use a placeholder calculation
        const mockPriceImpact = Math.random() * 0.15; // 0-15% for testing

        if (mockPriceImpact >= this.thresholds.priceImpact.major) {
            this.emit('priceImpact', {
                level: 'major',
                transaction,
                impact: mockPriceImpact
            });
        } else if (mockPriceImpact >= this.thresholds.priceImpact.significant) {
            this.emit('priceImpact', {
                level: 'significant',
                transaction,
                impact: mockPriceImpact
            });
        }
    }

    private async handleHighVolume(data: any) {
        await alertService.createAlert({
            type: 'VOLUME',
            severity: data.level === 'high' ? 'HIGH' : 'MEDIUM',
            message: `High volume transaction detected: ${data.volume} USDC`,
            metadata: {
                walletAddress: data.transaction.walletAddress,
                pairAddress: data.transaction.pairAddress,
                volume: data.volume,
                transactionHash: data.transaction.hash
            },
            timestamp: new Date(),
            status: 'NEW'
        });
    }

    private async handleFrequentTrading(data: any) {
        await alertService.createAlert({
            type: 'FREQUENCY',
            severity: 'MEDIUM',
            message: `Frequent trading detected: ${data.transactionCount} transactions in ${data.timeWindow}s`,
            metadata: {
                walletAddress: data.wallet,
                threshold: data.transactionCount
            },
            timestamp: new Date(),
            status: 'NEW'
        });
    }

    private async handlePriceImpact(data: any) {
        await alertService.createAlert({
            type: 'PRICE',
            severity: data.level === 'major' ? 'HIGH' : 'MEDIUM',
            message: `Price impact of ${(data.impact * 100).toFixed(2)}% detected`,
            metadata: {
                walletAddress: data.transaction.walletAddress,
                pairAddress: data.transaction.pairAddress,
                priceImpact: data.impact,
                transactionHash: data.transaction.hash
            },
            timestamp: new Date(),
            status: 'NEW'
        });
    }

    // Utility methods for external access
    public getWalletTransactions(walletAddress: string): ITransaction[] {
        return this.recentTransactions.get(walletAddress) || [];
    }

    public clearWalletHistory(walletAddress: string) {
        this.recentTransactions.delete(walletAddress);
    }

    public setThresholds(newThresholds: Partial<MonitoringThresholds>) {
        this.thresholds = {
            ...this.thresholds,
            ...newThresholds
        };
    }
}

export default new TransactionMonitor();