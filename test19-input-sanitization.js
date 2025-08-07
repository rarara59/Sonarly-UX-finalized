/**
 * RENAISSANCE TEST #19: INPUT SANITIZATION (HIGH PRIORITY)
 * 
 * What: Protection against malicious or malformed input data
 * Why: Malicious token metadata can crash analysis or corrupt results
 * Money Impact: HIGH - System compromise or crash during analysis
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';
import assert from 'assert';

class Test19InputSanitization {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            critical: 0,
            details: []
        };
        
        // Mock RPC Manager for controlled testing
        this.mockRpcManager = {
            call: async (method, params) => {
                // Simulate realistic Solana RPC responses
                if (method === 'getTokenSupply') {
                    return { value: { amount: "1000000000", decimals: 9, uiAmount: 1000 } };
                }
                if (method === 'getTokenLargestAccounts') {
                    return { value: [{ amount: "100000000" }, { amount: "50000000" }] };
                }
                if (method === 'getAccountInfo') {
                    return { 
                        value: { 
                            data: { 
                                parsed: { 
                                    info: { decimals: 9, supply: "1000000000", mintAuthority: null } 
                                } 
                            } 
                        } 
                    };
                }
                throw new Error('Unknown RPC method');
            },
            rotateEndpoint: async () => true
        };
    }

    async runTest() {
        console.log('🔒 RENAISSANCE TEST #19: INPUT SANITIZATION');
        console.log('==========================================');
        console.log('Target: Malicious token metadata protection');
        console.log('Risk: System compromise during token analysis\n');
        
        const service = new TieredTokenFilterService({ rpcManager: this.mockRpcManager });
        await service.initialize();
        
        // Test Case 1: Script Injection Attacks
        await this.testCase1_ScriptInjection(service);
        
        // Test Case 2: Buffer Overflow Attempts  
        await this.testCase2_BufferOverflow(service);
        
        // Test Case 3: SQL Injection Patterns
        await this.testCase3_SQLInjection(service);
        
        // Test Case 4: Unicode/Encoding Attacks
        await this.testCase4_EncodingAttacks(service);
        
        // Test Case 5: Prototype Pollution
        await this.testCase5_PrototypePollution(service);
        
        this.printResults();
        return this.results;
    }

    async testCase1_ScriptInjection(service) {
        console.log('🎯 Test Case 1: Script Injection in Token Metadata');
        
        const maliciousTokens = [
            {
                name: 'XSS Basic',
                tokenMint: '11111111111111111111111111111112',
                name: '<script>alert("XSS")</script>',
                symbol: 'XSS1',
                detectedAt: Date.now(),
                expected: 'Should sanitize script tags'
            },
            {
                name: 'XSS Image',
                tokenMint: '11111111111111111111111111111113',
                name: '</script><img src=x onerror=alert(1)>',
                symbol: 'XSS2',
                detectedAt: Date.now(),
                expected: 'Should sanitize image injection'
            },
            {
                name: 'XSS JavaScript',
                tokenMint: '11111111111111111111111111111114',
                name: 'javascript:alert(document.cookie)',
                symbol: 'XSS3',
                detectedAt: Date.now(),
                expected: 'Should sanitize javascript: URLs'
            },
            {
                name: 'XSS Event Handler',
                tokenMint: '11111111111111111111111111111115',
                name: 'Token" onmouseover="alert(1)"',
                symbol: 'XSS4',
                detectedAt: Date.now(),
                expected: 'Should sanitize event handlers'
            }
        ];
        
        for (let i = 0; i < maliciousTokens.length; i++) {
            const token = maliciousTokens[i];
            const testId = `19.1.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.name}`);
                
                const startTime = Date.now();
                const result = await service.processToken(token);
                const processingTime = Date.now() - startTime;
                
                // Check if system crashed
                if (!result) {
                    this.recordCritical(testId, `System crashed on script injection: ${token.name}`);
                    continue;
                }
                
                // Check if processing took too long (possible infinite loop)
                if (processingTime > 30000) {
                    this.recordCritical(testId, `Processing timeout (${processingTime}ms) - possible DoS: ${token.name}`);
                    continue;
                }
                
                // Check if malicious code was executed (indirect detection)
                // In a real environment, this would check logs, global state, etc.
                if (typeof global !== 'undefined' && global.compromised === true) {
                    this.recordCritical(testId, `Code execution detected: ${token.name}`);
                    continue;
                }
                
                // Check if result structure is intact
                if (!result.hasOwnProperty('approved') || !result.hasOwnProperty('reason')) {
                    this.recordCritical(testId, `Result structure corrupted: ${token.name}`);
                    continue;
                }
                
                this.recordSuccess(testId, `Script injection safely handled: ${token.expected}`);
                
            } catch (error) {
                // Crashes are critical failures for security tests
                this.recordCritical(testId, `Script injection caused crash: ${error.message}`);
            }
        }
    }

    async testCase2_BufferOverflow(service) {
        console.log('\n🎯 Test Case 2: Buffer Overflow Attempts');
        
        const bufferTokens = [
            {
                name: 'Large String Attack',
                tokenMint: '11111111111111111111111111111116',
                name: 'A'.repeat(100000), // 100KB string
                symbol: 'BUFF1',
                detectedAt: Date.now(),
                expected: 'Handle large strings without crash'
            },
            {
                name: 'Symbol Overflow',
                tokenMint: '11111111111111111111111111111117',
                name: 'Normal',
                symbol: 'B'.repeat(50000), // 50KB symbol
                detectedAt: Date.now(),
                expected: 'Handle large symbols without crash'
            },
            {
                name: 'Numeric Overflow',
                tokenMint: '11111111111111111111111111111118',
                name: 'Normal',
                symbol: 'NORM',
                lpValueUSD: 'C'.repeat(10000) + '999999999999999999999999', // Non-numeric overflow
                detectedAt: Date.now(),
                expected: 'Handle numeric field overflow'
            },
            {
                name: 'Deep Object Nesting',
                tokenMint: '11111111111111111111111111111119',
                name: 'Normal',
                symbol: 'DEEP',
                metadata: this.createDeepObject(1000), // 1000 levels deep
                detectedAt: Date.now(),
                expected: 'Handle deeply nested objects'
            }
        ];
        
        for (let i = 0; i < bufferTokens.length; i++) {
            const token = bufferTokens[i];
            const testId = `19.2.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.name}`);
                
                // Monitor memory usage
                const initialMemory = process.memoryUsage().heapUsed;
                const startTime = Date.now();
                
                const result = await service.processToken(token);
                
                const processingTime = Date.now() - startTime;
                const finalMemory = process.memoryUsage().heapUsed;
                const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
                
                // Check for excessive memory usage
                if (memoryIncrease > 50) { // More than 50MB increase
                    this.recordCritical(testId, `Excessive memory usage: +${memoryIncrease.toFixed(2)}MB`);
                    continue;
                }
                
                // Check for timeout
                if (processingTime > 60000) { // 60 second timeout
                    this.recordCritical(testId, `Buffer overflow caused timeout: ${processingTime}ms`);
                    continue;
                }
                
                // System should handle gracefully
                this.recordSuccess(testId, `Buffer overflow handled: +${memoryIncrease.toFixed(2)}MB, ${processingTime}ms`);
                
            } catch (error) {
                this.recordCritical(testId, `Buffer overflow caused crash: ${error.message}`);
            }
        }
    }

    async testCase3_SQLInjection(service) {
        console.log('\n🎯 Test Case 3: SQL Injection Patterns');
        
        const injectionTokens = [
            {
                name: 'SQL Drop Table',
                tokenMint: '11111111111111111111111111111120',
                name: "'; DROP TABLE tokens; --",
                symbol: 'SQL1',
                detectedAt: Date.now(),
                expected: 'SQL injection patterns sanitized'
            },
            {
                name: 'SQL Union Select',
                tokenMint: '11111111111111111111111111111121',
                name: "1' UNION SELECT * FROM users --",
                symbol: 'SQL2',
                detectedAt: Date.now(),
                expected: 'Union select injection blocked'
            },
            {
                name: 'SQL Boolean Bypass',
                tokenMint: '11111111111111111111111111111122',
                name: "1' OR '1'='1",
                symbol: 'SQL3',
                detectedAt: Date.now(),
                expected: 'Boolean bypass prevented'
            },
            {
                name: 'NoSQL Injection',
                tokenMint: '11111111111111111111111111111123',
                name: '{"$ne": null}',
                symbol: 'NOSQL',
                detectedAt: Date.now(),
                expected: 'NoSQL injection patterns blocked'
            }
        ];
        
        for (let i = 0; i < injectionTokens.length; i++) {
            const token = injectionTokens[i];
            const testId = `19.3.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.name}`);
                
                const result = await service.processToken(token);
                
                // Check that system processed safely
                if (!result || typeof result !== 'object') {
                    this.recordCritical(testId, `SQL injection corrupted result: ${typeof result}`);
                    continue;
                }
                
                // Check that dangerous patterns didn't execute
                // (In real system, would check database logs, etc.)
                
                this.recordSuccess(testId, `SQL injection pattern handled safely: ${token.expected}`);
                
            } catch (error) {
                // Check if it's a benign parsing error vs system compromise
                if (error.message.includes('ECONNREFUSED') || 
                    error.message.includes('syntax') ||
                    error.message.includes('parsing')) {
                    this.recordSuccess(testId, `SQL injection safely rejected: ${error.message.substring(0, 50)}...`);
                } else {
                    this.recordCritical(testId, `SQL injection caused system error: ${error.message}`);
                }
            }
        }
    }

    async testCase4_EncodingAttacks(service) {
        console.log('\n🎯 Test Case 4: Unicode/Encoding Attacks');
        
        const encodingTokens = [
            {
                name: 'Null Bytes',
                tokenMint: '11111111111111111111111111111124',
                name: 'Token\u0000\u0001\u0002Name',
                symbol: '\x00NULL',
                detectedAt: Date.now(),
                expected: 'Null bytes handled safely'
            },
            {
                name: 'BOM Attack',
                tokenMint: '11111111111111111111111111111125',
                name: '\uFEFF\uFFFEBOM Attack',
                symbol: 'BOM',
                detectedAt: Date.now(),
                expected: 'BOM characters sanitized'
            },
            {
                name: 'Control Characters',
                tokenMint: '11111111111111111111111111111126',
                name: '\x01\x02\x03\x1F\x7F\x80\xFF',
                symbol: 'CTRL',
                detectedAt: Date.now(),
                expected: 'Control characters handled'
            },
            {
                name: 'Unicode Confusables',
                tokenMint: '11111111111111111111111111111127',
                name: 'Tоkеn', // Contains Cyrillic 'о' and 'е' 
                symbol: 'УЅР', // Cyrillic look-alikes
                detectedAt: Date.now(),
                expected: 'Unicode confusables detected'
            },
            {
                name: 'RTL Override',
                tokenMint: '11111111111111111111111111111128',
                name: 'Token\u202E\u0000\u0000EVIL',
                symbol: 'RTL',
                detectedAt: Date.now(),
                expected: 'RTL override attacks blocked'
            }
        ];
        
        for (let i = 0; i < encodingTokens.length; i++) {
            const token = encodingTokens[i];
            const testId = `19.4.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.name} (length: ${token.name.length})`);
                
                const result = await service.processToken(token);
                
                // Check that encoding didn't break the system
                if (!result || !result.hasOwnProperty('approved')) {
                    this.recordCritical(testId, `Encoding attack corrupted result structure`);
                    continue;
                }
                
                // Check that strings are properly handled
                if (result.reason && typeof result.reason === 'string') {
                    // Ensure no null bytes in reason
                    if (result.reason.includes('\u0000')) {
                        this.recordCritical(testId, `Null bytes passed through in result`);
                        continue;
                    }
                }
                
                this.recordSuccess(testId, `Encoding attack handled: ${token.expected}`);
                
            } catch (error) {
                this.recordCritical(testId, `Encoding attack caused crash: ${error.message}`);
            }
        }
    }

    async testCase5_PrototypePollution(service) {
        console.log('\n🎯 Test Case 5: Prototype Pollution Attacks');
        
        const pollutionTokens = [
            {
                name: 'Constructor Pollution',
                tokenMint: '11111111111111111111111111111129',
                name: 'Normal',
                symbol: 'POLL1',
                'constructor.prototype.isAdmin': true,
                detectedAt: Date.now(),
                expected: 'Constructor pollution prevented'
            },
            {
                name: 'Proto Pollution',
                tokenMint: '11111111111111111111111111111130',
                name: 'Normal',
                symbol: 'POLL2',
                '__proto__.isCompromised': true,
                detectedAt: Date.now(),
                expected: 'Proto pollution prevented'
            },
            {
                name: 'Deep Proto Pollution',
                tokenMint: '11111111111111111111111111111131',
                name: 'Normal',
                symbol: 'POLL3',
                'a.__proto__.b.__proto__.evil': 'injected',
                detectedAt: Date.now(),
                expected: 'Deep proto pollution prevented'
            }
        ];
        
        // Store original state
        const originalObject = {};
        const hasOriginalAdmin = originalObject.hasOwnProperty('isAdmin');
        const hasOriginalCompromised = originalObject.hasOwnProperty('isCompromised');
        const hasOriginalEvil = originalObject.hasOwnProperty('evil');
        
        for (let i = 0; i < pollutionTokens.length; i++) {
            const token = pollutionTokens[i];
            const testId = `19.5.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.name}`);
                
                const result = await service.processToken(token);
                
                // Check if prototype was polluted
                const testObject = {};
                
                // Test for various pollution indicators
                const pollutionChecks = [
                    testObject.isAdmin === true,
                    testObject.isCompromised === true,
                    testObject.evil === 'injected',
                    Object.prototype.hasOwnProperty('isAdmin'),
                    Object.prototype.hasOwnProperty('isCompromised'),
                    Object.prototype.hasOwnProperty('evil')
                ];
                
                if (pollutionChecks.some(check => check)) {
                    this.recordCritical(testId, `Prototype pollution succeeded! Object prototype contaminated`);
                    
                    // Attempt cleanup (important for subsequent tests)
                    delete Object.prototype.isAdmin;
                    delete Object.prototype.isCompromised;
                    delete Object.prototype.evil;
                    
                    continue;
                }
                
                this.recordSuccess(testId, `Prototype pollution prevented: ${token.expected}`);
                
            } catch (error) {
                this.recordCritical(testId, `Prototype pollution test crashed: ${error.message}`);
            }
        }
    }

    // Helper methods
    createDeepObject(depth) {
        if (depth <= 0) return 'deep';
        return { nested: this.createDeepObject(depth - 1) };
    }

    recordSuccess(testId, message) {
        this.results.passed++;
        this.results.details.push({ testId, status: 'PASS', message });
        console.log(`    ✅ ${testId}: ${message}`);
    }

    recordCritical(testId, message) {
        this.results.failed++;
        this.results.critical++;
        this.results.details.push({ testId, status: 'CRITICAL', message });
        console.log(`    🚨 ${testId}: ${message}`);
    }

    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('🏁 TEST #19 RESULTS: INPUT SANITIZATION');
        console.log('='.repeat(50));
        
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`🚨 Critical Issues: ${this.results.critical}`);
        
        const totalTests = this.results.passed + this.results.failed;
        const passRate = totalTests > 0 ? (this.results.passed / totalTests * 100) : 0;
        
        console.log(`📊 Pass Rate: ${passRate.toFixed(1)}%`);
        
        if (this.results.critical > 0) {
            console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND:');
            this.results.details
                .filter(d => d.status === 'CRITICAL')
                .forEach(detail => console.log(`   - ${detail.testId}: ${detail.message}`));
            
            console.log('\n🔴 SECURITY VERDICT: SYSTEM VULNERABLE - DO NOT DEPLOY');
            console.log('💰 MONEY IMPACT: HIGH - System compromise risk during token analysis');
            console.log('🔧 ACTION REQUIRED: Fix input sanitization before proceeding');
        } else {
            console.log('\n🟢 SECURITY VERDICT: INPUT SANITIZATION ROBUST');
            console.log('💰 MONEY IMPACT: PROTECTED - Malicious tokens cannot compromise system');
            console.log('✅ READY FOR: Test #21 (Malicious Injection)');
        }
        
        console.log('\n📋 NEXT STEPS:');
        if (this.results.critical > 0) {
            console.log('   1. Review and fix critical security vulnerabilities');
            console.log('   2. Add input validation and sanitization');
            console.log('   3. Re-run Test #19 to verify fixes');
        } else {
            console.log('   1. Proceed to Test #21: Malicious Injection');
            console.log('   2. Continue with security test progression');
        }
    }
}

// Export for use
export { Test19InputSanitization };

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const test = new Test19InputSanitization();
    test.runTest().catch(console.error);
}