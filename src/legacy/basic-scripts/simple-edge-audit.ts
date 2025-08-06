// Simplified Edge Calculation Audit Script
// Save as: src/scripts/simple-edge-audit.ts

import * as fs from 'fs';
import * as path from 'path';

interface StubDetection {
    file: string;
    method: string;
    stubType: 'hardcoded_return' | 'todo_comment' | 'throw_error';
    stubValue: string;
    lineNumber: number;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

class SimpleEdgeAuditor {
    private detectedStubs: StubDetection[] = [];
    private criticalMethods = [
        'calculateLiquidityRatio',
        'estimateWalletUniqueness',
        'getTxCountForWallet',
        'analyzeVolatility',
        'getVolatilityMetrics'
    ];

    async auditProjectForStubs(): Promise<void> {
        console.log('🔍 AUDITING PROJECT FOR STUBBED METHODS');
        console.log('======================================\n');

        // Look for TypeScript files that might contain stubs (updated with your actual structure)
        const filesToCheck = [
            'src/services/comprehensive-edge-calculator.service.ts',
            'src/services/modular-edge-calculator.service.ts',
            'src/services/edge-calculator-service.ts',
            'src/services/comprehensive-edge-integration.ts',
            'src/services/volatility-analyzer.service.ts',
            'src/services/wallet-metrics.service.ts', 
            'src/services/liquidity-calculator.service.ts'
        ];

        for (const filePath of filesToCheck) {
            await this.auditFile(filePath);
        }

        this.generateReport();
    }

