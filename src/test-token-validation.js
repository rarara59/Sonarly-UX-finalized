import { TieredTokenFilterService } from './services/tiered-token-filter.service.js';

// Mock RPC manager for testing
class MockRpcManager {
    constructor() {
        this.callCount = 0;
        this.lastCalls = [];
    }

    async call(method, params = []) {
        this.callCount++;
        const callInfo = { method, params, timestamp: Date.now() };
        this.lastCalls.push(callInfo);
        
        console.log(`\n🌐 RPC CALL #${this.callCount}:`);
        console.log(`  Method: ${method}`);
        console.log(`  Params:`, JSON.stringify(params, null, 2));
        
        // Simulate different responses based on method
        switch (method) {
            case 'getAccountInfo':
                const address = params[0];
                console.log(`  📍 Address: ${address}`);
                
                // Known test addresses
                if (address === 'So11111111111111111111111111111111111111112') {
                    // Wrapped SOL
                    return {
                        value: {
                            data: {
                                parsed: {
                                    type: 'mint',
                                    info: {
                                        decimals: 9,
                                        supply: '1000000000000000',
                                        mintAuthority: null,
                                        freezeAuthority: null,
                                        isInitialized: true
                                    }
                                },
                                program: 'spl-token'
                            },
                            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                            lamports: 1000000
                        }
                    };
                } else if (address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
                    // USDC
                    return {
                        value: {
                            data: {
                                parsed: {
                                    type: 'mint',
                                    info: {
                                        decimals: 6,
                                        supply: '5000000000000000',
                                        mintAuthority: '2wmVCSfHip5foP8UAhbT1cmHmeFMCqvXPBTUnQL8Ujwg',
                                        freezeAuthority: '2wmVCSfHip5foP8UAhbT1cmHmeFMCqvXPBTUnQL8Ujwg',
                                        isInitialized: true
                                    }
                                },
                                program: 'spl-token'
                            },
                            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                            lamports: 1000000
                        }
                    };
                } else {
                    // Unknown token - simulate null response
                    console.log(`  ❌ Returning null for unknown token`);
                    return {
                        value: null
                    };
                }
                
            case 'getTokenSupply':
                const mint = params[0];
                console.log(`  📍 Mint: ${mint}`);
                
                if (mint === 'So11111111111111111111111111111111111111112') {
                    return {
                        value: {
                            amount: '1000000000000000',
                            decimals: 9,
                            uiAmount: 1000000.0,
                            uiAmountString: '1000000'
                        }
                    };
                } else if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
                    return {
                        value: {
                            amount: '5000000000000000',
                            decimals: 6,
                            uiAmount: 5000000000.0,
                            uiAmountString: '5000000000'
                        }
                    };
                } else {
                    throw new Error('Invalid mint');
                }
                
            case 'getTokenLargestAccounts':
                return {
                    value: [
                        { address: 'FakeHolder1', amount: '100000000', decimals: 9, uiAmount: 0.1 },
                        { address: 'FakeHolder2', amount: '50000000', decimals: 9, uiAmount: 0.05 },
                        { address: 'FakeHolder3', amount: '25000000', decimals: 9, uiAmount: 0.025 }
                    ]
                };
                
            case 'getSignaturesForAddress':
                return [
                    { signature: 'fake1', blockTime: Date.now() / 1000 - 60 },
                    { signature: 'fake2', blockTime: Date.now() / 1000 - 120 }
                ];
                
            default:
                console.log(`  ⚠️ Unhandled method: ${method}`);
                return null;
        }
    }
}

async function testTokenValidation() {
    console.log('🧪 Starting Token Validation Test\n');
    
    // Create mock RPC manager
    const mockRpcManager = new MockRpcManager();
    
    // Create tiered token filter service
    const filterService = new TieredTokenFilterService({
        rpcManager: mockRpcManager
    });
    
    await filterService.initialize();
    
    // Test cases
    const testCases = [
        {
            name: 'Valid Token with tokenMint field',
            candidate: {
                tokenMint: 'So11111111111111111111111111111111111111112',
                poolAddress: 'FakePoolAddress123',
                dex: 'Raydium',
                detectedAt: Date.now(),
                lpValueUSD: 5000,
                volume24h: 10000,
                uniqueWallets: 50,
                buyToSellRatio: 2.5
            }
        },
        {
            name: 'Valid Token with baseMint field',
            candidate: {
                baseMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                poolAddress: 'FakePoolAddress456',
                dex: 'Raydium',
                detectedAt: Date.now() - 5 * 60 * 1000, // 5 minutes ago
                lpValueUSD: 10000,
                volume24h: 20000
            }
        },
        {
            name: 'Invalid Token (unknown address)',
            candidate: {
                tokenMint: '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf',
                poolAddress: 'FakePoolAddress789',
                dex: 'Raydium',
                detectedAt: Date.now(),
                lpValueUSD: 2000,
                volume24h: 5000
            }
        },
        {
            name: 'Missing Token Address',
            candidate: {
                poolAddress: 'FakePoolAddress000',
                dex: 'Raydium',
                detectedAt: Date.now()
            }
        }
    ];
    
    // Run tests
    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📋 TEST: ${testCase.name}`);
        console.log(`${'='.repeat(80)}`);
        
        try {
            const result = await filterService.processToken(testCase.candidate);
            console.log('\n📊 RESULT:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('\n❌ ERROR:', error.message);
            console.error('Stack:', error.stack);
        }
        
        console.log(`\n📈 RPC Call Summary:`);
        console.log(`  Total calls: ${mockRpcManager.callCount}`);
        console.log(`  Last 5 calls:`);
        mockRpcManager.lastCalls.slice(-5).forEach((call, idx) => {
            console.log(`    ${idx + 1}. ${call.method} - ${new Date(call.timestamp).toISOString()}`);
        });
    }
    
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 FILTER SERVICE STATS:');
    console.log(`${'='.repeat(80)}`);
    const stats = await filterService.healthCheck();
    console.log(JSON.stringify(stats, null, 2));
}

// Run the test
testTokenValidation().catch(console.error);