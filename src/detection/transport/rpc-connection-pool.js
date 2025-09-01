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

// Request coalescing cache to reduce duplicate RPC calls
class RequestCoalescingCache {
  constructor(defaultTTL = 250) {
    this.cache = new Map(); // key -> { promise, expiresAt, requestCount }
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      coalescedRequests: 0,
      cacheSize: 0
    };
  }
  
  generateKey(method, params, commitment = 'confirmed') {
    // Create deterministic key for identical requests
    return JSON.stringify({ method, params: params || [], commitment });
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    this.stats.hits++;
    entry.requestCount++;
    this.stats.coalescedRequests++;
    return entry.promise;
  }
  
  set(key, promise, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      promise,
      expiresAt,
      requestCount: 1,
      createdAt: Date.now()
    });
    
    this.stats.misses++;
    this.cleanup(); // Remove expired entries
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    this.stats.cacheSize = this.cache.size;
  }
  
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100,
      coalescingEfficiency: this.stats.coalescedRequests / this.stats.misses
    };
  }
  
  clear() {
    this.cache.clear();
    this.stats.cacheSize = 0;
  }
}

// Batch request manager to reduce network overhead
class BatchRequestManager {
  constructor(batchWindow = 50, maxBatchSize = 100) {
    this.batchWindow = batchWindow; // ms to wait for more requests
    this.maxBatchSize = maxBatchSize;
    this.pendingBatches = new Map(); // method -> { requests: [], timer: timeout }
    this.stats = {
      batchesSent: 0,
      requestsBatched: 0,
      individualRequests: 0,
      batchSavings: 0
    };
  }
  
  // Methods that can be batched efficiently
  getBatchableMethod(method) {
    const batchMethods = {
      'getAccountInfo': 'getMultipleAccounts',
      'getBalance': 'getMultipleAccounts', // Can batch balance requests
      'getProgramAccounts': null, // Cannot batch efficiently
      'getTokenSupply': null, // Individual calls only
      'getSlot': null // Individual calls only
    };
    return batchMethods[method];
  }
  
  canBatch(method) {
    return this.getBatchableMethod(method) !== null;
  }
  
  addToBatch(method, params, options, deferred, executor) {
    const batchMethod = this.getBatchableMethod(method);
    if (!batchMethod) {
      return false; // Cannot batch this method
    }
    
    const batchKey = this.createBatchKey(method, options);
    
    if (!this.pendingBatches.has(batchKey)) {
      this.pendingBatches.set(batchKey, {
        method: batchMethod,
        requests: [],
        timer: null,
        options,
        executor
      });
    }
    
    const batch = this.pendingBatches.get(batchKey);
    batch.requests.push({
      originalMethod: method,
      params,
      deferred,
      addedAt: Date.now()
    });
    
    // Start batch timer if first request
    if (batch.requests.length === 1) {
      batch.timer = setTimeout(() => {
        this.executeBatch(batchKey);
      }, this.batchWindow);
    }
    
    // Execute immediately if batch is full
    if (batch.requests.length >= this.maxBatchSize) {
      clearTimeout(batch.timer);
      this.executeBatch(batchKey);
    }
    
    return true;
  }
  
  createBatchKey(method, options) {
    // Group by method and commitment level
    const commitment = options.commitment || 'confirmed';
    return `${method}:${commitment}`;
  }
  
  async executeBatch(batchKey) {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;
    
    this.pendingBatches.delete(batchKey);
    clearTimeout(batch.timer);
    
    try {
      // Prepare addresses for batch
      const addresses = batch.requests.map(req => {
        if (req.originalMethod === 'getAccountInfo') {
          return req.params[0]; // Address is first parameter
        } else if (req.originalMethod === 'getBalance') {
          return req.params[0]; // Address is first parameter
        }
        return null;
      }).filter(Boolean);
      
      // Execute batch request through the executor
      const batchResult = await batch.executor(batch.method, addresses, batch.options);
      
      // Update stats
      this.stats.batchesSent++;
      this.stats.requestsBatched += batch.requests.length;
      this.stats.batchSavings += batch.requests.length - 1; // Saved calls
      
      // Distribute results back to individual requests
      // Handle both direct value and result.value structures
      const resultValue = batchResult?.value || batchResult?.result?.value;
      if (resultValue) {
        batch.requests.forEach((req, index) => {
          const accountData = resultValue[index];
          
          if (req.originalMethod === 'getAccountInfo') {
            req.deferred.resolve({ value: accountData });
          } else if (req.originalMethod === 'getBalance') {
            // Extract balance from account data
            const balance = accountData ? accountData.lamports : 0;
            req.deferred.resolve({ value: balance });
          }
        });
      } else {
        // No valid results, reject all
        const error = new Error('No valid batch results received');
        batch.requests.forEach(req => {
          req.deferred.reject(error);
        });
      }
    } catch (error) {
      // Reject all requests in batch
      batch.requests.forEach(req => {
        req.deferred.reject(error);
      });
    }
  }
  
  getStats() {
    return {
      ...this.stats,
      avgBatchSize: this.stats.requestsBatched / (this.stats.batchesSent || 1),
      efficiencyGain: this.stats.batchSavings / (this.stats.requestsBatched || 1)
    };
  }
  
  clear() {
    // Clear all pending batches
    for (const [key, batch] of this.pendingBatches.entries()) {
      clearTimeout(batch.timer);
      batch.requests.forEach(req => {
        req.deferred.reject(new Error('Batch manager cleared'));
      });
    }
    this.pendingBatches.clear();
  }
}

// Phase 3 Integration: HedgedManager will replace this class
// Import: import { HedgedManager } from './hedged-manager.js';
// Usage: this.hedgedManager = new HedgedManager(config);
// Integration: await this.hedgedManager.hedgedRequest(primary, backups, options)
// Hedged request manager for improved tail latency
class HedgedRequestManager {
  constructor() {
    this.activeHedges = new Map(); // requestId -> hedge tracking
    this.stats = {
      hedgesTriggered: 0,
      hedgesWon: 0,
      hedgesCancelled: 0,
      latencyImprovement: 0,
      primaryWins: 0
    };
  }
  
