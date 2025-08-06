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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.838Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.840Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.840Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.842Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.843Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.863Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.863Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.863Z"}
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
info: 📊 Metrics server listening on port 9181 {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.865Z"}
info: 📊 Prometheus metrics: http://localhost:9181/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.865Z"}
info: 💚 Health check: http://localhost:9181/health {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.865Z"}
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
[THORP] System initialized successfully in 46ms
[THORP] Services: rpcManager, circuitBreaker, batchProcessor, workerPool, poolParser, lpDetector, tieredTokenFilter

✅ THORP SYSTEM FULLY OPERATIONAL
🎯 Ready for meme coin detection and trading
📡 Monitoring Solana mainnet via Helius Enhanced WebSocket
🧠 Renaissance mathematical algorithms active

Connected to mainnet.helius-rpc.com:443
✅ Secure TLS connection established to mainnet.helius-rpc.com
   Protocol: TLSv1.2
   Cipher: ECDHE-RSA-AES128-GCM-SHA256
Math worker 1 started
Worker 1 is ready
Math worker 2 started
Worker 2 is ready
Math worker 1 ready for tasks
Math worker 2 ready for tasks
🔗 Production Helius WebSocket connected
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:50:59.980Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $159
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '7jCoeir41PqepTd87QzFhJ6Rf5TQxBaSRBVMLwcM5SUeDYNGrrR175rj6HHJmUg9mv4ohHuoBajSGpY87F8eS7i', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5eZCStu6ffkXbtgomBtG5zcfGjP9QsoNVDhYVa5oAiXHABFWK2pQnUyTgCa4GtnLzsZ7rPLmSx3k5c2M1xXKLnvP', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'B69RgXQGf9QyLfABv9whYkn4LxsrNSSMWfjbnnx2vbnbm2whN4w7rg7mPBk2XZjxCZ55jHqepm2VdG6VNXQ3d6H', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4Mdd5jW6BSGnoemJKiTouRnhqrDMsjPQWC2dwTxYS6SzWuBz1Kp3kWmR1KwBqUubbmu8NHwxeACJsPKidmQCgwwK', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '5UvL3GAWQTMfszrxyJqdafLyzH2ANLEzW3RNCmmFQigzSvXNzaSMbuGbGrnfPLggG9w8a4PZJ3dW5dX78gaf3kiT', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '4C9LK6mphxcABjwAfA4LUfjFCvi2VmrLa7gfmGm6vUHTDJiMEwktMm6LKmVRp3MMAX8ZpySx4mfNHXwCV6KrRhPN', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '2e6NXk86PqpPXQmBhLx1BXtm5rbSVU38SAdnBN3WNMDXtCCDn1mrtZpreWbKRjTB2eNFB629matZ4euKx4CuXrzq', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '21k3sJgoeTDHgFtHkw4E2TgiZXccj4ufayGQrfaCqXakZfwtme7NW5nsiaCkDhswEBRQztt3a6ctvtn4TWW7fVVP', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '4JWWAPUnXPeqXPVMmsRYU2dehDPVfBdk1NkreQ26UJXZD5SmqabgYY35Updv2JcqQbfGw92CEarW8YXcLXmBB6p4', processed: 8 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '2oSLfooEwaHLTr8QqtSmSU4admTXnVuHq4zgcVxEkxSugmhqVDvojJ8VW6EHGS7WZ5Wcg4iG4dimwTKJs4r32A1S', processed: 9 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4XkZngTaqHoZFNGRVWvuTBt7xo9sMgAkpvxBdiozGAkGYxeWgY97Qhb37VwjeNkRdie54pA4jjrAEks7ybU7Cdss', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: 'i5fWpnGeXX9Y2ixYHzJL6LjGjtziLbLayBYRGNsdDv4ibFdUM1JmC5SmMwi5jibtpbfNcQWPjfY6E5byKmG9T1r', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '27Ku5x7r3Wxg5NzKKM4WL4r6wedUBHSKfWS5BNKjAJTghPhNdyaUTVDNMdzv21A4HCCVEXxFvB9j2g7SQG5j7LzV', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '2AbAkq9fumT5sJSVwgXpW1anUQqYBY6Js9iHZ6rwXTXQfbJPfVsUqxaNg7qsyT9J3ii3ceihwEkNUUXUvSLZJUNs', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '61MCzvSdg9BQpvHVHwMSRJHfTub1kFSK5oumUDKc4Mu9bFEhaGj5CAvxtPwEaEVrpjB1ZaFFyymQfQXJCyMSdVbn', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '2pW8jp7x1GtoZMX82mADvK9b5sYDYzYuLcMXkys6nc6jY6qeRfW5RdKXs1xcQXPb9zoGJuqxanBehXSQ5aM6PFCQ', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: 'GhzTpKR2Fx3yQqzXEHsebUThRXsPm1xGKzdP81gZAbUy4a6V86vsnucj9oxbErEPfpo7L5qdqHxsZH6J9ZYhNVC', processed: 13 }

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
🔍 TRANSACTION DEBUG: { signature: '38AEMgc81vdQSEqXeRHVqKJdMm99nKcqmsPXzRvcHQuUYiMiDgRFcWEEGYU55RKkqDJpfx5v8vEcvryTCwVKijqw', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '4hUZPVg1eqRLyFsXBzXUJFnm77Y4ch84CrBCyBPbxjoLuhfda5YakcNBfCQCvsZey5v9fshVcGPxMs21J3VjMpvb', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: '4w4ogg2VzoiVGLc7hTzuiRiYBS5iZ7y1qf8U8Vm5LrpD97XCRUWiwMJ9jN9uB99Ek5Rfe7Mtcn8AmYPE4Xq5QpjD', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5F3zjRYevgKB8CS6jXtfZxoaH7WAGTTgJsG4bq5z15nsMVMqyswsa9HPF81d31ntRgJSay9eTB1ZWv69y4JMebbi', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '4LoUFPgLPAU3uPfDp82kMBLRV5AzSdV7XzMShMUWVZESANGqG126RDAHVbSSSD9XAYqaaEWQygTdR9XHvhHAfWgX', processed: 5 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '3eHyemK7DAwf3zKuapMoQ6zDUtCLNeZMQhfZKGaus7SMUqqvjpw4xmoznzEN8su7KpypNQ7DfKa8W7Nyt28Emxso', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '3S34jeMgqP4Ga4E16SQL2VydtdDSLx7FVdyosuwgstKv9WaeHuecbBu1KfrMtuv2UweH5ZUWvmHVLYeN76RXTym8', processed: 16 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'Yfvv8fwg7n5FVjrAitLbrfmZmuMjomvs3UXSB7ZNb3zSR9t6JqooXroK2VAm5arzscgraDcPBqStjqgBehLS2sr', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '3S6cwgUD6D4yepJn4S9LRvmTELCqZBjCi3qoiutiqwLLdxAhccQSvbRfYhC2GVtKuaPv61uwfEPoc6RJqjwLvmvX', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '3PJrqN9LapYkddWy7zSUYdGAXY95bVTHa7pVnJZgGmCWknt74KRM6wYNWzbWCth8EyaRyEEf5JFBa7p6ApukokLD', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '3F3s5ncGKLMjnTwgxK6V3mJ4QheYBMidNoMNrYmQb4yomYKUWXLiNpz9QrPBEVN3JfEduQEXqM4CgLjRoEfYgt4f', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3A4sqd4ZL3Xu6yuJwWFjjznXUzeGTpvGVnMmZr2ong2jxNhKA6PomaQp7oRc29bPWKDKkXFLjkPcpQPGN4xPHSXq', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3AodsdypfM8t2JrCqbnxCqcLeZCGLamDuwmkA1TJYDaLQ8mZev9iF1FT9njVNxG24Dj6DcUaRn2ocoiv4ceZ3ay5', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '2aYDs4T3i375QL5NEc1PxrLJXtnJKeS8TZckJ9QwC22kNtidH8jhjzTK8CSDg3AHDTAWAticUefwSZcso2Ke9Boe', processed: 19 }
🔍 TRANSACTION DEBUG: { signature: '3Lj9pnFvUbeyFca1kjKGpeR9uVZR6yBrvHDE45SMt3Ah9Ld81vzCdBtedzpBXdKiZ6zpdmUMv7o2EmvTGLd1ttrG', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2Va8LSQpT8DM1N2H2t5dLbMvGhfcRXYtoJQfS4SFmWYE1wfakmhNy7oiBLn4Huso2wzhX7kNK86RECnRVJaBhevB', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '4FD15DfizxqKhWnKvSLECsX2PHT5RqsoiGMYRXChj4DrY8RbnzW8EUr5rq7WRJYynKs3f6oeXrd6yBNHB6x2Rdsr', processed: 20 }
🔍 TRANSACTION DEBUG: { signature: '2qghpn8WMFGsQCSjtmonr2Qds4LiV4jYHWmWwWRsrwnHibFLxo8mBueW4jPp4TtyW21oV4Zdbw7B1DtWas6iQuGC', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '4JbtMARhAod4rzfCV4xSdVJDGBSJJXWeaSBG57XxUpShE5hvBMkT8QdgVKWofKkeR97c4pSxQ6GA4FZfDGeCQsDb', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '2idDYBFqCBb8bVBnGyZh8L16TjDErHhz5XFLKs45UhZBRDR2RrJbqjRH5Xpea4qWQjNCZqgRFUWd7dZzTnoVUnWi', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '3NJSjcNswLCPL5h8t6HjEFfyRZz9DuJXCJsRdzXb4KH8yVM7E2KFpGnD9msAYveL46RaHQaJZNQYcfCUhnhJoWVc', processed: 4 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '4wmex5TG144yysKHitWd6237ozsj54cNLBnEdNVgu4dmi7eGSsD85Rutrrs8w9p7kzHxzkTf877yWuYEuAuwR7wU', processed: 11 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '2S8Fa72ozB5HUHtwaXhN5XpY8xaAE6fGbkndRixCGzr2auYKwZGZwTnmg8TJcApg4hUHHqqhMAtwhMWmDM9yewAT', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '3d27gcY8RmAPmjL93WJwhEhNERgjxKEooKWALdz2mLMMeCMNA6xdb1oyKFUv28Nue5C2HxCRADjriFCTu8p1nXWM', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '5Hgv3Y8sFwULfZ4aVqthCLcvdEwKpwUe86TBqLxH6j7Mrb6myWSzhJKihigZfEZU24L8vuayJzYYMtMnxSQLF2V9', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: '36HruKGzkBAcDmxtRSRJfnqVsk7N8pbpZ8a3Xu5BgTHWZ5gyaFuTMWM7MU7XpwZ6N1c3kWWYs5BTajKoztmmup8z', processed: 12 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '24bc7ubfXRH7i4eL7CJJfS9A2LhS4bfhkTrwoujw9DscmgoUumU7mVxxjphmoGVwHx8ZGA3QDRekmJd191RDKbau', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3pDmrsmsbJiieD9kN5UCdiPRVSUbPTS66ECeUvQbDqHFHsniMrFHKk1E3BGhpnHuXqqwuQZ1s6KFsZRiktbaVr6H', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: 'f63FzhrYonaFmQtv1qqGYTdTm9G8tJSNw4pbj5P8hLLMkSFHv3PnokDqh2b32JddhMd6MVCqHqZNFmMEjWcJ1zX', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '43nJVpeX4puujjW8GhNM5sXckCuaXggX534VKZL7wsPhBgcewnLsTXq1F6LQQbadQoYZRbANXVJx9NPs1SY3ZfJQ', processed: 13 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4hRuy8qEz9wRW1zMmj7RfLzmWHuFqKsKwVK7RTAau1vaVVKWabLD1pguxbthzqTtkgztAyZQ4p5i8qkmFNzVwnjS', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2LrQLStBQEbCx3AKv98riJHayeSUMwbbFRRqP7dCQjVC2zvXBjX8RqCpGcMCy5ZRwBLtXsDUMqmuXGu77Ggc4g8v', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '41oD68YxkffW26C5BhGSvSKXUNiGewat3DcxyQmGzCGFhfkq3vp5qfa45eGCCYagWk9QSPcM52N84pbXesaFqkgg', processed: 14 }
📊 SCAN COMPLETE: 0 candidates, 8329ms, efficiency: 3820.0%
📊 SCAN COMPLETE: 0 candidates, 2356ms, efficiency: 3940.0%
📊 SCAN COMPLETE: 0 candidates, 492ms, efficiency: 3980.0%
📊 SCAN COMPLETE: 0 candidates, 4535ms, efficiency: 4000.0%
📊 SCAN COMPLETE: 0 candidates, 7164ms, efficiency: 4000.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4166.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 35ms, efficiency: 4285.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4375.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 6ms, efficiency: 4444.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 46ms, efficiency: 4500.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 34ms, efficiency: 4545.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4583.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 9ms, efficiency: 4615.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4642.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 87ms, efficiency: 4666.7%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $159
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 24ms, efficiency: 4687.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 13ms, efficiency: 4705.9%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '1zBrjqr6VhgtwBiRh1nCEwoVdWJjHixCdgTd7AqBGrZWFPZQ7B3oQwTapVsZrpusoRWzczvGS7JxZKCoPHzfyKS',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '27726e03'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: undefined,
  current_hash: '27726e03'
}
  🔬 Parsing 6 binary instructions
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 16
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 18,2,22,3,4,5,6,23,7,8,9,10,11,12,24,1,13,0
    ⚠️ RAYDIUM: Unknown pair - assuming coin=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, pc=EY2NvjPi4E4Nh74Mqsh62bVfZncSYxk1dqVymSZ7DxLp
    ✅ RAYDIUM: pool=AZ3Vib8XRRPzsH95BeYEd37UAz8Fb2zRr7ZdufoKtWb4, primary=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, secondary=EY2NvjPi4E4Nh74Mqsh62bVfZncSYxk1dqVymSZ7DxLp
    ⚡ VALIDATION: primary=0 secondary=0.4 (51ms)
    ❌ RAYDIUM: Primary token validation failed - confidence 0 below threshold 0.3
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 6 instructions
🔍 TRANSACTION DEBUG: {
  signature: '61dsQLfiW1yh2UCXGGaZf69sYrqGCyzLHCWb4PB9Zd6m6UnQCvrLAoHz9eVDPGtprCrP8NX7JDtydjHTGDbSXb6V',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '4a80084f'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '27726e03',
  current_hash: '4a80084f'
}
  🔬 Parsing 6 binary instructions
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 16
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 18,2,22,3,4,5,6,23,7,8,9,10,11,12,24,1,13,0
    ⚠️ RAYDIUM: Unknown pair - assuming coin=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, pc=EY2NvjPi4E4Nh74Mqsh62bVfZncSYxk1dqVymSZ7DxLp
    ✅ RAYDIUM: pool=AZ3Vib8XRRPzsH95BeYEd37UAz8Fb2zRr7ZdufoKtWb4, primary=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, secondary=EY2NvjPi4E4Nh74Mqsh62bVfZncSYxk1dqVymSZ7DxLp
    ⚡ VALIDATION: primary=0 secondary=0.3 (27ms)
    ❌ RAYDIUM: Primary token validation failed - confidence 0 below threshold 0.3
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 6 instructions
🔍 TRANSACTION DEBUG: {
  signature: '5NepCytsciVQAGd3UTXBaeqy7uukiCz9z3iFaH9s8yjtnX5NWc3g9bCx3AtQauEX5RNbo2Znm7tpfjFPysPPNaik',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '2bd0eb1a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4a80084f',
  current_hash: '2bd0eb1a'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  🔄 Converting account addresses to indices for 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ
  📍 Normalized accounts: 0,35,0,4,36,33,38,42,1,36,39,43,7,41,9,8,10,34,40,12,11,15,13,14,45,2,36,37,44,23,21,22,34,40,17,20,19,16,18,46,3,36,39,43,27,41,25,26,24,34,40,29,31,28,30,32
  ⚡ UNKNOWN PROGRAM: 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ (using fallback parsing)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 51ms, efficiency: 4722.2%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4736.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4750.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 11ms, efficiency: 4761.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4772.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4782.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4791.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 26ms, efficiency: 4800.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4807.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4814.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 4821.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 35ms, efficiency: 4827.6%
📊 System Health: 7 services, 0m uptime, 17.9MB peak
🧠 Memory: 18MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 20ms, efficiency: 4833.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 6ms, efficiency: 4838.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4843.8%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '1zBrjqr6VhgtwBiRh1nCEwoVdWJjHixCdgTd7AqBGrZWFPZQ7B3oQwTapVsZrpusoRWzczvGS7JxZKCoPHzfyKS',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '27726e03'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2bd0eb1a',
  current_hash: '27726e03'
}
🔍 TRANSACTION DEBUG: {
  signature: '61dsQLfiW1yh2UCXGGaZf69sYrqGCyzLHCWb4PB9Zd6m6UnQCvrLAoHz9eVDPGtprCrP8NX7JDtydjHTGDbSXb6V',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '4a80084f'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '27726e03',
  current_hash: '4a80084f'
}
🔍 TRANSACTION DEBUG: {
  signature: '5NepCytsciVQAGd3UTXBaeqy7uukiCz9z3iFaH9s8yjtnX5NWc3g9bCx3AtQauEX5RNbo2Znm7tpfjFPysPPNaik',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '2bd0eb1a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4a80084f',
  current_hash: '2bd0eb1a'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4848.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4852.9%
warn: 🔴 Disabled endpoint due to low health: https://mainnet.helius-rpc.com (health: 0) {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:52:09.874Z"}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 13ms, efficiency: 4857.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 51ms, efficiency: 4861.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 40ms, efficiency: 4864.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4868.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4871.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 1ms, efficiency: 4875.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4878.0%
Socket error: Error: read EHOSTUNREACH
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:218:20) {
  errno: -65,
  code: 'EHOSTUNREACH',
  syscall: 'read'
}
🚨 WebSocket error: Error: read EHOSTUNREACH
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:218:20) {
  errno: -65,
  code: 'EHOSTUNREACH',
  syscall: 'read'
}
error: 🚨 Helius WebSocket error: read EHOSTUNREACH {"code":"EHOSTUNREACH","errno":-65,"service":"rpc-connection-manager","stack":"Error: read EHOSTUNREACH\n    at TLSWrap.onStreamRead (node:internal/stream_base_commons:218:20)","syscall":"read","timestamp":"2025-08-02T22:52:23.199Z"}
error: 🚨 WebSocket connection error on helius: read EHOSTUNREACH {"code":"EHOSTUNREACH","errno":-65,"service":"rpc-connection-manager","stack":"Error: read EHOSTUNREACH\n    at TLSWrap.onStreamRead (node:internal/stream_base_commons:218:20)","syscall":"read","timestamp":"2025-08-02T22:52:23.200Z"}
Reconnecting in 5000ms (attempt 1)
📡 WebSocket disconnected
warn: 📡 Helius WebSocket disconnected {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:52:23.201Z"}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 26ms, efficiency: 4881.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 13ms, efficiency: 4883.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 48ms, efficiency: 4886.4%
🧹 Cleaned up socket listeners for mainnet.helius-rpc.com:443
info: 🔄 Attempting to reconnect helius... {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:52:28.204Z"}
🧹 Cleaning up existing WebSocket client before reconnection
🧹 Cleaned up socket listeners for mainnet.helius-rpc.com:443
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
Connected to mainnet.helius-rpc.com:443
✅ Secure TLS connection established to mainnet.helius-rpc.com
   Protocol: TLSv1.2
   Cipher: ECDHE-RSA-AES128-GCM-SHA256
🔗 Production Helius WebSocket connected
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:52:28.335Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $159.03
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4888.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4891.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4893.6%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '1zBrjqr6VhgtwBiRh1nCEwoVdWJjHixCdgTd7AqBGrZWFPZQ7B3oQwTapVsZrpusoRWzczvGS7JxZKCoPHzfyKS',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '27726e03'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2bd0eb1a',
  current_hash: '27726e03'
}
🔍 TRANSACTION DEBUG: {
  signature: '61dsQLfiW1yh2UCXGGaZf69sYrqGCyzLHCWb4PB9Zd6m6UnQCvrLAoHz9eVDPGtprCrP8NX7JDtydjHTGDbSXb6V',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '4a80084f'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '27726e03',
  current_hash: '4a80084f'
}
🔍 TRANSACTION DEBUG: {
  signature: '5NepCytsciVQAGd3UTXBaeqy7uukiCz9z3iFaH9s8yjtnX5NWc3g9bCx3AtQauEX5RNbo2Znm7tpfjFPysPPNaik',
  slot: 357473098,
  blockTime: 1754175093,
  accountKeys_hash: '2bd0eb1a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4a80084f',
  current_hash: '2bd0eb1a'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4895.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 40ms, efficiency: 4898.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 31ms, efficiency: 4900.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4902.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 8ms, efficiency: 4903.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 43ms, efficiency: 4905.7%
^C[THORP] Initiating graceful shutdown...
🔍 Active LP scanning stopped
[THORP] Shutting down service: lpDetector
🔌 Shutting down Renaissance LP Creation Detector...
✅ Renaissance LP Creation Detector shutdown complete

🔌 Received SIGINT, initiating graceful shutdown...
✅ Shutdown complete
