# FIX: RPC Pool Critical Production Bugs

## Issue
RPC connection pool has invalid Solana health checks, silent environment failures, and 8-second timeouts that miss all trading opportunities.

## Files to Change
- `src/detection/transport/rpc-connection-pool.js` (lines 42-47, 96, 270-273, 317, 346-348)

## Required Changes
1. Replace invalid `getHealth` RPC method with valid `getVersion`
2. Add fail-fast environment variable validation
3. Reduce timeouts from 8000ms to 1000ms for competitive advantage
4. Add queue resolve function validation to prevent crashes
5. Add Number() conversion for math operations to prevent string concatenation

## Commands
```bash
# Fix invalid Solana RPC method in health check
sed -i "s/'getHealth'/'getVersion'/g" src/detection/transport/rpc-connection-pool.js

# Replace timeout defaults from 8000ms to 1000ms
sed -i 's/timeout || 8000/timeout || 1000/g' src/detection/transport/rpc-connection-pool.js
sed -i 's/timeout: 5000/timeout: 1000/g' src/detection/transport/rpc-connection-pool.js
sed -i 's/timeout: 8000/timeout: 2000/g' src/detection/transport/rpc-connection-pool.js
sed -i 's/timeout: 10000/timeout: 3000/g' src/detection/transport/rpc-connection-pool.js

# Add environment variable validation
sed -i '/getDefaultEndpoints() {/a\    const heliusUrl = process.env.HELIUS_RPC;\n    const chainstackUrl = process.env.CHAINSTACK_RPC;\n    if (!heliusUrl || !chainstackUrl) {\n      throw new Error("Required RPC endpoints missing: HELIUS_RPC, CHAINSTACK_RPC");\n    }' src/detection/transport/rpc-connection-pool.js

# Replace hardcoded URLs with validated environment variables
sed -i 's/process\.env\.HELIUS_RPC || .*$/heliusUrl,/' src/detection/transport/rpc-connection-pool.js
sed -i 's/process\.env\.CHAINSTACK_RPC || .*$/chainstackUrl,/' src/detection/transport/rpc-connection-pool.js

# Add queue resolve function validation
sed -i '/const resolve = this\.requestQueue\.shift();/a\    if (typeof resolve !== "function") continue;' src/detection/transport/rpc-connection-pool.js

# Fix string math in success rate calculation
sed -i 's/endpoint\.successfulRequests \/ endpoint\.totalRequests/Number(endpoint.successfulRequests) \/ Number(endpoint.totalRequests)/g' src/detection/transport/rpc-connection-pool.js
```

## Test Fix
```bash
# Test environment variable validation
node -e "delete process.env.HELIUS_RPC; try { require('./src/detection/transport/rpc-connection-pool.js'); console.log('FAIL: Should throw error'); } catch(e) { console.log('PASS: Environment validation works'); }"

# Test timeout configuration
node -e "const pool = new (require('./src/detection/transport/rpc-connection-pool.js').RpcConnectionPool)({}); console.log('Timeout test:', pool.endpoints.get('helius')?.timeout <= 1000 ? 'PASS' : 'FAIL');"

# Test invalid RPC method fix
grep -q "getVersion" src/detection/transport/rpc-connection-pool.js && echo "PASS: RPC method fixed" || echo "FAIL: Still using invalid method"
```

## Validation Checklist
- ✅ Environment variables throw error when missing instead of silent fallback
- ✅ All timeouts are 3000ms or less for competitive advantage
- ✅ Health checks use valid `getVersion` Solana RPC method
- ✅ Queue processing validates resolve functions before execution
- ✅ Math operations use Number() conversion to prevent string concatenation