// test-live-detection.js
import { LiquidityPoolCreationDetectorService } from './liquidity-pool-creation-detector.service.js';
import { SolanaPoolParserService } from './solana-pool-parser.service.js';

async function testLiveDetection() {
  console.log('🧪 TEST 5: Live Detection (30 seconds)');
  
  try {
    // Import RPC manager
    const RPCConnectionManager = (await import('../core/rpc-connection-manager/index.js')).default;
    const rpcManager = new RPCConnectionManager();
    
    // Create minimal pool parser
    const poolParser = new SolanaPoolParserService({ 
      rpcManager,
      ready: () => Promise.resolve() // Mock ready method
    });
    
    // Create detector with live scanning
    const detector = new LiquidityPoolCreationDetectorService({
      solanaPoolParser: poolParser,
      rpcManager: rpcManager,
      lpScannerConfig: { 
        enabled: true, 
        source: 'polling',
        intervalMs: 10000 // 10 second intervals
      }
    });
    
    // Set up event listeners
    let candidatesFound = 0;
    detector.on('lpDetected', (candidate) => {
      candidatesFound++;
      console.log(`🎯 CANDIDATE ${candidatesFound}:`, {
        dex: candidate.dex,
        token: candidate.tokenMint?.slice(0, 8) + '...',
        confidence: candidate.confidence,
        type: candidate.type
      });
    });
    
    detector.on('candidateDetected', (candidate) => {
      console.log('🔍 Raw candidate detected:', candidate.dex);
    });
    
    // Initialize and run for 30 seconds
    console.log('🚀 Initializing detector...');
    await detector.initialize();
    
    console.log('📡 Scanning for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log(`📊 TEST COMPLETE: ${candidatesFound} candidates found in 30 seconds`);
    
    // Shutdown
    await detector.shutdown();
    
    return candidatesFound >= 0; // Success if no crashes
    
  } catch (error) {
    console.error('❌ Live detection test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testLiveDetection();