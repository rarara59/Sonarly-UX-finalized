import { model, Model, Types, ClientSession } from 'mongoose';
import { z } from 'zod';
import {
  WalletPerformanceHistory,
  IWalletPerformanceHistory
} from '../models/wallet-performance-history.model';
import { MetricsService } from '../utils/metrics.service';
import { Logger } from '../utils/logger';
import { TransactionManager } from '../utils/transaction-manager';

// ─── Zod Schemas ────────────────────────────────────────────────────────────
const CreateSchema = z.object({
  walletAddress: z.string().min(30).max(44),
  date: z.date(),
  successRate: z.number().min(0).max(100),
  totalTrades: z.number().int().min(0),
  profitUsd: z.number(),
  averageReturnPercent: z.number().optional(),
  tags: z.array(z.string()).optional(),
  tokens: z
    .array(
      z.object({
        symbol: z.string(),
        address: z.string(),
        successCount: z.number().int().min(0),
        totalCount: z.number().int().min(0)
      })
    )
    .optional(),
  metadata: z.record(z.any()).optional()
});

const FindByWalletSchema = z.object({
  walletAddress: z.string().min(30).max(44),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(1000).default(100),
  sortBy: z.string().default('date'),
  sortDirection: z.number().int().min(-1).max(1).default(-1)
});

const TimeRangeSchema = z.object({
  walletAddress: z.string().min(30).max(44),
  startDate: z.date(),
  endDate: z.date()
});

const TrendCalculationSchema = z.object({
  walletAddress: z.string().min(30).max(44),
  days: z.number().int().min(1).max(365).default(30)
});

const RollingPerformanceSchema = z.object({
  walletAddress: z.string().min(30).max(44),
  windowDays: z.number().int().min(1).max(90).default(7)
});

// ─── Service ────────────────────────────────────────────────────────────────
export class WalletPerformanceHistoryService {
  private model: Model<IWalletPerformanceHistory>;
  private logger: Logger;
  private metrics: MetricsService;
  private transactionManager: TransactionManager;

  constructor(
    logger: Logger,
    metrics: MetricsService,
    transactionManager: TransactionManager
  ) {
    this.model = model<IWalletPerformanceHistory>('WalletPerformanceHistory');
    this.logger = logger;
    this.metrics = metrics;
    this.transactionManager = transactionManager;
  }

