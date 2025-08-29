Build and integrate RpcConnectionPool into the existing trading system.

COMPONENT SPECIFICATION:
- Name: rpc-connection-pool
- Purpose: Solana RPC client with failover and circuit breaking for MEME COIN TRADING
- External Service: true
- Primary URL: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
- Backup URL: https://solana-mainnet.core.chainstack.com/YOUR_KEY
- Main Method: call(method, params, options)
- Success Proof: Returns real Solana block height from mainnet

TRADING SYSTEM REQUIREMENTS:
- Latency: <30ms p95 (measured and logged)
- Reliability: 99.9% uptime during market volatility
- Trading Context: Detect profitable meme coins in 10-30 seconds before retail traders (who take 3-7 minutes)
- Load Pattern: Handle 1000+ TPS burst traffic during viral meme events
- Money-losing scenarios to prevent: RPC failures during viral meme events, cascade failures, incorrect data parsing

INTEGRATION REQUIREMENTS:
1. Must integrate with existing system architecture
2. Must preserve all existing functionality 
3. Must enable end-to-end data flow with current components
4. Must maintain system startup and shutdown procedures
5. System must remain operational throughout integration

CRITICAL REQUIREMENTS:
1. Must connect to REAL external services immediately
2. Must handle REAL network failures (timeout, 503, connection refused, malformed responses)
3. Must include circuit breaker to prevent cascade failures
4. Must have failover between primary/backup endpoints
5. Must log all operations for debugging during market events
6. Must be optimized for trading system latency requirements

ROADMAP-SPECIFIC CRITICAL FIXES (MUST IMPLEMENT):
1. **Null currentEndpoint prevention** - Never return null endpoint (prevents system death spiral)
2. **Promise.race resource cleanup** - Clean up unused promises to prevent memory leaks
3. **Error.message safety** - Handle missing error.message property (prevents TypeError crashes)
4. **RequestId overflow handling** - Prevent request ID integer overflow for long-running stability
5. **Monitor validation** - Type safety for telemetry methods to prevent runtime errors

RENAISSANCE BUG PREVENTION (MUST IMPLEMENT):
- **String-to-number conversion bugs**: Ensure RPC responses parsed as numbers not concatenated as strings
- **Race conditions**: Avoid concurrent access to shared state (endpoint selection, stats)
- **Async/sync mismatches**: Don't use fake async for synchronous operations
- **Wrong data format parsing**: Handle base64 vs base58 encoding correctly
- **Undefined variable crashes**: Check all object properties exist before access
- **Memory leaks**: Properly clean up timers, event listeners, and pending requests

COMPREHENSIVE MEMORY LEAK PREVENTION (MUST IMPLEMENT):
- **Promise cleanup**: Clean up all unused promises from Promise.race operations and failed requests
- **Timer disposal**: Clear all intervals and timeouts (health monitoring, circuit breaker cooldowns)
- **Event listener cleanup**: Remove all event listeners on HTTP agents and connections
- **HTTP connection cleanup**: Properly close and dispose HTTP agents and keep-alive connections on shutdown
- **Request tracking cleanup**: Clear all Map/Set objects used for request tracking (in-flight requests, stats)
- **Circuit breaker state reset**: Clean up circuit breaker timers and state on component destruction
- **Queue cleanup**: Clear bounded queues and pending operations on shutdown
- **Reference cleanup**: Null out large object references to prevent retention
- **Periodic garbage collection**: Implement periodic cleanup of expired requests and stats
- **Memory monitoring**: Track memory usage and implement cleanup thresholds
- **Graceful shutdown methods**: Implement destroy() and cleanup() methods for controlled teardown
- **Resource disposal patterns**: Use try/finally blocks to ensure cleanup even during exceptions

