// src/scripts-js/data-distributor.js
const { EventEmitter } = require('events');

/**
 * Data Distribution Channel for managing subscriber groups
 */
class DistributionChannel {
  constructor(channelName, config = {}) {
    this.channelName = channelName;
    this.subscribers = new Map();
    this.config = {
      maxSubscribers: config.maxSubscribers || 100,
      bufferSize: config.bufferSize || 1000,
      deliveryTimeout: config.deliveryTimeout || 5000,
      retryAttempts: config.retryAttempts || 3,
      enableFiltering: config.enableFiltering !== false
    };
    
    // Message buffer for reliable delivery
    this.messageBuffer = [];
    this.messageId = 0;
    
    // Performance tracking
    this.metrics = {
      messagesDelivered: 0,
      failedDeliveries: 0,
      totalLatency: 0,
      subscriberCount: 0
    };
  }

  /**
   * Add subscriber to channel
   */
  addSubscriber(subscriberId, subscriber) {
    if (this.subscribers.size >= this.config.maxSubscribers) {
      throw new Error(`Channel ${this.channelName} has reached maximum subscribers`);
    }
    
    this.subscribers.set(subscriberId, {
      ...subscriber,
      subscribedAt: new Date(),
      deliveredMessages: 0,
      failedMessages: 0,
      lastDelivery: null
    });
    
    this.metrics.subscriberCount = this.subscribers.size;
  }

  /**
   * Remove subscriber from channel
   */
  removeSubscriber(subscriberId) {
    const removed = this.subscribers.delete(subscriberId);
    this.metrics.subscriberCount = this.subscribers.size;
    return removed;
  }

  /**
   * Broadcast message to all subscribers
   */
  async broadcast(message) {
    const messageId = ++this.messageId;
    const deliveryPromises = [];
    
    // Add message to buffer
    this.addToBuffer(message, messageId);
    
    // Deliver to all subscribers
    for (const [subscriberId, subscriber] of this.subscribers) {
      if (this.shouldDeliverToSubscriber(message, subscriber)) {
        const promise = this.deliverToSubscriber(subscriberId, subscriber, message, messageId);
        deliveryPromises.push(promise);
      }
    }
    
    // Wait for all deliveries
    const results = await Promise.allSettled(deliveryPromises);
    
    // Update metrics
    this.updateDeliveryMetrics(results);
    
    return {
      messageId,
      totalSubscribers: this.subscribers.size,
      deliveryAttempts: deliveryPromises.length,
      successfulDeliveries: results.filter(r => r.status === 'fulfilled').length,
      failedDeliveries: results.filter(r => r.status === 'rejected').length
    };
  }

