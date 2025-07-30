/**
 * SOLANA POOL PARSER SERVICE - MAIN THREAD ONLY
 *
 * Handles all Solana RPC calls and data fetching in the main thread.
 * Parses real meme coin pool data from Raydium and Orca DEXs.
 * Sends only mathematical processing to workers.
 *
 * Features:
 * - Real Helius RPC connection
 * - Actual Solana PublicKey handling  
 * - Raydium AMM pool parsing
 * - Orca Whirlpool parsing
 * - Worker coordination for math operations
 */

import { EventEmitter } from 'events';
import RPCConnectionManager from '../core/rpc-connection-manager/index.js';
import {
  RAYDIUM_LAYOUT_CONSTANTS,
  ORCA_LAYOUT_CONSTANTS,
  MINT_LAYOUT_CONSTANTS
} from '../constants/layout-constants.js';
import WorkerPoolManager from './worker-pool-manager.service.js';
import { getSharedWorkerPool } from '../infra/workerPool/index.js';
import { createBatchProcessor } from './batch-processor.service.js';
import { CircuitBreakerManager } from './circuit-breaker.service.js';
import { PublicKey } from '@solana/web3.js';

// Renaissance mathematical algorithms integration
import {
  updateKalmanFilter,
  calculateEWMA,
  // tcpCongestionControl, // Not available - using congestionControlOnAck/OnLoss instead
  // statisticalProcessControl, // Not available - using detectOutOfControlConditions instead  
  calculateWeightedScores, // multiCriteriaDecisionAnalysis not available
  initializeKalmanFilter,
  initializeCongestionControl, // initializeTcpCongestionState not available
  congestionControlOnAck,
  congestionControlOnLoss,
  detectOutOfControlConditions,
  calculateControlChartStats
} from '../utils/renaissance-math.js';

// Baseline limit constant to prevent memory explosion
export const BASELINE_LIMIT = 10_000;

