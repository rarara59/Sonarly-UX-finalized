console.log(`🚀 PROCESS_START: ${new Date().toISOString()} - Node process began`);

const start = Date.now();
require('dotenv').config();
console.log(`⏱️ dotenv config: ${Date.now() - start}ms`);

console.log(`🕐 ${new Date().toISOString()} - Script start (post-dotenv)`);

// Simple test - just get to the basic imports working
try {
  const { LiquidityPoolCreationDetector } = require('../services/liquidity-pool-creation-detector.service');
  console.log('✅ LiquidityPoolCreationDetector imported successfully');
} catch (err) {
  console.error('❌ LiquidityPoolCreationDetector failed:', err.message);
}

console.log('🚀 Basic JavaScript version running successfully');