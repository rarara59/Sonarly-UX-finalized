/**
 * PERFORMANCE OPTIMIZATION ALGORITHMS
 * 
 * Standalone mathematical utilities for performance optimization extracted from the RPC manager.
 * All functions are pure mathematical utilities without side effects.
 * 
 * Features:
 * - Little's Law for request timing optimization
 * - Exponential smoothing for rate limit prediction
 * - Weighted fair queuing for priority scheduling
 * - Load balancing with consistent hashing
 * - Memory optimization and object pooling
 * - Connection pooling with keep-alive calculations
 * - Statistical analysis for failure pattern recognition
 * - Z-score anomaly detection
 * - Percentile calculations for SLA monitoring
 */

// =============================================
// LITTLE'S LAW IMPLEMENTATION
// =============================================

/**
 * Calculate system metrics using Little's Law: L = λ × W
 * Where L = average number of items in system, λ = average arrival rate, W = average waiting time
 * @param {Object} params - Input parameters
 * @param {number} params.arrivalRate - Requests per second (λ)
 * @param {number} params.serviceTime - Average service time in seconds (W)
 * @param {number} params.systemSize - Current number of items in system (L)
 * @returns {Object} Calculated system metrics
 */
export function calculateLittlesLaw({ arrivalRate, serviceTime, systemSize }) {
  const results = {};
  
  // If we have arrival rate and service time, calculate system size
  if (arrivalRate !== undefined && serviceTime !== undefined) {
    results.systemSize = arrivalRate * serviceTime;
    results.utilization = Math.min(1.0, arrivalRate * serviceTime);
    results.averageWaitTime = serviceTime;
  }
  
  // If we have system size and arrival rate, calculate service time
  if (systemSize !== undefined && arrivalRate !== undefined && arrivalRate > 0) {
    results.averageServiceTime = systemSize / arrivalRate;
    results.utilization = Math.min(1.0, systemSize / arrivalRate * arrivalRate);
  }
  
  // If we have system size and service time, calculate arrival rate
  if (systemSize !== undefined && serviceTime !== undefined && serviceTime > 0) {
    results.maxArrivalRate = systemSize / serviceTime;
    results.utilization = Math.min(1.0, systemSize / serviceTime * serviceTime);
  }
  
  return results;
}

/**
 * Calculate optimal request timing based on Little's Law and system capacity
 * @param {number} targetUtilization - Target system utilization (0-1)
 * @param {number} serviceRate - Service rate (requests per second)
 * @param {number} maxConcurrency - Maximum concurrent requests
 * @returns {Object} Optimal timing parameters
 */
export function calculateOptimalRequestTiming(targetUtilization, serviceRate, maxConcurrency) {
  // Using Little's Law: L = λW, where L is concurrent requests, λ is arrival rate, W is service time
  const serviceTime = 1 / serviceRate; // Average time per request
  const maxArrivalRate = maxConcurrency / serviceTime; // Maximum sustainable arrival rate
  const optimalArrivalRate = maxArrivalRate * targetUtilization;
  
  // Calculate inter-arrival time (time between requests)
  const interArrivalTime = 1 / optimalArrivalRate * 1000; // Convert to milliseconds
  
  // Calculate queue metrics
  const avgQueueLength = (optimalArrivalRate * serviceTime) / (1 - targetUtilization);
  const avgResponseTime = serviceTime + (avgQueueLength / optimalArrivalRate);
  
  return {
    optimalArrivalRate: optimalArrivalRate,
    interArrivalTimeMs: interArrivalTime,
    averageQueueLength: avgQueueLength,
    averageResponseTimeMs: avgResponseTime * 1000,
    utilizationFactor: targetUtilization,
    maxSustainableRate: maxArrivalRate
  };
}

/**
 * Calculate system performance metrics from observed data
 * @param {number[]} responseTimes - Array of response times in milliseconds
 * @param {number[]} arrivalTimes - Array of request arrival timestamps
 * @param {number} observationWindowMs - Observation window in milliseconds
 * @returns {Object} System performance analysis
 */
export function analyzeLittlesLawMetrics(responseTimes, arrivalTimes, observationWindowMs) {
  if (responseTimes.length === 0 || arrivalTimes.length === 0) {
    return { valid: false, reason: 'Insufficient data' };
  }
  
  // Calculate arrival rate
  const sortedArrivals = [...arrivalTimes].sort((a, b) => a - b);
  const timeSpan = sortedArrivals[sortedArrivals.length - 1] - sortedArrivals[0];
  const observedArrivalRate = (arrivalTimes.length - 1) / (timeSpan / 1000); // requests per second
  
  // Calculate average response time
  const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000; // seconds
  
  // Calculate system size using Little's Law
  const calculatedSystemSize = observedArrivalRate * avgResponseTime;
  
  // Calculate utilization metrics
  const serviceRate = 1 / avgResponseTime; // requests per second
  const utilization = observedArrivalRate / serviceRate;
  
  // Calculate stability metrics
  const isStable = utilization < 1.0;
  const utilizationBuffer = 1.0 - utilization;
  
  return {
    valid: true,
    observedArrivalRate: observedArrivalRate,
    averageResponseTimeMs: avgResponseTime * 1000,
    calculatedSystemSize: calculatedSystemSize,
    serviceRate: serviceRate,
    utilization: utilization,
    isStable: isStable,
    utilizationBuffer: utilizationBuffer,
    recommendedMaxArrivalRate: serviceRate * 0.8 // 80% utilization recommendation
  };
}

// =============================================
// EXPONENTIAL SMOOTHING FOR RATE LIMIT PREDICTION
// =============================================

/**
 * Simple exponential smoothing for rate limit prediction
 * @param {number[]} historicalRates - Historical rate measurements
 * @param {number} alpha - Smoothing parameter (0 < alpha <= 1)
 * @returns {Object} Smoothing results and predictions
 */
export function simpleExponentialSmoothing(historicalRates, alpha = 0.3) {
  if (historicalRates.length === 0) {
    return { smoothedValues: [], prediction: 0, trend: 0 };
  }
  
  const smoothedValues = [historicalRates[0]];
  
  for (let i = 1; i < historicalRates.length; i++) {
    const smoothed = alpha * historicalRates[i] + (1 - alpha) * smoothedValues[i - 1];
    smoothedValues.push(smoothed);
  }
  
  const prediction = smoothedValues[smoothedValues.length - 1];
  const trend = smoothedValues.length > 1 ? 
    smoothedValues[smoothedValues.length - 1] - smoothedValues[smoothedValues.length - 2] : 0;
  
  return {
    smoothedValues: smoothedValues,
    prediction: prediction,
    trend: trend,
    alpha: alpha
  };
}

/**
 * Double exponential smoothing (Holt's method) for trend-aware predictions
 * @param {number[]} values - Time series values
 * @param {number} alpha - Level smoothing parameter
 * @param {number} beta - Trend smoothing parameter
 * @param {number} forecastPeriods - Number of periods to forecast
 * @returns {Object} Smoothing results with trend-aware forecasts
 */
