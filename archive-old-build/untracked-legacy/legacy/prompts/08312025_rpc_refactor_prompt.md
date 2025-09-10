# Complete Claude Code Prompt Library - All 23 Execution Prompts

## PROMPT EXECUTION REFERENCE

**Total Prompts**: 24 Claude Code optimized prompts  
**Execution Sequence**: Phase 0 (3 sequential) → Phase 1 (7 parallel) → Phase 2 (7 parallel) → Phase 3 (3 sequential) → Phase 4 (4 sequential)  
**Estimated Total Time**: 18 hours over 3 days  

---

# PHASE 0: ORCHESTRATION FRAMEWORK (3 Sequential Prompts)
**Duration**: 3 hours sequential execution  
**Dependencies**: None (foundational phase)

## PROMPT 0A: RpcManager Orchestrator Creation

**SINGLE FOCUS**: Create main RpcManager class that orchestrates all 7 components

**EXPLICIT FILE PATHS**:
- **Target**: `src/detection/transport/rpc-manager.js`
- **Dependencies**: Will import all 7 components (to be created in Phase 1)

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create RpcManager class with dependency injection constructor for all 7 components
**Step 2**: Implement component initialization order and lifecycle management methods
**Step 3**: Create main call() method that orchestrates complete component flow
**Step 4**: Add component failure isolation and error handling throughout request flow
**Step 5**: Test orchestrator with mock components to validate integration patterns

**CLEAR SUCCESS CRITERIA**:

**Orchestration Requirements**:
- Component dependency injection: All 7 components properly injected via constructor
- Initialization order: Components initialize in correct dependency sequence
- Request flow: Requests flow through components in optimal order for trading performance
- Error isolation: Individual component failures don't cascade to kill entire system

**Performance Requirements**:
- Orchestration overhead: <10ms additional latency per request beyond component costs
- Memory efficiency: Orchestrator uses <10MB overhead for component coordination
- Startup time: Complete system initialization in <5 seconds from cold start
- Graceful degradation: System continues with 80% capability when components fail

