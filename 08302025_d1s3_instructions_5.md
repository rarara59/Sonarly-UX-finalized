# Session 3C-2: Sustained Load Testing - Claude Code Prompt

**Return to Claude Code with this exact prompt:**

```
I need to validate that my trading system operates reliably under sustained load for extended periods without performance degradation.

PREREQUISITE: Session 3C-1 Critical Failure Recovery PASSED - All 8 failure scenarios recover within 30 seconds

CURRENT SYSTEM STATUS:

## Verified Capabilities
**Foundation**: RpcConnectionPool working with real Solana mainnet
**Integration**: All 8 system components working together seamlessly  
**Failure Recovery**: All critical failure scenarios recover gracefully within 30 seconds
**Baseline Performance**: 98% success rate, 77-172ms P95 latency

## SINGLE FOCUS: Sustained Load Operation Testing

TASK: Run continuous load testing for 10+ minutes to validate system stability, memory management, and performance consistency under realistic trading conditions.

### Explicit File to Create:
**ONLY**: `scripts/test-sustained-load.js` - Long-running stability and performance validation

### Incremental Testing Process:

**Step 1**: Create sustained load testing script
**Step 2**: Run 2-minute preliminary test to validate basic stability
**Step 3**: Run full 10+ minute sustained load test
**Step 4**: Monitor memory, performance, and error rates throughout
**Step 5**: Generate sustained operation report with trend analysis

### Load Testing Parameters:

**Concurrent Request Load**: 20 simultaneous requests (realistic meme coin analysis load)
**Test Duration**: Minimum 10 minutes continuous operation
**Request Pattern**: Consistent RPC calls simulating token analysis workload
**Monitoring Frequency**: Collect metrics every 30 seconds throughout test
**Target Endpoints**: All 3 RPC providers (Helius, Chainstack P2Pify, Public)

### Clear Success Criteria:

**Performance Consistency Requirements**:
- Success rate maintains 95%+ throughout entire test duration
- P95 latency stays under 200ms during sustained operation  
- Throughput variance under 20% from start to end of test
- No performance degradation patterns over time
- System responds to requests consistently throughout

**Resource Stability Requirements**:
- Memory growth under 1% per hour during sustained operation
- No memory leaks detected over test duration
- CPU usage remains stable (no runaway processes)
- Connection pool maintains healthy state throughout
- No resource exhaustion warnings or errors

**System Health Requirements**:
- Circuit breaker functions correctly under sustained load
- All 3 RPC endpoints remain available and healthy
- Health monitoring reports accurate status throughout test
- No component failures or crashes during sustained operation
- Graceful handling of any transient network issues

### Performance Requirements to Measure:

**Load Testing Metrics**:
- Total requests processed during test period
- Success rate per 30-second interval throughout test
- Average response time per 30-second interval
- P95 latency per 30-second interval  
- Throughput (requests/second) per 30-second interval

**Resource Usage Metrics**:
- Memory usage (MB) per 30-second interval
- Memory growth rate (MB/hour) over test duration
- Connection pool utilization throughout test
- Circuit breaker state changes during test
- RPC endpoint rotation frequency

**Stability Indicators**:
- Error rate trends over time
- Performance consistency (coefficient of variation)
- Resource leak detection (memory should stabilize)
- System recovery time from any transient issues

### Testing Requirements:
- All requests must use real Solana RPC endpoints (no mocks)
- Load must simulate realistic meme coin trading patterns
- Memory monitoring must capture potential leaks
- Test must run uninterrupted for minimum 10 minutes
- System must handle load without manual intervention
- Circuit breaker behavior under sustained stress must be validated

### Expected Output:

**File**: `scripts/test-sustained-load.js`
- Runs continuous load test for 10+ minutes
- Monitors performance metrics every 30 seconds
- Tracks memory usage and resource consumption
- Validates circuit breaker behavior under load
- Reports performance trends and stability

**Report**: `session3c2-sustained-load-validation.md`
- Performance metrics over time with trend analysis
- Memory usage patterns and growth rate calculations
- Success rate consistency analysis
- Resource stability assessment
- Final recommendation: PRODUCTION READY or INVESTIGATE ISSUES

### If Sustained Load Testing Fails:
1. Identify specific stability issues (memory leaks, performance degradation)
2. Report exact failure patterns and resource consumption trends
3. Determine root cause (connection pool exhaustion, memory leaks, etc.)
4. System not production ready until sustained operation validated

CRITICAL REQUIREMENTS:
- Test must run minimum 10 minutes without interruption
- Success rate must remain 95%+ throughout entire duration
- Memory growth must stay under 1% per hour
- Performance must remain consistent from start to finish
- No component failures during sustained operation

SUCCESS CRITERIA SUMMARY:
- 10+ minute continuous operation with 95%+ success rate
- Memory growth under 1% per hour (stable resource usage)
- Performance metrics consistent throughout test duration
- System handles realistic trading load patterns reliably
- Final verdict: PRODUCTION READY for live meme coin trading
```