export function doubleExponentialSmoothing(values, alpha = 0.3, beta = 0.1, forecastPeriods = 1) {
  if (values.length < 2) {
    return { 
      smoothedValues: values, 
      trends: [0], 
      forecasts: values.length > 0 ? [values[0]] : [0],
      predictions: values.length > 0 ? Array(forecastPeriods).fill(values[0]) : Array(forecastPeriods).fill(0)
    };
  }
  
  const smoothedValues = [values[0]];
  const trends = [values[1] - values[0]]; // Initial trend
  
  for (let i = 1; i < values.length; i++) {
    // Level smoothing
    const level = alpha * values[i] + (1 - alpha) * (smoothedValues[i - 1] + trends[i - 1]);
    smoothedValues.push(level);
    
    // Trend smoothing
    const trend = beta * (level - smoothedValues[i - 1]) + (1 - beta) * trends[i - 1];
    trends.push(trend);
  }
  
  // Generate forecasts
  const lastLevel = smoothedValues[smoothedValues.length - 1];
  const lastTrend = trends[trends.length - 1];
  const predictions = [];
  
  for (let h = 1; h <= forecastPeriods; h++) {
    predictions.push(lastLevel + h * lastTrend);
  }
  
  return {
    smoothedValues: smoothedValues,
    trends: trends,
    forecasts: smoothedValues.map((level, i) => level + trends[i]),
    predictions: predictions,
    alpha: alpha,
    beta: beta
  };
}

/**
 * Triple exponential smoothing (Holt-Winters) for seasonal data
 * @param {number[]} values - Time series values
 * @param {number} seasonLength - Length of seasonal cycle
 * @param {number} alpha - Level smoothing parameter
 * @param {number} beta - Trend smoothing parameter  
 * @param {number} gamma - Seasonal smoothing parameter
 * @param {number} forecastPeriods - Number of periods to forecast
 * @returns {Object} Smoothing results with seasonal forecasts
 */
export function tripleExponentialSmoothing(values, seasonLength, alpha = 0.3, beta = 0.1, gamma = 0.1, forecastPeriods = 1) {
  if (values.length < seasonLength * 2) {
    // Fallback to double exponential smoothing if insufficient data
    return doubleExponentialSmoothing(values, alpha, beta, forecastPeriods);
  }
  
  // Initialize seasonal factors
  const seasonalFactors = [];
  for (let i = 0; i < seasonLength; i++) {
    let seasonalSum = 0;
    let count = 0;
    
    for (let j = i; j < values.length; j += seasonLength) {
      seasonalSum += values[j];
      count++;
    }
    
    const seasonalAverage = seasonalSum / count;
    const overallAverage = values.reduce((sum, val) => sum + val, 0) / values.length;
    seasonalFactors.push(seasonalAverage / overallAverage);
  }
  
  // Initialize arrays
  const levels = [values[0] / seasonalFactors[0]];
  const trends = [(values[seasonLength] - values[0]) / seasonLength];
  const seasonals = [...seasonalFactors];
  const smoothedValues = [values[0]];
  
  // Apply triple exponential smoothing
  for (let i = 1; i < values.length; i++) {
    const seasonalIndex = i % seasonLength;
    
    // Level update
    const level = alpha * (values[i] / seasonals[seasonalIndex]) + 
                  (1 - alpha) * (levels[i - 1] + trends[i - 1]);
    levels.push(level);
    
    // Trend update
    const trend = beta * (level - levels[i - 1]) + (1 - beta) * trends[i - 1];
    trends.push(trend);
    
    // Seasonal update
    seasonals[seasonalIndex] = gamma * (values[i] / level) + (1 - gamma) * seasonals[seasonalIndex];
    
    // Smoothed value
    smoothedValues.push((level + trend) * seasonals[seasonalIndex]);
  }
  
  // Generate forecasts
  const predictions = [];
  const lastLevel = levels[levels.length - 1];
  const lastTrend = trends[trends.length - 1];
  
  for (let h = 1; h <= forecastPeriods; h++) {
    const seasonalIndex = (values.length + h - 1) % seasonLength;
    const forecast = (lastLevel + h * lastTrend) * seasonals[seasonalIndex];
    predictions.push(forecast);
  }
  
  return {
    smoothedValues: smoothedValues,
    levels: levels,
    trends: trends,
    seasonalFactors: seasonals,
    predictions: predictions,
    alpha: alpha,
    beta: beta,
    gamma: gamma,
    seasonLength: seasonLength
  };
}

// =============================================
// WEIGHTED FAIR QUEUING ALGORITHMS
// =============================================

/**
 * Calculate virtual finish times for weighted fair queuing
 * @param {Object[]} packets - Array of packet objects with {size, weight, arrivalTime}
 * @param {number} currentVirtualTime - Current virtual time
 * @returns {Object[]} Packets with calculated finish times
 */
export function calculateWFQFinishTimes(packets, currentVirtualTime = 0) {
  let virtualTime = currentVirtualTime;
  
  return packets.map(packet => {
    const serviceTime = packet.size / packet.weight;
    const startTime = Math.max(virtualTime, packet.arrivalTime || 0);
    const finishTime = startTime + serviceTime;
    
    virtualTime = Math.max(virtualTime, finishTime);
    
    return {
      ...packet,
      virtualStartTime: startTime,
      virtualFinishTime: finishTime,
      serviceTime: serviceTime
    };
  });
}

/**
 * Schedule packets using Weighted Fair Queuing algorithm
 * @param {Object[]} queues - Array of queue objects with {weight, packets}
 * @param {number} maxScheduled - Maximum number of packets to schedule
 * @returns {Object} Scheduling results
 */
export function scheduleWFQ(queues, maxScheduled = 100) {
  const scheduledPackets = [];
  const queueStates = queues.map(queue => ({
    ...queue,
    virtualTime: 0,
    scheduled: 0
  }));
  
  // Calculate total weight
  const totalWeight = queueStates.reduce((sum, queue) => sum + queue.weight, 0);
  
  let globalVirtualTime = 0;
  let scheduled = 0;
  
  while (scheduled < maxScheduled) {
    // Find the queue with earliest virtual finish time
    let earliestQueue = null;
    let earliestFinishTime = Infinity;
    
    for (const queue of queueStates) {
      if (queue.packets.length > queue.scheduled) {
        const packet = queue.packets[queue.scheduled];
        const serviceTime = (packet.size || 1) / queue.weight;
        const finishTime = Math.max(globalVirtualTime, queue.virtualTime) + serviceTime;
        
        if (finishTime < earliestFinishTime) {
          earliestFinishTime = finishTime;
          earliestQueue = queue;
        }
      }
    }
    
    if (!earliestQueue) break; // No more packets to schedule
    
    // Schedule packet from earliest queue
    const packet = earliestQueue.packets[earliestQueue.scheduled];
    const serviceTime = (packet.size || 1) / earliestQueue.weight;
    
    scheduledPackets.push({
      ...packet,
      queueId: earliestQueue.id || earliestQueue.weight,
      virtualStartTime: Math.max(globalVirtualTime, earliestQueue.virtualTime),
      virtualFinishTime: earliestFinishTime,
      schedulingOrder: scheduled
    });
    
    earliestQueue.virtualTime = earliestFinishTime;
    earliestQueue.scheduled++;
    globalVirtualTime = Math.max(globalVirtualTime, earliestFinishTime);
    scheduled++;
  }
  
  return {
    scheduledPackets: scheduledPackets,
    globalVirtualTime: globalVirtualTime,
    queueStates: queueStates.map(queue => ({
      weight: queue.weight,
      scheduled: queue.scheduled,
      remaining: queue.packets.length - queue.scheduled,
      virtualTime: queue.virtualTime
    }))
  };
}

