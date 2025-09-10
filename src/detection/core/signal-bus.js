/**
 * SignalBus - Event-driven communication with subscriber isolation
 * 
 * High-performance, memory-safe event bus for meme coin trading systems.
 * Provides bounded queues, crash isolation, and zero external dependencies.
 * 
 * Key features:
 * - Bounded event queues with overflow protection
 * - Subscriber crash isolation (one failure doesn't affect others)
 * - Timer-based event processing with configurable intervals
 * - Complete lifecycle management (start/stop)
 * - Built-in metrics and structured logging
 * 
 * Renaissance principle: Simple, reliable, fast - optimized for production trading systems.
 */

class SignalBus {
  /**
   * Creates a new SignalBus instance
   * 
   * @param {Object} config - Configuration options
   * @param {number} config.maxQueueSize - Maximum events per topic queue (default: 1000)
   * @param {number} config.processingIntervalMs - Timer interval for event processing (default: 10ms)
   * @param {Object} logger - Optional logger instance (defaults to console logging)
   */
  constructor(config = {}, logger = null) {
    this.config = config;
    this.logger = logger || this._createDefaultLogger();
    
    // Event storage - separate Maps for queues and subscribers per topic
    this.eventQueues = new Map(); // topic -> array of event objects
    this.subscribers = new Map();  // topic -> array of callback functions
    
    // Configuration with safe defaults
    this.maxQueueSize = config.maxQueueSize || 1000;
    this.processingIntervalMs = config.processingIntervalMs || 10;
    
    // Runtime metrics for monitoring
    this.stats = {
      totalEvents: 0,        // Total events published
      totalDeliveries: 0,    // Total successful deliveries
      droppedEvents: 0,      // Events dropped due to queue overflow
      subscriberErrors: 0    // Count of subscriber callback errors
    };
    
    // Processing state management
    this.isProcessing = false;
    this.processingTimer = null;
  }

