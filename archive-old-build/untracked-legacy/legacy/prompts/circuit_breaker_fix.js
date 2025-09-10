# Circuit Breaker Implementation Update

## Overview
The circuit breaker needs three method implementations to complete the functionality:
1. `execute()` - Main execution method
2. `getState()` - State getter with timing updates  
3. `_updateStateBasedOnTiming()` - Timing-based state transitions

## File to Update
`src/detection/core/circuit-breaker.js`

## Method 1: Replace execute() TODO

**Find this TODO:**
```javascript
async execute(operation) {
  // TODO: Implement main execution logic
  // 1. Check current state
  // 2. Handle OPEN state (immediate rejection)
  // 3. Handle HALF-OPEN state (single probe)
  // 4. Handle CLOSED state (normal execution)
  // 5. Record results and update state
  
  throw new Error('TODO: Implement execute method');
}
```

**Replace with:**
```javascript
async execute(operation) {
  // Update state based on timing before proceeding
  this._updateStateBasedOnTiming();
  
  // Handle OPEN state - immediate rejection
  if (this.state === 'OPEN') {
    this.stats.rejectedRequests++;
    throw new CircuitBreakerError(this.endpointId, 'OPEN');
  }
  
  // Execute operation and handle result
  try {
    const result = await operation();
    this._recordSuccess();
    return result;
  } catch (error) {
    // Only record as failure if it's actually a circuit-breaking error
    if (this.isFailureFn(error)) {
      this._recordFailure();
    } else {
      // Still count as a request, but not a failure
      this.stats.totalRequests++;
    }
    throw error;
  }
}
```

## Method 2: Replace getState() TODO

**Find this TODO:**
```javascript
getState() {
  // TODO: Update state based on timing before returning
  return this.state;
}
```

**Replace with:**
```javascript
getState() {
  // Update state based on timing before returning
  this._updateStateBasedOnTiming();
  return this.state;
}
```

## Method 3: Add new _updateStateBasedOnTiming() method

**Add this new method anywhere in the private methods section:**
```javascript
_updateStateBasedOnTiming() {
  // Only check timing transitions for OPEN state
  if (this.state === 'OPEN' && this.halfOpenAt && Date.now() >= this.halfOpenAt) {
    this.state = 'HALF-OPEN';
    this.stats.lastStateChange = new Date();
  }
}
```

## Implementation Notes

### execute() Method Logic:
1. Updates state timing before execution
2. Immediately rejects requests when circuit is OPEN
3. Executes operation and records success/failure
4. Uses error classification to determine if failure should trip circuit
5. Increments stats appropriately

### Key Features:
- **State Timing**: Automatically transitions OPEN → HALF-OPEN after cooldown
- **Error Classification**: Only infrastructure errors trip the circuit
- **Stats Tracking**: Tracks successes, failures, total requests, and rejections
- **Proper Integration**: Uses all existing tested methods

### Error Handling:
- Infrastructure errors (5xx, timeouts, DNS) trigger `_recordFailure()`
- Client errors (4xx, validation) pass through without tripping circuit
- OPEN state throws `CircuitBreakerError` immediately

## Testing
After implementation, run:
```bash
node test-execute-complete.js
```

Expected: All 8 tests should pass, validating complete circuit breaker functionality.

## Status After Update
This completes the circuit breaker implementation with full state machine:
- CLOSED → OPEN (on failure threshold)
- OPEN → HALF-OPEN (on cooldown expiry)  
- HALF-OPEN → CLOSED (on success)
- HALF-OPEN → OPEN (on failure)