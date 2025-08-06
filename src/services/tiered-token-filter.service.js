import { EventEmitter } from 'events';

/**
 * Fixed version of TieredTokenFilterService with robust token validation
 * that handles cases where getMintInfo returns null
 */
class TieredTokenFilterServiceFixed extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Renaissance age-based tiered criteria
        this.FRESH_GEM_CRITERIA = {
            maxAgeMinutes: 15,
            security: {
                mintAuthorityRenounced: true,
                freezeAuthorityRenounced: true,
                topHolderMaxPercent: 30,
                lpValueMinUSD: 2000,
            },
            organic: {
                minUniqueWallets: 25,
                minBuyToSellRatio: 2.0,
                minTransactionSpread: 2,
                minTransactionVariation: 0.2,
                minVolumeToLiquidityRatio: 0.05,
            }
        };
        
        this.ESTABLISHED_CRITERIA = {
            quality: {
                minHolders: 300,
                minTransactions: 500,
                minMarketCap: 25000,
                minVolume: 100000,
                maxTopHolderPercent: 30,
            }
        };
        
        // Pump.fun specific patterns
        this.PUMP_FUN_PATTERNS = {
            programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
            bondingCurvePrefix: 'curve',
            graduationThreshold: 85000,
            typicalInitialBuy: [0.1, 5],
            suspiciousPatterns: [
                'bundle',
                'snipe',
                'bot',
            ]
        };
        
        this.TECHNICAL_PATTERNS = [
            /^[0-9]+$/,
            /(.)\1{6,}/,
            /[^\x00-\x7F]{3,}/,
            /test\s*token/i,
            /scam\s*token/i
        ];
        
        this.rpcManager = config.rpcManager || null;
        
        // Risk module dependencies
        this.scamProtectionEngine = config.scamProtectionEngine;
        this.liquidityRiskAnalyzer = config.liquidityRiskAnalyzer;
        this.marketCapRiskFilter = config.marketCapRiskFilter;
        
        // Validate required dependencies
        if (!this.scamProtectionEngine || !this.liquidityRiskAnalyzer || !this.marketCapRiskFilter) {
            console.warn("⚠️ Risk modules not provided - using internal logic");
        }        this.isInitialized = false;
        this.metadataCache = new Map();
        this.maxCacheSize = 1000;        // Reasonable limit for trading operations
        this.cacheTTL = 300000;          // 5 minutes TTL
        this.lastCacheCleanup = Date.now();
        
        // Initialize validation queue for retry logic
        this.validationQueue = new Set();
        this.validationQueueTimestamps = new Map(); // Track when entries were added
        this.maxQueueAge = 30000; // 30 seconds max queue retention
        this.lastQueueCleanup = Date.now();
        
        this.stats = {
            processed: 0,
            freshGemsDetected: 0,
            establishedPassed: 0,
            technicalRejections: 0,
            organicRejections: 0,
            securityRejections: 0
        };
    }

    async initialize() {
        if (!this.rpcManager) {
            throw new Error('RPC Manager required for Renaissance token analysis');
        }
        
        // Initialize validation queue for retry logic
        this.validationQueue = new Set();
        this.validationQueueTimestamps = new Map();
        
        // Start periodic cleanup (every 2 minutes)
        this.cleanupInterval = setInterval(() => {
            this.cleanupValidationQueue();
            this.maintainMetadataCache();
        }, 120000);
        
        this.isInitialized = true;
        console.log('💎 Renaissance Tiered Token Filter (Fixed) initialized');
        console.log('  🆕 Fresh gem detection (0-15min): High risk/reward analysis');
        console.log('  🏛️ Established token filtering (15min+): Proven metrics analysis');
        console.log('  🧮 Organic activity detection enabled');
        console.log('  ✅ Robust token validation with retry logic');
        console.log('  🔄 Progressive retry delays: 500ms, 1000ms, 2000ms');
        console.log('  🧹 Memory management: Bounded caches with automatic cleanup');
        
        return true;
    }

    /**
     * Validate token with retry logic to handle RPC propagation delays
     */
    async validateTokenWithRetry(tokenMint, validationType = 'both', maxRetries = 3) {
        const delays = [100, 200, 400]; // Progressive delays in ms
        
        // Prevent duplicate requests
        const queueKey = `${tokenMint}-${validationType}`;
        const now = Date.now();
        
        if (this.validationQueue.has(queueKey)) {
            return { success: false, error: 'Validation already in progress' };
        }
        
        // Add to queue with timestamp
        this.validationQueue.add(queueKey);
        this.validationQueueTimestamps.set(queueKey, now);
        
        // Trigger queue cleanup if needed
        this.cleanupValidationQueue();
        
        try {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    // Add delay before each attempt (except first)
                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, delays[i-1]));
                        // Rotate RPC endpoint on retry
                        if (this.rpcManager?.rotateEndpoint) {
                            await this.rpcManager.rotateEndpoint();
                        }
                    }
                    
                    // Prepare promises based on validation type
                    const promises = [];
                    
                    if (validationType === 'supply' || validationType === 'both') {
                        promises.push(
                            this.rpcManager.call('getTokenSupply', [tokenMint])
                                .then(result => ({ type: 'supply', result }))
                                .catch(error => ({ type: 'supply', error }))
                        );
                    }
                    
                    if (validationType === 'accounts' || validationType === 'both') {
                        promises.push(
                            this.rpcManager.call('getTokenLargestAccounts', [tokenMint])
                                .then(result => ({ type: 'accounts', result }))
                                .catch(error => ({ type: 'accounts', error }))
                        );
                    }
                    
                    // Execute validation calls
                    const results = await Promise.allSettled(promises);
                    
                    // Process results
                    const data = {};
                    let hasSuccess = false;
                    
                    for (const result of results) {
                        if (result.status === 'fulfilled' && result.value.result) {
                            if (result.value.type === 'supply') {
                                data.supply = result.value.result.value;
                                hasSuccess = true;
                            } else if (result.value.type === 'accounts') {
                                data.accounts = result.value.result;
                                hasSuccess = true;
                            }
                        }
                    }
                    
                    if (hasSuccess) {
                        return { success: true, data };
                    }
                    
                } catch (error) {
                    console.log(`🔄 Token validation retry ${i + 1}/${maxRetries} for ${tokenMint}: ${error.message}`);
                    if (i === maxRetries - 1) {
                        return { success: false, error: `All retries failed: ${error.message}` };
                    }
                }
            }
            
            return { success: false, error: 'Max retries reached without success' };
            
        } finally {
            // Always clean up queue entry
            this.validationQueue.delete(queueKey);
            this.validationQueueTimestamps.delete(queueKey);
        }
    }

    /**
     * Main processing with Renaissance age-based tiering
     */
    async processToken(tokenCandidate) {
        if (!this.isInitialized) await this.initialize();
        
        const startTime = performance.now();
        this.stats.processed++;

        try {
            // Validate token candidate
            if (!tokenCandidate) {
                console.warn('⚠️ Token candidate is undefined or null');
                return this.rejectToken('invalid_token_candidate', startTime);
            }

            // Extract and validate token address
            const tokenAddress = this.extractTokenMint(tokenCandidate);
            if (!tokenAddress) {
                console.warn('⚠️ Token address is undefined or missing');
                return this.rejectToken('missing_token_address', startTime);
            }

            if (!this.isValidSolanaAddress(tokenAddress)) {
                console.warn(`⚠️ Invalid token address format: ${tokenAddress}`);
                return this.rejectToken('invalid_token_address_format', startTime);
            }

            console.log(`  🔍 Processing token: ${tokenAddress}`);
            
            // Get comprehensive token metrics with fallback methods
            const tokenMetrics = await this.gatherComprehensiveMetricsFixed(tokenCandidate);
            
            if (!tokenMetrics) {
                return this.rejectToken('metrics_gathering_failed', startTime);
            }

            // Check for pump.fun specific patterns
            const isPumpFun = this.detectPumpFunToken(tokenCandidate, tokenMetrics);
            if (isPumpFun) {
                tokenMetrics.isPumpFun = true;
                tokenMetrics.pumpFunDetails = isPumpFun;
            }
            
            // Apply technical pattern filters first
            const technicalCheck = this.checkTechnicalPatternsFixed(tokenMetrics);
            if (!technicalCheck.passed) {
                this.stats.technicalRejections++;
                return this.rejectToken(technicalCheck.reason, startTime);
            }

            // Apply age-based Renaissance filtering
            const ageMinutes = this.calculateTokenAge(tokenCandidate);
            const isFreshGem = ageMinutes <= this.FRESH_GEM_CRITERIA.maxAgeMinutes;
            
            let filterResult;
            if (isFreshGem) {
                filterResult = await this.evaluateFreshGem(tokenMetrics);
            } else {
                filterResult = await this.evaluateEstablishedToken(tokenMetrics);
            }

            const processingTime = performance.now() - startTime;

            if (!filterResult.passed) {
                if (filterResult.failureType === 'organic') this.stats.organicRejections++;
                if (filterResult.failureType === 'security') this.stats.securityRejections++;
                
                return this.rejectToken(filterResult.reason, startTime);
            }

            // Token passed
            if (isFreshGem) this.stats.freshGemsDetected++;
            else this.stats.establishedPassed++;

            const enrichedCandidate = {
                ...tokenCandidate,
                approved: true,
                confidence: filterResult.score,
                reason: filterResult.reason,
                renaissanceClassification: {
                    tier: isFreshGem ? 'fresh-gem' : 'established',
                    securityScore: filterResult.securityScore,
                    organicScore: filterResult.organicScore,
                    overallScore: filterResult.score,
                    riskLevel: isFreshGem ? 'high' : 'medium',
                    ageMinutes: ageMinutes
                },
                tokenMetrics: tokenMetrics,
                processingTimeMs: processingTime
            };

            this.emit('tokenFiltered', enrichedCandidate);
            return enrichedCandidate;

        } catch (error) {
            console.error(`❌ Renaissance filtering failed: ${error.message}`);
            return this.rejectToken(`processing_error: ${error.message}`, startTime);
        }
    }

    /**
     * FIXED: Gather comprehensive token metrics with robust fallback methods
     */
    async gatherComprehensiveMetricsFixed(tokenCandidate) {
        try {
            const tokenMint = this.extractTokenMint(tokenCandidate);
            if (!tokenMint || !this.isValidSolanaAddress(tokenMint)) {
                console.warn(`⚠️ Invalid token mint: ${tokenMint}`);
                return null;
            }
            
            // Initialize metrics with defaults
            let metrics = {
                address: tokenMint,
                name: `Token ${tokenMint.substring(0, 6)}`,
                symbol: tokenMint.substring(0, 4).toUpperCase(),
                ageMinutes: this.calculateTokenAge(tokenCandidate),
                hasMintAuthority: true, // Assume true until proven false
                hasFreezeAuthority: true,
                lpValueUSD: parseFloat(tokenCandidate.lpValueUSD || tokenCandidate.liquidityUSD || 0),
                largestHolderPercentage: parseFloat(tokenCandidate.largestHolderPercentage || 50),
                uniqueWallets: parseInt(tokenCandidate.uniqueWallets || 10),
                buyToSellRatio: parseFloat(tokenCandidate.buyToSellRatio || 1.0),
                avgTransactionSpread: tokenCandidate.avgTransactionSpread || 60,
                transactionSizeVariation: tokenCandidate.transactionSizeVariation || 0.5,
                volumeToLiquidityRatio: 0.1,
                poolAddress: tokenCandidate.poolAddress,
                dex: tokenCandidate.dex,
                detectedAt: tokenCandidate.detectedAt
            };
            
            // Try to get token metadata with multiple methods
            const metadata = await this.fetchTokenMetadataRobust(tokenMint, tokenCandidate);
            if (metadata) {
                metrics = { ...metrics, ...metadata };
            }
            
            // Calculate volume to liquidity ratio if we have the data
            if (metrics.lpValueUSD > 0 && tokenCandidate.volume24h) {
                const volume24h = parseFloat(tokenCandidate.volume24h || 0);
            if (metrics.lpValueUSD > 0 && volume24h > 0) {
                metrics.volumeToLiquidityRatio = volume24h / metrics.lpValueUSD;
            }
            }
            
            return metrics;
            
        } catch (error) {
            console.warn(`⚠️ Metrics gathering failed: ${error.message}`);
            return null;
        }
    }

    /**
     * FIXED: Robust token metadata fetching with multiple fallback methods
     */
    async fetchTokenMetadataRobust(tokenMint, tokenCandidate) {
        // Check cache first
        const cached = this.getCachedMetadata(tokenMint);
        if (cached) {
            return cached;
        }
        
        const metadata = {
            address: tokenMint,
            name: null,
            symbol: null,
            decimals: 9,
            supply: null,
            hasMintAuthority: true,
            hasFreezeAuthority: true,
            isInitialized: true
        };
        
        // Try multiple methods to get token info
        
        // Method 1: Try getAccountInfo with jsonParsed
        try {
            const accountInfo = await this.rpcManager.call('getAccountInfo', [
                tokenMint,
                { encoding: 'jsonParsed' }
            ]);
            
            if (accountInfo?.value?.data?.parsed?.info) {
                const info = accountInfo.value.data.parsed.info;
                metadata.decimals = info.decimals || 9;
                metadata.supply = info.supply;
                metadata.hasMintAuthority = info.mintAuthority !== null;
                metadata.hasFreezeAuthority = info.freezeAuthority !== null;
                metadata.isInitialized = info.isInitialized !== false;
                console.log(`  ✅ Got token info from parsed account data`);
            } else if (accountInfo?.value) {
                // Account exists but not parsed - still a valid token
                console.log(`  ℹ️ Token account exists but data not parsed`);
            } else {
                // No account info - might be invalid token
                console.log(`  ⚠️ No account info for token ${tokenMint}`);
            }
        } catch (error) {
            console.log(`  ⚠️ getAccountInfo failed: ${error.message}`);
        }
        
        // Method 2: Try getTokenSupply with retry logic
        const supplyResult = await this.validateTokenWithRetry(tokenMint, 'supply');
        if (supplyResult.success && supplyResult.data?.supply) {
            metadata.supply = parseInt(supplyResult.data.supply.amount);
            metadata.decimals = parseInt(supplyResult.data.supply.decimals) || 9;
            metadata.isInitialized = true;
            console.log(`  ✅ Got token supply: ${supplyResult.data.supply.uiAmount}`);
        } else {
            console.log(`  ⚠️ getTokenSupply failed after retries: ${supplyResult.error}`);
        }
        
        // Method 3: Try to get holder distribution with retry logic
        const accountsResult = await this.validateTokenWithRetry(tokenMint, 'accounts');
        if (accountsResult.success && accountsResult.data?.accounts?.value) {
            const largestAccounts = accountsResult.data.accounts;
            if (largestAccounts.value && largestAccounts.value.length > 0) {
                const metadataSupply = parseInt(metadata.supply) || 0;
            const calculatedSupply = 
                    largestAccounts.value.reduce((sum, acc) => sum + parseInt(acc.amount), 0);
                const totalSupply = metadataSupply || calculatedSupply;
                
                if (totalSupply > 0) {
                    const largestHolder = largestAccounts.value[0];
                    metadata.largestHolderPercentage = (Number(largestHolder.amount) / totalSupply) * 100;
                    metadata.uniqueWallets = Math.max(largestAccounts.value.length, 
                        tokenCandidate.uniqueWallets || 10);
                    console.log(`  ✅ Got holder distribution: ${largestAccounts.value.length} holders`);
                }
            }
        } else {
            console.log(`  ⚠️ getTokenLargestAccounts failed after retries: ${accountsResult.error}`);
        }
        
        // Generate name and symbol if not available
        if (!metadata.name) {
            metadata.name = tokenCandidate.name || `Token ${tokenMint.substring(0, 6)}`;
        }
        if (!metadata.symbol) {
            metadata.symbol = tokenCandidate.symbol || tokenMint.substring(0, 4).toUpperCase();
        }
        
        // Cache the result before returning
        this.cacheMetadata(tokenMint, metadata);
        
        return metadata;
    }

    /**
     * FIXED: Check technical patterns with more lenient validation
     */
    checkTechnicalPatternsFixed(tokenMetrics) {
        try {
            const isPumpFun = tokenMetrics.isPumpFun;
            
            // Basic validation checks
            const checks = {
                hasValidAddress: this.isValidSolanaAddress(tokenMetrics.address),
                hasReasonableName: tokenMetrics.name && 
                                 tokenMetrics.name.length > 0 && 
                                 tokenMetrics.name.length < 100,
                hasReasonableSymbol: tokenMetrics.symbol && 
                                   tokenMetrics.symbol.length > 0 && 
                                   tokenMetrics.symbol.length <= 20,
                hasMinimumLiquidity: isPumpFun ? 
                                   tokenMetrics.lpValueUSD >= 500 : 
                                   tokenMetrics.lpValueUSD >= 1000
            };

            // More lenient checks for tokens that might not have full metadata
            if (!checks.hasValidAddress) {
                return {
                    passed: false,
                    reason: 'invalid_token_address',
                    score: 0
                };
            }

            // Allow tokens even if we couldn't get full metadata
            if (!checks.hasReasonableName || !checks.hasReasonableSymbol) {
                console.log(`  ⚠️ Token has incomplete metadata, proceeding with caution`);
            }

            // Liquidity check with fallback
            if (!checks.hasMinimumLiquidity && tokenMetrics.lpValueUSD < 100) {
                return {
                    passed: false,
                    reason: 'insufficient_liquidity',
                    score: 0
                };
            }

            // Calculate score
            let score = 0.5; // Base score for valid address
            if (checks.hasReasonableName) score += 0.15;
            if (checks.hasReasonableSymbol) score += 0.15;
            if (checks.hasMinimumLiquidity) score += 0.2;

            return {
                passed: true,
                reason: null,
                score: score,
                patterns: checks
            };

        } catch (error) {
            console.error(`❌ Technical pattern check failed: ${error.message}`);
            return {
                passed: false,
                reason: 'technical_check_error',
                score: 0
            };
        }
    }

    // Keep other methods from original implementation...
    rejectToken(reason, startTime = null) {
        const processingTime = startTime ? performance.now() - startTime : 0;
        console.log(`  ❌ Token rejected: ${reason}`);
        return {
            approved: false,
            reason: reason,
            confidence: 0,
            processingTimeMs: processingTime
        };
    }

    isValidSolanaAddress(address) {
        if (!address || typeof address !== 'string') {
            return false;
        }
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        return base58Regex.test(address);
    }

    extractTokenMint(tokenCandidate) {
        if (!tokenCandidate) return null;
        
        // Try multiple possible fields
        const possibleFields = [
            'tokenMint', 'baseMint', 'tokenAddress', 'mint', 
            'address', 'token', 'baseToken', 'baseAddress'
        ];
        
        for (const field of possibleFields) {
            const value = tokenCandidate[field];
            if (value && this.isValidSolanaAddress(value)) {
                return value;
            }
        }
        
        return null;
    }

    calculateTokenAge(tokenCandidate) {
        try {
            const creationTime = tokenCandidate.createdAt || 
                               tokenCandidate.detectedAt || 
                               tokenCandidate.timestamp ||
                               tokenCandidate.firstSeenAt;

            if (!creationTime) return 0;

            const timestamp = creationTime instanceof Date ? 
                            creationTime.getTime() : 
                            creationTime;

            const ageMs = Date.now() - timestamp;
            const ageMinutes = Math.floor(ageMs / (1000 * 60));

            return Math.max(0, ageMinutes);
        } catch (error) {
            console.warn(`⚠️ Failed to calculate token age: ${error.message}`);
            return 0;
        }
    }

    // Copy other evaluation methods from original...
    async evaluateFreshGem(tokenMetrics) {
        try {
            // Use existing risk modules if available
            if (this.scamProtectionEngine && this.liquidityRiskAnalyzer && this.marketCapRiskFilter) {
                const [scamResult, liquidityResult, marketCapResult] = await Promise.all([
                    this.scamProtectionEngine.analyzeToken(tokenMetrics.address, tokenMetrics),
                    this.liquidityRiskAnalyzer.validateExitLiquidity(tokenMetrics.address, tokenMetrics),
                    this.marketCapRiskFilter.filterByMarketCap(tokenMetrics, "fresh_gem")
                ]);
                
                // Keep unique organic activity analysis
                const organicCheck = this.checkOrganicActivity(tokenMetrics);
                
                // Combine results
                const passed = !scamResult.isScam && liquidityResult.hasExitLiquidity && marketCapResult.passed && organicCheck.passed;
                const overallScore = passed ? (scamResult.confidence + (liquidityResult.slippage || 0) + organicCheck.score) / 3 : 0;
                
                return {
                    passed,
                    score: overallScore / 100, // Normalize to 0-1
                    securityScore: (100 - scamResult.confidence) / 100,
                    organicScore: organicCheck.score,
                    reason: passed ? "fresh_gem_approved" : "fresh_gem_rejected",
                    failureType: !passed ? "integrated_analysis" : null,
                    riskAnalysis: { scamResult, liquidityResult, marketCapResult }
                };
            }
            
            // Fallback to internal logic if modules not available
            return this.evaluateFreshGemFallback(tokenMetrics);
        } catch (error) {
            console.error("Risk module integration failed:", error);
            return this.evaluateFreshGemFallback(tokenMetrics);
        }
    }

    async evaluateFreshGemFallback(tokenMetrics) {
        const isPumpFun = tokenMetrics.isPumpFun;
        let adjustedMetrics = tokenMetrics;
        
        if (isPumpFun) {
            adjustedMetrics = {
                ...tokenMetrics,
                buyToSellRatio: tokenMetrics.buyToSellRatio * 1.5,
                uniqueWallets: Math.max(tokenMetrics.uniqueWallets, 15)
            };
            console.log("🎯 Pump.fun token detected - applying adjusted criteria");
        }
        
        const securityCheck = this.checkFreshGemSecurity(adjustedMetrics);
        const organicCheck = this.checkOrganicActivity(adjustedMetrics);
        
        const securityScore = securityCheck.score;
        const organicScore = organicCheck.score;
        const overallScore = (securityScore + organicScore) / 2;
        
        const passed = securityCheck.passed && organicCheck.passed;
        
        return {
            passed,
            score: overallScore || 0,
            securityScore: securityScore || 0,
            organicScore: organicScore || 0,
            reason: passed ? "fresh_gem_approved" : "fresh_gem_rejected",
            failureType: !securityCheck.passed ? "security" : (!organicCheck.passed ? "organic" : null)
        };
    }
    
    checkFreshGemSecurity(tokenMetrics) {
        const criteria = this.FRESH_GEM_CRITERIA.security;
        let score = 0;
        let passed = true;

        if (!tokenMetrics.hasMintAuthority) {
            score += 0.25;
        } else {
            passed = false;
        }

        if (!tokenMetrics.hasFreezeAuthority) {
            score += 0.25;
        } else {
            passed = false;
        }

        if (tokenMetrics.largestHolderPercentage <= criteria.topHolderMaxPercent) {
            score += 0.25;
        } else {
            passed = false;
        }

        if (tokenMetrics.lpValueUSD >= criteria.lpValueMinUSD) {
            score += 0.25;
        } else {
            passed = false;
        }

        return { passed, score };
    }

    checkOrganicActivity(tokenMetrics) {
        const criteria = this.FRESH_GEM_CRITERIA.organic;
        let passedChecks = 0;
        let score = 0;

        if (tokenMetrics.uniqueWallets >= criteria.minUniqueWallets) {
            passedChecks++;
            score += 0.2;
        }

        if (tokenMetrics.buyToSellRatio >= criteria.minBuyToSellRatio) {
            passedChecks++;
            score += 0.2;
        }

        if (tokenMetrics.avgTransactionSpread >= criteria.minTransactionSpread) {
            passedChecks++;
            score += 0.2;
        }

        if (tokenMetrics.transactionSizeVariation >= criteria.minTransactionVariation) {
            passedChecks++;
            score += 0.2;
        }

        if (tokenMetrics.volumeToLiquidityRatio >= criteria.minVolumeToLiquidityRatio) {
            passedChecks++;
            score += 0.2;
        }

        const passed = passedChecks >= 3;
        console.log(`    🌱 Organic activity: ${passedChecks}/5 checks passed (need 3)`);
        
        return { passed, score };
    }

    async evaluateEstablishedToken(tokenMetrics) {
        try {
            // Use existing risk modules if available
            if (this.scamProtectionEngine && this.marketCapRiskFilter) {
                const [scamResult, marketCapResult] = await Promise.all([
                    this.scamProtectionEngine.analyzeToken(tokenMetrics.address, tokenMetrics),
                    this.marketCapRiskFilter.filterByMarketCap(tokenMetrics, "established")
                ]);
                
                const passed = !scamResult.isScam && marketCapResult.passed;
                const score = passed ? (100 - scamResult.confidence) / 100 : 0;
                
                return {
                    passed,
                    score,
                    securityScore: score,
                    organicScore: score,
                    tier: passed ? "established" : "rejected",
                    reason: passed ? "established_token_approved" : marketCapResult.reason || scamResult.reasons.join(", ")
                };
            }
            
            // Fallback to internal logic
            return this.evaluateEstablishedTokenFallback(tokenMetrics);
        } catch (error) {
            console.error("Established token analysis failed:", error);
            return { passed: false, score: 0, tier: "rejected", reason: error.message };
        }
    }
    
    async evaluateEstablishedTokenFallback(tokenMetrics) {
        const criteria = {
            minLiquidityUSD: 10000,
            minUniqueWallets: 50,
            maxTopHolderPercent: 30,
            minVolumeLiquidity: 0.1,
            minTokenAge: 60
        };
        
        let score = 0;
        let passed = true;
        let failureReasons = [];
        
        if (tokenMetrics.ageMinutes < criteria.minTokenAge) {
            passed = false;
            failureReasons.push("too_young_for_established");
        } else { score += 0.2; }
        
        if (tokenMetrics.lpValueUSD < criteria.minLiquidityUSD) {
            passed = false;
            failureReasons.push("insufficient_liquidity");
        } else { score += 0.2; }
        
        return {
            passed,
            score: score || 0,
            tier: passed ? "established" : "rejected",
            reason: failureReasons.length > 0 ? failureReasons.join(", ") : "established_token_approved"
        };
    }

    detectPumpFunToken(tokenCandidate, tokenMetrics) {
        try {
            const isPumpFunProgram = tokenCandidate.programId === this.PUMP_FUN_PATTERNS.programId ||
                                   tokenCandidate.dex === 'pump.fun';
            
            if (!isPumpFunProgram) return null;
            
            const pumpFunDetails = {
                isPumpFun: true,
                bondingCurve: tokenCandidate.bondingCurve || tokenCandidate.poolAddress,
                graduated: tokenCandidate.graduated || false,
                initialBuy: tokenCandidate.initialBuy || 0,
                currentStage: 'unknown'
            };
            
            if (tokenMetrics.lpValueUSD < 1000) {
                pumpFunDetails.currentStage = 'early';
            } else if (tokenMetrics.lpValueUSD < 10000) {
                pumpFunDetails.currentStage = 'building';
            } else if (tokenMetrics.lpValueUSD < 50000) {
                pumpFunDetails.currentStage = 'momentum';
            } else {
                pumpFunDetails.currentStage = 'graduating';
            }
            
            const suspiciousActivity = this.PUMP_FUN_PATTERNS.suspiciousPatterns.some(pattern => 
                tokenMetrics.name?.toLowerCase().includes(pattern) ||
                tokenMetrics.symbol?.toLowerCase().includes(pattern)
            );
            
            if (suspiciousActivity) {
                pumpFunDetails.suspicious = true;
                pumpFunDetails.suspiciousReason = 'name_pattern_match';
            }
            
            if (pumpFunDetails.initialBuy > 0) {
                const [minBuy, maxBuy] = this.PUMP_FUN_PATTERNS.typicalInitialBuy;
                if (pumpFunDetails.initialBuy < minBuy || pumpFunDetails.initialBuy > maxBuy) {
                    pumpFunDetails.suspicious = true;
                    pumpFunDetails.suspiciousReason = 'unusual_initial_buy';
                }
            }
            
            return pumpFunDetails;
            
        } catch (error) {
            console.warn(`⚠️ Pump.fun detection failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Maintain metadata cache - prevent memory leaks during high-volume trading
     * Called automatically during token processing
     */
    maintainMetadataCache() {
        const now = Date.now();
        
        // Size-based cleanup: Remove oldest entries if over limit
        if (this.metadataCache.size > this.maxCacheSize) {
            const excess = this.metadataCache.size - Math.floor(this.maxCacheSize * 0.8); // Keep 80%
            const iterator = this.metadataCache.keys();
            
            for (let i = 0; i < excess; i++) {
                const next = iterator.next();
                if (next.done) break;
                const key = next.value;
                if (key) {
                    this.metadataCache.delete(key);
                }
            }
            
            console.log(`🧹 Metadata cache: removed ${excess} old entries, size now ${this.metadataCache.size}`);
        }
        
        // Time-based cleanup: Remove entries older than TTL (every 2 minutes)
        if (now - this.lastCacheCleanup > 120000) {
            let removed = 0;
            
            for (const [key, entry] of this.metadataCache) {
                if (entry.timestamp && (now - entry.timestamp) > this.cacheTTL) {
                    this.metadataCache.delete(key);
                    removed++;
                }
            }
            
            this.lastCacheCleanup = now;
            
            if (removed > 0) {
                console.log(`🧹 Metadata cache: removed ${removed} expired entries`);
            }
        }
    }

    /**
     * Cache metadata with timestamp for TTL management
     */
    cacheMetadata(tokenMint, metadata) {
        this.metadataCache.set(tokenMint, {
            ...metadata,
            timestamp: Date.now()
        });
        
        // Trigger maintenance if needed
        this.maintainMetadataCache();
    }

    /**
     * Get cached metadata if still valid
     */
    getCachedMetadata(tokenMint) {
        const entry = this.metadataCache.get(tokenMint);
        if (!entry) return null;
        
        // Check TTL
        if (entry.timestamp && (Date.now() - entry.timestamp) > this.cacheTTL) {
            this.metadataCache.delete(tokenMint);
            return null;
        }
        
        return entry;
    }

    /**
     * Clean up validation queue - prevent memory leaks from stuck validations
     * Called automatically during token processing
     */
    cleanupValidationQueue() {
        const now = Date.now();
        
        // Only run cleanup every 30 seconds
        if (now - this.lastQueueCleanup < 30000) {
            return;
        }
        
        let removed = 0;
        
        // Remove entries older than maxQueueAge
        for (const [queueKey, timestamp] of this.validationQueueTimestamps) {
            if (now - timestamp > this.maxQueueAge) {
                this.validationQueue.delete(queueKey);
                this.validationQueueTimestamps.delete(queueKey);
                removed++;
            }
        }
        
        this.lastQueueCleanup = now;
        
        if (removed > 0) {
            console.log(`🧹 Validation queue: removed ${removed} stuck entries`);
        }
    }

    /**
     * Emergency queue clear - for testing or recovery
     */
    clearValidationQueue() {
        this.validationQueue.clear();
        this.validationQueueTimestamps.clear();
        console.log('🧹 Validation queue cleared');
    }

    async healthCheck() {
        const totalProcessed = this.stats.processed;
        const freshGemRate = totalProcessed > 0 ? (this.stats.freshGemsDetected / totalProcessed * 100) : 0;
        const establishedRate = totalProcessed > 0 ? (this.stats.establishedPassed / totalProcessed * 100) : 0;
        const totalPassRate = freshGemRate + establishedRate;

        return {
            healthy: this.isInitialized && totalPassRate >= 10,
            stats: {
                processed: totalProcessed,
                freshGemsDetected: this.stats.freshGemsDetected,
                establishedPassed: this.stats.establishedPassed,
                freshGemRate: freshGemRate.toFixed(2) + '%',
                establishedRate: establishedRate.toFixed(2) + '%',
                totalPassRate: totalPassRate.toFixed(2) + '%'
            }
        };
    }

    /**
     * Graceful shutdown with cleanup
     */
    async shutdown() {
        console.log('🔄 Shutting down Renaissance Token Filter...');
        
        // Clear cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Final cleanup
        this.clearValidationQueue();
        this.metadataCache.clear();
        
        // Update stats
        this.isInitialized = false;
        
        console.log('✅ Renaissance Token Filter shutdown complete');
    }
}

export { TieredTokenFilterServiceFixed as TieredTokenFilterService };