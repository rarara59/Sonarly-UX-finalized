Create complete foundational infrastructure for the Thorp meme coin trading system.

SYSTEM PURPOSE:
Build lean, profitable meme coin trading system on $150/month budget competing against retail traders using manual methods (3-7 minute reaction times). Target: 10-30 second automated detection and analysis.

FOUNDATION REQUIREMENTS:
This must be a complete trading system foundation supporting:
- Multi-RPC endpoint failover (Helius, Chainstack, Public fallback)
- Circuit breaker protection during Solana network congestion
- Structured logging for debugging during market volatility
- Configuration validation to prevent silent misconfigurations
- Memory-efficient long-running processes
- HTTP keep-alive for performance optimization

CREATE THESE FILES EXACTLY:

1. .env - Complete configuration template with these EXACT 32 variables:

# ========= RPC ENDPOINTS =========
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
CHAINSTACK_RPC_URL=https://solana-mainnet.core.chainstack.com/YOUR_CHAINSTACK_KEY
PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com

# ========= GLOBAL DEFAULTS =========
RPC_DEFAULT_RPS_LIMIT=50
RPC_DEFAULT_CONCURRENCY_LIMIT=10
RPC_DEFAULT_TIMEOUT_MS=2000
RPC_RATE_WINDOW_MS=1000
RPC_MAX_IN_FLIGHT_GLOBAL=200

# ========= QUEUE CONFIG =========
RPC_QUEUE_MAX_SIZE=1000
RPC_QUEUE_DEADLINE_MS=5000
RPC_QUEUE_REJECT_FAST_MS=10

# ========= CIRCUIT BREAKER =========
RPC_BREAKER_ENABLED=true
RPC_BREAKER_FAILURE_THRESHOLD=5
RPC_BREAKER_COOLDOWN_MS=60000
RPC_BREAKER_HALF_OPEN_PROBES=1

# ========= HEDGING STRATEGY =========
RPC_HEDGING_ENABLED=true
RPC_HEDGING_DELAY_MS=200
RPC_HEDGING_MAX_EXTRA=1
RPC_ABORT_HEDGE_ON_PRIMARY_SUCCESS=true

# ========= HEALTH MONITORING =========
RPC_HEALTH_INTERVAL_MS=30000
RPC_HEALTH_JITTER_MS=5000
RPC_HEALTH_PROBE_TIMEOUT_MS=1000
RPC_HEALTH_PROBE_RPS_LIMIT=2

# ========= CONNECTION MANAGEMENT =========
RPC_KEEP_ALIVE_ENABLED=true
RPC_KEEP_ALIVE_SOCKETS=50
RPC_KEEP_ALIVE_TIMEOUT_MS=60000

# ========= DETECTION CONFIG =========
MIN_EDGE_SCORE=60
MIN_LIQUIDITY_USD=10000
MAX_HOLDER_CONCENTRATION=0.3
MIN_MARKET_CAP_USD=50000
MAX_MARKET_CAP_USD=10000000
MIN_TOKEN_AGE_MINUTES=30
MAX_TOKEN_AGE_HOURS=24

# ========= LOGGING =========
LOG_LEVEL=info
LOG_JSON=true
TRACE_REQUEST_IDS=true
RPC_ERROR_STACKS=false

2. package.json - Include these dependencies:
{
  "name": "thorp-trading-system",
  "version": "1.0.0",
  "type": "module",
  "description": "Lean profitable meme coin trading system",
  "dependencies": {
    "pino": "^8.15.0",
    "pino-pretty": "^10.2.0",
    "node-fetch": "^3.3.2",
    "dotenv": "^16.3.1"
  },
  "scripts": {
    "test": "node scripts/test-foundation.js",
    "test:rpc": "node scripts/verify-rpc-connection-pool.js",
    "start": "node system/main.js"
  }
}

