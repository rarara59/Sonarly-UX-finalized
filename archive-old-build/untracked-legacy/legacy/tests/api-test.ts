// src/tests/api-test.ts
import solscanAPI from '../api/solscan';
import dexscreenerAPI from '../api/dexscreener';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAPIs() {
    console.log('Starting API tests...');
    
    // Test tokens - Using verified Solana addresses
    const testTokens = {
        usdc: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        bonk: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        sol: 'So11111111111111111111111111111111111111112'
    };

    // Test Solscan first with full analysis
    for (const [name, address] of Object.entries(testTokens)) {
        console.log(`\n1. Testing Solscan API with ${name.toUpperCase()}...`);
        try {
            console.log(`Getting full analysis for ${name}...`);
            const analysis = await solscanAPI.getFullTokenAnalysis(address);
            console.log(`${name.toUpperCase()} Analysis:`, JSON.stringify(analysis, null, 2));

            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Solscan Error (${name}):`, error.message);
            } else {
                console.error(`Solscan Error (${name}): Unknown error occurred`);
            }
        }
    }

    // Test DEXScreener
    console.log('\n2. Testing DEXScreener API with BONK...');
    try {
        const dexResult = await dexscreenerAPI.getTokenInfo(testTokens.bonk);
        console.log('DEXScreener Response:', JSON.stringify(dexResult, null, 2));
    } catch (error) {
        if (error instanceof Error) {
            console.error('DEXScreener Error:', error.message);
        } else {
            console.error('DEXScreener Error: Unknown error occurred');
        }
    }
}

// Run tests
console.log('Initializing API tests...');
testAPIs().catch(error => {
    if (error instanceof Error) {
        console.error('Test execution error:', error.message);
    } else {
        console.error('Test execution error: Unknown error occurred');
    }
});