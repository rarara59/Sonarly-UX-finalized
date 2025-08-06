# FIX: RPC Timeout Configuration

## Issue
RPC timeout set to 30ms causes all endpoints to be marked as degraded when they need 5000ms for normal operation.

## Files to Change
- `src/detection/transport/rpc-connection-pool.js`

## Required Changes
1. Change timeout from 30ms to 5000ms for production reliability
2. Update any timeout references in connection logic
3. Ensure timeout applies to all RPC endpoint calls

## Commands
```bash
# Find current timeout settings
grep -n "timeout.*30\|30.*timeout" src/detection/transport/rpc-connection-pool.js

# Replace 30ms timeout with 5000ms
sed -i 's/timeout.*30/timeout: 5000/g' src/detection/transport/rpc-connection-pool.js
sed -i 's/30.*timeout/5000 \/\/ timeout/g' src/detection/transport/rpc-connection-pool.js

# Handle any timeout: 30 patterns
sed -i 's/timeout: 30/timeout: 5000/g' src/detection/transport/rpc-connection-pool.js

# Verify changes
grep -n "timeout.*5000\|5000.*timeout" src/detection/transport/rpc-connection-pool.js
```

## Test Fix
```bash
# Test timeout configuration
node -e "const {RpcConnectionPool} = require('./src/detection/transport/rpc-connection-pool.js'); console.log('Testing RPC pool creation...');" 

# Check for timeout values in file
grep -C 2 "5000" src/detection/transport/rpc-connection-pool.js
```

## Validation Checklist
- ☐ No 30ms timeout values remain in RPC pool
- ☐ Timeout set to 5000ms for production use
- ☐ RPC pool initializes without timeout errors
- ☐ Endpoints not immediately marked as degraded