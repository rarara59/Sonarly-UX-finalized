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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.366Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.371Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.371Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.375Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.375Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.397Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.397Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.397Z"}
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
info: 📊 Metrics server listening on port 9151 {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.399Z"}
info: 📊 Prometheus metrics: http://localhost:9151/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.400Z"}
info: 💚 Health check: http://localhost:9151/health {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.400Z"}
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
[THORP] System initialized successfully in 55ms
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
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:08:25.542Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $160.49
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 190.5ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 20/20
  ✅ PumpFun valid: 11/20
  ✅ Orca valid: 8/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 50 unique, 0 duplicates removed
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 Fetching transaction: 3vqe7hRj... (attempt 1/4)
✅ Transaction fetched: 3vqe7hRj... (83.0ms)
🔍 Fetching transaction: 5Lf2f78e... (attempt 1/4)
✅ Transaction fetched: 5Lf2f78e... (89.9ms)
🔍 Fetching transaction: 2cekqNm3... (attempt 1/4)
✅ Transaction fetched: 2cekqNm3... (90.8ms)
🔍 Fetching transaction: 2d5NqxZG... (attempt 1/4)
✅ Transaction fetched: 2d5NqxZG... (137.9ms)
🔍 Fetching transaction: 47F96CSs... (attempt 1/4)
✅ Transaction fetched: 47F96CSs... (101.4ms)
🔍 Fetching transaction: 41ES7w2p... (attempt 1/4)
✅ Transaction fetched: 41ES7w2p... (79.8ms)
🔍 Fetching transaction: 3DkhDd6h... (attempt 1/4)
✅ Transaction fetched: 3DkhDd6h... (95.0ms)
🔍 Fetching transaction: 2Xx82Miz... (attempt 1/4)
✅ Transaction fetched: 2Xx82Miz... (102.6ms)
🔍 Fetching transaction: 129LUPDZ... (attempt 1/4)
✅ Transaction fetched: 129LUPDZ... (104.8ms)
🔍 Fetching transaction: 3h8Qemid... (attempt 1/4)
✅ Transaction fetched: 3h8Qemid... (120.5ms)
🔍 Fetching transaction: 617o2CK2... (attempt 1/4)
✅ Transaction fetched: 617o2CK2... (83.1ms)
🔍 Fetching transaction: 4V2Gv8pZ... (attempt 1/4)
✅ Transaction fetched: 4V2Gv8pZ... (115.9ms)
🔍 Fetching transaction: 4WddgKXg... (attempt 1/4)
✅ Transaction fetched: 4WddgKXg... (93.9ms)
🔍 Fetching transaction: 3efsoA5s... (attempt 1/4)
✅ Transaction fetched: 3efsoA5s... (105.6ms)
🔍 Fetching transaction: 2DiPGuZ3... (attempt 1/4)
✅ Transaction fetched: 2DiPGuZ3... (83.4ms)
🔍 Fetching transaction: 5W1ZHW5h... (attempt 1/4)
✅ Transaction fetched: 5W1ZHW5h... (101.6ms)
🔍 Fetching transaction: 2B4dJu7K... (attempt 1/4)
✅ Transaction fetched: 2B4dJu7K... (124.9ms)
🔍 Fetching transaction: 2YUNxkQ9... (attempt 1/4)
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
✅ Transaction fetched: 2YUNxkQ9... (96.0ms)
🔍 Fetching transaction: 4EQdJaeK... (attempt 1/4)
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 37.7ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 20/20
  ✅ PumpFun valid: 11/20
  ✅ Orca valid: 8/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 50 unique, 0 duplicates removed
🔍 STAGE 4: PROGRAM ID EXTRACTION
🎯 Cache hit: 3vqe7hRj... (0.0ms)
🎯 Cache hit: 5Lf2f78e... (0.0ms)
🎯 Cache hit: 2cekqNm3... (0.0ms)
🎯 Cache hit: 2d5NqxZG... (0.0ms)
🎯 Cache hit: 47F96CSs... (0.0ms)
🎯 Cache hit: 41ES7w2p... (0.0ms)
🎯 Cache hit: 3DkhDd6h... (0.0ms)
🎯 Cache hit: 2Xx82Miz... (0.0ms)
🎯 Cache hit: 129LUPDZ... (0.0ms)
🎯 Cache hit: 3h8Qemid... (0.0ms)
🎯 Cache hit: 617o2CK2... (0.0ms)
🎯 Cache hit: 4V2Gv8pZ... (0.0ms)
🎯 Cache hit: 4WddgKXg... (0.0ms)
🎯 Cache hit: 3efsoA5s... (0.0ms)
🎯 Cache hit: 2DiPGuZ3... (0.0ms)
🎯 Cache hit: 5W1ZHW5h... (0.0ms)
🎯 Cache hit: 2B4dJu7K... (0.0ms)
🎯 Cache hit: 2YUNxkQ9... (0.0ms)
✅ Transaction fetched: 4EQdJaeK... (95.2ms)
🔍 Fetching transaction: 4EQdJaeK... (attempt 1/4)
🔍 Fetching transaction: 5pu8f8iV... (attempt 1/4)
^C[THORP] Initiating graceful shutdown...
[THORP] Shutting down service: lpDetector
🔌 Shutting down Renaissance LP Creation Detector...
✅ Renaissance LP Creation Detector shutdown complete

🔌 Received SIGINT, initiating graceful shutdown...
✅ Shutdown complete
rafaltracz@Rafals-MacBook-Air thorpv1 % 
rafaltracz@Rafals-MacBook-Air thorpv1 % 
rafaltracz@Rafals-MacBook-Air thorpv1 % 
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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.748Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.750Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.750Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.754Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.754Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.775Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.775Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.775Z"}
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
info: 📊 Metrics server listening on port 9166 {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.777Z"}
info: 📊 Prometheus metrics: http://localhost:9166/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.777Z"}
info: 💚 Health check: http://localhost:9166/health {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.777Z"}
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
⚡ Ultra-fast token validation initialized
📊 Cache: 10000 tokens, Known: 5 valid, 6 invalid
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
[THORP] System initialized successfully in 51ms
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
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-03T04:25:22.911Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $160.63
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 208.3ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 16/20
  ✅ Orca valid: 7/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 49 unique, 1 duplicates removed
  ⚠️ Duplicate signatures: 4FBvvLVAydGCdcbUdg2iz7ZYEq8eX8ebGgti9UrgUAcZdeyzkpAzEXXZtDxJ6M2pjbDTDi7X14K1h5EVwNPFrjxX
🔍 STAGE 4: PROGRAM ID EXTRACTION
🔍 Fetching transaction: 662Djpza... (attempt 1/4)
✅ Transaction fetched: 662Djpza... (105.9ms)
🔍 Fetching transaction: 5d4V6GBz... (attempt 1/4)
✅ Transaction fetched: 5d4V6GBz... (96.5ms)
🔍 Fetching transaction: 4ogDv2tH... (attempt 1/4)
✅ Transaction fetched: 4ogDv2tH... (107.3ms)
🔍 Fetching transaction: 2XscioQj... (attempt 1/4)
✅ Transaction fetched: 2XscioQj... (91.3ms)
🔍 Fetching transaction: 3ZVTVQeh... (attempt 1/4)
✅ Transaction fetched: 3ZVTVQeh... (110.6ms)
🔍 Fetching transaction: 4FBvvLVA... (attempt 1/4)
✅ Transaction fetched: 4FBvvLVA... (105.7ms)
🔍 Fetching transaction: xuhPv78N... (attempt 1/4)
✅ Transaction fetched: xuhPv78N... (89.4ms)
🔍 Fetching transaction: 3n2B4aKA... (attempt 1/4)
✅ Transaction fetched: 3n2B4aKA... (124.5ms)
🔍 Fetching transaction: NMbTuBZE... (attempt 1/4)
✅ Transaction fetched: NMbTuBZE... (98.1ms)
🔍 Fetching transaction: 5ZqEcfyQ... (attempt 1/4)
✅ Transaction fetched: 5ZqEcfyQ... (95.6ms)
🔍 Fetching transaction: 3NFEeMor... (attempt 1/4)
✅ Transaction fetched: 3NFEeMor... (102.7ms)
🔍 Fetching transaction: AUAwhEAp... (attempt 1/4)
✅ Transaction fetched: AUAwhEAp... (110.4ms)
🔍 Fetching transaction: 4C5fNq7F... (attempt 1/4)
✅ Transaction fetched: 4C5fNq7F... (89.3ms)
🔍 Fetching transaction: 4PBQehVi... (attempt 1/4)
✅ Transaction fetched: 4PBQehVi... (143.1ms)
🔍 Fetching transaction: bsWAmbZm... (attempt 1/4)
✅ Transaction fetched: bsWAmbZm... (209.4ms)
🔍 Fetching transaction: 4V2Bbgi2... (attempt 1/4)
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
✅ Transaction fetched: 4V2Bbgi2... (113.9ms)
🔍 Fetching transaction: 2i1zu7uH... (attempt 1/4)
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 38.6ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 16/20
  ✅ Orca valid: 7/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 49 unique, 1 duplicates removed
  ⚠️ Duplicate signatures: 4FBvvLVAydGCdcbUdg2iz7ZYEq8eX8ebGgti9UrgUAcZdeyzkpAzEXXZtDxJ6M2pjbDTDi7X14K1h5EVwNPFrjxX
🔍 STAGE 4: PROGRAM ID EXTRACTION
🎯 Cache hit: 662Djpza... (0.0ms)
🎯 Cache hit: 5d4V6GBz... (0.0ms)
🎯 Cache hit: 4ogDv2tH... (0.0ms)
🎯 Cache hit: 2XscioQj... (0.0ms)
🎯 Cache hit: 3ZVTVQeh... (0.0ms)
🎯 Cache hit: 4FBvvLVA... (0.0ms)
🎯 Cache hit: xuhPv78N... (0.0ms)
🎯 Cache hit: 3n2B4aKA... (0.0ms)
🎯 Cache hit: NMbTuBZE... (0.0ms)
🎯 Cache hit: 5ZqEcfyQ... (0.0ms)
🎯 Cache hit: 3NFEeMor... (0.0ms)
🎯 Cache hit: AUAwhEAp... (0.0ms)
🎯 Cache hit: 4C5fNq7F... (0.0ms)
🎯 Cache hit: 4PBQehVi... (0.0ms)
🎯 Cache hit: bsWAmbZm... (0.0ms)
🎯 Cache hit: 4V2Bbgi2... (0.0ms)
✅ Transaction fetched: 2i1zu7uH... (90.7ms)
🔍 Fetching transaction: 2i1zu7uH... (attempt 1/4)
🔍 Fetching transaction: 5uPgu8Yx... (attempt 1/4)
✅ Transaction fetched: 2i1zu7uH... (101.0ms)
✅ Transaction fetched: 5uPgu8Yx... (103.8ms)
🔍 Fetching transaction: 5uPgu8Yx... (attempt 1/4)
🔍 Fetching transaction: 5S4TBTKA... (attempt 1/4)
✅ Transaction fetched: 5uPgu8Yx... (101.2ms)
✅ Transaction fetched: 5S4TBTKA... (100.5ms)
🔍 Fetching transaction: 5S4TBTKA... (attempt 1/4)
🔍 Fetching transaction: 55gSdLbt... (attempt 1/4)
✅ Transaction fetched: 5S4TBTKA... (101.5ms)
✅ Transaction fetched: 55gSdLbt... (98.5ms)
🔍 Fetching transaction: 55gSdLbt... (attempt 1/4)
🔍 Fetching transaction: 41Zcc4P8... (attempt 1/4)
✅ Transaction fetched: 55gSdLbt... (101.4ms)
✅ Transaction fetched: 41Zcc4P8... (99.1ms)
🔍 Fetching transaction: 41Zcc4P8... (attempt 1/4)
🔍 Fetching transaction: 5gdwXnrK... (attempt 1/4)
✅ Transaction fetched: 41Zcc4P8... (101.8ms)
✅ Transaction fetched: 5gdwXnrK... (108.1ms)
🔍 Fetching transaction: 5gdwXnrK... (attempt 1/4)
🔍 Fetching transaction: 5hi67iND... (attempt 1/4)
✅ Transaction fetched: 5gdwXnrK... (101.7ms)
✅ Transaction fetched: 5hi67iND... (91.1ms)
🔍 Fetching transaction: 5hi67iND... (attempt 1/4)
🔍 Fetching transaction: 64Jfp3xx... (attempt 1/4)
✅ Transaction fetched: 5hi67iND... (51.6ms)
✅ Transaction fetched: 64Jfp3xx... (61.4ms)
🔍 Fetching transaction: 64Jfp3xx... (attempt 1/4)
🔍 Fetching transaction: 5NQLMY2E... (attempt 1/4)
✅ Transaction fetched: 64Jfp3xx... (102.4ms)
✅ Transaction fetched: 5NQLMY2E... (107.2ms)
🔍 Fetching transaction: 5NQLMY2E... (attempt 1/4)
🔍 Fetching transaction: 3U7wm7Bc... (attempt 1/4)
✅ Transaction fetched: 5NQLMY2E... (101.5ms)
✅ Transaction fetched: 3U7wm7Bc... (104.8ms)
🔍 Fetching transaction: 3U7wm7Bc... (attempt 1/4)
🔍 Fetching transaction: 3tFiePTF... (attempt 1/4)

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
✅ Transaction fetched: 3U7wm7Bc... (100.7ms)
✅ Transaction fetched: 3tFiePTF... (86.3ms)
🔍 Fetching transaction: 3tFiePTF... (attempt 1/4)
🔍 Fetching transaction: 2zN9Ghum... (attempt 1/4)
✅ Transaction fetched: 3tFiePTF... (101.5ms)
✅ Transaction fetched: 2zN9Ghum... (113.2ms)
🔍 Fetching transaction: 2zN9Ghum... (attempt 1/4)
🔍 Fetching transaction: 5xpEZh5x... (attempt 1/4)
✅ Transaction fetched: 2zN9Ghum... (101.0ms)
✅ Transaction fetched: 5xpEZh5x... (93.1ms)
🔍 Fetching transaction: 5xpEZh5x... (attempt 1/4)
🔍 Fetching transaction: mo1hJqYB... (attempt 1/4)
✅ Transaction fetched: 5xpEZh5x... (101.8ms)
✅ Transaction fetched: mo1hJqYB... (418.1ms)
🔍 Fetching transaction: mo1hJqYB... (attempt 1/4)
🔍 Fetching transaction: nFJzvCHc... (attempt 1/4)
✅ Transaction fetched: mo1hJqYB... (409.0ms)
✅ Transaction fetched: nFJzvCHc... (110.2ms)
🔍 Fetching transaction: nFJzvCHc... (attempt 1/4)
🔍 Fetching transaction: 3uB5PqWe... (attempt 1/4)
✅ Transaction fetched: nFJzvCHc... (101.7ms)
✅ Transaction fetched: 3uB5PqWe... (83.0ms)
🔍 Fetching transaction: 3uB5PqWe... (attempt 1/4)
🔍 Fetching transaction: 66r1TifX... (attempt 1/4)
✅ Transaction fetched: 3uB5PqWe... (102.6ms)
🔍 STARTING TRANSACTION PIPELINE DEBUG
📊 STAGE 1: FETCHING TRANSACTIONS
✅ Transaction fetched: 66r1TifX... (121.9ms)
🔍 Fetching transaction: 66r1TifX... (attempt 1/4)
🔍 Fetching transaction: JT3B8Wvq... (attempt 1/4)
✅ Transaction fetched: 66r1TifX... (101.9ms)
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  ⏱️ Fetch time: 26.9ms
🔍 STAGE 2: TRANSACTION VALIDATION
  ✅ Raydium valid: 16/20
  ✅ PumpFun valid: 16/20
  ✅ Orca valid: 7/10
🔍 STAGE 3: DEDUPLICATION
  📊 DEDUP: 49 unique, 1 duplicates removed
  ⚠️ Duplicate signatures: 4FBvvLVAydGCdcbUdg2iz7ZYEq8eX8ebGgti9UrgUAcZdeyzkpAzEXXZtDxJ6M2pjbDTDi7X14K1h5EVwNPFrjxX
🔍 STAGE 4: PROGRAM ID EXTRACTION
🎯 Cache hit: 662Djpza... (0.0ms)
🎯 Cache hit: 5d4V6GBz... (0.0ms)
🎯 Cache hit: 4ogDv2tH... (0.0ms)
🎯 Cache hit: 2XscioQj... (0.0ms)
🎯 Cache hit: 3ZVTVQeh... (0.0ms)
🎯 Cache hit: 4FBvvLVA... (0.0ms)
🎯 Cache hit: xuhPv78N... (0.0ms)
🎯 Cache hit: 3n2B4aKA... (0.0ms)
🎯 Cache hit: NMbTuBZE... (0.0ms)
🎯 Cache hit: 5ZqEcfyQ... (0.0ms)
🎯 Cache hit: 3NFEeMor... (0.0ms)
🎯 Cache hit: AUAwhEAp... (0.0ms)
🎯 Cache hit: 4C5fNq7F... (0.0ms)
🎯 Cache hit: 4PBQehVi... (0.0ms)
🎯 Cache hit: bsWAmbZm... (0.0ms)
🎯 Cache hit: 4V2Bbgi2... (0.0ms)
🎯 Cache hit: 2i1zu7uH... (0.0ms)
🎯 Cache hit: 5uPgu8Yx... (0.0ms)
🎯 Cache hit: 5S4TBTKA... (0.0ms)
🎯 Cache hit: 55gSdLbt... (0.0ms)
🎯 Cache hit: 41Zcc4P8... (0.0ms)
🎯 Cache hit: 5gdwXnrK... (0.0ms)
🎯 Cache hit: 5hi67iND... (0.0ms)
🎯 Cache hit: 64Jfp3xx... (0.0ms)
🎯 Cache hit: 5NQLMY2E... (0.0ms)
🎯 Cache hit: 3U7wm7Bc... (0.0ms)
🎯 Cache hit: 3tFiePTF... (0.0ms)
🎯 Cache hit: 2zN9Ghum... (0.0ms)
🎯 Cache hit: 5xpEZh5x... (0.0ms)
🎯 Cache hit: mo1hJqYB... (0.0ms)
🎯 Cache hit: nFJzvCHc... (0.0ms)
🎯 Cache hit: 3uB5PqWe... (0.0ms)
🎯 Cache hit: 66r1TifX... (0.0ms)
✅ Transaction fetched: JT3B8Wvq... (114.2ms)
🔍 Fetching transaction: JT3B8Wvq... (attempt 1/4)
🔍 Fetching transaction: JT3B8Wvq... (attempt 1/4)
🔍 Fetching transaction: 2FUigDhJ... (attempt 1/4)
✅ Transaction fetched: JT3B8Wvq... (101.5ms)
✅ Transaction fetched: JT3B8Wvq... (100.0ms)
✅ Transaction fetched: 2FUigDhJ... (74.9ms)
🔍 Fetching transaction: 2FUigDhJ... (attempt 1/4)
🔍 Fetching transaction: 2FUigDhJ... (attempt 1/4)
🔍 Fetching transaction: 4HPwG7Vu... (attempt 1/4)
✅ Transaction fetched: 2FUigDhJ... (102.0ms)
✅ Transaction fetched: 2FUigDhJ... (102.2ms)
✅ Transaction fetched: 4HPwG7Vu... (91.7ms)
🔍 Fetching transaction: 4HPwG7Vu... (attempt 1/4)
🔍 Fetching transaction: 4HPwG7Vu... (attempt 1/4)
🔍 Fetching transaction: qP8TLoUH... (attempt 1/4)
✅ Transaction fetched: 4HPwG7Vu... (102.0ms)
✅ Transaction fetched: 4HPwG7Vu... (102.2ms)
✅ Transaction fetched: qP8TLoUH... (121.5ms)
🔍 Fetching transaction: qP8TLoUH... (attempt 1/4)
🔍 Fetching transaction: qP8TLoUH... (attempt 1/4)
🔍 Fetching transaction: 5a6xrHCW... (attempt 1/4)
✅ Transaction fetched: qP8TLoUH... (101.0ms)
✅ Transaction fetched: qP8TLoUH... (101.2ms)
✅ Transaction fetched: 5a6xrHCW... (89.1ms)
🔍 Fetching transaction: 5a6xrHCW... (attempt 1/4)
🔍 Fetching transaction: 5a6xrHCW... (attempt 1/4)
🔍 Fetching transaction: 5DWS6jPK... (attempt 1/4)
✅ Transaction fetched: 5a6xrHCW... (101.6ms)
✅ Transaction fetched: 5a6xrHCW... (101.9ms)
✅ Transaction fetched: 5DWS6jPK... (109.5ms)
🔍 Fetching transaction: 5DWS6jPK... (attempt 1/4)
🔍 Fetching transaction: 5DWS6jPK... (attempt 1/4)
🔍 Fetching transaction: 4fvHX2GS... (attempt 1/4)
✅ Transaction fetched: 5DWS6jPK... (101.8ms)
✅ Transaction fetched: 5DWS6jPK... (101.5ms)
✅ Transaction fetched: 4fvHX2GS... (88.2ms)
🔍 Fetching transaction: 4fvHX2GS... (attempt 1/4)
🔍 Fetching transaction: 4fvHX2GS... (attempt 1/4)
🔍 Fetching transaction: 47Gegiki... (attempt 1/4)
✅ Transaction fetched: 4fvHX2GS... (101.3ms)
✅ Transaction fetched: 4fvHX2GS... (101.5ms)
✅ Transaction fetched: 47Gegiki... (105.4ms)
🔍 Fetching transaction: 47Gegiki... (attempt 1/4)
🔍 Fetching transaction: 47Gegiki... (attempt 1/4)
🔍 Fetching transaction: 26U4M7rS... (attempt 1/4)
✅ Transaction fetched: 47Gegiki... (102.3ms)
✅ Transaction fetched: 47Gegiki... (102.5ms)
✅ Transaction fetched: 26U4M7rS... (107.6ms)
🔍 Fetching transaction: 26U4M7rS... (attempt 1/4)
🔍 Fetching transaction: 26U4M7rS... (attempt 1/4)
🔍 Fetching transaction: 482VMPam... (attempt 1/4)
✅ Transaction fetched: 26U4M7rS... (102.0ms)
✅ Transaction fetched: 26U4M7rS... (102.2ms)
✅ Transaction fetched: 482VMPam... (102.3ms)
🔍 Fetching transaction: 482VMPam... (attempt 1/4)
🔍 Fetching transaction: 482VMPam... (attempt 1/4)
🔍 Fetching transaction: 2jAYG3AX... (attempt 1/4)
✅ Transaction fetched: 482VMPam... (101.2ms)
✅ Transaction fetched: 482VMPam... (101.4ms)
✅ Transaction fetched: 2jAYG3AX... (103.9ms)
🔍 Fetching transaction: 2jAYG3AX... (attempt 1/4)
🔍 Fetching transaction: 2jAYG3AX... (attempt 1/4)
🔍 Fetching transaction: 3bsZC2c1... (attempt 1/4)
✅ Transaction fetched: 2jAYG3AX... (100.5ms)
✅ Transaction fetched: 2jAYG3AX... (100.6ms)
✅ Transaction fetched: 3bsZC2c1... (96.7ms)
🔍 Fetching transaction: 3bsZC2c1... (attempt 1/4)
🔍 Fetching transaction: 3bsZC2c1... (attempt 1/4)
🔍 Fetching transaction: 3uTQfVDJ... (attempt 1/4)
✅ Transaction fetched: 3bsZC2c1... (102.4ms)
✅ Transaction fetched: 3bsZC2c1... (102.6ms)
✅ Transaction fetched: 3uTQfVDJ... (95.0ms)
🔍 Fetching transaction: 3uTQfVDJ... (attempt 1/4)
🔍 Fetching transaction: 3uTQfVDJ... (attempt 1/4)
🔍 Fetching transaction: 5L4zwcB9... (attempt 1/4)
✅ Transaction fetched: 3uTQfVDJ... (103.0ms)
✅ Transaction fetched: 3uTQfVDJ... (103.1ms)
✅ Transaction fetched: 5L4zwcB9... (107.7ms)
🔍 Fetching transaction: 5L4zwcB9... (attempt 1/4)
🔍 Fetching transaction: 5L4zwcB9... (attempt 1/4)
🔍 Fetching transaction: 4SwUXpCV... (attempt 1/4)
✅ Transaction fetched: 5L4zwcB9... (101.4ms)
✅ Transaction fetched: 5L4zwcB9... (101.5ms)
✅ Transaction fetched: 4SwUXpCV... (124.4ms)
🔍 Fetching transaction: 4SwUXpCV... (attempt 1/4)
🔍 Fetching transaction: 4SwUXpCV... (attempt 1/4)
🔍 Fetching transaction: rCESCgZQ... (attempt 1/4)
✅ Transaction fetched: 4SwUXpCV... (102.3ms)
✅ Transaction fetched: 4SwUXpCV... (102.3ms)
✅ Transaction fetched: rCESCgZQ... (89.6ms)
🔍 Fetching transaction: rCESCgZQ... (attempt 1/4)
🔍 Fetching transaction: rCESCgZQ... (attempt 1/4)
  📊 Program distribution:
    - ComputeBudget_Program: 86 transactions (ComputeB...)
    - null: 7 transactions (FgXpcyyV...)
    - null: 16 transactions (11111111...)
    - Token_Program: 9 transactions (Tokenkeg...)
    - Raydium_AMM_V4: 3 transactions (675kPX9M...)
    - null: 4 transactions (King7ki4...)
    - AssociatedToken_Program: 4 transactions (ATokenGP...)
    - null: 2 transactions (JUP6LkbZ...)
    - null: 3 transactions (FoaFt2Dt...)
    - null: 1 transactions (CwU7m7Ui...)
    - PumpFun: 20 transactions (6EF8rrec...)
    - null: 1 transactions (pAMMBay6...)
    - null: 1 transactions (AxiomfHa...)
    - null: 1 transactions (EZ64Ht81...)
    - null: 2 transactions (BMbP6rg3...)
    - Orca_Whirlpool: 1 transactions (whirLbMi...)
    - null: 8 transactions (bank7GaK...)
🔍 STAGE 5: TRANSACTION PROCESSING
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '662DjpzaKgzt4pindTQgadQwX2HyQkBRPZx9jZq7Z46bFkFRFdeRKo3yNHC4xLY25UbmCHxqLHC81CR9wQCAke5B', processed: 0 }
🎯 Cache hit: 662Djpza... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FgXpcyyVp5tZ...
    ⚡ UNKNOWN PROGRAM: FgXpcyyV... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '5d4V6GBzY4FMyu47Noww243KxGNKxBfDvWUEYu7oeJN22QN8a5zVHJnZECHR5fxmhk1qibPoPF8rtdXta5Xf81ZC', processed: 1 }
