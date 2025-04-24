// src/services/wallet-monitor.service.ts
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import ExternalWallet from '../models/externalWallet';
import TokenMetadata from '../models/tokenMetadata';
import AlertService from './alert.service';

// Load environment variables
config();

// Metrics collector for observability
class MetricsCollector {
  private metrics: Record<string, number> = {
    walletsProcessed: 0,
    transactionsProcessed: 0,
    tokenBuysDetected: 0,
    tokenSellsDetected: 0,
    alertsGenerated: 0,
    errorCount: 0,
    cycleCount: 0,
    averageCycleTimeMs: 0,
  };

  increment(metric: string, value: number = 1): void {
    if (this.metrics[metric] !== undefined) {
      this.metrics[metric] += value;
    }
  }

  recordCycleTime(timeMs: number): void {
    this.increment('cycleCount');
    const count = this.metrics.cycleCount;
    this.metrics.averageCycleTimeMs =
      ((this.metrics.averageCycleTimeMs * (count - 1)) + timeMs) / count;
  }

  getMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  reset(): void {
    Object.keys(this.metrics).forEach(key => (this.metrics[key] = 0));
  }
}

interface WalletMonitorConfig {
  checkIntervalMs: number;
  alertThreshold: number;
  batchSize: number;
  reconnectDelayMs: number;
  dexProgramIds: string[];
  stablecoins: string[];
}

export class WalletMonitorService {
  private connection: Connection;
  private topWallets: string[] = [];
  private isMonitoring = false;
  private alertService: AlertService;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckedSignatures = new Map<string, string>();
  private metrics = new MetricsCollector();
  private config: WalletMonitorConfig;

