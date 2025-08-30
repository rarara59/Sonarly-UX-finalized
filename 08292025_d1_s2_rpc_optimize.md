Fix the critical HTTP agent integration bug that's causing 200ms+ latency in the RPC Connection Pool.

CRITICAL PERFORMANCE FAILURE:
- Current P95 latency: 77-172ms 
- Target P95 latency: <30ms
- Root cause: HTTP agents created but never actually used
- Impact: Every RPC call creates new TCP connection instead of reusing existing ones

SINGLE FOCUS: HTTP AGENT INTEGRATION FIX

FILE TO MODIFY:
- src/detection/transport/rpc-connection-pool.js

SPECIFIC BUG LOCATION:
- Method: executeRpcCall() (approximately line 210)
- Problem: HTTP agent retrieved but not passed to request options
- Current code: `const agent = this.agents.get(endpoint.index);` (agent retrieved but unused)
- Missing: `agent,` field in options object passed to http.request()

EXACT CODE FIX REQUIRED:
In the executeRpcCall() method, locate this section:
```javascript
const options = {
  method: 'POST',
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  },
  // MISSING: agent field here
  timeout: request.options.timeout || endpoint.config.timeout
};
```

Add the missing agent field:
```javascript
const options = {
  method: 'POST',
  hostname: url.hostname,
  port: url.port || (url.portal === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  },
  agent, // ← ADD THIS CRITICAL LINE
  timeout: request.options.timeout || endpoint.config.timeout
};
```

VALIDATION REQUIREMENTS:
Create validation that proves the fix works by measuring:

1. **Latency Before/After Comparison**
   - Measure RPC call latency before applying the fix
   - Apply the agent integration fix
   - Measure RPC call latency after applying the fix  
   - Show latency improvement (expect 200ms+ → 20-50ms after warmup)

2. **Connection Reuse Verification**
   - Demonstrate that connections are actually being reused
   - Show connection count remains stable during multiple requests
   - Verify keep-alive headers are working correctly

3. **Real Solana RPC Testing**
   - Use actual Solana RPC endpoints (not mocks)
   - Test with realistic RPC calls: getSlot, getVersion, getHealth
   - Test against all three configured endpoints (Helius, ChainStack, Public)
   - Measure performance under realistic load (10-20 concurrent requests)

4. **Agent Configuration Verification**
   - Confirm HTTP agents are properly initialized for each endpoint
   - Verify agent settings (keepAlive: true, maxSockets, etc.)
   - Show that each endpoint uses its own dedicated agent

SUCCESS CRITERIA:
- Latency drops from 200ms+ to <50ms after connection warmup
- Connection reuse is demonstrably working (stable connection count)
- All three RPC endpoints show improved latency
- No regression in success rate (maintain >99% success)
- Memory usage remains stable during sustained testing

INTEGRATION REQUIREMENTS:
- Do not break existing RpcConnectionPool interface
- Maintain compatibility with all existing method signatures
- Preserve all circuit breaker and health monitoring functionality
- Keep all existing error handling logic intact

TRADING SYSTEM CONTEXT:
This fix is critical for meme coin trading competitive advantage:
- Target: Detect opportunities within 10-30 seconds
- Competition: Retail traders with 3-7 minute reaction times  
- Requirement: <30ms P95 latency for processing speed advantage
- Current 200ms+ latency makes system uncompetitive

TEST AGAINST REAL ENDPOINTS:
Use environment variables for actual RPC endpoints:
- HELIUS_RPC_URL (primary, fastest)
- CHAINSTACK_RPC_URL (backup, reliable)  
- PUBLIC_RPC_URL (fallback, slower)

Run validation tests and show clear before/after performance improvement. This single fix should deliver 5-10x latency improvement and is the foundation for all other performance optimizations.