**Component Flow Architecture**:
```javascript
async call(method, params, options = {}) {
  // Step 1: Rate limiting check (fail fast if over limit)
  if (!await this.tokenBucket.hasTokens()) {
    throw new RateLimitError('Rate limit exceeded');
  }

  // Step 2: Circuit breaker protection (wrap entire call chain)
  return await this.circuitBreaker.execute(`rpc_${method}`, async () => {
    
    // Step 3: Endpoint selection (choose best available endpoint)
    const endpoint = this.endpointSelector.selectEndpoint();
    
    // Step 4: Request caching (check for duplicate/cached requests)
    const cacheKey = this.generateCacheKey(method, params);
    return await this.requestCache.get(cacheKey, async () => {
      
      // Step 5: Request batching (combine with other requests if possible)
      return await this.batchManager.addRequest(method, params, async (batchedRequests) => {
        
        // Step 6: Hedged requests (parallel requests for critical calls)
        const primaryRequest = () => this.connectionPool.execute(endpoint, method, params);
        const backupRequests = this.shouldHedge(method, options) ? 
          [() => this.connectionPool.execute(this.endpointSelector.selectBackupEndpoint(), method, params)] : 
          [];
          
        return await this.hedgedManager.hedgedRequest(primaryRequest, backupRequests);
      });
    });
  });
}
```

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Component initialization success rate (target: 100% successful startup sequence)
- Request orchestration latency overhead (target: <10ms beyond component costs)
- Error isolation effectiveness (target: Single component failure doesn't kill system)
- Memory usage for orchestration (target: <10MB coordination overhead)
- Graceful degradation capability (target: 80%+ functionality with failed components)

---

## PROMPT 0B: Component Factory and Dependency Injection

**SINGLE FOCUS**: Create component factory for dependency injection and lifecycle management

**EXPLICIT FILE PATHS**:
- **Target**: `src/detection/transport/component-factory.js`
- **Configuration Source**: Environment variables and configuration files

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create ComponentFactory class with configuration loading and validation
**Step 2**: Implement component creation methods for all 7 components with dependency resolution
**Step 3**: Add component lifecycle management (initialize, start, stop, health check)
**Step 4**: Create dependency ordering system for correct component initialization sequence
**Step 5**: Test factory creates all components in correct order with proper configuration

**CLEAR SUCCESS CRITERIA**:

**Dependency Management Requirements**:
- Dependency resolution: Components created in correct dependency order every time
- Configuration validation: All required environment variables validated before component creation
- Component health: Individual component health checking capability for monitoring
- Lifecycle management: Graceful startup and shutdown of all components in proper sequence

**Component Creation Order (Dependency-Based)**:
```javascript
// Level 1: Dependency-free components (can be created in any order)
1. TokenBucket (requires only rate limit configuration)
2. CircuitBreaker (requires only failure threshold configuration)
3. RequestCache (requires only cache size and TTL configuration)

// Level 2: Configuration-dependent components
4. EndpointSelector (requires endpoint list and health check configuration)
5. ConnectionPoolCore (requires HTTP agent configuration and connection limits)

// Level 3: Component-dependent components
6. BatchManager (requires ConnectionPoolCore for batch execution)
7. HedgedManager (requires EndpointSelector + ConnectionPoolCore for hedged requests)

// Level 4: Orchestrator (requires all 7 components)
8. RpcManager (requires all components injected via constructor)
```

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Component creation success rate (target: 100% successful creation for valid configurations)
- Dependency resolution accuracy (target: 100% correct creation order every time)
- Configuration validation effectiveness (target: 100% of invalid configurations caught)
- Health check responsiveness (target: <100ms per component health check)
- Lifecycle management reliability (target: 100% graceful startup and shutdown)

---

## PROMPT 0C: Integration Error Handler

**SINGLE FOCUS**: Create error handling system for component failure isolation and recovery

**EXPLICIT FILE PATHS**:
- **Target**: `src/detection/transport/integration-error-handler.js`
- **Integration Point**: Used by RpcManager orchestrator for error handling

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create error classification system (component errors vs system errors vs network errors)
**Step 2**: Implement component failure detection and automatic isolation mechanisms
**Step 3**: Create fallback strategies for when individual components fail or become unavailable
**Step 4**: Add component recovery detection and automatic re-integration capability
**Step 5**: Test error handling with simulated component failures for all 7 components

**CLEAR SUCCESS CRITERIA**:

**Error Handling Requirements**:
- Component failure isolation: Failed components don't affect other working components
- Fallback strategies: System continues with degraded but functional capability during failures
- Recovery detection: Automatically re-integrate components when they become healthy again
- Error propagation: Clear error messages indicate exactly which component failed and why

**Fallback Strategy Design**:
```javascript
// Component-specific fallback behaviors:
TokenBucket failure → Disable rate limiting, continue with warning logs
CircuitBreaker failure → Disable circuit breaking, use basic retry with backoff
EndpointSelector failure → Use simple round-robin without health checking
ConnectionPoolCore failure → Use basic HTTP requests without connection pooling
RequestCache failure → Disable caching, continue without request deduplication  
BatchManager failure → Send individual requests instead of batching
HedgedManager failure → Use single requests instead of parallel hedged requests
```

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Failure isolation effectiveness (target: 100% of component failures properly isolated)
- Fallback strategy success rate (target: 80%+ system capability maintained during failures)
- Recovery detection accuracy (target: 100% of recovered components automatically re-integrated)
- Error message clarity (target: 100% of failures clearly attributed to specific component)

---

# PHASE 1: COMPONENT EXTRACTION (7 Parallel Prompts)
**Duration**: 2 hours parallel execution  
**Dependencies**: Phase 0 complete (orchestration framework defines integration patterns)

## PROMPT 1A: Token Bucket Extraction

**SINGLE FOCUS**: Extract rate limiting logic from existing 2000-line RPC connection pool

**EXPLICIT FILE PATHS**:
- **Source**: `src/detection/transport/rpc-connection-pool.js` (lines containing "rate", "limit", "throttle", "rps", "bucket")
- **Target**: `src/detection/transport/token-bucket.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Extract rate limiting variables, configuration, and token bucket algorithm from source file
**Step 2**: Create TokenBucket class with constructor, hasTokens(), and replenish() methods
**Step 3**: Test TokenBucket class in isolation with various rate limiting scenarios
**Step 4**: Create integration stub in original file: `this.tokenBucket.hasTokens()` ready for Phase 3
**Step 5**: Verify original file still compiles and functions with integration stub

**CLEAR SUCCESS CRITERIA**:

**Functional Requirements**:
- TokenBucket processes 1000 requests/sec with <10ms latency per token check
- Rate limiting accuracy: 95%+ (properly rejects requests when token bucket exhausted)
- Memory usage: <50MB for 100,000 token operations during sustained load
- Configuration loading: All rate limiting environment variables properly loaded and validated

**Performance Requirements**:
- Token consumption check: <1ms per hasTokens() call under normal load
- Token replenishment accuracy: Within 1% of configured rate over time windows
- Burst handling: Allows 2x normal rate for up to 10 seconds as configured
- Memory stability: No memory leaks during 1-hour continuous operation

**Integration Requirements**:  
- Original file compiles successfully after extraction with integration stub
- Integration interface: `this.tokenBucket.hasTokens()` method ready for orchestrator
- Export functionality: `import { TokenBucket } from './token-bucket.js'` works correctly
- Configuration compatibility: Existing environment variables work unchanged

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Rate limiting accuracy percentage (target: 95%+ rejection accuracy when over limit)
- Token check latency in milliseconds (target: <1ms per hasTokens() call)
- Memory usage during sustained operation (target: <50MB for extended operation)
- Burst tolerance effectiveness (target: 2x rate handling for 10 seconds)
- Configuration loading success rate (target: 100% for valid environment variables)

---

## PROMPT 1B: Circuit Breaker Extraction

**SINGLE FOCUS**: Extract circuit breaker state machine from existing 2000-line RPC connection pool

**EXPLICIT FILE PATHS**:
- **Source**: `src/detection/transport/rpc-connection-pool.js` (lines containing "circuit", "breaker", "failure", "threshold", "cooldown")
- **Target**: `src/detection/transport/circuit-breaker.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Extract circuit breaker state tracking, failure counting, and timeout management logic
**Step 2**: Create CircuitBreaker class with CLOSED/OPEN/HALF_OPEN state machine implementation
**Step 3**: Test state transitions in isolation with controlled failure and success scenarios
**Step 4**: Test per-service isolation (multiple services with independent circuit breaker states)
**Step 5**: Create integration stub in original file: `await circuitBreaker.execute(serviceName, fn)`

**CLEAR SUCCESS CRITERIA**:

**State Machine Requirements**:
- State transitions: 100% correct CLOSED → OPEN → HALF_OPEN → CLOSED transitions
- Failure threshold triggering: Opens circuit after exactly N failures (configurable)
- Cooldown timing: Respects configured timeout before transitioning to HALF_OPEN state
- Per-service isolation: 100 different services tracked independently without interference

**Performance Requirements**:
- State check latency: <1ms per execute() call including state machine logic
- Memory per service: <1KB overhead per tracked service for state management
- Recovery detection: <3 successful probes to return from HALF_OPEN to CLOSED state
- Concurrent safety: 1000 concurrent execute() calls without race conditions or state corruption

**Integration Requirements**:
- Original file compiles successfully after extraction with integration stub
- Integration interface: `await circuitBreaker.execute(serviceName, fn)` ready for orchestrator
- Export functionality: `import { CircuitBreaker } from './circuit-breaker.js'` works correctly
- Configuration compatibility: Existing circuit breaker environment variables work unchanged

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- State transition accuracy (target: 100% correct transitions under all scenarios)
- Failure threshold precision (target: Opens within 1 failure of configured threshold)
- Cooldown timing accuracy (target: Within 5% of configured timeout duration)
- Per-service isolation effectiveness (target: 100 services work independently)
- Concurrent execution safety (target: 1000 concurrent calls, 0 race conditions)

---

## PROMPT 1C: Endpoint Selector Extraction

**SINGLE FOCUS**: Extract endpoint selection and rotation logic from existing 2000-line RPC connection pool

**EXPLICIT FILE PATHS**:
- **Source**: `src/detection/transport/rpc-connection-pool.js` (lines containing "endpoint", "select", "rotate", "round", "robin", "health")
- **Target**: `src/detection/transport/endpoint-selector.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Extract endpoint configuration, health tracking, and round-robin rotation logic
**Step 2**: Create EndpointSelector class with selection, health checking, and failover methods
**Step 3**: Test round-robin distribution accuracy across multiple healthy endpoints
**Step 4**: Test health-based endpoint filtering and automatic failover scenarios
**Step 5**: Create integration stub in original file: `this.endpointSelector.selectEndpoint()`

**CLEAR SUCCESS CRITERIA**:

**Selection Logic Requirements**:
- Round-robin distribution: Even distribution across healthy endpoints within ±5% variance
- Health filtering: Unhealthy endpoints skipped 100% of the time during selection
- Failover speed: Switch to healthy endpoint within 1 selectEndpoint() call after failure detected
- Recovery detection: Include recovered endpoints in rotation within 30 seconds of recovery

**Performance Requirements**:
- Selection latency: <0.5ms per selectEndpoint() call including health checks
- Memory overhead: <10KB for 10 endpoints with full health tracking and statistics
- Health check frequency: Configurable interval health checking (default 30 seconds)
- Concurrent selection safety: 1000 concurrent selectEndpoint() calls without conflicts

**Integration Requirements**:
- Original file compiles successfully after extraction with integration stub
- Integration interface: `this.endpointSelector.selectEndpoint()` ready for orchestrator
- Export functionality: `import { EndpointSelector } from './endpoint-selector.js'` works correctly
- Configuration compatibility: Existing endpoint configuration environment variables work unchanged

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Distribution evenness percentage (target: within 5% even distribution across healthy endpoints)
- Health filtering accuracy (target: 100% of unhealthy endpoints properly skipped)
- Failover detection speed (target: <1 selection call to detect and switch from failed endpoint)
- Recovery inclusion time (target: <30 seconds to include recovered endpoint in rotation)
- Selection latency performance (target: <0.5ms per selectEndpoint() call)

---

## PROMPT 1D: Connection Pool Core Extraction

**SINGLE FOCUS**: Extract core HTTP connection management from existing 2000-line RPC connection pool

**EXPLICIT FILE PATHS**:
- **Source**: `src/detection/transport/rpc-connection-pool.js` (HTTP agent, socket, keep-alive, timeout sections)
- **Target**: `src/detection/transport/connection-pool-core.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Extract HTTP agent configuration, socket management, and connection lifecycle logic
**Step 2**: Create ConnectionPoolCore class with connection pooling, reuse, and cleanup methods
**Step 3**: Test connection lifecycle management in isolation with local test server
**Step 4**: Test socket reuse efficiency and connection cleanup under various load patterns
**Step 5**: Create integration stub in original file with core connection methods ready for orchestrator

**CLEAR SUCCESS CRITERIA**:

**Connection Management Requirements**:
- Socket reuse efficiency: 90%+ of requests use existing pooled connections
- Connection cleanup: Zero socket leaks during 1-hour continuous operation
- Keep-alive efficiency: Maintain connections for full configured timeout period
- Concurrent connection handling: 100 concurrent requests without connection exhaustion

**Performance Requirements**:
- New connection establishment: <50ms for new connections to external services
- Socket reuse latency: <5ms overhead for reusing existing pooled connections
- Memory per connection: <5KB overhead per active socket in connection pool
- Connection cleanup timing: Release unused connections within configured timeout period

**Integration Requirements**:
- Original file compiles successfully after extraction with integration stub
- Integration interface: Core connection methods ready for use by other components
- Export functionality: `import { ConnectionPoolCore } from './connection-pool-core.js'` works correctly
- Configuration compatibility: Existing HTTP agent configuration environment variables preserved

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Socket reuse percentage (target: 90%+ of requests use existing connections)
- Memory leak detection (target: 0 leaked sockets over 1-hour operation)
- Connection establishment time (target: <50ms for new connections)
- Concurrent request handling capacity (target: 100 concurrent requests without exhaustion)
- Connection cleanup timing accuracy (target: Within 10% of configured timeout)

---

## PROMPT 1E: Request Cache Extraction

**SINGLE FOCUS**: Extract request deduplication and caching from existing 2000-line RPC connection pool

**EXPLICIT FILE PATHS**:
- **Source**: `src/detection/transport/rpc-connection-pool.js` (cache, dedupe, coalescing, TTL sections)
- **Target**: `src/detection/transport/request-cache.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Extract cache key generation, storage, and TTL management logic
**Step 2**: Create RequestCache class with caching, TTL expiration, and request coalescing methods
**Step 3**: Test cache hit/miss accuracy with various TTL configurations and request patterns
**Step 4**: Test request coalescing for duplicate in-flight requests (multiple callers, single backend call)
**Step 5**: Create integration stub in original file: `await this.cache.get(key, fetcher)`

**CLEAR SUCCESS CRITERIA**:

**Caching Requirements**:
- Cache hit rate: 70%+ for typical meme coin trading request patterns
- TTL expiration accuracy: Entries expire within 5% of configured TTL duration
- Request coalescing: Duplicate in-flight requests return same Promise result
- Memory bounds: LRU eviction prevents unbounded cache growth beyond configured limits

**Performance Requirements**:
- Cache lookup time: <1ms per get() operation including key generation and lookup
- Memory usage limit: Configurable maximum entries (default: 10,000) with LRU eviction
- Request coalescing efficiency: 95%+ reduction in duplicate RPC calls for identical requests
- TTL cleanup performance: Expired entries cleaned within 60 seconds of expiration

**Integration Requirements**:
- Original file compiles successfully after extraction with integration stub
- Integration interface: `await this.cache.get(key, fetcher)` ready for orchestrator use
- Export functionality: `import { RequestCache } from './request-cache.js'` works correctly
- Configuration compatibility: Existing cache TTL configuration environment variables preserved

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Cache hit rate percentage (target: 70%+ with realistic trading request patterns)
- TTL expiration accuracy (target: Within 5% of configured expiration time)
- Duplicate request reduction (target: 95%+ reduction for identical concurrent calls)
- Memory usage bounds compliance (target: Within configured limits with LRU eviction)
- Cache lookup latency (target: <1ms per get() operation)

---

## PROMPT 1F: Batch Manager Extraction

**SINGLE FOCUS**: Extract request batching logic from existing 2000-line RPC connection pool

**EXPLICIT FILE PATHS**:
- **Source**: `src/detection/transport/rpc-connection-pool.js` (batch, aggregate, group sections)
- **Target**: `src/detection/transport/batch-manager.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Extract batch accumulation, timing trigger, and response routing logic
**Step 2**: Create BatchManager class with request batching, timeout triggers, and response splitting
**Step 3**: Test batch size and timeout triggers in isolation with controllable request timing
**Step 4**: Test response routing accuracy (ensure each caller gets correct response from batch)
**Step 5**: Create integration stub in original file: `await this.batchManager.addRequest(method, params)`

**CLEAR SUCCESS CRITERIA**:

**Batching Requirements**:
- Batch efficiency: 80%+ reduction in actual RPC calls for batchable request types
- Timing accuracy: Batches sent within 5% of configured timeout duration
- Size limits: Respects maximum batch size limits and never exceeds configured maximums
- Response routing: 100% accurate routing of individual responses to correct Promise resolvers

**Performance Requirements**:
- Batch formation time: <10ms overhead per request added to current batch
- Memory per batch: <1KB memory overhead regardless of batch size up to maximum
- Timeout accuracy: Flush pending batch within 10ms of configured timeout
- Concurrency safety: Handle 1000 concurrent addRequest() calls without corruption

**Integration Requirements**:
- Original file compiles successfully after extraction with integration stub
- Integration interface: `await this.batchManager.addRequest(method, params)` ready for orchestrator
- Export functionality: `import { BatchManager } from './batch-manager.js'` works correctly
- Configuration compatibility: Existing batch size and timeout environment variables preserved

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- RPC call reduction percentage (target: 80%+ reduction for batchable requests)
- Timeout accuracy (target: Within 10ms of configured timeout for batch flushing)
- Response routing accuracy (target: 100% correct Promise resolution to original callers)
- Memory efficiency per batch (target: <1KB overhead per batch regardless of size)
- Batch formation latency (target: <10ms per request added to batch)

---

## PROMPT 1G: Hedged Manager Extraction

**SINGLE FOCUS**: Extract parallel request (hedging) logic from existing 2000-line RPC connection pool

**EXPLICIT FILE PATHS**:
- **Source**: `src/detection/transport/rpc-connection-pool.js` (hedge, parallel, backup, race sections)
- **Target**: `src/detection/transport/hedged-manager.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Extract hedging delay configuration, backup request triggering, and Promise.race logic
**Step 2**: Create HedgedManager class with hedged request coordination and proper Promise cleanup
**Step 3**: Test primary/backup request timing accuracy with controllable mock request delays
**Step 4**: Test request cancellation and resource cleanup (losing requests properly cancelled)
**Step 5**: Create integration stub in original file: `await this.hedgedManager.hedgedRequest(primary, backups)`

**CLEAR SUCCESS CRITERIA**:

**Hedging Requirements**:
- Timing accuracy: Backup requests sent within 10% of configured hedging delay
- Success selection: First successful response wins, all other requests properly cancelled
- Resource cleanup: 100% of losing requests properly cancelled with no resource leaks
- Hedging effectiveness: 95%+ improvement in success rate during endpoint failure scenarios

**Performance Requirements**:
- Hedging overhead: <20ms additional latency for hedged requests compared to single requests
- Cancellation speed: Losing requests cancelled within 100ms of winner completing
- Memory cleanup: No Promise memory leaks from cancelled requests (complete cleanup)
- Concurrent hedging safety: Handle 100 concurrent hedged requests without conflicts

**Integration Requirements**:
- Original file compiles successfully after extraction with integration stub
- Integration interface: `await this.hedgedManager.hedgedRequest(primary, backups)` ready for orchestrator
- Export functionality: `import { HedgedManager } from './hedged-manager.js'` works correctly
- Configuration compatibility: Existing hedging delay environment variables preserved

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Backup request timing accuracy (target: Within 10% of configured hedging delay)
- Request cancellation completeness (target: 100% of losing requests properly cancelled)
- Success rate improvement during failures (target: 95%+ improvement vs single requests)
- Memory leak detection (target: 0 leaked Promise objects after request completion)
- Concurrent hedging safety (target: 100 concurrent hedged requests without race conditions)

---

# PHASE 2: COMPONENT TESTING (7 Parallel Prompts)
**Duration**: 2 hours parallel execution  
**Dependencies**: Phase 1 complete (extracted components must exist and compile)

## PROMPT 2A: Token Bucket Component Testing

**SINGLE FOCUS**: Create comprehensive test suite for extracted token-bucket.js component

**EXPLICIT FILE PATHS**:
- **Target**: `tests/unit/token-bucket.test.js`
- **Component Under Test**: `src/detection/transport/token-bucket.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create test framework and test environment setup for TokenBucket class in isolation
**Step 2**: Test rate limiting accuracy under normal load patterns with various request rates
**Step 3**: Test burst handling and token replenishment timing with spike load scenarios
**Step 4**: Test configuration loading and validation with valid/invalid environment variables
**Step 5**: Test memory usage and stability during sustained operation (5-minute continuous test)

**CLEAR SUCCESS CRITERIA**:

**Rate Limiting Validation Requirements**:
- Process 1000 requests/sec with <10ms latency per token availability check
- Rate limiting accuracy: 95%+ (properly rejects requests when tokens exhausted)
- Burst tolerance: Allows 2x normal rate for up to 10 seconds as configured
- Token replenishment: Accurate to within 1% of configured rate over measurement windows

**Performance Requirements**:
- Token check latency: <1ms per hasTokens() call under normal and high load
- Memory usage: <50MB for 100,000 token operations during sustained testing
- Configuration loading: 100% success rate for valid environment variable combinations
- Memory stability: No detectable memory leaks during 5-minute continuous operation

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Rate limiting accuracy percentage (target: 95%+ correct rejection when over limit)
- Token check latency in milliseconds (target: <1ms per hasTokens() call)
- Memory usage during sustained operation (target: <50MB throughout test)
- Burst handling effectiveness (target: 2x rate tolerance for 10 seconds)
- Configuration loading success rate (target: 100% for valid configurations)

**Test Scenarios to Cover**:
- Normal steady-state operation: Consistent token consumption within limits
- Burst scenarios: Sudden spike in token requests testing burst tolerance
- Token exhaustion scenarios: Behavior when token bucket empty and requests rejected
- Recovery scenarios: Token replenishment and availability after exhaustion periods
- Configuration scenarios: Valid and invalid environment variable handling

---

## PROMPT 2B: Circuit Breaker Component Testing

**SINGLE FOCUS**: Create comprehensive test suite for extracted circuit-breaker.js component

**EXPLICIT FILE PATHS**:
- **Target**: `tests/unit/circuit-breaker.test.js`
- **Component Under Test**: `src/detection/transport/circuit-breaker.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create test framework and mock services for CircuitBreaker class isolated testing
**Step 2**: Test CLOSED → OPEN state transitions with controlled failure scenarios
**Step 3**: Test OPEN → HALF_OPEN → CLOSED recovery cycles with success/failure patterns
**Step 4**: Test per-service isolation (multiple independent services with separate circuit states)
**Step 5**: Test timing accuracy, jitter handling, and concurrent execution safety

**CLEAR SUCCESS CRITERIA**:

**State Machine Requirements**:
- State transitions: 100% accuracy for all CLOSED→OPEN→HALF_OPEN→CLOSED transitions
- Failure threshold: Opens circuit after exactly configured number of failures
- Cooldown timing: Respects configured timeout before HALF_OPEN transition (±5% accuracy)
- Per-service isolation: 100 different services tracked independently without state interference

**Performance Requirements**:
- State check latency: <1ms per execute() call including all state machine logic
- Memory per service: <1KB overhead per tracked service for complete state management
- Recovery detection: <3 successful probes to transition from HALF_OPEN to CLOSED
- Concurrent safety: 1000 concurrent execute() calls without race conditions or state corruption

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- State transition accuracy (target: 100% correct transitions under all test scenarios)
- Failure threshold precision (target: Opens within 1 failure of configured threshold)
- Cooldown timing accuracy (target: Within 5% of configured timeout duration)
- Service isolation effectiveness (target: 100 services function independently)
- Concurrent execution safety (target: 1000 concurrent calls, 0 race conditions detected)

**Mock Service Testing Approach**:
- Create controllable mock services that can fail or succeed on demand
- Test circuit breaker behavior with various failure patterns and recovery scenarios
- Validate state persistence and accuracy across multiple service calls
- Test recovery behavior with gradual service improvement patterns

---

## PROMPT 2C: Endpoint Selector Component Testing

**SINGLE FOCUS**: Create comprehensive test suite for extracted endpoint-selector.js component

**EXPLICIT FILE PATHS**:
- **Target**: `tests/unit/endpoint-selector.test.js`
- **Component Under Test**: `src/detection/transport/endpoint-selector.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create test framework and mock endpoints for EndpointSelector class isolated testing
**Step 2**: Test round-robin distribution accuracy across multiple healthy endpoints with large sample sizes
**Step 3**: Test health-based endpoint filtering and automatic exclusion of unhealthy endpoints
**Step 4**: Test failover and recovery scenarios (endpoints going down and coming back up)
**Step 5**: Test weighted selection, priority handling, and concurrent selection safety

**CLEAR SUCCESS CRITERIA**:

**Load Balancing Requirements**:
- Round-robin distribution: Even distribution across healthy endpoints within ±5% variance
- Health filtering: Unhealthy endpoints skipped 100% of time during selection process
- Failover speed: Switch to healthy endpoint within 1 selectEndpoint() call after failure
- Recovery detection: Include recovered endpoints in rotation within 30 seconds of recovery

**Performance Requirements**:
- Selection latency: <0.5ms per selectEndpoint() call including health checking logic
- Memory overhead: <10KB for 10 endpoints with complete health tracking and statistics
- Health check accuracy: 100% correct healthy/unhealthy detection and state management
- Concurrent selection safety: 1000 concurrent selectEndpoint() calls without conflicts

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Distribution evenness (target: within 5% even distribution across all healthy endpoints)
- Health filtering accuracy (target: 100% of unhealthy endpoints properly avoided)
- Failover detection speed (target: <1 selection call to detect and handle endpoint failure)
- Recovery inclusion time (target: <30 seconds to include recovered endpoint)
- Selection latency performance (target: <0.5ms per selectEndpoint() call)

**Mock Endpoint Testing Approach**:
- Create mock endpoints that can be dynamically marked healthy or unhealthy
- Test selection patterns with various endpoint health configurations and transitions
- Validate endpoint statistics collection, reporting, and health state management
- Test edge cases (all endpoints down, single endpoint up, rapid health transitions)

---

## PROMPT 2D: Connection Pool Core Component Testing

**SINGLE FOCUS**: Create comprehensive test suite for extracted connection-pool-core.js component

**EXPLICIT FILE PATHS**:
- **Target**: `tests/unit/connection-pool-core.test.js`
- **Component Under Test**: `src/detection/transport/connection-pool-core.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create test framework and local HTTP test server for ConnectionPoolCore isolated testing
**Step 2**: Test HTTP agent configuration and socket reuse efficiency with multiple request patterns
**Step 3**: Test connection lifecycle management and proper cleanup under various scenarios
**Step 4**: Test keep-alive functionality and timeout handling with controlled server responses
**Step 5**: Test concurrent connection management and resource limits under high load

**CLEAR SUCCESS CRITERIA**:

**Connection Management Requirements**:
- Socket reuse efficiency: 90%+ of requests use existing pooled connections when available
- Connection cleanup: Zero socket leaks detected during 30-minute continuous operation
- Keep-alive efficiency: Maintain connections for full configured timeout period
- Concurrent connection handling: 100 concurrent requests without connection pool exhaustion

**Performance Requirements**:
- Connection establishment: <50ms for new connections to localhost test server
- Socket reuse latency: <5ms overhead for reusing existing pooled connections
- Memory per connection: <5KB overhead per active socket in the connection pool
- Connection cleanup timing: Release unused connections within configured timeout period

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Socket reuse percentage (target: 90%+ of requests use existing pooled connections)
- Memory leak detection (target: 0 leaked sockets detected over 30-minute operation)
- Connection establishment time (target: <50ms for new connections to test server)
- Concurrent handling capacity (target: 100 concurrent requests without exhaustion)
- Connection cleanup timing accuracy (target: Within 10% of configured timeout)

**Mock HTTP Server Testing Approach**:
- Create local controllable HTTP test server for connection testing
- Test various response patterns (fast responses, slow responses, error responses)
- Validate HTTP agent configuration (keep-alive settings, maximum sockets, timeouts)
- Test connection pooling behavior under different load patterns and timing scenarios

---

## PROMPT 2E: Request Cache Component Testing

**SINGLE FOCUS**: Create comprehensive test suite for extracted request-cache.js component

**EXPLICIT FILE PATHS**:
- **Target**: `tests/unit/request-cache.test.js`
- **Component Under Test**: `src/detection/transport/request-cache.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create test framework and mock expensive operations for RequestCache isolated testing
**Step 2**: Test cache hit/miss accuracy with TTL expiration using various cache patterns
**Step 3**: Test request coalescing for duplicate calls (multiple concurrent identical requests)
**Step 4**: Test LRU eviction and memory bounds with cache size limits and memory pressure
**Step 5**: Test cache invalidation, cleanup timing, and performance under sustained load

**CLEAR SUCCESS CRITERIA**:

**Caching Requirements**:
- Cache hit rate: 70%+ for typical meme coin trading request patterns
- TTL accuracy: Cache entries expire within 5% of configured TTL duration
- Request coalescing: Duplicate in-flight requests return identical Promise results
- Memory bounds: LRU eviction prevents unbounded growth beyond configured cache limits

**Performance Requirements**:
- Cache lookup time: <1ms per get() operation including key generation and result lookup
- Memory limit compliance: Stays within configured maximum entries (10,000 default)
- Request coalescing efficiency: 95%+ reduction in duplicate operation execution
- TTL cleanup performance: Expired entries cleaned within 60 seconds of expiration

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Cache hit rate percentage (target: 70%+ with realistic trading request patterns)
- TTL expiration accuracy (target: Within 5% of configured TTL expiration time)
- Duplicate request reduction (target: 95%+ reduction for identical concurrent calls)
- Memory usage bounds compliance (target: Within configured limits via LRU eviction)
- Cache lookup latency (target: <1ms per get() operation including all overhead)

**Mock Request Testing Approach**:
- Create mock expensive operations that can be cached and have controllable execution times
- Test various request patterns (repeated requests, unique requests, mixed patterns)
- Validate request coalescing behavior with concurrent identical requests from multiple callers
- Test cache behavior during memory pressure and verify LRU eviction correctness

---

## PROMPT 2F: Batch Manager Component Testing

**SINGLE FOCUS**: Create comprehensive test suite for extracted batch-manager.js component

**EXPLICIT FILE PATHS**:
- **Target**: `tests/unit/batch-manager.test.js`
- **Component Under Test**: `src/detection/transport/batch-manager.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create test framework and mock batch executor for BatchManager isolated testing
**Step 2**: Test batch size and timeout triggers with controllable request timing and patterns
**Step 3**: Test response routing accuracy (ensure each caller gets correct response from batch)
**Step 4**: Test mixed request type handling and batch formation efficiency
**Step 5**: Test concurrent batch operations and memory efficiency under sustained load

**CLEAR SUCCESS CRITERIA**:

**Batching Requirements**:
- Batch efficiency: 80%+ reduction in actual operations for batchable request types
- Timing accuracy: Batches sent within 10ms of configured timeout trigger
- Size limits: Respects maximum batch size limits and never exceeds configured maximums
- Response routing: 100% accurate routing of individual responses to correct original callers

**Performance Requirements**:
- Batch formation time: <10ms overhead per request added to current pending batch
- Memory per batch: <1KB memory overhead regardless of batch size up to configured maximum
- Timeout accuracy: Flush pending batch within 10ms of configured timeout duration
- Concurrency safety: Handle 1000 concurrent addRequest() calls without data corruption

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Operation reduction percentage (target: 80%+ reduction for batchable request types)
- Timeout accuracy (target: Within 10ms of configured timeout for batch flushing)
- Response routing accuracy (target: 100% correct Promise resolution to original callers)
- Memory efficiency per batch (target: <1KB overhead per batch regardless of request count)
- Batch formation latency (target: <10ms per request added to pending batch)

**Mock Batch Executor Testing Approach**:
- Create mock batch processor that can handle various request types and return structured results
- Test batch formation with different timing patterns and size configurations
- Validate response splitting and routing accuracy for complex batch responses
- Test edge cases (single requests, oversized batches, mixed batchable/non-batchable requests)

---

## PROMPT 2G: Hedged Manager Component Testing

**SINGLE FOCUS**: Create comprehensive test suite for extracted hedged-manager.js component

**EXPLICIT FILE PATHS**:
- **Target**: `tests/unit/hedged-manager.test.js`
- **Component Under Test**: `src/detection/transport/hedged-manager.js`

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Create test framework and controllable mock requests for HedgedManager isolated testing
**Step 2**: Test hedging delay accuracy and backup request timing with various delay configurations
**Step 3**: Test Promise.race cleanup and proper cancellation of losing requests
**Step 4**: Test hedging effectiveness statistics and success rate improvements during failures
**Step 5**: Test resource cleanup for losing requests and concurrent hedging safety

**CLEAR SUCCESS CRITERIA**:

**Hedging Requirements**:
- Timing accuracy: Backup requests sent within 10% of configured hedging delay
- Success selection: First successful response wins, all other requests properly cancelled
- Resource cleanup: 100% of losing requests properly cancelled with complete cleanup
- Hedging effectiveness: 95%+ improvement in success rate during simulated endpoint failures

**Performance Requirements**:
- Hedging overhead: <20ms additional latency for hedged requests vs single requests
- Cancellation speed: Losing requests cancelled within 100ms of winning request completion
- Memory cleanup: No Promise memory leaks from cancelled requests (verified cleanup)
- Concurrent hedging safety: Handle 100 concurrent hedged requests without conflicts

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Backup timing accuracy (target: Within 10% of configured hedging delay)
- Request cancellation completeness (target: 100% of losing requests properly cancelled)
- Success rate improvement during failures (target: 95%+ improvement vs single requests)
- Memory leak detection (target: 0 leaked Promise objects after request completion)
- Concurrent hedging safety (target: 100 concurrent hedged requests, 0 race conditions)

**Mock Request Testing Approach**:
- Create controllable mock requests with adjustable response times and success/failure rates
- Test various failure/success patterns for primary and backup requests
- Validate cancellation behavior when primary request succeeds quickly vs slowly
- Test hedging statistics accuracy and reporting for performance monitoring

---

# PHASE 3: INTEGRATION TESTING (3 Sequential Prompts)
**Duration**: 6 hours sequential execution  
**Dependencies**: Phase 2 complete (all components individually validated and working)

## PROMPT 3A: Component Pairs Integration Testing

**SINGLE FOCUS**: Test critical 2-component interactions and interface compatibility

**EXPLICIT FILE PATHS**:
- **Target**: `tests/integration/component-pairs.test.js`
- **Components Under Test**: All 7 components in critical 2-component pair combinations

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Test TokenBucket + ConnectionPoolCore integration (rate limiting prevents connection exhaustion)
**Step 2**: Test CircuitBreaker + EndpointSelector integration (circuit breaker state affects endpoint selection)
**Step 3**: Test RequestCache + BatchManager integration (cached responses don't break batch routing)
**Step 4**: Test HedgedManager + EndpointSelector integration (hedged requests use different endpoints)
**Step 5**: Test all other critical component pairs for interface compatibility and resource sharing

**CLEAR SUCCESS CRITERIA**:

**Critical Pair Integration Requirements**:
- TokenBucket + ConnectionPoolCore: Rate limiting effectively prevents connection pool exhaustion
- CircuitBreaker + EndpointSelector: Circuit breaker OPEN state properly affects endpoint selection
- RequestCache + BatchManager: Cached responses maintain correct routing in batch operations
- HedgedManager + EndpointSelector: Hedged requests correctly use different selected endpoints
- All pair combinations: No interface mismatches or resource conflicts between components

**Performance Requirements**:
- Combined latency: Individual component latencies don't compound excessively (≤20% overhead)
- Memory usage: Component combinations don't cause memory leaks during sustained operation
- Error propagation: Failures in one component handled gracefully by partner component
- Resource sharing: Components efficiently share resources (threads, memory) without conflicts

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Integration overhead latency (target: <20% additional latency per component pair)
- Memory leak detection (target: 0 leaks during 30-minute paired component testing)
- Error handling effectiveness (target: 100% graceful failure handling between components)
- Resource efficiency (target: Combined memory usage < sum of individual components + 20%)

---

## PROMPT 3B: Subsystem Integration Testing

**SINGLE FOCUS**: Test 3-4 component logical subsystems working together

**EXPLICIT FILE PATHS**:
- **Target**: `tests/integration/subsystem.test.js`
- **Subsystems Under Test**: Logical groupings of 3-4 related components

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Test Rate Limiting Subsystem (TokenBucket + CircuitBreaker + EndpointSelector coordination)
**Step 2**: Test Request Optimization Subsystem (RequestCache + BatchManager + HedgedManager efficiency)
**Step 3**: Test Connection Management Subsystem (ConnectionPoolCore + EndpointSelector + CircuitBreaker)
**Step 4**: Test cross-subsystem interactions (ensure no conflicts between different subsystem groups)
**Step 5**: Test complete subsystem failure recovery and graceful degradation scenarios

**CLEAR SUCCESS CRITERIA**:

**Subsystem Integration Requirements**:
- Rate Limiting Subsystem: Combined rate limiting, circuit breaking, and endpoint selection work cohesively
- Request Optimization: Caching, batching, and hedging optimizations work together effectively
- Connection Management: Core connections with intelligent selection and circuit protection
- Cross-subsystem compatibility: No conflicts or interference between different subsystem groups

**Performance Requirements**:
- Subsystem end-to-end latency: <100ms for typical operations with all components active
- Memory efficiency: 3-4 components use resources efficiently together
- Failure isolation: Subsystem failures don't cascade to affect other independent subsystems
- Recovery capability: Subsystems recover gracefully from individual component failures

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- End-to-end subsystem latency (target: <100ms for realistic operations with full optimization)
- Failure isolation effectiveness (target: 100% of failures contained within originating subsystem)
- Recovery time after failures (target: <30 seconds to restore full subsystem functionality)
- Resource utilization efficiency (target: Combined usage < 120% of sum of individual components)

---

## PROMPT 3C: Complete System Integration Testing

**SINGLE FOCUS**: Test all 7 components + orchestrator working together as complete system

**EXPLICIT FILE PATHS**:
- **Target**: `tests/integration/complete-system.test.js`
- **System Under Test**: All 7 components + RpcManager orchestrator + error handling

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Test complete system startup with RpcManager orchestrator coordinating all 7 components
**Step 2**: Test end-to-end request flow through all optimization layers (complete component chain)
**Step 3**: Test system behavior under realistic load patterns simulating trading scenarios
**Step 4**: Test complete system failure and recovery scenarios (individual components failing and recovering)
**Step 5**: Test system performance against original monolithic version baseline comparison

**CLEAR SUCCESS CRITERIA**:

**Complete System Requirements**:
- Integration success: All 7 components work together seamlessly through orchestrator
- Performance parity: Equal or better performance than original 98% success rate monolithic system
- API compatibility: Existing call(method, params) interface preserved and functional
- Error handling: Graceful system degradation when individual components fail

**Performance Requirements**:
- End-to-end latency: <200ms for realistic Solana RPC calls through complete component chain
- Success rate: 95%+ under 20 concurrent requests with all optimization components active
- Memory usage: <300MB for sustained operation with all 7 components active
- Throughput capacity: 500+ requests/second with all optimization features enabled

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Complete system success rate (target: 95%+ under realistic load matching original performance)
- End-to-end latency (target: <200ms average for real RPC calls through optimization chain)
- Memory usage stability (target: <300MB sustained operation, <1% growth per hour)
- Throughput capacity (target: 500+ req/sec with all optimization components active)
- Component coordination efficiency (target: No bottlenecks between orchestrated components)

---

# PHASE 4: REAL-WORLD VALIDATION + PRODUCTION DEPLOYMENT (4 Sequential Prompts)
**Duration**: 4 hours sequential execution  
**Dependencies**: Phase 3 complete (integrated system working correctly in test environment)

## PROMPT 4A: Complete System Validation Against Real Solana Mainnet

**SINGLE FOCUS**: Validate complete 7-component system against real external Solana services

**EXPLICIT FILE PATHS**:
- **Target**: `scripts/validate-complete-system.js`
- **System Under Test**: Complete 7-component modular architecture with real external dependencies

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Test system startup and all component initialization with production configuration
**Step 2**: Test basic RPC calls against real Solana mainnet endpoints (Helius, Chainstack P2Pify, Public)
**Step 3**: Test all 7 components working together with real network conditions and latencies
**Step 4**: Test system performance under realistic trading load patterns with actual network overhead
**Step 5**: Compare modular system performance against original monolithic baseline with same external services

**CLEAR SUCCESS CRITERIA**:

**Real Service Integration Requirements**:
- Solana mainnet connections: Helius, Chainstack P2Pify, and Public RPC all functional through system
- All 7 components: Each optimization component contributing measurable benefit with real services
- Trading system latency: <200ms end-to-end with actual network conditions and service response times
- Memory stability: <1% growth per hour during realistic trading load with real external calls

**Performance Requirements**:
- Success rate: 95%+ under 20 concurrent requests to real Solana RPC services
- Latency consistency: P95 latency remains stable throughout test duration with network variance
- Component effectiveness: Each optimization component provides >10% measurable benefit
- Error handling: Graceful handling of real network conditions, timeouts, and service failures

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Real-world success rate (target: 95%+ success with actual Solana mainnet services)
- End-to-end latency with network overhead (target: <200ms P95 including real network latency)
- Component contribution analysis (target: Each component provides >10% measurable improvement)
- Memory usage during real load (target: <300MB sustained with real external service calls)
- Error recovery effectiveness (target: 100% graceful handling of real network failures)

**Real Service Testing Requirements**:
- Test with actual Solana mainnet data (block heights >250M, real token supplies, account queries)
- Validate all endpoint types work correctly through complete component stack
- Test during various network conditions (peak hours, off-peak, network congestion)
- Measure and validate improvement from each optimization component with real service latencies

---

## PROMPT 4B: Sustained Load Testing Under Continuous Operation

**SINGLE FOCUS**: Test complete 7-component system under sustained trading load

**EXPLICIT FILE PATHS**:
- **Target**: `scripts/sustained-load-test.js`
- **System Under Test**: Complete modular architecture under continuous high-load operation

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Initialize complete system with full production configuration and all components active
**Step 2**: Start sustained load generation (20 concurrent requests continuously for 10+ minutes)
**Step 3**: Monitor all 7 components individually during sustained operation for performance and stability
**Step 4**: Track memory usage, performance metrics, and error rates over entire test duration
**Step 5**: Validate system stability and consistent performance throughout complete test duration

**CLEAR SUCCESS CRITERIA**:

**Sustained Operation Requirements**:
- Test duration: 10+ minutes continuous operation without system failures or degradation
- Load consistency: 20 concurrent requests maintained throughout entire test duration
- Memory stability: <1% memory growth per hour with all 7 components active under load
- Performance consistency: Success rate and latency remain stable throughout test duration

**Component Monitoring Requirements**:
- All 7 components: Each component continues functioning optimally under sustained load
- Resource usage monitoring: Each component stays within memory and CPU limits throughout test
- Error handling validation: Component failures handled gracefully without affecting system stability
- Recovery capability: Failed components recover automatically during test without manual intervention

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Sustained success rate (target: 95%+ maintained consistently for entire 10+ minute duration)
- Memory growth rate (target: <1% per hour with all components active under load)
- Performance degradation (target: <10% latency increase over complete test duration)
- Component stability (target: All 7 components remain functional throughout entire test)
- Error recovery time (target: <30 seconds for automatic component recovery during test)

**Long-Duration Monitoring Requirements**:
- Track component-level performance, memory usage, and error rates throughout test
- Monitor for memory leaks in any of the 7 components during sustained operation
- Validate graceful handling of intermittent network failures and service timeouts
- Ensure overall system performance doesn't degrade over extended time periods

---

## PROMPT 4C: Comprehensive Failure Scenario Testing

**SINGLE FOCUS**: Test all critical failure modes with complete modular architecture

**EXPLICIT FILE PATHS**:
- **Target**: `scripts/failure-scenario-test.js`
- **System Under Test**: All 7 components + orchestrator with comprehensive failure simulation

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Test individual component failure scenarios while system continues operation
**Step 2**: Test network failure scenarios (RPC timeouts, endpoint outages, connectivity loss)
**Step 3**: Test resource exhaustion scenarios (memory limits, connection limits, rate limits)
**Step 4**: Test component recovery scenarios (failed components automatically coming back online)
**Step 5**: Test cascade failure prevention (multiple simultaneous component failures)

**CLEAR SUCCESS CRITERIA**:

**Component Failure Handling Requirements**:
- Individual component failures: System continues with 80%+ capability during single component failures
- Network failure handling: Circuit breaker + endpoint selector combination handles network issues gracefully
- Resource exhaustion prevention: Rate limiting + caching components prevent resource starvation
- Component recovery: System automatically detects and re-integrates recovered components

**System Resilience Requirements**:
- Failure isolation: Individual component failures don't cascade to kill entire system
- Fallback strategies: System maintains 80%+ capability during various failure scenarios
- Recovery detection: Automatic detection and re-integration of recovered components
- Error attribution: Clear identification of exactly which components failed and why

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- Failure isolation effectiveness (target: 100% of component failures properly isolated from system)
- System capability during failures (target: 80%+ functionality maintained during failure scenarios)
- Recovery detection accuracy (target: 100% of recovered components automatically re-integrated)
- Cascade prevention effectiveness (target: 0% single failures causing complete system failure)
- Error clarity and attribution (target: 100% of failures clearly attributed to specific component)

**Comprehensive Failure Scenario Coverage**:
- Network connectivity loss during active trading operations
- Individual component crashes and recovery (test each of the 7 components individually)
- RPC endpoint failures (Helius outage, Chainstack issues, Public RPC unavailable)
- Memory pressure and resource exhaustion scenarios
- Concurrent multiple component failures (2-3 components failing simultaneously)
- Component recovery and automatic re-integration testing

---

## PROMPT 4D: Production Process Management Configuration

**SINGLE FOCUS**: Create mathematically optimized PM2 configuration for 7-component modular RPC trading system

**EXPLICIT FILE PATHS**:
- **Primary**: `ecosystem.config.js` - Complete PM2 configuration for modular RPC system
- **Secondary**: `scripts/calculate-memory-limits.js` - Memory growth calculation for component architecture
- **Validation**: `scripts/validate-restart-frequency.js` - Test 4-hour restart cycles under trading load
- **Monitoring**: `scripts/monitor-component-memory.js` - Track per-component memory usage patterns
- **Deployment**: `scripts/deploy-production.sh` - Graceful deployment with rollback capability

**INCREMENTAL IMPLEMENTATION PROCESS**:

**Step 1**: Calculate optimal memory limits for 7-component modular architecture based on measured growth data
**Step 2**: Configure PM2 cluster sizing for trading workload patterns and component distribution
**Step 3**: Set mathematical memory management parameters with precision safety margins
**Step 4**: Configure restart and failure recovery parameters for component-aware operations
**Step 5**: Add component-level monitoring and predictive alerting system
**Step 6**: Create graceful deployment and rollback procedures with health validation
**Step 7**: Generate production-ready configuration requiring zero manual tuning post-deployment

**CLEAR SUCCESS CRITERIA**:

**Mathematical Memory Optimization Requirements**:
- Memory limits calculated from real 7-component system measurements during Phase 4B testing
- Base calculation: Component baseline + measured growth rate × 4-hour target cycle
- PM2 restarts occur every 4 hours ±30 minutes based on mathematical prediction (not 15-20 minutes)
- System achieves 99.986% uptime target (10 seconds downtime per 4-hour cycle)
- Graceful shutdown completes within 10 seconds including component degradation

**Trading System Integration Requirements**:
- Zero missed trading opportunities due to process restart cycles
- Component isolation maintained during rolling restart operations
- Circuit breaker and rate limiting functionality preserved during process management
- Memory leak prevention across all 7 components + RpcManager orchestrator
- Component startup sequence respects dependency order during restarts

**Production Deployment Requirements**:
- Single deployment achieves optimal limits without post-deployment tuning
- Automated failure recovery without manual intervention required
- Blue-green deployment strategy for zero-downtime system updates
- Monitoring alerts provide predictive maintenance warnings before failures
- Rollback capability completes within 30 seconds if deployment issues detected

**Component-Specific Memory Calculation**:
```javascript
// Mathematical approach for modular architecture:
Base Memory Calculation:
- RpcManager orchestrator: ~15MB + orchestration overhead
- TokenBucket: ~5MB + rate limiting state
- CircuitBreaker: ~10MB + per-service state tracking  
- EndpointSelector: ~8MB + health monitoring data
- ConnectionPoolCore: ~15MB + HTTP connection pools
- RequestCache: ~25MB + cached response data (highest growth component)
- BatchManager: ~12MB + batch accumulation buffers
- HedgedManager: ~10MB + parallel request tracking

Total Base: ~100MB (refined from 50MB baseline)
Growth Rate Measurement: Measure each component individually during Phase 4B
Target Calculation: Base + (Growth Rate × 4 hours) + 20% safety margin
Max Memory Restart: Calculated value with mathematical precision
Max Old Space Size: 150% of restart limit for Node.js heap headroom
```

**REQUIREMENTS-BASED VALIDATION**:

**Measure These Metrics**:
- PM2 restart frequency over 24-hour continuous trading cycles (target: every 4 hours ±30 minutes)
- Component memory usage patterns during sustained load (growth rate per component measured)
- System availability during restart cycles (target: 99.986% = 10 seconds downtime per cycle)
- Trading request success rate during process management (target: 95%+ maintained throughout)
- Deployment and rollback success rate (target: 100% success with <30 second operations)
- Component startup dependency resolution (target: correct order 100% of deployments)

**Trading-Optimized Configuration Requirements**:
- Restart timing avoids detected viral meme events (delay restarts during high activity)
- Component priority startup sequence (rate limiting and circuit breaker first)
- Cluster scaling based on meme coin detection load patterns
- Memory monitoring with component-level leak detection and isolation
- Process health checks integrated with RpcManager orchestrator health reporting

**Production-Ready PM2 Ecosystem Configuration**:
```javascript
// Target configuration structure:
module.exports = {
  apps: [{
    name: 'meme-coin-rpc-system',
    script: './src/system-main.js',
    instances: 'max', // Calculated based on CPU cores and trading concurrency
    exec_mode: 'cluster',
    max_memory_restart: '400M', // Calculated: Base + (Growth × 4h) + 20% margin
    node_args: '--max-old-space-size=600', // 150% of restart limit
    min_uptime: '10s', // Prevent restart thrashing during component init
    max_restarts: 3, // Limit restart attempts before manual intervention
    restart_delay: 4000, // Stagger restarts to maintain cluster availability
    env: {
      NODE_ENV: 'production',
      TRADING_ENABLED: 'true',
      COMPONENT_HEALTH_CHECK_INTERVAL: '30000',
      PM2_MEMORY_MONITORING: 'true'
    }
  }]
};
```

---

## EXECUTION SUMMARY

**Total Prompts**: 24 Claude Code optimized prompts organized by execution phase
**Parallel Opportunities**: Phase 1 (7 parallel) + Phase 2 (7 parallel) = 14 hours of work in 4 hours clock time
**Sequential Dependencies**: Critical integration, validation, and production phases require sequential execution
**Estimated Total Timeline**: 18 hours of work over 3 days with maximum parallelization

### **Phase Execution Schedule:**

```bash
# Day 1: Orchestration + Extraction (8 hours)
Morning (3h): Phase 0 - 3 orchestration prompts sequential
Afternoon (2h): Phase 1 - 7 extraction prompts parallel  
Evening (3h): Integration preparation and validation

# Day 2: Testing + Integration (8 hours)  
Morning (2h): Phase 2 - 7 testing prompts parallel
Afternoon (6h): Phase 3 - 3 integration prompts sequential

# Day 3: Production Validation + Deployment (6 hours)
Morning (3h): Phase 4A-C - 3 validation prompts sequential
Afternoon (3h): Phase 4D - Production process management + deployment preparation
```

### **Success Validation:**
Every prompt includes comprehensive success criteria, performance requirements, and measurable validation metrics to ensure the complete modular system maintains the same 98% success rate and performance characteristics as the proven monolithic system, while achieving 99.986% uptime through mathematical PM2 optimization.

**Final Deliverable**: Production-ready 7-component modular RPC system with same reliability as original 2000-line monolithic system, enhanced with mathematical process management for 99.986% uptime, and dramatically improved maintainability, debugging capability, and development speed for future enhancements.