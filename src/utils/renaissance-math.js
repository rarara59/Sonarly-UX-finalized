/**
 * RENAISSANCE MATHEMATICAL OPTIMIZATION UTILITIES
 * 
 * Pure mathematical functions extracted from the ideal RPC manager for optimization algorithms.
 * All functions are stateless and accept parameters, returning calculated values without side effects.
 * 
 * Features:
 * - Kalman filter for response time prediction
 * - Exponential weighted moving averages for health scoring
 * - TCP-style congestion control algorithms
 * - Statistical process control with control charts
 * - Multi-criteria decision analysis
 * - FNV hash algorithm for deterministic caching
 * - LRU-K cache eviction algorithm
 * - Adaptive token bucket algorithm
 */

// =============================================
// KALMAN FILTER IMPLEMENTATION
// =============================================

/**
 * Initialize Kalman filter state for response time prediction
 * @param {number} initialEstimate - Initial response time estimate (ms)
 * @param {number} initialUncertainty - Initial uncertainty in estimate
 * @param {number} processNoise - Process noise (system variability)
 * @param {number} measurementNoise - Measurement noise (sensor accuracy)
 * @returns {Object} Initial Kalman filter state
 */
export function initializeKalmanFilter(
  initialEstimate = 100, 
  initialUncertainty = 50, 
  processNoise = 0.1, 
  measurementNoise = 10
) {
  return {
    estimate: initialEstimate,          // Current estimate (x̂)
    uncertainty: initialUncertainty,    // Estimate uncertainty (P)
    processNoise: processNoise,         // Process noise (Q)
    measurementNoise: measurementNoise  // Measurement noise (R)
  };
}

/**
 * Update Kalman filter with new measurement
 * @param {Object} state - Current Kalman filter state
 * @param {number} measurement - New response time measurement
 * @param {number} timeDelta - Time since last update (for process model)
 * @returns {Object} Updated Kalman filter state with prediction
 */
export function updateKalmanFilter(state, measurement, timeDelta = 1) {
  // Prediction step
  const predictedEstimate = state.estimate; // Assume constant model
  const predictedUncertainty = state.uncertainty + (state.processNoise * timeDelta);
  
  // Update step
  const kalmanGain = predictedUncertainty / (predictedUncertainty + state.measurementNoise);
  const innovation = measurement - predictedEstimate;
  
  const updatedEstimate = predictedEstimate + (kalmanGain * innovation);
  const updatedUncertainty = (1 - kalmanGain) * predictedUncertainty;
  
  return {
    ...state,
    estimate: updatedEstimate,
    uncertainty: updatedUncertainty,
    kalmanGain: kalmanGain,
    innovation: innovation,
    prediction: updatedEstimate
  };
}

/**
 * Predict future response time using Kalman filter
 * @param {Object} state - Current Kalman filter state
 * @param {number} futureTime - Time steps into future
 * @returns {Object} Prediction with confidence interval
 */
export function predictKalmanResponse(state, futureTime = 1) {
  const prediction = state.estimate;
  const predictionUncertainty = state.uncertainty + (state.processNoise * futureTime);
  const confidenceInterval = 1.96 * Math.sqrt(predictionUncertainty); // 95% CI
  
  return {
    prediction: prediction,
    uncertainty: predictionUncertainty,
    lowerBound: prediction - confidenceInterval,
    upperBound: prediction + confidenceInterval
  };
}

// =============================================
// EXPONENTIAL WEIGHTED MOVING AVERAGES
// =============================================

/**
 * Calculate exponential weighted moving average
 * @param {number} currentValue - Current measurement
 * @param {number} previousEWMA - Previous EWMA value
 * @param {number} alpha - Smoothing factor (0 < alpha <= 1)
 * @returns {number} Updated EWMA value
 */
export function calculateEWMA(currentValue, previousEWMA, alpha = 0.1) {
  if (previousEWMA === null || previousEWMA === undefined) {
    return currentValue;
  }
  return alpha * currentValue + (1 - alpha) * previousEWMA;
}

