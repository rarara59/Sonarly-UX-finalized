// test-detector-init.js
import { LiquidityPoolCreationDetectorService } from './liquidity-pool-creation-detector.service.js';

async function testBasicInit() {
  console.log('🧪 TEST 1: Basic Detector Initialization');
  
  try {
    const detector = new LiquidityPoolCreationDetectorService({
      accuracyThreshold: 0.85,
      lpScannerConfig: { enabled: false } // Disable scanning for unit test
    });
    
    console.log('✅ Detector created successfully');
    console.log('📊 Options:', detector.options);
    console.log('🎯 Discriminators loaded:', Object.keys(detector.INSTRUCTION_DISCRIMINATORS).length);
    
    return true;
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    return false;
  }
}

testBasicInit();