# FIX: Raydium Pool Validation

## Issue
Raydium Detector validates tokens but not pool liquidity/structure, risking detection of honeypots and low-liquidity pools.

## Files to Change
- `src/detection/detectors/raydium-detector.js`

## Required Changes
1. Add poolValidator parameter to constructor and validation
2. Add pool validation method with circuit breaker protection
3. Integrate pool validation into token pair extraction flow
4. Include pool validation results in candidate data

## Commands
```bash
# Add poolValidator to constructor parameters
sed -i '' 's/constructor(signalBus, tokenValidator, circuitBreaker/constructor(signalBus, tokenValidator, poolValidator, circuitBreaker/' src/detection/detectors/raydium-detector.js

# Add poolValidator validation in constructor
sed -i '' 's/if (!tokenValidator) throw new Error/if (!poolValidator) throw new Error('\''PoolValidator is required'\'');\n    if (!tokenValidator) throw new Error/' src/detection/detectors/raydium-detector.js

# Store poolValidator reference
sed -i '' 's/this.tokenValidator = tokenValidator;/this.tokenValidator = tokenValidator;\n    this.poolValidator = poolValidator;/' src/detection/detectors/raydium-detector.js

# Add pool validation method before calculateConfidence
sed -i '' '/calculateConfidence(discriminatorInfo, tokenPair) {/i\
  async validatePoolWithCircuitBreaker(poolAddress, dexType) {\
    try {\
      return await this.circuitBreaker.execute(`poolValidation_${dexType}`, async () => {\
        return await this.poolValidator.validatePool(poolAddress, dexType);\
      });\
    } catch (error) {\
      return { valid: false, confidence: 0.2, reason: '\''circuit_breaker_blocked'\'' };\
    }\
  }\
\
' src/detection/detectors/raydium-detector.js

# Add pool validation after token validation success
sed -i '' '/this.metrics.validationSuccesses++;/a\
\
      const poolValidation = await this.validatePoolWithCircuitBreaker(ammId, '\''raydium'\'');\
      if (!poolValidation.valid) {\
        console.log(`❌ Pool validation failed: ${poolValidation.reason}`);\
        return null;\
      }
' src/detection/detectors/raydium-detector.js

# Add pool validation to return object
sed -i '' 's/tokenValidation/poolValidation,\n        tokenValidation/' src/detection/detectors/raydium-detector.js
```

## Test Fix
```bash
# Test constructor parameter update
grep -n "poolValidator, circuitBreaker" src/detection/detectors/raydium-detector.js

# Test pool validation method exists
grep -A 5 "validatePoolWithCircuitBreaker" src/detection/detectors/raydium-detector.js

# Test integration import
node -e "import('./src/detection/detectors/raydium-detector.js').then(() => console.log('Import successful'))"
```

## Validation Checklist
- ✓ Constructor requires poolValidator parameter
- ✓ Pool validation method added with circuit breaker protection
- ✓ Pool validation runs after token validation
- ✓ Invalid pools filtered out before signaling
- ✓ Pool validation results included in candidate data