/**
 * Calculate endpoint health score using exponential formula
 * Formula: health = 100 * (1 - (failures^2 / (calls + failures))) * exp(-avgResponseTime/1000)
 * @param {number} failures - Number of recent failures
 * @param {number} totalCalls - Total number of calls
 * @param {number} avgResponseTime - Average response time in ms
 * @returns {number} Health score (0-100)
 */
export function calculateEndpointHealth(failures, totalCalls, avgResponseTime) {
  if (totalCalls === 0) return 100;
  
  const denominator = totalCalls + failures;
  const failureRate = denominator > 0 ? (failures * failures) / denominator : 0;
  const responseTimeFactor = Math.exp(-avgResponseTime / 1000);
  
  const health = 100 * (1 - failureRate) * responseTimeFactor;
  return Math.max(0, Math.min(100, health));
}

/**
 * Calculate adaptive EWMA alpha based on volatility
 * @param {number} currentValue - Current measurement
 * @param {number} previousEWMA - Previous EWMA value
 * @param {number} baseAlpha - Base smoothing factor
 * @param {number} volatilityThreshold - Threshold for high volatility
 * @returns {number} Adaptive alpha value
 */
export function calculateAdaptiveAlpha(currentValue, previousEWMA, baseAlpha = 0.1, volatilityThreshold = 0.2) {
  if (previousEWMA === null || previousEWMA === undefined) {
    return baseAlpha;
  }
  
  const relativeChange = Math.abs(currentValue - previousEWMA) / Math.max(previousEWMA, 1);
  const volatilityMultiplier = relativeChange > volatilityThreshold ? 2.0 : 1.0;
  
  return Math.min(1.0, baseAlpha * volatilityMultiplier);
}

// =============================================
// TCP-STYLE CONGESTION CONTROL
// =============================================

/**
 * Initialize congestion control state
 * @param {number} initialWindow - Initial congestion window size
 * @param {number} slowStartThreshold - Threshold for slow start
 * @returns {Object} Initial congestion control state
 */
export function initializeCongestionControl(initialWindow = 1, slowStartThreshold = 16) {
  return {
    cwnd: initialWindow,              // Congestion window
    ssthresh: slowStartThreshold,     // Slow start threshold
    phase: 'slow_start',              // Current phase
    duplicateAcks: 0,                 // Count of duplicate ACKs
    rtt: 100,                         // Round trip time estimate
    rttvar: 50,                       // RTT variation
    rto: 200                          // Retransmission timeout
  };
}

/**
 * Update congestion window on successful transmission (ACK received)
 * @param {Object} state - Current congestion control state
 * @returns {Object} Updated congestion control state
 */
export function congestionControlOnAck(state) {
  const newState = { ...state };
  
  if (newState.phase === 'slow_start') {
    // Slow start: increase cwnd by 1 for each ACK
    newState.cwnd = Math.min(newState.cwnd + 1, newState.ssthresh);
    
    if (newState.cwnd >= newState.ssthresh) {
      newState.phase = 'congestion_avoidance';
    }
  } else if (newState.phase === 'congestion_avoidance') {
    // Congestion avoidance: increase cwnd by 1/cwnd for each ACK
    newState.cwnd += 1 / newState.cwnd;
  } else if (newState.phase === 'fast_recovery') {
    // Fast recovery: inflate window until new ACK
    newState.cwnd += 1;
  }
  
  newState.duplicateAcks = 0; // Reset duplicate ACK counter
  return newState;
}

/**
 * Update congestion window on packet loss or timeout
 * @param {Object} state - Current congestion control state
 * @param {string} lossType - Type of loss: 'timeout' or 'duplicate_ack'
 * @returns {Object} Updated congestion control state
 */
