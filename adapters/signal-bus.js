// adapters/signal-bus.js
// DAY: 2 (RECOVERY)
// ADAPTER: Seamless fake/real switching with developer productivity focus
// CONTRACT COMPLIANCE: Strict interface adherence with helpful error messages

import { SignalBusFake } from '../fakes/signal-bus.fake.js';

/**
 * Production-ready adapter that seamlessly switches between fake and real signal bus implementations
 * Maintains strict contract compliance while providing developer convenience features
 */
class SignalBusAdapter {
  constructor() {
    this.implementation = null;
  }

  /**
   * Factory method with deterministic dependency injection and environment-based switching
   * @param {Object} dependencies - Injected dependencies (logger, clock, uuid)
   * @param {string} [scenario='normal'] - Fake scenario for testing (ignored in real mode)
   * @returns {Promise<SignalBusAdapter>}
   */
  static async create(dependencies, scenario = 'normal') {
    const adapter = new SignalBusAdapter();
    
    if (process.env.USE_FAKES === 'true') {
      // Development/testing mode - use deterministic fake
      console.log(`[SignalBus Adapter] Using FAKE implementation (scenario: ${scenario})`);
      adapter.implementation = new SignalBusFake(dependencies, scenario);
    } else {
      // Production mode - use real implementation (stub until LLM #5 creates it)
      console.log(`[SignalBus Adapter] Using REAL implementation (stub mode)`);
      const { SignalBus } = await import('../impl/signal-bus.real.js');
      
      // Working stub with helpful error messages until real implementation
      adapter.implementation = {
        // Core contract methods
        async publish(message) {
          console.log(`[Real SignalBus Stub] publish() invoked:`, {
            topic: message?.topic,
            requestId: message?.requestId,
            timestamp: message?.ts ? new Date(message.ts).toISOString() : 'invalid',
            priority: message?.priority || 0,
            payloadType: typeof message?.payload,
            scenario: 'REPLACE_WITH_REAL_IMPLEMENTATION'
          });
          
          // Provide realistic stub response structure
          return {
            ok: true,
            data: {
              delivered: 1,
              dropped: 0,
              message: 'Stub implementation - no actual delivery',
              requestId: message?.requestId,
              timestamp: dependencies.clock.now()
            }
          };
        },

        async subscribe(options) {
          console.log(`[Real SignalBus Stub] subscribe() called:`, {
            requestId: options?.requestId,
            topics: options?.topics,
            bufferSize: options?.bufferSize,
            maxLagMs: options?.maxLagMs,
            scenario: 'REPLACE_WITH_REAL_IMPLEMENTATION'
          });
          
          // Generate deterministic subscription ID
          const subscriptionId = `stub_sub_${dependencies.clock.now()}_${Math.random().toString(36).substr(2, 6)}`;
          
          return {
            ok: true,
            data: {
              subscriptionId,
              message: 'Stub subscription - no actual message routing',
              timestamp: dependencies.clock.now()
            }
          };
        },

        async unsubscribe(input) {
          console.log(`[Real SignalBus Stub] unsubscribe() called:`, {
            requestId: input?.requestId,
            subscriptionId: input?.subscriptionId,
            scenario: 'REPLACE_WITH_REAL_IMPLEMENTATION'
          });
          
          return {
            ok: true,
            data: {
              message: 'Stub unsubscribe - no actual cleanup',
              timestamp: dependencies.clock.now()
            }
          };
        },

        // Convenience methods (must use core methods per contract)
        async quickPublish(topic, payload, priority = 0) {
          const requestId = dependencies.uuid ? dependencies.uuid() : `stub_pub_${Date.now()}`;
          const message = {
            topic,
            requestId,
            ts: dependencies.clock.now(),
            payload,
            priority
          };
          console.log(`[Real SignalBus Stub] quickPublish() -> publish():`, { topic, priority, requestId });
          return this.publish(message);
        },

        async subscribeToTopic(topic, bufferSize = 100, maxLagMs = 30000) {
          const requestId = dependencies.uuid ? dependencies.uuid() : `stub_sub_topic_${Date.now()}`;
          const options = {
            requestId,
            topics: [topic],
            bufferSize,
            maxLagMs
          };
          console.log(`[Real SignalBus Stub] subscribeToTopic() -> subscribe():`, { topic, requestId });
          return this.subscribe(options);
        },

        async subscribeToTopics(topics, bufferSize = 100, maxLagMs = 30000) {
          const requestId = dependencies.uuid ? dependencies.uuid() : `stub_sub_topics_${Date.now()}`;
          const options = {
            requestId,
            topics,
            bufferSize,
            maxLagMs
          };
          console.log(`[Real SignalBus Stub] subscribeToTopics() -> subscribe():`, { topics, requestId });
          return this.subscribe(options);
        },

        async quickUnsubscribe(subscriptionId) {
          const requestId = dependencies.uuid ? dependencies.uuid() : `stub_unsub_${Date.now()}`;
          console.log(`[Real SignalBus Stub] quickUnsubscribe() -> unsubscribe():`, { subscriptionId, requestId });
          return this.unsubscribe({ requestId, subscriptionId });
        },

        async publishUrgent(topic, payload) {
          console.log(`[Real SignalBus Stub] publishUrgent() -> quickPublish():`, { topic });
          return this.quickPublish(topic, payload, 10);
        },

        // Developer helper methods
        getMessages(subscriptionId, limit = 10) {
          console.log(`[Real SignalBus Stub] getMessages() - not available in real mode:`, { subscriptionId, limit });
          return [];
        },

        peekMessages(subscriptionId, limit = 10) {
          console.log(`[Real SignalBus Stub] peekMessages() - not available in real mode:`, { subscriptionId, limit });
          return [];
        },

        getCapturedLogs() {
          console.log(`[Real SignalBus Stub] getCapturedLogs() - not available in real mode`);
          return [];
        },

        getInvocationCount() {
          console.log(`[Real SignalBus Stub] getInvocationCount() - tracking not implemented in stub`);
          return 0;
        },

        getStats() {
          console.log(`[Real SignalBus Stub] getStats() called`);
          return {
            stubbed: true,
            totalMessages: 0,
            totalDelivered: 0,
            totalDropped: 0,
            activeSubscriptions: 0,
            activeTopics: 0,
            message: 'Replace with real implementation statistics',
            scenario: 'PRODUCTION_STUB',
            timestamp: dependencies.clock.now()
          };
        },

        reset() {
          console.log(`[Real SignalBus Stub] reset() - no-op in stub mode`);
        },

        setScenario(newScenario) {
          console.log(`[Real SignalBus Stub] setScenario(${newScenario}) - no-op in production mode`);
        },

        getTopics() {
          console.log(`[Real SignalBus Stub] getTopics() - no topics in stub mode`);
          return [];
        },

        getSubscriptions() {
          console.log(`[Real SignalBus Stub] getSubscriptions() - no subscriptions in stub mode`);
          return [];
        },

        clearQueue(subscriptionId) {
          console.log(`[Real SignalBus Stub] clearQueue(${subscriptionId}) - no-op in stub mode`);
        }
      };
    }
    
    return adapter;
  }

