/**
 * Fault-Tolerant RPC Connection Pool
 * Target: <5ms connection switching, 99.9% availability
 * 250 lines - Multi-endpoint failover with load balancing
 */

export class RpcConnectionPool {
  constructor(endpoints, performanceMonitor = null) {
    this.monitor = performanceMonitor;
    
    // Performance tracking (must be initialized first)
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      failovers: 0,
      avgLatency: 0,
      endpointStats: new Map()
    };
    
    // Initialize endpoints with health status
    this.endpoints = new Map();
    this.initializeEndpoints(endpoints || this.getDefaultEndpoints());
    
    // Connection management
    this.currentEndpoint = this.selectBestEndpoint();
    this.requestId = 1;
    this.healthCheckInterval = 30000; // 30 seconds
    this.failoverThreshold = 3; // Failed requests before failover
    
    // Request queue for rate limiting
    this.requestQueue = [];
    this.maxConcurrentRequests = 50;
    this.activeRequests = 0;
    
    // Start health monitoring
    this.startHealthMonitoring();
  }
  
  // Get default RPC endpoints with priorities
  getDefaultEndpoints() {
    const heliusUrl = process.env.HELIUS_RPC_URL;
    const chainstackUrl = process.env.CHAINSTACK_RPC_URL;
    if (!heliusUrl || !chainstackUrl) {
      throw new Error("Required RPC endpoints missing: HELIUS_RPC, CHAINSTACK_RPC");
    }
    return {
      helius: {
        url: heliusUrl,
        priority: 1,
        maxRequestsPerSecond: 100,
        timeout: 500
      },
      chainstack: {
        url: chainstackUrl,
        priority: 2,
        maxRequestsPerSecond: 50,
        timeout: 800
      },
      public: {
        url: 'https://api.mainnet-beta.solana.com',
        priority: 3,
        maxRequestsPerSecond: 10,
        timeout: 1500
      }
    };
  }
  
  // Initialize endpoint configurations
  initializeEndpoints(endpointConfigs) {
    Object.entries(endpointConfigs).forEach(([name, config]) => {
      this.endpoints.set(name, {
        name,
        url: config.url,
        priority: config.priority,
        maxRequestsPerSecond: config.maxRequestsPerSecond || 50,
        timeout: config.timeout || 500,
        health: 'healthy',
        consecutiveFailures: 0,
        lastFailure: null,
        lastSuccess: Date.now(),
        totalRequests: 0,
        successfulRequests: 0,
        avgLatency: 0,
        requestsThisSecond: 0,
        lastSecondReset: Date.now()
      });
      
      this.stats.endpointStats.set(name, {
        requests: 0,
        successes: 0,
        failures: 0,
        avgLatency: 0
      });
    });
  }
  
  // Main RPC call method with automatic failover
  async call(method, params = [], options = {}) {
    const startTime = performance.now();
    const timeout = options.timeout || 500;
    
    try {
      this.stats.totalRequests++;
      
      // Wait for available slot if at max concurrency
      await this.waitForSlot();
      this.activeRequests++;
      
      const result = await this.executeCall(method, params, timeout);
      
      // Update success metrics
      const latency = performance.now() - startTime;
      this.updateSuccessMetrics(latency);
      
      if (this.monitor) {
        this.monitor.recordLatency('rpcConnection', latency, true);
      }
      
      return result;
      
    } catch (error) {
      const latency = performance.now() - startTime;
      this.handleCallFailure(error, latency);
      throw error;
    } finally {
      this.activeRequests--;
    }
  }
  
  // Execute RPC call with failover logic
  async executeCall(method, params, timeout) {
    let lastError;
    const attempts = Array.from(this.endpoints.values())
      .filter(ep => ep.health !== 'dead')
      .sort((a, b) => a.priority - b.priority);
    
    // Race healthy endpoints in parallel for speed
    const healthyEndpoints = attempts.filter(ep => ep.health === "healthy");
    if (healthyEndpoints.length > 1) {
      const racePromises = healthyEndpoints.map(ep => 
        this.makeRequest(ep, method, params, Math.min(timeout, 500))
      );
      try {
        const result = await Promise.race(racePromises);
        return result;
      } catch (raceError) {
        // Fall through to sequential failover
      }
    }
    
    for (const endpoint of attempts) {
      try {
        // Check rate limit
        if (!this.canMakeRequest(endpoint)) {
          continue;
        }
        
        const result = await this.makeRequest(endpoint, method, params, timeout);
        
        // Update endpoint health on success
        this.updateEndpointHealth(endpoint.name, true);
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.updateEndpointHealth(endpoint.name, false);
        
        // Try next endpoint
        continue;
      }
    }
    
    // All endpoints failed
    throw new Error(`All RPC endpoints failed. Last error: ${lastError.message}`);
  }
  
  // Make actual HTTP request to RPC endpoint
  async makeRequest(endpoint, method, params, timeout) {
    const requestPayload = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      endpoint.totalRequests++;
      endpoint.requestsThisSecond++;
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      
      endpoint.successfulRequests++;
      return data.result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }
  
  // Check if endpoint can handle more requests (rate limiting)
  canMakeRequest(endpoint) {
    const now = Date.now();
    
    // Reset per-second counter
    if (now - endpoint.lastSecondReset > 1000) {
      endpoint.requestsThisSecond = 0;
      endpoint.lastSecondReset = now;
    }
    
    return endpoint.requestsThisSecond < endpoint.maxRequestsPerSecond;
  }
  
  // Update endpoint health status
  updateEndpointHealth(endpointName, success) {
    const endpoint = this.endpoints.get(endpointName);
    if (!endpoint) return;
    
    if (success) {
      endpoint.consecutiveFailures = 0;
      endpoint.lastSuccess = Date.now();
      
      if (endpoint.health === 'degraded' || endpoint.health === 'dead') {
        endpoint.health = 'healthy';
        console.log(`Endpoint ${endpointName} recovered to healthy status`);
      }
    } else {
      endpoint.consecutiveFailures++;
      endpoint.lastFailure = Date.now();
      
      if (endpoint.consecutiveFailures >= this.failoverThreshold) {
        const oldHealth = endpoint.health;
        endpoint.health = endpoint.consecutiveFailures >= 10 ? 'dead' : 'degraded';
        
        if (oldHealth !== endpoint.health) {
          console.warn(`Endpoint ${endpointName} marked as ${endpoint.health}`);
          this.stats.failovers++;
          
          // Switch to better endpoint if current one is degraded
          if (endpointName === this.currentEndpoint) {
            this.currentEndpoint = this.selectBestEndpoint();
            console.log(`Switched to endpoint: ${this.currentEndpoint}`);
          }
        }
      }
    }
  }
  
  // Select best available endpoint
  selectBestEndpoint() {
    const healthyEndpoints = Array.from(this.endpoints.values())
      .filter(ep => ep.health === 'healthy')
      .sort((a, b) => a.priority - b.priority);
    
    if (healthyEndpoints.length > 0) {
      return healthyEndpoints[0].name;
    }
    
    // Fallback to least degraded endpoint
    const availableEndpoints = Array.from(this.endpoints.values())
      .filter(ep => ep.health !== 'dead')
      .sort((a, b) => a.priority - b.priority);
    
    return availableEndpoints.length > 0 ? availableEndpoints[0].name : null;
  }
  
  // Wait for available request slot
  async waitForSlot() {
    if (this.activeRequests < this.maxConcurrentRequests) {
      return;
    }
    
    return new Promise(resolve => {
      this.requestQueue.push(resolve);
      this.processQueue();
    });
  }
  
  // Process queued requests
  processQueue() {
    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const resolve = this.requestQueue.shift();
      if (typeof resolve !== "function") continue;
      resolve();
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
  
  // Handle call failure
  handleCallFailure(error, latency) {
    this.stats.failedRequests++;
    
    if (this.monitor) {
      this.monitor.recordLatency('rpcConnection', latency, false);
    }
    
    console.error('RPC call failed:', error.message);
  }
  
  // Start health monitoring
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
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
    try {
      await this.makeRequest(
        this.endpoints.get(endpointName),
        'getVersion',
        [],
        1000
      );
      this.updateEndpointHealth(endpointName, true);
    } catch (error) {
      this.updateEndpointHealth(endpointName, false);
    }
  }
  
  // Get current pool statistics
  getStats() {
    const endpointStatus = {};
    this.endpoints.forEach((endpoint, name) => {
      endpointStatus[name] = {
        health: endpoint.health,
        consecutiveFailures: endpoint.consecutiveFailures,
        successRate: endpoint.totalRequests > 0 
          ? Number(endpoint.successfulRequests) / Number(endpoint.totalRequests) 
          : 0,
        avgLatency: endpoint.avgLatency,
        totalRequests: endpoint.totalRequests
      };
    });
    
    return {
      ...this.stats,
      currentEndpoint: this.currentEndpoint,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      endpoints: endpointStatus
    };
  }
  
  // Health check for external monitoring
  isHealthy() {
    const healthyEndpoints = Array.from(this.endpoints.values())
      .filter(ep => ep.health === 'healthy');
    
    return healthyEndpoints.length > 0 && this.activeRequests < this.maxConcurrentRequests;
  }
}