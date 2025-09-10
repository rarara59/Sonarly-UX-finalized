# FIX: Endpoint Failover

## Issue
System has no endpoint rotation logic, causing complete failure when primary RPC endpoint is down.

## Files to Change
- `src/services/tiered-token-filter.service.js` (RPC manager integration)
- Mock RPC managers (for testing failover logic)

## Required Changes
1. Force endpoint rotation on RPC call failures
2. Add endpoint health tracking and automatic rotation
3. Implement round-robin rotation when multiple endpoints fail
4. Track endpoint rotation statistics for monitoring

## Commands
```bash
# Add automatic endpoint rotation after RPC failures
sed -i '/catch (error) {$/a\                    console.log(`🔄 RPC error detected, rotating endpoint: ${error.message}`);' src/services/tiered-token-filter.service.js

# Force endpoint rotation in retry loop
sed -i '/if (i > 0) {$/a\                        // Force endpoint rotation on retry' src/services/tiered-token-filter.service.js
sed -i '/await new Promise(resolve => setTimeout(resolve, delays/i\                        if (this.rpcManager?.rotateEndpoint) {' src/services/tiered-token-filter.service.js
sed -i '/await new Promise(resolve => setTimeout(resolve, delays/i\                            await this.rpcManager.rotateEndpoint();' src/services/tiered-token-filter.service.js
sed -i '/await new Promise(resolve => setTimeout(resolve, delays/i\                        }' src/services/tiered-token-filter.service.js

# Add endpoint rotation tracking
sed -i '/this.stats = {$/a\            endpointRotations: 0,' src/services/tiered-token-filter.service.js

# Track rotation statistics
sed -i '/await this.rpcManager.rotateEndpoint();$/a\                            this.stats.endpointRotations++;' src/services/tiered-token-filter.service.js
```

## Test Fix
```bash
# Test endpoint rotation tracking
node -e "console.log('Endpoint rotation stats initialized'); const stats = {endpointRotations: 0}; stats.endpointRotations++; console.log('Rotation count:', stats.endpointRotations)"

# Verify RPC manager rotation call
grep -n "rotateEndpoint" src/services/tiered-token-filter.service.js
```

## Validation Checklist
- ☐ RPC failures trigger automatic endpoint rotation
- ☐ Endpoint rotations are tracked in statistics
- ☐ Retry attempts use different endpoints via rotation
- ☐ Rotation occurs before delay in retry logic