// src/services/token-tracking-data.service.ts
import { FilterQuery, Model, UpdateQuery, ClientSession, PipelineStage } from 'mongoose';
import axios from 'axios';
import CircuitBreaker from 'opossum';
import { z } from 'zod';
import TokenTrackingData, { ITokenTrackingData } from '../models/tokenTrackingData';
import { logger } from '../utils/logger';
import { config } from '../config/app-config';
import { StatsD } from 'hot-shots';

// --- Metrics client (StatsD) ---------------------------------------------
const statsd = new StatsD({ host: config.metrics.host, port: config.metrics.port });

// --- Cached config ------------------------------------------------------
const CACHED_CONFIG = {
  defaultMinPredictedSuccessRate: config.tokenTracking.defaultMinPredictedSuccessRate,
  defaultMinLiquidity:           config.tokenTracking.defaultMinLiquidity,
  defaultMaxManipulationScore:    config.tokenTracking.defaultMaxManipulationScore,
  defaultPerPage:                 config.pagination.defaultPerPage,
  default4xCandidateLimit:        config.tokenTracking.default4xCandidateLimit
};

// --- Interfaces ----------------------------------------------------------
export interface PaginationOptions { page?: number; perPage?: number; }
export interface PaginatedResult<T> { data: T[]; page: number; perPage: number; total: number; }
export interface TokenStats {
  totalTokens: number;
  active24h: number;
  newLast7d: number;
  has4xCandidates: number;
  avgPredictedSuccessRate: number;
  manipulationDistribution: { low: number; medium: number; high: number };
  withFastPatterns: number;
  withSlowPatterns: number;
}
export interface TokenPriceUpdate {
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  holderCount?: number;
  timestamp: Date;
}
export interface SmartMoneyUpdate {
  totalWallets: number;
  sniperWallets?: number;
  gemSpotterWallets?: number;
  earlyMoverWallets?: number;
  buyToSellRatio: number;
  is4xCandidate?: boolean;
  predictedSuccessRate?: number;
}
export interface PatternUpdate {
  patternType: string;
  confidence: number;
  timeframe: 'fast' | 'slow';
}
export interface IdealFourXCandidate {
  _id: string;
  address: string;
  symbol: string;
  name: string;
  network: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  manipulationScore: number;
  smartMoneyActivity: {
    totalWallets: number;
    predictedSuccessRate: number;
    is4xCandidate: boolean;
    buyToSellRatio: number;
  };
  patterns: {
    fast?: { hasPattern: boolean; patternType: string; confidence: number };
    slow?: { hasPattern: boolean; patternType: string; confidence: number };
  };
  hasAnyPattern: boolean;
}
interface TokenStatsAggregationResult { _id: string; count: number; avgRate?: number; }

// --- Zod schemas ---------------------------------------------------------
const addressSchema = z.string().trim().min(1, "Token address is required");
const tokenPriceUpdateSchema = z.object({
  price: z.number().min(0),
  priceChange24h: z.number(),
  volume24h: z.number().min(0),
  liquidity: z.number().min(0),
  marketCap: z.number().min(0),
  holderCount: z.number().min(0).optional(),
  timestamp: z.date().default(() => new Date())
});
const smartMoneyUpdateSchema = z.object({
  totalWallets: z.number().min(0),
  sniperWallets: z.number().min(0).optional(),
  gemSpotterWallets: z.number().min(0).optional(),
  earlyMoverWallets: z.number().min(0).optional(),
  buyToSellRatio: z.number().min(0),
  is4xCandidate: z.boolean().optional(),
  predictedSuccessRate: z.number().min(0).max(100).optional()
});
const patternUpdateSchema = z.object({
  patternType: z.string().min(1),
  confidence: z.number().min(0).max(100),
  timeframe: z.enum(['fast','slow'])
});
const createTokenSchema = z.object({
  address: addressSchema,
  network: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0).default(0),
  totalSupply: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
}).strict();

// --- Metrics helper ------------------------------------------------------
function recordMetric(name: string, value: number, tags?: Record<string, any>) {
  if (name.endsWith('.duration')) {
    statsd.timing(name, value, tags);
  } else {
    statsd.increment(name, value, tags);
  }
}

