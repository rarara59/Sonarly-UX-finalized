// test-basic.js
// Pure Node.js test - no TypeScript compilation
console.log("🚀 Basic Node.js test starting...");
console.log("🕐 Timestamp:", new Date().toISOString());
console.log("📦 Node version:", process.version);
console.log("💻 Platform:", process.platform);

async function testBasicImports() {
  console.log("\n1️⃣ Testing basic Node.js imports...");
  
  try {
    const fs = require('fs');
    console.log("✅ fs imported");
    
    const path = require('path');
    console.log("✅ path imported");
    
    const os = require('os');
    console.log("✅ os imported");
    console.log("💾 Free memory:", Math.round(os.freemem() / 1024 / 1024), "MB");
    
  } catch (error) {
    console.error("❌ Basic Node.js imports failed:", error.message);
    return false;
  }
  
  console.log("\n2️⃣ Testing external dependencies...");
  
  try {
    console.log("🔄 Testing dotenv...");
    const dotenv = require('dotenv');
    console.log("✅ dotenv imported");
    
    console.log("🔄 Testing winston...");
    const winston = require('winston');
    console.log("✅ winston imported");
    
  } catch (error) {
    console.error("❌ External dependency failed:", error.message);
    console.error("🔧 Try: npm install");
    return false;
  }
  
  console.log("\n3️⃣ Testing Solana (THE BIG TEST)...");
  
  const startTime = Date.now();
  
  try {
    // Set a 30-second timeout for Solana import
    const importPromise = new Promise((resolve, reject) => {
      try {
        console.log("🔄 Importing @solana/web3.js...");
        const solana = require('@solana/web3.js');
        resolve(solana);
      } catch (err) {
        reject(err);
      }
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT: Solana import took longer than 30 seconds')), 30000)
    );
    
    await Promise.race([importPromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    console.log(`✅ @solana/web3.js imported in ${duration}ms`);
    
    if (duration > 10000) {
      console.log(`⚠️ SLOW: Solana took ${duration}ms - this might be your bottleneck`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Solana import failed after ${duration}ms:`, error.message);
    
    if (error.message.includes('TIMEOUT')) {
      console.error("🚨 CONFIRMED: Solana is hanging your system");
      console.error("🔧 Next steps:");
      console.error("   1. Check Solana version: npm list @solana/web3.js");
      console.error("   2. Try downgrade: npm install @solana/web3.js@1.87.6");
      console.error("   3. Clear cache: rm -rf node_modules && npm install");
    }
    
    return false;
  }
  
  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("✅ Node.js environment is working");
  console.log("✅ Dependencies are importable");
  console.log("✅ Issue must be in TypeScript compilation");
  
  return true;
}

console.log("\n" + "=".repeat(50));
console.log("🧪 RUNNING BASIC DIAGNOSTICS");
console.log("=".repeat(50));

testBasicImports()
  .then(success => {
    if (success) {
      console.log("\n✅ Basic diagnostics passed - TypeScript is likely the culprit");
    } else {
      console.log("\n❌ Basic diagnostics failed - fundamental environment issue");
    }
  })
  .catch(error => {
    console.error("\n💥 Diagnostic script crashed:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
  });