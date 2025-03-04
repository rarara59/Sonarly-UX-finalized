// src/tests/webhook-test.ts
import axios from 'axios';
import WebhookHandler from '../services/webhookHandler';

async function testWebhook() {
    // Start webhook server
    const webhookHandler = new WebhookHandler(3000);
    webhookHandler.start();

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // Test health endpoint
        console.log('Testing health endpoint...');
        const healthResponse = await axios.get('http://localhost:3000/health');
        console.log('Health check response:', healthResponse.data);

        // Test transaction webhook
        console.log('\nTesting transaction webhook...');
        const testTransaction = {
            hash: '0x' + Math.random().toString(16).slice(2),
            tokenAddress: '0xTestToken',
            pairAddress: '0xTestPair',
            price: 1.0,
            volume: 1000.0,
            type: 'BUY',
            walletAddress: '0xTestWallet'
        };

        const webhookResponse = await axios.post(
            'http://localhost:3000/webhook/transaction',
            testTransaction
        );
        console.log('Webhook response:', webhookResponse.data);

        // Test error handling with invalid data
        console.log('\nTesting error handling...');
        try {
            await axios.post('http://localhost:3000/webhook/transaction', {
                // Missing required fields
                hash: '0xtest'
            });
        } catch (error: any) {
            console.log('Expected error response:', error.response.data);
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // In a real test, you'd want to clean up the server
        console.log('\nTests completed. Press Ctrl+C to exit.');
    }
}

testWebhook();