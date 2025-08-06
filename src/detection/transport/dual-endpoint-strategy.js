/**
 * Dual Endpoint Strategy for Parallel RPC Execution
 * Pairs fast endpoints with reliable backups for optimal performance
 * Target: Balance speed and reliability for meme coin detection
 */

export class DualEndpointStrategy {
  constructor(primaryEndpoints, secondaryEndpoints, monitor = null) {
    this.primary = primaryEndpoints;
    this.secondary = secondaryEndpoints;
    this.monitor = monitor;
    this.activePairs = this.createOptimalPairs();
    this.pairPerformance = new Map();
    
    // Initialize pair performance tracking
    this.activePairs.forEach((pair, index) => {
      this.pairPerformance.set(index, {
        calls: 0,
        successes: 0,
        avgLatency: 0,
        lastRotation: Date.now()
      });
    });
  }
  
  /**
   * Create optimal endpoint pairs based on characteristics
   */
  createOptimalPairs() {
    const pairs = [];
    
    // Sort by priority (lower is better)
    const sortedPrimary = [...this.primary].sort((a, b) => a.priority - b.priority);
    const sortedSecondary = [...this.secondary].sort((a, b) => a.priority - b.priority);
    
    // Pair fast with reliable
    for (let i = 0; i < Math.max(sortedPrimary.length, sortedSecondary.length); i++) {
      pairs.push({
        fast: sortedPrimary[i % sortedPrimary.length],
        reliable: sortedSecondary[i % sortedSecondary.length],
        index: i
      });
    }
    
    return pairs;
  }
  
  /**
   * Execute on dual endpoints with intelligent routing
   */
  async executeDual(method, params, options = {}) {
    const timeout = options.timeout || 100;
    const strategy = options.preferSpeed ? 'speed' : 'balanced';
    
    // Select best performing pair
    const selectedPair = this.selectBestPair(strategy);
    
    try {
      // Execute on both endpoints in the pair
      const result = await Promise.race([
        this.callEndpoint(selectedPair.fast, method, params, timeout * 0.8),
        this.callEndpoint(selectedPair.reliable, method, params, timeout)
      ]);
      
      // Update pair performance
      this.updatePairPerformance(selectedPair.index, true, result.latency);
      
      return result.result;
      
    } catch (error) {
      // Try next best pair on failure
      this.updatePairPerformance(selectedPair.index, false, timeout);
      
      const fallbackPair = this.selectFallbackPair(selectedPair.index);
      if (fallbackPair) {
        return this.executeFallback(fallbackPair, method, params, timeout);
      }
      
      throw error;
    }
  }
  