  calculateHedgingDelay(endpoint) {
    // Use recent P95 latency as hedge trigger point
    const recentLatencies = endpoint.stats.latencies.slice(-20);
    if (recentLatencies.length < 5) {
      return parseInt(process.env.RPC_HEDGING_DELAY_MS) || 200;
    }
    
    // Calculate P95 from recent samples
    const sorted = [...recentLatencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95Latency = sorted[p95Index] || 200;
    
    // Hedge at 75% of P95 to catch tail latency
    return Math.max(50, Math.min(500, Math.floor(p95Latency * 0.75)));
  }
  
  shouldHedge(request, primaryEndpoint, availableEndpoints) {
    // Skip hedging if disabled
    if (process.env.RPC_HEDGING_ENABLED !== 'true') {
      return false;
    }
    
    // Skip hedging for retries
    if (request.attempts > 0) {
      return false;
    }
    
    // Skip if not enough alternative endpoints
    if (availableEndpoints.length < 2) {
      return false;
    }
    
    // Skip for methods that shouldn't be hedged
    const nonHedgeMethods = ['sendTransaction', 'simulateTransaction'];
    if (nonHedgeMethods.includes(request.method)) {
      return false;
    }
    
    return true;
  }
  
  createHedge(requestId, primaryPromise, request, primaryEndpoint, alternativeEndpoints, executor) {
    const hedgeDelay = this.calculateHedgingDelay(primaryEndpoint);
    const maxHedges = parseInt(process.env.RPC_HEDGING_MAX_EXTRA) || 1;
    
    const hedgeInfo = {
      primaryPromise,
      hedgePromises: [],
      timers: [],
      resolved: false,
      winner: null,
      startTime: Date.now(),
      primaryEndpoint,
      request
    };
    
    this.activeHedges.set(requestId, hedgeInfo);
    
    // Set up hedging timer
    const hedgeTimer = setTimeout(() => {
      if (hedgeInfo.resolved) return;
      
      // Select alternative endpoint
      const altEndpoint = this.selectAlternativeEndpoint(
        primaryEndpoint, 
        alternativeEndpoints
      );
      
      if (altEndpoint) {
        this.stats.hedgesTriggered++;
        
        // Execute hedge request through executor
        const hedgePromise = executor(request, altEndpoint)
          .then(result => ({ result, source: 'hedge-0', endpoint: altEndpoint }))
          .catch(error => ({ error, source: 'hedge-0', endpoint: altEndpoint }));
        
        hedgeInfo.hedgePromises.push(hedgePromise);
        
        // Set up additional hedges if configured
        if (hedgeInfo.hedgePromises.length < maxHedges && alternativeEndpoints.length > 2) {
          const additionalTimer = setTimeout(() => {
            if (hedgeInfo.resolved) return;
            
            const secondAltEndpoint = this.selectAlternativeEndpoint(
              primaryEndpoint,
              alternativeEndpoints.filter(ep => ep !== altEndpoint)
            );
            
            if (secondAltEndpoint) {
              const secondHedge = executor(request, secondAltEndpoint)
                .then(result => ({ result, source: 'hedge-1', endpoint: secondAltEndpoint }))
                .catch(error => ({ error, source: 'hedge-1', endpoint: secondAltEndpoint }));
              
              hedgeInfo.hedgePromises.push(secondHedge);
            }
          }, hedgeDelay);
          
          hedgeInfo.timers.push(additionalTimer);
        }
      }
    }, hedgeDelay);
    
    hedgeInfo.timers.push(hedgeTimer);
    
    return hedgeInfo;
  }
  
  async raceWithHedges(requestId) {
    const hedgeInfo = this.activeHedges.get(requestId);
    if (!hedgeInfo) return null;
    
    try {
      // Prepare primary promise with source info
      const primaryWithSource = hedgeInfo.primaryPromise
        .then(result => ({ result, source: 'primary', endpoint: hedgeInfo.primaryEndpoint }))
        .catch(error => Promise.reject(error));
      
      // Race primary against all hedges
      const allPromises = [primaryWithSource, ...hedgeInfo.hedgePromises];
      
      // Wait for first successful response
      const winner = await Promise.race(allPromises.map((p, i) => 
        p.then(res => {
          if (res.error) throw res.error;
          return res;
        })
      ));
      
      // Mark as resolved and track winner
      hedgeInfo.resolved = true;
      hedgeInfo.winner = winner.source;
      
      const latencyImprovement = this.calculateLatencyImprovement(hedgeInfo);
      this.stats.latencyImprovement += latencyImprovement;
      
      if (winner.source === 'primary') {
        this.stats.primaryWins++;
      } else {
        this.stats.hedgesWon++;
      }
      
      // Cleanup and return result
      this.cleanup(requestId);
      return winner.result;
      
    } catch (error) {
      // If all requests fail, cleanup and throw
      this.cleanup(requestId);
      throw error;
    }
  }
  
  calculateLatencyImprovement(hedgeInfo) {
    if (!hedgeInfo.winner || hedgeInfo.winner === 'primary') {
      return 0;
    }
    
    // Estimate improvement based on hedge delay
    const hedgeDelay = this.calculateHedgingDelay(hedgeInfo.primaryEndpoint);
    const totalTime = Date.now() - hedgeInfo.startTime;
    
    // If hedge won, we saved at least the difference between hedge delay and actual time
    return Math.max(0, hedgeDelay - totalTime);
  }
  
  cleanup(requestId) {
    const hedgeInfo = this.activeHedges.get(requestId);
    if (!hedgeInfo) return;
    
    // Clear all timers
    hedgeInfo.timers.forEach(timer => clearTimeout(timer));
    
    // Track cancelled hedges
    if (!hedgeInfo.resolved) {
      this.stats.hedgesCancelled += hedgeInfo.hedgePromises.length;
    }
    
    this.activeHedges.delete(requestId);
  }
  
  selectAlternativeEndpoint(primaryEndpoint, availableEndpoints) {
    // Select different endpoint with best score
    const alternatives = availableEndpoints.filter(ep => 
      ep.index !== primaryEndpoint.index &&
      ep.breaker.state !== 'OPEN' &&
      ep.health.healthy &&
      ep.stats.inFlight < ep.config.maxConcurrent
    );
    
    if (alternatives.length === 0) return null;
    
    // Choose endpoint with lowest current load and best recent performance
    return alternatives.sort((a, b) => {
      const aLoad = a.stats.inFlight / a.config.maxConcurrent;
      const bLoad = b.stats.inFlight / b.config.maxConcurrent;
      
      // Consider both load and recent latency
      const aScore = aLoad + (a.health.latency / 1000);
      const bScore = bLoad + (b.health.latency / 1000);
      
      return aScore - bScore;
    })[0];
  }
  
  getStats() {
    const totalRequests = this.stats.hedgesTriggered || 1;
    return {
      ...this.stats,
      hedgeSuccessRate: this.stats.hedgesTriggered > 0 
        ? (this.stats.hedgesWon / this.stats.hedgesTriggered * 100).toFixed(1) + '%'
        : '0%',
      avgLatencyImprovement: this.stats.hedgesTriggered > 0
        ? Math.round(this.stats.latencyImprovement / this.stats.hedgesTriggered)
        : 0
    };
  }
  
  clear() {
    // Cleanup all active hedges
    for (const requestId of this.activeHedges.keys()) {
      this.cleanup(requestId);
    }
  }
}

// Token bucket implementation - Integration stub for extracted module
// The full implementation has been moved to ./token-bucket.js
// This stub maintains backward compatibility while preparing for Phase 3 integration
class TokenBucket {
  constructor(rpsLimit, windowMs = 1000) {
    // For now, use inline implementation for backward compatibility
    // In Phase 3, this will be replaced with: this.tokenBucket = new TokenBucket(config)
    this.maxTokens = rpsLimit;
    // Start with fewer tokens to prevent initial burst
    this.tokens = Math.min(5, rpsLimit);
    this.refillRate = rpsLimit / (windowMs / 1000); // tokens per millisecond
    this.lastRefill = Date.now();
    this.windowMs = windowMs;
    
    // Integration stub ready for orchestrator
    // this.tokenBucket = { hasTokens: () => this.canConsume(1) };
  }
  
