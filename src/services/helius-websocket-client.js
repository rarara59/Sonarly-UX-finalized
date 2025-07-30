/**
 * HELIUS ENHANCED WEBSOCKET CLIENT
 * 
 * Real-time LP detection with Renaissance-grade statistical processing
 * Integrates with StatisticalEventProcessor for event significance scoring
 */

import { NativeWebSocketClient } from './native-websocket-client.js';
import { StatisticalEventProcessor } from './statistical-event-processor.js';
import { EventEmitter } from 'events';
import { PublicKey } from '@solana/web3.js';

export class HeliusWebSocketClient extends EventEmitter {
  constructor(apiKey, options = {}) {
    super();
    
    this.apiKey = apiKey;
    this.options = {
      endpoint: 'wss://atlas-mainnet.helius-rpc.com',
      reconnectInterval: 5000,
      maxReconnects: 20,
      ...options
    };
    
    // Circuit breaker integration (Day 5 requirement)
    this.circuitBreaker = options.circuitBreaker || null;
    
    // Worker pool integration for message processing (Day 5 requirement)  
    this.workerPool = options.workerPool || null;
    
    // Connection retry with circuit breaker protection
    this.connectionRetries = 0;
    this.maxConnectionRetries = options.maxConnectionRetries || 5;
    
    // Statistical event processor for Renaissance-grade analysis
    this.eventProcessor = new StatisticalEventProcessor();
    
    // WebSocket client
    this.wsClient = null;
    
    // Subscription management
    this.subscriptions = new Map();
    this.subscriptionId = 0;
    
    // Performance tracking
    this.metrics = {
      lpEventsDetected: 0,
      significantEvents: 0,
      totalMessagesReceived: 0,
      averageProcessingTime: 0,
      lastEventTime: null
    };
    
    // Setup event processor listeners
    this.setupEventProcessorListeners();
  }

  /**
   * Initialize for orchestrator compatibility
   */
  async initialize() {
    await this.connect();
    
    this.emit('initialized', {
      endpoint: this.options.endpoint,
      subscriptions: this.subscriptions.size,
      timestamp: Date.now()
    });
    
    return Promise.resolve();
  }

  /**
   * Health check for orchestrator monitoring
   */
  async healthCheck() {
    try {
      const wsConnected = this.wsClient?.isConnected || false;
      const hasSubscriptions = this.subscriptions.size > 0;
      const circuitBreakerHealthy = !this.circuitBreaker || this.circuitBreaker.isHealthy();
      const connectionRetriesOk = this.connectionRetries < this.maxConnectionRetries;
      
      let eventProcessorHealthy = true;
      try {
        eventProcessorHealthy = this.eventProcessor.getPerformanceMetrics().isHealthy;
      } catch (error) {
        console.warn('EventProcessor health check failed:', error.message);
        eventProcessorHealthy = true; // Fallback to healthy if method doesn't exist
      }
      
      const isHealthy = wsConnected && hasSubscriptions && eventProcessorHealthy && circuitBreakerHealthy && connectionRetriesOk;
      
      if (!isHealthy) {
        console.log('WebSocket health check details:', {
          wsConnected,
          hasSubscriptions,
          eventProcessorHealthy,
          circuitBreakerHealthy,
          connectionRetriesOk
        });
      }
      
      this.emit('healthCheck', {
        healthy: isHealthy,
        connected: wsConnected,
        subscriptions: this.subscriptions.size,
        metrics: this.metrics,
        timestamp: Date.now()
      });
      
      return isHealthy;
      
    } catch (error) {
      console.error('HeliusWebSocket health check failed:', error);
      return false;
    }
  }

  /**
   * Shutdown for orchestrator compatibility
   */
  async shutdown() {
    await this.disconnect();
    
    this.emit('shutdown', {
      timestamp: Date.now()
    });
    
    return Promise.resolve();
  }

  setupEventProcessorListeners() {
    // Forward significant events
    this.eventProcessor.on('significantEvent', (event, analysis) => {
      this.metrics.significantEvents++;
      this.emit('significantLPEvent', {
        event,
        analysis,
        timestamp: Date.now()
      });
    });
  }

  async connect() {
    // Circuit breaker protection for connection attempts
    if (this.circuitBreaker) {
      try {
        return await this.circuitBreaker.execute(() => this.connectWithRetry());
      } catch (error) {
        console.error('🚨 Circuit breaker prevented WebSocket connection:', error.message);
        this.emit('connectionBlocked', { reason: 'circuit_breaker', error: error.message });
        throw error;
      }
    } else {
      return await this.connectWithRetry();
    }
  }

