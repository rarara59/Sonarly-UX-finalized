// src/scripts/seed-data.ts
import { Types } from 'mongoose';
import { 
  IExternalWallet, 
  IWalletPerformanceHistory,
  ITokenMetadata,
  ISmartWallet 
} from '../types/wallet-types';

// Version identifier for sample data
export const SEED_DATA_VERSION = '1.0.0';

// Sample external wallets with type enforcement
export const sampleExternalWallets: Partial<IExternalWallet>[] = [
  {
    address: 'Fx2YmmkArJDwUjnk5TZKj8z5RwFLFQXABKD8Qvhf94j4',
    label: 'Trader Alpha',
    network: 'solana',
    category: 'Gem Spotter',
    winRate: 75.2,
    totalTrades: 124,
    successfulTrades: 93,
    totalPnL: 157500,
    avgHoldTime: '24h 30m',
    firstSeen: new Date('2024-01-15T08:45:00Z'),
    lastUpdated: new Date('2025-04-01T10:30:00Z'),
    lastActivity: new Date('2025-04-01T10:30:00Z'),
    isActive: true,
    reputationScore: 87,
    tags: ['high-success', 'early-adopter'],
    returns4xRate: 68.5,
    exitEfficiencyScore: 82.3,
    fastTimeframePreference: 40,
    slowTimeframePreference: 60,
    predictedSuccessRate: 76.1,
    confidenceScore: 92,
    metadata: {
      preferredTokens: ['BONK', 'WIF', 'BOME'],
      tradingFrequency: 'High',
      lastActiveTimestamp: new Date('2025-04-01T10:30:00Z'),
      achieves4xScore: 68.5,
      fastTimeframeStats: {
        count: 48,
        successRate: 72.9,
        avgMultiplier: 3.8
      },
      slowTimeframeStats: {
        count: 76,
        successRate: 76.3,
        avgMultiplier: 5.7
      },
      memeTokenStats: {
        count: 98,
        successRate: 78.6,
        avgMultiplier: 6.2
      },
      entryTimingScore: 85
    }
  },
  {
    address: 'D2PConJNxRQrTxnUXZYJH7GKLHUNmH9Jdo8quAMKvGDf',
    label: 'Meme Whale',
    network: 'solana',
    category: 'Early Mover',
    winRate: 74.8,
    totalTrades: 201,
    successfulTrades: 150,
    totalPnL: 235000,
    avgHoldTime: '18h 45m',
    firstSeen: new Date('2024-03-10T12:30:00Z'),
    lastUpdated: new Date('2025-04-02T14:20:00Z'),
    lastActivity: new Date('2025-04-02T14:20:00Z'),
    isActive: true,
    reputationScore: 91,
    tags: ['whale', 'high-volume'],
    returns4xRate: 62.3,
    exitEfficiencyScore: 78.1,
    fastTimeframePreference: 60,
    slowTimeframePreference: 40,
    predictedSuccessRate: 75.3,
    confidenceScore: 88,
    metadata: {
      preferredTokens: ['MEME', 'BONK', 'SLERF'],
      tradingFrequency: 'High',
      lastActiveTimestamp: new Date('2025-04-02T14:20:00Z'),
      achieves4xScore: 62.3,
      fastTimeframeStats: {
        count: 122,
        successRate: 75.4,
        avgMultiplier: 4.2
      },
      slowTimeframeStats: {
        count: 79,
        successRate: 73.4,
        avgMultiplier: 4.7
      },
      memeTokenStats: {
        count: 172,
        successRate: 76.2,
        avgMultiplier: 5.3
      },
      entryTimingScore: 78
    }
  },
  {
    address: 'BYkrPdPXEuGxmKfTLkuqDmJnJAZJY2XgpJMJQjnLaYrQ',
    label: 'Inactive Trader',
    network: 'solana',
    category: 'Gem Spotter',
    winRate: 68.4,
    totalTrades: 95,
    successfulTrades: 65,
    totalPnL: 82500,
    avgHoldTime: '36h 20m',
    firstSeen: new Date('2024-02-20T09:15:00Z'),
    lastUpdated: new Date('2025-02-15T18:45:00Z'),
    lastActivity: new Date('2025-02-15T18:45:00Z'),
    isActive: false,
    reputationScore: 64,
    tags: ['inactive', 'medium-success'],
    returns4xRate: 45.2,
    exitEfficiencyScore: 63.8,
    fastTimeframePreference: 30,
    slowTimeframePreference: 70,
    predictedSuccessRate: 65.2,
    confidenceScore: 72,
    metadata: {
      preferredTokens: ['SAMO', 'WIF'],
      tradingFrequency: 'Medium',
      lastActiveTimestamp: new Date('2025-02-15T18:45:00Z'),
      achieves4xScore: 45.2,
      fastTimeframeStats: {
        count: 28,
        successRate: 64.3,
        avgMultiplier: 3.1
      },
      slowTimeframeStats: {
        count: 67,
        successRate: 70.1,
        avgMultiplier: 3.8
      },
      memeTokenStats: {
        count: 76,
        successRate: 69.7,
        avgMultiplier: 3.5
      },
      entryTimingScore: 58
    }
  }
];

