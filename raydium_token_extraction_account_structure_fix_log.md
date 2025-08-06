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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.058Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.060Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.060Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.063Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.063Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.084Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.084Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.084Z"}
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
info: 📊 Metrics server listening on port 9106 {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.086Z"}
info: 📊 Prometheus metrics: http://localhost:9106/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.086Z"}
info: 💚 Health check: http://localhost:9106/health {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.086Z"}
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
[THORP] System initialized successfully in 48ms
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
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:47:21.208Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $159.18
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4DiNUwD56Rfa4KMSko8xfVHd7mkdgmxdJYjZvzS2HocznRJg33UwtEDeirBRPBgjSbLeiSFJtDLkuVZ5aGmrjL5H', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: 'GCwjLUXY1Ax7vWaeP3MxXYzYQENTbX8uLRPGYUPcSZpLS5mH3yKVw8YqeNBVcxNLy4zKvH2H5ZhinZoUxEaYim2', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '5TLjAvm2wJRerY6vYTBLcZer9B97bYkaKcoZfTs8ZuCS3xi2rPCFAW1cnK1tLrRktoyLY1rCgRBzLBXbRj4s9T3m', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '2vaTiKScvJfg2do6LtcNT12L6F7HYbNndaXPcK6DQ5K1i8pkjoTy1mY98fHxnYVmZW8Pm3prks46GxQuqQPgzkr6', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '5JUYx3pz3vo8jXv2Lkue3NMzrSTi194o1bpbjyC1F2jhsbtenSNNa7Cp4Lo59CimhAsyYGdUBcaRjxuYN9QnxV4U', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '56T7RwrH7W6rTwN9MD4kfh7czLpAA77QdP7WqPSeP3g9wRj4G4jZp9Z3rN4kdD3yy1doBq8DoavKw8UGNrmkZcrG', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '28Nob9pkKUx3JxNRTv4N56Dh51FbsbGN9q9A7MS7m38WHiyzdgAaAiBgvKceqV5qp3B7DvRHWdpvb1g6NXyi49Dj', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '5wdVdvsdCHm6dwQBqbX27n1P9RNy24RS7GEw2itPskpQQekxU5n5HnkUyjfNgsXz4DvY7zYdwBs1gkPRoF8C6xc9', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '5wNRCypQvQ5xfomxym8c3Fbr93gMDxvxcmnx4pER7zQ2FqCXE35nXN6sU2M8mKRRzUo8YVHFHLbCRYPKUTFKrCqG', processed: 8 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '3ih4TpoHxhb1Ri3P48ixAywS3Xw1TH9wpbMBKHzqN9SSFa8LbzCicwX9R9q8bTyKPYbosjs13sHZJgdbcK87kJn2', processed: 9 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4GJTgTQycZ6FosMS4VdksUBdS2oQAVXsXHwjRUwXsSdPZCpXUGFy7SVfFfjAhYKfDYiQnmwG87fyD9dDBwUq7cN6', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '3Zqeib1pPyDQweJEfpX1efpZEDsxgWDEaURX93UBrkP1qiH4SxWAvE8LEhoLjavCefrGW79fGbtDfT42h1QrV9mg', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '4gbZGLDXtko5e7UVNgdT5NqB1QakCBnrwfxaESHsPVDRQ73k5TsspfCQmybeNYP9TV8aAMMjbZN3RL3XBjaDkxS5', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '2cyE9TYyiGKU4SZ5hkPyhhcSqxDzCtjnSZcHCQQhCyUxFZpKqR8rcRAkmBGX9nTbPEtPCJUXg2ZVnZURTXHiHRPU', processed: 1 }

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
🔍 TRANSACTION DEBUG: { signature: '3nuwyMUu3SkbcruyMabe24JGGcMAtcUUaQWvC4viNEjtHi3x2qwvMtaYCMjjMU4Ej8HB6xrAFBX5hu1XzbrqXfV', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '5pzeppD5mF4o2cd72WM4ixh8seT6vd1E52FAyaVg8neMyjxRtgFF7tLMHKPh6H9zzHTFGTNo78SY7RrpwmVnhDkD', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: 'i1uD8DtxY1MGZ5o58HqFEtv6hu9yRzwE9KJeZQJzYzBtVR6HMfq6nUiYqjJQLQoL8o87i5RvVmgWzxNEsYyLU2m', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '473eBWB9spCU3NGx6ug41UeVpd7Mw1wdjnPbBjoxpLXKwBG8Bkzg3qokjRGgpmnWBLwkV3FAvvboNgo7PgQxydoz', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '52iiQzYUo782LoXgF7byXsj413cgHUaax7dVLJ6pwgsL6gt1xWUCm9LT7cJJwdjhbv3TNzty8PixCCa7e24gJHJu', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: 'QcK7WShBB8aUzjEFNZsd7xUCUkTApm3xjhfiZSJgZedbGUERpvpC7rSZPcNo7S3mvfQWraRYr1UTiQVC2qK25Qs', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '5wSKmYU2gs7ZTdhwLBUy6rw4qYxnPg6XNRfoD7bYizFgm7ssi16JmZgyBecnR1w4xidBQRBQXVRUtEASotaenLCk', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '65Qfv2u4LjjEAVwHM8KJa7a99twzvY4z5z3BKAZNZbiQvdwqrqf879RQRKa8b8gDZk1dS8hTv3FbP6LnqYvqvW8z', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '4dmYYkV6asU7PnpmtJ4TdXguu78Rcz64dUY7tYjUWuuAHezksqFUivmvqzfyHQYp9ttc3UNPr1rxguwfUg4oi3iF', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '3kRUN9QsY5boBboPuZM4SXCMaakCGUwpBPdk6erimE29WmCdhxKj4Xer7Uagv6YjTWeiw32EZTAtJdzpKejtK4W', processed: 16 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: 'mHagcKbqMdskkeBSnAnM7NrF6XcJJapzvgvvSiuR3NzEj1KHBwVE6wuF2NATwkzVsjR4ULLx2fCW14Usf2qcdQo', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '5i1ZJMV4CYqv9baBCwqieQ1K488ceUDy5iusgHSW96tJfFZwYDUiyDaBHuBQy1otrnSyRYW7uxF2DMaPFDjgjfim', processed: 7 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'vUrW54TkqY47qW6qyRNi1cT4v8dfkzxWEeUSM11454hq6URwKLnqw2v4Ga2WMLV95gdgQ2byP53ooWz7xE7uovt', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5vgLKg5RGSUpgnL95EHpyUdyeyLurn27xJnkGfxsbsof7H2rqgXaNFFHNy8cGrYRMTkC3jz4eVyov74yZ1h66R7p', processed: 18 }
🔍 TRANSACTION DEBUG: { signature: '2DuDMAgbNqud9tEaF3HAr257Nr2X7yNFUAu3sQFNKPrk3zwTATL6f2Ce1gVJM7BVFaUWhYUctvwbgmsGxvcHjM1E', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '39K2rNKT13mquRqFkwdPAxrDEdBc49qhvky8euYRgAkUDwdS2vpb39aXqC6Az9VcUgowWD6CaUkR1jwQyivV4yt8', processed: 19 }
🔍 TRANSACTION DEBUG: { signature: '5CCkcivJtxYfGtZF5BXhjntv2o5PfJfU1yHzeS1YJn5DQvrS9QtQ4KXibd6F3UtsiAXwXcZoyfmCBgBiQhMm3tkK', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'UXmBYRV1hYtxNSVXL5xdANMbGhqPBFtCYszYQmrxhssB2TzFBmM7EgfCz8Ud8hyBtKsDRruPUzVEkjFZy5WezT3', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '4zn5CSiDtQD8N7N1bDj3eYHaQJpfVstpEBKXVSfiQTMmRhbPk7bMWZVpNhCgoz9r51kNedRoDcx4PYSXGsgthRXE', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '34TkSsZMgGFgStLQvKfDuWHDYyQDhBVfKBpyzNrXxqAx7jBBudEnPUbqqoGybhfzckS9czCPfrarL5tRnqJz479r', processed: 20 }
🔍 TRANSACTION DEBUG: { signature: '5YhM9PXtBfrnnFh7vqS25mvCjU9JhsB5GoHX2NLL8m93U4skAGR191hvet2K8kudhHzathQRhEcdJkQ8ZM1YsJJF', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '5nzRRBtCQPtgJsKiWEnjdd6W6brzqfJgcumTbCijym3b92DqyJGyoN5wtaTBSSNoBH6Knoe54xpDEmQV55ZLTTKG', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '3e8117W4V3kBpFd8Z9YKd96NuEg29dL5TLBoFq28HoV8MqVJsHECQwEsfmAArqioRZ5wMiqxHYQfdTb2rTsVa1T4', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '63XdwgdRSXr6nGnj2aT1Rgo9KdoysyGukEQU1Br9XD6vZjsxBcMC1ewRoMkJv7MdL8HPU9SSnAMFSdZ7xpcMo1oC', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '29k2swjCTinKLmnF5q62JYF7rQjqJQ2Ju9MefwQj2dpUXFzudyQEb9LgUbYS34xkUkQBTYVGWeQh3rgMq4V8dF4P', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '3FdPuh7qDfpDzRKJxPzUYwq8QPzYU2akiufAexRmnr1xZ5VDv2wFnS2Xe4ZgAHeS3nvNWpdCk3dgmNgdZVekvSLV', processed: 22 }
🔍 TRANSACTION DEBUG: { signature: '3rLVQsWDhqD7FCpSrt2i9dnHj72RmR4S2khGUQQkuwtVoRuz4KBe9H4b5LumGQNQDH9t4G654mAJBkqKTqt9Liq5', processed: 12 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '57rVw9bwyLBNv5N1VBvPtgjmKGCJaBppMjEUma7RtRJDZmagCLedH126ivzpHwUiriTBrjscxB55agTT1h8qT1er', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '2GwFDpnt6gqYyFtD9YxpeMBvauU423NtiiybBgqjfeePB1uRzu1MRiwuTxowURZsxLHUCJCtQScbMq1ZgiZzB9mG', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '55xd2tVDggAGJTssrYPdWAfH2SBPtYNAiG9nLt9mDrZ4LSgZSpdsfwbzNCxL18TBXYoUBUCyX1QccNP7cqZhdLyJ', processed: 23 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'Y72DZ99bYjAgVwY2UKx1rtMKDS7q1zwvRpaFFUp3tHivZQAke5eRBqpRStdaEHMo3NoWq4uMvsJR5Em5WtfYABp', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2Mx98hkUofoMvyxNQLMS52yJA1W7EQzuJXfmYoUfFzA5U5RY3Cfk6GnpKXrBVs7yC7NvkKoPg3tzkV2uqep95jLJ', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2jYWG8NnjgR3JyUxsho7oBrbQCd12J2qKKzcuKQSoNa3dX1VpyoWvZ4qskEpmKhuu2qhr8ZJc9yGvzoXAuuYxrxg', processed: 24 }
🔍 TRANSACTION DEBUG: { signature: 'vRh9L3Uh7d9nUijbjnj4riMu3BExD8148USX7JNBMpmvMBeqnbhA6T75gUEzFFMrQZjZLxTmWXJmoN5iGmhJE2B', processed: 14 }
🔍 TRANSACTION DEBUG: { signature: '3PtRJx3zyDkAeu43Pt1PhHFKhhwjRhM8Fv4PMkqsgfaSSeFv3xqNdkr4JZJcfF6WgoLo76ia4isLFxPtMERQZVFw', processed: 1 }
📊 SCAN COMPLETE: 0 candidates, 2639ms, efficiency: 3600.0%
📊 SCAN COMPLETE: 0 candidates, 4712ms, efficiency: 3625.0%
📊 SCAN COMPLETE: 0 candidates, 6743ms, efficiency: 3675.0%
📊 SCAN COMPLETE: 0 candidates, 862ms, efficiency: 3675.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 22ms, efficiency: 3920.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 7ms, efficiency: 4083.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4200.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 26ms, efficiency: 4287.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 17ms, efficiency: 4355.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 5ms, efficiency: 4410.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4454.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 46ms, efficiency: 4491.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 35ms, efficiency: 4523.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 19ms, efficiency: 4550.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 57ms, efficiency: 4573.3%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $159.18
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4593.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4611.8%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '3QDvScSYCuAcsW6qVzegyrKKxfbbqQtrB1z6StNNsYodRTkfUVeTRWTEebhi7vuxsCoYYYRskCmtczibQJcsUJMf',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '6c5b4833'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: undefined,
  current_hash: '6c5b4833'
}
  🔬 Parsing 6 binary instructions
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 16
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=163d84a3, dataLen=4, accounts=1
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.3ms)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 18,2,22,3,4,5,6,23,7,8,9,10,11,12,24,1,13,0
    🔍 BINARY ANALYSIS [3]: program=675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8, discriminator=e9, dataLen=17, accounts=18
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
      - Discriminator: 0xe9
      - Data length: 17 bytes
      - Account count: 18
      - Expected accounts: ≥16 for LP creation
      - Instruction type: unknown
    ❌ RAYDIUM: Not LP creation instruction (unknown) (0.2ms)
    ❌ NO CANDIDATE: Raydium analysis returned null (1.1ms)
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 6 instructions
🔍 TRANSACTION DEBUG: {
  signature: '5BE3Gyf6SUQJWPEtSpmE1y6QFiGdU74umSua3rqUtVbN51JoYFUZh9quzVr1Mt58PnLctLyFuGscEzpz8wemu3N4',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '45150326'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '6c5b4833',
  current_hash: '45150326'
}
  🔬 Parsing 8 binary instructions
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 21
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1e79241b, dataLen=4, accounts=1
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddab49b71082b5bb, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
  📍 Normalized accounts: 11,0,3,2,12,23,12,24,12,25,26,13,4,3,1,5,6,14,22,0,11,11,16,15,25,27,11,17,28,17,18,19,17,17,17,17,17,17,17,17,1,2,0
    🔍 BINARY ANALYSIS [4]: program=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4, discriminator=dd, dataLen=40, accounts=43
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  dex: 'Jupiter',
  category: 'router',
  memeRelevant: true,
  priority: 'low'
}
    ❌ NO CANDIDATE: Jupiter analysis returned null (0.4ms)
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 8 instructions
🔍 TRANSACTION DEBUG: {
  signature: '3QhEXjvh7ND2RmQejM81X7YFjYZaX8rCJRHHjtVe2XfWEnPHXT8cwZ6UR4LQjV17j5zWLHUa1vgcXCH1GKknUnSe',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '5e9988f4'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '45150326',
  current_hash: '5e9988f4'
}
  🔬 Parsing 8 binary instructions
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 21
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1e79241b, dataLen=4, accounts=1
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddab49b71082b5bb, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
  📍 Normalized accounts: 11,0,3,2,12,23,12,24,12,25,26,13,4,3,1,5,6,14,22,0,11,11,16,15,25,27,11,17,28,17,18,19,17,17,17,17,17,17,17,17,1,2,0
    🔍 BINARY ANALYSIS [4]: program=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4, discriminator=dd, dataLen=40, accounts=43
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  dex: 'Jupiter',
  category: 'router',
  memeRelevant: true,
  priority: 'low'
}
    ❌ NO CANDIDATE: Jupiter analysis returned null (0.6ms)
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 8 instructions
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 31ms, efficiency: 4627.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 18ms, efficiency: 4642.1%
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
📊 SCAN COMPLETE: 0 candidates, 9ms, efficiency: 4666.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4677.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 43ms, efficiency: 4687.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 29ms, efficiency: 4695.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4704.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 8ms, efficiency: 4711.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4718.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4725.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4731.0%
📊 System Health: 7 services, 0m uptime, 17.9MB peak
🧠 Memory: 18MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 23ms, efficiency: 4736.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 13ms, efficiency: 4741.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 53ms, efficiency: 4746.9%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '3QDvScSYCuAcsW6qVzegyrKKxfbbqQtrB1z6StNNsYodRTkfUVeTRWTEebhi7vuxsCoYYYRskCmtczibQJcsUJMf',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '6c5b4833'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '5e9988f4',
  current_hash: '6c5b4833'
}
🔍 TRANSACTION DEBUG: {
  signature: '5BE3Gyf6SUQJWPEtSpmE1y6QFiGdU74umSua3rqUtVbN51JoYFUZh9quzVr1Mt58PnLctLyFuGscEzpz8wemu3N4',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '45150326'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '6c5b4833',
  current_hash: '45150326'
}
🔍 TRANSACTION DEBUG: {
  signature: '3QhEXjvh7ND2RmQejM81X7YFjYZaX8rCJRHHjtVe2XfWEnPHXT8cwZ6UR4LQjV17j5zWLHUa1vgcXCH1GKknUnSe',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '5e9988f4'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '45150326',
  current_hash: '5e9988f4'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4751.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4755.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 19ms, efficiency: 4760.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4763.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4767.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 31ms, efficiency: 4771.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 20ms, efficiency: 4774.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 11ms, efficiency: 4777.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4780.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4783.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4786.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 5ms, efficiency: 4788.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 45ms, efficiency: 4791.1%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $158.8
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 40ms, efficiency: 4793.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4795.7%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '3QDvScSYCuAcsW6qVzegyrKKxfbbqQtrB1z6StNNsYodRTkfUVeTRWTEebhi7vuxsCoYYYRskCmtczibQJcsUJMf',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '6c5b4833'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '5e9988f4',
  current_hash: '6c5b4833'
}
🔍 TRANSACTION DEBUG: {
  signature: '5BE3Gyf6SUQJWPEtSpmE1y6QFiGdU74umSua3rqUtVbN51JoYFUZh9quzVr1Mt58PnLctLyFuGscEzpz8wemu3N4',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '45150326'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '6c5b4833',
  current_hash: '45150326'
}
🔍 TRANSACTION DEBUG: {
  signature: '3QhEXjvh7ND2RmQejM81X7YFjYZaX8rCJRHHjtVe2XfWEnPHXT8cwZ6UR4LQjV17j5zWLHUa1vgcXCH1GKknUnSe',
  slot: 357481637,
  blockTime: 1754178474,
  accountKeys_hash: '5e9988f4'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '45150326',
  current_hash: '5e9988f4'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 15ms, efficiency: 4797.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4800.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 43ms, efficiency: 4802.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 32ms, efficiency: 4803.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 21ms, efficiency: 4805.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 9ms, efficiency: 4807.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 44ms, efficiency: 4809.3%
^C[THORP] Initiating graceful shutdown...
🔍 Active LP scanning stopped
[THORP] Shutting down service: lpDetector
🔌 Shutting down Renaissance LP Creation Detector...
✅ Renaissance LP Creation Detector shutdown complete

🔌 Received SIGINT, initiating graceful shutdown...
✅ Shutdown complete