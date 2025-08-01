# AccountKeys Contamination Debug Implementation

## Debug Points Added

### 1. AccountKeys Full Debug
In `parsePumpFunInstruction`, added comprehensive debugging:
```javascript
console.log(`🔍 ACCOUNTKEYS FULL DEBUG:`, {
  accountKeys_length: accountKeys?.length || 0,
  accountKeys_first_10: accountKeys?.slice(0, 10)?.map((key, idx) => ({
    index: idx,
    address: typeof key === 'object' ? key.pubkey : key,
    type: typeof key
  })),
  accounts_0_value: accounts[0],
  accounts_0_resolved: accountKeys?.[accounts[0]],
  duplicate_addresses: this.findDuplicateAddresses(accountKeys)
});
```

### 2. Transaction Debug
At the start of `parseInstructionsForLPCreation`:
```javascript
console.log(`🔍 TRANSACTION DEBUG:`, {
  signature: txSignature || 'unknown',
  slot: transaction.slot || 'unknown',
  blockTime: transaction.blockTime || 'unknown',
  accountKeys_hash: this.hashAccountKeys(accountKeys)
});
```

### 3. AccountKeys Freshness Check
```javascript
console.log(`🔍 ACCOUNTKEYS FRESHNESS:`, {
  processing_new_transaction: true,
  accountKeys_changed: this.lastAccountKeysHash !== this.hashAccountKeys(accountKeys),
  last_hash: this.lastAccountKeysHash,
  current_hash: this.hashAccountKeys(accountKeys)
});
```

### 4. Helper Methods Added
- `findDuplicateAddresses(accountKeys)` - Identifies duplicate addresses and their indices
- `hashAccountKeys(accountKeys)` - Creates MD5 hash for deduplication check

## Expected Debug Output

This will reveal:
1. **Duplicate addresses** - If the hardcoded address appears at multiple indices
2. **AccountKeys structure** - First 10 entries with their types and addresses
3. **Transaction uniqueness** - Whether we're processing the same transaction repeatedly
4. **AccountKeys freshness** - If accountKeys are being properly updated between transactions

## Key Questions This Will Answer

1. Is `4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf` present at multiple indices?
2. Are we processing the same transaction signature multiple times?
3. Are accountKeys being refreshed between different transactions?
4. What's the actual content of accountKeys at indices 8 and 9?

## Next Steps

Run the system again and look for:
- `duplicate_addresses` showing the hardcoded address at multiple indices
- `accountKeys_changed: false` indicating stale data
- Same `accountKeys_hash` across different transactions
- The actual addresses at indices 0-9 in the accountKeys array