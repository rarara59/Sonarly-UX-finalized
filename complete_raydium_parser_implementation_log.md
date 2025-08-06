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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.959Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.961Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.961Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.964Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.964Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.985Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.985Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.985Z"}
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
info: 📊 Metrics server listening on port 9182 {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.987Z"}
info: 📊 Prometheus metrics: http://localhost:9182/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.987Z"}
info: 💚 Health check: http://localhost:9182/health {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:51.987Z"}
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
Math worker 2 started
Worker 2 is ready
Worker 1 is ready
Math worker 1 ready for tasks
Math worker 2 ready for tasks
✅ Secure TLS connection established to mainnet.helius-rpc.com
   Protocol: TLSv1.2
   Cipher: ECDHE-RSA-AES128-GCM-SHA256
🔗 Production Helius WebSocket connected
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-03T02:41:52.163Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $160.42
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4u157nn7VS1qTUxJWtpY6s2QzSoZUq2CuavL7VuiiBUHXoZDtWS9BCFm1JsuYCvCm4oxYvwZH1B8KdDNPkC96CM8', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '2AbZnMRsXz8SsgNyXZnHHYD57TUQjeTDBw1XMQdtX1tkELh7pgFuEuYrgLJawJrTmoXai8tVs8vnsBCy5P6WsN8w', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'hUqiCyf5Gshrv2KX2Vw2VLxsjwZa9CCBQwkQph9NBkXHo8JHWAK6RSyth7FWh3qj3z4hMPoZgpgUpGq5TH9gEU5', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '5R9YMentScucRfBtbGc5fGeFyLupvfrYtkHF49zn5etAbgP1pyu48txoH3pkFRrHEqY5faH52nLt9p6juLwWUMMc', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'S5Yuu7wQbCsYXbcXcoB1Li1Jy8QGp6JxWcZ2a9Bnrx32V9caWpiXHTZrgLeZnpdKvQTuSA3E3R7aWWSHq7qvoaH', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '21WUstFSW7RFZyCkJVisBA7cupab16NtYT8ZgbAXaYqSBNREQdfca4Hv7po6oGGZp4vLD75aeUungRp8ZMGrJzyu', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: 'WFCb2tAduHZGs9o9DbjBJiGbXd6Me1bHQhgjANdtTRo1eiB7cPMmUuiStkKWEZGfof6DfLtyPMcZure59bratFu', processed: 6 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '411sVmf96QQTJJS4x849T1SB9zykKevx1oadhfokRbDXDt6NbsRAGDfEYLBvtqSwufaDxXujf9d1ooVfhkmiUpwn', processed: 7 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3tUdDDwrPAdtgYUNiBLNBBuxGUvPW2CxEjQsR3f1QbQLUAAsN3PayU3tajpfYyaXTej6bFVG6rXvS6VyPk537vwD', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '4jR87bt57SrxW7nCRySMUVsx8m2uw38ssz4eV638s9dYw7fbc56bC7mQVczuBCYivoUbaFc2EWQWgrcUVaDo6Mph', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: 'Z6yYVMRB6KHjyWiJ2iBKXqbBxQDFwGSrENgyYWYfPn7esBJSyFX7XWsPJskMDQ5nGJnPjPZEnpJjyXbYRArP3YN', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '5eojMX5gwxJTRfvZXP8DhYmeRYVuNtPJF25ubwyeTaVxMvSMEq9dnoAiUkFpMKCWpNN9NGuX4XpBVMDz5aiWJiDq', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '41TXDpzi2A8sbBJCY2azUnQRUDk67bjXRbCCD5irN6W4wGPr36AvBXCKvfn5RjphE6Wmp8K8EWo75DDTqeXDqg6d', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '4DsCugBToS7i44wCMDjTNz5sfVPLe1ScsFMfDdqpXGY7NJaMtamMtYzFvfMrDZjm7x3RCJrhDtxfDwhPRiyEkwxy', processed: 10 }

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
🔍 TRANSACTION DEBUG: { signature: '5TSVufAUD32qvS6en7gvxRCRGYrn24SdW8HuyGScLDSxL6J2kWKEv5CwGGc4WDnSjKtyzeheg8uTDYbM8UckYZuR', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '2hyZktUBPaKDBBqLita8QzCXQ7Jz8vANMqQ2asjqLEHUnuKiK7kmHmScLrMruSWdMjxf7izfRGMfDjU3nVJ7vdmr', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: 'AcdYwmLqdc4aG5SxtQ2VP3fECJgUbcddQu962HuS9odEhNWXrfCinRW9d6WoPGh7qWYG6hb6fmWNUMwJHgeKPJH', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '2BW6xoENz6Z2GCgFXWJoiB5wCLEdS9Ad8tXGoCSofCCr2HFZd5BXNoY2X88tV6Di1TyHWkC5sE1J1twwcAozMkDP', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '47TgDKq5gvmUzjUaobLoJ2KJvNtCxj3zffMxcrQELWMTpXWEpgE9KAPJm26KpaRv5LYVwYY6aq2Qim6DxXXVDtGJ', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: '3nv989zzfP7bocHX53ZTrbzthtiw3zYQZXpEvjgPJQt35HhoJKkiDEJsPz2x4NnDXqMT5yoazPpJaXhco72s16mV', processed: 13 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '2QzL7EoXHZY9PgikW9xyXp167XQhfFpGbMAvcybnHUeKhosptUFRBNvcPeaFHBkRmWgQGu2FNUScf4vc8JvbDaLq', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2wJnHWw9hK1d2Kg17aMdmD7X7M3UchETZ4pvd8MR2UQbYt2c3p4AfRoLNJ1ccoZpyA6iLrAEx34MxsdtMXSWksUs', processed: 14 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '5Z6EHh7igkg7XTaq6PpxsKe8rmYtodudNADJkRDHHa7RyfVDnGr4bZJJpvsgjhhoo4jYoi16wnq1g6s2JiUeLDin', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '5Tgz69eajGbgbqtig43Rc6QzcqEWsrTuvgNBWvQeQCgbTiUkcfHxyAn3RLSYbaet1X5eypMSwGMbqZSN1nub8h7F', processed: 15 }
🔍 TRANSACTION DEBUG: { signature: '5fikcSAQwQp8EdRdHqr25pTFnMVV7Lzk6Tt4PfeSxktrVBf7pAES5L12B4SeJYc5kWHGjKvtzzbSNU7YqR4q2Xu3', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '2k3QkE7C53PXYXCRsp9WLrqS1G3ND3gXS4NXuiPtHvcETjFb1aB5REqsGzea3zj2MbzbHypRwJMGMarTyLoHakBG', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '3LT9KRp4hKxpaN1tDzFBy5sCdJH6NLhk7aSH8XytfZZoiEUdUtaqrfnSAmpnbpVXcnEZbFWVqekXD4E7f52xJ1L3', processed: 8 }
🔍 TRANSACTION DEBUG: { signature: '5Sstck4ayoThWNTDoauMxc74FgdaEAdivTtUQowY5wVjgueLUvakX4qXGyGpcAMvaTonCpX5o88UJGkySyAQuwD6', processed: 16 }
🔍 TRANSACTION DEBUG: { signature: '2bcVmtVtzdSPvYUZ1493RjUfCy8HGGufSbrZE97qVpWpak4XSeLnmc5SLdiuvpn1y1zgKEERd1aiArSzHjZu1ixB', processed: 17 }
🔍 TRANSACTION DEBUG: { signature: '5kWLVNLovqEoaiJBSg6jzjwgGNsLC8STw9tzz2yid3JCLbx2ZTuuDmbCRDurMiMeK4Df5GroD4XAAHuGzxLbj5f5', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3izhbfXoV2A8dWjixzNvycJdS9rU4uaJhwb6wQonMeo53Pq7LohvdRh5CsBbXyRagfRpPPxLxtyQp3ccepYXonJp', processed: 9 }
🔍 TRANSACTION DEBUG: { signature: '4uSAAL2qm1rZbfsu1SwUUMYDBymvfXvDcDRXGZzoMKWFrHkTiwaUgT5igiQFaM9R9bPfpdgwy2SBjVhjrTdUbrjf', processed: 10 }
🔍 TRANSACTION DEBUG: { signature: '4WuXtsp7EE7UXRLXsBsRAtKLbTSoADBAkn1qa3hvt74xNxLkj7hogEWnuw5ETvMVa6L7cvNDE6Wit7CofryGS8qH', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '3NPJog5ptxxiyBMNfFK9SH48TyP1LLsJf6PDjzpGHBtb1aMt1UhqFMvcemBtatbivF2f3oTLLsKn5rd5yfn7yPKT', processed: 18 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '5xdKKopjr8tfbq24xecQDoMsUkRgZP7nAS9sbi54YbqjhtRttW2dMQn3a9QFZa73iUTyNXFYmSwzXDqXo8jrK7hz', processed: 11 }
🔍 TRANSACTION DEBUG: { signature: '4jCwof88rVkJmc4p63wsgJEdYSjrS4yLoer31emU21fqRTinU7H6jDgkEkv8QjkJgk8xwMp23eWGUxucfDtSqxVA', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '3LJHBxKLhtZVhtb1VLYQJUQ2KxfDbRvd8hKkycmAA1JmokB35jRu5RXNhnVgaNYCmrZYGv4vSKsZMzRvi3dyrpk8', processed: 19 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '3WDCvM2u2swq1Ub8m2T18KXm77Tz9Z8adcbabTDokQWcc2Tk3ATt1E1umXsEd4HaVB3hUrz6wcxop1R4D4EAGRJ8', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '48qU9dsJQTsjbpJ1jMzDzxK2bYrvhgDkER1K4z3uj3cGKZKxAFD96L5bMJLXfABgofG3JnnTNuXF937qtZAPnHrm', processed: 12 }
🔍 TRANSACTION DEBUG: { signature: '5THqFv9fHxFkJaML19YYAc1dzUzHBDKSVMpCmeGVXL9XHC5Ue1GQsQTkLkS8tttcV79chJWCABrappvK6RYXZ5D8', processed: 20 }
🔍 TRANSACTION DEBUG: { signature: '2Dn2hYgYMCBtZR9MjwBQtqLDzKAB5L39zgu2sYiF44DEs5nH2zMaYp3dbuo2PNhhe9G9Suz1SfHTwxXDscf17fvz', processed: 5 }
🔍 TRANSACTION DEBUG: { signature: 'CgHLEmH4LVBNfZHg3Cc4yeHuBdoCfU6xtvavmVAiAMdoTXoJAGm8YqpK61o2vvN48gdBrURSXB7HUiLSyHSzcKA', processed: 13 }
🔍 TRANSACTION DEBUG: { signature: '5UZ11CYSke8EpByEw1XbDkMjL42kupycertJrPscqH5i2HbvT7uqtwvcgUEaLt62Wwe9SBoEDz5AcJ7DSsjMW62E', processed: 21 }
🔍 TRANSACTION DEBUG: { signature: '3HWLL4yYjNAS4rzw1kk3KJ72ApKE5jtLc37USTFWBJvJAYPHcRAPoHvcaiXYLYVwWn48BqFtZHB9XYemkzuWsNF2', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '5DvmNeWJVvZKM1B7YaVcZGMC9ekP4eSy9mgjdvqNVYBWtfDRTYGbjgdAgkp5G8B3ihSWoUWwb81E3TcK7tbgcrdR', processed: 1 }
🔍 TRANSACTION DEBUG: {
  signature: '5DvmNeWJVvZKM1B7YaVcZGMC9ekP4eSy9mgjdvqNVYBWtfDRTYGbjgdAgkp5G8B3ihSWoUWwb81E3TcK7tbgcrdR',
  slot: 357507977,
  blockTime: 1754188907,
  accountKeys_hash: '333c4e49'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: undefined,
  current_hash: '333c4e49'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1e79241b, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.4ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddd8117fcb3ab9e5, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.2ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 10,1,11,2,3,4,0,12,13,5,14,9,6,7
    🔍 BINARY ANALYSIS [2]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=0094d0da1f435eb0, dataLen=24, accounts=14
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  dex: 'PumpFun',
  category: 'token_factory',
  memeRelevant: true,
  priority: 'critical'
}
    🚀 ROUTING TO PUMP.FUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x0094d0da1f435eb0
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (2.1ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (3.3ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '5C2Mtg1WRwywyauyL1oounCfGamqSb99G7U6AAhFEDQMQL2sLLnFkrsDPQehdfuXHunz86rsMidiS3QJgchLqrPw', processed: 2 }
🔍 TRANSACTION DEBUG: {
  signature: '3HWLL4yYjNAS4rzw1kk3KJ72ApKE5jtLc37USTFWBJvJAYPHcRAPoHvcaiXYLYVwWn48BqFtZHB9XYemkzuWsNF2',
  slot: 357507977,
  blockTime: 1754188907,
  accountKeys_hash: '3db32286'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '333c4e49',
  current_hash: '3db32286'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1f340377, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.4ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=de026a92870c59a3, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for fat2dUTkypDNDT86LtLGmzJDK11FSJ72gfUW35igk7u
  📍 Normalized accounts: 0,1,2,11,3,4,12,13,5,6,14,7,8,9,15,16,17
  ⚡ UNKNOWN PROGRAM: fat2dUTkypDNDT86LtLGmzJDK11FSJ72gfUW35igk7u (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=fat2dUTkypDNDT86LtLGmzJDK11FSJ72gfUW35igk7u, discriminator=4ea6ebb23e795737, dataLen=81, accounts=17
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'fat2dUTkypDNDT86LtLGmzJDK11FSJ72gfUW35igk7u',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: fat2dUTkypDNDT86LtLGmzJDK11FSJ72gfUW35igk7u (0.1ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '3tdwCaWwq8jrbiPh8CuiNBLpb54PW44JrVzLbZYDmKo78tvRLP5EuMoZKJ12TSaDfQJdNvpeXNuDsaCuMeCBzNZe', processed: 7 }
🔍 TRANSACTION DEBUG: { signature: '2rkpnxj4QRq8Z63CY5PVZboeH8zoNDzFCSnmDTntigrV6rxkQazfb57Q2iVo9Ejh5Hw8CeE66dvCLeTVKnnE5q7X', processed: 22 }
📊 SCAN COMPLETE: 0 candidates, 5930ms, efficiency: 3525.0%
🔍 TRANSACTION DEBUG: {
  signature: '3tdwCaWwq8jrbiPh8CuiNBLpb54PW44JrVzLbZYDmKo78tvRLP5EuMoZKJ12TSaDfQJdNvpeXNuDsaCuMeCBzNZe',
  slot: 357507977,
  blockTime: 1754188907,
  accountKeys_hash: '17e71b1e'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '3db32286',
  current_hash: '17e71b1e'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1e79241b, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.2ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddd8117fcb3ab9e5, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 10,1,11,2,3,4,0,12,13,5,14,9,6,7
    🔍 BINARY ANALYSIS [2]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=0094d0da1f435eb0, dataLen=24, accounts=14
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  dex: 'PumpFun',
  category: 'token_factory',
  memeRelevant: true,
  priority: 'critical'
}
    🚀 ROUTING TO PUMP.FUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x0094d0da1f435eb0
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.7ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (1.2ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
📊 SCAN COMPLETE: 0 candidates, 3999ms, efficiency: 3550.0%
🔍 TRANSACTION DEBUG: {
  signature: '5C2Mtg1WRwywyauyL1oounCfGamqSb99G7U6AAhFEDQMQL2sLLnFkrsDPQehdfuXHunz86rsMidiS3QJgchLqrPw',
  slot: 357507977,
  blockTime: 1754188907,
  accountKeys_hash: '558ae0c5'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '17e71b1e',
  current_hash: '558ae0c5'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1e79241b, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddd8117fcb3ab9e5, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 10,1,11,2,3,4,0,12,13,5,14,9,6,7
    🔍 BINARY ANALYSIS [2]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=0094d0da1f435eb0, dataLen=24, accounts=14
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  dex: 'PumpFun',
  category: 'token_factory',
  memeRelevant: true,
  priority: 'critical'
}
    🚀 ROUTING TO PUMP.FUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x0094d0da1f435eb0
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.7ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.9ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
📊 SCAN COMPLETE: 0 candidates, 2004ms, efficiency: 3600.0%
🔍 TRANSACTION DEBUG: {
  signature: '2rkpnxj4QRq8Z63CY5PVZboeH8zoNDzFCSnmDTntigrV6rxkQazfb57Q2iVo9Ejh5Hw8CeE66dvCLeTVKnnE5q7X',
  slot: 357507975,
  blockTime: 1754188907,
  accountKeys_hash: '386968c0'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '558ae0c5',
  current_hash: '386968c0'
}
  🔬 Parsing 5 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=2b5c1565, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dc6006e5ea20bd38, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 10,1,11,3,5,4,0,9,16,2,14,12,8,6
    🔍 BINARY ANALYSIS [4]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=0094d0da1f435eb0, dataLen=24, accounts=14
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  dex: 'PumpFun',
  category: 'token_factory',
  memeRelevant: true,
  priority: 'critical'
}
    🚀 ROUTING TO PUMP.FUN ANALYSIS
    🚀 PUMP.FUN DETAILED ANALYSIS:
      - Discriminator: 0x0094d0da1f435eb0
      - Data length: 24 bytes
      - Account count: 14
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 14)
  - accountKeys: EXISTS (length: 17)
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.9ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (1.0ms)
  📊 Binary parsing complete: 0 candidates from 5 instructions
📊 SCAN COMPLETE: 0 candidates, 8007ms, efficiency: 3600.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 28ms, efficiency: 3840.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 16ms, efficiency: 4000.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 4ms, efficiency: 4114.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4200.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4266.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 20ms, efficiency: 4320.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 7ms, efficiency: 4363.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 47ms, efficiency: 4400.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4430.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4457.1%
🔍 Scanning for new LP creations...
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $160.43
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 425ms, efficiency: 4480.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 5ms, efficiency: 4500.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 45ms, efficiency: 4517.6%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2hkTXzfK3z1Qef46C8VCk3DCKy8MYgFNyPgf8zp8Hoq91s8yYnkyK2VDec4zHywv42djQajA6NSfzcrCafUGvUTz',
  slot: 357508074,
  blockTime: 1754188946,
  accountKeys_hash: '4d571f52'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '386968c0',
  current_hash: '4d571f52'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=24285e63, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (5.9ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dcfea0d4ac469bb6, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.2ms)
  🔄 Converting account addresses to indices for FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ
  📍 Normalized accounts: 0,7,8,9,9,53,10,11,54,55,56,12,57,13,14,58,59,60,61,16,17,18,19,20,21,22,23,24,25,26,27,62,15,28,1,29,30,31,32,63,33,34,35,36,2,37,43,3,44,45,46,47,48,49,50,51,52,38,39,40,41,4,42
  ⚡ UNKNOWN PROGRAM: FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ, discriminator=e3db82adbbcb9990, dataLen=87, accounts=63
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: FoaFt2Dtz58RA6DPjbRb9t9z8sLJRChiGFTv21EfaseZ (0.1ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: {
  signature: '1GMWfwR8J6Sab97PbAFBkEFBD3AYUp3QKnCpjZ6LjidVoRg3kvnhm2uJ1Jbx2hi3pnt9YUnaDA8HjaTWwRW4b5D',
  slot: 357508074,
  blockTime: 1754188946,
  accountKeys_hash: '523408c8'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4d571f52',
  current_hash: '523408c8'
}
  🔬 Parsing 4 binary instructions
  🔄 Converting account addresses to indices for CwU7m7UiwYCcC3Tujt55GSWakHqkcp5uHvZPYJcDZriF
  📍 Normalized accounts: 0,29,39,44,47,48,51,50,32,45,40,49,37,42,27,43,38,15,12,8,41,28,2,4,21,22,7,18,47,48,13,6,46,11,10,52,14,9,16,1,5,46,45,35,33,34,36,19,31,47,48,17,24,23,46,3,20,52
  ⚡ UNKNOWN PROGRAM: CwU7m7UiwYCcC3Tujt55GSWakHqkcp5uHvZPYJcDZriF (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=CwU7m7UiwYCcC3Tujt55GSWakHqkcp5uHvZPYJcDZriF, discriminator=2f5f5c18a9d8efcb, dataLen=46, accounts=58
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'CwU7m7UiwYCcC3Tujt55GSWakHqkcp5uHvZPYJcDZriF',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: CwU7m7UiwYCcC3Tujt55GSWakHqkcp5uHvZPYJcDZriF (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dd056d0bae900b71, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 30
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=ComputeBudget111111111111111111111111111111, discriminator=1e669a55, dataLen=4, accounts=1
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=ComputeBudget111111111111111111111111111111, discriminator=50f855dd, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 35ms, efficiency: 4533.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4547.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 20ms, efficiency: 4560.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 6ms, efficiency: 4571.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 49ms, efficiency: 4581.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4591.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4600.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 19ms, efficiency: 4608.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 4ms, efficiency: 4615.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 45ms, efficiency: 4622.2%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 31ms, efficiency: 4628.6%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 23ms, efficiency: 4634.5%
📊 System Health: 7 services, 0m uptime, 18.1MB peak
🧠 Memory: 18MB (OK) | GC: 0 forced
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 14ms, efficiency: 4640.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4645.2%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4650.0%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2hkTXzfK3z1Qef46C8VCk3DCKy8MYgFNyPgf8zp8Hoq91s8yYnkyK2VDec4zHywv42djQajA6NSfzcrCafUGvUTz',
  slot: 357508074,
  blockTime: 1754188946,
  accountKeys_hash: '4d571f52'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '523408c8',
  current_hash: '4d571f52'
}
🔍 TRANSACTION DEBUG: {
  signature: '1GMWfwR8J6Sab97PbAFBkEFBD3AYUp3QKnCpjZ6LjidVoRg3kvnhm2uJ1Jbx2hi3pnt9YUnaDA8HjaTWwRW4b5D',
  slot: 357508074,
  blockTime: 1754188946,
  accountKeys_hash: '523408c8'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4d571f52',
  current_hash: '523408c8'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 30ms, efficiency: 4654.5%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 17ms, efficiency: 4658.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 1ms, efficiency: 4662.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 41ms, efficiency: 4666.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4670.3%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 15ms, efficiency: 4673.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4676.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 40ms, efficiency: 4680.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 28ms, efficiency: 4682.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 15ms, efficiency: 4685.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 51ms, efficiency: 4688.4%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 37ms, efficiency: 4690.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 23ms, efficiency: 4693.3%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $160.47
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 10ms, efficiency: 4695.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4697.9%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '2hkTXzfK3z1Qef46C8VCk3DCKy8MYgFNyPgf8zp8Hoq91s8yYnkyK2VDec4zHywv42djQajA6NSfzcrCafUGvUTz',
  slot: 357508074,
  blockTime: 1754188946,
  accountKeys_hash: '4d571f52'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '523408c8',
  current_hash: '4d571f52'
}
🔍 TRANSACTION DEBUG: {
  signature: '1GMWfwR8J6Sab97PbAFBkEFBD3AYUp3QKnCpjZ6LjidVoRg3kvnhm2uJ1Jbx2hi3pnt9YUnaDA8HjaTWwRW4b5D',
  slot: 357508074,
  blockTime: 1754188946,
  accountKeys_hash: '523408c8'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '4d571f52',
  current_hash: '523408c8'
}
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 33ms, efficiency: 4700.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 25ms, efficiency: 4702.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 9ms, efficiency: 4704.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4705.9%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 35ms, efficiency: 4707.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 48 unique, 2 duplicates removed
  📊 Processing 48 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 26ms, efficiency: 4709.4%
^C[THORP] Initiating graceful shutdown...
🔍 Active LP scanning stopped
[THORP] Shutting down service: lpDetector
🔌 Shutting down Renaissance LP Creation Detector...
✅ Renaissance LP Creation Detector shutdown complete

🔌 Received SIGINT, initiating graceful shutdown...
✅ Shutdown complete