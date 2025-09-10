/**
 * Test the Raydium transaction pipeline debug implementation
 */

import LiquidityPoolCreationDetectorService from '../services/liquidity-pool-creation-detector.service.js';

console.log('🧪 Testing Raydium Transaction Pipeline Debug\n');

// Create service instance with mock dependencies
const detector = new LiquidityPoolCreationDetectorService({
  lpScannerConfig: {
    enableRaydiumDetection: true,
    enablePumpFunDetection: true,
    enableOrcaDetection: true
  }
});

// Mock RPC manager for testing
detector.rpcManager = {
  async call(method, params, options) {
    console.log(`🔍 RPC Call: ${method} with params:`, params[0]?.slice(0,8) + '...');
    
    // Mock getSignaturesForAddress responses
    if (method === 'getSignaturesForAddress') {
      const programId = params[0];
      
      if (programId === '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8') {
        // Raydium signatures
        return [
          { signature: 'raydium_sig_1_' + Date.now(), blockTime: Date.now() / 1000 },
          { signature: 'raydium_sig_2_' + Date.now(), blockTime: Date.now() / 1000 - 10 },
          { signature: 'raydium_sig_3_' + Date.now(), blockTime: Date.now() / 1000 - 20 }
        ];
      } else if (programId === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P') {
        // PumpFun signatures
        return [
          { signature: 'pumpfun_sig_1_' + Date.now(), blockTime: Date.now() / 1000 },
          { signature: 'pumpfun_sig_2_' + Date.now(), blockTime: Date.now() / 1000 - 5 }
        ];
      } else if (programId === 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc') {
        // Orca signatures
        return [
          { signature: 'orca_sig_1_' + Date.now(), blockTime: Date.now() / 1000 }
        ];
      }
    }
    
    // Mock getTransaction responses
    if (method === 'getTransaction') {
      const signature = params[0];
      
      if (signature.startsWith('raydium_sig')) {
        return {
          transaction: {
            message: {
              accountKeys: [
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '11111111111111111111111111111111111111111112',
                'SysvarRent111111111111111111111111111111111',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium program
                'AmmId111111111111111111111111111111111111111',
                'AmmAuthority11111111111111111111111111111111',
                'AmmOpenOrders111111111111111111111111111111',
                'AmmLpMint11111111111111111111111111111111111',
                'NewMemeToken111111111111111111111111111111',
                'So11111111111111111111111111111111111111112'
              ],
              instructions: [
                {
                  programIdIndex: 3, // Points to Raydium
                  accounts: [0, 1, 2, 4, 5, 6, 7, 8, 9],
                  data: Buffer.from([0xe9, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]).toString('base64')
                }
              ]
            }
          }
        };
      } else if (signature.startsWith('pumpfun_sig')) {
        return {
          transaction: {
            message: {
              accountKeys: [
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P', // PumpFun program
                'So11111111111111111111111111111111111111112'
              ],
              instructions: [
                {
                  programIdIndex: 1, // Points to PumpFun
                  accounts: [0, 2],
                  data: Buffer.from([0x18, 0x1e, 0xc8, 0x28]).toString('base64')
                }
              ]
            }
          }
        };
      }
      
      return null;
    }
    
    // Mock other RPC calls
    return {
      result: {
        value: {
          mint: params[0],
          supply: '1000000000',
          decimals: 9
        }
      }
    };
  }
};

console.log('Starting pipeline debug test...\n');

// Run the pipeline debug
try {
  const candidates = await detector.scanForNewLPs();
  
  console.log('\n📊 TEST RESULTS:');
  console.log(`Total candidates generated: ${candidates.length}`);
  
  if (candidates.length > 0) {
    console.log('\nCandidate details:');
    candidates.forEach((candidate, i) => {
      console.log(`  ${i + 1}. ${candidate.dex} - ${candidate.primaryToken || candidate.tokenAddress}`);
    });
  }
  
  console.log('\n✅ Pipeline debug test completed successfully!');
} catch (error) {
  console.error('\n❌ Pipeline debug test failed:', error);
  console.error(error.stack);
}