/**
 * Calculate fair share allocations for weighted queues
 * @param {Object[]} queues - Array of queue objects with {weight, demand}
 * @param {number} totalCapacity - Total system capacity to allocate
 * @returns {Object[]} Queues with calculated allocations
 */
export function calculateFairShareAllocation(queues, totalCapacity) {
  const totalWeight = queues.reduce((sum, queue) => sum + queue.weight, 0);
  const totalDemand = queues.reduce((sum, queue) => sum + queue.demand, 0);
  
  if (totalWeight === 0) {
    return queues.map(queue => ({ ...queue, allocation: 0, satisfied: true }));
  }
  
  // Initial proportional allocation
  let remainingCapacity = totalCapacity;
  const allocations = queues.map(queue => {
    const proportionalShare = (queue.weight / totalWeight) * totalCapacity;
    const allocation = Math.min(proportionalShare, queue.demand);
    remainingCapacity -= allocation;
    
    return {
      ...queue,
      allocation: allocation,
      proportionalShare: proportionalShare,
      satisfied: allocation >= queue.demand
    };
  });
  
  // Redistribute unused capacity from satisfied queues
  while (remainingCapacity > 0.01) { // Small epsilon to avoid floating point issues
    const unsatisfiedQueues = allocations.filter(queue => !queue.satisfied);
    
    if (unsatisfiedQueues.length === 0) break;
    
    const unsatisfiedWeight = unsatisfiedQueues.reduce((sum, queue) => sum + queue.weight, 0);
    let redistributed = 0;
    
    for (const queue of unsatisfiedQueues) {
      const additionalShare = (queue.weight / unsatisfiedWeight) * remainingCapacity;
      const additionalAllocation = Math.min(additionalShare, queue.demand - queue.allocation);
      
      queue.allocation += additionalAllocation;
      redistributed += additionalAllocation;
      
      if (queue.allocation >= queue.demand) {
        queue.satisfied = true;
      }
    }
    
    remainingCapacity -= redistributed;
    
    if (redistributed < 0.01) break; // No significant redistribution occurred
  }
  
  return allocations.map(queue => ({
    ...queue,
    utilizationRatio: queue.allocation / Math.max(queue.demand, 0.01),
    excessCapacity: Math.max(0, queue.proportionalShare - queue.allocation)
  }));
}

// =============================================
// LOAD BALANCING WITH CONSISTENT HASHING
// =============================================

/**
 * Calculate 32-bit hash for consistent hashing
 * @param {string} key - Key to hash
 * @returns {number} 32-bit hash value
 */
