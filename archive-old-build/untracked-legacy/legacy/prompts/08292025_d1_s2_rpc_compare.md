Run this systematic validation to check the new rpc v2 file against the rpc requirements:

Code Structure Validation
Check file exists and size:

ls -la src/detection/transport/rpc-connection-pool-v2.js
wc -l src/detection/transport/rpc-connection-pool-v2.js  # Should be 300-500 lines max

Check for required architecture patterns:

grep -c "class RpcConnectionPool\|constructor\|async call" src/detection/transport/rpc-connection-pool-v2.js

Critical Fixes Verification
Check all 5 roadmap-specific critical fixes:

# 1. Null currentEndpoint prevention
grep -n "null.*endpoint\|endpoint.*null\|\.filter(Boolean)" src/detection/transport/rpc-connection-pool-v2.js

# 2. Promise.race resource cleanup  
grep -n "Promise\.race\|cleanup\|abort" src/detection/transport/rpc-connection-pool-v2.js

# 3. Error.message safety
grep -n "error\.message\|err\.message\|message.*||" src/detection/transport/rpc-connection-pool-v2.js

# 4. RequestId overflow handling
grep -n "requestId\|overflow\|MAX_SAFE_INTEGER" src/detection/transport/rpc-connection-pool-v2.js

# 5. Monitor validation
grep -n "monitor\|validation\|typeof.*function" src/detection/transport/rpc-connection-pool-v2.js

Configuration Compliance Check
Verify all environment variables are used:

# Check for all required config variables
grep -c "RPC_DEFAULT_RPS_LIMIT\|RPC_DEFAULT_CONCURRENCY_LIMIT\|RPC_DEFAULT_TIMEOUT_MS\|RPC_BREAKER_ENABLED\|RPC_KEEP_ALIVE_ENABLED" src/detection/transport/rpc-connection-pool-v2.js

# Should find multiple references

Performance Architecture Validation
Check for per-endpoint rate limiting (the key performance fix):

grep -n "per.endpoint\|endpoint.*limit\|rpsLimit.*endpoint" src/detection/transport/rpc-connection-pool-v2.js

Check for proper load balancing:

grep -n "round.robin\|weight\|load.*balanc\|distribute" src/detection/transport/rpc-connection-pool-v2.js

Check for request queuing:

grep -n "queue\|enqueue\|dequeue\|backpressure" src/detection/transport/rpc-connection-pool-v2.js

Checklist P2 Requirements Verification
Check all P2.1-P2.6 requirements:

# P2.1: Weight distribution (simple round-robin)
grep -n "currentIndex\|round.robin" src/detection/transport/rpc-connection-pool-v2.js

# P2.2: Concurrency caps  
grep -n "concurrency\|concurrent\|in.flight" src/detection/transport/rpc-connection-pool-v2.js

# P2.3: RPS limits
grep -n "rps\|rate.*limit\|requests.*second" src/detection/transport/rpc-connection-pool-v2.js

# P2.4: Timeout handling
grep -n "timeout\|abort.*timeout" src/detection/transport/rpc-connection-pool-v2.js

# P2.5: Fallback logic
grep -n "fallback\|failover\|next.*endpoint" src/detection/transport/rpc-connection-pool-v2.js

# P2.6: Health monitoring
grep -n "health\|probe\|monitor" src/detection/transport/rpc-connection-pool-v2.js

Memory Leak Prevention Check
Verify cleanup patterns:

grep -n "destroy\|cleanup\|clear.*timer\|clear.*interval\|null.*reference" src/detection/transport/rpc-connection-pool-v2.js