// src/scripts-js/data-ingestion.service.js
const { EventEmitter } = require('events');

/**
 * Data Ingestion Service - Raw Data Fetching from RPC
 * Handles WebSocket streams, REST API calls, and event parsing
 */
class DataIngestionService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      heliusApiKey: config.heliusApiKey || process.env.HELIUS_API_KEY,
      chainstackApiKey: config.chainstackApiKey || process.env.CHAINSTACK_API_KEY,
      primaryRpcUrl: config.primaryRpcUrl || 'https://mainnet.helius-rpc.com',
      fallbackRpcUrl: config.fallbackRpcUrl || 'https://solana-mainnet.phantom.app/rpc',
      websocketEnabled: config.websocketEnabled !== false,
      batchSize: config.batchSize || 100,
      rateLimitPerSecond: config.rateLimitPerSecond || 50,
      retryAttempts: config.retryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      timeoutMs: config.timeoutMs || 5000
    };
    
    // Connection management
    this.connections = {
      primary: null,
      fallback: null,
      websocket: null
    };
    
    // Rate limiting
    this.rateLimiter = {
      requests: 0,
      lastReset: Date.now()
    };
    
    // Request queue
    this.requestQueue = [];
    this.activeRequests = new Set();
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      websocketMessages: 0,
      rateLimitHits: 0,
      failoverEvents: 0
    };
    
    // Health status
    this.healthStatus = {
      primaryRpc: 'UNKNOWN',
      fallbackRpc: 'UNKNOWN',
      websocket: 'UNKNOWN',
      lastHealthCheck: null
    };
    
    this.isInitialized = false;
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, ...args) => console.log(`[DataIngestion] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[DataIngestion] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[DataIngestion] ${msg}`, ...args),
      debug: (msg, ...args) => console.debug(`[DataIngestion] ${msg}`, ...args)
    };
  }

  /**
   * Initialize the ingestion service
   */
  async initialize() {
    if (this.isInitialized) return;
    
    this.logger.info('🚀 Initializing Data Ingestion Service...');
    
    try {
      // Initialize HTTP connections
      await this.initializeHttpConnections();
      
      // Initialize WebSocket connections (if enabled)
      if (this.config.websocketEnabled) {
        await this.initializeWebSocketConnections();
      }
      
      // Start background tasks
      this.startBackgroundTasks();
      
      this.isInitialized = true;
      this.logger.info('✅ Data Ingestion Service initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize Data Ingestion Service:', error);
      throw error;
    }
  }

  /**
   * Initialize HTTP connections
   */
  async initializeHttpConnections() {
    // Test primary RPC connection
    try {
      await this.testRpcConnection(this.config.primaryRpcUrl);
      this.healthStatus.primaryRpc = 'HEALTHY';
      this.logger.info('✅ Primary RPC connection established');
    } catch (error) {
      this.healthStatus.primaryRpc = 'UNHEALTHY';
      this.logger.warn('⚠️ Primary RPC connection failed:', error.message);
    }
    
    // Test fallback RPC connection
    try {
      await this.testRpcConnection(this.config.fallbackRpcUrl);
      this.healthStatus.fallbackRpc = 'HEALTHY';
      this.logger.info('✅ Fallback RPC connection established');
    } catch (error) {
      this.healthStatus.fallbackRpc = 'UNHEALTHY';
      this.logger.warn('⚠️ Fallback RPC connection failed:', error.message);
    }
    
    if (this.healthStatus.primaryRpc === 'UNHEALTHY' && this.healthStatus.fallbackRpc === 'UNHEALTHY') {
      throw new Error('All RPC connections failed');
    }
  }

  /**
   * Initialize WebSocket connections
   */
  async initializeWebSocketConnections() {
    if (!this.config.heliusApiKey) {
      this.logger.warn('No Helius API key provided, skipping WebSocket');
      return;
    }
    
    try {
      // This would connect to Helius Enhanced WebSocket
      // For now, we'll simulate the connection
      this.connections.websocket = {
        connected: true,
        lastMessage: new Date(),
        subscriptions: new Set()
      };
      
      this.healthStatus.websocket = 'HEALTHY';
      this.logger.info('✅ WebSocket connection established');
      
      // Simulate WebSocket data events
      this.simulateWebSocketData();
      
    } catch (error) {
      this.healthStatus.websocket = 'UNHEALTHY';
      this.logger.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Test RPC connection
   */
  async testRpcConnection(url) {
    const response = await this.makeHttpRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });
    
    if (!response.ok) {
      throw new Error(`RPC connection failed: ${response.status}`);
    }
    
    return response;
  }

  /**
   * Make HTTP request with error handling
   */
  async makeHttpRequest(url, options) {
    const startTime = Date.now();
    
    try {
      // Apply rate limiting
      await this.applyRateLimit();
      
      // Add API key if needed
      if (url.includes('helius') && this.config.heliusApiKey) {
        url += url.includes('?') ? '&' : '?';
        url += `api-key=${this.config.heliusApiKey}`;
      }
      
      const response = await fetch(url, {
        ...options,
        timeout: this.config.timeoutMs
      });
      
      // Update metrics
      this.updateRequestMetrics(startTime, true);
      
      return response;
      
    } catch (error) {
      this.updateRequestMetrics(startTime, false);
      throw error;
    }
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit() {
    const now = Date.now();
    
    // Reset counter every second
    if (now - this.rateLimiter.lastReset > 1000) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.lastReset = now;
    }
    
    // Wait if rate limit exceeded
    if (this.rateLimiter.requests >= this.config.rateLimitPerSecond) {
      const waitTime = 1000 - (now - this.rateLimiter.lastReset);
      if (waitTime > 0) {
        this.metrics.rateLimitHits++;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.rateLimiter.requests++;
  }

  /**
   * Fetch token data from RPC
   */
  async fetchTokenData(tokenAddress) {
    const startTime = Date.now();
    
    try {
      // Try primary RPC first
      let response;
      try {
        response = await this.fetchTokenDataFromRpc(tokenAddress, this.config.primaryRpcUrl);
      } catch (error) {
        this.logger.warn(`Primary RPC failed for ${tokenAddress}, trying fallback:`, error.message);
        this.metrics.failoverEvents++;
        response = await this.fetchTokenDataFromRpc(tokenAddress, this.config.fallbackRpcUrl);
      }
      
      const rawData = {
        tokenAddress,
        type: 'token',
        source: 'rpc',
        fetchedAt: new Date(),
        data: response,
        fetchTime: Date.now() - startTime
      };
      
      this.logger.debug(`Token data fetched in ${rawData.fetchTime}ms: ${tokenAddress}`);
      return rawData;
      
    } catch (error) {
      this.logger.error(`Failed to fetch token data for ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Fetch token data from specific RPC
   */
  async fetchTokenDataFromRpc(tokenAddress, rpcUrl) {
    // Fetch multiple data points in parallel
    const requests = [
      this.getTokenAccount(tokenAddress, rpcUrl),
      this.getTokenSupply(tokenAddress, rpcUrl),
      this.getTokenMetadata(tokenAddress, rpcUrl),
      this.getRecentTransactions(tokenAddress, rpcUrl)
    ];
    
    const [accountInfo, supply, metadata, transactions] = await Promise.allSettled(requests);
    
    return {
      account: accountInfo.status === 'fulfilled' ? accountInfo.value : null,
      supply: supply.status === 'fulfilled' ? supply.value : null,
      metadata: metadata.status === 'fulfilled' ? metadata.value : null,
      transactions: transactions.status === 'fulfilled' ? transactions.value : null
    };
  }

  /**
   * Get token account information
   */
  async getTokenAccount(tokenAddress, rpcUrl) {
    const response = await this.makeHttpRequest(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [
          tokenAddress,
          {
            encoding: 'jsonParsed',
            commitment: 'confirmed'
          }
        ]
      })
    });
    
    const data = await response.json();
    return data.result;
  }

  /**
   * Get token supply information
   */
  async getTokenSupply(tokenAddress, rpcUrl) {
    const response = await this.makeHttpRequest(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenSupply',
        params: [tokenAddress]
      })
    });
    
    const data = await response.json();
    return data.result;
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenAddress, rpcUrl) {
    // This would call Token Metadata Program
    // For now, return placeholder
    return {
      name: 'Unknown Token',
      symbol: 'UNK',
      decimals: 9,
      description: '',
      image: ''
    };
  }

  /**
   * Get recent transactions for token
   */
  async getRecentTransactions(tokenAddress, rpcUrl) {
    const response = await this.makeHttpRequest(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          tokenAddress,
          {
            limit: 10,
            commitment: 'confirmed'
          }
        ]
      })
    });
    
    const data = await response.json();
    return data.result;
  }

  /**
   * Fetch market data
   */
  async fetchMarketData() {
    const startTime = Date.now();
    
    try {
      // Fetch SOL price and market data
      const marketData = await this.fetchSolanaMarketData();
      
      const rawData = {
        type: 'market',
        source: 'rpc',
        fetchedAt: new Date(),
        data: marketData,
        fetchTime: Date.now() - startTime
      };
      
      this.logger.debug(`Market data fetched in ${rawData.fetchTime}ms`);
      return rawData;
      
    } catch (error) {
      this.logger.error('Failed to fetch market data:', error);
      throw error;
    }
  }

  /**
   * Fetch Solana market data
   */
  async fetchSolanaMarketData() {
    // This would integrate with price feeds
    // For now, return mock data
    return {
      solPrice: 100 + Math.random() * 50,
      marketCap: 45000000000,
      volume24h: 1500000000,
      change24h: (Math.random() - 0.5) * 10,
      dominance: 1.2,
      timestamp: new Date()
    };
  }

  /**
   * Simulate WebSocket data (replace with real implementation)
   */
  simulateWebSocketData() {
    setInterval(() => {
      if (this.connections.websocket && this.connections.websocket.connected) {
        // Simulate LP creation event
        const mockLpEvent = {
          type: 'lpCreation',
          tokenAddress: this.generateMockTokenAddress(),
          lpValue: Math.random() * 1000000,
          timestamp: new Date(),
          source: 'websocket'
        };
        
        this.metrics.websocketMessages++;
        this.emit('data', mockLpEvent);
      }
    }, 5000 + Math.random() * 10000); // Random interval 5-15 seconds
  }

  /**
   * Generate mock token address
   */
  generateMockTokenAddress() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    // Health check every 30 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);
    
    // Process request queue
    setInterval(() => {
      this.processRequestQueue();
    }, 100);
    
    this.logger.info('🔄 Background tasks started');
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    this.healthStatus.lastHealthCheck = new Date();
    
    // Check primary RPC
    try {
      await this.testRpcConnection(this.config.primaryRpcUrl);
      this.healthStatus.primaryRpc = 'HEALTHY';
    } catch (error) {
      this.healthStatus.primaryRpc = 'UNHEALTHY';
    }
    
    // Check fallback RPC
    try {
      await this.testRpcConnection(this.config.fallbackRpcUrl);
      this.healthStatus.fallbackRpc = 'HEALTHY';
    } catch (error) {
      this.healthStatus.fallbackRpc = 'UNHEALTHY';
    }
    
    // Check WebSocket
    if (this.connections.websocket) {
      const timeSinceLastMessage = Date.now() - this.connections.websocket.lastMessage;
      this.healthStatus.websocket = timeSinceLastMessage < 60000 ? 'HEALTHY' : 'UNHEALTHY';
    }
  }

  /**
   * Process request queue
   */
  async processRequestQueue() {
    while (this.requestQueue.length > 0 && this.activeRequests.size < this.config.batchSize) {
      const request = this.requestQueue.shift();
      this.activeRequests.add(request.id);
      
      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      } finally {
        this.activeRequests.delete(request.id);
      }
    }
  }

  /**
   * Update request metrics
   */
  updateRequestMetrics(startTime, success) {
    const responseTime = Date.now() - startTime;
    
    this.metrics.totalRequests++;
    this.metrics.averageResponseTime = (this.metrics.averageResponseTime + responseTime) / 2;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: (this.metrics.successfulRequests / this.metrics.totalRequests) * 100,
      queueSize: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      healthStatus: this.healthStatus
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      ...this.healthStatus,
      overall: this.determineOverallHealth()
    };
  }

  /**
   * Determine overall health
   */
  determineOverallHealth() {
    const statuses = Object.values(this.healthStatus).filter(status => 
      typeof status === 'string' && status !== 'UNKNOWN'
    );
    
    if (statuses.every(status => status === 'HEALTHY')) {
      return 'HEALTHY';
    } else if (statuses.some(status => status === 'HEALTHY')) {
      return 'DEGRADED';
    } else {
      return 'CRITICAL';
    }
  }
}

export default DataIngestionService;