3. src/config/index.js - Configuration loader with validation:
- Load all environment variables with proper defaults
- Validate required variables are present (API keys can be placeholder)
- Parse numeric values correctly (timeouts, limits, thresholds)
- Validate URLs are properly formatted
- Export structured configuration object with these sections:
  * rpc: { endpoints, timeouts, limits, circuitBreaker, hedging, health, keepAlive }
  * detection: { minEdgeScore, minLiquidity, maxHolderConcentration, marketCap, tokenAge }
  * logging: { level, json, traceRequestIds, errorStacks }

4. src/logger/structured-logger.js - Pino-based logger:
- JSON structured output for production
- Request ID tracing capability
- Different log levels (debug, info, warn, error)
- Integration ready for RPC pool usage
- Export factory function: createStructuredLogger(config)

5. impl/logger.real.js - Logger implementation matching RPC pool interface:
Must implement exactly:
- info(message, data) - Log info with structured data
- warn(message, data) - Log warnings with structured data  
- error(message, data) - Log errors with structured data
- debug(message, data) - Log debug info with structured data

6. impl/circuit-breaker.real.js - Circuit breaker with states: CLOSED → OPEN → HALF-OPEN:
Must implement exactly:
- execute(name, operation) - Execute operation with circuit protection
- getStats() - Return { state, failures, lastFailure, successes }
- isOpen() - Return true if circuit is open
- State transitions: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing) → CLOSED

7. src/config/rpc-pool-config.js - RPC endpoint configuration:
- Parse RPC URLs from environment variables
- Create endpoint configuration with weights and priorities:
  * Helius: weight 3, priority 1 (fastest)
  * Chainstack: weight 3, priority 2 (backup premium)  
  * Public: weight 1, priority 3 (fallback)
- Export getRpcPoolConfig() function

8. src/utils/validation.js - Configuration validation helpers:
- validateUrl(url) - Ensure URL is properly formatted
- validatePositiveInteger(value, name) - Validate numeric config
- validateBooleanString(value, name) - Parse boolean environment variables
- validateApiKey(key, name) - Ensure API key format is reasonable

INTEGRATION SPECIFICATIONS:
- Logger must accept: logger.info('message', { data: 'object' })
- Circuit breaker must have: execute(name, operation), getStats(), isOpen()
- Configuration must validate all .env variables on startup
- All components must handle missing dependencies gracefully
- RPC pool integration: Use these exact interfaces

RENAISSANCE STANDARDS:
- Fast: <1ms configuration loading, <1ms log writes
- Reliable: Proper error handling, no crashes on bad config
- Simple: Clear code structure, no over-engineering
- Production-ready: Memory efficient, handles edge cases

VALIDATION REQUIREMENTS:
Create scripts/test-foundation.js that:
1. Tests configuration loading with valid/invalid .env scenarios
2. Tests logger outputs proper JSON structure with request IDs
3. Tests circuit breaker state transitions (CLOSED → OPEN → HALF_OPEN)
4. Shows integration works with existing RPC pool pattern
5. Measures performance (config load <1ms, log write <1ms)
6. Validates all required environment variables parse correctly
7. Tests URL validation catches malformed endpoints
8. Tests numeric validation catches invalid timeouts/limits

SPECIFIC TEST SCENARIOS:
- Missing .env file handling
- Invalid URL formats in environment variables
- Invalid numeric values (negative timeouts, zero limits)
- Missing API key placeholders
- Logger JSON output structure validation
- Circuit breaker failure threshold behavior
- Configuration hot-reload capability

RUN the test script and show me:
- ✅ Configuration loads successfully with proper validation
- ✅ Logger outputs structured JSON with request tracing
- ✅ Circuit breaker transitions between all three states correctly
- ✅ Performance meets <1ms requirements for config and logging
- ✅ Integration interfaces match existing RPC pool expectations
- ✅ All environment variables parse and validate correctly
- ✅ Error handling works for malformed configuration
- ✅ Memory usage remains stable during testing

The foundation must work immediately and enable the RPC pool to use premium endpoints with <30ms latency. After this foundation is built, the existing RPC connection pool will integrate seamlessly with proper configuration loading, structured logging, and circuit breaker protection.