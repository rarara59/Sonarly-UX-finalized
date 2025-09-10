// minimal-discovery-fixed.ts - With versioned transaction support
import { Connection, PublicKey } from '@solana/web3.js';

console.log('🚀 Fixed Minimal LP Discovery Starting...');

// Simple in-memory cache
const lpCache = new Map<string, any>();

// Fixed LP Detector Class
class FixedMinimalLPDetector {
  private connection: Connection;
  private isMonitoring = false;

  constructor() {
    this.connection = new Connection('https://mainnet.helius-rpc.com');
    console.log('🔍 Fixed Minimal LP Detector initialized');
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    console.log('🚀 Starting fixed minimal LP detection...');
    this.monitoringLoop();
  }

  private async monitoringLoop(): Promise<void> {
    while (this.isMonitoring) {
      try {
        await this.detectRecentLPs();
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
      } catch (error) {
        console.error('❌ LP detection error:', error);
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30s on error
      }
    }
  }

  private async detectRecentLPs(): Promise<void> {
    try {
      console.log('🔍 [FIXED] Scanning for recent Raydium transactions...');
      
      const raydiumProgramId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
      
      const signatures = await this.connection.getSignaturesForAddress(
        raydiumProgramId,
        { limit: 3 }
      );
      
      console.log(`🔍 [FIXED] Found ${signatures.length} recent Raydium transactions`);
      
      for (const sig of signatures.slice(0, 2)) {
        console.log(`🔍 [FIXED] Analyzing transaction: ${sig.signature.slice(0, 8)}`);
        await this.analyzeTransaction(sig.signature);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
    } catch (error) {
      console.error('❌ [FIXED] Error detecting LPs:', error);
    }
  }

  private async analyzeTransaction(signature: string): Promise<void> {
    console.log(`🔍 [FIXED] Analyzing transaction: ${signature.slice(0, 8)}`);
    
    try {
      // 🚨 THE FIX: Add maxSupportedTransactionVersion parameter
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });
      
      if (!tx || !tx.meta) {
        console.log(`❌ [FIXED] No transaction data for ${signature.slice(0, 8)}`);
        return;
      }

      const preTokenBalances = tx.meta.preTokenBalances || [];
      const postTokenBalances = tx.meta.postTokenBalances || [];
      
      console.log(`💰 [FIXED] Transaction ${signature.slice(0, 8)} - Pre: ${preTokenBalances.length}, Post: ${postTokenBalances.length}`);

      // Look for new token accounts
      const newTokens = postTokenBalances.filter(balance =>
        !preTokenBalances.find(pre => pre.accountIndex === balance.accountIndex)
      );
      
      console.log(`🆕 [FIXED] Found ${newTokens.length} new token accounts`);
      
      if (newTokens.length > 0) {
        for (const token of newTokens) {
          if (token.mint && (token?.uiTokenAmount?.uiAmount || 0) > 0) {
            console.log(`🎯 [FIXED] Potential LP: ${token.mint} (amount: ${token.uiTokenAmount?.uiAmount})`);
            
            // Store in simple cache
            const lpEvent = {
              tokenAddress: token.mint,
              lpValueUSD: 5000, // Placeholder
              timestamp: Math.floor(Date.now() / 1000),
              dex: 'Raydium',
              txHash: signature
            };
            
            lpCache.set(token.mint, lpEvent);
            console.log(`✅ [FIXED] Stored LP in cache: ${token.mint}`);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ [FIXED] Error analyzing ${signature}:`, error.message);
    }
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛑 [FIXED] LP detection stopped');
  }
}

// Start the fixed system
async function main() {
  console.log('🚀 [FIXED] Starting fixed minimal discovery system...');
  
  const detector = new FixedMinimalLPDetector();
  await detector.startMonitoring();
  
  // Simple discovery loop
  setInterval(() => {
    const candidatesCount = lpCache.size;
    console.log(`🔍 [FIXED] Processing ${candidatesCount} LP candidates`);
    
    if (candidatesCount > 0) {
      console.log('📋 [FIXED] LP Candidates:');
      for (const [tokenAddress, lpEvent] of lpCache.entries()) {
        const ageMinutes = (Date.now() / 1000 - lpEvent.timestamp) / 60;
        console.log(`   - ${tokenAddress.slice(0, 8)}: age=${ageMinutes.toFixed(1)}min, lpValue=$${lpEvent.lpValueUSD}`);
      }
      
      // Clear old entries (older than 15 minutes)
      for (const [tokenAddress, lpEvent] of lpCache.entries()) {
        const ageMinutes = (Date.now() / 1000 - lpEvent.timestamp) / 60;
        if (ageMinutes > 15) {
          lpCache.delete(tokenAddress);
          console.log(`🧹 [FIXED] Removed old LP: ${tokenAddress.slice(0, 8)}`);
        }
      }
    } else {
      console.log('❌ [FIXED] No LP candidates found yet...');
    }
  }, 120000); // Every 2 minutes

  console.log('✅ [FIXED] Fixed minimal discovery system started!');
  console.log('📊 [FIXED] Now properly parsing versioned transactions!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 [FIXED] Shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ [FIXED] Main error:', error);
  process.exit(1);
});