  constructor() {
    this.config = {
      checkIntervalMs: parseInt(process.env.WALLET_CHECK_INTERVAL_MS || '60000', 10),
      alertThreshold: parseInt(process.env.WALLET_ALERT_THRESHOLD || '30', 10),
      batchSize: parseInt(process.env.WALLET_BATCH_SIZE || '10', 10),
      reconnectDelayMs: parseInt(process.env.DB_RECONNECT_DELAY_MS || '5000', 10),
      dexProgramIds: [
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        'JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo',
        'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph',
        'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
        '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
        'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
      ],
      stablecoins: ['SOL', 'USDC', 'USDT'],
    };

    this.connection = new Connection(
      process.env.HELIUS_API_KEY
        ? `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`
        : process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com'
    );

    this.alertService = new AlertService();

    process.on('uncaughtException', this.handleGlobalError.bind(this));
    process.on('unhandledRejection', this.handleGlobalError.bind(this));

    this.setupGracefulShutdown();
  }

  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Wallet monitoring already running');
      return;
    }
    console.log('Starting wallet monitoring service...');
    await this.connectToDatabase();
    await this.loadTopWallets();
    this.isMonitoring = true;
    this.scheduleNextCheck();
    console.log(`Monitoring ${this.topWallets.length} wallets for activity`);
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('Wallet monitoring stopped');
    if (mongoose.connection.readyState === 1) {
      mongoose
        .disconnect()
        .then(() => console.log('Disconnected from MongoDB'))
        .catch(err => console.error('Error disconnecting from MongoDB:', err));
    }
  }

  public getMetrics(): Record<string, number> {
    return this.metrics.getMetrics();
  }

  private async connectToDatabase(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp');
      console.log('Connected to MongoDB');
    }
  }

  private async ensureDatabaseConnection(): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      console.log('DB connection lost. Reconnecting...');
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp');
        console.log('Reconnected to MongoDB');
      } catch (error) {
        console.error('Reconnect failed:', error);
        setTimeout(() => this.ensureDatabaseConnection(), this.config.reconnectDelayMs);
      }
    }
  }

  private handleGlobalError(error: Error): void {
    console.error('Global error in wallet monitor:', error);
    this.metrics.increment('errorCount');
    this.ensureDatabaseConnection();
  }

  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log('Shutdown signal received. Stopping service...');
      this.stopMonitoring();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGHUP', shutdown);
  }

  private scheduleNextCheck(): void {
    if (!this.isMonitoring) return;
    this.checkInterval = setTimeout(async () => {
      const start = Date.now();
      try {
        await this.checkWalletTransactions();
      } catch (err) {
        console.error('Error during wallet check:', err);
        this.metrics.increment('errorCount');
      } finally {
        const duration = Date.now() - start;
        this.metrics.recordCycleTime(duration);
        console.log(`Check cycle completed in ${duration}ms`);
        this.scheduleNextCheck();
      }
    }, this.config.checkIntervalMs);
  }

  private async loadTopWallets(): Promise<void> {
    try {
      const wallets = await ExternalWallet.find({ isActive: true })
        .sort({ reputationScore: -1 })
        .limit(60);
      this.topWallets = wallets.map(w => w.address);
      console.log(`Loaded ${this.topWallets.length} wallets`);
    } catch (error) {
      console.error('Failed to load wallets:', error);
      this.metrics.increment('errorCount');
    }
  }

  private async checkWalletTransactions(): Promise<void> {
    console.log('Checking wallet transactions...');
    const tokenBuyCount = new Map<string, string[]>();
    const { batchSize } = this.config;

    for (let i = 0; i < this.topWallets.length; i += batchSize) {
      const batch = this.topWallets.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(addr => this.processWalletTransactions(addr, tokenBuyCount))
      );
      results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .forEach(r => {
          console.error('Batch error:', r.reason);
          this.metrics.increment('errorCount');
        });
      if (i + batchSize < this.topWallets.length) {
        await new Promise(res => setTimeout(res, 500));
      }
    }

    await this.checkForTrendingTokens(tokenBuyCount);
  }

  private async processWalletTransactions(
    walletAddress: string,
    tokenBuyCount: Map<string, string[]>
  ): Promise<void> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const txs = await this.connection.getSignaturesForAddress(publicKey, { limit: 10 });
      if (!txs.length) return;
      this.metrics.increment('walletsProcessed');

      const lastSig = this.lastCheckedSignatures.get(walletAddress);
      const newTxs = lastSig
        ? txs.filter(tx => tx.signature !== lastSig).reverse()
        : [txs[0]];
      this.lastCheckedSignatures.set(walletAddress, txs[0].signature);

      for (const tx of newTxs) {
        const parsed = await this.connection.getParsedTransaction(tx.signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (!parsed) continue;
        this.metrics.increment('transactionsProcessed');

        const { tokensBought, tokensSold } = this.extractTokenInteractions(parsed);
        this.metrics.increment('tokenBuysDetected', tokensBought.length);
        this.metrics.increment('tokenSellsDetected', tokensSold.length);

        tokensBought.forEach(token => {
          if (!tokenBuyCount.has(token)) tokenBuyCount.set(token, []);
          tokenBuyCount.get(token)!.push(walletAddress);
        });

        await this.updateWalletActivity(walletAddress, { tokensBought, tokensSold });
      }
    } catch (error) {
      console.error(`Error in wallet ${walletAddress}:`, error);
      this.metrics.increment('errorCount');
      throw error;
    }
  }

  private async updateWalletActivity(
    walletAddress: string,
    tokenInteractions: { tokensBought: string[]; tokensSold: string[] }
  ): Promise<void> {
    try {
      await ExternalWallet.updateOne(
        { address: walletAddress },
        {
          $set: { lastActivity: new Date() },
          $push: {
            'metadata.recentTokens': {
              $each: [...tokenInteractions.tokensBought, ...tokenInteractions.tokensSold],
              $slice: -20,
            },
          },
        }
      );
    } catch (error) {
      console.error(`DB update error for ${walletAddress}:`, error);
      this.metrics.increment('errorCount');
    }
  }

  private async checkForTrendingTokens(
    tokenBuyCount: Map<string, string[]>
  ): Promise<void> {
    for (const [token, wallets] of tokenBuyCount.entries()) {
      if (wallets.length >= 2) {
        console.log(`Trending token ${token}: bought by ${wallets.length}`);
        const meta = await TokenMetadata.findOne({ address: token });
        const name = meta?.name || token;
        const strength = wallets.length * 10;
        if (strength >= this.config.alertThreshold) {
          this.alertService.sendAlert({
            type: 'trending_token',
            priority: wallets.length >= 4 ? 'high' : 'medium',
            message: `🚨 TRENDING TOKEN ALERT: ${name} is being bought by ${wallets.length} tracked wallets`,
            data: {
              tokenAddress: token,
              walletCount: wallets.length,
              buyingWallets: wallets,
              signalStrength: strength,
              timestamp: new Date(),
            },
          });
          this.metrics.increment('alertsGenerated');
        }
      }
    }
  }

  private extractTokenInteractions(tx: ParsedTransactionWithMeta): {
    tokensBought: string[];
    tokensSold: string[];
  } {
    const tokensBought: string[] = [];
    const tokensSold: string[] = [];
    if (tx.meta?.err) return { tokensBought, tokensSold };

    try {
      if (this.isSwapTransaction(tx)) {
        const info = this.extractSwapInfo(tx);
        if (info) {
          if (this.config.stablecoins.includes(info.tokenIn)) {
            tokensBought.push(info.tokenOut);
          } else if (this.config.stablecoins.includes(info.tokenOut)) {
            tokensSold.push(info.tokenIn);
          }
        }
      } else {
        this.extractTokenTransfers(tx).forEach(t => {
          if (t.direction === 'incoming') tokensBought.push(t.tokenAddress);
          else tokensSold.push(t.tokenAddress);
        });
      }
    } catch (error) {
      console.error('extractTokenInteractions error:', error);
      this.metrics.increment('errorCount');
    }

    return {
      tokensBought: Array.from(new Set(tokensBought)),
      tokensSold: Array.from(new Set(tokensSold)),
    };
  }

  private isSwapTransaction(tx: ParsedTransactionWithMeta): boolean {
    for (const ix of tx.transaction.message.instructions) {
      const pid = typeof ix.programId === 'object' ? ix.programId.toString() : ix.programId;
      if (this.config.dexProgramIds.includes(pid)) return true;
    }
    for (const acct of tx.transaction.message.accountKeys) {
      const key = typeof acct === 'object' ? acct.pubkey.toString() : acct;
      if (this.config.dexProgramIds.includes(key)) return true;
    }
    return false;
  }

  private extractSwapInfo(tx: ParsedTransactionWithMeta):
    | { tokenIn: string; tokenOut: string; amountIn?: number; amountOut?: number }
    | null {
    if (!tx.meta?.preTokenBalances || !tx.meta.postTokenBalances) return null;
    const pre = new Map<string, number>();
    const post = new Map<string, number>();
    tx.meta.preTokenBalances.forEach(b => {
      if (b.owner && b.mint) pre.set(`${b.owner}:${b.mint}`, b.uiTokenAmount.uiAmount || 0);
    });
    tx.meta.postTokenBalances.forEach(b => {
      if (b.owner && b.mint) post.set(`${b.owner}:${b.mint}`, b.uiTokenAmount.uiAmount || 0);
    });
    const ownerKey = tx.transaction.message.accountKeys[0].toString();
    let tokenIn = '', tokenOut = '', amountIn = 0, amountOut = 0;
    for (const [key, preAmt] of pre.entries()) {
      const [owner, mint] = key.split(':');
      if (owner !== ownerKey) continue;
      const pAmt = post.get(key) || 0;
      const diff = pAmt - preAmt;
      if (diff < 0) { tokenIn = mint; amountIn = Math.abs(diff); }
      else if (diff > 0) { tokenOut = mint; amountOut = diff; }
    }
    if (tx.meta.preBalances && tx.meta.postBalances) {
      const solDiff = tx.meta.postBalances[0] - tx.meta.preBalances[0];
      if (solDiff < -5000) { tokenIn = 'SOL'; amountIn = Math.abs(solDiff) / 1e9; }
      else if (solDiff > 0) { tokenOut = 'SOL'; amountOut = solDiff / 1e9; }
    }
    return tokenIn && tokenOut ? { tokenIn, tokenOut, amountIn, amountOut } : null;
  }

  private extractTokenTransfers(tx: ParsedTransactionWithMeta): Array<{
    tokenAddress: string;
    direction: 'incoming' | 'outgoing';
    amount?: number;
  }> {
    const transfers: Array<{ tokenAddress: string; direction: 'incoming' | 'outgoing'; amount?: number }> =
      [];
    if (!tx.meta?.preTokenBalances || !tx.meta.postTokenBalances) return transfers;
    const walletAddr = tx.transaction.message.accountKeys[0].toString();
    const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const tokenIxs = tx.transaction.message.instructions.filter(ix => {
      const pid = typeof ix.programId === 'object' ? ix.programId.toString() : ix.programId;
      return pid === TOKEN_PROGRAM_ID;
    });
    if (!tokenIxs.length) return transfers;
    const preMap = new Map<string, number>();
    const postMap = new Map<string, number>();
    tx.meta.preTokenBalances.forEach(b => {
      if (b.owner && b.mint) preMap.set(`${b.owner}:${b.mint}`, b.uiTokenAmount.uiAmount || 0);
    });
    tx.meta.postTokenBalances.forEach(b => {
      if (b.owner && b.mint) postMap.set(`${b.owner}:${b.mint}`, b.uiTokenAmount.uiAmount || 0);
    });
    for (const [key, preAmt] of preMap.entries()) {
      const [owner, mint] = key.split(':');
      if (owner !== walletAddr) continue;
      const pAmt = postMap.get(key) || 0;
      const diff = pAmt - preAmt;
      if (diff !== 0) {
        transfers.push({
          tokenAddress: mint,
          direction: diff > 0 ? 'incoming' : 'outgoing',
          amount: Math.abs(diff),
        });
      }
    }
    for (const [key, pAmt] of postMap.entries()) {
      const [owner, mint] = key.split(':');
      if (owner !== walletAddr) continue;
      if (!preMap.has(key) && pAmt > 0) {
        transfers.push({ tokenAddress: mint, direction: 'incoming', amount: pAmt });
      }
    }
    return transfers;
  }
}

export const walletMonitor = new WalletMonitorService();