/**
 * STATISTICAL ANALYSIS UTILITIES
 * 
 * Pure mathematical functions for statistical analysis extracted from the RPC manager.
 * All functions are stateless mathematical operations without external dependencies.
 * 
 * Features:
 * - Statistical hypothesis testing for failure analysis
 * - Correlation coefficient calculations
 * - Control chart algorithms for process monitoring
 * - Confidence interval calculations
 * - Exponential backoff with jitter
 * - Rate limit adjustment algorithms
 * - Priority queue algorithms with weight distribution
 * - Performance regression detection
 * - Capacity planning using utilization theory
 */

// =============================================
// STATISTICAL HYPOTHESIS TESTING
// =============================================

/**
 * Perform one-sample t-test to test if sample mean differs from population mean
 * @param {number[]} sample - Sample data
 * @param {number} populationMean - Hypothesized population mean
 * @param {number} significanceLevel - Significance level (default 0.05)
 * @returns {Object} T-test results
 */
export function oneSampleTTest(sample, populationMean, significanceLevel = 0.05) {
  if (sample.length === 0) {
    return {
      tStatistic: 0,
      pValue: 1,
      significant: false,
      confidence: 1 - significanceLevel,
      sampleMean: 0,
      standardError: 0
    };
  }
  
  const n = sample.length;
  const sampleMean = sample.reduce((sum, val) => sum + val, 0) / n;
  const sampleVariance = sample.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) / (n - 1);
  const standardError = Math.sqrt(sampleVariance / n);
  
  const tStatistic = standardError > 0 ? (sampleMean - populationMean) / standardError : 0;
  const degreesOfFreedom = n - 1;
  
  // Approximate p-value using t-distribution (simplified)
  const pValue = approximateTTestPValue(Math.abs(tStatistic), degreesOfFreedom);
  const significant = pValue < significanceLevel;
  
  return {
    tStatistic: tStatistic,
    pValue: pValue,
    significant: significant,
    confidence: 1 - significanceLevel,
    sampleMean: sampleMean,
    populationMean: populationMean,
    standardError: standardError,
    degreesOfFreedom: degreesOfFreedom,
    sampleSize: n,
    effect: sampleMean > populationMean ? 'higher' : 'lower'
  };
}

/**
 * Perform two-sample t-test to compare means of two independent samples
 * @param {number[]} sample1 - First sample
 * @param {number[]} sample2 - Second sample
 * @param {number} significanceLevel - Significance level
 * @returns {Object} Two-sample t-test results
 */
export function twoSampleTTest(sample1, sample2, significanceLevel = 0.05) {
  if (sample1.length === 0 || sample2.length === 0) {
    return {
      tStatistic: 0,
      pValue: 1,
      significant: false,
      meanDifference: 0,
      standardError: 0
    };
  }
  
  const n1 = sample1.length;
  const n2 = sample2.length;
  
  const mean1 = sample1.reduce((sum, val) => sum + val, 0) / n1;
  const mean2 = sample2.reduce((sum, val) => sum + val, 0) / n2;
  
  const var1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
  const var2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);
  
  // Pooled variance for equal variance assumption
  const pooledVariance = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
  const standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
  
  const meanDifference = mean1 - mean2;
  const tStatistic = standardError > 0 ? meanDifference / standardError : 0;
  const degreesOfFreedom = n1 + n2 - 2;
  
  const pValue = approximateTTestPValue(Math.abs(tStatistic), degreesOfFreedom);
  const significant = pValue < significanceLevel;
  
  return {
    tStatistic: tStatistic,
    pValue: pValue,
    significant: significant,
    meanDifference: meanDifference,
    standardError: standardError,
    degreesOfFreedom: degreesOfFreedom,
    sample1Mean: mean1,
    sample2Mean: mean2,
    pooledVariance: pooledVariance,
    effectSize: standardError > 0 ? meanDifference / Math.sqrt(pooledVariance) : 0
  };
}

/**
 * Perform Chi-square goodness of fit test
 * @param {number[]} observed - Observed frequencies
 * @param {number[]} expected - Expected frequencies
 * @param {number} significanceLevel - Significance level
 * @returns {Object} Chi-square test results
 */
export function chiSquareGoodnessOfFit(observed, expected, significanceLevel = 0.05) {
  if (observed.length !== expected.length || observed.length === 0) {
    return {
      chiSquare: 0,
      pValue: 1,
      significant: false,
      degreesOfFreedom: 0
    };
  }
  
  let chiSquare = 0;
  for (let i = 0; i < observed.length; i++) {
    if (expected[i] > 0) {
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
  }
  
  const degreesOfFreedom = observed.length - 1;
  const pValue = approximateChiSquarePValue(chiSquare, degreesOfFreedom);
  const significant = pValue < significanceLevel;
  
  return {
    chiSquare: chiSquare,
    pValue: pValue,
    significant: significant,
    degreesOfFreedom: degreesOfFreedom,
    observed: observed,
    expected: expected,
    residuals: observed.map((obs, i) => obs - expected[i])
  };
}

/**
 * Test for randomness vs systematic patterns using runs test
 * @param {number[]} values - Sequence of values
 * @param {number} median - Median value (optional, will calculate if not provided)
 * @returns {Object} Runs test results
 */
export function runsTest(values, median = null) {
  if (values.length < 3) {
    return {
      runs: 0,
      expectedRuns: 0,
      pValue: 1,
      significant: false,
      pattern: 'insufficient_data'
    };
  }
  
  // Calculate median if not provided
  if (median === null) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    median = sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }
  
  // Convert to binary sequence (above/below median)
  const binary = values.map(val => val > median ? 1 : 0);
  
  // Count runs
  let runs = 1;
  for (let i = 1; i < binary.length; i++) {
    if (binary[i] !== binary[i - 1]) {
      runs++;
    }
  }
  
  // Count positive and negative values
  const n1 = binary.filter(val => val === 1).length;
  const n2 = binary.length - n1;
  
  if (n1 === 0 || n2 === 0) {
    return {
      runs: runs,
      expectedRuns: 1,
      pValue: 1,
      significant: false,
      pattern: 'no_variation'
    };
  }
  
  // Expected number of runs under null hypothesis of randomness
  const expectedRuns = (2 * n1 * n2) / (n1 + n2) + 1;
  
  // Variance of runs
  const varianceRuns = (2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) / 
    (Math.pow(n1 + n2, 2) * (n1 + n2 - 1));
  
  // Z-statistic
  const zStatistic = varianceRuns > 0 ? 
    (runs - expectedRuns) / Math.sqrt(varianceRuns) : 0;
  
  // Two-tailed p-value
  const pValue = 2 * (1 - approximateNormalCDF(Math.abs(zStatistic)));
  const significant = pValue < 0.05;
  
  // Determine pattern
  let pattern = 'random';
  if (significant) {
    pattern = runs < expectedRuns ? 'systematic' : 'alternating';
  }
  
  return {
    runs: runs,
    expectedRuns: expectedRuns,
    varianceRuns: varianceRuns,
    zStatistic: zStatistic,
    pValue: pValue,
    significant: significant,
    pattern: pattern,
    n1: n1,
    n2: n2,
    median: median
  };
}

/**
 * Approximate p-value for t-test (simplified implementation)
 * @param {number} tStat - Absolute t-statistic
 * @param {number} df - Degrees of freedom
 * @returns {number} Approximate two-tailed p-value
 */
function approximateTTestPValue(tStat, df) {
  if (df <= 0) return 1;
  if (tStat === 0) return 1;
  
  // For large df (>30), approximate with normal distribution
  if (df >= 30) {
    return 2 * (1 - approximateNormalCDF(tStat));
  }
  
  // Simple lookup table for small df (very approximate)
  const criticalValues = {
    1: [12.71, 63.66, 636.62],  // p = 0.05, 0.01, 0.001
    2: [4.30, 9.92, 31.60],
    3: [3.18, 5.84, 12.92],
    4: [2.78, 4.60, 8.61],
    5: [2.57, 4.03, 6.87],
    10: [2.23, 3.17, 4.59],
    20: [2.09, 2.85, 3.85],
    30: [2.04, 2.75, 3.65]
  };
  
  // Find closest df
  const availableDf = Object.keys(criticalValues).map(Number).sort((a, b) => a - b);
  let closestDf = availableDf[0];
  for (const dof of availableDf) {
    if (Math.abs(dof - df) < Math.abs(closestDf - df)) {
      closestDf = dof;
    }
  }
  
  const critical = criticalValues[closestDf];
  
  if (tStat >= critical[2]) return 0.001;
  if (tStat >= critical[1]) return 0.01;
  if (tStat >= critical[0]) return 0.05;
  return 0.2; // Conservative estimate
}

