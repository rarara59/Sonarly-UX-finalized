// src/services/modular-edge-calculator.service.js
// JavaScript conversion of the TypeScript version
// – type annotations stripped
// – ES modules → CommonJS require()
// – no lazy-loading: everything required synchronously
// – logger calls routed to console
// – maths preserved verbatim

/* -------------------------------------------------------------------------- */
/*                          Synchronous requires                              */
/* -------------------------------------------------------------------------- */
const { SignalRegistry } = require('./signal-registry.service');
const { SmartWalletSignalModule } = require('../signal-modules/smart-wallet-signal.module');
const { LPAnalysisSignalModule } = require('../signal-modules/lp-analysis-signal.module');
const { HolderVelocitySignalModule } = require('../signal-modules/holder-velocity-signal.module');
const { TransactionPatternSignalModule } = require('../signal-modules/transaction-pattern-signal.module');
const { DeepHolderAnalysisSignalModule } = require('../signal-modules/deep-holder-analysis-signal.module');
const { SocialSignalsModule } = require('../signal-modules/social-signals.module');
const { TechnicalPatternSignalModule } = require('../signal-modules/technical-pattern-signal.module');
const { MarketContextSignalModule } = require('../signal-modules/market-context-signal.module');
const rpcManager = require('./rpc-connection-manager').default;
const { RiskCheckService } = require('./risk-check.service');

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */
const toKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/Signal(Module)?/gi, '').toLowerCase();

/* -------------------------------------------------------------------------- */
/*                            Calculator Class                                */
/* -------------------------------------------------------------------------- */
function ModularEdgeCalculator(originalCalculator = null) {
  // internal registry
  this.signalRegistry = new SignalRegistry(console);
  this.originalCalculator = originalCalculator;

  // register default modules immediately (no lazy loading)
  this.signalRegistry.register(new SmartWalletSignalModule({ enabled: true, weight: 0.6, priority: 100 }));
  this.signalRegistry.register(new LPAnalysisSignalModule({ enabled: true, weight: 0.25, priority: 90 }));
  this.signalRegistry.register(new HolderVelocitySignalModule({ enabled: true, weight: 0.1, priority: 80 }));
  this.signalRegistry.register(new TransactionPatternSignalModule({ enabled: true, weight: 0.05, priority: 70 }));
  this.signalRegistry.register(new DeepHolderAnalysisSignalModule({ enabled: true, weight: 0.15, priority: 60 }));
  this.signalRegistry.register(new SocialSignalsModule({ enabled: true, weight: 0.1, priority: 50 }));
  this.signalRegistry.register(new TechnicalPatternSignalModule({ enabled: true, weight: 0.1, priority: 40 }));
  this.signalRegistry.register(new MarketContextSignalModule({ enabled: true, weight: 0.05, priority: 30 }));

  console.log('🔧 ModularEdgeCalculator ready');
}

/* -------------------------------------------------------------------------- */
/*                           Prototype Methods                                */
/* -------------------------------------------------------------------------- */

ModularEdgeCalculator.prototype.evaluateToken = async function (tokenAddress, currentPrice, ageMin) {
  const track = ageMin <= 30 ? 'FAST' : 'SLOW';

  // Risk-assessment veto
  const risk = await this.performRiskAssessment(tokenAddress, currentPrice, ageMin);
  if (!risk.passed) {
    return {
      tokenAddress,
      finalScore: 0,
      confidence: 0,
      track,
      isQualified: false,
      primaryPath: 'Risk Rejection',
      detectionPaths: [],
      signals: { riskAssessment: risk },
      expectedReturn: 0,
      riskScore: 1,
      kellySizing: 0,
      reasons: risk.rejectionReasons,
      timestamp: new Date(),
      processingMethod: 'modular-risk-veto',
      moduleStats: {},
    };
  }

  const modules = this.signalRegistry.getModulesForTrack(track);
  if (!modules.length && this.originalCalculator) {
    return this.originalCalculator.evaluateToken(tokenAddress, currentPrice, ageMin);
  }

  const context = {
    tokenAddress,
    track,
    tokenAgeMinutes: ageMin,
    currentPrice,
    volume: risk.volume24h || 0,
    rpcManager,
    logger: console,
  };

  const signalResults = await this.executeSignalModules(modules, context);
  return this.combineSignalResults(signalResults, track, context, risk);
};

