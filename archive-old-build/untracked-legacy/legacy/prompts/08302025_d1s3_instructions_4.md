# Session 3C-1: Critical Failure Recovery Testing - Claude Code Prompt

**Return to Claude Code with this exact prompt:**

```
I need to test that my trading system recovers gracefully from critical failure scenarios that would cause money loss if mishandled.

PREREQUISITE: Session 3A Foundation PASSED + Session 3B Integration PASSED

CURRENT SYSTEM STATUS:

## Verified Working Foundation
**RpcConnectionPool**: Verified working with real Solana mainnet, 98% success rate baseline
**System Integration**: All 8 components working together, health monitoring functional
**Performance Baseline**: 77-172ms P95 latency, stable memory, proper circuit breaker function

## SINGLE FOCUS: Critical Failure Recovery Testing

TASK: Test 8 specific failure scenarios that cause money loss in trading systems and verify the system recovers gracefully from each.

### Explicit File to Create:
**ONLY**: `scripts/test-critical-failures.js` - Test critical failure scenarios with recovery validation

### Incremental Testing Process:

**Step 1**: Create failure testing script with all 8 scenarios
**Step 2**: Test each failure scenario individually before proceeding
**Step 3**: Measure recovery time for each scenario
**Step 4**: Verify system returns to healthy state after each failure
**Step 5**: Generate failure recovery report

### Critical Failure Scenarios to Test:

1. **Network Connectivity Loss**: Simulate complete network interruption during active RPC calls
2. **External Service 500/503 Errors**: Simulate Solana RPC returning server errors during high load  
3. **Component Memory Exhaustion**: Simulate individual component running out of memory
4. **Circuit Breaker Cascade Prevention**: Test circuit breaker prevents cascade failures
5. **Component Crash Recovery**: Simulate individual component crashing and system recovery
6. **Malformed Response Handling**: Test system handling malformed JSON from Solana RPC
7. **Chainstack P2Pify Failure**: Test failover when Chainstack endpoint becomes unavailable
8. **Helius Rate Limiting**: Test fallback behavior when Helius endpoint is rate-limited

### Clear Success Criteria for Each Scenario:

**Recovery Requirements**:
- System recovers from failure within 30 seconds maximum
- No permanent system damage or data corruption
- Circuit breaker functions correctly to prevent cascade failures
- System returns to healthy operational state after recovery
- Error logging captures failure details without exposing sensitive data

**Specific Scenario Requirements**:
- Network failures: Automatic retry with backoff, successful reconnection
- Service errors: Failover to backup endpoints within 5 seconds
- Memory exhaustion: Graceful degradation without system crash
- Circuit breaker: Opens within 5 consecutive failures, recovers with successful probe
- Component crashes: Other components continue operating, crashed component restarts
- Malformed responses: Logged and handled without processing pipeline crashes
- Endpoint failures: Automatic failover to remaining healthy endpoints
- Rate limiting: Immediate fallback to alternative RPC providers

### Performance Requirements to Measure:

**Recovery Time Metrics**:
- Average recovery time across all scenarios: <15 seconds
- Maximum recovery time for any single scenario: <30 seconds
- Cascade failure prevention rate: >90% of potential cascades blocked
- System availability during recovery: >95% of functionality maintained

**System Health Metrics**:
- Memory usage returns to baseline within 60 seconds post-recovery
- Circuit breaker state transitions work correctly (CLOSED→OPEN→HALF_OPEN→CLOSED)
- RPC endpoint rotation functions during failures
- Health monitoring continues reporting accurate status during failures

### Testing Requirements:
- Each scenario must be tested against real Solana RPC endpoints
- Failures must be simulated realistically (not just throwing errors)
- Recovery must be automatic without manual intervention
- System must handle multiple failure types occurring simultaneously
- All tests must use actual network calls and real endpoint timeouts

### Expected Output:

**File**: `scripts/test-critical-failures.js`
- Tests each of the 8 critical failure scenarios individually
- Measures recovery time and validates complete recovery
- Simulates realistic failure conditions
- Reports cascade prevention effectiveness
- Validates endpoint failover behavior

**Report**: `session3c1-failure-recovery-validation.md`
- Individual test results for each failure scenario
- Recovery time measurements and analysis
- Pass/fail status against success criteria
- Recommendations for any failures that don't meet criteria
- Decision: PROCEED TO SESSION 3C-2 or FIX ISSUES

### If Any Failure Scenario Fails to Recover:
1. Stop testing immediately - failure recovery is critical for trading
2. Identify specific recovery failure (network, logic, configuration)
3. Report exact failure details and affected system components
4. Do not proceed to sustained load testing until recovery works

CRITICAL REQUIREMENTS:
- All failure scenarios must result in system recovery, not permanent failure
- Recovery times must be within trading system requirements (<30 seconds)
- Circuit breaker must prevent money-losing cascade failures
- Endpoint failover must work for all RPC provider combinations
- System must maintain >95% functionality during recovery periods

SUCCESS CRITERIA SUMMARY:
- All 8 critical failure scenarios recover within 30 seconds
- Average recovery time under 15 seconds across all scenarios
- Circuit breaker prevents >90% of potential cascade failures
- System returns to healthy state after each recovery
- Ready for Session 3C-2 (Sustained Load Testing)
```

## Your Post-Testing Process

After Claude Code completes failure recovery testing:

**Step 1: Review Failure Recovery Results**
```bash
# Execute the failure testing script
node scripts/test-critical-failures.js

# Review the generated report
cat session3c1-failure-recovery-validation.md

# Check for any unrecovered failures
grep -i "failed.*recover\|permanent.*failure\|timeout.*exceeded" session3c1-failure-recovery-validation.md
```

**Step 2: Validate Recovery Metrics**
```bash
# Count successful recoveries
grep -c "RECOVERED\|PASSED" session3c1-failure-recovery-validation.md

# Check average recovery time
grep -i "average.*recovery.*time" session3c1-failure-recovery-validation.md

# Verify cascade prevention rate
grep -i "cascade.*prevention.*rate" session3c1-failure-recovery-validation.md
```

**Step 3: Decision Point**
```bash
# If all scenarios recover successfully:
echo "Critical failure testing COMPLETE - Ready for Session 3C-2"

# If any scenarios fail to recover:
echo "Critical failure testing FAILED - Must fix recovery issues before sustained load testing"
```

**Step 4: Document Results**
```bash
# Add to development log
echo "Session 3C-1 Failure Recovery: $(date)" >> development.log
echo "Status: $(grep -q 'PROCEED TO SESSION 3C-2' session3c1-failure-recovery-validation.md && echo 'PASSED' || echo 'FAILED')" >> development.log

# Commit failure recovery validation
git add scripts/test-critical-failures.js session3c1-failure-recovery-validation.md
git commit -m "Session 3C-1: Critical failure recovery testing complete"
```

This focused approach ensures your system can handle money-losing failure scenarios before testing sustained operation under load.