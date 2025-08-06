/**
 * Enhanced RPC Connection Pool with Parallel Execution
 * Integrates parallel strategies for optimal meme coin detection
 * Target: <30ms latency, 99.99% availability
 */

import { RpcConnectionPool } from './rpc-connection-pool.js';
import { ParallelRpcExecutor } from './parallel-rpc-executor.js';
import { DualEndpointStrategy } from './dual-endpoint-strategy.js';

export class EnhancedRpcConnectionPool extends RpcConnectionPool {
  constructor(endpoints, performanceMonitor = null) {
    super(endpoints, performanceMonitor);
    
    // Initialize parallel execution strategies
    this.parallelExecutor = new ParallelRpcExecutor(
      this.endpoints,
      performanceMonitor
    );
    
    // Setup dual endpoint strategy
    const endpointArray = Array.from(this.endpoints.values());
    const primary = endpointArray.filter(e => e.priority <= 2);
    const secondary = endpointArray.filter(e => e.priority > 2);
    
    this.dualStrategy = new DualEndpointStrategy(
      primary.length > 0 ? primary : endpointArray,
      secondary.length > 0 ? secondary : endpointArray,
      performanceMonitor
    );
    
    // Strategy selection metrics
    this.strategyUsage = {
      race: 0,
      consensus: 0,
      dual: 0,
      fallback: 0
    };
  }
  