🎯 Cache hit: 5d4V6GBz... (0.0ms)
  🔬 Parsing 6 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 5d4V6GBz...
    ✅ DISCRIMINATOR RECOGNIZED: initializeV5 (V5 AMM initialization)
    ❌ RAYDIUM: Insufficient accounts for initializeV5 (18 < 21) (0.2ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
    🔍 INSTRUCTION 4: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 6 instructions
🔍 TRANSACTION DEBUG: { signature: '4ogDv2tHHmk7XWPCwudEvgVGrKA9o8PJDvafBjUptmpCyyDGLu7VfPrvv7UTpRwXoLot4TxjRGZpgYCEYRX4sZZ9', processed: 2 }
🎯 Cache hit: 4ogDv2tH... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FgXpcyyVp5tZ...
    ⚡ UNKNOWN PROGRAM: FgXpcyyV... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2XscioQjRArLJDSfXZZnwHtaYt7HDTWRTwLh24DqLLfcLfVPpkdsqskEM5q3L7vTVhX6wWLB9515KrsCVHb4i9AE', processed: 3 }
🎯 Cache hit: 2XscioQj... (0.0ms)
  🔬 Parsing 1 binary instructions
    🔍 INSTRUCTION 0: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe6
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 2XscioQj...
    🔍 UNKNOWN DISCRIMINATOR: 0xe6 - applying heuristics
    🎯 HEURISTIC: Likely LP creation - proceeding with fallback analysis
    📊 UNKNOWN DISCRIMINATOR: 0xe6 recorded (total unknown: 1)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe6
        - Account count: 18
        - AccountKeys length: 19
        ⚠️ Unknown discriminator 0xe6 - using heuristic extraction
        🔍 HEURISTIC EXTRACTION (fallback mode)
        ❌ Heuristic extraction failed: quote=false, meme=17 (0.8ms)
    ❌ RAYDIUM: Token extraction failed (1.5ms)
    ❌ NO CANDIDATE: Raydium analysis returned null
    ✅ ROUTED: Raydium analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 1 instructions
🔍 TRANSACTION DEBUG: { signature: '3ZVTVQeh5ohLwT33iKZE3bDE3DSfLnEhC3MwUR5P7PPMd5Y1tea2z2YVTCyzkLgCygqxBuAG3FJmZ4x8GoAvAUSs', processed: 4 }
🎯 Cache hit: 3ZVTVQeh... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FgXpcyyVp5tZ...
    ⚡ UNKNOWN PROGRAM: FgXpcyyV... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '4FBvvLVAydGCdcbUdg2iz7ZYEq8eX8ebGgti9UrgUAcZdeyzkpAzEXXZtDxJ6M2pjbDTDi7X14K1h5EVwNPFrjxX', processed: 5 }