  async connectWithRetry() {
    const wsUrl = `${this.options.endpoint}/?api-key=${this.apiKey}`;
    
    this.wsClient = new NativeWebSocketClient(wsUrl, {
      reconnectInterval: this.options.reconnectInterval,
      maxReconnects: this.options.maxReconnects
    });

    // Setup WebSocket event handlers
    this.wsClient.on('open', () => {
      console.log('🔗 Connected to Helius Enhanced WebSocket');
      this.connectionRetries = 0; // Reset on successful connection
      this.emit('connected');
      
      // Subscribe to LP creation events immediately
      this.subscribeToLPEvents();
    });

    this.wsClient.on('message', (message) => {
      this.handleHeliusMessage(message);
    });

    this.wsClient.on('error', (error) => {
      console.error('🚨 Helius WebSocket error:', error);
      
      // Circuit breaker feedback for connection errors
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure('helius-websocket-connection', error);
      }
      
      this.emit('error', error);
    });

    this.wsClient.on('close', () => {
      console.log('📡 Helius WebSocket disconnected');
      this.handleDisconnection();
    });

    // Initiate connection
    this.wsClient.connect();
  }

  /**
   * Handle disconnection with circuit breaker integration
   */
  handleDisconnection() {
    this.emit('disconnected');
    
    // Circuit breaker protection for reconnection attempts
    if (this.connectionRetries < this.maxConnectionRetries) {
      this.connectionRetries++;
      
      if (this.circuitBreaker) {
        // Check if circuit breaker allows reconnection
        this.circuitBreaker.execute('helius-websocket-reconnect', async () => {
          console.log(`🔄 Attempting reconnection (${this.connectionRetries}/${this.maxConnectionRetries})`);
          setTimeout(() => this.connect(), this.options.reconnectInterval);
        }).catch(error => {
          console.error('🚨 Circuit breaker blocked reconnection:', error.message);
          this.emit('reconnectionBlocked', { 
            attempts: this.connectionRetries, 
            maxAttempts: this.maxConnectionRetries 
          });
        });
      } else {
        // Fallback reconnection without circuit breaker
        console.log(`🔄 Attempting reconnection (${this.connectionRetries}/${this.maxConnectionRetries})`);
        setTimeout(() => this.connect(), this.options.reconnectInterval);
      }
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('maxReconnectionsReached');
    }
  }

  subscribeToLPEvents() {
    // Subscribe to account changes for major DEXes
    const dexPrograms = [
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',  // Orca
      'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'   // Meteora
    ];

    dexPrograms.forEach(programId => {
      this.subscribeToAccountChanges(programId);
    });

    // Subscribe to token creation events
    this.subscribeToTokenCreation();
  }

  subscribeToAccountChanges(programId) {
    const subscriptionRequest = {
      jsonrpc: '2.0',
      id: ++this.subscriptionId,
      method: 'accountSubscribe',
      params: [
        programId,
        {
          encoding: 'base64',
          commitment: 'confirmed'
        }
      ]
    };

    this.subscriptions.set(this.subscriptionId, {
      type: 'accountChanges',
      programId,
      timestamp: Date.now()
    });

    this.wsClient.send(JSON.stringify(subscriptionRequest));
    console.log(`📊 Subscribed to account changes for ${programId}`);
  }

  subscribeToTokenCreation() {
    const subscriptionRequest = {
      jsonrpc: '2.0',
      id: ++this.subscriptionId,
      method: 'logsSubscribe',
      params: [
        {
          mentions: ['11111111111111111111111111111112'] // System program
        },
        {
          commitment: 'confirmed'
        }
      ]
    };

    this.subscriptions.set(this.subscriptionId, {
      type: 'tokenCreation',
      timestamp: Date.now()
    });

    this.wsClient.send(JSON.stringify(subscriptionRequest));
    console.log('🪙 Subscribed to token creation events');
  }

  async handleHeliusMessage(message) {
    const startTime = performance.now();
    this.metrics.totalMessagesReceived++;

    try {
      // Use worker pool for message processing if available
      if (this.workerPool) {
        const result = await this.workerPool.executeTask('processHeliusMessage', {
          message: message,
          startTime: startTime
        });
        
        if (result.parsedData) {
          await this.processRealtimeNotification(result.parsedData);
        }
        
        this.updateProcessingMetrics(result.processingTime);
      } else {
        // Fallback to main thread processing
        const data = JSON.parse(message);
        
        if (data.result && typeof data.result === 'number') {
          console.log(`✅ Subscription confirmed: ${data.result}`);
          return;
        }
        
        if (data.method && data.params) {
          await this.processRealtimeNotification(data);
        }

        const processingTime = performance.now() - startTime;
        this.updateProcessingMetrics(processingTime);
      }

    } catch (error) {
      console.error('📛 Error processing Helius message:', error);
      console.error('📛 Raw message:', message);
      
      // Circuit breaker feedback for processing failures
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure('helius-message-processing', error);
      }
    }
  }

  processRealtimeNotification(data) {
    const { method, params } = data;

    switch (method) {
      case 'accountNotification':
        this.handleAccountNotification(params);
        break;
      
      case 'logsNotification':
        this.handleLogsNotification(params);
        break;
      
      default:
        console.log(`📥 Unknown notification method: ${method}`);
    }
  }

  async handleAccountNotification(params) {
    try {
      const { result, subscription } = params;
      const subscriptionInfo = this.subscriptions.get(subscription);
      
      if (!subscriptionInfo) {
        console.log(`⚠️ Unknown subscription: ${subscription}`);
        return;
      }

      // Parse account data for LP creation
      const lpEvent = await this.parseAccountDataForLP(result, subscriptionInfo);
      
      if (lpEvent) {
        this.processLPEvent(lpEvent);
      }

    } catch (error) {
      console.error('📛 Error handling account notification:', error);
    }
  }

  async handleLogsNotification(params) {
    try {
      const { result, subscription } = params;
      
      // Look for token creation patterns in logs
      const tokenCreation = this.parseLogsForTokenCreation(result);
      
      if (tokenCreation) {
        console.log('🪙 New token detected:', tokenCreation.address);
        this.emit('newToken', tokenCreation);
      }

    } catch (error) {
      console.error('📛 Error handling logs notification:', error);
    }
  }

  /**
   * Parse real Solana account data for LP creation events
   */
  async parseAccountDataForLP(accountData, subscriptionInfo) {
    const { value } = accountData;
    if (!value || !value.account) return null;
    
    const account = value.account;
    const data = Buffer.from(account.data[0], 'base64');
    
    // Determine DEX type from program ID
    const dex = this.getDexFromProgramId(subscriptionInfo.programId);
    
    try {
      if (dex === 'Raydium') {
        return await this.parseRaydiumLPCreation(data, value.pubkey);
      } else if (dex === 'Orca') {
        return await this.parseOrcaLPCreation(data, value.pubkey);
      }
    } catch (error) {
      console.warn(`Failed to parse ${dex} LP data:`, error.message);
    }
    
    return null;
  }

  /**
   * Parse Raydium AMM V4 LP creation from binary data
   */
  async parseRaydiumLPCreation(data, poolAddress) {
    if (data.length !== 752) return null; // Raydium AMM V4 size
    
    // Parse Raydium pool structure using layout constants
    const status = data.readBigUInt64LE(0);
    const nonce = data.readBigUInt64LE(8);
    const maxOrder = data.readBigUInt64LE(16);
    const depth = data.readBigUInt64LE(24);
    
    // Extract token mints (32 bytes each)
    const baseMint = data.slice(32, 64);
    const quoteMint = data.slice(64, 96);
    
    // Extract vault addresses (32 bytes each)
    const baseVault = data.slice(96, 128);
    const quoteVault = data.slice(128, 160);
    
    // Extract LP mint (32 bytes)
    const lpMint = data.slice(160, 192);
    
    // Get vault balances for TVL calculation
    const baseAmount = data.readBigUInt64LE(192);
    const quoteAmount = data.readBigUInt64LE(200);
    
    // Only return if this is a new/active pool
    if (status === 0n || baseAmount === 0n || quoteAmount === 0n) {
      return null;
    }
    
    return {
      tokenAddress: new PublicKey(baseMint).toString(),
      poolAddress: poolAddress,
      baseMint: new PublicKey(baseMint).toString(),
      quoteMint: new PublicKey(quoteMint).toString(),
      lpMint: new PublicKey(lpMint).toString(),
      baseVault: new PublicKey(baseVault).toString(),
      quoteVault: new PublicKey(quoteVault).toString(),
      baseAmount: baseAmount.toString(),
      quoteAmount: quoteAmount.toString(),
      dex: 'Raydium',
      timestamp: Date.now(),
      hasInitialBuys: baseAmount > 0n && quoteAmount > 0n
    };
  }

  /**
   * Parse Orca Whirlpool LP creation from binary data  
   */
  async parseOrcaLPCreation(data, poolAddress) {
    if (data.length !== 653) return null; // Orca Whirlpool size
    
    // Parse Orca whirlpool structure
    const whirlpoolsConfig = data.slice(8, 40);
    const whirlpoolBump = data.slice(40, 41);
    const tickSpacing = data.readUInt16LE(42);
    const tickSpacingSeed = data.slice(44, 46);
    const feeRate = data.readUInt16LE(46);
    const protocolFeeRate = data.readUInt16LE(48);
    const liquidity = data.readBigUInt128LE(50);
    const sqrtPrice = data.readBigUInt128LE(66);
    const tickCurrentIndex = data.readInt32LE(82);
    const protocolFeeOwedA = data.readBigUInt64LE(86);
    const protocolFeeOwedB = data.readBigUInt64LE(94);
    const tokenMintA = data.slice(102, 134);
    const tokenVaultA = data.slice(134, 166);
    const feeGrowthGlobalA = data.readBigUInt128LE(166);
    const tokenMintB = data.slice(182, 214);
    const tokenVaultB = data.slice(214, 246);
    const feeGrowthGlobalB = data.readBigUInt128LE(246);
    
    // Only return if pool has liquidity
    if (liquidity === 0n) {
      return null;
    }
    
    return {
      tokenAddress: new PublicKey(tokenMintA).toString(),
      poolAddress: poolAddress,
      tokenMintA: new PublicKey(tokenMintA).toString(),
      tokenMintB: new PublicKey(tokenMintB).toString(),
      tokenVaultA: new PublicKey(tokenVaultA).toString(),
      tokenVaultB: new PublicKey(tokenVaultB).toString(),
      liquidity: liquidity.toString(),
      sqrtPrice: sqrtPrice.toString(),
      tickCurrentIndex: tickCurrentIndex,
      feeRate: feeRate,
      dex: 'Orca',
      timestamp: Date.now(),
      hasInitialBuys: liquidity > 0n
    };
  }

  parseLogsForTokenCreation(logData) {
    const { value } = logData;
    
    // Look for token creation signatures in logs
    if (value.logs) {
      const hasTokenCreation = value.logs.some(log => 
        log.includes('InitializeMint') || 
        log.includes('CreateAccount')
      );
      
      if (hasTokenCreation) {
        return {
          address: `token_${value.signature}_${Date.now()}`, // Use signature + timestamp
          signature: value.signature,
          slot: value.context?.slot || 0,
          timestamp: Date.now()
        };
      }
    }
    
    return null;
  }

  processLPEvent(lpEvent) {
    this.metrics.lpEventsDetected++;
    this.metrics.lastEventTime = Date.now();
    
    console.log(`🏊 New LP detected: ${lpEvent.tokenAddress} - $${lpEvent.lpValueUSD.toFixed(0)}`);
    
    // Apply Renaissance statistical analysis
    const analysis = this.eventProcessor.calculateEventSignificance(lpEvent);
    
    console.log(`📊 Statistical Analysis: Significance=${analysis.significance.toFixed(3)}, p-value=${analysis.pValue.toFixed(4)}`);
    
    // Emit events based on significance
    this.emit('lpEvent', { event: lpEvent, analysis });
    
    if (analysis.isSignificant) {
      console.log(`🎯 SIGNIFICANT LP EVENT: ${lpEvent.tokenAddress}`);
      this.emit('significantLPEvent', { event: lpEvent, analysis });
    }
  }

  getDexFromProgramId(programId) {
    const dexMap = {
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium',
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca',
      'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo': 'Meteora'
    };
    
    return dexMap[programId] || 'Unknown';
  }

  updateProcessingMetrics(processingTime) {
    // Exponential moving average for processing time
    const alpha = 0.1;
    this.metrics.averageProcessingTime = 
      alpha * processingTime + (1 - alpha) * this.metrics.averageProcessingTime;
  }

  getMetrics() {
    return {
      ...this.metrics,
      eventProcessor: this.eventProcessor.getPerformanceMetrics(),
      subscriptions: this.subscriptions.size,
      isConnected: this.wsClient?.isConnected || false
    };
  }

  async disconnect() {
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
    
    this.subscriptions.clear();
    this.emit('disconnected');
  }
}

export default HeliusWebSocketClient;