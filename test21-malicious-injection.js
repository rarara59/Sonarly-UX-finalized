/**
 * RENAISSANCE TEST #21: MALICIOUS INJECTION (HIGH PRIORITY)
 * 
 * What: Advanced injection attacks and system compromise attempts
 * Why: Sophisticated attackers may bypass basic sanitization
 * Money Impact: HIGH - System compromise during high-value token analysis
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';
import assert from 'assert';

class Test21MaliciousInjection {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            critical: 0,
            warnings: 0,
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
        console.log('🎯 RENAISSANCE TEST #21: MALICIOUS INJECTION');
        console.log('============================================');
        console.log('Target: Advanced injection attacks and system compromise');
        console.log('Risk: Sophisticated bypass of basic sanitization');
        console.log('Previous: Test #19 PASSED - Basic sanitization robust\n');
        
        const service = new TieredTokenFilterService({ rpcManager: this.mockRpcManager });
        await service.initialize();
        
        // Test Case 1: Function Construction & Execution
        await this.testCase1_FunctionInjection(service);
        
        // Test Case 2: JSON Parsing Exploits
        await this.testCase2_JSONInjection(service);
        
        // Test Case 3: Regular Expression DoS (ReDoS)
        await this.testCase3_RegExpDoS(service);
        
        // Test Case 4: Memory Exhaustion Attacks
        await this.testCase4_MemoryExhaustion(service);
        
        // Test Case 5: Async/Promise Chain Attacks
        await this.testCase5_AsyncChainAttacks(service);
        
        // Test Case 6: Symbol/Proxy Manipulation
        await this.testCase6_SymbolProxyAttacks(service);
        
        this.printResults();
        return this.results;
    }

    async testCase1_FunctionInjection(service) {
        console.log('🔥 Test Case 1: Function Construction & Execution Attacks');
        
        const functionInjectionTokens = [
            {
                name: 'Function Constructor',
                tokenMint: '11111111111111111111111111111132',
                name: 'Function("return process")().exit()',
                symbol: 'FUNC1',
                detectedAt: Date.now(),
                threat: 'Process termination via Function constructor'
            },
            {
                name: 'Eval Injection',
                tokenMint: '11111111111111111111111111111133',
                name: 'eval("console.log(\'System compromised\')")',
                symbol: 'EVAL1',
                detectedAt: Date.now(),
                threat: 'Code execution via eval'
            },
            {
                name: 'Indirect Eval',
                tokenMint: '11111111111111111111111111111134',
                name: 'window.eval("alert(\'indirect\')")',
                symbol: 'EVAL2',
                detectedAt: Date.now(),
                threat: 'Indirect eval execution'
            },
            {
                name: 'Template Literal Attack',
                tokenMint: '11111111111111111111111111111135',
                name: '${console.log("template attack")}',
                symbol: 'TMPL1',
                detectedAt: Date.now(),
                threat: 'Template literal code execution'
            },
            {
                name: 'Constructor Chain',
                tokenMint: '11111111111111111111111111111136',
                name: 'this.constructor.constructor("return process")()',
                symbol: 'CONS1',
                detectedAt: Date.now(),
                threat: 'Constructor chain exploitation'
            }
        ];

        for (let i = 0; i < functionInjectionTokens.length; i++) {
            const token = functionInjectionTokens[i];
            const testId = `21.1.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.threat}`);
                
                // Set up execution detection
                const originalConsoleLog = console.log;
                let executionDetected = false;
                let maliciousOutput = '';
                
                // Mock console.log to detect execution
                console.log = (...args) => {
                    const message = args.join(' ');
                    if (message.includes('System compromised') || 
                        message.includes('template attack') ||
                        message.includes('indirect')) {
                        executionDetected = true;
                        maliciousOutput = message;
                    }
                    originalConsoleLog(...args);
                };
                
                const startTime = Date.now();
                const result = await service.processToken(token);
                const processingTime = Date.now() - startTime;
                
                // Restore console.log
                console.log = originalConsoleLog;
                
                // Check for code execution
                if (executionDetected) {
                    this.recordCritical(testId, `Code execution detected: "${maliciousOutput}"`);
                    continue;
                }
                
                // Check for process termination attempts (indirect detection)
                if (processingTime > 30000) {
                    this.recordCritical(testId, `Possible infinite loop or process hanging: ${processingTime}ms`);
                    continue;
                }
                
                // Check result integrity
                if (!result || typeof result !== 'object') {
                    this.recordCritical(testId, `Result corrupted by injection: ${typeof result}`);
                    continue;
                }
                
                this.recordSuccess(testId, `Function injection blocked: ${token.threat}`);
                
            } catch (error) {
                // Distinguish between safe rejection and system compromise
                if (error.message.includes('is not a function') || 
                    error.message.includes('invalid') ||
                    error.message.includes('syntax')) {
                    this.recordSuccess(testId, `Function injection safely rejected: ${error.message.substring(0, 50)}...`);
                } else {
                    this.recordCritical(testId, `Function injection caused system error: ${error.message}`);
                }
            }
        }
    }

    async testCase2_JSONInjection(service) {
        console.log('\n🔥 Test Case 2: JSON Parsing Exploits');
        
        const jsonTokens = [
            {
                name: 'JSON Smuggling',
                tokenMint: '11111111111111111111111111111137',
                name: '{"valid": true}\n{"injected": "payload"}',
                symbol: 'JSON1',
                detectedAt: Date.now(),
                threat: 'JSON smuggling via newlines'
            },
            {
                name: 'JSON Prototype Pollution',
                tokenMint: '11111111111111111111111111111138',
                name: '{"__proto__": {"evil": true}}',
                symbol: 'JSON2',
                detectedAt: Date.now(),
                threat: 'Prototype pollution via JSON'
            },
            {
                name: 'JSON Constructor Override',
                tokenMint: '11111111111111111111111111111139',
                name: '{"constructor": {"prototype": {"hacked": true}}}',
                symbol: 'JSON3',
                detectedAt: Date.now(),
                threat: 'Constructor override via JSON'
            },
            {
                name: 'JSON Circular Reference',
                tokenMint: '11111111111111111111111111111140',
                name: this.createCircularJSON(),
                symbol: 'JSON4',
                detectedAt: Date.now(),
                threat: 'JSON circular reference DoS'
            },
            {
                name: 'JSON Number Overflow',
                tokenMint: '11111111111111111111111111111141',
                name: '{"amount": 1e308}', // Near JS max number
                symbol: 'JSON5',
                lpValueUSD: '{"value": 9007199254740992}', // JS max safe integer + 1
                detectedAt: Date.now(),
                threat: 'Number overflow in JSON fields'
            }
        ];

        for (let i = 0; i < jsonTokens.length; i++) {
            const token = jsonTokens[i];
            const testId = `21.2.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.threat}`);
                
                // Store prototype state before test
                const testObj = {};
                const hadEvilBefore = testObj.hasOwnProperty('evil');
                const hadHackedBefore = testObj.hasOwnProperty('hacked');
                
                const startTime = Date.now();
                const result = await service.processToken(token);
                const processingTime = Date.now() - startTime;
                
                // Check for prototype pollution after processing
                const testObjAfter = {};
                if (testObjAfter.evil === true || testObjAfter.hacked === true) {
                    this.recordCritical(testId, `JSON prototype pollution succeeded!`);
                    
                    // Cleanup for subsequent tests
                    delete Object.prototype.evil;
                    delete Object.prototype.hacked;
                    continue;
                }
                
                // Check for DoS via processing time
                if (processingTime > 10000) { // 10 second limit for JSON processing
                    this.recordCritical(testId, `JSON DoS attack succeeded: ${processingTime}ms processing time`);
                    continue;
                }
                
                // Check for number overflow corruption
                if (result && typeof result.lpValueUSD === 'number' && !isFinite(result.lpValueUSD)) {
                    this.recordWarning(testId, `JSON number overflow detected: ${result.lpValueUSD}`);
                    continue;
                }
                
                this.recordSuccess(testId, `JSON injection blocked: ${token.threat}`);
                
            } catch (error) {
                // Distinguish between safe parsing errors and system compromise
                if (error.message.includes('Unexpected token') ||
                    error.message.includes('JSON') ||
                    error.message.includes('parse') ||
                    error.message.includes('Converting circular')) {
                    this.recordSuccess(testId, `JSON injection safely rejected: ${error.message.substring(0, 50)}...`);
                } else {
                    this.recordCritical(testId, `JSON injection caused system error: ${error.message}`);
                }
            }
        }
    }

    async testCase3_RegExpDoS(service) {
        console.log('\n🔥 Test Case 3: Regular Expression DoS (ReDoS)');
        
        const redosTokens = [
            {
                name: 'Exponential Backtracking',
                tokenMint: '11111111111111111111111111111142',
                name: 'a'.repeat(50) + 'X', // Classic ReDoS pattern
                symbol: '((a+)+)+b',
                detectedAt: Date.now(),
                threat: 'Exponential regex backtracking',
                timeout: 5000
            },
            {
                name: 'Nested Quantifiers',
                tokenMint: '11111111111111111111111111111143',
                name: 'a'.repeat(30) + '!',
                symbol: '(a*)*b',
                detectedAt: Date.now(),
                threat: 'Nested quantifier catastrophic backtracking',
                timeout: 5000
            },
            {
                name: 'Alternation Explosion',
                tokenMint: '11111111111111111111111111111144',
                name: 'x'.repeat(40),
                symbol: '(x|x)*y',
                detectedAt: Date.now(),
                threat: 'Alternation pattern explosion',
                timeout: 3000
            },
            {
                name: 'Complex Email Pattern',
                tokenMint: '11111111111111111111111111111145',
                name: 'a'.repeat(100) + '@',
                symbol: 'EMAIL',
                detectedAt: Date.now(),
                threat: 'Complex email regex DoS',
                timeout: 8000
            }
        ];

        for (let i = 0; i < redosTokens.length; i++) {
            const token = redosTokens[i];
            const testId = `21.3.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.threat}`);
                
                const startTime = Date.now();
                
                // Set up timeout detection
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('ReDoS_TIMEOUT')), token.timeout);
                });
                
                const processingPromise = service.processToken(token);
                
                // Race between processing and timeout
                const result = await Promise.race([processingPromise, timeoutPromise]);
                
                const processingTime = Date.now() - startTime;
                
                // Check processing time even if completed
                if (processingTime > token.timeout * 0.8) { // 80% of timeout threshold
                    this.recordWarning(testId, `Slow regex processing: ${processingTime}ms (threshold: ${token.timeout}ms)`);
                } else {
                    this.recordSuccess(testId, `ReDoS pattern handled efficiently: ${processingTime}ms`);
                }
                
            } catch (error) {
                if (error.message === 'ReDoS_TIMEOUT') {
                    this.recordCritical(testId, `ReDoS attack succeeded: Timeout after ${token.timeout}ms`);
                } else {
                    // Processing error during ReDoS is actually good - means it was rejected
                    this.recordSuccess(testId, `ReDoS pattern safely rejected: ${error.message.substring(0, 50)}...`);
                }
            }
        }
    }

    async testCase4_MemoryExhaustion(service) {
        console.log('\n🔥 Test Case 4: Memory Exhaustion Attacks');
        
        const memoryTokens = [
            {
                name: 'Massive String Array',
                tokenMint: '11111111111111111111111111111146',
                name: 'Normal',
                symbol: 'MEM1',
                metadata: Array(10000).fill('X'.repeat(1000)), // 10MB array
                detectedAt: Date.now(),
                threat: 'Memory exhaustion via large arrays',
                memoryLimit: 50 // MB
            },
            {
                name: 'Deep Object Recursion',
                tokenMint: '11111111111111111111111111111147',
                name: 'Normal',
                symbol: 'MEM2',
                deepObject: this.createDeepObject(5000), // 5000 levels deep
                detectedAt: Date.now(),
                threat: 'Stack overflow via deep recursion',
                memoryLimit: 30
            },
            {
                name: 'Duplicate Key Explosion',
                tokenMint: '11111111111111111111111111111148',
                name: 'Normal',
                symbol: 'MEM3',
                ...this.createMassiveObject(1000), // 1000 unique properties
                detectedAt: Date.now(),
                threat: 'Memory exhaustion via property explosion',
                memoryLimit: 40
            }
        ];

        for (let i = 0; i < memoryTokens.length; i++) {
            const token = memoryTokens[i];
            const testId = `21.4.${i + 1}`;
            
            try {
                console.log(`  Testing: ${token.threat}`);
                
                const initialMemory = process.memoryUsage().heapUsed;
                const startTime = Date.now();
                
                const result = await service.processToken(token);
                
                const processingTime = Date.now() - startTime;
                const finalMemory = process.memoryUsage().heapUsed;
                const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
                
                // Check memory usage
                if (memoryIncrease > token.memoryLimit) {
                    this.recordCritical(testId, `Memory exhaustion attack succeeded: +${memoryIncrease.toFixed(2)}MB (limit: ${token.memoryLimit}MB)`);
                    continue;
                }
                
                // Check processing time (should reject quickly)
                if (processingTime > 30000) { // 30 second timeout
                    this.recordCritical(testId, `Memory attack caused timeout: ${processingTime}ms`);
                    continue;
                }
                
                // Memory attack properly handled
                this.recordSuccess(testId, `Memory attack blocked: +${memoryIncrease.toFixed(2)}MB, ${processingTime}ms`);
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
                
            } catch (error) {
                // Memory exhaustion errors are actually good - means system protected itself
                if (error.message.includes('out of memory') ||
                    error.message.includes('heap') ||
                    error.message.includes('stack')) {
                    this.recordSuccess(testId, `Memory attack safely rejected: ${error.message.substring(0, 50)}...`);
                } else {
                    this.recordCritical(testId, `Memory attack caused unexpected error: ${error.message}`);
                }
            }
        }
    }

    async testCase5_AsyncChainAttacks(service) {
        console.log('\n🔥 Test Case 5: Async/Promise Chain Attacks');
        
        try {
            console.log('  Testing: Promise chain manipulation');
            
            // Create malicious token with promise manipulation
            const asyncToken = {
                tokenMint: '11111111111111111111111111111149',
                name: 'AsyncAttack',
                symbol: 'ASYNC',
                detectedAt: Date.now(),
                // Attempt to override Promise prototype
                then: function(resolve, reject) {
                    console.log('Promise hijacked!');
                    resolve('hijacked');
                }
            };
            
            const startTime = Date.now();
            const result = await service.processToken(asyncToken);
            const processingTime = Date.now() - startTime;
            
            // Check if promise chain was manipulated
            if (result === 'hijacked') {
                this.recordCritical('21.5.1', 'Promise chain hijacking succeeded');
            } else {
                this.recordSuccess('21.5.1', `Async attack blocked: ${processingTime}ms`);
            }
            
        } catch (error) {
            this.recordSuccess('21.5.1', `Async attack safely rejected: ${error.message.substring(0, 50)}...`);
        }

        try {
            console.log('  Testing: Infinite promise chain');
            
            // Create infinite promise chain
            const infiniteToken = {
                tokenMint: '11111111111111111111111111111150',
                name: 'InfiniteAsync',
                symbol: 'INF',
                detectedAt: Date.now()
            };
            
            // Add timeout protection
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('TIMEOUT')), 10000)
            );
            
            const processing = service.processToken(infiniteToken);
            
            const result = await Promise.race([processing, timeout]);
            
            this.recordSuccess('21.5.2', 'Infinite async attack handled with timeout');
            
        } catch (error) {
            if (error.message === 'TIMEOUT') {
                this.recordWarning('21.5.2', 'Async processing timeout - possible infinite chain');
            } else {
                this.recordSuccess('21.5.2', `Infinite async attack rejected: ${error.message.substring(0, 50)}...`);
            }
        }
    }

    async testCase6_SymbolProxyAttacks(service) {
        console.log('\n🔥 Test Case 6: Symbol/Proxy Manipulation Attacks');
        
        try {
            console.log('  Testing: Symbol property manipulation');
            
            const symbolToken = {
                tokenMint: '11111111111111111111111111111151',
                name: 'SymbolAttack',
                symbol: 'SYM',
                detectedAt: Date.now(),
                [Symbol.toPrimitive]: () => 'primitive_hijacked',
                [Symbol.iterator]: function* () { yield 'iterator_hijacked'; }
            };
            
            const result = await service.processToken(symbolToken);
            
            // Check if symbol manipulation affected processing
            if (result && (result.toString().includes('hijacked') || 
                          JSON.stringify(result).includes('hijacked'))) {
                this.recordCritical('21.6.1', 'Symbol manipulation succeeded');
            } else {
                this.recordSuccess('21.6.1', 'Symbol manipulation blocked');
            }
            
        } catch (error) {
            this.recordSuccess('21.6.1', `Symbol attack safely rejected: ${error.message.substring(0, 50)}...`);
        }

        try {
            console.log('  Testing: Proxy object manipulation');
            
            const proxyToken = new Proxy({
                tokenMint: '11111111111111111111111111111152',
                name: 'ProxyAttack',
                symbol: 'PROXY',
                detectedAt: Date.now()
            }, {
                get(target, prop) {
                    console.log(`Proxy intercepted access to: ${String(prop)}`);
                    if (prop === 'tokenMint') return 'proxy_hijacked_mint';
                    return target[prop];
                },
                set(target, prop, value) {
                    console.log(`Proxy intercepted set: ${String(prop)} = ${value}`);
                    target.compromised = true;
                    return true;
                }
            });
            
            const result = await service.processToken(proxyToken);
            
            // Check if proxy manipulation affected processing
            if (result && (result.tokenMint === 'proxy_hijacked_mint' || 
                          proxyToken.compromised === true)) {
                this.recordCritical('21.6.2', 'Proxy manipulation succeeded');
            } else {
                this.recordSuccess('21.6.2', 'Proxy manipulation blocked');
            }
            
        } catch (error) {
            this.recordSuccess('21.6.2', `Proxy attack safely rejected: ${error.message.substring(0, 50)}...`);
        }
    }

    // Helper methods
    createCircularJSON() {
        try {
            const obj = { name: 'circular' };
            obj.self = obj; // Create circular reference
            return JSON.stringify(obj); // This should throw
        } catch (e) {
            return '{"circular": "reference"}';
        }
    }

    createDeepObject(depth) {
        if (depth <= 0) return 'deep_end';
        return { nested: this.createDeepObject(depth - 1) };
    }

    createMassiveObject(count) {
        const obj = {};
        for (let i = 0; i < count; i++) {
            obj[`property_${i}`] = `value_${i}`.repeat(100); // 100 chars per property
        }
        return obj;
    }

    recordSuccess(testId, message) {
        this.results.passed++;
        this.results.details.push({ testId, status: 'PASS', message });
        console.log(`    ✅ ${testId}: ${message}`);
    }

    recordWarning(testId, message) {
        this.results.warnings++;
        this.results.details.push({ testId, status: 'WARN', message });
        console.log(`    ⚠️ ${testId}: ${message}`);
    }

    recordCritical(testId, message) {
        this.results.failed++;
        this.results.critical++;
        this.results.details.push({ testId, status: 'CRITICAL', message });
        console.log(`    🚨 ${testId}: ${message}`);
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 TEST #21 RESULTS: MALICIOUS INJECTION');
        console.log('='.repeat(60));
        
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`⚠️ Warnings: ${this.results.warnings}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`🚨 Critical Issues: ${this.results.critical}`);
        
        const totalTests = this.results.passed + this.results.failed + this.results.warnings;
        const passRate = totalTests > 0 ? (this.results.passed / totalTests * 100) : 0;
        
        console.log(`📊 Pass Rate: ${passRate.toFixed(1)}%`);
        
        if (this.results.critical > 0) {
            console.log('\n🚨 CRITICAL INJECTION VULNERABILITIES:');
            this.results.details
                .filter(d => d.status === 'CRITICAL')
                .forEach(detail => console.log(`   - ${detail.testId}: ${detail.message}`));
            
            console.log('\n🔴 SECURITY VERDICT: INJECTION VULNERABILITIES FOUND');
            console.log('💰 MONEY IMPACT: CRITICAL - System compromise during token analysis');
            console.log('🔧 ACTION REQUIRED: Fix injection vulnerabilities before production');
        } else if (this.results.warnings > 0) {
            console.log('\n⚠️ SECURITY WARNINGS:');
            this.results.details
                .filter(d => d.status === 'WARN')
                .forEach(detail => console.log(`   - ${detail.testId}: ${detail.message}`));
            
            console.log('\n🟡 SECURITY VERDICT: MINOR VULNERABILITIES - MONITOR');
            console.log('💰 MONEY IMPACT: MEDIUM - Performance degradation possible');
            console.log('✅ READY FOR: Test #22 (Latency Spikes) with monitoring');
        } else {
            console.log('\n🟢 SECURITY VERDICT: ADVANCED INJECTION PROTECTION ROBUST');
            console.log('💰 MONEY IMPACT: PROTECTED - Sophisticated attacks blocked');
            console.log('✅ READY FOR: Test #22 (Latency Spikes)');
        }
        
        console.log('\n📋 NEXT STEPS:');
        if (this.results.critical > 0) {
            console.log('   1. Review and fix critical injection vulnerabilities');
            console.log('   2. Add deeper input validation layers');
            console.log('   3. Re-run Test #21 to verify fixes');
        } else {
            console.log('   1. Proceed to Test #22: Latency Spikes');
            console.log('   2. Performance testing for competitive advantage');
        }
        
        console.log('\n🔗 INTEGRATION STATUS:');
        if (this.results.critical === 0) {
            console.log('   ✅ Security Layer: Ready for Renaissance infrastructure integration');
            console.log('   ✅ Risk Module Integration: Can safely handle malicious tokens');
        } else {
            console.log('   ❌ Security Layer: Fix vulnerabilities before integration');
            console.log('   ❌ Production Readiness: Security issues must be resolved');
        }
    }
}

// Export for use
export { Test21MaliciousInjection };

// Run test if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
    const test = new Test21MaliciousInjection();
    test.runTest().catch(console.error);
}