🎯 Cache hit: 4FBvvLVA... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4SKMB...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: 'xuhPv78NKqrGe3admJEBsozDLuHhCzJTjAwMyMGQvYh8iV74zKfMfbtoiCDBY1AJUAp1SHmGUEobDoUv1Nh52Er', processed: 6 }
🎯 Cache hit: xuhPv78N... (0.0ms)
  🔬 Parsing 7 binary instructions
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
    🔍 INSTRUCTION 4: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=JUP6LkbZbjS1...
    ⚡ UNKNOWN PROGRAM: JUP6LkbZ... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 6: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 7 instructions
🔍 TRANSACTION DEBUG: { signature: '3n2B4aKAnp259iCYbnQ87GbQDSWYyGhc1Jj6MHhBaBBuc1QMLc43PutQbvC2ZEJHkDEG2Mi6ermkVGKN3RUNjSMu', processed: 7 }
🎯 Cache hit: 3n2B4aKA... (0.0ms)
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
🔍 TRANSACTION DEBUG: { signature: 'NMbTuBZExQN3w6QTMwDfAXk9EoK3k5PAfn2dofgJUobYSScEBTSiXeyECkqgXKHSNriWWnG7yLeRjFTbbKPWYTX', processed: 8 }
🎯 Cache hit: NMbTuBZE... (0.0ms)
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
🔍 TRANSACTION DEBUG: { signature: '5ZqEcfyQgb62dyLE1f2CwdBvvVzhQhKt9U4WQKATki8C3y36MWquzqcVijzg5ZZ12DWhbxjVu2NfjnPqfk329U4x', processed: 9 }
🎯 Cache hit: 5ZqEcfyQ... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FgXpcyyVp5tZ...
    ⚡ UNKNOWN PROGRAM: FgXpcyyV... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '3NFEeMoraYfm34mbSF8VHb5vquicJj2KSPJ8ofavgp99cNHYdgK8mwWjNkHDbmkKpNNWLcymj5YugxoCwGWjP1zg', processed: 10 }