// Sample performance history with type enforcement
export const samplePerformanceHistory: Partial<IWalletPerformanceHistory>[] = [
  {
    walletAddress: 'Fx2YmmkArJDwUjnk5TZKj8z5RwFLFQXABKD8Qvhf94j4',
    date: new Date('2025-03-01T00:00:00Z'),
    successRate: 73.5,
    totalTrades: 100,
    profitableTrades: 73,
    averageReturn: 4.8,
    returns4xRate: 64.2,
    confidenceScore: 88,
    recentTokens: ['BONK', 'WIF']
  },
  {
    walletAddress: 'Fx2YmmkArJDwUjnk5TZKj8z5RwFLFQXABKD8Qvhf94j4',
    date: new Date('2025-04-01T00:00:00Z'),
    successRate: 75.2,
    totalTrades: 124,
    profitableTrades: 93,
    averageReturn: 5.3,
    returns4xRate: 68.5,
    confidenceScore: 92,
    recentTokens: ['BONK', 'WIF', 'BOME']
  },
  {
    walletAddress: 'D2PConJNxRQrTxnUXZYJH7GKLHUNmH9Jdo8quAMKvGDf',
    date: new Date('2025-03-01T00:00:00Z'),
    successRate: 72.1,
    totalTrades: 165,
    profitableTrades: 119,
    averageReturn: 4.5,
    returns4xRate: 58.7,
    confidenceScore: 85,
    recentTokens: ['MEME', 'BONK']
  },
  {
    walletAddress: 'D2PConJNxRQrTxnUXZYJH7GKLHUNmH9Jdo8quAMKvGDf',
    date: new Date('2025-04-01T00:00:00Z'),
    successRate: 74.8,
    totalTrades: 201,
    profitableTrades: 150,
    averageReturn: 4.9,
    returns4xRate: 62.3,
    confidenceScore: 88,
    recentTokens: ['MEME', 'BONK', 'SLERF']
  }
];

