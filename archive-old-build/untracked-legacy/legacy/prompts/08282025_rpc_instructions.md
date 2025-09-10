Build and integrate RpcConnectionPool into the existing trading system.

COMPONENT SPECIFICATION:
- Name: rpc-connection-pool
- Purpose: Solana RPC client with failover and circuit breaking for meme coin trading system
- External Service: true  
- Primary URL: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
- Backup URL: https://solana-mainnet.core.chainstack.com/YOUR_KEY
- Main Method: call(method, params, options)
- Success Proof: Returns real Solana block height from mainnet

TRADING SYSTEM REQUIREMENTS:
- Latency: <30ms p95 for competitive meme coin trading
- Reliability: 99.9% uptime during market volatility  
- Money-losing scenarios to prevent: RPC failures during viral meme events, cascade failures during Solana network congestion, incorrect data parsing causing wrong trading decisions

INTEGRATION REQUIREMENTS:
1. Must integrate with existing system architecture
2. Must preserve all existing functionality
3. Must enable end-to-end data flow with current components  
4. Must maintain system startup and shutdown procedures
5. System must remain operational throughout integration

CRITICAL REQUIREMENTS:
1. Must connect to REAL Solana mainnet immediately (use actual RPC calls)
2. Must handle REAL network failures (timeout, 503, connection refused, malformed JSON-RPC responses)
3. Must include circuit breaker to prevent cascade failures when Solana RPC is overloaded
4. Must have failover between Helius/Chainstack/public endpoints
5. Must log all operations for debugging during market events
6. Must be optimized for meme coin trading latency requirements (<30ms)

FOR THIS RPC COMPONENT SPECIFICALLY:
- Make actual Solana JSON-RPC calls (getVersion, getBlockHeight, getTokenSupply)
- Test with real Solana mainnet endpoints (not mocks or testnets)
- Handle all realistic Solana RPC error conditions (rate limits, timeouts, invalid responses)
- Include HTTP connection pooling for efficiency during high-frequency trading
- Add comprehensive request/response logging with timing data
- Implement proper Solana commitment level handling (processed/confirmed/finalized)

VALIDATION REQUIREMENTS:
You must actually RUN the code and show me it works:
- Connect to real Solana mainnet and get real block data
- Test error conditions with real network timeouts and 503 responses
- Verify latency meets meme coin trading requirements (<30ms p95)
- Show component handles Solana RPC failures correctly (circuit breaker activation)
- Test failover between multiple RPC endpoints under load
- Verify entire system integration works end-to-end

CREATE THESE FILES:
1. src/components/rpc-connection-pool.js - Production RPC client implementation
2. scripts/verify-rpc-connection-pool.js - Real Solana mainnet validation
3. scripts/stress-test-rpc-connection-pool.js - High-load performance testing  
4. scripts/test-integration-rpc-connection-pool.js - System integration validation
5. README-rpc-connection-pool.md - Usage and configuration documentation

INTEGRATION TESTING:
- Test RPC pool works in isolation with real Solana calls
- Test component integrates with existing logging/config system
- Test entire system works with new RPC component
- Test system startup/shutdown with RPC pool lifecycle
- Verify no existing functionality is broken

SPECIFIC SOLANA RPC REQUIREMENTS:
- Support standard JSON-RPC methods: getVersion, getBlockHeight, getTokenSupply, getTokenLargestAccounts
- Handle Solana-specific commitment levels: processed, confirmed, finalized
- Parse Solana-specific response formats correctly (base64 encoded data, lamport amounts)
- Respect Solana RPC rate limits (50 RPS for free tier, higher for paid)
- Handle Solana network congestion gracefully with exponential backoff

RUN ALL SCRIPTS and show me the results. Component must connect to real Solana mainnet and demonstrate working failover before you finish.