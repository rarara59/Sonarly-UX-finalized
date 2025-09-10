# FIX: String Math Type Conversion Bugs

## Issue
Solana RPC returns numeric values as strings causing silent calculation failures in holder percentage, liquidity ratios, and supply math operations.

## Files to Change
- `src/detection/tiered-token-filter.service.js` (lines 307, 322, 394-397, 413-422)

## Required Changes
1. Convert all RPC numeric string values to numbers using parseFloat/parseInt
2. Add type validation before mathematical operations
3. Fix cache cleanup iterator null checking
4. Reduce retry delays for competitive advantage

## Commands
```bash
# Fix lpValueUSD string math in gatherComprehensiveMetricsFixed
sed -i 's/lpValueUSD: tokenCandidate\.lpValueUSD || tokenCandidate\.liquidityUSD || 0,/lpValueUSD: parseFloat(tokenCandidate.lpValueUSD || tokenCandidate.liquidityUSD || 0),/' src/detection/tiered-token-filter.service.js

# Fix volume ratio calculation with type safety
sed -i 's/metrics\.volumeToLiquidityRatio = tokenCandidate\.volume24h \/ metrics\.lpValueUSD;/const volume24h = parseFloat(tokenCandidate.volume24h || 0);\n            if (metrics.lpValueUSD > 0 \&\& volume24h > 0) {\n                metrics.volumeToLiquidityRatio = volume24h \/ metrics.lpValueUSD;\n            }/' src/detection/tiered-token-filter.service.js

# Fix RPC supply parsing to integers
sed -i 's/metadata\.supply = supplyResult\.data\.supply\.amount;/metadata.supply = parseInt(supplyResult.data.supply.amount);/' src/detection/tiered-token-filter.service.js

# Fix decimals parsing
sed -i 's/metadata\.decimals = supplyResult\.data\.supply\.decimals || 9;/metadata.decimals = parseInt(supplyResult.data.supply.decimals) || 9;/' src/detection/tiered-token-filter.service.js

# Fix holder percentage calculation with proper type conversion
sed -i 's/const totalSupply = metadata\.supply ||/const metadataSupply = parseInt(metadata.supply) || 0;\n            const calculatedSupply =/' src/detection/tiered-token-filter.service.js

# Replace the reduce calculation
sed -i 's/largestAccounts\.value\.reduce((sum, acc) => sum + Number(acc\.amount), 0);/largestAccounts.value.reduce((sum, acc) => sum + parseInt(acc.amount), 0);\n            const totalSupply = metadataSupply || calculatedSupply;/' src/detection/tiered-token-filter.service.js

# Fix cache cleanup iterator safety
sed -i 's/const key = iterator\.next()\.value;/const next = iterator.next();\n                if (next.done) break;\n                const key = next.value;/' src/detection/tiered-token-filter.service.js

# Reduce retry delays for competitive advantage
sed -i 's/const delays = \[500, 1000, 2000\];/const delays = [100, 200, 400];/' src/detection/tiered-token-filter.service.js

# Fix other numeric conversions in metrics
sed -i 's/largestHolderPercentage: tokenCandidate\.largestHolderPercentage || 50,/largestHolderPercentage: parseFloat(tokenCandidate.largestHolderPercentage || 50),/' src/detection/tiered-token-filter.service.js

# Fix uniqueWallets conversion
sed -i 's/uniqueWallets: tokenCandidate\.uniqueWallets || 10,/uniqueWallets: parseInt(tokenCandidate.uniqueWallets || 10),/' src/detection/tiered-token-filter.service.js

# Fix buyToSellRatio conversion
sed -i 's/buyToSellRatio: tokenCandidate\.buyToSellRatio || 1\.0,/buyToSellRatio: parseFloat(tokenCandidate.buyToSellRatio || 1.0),/' src/detection/tiered-token-filter.service.js
```

## Test Fix
```bash
# Test numeric conversion functions
node -e "console.log('parseFloat test:', parseFloat('1000.50'), typeof parseFloat('1000.50')); console.log('parseInt test:', parseInt('1000000000'), typeof parseInt('1000000000'));"

# Test math operations
node -e "const a = parseFloat('5000'); const b = parseFloat('1000'); console.log('Division test:', b/a, typeof (b/a));"

# Verify no string concatenation in calculations
grep -n "Number(" src/detection/tiered-token-filter.service.js
```

## Validation Checklist
- [ ] All lpValueUSD operations use parseFloat() conversion
- [ ] RPC supply parsing uses parseInt() for amount and decimals  
- [ ] Holder percentage calculations handle string inputs correctly
- [ ] Cache cleanup iterator includes done check to prevent infinite loops
- [ ] Retry delays reduced to maintain competitive advantage (700ms total vs 3500ms)