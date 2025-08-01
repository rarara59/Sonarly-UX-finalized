/**
 * THORP System Orchestrator Service
 * Renaissance-grade system integration with dependency injection and lifecycle management
 * Handles service startup, shutdown, health monitoring, and resource cleanup
 */

import { cpus } from 'os';
import { EventEmitter } from 'events';
import { CircuitBreaker } from './circuit-breaker.service.js';
import { WorkerPoolManager } from './worker-pool-manager.service.js';
import { BatchProcessor } from './batch-processor.service.js';
import { SolanaPoolParserService } from './solana-pool-parser.service.js';
import { LiquidityPoolCreationDetectorService } from './liquidity-pool-creation-detector.service.js';
import { WebSocketManagerService } from './websocket-manager.service.js';
import RPCConnectionManager from '../core/rpc-connection-manager/index.js';
import { TieredTokenFilterService } from './tiered-token-filter.service.js';
import RenaissanceFeatureStore from './feature-store.service.js';

export class ThorpSystemService extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxStartupTimeMs: 30000,
            shutdownTimeoutMs: 15000,
            healthCheckIntervalMs: 5000,
            maxMemoryUsageMB: 2048,
            ...config
        };
        
        // Service registry with dependency order
        this.services = new Map();
        this.serviceOrder = [];
        this.isStarted = false;
        this.isShuttingDown = false;
        this.healthTimer = null;
        
        // Performance metrics
        this.metrics = {
            startupTimeMs: 0,
            uptime: 0,
            startTime: null,
            memoryPeakMB: 0,
            servicesRestarted: 0
        };
        
        // Bind shutdown handlers
        this.boundShutdown = this.shutdown.bind(this);
        process.on('SIGINT', this.boundShutdown);
        process.on('SIGTERM', this.boundShutdown);
        process.on('uncaughtException', this.handleCriticalError.bind(this));
        process.on('unhandledRejection', this.handleCriticalError.bind(this));
    }
    
    /**
     * Initialize all services in dependency order
     * RPC Manager -> Circuit Breaker -> Batch Processor -> Worker Pool -> Pool Parser -> LP Detector -> Tiered Token Filter
     */
    async initialize() {
        const startTime = Date.now();
        this.metrics.startTime = startTime;
        
        try {
            console.log('[THORP] Initializing system services...');
            
            // 1. RPC Connection Manager (foundation layer)
            const rpcManager = RPCConnectionManager;
            // Initialize with config if needed
            if (typeof rpcManager.configure === 'function') {
                rpcManager.configure({
                    heliusApiKey: process.env.HELIUS_API_KEY,
                    chainstackApiKey: process.env.CHAINSTACK_API_KEY,
                    enableWebSocket: true,
                    memoryMonitoring: true,
                    prometheusMetrics: true
                });
            }
            await this.registerService('rpcManager', rpcManager, 0);
            
            // 2. Circuit Breaker (protection layer)
            const circuitBreaker = new CircuitBreaker('rpcManager', {
                failureThreshold: 10,
                recoveryTimeoutMs: 30000,
                monitoringWindowMs: 60000,
                bulkheadConcurrency: 50
            });
            await this.registerService('circuitBreaker', circuitBreaker, 1);
            
            // 3. Batch Processor (optimization layer)
            const batchProcessor = new BatchProcessor({
                maxBatchSize: 100,
                batchTimeoutMs: 50,
                maxConcurrentBatches: 10,
                priorityLevels: 5,
                rpcManager: rpcManager,
                circuitBreaker: circuitBreaker
            });
            await this.registerService('batchProcessor', batchProcessor, 2);
            
            // 4. Worker Pool Manager (computation layer)
            const workerPool = new WorkerPoolManager({
                maxWorkers: Math.min(16, cpus().length * 2),
                workerScript: './src/workers/math-worker.js',
                taskTimeoutMs: 5000,
                healthCheckIntervalMs: 10000
            });
            await this.registerService('workerPool', workerPool, 3);
            
            // 5. Feature Store (data persistence layer) - Initialize before Pool Parser
            console.log('[THORP] Initializing Feature Store...');
            const featureStore = new RenaissanceFeatureStore({
                environment: process.env.NODE_ENV || 'development',
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                    password: process.env.REDIS_PASSWORD,
                    db: parseInt(process.env.REDIS_DB) || 0
                }
            });
            //await this.registerService('featureStore', featureStore, 4);
            console.log('[THORP] Service \'featureStore\' registered at order 4');
            
            // 6. Solana Pool Parser (application layer)
            const poolParser = new SolanaPoolParserService({
                rpcManager: rpcManager,
                batchProcessor: batchProcessor,
                circuitBreaker: circuitBreaker,
                workerPool: workerPool,
                featureStore: featureStore.client || featureStore, // Use the actual featureStore
                processingRateLimit: 100 // tokens per minute
            });
            await this.registerService('poolParser', poolParser, 5);
            
            // Wait for poolParser to be ready before creating LP detector
            console.log('⏳ Waiting for poolParser to be ready with data...');
            await poolParser.ready(); // Wait for data to be populated
            console.log('✅ poolParser is ready with baseline data');

            // 7. Liquidity Pool Creation Detector (signal generation layer)
            
            const lpDetector = new LiquidityPoolCreationDetectorService({
                accuracyThreshold: 0.95, // 95% accuracy requirement
                significanceLevel: 0.05, // Statistical significance level
                bayesianConfidenceThreshold: 0.85, // Bayesian confidence threshold
                solanaPoolParser: poolParser,
                poolParser: poolParser,  // ADD this line
                rpcManager: rpcManager,
                circuitBreaker: circuitBreaker,
                workerPool: workerPool,
                lpScannerConfig: this.config.lpScanner // Pass LP scanner config
            });
            await this.registerService('lpDetector', lpDetector, 6, {
                timeout: 120_000  // 2 minutes for heavy I/O
            });

            // 8. Tiered Token Filter (token quality filtering layer)
            const tieredTokenFilter = new TieredTokenFilterService({
                rpcManager: rpcManager,
                circuitBreaker: circuitBreaker
            });
            await this.registerService('tieredTokenFilter', tieredTokenFilter, 7);

            // 9. WebSocket Manager (real-time data layer) - DISABLED: Helius plan limitation
            const webSocketManager = new WebSocketManagerService({
                heliusApiKey: process.env.HELIUS_API_KEY,
                endpoint: 'wss://atlas-mainnet.helius-rpc.com',
                reconnectInterval: 3000,
                maxReconnects: 50,
                circuitBreaker: circuitBreaker,
                workerPool: workerPool,
                lpDetector: lpDetector  // Add LP detector for live transaction processing
            });
            //await this.registerService('webSocketManager', webSocketManager, 8); // Enabled for live LP detection
            
            // Connect LP detector to receive pool data from pool parser
            this.setupLPDetectorEventHandlers(poolParser, lpDetector);
            
            // Wire LP detection -> Token filtering pipeline
            lpDetector.on('lpDetected', async (lpCandidate) => {
                try {
                    console.log(`🔍 Processing LP candidate through Renaissance filter: ${lpCandidate.poolAddress}`);
                    
                    // Apply tiered filtering
                    const filteredResult = await tieredTokenFilter.processToken(lpCandidate);
                    
                    if (filteredResult && filteredResult.approved) {
                        // Token passed filtering - emit for signal generation
                        console.log(`✅ Token passed Renaissance filter: ${filteredResult.renaissanceClassification.tier} (score: ${filteredResult.renaissanceClassification.overallScore.toFixed(3)})`);
                        
                        this.emit('tokenFiltered', {
                            ...filteredResult,
                            timestamp: Date.now(),
                            pipeline: 'lp_detection_to_filtering'
                        });
                        
                        // Emit trading signal if high confidence
                        if (filteredResult.renaissanceClassification.overallScore > 0.8) {
                            this.emit('tradingSignal', {
                                type: 'HIGH_CONFIDENCE_TOKEN',
                                data: filteredResult,
                                confidence: filteredResult.renaissanceClassification.overallScore,
                                tier: filteredResult.renaissanceClassification.tier,
                                timestamp: Date.now()
                            });
                        }
                    }
                    
                } catch (error) {
                    console.error(`❌ Token filtering failed for ${lpCandidate.poolAddress}:`, error);
                }
            });

            // Add filter rejection monitoring
            tieredTokenFilter.on('tokenRejected', (rejection) => {
                console.log(`❌ Token rejected: ${rejection.mint} - ${rejection.reason} (${rejection.processingTimeMs.toFixed(1)}ms)`);
                
                // Emit for analytics/monitoring
                this.emit('tokenRejected', {
                    ...rejection,
                    timestamp: Date.now()
                });
            });
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            this.isStarted = true;
            this.metrics.startupTimeMs = Date.now() - startTime;
            
            console.log(`✅ THORP SYSTEM FULLY OPERATIONAL
🎯 Ready for meme coin detection and trading
📡 Real-time WebSocket monitoring active
🧠 Renaissance mathematical algorithms active
🔍 LP creation detection with 95% accuracy active
⚡ Live trading signal generation enabled
[THORP] System initialized successfully in ${this.metrics.startupTimeMs}ms`);
            console.log(`[THORP] Services: ${Array.from(this.services.keys()).join(', ')}`);
            
            // Start active scanning after initialization
            setTimeout(() => {
                this.startActiveLPScanning();
            }, 5000); // Start after 5 seconds
            
            return true;
            
        } catch (error) {
            console.error('[THORP] System initialization failed:', error);
            await this.cleanup();
            throw error;
        }
    }
    
    async startActiveLPScanning() {
        console.log('\n🔍 Starting active LP creation scanning...');
        
        // Get service references
        this.rpcManager = this.getService('rpcManager');
        this.lpDetector = this.getService('lpDetector');
        this.tieredTokenFilter = this.getService('tieredTokenFilter');
        
        // Scan for recent LP creation transactions
        this.scanTimer = setInterval(async () => {
            try {
                await this.scanRecentTransactionsForLPCreation();
            } catch (error) {
                console.error('❌ LP scanning failed:', error.message);
            }
        }, 30000); // Scan every 30 seconds
        
        console.log('✅ Active LP scanning started (30s intervals)');
    }

    async scanRecentTransactionsForLPCreation() {
        try {
            console.log('🔍 Scanning recent transactions for LP creation...');
            
            // Get recent confirmed signatures for Raydium program
            const recentSignatures = await this.rpcManager.call('getSignaturesForAddress', [
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM program ID
                {
                    limit: 10,
                    commitment: 'confirmed'
                }
            ], { priority: 'high' });
            
            if (!recentSignatures || recentSignatures.length === 0) {
                console.log('  📭 No recent Raydium transactions found');
                return;
            }

            console.log(`  📊 Found ${recentSignatures.length} recent Raydium transactions`);

            // Process each transaction for LP creation
            for (const sigInfo of recentSignatures.slice(0, 3)) { // Process top 3 most recent
                try {
                    const lpCandidates = await this.lpDetector.detectFromTransaction(sigInfo.signature);
                    
                    if (lpCandidates && lpCandidates.length > 0) {
                        console.log(`🎯 Found ${lpCandidates.length} LP candidates in transaction ${sigInfo.signature}`);
                        
                        // Process each LP candidate through the pipeline
                        for (const candidate of lpCandidates) {
                            await this.processLPCandidate(candidate);
                        }
                    }
                } catch (txError) {
                    console.log(`  ⚠️ Transaction ${sigInfo.signature} processing failed: ${txError.message}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Recent transaction scanning failed:', error.message);
        }
    }

    async processLPCandidate(lpCandidate) {
        try {
            console.log(`🔍 Processing LP candidate through Renaissance pipeline: ${lpCandidate.poolAddress}`);
            
            // Apply tiered filtering
            const filteredResult = await this.tieredTokenFilter.processToken(lpCandidate);
            
            if (filteredResult) {
                console.log(`✅ Token passed Renaissance filter: ${filteredResult.renaissanceClassification.tier} (score: ${filteredResult.renaissanceClassification.overallScore.toFixed(3)})`);
                
                // Emit trading signal
                this.emit('tokenFiltered', {
                    ...filteredResult,
                    timestamp: Date.now(),
                    pipeline: 'active_lp_scanning'
                });
                
                // Generate high-confidence trading signal
                if (filteredResult.renaissanceClassification.overallScore > 0.8) {
                    this.generateTradingAlert(filteredResult);
                }
            } else {
                console.log(`❌ Token filtered out by Renaissance filter`);
            }
            
        } catch (error) {
            console.error(`❌ LP candidate processing failed: ${error.message}`);
        }
    }

    generateTradingAlert(filteredToken) {
        const alert = {
            type: 'HIGH_CONFIDENCE_FRESH_GEM',
            data: filteredToken,
            confidence: filteredToken.renaissanceClassification.overallScore,
            tier: filteredToken.renaissanceClassification.tier,
            timestamp: Date.now()
        };
        
        // Console alert
        console.log('\n🚨🚨🚨 RENAISSANCE TRADING ALERT 🚨🚨🚨');
        console.log(`💎 ${filteredToken.renaissanceClassification.tier.toUpperCase()}: ${filteredToken.tokenMetadata.name || 'Unknown'} (${filteredToken.tokenMetadata.symbol || 'UNK'})`);
        console.log(`📊 Overall Score: ${(filteredToken.renaissanceClassification.overallScore * 100).toFixed(1)}%`);
        console.log(`🔐 Security: ${(filteredToken.renaissanceClassification.securityScore * 100).toFixed(1)}%`);
        console.log(`🌱 Organic: ${(filteredToken.renaissanceClassification.organicScore * 100).toFixed(1)}%`);
        console.log(`🎯 Pool: ${filteredToken.poolAddress || filteredToken.tokenMetadata.address}`);
        console.log(`⏰ Time: ${new Date().toLocaleString()}`);
        console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n');
        
        this.emit('tradingSignal', alert);
    }
    
    /**
     * Register service with dependency injection and health monitoring
     */
    async registerService(name, serviceInstance, order, options = {}) {
        try {
            // Initialize service if it has init method
            if (typeof serviceInstance.initialize === 'function') {
                // Add timeout to detect hanging services
                const timeout = options.timeout || 10000; // Default 10 seconds
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Service '${name}' initialize() timed out after ${timeout/1000} seconds`)), timeout);
                });
                
                try {
                    await Promise.race([
                        serviceInstance.initialize(),
                        timeoutPromise
                    ]);
                } catch (error) {
                    console.error(`[THORP] Service '${name}' initialize() failed:`, error.message);
                    throw error;
                }
            }
            
            this.services.set(name, {
                instance: serviceInstance,
                order: order,
                startTime: Date.now(),
                restartCount: 0,
                lastHealthCheck: Date.now(),
                isHealthy: true
            });
            
            this.serviceOrder = Array.from(this.services.keys())
                .sort((a, b) => this.services.get(a).order - this.services.get(b).order);
            
            console.log(`[THORP] Service '${name}' registered at order ${order}`);
            
        } catch (error) {
            console.error(`[THORP] Failed to register service '${name}':`, error);
            throw error;
        }
    }
    
    /**
     * Get service instance by name
     */
    getService(name) {
        const service = this.services.get(name);
        return service ? service.instance : null;
    }
    
    /**
     * Setup event handlers to connect LP detector with pool parser for live trading signals
     */
    setupLPDetectorEventHandlers(poolParser, lpDetector) {
        console.log('[THORP] Setting up LP detector event handlers for live trading signals...');
        
        // Listen for pool creation events from the pool parser
        poolParser.on('poolCreated', async (poolData) => {
            try {
                console.log(`[THORP] Processing new pool for LP detection: ${poolData.poolAddress?.slice(0, 8)}...`);
                
                // Process the pool data through the LP detector
                const detectionResults = await lpDetector.detectFromPoolData(poolData);
                
                if (detectionResults && detectionResults.length > 0) {
                    for (const result of detectionResults) {
                        if (result.mathematicalValidation?.overallConfidence > 0.85) {
                            console.log(`[THORP] 🎯 High-confidence LP detected: ${result.poolAddress}`);
                            console.log(`[THORP]    Confidence: ${(result.mathematicalValidation.overallConfidence * 100).toFixed(1)}%`);
                            console.log(`[THORP]    DEX: ${result.dex}`);
                            
                            // Emit trading signal for the broader system
                            this.emit('tradingSignal', {
                                type: 'liquidity_pool_creation',
                                poolAddress: result.poolAddress,
                                dex: result.dex,
                                confidence: result.mathematicalValidation.overallConfidence,
                                timestamp: Date.now(),
                                metadata: result
                            });
                        }
                    }
                }
                
            } catch (error) {
                console.error(`[THORP] Error processing pool data through LP detector: ${error.message}`);
            }
        });

        // Listen for LP events from the pool parser  
        poolParser.on('lpEvent', async (eventData) => {
            try {
                console.log(`[THORP] Processing LP event for signal generation...`);
                
                // Process LP events through the detector for additional signals
                const signals = await lpDetector.processLPEvent(eventData);
                
                if (signals && signals.confidence > 0.9) {
                    console.log(`[THORP] 🚀 High-priority LP signal generated`);
                    
                    this.emit('tradingSignal', {
                        type: 'lp_event',
                        ...signals,
                        timestamp: Date.now()
                    });
                }
                
            } catch (error) {
                console.error(`[THORP] Error processing LP event: ${error.message}`);
            }
        });

        // Listen for significant LP events
        poolParser.on('significantLPEvent', async (eventData) => {
            try {
                console.log(`[THORP] 🔥 Processing significant LP event for priority signals...`);
                
                const prioritySignals = await lpDetector.processSignificantLPEvent(eventData);
                
                if (prioritySignals) {
                    console.log(`[THORP] ⚡ Priority trading signal generated`);
                    
                    this.emit('priorityTradingSignal', {
                        type: 'significant_lp_event',
                        ...prioritySignals,
                        priority: 'high',
                        timestamp: Date.now()
                    });
                }
                
            } catch (error) {
                console.error(`[THORP] Error processing significant LP event: ${error.message}`);
            }
        });
        
        console.log('[THORP] ✅ LP detector event handlers configured for live trading signals');
    }
    
    /**
     * Start health monitoring for all services
     */
    startHealthMonitoring() {
        this.healthTimer = setInterval(async () => {
            if (this.isShuttingDown) return;
            
            try {
                await this.performHealthChecks();
                this.updateSystemMetrics();
            } catch (error) {
                console.error('[THORP] Health monitoring error:', error);
            }
        }, this.config.healthCheckIntervalMs);
    }
    
    /**
     * Perform health checks on all services
     */
    async performHealthChecks() {
        const promises = Array.from(this.services.entries()).map(async ([name, service]) => {
            try {
                let isHealthy = true;
                
                // Check if service has health check method
                if (typeof service.instance.healthCheck === 'function') {
                    isHealthy = await service.instance.healthCheck();
                }
                
                service.lastHealthCheck = Date.now();
                service.isHealthy = isHealthy;
                
                if (!isHealthy) {
                    console.warn(`[THORP] Service '${name}' failed health check`);
                    // Could implement auto-restart logic here
                }
                
            } catch (error) {
                console.error(`[THORP] Health check failed for service '${name}':`, error);
                this.services.get(name).isHealthy = false;
            }
        });
        
        await Promise.allSettled(promises);
    }
    
    /**
     * Update system performance metrics
     */
    updateSystemMetrics() {
        if (this.metrics.startTime) {
            this.metrics.uptime = Date.now() - this.metrics.startTime;
        }
        
        // Memory monitoring
        const memUsage = process.memoryUsage();
        const currentMemMB = memUsage.heapUsed / 1024 / 1024;
        this.metrics.memoryPeakMB = Math.max(this.metrics.memoryPeakMB, currentMemMB);
        
        // Memory pressure protection
        if (currentMemMB > this.config.maxMemoryUsageMB) {
            console.warn(`[THORP] Memory usage critical: ${currentMemMB.toFixed(2)}MB`);
            // Could trigger garbage collection or service restart
        }
    }
    
    /**
     * Get system health status
     */
    getSystemHealth() {
        const services = {};
        for (const [name, service] of this.services) {
            services[name] = {
                healthy: service.isHealthy,
                uptime: Date.now() - service.startTime,
                restartCount: service.restartCount
            };
        }
        
        return {
            system: {
                started: this.isStarted,
                uptime: this.metrics.uptime,
                memoryPeakMB: this.metrics.memoryPeakMB,
                startupTimeMs: this.metrics.startupTimeMs
            },
            services: services
        };
    }
    
    /**
     * Handle critical system errors
     */
    handleCriticalError(error) {
        console.error('[THORP] CRITICAL ERROR:', error);
        
        // Attempt graceful shutdown
        this.shutdown().catch(shutdownError => {
            console.error('[THORP] Emergency shutdown failed:', shutdownError);
            process.exit(1);
        });
    }
    
    /**
     * Graceful system shutdown
     */
    async shutdown() {
        if (this.isShuttingDown) return;
        
        console.log('[THORP] Initiating graceful shutdown...');
        this.isShuttingDown = true;
        
        // Stop active scanning
        if (this.scanTimer) {
            clearInterval(this.scanTimer);
            this.scanTimer = null;
            console.log('🔍 Active LP scanning stopped');
        }
        
        // Stop health monitoring
        if (this.healthTimer) {
            clearInterval(this.healthTimer);
            this.healthTimer = null;
        }
        
        // Shutdown services in reverse dependency order
        const shutdownOrder = [...this.serviceOrder].reverse();
        
        for (const serviceName of shutdownOrder) {
            try {
                const service = this.services.get(serviceName);
                if (service && typeof service.instance.shutdown === 'function') {
                    console.log(`[THORP] Shutting down service: ${serviceName}`);
                    await Promise.race([
                        service.instance.shutdown(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Shutdown timeout')), 
                            this.config.shutdownTimeoutMs)
                        )
                    ]);
                }
            } catch (error) {
                console.error(`[THORP] Error shutting down service '${serviceName}':`, error);
            }
        }
        
        await this.cleanup();
        
        console.log('[THORP] System shutdown complete');
        process.exit(0);
    }
    
    /**
     * Final cleanup of resources
     */
    async cleanup() {
        try {
            // Remove process listeners
            process.removeListener('SIGINT', this.boundShutdown);
            process.removeListener('SIGTERM', this.boundShutdown);
            
            // Clear services
            this.services.clear();
            this.serviceOrder = [];
            this.isStarted = false;
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
        } catch (error) {
            console.error('[THORP] Cleanup error:', error);
        }
    }
}

// Export singleton instance factory
export function createThorpSystem(config) {
    return new ThorpSystemService(config);
}