🎯 Cache hit: 3NFEeMor... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=CwU7m7UiwYCc...
    ⚡ UNKNOWN PROGRAM: CwU7m7Ui... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: 'AUAwhEApSmKEfm31qHB1av4YmfytutvaAiWofAJJzKZUnEPxqfiHM5hU3KnxAeGsMYSVFFAaRjEx6SQfb85vQZW', processed: 11 }
🎯 Cache hit: AUAwhEAp... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4SKMB...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '47GegikiXJJpkpVQCiWBYhxGbGpVo3vGvDZNnrLXd5bj27bcm3pLnv3GtqeBY5niNHYTUv7tJVv4ceUEUMrNPNUL', processed: 12 }
🎯 Cache hit: 47Gegiki... (0.0ms)
  🔬 Parsing 6 binary instructions
    🔍 INSTRUCTION 0: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=BMbP6rg3HDT9...
    ⚡ UNKNOWN PROGRAM: BMbP6rg3... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 4: program=BMbP6rg3HDT9...
    ⚡ UNKNOWN PROGRAM: BMbP6rg3... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=whirLbMiicVd...
    🎯 ROUTING TO ORCA ANALYSIS
    🌊 ORCA DETAILED ANALYSIS:
      - Discriminator: 0xe7
      - Data length: 43 bytes
      - Account count: 11
  - instructionData: EXISTS (length: 43)
  - accounts: EXISTS (length: 11)
  - accountKeys: EXISTS (length: 16)
    ⚡ Moderate account count: 11
    ✅ Good data length: 43 bytes
    ✅ LP mint detected: 11
    ✅ Reasonable amounts found: 4
    🎯 HIGH CONFIDENCE LP CREATION (score: 8)
    🎯 ORCA: LP creation detected (score: 8)
    📊 Orca LP params: bump=83, tickSpacing=46680, sqrtPrice=223149740567014019
    🧮 Orca entropy: 1.585 bits, binary confidence: 0.829
    ✅ ORCA: Candidate created (1.7ms)
    ✅ CANDIDATE GENERATED: Orca (7922.386875ms)
    ✅ ROUTED: Orca analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '26U4M7rSLXZ8VhpYjkwP6sehFRGsV4tgpcd6q1xovyjxoiLWDe5s6HNpqycHSRKEWNxitWgHxnbZcTNqSMrMEySU', processed: 13 }
