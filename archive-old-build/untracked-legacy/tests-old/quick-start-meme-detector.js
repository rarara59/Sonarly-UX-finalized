// quick-start-meme-detector.js (60 lines)
import { LiquidityPoolCreationDetectorService } from './liquidity-pool-creation-detector.service.js';
import { SolanaPoolParserService } from './solana-pool-parser.service.js';
import RPCConnectionManager from '../core/rpc-connection-manager/index.js';

// SIMPLE STARTUP - Just detect meme coins
async function startMemeDetection() {
  // Initialize your existing services
  const rpcManager = new RPCConnectionManager();
  const poolParser = new SolanaPoolParserService({ rpcManager });
  
  // YOUR RENAISSANCE DETECTOR (already built!)
  const detector = new LiquidityPoolCreationDetectorService({
    solanaPoolParser: poolParser,
    rpcManager: rpcManager,
    lpScannerConfig: { enabled: true, source: 'polling' }
  });
  
  // Initialize and start
  await detector.initialize();
  
  // Listen for meme coins
  detector.on('lpDetected', (candidate) => {
    console.log('🚨 MEME COIN DETECTED:', {
      token: candidate.tokenMint,
      dex: candidate.dex,
      confidence: candidate.confidence
    });
  });
  
  console.log('🚀 Meme detection active!');
}

startMemeDetection().catch(console.error);