/**
 * Approximate p-value for chi-square test
 * @param {number} chiSquare - Chi-square statistic
 * @param {number} df - Degrees of freedom
 * @returns {number} Approximate p-value
 */
function approximateChiSquarePValue(chiSquare, df) {
  if (df <= 0 || chiSquare < 0) return 1;
  
  // For large df, use normal approximation
  if (df >= 30) {
    const mean = df;
    const variance = 2 * df;
    const zScore = (chiSquare - mean) / Math.sqrt(variance);
    return 1 - approximateNormalCDF(zScore);
  }
  
  // Simple lookup table for small df
  const criticalValues = {
    1: [3.84, 6.64, 10.83],
    2: [5.99, 9.21, 13.82],
    3: [7.81, 11.34, 16.27],
    4: [9.49, 13.28, 18.47],
    5: [11.07, 15.09, 20.52],
    10: [18.31, 23.21, 29.59],
    20: [31.41, 37.57, 45.31]
  };
  
  const availableDf = Object.keys(criticalValues).map(Number);
  let closestDf = availableDf[0];
  for (const dof of availableDf) {
    if (Math.abs(dof - df) < Math.abs(closestDf - df)) {
      closestDf = dof;
    }
  }
  
  const critical = criticalValues[closestDf];
  
  if (chiSquare >= critical[2]) return 0.001;
  if (chiSquare >= critical[1]) return 0.01;
  if (chiSquare >= critical[0]) return 0.05;
  return 0.1;
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

// =============================================
// CORRELATION COEFFICIENT CALCULATIONS
// =============================================

/**
 * Calculate Pearson correlation coefficient
 * @param {number[]} x - First variable
 * @param {number[]} y - Second variable
 * @returns {Object} Correlation analysis results
 */
export function pearsonCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) {
    return {
      correlation: 0,
      pValue: 1,
      significant: false,
      strength: 'none'
    };
  }
  
  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - meanX;
    const yDiff = y[i] - meanY;
    
    numerator += xDiff * yDiff;
    sumXSquared += xDiff * xDiff;
    sumYSquared += yDiff * yDiff;
  }
  
  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  const correlation = denominator > 0 ? numerator / denominator : 0;
  
  // Test significance
  const tStatistic = n > 2 ? correlation * Math.sqrt((n - 2) / (1 - correlation * correlation)) : 0;
  const pValue = approximateTTestPValue(Math.abs(tStatistic), n - 2);
  const significant = pValue < 0.05;
  
  // Interpret strength
  const absCorr = Math.abs(correlation);
  let strength;
  if (absCorr >= 0.8) strength = 'very_strong';
  else if (absCorr >= 0.6) strength = 'strong';
  else if (absCorr >= 0.4) strength = 'moderate';
  else if (absCorr >= 0.2) strength = 'weak';
  else strength = 'very_weak';
  
  return {
    correlation: correlation,
    pValue: pValue,
    significant: significant,
    strength: strength,
    direction: correlation > 0 ? 'positive' : correlation < 0 ? 'negative' : 'none',
    tStatistic: tStatistic,
    sampleSize: n,
    meanX: meanX,
    meanY: meanY
  };
}

/**
 * Calculate Spearman rank correlation coefficient
 * @param {number[]} x - First variable
 * @param {number[]} y - Second variable
 * @returns {Object} Spearman correlation results
 */
export function spearmanCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) {
    return {
      correlation: 0,
      pValue: 1,
      significant: false,
      strength: 'none'
    };
  }
  
  // Convert to ranks
  const ranksX = calculateRanks(x);
  const ranksY = calculateRanks(y);
  
  // Use Pearson correlation on ranks
  return pearsonCorrelation(ranksX, ranksY);
}

/**
 * Calculate ranks for Spearman correlation
 * @param {number[]} values - Values to rank
 * @returns {number[]} Ranks
 */
function calculateRanks(values) {
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value);
  
  const ranks = new Array(values.length);
  
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    // Handle ties by averaging ranks
    while (j < indexed.length && indexed[j].value === indexed[i].value) {
      j++;
    }
    
    const averageRank = (i + j - 1) / 2 + 1; // +1 because ranks start at 1
    
    for (let k = i; k < j; k++) {
      ranks[indexed[k].index] = averageRank;
    }
    
    i = j;
  }
  
  return ranks;
}

/**
 * Calculate multiple correlation coefficients and cross-correlation matrix
 * @param {number[][]} variables - Array of variable arrays
 * @param {string[]} names - Variable names (optional)
 * @returns {Object} Cross-correlation analysis
 */
export function crossCorrelationMatrix(variables, names = null) {
  if (variables.length === 0) {
    return {
      matrix: [],
      significant: [],
      strongCorrelations: []
    };
  }
  
  const n = variables.length;
  const varNames = names || variables.map((_, i) => `var${i + 1}`);
  
  const matrix = [];
  const significant = [];
  const strongCorrelations = [];
  
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    significant[i] = [];
    
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        significant[i][j] = true;
      } else {
        const correlation = pearsonCorrelation(variables[i], variables[j]);
        matrix[i][j] = correlation.correlation;
        significant[i][j] = correlation.significant;
        
        // Track strong correlations
        if (Math.abs(correlation.correlation) >= 0.6 && correlation.significant && i < j) {
          strongCorrelations.push({
            var1: varNames[i],
            var2: varNames[j],
            correlation: correlation.correlation,
            strength: correlation.strength,
            pValue: correlation.pValue
          });
        }
      }
    }
  }
  
  return {
    matrix: matrix,
    significant: significant,
    strongCorrelations: strongCorrelations,
    variableNames: varNames,
    averageCorrelation: calculateAverageCorrelation(matrix),
    maxCorrelation: findMaxCorrelation(matrix, varNames)
  };
}

/**
 * Calculate average correlation (excluding diagonal)
 * @param {number[][]} matrix - Correlation matrix
 * @returns {number} Average correlation
 */
function calculateAverageCorrelation(matrix) {
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (i !== j) {
        sum += Math.abs(matrix[i][j]);
        count++;
      }
    }
  }
  
  return count > 0 ? sum / count : 0;
}

/**
 * Find maximum correlation (excluding diagonal)
 * @param {number[][]} matrix - Correlation matrix
 * @param {string[]} names - Variable names
 * @returns {Object} Maximum correlation info
 */
function findMaxCorrelation(matrix, names) {
  let maxCorr = 0;
  let maxPair = null;
  
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      const absCorr = Math.abs(matrix[i][j]);
      if (absCorr > maxCorr) {
        maxCorr = absCorr;
        maxPair = {
          var1: names[i],
          var2: names[j],
          correlation: matrix[i][j]
        };
      }
    }
  }
  
  return maxPair;
}

// =============================================
// CONTROL CHART ALGORITHMS
// =============================================

/**
 * Calculate control limits for X-bar chart (process mean monitoring)
 * @param {number[][]} subgroups - Array of subgroups (each subgroup is an array of measurements)
 * @param {number} sigma - Known process standard deviation (optional)
 * @returns {Object} Control chart parameters
 */
