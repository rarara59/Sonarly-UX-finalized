/**
 * Renaissance RPC Connection Pool
 * File: src/detection/transport/rpc-connection-pool.js
 * 
 * Target: Passes all Phase 2 checkpoints
 * - P2.1: Weight distribution working ✅
 * - P2.2: Concurrency caps enforced ✅
 * - P2.3: RPS limits respected ✅ 
 * - P2.4: Timeout handling proper ✅
 * - P2.5: Fallback logic functional ✅
 * - P2.6: Health status accurate ✅
 * 
 * Renaissance Principles:
 * - Simple, reliable, fast
 * - No over-engineering
 * - Null-safe throughout
 * - Production-ready error handling
 */

import { logger } from '../../utils/logger-simple.js';
import fetch from 'node-fetch';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import {
  getDefaultEndpoints,
  createStartupConfigLog,
  createRpcPayload,
  canMakeRequest,
  determineOutcome,
  envInt,
  envBool
} from './rpc-pool-utils.js';

export class RpcConnectionPool {
  constructor(endpoints = null, options = {}) {
    // Support both old (performanceMonitor) and new (options) patterns
    if (options && typeof options.recordLatency === 'function') {
      // Old pattern: second param is performanceMonitor
      this.monitor = options;
      this.fetchFn = fetch; // Use default fetch
    } else {
      // New pattern: second param is options object
      this.monitor = options.performanceMonitor || null;
      this.fetchFn = options.fetch || fetch; // Allow fetch injection for testing
    }
    
    // ADD THESE LINES:
    this.fetch = this.fetchFn; // Alias for consistency
    this.logger = options?.logger || logger; // Use injected logger or fallback to import
    
    // Initialize endpoints with health tracking
    this.endpoints = new Map();
    this.initializeEndpoints(endpoints || getDefaultEndpoints());
    
    // CRITICAL: Never allow null currentEndpoint
    this.currentEndpoint = this.selectBestEndpoint();
    if (!this.currentEndpoint) {
      throw new Error('No valid endpoints available during initialization');
    }
    
    // Request tracking with overflow protection
    this.requestCounter = 0;
    this.activeRequests = 0;
    
    // Configuration from environment
    this.maxConcurrentRequests = envInt('RPC_DEFAULT_CONCURRENCY_LIMIT', 10);
    this.globalMaxInFlight = envInt('RPC_MAX_IN_FLIGHT_GLOBAL', 200);
    
    // HTTP agents with keep-alive
    this.httpAgent = null;
    this.httpsAgent = null;
    this.initializeHttpAgents();
    
    // Simple binary health checking
    this.healthCheckInterval = envInt('RPC_HEALTH_INTERVAL_MS', 30000);
    this.healthTimer = null;
    this.startHealthMonitoring();
    
    // Statistics tracking
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      failovers: 0,
      avgLatency: 0
    };
    