export function congestionControlOnLoss(state, lossType = 'timeout') {
  const newState = { ...state };
  
  if (lossType === 'timeout') {
    // Timeout: enter slow start
    newState.ssthresh = Math.max(2, Math.floor(newState.cwnd / 2));
    newState.cwnd = 1;
    newState.phase = 'slow_start';
    newState.duplicateAcks = 0;
  } else if (lossType === 'duplicate_ack') {
    newState.duplicateAcks += 1;
    
    if (newState.duplicateAcks >= 3) {
      // Fast retransmit and fast recovery
      newState.ssthresh = Math.max(2, Math.floor(newState.cwnd / 2));
      newState.cwnd = newState.ssthresh + 3;
      newState.phase = 'fast_recovery';
    }
  }
  
  return newState;
}

/**
 * Update RTT estimates using RFC 6298 algorithm
 * @param {Object} state - Current congestion control state
 * @param {number} measuredRTT - Newly measured RTT
 * @returns {Object} Updated state with new RTT estimates
 */
export function updateRTTEstimates(state, measuredRTT) {
  const newState = { ...state };
  
  if (newState.rtt === 100) { // First measurement
    newState.rtt = measuredRTT;
    newState.rttvar = measuredRTT / 2;
  } else {
    // RFC 6298 exponential smoothing
    const alpha = 0.125;
    const beta = 0.25;
    
    newState.rttvar = (1 - beta) * newState.rttvar + beta * Math.abs(newState.rtt - measuredRTT);
    newState.rtt = (1 - alpha) * newState.rtt + alpha * measuredRTT;
  }
  
  // Calculate RTO with minimum and maximum bounds
  newState.rto = Math.max(200, Math.min(60000, newState.rtt + 4 * newState.rttvar));
  
  return newState;
}

// =============================================
// STATISTICAL PROCESS CONTROL
// =============================================

/**
 * Calculate control chart statistics (mean and standard deviation)
 * @param {number[]} values - Array of measurements
 * @param {number} windowSize - Size of moving window (0 for all values)
 * @returns {Object} Control chart statistics
 */
export function calculateControlChartStats(values, windowSize = 0) {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, upperLimit: 0, lowerLimit: 0, count: 0 };
  }
  
  const dataSet = windowSize > 0 ? values.slice(-windowSize) : values;
  const n = dataSet.length;
  
  // Calculate mean
  const mean = dataSet.reduce((sum, value) => sum + value, 0) / n;
  
  // Calculate standard deviation
  const variance = dataSet.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  // Control limits (3-sigma rule)
  const upperLimit = mean + 3 * stdDev;
  const lowerLimit = mean - 3 * stdDev;
  
  return {
    mean: mean,
    stdDev: stdDev,
    upperLimit: upperLimit,
    lowerLimit: lowerLimit,
    count: n,
    variance: variance
  };
}

/**
 * Detect out-of-control conditions using Western Electric rules
 * @param {number[]} values - Recent measurements
 * @param {Object} controlLimits - Control chart statistics
 * @returns {Object} Detection results with rule violations
 */
export function detectOutOfControlConditions(values, controlLimits) {
  if (values.length < 8) {
    return { inControl: true, violations: [] };
  }
  
  const { mean, stdDev } = controlLimits;
  const violations = [];
  const recent8 = values.slice(-8);
  
  // Rule 1: One point beyond 3-sigma
  const lastValue = recent8[recent8.length - 1];
  if (Math.abs(lastValue - mean) > 3 * stdDev) {
    violations.push('Rule 1: Point beyond 3-sigma limit');
  }
  
  // Rule 2: Nine points in a row on same side of center line
  if (recent8.length >= 9) {
    const recent9 = values.slice(-9);
    const allAbove = recent9.every(val => val > mean);
    const allBelow = recent9.every(val => val < mean);
    if (allAbove || allBelow) {
      violations.push('Rule 2: Nine consecutive points on same side');
    }
  }
  
  // Rule 3: Six points in a row steadily increasing or decreasing
  if (recent8.length >= 6) {
    const recent6 = recent8.slice(-6);
    const increasing = recent6.every((val, i) => i === 0 || val > recent6[i - 1]);
    const decreasing = recent6.every((val, i) => i === 0 || val < recent6[i - 1]);
    if (increasing || decreasing) {
      violations.push('Rule 3: Six consecutive increasing/decreasing points');
    }
  }
  
  // Rule 4: Fourteen points alternating up and down
  if (recent8.length >= 14) {
    const recent14 = values.slice(-14);
    let alternating = true;
    for (let i = 2; i < recent14.length; i++) {
      const trend1 = recent14[i - 1] > recent14[i - 2];
      const trend2 = recent14[i] > recent14[i - 1];
      if (trend1 === trend2) {
        alternating = false;
        break;
      }
    }
    if (alternating) {
      violations.push('Rule 4: Fourteen alternating points');
    }
  }
  
  return {
    inControl: violations.length === 0,
    violations: violations,
    lastValue: lastValue,
    deviationFromMean: Math.abs(lastValue - mean) / stdDev
  };
}

