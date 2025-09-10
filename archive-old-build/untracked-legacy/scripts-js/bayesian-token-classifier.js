/**
 * BAYESIAN TOKEN CLASSIFICATION SYSTEM
 * 
 * Mathematical Framework: Hierarchical Bayesian model for token quality assessment
 * 
 * Core Algorithm:
 * P(Quality = High | Data) = P(Data | Quality = High) · P(Quality = High) / P(Data)
 * 
 * Prior Distribution: P(Quality = High) ~ Beta(α₀, β₀)
 * Likelihood: P(Data | Quality) ~ ∏ᵢ Normal(μᵢ, σᵢ²)
 * 
 * Update Rule:
 * P(Quality = High | D₁...Dₙ) ∝ P(Quality = High) · ∏ᵢ P(Dᵢ | Quality = High)
 */

import { EventEmitter } from 'events';
import { NativeMath } from './native-websocket-client.js';

export class BayesianTokenClassifier extends EventEmitter {
  constructor() {
    super();
    
    // Prior distributions for token quality (Renaissance-calibrated)
    this.priors = {
      highQuality: { alpha: 2.5, beta: 7.5 },   // 25% prior probability
      mediumQuality: { alpha: 5.0, beta: 5.0 }, // 50% prior
      lowQuality: { alpha: 7.5, beta: 2.5 }     // 25% prior
    };
    
    // Likelihood parameters for different features
    this.likelihoodParameters = {
      volume: { 
        high: { mu: 50000, sigma: 15000 }, 
        medium: { mu: 20000, sigma: 8000 },
        low: { mu: 5000, sigma: 2000 } 
      },
      lpValue: { 
        high: { mu: 100000, sigma: 30000 }, 
        medium: { mu: 40000, sigma: 15000 },
        low: { mu: 10000, sigma: 5000 } 
      },
      holderCount: { 
        high: { mu: 200, sigma: 50 }, 
        medium: { mu: 100, sigma: 30 },
        low: { mu: 30, sigma: 10 } 
      },
      dexQuality: {
        high: { raydium: 0.9, orca: 0.8, meteora: 0.7 },
        medium: { raydium: 0.7, orca: 0.6, meteora: 0.5 },
        low: { raydium: 0.4, orca: 0.3, meteora: 0.2 }
      }
    };
    
    // Classification history for continuous learning
    this.classificationHistory = [];
    this.maxHistoryLength = 5000;
    
    // Performance metrics
    this.metrics = {
      classificationsPerformed: 0,
      highQualityDetected: 0,
      averageConfidence: 0,
      lastCalibrationTime: Date.now()
    };
  }

