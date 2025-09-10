/**
 * THORP REAL-TIME TRADING SYSTEM
 * 
 * Renaissance-grade integration of:
 * 1. Real-time LP detection via Helius Enhanced WebSocket
 * 2. Statistical event processing with significance testing
 * 3. Bayesian token classification
 * 4. Production-ready signal generation
 */

import { EventEmitter } from 'events';
import HeliusWebSocketClient from './helius-websocket-client.js';
import BayesianTokenClassifier from './bayesian-token-classifier.js';

export class ThorpRealtimeSystem extends EventEmitter {
  constructor(heliusApiKey, options = {}) {
    super();
    
    this.options = {
      minSignificanceThreshold: 0.05,  // p-value threshold
      minClassificationConfidence: 0.6, // Bayesian confidence
      enableBackup: options.enableBackup || true,
      logLevel: options.logLevel || 'info',
      ...options
    };
    
    // Core system components
    this.heliusClient = new HeliusWebSocketClient(heliusApiKey, {
      reconnectInterval: 3000,
      maxReconnects: 50
    });
    
    this.tokenClassifier = new BayesianTokenClassifier();
    
    // Signal tracking
    this.signals = {
      total: 0,
      significant: 0,
      highQuality: 0,
      actionable: 0
    };
    
    // Performance monitoring
    this.performance = {
      startTime: Date.now(),
      lastSignalTime: null,
      averageProcessingTime: 0,
      systemHealth: 'starting'
    };
    
    // Setup system integration
    this.initializeSystemIntegration();
  }

