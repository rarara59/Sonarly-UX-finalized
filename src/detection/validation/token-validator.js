/**
 * Ultra-Fast Token Validator
 * Target: <3ms per token, 95%+ cache hit rate
 * CRITICAL FIX: Uses getAccountInfo instead of getTokenSupply for new meme coins
 * 180 lines - High-performance token validation
 */

export class TokenValidator {
  constructor(rpcPool, circuitBreaker = null, performanceMonitor = null) {
    this.rpcPool = rpcPool;
    this.circuitBreaker = circuitBreaker;
    this.monitor = performanceMonitor;
    
    // LRU cache for token validation results
    this.cache = new Map();
    this.maxCacheSize = 10000;
    
    // Known valid tokens for instant validation
    this.knownTokens = new Set([
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
      'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof'   // RND
    ]);
    
    // Token program IDs
    this.tokenProgramIds = new Set([
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token Program
      'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'  // Token-2022 Program
    ]);
    
    // Performance tracking
    this.stats = {
      totalValidations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rpcCalls: 0,
      errors: 0,
      avgLatency: 0,
      cacheHitRate: 0
    };
    
    // Start cache cleanup
    this.startCacheCleanup();
  }
  
  // Validate Solana address format
  isValidSolanaAddress(address) {
    // Basic length check (Solana addresses are typically 32-44 characters)
    if (!address || address.length < 32 || address.length > 44) {
      return false;
    }
    
    // Check for base58 characters only (no 0, O, I, l)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(address);
  }

  // Primary validation method - FIXES getTokenSupply issue
  async validateToken(address, context = {}) {
    // Renaissance standard: Validate inputs early
    if (!address || typeof address !== 'string' || address.length === 0) {
      throw new Error(`Invalid token address: ${address}`);
    }
    
    // Validate Solana address format
    if (!this.isValidSolanaAddress(address)) {
      throw new Error(`Invalid Solana address format: ${address}`);
    }
    const startTime = performance.now();
    this.stats.totalValidations++;
    
    try {
      // Stage 1: Instant validation for known tokens (0ms)
      if (this.knownTokens.has(address)) {
        this.recordSuccess(startTime, true);
        return { valid: true, confidence: 1.0, source: 'known' };
      }
      
      // Stage 2: Cache lookup (0ms)
      const cached = this.cache.get(address);
      if (cached && this.isCacheValid(cached)) {
        this.recordSuccess(startTime, true);
        return cached.result;
      }
      
      // Stage 3: RPC validation using getAccountInfo (CRITICAL FIX)
      const result = await this.validateViaRpc(address);
      
      // Cache the result
      this.cacheResult(address, result);
      
      this.recordSuccess(startTime, false);
      return result;
      
    } catch (error) {
      this.recordError(startTime, error);
      
      // Return cached result if available, even if expired
      const staleCache = this.cache.get(address);
      if (staleCache) {
        return { ...staleCache.result, confidence: 0.5, source: 'stale_cache' };
      }
      
      throw error;
    }
  }
  
  // RPC validation using getAccountInfo (FIXES getTokenSupply issue)
  async validateViaRpc(address) {
    this.stats.rpcCalls++;
    
    // Use circuit breaker if available
    if (this.circuitBreaker) {
      return await this.circuitBreaker.execute('tokenValidation', async () => {
        return await this.performRpcValidation(address);
      });
    }
    
    return await this.performRpcValidation(address);
  }
  
  // Actual RPC validation logic
  async performRpcValidation(address) {
    try {
      // CRITICAL: Use getAccountInfo instead of getTokenSupply
      // This works on brand new tokens that getTokenSupply fails on
      const accountInfo = await this.rpcPool.call('getAccountInfo', [address, {
        encoding: 'base64',
        commitment: 'confirmed'
      }]);
      
      if (!accountInfo || !accountInfo.value) {
        return { valid: false, confidence: 0.9, source: 'rpc_not_found' };
      }
      
      const account = accountInfo.value;
      
      // Validate account structure
      return this.validateAccountStructure(account, address);
      
    } catch (error) {
      const errorMsg = error?.message || error?.toString() || "unknown error";
      // Handle specific RPC errors
      if (errorMsg.includes('could not find account')) {
        return { valid: false, confidence: 0.95, source: 'rpc_not_found' };
      }
      
      if (errorMsg.includes('timeout')) {
        return { valid: false, confidence: 0.3, source: 'rpc_timeout' };
      }
      
      throw error;
    }
  }
  
