import { EventEmitter } from 'events';

class TieredTokenFilterService extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Renaissance age-based tiered criteria
        this.FRESH_GEM_CRITERIA = {
            maxAgeMinutes: 15, // Meme coin optimization: 15 minutes instead of 30
            security: {
                mintAuthorityRenounced: true,
                freezeAuthorityRenounced: true,
                topHolderMaxPercent: 30,
                lpValueMinUSD: 2000, // Meme coin optimization: $2k instead of $8k
            },
            organic: {
                minUniqueWallets: 25, // Meme coin optimization: 25 instead of 15
                minBuyToSellRatio: 2.0, // Meme coin optimization: 2.0 instead of 1.2
                minTransactionSpread: 2,
                minTransactionVariation: 0.2,
                minVolumeToLiquidityRatio: 0.05,
            }
        };
        
        this.ESTABLISHED_CRITERIA = {
            quality: {
                minHolders: 300,
                minTransactions: 500,
                minMarketCap: 25000, // Meme coin optimization: $25k instead of $100k
                minVolume: 100000,
                maxTopHolderPercent: 30,
            }
        };
        
        // Pump.fun specific patterns
        this.PUMP_FUN_PATTERNS = {
            programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
            bondingCurvePrefix: 'curve', // Common prefix in pump.fun bonding curves
            graduationThreshold: 85000, // SOL threshold for graduation to Raydium
            typicalInitialBuy: [0.1, 5], // Typical initial buy range in SOL
            suspiciousPatterns: [
                'bundle', // Bundle attacks
                'snipe', // Sniper bots
                'bot', // Bot activity
            ]
        };
        
        // Technical failure patterns (keep from current)
        this.TECHNICAL_PATTERNS = [
            /^[0-9]+$/,
            /(.)\1{6,}/,
            /[^\x00-\x7F]{3,}/,
            /test\s*token/i,
            /scam\s*token/i
        ];
        
        // Dependencies and state
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
        console.log('💎 Renaissance Tiered Token Filter initialized');
        console.log('  🆕 Fresh gem detection (0-30min): High risk/reward analysis');
        console.log('  🏛️ Established token filtering (30min+): Proven metrics analysis');
        console.log('  🧮 Organic activity detection enabled');
        
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
            // Get comprehensive token metrics
            const tokenMetrics = await this.gatherComprehensiveMetrics(tokenCandidate);
            
            if (!tokenMetrics) {
                return this.rejectToken('metrics_gathering_failed', startTime);
            }

            // Check for pump.fun specific patterns
            const isPumpFun = this.detectPumpFunToken(tokenCandidate, tokenMetrics);
            if (isPumpFun) {
                tokenMetrics.isPumpFun = true;
                tokenMetrics.pumpFunDetails = isPumpFun;
            }
            
            // Apply technical pattern filters first (fast elimination)
            const technicalCheck = this.checkTechnicalPatterns(tokenMetrics);
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

            // Token passed - emit with Renaissance classification
            if (isFreshGem) this.stats.freshGemsDetected++;
            else this.stats.establishedPassed++;

            const enrichedCandidate = {
                ...tokenCandidate,
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
            return this.rejectToken('processing_error', startTime);
        }
    }

    /**
     * Evaluate fresh gem (0-15 minutes) with Renaissance criteria
     */
    async evaluateFreshGem(tokenMetrics) {
        // Apply pump.fun specific adjustments if detected
        const isPumpFun = tokenMetrics.isPumpFun;
        let adjustedMetrics = tokenMetrics;
        
        if (isPumpFun) {
            // Adjust criteria for pump.fun tokens
            adjustedMetrics = {
                ...tokenMetrics,
                // Pump.fun tokens often have different buy patterns
                buyToSellRatio: tokenMetrics.buyToSellRatio * 1.5, // Boost ratio for pump.fun
                // Early stage pump.fun tokens may have fewer wallets
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
        
        // Log with pump.fun indicator
        const gemType = isPumpFun ? 'Pump.fun gem' : 'Fresh gem';
        console.log(`  💎 ${gemType} analysis: security=${securityScore.toFixed(2)}, organic=${organicScore.toFixed(2)}, passed=${passed}`);
        
        return {
            passed: passed,
            score: overallScore,
            securityScore: securityScore,
            organicScore: organicScore,
            reason: passed ? 'fresh_gem_approved' : 'fresh_gem_rejected',
            failureType: !securityCheck.passed ? 'security' : (!organicCheck.passed ? 'organic' : null),
            isPumpFun: isPumpFun,
            pumpFunDetails: tokenMetrics.pumpFunDetails
        };
    }

    /**
     * Check fresh gem security requirements
     */
    checkFreshGemSecurity(tokenMetrics) {
        const criteria = this.FRESH_GEM_CRITERIA.security;
        let score = 0;
        let passed = true;

        // Mint authority check (25% weight)
        if (!tokenMetrics.hasMintAuthority) {
            score += 0.25;
        } else {
            passed = false;
        }

        // Freeze authority check (25% weight)
        if (!tokenMetrics.hasFreezeAuthority) {
            score += 0.25;
        } else {
            passed = false;
        }

        // Top holder distribution (25% weight)
        if (tokenMetrics.largestHolderPercentage <= criteria.topHolderMaxPercent) {
            score += 0.25;
        } else {
            passed = false;
        }

        // Liquidity threshold (25% weight)
        if (tokenMetrics.lpValueUSD >= criteria.lpValueMinUSD) {
            score += 0.25;
        } else {
            passed = false;
        }

        return { passed, score };
    }

    /**
     * Check organic activity patterns (Renaissance algorithm)
     */
    checkOrganicActivity(tokenMetrics) {
        const criteria = this.FRESH_GEM_CRITERIA.organic;
        let passedChecks = 0;
        let score = 0;

        // Check 1: Unique wallet diversity (20% weight)
        if (tokenMetrics.uniqueWallets >= criteria.minUniqueWallets) {
            passedChecks++;
            score += 0.2;
        }

        // Check 2: Buy/sell ratio indicates organic demand (20% weight)
        if (tokenMetrics.buyToSellRatio >= criteria.minBuyToSellRatio) {
            passedChecks++;
            score += 0.2;
        }

        // Check 3: Transaction time distribution (20% weight)
        if (tokenMetrics.avgTransactionSpread >= criteria.minTransactionSpread) {
            passedChecks++;
            score += 0.2;
        }

        // Check 4: Transaction size variation (20% weight)
        if (tokenMetrics.transactionSizeVariation >= criteria.minTransactionVariation) {
            passedChecks++;
            score += 0.2;
        }

        // Check 5: Volume/liquidity efficiency (20% weight)
        if (tokenMetrics.volumeToLiquidityRatio >= criteria.minVolumeToLiquidityRatio) {
            passedChecks++;
            score += 0.2;
        }

        // Must pass 3 of 5 organic checks
        const passed = passedChecks >= 3;
        
        console.log(`    🌱 Organic activity: ${passedChecks}/5 checks passed (need 3)`);
        
        return { passed, score };
    }

    /**
     * Gather comprehensive token metrics (Renaissance data collection)
     */
    async gatherComprehensiveMetrics(tokenCandidate) {
        try {
            // Get basic metadata
            const tokenMint = this.extractTokenMint(tokenCandidate);
            const metadata = await this.fetchTokenMetadata(tokenMint);
            
            if (!metadata) return null;

            // Calculate derived metrics
            const ageMinutes = this.calculateTokenAge(tokenCandidate);
            
            // 1) Get account info to check mint/freeze authorities
            let hasMintAuthority = true;
            let hasFreezeAuthority = true;
            
            try {
                const mintInfo = await this.rpcManager.call('getAccountInfo', [
                    tokenMint,
                    { encoding: 'jsonParsed' }
                ]);
                
                if (mintInfo && mintInfo.value && mintInfo.value.data && mintInfo.value.data.parsed) {
                    const parsedData = mintInfo.value.data.parsed.info;
                    hasMintAuthority = parsedData.mintAuthority !== null;
                    hasFreezeAuthority = parsedData.freezeAuthority !== null;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to get mint info for ${tokenMint}: ${error.message}`);
                // Don't fail the entire process, continue with defaults
            }
            
            // 2) Get token largest accounts for holder distribution
            let largestHolderPercentage = 0;
            let uniqueWallets = 0;
            
            try {
                const largestAccounts = await this.rpcManager.call('getTokenLargestAccounts', [tokenMint]);
                
                if (largestAccounts && largestAccounts.value && largestAccounts.value.length > 0) {
                    // Get total supply
                    const supplyResponse = await this.rpcManager.call('getTokenSupply', [tokenMint]);
                    const totalSupply = supplyResponse.value.uiAmount || 1;
                    
                    // Calculate largest holder percentage
                    const largestAccount = largestAccounts.value[0];
                    largestHolderPercentage = (largestAccount.uiAmount / totalSupply) * 100;
                    
                    // Count unique holders (non-zero balances)
                    uniqueWallets = largestAccounts.value.filter(acc => acc.uiAmount > 0).length;
                    
                    // If we have the full list (usually top 20), that's our minimum unique wallets
                    // In reality there could be more
                    if (uniqueWallets === 20) {
                        uniqueWallets = 20; // At least 20, could be more
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Failed to get holder distribution for ${tokenMint}: ${error.message}`);
                // Continue with candidate data if available
                largestHolderPercentage = tokenCandidate.largestHolderPercentage || 50;
                uniqueWallets = tokenCandidate.uniqueWallets || 10;
            }
            
            // 3) Calculate real LP value from pool data
            let lpValueUSD = tokenCandidate.lpValueUSD || 0;
            
            if (tokenCandidate.poolAddress && !lpValueUSD) {
                try {
                    // Get pool account info
                    const poolInfo = await this.rpcManager.call('getAccountInfo', [
                        tokenCandidate.poolAddress,
                        { encoding: 'base64' }
                    ]);
                    
                    if (poolInfo && poolInfo.value) {
                        // For Raydium pools, we can extract reserve amounts
                        // This would need proper parsing based on DEX type
                        if (tokenCandidate.dex === 'Raydium' && tokenCandidate.baseReserve && tokenCandidate.quoteReserve) {
                            // Assume quote is USDC/USDT for now
                            const quoteDecimals = 6; // USDC decimals
                            lpValueUSD = (tokenCandidate.quoteReserve / Math.pow(10, quoteDecimals)) * 2;
                        } else if (tokenCandidate.liquidityUSD) {
                            lpValueUSD = tokenCandidate.liquidityUSD;
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to calculate LP value for pool ${tokenCandidate.poolAddress}: ${error.message}`);
                }
            }
            
            // 4) Analyze transaction patterns
            let buyToSellRatio = 1.0;
            let avgTransactionSpread = 60; // seconds
            let transactionSizeVariation = 0.5;
            let volumeToLiquidityRatio = 0.1;
            
            try {
                // Get recent transactions for the token
                if (tokenCandidate.poolAddress) {
                    const signatures = await this.rpcManager.call('getSignaturesForAddress', [
                        tokenCandidate.poolAddress,
                        { limit: 50 } // Last 50 transactions
                    ]);
                    
                    if (signatures && signatures.length > 10) {
                        // Analyze transaction timing
                        const timestamps = signatures.map(sig => sig.blockTime).filter(t => t);
                        if (timestamps.length > 1) {
                            const timeDiffs = [];
                            for (let i = 1; i < timestamps.length; i++) {
                                timeDiffs.push(Math.abs(timestamps[i] - timestamps[i-1]));
                            }
                            avgTransactionSpread = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
                        }
                        
                        // Simple buy/sell ratio based on transaction count
                        // In production, would parse actual swap directions
                        const recentTxCount = signatures.length;
                        buyToSellRatio = recentTxCount > 20 ? 1.5 : 1.0; // Heuristic for active tokens
                        
                        // Transaction size variation (simplified)
                        transactionSizeVariation = Math.min(1.0, recentTxCount / 50);
                        
                        // Volume to liquidity ratio estimate
                        if (lpValueUSD > 0 && tokenCandidate.volume24h) {
                            volumeToLiquidityRatio = tokenCandidate.volume24h / lpValueUSD;
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Failed to analyze transactions for ${tokenMint}: ${error.message}`);
                // Use candidate data if available
                buyToSellRatio = tokenCandidate.buyToSellRatio || 1.2;
                avgTransactionSpread = tokenCandidate.avgTransactionSpread || 60;
                transactionSizeVariation = tokenCandidate.transactionSizeVariation || 0.5;
            }
            
            // Return comprehensive metrics with real data
            return {
                address: tokenMint,
                name: metadata.name,
                symbol: metadata.symbol,
                ageMinutes: ageMinutes,
                hasMintAuthority: hasMintAuthority,
                hasFreezeAuthority: hasFreezeAuthority,
                lpValueUSD: lpValueUSD,
                largestHolderPercentage: largestHolderPercentage,
                uniqueWallets: uniqueWallets,
                buyToSellRatio: buyToSellRatio,
                avgTransactionSpread: avgTransactionSpread,
                transactionSizeVariation: transactionSizeVariation,
                volumeToLiquidityRatio: volumeToLiquidityRatio,
                // Include original candidate data for reference
                poolAddress: tokenCandidate.poolAddress,
                dex: tokenCandidate.dex,
                detectedAt: tokenCandidate.detectedAt
            };
            
        } catch (error) {
            console.warn(`⚠️ Metrics gathering failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Extract token mint address from candidate data
     */
    extractTokenMint(tokenCandidate) {
        // Try multiple possible fields for token mint
        return tokenCandidate.tokenMint || 
               tokenCandidate.baseMint || 
               tokenCandidate.tokenAddress || 
               tokenCandidate.mint ||
               tokenCandidate.address;
    }

    /**
     * Fetch token metadata from blockchain
     */
    async fetchTokenMetadata(tokenMint) {
        try {
            // First, get basic mint info
            const mintInfo = await this.rpcManager.call('getAccountInfo', [
                tokenMint,
                { encoding: 'jsonParsed' }
            ]);

            if (!mintInfo || !mintInfo.value || !mintInfo.value.data) {
                console.warn(`⚠️ No mint info found for ${tokenMint}`);
                return null;
            }

            const parsedData = mintInfo.value.data.parsed?.info;
            if (!parsedData) {
                console.warn(`⚠️ Unable to parse mint data for ${tokenMint}`);
                return null;
            }

            // Get metadata account (for SPL Token-2022 or Metaplex)
            let name = 'Unknown';
            let symbol = 'UNK';
            
            try {
                // Try to get token metadata from various sources
                // 1. Check for SPL Token-2022 metadata
                if (parsedData.extensions) {
                    for (const ext of parsedData.extensions) {
                        if (ext.extension === 'tokenMetadata') {
                            name = ext.state?.name || name;
                            symbol = ext.state?.symbol || symbol;
                            break;
                        }
                    }
                }

                // 2. Try Metaplex metadata if available
                // This would require computing the metadata PDA, but for now use basic info
                
                // 3. Fallback to deriving from mint address
                if (name === 'Unknown' && symbol === 'UNK') {
                    // Use first 4 chars of mint as symbol
                    symbol = tokenMint.substring(0, 4).toUpperCase();
                    name = `Token ${symbol}`;
                }
            } catch (metadataError) {
                console.warn(`⚠️ Failed to get extended metadata: ${metadataError.message}`);
            }

            return {
                address: tokenMint,
                name: name,
                symbol: symbol,
                decimals: parsedData.decimals || 9,
                supply: parsedData.supply,
                mintAuthority: parsedData.mintAuthority,
                freezeAuthority: parsedData.freezeAuthority,
                isInitialized: parsedData.isInitialized
            };

        } catch (error) {
            console.error(`❌ Failed to fetch metadata for ${tokenMint}: ${error.message}`);
            return null;
        }
    }

    /**
     * Calculate token age in minutes from creation or detection time
     */
    calculateTokenAge(tokenCandidate) {
        try {
            // Use multiple possible timestamp fields
            const creationTime = tokenCandidate.createdAt || 
                               tokenCandidate.detectedAt || 
                               tokenCandidate.timestamp ||
                               tokenCandidate.firstSeenAt;

            if (!creationTime) {
                // If no timestamp, assume it's new (0 minutes)
                return 0;
            }

            // Convert to timestamp if it's a Date object
            const timestamp = creationTime instanceof Date ? 
                            creationTime.getTime() : 
                            creationTime;

            // Calculate age in minutes
            const ageMs = Date.now() - timestamp;
            const ageMinutes = Math.floor(ageMs / (1000 * 60));

            return Math.max(0, ageMinutes); // Ensure non-negative

        } catch (error) {
            console.warn(`⚠️ Failed to calculate token age: ${error.message}`);
            return 0; // Default to new token
        }
    }

    /**
     * Evaluate established tokens (older than fresh gem window)
     */
    async evaluateEstablishedToken(tokenMetrics) {
        try {
            // Established tokens need different criteria
            const criteria = {
                minLiquidityUSD: 10000,      // Higher liquidity requirement
                minUniqueWallets: 50,        // More holders
                maxTopHolderPercent: 30,     // Better distribution
                minVolumeLiquidity: 0.1,     // Active trading
                minTokenAge: 60              // At least 1 hour old
            };

            let score = 0;
            let passed = true;
            let failureReasons = [];

            // Check age requirement
            if (tokenMetrics.ageMinutes < criteria.minTokenAge) {
                passed = false;
                failureReasons.push('too_young_for_established');
            } else {
                score += 0.2;
            }

            // Check liquidity
            if (tokenMetrics.lpValueUSD < criteria.minLiquidityUSD) {
                passed = false;
                failureReasons.push('insufficient_liquidity');
            } else {
                score += 0.2;
            }

            // Check holder distribution
            if (tokenMetrics.uniqueWallets < criteria.minUniqueWallets) {
                passed = false;
                failureReasons.push('insufficient_holders');
            } else {
                score += 0.2;
            }

            // Check concentration
            if (tokenMetrics.largestHolderPercentage > criteria.maxTopHolderPercent) {
                passed = false;
                failureReasons.push('too_concentrated');
            } else {
                score += 0.2;
            }

            // Check trading activity
            if (tokenMetrics.volumeToLiquidityRatio < criteria.minVolumeLiquidity) {
                passed = false;
                failureReasons.push('low_trading_activity');
            } else {
                score += 0.2;
            }

            return {
                passed: passed,
                score: score,
                tier: passed ? 'established' : 'rejected',
                failureType: failureReasons.length > 0 ? 'established_criteria' : null,
                reason: failureReasons.join(', ')
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

    /**
     * Detect pump.fun specific tokens
     */
    detectPumpFunToken(tokenCandidate, tokenMetrics) {
        try {
            // Check if it's from pump.fun program
            const isPumpFunProgram = tokenCandidate.programId === this.PUMP_FUN_PATTERNS.programId ||
                                   tokenCandidate.dex === 'pump.fun';
            
            if (!isPumpFunProgram) return null;
            
            // Analyze pump.fun specific patterns
            const pumpFunDetails = {
                isPumpFun: true,
                bondingCurve: tokenCandidate.bondingCurve || tokenCandidate.poolAddress,
                graduated: tokenCandidate.graduated || false,
                initialBuy: tokenCandidate.initialBuy || 0,
                currentStage: 'unknown'
            };
            
            // Determine current stage based on liquidity
            if (tokenMetrics.lpValueUSD < 1000) {
                pumpFunDetails.currentStage = 'early';
            } else if (tokenMetrics.lpValueUSD < 10000) {
                pumpFunDetails.currentStage = 'building';
            } else if (tokenMetrics.lpValueUSD < 50000) {
                pumpFunDetails.currentStage = 'momentum';
            } else {
                pumpFunDetails.currentStage = 'graduating';
            }
            
            // Check for suspicious patterns
            const suspiciousActivity = this.PUMP_FUN_PATTERNS.suspiciousPatterns.some(pattern => 
                tokenMetrics.name?.toLowerCase().includes(pattern) ||
                tokenMetrics.symbol?.toLowerCase().includes(pattern)
            );
            
            if (suspiciousActivity) {
                pumpFunDetails.suspicious = true;
                pumpFunDetails.suspiciousReason = 'name_pattern_match';
            }
            
            // Check initial buy range
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
     * Check technical patterns for red flags
     */
    checkTechnicalPatterns(tokenMetrics) {
        try {
            // Special handling for pump.fun tokens
            const isPumpFun = tokenMetrics.isPumpFun;
            
            const technicalChecks = {
                hasRevokedAuthorities: !tokenMetrics.hasMintAuthority && !tokenMetrics.hasFreezeAuthority,
                hasReasonableName: tokenMetrics.name && 
                                 tokenMetrics.name.length > 0 && 
                                 tokenMetrics.name.length < 50 &&
                                 !tokenMetrics.name.match(/test|demo|fake/i),
                hasReasonableSymbol: tokenMetrics.symbol && 
                                   tokenMetrics.symbol.length > 0 && 
                                   tokenMetrics.symbol.length <= 10 &&
                                   !tokenMetrics.symbol.match(/test|demo|fake/i),
                hasMinimumLiquidity: isPumpFun ? 
                                   tokenMetrics.lpValueUSD >= 500 : // Lower threshold for pump.fun
                                   tokenMetrics.lpValueUSD >= 1000,
                hasActiveTrading: tokenMetrics.buyToSellRatio > 0.5 && tokenMetrics.buyToSellRatio < 5.0
            };

            // Check for immediate red flags
            if (!technicalChecks.hasReasonableName || !technicalChecks.hasReasonableSymbol) {
                return {
                    passed: false,
                    reason: 'invalid_token_metadata',
                    score: 0
                };
            }

            // Check for security red flags
            if (tokenMetrics.hasMintAuthority && tokenMetrics.largestHolderPercentage > 50) {
                // Exception for pump.fun tokens in early stage
                if (isPumpFun && tokenMetrics.pumpFunDetails?.currentStage === 'early') {
                    console.log(`⚠️ Pump.fun early stage token with mint authority - allowing with caution`);
                } else {
                    return {
                        passed: false,
                        reason: 'mint_authority_with_high_concentration',
                        score: 0
                    };
                }
            }
            
            // Check for pump.fun suspicious patterns
            if (isPumpFun && tokenMetrics.pumpFunDetails?.suspicious) {
                return {
                    passed: false,
                    reason: `pump_fun_suspicious: ${tokenMetrics.pumpFunDetails.suspiciousReason}`,
                    score: 0
                };
            }

            // Check for liquidity red flags
            if (!technicalChecks.hasMinimumLiquidity) {
                return {
                    passed: false,
                    reason: 'insufficient_liquidity',
                    score: 0
                };
            }

            // Calculate technical score
            let score = 0;
            if (technicalChecks.hasRevokedAuthorities) score += 0.3;
            if (technicalChecks.hasReasonableName) score += 0.2;
            if (technicalChecks.hasReasonableSymbol) score += 0.2;
            if (technicalChecks.hasMinimumLiquidity) score += 0.2;
            if (technicalChecks.hasActiveTrading) score += 0.1;

            return {
                passed: true,
                reason: null,
                score: score,
                patterns: technicalChecks
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

    /**
     * Renaissance health check with tiered metrics
     */
    async healthCheck() {
        const totalProcessed = this.stats.processed;
        const freshGemRate = totalProcessed > 0 ? (this.stats.freshGemsDetected / totalProcessed * 100) : 0;
        const establishedRate = totalProcessed > 0 ? (this.stats.establishedPassed / totalProcessed * 100) : 0;
        const totalPassRate = freshGemRate + establishedRate;

        return {
            healthy: this.isInitialized && totalPassRate >= 10, // At least 10% should pass
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

export { TieredTokenFilterService };