async function withErrorLogging<T>(
  operation: string,
  context: string,
  fn: () => Promise<T>,
  metricsTags?: Record<string, any>
): Promise<T> {
  const start = Date.now();
  try {
    const res = await fn();
    recordMetric(`tokenTracking.${operation}.success`, 1, metricsTags);
    recordMetric(`tokenTracking.${operation}.duration`, Date.now() - start, metricsTags);
    return res;
  } catch (err: any) {
    recordMetric(`tokenTracking.${operation}.error`, 1, metricsTags);
    recordMetric(`tokenTracking.${operation}.duration`, Date.now() - start, metricsTags);
    logger.error(`Error in ${operation}${context?` (${context})`:''}`, { error: err });
    throw err;
  }
}

// --- Service -------------------------------------------------------------
export class TokenTrackingDataService {
  private model: Model<ITokenTrackingData>;
  private priceCB: CircuitBreaker<[string], TokenPriceUpdate>;
  private patternCB: CircuitBreaker<[string], PatternUpdate[]>;
  private smartMoneyCB: CircuitBreaker<[string], SmartMoneyUpdate>;

  constructor(model?: Model<ITokenTrackingData>) {
    this.model = model || TokenTrackingData;

    this.priceCB = new CircuitBreaker(this.fetchExternalPriceData.bind(this), {
      timeout: 10_000, errorThresholdPercentage: 50, resetTimeout: 30_000
    });
    this.patternCB = new CircuitBreaker(this.fetchPatternDetection.bind(this), {
      timeout: 15_000, errorThresholdPercentage: 50, resetTimeout: 60_000
    });
    this.smartMoneyCB = new CircuitBreaker(this.fetchSmartMoneyData.bind(this), {
      timeout: 10_000, errorThresholdPercentage: 50, resetTimeout: 30_000
    });
    this.setupCircuitBreakerListeners();
  }

  /** Create a token with upsert/duplicate-key handling */
  async createToken(data: Partial<ITokenTrackingData>): Promise<ITokenTrackingData> {
    createTokenSchema.parse(data);
    return withErrorLogging(
      'createToken',
      `address=${data.address},symbol=${data.symbol}`,
      async () => {
        const now = new Date();
        const doc = new this.model({
          ...data,
          firstSeen: now,
          lastUpdated: now,
          hasAnyPattern: false,
          smartMoneyActivity: {
            totalWallets: 0,
            sniperWallets: 0,
            gemSpotterWallets: 0,
            earlyMoverWallets: 0,
            buyToSellRatio: 0,
            latestActivity: now,
            is4xCandidate: false,
            predictedSuccessRate: 0
          },
          patterns: {
            fast: { hasPattern: false, patternType: '', confidence: 0, detected: now },
            slow: { hasPattern: false, patternType: '', confidence: 0, detected: now }
          }
        });
        try {
          await doc.save();
          return doc.toObject();
        } catch (err: any) {
          // Duplicate address
          if (err.code === 11000) {
            if (err.message.includes('address_1')) {
              throw new Error(`Token with address ${data.address} already exists`);
            }
            // symbol+network compound key must be defined in model
            throw new Error(`Token with symbol ${data.symbol} already exists on ${data.network}`);
          }
          throw err;
        }
      },
      { address: data.address, symbol: data.symbol, network: data.network }
    );
  }

  /** Add defined fields to $set (relative mappings) */
  private addOptionalFieldsToSetUpdate(
    op: UpdateQuery<ITokenTrackingData>,
    src: Record<string, any>,
    mapping: Record<string,string>,
    parentPath: string = ''
  ) {
    op.$set = op.$set || {};
    for (const [srcKey, relFld] of Object.entries(mapping)) {
      if (src[srcKey] !== undefined) {
        const path = parentPath ? `${parentPath}.${relFld}` : relFld;
        op.$set[path] = src[srcKey];
      }
    }
  }

  /** Build price update op */
  private buildPriceUpdateOperation(priceUpd: TokenPriceUpdate): UpdateQuery<ITokenTrackingData> {
    const op: UpdateQuery<ITokenTrackingData> = { $set: {} };
    this.addOptionalFieldsToSetUpdate(
      op, priceUpd,
      {
        price: 'price',
        priceChange24h: 'priceChange24h',
        volume24h: 'volume24h',
        liquidity: 'liquidity',
        marketCap: 'marketCap',
        holderCount: 'holderCount'
      }
    );
    // lastUpdated from timestamp
    op.$set!['lastUpdated'] = priceUpd.timestamp;
    return op;
  }

