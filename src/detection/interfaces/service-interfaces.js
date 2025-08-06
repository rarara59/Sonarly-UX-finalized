/**
 * Service Interface Contracts - Renaissance-Grade (Simplified)
 * Target: Fast service initialization, zero integration errors
 * Principle: Simple validation, fast execution, no performance overhead
 */

// Service interface definitions - simple and clear
export const SERVICE_INTERFACES = {
  TokenValidator: {
    required: ['validateToken'],
    optional: ['validateBatch', 'getStats', 'isHealthy']
  },
  PoolValidator: {
    required: ['validatePool'],
    optional: ['getStats', 'isHealthy']
  },
  RpcConnectionPool: {
    required: ['call', 'getStats', 'isHealthy'],
    optional: []
  },
  TransactionFetcher: {
    required: ['pollAllDexs'],
    optional: ['pollSpecificDex', 'getStats', 'isHealthy']
  },
  DetectorOrchestrator: {
    required: ['analyzeTransaction'],
    optional: ['setDetectorEnabled', 'getStats', 'isHealthy']
  },
  Detector: {
    required: ['analyzeTransaction'],
    optional: ['getStats', 'isHealthy']
  },
  ConfidenceCalculator: {
    required: ['calculateConfidence'],
    optional: ['getStats', 'isHealthy']
  },
  CandidateAssembler: {
    required: ['assembleCandidate'],
    optional: ['getStats', 'isHealthy']
  },
  PipelineCoordinator: {
    required: ['start', 'stop', 'getStats', 'isHealthy'],
    optional: []
  },
  PerformanceMonitor: {
    required: ['recordLatency', 'recordThroughput', 'getSnapshot', 'getStats', 'isHealthy'],
    optional: []
  },
  SignalBus: {
    required: ['emit', 'on', 'getStats', 'isHealthy'],
    optional: ['off']
  }
};

// Fast interface validation - no performance overhead
export function validateInterface(serviceName, serviceInstance) {
  const interface_ = SERVICE_INTERFACES[serviceName];
  if (!interface_) {
    return { valid: false, error: `Unknown service: ${serviceName}` };
  }
  
  const violations = [];
  
  // Check only required methods exist
  for (const methodName of interface_.required) {
    if (typeof serviceInstance[methodName] !== 'function') {
      violations.push(`Missing required method: ${methodName}`);
    }
  }
  
  return {
    valid: violations.length === 0,
    violations: violations.length > 0 ? violations : undefined
  };
}

// Service dependency graph for initialization order
export const SERVICE_DEPENDENCIES = {
  SignalBus: [],
  PerformanceMonitor: ['SignalBus'],
  RpcConnectionPool: ['PerformanceMonitor'],
  TokenValidator: ['RpcConnectionPool', 'PerformanceMonitor'],
  PoolValidator: ['RpcConnectionPool', 'PerformanceMonitor'],
  ConfidenceCalculator: ['PerformanceMonitor'],
  TransactionFetcher: ['RpcConnectionPool', 'PerformanceMonitor'],
  RaydiumDetector: ['SignalBus', 'TokenValidator', 'PerformanceMonitor'],
  PumpfunDetector: ['SignalBus', 'TokenValidator', 'PerformanceMonitor'],
  OrcaDetector: ['SignalBus', 'TokenValidator', 'PerformanceMonitor'],
  DetectorOrchestrator: ['RaydiumDetector', 'PumpfunDetector', 'OrcaDetector', 'SignalBus', 'PerformanceMonitor'],
  CandidateAssembler: ['ConfidenceCalculator', 'PerformanceMonitor'],
  PipelineCoordinator: ['TransactionFetcher', 'DetectorOrchestrator', 'TokenValidator', 'PoolValidator', 'CandidateAssembler', 'SignalBus', 'PerformanceMonitor']
};

// Get initialization order based on dependencies - this is actually useful
export function getInitializationOrder() {
  const ordered = [];
  const visited = new Set();
  const visiting = new Set();
  
  function visit(serviceName) {
    if (visiting.has(serviceName)) {
      throw new Error(`Circular dependency detected involving ${serviceName}`);
    }
    
    if (visited.has(serviceName)) {
      return;
    }
    
    visiting.add(serviceName);
    
    const dependencies = SERVICE_DEPENDENCIES[serviceName] || [];
    for (const dependency of dependencies) {
      visit(dependency);
    }
    
    visiting.delete(serviceName);
    visited.add(serviceName);
    ordered.push(serviceName);
  }
  
  for (const serviceName of Object.keys(SERVICE_DEPENDENCIES)) {
    visit(serviceName);
  }
  
  return ordered;
}

// Simple service health check - no performance overhead
export function checkServiceHealth(serviceName, serviceInstance) {
  const interface_ = SERVICE_INTERFACES[serviceName];
  if (!interface_) {
    return { healthy: false, reason: 'Unknown service' };
  }
  
  // If service has isHealthy method, use it
  if (typeof serviceInstance.isHealthy === 'function') {
    try {
      return { healthy: Boolean(serviceInstance.isHealthy()), source: 'isHealthy_method' };
    } catch (error) {
      return { healthy: false, reason: `isHealthy() failed: ${error.message}` };
    }
  }
  
  // Fallback: check if required methods exist
  for (const methodName of interface_.required) {
    if (typeof serviceInstance[methodName] !== 'function') {
      return { healthy: false, reason: `Missing required method: ${methodName}` };
    }
  }
  
  return { healthy: true, source: 'interface_validation' };
}

// Validate service exists and has required methods - simple and fast
export function validateServiceCall(fromService, toService, methodName) {
  const toInterface = SERVICE_INTERFACES[toService];
  if (!toInterface) {
    return { valid: false, error: `Unknown target service: ${toService}` };
  }
  
  const isRequired = toInterface.required.includes(methodName);
  const isOptional = toInterface.optional.includes(methodName);
  
  if (!isRequired && !isOptional) {
    return { valid: false, error: `Unknown method ${methodName} on service ${toService}` };
  }
  
  return { valid: true };
}

export default SERVICE_INTERFACES;