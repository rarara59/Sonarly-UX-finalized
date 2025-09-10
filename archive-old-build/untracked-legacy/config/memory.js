/**
 * Memory and GC Configuration
 * Renaissance-grade memory management settings
 */

export const memoryConfig = {
  // GC Manager settings
  gcManager: {
    heapThreshold: 0.85,          // Trigger GC at 85% heap usage
    gcInterval: 30000,            // Check every 30 seconds
    maxGCTime: 10,                // Alert if GC takes >10ms
    enableVerboseLogging: true,   // Log GC events for analysis
    suspendDuringTrading: true    // Suspend GC during critical trading operations
  },
  
  // Memory limits
  limits: {
    maxHeapUsageMB: 3500,        // Leave buffer on 4GB allocation
    criticalHeapUsageMB: 3800,   // Emergency GC threshold
    targetHeapUsageMB: 2500,     // Target steady-state usage
    maxGCFrequencyPerMin: 4      // Max GC events per minute
  },
  
  // Trading state integration
  tradingStates: {
    safeForGC: ['idle', 'error', 'initializing'],
    criticalStates: ['trading', 'validating', 'scanning']
  },
  
  // Performance targets
  performance: {
    gcDurationP95: 5,            // 95th percentile GC duration (ms)
    gcDurationP99: 10,           // 99th percentile GC duration (ms)
    heapUtilizationTarget: 0.75, // Target 75% heap utilization
    memoryGrowthRateLimit: 0.02  // Max 2% growth per hour
  },
  
  // Alert thresholds
  alerts: {
    gcDurationWarning: 5,        // ms
    gcDurationCritical: 15,      // ms
    heapWarning: 0.80,           // 80%
    heapCritical: 0.95,          // 95%
    gcFrequencyWarning: 4,       // per minute
    memoryLeakThreshold: 50      // MB growth indicating leak
  },
  
  // Cache management
  cacheSettings: {
    validationCacheTTL: 30000,   // 30 seconds
    maxCacheSize: 10000,         // Max cached items
    enableLRU: true              // Use LRU eviction
  }
};

export default memoryConfig;