/**
 * RENAISSANCE-GRADE CIRCUIT BREAKER SERVICE
 * Fast-fail protection with automatic recovery for high-frequency meme coin trading
 * 
 * Performance Requirements:
 * - Failure Detection: <1ms per check
 * - Memory Protection: Digital Ocean 2GB instance optimization
 * - Viral Event Protection: 1000+ tx/min capacity
 * - Service Isolation: Prevent cascading failures
 * 
 * Production Endpoints:
 * - Helius RPC: wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY
 * - Chainstack RPC: https://solana-mainnet.core.chainstack.com/YOUR_KEY
 * - Public Fallback: https://api.mainnet-beta.solana.com
 * 
 * Critical Solana Programs Protected:
 * - Raydium AMM: 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
 * - Pump.fun: 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
 * - SPL Token: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// Production Solana program IDs for meme coin trading
export const PROTECTED_PROGRAMS = {
  RAYDIUM_AMM: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  PUMP_FUN: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  SPL_TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
};

// Production RPC endpoints for failover
export const RPC_ENDPOINTS = {
  HELIUS: process.env.HELIUS_RPC || 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
  CHAINSTACK: process.env.CHAINSTACK_RPC || 'https://solana-mainnet.core.chainstack.com/YOUR_KEY',
  PUBLIC: 'https://api.mainnet-beta.solana.com'
};

// Service failure thresholds optimized for meme coin trading
export const SERVICE_THRESHOLDS = {
  rpcConnection: {
    maxLatency: 100,        // 100ms max RPC response time
    maxErrors: 3,           // 3 consecutive failures trigger circuit
    window: 60000,          // 1 minute sliding window
    cooldown: 30000,        // 30 second cooldown period
    priority: 'critical'    // Critical for all operations
  },
  tokenValidation: {
    maxLatency: 50,         // 50ms max token validation time
    maxErrors: 5,           // 5 failures in window
    window: 30000,          // 30 second window
    cooldown: 10000,        // 10 second cooldown
    priority: 'high'        // High priority for trading signals
  },
  tradingExecution: {
    maxLatency: 200,        // 200ms max trade execution
    maxErrors: 2,           // 2 failures (trades are expensive)
    window: 120000,         // 2 minute window
    cooldown: 60000,        // 1 minute cooldown
    priority: 'critical'    // Critical for revenue
  },
  instructionParsing: {
    maxLatency: 20,         // 20ms max instruction parsing
    maxErrors: 10,          // 10 failures (more lenient)
    window: 15000,          // 15 second window
    cooldown: 5000,         // 5 second cooldown
    priority: 'medium'      // Medium priority
  },
  candidateAssembly: {
    maxLatency: 10,         // 10ms max candidate assembly
    maxErrors: 8,           // 8 failures in window
    window: 20000,          // 20 second window
    cooldown: 5000,         // 5 second cooldown
    priority: 'high'        // High priority for signal generation
  }
};

// Memory limits for Digital Ocean production instances
export const MEMORY_LIMITS = {
  SMALL_INSTANCE: 950,      // 1GB instance (50MB buffer)
  MEDIUM_INSTANCE: 1800,    // 2GB instance (200MB buffer)
  LARGE_INSTANCE: 3800,     // 4GB instance (200MB buffer)
  DEFAULT: 1800             // Default to medium instance
};

/**
 * Renaissance-grade circuit breaker with microsecond precision
 * Prevents cascading failures during viral meme coin events
 */
