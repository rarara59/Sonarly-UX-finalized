# Session 3C: Stress & Reliability Testing - Claude Code Prompt

**Return to Claude Code with this exact prompt:**

```
I need to validate that my trading system handles critical failures gracefully and operates reliably under sustained load.

PREREQUISITE: Session 3A Foundation Verification PASSED + Session 3B Integration Validation PASSED

CURRENT SYSTEM STATUS:

## Verified Working Components
**Foundation**: RpcConnectionPool component verified working with real Solana mainnet
**Integration**: All 8 system components working together, real/fake switching validated
**Performance Baseline**: 98% success rate, 77-172ms P95 latency, stable memory

## SINGLE FOCUS: System Stress & Reliability Testing

TASK: Test critical failure scenarios and sustained load to ensure the system operates reliably during trading conditions that lose money if mishandled.

### Explicit Files to Create:
1. **scripts/test-critical-failures.js** - Test all money-losing failure scenarios
2. **scripts/test-sustained-load.js** - Test 10+ minute continuous operation under realistic trading load

### Incremental Testing Process:

**Step 1**: Critical Failure Scenarios Testing
- Create: `scripts/test-critical-failures.js`
- Test network connectivity loss during active RPC calls
- Test external service 500/503/timeout errors during high load
- Test component memory exhaustion scenarios
- Test circuit breaker behavior during cascade failures
- Test system recovery after individual component crashes
- Test malformed response handling from Solana RPC services
- Test Chainstack P2Pify specific failure modes
- Test Helius rate limiting scenarios
- Execute test and verify all failure scenarios recover gracefully before proceeding to Step 2

**Step 2**: Sustained Load Validation
- Create: `scripts/test-sustained-load.js`
- Run system continuously for 10+ minutes under realistic trading load (20 concurrent requests)
- Monitor memory usage throughout operation (must remain stable)
- Verify performance doesn't degrade during extended operation
- Test graceful handling of resource limits
- Validate circuit breaker prevents cascade failures during sustained stress
- Confirm 95%+ success rate maintained throughout load test
- Execute test and verify sustained operation before completing validation

### Clear Success Criteria:

**Step 1 Success Requirements (Critical Failure Recovery)**:
- Network timeouts recover within 30 seconds without system crash
- 500/503/timeout errors trigger circuit breaker without cascade failures
- Memory exhaustion triggers graceful degradation, not system death
- Circuit breaker opens after 5 failures, recovers after successful probe
- Individual component crashes don't kill other components
- Malformed Solana RPC responses logged and handled without crashes
- Chainstack P2Pify endpoint failures trigger automatic failover to Helius/Public
- Helius rate limiting triggers automatic fallback to Chainstack/Public
- All failure scenarios result in system recovery, not permanent failure

**Step 2 Success Requirements (Sustained Operation)**:
- System operates continuously for minimum 10 minutes without crashes
- Memory usage remains stable (growth under 1% per hour)
- Success rate stays above 95% throughout entire test duration
- P95 latency remains under 200ms during sustained load
- Circuit breaker functions correctly under continuous stress
- No component deadlocks or resource leaks during extended operation
- System responds to shutdown signals gracefully even under load
- Performance metrics consistent from minute 1 to minute 10+

### Performance Requirements to Measure:

**Critical Failure Testing Performance**:
- **Recovery Time**: System recovers from failures within 30 seconds
- **Cascade Prevention**: Circuit breaker prevents >90% of cascade failures
- **Error Handling**: 100% of malformed responses handled without crashes
- **Failover Speed**: Endpoint failover completes within 5 seconds
- **Component Isolation**: Individual failures don't affect >1 component

**Sustained Load Testing Performance**:
- **Duration**: Minimum 10 minutes continuous operation
- **Memory Stability**: Growth rate under 1% per hour
- **Success Rate Consistency**: 95%+ success maintained throughout
- **Latency Consistency**: P95 latency variance under 50ms during test
- **Throughput Consistency**: Request processing rate stable throughout

### Trading System Stress Scenarios:
- Simulate viral meme coin event with high RPC request volume
- Test system behavior during Solana network congestion periods
- Verify failover works during simulated Chainstack maintenance windows
- Test circuit breaker during simulated Helius rate limit conditions
- Validate memory stability during simulated 1000+ token analysis load
- Confirm health checks remain under 100ms during system stress

### Expected Outputs:

**File 1: scripts/test-critical-failures.js**
- Tests all 8 critical failure scenarios for trading systems
- Measures recovery time from each failure type
- Verifies circuit breaker prevents money-losing cascade failures
- Reports component isolation effectiveness

**File 2: scripts/test-sustained-load.js**
- Runs continuous load test for minimum 10 minutes
- Monitors memory, CPU, and network resource usage
- Tracks success rate and latency consistency over time
- Validates graceful handling of resource limits

**File 3: session3c-stress-reliability-validation.md**
- Critical failure scenario test results with recovery times
- Sustained load test metrics with stability analysis
- Memory usage graphs and performance consistency data
- Pass/fail status for each stress testing criteria
- Final recommendation: PRODUCTION READY or INVESTIGATE ISSUES

### If Any Test Fails:
1. Stop immediately - do not proceed if critical failures aren't handled
2. Identify specific failure recovery issues or sustained operation problems
3. Report exact failure details and system behavior during stress
4. Fix reliability issues before declaring production ready

CRITICAL REQUIREMENTS:
- All failure scenarios must result in system recovery, not permanent failure
- Sustained load test must run minimum 10 minutes with stable performance
- Memory usage must remain bounded during extended operation
- Circuit breaker must prevent money-losing cascade failures
- System must handle real-world trading stress conditions

SUCCESS CRITERIA SUMMARY:
- All critical failure scenarios recover gracefully within 30 seconds
- Sustained load test runs 10+ minutes with stable memory and performance
- Success rate remains 95%+ throughout all stress testing
- Circuit breaker prevents cascade failures during stress conditions
- System declared PRODUCTION READY for live meme coin trading
```