🎯 Cache hit: 26U4M7rS... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=bank7GaK8Lkj...
    ⚡ UNKNOWN PROGRAM: bank7GaK... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '482VMPamU7JH4C8d1VirP38nrKKNSCtNbuPNgae9rtSG3B6oAZMSRtanpu1HbXiNNQuG5Norm29FT76Q9oHKZTWr', processed: 14 }
🎯 Cache hit: 482VMPam... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=bank7GaK8Lkj...
    ⚡ UNKNOWN PROGRAM: bank7GaK... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '2jAYG3AXyRzQ18D7EooryXGCzDR3xnXmCCg4GqbgzGnJrYQmMrESUBjUFUH78YbX1Xi588F2XyCtB7wu85yNtDS', processed: 15 }
🎯 Cache hit: 2jAYG3AX... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=bank7GaK8Lkj...
    ⚡ UNKNOWN PROGRAM: bank7GaK... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '3bsZC2c1ZFpuLWqzBf743DbwnQz5Yp1z9FoUebpHy3XFFWpj1JJ52gutXSeZWwmawdSGW9py5nQcBYGaELXkDTX1', processed: 16 }
🎯 Cache hit: 3bsZC2c1... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=bank7GaK8Lkj...
    ⚡ UNKNOWN PROGRAM: bank7GaK... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '3uTQfVDJgtMdTV5SGBzigTYhr6n2ZiAgXr1GvWfcupqgNoYjv3mb9neVp8WMBGA51RbP4wFxNjmBsAnLRnoSPy6E', processed: 17 }
