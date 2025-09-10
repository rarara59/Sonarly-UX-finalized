/**
 * RPC Connection Pool V2 - High Performance Trading System
 * Architectural improvements for >99.9% reliability during viral meme events
 * Target: <30ms P95 latency, 1000+ TPS bursts
 */

import https from 'https';
import http from 'http';
import dns from 'dns';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';

dotenv.config();

// Configure DNS caching for faster resolution
dns.setDefaultResultOrder('ipv4first');

// Per-endpoint configuration with individual rate limits
const ENDPOINT_CONFIGS = {
  helius: {
    pattern: /helius/i,
    rpsLimit: 45,
    weight: 60,
    maxConcurrent: 100,
    timeout: 2000,
    priority: 1
  },
  chainstack: {
    pattern: /chainstack|p2pify/i,
    rpsLimit: 35,
    weight: 30,
    maxConcurrent: 80,
    timeout: 1500,
    priority: 0  // Highest priority due to best latency
  },
  public: {
    pattern: /mainnet-beta/i,
    rpsLimit: 8,
    weight: 10,
    maxConcurrent: 20,
    timeout: 3000,
    priority: 2
  }
};

class RpcConnectionPoolV2 extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize endpoints with per-endpoint configuration
    this.endpoints = this.initializeEndpoints(config.endpoints || [
      process.env.CHAINSTACK_RPC_URL,
      process.env.HELIUS_RPC_URL,
      process.env.PUBLIC_RPC_URL
    ].filter(Boolean));
    
    if (this.endpoints.length === 0) {
      throw new Error('No RPC endpoints configured');
    }
    
    // Global configuration
    this.config = {
      maxGlobalInFlight: config.maxGlobalInFlight || parseInt(process.env.RPC_MAX_IN_FLIGHT_GLOBAL) || 200,
      queueMaxSize: config.queueMaxSize || parseInt(process.env.RPC_QUEUE_MAX_SIZE) || 1000,
      queueDeadline: config.queueDeadline || parseInt(process.env.RPC_QUEUE_DEADLINE_MS) || 5000,
      breakerEnabled: config.breakerEnabled !== false && process.env.RPC_BREAKER_ENABLED !== 'false',
      healthInterval: config.healthInterval || parseInt(process.env.RPC_HEALTH_INTERVAL_MS) || 30000,
      keepAliveEnabled: config.keepAliveEnabled !== false && process.env.RPC_KEEP_ALIVE_ENABLED !== 'false',
      ...config
    };
    
    // Request tracking
    this.requestId = 0;
    this.globalInFlight = 0;
    this.isDestroyed = false;
    
    // Request queue with backpressure
    this.requestQueue = [];
    this.queueTimer = null;
    
    // Statistics
    this.stats = {
      calls: 0,
      successes: 0,
      failures: 0,
      queued: 0,
      dropped: 0,
      latencies: []
    };
    
    // Optional monitor for telemetry (validate if provided)
    this.monitor = config.monitor || null;
    if (this.monitor) {
      this.validateMonitor(this.monitor);
    }
    
    // Initialize HTTP agents for connection pooling
    this.initializeAgents();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start queue processor
    this.startQueueProcessor();
    
    // Warm up connections
    this.warmupConnections();
  }
  
  validateMonitor(monitor) {
    // Type safety for telemetry methods to prevent runtime errors
    const requiredMethods = ['recordLatency', 'recordError', 'recordSuccess'];
    const optionalMethods = ['check', 'getStats', 'reset'];
    
    for (const method of requiredMethods) {
      if (typeof monitor[method] !== 'function') {
        throw new Error(`Invalid monitor - ${method} method required and must be a function`);
      }
    }
    
    // Validate optional methods if they exist
    for (const method of optionalMethods) {
      if (monitor[method] !== undefined && typeof monitor[method] !== 'function') {
        throw new Error(`Invalid monitor - ${method} must be a function if provided`);
      }
    }
    
    // Additional validation for health monitor pattern
    if (monitor.check && typeof monitor.check === 'function') {
      // Validate that check returns a promise or boolean
      const checkResult = monitor.check();
      if (checkResult && typeof checkResult.then !== 'function' && typeof checkResult !== 'boolean') {
        throw new Error('Invalid monitor - check method must return a Promise or boolean');
      }
    }
    
    return true;
  }
  
  initializeEndpoints(urls) {
    return urls.map((url, index) => {
      // Determine endpoint type and config
      let endpointConfig = ENDPOINT_CONFIGS.public;
      for (const [key, config] of Object.entries(ENDPOINT_CONFIGS)) {
        if (config.pattern.test(url)) {
          endpointConfig = config;
          break;
        }
      }
      
      return {
        url,
        index,
        config: endpointConfig,
        // Per-endpoint rate limiting
        rateLimit: {
          tokens: endpointConfig.rpsLimit,
          refillRate: endpointConfig.rpsLimit,
          lastRefill: Date.now(),
          window: 1000
        },
        // Per-endpoint statistics
        stats: {
          calls: 0,
          successes: 0,
          failures: 0,
          inFlight: 0,
          totalLatency: 0,
          latencies: []
        },
        // Circuit breaker with intelligent thresholds
        breaker: {
          state: 'CLOSED',
          failures: 0,
          consecutiveSuccesses: 0,
          lastFailure: 0,
          errorCounts: new Map(), // Track error types
          halfOpenTests: 0
        },
        // Health status
        health: {
          healthy: true,
          lastCheck: 0,
          latency: 0
        }
      };
    }).sort((a, b) => a.config.priority - b.config.priority);
  }
  
  initializeAgents() {
    this.agents = new Map();
    
    if (!this.config.keepAliveEnabled) return;
    
    this.endpoints.forEach((endpoint) => {
      const url = new URL(endpoint.url);
      const AgentClass = url.protocol === 'https:' ? https.Agent : http.Agent;
      
      // Optimized agent configuration for high concurrency
      this.agents.set(endpoint.index, new AgentClass({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: endpoint.config.maxConcurrent,
        maxFreeSockets: Math.floor(endpoint.config.maxConcurrent / 2),
        timeout: endpoint.config.timeout,
        scheduling: 'lifo', // Last-in-first-out for better connection reuse
        // Disable Nagle's algorithm for lower latency
        noDelay: true
      }));
    });
  }
  
  /**
   * Main RPC call method with queuing and intelligent routing
   */
  async call(method, params = [], options = {}) {
    if (this.isDestroyed) {
      throw new Error('RPC pool has been destroyed');
    }
    
    // Handle requestId overflow
    if (this.requestId >= Number.MAX_SAFE_INTEGER) {
      this.requestId = 0;
    }
    const requestId = ++this.requestId;
    const request = {
      id: requestId,
      method,
      params,
      options,
      timestamp: Date.now(),
      attempts: 0,
      deferred: this.createDeferred()
    };
    
    // Check global in-flight limit
    if (this.globalInFlight >= this.config.maxGlobalInFlight) {
      // Queue request with backpressure
      if (this.requestQueue.length >= this.config.queueMaxSize) {
        this.stats.dropped++;
        request.deferred.reject(new Error('Request queue full'));
        return request.deferred.promise;
      }
      
      this.requestQueue.push(request);
      this.stats.queued++;
      return request.deferred.promise;
    }
    
    // Execute immediately
    this.executeRequest(request);
    return request.deferred.promise;
  }
  
  async executeRequest(request) {
    const startTime = Date.now();
    this.globalInFlight++;
    request.attempts++;
    
    try {
      // Select best endpoint using intelligent load balancing
      const endpoint = this.selectEndpoint(request);
      
      if (!endpoint) {
        throw new Error('No available endpoints');
      }
      
      // Check per-endpoint rate limit
      if (!this.checkRateLimit(endpoint)) {
        // Re-queue if rate limited
        this.globalInFlight--;
        
        if (Date.now() - request.timestamp < this.config.queueDeadline) {
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.requestQueue.unshift(request);
            }
          }, 50);
          return;
        }
        
        throw new Error('Rate limit exceeded');
      }
      
      // Execute RPC call
      endpoint.stats.inFlight++;
      
      const result = await this.executeRpcCall(endpoint, request);
      
      // Update statistics
      const latency = Date.now() - startTime;
      this.updateStats(endpoint, true, latency);
      
      // Record telemetry if monitor is configured
      if (this.monitor && typeof this.monitor.recordLatency === 'function') {
        this.monitor.recordLatency(request.method, latency, endpoint.url);
      }
      if (this.monitor && typeof this.monitor.recordSuccess === 'function') {
        this.monitor.recordSuccess(request.method, endpoint.url);
      }
      
      // Reset circuit breaker on success
      if (endpoint.breaker.state !== 'CLOSED') {
        endpoint.breaker.consecutiveSuccesses++;
        if (endpoint.breaker.consecutiveSuccesses >= 3) {
          endpoint.breaker.state = 'CLOSED';
          endpoint.breaker.failures = 0;
          endpoint.breaker.consecutiveSuccesses = 0;
          this.emit('breaker-closed', endpoint.index);
        }
      }
      
      request.deferred.resolve(result);
      
    } catch (error) {
      // Record error telemetry if monitor is configured
      if (this.monitor && typeof this.monitor.recordError === 'function') {
        this.monitor.recordError(request.method, error, endpoint ? endpoint.url : 'unknown');
      }
      
      // Handle failure with intelligent retry
      const shouldRetry = this.handleFailure(request, error);
      
      if (shouldRetry && request.attempts < 3) {
        // Retry with exponential backoff
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.executeRequest(request);
          }
        }, Math.min(100 * Math.pow(2, request.attempts), 1000));
        return;
      }
      
      request.deferred.reject(error);
      
    } finally {
      this.globalInFlight--;
      
      // Process queued requests
      this.processQueue();
    }
  }
  
  selectEndpoint(request) {
    // Filter available endpoints
    const available = this.endpoints.filter(ep => {
      // Skip if circuit breaker is open
      if (ep.breaker.state === 'OPEN') {
        // Check if cooldown period has passed
        if (Date.now() - ep.breaker.lastFailure > 30000) {
          ep.breaker.state = 'HALF_OPEN';
          ep.breaker.halfOpenTests = 0;
        } else {
          return false;
        }
      }
      
      // Limit half-open tests
      if (ep.breaker.state === 'HALF_OPEN' && ep.breaker.halfOpenTests >= 2) {
        return false;
      }
      
      // Check endpoint health (skip if never checked)
      if (ep.health.lastCheck > 0 && !ep.health.healthy) {
        return false;
      }
      
      return true;
    });
    
    if (available.length === 0) {
      return null;
    }
    
    // Prefer endpoints by priority first, then by score
    // Sort by priority (lower is better)
    available.sort((a, b) => a.config.priority - b.config.priority);
    
    // Use the highest priority endpoint if it has capacity
    const primaryEndpoint = available[0];
    if (primaryEndpoint && 
        primaryEndpoint.stats.inFlight < primaryEndpoint.config.maxConcurrent * 0.8) {
      return primaryEndpoint;
    }
    
    // Otherwise, weighted selection based on capacity and performance
    let best = null;
    let bestScore = -1;
    
    for (const endpoint of available) {
      // Calculate score based on multiple factors
      const loadFactor = 1 - (endpoint.stats.inFlight / endpoint.config.maxConcurrent);
      const latencyFactor = endpoint.health.latency > 0 ? 30 / endpoint.health.latency : 1;
      const successRate = endpoint.stats.calls > 0 
        ? endpoint.stats.successes / endpoint.stats.calls 
        : 0.5;
      
      // Give priority bonus
      const priorityBonus = (2 - endpoint.config.priority) * 20;
      
      const score = (
        priorityBonus +
        endpoint.config.weight * 0.3 +
        loadFactor * 100 * 0.3 +
        latencyFactor * 100 * 0.2 +
        successRate * 100 * 0.2
      );
      
      if (score > bestScore) {
        bestScore = score;
        best = endpoint;
      }
    }
    
    return best;
  }
  
  checkRateLimit(endpoint) {
    const now = Date.now();
    const elapsed = now - endpoint.rateLimit.lastRefill;
    
    // Refill tokens
    if (elapsed >= endpoint.rateLimit.window) {
      endpoint.rateLimit.tokens = endpoint.rateLimit.refillRate;
      endpoint.rateLimit.lastRefill = now;
    } else {
      // Partial refill
      const refill = (elapsed / endpoint.rateLimit.window) * endpoint.rateLimit.refillRate;
      endpoint.rateLimit.tokens = Math.min(
        endpoint.rateLimit.refillRate,
        endpoint.rateLimit.tokens + refill
      );
      endpoint.rateLimit.lastRefill = now;
    }
    
    // Check if token available
    if (endpoint.rateLimit.tokens >= 1) {
      endpoint.rateLimit.tokens--;
      return true;
    }
    
    return false;
  }
  
  async executeRpcCall(endpoint, request) {
    const url = new URL(endpoint.url);
    const agent = this.agents.get(endpoint.index);
    
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      },
      agent,
      timeout: request.options.timeout || endpoint.config.timeout
    };
    
    return new Promise((resolve, reject) => {
      const proto = url.protocol === 'https:' ? https : http;
      
      const req = proto.request(options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.error) {
              reject(new Error(response.error.message || 'RPC error'));
            } else {
              resolve(response.result);
            }
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${options.timeout}ms`));
      });
      
      // Send request
      req.write(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        method: request.method,
        params: request.params
      }));
      
      req.end();
    });
  }
  
  handleFailure(request, error) {
    // Find the endpoint that failed (if any)
    const endpoint = this.endpoints.find(ep => ep.stats.inFlight > 0);
    
    if (endpoint) {
      endpoint.stats.inFlight--;
      endpoint.stats.failures++;
      
      // Track error types
      const errorType = this.classifyError(error);
      endpoint.breaker.errorCounts.set(
        errorType,
        (endpoint.breaker.errorCounts.get(errorType) || 0) + 1
      );
      
      // Intelligent circuit breaker logic
      if (this.config.breakerEnabled) {
        // Don't open circuit for rate limiting or timeout errors during high load
        if (errorType === 'rate_limit' || 
            (errorType === 'timeout' && this.globalInFlight > this.config.maxGlobalInFlight * 0.8)) {
          return true; // Retry
        }
        
        endpoint.breaker.failures++;
        endpoint.breaker.lastFailure = Date.now();
        endpoint.breaker.consecutiveSuccesses = 0;
        
        // Open circuit if too many failures
        if (endpoint.breaker.failures >= 5) {
          endpoint.breaker.state = 'OPEN';
          this.emit('breaker-open', endpoint.index);
        }
      }
    }
    
    // Determine if request should be retried
    const errorType = this.classifyError(error);
    return errorType === 'timeout' || errorType === 'network' || errorType === 'rate_limit';
  }
  
  classifyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('rate') || message.includes('429')) return 'rate_limit';
    if (message.includes('econnrefused') || message.includes('enotfound')) return 'network';
    if (message.includes('503') || message.includes('502')) return 'server';
    
    return 'unknown';
  }
  
  updateStats(endpoint, success, latency) {
    // Update endpoint stats
    endpoint.stats.calls++;
    endpoint.stats.inFlight--;
    
    if (success) {
      endpoint.stats.successes++;
      endpoint.stats.totalLatency += latency;
      endpoint.stats.latencies.push(latency);
      
      // Keep only last 100 latencies
      if (endpoint.stats.latencies.length > 100) {
        endpoint.stats.latencies.shift();
      }
      
      // Update health
      endpoint.health.latency = latency;
      
      // Emit warning for high latency
      if (latency > 30) {
        this.emit('high-latency', {
          endpoint: endpoint.index,
          latency
        });
      }
    } else {
      endpoint.stats.failures++;
    }
    
    // Update global stats
    this.stats.calls++;
    if (success) {
      this.stats.successes++;
      this.stats.latencies.push(latency);
      if (this.stats.latencies.length > 1000) {
        this.stats.latencies.shift();
      }
    } else {
      this.stats.failures++;
    }
  }
  
  processQueue() {
    while (this.requestQueue.length > 0 && this.globalInFlight < this.config.maxGlobalInFlight) {
      const request = this.requestQueue.shift();
      
      // Check if request has expired
      if (Date.now() - request.timestamp > this.config.queueDeadline) {
        this.stats.dropped++;
        request.deferred.reject(new Error('Request expired in queue'));
        continue;
      }
      
      this.executeRequest(request);
    }
  }
  
  startQueueProcessor() {
    // Process queue every 10ms to ensure low latency
    this.queueTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.processQueue();
      }
    }, 10);
  }
  
  async warmupConnections() {
    // Warm up each endpoint with a simple call (non-blocking)
    for (const endpoint of this.endpoints) {
      this.executeRpcCall(endpoint, {
        id: -1,
        method: 'getSlot',
        params: [],
        options: { timeout: 500 }
      }).catch(() => {
        // Ignore warmup errors
      });
    }
  }
  
  startHealthMonitoring() {
    this.healthTimer = setInterval(async () => {
      if (this.isDestroyed) return;
      
      for (const endpoint of this.endpoints) {
        try {
          const start = Date.now();
          await this.executeRpcCall(endpoint, {
            id: -1,
            method: 'getSlot',
            params: [],
            options: { timeout: 1000 }
          });
          
          const latency = Date.now() - start;
          endpoint.health.healthy = true;
          endpoint.health.lastCheck = Date.now();
          endpoint.health.latency = latency;
          
        } catch (error) {
          endpoint.health.healthy = false;
          endpoint.health.lastCheck = Date.now();
        }
      }
    }, this.config.healthInterval);
  }
  
  createDeferred() {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  }
  
  async checkHealth() {
    // Public health check method with monitor integration
    const health = {
      healthy: true,
      endpoints: [],
      timestamp: Date.now()
    };
    
    for (const endpoint of this.endpoints) {
      const endpointHealth = {
        url: endpoint.url,
        healthy: endpoint.health.healthy,
        latency: endpoint.health.latency,
        breaker: endpoint.breaker.state,
        lastCheck: endpoint.health.lastCheck
      };
      
      health.endpoints.push(endpointHealth);
      
      if (!endpoint.health.healthy || endpoint.breaker.state === 'OPEN') {
        health.healthy = false;
      }
    }
    
    // If monitor has a check method, include its status
    if (this.monitor && typeof this.monitor.check === 'function') {
      try {
        const monitorStatus = await this.monitor.check();
        health.monitorStatus = monitorStatus;
      } catch (error) {
        health.monitorStatus = false;
        health.monitorError = error.message;
      }
    }
    
    return health;
  }
  
  getStats() {
    // Calculate percentiles
    const sortedLatencies = [...this.stats.latencies].sort((a, b) => a - b);
    const p50Index = Math.floor(sortedLatencies.length * 0.5);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);
    
    return {
      global: {
        calls: this.stats.calls,
        successes: this.stats.successes,
        failures: this.stats.failures,
        successRate: this.stats.calls > 0 ? (this.stats.successes / this.stats.calls * 100).toFixed(2) + '%' : '0%',
        queued: this.stats.queued,
        dropped: this.stats.dropped,
        inFlight: this.globalInFlight,
        queueLength: this.requestQueue.length,
        avgLatency: this.stats.latencies.length > 0 
          ? (this.stats.latencies.reduce((a, b) => a + b, 0) / this.stats.latencies.length).toFixed(2)
          : 0,
        p50Latency: sortedLatencies[p50Index] || 0,
        p95Latency: sortedLatencies[p95Index] || 0,
        p99Latency: sortedLatencies[p99Index] || 0
      },
      endpoints: this.endpoints.map(ep => ({
        url: ep.url,
        calls: ep.stats.calls,
        successes: ep.stats.successes,
        failures: ep.stats.failures,
        successRate: ep.stats.calls > 0 ? (ep.stats.successes / ep.stats.calls * 100).toFixed(2) + '%' : '0%',
        inFlight: ep.stats.inFlight,
        avgLatency: ep.stats.calls > 0 
          ? (ep.stats.totalLatency / ep.stats.calls).toFixed(2)
          : 0,
        health: ep.health.healthy ? 'healthy' : 'unhealthy',
        breaker: ep.breaker.state,
        rateLimit: `${ep.rateLimit.tokens.toFixed(1)}/${ep.config.rpsLimit}`
      }))
    };
  }
  
  async destroy() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Clear timers
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    
    if (this.queueTimer) {
      clearInterval(this.queueTimer);
      this.queueTimer = null;
    }
    
    // Reject pending requests
    for (const request of this.requestQueue) {
      request.deferred.reject(new Error('Pool destroyed'));
    }
    this.requestQueue = [];
    
    // Destroy HTTP agents
    for (const agent of this.agents.values()) {
      agent.destroy();
    }
    this.agents.clear();
    
    // Clear statistics
    this.stats.latencies = [];
    for (const endpoint of this.endpoints) {
      endpoint.stats.latencies = [];
      endpoint.breaker.errorCounts.clear();
    }
    
    this.emit('destroyed');
    this.removeAllListeners();
  }
}

// Export with both names for compatibility
export { RpcConnectionPoolV2, RpcConnectionPoolV2 as RpcConnectionPool };
export default RpcConnectionPoolV2;