export function calculateXBarControlLimits(subgroups, sigma = null) {
  if (subgroups.length === 0 || subgroups[0].length === 0) {
    return {
      centerLine: 0,
      upperControlLimit: 0,
      lowerControlLimit: 0,
      upperWarningLimit: 0,
      lowerWarningLimit: 0
    };
  }
  
  const subgroupSize = subgroups[0].length;
  const subgroupMeans = subgroups.map(subgroup => 
    subgroup.reduce((sum, val) => sum + val, 0) / subgroup.length
  );
  
  // Calculate center line (grand mean)
  const centerLine = subgroupMeans.reduce((sum, mean) => sum + mean, 0) / subgroupMeans.length;
  
  let controlLimitMultiplier;
  
  if (sigma !== null) {
    // Known sigma case
    controlLimitMultiplier = 3 * sigma / Math.sqrt(subgroupSize);
  } else {
    // Estimate sigma from subgroup ranges
    const subgroupRanges = subgroups.map(subgroup => {
      const sorted = [...subgroup].sort((a, b) => a - b);
      return sorted[sorted.length - 1] - sorted[0];
    });
    
    const averageRange = subgroupRanges.reduce((sum, range) => sum + range, 0) / subgroupRanges.length;
    
    // Constants for different subgroup sizes (A2 factors)
    const A2Constants = {
      2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483,
      7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308
    };
    
    const A2 = A2Constants[subgroupSize] || A2Constants[10];
    controlLimitMultiplier = A2 * averageRange;
  }
  
  const upperControlLimit = centerLine + controlLimitMultiplier;
  const lowerControlLimit = centerLine - controlLimitMultiplier;
  
  // Warning limits (2 sigma)
  const warningMultiplier = controlLimitMultiplier * (2/3);
  const upperWarningLimit = centerLine + warningMultiplier;
  const lowerWarningLimit = centerLine - warningMultiplier;
  
  return {
    centerLine: centerLine,
    upperControlLimit: upperControlLimit,
    lowerControlLimit: lowerControlLimit,
    upperWarningLimit: upperWarningLimit,
    lowerWarningLimit: lowerWarningLimit,
    subgroupMeans: subgroupMeans,
    controlLimitMultiplier: controlLimitMultiplier,
    subgroupSize: subgroupSize
  };
}

/**
 * Calculate control limits for R chart (process variation monitoring)
 * @param {number[][]} subgroups - Array of subgroups
 * @returns {Object} R chart control limits
 */
export function calculateRChartControlLimits(subgroups) {
  if (subgroups.length === 0 || subgroups[0].length === 0) {
    return {
      centerLine: 0,
      upperControlLimit: 0,
      lowerControlLimit: 0
    };
  }
  
  const subgroupSize = subgroups[0].length;
  
  // Calculate ranges for each subgroup
  const ranges = subgroups.map(subgroup => {
    const sorted = [...subgroup].sort((a, b) => a - b);
    return sorted[sorted.length - 1] - sorted[0];
  });
  
  // Calculate average range (center line)
  const averageRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  
  // Constants for R chart control limits
  const RChartConstants = {
    2: { D3: 0, D4: 3.267 },
    3: { D3: 0, D4: 2.574 },
    4: { D3: 0, D4: 2.282 },
    5: { D3: 0, D4: 2.114 },
    6: { D3: 0, D4: 2.004 },
    7: { D3: 0.076, D4: 1.924 },
    8: { D3: 0.136, D4: 1.864 },
    9: { D3: 0.184, D4: 1.816 },
    10: { D3: 0.223, D4: 1.777 }
  };
  
  const constants = RChartConstants[subgroupSize] || RChartConstants[10];
  
  const upperControlLimit = constants.D4 * averageRange;
  const lowerControlLimit = constants.D3 * averageRange;
  
  return {
    centerLine: averageRange,
    upperControlLimit: upperControlLimit,
    lowerControlLimit: lowerControlLimit,
    ranges: ranges,
    subgroupSize: subgroupSize
  };
}

/**
 * Detect out-of-control conditions using Western Electric rules
 * @param {number[]} values - Measurement values
 * @param {Object} controlLimits - Control limits from calculateXBarControlLimits
 * @returns {Object} Out-of-control detection results
 */
export function detectOutOfControlConditions(values, controlLimits) {
  if (values.length < 8) {
    return {
      violations: [],
      inControl: true,
      violationCount: 0
    };
  }
  
  const { centerLine, upperControlLimit, lowerControlLimit, upperWarningLimit, lowerWarningLimit } = controlLimits;
  const violations = [];
  
  // Check each point for violations
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    
    // Rule 1: One point beyond control limits
    if (value > upperControlLimit || value < lowerControlLimit) {
      violations.push({
        rule: 1,
        description: 'Point beyond control limits',
        index: i,
        value: value,
        severity: 'critical'
      });
    }
    
    // Rule 2: Nine consecutive points on same side of center line
    if (i >= 8) {
      const recent9 = values.slice(i - 8, i + 1);
      const allAbove = recent9.every(val => val > centerLine);
      const allBelow = recent9.every(val => val < centerLine);
      
      if (allAbove || allBelow) {
        violations.push({
          rule: 2,
          description: 'Nine consecutive points on same side',
          index: i,
          value: value,
          severity: 'major'
        });
      }
    }
    
    // Rule 3: Six consecutive points steadily increasing or decreasing
    if (i >= 5) {
      const recent6 = values.slice(i - 5, i + 1);
      const increasing = recent6.every((val, idx) => idx === 0 || val > recent6[idx - 1]);
      const decreasing = recent6.every((val, idx) => idx === 0 || val < recent6[idx - 1]);
      
      if (increasing || decreasing) {
        violations.push({
          rule: 3,
          description: 'Six consecutive trending points',
          index: i,
          value: value,
          severity: 'major'
        });
      }
    }
    
    // Rule 4: Fourteen consecutive points alternating up and down
    if (i >= 13) {
      const recent14 = values.slice(i - 13, i + 1);
      let alternating = true;
      
      for (let j = 2; j < recent14.length; j++) {
        const trend1 = recent14[j - 1] > recent14[j - 2];
        const trend2 = recent14[j] > recent14[j - 1];
        if (trend1 === trend2) {
          alternating = false;
          break;
        }
      }
      
      if (alternating) {
        violations.push({
          rule: 4,
          description: 'Fourteen alternating points',
          index: i,
          value: value,
          severity: 'minor'
        });
      }
    }
    
    // Rule 5: Two out of three consecutive points beyond warning limits
    if (i >= 2) {
      const recent3 = values.slice(i - 2, i + 1);
      const beyondWarning = recent3.filter(val => 
        val > upperWarningLimit || val < lowerWarningLimit
      ).length;
      
      if (beyondWarning >= 2) {
        violations.push({
          rule: 5,
          description: 'Two of three points beyond warning limits',
          index: i,
          value: value,
          severity: 'moderate'
        });
      }
    }
  }
  
  return {
    violations: violations,
    inControl: violations.length === 0,
    violationCount: violations.length,
    ruleBreakdown: violations.reduce((breakdown, violation) => {
      breakdown[`rule${violation.rule}`] = (breakdown[`rule${violation.rule}`] || 0) + 1;
      return breakdown;
    }, {})
  };
}

// =============================================
// CONFIDENCE INTERVAL CALCULATIONS
// =============================================

/**
 * Calculate confidence interval for population mean
 * @param {number[]} sample - Sample data
 * @param {number} confidenceLevel - Confidence level (0-1, e.g., 0.95 for 95%)
 * @param {number} populationStdDev - Known population standard deviation (optional)
 * @returns {Object} Confidence interval results
 */
export function calculateMeanConfidenceInterval(sample, confidenceLevel = 0.95, populationStdDev = null) {
  if (sample.length === 0) {
    return {
      mean: 0,
      lowerBound: 0,
      upperBound: 0,
      marginOfError: 0,
      confidenceLevel: confidenceLevel
    };
  }
  
  const n = sample.length;
  const mean = sample.reduce((sum, val) => sum + val, 0) / n;
  const alpha = 1 - confidenceLevel;
  
  let marginOfError;
  
  if (populationStdDev !== null) {
    // Known population standard deviation - use z-distribution
    const zScore = getZScore(1 - alpha / 2);
    marginOfError = zScore * populationStdDev / Math.sqrt(n);
  } else {
    // Unknown population standard deviation - use t-distribution
    const sampleStdDev = Math.sqrt(
      sample.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
    );
    const tScore = getTScore(1 - alpha / 2, n - 1);
    marginOfError = tScore * sampleStdDev / Math.sqrt(n);
  }
  
  return {
    mean: mean,
    lowerBound: mean - marginOfError,
    upperBound: mean + marginOfError,
    marginOfError: marginOfError,
    confidenceLevel: confidenceLevel,
    sampleSize: n,
    standardError: populationStdDev ? populationStdDev / Math.sqrt(n) : 
      Math.sqrt(sample.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)) / Math.sqrt(n)
  };
}

