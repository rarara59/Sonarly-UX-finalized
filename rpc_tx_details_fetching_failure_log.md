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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.870Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.871Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.871Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.875Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.875Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.896Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.897Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.897Z"}
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
info: 📊 Metrics server listening on port 9189 {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.899Z"}
info: 📊 Prometheus metrics: http://localhost:9189/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.899Z"}
info: 💚 Health check: http://localhost:9189/health {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:10.899Z"}
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
✅ Transaction fetching system initialized with caching and failover
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
[THORP] System initialized successfully in 52ms
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
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-03T03:27:11.028Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $160.62
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 897.2ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 18/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 9/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 50 unique, 0 duplicates removed
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 Fetching transaction: nsoxQkmX... (attempt 1/4)
✅ Transaction fetched: nsoxQkmX... (116.8ms)
🔍 Fetching transaction: 63MWfXym... (attempt 1/4)
✅ Transaction fetched: 63MWfXym... (70.8ms)
🔍 Fetching transaction: 5uRmrn9s... (attempt 1/4)
✅ Transaction fetched: 5uRmrn9s... (116.2ms)
🔍 Fetching transaction: 5WiGkXpM... (attempt 1/4)
✅ Transaction fetched: 5WiGkXpM... (91.7ms)
🔍 Fetching transaction: 2EMfZw6g... (attempt 1/4)
✅ Transaction fetched: 2EMfZw6g... (101.9ms)
🔍 Fetching transaction: 38bAzYC3... (attempt 1/4)
✅ Transaction fetched: 38bAzYC3... (118.5ms)
🔍 Fetching transaction: 283ABxJW... (attempt 1/4)
✅ Transaction fetched: 283ABxJW... (105.6ms)
🔍 Fetching transaction: 4CVHjzDj... (attempt 1/4)
✅ Transaction fetched: 4CVHjzDj... (74.3ms)
🔍 Fetching transaction: 41Dd1Ckz... (attempt 1/4)
✅ Transaction fetched: 41Dd1Ckz... (109.2ms)
🔍 Fetching transaction: 4wXXPGAq... (attempt 1/4)
✅ Transaction fetched: 4wXXPGAq... (109.2ms)
🔍 Fetching transaction: 4a6cbnnd... (attempt 1/4)
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
✅ Transaction fetched: 4a6cbnnd... (104.4ms)
🔍 Fetching transaction: 5YjSoQn8... (attempt 1/4)
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 46.2ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 18/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 9/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 50 unique, 0 duplicates removed
🔍 STAGE 4: PROGRAM ID EXTRACTION
🎯 Cache hit: nsoxQkmX... (0.0ms)
🎯 Cache hit: 63MWfXym... (0.0ms)
🎯 Cache hit: 5uRmrn9s... (0.0ms)
🎯 Cache hit: 5WiGkXpM... (0.0ms)
🎯 Cache hit: 2EMfZw6g... (0.0ms)
🎯 Cache hit: 38bAzYC3... (0.0ms)
🎯 Cache hit: 283ABxJW... (0.0ms)
🎯 Cache hit: 4CVHjzDj... (0.0ms)
🎯 Cache hit: 41Dd1Ckz... (0.0ms)
🎯 Cache hit: 4wXXPGAq... (0.0ms)
🎯 Cache hit: 4a6cbnnd... (0.0ms)
✅ Transaction fetched: 5YjSoQn8... (93.6ms)
🔍 Fetching transaction: 5YjSoQn8... (attempt 1/4)
🔍 Fetching transaction: 5cB9yady... (attempt 1/4)
✅ Transaction fetched: 5YjSoQn8... (101.2ms)
✅ Transaction fetched: 5cB9yady... (88.3ms)
🔍 Fetching transaction: 5cB9yady... (attempt 1/4)
🔍 Fetching transaction: xoGVaj9V... (attempt 1/4)
✅ Transaction fetched: 5cB9yady... (103.0ms)
✅ Transaction fetched: xoGVaj9V... (151.0ms)
🔍 Fetching transaction: xoGVaj9V... (attempt 1/4)
🔍 Fetching transaction: 2euvoFS3... (attempt 1/4)
✅ Transaction fetched: xoGVaj9V... (152.2ms)
✅ Transaction fetched: 2euvoFS3... (120.9ms)
🔍 Fetching transaction: 2euvoFS3... (attempt 1/4)
🔍 Fetching transaction: 3LpZhxtS... (attempt 1/4)
✅ Transaction fetched: 2euvoFS3... (101.4ms)
✅ Transaction fetched: 3LpZhxtS... (91.4ms)
🔍 Fetching transaction: 3LpZhxtS... (attempt 1/4)
🔍 Fetching transaction: 4uPihdMy... (attempt 1/4)
✅ Transaction fetched: 3LpZhxtS... (101.1ms)
✅ Transaction fetched: 4uPihdMy... (110.3ms)
🔍 Fetching transaction: 4uPihdMy... (attempt 1/4)
🔍 Fetching transaction: 4Hx6f6py... (attempt 1/4)
✅ Transaction fetched: 4uPihdMy... (102.7ms)
✅ Transaction fetched: 4Hx6f6py... (93.3ms)
🔍 Fetching transaction: 4Hx6f6py... (attempt 1/4)
🔍 Fetching transaction: 2JbEuNhV... (attempt 1/4)
✅ Transaction fetched: 4Hx6f6py... (100.7ms)
✅ Transaction fetched: 2JbEuNhV... (102.5ms)
🔍 Fetching transaction: 2JbEuNhV... (attempt 1/4)
🔍 Fetching transaction: 3Xvp1eHS... (attempt 1/4)
✅ Transaction fetched: 2JbEuNhV... (101.3ms)
✅ Transaction fetched: 3Xvp1eHS... (100.1ms)
🔍 Fetching transaction: 3Xvp1eHS... (attempt 1/4)
🔍 Fetching transaction: HFo6qUit... (attempt 1/4)

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
✅ Transaction fetched: 3Xvp1eHS... (101.6ms)
✅ Transaction fetched: HFo6qUit... (101.7ms)
🔍 Fetching transaction: HFo6qUit... (attempt 1/4)
🔍 Fetching transaction: 4eJWsMvr... (attempt 1/4)
✅ Transaction fetched: HFo6qUit... (100.8ms)
✅ Transaction fetched: 4eJWsMvr... (103.2ms)
🔍 Fetching transaction: 4eJWsMvr... (attempt 1/4)
🔍 Fetching transaction: 48YRD3mR... (attempt 1/4)
✅ Transaction fetched: 4eJWsMvr... (102.6ms)
✅ Transaction fetched: 48YRD3mR... (97.4ms)
🔍 Fetching transaction: 48YRD3mR... (attempt 1/4)
🔍 Fetching transaction: 3inaSo3J... (attempt 1/4)
✅ Transaction fetched: 48YRD3mR... (102.0ms)
✅ Transaction fetched: 3inaSo3J... (116.3ms)
🔍 Fetching transaction: 3inaSo3J... (attempt 1/4)
🔍 Fetching transaction: 28LtHoeW... (attempt 1/4)
✅ Transaction fetched: 3inaSo3J... (101.0ms)
✅ Transaction fetched: 28LtHoeW... (94.5ms)
🔍 Fetching transaction: 28LtHoeW... (attempt 1/4)
🔍 Fetching transaction: W7Hfkgnz... (attempt 1/4)
✅ Transaction fetched: 28LtHoeW... (101.6ms)
✅ Transaction fetched: W7Hfkgnz... (90.2ms)
🔍 Fetching transaction: W7Hfkgnz... (attempt 1/4)
🔍 Fetching transaction: 24phv9Us... (attempt 1/4)
✅ Transaction fetched: W7Hfkgnz... (103.9ms)
✅ Transaction fetched: 24phv9Us... (118.5ms)
🔍 Fetching transaction: 24phv9Us... (attempt 1/4)
🔍 Fetching transaction: 4dT14G7D... (attempt 1/4)
✅ Transaction fetched: 24phv9Us... (101.5ms)
✅ Transaction fetched: 4dT14G7D... (89.6ms)
🔍 Fetching transaction: 4dT14G7D... (attempt 1/4)
🔍 Fetching transaction: 4JbKoNG2... (attempt 1/4)
✅ Transaction fetched: 4dT14G7D... (101.9ms)
✅ Transaction fetched: 4JbKoNG2... (101.1ms)
🔍 Fetching transaction: 4JbKoNG2... (attempt 1/4)
🔍 Fetching transaction: 5LyijP67... (attempt 1/4)
✅ Transaction fetched: 4JbKoNG2... (101.6ms)
✅ Transaction fetched: 5LyijP67... (99.1ms)
🔍 Fetching transaction: 5LyijP67... (attempt 1/4)
🔍 Fetching transaction: b9FtDzUa... (attempt 1/4)
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
✅ Transaction fetched: 5LyijP67... (101.6ms)
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 32.8ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 18/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 9/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 50 unique, 0 duplicates removed
🔍 STAGE 4: PROGRAM ID EXTRACTION
🎯 Cache hit: nsoxQkmX... (0.0ms)
🎯 Cache hit: 63MWfXym... (0.0ms)
🎯 Cache hit: 5uRmrn9s... (0.0ms)
🎯 Cache hit: 5WiGkXpM... (0.0ms)
🎯 Cache hit: 2EMfZw6g... (0.0ms)
🎯 Cache hit: 38bAzYC3... (0.0ms)
🎯 Cache hit: 283ABxJW... (0.0ms)
🎯 Cache hit: 4CVHjzDj... (0.0ms)
🎯 Cache hit: 41Dd1Ckz... (0.0ms)
🎯 Cache hit: 4wXXPGAq... (0.0ms)
🎯 Cache hit: 4a6cbnnd... (0.0ms)
🎯 Cache hit: 5YjSoQn8... (0.0ms)
🎯 Cache hit: 5cB9yady... (0.0ms)
🎯 Cache hit: xoGVaj9V... (0.0ms)
🎯 Cache hit: 2euvoFS3... (0.0ms)
🎯 Cache hit: 3LpZhxtS... (0.0ms)
🎯 Cache hit: 4uPihdMy... (0.0ms)
🎯 Cache hit: 4Hx6f6py... (0.0ms)
🎯 Cache hit: 2JbEuNhV... (0.0ms)
🎯 Cache hit: 3Xvp1eHS... (0.0ms)
🎯 Cache hit: HFo6qUit... (0.0ms)
🎯 Cache hit: 4eJWsMvr... (0.0ms)
🎯 Cache hit: 48YRD3mR... (0.0ms)
🎯 Cache hit: 3inaSo3J... (0.0ms)
🎯 Cache hit: 28LtHoeW... (0.0ms)
🎯 Cache hit: W7Hfkgnz... (0.0ms)
🎯 Cache hit: 24phv9Us... (0.0ms)
🎯 Cache hit: 4dT14G7D... (0.0ms)
🎯 Cache hit: 4JbKoNG2... (0.0ms)
🎯 Cache hit: 5LyijP67... (0.0ms)
✅ Transaction fetched: b9FtDzUa... (81.5ms)
🔍 Fetching transaction: b9FtDzUa... (attempt 1/4)
🔍 Fetching transaction: b9FtDzUa... (attempt 1/4)
🔍 Fetching transaction: 3tLBuV7P... (attempt 1/4)
✅ Transaction fetched: b9FtDzUa... (51.4ms)
✅ Transaction fetched: b9FtDzUa... (50.8ms)
✅ Transaction fetched: 3tLBuV7P... (86.3ms)
🔍 Fetching transaction: 3tLBuV7P... (attempt 1/4)
🔍 Fetching transaction: 3tLBuV7P... (attempt 1/4)
🔍 Fetching transaction: 5QCPGj4X... (attempt 1/4)
✅ Transaction fetched: 3tLBuV7P... (102.4ms)
✅ Transaction fetched: 3tLBuV7P... (102.6ms)
✅ Transaction fetched: 5QCPGj4X... (105.5ms)
🔍 Fetching transaction: 5QCPGj4X... (attempt 1/4)
🔍 Fetching transaction: 5QCPGj4X... (attempt 1/4)
🔍 Fetching transaction: 2CwwYYb9... (attempt 1/4)
✅ Transaction fetched: 5QCPGj4X... (100.3ms)
✅ Transaction fetched: 5QCPGj4X... (100.4ms)
✅ Transaction fetched: 2CwwYYb9... (101.8ms)
🔍 Fetching transaction: 2CwwYYb9... (attempt 1/4)
🔍 Fetching transaction: 2CwwYYb9... (attempt 1/4)
🔍 Fetching transaction: 4jo2dqfT... (attempt 1/4)
✅ Transaction fetched: 2CwwYYb9... (102.0ms)
✅ Transaction fetched: 2CwwYYb9... (102.2ms)
✅ Transaction fetched: 4jo2dqfT... (87.5ms)
🔍 Fetching transaction: 4jo2dqfT... (attempt 1/4)
🔍 Fetching transaction: 4jo2dqfT... (attempt 1/4)
🔍 Fetching transaction: 4yp1db53... (attempt 1/4)
✅ Transaction fetched: 4jo2dqfT... (99.5ms)
✅ Transaction fetched: 4jo2dqfT... (99.5ms)
✅ Transaction fetched: 4yp1db53... (113.0ms)
🔍 Fetching transaction: 4yp1db53... (attempt 1/4)
🔍 Fetching transaction: 4yp1db53... (attempt 1/4)
🔍 Fetching transaction: 3bUx4qG7... (attempt 1/4)
✅ Transaction fetched: 4yp1db53... (102.6ms)
✅ Transaction fetched: 4yp1db53... (102.7ms)
✅ Transaction fetched: 3bUx4qG7... (105.2ms)
🔍 Fetching transaction: 3bUx4qG7... (attempt 1/4)
🔍 Fetching transaction: 3bUx4qG7... (attempt 1/4)
🔍 Fetching transaction: 45XBpcJ5... (attempt 1/4)
✅ Transaction fetched: 3bUx4qG7... (102.1ms)
✅ Transaction fetched: 3bUx4qG7... (102.3ms)
✅ Transaction fetched: 45XBpcJ5... (91.0ms)
🔍 Fetching transaction: 45XBpcJ5... (attempt 1/4)
🔍 Fetching transaction: 45XBpcJ5... (attempt 1/4)
🔍 Fetching transaction: drBxrBy8... (attempt 1/4)
✅ Transaction fetched: 45XBpcJ5... (102.1ms)
✅ Transaction fetched: 45XBpcJ5... (102.3ms)
✅ Transaction fetched: drBxrBy8... (101.9ms)
🔍 Fetching transaction: drBxrBy8... (attempt 1/4)
🔍 Fetching transaction: drBxrBy8... (attempt 1/4)
🔍 Fetching transaction: raR9mkkV... (attempt 1/4)
✅ Transaction fetched: drBxrBy8... (102.1ms)
✅ Transaction fetched: drBxrBy8... (102.3ms)
✅ Transaction fetched: raR9mkkV... (92.8ms)
🔍 Fetching transaction: raR9mkkV... (attempt 1/4)
🔍 Fetching transaction: raR9mkkV... (attempt 1/4)
🔍 Fetching transaction: 2ReAKovh... (attempt 1/4)
✅ Transaction fetched: raR9mkkV... (100.5ms)
✅ Transaction fetched: raR9mkkV... (100.6ms)
✅ Transaction fetched: 2ReAKovh... (104.7ms)
🔍 Fetching transaction: 2ReAKovh... (attempt 1/4)
🔍 Fetching transaction: 2ReAKovh... (attempt 1/4)
🔍 Fetching transaction: 4dGYNyhp... (attempt 1/4)
✅ Transaction fetched: 2ReAKovh... (101.8ms)
✅ Transaction fetched: 2ReAKovh... (102.0ms)
✅ Transaction fetched: 4dGYNyhp... (112.8ms)
🔍 Fetching transaction: 4dGYNyhp... (attempt 1/4)
🔍 Fetching transaction: 4dGYNyhp... (attempt 1/4)
🔍 Fetching transaction: 4d1Amp3R... (attempt 1/4)
✅ Transaction fetched: 4dGYNyhp... (102.6ms)
✅ Transaction fetched: 4dGYNyhp... (102.7ms)
✅ Transaction fetched: 4d1Amp3R... (106.1ms)
🔍 Fetching transaction: 4d1Amp3R... (attempt 1/4)
🔍 Fetching transaction: 4d1Amp3R... (attempt 1/4)
🔍 Fetching transaction: 3Dc9oKpV... (attempt 1/4)
✅ Transaction fetched: 4d1Amp3R... (102.4ms)
✅ Transaction fetched: 4d1Amp3R... (102.5ms)
✅ Transaction fetched: 3Dc9oKpV... (96.9ms)
🔍 Fetching transaction: 3Dc9oKpV... (attempt 1/4)
🔍 Fetching transaction: 3Dc9oKpV... (attempt 1/4)
🔍 Fetching transaction: 2SEoCT8p... (attempt 1/4)
✅ Transaction fetched: 3Dc9oKpV... (101.2ms)
✅ Transaction fetched: 3Dc9oKpV... (101.4ms)
✅ Transaction fetched: 2SEoCT8p... (91.6ms)
🔍 Fetching transaction: 2SEoCT8p... (attempt 1/4)
🔍 Fetching transaction: 2SEoCT8p... (attempt 1/4)
🔍 Fetching transaction: 5Dsbko67... (attempt 1/4)
✅ Transaction fetched: 2SEoCT8p... (101.9ms)
✅ Transaction fetched: 2SEoCT8p... (102.0ms)
✅ Transaction fetched: 5Dsbko67... (126.0ms)
🔍 Fetching transaction: 5Dsbko67... (attempt 1/4)
🔍 Fetching transaction: 5Dsbko67... (attempt 1/4)
🔍 Fetching transaction: 5apQsvFL... (attempt 1/4)
✅ Transaction fetched: 5Dsbko67... (102.3ms)
✅ Transaction fetched: 5Dsbko67... (102.5ms)
✅ Transaction fetched: 5apQsvFL... (88.3ms)
🔍 Fetching transaction: 5apQsvFL... (attempt 1/4)
🔍 Fetching transaction: 5apQsvFL... (attempt 1/4)
🔍 Fetching transaction: qMJaLzsB... (attempt 1/4)
✅ Transaction fetched: 5apQsvFL... (101.0ms)
✅ Transaction fetched: 5apQsvFL... (101.1ms)
✅ Transaction fetched: qMJaLzsB... (96.9ms)
🔍 Fetching transaction: qMJaLzsB... (attempt 1/4)
🔍 Fetching transaction: qMJaLzsB... (attempt 1/4)
🔍 Fetching transaction: 4EYDACTa... (attempt 1/4)
✅ Transaction fetched: qMJaLzsB... (101.9ms)
✅ Transaction fetched: qMJaLzsB... (102.0ms)
✅ Transaction fetched: 4EYDACTa... (104.7ms)
🔍 Fetching transaction: 4EYDACTa... (attempt 1/4)
🔍 Fetching transaction: 4EYDACTa... (attempt 1/4)
🔍 Fetching transaction: 5ULU95kG... (attempt 1/4)
✅ Transaction fetched: 4EYDACTa... (100.7ms)
✅ Transaction fetched: 4EYDACTa... (100.9ms)
✅ Transaction fetched: 5ULU95kG... (97.8ms)
🔍 Fetching transaction: 5ULU95kG... (attempt 1/4)
🔍 Fetching transaction: 5ULU95kG... (attempt 1/4)
  📊 Program distribution:
    - ComputeBudget_Program: 78 transactions (ComputeB...)
    - null: 1 transactions (JUP6LkbZ...)
    - AssociatedToken_Program: 14 transactions (ATokenGP...)
    - Raydium_AMM_V4: 27 transactions (675kPX9M...)
    - Token_Program: 27 transactions (Tokenkeg...)
    - null: 29 transactions (11111111...)
    - null: 7 transactions (FoaFt2Dt...)
    - null: 1 transactions (CwU7m7Ui...)
    - PumpFun: 24 transactions (6EF8rrec...)
    - null: 1 transactions (E3BYUBj2...)
    - null: 1 transactions (4bxPFDT8...)
    - null: 2 transactions (sattCHvH...)
    - null: 1 transactions (CFU3XT4y...)
    - null: 2 transactions (CataF1xj...)
    - null: 4 transactions (hydHwdP5...)
    - Orca_Whirlpool: 2 transactions (whirLbMi...)
    - null: 2 transactions (AYnWYZVW...)
    - null: 1 transactions (GMGNreQc...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'nsoxQkmXJy1HmjszieFZAv6TtCns25aNyJwWXJd95R9jAS8MZigJgHX73sXuzkh3LJzxDxs5Gngxgx5d3y5Dwpr', processed: 0 }
🎯 Cache hit: nsoxQkmX... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=JUP6LkbZbjS1...
    ⚡ UNKNOWN PROGRAM: JUP6LkbZ... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '63MWfXymx5LRv2kMf34bPiAxeNETwdj2a4fZtbFiethxgbBtEz7u7E7EixDtvvHVVWCnZj35eSzRXgybkPvsDHtV', processed: 1 }
