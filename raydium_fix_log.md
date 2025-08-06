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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.873Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.880Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.880Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.884Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.884Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.912Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.912Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.912Z"}
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
info: 📊 Metrics server listening on port 9186 {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.915Z"}
info: 📊 Prometheus metrics: http://localhost:9186/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.915Z"}
info: 💚 Health check: http://localhost:9186/health {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:20.915Z"}
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
[THORP] System initialized successfully in 61ms
[THORP] Services: rpcManager, circuitBreaker, batchProcessor, workerPool, poolParser, lpDetector, tieredTokenFilter

✅ THORP SYSTEM FULLY OPERATIONAL
🎯 Ready for meme coin detection and trading
📡 Monitoring Solana mainnet via Helius Enhanced WebSocket
🧠 Renaissance mathematical algorithms active

Connected to mainnet.helius-rpc.com:443
Math worker 1 started
Math worker 2 started
Worker 2 is ready
Math worker 1 ready for tasks
Worker 1 is ready
Math worker 2 ready for tasks
✅ Secure TLS connection established to mainnet.helius-rpc.com
   Protocol: TLSv1.2
   Cipher: ECDHE-RSA-AES128-GCM-SHA256
🔗 Production Helius WebSocket connected
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-02T22:34:21.090Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.27
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4Gh2WP7jRtZXzrtiNbL2rgSEBe7QXi7pWCsH2b98QJmfacX6zL2qr61StNDqCeGdFvSZYCj4hT23KKHXFjrNxPkk', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5AzDiMumfLmoQCwgGb44rcAdCWLktFEr8gqSTTX7pBTMxAbXgxpkLwhRSWV5ZZCiGvMP9wzJwmZ5CsKyceQo1zEM', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '5rtFD9nw41weLXjcgcXSfrqsdMe7igZAdQ7CJjWkFzVstij1khdFgDTBx4PZJHaVB7YxCQQsACfyBhJuDmB2K2ty', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3bEarGruJ4AZ2P4Tzo9wRDnSCKmGrhdTn2MiuTs6MsbUKH7sedE3eeebXmic2D8HJhv3uZhF3JWc1qh5QYpkbds1', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '62FX2GVdSeBrFB5Q9b5mVo463G4Z473XqUKvpwTVRb7kpYn2kCogkPxyqdC6W9dZrfpYebEPsZEiCvQBYqibAmEz', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2AKCNZRuQLTXFEECW3YkWwaXr4n2JedoSvTxK2y6pFmhgJ79YpNjuVf39MwFq95KsuEHX7TU5fekGXJQgGrbsTog', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '375dAX2vrwxvYmGo4gH73dPkpU3FtZKfLLQzy5AAuN16EyMwRzhEnPAbr5nvengQDFtyDZcQuD4URNnT1Y9okLgt', processed: 6 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: 'cNH5fAvcSFWjAoYXe8UbSbQRwKxJTLhRA1HoK2u9iMV6dawQ2rpwwyLLX6bgCXSPpKRmdqVB9AiYJYiqbvzbMSH', processed: 7 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '2ycfLMchNDRZi4t86gtbzEkoHtdBe4qycwq2wphuNixgXa7hwhvpZXsoLMGpN8KzKvSqozSJR5LPsbWszpPew3ED', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '4PB4JPcGbogSMnpbWfZyqhuYx3G7VrpaaRb7R5E8pLniZDF5fWucGNRsaqPwS6ZhcDkgW3MdJnmidNupyq33RKiW', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '4MyW3M9wdQABTTCVDXERiUZyDdinc6Cckdeb7x7niug31mZWMkDbbcqnXBageNRBUV27L83Sde6fbyzCe1TbR4uv', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3wQGu8vjJGjCdy8P9eJUcxUFW8kmRnVH4jVpqFoKp84nM5hdeMA6WuKF2TasaUovAdHB6jSAwBbfDjZsTWNHwmY9', processed: 9 }

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
🔍 TRANSACTION DEBUG: { signature: '5rDqnCDBVnH4qP8hK8nhtrQsF8GTC2FbZyKZxK7Efa4pBVgyCGWazBc2zFEetHoC57mdiPtiC6p67Le1e6yK8P9c', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2CZBUyxviNGKRh8ffQPHTq7TJys3nrpPgfgWVbbGK9cvFCqRgetWaoUyvTgBsFRHQcXRfhLKNbyGPbjKCtLF8bU3', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '5CodAY8DrdjSMsBPAG8oFL4G9YdbRWiwGX97wygzQWSDkfbVMLTADg9ZATEriPLXvLPPAvg5bx8NkeWYJyywTbdo', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '2i68SSTwZ5s9EwVxLcmPuEz251kJQFu5z9tBkoVwU9hjJ4JpiUiQeJSfwbcd1ikJMHrtXxKE4mNirjKqbWRvYbXH', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'BbNnCg1RCw3UeuYQW9bVicVV5zgu6neJUW7QUmZXfYaxwpcfyJDZrbSRJibCD1rQ3azU8XwVfRUf13YTxFhDsvU', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '2zrHuJ5mig56Sq6HqMNqwnXLP3QgTWThbWLvyBaFa1nPtTJrmULuXTKDS7MNRhSp7rCjWR3kHwwtZJNy3HJhgWfZ', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2KGQePhgzyr2DZkveJzZezShYjFWQDFrwa8RhwNR3J9T9HvM7eQcpZ37szEw57RsCvZtVjnSzSDoXSZ6Kb9M7jVN', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '3fy7cNW68d6ECeJch2T2BeDk3ekFbmgKfe87ejBd5o7Xwgj9wEgDCiCha2iU9zFBkdkCW8iyoZMCqgnr2DSsdwME', processed: 13 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '47VUQmqoGy6hQCoqF5hZyfkQcRyhEEiCkaRDxrGufZSkRsGPNDKjV5ZUXkLZcDGbKnfcHBKnrNBK3Ln9GQHadQgE', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '5gsNn57CbxT79hUxcaXPn1HnEZp7TTi75135D2uj3woSfLQqNzg3K841gYPK59T9U1eUAtC3UhxWarGN96swUuW7', processed: 14 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '2oeL9Gg2KhgMW7b42kGRUCsco6AfRbFSsRyVhTsXrSWhuwxwzSMR38vWCdd7pno8ppQtrBy8SLFYtMw9yWSUt2wc', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2cRS9HYjrk4gESkNCS9JfTeuXURpBoZG3ddkovRADSwtAFnAEbuBy1wLnmzPHaBCoUSLJtfdFqyZk3x4wd11sS8a', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '263DMxwaUvjirvGoLFMpPjySuxozDVVKV9i7ANwXhB34aErp5dDC6xjXbyTjGc59ce6eBwLgBVoRPreSYa5FNySH', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '4C42GiXAyz9AtuH21fYPXqaSk6HfQurMetF9WpiFxz9qHK6F2iavyb3crVjcaNxpeSGsdS2gwgfaYSD5eoyoNhUg', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '4YnMWYgueBMgLPhZ1Kupie76daajaTCH9tHxLWELqmupBxukKqHeabCFmj8EP9qWcCcNpixoYzx42ZVT6SysziLk', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '3M93L6vCBMDJ8PgUxatZqTXUbdNM6ddnbY98NM2JiaqMk3i6intD4YAoF8F3t5GFQefHxAG1Q8DwztX1EkJ9EHQm', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: 'NtK5CwPKRXrnW4iErLqXtqSPjeX3MFpUHpmee3kTYqSqcj14ZZBEwBhVqEp73MrYeEbjVjWCN3PXdmefHCXC78b', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '57SfqNnU5KrWU33EAZRJchwE24BzyY6nFJbaRejZpbtKuHgCu9PhPdXV4zPHPQE9NvjWacZtRG7XtJ8iBQLVCivf', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '4eabYbehhAki2ZWV97KrVhRvSy7BtDMYzZVeEaC3LAjntE8269SfPjmR4iwMusnGS9RC8RM24yLVRJWYjVrQmiL7', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2v1RQGnddo7AuUMWKMPvja3Yn9CtmcVg7xBJwewENiEGphy8sDXeQtZvqbsWtsYWTTiLUpQhQ1aujCpndxH8jHv3', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '4zGUMhivhFykvJ1eNVh1gjhTiSihfLFMG2C4dVJdzi8ZbZhDHhjyKo61NAcoxTFkhZkwe3CmSTBM6aBCyN4mTpGG', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '2nhpdoBr5vUok176EJVsGyBJRvy1URA66TE8NhTzGM6ENVbamhfWjqMCeR8zz8pWJKcxB6gUYrPCPCTiXkSouwPS', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'NaLPcjDcK6FwMsxfA3b58jAVs2cTn8ApuNejjfnxJFkiG51Ke7dcdvyBr6PRj5rG7C7JjzDQGuhJT58drTMAuM5', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2MC2QLSHT7axdRKpSsTyXMwKN1Q3jiJEKL3T9bUHf69NbUK7BijrKhso5Mv5A6VSdWfQho8y2hu8WD8zzUbQZPNx', processed: 19 }
🔍 TRANSACTION DEBUG: { signature: '3pQeh5H3eueiGqBFpXyCayZU53Wg65Z3meiDtSvCQ76wcHkE4YPs8yqxEozzs5ZxABzDCr5Efhp98H4ag25ybzXd', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: 'zrWd8m6eB6VRMghjwrvBH1wYG6rhfJdgjqd74ShYBGk8HaSHjxmhjb4TUzzzNX6g7CuMenTbqejZz1XoCSC61hZ', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '4zouPd8W8PBr3cQNj1Gnd3DCqvzuNZPR8rF9DXsJupm3c5YcH4eCAdHdw2W1McfgGZybGmDQpoW37LDEA9YdEgLQ', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '47JoSzmL19cEHCHPkjvgZ8XXviBQs5Z2nACnmdxnryKrtohHJSeWNdxQthqGg9wZzwK8uZPQUqKcmaicpAeVdR7B', processed: 20 }
🔍 TRANSACTION DEBUG: { signature: '5o5LLkWVppss7saAR8CmxQAedgEv98UFgxYuF6ZCGzkcPStK5FH2q8KwgXLq5Z25Vdy4K34C67BjzcE7hDLxJSVn', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: 'RvQdRVfifjLdh5TYzyFpEfSxnzbsjakQZo8kCHbhiWxJGEAVV4KFLbqL9bD3cRxamW8LQf5XoRWY83sDwByFqyn', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '2U5v1hJBzDTjyL8N7BbfmNcGNNMQWstJ2vc6rknxfCLkELaqwxges1o7WnGDEsE9cw81M7Wqnc6TwkoGjKH2Er3V', processed: 6 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '2w6sgiTHhjSynHS8EVoaEHd63qdmHkhzwxJhM1dUrJQBPVtPDAqMDMmMKquZccKbdhZDzSM88oXN99zMjiyaRsDw', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: 'LAwktuYAuv8wbpL9pvLK7iz9rWFSBPRS5jsR1zRRVja2qeQZZueX7pFJcbyizyyorfevsj3wAv5ffEnUpxMwYiH', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: '2Ki6mdapdWVD7PeK2EBQCAXBwietDodb6t4NKrgtkBJsmL1unjFQJuDmLWK4RGamnB6zZbAkdWNbS8qW6x1yidu5', processed: 7 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3DJLtYTqoLS6kHwLabft4uWJHGyBCwtcNG43MuixXPoLt2uXhaLPP5zxSD99rSq15cH5NXY6YRoNLL3Lbq91cVf4', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '3Y19NgDeAaZvDozvK7eUqmJ6xHeeAYeoZiiffH5ws5Dn883s2Es3ZH6Xdd7wQkbRxGLpGQiV5H3FdqCgZFYvmcPC', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: 'W7n7S99kwXtmRV1AgT7md2EcT2DrCGMLue5bSo8K6PLgBH1QVjNxEaE87WvudAQEgzRpDZEkhTV2ppdjfjHUjYc', processed: 23 }
📊 SCAN COMPLETE: 0 candidates, 4318ms, efficiency: 3600.0%
📊 SCAN COMPLETE: 0 candidates, 533ms, efficiency: 3650.0%
📊 SCAN COMPLETE: 0 candidates, 6538ms, efficiency: 3650.0%
📊 SCAN COMPLETE: 0 candidates, 2568ms, efficiency: 3675.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 3920.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 31ms, efficiency: 4083.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4200.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 56ms, efficiency: 4287.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 43ms, efficiency: 4355.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4410.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 18ms, efficiency: 4454.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 4ms, efficiency: 4491.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4523.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 28ms, efficiency: 4550.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 65ms, efficiency: 4573.3%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.32
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 1ms, efficiency: 4593.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4611.8%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '4oXuVWMjKGwPmrF5Zg1it95MatkLP5Rcs8GWchjYA6xGEQpeJjdPXRA9Mydg2kGq72jyV26cPT4xJwDUs3MJHS9f',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: undefined,
  current_hash: '4e819b37'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  🔄 Converting account addresses to indices for 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ
  📍 Normalized accounts: 0,47,0,5,48,45,50,52,4,48,46,53,16,17,18,15,8,46,53,21,20,22,19,6,57,2,48,49,56,30,28,29,46,53,24,27,26,23,25,58,1,48,51,55,34,54,33,31,32,46,53,36,35,37,38,39,59,12,48,46,53,44,41,43,40,42,46,53,7,11,9,10,3
  ⚡ UNKNOWN PROGRAM: 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ (using fallback parsing)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: {
  signature: '41xJhAs2bTKQRAZqTLT1Ldr2HzrSfP4cVtvXin7J8Y87MzJ5cYzhFsdjuGDfN6JkDFGDAf7yBd4JyhepgUHPmSPF',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: false,
  last_hash: '4e819b37',
  current_hash: '4e819b37'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  🔄 Converting account addresses to indices for 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ
  📍 Normalized accounts: 0,47,0,5,48,45,50,52,4,48,46,53,16,17,18,15,8,46,53,21,20,22,19,6,57,2,48,49,56,30,28,29,46,53,24,27,26,23,25,58,1,48,51,55,34,54,33,31,32,46,53,36,35,37,38,39,59,12,48,46,53,44,41,43,40,42,46,53,7,11,9,10,3
  ⚡ UNKNOWN PROGRAM: 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ (using fallback parsing)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: {
  signature: '4BxAEBQ8a1LXTbNyD2ziXc8PKpGxmwSZiwApurVW6rMZkTmvuWE8xsff5KBo54hZTR2y2NSVHG4UCu2epvsz23G',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '2291263a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4e819b37',
  current_hash: '2291263a'
}
  🔬 Parsing 5 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 18,2,19,3,4,5,6,20,7,8,9,10,11,12,21,13,14,0
    ⚠️ RAYDIUM: Unknown pair - assuming coin=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, pc=nSzCQw5BwtSA8oP7HNfp5e6RBMwhFGobZQqNCpxHYXd
    ✅ RAYDIUM: pool=GiCVADuBUFPc3w6cgR2Sf9TSpbdjt1vBNmjoQRMGhve9, primary=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, secondary=nSzCQw5BwtSA8oP7HNfp5e6RBMwhFGobZQqNCpxHYXd
    ⚡ VALIDATION: primary=false, secondary=false (1ms)
    ❌ RAYDIUM: Primary token validation failed for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  📊 Binary parsing complete: 0 candidates from 5 instructions
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 33ms, efficiency: 4627.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 20ms, efficiency: 4642.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 9ms, efficiency: 4655.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 52ms, efficiency: 4666.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 4677.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 33ms, efficiency: 4687.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 23ms, efficiency: 4695.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4704.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4711.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 41ms, efficiency: 4718.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 33ms, efficiency: 4725.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 18ms, efficiency: 4731.0%
📊 System Health: 7 services, 0m uptime, 17.6MB peak
🧠 Memory: 18MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4736.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 46ms, efficiency: 4741.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4746.9%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '4oXuVWMjKGwPmrF5Zg1it95MatkLP5Rcs8GWchjYA6xGEQpeJjdPXRA9Mydg2kGq72jyV26cPT4xJwDUs3MJHS9f',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2291263a',
  current_hash: '4e819b37'
}
🔍 TRANSACTION DEBUG: {
  signature: '41xJhAs2bTKQRAZqTLT1Ldr2HzrSfP4cVtvXin7J8Y87MzJ5cYzhFsdjuGDfN6JkDFGDAf7yBd4JyhepgUHPmSPF',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: false,
  last_hash: '4e819b37',
  current_hash: '4e819b37'
}
🔍 TRANSACTION DEBUG: {
  signature: '4BxAEBQ8a1LXTbNyD2ziXc8PKpGxmwSZiwApurVW6rMZkTmvuWE8xsff5KBo54hZTR2y2NSVHG4UCu2epvsz23G',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '2291263a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4e819b37',
  current_hash: '2291263a'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 22ms, efficiency: 4751.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 8ms, efficiency: 4755.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 49ms, efficiency: 4760.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4763.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 28ms, efficiency: 4767.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 15ms, efficiency: 4771.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 1ms, efficiency: 4774.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4777.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 29ms, efficiency: 4780.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 17ms, efficiency: 4783.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4786.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 41ms, efficiency: 4788.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 28ms, efficiency: 4791.1%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.34
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 14ms, efficiency: 4793.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 1ms, efficiency: 4795.7%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '4oXuVWMjKGwPmrF5Zg1it95MatkLP5Rcs8GWchjYA6xGEQpeJjdPXRA9Mydg2kGq72jyV26cPT4xJwDUs3MJHS9f',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2291263a',
  current_hash: '4e819b37'
}
🔍 TRANSACTION DEBUG: {
  signature: '41xJhAs2bTKQRAZqTLT1Ldr2HzrSfP4cVtvXin7J8Y87MzJ5cYzhFsdjuGDfN6JkDFGDAf7yBd4JyhepgUHPmSPF',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: false,
  last_hash: '4e819b37',
  current_hash: '4e819b37'
}
🔍 TRANSACTION DEBUG: {
  signature: '4BxAEBQ8a1LXTbNyD2ziXc8PKpGxmwSZiwApurVW6rMZkTmvuWE8xsff5KBo54hZTR2y2NSVHG4UCu2epvsz23G',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '2291263a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4e819b37',
  current_hash: '2291263a'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4797.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 26ms, efficiency: 4800.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4802.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 53ms, efficiency: 4803.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 40ms, efficiency: 4805.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4807.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 15ms, efficiency: 4809.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4810.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4812.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 31ms, efficiency: 4814.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 15ms, efficiency: 4815.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 5ms, efficiency: 4816.9%
📊 System Health: 7 services, 1m uptime, 17.8MB peak
🧠 Memory: 17MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4818.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4819.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'gZbyrbDQZ1FZRu12Wt1s6QJxxPgmrDrjPREsDNtaKzG6S6ZJdRAxKa9JaggFxhqvgtBtu3YZKRgr12cZE1TrA25', processed: 0 }
🔍 Scanning recent transactions for LP creation...
🔍 Scanning for new LP creations...
🔍 Scanning for new LP creations...
  ⚠️ Transaction fetch failed: gZbyrbDQZ1FZRu12Wt1s6QJxxPgmrDrjPREsDNtaKzG6S6ZJdRAxKa9JaggFxhqvgtBtu3YZKRgr12cZE1TrA25 (Transaction timeout)
🔍 TRANSACTION DEBUG: { signature: '53qSQh4zoWZKdn1vtyeD2xo5BGGK4Xvqm76mLbu9z8Qx5vHiQSuJ6JV6CKxQZ7NGmatEaXsKWjx8xz5xuRyUbiKr', processed: 1 }
🔍 Scanning for new LP creations...
🔍 Scanning for new LP creations...
🔍 Scanning for new LP creations...
  ⚠️ Transaction fetch failed: 53qSQh4zoWZKdn1vtyeD2xo5BGGK4Xvqm76mLbu9z8Qx5vHiQSuJ6JV6CKxQZ7NGmatEaXsKWjx8xz5xuRyUbiKr (Transaction timeout)
🔍 TRANSACTION DEBUG: { signature: 'EMfnMeZgk3PMZuuHdYM1HMYoWqeZgwTLQWartQ3srNRQ7VugpFn4o2mnZPgmTTBHmgwpSWfaAo2XMsGNAHqeGsA', processed: 2 }
  📊 Found 10 recent Raydium transactions
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '56viU6AEWqNNUUd2ZkpjhUBzGvpBp67k9dxZ436kiNHowmdjq9guz35xsygFLHdb9prZjYTdnnNHJ3YqT22fnYBc', processed: 0 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3Dpqeha5kDAm8imkaC7TWjdMszmJNiQys6CTtexdbm2VcePV4TkEfMPeb4TX5YGnfuYfgn9Ca2kekcBbyma4Po2R', processed: 0 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'ZovadBDyHE2oz34LBacrbQEY7wra49VFdHn5yyeGSUErrPuP2rEjpZhfoSWKPwUA1ckbS4DXq9N33kGEjpigRGz', processed: 0 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '22yAsUm2kGRwEoFb5KDo5Tp9nCNrrF2exwrxzw9RyHhrpjCmieNpM1mRQsyHLFEGCbhS1cmtdL9qJPNDLj6av6Sn', processed: 0 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3HF1LjnWRmc5JjHpuZmqn6MBKCRgePJqCf7pyDqr9A9cdFs4sUMnzxcVG6MdEtzxhM1vTXg7F7h2jmd7zv5L836T', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '4M65NwG2tym7QxedR8htXjQ5Z1Z6GtVrnNbCbdAMonwA4J3GdG9kindYTgzTaai2DmS2P1tpCUb2kUC5Nrpxew5r', processed: 3 }
🔍 TRANSACTION DEBUG: {
  signature: '4oXuVWMjKGwPmrF5Zg1it95MatkLP5Rcs8GWchjYA6xGEQpeJjdPXRA9Mydg2kGq72jyV26cPT4xJwDUs3MJHS9f',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2291263a',
  current_hash: '4e819b37'
}
🔍 TRANSACTION DEBUG: { signature: '5v8U2xCqJKyXZy8F17axq6FFavhwtJeg9iThtosFihwhz7nDzrgrYTpTJ4A6ZBWtZU7oCYifyKh6zSZ8BowJfdaw', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'oHVBp9iXCiBomCmmsFzJNpTBvLr97WbWjXZvqfjGSyJZgwan3KLLsoxP9oU4K4BCHeLVJe77pCxGJbMFiFTCYni', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '23fD71ZsDvwS83CzajirkDeBZZXKPhJDzSS13YBYGAZ4f2Pai6WPxkGK3HXgU5cifXqyKWAsZts8TqqkUmCCpUHm', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'mFm9WJNPAMB3gx9ktWgey4z7fkMwpatZahfWqZGM9xmrceSXpFPAZ2EqGZUt68PpHRXVujrzzpSyM1AcYNmr5HE', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '3nq6gG4YDESEDotYc2M83HGC6bUBpmg8Nec69Qgf8Zckz112m7d3eWrgaa9aTKRJYjm5SXtvF4SpQrwnJcuVfSqn', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3LUdEchHNdRUqNhWHphhXnaYecnPvUVCcwFHgg84sZu9w9GM7xE21t4kRJsAnBrmZUiXwzDiTvjbUFZJEe2pbsQq', processed: 1 }
🔍 TRANSACTION DEBUG: {
  signature: '41xJhAs2bTKQRAZqTLT1Ldr2HzrSfP4cVtvXin7J8Y87MzJ5cYzhFsdjuGDfN6JkDFGDAf7yBd4JyhepgUHPmSPF',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: false,
  last_hash: '4e819b37',
  current_hash: '4e819b37'
}
🔍 TRANSACTION DEBUG: { signature: '3H2anVDiSLPgDmUsdSzK9GAEzGXy1i8tLqT2CP5JLnhAfkWGfJzdMuznqPnJZWBxBoUfkkz1m54tacGvbwsR6brY', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4QCLf1SCxiaYEjSrNHjsf1XKJJ5BFWtJWogC6w8TDpqjfZcYDFQUQgfryaShsGUKGTS4GkowYpm7xEXTwr19ZFQU', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4PxjDAetVDcuZDhqV3TwZ5oSFi4iTAxZWqCHDkHF6aFiJQnnSLK6pu1fBVSruizJ1VDqiJjJnHjjWhaJ1eq8nwCy', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2iPdNotUtzXkSu8uB1rnM4YcZrynhsH5MreRh5acwSh4K1Qk6zYXPUbHBa7Y8JfBhdqF5gfZZLp6eQH1e71kkBAp', processed: 5 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '5iK82inYErExteQmYmWJbCwtn8igthTsfpBXQhBpHrRUDjrm5jT2Lu75LqPCiqPL1dgxdt6HSvzpfNQbNY3abhaK', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3h5QUJkU4k6G3cV4SDS97Fb9YEuQN35ectvhHAKYwkrksWJm4NviDmQ5X6dvmrc3vxBZQr3yJCCiXyfa165CPvat', processed: 2 }
🔍 TRANSACTION DEBUG: {
  signature: '4BxAEBQ8a1LXTbNyD2ziXc8PKpGxmwSZiwApurVW6rMZkTmvuWE8xsff5KBo54hZTR2y2NSVHG4UCu2epvsz23G',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '2291263a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4e819b37',
  current_hash: '2291263a'
}
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '5oKzczr5gwDDaGr3561YFpYcHvZ6duTuSQPSytSSeGCnQFN9EFj6A2Y74cpZfd4Q1N8Yu9SnoTthmPMGwh8xQZYX', processed: 0 }
  ⚠️ Transaction fetch failed: 4QCLf1SCxiaYEjSrNHjsf1XKJJ5BFWtJWogC6w8TDpqjfZcYDFQUQgfryaShsGUKGTS4GkowYpm7xEXTwr19ZFQU (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: 'qCQGUaWYad2ZPpLDsWTQ9RTHr6EPcLD8DystSRUBmU39ersqdVvxJWXMHB98XaWEbwz3vKMkp6eUFGdeWYuZuiL', processed: 3 }
  ⚠️ Transaction fetch failed: 5iK82inYErExteQmYmWJbCwtn8igthTsfpBXQhBpHrRUDjrm5jT2Lu75LqPCiqPL1dgxdt6HSvzpfNQbNY3abhaK (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '5BbftH9jsD46NtAV2MdEZ1Qn8cFLB8XvRo3qjsD8gpRJBbG27pTT8kjybekuAASsmwAzLsbm3iVKzTRUYvtYqwFw', processed: 3 }
  ⚠️ Transaction fetch failed: 4PxjDAetVDcuZDhqV3TwZ5oSFi4iTAxZWqCHDkHF6aFiJQnnSLK6pu1fBVSruizJ1VDqiJjJnHjjWhaJ1eq8nwCy (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '5VyNtZHENiz7FRnJyUC9C2vYdVSQwhWqhgqUWbEKGZq9vS68mWUMGkmvNik2SiLiRuQtJPnytaHGKRLLg4e5623C', processed: 3 }
  ⚠️ Transaction fetch failed: 3h5QUJkU4k6G3cV4SDS97Fb9YEuQN35ectvhHAKYwkrksWJm4NviDmQ5X6dvmrc3vxBZQr3yJCCiXyfa165CPvat (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '57xjU9uzQdUmP4reFKKXMm6oGEnqE2w1n4U4uSTMJmYwRXsDvBH5XZotNS9Jfp78qdvTYp1r3mQELQrTS78rAu9L', processed: 3 }
  ⚠️ Transaction fetch failed: 3H2anVDiSLPgDmUsdSzK9GAEzGXy1i8tLqT2CP5JLnhAfkWGfJzdMuznqPnJZWBxBoUfkkz1m54tacGvbwsR6brY (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '5SNDi6F7hHmBciHeXJ3m8SiMSyzDzkueHAg9shkDXrLPSM9EkT6NQqywcGxonpS1LYq1YJtR6AJ416JU5iP25Kft', processed: 3 }
  ⚠️ Transaction fetch failed: 2iPdNotUtzXkSu8uB1rnM4YcZrynhsH5MreRh5acwSh4K1Qk6zYXPUbHBa7Y8JfBhdqF5gfZZLp6eQH1e71kkBAp (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '9tzEgDizG7Gyrj6vaXjktnYmnVLoZaSjS2D122Kr4JAvsdbqiJdbqSmURp6X1SJn5tAzqu8jkF1QaCWhAPFPtxN', processed: 6 }
  ⚠️ Transaction fetch failed: 5SNDi6F7hHmBciHeXJ3m8SiMSyzDzkueHAg9shkDXrLPSM9EkT6NQqywcGxonpS1LYq1YJtR6AJ416JU5iP25Kft (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '4YvBxmc5mo5NRdyZuMn8XuEMZRykBjU1vemUkfZzkYJx3rvNSNFpGnFSJtTBdFRKuwouWAjz8X6D5ZwCSrehUUH2', processed: 4 }
  ⚠️ Transaction fetch failed: 5VyNtZHENiz7FRnJyUC9C2vYdVSQwhWqhgqUWbEKGZq9vS68mWUMGkmvNik2SiLiRuQtJPnytaHGKRLLg4e5623C (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: 'NWJAKSD3u8gWoRqA8ZeQRH8pD3KVu5VPLeUStTxxWqQis4qtT3TVk8HgXtXpt19CPHyefgkfgywLePa4DMFehpM', processed: 4 }
  ⚠️ Transaction fetch failed: qCQGUaWYad2ZPpLDsWTQ9RTHr6EPcLD8DystSRUBmU39ersqdVvxJWXMHB98XaWEbwz3vKMkp6eUFGdeWYuZuiL (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '3UELT7Nua2e7dPL2gSMSNNRguVDUL4squmSnkB2F7NUXJixmZGgxcr9Zio4ytSaNvvS9XeJyVxT4ooC78dCret3w', processed: 4 }
  ⚠️ Transaction fetch failed: 5BbftH9jsD46NtAV2MdEZ1Qn8cFLB8XvRo3qjsD8gpRJBbG27pTT8kjybekuAASsmwAzLsbm3iVKzTRUYvtYqwFw (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '2MmagFkLuV1cH6FHYFVGnj1nsktcQNUn6ooGDFQiCES9S5S3LZR2BNUWDgP8tPZmNFTmSXxUQGZ4HTfbNjiBGkiW', processed: 4 }
  ⚠️ Transaction fetch failed: 9tzEgDizG7Gyrj6vaXjktnYmnVLoZaSjS2D122Kr4JAvsdbqiJdbqSmURp6X1SJn5tAzqu8jkF1QaCWhAPFPtxN (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '549R24TC52hfJH85fP1CABNEVmUzet64Aj9VF8X4H1X4Ux3s1KV9Dz2WwJYcjdBQkjzoi8inbB25wbdYiVDb2qmG', processed: 7 }
  ⚠️ Transaction fetch failed: 57xjU9uzQdUmP4reFKKXMm6oGEnqE2w1n4U4uSTMJmYwRXsDvBH5XZotNS9Jfp78qdvTYp1r3mQELQrTS78rAu9L (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '5htdo58xAfT4GqPVxhQCQwH7PXoqBgFNwBkMYjUwcvNHw9n2YcDEfEUyRoDRemK3WCwpMPs2qwgt4uyjipp7Brxe', processed: 4 }
  ⚠️ Transaction fetch failed: 5oKzczr5gwDDaGr3561YFpYcHvZ6duTuSQPSytSSeGCnQFN9EFj6A2Y74cpZfd4Q1N8Yu9SnoTthmPMGwh8xQZYX (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '2xNBqsUR7eQ44TXZEd7D5uaBgx4Ne5f6RBG9f4SwfKNuc3wZ9Zb4kR6izj5sVP559MQmToAq6HQa3BGJeCaR3kFX', processed: 1 }
  ⚠️ Transaction fetch failed: NWJAKSD3u8gWoRqA8ZeQRH8pD3KVu5VPLeUStTxxWqQis4qtT3TVk8HgXtXpt19CPHyefgkfgywLePa4DMFehpM (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '4cVzUXducEHFpLunhcsgs5mhr9AapGjajpcR6VPjxKMrwfYtPBLdFDWmJTtZvAJobh3b54G6BxZ39KAjPJfsC5ae', processed: 5 }
  ⚠️ Transaction fetch failed: 5htdo58xAfT4GqPVxhQCQwH7PXoqBgFNwBkMYjUwcvNHw9n2YcDEfEUyRoDRemK3WCwpMPs2qwgt4uyjipp7Brxe (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '5xxamfHJfsN1kpdTucBnLtZqSoxybtMnFD4M5KXs9QJFAiiwaXnDXK61XdvdP2EmxW8448dMHNNzCstZHLUQhKUB', processed: 5 }
  ⚠️ Transaction fetch failed: 549R24TC52hfJH85fP1CABNEVmUzet64Aj9VF8X4H1X4Ux3s1KV9Dz2WwJYcjdBQkjzoi8inbB25wbdYiVDb2qmG (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: 'b8DhNe1LbUKQjykqP3tn9n7AAyxxpyML7gQWEYsEbdW8sF9YARcayzibVcPhEBncG6zG5pLg7HwonscaAukqLDq', processed: 8 }
  ⚠️ Transaction fetch failed: 4YvBxmc5mo5NRdyZuMn8XuEMZRykBjU1vemUkfZzkYJx3rvNSNFpGnFSJtTBdFRKuwouWAjz8X6D5ZwCSrehUUH2 (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '3LttWKwVbUQhSBEqDRhLe6mYFnsQdzMeb8LLtyFz5EfiAx8Ugggj2DoCisH3KRsQkyWBFVw8tGgW9wVqEWPDGcec', processed: 5 }
  ⚠️ Transaction fetch failed: 2xNBqsUR7eQ44TXZEd7D5uaBgx4Ne5f6RBG9f4SwfKNuc3wZ9Zb4kR6izj5sVP559MQmToAq6HQa3BGJeCaR3kFX (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '2s9TiwwcRu59y5a5dJxYfEsxxdWzXqExshW6EVhAsxqzFtuzopHxDFdEhTvoxybg7DiLU3KnapfVop54merVQfVb', processed: 2 }
  ⚠️ Transaction fetch failed: 3UELT7Nua2e7dPL2gSMSNNRguVDUL4squmSnkB2F7NUXJixmZGgxcr9Zio4ytSaNvvS9XeJyVxT4ooC78dCret3w (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '5vW6PGMZTP6GRNK4PcPRzCsVjs8gXySHLAaELwF1Bcfa4eKqDeFLUHGV1S4nzhraD6MUbXsSrLYuxj67KjRir8Qd', processed: 5 }
  ⚠️ Transaction fetch failed: 2MmagFkLuV1cH6FHYFVGnj1nsktcQNUn6ooGDFQiCES9S5S3LZR2BNUWDgP8tPZmNFTmSXxUQGZ4HTfbNjiBGkiW (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: 'XhRrBj8MaCJrN9NZjAzTcmyNk9sbWzj4wSxvmJf1zh1FFGZfUB89wrweGfwaUjXqyM6BL8UtcBJYvpaokBgWzzf', processed: 5 }
  ⚠️ Transaction fetch failed: XhRrBj8MaCJrN9NZjAzTcmyNk9sbWzj4wSxvmJf1zh1FFGZfUB89wrweGfwaUjXqyM6BL8UtcBJYvpaokBgWzzf (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '5ntX4cuUVhRmDkwvPuoNs9gfLmwZ5uEinM9EDsfUE3kPhPVbetdAk23hpRske5fLjipMEio5r3mK5hJEsFXRT3ku', processed: 6 }
  ⚠️ Transaction fetch failed: 5vW6PGMZTP6GRNK4PcPRzCsVjs8gXySHLAaELwF1Bcfa4eKqDeFLUHGV1S4nzhraD6MUbXsSrLYuxj67KjRir8Qd (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '2bLRbonR6WzYZ3fooTLKBgvVs6t1t4cBkP73xpnHmd6Uhke4mi4DkS448bpa6fFYmnW3NZF6UUz6MCp1yMEX3UE1', processed: 6 }
  ⚠️ Transaction fetch failed: 5xxamfHJfsN1kpdTucBnLtZqSoxybtMnFD4M5KXs9QJFAiiwaXnDXK61XdvdP2EmxW8448dMHNNzCstZHLUQhKUB (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '4LcYyGwvErrFa2S39rzVZeFACHteKMsBVBemYKdY5imZd5L5QLPxEHuRwU9ZizFusjMa3wxhbbe1JZ22Yy6mzMJM', processed: 6 }
  ⚠️ Transaction fetch failed: 4cVzUXducEHFpLunhcsgs5mhr9AapGjajpcR6VPjxKMrwfYtPBLdFDWmJTtZvAJobh3b54G6BxZ39KAjPJfsC5ae (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '22yDKNPXzrM9xRrRBWaKAnkMDky5VtcArTLaq1o11Y9fkd1HhWZM4MsQ3rDGeA2LyApEv9tWbqWxaHUnscYinMBx', processed: 6 }
  ⚠️ Transaction fetch failed: 3LttWKwVbUQhSBEqDRhLe6mYFnsQdzMeb8LLtyFz5EfiAx8Ugggj2DoCisH3KRsQkyWBFVw8tGgW9wVqEWPDGcec (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '3tvaFEY5sYsTNpFZTxS5TjtjNQbNgkBLnEbpTsStRPBg9jH9voZVj6BNuAHbnJZNgzGTBaqWWBfxbQokMVJWMwXD', processed: 6 }
  ⚠️ Transaction fetch failed: 2s9TiwwcRu59y5a5dJxYfEsxxdWzXqExshW6EVhAsxqzFtuzopHxDFdEhTvoxybg7DiLU3KnapfVop54merVQfVb (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '4KvxdWq6VZRauKDytZKu7VQphbAcV5THRHCEZVo1USiboV8othJW3ynrDvxJsMGjEzT2SfMbqQa7nDeA9XQLeFUU', processed: 3 }
  ⚠️ Transaction fetch failed: b8DhNe1LbUKQjykqP3tn9n7AAyxxpyML7gQWEYsEbdW8sF9YARcayzibVcPhEBncG6zG5pLg7HwonscaAukqLDq (this.parseRealLPCreationTransaction is not a function)
🔍 TRANSACTION DEBUG: { signature: '7dFJFKtGQcaogpi9wjcXcpBfnjK22U6fvbUR2NY3Pppq7hFA97BJPJtMT16kmnycwVbTUDjbWUS2tN5PP49KYcC', processed: 9 }
  ⚠️ Transaction fetch failed: 5ntX4cuUVhRmDkwvPuoNs9gfLmwZ5uEinM9EDsfUE3kPhPVbetdAk23hpRske5fLjipMEio5r3mK5hJEsFXRT3ku (this.parseRealLPCreationTransaction is not a function)
📊 SCAN COMPLETE: 0 candidates, 6917ms, efficiency: 4733.8%
  ⚠️ Transaction fetch failed: 22yDKNPXzrM9xRrRBWaKAnkMDky5VtcArTLaq1o11Y9fkd1HhWZM4MsQ3rDGeA2LyApEv9tWbqWxaHUnscYinMBx (this.parseRealLPCreationTransaction is not a function)
📊 SCAN COMPLETE: 0 candidates, 8926ms, efficiency: 4738.2%
  ⚠️ Transaction fetch failed: 3tvaFEY5sYsTNpFZTxS5TjtjNQbNgkBLnEbpTsStRPBg9jH9voZVj6BNuAHbnJZNgzGTBaqWWBfxbQokMVJWMwXD (this.parseRealLPCreationTransaction is not a function)
📊 SCAN COMPLETE: 0 candidates, 4923ms, efficiency: 4741.2%
  ⚠️ Transaction fetch failed: 7dFJFKtGQcaogpi9wjcXcpBfnjK22U6fvbUR2NY3Pppq7hFA97BJPJtMT16kmnycwVbTUDjbWUS2tN5PP49KYcC (this.parseRealLPCreationTransaction is not a function)
📊 SCAN COMPLETE: 0 candidates, 12930ms, efficiency: 4741.2%
  ⚠️ Transaction fetch failed: 4LcYyGwvErrFa2S39rzVZeFACHteKMsBVBemYKdY5imZd5L5QLPxEHuRwU9ZizFusjMa3wxhbbe1JZ22Yy6mzMJM (this.parseRealLPCreationTransaction is not a function)
📊 SCAN COMPLETE: 0 candidates, 2926ms, efficiency: 4747.1%
  ⚠️ Transaction fetch failed: 4KvxdWq6VZRauKDytZKu7VQphbAcV5THRHCEZVo1USiboV8othJW3ynrDvxJsMGjEzT2SfMbqQa7nDeA9XQLeFUU (this.parseRealLPCreationTransaction is not a function)
📊 SCAN COMPLETE: 0 candidates, 947ms, efficiency: 4748.5%
  ⚠️ Transaction fetch failed: 2bLRbonR6WzYZ3fooTLKBgvVs6t1t4cBkP73xpnHmd6Uhke4mi4DkS448bpa6fFYmnW3NZF6UUz6MCp1yMEX3UE1 (this.parseRealLPCreationTransaction is not a function)
📊 SCAN COMPLETE: 0 candidates, 10955ms, efficiency: 4755.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 35ms, efficiency: 4758.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4760.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 8ms, efficiency: 4762.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 48ms, efficiency: 4763.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4765.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 24ms, efficiency: 4767.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 9ms, efficiency: 4769.3%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.53
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4771.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4772.7%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '4oXuVWMjKGwPmrF5Zg1it95MatkLP5Rcs8GWchjYA6xGEQpeJjdPXRA9Mydg2kGq72jyV26cPT4xJwDUs3MJHS9f',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2291263a',
  current_hash: '4e819b37'
}
🔍 TRANSACTION DEBUG: {
  signature: '41xJhAs2bTKQRAZqTLT1Ldr2HzrSfP4cVtvXin7J8Y87MzJ5cYzhFsdjuGDfN6JkDFGDAf7yBd4JyhepgUHPmSPF',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '4e819b37'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: false,
  last_hash: '4e819b37',
  current_hash: '4e819b37'
}
🔍 TRANSACTION DEBUG: {
  signature: '4BxAEBQ8a1LXTbNyD2ziXc8PKpGxmwSZiwApurVW6rMZkTmvuWE8xsff5KBo54hZTR2y2NSVHG4UCu2epvsz23G',
  slot: 357470571,
  blockTime: 1754174094,
  accountKeys_hash: '2291263a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4e819b37',
  current_hash: '2291263a'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 19ms, efficiency: 4774.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 7ms, efficiency: 4775.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4777.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4779.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4780.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 14ms, efficiency: 4781.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4783.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 4784.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 32ms, efficiency: 4786.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 18ms, efficiency: 4787.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 8ms, efficiency: 4788.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 48ms, efficiency: 4789.9%
📊 System Health: 7 services, 2m uptime, 19.4MB peak
🧠 Memory: 19MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 38ms, efficiency: 4791.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4792.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 9ms, efficiency: 4793.5%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2hjEex7EVm7uMmaVNufh6KnCt3zS4WSFUkn4qBZmDrcsn5XvemEM1TA4HUvCBMx6kujC333ePWanxyaTfdTFbeeA',
  slot: 357470958,
  blockTime: 1754174245,
  accountKeys_hash: '50a63d8a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2291263a',
  current_hash: '50a63d8a'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 15,2,19,3,4,5,6,20,7,8,9,10,11,12,21,13,1,0
    ⚠️ RAYDIUM: Unknown pair - assuming coin=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, pc=6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1
    ✅ RAYDIUM: pool=ERydgXzX32ZLxQNYWwnhEtbCHSpoXvUKaSr9kKXpFAmN, primary=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, secondary=6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 12ms, efficiency: 4794.6%
    ❌ ACCOUNT NOT FOUND: 6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1
    ⚡ VALIDATION: primary=false, secondary=false (140ms)
    ❌ RAYDIUM: Primary token validation failed for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: {
  signature: 'ofYX86tmW58jiyF2ajWeqPLjEaWqzUyWTxFSS651kUCd9wat96GTgByTcQmNRkyzdoQx24Yj7J9EcxXR9wP9ctt',
  slot: 357470958,
  blockTime: 1754174245,
  accountKeys_hash: '2b113398'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '50a63d8a',
  current_hash: '2b113398'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 15,2,19,3,4,5,6,20,7,8,9,10,11,12,21,1,13,0
    ⚠️ RAYDIUM: Unknown pair - assuming coin=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, pc=6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1
    ✅ RAYDIUM: pool=ERydgXzX32ZLxQNYWwnhEtbCHSpoXvUKaSr9kKXpFAmN, primary=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, secondary=6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1
    ❌ ACCOUNT NOT FOUND: 6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1
    ⚡ VALIDATION: primary=false, secondary=false (48ms)
    ❌ RAYDIUM: Primary token validation failed for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4795.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 24ms, efficiency: 4796.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 11ms, efficiency: 4797.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 49ms, efficiency: 4799.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 46ms, efficiency: 4800.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 33ms, efficiency: 4801.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 22ms, efficiency: 4802.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 5ms, efficiency: 4803.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 4803.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 41ms, efficiency: 4804.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 28ms, efficiency: 4805.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 14ms, efficiency: 4806.7%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.59
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4807.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 41ms, efficiency: 4808.4%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2hjEex7EVm7uMmaVNufh6KnCt3zS4WSFUkn4qBZmDrcsn5XvemEM1TA4HUvCBMx6kujC333ePWanxyaTfdTFbeeA',
  slot: 357470958,
  blockTime: 1754174245,
  accountKeys_hash: '50a63d8a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2b113398',
  current_hash: '50a63d8a'
}
🔍 TRANSACTION DEBUG: {
  signature: 'ofYX86tmW58jiyF2ajWeqPLjEaWqzUyWTxFSS651kUCd9wat96GTgByTcQmNRkyzdoQx24Yj7J9EcxXR9wP9ctt',
  slot: 357470958,
  blockTime: 1754174245,
  accountKeys_hash: '2b113398'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '50a63d8a',
  current_hash: '2b113398'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4809.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 14ms, efficiency: 4810.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 51ms, efficiency: 4810.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 41ms, efficiency: 4811.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4812.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4813.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 13ms, efficiency: 4814.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 48ms, efficiency: 4814.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 34ms, efficiency: 4815.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 18ms, efficiency: 4816.2%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 6ms, efficiency: 4816.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 4817.6%
📊 System Health: 7 services, 3m uptime, 19.8MB peak
🧠 Memory: 20MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 35ms, efficiency: 4818.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4819.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 13ms, efficiency: 4819.7%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2hjEex7EVm7uMmaVNufh6KnCt3zS4WSFUkn4qBZmDrcsn5XvemEM1TA4HUvCBMx6kujC333ePWanxyaTfdTFbeeA',
  slot: 357470958,
  blockTime: 1754174245,
  accountKeys_hash: '50a63d8a'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2b113398',
  current_hash: '50a63d8a'
}
🔍 TRANSACTION DEBUG: {
  signature: 'ofYX86tmW58jiyF2ajWeqPLjEaWqzUyWTxFSS651kUCd9wat96GTgByTcQmNRkyzdoQx24Yj7J9EcxXR9wP9ctt',
  slot: 357470958,
  blockTime: 1754174245,
  accountKeys_hash: '2b113398'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '50a63d8a',
  current_hash: '2b113398'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3CegUQBTyx2ka9pLE9gxQ3YQX6M7BHhjQ4M4SfqtmhcAUXqGTgkABR9XcequJtjUQdjVC3KnAKQyZ2WTMZBxBo2R', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '53DZCpBMaTpnsi4xCM8YCcNigxJsHZX29VYXpRBDYxCJmCSScM9JVQmk8eRWjQkXX9BLa8X4fkrK2d76HRKWF9xm', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3DCgzLhHC9kmqhbgstZ21yRXZSP4zKgbEvRz9wtUXH5VnYKrDKJ7TLx61AHZWBQgaX96BkX3zvXvakeXYpQarnVC', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4DUxCfnwyPmuuTiV4APTPBKAVsHCCrrW19ei2h7mzD9W9v27KEdKoTXhtNKp3dphQF248J3NZv9xpi1Yqeoh3rwL', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '5wdVVqKuvQGkYehtbjx4tBPpqiobzhAPk5ftZykzYyhMc4pAZsbQMVuBd51BiYAhZ4ouaNCXaAPNttcFhPt5vrFK', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5yXX4UR5wZ3fTnNvGfWmGUr8qtihFaDjoa8gzBbXV6NZZimkARS5ypNPgbCLbktaYH9pi67fQD8N5E8ThnTL5jHh', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '2P3FJedU4kZbixhx9mrMxif3upf2YqQKovw9vWwtjQxUjKEQxUHDwGfzTBWQ9tx5a1qxKirepQV1DYtWyxRrc9CW', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: 'kpC1fyV9FU1mxswuvggtsmtEZBTtYHTJcWkhR4EDNsFJwaJW2THzTwZV7epsfVJeJNmx8RVBTXt9UR2aqvUY2SQ', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '3FXPN8k8mLEuCecx1HUsdM7WqPGW4dz2jHhaLyDKH1kH57M5hirE4pLo5tZAurTq2uqc7QoYwJBv3aBK9QtUzcXQ', processed: 8 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '4Db5Rsa2A9r6n91UyVCJpaT6MWnKsjjsKgjx95KKHVUwKLW9mqNEufBD8Ci58eyR5Ctt13NzfQoKdSQQB7YVXEDp', processed: 9 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'fmN8rB3n5pWW92RDsKUdgihMtqazx7GBRco3SNmwakfqhFquqa3ePhpqgjpAh1WiHFaKLGnz3dqGFKeyi6ZEr4F', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5TqtYxLZADUsNk46ceofJS6MQ3YrdazyTZdLHZJKx6pkMghQJH8GLF3EYTX988bYnzYbAgNbLWotkrv3qfZGkuaR', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '4uk74yxzqvp1yJtnebhPKGFLKSYUzkncsbzpqSsHcEazDAfado2PJCpLCqjCPEf1fUFDAYDaygdwKNoBeVHWwGF5', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2XJoWgSxC4wKAJc5hpL4Fqe5VdxV9wzs3wCCZL5QhswPfkxCqPGZJWFzZzCRrseQR5R5aiJn1iFM4ZDj6pYXGZWW', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: 'pSKF6N8pdq3KbDxn4tesURxh4M4Fvf4ve1EPNQKHwr5oiC9P2mmAKseWy6oG2ULxsLf3a3bzuRqV9mXayP7LzQr', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '275Cge1XNJiVaeJPXFxn7umWhK5davxuu1bX12zXu1rhGfP4wYcs4Uh4vJV9TXGXi52gXb5RwX7NtRfU6AUjjmEP', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3Cbm95Fpp2kBt9SexhdZJgfQYWcbZ4Kj6oFpcQAd4SsVinpv6AvK5pVu35tBJaioQjCHWZtJ5tuBjKNBZ9jmiCci', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '4tkqarvPTSw6HQMDTM6t82Kg6wLGSy4S4RnErUwyCieanjmHR7HoEbZTDcXKkpnkkTR6PWxofPDcpJUHQTzzB5Ms', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '4cAaD9m3WJBTpxGLFa1BwXkRVVpC3y2K4MAiUmqUT4TieeZ4hYDNxyDwTsVMvqTVgN1dUARi6Sy34hfQUFdHJKiK', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '4AQ26RauZRSbwAHcbA8JwwNGDBm7Hqkdzk3y5BL4intxs9yvJU83CRQNaGGJySvrbJ7VFkyygmRjKBgGxaE5Cdqz', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: '2DE9XViufYr3ZroFTDMeD5bh8fqJvnRvWXZTx532FgWqYs1QBNpedpraUFDCU5cNArCWUxs2EKZtEK8Lt2K5AdQZ', processed: 15 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '2MrhbWVVp1qWAeFcbvaiaRsLSyycPadet5mBzobUebFqxmKFSvZjuVXZj5FdVYPgWkqWVMLW3XxqiBaL8dTYPfT', processed: 5 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 50 unique, 0 duplicates removed
  📊 Processing 50 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '43Eyzg7DvSUZUUiytYFXpoVTQaLPpJdtcPjvA2b1GStazV9yyXfHM5krH1wHakK7dUgh7VWzAUnNueNb5wKLsSHY', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5SNHeh5CBfDUxKdo9RrwzcT4mJ3sjD8N5b71HhGUGR4tpw58uoj6gQMdmWdCSUrXUi4esmY4wLb6AMm7FVWt6zgK', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '3feGV3ND5uqQaiyC6rj5x1rf6Pfc6o9Kp22xvpd5shE3d68bMmU7xYMVtYM9CvvJwY2m1bLuETVnieewMyhK6nWs', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2gd3E1Vhu5xMx9MYLkKRG5gKMmPVvP6GeH14qyem8ZksVGD49ueEYHiMoQ8pEgZupKhUXxtiZULL7g4tL1nEjdDz', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'gNugwzDrz8bTRBi2eF9nafSdHMNHfj3RbYg8dGo62MhooS73WgwAoXfuGEPwNxUxAguEmNWETG8LweF4XiqHhdV', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '2C6Gig8hDDFyKYHRvkJfZvJZKdR1N92PEkTm74QmNiB74hMWbayHpQD2Rbs7oPM86BJwzSMUm9kA8cDFrPHP3aMm', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '5B3KCcBshk4Pirg7e4dedUv92CdbdSZB957uxh8Ghz8P73tYWDS9AXo71oTVybQDqyB17wihWdUe55nCBG919JMS', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '3rZknNGeHxrSiC4q2qn176daQKQ7A7mw8RwDQpkT56NuVE56xGCsLtGqviT83eUscaYiR6moV1vVMs5mLFKbCHWZ', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '41vWpoKGW5tC83MNnBgAcPemiCPYy4f8raL9rVGSdgpf8mbgsw6DLKz9a8Y5dD98QCyykXwyDUV3FfBkW31G7vSJ', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: 'F7mQYsFuuyhKoAYHFhBRx4nymXQZ4q5QtHaVxMQxJ1sDSnRxBSYeHn9USJpE7EJWMdQHg7wCtZqHqqZdioEg8rJ', processed: 19 }
🔍 TRANSACTION DEBUG: { signature: '49NBdBTKyCu8rWvbBfuWoGA76PZfQjb1xK1KDWFw5JB5xezgoXWbxhpbMjqq5kt8KywvQxjdXZ1HwMVqHE2ovcmU', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '57nujFTLuwZRXUdPYiySmt4r4SA3Z4jpGPzZR4ZB3sfyZM2iHHiYhohq5KBGDZ1U1X8dmdUobVdhrDCyGL3Kn5N7', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '4cm4UJ6eBMqUFHnGY3gA9XEd5wkdxyXPNhBJhRx5B4hbSy2fUW1x8bPS47Xyzg3eegxjDeF5LoDVMLQMG4epTzMY', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: 'VYGjDsrekFRTExAXQLKtgTHr19MMNJqsH7Ygay4tjDF2WCeb1HCcZKZQrC75EDV5vvwfStvCkpLWKvFyWc1vLgc', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '44JiXQUvjif2a1nsSSr1f7VnHTdeAEPKJSnUww4MYGQKpVxXR7PpWzQY3p8tzjWFkJuZukV6qUX9xE9YEHw6vecK', processed: 20 }
^C[THORP] Initiating graceful shutdown...
🔍 Active LP scanning stopped
[THORP] Shutting down service: lpDetector
🔌 Shutting down Renaissance LP Creation Detector...
✅ Renaissance LP Creation Detector shutdown complete

🔌 Received SIGINT, initiating graceful shutdown...
✅ Shutdown complete
