// src/tests/solscan-simple-test.ts
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSolscanEndpoints() {
    const tokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    
    // Test different endpoint formats
    const endpoints = [
        '/token/meta',
        '/token/holders',
        '/account',
        '/account/tokens',
        '/market/token'
    ];

    for (const baseEndpoint of endpoints) {
        // Try different URL formats
        const urlFormats = [
            `https://public-api.solscan.io${baseEndpoint}/${tokenAddress}`,
            `https://public-api.solscan.io${baseEndpoint}?token=${tokenAddress}`,
            `https://api.solscan.io${baseEndpoint}/${tokenAddress}`,
            `https://api.solscan.io/v2${baseEndpoint}?address=${tokenAddress}`
        ];

        for (const url of urlFormats) {
            try {
                console.log(`\nTrying: ${url}`);
                const response = await axios.get(url, {
                    headers: {
                        'accept': 'application/json'
                    }
                });
                console.log('Success! Status:', response.status);
                console.log('Data:', JSON.stringify(response.data, null, 2));
                return; // If we find a working endpoint, stop testing
            } catch (error: any) {
                console.log(`Failed (${error.response?.status || 'unknown status'})`);
            }
        }
    }
}

console.log('Starting endpoint test...');
testSolscanEndpoints().catch(console.error);