/* ---------------------------------------------------------------------- */
/*                    RISK ASSESSMENT + HELPERS                            */
/* ---------------------------------------------------------------------- */

ModularEdgeCalculator.prototype.performRiskAssessment = async function (tokenAddress, price, ageMin) {
  try {
    const signatures = await this.fetchSignaturesWithRetry(tokenAddress, rpcManager);
    const volume24h = await this.calculateRealVolume(tokenAddress, signatures, rpcManager);
    const lpUSD = await this.getRealLPValue(tokenAddress, rpcManager);
    const concentration = await this.calculateRealHolderConcentration(tokenAddress, rpcManager);
    const txCount = await this.countRealTransactions(signatures, tokenAddress, rpcManager);
    const profile = {
      address: tokenAddress,
      volume24h,
      lpValueUSD: lpUSD,
      holderConcentration: concentration,
      transactionCount: txCount,
      ageMinutes: ageMin,
    };
    const risk = await RiskCheckService.performRiskCheck(profile);
    risk.volume24h = volume24h;
    return risk;
  } catch (e) {
    console.error('risk check failed', e.message);
    return {
      passed: true,
      riskScore: 0.5,
      confidencePenalty: 0.1,
      rejectionReasons: [],
      warnings: [e.message],
      tradabilityConfirmed: true,
      honeypotDetected: false,
      slippageAcceptable: true,
      volumeAdequate: true,
      liquidityReal: true,
      volume24h: 0,
    };
  }
};

// --- helper methods (unchanged maths, logging via console) -----------------
ModularEdgeCalculator.prototype.fetchSignaturesWithRetry = async function (tokenAddress, rpc, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('signature timeout')), 30_000));
      return await Promise.race([rpc.getSignaturesForAddress(tokenAddress, 100, 'helius'), timeout]);
    } catch {
      if (i === retries) return [];
      await new Promise((r) => setTimeout(r, 2_000 * (i + 1)));
    }
  }
  return [];
};

ModularEdgeCalculator.prototype.calculateRealVolume = async function (tokenAddress, sigs, rpc) {
  if (!sigs.length) return 0;
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - 86_400;
  const recent = sigs.filter((s) => (s.blockTime || 0) >= cutoff);
  if (!recent.length) return 0;
  let usdTot = 0;
  let analysed = 0;
  for (const s of recent.slice(0, 20)) {
    try {
      const tx = await Promise.race([
        rpc.getTransaction(s.signature),
        new Promise((_, reject) => setTimeout(() => reject(new Error('txn timeout')), 5_000)),
      ]);
      if (!tx || !tx.meta) continue;
      const usd = this.extractSOLTransferAmount(tx);
      if (usd > 0) {
        usdTot += usd;
        analysed++;
      }
    } catch {/* ignore */}
  }
  if (!analysed) return Math.max(500, recent.length * 50);
  return Math.max(100, Math.min(10_000_000, (usdTot / analysed) * recent.length));
};

ModularEdgeCalculator.prototype.getRealLPValue = async function (tokenAddress, rpc) {
  const direct = await this.findLPValueFromProgramAccounts(tokenAddress, rpc);
  if (direct) return direct;
  const est = await this.estimateLPFromMarketActivity(tokenAddress, rpc);
  if (est) return est;
  return this.estimateLPFromTokenAge(tokenAddress);
};

ModularEdgeCalculator.prototype.findLPValueFromProgramAccounts = async function (tokenAddress, rpc) {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('program timeout')), 8_000));
    const pools = await Promise.race([
      rpc.getProgramAccounts('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', { filters: [{ dataSize: 752 }] }),
      timeout,
    ]);
    for (const p of pools.slice(0, 10)) {
      const i = p.account && p.account.data && p.account.data.parsed && p.account.data.parsed.info;
      if (!i) continue;
      if (i.tokenMintA === tokenAddress || i.tokenMintB === tokenAddress) {
        const a = parseFloat(i.tokenAmountA?.amount || 0);
        const b = parseFloat(i.tokenAmountB?.amount || 0);
        if (a && b) {
          const usd = (Math.min(a, b) / 1e9) * 120;
          if (usd > 100 && usd < 50_000_000) return usd;
        }
      }
    }
  } catch {/* ignore */}
  return 0;
};

