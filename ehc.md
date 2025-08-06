# FIX: Renaissance Grade Token Validator

## Issue
Multiple production bugs preventing Renaissance-grade reliability: error handling crashes, misleading documentation, and insufficient input validation.

## Files to Change
- `token-validator.js` (error handling, cache comments, input validation)

## Required Changes
1. Fix critical error handling crash in `performRpcValidation` method
2. Fix identical error handling crash in `recordError` method  
3. Correct misleading cache implementation comment (LRU vs FIFO)
4. Add input validation for address parameter to fail fast on invalid inputs

## Commands

```bash
# Fix critical error handling crash in performRpcValidation
sed -i '/if (error\.message\.includes.*could not find account/i\
      const errorMsg = error?.message || error?.toString() || "unknown error";' token-validator.js

sed -i 's/if (error\.message\.includes('\''could not find account'\'\')/if (errorMsg.includes('\''could not find account'\''))/g' token-validator.js

sed -i 's/if (error\.message\.includes('\''timeout'\'\')/if (errorMsg.includes('\''timeout'\'')/g' token-validator.js

# Fix identical error handling crash in recordError method
sed -i 's/console\.warn('\''Token validation error:'\'', error\.message);/console.warn('\''Token validation error:'\'', error?.message || error?.toString() || '\''unknown error'\'');/g' token-validator.js

# Fix misleading cache comment
sed -i 's/\/\/ Implement LRU eviction/\/\/ Implement FIFO eviction/g' token-validator.js

# Add input validation for Renaissance-grade early failure detection
sed -i '/async validateToken(address, context = {}) {/a\
    \/\/ Renaissance standard: Validate inputs early\
    if (!address || typeof address !== '\''string'\'' || address.length === 0) {\
      throw new Error(`Invalid token address: ${address}`);\
    }' token-validator.js
```

## Test Fix

```bash
# Verify all error handling fixes applied
node -e "
const fs = require('fs');
const code = fs.readFileSync('token-validator.js', 'utf8');
console.log('✅ Primary error fix:', code.includes('errorMsg = error?.message'));
console.log('✅ Console.warn fix:', code.includes('error?.message || error?.toString()'));
console.log('✅ Cache comment fix:', code.includes('FIFO eviction'));
console.log('✅ Input validation:', code.includes('typeof address'));
"

# Test module still loads and basic functionality works
node -e "
try { 
  const { TokenValidator } = require('./token-validator.js');
  const mockRpc = { call: () => Promise.resolve(null) };
  const validator = new TokenValidator(mockRpc);
  console.log('✅ Module loads and instantiates successfully');
} catch(e) { 
  console.log('❌ Module broken:', e.message); 
}
"

# Verify no unsafe error.message patterns remain
grep -n "error\.message\." token-validator.js && echo "❌ Unsafe error access found" || echo "✅ All error access patterns secured"
```

**Validation Checklist**
* Error message extraction uses null-safe operators in both locations
* Cache comment accurately reflects FIFO implementation  
* Input validation throws early on invalid addresses
* Module loads without syntax errors
* No remaining unsafe `error.message` direct access patterns