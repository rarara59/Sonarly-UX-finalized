#!/usr/bin/env node
// src/scripts-js/test-existing-pattern.js
// Test the existing pattern-recognition.js file to see startup time

const startTime = process.hrtime.bigint();

console.log('🔄 Testing Existing Pattern Recognition Service...');

try {
  // Try to import the existing file
  const patternService = require('./pattern-recognition.js');
  
  const importTime = process.hrtime.bigint();
  const importMs = Number(importTime - startTime) / 1000000;
  
  console.log(`✅ Import completed in ${importMs.toFixed(2)}ms`);
  
  if (importMs < 100) {
    console.log('🚀 EXCELLENT: Import speed under 100ms');
  } else if (importMs < 1000) {
    console.log('⚠️  ACCEPTABLE: Import speed under 1 second');
  } else if (importMs < 10000) {
    console.log('❌ SLOW: Import speed over 1 second');
  } else {
    console.log('❌ VERY SLOW: Import speed over 10 seconds');
  }
  
  // Test basic functionality
  console.log('✅ Pattern service loaded successfully');
  console.log(`✅ Service type: ${typeof patternService}`);
  
  // Check if it's a class or instance
  if (patternService.constructor && patternService.constructor.name) {
    console.log(`✅ Service class: ${patternService.constructor.name}`);
  }
  
  // Test available methods
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(patternService))
    .filter(name => typeof patternService[name] === 'function' && name !== 'constructor');
  
  console.log(`✅ Available methods: ${methods.length}`);
  console.log(`   Methods: ${methods.slice(0, 5).join(', ')}${methods.length > 5 ? '...' : ''}`);
  
  // Try to initialize if method exists
  if (typeof patternService.init === 'function') {
    console.log('🔄 Attempting to initialize service...');
    try {
      const initResult = await patternService.init();
      console.log(`✅ Service initialized: ${initResult}`);
    } catch (initError) {
      console.warn(`⚠️  Service initialization failed: ${initError.message}`);
    }
  }
  
  // Performance summary
  const totalTime = process.hrtime.bigint();
  const totalMs = Number(totalTime - startTime) / 1000000;
  const memoryUsage = process.memoryUsage();
  
  console.log('\n📋 Performance Summary');
  console.log(`   Import time: ${importMs.toFixed(2)}ms`);
  console.log(`   Total runtime: ${totalMs.toFixed(2)}ms`);
  console.log(`   Memory usage: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Heap used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  
  // Check for common dependency issues
  console.log('\n🔍 Dependency Analysis');
  
  // Check if dependencies are causing slowness
  const dependencyTests = [
    { name: 'winston', test: () => require.resolve('winston') },
    { name: 'mongoose', test: () => require.resolve('mongoose') },
    { name: 'technicalindicators', test: () => require.resolve('technicalindicators') }
  ];
  
  for (const dep of dependencyTests) {
    try {
      dep.test();
      console.log(`   ✅ ${dep.name}: Available`);
    } catch (error) {
      console.log(`   ❌ ${dep.name}: Missing (${error.code})`);
    }
  }
  
  // Stop service if method exists
  if (typeof patternService.stop === 'function') {
    patternService.stop();
    console.log('✅ Service stopped cleanly');
  }
  
  console.log('\n📊 Performance Verdict');
  if (importMs < 100) {
    console.log('✅ READY FOR PRODUCTION: Fast startup achieved');
  } else if (importMs < 1000) {
    console.log('⚠️  NEEDS OPTIMIZATION: Startup time acceptable but could be faster');
  } else {
    console.log('❌ PERFORMANCE ISSUE: Startup time exceeds production requirements');
    console.log('   Recommendation: Remove heavy dependencies (winston, mongoose, technicalindicators)');
  }
  
} catch (error) {
  const errorTime = process.hrtime.bigint();
  const errorMs = Number(errorTime - startTime) / 1000000;
  
  console.error(`❌ Test failed after ${errorMs.toFixed(2)}ms:`);
  console.error(`   Error: ${error.message}`);
  console.error(`   Code: ${error.code}`);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\n💡 File not found. Available files in src/scripts-js/:');
    try {
      const fs = require('fs');
      const files = fs.readdirSync('src/scripts-js/');
      files.forEach(file => console.error(`   - ${file}`));
    } catch (fsError) {
      console.error('   Could not read directory');
    }
  }
  
  process.exit(1);
}