/**
 * Calculate confidence interval for population proportion
 * @param {number} successes - Number of successes
 * @param {number} trials - Total number of trials
 * @param {number} confidenceLevel - Confidence level
 * @returns {Object} Proportion confidence interval
 */
export function calculateProportionConfidenceInterval(successes, trials, confidenceLevel = 0.95) {
  if (trials === 0) {
    return {
      proportion: 0,
      lowerBound: 0,
      upperBound: 0,
      marginOfError: 0
    };
  }
  
  const proportion = successes / trials;
  const alpha = 1 - confidenceLevel;
  const zScore = getZScore(1 - alpha / 2);
  
  // Wilson score interval (more accurate for small samples)
  const n = trials;
  const p = proportion;
  const z = zScore;
  
  const denominator = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / denominator;
  const marginOfError = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n) / denominator;
  
  return {
    proportion: proportion,
    lowerBound: Math.max(0, center - marginOfError),
    upperBound: Math.min(1, center + marginOfError),
    marginOfError: marginOfError,
    confidenceLevel: confidenceLevel,
    successes: successes,
    trials: trials
  };
}

/**
 * Calculate prediction interval for future observations
 * @param {number[]} sample - Historical sample data
 * @param {number} confidenceLevel - Confidence level
 * @param {number} futureObservations - Number of future observations to predict
 * @returns {Object} Prediction interval
 */
export function calculatePredictionInterval(sample, confidenceLevel = 0.95, futureObservations = 1) {
  if (sample.length === 0) {
    return {
      lowerBound: 0,
      upperBound: 0,
      marginOfError: 0
    };
  }
  
  const n = sample.length;
  const mean = sample.reduce((sum, val) => sum + val, 0) / n;
  const sampleStdDev = Math.sqrt(
    sample.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
  );
  
  const alpha = 1 - confidenceLevel;
  const tScore = getTScore(1 - alpha / 2, n - 1);
  
  // Prediction interval accounts for both estimation uncertainty and natural variation
  const standardError = sampleStdDev * Math.sqrt(1 + futureObservations / n);
  const marginOfError = tScore * standardError;
  
  return {
    predictedMean: mean,
    lowerBound: mean - marginOfError,
    upperBound: mean + marginOfError,
    marginOfError: marginOfError,
    confidenceLevel: confidenceLevel,
    standardError: standardError,
    futureObservations: futureObservations
  };
}

/**
 * Get z-score for given probability (approximate)
 * @param {number} probability - Probability value
 * @returns {number} Z-score
 */
function getZScore(probability) {
  // Common z-scores
  const zTable = {
    0.5: 0,
    0.75: 0.674,
    0.9: 1.282,
    0.95: 1.645,
    0.975: 1.96,
    0.99: 2.326,
    0.995: 2.576,
    0.999: 3.090
  };
  
  return zTable[probability] || 1.96; // Default to 95% confidence
}

/**
 * Get t-score for given probability and degrees of freedom (approximate)
 * @param {number} probability - Probability value
 * @param {number} df - Degrees of freedom
 * @returns {number} T-score
 */
function getTScore(probability, df) {
  // For large df, approximate with z-score
  if (df >= 30) {
    return getZScore(probability);
  }
  
  // Simplified t-table for common confidence levels
  const tTable = {
    1: { 0.75: 1.000, 0.9: 3.078, 0.95: 6.314, 0.975: 12.706, 0.99: 31.821 },
    2: { 0.75: 0.816, 0.9: 1.886, 0.95: 2.920, 0.975: 4.303, 0.99: 6.965 },
    3: { 0.75: 0.765, 0.9: 1.638, 0.95: 2.353, 0.975: 3.182, 0.99: 4.541 },
    4: { 0.75: 0.741, 0.9: 1.533, 0.95: 2.132, 0.975: 2.776, 0.99: 3.747 },
    5: { 0.75: 0.727, 0.9: 1.476, 0.95: 2.015, 0.975: 2.571, 0.99: 3.365 },
    10: { 0.75: 0.700, 0.9: 1.372, 0.95: 1.812, 0.975: 2.228, 0.99: 2.764 },
    20: { 0.75: 0.687, 0.9: 1.325, 0.95: 1.725, 0.975: 2.086, 0.99: 2.528 },
    30: { 0.75: 0.683, 0.9: 1.310, 0.95: 1.697, 0.975: 2.042, 0.99: 2.457 }
  };
  
  // Find closest df
  const availableDf = Object.keys(tTable).map(Number).sort((a, b) => a - b);
  let closestDf = availableDf[0];
  for (const dof of availableDf) {
    if (Math.abs(dof - df) < Math.abs(closestDf - df)) {
      closestDf = dof;
    }
  }
  
  return tTable[closestDf][probability] || getZScore(probability);
}

// =============================================
// EXPONENTIAL BACKOFF WITH JITTER
// =============================================

/**
 * Calculate exponential backoff delay with jitter
 * @param {number} attempt - Attempt number (0-based)
 * @param {Object} options - Backoff options
 * @returns {Object} Backoff calculation results
 */
export function calculateExponentialBackoff(attempt, options = {}) {
  const {
    baseDelay = 1000,          // Base delay in milliseconds
    maxDelay = 60000,          // Maximum delay in milliseconds
    multiplier = 2,            // Exponential multiplier
    jitterType = 'full',       // 'none', 'equal', 'full', 'decorrelated'
    jitterAmount = 1.0,        // Jitter amount (0-1)
    randomSeed = Math.random() // Random seed for deterministic testing
  } = options;
  
  // Calculate base exponential delay
  const exponentialDelay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay);
  
  let finalDelay;
  let jitter = 0;
  
  switch (jitterType) {
    case 'none':
      finalDelay = exponentialDelay;
      break;
      
    case 'equal':
      // Equal jitter: delay = base + random(0, base)
      jitter = randomSeed * exponentialDelay * jitterAmount;
      finalDelay = exponentialDelay + jitter;
      break;
      
    case 'full':
      // Full jitter: delay = random(0, exponentialDelay)
      jitter = randomSeed * exponentialDelay * jitterAmount;
      finalDelay = jitter;
      break;
      
    case 'decorrelated':
      // Decorrelated jitter: delay = random(base, previousDelay * 3)
      const previousDelay = attempt > 0 ? 
        Math.min(baseDelay * Math.pow(multiplier, attempt - 1), maxDelay) : 
        baseDelay;
      const maxJitter = Math.min(previousDelay * 3, maxDelay);
      jitter = randomSeed * (maxJitter - baseDelay) * jitterAmount;
      finalDelay = baseDelay + jitter;
      break;
      
    default:
      finalDelay = exponentialDelay;
  }
  
  // Ensure within bounds
  finalDelay = Math.max(baseDelay, Math.min(finalDelay, maxDelay));
  
  return {
    delay: Math.round(finalDelay),
    baseDelay: baseDelay,
    exponentialDelay: exponentialDelay,
    jitter: jitter,
    jitterType: jitterType,
    attempt: attempt,
    multiplier: multiplier,
    maxDelay: maxDelay,
    effectiveMultiplier: attempt > 0 ? finalDelay / (baseDelay * Math.pow(multiplier, attempt - 1)) : 1
  };
}

/**
 * Calculate optimal backoff parameters based on failure patterns
 * @param {Object[]} failureHistory - Array of failure objects with {timestamp, duration}
 * @param {number} targetSuccessRate - Target success rate (0-1)
 * @returns {Object} Optimal backoff parameters
 */