  /**
   * Initialize the integrated Renaissance system
   */
  async initialize() {
    console.log('🚀 Initializing Thorp Real-Time Trading System...');
    
    try {
      // Setup event handlers
      this.setupEventHandlers();
      
      // Connect to Helius Enhanced WebSocket
      await this.heliusClient.connect();
      
      // Calibrate Bayesian classifier
      this.tokenClassifier.recalibrateModel();
      
      this.performance.systemHealth = 'operational';
      console.log('✅ Thorp system fully operational');
      
      this.emit('systemReady');
      
    } catch (error) {
      console.error('❌ Failed to initialize Thorp system:', error);
      this.performance.systemHealth = 'error';
      this.emit('systemError', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for system integration
   */
  setupEventHandlers() {
    // Handle significant LP events from statistical processor
    this.heliusClient.on('significantLPEvent', async (data) => {
      await this.processSignificantEvent(data);
    });
    
    // Handle all LP events for learning
    this.heliusClient.on('lpEvent', async (data) => {
      await this.processLearningEvent(data);
    });
    
    // Handle connection events
    this.heliusClient.on('connected', () => {
      console.log('🔗 Helius connection established');
      this.emit('connectionEstablished');
    });
    
    this.heliusClient.on('disconnected', () => {
      console.log('📡 Helius connection lost - attempting reconnection');
      this.emit('connectionLost');
    });
    
    this.heliusClient.on('error', (error) => {
      console.error('🚨 Helius connection error:', error);
      this.emit('connectionError', error);
    });
  }

  /**
   * Process statistically significant LP events
   */
  async processSignificantEvent(data) {
    const startTime = performance.now();
    
    try {
      const { event, analysis } = data;
      
      console.log(`🎯 Processing significant LP event: ${event.tokenAddress}`);
      console.log(`📊 Statistical significance: ${analysis.significance.toFixed(3)}, p-value: ${analysis.pValue.toFixed(4)}`);
      
      // Only proceed if meets significance threshold
      if (analysis.pValue >= this.options.minSignificanceThreshold) {
        console.log(`⚠️ Event below significance threshold (p=${analysis.pValue.toFixed(4)})`);
        return;
      }
      
      // Enhance event data with additional features for classification
      const enhancedTokenData = await this.enhanceTokenData(event);
      
      // Perform Bayesian classification
      const classification = this.tokenClassifier.classifyToken(enhancedTokenData);
      
      console.log(`🧠 Bayesian classification: ${classification.classification} (confidence: ${classification.confidence.toFixed(3)})`);
      
      // Generate trading signal if confidence threshold met
      if (classification.confidence >= this.options.minClassificationConfidence) {
        const signal = this.generateTradingSignal(event, analysis, classification);
        await this.processTradingSignal(signal);
      } else {
        console.log(`📊 Classification confidence below threshold (${classification.confidence.toFixed(3)} < ${this.options.minClassificationConfidence})`);
      }
      
      // Update performance metrics
      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime);
      
      this.signals.significant++;
      
    } catch (error) {
      console.error('📛 Error processing significant event:', error);
      this.emit('processingError', { event: data.event, error });
    }
  }

  /**
   * Process learning events (all LP events for system improvement)
   */
  async processLearningEvent(data) {
    try {
      const { event } = data;
      
      // Lightweight processing for learning
      const tokenData = {
        tokenAddress: event.tokenAddress,
        lpValueUSD: event.lpValueUSD,
        dex: event.dex,
        hasInitialBuys: event.hasInitialBuys,
        timestamp: event.timestamp
      };
      
      // Feed to classifier for learning (lightweight)
      this.tokenClassifier.classifyToken(tokenData);
      
      this.signals.total++;
      
    } catch (error) {
      // Silent failure for learning events
      console.debug('Learning event processing error:', error.message);
    }
  }

  /**
   * Enhance token data with additional features
   */
  async enhanceTokenData(baseEvent) {
    // In production, this would fetch additional data from APIs
    // For now, simulate enhanced data
    const enhanced = {
      ...baseEvent,
      holderCount: this.simulateHolderCount(baseEvent.lpValueUSD),
      deployerHistory: 'unknown',
      socialMentions: 0,
      technicalPattern: 'unknown'
    };
    
    return enhanced;
  }

  /**
   * Simulate holder count based on LP value (placeholder for real API calls)
   */
  simulateHolderCount(lpValueUSD) {
    // Rough correlation: higher LP value = more initial holders
    const baseHolders = Math.floor(lpValueUSD / 1000);
    const randomFactor = 0.5 + Math.random();
    return Math.floor(baseHolders * randomFactor);
  }

  /**
   * Generate trading signal from processed data
   */
  generateTradingSignal(event, statisticalAnalysis, classification) {
    const signal = {
      tokenAddress: event.tokenAddress,
      signalType: 'LP_CREATION',
      
      // Statistical components
      significance: statisticalAnalysis.significance,
      pValue: statisticalAnalysis.pValue,
      statisticalConfidence: statisticalAnalysis.confidence,
      
      // Bayesian components
      classification: classification.classification,
      bayesianConfidence: classification.confidence,
      posteriorProbabilities: classification.posteriorProbabilities,
      
      // Market data
      lpValueUSD: event.lpValueUSD,
      dex: event.dex,
      quoteToken: event.quoteToken,
      hasInitialBuys: event.hasInitialBuys,
      
      // Signal metadata
      timestamp: Date.now(),
      processingLatency: statisticalAnalysis.metadata?.latency || 0,
      
      // Combined score (Renaissance-style)
      combinedScore: this.calculateCombinedScore(statisticalAnalysis, classification),
      
      // Trading recommendation
      recommendation: this.generateRecommendation(statisticalAnalysis, classification)
    };
    
    return signal;
  }

  /**
   * Calculate combined Renaissance-style score
   */
  calculateCombinedScore(statistical, classification) {
    // Weighted combination of statistical significance and Bayesian confidence
    const statisticalWeight = 0.4;
    const bayesianWeight = 0.6;
    
    const statisticalScore = 1 - statistical.pValue; // Lower p-value = higher score
    const bayesianScore = classification.confidence;
    
    const combined = statisticalWeight * statisticalScore + bayesianWeight * bayesianScore;
    
    return Math.max(0, Math.min(1, combined));
  }

  /**
   * Generate trading recommendation
   */
  generateRecommendation(statistical, classification) {
    const combinedScore = this.calculateCombinedScore(statistical, classification);
    
    if (combinedScore >= 0.8 && classification.classification === 'high') {
      return {
        action: 'STRONG_BUY',
        confidence: 'HIGH',
        positionSize: 'LARGE',
        timeframe: 'IMMEDIATE'
      };
    } else if (combinedScore >= 0.6 && classification.classification === 'medium') {
      return {
        action: 'BUY',
        confidence: 'MEDIUM',
        positionSize: 'MEDIUM',
        timeframe: 'SHORT'
      };
    } else if (combinedScore >= 0.4) {
      return {
        action: 'WATCH',
        confidence: 'LOW',
        positionSize: 'SMALL',
        timeframe: 'MONITOR'
      };
    } else {
      return {
        action: 'PASS',
        confidence: 'VERY_LOW',
        positionSize: 'NONE',
        timeframe: 'IGNORE'
      };
    }
  }

  /**
   * Process trading signal (emit to downstream systems)
   */
  async processTradingSignal(signal) {
    console.log(`📈 TRADING SIGNAL GENERATED:`);
    console.log(`   Token: ${signal.tokenAddress}`);
    console.log(`   Action: ${signal.recommendation.action}`);
    console.log(`   Combined Score: ${signal.combinedScore.toFixed(3)}`);
    console.log(`   LP Value: $${signal.lpValueUSD.toLocaleString()}`);
    console.log(`   DEX: ${signal.dex}`);
    
    // Update actionable signals counter
    if (signal.recommendation.action !== 'PASS') {
      this.signals.actionable++;
    }
    
    if (signal.classification === 'high') {
      this.signals.highQuality++;
    }
    
    // Emit signal to downstream systems
    this.emit('tradingSignal', signal);
    
    // Store signal for analysis
    this.performance.lastSignalTime = Date.now();
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(processingTime) {
    // Exponential moving average for processing time
    const alpha = 0.1;
    this.performance.averageProcessingTime = 
      alpha * processingTime + (1 - alpha) * this.performance.averageProcessingTime;
  }

  /**
   * Get current system performance
   */
  getSystemPerformance() {
    const uptime = Date.now() - this.performance.startTime;
    const signalRate = this.signals.total > 0 ? this.signals.significant / this.signals.total : 0;
    const actionableRate = this.signals.significant > 0 ? this.signals.actionable / this.signals.significant : 0;
    
    return {
      uptime: uptime,
      systemHealth: this.performance.systemHealth,
      
      // Signal metrics
      totalSignals: this.signals.total,
      significantSignals: this.signals.significant,
      actionableSignals: this.signals.actionable,
      highQualitySignals: this.signals.highQuality,
      
      // Performance rates
      signalRate: signalRate,
      actionableRate: actionableRate,
      averageProcessingTime: this.performance.averageProcessingTime,
      
      // Component performance
      heliusMetrics: this.heliusClient.getMetrics(),
      classifierMetrics: this.tokenClassifier.getPerformanceMetrics(),
      
      // System status
      lastSignalTime: this.performance.lastSignalTime,
      timeSinceLastSignal: this.performance.lastSignalTime ? Date.now() - this.performance.lastSignalTime : null
    };
  }

  /**
   * Initialize system integration
   */
  initializeSystemIntegration() {
    // Setup periodic model recalibration
    setInterval(() => {
      try {
        this.tokenClassifier.recalibrateModel();
        console.log('🧠 Bayesian model recalibrated');
      } catch (error) {
        console.error('📛 Model recalibration error:', error);
      }
    }, 300000); // Every 5 minutes
    
    // Setup performance reporting
    setInterval(() => {
      const performance = this.getSystemPerformance();
      console.log(`📊 System Performance: ${performance.significantSignals} significant signals, ${performance.actionableSignals} actionable`);
    }, 60000); // Every minute
  }

  /**
   * Shutdown system gracefully
   */
  async shutdown() {
    console.log('🔌 Shutting down Thorp system...');
    
    try {
      await this.heliusClient.disconnect();
      this.performance.systemHealth = 'shutdown';
      console.log('✅ Thorp system shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  /**
   * Manual signal injection for testing
   */
  injectTestSignal(tokenData = {}) {
    const testEvent = {
      tokenAddress: tokenData.tokenAddress || 'TEST_' + Date.now(),
      lpValueUSD: tokenData.lpValueUSD || 50000,
      dex: tokenData.dex || 'Raydium',
      hasInitialBuys: tokenData.hasInitialBuys || true,
      timestamp: Date.now(),
      ...tokenData
    };
    
    const testAnalysis = {
      significance: 0.8,
      pValue: 0.02,
      confidence: 0.85,
      metadata: { latency: 2.5 }
    };
    
    console.log('🧪 Injecting test signal for validation');
    this.processSignificantEvent({ event: testEvent, analysis: testAnalysis });
  }
}

export default ThorpRealtimeSystem;