// =============================================
// MULTI-CRITERIA DECISION ANALYSIS
// =============================================

/**
 * Calculate weighted scores for multi-criteria decision analysis
 * @param {Object[]} alternatives - Array of alternatives with criteria scores
 * @param {Object} weights - Weights for each criterion (sum should equal 1)
 * @param {string[]} criteria - Array of criterion names
 * @returns {Object[]} Alternatives with calculated weighted scores
 */
export function calculateWeightedScores(alternatives, weights, criteria) {
  return alternatives.map(alternative => {
    let weightedScore = 0;
    const criteriaScores = {};
    
    for (const criterion of criteria) {
      const score = alternative[criterion] || 0;
      const weight = weights[criterion] || 0;
      const weightedCriterionScore = score * weight;
      
      criteriaScores[criterion] = {
        rawScore: score,
        weight: weight,
        weightedScore: weightedCriterionScore
      };
      
      weightedScore += weightedCriterionScore;
    }
    
    return {
      ...alternative,
      weightedScore: weightedScore,
      criteriaBreakdown: criteriaScores
    };
  });
}

/**
 * Normalize criteria scores to 0-1 scale using min-max normalization
 * @param {Object[]} alternatives - Array of alternatives
 * @param {string[]} criteria - Array of criterion names to normalize
 * @param {Object} directions - Direction for each criterion ('max' or 'min')
 * @returns {Object[]} Alternatives with normalized scores
 */
export function normalizeCriteriaScores(alternatives, criteria, directions = {}) {
  const normalized = alternatives.map(alt => ({ ...alt }));
  
  for (const criterion of criteria) {
    const values = alternatives.map(alt => alt[criterion] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) {
      // All values are the same, set to 1
      normalized.forEach(alt => alt[criterion] = 1);
      continue;
    }
    
    const direction = directions[criterion] || 'max';
    
    normalized.forEach((alt, index) => {
      const rawValue = values[index];
      let normalizedValue;
      
      if (direction === 'max') {
        // Higher is better
        normalizedValue = (rawValue - min) / range;
      } else {
        // Lower is better
        normalizedValue = (max - rawValue) / range;
      }
      
      alt[criterion] = normalizedValue;
    });
  }
  
  return normalized;
}

/**
 * Calculate TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) scores
 * @param {Object[]} alternatives - Normalized alternatives
 * @param {Object} weights - Criteria weights
 * @param {string[]} criteria - Array of criterion names
 * @returns {Object[]} Alternatives with TOPSIS scores
 */
