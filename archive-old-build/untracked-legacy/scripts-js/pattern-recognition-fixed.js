// src/scripts-js/pattern-recognition-fixed.js
// Lightweight Pattern Recognition Service - No Heavy Dependencies
// Renaissance-style algorithms preserved, startup optimized

'use strict';

// Note: This file uses ES modules. For CommonJS projects, change exports at bottom

// Lightweight logger replacement
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err || ''),
  debug: (msg) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`)
};

// Enums as frozen objects
const PatternType = Object.freeze({
  // Fast patterns (1-4 hour timeframe)
  BREAKOUT: 'breakout',
  V_RECOVERY: 'vRecovery', 
  BULL_FLAG: 'bullFlag',
  ACCUMULATION: 'accumulation',
  
  // Slow patterns (4-48 hour timeframe)
  CUP_AND_HANDLE: 'cupAndHandle',
  INVERSE_HEAD_SHOULDERS: 'inverseHeadAndShoulders',
  ROUNDED_BOTTOM: 'roundedBottom',
  SMART_MONEY_ACCUMULATION: 'smartMoneyAccumulation'
});

const PatternStatus = Object.freeze({
  FORMING: 'forming',
  CONFIRMED: 'confirmed',
  INVALIDATED: 'invalidated', 
  COMPLETED: 'completed'
});

const TimeframeType = Object.freeze({
  FAST: 'fast',
  SLOW: 'slow'
});

// Lightweight technical indicators
const TechnicalIndicators = {
  sma: (values, period) => {
    if (values.length < period) return [];
    const result = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  },
  
  bollingerBands: (values, period, stdDev = 2) => {
    if (values.length < period) return [];
    const sma = TechnicalIndicators.sma(values, period);
    const result = [];
    
    for (let i = 0; i < sma.length; i++) {
      const slice = values.slice(i, i + period);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      result.push({
        middle: mean,
        upper: mean + (standardDeviation * stdDev),
        lower: mean - (standardDeviation * stdDev)
      });
    }
    return result;
  }
};

class PatternRecognitionService {
  constructor() {
    this.logger = logger;
    
    // In-memory pattern storage (no database dependency)
    this.activePatterns = new Map([
      [TimeframeType.FAST, new Map()],
      [TimeframeType.SLOW, new Map()]
    ]);
    
    // Pattern scanning configuration
    this.timeframes = {
      [TimeframeType.FAST]: {
        interval: '1-4h',
        candleTimeframe: '15m',
        periodsToKeep: 20,
        scanInterval: 15 * 60 * 1000 // 15 minutes
      },
      [TimeframeType.SLOW]: {
        interval: '4-48h', 
        candleTimeframe: '1h',
        periodsToKeep: 60,
        scanInterval: 60 * 60 * 1000 // 1 hour
      }
    };
    
    this.scanIntervalIds = {
      [TimeframeType.FAST]: null,
      [TimeframeType.SLOW]: null
    };
    
    // Renaissance-style pattern definitions
    this.patternDefinitions = {
      [TimeframeType.FAST]: {
        [PatternType.BREAKOUT]: {
          minConsolidationPeriods: 6,
          breakoutVolumeMultiplier: 2.0,
          minPriceIncrease: 0.05,
          confirmationPeriods: 2,
          maxLookbackPeriods: 24
        },
        [PatternType.V_RECOVERY]: {
          minDropPercentage: 0.10,
          minRecoveryPercentage: 0.08,
          maxRecoveryTime: 12,
          volumeIncreaseThreshold: 1.5
        },
        [PatternType.BULL_FLAG]: {
          minInitialMove: 0.15,
          consolidationTimeMin: 3,
          consolidationTimeMax: 12,
          maxRetracement: 0.5,
          volumeDecreaseThreshold: 0.7
        },
        [PatternType.ACCUMULATION]: {
          minPeriods: 8,
          maxPriceVariation: 0.05,
          volumeIncreaseEnd: 1.8,
          smartMoneyThreshold: 3
        }
      },
      
      [TimeframeType.SLOW]: {
        [PatternType.CUP_AND_HANDLE]: {
          minCupDepth: 0.15,
          maxCupDepth: 0.5,
          minCupLength: 10,
          maxCupLength: 40,
          maxHandleRetracement: 0.4,
          minHandleLength: 5,
          maxHandleLength: 15
        },
        [PatternType.INVERSE_HEAD_SHOULDERS]: {
          minPatternDepth: 0.12,
          maxShoulderAsymmetry: 0.3,
          necklineVariation: 0.05,
          minHeadDepth: 0.15,
          confirmationBreakout: 0.03
        },
        [PatternType.ROUNDED_BOTTOM]: {
          minBottomDepth: 0.2,
          minBottomLength: 15,
          maxBottomLength: 60,
          minRoundingScore: 0.7,
          volumePattern: 'decreasing-then-increasing'
        },
        [PatternType.SMART_MONEY_ACCUMULATION]: {
          minSmartWallets: 5,
          minNetBuyPercentage: 0.6,
          minAccumulationPeriods: 12,
          maxPriceIncreaseDuringAccumulation: 0.1
        }
      }
    };
  }
  
  /**
   * Initialize the pattern recognition service
   */
  init() {
    try {
      this.loadActivePatterns();
      this.startPatternScanners();
      this.logger.info('Pattern recognition service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize pattern recognition service:', error);
      return false;
    }
  }
  
  /**
   * Load active patterns from memory (no database dependency)
   */
  loadActivePatterns() {
    // In production, this would load from persistent storage
    // For now, start with empty pattern maps
    this.logger.info('Loaded 0 active patterns (in-memory mode)');
  }
  
  /**
   * Start pattern scanners for each timeframe
   */
  startPatternScanners() {
    // Clear any existing intervals
    if (this.scanIntervalIds[TimeframeType.FAST]) {
      clearInterval(this.scanIntervalIds[TimeframeType.FAST]);
    }
    
    if (this.scanIntervalIds[TimeframeType.SLOW]) {
      clearInterval(this.scanIntervalIds[TimeframeType.SLOW]);
    }
    
    // Start fast pattern scanner
    this.scanIntervalIds[TimeframeType.FAST] = setInterval(() => {
      this.scanForPatterns(TimeframeType.FAST);
    }, this.timeframes[TimeframeType.FAST].scanInterval);
    
    // Start slow pattern scanner  
    this.scanIntervalIds[TimeframeType.SLOW] = setInterval(() => {
      this.scanForPatterns(TimeframeType.SLOW);
    }, this.timeframes[TimeframeType.SLOW].scanInterval);
    
    this.logger.info('Pattern scanners started');
  }
  
  /**
   * Scan for patterns in the specified timeframe
   */
  async scanForPatterns(timeframe) {
    this.logger.debug(`Scanning for ${timeframe} patterns`);
    
    try {
      const tokensToScan = await this.getTokensToScan(timeframe);
      
      for (const token of tokensToScan) {
        try {
          const marketData = await this.getMarketData(token.address, token.network, timeframe);
          
          if (!marketData || marketData.candles.length < 10) {
            continue;
          }
          
          await this.detectNewPatterns(token, marketData, timeframe);
          await this.updateActivePatterns(token, marketData, timeframe);
        } catch (error) {
          this.logger.error(`Error scanning patterns for ${token.symbol}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Error in ${timeframe} pattern scanner:`, error);
    }
  }
  
  /**
   * Get market data for pattern analysis - REQUIRES REAL IMPLEMENTATION
   */
  async getMarketData(address, network, timeframe) {
    try {
      // TODO: Replace with real market data service integration
      // This is a functional stub - replace with Helius/Chainstack integration
      const candles = await this.getMarketDataStub(address, timeframe);
      
      if (!candles || candles.length === 0) {
        return null;
      }
      
      // TODO: Replace with real smart money activity detection
      const smartMoneyActivity = await this.getSmartMoneyActivity(address, network);
      
      return {
        candles,
        smartMoneyActivity
      };
    } catch (error) {
      this.logger.error(`Error getting market data for ${address} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Functional stub for market data - REPLACE WITH REAL IMPLEMENTATION
   */
  async getMarketDataStub(address, timeframe) {
    // Functional stub that returns consistent structure
    // Replace this with real Helius/Chainstack market data
    const periods = timeframe === TimeframeType.FAST ? 20 : 60;
    const candles = [];
    
    // Generate realistic-looking price data for testing
    let basePrice = 1.0 + (Math.random() * 10); // $1-11 range
    const now = Date.now();
    const intervalMs = timeframe === TimeframeType.FAST ? 15 * 60 * 1000 : 60 * 60 * 1000;
    
    for (let i = 0; i < periods; i++) {
      const timestamp = new Date(now - (periods - i) * intervalMs);
      const volatility = 0.05 + (Math.random() * 0.05); // 5-10% volatility
      const change = (Math.random() - 0.5) * volatility;
      
      basePrice = Math.max(0.01, basePrice * (1 + change));
      
      const open = basePrice;
      const close = basePrice * (1 + (Math.random() - 0.5) * 0.02);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.random() * 1000000 + 100000; // 100K-1.1M volume
      
      candles.push({
        open,
        high,
        low, 
        close,
        volume,
        timestamp
      });
      
      basePrice = close;
    }
    
    return candles;
  }
  
  /**
   * Get smart money activity - REQUIRES REAL IMPLEMENTATION  
   */
  async getSmartMoneyActivity(address, network) {
    // TODO: Replace with real smart wallet tracking
    // This should integrate with your smart wallet database
    return {
      buys: Math.floor(Math.random() * 15),
      sells: Math.floor(Math.random() * 5),
      netBuys: Math.floor(Math.random() * 10),
      walletCount: Math.floor(Math.random() * 10)
    };
  }
  
  /**
   * Detect new patterns in market data
   */
  async detectNewPatterns(token, marketData, timeframe) {
    const patterns = this.patternDefinitions[timeframe];
    
    for (const [patternType, criteria] of Object.entries(patterns)) {
      const patternKey = `${token.address}-${token.network}-${patternType}`;
      if (this.activePatterns.get(timeframe).has(patternKey)) {
        continue;
      }
      
      let detected = false;
      let patternData = null;
      
      switch (patternType) {
        case PatternType.BREAKOUT:
          [detected, patternData] = this.detectBreakoutPattern(marketData, criteria);
          break;
        case PatternType.V_RECOVERY:
          [detected, patternData] = this.detectVRecoveryPattern(marketData, criteria);
          break;
        case PatternType.BULL_FLAG:
          [detected, patternData] = this.detectBullFlagPattern(marketData, criteria);
          break;
        case PatternType.ACCUMULATION:
        case PatternType.SMART_MONEY_ACCUMULATION:
          [detected, patternData] = this.detectAccumulationPattern(marketData, criteria);
          break;
        case PatternType.CUP_AND_HANDLE:
          [detected, patternData] = this.detectCupAndHandlePattern(marketData, criteria);
          break;
        case PatternType.INVERSE_HEAD_SHOULDERS:
          [detected, patternData] = this.detectInverseHeadAndShouldersPattern(marketData, criteria);
          break;
        case PatternType.ROUNDED_BOTTOM:
          [detected, patternData] = this.detectRoundedBottomPattern(marketData, criteria);
          break;
        default:
          detected = false;
      }
      
      if (detected && patternData) {
        await this.createPattern(token, patternType, patternData, timeframe);
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // RENAISSANCE PATTERN DETECTION ALGORITHMS (Mathematical Core Preserved)
  // -------------------------------------------------------------------------
  
  /**
   * Detect breakout pattern - Complete Renaissance implementation
   */
  detectBreakoutPattern(marketData, criteria) {
    try {
      const { candles } = marketData;
      
      if (candles.length < Number(criteria.maxLookbackPeriods)) {
        return [false, null];
      }
      
      const period = Math.min(candles.length, 14);
      const priceData = candles.map(c => c.close);
      const volumeData = candles.map(c => c.volume);
      
      const sma = TechnicalIndicators.sma(priceData, period);
      const bollingerBands = TechnicalIndicators.bollingerBands(priceData, period, 2);
      
      const lookbackPeriods = Math.min(Number(criteria.maxLookbackPeriods), candles.length - period);
      let consolidationStart = -1;
      let consolidationEnd = -1;
      
      // Find consolidation period using Bollinger Band compression
      for (let i = candles.length - lookbackPeriods; i < candles.length - 2; i++) {
        const bbIndex = i - (candles.length - bollingerBands.length);
        if (bbIndex < 0) continue;
        
        const bandwidth = (bollingerBands[bbIndex].upper - bollingerBands[bbIndex].lower) / bollingerBands[bbIndex].middle;
        
        if (bandwidth < 0.05 && consolidationStart === -1) {
          consolidationStart = i;
        } else if (bandwidth > 0.08 && consolidationStart !== -1 && consolidationEnd === -1) {
          consolidationEnd = i;
          break;
        }
      }
      
      if (consolidationStart !== -1 && 
          (consolidationEnd !== -1 || candles.length - consolidationStart >= Number(criteria.minConsolidationPeriods))) {
        
        if (consolidationEnd === -1) {
          consolidationEnd = candles.length - 2;
        }
        
        const lastPrice = candles[candles.length - 1].close;
        const consolidationPrices = candles.slice(consolidationStart, consolidationEnd + 1).map(c => c.close);
        const consolidationHigh = Math.max(...consolidationPrices);
        const priceIncrease = (lastPrice - consolidationHigh) / consolidationHigh;
        
        const consolidationVolumes = candles.slice(consolidationStart, consolidationEnd + 1).map(c => c.volume);
        const avgConsolidationVolume = consolidationVolumes.reduce((sum, vol) => sum + vol, 0) / consolidationVolumes.length;
        
        if (priceIncrease > Number(criteria.minPriceIncrease) && 
            candles[candles.length - 1].volume > avgConsolidationVolume * Number(criteria.breakoutVolumeMultiplier)) {
          
          const confidenceScore = Math.min(100, 
            60 + 
            (priceIncrease / Number(criteria.minPriceIncrease)) * 20 + 
            (candles[candles.length - 1].volume / (avgConsolidationVolume * Number(criteria.breakoutVolumeMultiplier))) * 20
          );
          
          const consolidationLow = Math.min(...consolidationPrices);
          const breakoutHeight = consolidationHigh - consolidationLow;
          const targetPrice = lastPrice + breakoutHeight;
          const stopLossPrice = consolidationHigh * 0.98;
          
          return [true, {
            confidence: confidenceScore,
            startTime: candles[consolidationStart].timestamp,
            initialPrice: candles[consolidationStart].close,
            currentPrice: lastPrice,
            targetPrice,
            stopLossPrice,
            prices: candles.slice(consolidationStart).map(c => c.close),
            volumes: candles.slice(consolidationStart).map(c => c.volume),
            timestamps: candles.slice(consolidationStart).map(c => c.timestamp),
            indicators: {
              sma: sma.slice(-10),
              bollingerBands: bollingerBands.slice(-10)
            },
            smartMoneyActivity: marketData.smartMoneyActivity
          }];
        }
      }
      
      return [false, null];
    } catch (error) {
      this.logger.error('Error detecting breakout pattern:', error);
      return [false, null];
    }
  }
  
  /**
   * Detect V-Recovery pattern: Sharp drop followed by sharp recovery
   */
  detectVRecoveryPattern(marketData, criteria) {
    try {
      const { candles } = marketData;
      
      if (candles.length < 10) return [false, null];
      
      let dropStart = -1;
      let dropEnd = -1;
      let recoveryEnd = -1;
      
      const prices = candles.map(c => c.close);
      const volumes = candles.map(c => c.volume);
      
      // Find the drop phase with Renaissance precision
      for (let i = candles.length - 15; i < candles.length - 5; i++) {
        if (i < 0) continue;
        
        if (dropStart === -1) {
          let maxDrop = 0;
          let dropEndCandidate = -1;
          
          for (let j = i + 1; j < Math.min(i + 8, candles.length); j++) {
            const drop = (prices[i] - prices[j]) / prices[i];
            if (drop > maxDrop) {
              maxDrop = drop;
              dropEndCandidate = j;
            }
          }
          
          if (maxDrop >= Number(criteria.minDropPercentage)) {
            dropStart = i;
            dropEnd = dropEndCandidate;
            break;
          }
        }
      }
      
      if (dropStart === -1 || dropEnd === -1) return [false, null];
      
      // Find recovery phase
      const dropLow = prices[dropEnd];
      let maxRecovery = 0;
      
      for (let i = dropEnd + 1; i < candles.length; i++) {
        const recovery = (prices[i] - dropLow) / dropLow;
        if (recovery > maxRecovery) {
          maxRecovery = recovery;
          recoveryEnd = i;
        }
      }
      
      if (maxRecovery < Number(criteria.minRecoveryPercentage) || 
          recoveryEnd - dropEnd > Number(criteria.maxRecoveryTime)) {
        return [false, null];
      }
      
      // Check volume pattern - institutional quality validation
      const dropVolume = volumes.slice(dropStart, dropEnd + 1);
      const recoveryVolume = volumes.slice(dropEnd, recoveryEnd + 1);
      const avgDropVolume = dropVolume.reduce((sum, v) => sum + v, 0) / dropVolume.length;
      const avgRecoveryVolume = recoveryVolume.reduce((sum, v) => sum + v, 0) / recoveryVolume.length;
      
      if (avgRecoveryVolume < avgDropVolume * Number(criteria.volumeIncreaseThreshold)) {
        return [false, null];
      }
      
      // Renaissance-style confidence calculation
      const recoveryStrength = maxRecovery / Number(criteria.minRecoveryPercentage);
      const volumeStrength = (avgRecoveryVolume / avgDropVolume) / Number(criteria.volumeIncreaseThreshold);
      const timeScore = 1 - ((recoveryEnd - dropEnd) / Number(criteria.maxRecoveryTime));
      
      const confidence = Math.min(95, 50 + recoveryStrength * 20 + volumeStrength * 15 + timeScore * 10);
      
      const recoveryHeight = prices[recoveryEnd] - dropLow;
      const targetPrice = prices[recoveryEnd] + recoveryHeight * 0.618; // Fibonacci extension
      const stopLossPrice = dropLow * 1.02;
      
      return [true, {
        confidence,
        startTime: candles[dropStart].timestamp,
        initialPrice: prices[dropStart],
        currentPrice: prices[candles.length - 1],
        targetPrice,
        stopLossPrice,
        prices: candles.slice(dropStart).map(c => c.close),
        volumes: candles.slice(dropStart).map(c => c.volume),
        timestamps: candles.slice(dropStart).map(c => c.timestamp),
        indicators: {
          dropPercentage: (prices[dropStart] - dropLow) / prices[dropStart],
          recoveryPercentage: maxRecovery,
          volumeRatio: avgRecoveryVolume / avgDropVolume
        },
        smartMoneyActivity: marketData.smartMoneyActivity
      }];
      
    } catch (error) {
      this.logger.error('Error detecting V-recovery pattern:', error);
      return [false, null];
    }
  }
  
  /**
   * Detect Bull Flag pattern: Strong upward move followed by slight downward consolidation
   */
  detectBullFlagPattern(marketData, criteria) {
    try {
      const { candles } = marketData;
      
      if (candles.length < 15) return [false, null];
      
      const prices = candles.map(c => c.close);
      const volumes = candles.map(c => c.volume);
      
      let poleStart = -1;
      let poleEnd = -1;
      let flagEnd = candles.length - 1;
      
      // Find the flagpole (initial strong move) - Renaissance precision
      for (let i = candles.length - 20; i < candles.length - 8; i++) {
        if (i < 0) continue;
        
        for (let j = i + 3; j < Math.min(i + 12, candles.length - 5); j++) {
          const movePercentage = (prices[j] - prices[i]) / prices[i];
          
          if (movePercentage >= Number(criteria.minInitialMove)) {
            poleStart = i;
            poleEnd = j;
            break;
          }
        }
        
        if (poleStart !== -1) break;
      }
      
      if (poleStart === -1) return [false, null];
      
      // Analyze the flag (consolidation phase)
      const flagPrices = prices.slice(poleEnd, flagEnd + 1);
      const flagVolumes = volumes.slice(poleEnd, flagEnd + 1);
      const flagDuration = flagEnd - poleEnd;
      
      // Check flag duration
      if (flagDuration < Number(criteria.consolidationTimeMin) || 
          flagDuration > Number(criteria.consolidationTimeMax)) {
        return [false, null];
      }
      
      // Check retracement
      const poleHeight = prices[poleEnd] - prices[poleStart];
      const flagRetracement = prices[poleEnd] - Math.min(...flagPrices);
      const retracementRatio = flagRetracement / poleHeight;
      
      if (retracementRatio > Number(criteria.maxRetracement)) {
        return [false, null];
      }
      
      // Check volume pattern
      const poleVolumes = volumes.slice(poleStart, poleEnd + 1);
      const avgPoleVolume = poleVolumes.reduce((sum, v) => sum + v, 0) / poleVolumes.length;
      const avgFlagVolume = flagVolumes.reduce((sum, v) => sum + v, 0) / flagVolumes.length;
      
      if (avgFlagVolume > avgPoleVolume * Number(criteria.volumeDecreaseThreshold)) {
        return [false, null];
      }
      
      // Calculate confidence
      const moveStrength = (prices[poleEnd] - prices[poleStart]) / prices[poleStart] / Number(criteria.minInitialMove);
      const retracementScore = 1 - (retracementRatio / Number(criteria.maxRetracement));
      const volumeScore = 1 - (avgFlagVolume / (avgPoleVolume * Number(criteria.volumeDecreaseThreshold)));
      
      const confidence = Math.min(95, 40 + moveStrength * 25 + retracementScore * 20 + volumeScore * 10);
      
      const targetPrice = prices[flagEnd] + poleHeight;
      const stopLossPrice = Math.min(...flagPrices) * 0.98;
      
      return [true, {
        confidence,
        startTime: candles[poleStart].timestamp,
        initialPrice: prices[poleStart],
        currentPrice: prices[flagEnd],
        targetPrice,
        stopLossPrice,
        prices: candles.slice(poleStart).map(c => c.close),
        volumes: candles.slice(poleStart).map(c => c.volume),
        timestamps: candles.slice(poleStart).map(c => c.timestamp),
        indicators: {
          poleHeight: poleHeight / prices[poleStart],
          retracementRatio,
          volumeRatio: avgFlagVolume / avgPoleVolume,
          flagDuration
        },
        smartMoneyActivity: marketData.smartMoneyActivity
      }];
      
    } catch (error) {
      this.logger.error('Error detecting bull flag pattern:', error);
      return [false, null];
    }
  }
  
  /**
   * Detect Accumulation pattern: Sideways movement with smart money activity
   */
  detectAccumulationPattern(marketData, criteria) {
    try {
      const { candles } = marketData;
      
      if (candles.length < Number(criteria.minPeriods)) return [false, null];
      
      const prices = candles.map(c => c.close);
      const volumes = candles.map(c => c.volume);
      
      const lookbackPeriods = Math.min(Number(criteria.minPeriods) + 5, candles.length);
      const analyzePrices = prices.slice(-lookbackPeriods);
      
      // Calculate price variation - Renaissance style
      const avgPrice = analyzePrices.reduce((sum, p) => sum + p, 0) / analyzePrices.length;
      const maxPrice = Math.max(...analyzePrices);
      const minPrice = Math.min(...analyzePrices);
      const priceVariation = (maxPrice - minPrice) / avgPrice;
      
      if (priceVariation > Number(criteria.maxPriceVariation)) {
        return [false, null];
      }
      
      // Check volume pattern
      const firstHalfVolumes = volumes.slice(-lookbackPeriods, -Math.floor(lookbackPeriods / 2));
      const secondHalfVolumes = volumes.slice(-Math.floor(lookbackPeriods / 2));
      
      const avgFirstHalfVolume = firstHalfVolumes.reduce((sum, v) => sum + v, 0) / firstHalfVolumes.length;
      const avgSecondHalfVolume = secondHalfVolumes.reduce((sum, v) => sum + v, 0) / secondHalfVolumes.length;
      
      if (avgSecondHalfVolume < avgFirstHalfVolume * Number(criteria.volumeIncreaseEnd)) {
        return [false, null];
      }
      
      // Check smart money activity
      const smartMoney = marketData.smartMoneyActivity;
      if (!smartMoney || smartMoney.walletCount < Number(criteria.smartMoneyThreshold)) {
        return [false, null];
      }
      
      // Renaissance-style confidence calculation
      const priceStabilityScore = 1 - (priceVariation / Number(criteria.maxPriceVariation));
      const volumeScore = (avgSecondHalfVolume / avgFirstHalfVolume) / Number(criteria.volumeIncreaseEnd);
      const smartMoneyScore = Math.min(1, smartMoney.walletCount / (Number(criteria.smartMoneyThreshold) * 2));
      const durationScore = Math.min(1, lookbackPeriods / Number(criteria.minPeriods));
      
      const confidence = Math.min(95, 30 + priceStabilityScore * 25 + volumeScore * 20 + smartMoneyScore * 15 + durationScore * 5);
      
      const rangeHeight = maxPrice - minPrice;
      const targetPrice = maxPrice + rangeHeight;
      const stopLossPrice = minPrice * 0.98;
      
      return [true, {
        confidence,
        startTime: candles[candles.length - lookbackPeriods].timestamp,
        initialPrice: prices[prices.length - lookbackPeriods],
        currentPrice: prices[prices.length - 1],
        targetPrice,
        stopLossPrice,
        prices: candles.slice(-lookbackPeriods).map(c => c.close),
        volumes: candles.slice(-lookbackPeriods).map(c => c.volume),
        timestamps: candles.slice(-lookbackPeriods).map(c => c.timestamp),
        indicators: {
          priceVariation,
          volumeIncrease: avgSecondHalfVolume / avgFirstHalfVolume,
          smartMoneyWallets: smartMoney.walletCount,
          netBuyRatio: smartMoney.buys / (smartMoney.buys + smartMoney.sells)
        },
        smartMoneyActivity: smartMoney
      }];
      
    } catch (error) {
      this.logger.error('Error detecting accumulation pattern:', error);
      return [false, null];
    }
  }
  
  /**
   * Detect Cup and Handle pattern: U-shaped bottom followed by small consolidation
   */
  detectCupAndHandlePattern(marketData, criteria) {
    try {
      const { candles } = marketData;
      
      if (candles.length < Number(criteria.minCupLength) + Number(criteria.minHandleLength)) {
        return [false, null];
      }
      
      const prices = candles.map(c => c.close);
      
      let cupStart = -1;
      let cupBottom = -1;
      let cupEnd = -1;
      let handleEnd = candles.length - 1;
      
      // Find the cup formation - Renaissance precision
      for (let i = candles.length - Number(criteria.maxCupLength) - Number(criteria.maxHandleLength); 
           i < candles.length - Number(criteria.minHandleLength); i++) {
        if (i < 0) continue;
        
        let minPrice = prices[i];
        let minIndex = i;
        let recoveryIndex = -1;
        
        for (let j = i + 1; j < Math.min(i + Number(criteria.maxCupLength), candles.length - Number(criteria.minHandleLength)); j++) {
          if (prices[j] < minPrice) {
            minPrice = prices[j];
            minIndex = j;
          }
          
          if (minIndex > i && prices[j] >= prices[i] * (1 - Number(criteria.minCupDepth) * 0.1)) {
            recoveryIndex = j;
            break;
          }
        }
        
        const cupDepth = (prices[i] - minPrice) / prices[i];
        if (cupDepth >= Number(criteria.minCupDepth) && 
            cupDepth <= Number(criteria.maxCupDepth) && 
            recoveryIndex !== -1) {
          cupStart = i;
          cupBottom = minIndex;
          cupEnd = recoveryIndex;
          break;
        }
      }
      
      if (cupStart === -1) return [false, null];
      
      // Analyze the handle
      const handlePrices = prices.slice(cupEnd, handleEnd + 1);
      const handleLength = handleEnd - cupEnd;
      
      if (handleLength < Number(criteria.minHandleLength) || 
          handleLength > Number(criteria.maxHandleLength)) {
        return [false, null];
      }
      
      // Check handle retracement
      const cupHeight = prices[cupEnd] - prices[cupBottom];
      const handleRetracement = prices[cupEnd] - Math.min(...handlePrices);
      const retracementRatio = handleRetracement / cupHeight;
      
      if (retracementRatio > Number(criteria.maxHandleRetracement)) {
        return [false, null];
      }
      
      // Calculate roundness of cup bottom
      const cupPrices = prices.slice(cupStart, cupEnd + 1);
      const roundnessScore = this.calculateRoundnessScore(cupPrices);
      
      if (roundnessScore < 0.6) {
        return [false, null];
      }
      
      // Calculate confidence
      const depthScore = 1 - Math.abs(cupDepth - 0.3) / 0.2;
      const lengthScore = Math.min(1, (cupEnd - cupStart) / Number(criteria.minCupLength));
      const handleScore = 1 - (retracementRatio / Number(criteria.maxHandleRetracement));
      
      const confidence = Math.min(95, 30 + depthScore * 25 + lengthScore * 15 + handleScore * 15 + roundnessScore * 10);
      
      const targetPrice = prices[cupEnd] + cupHeight;
      const stopLossPrice = Math.min(...handlePrices) * 0.98;
      
      return [true, {
        confidence,
        startTime: candles[cupStart].timestamp,
        initialPrice: prices[cupStart],
        currentPrice: prices[handleEnd],
        targetPrice,
        stopLossPrice,
        prices: candles.slice(cupStart).map(c => c.close),
        volumes: candles.slice(cupStart).map(c => c.volume),
        timestamps: candles.slice(cupStart).map(c => c.timestamp),
        indicators: {
          cupDepth,
          cupLength: cupEnd - cupStart,
          handleLength,
          retracementRatio,
          roundnessScore
        },
        smartMoneyActivity: marketData.smartMoneyActivity
      }];
      
    } catch (error) {
      this.logger.error('Error detecting cup and handle pattern:', error);
      return [false, null];
    }
  }
  
  /**
   * Detect Inverse Head and Shoulders pattern
   */
  detectInverseHeadAndShouldersPattern(marketData, criteria) {
    try {
      const { candles } = marketData;
      
      if (candles.length < 20) return [false, null];
      
      const prices = candles.map(c => c.close);
      const analyzePrices = prices.slice(-Math.min(40, candles.length));
      
      const localMinima = this.findLocalMinima(analyzePrices, 3);
      
      if (localMinima.length < 3) return [false, null];
      
      // Find the best head and shoulders combination - Renaissance precision
      for (let i = 0; i < localMinima.length - 2; i++) {
        const leftShoulder = localMinima[i];
        const head = localMinima[i + 1];
        const rightShoulder = localMinima[i + 2];
        
        const leftShoulderPrice = analyzePrices[leftShoulder.index];
        const headPrice = analyzePrices[head.index];
        const rightShoulderPrice = analyzePrices[rightShoulder.index];
        
        const headDepth = Math.min(
          (leftShoulderPrice - headPrice) / leftShoulderPrice,
          (rightShoulderPrice - headPrice) / rightShoulderPrice
        );
        
        if (headDepth < Number(criteria.minHeadDepth)) continue;
        
        const shoulderAsymmetry = Math.abs(leftShoulderPrice - rightShoulderPrice) / 
          Math.max(leftShoulderPrice, rightShoulderPrice);
        
        if (shoulderAsymmetry > Number(criteria.maxShoulderAsymmetry)) continue;
        
        const necklinePrice = Math.max(leftShoulderPrice, rightShoulderPrice);
        const currentPrice = prices[prices.length - 1];
        const necklineBreakout = (currentPrice - necklinePrice) / necklinePrice;
        
        if (necklineBreakout >= Number(criteria.confirmationBreakout)) {
          const patternDepth = (necklinePrice - headPrice) / necklinePrice;
          
          if (patternDepth >= Number(criteria.minPatternDepth)) {
            const depthScore = Math.min(1, patternDepth / Number(criteria.minPatternDepth));
            const symmetryScore = 1 - (shoulderAsymmetry / Number(criteria.maxShoulderAsymmetry));
            const breakoutScore = Math.min(1, necklineBreakout / Number(criteria.confirmationBreakout));
            
            const confidence = Math.min(95, 40 + depthScore * 25 + symmetryScore * 20 + breakoutScore * 10);
            
            const patternHeight = necklinePrice - headPrice;
            const targetPrice = necklinePrice + patternHeight;
            const stopLossPrice = (leftShoulderPrice + rightShoulderPrice) / 2 * 0.98;
            
            const patternStartIndex = candles.length - analyzePrices.length + leftShoulder.index;
            
            return [true, {
              confidence,
              startTime: candles[patternStartIndex].timestamp,
              initialPrice: prices[patternStartIndex],
              currentPrice,
              targetPrice,
              stopLossPrice,
              prices: candles.slice(patternStartIndex).map(c => c.close),
              volumes: candles.slice(patternStartIndex).map(c => c.volume),
              timestamps: candles.slice(patternStartIndex).map(c => c.timestamp),
              indicators: {
                patternDepth,
                shoulderAsymmetry,
                necklinePrice,
                breakoutPercentage: necklineBreakout,
                leftShoulderPrice,
                headPrice,
                rightShoulderPrice
              },
              smartMoneyActivity: marketData.smartMoneyActivity
            }];
          }
        }
      }
      
      return [false, null];
    } catch (error) {
      this.logger.error('Error detecting inverse head and shoulders pattern:', error);
      return [false, null];
    }
  }
  
  /**
   * Detect Rounded Bottom pattern
   */
  detectRoundedBottomPattern(marketData, criteria) {
    try {
      const { candles } = marketData;
      
      if (candles.length < Number(criteria.minBottomLength)) return [false, null];
      
      const prices = candles.map(c => c.close);
      const volumes = candles.map(c => c.volume);
      
      const analyzeLength = Math.min(Number(criteria.maxBottomLength), candles.length);
      const analyzePrices = prices.slice(-analyzeLength);
      const analyzeVolumes = volumes.slice(-analyzeLength);
      
      const startPrice = analyzePrices[0];
      const minPrice = Math.min(...analyzePrices);
      const currentPrice = analyzePrices[analyzePrices.length - 1];
      
      const bottomDepth = (startPrice - minPrice) / startPrice;
      
      if (bottomDepth < Number(criteria.minBottomDepth)) {
        return [false, null];
      }
      
      const roundnessScore = this.calculateRoundnessScore(analyzePrices);
      
      if (roundnessScore < Number(criteria.minRoundingScore)) {
        return [false, null];
      }
      
      const volumePatternScore = this.checkVolumePattern(analyzeVolumes, criteria.volumePattern);
      
      if (volumePatternScore < 0.6) {
        return [false, null];
      }
      
      const recoveryPercentage = (currentPrice - minPrice) / minPrice;
      
      if (recoveryPercentage < bottomDepth * 0.3) {
        return [false, null];
      }
      
      // Calculate confidence
      const depthScore = Math.min(1, bottomDepth / Number(criteria.minBottomDepth));
      const lengthScore = Math.min(1, analyzeLength / Number(criteria.minBottomLength));
      const recoveryScore = Math.min(1, recoveryPercentage / (bottomDepth * 0.5));
      
      const confidence = Math.min(95, 25 + depthScore * 20 + roundnessScore * 25 + 
        lengthScore * 10 + volumePatternScore * 10 + recoveryScore * 10);
      
      const patternHeight = startPrice - minPrice;
      const targetPrice = currentPrice + patternHeight;
      const stopLossPrice = minPrice * 1.02;
      
      const patternStartIndex = candles.length - analyzeLength;
      
      return [true, {
        confidence,
        startTime: candles[patternStartIndex].timestamp,
        initialPrice: startPrice,
        currentPrice,
        targetPrice,
        stopLossPrice,
        prices: candles.slice(patternStartIndex).map(c => c.close),
        volumes: candles.slice(patternStartIndex).map(c => c.volume),
        timestamps: candles.slice(patternStartIndex).map(c => c.timestamp),
        indicators: {
          bottomDepth,
          roundnessScore,
          volumePatternScore,
          recoveryPercentage,
          patternLength: analyzeLength
        },
        smartMoneyActivity: marketData.smartMoneyActivity
      }];
      
    } catch (error) {
      this.logger.error('Error detecting rounded bottom pattern:', error);
      return [false, null];
    }
  }
  
  // -------------------------------------------------------------------------
  // HELPER METHODS (Mathematical Core)
  // -------------------------------------------------------------------------
  
  /**
   * Calculate roundness score for cup/rounded bottom patterns
   */
  calculateRoundnessScore(prices) {
    if (prices.length < 5) return 0;
    
    try {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const range = maxPrice - minPrice;
      
      if (range === 0) return 0;
      
      const normalizedPrices = prices.map(p => (p - minPrice) / range);
      
      let totalDeviation = 0;
      const midpoint = Math.floor(prices.length / 2);
      
      for (let i = 0; i < prices.length; i++) {
        const x = (i - midpoint) / midpoint;
        const expectedY = x * x;
        const actualY = 1 - normalizedPrices[i];
        
        totalDeviation += Math.abs(expectedY - actualY);
      }
      
      const avgDeviation = totalDeviation / prices.length;
      return Math.max(0, 1 - avgDeviation * 2);
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Find local minima in price data
   */
  findLocalMinima(prices, window = 3) {
    const minima = [];
    
    for (let i = window; i < prices.length - window; i++) {
      let isMinimum = true;
      
      for (let j = i - window; j <= i + window; j++) {
        if (j !== i && prices[j] <= prices[i]) {
          isMinimum = false;
          break;
        }
      }
      
      if (isMinimum) {
        minima.push({ index: i, value: prices[i] });
      }
    }
    
    return minima;
  }
  
  /**
   * Check volume pattern for rounded bottom
   */
  checkVolumePattern(volumes, pattern) {
    if (pattern !== 'decreasing-then-increasing') return 1;
    
    const firstThird = volumes.slice(0, Math.floor(volumes.length / 3));
    const middleThird = volumes.slice(Math.floor(volumes.length / 3), Math.floor(volumes.length * 2 / 3));
    const lastThird = volumes.slice(Math.floor(volumes.length * 2 / 3));
    
    const avgFirst = firstThird.reduce((sum, v) => sum + v, 0) / firstThird.length;
    const avgMiddle = middleThird.reduce((sum, v) => sum + v, 0) / middleThird.length;
    const avgLast = lastThird.reduce((sum, v) => sum + v, 0) / lastThird.length;
    
    const decreaseScore = avgFirst > avgMiddle ? 1 : (avgFirst / avgMiddle);
    const increaseScore = avgLast > avgMiddle ? 1 : (avgLast / avgMiddle);
    
    return (decreaseScore + increaseScore) / 2;
  }
  
  // -------------------------------------------------------------------------
  // PATTERN MANAGEMENT METHODS
  // -------------------------------------------------------------------------
  
  /**
   * Create a new pattern record (in-memory storage)
   */
  async createPattern(token, patternType, patternData, timeframe) {
    try {
      const patternId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newPattern = {
        id: patternId,
        tokenAddress: token.address,
        network: token.network,
        patternType,
        timeframe,
        startTime: patternData.startTime,
        status: PatternStatus.FORMING,
        confidence: patternData.confidence,
        targetPrice: patternData.targetPrice,
        stopLossPrice: patternData.stopLossPrice,
        initialPrice: patternData.initialPrice,
        currentPrice: patternData.currentPrice,
        highestPrice: patternData.currentPrice,
        lowestPrice: patternData.currentPrice,
        priceAction: {
          prices: patternData.prices,
          volumes: patternData.volumes,
          timestamps: patternData.timestamps
        },
        indicators: patternData.indicators,
        smartMoneyActivity: patternData.smartMoneyActivity || {
          buys: 0,
          sells: 0,
          netBuys: 0,
          walletCount: 0
        },
        tags: [token.symbol, timeframe, patternType],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const patternKey = `${token.address}-${token.network}-${patternType}`;
      this.activePatterns.get(timeframe).set(patternKey, newPattern);
      
      this.logger.info(`Created new ${timeframe} ${patternType} pattern for ${token.symbol} (confidence: ${patternData.confidence.toFixed(1)}%)`);
      
      return newPattern;
    } catch (error) {
      this.logger.error(`Error creating pattern for ${token.symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Update active patterns with new market data
   */
  async updateActivePatterns(token, marketData, timeframe) {
    const patterns = Array.from(this.activePatterns.get(timeframe).values())
      .filter(p => p.tokenAddress === token.address && p.network === token.network);
    
    for (const pattern of patterns) {
      try {
        const updated = await this.updatePattern(pattern, marketData);
        
        if (updated.status === PatternStatus.COMPLETED || updated.status === PatternStatus.INVALIDATED) {
          const patternKey = `${token.address}-${token.network}-${pattern.patternType}`;
          this.activePatterns.get(timeframe).delete(patternKey);
          this.logger.info(`Pattern ${pattern.id} ${updated.status} and removed from active tracking`);
        }
      } catch (error) {
        this.logger.error(`Error updating pattern ${pattern.id}:`, error);
      }
    }
  }
  
  /**
   * Update a specific pattern with new market data
   */
  async updatePattern(pattern, marketData) {
    try {
      const latestCandle = marketData.candles[marketData.candles.length - 1];
      
      pattern.currentPrice = latestCandle.close;
      pattern.highestPrice = Math.max(pattern.highestPrice || pattern.initialPrice, latestCandle.high);
      pattern.lowestPrice = Math.min(pattern.lowestPrice || pattern.initialPrice, latestCandle.low);
      pattern.updatedAt = new Date();
      
      // Update price action data
      pattern.priceAction.prices.push(latestCandle.close);
      pattern.priceAction.volumes.push(latestCandle.volume);
      pattern.priceAction.timestamps.push(latestCandle.timestamp);
      
      // Trim old data to prevent memory bloat
      const maxDataPoints = 100;
      if (pattern.priceAction.prices.length > maxDataPoints) {
        pattern.priceAction.prices = pattern.priceAction.prices.slice(-maxDataPoints);
        pattern.priceAction.volumes = pattern.priceAction.volumes.slice(-maxDataPoints);
        pattern.priceAction.timestamps = pattern.priceAction.timestamps.slice(-maxDataPoints);
      }
      
      if (marketData.smartMoneyActivity) {
        pattern.smartMoneyActivity = marketData.smartMoneyActivity;
      }
      
      // TODO: Add pattern-specific validation logic here
      // This would include the validation methods from the TypeScript snippets
      
      return pattern;
    } catch (error) {
      this.logger.error(`Error updating pattern ${pattern.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get tokens to scan - REQUIRES REAL IMPLEMENTATION
   */
  async getTokensToScan(timeframe) {
    // TODO: Replace with real token discovery
    // This should integrate with your LP detection system
    return [
      { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', network: 'solana', symbol: 'USDC' },
      { address: 'So11111111111111111111111111111111111111112', network: 'solana', symbol: 'SOL' },
      { address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', network: 'solana', symbol: 'STB' }
    ];
  }
  
  /**
   * Get active patterns with optional filtering
   */
  getActivePatterns(options = {}) {
    let patterns = [];
    
    if (options.timeframe) {
      patterns = Array.from(this.activePatterns.get(options.timeframe).values());
    } else {
      patterns = [
        ...Array.from(this.activePatterns.get(TimeframeType.FAST).values()),
        ...Array.from(this.activePatterns.get(TimeframeType.SLOW).values())
      ];
    }
    
    if (options.network) {
      patterns = patterns.filter(p => p.network === options.network);
    }
    
    if (options.tokenAddress) {
      patterns = patterns.filter(p => p.tokenAddress === options.tokenAddress);
    }
    
    if (options.patternType) {
      patterns = patterns.filter(p => p.patternType === options.patternType);
    }
    
    if (options.status) {
      patterns = patterns.filter(p => p.status === options.status);
    } else {
      patterns = patterns.filter(p => p.status === PatternStatus.FORMING || p.status === PatternStatus.CONFIRMED);
    }
    
    return patterns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  /**
   * Get pattern by ID
   */
  getPatternById(id) {
    const allPatterns = [
      ...Array.from(this.activePatterns.get(TimeframeType.FAST).values()),
      ...Array.from(this.activePatterns.get(TimeframeType.SLOW).values())
    ];
    
    return allPatterns.find(p => p.id === id);
  }
  
  /**
   * Get patterns for a specific token
   */
  getPatternsByToken(tokenAddress, network) {
    const allPatterns = [
      ...Array.from(this.activePatterns.get(TimeframeType.FAST).values()),
      ...Array.from(this.activePatterns.get(TimeframeType.SLOW).values())
    ];
    
    return allPatterns
      .filter(p => p.tokenAddress === tokenAddress && p.network === network)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  /**
   * Calculate pattern multiplier for mathematical scoring integration
   */
  calculatePatternMultiplier(tokenAddress, network) {
    const patterns = this.getPatternsByToken(tokenAddress, network);
    
    if (patterns.length === 0) {
      return 1.0; // No pattern bonus
    }
    
    let maxMultiplier = 1.0;
    
    for (const pattern of patterns) {
      if (pattern.status === PatternStatus.CONFIRMED) {
        // Confirmed patterns get higher multipliers
        const baseMultiplier = this.getPatternBaseMultiplier(pattern.patternType);
        const confidenceMultiplier = 1 + (pattern.confidence / 100) * 0.5;
        const patternMultiplier = baseMultiplier * confidenceMultiplier;
        
        maxMultiplier = Math.max(maxMultiplier, patternMultiplier);
      } else if (pattern.status === PatternStatus.FORMING) {
        // Forming patterns get smaller multipliers
        const baseMultiplier = this.getPatternBaseMultiplier(pattern.patternType) * 0.7;
        const confidenceMultiplier = 1 + (pattern.confidence / 100) * 0.3;
        const patternMultiplier = baseMultiplier * confidenceMultiplier;
        
        maxMultiplier = Math.max(maxMultiplier, patternMultiplier);
      }
    }
    
    return Math.min(maxMultiplier, 4.0); // Cap at 4x multiplier
  }
  
  /**
   * Get base pattern multiplier for different pattern types
   */
  getPatternBaseMultiplier(patternType) {
    const multipliers = {
      [PatternType.BREAKOUT]: 1.5,
      [PatternType.V_RECOVERY]: 1.8,
      [PatternType.BULL_FLAG]: 1.6,
      [PatternType.ACCUMULATION]: 1.4,
      [PatternType.CUP_AND_HANDLE]: 2.2,
      [PatternType.INVERSE_HEAD_SHOULDERS]: 2.0,
      [PatternType.ROUNDED_BOTTOM]: 1.7,
      [PatternType.SMART_MONEY_ACCUMULATION]: 1.9
    };
    
    return multipliers[patternType] || 1.0;
  }
  
  /**
   * Stop pattern scanners
   */
  stop() {
    if (this.scanIntervalIds[TimeframeType.FAST]) {
      clearInterval(this.scanIntervalIds[TimeframeType.FAST]);
      this.scanIntervalIds[TimeframeType.FAST] = null;
    }
    
    if (this.scanIntervalIds[TimeframeType.SLOW]) {
      clearInterval(this.scanIntervalIds[TimeframeType.SLOW]);
      this.scanIntervalIds[TimeframeType.SLOW] = null;
    }
    
    this.logger.info('Pattern scanners stopped');
  }
}

// Export singleton instance and classes
const PatternRecognitionServiceInstance = new PatternRecognitionService();

export {
  PatternRecognitionServiceInstance as PatternRecognitionService,
  PatternType,
  PatternStatus,
  TimeframeType
};