  /**
   * Override main call method with parallel strategies
   */
  async call(method, params = [], options = {}) {
    const startTime = Date.now();
    const strategy = this.selectOptimalStrategy(method, options);
    
    try {
      let result;
      
      switch (strategy) {
        case 'race':
          result = await this.executeRaceStrategy(method, params, options);
          break;
          
        case 'consensus':
          result = await this.executeConsensusStrategy(method, params, options);
          break;
          
        case 'dual':
          result = await this.executeDualStrategy(method, params, options);
          break;
          
        default:
          // Fallback to original sequential strategy
          result = await super.call(method, params, options);
          strategy = 'fallback';
      }
      
      // Track strategy usage and performance
      this.trackStrategyPerformance(strategy, true, Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      this.trackStrategyPerformance(strategy, false, Date.now() - startTime);
      
      // Attempt fallback for critical methods
      if (this.isCriticalMethod(method) && strategy !== 'fallback') {
        console.warn(`Strategy ${strategy} failed, attempting fallback for ${method}`);
        return super.call(method, params, options);
      }
      
      throw error;
    }
  }
  
  /**
   * Select optimal strategy based on method and requirements
   */
  selectOptimalStrategy(method, options) {
    // Allow explicit strategy override
    if (options.strategy) {
      return options.strategy;
    }
    
    // Method-specific optimizations
    switch (method) {
      // Speed critical - use race
      case 'getAccountInfo':
      case 'getTokenAccountBalance':
      case 'getTokenSupply':
        return 'race';
        
      // Reliability critical - use consensus
      case 'sendTransaction':
      case 'getTransaction':
      case 'getBlock':
        return 'consensus';
        
      // Balanced - use dual
      case 'getSignaturesForAddress':
      case 'getProgramAccounts':
      case 'getMultipleAccounts':
        return 'dual';
        
      // Default to fallback for unknown methods
      default:
        return 'fallback';
    }
  }
  
  /**
   * Execute race strategy for fastest response
   */
  async executeRaceStrategy(method, params, options) {
    this.strategyUsage.race++;
    
    // Add performance optimizations for race
    const raceOptions = {
      ...options,
      timeout: options.timeout || 50 // Aggressive timeout for speed
    };
    
    return this.parallelExecutor.raceCall(method, params, raceOptions);
  }
  
  /**
   * Execute consensus strategy for reliability
   */
  async executeConsensusStrategy(method, params, options) {
    this.strategyUsage.consensus++;
    
    // Consensus needs more time and endpoints
    const consensusOptions = {
      ...options,
      timeout: options.timeout || 200,
      minConsensus: options.minConsensus || 2
    };
    
    return this.parallelExecutor.consensusCall(method, params, consensusOptions);
  }
  
  /**
   * Execute dual strategy for balance
   */
  async executeDualStrategy(method, params, options) {
    this.strategyUsage.dual++;
    
    // Dual strategy with speed preference for meme coins
    const dualOptions = {
      ...options,
      timeout: options.timeout || 100,
      preferSpeed: options.preferSpeed !== false // Default true
    };
    
    return this.dualStrategy.executeDual(method, params, dualOptions);
  }
  
  /**
   * Check if method is critical for trading
   */
  isCriticalMethod(method) {
    const criticalMethods = [
      'getAccountInfo',
      'getTransaction',
      'getSignaturesForAddress',
      'sendTransaction'
    ];
    
    return criticalMethods.includes(method);
  }
  
  /**
   * Track strategy performance for optimization
   */
  trackStrategyPerformance(strategy, success, latency) {
    if (this.monitor) {
      this.monitor.recordMetric(`rpc_strategy_${strategy}_calls`, 1);
      
      if (success) {
        this.monitor.recordMetric(`rpc_strategy_${strategy}_success`, 1);
        this.monitor.recordLatency(`rpc_strategy_${strategy}`, latency, true);
      } else {
        this.monitor.recordMetric(`rpc_strategy_${strategy}_failure`, 1);
      }
    }
    
    // Log strategy performance periodically
    const totalCalls = Object.values(this.strategyUsage).reduce((a, b) => a + b, 0);
    if (totalCalls % 100 === 0) {
      this.logStrategyPerformance();
    }
  }
  
  /**
   * Log strategy usage statistics
   */
  logStrategyPerformance() {
    const total = Object.values(this.strategyUsage).reduce((a, b) => a + b, 0);
    
    console.log('RPC Strategy Usage:');
    Object.entries(this.strategyUsage).forEach(([strategy, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      console.log(`  ${strategy}: ${count} calls (${percentage}%)`);
    });
  }
  
  /**
   * Get enhanced statistics including parallel strategies
   */
  getStats() {
    const baseStats = super.getStats();
    
    return {
      ...baseStats,
      strategies: {
        usage: this.strategyUsage,
        parallel: this.parallelExecutor.getStats(),
        dual: this.dualStrategy.getStats()
      }
    };
  }
  
  /**
   * Batch RPC calls with parallel execution
   */
  async batchCall(calls, options = {}) {
    const strategy = options.strategy || 'dual';
    const batchSize = options.batchSize || 10;
    
    // Split into batches
    const batches = [];
    for (let i = 0; i < calls.length; i += batchSize) {
      batches.push(calls.slice(i, i + batchSize));
    }
    
    // Execute batches in parallel
    const batchPromises = batches.map(batch => 
      Promise.all(
        batch.map(call => 
          this.call(call.method, call.params, { ...options, strategy })
            .then(result => ({ success: true, result }))
            .catch(error => ({ success: false, error: error.message }))
        )
      )
    );
    
    const results = await Promise.all(batchPromises);
    return results.flat();
  }
  
  /**
   * Optimized token validation using parallel strategies
   */
  async validateTokensFast(tokenMints) {
    const calls = tokenMints.map(mint => ({
      method: 'getAccountInfo',
      params: [mint, { encoding: 'base64', commitment: 'confirmed' }]
    }));
    
    const results = await this.batchCall(calls, {
      strategy: 'race',
      batchSize: 20,
      timeout: 50
    });
    
    return results.map((result, index) => ({
      mint: tokenMints[index],
      valid: result.success && result.result?.value?.owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      error: result.error
    }));
  }
  
  /**
   * High-reliability transaction fetching
   */
  async getTransactionReliable(signature, options = {}) {
    return this.call('getTransaction', [signature, {
      encoding: 'jsonParsed',
      commitment: 'confirmed',
      ...options
    }], {
      strategy: 'consensus',
      minConsensus: 2,
      timeout: 300
    });
  }
  
  /**
   * Fast signature polling for meme detection
   */
  async getSignaturesFast(programId, limit = 100) {
    return this.call('getSignaturesForAddress', [programId, {
      limit,
      commitment: 'confirmed'
    }], {
      strategy: 'race',
      timeout: 75
    });
  }
}