export function calculateTOPSISScores(alternatives, weights, criteria) {
  if (alternatives.length === 0) return [];
  
  // Calculate weighted normalized matrix
  const weightedMatrix = alternatives.map(alt => {
    const weighted = {};
    for (const criterion of criteria) {
      weighted[criterion] = (alt[criterion] || 0) * (weights[criterion] || 0);
    }
    return { ...alt, ...weighted };
  });
  
  // Determine positive and negative ideal solutions
  const idealPositive = {};
  const idealNegative = {};
  
  for (const criterion of criteria) {
    const values = weightedMatrix.map(alt => alt[criterion]);
    idealPositive[criterion] = Math.max(...values);
    idealNegative[criterion] = Math.min(...values);
  }
  
  // Calculate distances to ideal solutions
  return weightedMatrix.map(alt => {
    let distanceToPositive = 0;
    let distanceToNegative = 0;
    
    for (const criterion of criteria) {
      const value = alt[criterion];
      distanceToPositive += Math.pow(value - idealPositive[criterion], 2);
      distanceToNegative += Math.pow(value - idealNegative[criterion], 2);
    }
    
    distanceToPositive = Math.sqrt(distanceToPositive);
    distanceToNegative = Math.sqrt(distanceToNegative);
    
    // Calculate TOPSIS score (closeness to ideal solution)
    const topsisScore = distanceToNegative / (distanceToPositive + distanceToNegative);
    
    return {
      ...alt,
      distanceToPositive: distanceToPositive,
      distanceToNegative: distanceToNegative,
      topsisScore: topsisScore
    };
  });
}

// =============================================
// FNV HASH ALGORITHM
// =============================================

/**
 * Calculate 32-bit FNV-1a hash (deterministic caching)
 * @param {string} str - String to hash
 * @returns {string} 32-bit hash as hex string
 */
export function calculateFNV32Hash(str) {
  let hash = 2166136261; // FNV offset basis (32-bit)
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime (32-bit)
  }
  
  return (hash >>> 0).toString(16); // Convert to unsigned 32-bit hex
}

/**
 * Calculate 64-bit FNV-1a hash using BigInt
 * @param {string} str - String to hash
 * @returns {string} 64-bit hash as hex string
 */
export function calculateFNV64Hash(str) {
  let hash = 14695981039346656037n; // FNV offset basis (64-bit)
  
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash *= 1099511628211n; // FNV prime (64-bit)
  }
  
  return hash.toString(16);
}

/**
 * Generate consistent hash key for cache operations
 * @param {string} method - RPC method name
 * @param {Array} params - Method parameters
 * @param {string} endpoint - Endpoint identifier
 * @returns {string} Deterministic cache key
 */
export function generateCacheKey(method, params, endpoint) {
  const keyParts = [method, endpoint];
  
  if (params && params.length > 0) {
    const serializedParams = params.map(param => {
      if (param === null || param === undefined) return 'null';
      if (typeof param === 'string') return param;
      if (typeof param === 'number') return param.toString();
      if (typeof param === 'boolean') return param.toString();
      if (typeof param === 'object') {
        return JSON.stringify(param, Object.keys(param).sort());
      }
      return String(param);
    }).join('||');
    
    keyParts.push(serializedParams);
  }
  
  const content = keyParts.join('|');
  return calculateFNV32Hash(content);
}

// =============================================
// LRU-K CACHE EVICTION ALGORITHM
// =============================================

/**
 * Initialize LRU-K cache state
 * @param {number} k - K value for LRU-K (number of references to track)
 * @param {number} maxSize - Maximum cache size
 * @returns {Object} Initial LRU-K cache state
 */
export function initializeLRUKCache(k = 2, maxSize = 1000) {
  return {
    k: k,
    maxSize: maxSize,
    accessHistory: new Map(), // key -> array of access timestamps
    cacheEntries: new Map(),  // key -> value
    size: 0
  };
}

/**
 * Record access to cache entry for LRU-K algorithm
 * @param {Object} cacheState - Current cache state
 * @param {string} key - Cache key
 * @param {number} timestamp - Access timestamp
 * @returns {Object} Updated cache state
 */
export function recordLRUKAccess(cacheState, key, timestamp = Date.now()) {
  const newState = {
    ...cacheState,
    accessHistory: new Map(cacheState.accessHistory)
  };
  
  const history = newState.accessHistory.get(key) || [];
  history.push(timestamp);
  
  // Keep only the last K accesses
  if (history.length > newState.k) {
    history.shift();
  }
  
  newState.accessHistory.set(key, history);
  return newState;
}

