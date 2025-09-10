# PROMPT: Fix Component Interface Mismatch

## SINGLE FOCUS
Fix RpcManager component interface calls to match extracted component method names

## CRITICAL BUG TO FIX
**Error**: `this.components.connectionPool.executeWithEndpoint is not a function`
**Location**: `src/detection/transport/rpc-manager.js` line 411
**Root Cause**: Method name mismatch between RpcManager expectations and actual component exports

## FILE TO MODIFY
**MODIFY**: `src/detection/transport/rpc-manager.js`

## DIAGNOSTIC FIRST
Before fixing, identify actual component method names:

```javascript
// Check ConnectionPoolCore exports:
import { ConnectionPoolCore } from './connection-pool-core.js';
console.log('ConnectionPoolCore methods:', Object.getOwnPropertyNames(ConnectionPoolCore.prototype));

// Check CircuitBreaker exports:
import { CircuitBreaker } from './circuit-breaker.js';  
console.log('CircuitBreaker methods:', Object.getOwnPropertyNames(CircuitBreaker.prototype));

// Check TokenBucket exports:
import { TokenBucket } from './token-bucket.js';
console.log('TokenBucket methods:', Object.getOwnPropertyNames(TokenBucket.prototype));

// Check EndpointSelector exports:
import { EndpointSelector } from './endpoint-selector.js';
console.log('EndpointSelector methods:', Object.getOwnPropertyNames(EndpointSelector.prototype));
```

## LIKELY INTERFACE FIXES REQUIRED

### Fix 1: ConnectionPool Method Call
```javascript
// CURRENT (BROKEN):
return await this.components.connectionPool.executeWithEndpoint(endpoint, request);

// LIKELY FIXES (choose correct one):
return await this.components.connectionPool.execute(endpoint, request);
// OR
return await this.components.connectionPool.makeRequest(endpoint, request);
// OR  
return await this.components.connectionPool.executeRequest(endpoint, request);
```

### Fix 2: CircuitBreaker Method Call
```javascript
// CURRENT (likely broken):
await this.components.circuitBreaker.executeWithProtection(fn);

// LIKELY FIXES:
await this.components.circuitBreaker.execute(fn);
// OR
await this.components.circuitBreaker.run(fn);
// OR
await this.components.circuitBreaker.protect(fn);
```

### Fix 3: TokenBucket Method Call
```javascript
// CURRENT (likely broken):
const allowed = await this.components.tokenBucket.checkRateLimit();

// LIKELY FIXES:
const allowed = await this.components.tokenBucket.hasTokens();
// OR
const allowed = await this.components.tokenBucket.allow();
// OR
const allowed = await this.components.tokenBucket.check();
```

### Fix 4: EndpointSelector Method Call
```javascript
// CURRENT (likely broken):
const endpoint = this.components.endpointSelector.selectHealthyEndpoint();

// LIKELY FIXES:
const endpoint = this.components.endpointSelector.select();
// OR
const endpoint = this.components.endpointSelector.getEndpoint();
// OR
const endpoint = this.components.endpointSelector.selectEndpoint();
```

## SYSTEMATIC FIX APPROACH

### Step 1: Find All Component Calls in RpcManager
Search for patterns like:
- `this.components.connectionPool.`
- `this.components.circuitBreaker.`
- `this.components.tokenBucket.`
- `this.components.endpointSelector.`
- `this.components.requestCache.`
- `this.components.batchManager.`
- `this.components.hedgedManager.`

### Step 2: Match Against Actual Component Methods
For each component call found, verify the method exists in the extracted component file.

### Step 3: Update Method Calls
Replace incorrect method names with correct ones based on actual component exports.

### Step 4: Validate Integration
Ensure parameter passing matches between old calls and new component methods.

## EXPECTED FIXES NEEDED
Based on typical refactoring patterns, expect to update:
- 5-10 method calls in RpcManager
- Primarily in ConnectionPool, CircuitBreaker, and EndpointSelector interfaces
- Method signatures may need parameter adjustments

## SUCCESS CRITERIA
- RpcManager compiles without import errors
- All component method calls resolve to existing methods
- Test runs without "is not a function" errors
- System maintains same functionality as monolithic version

## VALIDATION COMMAND
After fixes, test with:
```bash
node scripts/test-realtime-detection-speed.js
```