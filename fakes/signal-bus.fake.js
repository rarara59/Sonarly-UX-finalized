// fakes/signal-bus.fake.js
// DAY: 2 (RECOVERY)
// FAKE: Deterministic intra-process pub/sub for trading signals with backpressure awareness
// SCENARIO SUPPORT: normal, backpressure, subscriber-down, message-lag, buffer-overflow, topic-filtering

/**
 * Deterministic fake signal bus for development/testing with scenario-based behavior
 */
class SignalBusFake {
  constructor(deps, scenario = 'normal') {
    // Validate required dependencies
    if (!deps?.logger) throw new Error('deps.logger is required');
    if (!deps?.clock) throw new Error('deps.clock is required');
    if (!deps?.uuid) throw new Error('deps.uuid is required');

    this.deps = deps;
    this.scenario = scenario;

    // Signal bus state
    this.subscriptions = new Map(); // subscriptionId -> subscription data
    this.subscriptionsByTopic = new Map(); // topic -> Set<subscriptionId>
    this.messageQueues = new Map(); // subscriptionId -> message queue
    this.nextSubscriptionId = 1;

    // Statistics tracking
    this.totalMessages = 0;
    this.totalDelivered = 0;
    this.totalDropped = 0;
    this.totalSubscriptions = 0;
    this.capturedLogs = [];
    this.messageHistory = []; // For debugging

    // Initialize scenario-specific state
    this._initializeScenario(scenario);
  }

  // CORE CONTRACT METHODS (strict compliance)

  /**
   * Publish a signal to one or more subscribers
   * @param {SignalMessage} message
   * @returns {Promise<SignalBusResult>}
   */
  async publish(message) {
    const startTime = this.deps.clock.now();
    this.totalMessages++;

    try {
      // Validation
      const validationResult = this._validateMessage(message);
      if (!validationResult.ok) {
        this._logOperation(message.requestId, 'publish', 'validation_error', 0);
        return validationResult;
      }

      // Scenario-specific behavior overrides
      const scenarioResult = this._applyScenarioBehavior('publish', message);
      if (scenarioResult) {
        this._logOperation(message.requestId, 'publish', scenarioResult.ok ? 'success' : 'failed', this.deps.clock.now() - startTime);
        return scenarioResult;
      }

      // Find subscribers for this topic
      const subscribers = this.subscriptionsByTopic.get(message.topic) || new Set();
      let delivered = 0;
      let dropped = 0;

      // Store message in history for debugging
      this.messageHistory.push({
        ...message,
        publishTime: this.deps.clock.now(),
        subscriberCount: subscribers.size
      });

      // Limit history size
      if (this.messageHistory.length > 1000) {
        this.messageHistory = this.messageHistory.slice(-500);
      }

      // Deliver to each subscriber
      for (const subscriptionId of subscribers) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
          // Cleanup stale subscription
          subscribers.delete(subscriptionId);
          continue;
        }

        const queue = this.messageQueues.get(subscriptionId) || [];
        
        // Check message lag
        const messageAge = this.deps.clock.now() - message.ts;
        if (messageAge > subscription.maxLagMs) {
          dropped++;
          this._logOperation(message.requestId, 'publish', 'message_too_old', 0, { 
            subscriptionId, 
            messageAge, 
            maxLag: subscription.maxLagMs 
          });
          continue;
        }

        // Check buffer capacity
        if (queue.length >= subscription.bufferSize) {
          dropped++;
          this._logOperation(message.requestId, 'publish', 'buffer_full', 0, { 
            subscriptionId, 
            queueSize: queue.length, 
            bufferSize: subscription.bufferSize 
          });
          continue;
        }

        // Add message to queue (with priority ordering)
        const queuedMessage = {
          ...message,
          deliveryTime: this.deps.clock.now(),
          subscriptionId
        };

        // Insert based on priority (higher priority first)
        const priority = message.priority || 0;
        let insertIndex = queue.length;
        for (let i = queue.length - 1; i >= 0; i--) {
          if ((queue[i].priority || 0) < priority) {
            insertIndex = i;
          } else {
            break;
          }
        }

        queue.splice(insertIndex, 0, queuedMessage);
        this.messageQueues.set(subscriptionId, queue);
        delivered++;
      }

      this.totalDelivered += delivered;
      this.totalDropped += dropped;

      this._logOperation(message.requestId, 'publish', 'success', this.deps.clock.now() - startTime, {
        topic: message.topic,
        delivered,
        dropped,
        subscriberCount: subscribers.size
      });

