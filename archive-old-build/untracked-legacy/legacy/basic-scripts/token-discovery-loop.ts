// LEGACY: archived 2025-06-09 - replaced by enhanced-token-discovery-loop.ts with TieredTokenFilter and SmartMoneyValidatorService
// src/scripts/token-discovery-loop.ts
import { LPEventCache } from '../services/lp-event-cache.service';
import { LiquidityPoolCreationDetector } from '../services/liquidity-pool-creation-detector.service';
import { TokenPreFilterService } from '../services/token-pre-filter.service';
import TokenTrackingData from '../models/tokenTrackingData';
import rpcConnectionManager from '../services/rpc-connection-manager';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// BATCH PROCESSING IMPORTS
import { BatchTokenProcessor } from '../services/batch-token-processor.service';
import ComprehensiveEdgeCalculator from '../services/comprehensive-edge-calculator.service';

// Connect to MongoDB using env variable or fallback
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
} as any);

// INITIALIZE BATCH PROCESSOR
const batchProcessor = new BatchTokenProcessor(ComprehensiveEdgeCalculator);
batchProcessor.start();
console.log('🚀 Batch token processor started');

const processedTokens = new Set<string>();

/**
 * Fetch real token metadata from RPC/APIs
 * This replaces the hardcoded placeholder values
 */
async function fetchTokenMetadata(tokenAddress: string, lpEvent: any) {
  try {
    // Get token account info and supply
    const [accountInfo, tokenSupply, signatures] = await Promise.allSettled([
      rpcConnectionManager.getAccountInfo(tokenAddress),
      rpcConnectionManager.getTokenSupply(tokenAddress),
      rpcConnectionManager.getSignaturesForAddress(tokenAddress, 1000)
    ]);

    // Get token accounts to estimate holder count
    const tokenAccountsResult = await Promise.allSettled([
      rpcConnectionManager.call('getTokenLargestAccounts', [tokenAddress])
    ]);

    // Calculate metrics from available data
    const transactionCount = signatures.status === 'fulfilled' ? signatures.value.length : 0;
    const supply = tokenSupply.status === 'fulfilled' ? tokenSupply.value : null;
    const largestAccounts = tokenAccountsResult[0].status === 'fulfilled' ? tokenAccountsResult[0].value?.value || [] : [];
    
    // Estimate holder count (rough approximation)
    const estimatedHolders = Math.max(transactionCount * 0.1, largestAccounts.length * 2);
    
    // Calculate largest holder percentage
    let largestHolderPercentage = 0;
    if (supply && largestAccounts.length > 0) {
      const largestBalance = largestAccounts[0]?.amount || 0;
      const totalSupply = parseInt(supply.amount) || 1;
      largestHolderPercentage = (largestBalance / totalSupply) * 100;
    }

    // Get mint authority info (check if mint authority exists)
    let hasMintAuthority = false;
    let hasFreezeAuthority = false;
    
    if (accountInfo.status === 'fulfilled' && accountInfo.value?.data?.parsed?.info) {
      const mintInfo = accountInfo.value.data.parsed.info;
      hasMintAuthority = mintInfo.mintAuthority !== null;
      hasFreezeAuthority = mintInfo.freezeAuthority !== null;
    }

    // Estimate market cap and volume (placeholder - replace with real API calls)
    // You should integrate with Jupiter/Dexscreener APIs here for real data
    const estimatedPrice = lpEvent.lpValueUSD / 1000000; // Very rough estimation
    const totalSupplyTokens = supply ? parseInt(supply.amount) / Math.pow(10, supply.decimals || 6) : 1000000;
    const marketCap = estimatedPrice * totalSupplyTokens;
    
    // Volume estimation based on transaction activity (placeholder)
    const volume24h = transactionCount * 100; // Very rough estimation - replace with real data

    return {
      uniqueHolders: Math.floor(estimatedHolders),
      buyTransactions: Math.floor(transactionCount * 0.6), // Assume 60% are buys
      largestHolderPercentage: Math.min(largestHolderPercentage, 100),
      hasMintAuthority,
      hasFreezeAuthority,
      marketCap,
      volume24h,
      transactionCount
    };

  } catch (error) {
    logger.error(`Error fetching token metadata for ${tokenAddress}:`, error);
    // Return conservative defaults that will likely be filtered out
    return {
      uniqueHolders: 0,
      buyTransactions: 0,
      largestHolderPercentage: 100,
      hasMintAuthority: true,
      hasFreezeAuthority: true,
      marketCap: 0,
      volume24h: 0,
      transactionCount: 0
    };
  }
}

