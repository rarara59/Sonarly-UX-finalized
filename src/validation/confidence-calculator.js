/**
 * Mathematical Confidence Calculator
 * Target: <1ms per calculation, Renaissance-grade scoring
 * 100 lines - Mathematical confidence scoring for trading decisions
 */

export class ConfidenceCalculator {
  constructor(performanceMonitor = null) {
    this.monitor = performanceMonitor;
    
    // Scoring weights (sum to 1.0)
    this.weights = {
      tokenValidity: 0.25,      // Token structure validity
      poolLiquidity: 0.30,      // Pool liquidity depth
      dexReliability: 0.20,     // DEX program reliability
      transactionAge: 0.15,     // How recent the transaction
      structureIntegrity: 0.10  // Overall data structure
    };
    
    // DEX reliability scores
    this.dexScores = {
      raydium: 0.95,    // Most reliable, established
      orca: 0.90,       // Very reliable, concentrated liquidity
      pumpfun: 0.75     // Newer, bonding curve model
    };
    
    // Performance tracking
    this.stats = {
      totalCalculations: 0,
      avgScore: 0,
      avgLatency: 0,
      highConfidenceCount: 0
    };
    
    // ADD: Circuit breaker protection
    this.errorCount = 0;
    this.maxErrors = 10; // Trip circuit after 10 consecutive errors
  }
  
