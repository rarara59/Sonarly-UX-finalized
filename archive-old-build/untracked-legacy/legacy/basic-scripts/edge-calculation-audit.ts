// Edge Calculation Pipeline Audit Script
// Save as: src/scripts/edge-calculation-audit.ts
// This script traces which methods are called during edge calculation

import { ComprehensiveEdgeCalculator } from '../calculators/comprehensive-edge-calculator';

interface MethodCall {
    className: string;
    methodName: string;
    isStubbed: boolean;
    returnValue: any;
    callStack: string;
}

class EdgeCalculationAuditor {
    private methodCalls: MethodCall[] = [];
    private stubbedMethods = [
        // Known stubbed methods from RPC manager
        'calculateLiquidityRatio',
        'getTxCountForWallet',
        'estimateWalletUniqueness', 
        'analyzeVolatility',
        'getVolatilityMetrics',
        // Add more as we discover them
    ];

    private originalConsoleLog = console.log;
    private originalConsoleWarn = console.warn;

    constructor() {
        this.setupMethodTracing();
    }

    private setupMethodTracing() {
        // Override console methods to capture method calls
        console.log = (...args: any[]) => {
            this.captureMethodCall(args);
            this.originalConsoleLog(...args);
        };

        console.warn = (...args: any[]) => {
            this.captureMethodCall(args, true);
            this.originalConsoleWarn(...args);
        };
    }

    private captureMethodCall(args: any[], isWarning: boolean = false) {
        const message = args.join(' ');
        
        // Look for method call patterns
        if (message.includes('TODO:') || message.includes('STUB:') || message.includes('stubbed')) {
            const methodCall: MethodCall = {
                className: this.extractClassName(message),
                methodName: this.extractMethodName(message),
                isStubbed: true,
                returnValue: this.extractReturnValue(message),
                callStack: new Error().stack || 'Unknown'
            };
            this.methodCalls.push(methodCall);
        }
    }

    private extractClassName(message: string): string {
        // Try to extract class name from message
        const classMatch = message.match(/(\w+)\./);
        return classMatch ? classMatch[1] : 'Unknown';
    }

