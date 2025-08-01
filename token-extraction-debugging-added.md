# Token Extraction Debugging Added

## Debugging Points Added

### 1. LP Candidate Processing Debug
In the main candidate processing loop, added comprehensive debugging:
```javascript
console.log(`🔍 TOKEN EXTRACTION DEBUG:`, {
  candidateType: candidate.constructor.name,
  tokenMint: candidate.tokenMint,
  tokenAddress: candidate.tokenAddress,
  accounts: candidate.accounts?.slice(0, 3), // First 3 accounts only
  instruction: candidate.instruction?.slice(0, 50) // First 50 chars
});
```

### 2. Pump.fun Candidate Creation Debug
When creating Pump.fun LP candidates:
```javascript
console.log(`    🔍 PUMP.FUN CANDIDATE DEBUG:`, {
  tokenMint: candidate.tokenMint,
  tokenAddress: candidate.tokenAddress,
  lpData_tokenMint: lpData.tokenMint,
  lpData_tokenAddress: lpData.tokenAddress,
  candidateKeys: Object.keys(candidate).filter(k => k.includes('token'))
});
```

### 3. Pump.fun Account Extraction Debug
In parsePumpFunInstruction where token addresses are extracted:
```javascript
console.log(`    🔍 PUMP.FUN ACCOUNT EXTRACTION DEBUG:`, {
  accounts_0: accounts[0],
  accounts_0_type: typeof accounts[0],
  tokenMintKey: tokenMintKey,
  tokenMintKey_type: typeof tokenMintKey,
  accountKeys_sample: accountKeys?.slice(0, 5)
});
```

## Expected Debug Output

This will help identify:
1. **Where the hardcoded address originates** - Is it in accounts[0] or during extraction?
2. **Account format issues** - Are accounts coming as strings instead of indices?
3. **Candidate structure** - What fields contain the token address?
4. **AccountKeys content** - What's in the first few accountKeys entries?

## Next Steps

Run the system and look for:
- If accounts[0] is already the hardcoded address
- If tokenMintKey shows the hardcoded address
- If accountKeys contains the hardcoded address at index 0
- The candidateType to understand the object structure

This will pinpoint exactly where the hardcoded address `4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf` is being introduced.