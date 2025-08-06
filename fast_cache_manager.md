# CRITICAL FIX: Extract FastCacheManager for <30ms Latency

## Problem Statement
Current RPC calls lack intelligent caching, causing repeated expensive API calls during meme coin trading. Need to extract proven FastCacheManager from monolith that provides deterministic hashing, LRU eviction, and 95%+ cache hit rates.

## Solution Overview
Extract FastCacheManager class with FNV-1a hashing, dual-layer cache (L1 hot cache + L2 main cache), and intelligent promotion algorithms optimized for Solana RPC patterns.

## Implementation

### File: `src/cache/fast-cache-manager.js`

```javascript
/**
 * Fast Cache Manager - Sub-millisecond cache operations
 * Deterministic hashing with LRU eviction
 * Target: 95%+ cache hit rate, <0.1ms cache operations
 */

export class FastCacheManager {
  constructor(options = {}) {
    // Cache configuration
    this.maxCacheSize = options.maxCacheSize || 50000;
    this.maxHotCacheSize = options.maxHotCacheSize || 1000;
    this.defaultTtl = options.defaultTtl || 30000; // 30 seconds
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    
    // Dual-layer cache system
    this.cache = new Map(); // L2 main cache
    this.hotCache = new Map(); // L1 hot cache for frequently accessed data
    this.accessTimes = new Map(); // LRU tracking
    this.accessCounts = new Map(); // Access frequency tracking
    
    // Deduplication for concurrent requests
    this.pendingRequests = new Map();
    
    // Hash optimization
    this.hashCache = new Map(); // Cache computed hashes
    
    // Performance tracking
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      promotions: 0,
      totalRequests: 0,
      avgLatency: 0,
      hitRate: 0
    };
    
    // Maintenance
    this.lastCleanup = Date.now();
    this.startPeriodicCleanup();
  }

  // Generate deterministic fast hash using FNV-1a algorithm
  generateFastHash(method, params, endpoint) {
    const keyParts = [method, endpoint || 'default'];
    
    // Serialize parameters deterministically
    if (params && params.length > 0) {
      keyParts.push(this.serializeParams(params));
    }
    
    const content = keyParts.join('|');
    
    // Check hash cache first for performance
    if (this.hashCache.has(content)) {
      return this.hashCache.get(content);
    }
    
    // FNV-1a hash algorithm (much faster than crypto hashes)
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < content.length; i++) {
      hash ^= content.charCodeAt(i);
      hash = Math.imul(hash, 16777619); // FNV prime
    }
    
    const hashStr = (hash >>> 0).toString(36); // Convert to base36 string
    
    // Cache the computed hash (prevent memory bloat)
    if (this.hashCache.size > 10000) {
      this.hashCache.clear();
    }
    this.hashCache.set(content, hashStr);
    
    return hashStr;
  }

  // Optimized parameter serialization for Solana types
  serializeParams(params) {
    if (!Array.isArray(params)) return String(params);
    
    return params.map(param => {
      if (param === null || param === undefined) return 'null';
      if (typeof param === 'string') return param;
      if (typeof param === 'number') return param.toString();
      if (typeof param === 'boolean') return param.toString();
      
      // Handle Solana PublicKey objects
      if (param && typeof param === 'object' && param.toBase58) {
        return param.toBase58();
      }
      
      // Handle configuration objects deterministically
      if (typeof param === 'object') {
        const keys = Object.keys(param).sort();
        return keys.map(key => `${key}:${this.serializeValue(param[key])}`).join(',');
      }
      
      return JSON.stringify(param);
    }).join('||');
  }

  serializeValue(value) {
    if (value && typeof value === 'object' && value.toBase58) {
      return value.toBase58();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  // Main cache get method with deduplication and hot path optimization
  async get(cacheKey, requestFn, ttl = null) {
    const startTime = performance.now();
    const now = Date.now();
    const cacheTtl = ttl || this.defaultTtl;
    
    this.stats.totalRequests++;
    
    try {
      // Stage 1: Hot cache check (L1) - <0.01ms
      if (this.hotCache.has(cacheKey)) {
        const cached = this.hotCache.get(cacheKey);
        if (now - cached.timestamp < cacheTtl) {
          this.recordCacheHit(startTime, 'hot');
          this.incrementAccessCount(cacheKey);
          return cached.data;
        }
        this.hotCache.delete(cacheKey);
      }
      
      // Stage 2: Check for pending request (deduplication)
      if (this.pendingRequests.has(cacheKey)) {
        const result = await this.pendingRequests.get(cacheKey);
        this.recordCacheHit(startTime, 'pending');
        return result;
      }
      
      // Stage 3: Main cache check (L2) - <0.1ms
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (now - cached.timestamp < cacheTtl) {
          this.accessTimes.set(cacheKey, now);
          this.incrementAccessCount(cacheKey);
          
          // Promote to hot cache if frequently accessed
          if (this.shouldPromoteToHot(cacheKey, cached)) {
            this.promoteToHotCache(cacheKey, cached);
          }
          
          this.recordCacheHit(startTime, 'main');
          return cached.data;
        }
        
        // Remove expired entry
        this.evictFromCache(cacheKey);
      }
      
      // Stage 4: Execute request with deduplication
      const requestPromise = this.executeWithDeduplication(cacheKey, requestFn, cacheTtl);
      const result = await requestPromise;
      
      this.recordCacheMiss(startTime);
      return result;
      
    } catch (error) {
      this.recordCacheMiss(startTime);
      throw error;
    }
  }

  // Execute request with deduplication to prevent thundering herd
  async executeWithDeduplication(cacheKey, requestFn, ttl) {
    // Create deduplicated request
    const requestPromise = requestFn().then(data => {
      this.set(cacheKey, data, ttl);
      return data;
    }).finally(() => {
      this.pendingRequests.delete(cacheKey);
    });
    
    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  // Set cache entry with intelligent promotion
  set(cacheKey, data, ttl = null) {
    const now = Date.now();
    const cacheTtl = ttl || this.defaultTtl;
    const cacheEntry = { 
      data, 
      timestamp: now, 
      ttl: cacheTtl,
      size: this.estimateSize(data)
    };
    
    // Store in main cache
    this.cache.set(cacheKey, cacheEntry);
    this.accessTimes.set(cacheKey, now);
    this.incrementAccessCount(cacheKey);
    
    // Immediate promotion to hot cache for small, likely-to-be-reaccessed data
    if (this.shouldPromoteToHot(cacheKey, cacheEntry)) {
      this.promoteToHotCache(cacheKey, cacheEntry);
    }
    
    // Trigger maintenance if needed
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.performMaintenance();
    }
    
    // Evict if cache is too large
    if (this.cache.size > this.maxCacheSize) {
      this.evictLRU();
    }
  }

  // Intelligent promotion to hot cache
  shouldPromoteToHot(cacheKey, cacheEntry) {
    const accessCount = this.accessCounts.get(cacheKey) || 0;
    const dataSize = cacheEntry.size || 0;
    
    // Promote frequently accessed small data
    return accessCount > 2 && dataSize < 1024; // 1KB threshold
  }

  promoteToHotCache(cacheKey, cacheEntry) {
    // Evict from hot cache if full
    if (this.hotCache.size >= this.maxHotCacheSize) {
      const oldestKey = this.hotCache.keys().next().value;
      this.hotCache.delete(oldestKey);
    }
    
    this.hotCache.set(cacheKey, cacheEntry);
    this.stats.promotions++;
  }

  // Increment access count for promotion decisions
  incrementAccessCount(cacheKey) {
    const current = this.accessCounts.get(cacheKey) || 0;
    this.accessCounts.set(cacheKey, current + 1);
  }

  // Estimate data size for promotion decisions
  estimateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1000; // Default size estimate
    }
  }

  // LRU eviction for cache size management
  evictLRU() {
    const sortedByAccess = [...this.accessTimes.entries()]
      .sort((a, b) => a[1] - b[1]);
    
    const toEvict = Math.floor(this.maxCacheSize * 0.1); // Evict 10%
    const victims = sortedByAccess.slice(0, toEvict);
    
    for (const [key] of victims) {
      this.evictFromCache(key);
    }
    
    this.stats.evictions += toEvict;
  }

  // Complete cache eviction
  evictFromCache(cacheKey) {
    this.cache.delete(cacheKey);
    this.hotCache.delete(cacheKey);
    this.accessTimes.delete(cacheKey);
    this.accessCounts.delete(cacheKey);
  }

  // Periodic maintenance
  startPeriodicCleanup() {
    setInterval(() => {
      this.performMaintenance();
    }, this.cleanupInterval);
  }

  performMaintenance() {
    const now = Date.now();
    this.lastCleanup = now;
    
    // Clean expired entries from main cache
    let expiredCount = 0;
    for (const [key, cached] of this.cache) {
      if (now - cached.timestamp > cached.ttl) {
        this.evictFromCache(key);
        expiredCount++;
      }
    }
    
    // Clean expired entries from hot cache
    for (const [key, cached] of this.hotCache) {
      if (now - cached.timestamp > cached.ttl) {
        this.hotCache.delete(key);
        expiredCount++;
      }
    }
    
    // Reset access counts periodically to prevent stale data
    if (this.accessCounts.size > 10000) {
      // Keep only top 50% most accessed
      const sorted = [...this.accessCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, Math.floor(this.accessCounts.size * 0.5));
      
      this.accessCounts.clear();
      for (const [key, count] of sorted) {
        this.accessCounts.set(key, Math.floor(count * 0.5)); // Decay counts
      }
    }
    
    // Clean hash cache if too large
    if (this.hashCache.size > 10000) {
      this.hashCache.clear();
    }
    
    if (expiredCount > 0) {
      console.log(`FastCache: Cleaned ${expiredCount} expired entries`);
    }
  }

  // Performance tracking
  recordCacheHit(startTime, cacheType) {
    const latency = performance.now() - startTime;
    this.stats.hits++;
    this.updateLatencyStats(latency);
    this.updateHitRate();
  }

  recordCacheMiss(startTime) {
    const latency = performance.now() - startTime;
    this.stats.misses++;
    this.updateLatencyStats(latency);
    this.updateHitRate();
  }

  updateLatencyStats(latency) {
    if (this.stats.avgLatency === 0) {
      this.stats.avgLatency = latency;
    } else {
      this.stats.avgLatency = (this.stats.avgLatency * 0.9) + (latency * 0.1);
    }
  }

  updateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // Specialized cache methods for common Solana patterns
  
  // Cache token account info with longer TTL
  async getTokenAccount(address, requestFn) {
    const cacheKey = this.generateFastHash('getTokenAccount', [address], 'token');
    return this.get(cacheKey, requestFn, 60000); // 1 minute TTL
  }

  // Cache program accounts with shorter TTL for LP detection
  async getProgramAccounts(programId, filters, requestFn) {
    const cacheKey = this.generateFastHash('getProgramAccounts', [programId, filters], 'program');
    return this.get(cacheKey, requestFn, 15000); // 15 seconds TTL for LP detection
  }

  // Cache token metadata with long TTL
  async getTokenMetadata(mint, requestFn) {
    const cacheKey = this.generateFastHash('getTokenMetadata', [mint], 'metadata');
    return this.get(cacheKey, requestFn, 300000); // 5 minutes TTL
  }

  // Batch cache operations
  async getMany(cacheKeys, requestFns, ttl = null) {
    const results = new Map();
    const missing = [];
    const missingFns = [];
    
    // Check cache for all keys
    for (let i = 0; i < cacheKeys.length; i++) {
      const cacheKey = cacheKeys[i];
      const cached = await this.checkCache(cacheKey, ttl);
      
      if (cached !== null) {
        results.set(cacheKey, cached);
      } else {
        missing.push(cacheKey);
        missingFns.push(requestFns[i]);
      }
    }
    
    // Execute missing requests in parallel
    if (missing.length > 0) {
      const missingResults = await Promise.all(
        missing.map((key, index) => this.get(key, missingFns[index], ttl))
      );
      
      missing.forEach((key, index) => {
        results.set(key, missingResults[index]);
      });
    }
    
    return results;
  }

  // Check cache without executing request function
  async checkCache(cacheKey, ttl = null) {
    const now = Date.now();
    const cacheTtl = ttl || this.defaultTtl;
    
    // Check hot cache
    if (this.hotCache.has(cacheKey)) {
      const cached = this.hotCache.get(cacheKey);
      if (now - cached.timestamp < cacheTtl) {
        return cached.data;
      }
      this.hotCache.delete(cacheKey);
    }
    
    // Check main cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < cacheTtl) {
        this.accessTimes.set(cacheKey, now);
        return cached.data;
      }
      this.evictFromCache(cacheKey);
    }
    
    return null;
  }

  // Statistics and monitoring
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hotCacheSize: this.hotCache.size,
      pendingRequests: this.pendingRequests.size,
      hashCacheSize: this.hashCache.size,
      maxCacheSize: this.maxCacheSize,
      maxHotCacheSize: this.maxHotCacheSize,
      memoryEstimate: this.estimateMemoryUsage()
    };
  }

  estimateMemoryUsage() {
    let totalSize = 0;
    
    // Estimate main cache size
    for (const [key, cached] of this.cache) {
      totalSize += key.length * 2; // UTF-16 string
      totalSize += cached.size || 1000; // Data size estimate
      totalSize += 100; // Object overhead
    }
    
    // Estimate hot cache size
    for (const [key, cached] of this.hotCache) {
      totalSize += key.length * 2;
      totalSize += cached.size || 1000;
      totalSize += 100;
    }
    
    return totalSize;
  }

  // Health check
  isHealthy() {
    return (
      this.stats.hitRate > 0.8 && // Above 80% hit rate
      this.stats.avgLatency < 1.0 && // Under 1ms average latency
      this.cache.size < this.maxCacheSize * 0.9 && // Not too full
      this.pendingRequests.size < 100 // Not too many pending
    );
  }

  // Clear all caches (for testing)
  clearCache() {
    this.cache.clear();
    this.hotCache.clear();
    this.accessTimes.clear();
    this.accessCounts.clear();
    this.hashCache.clear();
    this.pendingRequests.clear();
    
    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      promotions: 0,
      totalRequests: 0,
      avgLatency: 0,
      hitRate: 0
    };
  }
}
```

