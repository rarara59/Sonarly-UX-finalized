// src/services/transactionMonitor.ts
import { EventEmitter } from 'events';
import { ITransaction } from '../types/database';
import dataHandler from './dataHandler';
import alertService from './alertService';
import { TokenPreFilterService } from './token-pre-filter.service';
import Transfer from '../models/transfer';

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
  private recentTransactions: Map<string, ITransaction[]>;

  constructor() {
    super();
    this.thresholds = {
      volume: {
        high: 10000,
        medium: 5000
      },
      frequency: {
        timeWindowMs: 5 * 60 * 1000,
        maxTransactions: 3
      },
      priceImpact: {
        significant: 0.05,
        major: 0.10
      }
    };
    this.recentTransactions = new Map();
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
      await this.storeTransaction(transaction);
      this.emit('transaction', transaction);
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
    const cutoffTime = Date.now() - this.thresholds.frequency.timeWindowMs;
    this.recentTransactions.set(
      walletAddress,
      this.recentTransactions.get(walletAddress)?.filter(tx =>
        tx.timestamp.getTime() > cutoffTime) || []
    );
  }

  private async processTransaction(transaction: ITransaction) {
    try {
      console.log(`Processing transaction ${transaction.hash} from wallet ${transaction.walletAddress}`);
      if (transaction.isNewTokenLaunch) {
        const filterResult = await TokenPreFilterService.evaluateToken({
          address: transaction.tokenAddress,
          name: transaction.tokenName ?? 'Unknown',
          symbol: transaction.tokenSymbol ?? 'UNK',
          lpValueUSD: transaction.lpValueUSD ?? 0,
          uniqueHolders: transaction.uniqueHolders ?? 0,
          buyTransactions: transaction.buyTxCount ?? 0,
          dex: transaction.dexName ?? 'Unknown',
          hasMintAuthority: transaction.hasMintAuthority ?? false,
          hasFreezeAuthority: transaction.hasFreezeAuthority ?? false,
          largestHolderPercentage: transaction.largestHolderPercent ?? 0,
          firstSeenTimestamp: transaction.tokenFirstSeenTimestamp ?? Date.now(),
          currentTimestamp: Date.now() / 1000,
          smartWalletsInteracted: transaction.smartWallets || [],
          marketCap: 0, // <--- TEMP placeholder
          volume24h: transaction.volume ?? 0 // Reusing existing volume field
        });

        if (!filterResult.passed) {
          console.log(`Token ${transaction.tokenAddress} rejected by pre-filter:`, filterResult.rejectionReasons);
          return;
        }
      }

      if (transaction.direction === 'buy' && transaction.tokenAddress && transaction.walletAddress) {
        try {
          await Transfer.create({
            tokenAddress: transaction.tokenAddress,
            walletAddress: transaction.walletAddress,
            timestamp: transaction.timestamp,
            txSignature: transaction.hash
          });
        } catch (err) {
          console.warn(`Transfer logging failed: ${(err as Error).message}`);
        }
      }

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
        timeWindow: this.thresholds.frequency.timeWindowMs / 1000
      });
    }
  }

  private async checkPriceImpact(transaction: ITransaction) {
    const mockPriceImpact = Math.random() * 0.15;
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

  public getTokenBuyersWithTimestamp(tokenAddress: string): { address: string; timestamp: number; amount: number }[] {
    const buyers: { address: string; timestamp: number; amount: number }[] = [];
    for (const [wallet, txs] of this.recentTransactions.entries()) {
      for (const tx of txs) {
        if (tx.tokenAddress === tokenAddress && tx.direction === 'buy') {
          buyers.push({
            address: wallet,
            timestamp: typeof tx.timestamp === 'number' ? tx.timestamp : tx.timestamp.getTime(),
            amount: tx.amount || 0
          });
        }
      }
    }
    return buyers;
  }
}

export default new TransactionMonitor();