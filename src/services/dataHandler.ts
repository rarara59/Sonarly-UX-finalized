// src/services/dataHandler.ts
import mongoose, { Schema } from 'mongoose';
import { ITransaction, IWallet, IPattern, IAlert } from '../types/database';

// Define schemas
const TransactionSchema = new Schema<ITransaction>({
    hash: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    tokenAddress: { type: String, required: true, index: true },
    pairAddress: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    volume: { type: Number, required: true },
    type: { type: String, required: true, enum: ['BUY', 'SELL'] },
    walletAddress: { type: String, required: true, index: true },
    tokenInfo: { type: Schema.Types.Mixed, required: false }
});

const WalletSchema = new Schema<IWallet>({
    address: { type: String, required: true, unique: true, index: true },
    firstSeen: { type: Date, required: true },
    lastSeen: { type: Date, required: true },
    transactionCount: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    scoreMetrics: {
        profitability: { type: Number, default: 0 },
        frequency: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 }
    },
    watchlist: { type: Boolean, default: false },
    tags: [{ type: String }]
});

const Models = {
    Transaction: mongoose.model<ITransaction>('Transaction', TransactionSchema),
    Wallet: mongoose.model<IWallet>('Wallet', WalletSchema)
};

class DataHandler {
    constructor() {
        this.initDatabase();
    }

    private async initDatabase() {
        try {
            await mongoose.connect('mongodb://localhost:27017/thorp');
            console.log('Connected to MongoDB successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    // Transaction methods
    async saveTransaction(data: Omit<ITransaction, 'id'>) {
        try {
            const transaction = new Models.Transaction(data);
            await transaction.save();
            await this.updateWalletStats(data.walletAddress);
            return transaction;
        } catch (error) {
            console.error('Error saving transaction:', error);
            throw error;
        }
    }

    async getTransactionsByWallet(walletAddress: string, limit = 100) {
        try {
            return await Models.Transaction.find({ walletAddress })
                .sort({ timestamp: -1 })
                .limit(limit);
        } catch (error) {
            console.error('Error fetching wallet transactions:', error);
            throw error;
        }
    }

    // Wallet methods
    private async updateWalletStats(walletAddress: string) {
        try {
            const transactions = await Models.Transaction.find({ walletAddress });
            const wallet = await Models.Wallet.findOne({ address: walletAddress });

            if (!wallet) {
                const newWallet = new Models.Wallet({
                    address: walletAddress,
                    firstSeen: new Date(),
                    lastSeen: new Date(),
                    transactionCount: 1,
                    totalVolume: transactions[0].volume
                });
                await newWallet.save();
            } else {
                wallet.lastSeen = new Date();
                wallet.transactionCount = transactions.length;
                wallet.totalVolume = transactions.reduce((sum, tx) => sum + tx.volume, 0);
                await wallet.save();
            }
        } catch (error) {
            console.error('Error updating wallet stats:', error);
            throw error;
        }
    }

    async getWalletInfo(walletAddress: string) {
        try {
            return await Models.Wallet.findOne({ address: walletAddress });
        } catch (error) {
            console.error('Error fetching wallet info:', error);
            throw error;
        }
    }
}

export default new DataHandler();