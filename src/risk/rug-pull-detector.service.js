/**
 * Rug Pull Detector Service - Renaissance Trading System
 * Production-ready risk analysis for meme coin trading
 * Target: <500ms analysis with 80%+ accuracy
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

export class RugPullDetector extends EventEmitter {
  constructor(rpcPool, circuitBreaker, options = {}) {
    super();
    
    if (!rpcPool) throw new Error('RpcConnectionPool is required');
    if (!circuitBreaker) throw new Error('CircuitBreaker is required');
    
    this.rpcPool = rpcPool;
    this.circuitBreaker = circuitBreaker;
    
    // Production configuration
    this.config = {
      maxLiquidityOwnership: options.maxLiquidityOwnership || 0.7,
      maxHolderConcentration: options.maxHolderConcentration || 0.8,
      minLiquidityLock: options.minLiquidityLock || 3600000, // 1 hour
      enableCaching: options.enableCaching !== false,
      cacheExpiry: options.cacheExpiry || 300000, // 5 minutes
      maxCacheSize: options.maxCacheSize || 1000
    };
    
    // Real Solana lock programs
    this.LOCK_PROGRAMS = {
      'TeamTokenLockKqzUvzsVhfDHYkFxaWzuwdxNhkqE6HFbF9LF8ixG': 'Team Finance',
      'LocktDzaV1W2Bm9DeZeiyz4J9zs4fRqNiYqQyracRXw': 'Solana Token Lock',
      'DECK4EuJVs2eKyC8rEP6NurqmJ9Th2M1uF5LQYWE9K4n': 'DexLab Lock'
    };
    
    // Real token programs
    this.TOKEN_PROGRAMS = new Set([
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token
      '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',  // Pump.fun
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'  // Orca Whirlpool
    ]);
    
    // LRU Cache implementation
    this.analysisCache = new Map();
    this.deployerCache = new Map();
    
    // Performance metrics
    this.metrics = {
      totalAnalyses: 0,
      successRate: 0,
      avgLatency: 0,
      componentLatencies: {
        ownership: 0,
        concentration: 0,
        locks: 0,
        deployer: 0
      }
    };
    
    console.log('🚨 Renaissance Rug Pull Detector initialized');
  }

  /**
   * Main analysis method - checks all rug pull risk factors
   */
  async analyzeRugPullRisk(candidate) {
    const startTime = performance.now();
    this.metrics.totalAnalyses++;
    
    try {
      if (!candidate) throw new Error('Candidate required');
      
      // Check cache first
      const cacheKey = this.generateCacheKey(candidate);
      if (this.config.enableCaching) {
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          const processingTime = performance.now() - startTime;
          console.log(`🚨 Rug pull risk (cached): ${(cached.overallRisk * 100).toFixed(1)}% (${processingTime.toFixed(1)}ms)`);
          return { ...cached, fromCache: true, processingTime };
        }
      }
      
      console.log(`🔍 Analyzing rug pull risk for ${candidate.dex} token: ${candidate.tokenMint || 'unknown'}`);
      
      // Run analyses in parallel for performance
      const [ownershipResult, concentrationResult, lockResult, deployerResult] = await Promise.allSettled([
        this.analyzeLiquidityOwnership(candidate),
        this.analyzeHolderConcentration(candidate),  
        this.analyzeLiquidityLock(candidate),
        this.analyzeDeployerHistory(candidate)
      ]);
      
      // Extract results with error handling
      const ownershipRisk = ownershipResult.status === 'fulfilled' ? ownershipResult.value : 0.7;
      const concentrationRisk = concentrationResult.status === 'fulfilled' ? concentrationResult.value : 0.6;
      const lockRisk = lockResult.status === 'fulfilled' ? lockResult.value : 0.8;
      const deployerRisk = deployerResult.status === 'fulfilled' ? deployerResult.value : 0.6;
      
      // Weighted calculation optimized for meme coins
      const overallRisk = (
        ownershipRisk * 0.35 +      // Highest weight - direct rug vector
        lockRisk * 0.30 +           // High weight - shows commitment  
        concentrationRisk * 0.25 +  // Medium weight - manipulation indicator
        deployerRisk * 0.10         // Lowest weight - can be gamed
      );
      
      const clampedRisk = Math.min(1, Math.max(0, overallRisk));
      const processingTime = performance.now() - startTime;
      
      const result = {
        overallRisk: clampedRisk,
        riskLevel: this.getRiskLevel(clampedRisk),
        components: {
          liquidityOwnership: ownershipRisk,
          holderConcentration: concentrationRisk,
          liquidityLock: lockRisk,
          deployerHistory: deployerRisk
        },
        performance: {
          processingTimeMs: processingTime,
          componentTimes: this.metrics.componentLatencies,
          isOptimal: processingTime < 500
        },
        recommendation: this.generateRecommendation(clampedRisk),
        timestamp: Date.now()
      };
      
      // Cache successful results
      if (this.config.enableCaching) {
        this.cacheResult(cacheKey, result);
      }
      
      // Update metrics
      this.updateMetrics(processingTime, true);
      
      if (processingTime > 500) {
        console.warn(`⚠️ RUG PULL ANALYSIS SLOW: ${processingTime.toFixed(1)}ms (target: <500ms)`);
      }
      
      console.log(`🚨 Rug pull risk: ${(clampedRisk * 100).toFixed(1)}% (${this.getRiskLevel(clampedRisk)}) in ${processingTime.toFixed(1)}ms`);
      
      return result;
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateMetrics(processingTime, false);
      
      console.error('❌ Rug pull analysis failed:', error.message);
      
      return {
        overallRisk: 0.8,
        riskLevel: 'HIGH', 
        error: error.message,
        recommendation: 'AVOID - Analysis failed',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Analyze liquidity pool ownership concentration
   */
  async analyzeLiquidityOwnership(candidate) {
    const startTime = performance.now();
    
    try {
      const lpMint = candidate.lpMint || candidate.poolAddress;
      if (!lpMint) return 0.7;
      
      console.log(`🔍 Analyzing LP ownership for: ${lpMint}`);
      
      // Circuit breaker protection
      const lpAccounts = await this.circuitBreaker.execute('tokenLargestAccounts', async () => {
        return await this.rpcPool.call('getTokenLargestAccounts', [lpMint], { 
          priority: 'high',
          timeout: 3000 
        });
      });
      
      if (!lpAccounts?.value?.length) return 0.8;
      
      // FIXED: Proper string-to-number conversion
      const totalSupply = lpAccounts.value.reduce((sum, account) => sum + parseInt(account.amount || '0'), 0);
      const largestHolding = lpAccounts.value[0] ? parseInt(lpAccounts.value[0].amount || '0') : 0;
      
      if (totalSupply === 0) return 0.9;
      
      const ownershipPercentage = largestHolding / totalSupply;
      const ownershipRisk = Math.min(1, ownershipPercentage / this.config.maxLiquidityOwnership);
      
      const processingTime = performance.now() - startTime;
      this.metrics.componentLatencies.ownership = processingTime;
      
      console.log(`💰 LP Ownership: ${(ownershipPercentage * 100).toFixed(1)}%, risk=${ownershipRisk.toFixed(2)} (${processingTime.toFixed(1)}ms)`);
      
      return ownershipRisk;
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.metrics.componentLatencies.ownership = processingTime;
      console.warn(`⚠️ LP ownership analysis failed: ${error.message}`);
      return 0.7;
    }
  }

  /**
   * Analyze token holder concentration
   */
  async analyzeHolderConcentration(candidate) {
    const startTime = performance.now();
    
    try {
      const tokenMint = candidate.tokenMint || candidate.tokenAddress || candidate.baseMint;
      if (!tokenMint) return 0.6;
      
      console.log(`🔍 Analyzing holder concentration for: ${tokenMint}`);
      
      // Circuit breaker protection
      const largestAccounts = await this.circuitBreaker.execute('tokenLargestAccounts', async () => {
        return await this.rpcPool.call('getTokenLargestAccounts', [tokenMint], { 
          priority: 'high',
          timeout: 3000 
        });
      });
      
      if (!largestAccounts?.value?.length || largestAccounts.value.length < 5) return 0.8;
      
      // FIXED: Proper string-to-number conversion
      const totalSupply = largestAccounts.value.reduce((sum, account) => sum + parseInt(account.amount || '0'), 0);
      
      if (totalSupply === 0) return 0.9;
      
      const top10Holdings = largestAccounts.value.slice(0, 10)
        .reduce((sum, account) => sum + parseInt(account.amount || '0'), 0);
      const top1Holdings = parseInt(largestAccounts.value[0].amount || '0');
      
      const top10Percentage = top10Holdings / totalSupply;
      const top1Percentage = top1Holdings / totalSupply;
      
      // Combined concentration risk
      const concentrationRisk = Math.min(1, 
        (top10Percentage / this.config.maxHolderConcentration) * 0.7 +
        (top1Percentage / 0.5) * 0.3
      );
      
      const processingTime = performance.now() - startTime;
      this.metrics.componentLatencies.concentration = processingTime;
      
      console.log(`👥 Holder Concentration: top1=${(top1Percentage * 100).toFixed(1)}%, top10=${(top10Percentage * 100).toFixed(1)}%, risk=${concentrationRisk.toFixed(2)} (${processingTime.toFixed(1)}ms)`);
      
      return concentrationRisk;
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.metrics.componentLatencies.concentration = processingTime;
      console.warn(`⚠️ Holder concentration analysis failed: ${error.message}`);
      return 0.6;
    }
  }

  /**
   * Analyze liquidity lock status
   */
  async analyzeLiquidityLock(candidate) {
    const startTime = performance.now();
    
    try {
      const poolAge = Date.now() - (candidate.detectedAt || candidate.timestamp || Date.now());
      
      if (poolAge < this.config.minLiquidityLock) {
        console.log(`⚠️ Very new pool (${Math.round(poolAge / 60000)}min) - high risk`);
        return 0.9;
      }
      
      const lpMint = candidate.lpMint;
      if (!lpMint) {
        console.log(`⚠️ No LP mint for lock analysis`);
        return 0.6;
      }
      
      console.log(`🔍 Analyzing liquidity locks for: ${lpMint}`);
      
      let bestLockPercentage = 0;
      let lockProgramName = null;
      
      // Check all lock programs in parallel
      const lockChecks = Object.entries(this.LOCK_PROGRAMS).map(async ([programId, programName]) => {
        try {
          const accounts = await this.circuitBreaker.execute('tokenAccountsByOwner', async () => {
            return await this.rpcPool.call('getTokenAccountsByOwner', [
              programId,
              { mint: lpMint },
              { encoding: 'jsonParsed' }
            ], { timeout: 2000 });
          });
          
          if (!accounts?.value?.length) return { programName, lockedPercentage: 0 };
          
          let totalLocked = 0;
          for (const account of accounts.value) {
            const tokenAmount = account.account.data.parsed.info.tokenAmount;
            totalLocked += parseFloat(tokenAmount.uiAmount || 0);
          }
          
          if (totalLocked > 0) {
            const mintInfo = await this.rpcPool.call('getTokenSupply', [lpMint]);
            const totalSupply = parseFloat(mintInfo.value.uiAmount || 1);
            const lockedPercentage = (totalLocked / totalSupply) * 100;
            
            return { programName, lockedPercentage };
          }
          
          return { programName, lockedPercentage: 0 };
          
        } catch (error) {
          return { programName, lockedPercentage: 0 };
        }
      });
      
      const lockResults = await Promise.all(lockChecks);
      
      // Find best lock
      for (const result of lockResults) {
        if (result.lockedPercentage > bestLockPercentage) {
          bestLockPercentage = result.lockedPercentage;
          lockProgramName = result.programName;
        }
      }
      
      // Calculate lock risk
      let lockRisk;
      if (bestLockPercentage === 0) {
        lockRisk = 0.8; // High risk - no locks
      } else if (bestLockPercentage >= 90) {
        lockRisk = 0.1; // Very low risk - strong locks
      } else if (bestLockPercentage >= 70) {
        lockRisk = 0.3; // Low risk - good locks
      } else if (bestLockPercentage >= 50) {
        lockRisk = 0.5; // Medium risk - moderate locks
      } else {
        lockRisk = 0.7; // Medium-high risk - weak locks
      }
      
      const processingTime = performance.now() - startTime;
      this.metrics.componentLatencies.locks = processingTime;
      
      if (lockProgramName) {
        console.log(`🔒 Lock Analysis: ${bestLockPercentage.toFixed(1)}% on ${lockProgramName}, risk=${lockRisk.toFixed(2)} (${processingTime.toFixed(1)}ms)`);
      } else {
        console.log(`🔒 Lock Analysis: No locks detected - risk=${lockRisk.toFixed(2)} (${processingTime.toFixed(1)}ms)`);
      }
      
      return lockRisk;
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.metrics.componentLatencies.locks = processingTime;
      console.warn(`⚠️ Liquidity lock analysis failed: ${error.message}`);
      return 0.7;
    }
  }

  /**
   * Analyze deployer wallet history
   */
  async analyzeDeployerHistory(candidate) {
    const startTime = performance.now();
    
    try {
      let deployerWallet = candidate.deployerWallet;
      
      if (!deployerWallet && candidate.signature) {
        try {
          const tx = await this.circuitBreaker.execute('getTransaction', async () => {
            return await this.rpcPool.call('getTransaction', [candidate.signature, {
              encoding: 'jsonParsed',
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0
            }]);
          });
          
          if (tx?.transaction?.message?.accountKeys?.length) {
            deployerWallet = tx.transaction.message.accountKeys[0];
            if (typeof deployerWallet === 'object') {
              deployerWallet = deployerWallet.pubkey;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get deployer from transaction: ${error.message}`);
        }
      }
      
      if (!deployerWallet) {
        console.log(`⚠️ No deployer wallet found`);
        return 0.6;
      }
      
      // Check deployer cache first (expensive operation)
      if (this.deployerCache.has(deployerWallet)) {
        const cached = this.deployerCache.get(deployerWallet);
        if (Date.now() - cached.timestamp < this.config.cacheExpiry * 2) {
          const processingTime = performance.now() - startTime;
          console.log(`👤 Deployer Analysis (cached): risk=${cached.risk.toFixed(2)} (${processingTime.toFixed(1)}ms)`);
          return cached.risk;
        }
      }
      
      console.log(`🔍 Analyzing deployer history: ${deployerWallet}`);
      
      const signatures = await this.circuitBreaker.execute('getSignaturesForAddress', async () => {
        return await this.rpcPool.call('getSignaturesForAddress', [
          deployerWallet,
          { limit: 30 } // Reduced for performance
        ]);
      });
      
      if (!signatures?.length) {
        const risk = 0.9; // Very high risk - new wallet
        this.cacheDeployerResult(deployerWallet, risk);
        
        const processingTime = performance.now() - startTime;
        console.log(`👤 Deployer Analysis: New wallet - risk=${risk.toFixed(2)} (${processingTime.toFixed(1)}ms)`);
        return risk;
      }
      
      // Calculate wallet metrics
      const oldestTx = signatures[signatures.length - 1];
      const walletAge = oldestTx.blockTime ? Date.now() - (oldestTx.blockTime * 1000) : 0;
      const walletAgeDays = walletAge / (24 * 60 * 60 * 1000);
      
      // Simple pattern analysis for performance
      let suspiciousPatterns = 0;
      for (let i = 1; i < Math.min(signatures.length, 10); i++) {
        const current = signatures[i];
        const previous = signatures[i - 1];
        
        if (current.blockTime && previous.blockTime) {
          const timeDiff = (previous.blockTime - current.blockTime) * 1000;
          if (timeDiff < 30000) { // Less than 30 seconds apart
            suspiciousPatterns++;
          }
        }
      }
      
      // Calculate risk score
      let risk = 0.5; // Start neutral
      
      // Age factor (40% of score)
      if (walletAgeDays > 90) {
        risk -= 0.2; // Established wallet
      } else if (walletAgeDays > 30) {
        risk -= 0.1; // Moderately established
      } else if (walletAgeDays < 1) {
        risk += 0.3; // Very new wallet
      } else if (walletAgeDays < 7) {
        risk += 0.2; // New wallet
      }
      
      // Activity pattern factor (30% of score)
      const suspiciousRate = suspiciousPatterns / Math.min(signatures.length, 10);
      if (suspiciousRate > 0.5) {
        risk += 0.25; // High suspicious activity
      } else if (suspiciousRate > 0.2) {
        risk += 0.15; // Some suspicious activity
      }
      
      // Transaction volume factor (30% of score)
      if (signatures.length < 5) {
        risk += 0.2; // Very low activity
      } else if (signatures.length < 20) {
        risk += 0.1; // Low activity
      } else if (signatures.length > 100) {
        risk -= 0.1; // High activity (established)
      }
      
      // Clamp risk
      risk = Math.max(0.1, Math.min(0.9, risk));
      
      // Cache result
      this.cacheDeployerResult(deployerWallet, risk);
      
      const processingTime = performance.now() - startTime;
      this.metrics.componentLatencies.deployer = processingTime;
      
      console.log(`👤 Deployer Analysis: age=${walletAgeDays.toFixed(1)}d, txs=${signatures.length}, suspicious=${suspiciousPatterns}, risk=${risk.toFixed(2)} (${processingTime.toFixed(1)}ms)`);
      
      return risk;
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.metrics.componentLatencies.deployer = processingTime;
      console.warn(`⚠️ Deployer history analysis failed: ${error.message}`);
      return 0.6;
    }
  }

  /**
   * Cache deployer analysis result
   */
  cacheDeployerResult(deployerWallet, risk) {
    // LRU eviction for deployer cache
    if (this.deployerCache.size >= 200) {
      const firstKey = this.deployerCache.keys().next().value;
      this.deployerCache.delete(firstKey);
    }
    
    this.deployerCache.set(deployerWallet, {
      risk,
      timestamp: Date.now()
    });
  }

  /**
   * Generate cache key for analysis
   */
  generateCacheKey(candidate) {
    const tokenMint = candidate.tokenMint || candidate.tokenAddress || 'unknown';
    const poolAddress = candidate.poolAddress || candidate.ammId || 'unknown';
    return `${tokenMint}_${poolAddress}`;
  }

  /**
   * Get cached result with expiry check
   */
  getCachedResult(cacheKey) {
    if (!this.analysisCache.has(cacheKey)) return null;
    
    const cached = this.analysisCache.get(cacheKey);
    if (Date.now() - cached.timestamp > this.config.cacheExpiry) {
      this.analysisCache.delete(cacheKey);
      return null;
    }
    
    // Move to end for LRU
    this.analysisCache.delete(cacheKey);
    this.analysisCache.set(cacheKey, cached);
    
    return cached.result;
  }

  /**
   * Cache analysis result
   */
  cacheResult(cacheKey, result) {
    // LRU eviction
    if (this.analysisCache.size >= this.config.maxCacheSize) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
    
    this.analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Get risk level classification
   */
  getRiskLevel(risk) {
    if (risk >= 0.8) return 'CRITICAL';
    if (risk >= 0.6) return 'HIGH';
    if (risk >= 0.4) return 'MEDIUM';
    if (risk >= 0.2) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Generate trading recommendation
   */
  generateRecommendation(risk) {
    if (risk >= 0.8) return 'AVOID - High rug pull risk';
    if (risk >= 0.6) return 'EXTREME CAUTION - Multiple risk factors';
    if (risk >= 0.4) return 'CAUTION - Moderate risk, small position only';
    if (risk >= 0.2) return 'ACCEPTABLE - Low risk, normal sizing';
    return 'SAFE - Minimal rug pull risk';
  }

  /**
   * Update performance metrics
   */
  updateMetrics(processingTime, success) {
    this.metrics.avgLatency = ((this.metrics.avgLatency * (this.metrics.totalAnalyses - 1)) + 
                              processingTime) / this.metrics.totalAnalyses;
    
    if (success) {
      this.metrics.successRate = ((this.metrics.successRate * (this.metrics.totalAnalyses - 1)) + 1) / 
                                 this.metrics.totalAnalyses;
    } else {
      this.metrics.successRate = (this.metrics.successRate * (this.metrics.totalAnalyses - 1)) / 
                                 this.metrics.totalAnalyses;
    }
  }

  /**
   * PRODUCTION: Health check for monitoring systems
   */
  isHealthy() {
    const recentSuccessRate = this.metrics.totalAnalyses > 0 ? this.metrics.successRate : 1;
    
    return (
      this.metrics.avgLatency < 500.0 &&           // Under 500ms average latency
      recentSuccessRate > 0.85 &&                  // Over 85% success rate
      this.rpcPool &&                              // RPC pool available
      this.circuitBreaker &&                       // Circuit breaker available
      this.analysisCache &&                        // Cache system operational
      this.deployerCache &&                        // Deployer cache operational
      this.analysisCache.size < this.config.maxCacheSize * 0.9  // Cache not near full
    );
  }

  /**
   * PRODUCTION: Get comprehensive metrics for monitoring dashboards
   */
  getMetrics() {
    const totalAnalyses = this.metrics.totalAnalyses;
    const successRate = totalAnalyses > 0 ? this.metrics.successRate : 1;
    
    // Calculate cache hit rates (estimated)
    const analysisCacheUtilization = this.config.maxCacheSize > 0 ? 
      (this.analysisCache.size / this.config.maxCacheSize) : 0;
    const deployerCacheUtilization = this.deployerCache.size / 200; // Max deployer cache size is 200
    
    return {
      // Core performance metrics
      performance: {
        totalAnalyses: totalAnalyses,
        successfulAnalyses: Math.round(totalAnalyses * successRate),
        failedAnalyses: Math.round(totalAnalyses * (1 - successRate)),
        successRate: successRate,
        averageLatency: this.metrics.avgLatency,
        isOptimal: this.metrics.avgLatency < 500,
        slaCompliance: this.metrics.avgLatency < 500 ? 'COMPLIANT' : 'VIOLATION'
      },
      
      // Component-level performance
      componentLatencies: {
        ownership: this.metrics.componentLatencies.ownership,
        concentration: this.metrics.componentLatencies.concentration,
        locks: this.metrics.componentLatencies.locks,
        deployer: this.metrics.componentLatencies.deployer
      },
      
      // Cache performance and utilization
      cache: {
        analysisCache: {
          enabled: this.config.enableCaching,
          size: this.analysisCache.size,
          maxSize: this.config.maxCacheSize,
          utilization: analysisCacheUtilization,
          utilizationPercentage: (analysisCacheUtilization * 100).toFixed(1) + '%',
          status: analysisCacheUtilization > 0.9 ? 'NEAR_FULL' : 'HEALTHY'
        },
        deployerCache: {
          size: this.deployerCache.size,
          maxSize: 200,
          utilization: deployerCacheUtilization,
          utilizationPercentage: (deployerCacheUtilization * 100).toFixed(1) + '%',
          status: deployerCacheUtilization > 0.9 ? 'NEAR_FULL' : 'HEALTHY'
        }
      },
      
      // Configuration and thresholds
      configuration: {
        maxLiquidityOwnership: this.config.maxLiquidityOwnership,
        maxHolderConcentration: this.config.maxHolderConcentration,
        minLiquidityLock: this.config.minLiquidityLock,
        cacheExpiry: this.config.cacheExpiry,
        enableCaching: this.config.enableCaching
      },
      
      // Risk analysis distribution (if we tracked it)
      riskAnalysis: {
        lockPrograms: Object.keys(this.LOCK_PROGRAMS).length,
        tokenPrograms: this.TOKEN_PROGRAMS.size,
        riskWeights: {
          liquidityOwnership: 0.35,
          liquidityLock: 0.30,
          holderConcentration: 0.25,
          deployerHistory: 0.10
        }
      },
      
      // System health and targets
      health: {
        overall: this.isHealthy(),
        status: this.isHealthy() ? 'HEALTHY' : 'DEGRADED',
        dependencies: {
          rpcPool: !!this.rpcPool,
          circuitBreaker: !!this.circuitBreaker,
          analysisCache: !!this.analysisCache,
          deployerCache: !!this.deployerCache
        }
      },
      
      // Performance targets for monitoring
      targets: {
        maxLatency: 500.0,           // ms
        minSuccessRate: 0.85,        // 85%
        maxCacheUtilization: 0.90,   // 90%
        optimalAnalysesPerHour: 100  // Expected throughput
      },
      
      // Timestamp for monitoring
      reportTimestamp: Date.now(),
      reportDate: new Date().toISOString()
    };
  }

  /**
   * PRODUCTION: Reset metrics for monitoring periods
   */
  resetMetrics() {
    const previousMetrics = { ...this.metrics };
    
    this.metrics = {
      totalAnalyses: 0,
      successRate: 0,
      avgLatency: 0,
      componentLatencies: {
        ownership: 0,
        concentration: 0,
        locks: 0,
        deployer: 0
      }
    };
    
    console.log(`📊 Rug Pull Detector metrics reset - Previous: ${previousMetrics.totalAnalyses} analyses, ${previousMetrics.avgLatency.toFixed(1)}ms avg`);
    
    return previousMetrics;
  }

  /**
   * PRODUCTION: Shutdown cleanup
   */
  shutdown() {
    console.log('🛑 Shutting down Rug Pull Detector...');
    
    // Clear caches
    if (this.analysisCache) {
      console.log(`📊 Clearing analysis cache: ${this.analysisCache.size} entries`);
      this.analysisCache.clear();
    }
    
    if (this.deployerCache) {
      console.log(`📊 Clearing deployer cache: ${this.deployerCache.size} entries`);
      this.deployerCache.clear();
    }
    
    // Reset metrics
    this.resetMetrics();
    
    // Remove event listeners
    this.removeAllListeners();
    
    console.log('✅ Rug Pull Detector shutdown complete');
  }
}