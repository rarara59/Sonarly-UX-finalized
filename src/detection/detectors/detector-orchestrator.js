/**
 * Parallel Detector Coordination - EXECUTION-TRACED FIXES
 * CRITICAL FIXES: Null pointer crashes, array index mismatches, division by zero
 */

export class DetectorOrchestrator {
  constructor(detectors, signalBus, circuitBreaker = null, performanceMonitor = null) {
    this.detectors = {
      raydium: detectors.raydium,
      pumpfun: detectors.pumpfun,
      orca: detectors.orca
    };
    this.signalBus = signalBus;
    this.circuitBreaker = circuitBreaker;
    this.performanceMonitor = performanceMonitor;
    
    this.detectorConfig = {
      raydium: { priority: 1, timeout: 15000, enabled: true },
      pumpfun: { priority: 2, timeout: 12000, enabled: true },
      orca: { priority: 3, timeout: 10000, enabled: true }
    };
    
    this.stats = {
      totalTransactions: 0,
      totalCandidates: 0,
      detectorStats: {
        raydium: { processed: 0, candidates: 0, errors: 0, avgLatency: null },
        pumpfun: { processed: 0, candidates: 0, errors: 0, avgLatency: null },
        orca: { processed: 0, candidates: 0, errors: 0, avgLatency: null }
      },
      parallelEfficiency: null,
      avgLatency: null,
      successRate: 0
    };
    
    this.errorCounts = new Map();
    this.errorResetInterval = 60000;
    this.startErrorReset();
  }
  
  async analyzeTransaction(transaction) {
    const startTime = performance.now();
    this.stats.totalTransactions++;
    
    try {
      // FIXED: Track which detectors actually run
      const detectorPromisesWithNames = this.createDetectorPromisesWithNames(transaction);
      
      const results = await Promise.allSettled(detectorPromisesWithNames.map(p => p.promise));
      
      // FIXED: Process results with correct detector mapping
      const aggregatedResults = this.processDetectorResults(results, detectorPromisesWithNames, transaction);
      
      this.updateStats(startTime, aggregatedResults);
      this.emitResults(aggregatedResults);
      
      return aggregatedResults;
      
    } catch (error) {
      this.handleOrchestrationError(error, startTime);
      return {
        candidates: [],
        detectorResults: {},
        error: error.message,
        processingTime: performance.now() - startTime
      };
    }
  }
  
  // FIXED: Return promises with their detector names for proper mapping
  createDetectorPromisesWithNames(transaction) {
    const promisesWithNames = [];
    
    Object.entries(this.detectorConfig).forEach(([dexName, config]) => {
      if (!config.enabled) {
        return; // Skip disabled
      }
      
      if (!this.detectors[dexName]) {
        console.warn(`Detector ${dexName} not available, skipping`);
        return; // Skip missing
      }
      
      const promise = this.executeDetectorWithProtection(dexName, transaction, config.timeout);
      promisesWithNames.push({ dexName, promise });
    });
    
    return promisesWithNames;
  }
  
  async executeDetectorWithProtection(dexName, transaction, timeout) {
    const startTime = performance.now();
    
    try {
      // FIXED: Proper null checking for circuit breaker
      if (this.shouldSkipDetector(dexName)) {
        return {
          dexName,
          success: false,
          candidates: [],
          error: 'Circuit breaker open',
          latency: 0,
          skipped: true
        };
      }
      
      const candidates = await this.executeWithTimeout(
        () => this.detectors[dexName].analyzeTransaction(transaction),
        timeout,
        `${dexName} detector`
      );
      
      const latency = performance.now() - startTime;
      this.recordDetectorSuccess(dexName, latency);
      
      return {
        dexName,
        success: true,
        candidates: candidates || [],
        latency,
        skipped: false
      };
      
    } catch (error) {
      const latency = performance.now() - startTime;
      this.recordDetectorFailure(dexName, latency, error);
      this.recordDetectorError(dexName, error);
      
      return {
        dexName,
        success: false,
        candidates: [],
        error: error.message,
        latency,
        skipped: false
      };
    }
  }
  
