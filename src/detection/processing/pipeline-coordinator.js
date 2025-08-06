/**
 * End-to-End Pipeline Orchestration - EXECUTION-TRACED FIXES
 * CRITICAL FIXES: Division by zero, unused queue logic, inefficient timers
 */

export class PipelineCoordinator {
  constructor(components) {
    this.fetcher = components.fetcher;
    this.detectorOrchestrator = components.detectorOrchestrator;
    this.tokenValidator = components.tokenValidator;
    this.poolValidator = components.poolValidator;
    this.candidateAssembler = components.candidateAssembler;
    this.signalBus = components.signalBus;
    this.performanceMonitor = components.performanceMonitor;
    this.circuitBreaker = components.circuitBreaker;
    
    this.config = {
      maxConcurrentTransactions: 50,
      processingInterval: 5000,
      batchSize: 20,
      timeouts: {
        fetch: 10000,
        detect: 25000,
        validate: 8000,
        assemble: 5000
      },
      statsResetInterval: 3600000 // 1 hour
    };
    
    this.semaphore = this.createSemaphore(this.config.maxConcurrentTransactions);
    
    this.isRunning = false;
    this.activeProcessing = 0;
    
    this.stats = {
      totalCycles: 0,
      totalTransactions: 0,
      totalCandidates: 0,
      avgCycleTime: null,
      avgThroughput: null,
      stageLatencies: {
        fetch: null,
        detect: null,
        validate: null,
        assemble: null
      },
      errors: {
        fetch: 0,
        detect: 0,
        validate: 0,
        assemble: 0,
        timeout: 0
      },
      lastSuccessfulCycle: Date.now(),
      lastStatsReset: Date.now()
    };
    
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5;
    this.backoffMultiplier = 1;
    
    // FIXED: Proper stats reset timer
    this.setupStatsReset();
  }
  
  start() {
    if (this.isRunning) {
      console.warn('Pipeline already running');
      return;
    }
    
    this.isRunning = true;
    this.consecutiveErrors = 0;
    this.backoffMultiplier = 1;
    
    console.log('Starting pipeline coordinator');
    this.processingLoop();
  }
  
  stop() {
    this.isRunning = false;
    console.log('Stopping pipeline coordinator');
  }
  
  async processingLoop() {
    while (this.isRunning) {
      const cycleStartTime = performance.now();
      
      try {
        const transactions = await this.executeFetchStage();
        
        if (transactions.length === 0) {
          await this.sleep(this.getOptimalInterval());
          continue;
        }
        
        // FIXED: Removed unused queue processing logic
        // Process transactions directly for better performance
        const candidates = await this.processTransactionsParallel(transactions);
        
        const cycleTime = performance.now() - cycleStartTime;
        this.updateCycleStats(cycleTime, transactions.length, candidates.length);
        
        this.consecutiveErrors = 0;
        this.backoffMultiplier = 1;
        this.stats.lastSuccessfulCycle = Date.now();
        
        candidates.forEach(candidate => {
          this.signalBus.emit('candidateDetected', candidate);
        });
        
      } catch (error) {
        await this.handlePipelineError(error, cycleStartTime);
      }
      
      await this.sleep(this.getOptimalInterval());
    }
  }
  
  async executeFetchStage() {
    const startTime = performance.now();
    
    try {
      const transactions = await this.executeWithCircuitBreaker(
        'transactionFetcher',
        () => this.fetcher.pollAllDexs(),
        this.config.timeouts.fetch
      );
      
      const latency = performance.now() - startTime;
      this.updateStageLatency('fetch', latency);
      
      return transactions || [];
      
    } catch (error) {
      this.stats.errors.fetch++;
      if (error.message.includes('timeout')) {
        this.stats.errors.timeout++;
      }
      throw new Error(`Fetch stage failed: ${error.message}`);
    }
  }
  
