# TokenMint Object to String Conversion Fix

## Issue
LP candidates were being created successfully but rejected by the Renaissance filter with "Token address is undefined or missing" because tokenMint was being passed as `[object Object]` instead of the actual address string.

## Root Cause
When using `jsonParsed` encoding, accountKeys can be returned as either:
1. Strings (the address directly)
2. Objects with a `pubkey` property
3. PublicKey objects with `toBase58()` method

The code was not handling these different formats properly, resulting in objects being passed where strings were expected.

## Solution
Created a centralized `extractAddressString()` helper function that handles all possible accountKey formats:

```javascript
extractAddressString(accountKey) {
  if (!accountKey) return null;
  
  // Already a string
  if (typeof accountKey === 'string') return accountKey;
  
  // Has pubkey property (common in parsed transactions)
  if (accountKey.pubkey) return accountKey.pubkey;
  
  // PublicKey object with toBase58 method
  if (accountKey.toBase58 && typeof accountKey.toBase58 === 'function') {
    return accountKey.toBase58();
  }
  
  // Fallback to toString
  if (accountKey.toString && typeof accountKey.toString === 'function') {
    const str = accountKey.toString();
    // Avoid [object Object] string
    if (str !== '[object Object]') {
      return str;
    }
  }
  
  console.warn(`⚠️ Unknown accountKey format:`, accountKey);
  return null;
}
```

## Changes Applied
1. Added centralized `extractAddressString()` method to handle all formats
2. Updated Pump.fun instruction parsing to use the helper
3. Updated Raydium instruction parsing to use the helper
4. Updated Orca instruction parsing to use the helper
5. All token addresses are now properly extracted as strings

## Impact
- Token addresses will now be properly extracted as strings
- No more `[object Object]` being passed to the Renaissance filter
- LP candidates will have valid `tokenAddress`, `tokenA`, and `tokenB` fields
- Renaissance filter will be able to properly validate tokens

## Debug Output
You'll now see logs like:
```
✅ Resolved tokenMint: 7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr (from object)
✅ Resolved bondingCurve: 8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN (from object)
```

Instead of:
```
✅ Resolved tokenMint: [object Object] (from object)
```

## Testing
The fix handles all common formats:
- String addresses: Passed through as-is
- Objects with pubkey: Extracts the pubkey property
- PublicKey objects: Calls toBase58() method
- Other objects: Safely falls back to toString() with validation

This ensures compatibility with all transaction formats returned by the Solana RPC.