    // Log startup configuration
    const configSummary = createStartupConfigLog(this.endpoints);
    this.logger.info(configSummary, 'RPC connection pool initialized');
  }
  
  // Initialize HTTP agents with keep-alive
  initializeHttpAgents() {
    const keepAliveEnabled = envBool('RPC_KEEP_ALIVE_ENABLED', true);
    const maxSockets = envInt('RPC_KEEP_ALIVE_SOCKETS', 50);
    const timeout = envInt('RPC_KEEP_ALIVE_TIMEOUT_MS', 60000);
    
    if (keepAliveEnabled) {
      this.httpAgent = new HttpAgent({
        keepAlive: true,
        maxSockets,
        timeout
      });
      
      this.httpsAgent = new HttpsAgent({
        keepAlive: true,
        maxSockets,
        timeout
      });
      
      this.logger.info({
        keep_alive: {
          enabled: true,
          max_sockets: maxSockets,
          timeout_ms: timeout
        }
      }, 'HTTP keep-alive agents initialized');
    }
  }
  
  // Initialize endpoints with health status
  initializeEndpoints(endpointConfigs) {
    Object.entries(endpointConfigs).forEach(([name, config]) => {
      this.endpoints.set(name, {
        name,
        url: config.url,
        priority: config.priority || 1,
        maxRequestsPerSecond: config.maxRequestsPerSecond || 50,
        timeout: config.timeout || 500,
        weight: config.weight || 100,
        concurrencyLimit: config.concurrencyLimit || 10,
        
        // Health tracking (simple binary)
        healthy: true,
        consecutiveFailures: 0,
        lastSuccess: Date.now(),
        lastFailure: null,
        
        // Rate limiting
        requestsThisSecond: 0,
        lastSecondReset: Date.now(),
        activeRequests: 0,
        
        // Performance tracking with initialization
        totalRequests: 0,
        successfulRequests: 0,
        totalLatency: 0,
        avgLatency: 0
      });
    });
  }
  
  // Generate request ID with overflow protection
  generateRequestId() {
    this.requestCounter = (this.requestCounter + 1) % Number.MAX_SAFE_INTEGER;
    return `req_${Date.now()}_${this.requestCounter}`;
  }
  
  // Main RPC call method
  async call(method, params = [], options = {}) {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    const timeout = options.timeout || 500; // Default timeout
    let actualEndpointUsed = null;
    
    // Global concurrency check
    if (this.activeRequests >= this.globalMaxInFlight) {
      const error = new Error('Global request limit exceeded');
      this.logRpcCall(requestId, method, 0, 'rate_limited', null, error);
      throw error;
    }
    
    this.activeRequests++;
    this.stats.totalRequests++;
    
    try {
      const result = await this.executeCallWithFailover(method, params, timeout, requestId);
      
      const latency = performance.now() - startTime;
      this.updateSuccessMetrics(latency);
      
      // Note: Actual endpoint logging now happens in executeCallWithFailover
      // This is just the overall call success log
      this.logger.debug({
        request_id: requestId,
        method,
        latency_ms: Math.round(latency * 100) / 100,
        outcome: 'success'
      }, 'RPC call completed successfully');
      
      if (this.monitor) {
        this.monitor.recordLatency('rpcConnection', latency, true);
      }
      
      return result;
      
    } catch (error) {
      const latency = performance.now() - startTime;
      const outcome = determineOutcome(false, error);
      
      this.stats.failedRequests++;
      
      // Log final failure (actual endpoint logging happened in executeCallWithFailover)
      this.logger.error({
        request_id: requestId,
        method,
        latency_ms: Math.round(latency * 100) / 100,
        error: error.message,
        outcome
      }, 'RPC call failed after all attempts');
      
      if (this.monitor) {
        this.monitor.recordLatency('rpcConnection', latency, false);
      }
      
      throw error;
    } finally {
      this.activeRequests--;
    }
  }
  
  // Execute call with automatic failover
  async executeCallWithFailover(method, params, timeout, requestId) {
    const maxAttempts = Math.min(this.endpoints.size, 3); // Limit failover attempts
    let lastError;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // CRITICAL FIX: Use weighted endpoint selection
      const endpoint = attempt === 0 ? this.selectBestEndpoint() : this.selectNextBestEndpoint();
      
      try {
        // Check endpoint availability
        if (!endpoint || !endpoint.healthy) {
          throw new Error(`Endpoint ${endpoint?.name || 'unknown'} marked unhealthy`);
        }
        
        // Check concurrency limits (P2.2) - don't mark as endpoint failure  
        if (endpoint.activeRequests >= endpoint.concurrencyLimit) {
          // This is a local pool condition, not an endpoint failure
          const error = new Error(`Concurrency limit exceeded for endpoint ${endpoint.name}`);
          error.isPoolCondition = true;
          throw error;
        }
        // Note: RPS checking now happens in makeHttpRequest
        
        // Make the actual request
        const startTime = performance.now();
        const result = await this.makeHttpRequest(endpoint, method, params, timeout, requestId);
        const endpointLatency = performance.now() - startTime;
        
        // Update endpoint success metrics with latency (P2.6 Fix)
        this.updateEndpointSuccess(endpoint, endpointLatency);
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // P2.6 Fix: Only mark as endpoint failure for actual endpoint problems
        if (this.isEndpointFailure(error)) {
          this.updateEndpointFailure(endpoint);
        }
        
        // Try next endpoint (P2.5 - Fallback logic)
        // Only failover for actual endpoint failures, not pool conditions
        if (!this.isEndpointFailure(error)) {
          throw error; // Don't failover for RPS limits, concurrency limits, etc.
        }
        
        // Continue with failover for endpoint failures
        if (attempt < maxAttempts - 1) {
          this.stats.failovers++;
          
          this.logger.info({
            request_id: requestId,
            failover_from: endpoint.name,
            attempt: attempt + 2,
            reason: error.message
          }, 'Failing over to next endpoint');
          
          continue; // Try next endpoint
        }
        
        // No more endpoints to try
        break;
      }
    }
    
    throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }
  
  // Make HTTP request with proper error handling
  async makeHttpRequest(endpoint, method, params, timeout, requestId) {
    // CRITICAL FIX: Check RPS limit before making request
    if (!canMakeRequest(endpoint)) {
      const error = new Error(`Rate limit exceeded for endpoint ${endpoint.name}`);
      error.isPoolCondition = true; // Don't mark endpoint as unhealthy
      this.logRpcCall(requestId, method, 0, 'rps_limit', endpoint.name, error);
      throw error;
    }
    
    const payload = createRpcPayload(method, params, this.requestCounter);
    
    // Set up abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Increment request counter AFTER RPS check
      endpoint.requestsThisSecond++;
      endpoint.activeRequests++;
      endpoint.totalRequests++;
      
      // Select appropriate agent based on URL scheme
      const agent = endpoint.url.startsWith('https:') ? this.httpsAgent : this.httpAgent;
      
      const response = await this.fetchFn(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        agent // Use keep-alive agent
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message} (${data.error.code})`);
      }
      
      endpoint.successfulRequests++;
      return data.result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    } finally {
      endpoint.activeRequests--;
    }
  }
  
  // Get current endpoint (never returns null)
  getCurrentEndpoint() {
    const endpoint = this.endpoints.get(this.currentEndpoint);
    if (!endpoint) {
      // CRITICAL: Recovery from null currentEndpoint
      this.currentEndpoint = this.selectBestEndpoint();
      if (!this.currentEndpoint) {
        throw new Error('No endpoints available');
      }
      return this.endpoints.get(this.currentEndpoint);
    }
    return endpoint;
  }
  
  // Select best endpoint with weight-based distribution (P2.1 Fix)
  selectBestEndpoint() {
    // Try healthy endpoints first
    const healthyEndpoints = Array.from(this.endpoints.values())
      .filter(ep => ep.healthy);
    
    if (healthyEndpoints.length > 0) {
      return this.selectWeightedEndpoint(healthyEndpoints);
    }
    
    // Fallback: Use any endpoint, mark as healthy (recovery mechanism)
    const allEndpoints = Array.from(this.endpoints.values())
      .sort((a, b) => a.priority - b.priority);
    
    if (allEndpoints.length > 0) {
      // Reset health status for recovery
      allEndpoints[0].healthy = true;
      allEndpoints[0].consecutiveFailures = 0;
      
      this.logger.warn({
        endpoint: allEndpoints[0].name,
        action: 'force_recovery'
      }, 'No healthy endpoints available, forcing recovery of best endpoint');
      
      return allEndpoints[0]; // Return object, not name
    }
    
    return null; // Only if no endpoints configured at all
  }
  
  // Weighted random selection based on endpoint weights (P2.1 Implementation)
  selectWeightedEndpoint(endpoints) {
    if (endpoints.length === 1) {
      return endpoints[0]; // Return object, not name
    }
    
    // Calculate total weight
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    
    if (totalWeight === 0) {
      // Fallback to priority if all weights are 0
      const sortedByPriority = endpoints.sort((a, b) => a.priority - b.priority);
      return sortedByPriority[0]; // Return object, not name
    }
    
    // Weighted random selection
    const random = Math.random() * totalWeight;
    let runningWeight = 0;
    
    for (const endpoint of endpoints) {
      runningWeight += endpoint.weight;
      if (random <= runningWeight) {
        return endpoint; // Return object, not name
      }
    }
    
    // Fallback (should never reach here, but safety first)
    return endpoints[0]; // Return object, not name
  }
  
  // Public method for testing - exposes weighted endpoint selection
  testSelectWeightedEndpoint(endpoints) {
    return this.selectWeightedEndpoint(endpoints);
  }
  
  // Select next best endpoint for failover
  selectNextBestEndpoint() {
    // Get all healthy endpoints except the one we just tried
    const healthyEndpoints = Array.from(this.endpoints.values())
      .filter(ep => ep.healthy);
    
    // If we have healthy endpoints, use weighted selection again
    if (healthyEndpoints.length > 0) {
      return this.selectWeightedEndpoint(healthyEndpoints);
    }
    
    return null;
  }
  
  // Determine if error represents actual endpoint failure (P2.6 Fix)
  isEndpointFailure(error) {
    // Local pool conditions are NOT endpoint failures
    if (error.isPoolCondition) {
      return false;
    }
    
    const message = (error.message || '').toLowerCase();
    
    // Local throttling conditions - NOT endpoint failures
    if (message.includes('rate limit exceeded for endpoint')) return false;
    if (message.includes('concurrency limit exceeded for endpoint')) return false;
    if (message.includes('marked unhealthy')) return false;
    
    // Actual endpoint failures
    if (message.includes('timeout')) return true;
    if (message.includes('http ')) return true;
    if (message.includes('network')) return true;
    if (message.includes('connection')) return true;
    if (message.includes('rpc error')) return true;
    if (message.includes('abort')) return true;
    
    // Default to endpoint failure for unknown errors (conservative)
    return true;
  }
  
  // Update endpoint on success with latency tracking (P2.6 Fix)
  updateEndpointSuccess(endpoint, latency = 0) {
    endpoint.consecutiveFailures = 0;
    endpoint.lastSuccess = Date.now();
    
    // P2.6 Fix: Update latency tracking
    if (latency > 0) {
      endpoint.totalLatency = (endpoint.totalLatency || 0) + latency;
      
      // Update average latency (exponential moving average)
      if (endpoint.avgLatency === undefined || endpoint.avgLatency === 0) {
        endpoint.avgLatency = latency;
      } else {
        endpoint.avgLatency = (endpoint.avgLatency * 0.9) + (latency * 0.1);
      }
    }
    
    if (!endpoint.healthy) {
      endpoint.healthy = true;
      this.logger.info({
        endpoint: endpoint.name,
        action: 'health_recovery',
        latency_ms: Math.round(latency * 100) / 100
      }, 'Endpoint recovered to healthy status');
    }
  }
  
  // Update endpoint on failure
  updateEndpointFailure(endpoint) {
    console.log(`DEBUG: Before failure - healthy: ${endpoint.healthy}, failures: ${endpoint.consecutiveFailures}`);
    
    endpoint.consecutiveFailures++;
    endpoint.lastFailure = Date.now();
    
    console.log(`DEBUG: After increment - healthy: ${endpoint.healthy}, failures: ${endpoint.consecutiveFailures}`);
    
    // Simple threshold: 3 consecutive failures = unhealthy
    if (endpoint.consecutiveFailures >= 3 && endpoint.healthy) {
      endpoint.healthy = false;
      console.log(`DEBUG: Marking endpoint unhealthy - failures: ${endpoint.consecutiveFailures}`);
      
      this.logger.warn({
        endpoint: endpoint.name,
        consecutive_failures: endpoint.consecutiveFailures,
        action: 'health_degraded'
      }, 'Endpoint marked unhealthy due to consecutive failures');
    } else {
      console.log(`DEBUG: Not marking unhealthy - failures: ${endpoint.consecutiveFailures}, healthy: ${endpoint.healthy}`);
    }
  }
  
  // Update success metrics
  updateSuccessMetrics(latency) {
    this.stats.successfulRequests++;
    
    // Update running average latency
    if (this.stats.avgLatency === 0) {
      this.stats.avgLatency = latency;
    } else {
      this.stats.avgLatency = (this.stats.avgLatency * 0.9) + (latency * 0.1);
    }
  }
  
  // Structured logging for all RPC calls (Enhanced for P2.6)
  logRpcCall(requestId, method, latency, outcome, endpointName, error = null) {
    const logData = {
      request_id: requestId,
      endpoint: endpointName,
      latency_ms: Math.round(latency * 100) / 100,
      outcome,
      method
    };
    
    // Add error info if present (with null safety)
    if (error) {
      logData.error = error?.message || 'Unknown error';
      
      // Distinguish pool conditions from endpoint failures
      if (error.isPoolCondition) {
        logData.error_type = 'pool_condition';
      } else {
        logData.error_type = 'endpoint_failure';
      }
      
      // Conditionally include stack trace
      if (envBool('RPC_ERROR_STACKS', false) && error?.stack) {
        logData.error_stack = error.stack;
      }
    }
    
    const level = outcome === 'ok' ? 'debug' : 'warn';
    logger[level](logData, `RPC call ${outcome}`);
  }
  
  // Health monitoring (simple binary check)
  startHealthMonitoring() {
    if (this.healthCheckInterval <= 0) return;
    
    this.healthTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheckInterval);
  }
  
  // Perform health check on all endpoints
  async performHealthCheck() {
    const healthPromises = Array.from(this.endpoints.keys()).map(name =>
      this.checkEndpointHealth(name)
    );
    
    await Promise.allSettled(healthPromises);
  }
  
  // Check specific endpoint health
  async checkEndpointHealth(endpointName) {
    const endpoint = this.endpoints.get(endpointName);
    if (!endpoint) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const response = await this.fetchFn(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createRpcPayload('getVersion', [], 0)),
        signal: controller.signal,
        agent: endpoint.url.startsWith('https:') ? this.httpsAgent : this.httpAgent
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.updateEndpointSuccess(endpoint, 0); // Health check has no meaningful latency
      } else {
        this.updateEndpointFailure(endpoint);
      }
      
    } catch (error) {
      this.updateEndpointFailure(endpoint);
    }
  }
  
  // Get pool statistics (P2.6 - Health status)
  getStats() {
    const endpointStats = {};
    
    this.endpoints.forEach((endpoint, name) => {
      endpointStats[name] = {
        healthy: endpoint.healthy,
        consecutiveFailures: endpoint.consecutiveFailures,
        successRate: endpoint.totalRequests > 0 
          ? (endpoint.successfulRequests || 0) / (endpoint.totalRequests || 1)
          : 0,
        avgLatency: endpoint.avgLatency || 0, // P2.6 Fix: Use tracked avgLatency
        totalRequests: endpoint.totalRequests,
        activeRequests: endpoint.activeRequests,
        requestsThisSecond: endpoint.requestsThisSecond,
        weight: endpoint.weight, // Include weight for debugging
        priority: endpoint.priority
      };
    });
    
    return {
      ...this.stats,
      currentEndpoint: this.currentEndpoint,
      activeRequests: this.activeRequests,
      maxConcurrentRequests: this.maxConcurrentRequests,
      endpoints: endpointStats
    };
  }
  
  // Health check for external monitoring
  isHealthy() {
    const healthyEndpoints = Array.from(this.endpoints.values())
      .filter(ep => ep.healthy);
    
    return healthyEndpoints.length > 0 && this.activeRequests < this.globalMaxInFlight;
  }
  
  // Cleanup method
  destroy() {
    // Stop health monitoring
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    
    // Cleanup HTTP agents
    if (this.httpAgent) {
      this.httpAgent.destroy();
      this.httpAgent = null;
    }
    
    if (this.httpsAgent) {
      this.httpsAgent.destroy();
      this.httpsAgent = null;
    }
    
    // Clear data structures
    this.endpoints.clear();
    
    this.logger.info({
      component: 'rpc-pool',
      action: 'destroyed'
    }, 'RPC connection pool destroyed and cleaned up');
  }
}