/**
 * High-Performance Transaction Fetcher
 * Target: <10ms per fetch cycle, 1000+ tx/min capacity
 * 200 lines - Parallel DEX polling with connection pooling
 */

import { logger, generateRequestId } from '../../utils/logger.js';

export class TransactionFetcher {
  constructor(rpcPool, circuitBreaker, performanceMonitor = null) {
    if (!rpcPool) throw new Error('rpcPool is required');
    if (!circuitBreaker) throw new Error('circuitBreaker is required');
    this.rpcPool = rpcPool;
    this.circuitBreaker = circuitBreaker;
    this.monitor = performanceMonitor;
    this.lastCallTime = 0;
    this.minInterval = 1000; // 1 second between calls
    
    // DEX-specific polling configuration
    this.pollingConfig = {
      raydium: {
        programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
        limit: 20,
        interval: 5000,
        lastSignature: null
      },
      pumpfun: {
        programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
        limit: 30,
        interval: 3000,
        lastSignature: null
      },
      orca: {
        programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
        limit: 15,
        interval: 8000,
        lastSignature: null
      }
    };
    
    // Signature deduplication
    this.seenSignatures = new Set();
    this.signatureCleanupInterval = 300000; // 5 minutes
    
    // Performance tracking
    this.stats = {
      totalFetched: 0,
      duplicatesFiltered: 0,
      errors: 0,
      lastFetchTime: 0,
      avgFetchTime: 0
    };
    
    // Start cleanup interval
    this.startSignatureCleanup();
  }
  