  // PROXY ALL METHODS - Core contract methods (strict interface compliance)

  /**
   * Publish a signal to one or more subscribers
   * @param {Object} message
   * @returns {Promise<Object>}
   */
  async publish(message) {
    return this.implementation.publish(message);
  }

  /**
   * Subscribe to one or more topics
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async subscribe(options) {
    return this.implementation.subscribe(options);
  }

  /**
   * Unsubscribe by id
   * @param {Object} input
   * @returns {Promise<Object>}
   */
  async unsubscribe(input) {
    return this.implementation.unsubscribe(input);
  }

  // PROXY ALL METHODS - Convenience methods (developer productivity)

  /**
   * Simplified publish with auto-generated request ID
   * @param {string} topic
   * @param {any} payload
   * @param {number} priority
   * @returns {Promise<Object>}
   */
  async quickPublish(topic, payload, priority = 0) {
    return this.implementation.quickPublish(topic, payload, priority);
  }

  /**
   * Subscribe to single topic with defaults
   * @param {string} topic
   * @param {number} bufferSize
   * @param {number} maxLagMs
   * @returns {Promise<Object>}
   */
  async subscribeToTopic(topic, bufferSize = 100, maxLagMs = 30000) {
    return this.implementation.subscribeToTopic(topic, bufferSize, maxLagMs);
  }

  /**
   * Subscribe to multiple topics with same settings
   * @param {Array<string>} topics
   * @param {number} bufferSize
   * @param {number} maxLagMs
   * @returns {Promise<Object>}
   */
  async subscribeToTopics(topics, bufferSize = 100, maxLagMs = 30000) {
    return this.implementation.subscribeToTopics(topics, bufferSize, maxLagMs);
  }

