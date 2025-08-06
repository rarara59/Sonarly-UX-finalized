/**
 * Parallel RPC Executor for Renaissance Trading System
 * Execute RPC calls on multiple endpoints simultaneously
 * Target: <30ms average response, 99.99% availability
 */

export class ParallelRpcExecutor {
  constructor(endpoints, performanceMonitor = null) {
    // Handle both Map and object formats
    if (endpoints instanceof Map) {
      this.endpoints = endpoints;
    } else {
      this.endpoints = new Map(Object.entries(endpoints));
    }
    
    this.monitor = performanceMonitor;
    this.performanceStats = new Map();
    
    // Initialize performance tracking
    this.endpoints.forEach((endpoint, name) => {
      this.performanceStats.set(name, {
        calls: 0,
        successes: 0,
        totalLatency: 0,
        avgLatency: 0,
        lastSuccess: Date.now()
      });
    });
  }
  
  /**
   * Execute RPC call with timeout wrapper
   */
  async executeWithTimeout(endpoint, method, params, timeout) {
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message} (${data.error.code})`);
      }
      
      // Update performance stats
      this.updateStats(endpoint.name, true, Date.now() - startTime);
      
      return {
        endpoint: endpoint.name,
        result: data.result,
        latency: Date.now() - startTime
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      this.updateStats(endpoint.name, false, Date.now() - startTime);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout after ${timeout}ms on ${endpoint.name}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Race multiple endpoints for fastest response
   */
  async raceCall(method, params, options = {}) {
    const timeout = options.timeout || 100;
    const healthyEndpoints = this.getHealthyEndpoints();
    
    if (healthyEndpoints.length === 0) {
      throw new Error('No healthy endpoints available');
    }
    
    const promises = healthyEndpoints.map(endpoint => 
      this.executeWithTimeout(endpoint, method, params, timeout)
        .catch(error => {
          // Log but don't throw - let other endpoints race
          if (this.monitor) {
            this.monitor.recordMetric(`rpc_race_failure_${endpoint.name}`, 1);
          }
          return null;
        })
    );
    
    // Race for first successful response
    const result = await Promise.race(promises.filter(p => p !== null));
    
    if (!result) {
      throw new Error('All endpoints failed in race');
    }
    
    // Log winner for performance tracking
    if (this.monitor) {
      this.monitor.recordMetric(`rpc_race_winner_${result.endpoint}`, 1);
      this.monitor.recordLatency('rpc_race', result.latency, true);
    }
    
    return result.result;
  }
  
  /**
   * Get consensus from multiple endpoints
   */
  async consensusCall(method, params, options = {}) {
    const timeout = options.timeout || 200;
    const minConsensus = options.minConsensus || 2;
    const healthyEndpoints = this.getHealthyEndpoints();
    
    if (healthyEndpoints.length < minConsensus) {
      throw new Error(`Not enough healthy endpoints for consensus (need ${minConsensus}, have ${healthyEndpoints.length})`);
    }
    
    const promises = healthyEndpoints.map(endpoint =>
      this.executeWithTimeout(endpoint, method, params, timeout)
        .catch(error => ({ endpoint: endpoint.name, error: error.message }))
    );
    
    const results = await Promise.allSettled(promises);
    
    // Collect successful responses
    const successfulResults = results
      .filter(r => r.status === 'fulfilled' && r.value && !r.value.error)
      .map(r => r.value);
    
    if (successfulResults.length < minConsensus) {
      throw new Error(`Insufficient consensus: ${successfulResults.length}/${minConsensus} required`);
    }
    
    // Return most common result (simple consensus)
    return this.selectConsensusResult(successfulResults);
  }
  
  /**
   * Select best result from consensus
   */
  selectConsensusResult(results) {
    // Group by result content
    const resultGroups = new Map();
    
    results.forEach(r => {
      const key = JSON.stringify(r.result);
      if (!resultGroups.has(key)) {
        resultGroups.set(key, []);
      }
      resultGroups.get(key).push(r);
    });
    
    // Find largest consensus group
    let maxGroup = [];
    let maxGroupResult = null;
    
    for (const [key, group] of resultGroups) {
      if (group.length > maxGroup.length) {
        maxGroup = group;
        maxGroupResult = JSON.parse(key);
      }
    }
    
    // Log consensus metrics
    if (this.monitor) {
      this.monitor.recordMetric('rpc_consensus_size', maxGroup.length);
      this.monitor.recordMetric('rpc_consensus_total', results.length);
    }
    
    return maxGroupResult;
  }
  
  /**
   * Get healthy endpoints based on recent performance
   */
  getHealthyEndpoints() {
    const now = Date.now();
    const healthThreshold = 30000; // 30 seconds
    
    return Array.from(this.endpoints.values()).filter(endpoint => {
      const stats = this.performanceStats.get(endpoint.name);
      
      // Consider healthy if successful recently or no calls yet
      return !stats || 
             stats.calls === 0 || 
             (now - stats.lastSuccess) < healthThreshold ||
             (stats.successes / stats.calls) > 0.5;
    });
  }
  
  /**
   * Update endpoint performance statistics
   */
  updateStats(endpointName, success, latency) {
    const stats = this.performanceStats.get(endpointName);
    if (!stats) return;
    
    stats.calls++;
    if (success) {
      stats.successes++;
      stats.lastSuccess = Date.now();
    }
    
    stats.totalLatency += latency;
    stats.avgLatency = stats.totalLatency / stats.calls;
    
    // Reset stats periodically to adapt to changing conditions
    if (stats.calls >= 1000) {
      stats.calls = Math.floor(stats.calls / 2);
      stats.successes = Math.floor(stats.successes / 2);
      stats.totalLatency = stats.avgLatency * stats.calls;
    }
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    const stats = {};
    
    this.performanceStats.forEach((data, endpoint) => {
      stats[endpoint] = {
        ...data,
        successRate: data.calls > 0 ? data.successes / data.calls : 0,
        health: this.getEndpointHealth(endpoint)
      };
    });
    
    return stats;
  }
  
  /**
   * Determine endpoint health status
   */
  getEndpointHealth(endpointName) {
    const stats = this.performanceStats.get(endpointName);
    if (!stats || stats.calls === 0) return 'unknown';
    
    const successRate = stats.successes / stats.calls;
    const recentSuccess = (Date.now() - stats.lastSuccess) < 60000;
    
    if (successRate > 0.95 && recentSuccess) return 'excellent';
    if (successRate > 0.8 && recentSuccess) return 'good';
    if (successRate > 0.6) return 'degraded';
    return 'poor';
  }
}