/**
 * Calculate LRU-K priority for cache entry
 * @param {number[]} accessHistory - Array of access timestamps for the key
 * @param {number} k - K value for LRU-K
 * @param {number} currentTime - Current timestamp
 * @returns {number} Priority value (higher = more likely to be evicted)
 */
export function calculateLRUKPriority(accessHistory, k, currentTime = Date.now()) {
  if (!accessHistory || accessHistory.length === 0) {
    return Infinity; // Never accessed, highest priority for eviction
  }
  
  if (accessHistory.length < k) {
    // Less than K accesses, use oldest access time
    return currentTime - accessHistory[0];
  }
  
  // K or more accesses, use K-th most recent access time
  return currentTime - accessHistory[accessHistory.length - k];
}

/**
 * Find best candidate for eviction using LRU-K algorithm
 * @param {Object} cacheState - Current cache state
 * @param {number} currentTime - Current timestamp
 * @returns {string|null} Key to evict, or null if cache is empty
 */
export function selectLRUKEvictionCandidate(cacheState, currentTime = Date.now()) {
  if (cacheState.size === 0) return null;
  
  let maxPriority = -1;
  let candidateKey = null;
  
  for (const [key, history] of cacheState.accessHistory) {
    const priority = calculateLRUKPriority(history, cacheState.k, currentTime);
    
    if (priority > maxPriority) {
      maxPriority = priority;
      candidateKey = key;
    }
  }
  
  return candidateKey;
}

/**
 * Perform LRU-K cache eviction
 * @param {Object} cacheState - Current cache state
 * @param {number} targetSize - Target size after eviction
 * @param {number} currentTime - Current timestamp
 * @returns {Object} Updated cache state and evicted keys
 */
export function performLRUKEviction(cacheState, targetSize, currentTime = Date.now()) {
  const newState = {
    ...cacheState,
    accessHistory: new Map(cacheState.accessHistory),
    cacheEntries: new Map(cacheState.cacheEntries)
  };
  
  const evictedKeys = [];
  
  while (newState.size > targetSize) {
    const keyToEvict = selectLRUKEvictionCandidate(newState, currentTime);
    
    if (!keyToEvict) break;
    
    newState.accessHistory.delete(keyToEvict);
    newState.cacheEntries.delete(keyToEvict);
    newState.size--;
    evictedKeys.push(keyToEvict);
  }
  
  return {
    cacheState: newState,
    evictedKeys: evictedKeys
  };
}

// =============================================
// ADAPTIVE TOKEN BUCKET ALGORITHM
// =============================================

/**
 * Initialize token bucket state
 * @param {number} capacity - Maximum number of tokens
 * @param {number} fillRate - Tokens added per second
 * @param {number} initialTokens - Initial token count
 * @returns {Object} Initial token bucket state
 */
export function initializeTokenBucket(capacity = 100, fillRate = 10, initialTokens = null) {
  return {
    capacity: capacity,
    fillRate: fillRate,
    tokens: initialTokens !== null ? initialTokens : capacity,
    lastRefill: Date.now(),
    burstCredits: 0,           // Additional tokens for burst handling
    adaptiveMultiplier: 1.0    // Adaptive rate multiplier
  };
}

/**
 * Refill token bucket based on elapsed time
 * @param {Object} bucketState - Current bucket state
 * @param {number} currentTime - Current timestamp
 * @returns {Object} Updated bucket state
 */
export function refillTokenBucket(bucketState, currentTime = Date.now()) {
  const timeDelta = (currentTime - bucketState.lastRefill) / 1000; // Convert to seconds
  const tokensToAdd = timeDelta * bucketState.fillRate * bucketState.adaptiveMultiplier;
  
  const newTokens = Math.min(
    bucketState.capacity,
    bucketState.tokens + tokensToAdd
  );
  
  return {
    ...bucketState,
    tokens: newTokens,
    lastRefill: currentTime
  };
}