  // Main interface method for orchestrator integration
  hasTokens(count = 1) {
    return this.canConsume(count);
  }
  
  canConsume(tokens = 1) {
    this.refill();
    return this.tokens >= tokens;
  }
  
  consume(tokens = 1) {
    if (this.canConsume(tokens)) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
  
  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  getStatus() {
    this.refill();
    return {
      tokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
      utilization: ((this.maxTokens - this.tokens) / this.maxTokens * 100).toFixed(1) + '%'
    };
  }
}

// Export for testing - ready for Phase 3 integration
// In Phase 3: import { TokenBucket } from './token-bucket.js';

// Per-endpoint configuration with individual rate limits
// OPTIMIZED FOR 95%+ SUCCESS RATE (Fix 14)
const ENDPOINT_CONFIGS = {
  helius: {
    pattern: /helius/i,
    rpsLimit: 45,
    weight: 60,
    maxConcurrent: 150,      // Increased from 100 for better throughput
    timeout: 3500,           // Increased from 2000ms to reduce timeout failures
    connectionTimeout: 3000,  // New: explicit connection timeout
    retryTimeout: 2000,      // New: faster retry timeout
    priority: 1
  },
  chainstack: {
    pattern: /chainstack|p2pify/i,
    rpsLimit: 30,  // Conservative limit below actual
    weight: 30,
    maxConcurrent: 30,       // Doubled from 15 for better concurrency
    timeout: 3000,           // Doubled from 1500ms to reduce timeout failures
    connectionTimeout: 2500,  // New: explicit connection timeout
    retryTimeout: 1500,      // New: faster retry timeout
    priority: 0  // Highest priority due to best latency
  },
  public: {
    pattern: /mainnet-beta/i,
    rpsLimit: 8,   // Well below public RPC limits
    weight: 10,
    maxConcurrent: 10,       // Doubled from 5 for better concurrency
    timeout: 5000,           // Increased from 3000ms for public RPC reliability
    connectionTimeout: 4000,  // New: explicit connection timeout
    retryTimeout: 3000,      // New: retry timeout for public endpoints
    priority: 2
  }
};

// Memory bound constants to prevent unbounded growth
const MAX_QUEUE = 500;           // Hard cap on request queue
const MAX_SAMPLES = 64;          // Max latency samples per endpoint
const MAX_CB_EVENTS = 50;        // Max circuit breaker events
const MAX_GLOBAL_LATENCIES = 1000; // Max global latency samples

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
    
    // Global configuration with enforced bounds
    // OPTIMIZED FOR 95%+ SUCCESS RATE (Fix 14)
    this.config = {
      maxGlobalInFlight: config.maxGlobalInFlight || parseInt(process.env.RPC_MAX_IN_FLIGHT_GLOBAL) || 300,  // Increased from 200
      queueMaxSize: Math.min(config.queueMaxSize || parseInt(process.env.RPC_QUEUE_MAX_SIZE) || MAX_QUEUE, MAX_QUEUE),
      queueDeadline: config.queueDeadline || parseInt(process.env.RPC_QUEUE_DEADLINE_MS) || 8000,  // Increased from 5000ms
      breakerEnabled: config.breakerEnabled !== false && process.env.RPC_BREAKER_ENABLED !== 'false',
      healthInterval: config.healthInterval || parseInt(process.env.RPC_HEALTH_INTERVAL_MS) || 30000,
      keepAliveEnabled: config.keepAliveEnabled !== false && process.env.RPC_KEEP_ALIVE_ENABLED !== 'false',
      retryTimeouts: true,  // New: Enable retry on timeout errors
      maxRetryOnTimeout: 1,  // New: Single retry for timeout failures
      ...config
    };
    
    // Request tracking
    this.requestId = 0;
    this.globalInFlight = 0;
    this.isDestroyed = false;
    
    // Initialize request coalescing cache
    this.coalescingCache = new RequestCoalescingCache(
      parseInt(process.env.RPC_COALESCING_TTL_MS) || 250
    );
    
    // Initialize batch request manager
    this.batchManager = new BatchRequestManager(
      parseInt(process.env.RPC_BATCH_WINDOW_MS) || 50,
      parseInt(process.env.RPC_BATCH_MAX_SIZE) || 100
    );
    
    // Initialize hedged request manager
    this.hedgeManager = new HedgedRequestManager();
    
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
    
    // Start memory leak guard
    this.startLeakGuard();
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
        // Add token bucket rate limiting
        rateLimiter: new TokenBucket(endpointConfig.rpsLimit),
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
        // Integration stub for extracted module - Phase 3 integration:
        // In Phase 3, replace with: await circuitBreaker.execute(serviceName, fn)
        // Import: import { CircuitBreaker } from './circuit-breaker.js';
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
   * Main RPC call method with batching, coalescing, queuing and intelligent routing
   */
  async call(method, params = [], opts = {}) {
    if (this.isDestroyed) {
      throw new Error('RPC pool has been destroyed');
    }
    
    // Integration stub for extracted request cache module - Phase 3 integration:
    // In Phase 3, add caching: 
    // const cacheKey = this.requestCache.generateKey(method, params, opts);
    // return await this.requestCache.get(cacheKey, async () => { ... existing logic ... });
    // Import: import { RequestCache } from './request-cache.js';
    
    // Toyota approach: Simple endpoint rotation with failover
    const budgetMs = opts.failoverBudgetMs ?? 5000; // meet "<5s failover" goal
    const start = Date.now();
    let lastErr = null;
    let request = null;
    
    // round-robin cursor lives on the instance
    if (typeof this._rr !== 'number') this._rr = 0;
    
    // Wrap requestId to prevent unbounded growth
    if (this.requestId > 1000000) {
      this.requestId = 0;
    }
    
    try {
      for (let attempts = 0; attempts < this.endpoints.length &&
                             (Date.now() - start) < budgetMs; attempts++) {
        // pick next non-OPEN endpoint (skip OPEN circuit breakers)
        let ep = null;
        for (let i = 0; i < this.endpoints.length; i++) {
          const cand = this.endpoints[(this._rr + i) % this.endpoints.length];
          if (cand.breaker.state !== 'OPEN') { 
            ep = cand; 
            this._rr = (this._rr + i + 1) % this.endpoints.length; 
            break; 
          }
        }
        if (!ep) break; // all OPEN, bail fast
        
        try {
          // Create minimal request object - avoid holding references
          const reqId = ++this.requestId;
          
          const res = await this.executeRpcCall(ep, {
            id: reqId,
            method: method,
            params: params,
            options: opts,
            timestamp: Date.now()
          });
          
          // Success - clear error and return
          lastErr = null;
          return res;
        } catch (err) {
          lastErr = err;
          // On any error: immediately try next endpoint
          continue;
        }
      }
      
      // Clear error message when we really run out
      throw new Error(`All endpoints failed within ${Date.now() - start}ms (budget ${budgetMs}ms). Last error: ${lastErr?.message || 'unknown'}`);
      
    } finally {
      // Ensure cleanup of any remaining references
      if (request) {
        request.method = null;
        request.params = null;
        request.options = null;
        request = null;
      }
      lastErr = null;
    }
  }
  
