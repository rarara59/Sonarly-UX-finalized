// src/scripts-js/data-cache.js
const { EventEmitter } = require('events');

/**
 * LRU Cache Node for efficient memory management
 */
class LRUCacheNode {
  constructor(key, value, ttl = null) {
    this.key = key;
    this.value = value;
    this.ttl = ttl;
    this.createdAt = Date.now();
    this.accessCount = 1;
    this.lastAccessed = Date.now();
    this.prev = null;
    this.next = null;
  }
  
  isExpired() {
    return this.ttl && (Date.now() - this.createdAt) > this.ttl;
  }
  
  touch() {
    this.lastAccessed = Date.now();
    this.accessCount++;
  }
}

/**
 * Data Cache - Renaissance-Grade Performance Optimization
 * Implements LRU cache with TTL, compression, and intelligent eviction
 */
class DataCache extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Cache size limits
      maxSize: config.maxSize || 10000,
      maxMemoryMB: config.maxMemoryMB || 500,
      
      // TTL configuration
      defaultTTL: config.defaultTTL || 300000, // 5 minutes
      tokenDataTTL: config.tokenDataTTL || 60000, // 1 minute
      marketDataTTL: config.marketDataTTL || 30000, // 30 seconds
      enrichedDataTTL: config.enrichedDataTTL || 180000, // 3 minutes
      
      // Performance optimization
      enableCompression: config.enableCompression !== false,
      compressionThreshold: config.compressionThreshold || 1024, // 1KB
      
      // Cache warming
      enableCacheWarming: config.enableCacheWarming !== false,
      warmingBatchSize: config.warmingBatchSize || 100,
      
      // Eviction policies
      evictionPolicy: config.evictionPolicy || 'lru', // 'lru', 'lfu', 'ttl'
      evictionBatchSize: config.evictionBatchSize || 50,
      
      // Monitoring
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 60000, // 1 minute
      
      // Persistence
      enablePersistence: config.enablePersistence || false,
      persistencePath: config.persistencePath || './cache-data.json'
    };
    
    // Cache storage
    this.cache = new Map();
    this.head = null; // Most recently used
    this.tail = null; // Least recently used
    this.size = 0;
    
    // Cache categories for different TTLs
    this.categories = {
      token: this.config.tokenDataTTL,
      market: this.config.marketDataTTL,
      enriched: this.config.enrichedDataTTL,
      default: this.config.defaultTTL
    };
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      compressions: 0,
      decompressions: 0,
      
      // Memory metrics
      currentMemoryUsage: 0,
      maxMemoryUsage: 0,
      
      // Performance metrics
      averageGetTime: 0,
      averageSetTime: 0,
      hitRate: 0,
      
      // Category metrics
      categoryStats: {},
      
      // TTL metrics
      expiredItems: 0,
      ttlHits: 0,
      
      lastUpdated: new Date()
    };
    
    // Background tasks
    this.cleanupInterval = null;
    this.metricsInterval = null;
    
    this.isInitialized = false;
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, ...args) => console.log(`[DataCache] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[DataCache] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[DataCache] ${msg}`, ...args),
      debug: (msg, ...args) => console.debug(`[DataCache] ${msg}`, ...args)
    };
  }

  /**
   * Initialize cache
   */
  async initialize() {
    if (this.isInitialized) return;
    
    this.logger.info('🚀 Initializing Data Cache...');
    
    try {
      // Initialize category stats
      Object.keys(this.categories).forEach(category => {
        this.metrics.categoryStats[category] = {
          hits: 0,
          misses: 0,
          sets: 0,
          size: 0
        };
      });
      
      // Load persisted data if enabled
      if (this.config.enablePersistence) {
        await this.loadPersistedData();
      }
      
      // Start background tasks
      this.startBackgroundTasks();
      
      this.isInitialized = true;
      this.logger.info('✅ Data Cache initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Data Cache:', error);
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  get(key) {
    const startTime = Date.now();
    
    try {
      const node = this.cache.get(key);
      
      if (!node) {
        this.metrics.misses++;
        this.updateCategoryStats(key, 'misses');
        this.updateMetrics('get', startTime);
        return null;
      }
      
      // Check if expired
      if (node.isExpired()) {
        this.delete(key);
        this.metrics.misses++;
        this.metrics.expiredItems++;
        this.updateCategoryStats(key, 'misses');
        this.updateMetrics('get', startTime);
        return null;
      }
      
      // Move to head (most recently used)
      this.moveToHead(node);
      node.touch();
      
      // Decompress if needed
      const value = this.decompress(node.value);
      
      this.metrics.hits++;
      this.updateCategoryStats(key, 'hits');
      this.updateMetrics('get', startTime);
      
      return value;
      
    } catch (error) {
      this.logger.error('Cache get error:', error);
      this.updateMetrics('get', startTime);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null) {
    const startTime = Date.now();
    
    try {
      // Determine TTL based on key category
      const effectiveTTL = ttl || this.getTTLForKey(key);
      
      // Compress value if needed
      const compressedValue = this.compress(value);
      
      // Check if key already exists
      if (this.cache.has(key)) {
        const existingNode = this.cache.get(key);
        existingNode.value = compressedValue;
        existingNode.ttl = effectiveTTL;
        existingNode.createdAt = Date.now();
        existingNode.touch();
        this.moveToHead(existingNode);
      } else {
        // Create new node
        const node = new LRUCacheNode(key, compressedValue, effectiveTTL);
        this.cache.set(key, node);
        this.addToHead(node);
        this.size++;
        
        // Evict if necessary
        if (this.size > this.config.maxSize) {
          this.evictLRU();
        }
      }
      
      this.metrics.sets++;
      this.updateCategoryStats(key, 'sets');
      this.updateMemoryUsage();
      this.updateMetrics('set', startTime);
      
      return true;
      
    } catch (error) {
      this.logger.error('Cache set error:', error);
      this.updateMetrics('set', startTime);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }
    
    this.cache.delete(key);
    this.removeNode(node);
    this.size--;
    
    this.metrics.deletes++;
    this.updateMemoryUsage();
    
    return true;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.size = 0;
    this.metrics.currentMemoryUsage = 0;
    
    this.logger.info('Cache cleared');
  }

  /**
   * Get multiple values
   */
  mget(keys) {
    const results = {};
    
    keys.forEach(key => {
      results[key] = this.get(key);
    });
    
    return results;
  }

  /**
   * Set multiple values
   */
  mset(keyValuePairs, ttl = null) {
    const results = {};
    
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      results[key] = this.set(key, value, ttl);
    });
    
    return results;
  }

  /**
   * Check if key exists
   */
  has(key) {
    const node = this.cache.get(key);
    return node && !node.isExpired();
  }

  /**
   * Get cache size
   */
  getSize() {
    return this.size;
  }

  /**
   * Get cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache values
   */
  values() {
    return Array.from(this.cache.values()).map(node => this.decompress(node.value));
  }

  /**
   * Store data with category
   */
  store(data) {
    const key = this.generateKey(data);
    const category = this.determineCategory(data);
    const ttl = this.categories[category];
    
    return this.set(key, data, ttl);
  }

  /**
   * Generate cache key from data
   */
  generateKey(data) {
    if (data.tokenAddress) {
      return `token:${data.tokenAddress}:${data.type || 'default'}`;
    } else if (data.type === 'market') {
      return `market:${Date.now()}`;
    } else {
      return `generic:${JSON.stringify(data).substring(0, 100)}`;
    }
  }

  /**
   * Determine data category
   */
  determineCategory(data) {
    if (data.type === 'token') {
      return 'token';
    } else if (data.type === 'market') {
      return 'market';
    } else if (data.enrichmentMetadata) {
      return 'enriched';
    } else {
      return 'default';
    }
  }

  /**
   * Get TTL for specific key
   */
  getTTLForKey(key) {
    if (key.startsWith('token:')) {
      return this.config.tokenDataTTL;
    } else if (key.startsWith('market:')) {
      return this.config.marketDataTTL;
    } else if (key.includes('enriched')) {
      return this.config.enrichedDataTTL;
    } else {
      return this.config.defaultTTL;
    }
  }

  /**
   * Compress value if needed
   */
  compress(value) {
    const valueStr = JSON.stringify(value);
    
    if (this.config.enableCompression && valueStr.length > this.config.compressionThreshold) {
      // Simple compression simulation (in production, use actual compression)
      this.metrics.compressions++;
      return {
        compressed: true,
        data: valueStr, // Would be actual compressed data
        originalSize: valueStr.length
      };
    }
    
    return value;
  }

  /**
   * Decompress value if needed
   */
  decompress(value) {
    if (value && value.compressed) {
      this.metrics.decompressions++;
      return JSON.parse(value.data);
    }
    
    return value;
  }

  /**
   * Move node to head (most recently used)
   */
  moveToHead(node) {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * Add node to head
   */
  addToHead(node) {
    node.prev = null;
    node.next = this.head;
    
    if (this.head) {
      this.head.prev = node;
    }
    
    this.head = node;
    
    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove node from linked list
   */
  removeNode(node) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    if (!this.tail) return;
    
    this.cache.delete(this.tail.key);
    this.removeNode(this.tail);
    this.size--;
    this.metrics.evictions++;
  }

  /**
   * Evict expired items
   */
  evictExpired() {
    let expiredCount = 0;
    const now = Date.now();
    
    for (const [key, node] of this.cache) {
      if (node.isExpired()) {
        this.cache.delete(key);
        this.removeNode(node);
        this.size--;
        expiredCount++;
        
        if (expiredCount >= this.config.evictionBatchSize) {
          break;
        }
      }
    }
    
    this.metrics.evictions += expiredCount;
    this.metrics.expiredItems += expiredCount;
    
    if (expiredCount > 0) {
      this.logger.debug(`Evicted ${expiredCount} expired items`);
    }
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    // Cleanup expired items every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.evictExpired();
    }, 30000);
    
    // Update metrics
    if (this.config.enableMetrics) {
      this.metricsInterval = setInterval(() => {
        this.updateCacheMetrics();
      }, this.config.metricsInterval);
    }
    
    this.logger.info('🔄 Background tasks started');
  }

  /**
   * Stop background tasks
   */
  stopBackgroundTasks() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Update cache metrics
   */
  updateCacheMetrics() {
    const totalOperations = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = totalOperations > 0 ? (this.metrics.hits / totalOperations) * 100 : 0;
    this.metrics.lastUpdated = new Date();
    
    this.emit('metricsUpdated', this.metrics);
  }

  /**
   * Update category statistics
   */
  updateCategoryStats(key, operation) {
    const category = this.getCategoryFromKey(key);
    
    if (this.metrics.categoryStats[category]) {
      this.metrics.categoryStats[category][operation]++;
      
      if (operation === 'sets') {
        this.metrics.categoryStats[category].size++;
      }
    }
  }

  /**
   * Get category from key
   */
  getCategoryFromKey(key) {
    if (key.startsWith('token:')) return 'token';
    if (key.startsWith('market:')) return 'market';
    if (key.includes('enriched')) return 'enriched';
    return 'default';
  }

  /**
   * Update memory usage estimation
   */
  updateMemoryUsage() {
    let memoryUsage = 0;
    
    for (const node of this.cache.values()) {
      const nodeSize = JSON.stringify(node.value).length * 2; // Rough estimate
      memoryUsage += nodeSize;
    }
    
    this.metrics.currentMemoryUsage = memoryUsage;
    this.metrics.maxMemoryUsage = Math.max(this.metrics.maxMemoryUsage, memoryUsage);
    
    // Trigger memory cleanup if needed
    if (memoryUsage > this.config.maxMemoryMB * 1024 * 1024) {
      this.performMemoryCleanup();
    }
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup() {
    const targetSize = Math.floor(this.config.maxSize * 0.8);
    
    while (this.size > targetSize && this.tail) {
      this.evictLRU();
    }
    
    this.logger.info(`Memory cleanup: reduced cache size to ${this.size}`);
  }

  /**
   * Update operation metrics
   */
  updateMetrics(operation, startTime) {
    const operationTime = Date.now() - startTime;
    
    if (operation === 'get') {
      this.metrics.averageGetTime = (this.metrics.averageGetTime + operationTime) / 2;
    } else if (operation === 'set') {
      this.metrics.averageSetTime = (this.metrics.averageSetTime + operationTime) / 2;
    }
  }

  /**
   * Load persisted data
   */
  async loadPersistedData() {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(this.config.persistencePath, 'utf8');
      const persistedData = JSON.parse(data);
      
      // Restore cache entries
      persistedData.entries.forEach(entry => {
        this.set(entry.key, entry.value, entry.ttl);
      });
      
      this.logger.info(`Loaded ${persistedData.entries.length} cached entries`);
      
    } catch (error) {
      this.logger.info('No persisted cache data found or failed to load');
    }
  }

  /**
   * Persist cache data
   */
  async persistData() {
    if (!this.config.enablePersistence) return;
    
    try {
      const fs = require('fs').promises;
      const entries = [];
      
      for (const [key, node] of this.cache) {
        if (!node.isExpired()) {
          entries.push({
            key,
            value: node.value,
            ttl: node.ttl,
            createdAt: node.createdAt
          });
        }
      }
      
      const persistData = {
        entries,
        timestamp: new Date(),
        version: '1.0.0'
      };
      
      await fs.writeFile(this.config.persistencePath, JSON.stringify(persistData, null, 2));
      this.logger.info(`Persisted ${entries.length} cache entries`);
      
    } catch (error) {
      this.logger.error('Failed to persist cache data:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.size,
      maxSize: this.config.maxSize,
      
      // Hit rate metrics
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: this.metrics.hitRate,
      
      // Operation metrics
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      evictions: this.metrics.evictions,
      
      // Memory metrics
      currentMemoryUsage: this.metrics.currentMemoryUsage,
      maxMemoryUsage: this.metrics.maxMemoryUsage,
      memoryUsageMB: this.metrics.currentMemoryUsage / (1024 * 1024),
      
      // Performance metrics
      averageGetTime: this.metrics.averageGetTime,
      averageSetTime: this.metrics.averageSetTime,
      
      // Compression metrics
      compressions: this.metrics.compressions,
      decompressions: this.metrics.decompressions,
      
      // TTL metrics
      expiredItems: this.metrics.expiredItems,
      ttlHits: this.metrics.ttlHits,
      
      // Category breakdown
      categoryStats: this.metrics.categoryStats,
      
      lastUpdated: this.metrics.lastUpdated
    };
  }

  /**
   * Get cache health status
   */
  getHealthStatus() {
    const stats = this.getStats();
    const memoryUsagePercent = (stats.memoryUsageMB / this.config.maxMemoryMB) * 100;
    const sizeUsagePercent = (stats.size / this.config.maxSize) * 100;
    
    let status = 'HEALTHY';
    
    if (memoryUsagePercent > 90 || sizeUsagePercent > 90) {
      status = 'CRITICAL';
    } else if (memoryUsagePercent > 70 || sizeUsagePercent > 70) {
      status = 'WARNING';
    }
    
    return {
      status,
      memoryUsagePercent,
      sizeUsagePercent,
      hitRate: stats.hitRate,
      averageLatency: (stats.averageGetTime + stats.averageSetTime) / 2,
      lastChecked: new Date()
    };
  }

  /**
   * Shutdown cache
   */
  async shutdown() {
    this.stopBackgroundTasks();
    
    if (this.config.enablePersistence) {
      await this.persistData();
    }
    
    this.clear();
    this.logger.info('Cache shutdown complete');
  }
}

module.exports = DataCache;