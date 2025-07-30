// src/services/smart-wallet.service.js
// Complete JavaScript conversion of SmartWalletService with all sophisticated features

import SmartWallet from '../models/smartWallet.js';

/** Helper for centralized error logging */
const withErrorLogging = async (operation, context, fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in ${operation}${context ? ` (${context})` : ''}`, { error });
    throw error;
  }
};

export class SmartWalletService {
  constructor(model = null) {
    this.model = model || SmartWallet;
    
    // Performance optimization
    this.cache = new Map();
    this.lastCacheUpdate = 0;
    this.CACHE_TTL = 10 * 60 * 1000; // 10 minutes
    
    // Default configuration (from your original TypeScript config)
    this.config = {
      pagination: {
        defaultPerPage: 50
      },
      smartWallet: {
        defaultMinSuccessRate: 50,
        defaultMaxSuccessRate: 100,
        defaultMinEarlyAdoptionScore: 70,
        defaultRecentActivityHours: 24,
        defaultMinWinRate: 60,
        defaultMinSuccessfulTrades: 5,
        defaultHighPerformersLimit: 50,
        defaultAchieves4xScore: 60,
        default4xLimit: 30
      }
    };
  }

  /** Apply pagination to a mongoose query */
  async applyPagination(query, options) {
    const { page = 1, perPage = this.config.pagination.defaultPerPage } = options;
    if (page < 1) throw new Error('Page must be ≥ 1');
    if (perPage < 1) throw new Error('perPage must be ≥ 1');
    return query.skip((page - 1) * perPage).limit(perPage);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Core sophisticated methods (from your TypeScript service)
  // ─────────────────────────────────────────────────────────────────────────────

  async findBySuccessRateRange(
    minRate = this.config.smartWallet.defaultMinSuccessRate,
    maxRate = this.config.smartWallet.defaultMaxSuccessRate,
    options = {}
  ) {
    return withErrorLogging(
      'findBySuccessRateRange',
      `min=${minRate},max=${maxRate}`,
      async () => {
        const q = this.model.find({
          successRate: { $gte: minRate, $lte: maxRate },
          isVerified: true
        }).sort({ predictedSuccessRate: -1 });
        
        return this.applyPagination(q, options);
      }
    );
  }

  async findByRecentToken(tokenSymbol, options = {}) {
    return withErrorLogging(
      'findByRecentToken',
      `token=${tokenSymbol}`,
      async () => {
        const q = this.model.find({ recentTokens: tokenSymbol })
          .sort({ lastInvestmentTimestamp: -1 });
        return this.applyPagination(q, options);
      }
    );
  }

  async findEarlyAdopters(
    minScore = this.config.smartWallet.defaultMinEarlyAdoptionScore,
    options = {}
  ) {
    return withErrorLogging(
      'findEarlyAdopters',
      `minScore=${minScore}`,
      async () => {
        const q = this.model.find({
          earlyAdoptionScore: { $gte: minScore },
          isVerified: true
        }).sort({ earlyAdoptionScore: -1 });
        return this.applyPagination(q, options);
      }
    );
  }

  async findRecentlyActive(
    hoursAgo = this.config.smartWallet.defaultRecentActivityHours,
    options = {}
  ) {
    return withErrorLogging(
      'findRecentlyActive',
      `hoursAgo=${hoursAgo}`,
      async () => {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hoursAgo);
        const q = this.model.find({
          lastInvestmentTimestamp: { $gte: cutoff }
        }).sort({ lastInvestmentTimestamp: -1 });
        return this.applyPagination(q, options);
      }
    );
  }

  async getByAddress(address) {
    return withErrorLogging(
      'getByAddress',
      `address=${address}`,
      () => this.model.findOne({ address }).lean()
    );
  }

  async updateWallet(address, updateData) {
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

  async upsertWallet(address, walletData) {
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

  async findByQuery(query, options = {}) {
    return withErrorLogging(
      'findByQuery',
      `query=${JSON.stringify(query)}`,
      async () => {
        const q = this.model.find(query);
        return this.applyPagination(q, options);
      }
    );
  }

  async bulkUpdate(query, updateData) {
    return withErrorLogging(
      'bulkUpdate',
      `query=${JSON.stringify(query)}`,
      async () => {
        const res = await this.model.updateMany(query, updateData);
        return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
      }
    );
  }

  async deleteByQuery(query) {
    return withErrorLogging(
      'deleteByQuery',
      `query=${JSON.stringify(query)}`,
      async () => {
        const res = await this.model.deleteMany(query);
        return { deletedCount: res.deletedCount ?? 0 };
      }
    );
  }

  async countByRiskAppetite() {
    return withErrorLogging('countByRiskAppetite', '', async () => {
      const result = await this.model.aggregate([
        { $group: { _id: '$riskAppetite', count: { $sum: 1 } } }
      ]);
      const counts = {};
      result.forEach(item => {
        counts[item._id] = item.count;
      });
      return counts;
    });
  }

  async getAverageMetrics() {
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
      return result[0] ?? null;
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Domain-specific operations (your sophisticated business logic)
  // ────────────────────────────────────────────────────────────────────────────

  async createWallet(walletData) {
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
        console.info(`Created wallet ${wallet.address}`);
        return wallet;
      }
    );
  }

  async addTransaction(address, tx) {
    return withErrorLogging(
      'addTransaction',
      `address=${address},txHash=${tx.transactionHash}`,
      async () => {
        const dup = await this.model.findOne({
          address,
          'transactions.transactionHash': tx.transactionHash
        });
        
        if (dup) {
          console.info(`Tx ${tx.transactionHash} already exists for ${address}`);
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
        
        console.info(`Added tx ${tx.transactionHash} to ${address}`);
        return updated;
      }
    );
  }

  async findHighPerformingWallets(options = {}) {
    return withErrorLogging(
      'findHighPerformingWallets',
      '',
      async () => {
        const {
          minWinRate = this.config.smartWallet.defaultMinWinRate,
          minSuccessfulTrades = this.config.smartWallet.defaultMinSuccessfulTrades,
          category,
          limit = this.config.smartWallet.defaultHighPerformersLimit
        } = options;
        
        const q = {
          winRate: { $gte: minWinRate },
          successfulTrades: { $gte: minSuccessfulTrades },
          isActive: true
        };
        
        if (category) q.category = category;
        
        return this.model.find(q)
          .sort({ winRate: -1, confidenceScore: -1 })
          .limit(limit)
          .lean(); // Use lean() for better performance
      }
    );
  }

  async findWalletsWith4xPotential(options = {}) {
    return withErrorLogging(
      'findWalletsWith4xPotential',
      '',
      async () => {
        const {
          minAchieves4xScore = this.config.smartWallet.defaultAchieves4xScore,
          limit = this.config.smartWallet.default4xLimit
        } = options;
        
        return this.model.find({
          'metadata.achieves4xScore': { $gte: minAchieves4xScore },
          isActive: true
        })
        .sort({ 'metadata.achieves4xScore': -1 })
        .limit(limit)
        .lean();
      }
    );
  }

  async deactivateWallet(address) {
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

  async getWalletStats() {
    return withErrorLogging(
      'getWalletStats',
      '',
      async () => {
        const [total, active, categories, avg] = await Promise.all([
          this.model.countDocuments(),
          this.model.countDocuments({ isActive: true }),
          this.model.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ]),
          this.model.aggregate([
            { $group: { _id: null, avgWinRate: { $avg: '$winRate' } } }
          ])
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

  // ────────────────────────────────────────────────────────────────────────────
  // Performance optimization methods
  // ────────────────────────────────────────────────────────────────────────────

  async getCachedHighPerformers(options = {}) {
    const cacheKey = `highPerformers_${JSON.stringify(options)}`;
    const now = Date.now();
    
    if (now - this.lastCacheUpdate < this.CACHE_TTL && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const highPerformers = await this.findHighPerformingWallets(options);
    this.cache.set(cacheKey, highPerformers);
    this.lastCacheUpdate = now;

    return highPerformers;
  }

  async getCached4xPotential(options = {}) {
    const cacheKey = `4xPotential_${JSON.stringify(options)}`;
    const now = Date.now();
    
    if (now - this.lastCacheUpdate < this.CACHE_TTL && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const potential4x = await this.findWalletsWith4xPotential(options);
    this.cache.set(cacheKey, potential4x);
    this.lastCacheUpdate = now;

    return potential4x;
  }

  async invalidateCache() {
    this.cache.clear();
    this.lastCacheUpdate = 0;
    console.info('Smart wallet service cache invalidated');
  }

  // Health monitoring
  async isHealthy() {
    try {
      const count = await this.model.countDocuments().limit(1);
      return count >= 0;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  getServiceStats() {
    return {
      cacheSize: this.cache.size,
      lastCacheUpdate: this.lastCacheUpdate,
      cacheAge: Date.now() - this.lastCacheUpdate,
      config: this.config
    };
  }
}

// Create singleton instance (matching your TypeScript pattern)
export const smartWalletService = new SmartWalletService();

// Testing if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing SmartWalletService JavaScript conversion...');
  
  async function testService() {
    try {
      console.log('Service stats:', smartWalletService.getServiceStats());
      
      const health = await smartWalletService.isHealthy();
      console.log('Health check:', health ? '✅ Healthy' : '❌ Unhealthy');

      if (health) {
        const stats = await smartWalletService.getWalletStats();
        console.log('Wallet stats:', stats);

        const highPerformers = await smartWalletService.findHighPerformingWallets({ limit: 5 });
        console.log(`High performers: ${highPerformers.length} found`);
        if (highPerformers.length > 0) {
          console.log('Sample high performer:', {
            address: highPerformers[0].address,
            winRate: highPerformers[0].winRate,
            tier: highPerformers[0].tierMetrics?.tier
          });
        }

        const potential4x = await smartWalletService.findWalletsWith4xPotential({ limit: 5 });
        console.log(`4x potential: ${potential4x.length} found`);

        const earlyAdopters = await smartWalletService.findEarlyAdopters(70, { limit: 3 });
        console.log(`Early adopters: ${earlyAdopters.length} found`);

        const avgMetrics = await smartWalletService.getAverageMetrics();
        console.log('Average metrics:', avgMetrics);

        // Test caching
        const cached = await smartWalletService.getCachedHighPerformers({ limit: 10 });
        console.log(`Cached high performers: ${cached.length} found`);

      } else {
        console.log('⚠️ Database not available for testing');
      }

    } catch (error) {
      console.error('Test failed:', error.message);
    }
  }

  testService();
}