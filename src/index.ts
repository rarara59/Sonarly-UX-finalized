import dexscreener from './api/dexscreener';
import config from './config/config';
import axios, { AxiosError } from 'axios';

async function testAPI(): Promise<void> {
    try {
        const result = await dexscreener.searchPair('SOL/USDC');
        console.log('API Test Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Test Failed:', error.response?.data || error.message);
        } else {
            console.error('API Test Failed:', 'An unknown error occurred');
        }
    }
}

// Run test
testAPI();