export function hashForLoadBalancing(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Create consistent hash ring with virtual nodes
 * @param {Object[]} servers - Array of server objects with {id, weight}
 * @param {number} virtualNodes - Number of virtual nodes per server
 * @returns {Object} Hash ring structure
 */
export function createConsistentHashRing(servers, virtualNodes = 150) {
  const ring = [];
  const serverMap = new Map();
  
  for (const server of servers) {
    serverMap.set(server.id, server);
    
    // Create virtual nodes based on server weight
    const nodeCount = Math.max(1, Math.floor(virtualNodes * (server.weight || 1)));
    
    for (let i = 0; i < nodeCount; i++) {
      const virtualKey = `${server.id}:${i}`;
      const hash = hashForLoadBalancing(virtualKey);
      
      ring.push({
        hash: hash,
        serverId: server.id,
        virtualNode: i
      });
    }
  }
  
  // Sort ring by hash values
  ring.sort((a, b) => a.hash - b.hash);
  
  return {
    ring: ring,
    servers: serverMap,
    totalVirtualNodes: ring.length
  };
}

/**
 * Find server for key using consistent hashing
 * @param {string} key - Key to route
 * @param {Object} hashRing - Hash ring structure
 * @returns {Object} Selected server and routing info
 */
export function findServerConsistentHash(key, hashRing) {
  if (hashRing.ring.length === 0) {
    return { server: null, hash: 0, position: -1 };
  }
  
  const keyHash = hashForLoadBalancing(key);
  
  // Binary search for the first node with hash >= keyHash
  let left = 0;
  let right = hashRing.ring.length - 1;
  let position = 0;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (hashRing.ring[mid].hash >= keyHash) {
      position = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  // If no node found with hash >= keyHash, wrap around to first node
  if (position === 0 && hashRing.ring[0].hash < keyHash) {
    position = 0; // Wrap around
  }
  
  const selectedNode = hashRing.ring[position];
  const server = hashRing.servers.get(selectedNode.serverId);
  
  return {
    server: server,
    hash: keyHash,
    position: position,
    selectedNode: selectedNode,
    ringPosition: selectedNode.hash
  };
}

/**
 * Calculate load distribution across servers
 * @param {string[]} keys - Array of keys to distribute
 * @param {Object} hashRing - Hash ring structure
 * @returns {Object} Load distribution analysis
 */
export function analyzeLoadDistribution(keys, hashRing) {
  const serverLoads = new Map();
  const routingDetails = [];
  
  // Initialize server loads
  for (const server of hashRing.servers.values()) {
    serverLoads.set(server.id, {
      server: server,
      keyCount: 0,
      keys: [],
      loadPercentage: 0
    });
  }
  
  // Route each key and track distribution
  for (const key of keys) {
    const routing = findServerConsistentHash(key, hashRing);
    
    if (routing.server) {
      const load = serverLoads.get(routing.server.id);
      load.keyCount++;
      load.keys.push(key);
      
      routingDetails.push({
        key: key,
        serverId: routing.server.id,
        hash: routing.hash,
        ringPosition: routing.ringPosition
      });
    }
  }
  
  // Calculate load percentages
  const totalKeys = keys.length;
  for (const load of serverLoads.values()) {
    load.loadPercentage = totalKeys > 0 ? (load.keyCount / totalKeys) * 100 : 0;
  }
  
  // Calculate distribution statistics
  const loadValues = Array.from(serverLoads.values()).map(load => load.keyCount);
  const averageLoad = totalKeys / hashRing.servers.size;
  const maxLoad = Math.max(...loadValues);
  const minLoad = Math.min(...loadValues);
  const loadVariance = loadValues.reduce((sum, load) => sum + Math.pow(load - averageLoad, 2), 0) / loadValues.length;
  const loadStdDev = Math.sqrt(loadVariance);
  
  return {
    serverLoads: Array.from(serverLoads.values()),
    routingDetails: routingDetails,
    statistics: {
      totalKeys: totalKeys,
      averageLoad: averageLoad,
      maxLoad: maxLoad,
      minLoad: minLoad,
      loadVariance: loadVariance,
      loadStandardDeviation: loadStdDev,
      loadImbalanceRatio: maxLoad / Math.max(minLoad, 1),
      distributionEfficiency: 1 - (loadStdDev / Math.max(averageLoad, 1))
    }
  };
}

// =============================================
// MEMORY OPTIMIZATION AND OBJECT POOLING
// =============================================

/**
 * Calculate optimal object pool size based on usage patterns
 * @param {number[]} allocationTimes - Array of allocation timestamps
 * @param {number[]} deallocationTimes - Array of deallocation timestamps
 * @param {number} windowSizeMs - Analysis window in milliseconds
 * @returns {Object} Pool size recommendations
 */
export function calculateOptimalPoolSize(allocationTimes, deallocationTimes, windowSizeMs = 60000) {
  if (allocationTimes.length === 0) {
    return {
      recommendedPoolSize: 10,
      peakConcurrency: 0,
      averageConcurrency: 0,
      allocationRate: 0,
      deallocationRate: 0
    };
  }
  
  // Sort timestamps
  const sortedAllocations = [...allocationTimes].sort((a, b) => a - b);
  const sortedDeallocations = [...deallocationTimes].sort((a, b) => a - b);
  
  // Find the analysis window
  const endTime = Math.max(
    sortedAllocations[sortedAllocations.length - 1] || 0,
    sortedDeallocations[sortedDeallocations.length - 1] || 0
  );
  const startTime = endTime - windowSizeMs;
  
  // Filter events to analysis window
  const windowAllocations = sortedAllocations.filter(time => time >= startTime);
  const windowDeallocations = sortedDeallocations.filter(time => time >= startTime);
  
  // Calculate concurrent object count over time
  const events = [
    ...windowAllocations.map(time => ({ time, type: 'alloc' })),
    ...windowDeallocations.map(time => ({ time, type: 'dealloc' }))
  ].sort((a, b) => a.time - b.time);
  
  let currentConcurrency = 0;
  let maxConcurrency = 0;
  let concurrencySum = 0;
  let lastTime = startTime;
  
  for (const event of events) {
    // Add time-weighted concurrency to sum
    const timeDelta = event.time - lastTime;
    concurrencySum += currentConcurrency * timeDelta;
    
    // Update concurrency
    if (event.type === 'alloc') {
      currentConcurrency++;
    } else {
      currentConcurrency = Math.max(0, currentConcurrency - 1);
    }
    
    maxConcurrency = Math.max(maxConcurrency, currentConcurrency);
    lastTime = event.time;
  }
  
  // Calculate average concurrency
  const averageConcurrency = windowSizeMs > 0 ? concurrencySum / windowSizeMs : 0;
  
  // Calculate rates
  const allocationRate = windowAllocations.length / (windowSizeMs / 1000); // per second
  const deallocationRate = windowDeallocations.length / (windowSizeMs / 1000); // per second
  
  // Calculate recommended pool size with safety buffer
  const basePoolSize = Math.ceil(averageConcurrency);
  const peakBuffer = Math.ceil((maxConcurrency - averageConcurrency) * 0.5);
  const safetyBuffer = Math.max(2, Math.ceil(basePoolSize * 0.2));
  const recommendedPoolSize = basePoolSize + peakBuffer + safetyBuffer;
  
  return {
    recommendedPoolSize: recommendedPoolSize,
    peakConcurrency: maxConcurrency,
    averageConcurrency: averageConcurrency,
    allocationRate: allocationRate,
    deallocationRate: deallocationRate,
    utilizationEfficiency: averageConcurrency / Math.max(maxConcurrency, 1),
    poolSizeComponents: {
      base: basePoolSize,
      peakBuffer: peakBuffer,
      safetyBuffer: safetyBuffer
    }
  };
}

/**
 * Calculate memory fragmentation metrics
 * @param {Object[]} allocations - Array of allocation objects with {size, address, timestamp}
 * @param {number} totalMemorySize - Total memory pool size
 * @returns {Object} Fragmentation analysis
 */
export function analyzeMemoryFragmentation(allocations, totalMemorySize) {
  if (allocations.length === 0) {
    return {
      fragmentationRatio: 0,
      largestFreeBlock: totalMemorySize,
      averageFreeBlockSize: totalMemorySize,
      freeBlockCount: 1,
      externalFragmentation: 0,
      internalFragmentation: 0
    };
  }
  
  // Sort allocations by address
  const sortedAllocations = [...allocations].sort((a, b) => a.address - b.address);
  
  // Find free blocks
  const freeBlocks = [];
  let currentAddress = 0;
  
  for (const allocation of sortedAllocations) {
    if (allocation.address > currentAddress) {
      // Found a free block
      freeBlocks.push({
        start: currentAddress,
        end: allocation.address,
        size: allocation.address - currentAddress
      });
    }
    currentAddress = Math.max(currentAddress, allocation.address + allocation.size);
  }
  
  // Check for free space at the end
  if (currentAddress < totalMemorySize) {
    freeBlocks.push({
      start: currentAddress,
      end: totalMemorySize,
      size: totalMemorySize - currentAddress
    });
  }
  
  // Calculate fragmentation metrics
  const totalAllocatedSize = allocations.reduce((sum, alloc) => sum + alloc.size, 0);
  const totalFreeSize = freeBlocks.reduce((sum, block) => sum + block.size, 0);
  const largestFreeBlock = freeBlocks.length > 0 ? Math.max(...freeBlocks.map(block => block.size)) : 0;
  const averageFreeBlockSize = freeBlocks.length > 0 ? totalFreeSize / freeBlocks.length : 0;
  
  // External fragmentation: percentage of free memory that cannot be used due to fragmentation
  const externalFragmentation = totalFreeSize > 0 ? 1 - (largestFreeBlock / totalFreeSize) : 0;
  
  // Internal fragmentation estimation (assuming some padding/alignment waste)
  const estimatedInternalWaste = allocations.length * 8; // Assume 8 bytes overhead per allocation
  const internalFragmentation = totalAllocatedSize > 0 ? estimatedInternalWaste / totalAllocatedSize : 0;
  
  // Overall fragmentation ratio
  const usableMemory = largestFreeBlock + totalAllocatedSize;
  const fragmentationRatio = 1 - (usableMemory / totalMemorySize);
  
  return {
    fragmentationRatio: fragmentationRatio,
    largestFreeBlock: largestFreeBlock,
    averageFreeBlockSize: averageFreeBlockSize,
    freeBlockCount: freeBlocks.length,
    externalFragmentation: externalFragmentation,
    internalFragmentation: internalFragmentation,
    totalAllocatedSize: totalAllocatedSize,
    totalFreeSize: totalFreeSize,
    memoryUtilization: totalAllocatedSize / totalMemorySize,
    freeBlocks: freeBlocks
  };
}

// =============================================
// CONNECTION POOLING OPTIMIZATION
// =============================================

/**
 * Calculate optimal connection pool parameters
 * @param {number[]} connectionUsageTimes - Array of connection usage durations in ms
 * @param {number[]} requestArrivalTimes - Array of request arrival timestamps
 * @param {number} connectionEstablishmentTimeMs - Time to establish new connection
 * @returns {Object} Optimal pool parameters
 */
export function calculateOptimalConnectionPool(connectionUsageTimes, requestArrivalTimes, connectionEstablishmentTimeMs = 100) {
  if (requestArrivalTimes.length === 0) {
    return {
      minPoolSize: 1,
      maxPoolSize: 10,
      keepAliveTimeMs: 30000,
      maxIdleTimeMs: 300000
    };
  }
  
  // Calculate request rate
  const sortedArrivals = [...requestArrivalTimes].sort((a, b) => a - b);
  const observationPeriod = sortedArrivals[sortedArrivals.length - 1] - sortedArrivals[0];
  const requestRate = requestArrivalTimes.length / (observationPeriod / 1000); // requests per second
  
  // Calculate average connection usage time
  const avgUsageTime = connectionUsageTimes.length > 0 ? 
    connectionUsageTimes.reduce((sum, time) => sum + time, 0) / connectionUsageTimes.length : 1000;
  
  // Calculate concurrent connections needed using Little's Law
  const avgConcurrentConnections = requestRate * (avgUsageTime / 1000);
  
  // Calculate percentiles for usage time
  const sortedUsageTimes = [...connectionUsageTimes].sort((a, b) => a - b);
  const p50UsageTime = calculatePercentile(sortedUsageTimes, 50);
  const p95UsageTime = calculatePercentile(sortedUsageTimes, 95);
  
  // Calculate pool size parameters
  const minPoolSize = Math.max(1, Math.ceil(avgConcurrentConnections * 0.5));
  const maxPoolSize = Math.max(minPoolSize, Math.ceil(avgConcurrentConnections * 2));
  
  // Calculate keep-alive time based on request intervals
  const requestIntervals = [];
  for (let i = 1; i < sortedArrivals.length; i++) {
    requestIntervals.push(sortedArrivals[i] - sortedArrivals[i - 1]);
  }
  
  const avgRequestInterval = requestIntervals.length > 0 ? 
    requestIntervals.reduce((sum, interval) => sum + interval, 0) / requestIntervals.length : 30000;
  
  // Keep-alive should be longer than typical request intervals but not too long
  const keepAliveTimeMs = Math.min(300000, Math.max(30000, avgRequestInterval * 3));
  
  // Max idle time should account for connection establishment cost
  const establishmentCostFactor = connectionEstablishmentTimeMs / Math.max(avgUsageTime, 1);
  const maxIdleTimeMs = Math.min(600000, keepAliveTimeMs * (1 + establishmentCostFactor));
  
  return {
    minPoolSize: minPoolSize,
    maxPoolSize: maxPoolSize,
    optimalPoolSize: Math.ceil(avgConcurrentConnections),
    keepAliveTimeMs: keepAliveTimeMs,
    maxIdleTimeMs: maxIdleTimeMs,
    metrics: {
      avgConcurrentConnections: avgConcurrentConnections,
      requestRate: requestRate,
      avgUsageTimeMs: avgUsageTime,
      p50UsageTimeMs: p50UsageTime,
      p95UsageTimeMs: p95UsageTime,
      avgRequestIntervalMs: avgRequestInterval,
      establishmentCostFactor: establishmentCostFactor
    }
  };
}

/**
 * Calculate connection keep-alive optimization parameters
 * @param {Object[]} connectionStats - Array of connection stat objects
 * @param {number} networkLatencyMs - Network round-trip latency
 * @param {number} serverProcessingTimeMs - Server processing time
 * @returns {Object} Keep-alive optimization results
 */
export function optimizeConnectionKeepAlive(connectionStats, networkLatencyMs = 50, serverProcessingTimeMs = 10) {
  if (connectionStats.length === 0) {
    return {
      optimalKeepAliveTimeMs: 30000,
      optimalMaxRequests: 100,
      keepAliveEfficiency: 0,
      recommendedTimeout: 60000
    };
  }
  
  // Analyze connection reuse patterns
  const connectionReuseCounts = connectionStats.map(conn => conn.requestCount || 1);
  const connectionLifetimes = connectionStats.map(conn => conn.lifetimeMs || 30000);
  const connectionIdleTimes = connectionStats.map(conn => conn.totalIdleTimeMs || 0);
  
  // Calculate reuse statistics
  const avgReuseCount = connectionReuseCounts.reduce((sum, count) => sum + count, 0) / connectionReuseCounts.length;
  const avgLifetime = connectionLifetimes.reduce((sum, time) => sum + time, 0) / connectionLifetimes.length;
  const avgIdleTime = connectionIdleTimes.reduce((sum, time) => sum + time, 0) / connectionIdleTimes.length;
  
  // Calculate connection establishment cost
  const establishmentCost = networkLatencyMs + serverProcessingTimeMs;
  
  // Calculate efficiency of keep-alive
  const totalRequestTime = avgReuseCount * (networkLatencyMs + serverProcessingTimeMs);
  const totalTimeWithKeepAlive = establishmentCost + totalRequestTime + avgIdleTime;
  const totalTimeWithoutKeepAlive = avgReuseCount * (establishmentCost + serverProcessingTimeMs);
  
  const keepAliveEfficiency = 1 - (totalTimeWithKeepAlive / totalTimeWithoutKeepAlive);
  
  // Calculate optimal keep-alive time
  // Should be longer than typical idle periods but not too long to waste resources
  const sortedIdleTimes = [...connectionIdleTimes].sort((a, b) => a - b);
  const p75IdleTime = calculatePercentile(sortedIdleTimes, 75);
  const optimalKeepAliveTimeMs = Math.min(300000, Math.max(30000, p75IdleTime * 1.5));
  
  // Calculate optimal max requests per connection
  // Balance between connection reuse and memory/state accumulation
  const optimalMaxRequests = Math.min(1000, Math.max(10, Math.ceil(avgReuseCount * 1.2)));
  
  // Calculate recommended timeout (shorter than keep-alive)
  const recommendedTimeout = Math.max(15000, optimalKeepAliveTimeMs * 0.8);
  
  return {
    optimalKeepAliveTimeMs: optimalKeepAliveTimeMs,
    optimalMaxRequests: optimalMaxRequests,
    keepAliveEfficiency: keepAliveEfficiency,
    recommendedTimeout: recommendedTimeout,
    metrics: {
      avgReuseCount: avgReuseCount,
      avgLifetimeMs: avgLifetime,
      avgIdleTimeMs: avgIdleTime,
      establishmentCostMs: establishmentCost,
      p75IdleTimeMs: p75IdleTime,
      timeSavingsPerConnection: totalTimeWithoutKeepAlive - totalTimeWithKeepAlive
    }
  };
}

// =============================================
// STATISTICAL ANALYSIS FOR FAILURE PATTERN RECOGNITION
// =============================================

/**
 * Perform Chi-square test for independence between failure patterns
 * @param {number[][]} contingencyTable - 2D array representing contingency table
 * @returns {Object} Chi-square test results
 */
export function chiSquareTest(contingencyTable) {
  if (contingencyTable.length === 0 || contingencyTable[0].length === 0) {
    return { pValue: 1, chiSquare: 0, degreesOfFreedom: 0, significant: false };
  }
  
  const rows = contingencyTable.length;
  const cols = contingencyTable[0].length;
  
  // Calculate row and column totals
  const rowTotals = contingencyTable.map(row => row.reduce((sum, cell) => sum + cell, 0));
  const colTotals = [];
  for (let j = 0; j < cols; j++) {
    colTotals[j] = contingencyTable.reduce((sum, row) => sum + row[j], 0);
  }
  const grandTotal = rowTotals.reduce((sum, total) => sum + total, 0);
  
  if (grandTotal === 0) {
    return { pValue: 1, chiSquare: 0, degreesOfFreedom: 0, significant: false };
  }
  
  // Calculate expected frequencies and chi-square statistic
  let chiSquare = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / grandTotal;
      if (expected > 0) {
        const observed = contingencyTable[i][j];
        chiSquare += Math.pow(observed - expected, 2) / expected;
      }
    }
  }
  
  const degreesOfFreedom = (rows - 1) * (cols - 1);
  
  // Approximate p-value using chi-square distribution
  // This is a simplified approximation - for precise values, use a proper statistical library
  const pValue = approximateChiSquarePValue(chiSquare, degreesOfFreedom);
  const significant = pValue < 0.05; // 5% significance level
  
  return {
    chiSquare: chiSquare,
    degreesOfFreedom: degreesOfFreedom,
    pValue: pValue,
    significant: significant,
    contingencyTable: contingencyTable,
    rowTotals: rowTotals,
    colTotals: colTotals,
    grandTotal: grandTotal
  };
}

