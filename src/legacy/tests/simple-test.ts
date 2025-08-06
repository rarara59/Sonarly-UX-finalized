// src/tests/simple-test.ts
import * as dotenv from 'dotenv';
import { Connection } from '@solana/web3.js';

// Load environment variables
dotenv.config();

async function testSimpleConnection() {
  console.log('Testing basic Solana connection to Chainstack...');
  
  try {
    const rpcEndpoint = process.env.SOLANA_RPC_ENDPOINT;
    
    if (!rpcEndpoint) {
      throw new Error('SOLANA_RPC_ENDPOINT not found in .env file');
    }
    
    console.log(`Connecting to: ${rpcEndpoint}`);
    
    // Create a direct connection to test
    const connection = new Connection(rpcEndpoint, 'confirmed');
    
    // Test with a simple call
    const version = await connection.getVersion();
    console.log('Connection successful!');
    console.log(`Solana version: ${version['solana-core']}`);
    
    // Get current slot as further verification
    const slot = await connection.getSlot();
    console.log(`Current slot: ${slot}`);
    
    console.log('Basic connection test completed successfully');
  } catch (error: any) {
    console.error('Error connecting to Solana via Chainstack:', error.message || String(error));
  }
}

// Run the test
testSimpleConnection().catch(console.error);