  async processTransactionsParallel(transactions) {
    const allCandidates = [];
    const batchPromises = [];
    
    for (let i = 0; i < transactions.length; i += this.config.batchSize) {
      const batch = transactions.slice(i, i + this.config.batchSize);
      batchPromises.push(this.processBatchChunk(batch));
    }
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allCandidates.push(...result.value.filter(Boolean));
      }
    });
    
    return allCandidates;
  }
  
  async processBatchChunk(transactions) {
    const candidates = [];
    
    const processingPromises = transactions.map(async (transaction) => {
      await this.semaphore.acquire();
      
      try {
        const candidate = await this.processSingleTransaction(transaction);
        return candidate;
      } catch (error) {
        console.warn('Transaction processing failed:', {
          signature: transaction.signature || 'unknown',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        return null;
      } finally {
        this.semaphore.release();
      }
    });
    
    const results = await Promise.allSettled(processingPromises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        const candidate = result.value;
        if (Array.isArray(candidate)) {
          candidates.push(...candidate.filter(Boolean));
        } else {
          candidates.push(candidate);
        }
      }
    });
    
    return candidates;
  }
  
  async processSingleTransaction(transaction) {
    try {
      const detectionResult = await this.executeDetectionStage(transaction);
      
      if (!detectionResult || !detectionResult.candidates || detectionResult.candidates.length === 0) {
        return null;
      }
      
      const candidatePromises = detectionResult.candidates.map(async (rawCandidate) => {
        try {
          const validationResult = await this.executeValidationStage(rawCandidate);
          if (!validationResult.valid) {
            return null;
          }
          
          const assembledCandidate = await this.executeAssemblyStage(rawCandidate, validationResult);
          return assembledCandidate;
          
        } catch (error) {
          console.warn('Single candidate processing error:', error.message);
          return null;
        }
      });

      const assembledCandidates = (await Promise.allSettled(candidatePromises))
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
      
      return assembledCandidates.length > 0 ? assembledCandidates : null;
      
    } catch (error) {
      console.warn('Transaction processing error:', error.message);
      return null;
    }
  }
  
  async executeDetectionStage(transaction) {
    const startTime = performance.now();
    
    try {
      const result = await this.executeWithCircuitBreaker(
        'detectorOrchestrator',
        () => this.detectorOrchestrator.analyzeTransaction(transaction),
        this.config.timeouts.detect
      );
      
      const latency = performance.now() - startTime;
      this.updateStageLatency('detect', latency);
      
      return result;
      
    } catch (error) {
      this.stats.errors.detect++;
      if (error.message.includes('timeout')) {
        this.stats.errors.timeout++;
      }
      throw error;
    }
  }
  
  async executeValidationStage(candidate) {
    const startTime = performance.now();
    
    try {
      const validationPromises = [];
      
      if (candidate.baseToken?.address) {
        validationPromises.push(
          this.executeWithCircuitBreaker(
            'tokenValidator',
            () => this.tokenValidator.validateToken(candidate.baseToken.address),
            this.config.timeouts.validate / 2
          ).then(result => ({ type: 'token', result }))
        );
      }
      
      if (candidate.poolId && candidate.dex !== 'pumpfun') {
        validationPromises.push(
          this.executeWithCircuitBreaker(
            'poolValidator',
            () => this.poolValidator.validatePool(candidate.poolId, candidate.dex),
            this.config.timeouts.validate / 2
          ).then(result => ({ type: 'pool', result }))
        );
      }
      
      const validations = await Promise.all(validationPromises);
      
      const validationResult = { valid: true };
      
      for (const validation of validations) {
        validationResult[validation.type] = validation.result;
        
        if (!validation.result.valid) {
          validationResult.valid = false;
        }
      }
      
      const latency = performance.now() - startTime;
      this.updateStageLatency('validate', latency);
      
      return validationResult;
      
    } catch (error) {
      this.stats.errors.validate++;
      if (error.message.includes('timeout')) {
        this.stats.errors.timeout++;
      }
      throw error;
    }
  }
  
  async executeAssemblyStage(rawCandidate, validationResult) {
    const startTime = performance.now();
    
    try {
      const candidate = await this.executeWithCircuitBreaker(
        'candidateAssembler',
        () => this.candidateAssembler.assembleCandidate(rawCandidate, validationResult),
        this.config.timeouts.assemble
      );
      
      const latency = performance.now() - startTime;
      this.updateStageLatency('assemble', latency);
      
      return candidate;
      
    } catch (error) {
      this.stats.errors.assemble++;
      if (error.message.includes('timeout')) {
        this.stats.errors.timeout++;
      }
      throw error;
    }
  }
  
  async executeWithCircuitBreaker(serviceName, operation, timeoutMs) {
    if (this.circuitBreaker) {
      return await this.circuitBreaker.execute(serviceName, async () => {
        return await this.executeWithTimeout(operation, timeoutMs, serviceName);
      });
    } else {
      return await this.executeWithTimeout(operation, timeoutMs, serviceName);
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
  
  createSemaphore(limit) {
    let current = 0;
    const waiting = [];
    
    return {
      acquire: async () => {
        if (current < limit) {
          current++;
          return;
        }
        
        return new Promise(resolve => {
          waiting.push(resolve);
        });
      },
      
      release: () => {
        current--;
        if (waiting.length > 0) {
          const resolve = waiting.shift();
          current++;
          resolve();
        }
      }
    };
  }
  
  async handlePipelineError(error, cycleStartTime) {
    const cycleTime = performance.now() - cycleStartTime;
    this.consecutiveErrors++;
    
    console.error(`Pipeline error (${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`, error.message);
    
    if (this.performanceMonitor) {
      this.performanceMonitor.recordCycle(cycleTime, 0, false);
    }
    
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 8);
      console.warn(`Entering backoff mode: ${this.backoffMultiplier}x interval`);
    }
    
    if (this.consecutiveErrors >= this.maxConsecutiveErrors * 2) {
      console.error('Too many consecutive errors, stopping pipeline');
      this.stop();
    }
  }
  
  // FIXED: Protected against division by zero
  updateCycleStats(cycleTime, transactionCount, candidateCount) {
    this.stats.totalCycles++;
    this.stats.totalTransactions += transactionCount;
    this.stats.totalCandidates += candidateCount;
    
    if (this.stats.avgCycleTime === null) {
      this.stats.avgCycleTime = cycleTime;
    } else {
      this.stats.avgCycleTime = (this.stats.avgCycleTime * 0.9) + (cycleTime * 0.1);
    }
    
    // FIXED: Prevent division by zero
    const throughputPerMin = cycleTime > 0 
      ? (transactionCount / (cycleTime / 1000)) * 60 
      : 0;
      
    if (this.stats.avgThroughput === null) {
      this.stats.avgThroughput = throughputPerMin;
    } else {
      this.stats.avgThroughput = (this.stats.avgThroughput * 0.9) + (throughputPerMin * 0.1);
    }
    
    if (this.performanceMonitor) {
      this.performanceMonitor.recordCycle(cycleTime, candidateCount, true);
    }
  }
  
  updateStageLatency(stage, latency) {
    if (this.stats.stageLatencies[stage] === null) {
      this.stats.stageLatencies[stage] = latency;
    } else {
      this.stats.stageLatencies[stage] = (this.stats.stageLatencies[stage] * 0.9) + (latency * 0.1);
    }
  }
  
  getOptimalInterval() {
    const baseInterval = this.config.processingInterval;
    const backoffInterval = baseInterval * this.backoffMultiplier;
    
    if (this.stats.avgCycleTime && this.stats.avgCycleTime > 0) {
      const adaptiveInterval = Math.max(baseInterval, this.stats.avgCycleTime * 2);
      return Math.min(backoffInterval, adaptiveInterval);
    }
    
    return backoffInterval;
  }
  
  // FIXED: Efficient stats reset with proper timer management
  setupStatsReset() {
    const scheduleNextReset = () => {
      setTimeout(() => {
        if (this.isRunning) {
          console.log('Resetting stats to prevent memory growth');
          this.resetStats();
          scheduleNextReset(); // Schedule next reset
        }
      }, this.config.statsResetInterval);
    };
    
    scheduleNextReset();
  }
  
  resetStats() {
    const currentTime = Date.now();
    this.stats = {
      totalCycles: 0,
      totalTransactions: 0,
      totalCandidates: 0,
      avgCycleTime: null,
      avgThroughput: null,
      stageLatencies: {
        fetch: null,
        detect: null,
        validate: null,
        assemble: null
      },
      errors: {
        fetch: 0,
        detect: 0,
        validate: 0,
        assemble: 0,
        timeout: 0
      },
      lastSuccessfulCycle: this.stats.lastSuccessfulCycle,
      lastStatsReset: currentTime
    };
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      consecutiveErrors: this.consecutiveErrors,
      backoffMultiplier: this.backoffMultiplier,
      candidateRate: this.stats.totalCycles > 0 
        ? this.stats.totalCandidates / this.stats.totalCycles 
        : 0,
      activeProcessing: this.activeProcessing
    };
  }
  
  isHealthy() {
    const timeSinceLastSuccess = Date.now() - this.stats.lastSuccessfulCycle;
    
    return (
      this.isRunning &&
      this.stats.avgCycleTime < 30000 && // JavaScript coercion handles null correctly
      this.consecutiveErrors < this.maxConsecutiveErrors &&
      timeSinceLastSuccess < 300000 // Success within 5 minutes
    );
  }
}