🎯 Cache hit: 63MWfXym... (0.0ms)
  🔬 Parsing 6 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ATokenGPvbdG...
    ⚡ UNKNOWN PROGRAM: AssociatedToken_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.2ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 3: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 4: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.2ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 5: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 6 instructions
🔍 TRANSACTION DEBUG: { signature: '5uRmrn9siwq9HMqNKSkYMHPSdUGPWHr9auQnd9qV8avXCnWKmbdWYtSuNrw6qehdsqBSCdJP9ALd12ZoV46ouK3t', processed: 2 }
🎯 Cache hit: 5uRmrn9s... (0.0ms)
  🔬 Parsing 7 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 5uRmrn9s...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 23
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 8 (position 8)
        - AMM ID index: 4 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: BmKRky6uVTucbjjyPAkhkimFwYyJnZXFs7PfVRvySGz1
        - AMM ID: 6ZotT4LfUj4WzBuQXFXTuTXnZHpkLDCJVLrdBZond6qf
        ⚠️ Unknown pair: coin=srmqPvym..., pc=BmKRky6u...
        ✅ Layout extraction successful (0.6ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
✅ Transaction fetched: 5ULU95kG... (108.6ms)
✅ Transaction fetched: 5ULU95kG... (108.7ms)
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 26.0ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 18/20
  ✅ PumpFun valid: 15/20
  ✅ Orca valid: 9/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 50 unique, 0 duplicates removed
🔍 STAGE 4: PROGRAM ID EXTRACTION
🎯 Cache hit: nsoxQkmX... (0.0ms)
🎯 Cache hit: 63MWfXym... (0.0ms)
  📊 Program distribution:
    - ComputeBudget_Program: 78 transactions (ComputeB...)
    - null: 1 transactions (JUP6LkbZ...)
    - AssociatedToken_Program: 14 transactions (ATokenGP...)
    - Raydium_AMM_V4: 27 transactions (675kPX9M...)
    - Token_Program: 27 transactions (Tokenkeg...)
    - null: 29 transactions (11111111...)
    - null: 7 transactions (FoaFt2Dt...)
    - null: 1 transactions (CwU7m7Ui...)
    - PumpFun: 24 transactions (6EF8rrec...)
    - null: 1 transactions (E3BYUBj2...)
    - null: 1 transactions (4bxPFDT8...)
    - null: 2 transactions (sattCHvH...)
    - null: 1 transactions (CFU3XT4y...)
    - null: 2 transactions (CataF1xj...)
    - null: 4 transactions (hydHwdP5...)
    - Orca_Whirlpool: 2 transactions (whirLbMi...)
    - null: 2 transactions (AYnWYZVW...)
    - null: 1 transactions (GMGNreQc...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'nsoxQkmXJy1HmjszieFZAv6TtCns25aNyJwWXJd95R9jAS8MZigJgHX73sXuzkh3LJzxDxs5Gngxgx5d3y5Dwpr', processed: 0 }
🎯 Cache hit: nsoxQkmX... (0.0ms)
  📊 Program distribution:
    - ComputeBudget_Program: 78 transactions (ComputeB...)
    - null: 1 transactions (JUP6LkbZ...)
    - AssociatedToken_Program: 14 transactions (ATokenGP...)
    - Raydium_AMM_V4: 27 transactions (675kPX9M...)
    - Token_Program: 27 transactions (Tokenkeg...)
    - null: 29 transactions (11111111...)
    - null: 7 transactions (FoaFt2Dt...)
    - null: 1 transactions (CwU7m7Ui...)
    - PumpFun: 24 transactions (6EF8rrec...)
    - null: 1 transactions (E3BYUBj2...)
    - null: 1 transactions (4bxPFDT8...)
    - null: 2 transactions (sattCHvH...)
    - null: 1 transactions (CFU3XT4y...)
    - null: 2 transactions (CataF1xj...)
    - null: 4 transactions (hydHwdP5...)
    - Orca_Whirlpool: 2 transactions (whirLbMi...)
    - null: 2 transactions (AYnWYZVW...)
    - null: 1 transactions (GMGNreQc...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'nsoxQkmXJy1HmjszieFZAv6TtCns25aNyJwWXJd95R9jAS8MZigJgHX73sXuzkh3LJzxDxs5Gngxgx5d3y5Dwpr', processed: 0 }
🎯 Cache hit: nsoxQkmX... (0.0ms)
🎯 Cache hit: 5uRmrn9s... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
🎯 Cache hit: 5WiGkXpM... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
🎯 Cache hit: 2EMfZw6g... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=JUP6LkbZbjS1...
    ⚡ UNKNOWN PROGRAM: JUP6LkbZ... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=JUP6LkbZbjS1...
    ⚡ UNKNOWN PROGRAM: JUP6LkbZ... (using fallback parsing)
🎯 Cache hit: 38bAzYC3... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🎯 Cache hit: 283ABxJW... (0.0ms)
🔍 TRANSACTION DEBUG: { signature: '63MWfXymx5LRv2kMf34bPiAxeNETwdj2a4fZtbFiethxgbBtEz7u7E7EixDtvvHVVWCnZj35eSzRXgybkPvsDHtV', processed: 1 }
🎯 Cache hit: 63MWfXym... (0.0ms)
🔍 TRANSACTION DEBUG: { signature: '63MWfXymx5LRv2kMf34bPiAxeNETwdj2a4fZtbFiethxgbBtEz7u7E7EixDtvvHVVWCnZj35eSzRXgybkPvsDHtV', processed: 1 }
🎯 Cache hit: 63MWfXym... (0.0ms)
🎯 Cache hit: 4CVHjzDj... (0.0ms)
  🔬 Parsing 6 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
  🔬 Parsing 6 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
🎯 Cache hit: 41Dd1Ckz... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ATokenGPvbdG...
    ⚡ UNKNOWN PROGRAM: AssociatedToken_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ATokenGPvbdG...
    ⚡ UNKNOWN PROGRAM: AssociatedToken_Program (using fallback parsing)
🎯 Cache hit: 4wXXPGAq... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
🎯 Cache hit: 4a6cbnnd... (0.0ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ❌ NO CANDIDATE: Raydium analysis returned null
🎯 Cache hit: 5YjSoQn8... (0.0ms)
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 3: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 3: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
🎯 Cache hit: 5cB9yady... (0.0ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ❌ NO CANDIDATE: Raydium analysis returned null
🎯 Cache hit: xoGVaj9V... (0.0ms)
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 4: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 4: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
🎯 Cache hit: 2euvoFS3... (0.0ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ❌ NO CANDIDATE: Raydium analysis returned null
🎯 Cache hit: 3LpZhxtS... (0.0ms)
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 5: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 5: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
🎯 Cache hit: 4uPihdMy... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 6 instructions
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 6 instructions
🎯 Cache hit: 4Hx6f6py... (0.0ms)
🔍 TRANSACTION DEBUG: { signature: '5uRmrn9siwq9HMqNKSkYMHPSdUGPWHr9auQnd9qV8avXCnWKmbdWYtSuNrw6qehdsqBSCdJP9ALd12ZoV46ouK3t', processed: 2 }
🎯 Cache hit: 5uRmrn9s... (0.0ms)
🔍 TRANSACTION DEBUG: { signature: '5uRmrn9siwq9HMqNKSkYMHPSdUGPWHr9auQnd9qV8avXCnWKmbdWYtSuNrw6qehdsqBSCdJP9ALd12ZoV46ouK3t', processed: 2 }
🎯 Cache hit: 5uRmrn9s... (0.0ms)
🎯 Cache hit: 2JbEuNhV... (0.0ms)
  🔬 Parsing 7 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
  🔬 Parsing 7 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
🎯 Cache hit: 3Xvp1eHS... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
🎯 Cache hit: HFo6qUit... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
🎯 Cache hit: 4eJWsMvr... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
🎯 Cache hit: 48YRD3mR... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
🎯 Cache hit: 3inaSo3J... (0.0ms)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 5uRmrn9s...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 23
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 8 (position 8)
        - AMM ID index: 4 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: BmKRky6uVTucbjjyPAkhkimFwYyJnZXFs7PfVRvySGz1
        - AMM ID: 6ZotT4LfUj4WzBuQXFXTuTXnZHpkLDCJVLrdBZond6qf
        ⚠️ Unknown pair: coin=srmqPvym..., pc=BmKRky6u...
        ✅ Layout extraction successful (0.3ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 5uRmrn9s...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 23
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 8 (position 8)
        - AMM ID index: 4 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: BmKRky6uVTucbjjyPAkhkimFwYyJnZXFs7PfVRvySGz1
        - AMM ID: 6ZotT4LfUj4WzBuQXFXTuTXnZHpkLDCJVLrdBZond6qf
        ⚠️ Unknown pair: coin=srmqPvym..., pc=BmKRky6u...
        ✅ Layout extraction successful (0.2ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
🎯 Cache hit: 28LtHoeW... (0.0ms)
🎯 Cache hit: W7Hfkgnz... (0.0ms)
🎯 Cache hit: 24phv9Us... (0.0ms)
🎯 Cache hit: 4dT14G7D... (0.0ms)
🎯 Cache hit: 4JbKoNG2... (0.0ms)
🎯 Cache hit: 5LyijP67... (0.0ms)
🎯 Cache hit: b9FtDzUa... (0.0ms)
🎯 Cache hit: 3tLBuV7P... (0.0ms)
🎯 Cache hit: 5QCPGj4X... (0.0ms)
🎯 Cache hit: 2CwwYYb9... (0.0ms)
🎯 Cache hit: 4jo2dqfT... (0.0ms)
🎯 Cache hit: 4yp1db53... (0.0ms)
🎯 Cache hit: 3bUx4qG7... (0.0ms)
🎯 Cache hit: 45XBpcJ5... (0.0ms)
🎯 Cache hit: drBxrBy8... (0.0ms)
🎯 Cache hit: raR9mkkV... (0.0ms)
🎯 Cache hit: 2ReAKovh... (0.0ms)
🎯 Cache hit: 4dGYNyhp... (0.0ms)
🎯 Cache hit: 4d1Amp3R... (0.0ms)
🎯 Cache hit: 3Dc9oKpV... (0.0ms)
🎯 Cache hit: 2SEoCT8p... (0.0ms)
🎯 Cache hit: 5Dsbko67... (0.0ms)
🎯 Cache hit: 5apQsvFL... (0.0ms)
🎯 Cache hit: qMJaLzsB... (0.0ms)
🎯 Cache hit: 4EYDACTa... (0.0ms)
🎯 Cache hit: 5ULU95kG... (0.0ms)
  📊 Program distribution:
    - ComputeBudget_Program: 78 transactions (ComputeB...)
    - null: 1 transactions (JUP6LkbZ...)
    - AssociatedToken_Program: 14 transactions (ATokenGP...)
    - Raydium_AMM_V4: 27 transactions (675kPX9M...)
    - Token_Program: 27 transactions (Tokenkeg...)
    - null: 29 transactions (11111111...)
    - null: 7 transactions (FoaFt2Dt...)
    - null: 1 transactions (CwU7m7Ui...)
    - PumpFun: 24 transactions (6EF8rrec...)
    - null: 1 transactions (E3BYUBj2...)
    - null: 1 transactions (4bxPFDT8...)
    - null: 2 transactions (sattCHvH...)
    - null: 1 transactions (CFU3XT4y...)
    - null: 2 transactions (CataF1xj...)
    - null: 4 transactions (hydHwdP5...)
    - Orca_Whirlpool: 2 transactions (whirLbMi...)
    - null: 2 transactions (AYnWYZVW...)
    - null: 1 transactions (GMGNreQc...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'nsoxQkmXJy1HmjszieFZAv6TtCns25aNyJwWXJd95R9jAS8MZigJgHX73sXuzkh3LJzxDxs5Gngxgx5d3y5Dwpr', processed: 0 }
🎯 Cache hit: nsoxQkmX... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=JUP6LkbZbjS1...
    ⚡ UNKNOWN PROGRAM: JUP6LkbZ... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '63MWfXymx5LRv2kMf34bPiAxeNETwdj2a4fZtbFiethxgbBtEz7u7E7EixDtvvHVVWCnZj35eSzRXgybkPvsDHtV', processed: 1 }
🎯 Cache hit: 63MWfXym... (0.0ms)
  🔬 Parsing 6 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ATokenGPvbdG...
    ⚡ UNKNOWN PROGRAM: AssociatedToken_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 3: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 4: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 63MWfXym...
    ✅ DISCRIMINATOR RECOGNIZED: initialize2 (Standard LP creation (most common))
    ❌ RAYDIUM: Insufficient accounts for initialize2 (18 < 19) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 5: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 6 instructions
🔍 TRANSACTION DEBUG: { signature: '5uRmrn9siwq9HMqNKSkYMHPSdUGPWHr9auQnd9qV8avXCnWKmbdWYtSuNrw6qehdsqBSCdJP9ALd12ZoV46ouK3t', processed: 2 }
🎯 Cache hit: 5uRmrn9s... (0.0ms)
  🔬 Parsing 7 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 5uRmrn9s...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 23
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 8 (position 8)
        - AMM ID index: 4 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: BmKRky6uVTucbjjyPAkhkimFwYyJnZXFs7PfVRvySGz1
        - AMM ID: 6ZotT4LfUj4WzBuQXFXTuTXnZHpkLDCJVLrdBZond6qf
        ⚠️ Unknown pair: coin=srmqPvym..., pc=BmKRky6u...
        ✅ Layout extraction successful (0.2ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
    ⚡ VALIDATION: primary=0.00 secondary=0.40 (51.7ms)
    ⚠️ PERFORMANCE ALERT: Token validation took 51.7ms (target: <50ms)
    🟡 RAYDIUM PERMISSIVE: Potential meme opportunity (confidence: 12.0)
    ✅ CANDIDATE GENERATED: Raydium (8322.787917ms)
    ✅ ROUTED: Raydium analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '5WiGkXpMm6JiEi5geDH7PA3JCYzzYtC66pRKLDt4QbuvB9uqf53exGThPToXkVth9g9LZHqUjxZRGf4cuo7e2beg', processed: 3 }
🎯 Cache hit: 5WiGkXpM... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2EMfZw6gdXznU86SRg8V2ZPG5D7TBhov8ZcSwXhWARgo8ipRKwVzijMosQr1NXzk3gH4NoY36zvEdezx6c6p2WRD', processed: 4 }
🎯 Cache hit: 2EMfZw6g... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '38bAzYC3hbAvqrwY7As3tNT4A93D5VN2MwW85UuFdZ5toTczzhEgo4WNP8ehsvMJFiRVZnoxAgZ7gybMt31Kmch9', processed: 5 }
🎯 Cache hit: 38bAzYC3... (0.0ms)
  🔬 Parsing 10 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe6
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    🔍 UNKNOWN DISCRIMINATOR: 0xe6 - applying heuristics
    🎯 HEURISTIC: Likely LP creation - proceeding with fallback analysis
    📊 UNKNOWN DISCRIMINATOR: 0xe6 recorded (total unknown: 1)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe6
        - Account count: 18
        - AccountKeys length: 23
        ⚠️ Unknown discriminator 0xe6 - using heuristic extraction
        🔍 HEURISTIC EXTRACTION (fallback mode)
        ❌ Heuristic extraction failed: quote=false, meme=17 (0.5ms)
    ❌ RAYDIUM: Token extraction failed (0.7ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 6: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 7: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 23
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 9 (position 8)
        - AMM ID index: 2 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: F6q1SDS9SvXX8cr64qXbcn4YEf282vcA7u7gtNdYqra7
        - AMM ID: gwuHdfcUBHnbYxfKBzncsrsGKgUwUje1s4TwkENeFmb
        ⚠️ Unknown pair: coin=srmqPvym..., pc=F6q1SDS9...
        ✅ Layout extraction successful (1.1ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
    ⚡ VALIDATION: primary=0.00 secondary=0.40 (51.7ms)
    ⚠️ PERFORMANCE ALERT: Token validation took 51.7ms (target: <50ms)
    🟡 RAYDIUM PERMISSIVE: Potential meme opportunity (confidence: 12.0)
    ✅ CANDIDATE GENERATED: Raydium (8365.939875ms)
    ✅ ROUTED: Raydium analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '5WiGkXpMm6JiEi5geDH7PA3JCYzzYtC66pRKLDt4QbuvB9uqf53exGThPToXkVth9g9LZHqUjxZRGf4cuo7e2beg', processed: 3 }
🎯 Cache hit: 5WiGkXpM... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2EMfZw6gdXznU86SRg8V2ZPG5D7TBhov8ZcSwXhWARgo8ipRKwVzijMosQr1NXzk3gH4NoY36zvEdezx6c6p2WRD', processed: 4 }
🎯 Cache hit: 2EMfZw6g... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '38bAzYC3hbAvqrwY7As3tNT4A93D5VN2MwW85UuFdZ5toTczzhEgo4WNP8ehsvMJFiRVZnoxAgZ7gybMt31Kmch9', processed: 5 }
🎯 Cache hit: 38bAzYC3... (0.0ms)
  🔬 Parsing 10 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe6
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    🔍 UNKNOWN DISCRIMINATOR: 0xe6 - applying heuristics
    🎯 HEURISTIC: Likely LP creation - proceeding with fallback analysis
    📊 UNKNOWN DISCRIMINATOR: 0xe6 recorded (total unknown: 2)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe6
        - Account count: 18
        - AccountKeys length: 23
        ⚠️ Unknown discriminator 0xe6 - using heuristic extraction
        🔍 HEURISTIC EXTRACTION (fallback mode)
        ❌ Heuristic extraction failed: quote=false, meme=17 (0.4ms)
    ❌ RAYDIUM: Token extraction failed (0.6ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 6: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 7: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 23
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 9 (position 8)
        - AMM ID index: 2 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: F6q1SDS9SvXX8cr64qXbcn4YEf282vcA7u7gtNdYqra7
        - AMM ID: gwuHdfcUBHnbYxfKBzncsrsGKgUwUje1s4TwkENeFmb
        ⚠️ Unknown pair: coin=srmqPvym..., pc=F6q1SDS9...
        ✅ Layout extraction successful (0.2ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
    ⚡ VALIDATION: primary=0.00 secondary=0.40 (53.9ms)
    ⚠️ PERFORMANCE ALERT: Token validation took 53.9ms (target: <50ms)
    🟡 RAYDIUM PERMISSIVE: Potential meme opportunity (confidence: 12.0)
    ✅ CANDIDATE GENERATED: Raydium (8368.631792ms)
    ✅ ROUTED: Raydium analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '5WiGkXpMm6JiEi5geDH7PA3JCYzzYtC66pRKLDt4QbuvB9uqf53exGThPToXkVth9g9LZHqUjxZRGf4cuo7e2beg', processed: 3 }
🎯 Cache hit: 5WiGkXpM... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2EMfZw6gdXznU86SRg8V2ZPG5D7TBhov8ZcSwXhWARgo8ipRKwVzijMosQr1NXzk3gH4NoY36zvEdezx6c6p2WRD', processed: 4 }
🎯 Cache hit: 2EMfZw6g... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '38bAzYC3hbAvqrwY7As3tNT4A93D5VN2MwW85UuFdZ5toTczzhEgo4WNP8ehsvMJFiRVZnoxAgZ7gybMt31Kmch9', processed: 5 }
🎯 Cache hit: 38bAzYC3... (0.0ms)
  🔬 Parsing 10 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe6
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    🔍 UNKNOWN DISCRIMINATOR: 0xe6 - applying heuristics
    🎯 HEURISTIC: Likely LP creation - proceeding with fallback analysis
    📊 UNKNOWN DISCRIMINATOR: 0xe6 recorded (total unknown: 3)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe6
        - Account count: 18
        - AccountKeys length: 23
        ⚠️ Unknown discriminator 0xe6 - using heuristic extraction
        🔍 HEURISTIC EXTRACTION (fallback mode)
        ❌ Heuristic extraction failed: quote=false, meme=17 (0.1ms)
    ❌ RAYDIUM: Token extraction failed (0.3ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 6: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 7: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 23
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 9 (position 8)
        - AMM ID index: 2 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: F6q1SDS9SvXX8cr64qXbcn4YEf282vcA7u7gtNdYqra7
        - AMM ID: gwuHdfcUBHnbYxfKBzncsrsGKgUwUje1s4TwkENeFmb
        ⚠️ Unknown pair: coin=srmqPvym..., pc=F6q1SDS9...
        ✅ Layout extraction successful (0.2ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
    ⚡ VALIDATION: primary=0.00 secondary=0.40 (54.0ms)
    ⚠️ PERFORMANCE ALERT: Token validation took 54.0ms (target: <50ms)
    🟡 RAYDIUM PERMISSIVE: Potential meme opportunity (confidence: 12.0)
    ✅ CANDIDATE GENERATED: Raydium (8371.201792ms)
    ✅ ROUTED: Raydium analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '5WiGkXpMm6JiEi5geDH7PA3JCYzzYtC66pRKLDt4QbuvB9uqf53exGThPToXkVth9g9LZHqUjxZRGf4cuo7e2beg', processed: 3 }
🎯 Cache hit: 5WiGkXpM... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2EMfZw6gdXznU86SRg8V2ZPG5D7TBhov8ZcSwXhWARgo8ipRKwVzijMosQr1NXzk3gH4NoY36zvEdezx6c6p2WRD', processed: 4 }
🎯 Cache hit: 2EMfZw6g... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '38bAzYC3hbAvqrwY7As3tNT4A93D5VN2MwW85UuFdZ5toTczzhEgo4WNP8ehsvMJFiRVZnoxAgZ7gybMt31Kmch9', processed: 5 }
🎯 Cache hit: 38bAzYC3... (0.0ms)
  🔬 Parsing 10 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe6
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    🔍 UNKNOWN DISCRIMINATOR: 0xe6 - applying heuristics
    🎯 HEURISTIC: Likely LP creation - proceeding with fallback analysis
    📊 UNKNOWN DISCRIMINATOR: 0xe6 recorded (total unknown: 4)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe6
        - Account count: 18
        - AccountKeys length: 23
        ⚠️ Unknown discriminator 0xe6 - using heuristic extraction
        🔍 HEURISTIC EXTRACTION (fallback mode)
        ❌ Heuristic extraction failed: quote=false, meme=17 (0.1ms)
    ❌ RAYDIUM: Token extraction failed (0.4ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 6: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 7: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 38bAzYC3...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 23
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 9 (position 8)
        - AMM ID index: 2 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: F6q1SDS9SvXX8cr64qXbcn4YEf282vcA7u7gtNdYqra7
        - AMM ID: gwuHdfcUBHnbYxfKBzncsrsGKgUwUje1s4TwkENeFmb
        ⚠️ Unknown pair: coin=srmqPvym..., pc=F6q1SDS9...
        ✅ Layout extraction successful (0.2ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
    ⚡ VALIDATION: primary=0.00 secondary=0.40 (49.9ms)
    🟡 RAYDIUM PERMISSIVE: Potential meme opportunity (confidence: 12.0)
    ✅ CANDIDATE GENERATED: Raydium (8376.014042ms)
    ✅ ROUTED: Raydium analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '283ABxJWZRNLvpjhUdmWG5UEiL6ue2RNscXpZvcsh5uDoxhjvkgfCqcpeHJBjfzrCpptu9AVRZSc49pASPNip7Es', processed: 6 }
🎯 Cache hit: 283ABxJW... (0.0ms)
  🔬 Parsing 9 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ATokenGPvbdG...
    ⚡ UNKNOWN PROGRAM: AssociatedToken_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 283ABxJW...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 6: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 283ABxJW...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 7: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 283ABxJW...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 8: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 9 instructions
🔍 TRANSACTION DEBUG: { signature: '4CVHjzDjFszRZTngoaeiEZsrr7Y7KBxsKAd8heMuWmyxvrYpZDNUBz9qY8Wesog3qLAtjmRUZ9rMDVFZbHAv6wjw', processed: 7 }
🎯 Cache hit: 4CVHjzDj... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '41Dd1CkzvpWz4KQgLYHNmbMQsj76n26kv8jU6jywxkw2wyqQB25YEbJmwVc6to7bveytHt2x7UWWE52bfVStx1Rw', processed: 8 }
🎯 Cache hit: 41Dd1Ckz... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FoaFt2Dtz58R...
    ⚡ UNKNOWN PROGRAM: FoaFt2Dt... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '4wXXPGAqGQghCEb5seBvtnNcqCb4JmBvTPXGzjHGqJuHwqpqq4H9vDJHv2r6ftjrgtDvDNt76s4TbWHgm9gmqBTQ', processed: 9 }
🎯 Cache hit: 4wXXPGAq... (0.0ms)
  🔬 Parsing 8 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=ATokenGPvbdG...
    ⚡ UNKNOWN PROGRAM: AssociatedToken_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 6: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 4wXXPGAq...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 25
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 19 (position 7)
        - PC mint index: 7 (position 8)
        - AMM ID index: 4 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: BmKRky6uVTucbjjyPAkhkimFwYyJnZXFs7PfVRvySGz1
        - AMM ID: 6ZotT4LfUj4WzBuQXFXTuTXnZHpkLDCJVLrdBZond6qf
        ⚠️ Unknown pair: coin=srmqPvym..., pc=BmKRky6u...
        ✅ Layout extraction successful (0.2ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
    ⚡ VALIDATION: primary=0.00 secondary=0.40 (49.9ms)
    🟡 RAYDIUM PERMISSIVE: Potential meme opportunity (confidence: 12.0)
    ✅ CANDIDATE GENERATED: Raydium (8418.332583ms)
    ✅ ROUTED: Raydium analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '283ABxJWZRNLvpjhUdmWG5UEiL6ue2RNscXpZvcsh5uDoxhjvkgfCqcpeHJBjfzrCpptu9AVRZSc49pASPNip7Es', processed: 6 }
🎯 Cache hit: 283ABxJW... (0.0ms)