  // Validate token account structure
  validateAccountStructure(account, address) {
    // Check if owned by token program
    if (!this.tokenProgramIds.has(account.owner)) {
      return { valid: false, confidence: 0.9, source: 'invalid_owner' };
    }
    
    // Check data length for mint account (82 bytes for SPL tokens)
    if (!account.data || account.data.length === 0) {
      return { valid: false, confidence: 0.85, source: 'no_data' };
    }
    
    // For base64 encoded data, check expected length
    let dataLength;
    if (Array.isArray(account.data)) {
      dataLength = account.data[0] ? Buffer.from(account.data[0], 'base64').length : 0;
    } else {
      dataLength = Buffer.from(account.data, 'base64').length;
    }
    
    // SPL Token mint accounts are 82 bytes
    if (dataLength === 82) {
      return { valid: true, confidence: 0.95, source: 'rpc_validated' };
    }
    
    // Token-2022 can have variable sizes due to extensions
    if (dataLength >= 82) {
      return { valid: true, confidence: 0.90, source: 'rpc_validated_extended' };
    }
    
    // Fallback for unusual cases
    return { valid: false, confidence: 0.7, source: 'unexpected_structure' };
  }
  
  // Batch validate multiple tokens
  async validateBatch(addresses) {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return [];
    }
    
    // Separate cached vs uncached
    const cached = [];
    const needValidation = [];
    
    for (const address of addresses) {
      if (this.knownTokens.has(address)) {
        cached.push({ address, result: { valid: true, confidence: 1.0, source: 'known' } });
      } else {
        const cachedResult = this.cache.get(address);
        if (cachedResult && this.isCacheValid(cachedResult)) {
          cached.push({ address, result: cachedResult.result });
        } else {
          needValidation.push(address);
        }
      }
    }
    
    // Validate uncached tokens in parallel (max 10 concurrent)
    const batchSize = 10;
    const validationPromises = [];
    
    for (let i = 0; i < needValidation.length; i += batchSize) {
      const batch = needValidation.slice(i, i + batchSize);
      const batchPromise = Promise.all(
        batch.map(async address => ({
          address,
          result: await this.validateToken(address)
        }))
      );
      validationPromises.push(batchPromise);
    }
    
    const validationResults = await Promise.all(validationPromises);
    const allValidated = validationResults.flat();
    
    // Combine cached and validated results
    return [...cached, ...allValidated];
  }
  
  // Check if cached result is still valid
  isCacheValid(cached) {
    const maxAge = 600000; // 10 minutes
    return Date.now() - cached.timestamp < maxAge;
  }
  
  // Cache validation result
  cacheResult(address, result) {
    // Implement FIFO eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(address, {
      result,
      timestamp: Date.now()
    });
  }
  
  // Record successful validation
  recordSuccess(startTime, fromCache) {
    const latency = performance.now() - startTime;
    
    if (fromCache) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    
    this.updateLatencyMetrics(latency);
    this.updateCacheHitRate();
    
    if (this.monitor) {
      this.monitor.recordLatency('tokenValidator', latency, true);
      this.monitor.recordCacheHit('tokenValidator', fromCache);
    }
  }
  
  // Record validation error
  recordError(startTime, error) {
    const latency = performance.now() - startTime;
    this.stats.errors++;
    this.stats.cacheMisses++;
    
    this.updateLatencyMetrics(latency);
    this.updateCacheHitRate();
    
    if (this.monitor) {
      this.monitor.recordLatency('tokenValidator', latency, false);
    }
    
    console.warn('Token validation error:', error?.message || error?.toString() || 'unknown error');
  }
  
  // Update latency metrics
  updateLatencyMetrics(latency) {
    if (this.stats.avgLatency === 0) {
      this.stats.avgLatency = latency;
    } else {
      this.stats.avgLatency = (this.stats.avgLatency * 0.9) + (latency * 0.1);
    }
  }
  
  // Update cache hit rate
  updateCacheHitRate() {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.cacheHitRate = total > 0 ? this.stats.cacheHits / total : 0;
  }
  
  // Start cache cleanup process
  startCacheCleanup() {
    setInterval(() => {
      this.cleanupCache();
    }, 300000); // 5 minutes
  }
  
  // Clean up expired cache entries
  cleanupCache() {
    let removed = 0;
    const cutoffTime = Date.now() - 600000; // 10 minutes
    
    for (const [address, cached] of this.cache) {
      if (cached.timestamp < cutoffTime) {
        this.cache.delete(address);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`Token validator: cleaned up ${removed} expired cache entries`);
    }
  }
  
  // Get current statistics
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      knownTokens: this.knownTokens.size
    };
  }
  
  // Health check
  isHealthy() {
    return (
      this.stats.avgLatency < 3.0 && // Under 3ms average
      (this.stats.totalValidations === 0 || this.stats.cacheHitRate > 0.5) &&
      this.cache.size < this.maxCacheSize * 0.9 // Cache not full
    );
  }
  
  // Add token to known tokens list
  addKnownToken(address) {
    this.knownTokens.add(address);
  }
  
  // Clear cache (useful for testing)
  clearCache() {
    this.cache.clear();
  }
}