ModularEdgeCalculator.prototype.estimateLPFromMarketActivity = async function (tokenAddress, rpc) {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('acct info timeout')), 5_000));
    const info = await Promise.race([rpc.getAccountInfo(tokenAddress), timeout]);
    const supply = parseFloat(info?.data?.parsed?.info?.supply || 0);
    const decimals = info?.data?.parsed?.info?.decimals ?? 0;
    if (!supply) return 0;
    const total = supply / 10 ** decimals;
    return Math.max(1_000, Math.min(1_000_000, total * 0.1 * 0.001));
  } catch {
    return 0;
  }
};

ModularEdgeCalculator.prototype.estimateLPFromTokenAge = function (addr) {
  const hash = Math.abs(
    addr.split('').reduce((a, c) => {
      a = (a << 5) - a + c.charCodeAt(0);
      return a & a;
    }, 0),
  );
  return 1_500 + (hash % 3_000);
};

ModularEdgeCalculator.prototype.calculateRealHolderConcentration = async function (tokenAddress, rpc) {
  try {
    const largest = await Promise.race([
      rpc.call('getTokenLargestAccounts', [tokenAddress]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('largest timeout')), 8_000)),
    ]);
    if (!(largest && largest.value && largest.value.length)) return this.estimateHolderConcentrationFallback(tokenAddress);
    const supplyData = await Promise.race([
      rpc.getTokenSupply(tokenAddress),
      new Promise((_, reject) => setTimeout(() => reject(new Error('supply timeout')), 5_000)),
    ]);
    const totalSupply = parseFloat(supplyData?.amount || supplyData?.value?.amount || 0);
    if (!totalSupply) return this.estimateHolderConcentrationFallback(tokenAddress);
    const largestamt = parseFloat(largest.value[0].amount || 0);
    const top3amt = largest.value.slice(0, 3).reduce((s, a) => s + parseFloat(a.amount || 0), 0);
    const pct = Math.max((largestamt / totalSupply) * 100, (top3amt / totalSupply) * 100 * 0.7);
    return Math.max(5, Math.min(95, pct));
  } catch {
    return this.estimateHolderConcentrationFallback(tokenAddress);
  }
};

ModularEdgeCalculator.prototype.estimateHolderConcentrationFallback = function (addr) {
  const hash = Math.abs(
    addr.split('').reduce((a, c) => {
      a = (a << 5) - a + c.charCodeAt(0);
      return a & a;
    }, 0),
  );
  return 20 + (hash % 25);
};

ModularEdgeCalculator.prototype.countRealTransactions = async function (sigs, tokenAddress, rpc) {
  if (!sigs.length) return 0;
  let real = 0;
  for (const s of sigs.slice(0, 10)) {
    try {
      const tx = await Promise.race([
        rpc.getTransaction(s.signature),
        new Promise((_, reject) => setTimeout(() => reject(new Error('txn timeout')), 3_000)),
      ]);
      if (tx && tx.meta && this.hasTokenTransferActivity(tx, tokenAddress)) real++;
    } catch {/* ignore */}
  }
  if (!real) return Math.floor(sigs.length * 0.3);
  return Math.max(1, Math.floor((real / Math.min(10, sigs.length)) * sigs.length));
};

ModularEdgeCalculator.prototype.extractSOLTransferAmount = function (tx) {
  try {
    const pre = tx.meta?.preBalances || [];
    const post = tx.meta?.postBalances || [];
    let maxUsd = 0;
    for (let i = 0; i < Math.min(pre.length, post.length); i++) {
      const diff = Math.abs(post[i] - pre[i]) / 1e9;
      if (diff > 0.001 && diff < 1_000) maxUsd = Math.max(maxUsd, diff * 120);
    }
    return maxUsd;
  } catch {
    return 0;
  }
};