  // Primary confidence calculation method
  calculateConfidence(validationResults) {
    const startTime = performance.now();
    this.stats.totalCalculations++;
    
    // Circuit breaker: fail fast if too many recent errors
    if (this.errorCount > this.maxErrors) {
      console.warn(`🚨 Circuit breaker active: ${this.errorCount} consecutive errors`);
      return {
        confidence: 0.0,
        breakdown: {},
        recommendation: 'SYSTEM_ERROR',
        error: 'Circuit breaker active - too many calculation errors',
        timestamp: Date.now()
      };
    }
    
    try {
      const score = this.computeConfidenceScore(validationResults);
      
      // Update statistics
      this.updateStats(score, startTime);
      
      // Reset error count on successful calculation
      this.errorCount = 0;
      
      return {
        confidence: Math.round(score * 10000) / 10000, // 4 decimal precision
        breakdown: this.getScoreBreakdown(validationResults),
        recommendation: this.getRecommendation(score),
        timestamp: Date.now()
      };
      
    } catch (error) {
      this.errorCount++; // Increment error counter
      console.warn(`Confidence calculation error (${this.errorCount}/${this.maxErrors}):`, error.message);
      
      return {
        confidence: 0.0,
        breakdown: {},
        recommendation: 'REJECT',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  // Core mathematical confidence computation
  computeConfidenceScore(results) {
    let totalScore = 0;
    
    // 1. Token validity score (25%)
    const tokenScore = this.calculateTokenScore(results.token);
    totalScore += tokenScore * this.weights.tokenValidity;
    
    // 2. Pool liquidity score (30%)
    const liquidityScore = this.calculateLiquidityScore(results.pool);
    totalScore += liquidityScore * this.weights.poolLiquidity;
    
    // 3. DEX reliability score (20%)
    const dexScore = this.calculateDexScore(results.dex);
    totalScore += dexScore * this.weights.dexReliability;
    
    // 4. Transaction age score (15%)
    const ageScore = this.calculateAgeScore(results.transaction);
    totalScore += ageScore * this.weights.transactionAge;
    
    // 5. Structure integrity score (10%)
    const structureScore = this.calculateStructureScore(results);
    totalScore += structureScore * this.weights.structureIntegrity;
    
    // Apply penalty factors
    totalScore = this.applyPenalties(totalScore, results);
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, totalScore));
  }
  
  // Calculate token validity score
  calculateTokenScore(tokenResult) {
    if (!tokenResult || typeof tokenResult.confidence !== 'number' || 
        isNaN(tokenResult.confidence) || tokenResult.confidence < 0) {
      return 0;
    }
    
    // Ensure confidence is bounded [0, 1]
    let score = Math.min(1, Math.max(0, tokenResult.confidence));
    
    // Bonus for known tokens
    if (tokenResult.source === 'known') {
      score = Math.min(1.0, score + 0.05);
    }
    
    // Penalty for stale cache
    if (tokenResult.source === 'stale_cache') {
      score *= 0.7;
    }
    
    // Penalty for validation errors
    if (tokenResult.error) {
      score *= 0.3;
    }
    
    return score;
  }
  
  // Calculate pool liquidity score
  calculateLiquidityScore(poolResult) {
    if (!poolResult || !poolResult.valid) {
      return 0;
    }
    
    // Add safety checks for liquidity and confidence
    const liquidity = typeof poolResult.liquidity === 'number' && !isNaN(poolResult.liquidity) 
      ? Math.max(0, poolResult.liquidity) : 0;
    const baseConfidence = typeof poolResult.confidence === 'number' && !isNaN(poolResult.confidence)
      ? Math.min(1, Math.max(0, poolResult.confidence)) : 0;
    
    let score = baseConfidence;
    
    // Liquidity-based scoring (rest unchanged)
    if (liquidity >= 50) {
      score = Math.min(1.0, score + 0.15);
    } else if (liquidity >= 10) {
      score = Math.min(1.0, score + 0.10);
    } else if (liquidity >= 2) {
      score = Math.min(1.0, score + 0.05);
    } else {
      score *= 0.5;
    }
    
    return score;
  }
  
  // Calculate DEX reliability score
  calculateDexScore(dexInfo) {
    if (!dexInfo || !dexInfo.type) {
      return 0.5; // Default moderate score
    }
    
    const baseScore = this.dexScores[dexInfo.type.toLowerCase()] || 0.5;
    
    // Adjust based on DEX-specific factors
    let adjustedScore = baseScore;
    
    // Bonus for established programs
    if (dexInfo.established) {
      adjustedScore = Math.min(1.0, adjustedScore + 0.05);
    }
    
    // Penalty for new/experimental programs
    if (dexInfo.experimental) {
      adjustedScore *= 0.8;
    }
    
    return adjustedScore;
  }
  
  // Calculate transaction age score
  calculateAgeScore(transactionInfo) {
    if (!transactionInfo || !transactionInfo.timestamp) {
      return 0.5; // Default if no timestamp
    }
    
    const now = Date.now();
    const ageMs = now - transactionInfo.timestamp;
    const ageMinutes = ageMs / (1000 * 60);
    
    // Fresher transactions get higher scores
    if (ageMinutes <= 1) {
      return 1.0; // Very fresh
    } else if (ageMinutes <= 5) {
      return 0.9; // Fresh
    } else if (ageMinutes <= 15) {
      return 0.7; // Moderately fresh
    } else if (ageMinutes <= 60) {
      return 0.5; // Older but acceptable
    } else {
      return 0.2; // Very old
    }
  }
  
  // Calculate overall structure integrity score
  calculateStructureScore(results) {
    let integrityScore = 1.0;
    let factorsChecked = 0;
    
    // Check token result integrity
    if (results.token) {
      factorsChecked++;
      if (!results.token.valid || results.token.confidence < 0.5) {
        integrityScore *= 0.8;
      }
    }
    
    // Check pool result integrity
    if (results.pool) {
      factorsChecked++;
      if (!results.pool.valid || results.pool.confidence < 0.5) {
        integrityScore *= 0.8;
      }
    }
    
    // Check DEX information integrity
    if (results.dex) {
      factorsChecked++;
      if (!results.dex.type || !results.dex.programId) {
        integrityScore *= 0.9;
      }
    }
    
    // Penalty for missing critical information
    if (factorsChecked < 2) {
      integrityScore *= 0.5;
    }
    
    return integrityScore;
  }
  
  // Apply penalty factors
  applyPenalties(baseScore, results) {
    let penalizedScore = baseScore;
    
    // Major penalty for any validation failures
    if (results.token && !results.token.valid) {
      penalizedScore *= 0.3;
    }
    
    if (results.pool && !results.pool.valid) {
      penalizedScore *= 0.2;
    }
    
    // Penalty for low overall confidence
    const avgComponentConfidence = this.calculateAverageComponentConfidence(results);
    if (avgComponentConfidence < 0.5) {
      penalizedScore *= 0.6;
    }
    
    return penalizedScore;
  }
  
  // Calculate average confidence across components
  calculateAverageComponentConfidence(results) {
    const confidences = [];
    
    if (results.token && typeof results.token.confidence === 'number') {
      confidences.push(results.token.confidence);
    }
    
    if (results.pool && typeof results.pool.confidence === 'number') {
      confidences.push(results.pool.confidence);
    }
    
    return confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;
  }
  
  // Get detailed score breakdown
  getScoreBreakdown(results) {
    return {
      tokenScore: this.calculateTokenScore(results.token) * this.weights.tokenValidity,
      liquidityScore: this.calculateLiquidityScore(results.pool) * this.weights.poolLiquidity,
      dexScore: this.calculateDexScore(results.dex) * this.weights.dexReliability,
      ageScore: this.calculateAgeScore(results.transaction) * this.weights.transactionAge,
      structureScore: this.calculateStructureScore(results) * this.weights.structureIntegrity,
      weights: { ...this.weights }
    };
  }
  
  // Get trading recommendation based on confidence
  getRecommendation(confidence) {
    if (confidence >= 0.8) {
      return 'STRONG_BUY';
    } else if (confidence >= 0.6) {
      return 'BUY';
    } else if (confidence >= 0.4) {
      return 'WEAK_BUY';
    } else if (confidence >= 0.2) {
      return 'MONITOR';
    } else {
      return 'REJECT';
    }
  }
  
  // Update performance statistics
  updateStats(score, startTime) {
    const latency = performance.now() - startTime;
    
    // Performance alerting - warn if calculations become slow
    if (latency > 2.0) { // 2ms threshold (still well under 1ms target)
      console.warn(`⚠️ Confidence calculation slow: ${latency.toFixed(2)}ms (target: <1ms)`);
    }
    
    // Alert on extremely slow calculations
    if (latency > 5.0) {
      console.error(`🚨 Confidence calculation very slow: ${latency.toFixed(2)}ms - investigate immediately`);
    }
    
    // Update average score
    if (this.stats.avgScore === 0) {
      this.stats.avgScore = score;
    } else {
      this.stats.avgScore = (this.stats.avgScore * 0.95) + (score * 0.05);
    }
    
    // Update average latency
    if (this.stats.avgLatency === 0) {
      this.stats.avgLatency = latency;
    } else {
      this.stats.avgLatency = (this.stats.avgLatency * 0.95) + (latency * 0.05);
    }
    
    // Count high confidence scores
    if (score >= 0.8) {
      this.stats.highConfidenceCount++;
    }
    
    // Record with monitor
    if (this.monitor) {
      this.monitor.recordLatency('confidenceCalculator', latency, true);
    }
  }
  
  // Get current statistics
  getStats() {
    return {
      ...this.stats,
      highConfidenceRate: this.stats.totalCalculations > 0 
        ? this.stats.highConfidenceCount / this.stats.totalCalculations 
        : 0
    };
  }
  
  // Health check
  isHealthy() {
    return this.stats.avgLatency < 1.0; // Under 1ms average
  }
  
  // ADD new method for system health reporting
  getSystemHealth() {
    return {
      isHealthy: this.stats.avgLatency < 1.0 && this.errorCount < 5,
      avgLatency: this.stats.avgLatency,
      errorCount: this.errorCount,
      circuitBreakerActive: this.errorCount > this.maxErrors,
      performanceAlert: this.stats.avgLatency > 2.0,
      recommendations: this.getHealthRecommendations()
    };
  }
  
  // ADD health recommendations
  getHealthRecommendations() {
    const recommendations = [];
    
    if (this.stats.avgLatency > 2.0) {
      recommendations.push('Consider reducing calculation complexity or optimizing hot paths');
    }
    
    if (this.errorCount > 5) {
      recommendations.push('Investigate input data quality - high error rate detected');
    }
    
    if (this.errorCount > this.maxErrors) {
      recommendations.push('System in circuit breaker mode - restart required after fixing errors');
    }
    
    return recommendations;
  }
  
  /**
   * Simple confidence calculation (Renaissance-grade simplicity)
   * Use when you need fast, basic confidence without full scoring
   */
  calculateSimpleConfidence(valid, liquidity) {
    return (valid ? 0.5 : 0) + Math.min(0.5, Math.max(0, liquidity) / 20);
  }
  
  /**
   * Simple health check
   * Use for basic service health monitoring
   */
  isSystemHealthy(errorRate) {
    return errorRate < 0.1;
  }
}