export function optimizeBackoffParameters(failureHistory, targetSuccessRate = 0.95) {
  if (failureHistory.length === 0) {
    return {
      baseDelay: 1000,
      maxDelay: 60000,
      multiplier: 2,
      jitterType: 'full',
      confidence: 0
    };
  }
  
  // Analyze failure patterns
  const failureDurations = failureHistory.map(f => f.duration || 1000);
  const failureIntervals = [];
  
  for (let i = 1; i < failureHistory.length; i++) {
    failureIntervals.push(failureHistory[i].timestamp - failureHistory[i - 1].timestamp);
  }
  
  // Calculate statistics
  const avgDuration = failureDurations.reduce((sum, d) => sum + d, 0) / failureDurations.length;
  const maxDuration = Math.max(...failureDurations);
  const p95Duration = calculatePercentile(failureDurations.sort((a, b) => a - b), 95);
  
  // Base delay should be related to typical failure duration
  const baseDelay = Math.max(1000, Math.min(avgDuration * 2, 5000));
  
  // Max delay should handle worst-case scenarios
  const maxDelay = Math.max(baseDelay * 10, Math.min(maxDuration * 3, 300000));
  
  // Multiplier based on failure clustering
  let multiplier = 2;
  if (failureIntervals.length > 0) {
    const avgInterval = failureIntervals.reduce((sum, i) => sum + i, 0) / failureIntervals.length;
    // If failures are clustered (short intervals), use higher multiplier
    if (avgInterval < avgDuration * 5) {
      multiplier = 2.5;
    }
  }
  
  // Determine optimal jitter type based on failure pattern variance
  const durationVariance = failureDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / failureDurations.length;
  const coefficientOfVariation = Math.sqrt(durationVariance) / avgDuration;
  
  let jitterType = 'full';
  if (coefficientOfVariation < 0.3) {
    jitterType = 'equal'; // Low variance, use equal jitter
  } else if (coefficientOfVariation > 1.0) {
    jitterType = 'decorrelated'; // High variance, use decorrelated jitter
  }
  
  // Calculate confidence based on sample size and consistency
  const confidence = Math.min(1, failureHistory.length / 20) * (1 - Math.min(1, coefficientOfVariation));
  
  return {
    baseDelay: Math.round(baseDelay),
    maxDelay: Math.round(maxDelay),
    multiplier: multiplier,
    jitterType: jitterType,
    confidence: confidence,
    analysis: {
      avgDuration: avgDuration,
      maxDuration: maxDuration,
      p95Duration: p95Duration,
      coefficientOfVariation: coefficientOfVariation,
      sampleSize: failureHistory.length
    }
  };
}

// =============================================
// RATE LIMIT ADJUSTMENT ALGORITHMS
// =============================================

/**
 * Calculate rate limit adjustment based on health factors
 * @param {number} currentLimit - Current rate limit (requests per second)
 * @param {number} healthFactor - Health factor (0-100)
 * @param {Object} options - Adjustment options
 * @returns {Object} Rate limit adjustment results
 */
export function adjustRateLimit(currentLimit, healthFactor, options = {}) {
  const {
    minLimit = 1,              // Minimum rate limit
    maxLimit = 1000,           // Maximum rate limit
    aggressiveness = 0.5,      // Adjustment aggressiveness (0-1)
    healthThreshold = 80,      // Health threshold for normal operation
    recoveryFactor = 0.1,      // Recovery speed factor
    degradationFactor = 0.3    // Degradation speed factor
  } = options;
  
  // Normalize health factor to 0-1 range
  const normalizedHealth = Math.max(0, Math.min(100, healthFactor)) / 100;
  
  // Calculate target adjustment factor
  let adjustmentFactor = 1;
  
  if (healthFactor > healthThreshold) {
    // Health is good, can increase rate limit
    const healthExcess = (healthFactor - healthThreshold) / (100 - healthThreshold);
    adjustmentFactor = 1 + (healthExcess * recoveryFactor * aggressiveness);
  } else {
    // Health is poor, should decrease rate limit
    const healthDeficit = (healthThreshold - healthFactor) / healthThreshold;
    adjustmentFactor = 1 - (healthDeficit * degradationFactor * aggressiveness);
  }
  
  // Apply adjustment
  const newLimit = currentLimit * adjustmentFactor;
  const clampedLimit = Math.max(minLimit, Math.min(maxLimit, newLimit));
  
  // Calculate adjustment details
  const absoluteChange = clampedLimit - currentLimit;
  const percentageChange = currentLimit > 0 ? (absoluteChange / currentLimit) * 100 : 0;
  
  return {
    newLimit: Math.round(clampedLimit),
    oldLimit: currentLimit,
    adjustmentFactor: adjustmentFactor,
    absoluteChange: absoluteChange,
    percentageChange: percentageChange,
    healthFactor: healthFactor,
    recommendation: healthFactor > healthThreshold ? 'increase' : 'decrease',
    confidence: Math.abs(healthFactor - healthThreshold) / 50 // 0-1 based on distance from threshold
  };
}

/**
 * Calculate adaptive rate limit using PID controller
 * @param {number} targetMetric - Target metric value (e.g., response time)
 * @param {number} currentMetric - Current metric value
 * @param {Object} pidState - PID controller state
 * @param {Object} options - PID options
 * @returns {Object} PID-based rate limit adjustment
 */
export function pidRateLimitController(targetMetric, currentMetric, pidState, options = {}) {
  const {
    kp = 0.5,              // Proportional gain
    ki = 0.1,              // Integral gain
    kd = 0.2,              // Derivative gain
    maxIntegral = 100,     // Maximum integral windup
    outputMin = 0.1,       // Minimum output (rate multiplier)
    outputMax = 2.0,       // Maximum output (rate multiplier)
    deltaTime = 1          // Time delta in seconds
  } = options;
  
  // Initialize PID state if not provided
  const state = {
    previousError: pidState?.previousError || 0,
    integral: pidState?.integral || 0,
    ...pidState
  };
  
  // Calculate error (negative means we're above target)
  const error = targetMetric - currentMetric;
  
  // Proportional term
  const proportional = kp * error;
  
  // Integral term (with windup protection)
  state.integral += error * deltaTime;
  state.integral = Math.max(-maxIntegral, Math.min(maxIntegral, state.integral));
  const integral = ki * state.integral;
  
  // Derivative term
  const derivative = kd * (error - state.previousError) / deltaTime;
  
  // Calculate PID output
  const pidOutput = proportional + integral + derivative;
  
  // Convert to rate multiplier (1.0 = no change, >1.0 = increase, <1.0 = decrease)
  const rateMultiplier = Math.max(outputMin, Math.min(outputMax, 1.0 + pidOutput));
  
  // Update state for next iteration
  state.previousError = error;
  
  return {
    rateMultiplier: rateMultiplier,
    pidOutput: pidOutput,
    components: {
      proportional: proportional,
      integral: integral,
      derivative: derivative
    },
    error: error,
    state: state,
    recommendation: rateMultiplier > 1.0 ? 'increase' : rateMultiplier < 1.0 ? 'decrease' : 'maintain'
  };
}

/**
 * Calculate rate limit using AIMD (Additive Increase Multiplicative Decrease)
 * @param {number} currentLimit - Current rate limit
 * @param {boolean} success - Whether last operation was successful
 * @param {Object} options - AIMD options
 * @returns {Object} AIMD adjustment results
 */
export function aimdRateLimitAdjustment(currentLimit, success, options = {}) {
  const {
    additiveIncrease = 1,      // Additive increase amount
    multiplicativeDecrease = 0.5, // Multiplicative decrease factor
    minLimit = 1,              // Minimum rate limit
    maxLimit = 1000,           // Maximum rate limit
    increaseThreshold = 0.95,  // Success rate threshold for increase
    decreaseThreshold = 0.8    // Success rate threshold for decrease
  } = options;
  
  let newLimit = currentLimit;
  let action = 'maintain';
  
  if (success) {
    // Additive increase on success
    newLimit = currentLimit + additiveIncrease;
    action = 'increase';
  } else {
    // Multiplicative decrease on failure
    newLimit = currentLimit * multiplicativeDecrease;
    action = 'decrease';
  }
  
  // Apply bounds
  newLimit = Math.max(minLimit, Math.min(maxLimit, newLimit));
  
  const change = newLimit - currentLimit;
  const percentageChange = currentLimit > 0 ? (change / currentLimit) * 100 : 0;
  
  return {
    newLimit: Math.round(newLimit),
    oldLimit: currentLimit,
    change: change,
    percentageChange: percentageChange,
    action: action,
    success: success,
    algorithm: 'AIMD'
  };
}

// =============================================
// PRIORITY QUEUE ALGORITHMS
// =============================================

/**
 * Calculate weighted priorities for queue scheduling
 * @param {Object[]} items - Queue items with {id, baseWeight, urgency, age}
 * @param {Object} options - Weight calculation options
 * @returns {Object[]} Items with calculated priorities
 */
