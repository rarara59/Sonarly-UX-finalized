rafaltracz@Rafals-MacBook-Air thorpv1 % node src/index.js
🚀 Starting ULTRA memory optimization
🚀 Starting Thorp Trading System...
📊 Renaissance-grade meme coin detection system
⚡ Real-time Solana trading with mathematical precision
💡 For optimal memory management, start with: node --expose-gc src/index.js

📝 Loading system configuration...
[CONFIG] Missing recommended environment variables: NODE_ENV
[CONFIG] System configuration loaded successfully (env: development)
✅ Configuration loaded (env: development)
📈 System: thorpv1 v1.0.0
🔧 Services: RPC, CircuitBreaker, BatchProcessor, WorkerPool, SolanaParser, WebSocketManager

🏗️  Initializing system orchestrator...
[THORP] Initializing system services...
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.678Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.679Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.679Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.682Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.682Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.702Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.702Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.702Z"}
[THORP] Service 'rpcManager' registered at order 0
Circuit breaker 'rpcManager' initialized: {
  failureThreshold: 10,
  timeout: 30000,
  maxRecentRequests: 1000,
  state: 'CLOSED'
}
Circuit breaker 'rpcManager' initialized and ready
[THORP] Service 'circuitBreaker' registered at order 1
BatchProcessor initialized and ready
[THORP] Service 'batchProcessor' registered at order 2
Initializing worker pool: 2-16 workers
info: 📊 Metrics server listening on port 9100 {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.704Z"}
info: 📊 Prometheus metrics: http://localhost:9100/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.705Z"}
info: 💚 Health check: http://localhost:9100/health {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.705Z"}
Worker script validated: ./src/workers/math-worker.js
Worker 1 created. Pool size: 1
Worker 2 created. Pool size: 2
[THORP] Service 'workerPool' registered at order 3
[THORP] Initializing Feature Store...
[THORP] Service 'featureStore' registered at order 4
🚀 Initializing Solana Pool Parser Service...
📋 Configuration:
  - RPC Manager: Initialized with multi-endpoint support
  - BatchProcessor: Provided
  - BatchProcessor CircuitBreaker: Provided
✅ Using shared math worker pool
📡 Initializing RPC Connection Manager...
RPCConnectionManager initialized and ready
✅ RPC Connection Manager initialized with automatic failover
  - Current endpoint: helius
  - Available endpoints: 3
  - Health status: Monitoring
  - Auto-switching: Enabled (transparent endpoint management)
  - Circuit breakers: Built-in protection active
✅ Solana program IDs configured
✅ RPC Connection Manager ready
✅ Using provided BatchProcessor CircuitBreakerManager
✅ Using provided BatchProcessor instance
✅ Solana Pool Parser Service ready
📊 Final initialization status:
  - RPC Manager: Active
  - BatchProcessor: Active
  - BatchProcessor CircuitBreaker: Active
  - Math workers: None
  - Mode: Full RPC (RPCConnectionManager handles circuit breakers)
  - RPC endpoints available: 3
  - Current latency: Monitoring
  - Connection health: Auto-managing
  - Failover status: Ready (automatic endpoint switching)
[THORP] Service 'poolParser' registered at order 5
⏳ Waiting for poolParser to be ready with data...
✅ poolParser is ready with baseline data
🛡️ Circuit breaker initialized for meme coin protection
🔍 DEBUG: lpScannerConfig received: {"enabled":true,"source":"HELIUS","intervalMs":2000,"lookbackSlots":200,"maxTransactionsPerScan":50,"scanTimeout":8000,"enablePumpFunDetection":true,"enableRaydiumDetection":true,"enableOrcaDetection":true}
🚀 Initializing Renaissance-Grade LP Creation Detector...
🧮 Mathematical Configuration:
  - Accuracy threshold: 95% (statistical requirement)
  - Significance level: 0.05 (α for hypothesis testing)
  - Bayesian confidence: 85% (posterior probability)
  - Entropy threshold: 2.5 bits (information content)
DEBUG: poolParser type: object
DEBUG: poolParser methods: [
  '_events',           '_eventsCount',
  '_maxListeners',     'isInitialized',
  'rpcManager',        'PROGRAM_IDS',
  'mathOnlyMode',      '_signalReady',
  '_ready',            'batchProcessor',
  'circuitBreaker',    'workerPool',
  'renaissanceState',  'historicalBaseline',
  'livePoolTracker',   'lastProcessedSignature',
  'featureStore',      'liquidityThresholds',
  'volumePercentiles', 'ageDistribution'
]
DEBUG: poolParser prototype: [
  'constructor',
  'initialize',
  'ready',
  'healthCheck',
  'parseRaydiumPool',
  'parseOrcaWhirlpool',
  'getTokenAccountInfo',
  'getMintInfo',
  'calculatePrice',
  'calculateTVL',
  'batchGetMultipleAccounts',
  'getTransaction',
  'confirmTransaction',
  'streamMemeCoinPools',
  '_streamMemeRaydiumPools',
  '_streamMemeOrcaPools',
  '_fetchRaydiumBatches',
  '_fetchOrcaBatches',
  '_quickMemeCheck',
  '_parseRaydiumPoolMinimal',
  '_parseOrcaPoolMinimal',
  '_calculateMemeScore',
  'findMemeCoinPoolsOriginal',
  'findMemeCoinPools',
  'streamRaydiumPools',
  'streamOrcaWhirlpools',
  'retryRPCCall',
  'updateRenaissanceMetrics',
  'getEndpointHealthScore',
  'selectOptimalEndpoint',
  'initializeStreamingSPC',
  'updateStreamingSPC',
  'generateStreamingRecommendations',
  'streamSPCInsights',
  'performSPCAnalysis',
  'generateSystemRecommendations',
  'streamRPCMetrics',
  'calculateStreamingMemoryFootprint',
  'getRPCMetrics',
  'initializeHistoricalBaseline',
  'updateAdaptiveBaseline',
  'detectMarketRegime',
  'computeAdaptiveThresholds',
  'getLatestPools',
  'computeBaselineFromExistingStream',
  'calculateLiquidityPercentiles',
  'scanForNewTradingOpportunities',
  'parseRealLPCreationTransaction',
  'validateMemeOpportunity',
  'calculateMemeConfidence',
  'maintainPoolTracker',
  'isValidMemePool',
  'cleanupExpiredPools',
  'calculateConfidenceScore',
  'scanForNewTradingOpportunitiesLegacy',
  '_isLikelyMemePool',
  '_extractRaydiumMetadata',
  '_extractOrcaMetadata',
  '_calculateRealMemeScore',
  '_getAdaptiveMemeThreshold',
  '_getMarketRegimeBonus',
  'shutdown'
]
✅ getLatestPools method found
🧪 Validating poolParser.ready() method...
✅ poolParser.ready is a function
✅ poolParser.ready() returns a Promise
✅ poolParser.ready() promise resolved successfully
📊 Calibrating statistical baselines...
🏛️ Initializing Renaissance adaptive baseline system...
✅ Renaissance adaptive baseline initialized (zero computation)
📊 Mathematical priors loaded for immediate trading
🧠 Adaptive thresholds will calibrate during first pools
⚡ System operational - no baseline computation delay
📊 Generated 10 mathematical baseline models (est: 10000)
📊 Calibrating with 10 recent pools from poolParser
📊 Total pools for calibration: 10
✅ Statistical baselines calibrated
✅ Renaissance LP Creation Detector initialized
📊 Real binary instruction parsing with mathematical validation active
🧪 TESTING LP DETECTION WITH SYNTHETIC DATA
  - instructionData: EXISTS (length: 9)
  - accounts: EXISTS (length: 6)
  - accountKeys: EXISTS (length: 6)
    ✅ Token mints detected: 4
    ✅ Pool accounts detected: 3
    🤔 INTERESTING PATTERN (score: 6)
🧪 Test result: {
  "accountCount": 6,
  "dataLength": 9,
  "hasTokenMints": true,
  "hasPoolAccount": true,
  "hasLPMint": false,
  "hasReasonableAmounts": false,
  "likelyLPCreation": false,
  "interestingPattern": true,
  "score": 6
}
✅ LP detection is working correctly!
🔄 Starting LP scanning...
📡 HELIUS webhook scanner selected (using polling fallback for now)
🔄 Starting LP scanning with interval: 2000
✅ LP scanning active - checking every 2000ms
[THORP] Service 'lpDetector' registered at order 6
💎 Renaissance Tiered Token Filter (Fixed) initialized
  🆕 Fresh gem detection (0-15min): High risk/reward analysis
  🏛️ Established token filtering (15min+): Proven metrics analysis
  🧮 Organic activity detection enabled
  ✅ Robust token validation with retry logic
  🔄 Progressive retry delays: 500ms, 1000ms, 2000ms
[THORP] Service 'tieredTokenFilter' registered at order 7
[THORP] Setting up LP detector event handlers for live trading signals...
[THORP] ✅ LP detector event handlers configured for live trading signals
✅ THORP SYSTEM FULLY OPERATIONAL
🎯 Ready for meme coin detection and trading
📡 Real-time WebSocket monitoring active
🧠 Renaissance mathematical algorithms active
🔍 LP creation detection with 95% accuracy active
⚡ Live trading signal generation enabled
[THORP] System initialized successfully in 43ms
[THORP] Services: rpcManager, circuitBreaker, batchProcessor, workerPool, poolParser, lpDetector, tieredTokenFilter

✅ THORP SYSTEM FULLY OPERATIONAL
🎯 Ready for meme coin detection and trading
📡 Monitoring Solana mainnet via Helius Enhanced WebSocket
🧠 Renaissance mathematical algorithms active

Connected to mainnet.helius-rpc.com:443
Math worker 1 started
Worker 1 is ready
Math worker 2 started
Worker 2 is ready
Math worker 1 ready for tasks
Math worker 2 ready for tasks
✅ Secure TLS connection established to mainnet.helius-rpc.com
   Protocol: TLSv1.2
   Cipher: ECDHE-RSA-AES128-GCM-SHA256
🔗 Production Helius WebSocket connected
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:03:41.821Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.98
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '2zUYgR7ujciB57Ywmv4p3fHHwuS2JtmcV9y6QqEP7wCoXRTnjrbpgaTmPRXDa6PEwGT2DXWYUETRhmWRWsFPMnww', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '4VzfWD8WQhdvPQEZdcxtRaaS3eNXdGgRUJnNT7AoPXmax7Fh3iAf1zmxhS6hUqxnEzj5iz2873F4NfKjaZBZFojQ', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '43LCcLhkUMa9poX85zZ3LWcAPT8QFjmXVh5JpMnSfKVvkBw4QggaGb1hiEjFxyJWDwcnW1Zc7GJpWgUZpf8nKKGM', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3ipNdMuD4y68xmd7goKtQNNhLmno8EteY2ckfMu4PDsUkTKsgRUHigGxfWBjw8zUaBocEeyoi66pTiFfhv9uYYL3', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'uqzLFAEfYDZTf1Q2beHbK7cxx69wrXhSZkQQcCLE6Bg9pcmxHNJSJnexMn93AWkFoEFEMbrDvBCajwTzvobmwJW', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '493NMZxeoMvSCdFAfEdqN7DZgZjtQbU81SvTi9inwSpfzpvpcZJsrXUW9S6YPD32DtRZWbktx8xgZkube6uJnpmR', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '53d8XzZwL5KWNY1nmVTmyoTcm8qwHfgVMBDWW8xxW39R72PzSvDeBuk6Y3vn5muFfQ1BDW5rp8qSsbEhJRHv4oAw', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: 'X5erKAyx1znPwA8guqA9iK269caCJ6mQKTnmRkbCuaafLyLoonbnrXL9NpMstsat3BMg8XGPBhgqkXgSDzidVyK', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '2Y2nnoj7rM8wrVcv3y8xdZJq1untR1dFbxa9wd5YwoQBDXcGm89aGqobAWQsGo1JeSahVrmKEEbcyeUr5VL1LGmY', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '27u8yA1yQqL7PvvPCrBiUg8EHginnPCygBBAUygFHQD1TQkppVBNq8yroMKtb52eXFLEiSUCsZ9s9akzBr7AxPND', processed: 9 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '2u9JMn7b9vGY6N6PvXH6jXPTJ6pJC27eg7rkx4pgFs19abZnQSpNZ3th3Zm84bqV74R42SH3ZeyuGhFuW1saZHE9', processed: 10 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3P8vziwbJLFT4Wjwg7B9sYnEeWzaui54Bu6oCTd1DwrZ4T3UbEX9Vek8PBmiSKXAT9TvnAJ4J36T3jU8NneQgAnk', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '26eSns1wssQxeT6sZUeJfFz4WdEFaBAraeUoimU9v5BGSB8ArErrHVEmZAQR3QsPZomKmtWtz5kF2tkzNmd7r7AT', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '4HuaB4iWBUR8MLP4N8Y4nonUQ2HV6s6cJ1UDfT2fx2vubhtHVUNTGxitkUriVaDfArqqezUQja1EeP4KP8Q469Ho', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '65W9vQqyftKtLNTs9fiH83puMt177ErnmqfgwW1zj4ZfB6HUfVeL2S9tWKgELtdR4YJU7SEXwTSNLxPnvg8jpDpP', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: 'BBBGqjPoBsQVQkbnG2iKjKJnzoQBewVM69rKhvMbH9s8LaVo6EV9YTQPvfdwmf6EspPzafUvYetqFh87w97BnnF', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '2vLXJUSQcLhiMi5NBhQS35z1LsJmn6FfQ19qGEopg8aYCCv39VnDU3MZtTv9tcTJ5yXfCFTF1oppuox72tVVKL9v', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '647DC5uDSX2KjkbnLXtsPpyaDoabzENppUpeh3siet31zdxTMupLiy9fQzMSYRdmXkGsShaXabL6ok7ozfCRGzQW', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2gPc7Ec4PBBXnTB4nB1iY3t2FwpLmnG2amptyjoHGfBYuNiag1Fsy8S1e8ZktdFNNvottNGxZKpM2Wagd9tQNhSc', processed: 14 }

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
🔍 TRANSACTION DEBUG: { signature: 'g8Wcgmt3VggZLjkLXHs4bPRZKRvwwDYFSAjbTg2jCFBufD7ik9k3Yd4aD7fDx2QqqkqQGFqDhfM5xmqp4QC5zTn', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '7sEFYj7BUX2yTo9eXp6k6vvkddSSo1hFvp3g8vELpDFbMLQc1QvaFdtjwysPhGYmsFWJkSVthM946ZVmNAGNaB1', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '5xYuMqvBRZZpyU91Yvcx79LxCPZCkXSCo287SpLy2ET5ngKtFYozmVUq7Lfe2tfDhXKBY2t4kZAJVbWC5fio7MdT', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '4ziC534yzUX2ieJYUSDq2bZjRTjbqBJRv5nTpWcNywvkX7QKEzPK881MFtwprmV1aYP86ALufPA6cmppCKaTYKia', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: 'q8WtDGHwVaJFSJYqoZqYSNPFLKa6pahiJ66amxqtQY7v8Uz5dnriiQgiAuAFdbfvzeKJLKUeGz31JMxWnMaSUJh', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '23KEpTAxAQydeFi5EL9qkpMn35v6AEAUPFc4NGzMF5iNt3TFpjEVBMyguAByCgThy6pcKG64PQiXGTnPyrMxC62j', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '5urThKHc92ZGg34z1MgVs12PiJi1B7hBWjwd9keRSGy6gy77Gf2pLTBE8RXSxK7qNTEDMJnmtGdQXrjksEbtJ7pw', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '4S3p1dZkRsqCspDeFc4V5DCrqAtN6Zq5LSZ6qMLDqoam5UQJZ2LdakgmdEcMCPbT5zUTGcXz1oZGA5JEv84KfYZw', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '4LuRSaR2aP6PVGiuTz2GvLTaQzV2rnyMnAekK8RGivjwpDMnbdVzyeyRhum8RZEL3BxwEgEkxc5C7aU8i1mCA9Sj', processed: 19 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '5QEwgN8qxadqaMRrKZw6bqY84kMNQEB3ZwtSVWWw6aRA9DDRfMUrYMdksPYa1DWk4K5mhvac1aMByYwyP7yLwYt5', processed: 8 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '5bDyJFbQ7LuZVUWPq6M8yvS1vrP5Txo7GQWLmDL2qKunvGK4yLRZru3v9YZghebHBxpRbfS7D2RBNB9fk2YEFHMe', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '28v3yyDTscjys8K1rUiXhNTx4xxH6gLhhHsAPofxC9FFE6u1H6RzRj6DuJKFZFHPN75TFeHfX4QXnS55jux9sg4k', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '22mfa1FanaoG67dbHcaVDQnQSNoBPBdf3Lc3EjXtXMJqr5NjyNBuXTCp87gCm9NM9ZF2fkd15HezxoXkruU88qiF', processed: 20 }
🔍 TRANSACTION DEBUG: { signature: '5uqQ6TySLRS2rV8NLjSJp6SFue8ihHacDE9a5RKURmzNpH3g4aHp3MVbddBPeeCiejmsN71tzM3uWu7byMNpPqHd', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '44rBymT1dcoj1sdfJndLqFDseHhgCm1FTMFNvr6h896hWEUTMVUrJibvRcCdH5C1Zz37a7oMdaSzLxkXSwdsN5jE', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '52KvTcbgXcok7Hpa8cT5FRphiJzSCnQrLoc5b31zgsKLvrX36aAW1h8wc98BMaA67zTtD3Dv7tKc3PU2eNpedvsj', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '4LhdcgvNTRUvXRNMNYWiTr1DHk3PhM3GJCvg8y6CANzq6LHGdN1ArtQk8XpcfcT4gkLkr6AeJvBJez9vTxjAmJ1y', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2sqYSuSSWVSmNvfBMB9xfAQoamQqqgqDFGt8acjjGJwMBCN28QigFttZ8kru1z86pg3u4EEKfMLM4fwqv76HwedR', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: '5o5REUidousK8ZzrGa9u3MqGUWWjrdjvT5gZ4EtjPeCdB4tvccajuDvF9XLbNcSnFcV8B11Wq6FuV3YtdAHvxRRK', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '5pxr6kaWBt62FKCV3ksTNtPKuvUa2kaxEjg9eEaU17z99nBaFxCLUQw48VHxLW5SiE7v7N5sTuagH3Ts8P9bcPi9', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '5qToyeGC55SZ6CHY1tyd8wZUPrLMYLuXUkeFw58o5JsTb69EXnCTvdF4BJDpDV8LkMnbE4v6SAnARQba9xKW6x3y', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '39TM9PuBLsiaumjUmQ9dAARB1tfuHNCDAtg2rqGHXMC3WvH4XaXXEtPAUgsm9ZAiUmRVPQqVMoMHVtu4yxoRYopM', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: '2hLqJtSrnKRmuRD2srEXkBWTZTop4HoMzvAH951C4D6khsDfQPKdwSD4qmN7t1jm6Yk3SzDsiocMaJ6otYfbE1yw', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '3nfFok8Vr11imSSoB5YmCfxJneDqpsVAUv1MS4bELh7FjmA9PBygRfNZxAqH9wPztzv9qxTacuBsazCBH8L6bmRb', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '49yp3goW8nTYzDZa1xhvXpUwQzf7qb6Zooi4YQcjAoSRjxzkmNjPtqgJxgAVSFmhk6dGyS3GBs1Mdh8YNp6o2j8h', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: '3ym1EzfY7SDs5QPCbs21NHvwCkPCmjXFKCt1ge1GXdtNP7gAD6WNYF8VSA7ssTNTMJuBb7JFSDzLc3PkWefmZ8N9', processed: 25 }
🔍 TRANSACTION DEBUG: { signature: '3vc7SKYMMUG99nv2aSUY3a55yQ4HCjoxbqqWztwTvjQzFoGtAYYU6juCQ6PjGkS1pDqBDKXi6JGyY3Efp1LqSgKv', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: 'V3g8g5RA8PR4XsZ4hFZnRwBfvZVweZ9MfXXkBof6s6wLp5YgS9QeDFZmhyTPNzi2suXFGVdfnAczA4JwnEP4vdr', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '5s5ykFaTrN1ZkrRLDg5NwZHHhiMCaDAZ1MxRVCBZ8LMipxjGaYK45WLeGuui5TVNYh4mVyNGUvdDnbA2RmLComr3', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '5yZFArusmr7NSjmBZ5EMNCxBPyfwQgfBVPgEKM8uuGksGdAbZCGLzKpMasog5gTCF9khAVyNJwEVqCLGfD3AgLZr', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: 'KNHZ7xRuxefmacJQcVisPFSG2yF3HL9D3bxHTR9TkxQhU39kr9hUu3KBTv4zw7XTbHTwgNg97nko7KiiMuJYzvU', processed: 26 }
📊 SCAN COMPLETE: 0 candidates, 1733ms, efficiency: 3300.0%
📊 SCAN COMPLETE: 0 candidates, 5757ms, efficiency: 3300.0%
📊 SCAN COMPLETE: 0 candidates, 3808ms, efficiency: 3333.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 31ms, efficiency: 3750.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4000.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4166.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4285.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 32ms, efficiency: 4375.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 20ms, efficiency: 4444.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 10ms, efficiency: 4500.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4545.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4583.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 22ms, efficiency: 4615.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 10ms, efficiency: 4642.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 99ms, efficiency: 4666.7%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.96
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4687.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 29ms, efficiency: 4705.9%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2Lv7KJjazUUcumA2atqAyruZ6SLSd7xTv8PoNi3cR3rDf4brWQge5dJpgvz4ZoNnpog8k58hNJCUY4RvEUHZpwpu',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '59ea6d2'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: undefined,
  current_hash: '59ea6d2'
}
  🔬 Parsing 4 binary instructions
  🔄 Converting account addresses to indices for CwU7m7UiwYCcC3Tujt55GSWakHqkcp5uHvZPYJcDZriF
  📍 Normalized accounts: 0,23,28,19,36,37,40,39,25,34,29,38,26,30,22,31,27,10,15,7,6,5,16,11,13,35,34,3,12,4,32,33,17,41,15,7,9,1,14,18,2,35,34,3,12,4,32,33,17,41
  ⚡ UNKNOWN PROGRAM: CwU7m7UiwYCcC3Tujt55GSWakHqkcp5uHvZPYJcDZriF (using fallback parsing)
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 24
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: {
  signature: '2oPnjfpNbZUBpgfugkPc7CoiDNzgzYWXJjxNDW7dGDThBecZstqKHtQqooRwnTkoRnkF2UyzbEKgq5td5Xe3YNVf',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '55290042'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '59ea6d2',
  current_hash: '55290042'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  🔄 Converting account addresses to indices for 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ
  📍 Normalized accounts: 0,45,0,2,46,43,48,51,3,46,44,52,13,10,12,9,11,44,52,15,18,16,17,14,55,1,46,47,50,26,24,25,44,52,20,23,22,19,21,56,6,46,49,53,30,54,28,27,29,44,52,33,32,34,31,35,57,5,46,47,50,37,38,36,44,52,41,42,40,39,4
  ⚡ UNKNOWN PROGRAM: 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ (using fallback parsing)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 14ms, efficiency: 4722.2%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 7ms, efficiency: 4736.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 43ms, efficiency: 4750.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 35ms, efficiency: 4761.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 22ms, efficiency: 4772.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 8ms, efficiency: 4782.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 48ms, efficiency: 4791.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4800.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4807.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 18ms, efficiency: 4814.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4821.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4827.6%
📊 System Health: 7 services, 0m uptime, 17.7MB peak
🧠 Memory: 18MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4833.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4838.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4843.8%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2Lv7KJjazUUcumA2atqAyruZ6SLSd7xTv8PoNi3cR3rDf4brWQge5dJpgvz4ZoNnpog8k58hNJCUY4RvEUHZpwpu',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '59ea6d2'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '55290042',
  current_hash: '59ea6d2'
}
🔍 TRANSACTION DEBUG: {
  signature: '2oPnjfpNbZUBpgfugkPc7CoiDNzgzYWXJjxNDW7dGDThBecZstqKHtQqooRwnTkoRnkF2UyzbEKgq5td5Xe3YNVf',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '55290042'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '59ea6d2',
  current_hash: '55290042'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4848.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 29ms, efficiency: 4852.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4857.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4861.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4864.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4868.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 19ms, efficiency: 4871.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 7ms, efficiency: 4875.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4878.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4881.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4883.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 18ms, efficiency: 4886.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4888.9%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.93
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4891.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4893.6%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2Lv7KJjazUUcumA2atqAyruZ6SLSd7xTv8PoNi3cR3rDf4brWQge5dJpgvz4ZoNnpog8k58hNJCUY4RvEUHZpwpu',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '59ea6d2'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '55290042',
  current_hash: '59ea6d2'
}
🔍 TRANSACTION DEBUG: {
  signature: '2oPnjfpNbZUBpgfugkPc7CoiDNzgzYWXJjxNDW7dGDThBecZstqKHtQqooRwnTkoRnkF2UyzbEKgq5td5Xe3YNVf',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '55290042'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '59ea6d2',
  current_hash: '55290042'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4895.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4898.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 40ms, efficiency: 4900.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4902.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 17ms, efficiency: 4903.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 5ms, efficiency: 4905.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4907.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 33ms, efficiency: 4909.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4910.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 7ms, efficiency: 4912.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 45ms, efficiency: 4913.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 31ms, efficiency: 4915.3%
📊 System Health: 7 services, 1m uptime, 18.0MB peak
🧠 Memory: 18MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 65ms, efficiency: 4916.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 48ms, efficiency: 4918.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '2HiQnvvtdq4osCUQmyVSSyyuexxeFotFzVXmG5uTdt1zqjGgo1xKzjaZTX82onivwdmUxLLPXJcoeGG6AMjR2oAV', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5EEQAkzGZsM5KcWwQz8aijNTWVA7d2a7NgtFGCRorWUCbYjrdtnpgSqCYnd2Bki6JxW4xLGWZhUXHhCRi8kt5TQz', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2NsCS2At5w79jjbYTWLzZUMS8nfKMECYnZWVzL5q4YgXfZ2Qd3tuXjJWMELv6aLiCUcWvD59v9bHmTH3vX7LvVyh', processed: 2 }
🔍 Scanning recent transactions for LP creation...
🔍 TRANSACTION DEBUG: { signature: '2S5wQPJhKx89ofMQ6dvNpqxRXjTyH7cjLGE2jxkU8B6K45wrgEgsuVc75BgbvWeNudmHxzbavXFBnvy2JbUx5xL9', processed: 3 }
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: { signature: '5Xxa32NRwNx2SrHsinaWak8ySwjd8UupHUGDTHxC83LtWvmJA7KRZf9G9Kv8hKD8bCBtCWhQTihvRBRgS9a5SQVk', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '3MrGHjHzeZEKY1nmVXkzZBcvdxqKhfoBx2ubGy4rMj6M6BK1TAm5ABoTwvwneGsWr5RwRLs8YCQjXbVq9svDCpiA', processed: 5 }
🔍 TRANSACTION DEBUG: {
  signature: '2Lv7KJjazUUcumA2atqAyruZ6SLSd7xTv8PoNi3cR3rDf4brWQge5dJpgvz4ZoNnpog8k58hNJCUY4RvEUHZpwpu',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '59ea6d2'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '55290042',
  current_hash: '59ea6d2'
}
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '5TEqgsEt9rTCHEuRdZrFssce88zBMVntvwunYbKYFMbKPbvBKTr3YH4ce13SdHPC9kXJRAt5GKKvYSSaYFim5bw4', processed: 6 }
🔍 TRANSACTION DEBUG: {
  signature: '2oPnjfpNbZUBpgfugkPc7CoiDNzgzYWXJjxNDW7dGDThBecZstqKHtQqooRwnTkoRnkF2UyzbEKgq5td5Xe3YNVf',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '55290042'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '59ea6d2',
  current_hash: '55290042'
}
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '57BKb36AtXjJYpARXoizLCi9vaeFshEJ6fxK6RGzFte5fRtzEW8EcHYdUW8YYrjfFykte2RpN7vAZ6MEjgekW66L', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '32MtVkp2pv6TYQfK1quPXMCaKSoyfjhL99PAjf63w4BpjzBNGgZoAcihtpukYQB6AqZoK5xiwQ8hfLNp1DJ8VgEn', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '2WNvpeNaGCE2dWrGWNhkVFxv8uy5SXczJCG1SVECXUNQGHXXphWbrrNGQ5iHZSk25Mj261gBrr9irYrNGna2L4rU', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '4ft3SfJfjy9D9Yc3VRJqbtbFQxxoRC5ofo1stNVmwEjyh3XikGQbom4bmReDgWzBtgfhvaby26Eyn1QYkDwDxwbW', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3Bnida6TQddLPzWKxwuSevPivw6YDPKAoqzbyKdhJLUJVNmsn2Wxu8Ldta2XqhiAsPhiMFXmgvDLM51GFqp6dWah', processed: 9 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: 'dijhcthEVjn1A4kbk5KNerAjLc6DDyJajAk79Kpfr9p9mWWXgZWPaKUgxvD9QFKHfie3VRsVFrSs2Q4K8eTGrUf', processed: 2 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3j2QDVwN3bAynJNgMs3RBSfXJTmSxNV54TEkQfoXLvPtWzuycpvYoMphTxJZeyPNY4HzcSCpwXPh85beVv3zPAnK', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5Rq5aiWMZmPQ72Y52t4u2swfTWPHQT6wzumbrPDFZBiYznq46yx1a38kncHn4RWPh9nKPcLEtTfK5qAP8HNTD52W', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '3NC5111TYt4Byk7kL3u7qXN657KEgQxbdnLi181CiTtLdq8gBvHGB7cJKweC4YtadG7RzKQTsndhSaNUT3VK32iq', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '3YF7YbhhFQR7HaFBar7tZPnVC8A7Ert7hGqeTpzDpC4WRdFzLeShh6ZLwu4zsUhgYUdGzx9R8KDaitoSSkkp5FZd', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2NKyJFvXK2rdB93hCjFFNLmPuMDoEfLaqZukPano2DX2berxQEzwYq2rpC4g8hPJFnZG5EgSDCAW7qD1ioJyS2XJ', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '29ErQV1uaRQA7MJkNn17Lhazn4aijqYWmwZGpvnQj33LLQFbihsCeTVHrNN74VM4eCJ45mD7qF3cWzb1CoTzXxWz', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '4vPT27TaQq83WdEfgDMSHxYNrh9xqcZYeA24ZJiAxT5KxXGZSASQpKyziarzX7v5pEBvzrc3ScisB9yqFiPvJXXB', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '534JwDwUo9vLfRBXY4V1iuQWpw5pfePehaFM9YCtekHcBZ4XVtCvFKrnzJo4bFymk7Nq7rpu4pidhdvSiriiiVyG', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '5DT7zpAe2dNyhDKru2vfJ6dPzcUgL3uFbNypjgzwJ6yB6FfUjJZm8CBhCutLEvQ3R2PkDakKxUnPQgCsgouTQcLU', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '5owi4jSX4tNbLUb64W6UvnZs45XA4XVeYunksitJKZo7QqEXo3YmBt8kNN4rqTU8KEt9BcrZuPEdt6GBtEbENRMD', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '62okyEriYCbEymLjXtJ6KQh9grvy3jFtCrDEgqGSEmrLpMUDkiCfmUSaxqwSn3a7Kr4pa13x2w14ZruN4HkUmeq8', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '3ns7LnSR4X25ysX2c2rCC3eRqgUKya2DedkqhyAw6FqPXx19bo6eR9RWqQ5sTvhCdBzjun9E3wXLvtnBQ33nqUy1', processed: 3 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '3nsJZ4JdZuGk9STpLzB8BHrsicMWMkXcGbiazr6Aiwn7fdT4GNiAM8CrSWAepfKYKVdE8SVxw8GWCT8KyFRy5Z4w', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: '2puWBxHLjN6Pk1wq83ZUjBqUfJmArQjx9Z8BZen87pFE9jruQraKu57pes4TeNG8nQAui7Z2MPNG5CAYDQbxvaje', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '3bVQMC5kwdYBs4FbLnyXMspiJyW9ip9K471LPbqVBoPGHg9kVSZgYr7dnDBmekqonpZ2RCzcMYs5HLXDvaNAmuQy', processed: 7 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3F4MDGQvUMKpKe46M9f5iUh8zTtzQHVuWgHKYceZEv8zhiGVS2SmrrhXNhJkaPKXFfUE4ujK1TRKa6TxHzLNpQqa', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5Pgm2UHutbZgwZ22CKikazhDRCLYvA5fg24XCYTi5z8VYMhiE3YYUHAwFSKW9p16a7HSo2wBTSYuGXDKPqYKN6aF', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '25hGB62w55B77bq64EERtZwYJykznX25rHMPgCZL5LtWG5C7iXhYCjwe7Kgd2xH1QsCnnopSC6VhXL7hCAFVcvka', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '4vSDFyyYbkV38oCNbziHYLaPBQ36FwukCkRvSmtfB3eCc5GXnd1w36hSam4uRdbjeaqkkeMZefYCj7wBDoikXpJL', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '2GKWDSfSwbuTiixfW3XMMZmkKY5uizidFeDTzj1V12DkSArU6gGc8Zn1gG4cr2nNE6txFNCqMXbKBhqbfgZPqkiP', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '4p5syC8fq2Xi8TFfTVTt7v7oBj6Qz1FxC8HcUvZEEBvQ8k82YBaV4Lu9EdXaDZhg2h8EmdzrU8emGiCACVF7myaf', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '52swCZpY5vwaJQRFo4yuMAFP3u4oih4nLyhBgqFNfxWLSjXFkrSVXHrWqATqAHvK5Rht7KimHznbk9mKXGAAgbvp', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '2JPD7kRo53gvisDtFpRb2Y8gJaFJjDbYB1Y9tq2JcH3sgCVy6stXDSL3zW9eNf9d8Nkd149dyo1cd8HovGcQBSwZ', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '5M5pb6AW3vCeEafg7AMQVrEpF5aaJe3yCHEgjLnaHsDqoUwJcfN55eJm5xwgB9LJ75bq1NMon7XXCxf1BBXswri5', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3n1kCG73Fj2Hn2NNNaZYtEzUQZcxGhSFau8VZPLUdiWDBKXxpk553ADxxr9th1g5frmJfSMxumKoCGwn8M8ZdkGP', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '4MLNz1FyCA6BB4KagoyCfRLb7Ty7KBB4TxsNTquvbJJ88xsdPKvJaDtRoWJW6YjdNNtYVSRTHV42kAYi3iBvoAWs', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '5wRzh7yg1KXFe5MX5rjHu9oKzLuvWRq5qD4ddwV2UcVT8NrvzZWaTHUc6vCeSAFv51ye3D77T6WHVFqvnryGhGJd', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '5GwGAwvwuMqchhVZpPUaPqd2vAFU9aBjFB2SoX2Zqa2a1DnySoYQMBn2esdKvZEa9BkVHdPLsmH9vHH2ksBhatuj', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2PTLgNqhvKjJGUpimF2evBAUbbPzSL942Li6m3X4vbUVAv9XXMXDjCmYKgsj66co2D5azD7xHnV3AYSzbsUAQDbV', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '2J9e2mvsvdYTmJ71cEAT5ySqoeoqyo7oe4bh3dZ21wiS6xGASwGZYPzcqfKAiaEDoKyDotouhyM68mS6C68dMnKc', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '5vQbAaNvPrEwPNqBBevmoNYVtQxMGAfq5TfzArEPs2JHqcX6vrteQAm5iMscVfpyTtc7fWJzi5RMp15ab4ud1wqB', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '3Cy742XYph2y9itnwLcKYSqb8VeotVNw8PvhE2noY5UDP7DJUMA4RtBodNw87YV4VJhghok3Z25MkXttKuCAQUF9', processed: 19 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: 'q274JR7cuwYSG2bcNcFPxRpYMx28mFeNR4TPmUtGpCp8t1aPPr4QcgSxHYAzYmuyhCq24XQTLixSDrZHtfKggJ2', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '5QRkoag8kReJszuCnpGbUXckh96csVWonsFaJYiuNA9irx9Uv4ZxUrsnGqPrK5VMW475Bd3qhB8iRwcBwCpbccBZ', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2vo8UJxp5wrfcgxBXZzxqThpUAzfgveEK5EvjUKhwiZNJBUzeerWXQg25Jqixc5g3B4KNtz6azWUrbNJeGcMK3t7', processed: 9 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'Cca9KsS7H31gW893wqKikSnx3oRnpgftwe5hcAnpFsv3PUrEPnTyaC2DKQ9pcZN2YY5Fc7cEs44wbDKcRrMdm9D', processed: 0 }
📊 SCAN COMPLETE: 0 candidates, 8217ms, efficiency: 4833.3%
📊 SCAN COMPLETE: 0 candidates, 6238ms, efficiency: 4837.9%
📊 SCAN COMPLETE: 0 candidates, 4275ms, efficiency: 4839.4%
📊 SCAN COMPLETE: 0 candidates, 2294ms, efficiency: 4842.4%
📊 SCAN COMPLETE: 0 candidates, 548ms, efficiency: 4842.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 26ms, efficiency: 4843.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 13ms, efficiency: 4844.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 52ms, efficiency: 4844.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4845.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4846.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 14ms, efficiency: 4847.2%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4847.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4848.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4849.3%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.9
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 15ms, efficiency: 4850.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 57ms, efficiency: 4850.6%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2Lv7KJjazUUcumA2atqAyruZ6SLSd7xTv8PoNi3cR3rDf4brWQge5dJpgvz4ZoNnpog8k58hNJCUY4RvEUHZpwpu',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '59ea6d2'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '55290042',
  current_hash: '59ea6d2'
}
🔍 TRANSACTION DEBUG: {
  signature: '2oPnjfpNbZUBpgfugkPc7CoiDNzgzYWXJjxNDW7dGDThBecZstqKHtQqooRwnTkoRnkF2UyzbEKgq5td5Xe3YNVf',
  slot: 357475016,
  blockTime: 1754175855,
  accountKeys_hash: '55290042'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '59ea6d2',
  current_hash: '55290042'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 40ms, efficiency: 4851.3%
🔍 Scanning for new LP creations...
^C[THORP] Initiating graceful shutdown...
🔍 Active LP scanning stopped
[THORP] Shutting down service: lpDetector
🔌 Shutting down Renaissance LP Creation Detector...
✅ Renaissance LP Creation Detector shutdown complete

🔌 Received SIGINT, initiating graceful shutdown...
✅ Shutdown complete
