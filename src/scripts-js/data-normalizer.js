// src/scripts-js/data-normalizer.js
const { EventEmitter } = require('events');

/**
 * Data Normalizer - Standardizes Raw RPC Data
 * Converts different RPC formats into unified data structures
 */
class DataNormalizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      solDecimals: config.solDecimals || 9,
      defaultTokenDecimals: config.defaultTokenDecimals || 6,
      priceSourcePriority: config.priceSourcePriority || ['jupiter', 'raydium', 'orca'],
      minimumLiquidity: config.minimumLiquidity || 1000,
      maximumAge: config.maximumAge || 300000, // 5 minutes
      strictValidation: config.strictValidation !== false
    };
    
    // Normalization rules
    this.normalizationRules = {
      tokenAddress: this.normalizeTokenAddress.bind(this),
      tokenSymbol: this.normalizeTokenSymbol.bind(this),
      price: this.normalizePrice.bind(this),
      volume: this.normalizeVolume.bind(this),
      marketCap: this.normalizeMarketCap.bind(this),
      supply: this.normalizeSupply.bind(this),
      decimals: this.normalizeDecimals.bind(this),
      timestamp: this.normalizeTimestamp.bind(this)
    };
    
    // Field mappings for different RPC sources
    this.fieldMappings = {
      helius: {
        tokenAddress: 'mint',
        price: 'price_info.price_per_token',
        volume: 'market_info.volume_24h',
        marketCap: 'market_info.market_cap',
        supply: 'supply.ui_amount',
        decimals: 'decimals',
        symbol: 'metadata.symbol',
        name: 'metadata.name'
      },
      chainstack: {
        tokenAddress: 'address',
        price: 'market_data.current_price',
        volume: 'market_data.total_volume',
        marketCap: 'market_data.market_cap',
        supply: 'total_supply',
        decimals: 'decimals',
        symbol: 'symbol',
        name: 'name'
      },
      generic: {
        tokenAddress: 'address',
        price: 'price',
        volume: 'volume',
        marketCap: 'market_cap',
        supply: 'total_supply',
        decimals: 'decimals',
        symbol: 'symbol',
        name: 'name'
      }
    };
    
    // Performance metrics
    this.metrics = {
      totalNormalizations: 0,
      successfulNormalizations: 0,
      failedNormalizations: 0,
      averageNormalizationTime: 0,
      dataSourceBreakdown: {
        helius: 0,
        chainstack: 0,
        generic: 0,
        unknown: 0
      }
    };
    
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, ...args) => console.log(`[DataNormalizer] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[DataNormalizer] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[DataNormalizer] ${msg}`, ...args),
      debug: (msg, ...args) => console.debug(`[DataNormalizer] ${msg}`, ...args)
    };
  }

  /**
   * Normalize raw data to standard format
   */
  async normalize(rawData) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalNormalizations++;
      
      // Determine data source
      const dataSource = this.detectDataSource(rawData);
      this.metrics.dataSourceBreakdown[dataSource]++;
      
      // Normalize based on data type
      let normalizedData;
      
      if (rawData.type === 'token') {
        normalizedData = await this.normalizeTokenData(rawData, dataSource);
      } else if (rawData.type === 'market') {
        normalizedData = await this.normalizeMarketData(rawData, dataSource);
      } else if (rawData.type === 'lpCreation') {
        normalizedData = await this.normalizeLPCreationData(rawData, dataSource);
      } else {
        normalizedData = await this.normalizeGenericData(rawData, dataSource);
      }
      
      // Add normalization metadata
      normalizedData.normalizationMetadata = {
        source: dataSource,
        normalizedAt: new Date(),
        normalizationTime: Date.now() - startTime,
        version: '1.0.0'
      };
      
      this.metrics.successfulNormalizations++;
      this.updateMetrics(startTime, true);
      
      this.logger.debug(`Data normalized in ${Date.now() - startTime}ms`);
      return normalizedData;
      
    } catch (error) {
      this.metrics.failedNormalizations++;
      this.updateMetrics(startTime, false);
      this.logger.error('Normalization failed:', error);
      throw error;
    }
  }

  /**
   * Detect data source from raw data structure
   */
  detectDataSource(rawData) {
    if (rawData.source === 'helius' || rawData.data?.mint) {
      return 'helius';
    } else if (rawData.source === 'chainstack' || rawData.data?.address) {
      return 'chainstack';
    } else if (rawData.source === 'websocket') {
      return 'websocket';
    } else {
      return 'generic';
    }
  }

  /**
   * Normalize token data
   */
  async normalizeTokenData(rawData, dataSource) {
    const mapping = this.fieldMappings[dataSource] || this.fieldMappings.generic;
    const data = rawData.data || rawData;
    
    // Extract basic token information
    const tokenAddress = this.extractField(data, mapping.tokenAddress) || rawData.tokenAddress;
    const tokenSymbol = this.extractField(data, mapping.symbol) || 'UNKNOWN';
    const tokenName = this.extractField(data, mapping.name) || 'Unknown Token';
    const decimals = this.extractField(data, mapping.decimals) || this.config.defaultTokenDecimals;
    
    // Calculate token age
    const tokenAge = this.calculateTokenAge(data);
    
    // Extract market data
    const currentPrice = this.extractField(data, mapping.price) || 0;
    const totalSupply = this.extractField(data, mapping.supply) || 0;
    const volume24h = this.extractField(data, mapping.volume) || 0;
    const marketCap = this.extractField(data, mapping.marketCap) || (currentPrice * totalSupply);
    
    // Calculate additional metrics
    const holderCount = this.calculateHolderCount(data);
    const liquidityUSD = this.calculateLiquidity(data);
    const priceChange24h = this.calculatePriceChange(data);
    const transactions24h = this.calculateTransactionCount(data);
    
    // Create normalized token data
    const normalizedData = {
      type: 'token',
      tokenAddress: this.normalizeTokenAddress(tokenAddress),
      tokenSymbol: this.normalizeTokenSymbol(tokenSymbol),
      tokenName: tokenName,
      decimals: this.normalizeDecimals(decimals),
      tokenAge: tokenAge,
      
      // Market data
      currentPrice: this.normalizePrice(currentPrice),
      marketCap: this.normalizeMarketCap(marketCap),
      volume24h: this.normalizeVolume(volume24h),
      totalSupply: this.normalizeSupply(totalSupply),
      
      // Additional metrics
      holderCount: holderCount,
      liquidityUSD: liquidityUSD,
      priceChange24h: priceChange24h,
      transactions24h: transactions24h,
      
      // Technical indicators (calculated)
      volatility: this.calculateVolatility(data),
      liquidityScore: this.calculateLiquidityScore(liquidityUSD, volume24h),
      volumeProfile: this.calculateVolumeProfile(volume24h, marketCap),
      priceImpact: this.calculatePriceImpact(liquidityUSD),
      
      // Quality metrics
      dataQuality: this.calculateDataQuality(data),
      completeness: this.calculateCompleteness(data),
      
      // Timestamps
      createdAt: this.normalizeTimestamp(data.created_at || rawData.fetchedAt),
      lastUpdated: this.normalizeTimestamp(rawData.fetchedAt || new Date()),
      
      // Source information
      source: dataSource,
      rawDataHash: this.calculateDataHash(data)
    };
    
    return normalizedData;
  }

  /**
   * Normalize market data
   */
  async normalizeMarketData(rawData, dataSource) {
    const data = rawData.data || rawData;
    
    const normalizedData = {
      type: 'market',
      
      // SOL market data
      solPrice: this.normalizePrice(data.solPrice || 0),
      solMarketCap: this.normalizeMarketCap(data.marketCap || 0),
      solVolume24h: this.normalizeVolume(data.volume24h || 0),
      solChange24h: data.change24h || 0,
      solDominance: data.dominance || 0,
      
      // Market sentiment
      marketSentiment: this.calculateMarketSentiment(data),
      volatilityIndex: this.calculateVolatilityIndex(data),
      
      // Sector data
      memecoins: {
        totalMarketCap: this.normalizeMarketCap(data.memecoins?.totalMarketCap || 0),
        volume24h: this.normalizeVolume(data.memecoins?.volume24h || 0),
        activeTokens: data.memecoins?.activeTokens || 0,
        avgMarketCap: data.memecoins?.avgMarketCap || 0
      },
      
      // Correlation data
      correlationMatrix: this.calculateCorrelationMatrix(data),
      
      // Quality metrics
      dataQuality: this.calculateDataQuality(data),
      
      // Timestamps
      timestamp: this.normalizeTimestamp(data.timestamp || rawData.fetchedAt),
      lastUpdated: this.normalizeTimestamp(rawData.fetchedAt || new Date()),
      
      source: dataSource
    };
    
    return normalizedData;
  }

  /**
   * Normalize LP creation data
   */
  async normalizeLPCreationData(rawData, dataSource) {
    const data = rawData.data || rawData;
    
    const normalizedData = {
      type: 'lpCreation',
      tokenAddress: this.normalizeTokenAddress(data.tokenAddress || rawData.tokenAddress),
      lpValue: this.normalizePrice(data.lpValue || 0),
      quoteToken: data.quoteToken || 'SOL',
      dexProgram: data.dexProgram || 'raydium',
      
      // LP metrics
      initialLiquidity: this.normalizePrice(data.initialLiquidity || data.lpValue || 0),
      tokenReserve: this.normalizeSupply(data.tokenReserve || 0),
      quoteReserve: this.normalizeSupply(data.quoteReserve || 0),
      
      // Creation details
      creator: data.creator || '',
      transactionSignature: data.signature || '',
      blockNumber: data.blockNumber || 0,
      
      // Timestamps
      createdAt: this.normalizeTimestamp(data.timestamp || rawData.timestamp),
      
      source: dataSource
    };
    
    return normalizedData;
  }

  /**
   * Normalize generic data
   */
  async normalizeGenericData(rawData, dataSource) {
    const data = rawData.data || rawData;
    
    const normalizedData = {
      type: rawData.type || 'unknown',
      data: data,
      timestamp: this.normalizeTimestamp(rawData.fetchedAt || new Date()),
      source: dataSource
    };
    
    return normalizedData;
  }

  /**
   * Extract field from nested object using dot notation
   */
  extractField(obj, path) {
    if (!path || !obj) return null;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Calculate token age in minutes
   */
  calculateTokenAge(data) {
    const createdAt = data.created_at || data.createdAt;
    if (!createdAt) return 0;
    
    const createdTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    
    return Math.floor((currentTime - createdTime) / (1000 * 60));
  }

  /**
   * Calculate holder count
   */
  calculateHolderCount(data) {
    if (data.holders) return data.holders.length;
    if (data.holderCount) return data.holderCount;
    if (data.accounts) return data.accounts.length;
    return 0;
  }

  /**
   * Calculate liquidity
   */
  calculateLiquidity(data) {
    if (data.liquidity) return data.liquidity;
    if (data.liquidityUSD) return data.liquidityUSD;
    if (data.lpValue) return data.lpValue;
    return 0;
  }

  /**
   * Calculate price change
   */
  calculatePriceChange(data) {
    if (data.priceChange24h) return data.priceChange24h;
    if (data.change24h) return data.change24h;
    return 0;
  }

  /**
   * Calculate transaction count
   */
  calculateTransactionCount(data) {
    if (data.transactions24h) return data.transactions24h;
    if (data.transactions && data.transactions.length) return data.transactions.length;
    return 0;
  }

  /**
   * Calculate volatility
   */
  calculateVolatility(data) {
    if (data.volatility) return data.volatility;
    
    // Simple volatility calculation based on price change
    const priceChange = Math.abs(data.priceChange24h || data.change24h || 0);
    return Math.min(priceChange / 100, 1); // Cap at 100%
  }

  /**
   * Calculate liquidity score (0-1)
   */
  calculateLiquidityScore(liquidityUSD, volume24h) {
    if (liquidityUSD === 0) return 0;
    
    // Score based on liquidity amount and volume ratio
    const liquidityScore = Math.min(liquidityUSD / 100000, 1); // Max score at $100k liquidity
    const volumeRatio = volume24h / liquidityUSD;
    const ratioScore = Math.min(volumeRatio / 2, 1); // Max score at 2x volume/liquidity ratio
    
    return (liquidityScore + ratioScore) / 2;
  }

  /**
   * Calculate volume profile
   */
  calculateVolumeProfile(volume24h, marketCap) {
    if (volume24h === 0) return 'low';
    
    const volumeToMcapRatio = marketCap > 0 ? volume24h / marketCap : 0;
    
    if (volumeToMcapRatio > 1) return 'high';
    if (volumeToMcapRatio > 0.1) return 'healthy';
    if (volumeToMcapRatio > 0.01) return 'moderate';
    return 'low';
  }

  /**
   * Calculate price impact for $1000 trade
   */
  calculatePriceImpact(liquidityUSD) {
    if (liquidityUSD === 0) return 1; // 100% impact if no liquidity
    
    const tradeSize = 1000;
    const impact = tradeSize / liquidityUSD;
    
    return Math.min(impact, 1); // Cap at 100%
  }

  /**
   * Calculate data quality score
   */
  calculateDataQuality(data) {
    let score = 0;
    let maxScore = 0;
    
    // Check for required fields
    const requiredFields = ['tokenAddress', 'price', 'volume', 'supply'];
    requiredFields.forEach(field => {
      maxScore += 1;
      if (this.extractField(data, field) !== null) {
        score += 1;
      }
    });
    
    // Check for optional fields
    const optionalFields = ['symbol', 'name', 'decimals', 'marketCap'];
    optionalFields.forEach(field => {
      maxScore += 0.5;
      if (this.extractField(data, field) !== null) {
        score += 0.5;
      }
    });
    
    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Calculate completeness score
   */
  calculateCompleteness(data) {
    const allFields = Object.keys(data);
    const nonNullFields = allFields.filter(field => data[field] !== null && data[field] !== undefined);
    
    return allFields.length > 0 ? nonNullFields.length / allFields.length : 0;
  }

  /**
   * Calculate market sentiment
   */
  calculateMarketSentiment(data) {
    const change24h = data.change24h || 0;
    
    if (change24h > 5) return 'bullish';
    if (change24h < -5) return 'bearish';
    return 'neutral';
  }

  /**
   * Calculate volatility index
   */
  calculateVolatilityIndex(data) {
    const change24h = Math.abs(data.change24h || 0);
    return Math.min(change24h * 2, 100); // Scale to 0-100
  }

  /**
   * Calculate correlation matrix
   */
  calculateCorrelationMatrix(data) {
    // Placeholder - would calculate correlations between assets
    return {
      'SOL-BTC': 0.7,
      'SOL-ETH': 0.8,
      'SOL-MEME': 0.6
    };
  }

  /**
   * Calculate data hash for deduplication
   */
  calculateDataHash(data) {
    const dataString = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  // Normalization helper methods
  normalizeTokenAddress(address) {
    if (!address) return '';
    return address.toString().trim();
  }

  normalizeTokenSymbol(symbol) {
    if (!symbol) return 'UNKNOWN';
    return symbol.toString().toUpperCase().trim();
  }

  normalizePrice(price) {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? 0 : Math.max(0, numPrice);
  }

  normalizeVolume(volume) {
    const numVolume = parseFloat(volume);
    return isNaN(numVolume) ? 0 : Math.max(0, numVolume);
  }

  normalizeMarketCap(marketCap) {
    const numMarketCap = parseFloat(marketCap);
    return isNaN(numMarketCap) ? 0 : Math.max(0, numMarketCap);
  }

  normalizeSupply(supply) {
    const numSupply = parseFloat(supply);
    return isNaN(numSupply) ? 0 : Math.max(0, numSupply);
  }

  normalizeDecimals(decimals) {
    const numDecimals = parseInt(decimals);
    return isNaN(numDecimals) ? this.config.defaultTokenDecimals : Math.max(0, Math.min(18, numDecimals));
  }

  normalizeTimestamp(timestamp) {
    if (!timestamp) return new Date();
    
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  /**
   * Update metrics
   */
  updateMetrics(startTime, success) {
    const processingTime = Date.now() - startTime;
    this.metrics.averageNormalizationTime = (this.metrics.averageNormalizationTime + processingTime) / 2;
  }

  /**
   * Get normalization metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: (this.metrics.successfulNormalizations / this.metrics.totalNormalizations) * 100
    };
  }
}

module.exports = DataNormalizer;