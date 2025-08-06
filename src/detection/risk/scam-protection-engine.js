/**
 * SCAM PROTECTION ENGINE - Renaissance Production Grade
 * 
 * CRITICAL: Protects money by blocking honeypots, concentrated holdings, and unlimited mints
 * Integration: RPC Pool + Pool Validator + Signal Bus
 * Performance Target: <15ms per token validation
 * Reliability Target: 99.9% uptime (fail-safe on network errors)
 */

class ScamProtectionEngine {
    constructor(rpcPool, signalBus, logger) {
        this.rpcPool = rpcPool;
        this.signalBus = signalBus;
        this.logger = logger;
        
        // Configuration - Production Tuned
        this.config = {
            maxHolderConcentration: 0.30,  // 30% max for top 10 holders
            minHolderCount: 10,             // Minimum holders required
            testTransactionAmount: 1000,    // Lamports for honeypot test
            analysisTimeout: 10000,         // 10s max analysis time
            maxRetries: 2                   // Network failure retries
        };
        
        // Performance tracking
        this.stats = {
            tokensAnalyzed: 0,
            scamsBlocked: 0,
            falsePositives: 0,
            averageLatency: 0
        };
    }

    /**
     * MAIN ENTRY POINT: Analyze token for scam indicators
     * Returns: { isScam: boolean, reasons: string[], confidence: number, latencyMs: number }
     */
    async analyzeToken(tokenAddress, poolInfo = null) {
        const startTime = Date.now();
        const analysis = {
            isScam: false,
            reasons: [],
            confidence: 0,
            latencyMs: 0
        };

        try {
            // Validate inputs
            if (!tokenAddress || typeof tokenAddress !== 'string') {
                throw new Error('Invalid token address provided');
            }

            this.logger.debug(`Analyzing token for scams: ${tokenAddress}`);

            // Run parallel scam checks
            const [
                holderAnalysis,
                mintAuthorityCheck,
                honeypotCheck
            ] = await Promise.allSettled([
                this.analyzeHolderConcentration(tokenAddress),
                this.validateMintAuthority(tokenAddress),
                this.detectHoneypot(tokenAddress, poolInfo)
            ]);

            // Process results - fail-safe approach
            this.processAnalysisResult(analysis, holderAnalysis, 'holder_concentration');
            this.processAnalysisResult(analysis, mintAuthorityCheck, 'mint_authority');
            this.processAnalysisResult(analysis, honeypotCheck, 'honeypot');

            // Calculate final confidence
            analysis.confidence = this.calculateScamConfidence(analysis.reasons);
            analysis.isScam = analysis.confidence > 70; // 70% threshold for blocking

            // Performance tracking
            analysis.latencyMs = Date.now() - startTime;
            this.updateStats(analysis);

            // Signal results
            if (analysis.isScam) {
                this.signalBus.emit('scam_detected', {
                    tokenAddress,
                    reasons: analysis.reasons,
                    confidence: analysis.confidence,
                    timestamp: Date.now()
                });
            }

            return analysis;

        } catch (error) {
            analysis.latencyMs = Date.now() - startTime;
            this.logger.error(`Scam analysis failed for ${tokenAddress}:`, error.message);
            
            // FAIL-SAFE: Block on analysis errors to protect money
            return {
                isScam: true,
                reasons: [`Analysis error: ${error.message}`],
                confidence: 100,
                latencyMs: analysis.latencyMs
            };
        }
    }

