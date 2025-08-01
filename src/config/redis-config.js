const redisConfig = {
    development: {
        host: 'localhost',
        port: 6379,
        db: 0,
        maxRetriesPerRequest: 3,  // FIXED: Remove duplicate
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4, // IPv4
        keyPrefix: 'thorp:',
        // Feature-specific TTLs
        ttl: {
            tokenMetadata: 300,      // 5 minutes
            holderData: 120,         // 2 minutes  
            priceData: 60,           // 1 minute
            volumeData: 180,         // 3 minutes
            socialData: 600,         // 10 minutes
            riskMetrics: 300,        // 5 minutes
            microstructure: 60       // 1 minute (changes fast)
        }
    },
    production: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        maxRetriesPerRequest: 5,
        retryDelayOnFailover: 200,
        keyPrefix: 'thorp:prod:',
        ttl: {
            tokenMetadata: 180,      // 3 minutes (faster in prod)
            holderData: 90,          // 1.5 minutes
            priceData: 30,           // 30 seconds
            volumeData: 120,         // 2 minutes
            socialData: 300,         // 5 minutes
            riskMetrics: 180,        // 3 minutes
            microstructure: 30       // 30 seconds
        }
    }
};

export default redisConfig;