export function calculateQueuePriorities(items, options = {}) {
  const {
    weightFactor = 0.4,        // Base weight importance
    urgencyFactor = 0.3,       // Urgency importance
    ageFactor = 0.3,           // Age importance (anti-starvation)
    maxAge = 60000,            // Maximum age in milliseconds
    urgencyDecay = 0.1         // Urgency decay factor
  } = options;
  
  if (items.length === 0) return [];
  
  const currentTime = Date.now();
  const maxWeight = Math.max(...items.map(item => item.baseWeight || 1));
  const maxUrgency = Math.max(...items.map(item => item.urgency || 1));
  
  return items.map(item => {
    const age = currentTime - (item.timestamp || currentTime);
    const normalizedAge = Math.min(age / maxAge, 1);
    const normalizedWeight = (item.baseWeight || 1) / maxWeight;
    const normalizedUrgency = (item.urgency || 1) / maxUrgency;
    
    // Apply urgency decay based on age
    const decayedUrgency = normalizedUrgency * Math.exp(-urgencyDecay * normalizedAge);
    
    // Calculate composite priority
    const priority = (
      weightFactor * normalizedWeight +
      urgencyFactor * decayedUrgency +
      ageFactor * normalizedAge
    );
    
    return {
      ...item,
      priority: priority,
      normalizedWeight: normalizedWeight,
      normalizedUrgency: normalizedUrgency,
      decayedUrgency: decayedUrgency,
      normalizedAge: normalizedAge,
      age: age
    };
  }).sort((a, b) => b.priority - a.priority); // Higher priority first
}

/**
 * Implement weighted fair scheduling for priority queues
 * @param {Object[]} queues - Array of queue objects with {id, weight, items}
 * @param {number} maxItems - Maximum items to schedule
 * @returns {Object} Scheduling results
 */
export function weightedFairScheduling(queues, maxItems = 100) {
  if (queues.length === 0) return { scheduledItems: [], queueStates: [] };
  
  const totalWeight = queues.reduce((sum, queue) => sum + (queue.weight || 1), 0);
  let remainingItems = maxItems;
  const scheduledItems = [];
  
  // Calculate initial allocations based on weights
  const queueStates = queues.map(queue => {
    const allocation = Math.floor((queue.weight / totalWeight) * maxItems);
    const availableItems = queue.items ? queue.items.length : 0;
    
    return {
      id: queue.id,
      weight: queue.weight,
      allocation: allocation,
      availableItems: availableItems,
      scheduledCount: 0,
      deficit: 0
    };
  });
  
  // First pass: schedule up to allocation for each queue
  for (const queueState of queueStates) {
    const queue = queues.find(q => q.id === queueState.id);
    const itemsToSchedule = Math.min(
      queueState.allocation,
      queueState.availableItems,
      remainingItems
    );
    
    if (queue && queue.items && itemsToSchedule > 0) {
      const queueItems = queue.items.slice(0, itemsToSchedule);
      scheduledItems.push(...queueItems.map(item => ({
        ...item,
        queueId: queue.id,
        schedulingRound: 1
      })));
      
      queueState.scheduledCount = itemsToSchedule;
      remainingItems -= itemsToSchedule;
    }
    
    // Calculate deficit (unused allocation)
    queueState.deficit = Math.max(0, queueState.allocation - queueState.scheduledCount);
  }
  
  // Second pass: redistribute unused allocations
  let round = 2;
  while (remainingItems > 0 && queueStates.some(qs => qs.scheduledCount < qs.availableItems)) {
    let itemsScheduledThisRound = 0;
    
    // Sort by deficit (highest first) for fair redistribution
    const sortedStates = [...queueStates].sort((a, b) => b.deficit - a.deficit);
    
    for (const queueState of sortedStates) {
      if (remainingItems <= 0) break;
      
      const queue = queues.find(q => q.id === queueState.id);
      const remainingInQueue = queueState.availableItems - queueState.scheduledCount;
      
      if (queue && queue.items && remainingInQueue > 0) {
        const itemsToSchedule = Math.min(1, remainingInQueue, remainingItems);
        const startIndex = queueState.scheduledCount;
        const queueItems = queue.items.slice(startIndex, startIndex + itemsToSchedule);
        
        scheduledItems.push(...queueItems.map(item => ({
          ...item,
          queueId: queue.id,
          schedulingRound: round
        })));
        
        queueState.scheduledCount += itemsToSchedule;
        remainingItems -= itemsToSchedule;
        itemsScheduledThisRound += itemsToSchedule;
      }
    }
    
    if (itemsScheduledThisRound === 0) break; // No progress made
    round++;
  }
  
  return {
    scheduledItems: scheduledItems,
    queueStates: queueStates,
    totalScheduled: scheduledItems.length,
    remainingCapacity: remainingItems,
    rounds: round - 1
  };
}

/**
 * Calculate queue fairness metrics
 * @param {Object[]} queueStates - Queue states from weighted fair scheduling
 * @param {number} totalScheduled - Total items scheduled
 * @returns {Object} Fairness analysis
 */
export function analyzeQueueFairness(queueStates, totalScheduled) {
  if (queueStates.length === 0) {
    return {
      fairnessIndex: 1,
      maxDeviation: 0,
      weightedFairness: 1
    };
  }
  
  const totalWeight = queueStates.reduce((sum, qs) => sum + qs.weight, 0);
  
  // Calculate expected vs actual scheduling ratios
  const fairnessMetrics = queueStates.map(queueState => {
    const expectedRatio = queueState.weight / totalWeight;
    const actualRatio = totalScheduled > 0 ? queueState.scheduledCount / totalScheduled : 0;
    const deviation = Math.abs(expectedRatio - actualRatio);
    
    return {
      queueId: queueState.id,
      weight: queueState.weight,
      expectedRatio: expectedRatio,
      actualRatio: actualRatio,
      deviation: deviation,
      scheduledCount: queueState.scheduledCount,
      availableItems: queueState.availableItems,
      utilization: queueState.availableItems > 0 ? 
        queueState.scheduledCount / queueState.availableItems : 0
    };
  });
  
  // Calculate Jain's fairness index
  const sumActualRatios = fairnessMetrics.reduce((sum, fm) => sum + fm.actualRatio, 0);
  const sumSquaredActualRatios = fairnessMetrics.reduce((sum, fm) => sum + fm.actualRatio * fm.actualRatio, 0);
  
  const fairnessIndex = sumSquaredActualRatios > 0 ? 
    (sumActualRatios * sumActualRatios) / (queueStates.length * sumSquaredActualRatios) : 1;
  
  // Calculate maximum deviation from expected ratios
  const maxDeviation = Math.max(...fairnessMetrics.map(fm => fm.deviation));
  
  // Calculate weighted fairness (considering queue weights)
  const weightedDeviations = fairnessMetrics.map(fm => fm.deviation * fm.weight);
  const weightedFairness = 1 - (weightedDeviations.reduce((sum, wd) => sum + wd, 0) / totalWeight);
  
  return {
    fairnessIndex: fairnessIndex,
    maxDeviation: maxDeviation,
    weightedFairness: Math.max(0, weightedFairness),
    queueMetrics: fairnessMetrics,
    overallUtilization: totalScheduled > 0 ? 
      queueStates.reduce((sum, qs) => sum + qs.scheduledCount, 0) / totalScheduled : 0
  };
}

// =============================================
// PERFORMANCE REGRESSION DETECTION
// =============================================

/**
 * Detect performance regression using statistical methods
 * @param {number[]} baseline - Baseline performance measurements
 * @param {number[]} current - Current performance measurements
 * @param {Object} options - Detection options
 * @returns {Object} Regression detection results
 */
