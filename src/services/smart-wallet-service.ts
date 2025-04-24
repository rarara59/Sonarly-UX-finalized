// src/services/smart-wallet.service.ts
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import {
  SmartWallet,
  ISmartWallet,
  IWalletTransaction
} from '../models/smart-wallet.model';
import { logger } from '../utils/logger';
import { config } from '../config/app-config';

/** Interfaces for typed return values */
export interface AverageMetrics {
  avgSuccessRate: number;
  avgPredictedSuccessRate: number;
  avgEarlyAdoptionScore: number;
  avgProfitabilityScore: number;
  avgNetworkInfluence: number;
  avgHoldTime: number;
  totalWallets: number;
}

export interface PaginationOptions {
  page?: number;
  perPage?: number;
}

export interface RiskAppetiteCounts {
  [key: string]: number;
}

/** Helper for centralized error logging */
const withErrorLogging = async <T>(
  operation: string,
  context: string,
  fn: () => Promise<T>
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    logger.error(`Error in ${operation}${context ? ` (${context})` : ''}`, { error });
    throw error;
  }
};

export class SmartWalletService {
  private model: Model<ISmartWallet>;

  constructor(model?: Model<ISmartWallet>) {
    this.model = model || SmartWallet;
  }

  /** Apply pagination to a mongoose query */
  private async applyPagination<T>(
    query: any,
    options: PaginationOptions
  ): Promise<T[]> {
    const { page = 1, perPage = config.pagination.defaultPerPage } = options;
    if (page < 1) throw new Error('Page must be ≥ 1');
    if (perPage < 1) throw new Error('perPage must be ≥ 1');
    return query.skip((page - 1) * perPage).limit(perPage);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Generic CRUD, bulk, aggregates, pagination
  // ─────────────────────────────────────────────────────────────────────────────

  async findBySuccessRateRange(
    minRate = config.smartWallet.defaultMinSuccessRate,
    maxRate = config.smartWallet.defaultMaxSuccessRate,
    options: PaginationOptions = {}
  ): Promise<ISmartWallet[]> {
    return withErrorLogging(
      'findBySuccessRateRange',
      `min=${minRate},max=${maxRate}`,
      async () => {
        const q = this.model.find({
          successRate: { $gte: minRate, $lte: maxRate },
          isVerified: true
        }).sort({ predictedSuccessRate: -1 });
        return this.applyPagination<ISmartWallet>(q, options);
      }
    );
  }

  async findByRecentToken(
    tokenSymbol: string,
    options: PaginationOptions = {}
  ): Promise<ISmartWallet[]> {
    return withErrorLogging(
      'findByRecentToken',
      `token=${tokenSymbol}`,
      async () => {
        const q = this.model.find({ recentTokens: tokenSymbol })
          .sort({ lastInvestmentTimestamp: -1 });
        return this.applyPagination<ISmartWallet>(q, options);
      }
    );
  }

  async findEarlyAdopters(
    minScore = config.smartWallet.defaultMinEarlyAdoptionScore,
    options: PaginationOptions = {}
  ): Promise<ISmartWallet[]> {
    return withErrorLogging(
      'findEarlyAdopters',
      `minScore=${minScore}`,
      async () => {
        const q = this.model.find({
          earlyAdoptionScore: { $gte: minScore },
          isVerified: true
        }).sort({ earlyAdoptionScore: -1 });
        return this.applyPagination<ISmartWallet>(q, options);
      }
    );
  }

  async findRecentlyActive(
    hoursAgo = config.smartWallet.defaultRecentActivityHours,
    options: PaginationOptions = {}
  ): Promise<ISmartWallet[]> {
    return withErrorLogging(
      'findRecentlyActive',
      `hoursAgo=${hoursAgo}`,
      async () => {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hoursAgo);
        const q = this.model.find({
          lastInvestmentTimestamp: { $gte: cutoff }
        }).sort({ lastInvestmentTimestamp: -1 });
        return this.applyPagination<ISmartWallet>(q, options);
      }
    );
  }

