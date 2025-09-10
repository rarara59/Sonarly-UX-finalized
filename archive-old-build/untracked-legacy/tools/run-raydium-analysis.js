/**
 * RAYDIUM ANALYSIS RUNNER
 * Executes complete transaction capture and analysis
 */

import RaydiumTransactionAnalyzer from './raydium-transaction-analyzer.js';
import { Connection } from '@solana/web3.js';

// Mock RPC manager for standalone execution
class MockRPCManager {
  constructor() {
    this.connection = new Connection('https://mainnet.helius-rpc.com/?api-key=17ee86cb-f234-493b-94a3-fb5d93f08874');
  }
  
  getCurrentConnection() {
    return this.connection;
  }
}

async function runAnalysis() {
  console.log('🔬 Starting Raydium Transaction Analysis');
  console.log('⏱️ This will take 30-60 minutes to complete');
  
  try {
    const rpcManager = new MockRPCManager();
    const analyzer = new RaydiumTransactionAnalyzer(rpcManager);
    
    const results = await analyzer.runCompleteAnalysis();
    
    console.log('\n✅ ANALYSIS COMPLETE!');
    console.log('📁 Check ./analysis-output/ for detailed results');
    
    return results;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalysis();
}

export { runAnalysis };