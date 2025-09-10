# FIX: Transaction Fetcher Critical Issues

## Issue
Array access crash on empty RPC responses and 266x performance violation with 8000ms timeout kills profitability.

## Files to Change
- `transaction-fetcher.js` (lines 89, 76, constructor)

## Required Changes
1. Add bounds check before array access to prevent crash
2. Reduce RPC timeout from 8000ms to 30ms for Renaissance performance
3. Add dependency validation in constructor
4. Fix unsafe signature cache clearing

## Commands

```bash
# Fix array access crash - add bounds check
sed -i '/config\.lastSignature = response\[0\]\.signature;/c\
      if (response.length > 0) {\
        config.lastSignature = response[0].signature;\
      }' transaction-fetcher.js

# Fix performance killer - reduce timeout to Renaissance standard
sed -i 's/timeout: 8000/timeout: 30/' transaction-fetcher.js

# Add dependency validation after constructor line
sed -i '/constructor(rpcPool, circuitBreaker, performanceMonitor = null) {/a\
    if (!rpcPool) throw new Error('\''rpcPool is required'\'');\
    if (!circuitBreaker) throw new Error('\''circuitBreaker is required'\'');' transaction-fetcher.js

# Fix memory leak in cache cleanup - use size-based eviction instead of clear all
sed -i '/this\.seenSignatures\.clear();/c\
        // Remove oldest half of signatures instead of clearing all\
        const signatures = Array.from(this.seenSignatures);\
        const keepCount = Math.floor(signatures.length / 2);\
        this.seenSignatures.clear();\
        signatures.slice(-keepCount).forEach(sig => this.seenSignatures.add(sig));' transaction-fetcher.js
```

## Test Fix

```bash
# Test dependency validation
node -e "
const { TransactionFetcher } = require('./transaction-fetcher.js');
try { new TransactionFetcher(null); console.log('FAIL: Should throw'); } 
catch(e) { console.log('PASS: Dependency validation works'); }
"

# Test timeout value is correctly set
grep -n "timeout: 30" transaction-fetcher.js && echo "PASS: Timeout fixed" || echo "FAIL: Timeout not fixed"

# Test bounds check exists
grep -A 2 "response.length > 0" transaction-fetcher.js && echo "PASS: Bounds check added" || echo "FAIL: Bounds check missing"
```

**Validation Checklist**
* Constructor throws error when rpcPool is null/undefined
* RPC timeout is 30ms instead of 8000ms  
* Array access is protected with length check
* Signature cache uses partial eviction instead of complete clear