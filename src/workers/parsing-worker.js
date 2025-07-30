/**
 * PARSING WORKER THREAD - RENAISSANCE GRADE  ✅ FIXED
 *
 * Dedicated worker for CPU-intensive parsing operations.
 * Handles LP parsing, price calculations, and mathematical operations
 * without blocking the main thread.
 *
 * Supported Operations:
 * - parseRaydiumLP            (binary pool parsing)
 * - parseOrcaLP               (whirlpool parsing)
 * - calculatePrice            (price math)
 * - calculateTVL              (liquidity / TVL math)
 * - batchMintParsing          (multi-mint scan)
 * - mathematicalOperations    (Renaissance math engine)
 * - validatePoolInvariants    (security checks)
 * - riskCalculations          (risk engine)
 */

import { parentPort, workerData, isMainThread } from 'worker_threads';

// Import layout constants
let RAYDIUM_LAYOUT_CONSTANTS, ORCA_LAYOUT_CONSTANTS, MINT_LAYOUT_CONSTANTS;
try {
  const layoutConstants = await import('../constants/layout-constants.js');
  RAYDIUM_LAYOUT_CONSTANTS = layoutConstants.RAYDIUM_LAYOUT_CONSTANTS;
  ORCA_LAYOUT_CONSTANTS = layoutConstants.ORCA_LAYOUT_CONSTANTS;
  MINT_LAYOUT_CONSTANTS = layoutConstants.MINT_LAYOUT_CONSTANTS;
} catch (error) {
  console.error('Failed to import layout constants:', error.message);
  process.exit(1);
}

// Mock PublicKey class to avoid import issues
class MockPublicKey {
  constructor(buffer) {
    if (buffer instanceof Uint8Array || Buffer.isBuffer(buffer)) {
      this.buffer = buffer;
    } else {
      throw new Error('Invalid public key input');
    }
  }
  
