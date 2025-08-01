# RPC Validation Race Condition Fix

## Issue
System detects LP creations in 94-250ms but token validation fails with "Invalid param: not a Token mint" because we're trying to validate tokens before RPC nodes have propagated the mint data.

## Solution
Implemented retry logic with progressive delays to handle RPC propagation delays.

## Changes Applied

### 1. Modified tiered-token-filter.service.js
Added `validateTokenWithRetry` method with:
- Progressive delays: 500ms, 1000ms, 2000ms
- RPC endpoint rotation on retry
- Duplicate request prevention with validation queue
- Graceful fallback handling

### 2. Updated RPC Connection Manager
Added support for `getTokenLargestAccounts` method:
- Added to METHOD_CATEGORIES
- Added to solanaMethods sets
- Added parameter validation
- Added to executeSolanaMethod switch case

## Implementation Details

```javascript
async validateTokenWithRetry(tokenMint, validationType = 'both', maxRetries = 3) {
    const delays = [500, 1000, 2000]; // Progressive delays
    
    // Prevent duplicate requests
    if (this.validationQueue.has(queueKey)) {
        return { success: false, error: 'Validation already in progress' };
    }
    
    // Retry loop with RPC rotation
    for (let i = 0; i < maxRetries; i++) {
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, delays[i-1]));
            if (this.rpcManager?.rotateEndpoint) {
                await this.rpcManager.rotateEndpoint();
            }
        }
        
        // Try validation with Promise.allSettled
        const results = await Promise.allSettled([...]);
        if (hasSuccess) return { success: true, data };
    }
}
```

## Expected Outcome
- Token validation will succeed even when mint data hasn't fully propagated
- Progressive delays give RPC nodes time to sync
- Endpoint rotation helps find nodes with fresher data
- Duplicate requests are prevented during retry periods
- System will handle new token validation more reliably

## Debug Output
You'll see logs like:
```
🔄 Token validation retry 1/3 for <tokenMint>: Invalid param: not a Token mint
🔄 Token validation retry 2/3 for <tokenMint>: Invalid param: not a Token mint
✅ Got token supply: 1000000000
✅ Got holder distribution: 1 holders
```