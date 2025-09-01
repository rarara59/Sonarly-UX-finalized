#!/usr/bin/env node

/**
 * Test individual RPC endpoint connectivity
 */

import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class EndpointConnectivityTest {
    constructor() {
        this.endpoints = [
            { name: 'Helius', url: process.env.HELIUS_RPC_URL },
            { name: 'Chainstack', url: process.env.CHAINSTACK_RPC_URL },
            { name: 'Public', url: process.env.PUBLIC_RPC_URL }
        ];
        this.results = [];
    }

    async testEndpoint(endpoint) {
        console.log(`\nTesting ${endpoint.name}...`);
        console.log(`URL: ${endpoint.url}`);
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(endpoint.url);
            
            const requestData = JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getSlot',
                params: []
            });
            
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': requestData.length
                },
                timeout: 5000
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const latency = Date.now() - startTime;
                    
                    try {
                        const response = JSON.parse(data);
                        
                        if (response.result) {
                            console.log(`✅ SUCCESS - Slot: ${response.result}, Latency: ${latency}ms`);
                            this.results.push({
                                endpoint: endpoint.name,
                                success: true,
                                slot: response.result,
                                latency
                            });
                            resolve(true);
                        } else if (response.error) {
                            console.log(`❌ RPC Error: ${response.error.message}`);
                            this.results.push({
                                endpoint: endpoint.name,
                                success: false,
                                error: response.error.message
                            });
                            resolve(false);
                        } else {
                            console.log(`❌ Unexpected response format`);
                            this.results.push({
                                endpoint: endpoint.name,
                                success: false,
                                error: 'Unexpected response'
                            });
                            resolve(false);
                        }
                    } catch (error) {
                        console.log(`❌ Parse error: ${error.message}`);
                        console.log(`Response: ${data.substring(0, 200)}`);
                        this.results.push({
                            endpoint: endpoint.name,
                            success: false,
                            error: error.message
                        });
                        resolve(false);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.log(`❌ Connection error: ${error.message}`);
                this.results.push({
                    endpoint: endpoint.name,
                    success: false,
                    error: error.message
                });
                resolve(false);
            });
            
            req.on('timeout', () => {
                console.log(`❌ Request timeout after 5000ms`);
                req.destroy();
                this.results.push({
                    endpoint: endpoint.name,
                    success: false,
                    error: 'Timeout'
                });
                resolve(false);
            });
            
            req.write(requestData);
            req.end();
        });
    }

    async run() {
        console.log('🔌 RPC Endpoint Connectivity Test');
        console.log('=' .repeat(50));
        console.log('Testing Solana mainnet RPC endpoints from .env file\n');
        
        // Test each endpoint
        for (const endpoint of this.endpoints) {
            await this.testEndpoint(endpoint);
        }
        
        // Summary
        console.log('\n' + '=' .repeat(50));
        console.log('📊 CONNECTIVITY TEST SUMMARY');
        console.log('=' .repeat(50));
        
        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        const successRate = (successCount / totalCount * 100).toFixed(1);
        
        console.log(`\nEndpoint Results:`);
        for (const result of this.results) {
            const status = result.success ? '✅' : '❌';
            const detail = result.success 
                ? `Slot ${result.slot} (${result.latency}ms)`
                : result.error;
            console.log(`  ${status} ${result.endpoint}: ${detail}`);
        }
        
        console.log(`\nOverall Success Rate: ${successRate}% (${successCount}/${totalCount})`);
        
        if (successCount === totalCount) {
            console.log('\n✅ ALL ENDPOINTS WORKING - Ready for memory testing');
            return true;
        } else if (successCount > 0) {
            console.log('\n⚠️  SOME ENDPOINTS WORKING - Can proceed with limited testing');
            return true;
        } else {
            console.log('\n❌ NO ENDPOINTS WORKING - Cannot proceed with memory testing');
            return false;
        }
    }
}

// Run the test
const test = new EndpointConnectivityTest();
test.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});