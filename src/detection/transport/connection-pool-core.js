/**
 * Connection Pool Core
 * Extracted from rpc-connection-pool.js for standalone use
 * Provides HTTP/HTTPS connection pooling with socket reuse and lifecycle management
 */

import { EventEmitter } from 'events';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export class ConnectionPoolCore extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration with environment variable support
    this.keepAlive = config.keepAlive !== false && 
                     process.env.KEEP_ALIVE_ENABLED !== 'false' &&
                     process.env.RPC_KEEP_ALIVE_ENABLED !== 'false';
    
    this.keepAliveMsecs = config.keepAliveMsecs || 
                          parseInt(process.env.KEEP_ALIVE_MSECS) || 
                          1000;
    
    this.maxSockets = config.maxSockets || 
                      parseInt(process.env.MAX_SOCKETS) || 
                      parseInt(process.env.MAX_CONCURRENT) || 
                      50;
    
    this.maxFreeSockets = config.maxFreeSockets || 
                          parseInt(process.env.MAX_FREE_SOCKETS) || 
                          Math.floor(this.maxSockets / 2);
    
    this.timeout = config.timeout || 
                   parseInt(process.env.CONNECTION_TIMEOUT) || 
                   parseInt(process.env.RPC_TIMEOUT) || 
                   3000;
    
    this.scheduling = config.scheduling || 
                      process.env.SOCKET_SCHEDULING || 
                      'lifo'; // Last-in-first-out for better connection reuse
    
    this.noDelay = config.noDelay !== false; // Disable Nagle's algorithm by default
    
    this.responseLimit = config.responseLimit || 
                         parseInt(process.env.RESPONSE_SIZE_LIMIT) || 
                         10 * 1024 * 1024; // 10MB default
    
    // Agent pools for different protocols and endpoints
    this.agents = new Map();
    this.agentStats = new Map();
    
    // Connection tracking
    this.activeConnections = new Map();
    this.connectionMetrics = {
      totalConnections: 0,
      reusedConnections: 0,
      newConnections: 0,
      failedConnections: 0,
      timedOutConnections: 0,
      totalRequests: 0,
      avgConnectionTime: 0,
      avgReuseTime: 0,
      socketLeaks: 0,
      cleanedUpConnections: 0
    }
