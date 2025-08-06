// test-binary-parsing.js
import { LiquidityPoolCreationDetectorService } from './liquidity-pool-creation-detector.service.js';

async function testBinaryParsing() {
  console.log('🧪 TEST 3: Binary Instruction Analysis');
  
  const detector = new LiquidityPoolCreationDetectorService({
    lpScannerConfig: { enabled: false }
  });
  
  // Mock instruction data (Raydium initialize2 discriminator)
  const testInstructionData = Buffer.from([0xe7, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
  const testAccounts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const testAccountKeys = [
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token program
    '11111111111111111111111111111111111111111112', // System program  
    'SysvarRent111111111111111111111111111111111', // Rent sysvar
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Temp
    'AmM1LP1pool1address1here1111111111111111111', // AMM pool
    'AmM1authority1here11111111111111111111111111', // AMM authority
    'open1orders1here1111111111111111111111111111', // Open orders
    'LP1mint1here111111111111111111111111111111111', // LP mint
    'meme1token1mint1here1111111111111111111111111', // Coin mint (meme token)
    'So11111111111111111111111111111111111111112', // PC mint (SOL)
    ...Array(9).fill('filler1account1111111111111111111111111111')
  ];
  
  // Test program ID validation
  const programValidation = detector.validateProgramId('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
  console.log('✅ Raydium program validation:', programValidation);
  
  // Test LP creation indicators
  const indicators = detector.analyzeLPCreationIndicators(
    testInstructionData, 
    testAccounts, 
    testAccountKeys, 
    '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
  );
  console.log('🎯 LP creation indicators:', indicators);
  
  return indicators.likelyLPCreation;
}

testBinaryParsing();