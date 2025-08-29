/**
 * RPC Connection Pool for Solana Trading System
 * Simple, robust implementation with failover, circuit breaking, and memory safety
 * Optimized for meme coin trading with <30ms latency requirement
 */

import https from 'https';
import http from 'http';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';

dotenv.config();

class RpcConnectionPool extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Load configuration with all safety checks
    this.config = {
      // RPC Endpoints (filter out null/undefined)
      endpoints: (config.endpoints || [
        process.env.HELIUS_RPC_URL,
        process.env.CHAINSTACK_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ]).filter(Boolean),
      
      // Global Defaults
      rpsLimit: parseInt(process.env.RPC_DEFAULT_RPS_LIMIT) || 50,
      concurrency: parseInt(process.env.RPC_DEFAULT_CONCURRENCY_LIMIT) || 10,
      timeout: parseInt(process.env.RPC_DEFAULT_TIMEOUT_MS) || 2000,
      rateWindow: parseInt(process.env.RPC_RATE_WINDOW_MS) || 1000,
      maxInFlight: parseInt(process.env.RPC_MAX_IN_FLIGHT_GLOBAL) || 200,
      
      // Queue Config
      queueMaxSize: parseInt(process.env.RPC_QUEUE_MAX_SIZE) || 1000,
      queueDeadline: parseInt(process.env.RPC_QUEUE_DEADLINE_MS) || 5000,
      
      // Circuit Breaker
      breakerEnabled: process.env.RPC_BREAKER_ENABLED === 'true',
      breakerThreshold: parseInt(process.env.RPC_BREAKER_FAILURE_THRESHOLD) || 5,
      breakerCooldown: parseInt(process.env.RPC_BREAKER_COOLDOWN_MS) || 60000,
      breakerHalfOpenProbes: parseInt(process.env.RPC_BREAKER_HALF_OPEN_PROBES) || 1,
      
      // Health Monitoring
      healthInterval: parseInt(process.env.RPC_HEALTH_INTERVAL_MS) || 30000,
      healthProbeTimeout: parseInt(process.env.RPC_HEALTH_PROBE_TIMEOUT_MS) || 1000,
      
      // Connection Management
      keepAliveEnabled: process.env.RPC_KEEP_ALIVE_ENABLED === 'true',
      keepAliveSockets: parseInt(process.env.RPC_KEEP_ALIVE_SOCKETS) || 50,
      keepAliveTimeout: parseInt(process.env.RPC_KEEP_ALIVE_TIMEOUT_MS) || 60000,
      
      // Logging
      logLevel: process.env.LOG_LEVEL || 'info',
      logJson: process.env.LOG_JSON === 'true',
      traceRequestIds: process.env.TRACE_REQUEST_IDS === 'true',
      
      ...config
    };
    
    // Validate endpoints exist
    if (!this.config.endpoints || this.config.endpoints.length === 0) {
      throw new Error('No RPC endpoints configured');
    }
    
    // Initialize state
    this.currentIndex = 0;
    this.requestId = 0;
    this.inFlightRequests = new Map();
    this.isDestroyed = false;
    
    // Circuit breaker state for each endpoint
    this.circuitBreakers = new Map();
    this.config.endpoints.forEach((endpoint, index) => {
      this.circuitBreakers.set(index, {
        state: 'CLOSED',
        failures: 0,
        lastFailure: 0,
        halfOpenProbes: 0
      });
    });
    
    // Stats tracking
    this.stats = {
      calls: 0,
      failures: 0,
      totalLatency: 0,
      avgLatency: 0,
      p95Latency: 0,
      latencies: []
    };
    
    // Rate limiting
    this.rateLimiter = {
      requests: [],
      window: this.config.rateWindow
    };
    
    // HTTP agents for connection pooling
    this.agents = new Map();
    if (this.config.keepAliveEnabled) {
      this.config.endpoints.forEach((endpoint, index) => {
        const url = new URL(endpoint);
        const AgentClass = url.protocol === 'https:' ? https.Agent : http.Agent;
        this.agents.set(index, new AgentClass({
          keepAlive: true,
          maxSockets: this.config.keepAliveSockets,
          timeout: this.config.keepAliveTimeout
        }));
      });
    }
    
    // Health monitoring
    this.healthTimer = null;
    this.startHealthMonitoring();
    
    // Memory cleanup timer
    this.cleanupTimer = setInterval(() => this.cleanupMemory(), 60000);
  }
  
  /**
   * Main RPC call method with all safety patterns
   */
  async call(method, params = [], options = {}) {
    // Prevent calls after destroy
    if (this.isDestroyed) {
      throw new Error('RPC pool has been destroyed');
    }
    
    // Generate request ID with overflow protection
    const requestId = this.getNextRequestId();
    const startTime = Date.now();
    
    // Check rate limits
    if (!this.checkRateLimit()) {
      this.logError('Rate limit exceeded', { requestId });
      throw new Error('Rate limit exceeded');
    }
    
    // Check global concurrency
    if (this.inFlightRequests.size >= this.config.maxInFlight) {
      this.logError('Max in-flight requests reached', { requestId });
      throw new Error('Max in-flight requests reached');
    }
    
    // Find available endpoint
    const endpointIndex = this.selectEndpoint();
    if (endpointIndex === null) {
      this.logError('No available endpoints', { requestId });
      throw new Error('All endpoints are unavailable');
    }
    
    const endpoint = this.config.endpoints[endpointIndex];
    
    try {
      // Track in-flight request
      const abortController = new AbortController();
      this.inFlightRequests.set(requestId, {
        startTime,
        endpoint,
        abortController
      });
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          abortController.abort();
          reject(new Error(`Request timeout after ${this.config.timeout}ms`));
        }, this.config.timeout);
      });
      
      // Create request promise
      const requestPromise = this.executeRequest(
        endpoint,
        method,
        params,
        requestId,
        endpointIndex,
        abortController.signal
      );
      
      // Race between request and timeout
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      // Record success
      this.recordSuccess(endpointIndex, Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      // Record failure with error safety
      this.recordFailure(endpointIndex, error);
      
      // Try failover if enabled
      if (options.allowFailover !== false) {
        return this.failover(method, params, { 
          ...options, 
          allowFailover: false,
          excludeEndpoint: endpointIndex 
        });
      }
      
      throw error;
      
    } finally {
      // Clean up in-flight request
      this.inFlightRequests.delete(requestId);
    }
  }
  
  /**
   * Execute HTTP request to RPC endpoint
   */
  async executeRequest(endpoint, method, params, requestId, endpointIndex, signal) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const data = JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        method,
        params
      });
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        signal
      };
      
      // Use keep-alive agent if available
      if (this.agents.has(endpointIndex)) {
        options.agent = this.agents.get(endpointIndex);
      }
      
      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            
            if (response.error) {
              reject(new Error(response.error.message || 'RPC error'));
            } else {
              // Ensure proper number parsing (prevent string concatenation bugs)
              if (response.result && typeof response.result === 'string') {
                const parsed = parseInt(response.result);
                if (!isNaN(parsed)) {
                  response.result = parsed;
                }
              }
              resolve(response.result);
            }
          } catch (parseError) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      // Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          req.destroy();
          reject(new Error('Request aborted'));
        });
      }
      
      req.write(data);
      req.end();
    });
  }
  
  /**
   * Select next available endpoint with circuit breaker check
   */
  selectEndpoint() {
    const maxAttempts = this.config.endpoints.length;
    
    for (let i = 0; i < maxAttempts; i++) {
      const index = (this.currentIndex + i) % this.config.endpoints.length;
      const breaker = this.circuitBreakers.get(index);
      
      if (!breaker) continue;
      
      // Check circuit breaker state
      if (breaker.state === 'CLOSED') {
        this.currentIndex = (index + 1) % this.config.endpoints.length;
        return index;
      }
      
      if (breaker.state === 'HALF_OPEN') {
        if (breaker.halfOpenProbes < this.config.breakerHalfOpenProbes) {
          breaker.halfOpenProbes++;
          this.currentIndex = (index + 1) % this.config.endpoints.length;
          return index;
        }
      }
      
      if (breaker.state === 'OPEN') {
        // Check if cooldown period has passed
        const now = Date.now();
        if (now - breaker.lastFailure > this.config.breakerCooldown) {
          breaker.state = 'HALF_OPEN';
          breaker.halfOpenProbes = 1;
          this.currentIndex = (index + 1) % this.config.endpoints.length;
          return index;
        }
      }
    }
    
    return null; // No available endpoints
  }
  
  /**
   * Failover to next available endpoint
   */
  async failover(method, params, options) {
    const nextEndpoint = this.selectEndpoint();
    if (nextEndpoint === null) {
      throw new Error('Failover failed: no available endpoints');
    }
    
    this.logInfo('Attempting failover', { 
      endpoint: this.config.endpoints[nextEndpoint],
      method 
    });
    
    return this.call(method, params, options);
  }
  
  /**
   * Record successful request
   */
  recordSuccess(endpointIndex, latency) {
    this.stats.calls++;
    this.stats.totalLatency += latency;
    this.stats.avgLatency = this.stats.totalLatency / this.stats.calls;
    
    // Track latencies for p95 calculation
    this.stats.latencies.push(latency);
    if (this.stats.latencies.length > 1000) {
      this.stats.latencies.shift(); // Keep only last 1000
    }
    
    // Calculate p95
    if (this.stats.latencies.length > 0) {
      const sorted = [...this.stats.latencies].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      this.stats.p95Latency = sorted[p95Index];
    }
    
    // Reset circuit breaker on success
    const breaker = this.circuitBreakers.get(endpointIndex);
    if (breaker) {
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        breaker.halfOpenProbes = 0;
        this.logInfo('Circuit breaker closed', { endpointIndex });
      }
      breaker.failures = Math.max(0, breaker.failures - 1);
    }
    
    // Log if latency exceeds target
    if (latency > 30) {
      this.logWarn('High latency detected', { latency, endpointIndex });
    }
  }
  
  /**
   * Record failed request with circuit breaker logic
   */
  recordFailure(endpointIndex, error) {
    this.stats.failures++;
    
    const breaker = this.circuitBreakers.get(endpointIndex);
    if (breaker && this.config.breakerEnabled) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      if (breaker.failures >= this.config.breakerThreshold) {
        if (breaker.state !== 'OPEN') {
          breaker.state = 'OPEN';
          this.logWarn('Circuit breaker opened', { 
            endpointIndex, 
            failures: breaker.failures 
          });
        }
      }
    }
    
    // Safe error message handling
    const errorMessage = error && error.message ? error.message : 'Unknown error';
    this.logError('Request failed', { endpointIndex, error: errorMessage });
  }
  
  /**
   * Check rate limit
   */
  checkRateLimit() {
    const now = Date.now();
    const windowStart = now - this.config.rateWindow;
    
    // Remove old requests outside window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      time => time > windowStart
    );
    
    if (this.rateLimiter.requests.length >= this.config.rpsLimit) {
      return false;
    }
    
    this.rateLimiter.requests.push(now);
    return true;
  }
  
  /**
   * Get next request ID with overflow protection
   */
  getNextRequestId() {
    this.requestId = (this.requestId + 1) % Number.MAX_SAFE_INTEGER;
    return this.requestId;
  }
  
  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthTimer) return;
    
    this.healthTimer = setInterval(async () => {
      if (this.isDestroyed) return;
      
      for (let i = 0; i < this.config.endpoints.length; i++) {
        try {
          const startTime = Date.now();
          await this.call('getSlot', [], { 
            allowFailover: false,
            timeout: this.config.healthProbeTimeout 
          });
          const latency = Date.now() - startTime;
          
          this.logInfo('Health check passed', { 
            endpointIndex: i, 
            latency 
          });
        } catch (error) {
          this.logWarn('Health check failed', { 
            endpointIndex: i,
            error: error.message || 'Unknown error'
          });
        }
      }
    }, this.config.healthInterval);
  }
  
  /**
   * Periodic memory cleanup
   */
  cleanupMemory() {
    // Clean up old latency data
    if (this.stats.latencies.length > 1000) {
      this.stats.latencies = this.stats.latencies.slice(-1000);
    }
    
    // Clean up rate limiter
    const now = Date.now();
    const windowStart = now - this.config.rateWindow;
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      time => time > windowStart
    );
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      endpoints: this.config.endpoints.map((endpoint, index) => ({
        url: endpoint,
        circuitBreaker: this.circuitBreakers.get(index)
      })),
      inFlightRequests: this.inFlightRequests.size
    };
  }
  
  /**
   * Comprehensive cleanup and destroy
   */
  async destroy() {
    this.isDestroyed = true;
    
    // Clear all timers
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Abort all in-flight requests
    for (const [requestId, request] of this.inFlightRequests) {
      if (request.abortController) {
        request.abortController.abort();
      }
    }
    this.inFlightRequests.clear();
    
    // Close HTTP agents
    for (const agent of this.agents.values()) {
      agent.destroy();
    }
    this.agents.clear();
    
    // Clear circuit breakers
    this.circuitBreakers.clear();
    
    // Clear stats
    this.stats.latencies = [];
    this.rateLimiter.requests = [];
    
    // Remove all event listeners
    this.removeAllListeners();
    
    this.logInfo('RPC pool destroyed');
  }
  
  // Logging methods
  logInfo(message, data = {}) {
    if (this.config.logJson) {
      console.log(JSON.stringify({ 
        level: 'info', 
        message, 
        ...data, 
        timestamp: new Date().toISOString() 
      }));
    } else {
      console.log(`[INFO] ${message}`, data);
    }
  }
  
  logWarn(message, data = {}) {
    if (this.config.logJson) {
      console.log(JSON.stringify({ 
        level: 'warn', 
        message, 
        ...data, 
        timestamp: new Date().toISOString() 
      }));
    } else {
      console.warn(`[WARN] ${message}`, data);
    }
  }
  
  logError(message, data = {}) {
    if (this.config.logJson) {
      console.error(JSON.stringify({ 
        level: 'error', 
        message, 
        ...data, 
        timestamp: new Date().toISOString() 
      }));
    } else {
      console.error(`[ERROR] ${message}`, data);
    }
  }
}

export default RpcConnectionPool;