/**
 * Approximate p-value for chi-square statistic (simplified implementation)
 * @param {number} chiSquare - Chi-square statistic
 * @param {number} df - Degrees of freedom
 * @returns {number} Approximate p-value
 */
function approximateChiSquarePValue(chiSquare, df) {
  if (df <= 0 || chiSquare < 0) return 1;
  
  // Very rough approximation using normal approximation for large df
  if (df >= 30) {
    const mean = df;
    const variance = 2 * df;
    const zScore = (chiSquare - mean) / Math.sqrt(variance);
    return 1 - approximateNormalCDF(zScore);
  }
  
  // Simple lookup table for small df (very approximate)
  const criticalValues = {
    1: [3.84, 6.64, 10.83],   // p = 0.05, 0.01, 0.001
    2: [5.99, 9.21, 13.82],
    3: [7.81, 11.34, 16.27],
    4: [9.49, 13.28, 18.47],
    5: [11.07, 15.09, 20.52]
  };
  
  const critical = criticalValues[df] || criticalValues[5];
  
  if (chiSquare >= critical[2]) return 0.001;
  if (chiSquare >= critical[1]) return 0.01;
  if (chiSquare >= critical[0]) return 0.05;
  return 0.1; // Conservative estimate
}

/**
 * Approximate standard normal CDF
 * @param {number} z - Z-score
 * @returns {number} Approximate CDF value
 */