CHECKLIST-SPECIFIC REQUIREMENTS (MUST IMPLEMENT):
- **P2.1 Weight distribution**: Simple round-robin endpoint selection (not complex algorithms)
- **P2.2 Concurrency caps**: Respect RPC_DEFAULT_CONCURRENCY_LIMIT=10 limit
- **P2.3 RPS limits**: Implement RPC_DEFAULT_RPS_LIMIT=50 rate limiting with RPC_RATE_WINDOW_MS=1000
- **P2.4 Timeout handling**: Use RPC_DEFAULT_TIMEOUT_MS=2000 for all requests
- **P2.5 Fallback logic**: Automatic failover between primary/backup/public endpoints
- **P2.6 Health status**: Implement health monitoring with RPC_HEALTH_INTERVAL_MS=30000

ADDITIONAL TECHNICAL REQUIREMENTS:
- Structured logging with request_id for debugging (JSON format)
- HTTP keep-alive for performance (RPC_KEEP_ALIVE_SOCKETS=50)
- Bounded queues with size limits (prevent memory exhaustion)
- Circuit breaker: 3 states (CLOSED/OPEN/HALF_OPEN) with RPC_BREAKER_FAILURE_THRESHOLD=5
- Graceful degradation during partial failures

EXACT CONFIGURATION (use ALL roadmap variables):
```javascript
const config = {
  // RPC Endpoints
  endpoints: [
    process.env.HELIUS_RPC_URL,           
    process.env.CHAINSTACK_RPC_URL,       
    process.env.PUBLIC_RPC_URL            
  ],
  
  // Global Defaults
  rpsLimit: parseInt(process.env.RPC_DEFAULT_RPS_LIMIT) || 50,
  concurrency: parseInt(process.env.RPC_DEFAULT_CONCURRENCY_LIMIT) || 10,
  timeout: parseInt(process.env.RPC_DEFAULT_TIMEOUT_MS) || 2000,
  rateWindow: parseInt(process.env.RPC_RATE_WINDOW_MS) || 1000,
  maxInFlight: parseInt(process.env.RPC_MAX_IN_FLIGHT_GLOBAL) || 200,
  
  // Queue Config
  queueMaxSize: parseInt(process.env.RPC_QUEUE_MAX_SIZE) || 1000,
  queueDeadline: parseInt(process.env.RPC_QUEUE_DEADLINE_MS) || 5000,
  queueRejectFast: parseInt(process.env.RPC_QUEUE_REJECT_FAST_MS) || 10,
  
  // Circuit Breaker
  breakerEnabled: process.env.RPC_BREAKER_ENABLED === 'true',
  breakerThreshold: parseInt(process.env.RPC_BREAKER_FAILURE_THRESHOLD) || 5,
  breakerCooldown: parseInt(process.env.RPC_BREAKER_COOLDOWN_MS) || 60000,
  breakerHalfOpenProbes: parseInt(process.env.RPC_BREAKER_HALF_OPEN_PROBES) || 1,
  
  // Hedging Strategy
  hedgingEnabled: process.env.RPC_HEDGING_ENABLED === 'true',
  hedgingDelay: parseInt(process.env.RPC_HEDGING_DELAY_MS) || 200,
  hedgingMaxExtra: parseInt(process.env.RPC_HEDGING_MAX_EXTRA) || 1,
  abortHedgeOnPrimarySuccess: process.env.RPC_ABORT_HEDGE_ON_PRIMARY_SUCCESS === 'true',
  
  // Health Monitoring
  healthInterval: parseInt(process.env.RPC_HEALTH_INTERVAL_MS) || 30000,
  healthJitter: parseInt(process.env.RPC_HEALTH_JITTER_MS) || 5000,
  healthProbeTimeout: parseInt(process.env.RPC_HEALTH_PROBE_TIMEOUT_MS) || 1000,
  healthProbeRpsLimit: parseInt(process.env.RPC_HEALTH_PROBE_RPS_LIMIT) || 2,
  
  // Connection Management
  keepAliveEnabled: process.env.RPC_KEEP_ALIVE_ENABLED === 'true',
  keepAliveSockets: parseInt(process.env.RPC_KEEP_ALIVE_SOCKETS) || 50,
  keepAliveTimeout: parseInt(process.env.RPC_KEEP_ALIVE_TIMEOUT_MS) || 60000,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logJson: process.env.LOG_JSON === 'true',
  traceRequestIds: process.env.TRACE_REQUEST_IDS === 'true',
  rpcErrorStacks: process.env.RPC_ERROR_STACKS === 'true'
}
```

