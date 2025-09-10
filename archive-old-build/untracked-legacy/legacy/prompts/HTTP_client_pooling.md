# CRITICAL FIX: Extract HTTPClient Connection Pooling

## Problem Statement
Current RPC pool uses basic `fetch()` which creates new TCP connections for every request, adding 50-100ms connection overhead. Need to extract proven HTTPClient with connection pooling from monolith for persistent connections and connection reuse.

## Solution Overview
Extract HTTPClient class with HTTP/HTTPS agents, keep-alive connections, connection tracking, and optimized socket management for maximum RPC performance.

## Implementation

### File: `src/transport/http-client.js`

```javascript
/**
 * HTTP Client with Connection Pooling - Performance optimized
 * Keep-alive connections with socket management
 * Target: 50-100ms latency reduction per request
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

export class HTTPClient {
  constructor(options = {}) {
    // Connection pooling configuration
    this.maxSockets = options.maxSockets || 50;
    this.maxFreeSockets = options.maxFreeSockets || 10;
    this.timeout = options.timeout || 60000;
    this.keepAliveMsecs = options.keepAliveMsecs || 30000;
    this.freeSocketTimeout = options.freeSocketTimeout || 30000;
    
    // Create optimized HTTP agents with connection pooling
    this.httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: this.keepAliveMsecs,
      maxSockets: this.maxSockets,
      maxFreeSockets: this.maxFreeSockets,
      timeout: this.timeout,
      freeSocketTimeout: this.freeSocketTimeout,
      // Performance optimizations
      scheduling: 'fifo', // First in, first out for predictable latency
      family: 4 // Force IPv4 for consistent routing
    });
    
    this.httpAgent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: this.keepAliveMsecs,
      maxSockets: this.maxSockets,
      maxFreeSockets: this.maxFreeSockets,
      timeout: this.timeout,
      freeSocketTimeout: this.freeSocketTimeout,
      scheduling: 'fifo',
      family: 4
    });
    
    // Connection tracking for monitoring and cleanup
    this.connectionTracker = null;
    this.activeConnections = new Map();
    this.connectionStats = {
      totalRequests: 0,
      activeConnections: 0,
      poolHits: 0, // Requests that reused existing connections
      poolMisses: 0, // Requests that created new connections
      avgLatency: 0,
      errors: 0
    };
    
    // Setup connection monitoring
    this.setupConnectionMonitoring();
  }

  // Set connection tracker from parent system
  setConnectionTracker(tracker) {
    this.connectionTracker = tracker;
  }

  // Setup connection monitoring for performance tracking
  setupConnectionMonitoring() {
    // Monitor HTTPS agent
    this.httpsAgent.on('free', (socket, options) => {
      this.connectionStats.poolHits++;
      this.trackConnectionEvent('free', socket, options);
    });
    
    this.httpsAgent.on('connect', (res, socket, head) => {
      this.connectionStats.poolMisses++;
      this.trackConnectionEvent('connect', socket, { url: res.url });
    });
    
    // Monitor HTTP agent
    this.httpAgent.on('free', (socket, options) => {
      this.connectionStats.poolHits++;
      this.trackConnectionEvent('free', socket, options);
    });
    
    this.httpAgent.on('connect', (res, socket, head) => {
      this.connectionStats.poolMisses++;
      this.trackConnectionEvent('connect', socket, { url: res.url });
    });
  }

  // Track connection events for external monitoring
  trackConnectionEvent(eventType, socket, options) {
    if (this.connectionTracker) {
      this.connectionTracker.trackConnection(socket, {
        eventType,
        url: options?.url || 'unknown',
        timestamp: Date.now()
      });
    }
    
    // Update active connections count
    if (eventType === 'connect') {
      this.connectionStats.activeConnections++;
    } else if (eventType === 'free') {
      // Connection returned to pool, still active but available
    }
  }

  // Main HTTP request method with connection pooling
  async request(url, options = {}) {
    const startTime = performance.now();
    this.connectionStats.totalRequests++;
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      const agent = isHttps ? this.httpsAgent : this.httpAgent;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Renaissance-Trading-Bot/1.0',
          'Connection': 'keep-alive',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          ...options.headers
        },
        agent, // Use pooled agent
        timeout: options.timeout || this.timeout
      };

      // Add Content-Length for POST requests
      let bodyBuffer = null;
      if (options.body) {
        bodyBuffer = Buffer.from(
          typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
        );
        requestOptions.headers['Content-Length'] = bodyBuffer.length;
        if (!requestOptions.headers['Content-Type']) {
          requestOptions.headers['Content-Type'] = 'application/json';
        }
      }

      const req = client.request(requestOptions, (res) => {
        // Track connection reuse vs new connection
        const socketReused = res.socket && res.socket._reusedSocket;
        if (socketReused) {
          this.connectionStats.poolHits++;
        } else {
          this.connectionStats.poolMisses++;
        }
        
        // Track connection for cleanup if tracker available
        if (res.socket && this.connectionTracker) {
          this.connectionTracker.trackConnection(res.socket, {
            url: url,
            method: options.method || 'GET',
            reused: socketReused
          });
        }
        
        let responseBody = '';
        
        // Handle different response encodings
        if (res.headers['content-encoding'] === 'gzip') {
          const zlib = require('zlib');
          const gunzip = zlib.createGunzip();
          res.pipe(gunzip);
          gunzip.on('data', chunk => responseBody += chunk);
          gunzip.on('end', () => this.handleResponse(responseBody, res, resolve, reject, startTime));
        } else {
          res.setEncoding('utf8');
          res.on('data', chunk => responseBody += chunk);
          res.on('end', () => this.handleResponse(responseBody, res, resolve, reject, startTime));
        }
        
        res.on('error', (error) => {
          this.handleError(error, reject, startTime);
        });
      });

      // Handle request errors
      req.on('error', (error) => {
        this.handleError(error, reject, startTime);
      });
      
      req.on('timeout', () => {
        req.destroy();
        this.handleError(new Error(`Request timeout after ${requestOptions.timeout}ms`), reject, startTime);
      });

      // Send request body if present
      if (bodyBuffer) {
        req.write(bodyBuffer);
      }
      
      req.end();
    });
  }

  // Handle successful response
  handleResponse(responseBody, res, resolve, reject, startTime) {
    const latency = performance.now() - startTime;
    this.updateLatencyStats(latency);
    
    try {
      // Handle both JSON and text responses
      let data;
      const contentType = res.headers['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(responseBody);
        } catch (parseError) {
          // If JSON parsing fails, return raw response
          data = responseBody;
        }
      } else {
        data = responseBody;
      }
      
      resolve({
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        data
      });
    } catch (error) {
      this.handleError(new Error(`Response parsing error: ${error.message}`), reject, startTime);
    }
  }

  // Handle request errors
  handleError(error, reject, startTime) {
    const latency = performance.now() - startTime;
    this.updateLatencyStats(latency);
    this.connectionStats.errors++;
    
    reject(error);
  }

  // Update latency statistics
  updateLatencyStats(latency) {
    if (this.connectionStats.avgLatency === 0) {
      this.connectionStats.avgLatency = latency;
    } else {
      this.connectionStats.avgLatency = (this.connectionStats.avgLatency * 0.9) + (latency * 0.1);
    }
  }

  // Optimized GET request
  async get(url, headers = {}) {
    return this.request(url, { 
      method: 'GET', 
      headers 
    });
  }

  // Optimized POST request for RPC calls
  async post(url, body, headers = {}) {
    return this.request(url, { 
      method: 'POST', 
      body, 
      headers 
    });
  }

  // Optimized PUT request
  async put(url, body, headers = {}) {
    return this.request(url, { 
      method: 'PUT', 
      body, 
      headers 
    });
  }

  // RPC-specific optimized method
  async rpcCall(url, method, params, id = null, headers = {}) {
    const rpcPayload = {
      jsonrpc: '2.0',
      id: id || Date.now(),
      method,
      params
    };
    
    const response = await this.post(url, rpcPayload, {
      'Content-Type': 'application/json',
      ...headers
    });
    
    // Handle RPC-specific errors
    if (response.data && response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message} (Code: ${response.data.error.code})`);
    }
    
    return response.data ? response.data.result : response.data;
  }

  // Get connection pool statistics
  getStats() {
    return {
      ...this.connectionStats,
      poolEfficiency: this.connectionStats.totalRequests > 0 
        ? this.connectionStats.poolHits / this.connectionStats.totalRequests 
        : 0,
      httpsAgentStats: {
        maxSockets: this.httpsAgent.maxSockets,
        freeSockets: Object.keys(this.httpsAgent.freeSockets).length,
        sockets: Object.keys(this.httpsAgent.sockets).length,
        requests: Object.keys(this.httpsAgent.requests).length
      },
      httpAgentStats: {
        maxSockets: this.httpAgent.maxSockets,
        freeSockets: Object.keys(this.httpAgent.freeSockets).length,
        sockets: Object.keys(this.httpAgent.sockets).length,
        requests: Object.keys(this.httpAgent.requests).length
      }
    };
  }

  // Health check for connection pool
  isHealthy() {
    const stats = this.getStats();
    return (
      stats.errors < stats.totalRequests * 0.05 && // Less than 5% error rate
      stats.avgLatency < 5000 && // Average latency under 5 seconds
      stats.poolEfficiency > 0.5 // At least 50% connection reuse
    );
  }

  // Warm up connection pool by establishing connections
  async warmUp(endpoints) {
    const warmupPromises = endpoints.map(async (endpoint) => {
      try {
        // Make lightweight request to establish connection
        await this.get(endpoint, { 'Connection': 'keep-alive' });
      } catch (error) {
        // Ignore warmup failures
        console.warn(`Connection warmup failed for ${endpoint}:`, error.message);
      }
    });
    
    await Promise.allSettled(warmupPromises);
    console.log(`Connection pool warmed up for ${endpoints.length} endpoints`);
  }

  // Force close idle connections (useful for cleanup)
  closeIdleConnections() {
    // Close idle HTTPS connections
    if (this.httpsAgent.destroy) {
      this.httpsAgent.destroy();
    }
    
    // Close idle HTTP connections  
    if (this.httpAgent.destroy) {
      this.httpAgent.destroy();
    }
    
    console.log('Closed idle connections in HTTP client');
  }

  // Complete shutdown and cleanup
  destroy() {
    try {
      // Destroy both agents and close all connections
      this.httpsAgent.destroy();
      this.httpAgent.destroy();
      
      // Clear tracking data
      this.activeConnections.clear();
      
      // Reset stats
      this.connectionStats = {
        totalRequests: 0,
        activeConnections: 0,
        poolHits: 0,
        poolMisses: 0,
        avgLatency: 0,
        errors: 0
      };
      
      console.log('HTTP client destroyed and cleaned up');
    } catch (error) {
      console.error('Error during HTTP client destruction:', error);
    }
  }
}
```

### Integration with RPC Connection Pool

Update `src/transport/rpc-connection-pool.js` to use HTTPClient:

```javascript
// Replace fetch with HTTPClient
import { HTTPClient } from './http-client.js';

