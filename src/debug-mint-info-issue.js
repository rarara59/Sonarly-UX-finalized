import { TieredTokenFilterServiceDebug } from './services/tiered-token-filter-debug.service.js';
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Direct Solana Web3.js test to verify RPC connectivity
 */
async function testDirectSolanaConnection() {
    console.log('\n🔍 Testing Direct Solana Web3.js Connection...\n');
    
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    const testTokens = {
        'WSOL': 'So11111111111111111111111111111111111111112',
        'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        'Test Token': '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf'
    };
    
    for (const [name, address] of Object.entries(testTokens)) {
        console.log(`\nTesting ${name} (${address}):`);
        
        try {
            // Test 1: getAccountInfo
            const accountInfo = await connection.getAccountInfo(new PublicKey(address), {
                encoding: 'jsonParsed'
            });
            
            console.log(`  ✅ Account exists: ${accountInfo !== null}`);
            if (accountInfo && accountInfo.data.parsed) {
                console.log(`  📦 Parsed data:`, JSON.stringify(accountInfo.data.parsed, null, 2));
            }
            
            // Test 2: getTokenSupply
            try {
                const supply = await connection.getTokenSupply(new PublicKey(address));
                console.log(`  ✅ Token supply: ${supply.value.uiAmount}`);
            } catch (e) {
                console.log(`  ⚠️ getTokenSupply failed: ${e.message}`);
            }
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }
}

/**
 * Mock RPC Manager that logs all calls and responses
 */
class DiagnosticRpcManager {
    constructor() {
        this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        this.callLog = [];
    }
    
    async call(method, params = []) {
        const callInfo = {
            method,
            params: JSON.parse(JSON.stringify(params)), // Deep copy
            timestamp: Date.now()
        };
        
        console.log(`\n🌐 RPC Manager call():`);
        console.log(`  Method: ${method}`);
        console.log(`  Params:`, params);
        
        try {
            let result;
            
            switch (method) {
                case 'getAccountInfo':
                    const pubkey = new PublicKey(params[0]);
                    const options = params[1] || {};
                    const accountInfo = await this.connection.getAccountInfo(pubkey, options);
                    
                    // Wrap in expected format
                    result = { value: accountInfo };
                    console.log(`  ✅ Result received:`, result.value ? 'Account exists' : 'Account null');
                    
                    if (result.value && result.value.data) {
                        console.log(`  📦 Data type:`, result.value.data.parsed ? 'parsed' : 'base64');
                        if (result.value.data.parsed) {
                            console.log(`  📦 Parsed info:`, result.value.data.parsed.info);
                        }
                    }
                    break;
                    
                case 'getTokenSupply':
                    const mintPubkey = new PublicKey(params[0]);
                    const supply = await this.connection.getTokenSupply(mintPubkey);
                    result = supply;
                    console.log(`  ✅ Token supply:`, result.value);
                    break;
                    
                case 'getTokenLargestAccounts':
                    const tokenMint = new PublicKey(params[0]);
                    const largestAccounts = await this.connection.getTokenLargestAccounts(tokenMint);
                    result = largestAccounts;
                    console.log(`  ✅ Largest accounts:`, result.value.length);
                    break;
                    
                case 'getSignaturesForAddress':
                    const address = new PublicKey(params[0]);
                    const options2 = params[1] || {};
                    const signatures = await this.connection.getSignaturesForAddress(address, options2);
                    result = signatures;
                    console.log(`  ✅ Signatures:`, result.length);
                    break;
                    
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
            
            callInfo.success = true;
            callInfo.result = result;
            this.callLog.push(callInfo);
            
            return result;
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            callInfo.success = false;
            callInfo.error = error.message;
            this.callLog.push(callInfo);
            throw error;
        }
    }
}

/**
 * Test the tiered token filter with diagnostic RPC manager
 */
async function testTieredTokenFilter() {
    console.log('\n🧪 Testing Tiered Token Filter Service...\n');
    
    const rpcManager = new DiagnosticRpcManager();
    const filterService = new TieredTokenFilterServiceDebug({
        rpcManager: rpcManager
    });
    
    await filterService.initialize();
    
    // Test cases
    const testCases = [
        {
            name: 'WSOL Token',
            candidate: {
                tokenMint: 'So11111111111111111111111111111111111111112',
                poolAddress: 'TestPool123',
                dex: 'Raydium',
                detectedAt: Date.now(),
                lpValueUSD: 5000
            }
        },
        {
            name: 'USDC Token',
            candidate: {
                baseMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                poolAddress: 'TestPool456',
                dex: 'Raydium',
                detectedAt: Date.now()
            }
        },
        {
            name: 'Unknown Token',
            candidate: {
                tokenMint: '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf',
                poolAddress: 'TestPool789',
                dex: 'Raydium',
                detectedAt: Date.now()
            }
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📋 Test Case: ${testCase.name}`);
        console.log(`${'='.repeat(80)}`);
        
        try {
            const result = await filterService.processToken(testCase.candidate);
            console.log('\n📊 Processing Result:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('\n❌ Processing Error:', error.message);
        }
    }
    
    // Print debug summary
    console.log('\n\n📊 DEBUG SUMMARY:');
    console.log('='.repeat(80));
    const summary = filterService.getDebugSummary();
    console.log(JSON.stringify(summary, null, 2));
    
    console.log('\n📊 RPC MANAGER CALL LOG:');
    console.log('='.repeat(80));
    console.log(`Total calls: ${rpcManager.callLog.length}`);
    rpcManager.callLog.forEach((call, idx) => {
        console.log(`\n${idx + 1}. ${call.method} - ${call.success ? '✅ Success' : '❌ Failed'}`);
        if (call.error) {
            console.log(`   Error: ${call.error}`);
        }
    });
}

/**
 * Run all diagnostic tests
 */
async function runDiagnostics() {
    console.log('🔍 Starting getMintInfo Debug Diagnostics...\n');
    console.log('This will help identify why getMintInfo returns null for all token addresses\n');
    
    try {
        // Test 1: Direct Solana connection
        await testDirectSolanaConnection();
        
        // Test 2: Tiered token filter with diagnostic RPC
        await testTieredTokenFilter();
        
        console.log('\n\n✅ Diagnostics complete!');
        
    } catch (error) {
        console.error('\n\n❌ Diagnostic error:', error);
    }
}

// Run diagnostics
runDiagnostics().catch(console.error);