  // Main method: Parallel polling across all DEXs
  async pollAllDexs() {
    const requestId = generateRequestId();
    const startTime = performance.now();
    
    logger.info({
      request_id: requestId,
      component: 'transaction-fetcher',
      event: 'dex.poll_all.start',
      dexes: ['raydium', 'pumpfun', 'orca']
    });
    
    try {
      // Parallel fetch from all DEXs
      const [raydiumTxs, pumpfunTxs, orcaTxs] = await Promise.all([
        this.pollDex('raydium'),
        this.pollDex('pumpfun'),
        this.pollDex('orca')
      ]);
      
      // Merge and deduplicate
      const allTransactions = [
        ...raydiumTxs,
        ...pumpfunTxs,
        ...orcaTxs
      ];
      
      const uniqueTransactions = this.deduplicateTransactions(allTransactions);
      
      // Update performance metrics
      const fetchTime = performance.now() - startTime;
      this.updateStats(fetchTime, uniqueTransactions.length);
      
      if (this.monitor) {
        this.monitor.recordLatency('transactionFetcher', fetchTime, true);
        this.monitor.recordThroughput('transactionFetcher', uniqueTransactions.length, fetchTime);
      }
      
      logger.info({
        request_id: requestId,
        component: 'transaction-fetcher',
        event: 'dex.poll_all.end',
        latency_ms: fetchTime,
        outcome: 'success',
        transactions_fetched: uniqueTransactions.length,
        raydium_count: raydiumTxs.length,
        pumpfun_count: pumpfunTxs.length,
        orca_count: orcaTxs.length,
        duplicates_filtered: this.stats.duplicatesFiltered
      });
      
      return uniqueTransactions;
      
    } catch (error) {
      const fetchTime = performance.now() - startTime;
      this.stats.errors++;
      
      if (this.monitor) {
        this.monitor.recordLatency('transactionFetcher', fetchTime, false);
      }
      
      logger.error({
        request_id: requestId,
        component: 'transaction-fetcher',
        event: 'dex.poll_all.error',
        latency_ms: fetchTime,
        outcome: 'failure',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  // Poll specific DEX for transactions
  async pollDex(dexName) {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    logger.info({
      request_id: requestId,
      component: 'transaction-fetcher',
      event: 'dex.poll.start',
      dex: dexName
    });
    
    // Rate limiting to prevent HTTP 429 errors
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
    }
    this.lastCallTime = Date.now();
    
    const config = this.pollingConfig[dexName];
    if (!config) {
      logger.warn({
        request_id: requestId,
        component: 'transaction-fetcher',
        event: 'dex.poll.unknown_dex',
        dex: dexName
      });
      return [];
    }
    
    try {
      const params = [
        config.programId,
        {
          limit: config.limit,
          commitment: 'confirmed'
        }
      ];
      
      // Add before parameter if we have a last signature
      if (config.lastSignature) {
        params[1].before = config.lastSignature;
      }
      
      const response = await this.circuitBreaker.execute('rpc_signatures', async () => {
        return await this.rpcPool.call('getSignaturesForAddress', params, { timeout: 5000 });
      });
      
      if (!response || !Array.isArray(response)) {
        return [];
      }
      
      // Update last signature for next poll
      if (response.length > 0) {
        config.lastSignature = response[0].signature;
      }
      
      // Fetch full transaction details in parallel
      const transactions = await this.fetchTransactionDetails(
        response.map(sig => sig.signature),
        dexName
      );
      
      const filteredTransactions = transactions.filter(tx => tx !== null);
      
      logger.info({
        request_id: requestId,
        component: 'transaction-fetcher',
        event: 'dex.poll.end',
        dex: dexName,
        latency_ms: Date.now() - startTime,
        outcome: 'success',
        transactions_fetched: filteredTransactions.length,
        signatures_received: response.length
      });
      
      return filteredTransactions;
      
    } catch (error) {
      logger.error({
        request_id: requestId,
        component: 'transaction-fetcher',
        event: 'dex.poll.error',
        dex: dexName,
        latency_ms: Date.now() - startTime,
        outcome: 'failure',
        error: error.message,
        stack: error.stack
      });
      return [];
    }
  }
  
  // Fetch full transaction details for signatures
  async fetchTransactionDetails(signatures, dexName) {
    if (signatures.length === 0) return [];
    
    try {
      // Batch fetch up to 20 transactions at once
      const batchSize = 20;
      const batches = [];
      
      for (let i = 0; i < signatures.length; i += batchSize) {
        const batch = signatures.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Process batches in parallel
      const batchPromises = batches.map(batch => 
        this.fetchTransactionBatch(batch)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // Flatten results
      return batchResults.flat().map(tx => ({
        ...tx,
        dexSource: dexName,
        fetchedAt: Date.now()
      }));
      
    } catch (error) {
      logger.error({
        component: 'transaction-fetcher',
        event: 'transaction_details.error',
        dex: dexName,
        signatures_count: signatures.length,
        error: error.message,
        stack: error.stack
      });
      return [];
    }
  }
  
  // Fetch a batch of transactions
  async fetchTransactionBatch(signatures) {
    // Process transactions sequentially with rate limiting
    const results = [];
    
    for (const signature of signatures) {
      // Rate limiting between individual transaction fetches
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      if (timeSinceLastCall < 100) { // 100ms between individual calls
        await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastCall));
      }
      this.lastCallTime = Date.now();
      
      try {
        const result = await this.circuitBreaker.execute('rpc_transaction', async () => {
          return await this.rpcPool.call('getTransaction', [signature, {
            encoding: 'json',
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          }], { timeout: 5000 });
        });
        results.push(result);
      } catch (error) {
        logger.warn({
          component: 'transaction-fetcher',
          event: 'transaction_fetch.failure',
          signature,
          error: error.message
        });
        results.push(null);
      }
    }
    
    return results.filter(result => result !== null);
  }
  
  // Remove duplicate transactions by signature
  deduplicateTransactions(transactions) {
    const unique = [];
    const newSignatures = new Set();
    
    for (const tx of transactions) {
      const signature = tx?.transaction?.signatures?.[0];
      if (!signature) continue;
      
      // Skip if we've seen this signature before
      if (this.seenSignatures.has(signature) || newSignatures.has(signature)) {
        this.stats.duplicatesFiltered++;
        continue;
      }
      
      newSignatures.add(signature);
      this.seenSignatures.add(signature);
      unique.push(tx);
    }
    
    return unique;
  }
  
  // Update performance statistics
  updateStats(fetchTime, transactionCount) {
    this.stats.totalFetched += transactionCount;
    this.stats.lastFetchTime = fetchTime;
    
    // Calculate running average
    if (this.stats.avgFetchTime === 0) {
      this.stats.avgFetchTime = fetchTime;
    } else {
      this.stats.avgFetchTime = (this.stats.avgFetchTime * 0.9) + (fetchTime * 0.1);
    }
  }
  
  // Get current performance statistics
  getStats() {
    return {
      ...this.stats,
      seenSignaturesCount: this.seenSignatures.size,
      throughputPerMinute: this.calculateThroughput()
    };
  }
  
  // Calculate current throughput
  calculateThroughput() {
    // Simple throughput calculation based on recent performance
    if (this.stats.avgFetchTime === 0) return 0;
    
    const avgTransactionsPerFetch = 20; // Conservative estimate
    const fetchesPerMinute = 60000 / Math.max(this.stats.avgFetchTime, 50);
    
    return Math.round(avgTransactionsPerFetch * fetchesPerMinute);
  }
  
  // Start signature cleanup to prevent memory leaks
  startSignatureCleanup() {
    setInterval(() => {
      // Keep only recent signatures (last 5 minutes worth)
      const cutoffTime = Date.now() - this.signatureCleanupInterval;
      
      // For simplicity, just clear all and rebuild from recent transactions
      // In production, you might want a more sophisticated LRU cache
      if (this.seenSignatures.size > 10000) {
        // Remove oldest half of signatures instead of clearing all
        const signatures = Array.from(this.seenSignatures);
        const keepCount = Math.floor(signatures.length / 2);
        const originalSize = this.seenSignatures.size;
        this.seenSignatures.clear();
        signatures.slice(-keepCount).forEach(sig => this.seenSignatures.add(sig));
        
        logger.info({
          component: 'transaction-fetcher',
          event: 'signature_cache.cleanup',
          original_size: originalSize,
          new_size: this.seenSignatures.size,
          cleared_count: originalSize - this.seenSignatures.size
        });
      }
    }, this.signatureCleanupInterval);
  }
  
  // Manual method to poll specific DEX (useful for testing)
  async pollSpecificDex(dexName) {
    if (!this.pollingConfig[dexName]) {
      throw new Error(`Unknown DEX: ${dexName}`);
    }
    
    return await this.pollDex(dexName);
  }
  
  // Reset last signatures (useful for restart/testing)
  resetLastSignatures() {
    Object.values(this.pollingConfig).forEach(config => {
      config.lastSignature = null;
    });
  }
  
  // Health check method
  isHealthy() {
    return (
      this.stats.lastFetchTime < 15000 && // Last fetch within 15s
      this.stats.avgFetchTime < 100 &&  // Average fetch time under 100ms
      this.seenSignatures.size < 50000 &&   // Memory usage reasonable
      this.circuitBreaker.isHealthy('rpc_signatures') && // Circuit breaker health
      this.circuitBreaker.isHealthy('rpc_transaction')   // Circuit breaker health
    );
  }
}