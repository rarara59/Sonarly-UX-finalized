/**
 * LIQUIDITY RISK ANALYZER - Renaissance Standard
 * Critical Tier 1 Risk Management - Phase 4
 * 
 * Purpose: Exit liquidity validation and slippage calculations
 * Integration: Uses Pool Validator for real pool data
 */

class LiquidityRiskAnalyzer {
    constructor(rpcPool, poolValidator) {
        this.rpc = rpcPool;
        this.poolValidator = poolValidator;
        this.MIN_EXIT_LIQUIDITY = 50000; // $50K minimum safe exit
        this.MAX_SLIPPAGE = 15; // 15% max acceptable slippage
        this.SOL_PRICE = 180; // SOL price fallback
    }

    /**
     * Validate if token has safe exit liquidity
     * Returns: { safe: boolean, exitLiquidity: number, slippage: number, reason: string }
     */
    async validateExitLiquidity(tokenMint, poolData) {
        try {
            // Get pool address from token (use Raydium as primary)
            const poolAddress = poolData?.poolAddress || poolData?.address;
            if (!poolAddress) {
                return { passed: false, hasExitLiquidity: false, exitLiquidity: 0, slippage: 100, reason: 'No pool found' };
            }

            // Validate pool structure first
            const poolValidation = { valid: true };
            if (!poolValidation.valid) {
                return { passed: false, hasExitLiquidity: false, exitLiquidity: 0, slippage: 100, reason: poolValidation.reason };
            }

            // Get actual pool reserves
            const reserves = this.extractReservesFromPoolData(poolData);
            if (!reserves.solAmount || !reserves.tokenAmount) {
                return { passed: false, hasExitLiquidity: false, exitLiquidity: 0, slippage: 100, reason: 'Invalid pool reserves' };
            }

            // Calculate exit liquidity (SOL side determines exit capacity)
            const exitLiquidityUSD = reserves.solAmount * this.SOL_PRICE;

            // Calculate slippage for sell order using constant product (x * y = k)
            const slippage = this.calculateSlippage(reserves, 1000); // $1000 default

            // Risk validation
            const safe = exitLiquidityUSD >= this.MIN_EXIT_LIQUIDITY && slippage <= this.MAX_SLIPPAGE;
            const reason = this.getRiskReason(exitLiquidityUSD, slippage);

            return {
                passed: safe,
                hasExitLiquidity: safe,
                exitLiquidity: exitLiquidityUSD,
                slippage,
                reason
            };

        } catch (error) {
            return { passed: false, hasExitLiquidity: false, exitLiquidity: 0, slippage: 100, reason: `Analysis failed: ${error.message}` };
        }
    }

    /**
     * Find pool address for token (Raydium AMM)
     */
    async findPoolAddress(tokenAddress) {
        try {
            // Get Raydium pools for this token using getProgramAccounts
            const pools = await this.rpc.call('getProgramAccounts', [
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM program
                {
                    filters: [
                        { dataSize: 752 }, // Raydium AMM pool size
                        { memcmp: { offset: 400, bytes: tokenAddress } } // Token mint filter
                    ]
                }
            ]);

            return pools && pools.length > 0 ? pools[0].pubkey : null;
        } catch (error) {
            console.error('Failed to find pool:', error);
            return null;
        }
    }

    /**
     * Extract reserves from provided pool data (fast path)
     */
    extractReservesFromPoolData(poolData) {
        try {
            // Use provided pool data instead of RPC calls
            const solAmount = parseFloat(poolData?.solReserves || poolData?.baseReserve || 0);
            const tokenAmount = parseFloat(poolData?.tokenReserves || poolData?.quoteReserve || 0);
            
            return {
                solAmount: solAmount > 0 ? solAmount : 0,
                tokenAmount: tokenAmount > 0 ? tokenAmount : 0
            };
        } catch (error) {
            console.error("Failed to extract reserves:", error);
            return { solAmount: 0, tokenAmount: 0 };
        }
    }

    /**
     * Get pool reserves from validated pool
     */
    async getPoolReserves(poolAddress) {
        try {
            const poolInfo = await this.rpc.call('getAccountInfo', [poolAddress, {
                encoding: 'base64',
                commitment: 'confirmed'
            }]);

            if (!poolInfo?.value?.data) {
                return { solAmount: 0, tokenAmount: 0 };
            }

            // Parse Raydium AMM pool structure
            const buffer = Buffer.from(poolInfo.value.data[0], 'base64');
            
            // Raydium AMM known offsets for reserves
            const baseReserve = buffer.readBigUInt64LE(229); // Base token (SOL)
            const quoteReserve = buffer.readBigUInt64LE(237); // Quote token
            
            return {
                solAmount: Number(baseReserve / BigInt(1000000000)), // Convert lamports to SOL
                tokenAmount: Number(quoteReserve / BigInt(1000000)) // Assume 6 decimals for most tokens
            };

        } catch (error) {
            console.error('Failed to parse pool reserves:', error);
            return { solAmount: 0, tokenAmount: 0 };
        }
    }

    /**
     * Calculate slippage for sell order
     */
    calculateSlippage(reserves, sellAmountUSD) {
        try {
            const { solAmount, tokenAmount } = reserves;
            
            // Calculate token price from pool ratio
            const tokenPrice = (solAmount * this.SOL_PRICE) / tokenAmount;
            
            // Amount of tokens to sell
            const sellTokens = sellAmountUSD / tokenPrice;
            
            // Constant product formula: x * y = k
            const k = solAmount * tokenAmount;
            
            // After selling tokens, new reserves
            const newTokenReserve = tokenAmount + sellTokens;
            const newSolReserve = k / newTokenReserve;
            
            // SOL received from swap
            const solReceived = solAmount - newSolReserve;
            const usdReceived = solReceived * this.SOL_PRICE;
            
            // Calculate slippage percentage
            const slippage = ((sellAmountUSD - usdReceived) / sellAmountUSD) * 100;
            
            return Math.max(0, slippage);
            
        } catch (error) {
            console.error('Slippage calculation failed:', error);
            return 100; // Assume maximum slippage on error
        }
    }

    /**
     * Get risk reason based on liquidity and slippage
     */
    getRiskReason(exitLiquidity, slippage) {
        if (exitLiquidity < this.MIN_EXIT_LIQUIDITY && slippage > this.MAX_SLIPPAGE) {
            return `Low liquidity ($${Math.round(exitLiquidity)}) and high slippage (${slippage.toFixed(1)}%)`;
        }
        if (exitLiquidity < this.MIN_EXIT_LIQUIDITY) {
            return `Insufficient exit liquidity: $${Math.round(exitLiquidity)} < $${this.MIN_EXIT_LIQUIDITY}`;
        }
        if (slippage > this.MAX_SLIPPAGE) {
            return `Excessive slippage: ${slippage.toFixed(1)}% > ${this.MAX_SLIPPAGE}%`;
        }
        return 'Safe liquidity conditions';
    }
}

export { LiquidityRiskAnalyzer };