/**
 * Attempt to consume tokens from bucket
 * @param {Object} bucketState - Current bucket state
 * @param {number} tokensRequested - Number of tokens to consume
 * @param {number} currentTime - Current timestamp
 * @returns {Object} Result with success flag and updated state
 */
export function consumeTokens(bucketState, tokensRequested = 1, currentTime = Date.now()) {
  // First refill the bucket
  const refilledState = refillTokenBucket(bucketState, currentTime);
  
  // Check if we have enough tokens (including burst credits)
  const availableTokens = refilledState.tokens + refilledState.burstCredits;
  
  if (availableTokens >= tokensRequested) {
    let newTokens = refilledState.tokens;
    let newBurstCredits = refilledState.burstCredits;
    
    // Consume tokens, preferring regular tokens over burst credits
    if (refilledState.tokens >= tokensRequested) {
      newTokens -= tokensRequested;
    } else {
      const remainingNeeded = tokensRequested - refilledState.tokens;
      newTokens = 0;
      newBurstCredits -= remainingNeeded;
    }
    
    return {
      success: true,
      bucketState: {
        ...refilledState,
        tokens: newTokens,
        burstCredits: Math.max(0, newBurstCredits)
      }
    };
  }
  
  return {
    success: false,
    bucketState: refilledState
  };
}

/**
 * Add burst credits to token bucket for handling traffic spikes
 * @param {Object} bucketState - Current bucket state
 * @param {number} credits - Number of burst credits to add
 * @param {number} maxBurstCredits - Maximum burst credits allowed
 * @returns {Object} Updated bucket state
 */
export function addBurstCredits(bucketState, credits, maxBurstCredits = 50) {
  const newBurstCredits = Math.min(
    maxBurstCredits,
    bucketState.burstCredits + credits
  );
  
  return {
    ...bucketState,
    burstCredits: newBurstCredits
  };
}

/**
 * Adapt token bucket fill rate based on system performance
 * @param {Object} bucketState - Current bucket state
 * @param {number} currentLoad - Current system load (0-1)
 * @param {number} targetLoad - Target system load (0-1)
 * @param {number} adaptationRate - Rate of adaptation (0-1)
 * @returns {Object} Updated bucket state with adaptive multiplier
 */
export function adaptTokenBucketRate(bucketState, currentLoad, targetLoad = 0.7, adaptationRate = 0.1) {
  const loadError = targetLoad - currentLoad;
  const adaptation = loadError * adaptationRate;
  
  // Update adaptive multiplier
  const newMultiplier = Math.max(0.1, Math.min(2.0, 
    bucketState.adaptiveMultiplier + adaptation
  ));
  
  return {
    ...bucketState,
    adaptiveMultiplier: newMultiplier
  };
}

/**
 * Calculate optimal token bucket parameters based on traffic patterns
 * @param {number[]} requestTimes - Array of request timestamps
 * @param {number} windowSize - Analysis window size in ms
 * @param {number} targetUtilization - Target bucket utilization (0-1)
 * @returns {Object} Recommended bucket parameters
 */
