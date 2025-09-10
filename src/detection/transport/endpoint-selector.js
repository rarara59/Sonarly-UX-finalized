/**
 * Endpoint Selector for Load Balancing
 * Extracted from rpc-connection-pool.js for standalone use
 * Provides endpoint selection with health tracking and round-robin distribution
 */

import { EventEmitter } from 'events';

// Default endpoint configurations
const DEFAULT_ENDPOINT_CONFIGS = {
  helius: {
    pattern: /helius/i,
    weight: 60,
    maxConcurrent: 150,
    timeout: 3500,
    priority: 1,
    healthCheckInterval: 30000
  },
  chainstack: {
    pattern: /chainstack|p2pify/i,
    weight: 30,
    maxConcurrent: 30,
    timeout: 3000,
    priority: 0,
    healthCheckInterval: 30000
  },
  public: {
    pattern: /mainnet-beta/i,
    weight: 10,
    maxConcurrent: 10,
    timeout: 5000,
    priority: 2,
    healthCheckInterval: 30000
  },
  default: {
    weight: 10,
    maxConcurrent: 20,
    timeout: 3000,
    priority: 1,
    healthCheckInterval: 30000
  }
};

export class EndpointSelector extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration with environment variable support
    this.healthCheckInterval = config.healthCheckInterval || 
                               parseInt(process.env.HEALTH_CHECK_INTERVAL_MS) || 
                               parseInt(process.env.RPC_HEALTH_INTERVAL_MS) || 
                               30000; // 30 seconds
    
    this.failoverThreshold = config.failoverThreshold || 
                             parseInt(process.env.FAILOVER_THRESHOLD) || 
                             3; // Failures before marking unhealthy
    
    this.recoveryCheckInterval = config.recoveryCheckInterval || 
                                 parseInt(process.env.RECOVERY_CHECK_INTERVAL_MS) || 
                                 10000; // 10 seconds
    
    this.selectionStrategy = config.selectionStrategy || 
                             process.env.SELECTION_STRATEGY || 
                             'weighted-round-robin'; // or 'round-robin', 'random', 'weighted-score'
    
    // Initialize endpoints
    this.endpoints = [];
    this.roundRobinIndex = 0;
    this.selectionCount = 0;
    
    // Metrics tracking
    this.metrics = {
      totalSelections: 0,
      endpointSelections: {}
,
      failovers: 0,
      recoveries: 0,
      avgSelectionLatency: 0,
      lastSelectionLatency: 0,
      healthChecks: 0
    };
    
    // Health check state
    this.healthCheckTimer = null;
    this.recoveryCheckTimer = null;
    
    // Initialize with provided endpoints
    if (config.endpoints && config.endpoints.length > 0) {
      this.initializeEndpoints(config.endpoints);
    }
  }
  
  /**
   * Initialize the EndpointSelector (compatibility method)
   */
  async initialize() {
    // Component is already initialized in constructor
    return true;
  }
  
  /**
   * Initialize endpoints with configuration
   */
  initializeEndpoints(endpointUrls) {
    this.endpoints = endpointUrls.map((url, index) => {
      // Determine endpoint type from URL
      let config = DEFAULT_ENDPOINT_CONFIGS.default;
      
      for (const [type, typeConfig] of Object.entries(DEFAULT_ENDPOINT_CONFIGS)) {
        if (type !== 'default' && typeConfig.pattern && typeConfig.pattern.test(url)) {
          config = { ...DEFAULT_ENDPOINT_CONFIGS.default, ...typeConfig };
          break;
        }
      }
      
      const endpoint = {
        url,
        index,
        config,
        health: {
          healthy: true,
          lastCheck: 0,
          latency: 0,
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          lastFailureTime: 0,
          checkInProgress: false
        },
        stats: {
          selections: 0,
          successes: 0,
          failures: 0,
          totalLatency: 0,
          avgLatency: 0,
          lastUsed: 0
        },
        state: 'active', // 'active', 'unhealthy', 'recovering'
        enabled: true
      };
      
      // Initialize selection metrics for this endpoint
      this.metrics.endpointSelections[index] = 0;
      
      return endpoint;
    });
    
    // Sort by priority
    this.endpoints.sort((a, b) => a.config.priority - b.config.priority);
    
    // Start health checking
    this.startHealthChecking();
    
    this.emit('endpoints-initialized', {
      count: this.endpoints.length,
      endpoints: this.endpoints.map(e => e.url)
    });
  }
  
  /**
   * Select the best endpoint based on strategy
   */
  selectEndpoint(options = {}) {
    const startTime = process.hrtime.bigint();
    
    // Filter available endpoints
    const available = this.getAvailableEndpoints(options);
    
    if (available.length === 0) {
      // No healthy endpoints, try to recover
      this.attemptRecovery();
      
      // Try again with relaxed criteria
      const anyEndpoint = this.endpoints.find(e => e.enabled);
      if (anyEndpoint) {
        this.updateSelectionMetrics(anyEndpoint, startTime);
        return anyEndpoint;
      }
    }
    
    return null;
  }
  
  /**
   * Select a backup endpoint (compatibility method)
   */
  selectBackupEndpoint(excludeEndpoint) {
    // Get available endpoints excluding the primary
    const available = this.getAvailableEndpoints().filter(
      ep => ep.url !== excludeEndpoint
    );
    
    if (available.length === 0) {
      return null;
    }
    
    // Use round-robin selection for backup
    return this.selectRoundRobin(available);
  }
  
  /**
   * Get available endpoints based on health and other criteria
   */
  getAvailableEndpoints(options = {}) {
    return this.endpoints.filter(endpoint => {
      // Skip disabled endpoints
      if (!endpoint.enabled) {
        return false;
      }
      
      // Skip unhealthy endpoints unless forced
      if (!options.includeUnhealthy && !endpoint.health.healthy) {
        // Check if recovery time has passed
        const timeSinceFailure = Date.now() - endpoint.health.lastFailureTime;
        if (timeSinceFailure > this.recoveryCheckInterval) {
          // Mark for recovery check
          endpoint.state = 'recovering';
          return true;
        }
        return false;
      }
      
      // Skip endpoints over capacity if specified
      if (options.checkCapacity && endpoint.stats.inFlight >= endpoint.config.maxConcurrent) {
        return false;
      }
      
      // Custom filter function
      if (options.filter && !options.filter(endpoint)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Round-robin selection
   */
  selectRoundRobin(endpoints) {
    const selected = endpoints[this.roundRobinIndex % endpoints.length];
    this.roundRobinIndex++;
    return selected;
  }
  
  /**
   * Random selection
   */
  selectRandom(endpoints) {
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }
  
  /**
   * Weighted round-robin selection
   */
  selectWeightedRoundRobin(endpoints) {
    // Build weighted array
    const weighted = [];
    
    for (const endpoint of endpoints) {
      const weight = endpoint.config.weight || 10;
      for (let i = 0; i < weight; i++) {
        weighted.push(endpoint);
      }
    }
    
    const selected = weighted[this.roundRobinIndex % weighted.length];
    this.roundRobinIndex++;
    return selected;
  }
  
  /**
   * Score-based selection
   */
  selectByScore(endpoints) {
    let bestEndpoint = null;
    let bestScore = -1;
    
    for (const endpoint of endpoints) {
      const score = this.calculateEndpointScore(endpoint);
      
      if (score > bestScore) {
        bestScore = score;
        bestEndpoint = endpoint;
      }
    }
    
    return bestEndpoint;
  }
  
  /**
   * Calculate endpoint score for intelligent selection
   */
  calculateEndpointScore(endpoint) {
    // Factor 1: Health status (healthy = better)
    const healthScore = endpoint.health.healthy ? 100 : 
                       endpoint.state === 'recovering' ? 50 : 0;
    
    // Factor 2: Latency performance (lower = better)
    const targetLatency = 30; // Target 30ms
    const actualLatency = endpoint.health.latency || targetLatency;
    const latencyScore = Math.max(0, Math.min(100, (targetLatency / actualLatency) * 100));
    
    // Factor 3: Success rate (higher = better)
    const totalCalls = endpoint.stats.selections || 1;
    const successRate = endpoint.stats.successes / totalCalls;
    const successScore = successRate * 100;
    
    // Factor 4: Recent usage (distribute load)
    const timeSinceUse = Date.now() - endpoint.stats.lastUsed;
    const usageScore = Math.min(100, timeSinceUse / 100); // Max score after 10 seconds
    
    // Factor 5: Priority weight
    const priorityScore = (3 - endpoint.config.priority) * 33.33; // 0=100, 1=66, 2=33
    
    // Weighted combination
    const compositeScore = (
      healthScore * 0.30 +     // 30% - Most important: health
      latencyScore * 0.25 +    // 25% - Critical: response speed
      successScore * 0.20 +    // 20% - Important: reliability
      usageScore * 0.15 +      // 15% - Load distribution
      priorityScore * 0.10     // 10% - Configuration preference
    );
    
    return compositeScore;
  }
  
  /**
   * Mark endpoint as failed
   */
  markEndpointFailed(endpoint, error) {
    endpoint.health.consecutiveFailures++;
    endpoint.health.consecutiveSuccesses = 0;
    endpoint.health.lastFailureTime = Date.now();
    endpoint.stats.failures++;
    
    // Check if should mark unhealthy
    if (endpoint.health.consecutiveFailures >= this.failoverThreshold) {
      endpoint.health.healthy = false;
      endpoint.state = 'unhealthy';
      this.metrics.failovers++;
      
      this.emit('endpoint-unhealthy', {
        endpoint: endpoint.url,
        index: endpoint.index,
        failures: endpoint.health.consecutiveFailures,
        error: error?.message
      });
    }
  }
  
  /**
   * Mark endpoint as successful
   */
  markEndpointSuccess(endpoint, latency) {
    endpoint.health.consecutiveSuccesses++;
    endpoint.health.consecutiveFailures = 0;
    endpoint.stats.successes++;
    
    // Update latency tracking
    if (latency) {
      endpoint.stats.totalLatency += latency;
      endpoint.stats.avgLatency = endpoint.stats.totalLatency / endpoint.stats.successes;
      endpoint.health.latency = latency;
    }
    
    // Check if should mark healthy (recovery)
    if (!endpoint.health.healthy && endpoint.health.consecutiveSuccesses >= 3) {
      endpoint.health.healthy = true;
      endpoint.state = 'active';
      this.metrics.recoveries++;
      
      this.emit('endpoint-recovered', {
        endpoint: endpoint.url,
        index: endpoint.index,
        successes: endpoint.health.consecutiveSuccesses
      });
    }
  }
  
  /**
   * Update selection metrics
   */
  updateSelectionMetrics(endpoint, startTime) {
    if (!endpoint) return;
    
    const endTime = process.hrtime.bigint();
    const latencyNs = Number(endTime - startTime);
    const latencyMs = latencyNs / 1000000;
    
    // Update endpoint stats
    endpoint.stats.selections++;
    endpoint.stats.lastUsed = Date.now();
    
    // Update global metrics
    this.metrics.totalSelections++;
    this.metrics.endpointSelections[endpoint.index]++;
    this.metrics.lastSelectionLatency = latencyMs;
    
    // Update average latency
    const count = this.metrics.totalSelections;
    this.metrics.avgSelectionLatency = 
      (this.metrics.avgSelectionLatency * (count - 1) + latencyMs) / count;
  }
  
  /**
   * Perform health check on an endpoint
   */
  async checkEndpointHealth(endpoint, healthCheckFn) {
    if (endpoint.health.checkInProgress) {
      return;
    }
    
    endpoint.health.checkInProgress = true;
    const startTime = Date.now();
    
    try {
      // Use provided health check function or default
      if (healthCheckFn) {
        await healthCheckFn(endpoint.url);
      } else {
        // Simple connectivity check
        await this.defaultHealthCheck(endpoint.url);
      }
      
      const latency = Date.now() - startTime;
      endpoint.health.healthy = true;
      endpoint.health.latency = latency;
      endpoint.health.lastCheck = Date.now();
      endpoint.health.consecutiveFailures = 0;
      
      if (endpoint.state === 'unhealthy') {
        endpoint.state = 'active';
        this.emit('endpoint-healthy', {
          endpoint: endpoint.url,
          index: endpoint.index,
          latency
        });
      }
      
    } catch (error) {
      endpoint.health.healthy = false;
      endpoint.health.lastCheck = Date.now();
      endpoint.health.consecutiveFailures++;
      
      if (endpoint.state === 'active') {
        endpoint.state = 'unhealthy';
        this.emit('endpoint-unhealthy', {
          endpoint: endpoint.url,
          index: endpoint.index,
          error: error.message
        });
      }
    } finally {
      endpoint.health.checkInProgress = false;
    }
    
    this.metrics.healthChecks++;
  }
  
  /**
   * Default health check implementation
   */
  async defaultHealthCheck(url) {
    // Simple promise that resolves after timeout
    // In real implementation, this would make an actual request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Health check failed'));
        }
      }, Math.random() * 100);
    });
  }
  
  /**
   * Start periodic health checking
   */
  startHealthChecking() {
    if (this.healthCheckTimer) {
      return;
    }
    
    this.healthCheckTimer = setInterval(async () => {
      for (const endpoint of this.endpoints) {
        if (endpoint.enabled) {
          await this.checkEndpointHealth(endpoint);
        }
      }
    }, this.healthCheckInterval);
    
    // Also start recovery checking
    this.recoveryCheckTimer = setInterval(() => {
      this.checkRecoveries();
    }, this.recoveryCheckInterval);
  }
  
  /**
   * Stop health checking
   */
  stopHealthChecking() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    if (this.recoveryCheckTimer) {
      clearInterval(this.recoveryCheckTimer);
      this.recoveryCheckTimer = null;
    }
  }
  
  /**
   * Check for endpoint recoveries
   */
  checkRecoveries() {
    for (const endpoint of this.endpoints) {
      if (!endpoint.health.healthy && endpoint.enabled) {
        const timeSinceFailure = Date.now() - endpoint.health.lastFailureTime;
        if (timeSinceFailure > this.recoveryCheckInterval) {
          endpoint.state = 'recovering';
          this.emit('endpoint-recovery-check', {
            endpoint: endpoint.url,
            index: endpoint.index,
            timeSinceFailure
          });
        }
      }
    }
  }
  
  /**
   * Attempt to recover failed endpoints
   */
  attemptRecovery() {
    for (const endpoint of this.endpoints) {
      if (!endpoint.health.healthy) {
        endpoint.health.consecutiveFailures = Math.max(0, endpoint.health.consecutiveFailures - 1);
        if (endpoint.health.consecutiveFailures < this.failoverThreshold) {
          endpoint.state = 'recovering';
        }
      }
    }
  }
  
  /**
   * Get distribution statistics
   */
  getDistributionStats() {
    const total = this.metrics.totalSelections || 1;
    const distribution = {};
    
    for (const [index, count] of Object.entries(this.metrics.endpointSelections)) {
      const endpoint = this.endpoints[index];
      if (endpoint) {
        distribution[endpoint.url] = {
          count,
          percentage: ((count / total) * 100).toFixed(2) + '%',
          health: endpoint.health.healthy ? 'healthy' : 'unhealthy',
          avgLatency: endpoint.stats.avgLatency.toFixed(2) + 'ms'
        };
      }
    }
    
    return distribution;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgSelectionLatencyMs: this.metrics.avgSelectionLatency.toFixed(3),
      distribution: this.getDistributionStats(),
      healthyEndpoints: this.endpoints.filter(e => e.health.healthy).length,
      totalEndpoints: this.endpoints.length
    };
  }
  
  /**
   * Enable/disable an endpoint
   */
  setEndpointEnabled(index, enabled) {
    if (this.endpoints[index]) {
      this.endpoints[index].enabled = enabled;
      this.emit('endpoint-state-changed', {
        endpoint: this.endpoints[index].url,
        index,
        enabled
      });
    }
  }
  
  /**
   * Reset endpoint statistics
   */
  resetEndpointStats(index) {
    if (this.endpoints[index]) {
      const endpoint = this.endpoints[index];
      endpoint.stats = {
        selections: 0,
        successes: 0,
        failures: 0,
        totalLatency: 0,
        avgLatency: 0,
        lastUsed: 0
      };
      endpoint.health.consecutiveFailures = 0;
      endpoint.health.consecutiveSuccesses = 0;
    }
  }
  
  /**
   * Health check for monitoring
   */
  async healthCheck() {
    const startTime = process.hrtime.bigint();
    
    try {
      const healthy = this.endpoints.filter(e => e.health.healthy).length > 0;
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;
      
      return {
        healthy,
        latency: latencyMs,
        endpoints: this.endpoints.map(e => ({
          url: e.url,
          healthy: e.health.healthy,
          state: e.state,
          latency: e.health.latency
        })),
        metrics: this.getMetrics()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.stopHealthChecking();
    this.removeAllListeners();
    this.endpoints = [];
  }
  
  /**
   * Static factory method for configuration from environment
   */
  static fromEnvironment(endpoints) {
    return new EndpointSelector({
      endpoints,
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS) || 30000,
      failoverThreshold: parseInt(process.env.FAILOVER_THRESHOLD) || 3,
      recoveryCheckInterval: parseInt(process.env.RECOVERY_CHECK_INTERVAL_MS) || 10000,
      selectionStrategy: process.env.SELECTION_STRATEGY || 'weighted-round-robin'
    });
  }
}

// Export for backward compatibility
export default EndpointSelector;