## Your Post-Validation Process

After Claude Code completes stress & reliability testing:

**Step 1: Execute Stress Tests**
```bash
# Run critical failure scenarios test
node scripts/test-critical-failures.js

# Run sustained load test (will take 10+ minutes)
echo "Starting sustained load test (10+ minutes)..."
node scripts/test-sustained-load.js

# Check results
cat session3c-stress-reliability-validation.md
```

**Step 2: Analyze Stress Test Results**
```bash
# Check for any unrecovered failures
grep -i "permanent.*failure\|system.*crash\|unrecovered" session3c-stress-reliability-validation.md

# Verify sustained operation metrics
grep -i "10.*minutes.*successful\|memory.*stable\|success.*rate.*95" session3c-stress-reliability-validation.md

# Count successful stress scenarios
grep -c "✅.*recovered\|✅.*handled" session3c-stress-reliability-validation.md
```

**Step 3: Final Production Readiness Assessment**
```bash
# Generate final production report
cat > FINAL-PRODUCTION-READINESS.md << EOF
# RpcConnectionPool Trading System - FINAL Production Readiness

## Three-Session Validation Summary
- **Session 3A**: Foundation Verification - $(grep -q 'Foundation.*PASSED' development.log && echo 'PASSED' || echo 'FAILED')
- **Session 3B**: Integration Validation - $(grep -q 'Integration.*PASSED' development.log && echo 'PASSED' || echo 'FAILED')  
- **Session 3C**: Stress & Reliability Testing - $(grep -q 'PRODUCTION READY' session3c-stress-reliability-validation.md && echo 'PASSED' || echo 'FAILED')

## Production Status
$(grep -q 'PRODUCTION READY' session3c-stress-reliability-validation.md && echo '🚀 READY FOR LIVE MEME COIN TRADING' || echo '⚠️ REQUIRES INVESTIGATION BEFORE PRODUCTION')

## Next Steps
$(grep -q 'PRODUCTION READY' session3c-stress-reliability-validation.md && echo '1. Deploy to production server
2. Configure with real trading capital
3. Start with small position sizes
4. Monitor first live trades' || echo '1. Address stress testing issues
2. Re-run failed scenarios
3. Achieve all success criteria
4. Re-validate before production')
EOF
```

**Step 4: Final Git Commit**
```bash
# Commit final validation results
git add scripts/test-critical-failures.js scripts/test-sustained-load.js session3c-stress-reliability-validation.md FINAL-PRODUCTION-READINESS.md
git commit -m "Session 3C: Stress & reliability testing complete - Production readiness validated

- Critical failure scenarios: All recover gracefully
- Sustained load test: 10+ minutes stable operation  
- Memory stability: Confirmed under extended load
- Circuit breaker: Prevents cascade failures
- Status: Ready for live trading deployment"

# Tag final production version
git tag -a v1.0-production-ready -m "Production-ready meme coin trading system - comprehensive validation complete"
git push origin session-1-2-complete:main
git push origin v1.0-production-ready
```

This focused approach tests your system's ability to handle the stress and failure conditions that occur during live trading, ensuring it won't lose money due to technical failures.