export function detectPerformanceRegression(baseline, current, options = {}) {
  const {
    significanceLevel = 0.05,     // Statistical significance level
    minEffectSize = 0.2,          // Minimum effect size to consider significant
    minSampleSize = 10,           // Minimum sample size for reliable results
    regressionThreshold = 1.1     // Threshold for regression (1.1 = 10% worse)
  } = options;
  
  if (baseline.length < minSampleSize || current.length < minSampleSize) {
    return {
      regression: false,
      confidence: 0,
      reason: 'insufficient_data',
      baseline: { mean: 0, stdDev: 0 },
      current: { mean: 0, stdDev: 0 }
    };
  }
  
  // Calculate basic statistics
  const baselineStats = {
    mean: baseline.reduce((sum, val) => sum + val, 0) / baseline.length,
    stdDev: Math.sqrt(baseline.reduce((sum, val) => {
      const diff = val - (baseline.reduce((s, v) => s + v, 0) / baseline.length);
      return sum + diff * diff;
    }, 0) / (baseline.length - 1))
  };
  
  const currentStats = {
    mean: current.reduce((sum, val) => sum + val, 0) / current.length,
    stdDev: Math.sqrt(current.reduce((sum, val) => {
      const diff = val - (current.reduce((s, v) => s + v, 0) / current.length);
      return sum + diff * diff;
    }, 0) / (current.length - 1))
  };
  
  // Perform two-sample t-test
  const tTestResult = twoSampleTTest(baseline, current, significanceLevel);
  
  // Calculate effect size (Cohen's d)
  const pooledStdDev = Math.sqrt(
    ((baseline.length - 1) * baselineStats.stdDev * baselineStats.stdDev +
     (current.length - 1) * currentStats.stdDev * currentStats.stdDev) /
    (baseline.length + current.length - 2)
  );
  
  const effectSize = pooledStdDev > 0 ? 
    (currentStats.mean - baselineStats.mean) / pooledStdDev : 0;
  
  // Calculate practical significance (percentage change)
  const percentageChange = baselineStats.mean > 0 ? 
    ((currentStats.mean - baselineStats.mean) / baselineStats.mean) * 100 : 0;
  
  const practicallySignificant = Math.abs(percentageChange) > ((regressionThreshold - 1) * 100);
  
  // Determine if there's a regression
  const isRegression = currentStats.mean > baselineStats.mean && // Performance got worse
                      tTestResult.significant &&                   // Statistically significant
                      Math.abs(effectSize) >= minEffectSize &&     // Practically significant effect
                      practicallySignificant;                      // Exceeds threshold
  
  // Calculate confidence in the result
  const confidence = Math.min(1, 
    (1 - tTestResult.pValue) * // Statistical confidence
    Math.min(1, Math.abs(effectSize) / minEffectSize) * // Effect size confidence
    Math.min(1, Math.min(baseline.length, current.length) / minSampleSize) // Sample size confidence
  );
  
  return {
    regression: isRegression,
    confidence: confidence,
    statistics: {
      baseline: baselineStats,
      current: currentStats,
      meanDifference: currentStats.mean - baselineStats.mean,
      percentageChange: percentageChange,
      effectSize: effectSize,
      tTest: tTestResult
    },
    thresholds: {
      significanceLevel: significanceLevel,
      minEffectSize: minEffectSize,
      regressionThreshold: regressionThreshold
    },
    interpretation: {
      statisticallySignificant: tTestResult.significant,
      practicallySignificant: practicallySignificant,
      largeEffectSize: Math.abs(effectSize) >= 0.8,
      severity: Math.abs(percentageChange) > 50 ? 'critical' :
                Math.abs(percentageChange) > 20 ? 'major' :
                Math.abs(percentageChange) > 10 ? 'moderate' : 'minor'
    }
  };
}

/**
 * Perform trend analysis for performance regression
 * @param {Object[]} timeSeries - Time series data with {timestamp, value}
 * @param {Object} options - Analysis options
 * @returns {Object} Trend analysis results
 */
export function analyzePerformanceTrend(timeSeries, options = {}) {
  const {
    windowSize = 20,           // Window size for trend analysis
    trendThreshold = 0.05,     // Minimum slope for significant trend
    seasonalityWindow = 24     // Window for seasonality detection
  } = options;
  
  if (timeSeries.length < windowSize) {
    return {
      trend: 'insufficient_data',
      slope: 0,
      rSquared: 0,
      forecast: null
    };
  }
  
  // Sort by timestamp
  const sortedData = [...timeSeries].sort((a, b) => a.timestamp - b.timestamp);
  
  // Linear regression for trend analysis
  const n = sortedData.length;
  const x = sortedData.map((_, i) => i); // Use indices as x values
  const y = sortedData.map(point => point.value);
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const meanY = sumY / n;
  const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  const residualSumSquares = y.reduce((sum, val, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(val - predicted, 2);
  }, 0);
  
  const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
  
  // Determine trend direction
  let trendDirection = 'stable';
  if (Math.abs(slope) > trendThreshold) {
    trendDirection = slope > 0 ? 'degrading' : 'improving';
  }
  
  // Simple forecast for next few points
  const forecastHorizon = 5;
  const forecast = [];
  const lastTimestamp = sortedData[sortedData.length - 1].timestamp;
  const avgTimeDelta = sortedData.length > 1 ? 
    (lastTimestamp - sortedData[0].timestamp) / (sortedData.length - 1) : 0;
  
  for (let i = 1; i <= forecastHorizon; i++) {
    const predictedValue = slope * (n + i - 1) + intercept;
    forecast.push({
      timestamp: lastTimestamp + i * avgTimeDelta,
      predictedValue: predictedValue,
      horizon: i
    });
  }
  
  // Seasonality analysis (basic)
  let seasonalityDetected = false;
  if (sortedData.length >= seasonalityWindow * 2) {
    const seasonalCorrelations = [];
    
    for (let lag = 1; lag <= seasonalityWindow; lag++) {
      const laggedValues = y.slice(lag);
      const originalValues = y.slice(0, -lag);
      
      if (laggedValues.length > 0) {
        const correlation = pearsonCorrelation(originalValues, laggedValues);
        seasonalCorrelations.push({
          lag: lag,
          correlation: correlation.correlation
        });
      }
    }
    
    // Check for significant seasonal correlation
    const maxSeasonalCorr = Math.max(...seasonalCorrelations.map(sc => Math.abs(sc.correlation)));
    seasonalityDetected = maxSeasonalCorr > 0.3;
  }
  
  return {
    trend: trendDirection,
    slope: slope,
    intercept: intercept,
    rSquared: rSquared,
    forecast: forecast,
    seasonality: {
      detected: seasonalityDetected,
      strength: seasonalityDetected ? 'weak' : 'none' // Simplified classification
    },
    statistics: {
      dataPoints: n,
      timeSpan: lastTimestamp - sortedData[0].timestamp,
      avgValue: meanY,
      valueRange: Math.max(...y) - Math.min(...y)
    }
  };
}

// =============================================
// CAPACITY PLANNING USING UTILIZATION THEORY
// =============================================

/**
 * Calculate system capacity using queueing theory
 * @param {Object} systemMetrics - System performance metrics
 * @param {Object} options - Capacity planning options
 * @returns {Object} Capacity planning results
 */
