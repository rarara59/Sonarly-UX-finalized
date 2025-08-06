/**
 * Renaissance Fast Cache Manager
 * Simple, Fast, Reliable - No Academic Over-Engineering
 * Target: <0.1ms cache operations, 95%+ hit rate
 */

export class FastCacheManager {
  constructor(options = {}) {
    // Single cache layer - simple and fast
    this.cache = new Map();
    this.maxSize = options.maxSize || 10000;
    this.defaultTtl = options.defaultTtl || 30000; // 30 seconds
    
    // Simple stats
    this.stats = { hits: 0, misses: 0 };
    
    // Cleanup every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  // Simple, fast cache key generation
  generateKey(method, params) {
    // Simple string concatenation - faster than hashing
    return `${method}:${JSON.stringify(params)}`;
  }

  // Main cache method - fast and reliable
  get(key, requestFn, ttl = null) {
    const now = Date.now();
    const maxAge = ttl || this.defaultTtl;
    
    // Check cache (synchronous - <0.1ms)
    const cached = this.cache.get(key);
    if (cached && (now - cached.timestamp) < maxAge) {
      this.stats.hits++;
      return Promise.resolve(cached.data);
    }
    
    // Cache miss - execute request
    this.stats.misses++;
    return this.executeAndCache(key, requestFn, maxAge);
  }

  // Execute request and cache result
  async executeAndCache(key, requestFn, ttl) {
    try {
      const data = await requestFn();
      
      // Cache the result
      this.cache.set(key, {
        data: data,
        timestamp: Date.now()
      });
      
      // Evict oldest if cache too large
      if (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      return data;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  // Token-specific cache methods with appropriate TTLs
  
  // Cache token validation (30 seconds)
  getTokenValidation(address, requestFn) {
    const key = this.generateKey('token_validation', [address]);
    return this.get(key, requestFn, 30000);
  }

  // Cache token metadata (5 minutes - rarely changes)
  getTokenMetadata(mint, requestFn) {
    const key = this.generateKey('token_metadata', [mint]);
    return this.get(key, requestFn, 300000);
  }

  // Cache LP data (15 seconds - changes frequently)
  getLpData(lpAddress, requestFn) {
    const key = this.generateKey('lp_data', [lpAddress]);
    return this.get(key, requestFn, 15000);
  }

  // Batch cache operations
  async getMany(keys, requestFns, ttl = null) {
    const results = [];
    const missing = [];
    const missingFns = [];
    
    // Check cache for all keys (fast)
    for (let i = 0; i < keys.length; i++) {
      const cached = this.checkCacheOnly(keys[i], ttl);
      if (cached !== null) {
        results[i] = cached;
      } else {
        missing.push({ index: i, key: keys[i], fn: requestFns[i] });
      }
    }
    
    // Execute missing requests in parallel
    if (missing.length > 0) {
      const promises = missing.map(item => 
        this.executeAndCache(item.key, item.fn, ttl || this.defaultTtl)
      );
      const missingResults = await Promise.all(promises);
      
      // Fill in results
      missing.forEach((item, idx) => {
        results[item.index] = missingResults[idx];
      });
    }
    
    return results;
  }

  // Check cache only (no request execution)
  checkCacheOnly(key, ttl = null) {
    const now = Date.now();
    const maxAge = ttl || this.defaultTtl;
    
    const cached = this.cache.get(key);
    if (cached && (now - cached.timestamp) < maxAge) {
      return cached.data;
    }
    
    return null;
  }

  // Simple cleanup - remove expired entries
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, cached] of this.cache) {
      if ((now - cached.timestamp) > (this.defaultTtl * 2)) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`Cache: Cleaned ${removed} expired entries`);
    }
  }

  // Simple stats
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }

  // Health check
  isHealthy() {
    const stats = this.getStats();
    return stats.hitRate > 0.8 && this.cache.size < this.maxSize;
  }

  // Clear cache (for testing)
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }
}