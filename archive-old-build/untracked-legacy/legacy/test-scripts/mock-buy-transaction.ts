import mongoose from 'mongoose';
import TransactionMonitor from '../services/transactionMonitor';
import { config } from '../config/app-config';
import { ITransaction } from '../types/database';
import SmartWallet from '../models/smartWallet';

(async () => {
  await mongoose.connect(config.database.uri);
  console.log('Connected to MongoDB');

  // Pull one Tier 1 wallet
  const tier1Wallet = await SmartWallet.findOne({ 'tierMetrics.tier': 1 }).lean();
  if (!tier1Wallet) throw new Error('No Tier 1 wallet found');

  const transaction: ITransaction = {
    hash: 'mock-tx-hash',
    walletAddress: 'YourTier1WalletAddressHere',
    tokenAddress: 'MockTokenAddress',
    tokenName: 'MockToken',
    tokenSymbol: 'MCK',
    pairAddress: 'MockPairAddress',
    dexName: 'Raydium',
    direction: 'buy', // Optional, used elsewhere
    type: 'BUY', // ✅ REQUIRED
    timestamp: new Date(),
    amount: 1000,
    price: 0.01, // ✅ REQUIRED
    volume: 10000,
    isNewTokenLaunch: true,
    lpValueUSD: 50000,
    uniqueHolders: 350,
    buyTxCount: 720,
    hasMintAuthority: false,
    hasFreezeAuthority: false,
    largestHolderPercent: 24.8,
    tokenFirstSeenTimestamp: Date.now(),
    smartWallets: ['YourTier1WalletAddressHere']
  };

  await TransactionMonitor.monitorTransaction(transaction);
  console.log('Mock transaction processed.');

  await mongoose.disconnect();
})();