;
    
    // Cleanup interval
    this.cleanupInterval = null;
    this.cleanupPeriod = config.cleanupPeriod || 
                         parseInt(process.env.CLEANUP_PERIOD_MS) || 
                         60000; // 1 minute
    
    // Start cleanup timer
    this.startCleanupTimer();
    
    // Track if destroyed
    this.isDestroyed = false;
  }
  
  /**
   * Initialize the ConnectionPoolCore (compatibility method)
   */
  async initialize() {
    // Component is already initialized in constructor
    return true;
  }
  
  /**
   * Get or create agent for an endpoint
   */
  getAgent(endpoint) {
    const url = typeof endpoint === 'string' ? new URL(endpoint) : endpoint;
    const key = `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? 443 : 80)}`;
    
    if (!this.agents.has(key)) {
      const AgentClass = url.protocol === 'https:' ? https.Agent : http.Agent;
      
      const agent = new AgentClass({
        keepAlive: this.keepAlive,
        keepAliveMsecs: this.keepAliveMsecs,
        maxSockets: this.maxSockets,
        maxFreeSockets: this.maxFreeSockets,
        timeout: this.timeout,
        scheduling: this.scheduling,
        noDelay: this.noDelay
      });
      
      this.agents.set(key, agent);
      
      // Initialize stats for this agent
      this.agentStats.set(key, {
        created: Date.now(),
        requests: 0,
        reused: 0,
        errors: 0,
        lastUsed: Date.now(),
        sockets: 0,
        freeSockets: 0
      });
      
      // Monitor agent socket events
      this.monitorAgent(key, agent);
    }
    
    const stats = this.agentStats.get(key);
    stats.lastUsed = Date.now();
    
    return this.agents.get(key);
  }
  
  /**
   * Monitor agent for socket reuse and lifecycle events
   */
  monitorAgent(key, agent) {
    // Override createConnection to track new connections
    const originalCreateConnection = agent.createConnection;
    agent.createConnection = (options, callback) => {
      this.connectionMetrics.newConnections++;
      this.connectionMetrics.totalConnections++;
      
      const startTime = Date.now();
      
      // Handle both callback and non-callback cases
      const wrappedCallback = callback ? (err, socket) => {
        if (err) {
          this.connectionMetrics.failedConnections++;
          callback(err);
        } else {
          const connectionTime = Date.now() - startTime;
          this.updateAvgConnectionTime(connectionTime);
          
          // Track socket lifecycle
          this.trackSocket(key, socket);
          callback(null, socket);
        }
      } : undefined;
      
      // Call original with or without callback
      const result = originalCreateConnection.call(agent, options, wrappedCallback);
      
      // If no callback, track the returned socket
      if (!callback && result) {
        const connectionTime = Date.now() - startTime;
        this.updateAvgConnectionTime(connectionTime);
        this.trackSocket(key, result);
      }
      
      return result;
    };
    
    // Track socket reuse
    const originalKeepSocketAlive = agent.keepSocketAlive;
    agent.keepSocketAlive = (socket) => {
      const shouldKeep = originalKeepSocketAlive.call(agent, socket);
      if (shouldKeep) {
        this.connectionMetrics.reusedConnections++;
        const stats = this.agentStats.get(key);
        if (stats) stats.reused++;
      }
      return shouldKeep;
    };
  }
  
  /**
   * Track individual socket lifecycle
   */
  trackSocket(key, socket) {
    // Validate socket exists
    if (!socket) {
      console.warn('trackSocket called with undefined socket');
      return;
    }
    
    const socketId = `${key}-${Date.now()}-${Math.random()}`;
    
    this.activeConnections.set(socketId, {
      key,
      socket,
      created: Date.now(),
      lastUsed: Date.now(),
      requestCount: 0
    });
    
    // Update agent stats
    const stats = this.agentStats.get(key);
    if (stats) stats.sockets++;
    
    // Clean up on socket close
    socket.once('close', () => {
      this.activeConnections.delete(socketId);
      if (stats) stats.sockets--;
      this.connectionMetrics.cleanedUpConnections++;
    });
    
    // Track socket errors
    socket.once('error', () => {
      if (stats) stats.errors++;
    });
    
    // Track timeout
    socket.once('timeout', () => {
      this.connectionMetrics.timedOutConnections++;
    });
    
    this.emit('socket-created', { key, socketId });
  }
  
  /**
   * Execute HTTP/HTTPS request with connection pooling
   */
  
  /**
   * Execute request with specific endpoint (compatibility method)
   */
  async executeWithEndpoint(endpoint, options) {
    // Delegate to execute method with endpoint in options
    return this.execute({ ...options, endpoint });
  }

  async execute(url, options = {}) {
    if (this.isDestroyed) {
      throw new Error('Connection pool has been destroyed');
    }
    
    const startTime = Date.now();
    this.connectionMetrics.totalRequests++;
    
    const parsedUrl = new URL(url);
    const agent = this.getAgent(parsedUrl);
    
    // Update agent stats
    const agentKey = `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80)}`;
    const stats = this.agentStats.get(agentKey);
    if (stats) stats.requests++;
    
    const requestOptions = {
      method: options.method || 'POST',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        ...options.headers
      },
      agent,
      timeout: options.timeout || this.timeout
    };
    
    return new Promise((resolve, reject) => {
      const proto = parsedUrl.protocol === 'https:' ? https : http;
      let req = null;
      let timeoutHandle = null;
      let responseData = '';
      let isReused = false;
      
      // Cleanup function
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
        responseData = null;
      };
      
      try {
        req = proto.request(requestOptions, (res) => {
          // Clear timeout as response started
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
          
          // Check if socket was reused
          isReused = res.socket && res.socket.reused;
          if (isReused) {
            const reuseTime = Date.now() - startTime;
            this.updateAvgReuseTime(reuseTime);
          }
          
          res.on('data', chunk => {
            responseData += chunk;
            
            // Prevent excessive memory usage
            if (responseData.length > this.responseLimit) {
              cleanup();
              reject(new Error('Response too large'));
            }
          });
          
          res.on('end', () => {
            try {
              const latency = Date.now() - startTime;
              
              // Parse response if JSON expected
              let result = responseData;
              if (options.parseJson !== false) {
                result = JSON.parse(responseData);
              }
              
              cleanup();
              
              resolve({
                data: result,
                latency,
                reused: isReused,
                agent: agentKey
              });
              
              this.emit('request-complete', {
                url,
                latency,
                reused: isReused
              });
              
            } catch (error) {
              cleanup();
              reject(new Error('Invalid response: ' + error.message));
            } finally {
              res.removeAllListeners();
              res.destroy();
            }
          });
          
          res.on('error', (err) => {
            cleanup();
            reject(err);
          });
        });
        
        // Set timeout
        timeoutHandle = setTimeout(() => {
          cleanup();
          this.connectionMetrics.timedOutConnections++;
          reject(new Error('Request timeout'));
        }, requestOptions.timeout);
        
        // Handle request errors
        req.on('error', (err) => {
          cleanup();
          this.connectionMetrics.failedConnections++;
          reject(err);
        });
        
        req.on('socket', (socket) => {
          // Track if socket was reused
          if (socket.reused) {
            isReused = true;
          }
        });
        
        // Send request body if provided
        if (options.body) {
          const body = typeof options.body === 'string' 
            ? options.body 
            : JSON.stringify(options.body);
          req.write(body);
        }
        
        req.end();
        
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }
  
  /**
   * Warmup connections to endpoints
   */
  async warmupConnections(endpoints) {
    const promises = endpoints.map(endpoint => {
      return this.execute(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: -1,
          method: 'getHealth',
          params: []
        }),
        timeout: 1000,
        parseJson: true
      }).catch(() => {
        // Ignore warmup errors
      });
    });
    
    await Promise.all(promises);
    
    this.emit('warmup-complete', {
      endpoints: endpoints.length,
      agents: this.agents.size
    });
  }
  
  /**
   * Update average connection time
   */
  updateAvgConnectionTime(time) {
    const count = this.connectionMetrics.newConnections;
    this.connectionMetrics.avgConnectionTime = 
      (this.connectionMetrics.avgConnectionTime * (count - 1) + time) / count;
  }
  
  /**
   * Update average reuse time
   */
  updateAvgReuseTime(time) {
    const count = this.connectionMetrics.reusedConnections || 1;
    this.connectionMetrics.avgReuseTime = 
      (this.connectionMetrics.avgReuseTime * (count - 1) + time) / count;
  }
  
  /**
   * Get socket reuse percentage
   */
  getSocketReusePercentage() {
    const total = this.connectionMetrics.totalRequests;
    if (total === 0) return 0;
    
    return (this.connectionMetrics.reusedConnections / total) * 100;
  }
  
  /**
   * Start cleanup timer for unused connections
   */
  startCleanupTimer() {
    if (this.cleanupInterval) {
      return;
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedConnections();
    }, this.cleanupPeriod);
  }
  
  /**
   * Clean up unused connections and agents
   */
  cleanupUnusedConnections() {
    const now = Date.now();
    const maxIdleTime = this.cleanupPeriod * 2; // 2 minutes by default
    
    // Clean up unused agents
    for (const [key, stats] of this.agentStats.entries()) {
      if (now - stats.lastUsed > maxIdleTime && stats.sockets === 0) {
        const agent = this.agents.get(key);
        if (agent) {
          agent.destroy();
          this.agents.delete(key);
          this.agentStats.delete(key);
          
          this.emit('agent-cleaned', { key, idleTime: now - stats.lastUsed });
        }
      }
    }
    
    // Check for potential socket leaks
    let activeCount = 0;
    for (const [id, conn] of this.activeConnections.entries()) {
      if (now - conn.lastUsed > maxIdleTime * 2) {
        // Potential leak - socket not cleaned up
        this.connectionMetrics.socketLeaks++;
        this.activeConnections.delete(id);
        
        this.emit('socket-leak-detected', {
          id,
          age: now - conn.created,
          lastUsed: now - conn.lastUsed
        });
      } else {
        activeCount++;
      }
    }
    
    this.emit('cleanup-complete', {
      agents: this.agents.size,
      activeConnections: activeCount,
      leaks: this.connectionMetrics.socketLeaks
    });
  }
  
  /**
   * Get connection pool statistics
   */
  getStats() {
    const stats = {
      agents: {},
      metrics: this.connectionMetrics,
      socketReusePercentage: this.getSocketReusePercentage(),
      activeConnections: this.activeConnections.size
    };
    
    // Add per-agent stats
    for (const [key, agentStats] of this.agentStats.entries()) {
      stats.agents[key] = {
        ...agentStats,
        reuseRate: agentStats.requests > 0 
          ? (agentStats.reused / agentStats.requests * 100).toFixed(2) + '%'
          : '0%'
      };
    }
    
    return stats;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.connectionMetrics,
      socketReusePercentage: this.getSocketReusePercentage().toFixed(2) + '%',
      avgConnectionTimeMs: this.connectionMetrics.avgConnectionTime.toFixed(2),
      avgReuseTimeMs: this.connectionMetrics.avgReuseTime.toFixed(2),
      activeAgents: this.agents.size,
      activeConnections: this.activeConnections.size,
      memoryUsageMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    };
  }
  
  /**
   * Force close all connections
   */
  closeAllConnections() {
    for (const agent of this.agents.values()) {
      agent.destroy();
    }
    
    this.agents.clear();
    this.agentStats.clear();
    this.activeConnections.clear();
    
    this.emit('all-connections-closed');
  }
  
  /**
   * Health check for monitoring
   */
  async healthCheck() {
    const startTime = process.hrtime.bigint();
    
    try {
      const stats = this.getStats();
      const healthy = 
        this.connectionMetrics.socketLeaks === 0 &&
        this.getSocketReusePercentage() > 50; // At least 50% reuse
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;
      
      return {
        healthy,
        latency: latencyMs,
        stats,
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
    this.isDestroyed = true;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.closeAllConnections();
    this.removeAllListeners();
  }
  
  /**
   * Static factory method for configuration from environment
   */
  static fromEnvironment() {
    return new ConnectionPoolCore({
      keepAlive: process.env.KEEP_ALIVE_ENABLED !== 'false',
      keepAliveMsecs: parseInt(process.env.KEEP_ALIVE_MSECS) || 1000,
      maxSockets: parseInt(process.env.MAX_SOCKETS) || 50,
      maxFreeSockets: parseInt(process.env.MAX_FREE_SOCKETS) || 25,
      timeout: parseInt(process.env.CONNECTION_TIMEOUT) || 3000,
      scheduling: process.env.SOCKET_SCHEDULING || 'lifo',
      noDelay: process.env.TCP_NO_DELAY !== 'false',
      responseLimit: parseInt(process.env.RESPONSE_SIZE_LIMIT) || 10485760,
      cleanupPeriod: parseInt(process.env.CLEANUP_PERIOD_MS) || 60000
    });
  }
}

// Export for backward compatibility
export default ConnectionPoolCore;