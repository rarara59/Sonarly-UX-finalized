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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.254Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.262Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.262Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.266Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.267Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.297Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.297Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.297Z"}
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
info: 📊 Metrics server listening on port 9153 {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.300Z"}
info: 📊 Prometheus metrics: http://localhost:9153/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.300Z"}
info: 💚 Health check: http://localhost:9153/health {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.300Z"}
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
[THORP] System initialized successfully in 68ms
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
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:58:57.447Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $160.67
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 165.1ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 145.9ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 78.3ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 119.8ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 107.5ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 51.7ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 188.8ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 79.1ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
⚠️ Transaction 0: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
⚠️ Transaction 1: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
⚠️ Transaction 2: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
⚠️ Transaction 3: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
⚠️ Transaction 4: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
⚠️ Transaction 5: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
⚠️ Transaction 6: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
⚠️ Transaction 7: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
⚠️ Transaction 8: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
⚠️ Transaction 9: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 18: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 9: Failed to fetch details
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 10: Failed to fetch details
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 12: Failed to fetch details
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 13: Failed to fetch details
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 14: Failed to fetch details
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 15: Failed to fetch details
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 16: Failed to fetch details
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 17: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 9: Failed to fetch details
⚠️ Transaction 18: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 19: Failed to fetch details
⚠️ Transaction 29: Failed to fetch details
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
⚠️ Transaction 20: Failed to fetch details
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 12: Failed to fetch details
⚠️ Transaction 21: Failed to fetch details
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 13: Failed to fetch details
⚠️ Transaction 22: Failed to fetch details
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 14: Failed to fetch details
⚠️ Transaction 23: Failed to fetch details
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 15: Failed to fetch details
⚠️ Transaction 24: Failed to fetch details
⚠️ Transaction 34: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 19.0ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 16: Failed to fetch details
⚠️ Transaction 25: Failed to fetch details
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 17: Failed to fetch details
⚠️ Transaction 26: Failed to fetch details
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 9: Failed to fetch details
⚠️ Transaction 18: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 19: Failed to fetch details
⚠️ Transaction 38: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
⚠️ Transaction 29: Failed to fetch details
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 12: Failed to fetch details
⚠️ Transaction 21: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 13: Failed to fetch details
⚠️ Transaction 22: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
⚠️ Transaction 31: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 14: Failed to fetch details
⚠️ Transaction 23: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 15: Failed to fetch details
⚠️ Transaction 24: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 9: Failed to fetch details
⚠️ Transaction 16: Failed to fetch details
⚠️ Transaction 25: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 17: Failed to fetch details
⚠️ Transaction 26: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
⚠️ Transaction 35: Failed to fetch details
⚠️ Transaction 10: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 18: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
⚠️ Transaction 46: Failed to fetch details
⚠️ Transaction 36: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 19: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
⚠️ Transaction 37: Failed to fetch details
⚠️ Transaction 12: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 16686.8ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 PERFORMANCE ALERT: Pipeline took 16686.8ms (target: <10000ms)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 6: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
⚠️ Transaction 38: Failed to fetch details
⚠️ Transaction 13: Failed to fetch details
⚠️ Transaction 29: Failed to fetch details
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
⚠️ Transaction 14: Failed to fetch details
⚠️ Transaction 21: Failed to fetch details
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 15: Failed to fetch details
⚠️ Transaction 22: Failed to fetch details
⚠️ Transaction 31: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 16686.8ms, efficiency: 172.6/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 9: Failed to fetch details
⚠️ Transaction 16: Failed to fetch details
⚠️ Transaction 23: Failed to fetch details
⚠️ Transaction 32: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 17: Failed to fetch details
⚠️ Transaction 24: Failed to fetch details
⚠️ Transaction 33: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 18: Failed to fetch details
⚠️ Transaction 25: Failed to fetch details
⚠️ Transaction 34: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 19: Failed to fetch details
⚠️ Transaction 26: Failed to fetch details
⚠️ Transaction 35: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 9: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
⚠️ Transaction 36: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
⚠️ Transaction 13: Failed to fetch details
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
⚠️ Transaction 9: Failed to fetch details
⚠️ Transaction 37: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
⚠️ Transaction 14: Failed to fetch details
⚠️ Transaction 21: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
⚠️ Transaction 38: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
⚠️ Transaction 15: Failed to fetch details
⚠️ Transaction 22: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
⚠️ Transaction 29: Failed to fetch details
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 15197.0ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 PERFORMANCE ALERT: Pipeline took 15197.0ms (target: <10000ms)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 39: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
⚠️ Transaction 16: Failed to fetch details
⚠️ Transaction 23: Failed to fetch details
⚠️ Transaction 12: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 17: Failed to fetch details
⚠️ Transaction 24: Failed to fetch details
⚠️ Transaction 13: Failed to fetch details
⚠️ Transaction 12: Failed to fetch details
⚠️ Transaction 31: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 18: Failed to fetch details
⚠️ Transaction 25: Failed to fetch details
⚠️ Transaction 14: Failed to fetch details
⚠️ Transaction 13: Failed to fetch details
⚠️ Transaction 32: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 15197.0ms, efficiency: 189.5/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 19: Failed to fetch details
⚠️ Transaction 26: Failed to fetch details
⚠️ Transaction 15: Failed to fetch details
⚠️ Transaction 14: Failed to fetch details
⚠️ Transaction 33: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
⚠️ Transaction 16: Failed to fetch details
⚠️ Transaction 15: Failed to fetch details
⚠️ Transaction 34: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
⚠️ Transaction 20: Failed to fetch details
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
⚠️ Transaction 17: Failed to fetch details
⚠️ Transaction 16: Failed to fetch details
⚠️ Transaction 35: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
⚠️ Transaction 21: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
⚠️ Transaction 18: Failed to fetch details
⚠️ Transaction 17: Failed to fetch details
⚠️ Transaction 36: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
⚠️ Transaction 22: Failed to fetch details
⚠️ Transaction 29: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 19: Failed to fetch details
⚠️ Transaction 18: Failed to fetch details
⚠️ Transaction 37: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
⚠️ Transaction 23: Failed to fetch details
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 19: Failed to fetch details
⚠️ Transaction 38: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
⚠️ Transaction 24: Failed to fetch details
⚠️ Transaction 31: Failed to fetch details
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 13654.4ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 PERFORMANCE ALERT: Pipeline took 13654.4ms (target: <10000ms)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 39: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
⚠️ Transaction 25: Failed to fetch details
⚠️ Transaction 32: Failed to fetch details
⚠️ Transaction 21: Failed to fetch details
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 26: Failed to fetch details
⚠️ Transaction 33: Failed to fetch details
⚠️ Transaction 22: Failed to fetch details
⚠️ Transaction 21: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
  ❌ Failed to fetch transaction details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
⚠️ Transaction 34: Failed to fetch details
⚠️ Transaction 23: Failed to fetch details
⚠️ Transaction 22: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 13654.4ms, efficiency: 210.9/min
📊 Pipeline Health: 48.0% (critical)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
⚠️ Transaction 35: Failed to fetch details
⚠️ Transaction 24: Failed to fetch details
⚠️ Transaction 23: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
⚠️ Transaction 36: Failed to fetch details
⚠️ Transaction 25: Failed to fetch details
⚠️ Transaction 24: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
⚠️ Transaction 29: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 37: Failed to fetch details
⚠️ Transaction 26: Failed to fetch details
⚠️ Transaction 25: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 38: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
⚠️ Transaction 26: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 8.3ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
⚠️ Transaction 39: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
⚠️ Transaction 46: Failed to fetch details
⚠️ Transaction 32: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 47: Failed to fetch details
⚠️ Transaction 33: Failed to fetch details
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
⚠️ Transaction 29: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 12113.6ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 PERFORMANCE ALERT: Pipeline took 12113.6ms (target: <10000ms)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
⚠️ Transaction 34: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
⚠️ Transaction 29: Failed to fetch details
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 35: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
⚠️ Transaction 31: Failed to fetch details
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 36: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
⚠️ Transaction 32: Failed to fetch details
⚠️ Transaction 31: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 12113.6ms, efficiency: 237.7/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 37: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
⚠️ Transaction 33: Failed to fetch details
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 38: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
⚠️ Transaction 34: Failed to fetch details
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 39: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
⚠️ Transaction 35: Failed to fetch details
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 47: Failed to fetch details
⚠️ Transaction 36: Failed to fetch details
⚠️ Transaction 35: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 10471.7ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 PERFORMANCE ALERT: Pipeline took 10471.7ms (target: <10000ms)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 0: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
⚠️ Transaction 37: Failed to fetch details
⚠️ Transaction 36: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 38: Failed to fetch details
⚠️ Transaction 37: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
⚠️ Transaction 38: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 10471.7ms, efficiency: 275.0/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 8828.4ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 7: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
⚠️ Transaction 44: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 9: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 8828.4ms, efficiency: 326.2/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
⚠️ Transaction 47: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
⚠️ Transaction 10: Failed to fetch details
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 7029.7ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
⚠️ Transaction 47: Failed to fetch details
⚠️ Transaction 11: Failed to fetch details
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 5081.0ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
  ❌ Failed to fetch transaction details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 13: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 7029.7ms, efficiency: 409.7/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 14: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 5081.0ms, efficiency: 566.8/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
⚠️ Transaction 29: Failed to fetch details
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 49.8ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
⚠️ Transaction 38: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 4915.8ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
⚠️ Transaction 9: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 11: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 4915.8ms, efficiency: 585.9/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
⚠️ Transaction 29: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 38.9ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
⚠️ Transaction 38: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
⚠️ Transaction 39: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 4906.8ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
⚠️ Transaction 8: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 9: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 10: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 4906.8ms, efficiency: 586.9/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
⚠️ Transaction 11: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 29: Failed to fetch details
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 26.5ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
⚠️ Transaction 38: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 4946.5ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
⚠️ Transaction 9: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 11: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 4946.5ms, efficiency: 582.2/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 29: Failed to fetch details
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 14.2ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
⚠️ Transaction 38: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 4936.6ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
⚠️ Transaction 9: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 11: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 4936.6ms, efficiency: 583.4/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 29: Failed to fetch details
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 106.2ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
✅ Got price from CoinGecko: $160.67
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
⚠️ Transaction 38: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 5025.3ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
⚠️ Transaction 9: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 11: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 5025.3ms, efficiency: 573.1/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 38.6ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
⚠️ Transaction 29: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
⚠️ Transaction 38: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 4934.4ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
⚠️ Transaction 9: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 11: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 4934.4ms, efficiency: 583.7/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 29: Failed to fetch details
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 1.5ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
⚠️ Transaction 38: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 4924.0ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
⚠️ Transaction 9: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 11: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 4924.0ms, efficiency: 584.9/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
⚠️ Transaction 29: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 43.6ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION
⚠️ Transaction 31: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'SLWFHSeZUvSBnBSAVsQvWcJ6QrX5UUxkxct7Ya2KGjvoLw5ER5qPiBxEkBWu4HY19c34YeYwwN62bhuPLttiCdV', processed: 32 }
⚠️ Transaction 32: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'gZFTB4PgkrvSPUt8ysiHHy6V6Sh75XyEvgFEimd74ZtcLmsicStuHhCjH8Y2g1gdmbqdYvo4p72Pfm4CasQxqYu', processed: 33 }
⚠️ Transaction 33: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'ZhjQJigtknuF7MWjZ5BnVMgkcbsMQ8q9jncqb1jVrEKr49WJfigsBaNrczr6X4BNPrZcXY5C5sYBrVmu8dMxbcv', processed: 34 }
⚠️ Transaction 34: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '28wJ2CL9wpJTaMwPz3mvfxTa3sSQgagUqFFeFM5CpccDw85mEWrnX3c8xMwVcuuWcPvqmLzqHShw8UTFzV7emqkT', processed: 35 }
⚠️ Transaction 35: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MD2XiB3xZ2Lheohy5Po5uzNaKhrYEVd6ogBA6EKLSDR8ZpikwDZYymTA58uMx3kms6vtAjaLeYwXy1kjTYNAPiN', processed: 36 }
⚠️ Transaction 36: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5QQAThyfxfRmiRE3hMGU4Fcqsd3ZdJEQPn3faXVLn1iHFHfqiDpDyTaLwhc8GqxfmJGpWnHRhBLkdpoZdw4aRyXg', processed: 37 }
⚠️ Transaction 37: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5okzZaVnw7S9NSgVacVc2ZxEHH18E1k1dUETz8hCnHZkvYujaEnsvkHvJxxFpqF6Ct7x4ZURProNPyoRzBofNjD4', processed: 38 }
⚠️ Transaction 38: Failed to fetch details
  📊 Program distribution:
    - ComputeBudget_Program: 4 transactions (ComputeB...)
    - null: 1 transactions (AYnWYZVW...)
    - null: 1 transactions (King7ki4...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4bouhEbvUvDkEkEpThFEkEqHxBqLTG4WHuA5F8VLLDrfxjdMo6nxLPNskMdaej9Ji8g1E8fzHzWubZdAP9XboAp7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2722YCx55GMwaPsZxrwEpixTtQwA1cZsnqkyWVqiwqmgh7rqKHMF63W4CZFtDNCz3dhUptGo69X4yTTKipLyCLgh', processed: 39 }
⚠️ Transaction 0: Failed to fetch details
⚠️ Transaction 39: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '5AYfYU277BJ7tctUoME5tWbczZL3eKgS581vSMP44qhpnQF4Nh9pTxLZP2YE34Z8NB2HDmntpDdGnjH36dQi4cKS', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2apnrFyBoLb728B3wBLH88dzBXnh8qa6cYoLXRuGtGst3GjqGVZDoUepWwxKdc6FssBWPzepBhHvBtkCxzsEqybY', processed: 40 }
⚠️ Transaction 1: Failed to fetch details
⚠️ Transaction 40: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '64opnHDXDqx9HnAhGqLn7qiV77GiyhMBRStHYKggpQEq2q3JyMK2XHrDEJXNdeow2z78GKzm1kdymNznWaqeSrhT', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4ybuxerdH5ngHTkvvYniEYZw6NgVqFrmGVbcczQ6pjyYxc14mP6bTNEbFMCdjkpcftk2iFqREUHRC3YgwkSCPjGs', processed: 41 }
⚠️ Transaction 2: Failed to fetch details
⚠️ Transaction 41: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4Z26y51Q1zLcXU2gvyLwvK7Bp8dcoGJAZ15k7ChMm7RWQRsC4o4sRgkD5AxQez38ZV93NmcNkaSkUxh5wfBnzB1Z', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'wPa4anJfCW5TYTLo2vTvWQVQNvLkU1MB3Dyz64qLc7GFBNBtjDUaErjRt6dgY9rXZKaF7AoAxDhQqkKqEb2mcWX', processed: 42 }
⚠️ Transaction 3: Failed to fetch details
⚠️ Transaction 42: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5TFSXcyQAAgXhcTQED4d8zRuTUUDTYmcztyCt1sJSQWPpfMQ5JcqNJLNr6J4YvgP6V1TfUh774zv9mRUXYdHk8vG', processed: 43 }
⚠️ Transaction 4: Failed to fetch details
⚠️ Transaction 43: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '62PEmTXpkMo1TDkbcYa8EW2m9PaZhqErFst6kAUGanGuwgMaoXRrPRtrgXdwU5L9UtD2X8Fe9t3uQAYR3r2myztV', processed: 44 }
⚠️ Transaction 5: Failed to fetch details
⚠️ Transaction 44: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '24QvZXHHjPfapYwaFEWr9d3FFdQGSgdLSLGciat2Edic11giiRWSxM9ruwoxG5T9orCssz6GToqYLW8BAdGdY9kt', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2bssUfxUcQevdjuJnV6NVnV4quBciSUvQZAxhvcWaM75MW7FNFfSnuwZhb51XjprKinybYE7fX2CnPYCWp845Nf2', processed: 45 }
⚠️ Transaction 6: Failed to fetch details
⚠️ Transaction 45: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2PxYfogXyPz3yYT4WReuHChejcoEZtZqePkdP2GAB2TBaLwiEqDDbPJhRYFmnng9RTBjHCM7cmbjjQPWX2WPugfE', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: 'fCWgNivmoG57rtaNVdbVsiowby7QETEuQcyHAwUqd1m1GbLeka51VVib7YhGb55YV6fN2yWZRkvzYAsQouGH5M8', processed: 46 }
⚠️ Transaction 7: Failed to fetch details
⚠️ Transaction 46: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2Tr1YBjXvwJUXb7cfoAXCQcRGu99fDoKMv7KUJ2xM8BvwUWQv9bjmLHde7S5y9GdMtDmXL3nhZmoacWh5YDvEddx', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3BRPTrsP3eyuHDFdw44jX7vCmsCi1AXkYp7Yt56iVhX16Qvoycq84iPWcSYiVkNV8N7AxK8J5jRhVngZYkQT33rS', processed: 47 }
⚠️ Transaction 8: Failed to fetch details
⚠️ Transaction 47: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4cXND7BiRm4WMEo9dm3zR3kwx6WdPUxbdJjt9zMEVb5Use6DzyvNssvBh4DB3zTesRYeMC4WebrUwkpnbVfC4Xkp', processed: 9 }
📊 PIPELINE SUMMARY:
  ⏱️ Total time: 4917.0ms
  📊 Transactions processed: 48
  🎯 Candidates generated: 0
  📈 Routing breakdown:
    - raydium: 0 (0.0%)
    - pumpfun: 0 (0.0%)
    - orca: 0 (0.0%)
    - unknown: 48 (100.0%)