ModularEdgeCalculator.prototype.hasTokenTransferActivity = function (tx, tokenAddress) {
  try {
    const pre = tx.meta?.preTokenBalances || [];
    const post = tx.meta?.postTokenBalances || [];
    if ([...pre, ...post].some((b) => b.mint === tokenAddress && b.uiTokenAmount && b.uiTokenAmount.uiAmount > 0)) return true;
    return !!(tx.meta && tx.meta.innerInstructions && tx.meta.innerInstructions.length);
  } catch {
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*                 Module execution + combination logic                        */
/* -------------------------------------------------------------------------- */

ModularEdgeCalculator.prototype.executeSignalModules = async function (modules, context) {
  const results = new Map();
  const jobs = modules.map(async (m) => {
    const start = Date.now();
    const name = toKebab(m.getName());
    try {
      const payload = await Promise.race([
        m.execute(context),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} timeout`)), 60_000)),
      ]);
      results.set(name, {
        success: true,
        executionTime: Date.now() - start,
        confidence: payload && payload.confidence != null ? payload.confidence : 0,
        version: payload && payload.version,
        source: payload && payload.source,
        data: payload,
      });
    } catch (e) {
      results.set(name, { success: false, executionTime: Date.now() - start, error: e.message });
    }
  });
  await Promise.race([
    Promise.allSettled(jobs),
    new Promise((_, reject) => setTimeout(() => reject(new Error('signal group timeout')), 300_000)),
  ]);
  return results;
};

ModularEdgeCalculator.prototype.combineSignalResults = function (signalResults, track, context, risk) {
  const signals = this.convertToOriginalFormat(signalResults);
  const { finalScore: raw, primaryPath, detectionPaths, reasons } = this.calculateModularWeightedScore(
    signals,
    track,
    context,
  );
  const penalty = risk.confidencePenalty || 0;
  const finalScore = Math.max(0, raw - penalty);
  const riskMetrics = this.calculateModularRiskMetrics(finalScore, context.currentPrice, track, signals);
  return {
    tokenAddress: context.tokenAddress,
    finalScore,
    confidence: finalScore * 100,
    track,
    isQualified: finalScore >= (track === 'FAST' ? 0.75 : 0.7),
    primaryPath,
    detectionPaths,
    signals: { ...signals, riskAssessment: risk },
    ...riskMetrics,
    reasons,
    timestamp: new Date(),
    processingMethod: 'modular',
    moduleStats: this.getModuleStats(signalResults),
  };
};

// convert results map back to detectionSignals structure
ModularEdgeCalculator.prototype.convertToOriginalFormat = function (signalResults) {
  const s = {};
  for (const [k, w] of signalResults) {
    if (!w.success) continue;
    switch (k) {
      case 'smart-wallet':
        s.smartWallet = w.data;
        break;
      case 'lp-analysis':
        s.lpAnalysis = w.data;
        break;
      case 'holder-velocity':
        s.holderVelocity = w.data;
        break;
      case 'transaction-pattern':
        s.transactionPattern = w.data;
        break;
      case 'deep-holder-analysis':
        s.deepHolderAnalysis = w.data;
        break;
      case 'social-signals':
        s.socialSignals = w.data;
        break;
      case 'technical-pattern':
        s.technicalPattern = w.data;
        break;
      case 'market-context':
        s.marketContext = w.data;
        break;
    }
  }
  return s;
};

// weight + multiplier maths (unchanged)
ModularEdgeCalculator.prototype.calculateModularWeightedScore = function (signals, track, ctx) {
  const wm = {};
  for (const m of this.signalRegistry.getAllModules()) wm[toKebab(m.getName())] = m.weight || 0;
  const comps = [
    { k: 'smartWallet', w: wm['smart-wallet'] || 0, c: (signals.smartWallet && signals.smartWallet.confidence) || 0 },
    { k: 'holderVelocity', w: wm['holder-velocity'] || 0, c: (signals.holderVelocity && signals.holderVelocity.confidence) || 0 },
    { k: 'transactionPattern', w: wm['transaction-pattern'] || 0, c: (signals.transactionPattern && signals.transactionPattern.confidence) || 0 },
    { k: 'lpAnalysis', w: wm['lp-analysis'] || 0, c: (signals.lpAnalysis && signals.lpAnalysis.confidence) || 0 },
    { k: 'marketContext', w: wm['market-context'] || 0, c: (signals.marketContext && signals.marketContext.confidence) || 0 },
  ];
  const totalW = comps.reduce((s, c) => s + c.w, 0) || 1;
  const base = comps.reduce((s, c) => s + (c.c * c.w) / 100, 0) / totalW;
  const volMult = this.calculateVolumeMultiplier(ctx.volume || 0, ctx.tokenAgeMinutes);
  const ageMult = this.calculateAgeBonus(ctx.tokenAgeMinutes);
  const finalScore = Math.min(base * volMult * ageMult, 0.95);
  const reasons = [`Base ${(base * 100).toFixed(1)}%`, `Volume ×${volMult}`, `Age ×${ageMult}`];
  const paths = comps.filter((c) => c.c > 50).map((c) => c.k);
  const primaryPath = comps.reduce((p, c) => (c.c > p.c ? c : p)).k;
  return { finalScore, primaryPath, detectionPaths: paths, reasons };
};

ModularEdgeCalculator.prototype.calculateVolumeMultiplier = function (volume, age) {
  const ageAdj = Math.max(0.5, Math.min(1, age / 15));
  const v = volume / ageAdj;
  if (v >= 100_000) return 3;
  if (v >= 50_000) return 2.5;
  if (v >= 20_000) return 2;
  if (v >= 10_000) return 1.5;
  if (v >= 5_000) return 1.2;
  if (v >= 2_000) return 1;
  if (v >= 1_000) return 0.8;
  if (v >= 500) return 0.6;
  return 0.3;
};

ModularEdgeCalculator.prototype.calculateAgeBonus = function (age) {
  if (age <= 2) return 1.3;
  if (age <= 5) return 1.2;
  if (age <= 10) return 1.1;
  if (age <= 30) return 1.0;
  if (age <= 60) return 0.95;
  return 0.9;
};

ModularEdgeCalculator.prototype.calculateModularRiskMetrics = function (finalScore, currentPrice, track, signals) {
  let expectedReturn = 0;
  if (finalScore >= 0.8) expectedReturn = 5.2;
  else if (finalScore >= 0.75) expectedReturn = 4.5;
  else if (finalScore >= 0.7) expectedReturn = 4;
  else if (finalScore >= 0.65) expectedReturn = 3.2;
  else expectedReturn = 2;

  let riskScore = 1 - finalScore;
  if (track === 'FAST') riskScore += 0.1;
  if (signals.lpAnalysis) {
    if (signals.lpAnalysis.lpValueUSD < 5_000) riskScore += 0.15;
    if (signals.lpAnalysis.topWalletPercent > 0.5) riskScore += 0.2;
    if (!signals.lpAnalysis.mintDisabled) riskScore += 0.1;
  }
  const winRate = finalScore;
  const avgWin = expectedReturn;
  const avgLoss = 0.8;
  const kelly = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
  const kellySizing = Math.max(0, Math.min(0.25, kelly));
  return { expectedReturn, riskScore: Math.max(0, Math.min(1, riskScore)), kellySizing };
};

ModularEdgeCalculator.prototype.getModuleStats = function (signalResults) {
  const stats = {};
  for (const [k, w] of signalResults) {
    stats[k] = {
      success: w.success,
      confidence: w.confidence,
      executionTime: w.executionTime,
      version: w.version,
      source: w.source,
    };
  }
  return stats;
};

/* -------------------------------------------------------------------------- */
/*                      Public management helpers                             */
/* -------------------------------------------------------------------------- */
ModularEdgeCalculator.prototype.setupABTest = async function (signalName, variantA, variantB) {
  this.signalRegistry.setupABTest(signalName, [variantA, variantB]);
};
ModularEdgeCalculator.prototype.registerSignalModule = async function (module) {
  this.signalRegistry.register(module);
};
ModularEdgeCalculator.prototype.unregisterSignalModule = async function (name) {
  this.signalRegistry.unregister(name);
};
ModularEdgeCalculator.prototype.getSignalStats = async function () {
  return this.signalRegistry.getRegistryStats();
};

/* -------------------------------------------------------------------------- */
/*                             EXPORT                                          */
/* -------------------------------------------------------------------------- */
module.exports = ModularEdgeCalculator;