      return { 
        ok: true, 
        data: { delivered, dropped } 
      };

    } catch (error) {
      this._logOperation(message.requestId, 'publish', 'internal_error', this.deps.clock.now() - startTime);
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Unexpected error: ${error.message}` }
      };
    }
  }

  /**
   * Subscribe to one or more topics
   * @param {SubscriptionOptions} options
   * @returns {Promise<{ok:true, data:{subscriptionId:string}} | {ok:false, error:{code:string, message:string}}>}
   */
  async subscribe(options) {
    const startTime = this.deps.clock.now();
    
    try {
      // Validation
      const validationResult = this._validateSubscriptionOptions(options);
      if (!validationResult.ok) {
        this._logOperation(options.requestId, 'subscribe', 'validation_error', 0);
        return validationResult;
      }

      // Scenario-specific behavior overrides
      const scenarioResult = this._applyScenarioBehavior('subscribe', options);
      if (scenarioResult) {
        this._logOperation(options.requestId, 'subscribe', scenarioResult.ok ? 'success' : 'failed', this.deps.clock.now() - startTime);
        return scenarioResult;
      }

      // Generate subscription ID
      const subscriptionId = `sub_${this.nextSubscriptionId++}_${this.deps.clock.now()}`;
      
      // Create subscription
      const subscription = {
        subscriptionId,
        requestId: options.requestId,
        topics: [...options.topics], // Copy array
        bufferSize: options.bufferSize,
        maxLagMs: options.maxLagMs,
        createdAt: this.deps.clock.now(),
        messageCount: 0
      };

      this.subscriptions.set(subscriptionId, subscription);
      this.messageQueues.set(subscriptionId, []);
      this.totalSubscriptions++;

      // Register subscription for each topic
      for (const topic of options.topics) {
        if (!this.subscriptionsByTopic.has(topic)) {
          this.subscriptionsByTopic.set(topic, new Set());
        }
        this.subscriptionsByTopic.get(topic).add(subscriptionId);
      }

      this._logOperation(options.requestId, 'subscribe', 'success', this.deps.clock.now() - startTime, {
        subscriptionId,
        topics: options.topics,
        bufferSize: options.bufferSize
      });

      return { 
        ok: true, 
        data: { subscriptionId } 
      };

    } catch (error) {
      this._logOperation(options.requestId, 'subscribe', 'internal_error', this.deps.clock.now() - startTime);
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Unexpected error: ${error.message}` }
      };
    }
  }

  /**
   * Unsubscribe by id
   * @param {{requestId: string, subscriptionId: string}} input
   * @returns {Promise<SignalBusResult>}
   */
  async unsubscribe(input) {
    const startTime = this.deps.clock.now();

    try {
      // Validation
      const validationResult = this._validateUnsubscribeInput(input);
      if (!validationResult.ok) {
        this._logOperation(input.requestId, 'unsubscribe', 'validation_error', 0);
        return validationResult;
      }

      const subscription = this.subscriptions.get(input.subscriptionId);
      if (!subscription) {
        this._logOperation(input.requestId, 'unsubscribe', 'not_found', this.deps.clock.now() - startTime);
        return {
          ok: false,
          error: { code: 'NOT_FOUND', message: `Subscription not found: ${input.subscriptionId}` }
        };
      }

      // Remove from topic subscriptions
      for (const topic of subscription.topics) {
        const topicSubscribers = this.subscriptionsByTopic.get(topic);
        if (topicSubscribers) {
          topicSubscribers.delete(input.subscriptionId);
          if (topicSubscribers.size === 0) {
            this.subscriptionsByTopic.delete(topic);
          }
        }
      }

      // Clean up subscription data
      this.subscriptions.delete(input.subscriptionId);
      this.messageQueues.delete(input.subscriptionId);

      this._logOperation(input.requestId, 'unsubscribe', 'success', this.deps.clock.now() - startTime, {
        subscriptionId: input.subscriptionId,
        topics: subscription.topics
      });

      return { ok: true };

    } catch (error) {
      this._logOperation(input.requestId, 'unsubscribe', 'internal_error', this.deps.clock.now() - startTime);
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Unexpected error: ${error.message}` }
      };
    }
  }

  // CONVENIENCE METHODS (must call core methods)

  /**
   * Simplified publish with auto-generated request ID
   */
  async quickPublish(topic, payload, priority = 0) {
    const requestId = this.deps.uuid();
    const message = {
      topic,
      requestId,
      ts: this.deps.clock.now(),
      payload,
      priority
    };
    return this.publish(message);
  }

  /**
   * Subscribe to single topic with defaults
   */
  async subscribeToTopic(topic, bufferSize = 100, maxLagMs = 30000) {
    const requestId = this.deps.uuid();
    const options = {
      requestId,
      topics: [topic],
      bufferSize,
      maxLagMs
    };
    return this.subscribe(options);
  }

  /**
   * Subscribe to multiple topics with same settings
   */
  async subscribeToTopics(topics, bufferSize = 100, maxLagMs = 30000) {
    const requestId = this.deps.uuid();
    const options = {
      requestId,
      topics,
      bufferSize,
      maxLagMs
    };
    return this.subscribe(options);
  }

  /**
   * Unsubscribe with auto-generated request ID
   */
  async quickUnsubscribe(subscriptionId) {
    const requestId = this.deps.uuid();
    return this.unsubscribe({ requestId, subscriptionId });
  }

  /**
   * Publish high-priority message
   */
  async publishUrgent(topic, payload) {
    return this.quickPublish(topic, payload, 10);
  }

  // DEVELOPER HELPERS (productivity)

  /**
   * Get messages for a specific subscription
   */
  getMessages(subscriptionId, limit = 10) {
    const queue = this.messageQueues.get(subscriptionId) || [];
    const messages = queue.slice(0, limit);
    
    // Mark messages as consumed
    if (messages.length > 0) {
      this.messageQueues.set(subscriptionId, queue.slice(limit));
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        subscription.messageCount += messages.length;
      }
    }

    return messages;
  }

  /**
   * Peek at messages without consuming them
   */
  peekMessages(subscriptionId, limit = 10) {
    const queue = this.messageQueues.get(subscriptionId) || [];
    return queue.slice(0, limit);
  }

  /**
   * Get captured structured logs for testing/debugging
   */
  getCapturedLogs() {
    return [...this.capturedLogs];
  }

  /**
   * Get total message count
   */
  getInvocationCount() {
    return this.totalMessages;
  }

  /**
   * Get detailed signal bus statistics
   */
  getStats() {
    const topicStats = {};
    for (const [topic, subscribers] of this.subscriptionsByTopic) {
      topicStats[topic] = {
        subscriberCount: subscribers.size,
        subscribers: [...subscribers]
      };
    }

    const subscriptionStats = {};
    for (const [id, subscription] of this.subscriptions) {
      const queue = this.messageQueues.get(id) || [];
      subscriptionStats[id] = {
        topics: subscription.topics,
        bufferSize: subscription.bufferSize,
        queuedMessages: queue.length,
        messageCount: subscription.messageCount,
        createdAt: subscription.createdAt,
        age: this.deps.clock.now() - subscription.createdAt
      };
    }

    return {
      scenario: this.scenario,
      totalMessages: this.totalMessages,
      totalDelivered: this.totalDelivered,
      totalDropped: this.totalDropped,
      totalSubscriptions: this.totalSubscriptions,
      activeSubscriptions: this.subscriptions.size,
      activeTopics: this.subscriptionsByTopic.size,
      deliveryRate: this.totalMessages > 0 ? this.totalDelivered / this.totalMessages : 0,
      dropRate: this.totalMessages > 0 ? this.totalDropped / this.totalMessages : 0,
      topicStats,
      subscriptionStats,
      messageHistory: this.messageHistory.length,
      capturedLogs: this.capturedLogs.length
    };
  }

  /**
   * Reset all statistics and state
   */
  reset() {
    this.subscriptions.clear();
    this.subscriptionsByTopic.clear();
    this.messageQueues.clear();
    this.nextSubscriptionId = 1;
    this.totalMessages = 0;
    this.totalDelivered = 0;
    this.totalDropped = 0;
    this.totalSubscriptions = 0;
    this.capturedLogs = [];
    this.messageHistory = [];
    this._initializeScenario(this.scenario);
  }

  /**
   * Switch scenario for testing different behaviors
   */
  setScenario(newScenario) {
    this.scenario = newScenario;
    this._initializeScenario(newScenario);
  }

  /**
   * Get all topics currently being tracked
   */
  getTopics() {
    return [...this.subscriptionsByTopic.keys()];
  }

  /**
   * Get all active subscription IDs
   */
  getSubscriptions() {
    return [...this.subscriptions.keys()];
  }

  /**
   * Force clear a subscription's message queue
   */
  clearQueue(subscriptionId) {
    this.messageQueues.set(subscriptionId, []);
  }

  // PRIVATE IMPLEMENTATION METHODS

  _validateMessage(message) {
    if (!message || typeof message !== 'object') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'message must be object' }
      };
    }

    // Topic validation
    if (!message.topic || typeof message.topic !== 'string') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'message.topic is required and must be non-empty string' }
      };
    }

    if (message.topic.length > 256) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'message.topic must be ≤ 256 characters' }
      };
    }

    // RequestId validation
    if (!message.requestId || typeof message.requestId !== 'string' || message.requestId.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'message.requestId is required and must be non-empty string' }
      };
    }

    // Timestamp validation
    if (!Number.isInteger(message.ts)) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'message.ts must be integer' }
      };
    }

    const now = this.deps.clock.now();
    const maxDrift = 300000; // 5 minutes
    if (Math.abs(message.ts - now) > maxDrift) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: `message.ts must be within ±5 minutes of current time (${now})` }
      };
    }

    // Priority validation
    if (message.priority !== undefined) {
      if (!Number.isInteger(message.priority) || message.priority < 0) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'message.priority must be integer ≥ 0' }
        };
      }
    }

    // Payload JSON serialization test
    if (message.payload !== undefined) {
      try {
        JSON.stringify(message.payload);
      } catch (e) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'message.payload must be JSON-serializable' }
        };
      }

      // Check for BigInt or functions
      const hasInvalidTypes = this._hasInvalidTypes(message.payload);
      if (hasInvalidTypes) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'message.payload cannot contain BigInt or functions' }
        };
      }
    }

    return { ok: true };
  }

  _validateSubscriptionOptions(options) {
    if (!options || typeof options !== 'object') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'options must be object' }
      };
    }

    // RequestId validation
    if (!options.requestId || typeof options.requestId !== 'string' || options.requestId.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'options.requestId is required and must be non-empty string' }
      };
    }

    // Topics validation
    if (!Array.isArray(options.topics) || options.topics.length === 0) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'options.topics must be non-empty array' }
      };
    }

    const uniqueTopics = new Set();
    for (const topic of options.topics) {
      if (!topic || typeof topic !== 'string' || topic.trim() === '') {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'each topic must be non-empty string' }
        };
      }
      
      if (uniqueTopics.has(topic)) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: `duplicate topic: ${topic}` }
        };
      }
      
      uniqueTopics.add(topic);
    }

    // BufferSize validation
    if (!Number.isInteger(options.bufferSize) || options.bufferSize < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'options.bufferSize must be integer ≥ 1' }
      };
    }

    // MaxLagMs validation
    if (!Number.isInteger(options.maxLagMs) || options.maxLagMs < 0) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'options.maxLagMs must be integer ≥ 0' }
      };
    }

    return { ok: true };
  }

  _validateUnsubscribeInput(input) {
    if (!input || typeof input !== 'object') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'input must be object' }
      };
    }

    if (!input.requestId || typeof input.requestId !== 'string' || input.requestId.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'input.requestId is required and must be non-empty string' }
      };
    }

    if (!input.subscriptionId || typeof input.subscriptionId !== 'string' || input.subscriptionId.trim() === '') {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'input.subscriptionId is required and must be non-empty string' }
      };
    }

    return { ok: true };
  }

  _hasInvalidTypes(obj) {
    if (typeof obj === 'bigint' || typeof obj === 'function') return true;
    if (Array.isArray(obj)) return obj.some(item => this._hasInvalidTypes(item));
    if (obj && typeof obj === 'object') return Object.values(obj).some(value => this._hasInvalidTypes(value));
    return false;
  }

  _applyScenarioBehavior(operation, input) {
    switch (this.scenario) {
      case 'backpressure':
        if (operation === 'publish') {
          return {
            ok: false,
            error: { code: 'RATE_LIMITED', message: 'Scenario: backpressure active' }
          };
        }
        break;

      case 'subscriber-down':
        if (operation === 'subscribe') {
          return {
            ok: false,
            error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Scenario: subscriber system unavailable' }
          };
        }
        break;

      case 'buffer-overflow':
        if (operation === 'publish') {
          // Simulate all buffers being full
          const subscriberCount = this.subscriptionsByTopic.get(input.topic)?.size || 0;
          return {
            ok: true,
            data: { delivered: 0, dropped: subscriberCount }
          };
        }
        break;
    }
    
    return null; // Use normal behavior
  }

  _initializeScenario(scenario) {
    switch (scenario) {
      case 'topic-filtering':
        // Pre-create some test subscriptions
        this.subscriptions.set('test_sub_1', {
          subscriptionId: 'test_sub_1',
          requestId: 'test_req_1',
          topics: ['meme_coins', 'trading_signals'],
          bufferSize: 50,
          maxLagMs: 10000,
          createdAt: this.deps.clock.now(),
          messageCount: 0
        });
        this.messageQueues.set('test_sub_1', []);
        
        for (const topic of ['meme_coins', 'trading_signals']) {
          if (!this.subscriptionsByTopic.has(topic)) {
            this.subscriptionsByTopic.set(topic, new Set());
          }
          this.subscriptionsByTopic.get(topic).add('test_sub_1');
        }
        break;

      default:
        // Normal initialization already done in constructor
        break;
    }
  }

  _logOperation(requestId, operation, outcome, durationMs, details = {}) {
    const logEntry = {
      requestId,
      operation,
      outcome,
      durationMs: Math.round(durationMs * 100) / 100,
      timestamp: this.deps.clock.now(),
      ...details
    };

    this.capturedLogs.push(logEntry);

    // Limit log size
    if (this.capturedLogs.length > 1000) {
      this.capturedLogs = this.capturedLogs.slice(-500);
    }

    this.deps.logger.info('Signal bus operation', logEntry);
  }
}

export { SignalBusFake };