function approximateNormalCDF(z) {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  
  const t = 1 / (1 + p * z);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1 + sign * y);
}

/**
 * Analyze failure patterns using time series analysis
 * @param {Object[]} failures - Array of failure objects with {timestamp, type, severity}
 * @param {number} windowSizeMs - Time window for pattern analysis
 * @returns {Object} Failure pattern analysis
 */
export function analyzeFailurePatterns(failures, windowSizeMs = 3600000) {
  if (failures.length === 0) {
    return {
      patterns: [],
      seasonality: null,
      trends: null,
      anomalies: [],
      recommendations: []
    };
  }
  
  // Sort failures by timestamp
  const sortedFailures = [...failures].sort((a, b) => a.timestamp - b.timestamp);
  
  // Create time buckets
  const startTime = sortedFailures[0].timestamp;
  const endTime = sortedFailures[sortedFailures.length - 1].timestamp;
  const bucketSize = windowSizeMs / 24; // 24 buckets per window
  const bucketCount = Math.ceil((endTime - startTime) / bucketSize);
  
  const buckets = Array(bucketCount).fill(0).map((_, i) => ({
    startTime: startTime + i * bucketSize,
    endTime: startTime + (i + 1) * bucketSize,
    failureCount: 0,
    failures: []
  }));
  
  // Distribute failures into buckets
  for (const failure of sortedFailures) {
    const bucketIndex = Math.floor((failure.timestamp - startTime) / bucketSize);
    if (bucketIndex >= 0 && bucketIndex < buckets.length) {
      buckets[bucketIndex].failureCount++;
      buckets[bucketIndex].failures.push(failure);
    }
  }
  
  // Analyze time series of failure counts
  const failureCounts = buckets.map(bucket => bucket.failureCount);
  const nonZeroCounts = failureCounts.filter(count => count > 0);
  
  if (nonZeroCounts.length === 0) {
    return {
      patterns: [],
      seasonality: null,
      trends: null,
      anomalies: [],
      recommendations: []
    };
  }
  
  // Calculate basic statistics
  const mean = failureCounts.reduce((sum, count) => sum + count, 0) / failureCounts.length;
  const variance = failureCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / failureCounts.length;
  const stdDev = Math.sqrt(variance);
  
  // Detect anomalies using z-score
  const anomalies = [];
  for (let i = 0; i < buckets.length; i++) {
    const zScore = stdDev > 0 ? (failureCounts[i] - mean) / stdDev : 0;
    if (Math.abs(zScore) > 2) { // 2-sigma threshold
      anomalies.push({
        bucketIndex: i,
        timestamp: buckets[i].startTime,
        failureCount: failureCounts[i],
        zScore: zScore,
        type: zScore > 0 ? 'spike' : 'drop'
      });
    }
  }
  
  // Simple trend analysis
  let trendSlope = 0;
  if (failureCounts.length > 1) {
    const n = failureCounts.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
    const sumY = failureCounts.reduce((sum, count) => sum + count, 0);
    const sumXY = failureCounts.reduce((sum, count, i) => sum + i * count, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares
    
    trendSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }
  
  // Pattern detection (simplified)
  const patterns = [];
  
  // Detect periodic patterns (very basic)
  for (let period = 2; period <= Math.floor(failureCounts.length / 3); period++) {
    let correlation = 0;
    let validPairs = 0;
    
    for (let i = 0; i < failureCounts.length - period; i++) {
      correlation += failureCounts[i] * failureCounts[i + period];
      validPairs++;
    }
    
    if (validPairs > 0) {
      correlation /= validPairs;
      const normalizedCorrelation = correlation / (mean * mean + variance);
      
      if (normalizedCorrelation > 1.5) {
        patterns.push({
          type: 'periodic',
          period: period,
          periodMs: period * bucketSize,
          strength: normalizedCorrelation,
          confidence: Math.min(1, validPairs / 10)
        });
      }
    }
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (trendSlope > 0.1) {
    recommendations.push('Increasing failure trend detected - investigate root causes');
  }
  
  if (anomalies.length > failureCounts.length * 0.1) {
    recommendations.push('High anomaly rate - system may be unstable');
  }
  
  if (patterns.length > 0) {
    recommendations.push(`Periodic patterns detected - consider scheduled maintenance during low-activity periods`);
  }
  
  return {
    patterns: patterns,
    trend: {
      slope: trendSlope,
      direction: trendSlope > 0.1 ? 'increasing' : trendSlope < -0.1 ? 'decreasing' : 'stable'
    },
    anomalies: anomalies,
    statistics: {
      mean: mean,
      variance: variance,
      standardDeviation: stdDev,
      totalFailures: failures.length,
      bucketCount: bucketCount,
      bucketSizeMs: bucketSize
    },
    recommendations: recommendations
  };
}

// =============================================
// Z-SCORE CALCULATIONS FOR ANOMALY DETECTION
// =============================================

/**
 * Calculate z-scores for anomaly detection
 * @param {number[]} values - Array of numeric values
 * @param {Object} options - Calculation options
 * @returns {Object} Z-score analysis results
 */
export function calculateZScores(values, options = {}) {
  const {
    windowSize = 0, // 0 means use all values
    robust = false,  // Use robust statistics (median, MAD)
    threshold = 2    // Z-score threshold for anomalies
  } = options;
  
  if (values.length === 0) {
    return {
      zScores: [],
      anomalies: [],
      statistics: { mean: 0, stdDev: 0, median: 0, mad: 0 }
    };
  }
  
  const results = [];
  const anomalies = [];
  
  for (let i = 0; i < values.length; i++) {
    const windowStart = windowSize > 0 ? Math.max(0, i - windowSize + 1) : 0;
    const windowValues = values.slice(windowStart, i + 1);
    
    let zScore, statistics;
    
    if (robust) {
      statistics = calculateRobustStatistics(windowValues);
      zScore = statistics.mad > 0 ? (values[i] - statistics.median) / statistics.mad : 0;
    } else {
      statistics = calculateBasicStatistics(windowValues);
      zScore = statistics.stdDev > 0 ? (values[i] - statistics.mean) / statistics.stdDev : 0;
    }
    
    const isAnomaly = Math.abs(zScore) > threshold;
    
    results.push({
      index: i,
      value: values[i],
      zScore: zScore,
      isAnomaly: isAnomaly,
      statistics: statistics
    });
    
    if (isAnomaly) {
      anomalies.push({
        index: i,
        value: values[i],
        zScore: zScore,
        severity: Math.abs(zScore) > threshold * 2 ? 'high' : 'medium',
        type: zScore > 0 ? 'high' : 'low'
      });
    }
  }
  
  return {
    zScores: results,
    anomalies: anomalies,
    anomalyRate: anomalies.length / values.length,
    threshold: threshold,
    robust: robust
  };
}

/**
 * Calculate basic statistics (mean, standard deviation)
 * @param {number[]} values - Array of values
 * @returns {Object} Basic statistics
 */
function calculateBasicStatistics(values) {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, variance: 0 };
  }
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / Math.max(values.length - 1, 1);
  const stdDev = Math.sqrt(variance);
  
  return { mean, stdDev, variance };
}

