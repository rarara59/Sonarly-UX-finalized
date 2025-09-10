/**
 * Concurrent Event Replayer with In-Flight Task Management
 * Prevents timer storms while maintaining high concurrency
 */

export class ConcurrentEventReplayer {
  constructor(maxInFlight = 2000) {
    this.maxInFlight = maxInFlight;
    this.activeTimers = 0;
    this.eventQueue = [];
    this.processedEvents = [];
    this.completionPromise = null;
    this.completionResolver = null;
    this.eventProcessor = null;
    this.stats = {
      totalEvents: 0,
      processedCount: 0,
      failedCount: 0,
      queuedCount: 0,
      startTime: null,
      endTime: null
    };
  }
  
  /**
   * Set the event processor function
   */
  setEventProcessor(processorFn) {
    this.eventProcessor = processorFn;
  }
  
  /**
   * Replay events with controlled concurrency
   */
  async replayEvents(events, speedMultiplier = 1.0) {
    if (!this.eventProcessor) {
      throw new Error('Event processor not set. Call setEventProcessor() first.');
    }
    
    // Reset state
    this.reset();
    this.stats.totalEvents = events.length;
    this.stats.startTime = Date.now();
    
    // Create completion promise
    this.completionPromise = new Promise(resolve => {
      this.completionResolver = resolve;
    });
    
    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const baseTime = new Date(sortedEvents[0].timestamp);
    console.log(`Starting replay of ${events.length} events at ${speedMultiplier}x speed`);
    console.log(`Base time: ${baseTime.toISOString()}`);
    console.log(`Max in-flight tasks: ${this.maxInFlight}`);
    
    // Schedule all events
    sortedEvents.forEach((event, index) => {
      const eventTime = new Date(event.timestamp);
      const originalDelay = eventTime - baseTime;
      const replayDelay = originalDelay / speedMultiplier;
      
      this.scheduleEventWithBackoff(event, replayDelay, index);
    });
    
    // Wait for all events to complete
    await this.completionPromise;
    
    this.stats.endTime = Date.now();
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    
    console.log(`\nReplay completed in ${duration.toFixed(2)}s`);
    console.log(`Processed: ${this.stats.processedCount}/${this.stats.totalEvents}`);
    console.log(`Failed: ${this.stats.failedCount}`);
    
    return this.processedEvents;
  }
  
  /**
   * Schedule event with backoff when at capacity
   */
  scheduleEventWithBackoff(event, delay, index) {
    if (this.activeTimers >= this.maxInFlight) {
      this.eventQueue.push({ event, delay, index });
      this.stats.queuedCount++;
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const result = await this.processEvent(event, index);
        this.processedEvents.push(result);
        this.stats.processedCount++;
        
        if (result.success === false) {
          this.stats.failedCount++;
        }
        
        // Progress update every 10 events
        if (this.stats.processedCount % 10 === 0) {
          const progress = (this.stats.processedCount / this.stats.totalEvents * 100).toFixed(1);
          console.log(`Progress: ${this.stats.processedCount}/${this.stats.totalEvents} (${progress}%)`);
        }
        
      } catch (error) {
        console.error(`Error processing event ${index}:`, error.message);
        this.processedEvents.push({
          eventId: event.eventId || `event_${index}`,
          success: false,
          error: error.message,
          processingTimeMs: 0
        });
        this.stats.failedCount++;
        
      } finally {
        this.activeTimers--;
        this.processQueuedEvents();
        
        // Check if all events are complete
        if (this.stats.processedCount === this.stats.totalEvents && 
            this.activeTimers === 0 && 
            this.completionResolver) {
          this.completionResolver();
        }
      }
    }, Math.max(0, delay));
    
    this.activeTimers++;
  }
  
  /**
   * Process queued events when capacity becomes available
   */
  processQueuedEvents() {
    while (this.eventQueue.length > 0 && this.activeTimers < this.maxInFlight) {
      const { event, delay, index } = this.eventQueue.shift();
      this.stats.queuedCount--;
      
      // Schedule immediately (original delay has likely passed)
      this.scheduleEventWithBackoff(event, 0, index);
    }
  }
  
  /**
   * Process a single event
   */
  async processEvent(event, index) {
    const startTime = Date.now();
    
    try {
      // Call the configured event processor
      const result = await this.eventProcessor(event);
      
      const processingTimeMs = Date.now() - startTime;
      
      return {
        eventId: event.eventId || `event_${index}`,
        success: true,
        processingTimeMs,
        ...result
      };
      
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      
      return {
        eventId: event.eventId || `event_${index}`,
        success: false,
        error: error.message,
        processingTimeMs
      };
    }
  }
  
  /**
   * Wait for all events to complete
   */
  async waitForCompletion() {
    if (this.completionPromise) {
      await this.completionPromise;
    }
  }
  
  /**
   * Reset replayer state
   */
  reset() {
    this.activeTimers = 0;
    this.eventQueue = [];
    this.processedEvents = [];
    this.completionPromise = null;
    this.completionResolver = null;
    this.stats = {
      totalEvents: 0,
      processedCount: 0,
      failedCount: 0,
      queuedCount: 0,
      startTime: null,
      endTime: null
    };
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeTimers: this.activeTimers,
      queueLength: this.eventQueue.length
    };
  }
}

export default ConcurrentEventReplayer;