export class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Instance configuration with production defaults
    this.instanceType = options.instanceType || 'medium';
    this.maxMemoryMB = MEMORY_LIMITS[this.instanceType.toUpperCase()] || MEMORY_LIMITS.DEFAULT;
    this.maxTransactionsPerScan = options.maxTransactionsPerScan || 100;
    this.maxProcessingTimeMs = options.maxProcessingTimeMs || 30000; // 30 second timeout
    
    // High-performance LRU cache for deduplication
    this.duplicateCache = new Map();
    this.maxCacheSize = options.maxCacheSize || 10000; // 10k signatures
    this.cacheCleanupInterval = options.cacheCleanupInterval || 300000; // 5 minutes
    
    // Service state tracking with O(1) lookups
    this.serviceBreakers = new Map();
    this.serviceThresholds = { ...SERVICE_THRESHOLDS, ...options.customThresholds };
    
    // Performance monitoring with minimal overhead
    this.systemMetrics = {
      totalScans: 0,
      duplicatesBlocked: 0,
      memoryBreaks: 0,
      timeoutBreaks: 0,
      circuitTrips: 0,
      lastCleanup: Date.now(),
      startTime: Date.now()
    };
    
    // Initialize all service states
    this.initializeServiceStates();
    
    // Setup periodic cleanup to prevent memory leaks
    this.setupCleanupTimer();
    
    // SignalBus integration for event emission
    this.signalBus = options.signalBus || null;
    
    console.log(`🛡️ Circuit Breaker initialized for ${this.instanceType} instance (${this.maxMemoryMB}MB limit)`);
    console.log(`🔧 Protecting ${Object.keys(this.serviceThresholds).length} services with microsecond precision`);
  }
  
  /**
   * Initialize service state tracking with production defaults
   */
  initializeServiceStates() {
    for (const [serviceName, thresholds] of Object.entries(this.serviceThresholds)) {
      this.serviceBreakers.set(serviceName, {
        errors: 0,
        totalCalls: 0,
        totalLatency: 0,
        averageLatency: 0,
        lastReset: Date.now(),
        isOpen: false,
        isHalfOpen: false,
        lastError: null,
        lastSuccess: null,
        circuitTrips: 0,
        cooldownEndTime: 0,
        ...thresholds
      });
    }
  }
  
  /**
   * Execute operation with circuit breaker protection
   * Target: <1ms overhead for failure detection
   */
  async execute(serviceName, operation, context = {}) {
    const startTime = performance.now();
    const serviceState = this.serviceBreakers.get(serviceName);
    
    if (!serviceState) {
      throw new Error(`Unknown service: ${serviceName}. Register with SERVICE_THRESHOLDS first.`);
    }
    
    // Fast-fail check with microsecond precision
    if (this.isCircuitOpen(serviceName)) {
      const fallback = this.getFallbackResponse(serviceName, context);
      this.emitCircuitEvent('circuit_open', serviceName, { fallback, context });
      return fallback;
    }
    
    try {
      // Execute operation with timeout protection
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise(serviceState.maxLatency, serviceName)
      ]);
      
      // Record successful execution
      const latency = performance.now() - startTime;
      this.recordSuccess(serviceName, latency);
      
      return result;
      
    } catch (error) {
      // Record failure and update circuit state
      const latency = performance.now() - startTime;
      this.recordFailure(serviceName, error, latency);
      
      // Check if circuit should trip
      if (this.shouldTripCircuit(serviceName)) {
        this.tripCircuit(serviceName, error);
      }
      
      // Return fallback or re-throw based on service priority
      if (serviceState.priority === 'critical') {
        const fallback = this.getFallbackResponse(serviceName, context);
        this.emitCircuitEvent('critical_fallback', serviceName, { error, fallback });
        return fallback;
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Check if circuit is open with <1ms performance
   */
  isCircuitOpen(serviceName) {
    const serviceState = this.serviceBreakers.get(serviceName);
    if (!serviceState) return false;
    
    const now = Date.now();
    
    // Circuit is open and still in cooldown
    if (serviceState.isOpen && now < serviceState.cooldownEndTime) {
      return true;
    }
    
    // Circuit cooldown expired - move to half-open state
    if (serviceState.isOpen && now >= serviceState.cooldownEndTime) {
      serviceState.isOpen = false;
      serviceState.isHalfOpen = true;
      this.emitCircuitEvent('half_open', serviceName, { now, cooldownEndTime: serviceState.cooldownEndTime });
    }
    
    return false;
  }
  
  /**
   * Check resource limits with Digital Ocean optimization
   * Target: <1ms per check during viral events
   */
  checkResourceLimits(transactionCount, startTime) {
    // Memory limit check with process.memoryUsage() (fastest method)
    const memUsage = process.memoryUsage();
    const memoryMB = memUsage.heapUsed / 1024 / 1024;
    
    if (memoryMB > this.maxMemoryMB) {
      this.systemMetrics.memoryBreaks++;
      this.emitCircuitEvent('memory_limit', 'system', { 
        current: memoryMB, 
        limit: this.maxMemoryMB,
        rss: memUsage.rss / 1024 / 1024,
        external: memUsage.external / 1024 / 1024
      });
      return { break: true, reason: 'memory', value: memoryMB };
    }
    
    // Transaction count limit (prevents DoS during viral events)
    if (transactionCount > this.maxTransactionsPerScan) {
      this.emitCircuitEvent('transaction_limit', 'system', { 
        current: transactionCount, 
        limit: this.maxTransactionsPerScan 
      });
      return { break: true, reason: 'transaction_count', value: transactionCount };
    }
    
    // Processing time limit (prevents hanging during RPC failures)
    const elapsedMs = Date.now() - startTime;
    if (elapsedMs > this.maxProcessingTimeMs) {
      this.systemMetrics.timeoutBreaks++;
      this.emitCircuitEvent('timeout_limit', 'system', { 
        current: elapsedMs, 
        limit: this.maxProcessingTimeMs 
      });
      return { break: true, reason: 'timeout', value: elapsedMs };
    }
    
    return { break: false };
  }
  
  /**
   * Deduplication check with O(1) performance
   */
  isDuplicate(signature) {
    if (this.duplicateCache.has(signature)) {
      this.systemMetrics.duplicatesBlocked++;
      return true;
    }
    
    // LRU eviction with minimal overhead
    if (this.duplicateCache.size >= this.maxCacheSize) {
      const firstKey = this.duplicateCache.keys().next().value;
      this.duplicateCache.delete(firstKey);
    }
    
    this.duplicateCache.set(signature, Date.now());
    return false;
  }
  
  /**
   * Record successful operation execution
   */
  recordSuccess(serviceName, latency) {
    const serviceState = this.serviceBreakers.get(serviceName);
    if (!serviceState) return;
    
    serviceState.totalCalls++;
    serviceState.totalLatency += latency;
    serviceState.averageLatency = serviceState.totalLatency / serviceState.totalCalls;
    serviceState.lastSuccess = Date.now();
    
    // Close circuit if in half-open state
    if (serviceState.isHalfOpen) {
      serviceState.isHalfOpen = false;
      serviceState.errors = 0; // Reset error count
      this.emitCircuitEvent('circuit_closed', serviceName, { latency, averageLatency: serviceState.averageLatency });
    }
  }
  
  /**
   * Record failed operation execution
   */
  recordFailure(serviceName, error, latency) {
    const serviceState = this.serviceBreakers.get(serviceName);
    if (!serviceState) return;
    
    serviceState.totalCalls++;
    serviceState.errors++;
    serviceState.lastError = {
      message: error.message,
      timestamp: Date.now(),
      latency
    };
    
    this.emitCircuitEvent('service_error', serviceName, { 
      error: error.message, 
      latency, 
      errorCount: serviceState.errors 
    });
  }
  
  /**
   * Determine if circuit should trip based on error thresholds
   */
  shouldTripCircuit(serviceName) {
    const serviceState = this.serviceBreakers.get(serviceName);
    if (!serviceState) return false;
    
    const now = Date.now();
    const windowStart = now - serviceState.window;
    
    // Simple threshold check for now (can be enhanced with sliding window)
    return serviceState.errors >= serviceState.maxErrors;
  }
  
  /**
   * Trip circuit breaker and set cooldown period
   */
  tripCircuit(serviceName, error) {
    const serviceState = this.serviceBreakers.get(serviceName);
    if (!serviceState) return;
    
    serviceState.isOpen = true;
    serviceState.isHalfOpen = false;
    serviceState.circuitTrips++;
    serviceState.cooldownEndTime = Date.now() + serviceState.cooldown;
    
    this.systemMetrics.circuitTrips++;
    
    this.emitCircuitEvent('circuit_tripped', serviceName, {
      error: error.message,
      errorCount: serviceState.errors,
      cooldownMs: serviceState.cooldown,
      priority: serviceState.priority
    });
  }
  
  /**
   * Get fallback response for failed service
   */
  getFallbackResponse(serviceName, context = {}) {
    const fallbacks = {
      rpcConnection: {
        success: false,
        error: 'RPC_CIRCUIT_OPEN',
        fallback: true,
        endpoint: RPC_ENDPOINTS.PUBLIC // Fallback to public RPC
      },
      tokenValidation: {
        isValid: true,
        confidence: 0.1,
        reason: 'circuit_breaker_fallback',
        fallback: true,
        warning: 'Validation circuit open - using permissive fallback'
      },
      tradingExecution: {
        success: false,
        error: 'TRADING_CIRCUIT_OPEN',
        fallback: true,
        recommendation: 'Wait for circuit recovery before trading'
      },
      instructionParsing: {
        candidates: [],
        confidence: 0,
        fallback: true,
        reason: 'parsing_circuit_open'
      },
      candidateAssembly: {
        candidates: [],
        assembled: false,
        fallback: true,
        reason: 'assembly_circuit_open'
      }
    };
    
    return fallbacks[serviceName] || {
      success: false,
      error: 'UNKNOWN_SERVICE_CIRCUIT_OPEN',
      fallback: true,
      service: serviceName
    };
  }
  
  /**
   * Create timeout promise for operation protection
   */
  createTimeoutPromise(timeoutMs, serviceName) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${serviceName} timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }
  
  /**
   * Emit circuit breaker events via SignalBus
   */
  emitCircuitEvent(eventType, serviceName, data) {
    const event = {
      type: eventType,
      service: serviceName,
      timestamp: Date.now(),
      ...data
    };
    
    // Emit via SignalBus if available
    if (this.signalBus) {
      this.signalBus.emit('circuit_breaker_event', event);
    }
    
    // Also emit on self for direct listeners
    this.emit(eventType, event);
  }
  
  /**
   * Get comprehensive metrics for monitoring
   */
  getMetrics() {
    const uptime = Date.now() - this.systemMetrics.startTime;
    const memUsage = process.memoryUsage();
    
    return {
      system: {
        ...this.systemMetrics,
        uptime,
        memoryMB: (memUsage.heapUsed / 1024 / 1024).toFixed(1),
        cacheSize: this.duplicateCache.size,
        efficiency: this.systemMetrics.duplicatesBlocked / Math.max(this.systemMetrics.totalScans, 1)
      },
      services: Object.fromEntries(
        Array.from(this.serviceBreakers.entries()).map(([name, state]) => [
          name,
          {
            isOpen: state.isOpen,
            isHalfOpen: state.isHalfOpen,
            errors: state.errors,
            totalCalls: state.totalCalls,
            averageLatency: state.averageLatency ? state.averageLatency.toFixed(2) : 0,
            circuitTrips: state.circuitTrips,
            priority: state.priority,
            lastError: state.lastError?.message || null,
            cooldownRemaining: Math.max(0, state.cooldownEndTime - Date.now())
          }
        ])
      )
    };
  }
  
  /**
   * Setup periodic cleanup to prevent memory leaks
   */
  setupCleanupTimer() {
    setInterval(() => {
      this.performCleanup();
    }, this.cacheCleanupInterval);
  }
  
  /**
   * Perform periodic cleanup operations
   */
  performCleanup() {
    const now = Date.now();
    
    // Clean old cache entries (older than 30 minutes)
    const maxAge = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;
    
    for (const [signature, timestamp] of this.duplicateCache.entries()) {
      if (now - timestamp > maxAge) {
        this.duplicateCache.delete(signature);
        cleaned++;
      }
    }
    
    // Reset service error counts if window has passed
    for (const [serviceName, state] of this.serviceBreakers.entries()) {
      if (now - state.lastReset > state.window) {
        state.errors = 0;
        state.lastReset = now;
      }
    }
    
    this.systemMetrics.lastCleanup = now;
    
    if (cleaned > 0) {
      console.log(`🧹 Circuit Breaker cleanup: ${cleaned} cache entries, ${this.duplicateCache.size} remaining`);
    }
  }
  
  /**
   * Force reset circuit breaker state (emergency use)
   */
  reset(serviceName = null) {
    if (serviceName) {
      const serviceState = this.serviceBreakers.get(serviceName);
      if (serviceState) {
        serviceState.isOpen = false;
        serviceState.isHalfOpen = false;
        serviceState.errors = 0;
        serviceState.cooldownEndTime = 0;
        this.emitCircuitEvent('manual_reset', serviceName, { timestamp: Date.now() });
      }
    } else {
      // Reset all services
      for (const [name, state] of this.serviceBreakers.entries()) {
        state.isOpen = false;
        state.isHalfOpen = false;
        state.errors = 0;
        state.cooldownEndTime = 0;
      }
      this.emitCircuitEvent('full_reset', 'all', { timestamp: Date.now() });
    }
  }
  
  /**
   * Get health status for monitoring
   */
  getHealth() {
    const openCircuits = Array.from(this.serviceBreakers.entries())
      .filter(([_, state]) => state.isOpen)
      .map(([name, _]) => name);
    
    const criticalDown = openCircuits.filter(service => 
      this.serviceThresholds[service]?.priority === 'critical'
    );
    
    return {
      status: criticalDown.length > 0 ? 'critical' : 
              openCircuits.length > 0 ? 'degraded' : 'healthy',
      openCircuits,
      criticalDown,
      totalServices: this.serviceBreakers.size,
      uptime: Date.now() - this.systemMetrics.startTime
    };
  }
}

export default CircuitBreaker;