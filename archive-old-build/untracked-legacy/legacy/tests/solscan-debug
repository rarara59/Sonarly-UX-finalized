// src/tests/solscan-debug.ts
import solscanAPI from '../api/solscan';
import axios, { AxiosError } from 'axios';

async function testSolscanAPI() {
    // Test token address - USDC on Solana
    const testTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
    console.log('Testing Solscan API...\n');

    try {
        console.log('1. Testing getTokenInfo...');
        const tokenInfo = await solscanAPI.getTokenInfo(testTokenAddress);
        console.log('Token Info Response:', JSON.stringify(tokenInfo, null, 2));
    } catch (err) {
        const error = err as AxiosError;
        console.error('Error in getTokenInfo:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
        }
    }

    try {
        console.log('\n2. Testing checkTokenHolders...');
        const holders = await solscanAPI.checkTokenHolders(testTokenAddress);
        console.log('Holders Response:', JSON.stringify(holders, null, 2));
    } catch (err) {
        const error = err as AxiosError;
        console.error('Error in checkTokenHolders:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
        }
    }
}

// Run the test
testSolscanAPI().catch(error => {
    console.error('Test execution error:', error);
});