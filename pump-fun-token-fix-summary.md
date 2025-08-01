# Pump.fun Token Address Extraction Fix

## Issue
The Pump.fun LP detection was extracting the same hardcoded token address (4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf) for every transaction, causing 100% rejection rate and $400-500/minute revenue loss.

## Root Cause
In `src/services/liquidity-pool-creation-detector.service.js`, the `parsePumpFunInstruction` method was incorrectly handling account resolution:

- For `create` instructions: Used `accounts[0]` directly (incorrect)
- For `graduate` instructions: Used `accountKeys[accounts[0]]` to resolve indices (correct)

This inconsistency meant that when `accounts` contained numeric indices, the create instruction parser would use the index number as the address instead of resolving it.

## Fix Applied
Updated the token extraction logic in `parsePumpFunInstruction` (lines 1551-1562) to properly handle both numeric indices and direct addresses:

```javascript
// OLD (incorrect):
const tokenMint = accounts[0] || null;
const bondingCurve = accounts[1] || null;
const creator = accounts[2] || null;

// NEW (fixed):
const tokenMint = accounts[0] !== undefined ? 
  (typeof accounts[0] === 'number' ? accountKeys[accounts[0]] : accounts[0]) : null;
const bondingCurve = accounts[1] !== undefined ? 
  (typeof accounts[1] === 'number' ? accountKeys[accounts[1]] : accounts[1]) : null;
const creator = accounts[2] !== undefined ? 
  (typeof accounts[2] === 'number' ? accountKeys[accounts[2]] : accounts[2]) : null;
```

## How It Works
1. Checks if the account value is defined
2. If it's a number, treats it as an index and resolves via `accountKeys[index]`
3. If it's a string, uses it directly as the address
4. Falls back to null if undefined

## Debug Logging Added
Added console logs to help diagnose the issue:
- Account array length and types
- Raw account[0] value and type
- Resolved token mint and bonding curve addresses

## Testing
Created `test-pump-fun-fix.js` to verify the fix handles:
1. Numeric indices (should resolve via accountKeys)
2. Direct addresses (should use as-is)
3. Mixed format (should handle both correctly)

## Expected Outcome
- Pump.fun token addresses will now be correctly extracted from transactions
- No more hardcoded 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf addresses
- LP candidates will have proper token addresses for filtering
- Trading system should resume normal operation with proper token detection

## Verification
Run the system and look for logs showing:
```
🔍 Pump.fun create instruction accounts: X accounts
🔍 accounts[0] type: number, value: Y
✅ Resolved tokenMint: <actual token address>
✅ Resolved bondingCurve: <actual bonding curve address>
```

The resolved addresses should be different for each transaction, not the hardcoded value.