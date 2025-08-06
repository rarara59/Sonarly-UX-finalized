// test-known-transaction.js
import { LiquidityPoolCreationDetectorService } from './liquidity-pool-creation-detector.service.js';

async function testKnownTransaction() {
  console.log('🧪 TEST 6: Known Raydium LP Creation');
  
  // Known Raydium LP creation signature (replace with real one)
  const knownRaydiumSignature = '5KnownRaydiumLPCreationTransactionSignatureHere123456789';
  
  try {
    const RPCConnectionManager = (await import('../core/rpc-connection-manager/index.js')).default;
    const rpcManager = new RPCConnectionManager();
    
    const detector = new LiquidityPoolCreationDetectorService({
      rpcManager: rpcManager,
      lpScannerConfig: { enabled: false }
    });
    
    await detector.initialize();
    
    console.log(`🔍 Analyzing known LP creation: ${knownRaydiumSignature.slice(0, 8)}...`);
    
    const candidates = await detector.detectFromTransaction(knownRaydiumSignature);
    
    console.log(`📊 Analysis result: ${candidates.length} candidates detected`);
    
    if (candidates.length > 0) {
      candidates.forEach((candidate, i) => {
        console.log(`🎯 Candidate ${i + 1}:`, {
          dex: candidate.dex,
          confidence: candidate.confidence,
          tokenMint: candidate.tokenMint?.slice(0, 8) + '...',
          type: candidate.type
        });
      });
    }
    
    return candidates.length > 0;
    
  } catch (error) {
    console.error('❌ Known transaction test failed:', error.message);
    return false;
  }
}

testKnownTransaction();