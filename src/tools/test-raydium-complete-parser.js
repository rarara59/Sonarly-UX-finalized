/**
 * Test the complete Raydium parser implementation
 */

import LiquidityPoolCreationDetectorService from '../services/liquidity-pool-creation-detector.service.js';

console.log('🧪 Testing Complete Raydium Parser Implementation\n');

// Create service instance
const detector = new LiquidityPoolCreationDetectorService();

// Mock RPC manager for testing
detector.rpcManager = {
  async makeRequest(endpoint, method, params, options) {
    // Mock successful token validation
    return {
      result: {
        value: {
          mint: params[0],
          supply: '1000000000',
          decimals: 9,
          mintAuthority: null,
          freezeAuthority: null
        }
      }
    };
  }
};

// Test all 10 discriminators
const testCases = [
  // LP CREATION DISCRIMINATORS (should be accepted)
  { hex: 'e7', name: 'initialize2', shouldPass: true, minAccounts: 19 },
  { hex: 'e8', name: 'initialize', shouldPass: true, minAccounts: 18 },
  { hex: 'e9', name: 'initialize3', shouldPass: true, minAccounts: 18 },
  { hex: 'ea', name: 'initializeV4', shouldPass: true, minAccounts: 20 },
  { hex: 'eb', name: 'initializeV5', shouldPass: true, minAccounts: 21 },
  { hex: 'f8', name: 'createPool', shouldPass: true, minAccounts: 16 },
  
  // NON-LP DISCRIMINATORS (should be rejected)
  { hex: '09', name: 'swap', shouldPass: false, minAccounts: 8 },
  { hex: 'cc', name: 'deposit', shouldPass: false, minAccounts: 10 },
  { hex: 'e3', name: 'withdraw', shouldPass: false, minAccounts: 10 },
  { hex: 'dd', name: 'route', shouldPass: false, minAccounts: 10 },
  
  // UNKNOWN DISCRIMINATOR (should use heuristics)
  { hex: 'ff', name: 'unknown', shouldPass: true, minAccounts: 18 }
];

// Mock account keys
const mockAccountKeys = [
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',  // 0: Token Program
  '11111111111111111111111111111111111111111112',  // 1: System Program
  'SysvarRent111111111111111111111111111111111',  // 2: Rent Sysvar
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',  // 3: Raydium AMM (or AMM ID)
  'AmmAuthority11111111111111111111111111111111',  // 4: AMM Authority
  'AmmOpenOrders111111111111111111111111111111',   // 5: AMM Open Orders
  'AmmLpMint11111111111111111111111111111111111',  // 6: AMM LP Mint
  'NewMemeToken111111111111111111111111111111',    // 7: Meme Token (coin)
  'So11111111111111111111111111111111111111112',  // 8: SOL (pc/quote)
  'AmmCoinVault111111111111111111111111111111',    // 9: AMM Coin Vault
  'AmmPcVault11111111111111111111111111111111',    // 10: AMM PC Vault
  'AmmTargetOrders111111111111111111111111111',    // 11: AMM Target Orders
  'SerumMarket11111111111111111111111111111111',   // 12: Serum Market
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',   // 13: Serum Program
  'SerumCoinVault11111111111111111111111111111',   // 14: Serum Coin Vault
  'SerumPcVault111111111111111111111111111111',    // 15: Serum PC Vault
  'SerumVaultSigner111111111111111111111111111',   // 16: Serum Vault Signer
  'UserWallet11111111111111111111111111111111',    // 17: User Wallet
  'ExtraAccount111111111111111111111111111111',    // 18: Extra Account
  'ExtraAccount211111111111111111111111111111',    // 19: Extra Account 2
  'ExtraAccount311111111111111111111111111111',    // 20: Extra Account 3
];

// Test each discriminator
console.log('Testing all discriminators:\n');

async function runTests() {
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing discriminator 0x${testCase.hex} (${testCase.name})`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Create mock instruction data
    const instructionData = Buffer.from([parseInt(testCase.hex, 16), 0, 0, 0, 0, 0, 0, 0]);
    
    // Create mock accounts array with correct number of accounts
    const accounts = Array.from({ length: testCase.minAccounts }, (_, i) => i);
    
    try {
      const result = await detector.analyzeRaydiumInstructionDebug(
        testCase.hex,
        instructionData,
        accounts,
        mockAccountKeys,
        0,
        {},
        'test-signature-' + testCase.hex
      );
      
      if (testCase.shouldPass && result) {
        console.log(`✅ SUCCESS: ${testCase.name} correctly accepted`);
        console.log(`   - Primary token: ${result.primaryToken || result.tokenMint}`);
        console.log(`   - Secondary token: ${result.secondaryToken}`);
        console.log(`   - Confidence: ${result.confidence}`);
      } else if (!testCase.shouldPass && !result) {
        console.log(`✅ SUCCESS: ${testCase.name} correctly rejected`);
      } else if (testCase.shouldPass && !result) {
        console.log(`❌ FAILURE: ${testCase.name} incorrectly rejected`);
      } else {
        console.log(`❌ FAILURE: ${testCase.name} incorrectly accepted`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testCase.name} threw error: ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing complete!');
  console.log(`${'='.repeat(60)}`);
  
  // Test performance metrics
  console.log('\n📊 Performance Metrics:');
  const metrics = detector.getRaydiumAnalysisMetrics();
  console.log('Discriminator Stats:', metrics.discriminatorStats);
  console.log('Performance Stats:', metrics.performanceStats);
  console.log('Unknown Discriminators:', metrics.unknownDiscriminators);
}

runTests().catch(console.error);