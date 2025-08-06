/**
 * Liquidity Pool Structure Validator
 * Target: <5ms per pool, validate LP structure for trading viability
 * 120 lines - Fast pool structure validation
 */

export class PoolValidator {
  constructor(rpcPool, performanceMonitor = null) {
    this.rpcPool = rpcPool;
    this.monitor = performanceMonitor;
    
    // Known DEX program IDs
    this.dexPrograms = {
      raydium: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      pumpfun: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
      orca: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'
    };
    
    // Minimum liquidity thresholds (in SOL equivalent)
    this.minLiquidity = {
      raydium: 1.0,    // 1 SOL minimum
      pumpfun: 0.5,    // 0.5 SOL minimum  
      orca: 2.0        // 2 SOL minimum
    };
    
    // ADD: Invalid pool cache for performance
    this.invalidPoolCache = new Map();
    this.validPoolCache = new Map();
    this.cacheMaxSize = 1000;
    this.cacheTTL = 300000; // 5 minutes in milliseconds
    this.lastCacheCleanup = Date.now();
    
    // Performance tracking
    this.stats = {
      totalValidations: 0,
      validPools: 0,
      invalidPools: 0,
      errors: 0,
      avgLatency: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
  
  // Primary pool validation method
  async validatePool(poolAddress, dexType, context = {}) {
    // Input validation - fail fast on invalid inputs
    if (!poolAddress || typeof poolAddress !== 'string' || poolAddress.length !== 44) {
      return { 
        valid: false, 
        confidence: 0.9, 
        reason: 'invalid_pool_address',
        error: 'Pool address must be valid base58 string (44 characters)'
      };
    }
    
    if (!dexType || typeof dexType !== 'string' || dexType.trim() === '') {
      return { 
        valid: false, 
        confidence: 0.9, 
        reason: 'invalid_dex_type',
        error: 'DEX type must be specified (raydium, pumpfun, orca)'
      };
    }
    
    // Normalize dex type
    const normalizedDexType = dexType.toLowerCase().trim();
    if (!normalizedDexType || !this.dexPrograms[normalizedDexType]) {
      return { 
        valid: false, 
        confidence: 0.8, 
        reason: !normalizedDexType ? 'invalid_dex_type' : 'unsupported_dex_type',
        error: !normalizedDexType ? 'DEX type must be specified (raydium, pumpfun, orca)' : `Unsupported DEX type: ${dexType}. Supported: raydium, pumpfun, orca`
      };
    }
    
    // Check cache first (major performance boost)
    const cachedResult = this.getCachedResult(poolAddress, normalizedDexType);
    if (cachedResult) {
      return { ...cachedResult, cached: true };
    }
    
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.stats.totalValidations++;
    
    try {
      const result = await this.performPoolValidation(poolAddress, normalizedDexType, context);
      
      // Cache the result
      this.cacheResult(poolAddress, normalizedDexType, result);
      
      if (result.valid) {
        this.stats.validPools++;
      } else {
        this.stats.invalidPools++;
      }
      
      this.recordSuccess(startTime);
      return result;
      
    } catch (error) {
      this.recordError(startTime, error);
      const errorResult = { 
        valid: false, 
        confidence: 0.0, 
        error: error.message,
        source: 'validation_error'
      };
      
      // Cache error results too (avoid repeated failures)
      this.cacheResult(poolAddress, normalizedDexType, errorResult);
      return errorResult;
    }
  }
  
  // Perform actual pool validation
  async performPoolValidation(poolAddress, dexType, context) {
    // Get pool account info
    const poolInfo = await this.rpcPool.call('getAccountInfo', [poolAddress, {
      encoding: 'base64',
      commitment: 'confirmed'
    }]);
    
    if (!poolInfo || typeof poolInfo !== 'object' || !poolInfo.hasOwnProperty('value')) {
      return { valid: false, confidence: 0.9, reason: 'pool_not_found' };
    }
    
    // Validate based on DEX type
    switch (dexType.toLowerCase()) {
      case 'raydium':
        return this.validateRaydiumPool(poolInfo.value, context);
      case 'pumpfun':
        return this.validatePumpfunPool(poolInfo.value, context);
      case 'orca':
        return this.validateOrcaPool(poolInfo.value, context);
      default:
        return { valid: false, confidence: 0.5, reason: 'unknown_dex_type' };
    }
  }
  
  // Validate Raydium AMM pool structure
  validateRaydiumPool(accountData, context) {
    // Check owner program
    if (accountData.owner !== this.dexPrograms.raydium) {
      return { valid: false, confidence: 0.95, reason: 'invalid_program_owner' };
    }
    
    // Check data length (Raydium AMM pools are ~752 bytes)
    const dataLength = this.getDataLength(accountData.data);
    if (dataLength < 700 || dataLength > 800) {
      return { valid: false, confidence: 0.8, reason: 'invalid_data_length' };
    }
    
    // Parse basic pool structure
    const poolData = this.parseRaydiumPoolData(accountData.data);
    if (!poolData.valid) {
      return { valid: false, confidence: 0.7, reason: 'invalid_pool_structure' };
    }
    
    // Check liquidity levels
    const liquidityCheck = this.validateLiquidity(poolData, 'raydium');
    if (!liquidityCheck.valid) {
      return liquidityCheck;
    }
    
    return { 
      valid: true, 
      confidence: 0.95, 
      poolData: poolData,
      liquidity: liquidityCheck.liquidity,
      source: 'raydium_validation'
    };
  }
  
  // Validate Pump.fun pool structure
  validatePumpfunPool(accountData, context) {
    // Check owner program
    if (accountData.owner !== this.dexPrograms.pumpfun) {
      return { valid: false, confidence: 0.95, reason: 'invalid_program_owner' };
    }
    
    // Pump.fun has different structure - smaller data size
    const dataLength = this.getDataLength(accountData.data);
    if (dataLength < 100 || dataLength > 300) {
      return { valid: false, confidence: 0.8, reason: 'invalid_data_length' };
    }
    
    // Basic structure validation
    const poolData = this.parsePumpfunPoolData(accountData.data);
    if (!poolData.valid) {
      return { valid: false, confidence: 0.7, reason: 'invalid_pool_structure' };
    }
    
    // Pump.fun pools are often smaller liquidity
    const liquidityCheck = this.validateLiquidity(poolData, 'pumpfun');
    if (!liquidityCheck.valid) {
      return liquidityCheck;
    }
    
    return { 
      valid: true, 
      confidence: 0.90, 
      poolData: poolData,
      liquidity: liquidityCheck.liquidity,
      source: 'pumpfun_validation'
    };
  }
  
  // Validate Orca whirlpool structure
  validateOrcaPool(accountData, context) {
    // Check owner program
    if (accountData.owner !== this.dexPrograms.orca) {
      return { valid: false, confidence: 0.95, reason: 'invalid_program_owner' };
    }
    
    // Orca whirlpools have specific structure
    const dataLength = this.getDataLength(accountData.data);
    if (dataLength < 600 || dataLength > 900) {
      return { valid: false, confidence: 0.8, reason: 'invalid_data_length' };
    }
    
    const poolData = this.parseOrcaPoolData(accountData.data);
    if (!poolData.valid) {
      return { valid: false, confidence: 0.7, reason: 'invalid_pool_structure' };
    }
    
    const liquidityCheck = this.validateLiquidity(poolData, 'orca');
    if (!liquidityCheck.valid) {
      return liquidityCheck;
    }
    
    return { 
      valid: true, 
      confidence: 0.92, 
      poolData: poolData,
      liquidity: liquidityCheck.liquidity,
      source: 'orca_validation'
    };
  }
  
  // Parse Raydium pool data (simplified)
  parseRaydiumPoolData(data) {
    try {
      const rawData = Array.isArray(data) ? data[0] : data;
      if (!rawData) return { valid: false, reason: 'no_data' };
      let buffer;
      try {
        buffer = Buffer.from(rawData, 'base64');
      } catch (error) {
        return { valid: false, reason: 'invalid_base64_data', error: error.message };
      }
      
      // Basic structure check - look for key fields
      if (buffer.length < 700) {
        return { valid: false, reason: 'insufficient_data' };
      }
      
      // Extract basic pool info (simplified parsing)
      return {
        valid: true,
        hasLiquidity: buffer.length > 700, // Simplified check
        poolType: 'raydium_amm',
        dataLength: buffer.length
      };
    } catch (error) {
      return { valid: false, reason: 'parse_error', error: error.message };
    }
  }
  
  // Parse Pump.fun pool data (simplified)
  parsePumpfunPoolData(data) {
    try {
      const rawData = Array.isArray(data) ? data[0] : data;
      if (!rawData) return { valid: false, reason: 'no_data' };
      let buffer;
      try {
        buffer = Buffer.from(rawData, 'base64');
      } catch (error) {
        return { valid: false, reason: 'invalid_base64_data', error: error.message };
      }
      
      if (buffer.length < 100) {
        return { valid: false, reason: 'insufficient_data' };
      }
      
      return {
        valid: true,
        hasLiquidity: true, // Pump.fun pools always have some liquidity
        poolType: 'pumpfun_bonding',
        dataLength: buffer.length
      };
    } catch (error) {
      return { valid: false, reason: 'parse_error', error: error.message };
    }
  }
  
  // Parse Orca pool data (simplified)
  parseOrcaPoolData(data) {
    try {
      const rawData = Array.isArray(data) ? data[0] : data;
      if (!rawData) return { valid: false, reason: 'no_data' };
      let buffer;
      try {
        buffer = Buffer.from(rawData, 'base64');
      } catch (error) {
        return { valid: false, reason: 'invalid_base64_data', error: error.message };
      }
      
      if (buffer.length < 600) {
        return { valid: false, reason: 'insufficient_data' };
      }
      
      return {
        valid: true,
        hasLiquidity: buffer.length > 600,
        poolType: 'orca_whirlpool',
        dataLength: buffer.length
      };
    } catch (error) {
      return { valid: false, reason: 'parse_error', error: error.message };
    }
  }
  
  // Validate minimum liquidity requirements
  validateLiquidity(poolData, dexType) {
    // For now, simplified liquidity check based on pool existence
    // In production, you'd parse actual token balances
    
    if (!poolData.hasLiquidity) {
      return { valid: false, confidence: 0.8, reason: 'insufficient_liquidity' };
    }
    
    // Simplified liquidity estimation
    const estimatedLiquidity = this.estimateLiquidity(poolData, dexType);
    const minRequired = this.minLiquidity[dexType] || 1.0;
    
    if (estimatedLiquidity < minRequired) {
      return { 
        valid: false, 
        confidence: 0.7, 
        reason: 'below_minimum_liquidity',
        liquidity: estimatedLiquidity,
        minimum: minRequired
      };
    }
    
    return { valid: true, liquidity: estimatedLiquidity };
  }
  
  // Estimate pool liquidity (simplified)
  estimateLiquidity(poolData, dexType) {
    // Simplified estimation - would be more sophisticated in production
    switch (dexType) {
      case 'raydium':
        return poolData.valid ? 5.0 : 0; // Assume 5 SOL equivalent
      case 'pumpfun':
        return poolData.valid ? 2.0 : 0; // Assume 2 SOL equivalent  
      case 'orca':
        return poolData.valid ? 8.0 : 0; // Assume 8 SOL equivalent
      default:
        return 0;
    }
  }
  
  // Get data length from account data
  getDataLength(data) {
    try {
      if (Array.isArray(data)) {
        return data[0] ? Buffer.from(data[0], 'base64').length : 0;
      }
      return Buffer.from(data, 'base64').length;
    } catch {
      return 0;
    }
  }
  
  // Record successful validation
  recordSuccess(startTime) {
    const latency = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    this.updateLatencyMetrics(latency);
    
    if (this.monitor) {
      this.monitor.recordLatency('poolValidator', latency, true);
    }
  }
  
  // Record validation error
  recordError(startTime, error) {
    const latency = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    this.stats.errors++;
    this.updateLatencyMetrics(latency);
    
    if (this.monitor) {
      this.monitor.recordLatency('poolValidator', latency, false);
    }
    
    console.warn('Pool validation error:', error.message);
  }
  
  // Update latency metrics
  updateLatencyMetrics(latency) {
    if (this.stats.avgLatency === 0) {
      this.stats.avgLatency = latency;
    } else {
      this.stats.avgLatency = (this.stats.avgLatency * 0.9) + (latency * 0.1);
    }
  }
  
  // Get current statistics
  getStats() {
    return {
      ...this.stats,
      validationRate: this.stats.totalValidations > 0 
        ? this.stats.validPools / this.stats.totalValidations 
        : 0,
      cacheHitRate: (this.stats.cacheHits + this.stats.cacheMisses) > 0
        ? this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)
        : 0,
      cacheSize: {
        invalid: this.invalidPoolCache.size,
        valid: this.validPoolCache.size,
        total: this.invalidPoolCache.size + this.validPoolCache.size
      }
    };
  }
  
  // Health check
  isHealthy() {
    return (
      this.stats.avgLatency < 5.0 && // Under 5ms average
      (this.stats.totalValidations === 0 || this.stats.errors < this.stats.totalValidations * 0.1) // Less than 10% error rate
    );
  }
  
  // Check cache for previous validation result
  getCachedResult(poolAddress, dexType) {
    const cacheKey = `${poolAddress}:${dexType}`;
    const now = Date.now();
    
    // Check invalid cache first (most common case)
    const invalidEntry = this.invalidPoolCache.get(cacheKey);
    if (invalidEntry && (now - invalidEntry.timestamp) < this.cacheTTL) {
      this.stats.cacheHits++;
      return invalidEntry.result;
    }
    
    // Check valid cache
    const validEntry = this.validPoolCache.get(cacheKey);
    if (validEntry && (now - validEntry.timestamp) < this.cacheTTL) {
      this.stats.cacheHits++;
      return validEntry.result;
    }
    
    this.stats.cacheMisses++;
    return null;
  }
  
  // Cache validation result
  cacheResult(poolAddress, dexType, result) {
    const cacheKey = `${poolAddress}:${dexType}`;
    const timestamp = Date.now();
    const entry = { result, timestamp };
    
    if (result.valid) {
      // Cache valid pools (less common, shorter TTL)
      this.validPoolCache.set(cacheKey, entry);
      this.enforceValidCacheSize();
    } else {
      // Cache invalid pools (more common, longer TTL)
      this.invalidPoolCache.set(cacheKey, entry);
      this.enforceInvalidCacheSize();
    }
    
    // Periodic cleanup
    if (timestamp - this.lastCacheCleanup > 60000) { // Every minute
      this.cleanupExpiredEntries();
      this.lastCacheCleanup = timestamp;
    }
  }
  
  // Enforce cache size limits
  enforceValidCacheSize() {
    if (this.validPoolCache.size > this.cacheMaxSize) {
      const excess = this.validPoolCache.size - this.cacheMaxSize;
      const iterator = this.validPoolCache.keys();
      for (let i = 0; i < excess; i++) {
        const key = iterator.next().value;
        if (key) this.validPoolCache.delete(key);
      }
    }
  }
  
  enforceInvalidCacheSize() {
    if (this.invalidPoolCache.size > this.cacheMaxSize * 2) { // Allow more invalid entries
      const excess = this.invalidPoolCache.size - (this.cacheMaxSize * 2);
      const iterator = this.invalidPoolCache.keys();
      for (let i = 0; i < excess; i++) {
        const key = iterator.next().value;
        if (key) this.invalidPoolCache.delete(key);
      }
    }
  }
  
  // Clean up expired cache entries
  cleanupExpiredEntries() {
    const now = Date.now();
    
    // Clean invalid cache
    for (const [key, entry] of this.invalidPoolCache) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.invalidPoolCache.delete(key);
      }
    }
    
    // Clean valid cache (shorter TTL)
    const validCacheTTL = this.cacheTTL / 2; // 2.5 minutes for valid pools
    for (const [key, entry] of this.validPoolCache) {
      if (now - entry.timestamp > validCacheTTL) {
        this.validPoolCache.delete(key);
      }
    }
  }
  
  // Clear all caches (for testing or emergency)
  clearCache() {
    this.invalidPoolCache.clear();
    this.validPoolCache.clear();
    console.log('Pool validator caches cleared');
  }
}