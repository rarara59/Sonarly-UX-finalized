// src/services/thorp-orchestrator.service.ts
import winston from 'winston';
import { EventEmitter } from 'events';
import cron from 'node-cron';

// Import all core services
import { BatchTokenProcessor } from './batch-token-processor.service';
import { ModularEdgeCalculator } from './modular-edge-calculator.service';
import { AlertSystemService } from './alert-system.service';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { PricePollingService } from './price-polling.service';

// Import discovery and filtering services
import { LiquidityPoolCreationDetector } from './liquidity-pool-creation-detector.service';
import { LPEventCache } from './lp-event-cache.service';
import { TieredTokenFilter } from './tiered-token-filter.service';
import SmartMoneyValidator from './smart-money-validator.service';

// Types
interface OrchestrationConfig {
  // Pipeline Settings
  discoveryIntervalMs: number;
  processingBatchSize: number;
  maxConcurrentProcessing: number;
  
  // Thresholds
  edgeScoreThreshold: number;
  confidenceThreshold: number;
  
  // Health Monitoring
  healthCheckIntervalMs: number;
  maxConsecutiveFailures: number;
  
  // Performance Settings
  enableBackgroundTasks: boolean;
  metricsSyncIntervalMs: number;
  
  // Recovery Settings
  autoRecovery: boolean;
  recoveryDelayMs: number;
}

interface PipelinePhase {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'recovering';
  lastRun?: Date;
  lastSuccess?: Date;
  consecutiveFailures: number;
  averageDuration: number;
  totalRuns: number;
  successRate: number;
}

interface OrchestrationMetrics {
  // Pipeline Performance
  totalTokensProcessed: number;
  alertsGenerated: number;
  successfulTrades: number;
  
  // Timing Metrics
  avgDiscoveryTime: number;
  avgProcessingTime: number;
  avgAlertTime: number;
  
  // Health Status
  systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  activePhases: number;
  failedPhases: number;
  
  // Resource Usage
  memoryUsage: number;
  cpuUsage: number;
  apiCallsPerMinute: number;
  
  lastUpdated: Date;
}

interface TokenCandidate {
  tokenAddress: string;
  tokenSymbol?: string;
  detectionSource: 'LP_EVENT' | 'SMART_MONEY' | 'VOLUME_SURGE' | 'SOCIAL_SIGNAL';
  priority: 'high' | 'normal' | 'low';
  discoveredAt: Date;
  metadata: {
    lpValueUSD?: number;
    marketCap?: number;
    volume24h?: number;
    holderCount?: number;
    [key: string]: any;
  };
}

export class ThorpOrchestratorService extends EventEmitter {
  private logger: winston.Logger;
  private config: OrchestrationConfig;
  
  // Core Services
  private batchProcessor: BatchTokenProcessor;
  private edgeCalculator: ModularEdgeCalculator;
  private alertSystem: AlertSystemService;
  private performanceMonitoring: PerformanceMonitoringService;
  private pricePolling: PricePollingService;
  
  // Discovery Services
  private lpDetector: LiquidityPoolCreationDetector;
  private lpEventCache: LPEventCache;
  private tokenFilter: TieredTokenFilter;
  private smartMoneyValidator: SmartMoneyValidator;
  
  // State Management
  private phases: Map<string, PipelinePhase> = new Map();
  private metrics: OrchestrationMetrics;
  private isRunning: boolean = false;
  private scheduledTasks: Map<string, any> = new Map();
  
  // Token Processing Queue
  private discoveryQueue: TokenCandidate[] = [];
  private processingQueue: TokenCandidate[] = [];
  private alertQueue: any[] = [];