  /** Update price data */
  async updatePriceData(
    address: string,
    priceUpdate: TokenPriceUpdate,
    session?: ClientSession
  ): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    tokenPriceUpdateSchema.parse(priceUpdate);
    return withErrorLogging(
      'updatePriceData',
      `address=${address}`,
      () => {
        const op = this.buildPriceUpdateOperation(priceUpdate);
        return this.updateToken(address, op, session);
      },
      { address }
    );
  }

  /** Update smart-money activity */
  async updateSmartMoneyActivity(
    address: string,
    smUpd: SmartMoneyUpdate,
    session?: ClientSession
  ): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    smartMoneyUpdateSchema.parse(smUpd);
    return withErrorLogging(
      'updateSmartMoneyActivity',
      `address=${address}`,
      () => {
        const now = new Date();
        const op: UpdateQuery<ITokenTrackingData> = { $set: {} };
        this.addOptionalFieldsToSetUpdate(
          op, smUpd,
          {
            totalWallets: 'totalWallets',
            buyToSellRatio: 'buyToSellRatio',
            sniperWallets: 'sniperWallets',
            gemSpotterWallets: 'gemSpotterWallets',
            earlyMoverWallets: 'earlyMoverWallets',
            is4xCandidate: 'is4xCandidate',
            predictedSuccessRate: 'predictedSuccessRate'
          },
          'smartMoneyActivity'
        );
        op.$set!['smartMoneyActivity.latestActivity'] = now;
        op.$set!['lastUpdated'] = now;
        return this.updateToken(address, op, session);
      },
      { address }
    );
  }

  /** Update pattern detection atomically */
  async updatePatternDetection(
    address: string,
    upd: PatternUpdate
  ): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    patternUpdateSchema.parse(upd);
    return withErrorLogging(
      'updatePatternDetection',
      `address=${address},timeframe=${upd.timeframe}`,
      () => this.executeWithTransaction(session => {
        const now = new Date();
        const op: UpdateQuery<ITokenTrackingData> = { $set: {} };
        op.$set![`patterns.${upd.timeframe}.hasPattern`]  = true;
        op.$set![`patterns.${upd.timeframe}.patternType`] = upd.patternType;
        op.$set![`patterns.${upd.timeframe}.confidence`]  = upd.confidence;
        op.$set![`patterns.${upd.timeframe}.detected`]    = now;
        op.$set!['hasAnyPattern'] = true;
        op.$set!['lastUpdated'] = now;
        return this.updateToken(address, op, session);
      }),
      { address }
    );
  }

  /** Update manipulation score */
  async updateManipulationScore(
    address: string,
    score: number,
    session?: ClientSession
  ): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    if (score < 0 || score > 100) throw new Error('Manipulation score must be 0–100');
    return withErrorLogging(
      'updateManipulationScore',
      `address=${address},score=${score}`,
      () => {
        const op: UpdateQuery<ITokenTrackingData> = {
          $set: { manipulationScore: score, lastUpdated: new Date() }
        };
        return this.updateToken(address, op, session);
      },
      { address }
    );
  }

  /** Find ideal 4x candidates via aggregation pipeline */
  async findIdeal4xCandidates(options: {
    minSmartWallets?: number;
    minPredictedSuccessRate?: number;
    minLiquidity?: number;
    maxManipulationScore?: number;
    hasPatterns?: boolean;
    limit?: number;
  } = {}): Promise<IdealFourXCandidate[]> {
    const {
      minSmartWallets = 3,
      minPredictedSuccessRate = CACHED_CONFIG.defaultMinPredictedSuccessRate,
      minLiquidity = CACHED_CONFIG.defaultMinLiquidity,
      maxManipulationScore = CACHED_CONFIG.defaultMaxManipulationScore,
      hasPatterns = false,
      limit = CACHED_CONFIG.default4xCandidateLimit
    } = options;
    return withErrorLogging(
      'findIdeal4xCandidates',
      '',
      () => {
        const pipeline = this.buildIdeal4xCandidatesPipeline({
          minSmartWallets,
          minPredictedSuccessRate,
          minLiquidity,
          maxManipulationScore,
          hasPatterns,
          limit
        });
        return this.model.aggregate<IdealFourXCandidate>(pipeline);
      },
      options
    );
  }

  private buildIdeal4xCandidatesPipeline(opts: {
    minSmartWallets: number;
    minPredictedSuccessRate: number;
    minLiquidity: number;
    maxManipulationScore: number;
    hasPatterns: boolean;
    limit: number;
  }): PipelineStage[] {
    const { minSmartWallets, minPredictedSuccessRate, minLiquidity, maxManipulationScore, hasPatterns, limit } = opts;
    const pipeline: PipelineStage[] = [
      { $match: {
          'smartMoneyActivity.is4xCandidate': true,
          'smartMoneyActivity.totalWallets': { $gte: minSmartWallets },
          'smartMoneyActivity.predictedSuccessRate': { $gte: minPredictedSuccessRate },
          liquidity: { $gte: minLiquidity },
          manipulationScore: { $lte: maxManipulationScore }
      }},
    ];
    if (hasPatterns) pipeline.push({ $match: { hasAnyPattern: true } });
    pipeline.push(
      { $project: {
          address:1, symbol:1, name:1, network:1,
          price:1, priceChange24h:1, volume24h:1, liquidity:1, marketCap:1,
          manipulationScore:1,
          smartMoneyActivity:{ totalWallets:1, predictedSuccessRate:1, is4xCandidate:1, buyToSellRatio:1 },
          patterns:1, hasAnyPattern:1
      }},
      { $sort: { 'smartMoneyActivity.predictedSuccessRate': -1, liquidity: -1 } },
      { $limit: limit }
    );
    return pipeline;
  }

  /** Get overall token stats */
  async getTokenStats(): Promise<TokenStats> {
    return withErrorLogging(
      'getTokenStats',
      '',
      async () => {
        const [
          totalTokens,
          active24h,
          newLast7d,
          has4xCandidates,
          avgPredRateArr,
          manipDistArr,
          fastPatterns,
          slowPatterns
        ] = await Promise.all([
          this.model.countDocuments().lean(),
          this.model.countDocuments({ lastUpdated: { $gte: new Date(Date.now()-24*3600*1000) } }).lean(),
          this.model.countDocuments({ firstSeen:   { $gte: new Date(Date.now()-7*24*3600*1000) } }).lean(),
          this.model.countDocuments({ 'smartMoneyActivity.is4xCandidate': true }).lean(),
          this.model.aggregate<TokenStatsAggregationResult>([
            { $match:{ 'smartMoneyActivity.is4xCandidate': true } },
            { $group:{ _id:null, avgRate:{ $avg:'$smartMoneyActivity.predictedSuccessRate' } } }
          ]),
          this.model.aggregate<TokenStatsAggregationResult>([
            { $group:{
                _id:{
                  $cond:[
                    { $lte:['$manipulationScore',33] }, 'low',
                    { $cond:[ { $lte:['$manipulationScore',66] }, 'medium','high' ] }
                  ]
                },
                count:{ $sum:1 }
            }}
          ]),
          this.model.countDocuments({ 'patterns.fast.hasPattern': true }).lean(),
          this.model.countDocuments({ 'patterns.slow.hasPattern': true }).lean()
        ]);
        const manipDist = { low:0, medium:0, high:0 };
        manipDistArr.forEach(i=>{ manipDist[i._id as keyof typeof manipDist] = i.count; });
        return {
          totalTokens,
          active24h,
          newLast7d,
          has4xCandidates,
          avgPredictedSuccessRate: avgPredRateArr[0]?.avgRate || 0,
          manipulationDistribution: manipDist,
          withFastPatterns: fastPatterns,
          withSlowPatterns: slowPatterns
        };
      }
    );
  }

  /** ------------------------------------------------------------
   *  Generic CRUD, pagination, tags, metadata, whale, holder
   * -------------------------------------------------------------*/
  async findByTag(tag: string, opts: PaginationOptions = {}): Promise<PaginatedResult<ITokenTrackingData>> {
    return withErrorLogging('findByTag', `tag=${tag}`, () => {
      const q = this.model.find({ tags: tag }).select(this.getBasicProjection()).sort({ liquidity: -1 }).lean();
      return this.applyPagination(q, opts);
    }, { tag });
  }

  async addTag(address: string, tag: string, session?: ClientSession): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    if (!tag.trim()) throw new Error('Tag cannot be empty');
    return withErrorLogging('addTag', `address=${address},tag=${tag}`, () => {
      return this.updateToken(address, { $addToSet: { tags: tag } }, session);
    }, { address, tag });
  }

  async removeTag(address: string, tag: string, session?: ClientSession): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    if (!tag.trim()) throw new Error('Tag cannot be empty');
    return withErrorLogging('removeTag', `address=${address},tag=${tag}`, () => {
      return this.updateToken(address, { $pull: { tags: tag } }, session);
    }, { address, tag });
  }

  async bulkAddTags(query: FilterQuery<ITokenTrackingData>, tags: string[]): Promise<{ matchedCount:number; modifiedCount:number }> {
    z.object({ query: z.record(z.any()), tags: z.array(z.string()).min(1) }).parse({ query, tags });
    return withErrorLogging('bulkAddTags', `tags=${tags}`, async () => {
      const res = await this.model.updateMany(query, { $addToSet: { tags: { $each: tags } } });
      return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
    }, { tagCount: tags.length });
  }

  async bulkRemoveTags(query: FilterQuery<ITokenTrackingData>, tags: string[]): Promise<{ matchedCount:number; modifiedCount:number }> {
    z.object({ query: z.record(z.any()), tags: z.array(z.string()).min(1) }).parse({ query, tags });
    return withErrorLogging('bulkRemoveTags', `tags=${tags}`, async () => {
      const res = await this.model.updateMany(query, { $pull: { tags: { $in: tags } } });
      return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
    }, { tagCount: tags.length });
  }

  async findByMetadata(metadataQuery: Record<string, any>, opts: PaginationOptions = {}): Promise<PaginatedResult<ITokenTrackingData>> {
    return withErrorLogging('findByMetadata', '', () => {
      const qf: FilterQuery<ITokenTrackingData> = {};
      for (const [k,v] of Object.entries(metadataQuery)) qf[`metadata.${k}`] = v;
      const q = this.model.find(qf).select(this.getBasicProjection()).sort({ lastUpdated:-1 }).lean();
      return this.applyPagination(q, opts);
    }, { metadataQuery });
  }

  async trackWhaleActivity(
    address: string,
    walletAddress: string,
    action: 'buy'|'sell',
    amount: number
  ): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    if (!walletAddress.trim()) throw new Error('Wallet address is required');
    return withErrorLogging('trackWhaleActivity', `address=${address}`, () => 
      this.executeWithTransaction(async session => {
        const token = await this.model.findOne({ address }).session(session).lean();
        if (!token) throw new Error(`Token ${address} not found`);
        const entry = { walletAddress, action, amount, timestamp: new Date() };
        const op: UpdateQuery<ITokenTrackingData> = { $push: { 'metadata.whaleActivity': entry }, $set: { lastUpdated: new Date() } };
        op.$inc = action==='buy' ? { 'metadata.buyCount':1 } : { 'metadata.sellCount':1 };
        return this.updateToken(address, op, session);
      })
    );
  }

  async updateHolderCount(address: string, change: number, session?: ClientSession): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    return withErrorLogging('updateHolderCount', `address=${address}`, () =>
      this.updateToken(address, { $inc: { holderCount: change }, $set: { lastUpdated: new Date() } }, session)
    , { address });
  }

  /** ------------------------------------------------------------
   *  Internal helpers
   * -------------------------------------------------------------*/
  private async executeWithTransaction<T>(fn: (session: ClientSession)=>Promise<T>): Promise<T> {
    const session = await this.model.db.startSession();
    try {
      session.startTransaction();
      const res = await fn(session);
      await session.commitTransaction();
      return res;
    } catch (err) {
      if (session.inTransaction()) await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  private setupCircuitBreakerListeners() {
    const attach = (cb: CircuitBreaker, name: string) => {
      ['open','close','halfOpen','fallback'].forEach(evt => {
        cb.on(evt, () => {
          const level = evt==='open'||evt==='fallback' ? 'warn' : 'info';
          logger[level](`${name} circuit ${evt}`, {});
          recordMetric(`circuit.${name}.${evt}`, 1);
        });
      });
    };
    attach(this.priceCB, 'priceData');
    attach(this.patternCB, 'patternDetection');
    attach(this.smartMoneyCB, 'smartMoney');
  }

  /** ------------------------------------------------------------
   *  External API calls
   * -------------------------------------------------------------*/
  private async fetchExternalPriceData(address: string): Promise<TokenPriceUpdate> {
    const resp = await axios.get(`${config.externalApis.priceDataUrl}/price/${address}`);
    const d = resp.data;
    return {
      price: d.price,
      priceChange24h: d.priceChange24h,
      volume24h: d.volume24h,
      liquidity: d.liquidity,
      marketCap: d.marketCap,
      holderCount: d.holderCount,
      timestamp: new Date(d.timestamp)
    };
  }

  private async fetchPatternDetection(address: string): Promise<PatternUpdate[]> {
    const resp = await axios.get(`${config.externalApis.patternDetectionUrl}/patterns/${address}`);
    return resp.data.patterns.map((p: any) => ({
      patternType: p.type,
      confidence: p.confidence,
      timeframe: p.timeframe
    }));
  }

  private async fetchSmartMoneyData(address: string): Promise<SmartMoneyUpdate> {
    const resp = await axios.get(`${config.externalApis.smartMoneyUrl}/smart-money/${address}`);
    const d = resp.data;
    return {
      totalWallets: d.totalWallets,
      sniperWallets: d.sniperWallets,
      gemSpotterWallets: d.gemSpotterWallets,
      earlyMoverWallets: d.earlyMoverWallets,
      buyToSellRatio: d.buyToSellRatio,
      is4xCandidate: d.is4xCandidate,
      predictedSuccessRate: d.predictedSuccessRate
    };
  }

  /** ------------------------------------------------------------
   *  Pagination & projections
   * -------------------------------------------------------------*/
  private async applyPagination<T>(query: any, options: PaginationOptions): Promise<PaginatedResult<T>> {
    const { page = 1, perPage = CACHED_CONFIG.defaultPerPage } = options;
    if (page < 1 || perPage < 1) throw new Error('page and perPage must be ≥ 1');
    const countQ = this.model.find().merge(query);
    const [total, data] = await Promise.all([
      countQ.countDocuments().lean(),
      query.skip((page-1)*perPage).limit(perPage).lean()
    ]);
    return { data, page, perPage, total };
  }

  private getBasicProjection() {
    return {
      address:1, symbol:1, name:1,
      price:1, priceChange24h:1, volume24h:1,
      liquidity:1, marketCap:1, manipulationScore:1,
      'smartMoneyActivity.totalWallets':1,
      'smartMoneyActivity.is4xCandidate':1,
      'smartMoneyActivity.predictedSuccessRate':1,
      'patterns.fast.hasPattern':1,
      'patterns.slow.hasPattern':1,
      hasAnyPattern:1, tags:1, lastUpdated:1
    };
  }

  /** ------------------------------------------------------------
   *  Direct lookups & updates
   * -------------------------------------------------------------*/
  async getByAddress(address: string): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    return withErrorLogging('getByAddress', `address=${address}`, () =>
      this.model.findOne({ address }).lean(), { address }
    );
  }

  async getBySymbol(symbol: string, network: string='solana'): Promise<ITokenTrackingData|null> {
    if (!symbol.trim()) throw new Error('Symbol is required');
    return withErrorLogging('getBySymbol', `symbol=${symbol}`, () =>
      this.model.findOne({ symbol: symbol.toUpperCase(), network }).lean(),
      { symbol, network }
    );
  }

  async updateToken(
    address: string,
    updateData: UpdateQuery<ITokenTrackingData>,
    session?: ClientSession
  ): Promise<ITokenTrackingData|null> {
    addressSchema.parse(address);
    return this.model.findOneAndUpdate(
      { address },
      updateData,
      { new: true, lean: true, session, runValidators: true, context: 'query' }
    ).exec();
  }

  async findBySymbol(
    symbol: string,
    network = 'solana',
    opts: PaginationOptions = {}
  ): Promise<PaginatedResult<ITokenTrackingData>> {
    return withErrorLogging(
      'findBySymbol',
      `symbol=${symbol},network=${network}`,
      () => {
        const re = new RegExp(symbol, 'i');
        const q = this.model.find({ symbol: re, network })
          .select(this.getBasicProjection())
          .sort({ liquidity:-1 })
          .lean();
        return this.applyPagination(q, opts);
      },
      { symbol, network }
    );
  }

  async find4xCandidates(
    minPredictedSuccessRate = CACHED_CONFIG.defaultMinPredictedSuccessRate,
    minLiquidity = CACHED_CONFIG.defaultMinLiquidity,
    maxManipulationScore = CACHED_CONFIG.defaultMaxManipulationScore,
    opts: PaginationOptions = {}
  ): Promise<PaginatedResult<ITokenTrackingData>> {
    return withErrorLogging(
      'find4xCandidates',
      '',
      () => {
        const q = this.model.find({
          'smartMoneyActivity.is4xCandidate': true,
          'smartMoneyActivity.predictedSuccessRate': { $gte: minPredictedSuccessRate },
          liquidity: { $gte: minLiquidity },
          manipulationScore: { $lte: maxManipulationScore }
        })
        .select(this.getBasicProjection())
        .sort({ 'smartMoneyActivity.predictedSuccessRate': -1 })
        .lean();
        return this.applyPagination(q, opts);
      }
    );
  }

  async findTokensWithPatterns(
    patternType?: string,
    timeframe?: 'fast'|'slow',
    minConfidence = 50,
    opts: PaginationOptions = {}
  ): Promise<PaginatedResult<ITokenTrackingData>> {
    return withErrorLogging(
      'findTokensWithPatterns',
      '',
      () => {
        const qf: FilterQuery<ITokenTrackingData> = {};
        if (!timeframe) {
          qf.hasAnyPattern = true;
          if (patternType) {
            qf.$or = [
              { 'patterns.fast.patternType': patternType, 'patterns.fast.confidence': { $gte: minConfidence } },
              { 'patterns.slow.patternType': patternType, 'patterns.slow.confidence': { $gte: minConfidence } }
            ];
          } else {
            qf.$or = [
              { 'patterns.fast.confidence': { $gte: minConfidence } },
              { 'patterns.slow.confidence': { $gte: minConfidence } }
            ];
          }
        } else {
          qf[`patterns.${timeframe}.hasPattern`] = true;
          qf[`patterns.${timeframe}.confidence`] = { $gte: minConfidence };
          if (patternType) {
            qf[`patterns.${timeframe}.patternType`] = patternType;
          }
        }
        const q = this.model.find(qf)
          .select(this.getBasicProjection())
          .sort({ 'smartMoneyActivity.predictedSuccessRate': -1, liquidity: -1 })
          .lean();
        return this.applyPagination(q, opts);
      }
    );
  }

  async findRecentlyActive(hoursAgo = 24, opts: PaginationOptions = {}): Promise<PaginatedResult<ITokenTrackingData>> {
    return withErrorLogging(
      'findRecentlyActive',
      `hoursAgo=${hoursAgo}`,
      () => {
        const cutoff = new Date(Date.now() - hoursAgo*3600*1000);
        const q = this.model.find({ lastUpdated: { $gte: cutoff } })
          .select(this.getBasicProjection())
          .sort({ volume24h:-1 })
          .lean();
        return this.applyPagination(q, opts);
      }
    );
  }

  async findByQuery(query: FilterQuery<ITokenTrackingData>, opts: PaginationOptions = {}): Promise<PaginatedResult<ITokenTrackingData>> {
    return withErrorLogging('findByQuery','', () => {
      const q = this.model.find(query).select(this.getBasicProjection()).lean();
      return this.applyPagination(q, opts);
    }, { query });
  }

  async bulkUpdate(
    query: FilterQuery<ITokenTrackingData>,
    updateData: UpdateQuery<ITokenTrackingData>
  ): Promise<{ matchedCount:number; modifiedCount:number }> {
    return withErrorLogging('bulkUpdate','', async () => {
      const res = await this.model.updateMany(query, updateData);
      return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
    }, { query });
  }

  async deleteByQuery(query: FilterQuery<ITokenTrackingData>): Promise<{ deletedCount:number }> {
    return withErrorLogging('deleteByQuery','', async () => {
      const res = await this.model.deleteMany(query);
      return { deletedCount: res.deletedCount ?? 0 };
    }, { query });
  }
}

// Singleton
export const tokenTrackingDataService = new TokenTrackingDataService();