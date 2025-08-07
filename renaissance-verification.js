// Renaissance Production Verification Tests
// Run this to determine which analysis is correct

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

class RenaissanceVerificationSuite {
    constructor() {
        this.results = {};
        this.mockRpcManager = this.createMockRpcManager();
    }

    createMockRpcManager() {
        return {
            call: async (method, params) => {
                switch (method) {
                    case 'getTokenSupply':
                        // Return null like Helius does for invalid tokens
                        return { value: null };
                    case 'getTokenLargestAccounts':
                        return { value: null };
                    case 'getAccountInfo':
                        return { value: null };
                    default:
                        throw new Error(`Unknown method: ${method}`);
                }
            },
            rotateEndpoint: async () => {}
        };
    }

    async runAllTests() {
        console.log('🔍 RENAISSANCE VERIFICATION SUITE STARTING...\n');

        await this.testNullReferenceCrash();
        await this.testConcurrentValidation();
        await this.testVolumeCalculation();
        await this.testMemoryLeak();
        await this.testIntegrationFallback();
        
        this.printFinalVerdict();
    }

    async testNullReferenceCrash() {
        console.log('TEST 1: NULL REFERENCE CRASH VERIFICATION');
        console.log('=========================================');
        
        try {
            const service = new TieredTokenFilterService({ 
                rpcManager: this.mockRpcManager 
            });
            
            // This should crash if Renaissance analysis is correct
            const result = await service.validateTokenWithRetry('InvalidTokenMint123');
            
            this.results.nullRefTest = {
                passed: true,
                result: result,
                verdict: 'OTHER_ANALYSIS_CORRECT - No crash occurred'
            };
            console.log('✅ No crash - handled gracefully');
            console.log('Result:', result);
            
        } catch (error) {
            this.results.nullRefTest = {
                passed: false,
                error: error.message,
                verdict: 'RENAISSANCE_ANALYSIS_CORRECT - Crashed as predicted'
            };
            console.log('❌ CRASHED:', error.message);
            console.log('Stack:', error.stack?.split('\n')[1]);
        }
        console.log('');
    }

    async testConcurrentValidation() {
        console.log('TEST 2: CONCURRENT VALIDATION RACE CONDITION');
        console.log('============================================');
        
        try {
            const service = new TieredTokenFilterService({ 
                rpcManager: this.mockRpcManager 
            });
            
            // Fire concurrent requests for same token
            const promises = [
                service.validateTokenWithRetry('SameTokenMint'),
                service.validateTokenWithRetry('SameTokenMint'),
                service.validateTokenWithRetry('SameTokenMint')
            ];
            
            const results = await Promise.allSettled(promises);
            
            // Check queue state
            const queueSize = service.validationQueue.size;
            const timestampSize = service.validationQueueTimestamps.size;
            
            this.results.concurrentTest = {
                results: results.map(r => r.status),
                queueSize,
                timestampSize,
                verdict: queueSize === 0 && timestampSize === 0 ? 
                    'OTHER_ANALYSIS_CORRECT - Clean queue state' : 
                    'RENAISSANCE_ANALYSIS_CORRECT - Queue corruption detected'
            };
            
            console.log('Concurrent results:', results.map(r => r.status));
            console.log('Final queue size:', queueSize);
            console.log('Final timestamp size:', timestampSize);
            console.log('Verdict:', this.results.concurrentTest.verdict);
            
        } catch (error) {
            this.results.concurrentTest = {
                error: error.message,
                verdict: 'RENAISSANCE_ANALYSIS_CORRECT - Race condition crash'
            };
            console.log('❌ Race condition crash:', error.message);
        }
        console.log('');
    }

    async testVolumeCalculation() {
        console.log('TEST 3: VOLUME CALCULATION STRING BUG');
        console.log('=====================================');
        
        try {
            const service = new TieredTokenFilterService({ 
                rpcManager: this.mockRpcManager 
            });
            
            // Create token candidate with string volume (like real APIs return)
            const tokenCandidate = {
                tokenMint: 'TestTokenMint123',
                volume24h: "5000", // STRING like real APIs
                lpValueUSD: 2000,   // NUMBER
                name: 'Test Token',
                symbol: 'TEST'
            };
            
            const metrics = await service.gatherComprehensiveMetricsFixed(tokenCandidate);
            
            const ratio = metrics?.volumeToLiquidityRatio;
            const expectedRatio = 2.5; // 5000 / 2000
            
            this.results.volumeTest = {
                calculatedRatio: ratio,
                expectedRatio,
                ratioType: typeof ratio,
                isNaN: Number.isNaN(ratio),
                isCorrect: Math.abs(ratio - expectedRatio) < 0.001,
                verdict: (ratio === expectedRatio) ? 
                    'OTHER_ANALYSIS_CORRECT - Correct calculation' :
                    'RENAISSANCE_ANALYSIS_CORRECT - String concatenation bug'
            };
            
            console.log('Volume input type:', typeof tokenCandidate.volume24h);
            console.log('LP value input type:', typeof tokenCandidate.lpValueUSD);
            console.log('Calculated ratio:', ratio);
            console.log('Expected ratio:', expectedRatio);
            console.log('Result type:', typeof ratio);
            console.log('Is NaN?', Number.isNaN(ratio));
            console.log('Verdict:', this.results.volumeTest.verdict);
            
        } catch (error) {
            this.results.volumeTest = {
                error: error.message,
                verdict: 'RENAISSANCE_ANALYSIS_CORRECT - Calculation crashed'
            };
            console.log('❌ Volume calculation crash:', error.message);
        }
        console.log('');
    }