/**
 * Calculate robust statistics (median, MAD)
 * @param {number[]} values - Array of values
 * @returns {Object} Robust statistics
 */
function calculateRobustStatistics(values) {
  if (values.length === 0) {
    return { median: 0, mad: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const median = calculateMedian(sorted);
  
  // Calculate MAD (Median Absolute Deviation)
  const absoluteDeviations = values.map(val => Math.abs(val - median));
  const mad = calculateMedian(absoluteDeviations.sort((a, b) => a - b)) * 1.4826; // Scale factor for normal distribution
  
  return { median, mad };
}

/**
 * Calculate median from sorted array
 * @param {number[]} sortedValues - Sorted array of values
 * @returns {number} Median value
 */
function calculateMedian(sortedValues) {
  if (sortedValues.length === 0) return 0;
  
  const mid = Math.floor(sortedValues.length / 2);
  
  if (sortedValues.length % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  } else {
    return sortedValues[mid];
  }
}

/**
 * Detect anomaly clusters and patterns
 * @param {Object[]} anomalies - Array of anomaly objects from calculateZScores
 * @param {number} maxGapSize - Maximum gap between anomalies in same cluster
 * @returns {Object} Anomaly cluster analysis
 */
export function detectAnomalyClusters(anomalies, maxGapSize = 5) {
  if (anomalies.length === 0) {
    return { clusters: [], isolatedAnomalies: [] };
  }
  
  const clusters = [];
  const isolatedAnomalies = [];
  let currentCluster = null;
  
  // Sort anomalies by index
  const sortedAnomalies = [...anomalies].sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < sortedAnomalies.length; i++) {
    const anomaly = sortedAnomalies[i];
    
    if (currentCluster === null) {
      // Start new cluster
      currentCluster = {
        startIndex: anomaly.index,
        endIndex: anomaly.index,
        anomalies: [anomaly],
        avgZScore: anomaly.zScore,
        maxZScore: Math.abs(anomaly.zScore),
        size: 1
      };
    } else {
      const gap = anomaly.index - currentCluster.endIndex;
      
      if (gap <= maxGapSize) {
        // Add to current cluster
        currentCluster.anomalies.push(anomaly);
        currentCluster.endIndex = anomaly.index;
        currentCluster.avgZScore = currentCluster.anomalies.reduce((sum, a) => sum + a.zScore, 0) / currentCluster.anomalies.length;
        currentCluster.maxZScore = Math.max(currentCluster.maxZScore, Math.abs(anomaly.zScore));
        currentCluster.size++;
      } else {
        // Finish current cluster and start new one
        if (currentCluster.size >= 2) {
          clusters.push(currentCluster);
        } else {
          isolatedAnomalies.push(currentCluster.anomalies[0]);
        }
        
        currentCluster = {
          startIndex: anomaly.index,
          endIndex: anomaly.index,
          anomalies: [anomaly],
          avgZScore: anomaly.zScore,
          maxZScore: Math.abs(anomaly.zScore),
          size: 1
        };
      }
    }
  }
  
  // Handle final cluster
  if (currentCluster !== null) {
    if (currentCluster.size >= 2) {
      clusters.push(currentCluster);
    } else {
      isolatedAnomalies.push(currentCluster.anomalies[0]);
    }
  }
  
  // Calculate cluster statistics
  const enhancedClusters = clusters.map(cluster => ({
    ...cluster,
    duration: cluster.endIndex - cluster.startIndex + 1,
    density: cluster.size / (cluster.endIndex - cluster.startIndex + 1),
    severity: cluster.maxZScore > 3 ? 'high' : cluster.maxZScore > 2 ? 'medium' : 'low'
  }));
  
  return {
    clusters: enhancedClusters,
    isolatedAnomalies: isolatedAnomalies,
    clusterCount: enhancedClusters.length,
    isolatedCount: isolatedAnomalies.length,
    totalAnomalies: anomalies.length
  };
}

// =============================================
// PERCENTILE CALCULATIONS FOR SLA MONITORING
// =============================================

/**
 * Calculate percentiles for SLA monitoring (P50, P95, P99, etc.)
 * @param {number[]} values - Array of numeric values (e.g., response times)
 * @param {number[]} percentiles - Array of percentiles to calculate [50, 95, 99]
 * @returns {Object} Percentile calculations and SLA analysis
 */
export function calculatePercentiles(values, percentiles = [50, 90, 95, 99, 99.9]) {
  if (values.length === 0) {
    const emptyResult = {};
    percentiles.forEach(p => {
      emptyResult[`p${p}`] = 0;
    });
    return {
      percentiles: emptyResult,
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0
    };
  }
  
  // Sort values for percentile calculation
  const sortedValues = [...values].sort((a, b) => a - b);
  const count = sortedValues.length;
  
  // Calculate basic statistics
  const min = sortedValues[0];
  const max = sortedValues[count - 1];
  const mean = values.reduce((sum, val) => sum + val, 0) / count;
  const median = calculatePercentile(sortedValues, 50);
  
  // Calculate requested percentiles
  const percentileResults = {};
  percentiles.forEach(p => {
    percentileResults[`p${p}`] = calculatePercentile(sortedValues, p);
  });
  
  return {
    percentiles: percentileResults,
    count: count,
    min: min,
    max: max,
    mean: mean,
    median: median,
    sortedValues: sortedValues // Include for further analysis if needed
  };
}

/**
 * Calculate percentile from sorted array
 * @param {number[]} sortedArray - Sorted array of numbers
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} Percentile value
 */
export function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  if (percentile <= 0) return sortedArray[0];
  if (percentile >= 100) return sortedArray[sortedArray.length - 1];
  
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) {
    return sortedArray[lower];
  }
  
  const weight = index - lower;
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Analyze SLA compliance based on percentile thresholds
 * @param {number[]} responseTimes - Array of response times in milliseconds
 * @param {Object} slaThresholds - SLA thresholds {p50: 100, p95: 500, p99: 1000}
 * @param {number} timeWindowMs - Time window for analysis
 * @returns {Object} SLA compliance analysis
 */