  constructor(
    services: {
      batchProcessor: BatchTokenProcessor;
      edgeCalculator: ModularEdgeCalculator;
      alertSystem: AlertSystemService;
      performanceMonitoring: PerformanceMonitoringService;
      pricePolling: PricePollingService;
      lpDetector: LiquidityPoolCreationDetector;
      lpEventCache: LPEventCache;
      tokenFilter: TieredTokenFilter;
      smartMoneyValidator: SmartMoneyValidator;
    },
    config?: Partial<OrchestrationConfig>
  ) {
    super();
    
    // Initialize services
    this.batchProcessor = services.batchProcessor;
    this.edgeCalculator = services.edgeCalculator;
    this.alertSystem = services.alertSystem;
    this.performanceMonitoring = services.performanceMonitoring;
    this.pricePolling = services.pricePolling;
    this.lpDetector = services.lpDetector;
    this.lpEventCache = services.lpEventCache;
    this.tokenFilter = services.tokenFilter;
    this.smartMoneyValidator = services.smartMoneyValidator;
    
    // Initialize configuration
    this.config = this.mergeConfig(config);
    this.logger = this.initializeLogger();
    this.metrics = this.initializeMetrics();
    
    // Setup pipeline phases
    this.initializePipelinePhases();
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  private mergeConfig(userConfig?: Partial<OrchestrationConfig>): OrchestrationConfig {
    const defaultConfig: OrchestrationConfig = {
      discoveryIntervalMs: 120000, // 2 minutes
      processingBatchSize: 3,
      maxConcurrentProcessing: 5,
      
      edgeScoreThreshold: 85,
      confidenceThreshold: 75,
      
      healthCheckIntervalMs: 300000, // 5 minutes
      maxConsecutiveFailures: 3,
      
      enableBackgroundTasks: true,
      metricsSyncIntervalMs: 60000, // 1 minute
      
      autoRecovery: true,
      recoveryDelayMs: 30000 // 30 seconds
    };

    return { ...defaultConfig, ...userConfig };
  }

  private initializeLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'thorp-orchestrator' },
      transports: [
        new winston.transports.File({ filename: 'orchestrator.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  private initializeMetrics(): OrchestrationMetrics {
    return {
      totalTokensProcessed: 0,
      alertsGenerated: 0,
      successfulTrades: 0,
      
      avgDiscoveryTime: 0,
      avgProcessingTime: 0,
      avgAlertTime: 0,
      
      systemHealth: 'HEALTHY',
      activePhases: 0,
      failedPhases: 0,
      
      memoryUsage: 0,
      cpuUsage: 0,
      apiCallsPerMinute: 0,
      
      lastUpdated: new Date()
    };
  }

  private initializePipelinePhases(): void {
    const phaseNames = [
      'discovery',
      'preValidation', 
      'smartMoneyAnalysis',
      'edgeCalculation',
      'alertGeneration',
      'performanceTracking'
    ];

    phaseNames.forEach(name => {
      this.phases.set(name, {
        name,
        status: 'idle',
        consecutiveFailures: 0,
        averageDuration: 0,
        totalRuns: 0,
        successRate: 100
      });
    });
  }

  // === MAIN ORCHESTRATION METHODS ===

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Orchestrator already running');
      return;
    }

    try {
      this.logger.info('🚀 Starting Thorp Orchestrator...');
      
      // Initialize all services
      await this.initializeServices();
      
      // Start background tasks
      this.startBackgroundTasks();
      
      // Start main orchestration loop
      this.startOrchestrationLoop();
      
      this.isRunning = true;
      this.logger.info('✅ Thorp Orchestrator started successfully');
      
      this.emit('started');
    } catch (error) {
      this.logger.error('Failed to start orchestrator:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.logger.info('🛑 Stopping Thorp Orchestrator...');
    
    // Stop scheduled tasks
    this.scheduledTasks.forEach((task, name) => {
      if (task && task.destroy) {
        task.destroy();
      }
    });
    this.scheduledTasks.clear();
    
    // Update status
    this.phases.forEach(phase => {
      phase.status = 'idle';
    });
    
    this.isRunning = false;
    this.logger.info('✅ Thorp Orchestrator stopped');
    
    this.emit('stopped');
  }

  // === PHASE 1: DISCOVERY ===
  private async executeDiscoveryPhase(): Promise<TokenCandidate[]> {
    const phase = this.phases.get('discovery')!;
    const startTime = Date.now();
    
    try {
      this.updatePhaseStatus('discovery', 'running');
      
      // Get LP events from cache
      const lpEvents = await LPEventCache.getAll();
      
      // Convert to candidates
      const candidates: TokenCandidate[] = lpEvents.map((event: any) => ({
        tokenAddress: event.tokenAddress,
        tokenSymbol: event.tokenSymbol,
        detectionSource: 'LP_EVENT',
        priority: 'normal',
        discoveredAt: new Date(),
        metadata: {
          lpValueUSD: event.lpValueUSD,
          marketCap: event.marketCap,
          volume24h: event.volume24h
        }
      }));

      // Add to discovery queue
      this.discoveryQueue.push(...candidates);
      
      this.updatePhaseStatus('discovery', 'completed');
      this.updatePhaseMetrics('discovery', Date.now() - startTime, true);
      
      this.logger.info(`📡 Discovery completed: ${candidates.length} candidates found`);
      return candidates;
      
    } catch (error) {
      this.updatePhaseStatus('discovery', 'failed');
      this.updatePhaseMetrics('discovery', Date.now() - startTime, false);
      this.logger.error('Discovery phase failed:', error);
      
      if (this.config.autoRecovery) {
        await this.recoverPhase('discovery');
      }
      
      return [];
    }
  }

  // === PHASE 2: PRE-VALIDATION ===
  private async executePreValidationPhase(candidates: TokenCandidate[]): Promise<TokenCandidate[]> {
    const phase = this.phases.get('preValidation')!;
    const startTime = Date.now();
    
    try {
      this.updatePhaseStatus('preValidation', 'running');
      
      // Apply tiered filtering
      const filtered = await this.tokenFilter.filter(
        candidates.map(c => c.tokenAddress)
      );
      
      // Validate with smart money
      const validated = await SmartMoneyValidator.validateTokens(filtered);
      
      // Update candidates with validation results
      const validCandidates = candidates.filter(c => 
        validated.includes(c.tokenAddress)
      );
      
      this.updatePhaseStatus('preValidation', 'completed');
      this.updatePhaseMetrics('preValidation', Date.now() - startTime, true);
      
      this.logger.info(`🔍 Pre-validation completed: ${validCandidates.length}/${candidates.length} passed`);
      return validCandidates;
      
    } catch (error) {
      this.updatePhaseStatus('preValidation', 'failed');
      this.updatePhaseMetrics('preValidation', Date.now() - startTime, false);
      this.logger.error('Pre-validation phase failed:', error);
      return [];
    }
  }

  // === PHASE 3: SMART MONEY ANALYSIS ===
  private async executeSmartMoneyAnalysis(candidates: TokenCandidate[]): Promise<TokenCandidate[]> {
    const phase = this.phases.get('smartMoneyAnalysis')!;
    const startTime = Date.now();
    
    try {
      this.updatePhaseStatus('smartMoneyAnalysis', 'running');
      
      // Enhance candidates with smart money data
      const enhancedCandidates = await Promise.all(
        candidates.map(async (candidate) => {
          const smartMoneyData = await SmartMoneyValidator.getDetailedAnalysis(
            candidate.tokenAddress
          );
          
          return {
            ...candidate,
            metadata: {
              ...candidate.metadata,
              smartMoneyMetrics: smartMoneyData
            }
          };
        })
      );
      
      this.updatePhaseStatus('smartMoneyAnalysis', 'completed');
      this.updatePhaseMetrics('smartMoneyAnalysis', Date.now() - startTime, true);
      
      this.logger.info(`🧠 Smart money analysis completed for ${enhancedCandidates.length} tokens`);
      return enhancedCandidates;
      
    } catch (error) {
      this.updatePhaseStatus('smartMoneyAnalysis', 'failed');
      this.updatePhaseMetrics('smartMoneyAnalysis', Date.now() - startTime, false);
      this.logger.error('Smart money analysis failed:', error);
      return candidates; // Return original if analysis fails
    }
  }

  // === PHASE 4: EDGE CALCULATION ===
  private async executeEdgeCalculation(candidates: TokenCandidate[]): Promise<any[]> {
    const phase = this.phases.get('edgeCalculation')!;
    const startTime = Date.now();
    
    try {
      this.updatePhaseStatus('edgeCalculation', 'running');
      
      // Process candidates through batch processor
      const processedTokens = await this.batchProcessor.processTokensNow(
        candidates.map(c => ({
          tokenAddress: c.tokenAddress,
          currentPrice: 0,
          tokenAgeMinutes: 0,
          
          priority: c.priority,
          
        }))
      );
      
      // Calculate edge scores
      const scoredTokens = await Promise.all(
        processedTokens.map(async (token) => {
          const edgeScore = await this.edgeCalculator.evaluateToken(
            token.tokenAddress,
            0, // currentPrice
            {
            tokenAddress: token.tokenAddress,
            tokenSymbol: token.result?.symbol || "UNKNOWN",
            ...token.result?.metadata || {}
          });
          
          return {
            ...token,
            edgeScore: edgeScore.overallScore,
            signalScores: edgeScore.signalScores,
            confidence: edgeScore.confidence
          };
        })
      );
      
      this.updatePhaseStatus('edgeCalculation', 'completed');
      this.updatePhaseMetrics('edgeCalculation', Date.now() - startTime, true);
      
      this.logger.info(`⚡ Edge calculation completed for ${scoredTokens.length} tokens`);
      return scoredTokens;
      
    } catch (error) {
      this.updatePhaseStatus('edgeCalculation', 'failed');
      this.updatePhaseMetrics('edgeCalculation', Date.now() - startTime, false);
      this.logger.error('Edge calculation failed:', error);
      return [];
    }
  }

  // === PHASE 5: ALERT GENERATION ===
  private async executeAlertGeneration(scoredTokens: any[]): Promise<void> {
    const phase = this.phases.get('alertGeneration')!;
    const startTime = Date.now();
    
    try {
      this.updatePhaseStatus('alertGeneration', 'running');
      
      let alertsGenerated = 0;
      
      for (const token of scoredTokens) {
        if (token.edgeScore >= this.config.edgeScoreThreshold) {
          const alertSent = await this.alertSystem.processTokenAlert({
            tokenAddress: token.tokenAddress,
            smartMoneyData: {
              tier1Wallets: 0,
              tier2Wallets: 0,
              tier3Wallets: 0,
              totalSmartWallets: 0,
              avgWalletTier: 3.0,
              recentActivity: false,
              walletAnalysisComplete: true
            },
            tokenSymbol: token.result?.symbol || "UNKNOWN",
            edgeScore: token.edgeScore,
            signalScores: token.signalScores,
            currentPrice: token.result?.metadata || 0,
            marketCap: token.result?.metadata || null,
            lpValueUSD: token.result?.metadata || 0,
            quoteToken: token.result?.metadata || 'SOL',
            marketContext: {
              solPrice: token.result?.metadata || 0,
              volume24h: token.result?.metadata || 0
            }
          });
          
          if (alertSent) {
            alertsGenerated++;
            this.metrics.alertsGenerated++;
          }
        }
      }
      
      this.updatePhaseStatus('alertGeneration', 'completed');
      this.updatePhaseMetrics('alertGeneration', Date.now() - startTime, true);
      
      this.logger.info(`🚨 Alert generation completed: ${alertsGenerated} alerts sent`);
      
    } catch (error) {
      this.updatePhaseStatus('alertGeneration', 'failed');
      this.updatePhaseMetrics('alertGeneration', Date.now() - startTime, false);
      this.logger.error('Alert generation failed:', error);
    }
  }

  // === PHASE 6: PERFORMANCE TRACKING ===
  private async executePerformanceTracking(): Promise<void> {
    const phase = this.phases.get('performanceTracking')!;
    const startTime = Date.now();
    
    try {
      this.updatePhaseStatus('performanceTracking', 'running');
      
      // Update metrics from performance monitoring
      const dashboardData = await this.performanceMonitoring.getLiveMetricsDashboard();
      
      this.metrics.successfulTrades = dashboardData.todayStats.winners;
      this.metrics.totalTokensProcessed = dashboardData.todayStats.trades;
      
      this.updatePhaseStatus('performanceTracking', 'completed');
      this.updatePhaseMetrics('performanceTracking', Date.now() - startTime, true);
      
      this.logger.debug('📊 Performance tracking updated');
      
    } catch (error) {
      this.updatePhaseStatus('performanceTracking', 'failed');
      this.updatePhaseMetrics('performanceTracking', Date.now() - startTime, false);
      this.logger.error('Performance tracking failed:', error);
    }
  }

  // === ORCHESTRATION CONTROL ===

  private startOrchestrationLoop(): void {
    const task = cron.schedule(`*/${Math.floor(this.config.discoveryIntervalMs / 60000)} * * * *`, async () => {
      await this.executeFullPipeline();
    });
    
    this.scheduledTasks.set('mainLoop', task);
    this.logger.info(`🔄 Orchestration loop started (${this.config.discoveryIntervalMs}ms interval)`);
  }

  private async executeFullPipeline(): Promise<void> {
    if (!this.isRunning) return;
    
    try {
      this.logger.info('🚀 Executing full pipeline...');
      
      // Phase 1: Discovery
      const candidates = await this.executeDiscoveryPhase();
      if (candidates.length === 0) {
        this.logger.info('No candidates found, skipping pipeline');
        return;
      }
      
      // Phase 2: Pre-validation
      const validatedCandidates = await this.executePreValidationPhase(candidates);
      if (validatedCandidates.length === 0) {
        this.logger.info('No candidates passed validation');
        return;
      }
      
      // Phase 3: Smart Money Analysis
      const enhancedCandidates = await this.executeSmartMoneyAnalysis(validatedCandidates);
      
      // Phase 4: Edge Calculation
      const scoredTokens = await this.executeEdgeCalculation(enhancedCandidates);
      
      // Phase 5: Alert Generation
      await this.executeAlertGeneration(scoredTokens);
      
      // Phase 6: Performance Tracking
      await this.executePerformanceTracking();
      
      this.logger.info('✅ Full pipeline completed successfully');
      
    } catch (error) {
      this.logger.error('Pipeline execution failed:', error);
    }
  }

  // === HELPER METHODS ===

  private async initializeServices(): Promise<void> {
    this.logger.info('🔧 Initializing services...');
    
    // Services should already be initialized by their constructors
    // Add any additional service setup here if needed
    
    this.logger.info('✅ Services initialized');
  }

  private startBackgroundTasks(): void {
    if (!this.config.enableBackgroundTasks) return;
    
    // Health monitoring
    const healthTask = cron.schedule('*/5 * * * *', async () => {
      await this.performHealthCheck();
    });
    this.scheduledTasks.set('healthCheck', healthTask);
    
    // Metrics sync
    const metricsTask = cron.schedule('* * * * *', async () => {
      await this.updateSystemMetrics();
    });
    this.scheduledTasks.set('metricsSync', metricsTask);
    
    this.logger.info('🔄 Background tasks started');
  }

  private async performHealthCheck(): Promise<void> {
    let healthyPhases = 0;
    let criticalPhases = 0;
    
    this.phases.forEach(phase => {
      if (phase.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        criticalPhases++;
      } else {
        healthyPhases++;
      }
    });
    
    if (criticalPhases > 2) {
      this.metrics.systemHealth = 'CRITICAL';
    } else if (criticalPhases > 0) {
      this.metrics.systemHealth = 'DEGRADED';
    } else {
      this.metrics.systemHealth = 'HEALTHY';
    }
    
    this.logger.debug(`💊 Health check: ${this.metrics.systemHealth}`);
  }

  private async updateSystemMetrics(): Promise<void> {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
    this.metrics.lastUpdated = new Date();
  }

  private updatePhaseStatus(phaseName: string, status: PipelinePhase['status']): void {
    const phase = this.phases.get(phaseName);
    if (phase) {
      phase.status = status;
      phase.lastRun = new Date();
    }
  }

  private updatePhaseMetrics(phaseName: string, duration: number, success: boolean): void {
    const phase = this.phases.get(phaseName);
    if (!phase) return;
    
    phase.totalRuns++;
    
    if (success) {
      phase.consecutiveFailures = 0;
      phase.lastSuccess = new Date();
      phase.averageDuration = (phase.averageDuration + duration) / 2;
    } else {
      phase.consecutiveFailures++;
    }
    
    phase.successRate = ((phase.totalRuns - phase.consecutiveFailures) / phase.totalRuns) * 100;
  }

  private async recoverPhase(phaseName: string): Promise<void> {
    this.logger.warn(`🔄 Attempting recovery for phase: ${phaseName}`);
    
    const phase = this.phases.get(phaseName);
    if (phase) {
      phase.status = 'recovering';
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.config.recoveryDelayMs));
      
      phase.status = 'idle';
      this.logger.info(`✅ Phase recovery completed: ${phaseName}`);
    }
  }

  private setupEventHandlers(): void {
    this.alertSystem.on('alert', (alert) => {
      this.emit('alert', alert);
    });
    
    // Add more event handlers as needed
  }

  // === PUBLIC API ===

  getMetrics(): OrchestrationMetrics {
    return { ...this.metrics };
  }

  getPhaseStatus(): Map<string, PipelinePhase> {
    return new Map(this.phases);
  }

  async triggerManualRun(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Orchestrator not running');
    }
    
    this.logger.info('🚀 Manual pipeline run triggered');
    await this.executeFullPipeline();
  }

  updateConfig(newConfig: Partial<OrchestrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Orchestrator config updated', newConfig);
  }
}

export default ThorpOrchestratorService;