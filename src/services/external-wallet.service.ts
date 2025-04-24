// src/services/external-wallet.service.ts
import { FilterQuery, Model, UpdateQuery, ClientSession } from 'mongoose';
import ExternalWallet, { IExternalWallet, IWalletTransaction } from '../models/externalWallet';
import { logger } from '../utils/logger';
import { config } from '../config/app-config';
import { z } from 'zod'; // For input validation

// Cache config values for hot paths to avoid repeated lookups
const CACHED_CONFIG = {
  defaultMinWinRate: config.externalWallet.defaultMinWinRate,
  defaultMaxWinRate: config.externalWallet.defaultMaxWinRate,
  defaultRecentActivityHours: config.externalWallet.defaultRecentActivityHours,
  defaultAchieves4xScore: config.externalWallet.defaultAchieves4xScore,
  defaultMinTrades: config.externalWallet.defaultMinTrades,
  default4xLimit: config.externalWallet.default4xLimit,
  defaultTopPerformersLimit: config.externalWallet.defaultTopPerformersLimit,
  highAchieves4xThreshold: config.externalWallet.highAchieves4xThreshold,
  defaultPerPage: config.pagination.defaultPerPage
};

/** Interfaces for typed return values */
export interface PaginationOptions {
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
}

export interface WalletCategoryStats {
  category: string;
  count: number;
  avgWinRate: number;
  totalTrades: number;
  successfulTrades: number;
}

export interface WalletPerformanceStats {
  totalWallets: number;
  activeWallets: number;
  categories: WalletCategoryStats[];
  avgWinRate: number;
  avgReputationScore: number;
  top4xPerformers: number;
}

export interface TimeframePerformance {
  timeframe: 'fast' | 'slow' | 'other';
  tradeCount: number;
  successRate: number;
  avgMultiplier: number;
}

// Validation schemas for inputs
const addressSchema = z.string().trim().min(1, "Address is required");

const transactionSchema = z.object({
  tokenSymbol: z.string().trim().min(1, "Token symbol is required"),
  tokenAddress: z.string().trim().min(1, "Token address is required"),
  buyPrice: z.number().min(0),
  sellPrice: z.number().min(0).optional(),
  buyAmount: z.number().min(0).optional(),
  sellAmount: z.number().min(0).optional(),
  buyTimestamp: z.date(),
  sellTimestamp: z.date().optional().nullable(),
  pnlValue: z.number().optional(),
  pnlPercentage: z.number().optional(),
  transactionValue: z.number().min(0).optional(),
  chain: z.string().default("solana"),
  isSuccessful: z.boolean().default(false),
  transactionHash: z.string().optional(),
  holdTime: z.string().optional(),
  timeframe: z.enum(['fast', 'slow', 'other']).optional()
});

// Schema for wallet update operations
const walletUpdateSchema = z.object({
  category: z.string().min(1).optional(),
  winRate: z.number().min(0).max(100).optional(),
  totalPnL: z.number().optional(),
  successfulTrades: z.number().min(0).optional(),
  totalTrades: z.number().min(0).optional(),
  avgHoldTime: z.string().optional(),
  isActive: z.boolean().optional(),
  reputationScore: z.number().min(0).max(100).optional(),
  returns4xRate: z.number().min(0).max(100).optional(),
  fastTimeframePreference: z.number().min(0).max(100).optional(),
  slowTimeframePreference: z.number().min(0).max(100).optional(),
  exitEfficiencyScore: z.number().min(0).max(100).optional(),
  predictedSuccessRate: z.number().min(0).max(100).optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional(),
  // Prevent modification of critical fields
  address: z.undefined(),
  network: z.undefined(),
  firstSeen: z.undefined(),
  fourXCount: z.undefined(),
  transactions: z.undefined()
}).strict();

const createWalletSchema = z.object({
  address: addressSchema,
  network: z.string().default("solana"),
  category: z.string().min(1, "Category is required"),
  winRate: z.number().min(0).max(100).optional(),
  totalPnL: z.number().optional(),
  successfulTrades: z.number().min(0).optional(),
  totalTrades: z.number().min(0).optional(),
  avgHoldTime: z.string().optional(),
  isActive: z.boolean().optional(),
  reputationScore: z.number().min(0).max(100).optional(),
  transactions: z.array(transactionSchema).optional(),
  returns4xRate: z.number().min(0).max(100).optional(),
  fastTimeframePreference: z.number().min(0).max(100).optional(),
  slowTimeframePreference: z.number().min(0).max(100).optional(),
  exitEfficiencyScore: z.number().min(0).max(100).optional(),
  predictedSuccessRate: z.number().min(0).max(100).optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional()
}).strict(); // Make schema strict to prevent unexpected fields