export function analyzeSLACompliance(responseTimes, slaThresholds, timeWindowMs = 3600000) {
  const percentileData = calculatePercentiles(responseTimes, Object.keys(slaThresholds).map(key => parseFloat(key.substring(1))));
  
  const compliance = {};
  const violations = {};
  let overallCompliance = true;
  
  // Check each SLA threshold
  Object.entries(slaThresholds).forEach(([percentileKey, threshold]) => {
    const actualValue = percentileData.percentiles[percentileKey];
    const isCompliant = actualValue <= threshold;
    const violationMargin = actualValue - threshold;
    
    compliance[percentileKey] = {
      threshold: threshold,
      actual: actualValue,
      compliant: isCompliant,
      violationMargin: violationMargin,
      violationPercentage: threshold > 0 ? (violationMargin / threshold) * 100 : 0
    };
    
    if (!isCompliant) {
      overallCompliance = false;
      violations[percentileKey] = {
        threshold: threshold,
        actual: actualValue,
        violationMargin: violationMargin,
        severity: violationMargin > threshold * 0.5 ? 'critical' : violationMargin > threshold * 0.2 ? 'high' : 'medium'
      };
    }
  });
  
  // Calculate SLA score (percentage of SLAs met)
  const totalSLAs = Object.keys(slaThresholds).length;
  const metSLAs = Object.values(compliance).filter(c => c.compliant).length;
  const slaScore = (metSLAs / totalSLAs) * 100;
  
  // Identify trends and patterns
  const worstPerforming = Object.entries(compliance)
    .sort((a, b) => b[1].violationPercentage - a[1].violationPercentage)[0];
  
  const recommendations = [];
  
  if (!overallCompliance) {
    recommendations.push('SLA violations detected - investigate performance bottlenecks');
    
    if (worstPerforming && worstPerforming[1].violationPercentage > 50) {
      recommendations.push(`Critical violation in ${worstPerforming[0]} - immediate action required`);
    }
    
    // Analyze distribution for insights
    const p99p95Ratio = percentileData.percentiles.p99 / Math.max(percentileData.percentiles.p95, 1);
    if (p99p95Ratio > 3) {
      recommendations.push('High tail latency detected - investigate outlier requests');
    }
    
    const meanMedianRatio = percentileData.mean / Math.max(percentileData.median, 1);
    if (meanMedianRatio > 2) {
      recommendations.push('Skewed response time distribution - investigate slow requests');
    }
  }
  
  return {
    overallCompliant: overallCompliance,
    slaScore: slaScore,
    compliance: compliance,
    violations: violations,
    statistics: {
      ...percentileData,
      sampleSize: responseTimes.length,
      timeWindowMs: timeWindowMs,
      avgRequestsPerSecond: responseTimes.length / (timeWindowMs / 1000)
    },
    recommendations: recommendations,
    summary: {
      totalSLAs: totalSLAs,
      metSLAs: metSLAs,
      violatedSLAs: totalSLAs - metSLAs,
      worstViolation: worstPerforming ? worstPerforming[1] : null
    }
  };
}

/**
 * Calculate rolling percentiles for time-series SLA monitoring
 * @param {Object[]} timeSeriesData - Array of {timestamp, value} objects
 * @param {number} windowSizeMs - Rolling window size in milliseconds
 * @param {number[]} percentiles - Percentiles to calculate
 * @returns {Object[]} Array of rolling percentile calculations
 */
export function calculateRollingPercentiles(timeSeriesData, windowSizeMs, percentiles = [50, 95, 99]) {
  if (timeSeriesData.length === 0) {
    return [];
  }
  
  // Sort by timestamp
  const sortedData = [...timeSeriesData].sort((a, b) => a.timestamp - b.timestamp);
  const results = [];
  
  for (let i = 0; i < sortedData.length; i++) {
    const currentTime = sortedData[i].timestamp;
    const windowStart = currentTime - windowSizeMs;
    
    // Find all data points within the window
    const windowData = sortedData.filter(point => 
      point.timestamp >= windowStart && point.timestamp <= currentTime
    );
    
    if (windowData.length > 0) {
      const values = windowData.map(point => point.value);
      const percentileData = calculatePercentiles(values, percentiles);
      
      results.push({
        timestamp: currentTime,
        windowStart: windowStart,
        windowSize: windowData.length,
        ...percentileData
      });
    }
  }
  
  return results;
}

// Export all functions
export default {
  // Little's Law
  calculateLittlesLaw,
  calculateOptimalRequestTiming,
  analyzeLittlesLawMetrics,
  
  // Exponential Smoothing
  simpleExponentialSmoothing,
  doubleExponentialSmoothing,
  tripleExponentialSmoothing,
  
  // Weighted Fair Queuing
  calculateWFQFinishTimes,
  scheduleWFQ,
  calculateFairShareAllocation,
  
  // Load Balancing
  hashForLoadBalancing,
  createConsistentHashRing,
  findServerConsistentHash,
  analyzeLoadDistribution,
  
  // Memory Optimization
  calculateOptimalPoolSize,
  analyzeMemoryFragmentation,
  
  // Connection Pooling
  calculateOptimalConnectionPool,
  optimizeConnectionKeepAlive,
  
  // Statistical Analysis
  chiSquareTest,
  analyzeFailurePatterns,
  
  // Z-Score Anomaly Detection
  calculateZScores,
  detectAnomalyClusters,
  
  // Percentile Calculations
  calculatePercentiles,
  calculatePercentile,
  analyzeSLACompliance,
  calculateRollingPercentiles
};