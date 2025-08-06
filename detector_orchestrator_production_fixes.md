// FIX #1: Variable Scope Issue (Line 78-84)
// REPLACE this.createDetectorPromises method:
createDetectorPromises(transaction) {
  const orderedDetectors = ['raydium', 'pumpfun', 'orca']; // Fixed order
  const promises = [];
  
  orderedDetectors.forEach(dexName => {
    const config = this.detectorConfig[dexName];
    if (!config?.enabled || !this.detectors[dexName]) {
      // Return placeholder promise to maintain array order
      promises.push(Promise.resolve({
        dexName,
        success: false,
        candidates: [],
        error: 'Disabled',
        latency: 0,
        skipped: true
      }));
      return;
    }
    
    promises.push(this.executeDetectorWithProtection(dexName, transaction, config.timeout));
  });
  
  return promises;
}

// FIX #2: Missing Error Handling (Line 100)
// REPLACE line 100:
if (this.circuitBreaker?.canExecute?.(dexName) === false) {

// FIX #3: Deduplication Logic (Line 269)
// REPLACE line 269:
const key = `${candidate.signature || 'unknown'}_${candidate.poolId || candidate.baseToken?.address || candidate.quoteToken?.address || Math.random()}`;