  async executeWithTimeout(operation, timeoutMs, operationName) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const result = await operation(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`${operationName} timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }
  
  // FIXED: Safe circuit breaker checking with proper null handling
  shouldSkipDetector(dexName) {
    // CRITICAL FIX: Check for null BEFORE accessing properties
    if (!this.circuitBreaker) return false;
    
    if (typeof this.circuitBreaker.canExecute === 'function') {
      return !this.circuitBreaker.canExecute(dexName);
    }
    
    if (typeof this.circuitBreaker.isOpen === 'function') {
      return this.circuitBreaker.isOpen(dexName);
    }
    
    return false;
  }
  
  recordDetectorSuccess(dexName, latency) {
    if (!this.circuitBreaker) return;
    
    if (typeof this.circuitBreaker.recordSuccess === 'function') {
      this.circuitBreaker.recordSuccess(dexName, latency);
    }
  }
  
  recordDetectorFailure(dexName, latency, error) {
    if (!this.circuitBreaker) return;
    
    if (typeof this.circuitBreaker.recordFailure === 'function') {
      this.circuitBreaker.recordFailure(dexName, latency, error);
    }
  }
  
  // FIXED: Process results with correct detector name mapping
  processDetectorResults(results, detectorPromisesWithNames, transaction) {
    const aggregatedResults = {
      candidates: [],
      detectorResults: {},
      transaction: {
        signature: transaction.transaction?.signatures?.[0] || 'unknown',
        slot: transaction.slot,
        blockTime: transaction.blockTime
      },
      processingTime: 0,
      parallelEfficiency: 0
    };
    
    let maxLatency = 0;
    let totalSequentialTime = 0;
    let successfulDetectors = 0;
    
    // FIXED: Use correct detector name mapping
    results.forEach((result, index) => {
      const dexName = detectorPromisesWithNames[index].dexName; // Correct mapping!
      
      if (result.status === 'fulfilled') {
        const detectorResult = result.value;
        
        this.updateDetectorStats(dexName, detectorResult);
        
        if (detectorResult.candidates && detectorResult.candidates.length > 0) {
          aggregatedResults.candidates.push(...detectorResult.candidates);
        }
        
        if (detectorResult.success && !detectorResult.skipped) {
          maxLatency = Math.max(maxLatency, detectorResult.latency);
          totalSequentialTime += detectorResult.latency;
          successfulDetectors++;
        }
        
        aggregatedResults.detectorResults[dexName] = {
          success: detectorResult.success,
          candidateCount: detectorResult.candidates?.length || 0,
          latency: detectorResult.latency,
          error: detectorResult.error,
          skipped: detectorResult.skipped
        };
        
      } else {
        aggregatedResults.detectorResults[dexName] = {
          success: false,
          candidateCount: 0,
          latency: 0,
          error: result.reason?.message || 'Promise rejected',
          skipped: false
        };
        
        this.recordDetectorError(dexName, result.reason);
      }
    });
    
    // FIXED: Prevent division by zero
    if (successfulDetectors > 0 && totalSequentialTime > 0 && maxLatency > 0) {
      const speedup = totalSequentialTime / maxLatency;
      aggregatedResults.parallelEfficiency = speedup / successfulDetectors;
    } else {
      aggregatedResults.parallelEfficiency = 0; // Safe fallback
    }
    
    aggregatedResults.processingTime = maxLatency;
    aggregatedResults.candidates = this.deduplicateCandidates(aggregatedResults.candidates);
    
    return aggregatedResults;
  }
  
  updateDetectorStats(dexName, result) {
    const stats = this.stats.detectorStats[dexName];
    if (!stats) return;
    
    stats.processed++;
    
    if (result.success && !result.skipped) {
      stats.candidates += result.candidates?.length || 0;
      
      if (stats.avgLatency === null) {
        stats.avgLatency = result.latency;
      } else {
        stats.avgLatency = (stats.avgLatency * 0.9) + (result.latency * 0.1);
      }
    } else if (!result.skipped) {
      stats.errors++;
    }
  }
  
  recordDetectorError(dexName, error) {
    const currentCount = this.errorCounts.get(dexName) || 0;
    this.errorCounts.set(dexName, currentCount + 1);
    console.warn(`Detector ${dexName} error:`, error?.message || error);
  }
  
  deduplicateCandidates(candidates) {
    if (!candidates || candidates.length === 0) return [];
    
    const seen = new Set();
    const unique = [];
    
    for (const candidate of candidates) {
      const signature = candidate.signature || candidate.transactionSignature || 'no-sig';
      const poolId = candidate.poolId || candidate.pool?.address || '';
      const tokenAddress = candidate.baseToken?.address || candidate.token?.address || '';
      
      const key = `${signature}_${poolId}_${tokenAddress}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(candidate);
      }
    }
    
    return unique;
  }
  
  emitResults(results) {
    results.candidates.forEach(candidate => {
      this.signalBus.emit('candidateDetected', candidate);
    });
    
    if (results.candidates.length > 0) {
      this.signalBus.emit('candidateBatchDetected', {
        candidates: results.candidates,
        detectorResults: results.detectorResults,
        processingTime: results.processingTime,
        parallelEfficiency: results.parallelEfficiency
      });
    }
  }
  
  updateStats(startTime, results) {
    const totalLatency = performance.now() - startTime;
    
    this.stats.totalCandidates += results.candidates.length;
    
    if (this.stats.avgLatency === null) {
      this.stats.avgLatency = totalLatency;
    } else {
      this.stats.avgLatency = (this.stats.avgLatency * 0.9) + (totalLatency * 0.1);
    }
    
    if (results.parallelEfficiency > 0) {
      if (this.stats.parallelEfficiency === null) {
        this.stats.parallelEfficiency = results.parallelEfficiency;
      } else {
        this.stats.parallelEfficiency = (this.stats.parallelEfficiency * 0.9) + (results.parallelEfficiency * 0.1);
      }
    }
    
    const successfulDetectors = Object.values(results.detectorResults)
      .filter(result => result.success && !result.skipped).length;
    const totalDetectors = Object.values(this.detectorConfig)
      .filter(config => config.enabled).length;
    
    this.stats.successRate = totalDetectors > 0 ? successfulDetectors / totalDetectors : 0;
    
    if (this.performanceMonitor) {
      this.performanceMonitor.recordCycle(totalLatency, results.candidates.length, this.stats.successRate > 0.5);
    }
  }
  
  handleOrchestrationError(error, startTime) {
    const latency = performance.now() - startTime;
    
    if (this.performanceMonitor) {
      this.performanceMonitor.recordCycle(latency, 0, false);
    }
    
    console.error('Detector orchestration error:', error);
  }
  
  startErrorReset() {
    setInterval(() => {
      this.errorCounts.clear();
    }, this.errorResetInterval);
  }
  
  setDetectorEnabled(dexName, enabled) {
    if (this.detectorConfig[dexName]) {
      this.detectorConfig[dexName].enabled = enabled;
      console.log(`Detector ${dexName} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
  
  getStats() {
    return {
      ...this.stats,
      errorCounts: Object.fromEntries(this.errorCounts),
      detectorConfig: { ...this.detectorConfig }
    };
  }
  
  isHealthy() {
    return (
      this.stats.avgLatency !== null && this.stats.avgLatency < 25.0 &&
      this.stats.successRate > 0.8 &&
      this.stats.parallelEfficiency !== null && this.stats.parallelEfficiency > 0.5
    );
  }
  
  async analyzeTransactionWithSpecificDetectors(transaction, enabledDetectors) {
    const originalConfig = { ...this.detectorConfig };
    
    try {
      Object.keys(this.detectorConfig).forEach(dex => {
        this.detectorConfig[dex].enabled = false;
      });
      
      enabledDetectors.forEach(dex => {
        if (this.detectorConfig[dex]) {
          this.detectorConfig[dex].enabled = true;
        }
      });
      
      return await this.analyzeTransaction(transaction);
      
    } finally {
      this.detectorConfig = originalConfig;
    }
  }
}