    async testMemoryLeak() {
        console.log('TEST 4: MEMORY LEAK IN CACHE CLEANUP');
        console.log('====================================');
        
        try {
            const service = new TieredTokenFilterService({ 
                rpcManager: this.mockRpcManager 
            });
            
            // Fill cache beyond limit
            console.log('Filling cache with 1200 entries...');
            for (let i = 0; i < 1200; i++) {
                service.cacheMetadata(`token${i}`, { 
                    name: `Token ${i}`, 
                    timestamp: Date.now() 
                });
            }
            
            const sizeBefore = service.metadataCache.size;
            console.log('Cache size before cleanup:', sizeBefore);
            
            // Trigger cleanup
            service.maintainMetadataCache();
            
            const sizeAfter = service.metadataCache.size;
            console.log('Cache size after cleanup:', sizeAfter);
            
            const cleanupWorked = sizeAfter <= service.maxCacheSize;
            
            this.results.memoryTest = {
                sizeBefore,
                sizeAfter,
                maxCacheSize: service.maxCacheSize,
                cleanupWorked,
                verdict: cleanupWorked ? 
                    'OTHER_ANALYSIS_CORRECT - Cache cleanup worked' :
                    'RENAISSANCE_ANALYSIS_CORRECT - Memory leak detected'
            };
            
            console.log('Cleanup worked:', cleanupWorked);
            console.log('Verdict:', this.results.memoryTest.verdict);
            
        } catch (error) {
            this.results.memoryTest = {
                error: error.message,
                verdict: 'RENAISSANCE_ANALYSIS_CORRECT - Cache cleanup crashed'
            };
            console.log('❌ Cache cleanup crash:', error.message);
        }
        console.log('');
    }

    async testIntegrationFallback() {
        console.log('TEST 5: INTEGRATION FALLBACK BEHAVIOR');
        console.log('=====================================');
        
        try {
            // Test without risk modules
            const serviceNoModules = new TieredTokenFilterService({ 
                rpcManager: this.mockRpcManager 
            });
            
            // Test with mock modules
            const serviceWithModules = new TieredTokenFilterService({
                rpcManager: this.mockRpcManager,
                scamProtectionEngine: {
                    analyzeToken: async () => ({ isScam: false, confidence: 90 })
                },
                liquidityRiskAnalyzer: {
                    validateExitLiquidity: async () => ({ hasExitLiquidity: true, slippage: 5 })
                },
                marketCapRiskFilter: {
                    filterByMarketCap: async () => ({ passed: true })
                }
            });
            
            const testToken = {
                tokenMint: 'TestToken123',
                name: 'Fresh Test Token',
                symbol: 'FTT',
                lpValueUSD: 5000,
                createdAt: Date.now() - (5 * 60 * 1000), // 5 minutes ago
                uniqueWallets: 30,
                buyToSellRatio: 2.5
            };
            
            console.log('Testing without modules...');
            const resultNoModules = await serviceNoModules.processToken(testToken);
            
            console.log('Testing with modules...');
            const resultWithModules = await serviceWithModules.processToken(testToken);
            
            this.results.integrationTest = {
                noModulesResult: resultNoModules?.approved,
                withModulesResult: resultWithModules?.approved,
                bothWorked: (resultNoModules !== null) && (resultWithModules !== null),
                verdict: 'Integration test completed - check results'
            };
            
            console.log('No modules result approved:', resultNoModules?.approved);
            console.log('With modules result approved:', resultWithModules?.approved);
            console.log('Both configurations worked:', this.results.integrationTest.bothWorked);
            
        } catch (error) {
            this.results.integrationTest = {
                error: error.message,
                verdict: 'Integration test failed - system crash'
            };
            console.log('❌ Integration test crash:', error.message);
        }
        console.log('');
    }

    printFinalVerdict() {
        console.log('🏛️ FINAL RENAISSANCE VERDICT');
        console.log('============================');
        
        const renaissanceCorrect = Object.values(this.results).filter(r => 
            r.verdict?.includes('RENAISSANCE_ANALYSIS_CORRECT')).length;
        const otherCorrect = Object.values(this.results).filter(r => 
            r.verdict?.includes('OTHER_ANALYSIS_CORRECT')).length;
        
        console.log('Tests supporting Renaissance analysis:', renaissanceCorrect);
        console.log('Tests supporting other analysis:', otherCorrect);
        console.log('');
        
        if (renaissanceCorrect > otherCorrect) {
            console.log('🎯 VERDICT: RENAISSANCE ANALYSIS IS CORRECT');
            console.log('❌ Code has critical production bugs');
            console.log('❌ DO NOT DEPLOY - will crash in production');
            console.log('✅ Fix critical bugs before integration');
        } else if (otherCorrect > renaissanceCorrect) {
            console.log('🎯 VERDICT: OTHER ANALYSIS IS CORRECT');
            console.log('✅ Code is production ready');
            console.log('✅ Safe to deploy and integrate');
            console.log('✅ Renaissance analysis was overly critical');
        } else {
            console.log('🎯 VERDICT: MIXED RESULTS - INVESTIGATE FURTHER');
            console.log('⚠️ Some issues found, but not all predictions confirmed');
            console.log('⚠️ Recommend cautious deployment with monitoring');
        }
        
        console.log('\nDetailed Results:');
        console.log(JSON.stringify(this.results, null, 2));
    }
}

// Export for testing
export { RenaissanceVerificationSuite };

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const suite = new RenaissanceVerificationSuite();
    await suite.runAllTests();
}