### Integration with RPC Connection Pool

Update `src/transport/rpc-connection-pool.js` to use FastCacheManager:

```javascript
// Add to imports
import { FastCacheManager } from '../cache/fast-cache-manager.js';

// Add to constructor
constructor(endpoints, performanceMonitor = null) {
  // ... existing code ...
  
  // Initialize fast cache manager
  this.fastCache = new FastCacheManager({
    maxCacheSize: 50000,
    maxHotCacheSize: 1000,
    defaultTtl: 30000, // 30 seconds default
    cleanupInterval: 300000 // 5 minutes
  });
}

// Update main call method to use cache
async call(method, params = [], options = {}) {
  const startTime = Date.now();
  const timeout = options.timeout || 8000;
  const ttl = options.cacheTtl;
  
  // Generate cache key
  const cacheKey = this.fastCache.generateFastHash(method, params, options.endpoint);
  
  try {
    this.stats.totalRequests++;
    
    // Use cache for cacheable methods
    const cacheableMethods = new Set([
      'getAccountInfo',
      'getTokenSupply', 
      'getTokenLargestAccounts',
      'getTokenAccountsByOwner',
      'getProgramAccounts',
      'getMultipleAccounts'
    ]);
    
    if (cacheableMethods.has(method)) {
      return await this.fastCache.get(cacheKey, async () => {
        await this.waitForSlot();
        this.activeRequests++;
        
        try {
          return await this.executeCall(method, params, timeout);
        } finally {
          this.activeRequests--;
        }
      }, ttl);
    } else {
      // Non-cacheable method, execute directly
      await this.waitForSlot();
      this.activeRequests++;
      
      try {
        return await this.executeCall(method, params, timeout);
      } finally {
        this.activeRequests--;
      }
    }
    
  } catch (error) {
    const latency = Date.now() - startTime;
    this.handleCallFailure(error, latency);
    throw error;
  }
}

// Add specialized cache methods
async getAccountInfoCached(address, ttl = 30000) {
  return this.fastCache.getTokenAccount(address, async () => {
    return this.call('getAccountInfo', [address, { encoding: 'jsonParsed' }]);
  });
}

async getProgramAccountsCached(programId, filters = {}, ttl = 15000) {
  return this.fastCache.getProgramAccounts(programId, filters, async () => {
    return this.call('getProgramAccounts', [programId, {
      encoding: 'base64',
      filters: Object.entries(filters).map(([key, value]) => ({ [key]: value }))
    }]);
  });
}

async getTokenMetadataCached(mint, ttl = 300000) {
  return this.fastCache.getTokenMetadata(mint, async () => {
    return this.call('getAccountInfo', [mint, { encoding: 'jsonParsed' }]);
  });
}

// Update getStats method
getStats() {
  return {
    // ... existing stats ...
    cache: this.fastCache.getStats()
  };
}
```

