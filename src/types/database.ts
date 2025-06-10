// src/types/database.ts
import { Types } from 'mongoose';

export interface ITransaction {
    hash: string;
    timestamp: Date;
    tokenAddress: string;
    pairAddress: string;
    price: number;
    volume: number;
    type: 'BUY' | 'SELL';
    walletAddress: string;
    tokenInfo?: any;
    tokenName?: string;
    tokenSymbol?: string;
    dexName?: string;
    direction?: 'buy' | 'sell';
    amount?: number;
    isNewTokenLaunch?: boolean;
    lpValueUSD?: number;
    uniqueHolders?: number;
    buyTxCount?: number;
    hasMintAuthority?: boolean;
    hasFreezeAuthority?: boolean;
    largestHolderPercent?: number;
    tokenFirstSeenTimestamp?: number;
    smartWallets?: string[];
}

export interface IWallet {
    address: string;
    firstSeen: Date;
    lastSeen: Date;
    transactionCount: number;
    totalVolume: number;
    scoreMetrics: {
        profitability: number;
        frequency: number;
        successRate: number;
    };
    watchlist?: boolean;
    tags?: string[];
}

export interface IPattern {
    id: string;
    name: string;
    description: string;
    conditions: {
        timeframe: number;  // in minutes
        minTransactions: number;
        minVolume: number;
        buyToSellRatio?: number;
        priceImpact?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface IAlert {
    _id?: Types.ObjectId;
    type: 'PATTERN' | 'WALLET' | 'PRICE' | 'VOLUME' | 'FREQUENCY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    metadata: {
        patternId?: string;
        walletAddress?: string;
        pairAddress?: string;
        threshold?: number;
        volume?: number;
        priceImpact?: number;
        transactionHash?: string;
    };
    timestamp: Date;
    status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
}