  /**
   * Explicit batch method for advanced users
   * @param {Array} requests - Array of { method, params, options? }
   * @returns {Promise<Array>} Array of results
   */
  async callBatch(requests) {
    if (this.isDestroyed) {
      throw new Error('RPC pool has been destroyed');
    }
    
    // Integration stub for extracted batch manager module - Phase 3 integration:
    // In Phase 3, use batch manager:
    // const promises = requests.map(req => 
    //   this.batchManager.addRequest(req.method, req.params, req.options)
    // );
    // return await Promise.all(promises);
    // Import: import { BatchManager } from './batch-manager.js';
    
    // Separate batchable and non-batchable requests
    const batchableRequests = [];
    const individualRequests = [];
    
    for (const req of requests) {
      if (process.env.RPC_BATCHING_ENABLED === 'true' && this.batchManager.canBatch(req.method)) {
        batchableRequests.push(req);
      } else {
        individualRequests.push(req);
      }
    }
    
    const results = [];
    
    // Process batchable requests together
    if (batchableRequests.length > 0) {
      // Group by method type for batching
      const methodGroups = new Map();
      for (const req of batchableRequests) {
        const key = `${req.method}:${req.options?.commitment || 'confirmed'}`;
        if (!methodGroups.has(key)) {
          methodGroups.set(key, []);
        }
        methodGroups.get(key).push(req);
      }
      
      // Execute each batch group
      for (const [key, group] of methodGroups) {
        const addresses = group.map(req => req.params[0]);
        const batchMethod = this.batchManager.getBatchableMethod(group[0].method);
        
        try {
          const batchResult = await this.executeNewRequest(
            batchMethod,
            [addresses, { encoding: 'jsonParsed', ...(group[0].options || {}) }],
            group[0].options || {}
          );
          
          // Map results back to original requests
          if (batchResult && batchResult.value) {
            group.forEach((req, index) => {
              const accountData = batchResult.value[index];
              if (req.method === 'getAccountInfo') {
                results.push({ value: accountData });
              } else if (req.method === 'getBalance') {
                const balance = accountData ? accountData.lamports : 0;
                results.push({ value: balance });
              }
            });
          }
        } catch (error) {
          // Add error for each request in the failed batch
          group.forEach(() => results.push({ error }));
        }
      }
    }
    
    // Process individual requests
    for (const req of individualRequests) {
      try {
        const result = await this.call(req.method, req.params || [], req.options || {});
        results.push(result);
      } catch (error) {
        results.push({ error });
      }
    }
    
    return results;
  }
  
  /**
   * Execute a new request (not coalesced)
   */
  async executeNewRequest(method, params, options) {
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
      // Enforce hard queue cap with oldest-drop behavior
      if (this.requestQueue.length >= this.config.queueMaxSize) {
        // Drop oldest request to make room
        const droppedRequest = this.requestQueue.shift();
        if (droppedRequest) {
          this.stats.dropped++;
          droppedRequest.deferred.reject(new Error('Dropped from queue (oldest-drop)'));
          // Clean up dropped request
          droppedRequest.method = null;
          droppedRequest.params = null;
          droppedRequest.options = null;
          droppedRequest.deferred = null;
        }
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
      const primaryEndpoint = this.selectEndpoint(request);
      
      if (!primaryEndpoint) {
        throw new Error('No available endpoints');
      }
      
      // Note: Rate limit token already consumed in selectEndpoint()
      
      // Check if we should hedge this request
      const availableEndpoints = this.endpoints.filter(ep => 
        ep.breaker.state !== 'OPEN' && ep.health.healthy
      );
      
      if (this.hedgeManager.shouldHedge(request, primaryEndpoint, availableEndpoints)) {
        // Execute with hedging
        const result = await this.executeWithHedging(request, primaryEndpoint, availableEndpoints);
        request.deferred.resolve(result);
      } else {
        // Execute without hedging (original logic)
        primaryEndpoint.stats.inFlight++;
        
        const result = await this.executeRpcCall(primaryEndpoint, request);
        
        // Update statistics
        const latency = Date.now() - startTime;
        this.updateStats(primaryEndpoint, true, latency);
        
        // Record telemetry if monitor is configured
        if (this.monitor && typeof this.monitor.recordLatency === 'function') {
          this.monitor.recordLatency(request.method, latency, primaryEndpoint.url);
        }
        if (this.monitor && typeof this.monitor.recordSuccess === 'function') {
          this.monitor.recordSuccess(request.method, primaryEndpoint.url);
        }
        
        // Reset circuit breaker on success
        if (primaryEndpoint.breaker.state !== 'CLOSED') {
          primaryEndpoint.breaker.consecutiveSuccesses++;
          if (primaryEndpoint.breaker.consecutiveSuccesses >= 3) {
            primaryEndpoint.breaker.state = 'CLOSED';
            primaryEndpoint.breaker.failures = 0;
            primaryEndpoint.breaker.consecutiveSuccesses = 0;
            this.emit('breaker-closed', primaryEndpoint.index);
          }
        }
        
        request.deferred.resolve(result);
      }
      
    } catch (error) {
      // Record error telemetry if monitor is configured
      if (this.monitor && typeof this.monitor.recordError === 'function') {
        this.monitor.recordError(request.method, error, 'unknown');
      }
      
      // Handle failure with intelligent retry
      const shouldRetry = this.handleFailure(request, error);
      
      // Optimized retry logic for 95%+ success rate
      const isTimeout = error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || 
                       error.message?.includes('timeout');
      const shouldRetryTimeout = isTimeout && this.config.retryTimeouts && 
                                request.attempts <= (this.config.maxRetryOnTimeout || 1);
      
      if ((shouldRetry && request.attempts < 3) || shouldRetryTimeout) {
        // Use faster retry delay for timeout errors
        const endpoint = this.selectEndpoint(request);
        const retryDelay = isTimeout && endpoint?.config?.retryTimeout ? 
          endpoint.config.retryTimeout : 
          Math.min(100 * Math.pow(2, request.attempts), 1000);
        
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.executeRequest(request);
          }
        }, retryDelay);
        return;
      }
      