    private async auditFile(filePath: string): Promise<void> {
        try {
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  File not found: ${filePath}`);
                return;
            }

            console.log(`📁 Checking: ${filePath}`);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                this.checkLineForStubs(line, index + 1, filePath);
            });

        } catch (error) {
            console.log(`❌ Error checking ${filePath}: ${error}`);
        }
    }

    private checkLineForStubs(line: string, lineNumber: number, filePath: string): void {
        const trimmedLine = line.trim();

        // Pattern 1: Hardcoded return values (likely stubs)
        if (this.isHardcodedReturn(trimmedLine)) {
            this.detectedStubs.push({
                file: filePath,
                method: this.extractMethodName(trimmedLine),
                stubType: 'hardcoded_return',
                stubValue: this.extractReturnValue(trimmedLine),
                lineNumber,
                impact: this.assessImpact(trimmedLine)
            });
        }

        // Pattern 2: TODO comments indicating stubs
        if (trimmedLine.includes('TODO:') || trimmedLine.includes('STUB:') || trimmedLine.includes('// stub')) {
            this.detectedStubs.push({
                file: filePath,
                method: this.extractMethodFromComment(trimmedLine),
                stubType: 'todo_comment',
                stubValue: trimmedLine,
                lineNumber,
                impact: this.assessImpact(trimmedLine)
            });
        }

        // Pattern 3: Throw new Error (unimplemented methods)
        if (trimmedLine.includes('throw new Error') && 
            (trimmedLine.includes('not implemented') || trimmedLine.includes('TODO'))) {
            this.detectedStubs.push({
                file: filePath,
                method: this.extractMethodFromThrow(trimmedLine),
                stubType: 'throw_error', 
                stubValue: trimmedLine,
                lineNumber,
                impact: this.assessImpact(trimmedLine)
            });
        }
    }

    private isHardcodedReturn(line: string): boolean {
        // Look for suspicious hardcoded returns
        const suspiciousPatterns = [
            /return 0\.05;?\s*$/,     // return 0.05 (5% volatility stub)
            /return 0;?\s*$/,         // return 0
            /return 1;?\s*$/,         // return 1  
            /return 100;?\s*$/,       // return 100
            /return 1000;?\s*$/,      // return 1000
            /return \{\};?\s*$/,      // return {}
            /return \[\];?\s*$/       // return []
        ];

        return suspiciousPatterns.some(pattern => pattern.test(line));
    }

    private extractMethodName(line: string): string {
        // Try to extract method name from the line context
        const methodMatch = line.match(/(\w+)\s*\([^)]*\)\s*[:{]/);
        return methodMatch ? methodMatch[1] : 'Unknown';
    }

    private extractReturnValue(line: string): string {
        const returnMatch = line.match(/return\s+([^;]+)/);
        return returnMatch ? returnMatch[1].trim() : 'Unknown';
    }

    private extractMethodFromComment(line: string): string {
        // Extract method name from TODO comments
        const methodMatch = line.match(/(\w+)\s*\(/);
        return methodMatch ? methodMatch[1] : 'Unknown';
    }

    private extractMethodFromThrow(line: string): string {
        // Extract method context from throw statements
        return 'Unknown';
    }

    private assessImpact(line: string): 'HIGH' | 'MEDIUM' | 'LOW' {
        const criticalKeywords = [
            'liquidity', 'volatility', 'wallet', 'uniqueness', 
            'edge', 'score', 'confidence', 'ratio'
        ];

        const lineText = line.toLowerCase();
        const hasCriticalKeyword = criticalKeywords.some(keyword => 
            lineText.includes(keyword)
        );

        return hasCriticalKeyword ? 'HIGH' : 'MEDIUM';
    }

    private generateReport(): void {
        console.log('\n📋 STUB DETECTION REPORT');
        console.log('========================\n');

        if (this.detectedStubs.length === 0) {
            console.log('✅ No obvious stubs detected in code scan!');
            console.log('🎯 Your edge calculation may be using real data.');
            console.log('\n⚠️  Note: This is a static analysis. Run actual edge calculation to be sure.');
            return;
        }

        const highImpactStubs = this.detectedStubs.filter(stub => stub.impact === 'HIGH');
        const mediumImpactStubs = this.detectedStubs.filter(stub => stub.impact === 'MEDIUM');

        console.log(`Total Stubs Detected: ${this.detectedStubs.length}`);
        console.log(`High Impact: ${highImpactStubs.length}`);
        console.log(`Medium Impact: ${mediumImpactStubs.length}\n`);

        if (highImpactStubs.length > 0) {
            console.log('🚨 HIGH IMPACT STUBS (CRITICAL):');
            console.log('=================================');
            highImpactStubs.forEach((stub, index) => {
                console.log(`\n${index + 1}. ${stub.file}:${stub.lineNumber}`);
                console.log(`   Method: ${stub.method}`);
                console.log(`   Type: ${stub.stubType}`);
                console.log(`   Value: ${stub.stubValue}`);
            });

            console.log('\n❌ VERDICT: EDGE CALCULATION LIKELY COMPROMISED');
            console.log('================================================');
            console.log('Your 74-76% success rate is probably based on stubbed data!');
            console.log('\n🎯 ACTION REQUIRED:');
            console.log('1. Implement the high-impact stubbed methods above');
            console.log('2. Replace hardcoded returns with real calculations');
            console.log('3. Re-test edge calculation after fixes');
        } else {
            console.log('🟡 MEDIUM IMPACT STUBS DETECTED:');
            console.log('=================================');
            mediumImpactStubs.forEach((stub, index) => {
                console.log(`\n${index + 1}. ${stub.file}:${stub.lineNumber}`);
                console.log(`   Method: ${stub.method}`);
                console.log(`   Value: ${stub.stubValue}`);
            });

            console.log('\n🟡 VERDICT: MINOR STUBS DETECTED');
            console.log('=================================');
            console.log('Core edge calculation may be OK, but some methods are stubbed');
            console.log('✅ You can proceed with testing, but monitor results carefully');
        }

        console.log('\n📋 RECOMMENDED NEXT STEPS:');
        console.log('==========================');
        console.log('1. Review each detected stub above');
        console.log('2. Implement critical methods (HIGH impact items)');
        console.log('3. Run actual edge calculation test to verify');
        console.log('4. Only test 74-76% success rate after fixes');
    }
}

// Simple manual check function (doesn't require complex imports)
async function manualServicesCheck(): Promise<void> {
    console.log('\n🔧 MANUAL SERVICES CHECK');
    console.log('========================');

    const servicesToCheck = [
        'src/services/comprehensive-edge-calculator.service.ts',
        'src/services/modular-edge-calculator.service.ts',
        'src/services/edge-calculator-service.ts'
    ];
    
    for (const serviceFile of servicesToCheck) {
        console.log(`\nChecking: ${serviceFile}`);
        
        if (!fs.existsSync(serviceFile)) {
            console.log('❌ File not found');
            continue;
        }

        const content = fs.readFileSync(serviceFile, 'utf8');
        
        // Check for specific stubbed method patterns
        const stubPatterns = [
            { pattern: /return 0\.05/, method: 'volatility analysis', severity: 'HIGH' },
            { pattern: /return 0[;\s]/, method: 'metric calculation', severity: 'MEDIUM' },
            { pattern: /TODO.*implement/i, method: 'unimplemented feature', severity: 'HIGH' },
            { pattern: /STUB/i, method: 'stubbed functionality', severity: 'HIGH' }
        ];

        let foundStubs = false;

        stubPatterns.forEach(({ pattern, method, severity }) => {
            const matches = content.match(new RegExp(pattern, 'g'));
            if (matches) {
                foundStubs = true;
                console.log(`${severity === 'HIGH' ? '🔴' : '🟡'} Found ${matches.length} ${method} stub(s)`);
            }
        });

        if (!foundStubs) {
            console.log('✅ No obvious stubs found');
        }
    }
}

// Main execution
async function main(): Promise<void> {
    console.log('🎯 THORP MVP EDGE CALCULATION AUDIT');
    console.log('===================================\n');

    const auditor = new SimpleEdgeAuditor();
    
    try {
        await auditor.auditProjectForStubs();
        await manualServicesCheck();
        
    } catch (error) {
        console.error('❌ Audit failed:', error);
    }
}

if (require.main === module) {
    main();
}