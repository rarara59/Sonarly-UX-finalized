// src/services/lp-event-cache.service.ts

/**
 * Simple in-memory cache to store recent liquidity pool creation events.
 * Should be replaced by a persistent store (e.g., Redis, Mongo) in production.
 */

export interface CachedLPEvent {
  tokenAddress: string;
  lpValueUSD: number;
  quoteToken: string;
  timestamp: number;         // UNIX timestamp (seconds)
  deployer: string;
  hasInitialBuys: boolean;
  dex: string;
  txHash: string;
}

export class LPEventCache {
  private static cache: Map<string, CachedLPEvent> = new Map();
  private static lastWriteTimestamps: Map<string, number> = new Map();
  private static readonly MAX_AGE_MS = 15 * 60 * 1000;       // 15 minutes
  private static readonly WRITE_THROTTLE_MS = 30 * 1000;     // 30 seconds

  /**
   * Store a new LP event if it's not throttled.
   */
  public static store(event: CachedLPEvent): void {
    const now = Date.now();
    const lastWrite = this.lastWriteTimestamps.get(event.tokenAddress) || 0;

    if (now - lastWrite < this.WRITE_THROTTLE_MS) {
      return; // Throttle frequent updates for same token
    }

    this.lastWriteTimestamps.set(event.tokenAddress, now);
    this.cache.set(event.tokenAddress, event);
  }

  /**
   * Retrieve a single token event by address, enforcing freshness.
   */
  public static async getByTokenAddress(tokenAddress: string): Promise<CachedLPEvent | null> {
    const event = this.cache.get(tokenAddress);
    if (!event) return null;

    const age = Date.now() - event.timestamp * 1000; // convert UNIX seconds to ms
    if (age > this.MAX_AGE_MS) {
      this.cache.delete(tokenAddress);
      this.lastWriteTimestamps.delete(tokenAddress);
      return null;
    }

    return event;
  }

  /**
   * Return all valid (non-expired) cached LP events.
   */
  public static getAll(): CachedLPEvent[] {
    this.cleanup(); // Prune old entries first
    return Array.from(this.cache.values());
  }

  /**
   * Remove all expired entries from the cache.
   */
  public static cleanup(): void {
    const now = Date.now();
    for (const [key, event] of this.cache.entries()) {
      const age = now - event.timestamp * 1000;
      if (age > this.MAX_AGE_MS) {
        this.cache.delete(key);
        this.lastWriteTimestamps.delete(key);
      }
    }
  }
}

// Optional: background cleanup every 5 minutes
setInterval(() => LPEventCache.cleanup(), 5 * 60 * 1000);