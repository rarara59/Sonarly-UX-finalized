export const PERFORMANCE_CONTRACTS = {
  tokenValidator: { maxLatency: 3, maxMemoryUsage: 50, maxErrorRate: 0.001 },
  transactionFetcher: { maxLatency: 10, maxMemoryUsage: 100, maxErrorRate: 0.05 },
  pipelineCoordinator: { maxLatency: 30, maxMemoryUsage: 200, maxErrorRate: 0.02 },
  // Add missing services from blueprint
  signalBus: { maxLatency: 0.1, maxMemoryUsage: 25, maxErrorRate: 0.0001 },
  circuitBreaker: { maxLatency: 1, maxMemoryUsage: 10, maxErrorRate: 0.001 },
  rpcConnectionPool: { maxLatency: 100, maxMemoryUsage: 50, maxErrorRate: 0.03 },
  detectorOrchestrator: { maxLatency: 25, maxMemoryUsage: 100, maxErrorRate: 0.01 }
};

export function validateSLA(serviceName, data) {
  // Input validation - prevent crashes
  if (!serviceName || typeof serviceName !== 'string') {
    return { valid: false, violations: ['invalid_service_name'] };
  }
  
  if (!data || typeof data !== 'object') {
    return { valid: false, violations: ['invalid_data'] };
  }
  
  const contract = PERFORMANCE_CONTRACTS[serviceName];
  if (!contract) {
    // FIX: Unknown services return valid but with warning - no false alarms
    console.warn(`Unknown service: ${serviceName}. Add to PERFORMANCE_CONTRACTS.`);
    return { 
      valid: true, 
      violations: [`unknown_service_${serviceName}`],
      monitoring: 'degraded' // Flag for ops team
    };
  }
  
  const violations = [];
  const monitoring = { latency: false, memory: false, errorRate: false };
  
  // FIX: Latency check - flag missing monitoring data
  const latency = data.response_time_ms || data.latency;
  if (latency == null) {
    violations.push(`missing_latency_monitoring`);
    monitoring.latency = false;
  } else if (typeof latency === 'number' && latency > contract.maxLatency) {
    violations.push(`latency_${latency}ms_exceeds_${contract.maxLatency}ms`);
    monitoring.latency = true;
  } else {
    monitoring.latency = true;
  }
  
  // FIX: Memory check - flag missing monitoring data
  let memory = data.memory_mb;
  if (memory == null && data.heapUsed) {
    memory = Math.round(data.heapUsed / 1024 / 1024);
  }
  if (memory == null) {
    violations.push(`missing_memory_monitoring`);
    monitoring.memory = false;
  } else if (typeof memory === 'number' && memory > contract.maxMemoryUsage) {
    violations.push(`memory_${memory}mb_exceeds_${contract.maxMemoryUsage}mb`);
    monitoring.memory = true;
  } else {
    monitoring.memory = true;
  }
  
  // FIX: Error rate check - flag missing data and handle zero requests properly
  let errorRate = data.error_rate;
  if (errorRate == null && data.error_count != null && data.total_requests != null) {
    if (data.total_requests === 0) {
      // FIX: Zero requests with errors is suspicious - flag it
      if (data.error_count > 0) {
        errorRate = 1.0; // 100% error rate
        violations.push(`errors_${data.error_count}_with_zero_requests_suspicious`);
      } else {
        errorRate = 0.0; // No errors, no requests = clean
      }
    } else {
      errorRate = data.error_count / data.total_requests;
    }
  }
  
  if (errorRate == null) {
    violations.push(`missing_error_rate_monitoring`);
    monitoring.errorRate = false;
  } else if (typeof errorRate === 'number' && errorRate > contract.maxErrorRate) {
    violations.push(`error_rate_${(errorRate * 100).toFixed(2)}%_exceeds_${(contract.maxErrorRate * 100).toFixed(2)}%`);
    monitoring.errorRate = true;
  } else {
    monitoring.errorRate = true;
  }
  
  // Determine overall validity - require monitoring to be working
  const hasMonitoring = monitoring.latency || monitoring.memory || monitoring.errorRate;
  const hasViolations = violations.some(v => !v.startsWith('missing_') && !v.startsWith('unknown_'));
  
  return { 
    valid: hasMonitoring && !hasViolations,
    violations,
    monitoring: hasMonitoring ? 'active' : 'degraded',
    contract: contract
  };
}

// Renaissance addition: Fast validation for critical path
export function isServiceHealthy(serviceName, data) {
  const result = validateSLA(serviceName, data);
  return result.valid;
}

// Renaissance addition: Get contract thresholds
export function getServiceContract(serviceName) {
  return PERFORMANCE_CONTRACTS[serviceName] || null;
}