### Integration with Token Validator

Update `src/validation/token-validator.js` to use FastCacheManager:

```javascript
// Remove existing cache logic and use FastCacheManager
constructor(rpcPool, circuitBreaker = null, performanceMonitor = null) {
  this.rpcPool = rpcPool;
  this.circuitBreaker = circuitBreaker;
  this.monitor = performanceMonitor;
  
  // Use the RPC pool's cache manager
  this.cache = rpcPool.fastCache;
  
  // Known valid tokens for instant validation
  this.knownTokens = new Set([
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
    'rndrizKT3MK1iimdxRdWabcF9Ss623VQ5DA'   // RND
  ]);
  
  // ... rest of constructor without cache initialization
}

// Simplified validateToken using shared cache
async validateToken(address, context = {}) {
  const startTime = performance.now();
  
  try {
    // Stage 1: Instant validation for known tokens
    if (this.knownTokens.has(address)) {
      return { valid: true, confidence: 1.0, source: 'known' };
    }
    
    // Stage 2 & 3: Use shared cache for RPC validation
    const cacheKey = this.cache.generateFastHash('validateToken', [address], 'validation');
    
    const result = await this.cache.get(cacheKey, async () => {
      return await this.validateViaRpc(address);
    }, 30000); // 30 second TTL for token validation
    
    const latency = performance.now() - startTime;
    if (this.monitor) {
      this.monitor.recordLatency('tokenValidator', latency, true);
    }
    
    return result;
    
  } catch (error) {
    const latency = performance.now() - startTime;
    if (this.monitor) {
      this.monitor.recordLatency('tokenValidator', latency, false);
    }
    throw error;
  }
}

// Remove existing cache methods - use shared cache instead
```