    private extractMethodName(message: string): string {
        // Try to extract method name
        const methodMatch = message.match(/\.(\w+)\(/);
        return methodMatch ? methodMatch[1] : 'Unknown';
    }

    private extractReturnValue(message: string): any {
        // Try to extract return value from stub messages
        if (message.includes('return')) {
            const returnMatch = message.match(/return\s+([^;]+)/);
            return returnMatch ? returnMatch[1].trim() : 'Unknown';
        }
        return null;
    }

    async auditEdgeCalculation(tokenAddress: string): Promise<void> {
        console.log('🔍 STARTING EDGE CALCULATION AUDIT');
        console.log('=====================================\n');
        
        this.methodCalls = []; // Reset for fresh audit
        
        try {
            const calculator = new ComprehensiveEdgeCalculator();
            
            console.log(`🎯 Auditing edge calculation for token: ${tokenAddress}\n`);
            
            // Run edge calculation and capture all method calls
            const result = await calculator.calculateEdge(tokenAddress);
            
            console.log('\n📊 AUDIT RESULTS');
            console.log('================');
            
            this.analyzeMethodCalls();
            this.generateReport(result);
            
        } catch (error) {
            console.error('❌ Audit failed:', error);
            throw error;
        }
    }

    private analyzeMethodCalls() {
        const stubbedCalls = this.methodCalls.filter(call => call.isStubbed);
        
        console.log(`\n🚨 STUBBED METHODS DETECTED: ${stubbedCalls.length}`);
        
        if (stubbedCalls.length > 0) {
            console.log('\nCRITICAL FINDINGS:');
            console.log('==================');
            
            stubbedCalls.forEach((call, index) => {
                console.log(`\n${index + 1}. STUBBED METHOD DETECTED:`);
                console.log(`   Class: ${call.className}`);
                console.log(`   Method: ${call.methodName}`);
                console.log(`   Return Value: ${call.returnValue}`);
                console.log(`   Impact: ${this.assessImpact(call)}`);
            });
        } else {
            console.log('✅ No stubbed methods detected in edge calculation!');
        }
    }

    private assessImpact(call: MethodCall): string {
        const criticalMethods = [
            'calculateLiquidityRatio',
            'estimateWalletUniqueness',
            'analyzeVolatility',
            'getTxCountForWallet'
        ];
        
        if (criticalMethods.includes(call.methodName)) {
            return '🔴 HIGH IMPACT - Affects edge calculation accuracy';
        } else {
            return '🟡 MEDIUM IMPACT - May affect secondary metrics';
        }
    }

    private generateReport(edgeResult: any) {
        console.log('\n📋 EDGE CALCULATION INTEGRITY REPORT');
        console.log('====================================');
        
        const stubbedCalls = this.methodCalls.filter(call => call.isStubbed);
        const highImpactStubs = stubbedCalls.filter(call => 
            this.assessImpact(call).includes('HIGH IMPACT')
        );
        
        console.log(`Final Score: ${edgeResult.finalScore?.toFixed(4) || 'N/A'}`);
        console.log(`Confidence: ${edgeResult.confidence?.toFixed(4) || 'N/A'}`);
        console.log(`Stubbed Methods Called: ${stubbedCalls.length}`);
        console.log(`High Impact Stubs: ${highImpactStubs.length}`);
        
        if (highImpactStubs.length > 0) {
            console.log('\n🚨 VERDICT: EDGE CALCULATION COMPROMISED');
            console.log('========================================');
            console.log('Your 74-76% success rate target is based on stubbed data!');
            console.log('\nCRITICAL ACTIONS NEEDED:');
            
            highImpactStubs.forEach((stub, index) => {
                console.log(`${index + 1}. Implement real ${stub.methodName} logic`);
                console.log(`   Currently returning: ${stub.returnValue}`);
            });
            
            console.log('\n❌ DO NOT PROCEED WITH SUCCESS RATE TESTING');
            console.log('❌ IMPLEMENT CRITICAL METHODS FIRST');
            
        } else if (stubbedCalls.length > 0) {
            console.log('\n🟡 VERDICT: MINOR STUBS DETECTED');
            console.log('================================');
            console.log('Edge calculation mostly accurate, but some secondary metrics stubbed');
            console.log('✅ Safe to proceed with testing, but monitor results');
            
        } else {
            console.log('\n✅ VERDICT: EDGE CALCULATION CLEAN');
            console.log('==================================');
            console.log('No stubbed methods detected in edge calculation pipeline');
            console.log('🎯 Safe to proceed with 74-76% success rate testing');
        }
    }

    cleanup() {
        // Restore original console methods
        console.log = this.originalConsoleLog;
        console.warn = this.originalConsoleWarn;
    }
}

// Additional method to manually check for specific patterns
async function manualStubCheck() {
    console.log('\n🔧 MANUAL STUB DETECTION');
    console.log('========================');
    
    try {
        const calculator = new ComprehensiveEdgeCalculator();
        
        // Test each analysis method individually to see if they call stubs
        const testMethods = [
            'analyzeSmartWallets',
            'analyzeLiquidity', 
            'analyzeHolderVelocity',
            'analyzeTransactionPatterns',
            'analyzeDeepHolderMetrics',
            'analyzeSocialSignals',
            'analyzeTechnicalPatterns',
            'analyzeMarketContext'
        ];
        
        console.log('Testing individual analysis methods for stub usage...\n');
        
        for (const methodName of testMethods) {
            try {
                console.log(`Testing ${methodName}...`);
                
                // Try to call the method if it exists
                const method = (calculator as any)[methodName];
                if (typeof method === 'function') {
                    // Call with sample data
                    const result = await method.call(calculator, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
                    
                    // Check if result looks suspicious (common stub patterns)
                    if (this.looksLikeStub(result)) {
                        console.log(`  🚨 ${methodName} may be using stubbed data`);
                        console.log(`  📊 Result: ${JSON.stringify(result)}`);
                    } else {
                        console.log(`  ✅ ${methodName} appears to use real data`);
                    }
                } else {
                    console.log(`  ❌ ${methodName} method not found`);
                }
            } catch (error) {
                console.log(`  ⚠️ ${methodName} failed: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Manual stub check failed:', error);
    }
}

function looksLikeStub(result: any): boolean {
    // Check for common stub patterns
    if (typeof result === 'number') {
        // Fixed values that are likely stubs
        const suspiciousValues = [0, 0.05, 0.5, 1, 100, 1000];
        return suspiciousValues.includes(result);
    }
    
    if (typeof result === 'object' && result !== null) {
        // Check for all zeros or fixed values in objects
        const values = Object.values(result);
        const allZeros = values.every(v => v === 0);
        const allSame = values.every(v => v === values[0]);
        return allZeros || allSame;
    }
    
    return false;
}

// Main execution
async function main() {
    const auditor = new EdgeCalculationAuditor();
    
    try {
        // Test with a real token address
        const testToken = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
        
        await auditor.auditEdgeCalculation(testToken);
        await manualStubCheck();
        
    } catch (error) {
        console.error('Audit failed:', error);
    } finally {
        auditor.cleanup();
    }
}

if (require.main === module) {
    main();
}