  /**
   * Check if message should be delivered to subscriber
   */
  shouldDeliverToSubscriber(message, subscriber) {
    if (!this.config.enableFiltering) return true;
    
    // Apply subscriber filters
    if (subscriber.filters) {
      for (const filter of subscriber.filters) {
        if (!this.applyFilter(message, filter)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Apply filter to message
   */
  applyFilter(message, filter) {
    switch (filter.type) {
      case 'tokenAddress':
        return message.tokenAddress === filter.value;
      case 'dataType':
        return message.type === filter.value;
      case 'minPrice':
        return message.currentPrice >= filter.value;
      case 'maxPrice':
        return message.currentPrice <= filter.value;
      case 'minVolume':
        return message.volume24h >= filter.value;
      case 'maxVolume':
        return message.volume24h <= filter.value;
      default:
        return true;
    }
  }

  /**
   * Deliver message to specific subscriber
   */
  async deliverToSubscriber(subscriberId, subscriber, message, messageId) {
    const startTime = Date.now();
    
    try {
      // Create delivery context
      const deliveryContext = {
        messageId,
        subscriberId,
        channelName: this.channelName,
        timestamp: new Date(),
        retryCount: 0
      };
      
      // Deliver message
      if (typeof subscriber.callback === 'function') {
        await subscriber.callback(message, deliveryContext);
      } else if (subscriber.receiveData) {
        await subscriber.receiveData(message, deliveryContext);
      } else {
        throw new Error('No valid callback method found');
      }
      
      // Update subscriber metrics
      const subscriberData = this.subscribers.get(subscriberId);
      if (subscriberData) {
        subscriberData.deliveredMessages++;
        subscriberData.lastDelivery = new Date();
      }
      
      const latency = Date.now() - startTime;
      this.metrics.totalLatency += latency;
      this.metrics.messagesDelivered++;
      
      return { success: true, latency };
      
    } catch (error) {
      // Update failure metrics
      const subscriberData = this.subscribers.get(subscriberId);
      if (subscriberData) {
        subscriberData.failedMessages++;
      }
      
      this.metrics.failedDeliveries++;
      
      throw error;
    }
  }

  /**
   * Add message to buffer
   */
  addToBuffer(message, messageId) {
    this.messageBuffer.push({
      messageId,
      message,
      timestamp: new Date()
    });
    
    // Trim buffer if too large
    if (this.messageBuffer.length > this.config.bufferSize) {
      this.messageBuffer.shift();
    }
  }

  /**
   * Update delivery metrics
   */
  updateDeliveryMetrics(results) {
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    this.metrics.messagesDelivered += successful;
    this.metrics.failedDeliveries += failed;
  }

  /**
   * Get channel metrics
   */
  getMetrics() {
    return {
      channelName: this.channelName,
      subscriberCount: this.metrics.subscriberCount,
      messagesDelivered: this.metrics.messagesDelivered,
      failedDeliveries: this.metrics.failedDeliveries,
      averageLatency: this.metrics.messagesDelivered > 0 ? 
        this.metrics.totalLatency / this.metrics.messagesDelivered : 0,
      successRate: this.metrics.messagesDelivered > 0 ?
        (this.metrics.messagesDelivered / (this.metrics.messagesDelivered + this.metrics.failedDeliveries)) * 100 : 0,
      bufferSize: this.messageBuffer.length
    };
  }
}

/**
 * Data Distributor - Renaissance-Grade Data Distribution
 * Manages pub/sub for real-time data distribution to signal modules
 */
class DataDistributor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Channel configuration
      maxChannels: config.maxChannels || 50,
      defaultChannelConfig: config.defaultChannelConfig || {},
      
      // Distribution settings
      batchSize: config.batchSize || 100,
      maxConcurrentDeliveries: config.maxConcurrentDeliveries || 20,
      deliveryTimeout: config.deliveryTimeout || 5000,
      
      // Reliability settings
      enableReliableDelivery: config.enableReliableDelivery !== false,
      ackTimeout: config.ackTimeout || 10000,
      maxRetries: config.maxRetries || 3,
      
      // Performance settings
      enableBatching: config.enableBatching !== false,
      batchingInterval: config.batchingInterval || 100,
      enableCompression: config.enableCompression || false,
      
      // Monitoring
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 60000,
      
      // Load balancing
      enableLoadBalancing: config.enableLoadBalancing || false,
      loadBalancingStrategy: config.loadBalancingStrategy || 'round-robin'
    };
    
    // Distribution channels
    this.channels = new Map();
    this.defaultChannel = null;
    
    // Distribution queue
    this.distributionQueue = [];
    this.isProcessingQueue = false;
    
    // Subscriber registry
    this.subscribers = new Map();
    this.subscriberGroups = new Map();
    
    // Performance metrics
    this.metrics = {
      totalMessages: 0,
      messagesDelivered: 0,
      failedMessages: 0,
      totalChannels: 0,
      totalSubscribers: 0,
      averageDeliveryTime: 0,
      peakThroughput: 0,
      currentThroughput: 0,
      
      // Channel metrics
      channelStats: {},
      
      // Throughput tracking
      throughputHistory: [],
      
      lastUpdated: new Date()
    };
    
    // Background tasks
    this.metricsInterval = null;
    this.queueProcessor = null;
    
    this.isInitialized = false;
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, ...args) => console.log(`[DataDistributor] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[DataDistributor] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[DataDistributor] ${msg}`, ...args),
      debug: (msg, ...args) => console.debug(`[DataDistributor] ${msg}`, ...args)
    };
  }

  /**
   * Initialize data distributor
   */
  async initialize() {
    if (this.isInitialized) return;
    
    this.logger.info('🚀 Initializing Data Distributor...');
    
    try {
      // Create default channel
      this.defaultChannel = this.createChannel('default');
      
      // Create specialized channels
      this.createChannel('tokens');
      this.createChannel('market');
      this.createChannel('signals');
      this.createChannel('alerts');
      
      // Start background tasks
      this.startBackgroundTasks();
      
      this.isInitialized = true;
      this.logger.info('✅ Data Distributor initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Data Distributor:', error);
      throw error;
    }
  }

  /**
   * Create distribution channel
   */
  createChannel(channelName, config = {}) {
    if (this.channels.has(channelName)) {
      throw new Error(`Channel ${channelName} already exists`);
    }
    
    if (this.channels.size >= this.config.maxChannels) {
      throw new Error('Maximum number of channels reached');
    }
    
    const channelConfig = { ...this.config.defaultChannelConfig, ...config };
    const channel = new DistributionChannel(channelName, channelConfig);
    
    this.channels.set(channelName, channel);
    this.metrics.totalChannels = this.channels.size;
    
    this.logger.info(`📡 Channel '${channelName}' created`);
    return channel;
  }

  /**
   * Delete distribution channel
   */
  deleteChannel(channelName) {
    if (channelName === 'default') {
      throw new Error('Cannot delete default channel');
    }
    
    const deleted = this.channels.delete(channelName);
    if (deleted) {
      this.metrics.totalChannels = this.channels.size;
      this.logger.info(`📡 Channel '${channelName}' deleted`);
    }
    
    return deleted;
  }

  /**
   * Subscribe to data distribution
   */
  subscribe(subscriberId, options = {}) {
    const {
      channels = ['default'],
      callback,
      filters = [],
      priority = 'normal',
      batchSize = 1,
      maxLatency = 1000
    } = options;
    
    // Validate callback
    if (!callback && !options.receiveData) {
      throw new Error('Callback or receiveData method required');
    }
    
    // Create subscriber record
    const subscriber = {
      subscriberId,
      callback: callback || options.receiveData,
      filters,
      priority,
      batchSize,
      maxLatency,
      channels: new Set(channels),
      subscribedAt: new Date(),
      lastMessage: null,
      messageCount: 0
    };
    
    // Register subscriber
    this.subscribers.set(subscriberId, subscriber);
    
    // Add to channels
    channels.forEach(channelName => {
      const channel = this.channels.get(channelName);
      if (channel) {
        channel.addSubscriber(subscriberId, subscriber);
      } else {
        this.logger.warn(`Channel '${channelName}' not found for subscriber ${subscriberId}`);
      }
    });
    
    this.metrics.totalSubscribers = this.subscribers.size;
    this.logger.info(`📡 Subscriber '${subscriberId}' registered to channels: ${channels.join(', ')}`);
    
    return true;
  }

  /**
   * Unsubscribe from data distribution
   */
  unsubscribe(subscriberId) {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) {
      return false;
    }
    
    // Remove from all channels
    subscriber.channels.forEach(channelName => {
      const channel = this.channels.get(channelName);
      if (channel) {
        channel.removeSubscriber(subscriberId);
      }
    });
    
    // Remove from registry
    this.subscribers.delete(subscriberId);
    
    this.metrics.totalSubscribers = this.subscribers.size;
    this.logger.info(`📡 Subscriber '${subscriberId}' unsubscribed`);
    
    return true;
  }

  /**
   * Distribute data to subscribers
   */
  async distribute(data, options = {}) {
    const {
      channels = ['default'],
      priority = 'normal',
      reliable = false,
      metadata = {}
    } = options;
    
    const distributionId = this.generateDistributionId();
    const startTime = Date.now();
    
    try {
      this.metrics.totalMessages++;
      
      // Create distribution message
      const message = {
        distributionId,
        data,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          priority,
          reliable
        },
        channels: new Set(channels)
      };
      
      // Add to distribution queue
      this.distributionQueue.push(message);
      
      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        this.processDistributionQueue();
      }
      
      const processingTime = Date.now() - startTime;
      this.updateThroughputMetrics();
      
      return {
        distributionId,
        channels: channels.length,
        processingTime,
        queued: true
      };
      
    } catch (error) {
      this.metrics.failedMessages++;
      this.logger.error('Distribution failed:', error);
      throw error;
    }
  }

  /**
   * Process distribution queue
   */
  async processDistributionQueue() {
    if (this.isProcessingQueue || this.distributionQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.distributionQueue.length > 0) {
        const batchSize = Math.min(this.config.batchSize, this.distributionQueue.length);
        const batch = this.distributionQueue.splice(0, batchSize);
        
        // Process batch
        await this.processBatch(batch);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Process batch of messages
   */
  async processBatch(batch) {
    const deliveryPromises = [];
    
    for (const message of batch) {
      for (const channelName of message.channels) {
        const channel = this.channels.get(channelName);
        if (channel) {
          const promise = this.deliverToChannel(channel, message);
          deliveryPromises.push(promise);
        }
      }
    }
    
    // Wait for all deliveries
    const results = await Promise.allSettled(deliveryPromises);
    
    // Update metrics
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    this.metrics.messagesDelivered += successful;
    this.metrics.failedMessages += failed;
  }

  /**
   * Deliver message to channel
   */
  async deliverToChannel(channel, message) {
    const startTime = Date.now();
    
    try {
      const result = await channel.broadcast(message.data);
      
      const deliveryTime = Date.now() - startTime;
      this.metrics.averageDeliveryTime = (this.metrics.averageDeliveryTime + deliveryTime) / 2;
      
      return result;
      
    } catch (error) {
      this.logger.error(`Delivery to channel ${channel.channelName} failed:`, error);
      throw error;
    }
  }

  /**
   * Broadcast to all channels
   */
  async broadcast(data, options = {}) {
    const channelNames = Array.from(this.channels.keys());
    
    return this.distribute(data, {
      ...options,
      channels: channelNames
    });
  }

  /**
   * Send to specific channel
   */
  async sendToChannel(channelName, data, options = {}) {
    return this.distribute(data, {
      ...options,
      channels: [channelName]
    });
  }

  /**
   * Send to Signal Orchestrator (main integration point)
   */
  async sendToSignalOrchestrator(data) {
    return this.sendToChannel('signals', data, {
      priority: 'high',
      reliable: true,
      metadata: {
        source: 'dataDistributor',
        type: 'signalData'
      }
    });
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    // Process distribution queue
    this.queueProcessor = setInterval(() => {
      if (this.distributionQueue.length > 0) {
        this.processDistributionQueue();
      }
    }, this.config.batchingInterval);
    
    // Update metrics
    if (this.config.enableMetrics) {
      this.metricsInterval = setInterval(() => {
        this.updateMetrics();
      }, this.config.metricsInterval);
    }
    
    this.logger.info('🔄 Background tasks started');
  }

  /**
   * Stop background tasks
   */
  stopBackgroundTasks() {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Update throughput metrics
   */
  updateThroughputMetrics() {
    const now = Date.now();
    this.metrics.throughputHistory.push(now);
    
    // Keep only last minute of data
    const oneMinuteAgo = now - 60000;
    this.metrics.throughputHistory = this.metrics.throughputHistory.filter(time => time > oneMinuteAgo);
    
    // Calculate current throughput (messages per second)
    this.metrics.currentThroughput = this.metrics.throughputHistory.length / 60;
    this.metrics.peakThroughput = Math.max(this.metrics.peakThroughput, this.metrics.currentThroughput);
  }

  /**
   * Update metrics
   */
  updateMetrics() {
    // Update channel metrics
    this.metrics.channelStats = {};
    
    for (const [channelName, channel] of this.channels) {
      this.metrics.channelStats[channelName] = channel.getMetrics();
    }
    
    this.metrics.lastUpdated = new Date();
    this.emit('metricsUpdated', this.metrics);
  }

  /**
   * Generate distribution ID
   */
  generateDistributionId() {
    return `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get distributor metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalMessages > 0 ?
        (this.metrics.messagesDelivered / this.metrics.totalMessages) * 100 : 0,
      queueSize: this.distributionQueue.length,
      channels: Array.from(this.channels.keys()),
      subscribers: Array.from(this.subscribers.keys())
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const queueBacklog = this.distributionQueue.length;
    const failureRate = (metrics.failedMessages / metrics.totalMessages) * 100;
    
    let status = 'HEALTHY';
    
    if (queueBacklog > 1000 || failureRate > 10) {
      status = 'CRITICAL';
    } else if (queueBacklog > 500 || failureRate > 5) {
      status = 'WARNING';
    }
    
    return {
      status,
      queueBacklog,
      failureRate,
      throughput: metrics.currentThroughput,
      channels: metrics.totalChannels,
      subscribers: metrics.totalSubscribers,
      lastChecked: new Date()
    };
  }

  /**
   * Shutdown distributor
   */
  async shutdown() {
    this.logger.info('🛑 Shutting down Data Distributor...');
    
    // Stop background tasks
    this.stopBackgroundTasks();
    
    // Process remaining queue
    if (this.distributionQueue.length > 0) {
      await this.processDistributionQueue();
    }
    
    // Clear channels and subscribers
    this.channels.clear();
    this.subscribers.clear();
    
    this.logger.info('✅ Data Distributor shutdown complete');
  }
}

export default DataDistributor;