// Sample tokens with type enforcement
export const sampleTokens: Partial<ITokenMetadata>[] = [
  {
    address: 'SOL8Z33usFvzKFdhUPMSoPbEpNsp2NnLfNkiYPSREYQB',
    symbol: 'BONK',
    name: 'Bonk',
    chain: 'solana',
    decimals: 9,
    firstSeen: new Date('2023-12-01T00:00:00Z'),
    lastUpdated: new Date('2025-04-01T00:00:00Z'),
    currentPrice: 0.00001234,
    priceHistory: [
      { timestamp: new Date('2025-03-01T00:00:00Z'), price: 0.00000987 },
      { timestamp: new Date('2025-04-01T00:00:00Z'), price: 0.00001234 }
    ],
    watchedByWallets: ['Fx2YmmkArJDwUjnk5TZKj8z5RwFLFQXABKD8Qvhf94j4', 'D2PConJNxRQrTxnUXZYJH7GKLHUNmH9Jdo8quAMKvGDf'],
    metadataUri: 'https://metadata.com/bonk',
    isActive: true,
    tags: ['meme', 'high-volume'],
    liquidity: 15000000,
    marketCap: 125000000,
    volume24h: 8500000
  },
  {
    address: 'SOL9vV2TrriYxVJfXSX5CeLCbMhkM4j4JmUAFmZD1Cf7',
    symbol: 'WIF',
    name: 'Dogwifhat',
    chain: 'solana',
    decimals: 9,
    firstSeen: new Date('2024-01-15T00:00:00Z'),
    lastUpdated: new Date('2025-04-01T00:00:00Z'),
    currentPrice: 0.00003456,
    priceHistory: [
      { timestamp: new Date('2025-03-01T00:00:00Z'), price: 0.00002876 },
      { timestamp: new Date('2025-04-01T00:00:00Z'), price: 0.00003456 }
    ],
    watchedByWallets: ['Fx2YmmkArJDwUjnk5TZKj8z5RwFLFQXABKD8Qvhf94j4', 'BYkrPdPXEuGxmKfTLkuqDmJnJAZJY2XgpJMJQjnLaYrQ'],
    metadataUri: 'https://metadata.com/wif',
    isActive: true,
    tags: ['meme', 'trending'],
    liquidity: 25000000,
    marketCap: 210000000,
    volume24h: 12500000
  },
  {
    address: 'SOLMqnTnRsZj1eSPQsYqqQ5QWWN7TmWoAL2pDJp5Bz4Z',
    symbol: 'SLERF',
    name: 'Slerf',
    chain: 'solana',
    decimals: 9,
    firstSeen: new Date('2024-03-10T00:00:00Z'),
    lastUpdated: new Date('2025-04-01T00:00:00Z'),
    currentPrice: 0.00000789,
    priceHistory: [
      { timestamp: new Date('2025-03-01T00:00:00Z'), price: 0.00000567 },
      { timestamp: new Date('2025-04-01T00:00:00Z'), price: 0.00000789 }
    ],
    watchedByWallets: ['D2PConJNxRQrTxnUXZYJH7GKLHUNmH9Jdo8quAMKvGDf'],
    metadataUri: 'https://metadata.com/slerf',
    isActive: true,
    tags: ['meme', 'new'],
    liquidity: 8500000,
    marketCap: 65000000,
    volume24h: 4200000
  }
];

// Sample smart wallets with type enforcement
export const sampleSmartWallets: Partial<ISmartWallet>[] = [
  {
    address: 'Fx2YmmkArJDwUjnk5TZKj8z5RwFLFQXABKD8Qvhf94j4',
    walletName: 'Trader Alpha',
    successRate: 75.2,
    totalTransactions: 124,
    predictedSuccessRate: 76.1,
    earlyAdoptionScore: 8.7,
    profitabilityScore: 9.2,
    lastInvestmentTimestamp: new Date('2025-04-01T10:30:00Z'),
    averageHoldTime: 72, // in hours
    recentTokens: ['BONK', 'WIF', 'BOME'],
    riskAppetite: 'high',
    networkInfluence: 7.4,
    isVerified: true
  },
  {
    address: 'D2PConJNxRQrTxnUXZYJH7GKLHUNmH9Jdo8quAMKvGDf',
    walletName: 'Meme Whale',
    successRate: 74.8,
    totalTransactions: 201,
    predictedSuccessRate: 75.3,
    earlyAdoptionScore: 9.1,
    profitabilityScore: 8.8,
    lastInvestmentTimestamp: new Date('2025-04-02T14:20:00Z'),
    averageHoldTime: 48, // in hours
    recentTokens: ['MEME', 'BONK', 'SLERF'],
    riskAppetite: 'medium-high',
    networkInfluence: 8.9,
    isVerified: true
  }
];