FOR EXTERNAL SERVICE COMPONENTS:
- Make actual HTTP calls to provided URLs (real Solana mainnet)
- Test with real service endpoints (not mocks)
- Handle all realistic error conditions (timeout, 503, connection refused, malformed JSON)
- Include performance timing and monitoring (<30ms requirement)
- Add connection pooling for efficiency (HTTP keep-alive)
- Test specific Solana methods: getSlot(), getTokenSupply(mint), getTokenLargestAccounts(mint)

FOR INTERNAL COMPONENTS:  
- Implement actual business logic (not stubs) - full RPC pool management
- Include resource management and cleanup (close connections, clear timers)
- Handle edge cases and invalid inputs (null parameters, invalid URLs)
- Add performance monitoring (track latency, success rates, failures)

VALIDATION REQUIREMENTS:
You must actually RUN the code and show me it works:
- Connect to real external services and get real data (Solana mainnet block height >250 million)
- Test error conditions with real network failures (timeout invalid URLs)
- Verify performance meets trading requirements (<30ms p95 latency)
- Show component handles failure scenarios correctly (circuit breaker opens after 5 failures)
- Integrate with existing system and test end-to-end flow
- Verify entire system still starts and operates correctly

MEMORY LEAK VALIDATION REQUIREMENTS:
- Run stress test for 10+ minutes and verify memory usage remains stable
- Test cleanup methods work correctly (destroy(), shutdown())
- Verify no timers or intervals remain active after component destruction
- Test that HTTP connections are properly closed
- Monitor for any growing Map/Set objects or arrays during sustained operation
- Verify Promise.race operations don't accumulate uncleaned promises

CREATE THESE FILES:
1. src/detection/transport/rpc-connection-pool.js - Production implementation (300-500 lines max)
2. scripts/verify-rpc-connection-pool.js - Component validation (test real Solana calls)
3. scripts/stress-test-rpc-connection-pool.js - Performance testing (100 concurrent calls)
4. scripts/test-integration-rpc-connection-pool.js - Integration validation
5. README-rpc-connection-pool.md - Usage documentation

INTEGRATION TESTING:
- Test component works in isolation (basic RPC calls succeed)
- Test component integrates with existing system (no import/export conflicts)
- Test entire system works with new component (system starts successfully)
- Test system startup/shutdown with new component (graceful initialization)
- Verify no existing functionality is broken (all existing tests still pass)

SIMPLE IMPLEMENTATION (NOT enterprise complexity):
```javascript
class RpcConnectionPool {
  constructor(config) {
    this.endpoints = config.endpoints.filter(Boolean); // Remove nulls
    this.currentIndex = 0;
    this.circuitBreaker = { state: 'CLOSED', failures: 0, lastFailure: 0 };
    this.requestId = 0;
    this.stats = { calls: 0, failures: 0, avgLatency: 0 };
  }

  async call(method, params = [], options = {}) {
    // Simple implementation with all safety patterns
    // - Null endpoint prevention
    // - Promise.race cleanup  
    // - Error.message safety
    // - RequestId overflow handling
    // - Monitor validation
  }

  async destroy() {
    // Comprehensive cleanup implementation
    // - Clear all timers and intervals
    // - Close HTTP connections
    // - Clear tracking objects
    // - Null out references
  }
}
```

NO ACADEMIC FLUFF:
- No complex algorithms or patterns
- No unnecessary abstractions
- No enterprise monitoring dashboards  
- No sophisticated connection pooling libraries
- No weighted load balancing beyond simple round-robin
- No auto-scaling or dynamic configuration

RUN ALL SCRIPTS and show me the results. Component and integration must work before you finish.

VALIDATION PROOF:
Show me getSlot() returns real Solana block height from all 3 endpoints with <30ms timing and proper failover behavior.