## Your Post-Testing Process

After Claude Code completes sustained load testing:

**Step 1: Execute Sustained Load Test**
```bash
# Run the sustained load test (will take 10+ minutes)
echo "Starting sustained load test - this will take 10+ minutes..."
node scripts/test-sustained-load.js

# Monitor test progress if needed
tail -f sustained-load-progress.log
```

**Step 2: Analyze Load Test Results**
```bash
# Review the comprehensive report
cat session3c2-sustained-load-validation.md

# Check final success rate
grep -i "final.*success.*rate\|overall.*success" session3c2-sustained-load-validation.md

# Check memory growth rate
grep -i "memory.*growth.*rate\|memory.*per.*hour" session3c2-sustained-load-validation.md

# Look for performance degradation
grep -i "degradation\|performance.*decline" session3c2-sustained-load-validation.md
```

**Step 3: Final Production Readiness Assessment**
```bash
# Generate comprehensive production readiness summary
cat > FINAL-PRODUCTION-ASSESSMENT.md << EOF
# RpcConnectionPool Trading System - Final Production Assessment

## Complete Validation Results
- **Session 3A**: Foundation Verification - PASSED
- **Session 3B**: Integration Validation - PASSED  
- **Session 3C-1**: Critical Failure Recovery - $(grep -q 'PASSED' development.log | tail -1 && echo 'PASSED' || echo 'CHECK RESULTS')
- **Session 3C-2**: Sustained Load Testing - $(grep -q 'PRODUCTION READY' session3c2-sustained-load-validation.md && echo 'PASSED' || echo 'FAILED')

## Final Production Readiness Status
$(grep -q 'PRODUCTION READY' session3c2-sustained-load-validation.md && echo '🚀 READY FOR LIVE MEME COIN TRADING' || echo '⚠️ SUSTAINED LOAD ISSUES REQUIRE RESOLUTION')

## System Capabilities Validated
- Real Solana mainnet connectivity with 3-endpoint redundancy
- Graceful recovery from all critical failure scenarios
- $(grep -q 'PRODUCTION READY' session3c2-sustained-load-validation.md && echo 'Stable operation under sustained trading load' || echo 'Sustained load operation needs improvement')
- Memory management and resource leak prevention
- Circuit breaker protection against cascade failures

## Ready for Production Deployment
$(grep -q 'PRODUCTION READY' session3c2-sustained-load-validation.md && echo 'System meets all reliability requirements for 24/7 trading operation' || echo 'Address sustained load issues before production deployment')
EOF
```

**Step 4: Final Commit and Tag**
```bash
# Commit sustained load testing results
git add scripts/test-sustained-load.js session3c2-sustained-load-validation.md FINAL-PRODUCTION-ASSESSMENT.md
git commit -m "Session 3C-2: Sustained load testing complete - $(grep -q 'PRODUCTION READY' session3c2-sustained-load-validation.md && echo 'Production ready' || echo 'Stability issues identified')"

# Tag final validation state
if grep -q 'PRODUCTION READY' session3c2-sustained-load-validation.md; then
  git tag -a v1.0-production-validated -m "Production-ready meme coin trading system - complete validation passed"
else
  git tag -a v1.0-validation-complete -m "Comprehensive validation complete - sustained load issues require resolution"
fi

git push origin session-1-2-complete:main
git push origin --tags
```

This focused approach validates sustained operation reliability separately from failure recovery, ensuring your system can handle extended trading periods without degradation.