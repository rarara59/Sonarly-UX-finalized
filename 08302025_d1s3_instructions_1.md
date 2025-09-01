# Session 3A: Foundation Verification - Claude Code Prompt

**Return to Claude Code with this exact prompt:**

```
I need to verify that my original RpcConnectionPool component still works perfectly after system integration work.

CURRENT SYSTEM STATUS:

## Original Component (Session 1)
**Component**: RpcConnectionPool
**Purpose**: Solana RPC client with failover and circuit breaking for MEME COIN TRADING
**Location**: src/detection/transport/rpc-connection-pool.js (480 lines)

### Previously Verified Capabilities
- Real Solana mainnet connections: Block height 363,295,738+ 
- All 3 endpoints working: Helius (primary), Chainstack P2Pify (250 req/s), Public (fallback)
- Performance: 98% success at 10-20 concurrent requests, P95 latency 77-172ms
- Memory: Stable with 1.04 MB/min growth rate (no leaks)
- Circuit breaker: Opens after 5 failures, proper state transitions
- Endpoints: Helius, Chainstack (https://nd-870-145-124.p2pify.com/1c9e1a700896c46d3111cecfed12e5d6), Public RPC

## SINGLE FOCUS: Original Component Re-verification

TASK: Re-run all existing test scripts to verify the RpcConnectionPool component still works exactly as it did in Session 1.

### Explicit Files to Execute (DO NOT MODIFY):
1. **scripts/verify-rpc-connection-pool.js** - Basic functionality verification
2. **scripts/stress-test-rpc-connection-pool.js** - Load testing and memory stability  
3. **scripts/test-integration-rpc-connection-pool.js** - Integration functionality

### Incremental Testing Process:
**Step 1**: Run basic verification test first
- Execute: `node scripts/verify-rpc-connection-pool.js`
- Verify success before proceeding to Step 2

**Step 2**: Run stress testing only if Step 1 passes
- Execute: `node scripts/stress-test-rpc-connection-pool.js` 
- Verify success before proceeding to Step 3

**Step 3**: Run integration test only if Step 2 passes
- Execute: `node scripts/test-integration-rpc-connection-pool.js`
- Complete verification process

### Clear Success Criteria:

**Step 1 Success Requirements**:
- All basic RPC calls return valid Solana data
- Circuit breaker functions correctly (CLOSED → OPEN → HALF_OPEN states)
- All 3 endpoints (Helius, Chainstack P2Pify, Public) respond successfully
- Connection statistics tracking works

**Step 2 Success Requirements**:
- Maintains 95%+ success rate under concurrent load (10-20 requests)
- P95 latency remains under 200ms
- Memory growth rate stays under 2% per hour
- No memory leaks detected during stress testing
- Circuit breaker prevents cascade failures

**Step 3 Success Requirements**:
- Component integrates cleanly with external systems
- Error handling works for network failures
- Timeout protection functions correctly
- Statistics collection remains accurate

### Performance Requirements to Measure:
- **Success Rate**: Must maintain 95%+ at realistic concurrent loads
- **Latency**: P95 must be under 200ms for meme coin trading requirements
- **Memory Stability**: Growth rate under 2% per hour, no leaks
- **Circuit Breaker Response**: Opens within 5 failures, recovers properly
- **Endpoint Failover**: Automatic switching during endpoint failures
- **Real Service Connectivity**: All calls use actual Solana mainnet

### If Any Test Fails:
1. Stop immediately - do not proceed to next step
2. Identify the specific failure (network, logic, performance)
3. Report the exact failure details and affected functionality
4. Do not attempt fixes - this is verification only

### Expected Output:
Create a single results file: `session3a-foundation-verification.md` containing:
- Step-by-step test execution results
- Performance metrics comparison vs Session 1 baseline
- Pass/fail status for each success criteria
- Any degradation or improvements noted
- Recommendation: PROCEED TO SESSION 3B or INVESTIGATE ISSUES

CRITICAL: This is verification only. Do not modify any existing files. Only execute existing test scripts and report results.

SUCCESS CRITERIA SUMMARY:
- All 3 test scripts execute successfully
- Performance metrics match or exceed Session 1 baseline  
- No new failures or regressions introduced
- Memory and latency within acceptable ranges
- Ready for Session 3B (System Integration Testing)
```

## Your Post-Verification Process

After Claude Code completes foundation verification:

**Step 1: Review Results**
```bash
# Check the verification report
cat session3a-foundation-verification.md

# Look for any failures or regressions
grep -i "fail\|error\|regression" session3a-foundation-verification.md

# Verify all tests passed
grep -c "✅\|PASS" session3a-foundation-verification.md
```

**Step 2: Decision Point**
```bash
# If all tests passed:
echo "Foundation verification COMPLETE - Ready for Session 3B"

# If any tests failed:
echo "Foundation verification FAILED - Must investigate before proceeding"
```

**Step 3: Document Results**
```bash
# Add to development log
echo "Session 3A Foundation Verification: $(date)" >> development.log
echo "Status: $(grep -q 'PROCEED TO SESSION 3B' session3a-foundation-verification.md && echo 'PASSED' || echo 'FAILED')" >> development.log

# Commit results
git add session3a-foundation-verification.md
git commit -m "Session 3A: Foundation verification complete - RpcConnectionPool re-validated"
```

**Next Step Decision**:
- **If PASSED**: Proceed to Session 3B (System Integration Testing)
- **If FAILED**: Investigate regressions before continuing

This focused approach ensures your foundation is solid before building further validation on top of it.