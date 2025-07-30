// src/services/real-lp-detector.service.ts
import { LPEventCache, CachedLPEvent } from './lp-event-cache.service';
import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';

export class RealLPDetector {
    private connection: Connection;
    private isMonitoring = false;
    private transactionCount = 0;
    private lpDetectionCount = 0;

    constructor() {
        // Don't create connection during import - defer until needed
        logger.info('🔍 RealLPDetector initialized (connection deferred)');
    }

    private getConnection(): Connection {
        if (!this.connection) {
            this.connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`);
        }
        return this.connection;
    }

    async startMonitoring(): Promise<void> {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        logger.info('🚀 Starting LP detection monitoring...');
        // Start monitoring loop
        this.monitoringLoop();
    }

    private async monitoringLoop(): Promise<void> {
        while (this.isMonitoring) {
            try {
                await this.detectRecentLPs();
                await new Promise(resolve => setTimeout(resolve, 60000)); // Check every minute
            } catch (error) {
                logger.error('LP detection error:', error);
                await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s on error
            }
        }
    }

    private async detectRecentLPs(): Promise<void> {
        try {
            // Simple detection: Get recent transactions from Raydium program
            const raydiumProgramId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
            
            logger.info('🔍 [DEBUG] About to fetch signatures from Raydium program...');
            const signatures = await this.getConnection().getSignaturesForAddress(
                raydiumProgramId,
                { limit: 2 }
            );
            
            logger.info(`🔍 [DEBUG] Found ${signatures.length} recent Raydium transactions`);
            
            // For each transaction, check if it's a pool creation
            for (const sig of signatures.slice(0, 2)) { // Limit to 2 to avoid rate limits
                this.transactionCount++;
                logger.info(`🔍 [DEBUG] Processing transaction ${this.transactionCount}: ${sig.signature.slice(0, 8)}`);
                await this.analyzeTransaction(sig.signature);
                await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
            }
            
            logger.info(`🔍 [DEBUG] Monitoring cycle complete. Total TXs processed: ${this.transactionCount}, LPs detected: ${this.lpDetectionCount}`);
        } catch (error) {
            logger.error('Error detecting LPs:', error);
        }
    }

    private async analyzeTransaction(signature: string): Promise<void> {
        logger.info(`🔍 [DEBUG] Starting analysis of transaction: ${signature.slice(0, 8)}`);
        
        try {
            const tx = await this.getConnection().getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0
              });
            logger.info(`📦 [DEBUG] Transaction fetch result: ${tx ? "success" : "null"}, meta: ${tx?.meta ? "present" : "missing"}`);
            
            if (!tx || !tx.meta) {
                logger.info(`❌ [DEBUG] Skipping transaction ${signature.slice(0, 8)} - no transaction data or meta`);
                return;
            }

            // DEBUG: Log token balance data
            const preTokenBalances = tx.meta.preTokenBalances || [];
            const postTokenBalances = tx.meta.postTokenBalances || [];
            
            logger.info(`💰 [DEBUG] Transaction ${signature.slice(0, 8)} - Pre-token balances: ${preTokenBalances.length}, Post-token balances: ${postTokenBalances.length}`);

            // Look for new token accounts (indication of LP creation)
            const raydiumProgramId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
            const lpInstructions = tx.transaction.message.instructions.filter(instruction => 
                instruction.programId.equals(raydiumProgramId)
            );
            
            const newTokens: any[] = [];

            if (lpInstructions.length > 0) {
                // Look for real token mints in post-token balances
                for (const postBalance of postTokenBalances) {
                    // Skip SOL (native Solana token)
                    if (postBalance.mint && postBalance.mint !== "So11111111111111111111111111111111111111112") {
                        // Check if this is a new token account or just process any non-SOL token
                        newTokens.push({
                            mint: postBalance.mint,  // REAL token address!
                            uiTokenAmount: postBalance.uiTokenAmount || { uiAmount: 1000, decimals: 9 }
                        });
                        
                        logger.info(`🎯 [DEBUG] Found real token in transaction: ${postBalance.mint}`);
                        break; // Just take the first real token for now
                    }
                }
                
                // If no tokens found in balances, this might not be an LP creation
                if (newTokens.length === 0) {
                    logger.info(`⚠️ [DEBUG] Raydium transaction but no new tokens found`);
                }
            }

            logger.info(`🆕 [DEBUG] Transaction ${signature.slice(0, 8)} - Found ${newTokens.length} new token accounts`);
            
            if (newTokens.length > 0) {
                logger.info(`🎯 [DEBUG] Transaction ${signature.slice(0, 8)} - Processing ${newTokens.length} new tokens...`);
                
                // Found potential LP creation
                for (const token of newTokens) {
                    logger.info(`🔍 [DEBUG] Analyzing token: mint=${token.mint}, uiAmount=${token?.uiTokenAmount?.uiAmount}, decimals=${token?.uiTokenAmount?.decimals}`);
                    
                    if (token.mint && (token?.uiTokenAmount?.uiAmount || 0) > 0) {
                        this.lpDetectionCount++;
                        
                        const lpEvent: CachedLPEvent = {
                            tokenAddress: token.mint,
                            lpValueUSD: 5000, // Placeholder - would calculate from actual data
                            quoteToken: 'SOL',
                            timestamp: Math.floor(Date.now() / 1000),
                            deployer: 'unknown',
                            hasInitialBuys: false,
                            dex: 'Raydium',
                            txHash: signature
                        };
                        
                        logger.info(`🎯 [DEBUG] Found potential LP creation: ${token.mint} - About to call LPEventCache.store()`);
                        logger.info(`📝 [DEBUG] LP Event data: ${JSON.stringify(lpEvent, null, 2)}`);
                        
                        // CRITICAL DEBUG POINT: This is where we call the cache
                        try {
                            LPEventCache.store(lpEvent);
                            logger.info(`✅ [DEBUG] Successfully called LPEventCache.store() for token: ${token.mint}`);
                        } catch (cacheError) {
                            logger.error(`❌ [DEBUG] Error calling LPEventCache.store() for token: ${token.mint}`, cacheError);
                        }
                    } else {
                        logger.info(`❌ [DEBUG] Token ${token.mint} skipped - mint missing or uiAmount <= 0`);
                    }
                }
            } else {
                logger.info(`📝 [DEBUG] Transaction ${signature.slice(0, 8)} - No new token accounts found`);
            }
        } catch (error) {
            logger.error(`❌ [DEBUG] Error analyzing transaction ${signature}:`, (error as Error).message);
        }
    }

    stopMonitoring(): void {
        this.isMonitoring = false;
        logger.info(`🛑 LP detection monitoring stopped. Final stats - TXs processed: ${this.transactionCount}, LPs detected: ${this.lpDetectionCount}`);
    }
}