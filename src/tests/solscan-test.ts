// src/tests/solscan-test.ts
import { createSolscanAPI } from '../services/apis/solscan';
import dotenv from 'dotenv';

// Load environment variables
console.log('Loading environment variables...');
dotenv.config();

async function testSolscanAPI() {
  try {
    console.log('\nInitializing test...');
    const api = createSolscanAPI();

    // First test basic connectivity
    console.log('\nTesting basic connectivity...');
    const welcome = await api.testConnection();
    console.log('Basic connectivity test result:', welcome);

    // Test the account tokens endpoint using an example address
    console.log('\nTesting account tokens endpoint...');
    const address = 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx';
    const tokens = await api.getAccountTokens(address);
    console.log('Account tokens:', tokens);

  } catch (error) {
    console.error('\nError in test:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        ...(error as any)
      });
    } else {
      console.error('Unknown error type:', error);
    }
    process.exit(1);
  }
}

// Run the test
testSolscanAPI();