  async getByAddress(address: string): Promise<ISmartWallet | null> {
    return withErrorLogging(
      'getByAddress',
      `address=${address}`,
      () => this.model.findOne({ address })
    );
  }

  async updateWallet(
    address: string,
    updateData: UpdateQuery<ISmartWallet>
  ): Promise<ISmartWallet | null> {
    return withErrorLogging(
      'updateWallet',
      `address=${address}`,
      () =>
        this.model.findOneAndUpdate(
          { address },
          updateData,
          { new: true }
        )
    );
  }

  async upsertWallet(
    address: string,
    walletData: Partial<ISmartWallet>
  ): Promise<ISmartWallet | null> {
    return withErrorLogging(
      'upsertWallet',
      `address=${address}`,
      () =>
        this.model.findOneAndUpdate(
          { address },
          { ...walletData, address },
          { new: true, upsert: true }
        )
    );
  }

  async findByQuery(
    query: FilterQuery<ISmartWallet>,
    options: PaginationOptions = {}
  ): Promise<ISmartWallet[]> {
    return withErrorLogging(
      'findByQuery',
      `query=${JSON.stringify(query)}`,
      async () => {
        const q = this.model.find(query);
        return this.applyPagination<ISmartWallet>(q, options);
      }
    );
  }

  async bulkUpdate(
    query: FilterQuery<ISmartWallet>,
    updateData: UpdateQuery<ISmartWallet>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    return withErrorLogging(
      'bulkUpdate',
      `query=${JSON.stringify(query)}`,
      async () => {
        const res = await this.model.updateMany(query, updateData);
        return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
      }
    );
  }

  async deleteByQuery(
    query: FilterQuery<ISmartWallet>
  ): Promise<{ deletedCount: number }> {
    return withErrorLogging(
      'deleteByQuery',
      `query=${JSON.stringify(query)}`,
      async () => {
        const res = await this.model.deleteMany(query);
        return { deletedCount: res.deletedCount ?? 0 };
      }
    );
  }

  async countByRiskAppetite(): Promise<RiskAppetiteCounts> {
    return withErrorLogging('countByRiskAppetite', '', async () => {
      const result = await this.model.aggregate([
        { $group: { _id: '$riskAppetite', count: { $sum: 1 } } }
      ]);
      const counts: RiskAppetiteCounts = {};
      result.forEach(item => {
        counts[item._id] = item.count;
      });
      return counts;
    });
  }

