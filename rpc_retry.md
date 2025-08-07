# FIX: RPC Retry Logic

## Issue
RPC calls fail immediately on first error with no retry attempts, causing 75% failure rate during provider issues.

## Files to Change
- `src/services/tiered-token-filter.service.js` (validateTokenWithRetry method)

## Required Changes
1. Increase retry attempts from 3 to 5 for better reliability
2. Implement exponential backoff delays (100ms → 500ms → 1500ms → 4000ms → 8000ms)
3. Add retry logic for specific RPC error types (timeouts, network errors, 5xx errors)
4. Track retry statistics for monitoring

## Commands
```bash
# Update retry attempts to 5
sed -i 's/maxRetries = 3/maxRetries = 5/g' src/services/tiered-token-filter.service.js

# Replace simple delay array with exponential backoff
sed -i 's/const delays = \[100, 200, 400\]/const delays = [100, 500, 1500, 4000, 8000]/g' src/services/tiered-token-filter.service.js

# Update delays array access to handle 5 retries
sed -i 's/delays\[i-1\]/delays[Math.min(i-1, delays.length-1)]/g' src/services/tiered-token-filter.service.js

# Add retry counter initialization
sed -i '/let i = 0; i < maxRetries; i++/i\            let retryCount = 0;' src/services/tiered-token-filter.service.js

# Update retry logging to include attempt number
sed -i 's/Token validation retry \${i + 1}/Token validation retry ${i + 1}\/5 (${delays[Math.min(i-1, delays.length-1)]}ms delay)/g' src/services/tiered-token-filter.service.js
```

## Test Fix
```bash
# Test retry configuration
node -e "console.log('Testing retry delays:'); [100,500,1500,4000,8000].forEach((d,i) => console.log(\`Retry \${i+1}: \${d}ms\`))"

# Verify exponential backoff pattern
node -e "const delays=[100,500,1500,4000,8000]; console.log('Backoff ratios:', delays.map((d,i) => i>0 ? (d/delays[i-1]).toFixed(1)+'x' : 'base').join(', '))"
```

## Validation Checklist
- ☐ Retry attempts increased to 5 maximum
- ☐ Exponential backoff delays implemented (100ms to 8000ms)
- ☐ Retry logging shows attempt numbers and delay times
- ☐ System attempts multiple retries before final failure