  /**
   * Execute on specific endpoint with timeout
   */
  async callEndpoint(endpoint, method, params, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const startTime = Date.now();
    
    try {
      const requestPayload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      };
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${endpoint.name}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error from ${endpoint.name}: ${data.error.message}`);
      }
      
      return {
        endpoint: endpoint.name,
        result: data.result,
        latency: Date.now() - startTime
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout on ${endpoint.name} after ${timeout}ms`);
      }
      
      throw error;
    }
  }
  
  /**
   * Select best performing pair based on strategy
   */
  selectBestPair(strategy) {
    let bestPair = this.activePairs[0];
    let bestScore = -Infinity;
    
    this.activePairs.forEach((pair) => {
      const perf = this.pairPerformance.get(pair.index);
      let score = 0;
      
      if (perf.calls > 0) {
        const successRate = perf.successes / perf.calls;
        
        if (strategy === 'speed') {
          // Prioritize low latency
          score = successRate * 1000 - perf.avgLatency;
        } else {
          // Balance reliability and speed
          score = successRate * 500 - perf.avgLatency * 0.5;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestPair = pair;
      }
    });
    
    return bestPair;
  }
  
  /**
   * Select fallback pair excluding failed one
   */
  selectFallbackPair(excludeIndex) {
    const availablePairs = this.activePairs.filter(p => p.index !== excludeIndex);
    
    if (availablePairs.length === 0) return null;
    
    // Return pair with best success rate
    return availablePairs.reduce((best, pair) => {
      const perfA = this.pairPerformance.get(best.index);
      const perfB = this.pairPerformance.get(pair.index);
      
      const rateA = perfA.calls > 0 ? perfA.successes / perfA.calls : 0;
      const rateB = perfB.calls > 0 ? perfB.successes / perfB.calls : 0;
      
      return rateB > rateA ? pair : best;
    });
  }
  
  /**
   * Execute fallback with single endpoint from pair
   */
  async executeFallback(pair, method, params, timeout) {
    try {
      // Try reliable endpoint first in fallback
      const result = await this.callEndpoint(pair.reliable, method, params, timeout);
      this.updatePairPerformance(pair.index, true, result.latency);
      return result.result;
    } catch (error) {
      // Last resort: try fast endpoint
      const result = await this.callEndpoint(pair.fast, method, params, timeout);
      this.updatePairPerformance(pair.index, true, result.latency);
      return result.result;
    }
  }
  
  /**
   * Update pair performance metrics
   */
  updatePairPerformance(pairIndex, success, latency) {
    const perf = this.pairPerformance.get(pairIndex);
    if (!perf) return;
    
    perf.calls++;
    if (success) {
      perf.successes++;
    }
    
    // Update average latency
    if (success && latency) {
      perf.avgLatency = perf.avgLatency === 0 
        ? latency 
        : (perf.avgLatency * 0.9 + latency * 0.1);
    }
    
    // Consider rotation after significant calls
    if (perf.calls % 100 === 0) {
      this.considerPairRotation(pairIndex);
    }
    
    // Log performance to monitor
    if (this.monitor && perf.calls % 10 === 0) {
      this.monitor.recordMetric(`dual_pair_${pairIndex}_success_rate`, 
        perf.successes / perf.calls);
      this.monitor.recordMetric(`dual_pair_${pairIndex}_avg_latency`, 
        perf.avgLatency);
    }
  }
  
  /**
   * Consider rotating underperforming pairs
   */
  considerPairRotation(pairIndex) {
    const perf = this.pairPerformance.get(pairIndex);
    const successRate = perf.successes / perf.calls;
    
    // Rotate if performance is poor and enough time has passed
    if (successRate < 0.8 && Date.now() - perf.lastRotation > 300000) { // 5 minutes
      this.rotatePair(pairIndex);
      perf.lastRotation = Date.now();
    }
  }
  
  /**
   * Rotate endpoints within a pair
   */
  rotatePair(pairIndex) {
    const pair = this.activePairs[pairIndex];
    
    // Swap fast and reliable
    const temp = pair.fast;
    pair.fast = pair.reliable;
    pair.reliable = temp;
    
    console.log(`Rotated pair ${pairIndex}: ${pair.fast.name} <-> ${pair.reliable.name}`);
  }
  
  /**
   * Get strategy statistics
   */
  getStats() {
    const stats = {
      pairs: [],
      overall: {
        totalCalls: 0,
        totalSuccesses: 0,
        avgLatency: 0
      }
    };
    
    this.activePairs.forEach((pair) => {
      const perf = this.pairPerformance.get(pair.index);
      const pairStats = {
        index: pair.index,
        fast: pair.fast.name,
        reliable: pair.reliable.name,
        ...perf,
        successRate: perf.calls > 0 ? perf.successes / perf.calls : 0
      };
      
      stats.pairs.push(pairStats);
      stats.overall.totalCalls += perf.calls;
      stats.overall.totalSuccesses += perf.successes;
    });
    
    if (stats.overall.totalCalls > 0) {
      stats.overall.successRate = stats.overall.totalSuccesses / stats.overall.totalCalls;
      stats.overall.avgLatency = stats.pairs.reduce((sum, p) => 
        sum + (p.avgLatency * p.calls), 0) / stats.overall.totalCalls;
    }
    
    return stats;
  }
}