/** Helper for centralized error logging */
const withErrorLogging = async <T>(
  operation: string,
  context: string,
  fn: () => Promise<T>,
  additionalMetrics?: Record<string, any>
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await fn();
    // Record metrics for successful operations
    const duration = Date.now() - startTime;
    recordMetric(`externalWallet.${operation}.duration`, duration, additionalMetrics);
    recordMetric(`externalWallet.${operation}.success`, 1, additionalMetrics);
    return result;
  } catch (error) {
    // Record metrics for failed operations
    recordMetric(`externalWallet.${operation}.error`, 1, additionalMetrics);
    const duration = Date.now() - startTime;
    recordMetric(`externalWallet.${operation}.duration`, duration, additionalMetrics);
    
    logger.error(`Error in ${operation}${context ? ` (${context})` : ''}`, { error });
    throw error;
  }
};

/** 
 * Metrics recording function - REPLACE WITH ACTUAL IMPLEMENTATION
 * This is a placeholder that should be replaced with your production metrics system
 */
const recordMetric = (name: string, value: number, additionalTags?: Record<string, any>) => {
  // IMPORTANT: Replace this implementation with your actual metrics library before deployment
  
  // Example with Prometheus (using prom-client):
  /*
  if (!metricsRegistry[name]) {
    if (name.includes('duration')) {
      metricsRegistry[name] = new prometheus.Histogram({
        name: name,
        help: `Duration of ${name} operation in ms`,
        buckets: prometheus.exponentialBuckets(10, 2, 10), // 10ms to ~5sec
        labelNames: Object.keys(additionalTags || {})
      });
    } else {
      metricsRegistry[name] = new prometheus.Counter({
        name: name,
        help: `Count of ${name}`,
        labelNames: Object.keys(additionalTags || {})
      });
    }
  }
  
  if (name.includes('duration')) {
    metricsRegistry[name].observe(additionalTags || {}, value);
  } else {
    metricsRegistry[name].inc(additionalTags || {}, value);
  }
  */
  
  // Example with StatsD (using hot-shots):
  /*
  if (name.includes('duration')) {
    statsd.timing(name, value, additionalTags);
  } else {
    statsd.increment(name, value, additionalTags);
  }
  */
  
  // Example with NewRelic:
  /*
  if (name.includes('duration')) {
    newrelic.recordMetric(`Custom/${name}`, value);
  } else {
    newrelic.incrementMetric(`Custom/${name}`, value);
  }
  if (additionalTags) {
    newrelic.addCustomAttributes(additionalTags);
  }
  */
  
  // For development/debugging:
  if (process.env.NODE_ENV === 'development') {
    console.log(`METRIC: ${name} = ${value} ${additionalTags ? JSON.stringify(additionalTags) : ''}`);
  }
};

/**
 * Helper for updating timeframe statistics
 */
const updateTimeframeStats = (
  metadata: any, 
  tx: IWalletTransaction,
  isNewTransaction: boolean
) => {
  if (!tx.timeframe) return;
  
  const timeframeKey = `${tx.timeframe}TimeframeStats`;
  if (!metadata[timeframeKey]) {
    metadata[timeframeKey] = {
      count: 0,
      successRate: 0,
      avgMultiplier: 0
    };
  }
  
  const stats = metadata[timeframeKey];
  
  // Only update the stats if this is a new transaction
  if (isNewTransaction) {
    const prevCount = stats.count;
    stats.count += 1;
    
    if (tx.isSuccessful) {
      // Update success rate for this timeframe
      const prevSuccessful = stats.successRate * prevCount / 100;
      stats.successRate = ((prevSuccessful + 1) / stats.count) * 100;
      
      // Update average multiplier if we have both buy and sell prices
      if (tx.buyPrice > 0 && tx.sellPrice && tx.sellPrice > 0) {
        const multiplier = tx.sellPrice / tx.buyPrice;
        stats.avgMultiplier = ((stats.avgMultiplier * prevCount) + multiplier) / stats.count;
      }
    }
  }
  
  return stats;
};

/**
 * IMPORTANT DATABASE CONSTRAINTS:
 * The following indexes should be added to the ExternalWallet schema:
 * 
 * 1. A unique index on the address field (already added in model)
 * 2. A unique compound index on wallet address and transaction hash:
 *    ExternalWalletSchema.index({ address: 1, 'transactions.transactionHash': 1 }, { unique: true });
 * 3. Consider TTL index for inactive wallets if needed:
 *    ExternalWalletSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // 1 year
 * 
 * These indexes enforce data integrity at the database level and improve query performance.
 */
export class ExternalWalletService {
  private model: Model<IExternalWallet>;

  constructor(model?: Model<IExternalWallet>) {
    this.model = model || ExternalWallet;
  }

  /**
   * Start a MongoDB session for transactions
   */
  async startSession(): Promise<ClientSession> {
    return this.model.db.startSession();
  }

