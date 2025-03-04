// src/tests/test-chainstack.ts
import * as dotenv from 'dotenv';
import RPCConnectionManager from '../services/rpc-connection-manager';

// Load environment variables
dotenv.config();

async function testChainstack() {
  console.log('Testing Chainstack integration with RPC Connection Manager...');
  
  try {
    // Force using chainstack endpoint specifically
    console.log('Testing direct Chainstack endpoint');
    const chainstackStatus = await RPCConnectionManager.sendRequest(
      'getVersion', 
      [], 
      null,
      'chainstack' // Force using chainstack endpoint
    );
    
    console.log('✅ Chainstack direct request successful:');
    console.log(`   Solana version: ${chainstackStatus.result?.['solana-core']}`);
    
    // Test getRecentBlockhash through Chainstack
    console.log('\nTesting getRecentBlockhash via Chainstack');
    const blockhash = await RPCConnectionManager.getRecentBlockhash();
    console.log(`✅ Got recent blockhash: ${blockhash}`);
    
    // Get RPC manager status to see health metrics
    console.log('\nCurrent RPC endpoint status:');
    const status = RPCConnectionManager.getStatus();
    console.table(status);
    
    // Test best endpoint selection
    const bestEndpoint = RPCConnectionManager.getBestEndpoint();
    console.log(`\nBest endpoint selected: ${bestEndpoint}`);
    
    // Test getting a token account to verify more complex calls
    console.log('\nTesting getTokenAccountsByOwner via best endpoint');
    const sampleWallet = 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg'; // Known wallet with tokens
    const tokenAccounts = await RPCConnectionManager.getTokenAccountsByOwner(sampleWallet);
    console.log(`✅ Successfully retrieved ${tokenAccounts.length} token accounts`);
    
    if (tokenAccounts.length > 0) {
      console.log(`   First token: ${tokenAccounts[0].account.data.parsed.info.mint}`);
    }
    
    console.log('\nAll tests completed successfully!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message || String(error));
  }
}

// Run the test
testChainstack().catch(console.error);