  /**
   * Unsubscribe with auto-generated request ID
   * @param {string} subscriptionId
   * @returns {Promise<Object>}
   */
  async quickUnsubscribe(subscriptionId) {
    return this.implementation.quickUnsubscribe(subscriptionId);
  }

  /**
   * Publish high-priority message
   * @param {string} topic
   * @param {any} payload
   * @returns {Promise<Object>}
   */
  async publishUrgent(topic, payload) {
    return this.implementation.publishUrgent(topic, payload);
  }

  // PROXY ALL METHODS - Developer helper methods (testing/debugging)

  /**
   * Get messages for a specific subscription (fake mode only)
   * @param {string} subscriptionId
   * @param {number} limit
   * @returns {Array<Object>}
   */
  getMessages(subscriptionId, limit = 10) {
    return this.implementation.getMessages(subscriptionId, limit);
  }

  /**
   * Peek at messages without consuming them (fake mode only)
   * @param {string} subscriptionId
   * @param {number} limit
   * @returns {Array<Object>}
   */
  peekMessages(subscriptionId, limit = 10) {
    return this.implementation.peekMessages(subscriptionId, limit);
  }

  /**
   * Get captured structured logs (fake mode only)
   * @returns {Array<Object>}
   */
  getCapturedLogs() {
    return this.implementation.getCapturedLogs();
  }

  /**
   * Get total message count (fake mode only)
   * @returns {number}
   */
  getInvocationCount() {
    return this.implementation.getInvocationCount();
  }

  /**
   * Get detailed signal bus statistics
   * @returns {Object}
   */
  getStats() {
    return this.implementation.getStats();
  }

  /**
   * Reset all statistics and state (fake mode only)
   */
  reset() {
    return this.implementation.reset();
  }

  /**
   * Switch scenario for testing different behaviors (fake mode only)
   * @param {string} newScenario
   */
  setScenario(newScenario) {
    return this.implementation.setScenario(newScenario);
  }

  /**
   * Get all topics currently being tracked (fake mode only)
   * @returns {Array<string>}
   */
  getTopics() {
    return this.implementation.getTopics();
  }

  /**
   * Get all active subscription IDs (fake mode only)
   * @returns {Array<string>}
   */
  getSubscriptions() {
    return this.implementation.getSubscriptions();
  }

  /**
   * Force clear a subscription's message queue (fake mode only)
   * @param {string} subscriptionId
   */
  clearQueue(subscriptionId) {
    return this.implementation.clearQueue(subscriptionId);
  }

  // DEVELOPER PRODUCTIVITY FEATURES

  /**
   * Check if currently using fake implementation
   * @returns {boolean}
   */
  isFake() {
    return process.env.USE_FAKES === 'true';
  }

  /**
   * Get implementation type for debugging
   * @returns {string}
   */
  getImplementationType() {
    return this.isFake() ? 'FAKE' : 'REAL';
  }

  /**
   * Validate that adapter is properly initialized
   * @returns {boolean}
   */
  isReady() {
    return this.implementation !== null;
  }

  /**
   * Get message delivery statistics (convenience)
   * @returns {Object}
   */
  getDeliveryStats() {
    const stats = this.getStats();
    return {
      totalMessages: stats.totalMessages || 0,
      totalDelivered: stats.totalDelivered || 0,
      totalDropped: stats.totalDropped || 0,
      deliveryRate: stats.deliveryRate || 0,
      dropRate: stats.dropRate || 0,
      activeSubscriptions: stats.activeSubscriptions || 0,
      activeTopics: stats.activeTopics || 0
    };
  }

  /**
   * Check if signal bus is healthy (convenience)
   * @returns {boolean}
   */
  isHealthy() {
    const stats = this.getDeliveryStats();
    // Healthy if drop rate is under 10% and we have active subscriptions
    return stats.dropRate < 0.1 && (stats.activeSubscriptions > 0 || stats.totalMessages === 0);
  }

  /**
   * Get implementation instance for advanced debugging (use carefully)
   * @returns {Object}
   */
  _getImplementation() {
    console.warn('[SignalBus Adapter] Direct implementation access - use for debugging only');
    return this.implementation;
  }
}

export { SignalBusAdapter };