🎯 Cache hit: 3uTQfVDJ... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=bank7GaK8Lkj...
    ⚡ UNKNOWN PROGRAM: bank7GaK... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '5L4zwcB9EuuHbESut5gNtbiRkF2dV8pfzWkvx7knVbapxW1AmvPUyMqJZePQvgSLRUj2x4oVyiCQ5jQZxJqMivha', processed: 18 }
🎯 Cache hit: 5L4zwcB9... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=bank7GaK8Lkj...
    ⚡ UNKNOWN PROGRAM: bank7GaK... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '4SwUXpCVF9K7GwM94U89UZMvT7HhzyPSvGpSS5SW7jbuw8U8gsmBxxWFGpNaFfvyVF2s1c5R53hEkEDMFkLixZT', processed: 19 }
🎯 Cache hit: 4SwUXpCV... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=bank7GaK8Lkj...
    ⚡ UNKNOWN PROGRAM: bank7GaK... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: 'rCESCgZQmiZPFogmBdewof8gS4SL3DJYVH9SR5Retxu9uRieKiozV5XSoQwEbC6gJYka6zrasR8oZGrNmzGgosD', processed: 20 }
🎯 Cache hit: rCESCgZQ... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=bank7GaK8Lkj...
    ⚡ UNKNOWN PROGRAM: bank7GaK... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '4C5fNq7F6N9Zuf1nTeLpHzgTa8NWtohwfbVSxM9o1hkiEvxrKVmGjkE5qqYM4CDtpHv5g3AeGdLDDHyKEJsu9vvG', processed: 21 }
🎯 Cache hit: 4C5fNq7F... (0.0ms)
  🔬 Parsing 6 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=111111111111...
    ⚡ UNKNOWN PROGRAM: 11111111... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=675kPX9MHTjS...
    🎯 ROUTING TO RAYDIUM ANALYSIS
    🎯 RAYDIUM DETAILED ANALYSIS:
      - Discriminator: 0xe8
      - Data length: 17 bytes
      - Account count: 18
      - Signature: 4C5fNq7F...
    ✅ DISCRIMINATOR RECOGNIZED: initialize (Original LP creation format)
    ✅ RAYDIUM: Structure validation passed
    🔍 EXTRACTING TOKEN MINTS (DISCRIMINATOR-AWARE):
      🔍 ADVANCED RAYDIUM TOKEN EXTRACTION:
        - Discriminator: 0xe8
        - Account count: 18
        - AccountKeys length: 25
        - Layout: INITIALIZE
        - Min accounts: 18
        - Coin mint index: 23 (position 7)
        - PC mint index: 7 (position 8)
        - AMM ID index: 3 (position 3)
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: Bsq7bZSvwbXwjr4mQmuqoPEnKnpFone5SGeqwUYCi1bn
        - AMM ID: AkCV3hCBqHRNkuufmb4AXFiCcye8UJZksEXRmLtr5n5A
        ⚠️ Unknown pair: coin=srmqPvym..., pc=Bsq7bZSv...
        ✅ Layout extraction successful (0.2ms)
    ✅ RAYDIUM: Tokens extracted via layout_based (confidence: high)
⚠️ RPC validation slow: 2.8ms (target: <1ms)
⚠️ SLOW TOKEN VALIDATION: Bsq7bZSv... took 2.8ms (target: <1ms)
    ⚡ VALIDATION: primary=0.00 secondary=0.40 (3.2ms)
    🟡 RAYDIUM PERMISSIVE: Potential meme opportunity (confidence: 12.0)
    ✅ CANDIDATE GENERATED: Raydium (7929.5775ms)
    ✅ ROUTED: Raydium analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '4PBQehVimZh5rXPhfZVgaGCRHaGuY27wLZmpPzd9h2gSt9QBfKN537f6FSYgcMmEiEmpGq8m1P8mvWvxWBj5p5oq', processed: 22 }
🎯 Cache hit: 4PBQehVi... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FgXpcyyVp5tZ...
    ⚡ UNKNOWN PROGRAM: FgXpcyyV... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: 'bsWAmbZmZ6dKEdUKph84e4c688R5JSJGhc6C6CDUCnD3Kjsk6ynqP3tFhi5h8W9Cmv6q521EY9BLZrtgRzyeKvR', processed: 23 }
🎯 Cache hit: bsWAmbZm... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4SKMB...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '4V2Bbgi2nEC5sj3Zk7JXWZFVo9omQxt4vwNQ8RkNKvxeCL4Qn2Wrvi1D32j3RL7Yy4DSWNr5PGHkjjiFxNH5eFL2', processed: 24 }
🎯 Cache hit: 4V2Bbgi2... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FgXpcyyVp5tZ...
    ⚡ UNKNOWN PROGRAM: FgXpcyyV... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2i1zu7uHrgKT36VaqVDFC74r2JRyNeT91vdct9qitLSCtadgTEA49H3pqAauDfvKUKmQ6ncX2pvXYBeTdVUsgYVu', processed: 25 }
