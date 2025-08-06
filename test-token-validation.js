// test-token-validation.js
import { LiquidityPoolCreationDetectorService } from './liquidity-pool-creation-detector.service.js';

async function testTokenValidation() {
  console.log('🧪 TEST 2: Token Validation Logic');
  
  const detector = new LiquidityPoolCreationDetectorService({
    lpScannerConfig: { enabled: false }
  });
  
  // Test instant validation (known tokens)
  const solResult = detector.performInstantValidation('So11111111111111111111111111111111111111112', {});
  console.log('✅ SOL validation:', solResult);
  
  const usdcResult = detector.performInstantValidation('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', {});
  console.log('✅ USDC validation:', usdcResult);
  
  // Test invalid format
  const invalidResult = detector.performInstantValidation('invalid-address', {});
  console.log('❌ Invalid address (expected):', invalidResult);
  
  return true;
}

testTokenValidation();