  toString() {
    // Return a mock base58 string
    return Buffer.from(this.buffer).toString('base64').slice(0, 44).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

const PublicKey = MockPublicKey;
console.log('✅ Using mock PublicKey implementation (no Solana deps)');

// CRITICAL FIX: Prevent execution outside worker context
if (isMainThread || !parentPort) {
  console.log('⚠️  Parsing worker should not be imported directly in main thread');
  console.log('   Use WorkerPoolManager to create workers properly');
  if (!isMainThread) {
    console.log('⚠️  parentPort is null - worker not properly initialized');
  }
  process.exit(0);
}


/* ─────────────────────────  GLOBAL SAFETY GUARDS  ───────────────────────── */

const workerId = workerData?.workerId ?? 'unknown';

process.on('uncaughtException', (err) => {
  console.error(`❌ Worker ${workerId} uncaughtException:`, err);
  parentPort?.postMessage({
    taskId: 0,
    error: `uncaughtException: ${err.message}`,
    stack: err.stack,
    workerId,
    type: 'internal'
  });
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error(`❌ Worker ${workerId} unhandledRejection:`, err);
  parentPort?.postMessage({
    taskId: 0,
    error: `unhandledRejection: ${err.message}`,
    stack: err.stack,
    workerId,
    type: 'internal'
  });
});

console.log(`Parsing worker ${workerId} started`);

/* ─────────────────────────  PERFORMANCE METRICS  ───────────────────────── */

let taskCount = 0;
let totalExecutionTime = 0;

/* ───────────────────────────  MESSAGE HANDLER  ─────────────────────────── */

parentPort.on('message', async (message) => {
  const { taskId, type, data, timestamp } = message;
  const startTime = Date.now();

  try {
    /* Single execution path – eliminates accidental duplicates */
    const result = await executeTask(type, data);

    parentPort.postMessage({
      taskId,
      result,
      startTime: timestamp,
      executionTime: Date.now() - startTime,
      workerId,
      type
    });

    /* metrics */
    taskCount++;
    totalExecutionTime += Date.now() - startTime;

  } catch (error) {
    /* guaranteed error response so manager never waits until timeout */
    parentPort.postMessage({
      taskId,
      error: error.message,
      stack: error.stack,
      startTime: timestamp,
      executionTime: Date.now() - startTime,
      workerId,
      type
    });
  }
});

/* ───────────────────────────  TASK ROUTER  ─────────────────────────────── */

async function executeTask(type, data) {
  switch (type) {
    case 'parseRaydiumLP':
      return await parseRaydiumLP(data);
    case 'parseOrcaLP':
      return await parseOrcaLP(data);
    case 'calculatePrice':
      return calculatePrice(data);
    case 'calculateTVL':
      return calculateTVL(data);
    case 'batchMintParsing':
      return batchMintParsing(data);
    case 'mathematicalOperations':
      return mathematicalOperations(data);
    case 'validatePoolInvariants':
      return validatePoolInvariants(data);
    case 'riskCalculations':
      return riskCalculations(data);
    default:
      throw new Error(`Unknown task type: ${type}`);
  }
}

/* ───────────────────────────  DOMAIN FUNCTIONS  ────────────────────────── */

/* Parse Raydium LP account data */
async function parseRaydiumLP(data) {
  try {
    const { accountDataBuffer } = data;
    if (!accountDataBuffer) {
      throw new Error('Missing accountDataBuffer in parseRaydiumLP data');
    }
    
    const buffer = Buffer.from(accountDataBuffer);

    if (buffer.length < 752) {
      throw new Error(`Invalid Raydium pool data length: ${buffer.length}`);
    }

    const status        = readUInt64LE(buffer, RAYDIUM_LAYOUT_CONSTANTS.STATUS_OFFSET);
    const baseDecimals  = readUInt64LE(buffer, RAYDIUM_LAYOUT_CONSTANTS.BASE_DECIMALS_OFFSET);
    const quoteDecimals = readUInt64LE(buffer, RAYDIUM_LAYOUT_CONSTANTS.QUOTE_DECIMALS_OFFSET);

    const baseMint  = bufferToPublicKey(buffer.slice(RAYDIUM_LAYOUT_CONSTANTS.BASE_MINT_OFFSET,  RAYDIUM_LAYOUT_CONSTANTS.BASE_MINT_OFFSET  + 32)).toString();
    const quoteMint = bufferToPublicKey(buffer.slice(RAYDIUM_LAYOUT_CONSTANTS.QUOTE_MINT_OFFSET, RAYDIUM_LAYOUT_CONSTANTS.QUOTE_MINT_OFFSET + 32)).toString();
    const lpMint    = bufferToPublicKey(buffer.slice(RAYDIUM_LAYOUT_CONSTANTS.LP_MINT_OFFSET,    RAYDIUM_LAYOUT_CONSTANTS.LP_MINT_OFFSET    + 32)).toString();

    const baseVault  = bufferToPublicKey(buffer.slice(RAYDIUM_LAYOUT_CONSTANTS.BASE_VAULT_OFFSET,  RAYDIUM_LAYOUT_CONSTANTS.BASE_VAULT_OFFSET  + 32)).toString();
    const quoteVault = bufferToPublicKey(buffer.slice(RAYDIUM_LAYOUT_CONSTANTS.QUOTE_VAULT_OFFSET, RAYDIUM_LAYOUT_CONSTANTS.QUOTE_VAULT_OFFSET + 32)).toString();

    return {
      isLiquidityPool: Number(status) === 6,
      dex: 'raydium',
      baseMint,
      quoteMint,
      lpMint,
      baseDecimals : Number(baseDecimals),
      quoteDecimals: Number(quoteDecimals),
      baseVault,
      quoteVault,
      status: Number(status),
      parsedAt: Date.now(),
      dataLength: buffer.length
    };
  } catch (error) {
    console.error(`Error in parseRaydiumLP: ${error.message}`);
    throw error;
  }
}

/* Parse Orca Whirlpool LP account data */
async function parseOrcaLP(data) {
  try {
    const { accountDataBuffer } = data;
    if (!accountDataBuffer) {
      throw new Error('Missing accountDataBuffer in parseOrcaLP data');
    }
    
    const buffer = Buffer.from(accountDataBuffer);

    if (buffer.length < 653) {
      throw new Error(`Invalid Orca pool data length: ${buffer.length}`);
    }

    const tickSpacing = buffer.readUInt16LE(ORCA_LAYOUT_CONSTANTS.TICK_SPACING_OFFSET);
    const feeRate     = buffer.readUInt32LE(ORCA_LAYOUT_CONSTANTS.FEE_RATE_OFFSET);

    const liquidity      = readUInt128LE(buffer.slice(ORCA_LAYOUT_CONSTANTS.LIQUIDITY_OFFSET,   ORCA_LAYOUT_CONSTANTS.LIQUIDITY_OFFSET   + 16));
    const sqrtPriceX64   = readUInt128LE(buffer.slice(ORCA_LAYOUT_CONSTANTS.SQRT_PRICE_OFFSET,  ORCA_LAYOUT_CONSTANTS.SQRT_PRICE_OFFSET  + 16));
    const tickCurrentIdx = buffer.readInt32LE(ORCA_LAYOUT_CONSTANTS.TICK_CURRENT_INDEX_OFFSET);

    const tokenMintA = bufferToPublicKey(buffer.slice(ORCA_LAYOUT_CONSTANTS.TOKEN_MINT_A_OFFSET, ORCA_LAYOUT_CONSTANTS.TOKEN_MINT_A_OFFSET + 32)).toString();
    const tokenMintB = bufferToPublicKey(buffer.slice(ORCA_LAYOUT_CONSTANTS.TOKEN_MINT_B_OFFSET, ORCA_LAYOUT_CONSTANTS.TOKEN_MINT_B_OFFSET + 32)).toString();

    const tokenVaultA = bufferToPublicKey(buffer.slice(ORCA_LAYOUT_CONSTANTS.TOKEN_VAULT_A_OFFSET, ORCA_LAYOUT_CONSTANTS.TOKEN_VAULT_A_OFFSET + 32)).toString();
    const tokenVaultB = bufferToPublicKey(buffer.slice(ORCA_LAYOUT_CONSTANTS.TOKEN_VAULT_B_OFFSET, ORCA_LAYOUT_CONSTANTS.TOKEN_VAULT_B_OFFSET + 32)).toString();

    return {
      isLiquidityPool : liquidity > BigInt(0),
      dex             : 'orca',
      poolType        : 'whirlpool',
      tokenMintA,
      tokenMintB,
      tokenVaultA,
      tokenVaultB,
      liquidity       : liquidity.toString(),
      liquidityNumber : Number(liquidity),
      sqrtPriceX64    : sqrtPriceX64.toString(),
      tickCurrentIndex: tickCurrentIdx,
      tickSpacing,
      feeRate,
      parsedAt        : Date.now(),
      dataLength      : buffer.length
    };
  } catch (error) {
    console.error(`Error in parseOrcaLP: ${error.message}`);
    throw error;
  }
}

/* Calculate price from reserves / sqrtPrice */
function calculatePrice(data) {
  const { sqrtPriceX64, baseReserve, quoteReserve, decimalsA, decimalsB, priceType } = data;

  let price, priceInverted;

  if (priceType === 'whirlpool') {
    const sqrtPriceNumber = Number(BigInt(sqrtPriceX64)) / 2 ** 64;
    price = sqrtPriceNumber ** 2;
    priceInverted = price > 0 ? 1 / price : 0;
  } else {
    const baseReserveUI  = Number(BigInt(baseReserve))  / 10 ** decimalsA;
    const quoteReserveUI = Number(BigInt(quoteReserve)) / 10 ** decimalsB;
    price        = baseReserveUI > 0 ? quoteReserveUI / baseReserveUI : 0;
    priceInverted = price > 0 ? 1 / price : 0;
  }

  return { price, priceInverted, calculatedAt: Date.now() };
}

/* Calculate TVL and liquidity metrics */
function calculateTVL(data) {
  const { baseReserve, quoteReserve, decimalsA, decimalsB, price, basePrice, quotePrice } = data;

  const baseReserveUI  = Number(BigInt(baseReserve))  / 10 ** decimalsA;
  const quoteReserveUI = Number(BigInt(quoteReserve)) / 10 ** decimalsB;

  const tvlQuote = quoteReserveUI + baseReserveUI * price;
  let tvlUSD = tvlQuote;

  if (quotePrice > 0) {
    tvlUSD = tvlQuote * quotePrice;
  } else if (basePrice > 0) {
    tvlUSD = baseReserveUI * basePrice + quoteReserveUI * price * basePrice;
  }

  const liquidityScore = Math.min(100, Math.max(0, Math.log10(tvlUSD) * 10));

  return {
    baseReserveUI,
    quoteReserveUI,
    tvlQuote,
    tvlUSD,
    liquidityScore,
    tradingCapacity: {
      small : tvlUSD >= 1_000,
      medium: tvlUSD >= 10_000,
      large : tvlUSD >= 50_000
    },
    calculatedAt: Date.now()
  };
}

/* Batch parse multiple mint accounts */
function batchMintParsing(data) {
  const { mintDataArray } = data;
  const results = {};

  for (const { mintAddress, accountData } of mintDataArray) {
    try {
      const buffer = Buffer.from(accountData);

      if (buffer.length < 82) {
        results[mintAddress] = { error: 'Invalid mint data length', decimals: null };
        continue;
      }

      const decimals      = buffer.readUInt8(MINT_LAYOUT_CONSTANTS.DECIMALS_OFFSET);
      const isInitialized = buffer.readUInt8(MINT_LAYOUT_CONSTANTS.IS_INITIALIZED_OFFSET) === 1;
      const supply        = readUInt64LE(buffer, MINT_LAYOUT_CONSTANTS.SUPPLY_OFFSET);

      if (!isInitialized) {
        results[mintAddress] = { error: 'Mint not initialized', decimals: null };
        continue;
      }

      if (decimals > 18) {
        results[mintAddress] = { error: 'Invalid decimals', decimals: null };
        continue;
      }

      results[mintAddress] = {
        decimals,
        supply        : supply.toString(),
        supplyNumber  : Number(supply),
        isInitialized,
        fetchedAt     : Date.now()
      };

    } catch (error) {
      results[mintAddress] = { error: error.message, decimals: null };
    }
  }
  return results;
}

/* Mathematical operations router */
function mathematicalOperations(data) {
  const { operation, parameters } = data;

  switch (operation) {
    case 'kalmanFilter':
      return kalmanFilter(parameters);
    case 'volatilityGARCH':
      return calculateGARCH(parameters);
    case 'bayesianInference':
      return bayesianInference(parameters);
    case 'kellyCriterion':
      return kellyCriterion(parameters);
    case 'blackScholes':
      return blackScholes(parameters);
    case 'meanReversion':
      return meanReversionTest(parameters);
    case 'cointegration':
      return cointegrationTest(parameters);
    default:
      throw new Error(`Unknown mathematical operation: ${operation}`);
  }
}

/* Validate pool invariants */
function validatePoolInvariants(data) {
  const { poolType, reserves, totalSupply, feeRate, priceHistory } = data;

  const validations = {
    reserveBalance   : true,
    supplyConsistency: true,
    feeRateValid     : true,
    priceStability   : true,
    manipulationRisk : 'low'
  };

  if (reserves.base <= 0 || reserves.quote <= 0) validations.reserveBalance = false;
  if (totalSupply <= 0) validations.supplyConsistency = false;
  if (feeRate < 0 || feeRate > 10_000) validations.feeRateValid = false;

  if (priceHistory && priceHistory.length > 1) {
    const priceChanges = [];
    for (let i = 1; i < priceHistory.length; i++) {
      priceChanges.push(Math.abs(priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1]);
    }
    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const maxChange = Math.max(...priceChanges);

    if (maxChange > 0.5) {
      validations.manipulationRisk = 'high';
      validations.priceStability = false;
    } else if (avgChange > 0.1) {
      validations.manipulationRisk = 'medium';
    }
  }

  return {
    isValid: Object.values(validations).every((v) => v === true || v === 'low'),
    validations,
    checkedAt: Date.now()
  };
}

/* Risk calculations */
function riskCalculations(data) {
  const { returns, positions, correlations, volatility } = data;

  const sortedReturns  = [...returns].sort((a, b) => a - b);
  const var95          = sortedReturns[Math.floor(sortedReturns.length * 0.05)];
  const var99          = sortedReturns[Math.floor(sortedReturns.length * 0.01)];
  const tailReturns    = sortedReturns.slice(0, Math.floor(sortedReturns.length * 0.05));
  const expectedShortfall = tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;

  let peak = -Infinity;
  let maxDD = 0;
  for (const ret of returns) {
    peak = Math.max(peak, ret);
    maxDD = Math.max(maxDD, (peak - ret) / peak);
  }

  return {
    var95,
    var99,
    expectedShortfall,
    sharpeRatio,
    maxDrawdown: maxDD,
    volatility,
    calculatedAt: Date.now()
  };
}

/* ───────────────  RENAISSANCE-GRADE MATH IMPLEMENTATIONS  ──────────────── */

function kalmanFilter(params) {
  const { observations, processNoise = 1e-5, measurementNoise = 1e-1 } = params;
  if (!observations || observations.length < 2) throw new Error('Kalman filter requires at least 2 observations');

  let x = observations[0];
  let P = 1.0;
  const Q = processNoise;
  const R = measurementNoise;

  const filtered = [x];
  const predictions = [];
  const confidenceIntervals = [];

  for (let i = 1; i < observations.length; i++) {
    const x_pred = x;
    const P_pred = P + Q;

    const K = P_pred / (P_pred + R);
    x = x_pred + K * (observations[i] - x_pred);
    P = (1 - K) * P_pred;

    filtered.push(x);
    predictions.push(x_pred);

    const confidence = 1.96 * Math.sqrt(P);
    confidenceIntervals.push({ lower: x - confidence, upper: x + confidence });
  }

  const nextPrediction = x;
  const nextConfidence = 1.96 * Math.sqrt(P + Q);

  return {
    filteredStates: filtered,
    predictions,
    confidenceIntervals,
    nextPrediction,
    nextConfidenceInterval: {
      lower: nextPrediction - nextConfidence,
      upper: nextPrediction + nextConfidence
    },
    finalVariance: P,
    kalmanGain: P / (P + R)
  };
}

function calculateGARCH(params) {
  const { returns, omega = 0.00001, alpha = 0.1, beta = 0.85 } = params;
  if (!returns || returns.length < 10) throw new Error('GARCH model requires at least 10 return observations');
  if (alpha + beta >= 1) throw new Error('GARCH model requires alpha + beta < 1 for stationarity');

  const sampleVar = returns.reduce((sum, r, i) => {
    const mean = returns.slice(0, i + 1).reduce((s, x) => s + x, 0) / (i + 1);
    return sum + (r - mean) ** 2;
  }, 0) / (returns.length - 1);

  const volatilities = [];
  const variances = [];
  let sigma2 = sampleVar;

  for (let i = 0; i < returns.length; i++) {
    if (i > 0) sigma2 = omega + alpha * returns[i - 1] ** 2 + beta * sigma2;
    variances.push(sigma2);
    volatilities.push(Math.sqrt(sigma2));
  }

  const forecasts = [];
  let forecastVar = sigma2;
  const longRunVar = omega / (1 - alpha - beta);

  for (let h = 1; h <= 10; h++) {
    if (h === 1) {
      forecastVar = omega + alpha * returns[returns.length - 1] ** 2 + beta * sigma2;
    } else {
      forecastVar = longRunVar + (alpha + beta) ** (h - 1) * (forecastVar - longRunVar);
    }
    forecasts.push({
      horizon: h,
      variance: forecastVar,
      volatility: Math.sqrt(forecastVar),
      annualizedVol: Math.sqrt(forecastVar * 252)
    });
  }

  return {
    currentVolatility: Math.sqrt(sigma2),
    annualizedVolatility: Math.sqrt(sigma2 * 252),
    volatilitySeries: volatilities,
    varianceSeries: variances,
    forecasts,
    longRunVolatility: Math.sqrt(longRunVar),
    parameters: { omega, alpha, beta },
    persistence: alpha + beta
  };
}

function bayesianInference(params) {
  const { priorMean, priorVariance, likelihood, observations } = params;
  if (!observations || observations.length === 0) throw new Error('Bayesian inference requires observations');

  let posteriorPrecision = 1 / priorVariance;
  let posteriorMean = priorMean * posteriorPrecision;

  const updates = [];

  for (const obs of observations) {
    const likelihoodPrecision = 1 / likelihood.variance;

    posteriorPrecision += likelihoodPrecision;
    posteriorMean = (posteriorMean + obs * likelihoodPrecision) / posteriorPrecision;
    posteriorMean *= posteriorPrecision;

    const posteriorVariance = 1 / posteriorPrecision;
    posteriorMean /= posteriorPrecision;

    updates.push({
      observation: obs,
      posteriorMean,
      posteriorVariance,
      posteriorStd: Math.sqrt(posteriorVariance),
      confidence95: {
        lower: posteriorMean - 1.96 * Math.sqrt(posteriorVariance),
        upper: posteriorMean + 1.96 * Math.sqrt(posteriorVariance)
      }
    });

    posteriorMean *= posteriorPrecision;
  }

  const finalPosteriorVariance = 1 / posteriorPrecision;
  const finalPosteriorMean = posteriorMean / posteriorPrecision;

  const marginalLikelihood = observations.reduce((ml, obs) => {
    const predictiveVariance = priorVariance + likelihood.variance;
    const density = (1 / Math.sqrt(2 * Math.PI * predictiveVariance)) *
      Math.exp(-0.5 * (obs - priorMean) ** 2 / predictiveVariance);
    return ml * density;
  }, 1);

  return {
    posteriorMean: finalPosteriorMean,
    posteriorVariance: finalPosteriorVariance,
    posteriorStd: Math.sqrt(finalPosteriorVariance),
    credibleInterval95: {
      lower: finalPosteriorMean - 1.96 * Math.sqrt(finalPosteriorVariance),
      upper: finalPosteriorMean + 1.96 * Math.sqrt(finalPosteriorVariance)
    },
    marginalLikelihood,
    updates,
    informationGain: Math.log(priorVariance / finalPosteriorVariance) / 2
  };
}

function kellyCriterion(params) {
  const { winRate, avgWin, avgLoss, capital = 100_000 } = params;
  if (winRate <= 0 || winRate >= 1) throw new Error('Win rate must be between 0 and 1');
  if (avgWin <= 0 || avgLoss <= 0) throw new Error('Average win and loss must be positive');

  const b = avgWin / avgLoss;
  const p = winRate;
  const q = 1 - winRate;

  const kellyFraction = (b * p - q) / b;
  const kellyFractionCapped = Math.max(0, Math.min(0.25, kellyFraction));

  const expectedGrowth = p * Math.log(1 + kellyFraction * b) + q * Math.log(1 - kellyFraction);
  const riskOfRuin = (q / p) ** (capital * kellyFraction / avgLoss);
  const expectedReturn = winRate * avgWin - (1 - winRate) * avgLoss;

  return {
    kellyFraction,
    kellyFractionCapped,
    recommendedBet: capital * kellyFractionCapped,
    expectedGrowthRate: expectedGrowth,
    expectedReturn,
    riskOfRuin,
    oddsRatio: b,
    edge: expectedReturn / avgLoss
  };
}

function blackScholes(params) {
  const { S, K, T, r, sigma, optionType = 'call' } = params;
  if (T <= 0) return { price: Math.max(S - K, 0), delta: 1, gamma: 0, theta: 0, vega: 0 };

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const N = (x) => 0.5 * (1 + erf(x / Math.sqrt(2)));
  const phi = (x) => Math.exp(-0.5 * x ** 2) / Math.sqrt(2 * Math.PI);

  let price, delta;
  if (optionType === 'call') {
    price = S * N(d1) - K * Math.exp(-r * T) * N(d2);
    delta = N(d1);
  } else {
    price = K * Math.exp(-r * T) * N(-d2) - S * N(-d1);
    delta = -N(-d1);
  }

  const gamma = phi(d1) / (S * sigma * Math.sqrt(T));
  const theta = -(S * phi(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * N(d2);
  const vega = S * phi(d1) * Math.sqrt(T);

  return { price, delta, gamma, theta, vega, d1, d2 };
}

function meanReversionTest(params) {
  const { prices, lookback = 20 } = params;
  if (prices.length < lookback * 2) throw new Error('Insufficient data for mean reversion test');

  const returns = [];
  for (let i = 1; i < prices.length; i++) returns.push(Math.log(prices[i] / prices[i - 1]));

  const lagged = prices.slice(0, -1);
  const current = prices.slice(1);

  let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0;
  for (let i = 0; i < lagged.length; i++) {
    sumXY += lagged[i] * current[i];
    sumX  += lagged[i];
    sumY  += current[i];
    sumX2 += lagged[i] ** 2;
  }

  const n = lagged.length;
  const beta = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const halfLife = (-Math.log(2)) / Math.log(beta);

  return {
    halfLife,
    meanReversionStrength: 1 - beta,
    isStationary: beta < 1,
    confidence: Math.abs(1 - beta)
  };
}

function cointegrationTest(params) {
  const { series1, series2 } = params;
  if (series1.length !== series2.length || series1.length < 30) {
    throw new Error('Series must be same length and have at least 30 observations');
  }

  const n = series1.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX  += series1[i];
    sumY  += series2[i];
    sumXY += series1[i] * series2[i];
    sumX2 += series1[i] ** 2;
  }

  const beta = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const alpha = (sumY - beta * sumX) / n;

  const residuals = [];
  for (let i = 0; i < n; i++) residuals.push(series2[i] - alpha - beta * series1[i]);

  const residualMean = residuals.reduce((s, r) => s + r, 0) / residuals.length;
  const residualVar  = residuals.reduce((s, r) => s + (r - residualMean) ** 2, 0) / (residuals.length - 1);

  return {
    isCointegrated: Math.abs(residualMean) < 0.1 * Math.sqrt(residualVar),
    cointegrationVector: { alpha, beta },
    residuals,
    halfLife: meanReversionTest({ prices: residuals }).halfLife,
    hedgeRatio: beta
  };
}

/* Helper for Black-Scholes */
function erf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-(x ** 2));
  return sign * y;
}

/* ───────────────────────  UTILITY FUNCTIONS  ─────────────────────── */

function readUInt64LE(buffer, offset) {
  const low  = buffer.readUInt32LE(offset);
  const high = buffer.readUInt32LE(offset + 4);
  return (BigInt(high) << 32n) + BigInt(low);
}

function readUInt128LE(buffer) {
  if (buffer.length !== 16) throw new Error(`Invalid buffer length for UInt128: ${buffer.length}`);
  const low  = readUInt64LE(buffer, 0);
  const high = readUInt64LE(buffer, 8);
  return (high << 64n) + low;
}

function bufferToPublicKey(buffer) {
  try {
    return new PublicKey(buffer);
  } catch (err) {
    throw new Error(`Invalid public key buffer: ${err.message}`);
  }
}

/* ─────────────────────  METRIC LOGGING  ─────────────────── */

const metricsInterval = setInterval(() => {
  if (taskCount > 0) {
    const avgExecution = totalExecutionTime / taskCount;
    console.log(
      `Worker ${workerId} stats ➜ tasks: ${taskCount}, avg ${avgExecution.toFixed(2)} ms`
    );
  }
}, 30_000);

// Clean up interval on exit
parentPort.on('close', () => {
  clearInterval(metricsInterval);
});

// Send ready signal if parentPort exists
if (parentPort) {
  console.log(`Parsing worker ${workerId} ready for tasks`);
  parentPort.postMessage({
    type: 'worker_ready',
    workerId,
    timestamp: Date.now()
  });
} else {
  console.error(`Worker ${workerId} has no parentPort - exiting`);
  process.exit(1);
}