🎯 Cache hit: 2i1zu7uH... (0.0ms)
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
🔍 TRANSACTION DEBUG: { signature: '5uPgu8YxjTQhM2RkrwxrEoSu9pRfkkrk4XQQMh3iWeJgVMHAvi6TYcXsp5FfqeiaGFgp9V4Z2Fjq5dh9uDTqLbgn', processed: 26 }
🎯 Cache hit: 5uPgu8Yx... (0.0ms)
  🔬 Parsing 7 binary instructions
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
    🔍 INSTRUCTION 4: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 5: program=JUP6LkbZbjS1...
    ⚡ UNKNOWN PROGRAM: JUP6LkbZ... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 6: program=TokenkegQfeZ...
    ⚡ UNKNOWN PROGRAM: Token_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 7 instructions
🔍 TRANSACTION DEBUG: { signature: '5S4TBTKAhpxFRLPDLca4rk3iVjtbmpNPN3HA72S5JwvMMmMuRYfBJjBdmWXGxk4ddj96FRLkxu3zBBzXxoS3AvLa', processed: 27 }
🎯 Cache hit: 5S4TBTKA... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=King7ki4SKMB...
    ⚡ UNKNOWN PROGRAM: King7ki4... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '55gSdLbtzqjhYr2Ye56JT9P3MbayxXs9JVuKUkCehcuCovKN7rsnBRrc9vYniaKgPDPMjY64TqVWvZxVwAnWaRBA', processed: 28 }
🎯 Cache hit: 55gSdLbt... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=FgXpcyyVp5tZ...
    ⚡ UNKNOWN PROGRAM: FgXpcyyV... (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 3: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '41Zcc4P8NcqyR4nGFhAdaiNpK5urpquyqsjGGRMmXJAPZpiscUKAnSwgTqD2tRpao3nGex7uAjkKgvagKFdna8K8', processed: 29 }
🎯 Cache hit: 41Zcc4P8... (0.0ms)
  🔬 Parsing 1 binary instructions
    🔍 INSTRUCTION 0: program=6EF8rrecthR5...
    🎯 ROUTING TO PUMPFUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x00
      - Data length: 24 bytes
      - Account count: 14
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 14)
  - accountKeys: EXISTS (length: 14)
    ⚡ Moderate account count: 14
    ✅ LP mint detected: 14
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 14
    ✅ Valid instruction data length for Pump.fun: 24
    🚀 PUMP.FUN BOOST: 5 → 12 (already passing)
    🔍 PUMP.FUN SCORING DEBUG: {
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  originalScore: 5,
  finalScore: 12,
  threshold: 7,
  willCreateCandidate: true,
  boostApplied: 7
}
    ✅ THRESHOLD CHECK: Pump.fun score=12, threshold=7, WILL CREATE CANDIDATE=true
    🎯 HIGH CONFIDENCE LP CREATION (score: 12)
    🎯 PUMP.FUN: LP creation detected (score: 12)
    🎯 Parsing pump.fun create instruction
    ⚠️ PUMP.FUN: Unexpected bonding curve address: CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0.8 reason=pump_fun_heuristic
    ✅ PUMP.FUN TOKEN VALIDATED: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (confidence: 17, validation: 0.8)
    ✅ PUMP.FUN: Candidate created (1.7ms)
    ✅ CANDIDATE GENERATED: PumpFun (7933.439958ms)
    ✅ ROUTED: PumpFun analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '5gdwXnrK1cuiPVhZbKb7k3NcPuD1UML1FCY9U8YdjeXY4aUJiuYCeyjh64CXgF5uFufaNqeonxwwVpoh7rDbKH1X', processed: 30 }
🎯 Cache hit: 5gdwXnrK... (0.0ms)
  🔬 Parsing 4 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=6EF8rrecthR5...
    🎯 ROUTING TO PUMPFUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x00
      - Data length: 24 bytes
      - Account count: 14
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 14)
  - accountKeys: EXISTS (length: 15)
    ⚡ Moderate account count: 14
    ✅ LP mint detected: 14
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 14
    ✅ Valid instruction data length for Pump.fun: 24
    🚀 PUMP.FUN BOOST: 5 → 12 (already passing)
    🔍 PUMP.FUN SCORING DEBUG: {
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  originalScore: 5,
  finalScore: 12,
  threshold: 7,
  willCreateCandidate: true,
  boostApplied: 7
}
    ✅ THRESHOLD CHECK: Pump.fun score=12, threshold=7, WILL CREATE CANDIDATE=true
    🎯 HIGH CONFIDENCE LP CREATION (score: 12)
    🎯 PUMP.FUN: LP creation detected (score: 12)
    🎯 Parsing pump.fun create instruction
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0.8 reason=pump_fun_heuristic
    ✅ PUMP.FUN TOKEN VALIDATED: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (confidence: 17, validation: 0.8)
    ✅ PUMP.FUN: Candidate created (0.8ms)
    ✅ CANDIDATE GENERATED: PumpFun (7934.737541ms)
    ✅ ROUTED: PumpFun analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '5hi67iNDZjgSmxXaHC4fZ9Yh4wsqoqqNReHLYfrTjvmPkgw7A3ibXWw33vbwEybR3AWz1uRmUiSLU3JnRJU7rdSY', processed: 31 }
🎯 Cache hit: 5hi67iND... (0.0ms)
  🔬 Parsing 1 binary instructions
    🔍 INSTRUCTION 0: program=6EF8rrecthR5...
    🎯 ROUTING TO PUMPFUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x00
      - Data length: 24 bytes
      - Account count: 14
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 14)
  - accountKeys: EXISTS (length: 14)
    ⚡ Moderate account count: 14
    ✅ LP mint detected: 14
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 14
    ✅ Valid instruction data length for Pump.fun: 24
    🚀 PUMP.FUN BOOST: 5 → 12 (already passing)
    🔍 PUMP.FUN SCORING DEBUG: {
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  originalScore: 5,
  finalScore: 12,
  threshold: 7,
  willCreateCandidate: true,
  boostApplied: 7
}
    ✅ THRESHOLD CHECK: Pump.fun score=12, threshold=7, WILL CREATE CANDIDATE=true
    🎯 HIGH CONFIDENCE LP CREATION (score: 12)
    🎯 PUMP.FUN: LP creation detected (score: 12)
    🎯 Parsing pump.fun create instruction
    ⚠️ PUMP.FUN: Unexpected bonding curve address: CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0.8 reason=pump_fun_heuristic
    ✅ PUMP.FUN TOKEN VALIDATED: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (confidence: 17, validation: 0.8)
    ✅ PUMP.FUN: Candidate created (0.8ms)
    ✅ CANDIDATE GENERATED: PumpFun (7936.016791ms)
    ✅ ROUTED: PumpFun analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '64Jfp3xxyPH6jnGgwyz9vXboiRnXPxPJwbv5ezGQwKf9BovoqFh2pkW7NQA7HpbXFpnm6TSksNAmSeVd8LrMRRDM', processed: 32 }