// Update constructor
constructor(endpoints, performanceMonitor = null) {
  // ... existing code ...
  
  // Initialize HTTP client with connection pooling
  this.httpClient = new HTTPClient({
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 30000,
    keepAliveMsecs: 30000,
    freeSocketTimeout: 15000
  });
  
  // Warm up connections to all endpoints
  this.warmUpConnections();
}

// Warm up connection pool
async warmUpConnections() {
  const endpointUrls = Object.values(this.getDefaultEndpoints()).map(ep => ep.url);
  await this.httpClient.warmUp(endpointUrls);
}

// Replace makeRequest method to use HTTPClient
async makeRequest(endpoint, method, params, timeout) {
  const requestPayload = {
    jsonrpc: '2.0',
    id: this.requestId++,
    method,
    params
  };
  
  try {
    endpoint.totalRequests++;
    endpoint.requestsThisSecond++;
    
    // Track rate limit utilization
    this.updateRateLimitMetrics(
      endpoint.name, 
      endpoint.requestsThisSecond, 
      endpoint.maxRequestsPerSecond
    );
    
    // Use HTTPClient with connection pooling instead of fetch
    const response = await this.httpClient.post(
      endpoint.url, 
      requestPayload,
      {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    );
    
    if (!response || response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message} (${response.data.error.code})`);
    }
    
    endpoint.successfulRequests++;
    return response.data.result;
    
  } catch (error) {
    if (error.message.includes('timeout')) {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Update getStats method
getStats() {
  return {
    // ... existing stats ...
    httpClient: this.httpClient.getStats()
  };
}

// Add connection pool health check
isHealthy() {
  const healthyEndpoints = Array.from(this.endpoints.values())
    .filter(ep => ep.health === 'healthy');
  
  return (
    healthyEndpoints.length > 0 && 
    this.activeRequests < this.maxConcurrentRequests &&
    this.httpClient.isHealthy()
  );
}

// Update cleanup method
async cleanup() {
  if (this.httpClient) {
    this.httpClient.destroy();
  }
}
```

### Usage Examples

```javascript
// Basic RPC call with connection pooling
const rpcPool = new RpcConnectionPool();

// First call - establishes connection
const result1 = await rpcPool.call('getAccountInfo', ['So11111111111111111111111111111111111111112']);

// Second call - reuses existing connection (50-100ms faster)
const result2 = await rpcPool.call('getTokenSupply', ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']);

// Check connection pool efficiency
const stats = rpcPool.getStats();
console.log(`Connection reuse rate: ${(stats.httpClient.poolEfficiency * 100).toFixed(1)}%`);
console.log(`Average latency: ${stats.httpClient.avgLatency.toFixed(1)}ms`);
```

### Performance Monitoring

```javascript
// Monitor connection pool performance
setInterval(() => {
  const stats = rpcPool.getStats().httpClient;
  console.log('Connection Pool Stats:', {
    totalRequests: stats.totalRequests,
    poolHits: stats.poolHits,
    poolMisses: stats.poolMisses,
    efficiency: `${(stats.poolEfficiency * 100).toFixed(1)}%`,
    avgLatency: `${stats.avgLatency.toFixed(1)}ms`,
    activeConnections: stats.activeConnections
  });
}, 30000); // Log every 30 seconds
```

## Performance Impact

### Expected Improvements:
- **50-100ms latency reduction** per request through connection reuse
- **Higher throughput** with persistent connections
- **Reduced CPU usage** from eliminated TCP handshakes
- **Better resource utilization** with connection pooling

### Connection Pool Benefits:
- **Keep-alive connections** eliminate connection establishment overhead
- **Socket reuse** reduces network resource consumption  
- **Configurable limits** prevent connection exhaustion
- **Automatic cleanup** prevents connection leaks

## Implementation Steps

1. **Create** `src/transport/http-client.js` with provided code
2. **Update** `src/transport/rpc-connection-pool.js` with HTTPClient integration
3. **Test** connection reuse with multiple RPC calls
4. **Monitor** pool efficiency and latency improvements
5. **Tune** connection limits based on usage patterns

## Success Metrics

- **Pool Efficiency**: >80% connection reuse rate
- **Latency Reduction**: 50-100ms improvement per request
- **Throughput**: 2-3x increase in requests per second
- **Resource Usage**: Lower CPU and memory usage

This extraction provides critical connection pooling performance for high-frequency meme coin trading.