  /** 
   * Apply pagination to a mongoose query and return metadata
   */
  private async applyPagination<T>(
    query: any,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { page = 1, perPage = CACHED_CONFIG.defaultPerPage } = options;
    if (page < 1) throw new Error('Page must be ≥ 1');
    if (perPage < 1) throw new Error('perPage must be ≥ 1');
    
    // Clone the query for count
    const countQuery = this.model.find().merge(query);
    
    // Execute count and data queries in parallel
    const [total, data] = await Promise.all([
      countQuery.countDocuments(),
      query.skip((page - 1) * perPage).limit(perPage)
    ]);
    
    return {
      data,
      page,
      perPage,
      total
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Generic CRUD, bulk, aggregates, pagination
  // ─────────────────────────────────────────────────────────────────────────────

  async findByWinRateRange(
    minRate = CACHED_CONFIG.defaultMinWinRate,
    maxRate = CACHED_CONFIG.defaultMaxWinRate,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<IExternalWallet>> {
    return withErrorLogging(
      'findByWinRateRange',
      `min=${minRate},max=${maxRate}`,
      async () => {
        const q = this.model.find({
          winRate: { $gte: minRate, $lte: maxRate },
          isActive: true
        }).sort({ winRate: -1 });
        return this.applyPagination<IExternalWallet>(q, options);
      },
      { minRate, maxRate }
    );
  }

  async findByCategory(
    category: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<IExternalWallet>> {
    return withErrorLogging(
      'findByCategory',
      `category=${category}`,
      async () => {
        const q = this.model.find({ 
          category,
          isActive: true 
        }).sort({ reputationScore: -1 });
        return this.applyPagination<IExternalWallet>(q, options);
      },
      { category }
    );
  }

  async findRecentlyActive(
    hoursAgo = CACHED_CONFIG.defaultRecentActivityHours,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<IExternalWallet>> {
    return withErrorLogging(
      'findRecentlyActive',
      `hoursAgo=${hoursAgo}`,
      async () => {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hoursAgo);
        const q = this.model.find({
          lastActivity: { $gte: cutoff },
          isActive: true
        }).sort({ lastActivity: -1 });
        return this.applyPagination<IExternalWallet>(q, options);
      },
      { hoursAgo }
    );
  }

  async getByAddress(address: string): Promise<IExternalWallet | null> {
    try {
      // Validate input
      addressSchema.parse(address);
      
      return withErrorLogging(
        'getByAddress',
        `address=${address}`,
        () => this.model.findOne({ address }),
        { address }
      );
    } catch (error) {
      logger.error('Invalid address format', { error, address });
      throw new Error(`Invalid address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateWallet(
    address: string,
    updateData: UpdateQuery<IExternalWallet>
  ): Promise<IExternalWallet | null> {
    try {
      // Validate inputs
      addressSchema.parse(address);
      
      // Validate update data against schema
      // This handles the $set part of the update query
      if (updateData.$set) {
        walletUpdateSchema.parse(updateData.$set);
      }
      
      // If it's a direct update without $set
      if (!updateData.$set && !updateData.$inc && !updateData.$unset) {
        walletUpdateSchema.parse(updateData);
      }
      
      return withErrorLogging(
        'updateWallet',
        `address=${address}`,
        () =>
          this.model.findOneAndUpdate(
            { address },
            { ...updateData, lastUpdated: new Date() },
            { new: true }
          ),
        { address }
      );
    } catch (error) {
      logger.error('Invalid input for updateWallet', { error, address, updateData });
      throw new Error(`Invalid update data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async upsertWallet(
    address: string,
    walletData: Partial<IExternalWallet>
  ): Promise<IExternalWallet | null> {
    try {
      // Validate input
      addressSchema.parse(address);
      
      return withErrorLogging(
        'upsertWallet',
        `address=${address}`,
        () =>
          this.model.findOneAndUpdate(
            { address },
            { 
              ...walletData, 
              address,
              lastUpdated: new Date(),
              $setOnInsert: { firstSeen: new Date() } 
            },
            { new: true, upsert: true }
          ),
        { address }
      );
    } catch (error) {
      logger.error('Invalid input for upsertWallet', { error, address });
      throw new Error(`Invalid input: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByQuery(
    query: FilterQuery<IExternalWallet>,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<IExternalWallet>> {
    return withErrorLogging(
      'findByQuery',
      `query=${JSON.stringify(query)}`,
      async () => {
        const q = this.model.find(query);
        return this.applyPagination<IExternalWallet>(q, options);
      }
    );
  }

  async bulkUpdate(
    query: FilterQuery<IExternalWallet>,
    updateData: UpdateQuery<IExternalWallet>
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
    query: FilterQuery<IExternalWallet>
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

  // ────────────────────────────────────────────────────────────────────────────
  // Domain-specific operations
  // ────────────────────────────────────────────────────────────────────────────

  async createWallet(
    walletData: Partial<IExternalWallet>
  ): Promise<IExternalWallet> {
    try {
      // Validate input
      createWalletSchema.parse(walletData);
      
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
            lastUpdated: now,
            lastActivity: now,
            fourXCount: 0, // Initialize the counter for 4x trades
            transactions: []
          });
          
          await wallet.save();
          logger.info(`Created wallet ${wallet.address}`);
          return wallet;
        },
        { address: walletData.address }
      );
    } catch (error) {
      logger.error('Invalid input for createWallet', { error, data: walletData });
      throw new Error(`Invalid wallet data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addTransaction(
    address: string,
    tx: IWalletTransaction,
    session?: ClientSession
  ): Promise<IExternalWallet | null> {
    try {
      // Validate inputs
      addressSchema.parse(address);
      transactionSchema.parse(tx);
      
      return withErrorLogging(
        'addTransaction',
        `address=${address},token=${tx.tokenSymbol}`,
        async () => {
          // If an external session was provided, use it directly
          if (session) {
            return this._processTransactionWithSession(address, tx, session, true);
          }
          
          // Otherwise use our transaction helper
          return this.executeWithTransaction(async (newSession) => {
            return this._processTransactionWithSession(address, tx, newSession, false);
          });
        },
        { 
          address, 
          tokenSymbol: tx.tokenSymbol, 
          tokenAddress: tx.tokenAddress 
        }
      );
    } catch (error) {
      logger.error('Invalid input for addTransaction', { error, address, transaction: tx });
      throw new Error(`Invalid transaction data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Private helper method to process a transaction with a session
   * Extracted to prevent code duplication between internal and external session handling
   */
  private async _processTransactionWithSession(
    address: string,
    tx: IWalletTransaction,
    session: ClientSession,
    isExternalSession: boolean
  ): Promise<IExternalWallet | null> {
    // Check if this transaction already exists
    let isNewTransaction = true;
    if (tx.transactionHash) {
      const dup = await this.model.findOne({
        address,
        'transactions.transactionHash': tx.transactionHash
      }).session(session);
      
      if (dup) {
        logger.info(`Transaction ${tx.transactionHash} already exists for ${address}`);
        return dup;
      }
    }
    
    // Determine if this is a 4x trade
    let is4xTrade = false;
    if (tx.buyPrice > 0 && tx.sellPrice && tx.sellPrice > 0) {
      is4xTrade = (tx.sellPrice / tx.buyPrice) >= 4;
    }
    
    // Add the transaction using $addToSet to prevent duplicates
    const updateOp: any = {
      $addToSet: { transactions: tx },
      $set: { 
        lastActivity: new Date(),
        lastUpdated: new Date()
      },
      $inc: {
        totalTrades: 1,
        ...(tx.isSuccessful ? { successfulTrades: 1 } : {}),
        totalPnL: tx.pnlValue || 0,
        ...(is4xTrade ? { fourXCount: 1 } : {})
      }
    };
    
    const updated = await this.model.findOneAndUpdate(
      { address },
      updateOp,
      { 
        new: true, 
        session: session,
        // Create a projection that limits the fields returned for performance
        projection: {
          address: 1,
          totalTrades: 1,
          successfulTrades: 1,
          metadata: 1,
          fourXCount: 1,
          winRate: 1
        }
      }
    );
    
    if (!updated) {
      return null;
    }
    
    // Update derived metrics
    if (updated.totalTrades > 0) {
      // Calculate win rate
      updated.winRate = (updated.successfulTrades / updated.totalTrades) * 100;
      
      // Update timeframe stats
      updateTimeframeStats(updated.metadata, tx, isNewTransaction);
      
      // Update the achieves4xScore using the counter
      if (updated.fourXCount !== undefined) {
        updated.metadata.achieves4xScore = (updated.fourXCount / updated.totalTrades) * 100;
      }
      
      // Save the updated wallet
      await updated.save({ session: session });
    }
    
    logger.info(`Added transaction for ${address}: ${tx.tokenSymbol}`);
    return updated;
  }

  /**
   * Build the aggregation pipeline for finding wallets with 4x potential
   * @private
   */
  private build4xPotentialPipeline(options: {
    minAchieves4xScore: number;
    minTrades: number;
    limit: number;
  }): any[] {
    const { minAchieves4xScore, minTrades, limit } = options;
    
    return [
      {
        $match: {
          totalTrades: { $gte: minTrades },
          isActive: true,
          // Ensure the metadata.achieves4xScore field exists
          'metadata.achieves4xScore': { $exists: true }
        }
      },
      {
        $match: {
          'metadata.achieves4xScore': { $gte: minAchieves4xScore }
        }
      },
      {
        $sort: { 
          'metadata.achieves4xScore': -1,
          reputationScore: -1
        }
      },
      {
        $limit: limit
      }
    ];
  }

  async findWalletsWith4xPotential(options: {
    minAchieves4xScore?: number;
    minTrades?: number;
    limit?: number;
  } = {}): Promise<IExternalWallet[]> {
    const {
      minAchieves4xScore = CACHED_CONFIG.defaultAchieves4xScore,
      minTrades = CACHED_CONFIG.defaultMinTrades,
      limit = CACHED_CONFIG.default4xLimit
    } = options;
    
    return withErrorLogging(
      'findWalletsWith4xPotential',
      '',
      async () => {
        // Using aggregation pipeline to calculate 4x score dynamically
        const pipeline = this.build4xPotentialPipeline({
          minAchieves4xScore,
          minTrades,
          limit
        });
        
        return this.model.aggregate(pipeline);
      },
      { minAchieves4xScore, minTrades, limit }
    );
  }

  async findTopPerformersByCategory(options: {
    category?: string;
    minWinRate?: number;
    minTrades?: number;
    limit?: number;
  } = {}): Promise<IExternalWallet[]> {
    const {
      category,
      minWinRate = CACHED_CONFIG.defaultMinWinRate,
      minTrades = CACHED_CONFIG.defaultMinTrades,
      limit = CACHED_CONFIG.defaultTopPerformersLimit
    } = options;
    
    return withErrorLogging(
      'findTopPerformersByCategory',
      '',
      async () => {
        const query: FilterQuery<IExternalWallet> = {
          winRate: { $gte: minWinRate },
          totalTrades: { $gte: minTrades },
          isActive: true
        };
        
        if (category) {
          query.category = category;
        }
        
        return this.model.find(query)
          .sort({ winRate: -1, reputationScore: -1 })
          .limit(limit);
      },
      { category, minWinRate, minTrades, limit }
    );
  }

  async getTimeframePerformance(address: string): Promise<TimeframePerformance[]> {
    try {
      // Validate input
      addressSchema.parse(address);
      
      return withErrorLogging(
        'getTimeframePerformance',
        `address=${address}`,
        async () => {
          // Use lean() to get plain objects for better performance
          const wallet = await this.model.findOne({ address }).lean();
          if (!wallet) throw new Error(`Wallet ${address} not found`);
          
          const performance: TimeframePerformance[] = [];
          
          // Process fast timeframe stats
          if (wallet.metadata?.fastTimeframeStats) {
            performance.push({
              timeframe: 'fast',
              tradeCount: wallet.metadata.fastTimeframeStats.count,
              successRate: wallet.metadata.fastTimeframeStats.successRate,
              avgMultiplier: wallet.metadata.fastTimeframeStats.avgMultiplier
            });
          }
          
          // Process slow timeframe stats
          if (wallet.metadata?.slowTimeframeStats) {
            performance.push({
              timeframe: 'slow',
              tradeCount: wallet.metadata.slowTimeframeStats.count,
              successRate: wallet.metadata.slowTimeframeStats.successRate,
              avgMultiplier: wallet.metadata.slowTimeframeStats.avgMultiplier
            });
          }
          
          // For other timeframe stats, use aggregation if possible
          // This is more efficient than filtering in memory
          const otherStats = await this.model.aggregate([
            { $match: { address } },
            { $unwind: "$transactions" },
            { 
              $match: { 
                $or: [
                  { "transactions.timeframe": { $exists: false } },
                  { "transactions.timeframe": "other" }
                ]
              } 
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                successful: {
                  $sum: { $cond: [{ $eq: ["$transactions.isSuccessful", true] }, 1, 0] }
                },
                totalMultiplier: {
                  $sum: {
                    $cond: [
                      { 
                        $and: [
                          { $gt: ["$transactions.buyPrice", 0] },
                          { $gt: ["$transactions.sellPrice", 0] }
                        ]
                      },
                      { $divide: ["$transactions.sellPrice", "$transactions.buyPrice"] },
                      0
                    ]
                  }
                },
                validMultipliers: {
                  $sum: {
                    $cond: [
                      { 
                        $and: [
                          { $gt: ["$transactions.buyPrice", 0] },
                          { $gt: ["$transactions.sellPrice", 0] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]);
          
          if (otherStats.length > 0 && otherStats[0].count > 0) {
            performance.push({
              timeframe: 'other',
              tradeCount: otherStats[0].count,
              successRate: (otherStats[0].successful / otherStats[0].count) * 100,
              avgMultiplier: otherStats[0].validMultipliers > 0
                ? otherStats[0].totalMultiplier / otherStats[0].validMultipliers
                : 0
            });
          }
          
          return performance;
        },
        { address }
      );
    } catch (error) {
      logger.error('Invalid input for getTimeframePerformance', { error, address });
      throw new Error(`Invalid address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deactivateWallet(address: string): Promise<IExternalWallet | null> {
    try {
      // Validate input
      addressSchema.parse(address);
      
      return withErrorLogging(
        'deactivateWallet',
        `address=${address}`,
        () =>
          this.model.findOneAndUpdate(
            { address },
            { isActive: false, lastUpdated: new Date() },
            { new: true }
          ),
        { address }
      );
    } catch (error) {
      logger.error('Invalid input for deactivateWallet', { error, address });
      throw new Error(`Invalid address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getWalletStats(): Promise<WalletPerformanceStats> {
    return withErrorLogging(
      'getWalletStats',
      '',
      async () => {
        // Use Promise.all to run all queries in parallel for better performance
        const [
          totalWallets,
          activeWallets,
          categoryStats,
          avgStats,
          top4xPerformers
        ] = await Promise.all([
          this.model.countDocuments(),
          this.model.countDocuments({ isActive: true }),
          
          this.model.aggregate([
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalWinRate: { $sum: '$winRate' },
                totalTrades: { $sum: '$totalTrades' },
                successfulTrades: { $sum: '$successfulTrades' }
              }
            }
          ]),
          
          this.model.aggregate([
            {
              $group: {
                _id: null,
                avgWinRate: { $avg: '$winRate' },
                avgReputationScore: { $avg: '$reputationScore' }
              }
            }
          ]),
          
          this.model.countDocuments({
            'metadata.achieves4xScore': { $gte: CACHED_CONFIG.highAchieves4xThreshold }
          })
        ]);
        
        return {
          totalWallets,
          activeWallets,
          categories: categoryStats.map(c => ({
            category: c._id,
            count: c.count,
            avgWinRate: c.totalWinRate / c.count,
            totalTrades: c.totalTrades,
            successfulTrades: c.successfulTrades
          })),
          avgWinRate: avgStats[0]?.avgWinRate ?? 0,
          avgReputationScore: avgStats[0]?.avgReputationScore ?? 0,
          top4xPerformers
        };
      }
    );
  }

  // Additional utility method for multi-collection operations with transactions
  async executeWithTransaction<T>(
    operationFn: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await this.startSession();
    
    try {
      session.startTransaction();
      const result = await operationFn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }
}

// Create a singleton instance for common use
export const externalWalletService = new ExternalWalletService();

/**
 * TESTING GUIDELINES
 * 
 * Here are examples of unit and integration tests that should be implemented:
 * 
 * 1. Unit Tests (with mocked MongoDB):
 * 
 * ```typescript
 * describe('ExternalWalletService', () => {
 *   let service: ExternalWalletService;
 *   let mockModel: any;
 *   
 *   beforeEach(() => {
 *     // Setup mock model
 *     mockModel = {
 *       find: jest.fn().mockReturnThis(),
 *       findOne: jest.fn(),
 *       findOneAndUpdate: jest.fn(),
 *       aggregate: jest.fn(),
 *       updateMany: jest.fn(),
 *       deleteMany: jest.fn(),
 *       save: jest.fn(),
 *       sort: jest.fn().mockReturnThis(),
 *       skip: jest.fn().mockReturnThis(),
 *       limit: jest.fn().mockReturnThis(),
 *       lean: jest.fn().mockReturnThis(),
 *       countDocuments: jest.fn(),
 *       session: jest.fn().mockReturnThis(),
 *       startSession: jest.fn().mockResolvedValue({
 *         startTransaction: jest.fn(),
 *         commitTransaction: jest.fn(),
 *         abortTransaction: jest.fn(),
 *         endSession: jest.fn(),
 *         inTransaction: jest.fn().mockReturnValue(true)
 *       }),
 *       db: {
 *         startSession: jest.fn().mockResolvedValue({
 *           startTransaction: jest.fn(),
 *           commitTransaction: jest.fn(),
 *           abortTransaction: jest.fn(),
 *           endSession: jest.fn(),
 *           inTransaction: jest.fn().mockReturnValue(true)
 *         })
 *       }
 *     };
 *     
 *     service = new ExternalWalletService(mockModel as any);
 *   });
 *   
 *   // Test validation errors
 *   test('should reject invalid address', async () => {
 *     await expect(service.getByAddress('')).rejects.toThrow();
 *     expect(mockModel.findOne).not.toHaveBeenCalled();
 *   });
 *   
 *   // Test addTransaction with transaction handling
 *   test('should use transaction for addTransaction', async () => {
 *     // Setup mock session
 *     const mockSession = {
 *       startTransaction: jest.fn(),
 *       commitTransaction: jest.fn(),
 *       abortTransaction: jest.fn(),
 *       endSession: jest.fn(),
 *       inTransaction: jest.fn().mockReturnValue(true)
 *     };
 *     mockModel.db.startSession.mockResolvedValue(mockSession);
 *     
 *     // Setup mock wallet
 *     const mockWallet = {
 *       address: 'test-address',
 *       totalTrades: 10,
 *       successfulTrades: 7,
 *       metadata: {},
 *       fourXCount: 3,
 *       winRate: 70,
 *       save: jest.fn().mockResolvedValue(true)
 *     };
 *     mockModel.findOneAndUpdate.mockResolvedValue(mockWallet);
 *     
 *     // Setup test transaction
 *     const tx = {
 *       tokenSymbol: 'TEST',
 *       tokenAddress: 'test-token-address',
 *       buyPrice: 1,
 *       sellPrice: 5, // 5x return
 *       buyTimestamp: new Date(),
 *       transactionHash: 'test-hash',
 *       isSuccessful: true
 *     };
 *     
 *     // Call the method
 *     await service.addTransaction('test-address', tx);
 *     
 *     // Verify transaction handling
 *     expect(mockSession.startTransaction).toHaveBeenCalled();
 *     expect(mockSession.commitTransaction).toHaveBeenCalled();
 *     expect(mockSession.endSession).toHaveBeenCalled();
 *     
 *     // Verify wallet update
 *     expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
 *       { address: 'test-address' },
 *       expect.objectContaining({
 *         $addToSet: { transactions: tx },
 *         $inc: expect.objectContaining({
 *           totalTrades: 1,
 *           successfulTrades: 1,
 *           fourXCount: 1
 *         })
 *       }),
 *       expect.anything()
 *     );
 *     
 *     // Verify save was called for derived metrics
 *     expect(mockWallet.save).toHaveBeenCalledWith({ session: mockSession });
 *   });
 *   
 *   // Test pagination with counts
 *   test('findByCategory should return paginated results with total count', async () => {
 *     // Setup mocks
 *     const mockWallets = [{ address: 'wallet1' }, { address: 'wallet2' }];
 *     mockModel.limit.mockResolvedValue(mockWallets);
 *     mockModel.countDocuments.mockResolvedValue(10);
 *     
 *     // Call the method
 *     const result = await service.findByCategory('Sniper', { page: 2, perPage: 2 });
 *     
 *     // Verify pagination was applied
 *     expect(mockModel.find).toHaveBeenCalledWith({ 
 *       category: 'Sniper', 
 *       isActive: true 
 *     });
 *     expect(mockModel.sort).toHaveBeenCalledWith({ reputationScore: -1 });
 *     expect(mockModel.skip).toHaveBeenCalledWith(2);
 *     expect(mockModel.limit).toHaveBeenCalledWith(2);
 *     
 *     // Verify count was called
 *     expect(mockModel.countDocuments).toHaveBeenCalled();
 *     
 *     // Verify result structure
 *     expect(result).toEqual({
 *       data: mockWallets,
 *       page: 2,
 *       perPage: 2,
 *       total: 10
 *     });
 *   });
 *   
 *   // Test 4x potential aggregation
 *   test('findWalletsWith4xPotential should use correct aggregation pipeline', async () => {
 *     // Setup mock
 *     const mockResult = [{ address: 'wallet1' }];
 *     mockModel.aggregate.mockResolvedValue(mockResult);
 *     
 *     // Call the method
 *     const result = await service.findWalletsWith4xPotential({
 *       minAchieves4xScore: 50,
 *       minTrades: 10,
 *       limit: 5
 *     });
 *     
 *     // Verify aggregation pipeline
 *     expect(mockModel.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
 *       expect.objectContaining({
 *         $match: expect.objectContaining({
 *           totalTrades: { $gte: 10 },
 *           isActive: true
 *         })
 *       }),
 *       expect.objectContaining({
 *         $match: expect.objectContaining({
 *           'metadata.achieves4xScore': { $gte: 50 }
 *         })
 *       }),
 *       expect.objectContaining({ $sort: expect.any(Object) }),
 *       expect.objectContaining({ $limit: 5 })
 *     ]));
 *     
 *     // Verify result
 *     expect(result).toEqual(mockResult);
 *   });
 * });
 * ```
 * 
 * 2. Integration Tests (with MongoDB Memory Server):
 * 
 * ```typescript
 * import { MongoMemoryServer } from 'mongodb-memory-server';
 * import mongoose from 'mongoose';
 * import { ExternalWalletService } from '../external-wallet.service';
 * import ExternalWallet from '../../models/externalWallet';
 * 
 * describe('ExternalWalletService Integration', () => {
 *   let mongoServer: MongoMemoryServer;
 *   let service: ExternalWalletService;
 *   
 *   beforeAll(async () => {
 *     // Setup in-memory MongoDB instance
 *     mongoServer = await MongoMemoryServer.create();
 *     const uri = mongoServer.getUri();
 *     await mongoose.connect(uri);
 *     
 *     // Create service instance with real model
 *     service = new ExternalWalletService();
 *   });
 *   
 *   afterAll(async () => {
 *     await mongoose.disconnect();
 *     await mongoServer.stop();
 *   });
 *   
 *   beforeEach(async () => {
 *     // Clear the collection before each test
 *     await ExternalWallet.deleteMany({});
 *   });
 *   
 *   test('should create wallet and add transactions', async () => {
 *     // Create a wallet
 *     const wallet = await service.createWallet({
 *       address: 'test-wallet',
 *       network: 'solana',
 *       category: 'Sniper'
 *     });
 *     
 *     expect(wallet.address).toBe('test-wallet');
 *     expect(wallet.totalTrades).toBe(0);
 *     
 *     // Add a successful transaction
 *     const tx1 = {
 *       tokenSymbol: 'TEST',
 *       tokenAddress: 'test-token',
 *       buyPrice: 1.0,
 *       sellPrice: 2.0,
 *       buyTimestamp: new Date(),
 *       buyAmount: 100,
 *       sellAmount: 200,
 *       pnlValue: 100,
 *       pnlPercentage: 100,
 *       transactionValue: 100,
 *       chain: 'solana',
 *       isSuccessful: true,
 *       transactionHash: 'tx1',
 *       timeframe: 'fast'
 *     };
 *     
 *     const updated = await service.addTransaction('test-wallet', tx1);
 *     
 *     // Verify wallet metrics updated
 *     expect(updated?.totalTrades).toBe(1);
 *     expect(updated?.successfulTrades).toBe(1);
 *     expect(updated?.winRate).toBe(100);
 *     
 *     // Add a 4x transaction
 *     const tx2 = {
 *       ...tx1,
 *       tokenSymbol: 'FOUR',
 *       buyPrice: 1.0,
 *       sellPrice: 5.0, // 5x return
 *       transactionHash: 'tx2'
 *     };
 *     
 *     const updated2 = await service.addTransaction('test-wallet', tx2);
 *     
 *     // Verify 4x counter and score
 *     expect(updated2?.totalTrades).toBe(2);
 *     expect(updated2?.fourXCount).toBe(1);
 *     expect(updated2?.metadata.achieves4xScore).toBe(50); // 1 out of 2 = 50%
 *     
 *     // Try to add a duplicate transaction
 *     const updated3 = await service.addTransaction('test-wallet', tx2);
 *     
 *     // Verify no changes due to duplicate
 *     expect(updated3?.totalTrades).toBe(2); // Still 2, not 3
 *     
 *     // Test transaction validation
 *     await expect(service.addTransaction('test-wallet', { 
 *       tokenSymbol: '',  // Invalid empty symbol
 *       tokenAddress: 'test',
 *       buyTimestamp: new Date() 
 *     } as any)).rejects.toThrow();
 *     
 *     // Test findWalletsWith4xPotential
 *     const walletsWith4x = await service.findWalletsWith4xPotential({
 *       minAchieves4xScore: 40,
 *       minTrades: 1
 *     });
 *     
 *     expect(walletsWith4x.length).toBe(1);
 *     expect(walletsWith4x[0].address).toBe('test-wallet');
 *   });
 *   
 *   test('should handle pagination correctly', async () => {
 *     // Create 5 wallets
 *     const wallets = [];
 *     for (let i = 0; i < 5; i++) {
 *       wallets.push(await service.createWallet({
 *         address: `wallet-${i}`,
 *         category: 'Sniper',
 *         network: 'solana'
 *       }));
 *     }
 *     
 *     // Test first page
 *     const page1 = await service.findByCategory('Sniper', { page: 1, perPage: 2 });
 *     expect(page1.data.length).toBe(2);
 *     expect(page1.total).toBe(5);
 *     expect(page1.page).toBe(1);
 *     
 *     // Test second page
 *     const page2 = await service.findByCategory('Sniper', { page: 2, perPage: 2 });
 *     expect(page2.data.length).toBe(2);
 *     expect(page2.total).toBe(5);
 *     expect(page2.page).toBe(2);
 *     
 *     // Test last page
 *     const page3 = await service.findByCategory('Sniper', { page: 3, perPage: 2 });
 *     expect(page3.data.length).toBe(1); // Only 1 item on the last page
 *     expect(page3.total).toBe(5);
 *     expect(page3.page).toBe(3);
 *   });
 * });
 * ```
 * 
 * These tests cover critical functionality including:
 * 1. Input validation
 * 2. Transaction handling
 * 3. Pagination with total counts
 * 4. 4x trade detection and metrics
 * 5. Duplicate transaction handling
 * 6. Aggregation pipeline correctness
 */