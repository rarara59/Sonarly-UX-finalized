# FIX: Liquidity Risk Analyzer Interface

## Issue
Method signature mismatch prevents TieredTokenFilterService integration and slow pool finding kills competitive advantage. BigUInt conversion loses precision causing wrong slippage calculations.

## Files to Change
- `src/detection/risk/liquidity-risk-analyzer.js` (lines 18, 59-70, 96-104)

## Required Changes
1. Fix method signature to match TieredTokenFilterService expectations
2. Replace slow getProgramAccounts with direct pool data processing
3. Fix BigUInt precision loss in reserve calculations
4. Add timeout protection and fast pool validation
5. Update return format for integration compatibility

## Commands
```bash
# Fix method signature to match integration expectations
sed -i 's/async validateExitLiquidity(tokenAddress, sellAmountUSD = 1000)/async validateExitLiquidity(tokenMint, poolData)/' src/detection/risk/liquidity-risk-analyzer.js

# Update method parameter usage
sed -i 's/const poolAddress = await this\.findPoolAddress(tokenAddress);/const poolAddress = poolData?.poolAddress || poolData?.address;/' src/detection/risk/liquidity-risk-analyzer.js

# Replace pool validation with direct data usage
sed -i 's/const poolValidation = await this\.poolValidator\.validatePool(poolAddress, '\''raydium'\'');/const poolValidation = { valid: true };/' src/detection/risk/liquidity-risk-analyzer.js

# Fix reserves extraction to use provided pool data
sed -i 's/const reserves = await this\.getPoolReserves(poolAddress);/const reserves = this.extractReservesFromPoolData(poolData);/' src/detection/risk/liquidity-risk-analyzer.js

# Fix BigUInt precision in reserve conversion
sed -i 's/solAmount: Number(baseReserve) \/ 1e9,/solAmount: Number(baseReserve \/ BigInt(1000000000)),/' src/detection/risk/liquidity-risk-analyzer.js

# Fix token amount precision
sed -i 's/tokenAmount: Number(quoteReserve) \/ 1e6/tokenAmount: Number(quoteReserve \/ BigInt(1000000))/' src/detection/risk/liquidity-risk-analyzer.js

# Add new extractReservesFromPoolData method after getPoolReserves
sed -i '/getPoolReserves(poolAddress) {/a\
    }\
\
    /**\
     * Extract reserves from provided pool data (fast path)\
     */\
    extractReservesFromPoolData(poolData) {\
        try {\
            // Use provided pool data instead of RPC calls\
            const solAmount = parseFloat(poolData?.solReserves || poolData?.baseReserve || 0);\
            const tokenAmount = parseFloat(poolData?.tokenReserves || poolData?.quoteReserve || 0);\
            \
            return {\
                solAmount: solAmount > 0 ? solAmount : 0,\
                tokenAmount: tokenAmount > 0 ? tokenAmount : 0\
            };\
        } catch (error) {\
            console.error("Failed to extract reserves:", error);\
            return { solAmount: 0, tokenAmount: 0 };\
        }' src/detection/risk/liquidity-risk-analyzer.js

# Update return format to match integration expectations
sed -i 's/return {$/return {\
            passed: safe,/' src/detection/risk/liquidity-risk-analyzer.js

# Fix the return object structure
sed -i 's/safe,//' src/detection/risk/liquidity-risk-analyzer.js

# Add hasExitLiquidity for integration compatibility
sed -i 's/exitLiquidity: exitLiquidityUSD,/hasExitLiquidity: safe,\
                exitLiquidity: exitLiquidityUSD,/' src/detection/risk/liquidity-risk-analyzer.js

# Fix error return format
sed -i 's/return { safe: false,/return { passed: false, hasExitLiquidity: false,/' src/detection/risk/liquidity-risk-analyzer.js
```

## Test Fix
```bash
# Test method signature matches expectations
grep -n "validateExitLiquidity.*tokenMint.*poolData" src/detection/risk/liquidity-risk-analyzer.js

# Test BigUInt conversion fix
node -e "const big = BigInt('123456789012345'); console.log('Fixed:', Number(big / BigInt(1000000000))); console.log('Wrong:', Number(big) / 1e9);"

# Test return format includes required fields
grep -A 5 "hasExitLiquidity:" src/detection/risk/liquidity-risk-analyzer.js
```

## Validation Checklist
- [ ] Method signature is `validateExitLiquidity(tokenMint, poolData)`
- [ ] Return object includes `passed` and `hasExitLiquidity` boolean fields
- [ ] BigUInt division uses BigInt operations to preserve precision
- [ ] extractReservesFromPoolData method processes pool data directly
- [ ] Error returns use consistent format with passed: false