// src/services/liquidity-pool-data-extractor.service.ts
import winston from 'winston';
import { RPCConnectionManager } from './rpc-connection-manager';
import { LiquidityPoolCreationDetector } from './liquidity-pool-creation-detector.service';
// Add near your imports
import { RequestThrottler } from '../utils/request-throttler';

const globalRpcThrottler = new RequestThrottler({
  maxRequests: 5,
  perMilliseconds: 1000,
});

type LiquidityPoolEvent = {
  tokenAddress: string;
  lpValueUSD: number;
  quoteToken: 'USDC' | 'USDT' | 'SOL' | string;
  timestamp: number;
  deployer: string;
  hasInitialBuys: boolean;
  dex: 'Raydium' | 'Orca' | 'Meteora' | string;
  txHash: string;
  marketCapUSD?: number;
  volumeUSD24h?: number;
  priceUSD?: number;
  holders?: number;
};

type LPDetectionResult = {
  passed: boolean;
  reason?: string;
  confidence: number;
};

interface ExtractorConfig {
  scanIntervalMs: number;
  maxLPsPerScan: number;
  enableEvaluation: boolean;
  dexMappings: Record<string, string>;
  seenLPCacheTTL: number;
  enableBulkReserveChecks: boolean;
  bulkRequestBatchSize: number;
}

interface ExtractorMetrics {
  totalScanned: number;
  totalEvaluated: number;
  totalPassed: number;
  lastScanDuration: number;
  successRate: number;
  cacheHitRate: number;
  bulkRequestsSaved: number;
}

interface SeenLPEntry {
  timestamp: number;
  processed: boolean;
}

export class LiquidityPoolDataExtractor {
  private logger: winston.Logger;
  private rpcManager: RPCConnectionManager;
  private scanInterval?: NodeJS.Timeout;
  private isExtracting: boolean = false;
  private seenLPsCache: Map<string, SeenLPEntry> = new Map();
  private cacheHits: number = 0;
  private cacheChecks: number = 0;
  private config: ExtractorConfig = {
    scanIntervalMs: 30000,
    maxLPsPerScan: 50,
    enableEvaluation: true,
    dexMappings: {
      '5quBtoiQqxF9Jv6KYKctB59NT3gtJD2N1moEanD7E': 'Raydium',
    },
    seenLPCacheTTL: 300000,
    enableBulkReserveChecks: true,
    bulkRequestBatchSize: 20
  };
  private metrics: ExtractorMetrics = {
    totalScanned: 0,
    totalEvaluated: 0,
    totalPassed: 0,
    lastScanDuration: 0,
    successRate: 0,
    cacheHitRate: 0,
    bulkRequestsSaved: 0
  };
  private onLPPassed?: (event: LiquidityPoolEvent, result: LPDetectionResult) => Promise<void>;

