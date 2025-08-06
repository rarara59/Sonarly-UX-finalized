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
info: ✅ Initialized Solana connection for helius {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.964Z"}
info: ✅ Initialized Solana connection for chainstack {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.966Z"}
info: ✅ Initialized Solana connection for public {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.966Z"}
info: 🧠 Memory monitoring started {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.968Z"}
info: 🔗 HTTP connection tracking started {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.968Z"}
🔗 Connecting to: wss://mainnet.helius-rpc.com/?api-key=HIDDEN
info: 🚀 Renaissance-grade RPC Connection Manager initialized with full ES6 support {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.989Z"}
RPCConnectionManager initialized and ready
info: 🚀 WebSocket Manager initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.989Z"}
info: 🚀 WebSocket connections initialized successfully {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.989Z"}
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
info: 📊 Metrics server listening on port 9104 {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.991Z"}
info: 📊 Prometheus metrics: http://localhost:9104/metrics {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.991Z"}
info: 💚 Health check: http://localhost:9104/health {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:46.991Z"}
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
Math worker 1 started
Worker 1 is ready
Math worker 2 started
Worker 2 is ready
✅ Secure TLS connection established to mainnet.helius-rpc.com
   Protocol: TLSv1.2
   Cipher: ECDHE-RSA-AES128-GCM-SHA256
Math worker 1 ready for tasks
Math worker 2 ready for tasks
🔗 Production Helius WebSocket connected
info: 🔗 Helius WebSocket connected {"service":"rpc-connection-manager","timestamp":"2025-08-02T23:24:47.132Z"}
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
WebSocket handshake successful
🚨 Jupiter API failure 1/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $157.98
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'SaCGsnpCKArwPhwMP4RzWZP276ZcaLFRAfBtUQEtipE9VWitmJqnkj5BxFD7ZG6vdWVVR9zWtHSYtrnHidVKon7', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: 'A5hcKneVc1VGJ5sLNpED2ooDry7uqFUQ4YYBiRAq5yXabYPgzAMzMdn77M3Qn4gUsLsmiMQz5nf4wmP1B1HM7CR', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '2Y2qd7DzhkuNkFgHEwD6qK4TNQm462HhYb8FT2tFDqmca6rAgi6wyvh39FTJCwjjEYqzie2PcpDqZ4sf6BtiGqse', processed: 2 }
🔍 TRANSACTION DEBUG: { signature: '3TNpx8RFnrw2McAU3yAYGQSeEV4oPrD7gEjJWr4KfvCXpbG73ku3Nf1vmH4HGjST8WzwPoh1JyiCWAGiaHgiyuoP', processed: 3 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '4QmhCuLW6ia3YrJL6v1rcughxnh6M63vfKZwvtkBAJSEAtKjeJwwSwQLaU19EgCbUs6bW2LzJQXJeqxb43BgWFX5', processed: 4 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '2c3uwKFNT1p6Dxz52SksjaJKT9xQMJbMHfFk9ZJzG9qh1FxGZ1dCqkTTDjr262jo3foTJ1fEJcZu1JibKRHQ8jt4', processed: 0 }
🔍 TRANSACTION DEBUG: { signature: '38PNusB8dHr2yjF5SXrT7BSszdXFx3H4tSbprqnPi2EDkTZCSar88KGoQM7s4WkipnDzvo2txkbDc7cgcZuAMTaz', processed: 5 }

🔍 Starting active LP creation scanning...
✅ Active LP scanning started (30s intervals)
🔍 TRANSACTION DEBUG: { signature: 'KE7vgF6uxjwJJbaXVJ982Upxz1iBQr6dYwuQQ9ut8mg4szCwdaZwN7EeaKRhfWq6qyURP7rwJQaZZr6jwJ2sbhs', processed: 6 }
🔍 TRANSACTION DEBUG: { signature: '2QznTBhLf5HFCmf9iWWQZqrC1H225CmicApyRkLdJfEKhzMwmJVniopbewUYC8L8577FD6FuZQVQxn22wtoVqX5f', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: '5GYuUSDwUFP1KPKz9VBqmqg1Z2YKGekKC25XtzHGeP48S716GtVQPhFcDjWwB9GMQ2uosJxkp4oTQd9EvKy12C6o', processed: 2 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '4arekpJ3dj8BtbfrRhU8hbof1fd964JDeBnko6GB4HoTMdTjWHnHgMA8cyfiWtHyq24cfEHTR8Nomfhg8cXUttG', processed: 7 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '2duj6T8GBqVr3MTFQ6CSzFzcsrm5st3wYgwojhUtuykT5UJYAYGmgGk1jSm6KdBEBkN7DedDg1dzpVxW3KJaMbkn', processed: 0 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: { signature: '5SsqwmkFuuXKUHFrGCTb96wbNUEvR1aS4HYb2CPQCgM8V1D4PwUzjTkKkeUWo1NLn86Kqyu6Y5VEwJcnnHRMkWea', processed: 3 }
🔍 TRANSACTION DEBUG: { signature: '2nrg4mqtJTFPVEQECiYEnxoperHi1eqbJMexdptoNeMx9jekh5F6PvMkdDdaMshexeEhxoQfgJFBem8sgkma3gLQ', processed: 8 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '5miDzC6SaECCfWApx8fARurk7ZW2qv4MSW5nSxZQmzDwd2BKKer2cbZegZNxECbgAwTy8GJdZR3Z26FPEGXDZcUy', processed: 0 }
🔍 Scanning for new LP creations...
  ⚠️ Transaction fetch failed: 2duj6T8GBqVr3MTFQ6CSzFzcsrm5st3wYgwojhUtuykT5UJYAYGmgGk1jSm6KdBEBkN7DedDg1dzpVxW3KJaMbkn (Transaction timeout)
🔍 TRANSACTION DEBUG: { signature: '65cYMPwSbKWguXAQVavu2gdfHvK5Z86idoQiYNueLMVMqk7fdZNud6nJxkJ4nApSbAqw3bjvT3GyKw3hPsLDUWCW', processed: 1 }
🔍 TRANSACTION DEBUG: { signature: 'PbUuxxG1eeWWNRqaLUZwg53tmKyy28kWuJTSxxRRgdQ2bQbGSLbRR2Wx2zHb29wdfpsuXgaF39Ya2X4yXAVkdLL', processed: 4 }
🔍 TRANSACTION DEBUG: { signature: '3fGFH4ftTovNV7Rp67ia531H3NPGBajT1xmXs6gzU9Sr8LuadnSS25r5tzfFVCXZDimHPQvEni3J741vRnM6eHqQ', processed: 9 }
🔍 Scanning for new LP creations...
🔍 Scanning for new LP creations...
  ⚠️ Transaction fetch failed: 5miDzC6SaECCfWApx8fARurk7ZW2qv4MSW5nSxZQmzDwd2BKKer2cbZegZNxECbgAwTy8GJdZR3Z26FPEGXDZcUy (Transaction timeout)
🔍 TRANSACTION DEBUG: { signature: '5pM3ia87EvaDetWCF53xwhuWBQZbiyGzo3UedYQ5E61VNEbS66XZxpzPiXAJji5WmGgoxrYAoHdRKhnN3MYuxnGN', processed: 1 }
🔍 Scanning for new LP creations...
  ⚠️ Transaction fetch failed: 65cYMPwSbKWguXAQVavu2gdfHvK5Z86idoQiYNueLMVMqk7fdZNud6nJxkJ4nApSbAqw3bjvT3GyKw3hPsLDUWCW (Transaction timeout)
🔍 TRANSACTION DEBUG: { signature: '3Hemg2ofXf13QqR9jrbuGdSvkdJPFDruozgocouV7DiSRC2JqXJdDtH5m3SyhyMf7db6XmPiM7zyqMXqq4pjBET6', processed: 2 }
  ⚠️ Transaction fetch failed: PbUuxxG1eeWWNRqaLUZwg53tmKyy28kWuJTSxxRRgdQ2bQbGSLbRR2Wx2zHb29wdfpsuXgaF39Ya2X4yXAVkdLL (Transaction timeout)
🔍 TRANSACTION DEBUG: { signature: '3bgzEbcfXvBnhHr1JkCFgK8hmxPLLEJuZB8wuGWgdSYwC6gDxJ57qGa72xTeYgqm8VtpSTCdsPkTB11MLPAEPHXX', processed: 5 }
  ⚠️ Transaction fetch failed: 3fGFH4ftTovNV7Rp67ia531H3NPGBajT1xmXs6gzU9Sr8LuadnSS25r5tzfFVCXZDimHPQvEni3J741vRnM6eHqQ (Transaction timeout)
🔍 TRANSACTION DEBUG: { signature: '4pXHSfGtsuL8MckrspXGDHtjbrqM7DPCq5QcGiyy65t6czZ9JrDy8PxWrFdV9kNkhfjwL1odR9EUUNsm8f6jJDko', processed: 10 }
🔍 Scanning for new LP creations...
  ⚠️ Transaction fetch failed: 5pM3ia87EvaDetWCF53xwhuWBQZbiyGzo3UedYQ5E61VNEbS66XZxpzPiXAJji5WmGgoxrYAoHdRKhnN3MYuxnGN (Transaction timeout)
🔍 TRANSACTION DEBUG: { signature: '3HA3cA28fxtkuA7zuh8Cgq9Fe9vhCH4bEBdp6zg7kG3SZ48HoC9Qp61ZHsG55DtR6Gn7hR1fB6VKBRUJzpaMcdFp', processed: 2 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '34e2SNvHq7yKpnhTW8KNGAMfa9BojmjZjVcnSPeGMAUTrkUs84oXKrPQtEMMFXm5moKDfaqfEEtyYhsZEwVxGQGa', processed: 0 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '41a7eP8hUsaFrEry4ix4P2A2qAYkkfWyb95HURYk83DjJwrSCvbBZMDf5G7Nea1AKeynKyXvHS7a4FFNTdefb5Rz', processed: 0 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'Fn7ACBQYPBna4h633Edr88T4bBMTVBgwisM7gmbeERWX2iZvXX6Xz6hjngFBsuFughanSThweQuUG8sm5aZS4qn', processed: 0 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: '4VcXsVzPHVfQVPhM7w627gszdZsdWBURX1igPrkHPPC8SEKsSrmexyVPuwhjsTYWobFyHp93rFVFVWmH4mx46qsM', processed: 0 }
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
🔍 TRANSACTION DEBUG: { signature: 'ahvN8GU3gKsof3BMvJN4ShVDBvrSJN5xsrhjSKaMxgnFqBP4BivcwbXoFrfTEaEYtBKfthWHDAsxZVGMVYd21Z6', processed: 0 }
🔍 TRANSACTION DEBUG: {
  signature: '3Hemg2ofXf13QqR9jrbuGdSvkdJPFDruozgocouV7DiSRC2JqXJdDtH5m3SyhyMf7db6XmPiM7zyqMXqq4pjBET6',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '12c7d3e2'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: undefined,
  current_hash: '12c7d3e2'
}
  🔬 Parsing 5 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1838da1c, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.4ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=de374c1cde0d15bd, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.2ms)
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
  📍 Normalized accounts: 12,13,0,6,7,2,1,16,11,10,10,18,10,15,12,3,14,3,5,4,3,3,3,3,3,3,3,3,7,2,13
    🔍 BINARY ANALYSIS [3]: program=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4, discriminator=d9, dataLen=37, accounts=31
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
  📊 Binary parsing complete: 0 candidates from 5 instructions
🔍 TRANSACTION DEBUG: { signature: '2EcAEQ2C6R9aEze9MDN381pDcskUDEpyNdoh8uCNrcRHgL3zyZw5wM8oKkt8r32B4cRrjW5zz5W768okakwbkfHt', processed: 3 }
🔍 TRANSACTION DEBUG: {
  signature: '3HA3cA28fxtkuA7zuh8Cgq9Fe9vhCH4bEBdp6zg7kG3SZ48HoC9Qp61ZHsG55DtR6Gn7hR1fB6VKBRUJzpaMcdFp',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: 'b0c1bd8'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '12c7d3e2',
  current_hash: 'b0c1bd8'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=14a8c9e8, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW
  📍 Normalized accounts: 0,18,6,4,22,23,28,17,21,25,19,22,18,17,17,6,21,6,8,6,26,18,15,16,14,17,19,22,27,24,22,22,20,18,12,21,25,17,11,19,9,10,3,2,13
  ⚡ UNKNOWN PROGRAM: ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW, discriminator=f794ed8c1347a21c, dataLen=97, accounts=45
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW (0.1ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '5gNdJC6eu7SWozTBt7xCRzFpxPYfiNf8pwwv3cLTa2a9uVYhxXekti4VvhR7ZN8BjXTrfpd6BBWy5TtuNYasBeKo', processed: 3 }
🔍 TRANSACTION DEBUG: {
  signature: '3bgzEbcfXvBnhHr1JkCFgK8hmxPLLEJuZB8wuGWgdSYwC6gDxJ57qGa72xTeYgqm8VtpSTCdsPkTB11MLPAEPHXX',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '5e01dce8'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: 'b0c1bd8',
  current_hash: '5e01dce8'
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
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 18,2,22,3,4,5,6,23,7,8,9,10,11,12,24,1,13,0
    🔍 BINARY ANALYSIS [3]: program=675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8, discriminator=eb, dataLen=17, accounts=18
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
      - Discriminator: 0xeb
      - Data length: 17 bytes
      - Account count: 18
      - Expected accounts: ≥16 for LP creation
      - Instruction type: unknown
    ❌ RAYDIUM: Not LP creation instruction (unknown) (0.1ms)
    ❌ NO CANDIDATE: Raydium analysis returned null (0.9ms)
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 6 instructions
🔍 TRANSACTION DEBUG: { signature: '44WbHYmjH1MT6AZyXTAcNCKDD181hvXSn8qB6xkg484qmWiL6NZqo931q7P5F36tqwFo3LCzYGjuvC8oKKEaujUn', processed: 6 }
🔍 TRANSACTION DEBUG: {
  signature: '4pXHSfGtsuL8MckrspXGDHtjbrqM7DPCq5QcGiyy65t6czZ9JrDy8PxWrFdV9kNkhfjwL1odR9EUUNsm8f6jJDko',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '2057b6de'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '5e01dce8',
  current_hash: '2057b6de'
}
  🔬 Parsing 4 binary instructions
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 17
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=10b637b7, dataLen=4, accounts=1
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dcdbd4a3832ea994, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
  📍 Normalized accounts: 18,0,4,4,3,19,3,20,3,21,24,6,0,4,5,7,8,9,10,18,26,26,25,22,18,11,23,11,12,13,11,11,11,11,11,11,11,11,5,1,0,22,18,14,23,14,15,16,14,14,14,14,14,14,14,14,1,4,0
    🔍 BINARY ANALYSIS [2]: program=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4, discriminator=1e, dataLen=44, accounts=59
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  dex: 'Jupiter',
  category: 'router',
  memeRelevant: true,
  priority: 'low'
}
    ❌ NO CANDIDATE: Jupiter analysis returned null (0.7ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=ComputeBudget111111111111111111111111111111, discriminator=4c1f0f0f, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '5CyzXYi1tJw6VjmfJD4LRSLNGT9QB3geBfmXTa1UzwHNVsiCr7TH1WnhUw8oFSgXcGV6gdf7z34bzfCYArdZQqZq', processed: 11 }
🔍 TRANSACTION DEBUG: {
  signature: '5CyzXYi1tJw6VjmfJD4LRSLNGT9QB3geBfmXTa1UzwHNVsiCr7TH1WnhUw8oFSgXcGV6gdf7z34bzfCYArdZQqZq',
  slot: 357478159,
  blockTime: 1754177086,
  accountKeys_hash: '192ff29d'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2057b6de',
  current_hash: '192ff29d'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=dcf61b475da6cf06, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.2ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=2c424313, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.5ms)
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 13,5,14,1,2,3,0,8,12,7,16,9,6,4
    🔍 BINARY ANALYSIS [3]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=0094d0da1f435eb0, dataLen=24, accounts=14
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
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (2.1ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (3.2ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '4YiapDy49mn2s9JPrtxcyMgCWfrBaExwfsU2DSRhepwzpJFYLAtVC28Xazhen2t9UANtzgZTPVi53RbEB1paBuHS', processed: 12 }
🔍 TRANSACTION DEBUG: {
  signature: 'Fn7ACBQYPBna4h633Edr88T4bBMTVBgwisM7gmbeERWX2iZvXX6Xz6hjngFBsuFughanSThweQuUG8sm5aZS4qn',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '127bdfb3'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '192ff29d',
  current_hash: '127bdfb3'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=2826ac0e, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW
  📍 Normalized accounts: 0,22,8,6,27,28,33,21,24,30,2,29,23,27,22,21,21,8,24,8,10,8,25,22,15,16,14,21,23,27,26,25,22,12,13,11,2,23,27,26,32,27,27,31,22,20,24,30,21,19,2,17,4,1,3,18
  ⚡ UNKNOWN PROGRAM: ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW, discriminator=e761cad661d8057f, dataLen=102, accounts=56
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ArbiT5roZVrSvdXE4AWiBGkTMZrU1hWV7i7yuAhcJZBW (0.1ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '5mF2ck8ewomozp4QwixbQEePA7GJRLbCxRj6GQftb4uWSEoobNMD3UR255DthWGCZM5vLT8wath3ebJp3H1LJiVE', processed: 1 }
🔍 TRANSACTION DEBUG: {
  signature: '41a7eP8hUsaFrEry4ix4P2A2qAYkkfWyb95HURYk83DjJwrSCvbBZMDf5G7Nea1AKeynKyXvHS7a4FFNTdefb5Rz',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '1a6d00e1'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '127bdfb3',
  current_hash: '1a6d00e1'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=2b584fb0, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddcb77314bcc513f, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.6ms)
  🔄 Converting account addresses to indices for sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq
  📍 Normalized accounts: 0,23,2,22,30,38,34,37,35,24,27,25,30,30,29,39,26,36,16,19,13,11,20,15,14,21,12,17,18,33,31,30,30,28,10,29,32,7,9,4,1,3,8
  ⚡ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq, discriminator=064e30f6437c3734, dataLen=18, accounts=43
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (0.2ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=ComputeBudget111111111111111111111111111111, discriminator=5142d7db, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2kQAxrZFcgoQeCij3KNtn7xKy415NhWbUGKiAF52vxd3aABAbtTR3i61Mjj6arrY9FDQN7fhHVk65Lqj6wm3bZVy', processed: 1 }
🔍 TRANSACTION DEBUG: {
  signature: '34e2SNvHq7yKpnhTW8KNGAMfa9BojmjZjVcnSPeGMAUTrkUs84oXKrPQtEMMFXm5moKDfaqfEEtyYhsZEwVxGQGa',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '1bfacec'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '1a6d00e1',
  current_hash: '1bfacec'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=2d23184e, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dc7ca6f51a8bba99, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq
  📍 Normalized accounts: 0,8,7,3,35,31,32,29,32,27,28,39,34,30,35,35,38,2,4,1,40,21,26,18,17,23,16,20,22,19,24,25,37,36,35,35,33,10,34,41,12,13,9,14,11,15
  ⚡ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq, discriminator=064e30f643c433da, dataLen=18, accounts=46
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=ComputeBudget111111111111111111111111111111, discriminator=5f3f3cde, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '4uVwZzx4MHkWVjcJ6ygycT6dDv15VEprVJPEUivTKHv7gLJyKzu1XfKKMhidHgPVuh4RBwH8FdFFjD22LaAPQDPC', processed: 1 }
🔍 TRANSACTION DEBUG: {
  signature: '2EcAEQ2C6R9aEze9MDN381pDcskUDEpyNdoh8uCNrcRHgL3zyZw5wM8oKkt8r32B4cRrjW5zz5W768okakwbkfHt',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '437f70b7'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '1bfacec',
  current_hash: '437f70b7'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=dd7e2be677524732, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=1531dd4e, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for 7iZB2Yjm4sHXvP26DgrJbveDo4qC35bcbjiu5rh1Vrkt
  📍 Normalized accounts: 32,30,0,15,34,35,29,16,28,13,4,7,8,14,3,6,33,19,31,27,18,17,5,10,1,20,2,9,37,21,26,25,24,23,38,22,36
  ⚡ UNKNOWN PROGRAM: 7iZB2Yjm4sHXvP26DgrJbveDo4qC35bcbjiu5rh1Vrkt (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=7iZB2Yjm4sHXvP26DgrJbveDo4qC35bcbjiu5rh1Vrkt, discriminator=d75d75d4fe3adf68, dataLen=112, accounts=37
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: '7iZB2Yjm4sHXvP26DgrJbveDo4qC35bcbjiu5rh1Vrkt',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: 7iZB2Yjm4sHXvP26DgrJbveDo4qC35bcbjiu5rh1Vrkt (0.1ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
🔍 TRANSACTION DEBUG: { signature: '3E6tpMUxNWNYRXegR58PLNpPTaDwMHEoMHFmQXyGGN1uwFsNVzC3ymk6odUs7F3xpZMTQ4cWVEFDmL5TriBpvUTY', processed: 4 }
🔍 TRANSACTION DEBUG: {
  signature: '4VcXsVzPHVfQVPhM7w627gszdZsdWBURX1igPrkHPPC8SEKsSrmexyVPuwhjsTYWobFyHp93rFVFVWmH4mx46qsM',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '130f8f60'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '437f70b7',
  current_hash: '130f8f60'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=2d23184e, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dc751ff0f42d473c, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq
  📍 Normalized accounts: 0,23,22,3,33,36,31,10,31,8,9,35,32,7,33,33,34,1,2,4,39,16,21,13,12,18,11,15,17,14,19,20,37,41,33,33,40,25,32,38,27,28,24,29,26,30
  ⚡ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq, discriminator=064e30f643c433da, dataLen=18, accounts=46
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=ComputeBudget111111111111111111111111111111, discriminator=5f3f3cde, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '4gaMKrnFfEAQMUFWX5RNwfZFU5SWzNGMQ1vt1JjWqa2tV1dJvprN7doNV8jwXHmrqkA7uFdLv9UZXWwHpHYbJEGc', processed: 1 }
🔍 TRANSACTION DEBUG: {
  signature: '44WbHYmjH1MT6AZyXTAcNCKDD181hvXSn8qB6xkg484qmWiL6NZqo931q7P5F36tqwFo3LCzYGjuvC8oKKEaujUn',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '52942774'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '130f8f60',
  current_hash: '52942774'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1099b1e8, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dc37577f8af8eb5a, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  🔄 Converting account addresses to indices for sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq
  📍 Normalized accounts: 0,19,18,2,33,39,31,17,31,12,15,38,32,13,33,33,36,16,1,14,37,25,30,22,21,27,20,24,26,23,28,29,35,34,33,33,40,6,32,41,8,9,5,10,7,11
  ⚡ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq, discriminator=064e30f643c4473d, dataLen=18, accounts=46
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (0.3ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=ComputeBudget111111111111111111111111111111, discriminator=5f3f3cde, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2PyS3Z7VqzXGviJ83rFKLTxnE3KhZrPPCUkxPktGAMUuzvsrN3FR32rftnLWAdg5fae3nzHh7zQ1x2PW5UvQmCFg', processed: 7 }
🔍 TRANSACTION DEBUG: {
  signature: 'ahvN8GU3gKsof3BMvJN4ShVDBvrSJN5xsrhjSKaMxgnFqBP4BivcwbXoFrfTEaEYtBKfthWHDAsxZVGMVYd21Z6',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '474823f2'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '52942774',
  current_hash: '474823f2'
}
  🔬 Parsing 5 binary instructions
  🔄 Converting account addresses to indices for MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG
  📍 Normalized accounts: 0,6,9
  ⚡ UNKNOWN PROGRAM: MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG, discriminator=c5625061fa2bc1cb, dataLen=15, accounts=3
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG (0.0ms)
  🔄 Converting account addresses to indices for JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
  📍 Normalized accounts: 29,0,6,6,14,36,14,17,14,30,29,0,27,3,26,6,28,1,11,7,35,30,29,29,15,0,22,31,32,3,20,5,21,18,8,4,19,33,0,23,24,25,5,6,29,34
    🔍 BINARY ANALYSIS [1]: program=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4, discriminator=da, dataLen=48, accounts=46
    🏛️ PROGRAM VALIDATION: {
  isValid: true,
  programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  dex: 'Jupiter',
  category: 'router',
  memeRelevant: true,
  priority: 'low'
}
    ❌ NO CANDIDATE: Jupiter analysis returned null (0.3ms)
  ⚡ UNKNOWN PROGRAM: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG
  📍 Normalized accounts: 6,9,0,12,2,10
  ⚡ UNKNOWN PROGRAM: MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG, discriminator=e3231be3a329d421, dataLen=99, accounts=6
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: MevFXXGBgBMbr2c9G6GWE9Vo8qo8GCVed4jn1npP5tG (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [4]: program=ComputeBudget111111111111111111111111111111, discriminator=19256ddc, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  📊 Binary parsing complete: 0 candidates from 5 instructions
🔍 TRANSACTION DEBUG: { signature: '2hjF2mbLuqnte7QvdBi5aPmyGTia5HaDMKDkhJMVrDKEn2US4uVZrP2q3D821BkW9BcMvSHsU8Wrt4e1XJbiQjBz', processed: 1 }
🔍 TRANSACTION DEBUG: {
  signature: '5gNdJC6eu7SWozTBt7xCRzFpxPYfiNf8pwwv3cLTa2a9uVYhxXekti4VvhR7ZN8BjXTrfpd6BBWy5TtuNYasBeKo',
  slot: 357478162,
  blockTime: 1754177087,
  accountKeys_hash: '68be17cf'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '474823f2',
  current_hash: '68be17cf'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=2d23184e, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dc7a78511d974435, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  🔄 Converting account addresses to indices for sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq
  📍 Normalized accounts: 0,7,6,2,35,31,32,23,32,22,19,34,39,21,35,35,38,20,3,1,40,13,18,10,9,15,8,12,14,11,16,17,37,36,35,35,33,25,34,41,27,28,24,29,26,30
  ⚡ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq, discriminator=064e30f643c433da, dataLen=18, accounts=46
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: sattCHvHkM4XHLyadnU4KQtuNWZbWVDKzuPhmJBXCkq (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=ComputeBudget111111111111111111111111111111, discriminator=5f3f3cde, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '51iG2J9xHRBieKSS9rSPr6wNQBocdbP2rNSfn4RuHPc4remthNWxhDhvqM184mdtCEaaJFEybfXHAg7mntaY28PT', processed: 4 }
🔍 Scanning for new LP creations...
🔍 TRANSACTION DEBUG: {
  signature: '2PyS3Z7VqzXGviJ83rFKLTxnE3KhZrPPCUkxPktGAMUuzvsrN3FR32rftnLWAdg5fae3nzHh7zQ1x2PW5UvQmCFg',
  slot: 357478157,
  blockTime: 1754177085,
  accountKeys_hash: '6793c35e'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '68be17cf',
  current_hash: '6793c35e'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=dcf61b475da6cf06, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.2ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=2c424313, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.2ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,5,13,3,2,1,0,8,11,7,14,9,6,4
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
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.7ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (1.1ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,5,13,3,2,1,0,8,7,11,14,9,6,4
    🔍 BINARY ANALYSIS [3]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=e6345c8dd8b14540, dataLen=24, accounts=14
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
      - Discriminator: 0xe6345c8dd8b14540
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.7ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.9ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '5qqs1tsXyVmceaat2rc3Jv3s1uNP5ix6derNoDjkLkFxrPDijiqnHFiPL993w8r8juprxoqkHVXt81ivowbseswa', processed: 8 }
🔍 TRANSACTION DEBUG: {
  signature: '3E6tpMUxNWNYRXegR58PLNpPTaDwMHEoMHFmQXyGGN1uwFsNVzC3ymk6odUs7F3xpZMTQ4cWVEFDmL5TriBpvUTY',
  slot: 357478157,
  blockTime: 1754177085,
  accountKeys_hash: '450ad5d4'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '6793c35e',
  current_hash: '450ad5d4'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=dcf61b475da6cf06, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=2c424313, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,3,13,2,1,4,0,8,11,7,14,9,6,5
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
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.9ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (1.1ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,3,13,2,1,4,0,8,7,11,14,9,6,5
    🔍 BINARY ANALYSIS [3]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=e6345c8dd8b14540, dataLen=24, accounts=14
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
      - Discriminator: 0xe6345c8dd8b14540
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.5ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.6ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2sgD1mHgLA1WGJrcKZkMfRhFBZP9ePNvJAmqKgsV8xecAEZJkVsF16SD1i7DgP5oKpum8KnkjfAv7KDFps39oMda', processed: 5 }
🔍 TRANSACTION DEBUG: {
  signature: '2hjF2mbLuqnte7QvdBi5aPmyGTia5HaDMKDkhJMVrDKEn2US4uVZrP2q3D821BkW9BcMvSHsU8Wrt4e1XJbiQjBz',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '25b3526e'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '450ad5d4',
  current_hash: '25b3526e'
}
  🔬 Parsing 1 binary instructions
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 1,2,3,5,4
  ⚠️ Skipping - 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P data too short (need 24, got 8) (MEME CRITICAL)
  📊 Binary parsing complete: 0 candidates from 1 instructions
🔍 TRANSACTION DEBUG: { signature: '5W6NNsZu2Jx7hUDNvLnemMeA16nn31NTM7M4wkaTaj2STWwWRYiykCRVFNp6cWskHCWydQR72SxxW3D3HH9LePE6', processed: 2 }
🔍 TRANSACTION DEBUG: {
  signature: '5mF2ck8ewomozp4QwixbQEePA7GJRLbCxRj6GQftb4uWSEoobNMD3UR255DthWGCZM5vLT8wath3ebJp3H1LJiVE',
  slot: 357478159,
  blockTime: 1754177086,
  accountKeys_hash: '52809a7f'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '25b3526e',
  current_hash: '52809a7f'
}
  🔬 Parsing 6 binary instructions
  🔄 Converting account addresses to indices for ComputeBudget111111111111111111111111111111
  📍 Normalized accounts: 18
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=291b4fac, dataLen=4, accounts=1
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=dc92979d166cc6b6, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for GMgnVFR8Jb39LoXsEVzb3DvBy3ywCmdmJquHUy1Lrkqb
  📍 Normalized accounts: 12,5,11,1,6,4,0,10,19,7,15,13,9,8
  ⚡ UNKNOWN PROGRAM: GMgnVFR8Jb39LoXsEVzb3DvBy3ywCmdmJquHUy1Lrkqb (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=GMgnVFR8Jb39LoXsEVzb3DvBy3ywCmdmJquHUy1Lrkqb, discriminator=0094d0da1f435eb0, dataLen=24, accounts=14
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'GMgnVFR8Jb39LoXsEVzb3DvBy3ywCmdmJquHUy1Lrkqb',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: GMgnVFR8Jb39LoXsEVzb3DvBy3ywCmdmJquHUy1Lrkqb (0.1ms)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 6 instructions
🔍 TRANSACTION DEBUG: { signature: '35ZEX8gZkTzXq45pNXH69Hm2opwogr4ZETdD7KQbXbMFVwCtCUrHGtHGbW5fscMVGMti9BdpbKKpW1RFckv9StPP', processed: 2 }
🔍 TRANSACTION DEBUG: {
  signature: '2kQAxrZFcgoQeCij3KNtn7xKy415NhWbUGKiAF52vxd3aABAbtTR3i61Mjj6arrY9FDQN7fhHVk65Lqj6wm3bZVy',
  slot: 357478158,
  blockTime: 1754177086,
  accountKeys_hash: '2ab48fb9'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '52809a7f',
  current_hash: '2ab48fb9'
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
  📍 Normalized accounts: 11,3,10,1,2,5,0,9,16,7,14,12,8,6
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
    ❌ PUMP.FUN: No candidate generated (0.5ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.6ms)
  📊 Binary parsing complete: 0 candidates from 5 instructions
🔍 TRANSACTION DEBUG: { signature: '2TndZL6k5FgfK3rLjtrE9dKErP1WSkEQ7HpAguz718Sckno6GzpHySoagQxwZTKz3VUBjx9i5M4RUBEayKXrK9kC', processed: 2 }
🔍 TRANSACTION DEBUG: {
  signature: '4uVwZzx4MHkWVjcJ6ygycT6dDv15VEprVJPEUivTKHv7gLJyKzu1XfKKMhidHgPVuh4RBwH8FdFFjD22LaAPQDPC',
  slot: 357478157,
  blockTime: 1754177085,
  accountKeys_hash: '2c26b320'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2ab48fb9',
  current_hash: '2c26b320'
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
  📍 Normalized accounts: 11,2,10,5,7,4,0,9,16,3,14,12,8,1
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (1ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.4ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.6ms)
  📊 Binary parsing complete: 0 candidates from 5 instructions
🔍 TRANSACTION DEBUG: { signature: 'MbgXfuqVzjCzPnjz2KsFEwAyLM1MPiTyuXEWvQopYUM9dB7XtqKoGv3Yzca2ZfcnV6KiNzARakMY9kkZ45FDCx2', processed: 2 }
🔍 TRANSACTION DEBUG: {
  signature: '4gaMKrnFfEAQMUFWX5RNwfZFU5SWzNGMQ1vt1JjWqa2tV1dJvprN7doNV8jwXHmrqkA7uFdLv9UZXWwHpHYbJEGc',
  slot: 357478157,
  blockTime: 1754177085,
  accountKeys_hash: '6793c35e'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '2c26b320',
  current_hash: '6793c35e'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=dcf61b475da6cf06, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=2c424313, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,5,13,3,2,1,0,8,11,7,14,9,6,4
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
    ✅ PUMP.FUN: token=4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf, vault=G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.4ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.6ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,5,13,3,2,1,0,8,7,11,14,9,6,4
    🔍 BINARY ANALYSIS [3]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=e6345c8dd8b14540, dataLen=24, accounts=14
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
      - Discriminator: 0xe6345c8dd8b14540
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.5ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.7ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '2yiEbth8m87Wberfu2zUR1xB9zVDphFVYJBSzq4Z8xLzfqsM7kwQgLf4C6wdfC76VzqimzGA2qg64G7RXLwGkiPd', processed: 2 }
🔍 TRANSACTION DEBUG: {
  signature: '4YiapDy49mn2s9JPrtxcyMgCWfrBaExwfsU2DSRhepwzpJFYLAtVC28Xazhen2t9UANtzgZTPVi53RbEB1paBuHS',
  slot: 357478159,
  blockTime: 1754177086,
  accountKeys_hash: '43bd62cf'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '6793c35e',
  current_hash: '43bd62cf'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=2c424313, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=de026a92870c59a3, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,2,8,3,4,1,0,9,10,5,13,11
    🔍 BINARY ANALYSIS [3]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=0094d0da1f435eb0, dataLen=24, accounts=12
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
      - Account count: 12
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 12)
  - accountKeys: EXISTS (length: 14)
    ⚡ Moderate account count: 12
    ✅ LP mint detected: 12
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 12
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
    ❌ PUMP.FUN: No candidate generated (0.5ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.9ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 TRANSACTION DEBUG: { signature: '53pE15Amt1fstnfaomFWATb46ezE4NCJVUvDLD1Bzdv5YrcFWktXdtisFyx55MuNgMjLnui6JVyoDi7ebcq9FM4R', processed: 13 }
🔍 TRANSACTION DEBUG: {
  signature: '51iG2J9xHRBieKSS9rSPr6wNQBocdbP2rNSfn4RuHPc4remthNWxhDhvqM184mdtCEaaJFEybfXHAg7mntaY28PT',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '7e0bab58'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '43bd62cf',
  current_hash: '7e0bab58'
}
  🔬 Parsing 5 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=de026a92870c59a3, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=2c424313, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 11,5,10,4,3,7,0,9,15,2,13,12,8,1
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
  - accountKeys: EXISTS (length: 16)
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.4ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.6ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 11,5,10,4,3,7,0,9,2,15,13,12
    🔍 BINARY ANALYSIS [3]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=e6345c8dd8b14540, dataLen=24, accounts=12
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
      - Discriminator: 0xe6345c8dd8b14540
      - Data length: 24 bytes
      - Account count: 12
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 12)
  - accountKeys: EXISTS (length: 16)
    ⚡ Moderate account count: 12
    ✅ LP mint detected: 12
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 12
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.4ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.5ms)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 5 instructions
📊 SCAN COMPLETE: 0 candidates, 12053ms, efficiency: 3640.0%
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 70ms, efficiency: 4130.0%
🔍 TRANSACTION DEBUG: {
  signature: '5qqs1tsXyVmceaat2rc3Jv3s1uNP5ix6derNoDjkLkFxrPDijiqnHFiPL993w8r8juprxoqkHVXt81ivowbseswa',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '7b90af6c'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '7e0bab58',
  current_hash: '7b90af6c'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=dcf61b475da6cf06, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=242de0ca, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,5,13,3,2,4,0,8,7,11,14,9,6,1
    🔍 BINARY ANALYSIS [2]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=e6345c8dd8b14540, dataLen=24, accounts=14
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
      - Discriminator: 0xe6345c8dd8b14540
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (0ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.3ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.5ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
📊 SCAN COMPLETE: 0 candidates, 16122ms, efficiency: 4200.0%
🔍 TRANSACTION DEBUG: {
  signature: 'MbgXfuqVzjCzPnjz2KsFEwAyLM1MPiTyuXEWvQopYUM9dB7XtqKoGv3Yzca2ZfcnV6KiNzARakMY9kkZ45FDCx2',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '5ea1bdbd'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '7b90af6c',
  current_hash: '5ea1bdbd'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1e79241b, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddd8117fcb3ab9e5, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
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
    ⚡ VALIDATION: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf (1ms) confidence=0 reason=known_system_address
    ❌ PUMP.FUN: Token validation failed - confidence 0 below minimum threshold 0.05
    ❌ PUMP.FUN: No candidate generated (0.5ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.6ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
📊 SCAN COMPLETE: 0 candidates, 10134ms, efficiency: 4220.0%
🔍 TRANSACTION DEBUG: {
  signature: '53pE15Amt1fstnfaomFWATb46ezE4NCJVUvDLD1Bzdv5YrcFWktXdtisFyx55MuNgMjLnui6JVyoDi7ebcq9FM4R',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '61c311db'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '5ea1bdbd',
  current_hash: '61c311db'
}
  🔬 Parsing 5 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=de10b3055362ab7e, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=2b5c1565, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 11,1,12,2,3,4,0,13,14,5,15,10,6,7
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
  - accountKeys: EXISTS (length: 16)
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
    ❌ PUMP.FUN: No candidate generated (0.3ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.4ms)
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 11,1,12,2,3,4,0,13,5,14,15,10
    🔍 BINARY ANALYSIS [3]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=e6345c8dd8b14540, dataLen=24, accounts=12
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
      - Discriminator: 0xe6345c8dd8b14540
      - Data length: 24 bytes
      - Account count: 12
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 12)
  - accountKeys: EXISTS (length: 16)
    ⚡ Moderate account count: 12
    ✅ LP mint detected: 12
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 12
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
    ❌ PUMP.FUN: No candidate generated (0.3ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.4ms)
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  📊 Binary parsing complete: 0 candidates from 5 instructions
📊 SCAN COMPLETE: 0 candidates, 18140ms, efficiency: 4220.0%
🔍 TRANSACTION DEBUG: {
  signature: '2yiEbth8m87Wberfu2zUR1xB9zVDphFVYJBSzq4Z8xLzfqsM7kwQgLf4C6wdfC76VzqimzGA2qg64G7RXLwGkiPd',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '5f55466f'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '61c311db',
  current_hash: '5f55466f'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1e79241b, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddd8117fcb3ab9e5, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
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
    ❌ PUMP.FUN: No candidate generated (0.3ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.4ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
📊 SCAN COMPLETE: 0 candidates, 4137ms, efficiency: 4230.0%
🔍 TRANSACTION DEBUG: {
  signature: '2TndZL6k5FgfK3rLjtrE9dKErP1WSkEQ7HpAguz718Sckno6GzpHySoagQxwZTKz3VUBjx9i5M4RUBEayKXrK9kC',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '160eaa61'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '5f55466f',
  current_hash: '160eaa61'
}
  🔬 Parsing 3 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=1e79241b, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=ddd8117fcb3ab9e5, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
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
    ❌ PUMP.FUN: No candidate generated (0.4ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.5ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
📊 SCAN COMPLETE: 0 candidates, 8168ms, efficiency: 4260.0%
🔍 TRANSACTION DEBUG: {
  signature: '2sgD1mHgLA1WGJrcKZkMfRhFBZP9ePNvJAmqKgsV8xecAEZJkVsF16SD1i7DgP5oKpum8KnkjfAv7KDFps39oMda',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '330128c0'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '160eaa61',
  current_hash: '330128c0'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=2c424313, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.0ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=de026a92870c59a3, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.2ms)
  ⚡ UNKNOWN PROGRAM: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL (using fallback parsing)
  ⚠️ Skipping - no instruction data
  🔄 Converting account addresses to indices for 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
  📍 Normalized accounts: 12,2,8,3,4,1,0,9,10,5,13,11
    🔍 BINARY ANALYSIS [3]: program=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P, discriminator=0094d0da1f435eb0, dataLen=24, accounts=12
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
      - Account count: 12
  - instructionData: EXISTS (length: 24)
  - accounts: EXISTS (length: 12)
  - accountKeys: EXISTS (length: 14)
    ⚡ Moderate account count: 12
    ✅ LP mint detected: 12
    🚀 Pump.fun program detected - applying scoring boost
    ✅ Good account count for Pump.fun: 12
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
    ❌ PUMP.FUN: No candidate generated (0.4ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.5ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
📊 SCAN COMPLETE: 0 candidates, 14173ms, efficiency: 4320.0%
🔍 TRANSACTION DEBUG: {
  signature: '35ZEX8gZkTzXq45pNXH69Hm2opwogr4ZETdD7KQbXbMFVwCtCUrHGtHGbW5fscMVGMti9BdpbKKpW1RFckv9StPP',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '61d966a7'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '330128c0',
  current_hash: '61d966a7'
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
    ❌ PUMP.FUN: No candidate generated (0.6ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.8ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
📊 SCAN COMPLETE: 0 candidates, 6240ms, efficiency: 4360.0%
🔍 TRANSACTION DEBUG: {
  signature: '5W6NNsZu2Jx7hUDNvLnemMeA16nn31NTM7M4wkaTaj2STWwWRYiykCRVFNp6cWskHCWydQR72SxxW3D3HH9LePE6',
  slot: 357478156,
  blockTime: 1754177085,
  accountKeys_hash: '3bd877e7'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '61d966a7',
  current_hash: '3bd877e7'
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
    ❌ PUMP.FUN: No candidate generated (0.5ms)
    ❌ NO CANDIDATE: PumpFun analysis returned null (0.6ms)
  📊 Binary parsing complete: 0 candidates from 3 instructions
📊 SCAN COMPLETE: 0 candidates, 2239ms, efficiency: 4410.0%
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
📊 SCAN COMPLETE: 0 candidates, 42ms, efficiency: 4491.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 36ms, efficiency: 4523.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 24ms, efficiency: 4550.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 63ms, efficiency: 4573.3%
💰 Fetching So111111... price from Jupiter
🔗 Fetching Jupiter price from: https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
🚨 Jupiter API failure 2/3 in circuit breaker CLOSED state
❌ Jupiter price fetch failed for So111111...: Jupiter API network error: ENOTFOUND
💰 Fetching So111111... price from CoinGecko
✅ Got price from CoinGecko: $157.83
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 2ms, efficiency: 4593.8%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 50ms, efficiency: 4611.8%
🔍 Scanning recent transactions for LP creation...
  📊 Found 10 recent Raydium transactions
🔍 TRANSACTION DEBUG: {
  signature: '45wfLHw6RWxwejcgtefBaEaWrNW1FXMzHdudQyrKNAnFErhXecUibBDtG2ngy3ypLcgw1fuUbbQZusrXj1KB7cUs',
  slot: 357478241,
  blockTime: 1754177120,
  accountKeys_hash: '7d659240'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '3bd877e7',
  current_hash: '7d659240'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: 11111111111111111111111111111111 (using fallback parsing)
  ⚠️ Skipping - no instruction data
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  🔄 Converting account addresses to indices for 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
  📍 Normalized accounts: 15,2,19,3,4,5,6,20,7,8,9,10,11,12,21,13,1,0
    🔍 BINARY ANALYSIS [2]: program=675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8, discriminator=e8, dataLen=17, accounts=18
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
      🔍 ACCOUNT STRUCTURE ANALYSIS:
        - Total accounts: 18
        - AccountKeys length: 22
        - Coin mint index: 20
        - PC mint index: 7
        - AMM ID index: 3
        - Coin mint: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
        - PC mint: 6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1
        - AMM ID: ERydgXzX32ZLxQNYWwnhEtbCHSpoXvUKaSr9kKXpFAmN
        ⚠️ Unknown pair: assuming coin=srmqPvym..., pc=6s7qJ79N...
        ✅ Extraction successful
    ✅ RAYDIUM: Tokens extracted successfully
    ⚡ VALIDATION: primary=0 secondary=0.4 (51.6ms)
    🟡 RAYDIUM: Permissive mode - potential meme opportunity (primary=0, secondary=0.4)
    ✅ RAYDIUM TOKENS VALIDATED (PERMISSIVE): primary=srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX secondary=6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1 (confidence: 8)
    ✅ CANDIDATE GENERATED: Raydium (53.2ms)
    ⚠️ PERFORMANCE ALERT: candidate_generated took 53.2ms (target: <50ms)
    💎 Binary LP candidate detected: Raydium (confidence: 8.000)
  ⚠️ Skipping - TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA data too short (need 1, got 0) (MEME CRITICAL)
  📊 Binary parsing complete: 1 candidates from 4 instructions
🔍 TOKEN EXTRACTION DEBUG: {
  candidateType: 'object',
  tokenMint: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
  tokenAddress: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
  secondaryToken: '6s7qJ79NUkcKuPpBx7md9QDf5gfkKZ2hapxceZBBcCQ1',
  ammId: 'ERydgXzX32ZLxQNYWwnhEtbCHSpoXvUKaSr9kKXpFAmN',
  confidence: 8,
  source: 'raydium_permissive_mode'
}
🔵 OTHER LP PIPELINE DEBUG: {
  type: 'RAYDIUM_LP',
  step: 'about_to_validate',
  tokenMint: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
  confidence: 8
}
🔍 VALIDATION START: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX, type: both
📋 QUEUE CHECK: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX-both, queue size: 0
➕ QUEUE ADDED: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX-both, new size: 1
🔄 RETRY ATTEMPT 1/3 for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
🏥 RPC HEALTH: Testing endpoint unknown
✅ RPC HEALTHY: Current slot 357478211
📡 RPC CALL START: getTokenSupply for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
❌ RPC ERROR on attempt 1: failed to get token supply: Invalid param: not a Token mint
🔍 ERROR DETAILS: {
  code: -32602,
  message: 'failed to get token supply: Invalid param: not a Token mint',
  stack: 'SolanaJSONRPCError: failed to get token supply: Invalid param: not a Token mint'
}
🔄 RETRY ATTEMPT 2/3 for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
🏥 RPC HEALTH: Testing endpoint unknown
✅ RPC HEALTHY: Current slot 357478211
⏰ DELAY: Waiting 500ms before retry 2
📡 RPC CALL START: getTokenSupply for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
🔍 Scanning for new LP creations...
❌ RPC ERROR on attempt 2: failed to get token supply: Invalid param: not a Token mint
🔍 ERROR DETAILS: {
  code: -32602,
  message: 'failed to get token supply: Invalid param: not a Token mint',
  stack: 'SolanaJSONRPCError: failed to get token supply: Invalid param: not a Token mint'
}
🔄 RETRY ATTEMPT 3/3 for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
🏥 RPC HEALTH: Testing endpoint unknown
✅ RPC HEALTHY: Current slot 357478211
⏰ DELAY: Waiting 1000ms before retry 3
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 39ms, efficiency: 4627.8%
📡 RPC CALL START: getTokenSupply for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
❌ RPC ERROR on attempt 3: failed to get token supply: Invalid param: not a Token mint
🔍 ERROR DETAILS: {
  code: -32602,
  message: 'failed to get token supply: Invalid param: not a Token mint',
  stack: 'SolanaJSONRPCError: failed to get token supply: Invalid param: not a Token mint'
}
💥 FINAL FAILURE: All 3 retries failed for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX
➖ QUEUE REMOVED: srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX-both, new size: 0
❌ Token validation failed for srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX: All retries failed: failed to get token supply: Invalid param: not a Token mint
   📍 Signature: undefined
✅ Renaissance analysis complete in 2016.04ms: 0 mathematically validated LP(s)
🔍 TRANSACTION DEBUG: {
  signature: '3PYGFJRsYto1cSA1SjVu9utXEoBfm7FBQNvM2i1zs4BxGL2BNFh3o1PfV9gNDVfVvjfEEjdhaZULXVx1oVVcp6wF',
  slot: 357478241,
  blockTime: 1754177120,
  accountKeys_hash: '99832ac'
}
🔍 ACCOUNTKEYS FRESHNESS: {
  processing_new_transaction: true,
  accountKeys_changed: true,
  last_hash: '7d659240',
  current_hash: '99832ac'
}
  🔬 Parsing 4 binary instructions
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [0]: program=ComputeBudget111111111111111111111111111111, discriminator=4f3db635, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [1]: program=ComputeBudget111111111111111111111111111111, discriminator=1215491b, dataLen=4, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  ⚡ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (using fallback parsing)
    🔍 BINARY ANALYSIS [2]: program=ComputeBudget111111111111111111111111111111, discriminator=de3e26e3b666993f, dataLen=9, accounts=0
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: 'ComputeBudget111111111111111111111111111111',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: ComputeBudget111111111111111111111111111111 (0.1ms)
  🔄 Converting account addresses to indices for 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ
  📍 Normalized accounts: 0,45,0,3,46,43,48,53,2,46,47,50,17,15,16,44,51,11,14,13,10,12,55,1,46,49,54,18,52,19,20,21,44,51,22,25,24,23,7,56,4,46,44,51,30,27,29,26,28,44,51,32,35,33,34,31,57,6,46,47,50,37,38,36,44,51,41,42,40,39,5
  ⚡ UNKNOWN PROGRAM: 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ (using fallback parsing)
    🔍 BINARY ANALYSIS [3]: program=11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ, discriminator=da61d34f96400dad, dataLen=36, accounts=71
    🏛️ PROGRAM VALIDATION: {
  isValid: false,
  programId: '11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ',
  reason: 'unknown_program'
}
    ❌ UNKNOWN PROGRAM: 11fjFQmQdWr52GigwyUNrRn6YCejUxbNzBEhCw465xZ (0.1ms)
  📊 Binary parsing complete: 0 candidates from 4 instructions
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 27ms, efficiency: 4642.1%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 17ms, efficiency: 4655.0%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 3ms, efficiency: 4666.7%
🔍 Scanning for new LP creations...
  📊 Found 20 recent Raydium transactions
  📊 Found 20 recent Pump.fun transactions
  📊 Found 10 recent Orca transactions
  📊 DEDUP: 49 unique, 1 duplicates removed
  📊 Processing 49 total unique transactions (sorted by recency)
📊 SCAN COMPLETE: 0 candidates, 40ms, efficiency: 4677.3%
^C[THORP] Initiating graceful shutdown...
🔍 Active LP scanning stopped
[THORP] Shutting down service: lpDetector
🔌 Shutting down Renaissance LP Creation Detector...
✅ Renaissance LP Creation Detector shutdown complete

🔌 Received SIGINT, initiating graceful shutdown...
✅ Shutdown complete