/**
 * Calculate token age in minutes
 */
function calculateTokenAge(firstSeenTimestamp: number): number {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return Math.floor((currentTimestamp - firstSeenTimestamp) / 60);
}

/**
 * Enhanced token discovery loop with batch processing
 */
setInterval(async () => {
  try {
    const candidates = LPEventCache.getAll();
    console.log(`🔍 Found ${candidates.length} LP candidates to evaluate`);

    if (candidates.length === 0) {
      return;
    }

    for (const lpEvent of candidates) {
      const tokenAddress = lpEvent.tokenAddress;
      
      if (processedTokens.has(tokenAddress)) {
        continue;
      }

      try {
        // Step 1: LP Creation Detection
        const lpEval = LiquidityPoolCreationDetector.evaluate(lpEvent);
        console.log(`🔎 LP Confidence Score for ${tokenAddress}: ${lpEval.confidence.toFixed(2)}`);
        
        if (!lpEval.passed) {
          console.log(`❌ Token ${tokenAddress} failed LP confidence test: ${lpEval.reason}`);
          processedTokens.add(tokenAddress);
          continue;
        }

        // Step 2: Fetch Real Token Metadata
        console.log(`📊 Fetching metadata for ${tokenAddress}...`);
        const tokenMetadata = await fetchTokenMetadata(tokenAddress, lpEvent);
        
        // Step 3: Calculate token age and priority
        const tokenAgeMinutes = calculateTokenAge(lpEvent.timestamp || Math.floor(Date.now() / 1000));
        const priority = tokenAgeMinutes <= 30 ? 'high' : 'normal'; // FAST vs SLOW track
        
        // Step 4: Estimate current price for batch processing
        const estimatedPrice = lpEvent.lpValueUSD > 0 ? lpEvent.lpValueUSD / 1000000 : 0.001;

        console.log(`📈 Token ${tokenAddress} metrics:`, {
          holders: tokenMetadata.uniqueHolders,
          transactions: tokenMetadata.buyTransactions,
          marketCap: `$${tokenMetadata.marketCap.toLocaleString()}`,
          volume: `$${tokenMetadata.volume24h.toLocaleString()}`,
          topHolderPercent: `${tokenMetadata.largestHolderPercentage.toFixed(1)}%`,
          age: `${tokenAgeMinutes} minutes`,
          priority: priority
        });

        // Step 5: Add to Batch Processing Queue (replaces Pre-Filter Evaluation)
        batchProcessor.addToken(
          tokenAddress,
          estimatedPrice,
          tokenAgeMinutes,
          priority,
          'discovery-loop'
        );

        console.log(`📥 Token added to batch queue: ${tokenAddress} | Priority: ${priority} | Age: ${tokenAgeMinutes}min`);

        // Step 6: Store preliminary token data (before comprehensive analysis)
        // This allows us to track discovered tokens even before they're fully processed
        try {
          const existingToken = await TokenTrackingData.findOne({ address: tokenAddress });
          
          if (!existingToken) {
            await TokenTrackingData.create({
              address: tokenAddress,
              name: lpEvent.tokenName || 'Unknown',
              symbol: lpEvent.tokenSymbol || '???',
              network: 'solana',
              price: estimatedPrice,
              liquidity: lpEvent.lpValueUSD,
              marketCap: tokenMetadata.marketCap,
              volume24h: tokenMetadata.volume24h,
              holderCount: tokenMetadata.uniqueHolders,
              manipulationScore: 0, // Will be calculated by comprehensive edge calculator
              smartMoneyActivity: {
                totalWallets: 0, // Will be updated by comprehensive analysis
                sniperWallets: 0,
                gemSpotterWallets: 0,
                earlyMoverWallets: 0,
                buyToSellRatio: 0,
                latestActivity: new Date(),
                is4xCandidate: false, // Will be determined by comprehensive analysis
                predictedSuccessRate: 0 // Will be updated by comprehensive analysis
              },
              patterns: {
                fast: { hasPattern: false, patternType: '', confidence: 0, detected: new Date() },
                slow: { hasPattern: false, patternType: '', confidence: 0, detected: new Date() }
              },
              hasAnyPattern: false,
              tags: ['discovered', 'pending-analysis'],
              metadata: {
                dex: lpEvent.dex,
                evaluationTime: 0, // Will be updated after batch processing
                confidenceScore: 0, // Will be updated after batch processing
                confidenceSources: [],
                lpDetectionConfidence: lpEval.confidence,
                transactionCount: tokenMetadata.transactionCount,
                mintAuthority: tokenMetadata.hasMintAuthority,
                freezeAuthority: tokenMetadata.hasFreezeAuthority,
                batchProcessingStatus: 'queued',
                queuedAt: new Date()
              },
              firstSeen: new Date(),
              lastUpdated: new Date()
            });

            logger.info(`Token ${tokenAddress} added to tracking database (pending comprehensive analysis)`);
          } else {
            logger.info(`Token ${tokenAddress} already exists in database, skipping duplicate entry`);
          }
        } catch (dbError) {
          logger.error(`Database error for token ${tokenAddress}:`, dbError);
        }

        processedTokens.add(tokenAddress);

      } catch (err) {
        console.error(`💥 Error processing token ${tokenAddress}:`, err);
        processedTokens.add(tokenAddress); // Still mark as processed to avoid infinite retries
      }

      // Add small delay between processing tokens to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Completed processing ${candidates.length} LP candidates (${candidates.length} added to batch queue)`);
    
  } catch (error) {
    console.error('💥 Error in token discovery loop:', error);
  }
}, 15000); // Run every 15 seconds

// BATCH PROCESSING MONITORING
setInterval(() => {
  const stats = batchProcessor.getStats();
  const queueStatus = batchProcessor.getQueueStatus();
  
  if (queueStatus.queueSize > 0 || queueStatus.activeProcessing > 0) {
    console.log(`📊 Batch Status: ${stats.totalProcessed} processed, ${queueStatus.queueSize} queued, ${queueStatus.activeProcessing}/${queueStatus.maxConcurrency} active`);
    
    if (stats.totalProcessed > 0) {
      const successRate = (stats.totalSuccessful / stats.totalProcessed * 100).toFixed(1);
      console.log(`   📈 Performance: ${successRate}% success rate, ${stats.averageProcessingTimeMs.toFixed(0)}ms avg time`);
    }
    
    if (queueStatus.priorityBreakdown.high > 0) {
      console.log(`   ⚡ High Priority Queue: ${queueStatus.priorityBreakdown.high} FAST track tokens`);
    }
  }
}, 15000); // Every 15 seconds

// Cleanup old processed tokens periodically (prevent memory leaks)
setInterval(() => {
  if (processedTokens.size > 10000) {
    console.log('🧹 Cleaning up processed tokens cache...');
    processedTokens.clear();
  }
}, 300000); // Every 5 minutes

// Health monitoring for batch processor
setInterval(() => {
  const isHealthy = batchProcessor.isHealthy();
  if (!isHealthy) {
    console.warn('🚨 Batch processor health check failed! Check logs for details.');
  }
}, 60000); // Every minute

console.log('🚀 Token Discovery Loop started with Batch Processing - monitoring for new LP events...');
console.log('📊 Batch Processing Features:');
console.log('   - High Priority: FAST track tokens (≤30 min age)');
console.log('   - Normal Priority: SLOW track tokens (>30 min age)'); 
console.log('   - Concurrent Processing: Up to 5 tokens simultaneously');
console.log('   - Auto-retry: Failed tokens retry up to 2 times');
console.log('   - Performance Monitoring: Real-time stats and health checks');