export function calculateSystemCapacity(systemMetrics, options = {}) {
  const {
    targetUtilization = 0.8,    // Target utilization (80%)
    targetResponseTime = 100,   // Target response time (ms)
    safetyMargin = 0.2,         // Safety margin (20%)
    growthFactor = 1.5          // Expected growth factor
  } = options;
  
  const {
    arrivalRate,      // Requests per second
    serviceTime,      // Average service time per request (seconds)
    currentServers,   // Current number of servers
    responseTime      // Current average response time
  } = systemMetrics;
  
  if (!arrivalRate || !serviceTime) {
    return {
      recommendedCapacity: 1,
      currentUtilization: 0,
      reason: 'insufficient_metrics'
    };
  }
  
  // Current system analysis
  const serviceRate = 1 / serviceTime; // Service rate per server
  const totalServiceRate = serviceRate * (currentServers || 1);
  const currentUtilization = arrivalRate / totalServiceRate;
  
  // M/M/c queue calculations (Erlang-C model)
  const rho = arrivalRate / serviceRate; // Traffic intensity
  
  // Calculate minimum servers needed to handle load
  const minServers = Math.ceil(rho);
  
  // Calculate servers needed for target utilization
  const serversForUtilization = Math.ceil(arrivalRate / (serviceRate * targetUtilization));
  
  // Calculate servers needed for target response time (using M/M/c approximation)
  let serversForResponseTime = minServers;
  
  if (targetResponseTime && responseTime) {
    // Simplified approximation: response time is inversely related to spare capacity
    const currentSpareCapacity = totalServiceRate - arrivalRate;
    const requiredSpareCapacity = (responseTime / targetResponseTime) * currentSpareCapacity;
    const requiredTotalCapacity = arrivalRate + requiredSpareCapacity;
    serversForResponseTime = Math.ceil(requiredTotalCapacity / serviceRate);
  }
  
  // Take the maximum of all requirements
  let recommendedServers = Math.max(
    minServers,
    serversForUtilization,
    serversForResponseTime
  );
  
  // Apply safety margin
  recommendedServers = Math.ceil(recommendedServers * (1 + safetyMargin));
  
  // Apply growth factor
  const plannedCapacity = Math.ceil(recommendedServers * growthFactor);
  
  // Calculate capacity headroom
  const maxSustainableRate = recommendedServers * serviceRate * targetUtilization;
  const headroom = maxSustainableRate - arrivalRate;
  const headroomPercentage = arrivalRate > 0 ? (headroom / arrivalRate) * 100 : 0;
  
  return {
    current: {
      servers: currentServers || 1,
      utilization: currentUtilization,
      arrivalRate: arrivalRate,
      serviceRate: totalServiceRate,
      responseTime: responseTime
    },
    recommended: {
      servers: recommendedServers,
      utilizationAtRecommended: arrivalRate / (recommendedServers * serviceRate),
      maxSustainableRate: maxSustainableRate,
      headroom: headroom,
      headroomPercentage: headroomPercentage
    },
    planned: {
      servers: plannedCapacity,
      utilizationAtPlanned: arrivalRate / (plannedCapacity * serviceRate),
      maxSustainableRate: plannedCapacity * serviceRate * targetUtilization
    },
    requirements: {
      minServers: minServers,
      serversForUtilization: serversForUtilization,
      serversForResponseTime: serversForResponseTime
    },
    parameters: {
      targetUtilization: targetUtilization,
      targetResponseTime: targetResponseTime,
      safetyMargin: safetyMargin,
      growthFactor: growthFactor
    }
  };
}

/**
 * Calculate resource utilization and bottleneck analysis
 * @param {Object[]} resources - Array of resource objects with utilization data
 * @param {Object} options - Analysis options
 * @returns {Object} Utilization analysis results
 */
export function analyzeResourceUtilization(resources, options = {}) {
  const {
    utilizationThreshold = 0.8,  // High utilization threshold
    bottleneckThreshold = 0.9,   // Bottleneck threshold
    timeWindow = 3600000         // Analysis time window (1 hour)
  } = options;
  
  if (resources.length === 0) {
    return {
      bottlenecks: [],
      overutilized: [],
      utilizationDistribution: {}
    };
  }
  
  const analysis = resources.map(resource => {
    const utilizations = resource.utilizationHistory || [resource.currentUtilization || 0];
    
    // Calculate utilization statistics
    const avgUtilization = utilizations.reduce((sum, u) => sum + u, 0) / utilizations.length;
    const maxUtilization = Math.max(...utilizations);
    const minUtilization = Math.min(...utilizations);
    
    // Calculate percentiles
    const sortedUtils = [...utilizations].sort((a, b) => a - b);
    const p95Utilization = calculatePercentile(sortedUtils, 95);
    const p99Utilization = calculatePercentile(sortedUtils, 99);
    
    // Calculate utilization variance
    const variance = utilizations.reduce((sum, u) => sum + Math.pow(u - avgUtilization, 2), 0) / utilizations.length;
    const stdDev = Math.sqrt(variance);
    
    // Classify resource status
    let status = 'normal';
    if (p95Utilization >= bottleneckThreshold) {
      status = 'bottleneck';
    } else if (avgUtilization >= utilizationThreshold) {
      status = 'high_utilization';
    } else if (avgUtilization < 0.3) {
      status = 'underutilized';
    }
    
    return {
      ...resource,
      statistics: {
        avgUtilization: avgUtilization,
        maxUtilization: maxUtilization,
        minUtilization: minUtilization,
        p95Utilization: p95Utilization,
        p99Utilization: p99Utilization,
        stdDev: stdDev,
        variance: variance
      },
      status: status,
      isBottleneck: status === 'bottleneck',
      isOverutilized: avgUtilization >= utilizationThreshold
    };
  });
  
  // Identify bottlenecks and overutilized resources
  const bottlenecks = analysis.filter(r => r.isBottleneck);
  const overutilized = analysis.filter(r => r.isOverutilized);
  
  // Calculate system-wide metrics
  const systemAvgUtilization = analysis.reduce((sum, r) => sum + r.statistics.avgUtilization, 0) / analysis.length;
  const systemMaxUtilization = Math.max(...analysis.map(r => r.statistics.maxUtilization));
  
  // Utilization distribution
  const utilizationBuckets = {
    low: analysis.filter(r => r.statistics.avgUtilization < 0.3).length,
    medium: analysis.filter(r => r.statistics.avgUtilization >= 0.3 && r.statistics.avgUtilization < 0.7).length,
    high: analysis.filter(r => r.statistics.avgUtilization >= 0.7 && r.statistics.avgUtilization < 0.9).length,
    critical: analysis.filter(r => r.statistics.avgUtilization >= 0.9).length
  };
  
  return {
    resources: analysis,
    bottlenecks: bottlenecks,
    overutilized: overutilized,
    systemMetrics: {
      avgUtilization: systemAvgUtilization,
      maxUtilization: systemMaxUtilization,
      bottleneckCount: bottlenecks.length,
      overutilizedCount: overutilized.length
    },
    utilizationDistribution: utilizationBuckets,
    recommendations: generateUtilizationRecommendations(analysis, bottlenecks, overutilized)
  };
}

/**
 * Generate recommendations based on utilization analysis
 * @param {Object[]} analysis - Resource analysis results
 * @param {Object[]} bottlenecks - Identified bottlenecks
 * @param {Object[]} overutilized - Overutilized resources
 * @returns {string[]} Array of recommendations
 */
function generateUtilizationRecommendations(analysis, bottlenecks, overutilized) {
  const recommendations = [];
  
  if (bottlenecks.length > 0) {
    recommendations.push(`Critical: ${bottlenecks.length} bottleneck(s) detected - immediate capacity increase needed`);
    bottlenecks.forEach(resource => {
      recommendations.push(`Scale up ${resource.name || resource.id} (${(resource.statistics.p95Utilization * 100).toFixed(1)}% P95 utilization)`);
    });
  }
  
  if (overutilized.length > 0) {
    recommendations.push(`Warning: ${overutilized.length} resource(s) highly utilized - plan capacity increase`);
  }
  
  const underutilized = analysis.filter(r => r.statistics.avgUtilization < 0.3);
  if (underutilized.length > 0) {
    recommendations.push(`Optimization: ${underutilized.length} resource(s) underutilized - consider consolidation`);
  }
  
  const highVariance = analysis.filter(r => r.statistics.stdDev > 0.3);
  if (highVariance.length > 0) {
    recommendations.push(`Stability: ${highVariance.length} resource(s) have high utilization variance - investigate load patterns`);
  }
  
  return recommendations;
}

/**
 * Helper function to calculate percentile
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

// Export all functions
export default {
  // Hypothesis Testing
  oneSampleTTest,
  twoSampleTTest,
  chiSquareGoodnessOfFit,
  runsTest,
  
  // Correlation Analysis
  pearsonCorrelation,
  spearmanCorrelation,
  crossCorrelationMatrix,
  
  // Control Charts
  calculateXBarControlLimits,
  calculateRChartControlLimits,
  detectOutOfControlConditions,
  
  // Confidence Intervals
  calculateMeanConfidenceInterval,
  calculateProportionConfidenceInterval,
  calculatePredictionInterval,
  
  // Exponential Backoff
  calculateExponentialBackoff,
  optimizeBackoffParameters,
  
  // Rate Limit Adjustment
  adjustRateLimit,
  pidRateLimitController,
  aimdRateLimitAdjustment,
  
  // Priority Queues
  calculateQueuePriorities,
  weightedFairScheduling,
  analyzeQueueFairness,
  
  // Performance Regression
  detectPerformanceRegression,
  analyzePerformanceTrend,
  
  // Capacity Planning
  calculateSystemCapacity,
  analyzeResourceUtilization,
  
  // Utility
  calculatePercentile
};