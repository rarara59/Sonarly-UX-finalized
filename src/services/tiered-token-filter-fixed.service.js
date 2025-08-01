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
        this.isInitialized = false;
        this.metadataCache = new Map();
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
        
        this.isInitialized = true;
        console.log('💎 Renaissance Tiered Token Filter (Fixed) initialized');
        console.log('  🆕 Fresh gem detection (0-15min): High risk/reward analysis');
        console.log('  🏛️ Established token filtering (15min+): Proven metrics analysis');
        console.log('  🧮 Organic activity detection enabled');
        console.log('  ✅ Robust token validation with fallback methods');
        
        return true;
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
                lpValueUSD: tokenCandidate.lpValueUSD || tokenCandidate.liquidityUSD || 0,
                largestHolderPercentage: tokenCandidate.largestHolderPercentage || 50,
                uniqueWallets: tokenCandidate.uniqueWallets || 10,
                buyToSellRatio: tokenCandidate.buyToSellRatio || 1.0,
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
                metrics.volumeToLiquidityRatio = tokenCandidate.volume24h / metrics.lpValueUSD;
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
        
        // Method 2: Try getTokenSupply as additional validation
        try {
            const supplyInfo = await this.rpcManager.call('getTokenSupply', [tokenMint]);
            if (supplyInfo?.value) {
                metadata.supply = supplyInfo.value.amount;
                metadata.decimals = supplyInfo.value.decimals || 9;
                metadata.isInitialized = true;
                console.log(`  ✅ Got token supply: ${supplyInfo.value.uiAmount}`);
            }
        } catch (error) {
            console.log(`  ⚠️ getTokenSupply failed: ${error.message}`);
        }
        
        // Method 3: Try to get holder distribution
        try {
            const largestAccounts = await this.rpcManager.call('getTokenLargestAccounts', [tokenMint]);
            if (largestAccounts?.value && largestAccounts.value.length > 0) {
                const totalSupply = metadata.supply || 
                    largestAccounts.value.reduce((sum, acc) => sum + Number(acc.amount), 0);
                
                if (totalSupply > 0) {
                    const largestHolder = largestAccounts.value[0];
                    metadata.largestHolderPercentage = (Number(largestHolder.amount) / totalSupply) * 100;
                    metadata.uniqueWallets = Math.max(largestAccounts.value.length, 
                        tokenCandidate.uniqueWallets || 10);
                    console.log(`  ✅ Got holder distribution: ${largestAccounts.value.length} holders`);
                }
            }
        } catch (error) {
            console.log(`  ⚠️ getTokenLargestAccounts failed: ${error.message}`);
        }
        
        // Generate name and symbol if not available
        if (!metadata.name) {
            metadata.name = tokenCandidate.name || `Token ${tokenMint.substring(0, 6)}`;
        }
        if (!metadata.symbol) {
            metadata.symbol = tokenCandidate.symbol || tokenMint.substring(0, 4).toUpperCase();
        }
        
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
        const isPumpFun = tokenMetrics.isPumpFun;
        let adjustedMetrics = tokenMetrics;
        
        if (isPumpFun) {
            adjustedMetrics = {
                ...tokenMetrics,
                buyToSellRatio: tokenMetrics.buyToSellRatio * 1.5,
                uniqueWallets: Math.max(tokenMetrics.uniqueWallets, 15)
            };
            console.log(`  🎯 Pump.fun token detected - applying adjusted criteria`);
        }
        
        const securityCheck = this.checkFreshGemSecurity(adjustedMetrics);
        const organicCheck = this.checkOrganicActivity(adjustedMetrics);
        
        const securityScore = securityCheck.score;
        const organicScore = organicCheck.score;
        const overallScore = (securityScore + organicScore) / 2;
        
        const passed = securityCheck.passed && organicCheck.passed;
        
        const gemType = isPumpFun ? 'Pump.fun gem' : 'Fresh gem';
        console.log(`  💎 ${gemType} analysis: security=${securityScore.toFixed(2)}, organic=${organicScore.toFixed(2)}, passed=${passed}`);
        
        return {
            passed: passed,
            score: overallScore || 0,
            securityScore: securityScore || 0,
            organicScore: organicScore || 0,
            reason: passed ? 'fresh_gem_approved' : 'fresh_gem_rejected',
            failureType: !securityCheck.passed ? 'security' : (!organicCheck.passed ? 'organic' : null),
            isPumpFun: isPumpFun,
            pumpFunDetails: tokenMetrics.pumpFunDetails
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
                failureReasons.push('too_young_for_established');
            } else {
                score += 0.2;
            }

            if (tokenMetrics.lpValueUSD < criteria.minLiquidityUSD) {
                passed = false;
                failureReasons.push('insufficient_liquidity');
            } else {
                score += 0.2;
            }

            if (tokenMetrics.uniqueWallets < criteria.minUniqueWallets) {
                passed = false;
                failureReasons.push('insufficient_holders');
            } else {
                score += 0.2;
            }

            if (tokenMetrics.largestHolderPercentage > criteria.maxTopHolderPercent) {
                passed = false;
                failureReasons.push('too_concentrated');
            } else {
                score += 0.2;
            }

            if (tokenMetrics.volumeToLiquidityRatio < criteria.minVolumeLiquidity) {
                passed = false;
                failureReasons.push('low_trading_activity');
            } else {
                score += 0.2;
            }

            return {
                passed: passed,
                score: score || 0,
                securityScore: score || 0,
                organicScore: score || 0,
                tier: passed ? 'established' : 'rejected',
                failureType: failureReasons.length > 0 ? 'established_criteria' : null,
                reason: failureReasons.length > 0 ? failureReasons.join(', ') : 
                    (passed ? 'established_token_approved' : 'established_token_rejected')
            };

        } catch (error) {
            console.error(`❌ Failed to evaluate established token: ${error.message}`);
            return {
                passed: false,
                score: 0,
                tier: 'rejected',
                failureType: 'evaluation_error',
                reason: error.message
            };
        }
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
}

export { TieredTokenFilterServiceFixed };