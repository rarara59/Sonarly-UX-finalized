/**
 * Test Raydium transaction routing
 */

import LiquidityPoolCreationDetectorService from '../services/liquidity-pool-creation-detector.service.js';

console.log('🧪 Testing Raydium Transaction Routing\n');

// Create service instance
const detector = new LiquidityPoolCreationDetectorService({
  lpScannerConfig: {
    enableRaydiumDetection: true,
    enablePumpFunDetection: true,
    enableOrcaDetection: true
  }
});

// Mock RPC manager
detector.rpcManager = {
  async call(method, params, options) {
    console.log(`🔍 RPC Call: ${method}`);
    
    if (method === 'getSignaturesForAddress') {
      // Return a test Raydium signature
      return [
        { signature: 'test_raydium_tx_123', blockTime: Date.now() / 1000 }
      ];
    }
    
    if (method === 'getTransaction') {
      // Return a mock Raydium transaction
      return {
        transaction: {
          message: {
            accountKeys: [
              'ComputeBudget111111111111111111111111111111',
              '11111111111111111111111111111111111111111112',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium at index 3
              'AmmId111111111111111111111111111111111111111',
              'AmmAuthority11111111111111111111111111111111',
              'AmmOpenOrders111111111111111111111111111111',
              'AmmLpMint11111111111111111111111111111111111',
              'NewMemeToken111111111111111111111111111111',
              'So11111111111111111111111111111111111111112'
            ],
            instructions: [
              // ComputeBudget instruction
              {
                programIdIndex: 0,
                accounts: [],
                data: Buffer.from([0x00]).toString('base64')
              },
              // System instruction
              {
                programIdIndex: 1,
                accounts: [],
                data: Buffer.from([0x02]).toString('base64')
              },
              // Token instruction
              {
                programIdIndex: 2,
                accounts: [],
                data: Buffer.from([0x01]).toString('base64')
              },
              // Raydium instruction (should be routed)
              {
                programIdIndex: 3, // Points to Raydium
                accounts: [4, 5, 6, 7, 8, 9],
                data: Buffer.from([0xe8, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]).toString('base64')
              }
            ]
          }
        }
      };
    }
    
    return null;
  }
};

// Add a mock Raydium analyzer to see if it gets called
let raydiumAnalyzerCalled = false;
const originalAnalyzer = detector.analyzeRaydiumInstructionDebug;
detector.analyzeRaydiumInstructionDebug = function(...args) {
  console.log('✅ RAYDIUM ANALYZER CALLED!');
  raydiumAnalyzerCalled = true;
  return originalAnalyzer.apply(this, args);
};

console.log('Testing transaction routing...\n');

try {
  // Process the test transaction
  const result = await detector.processTransactionWithRouting(
    { signature: 'test_raydium_tx_123' },
    0
  );
  
  console.log('\n📊 TEST RESULTS:');
  console.log(`  Raydium analyzer called: ${raydiumAnalyzerCalled ? '✅ YES' : '❌ NO'}`);
  console.log(`  Routing result:`, result ? `✅ ${result.dex}` : '❌ null');
  
  if (!raydiumAnalyzerCalled) {
    console.log('\n🚨 PROBLEM: Raydium transaction not routed to analyzer!');
    console.log('The routing logic may be stopping at earlier instructions.');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error);
}

process.exit(0);