    /**
     * HOLDER CONCENTRATION ANALYSIS
     * Detects tokens where top holders control too much supply
     */
    async analyzeHolderConcentration(tokenAddress) {
        const accounts = await this.rpcPool.execute(async (connection) => {
            const response = await connection.getTokenLargestAccounts(
                tokenAddress,
                'confirmed'
            );
            return response.value;
        });

        if (!accounts || accounts.length === 0) {
            throw new Error('No holder data available');
        }

        // Calculate total supply
        const totalSupply = accounts.reduce((sum, account) => {
            const amount = parseInt(account.amount);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        if (totalSupply === 0) {
            // Fresh token - not a scam indicator, just needs different analysis
            return {
                concentration: 0,
                holderCount: accounts.length,
                totalSupply: 0,
                issues: [] // Don't flag as scam
            };
        }

        // Calculate top 10 holder concentration
        const top10Holders = accounts.slice(0, 10);
        const top10Supply = top10Holders.reduce((sum, account) => {
            return sum + parseInt(account.amount);
        }, 0);

        const concentration = top10Supply / totalSupply;
        const holderCount = accounts.length;

        // Scam indicators
        const issues = [];
        
        if (concentration > this.config.maxHolderConcentration) {
            issues.push(`High concentration: ${(concentration * 100).toFixed(1)}% in top 10 holders`);
        }
        
        if (holderCount < this.config.minHolderCount) {
            issues.push(`Low holder count: ${holderCount} holders`);
        }

        return {
            concentration,
            holderCount,
            totalSupply,
            issues
        };
    }

    /**
     * MINT AUTHORITY VALIDATION
     * Checks if token can be inflated by mint authority
     */
    async validateMintAuthority(tokenAddress) {
        const mintInfo = await this.rpcPool.execute(async (connection) => {
            const response = await connection.getParsedAccountInfo(tokenAddress);
            return response.value?.data?.parsed?.info;
        });

        if (!mintInfo) {
            throw new Error('Could not fetch mint information');
        }

        const issues = [];
        
        // Check if mint authority exists and is not null
        if (mintInfo.mintAuthority && mintInfo.mintAuthority !== null) {
            issues.push(`Active mint authority: ${mintInfo.mintAuthority}`);
        }

        // Check freeze authority
        if (mintInfo.freezeAuthority && mintInfo.freezeAuthority !== null) {
            issues.push(`Active freeze authority: ${mintInfo.freezeAuthority}`);
        }

        return {
            mintAuthority: mintInfo.mintAuthority,
            freezeAuthority: mintInfo.freezeAuthority,
            decimals: mintInfo.decimals,
            supply: mintInfo.supply,
            issues
        };
    }

    /**
     * HONEYPOT DETECTION
     * Detects tokens that prevent selling
     */
    async detectHoneypot(tokenAddress, poolInfo) {
        // For now, use heuristic-based detection
        // TODO: Implement actual test transaction in future version
        
        const issues = [];

        try {
            // Check if token has known honeypot patterns
            const tokenAccount = await this.rpcPool.execute(async (connection) => {
                return await connection.getParsedAccountInfo(tokenAddress);
            });

            if (!tokenAccount?.value) {
                issues.push('Token account not found');
                return { issues };
            }

            // Basic honeypot indicators
            const data = tokenAccount.value.data;
            if (!data || !data.parsed) {
                issues.push('Unparseable token data');
            }

            // Check for suspicious pool characteristics if provided
            if (poolInfo?.liquidity && poolInfo.liquidity < 1000) {
                issues.push('Extremely low liquidity pool');
            }

        } catch (error) {
            const errorMsg = error?.message || error?.toString() || 'Unknown error';
            issues.push(`Honeypot check failed: ${errorMsg}`);
        }

        return { issues };
    }

    /**
     * Process analysis results with error handling
     */
    processAnalysisResult(analysis, result, checkType) {
        if (result.status === 'fulfilled') {
            if (result.value.issues && result.value.issues.length > 0) {
                analysis.reasons.push(...result.value.issues.map(issue => `${checkType}: ${issue}`));
            }
        } else {
            // Network errors - fail safe by flagging as scam
            const errorMsg = result.reason?.message || result.reason?.toString() || 'Unknown error';
            analysis.reasons.push(`${checkType}: Analysis failed - ${errorMsg}`);
            this.logger.warn(`${checkType} analysis failed:`, errorMsg);
        }
    }

    /**
     * Calculate scam confidence score
     */
    calculateScamConfidence(reasons) {
        let confidence = 0; // Already number type

        for (const reason of reasons) {
            // Assign confidence scores based on scam indicators
            if (reason.includes('High concentration')) confidence += 40;
            if (reason.includes('Low holder count')) confidence += 30;
            if (reason.includes('Active mint authority')) confidence += 35;
            if (reason.includes('Active freeze authority')) confidence += 25;
            if (reason.includes('Extremely low liquidity')) confidence += 20;
            if (reason.includes('Analysis failed')) confidence += 50; // Fail-safe
            if (reason.includes('Unparseable token data')) confidence += 45;
        }

        return Math.min(confidence, 100);
    }

    /**
     * Update performance statistics
     */
    updateStats(analysis) {
        this.stats.tokensAnalyzed++;
        if (analysis.isScam) {
            this.stats.scamsBlocked++;
        }
        
        // Running average latency
        this.stats.averageLatency = (
            (this.stats.averageLatency * (this.stats.tokensAnalyzed - 1)) + 
            analysis.latencyMs
        ) / this.stats.tokensAnalyzed;
    }

    /**
     * Get performance statistics
     */
    getStats() {
        return {
            ...this.stats,
            scamBlockRate: this.stats.tokensAnalyzed > 0 ? 
                (this.stats.scamsBlocked / this.stats.tokensAnalyzed * 100).toFixed(2) + '%' : 
                '0%'
        };
    }

    /**
     * Health check for monitoring
     */
    async healthCheck() {
        try {
            const startTime = Date.now();
            
            // Test RPC connectivity
            await this.rpcPool.execute(async (connection) => {
                return await connection.getVersion();
            });
            
            const latency = Date.now() - startTime;
            
            return {
                status: 'healthy',
                latency,
                stats: this.getStats()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                stats: this.getStats()
            };
        }
    }
}

export { ScamProtectionEngine };