🚨 CRITICAL ALERT: Found 20 Raydium transactions but ZERO routed to parser!
🚨 DEBUGGING RAYDIUM ROUTING FAILURE
🔍 RAYDIUM SAMPLE 1: 4bouhEbv...
⚠️ Transaction 9: Failed to fetch details
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 2: 5AYfYU27...
🔍 TRANSACTION DEBUG: { signature: '3Q59kHkk5ovBL4zZrAbDNodi7a8GW8jRzRzWFzZvh49DdrXxzWfEhEbxzVCYkrdnAW9yDMzjNLxioPEi8BUYGCL1', processed: 10 }
  ❌ Failed to fetch transaction details
🔍 RAYDIUM SAMPLE 3: 64opnHDX...
⚠️ Transaction 10: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3ntVZaTxFtK8XE5xaNtnTXTHmrdfLEJFMbKfxTaF9iNcuXVp1QUSiVf4x5XCaQZheSCXEuboseBjyDJer6fZwu4Q', processed: 11 }
  ❌ Failed to fetch transaction details
⚠️ Transaction 11: Failed to fetch details
📊 SCAN COMPLETE: 0 candidates, 4917.0ms, efficiency: 585.7/min
📊 Pipeline Health: 48.0% (critical)
🔍 TRANSACTION DEBUG: { signature: '2pqg4Wb3PeoWhvmsWRBXs5NbNEEuVNn4BKTxCtWW5gjw4VpdL7o3d9nZawey29mJ3QDQCbGiuVjufbWguYzS4Zcq', processed: 12 }
⚠️ Transaction 12: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2w9CDRUsNTHseYNHB2pC1RjwiUu7QYA8TwHBBqdSs8x8kLCGDSTHC3Jcquu21Qb64PYvLvw3d2V9qZJh4h7TzByp', processed: 13 }
⚠️ Transaction 13: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4aKBCkkruSPy3CDRhZxVRZs8d6edXzzFChCfZ5MveYzVGuDemTDdRTJrp4mssfnpUDubBjQQFno8EdmDaV4XSWfm', processed: 14 }
⚠️ Transaction 14: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '512t3eRaAprbWjCLPzLUmLPkaMoNuJ8Tt2tZ7MiR1HtwGUSFB8pKoJLSzUQQha8PkTWQzWywQNUF4Nd1vCPNS7Nw', processed: 15 }
⚠️ Transaction 15: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '8wgTU9shtQW52yrx9YUViHL4F4i5WCgEmXY76eEwFXfDTPSim9YQG2DF1q5CzFhTGABoT4jC66yH3jfWYRJ8teS', processed: 16 }
⚠️ Transaction 16: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4tW9G4LbHim4TomCmCuptuhxRNAk75CAMMo2zJhW9MyrT5wZvq6ADEtqEVABkjeiD3wb5JErd4LSEK6PaSg2ioJX', processed: 17 }
⚠️ Transaction 17: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4CH83NihBipza37DgYMFj1ZzYzdnErKTah9F4Ksj3AfZ4mvrZuK7K9hDvcAXAn6tNqVpzz37JdXJ3UhAe9vJYijz', processed: 18 }
⚠️ Transaction 18: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '2VS19E84ZSoqcLG6kGYGBgg3M6xKKpgxMjL2MAg2G96s4XhtHn8idXGE3ZiPTyh2KQpc2v3QfTDwbf14AYbdD2QA', processed: 19 }
⚠️ Transaction 19: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4gJKivcY3zHa4p521SABmYxubqXef7xdHAKPFNgNnAL9J9v3ByC3a4sTEc6W2jfCb8autzu9Wzx5bTqXJGPbMbqV', processed: 20 }
⚠️ Transaction 20: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MhsYPagvH3oSmCrk2SMi4srHKGeJSoM482eeLiJMDtNFntcqFVMBGAzwJ78jaP1tbPqoR9L1SZRgG3hREgdGXaR', processed: 21 }
⚠️ Transaction 21: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3VV4GpjeKmToFQpmK5Md5MmAcWweib3KHJfrzEQHgH1gXRX8aJvkamv5qrjHW2RPcqdHm6zAQ6fiV1iQbx77JsoC', processed: 22 }
⚠️ Transaction 22: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4YhKQ7Z4eFU2wcqtk6pW81UuWFyjGZNf1Yk4yx5Zni7kpm1yJpebpqbHyizKPJntBeGrQpyWYU24mYA4Vbwervwd', processed: 23 }
⚠️ Transaction 23: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'MvegSLSt426aaebW6Ui8EiypDLtAr1VN8uJLDpj5eExAUGXWX8gDdoSFGaFnC6PJHDHFSz3bj4T7V1s8eiQdBn6', processed: 24 }
⚠️ Transaction 24: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3RqMcZkJ4j459wQFKyEpNSxYMvxewzjwgMsVLvVJLTNDtAVKQoe1HyCb7DDVZ2HeqrLFmrr4VJb6MVuBvN9MQvmA', processed: 25 }
⚠️ Transaction 25: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '45RiSd2BEEsEdN9qE3wYzaKaiRZqy2mXTF2mCggPwtpCYegnJNy7doqFpnNSV3NiwqvZbqyzdaMPEEC6CBtkkVSX', processed: 26 }
⚠️ Transaction 26: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: 'BbtvUcY5ARUcRN6h71Qo5NEfXJDU1c7iV841TRwX8ot6pLopva98gLxQ3gi7NyvUo6Pi8UCpSzqrrsR1vMM5qjk', processed: 27 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeB...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: '4GLzhW2FcrZCf14c7VNaf24VG6Fw8D8sNhv4QPXcQ6jPoRkC3jRyq8qMxmKLtoEWkuv3BJtGkKny1sNUFp7UiKkk', processed: 28 }
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis
🔍 TRANSACTION DEBUG: { signature: 'aCpujNfRYdZrmJzuRDbBhhjWeWxjbNU3NT9BqpUqewiThrWXyAMm6cmReiCHy87x6sJXNafe6vxPjoEr9rzM5tQ', processed: 29 }
⚠️ Transaction 29: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '3uwwdtMwaZmiBrnueCr5GFopSdZgkQMgKxbFhZCtXrjWeqHjmxpPUrriumPB2RMceBMrqeoCpSQ4ghPevunGn3AQ', processed: 30 }
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
⚠️ Transaction 30: Failed to fetch details
🔍 TRANSACTION DEBUG: { signature: '4JhxSQGC8uZLdwn2TGMx5gWomiRitj3BAGka8Dz5vQBEKhnrQd3Fqqo3BhpLQYL4ptTh7dNkrgtWS5FHbSP6GYXu', processed: 31 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 39.4ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 6/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 48 unique, 2 duplicates removed
  ⚠️ Duplicate signatures: 3BsfKCAWQW1QYiHzg8az1H5f86SRcy1c5gUVxirgFQz7dgQ8UH1w1tUJtbudu9i1VcikdEU7jdiRuqjBcy353wrA, qvscmz5nzKF8tE9pr1rEZ88gnSoPovU4AxEgmiyCYycqS2KdqpNNhMz4MNdgv4LgCch3NqXpKgpWGsVFtVMowfh
🔍 STAGE 4: PROGRAM ID EXTRACTION