#!/usr/bin/env node
// src/scripts-js/verify-file-contents.js
// Check if the fixed file actually contains the lightweight version

import fs from 'fs';

console.log('🔍 Verifying Pattern Recognition File Contents...\n');

async function checkFile(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📄 ${description}:`);
    console.log(`   File size: ${(content.length / 1024).toFixed(1)}KB`);
    
    // Check for heavy dependencies
    const hasWinston = content.includes('require(\'winston\')') || content.includes('import winston') || content.includes('winston.createLogger');
    const hasMongoose = content.includes('require(\'mongoose\')') || content.includes('import mongoose') || content.includes('mongoose.Schema');
    const hasTechnicalIndicators = content.includes('require(\'technicalindicators\')') || content.includes('import') && content.includes('technicalindicators');
    
    // Check for lightweight indicators
    const hasConsoleLogger = content.includes('console.log') && content.includes('logger = {');
    const hasInMemoryStorage = content.includes('In-memory pattern storage') || content.includes('activePatterns = new Map');
    const hasLightweightIndicators = content.includes('TechnicalIndicators = {') && content.includes('sma:');
    
    console.log(`   Heavy Dependencies:`);
    console.log(`     Winston: ${hasWinston ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`     Mongoose: ${hasMongoose ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`     TechnicalIndicators: ${hasTechnicalIndicators ? '❌ FOUND' : '✅ NOT FOUND'}`);
    
    console.log(`   Lightweight Features:`);
    console.log(`     Console Logger: ${hasConsoleLogger ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`     In-Memory Storage: ${hasInMemoryStorage ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`     Lightweight Indicators: ${hasLightweightIndicators ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    // Check first few lines for identification
    const firstLines = content.split('\n').slice(0, 10).join('\n');
    console.log(`   First 10 lines preview:`);
    console.log(`     ${firstLines.substring(0, 200)}...`);
    
    // Determine file type
    if (hasWinston || hasMongoose) {
      console.log(`   🔍 Analysis: HEAVY VERSION (original file)`);
    } else if (hasConsoleLogger && hasInMemoryStorage) {
      console.log(`   🔍 Analysis: LIGHTWEIGHT VERSION (fixed file)`);
    } else {
      console.log(`   🔍 Analysis: UNKNOWN VERSION`);
    }
    
    console.log('');
    return {
      heavy: hasWinston || hasMongoose || hasTechnicalIndicators,
      lightweight: hasConsoleLogger && hasInMemoryStorage && hasLightweightIndicators
    };
    
  } catch (error) {
    console.log(`❌ ${description}: File not found or unreadable`);
    console.log(`   Error: ${error.message}\n`);
    return { heavy: false, lightweight: false };
  }
}

async function main() {
  const existing = await checkFile('src/scripts-js/pattern-recognition.js', 'Existing Pattern Recognition');
  const fixed = await checkFile('src/scripts-js/pattern-recognition-fixed.js', 'Fixed Pattern Recognition');
  
  console.log('📋 File Comparison Summary:');
  
  if (existing.heavy && fixed.heavy) {
    console.log('❌ PROBLEM: Both files contain heavy dependencies');
    console.log('🔧 SOLUTION: The fixed file was not saved correctly');
    console.log('📝 ACTION: Re-save the lightweight pattern-recognition-fixed.js artifact');
  } else if (existing.heavy && fixed.lightweight) {
    console.log('✅ CORRECT: Files are different as expected');
    console.log('🎯 INVESTIGATION: Performance issue must be elsewhere');
  } else if (!existing.heavy && !fixed.heavy) {
    console.log('🤔 UNCLEAR: Neither file has heavy dependencies');
    console.log('🔍 INVESTIGATION: Performance issue from different source');
  }
  
  console.log('\n💡 Next Steps:');
  if (existing.heavy && fixed.heavy) {
    console.log('1. Delete src/scripts-js/pattern-recognition-fixed.js');
    console.log('2. Re-save the lightweight version from the artifact');
    console.log('3. Run performance test again');
  } else {
    console.log('1. Check system resources (CPU, memory)');
    console.log('2. Clear Node.js cache: rm -rf node_modules/.cache');
    console.log('3. Restart terminal and try again');
  }
}

main().catch(console.error);