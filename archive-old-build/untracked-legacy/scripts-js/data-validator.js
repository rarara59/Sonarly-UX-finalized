// src/scripts-js/data-validator.js
const { EventEmitter } = require('events');

/**
 * Data Validator - Quality Control & Anomaly Detection
 * Validates data quality and filters out suspicious/bad data
 */
class DataValidator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Price validation
      minPrice: config.minPrice || 0.000001,
      maxPrice: config.maxPrice || 1000000,
      maxPriceChange: config.maxPriceChange || 1000, // 1000% max change
      
      // Volume validation
      minVolume: config.minVolume || 0,
      maxVolume: config.maxVolume || 1000000000,
      
      // Market cap validation
      minMarketCap: config.minMarketCap || 1000,
      maxMarketCap: config.maxMarketCap || 10000000000,
      
      // Supply validation
      minSupply: config.minSupply || 1000,
      maxSupply: config.maxSupply || 1000000000000,
      
      // Liquidity validation
      minLiquidity: config.minLiquidity || 100,
      maxLiquidity: config.maxLiquidity || 100000000,
      
      // Time validation
      maxAge: config.maxAge || 86400000, // 24 hours
      
      // Quality thresholds
      minDataQuality: config.minDataQuality || 0.7,
      minCompleteness: config.minCompleteness || 0.5,
      
      // Anomaly detection
      enableAnomalyDetection: config.enableAnomalyDetection !== false,
      anomalyThreshold: config.anomalyThreshold || 3, // 3 standard deviations
      
      // Blacklist
      blacklistedTokens: config.blacklistedTokens || [],
      blacklistedPatterns: config.blacklistedPatterns || [],
      
      // Strictness
      strictMode: config.strictMode || false
    };
    
    // Historical data for anomaly detection
    this.historicalData = {
      prices: [],
      volumes: [],
      marketCaps: [],
      liquidities: []
    };
    
    // Validation rules
    this.validationRules = [
      this.validateBasicFields.bind(this),
      this.validateTokenAddress.bind(this),
      this.validatePriceData.bind(this),
      this.validateVolumeData.bind(this),
      this.validateMarketData.bind(this),
      this.validateLiquidityData.bind(this),
      this.validateTimestamps.bind(this),
      this.validateDataQuality.bind(this),
      this.validateBlacklist.bind(this),
      this.validateAnomalies.bind(this)
    ];
    
    // Performance metrics
    this.metrics = {
      totalValidations: 0,
      validData: 0,
      invalidData: 0,
      averageValidationTime: 0,
      
      // Rejection reasons
      rejectionReasons: {
        basicFields: 0,
        tokenAddress: 0,
        priceData: 0,
        volumeData: 0,
        marketData: 0,
        liquidityData: 0,
        timestamps: 0,
        dataQuality: 0,
        blacklist: 0,
        anomalies: 0
      },
      
      // Anomaly detection
      anomaliesDetected: 0,
      falsePositives: 0
    };
    
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, ...args) => console.log(`[DataValidator] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[DataValidator] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[DataValidator] ${msg}`, ...args),
      debug: (msg, ...args) => console.debug(`[DataValidator] ${msg}`, ...args)
    };
  }

  /**
   * Validate data against all rules
   */
  async validate(data) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalValidations++;
      
      // Run all validation rules
      const validationResults = await this.runValidationRules(data);
      
      // Check if all validations passed
      const isValid = validationResults.every(result => result.valid);
      
      if (isValid) {
        this.metrics.validData++;
        this.updateHistoricalData(data);
      } else {
        this.metrics.invalidData++;
        this.updateRejectionMetrics(validationResults);
        
        // Log validation failures
        const failures = validationResults.filter(result => !result.valid);
        this.logger.warn(`Validation failed for ${data.tokenAddress}:`, failures);
      }
      
      this.updateMetrics(startTime, isValid);
      
      return isValid;
      
    } catch (error) {
      this.updateMetrics(startTime, false);
      this.logger.error('Validation error:', error);
      throw error;
    }
  }

  /**
   * Run all validation rules
   */
  async runValidationRules(data) {
    const results = [];
    
    for (const rule of this.validationRules) {
      try {
        const result = await rule(data);
        results.push(result);
        
        // Stop on first failure if in strict mode
        if (this.config.strictMode && !result.valid) {
          break;
        }
      } catch (error) {
        results.push({
          valid: false,
          rule: rule.name,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Validate basic required fields
   */
  validateBasicFields(data) {
    const requiredFields = ['tokenAddress', 'type', 'currentPrice', 'volume24h'];
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        missingFields.push(field);
      }
    }
    
    return {
      valid: missingFields.length === 0,
      rule: 'basicFields',
      message: missingFields.length > 0 ? `Missing required fields: ${missingFields.join(', ')}` : 'All required fields present'
    };
  }

  /**
   * Validate token address format
   */
  validateTokenAddress(data) {
    const { tokenAddress } = data;
    
    // Basic Solana address validation
    if (!tokenAddress || typeof tokenAddress !== 'string') {
      return {
        valid: false,
        rule: 'tokenAddress',
        message: 'Invalid token address format'
      };
    }
    
    // Check length (Solana addresses are 32-44 characters)
    if (tokenAddress.length < 32 || tokenAddress.length > 44) {
      return {
        valid: false,
        rule: 'tokenAddress',
        message: 'Token address length invalid'
      };
    }
    
    // Check for valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(tokenAddress)) {
      return {
        valid: false,
        rule: 'tokenAddress',
        message: 'Token address contains invalid characters'
      };
    }
    
    return {
      valid: true,
      rule: 'tokenAddress',
      message: 'Token address valid'
    };
  }

  /**
   * Validate price data
   */
  validatePriceData(data) {
    const { currentPrice, priceChange24h } = data;
    
    // Price range validation
    if (currentPrice < this.config.minPrice || currentPrice > this.config.maxPrice) {
      return {
        valid: false,
        rule: 'priceData',
        message: `Price ${currentPrice} outside valid range (${this.config.minPrice} - ${this.config.maxPrice})`
      };
    }
    
    // Price change validation
    if (priceChange24h && Math.abs(priceChange24h) > this.config.maxPriceChange) {
      return {
        valid: false,
        rule: 'priceData',
        message: `Price change ${priceChange24h}% exceeds maximum ${this.config.maxPriceChange}%`
      };
    }
    
    // Check for suspicious price patterns
    if (this.isSuspiciousPrice(currentPrice)) {
      return {
        valid: false,
        rule: 'priceData',
        message: 'Suspicious price pattern detected'
      };
    }
    
    return {
      valid: true,
      rule: 'priceData',
      message: 'Price data valid'
    };
  }

  /**
   * Validate volume data
   */
  validateVolumeData(data) {
    const { volume24h, marketCap } = data;
    
    // Volume range validation
    if (volume24h < this.config.minVolume || volume24h > this.config.maxVolume) {
      return {
        valid: false,
        rule: 'volumeData',
        message: `Volume ${volume24h} outside valid range`
      };
    }
    
    // Volume to market cap ratio check
    if (marketCap > 0) {
      const volumeRatio = volume24h / marketCap;
      
      // Suspicious if volume is more than 10x market cap
      if (volumeRatio > 10) {
        return {
          valid: false,
          rule: 'volumeData',
          message: `Volume/MarketCap ratio ${volumeRatio.toFixed(2)} is suspicious`
        };
      }
    }
    
    return {
      valid: true,
      rule: 'volumeData',
      message: 'Volume data valid'
    };
  }

  /**
   * Validate market data
   */
  validateMarketData(data) {
    const { marketCap, totalSupply, currentPrice } = data;
    
    // Market cap range validation
    if (marketCap < this.config.minMarketCap || marketCap > this.config.maxMarketCap) {
      return {
        valid: false,
        rule: 'marketData',
        message: `Market cap ${marketCap} outside valid range`
      };
    }
    
    // Supply validation
    if (totalSupply < this.config.minSupply || totalSupply > this.config.maxSupply) {
      return {
        valid: false,
        rule: 'marketData',
        message: `Supply ${totalSupply} outside valid range`
      };
    }
    
    // Market cap consistency check
    const calculatedMarketCap = currentPrice * totalSupply;
    const marketCapDifference = Math.abs(marketCap - calculatedMarketCap) / marketCap;
    
    if (marketCapDifference > 0.5) { // 50% difference threshold
      return {
        valid: false,
        rule: 'marketData',
        message: `Market cap inconsistency detected: ${marketCapDifference.toFixed(2)}`
      };
    }
    
    return {
      valid: true,
      rule: 'marketData',
      message: 'Market data valid'
    };
  }

  /**
   * Validate liquidity data
   */
  validateLiquidityData(data) {
    const { liquidityUSD, volume24h } = data;
    
    // Liquidity range validation
    if (liquidityUSD < this.config.minLiquidity || liquidityUSD > this.config.maxLiquidity) {
      return {
        valid: false,
        rule: 'liquidityData',
        message: `Liquidity ${liquidityUSD} outside valid range`
      };
    }
    
    // Volume to liquidity ratio check
    if (liquidityUSD > 0) {
      const volumeRatio = volume24h / liquidityUSD;
      
      // Suspicious if volume is more than 50x liquidity
      if (volumeRatio > 50) {
        return {
          valid: false,
          rule: 'liquidityData',
          message: `Volume/Liquidity ratio ${volumeRatio.toFixed(2)} is suspicious`
        };
      }
    }
    
    return {
      valid: true,
      rule: 'liquidityData',
      message: 'Liquidity data valid'
    };
  }

  /**
   * Validate timestamps
   */
  validateTimestamps(data) {
    const { createdAt, lastUpdated } = data;
    const now = Date.now();
    
    // Check if data is too old
    if (lastUpdated) {
      const age = now - new Date(lastUpdated).getTime();
      if (age > this.config.maxAge) {
        return {
          valid: false,
          rule: 'timestamps',
          message: `Data too old: ${age}ms (max: ${this.config.maxAge}ms)`
        };
      }
    }
    
    // Check if creation date is in the future
    if (createdAt) {
      const creationTime = new Date(createdAt).getTime();
      if (creationTime > now) {
        return {
          valid: false,
          rule: 'timestamps',
          message: 'Creation date in the future'
        };
      }
    }
    
    return {
      valid: true,
      rule: 'timestamps',
      message: 'Timestamps valid'
    };
  }

  /**
   * Validate data quality metrics
   */
  validateDataQuality(data) {
    const { dataQuality, completeness } = data;
    
    // Data quality threshold check
    if (dataQuality < this.config.minDataQuality) {
      return {
        valid: false,
        rule: 'dataQuality',
        message: `Data quality ${dataQuality} below threshold ${this.config.minDataQuality}`
      };
    }
    
    // Completeness threshold check
    if (completeness < this.config.minCompleteness) {
      return {
        valid: false,
        rule: 'dataQuality',
        message: `Data completeness ${completeness} below threshold ${this.config.minCompleteness}`
      };
    }
    
    return {
      valid: true,
      rule: 'dataQuality',
      message: 'Data quality acceptable'
    };
  }

  /**
   * Validate against blacklist
   */
  validateBlacklist(data) {
    const { tokenAddress, tokenSymbol } = data;
    
    // Check blacklisted tokens
    if (this.config.blacklistedTokens.includes(tokenAddress)) {
      return {
        valid: false,
        rule: 'blacklist',
        message: `Token ${tokenAddress} is blacklisted`
      };
    }
    
    // Check blacklisted patterns
    for (const pattern of this.config.blacklistedPatterns) {
      if (tokenSymbol && tokenSymbol.match(pattern)) {
        return {
          valid: false,
          rule: 'blacklist',
          message: `Token symbol ${tokenSymbol} matches blacklisted pattern ${pattern}`
        };
      }
    }
    
    return {
      valid: true,
      rule: 'blacklist',
      message: 'Not blacklisted'
    };
  }

  /**
   * Validate for anomalies
   */
  validateAnomalies(data) {
    if (!this.config.enableAnomalyDetection) {
      return {
        valid: true,
        rule: 'anomalies',
        message: 'Anomaly detection disabled'
      };
    }
    
    const anomalies = this.detectAnomalies(data);
    
    if (anomalies.length > 0) {
      this.metrics.anomaliesDetected++;
      return {
        valid: false,
        rule: 'anomalies',
        message: `Anomalies detected: ${anomalies.join(', ')}`
      };
    }
    
    return {
      valid: true,
      rule: 'anomalies',
      message: 'No anomalies detected'
    };
  }

  /**
   * Detect anomalies using statistical methods
   */
  detectAnomalies(data) {
    const anomalies = [];
    
    // Price anomaly detection
    const priceAnomaly = this.detectPriceAnomaly(data.currentPrice);
    if (priceAnomaly) {
      anomalies.push('price');
    }
    
    // Volume anomaly detection
    const volumeAnomaly = this.detectVolumeAnomaly(data.volume24h);
    if (volumeAnomaly) {
      anomalies.push('volume');
    }
    
    // Market cap anomaly detection
    const marketCapAnomaly = this.detectMarketCapAnomaly(data.marketCap);
    if (marketCapAnomaly) {
      anomalies.push('marketCap');
    }
    
    // Liquidity anomaly detection
    const liquidityAnomaly = this.detectLiquidityAnomaly(data.liquidityUSD);
    if (liquidityAnomaly) {
      anomalies.push('liquidity');
    }
    
    return anomalies;
  }

  /**
   * Detect price anomaly using z-score
   */
  detectPriceAnomaly(price) {
    if (this.historicalData.prices.length < 10) {
      return false; // Need more data
    }
    
    const mean = this.historicalData.prices.reduce((sum, p) => sum + p, 0) / this.historicalData.prices.length;
    const variance = this.historicalData.prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / this.historicalData.prices.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return false;
    
    const zScore = Math.abs(price - mean) / stdDev;
    return zScore > this.config.anomalyThreshold;
  }

  /**
   * Detect volume anomaly
   */
  detectVolumeAnomaly(volume) {
    if (this.historicalData.volumes.length < 10) {
      return false;
    }
    
    const mean = this.historicalData.volumes.reduce((sum, v) => sum + v, 0) / this.historicalData.volumes.length;
    const variance = this.historicalData.volumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / this.historicalData.volumes.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return false;
    
    const zScore = Math.abs(volume - mean) / stdDev;
    return zScore > this.config.anomalyThreshold;
  }

  /**
   * Detect market cap anomaly
   */
  detectMarketCapAnomaly(marketCap) {
    if (this.historicalData.marketCaps.length < 10) {
      return false;
    }
    
    const mean = this.historicalData.marketCaps.reduce((sum, mc) => sum + mc, 0) / this.historicalData.marketCaps.length;
    const variance = this.historicalData.marketCaps.reduce((sum, mc) => sum + Math.pow(mc - mean, 2), 0) / this.historicalData.marketCaps.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return false;
    
    const zScore = Math.abs(marketCap - mean) / stdDev;
    return zScore > this.config.anomalyThreshold;
  }

  /**
   * Detect liquidity anomaly
   */
  detectLiquidityAnomaly(liquidity) {
    if (this.historicalData.liquidities.length < 10) {
      return false;
    }
    
    const mean = this.historicalData.liquidities.reduce((sum, l) => sum + l, 0) / this.historicalData.liquidities.length;
    const variance = this.historicalData.liquidities.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / this.historicalData.liquidities.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return false;
    
    const zScore = Math.abs(liquidity - mean) / stdDev;
    return zScore > this.config.anomalyThreshold;
  }

  /**
   * Check for suspicious price patterns
   */
  isSuspiciousPrice(price) {
    // Check for round numbers (often fake)
    if (price === Math.round(price) && price > 1) {
      return true;
    }
    
    // Check for too many zeros or nines
    const priceStr = price.toString();
    const zeroCount = (priceStr.match(/0/g) || []).length;
    const nineCount = (priceStr.match(/9/g) || []).length;
    
    if (zeroCount > 8 || nineCount > 6) {
      return true;
    }
    
    return false;
  }

  /**
   * Update historical data for anomaly detection
   */
  updateHistoricalData(data) {
    const maxHistorySize = 1000;
    
    // Update price history
    this.historicalData.prices.push(data.currentPrice);
    if (this.historicalData.prices.length > maxHistorySize) {
      this.historicalData.prices.shift();
    }
    
    // Update volume history
    this.historicalData.volumes.push(data.volume24h);
    if (this.historicalData.volumes.length > maxHistorySize) {
      this.historicalData.volumes.shift();
    }
    
    // Update market cap history
    this.historicalData.marketCaps.push(data.marketCap);
    if (this.historicalData.marketCaps.length > maxHistorySize) {
      this.historicalData.marketCaps.shift();
    }
    
    // Update liquidity history
    this.historicalData.liquidities.push(data.liquidityUSD);
    if (this.historicalData.liquidities.length > maxHistorySize) {
      this.historicalData.liquidities.shift();
    }
  }

  /**
   * Update rejection metrics
   */
  updateRejectionMetrics(validationResults) {
    validationResults.forEach(result => {
      if (!result.valid && result.rule) {
        this.metrics.rejectionReasons[result.rule]++;
      }
    });
  }

  /**
   * Update performance metrics
   */
  updateMetrics(startTime, success) {
    const validationTime = Date.now() - startTime;
    this.metrics.averageValidationTime = (this.metrics.averageValidationTime + validationTime) / 2;
  }

  /**
   * Add token to blacklist
   */
  addToBlacklist(tokenAddress) {
    if (!this.config.blacklistedTokens.includes(tokenAddress)) {
      this.config.blacklistedTokens.push(tokenAddress);
      this.logger.info(`Token ${tokenAddress} added to blacklist`);
    }
  }

  /**
   * Remove token from blacklist
   */
  removeFromBlacklist(tokenAddress) {
    const index = this.config.blacklistedTokens.indexOf(tokenAddress);
    if (index > -1) {
      this.config.blacklistedTokens.splice(index, 1);
      this.logger.info(`Token ${tokenAddress} removed from blacklist`);
    }
  }

  /**
   * Get validation metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      validationRate: (this.metrics.validData / this.metrics.totalValidations) * 100,
      historicalDataSize: {
        prices: this.historicalData.prices.length,
        volumes: this.historicalData.volumes.length,
        marketCaps: this.historicalData.marketCaps.length,
        liquidities: this.historicalData.liquidities.length
      }
    };
  }

  /**
   * Get validation summary
   */
  getValidationSummary() {
    const totalRejections = Object.values(this.metrics.rejectionReasons).reduce((sum, count) => sum + count, 0);
    
    return {
      totalValidations: this.metrics.totalValidations,
      validData: this.metrics.validData,
      invalidData: this.metrics.invalidData,
      validationRate: (this.metrics.validData / this.metrics.totalValidations) * 100,
      topRejectionReasons: Object.entries(this.metrics.rejectionReasons)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count, percentage: (count / totalRejections) * 100 }))
    };
  }
}

module.exports = DataValidator;