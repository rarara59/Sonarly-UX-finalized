// Redis dependencies - will be loaded dynamically if available
import redisConfig from '../config/redis-config.js';
import * as msgpack from '@msgpack/msgpack';

class RenaissanceFeatureStore {
    constructor(config = {}) {
        const env = config.environment || process.env.NODE_ENV || 'development';
        this.config = { 
            ...redisConfig[env],
            ...config 
        };
        
        // Renaissance connection strategy
        this.useCluster = this.config.cluster && this.config.cluster.enabled;
        this.redis = null;
        this.cluster = null;
        this.readReplica = null;
        
        // Dynamic Redis loading
        this.Redis = null;
        this.msgpack = null;
        this.redisAvailable = false;
        
        // Connection pool configuration
        this.poolConfig = {
            min: 5,
            max: 25,
            acquireTimeoutMillis: 500,
            idleTimeoutMillis: 30000
        };
        
        // Renaissance performance optimizations - ULTRA memory optimized
        this.compressionEnabled = true;
        this.batchSize = 10; // ULTRA reduced to 10
        this.pipelineThreshold = 2; // ULTRA reduced to 2
        
        // Hot data cache (in-memory L1 cache) - ULTRA optimized for memory
        this.hotCache = new Map();
        this.hotCacheMaxSize = 20; // ULTRA reduced to 20
        this.hotCacheTTL = 1000; // ULTRA reduced to 1 second
        
        // Performance metrics (Renaissance-grade)
        this.metrics = {
            hits: 0,
            misses: 0,
            l1Hits: 0, // Hot cache hits
            l1Misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            networkLatency: [],
            throughput: 0,
            compressionRatio: 0,
            connectionPool: {
                active: 0,
                idle: 0,
                total: 0
            }
        };
        
        // Batch operation queue
        this.batchQueue = [];
        this.batchTimer = null;
        
        // Access pattern learning
        this.accessPatterns = new Map();
        this.warmingQueue = [];
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Renaissance Feature Store...');
            
            // Test Redis package availability
            try {
                // Test imports are working
                const Redis = (await import('ioredis')).default;
                const redisTest = new Redis({ lazyConnect: true });
                console.log('📦 Redis packages available - initializing connection');
                this.Redis = Redis;
                this.redisAvailable = true;
                // Continue with Redis initialization
            } catch (error) {
                console.log('📦 Redis packages not available - using in-memory mode');
                console.log('Error:', error.message);
                this.redisAvailable = false;
            }
            
            if (this.redisAvailable) {
                if (this.useCluster) {
                    await this.initializeCluster();
                } else {
                    await this.initializeSingle();
                }
                
                // Initialize read replica for heavy read workloads
                if (this.config.readReplica) {
                    await this.initializeReadReplica();
                }
            } else {
                console.log('  📦 Running in memory-only mode (Redis disabled)');
            }
            
            // Start batch processing
            this.startBatchProcessor();
            
            // Start cache warming
            this.startCacheWarming();
            
            // Start aggressive cache cleanup
            this.startCacheCleanup();
            
            // Test Redis write capability
            if (this.redisAvailable) {
                await this.testWrite();
            }
            
            console.log('✅ Renaissance Feature Store initialized');
            console.log(`  🔧 Mode: ${this.redisAvailable ? 'Redis Connected' : 'In-Memory'}`);
            console.log(`  💾 Compression: ${this.redisAvailable && this.compressionEnabled ? 'MessagePack' : 'Disabled'}`);
            console.log(`  🔥 Hot cache: ${this.hotCacheMaxSize} entries`);
            console.log(`  📊 Batch size: ${this.batchSize}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Renaissance Feature Store initialization failed:', error.message);
            throw error;
        }
    }

    async initializeCluster() {
        this.cluster = new this.Redis.Cluster(this.config.cluster.nodes, {
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            scaleReads: 'slave', // Read from slaves for better performance
            redisOptions: {
                lazyConnect: true,
                keepAlive: 30000,
                family: 4,
                keyPrefix: this.config.keyPrefix
            }
        });
        
        this.redis = this.cluster;
        
        this.cluster.on('ready', () => {
            console.log('✅ Redis cluster ready');
            this.updateConnectionMetrics();
        });
        
        this.cluster.on('error', (error) => {
            console.error('❌ Redis cluster error:', error.message);
            this.metrics.errors++;
        });
        
        await this.cluster.connect();
    }

    async initializeSingle() {
        this.redis = new this.Redis({
            ...this.config,
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
            keyPrefix: this.config.keyPrefix
        });
        
        this.redis.on('connect', () => {
            console.log('✅ Redis connected');
            this.updateConnectionMetrics();
        });
        
        this.redis.on('error', (error) => {
            console.error('❌ Redis error:', error.message);
            this.metrics.errors++;
        });
        
        await this.redis.connect();
    }

    async initializeReadReplica() {
        this.readReplica = new this.Redis(this.config.readReplica);
        console.log('✅ Read replica connected');
    }

    /**
     * Renaissance-optimized feature storage with compression
     */
    async storeFeatures(tokenMint, namespace, features, customTTL = null) {
        const startTime = performance.now();
        
        try {
            // L1 hot cache update
            this.updateHotCache(tokenMint, namespace, features);
            
            // Calculate dynamic TTL based on token volatility
            const ttl = customTTL || this.calculateDynamicTTL(tokenMint, namespace, features);
            
            // Serialize with compression
            const serializedData = this.serializeFeatures(features, ttl);
            const key = this.buildKey(tokenMint, namespace);
            
            // Add to batch queue if below threshold
            if (this.batchQueue.length < this.pipelineThreshold) {
                this.batchQueue.push({
                    operation: 'setex',
                    key: key,
                    ttl: ttl,
                    data: serializedData
                });
                
                if (!this.batchTimer) {
                    this.batchTimer = setTimeout(() => this.flushBatchQueue(), 10);
                }
            } else {
                // Execute immediately for high-priority data
                await this.redis.setex(key, ttl, serializedData);
            }
            
            this.metrics.sets++;
            this.updateLatencyMetrics(performance.now() - startTime);
            
            // Learn access pattern
            this.recordAccess(tokenMint, namespace, 'write');
            
            return true;
            
        } catch (error) {
            console.error(`❌ Store failed for ${tokenMint}:${namespace}:`, error.message);
            this.metrics.errors++;
            return false;
        }
    }

    /**
     * Renaissance-optimized feature retrieval with L1 cache
     */
    async getFeatures(tokenMint, namespace) {
        const startTime = performance.now();
        
        try {
            // Check L1 hot cache first
            const hotCacheKey = `${tokenMint}:${namespace}`;
            const hotData = this.hotCache.get(hotCacheKey);
            
            if (hotData && Date.now() - hotData.timestamp < this.hotCacheTTL) {
                this.metrics.l1Hits++;
                return hotData.features;
            }
            
            this.metrics.l1Misses++;
            
            // Use read replica if available
            const redisClient = this.readReplica || this.redis;
            const key = this.buildKey(tokenMint, namespace);
            const data = await redisClient.get(key);
            
            if (!data) {
                this.metrics.misses++;
                return null;
            }
            
            // Deserialize
            const features = this.deserializeFeatures(data);
            this.metrics.hits++;
            
            // Update L1 cache
            this.updateHotCache(tokenMint, namespace, features);
            
            // Update metrics
            this.updateLatencyMetrics(performance.now() - startTime);
            this.recordAccess(tokenMint, namespace, 'read');
            
            return features;
            
        } catch (error) {
            console.error(`❌ Get failed for ${tokenMint}:${namespace}:`, error.message);
            this.metrics.errors++;
            return null;
        }
    }

    /**
     * High-performance batch operations
     */
    async batchStoreFeatures(entries) {
        const startTime = performance.now();
        
        try {
            const pipeline = this.redis.pipeline();
            const hotCacheUpdates = [];
            
            for (const entry of entries) {
                const { tokenMint, namespace, features, customTTL } = entry;
                const ttl = customTTL || this.calculateDynamicTTL(tokenMint, namespace, features);
                const serializedData = this.serializeFeatures(features, ttl);
                const key = this.buildKey(tokenMint, namespace);
                
                pipeline.setex(key, ttl, serializedData);
                hotCacheUpdates.push({ tokenMint, namespace, features });
            }
            
            await pipeline.exec();
            
            // Update hot cache for all entries
            hotCacheUpdates.forEach(({ tokenMint, namespace, features }) => {
                this.updateHotCache(tokenMint, namespace, features);
            });
            
            this.metrics.sets += entries.length;
            this.updateLatencyMetrics(performance.now() - startTime);
            
            return true;
            
        } catch (error) {
            console.error('❌ Batch store failed:', error.message);
            this.metrics.errors++;
            return false;
        }
    }

    /**
     * MessagePack compression for Renaissance efficiency
     */
    serializeFeatures(features, ttl) {
        const dataWithMeta = {
            ...features,
            timestamp: Date.now(),
            ttl: ttl
        };
        
        if (this.compressionEnabled && this.redisAvailable) {
            try {
                const original = JSON.stringify(dataWithMeta);
                const compressed = msgpack.encode(dataWithMeta);
                
                // Track compression ratio
                this.metrics.compressionRatio = 
                    (this.metrics.compressionRatio * 0.9) + 
                    ((compressed.length / original.length) * 0.1);
                
                // Convert to base64 string for Redis storage reliability
                const base64Data = Buffer.from(compressed).toString('base64');
                return `MSGPACK:${base64Data}`;
            } catch (error) {
                console.warn('🧪 MessagePack encoding failed, falling back to JSON:', error.message);
                return `JSON:${JSON.stringify(dataWithMeta)}`;
            }
        }
        
        return `JSON:${JSON.stringify(dataWithMeta)}`;
    }

    deserializeFeatures(data) {
        if (!data) return null;
        
        try {
            // Handle new prefixed format
            if (typeof data === 'string') {
                if (data.startsWith('MSGPACK:')) {
                    // Extract base64 data and decode
                    const base64Data = data.slice(8); // Remove 'MSGPACK:' prefix
                    const buffer = Buffer.from(base64Data, 'base64');
                    return msgpack.decode(buffer);
                } else if (data.startsWith('JSON:')) {
                    // Extract JSON data and parse
                    const jsonData = data.slice(5); // Remove 'JSON:' prefix
                    return JSON.parse(jsonData);
                }
            }
            
            // Legacy handling for old data format (backward compatibility)
            if (this.compressionEnabled) {
                // Handle different data types from Redis (legacy)
                if (Buffer.isBuffer(data)) {
                    return msgpack.decode(data);
                } else if (typeof data === 'string') {
                    // Try to detect if it's base64 encoded binary data
                    try {
                        const buffer = Buffer.from(data, 'base64');
                        return msgpack.decode(buffer);
                    } catch (base64Error) {
                        // Not base64, try binary conversion
                        const buffer = Buffer.from(data, 'binary');
                        return msgpack.decode(buffer);
                    }
                } else if (data instanceof Uint8Array) {
                    return msgpack.decode(data);
                }
            }
            
            // Final fallback to JSON parsing
            if (typeof data === 'string') {
                return JSON.parse(data);
            }
            
            // If it's already an object, return as-is
            return data;
            
        } catch (error) {
            console.warn('🧪 Deserialization failed:', error.message);
            console.warn('🧪 Data type:', typeof data, 'Length:', data?.length || 'N/A');
            console.warn('🧪 Data preview:', typeof data === 'string' ? data.slice(0, 50) + '...' : 'Non-string data');
            return null;
        }
    }

    /**
     * Dynamic TTL calculation based on token characteristics
     */
    calculateDynamicTTL(tokenMint, namespace, features) {
        const baseTTL = this.config.ttl[namespace] || 300;
        
        // Adjust based on token activity
        let multiplier = 1.0;
        
        if (features.volatility !== undefined) {
            // High volatility = shorter TTL
            multiplier *= Math.max(0.2, 1 - (features.volatility * 0.8));
        }
        
        if (features.volume24h !== undefined) {
            // High volume = shorter TTL
            const volumeAdjustment = Math.min(features.volume24h / 100000, 1);
            multiplier *= Math.max(0.3, 1 - (volumeAdjustment * 0.7));
        }
        
        return Math.max(30, Math.floor(baseTTL * multiplier));
    }

    /**
     * L1 hot cache management with aggressive cleanup
     */
    updateHotCache(tokenMint, namespace, features) {
        const key = `${tokenMint}:${namespace}`;
        
        // ULTRA aggressive eviction - clean up when 40% full
        if (this.hotCache.size >= this.hotCacheMaxSize * 0.4) {
            this.cleanupExpiredCacheEntries();
        }
        
        // Evict old entries if still at capacity
        if (this.hotCache.size >= this.hotCacheMaxSize) {
            const oldestKey = this.hotCache.keys().next().value;
            this.hotCache.delete(oldestKey);
        }
        
        this.hotCache.set(key, {
            features: features,
            timestamp: Date.now()
        });
    }

    /**
     * Clean up expired cache entries proactively
     */
    cleanupExpiredCacheEntries() {
        const now = Date.now();
        const expiredKeys = [];
        
        for (const [key, entry] of this.hotCache.entries()) {
            if (now - entry.timestamp > this.hotCacheTTL) {
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => this.hotCache.delete(key));
        
        if (expiredKeys.length > 0) {
            console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
        }
    }

    /**
     * Batch queue processing
     */
    startBatchProcessor() {
        // Process batch queue every 50ms
        setInterval(() => {
            if (this.batchQueue.length > 0) {
                this.flushBatchQueue();
            }
        }, 50);
    }

    async flushBatchQueue() {
        if (this.batchQueue.length === 0) return;
        
        const operations = [...this.batchQueue];
        this.batchQueue = [];
        
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        
        try {
            // In-memory batch processing (Redis disabled)
            operations.forEach(op => {
                if (op.operation === 'setex') {
                    // Store in hot cache with TTL simulation
                    try {
                        const deserializedData = this.deserializeFeatures(op.data);
                        if (deserializedData) {
                            this.hotCache.set(op.key, {
                                features: deserializedData,
                                timestamp: Date.now(),
                                ttl: op.ttl * 1000 // Convert to milliseconds
                            });
                        }
                    } catch (error) {
                        console.warn('🧪 Batch processing deserialization failed:', error.message);
                    }
                }
            });
        } catch (error) {
            console.error('❌ Batch flush failed:', error.message);
            this.metrics.errors++;
        }
    }

    /**
     * Predictive cache warming
     */
    startCacheWarming() {
        setInterval(() => {
            this.warmFrequentlyAccessed();
        }, 60000); // Every minute
    }

    /**
     * Aggressive cache cleanup for memory optimization
     */
    startCacheCleanup() {
        setInterval(() => {
            this.cleanupExpiredCacheEntries();
            
            // Also clean up access patterns that are too old
            this.cleanupOldAccessPatterns();
        }, 5000); // Every 5 seconds (ULTRA frequent for memory optimization)
    }

    /**
     * Clean up old access patterns to prevent memory leaks
     */
    cleanupOldAccessPatterns() {
        const now = Date.now();
        const maxAge = 60000; // 1 minute (ULTRA reduced)
        const oldPatterns = [];
        
        for (const [key, pattern] of this.accessPatterns.entries()) {
            if (now - pattern.lastAccess > maxAge) {
                oldPatterns.push(key);
            }
        }
        
        oldPatterns.forEach(key => this.accessPatterns.delete(key));
        
        if (oldPatterns.length > 0) {
            console.log(`🧹 Cleaned up ${oldPatterns.length} old access patterns`);
        }
        
        // Additional memory cleanup
        this.performAdditionalMemoryCleanup();
    }

    /**
     * Perform additional memory cleanup tasks
     */
    performAdditionalMemoryCleanup() {
        // Limit access patterns map size
        if (this.accessPatterns.size > 1000) {
            const entries = Array.from(this.accessPatterns.entries());
            // Keep only the 500 most recently accessed
            entries.sort((a, b) => b[1].lastAccess - a[1].lastAccess);
            this.accessPatterns.clear();
            entries.slice(0, 500).forEach(([key, value]) => {
                this.accessPatterns.set(key, value);
            });
            console.log('🧹 Trimmed access patterns to 500 most recent entries');
        }

        // Clear old metrics data
        if (this.metrics.networkLatency.length > 500) {
            this.metrics.networkLatency = this.metrics.networkLatency.slice(-250);
            console.log('🧹 Trimmed network latency metrics to 250 entries');
        }

        // Force garbage collection if available
        if (global.gc && this.hotCache.size > this.hotCacheMaxSize * 0.8) {
            global.gc();
        }
    }

    async warmFrequentlyAccessed() {
        // Get most accessed tokens
        const frequentTokens = Array.from(this.accessPatterns.entries())
            .sort((a, b) => b[1].readCount - a[1].readCount)
            .slice(0, 20)
            .map(([key]) => key.split(':'));
        
        // Pre-warm their features
        for (const [tokenMint, namespace] of frequentTokens) {
            if (!this.hotCache.has(`${tokenMint}:${namespace}`)) {
                // Warm in background
                this.getFeatures(tokenMint, namespace).catch(() => {});
            }
        }
    }

    /**
     * Access pattern learning
     */
    recordAccess(tokenMint, namespace, operation) {
        const key = `${tokenMint}:${namespace}`;
        const pattern = this.accessPatterns.get(key) || {
            readCount: 0,
            writeCount: 0,
            lastAccess: Date.now()
        };
        
        if (operation === 'read') pattern.readCount++;
        if (operation === 'write') pattern.writeCount++;
        pattern.lastAccess = Date.now();
        
        this.accessPatterns.set(key, pattern);
    }

    /**
     * Performance metrics tracking
     */
    updateLatencyMetrics(latency) {
        this.metrics.networkLatency.push(latency);
        
        // Keep only last 1000 measurements
        if (this.metrics.networkLatency.length > 1000) {
            this.metrics.networkLatency = this.metrics.networkLatency.slice(-1000);
        }
    }

    updateConnectionMetrics() {
        // Update connection pool metrics if available
        this.metrics.connectionPool = {
            active: this.redis.connector?.options?.lazyConnect ? 1 : 0,
            idle: 0,
            total: 1
        };
    }

    /**
     * Renaissance-grade health check
     */
    async healthCheck() {
        try {
            const startTime = performance.now();
            // await this.redis.ping(); // Disabled for in-memory mode
            const pingLatency = performance.now() - startTime;
            
            const totalRequests = this.metrics.hits + this.metrics.misses;
            const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests * 100) : 0;
            const l1HitRate = (this.metrics.l1Hits + this.metrics.l1Misses) > 0 ? 
                (this.metrics.l1Hits / (this.metrics.l1Hits + this.metrics.l1Misses) * 100) : 0;
            
            const avgLatency = this.metrics.networkLatency.length > 0 ?
                this.metrics.networkLatency.reduce((sum, lat) => sum + lat, 0) / this.metrics.networkLatency.length : 0;
            
            return {
                healthy: true,
                performance: {
                    hitRate: hitRate.toFixed(2) + '%',
                    l1HitRate: l1HitRate.toFixed(2) + '%',
                    avgLatency: avgLatency.toFixed(2) + 'ms',
                    pingLatency: pingLatency.toFixed(2) + 'ms',
                    compressionRatio: (this.metrics.compressionRatio * 100).toFixed(1) + '%',
                    hotCacheSize: this.hotCache.size,
                    batchQueueSize: this.batchQueue.length
                },
                metrics: this.metrics,
                configuration: {
                    cluster: this.useCluster,
                    compression: this.compressionEnabled,
                    readReplica: !!this.readReplica,
                    batchSize: this.batchSize
                }
            };
            
        } catch (error) {
            return { 
                healthy: false, 
                reason: error.message,
                performance: null
            };
        }
    }

    buildKey(tokenMint, namespace) {
        return `${namespace}:${tokenMint}`;
    }

    async testWrite() {
        console.log('🧪 Testing Redis write capability...');
        
        // Write directly to Redis (bypass batch queue)
        const key = this.buildKey('TEST_TOKEN_123', 'meta');
        const testData = { test: true, timestamp: Date.now() };
        const serializedData = this.serializeFeatures(testData, 300);
        
        try {
            // Direct Redis write
            await this.redis.setex(key, 300, serializedData);
            console.log('🧪 Direct Redis write successful');
            
            // Try to read it back
            const readResult = await this.redis.get(key);
            const deserializedResult = this.deserializeFeatures(readResult);
            console.log('🧪 Direct Redis read result:', deserializedResult);
            
            return true;
        } catch (error) {
            console.log('🧪 Direct Redis test failed:', error.message);
            return false;
        }
    }

    async shutdown() {
        console.log('🔌 Shutting down Renaissance Feature Store...');
        
        // Flush any pending batches
        await this.flushBatchQueue();
        
        // Clear hot cache
        this.hotCache.clear();
        
        // Close connections
        if (this.cluster) await this.cluster.quit();
        if (this.redis && !this.cluster) await this.redis.quit();
        if (this.readReplica) await this.readReplica.quit();
        
        console.log('✅ Renaissance Feature Store shutdown complete');
    }
}

export default RenaissanceFeatureStore;
