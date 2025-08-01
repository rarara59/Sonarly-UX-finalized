/**
 * WEBSOCKET MANAGER SERVICE
 * 
 * Orchestrator-compatible wrapper for HeliusWebSocketClient
 * Provides circuit breaker protection and worker pool integration
 * for real-time LP detection and trading signals
 */

import { EventEmitter } from 'events';
import HeliusWebSocketClient from './helius-websocket-client.js';

export class WebSocketManagerService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Set max listeners to prevent warnings
    this.setMaxListeners(50);
    
    this.options = {
      heliusApiKey: options.heliusApiKey,
      endpoint: options.endpoint || 'wss://atlas-mainnet.helius-rpc.com',
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnects: options.maxReconnects || 50,
      ...options
    };
    
    // Service dependencies
    this.circuitBreaker = options.circuitBreaker || null;
    this.workerPool = options.workerPool || null;
    this.lpDetector = options.lpDetector || null;
    
    // HeliusWebSocketClient instance
    this.heliusClient = null;
    
    // Service state
    this.isInitialized = false;
    this.isConnected = false;
    
    // Metrics
    this.metrics = {
      connectionsEstablished: 0,
      messagesProcessed: 0,
      lpEventsDetected: 0,
      significantEvents: 0,
      circuitBreakerTrips: 0,
      workerTasksExecuted: 0,
      lastEventTime: null,
      uptime: 0,
      startTime: null
    };
  }

  /**
   * Initialize WebSocket Manager for orchestrator
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing WebSocket Manager Service...');
    console.log('📡 Configuration:');
    console.log(`  - Helius API: ${this.options.heliusApiKey ? 'Configured' : 'Missing'}`);
    console.log(`  - Endpoint: ${this.options.endpoint}`);
    console.log(`  - Circuit Breaker: ${this.circuitBreaker ? 'Enabled' : 'Disabled'}`);
    console.log(`  - Worker Pool: ${this.workerPool ? 'Enabled' : 'Disabled'}`);
    console.log(`  - LP Detector: ${this.lpDetector ? 'Enabled' : 'Disabled'}`);
    
    if (!this.options.heliusApiKey) {
      throw new Error('Helius API key is required for WebSocket Manager');
    }
    
    // Create HeliusWebSocketClient with dependencies
    this.heliusClient = new HeliusWebSocketClient(this.options.heliusApiKey, {
      endpoint: this.options.endpoint,
      reconnectInterval: this.options.reconnectInterval,
      maxReconnects: this.options.maxReconnects,
      circuitBreaker: this.circuitBreaker,
      workerPool: this.workerPool,
      lpDetector: this.lpDetector
    });
    
    // Setup event forwarding
    this.setupEventForwarding();
    
    // Initialize connection
    await this.heliusClient.initialize();
    
    this.isInitialized = true;
    this.metrics.startTime = Date.now();
    
    console.log('✅ WebSocket Manager Service initialized');
    
    this.emit('initialized', {
      endpoint: this.options.endpoint,
      circuitBreakerEnabled: !!this.circuitBreaker,
      workerPoolEnabled: !!this.workerPool,
      timestamp: Date.now()
    });
  }

  /**
   * Setup event forwarding from HeliusWebSocketClient
   */
  setupEventForwarding() {
    // Connection events
    this.heliusClient.on('connected', () => {
      this.isConnected = true;
      this.metrics.connectionsEstablished++;
      console.log('🔗 WebSocket Manager: Connection established');
      this.emit('connected');
    });
    
    this.heliusClient.on('disconnected', () => {
      this.isConnected = false;
      console.log('📡 WebSocket Manager: Connection lost');
      this.emit('disconnected');
    });
    
    this.heliusClient.on('connectionBlocked', (data) => {
      this.metrics.circuitBreakerTrips++;
      console.log('🚨 WebSocket Manager: Connection blocked by circuit breaker');
      this.emit('connectionBlocked', data);
    });
    
    // LP detection events
    this.heliusClient.on('lpEvent', (data) => {
      this.metrics.lpEventsDetected++;
      this.metrics.lastEventTime = Date.now();
      this.emit('lpEvent', data);
    });
    
    this.heliusClient.on('significantLPEvent', (data) => {
      this.metrics.significantEvents++;
      console.log(`🎯 WebSocket Manager: Significant LP event - ${data.event.tokenAddress}`);
      this.emit('significantLPEvent', data);
    });
    
    // Token creation events
    this.heliusClient.on('newToken', (data) => {
      console.log(`🪙 WebSocket Manager: New token detected - ${data.address}`);
      this.emit('newToken', data);
    });
    
    // Error events
    this.heliusClient.on('error', (error) => {
      console.error('❌ WebSocket Manager: HeliusClient error:', error);
      this.emit('error', error);
    });
    
    // System events
    this.heliusClient.on('maxReconnectionsReached', () => {
      console.error('❌ WebSocket Manager: Max reconnections reached');
      this.emit('maxReconnectionsReached');
    });
  }

  /**
   * Health check for orchestrator monitoring
   */
  /**
   * Simple health check method for compatibility
   */
  isHealthy() {
    return this.isInitialized && this.isConnected;
  }

  async healthCheck() {
    try {
      if (!this.isInitialized || !this.heliusClient) {
        return false;
      }
      
      // Check HeliusClient health
      const heliusHealthy = await this.heliusClient.healthCheck();
      
      // Check connection status
      const connectionHealthy = this.isConnected;
      
      // Check circuit breaker status
      const circuitBreakerHealthy = !this.circuitBreaker || this.circuitBreaker.isHealthy();
      
      // Check worker pool status
      const workerPoolHealthy = !this.workerPool || (await this.workerPool.healthCheck());
      
      // Check recent activity (no events for >10 minutes might indicate issues)
      const now = Date.now();
      const recentActivity = !this.metrics.lastEventTime || 
                           (now - this.metrics.lastEventTime < 600000); // 10 minutes
      
      const isHealthy = heliusHealthy && 
                       connectionHealthy && 
                       circuitBreakerHealthy && 
                       workerPoolHealthy && 
                       recentActivity;
      
      this.emit('healthCheck', {
        healthy: isHealthy,
        heliusHealthy: heliusHealthy,
        connectionHealthy: connectionHealthy,
        circuitBreakerHealthy: circuitBreakerHealthy,
        workerPoolHealthy: workerPoolHealthy,
        recentActivity: recentActivity,
        metrics: this.getMetrics(),
        timestamp: now
      });
      
      return isHealthy;
      
    } catch (error) {
      console.error('WebSocket Manager health check failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    const now = Date.now();
    this.metrics.uptime = this.metrics.startTime ? now - this.metrics.startTime : 0;
    
    const heliusMetrics = this.heliusClient ? this.heliusClient.getMetrics() : {};
    
    return {
      ...this.metrics,
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      heliusMetrics: heliusMetrics,
      activeSubscriptions: this.getActiveSubscriptions(),
      subscriptionCount: this.getActiveSubscriptions().length,
      circuitBreakerStatus: this.circuitBreaker ? {
        healthy: this.circuitBreaker.isHealthy(),
        state: this.circuitBreaker.getState?.() || 'unknown'
      } : null,
      workerPoolStatus: this.workerPool ? {
        healthy: true, // Will be updated by health check
        activeWorkers: this.workerPool.getMetrics?.()?.activeWorkers || 0
      } : null
    };
  }

  /**
   * Subscribe to specific token address
   */
  async subscribeToToken(tokenAddress) {
    if (!this.heliusClient) {
      throw new Error('WebSocket Manager not initialized');
    }
    
    if (!tokenAddress || typeof tokenAddress !== 'string') {
      throw new Error('Valid token address is required');
    }
    
    try {
      // Use HeliusWebSocketClient's subscription capabilities
      const subscriptionId = await this.heliusClient.subscribeToAccount(tokenAddress, (data) => {
        this.emit('tokenUpdate', {
          tokenAddress: tokenAddress,
          data: data,
          timestamp: Date.now()
        });
      });
      
      console.log(`📊 WebSocket Manager: Successfully subscribed to token ${tokenAddress} (ID: ${subscriptionId})`);
      
      this.emit('tokenSubscribed', { 
        tokenAddress: tokenAddress, 
        subscriptionId: subscriptionId,
        timestamp: Date.now() 
      });
      
      return subscriptionId;
      
    } catch (error) {
      console.error(`❌ Failed to subscribe to token ${tokenAddress}:`, error);
      
      // Circuit breaker feedback for subscription failures
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure('websocket-token-subscription', error);
      }
      
      throw error;
    }
  }

  /**
   * Unsubscribe from specific token address
   */
  async unsubscribeFromToken(subscriptionId) {
    if (!this.heliusClient) {
      throw new Error('WebSocket Manager not initialized');
    }
    
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }
    
    try {
      // Use HeliusWebSocketClient's unsubscribe capabilities
      await this.heliusClient.unsubscribe(subscriptionId);
      
      console.log(`📊 WebSocket Manager: Successfully unsubscribed from subscription ${subscriptionId}`);
      
      this.emit('tokenUnsubscribed', { 
        subscriptionId: subscriptionId,
        timestamp: Date.now() 
      });
      
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from subscription ${subscriptionId}:`, error);
      
      // Circuit breaker feedback for unsubscription failures
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure('websocket-token-unsubscription', error);
      }
      
      throw error;
    }
  }

  /**
   * Subscribe to program account changes (for DEX monitoring)
   */
  async subscribeToProgramAccounts(programId, callback) {
    if (!this.heliusClient) {
      throw new Error('WebSocket Manager not initialized');
    }
    
    if (!programId || typeof programId !== 'string') {
      throw new Error('Valid program ID is required');
    }
    
    try {
      const subscriptionId = await this.heliusClient.subscribeToProgram(programId, (data) => {
        if (callback) {
          callback(data);
        }
        
        this.emit('programUpdate', {
          programId: programId,
          data: data,
          timestamp: Date.now()
        });
      });
      
      console.log(`📊 WebSocket Manager: Successfully subscribed to program ${programId} (ID: ${subscriptionId})`);
      
      this.emit('programSubscribed', { 
        programId: programId, 
        subscriptionId: subscriptionId,
        timestamp: Date.now() 
      });
      
      return subscriptionId;
      
    } catch (error) {
      console.error(`❌ Failed to subscribe to program ${programId}:`, error);
      
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure('websocket-program-subscription', error);
      }
      
      throw error;
    }
  }

  /**
   * Get all active subscriptions from HeliusWebSocketClient
   */
  getActiveSubscriptions() {
    if (!this.heliusClient) {
      return [];
    }
    
    const subscriptions = [];
    
    // Get subscriptions from HeliusWebSocketClient
    for (const [id, subscription] of this.heliusClient.subscriptions) {
      subscriptions.push({
        id: id,
        type: subscription.type,
        target: subscription.programId || subscription.address,
        timestamp: subscription.timestamp
      });
    }
    
    return subscriptions;
  }

  /**
   * Clear all subscriptions
   */
  async clearAllSubscriptions() {
    if (!this.heliusClient) {
      return;
    }
    
    const subscriptions = this.getActiveSubscriptions();
    
    for (const subscription of subscriptions) {
      try {
        await this.unsubscribeFromToken(subscription.id);
      } catch (error) {
        console.warn(`Failed to unsubscribe from ${subscription.id}:`, error.message);
      }
    }
    
    console.log(`✅ Cleared ${subscriptions.length} subscriptions`);
    
    this.emit('allSubscriptionsCleared', {
      clearedCount: subscriptions.length,
      timestamp: Date.now()
    });
  }

  /**
   * Force reconnection
   */
  async reconnect() {
    if (!this.heliusClient) {
      throw new Error('WebSocket Manager not initialized');
    }
    
    console.log('🔄 WebSocket Manager: Forcing reconnection...');
    
    await this.heliusClient.disconnect();
    await this.heliusClient.connect();
  }

  /**
   * Shutdown WebSocket Manager for orchestrator
   */
  async shutdown() {
    console.log('🔌 Shutting down WebSocket Manager Service...');
    
    if (this.heliusClient) {
      await this.heliusClient.shutdown();
      this.heliusClient = null;
    }
    
    this.isInitialized = false;
    this.isConnected = false;
    
    // Clear metrics
    this.metrics = {
      connectionsEstablished: 0,
      messagesProcessed: 0,
      lpEventsDetected: 0,
      significantEvents: 0,
      circuitBreakerTrips: 0,
      workerTasksExecuted: 0,
      lastEventTime: null,
      uptime: 0,
      startTime: null
    };
    
    this.removeAllListeners();
    
    console.log('✅ WebSocket Manager Service shutdown complete');
    
    this.emit('shutdown', {
      timestamp: Date.now()
    });
  }
}

export default WebSocketManagerService;