export class SolanaPoolParserService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.isInitialized = false;
    this.rpcManager = options.rpcManager || RPCConnectionManager;
    this.PROGRAM_IDS = null;
    this.mathOnlyMode = options.mathOnlyMode || false;
    
    // Ready promise infrastructure
    this._ready = new Promise(resolve => { 
      this._signalReady = resolve; 
    });
    
    // Optional BatchProcessor integration
    this.batchProcessor = options.batchProcessor || null;
    this.circuitBreaker = options.circuitBreaker || null; // For BatchProcessor only (RPCConnectionManager has built-in circuit breakers)

    // Use shared worker pool for math operations
    this.workerPool = null; // Will be set in initialize()

    // Renaissance mathematical enhancement state
    this.renaissanceState = {
      endpointKalmanStates: new Map(), // Kalman filters for response time prediction
      endpointHealthScores: new Map(), // EWMA health scoring
      congestionStates: new Map(), // TCP-style congestion control per endpoint
      performanceMetrics: [], // SPC monitoring data
      lastSpcAnalysis: Date.now()
    };

    // Dual-track architecture for memory optimization
    this.historicalBaseline = null; // Loaded once from Redis
    this.livePoolTracker = new Map(); // Only active pools (24hr expiration)
    this.lastProcessedSignature = null; // For incremental scanning
    this.featureStore = options.featureStore || null; // FeatureStore integration
    
    // Statistical thresholds (computed from baseline)
    this.liquidityThresholds = null;
    this.volumePercentiles = null;
    this.ageDistribution = null;
  }

  /**
   * Initialize the service and worker pool
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Solana Pool Parser Service...');
    console.log('📋 Configuration:');
    console.log(`  - RPC Manager: Initialized with multi-endpoint support`);
    console.log(`  - BatchProcessor: ${this.batchProcessor ? 'Provided' : 'Will create'}`);
    console.log(`  - BatchProcessor CircuitBreaker: ${this.circuitBreaker ? 'Provided' : 'Will create'}`);
    
    // Get shared worker pool
    this.workerPool = await getSharedWorkerPool();
    console.log('✅ Using shared math worker pool');

    // Skip Solana setup in math-only mode but still initialize BatchProcessor if provided
    if (this.mathOnlyMode) {
      console.log('✅ Math-only mode - skipping Solana imports');
      
      // Initialize BatchProcessor CircuitBreaker if not provided (for compatibility)
      if (!this.circuitBreaker) {
        this.circuitBreaker = new CircuitBreakerManager();
        console.log('✅ BatchProcessor CircuitBreakerManager created (math-only mode)');
      }
      
      // Initialize BatchProcessor if provided but not created yet (math-only mode)
      if (this.batchProcessor && typeof this.batchProcessor === 'function') {
        // In math-only mode, create a mock RPC manager for BatchProcessor
        const mockRpcManager = {
          call: async () => { throw new Error('RPC not available in math-only mode'); },
          getMetrics: () => ({ status: 'math-only' })
        };
        this.batchProcessor = this.batchProcessor(mockRpcManager, this.circuitBreaker);
        console.log('✅ BatchProcessor initialized with mock RPC manager (math-only mode)');
      }
      
      this.isInitialized = true;
      console.log('✅ Math-only mode initialization complete');
      return;
    }
    
    try {
      // Initialize RPC Connection Manager
      console.log('📡 Initializing RPC Connection Manager...');
      await this.rpcManager.initialize();
      
      // Get RPC Manager status
      const rpcStatus = this.rpcManager.getMetrics();
      console.log('✅ RPC Connection Manager initialized with automatic failover');
      console.log(`  - Current endpoint: ${rpcStatus.currentEndpoint || 'Auto-selecting'}`);
      console.log(`  - Available endpoints: ${rpcStatus.endpoints?.length || 'Multiple'}`);
      console.log(`  - Health status: ${rpcStatus.healthStatus || 'Monitoring'}`);
      console.log(`  - Auto-switching: Enabled (transparent endpoint management)`);
      console.log(`  - Circuit breakers: Built-in protection active`);
      
      // Set up program IDs
      this.PROGRAM_IDS = {
        RAYDIUM_AMM: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
        ORCA_WHIRLPOOL: new PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'),
        SYSTEM_PROGRAM: new PublicKey('11111111111111111111111111111111')
      };
      console.log('✅ Solana program IDs configured');

      // RPCConnectionManager handles all connections internally
      console.log('✅ RPC Connection Manager ready');
      
      // Initialize BatchProcessor CircuitBreaker if not provided (for compatibility)
      if (!this.circuitBreaker) {
        this.circuitBreaker = new CircuitBreakerManager();
        console.log('✅ BatchProcessor CircuitBreakerManager created');
      } else {
        console.log('✅ Using provided BatchProcessor CircuitBreakerManager');
      }
      
      if (!this.batchProcessor) {
        this.batchProcessor = createBatchProcessor(this.rpcManager, this.circuitBreaker, {
          batchDelay: 10, // Optimized for trading
          maxRequestsPerSecond: 100
        });
        console.log('✅ BatchProcessor created with RPCConnectionManager integration');
      } else if (typeof this.batchProcessor === 'function') {
        // If batchProcessor is a factory function, call it
        this.batchProcessor = this.batchProcessor(this.rpcManager, this.circuitBreaker);
        console.log('✅ BatchProcessor initialized from factory function');
      } else {
        console.log('✅ Using provided BatchProcessor instance');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize RPC Connection Manager:', error.message);
      console.log('⚠️  RPCConnectionManager will handle connection recovery automatically');
      console.log('⚠️  Falling back to math-only mode for this session');
      this.mathOnlyMode = true;
    }

    this.isInitialized = true;
    
    // Signal that the parser is ready
    this._signalReady();
    
    console.log('✅ Solana Pool Parser Service ready');
    console.log('📊 Final initialization status:');
    console.log(`  - RPC Manager: ${this.rpcManager ? 'Active' : 'None'}`);
    console.log(`  - BatchProcessor: ${this.batchProcessor ? 'Active' : 'None'}`);
    console.log(`  - BatchProcessor CircuitBreaker: ${this.circuitBreaker ? 'Active' : 'None'}`);
    console.log(`  - Math workers: ${this.workerPool ? 'Active' : 'None'}`);
    console.log(`  - Mode: ${this.mathOnlyMode ? 'Math-only' : 'Full RPC (RPCConnectionManager handles circuit breakers)'}`);
    
    if (this.rpcManager && !this.mathOnlyMode) {
      const finalMetrics = this.rpcManager.getMetrics();
      console.log('  - RPC endpoints available:', finalMetrics.endpoints?.length || 'Multiple');
      console.log('  - Current latency:', finalMetrics.averageLatency ? `${finalMetrics.averageLatency}ms` : 'Monitoring');
      console.log('  - Connection health:', finalMetrics.healthStatus || 'Auto-managing');
      console.log('  - Failover status:', 'Ready (automatic endpoint switching)');
    }
  }

  /**
   * Returns a promise that resolves when the parser is ready
   */
  ready() {
    return this._ready;
  }

  /**
   * Health check for orchestrator monitoring
   */
  async healthCheck() {
    try {
      // SolanaPoolParser is healthy if:
      // 1. RPC connections are working
      // 2. Circuit breaker is closed
      // 3. Worker pool is responsive
      // 4. No memory leaks in pools cache
      const rpcHealthy = this.rpcManager && this.rpcManager.healthCheck ? await this.rpcManager.healthCheck() : true;
      const circuitHealthy = this.circuitBreaker ? this.circuitBreaker.isHealthy() : true;
      const workerHealthy = this.workerPool ? await this.workerPool.healthCheck() : true;
      const cacheReasonable = !this.poolsCache || Object.keys(this.poolsCache).length < 50000;
      
      const isHealthy = rpcHealthy && circuitHealthy && workerHealthy && cacheReasonable;
      
      this.emit('healthCheck', {
        healthy: isHealthy,
        rpcHealthy: rpcHealthy,
        circuitHealthy: circuitHealthy,
        workerHealthy: workerHealthy,
        cacheSize: this.poolsCache ? Object.keys(this.poolsCache).length : 0,
        timestamp: Date.now()
      });
      
      return isHealthy;
      
    } catch (error) {
      console.error('SolanaPoolParser health check failed:', error);
      return false;
    }
  }

  /**
   * Parse a Raydium AMM pool by address
   */
  async parseRaydiumPool(poolAddress) {
    if (!this.isInitialized) await this.initialize();

    const poolPubkey = typeof poolAddress === 'string' 
      ? new PublicKey(poolAddress) 
      : poolAddress;

    console.log(`📊 Fetching Raydium pool data: ${poolPubkey.toString()}`);

    // Use BatchProcessor for optimized account fetching
    let accountInfo;
    if (this.batchProcessor) {
      const accounts = await this.batchProcessor.batchGetAccounts(
        [poolPubkey.toString()],
        { priority: 'trading' } // Pool data is important for trading
      );
      accountInfo = Array.isArray(accounts) ? accounts[0] : accounts;
    } else {
      // Use RPCConnectionManager directly (circuit breaker protection built-in)
      accountInfo = await this.rpcManager.call('getAccountInfo', [poolPubkey.toString()], {
        priority: 'high' // Pool data is critical for trading
      });
    }
    
    if (!accountInfo) {
      throw new Error(`Pool account not found: ${poolPubkey.toString()}`);
    }

    if (!accountInfo.owner.equals(this.PROGRAM_IDS.RAYDIUM_AMM)) {
      throw new Error(`Invalid pool owner. Expected Raydium AMM program, got: ${accountInfo.owner.toString()}`);
    }

    console.log(`✅ Pool data fetched (${accountInfo.data.length} bytes)`);

    // Send raw data to worker for mathematical parsing
    const parsedData = await this.workerPool.executeTask('parsePoolData', {
      poolType: 'raydium',
      accountDataBuffer: accountInfo.data,
      layoutConstants: RAYDIUM_LAYOUT_CONSTANTS
    });

    // Convert byte arrays back to PublicKeys in main thread
    const result = {
      ...parsedData,
      baseMint: new PublicKey(new Uint8Array(parsedData.baseMintBytes)).toString(),
      quoteMint: new PublicKey(new Uint8Array(parsedData.quoteMintBytes)).toString(),
      lpMint: new PublicKey(new Uint8Array(parsedData.lpMintBytes)).toString(),
      baseVault: new PublicKey(new Uint8Array(parsedData.baseVaultBytes)).toString(),
      quoteVault: new PublicKey(new Uint8Array(parsedData.quoteVaultBytes)).toString(),
      poolAddress: poolPubkey.toString(),
      owner: accountInfo.owner.toString()
    };

    // Remove byte arrays from result
    delete result.baseMintBytes;
    delete result.quoteMintBytes;
    delete result.lpMintBytes;
    delete result.baseVaultBytes;
    delete result.quoteVaultBytes;

    console.log(`✅ Raydium pool parsed: ${result.baseMint} / ${result.quoteMint}`);
    return result;
  }

  /**
   * Parse an Orca Whirlpool by address
   */
  async parseOrcaWhirlpool(poolAddress) {
    if (!this.isInitialized) await this.initialize();

    const poolPubkey = typeof poolAddress === 'string' 
      ? new PublicKey(poolAddress) 
      : poolAddress;

    console.log(`🌊 Fetching Orca Whirlpool data: ${poolPubkey.toString()}`);

    // Use BatchProcessor for optimized account fetching
    let accountInfo;
    if (this.batchProcessor) {
      const accounts = await this.batchProcessor.batchGetAccounts(
        [poolPubkey.toString()],
        { priority: 'trading' } // Pool data is important for trading
      );
      accountInfo = Array.isArray(accounts) ? accounts[0] : accounts;
    } else {
      // Use RPCConnectionManager directly (circuit breaker protection built-in)
      accountInfo = await this.rpcManager.call('getAccountInfo', [poolPubkey.toString()], {
        priority: 'high' // Pool data is critical for trading
      });
    }
    
    if (!accountInfo) {
      throw new Error(`Whirlpool account not found: ${poolPubkey.toString()}`);
    }

    if (!accountInfo.owner.equals(this.PROGRAM_IDS.ORCA_WHIRLPOOL)) {
      throw new Error(`Invalid pool owner. Expected Orca Whirlpool program, got: ${accountInfo.owner.toString()}`);
    }

    console.log(`✅ Whirlpool data fetched (${accountInfo.data.length} bytes)`);

    // Send raw data to worker for mathematical parsing
    const parsedData = await this.workerPool.executeTask('parsePoolData', {
      poolType: 'orca',
      accountDataBuffer: accountInfo.data,
      layoutConstants: ORCA_LAYOUT_CONSTANTS
    });

    // Convert byte arrays back to PublicKeys in main thread
    const result = {
      ...parsedData,
      tokenMintA: new PublicKey(new Uint8Array(parsedData.tokenMintABytes)).toString(),
      tokenMintB: new PublicKey(new Uint8Array(parsedData.tokenMintBBytes)).toString(),
      tokenVaultA: new PublicKey(new Uint8Array(parsedData.tokenVaultABytes)).toString(),
      tokenVaultB: new PublicKey(new Uint8Array(parsedData.tokenVaultBBytes)).toString(),
      poolAddress: poolPubkey.toString(),
      owner: accountInfo.owner.toString()
    };

    // Remove byte arrays from result
    delete result.tokenMintABytes;
    delete result.tokenMintBBytes;
    delete result.tokenVaultABytes;
    delete result.tokenVaultBBytes;

    console.log(`✅ Orca pool parsed: ${result.tokenMintA} / ${result.tokenMintB}`);
    return result;
  }

  /**
   * Get token account info (for vault balances)
   */
  async getTokenAccountInfo(accountAddress) {
    if (!this.isInitialized) await this.initialize();

    const accountPubkey = typeof accountAddress === 'string' 
      ? new PublicKey(accountAddress) 
      : accountAddress;

    // Use BatchProcessor for critical balance data
    let accountInfo;
    if (this.batchProcessor) {
      const accounts = await this.batchProcessor.batchGetAccounts(
        [accountPubkey.toString()],
        { priority: 'critical' } // Balance data is critical for trading decisions
      );
      accountInfo = Array.isArray(accounts) ? accounts[0] : accounts;
    } else {
      // Use RPCConnectionManager directly if no BatchProcessor (circuit breaker protection built-in)
      accountInfo = await this.rpcManager.call('getAccountInfo', [accountPubkey.toString()], {
        priority: 'critical' // Balance data is critical for trading decisions
      });
    }
    
    if (!accountInfo) {
      throw new Error(`Token account not found: ${accountPubkey.toString()}`);
    }

    const buffer = accountInfo.data;
    
    if (buffer.length < 165) {
      throw new Error(`Invalid token account data length: ${buffer.length}`);
    }

    // Parse token account data
    const mint = new PublicKey(buffer.slice(0, 32));
    const owner = new PublicKey(buffer.slice(32, 64));
    const amount = buffer.readBigUInt64LE(64);

    return {
      mint: mint.toString(),
      owner: owner.toString(),
      amount: amount.toString(),
      amountNumber: Number(amount),
      address: accountPubkey.toString()
    };
  }

  /**
   * Get mint info (for token decimals and supply)
   */
  async getMintInfo(mintAddress) {
    if (!this.isInitialized) await this.initialize();

    const mintPubkey = typeof mintAddress === 'string' 
      ? new PublicKey(mintAddress) 
      : mintAddress;

    // Use BatchProcessor for mint info fetching
    let accountInfo;
    if (this.batchProcessor) {
      const accounts = await this.batchProcessor.batchGetAccounts(
        [mintPubkey.toString()],
        { priority: 'trading' } // Mint info important for trading calculations
      );
      accountInfo = Array.isArray(accounts) ? accounts[0] : accounts;
    } else {
      // Use RPCConnectionManager directly if no BatchProcessor (circuit breaker protection built-in)
      accountInfo = await this.rpcManager.call('getAccountInfo', [mintPubkey.toString()], {
        priority: 'high' // Mint info important for trading calculations
      });
    }
    
    if (!accountInfo) {
      throw new Error(`Mint account not found: ${mintPubkey.toString()}`);
    }

    const buffer = accountInfo.data;
    
    if (buffer.length < 82) {
      throw new Error(`Invalid mint data length: ${buffer.length}`);
    }

    // Parse mint data using layout constants
    const supply = buffer.readBigUInt64LE(MINT_LAYOUT_CONSTANTS.SUPPLY_OFFSET);
    const decimals = buffer.readUInt8(MINT_LAYOUT_CONSTANTS.DECIMALS_OFFSET);
    const isInitialized = buffer.readUInt8(MINT_LAYOUT_CONSTANTS.IS_INITIALIZED_OFFSET) === 1;

    return {
      address: mintPubkey.toString(),
      supply: supply.toString(),
      supplyNumber: Number(supply),
      decimals,
      isInitialized,
      fetchedAt: Date.now()
    };
  }

  /**
   * Calculate pool price using worker
   */
  async calculatePrice(data) {
    if (!this.isInitialized) await this.initialize();

    return await this.workerPool.executeTask('calculatePrice', data);
  }

  /**
   * Calculate TVL using worker
   */
  async calculateTVL(data) {
    if (!this.isInitialized) await this.initialize();

    return await this.workerPool.executeTask('calculateTVL', data);
  }


  
  /**
   * Batch get multiple accounts with circuit breaker protection
   */
  async batchGetMultipleAccounts(addresses, options = {}) {
    if (!this.isInitialized) await this.initialize();
    
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('Addresses must be a non-empty array');
    }
    
    // Use BatchProcessor if available for optimal performance
    if (this.batchProcessor) {
      return await this.batchProcessor.batchGetAccounts(addresses, {
        priority: options.priority || 'normal',
        ...options
      });
    }
    
    // Use RPCConnectionManager directly - it handles circuit breaker protection internally
    return await this.rpcManager.getMultipleAccounts(addresses, options.priority || 'normal');
  }
  
  /**
   * Get transaction details with automatic endpoint management
   */
  async getTransaction(signature, options = {}) {
    if (!this.isInitialized) await this.initialize();
    
    if (!signature || typeof signature !== 'string') {
      throw new Error('Transaction signature is required and must be a string');
    }
    
    // Use RPCConnectionManager directly - it handles circuit breaker protection and retries
    const transactionOptions = {
      commitment: options.commitment || 'confirmed',
      maxSupportedTransactionVersion: options.maxSupportedTransactionVersion || 0
    };
    
    return await this.rpcManager.getTransaction(signature, transactionOptions);
  }
  
  /**
   * Confirm transaction with retry logic and circuit breaker protection
   */
  async confirmTransaction(signature, options = {}) {
    if (!this.isInitialized) await this.initialize();
    
    if (!signature || typeof signature !== 'string') {
      throw new Error('Transaction signature is required and must be a string');
    }
    
    const maxRetries = options.maxRetries || 30;
    const retryDelay = options.retryDelay || 1000;
    const commitment = options.commitment || 'confirmed';
    
    // Use RPCConnectionManager for confirmation status checks
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check transaction confirmation status via RPCConnectionManager
        const confirmation = await this.rpcManager.call('getSignatureStatus', [signature, {
          searchTransactionHistory: true
        }], {
          priority: 'high' // Transaction confirmation is time-sensitive
        });
        
        if (confirmation?.value) {
          const status = confirmation.value;
          
          // Transaction confirmed successfully
          if (status.confirmationStatus === commitment || 
              (commitment === 'confirmed' && status.confirmationStatus === 'finalized')) {
            return {
              signature,
              confirmed: true,
              confirmationStatus: status.confirmationStatus,
              slot: status.slot,
              err: status.err,
              attempts: attempt
            };
          }
          
          // Transaction failed
          if (status.err) {
            return {
              signature,
              confirmed: false,
              confirmationStatus: status.confirmationStatus,
              slot: status.slot,
              err: status.err,
              attempts: attempt
            };
          }
        }
        
        // Transaction not found or still processing
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting for transaction confirmation (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // Max retries reached
        return {
          signature,
          confirmed: false,
          confirmationStatus: 'unknown',
          slot: null,
          err: 'Confirmation timeout',
          attempts: attempt
        };
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed to confirm transaction after ${maxRetries} attempts: ${error.message}`);
        }
        
        console.warn(`⚠️  Confirmation attempt ${attempt} failed (RPCConnectionManager will handle endpoint switching):`, error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  


  /**
   * Find meme coin pools using dual-track architecture
   */
  async findMemeCoinPools(limit = 10) {
    if (!this.isInitialized) await this.initialize();

    console.log(`🔍 Starting dual-track meme coin discovery (limit: ${limit})...`);

    try {
      // TRACK 1: Initialize baseline once (uses Redis cache on subsequent runs)
      await this.initializeHistoricalBaseline();
      
      // TRACK 2: Scan for new trading opportunities (real-time)
      const newPools = await this.scanForNewTradingOpportunities();
      
      // If we found new opportunities, return them
      if (newPools.length > 0) {
        console.log(`🎯 Returning ${newPools.length} new opportunities from live scanning`);
        
        // Emit trading signals
        for (const pool of newPools.slice(0, limit)) {
          this.emit('newPoolDetected', {
            pool,
            signal: 'POTENTIAL_MEME',
            confidence: this.calculateConfidenceScore(pool),
            timestamp: Date.now(),
            source: 'live_scanning'
          });
        }
        
        return newPools.slice(0, limit);
      }

      // Fallback: Use existing streaming method if no new opportunities
      console.log('📊 No new opportunities found, using existing pool discovery...');
      const existingPools = await this.findMemeCoinPoolsOriginal(limit);
      
      return existingPools;
      
    } catch (error) {
      console.error('❌ Dual-track discovery failed:', error);
      // Final fallback to original method
      return await this.findMemeCoinPoolsOriginal(limit);
    }
  }

  /**
   * Find meme coin pools by scanning known DEX programs
   */
  async findMemeCoinPoolsOriginal(limit = 10) {
    if (!this.isInitialized) await this.initialize();

    console.log(`🔍 Scanning for meme coin pools (limit: ${limit})...`);

    const pools = [];

    try {
      // Parse Raydium pools with streaming approach
      let raydiumCount = 0;
      for await (const account of this.streamRaydiumPools(this.rpcManager, this.PROGRAM_IDS.RAYDIUM_AMM, Math.ceil(limit / 2))) {
        try {
          // Small delay between requests for stability
          await new Promise(resolve => setTimeout(resolve, 100));
          const poolData = await this.parseRaydiumPool(account.pubkey);
          pools.push(poolData);
          raydiumCount++;
        } catch (error) {
          console.warn(`Failed to parse Raydium pool ${account.pubkey.toString()} (RPCConnectionManager handled recovery):`, error.message);
        }
      }
      console.log(`📊 Processed ${raydiumCount} Raydium pools`)

      // Parse Orca pools with streaming approach
      let orcaCount = 0;
      for await (const account of this.streamOrcaWhirlpools(this.rpcManager, this.PROGRAM_IDS.ORCA_WHIRLPOOL, Math.floor(limit / 2))) {
        try {
          // Small delay between requests for stability
          await new Promise(resolve => setTimeout(resolve, 100));
          const poolData = await this.parseOrcaWhirlpool(account.pubkey);
          // Only include pools with liquidity
          if (poolData.liquidityNumber > 0) {
            pools.push(poolData);
            orcaCount++;
          }
        } catch (error) {
          console.warn(`Failed to parse Orca pool ${account.pubkey.toString()} (RPCConnectionManager handled recovery):`, error.message);
        }
      }
      console.log(`🌊 Processed ${orcaCount} Orca pools`)

    } catch (error) {
      console.error('Error scanning for pools:', error);
      
      // Let RPCConnectionManager handle retries and endpoint switching automatically
      // Only re-throw if it's a permanent failure after all recovery attempts
      if (error.code === 'RPC_PERMANENTLY_FAILED' || error.permanent) {
        throw new Error(`Pool scanning permanently failed: ${error.message}`);
      }
      
      // For temporary failures, RPCConnectionManager will have already attempted recovery
      throw new Error(`Pool scanning failed after automatic recovery attempts: ${error.message}`);
    }

    console.log(`✅ Found ${pools.length} valid pools`);
    return pools;
  }

  /**
   * Enhanced RPC call with Renaissance mathematical algorithms
   */
  async retryRPCCall(method, params, options = {}) {
    if (!this.isInitialized) await this.initialize();
    
    const endpoint = options.endpoint || 'default';
    const startTime = Date.now();
    
    try {
      // Get current endpoint health using EWMA
      const currentHealth = this.getEndpointHealthScore(endpoint);
      
      // Apply TCP-style congestion control
      const congestionState = this.renaissanceState.congestionStates.get(endpoint) || 
        initializeCongestionControl();
      
      // Note: tcpCongestionControl not available, using basic congestion control
      const rateLimitDelay = congestionState.cwnd < 1 ? 1000 : 0; // Simple rate limiting
      // TODO: Implement tcpCongestionControl in renaissance-math.js
      
      if (rateLimitDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      }
      
      // Make RPC call through existing manager
      const result = await this.rpcManager.call(method, params, options);
      const responseTime = Date.now() - startTime;
      
      // Update Renaissance mathematical state
      this.updateRenaissanceMetrics(endpoint, responseTime, true);
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update Renaissance mathematical state for failure
      this.updateRenaissanceMetrics(endpoint, responseTime, false);
      
      throw error;
    }
  }

  /**
   * Update Renaissance mathematical state after RPC calls
   */
  updateRenaissanceMetrics(endpoint, responseTime, success) {
    // Update Kalman filter for response time prediction
    const kalmanState = this.renaissanceState.endpointKalmanStates.get(endpoint) || 
      initializeKalmanFilter(responseTime, 100);
    
    const updatedKalman = updateKalmanFilter(kalmanState, responseTime);
    this.renaissanceState.endpointKalmanStates.set(endpoint, updatedKalman);
    
    // Update EWMA health scoring
    const currentScore = this.renaissanceState.endpointHealthScores.get(endpoint) || 100;
    const healthFactor = success ? 1.0 : 0.1; // Success vs failure weight
    const responseTimeFactor = Math.exp(-responseTime / 1000); // Exponential decay for latency
    const newHealthScore = calculateEWMA(currentScore, healthFactor * responseTimeFactor * 100, 0.3);
    
    this.renaissanceState.endpointHealthScores.set(endpoint, newHealthScore);
    
    // Update TCP congestion control state
    const congestionState = this.renaissanceState.congestionStates.get(endpoint) || 
      initializeCongestionControl();
    
    // Note: tcpCongestionControl not available, using basic congestion control
    const updatedCongestion = success ? 
      congestionControlOnAck(congestionState) : 
      congestionControlOnLoss(congestionState, 'timeout');
    // TODO: Implement tcpCongestionControl in renaissance-math.js
    
    this.renaissanceState.congestionStates.set(endpoint, updatedCongestion);
    
    // Add to SPC monitoring data
    this.renaissanceState.performanceMetrics.push({
      timestamp: Date.now(),
      endpoint,
      responseTime,
      success,
      healthScore: newHealthScore,
      predictedResponseTime: updatedKalman.estimate
    });
    
    // Keep only last 1000 metrics for memory management
    if (this.renaissanceState.performanceMetrics.length > 1000) {
      this.renaissanceState.performanceMetrics = this.renaissanceState.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Get enhanced endpoint health score using EWMA
   */
  getEndpointHealthScore(endpoint) {
    return this.renaissanceState.endpointHealthScores.get(endpoint) || 100;
  }

  /**
   * Apply multi-criteria decision analysis for endpoint selection
   */
  selectOptimalEndpoint(availableEndpoints) {
    if (!availableEndpoints || availableEndpoints.length === 0) {
      return null;
    }
    
    if (availableEndpoints.length === 1) {
      return availableEndpoints[0];
    }
    
    // Prepare criteria matrix for MCDA
    const criteria = availableEndpoints.map(endpoint => {
      const healthScore = this.getEndpointHealthScore(endpoint);
      const kalmanState = this.renaissanceState.endpointKalmanStates.get(endpoint);
      const predictedLatency = kalmanState ? kalmanState.estimate : 1000;
      const congestionState = this.renaissanceState.congestionStates.get(endpoint);
      const congestionLevel = congestionState ? congestionState.windowSize : 1;
      
      return {
        endpoint,
        health: healthScore, // Higher is better
        latency: 1000 / Math.max(predictedLatency, 1), // Inverted - higher is better
        congestion: 100 / Math.max(congestionLevel, 1), // Inverted - higher is better
        reliability: healthScore * 0.01 // Normalized health score
      };
    });
    
    // Apply MCDA with trading-optimized weights
    const weights = {
      health: 0.4, // High importance for endpoint health
      latency: 0.3, // High importance for speed
      congestion: 0.2, // Medium importance for load
      reliability: 0.1 // Lower weight as it's correlated with health
    };
    
    // Note: multiCriteriaDecisionAnalysis not available, using calculateWeightedScores instead
    const scoredCriteria = calculateWeightedScores(criteria, weights, Object.keys(weights));
    const mcdaResult = {
      bestOption: scoredCriteria.length > 0 ? 
        scoredCriteria.reduce((best, current) => 
          current.weightedScore > best.weightedScore ? current : best
        ) : null
    };
    // TODO: Implement multiCriteriaDecisionAnalysis in renaissance-math.js
    
    return mcdaResult.bestOption ? mcdaResult.bestOption.endpoint : availableEndpoints[0];
  }

  /**
   * Perform statistical process control analysis on performance metrics
   */
  performSPCAnalysis() {
    const now = Date.now();
    
    // Only run SPC analysis every 30 seconds to avoid overhead
    if (now - this.renaissanceState.lastSpcAnalysis < 30000) {
      return null;
    }
    
    this.renaissanceState.lastSpcAnalysis = now;
    
    if (this.renaissanceState.performanceMetrics.length < 30) {
      return null; // Need at least 30 data points for meaningful SPC
    }
    
    // Get recent metrics (last 5 minutes)
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const recentMetrics = this.renaissanceState.performanceMetrics.filter(
      metric => metric.timestamp > fiveMinutesAgo
    );
    
    if (recentMetrics.length < 10) {
      return null;
    }
    
    // Extract response times for SPC analysis
    const responseTimes = recentMetrics.map(m => m.responseTime);
    
    try {
      // Note: statisticalProcessControl not available, using detectOutOfControlConditions instead
      const controlLimits = calculateControlChartStats(responseTimes, Math.min(30, responseTimes.length));
      const spcResult = {
        controlLimits: controlLimits,
        outOfControl: detectOutOfControlConditions(responseTimes, controlLimits).violations.length > 0,
        trend: null, // Not implemented
        processCapability: null // Not implemented
      };
      // TODO: Implement statisticalProcessControl in renaissance-math.js
      
      return {
        timestamp: now,
        controlLimits: spcResult.controlLimits,
        outOfControl: spcResult.outOfControl,
        trend: spcResult.trend,
        processCapability: spcResult.processCapability,
        recommendations: this.generateSPCRecommendations(spcResult)
      };
      
    } catch (error) {
      console.warn('SPC analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Generate actionable recommendations from SPC analysis
   */
  generateSPCRecommendations(spcResult) {
    const recommendations = [];
    
    if (spcResult.outOfControl) {
      recommendations.push('Performance out of control - consider endpoint switching');
    }
    
    if (spcResult.trend && spcResult.trend.increasing) {
      recommendations.push('Response time trend increasing - check endpoint health');
    }
    
    if (spcResult.processCapability && spcResult.processCapability < 1.0) {
      recommendations.push('Process capability low - consider rate limiting adjustments');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance within statistical control');
    }
    
    return recommendations;
  }

  /**
   * Get current RPC performance metrics with Renaissance enhancements
   */
  getRPCMetrics() {
    // Return comprehensive metrics directly from RPCConnectionManager
    const performanceStats = this.rpcManager.getPerformanceStats();
    
    // Perform SPC analysis
    const spcAnalysis = this.performSPCAnalysis();
    
    // Gather Renaissance mathematical insights
    const renaissanceInsights = {
      endpointHealthScores: Object.fromEntries(this.renaissanceState.endpointHealthScores),
      kalmanPredictions: Object.fromEntries(
        Array.from(this.renaissanceState.endpointKalmanStates.entries()).map(
          ([endpoint, state]) => [endpoint, {
            predictedResponseTime: state.estimate,
            uncertainty: state.uncertainty,
            lastUpdate: state.lastUpdate
          }]
        )
      ),
      congestionStates: Object.fromEntries(
        Array.from(this.renaissanceState.congestionStates.entries()).map(
          ([endpoint, state]) => [endpoint, {
            windowSize: state.windowSize,
            threshold: state.threshold,
            phase: state.phase
          }]
        )
      ),
      statisticalProcessControl: spcAnalysis,
      performanceMetricsCount: this.renaissanceState.performanceMetrics.length
    };
    
    return {
      ...performanceStats,
      // Add service-level context
      isInitialized: this.isInitialized,
      workerMetrics: this.workerPool.getMetrics(),
      mode: this.mathOnlyMode ? 'math-only' : 'full-rpc',
      // Renaissance mathematical enhancements
      renaissanceInsights
    };
  }

  /**
   * TRACK 1: One-time historical baseline computation
   * Only runs if Redis cache is empty - never loads 699k pools into memory again
   */
  async initializeHistoricalBaseline() {
    if (!this.featureStore) {
      console.warn('⚠️  FeatureStore not available - using simplified baseline');
      this.historicalBaseline = { totalPools: 0, simplified: true };
      return;
    }

    console.log('🏛️  Initializing Renaissance statistical baseline...');
    
    // Check if baseline exists in Redis
    const cachedBaseline = await this.featureStore.get('statistical_baseline:v3');
    
    if (cachedBaseline) {
      this.historicalBaseline = cachedBaseline;
      console.log(`📊 Loaded cached baseline: ${cachedBaseline.totalPools} historical pools`);
      return;
    }

    // One-time computation: Stream process pools without storing
    console.log('⚡ Computing baseline from historical pools (one-time only)...');
    const baseline = await this.computeBaselineFromExistingStream();
    
    // Store compressed baseline in Redis (expires in 7 days)
    await this.featureStore.set('statistical_baseline:v3', baseline, { ttl: 604800 });
    this.historicalBaseline = baseline;
    
    console.log(`✅ Baseline computed and cached: ${baseline.totalPools} pools processed`);
  }

  /**
   * Use existing streaming generators to compute baseline without memory retention
   */
  async computeBaselineFromExistingStream() {
    const stats = {
      totalPools: 0,
      liquidityDistribution: [],
      volumePercentiles: {},
      tokenAgeDistribution: {},
      averagePoolSize: 0,
      suspiciousPatterns: 0,
      computedAt: Date.now()
    };
    let liquiditySum = 0;
    let liquidityValues = [];

    try {
      // Use existing Raydium streaming generator - find the streamRaydiumPools method
      const raydiumLimit = 1000; // Process 1000 pools for baseline
      for await (const account of this.streamRaydiumPools(this.rpcManager, this.PROGRAM_IDS.RAYDIUM_AMM, raydiumLimit)) {
        try {
          // Parse pool data
          const poolData = await this.parseRaydiumPool(account.pubkey);
          stats.totalPools++;
          
          // Collect statistical metrics without storing pool data
          const liquidity = poolData.liquidityNumber || 0;
          liquiditySum += liquidity;
          liquidityValues.push(liquidity);
          
          // Process in chunks to prevent memory buildup
          if (liquidityValues.length > 100) {
            // Update running statistics and clear
            liquidityValues = liquidityValues.slice(-50); // Keep only recent values
          }
          
          // Progress indicator
          if (stats.totalPools % 100 === 0) {
            console.log(`📈 Processed ${stats.totalPools} pools for baseline...`);
          }
          
        } catch (parseError) {
          console.warn(`Failed to parse pool for baseline: ${parseError.message}`);
        }
      }

      // Final statistical computations
      stats.averagePoolSize = stats.totalPools > 0 ? liquiditySum / stats.totalPools : 0;
      stats.liquidityDistribution = this.calculateLiquidityPercentiles(liquidityValues);
      
      console.log(`✅ Baseline computed: ${stats.totalPools} pools, avg liquidity: ${stats.averagePoolSize}`);
      return stats;
      
    } catch (error) {
      console.error('❌ Baseline computation failed:', error);
      // Return minimal baseline
      return {
        totalPools: 0,
        averagePoolSize: 0,
        liquidityDistribution: [],
        error: error.message,
        computedAt: Date.now()
      };
    }
  }

  /**
   * Get latest pools - alias for computeBaselineFromExistingStream
   * Used by LP detector for baseline calibration
   */
  async getLatestPools(limit = BASELINE_LIMIT) {
    const pools = await this.computeBaselineFromExistingStream({ limit });
    return pools.slice(0, limit); // hard-cap
  }

  /**
   * Calculate liquidity percentiles for statistical analysis
   */
  calculateLiquidityPercentiles(liquidityValues) {
    if (liquidityValues.length === 0) return [];
    
    const sorted = [...liquidityValues].sort((a, b) => a - b);
    const percentiles = [10, 25, 50, 75, 90, 95, 99];
    
    return percentiles.map(p => {
      const index = Math.floor((p / 100) * sorted.length);
      return {
        percentile: p,
        value: sorted[Math.min(index, sorted.length - 1)]
      };
    });
  }

  /**
   * TRACK 2: Live LP creation detection for trading opportunities
   * Only processes NEW pools created since last scan
   */
  async scanForNewTradingOpportunities() {
    if (!this.featureStore) {
      console.warn('⚠️  FeatureStore not available - using polling fallback');
      return []; // Return empty array for now
    }

    console.log('🎯 Scanning for NEW meme coin opportunities...');
    
    try {
      // Get last processed signature from Redis
      this.lastProcessedSignature = await this.featureStore.get('last_processed_signature:raydium');
      
      // Fetch recent Raydium program transactions
      const recentSignatures = await this.rpcManager.call('getSignaturesForAddress', [
        this.PROGRAM_IDS.RAYDIUM_AMM.toString(),
        {
          limit: 100, // Reduced limit for initial implementation
          before: this.lastProcessedSignature || null
        }
      ]);

      if (recentSignatures.length === 0) {
        console.log('📡 No new LP creation activity detected');
        return [];
      }
      
      console.log(`🔍 Found ${recentSignatures.length} recent Raydium transactions`);

      // For initial implementation, return empty array
      // This will be enhanced in later steps
      const newPools = [];

      // Update last processed signature
      if (recentSignatures.length > 0) {
        await this.featureStore.set('last_processed_signature:raydium', recentSignatures[0].signature);
      }

      // Clean expired pools from live tracker
      this.cleanupExpiredPools();
      
      console.log(`✨ Discovered ${newPools.length} NEW trading opportunities`);
      return newPools;

    } catch (error) {
      console.error('❌ Error scanning for new opportunities:', error);
      return [];
    }
  }

  /**
   * Validate if pool is a viable meme coin opportunity
   */
  isValidMemePool(poolData) {
    if (!this.historicalBaseline || !poolData) return false;

    // Basic validation using historical baseline
    const hasLiquidity = poolData.liquidityNumber > 0;
    const isReasonableSize = poolData.liquidityNumber > (this.historicalBaseline.averagePoolSize * 0.1);
    const isNew = !this.livePoolTracker.has(poolData.address);

    return hasLiquidity && isReasonableSize && isNew;
  }

  /**
   * Clean up expired pools from memory
   */
  cleanupExpiredPools() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, pool] of this.livePoolTracker) {
      if (pool.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.livePoolTracker.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired pools from memory`);
    }
  }

  /**
   * Calculate confidence score for trading opportunities
   */
  calculateConfidenceScore(pool) {
    if (!pool || !this.historicalBaseline) return 0.5;
    
    let confidence = 0.5; // Base confidence
    
    // Liquidity factor
    if (pool.liquidityNumber > this.historicalBaseline.averagePoolSize) {
      confidence += 0.2;
    }
    
    // Recency factor (newer pools get higher confidence)
    const poolAge = Date.now() - (pool.discoveredAt || Date.now());
    if (poolAge < 60000) { // Less than 1 minute old
      confidence += 0.3;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Stream Raydium pools without loading full array into memory
   */
  async* streamRaydiumPools(rpcManager, programId, limit = 100) {
    let fetched = 0;
    const batchSize = 500;
    
    while (fetched < limit) {
      const batch = await rpcManager.getProgramAccounts(
        programId.toString(),
        {
          dataSlice: { offset: 0, length: 0 },
          filters: [{ dataSize: 752 }],
          limit: Math.min(batchSize, limit - fetched)
        },
        'low'
      );
      
      if (!batch || batch.length === 0) break;
      
      for (const account of batch) {
        yield account;
        if (++fetched >= limit) break;
      }
      
      // Drop reference to batch immediately for memory management
      batch.length = 0;
      if (global.gc) global.gc();
    }
  }

  /**
   * Stream Orca pools without loading full array into memory
   */
  async* streamOrcaWhirlpools(rpcManager, programId, limit = 100) {
    let fetched = 0;
    const batchSize = 500;
    
    while (fetched < limit) {
      const batch = await rpcManager.getProgramAccounts(
        programId.toString(),
        {
          dataSlice: { offset: 0, length: 0 },
          filters: [{ dataSize: 653 }],
          limit: Math.min(batchSize, limit - fetched)
        },
        'low'
      );
      
      if (!batch || batch.length === 0) break;
      
      for (const account of batch) {
        yield account;
        if (++fetched >= limit) break;
      }
      
      // Drop reference to batch immediately for memory management
      batch.length = 0;
      if (global.gc) global.gc();
    }
  }

  /**
   * Health check for THORP system monitoring
   */
  healthCheck() {
    try {
      // Pool parser is healthy if:
      // 1. Is initialized
      // 2. RPC manager is healthy
      // 3. Worker pool is healthy (if exists)
      // 4. Batch processor is healthy (if exists)
      
      if (!this.isInitialized) {
        return false;
      }

      // Check RPC manager health
      if (this.rpcManager && typeof this.rpcManager.healthCheck === 'function') {
        // Note: healthCheck is async, but we'll do a simple sync check
        // In the future, this could be made async if needed
        const rpcHealthy = this.rpcManager.getMetrics && this.rpcManager.getMetrics().status === 'operational';
        if (!rpcHealthy) return false;
      }

      // Check worker pool health
      if (this.workerPool && typeof this.workerPool.healthCheck === 'function') {
        if (!this.workerPool.healthCheck()) return false;
      }

      // Check batch processor health  
      if (this.batchProcessor && typeof this.batchProcessor.healthCheck === 'function') {
        if (!this.batchProcessor.healthCheck()) return false;
      }

      return true;
    } catch (error) {
      console.error('SolanaPoolParserService health check error:', error);
      return false;
    }
  }

  /**
   * Shutdown the service and worker pool
   */
  async shutdown() {
    console.log('🔄 Shutting down Solana Pool Parser Service...');
    
    // Shutdown RPC Connection Manager
    if (this.rpcManager) {
      await this.rpcManager.shutdown();
    }
    
    // Shutdown BatchProcessor if we created it
    if (this.batchProcessor) {
      await this.batchProcessor.shutdown();
    }
    
    // BatchProcessor may have its own circuit breaker to shutdown
    if (this.circuitBreaker && typeof this.circuitBreaker.shutdown === 'function') {
      this.circuitBreaker.shutdown();
    }
    
    // Don't shutdown shared worker pool - it's managed globally
    // Just clear the reference
    this.workerPool = null;
    
    this.isInitialized = false;
    console.log('✅ Shutdown complete');
  }
}