  async getAverageMetrics(): Promise<AverageMetrics | null> {
    return withErrorLogging('getAverageMetrics', '', async () => {
      const result = await this.model.aggregate([
        { $match: { isVerified: true } },
        {
          $group: {
            _id: null,
            avgSuccessRate: { $avg: '$successRate' },
            avgPredictedSuccessRate: { $avg: '$predictedSuccessRate' },
            avgEarlyAdoptionScore: { $avg: '$earlyAdoptionScore' },
            avgProfitabilityScore: { $avg: '$profitabilityScore' },
            avgNetworkInfluence: { $avg: '$networkInfluence' },
            avgHoldTime: { $avg: '$averageHoldTime' },
            totalWallets: { $sum: 1 }
          }
        }
      ]);
      return (result[0] as AverageMetrics) ?? null;
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Domain-specific operations
  // ────────────────────────────────────────────────────────────────────────────

  async createWallet(
    walletData: Partial<ISmartWallet>
  ): Promise<ISmartWallet> {
    return withErrorLogging(
      'createWallet',
      `address=${walletData.address}`,
      async () => {
        const exists = await this.model.findOne({ address: walletData.address });
        if (exists) throw new Error(`Wallet ${walletData.address} already exists`);
        const now = new Date();
        const wallet = new this.model({
          ...walletData,
          firstSeen: now,
          lastUpdated: now
        });
        await wallet.save();
        logger.info(`Created wallet ${wallet.address}`);
        return wallet;
      }
    );
  }

  async addTransaction(
    address: string,
    tx: IWalletTransaction
  ): Promise<ISmartWallet | null> {
    return withErrorLogging(
      'addTransaction',
      `address=${address},txHash=${tx.transactionHash}`,
      async () => {
        const dup = await this.model.findOne({
          address,
          'transactions.transactionHash': tx.transactionHash
        });
        if (dup) {
          logger.info(`Tx ${tx.transactionHash} already exists for ${address}`);
          return dup;
        }
        const updated = await this.model.findOneAndUpdate(
          { address },
          {
            $push: { transactions: tx },
            $set: { lastTradeAt: new Date(), lastUpdated: new Date() },
            $inc: {
              totalTrades: 1,
              ...(tx.isSuccessful ? { successfulTrades: 1 } : {})
            }
          },
          { new: true }
        );
        if (!updated) return null;
        // Recalculate winRate
        if (updated.totalTrades > 0) {
          updated.winRate = (updated.successfulTrades / updated.totalTrades) * 100;
          await updated.save();
        }
        logger.info(`Added tx ${tx.transactionHash} to ${address}`);
        return updated;
      }
    );
  }

  async findHighPerformingWallets(options: {
    minWinRate?: number;
    minSuccessfulTrades?: number;
    category?: string;
    limit?: number;
  } = {}): Promise<ISmartWallet[]> {
    return withErrorLogging(
      'findHighPerformingWallets',
      '',
      async () => {
        const {
          minWinRate = config.smartWallet.defaultMinWinRate,
          minSuccessfulTrades = config.smartWallet.defaultMinSuccessfulTrades,
          category,
          limit = config.smartWallet.defaultHighPerformersLimit
        } = options;
        const q: any = {
          winRate: { $gte: minWinRate },
          successfulTrades: { $gte: minSuccessfulTrades },
          isActive: true
        };
        if (category) q.category = category;
        return this.model.find(q)
          .sort({ winRate: -1, confidenceScore: -1 })
          .limit(limit);
      }
    );
  }

  async findWalletsWith4xPotential(options: {
    minAchieves4xScore?: number;
    limit?: number;
  } = {}): Promise<ISmartWallet[]> {
    return withErrorLogging(
      'findWalletsWith4xPotential',
      '',
      async () => {
        const {
          minAchieves4xScore = config.smartWallet.defaultAchieves4xScore,
          limit = config.smartWallet.default4xLimit
        } = options;
        return this.model.find({
          'metadata.achieves4xScore': { $gte: minAchieves4xScore },
          isActive: true
        })
        .sort({ 'metadata.achieves4xScore': -1 })
        .limit(limit);
      }
    );
  }

  async deactivateWallet(address: string): Promise<ISmartWallet | null> {
    return withErrorLogging(
      'deactivateWallet',
      `address=${address}`,
      () =>
        this.model.findOneAndUpdate(
          { address },
          { isActive: false, lastUpdated: new Date() },
          { new: true }
        )
    );
  }

  async getWalletStats(): Promise<{
    totalWallets: number;
    activeWallets: number;
    categories: Array<{ category: string; count: number }>;
    avgWinRate: number;
  }> {
    return withErrorLogging(
      'getWalletStats',
      '',
      async () => {
        const total = await this.model.countDocuments();
        const active = await this.model.countDocuments({ isActive: true });
        const categories = await this.model.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        const avg = await this.model.aggregate([
          { $group: { _id: null, avgWinRate: { $avg: '$winRate' } } }
        ]);
        return {
          totalWallets: total,
          activeWallets: active,
          categories: categories.map(c => ({ category: c._id, count: c.count })),
          avgWinRate: avg[0]?.avgWinRate ?? 0
        };
      }
    );
  }
}

export const smartWalletService = new SmartWalletService();