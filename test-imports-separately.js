console.log('=== TESTING IMPORTS SEPARATELY ===');

async function testImport(description, importPromise) {
  const timeout = setTimeout(() => {
    console.log(`❌ ${description} import hung`);
    process.exit(1);
  }, 8000);
  
  try {
    console.log(`Testing ${description}...`);
    await importPromise;
    clearTimeout(timeout);
    console.log(`✅ ${description} imported successfully`);
  } catch (error) {
    clearTimeout(timeout);
    console.log(`❌ ${description} import failed:`, error.message);
  }
}

// Test 1: Database service import
await testImport('smart-wallet.service', import('./src/services/smart-wallet.service.js'));

// Test 2: MongoDB model import  
await testImport('SmartWallet model', import('./src/models/smartWallet.js'));

// Test 3: Solana import (we know this hangs)
await testImport('@solana/web3.js', import('@solana/web3.js'));

console.log('✅ All import tests completed');
