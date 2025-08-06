# FIX: RPC Timeout Configuration

## Issue
30ms timeout causing 99% RPC call failures on Solana mainnet where normal response times are 100-500ms.

## Files to Change
- `src/detection/transport/transaction-fetcher.js` (line 119)

## Required Changes
1. Change timeout from 30ms to 5000ms for reliable mainnet calls
2. Update any other hardcoded timeout values in the same file
3. Verify circuit breaker timeout compatibility

## Commands
```bash
# Update main RPC timeout from 30ms to 5000ms
sed -i '' 's/timeout: 30/timeout: 5000/g' src/detection/transport/transaction-fetcher.js

# Check for any other 30ms timeouts in the file
grep -n "30" src/detection/transport/transaction-fetcher.js

# Verify the change was applied correctly
grep -n "timeout: 5000" src/detection/transport/transaction-fetcher.js
```

## Test Fix
```bash
# Test RPC connection with new timeout
node -e "
import('./src/detection/transport/rpc-connection-pool.js').then(module => {
  const rpc = new module.RpcConnectionPool({helius: {url: 'https://api.mainnet-beta.solana.com', priority: 1}});
  return rpc.call('getLatestBlockhash');
}).then(() => console.log('✅ RPC timeout fix working')).catch(e => console.log('❌ Still failing:', e.message));
"

# Test transaction fetcher with new timeout
node -e "
Promise.all([
  import('./src/detection/transport/rpc-connection-pool.js'),
  import('./src/detection/transport/transaction-fetcher.js')
]).then(([rpc, fetcher]) => {
  const pool = new rpc.RpcConnectionPool({helius: {url: 'https://api.mainnet-beta.solana.com', priority: 1}});
  const tf = new fetcher.TransactionFetcher(pool, {execute: async (fn) => fn()});
  console.log('✅ TransactionFetcher created with new timeout');
}).catch(e => console.log('❌ Error:', e.message));
"
```

## Validation Checklist
- [ ] No "Request timeout after 30ms" errors in logs
- [ ] RPC calls complete successfully without timeouts  
- [ ] TransactionFetcher can be instantiated without errors
- [ ] System can fetch at least one transaction signature
- [ ] No "All RPC endpoints failed" due to timeout issues