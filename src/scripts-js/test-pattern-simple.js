#!/usr/bin/env node
// src/scripts-js/test-pattern-simple.js
// Simple test for pattern recognition service (ES modules)

const startTime = process.hrtime.bigint();

console.log('🔄 Testing Pattern Recognition Service...');

try {
  // Import the service
  const { PatternRecognitionService, PatternType, PatternStatus, TimeframeType } = await import('./pattern-recognition-fixed.js');
  
  const importTime = process.hrtime.bigint();
  const importMs = Number(importTime - startTime) / 1000000;
  
  console.log(`✅ Import completed in ${importMs.toFixed(2)}ms`);
  
  // Initialize service
  const initialized = PatternRecognitionService.init();
  console.log(`✅ Service initialized: ${initialized}`);
  
  // Test basic functionality
  const testToken = {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    network: 'solana',
    symbol: 'TEST'
  };
  
  // Test pattern multiplier
  const multiplier = PatternRecognitionService.calculatePatternMultiplier(testToken.address, testToken.network);
  console.log(`✅ Pattern multiplier: ${multiplier.toFixed(2)}x`);
  
  // Test getting active patterns
  const activePatterns = PatternRecognitionService.getActivePatterns();
  console.log(`✅ Active patterns: ${activePatterns.length}`);
  
  // Test enum values
  console.log(`✅ Pattern types available: ${Object.keys(PatternType).length}`);
  console.log(`✅ Pattern statuses available: ${Object.keys(PatternStatus).length}`);
  console.log(`✅ Timeframe types available: ${Object.keys(TimeframeType).length}`);
  
  // Performance summary
  const totalTime = process.hrtime.bigint();
  const totalMs = Number(totalTime - startTime) / 1000000;
  
  console.log('\n📋 Performance Summary');
  console.log(`   Import time: ${importMs.toFixed(2)}ms`);
  console.log(`   Total runtime: ${totalMs.toFixed(2)}ms`);
  console.log(`   Memory usage: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`);
  
  if (importMs < 100) {
    console.log('✅ EXCELLENT: Import speed under 100ms');
  } else if (importMs < 500) {
    console.log('⚠️  ACCEPTABLE: Import speed under 500ms');
  } else {
    console.log('❌ POOR: Import speed exceeds 500ms');
  }
  
  PatternRecognitionService.stop();
  console.log('\n✅ Test completed successfully!');
  
} catch (error) {
  console.error('❌ Test failed:', error);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\n💡 Make sure pattern-recognition-fixed.js exists in src/scripts-js/');
  }
  
  process.exit(1);
}