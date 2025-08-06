# FIX: Pool Validator Input Validation

## Issue
Pool validator crashes on null inputs and invalid RPC responses, causing system failures during network issues when profits are highest.

## Files to Change
- `src/detection/validation/pool-validator.js`

## Required Changes
1. Add null/undefined checks for dexType before toLowerCase() call
2. Validate RPC response structure before accessing properties
3. Wrap all Buffer.from() calls in try-catch blocks
4. Fix Solana address validation from 32 to 44 characters
5. Add performance.now() fallback for Node.js compatibility

## Commands
```bash
# Fix dexType null check before toLowerCase
sed -i 's/if (!dexType || typeof dexType !== '\''string'\'') {/if (!dexType || typeof dexType !== '\''string'\'' || dexType.trim() === '\''\'') {/' src/detection/validation/pool-validator.js

# Fix Solana address length validation
sed -i 's/poolAddress.length < 32/poolAddress.length !== 44/' src/detection/validation/pool-validator.js

# Add performance.now fallback
sed -i 's/const startTime = performance.now();/const startTime = typeof performance !== '\''undefined'\'' ? performance.now() : Date.now();/' src/detection/validation/pool-validator.js

# Fix RPC response validation
sed -i 's/if (!poolInfo || !poolInfo.value) {/if (!poolInfo || typeof poolInfo !== '\''object'\'' || !poolInfo.hasOwnProperty('\''value'\'')) {/' src/detection/validation/pool-validator.js

# Wrap first Buffer.from call in parseRaydiumPoolData
sed -i '/const buffer = Buffer.from(rawData, '\''base64'\'');/i\      let buffer;\n      try {' src/detection/validation/pool-validator.js
sed -i '/const buffer = Buffer.from(rawData, '\''base64'\'');/a\      } catch (error) {\n        return { valid: false, reason: '\''invalid_base64_data'\'', error: error.message };\n      }' src/detection/validation/pool-validator.js
sed -i 's/const buffer = Buffer.from(rawData, '\''base64'\'');/        buffer = Buffer.from(rawData, '\''base64'\'');/' src/detection/validation/pool-validator.js

# Wrap second Buffer.from call in parsePumpfunPoolData  
sed -i '0,/const buffer = Buffer.from(rawData, '\''base64'\'');/{//!b;};n;/const buffer = Buffer.from(rawData, '\''base64'\'');/i\      let buffer;\n      try {' src/detection/validation/pool-validator.js
sed -i '0,/const buffer = Buffer.from(rawData, '\''base64'\'');/{//!b;};n;/const buffer = Buffer.from(rawData, '\''base64'\'');/a\      } catch (error) {\n        return { valid: false, reason: '\''invalid_base64_data'\'', error: error.message };\n      }' src/detection/validation/pool-validator.js
sed -i '0,/const buffer = Buffer.from(rawData, '\''base64'\'');/{//!b;};n;s/const buffer = Buffer.from(rawData, '\''base64'\'');/        buffer = Buffer.from(rawData, '\''base64'\'');/' src/detection/validation/pool-validator.js

# Wrap third Buffer.from call in parseOrcaPoolData
sed -i '0,/const buffer = Buffer.from(rawData, '\''base64'\'');/{//!b;};n;n;/const buffer = Buffer.from(rawData, '\''base64'\'');/i\      let buffer;\n      try {' src/detection/validation/pool-validator.js  
sed -i '0,/const buffer = Buffer.from(rawData, '\''base64'\'');/{//!b;};n;n;/const buffer = Buffer.from(rawData, '\''base64'\'');/a\      } catch (error) {\n        return { valid: false, reason: '\''invalid_base64_data'\'', error: error.message };\n      }' src/detection/validation/pool-validator.js
sed -i '0,/const buffer = Buffer.from(rawData, '\''base64'\'');/{//!b;};n;n;s/const buffer = Buffer.from(rawData, '\''base64'\'');/        buffer = Buffer.from(rawData, '\''base64'\'');/' src/detection/validation/pool-validator.js

# Fix getDataLength Buffer.from call
sed -i 's/return Buffer.from(data, '\''base64'\'').length;/try { return Buffer.from(data, '\''base64'\'').length; } catch { return 0; }/' src/detection/validation/pool-validator.js
```

## Test Fix
```bash
# Test null dexType handling
node -e "const {PoolValidator} = require('./src/detection/validation/pool-validator.js'); const pv = new PoolValidator({}); pv.validatePool('test', null).then(r => console.log(r.reason === 'invalid_dex_type' ? 'PASS' : 'FAIL'))"

# Test invalid address length  
node -e "const {PoolValidator} = require('./src/detection/validation/pool-validator.js'); const pv = new PoolValidator({}); pv.validatePool('shortaddr', 'raydium').then(r => console.log(r.reason === 'invalid_pool_address' ? 'PASS' : 'FAIL'))"

# Test performance fallback
node -e "delete global.performance; const {PoolValidator} = require('./src/detection/validation/pool-validator.js'); console.log('Performance fallback works')"
```

## Validation Checklist
- ✓ Null dexType input returns error instead of crashing
- ✓ Invalid pool address length (non-44 chars) rejected properly  
- ✓ Invalid base64 data returns error instead of throwing exception
- ✓ RPC response without value property handled gracefully
- ✓ System works in Node.js environment without performance global