export function calculateOptimalBucketParams(requestTimes, windowSize = 60000, targetUtilization = 0.8) {
  if (requestTimes.length < 2) {
    return {
      capacity: 100,
      fillRate: 10,
      burstCapacity: 20
    };
  }
  
  // Sort timestamps
  const sortedTimes = [...requestTimes].sort((a, b) => a - b);
  const endTime = sortedTimes[sortedTimes.length - 1];
  const startTime = Math.max(sortedTimes[0], endTime - windowSize);
  
  // Filter to analysis window
  const windowRequests = sortedTimes.filter(time => time >= startTime);
  
  if (windowRequests.length < 2) {
    return {
      capacity: 100,
      fillRate: 10,
      burstCapacity: 20
    };
  }
  
  // Calculate basic statistics
  const duration = (endTime - startTime) / 1000; // Convert to seconds
  const avgRate = windowRequests.length / duration;
  
  // Calculate burst characteristics
  const intervals = [];
  for (let i = 1; i < windowRequests.length; i++) {
    intervals.push(windowRequests[i] - windowRequests[i - 1]);
  }
  
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  const p95Interval = intervals[Math.floor(intervals.length * 0.95)];
  
  // Calculate burst size (max requests in any 1-second window)
  let maxBurst = 0;
  const oneSecond = 1000;
  
  for (let i = 0; i < windowRequests.length; i++) {
    const windowStart = windowRequests[i];
    const windowEnd = windowStart + oneSecond;
    const burstCount = windowRequests.filter(time => 
      time >= windowStart && time < windowEnd
    ).length;
    
    maxBurst = Math.max(maxBurst, burstCount);
  }
  
  // Calculate recommended parameters
  const recommendedFillRate = avgRate / targetUtilization;
  const recommendedCapacity = Math.max(
    Math.ceil(recommendedFillRate * 2), // 2-second burst capacity
    maxBurst * 1.2 // 20% over observed max burst
  );
  const recommendedBurstCapacity = Math.ceil(maxBurst * 0.5);
  
  return {
    capacity: Math.round(recommendedCapacity),
    fillRate: Math.round(recommendedFillRate * 10) / 10, // Round to 1 decimal
    burstCapacity: recommendedBurstCapacity,
    observedStats: {
      avgRate: Math.round(avgRate * 10) / 10,
      maxBurst: maxBurst,
      medianInterval: Math.round(medianInterval),
      p95Interval: Math.round(p95Interval),
      duration: Math.round(duration)
    }
  };
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

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
 * Calculate moving statistics over a sliding window
 * @param {number[]} values - Array of values
 * @param {number} windowSize - Size of moving window
 * @returns {Object[]} Array of moving statistics
 */
export function calculateMovingStatistics(values, windowSize) {
  const result = [];
  
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1);
    const stats = calculateControlChartStats(window);
    
    result.push({
      index: i,
      value: values[i],
      ...stats
    });
  }
  
  return result;
}

/**
 * Apply exponential smoothing to time series data
 * @param {number[]} values - Array of values
 * @param {number} alpha - Smoothing parameter (0 < alpha <= 1)
 * @returns {number[]} Smoothed values
 */
export function applyExponentialSmoothing(values, alpha = 0.3) {
  if (values.length === 0) return [];
  
  const smoothed = [values[0]];
  
  for (let i = 1; i < values.length; i++) {
    const smoothedValue = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
    smoothed.push(smoothedValue);
  }
  
  return smoothed;
}

// Export all functions as default object for convenience
export default {
  // Kalman Filter
  initializeKalmanFilter,
  updateKalmanFilter,
  predictKalmanResponse,
  
  // EWMA
  calculateEWMA,
  calculateEndpointHealth,
  calculateAdaptiveAlpha,
  
  // Congestion Control
  initializeCongestionControl,
  congestionControlOnAck,
  congestionControlOnLoss,
  updateRTTEstimates,
  
  // Statistical Process Control
  calculateControlChartStats,
  detectOutOfControlConditions,
  
  // Multi-Criteria Decision Analysis
  calculateWeightedScores,
  normalizeCriteriaScores,
  calculateTOPSISScores,
  
  // FNV Hash
  calculateFNV32Hash,
  calculateFNV64Hash,
  generateCacheKey,
  
  // LRU-K Cache
  initializeLRUKCache,
  recordLRUKAccess,
  calculateLRUKPriority,
  selectLRUKEvictionCandidate,
  performLRUKEviction,
  
  // Token Bucket
  initializeTokenBucket,
  refillTokenBucket,
  consumeTokens,
  addBurstCredits,
  adaptTokenBucketRate,
  calculateOptimalBucketParams,
  
  // Utilities
  calculatePercentile,
  calculateMovingStatistics,
  applyExponentialSmoothing
};