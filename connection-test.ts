// connection-test.ts
import * as dotenv from 'dotenv';
import { Connection } from '@solana/web3.js';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

async function testConnections() {
  console.log('Testing Solana Edge Detection System Connections...');
  
  // Test 1: Verify Chainstack connection
  try {
    const chainstackEndpoint = process.env.SOLANA_RPC_ENDPOINT;
    if (!chainstackEndpoint) {
      throw new Error('SOLANA_RPC_ENDPOINT not found in .env file');
    }
    
    console.log(`\n1. Testing Chainstack connection to: ${chainstackEndpoint}`);
    
    const connection = new Connection(chainstackEndpoint, 'confirmed');
    const version = await connection.getVersion();
    console.log('✅ Chainstack connection successful');
    console.log(`   Solana version: ${version['solana-core']}`);
    
    // Get current slot as further verification
    const slot = await connection.getSlot();
    console.log(`   Current slot: ${slot}`);
  } catch (error: any) {
    console.error('❌ Chainstack connection failed:', error.message || String(error));
  }
  
  // Test 2: Verify Helius API connection
  try {
    const heliusApiKey = process.env.HELIUS_API_KEY;
    if (!heliusApiKey) {
      throw new Error('HELIUS_API_KEY not found in .env file');
    }
    
    console.log('\n2. Testing Helius API connection');
    const heliusUrl = `https://api.helius.xyz/v0/addresses/vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg/balances?api-key=${heliusApiKey}`;
    
    const response = await fetch(heliusUrl);
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Helius API connection successful');
    console.log(`   Retrieved token balances for the sample address`);
  } catch (error: any) {
    console.error('❌ Helius API connection failed:', error.message || String(error));
  }
  
  // Test 3: Verify Birdeye API connection if available
  if (process.env.BIRDEYE_API_KEY && process.env.BIRDEYE_API_KEY !== 'your_birdeye_key') {
    try {
      const birdeyeApiKey = process.env.BIRDEYE_API_KEY;
      
      console.log('\n3. Testing Birdeye API connection');
      const birdeyeUrl = 'https://public-api.birdeye.so/public/tokenlist?chain=solana';
      
      const response = await fetch(birdeyeUrl, {
        headers: {
          'X-API-KEY': birdeyeApiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Birdeye API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Birdeye API connection successful');
      console.log(`   Retrieved token list information`);
    } catch (error: any) {
      console.error('❌ Birdeye API connection failed:', error.message || String(error));
    }
  } else {
    console.log('\n3. Skipping Birdeye API test (key not configured)');
  }
  
  // Test 4: Verify MongoDB connection if needed
  if (process.env.MONGO_URI) {
    try {
      console.log('\n4. MongoDB connection check');
      console.log(`   MongoDB URI configured: ${process.env.MONGO_URI}`);
      console.log('   ⚠️ Note: Actual connection test requires mongoose package');
      console.log('   Install mongoose and uncomment the code below to test');
      
      /* Uncomment to test actual MongoDB connection
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connection successful');
      await mongoose.disconnect();
      */
    } catch (error: any) {
      console.error('❌ MongoDB connection check failed:', error.message || String(error));
    }
  }
  
  console.log('\nConnection tests completed');
}

// Run the tests
testConnections().catch((err: any) => {
  console.error('Test script failed:', err.message || String(err));
});