  constructor(rpcManager: RPCConnectionManager, config: Partial<ExtractorConfig> = {}) {
    this.rpcManager = rpcManager;
    this.config = { ...this.config, ...config };

    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'lp-data-extractor' },
      transports: [
        new winston.transports.File({ filename: 'lp-extractor.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Initialize the cache cleanup
    this.startCacheCleanup();
  }

  public getStatus(): ExtractorMetrics {
    return this.metrics;
  }

  public setOnLPPassed(callback: (event: LiquidityPoolEvent, result: LPDetectionResult) => Promise<void>): void {
    this.onLPPassed = callback;
  }

  public start(): void {
    if (this.scanInterval) {
      this.logger.warn('Scan already running.');
      return;
    }
  
    this.logger.info(`⏳ Starting LP scan every ${this.config.scanIntervalMs}ms`);
    this.scanInterval = setInterval(() => {
      this.extractAndEvaluate();
    }, this.config.scanIntervalMs);
  }

  // --- LP FETCHING ---

  /**
   * Fetches recent liquidity pool accounts using direct RPC scanning
   * @param limit Maximum number of pools to fetch
   * @returns Array of liquidity pool data in a normalized format
   */
  public async getRecentLPAccounts(limit: number = 50): Promise<any[]> {
    try {
      this.logger.info(`🔍 Scanning for recent LP accounts using RPC (limit: ${limit})...`);
      
      // Use the RPC manager's direct scanning method instead of Birdeye
      const accounts = await globalRpcThrottler.schedule(() => {
        return this.rpcManager.getRecentLPAccounts(limit);
      });
      
      if (accounts && accounts.length > 0) {
        this.logger.info(`✅ RPC scan found ${accounts.length} LP accounts`);
        return accounts; // RPC manager already returns data in the expected format
      }
      
      this.logger.warn(`⚠️ RPC scan returned no LP accounts`);
      return [];
    } catch (err) {
      this.logger.error(`❌ Error scanning for LP accounts via RPC:`, err);
      return [];
    }
  }

  public async extractAndEvaluate(): Promise<void> {
    this.logger.info('🧪 Running extractAndEvaluate...');
    const rawLPs = await this.getRecentLPAccounts(this.config.maxLPsPerScan);
    this.logger.info(`📊 Fetched ${rawLPs.length} LPs via RPC scanning`);
  
    for (const lp of rawLPs) {
      const event = await this.transformToLPEvent(lp);
      if (!event) continue;
  
      const result: LPDetectionResult = {
        passed: !!(event.marketCapUSD && event.marketCapUSD >= 100000 &&
                   event.volumeUSD24h && event.volumeUSD24h >= 100000 &&
                   event.holders && event.holders > 300),
        confidence: 0.9
      };
  
      if (result.passed && this.onLPPassed) {
        await this.onLPPassed(event, result);
      }
    }
  }

  public stop(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.logger.info('🛑 Stopped LP scan.');
      this.scanInterval = undefined;
    }
  }

  // --- CACHE MANAGEMENT ---

  // Start cache cleanup to remove expired entries
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCacheEntries();
    }, 60000); // Clean up every minute
  }

  // Clean up expired cache entries
  private cleanupExpiredCacheEntries(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.seenLPsCache.entries()) {
      if (now - entry.timestamp > this.config.seenLPCacheTTL) {
        this.seenLPsCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug(`🧹 Cleaned up ${removed} expired LP cache entries`);
    }
  }

  // Check if LP was recently seen
  private isLPRecentlySeen(lpPubkey: string): boolean {
    this.cacheChecks++;
    const entry = this.seenLPsCache.get(lpPubkey);

    if (entry) {
      const now = Date.now();
      if (now - entry.timestamp <= this.config.seenLPCacheTTL) {
        this.cacheHits++;
        return true;
      } else {
        // Expired entry, remove it
        this.seenLPsCache.delete(lpPubkey);
      }
    }

    return false;
  }

  // Mark LP as seen
  private markLPAsSeen(lpPubkey: string): void {
    this.seenLPsCache.set(lpPubkey, {
      timestamp: Date.now(),
      processed: true
    });
  }

  // --- BULK RESERVE FETCHING ---

  // Fetch reserves for multiple LPs using getMultipleAccounts for efficiency
  private async fetchBulkReserves(lpAccounts: any[]): Promise<Map<string, any>> {
    const bulkReservesData = new Map<string, any>();
    
    if (!this.config.enableBulkReserveChecks || lpAccounts.length === 0) {
      return bulkReservesData;
    }

    try {
      // Extract unique addresses for bulk fetching
      const addresses = lpAccounts.map(lp => lp.pubkey).filter(Boolean);
      
      if (addresses.length === 0) {
        return bulkReservesData;
      }

      // Batch addresses for bulk requests
      const batches = [];
      for (let i = 0; i < addresses.length; i += this.config.bulkRequestBatchSize) {
        batches.push(addresses.slice(i, i + this.config.bulkRequestBatchSize));
      }

      this.logger.debug(`📦 Fetching reserves for ${addresses.length} LPs in ${batches.length} batches`);

      // Fetch all batches
      const allResults = await Promise.all(
        batches.map(batch => this.rpcManager.getMultipleAccounts(batch))
      );

      // Combine results
      let totalFetched = 0;
      allResults.forEach((batchResults, batchIndex) => {
        const batchAddresses = batches[batchIndex];
        batchResults.forEach((accountData, index) => {
          if (accountData && batchAddresses[index]) {
            bulkReservesData.set(batchAddresses[index], accountData);
            totalFetched++;
          }
        });
      });

      this.metrics.bulkRequestsSaved += Math.max(0, addresses.length - batches.length);
      this.logger.debug(`📦 Bulk fetch complete: ${totalFetched}/${addresses.length} accounts retrieved`);

    } catch (error) {
      this.logger.error('Bulk reserve fetch failed:', error);
    }

    return bulkReservesData;
  }

  // --- DATA TRANSFORMATION METHODS ---

  // Transform raw LP account data to LiquidityPoolEvent using RPC data
  private async transformToLPEvent(
    rawLP: any,
    bulkReservesData?: Map<string, any>
  ): Promise<LiquidityPoolEvent | null> {
    try {
      // Extract basic data
      const tokenAddress = this.extractTokenAddress(rawLP);
      if (!tokenAddress) {
        this.logger.debug(`No token address found for LP ${rawLP.pubkey}`);
        return null;
      }

      // Estimate LP value directly from on-chain data
      const lpValueUSD = await this.estimateLPValue(rawLP, bulkReservesData);
      
      if (lpValueUSD < 100) { // Skip tiny LPs
        return null;
      }

      // Get quote token from RPC data
      const quoteToken = this.getQuoteToken(rawLP);

      // Get deployer/creator
      const deployer = rawLP.creator || rawLP.poolAuthority || 'UNKNOWN';

      // Determine DEX using program ID mapping
      const dex = this.getDexName(rawLP);

      // Check for initial buys (simplified)
      const hasInitialBuys = await this.checkForInitialBuys(tokenAddress);

      // Get transaction hash (if available)
      const txHash = await this.getCreationTxHash(rawLP.pubkey);

      // Get or estimate market data
      const marketCapUSD = await this.estimateMarketCap(tokenAddress, lpValueUSD);
      const volumeUSD24h = await this.estimate24hVolume(tokenAddress);
      const priceUSD = await this.estimateTokenPrice(tokenAddress, lpValueUSD);
      const holders = await this.estimateHolderCount(tokenAddress);

      // Create enhanced LiquidityPoolEvent
      const lpEvent: LiquidityPoolEvent = {
        tokenAddress,
        lpValueUSD,
        quoteToken,
        timestamp: Math.floor(Date.now() / 1000),
        deployer,
        hasInitialBuys,
        dex,
        txHash,
        // Enhanced fields
        marketCapUSD,
        volumeUSD24h,
        priceUSD,
        holders
      };

      return lpEvent;

    } catch (error) {
      this.logger.error(`Failed to transform LP ${rawLP.pubkey}:`, error);
      return null;
    }
  }

  // Extract token address from raw LP data
  private extractTokenAddress(rawLP: any): string {
    // Extract directly from RPC data structure
    return rawLP.tokenMintA || 
           rawLP.tokenMintB ||
           rawLP.mintAddress ||
           rawLP.account?.data?.parsed?.info?.tokenMintA ||
           rawLP.account?.data?.parsed?.info?.tokenMintB ||
           rawLP.account?.data?.parsed?.info?.mint ||
           '';
  }

  // Enhanced LP value estimation with on-chain data
  private async estimateLPValue(
    rawLP: any, 
    bulkReservesData?: Map<string, any>
  ): Promise<number> {
    try {
      // Traditional LP value calculation from on-chain data
      let info = rawLP.account?.data?.parsed?.info;
      
      if (!info && bulkReservesData && rawLP.pubkey) {
        const bulkData = bulkReservesData.get(rawLP.pubkey);
        if (bulkData?.data?.parsed?.info) {
          info = bulkData.data.parsed.info;
        }
      }

      if (!info || !info.tokenAmountA || !info.tokenAmountB) {
        // Fallback to individual fetch if bulk data unavailable
        if (!bulkReservesData) {
          const accountInfo = await this.rpcManager.getAccountInfo(rawLP.pubkey);
          info = accountInfo?.data?.parsed?.info;
        }
        
        if (!info) return 0;
      }

      const reserveA = parseFloat(info.tokenAmountA.amount) / Math.pow(10, info.tokenAmountA.decimals || 6);
      const reserveB = parseFloat(info.tokenAmountB.amount) / Math.pow(10, info.tokenAmountB.decimals || 6);

      const symbolA = info.tokenAmountA.symbol || '';
      const symbolB = info.tokenAmountB.symbol || '';

      // Enhanced price mapping
      const priceMap: Record<string, number> = {
        'USDC': 1,
        'USDT': 1,
        'SOL': 130, // Update with current SOL price
        'WSOL': 130,
        'USDC.e': 1, // Bridged USDC
        'RAY': 2.5, // Example - add more tokens as needed
      };

      const priceA = priceMap[symbolA] || 0;
      const priceB = priceMap[symbolB] || 0;

      const totalValueUSD = reserveA * priceA + reserveB * priceB;
      return totalValueUSD;
    } catch (error) {
      this.logger.debug('LP value estimation error:', error);
      return 0;
    }
  }

  // Get quote token from LP using RPC data
  private getQuoteToken(rawLP: any): 'USDC' | 'USDT' | 'SOL' | string {
    try {
      // Extract from RPC data
      const info = rawLP.account?.data?.parsed?.info;
      if (!info) return 'SOL';

      const symbolA = info.tokenAmountA?.symbol || '';
      const symbolB = info.tokenAmountB?.symbol || '';

      // Check for stablecoins first
      if (symbolA === 'USDC' || symbolB === 'USDC') return 'USDC';
      if (symbolA === 'USDT' || symbolB === 'USDT') return 'USDT';
      
      // Check for SOL/WSOL
      if (symbolA === 'SOL' || symbolA === 'WSOL' || 
          symbolB === 'SOL' || symbolB === 'WSOL') return 'SOL';

      // Default to SOL if unclear
      return 'SOL';
    } catch {
      return 'SOL';
    }
  }

  // Determine DEX name from program ID
  private getDexName(rawLP: any): 'Raydium' | 'Orca' | 'Meteora' | string {
    // Extract from RPC data
    const programId = rawLP.programId || rawLP.account?.owner;
    if (programId && this.config.dexMappings[programId]) {
      return this.config.dexMappings[programId];
    }

    // Default to unknown
    return 'UNKNOWN';
  }

  // Check for initial buys via on-chain data
  private async checkForInitialBuys(tokenAddress: string): Promise<boolean> {
    try {
      // Get recent signatures for the token
      const signatures = await this.rpcManager.getSignaturesForAddress(tokenAddress, 10);
      
      // Simple heuristic: if there are transactions shortly after creation, assume initial buys
      return signatures.length > 3;
    } catch (error) {
      this.logger.debug(`Failed to check initial buys for ${tokenAddress}:`, error);
      return false;
    }
  }

  // Get creation transaction hash from on-chain data
  private async getCreationTxHash(lpPubkey: string): Promise<string> {
    try {
      // Get the earliest signature for this LP
      const signatures = await this.rpcManager.getSignaturesForAddress(lpPubkey, 1);
      return signatures.length > 0 ? signatures[0].signature : 'UNKNOWN';
    } catch (error) {
      this.logger.debug(`Failed to get creation tx hash for ${lpPubkey}:`, error);
      return 'UNKNOWN';
    }
  }

  // --- MARKET DATA ESTIMATION ---

  // Estimate market cap from on-chain data
  private async estimateMarketCap(tokenAddress: string, lpValueUSD: number): Promise<number | undefined> {
    try {
      // Get token supply
      const tokenSupply = await this.rpcManager.getTokenSupply(tokenAddress);
      if (!tokenSupply) return lpValueUSD * 10; // Fallback estimation
      
      // Get token price
      const price = await this.estimateTokenPrice(tokenAddress, lpValueUSD);
      if (!price) return lpValueUSD * 10; // Fallback estimation
      
      // Calculate market cap
      const supply = Number(tokenSupply.amount) / Math.pow(10, tokenSupply.decimals || 0);
      return supply * price;
    } catch (error) {
      this.logger.debug(`Failed to estimate market cap for ${tokenAddress}:`, error);
      // Simple estimation based on LP value as fallback
      return lpValueUSD * 10;
    }
  }

  // Estimate 24h volume from transaction history
  private async estimate24hVolume(tokenAddress: string): Promise<number | undefined> {
    try {
      // Get recent transactions for the token
      const signatures = await this.rpcManager.getSignaturesForAddress(tokenAddress, 50);
      if (signatures.length === 0) return undefined;
      
      // Filter transactions from last 24 hours
      const oneDayAgo = (Date.now() / 1000) - 86400;
      const recent24hSigs = signatures.filter(sig => sig.blockTime && sig.blockTime >= oneDayAgo);
      
      // Simple estimation - assume average transaction value
      return recent24hSigs.length * 1000; // Placeholder - can be refined
    } catch (error) {
      this.logger.debug(`Failed to estimate 24h volume for ${tokenAddress}:`, error);
      return undefined;
    }
  }

  // Estimate token price from LP reserves
  private async estimateTokenPrice(tokenAddress: string, lpValueUSD: number): Promise<number | undefined> {
    try {
      // Get token supply
      const tokenSupply = await this.rpcManager.getTokenSupply(tokenAddress);
      if (!tokenSupply) return undefined;
      
      // Get token holder accounts to find LP accounts
      const tokenAccounts = await this.rpcManager.getTokenAccountsByOwner(tokenAddress);
      if (!tokenAccounts || tokenAccounts.length === 0) return undefined;
      
      // Find largest LP account to estimate price
      // This is a simplification - a more sophisticated approach would analyze multiple LPs
      const lpAccount = tokenAccounts[0]; // Placeholder logic
      
      // Simplified price calculation
      const supply = Number(tokenSupply.amount) / Math.pow(10, tokenSupply.decimals || 0);
      return lpValueUSD / supply;
    } catch (error) {
      this.logger.debug(`Failed to estimate token price for ${tokenAddress}:`, error);
      return undefined;
    }
  }

  // Estimate holder count from token accounts
  private async estimateHolderCount(tokenAddress: string): Promise<number | undefined> {
    try {
      // Get token holder accounts
      const tokenAccounts = await this.rpcManager.getTokenAccountsByOwner(tokenAddress);
      
      // Return the count of unique holder addresses
      const uniqueHolders = new Set();
      tokenAccounts.forEach(account => {
        if (account.pubkey) uniqueHolders.add(account.pubkey);
      });
      
      return uniqueHolders.size;
    } catch (error) {
      this.logger.debug(`Failed to estimate holder count for ${tokenAddress}:`, error);
      return undefined;
    }
  }
}