  /**
   * Creates default console-based logger with structured output
   * @private
   * @returns {Object} Logger with debug, info, warn, error methods
   */
  _createDefaultLogger() {
    return {
      debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || ''),
      info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
      warn: (msg, data) => console.log(`[WARN] ${msg}`, data || ''),
      error: (msg, data) => console.log(`[ERROR] ${msg}`, data || '')
    };
  }

  /**
   * Validates topic parameter for all operations
   * @private
   * @param {string} topic - Topic name to validate
   * @throws {Error} If topic is invalid
   */
  _validateTopic(topic) {
    if (!topic || typeof topic !== 'string') {
      throw new Error('Topic must be a non-empty string');
    }
  }

  /**
   * Ensures topic has initialized queues and subscriber arrays
   * @private
   * @param {string} topic - Topic to initialize
   */
  _ensureTopicInitialized(topic) {
    if (!this.eventQueues.has(topic)) {
      this.eventQueues.set(topic, []);
    }
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
  }

  /**
   * Handles queue overflow by dropping oldest events
   * @private
   * @param {string} topic - Topic experiencing overflow
   * @param {Array} queue - The queue array
   */
  _handleQueueOverflow(topic, queue) {
    if (queue.length >= this.maxQueueSize) {
      const droppedEvent = queue.shift(); // Remove oldest event
      this.stats.droppedEvents++;
      
      this.logger.warn('Signal bus queue overflow', {
        topic,
        queue_size: queue.length,
        max_queue_size: this.maxQueueSize,
        dropped_event: droppedEvent,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Creates event object with metadata
   * @private
   * @param {*} eventData - The event data payload
   * @param {string} priority - Event priority level
   * @returns {Object} Event object with metadata
   */
  _createEventObject(eventData, priority) {
    return {
      data: eventData,
      priority,
      timestamp: Date.now(),
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Publishes an event to a topic with bounded queue protection
   * 
   * Events are added to a bounded queue. If the queue exceeds maxQueueSize,
   * the oldest event is dropped to prevent memory exhaustion.
   * 
   * @param {string} topic - Topic name (must be non-empty string)
   * @param {*} event - Event data (cannot be null or undefined)
   * @param {string} priority - Event priority (default: 'normal')
   * @returns {Object} Publication result with topic, eventId, queueSize, subscriberCount
   * @throws {Error} If topic or event parameters are invalid
   */
  publish(topic, event, priority = 'normal') {
    // Input validation
    this._validateTopic(topic);
    if (event === undefined || event === null) {
      throw new Error('Event cannot be null or undefined');
    }

    // Initialize topic storage
    this._ensureTopicInitialized(topic);
    const topicQueue = this.eventQueues.get(topic);

    // Handle queue overflow protection
    this._handleQueueOverflow(topic, topicQueue);

    // Create and store event
    const eventObject = this._createEventObject(event, priority);
    topicQueue.push(eventObject);

    // Update metrics
    this.stats.totalEvents++;

    // Structured logging for debugging
    this.logger.debug('Signal bus event published', {
      topic,
      event_id: eventObject.id,
      priority,
      queue_size: topicQueue.length,
      subscriber_count: this.subscribers.get(topic).length,
      timestamp: new Date().toISOString()
    });

    return {
      topic,
      eventId: eventObject.id,
      queueSize: topicQueue.length,
      subscriberCount: this.subscribers.get(topic).length
    };
  }

  /**
   * Subscribes a callback function to receive events from a topic
   * 
   * Multiple callbacks can subscribe to the same topic. Each callback
   * is isolated - if one crashes, others continue to receive events.
   * 
   * @param {string} topic - Topic name to subscribe to
   * @param {Function} callback - Function to call when events are received
   * @returns {Object} Subscription result with topic and subscriberCount
   * @throws {Error} If topic or callback parameters are invalid
   */
  subscribe(topic, callback) {
    // Input validation
    this._validateTopic(topic);
    if (!callback || typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    // Initialize topic storage
    this._ensureTopicInitialized(topic);

    // Add callback to subscribers
    const topicSubscribers = this.subscribers.get(topic);
    topicSubscribers.push(callback);

    // Log subscription for debugging
    this.logger.debug('Signal bus subscription added', {
      topic,
      subscriber_count: topicSubscribers.length,
      timestamp: new Date().toISOString()
    });

    return {
      topic,
      subscriberCount: topicSubscribers.length
    };
  }

  /**
   * Starts timer-based event processing
   * 
   * Creates an interval timer that processes events from all topic queues.
   * Events are delivered to subscribers with crash isolation.
   * 
   * @returns {Object} Start result with started flag and processingIntervalMs
   */
  start() {
    // Prevent duplicate start
    if (this.isProcessing) {
      this.logger.warn('Signal bus already processing', {
        timestamp: new Date().toISOString()
      });
      return {
        started: false,
        reason: 'already_processing'
      };
    }

    // Update state
    this.isProcessing = true;
    
    // Log lifecycle event
    this.logger.info('Signal bus starting event processing', {
      processing_interval_ms: this.processingIntervalMs,
      timestamp: new Date().toISOString()
    });

    // Start processing timer
    this.processingTimer = setInterval(() => {
      this._processAllTopics();
    }, this.processingIntervalMs);

    return {
      started: true,
      processingIntervalMs: this.processingIntervalMs
    };
  }

  /**
   * Processes events from all topics with queued events
   * @private
   */
  _processAllTopics() {
    try {
      // Process each topic that has queued events
      for (const [topicName, queue] of this.eventQueues.entries()) {
        if (queue.length > 0) {
          this._processSingleTopic(topicName);
        }
      }
    } catch (error) {
      this.logger.error('Error in processAllTopics', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Processes events for a specific topic with subscriber isolation
   * 
   * Delivers events to all subscribers for the topic. If one subscriber
   * throws an error, it's logged but other subscribers continue to receive the event.
   * 
   * @param {string} topic - Specific topic to process (optional - processes all if not provided)
   */
  processTopicEvents(topic) {
    // If no topic specified, process all topics
    if (!topic) {
      this._processAllTopics();
      return;
    }

    this._processSingleTopic(topic);
  }

  /**
   * Processes events for a single specific topic
   * @private
   * @param {string} topicName - Name of topic to process
   */
  _processSingleTopic(topicName) {
    const queue = this.eventQueues.get(topicName);
    const subscribers = this.subscribers.get(topicName);

    // Skip if no infrastructure or events
    if (!queue || !subscribers || subscribers.length === 0 || queue.length === 0) {
      return;
    }

    // Process one event at a time to maintain ordering
    const eventObject = queue.shift();
    const deliveryResult = this._deliverEventToSubscribers(eventObject, subscribers, topicName);

    // Update delivery statistics
    this.stats.totalDeliveries += deliveryResult.deliveredCount;

    // Log successful delivery
    if (deliveryResult.deliveredCount > 0) {
      this.logger.debug('Event delivered to subscribers', {
        topic: topicName,
        event_id: eventObject.id,
        delivered_count: deliveryResult.deliveredCount,
        error_count: deliveryResult.errorCount,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Delivers an event to all subscribers with crash isolation
   * @private
   * @param {Object} eventObject - Event to deliver
   * @param {Array} subscribers - Array of subscriber callbacks
   * @param {string} topicName - Topic name for error logging
   * @returns {Object} Delivery result with counts
   */
  _deliverEventToSubscribers(eventObject, subscribers, topicName) {
    let deliveredCount = 0;
    let errorCount = 0;

    // Deliver to all subscribers with isolation
    for (const subscriber of subscribers) {
      try {
        subscriber(eventObject.data);
        deliveredCount++;
      } catch (error) {
        errorCount++;
        this.stats.subscriberErrors++;
        
        // Log subscriber error but continue processing other subscribers
        this.logger.error('Subscriber error (isolated)', {
          topic: topicName,
          event_id: eventObject.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return { deliveredCount, errorCount };
  }

  /**
   * Stops event processing and cleans up resources
   * 
   * Clears the processing timer and resets state flags. Safe to call
   * multiple times - subsequent calls will return appropriate status.
   * 
   * @returns {Object} Stop result with stopped flag and optional reason
   */
  stop() {
    // Check if currently processing
    if (!this.isProcessing) {
      this.logger.warn('Signal bus not currently processing', {
        timestamp: new Date().toISOString()
      });
      return {
        stopped: false,
        reason: 'not_processing'
      };
    }

    // Clean up timer resource
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    // Reset processing state
    this.isProcessing = false;

    // Log lifecycle event
    this.logger.info('Signal bus stopped event processing', {
      timestamp: new Date().toISOString()
    });

    return {
      stopped: true
    };
  }

  /**
   * Removes a subscriber from a topic (NOT IMPLEMENTED - MVP exclusion)
   * 
   * @param {string} topic - Topic to unsubscribe from
   * @param {Function} callback - Callback function to remove
   * @throws {Error} Always - not implemented for MVP
   */
  unsubscribe(topic, callback) {
    throw new Error('unsubscribe() not implemented - use PM2 process management for resource cleanup');
  }

  /**
   * Gets current system statistics and state
   * 
   * @returns {Object} Statistics including metrics, queue sizes, and subscriber counts
   */
  getStats() {
    return {
      ...this.stats,
      isProcessing: this.isProcessing,
      processingIntervalMs: this.processingIntervalMs,
      queueSizes: Array.from(this.eventQueues.entries()).map(([topic, queue]) => ({
        topic,
        size: queue.length
      })),
      subscriberCounts: Array.from(this.subscribers.entries()).map(([topic, subs]) => ({
        topic,
        count: subs.length
      }))
    };
  }
}

export { SignalBus };