🎯 Cache hit: 64Jfp3xx... (0.0ms)
  🔬 Parsing 6 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=6EF8rrecthR5...
    🎯 ROUTING TO PUMPFUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0xe0
      - Data length: 8 bytes
      - Account count: 5
  - instructionData: EXISTS (length: 8)
  - accounts: EXISTS (length: 5)
  - accountKeys: EXISTS (length: 14)
    🚀 Pump.fun program detected - applying scoring boost
    🚀 PUMP.FUN BOOST: 4 → 10 (threshold guaranteed)
    🔍 PUMP.FUN SCORING DEBUG: {
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  originalScore: 1,
  finalScore: 10,
  threshold: 7,
  willCreateCandidate: true,
  boostApplied: 9
}
    ✅ THRESHOLD CHECK: Pump.fun score=10, threshold=7, WILL CREATE CANDIDATE=true
    🎯 HIGH CONFIDENCE LP CREATION (score: 10)
    🎯 PUMP.FUN: LP creation detected (score: 10)
    🎯 Parsing pump.fun create instruction
    ⚠️ PUMP.FUN: Unexpected bonding curve address: eMiFj23BMmvCYf1A2r5oJ6nkKeujanhVoT2Z1BkSQCC
    ✅ PUMP.FUN: token=7tzF6P7mbi4rccC5VaR7m9ERxLuQzqn1UWLZx7AjnqHh, vault=eMiFj23BMmvCYf1A2r5oJ6nkKeujanhVoT2Z1BkSQCC
    ⚡ VALIDATION: 7tzF6P7mbi4rccC5VaR7m9ERxLuQzqn1UWLZx7AjnqHh (0ms) confidence=0.8 reason=pump_fun_heuristic
    ✅ PUMP.FUN TOKEN VALIDATED: 7tzF6P7mbi4rccC5VaR7m9ERxLuQzqn1UWLZx7AjnqHh (confidence: 14, validation: 0.8)
    ✅ PUMP.FUN: Candidate created (0.9ms)
    ✅ CANDIDATE GENERATED: PumpFun (7937.252333ms)
    ✅ ROUTED: PumpFun analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '5NQLMY2EUoxbGw5iFgD6d7sFhweszVjeQ6zqdUwHj9TzyyigAcxhx2Lpo9PCGHCPwEt8xkxwSfTnjjX19EpPHT4v', processed: 33 }
🎯 Cache hit: 5NQLMY2E... (0.0ms)
  🔬 Parsing 3 binary instructions
    🔍 INSTRUCTION 0: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 1: program=ComputeBudge...
    ⚡ UNKNOWN PROGRAM: ComputeBudget_Program (using fallback parsing)
    ✅ ROUTED: Unknown analysis - no candidate
    🔍 INSTRUCTION 2: program=6EF8rrecthR5...
    🎯 ROUTING TO PUMPFUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x00
      - Data length: 24 bytes
      - Account count: 14
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 14)
  - accountKeys: EXISTS (length: 15)
    ⚡ Moderate account count: 14
    ✅ LP mint detected: 14
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 14
    ✅ Valid instruction data length for Pump.fun: 24
    🚀 PUMP.FUN BOOST: 5 → 12 (already passing)
    🔍 PUMP.FUN SCORING DEBUG: {
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  originalScore: 5,
  finalScore: 12,
  threshold: 7,
  willCreateCandidate: true,
  boostApplied: 7
}
    ✅ THRESHOLD CHECK: Pump.fun score=12, threshold=7, WILL CREATE CANDIDATE=true
    🎯 HIGH CONFIDENCE LP CREATION (score: 12)
    🎯 PUMP.FUN: LP creation detected (score: 12)
    🎯 Parsing pump.fun create instruction
    ⚠️ PUMP.FUN: Unexpected bonding curve address: 62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0.8 reason=pump_fun_heuristic
    ✅ PUMP.FUN TOKEN VALIDATED: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (confidence: 17, validation: 0.8)
    ✅ PUMP.FUN: Candidate created (0.6ms)
    ✅ CANDIDATE GENERATED: PumpFun (7938.129208ms)
    ✅ ROUTED: PumpFun analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '3U7wm7BckmWG2syw7gj3DhUm2uSeiaFg7MWhMCDTbk3zgTeAtE1422DsqYXRc9qf3L4dgS5tT6EaYzNdhdEuXnWF', processed: 34 }
🎯 Cache hit: 3U7wm7Bc... (0.0ms)
  🔬 Parsing 1 binary instructions
    🔍 INSTRUCTION 0: program=6EF8rrecthR5...
    🎯 ROUTING TO PUMPFUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x00
      - Data length: 24 bytes
      - Account count: 14
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 14)
  - accountKeys: EXISTS (length: 14)
    ⚡ Moderate account count: 14
    ✅ LP mint detected: 14
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 14
    ✅ Valid instruction data length for Pump.fun: 24
    🚀 PUMP.FUN BOOST: 5 → 12 (already passing)
    🔍 PUMP.FUN SCORING DEBUG: {
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  originalScore: 5,
  finalScore: 12,
  threshold: 7,
  willCreateCandidate: true,
  boostApplied: 7
}
    ✅ THRESHOLD CHECK: Pump.fun score=12, threshold=7, WILL CREATE CANDIDATE=true
    🎯 HIGH CONFIDENCE LP CREATION (score: 12)
    🎯 PUMP.FUN: LP creation detected (score: 12)
    🎯 Parsing pump.fun create instruction
    ⚠️ PUMP.FUN: Unexpected bonding curve address: CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0.8 reason=pump_fun_heuristic
    ✅ PUMP.FUN TOKEN VALIDATED: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (confidence: 17, validation: 0.8)
    ✅ PUMP.FUN: Candidate created (0.8ms)
    ✅ CANDIDATE GENERATED: PumpFun (7939.127416ms)
    ✅ ROUTED: PumpFun analysis - candidate generated
🔍 TRANSACTION DEBUG: { signature: '3tFiePTFDGA4AT8E6odfzQkyZWr6ooV2G7oaHZ8VoJsE1pnr7b3vpwuAhtMRc9LzRjxyDz16pRXx4Z4nkQcYam8E', processed: 35 }
🎯 Cache hit: 3tFiePTF... (0.0ms)
  🔬 Parsing 1 binary instructions
    🔍 INSTRUCTION 0: program=6EF8rrecthR5...
    🎯 ROUTING TO PUMPFUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x00
      - Data length: 24 bytes
      - Account count: 14
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 14)
  - accountKeys: EXISTS (length: 14)
    ⚡ Moderate account count: 14
    ✅ LP mint detected: 14
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 14
    ✅ Valid instruction data length for Pump.fun: 24
    🚀 PUMP.FUN BOOST: 5 → 12 (already passing)
    🔍 PUMP.FUN SCORING DEBUG: {
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  originalScore: 5,
  finalScore: 12,
  threshold: 7,
  willCreateCandidate: true,
  boostApplied: 7

