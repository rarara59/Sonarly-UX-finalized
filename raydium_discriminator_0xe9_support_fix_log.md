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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.069Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.071Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.071Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.074Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.075Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.095Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.095Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.095Z"}
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
info: 📊 Metrics server listening on port 9104 {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.097Z"}
info: 📊 Prometheus metrics: http://localhost:9104/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.097Z"}
info: 💚 Health check: http://localhost:9104/health {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.097Z"}
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
[THORP] System initialized successfully in 49ms
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
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-03T00:06:52.236Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.6
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3vPFN4WbLm2eSaP1VvhLaiRLJK8g9wTuiMySmsgwE2otascnuq8xZtsdmVJGK68MpX32UDLmpphgSjf4oMiz7ihN', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '65SEXy5pnZ8BSoVL9LYKViWUiEgKLaDR22zmhrymfchpPa2h61bhboio8sXY7r7mGBKdNHpUgnPsbY3PxKNGCEZe', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '38yZFss9fvWdwo2E76pg6WS8JgrzxxNKAngHEG4uoLqzyEqJxRYecqFv8SJY6SQNZZCr5qXu97d2WESBReP5ouFN', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2EtsBPBgVr2US35fA5nHAdjLgHc9oWJKXTEr9FmdVkY57QuJUASB4zydarByB6Cq5pycqD3BTFeyzAh41amPYkzS', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '3c37yz4x3CxNAjUZgXA1J6krkDa8X2tz4yGy9JNVJGvqxwKqRvjbWKNQj93xU3Va84LvmUegAQoMHdR3FMsxKtiS', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5VesvryivuwUvVaV133vRaX3R8wnraCD6yNX4tGKDnMx4QPJNJEptHdU8mNUtQ4Fo6L3oCT6U6hw7N8a3LfCmVgt', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '46q4xFfDW8QaXw445LAqhYVCeQ5qcHpgjAF6TJUZ1ki8dr6hzQw4mdMhpV27t9rhTn75juHhhCEWzcBkKVRC2Y4b', processed: 6 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '5CixXs69kTThEAe1BxVgc2xYAHHjuNS9s81ZVfBWB9umQFm93VveREJnA9QmcoMnMLYFy3ffnZKzW73J1YBmCuw8', processed: 7 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4kuv8WbWcc9RTNFC7bBFcYwBYyQa95ahh7C4KWA1XxDox1xJ9ajmFapqCoFqrQbayefFDvovKL4xobsgndS1CRuB', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '4MMrrE5dZjtTUoCZ8f1CyhMNjzgXP4sFS2TsJA3vu7ZfoFfkVYvH72jbjmPfp7HJJNNPYuxxXtFBMsVoni2fQNHS', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '2fVXh4gT2cJmerVXU5dfogSGoWbQ3yiKSFn1kePuAfw3vPTBTWwoPHp7xxfRRJ2kGm99ciDwzhwsyjn6ZAZTM7Ym', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '3U11LbvSTyPfwrZF8uHZCgDWMoGUZCFT2D5SBVMKEuwTkyMNMKvwQvXaNBP8X9r2wurw1RhzwH14uaBw4grQeMr1', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3GMexf7Kf4eAa2vXTAT6DL6omQvUBdWyQwQg8nEDW34hoh7d74FKNzjzQet7JEDFBdW6WAxFkpQEzM3WXTLJQe8u', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3CpGuyUqeEZXYkTkHNmgDSMSDEiYjpHPFc9EQJMUWdEtkNa58UEE1DvuKFWPqnjQj7KhR7xrC6ijNvX6uagcPAVj', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '2EFWFj23z1eHcj5AsZiuqw5FB7JEUws3TLpaJUvyUZ5jx92ieTgx47EP5VYCJ71dLrzAxvwXjBGc5XVYJ7AK2crU', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'KyZuaFvesagGMiE3mHszwbXLpYq3LGhMgrwYqZgvmnWBVzcvaANatFkw9fxx3cXgxCjjMysdw1bi2kpT4Xn6mWq', processed: 11 }

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
🔍 TRANSACTION DEBUG: { signature: '5Mqf9ouqDvm7mq3pRu3HixUCEkrG2d781jv7HLsDBezP1J1vgRL35MTQk9HiWBgWCCaPYvdBto5A5VLj3dqtamsj', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '51eqKk64f5UJx8infHebabqHBm2Sw59C5a1rcmnDm7tWzzWdYf8BC6ahsKYLZaYB4wcYpEYdJzFhRRLVcppcD6CZ', processed: 12 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: 'M8va5qXf3NnnBBNzt9vQgMUdEpyxeJrSMGHkg77Q5iS2hUh9JhLMddTwxXPcbw9NajxCYDPFztmz9trN8AwJgjX', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '3nhcWzPvHxNATKB977BE2TdxjbVeBf5F5kba9hwJujcWKjaPrN36uhBzNPcPZQWSEkaT2gXGdVSRq77LGTCCVUZH', processed: 5 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '5KCDDTAj3LSdqMQRTxzrQJabAbByTPTzqT116LVUjgS8BBJW9DR2Qy8bxPV4BwBt8Gng2QeqJqsXfEbpbunFJJmB', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5oR1NUPbLb7FaXznpBRpG9a7cXY88AkEQHFhxzoGYttH7v8LevqMmv3tVHRx7cDMBxvx77e6m12213WCV9PrQtBv', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: '47ScmnX8Mh72YqJSu74QUhGD6DB3HLSJP8T7y75cCqSGnfySvmx8J6XyrKQ5EohG2BdLbzQFwWnNgXcv2Y6FSVqG', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '4SaRE7cuSVNWJQ92o8wD4LkQbirEK5H2SS7n4ti1ycZkTNU7WWQNZy64aZgWcun4BVPbcDVfHaSzP23VjXFL1Z5w', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '5UvatgKKDsX7KUARxKTPqsMn6eSeCNmCm8cUAxo7D8qdNJoYXPEpaMaQfMcHC3MY4xBZiYMU2Adv3FzX9HYo94r9', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '5LNsLU4QAb8TRSWJmWTPT4yNPXkN84nasaeevsdN7pBx2rrg3GQ9Hfo8F9f4yU58M444J3F5hQvRrKA3m8WTFXAN', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: 'PQhYrmeiXd9BUNWCBC7CJEfMGSqK4ZV7jQ6nFE2LPkermF9ZKYV1aYMieXdnvzUTzWHybu4bLmfo8M1Rp8xemec', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '1ZDsrvbpWucZd2yT4L14mLnD2YdN6GEKCd8mVcxHMYxh2VJM5P4kH4ttJbCMs1wrLJiFCDXehRTTw6PHrucxJK2', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '65HG2eo2RyadfnP368x81eQKscdQ1D6HzgyeSf3bAmMmdL6v63pjHTadSaoKbwQhfQVRAPLdZySuKGYsZwfAqDv1', processed: 8 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: 'ebmxtu3L61VWd3RdjcHawYHiSF4UZz4z91o46UZE7eNCW8p9wnW1xArDFhqGKkihLsN6eP1hDu9GJ6W5q4Vuv91', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '4knaSj3HZJZUv7KhM1XQusuX2KzjFSf2cZF483oKyFjRvAXaZnvzeVNsScQuPoSHXactXLaMSzHn38KyBkBByEkL', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2sxbNmg5FSWqpuCtLabv4sgWbLvyjFZs1UHc8a1FQkC8zs9vSEz4FxPj5yAJw6DG6BbmiHLoSn4Wrkx3vk9ej9yW', processed: 17 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4YN1jC9hoTrWa8PesWEyK1bejCePtqy1zoEEU7ag5AFwVfxoDnxV8ZNK9UmEfTGkaaKxxr4UuYWFLoa7RVVrhn53', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: 'fWU48H5dcXNHgbqHnXS2RYa9u9JggMmP3XkuJou4uKA7JBQz94Zu7kpGqr6Jtv7gYShNB8rRmQuwLkArEzXVKDe', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: 'f9VuSAkRhoXJ9JCXk2nQFhQKnkeicoYxemb9DxMbjk4fA66CrDa2Pv72VZvzwpYbaHSWU6Gn2pA2G437PCNKgTj', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '3qR5NgKGx3x5d3Ays45a1wzr9FsMEj5QbrxatLPChe4BeMcLNNe9GLRybtBudhsW9kpN8cnpnmdLdCoeU6y9WtPH', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '4vzEjeBGmD2hftH1CNGjT52T9yCBL8Pvzn9QJnCDLxqHdw86vrbwJT8NbX7FxoYy5Qq5D9Pdoe69eY2wMCFRu6Q6', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2dMSN6Ft3sojQJFyZ8NZnmouf5N785YBFSwYrh92QsJ6NvMk4XdRfiAFzXrh7F94a77ysVP161oVbwMKaH5LtEv7', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '39aauRhMFPtHdLy2y9ELgwk6KhEytYLUKs4bLPhVg5Zi5Jzp8rNtFoLcmbffi8Byu58AdSh5T6qj7xK47MywJHk2', processed: 5 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '42gFV65Nsc8UVEjDZWMFW7E2c8LgMVoPhsPEBgpnMe1NBDMqHKsLERMzhFWVeZZ6gRjoktPRfwfcRXhA6W7mTFtj', processed: 19 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '6B8TYNo3HbZApFMyrLTEr9dmjZWLDJUqZGM9FazcixCyW2eP66AQrmTVYHihLTzu9S3L3G3FJM6ekKhogRpp6wP', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '4FeGwdmQzCsMSXFqWWtrPkt9JqqDoNHvenixD1Uw9TR5QwVjCbZsERmesR4z9byH1GQJqXhwRhhpFcpsemzYxHEt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '4SGZWvZyFmYq39ePXXCXVRDF6QvM3M5yaa95D5wM7yCmUMTfYWKTKUtbxuD7q1eQvhPKREFnJxBpgBZGAkFonWh2', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '2phHkgsncyauF4kwAVfrsMXY8e68S4xvBeXtUkxF2KbqhnCEVxsBZhzWx36KzTuZVcH9NYabmhjYDjaqCesc2yX2', processed: 20 }
🔍 TRANSACTION DEBUG: { signature: '3sraV1jP9WLrYBn99pXUX5iTQyGVgV1PBFPBg8f2pNdf8xYB9AKg2naSZpmvDXUqMU4Gvoz3GvaqXhurkmF7To9G', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '5Ev4aJvuw9Xboaq4ZS8QNmtDt9LeuFPncLodN7fjKEkRgCGAn1i9DjiL2zThwT2ntLKrPTUg5UsDTeTWhJgRa9Gv', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'h9Wu2BVku9PZm6UKMYHo5zG7KB3vDCZfjLgVQihoKczbwaRDrykB3GvnUkdrooj26JAN7UUPqcjJv5CUUiwHKyF', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '2E2QPquRrjRusx9cc1E61y7NotAsoNG8pwRPqK8WAPLhyXL7QgrEp3JKAWpBs4iQhLv6FxijL29F36YN1n8RZGX3', processed: 13 }
📊 SCAN COMPLETE: 0 candidates, 2989ms, efficiency: 3660.0%
📊 SCAN COMPLETE: 0 candidates, 5093ms, efficiency: 3780.0%
📊 SCAN COMPLETE: 0 candidates, 9239ms, efficiency: 3800.0%
📊 SCAN COMPLETE: 0 candidates, 7295ms, efficiency: 3800.0%
📊 SCAN COMPLETE: 0 candidates, 1303ms, efficiency: 3840.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4000.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4114.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4200.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4266.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4320.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4363.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 15ms, efficiency: 4400.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4430.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4457.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 191ms, efficiency: 4480.0%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.65
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4500.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4517.6%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '4issch2EAVX3Z6oPysjcfppqfYBSz9WZ3x22rcXu4z1DCkSGcr2vGssFNTYDi3RZbiQNEBS5WUaaJhZ6aJzAT8zW',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '18588006'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: undefined,
  current_hash: '18588006'
}
  🔬 Parsing 3 binary instructions
  🔄 Converting account addresses to indices for routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS
  📍 Normalized accounts: 11,12,13,14,0,1,2,15,2,3,4,5,9,5,5,5,6,7,5,5,5,5,5,5
  ⚡ UNKNOWN PROGRAM: routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS, discriminator=d75e5a9ada5abc06, dataLen=17, accounts=24
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS (0.5ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dd4f33c395d5a15b, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.3ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=ComputeBudget111111111111111111111111111111, discriminator=18cbeb74, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.6ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: {
  signature: '3m8PrdcsmGPGA6p2DmHY21s268aijhyc5NjcPGDF1iLSHEu92VAuxM8BFj3y59KFFea23xAKfxC13mY9nUcQN2v3',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '42cff624'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '18588006',
  current_hash: '42cff624'
}
  🔬 Parsing 7 binary instructions
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 13
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=242de0ca, dataLen=4, accounts=1
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dd6c987f07cc52e2, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 10,2,15,2,2,3,4,2,2,2,2,2,2,2,2,5,1,0
    🔍 BINARY ANALYSIS [3]: program=675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8, discriminator=e8, dataLen=17, accounts=18
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  dex: 'Raydium',
  category: 'amm',
  memeRelevant: true,
  priority: 'high'
}
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Expected accounts: ≥16 for LP creation
      - Instruction type: initialize
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS:
      🔍 RAYDIUM ACCOUNT EXTRACTION:
        - Discriminator: 0xe8
        - Total accounts: 18
        - AccountKeys length: 16
        - Layout: INITIALIZE
        - Expected accounts: ≥18
        - Coin mint index: 2 (position 7)
        - PC mint index: 2 (position 8)
        - AMM ID index: 2 (position 3)
        - Coin mint: 58fzJMbX5PatnfJPqWWsqkVFPRKptkbb5r2vCw4Qq3z9
        - PC mint: 58fzJMbX5PatnfJPqWWsqkVFPRKptkbb5r2vCw4Qq3z9
        - AMM ID: 58fzJMbX5PatnfJPqWWsqkVFPRKptkbb5r2vCw4Qq3z9
        ❌ Duplicate addresses detected - invalid account structure (0.3ms)
    ❌ RAYDIUM: Token extraction failed (1.5ms)
    ❌ NO CANDIDATE: Raydium analysis returned null (3.4ms)
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 7 instructions
🔍 TRANSACTION DEBUG: {
  signature: 'wa7nroLBWbyZdA4CsCZqA5vTiSF6NpYqKtZrvUdrLAFmp98ZKkaqGPPZNhvh1UREZHNtrRM8kNHoE4d8enPqePM',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '68b650f5'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '42cff624',
  current_hash: '68b650f5'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1b1af081, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.3ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dd5660a5aab32415, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.4ms)
  🔄 Converting account addresses to indices for FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ
  📍 Normalized accounts: 0,9,10,11,11,49,12,13,50,51,52,53,14,1,15,16,17,18,19,20,21,22,23,24,2,25,26,27,28,54,29,30,31,32,3,4,33,5,34,35,36,37,54,38,39,40,41,42,6,43,44,45,46,47,48
  ⚡ UNKNOWN PROGRAM: FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ, discriminator=e0071d340c8fa941, dataLen=87, accounts=55
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ (0.5ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 19ms, efficiency: 4533.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 7ms, efficiency: 4547.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 4560.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4571.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4581.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 9ms, efficiency: 4591.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4600.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 24ms, efficiency: 4608.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 11ms, efficiency: 4615.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 48ms, efficiency: 4622.2%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4628.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 23ms, efficiency: 4634.5%
📊 System Health: 7 services, 0m uptime, 18.4MB peak
🧠 Memory: 18MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 13ms, efficiency: 4640.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 51ms, efficiency: 4645.2%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4650.0%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '4issch2EAVX3Z6oPysjcfppqfYBSz9WZ3x22rcXu4z1DCkSGcr2vGssFNTYDi3RZbiQNEBS5WUaaJhZ6aJzAT8zW',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '18588006'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '68b650f5',
  current_hash: '18588006'
}
🔍 TRANSACTION DEBUG: {
  signature: '3m8PrdcsmGPGA6p2DmHY21s268aijhyc5NjcPGDF1iLSHEu92VAuxM8BFj3y59KFFea23xAKfxC13mY9nUcQN2v3',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '42cff624'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '18588006',
  current_hash: '42cff624'
}
🔍 TRANSACTION DEBUG: {
  signature: 'wa7nroLBWbyZdA4CsCZqA5vTiSF6NpYqKtZrvUdrLAFmp98ZKkaqGPPZNhvh1UREZHNtrRM8kNHoE4d8enPqePM',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '68b650f5'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '42cff624',
  current_hash: '68b650f5'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 32ms, efficiency: 4654.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4658.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 17ms, efficiency: 4662.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4666.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 4670.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 32ms, efficiency: 4673.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 22ms, efficiency: 4676.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 10ms, efficiency: 4680.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4685.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4688.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4690.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4693.3%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.67
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4695.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 28ms, efficiency: 4697.9%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '4issch2EAVX3Z6oPysjcfppqfYBSz9WZ3x22rcXu4z1DCkSGcr2vGssFNTYDi3RZbiQNEBS5WUaaJhZ6aJzAT8zW',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '18588006'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '68b650f5',
  current_hash: '18588006'
}
🔍 TRANSACTION DEBUG: {
  signature: '3m8PrdcsmGPGA6p2DmHY21s268aijhyc5NjcPGDF1iLSHEu92VAuxM8BFj3y59KFFea23xAKfxC13mY9nUcQN2v3',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '42cff624'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '18588006',
  current_hash: '42cff624'
}
🔍 TRANSACTION DEBUG: {
  signature: 'wa7nroLBWbyZdA4CsCZqA5vTiSF6NpYqKtZrvUdrLAFmp98ZKkaqGPPZNhvh1UREZHNtrRM8kNHoE4d8enPqePM',
  slot: 357484587,
  blockTime: 1754179646,
  accountKeys_hash: '68b650f5'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '42cff624',
  current_hash: '68b650f5'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4700.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 1ms, efficiency: 4702.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 41ms, efficiency: 4704.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 32ms, efficiency: 4705.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 19ms, efficiency: 4707.7%
^C[THORP] Initiating graceful shutdown...
🔍 Active LP scanning stopped
[THORP] Shutting down service: lpDetector
🔌 Shutting down Renaissance LP Creation Detector...
✅ Renaissance LP Creation Detector shutdown complete

🔌 Received SIGINT, initiating graceful shutdown...
✅ Shutdown complete