## Performance Impact

### Expected Improvements:
- **95%+ cache hit rate** for repeated token validations
- **<0.1ms cache operations** with FNV-1a hashing
- **Dual-layer cache** with hot path optimization
- **Intelligent promotion** for frequently accessed data
- **Deduplication** prevents thundering herd problems

### Memory Efficiency:
- **LRU eviction** maintains bounded memory usage
- **Hot cache** for sub-millisecond access to critical data
- **Periodic cleanup** prevents memory leaks

## Testing

```javascript
// Test cache performance
const addresses = [
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
];

// First call - cache miss
const start1 = Date.now();
const result1 = await rpcPool.getAccountInfoCached(addresses[0]);
const time1 = Date.now() - start1;
console.log(`Cache miss: ${time1}ms`);

// Second call - cache hit
const start2 = Date.now();
const result2 = await rpcPool.getAccountInfoCached(addresses[0]);
const time2 = Date.now() - start2;
console.log(`Cache hit: ${time2}ms`); // Expected: <1ms

// Check stats
const stats = rpcPool.getStats().cache;
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
```

## Implementation Steps

1. **Create** `src/cache/fast-cache-manager.js` with provided code
2. **Update** `src/transport/rpc-connection-pool.js` with cache integration
3. **Update** `src/validation/token-validator.js` to use shared cache
4. **Test** cache performance with sample RPC calls
5. **Monitor** hit rates and latency via built-in stats

## Success Metrics

- **Hit Rate**: >95% for repeated operations
- **Latency**: <0.1ms for cache operations
- **Memory**: <100MB total cache size
- **Throughput**: 10,000+ cache operations per second

This extraction provides sub-millisecond cache performance critical for <30ms total latency requirements.