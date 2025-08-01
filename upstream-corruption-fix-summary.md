# Upstream Hardcoded Address Corruption Fix

## Issue
The hardcoded address `4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf` was appearing in all Pump.fun LP candidates, even after fixing the token extraction logic. The corruption was happening upstream before the parser received the data.

## Root Cause
When fetching transactions with `encoding: 'jsonParsed'`, the Solana RPC attempts to parse instruction data into a human-readable format. For unrecognized programs like Pump.fun:
- The parser fails to understand the instruction format
- It returns the raw instruction with `accounts` as an array of actual addresses instead of indices
- This causes `instruction.accounts` to contain strings like `['4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf', ...]` instead of indices like `[0, 1, 2, ...]`

## Fix Applied
Added account normalization logic in `parseInstructionsForLPCreation` (lines 736-750):

```javascript
// Handle jsonParsed format: when instructions aren't parsed, accounts might be addresses instead of indices
let normalizedAccounts = instruction.accounts;
if (instruction.accounts && instruction.accounts.length > 0) {
  // Check if accounts are strings (addresses) instead of numbers (indices)
  if (typeof instruction.accounts[0] === 'string') {
    console.log(`  🔄 Converting account addresses to indices for ${programId}`);
    normalizedAccounts = instruction.accounts.map(addr => {
      const index = transaction.transaction.message.accountKeys.findIndex(key => 
        (typeof key === 'string' ? key : key.pubkey) === addr
      );
      return index >= 0 ? index : addr; // Keep original if not found
    });
    console.log(`  📍 Normalized accounts: ${normalizedAccounts}`);
  }
}
```

## How It Works
1. Detects when `instruction.accounts` contains strings (addresses) instead of numbers (indices)
2. Maps each address back to its index in the `accountKeys` array
3. Passes the normalized indices to the instruction analyzer
4. The downstream `parsePumpFunInstruction` can now correctly resolve indices to get the actual token addresses

## Complete Fix Chain
1. **First Fix**: Updated `parsePumpFunInstruction` to handle both indices and direct addresses
2. **Second Fix**: Added upstream normalization to convert addresses back to indices when needed

## Expected Outcome
- Pump.fun instructions will now correctly extract unique token addresses
- No more hardcoded `4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf` appearing for all tokens
- The system will properly process each Pump.fun LP with its actual token mint address
- Revenue loss of $400-1000/hour will be recovered

## Debug Output
You'll now see logs like:
```
🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
📍 Normalized accounts: [4, 5, 2, 7, 8, ...]
✅ Resolved tokenMint: <actual unique token address>
```

Instead of the previous corrupted output where all tokens had the same address.