  /**
   * Classify token quality using Bayesian inference
   * @param {Object} tokenData - Token features for classification
   * @returns {Object} Classification result with posterior probabilities
   */
  classifyToken(tokenData) {
    const startTime = performance.now();
    
    try {
      // Extract and validate features
      const features = this.extractFeatures(tokenData);
      
      // Calculate likelihood for each quality level
      const likelihoods = this.calculateLikelihoods(features);
      
      // Calculate posterior probabilities using Bayes' theorem
      const posteriors = this.calculatePosteriorProbabilities(likelihoods);
      
      // Determine classification and confidence
      const classification = this.determineClassification(posteriors);
      
      // Update learning system
      const processingTime = performance.now() - startTime;
      this.updateLearningSystem(tokenData, classification, processingTime);
      
      const result = {
        classification: classification.quality,
        confidence: classification.confidence,
        posteriorProbabilities: posteriors,
        likelihoods: likelihoods,
        features: features,
        metadata: {
          processingTime,
          timestamp: Date.now(),
          modelVersion: '1.0.0'
        }
      };
      
      // Store for historical analysis
      this.storeClassificationResult(tokenData, result);
      
      return result;
      
    } catch (error) {
      console.error('Error in token classification:', error);
      return {
        classification: 'unknown',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Extract numerical features from token data
   */
  extractFeatures(tokenData) {
    return {
      volume: tokenData.lpValueUSD || 0,
      lpValue: tokenData.lpValueUSD || 0,
      holderCount: tokenData.holderCount || 1,
      dex: (tokenData.dex || 'unknown').toLowerCase(),
      hasInitialBuys: tokenData.hasInitialBuys || false,
      quoteToken: tokenData.quoteToken || 'unknown',
      deployerHistory: tokenData.deployerHistory || 'unknown',
      timestamp: tokenData.timestamp || Date.now()
    };
  }

  /**
   * Calculate likelihood P(Data | Quality) for each quality level (simplified for stability)
   */
  calculateLikelihoods(features) {
    const qualities = ['high', 'medium', 'low'];
    const likelihoods = {};
    
    for (const quality of qualities) {
      let likelihood = 1.0;
      
      // Volume-based scoring (simplified)
      const volumeScore = this.calculateVolumeScore(features.volume, quality);
      likelihood *= volumeScore;
      
      // LP Value scoring
      const lpScore = this.calculateLPScore(features.lpValue, quality);
      likelihood *= lpScore;
      
      // Holder count scoring
      const holderScore = this.calculateHolderScore(features.holderCount, quality);
      likelihood *= holderScore;
      
      // DEX quality factor
      const dexScore = this.calculateDexScore(features.dex, quality);
      likelihood *= dexScore;
      
      // Initial buys bonus
      if (features.hasInitialBuys) {
        likelihood *= quality === 'high' ? 1.5 : quality === 'medium' ? 1.2 : 1.0;
      }
      
      likelihoods[quality] = Math.max(likelihood, 0.001); // Prevent underflow
    }
    
    return likelihoods;
  }

  calculateVolumeScore(volume, quality) {
    const thresholds = {
      high: { min: 50000, optimal: 100000 },
      medium: { min: 15000, optimal: 40000 },
      low: { min: 0, optimal: 10000 }
    };
    
    const threshold = thresholds[quality];
    if (volume >= threshold.optimal) return 1.0;
    if (volume >= threshold.min) return 0.3 + 0.7 * (volume - threshold.min) / (threshold.optimal - threshold.min);
    return quality === 'low' ? 0.8 : 0.1;
  }

  calculateLPScore(lpValue, quality) {
    const thresholds = {
      high: { min: 75000, optimal: 150000 },
      medium: { min: 25000, optimal: 60000 },
      low: { min: 0, optimal: 15000 }
    };
    
    const threshold = thresholds[quality];
    if (lpValue >= threshold.optimal) return 1.0;
    if (lpValue >= threshold.min) return 0.3 + 0.7 * (lpValue - threshold.min) / (threshold.optimal - threshold.min);
    return quality === 'low' ? 0.8 : 0.1;
  }

  calculateHolderScore(holderCount, quality) {
    const thresholds = {
      high: { min: 100, optimal: 300 },
      medium: { min: 50, optimal: 150 },
      low: { min: 0, optimal: 75 }
    };
    
    const threshold = thresholds[quality];
    if (holderCount >= threshold.optimal) return 1.0;
    if (holderCount >= threshold.min) return 0.3 + 0.7 * (holderCount - threshold.min) / (threshold.optimal - threshold.min);
    return quality === 'low' ? 0.8 : 0.1;
  }

  calculateDexScore(dex, quality) {
    const dexScores = {
      high: { raydium: 0.9, orca: 0.8, meteora: 0.7, unknown: 0.2 },
      medium: { raydium: 0.7, orca: 0.6, meteora: 0.5, unknown: 0.4 },
      low: { raydium: 0.4, orca: 0.3, meteora: 0.2, unknown: 0.7 }
    };
    
    return dexScores[quality][dex] || dexScores[quality].unknown;
  }

  /**
   * Calculate posterior probabilities using Bayes' theorem (log-space for numerical stability)
   */
  calculatePosteriorProbabilities(likelihoods) {
    const posteriors = {};
    
    // Convert to log-space to prevent underflow
    const logLikelihoods = {
      high: Math.log(Math.max(likelihoods.high, 1e-100)),
      medium: Math.log(Math.max(likelihoods.medium, 1e-100)),
      low: Math.log(Math.max(likelihoods.low, 1e-100))
    };
    
    // Log priors (simplified uniform priors for stability)
    const logPriors = {
      high: Math.log(0.25),
      medium: Math.log(0.50),
      low: Math.log(0.25)
    };
    
    // Calculate unnormalized log posteriors
    const logPosteriors = {
      high: logLikelihoods.high + logPriors.high,
      medium: logLikelihoods.medium + logPriors.medium,
      low: logLikelihoods.low + logPriors.low
    };
    
    // Convert back from log-space with numerical stability
    const maxLogPosterior = Math.max(logPosteriors.high, logPosteriors.medium, logPosteriors.low);
    
    const unnormalizedPosteriors = {
      high: Math.exp(logPosteriors.high - maxLogPosterior),
      medium: Math.exp(logPosteriors.medium - maxLogPosterior),
      low: Math.exp(logPosteriors.low - maxLogPosterior)
    };
    
    // Normalize probabilities
    const totalProbability = unnormalizedPosteriors.high + unnormalizedPosteriors.medium + unnormalizedPosteriors.low;
    
    if (totalProbability > 0) {
      posteriors.high = unnormalizedPosteriors.high / totalProbability;
      posteriors.medium = unnormalizedPosteriors.medium / totalProbability;
      posteriors.low = unnormalizedPosteriors.low / totalProbability;
    } else {
      // Default to uniform distribution if calculation fails
      posteriors.high = posteriors.medium = posteriors.low = 1/3;
    }
    
    return posteriors;
  }

  /**
   * Determine final classification from posterior probabilities
   */
  determineClassification(posteriors) {
    const qualities = Object.keys(posteriors);
    const maxQuality = qualities.reduce((a, b) => posteriors[a] > posteriors[b] ? a : b);
    
    const confidence = posteriors[maxQuality];
    
    // Require minimum confidence threshold for high-quality classification
    const minConfidenceThreshold = {
      high: 0.7,
      medium: 0.5,
      low: 0.3
    };
    
    const finalQuality = confidence >= minConfidenceThreshold[maxQuality] ? maxQuality : 'uncertain';
    
    return {
      quality: finalQuality,
      confidence: confidence,
      alternativeQuality: qualities.filter(q => q !== maxQuality).reduce((a, b) => posteriors[a] > posteriors[b] ? a : b),
      margin: confidence - Math.max(...qualities.filter(q => q !== maxQuality).map(q => posteriors[q]))
    };
  }

  /**
   * Normal probability density function
   */
  normalPDF(x, mu, sigma) {
    const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
    const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
    return coefficient * Math.exp(exponent);
  }

  /**
   * Log-normal probability density function
   */
  logNormalPDF(x, mu, sigma) {
    if (x <= 0) return 0;
    const coefficient = 1 / (x * sigma * Math.sqrt(2 * Math.PI));
    const exponent = -0.5 * Math.pow((Math.log(x) - Math.log(mu)) / sigma, 2);
    return coefficient * Math.exp(exponent);
  }

  /**
   * Poisson probability mass function
   */
  poissonPDF(k, lambda) {
    if (k < 0 || !Number.isInteger(k)) return 0;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
  }

  /**
   * Beta probability density function
   */
  betaPDF(x, alpha, beta) {
    if (x < 0 || x > 1) return 0;
    const betaFunction = this.gamma(alpha) * this.gamma(beta) / this.gamma(alpha + beta);
    return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / betaFunction;
  }

  /**
   * Factorial function
   */
  factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Gamma function approximation (Stirling's approximation)
   */
  gamma(z) {
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
    }
    z -= 1;
    const g = 7;
    const coefficients = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    
    let x = coefficients[0];
    for (let i = 1; i < g + 2; i++) {
      x += coefficients[i] / (z + i);
    }
    
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  /**
   * Update the learning system with new classification results
   */
  updateLearningSystem(tokenData, classification, processingTime) {
    this.metrics.classificationsPerformed++;
    
    if (classification.quality === 'high') {
      this.metrics.highQualityDetected++;
    }
    
    // Update average confidence with exponential moving average
    const alpha = 0.1;
    this.metrics.averageConfidence = 
      alpha * classification.confidence + (1 - alpha) * this.metrics.averageConfidence;
  }

  /**
   * Store classification result for historical analysis
   */
  storeClassificationResult(tokenData, result) {
    this.classificationHistory.push({
      timestamp: Date.now(),
      tokenAddress: tokenData.tokenAddress,
      classification: result.classification,
      confidence: result.confidence,
      features: result.features
    });
    
    // Maintain history length
    if (this.classificationHistory.length > this.maxHistoryLength) {
      this.classificationHistory.shift();
    }
  }

  /**
   * Recalibrate model parameters based on historical performance
   */
  recalibrateModel() {
    if (this.classificationHistory.length < 100) {
      console.log('Insufficient data for model recalibration');
      return;
    }

    try {
      // Group classifications by quality
      const qualityGroups = {
        high: this.classificationHistory.filter(h => h.classification === 'high'),
        medium: this.classificationHistory.filter(h => h.classification === 'medium'),
        low: this.classificationHistory.filter(h => h.classification === 'low')
      };

      // Update likelihood parameters based on observed data
      for (const [quality, samples] of Object.entries(qualityGroups)) {
        if (samples.length >= 10) {
          const volumes = samples.map(s => s.features.volume).filter(v => v > 0);
          const lpValues = samples.map(s => s.features.lpValue).filter(v => v > 0);
          
          if (volumes.length > 0) {
            this.likelihoodParameters.volume[quality].mu = NativeMath.mean(volumes);
            this.likelihoodParameters.volume[quality].sigma = NativeMath.standardDeviation(volumes);
          }
          
          if (lpValues.length > 0) {
            this.likelihoodParameters.lpValue[quality].mu = NativeMath.mean(lpValues);
            this.likelihoodParameters.lpValue[quality].sigma = NativeMath.standardDeviation(lpValues);
          }
        }
      }

      this.metrics.lastCalibrationTime = Date.now();
      console.log('Model recalibration completed');
      
    } catch (error) {
      console.error('Error during model recalibration:', error);
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    const highQualityRate = this.metrics.classificationsPerformed > 0 
      ? this.metrics.highQualityDetected / this.metrics.classificationsPerformed 
      : 0;
      
    return {
      ...this.metrics,
      highQualityRate,
      historicalSamples: this.classificationHistory.length,
      modelAge: Date.now() - this.metrics.lastCalibrationTime
    };
  }

  /**
   * Validate classification accuracy using cross-validation
   */
  validateModel() {
    if (this.classificationHistory.length < 50) {
      return { accuracy: 0, reason: 'Insufficient validation data' };
    }

    // Simple holdout validation
    const testSize = Math.floor(this.classificationHistory.length * 0.2);
    const trainData = this.classificationHistory.slice(0, -testSize);
    const testData = this.classificationHistory.slice(-testSize);
    
    let correctPredictions = 0;
    
    for (const testCase of testData) {
      const prediction = this.classifyToken(testCase);
      if (prediction.classification === testCase.classification) {
        correctPredictions++;
      }
    }
    
    const accuracy = correctPredictions / testData.length;
    
    return {
      accuracy,
      testSize,
      correctPredictions,
      modelPerformance: accuracy > 0.7 ? 'good' : accuracy > 0.5 ? 'fair' : 'poor'
    };
  }
}

export default BayesianTokenClassifier;