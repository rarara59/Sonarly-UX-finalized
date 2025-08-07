src/services/tiered-token-filter.service.js

Add Timeout Protection to Module Calls

Add timeout protection to all risk module calls to prevent infinite hangs. Wrap the Promise.all with Promise.race to add a 5-second timeout that triggers fallback logic when modules hang.

REPLACE THIS
const [scamResult, liquidityResult, marketCapResult] = await Promise.all([...]);

WITH THIS
// Add timeout protection to prevent infinite hangs
const moduleTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Risk module timeout')), 5000);
});

const modulePromises = Promise.all([
    this.scamProtectionEngine.analyzeToken(tokenMetrics.address, tokenMetrics).catch(e => null),
    this.liquidityRiskAnalyzer.validateExitLiquidity(tokenMetrics.address, tokenMetrics).catch(e => null),
    this.marketCapRiskFilter.filterByMarketCap(tokenMetrics, "fresh_gem").catch(e => null)
]);

const [scamResult, liquidityResult, marketCapResult] = await Promise.race([
    modulePromises,
    moduleTimeout
]).catch(error => {
    console.log('⚠️ Risk modules failed/timeout, using fallback logic');
    return [null, null, null];
});

