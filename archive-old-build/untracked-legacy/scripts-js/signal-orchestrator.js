// src/scripts-js/signal-orchestrator.js
const { EventEmitter } = require('events');

/**
 * Circular Buffer for efficient performance tracking
 */
class CircularBuffer {
  constructor(size) {
    this.buffer = new Float64Array(size);
    this.size = size;
    this.index = 0;
    this.count = 0;
  }
  
  push(value) {
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
  }
  
  getAverage() {
    if (this.count === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.count; i++) {
      sum += this.buffer[i];
    }
    return sum / this.count;
  }
  
  getStandardDeviation() {
    if (this.count === 0) return 0;
    const mean = this.getAverage();
    let variance = 0;
    for (let i = 0; i < this.count; i++) {
      variance += Math.pow(this.buffer[i] - mean, 2);
    }
    return Math.sqrt(variance / this.count);
/**
 * Circuit Breaker for signal fault tolerance
 */
class CircuitBreaker {
  constructor(config) {
    this.failureThreshold = config.failureThreshold;
    this.resetTimeMs = config.resetTimeMs;
    this.halfOpenMaxCalls = config.halfOpenMaxCalls;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }
  
  canExecute() {
    if (this.state === 'CLOSED') return true;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
        return true;
      }
      return false;
    }
    
    if (this.state === 'HALF_OPEN') {
      return this.halfOpenCalls < this.halfOpenMaxCalls;
    }
    
    return false;
  }
  
  recordSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }
  
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  incrementHalfOpenCalls() {
    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
    }
  }
}

/**
 * Signal Cache for avoiding redundant calculations
 */
class SignalCache {
  constructor(ttlMs = 30000) {
    this.cache = new Map();
    this.ttl = ttlMs;
  }
  
  generateKey(tokenAddress, signalName, contextHash) {
    return `${tokenAddress}:${signalName}:${contextHash}`;
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
  
  getStats() {
    let validEntries = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp <= this.ttl) {
        validEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      hitRate: validEntries / this.cache.size
    };
  }
}

/**
 * Kalman Filter for dynamic weight optimization
 */
class KalmanFilter {
  constructor(processNoise = 0.01, measurementNoise = 0.1) {
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
    this.estimate = 0.5; // Initial estimate
    this.errorCovariance = 1.0; // Initial uncertainty
  }
  
  predict() {
    // Prediction step
    this.errorCovariance += this.processNoise;
    return this.estimate;
  }
  
  update(measurement) {
    // Update step
    const kalmanGain = this.errorCovariance / (this.errorCovariance + this.measurementNoise);
    this.estimate += kalmanGain * (measurement - this.estimate);
    this.errorCovariance *= (1 - kalmanGain);
    
    return this.estimate;
  }
  
  getEstimate() {
    return this.estimate;
  }
}

/**
 * Factor Exposure Tracker for risk management
 */
class FactorExposureTracker {
  constructor() {
    this.exposures = new Map();
    this.correlationMatrix = new Map();
    this.riskFactors = ['market', 'size', 'momentum', 'volatility'];
  }
  
  updateExposure(signalName, factorExposures) {
    this.exposures.set(signalName, {
      ...factorExposures,
      timestamp: Date.now()
    });
  }
  
  calculatePortfolioExposure(signalWeights) {
    const portfolioExposure = {};
    
    this.riskFactors.forEach(factor => {
      let weightedExposure = 0;
      
      for (const [signalName, weight] of Object.entries(signalWeights)) {
        const exposure = this.exposures.get(signalName);
        if (exposure && exposure[factor] !== undefined) {
          weightedExposure += weight * exposure[factor];
        }
      }
      
      portfolioExposure[factor] = weightedExposure;
    });
    
    return portfolioExposure;
  }
  
  calculateRiskContribution(signalName, signalWeight) {
    const exposure = this.exposures.get(signalName);
    if (!exposure) return 0;
    
    // Simplified risk contribution calculation
    let totalRisk = 0;
    this.riskFactors.forEach(factor => {
      if (exposure[factor] !== undefined) {
        totalRisk += Math.abs(exposure[factor] * signalWeight);
      }
    });
    
    return totalRisk;
  }
}


/**
 * Signal Orchestrator - Renaissance-Style Factor Weighting System
 * Coordinates all signal modules and combines outputs into unified scores
 */
class SignalOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Renaissance-style factor weights (sum to 1.0)
    this.signalWeights = {
      lpAnalysis: 0.25,        // Already implemented - LP quality/liquidity
      smartWallet: 0.30,       // In development - Network analysis
      holderAnalysis: 0.20,    // Next to build - Distribution analysis
      socialSignals: 0.15,     // Week 3 - Sentiment/viral potential
      technicalPatterns: 0.10  // Week 3 - Price pattern analysis
    };
    
    // Dynamic factor weight optimization (Renaissance-critical)
    this.dynamicWeights = { ...this.signalWeights };
    this.informationCoefficients = new Map();
    this.kalmanFilters = new Map();
    this.factorExposure = new Map();
    
    // Signal result caching for performance
    this.signalCache = new Map();
    this.cacheTTL = config.cacheTTL || 30000; // 30 seconds
    
    // Alpha decay configuration
    this.alphaDecayRate = config.alphaDecayRate || 0.001; // λ parameter
    this.maxSignalAge = config.maxSignalAge || 300000; // 5 minutes
    
    // Statistical thresholds
    this.confidenceThreshold = config.confidenceThreshold || 0.60;
    this.significanceThreshold = config.significanceThreshold || 0.05; // p-value
    this.timeoutMs = config.timeoutMs || 5000;
    this.maxConcurrentSignals = config.maxConcurrentSignals || 5;
    
    // Circuit breaker configuration
    this.circuitBreakerConfig = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeMs: config.resetTimeMs || 60000,
      halfOpenMaxCalls: config.halfOpenMaxCalls || 3
    };
    
    // Signal module registry
    this.signalModules = new Map();
    this.signalStatus = new Map();
    this.signalMetrics = new Map();
    this.circuitBreakers = new Map();
    
    // Performance tracking with circular buffers
    this.performanceBuffer = new CircularBuffer(1000);
    this.metrics = {
      totalSignalsProcessed: 0,
      averageProcessingTime: 0,
      successRate: 0,
      lastProcessed: null,
      errorCount: 0,
      cacheHitRate: 0,
      dynamicWeightUpdates: 0
    };
    
    // Statistical significance tracking
    this.significanceHistory = new Map();
    this.performanceHistory = new Map();
    
    // Health monitoring
    this.healthStatus = 'HEALTHY';
    this.lastHealthCheck = new Date();
    
    this.isInitialized = false;
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, ...args) => console.log(`[SignalOrchestrator] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[SignalOrchestrator] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[SignalOrchestrator] ${msg}`, ...args),
      debug: (msg, ...args) => console.debug(`[SignalOrchestrator] ${msg}`, ...args)
    };
  }

  /**
   * Initialize orchestrator with signal modules and advanced optimizations
   */
  async initialize() {
    if (this.isInitialized) return;
    
    this.logger.info('🎯 Initializing Signal Orchestrator with Renaissance optimizations...');
    
    try {
      // Initialize signal modules registry
      await this.initializeSignalModules();
      
      // Setup signal status tracking
      this.initializeSignalTracking();
      
      // Initialize caching system
      this.signalCache = new SignalCache(this.cacheTTL);
      
      // Initialize dynamic weight optimization
      this.initializeDynamicWeights();
      
      // Initialize factor exposure tracking
      this.factorExposureTracker = new FactorExposureTracker();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.isInitialized = true;
      this.logger.info('✅ Signal Orchestrator initialized with advanced optimizations');
      
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Signal Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Initialize dynamic weight optimization with Kalman filters
   */
  initializeDynamicWeights() {
    Object.keys(this.signalWeights).forEach(signalName => {
      this.kalmanFilters.set(signalName, new KalmanFilter());
      this.informationCoefficients.set(signalName, 0);
      this.performanceHistory.set(signalName, new CircularBuffer(50));
    });
    
    this.logger.info('🔄 Dynamic weight optimization initialized');
  }

  /**
   * Start health monitoring system
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform comprehensive health check
   */
  performHealthCheck() {
    let healthySignals = 0;
    let degradedSignals = 0;
    let criticalSignals = 0;
    
    // Check circuit breaker states
    for (const [signalName, breaker] of this.circuitBreakers) {
      if (breaker.state === 'CLOSED') {
        healthySignals++;
      } else if (breaker.state === 'HALF_OPEN') {
        degradedSignals++;
      } else {
        criticalSignals++;
      }
    }
    
    // Check performance metrics
    const avgLatency = this.performanceBuffer.getAverage();
    const latencyStdDev = this.performanceBuffer.getStandardDeviation();
    
    // Determine overall health
    if (criticalSignals > 2 || avgLatency > 2000) {
      this.healthStatus = 'CRITICAL';
    } else if (degradedSignals > 1 || avgLatency > 1000) {
      this.healthStatus = 'DEGRADED';
    } else {
      this.healthStatus = 'HEALTHY';
    }
    
    this.lastHealthCheck = new Date();
    
    // Emit health status change
    this.emit('healthStatus', {
      status: this.healthStatus,
      healthySignals,
      degradedSignals,
      criticalSignals,
      avgLatency,
      latencyStdDev
    });
  }

  /**
   * Get cached signal result or execute if not cached
   */
  async getCachedSignalResult(signalName, module, tokenData, marketContext, abortSignal) {
    // Generate context hash for caching
    const contextHash = this.generateContextHash(tokenData, marketContext);
    const cacheKey = this.signalCache.generateKey(tokenData.tokenAddress, signalName, contextHash);
    
    // Check cache first
    const cachedResult = this.signalCache.get(cacheKey);
    if (cachedResult) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
      return {
        ...cachedResult,
        cached: true,
        processingTime: 0
      };
    }
    
    // Execute signal and cache result
    const result = await this.executeSignalWithAbort(module, tokenData, marketContext, abortSignal);
    
    // Apply alpha decay based on signal age
    const decayedResult = this.applyAlphaDecay(result);
    
    // Cache the result
    this.signalCache.set(cacheKey, decayedResult);
    
    return decayedResult;
  }

  /**
   * Generate context hash for caching
   */
  generateContextHash(tokenData, marketContext) {
    const hashInput = JSON.stringify({
      tokenAge: tokenData.tokenAge || 0,
      marketCap: tokenData.marketCap || 0,
      volume: tokenData.volume || 0,
      solPrice: marketContext.solPrice || 0,
      timestamp: Math.floor(Date.now() / 60000) // Round to minute for cache efficiency
    });
    
    // Simple hash function (use crypto.createHash in production)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Apply alpha decay to signal results
   */
  applyAlphaDecay(signalResult) {
    const now = Date.now();
    const signalAge = now - (signalResult.timestamp || now);
    
    // Skip decay if signal is too old
    if (signalAge > this.maxSignalAge) {
      return {
        ...signalResult,
        score: 0,
        confidence: 0,
        decayReason: 'Signal too old'
      };
    }
    
    // Calculate decay factor: e^(-λt)
    const decayFactor = Math.exp(-this.alphaDecayRate * signalAge / 1000); // Convert to seconds
    
    return {
      ...signalResult,
      score: signalResult.score * decayFactor,
      confidence: signalResult.confidence * decayFactor,
      decayFactor,
      signalAge
    };
  }

  /**
   * Update dynamic signal weights based on performance
   */
  updateDynamicWeights(signalResults) {
    const totalReturn = this.calculatePortfolioReturn(signalResults);
    
    for (const [signalName, result] of signalResults) {
      if (result.success) {
        const kalmanFilter = this.kalmanFilters.get(signalName);
        const performanceHistory = this.performanceHistory.get(signalName);
        
        if (kalmanFilter && performanceHistory) {
          // Calculate information coefficient
          const ic = this.calculateInformationCoefficient(signalName, result.score, totalReturn);
          this.informationCoefficients.set(signalName, ic);
          
          // Update performance history
          performanceHistory.push(result.score);
          
          // Kalman filter update
          kalmanFilter.predict();
          const newWeight = kalmanFilter.update(ic);
          
          // Update dynamic weight (bounded between 0.05 and 0.40)
          this.dynamicWeights[signalName] = Math.max(0.05, Math.min(0.40, newWeight));
          
          // Update factor exposure
          this.updateFactorExposure(signalName, result);
        }
      }
    }
    
    // Normalize weights to sum to 1.0
    this.normalizeDynamicWeights();
    
    this.metrics.dynamicWeightUpdates++;
    this.logger.debug('Dynamic weights updated:', this.dynamicWeights);
  }

  /**
   * Calculate information coefficient for signal
   */
  calculateInformationCoefficient(signalName, signalScore, portfolioReturn) {
    const performanceHistory = this.performanceHistory.get(signalName);
    if (!performanceHistory || performanceHistory.count < 10) {
      return 0;
    }
    
    // Simplified IC calculation - correlation between signal and returns
    const historicalMean = performanceHistory.getAverage();
    const deviation = signalScore - historicalMean;
    const returnDeviation = portfolioReturn - 0.5; // Assuming 0.5 as neutral return
    
    // Pearson correlation coefficient approximation
    const correlation = deviation * returnDeviation;
    
    return Math.max(-1, Math.min(1, correlation));
  }

  /**
   * Calculate portfolio return from signal results
   */
  calculatePortfolioReturn(signalResults) {
    let weightedReturn = 0;
    let totalWeight = 0;
    
    for (const [signalName, result] of signalResults) {
      if (result.success) {
        const weight = this.dynamicWeights[signalName] || 0;
        weightedReturn += result.score * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? weightedReturn / totalWeight : 0;
  }

  /**
   * Update factor exposure for risk management
   */
  updateFactorExposure(signalName, signalResult) {
    // Extract factor exposures from signal result
    const factorExposures = {
      market: signalResult.score, // Market beta
      size: signalResult.metadata?.marketCap ? Math.log(signalResult.metadata.marketCap) : 0,
      momentum: signalResult.momentum || 0,
      volatility: signalResult.volatility || 0
    };
    
    this.factorExposureTracker.updateExposure(signalName, factorExposures);
  }

  /**
   * Normalize dynamic weights to sum to 1.0
   */
  normalizeDynamicWeights() {
    const totalWeight = Object.values(this.dynamicWeights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight > 0) {
      Object.keys(this.dynamicWeights).forEach(signalName => {
        this.dynamicWeights[signalName] = this.dynamicWeights[signalName] / totalWeight;
      });
    }
  }

  /**
   * Initialize and register signal modules
   */
  async initializeSignalModules() {
    // Register LP Analysis (already implemented)
    try {
      const LPAnalysisModule = require('./lp-analysis-module'); // Adjust path as needed
      this.registerSignalModule('lpAnalysis', new LPAnalysisModule());
      this.logger.info('✅ LP Analysis module registered');
    } catch (error) {
      this.logger.warn('LP Analysis module not found, creating placeholder');
      this.registerSignalModule('lpAnalysis', this.createPlaceholderModule('lpAnalysis'));
    }
    
    // Register placeholders for modules in development
    this.registerSignalModule('smartWallet', this.createPlaceholderModule('smartWallet'));
    this.registerSignalModule('holderAnalysis', this.createPlaceholderModule('holderAnalysis'));
    this.registerSignalModule('socialSignals', this.createPlaceholderModule('socialSignals'));
    this.registerSignalModule('technicalPatterns', this.createPlaceholderModule('technicalPatterns'));
    
    this.logger.info(`📊 ${this.signalModules.size} signal modules registered`);
  }

  /**
   * Register a signal module
   */
  registerSignalModule(name, module) {
    if (!this.signalWeights[name]) {
      throw new Error(`Unknown signal module: ${name}`);
    }
    
    this.signalModules.set(name, module);
    this.signalStatus.set(name, {
      active: true,
      lastRun: null,
      lastSuccess: null,
      consecutiveFailures: 0,
      totalRuns: 0,
      averageLatency: 0
    });
    
    this.logger.info(`✅ Signal module '${name}' registered`);
  }

  /**
   * Initialize signal tracking with circuit breakers
   */
  initializeSignalTracking() {
    // Setup performance tracking for each signal
    Object.keys(this.signalWeights).forEach(signalName => {
      this.signalMetrics.set(signalName, {
        totalCalls: 0,
        successfulCalls: 0,
        averageLatency: 0,
        lastLatency: 0,
        errorCount: 0
      });
      
      // Initialize circuit breaker for each signal
      this.circuitBreakers.set(signalName, new CircuitBreaker(this.circuitBreakerConfig));
      
      // Initialize significance tracking
      this.significanceHistory.set(signalName, new CircularBuffer(100));
    });
  }

  /**
   * Main orchestration method - coordinates all signals
   */
  async orchestrateSignals(tokenData, marketContext = {}) {
    if (!this.isInitialized) {
      throw new Error('Signal Orchestrator not initialized');
    }
    
    const startTime = Date.now();
    this.logger.info(`🎯 Orchestrating signals for token: ${tokenData.tokenAddress}`);
    
    try {
      // Execute signals in parallel with timeout
      const signalResults = await this.executeSignalsInParallel(tokenData, marketContext);
      
      // Apply Renaissance-style factor weighting
      const weightedScore = this.applyFactorWeighting(signalResults);
      
      // Calculate statistical confidence
      const confidence = this.calculateStatisticalConfidence(signalResults);
      
      // Generate final orchestrated result
      const orchestratedResult = this.generateOrchestratedResult(
        tokenData,
        signalResults,
        weightedScore,
        confidence
      );
      
      // Update metrics
      this.updateMetrics(startTime, true);
      
      this.logger.info(`✅ Signal orchestration completed in ${Date.now() - startTime}ms`);
      this.emit('orchestrationComplete', orchestratedResult);
      
      return orchestratedResult;
      
    } catch (error) {
      this.updateMetrics(startTime, false);
      this.logger.error('Signal orchestration failed:', error);
      
      // Return degraded result on failure
      return this.generateDegradedResult(tokenData, error);
    }
  }

  /**
   * Execute all active signals in parallel with global timeout and circuit breaker
   */
  async executeSignalsInParallel(tokenData, marketContext) {
    const signalResults = new Map();
    const activeSignals = this.getActiveSignals();
    
    if (activeSignals.length === 0) {
      return signalResults;
    }
    
    // Global timeout controller (Renaissance optimization)
    const controller = new AbortController();
    const globalTimeout = setTimeout(() => {
      controller.abort();
      this.logger.warn('Global signal timeout triggered');
    }, this.timeoutMs);
    
    try {
      // Execute signals with shared abort controller
      const signalPromises = activeSignals.map(([signalName, module]) => {
        return this.executeSignalWithCircuitBreaker(
          signalName, 
          module, 
          tokenData, 
          marketContext, 
          controller.signal
        );
      });
      
      // Use Promise.allSettled but with global timeout
      const results = await Promise.allSettled(signalPromises);
      
      // Process results with optimized indexing
      activeSignals.forEach(([signalName], index) => {
        const result = results[index];
        
        if (result.status === 'fulfilled') {
          signalResults.set(signalName, result.value);
          this.updateSignalMetrics(signalName, true, result.value.processingTime);
        } else {
          this.logger.warn(`Signal ${signalName} failed:`, result.reason);
          signalResults.set(signalName, this.createFailureResult(signalName, result.reason));
          this.updateSignalMetrics(signalName, false, 0);
        }
      });
      
    } finally {
      clearTimeout(globalTimeout);
    }
    
    return signalResults;
  }

  /**
   * Get active signals (optimized for repeated calls)
   */
  getActiveSignals() {
    const activeSignals = [];
    for (const [signalName, module] of this.signalModules) {
      const status = this.signalStatus.get(signalName);
      if (status && status.active && !this.isCircuitBreakerOpen(signalName)) {
        activeSignals.push([signalName, module]);
      }
    }
    return activeSignals;
  }

  /**
   * Execute single signal with circuit breaker and shared abort controller
   */
  async executeSignalWithCircuitBreaker(signalName, module, tokenData, marketContext, abortSignal) {
    const startTime = Date.now();
    const circuitBreaker = this.circuitBreakers.get(signalName);
    
    if (!circuitBreaker.canExecute()) {
      throw new Error(`Circuit breaker OPEN for signal: ${signalName}`);
    }
    
    circuitBreaker.incrementHalfOpenCalls();
    
    try {
      // Execute signal with abort signal
      const result = await this.executeSignalWithAbort(module, tokenData, marketContext, abortSignal);
      
      // Record success
      circuitBreaker.recordSuccess();
      
      return {
        ...result,
        signalName,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };
      
    } catch (error) {
      // Record failure
      circuitBreaker.recordFailure();
      throw error;
    }
  }

  /**
   * Execute signal with abort controller
   */
  async executeSignalWithAbort(module, tokenData, marketContext, abortSignal) {
    return new Promise((resolve, reject) => {
      if (abortSignal.aborted) {
        reject(new Error('Operation aborted'));
        return;
      }
      
      const abortHandler = () => {
        reject(new Error('Operation aborted'));
      };
      
      abortSignal.addEventListener('abort', abortHandler);
      
      // Execute the signal
      module.analyzeToken(tokenData, marketContext)
        .then(result => {
          abortSignal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          abortSignal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  /**
   * Check if circuit breaker is open for a signal
   */
  isCircuitBreakerOpen(signalName) {
    const circuitBreaker = this.circuitBreakers.get(signalName);
    return circuitBreaker && !circuitBreaker.canExecute();
  }

  /**
   * Apply Renaissance-style factor weighting
   */
  applyFactorWeighting(signalResults) {
    let weightedScore = 0;
    let totalWeight = 0;
    let validSignals = 0;
    
    // Calculate weighted average based on confidence and signal strength
    for (const [signalName, result] of signalResults) {
      if (result.success && result.confidence >= this.confidenceThreshold) {
        const weight = this.signalWeights[signalName];
        const adjustedWeight = weight * result.confidence; // Confidence-adjusted weighting
        
        weightedScore += result.score * adjustedWeight;
        totalWeight += adjustedWeight;
        validSignals++;
      }
    }
    
    // Normalize score if we have valid signals
    if (totalWeight > 0) {
      weightedScore = weightedScore / totalWeight;
    }
    
    return {
      score: weightedScore,
      totalWeight,
      validSignals,
      signalContributions: this.calculateSignalContributions(signalResults)
    };
  }

  /**
   * Calculate individual signal contributions
   */
  calculateSignalContributions(signalResults) {
    const contributions = {};
    
    for (const [signalName, result] of signalResults) {
      if (result.success) {
        const weight = this.signalWeights[signalName];
        const adjustedWeight = weight * result.confidence;
        
        contributions[signalName] = {
          rawScore: result.score,
          confidence: result.confidence,
          weight: weight,
          adjustedWeight: adjustedWeight,
          contribution: result.score * adjustedWeight
        };
      }
    }
    
    return contributions;
  }

  /**
   * Calculate statistical confidence using Renaissance-grade methods
   */
  calculateStatisticalConfidence(signalResults) {
    const validResults = Array.from(signalResults.values())
      .filter(r => r.success && r.confidence >= this.confidenceThreshold);
    
    if (validResults.length === 0) {
      return 0;
    }
    
    // Calculate Bayesian confidence with proper uncertainty quantification
    const bayesianConfidence = this.calculateBayesianConfidence(validResults);
    
    // Calculate ensemble confidence bonus
    const ensembleBonus = this.calculateEnsembleBonus(validResults);
    
    // Apply statistical significance penalty
    const significancePenalty = this.calculateSignificancePenalty(validResults);
    
    // Combined confidence score
    const overallConfidence = Math.min(
      bayesianConfidence + ensembleBonus - significancePenalty,
      1.0
    );
    
    return Math.max(overallConfidence, 0);
  }

  /**
   * Calculate Bayesian confidence with proper prior incorporation
   */
  calculateBayesianConfidence(validResults) {
    let totalLogLikelihood = 0;
    let totalWeight = 0;
    
    validResults.forEach(result => {
      const weight = this.signalWeights[result.signalName] || 0;
      const history = this.significanceHistory.get(result.signalName);
      
      // Calculate likelihood based on historical performance
      const priorMean = history ? history.getAverage() : 0.5;
      const priorStd = history ? history.getStandardDeviation() : 0.3;
      
      // Bayesian update
      const likelihood = this.calculateGaussianLikelihood(result.confidence, priorMean, priorStd);
      
      totalLogLikelihood += Math.log(likelihood) * weight;
      totalWeight += weight;
      
      // Update historical significance
      history.push(result.confidence);
    });
    
    // Normalize and convert back from log space
    const normalizedLogLikelihood = totalWeight > 0 ? totalLogLikelihood / totalWeight : 0;
    return Math.min(Math.exp(normalizedLogLikelihood), 1.0);
  }

  /**
   * Calculate Gaussian likelihood for Bayesian update
   */
  calculateGaussianLikelihood(observed, mean, std) {
    const variance = std * std;
    const coefficient = 1 / Math.sqrt(2 * Math.PI * variance);
    const exponent = -Math.pow(observed - mean, 2) / (2 * variance);
    return coefficient * Math.exp(exponent);
  }

  /**
   * Calculate ensemble confidence bonus
   */
  calculateEnsembleBonus(validResults) {
    const totalSignals = Object.keys(this.signalWeights).length;
    const agreementScore = this.calculateSignalAgreement(validResults);
    
    // Bonus increases with number of signals and their agreement
    const diversityBonus = Math.min(validResults.length / totalSignals, 1) * 0.1;
    const agreementBonus = agreementScore * 0.05;
    
    return diversityBonus + agreementBonus;
  }

  /**
   * Calculate signal agreement score
   */
  calculateSignalAgreement(validResults) {
    if (validResults.length < 2) return 0;
    
    const scores = validResults.map(r => r.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    // Agreement is inverse of variance (normalized)
    return Math.max(0, 1 - Math.sqrt(variance) * 2);
  }

  /**
   * Calculate significance penalty based on statistical testing
   */
  calculateSignificancePenalty(validResults) {
    let totalPenalty = 0;
    
    validResults.forEach(result => {
      // Calculate t-statistic for significance testing
      const history = this.significanceHistory.get(result.signalName);
      if (history && history.count > 5) {
        const historicalMean = history.getAverage();
        const historicalStd = history.getStandardDeviation();
        
        if (historicalStd > 0) {
          const tStatistic = Math.abs(result.confidence - historicalMean) / (historicalStd / Math.sqrt(history.count));
          
          // Calculate p-value (approximation for t-distribution)
          const pValue = this.calculateTTestPValue(tStatistic, history.count - 1);
          
          // Apply penalty if not statistically significant
          if (pValue > this.significanceThreshold) {
            totalPenalty += 0.1; // 10% penalty for non-significant results
          }
        }
      }
    });
    
    return Math.min(totalPenalty, 0.5); // Cap penalty at 50%
  }

  /**
   * Calculate t-test p-value (two-tailed)
   */
  calculateTTestPValue(tStatistic, degreesOfFreedom) {
    // Approximation of t-distribution p-value
    // For production, use proper statistical library
    const absTStat = Math.abs(tStatistic);
    
    if (degreesOfFreedom <= 1) return 1.0;
    if (absTStat > 4) return 0.0001; // Very significant
    
    // Simple approximation based on standard normal
    const zApprox = absTStat * Math.sqrt(degreesOfFreedom / (degreesOfFreedom + absTStat * absTStat));
    
    // Rough p-value approximation
    if (zApprox > 2.576) return 0.01;   // p < 0.01
    if (zApprox > 1.96) return 0.05;    // p < 0.05
    if (zApprox > 1.645) return 0.10;   // p < 0.10
    
    return 0.20; // Not significant
  }

  /**
   * Generate final orchestrated result
   */
  generateOrchestratedResult(tokenData, signalResults, weightedScore, confidence) {
    const result = {
      tokenAddress: tokenData.tokenAddress,
      tokenSymbol: tokenData.tokenSymbol || 'UNKNOWN',
      timestamp: new Date(),
      
      // Renaissance scores
      renaissanceScore: weightedScore.score,
      confidence: confidence,
      
      // Statistical metrics
      validSignals: weightedScore.validSignals,
      totalSignals: signalResults.size,
      totalWeight: weightedScore.totalWeight,
      
      // Individual signal results
      signalResults: Object.fromEntries(signalResults),
      signalContributions: weightedScore.signalContributions,
      
      // Trading recommendation
      recommendation: this.generateTradingRecommendation(weightedScore.score, confidence),
      
      // Quality metrics
      qualityScore: this.calculateQualityScore(signalResults),
      riskScore: this.calculateRiskScore(signalResults),
      
      // Metadata
      processingTime: Date.now() - (this.metrics.lastProcessed || Date.now()),
      version: '1.0.0'
    };
    
    return result;
  }

  /**
   * Generate trading recommendation based on score and confidence
   */
  generateTradingRecommendation(score, confidence) {
    if (confidence < this.confidenceThreshold) {
      return {
        action: 'HOLD',
        reason: 'Insufficient confidence',
        strength: 0
      };
    }
    
    if (score >= 0.8) {
      return {
        action: 'STRONG_BUY',
        reason: 'High Renaissance score with strong confidence',
        strength: score * confidence
      };
    } else if (score >= 0.6) {
      return {
        action: 'BUY',
        reason: 'Good Renaissance score with acceptable confidence',
        strength: score * confidence
      };
    } else if (score >= 0.4) {
      return {
        action: 'HOLD',
        reason: 'Moderate Renaissance score',
        strength: score * confidence
      };
    } else {
      return {
        action: 'AVOID',
        reason: 'Low Renaissance score',
        strength: 1 - (score * confidence)
      };
    }
  }

  /**
   * Calculate quality score based on signal consensus
   */
  calculateQualityScore(signalResults) {
    const scores = Array.from(signalResults.values())
      .filter(r => r.success)
      .map(r => r.score);
    
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Quality is inverse of variance (more consensus = higher quality)
    return Math.max(0, 1 - standardDeviation);
  }

  /**
   * Calculate risk score based on signal disagreement
   */
  calculateRiskScore(signalResults) {
    const scores = Array.from(signalResults.values())
      .filter(r => r.success)
      .map(r => r.score);
    
    if (scores.length === 0) return 1; // Maximum risk if no signals
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    // Risk increases with variance
    return Math.min(1, Math.sqrt(variance) * 2);
  }

  /**
   * Generate degraded result on failure
   */
  generateDegradedResult(tokenData, error) {
    return {
      tokenAddress: tokenData.tokenAddress,
      tokenSymbol: tokenData.tokenSymbol || 'UNKNOWN',
      timestamp: new Date(),
      
      renaissanceScore: 0,
      confidence: 0,
      
      validSignals: 0,
      totalSignals: this.signalModules.size,
      
      recommendation: {
        action: 'HOLD',
        reason: 'System error during analysis',
        strength: 0
      },
      
      error: error.message,
      degraded: true
    };
  }

  /**
   * Create placeholder module for signals in development
   */
  createPlaceholderModule(signalName) {
    return {
      analyzeToken: async (tokenData, marketContext) => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        return {
          success: true,
          score: 0.5, // Neutral score
          confidence: 0.3, // Low confidence for placeholder
          signalName,
          placeholder: true,
          metadata: {
            message: `${signalName} module in development`,
            tokenAddress: tokenData.tokenAddress
          }
        };
      }
    };
  }

  /**
   * Create failure result
   */
  createFailureResult(signalName, error) {
    return {
      success: false,
      score: 0,
      confidence: 0,
      signalName,
      error: error.message,
      timestamp: new Date()
    };
  }

  /**
   * Update overall metrics using circular buffer
   */
  updateMetrics(startTime, success) {
    const processingTime = Date.now() - startTime;
    
    // Use circular buffer for efficient average calculation
    this.performanceBuffer.push(processingTime);
    
    this.metrics.totalSignalsProcessed++;
    this.metrics.averageProcessingTime = this.performanceBuffer.getAverage();
    this.metrics.lastProcessed = new Date();
    
    if (!success) {
      this.metrics.errorCount++;
    }
    
    this.metrics.successRate = ((this.metrics.totalSignalsProcessed - this.metrics.errorCount) / 
                              this.metrics.totalSignalsProcessed) * 100;
  }

  /**
   * Update signal metrics with circular buffer optimization
   */
  updateSignalMetrics(signalName, success, latency) {
    const metrics = this.signalMetrics.get(signalName);
    if (metrics) {
      metrics.totalCalls++;
      metrics.lastLatency = latency;
      
      // Use efficient running average for latency
      if (success) {
        metrics.averageLatency = (metrics.averageLatency * metrics.successfulCalls + latency) / (metrics.successfulCalls + 1);
        metrics.successfulCalls++;
      } else {
        metrics.errorCount++;
      }
    }
    
    // Update signal status
    const status = this.signalStatus.get(signalName);
    if (status) {
      status.lastRun = new Date();
      status.totalRuns++;
      
      if (success) {
        status.consecutiveFailures = 0;
        status.lastSuccess = new Date();
      } else {
        status.consecutiveFailures++;
      }
    }
  }

  /**
   * Get comprehensive orchestrator metrics
   */
  getMetrics() {
    const performanceStats = {
      mean: this.performanceBuffer.getAverage(),
      stdDev: this.performanceBuffer.getStandardDeviation(),
      samples: this.performanceBuffer.count
    };
    
    const circuitBreakerStatus = {};
    for (const [signalName, breaker] of this.circuitBreakers) {
      circuitBreakerStatus[signalName] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime,
        canExecute: breaker.canExecute()
      };
    }
    
    return {
      overall: { 
        ...this.metrics,
        performanceStats
      },
      signals: Object.fromEntries(this.signalMetrics),
      status: Object.fromEntries(this.signalStatus),
      circuitBreakers: circuitBreakerStatus,
      significance: this.getSignificanceMetrics()
    };
  }

  /**
   * Get significance metrics for all signals
   */
  getSignificanceMetrics() {
    const significanceMetrics = {};
    
    for (const [signalName, history] of this.significanceHistory) {
      significanceMetrics[signalName] = {
        historicalMean: history.getAverage(),
        historicalStdDev: history.getStandardDeviation(),
        sampleCount: history.count,
        isSignificant: history.count > 5 && history.getStandardDeviation() > 0
      };
    }
    
    return significanceMetrics;
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus() {
    const status = {};
    for (const [signalName, breaker] of this.circuitBreakers) {
      status[signalName] = {
        state: breaker.state,
        healthy: breaker.state === 'CLOSED',
        failureCount: breaker.failureCount,
        canExecute: breaker.canExecute()
      };
    }
    return status;
  }

  /**
   * Reset circuit breaker for a specific signal (emergency recovery)
   */
  resetCircuitBreaker(signalName) {
    const breaker = this.circuitBreakers.get(signalName);
    if (breaker) {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      breaker.lastFailureTime = null;
      breaker.halfOpenCalls = 0;
      
      this.logger.info(`Circuit breaker reset for signal: ${signalName}`);
    }
  }

  /**
   * Update signal weights with Renaissance-grade validation
   */
  updateSignalWeights(newWeights) {
    // Validate weights sum to 1.0
    const totalWeight = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error('Signal weights must sum to 1.0');
    }
    
    // Validate individual weight bounds
    Object.entries(newWeights).forEach(([signalName, weight]) => {
      if (weight < 0.05 || weight > 0.40) {
        throw new Error(`Signal weight for ${signalName} must be between 0.05 and 0.40`);
      }
    });
    
    // Update both static and dynamic weights
    this.signalWeights = { ...this.signalWeights, ...newWeights };
    this.dynamicWeights = { ...this.dynamicWeights, ...newWeights };
    
    this.logger.info('Signal weights updated (Renaissance validation passed):', newWeights);
  }

  /**
   * Force dynamic weight recalibration
   */
  recalibrateDynamicWeights() {
    this.logger.info('🔄 Recalibrating dynamic weights...');
    
    // Reset dynamic weights to static baseline
    this.dynamicWeights = { ...this.signalWeights };
    
    // Reset Kalman filters
    this.kalmanFilters.forEach(filter => {
      filter.estimate = 0.5;
      filter.errorCovariance = 1.0;
    });
    
    // Reset information coefficients
    this.informationCoefficients.forEach((_, signalName) => {
      this.informationCoefficients.set(signalName, 0);
    });
    
    this.logger.info('✅ Dynamic weights recalibrated');
  }

  /**
   * Get optimization performance summary
   */
  getOptimizationSummary() {
    const cacheStats = this.signalCache ? this.signalCache.getStats() : { hitRate: 0 };
    
    return {
      // Performance improvements
      averageLatency: this.performanceBuffer.getAverage(),
      latencyReduction: this.calculateLatencyReduction(),
      cacheEfficiency: cacheStats.hitRate,
      
      // Dynamic optimization
      weightConvergence: this.calculateWeightConvergence(),
      informationRatios: Object.fromEntries(this.informationCoefficients),
      
      // Reliability
      circuitBreakerTrips: this.countCircuitBreakerTrips(),
      systemUptime: this.calculateSystemUptime(),
      
      // Risk management
      factorDiversification: this.calculateFactorDiversification(),
      riskAdjustedPerformance: this.calculateRiskAdjustedPerformance(),
      
      summary: {
        status: this.healthStatus,
        optimizationLevel: this.getOptimizationLevel(),
        recommendedActions: this.getRecommendedActions()
      }
    };
  }

  /**
   * Calculate latency reduction from optimizations
   */
  calculateLatencyReduction() {
    const baselineLatency = 5000; // Assumed baseline without optimizations
    const currentLatency = this.performanceBuffer.getAverage();
    return Math.max(0, (baselineLatency - currentLatency) / baselineLatency * 100);
  }

  /**
   * Calculate weight convergence (how stable are the dynamic weights)
   */
  calculateWeightConvergence() {
    let totalVariance = 0;
    let validFilters = 0;
    
    this.kalmanFilters.forEach(filter => {
      totalVariance += filter.errorCovariance;
      validFilters++;
    });
    
    const avgVariance = validFilters > 0 ? totalVariance / validFilters : 1.0;
    return Math.max(0, 1 - avgVariance); // Higher = more converged
  }

  /**
   * Count circuit breaker trips for reliability monitoring
   */
  countCircuitBreakerTrips() {
    let totalTrips = 0;
    this.circuitBreakers.forEach(breaker => {
      totalTrips += breaker.failureCount;
    });
    return totalTrips;
  }

  /**
   * Calculate system uptime percentage
   */
  calculateSystemUptime() {
    const totalSignals = Object.keys(this.signalWeights).length;
    let activeSignals = 0;
    
    this.circuitBreakers.forEach(breaker => {
      if (breaker.state === 'CLOSED') {
        activeSignals++;
      }
    });
    
    return totalSignals > 0 ? (activeSignals / totalSignals * 100) : 0;
  }

  /**
   * Calculate factor diversification
   */
  calculateFactorDiversification() {
    if (!this.factorExposureTracker) return 0;
    
    const portfolioExposure = this.factorExposureTracker.calculatePortfolioExposure(this.dynamicWeights);
    const exposureValues = Object.values(portfolioExposure);
    
    if (exposureValues.length === 0) return 0;
    
    // Calculate diversification as inverse of concentration
    const sumSquares = exposureValues.reduce((sum, exp) => sum + exp * exp, 0);
    const maxConcentration = Math.max(...exposureValues.map(Math.abs));
    
    return Math.max(0, 1 - maxConcentration);
  }

  /**
   * Calculate risk-adjusted performance
   */
  calculateRiskAdjustedPerformance() {
    const avgReturn = this.performanceBuffer.getAverage() / 5000; // Normalize to 0-1
    const volatility = this.performanceBuffer.getStandardDeviation() / 5000;
    
    return volatility > 0 ? avgReturn / volatility : 0; // Sharpe-like ratio
  }

  /**
   * Get optimization level assessment
   */
  getOptimizationLevel() {
    const cacheHitRate = this.signalCache ? this.signalCache.getStats().hitRate : 0;
    const convergence = this.calculateWeightConvergence();
    const uptime = this.calculateSystemUptime();
    
    const score = (cacheHitRate * 0.3 + convergence * 0.4 + uptime / 100 * 0.3);
    
    if (score > 0.8) return 'EXCELLENT';
    if (score > 0.6) return 'GOOD';
    if (score > 0.4) return 'FAIR';
    return 'POOR';
  }

  /**
   * Get recommended optimization actions
   */
  getRecommendedActions() {
    const actions = [];
    
    // Check cache performance
    const cacheStats = this.signalCache ? this.signalCache.getStats() : { hitRate: 0 };
    if (cacheStats.hitRate < 0.3) {
      actions.push('Increase cache TTL or optimize context hashing');
    }
    
    // Check circuit breaker health
    const criticalBreakers = Array.from(this.circuitBreakers.values())
      .filter(breaker => breaker.state === 'OPEN').length;
    if (criticalBreakers > 1) {
      actions.push('Investigate failing signal modules');
    }
    
    /**
     * Get recommended optimization actions
     */
    getRecommendedActions() {
      const actions = [];
      
      // Check cache performance
      const cacheStats = this.signalCache ? this.signalCache.getStats() : { hitRate: 0 };
      if (cacheStats.hitRate < 0.3) {
        actions.push('Increase cache TTL or optimize context hashing');
      }
      
      // Check circuit breaker health
      const criticalBreakers = Array.from(this.circuitBreakers.values())
        .filter(breaker => breaker.state === 'OPEN').length;
      if (criticalBreakers > 1) {
        actions.push('Investigate failing signal modules');
      }
      
      // Check weight convergence
      if (this.calculateWeightConvergence() < 0.5) {
        actions.push('Allow more time for dynamic weight convergence');
      }
      
      // Check latency
      if (this.performanceBuffer.getAverage() > 1000) {
        actions.push('Optimize signal processing or reduce timeout');
      }
      
      return actions.length > 0 ? actions : ['System operating optimally'];
    }

    /**
     * Enable/disable specific signals
     */
      actions.push('Allow more time for dynamic weight convergence');
    }
    
    // Check latency
    if (this.performanceBuffer.getAverage() > 1000) {
      actions.push('Optimize signal processing or reduce timeout');
    }
    
    return actions.length > 0 ? actions : ['System operating optimally'];
  }

  /**
   * Enable/disable specific signals
   */
  setSignalStatus(signalName, active) {
    const status = this.signalStatus.get(signalName);
    if (status) {
      status.active = active;
      this.logger.info(`Signal ${signalName} ${active ? 'enabled' : 'disabled'}`);
    }
  }
}
}
module.exports = SignalOrchestrator;