  private async withErrorLogging<T>(
    operation: string,
    context: Record<string, any>,
    fn: () => Promise<T>,
    tags: Record<string, any> = {}
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.metrics.recordTimingMetric(
        `wallet_performance.${operation}.success`,
        duration,
        tags
      );
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.metrics.recordTimingMetric(
        `wallet_performance.${operation}.error`,
        duration,
        tags
      );
      this.metrics.incrementCounter(
        `wallet_performance.${operation}.error_count`,
        tags
      );
      this.logger.error(
        `Error in WalletPerformanceHistoryService.${operation}`,
        { error: err, context, duration }
      );
      throw err;
    }
  }

  private async applyPagination<T>(
    query: any,
    { page, perPage }: { page: number; perPage: number }
  ): Promise<{ data: T[]; page: number; perPage: number; total: number }> {
    const countQuery = { ...query };
    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean(),
      this.model.countDocuments(countQuery)
    ]);
    return { data, page, perPage, total };
  }

  /** Create (idempotent upsert) */
  async create(
    data: z.infer<typeof CreateSchema>
  ): Promise<IWalletPerformanceHistory> {
    return this.withErrorLogging(
      'create',
      { data },
      async () => {
        const validated = CreateSchema.parse(data);
        try {
          const doc = await this.model
            .findOneAndUpdate(
              { walletAddress: validated.walletAddress, date: validated.date },
              { $setOnInsert: validated },
              {
                upsert: true,
                new: true,
                runValidators: true,
                context: 'query'
              }
            )
            .lean();
          return doc!;
        } catch (err: any) {
          if (err.code === 11000) {
            // duplicate
            this.logger.warn(
              'Duplicate record insertion attempt',
              validated
            );
            return (
              await this.model
                .findOne({
                  walletAddress: validated.walletAddress,
                  date: validated.date
                })
                .lean()
            )!;
          }
          throw err;
        }
      },
      { operation: 'create' }
    );
  }

  /** Find by ID */
  async findById(id: string) {
    return this.withErrorLogging(
      'findById',
      { id },
      async () => {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid ID: ${id}`);
        }
        return this.model.findById(id).lean();
      }
    );
  }

  /** Paginated find by walletAddress */
  async findByWalletAddress(params: z.infer<typeof FindByWalletSchema>) {
    return this.withErrorLogging(
      'findByWalletAddress',
      params,
      async () => {
        const { walletAddress, page, perPage, sortBy, sortDirection } =
          FindByWalletSchema.parse(params);
        const query = { walletAddress };
        const builder = this.model
          .find(query)
          .sort({ [sortBy]: sortDirection });
        return this.applyPagination(builder, { page, perPage });
      },
      { operation: 'findByWalletAddress' }
    );
  }

  /** Time-range query */
  async getPerformanceByTimeRange(params: z.infer<typeof TimeRangeSchema>) {
    return this.withErrorLogging(
      'getPerformanceByTimeRange',
      params,
      async () => {
        const { walletAddress, startDate, endDate } =
          TimeRangeSchema.parse(params);
        if (startDate > endDate) throw new Error('startDate > endDate');
        return this.model
          .find({
            walletAddress,
            date: { $gte: startDate, $lte: endDate }
          })
          .sort({ date: 1 })
          .lean();
      }
    );
  }

  /** Trend calculation */
  async calculatePerformanceTrend(params: z.infer<typeof TrendCalculationSchema>) {
    return this.withErrorLogging(
      'calculatePerformanceTrend',
      params,
      async () => {
        const { walletAddress, days } =
          TrendCalculationSchema.parse(params);
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);

        const pipeline = [
          { $match: { walletAddress, date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              averageSuccessRate: { $avg: '$successRate' },
              totalTrades: { $sum: '$totalTrades' },
              profitUsd: { $sum: '$profitUsd' },
              averageReturnPercent: { $avg: '$averageReturnPercent' }
            }
          },
          {
            $project: {
              _id: 0,
              date: '$_id',
              averageSuccessRate: 1,
              totalTrades: 1,
              profitUsd: 1,
              averageReturnPercent: 1
            }
          },
          { $sort: { date: 1 } }
        ];

        return this.model.aggregate(pipeline);
      }
    );
  }

  /** Update record */
  async update(
    id: string,
    updateData: Partial<z.infer<typeof CreateSchema>>
  ) {
    return this.withErrorLogging(
      'update',
      { id, updateData },
      async () => {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid ID: ${id}`);
        }
        const updateOp: any = {};
        // set any passed fields
        for (const key of ['successRate','totalTrades','profitUsd','averageReturnPercent','tags','tokens']) {
          if ((updateData as any)[key] !== undefined) {
            updateOp.$set = updateOp.$set || {};
            (updateOp.$set as any)[key] = (updateData as any)[key];
          }
        }
        if (!updateOp.$set) {
          return this.model.findById(id).lean();
        }
        return this.model
          .findByIdAndUpdate(id, updateOp, {
            new: true,
            runValidators: true,
            context: 'query'
          })
          .lean();
      }
    );
  }

  /** Delete record */
  async delete(id: string) {
    return this.withErrorLogging(
      'delete',
      { id },
      async () => {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid ID: ${id}`);
        }
        const res = await this.model.findByIdAndDelete(id);
        return res != null;
      }
    );
  }

  /** Rolling window metrics */
  async calculateRollingPerformance(params: z.infer<typeof RollingPerformanceSchema>) {
    return this.withErrorLogging(
      'calculateRollingPerformance',
      params,
      async () => {
        const { walletAddress, windowDays } =
          RollingPerformanceSchema.parse(params);
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - windowDays * 5);

        return this.transactionManager.executeTransaction(async session => {
          const records = await this.model
            .find({ walletAddress, date: { $gte: start, $lte: end } })
            .sort({ date: 1 })
            .lean()
            .session(session);

          if (records.length < windowDays) return [];

          const result = [];
          for (let i = windowDays - 1; i < records.length; i++) {
            const window = records.slice(i - windowDays + 1, i + 1);
            const avgSuccess =
              window.reduce((sum, r) => sum + r.successRate, 0) / windowDays;
            const totalProfit = window.reduce((sum, r) => sum + r.profitUsd, 0);
            const avgReturn =
              window.reduce((sum, r) => sum + (r.averageReturnPercent || 0), 0) /
              windowDays;
            result.push({
              date: records[i].date,
              rollingSuccessRate: avgSuccess,
              rollingProfitUsd: totalProfit,
              rollingReturnPercent: avgReturn,
              windowDays
            });
          }
          return result;
        });
      }
    );
  }

  /** Detect improving wallets */
  async detectImprovingWallets(
    improvementThreshold = 10,
    minWindowDays = 7
  ) {
    return this.withErrorLogging(
      'detectImprovingWallets',
      { improvementThreshold, minWindowDays },
      async () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - minWindowDays * 3);

        const groups = await this.model.aggregate([
          { $match: { date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: '$walletAddress',
              dates: { $push: '$date' },
              successRates: { $push: '$successRate' },
              profitValues: { $push: '$profitUsd' }
            }
          },
          { $match: { 'dates.1': { $exists: true } } }
        ]);

        const improving: any[] = [];
        for (const g of groups) {
          // sort by date & split into two windows
          const idx = g.dates
            .map((d: Date, i: number) => ({ d, i }))
            .sort((a, b) => a.d.getTime() - b.d.getTime())
            .map(x => x.i);

          const rates = idx.map((i: number) => g.successRates[i]);
          const profits = idx.map((i: number) => g.profitValues[i]);

          const recent = rates.slice(-minWindowDays);
          const previous = rates.slice(-2 * minWindowDays, -minWindowDays);
          if (previous.length < minWindowDays) continue;

          const avgRecent =
            recent.reduce((s, v) => s + v, 0) / recent.length;
          const avgPrev =
            previous.reduce((s, v) => s + v, 0) / previous.length;

          const totalRecent = profits
            .slice(-minWindowDays)
            .reduce((s, v) => s + v, 0);
          const totalPrev = profits
            .slice(-2 * minWindowDays, -minWindowDays)
            .reduce((s, v) => s + v, 0);

          const rateImp =
            avgPrev > 0 ? ((avgRecent - avgPrev) / avgPrev) * 100 : 0;
          const profitImp =
            totalPrev !== 0
              ? ((totalRecent - totalPrev) / Math.abs(totalPrev)) * 100
              : 0;

          if (rateImp >= improvementThreshold || profitImp >= improvementThreshold) {
            improving.push({
              walletAddress: g._id,
              successRateImprovement: rateImp,
              profitImprovement: profitImp,
              recentSuccessRate: avgRecent,
              previousSuccessRate: avgPrev,
              recentProfit: totalRecent,
              previousProfit: totalPrev
            });
          }
        }
        return improving;
      }
    );
  }

  /** Detect declining wallets */
  async detectDecliningWallets(
    declineThreshold = -15,
    minWindowDays = 7
  ) {
    return this.withErrorLogging(
      'detectDecliningWallets',
      { declineThreshold, minWindowDays },
      async () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - minWindowDays * 3);

        const groups = await this.model.aggregate([
          { $match: { date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: '$walletAddress',
              dates: { $push: '$date' },
              successRates: { $push: '$successRate' },
              profitValues: { $push: '$profitUsd' }
            }
          },
          { $match: { 'dates.1': { $exists: true } } }
        ]);

        const declining: any[] = [];
        for (const g of groups) {
          const idx = g.dates
            .map((d: Date, i: number) => ({ d, i }))
            .sort((a, b) => a.d.getTime() - b.d.getTime())
            .map(x => x.i);

          const rates = idx.map((i: number) => g.successRates[i]);
          const profits = idx.map((i: number) => g.profitValues[i]);

          const recent = rates.slice(-minWindowDays);
          const previous = rates.slice(-2 * minWindowDays, -minWindowDays);
          if (previous.length < minWindowDays) continue;

          const avgRecent =
            recent.reduce((s, v) => s + v, 0) / recent.length;
          const avgPrev =
            previous.reduce((s, v) => s + v, 0) / previous.length;

          const totalRecent = profits
            .slice(-minWindowDays)
            .reduce((s, v) => s + v, 0);
          const totalPrev = profits
            .slice(-2 * minWindowDays, -minWindowDays)
            .reduce((s, v) => s + v, 0);

          const rateDecline =
            avgPrev > 0 ? ((avgRecent - avgPrev) / avgPrev) * 100 : 0;
          const profitDecline =
            totalPrev !== 0
              ? ((totalRecent - totalPrev) / Math.abs(totalPrev)) * 100
              : 0;

          if (rateDecline <= declineThreshold || profitDecline <= declineThreshold) {
            declining.push({
              walletAddress: g._id,
              successRateDecline: rateDecline,
              profitDecline: profitDecline,
              recentSuccessRate: avgRecent,
              previousSuccessRate: avgPrev,
              recentProfit: totalRecent,
              previousProfit: totalPrev
            });
          }
        }
        return declining;
      }
    );
  }

  /** Bulk import */
  async bulkImportPerformanceData(
    records: z.infer<typeof CreateSchema>[],
    options: { ordered?: boolean } = { ordered: false }
  ) {
    return this.withErrorLogging(
      'bulkImportPerformanceData',
      { recordCount: records.length },
      async () => {
        const validated = records.map(r => CreateSchema.parse(r));
        return this.transactionManager.executeTransaction(async session => {
          const ops = validated.map(record => ({
            updateOne: {
              filter: {
                walletAddress: record.walletAddress,
                date: record.date
              },
              update: { $setOnInsert: record },
              upsert: true
            }
          }));
          try {
            const res = await this.model.bulkWrite(ops, {
              ordered: options.ordered,
              session
            });
            return { inserted: res.upsertedCount, errors: [] as any[] };
          } catch (err: any) {
            if (err.writeErrors) {
              return {
                inserted: err.result?.nInserted || 0,
                errors: err.writeErrors
              };
            }
            throw err;
          }
        });
      }
    );
  }

  /** Tag filter */
  async findByTags(
    tags: string[],
    options: { page?: number; perPage?: number; minSuccessRate?: number } = {}
  ) {
    return this.withErrorLogging(
      'findByTags',
      { tags, options },
      async () => {
        const page = options.page ?? 1;
        const perPage = options.perPage ?? 100;
        const minSuccessRate = options.minSuccessRate ?? 0;
        const query = {
          tags: { $in: tags },
          successRate: { $gte: minSuccessRate }
        };
        const builder = this.model.find(query).sort({ date: -1 });
        return this.applyPagination(builder, { page, perPage });
      }
    );
  }
}