// src/services/lp-event-cache.service.ts
import { logger } from '../utils/logger';

export interface CachedLPEvent {
  tokenAddress: string;
  lpValueUSD: number;
  quoteToken: string;
  timestamp: number;
  deployer: string;
  hasInitialBuys: boolean;
  dex: string;
  txHash: string;
}

interface CacheEntry {
  event: CachedLPEvent;
  cachedAt: number;
  retrievedCount: number;
}

class LPEventCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL_MS = 15 * 60 * 1000; // 15 minutes
  private readonly WRITE_THROTTLE_MS = 2000; // 2 seconds between writes for same token
  private lastWriteTimes: Map<string, number> = new Map();
  private totalStored = 0;
  private totalRetrieved = 0;

  constructor() {
    logger.info('💾 [LP_CACHE] LPEventCache initialized');
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  store(event: CachedLPEvent): boolean {
    const now = Date.now();
    const tokenAddress = event.tokenAddress;
    
    logger.info(`💾 [LP_CACHE] store() called for token: ${tokenAddress}`);
    logger.info(`📝 [LP_CACHE] Event details: dex=${event.dex}, lpValue=$${event.lpValueUSD}, deployer=${event.deployer.slice(0, 8)}, hasInitialBuys=${event.hasInitialBuys}`);

    // Check write throttling
    const lastWrite = this.lastWriteTimes.get(tokenAddress);
    if (lastWrite && (now - lastWrite) < this.WRITE_THROTTLE_MS) {
      logger.info(`⏸️ [LP_CACHE] Write throttled for ${tokenAddress} (last write ${now - lastWrite}ms ago)`);
      return false;
    }

    // Check if already exists
    if (this.cache.has(tokenAddress)) {
      logger.info(`🔄 [LP_CACHE] Token ${tokenAddress} already in cache, updating...`);
    } else {
      logger.info(`🆕 [LP_CACHE] Adding new token ${tokenAddress} to cache`);
    }

    // Store the event
    this.cache.set(tokenAddress, {
      event,
      cachedAt: now,
      retrievedCount: 0
    });
    
    this.lastWriteTimes.set(tokenAddress, now);
    this.totalStored++;
    
    logger.info(`✅ [LP_CACHE] Successfully stored token ${tokenAddress}. Cache size: ${this.cache.size}, Total stored: ${this.totalStored}`);
    
    // Log cache contents summary
    if (this.cache.size <= 10) {
      logger.info(`📊 [LP_CACHE] Current cache contents: [${Array.from(this.cache.keys()).map(k => k.slice(0, 8)).join(', ')}]`);
    } else {
      logger.info(`📊 [LP_CACHE] Cache size: ${this.cache.size} tokens (too many to list)`);
    }
    
    return true;
  }

  getAll(): CachedLPEvent[] {
    const now = Date.now();
    const validEvents: CachedLPEvent[] = [];
    let expiredCount = 0;

    logger.info(`🔍 [LP_CACHE] getAll() called. Current cache size: ${this.cache.size}`);

    for (const [tokenAddress, entry] of this.cache.entries()) {
      const age = now - entry.cachedAt;
      
      if (age > this.TTL_MS) {
        logger.debug(`⏰ [LP_CACHE] Token ${tokenAddress} expired (age: ${(age/1000/60).toFixed(1)}min)`);
        expiredCount++;
        continue;
      }

      // Update retrieval count
      entry.retrievedCount++;
      validEvents.push(entry.event);
      
      logger.debug(`📤 [LP_CACHE] Retrieved ${tokenAddress} (retrieved ${entry.retrievedCount} times, age: ${(age/1000/60).toFixed(1)}min)`);
    }

    this.totalRetrieved += validEvents.length;
    
    logger.info(`📊 [LP_CACHE] getAll() returning ${validEvents.length} valid events (${expiredCount} expired, ignored)`);
    
    if (validEvents.length > 0) {
      logger.info(`📋 [LP_CACHE] Valid events: [${validEvents.map(e => `${e.tokenAddress.slice(0, 8)}($${e.lpValueUSD})`).join(', ')}]`);
    } else {
      logger.info(`❌ [LP_CACHE] No valid events in cache!`);
      
      // Detailed diagnosis when cache is empty
      if (this.cache.size === 0) {
        logger.info(`🔍 [LP_CACHE] DIAGNOSIS: Cache is completely empty. Total ever stored: ${this.totalStored}`);
      } else {
        logger.info(`🔍 [LP_CACHE] DIAGNOSIS: Cache has ${this.cache.size} entries but all expired. Checking expiration times...`);
        for (const [tokenAddress, entry] of this.cache.entries()) {
          const age = now - entry.cachedAt;
          logger.info(`   - ${tokenAddress.slice(0, 8)}: age=${(age/1000/60).toFixed(1)}min (TTL=${this.TTL_MS/1000/60}min)`);
        }
      }
    }

    return validEvents;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { 
    totalStored: number; 
    totalRetrieved: number; 
    currentSize: number; 
    hitRate: number;
  } {
    const hitRate = this.totalStored > 0 ? (this.totalRetrieved / this.totalStored) * 100 : 0;
    
    return {
      totalStored: this.totalStored,
      totalRetrieved: this.totalRetrieved,
      currentSize: this.cache.size,
      hitRate
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    let removedThrottleCount = 0;

    logger.debug(`🧹 [LP_CACHE] Starting cleanup...`);

    // Clean expired cache entries
    for (const [tokenAddress, entry] of this.cache.entries()) {
      if ((now - entry.cachedAt) > this.TTL_MS) {
        this.cache.delete(tokenAddress);
        removedCount++;
      }
    }

    // Clean expired throttle entries
    for (const [tokenAddress, lastWrite] of this.lastWriteTimes.entries()) {
      if ((now - lastWrite) > this.TTL_MS) {
        this.lastWriteTimes.delete(tokenAddress);
        removedThrottleCount++;
      }
    }

    if (removedCount > 0 || removedThrottleCount > 0) {
      logger.info(`🧹 [LP_CACHE] Cleanup completed: removed ${removedCount} cache entries, ${removedThrottleCount} throttle entries. Cache size: ${this.cache.size}`);
    }
  }

  // Debug method to get detailed cache state
  getDetailedState(): any {
    const now = Date.now();
    const cacheState = [];
    
    for (const [tokenAddress, entry] of this.cache.entries()) {
      const age = now - entry.cachedAt;
      cacheState.push({
        tokenAddress: tokenAddress.slice(0, 8),
        dex: entry.event.dex,
        lpValueUSD: entry.event.lpValueUSD,
        ageMinutes: (age / 1000 / 60).toFixed(1),
        retrievedCount: entry.retrievedCount,
        isExpired: age > this.TTL_MS
      });
    }
    
    return {
      cacheSize: this.cache.size,
      totalStored: this.totalStored,
      totalRetrieved: this.totalRetrieved,
      entries: cacheState
    };
  }

  // Test method to manually add an entry for debugging
  addTestEntry(tokenAddress: string): void {
    const testEvent: CachedLPEvent = {
      tokenAddress,
      lpValueUSD: 10000,
      quoteToken: 'SOL',
      timestamp: Math.floor(Date.now() / 1000),
      deployer: 'TEST_DEPLOYER',
      hasInitialBuys: true,
      dex: 'TEST_DEX',
      txHash: 'TEST_TX_HASH'
    };
    
    this.store(testEvent);
    logger.info(`🧪 [LP_CACHE] Test entry added: ${tokenAddress}`);
  }
}

// Export singleton instance
export const LPEventCache = new LPEventCacheService();