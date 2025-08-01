#!/usr/bin/env node
// src/scripts-js/simple-performance-test.js
// Simple test to check startup performance

const startTime = process.hrtime.bigint();

console.log('🔄 Testing Pattern Recognition Performance...');

async function testFile(filePath, description) {
  console.log(`\n📊 Testing ${description}...`);
  
  const testStart = process.hrtime.bigint();
  
  try {
    // Try dynamic import first (ES modules)
    const module = await import(filePath);
    
    const testEnd = process.hrtime.bigint();
    const testMs = Number(testEnd - testStart) / 1000000;
    
    console.log(`✅ ${description} loaded in ${testMs.toFixed(2)}ms`);
    
    if (testMs < 100) {
      console.log('🚀 EXCELLENT performance');
    } else if (testMs < 1000) {
      console.log('⚠️  ACCEPTABLE performance');
    } else {
      console.log('❌ SLOW performance');
    }
    
    // Check what was exported
    const exports = Object.keys(module);
    console.log(`   Exports: ${exports.length > 0 ? exports.join(', ') : 'default export only'}`);
    
    return { success: true, time: testMs, module };
    
  } catch (importError) {
    const testEnd = process.hrtime.bigint();
    const testMs = Number(testEnd - testStart) / 1000000;
    
    console.log(`❌ ${description} failed to load after ${testMs.toFixed(2)}ms`);
    console.log(`   Error: ${importError.message}`);
    
    return { success: false, time: testMs, error: importError };
  }
}

async function main() {
  // Test existing file
  const existingResult = await testFile('./pattern-recognition.js', 'Existing Pattern Recognition');
  
  // Test fixed file if it exists
  const fixedResult = await testFile('./pattern-recognition-fixed.js', 'Fixed Pattern Recognition');
  
  // Performance comparison
  console.log('\n📋 Performance Comparison');
  
  if (existingResult.success) {
    console.log(`   Existing file: ${existingResult.time.toFixed(2)}ms`);
  } else {
    console.log(`   Existing file: FAILED (${existingResult.error.code})`);
  }
  
  if (fixedResult.success) {
    console.log(`   Fixed file: ${fixedResult.time.toFixed(2)}ms`);
  } else {
    console.log(`   Fixed file: FAILED (${fixedResult.error.code})`);
  }
  
  // Memory usage
  const memoryUsage = process.memoryUsage();
  console.log(`\n💾 Memory Usage:`);
  console.log(`   RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  
  // Total runtime
  const totalTime = process.hrtime.bigint();
  const totalMs = Number(totalTime - startTime) / 1000000;
  console.log(`\n⏱️  Total Test Runtime: ${totalMs.toFixed(2)}ms`);
  
  // List available files
  console.log('\n📁 Available files in src/scripts-js/:');
  try {
    const fs = await import('fs');
    const files = fs.readdirSync('src/scripts-js/')
      .filter(file => file.endsWith('.js'))
      .sort();
    
    files.forEach(file => {
      const stats = fs.statSync(`src/scripts-js/${file}`);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`   - ${file} (${sizeKB}KB)`);
    });
  } catch (fsError) {
    console.log('   Could not read directory');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!existingResult.success && existingResult.error.code === 'ERR_REQUIRE_ESM') {
    console.log('   ❌ Existing file uses CommonJS but project expects ES modules');
    console.log('   🔧 Convert exports to ES modules or create .mjs version');
  }
  
  if (!fixedResult.success && fixedResult.error.code === 'MODULE_NOT_FOUND') {
    console.log('   📝 Fixed version not created yet');
    console.log('   🔧 Save the pattern-recognition-fixed.js artifact to filesystem');
  }
  
  if (existingResult.success && existingResult.time > 1000) {
    console.log('   ⚠️  Existing file is slow due to heavy dependencies');
    console.log('   🔧 Remove winston, mongoose, technicalindicators for faster startup');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});