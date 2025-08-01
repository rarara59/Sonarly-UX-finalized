import { EventEmitter } from 'events';

/**
 * Debug version of TieredTokenFilterService with enhanced logging
 * to diagnose getMintInfo returning null for all token addresses
 */
class TieredTokenFilterServiceDebug extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Same configuration as original
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
        
        this.rpcManager = config.rpcManager || null;
        this.isInitialized = false;
        this.metadataCache = new Map();
        this.debugMode = true; // Enable debug mode
        this.rpcCallLog = []; // Log all RPC calls
    }

    async initialize() {
        if (!this.rpcManager) {
            throw new Error('RPC Manager required for Renaissance token analysis');
        }
        
        this.isInitialized = true;
        console.log('💎 DEBUG: Renaissance Tiered Token Filter initialized');
        
        // Test RPC connectivity with known addresses
        await this.testRpcConnectivity();
        
        return true;
    }

    /**
     * Test RPC connectivity with known token addresses
     */
    async testRpcConnectivity() {
        console.log('\n🔍 DEBUG: Testing RPC connectivity...\n');
        
        const testAddresses = {
            'Wrapped SOL': 'So11111111111111111111111111111111111111112',
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
        };
        
        for (const [name, address] of Object.entries(testAddresses)) {
            console.log(`Testing ${name} (${address}):`);
            
            try {
                // Test different RPC methods
                console.log('  1. Testing getAccountInfo...');
                const accountInfo = await this.debugRpcCall('getAccountInfo', [
                    address,
                    { encoding: 'jsonParsed' }
                ]);
                console.log(`     ✅ Account exists: ${accountInfo?.value !== null}`);
                
                console.log('  2. Testing getTokenSupply...');
                const tokenSupply = await this.debugRpcCall('getTokenSupply', [address]);
                console.log(`     ✅ Supply: ${tokenSupply?.value?.uiAmount || 'N/A'}`);
                
                console.log('  3. Testing getTokenLargestAccounts...');
                const largestAccounts = await this.debugRpcCall('getTokenLargestAccounts', [address]);
                console.log(`     ✅ Holders: ${largestAccounts?.value?.length || 0}`);
                
            } catch (error) {
                console.error(`  ❌ Error testing ${name}: ${error.message}`);
            }
            
            console.log('');
        }
    }

    /**
     * Debug wrapper for RPC calls
     */
    async debugRpcCall(method, params) {
        const callId = Date.now();
        const callInfo = {
            id: callId,
            method,
            params,
            timestamp: new Date().toISOString()
        };
        
        console.log(`\n🌐 DEBUG RPC CALL #${callId}:`);
        console.log(`  Method: ${method}`);
        console.log(`  Params:`, JSON.stringify(params, null, 2));
        
        try {
            const startTime = performance.now();
            const result = await this.rpcManager.call(method, params);
            const duration = performance.now() - startTime;
            
            callInfo.duration = duration;
            callInfo.success = true;
            callInfo.result = result;
            
            console.log(`  ✅ Success in ${duration.toFixed(2)}ms`);
            console.log(`  📦 Result:`, JSON.stringify(result, null, 2));
            
            this.rpcCallLog.push(callInfo);
            return result;
            
        } catch (error) {
            callInfo.success = false;
            callInfo.error = error.message;
            
            console.error(`  ❌ Error: ${error.message}`);
            console.error(`  Stack:`, error.stack);
            
            this.rpcCallLog.push(callInfo);
            throw error;
        }
    }

    /**
     * Enhanced fetchTokenMetadata with detailed debugging
     */
    async fetchTokenMetadata(tokenMint) {
        console.log(`\n📋 DEBUG: fetchTokenMetadata called for: ${tokenMint}`);
        
        try {
            // Validate token mint
            if (!tokenMint) {
                console.warn('  ⚠️ Token mint is undefined');
                return null;
            }
            
            if (!this.isValidSolanaAddress(tokenMint)) {
                console.warn(`  ⚠️ Invalid token mint address: ${tokenMint}`);
                return null;
            }
            
            console.log(`  ✅ Address validation passed`);
            
            // Method 1: Try getAccountInfo with parsed encoding
            console.log(`\n  🔍 Method 1: Trying getAccountInfo (jsonParsed)...`);
            const accountInfo = await this.debugRpcCall('getAccountInfo', [
                tokenMint,
                { encoding: 'jsonParsed' }
            ]);
            
            if (accountInfo && accountInfo.value) {
                console.log(`  ✅ Account info received`);
                console.log(`  📦 Account owner: ${accountInfo.value.owner}`);
                console.log(`  📦 Data type: ${accountInfo.value.data?.type || 'unknown'}`);
                
                if (accountInfo.value.data?.parsed?.info) {
                    const info = accountInfo.value.data.parsed.info;
                    console.log(`  ✅ Parsed mint data available`);
                    return {
                        address: tokenMint,
                        name: `Token ${tokenMint.substring(0, 6)}`,
                        symbol: tokenMint.substring(0, 4).toUpperCase(),
                        decimals: info.decimals || 9,
                        supply: info.supply,
                        mintAuthority: info.mintAuthority,
                        freezeAuthority: info.freezeAuthority,
                        isInitialized: info.isInitialized
                    };
                }
            }
            
            // Method 2: Try getTokenSupply as fallback
            console.log(`\n  🔍 Method 2: Trying getTokenSupply...`);
            try {
                const supplyInfo = await this.debugRpcCall('getTokenSupply', [tokenMint]);
                
                if (supplyInfo && supplyInfo.value) {
                    console.log(`  ✅ Token supply retrieved`);
                    return {
                        address: tokenMint,
                        name: `Token ${tokenMint.substring(0, 6)}`,
                        symbol: tokenMint.substring(0, 4).toUpperCase(),
                        decimals: supplyInfo.value.decimals || 9,
                        supply: supplyInfo.value.amount,
                        mintAuthority: null,
                        freezeAuthority: null,
                        isInitialized: true
                    };
                }
            } catch (supplyError) {
                console.log(`  ⚠️ getTokenSupply failed: ${supplyError.message}`);
            }
            
            // Method 3: Try base64 encoding
            console.log(`\n  🔍 Method 3: Trying getAccountInfo (base64)...`);
            try {
                const base64Info = await this.debugRpcCall('getAccountInfo', [
                    tokenMint,
                    { encoding: 'base64' }
                ]);
                
                if (base64Info && base64Info.value) {
                    console.log(`  ✅ Base64 account info received`);
                    console.log(`  📦 Data length: ${base64Info.value.data[0]?.length || 0} chars`);
                    
                    // Check if it's a valid SPL token by owner
                    const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
                    if (base64Info.value.owner === TOKEN_PROGRAM_ID) {
                        console.log(`  ✅ Confirmed as SPL Token`);
                        return {
                            address: tokenMint,
                            name: `Token ${tokenMint.substring(0, 6)}`,
                            symbol: tokenMint.substring(0, 4).toUpperCase(),
                            decimals: 9,
                            supply: null,
                            mintAuthority: null,
                            freezeAuthority: null,
                            isInitialized: true
                        };
                    }
                }
            } catch (base64Error) {
                console.log(`  ⚠️ Base64 getAccountInfo failed: ${base64Error.message}`);
            }
            
            console.log(`  ❌ All methods failed to retrieve token metadata`);
            return null;
            
        } catch (error) {
            console.error(`❌ fetchTokenMetadata failed: ${error.message}`);
            console.error('Stack:', error.stack);
            return null;
        }
    }

    /**
     * Process token with enhanced debugging
     */
    async processToken(tokenCandidate) {
        if (!this.isInitialized) await this.initialize();
        
        const startTime = performance.now();
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎯 DEBUG: Processing new token candidate`);
        console.log(`${'='.repeat(80)}`);
        console.log(`📦 Candidate data:`, JSON.stringify(tokenCandidate, null, 2));
        
        try {
            // Validate candidate
            if (!tokenCandidate) {
                console.warn('⚠️ Token candidate is undefined or null');
                return this.rejectToken('invalid_token_candidate', startTime);
            }

            // Extract token address
            const tokenAddress = this.extractTokenMint(tokenCandidate);
            console.log(`\n📍 Extracted token address: ${tokenAddress}`);
            
            if (!tokenAddress) {
                console.warn('⚠️ Token address is undefined or missing');
                return this.rejectToken('missing_token_address', startTime);
            }

            // Validate address format
            if (!this.isValidSolanaAddress(tokenAddress)) {
                console.warn(`⚠️ Invalid token address format: ${tokenAddress}`);
                return this.rejectToken('invalid_token_address_format', startTime);
            }

            // Get token metadata
            const metadata = await this.fetchTokenMetadata(tokenAddress);
            
            if (!metadata) {
                console.warn('⚠️ Failed to fetch token metadata');
                return this.rejectToken('metadata_fetch_failed', startTime);
            }

            console.log(`\n✅ Token metadata retrieved successfully`);
            console.log(`  Name: ${metadata.name}`);
            console.log(`  Symbol: ${metadata.symbol}`);
            console.log(`  Decimals: ${metadata.decimals}`);
            console.log(`  Mint Authority: ${metadata.mintAuthority || 'null (revoked)'}`);
            console.log(`  Freeze Authority: ${metadata.freezeAuthority || 'null (revoked)'}`);

            // Return simplified result for debugging
            const processingTime = performance.now() - startTime;
            return {
                approved: true,
                tokenAddress,
                metadata,
                processingTimeMs: processingTime,
                rpcCalls: this.rpcCallLog.length
            };

        } catch (error) {
            console.error(`\n❌ Processing error: ${error.message}`);
            console.error('Stack:', error.stack);
            return this.rejectToken(`processing_error: ${error.message}`, startTime);
        }
    }

    rejectToken(reason, startTime = null) {
        const processingTime = startTime ? performance.now() - startTime : 0;
        
        console.log(`\n❌ Token rejected: ${reason}`);
        
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
        
        // Basic Solana address validation
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        return base58Regex.test(address);
    }

    extractTokenMint(tokenCandidate) {
        if (!tokenCandidate) {
            return null;
        }
        
        // Try multiple possible fields
        const possibleFields = [
            'tokenMint',
            'baseMint',
            'tokenAddress',
            'mint',
            'address',
            'token',
            'baseToken'
        ];
        
        for (const field of possibleFields) {
            if (tokenCandidate[field] && this.isValidSolanaAddress(tokenCandidate[field])) {
                console.log(`  ✅ Found token address in field: ${field}`);
                return tokenCandidate[field];
            }
        }
        
        console.log(`  ⚠️ No valid token address found in any field`);
        return null;
    }

    /**
     * Get debug summary
     */
    getDebugSummary() {
        const successfulCalls = this.rpcCallLog.filter(call => call.success).length;
        const failedCalls = this.rpcCallLog.filter(call => !call.success).length;
        const avgDuration = this.rpcCallLog
            .filter(call => call.duration)
            .reduce((sum, call) => sum + call.duration, 0) / (successfulCalls || 1);
        
        return {
            totalRpcCalls: this.rpcCallLog.length,
            successfulCalls,
            failedCalls,
            avgDuration: avgDuration.toFixed(2) + 'ms',
            callHistory: this.rpcCallLog
        };
    }
}

export { TieredTokenFilterServiceDebug };