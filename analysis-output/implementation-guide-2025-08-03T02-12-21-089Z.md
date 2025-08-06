# Raydium Parser Implementation Guide

## Generated: 2025-08-03T02:12:21.095Z

### Summary
This guide provides the implementation steps for fixing the Raydium parser based on known patterns.

### Known Discriminators
- 0xe7: initialize2 (lp_creation)
- 0xe8: initialize (lp_creation)
- 0xe9: initialize3 (lp_creation)
- 0xea: initializeV4 (lp_creation)
- 0xeb: initializeV5 (lp_creation)
- 0xf8: createPool (lp_creation)
- 0x09: swap (swap)
- 0x0a: swapV2 (swap)
- 0xcc: deposit (liquidity)
- 0xe3: withdraw (liquidity)

### Token Extraction Rules
- **0xe7 (initialize2)**: Token A at position 8, Token B at position 9
- **0xe8 (initialize)**: Token A at position 7, Token B at position 8  
- **0xe9 (initialize3)**: Token A at position 7, Token B at position 8 (same as e8)

### Implementation Steps

1. **Update liquidity-pool-creation-detector.service.js**
   - Replace static discriminator mapping with complete set
   - Add discriminator-aware token extraction
   - Implement heuristic fallback for unknown discriminators

2. **Add Monitoring**
   - Track unknown discriminators
   - Monitor extraction success rate
   - Alert on new patterns

3. **Testing**
   - Test with known LP creation transactions
   - Verify token extraction accuracy
   - Monitor performance metrics

### Code Changes Required

1. In `analyzeRaydiumInstructionDebug`:
   - Add complete discriminator mapping
   - Support unknown discriminators with heuristics
   - Pass discriminator to extraction method

2. In `extractRaydiumTokenMintsDebug`:  
   - Implement discriminator-aware position mapping
   - Add fallback heuristic extraction
   - Improve error handling

3. Add new methods:
   - `recordUnknownDiscriminator`
   - `getMinAccountsForDiscriminator`
   - `getBaseConfidenceForDiscriminator`
