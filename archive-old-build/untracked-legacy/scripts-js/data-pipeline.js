// src/scripts-js/data-pipeline.js
import { EventEmitter } from 'events';

/**
 * Data Pipeline - Renaissance-Grade Data Processing
 * Transforms raw RPC data into standardized formats for signal modules
 */
class DataPipeline extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Pipeline configuration
    this.config = {
      maxConcurrentProcessing: config.maxConcurrentProcessing || 10,
      dataValidationEnabled: config.dataValidationEnabled !== false,
      enrichmentEnabled: config.enrichmentEnabled !== false,
      cacheEnabled: config.cacheEnabled !== false,
      batchSize: config.batchSize || 50,
      processingTimeoutMs: config.processingTimeoutMs || 3000,
      retryAttempts: config.retryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 1000
    };
    
    // Pipeline stages
    this.stages = {
      ingestion: null,
      normalization: null,
      validation: null,
      enrichment: null,
      caching: null,
      distribution: null
    };
    
    // Performance tracking
    this.metrics = {
      tokensProcessed: 0,
      averageProcessingTime: 0,
      successRate: 0,
      errorCount: 0,
      throughput: 0,
      lastProcessedBatch: null,
      cacheHitRate: 0
    };
    
    // Pipeline state
    this.isRunning = false;
    this.processingQueue = [];
    this.activeProcessing = new Map();
    this.subscribers = new Map(); // Signal modules subscribed to data
    
    // Error handling
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 10;
    
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, ...args) => console.log(`[DataPipeline] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[DataPipeline] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[DataPipeline] ${msg}`, ...args),
      debug: (msg, ...args) => console.debug(`[DataPipeline] ${msg}`, ...args)
    };
  }

  /**
   * Initialize the data pipeline with all stages
   */
  async initialize() {
    this.logger.info('🚀 Initializing Data Pipeline...');
    
    try {
      // Initialize pipeline stages
      await this.initializePipelineStages();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Start background processing
      this.startBackgroundProcessing();
      
      this.isRunning = true;
      this.logger.info('✅ Data Pipeline initialized successfully');
      
      this.emit('initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize Data Pipeline:', error);
      throw error;
    }
  }

  /**
   * Initialize all pipeline stages
   */
  async initializePipelineStages() {
    // Initialize Data Ingestion
    const { default: DataIngestionService } = await import('./data-ingestion.service.js');
    this.stages.ingestion = new DataIngestionService();
    
    // Initialize Data Normalizer
    const { default: DataNormalizer } = await import('./data-normalizer.js');
    this.stages.normalization = new DataNormalizer();
    
    // Initialize Data Validator
    const { default: DataValidator } = await import('./data-validator.js');
    this.stages.validation = new DataValidator();
    
    // Initialize Data Enricher
    const { default: DataEnricher } = await import('./data-enricher.js');
    this.stages.enrichment = new DataEnricher();
    
    // Initialize Data Cache
    const { default: DataCache } = await import('./data-cache.js');
    this.stages.caching = new DataCache();
    
    // Initialize Data Distributor
    const { default: DataDistributor } = await import('./data-distributor.js');
    this.stages.distribution = new DataDistributor();
    
    this.logger.info('📦 All pipeline stages initialized');
  }

  /**
   * Setup event handlers for pipeline stages
   */
  setupEventHandlers() {
    // Handle ingestion events
    this.stages.ingestion.on('data', (rawData) => {
      this.processingQueue.push({
        id: this.generateId(),
        rawData,
        timestamp: new Date(),
        stage: 'ingestion'
      });
    });
    
    // Handle errors from any stage
    Object.values(this.stages).forEach(stage => {
      if (stage) {
        stage.on('error', (error) => {
          this.handleStageError(error);
        });
      }
    });
  }

  /**
   * Start background processing of the pipeline
   */
  startBackgroundProcessing() {
    // Process queue every 100ms
    setInterval(() => {
      if (this.processingQueue.length > 0) {
        this.processNextBatch();
      }
    }, 100);
    
    // Update metrics every 5 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 5000);
    
    this.logger.info('🔄 Background processing started');
  }

  /**
   * Process the next batch of data
   */
  async processNextBatch() {
    if (!this.isRunning || this.activeProcessing.size >= this.config.maxConcurrentProcessing) {
      return;
    }
    
    const batchSize = Math.min(this.config.batchSize, this.processingQueue.length);
    const batch = this.processingQueue.splice(0, batchSize);
    
    if (batch.length === 0) return;
    
    const batchId = this.generateId();
    const startTime = Date.now();
    
    this.activeProcessing.set(batchId, {
      batch,
      startTime,
      stage: 'processing'
    });
    
    try {
      // Process batch through all pipeline stages
      const processedData = await this.processBatchThroughPipeline(batch);
      
      // Distribute to subscribers
      await this.distributeBatchToSubscribers(processedData);
      
      // Update success metrics
      this.updateBatchMetrics(batchId, startTime, true, processedData.length);
      
    } catch (error) {
      this.logger.error('Batch processing failed:', error);
      this.updateBatchMetrics(batchId, startTime, false, 0);
      this.handleProcessingError(error, batch);
      
    } finally {
      this.activeProcessing.delete(batchId);
    }
  }

  /**
   * Process batch through all pipeline stages
   */
  async processBatchThroughPipeline(batch) {
    const processedData = [];
    
    for (const item of batch) {
      try {
        let data = item.rawData;
        
        // Stage 1: Normalization
        data = await this.stages.normalization.normalize(data);
        
        // Stage 2: Validation (if enabled)
        if (this.config.dataValidationEnabled) {
          const isValid = await this.stages.validation.validate(data);
          if (!isValid) {
            this.logger.warn('Data validation failed, skipping item:', data.tokenAddress);
            continue;
          }
        }
        
        // Stage 3: Enrichment (if enabled)
        if (this.config.enrichmentEnabled) {
          data = await this.stages.enrichment.enrich(data);
        }
        
        // Stage 4: Caching (if enabled)
        if (this.config.cacheEnabled) {
          await this.stages.caching.store(data);
        }
        
        // Add processing metadata
        data.processingMetadata = {
          processedAt: new Date(),
          processingTime: Date.now() - item.timestamp.getTime(),
          pipelineVersion: '1.0.0'
        };
        
        processedData.push(data);
        
      } catch (error) {
        this.logger.error('Failed to process item:', error);
        this.consecutiveErrors++;
        
        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
          throw new Error('Too many consecutive processing errors');
        }
      }
    }
    
    // Reset consecutive errors on successful processing
    if (processedData.length > 0) {
      this.consecutiveErrors = 0;
    }
    
    return processedData;
  }

  /**
   * Distribute processed data to subscribers
   */
  async distributeBatchToSubscribers(processedData) {
    if (processedData.length === 0) return;
    
    // Group data by type for efficient distribution
    const groupedData = this.groupDataByType(processedData);
    
    // Distribute to each subscriber
    for (const [subscriberId, subscriber] of this.subscribers) {
      try {
        await subscriber.receiveData(groupedData);
      } catch (error) {
        this.logger.error(`Failed to distribute data to subscriber ${subscriberId}:`, error);
      }
    }
    
    // Emit data event
    this.emit('dataProcessed', processedData);
  }

  /**
   * Group data by type for efficient distribution
   */
  groupDataByType(processedData) {
    const grouped = {
      tokens: [],
      market: [],
      liquidity: [],
      transactions: []
    };
    
    processedData.forEach(data => {
      if (data.type === 'token') {
        grouped.tokens.push(data);
      } else if (data.type === 'market') {
        grouped.market.push(data);
      } else if (data.type === 'liquidity') {
        grouped.liquidity.push(data);
      } else if (data.type === 'transaction') {
        grouped.transactions.push(data);
      }
    });
    
    return grouped;
  }

  /**
   * Subscribe to processed data (for Signal Orchestrator)
   */
  subscribe(subscriberId, callback) {
    this.subscribers.set(subscriberId, {
      receiveData: callback,
      subscribedAt: new Date()
    });
    
    this.logger.info(`📡 Subscriber ${subscriberId} registered`);
  }

  /**
   * Unsubscribe from processed data
   */
  unsubscribe(subscriberId) {
    if (this.subscribers.delete(subscriberId)) {
      this.logger.info(`📡 Subscriber ${subscriberId} unregistered`);
    }
  }

  /**
   * Process single token data (for real-time requests)
   */
  async processTokenData(tokenAddress, options = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cachedData = await this.stages.caching.get(tokenAddress);
        if (cachedData && !options.skipCache) {
          this.logger.debug(`Cache hit for token: ${tokenAddress}`);
          return cachedData;
        }
      }
      
      // Fetch raw data
      const rawData = await this.stages.ingestion.fetchTokenData(tokenAddress);
      
      // Process through pipeline
      let processedData = await this.stages.normalization.normalize(rawData);
      
      if (this.config.dataValidationEnabled) {
        const isValid = await this.stages.validation.validate(processedData);
        if (!isValid) {
          throw new Error('Data validation failed');
        }
      }
      
      if (this.config.enrichmentEnabled) {
        processedData = await this.stages.enrichment.enrich(processedData);
      }
      
      if (this.config.cacheEnabled) {
        await this.stages.caching.store(processedData);
      }
      
      // Add processing metadata
      processedData.processingMetadata = {
        processedAt: new Date(),
        processingTime: Date.now() - startTime,
        requestType: 'realtime',
        pipelineVersion: '1.0.0'
      };
      
      this.logger.debug(`Token processed in ${Date.now() - startTime}ms: ${tokenAddress}`);
      return processedData;
      
    } catch (error) {
      this.logger.error(`Failed to process token ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get pipeline metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.processingQueue.length,
      activeProcessing: this.activeProcessing.size,
      subscriberCount: this.subscribers.size,
      isRunning: this.isRunning,
      stageMetrics: this.getStageMetrics()
    };
  }

  /**
   * Get metrics from all pipeline stages
   */
  getStageMetrics() {
    const stageMetrics = {};
    
    Object.entries(this.stages).forEach(([name, stage]) => {
      if (stage && typeof stage.getMetrics === 'function') {
        stageMetrics[name] = stage.getMetrics();
      }
    });
    
    return stageMetrics;
  }

  /**
   * Update batch processing metrics
   */
  updateBatchMetrics(batchId, startTime, success, itemCount) {
    const processingTime = Date.now() - startTime;
    
    this.metrics.tokensProcessed += itemCount;
    this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime + processingTime) / 2;
    
    if (!success) {
      this.metrics.errorCount++;
    }
    
    this.metrics.successRate = ((this.metrics.tokensProcessed - this.metrics.errorCount) / 
                               this.metrics.tokensProcessed) * 100;
    
    this.metrics.lastProcessedBatch = new Date();
  }

  /**
   * Update overall pipeline metrics
   */
  updateMetrics() {
    const now = Date.now();
    const timeSinceLastUpdate = now - (this.lastMetricsUpdate || now);
    
    if (timeSinceLastUpdate > 0) {
      this.metrics.throughput = (this.metrics.tokensProcessed / timeSinceLastUpdate) * 1000; // per second
    }
    
    this.lastMetricsUpdate = now;
  }

  /**
   * Handle stage errors
   */
  handleStageError(error) {
    this.logger.error('Pipeline stage error:', error);
    this.emit('stageError', error);
  }

  /**
   * Handle processing errors
   */
  handleProcessingError(error, batch) {
    this.logger.error('Processing error:', error);
    
    // Implement retry logic here if needed
    // For now, just emit the error
    this.emit('processingError', { error, batch });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Stop the pipeline
   */
  async stop() {
    this.isRunning = false;
    
    // Wait for active processing to complete
    while (this.activeProcessing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.logger.info('🛑 Data Pipeline stopped');
    this.emit('stopped');
  }

  /**
   * Get pipeline health status
   */
  getHealthStatus() {
    const queueBacklog = this.processingQueue.length;
    const errorRate = (this.metrics.errorCount / this.metrics.tokensProcessed) * 100;
    
    let status = 'HEALTHY';
    if (queueBacklog > 1000 || errorRate > 10) {
      status = 'DEGRADED';
    }
    if (queueBacklog > 5000 || errorRate > 25 || this.consecutiveErrors > 5) {
      status = 'CRITICAL';
    }
    
    return {
      status,
      queueBacklog,
      errorRate,
      consecutiveErrors: this.consecutiveErrors,
      isRunning: this.isRunning,
      lastUpdate: new Date()
    };
  }
}

export default DataPipeline;