      request.deferred.reject(error);
      
    } finally {
      this.globalInFlight--;
      
      // Process queued requests
      this.processQueue();
    }
  }
  
  async executeWithHedging(request, primaryEndpoint, availableEndpoints) {
    const startTime = Date.now();
    
    // Execute primary request
    primaryEndpoint.stats.inFlight++;
    const primaryPromise = this.executeRpcCall(primaryEndpoint, request)
      .then(result => {
        // Update stats for successful primary
        const latency = Date.now() - startTime;
        this.updateStats(primaryEndpoint, true, latency);
        
        // Record telemetry
        if (this.monitor && typeof this.monitor.recordLatency === 'function') {
          this.monitor.recordLatency(request.method, latency, primaryEndpoint.url);
        }
        if (this.monitor && typeof this.monitor.recordSuccess === 'function') {
          this.monitor.recordSuccess(request.method, primaryEndpoint.url);
        }
        
        // Reset circuit breaker on success
        if (primaryEndpoint.breaker.state !== 'CLOSED') {
          primaryEndpoint.breaker.consecutiveSuccesses++;
          if (primaryEndpoint.breaker.consecutiveSuccesses >= 3) {
            primaryEndpoint.breaker.state = 'CLOSED';
            primaryEndpoint.breaker.failures = 0;
            primaryEndpoint.breaker.consecutiveSuccesses = 0;
            this.emit('breaker-closed', primaryEndpoint.index);
          }
        }
        
        return result;
      })
      .catch(error => {
        // Update stats for failed primary
        this.updateStats(primaryEndpoint, false, Date.now() - startTime);
        throw error;
      })
      .finally(() => {
        primaryEndpoint.stats.inFlight--;
      });
    
    // Create executor for hedge requests
    const hedgeExecutor = async (req, endpoint) => {
      endpoint.stats.inFlight++;
      try {
        const result = await this.executeRpcCall(endpoint, req);
        
        // Update stats for successful hedge
        const latency = Date.now() - startTime;
        this.updateStats(endpoint, true, latency);
        
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
        
        return result;
      } catch (error) {
        // Update stats for failed hedge
        this.updateStats(endpoint, false, Date.now() - startTime);
        throw error;
      } finally {
        endpoint.stats.inFlight--;
      }
    };
    
    // Create hedge with primary promise
    this.hedgeManager.createHedge(
      request.id,
      primaryPromise,
      request,
      primaryEndpoint,
      availableEndpoints,
      hedgeExecutor
    );
    
    // Race primary against hedges
    const result = await this.hedgeManager.raceWithHedges(request.id);
    return result;
  }
  
  selectEndpoint(request) {
    // Integration stub for extracted module - Phase 3 integration:
    // In Phase 3, replace with: return this.endpointSelector.selectEndpoint()
    // Import: import { EndpointSelector } from './endpoint-selector.js';
    return this.selectBestEndpoint();
  }
  
  selectBestEndpoint() {
    // Filter endpoints that are actually available
    const available = this.endpoints.filter(ep => {
      // ISOLATED CIRCUIT BREAKER CHECK (Fix 15)
      // Skip endpoints with OPEN circuit breakers (isolated per endpoint)
      if (ep.breaker.state === 'OPEN') {
        // Check if this specific endpoint's cooldown period has passed
        const cooldownMs = ep.breaker.cooldownMs || 30000;
        const timeSinceOpen = Date.now() - (ep.breaker.openedAt || ep.breaker.lastFailure);
        if (timeSinceOpen > cooldownMs) {
          // Transition only this endpoint to HALF_OPEN (isolated recovery)
          ep.breaker.state = 'HALF_OPEN';
          ep.breaker.halfOpenTests = 0;
          ep.breaker.consecutiveSuccesses = 0;
          ep.breaker.failures = Math.max(0, ep.breaker.failures - 1); // Decay only this endpoint's failures
          this.emit('breaker-half-open', ep.index);
        } else {
          return false; // This endpoint still in cooldown
        }
      }
      
      // Limit half-open tests to prevent thrashing
      if (ep.breaker.state === 'HALF_OPEN' && ep.breaker.halfOpenTests >= 2) {
        return false;
      }
      
      // Health check - skip unhealthy endpoints
      if (!ep.health.healthy && ep.health.lastCheck > 0) {
        return false;
      }
      
      // Rate limit check - skip endpoints with no tokens
      if (!ep.rateLimiter.canConsume(1)) {
        return false;
      }
      
      // Check rate limit backoff period
      if (ep.rateLimitBackoff && ep.rateLimitBackoff.until > Date.now()) {
        return false;
      }
      
      // Capacity check - skip completely saturated endpoints
      if (ep.stats.inFlight >= ep.config.maxConcurrent) {
        return false;
      }
      
      return true;
    });
    
    if (available.length === 0) {
      return null;
    }
    
    // If only one endpoint available, use it
    if (available.length === 1) {
      available[0].rateLimiter.consume(1);
      return available[0];
    }
    
    // Multi-factor scoring for intelligent selection
    let bestEndpoint = null;
    let bestScore = -1;
    
    for (const endpoint of available) {
      const score = this.calculateEndpointScore(endpoint);
      
      if (score > bestScore) {
        bestScore = score;
        bestEndpoint = endpoint;
      }
    }
    
    // Consume rate limit token immediately when endpoint is selected
    if (bestEndpoint) {
      bestEndpoint.rateLimiter.consume(1);
    }
    
    return bestEndpoint;
  }
  
  calculateEndpointScore(endpoint) {
    // Factor 1: Capacity utilization (higher available capacity = better)
    const capacityFactor = 1 - (endpoint.stats.inFlight / endpoint.config.maxConcurrent);
    const capacityScore = Math.pow(capacityFactor, 2) * 100; // Exponential preference for available capacity
    
    // Factor 2: Latency performance (lower latency = better)
    const targetLatency = 30; // Target 30ms latency
    const actualLatency = endpoint.health.latency || targetLatency;
    const latencyScore = Math.max(0, Math.min(100, (targetLatency / actualLatency) * 100));
    
    // Factor 3: Rate limit availability (more tokens = better)
    const rateLimitStatus = endpoint.rateLimiter.getStatus();
    const rateLimitScore = (rateLimitStatus.tokens / rateLimitStatus.maxTokens) * 100;
    
    // Factor 4: Success rate history (higher success = better)
    const totalCalls = endpoint.stats.calls || 1;
    const successRate = endpoint.stats.successes / totalCalls;
    const successScore = successRate * 100;
    
    // Factor 5: Priority weight (endpoint configuration preference)
    const priorityScore = endpoint.config.weight || 10;
    
    // Factor 6: Circuit breaker state bonus/penalty
    const breakerScore = endpoint.breaker.state === 'CLOSED' ? 20 : 
                        endpoint.breaker.state === 'HALF_OPEN' ? 10 : 0;
    
    // Weighted combination of all factors
    const compositeScore = (
      capacityScore * 0.35 +     // 35% - Most important: available capacity
      latencyScore * 0.20 +      // 20% - Critical: response speed
      rateLimitScore * 0.20 +    // 20% - Important: rate limit headroom  
      successScore * 0.10 +      // 10% - Moderate: historical reliability
      priorityScore * 0.10 +     // 10% - Configuration preference
      breakerScore * 0.05        // 5% - Minor: circuit breaker bonus
    );
    
    return compositeScore;
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
      let req = null;
      let timeoutHandle = null;
      let data = '';
      
      // Aggressive cleanup function to prevent memory leaks
      const cleanup = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        if (req) {
          req.removeAllListeners();
          req.destroy();
          req = null;
        }
        // Clear all references
        data = null;
        options.headers = null;
        options.agent = null;
      };
      
      try {
        req = proto.request(options, (res) => {
          // Clear request timeout as response started
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
          
          res.on('data', chunk => {
            data += chunk;
            // Prevent excessive memory usage from large responses
            if (data.length > 10 * 1024 * 1024) { // 10MB limit
              cleanup();
              reject(new Error('Response too large'));
            }
          });
          
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              
              if (response.error) {
                const errorMsg = response.error.message || 'RPC error';
                cleanup();
                reject(new Error(errorMsg));
              } else {
                // Extract result and immediately free response
                const result = response.result;
                response.result = null;
                response.id = null;
                response.jsonrpc = null;
                cleanup();
                resolve(result);
              }
            } catch (error) {
              cleanup();
              reject(new Error('Invalid JSON response'));
            } finally {
              // Ensure res is cleaned up
              res.removeAllListeners();
              res.destroy();
            }
          });
          
          res.on('error', (err) => {
            cleanup();
            reject(err);
          });
        });
        
        req.on('error', (err) => {
          cleanup();
          reject(err);
        });
        
        // Set custom timeout handler for better cleanup
        timeoutHandle = setTimeout(() => {
          cleanup();
          reject(new Error(`Request timeout after ${options.timeout}ms`));
        }, options.timeout);
        
        // Send request
        req.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          method: request.method,
          params: request.params
        }));
        
        req.end();
        
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }
  
  handleFailure(request, error, endpoint = null) {
    if (!endpoint) {
      // Find the endpoint that failed
      endpoint = this.endpoints.find(ep => ep.stats.inFlight > 0) || 
                 this.endpoints[0]; // fallback
    }
    
    const errorInfo = this.classifyError(error);
    
    // Update endpoint statistics
    endpoint.stats.inFlight = Math.max(0, endpoint.stats.inFlight - 1);
    endpoint.stats.failures++;
    
    // Track error types with bounds
    if (endpoint.breaker.errorCounts.size >= MAX_CB_EVENTS) {
      // Remove oldest entry when at limit
      const firstKey = endpoint.breaker.errorCounts.keys().next().value;
      endpoint.breaker.errorCounts.delete(firstKey);
    }
    endpoint.breaker.errorCounts.set(
      errorInfo.type,
      (endpoint.breaker.errorCounts.get(errorInfo.type) || 0) + 1
    );
    
    // Handle different error types with appropriate responses
    switch (errorInfo.type) {
      case 'rate_limit':
        this.handleRateLimitError(endpoint, errorInfo);
        break;
        
      case 'timeout':
        this.handleTimeoutError(endpoint, errorInfo);
        break;
        
      case 'network':
      case 'server_error':
        this.handleActualFailure(endpoint, errorInfo);
        break;
        
      case 'response_error':
      case 'unknown':
        this.handleUnknownFailure(endpoint, errorInfo);
        break;
        
      case 'no_endpoints':
        // No specific endpoint failure handling needed
        break;
    }
    
    // Determine if request should be retried
    return this.shouldRetryRequest(request, errorInfo, endpoint);
  }
  
  handleRateLimitError(endpoint, errorInfo) {
    // Rate limit errors should NOT open circuit breaker
    // Instead, reduce available rate limit tokens temporarily
    if (endpoint.rateLimiter) {
      endpoint.rateLimiter.tokens = Math.max(0, endpoint.rateLimiter.tokens - 10);
    }
    
    // Apply temporary backoff without circuit breaker impact
    endpoint.rateLimitBackoff = {
      until: Date.now() + 5000, // 5 second backoff
      multiplier: (endpoint.rateLimitBackoff?.multiplier || 1) * 1.5
    };
    
    // Log rate limit event but don't count toward circuit breaker
    if (this.config.debug) {
      console.log(`Rate limit backoff applied to endpoint ${endpoint.index}`);
    }
  }

  handleTimeoutError(endpoint, errorInfo) {
    // ISOLATED TIMEOUT HANDLING (Fix 15)
    // Use endpoint-specific load instead of global system load
    const endpointLoad = endpoint.stats.inFlight / endpoint.config.maxConcurrent;
    
    if (endpointLoad > 0.8) {
      // High endpoint load - timeout likely due to endpoint overload
      endpoint.loadTimeouts = (endpoint.loadTimeouts || 0) + 1;
      
      // Only count toward this endpoint's circuit breaker if excessive
      if (endpoint.loadTimeouts > 10) {
        this.incrementCircuitBreakerFailure(endpoint, 0.5); // Half weight for this endpoint only
      }
    } else {
      // Low endpoint load - timeout likely indicates endpoint-specific problem
      this.incrementCircuitBreakerFailure(endpoint, 1.0); // Full weight for this endpoint only
    }
  }

  handleActualFailure(endpoint, errorInfo) {
    // These are real endpoint failures that should impact circuit breaker
    this.incrementCircuitBreakerFailure(endpoint, 1.0);
    
    // Set last failure time for circuit breaker cooldown calculations
    endpoint.breaker.lastFailure = Date.now();
  }

  handleUnknownFailure(endpoint, errorInfo) {
    // Conservative approach - count toward circuit breaker but with reduced weight
    this.incrementCircuitBreakerFailure(endpoint, 0.7);
  }

  incrementCircuitBreakerFailure(endpoint, weight = 1.0) {
    if (!this.config.breakerEnabled) return;
    
    // ISOLATED PER-ENDPOINT CIRCUIT BREAKER (Fix 15)
    // Each endpoint tracks its own failures independently
    endpoint.breaker.failures += weight;
    endpoint.breaker.consecutiveSuccesses = 0;
    
    // Per-endpoint threshold calculation (no global state influence)
    const baseThreshold = 5;
    
    // Calculate endpoint-specific load factor based on its own utilization
    const endpointLoadFactor = endpoint.stats.inFlight / endpoint.config.maxConcurrent;
    const endpointAdjustedThreshold = baseThreshold * (1 + endpointLoadFactor * 0.5); // Endpoint-specific adjustment
    
    // Only transition this specific endpoint's breaker state
    if (endpoint.breaker.failures >= endpointAdjustedThreshold && endpoint.breaker.state === 'CLOSED') {
      endpoint.breaker.state = 'OPEN';
      endpoint.breaker.openedAt = Date.now();
      endpoint.breaker.cooldownMs = Math.min(60000, 10000 * Math.pow(1.5, endpoint.breaker.openCount || 0));
      endpoint.breaker.openCount = (endpoint.breaker.openCount || 0) + 1;
      
      if (this.config.debug) {
        console.log(`Circuit breaker OPENED for endpoint ${endpoint.index}, cooldown: ${endpoint.breaker.cooldownMs}ms`);
      }
      
      this.emit('breaker-open', endpoint.index);
    }
  }

  shouldRetryRequest(request, errorInfo, endpoint) {
    // Don't retry if too many attempts already
    if (request.attempts >= 3) {
      return false;
    }
    
    // Retry logic based on error type
    switch (errorInfo.type) {
      case 'rate_limit':
        return true; // Always retry rate limit errors with backoff
        
      case 'timeout':
        // Retry timeouts unless they're excessive
        return (endpoint.loadTimeouts || 0) < 5;
        
      case 'network':
        return false; // Network errors unlikely to resolve quickly
        
      case 'server_error':
        return Math.random() > 0.5; // 50% retry chance for server errors
        
      case 'no_endpoints':
        return false; // Can't retry if no endpoints available
        
      default:
        return true; // Conservative retry for unknown errors
    }
  }

  classifyError(error) {
    const message = error.message.toLowerCase();
    const status = error.status || error.statusCode;
    
    // Rate limiting - should trigger backoff, not circuit opening
    if (status === 429 || message.includes('rate limit') || message.includes('too many requests') || message.includes('rps limit')) {
      return { type: 'rate_limit', severity: 'temporary', circuitImpact: 'none' };
    }
    
    // Timeout errors - context dependent
    if (message.includes('timeout') || message.includes('etimedout')) {
      return { type: 'timeout', severity: 'moderate', circuitImpact: 'conditional' };
    }
    
    // Network connectivity issues - actual failures
    if (message.includes('econnrefused') || message.includes('enotfound') || 
        message.includes('network') || message.includes('dns')) {
      return { type: 'network', severity: 'high', circuitImpact: 'immediate' };
    }
    
    // Server errors - distinguish between types
    if (status >= 500 || message.includes('500') || message.includes('502') || 
        message.includes('503') || message.includes('504')) {
      return { type: 'server_error', severity: 'high', circuitImpact: 'gradual' };
    }
    
    // Invalid response/parsing errors
    if (message.includes('invalid json') || message.includes('parse') || 
        message.includes('malformed')) {
      return { type: 'response_error', severity: 'moderate', circuitImpact: 'gradual' };
    }
    
    // No available endpoints
    if (message.includes('no available endpoints')) {
      return { type: 'no_endpoints', severity: 'temporary', circuitImpact: 'none' };
    }
    
    // Unknown errors - treat conservatively
    return { type: 'unknown', severity: 'moderate', circuitImpact: 'gradual' };
  }
  
  updateStats(endpoint, success, latency) {
    // Update endpoint stats
    endpoint.stats.calls++;
    endpoint.stats.inFlight--;
    
    if (success) {
      endpoint.stats.successes++;
      endpoint.stats.totalLatency += latency;
      
      // Enforce bounded latency array (ring buffer behavior)
      if (endpoint.stats.latencies.length >= MAX_SAMPLES) {
        endpoint.stats.latencies.shift();
      }
      endpoint.stats.latencies.push(latency);
      
      // Update health
      endpoint.health.latency = latency;
      
      // Don't emit events to prevent listener accumulation
    } else {
      endpoint.stats.failures++;
    }
    
    // Update global stats with aggressive cleanup
    this.stats.calls++;
    if (success) {
      this.stats.successes++;
      
      // Keep only last 100 samples globally (reduced from 1000)
      const MAX_GLOBAL = 100;
      if (!this.stats.latencies) {
        this.stats.latencies = [];
      }
      if (this.stats.latencies.length >= MAX_GLOBAL) {
        // Drop half when full to reduce churn
        this.stats.latencies = this.stats.latencies.slice(-50);
      }
      this.stats.latencies.push(latency);
    } else {
      this.stats.failures++;
    }
    
    // Periodic stats reset to prevent unbounded growth
    if (this.stats.calls > 100000) {
      this.stats.calls = Math.floor(this.stats.calls / 2);
      this.stats.successes = Math.floor(this.stats.successes / 2);
      this.stats.failures = Math.floor(this.stats.failures / 2);
      
      // Reset endpoint stats too
      for (const ep of this.endpoints) {
        ep.stats.calls = Math.floor(ep.stats.calls / 2);
        ep.stats.successes = Math.floor(ep.stats.successes / 2);
        ep.stats.failures = Math.floor(ep.stats.failures / 2);
      }
    }
  }
  
  processQueue() {
    // Optimized single-pass expired request removal
    if (this.requestQueue.length > 0) {
      const now = Date.now();
      const deadline = this.config.queueDeadline;
      
      // Single-pass pruning with early exit
      let writeIndex = 0;
      for (let readIndex = 0; readIndex < this.requestQueue.length; readIndex++) {
        const request = this.requestQueue[readIndex];
        if (now - request.timestamp > deadline) {
          // Expired - drop and clean up
          this.stats.dropped++;
          if (request.deferred) {
            request.deferred.reject(new Error('Request expired in queue'));
          }
          // Immediate cleanup
          request.method = null;
          request.params = null;
          request.options = null;
          request.deferred = null;
        } else {
          // Keep valid request
          if (writeIndex !== readIndex) {
            this.requestQueue[writeIndex] = request;
          }
          writeIndex++;
        }
      }
      
      // Trim array if we removed items
      if (writeIndex < this.requestQueue.length) {
        this.requestQueue.length = writeIndex;
      }
    }
    
    // Process remaining valid requests
    while (this.requestQueue.length > 0 && this.globalInFlight < this.config.maxGlobalInFlight) {
      const request = this.requestQueue.shift();
      
      // Double-check expiration
      if (Date.now() - request.timestamp > this.config.queueDeadline) {
        this.stats.dropped++;
        request.deferred.reject(new Error('Request expired in queue'));
        // Clean up
        request.method = null;
        request.params = null;
        request.options = null;
        request.deferred = null;
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
  
  startLeakGuard() {
    // Run leak guard every 60 seconds to clean up stuck resources
    const leakGuardInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(leakGuardInterval);
        return;
      }
      
      try {
        // Enforce bounds on circuit breakers and latencies
        for (const endpoint of this.endpoints) {
          // Hard reset error counts periodically (reduced from 50 to 10)
          if (endpoint.breaker.errorCounts && endpoint.breaker.errorCounts.size > 10) {
            endpoint.breaker.errorCounts.clear();
          }
          
          // Latency bounds already enforced at insertion
          if (endpoint.stats.latencies.length > MAX_SAMPLES) {
            endpoint.stats.latencies = endpoint.stats.latencies.slice(-MAX_SAMPLES);
          }
        }
        
        // Aggressive cleanup of global stats (reduced from 1000 to 100)
        if (this.stats.latencies && this.stats.latencies.length > 100) {
          this.stats.latencies = this.stats.latencies.slice(-50);
        }
        
        // Reset request ID periodically to prevent overflow
        if (this.requestId > 1000000) {
          this.requestId = 0;
        }
        
        // Clear coalescing cache
        if (this.coalescingCache && this.coalescingCache.cache.size > 100) {
          this.coalescingCache.cache.clear();
        }
        
        // Clear batch manager pending batches
        if (this.batchManager && this.batchManager.pendingBatches.size > 10) {
          this.batchManager.pendingBatches.clear();
        }
        
        // Clear hedge manager active hedges
        if (this.hedgeManager && this.hedgeManager.activeHedges.size > 10) {
          this.hedgeManager.activeHedges.clear();
        }
        
        // Periodically recreate agents to prevent connection accumulation
        if (Math.random() < 0.2) { // 20% chance every 15 seconds
          this.agents.forEach(agent => {
            if (agent && agent.destroy) {
              agent.destroy();
            }
          });
          this.agents.clear();
          this.initializeAgents();
        }
        
        // Force prune the request queue if it's getting too large
        if (this.requestQueue.length > MAX_QUEUE) {
          const now = Date.now();
          const deadline = this.config.queueDeadline;
          
          this.requestQueue = this.requestQueue.filter(request => {
            if (now - request.timestamp > deadline) {
              this.stats.dropped++;
              if (request.deferred) {
                request.deferred.reject(new Error('Request expired in queue (leak guard)'));
              }
              // Clean up request
              request.method = null;
              request.params = null;
              request.options = null;
              request.deferred = null;
              return false;
            }
            return true;
          });
        }
        
        // Force GC every time (was 10% chance)
        if (global.gc) {
          setImmediate(() => {
            try { global.gc(true); } catch (e) { /* ignore */ }
          });
        }
        
      } catch (error) {
        // Ignore errors in leak guard
      }
    }, 15000); // Every 15 seconds for aggressive cleanup
    
    // Ensure the interval doesn't keep the process alive
    if (leakGuardInterval.unref) {
      leakGuardInterval.unref();
    }
    
    // Store reference for cleanup
    this.leakGuardTimer = leakGuardInterval;
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
      coalescing: this.coalescingCache.getStats(),
      batching: this.batchManager.getStats(),
      hedging: this.hedgeManager.getStats(),
      endpoints: this.endpoints.map(ep => {
        const rateLimitStatus = ep.rateLimiter.getStatus();
        return {
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
          rateLimit: `${rateLimitStatus.tokens}/${rateLimitStatus.maxTokens}`,
          rateLimitUtilization: rateLimitStatus.utilization
        };
      })
    };
  }
  
  getLoadDistribution() {
    const distribution = {};
    let totalRequests = 0;
    
    for (const endpoint of this.endpoints) {
      const requests = endpoint.stats.calls;
      totalRequests += requests;
      distribution[endpoint.url] = {
        requests,
        percentage: 0, // Calculate after total known
        inFlight: endpoint.stats.inFlight,
        capacity: endpoint.config.maxConcurrent,
        utilization: (endpoint.stats.inFlight / endpoint.config.maxConcurrent * 100).toFixed(1) + '%'
      };
    }
    
    // Calculate percentages
    for (const url in distribution) {
      distribution[url].percentage = totalRequests > 0 
        ? ((distribution[url].requests / totalRequests) * 100).toFixed(1) + '%'
        : '0%';
    }
    
    return distribution;
  }
  
  /**
   * Health check for orchestrator integration
   * Returns health status quickly (<100ms)
   */
  async healthCheck() {
    try {
      // Check if we have any healthy endpoints
      const healthyEndpoints = this.endpoints.filter(ep => ep.health.healthy);
      if (healthyEndpoints.length === 0) {
        return {
          healthy: false,
          error: 'No healthy endpoints available',
          details: {
            totalEndpoints: this.endpoints.length,
            healthyEndpoints: 0
          }
        };
      }
      
      // Check if pool is destroyed
      if (this.isDestroyed) {
        return {
          healthy: false,
          error: 'Pool is destroyed'
        };
      }
      
      // Return healthy if we have at least one working endpoint
      const stats = this.getStats();
      return {
        healthy: true,
        details: {
          healthyEndpoints: healthyEndpoints.length,
          totalEndpoints: this.endpoints.length,
          successRate: stats.global.successRate,
          inFlight: stats.global.inFlight,
          queuedRequests: this.requestQueue.length
        }
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
  
  /**
   * Health check alias for health monitor compatibility
   */
  async isHealthy() {
    const result = await this.healthCheck();
    return result.healthy;
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
    
    if (this.leakGuardTimer) {
      clearInterval(this.leakGuardTimer);
      this.leakGuardTimer = null;
    }
    
    // Reject pending requests
    for (const request of this.requestQueue) {
      request.deferred.reject(new Error('Pool destroyed'));
    }
    this.requestQueue = [];
    
    // Clear batch manager
    this.batchManager.clear();
    
    // Clear coalescing cache
    this.coalescingCache.clear();
    
    // Clear hedge manager
    this.hedgeManager.clear();
    
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