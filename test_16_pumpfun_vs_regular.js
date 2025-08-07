/**
 * RENAISSANCE TEST #16: PUMP.FUN VS REGULAR TOKEN LOGIC
 * 
 * What: Different processing paths for pump.fun vs regular DEX tokens
 * How: Test both token types through all analysis stages, verify correct classification
 * Why: pump.fun tokens have different risk profiles and graduation mechanics
 * Money Impact: HIGH - Wrong classification = Wrong risk assessment
 * 
 * Run: node test_16_pumpfun_vs_regular.js
 */

import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';
import { performance } from 'perf_hooks';

// Enhanced Mock RPC Manager for token type testing
class TokenTypeRpcManager {
    constructor() {
        this.callHistory = [];
        this.tokenMetadata = new Map();
        this.networkDelay = 50;
    }
    
    async call(method, params) {
        const callStart = performance.now();
        
        // Add realistic network delay
        await this._sleep(this.networkDelay + (Math.random() * 20));
        
        const tokenAddress = params[0];
        const callRecord = {
            timestamp: Date.now(),
            method,
            tokenAddress,
            latency: performance.now() - callStart
        };
        
        this.callHistory.push(callRecord);
        
        // Return appropriate mock response based on method
        if (method === 'getTokenSupply') {
            return this._getTokenSupply(tokenAddress);
        } else if (method === 'getTokenLargestAccounts') {
            return this._getTokenLargestAccounts(tokenAddress);
        } else if (method === 'getAccountInfo') {
            return this._getAccountInfo(tokenAddress);
        }
        
        return { value: {} };
    }
    
    async rotateEndpoint() {
        await this._sleep(10);
    }
    
    // Configure token metadata for testing
    setTokenMetadata(tokenAddress, metadata) {
        this.tokenMetadata.set(tokenAddress, metadata);
    }
    
    _getTokenSupply(tokenAddress) {
        const metadata = this.tokenMetadata.get(tokenAddress) || {};
        return {
            value: {
                amount: metadata.supply || '1000000000',
                decimals: metadata.decimals || 9,
                uiAmount: metadata.uiAmount || 1000
            }
        };
    }
    
    _getTokenLargestAccounts(tokenAddress) {
        const metadata = this.tokenMetadata.get(tokenAddress) || {};
        const accounts = metadata.accounts || [
            { amount: '400000000', owner: 'TestOwner1' },  // 40% creator+early
            { amount: '200000000', owner: 'TestOwner2' },  // 20% early buyers
            { amount: '150000000', owner: 'TestOwner3' },  // 15% community
            { amount: '50000000', owner: 'TestOwner4' },   // 5% later buyers
            { amount: '30000000', owner: 'TestOwner5' }    // 3% retail
        ];
        
        return { value: accounts };
    }
    
    _getAccountInfo(tokenAddress) {
        const metadata = this.tokenMetadata.get(tokenAddress) || {};
        return {
            value: {
                data: {
                    parsed: {
                        info: {
                            decimals: metadata.decimals || 9,
                            supply: metadata.supply || '1000000000',
                            mintAuthority: metadata.hasMintAuthority ? 'SomeAuthority123' : null,
                            freezeAuthority: metadata.hasFreezeAuthority ? 'SomeAuthority456' : null,
                            isInitialized: true
                        }
                    }
                }
            }
        };
    }
    
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getCallStats() {
        return {
            totalCalls: this.callHistory.length,
            avgLatency: this.callHistory.length > 0 ? 
                this.callHistory.reduce((sum, call) => sum + call.latency, 0) / this.callHistory.length : 0,
            methodBreakdown: this.callHistory.reduce((breakdown, call) => {
                breakdown[call.method] = (breakdown[call.method] || 0) + 1;
                return breakdown;
            }, {})
        };
    }
    
    reset() {
        this.callHistory = [];
        this.tokenMetadata.clear();
    }
}

// Helper to generate valid base58 Solana addresses for testing
function generateTestAddress(prefix = '') {
    // Base58 alphabet (no 0, O, I, l)
    const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = prefix;
    const targetLength = 44;
    
    while (result.length < targetLength) {
        result += base58[Math.floor(Math.random() * base58.length)];
    }
    
    return result.substring(0, targetLength);
}

// Token creation utilities
function createPumpFunToken(overrides = {}) {
    const tokenId = overrides.tokenId || Math.random().toString(36).substring(2, 8);
    const baseAddress = generateTestAddress(`Pump${tokenId}`);
    
    return {
        // Core identification
        tokenMint: baseAddress,
        tokenAddress: baseAddress,
        address: baseAddress,
        baseMint: baseAddress,
        
        // Pump.fun specific identifiers
        programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
        dex: 'pump.fun',
        bondingCurve: `curve${tokenId}XYZ789ABC123`,
        graduated: false,
        
        // Financial metrics (typical pump.fun ranges)
        lpValueUSD: 2500, // Lower liquidity typical for pump.fun
        marketCapUSD: 15000,
        volume24h: 5000,
        
        // Trading characteristics
        uniqueWallets: 35,
        buyToSellRatio: 4.2, // Higher buy ratio common in pump.fun
        avgTransactionSpread: 3,
        transactionSizeVariation: 0.35,
        
        // Token metadata
        name: `Pump Token ${tokenId}`,
        symbol: `PUMP${tokenId.substring(0, 2).toUpperCase()}`,
        detectedAt: Date.now() - (Math.random() * 600000), // 0-10 minutes ago
        ageMinutes: Math.floor(Math.random() * 10),
        
        // Pump.fun lifecycle
        initialBuy: 0.5, // SOL
        currentStage: 'building',
        graduationProgress: Math.random() * 0.8, // 0-80% towards graduation
        
        ...overrides
    };
}

function createRegularDexToken(overrides = {}) {
    const tokenId = overrides.tokenId || Math.random().toString(36).substring(2, 8);
    const baseAddress = generateTestAddress(`Reg${tokenId}`);
    
    return {
        // Core identification
        tokenMint: baseAddress,
        tokenAddress: baseAddress,
        address: baseAddress, 
        baseMint: baseAddress,
        
        // Regular DEX identifiers
        dex: 'raydium',
        poolAddress: `pool${tokenId}XYZ789ABC123`,
        
        // Financial metrics (typical regular DEX ranges)
        lpValueUSD: 25000, // Higher liquidity typical for established DEX
        marketCapUSD: 150000,
        volume24h: 50000,
        
        // Trading characteristics
        uniqueWallets: 150,
        buyToSellRatio: 1.8, // More balanced ratio
        avgTransactionSpread: 8,
        transactionSizeVariation: 0.6,
        
        // Token metadata
        name: `Regular Token ${tokenId}`,
        symbol: `REG${tokenId.substring(0, 2).toUpperCase()}`,
        detectedAt: Date.now() - (Math.random() * 3600000), // 0-60 minutes ago
        ageMinutes: Math.floor(Math.random() * 60) + 15, // 15-75 minutes old
        
        ...overrides
    };
}

function createGraduatedPumpFunToken(overrides = {}) {
    const pumpToken = createPumpFunToken(overrides);
    return {
        ...pumpToken,
        graduated: true,
        currentStage: 'graduated',
        graduationProgress: 1.0,
        lpValueUSD: 85000, // Post-graduation liquidity
        marketCapUSD: 500000,
        volume24h: 200000,
        uniqueWallets: 300,
        dex: 'raydium', // Often moves to Raydium after graduation
        ageMinutes: Math.floor(Math.random() * 30) + 5, // 5-35 minutes old
        ...overrides
    };
}

// Classification verification utilities
class TokenClassificationVerifier {
    constructor() {
        this.classifications = [];
    }
    
    recordClassification(tokenData, result) {
        this.classifications.push({
            timestamp: Date.now(),
            tokenType: this._detectExpectedType(tokenData),
            actualClassification: this._extractClassification(result),
            tokenData,
            result,
            correct: this._isCorrectClassification(tokenData, result)
        });
    }
    
    _detectExpectedType(tokenData) {
        if (tokenData.programId === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P' || 
            tokenData.dex === 'pump.fun') {
            return tokenData.graduated ? 'graduated-pumpfun' : 'pumpfun';
        }
        return 'regular-dex';
    }
    
    _extractClassification(result) {
        if (!result || !result.tokenMetrics) return 'unknown';
        
        const metrics = result.tokenMetrics;
        if (metrics.isPumpFun) {
            return metrics.pumpFunDetails?.graduated ? 'graduated-pumpfun' : 'pumpfun';
        }
        return 'regular-dex';
    }
    
    _isCorrectClassification(tokenData, result) {
        const expected = this._detectExpectedType(tokenData);
        const actual = this._extractClassification(result);
        return expected === actual;
    }
    
    getAccuracy() {
        if (this.classifications.length === 0) return 0;
        const correct = this.classifications.filter(c => c.correct).length;
        return (correct / this.classifications.length) * 100;
    }
    
    getClassificationBreakdown() {
        const breakdown = {};
        this.classifications.forEach(c => {
            const key = `${c.tokenType} → ${c.actualClassification}`;
            breakdown[key] = (breakdown[key] || 0) + 1;
        });
        return breakdown;
    }
    
    getErrors() {
        return this.classifications
            .filter(c => !c.correct)
            .map(c => ({
                expected: c.tokenType,
                actual: c.actualClassification,
                tokenName: c.tokenData.name,
                tokenAddress: c.tokenData.address
            }));
    }
}

// Risk assessment comparison utilities
class RiskAssessmentComparator {
    constructor() {
        this.assessments = [];
    }
    
    recordAssessment(tokenType, tokenData, result) {
        if (!result || typeof result.approved === 'undefined') return;
        
        this.assessments.push({
            tokenType,
            tokenAddress: tokenData.address,
            tokenName: tokenData.name,
            approved: result.approved,
            confidence: result.confidence || 0,
            reason: result.reason || 'unknown',
            classification: result.renaissanceClassification || {},
            processingTime: result.processingTimeMs || 0,
            timestamp: Date.now()
        });
    }
    
    compareRiskProfiles() {
        const pumpfunTokens = this.assessments.filter(a => a.tokenType.includes('pumpfun'));
        const regularTokens = this.assessments.filter(a => a.tokenType === 'regular-dex');
        
        return {
            pumpfun: this._calculateProfile(pumpfunTokens),
            regular: this._calculateProfile(regularTokens),
            comparison: this._compareProfiles(pumpfunTokens, regularTokens)
        };
    }
    
    _calculateProfile(tokens) {
        if (tokens.length === 0) return null;
        
        const approved = tokens.filter(t => t.approved);
        const rejected = tokens.filter(t => !t.approved);
        
        return {
            total: tokens.length,
            approved: approved.length,
            rejected: rejected.length,
            approvalRate: (approved.length / tokens.length) * 100,
            avgConfidence: tokens.reduce((sum, t) => sum + t.confidence, 0) / tokens.length,
            avgProcessingTime: tokens.reduce((sum, t) => sum + t.processingTime, 0) / tokens.length,
            commonReasons: this._getCommonReasons(tokens)
        };
    }
    
    _compareProfiles(pumpfun, regular) {
        if (!pumpfun.length || !regular.length) return null;
        
        const pumpProfile = this._calculateProfile(pumpfun);
        const regProfile = this._calculateProfile(regular);
        
        return {
            approvalRateDiff: pumpProfile.approvalRate - regProfile.approvalRate,
            confidenceDiff: pumpProfile.avgConfidence - regProfile.avgConfidence,
            processingTimeDiff: pumpProfile.avgProcessingTime - regProfile.avgProcessingTime,
            riskAdjustment: pumpProfile.approvalRate < regProfile.approvalRate ? 'higher-risk' : 'lower-risk'
        };
    }
    
    _getCommonReasons(tokens) {
        const reasons = {};
        tokens.forEach(t => {
            reasons[t.reason] = (reasons[t.reason] || 0) + 1;
        });
        
        return Object.entries(reasons)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([reason, count]) => ({ reason, count, percentage: (count / tokens.length) * 100 }));
    }
}

// Test Results Tracking
class TestResults {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.classificationStats = null;
        this.riskComparisonStats = null;
    }
    
    add(name, passed, details = {}) {
        this.tests.push({ 
            name, 
            passed, 
            details,
            timestamp: Date.now() 
        });
        if (passed) {
            this.passed++;
        } else {
            this.failed++;
        }
    }
    
    setClassificationStats(stats) {
        this.classificationStats = stats;
    }
    
    setRiskComparisonStats(stats) {
        this.riskComparisonStats = stats;
    }
    
    summary() {
        console.log('\n=== TEST #16: PUMP.FUN VS REGULAR TOKEN LOGIC RESULTS ===');
        console.log(`Total Tests: ${this.tests.length}`);
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
        
        // Classification accuracy summary
        if (this.classificationStats) {
            console.log(`\n🎯 CLASSIFICATION ACCURACY:`);
            console.log(`  Overall Accuracy: ${this.classificationStats.accuracy.toFixed(1)}%`);
            console.log(`  Total Classifications: ${this.classificationStats.totalClassifications}`);
            
            if (this.classificationStats.errors.length > 0) {
                console.log(`  Misclassifications: ${this.classificationStats.errors.length}`);
                this.classificationStats.errors.slice(0, 3).forEach(error => {
                    console.log(`    - Expected: ${error.expected}, Got: ${error.actual} (${error.tokenName})`);
                });
            }
        }
        
        // Risk assessment comparison
        if (this.riskComparisonStats) {
            console.log(`\n⚖️ RISK ASSESSMENT COMPARISON:`);
            const { pumpfun, regular, comparison } = this.riskComparisonStats;
            
            if (pumpfun && regular) {
                console.log(`  Pump.fun Tokens: ${pumpfun.approvalRate.toFixed(1)}% approval rate`);
                console.log(`  Regular Tokens: ${regular.approvalRate.toFixed(1)}% approval rate`);
                console.log(`  Risk Adjustment: ${comparison.riskAdjustment}`);
                console.log(`  Processing Time Diff: ${comparison.processingTimeDiff.toFixed(1)}ms`);
            }
        }
        
        if (this.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.tests.filter(t => !t.passed).forEach(test => {
                const error = test.details.error || test.details.reason || 'Unknown failure';
                console.log(`  - ${test.name}: ${error}`);
            });
        }
        
        // Deployment recommendation
        console.log('\n🚨 DEPLOYMENT DECISION:');
        const classificationAccurate = !this.classificationStats || this.classificationStats.accuracy >= 90;
        const riskDifferentiated = !this.riskComparisonStats || 
            Math.abs(this.riskComparisonStats.comparison?.approvalRateDiff || 0) > 5;
        
        if (this.failed === 0 && classificationAccurate && riskDifferentiated) {
            console.log('✅ DEPLOY IMMEDIATELY - Accurate token classification with proper risk differentiation');
        } else if (this.failed <= 2 && classificationAccurate) {
            console.log('⚠️ DEPLOY WITH MONITORING - Good classification but monitor risk differentiation');
        } else if (!classificationAccurate) {
            console.log('🚫 DO NOT DEPLOY - Poor token classification will cause wrong risk assessment');
        } else {
            console.log('🚫 DO NOT DEPLOY - Token type logic insufficient for accurate risk assessment');
        }
    }
}

// Main test execution
async function runTest16() {
    console.log('🚀 Starting Renaissance Test #16: Pump.fun vs Regular Token Logic');
    console.log('Target: Different processing paths for pump.fun vs regular DEX tokens');
    console.log('Money Impact: HIGH - Wrong classification = Wrong risk assessment\n');
    
    const results = new TestResults();
    const mockRpc = new TokenTypeRpcManager();
    const classifier = new TokenClassificationVerifier();
    const riskComparator = new RiskAssessmentComparator();
    
    // Initialize filter service
    const filterService = new TieredTokenFilterService({
        rpcManager: mockRpc
    });
    
    await filterService.initialize();
    
    try {
        // ==================== TEST 16.1: Pump.fun Token Detection ====================
        console.log('🎯 Test 16.1: Pump.fun Token Detection');
        
        try {
            // Test 16.1.1: Basic Pump.fun Detection
            const pumpTokens = Array.from({ length: 5 }, (_, i) => 
                createPumpFunToken({ tokenId: `pump${i}` })
            );
            
            let pumpDetectionCount = 0;
            
            for (const token of pumpTokens) {
                // Configure RPC metadata for this token
                // Pump.fun tokens typically have renounced authority for trust
                mockRpc.setTokenMetadata(token.address, {
                    supply: '1000000000',
                    decimals: 9,
                    hasMintAuthority: true,   // Realistic: 70% of pump.fun have active authority
                    hasFreezeAuthority: true   // Realistic: 85% of pump.fun have freeze authority
                });
                
                const result = await filterService.processToken(token);
                
                // Record classification
                classifier.recordClassification(token, result);
                riskComparator.recordAssessment('pumpfun', token, result);
                
                // Check if properly detected as pump.fun
                if (result?.tokenMetrics?.isPumpFun) {
                    pumpDetectionCount++;
                }
            }
            
            const pumpDetectionAccurate = pumpDetectionCount >= 4; // At least 80% accurate
            
            results.add('16.1.1 - Pump.fun token detection', pumpDetectionAccurate, {
                detected: pumpDetectionCount,
                total: pumpTokens.length,
                accuracy: (pumpDetectionCount / pumpTokens.length) * 100,
                error: pumpDetectionAccurate ? null : `Only ${pumpDetectionCount}/${pumpTokens.length} pump.fun tokens detected`
            });
            
            console.log(`  ${pumpDetectionAccurate ? '✅' : '❌'} Pump.fun detection: ${pumpDetectionCount}/5 tokens correctly identified`);
            
        } catch (error) {
            results.add('16.1.1 - Pump.fun token detection', false, { error: error.message });
            console.log(`  ❌ Pump.fun detection test failed: ${error.message}`);
        }
        
        try {
            // Test 16.1.2: Pump.fun Stage Classification
            const stageTokens = [
                createPumpFunToken({ tokenId: 'early', lpValueUSD: 800, currentStage: 'early' }),
                createPumpFunToken({ tokenId: 'build', lpValueUSD: 5000, currentStage: 'building' }),
                createPumpFunToken({ tokenId: 'momentum', lpValueUSD: 25000, currentStage: 'momentum' }),
                createPumpFunToken({ tokenId: 'grad', lpValueUSD: 60000, currentStage: 'graduating' })
            ];
            
            let stageAccuracy = 0;
            
            for (const token of stageTokens) {
                mockRpc.setTokenMetadata(token.address, {
                    supply: '1000000000',
                    decimals: 9,
                    hasMintAuthority: false, // Renounced for higher stages
                    hasFreezeAuthority: false
                });
                
                const result = await filterService.processToken(token);
                
                // Check if stage detection is reasonable based on liquidity
                const detectedStage = result?.tokenMetrics?.pumpFunDetails?.currentStage;
                const expectedStage = _mapLiquidityToStage(token.lpValueUSD);
                
                if (detectedStage === expectedStage || _isReasonableStage(detectedStage, token.lpValueUSD)) {
                    stageAccuracy++;
                }
                
                classifier.recordClassification(token, result);
            }
            
            const stageClassificationGood = stageAccuracy >= 3; // At least 75% accurate
            
            results.add('16.1.2 - Pump.fun stage classification', stageClassificationGood, {
                accurate: stageAccuracy,
                total: stageTokens.length,
                error: stageClassificationGood ? null : `Stage classification only ${stageAccuracy}/4 accurate`
            });
            
            console.log(`  ${stageClassificationGood ? '✅' : '❌'} Stage classification: ${stageAccuracy}/4 stages correctly identified`);
            
        } catch (error) {
            results.add('16.1.2 - Pump.fun stage classification', false, { error: error.message });
            console.log(`  ❌ Stage classification test failed: ${error.message}`);
        }
        
        // ==================== TEST 16.2: Regular DEX Token Processing ====================
        console.log('\n🏛️ Test 16.2: Regular DEX Token Processing');
        
        try {
            // Test 16.2.1: Regular Token Classification
            const regularTokens = Array.from({ length: 5 }, (_, i) => 
                createRegularDexToken({ tokenId: `reg${i}` })
            );
            
            let regularDetectionCount = 0;
            
            for (const token of regularTokens) {
                mockRpc.setTokenMetadata(token.address, {
                    supply: '1000000000',
                    decimals: 9,
                    hasMintAuthority: false, // Regular tokens typically renounced
                    hasFreezeAuthority: false
                });
                
                const result = await filterService.processToken(token);
                
                classifier.recordClassification(token, result);
                riskComparator.recordAssessment('regular-dex', token, result);
                
                // Check if NOT detected as pump.fun (should be regular)
                if (!result?.tokenMetrics?.isPumpFun) {
                    regularDetectionCount++;
                }
            }
            
            const regularDetectionAccurate = regularDetectionCount >= 4;
            
            results.add('16.2.1 - Regular token classification', regularDetectionAccurate, {
                detected: regularDetectionCount,
                total: regularTokens.length,
                accuracy: (regularDetectionCount / regularTokens.length) * 100,
                error: regularDetectionAccurate ? null : `Only ${regularDetectionCount}/${regularTokens.length} regular tokens classified correctly`
            });
            
            console.log(`  ${regularDetectionAccurate ? '✅' : '❌'} Regular token classification: ${regularDetectionCount}/5 tokens correctly identified as non-pump.fun`);
            
        } catch (error) {
            results.add('16.2.1 - Regular token classification', false, { error: error.message });
            console.log(`  ❌ Regular token classification failed: ${error.message}`);
        }
        
        // ==================== TEST 16.3: Graduated Pump.fun Tokens ====================
        console.log('\n🎓 Test 16.3: Graduated Pump.fun Token Handling');
        
        try {
            // Test 16.3.1: Graduation Detection
            const graduatedTokens = Array.from({ length: 3 }, (_, i) => 
                createGraduatedPumpFunToken({ tokenId: `grad${i}` })
            );
            
            let graduationDetectionCount = 0;
            
            for (const token of graduatedTokens) {
                mockRpc.setTokenMetadata(token.address, {
                    supply: '1000000000',
                    decimals: 9,
                    hasMintAuthority: token.graduated ? false : true,  // Graduated tokens renounce
                    hasFreezeAuthority: token.graduated ? false : true  // Authority upon graduation
                });
                
                const result = await filterService.processToken(token);
                
                classifier.recordClassification(token, result);
                riskComparator.recordAssessment('graduated-pumpfun', token, result);
                
                // Check if detected as graduated pump.fun
                const isDetectedGraduated = result?.tokenMetrics?.pumpFunDetails?.graduated === true ||
                                          result?.tokenMetrics?.pumpFunDetails?.currentStage === 'graduated';
                
                if (isDetectedGraduated) {
                    graduationDetectionCount++;
                }
            }
            
            const graduationDetectionGood = graduationDetectionCount >= 2;
            
            results.add('16.3.1 - Graduation status detection', graduationDetectionGood, {
                detected: graduationDetectionCount,
                total: graduatedTokens.length,
                error: graduationDetectionGood ? null : `Graduation detection: ${graduationDetectionCount}/3`
            });
            
            console.log(`  ${graduationDetectionGood ? '✅' : '❌'} Graduation detection: ${graduationDetectionCount}/3 graduated tokens identified`);
            
        } catch (error) {
            results.add('16.3.1 - Graduation status detection', false, { error: error.message });
            console.log(`  ❌ Graduation detection test failed: ${error.message}`);
        }
        
        // ==================== TEST 16.4: Risk Profile Differentiation ====================
        console.log('\n⚖️ Test 16.4: Risk Profile Differentiation');
        
        try {
            // Test 16.4.1: Compare approval rates between token types
            const riskProfiles = riskComparator.compareRiskProfiles();
            
            const hasRiskDifferentiation = riskProfiles.comparison && 
                Math.abs(riskProfiles.comparison.approvalRateDiff) > 5; // At least 5% difference
            
            const pumpfunRiskAware = riskProfiles.pumpfun && 
                (riskProfiles.pumpfun.approvalRate < 90 || // Either lower approval rate
                 riskProfiles.pumpfun.avgConfidence < 0.8); // Or lower confidence scores
            
            results.add('16.4.1 - Risk profile differentiation', hasRiskDifferentiation && pumpfunRiskAware, {
                pumpfunApprovalRate: riskProfiles.pumpfun?.approvalRate || 0,
                regularApprovalRate: riskProfiles.regular?.approvalRate || 0,
                approvalRateDiff: riskProfiles.comparison?.approvalRateDiff || 0,
                riskAdjustment: riskProfiles.comparison?.riskAdjustment || 'none',
                error: hasRiskDifferentiation ? null : 'No meaningful risk differentiation between token types'
            });
            
            console.log(`  ${hasRiskDifferentiation && pumpfunRiskAware ? '✅' : '❌'} Risk differentiation: ${riskProfiles.comparison?.approvalRateDiff?.toFixed(1) || 0}% approval rate difference`);
            
        } catch (error) {
            results.add('16.4.1 - Risk profile differentiation', false, { error: error.message });
            console.log(`  ❌ Risk differentiation test failed: ${error.message}`);
        }
        
        // ==================== TEST 16.5: Processing Performance Comparison ====================
        console.log('\n⚡ Test 16.5: Processing Performance Comparison');
        
        try {
            // Test 16.5.1: Processing time consistency
            const performanceTokens = [
                ...Array.from({ length: 5 }, (_, i) => ({ type: 'pumpfun', token: createPumpFunToken({ tokenId: `perf_p${i}` }) })),
                ...Array.from({ length: 5 }, (_, i) => ({ type: 'regular', token: createRegularDexToken({ tokenId: `perf_r${i}` }) }))
            ];
            
            const processingTimes = [];
            let allProcessedSuccessfully = 0;
            
            for (const { type, token } of performanceTokens) {
                mockRpc.setTokenMetadata(token.address, {
                    supply: '1000000000',
                    decimals: 9,
                    hasMintAuthority: false, // Safe tokens have renounced authority
                    hasFreezeAuthority: false
                });
                
                const start = performance.now();
                const result = await filterService.processToken(token);
                const processingTime = performance.now() - start;
                
                processingTimes.push({ type, processingTime, success: result && typeof result.approved === 'boolean' });
                
                if (result && typeof result.approved === 'boolean') {
                    allProcessedSuccessfully++;
                }
            }
            
            const avgPumpTime = processingTimes.filter(p => p.type === 'pumpfun').reduce((sum, p) => sum + p.processingTime, 0) / 5;
            const avgRegularTime = processingTimes.filter(p => p.type === 'regular').reduce((sum, p) => sum + p.processingTime, 0) / 5;
            const processingConsistent = Math.abs(avgPumpTime - avgRegularTime) < 1000; // Within 1 second
            const allProcessedWell = allProcessedSuccessfully >= 8; // At least 80% success
            
            results.add('16.5.1 - Processing performance consistency', processingConsistent && allProcessedWell, {
                avgPumpfunTime: Math.round(avgPumpTime),
                avgRegularTime: Math.round(avgRegularTime),
                timeDifference: Math.round(Math.abs(avgPumpTime - avgRegularTime)),
                processedSuccessfully: allProcessedSuccessfully,
                error: processingConsistent ? null : `Processing time difference: ${Math.round(Math.abs(avgPumpTime - avgRegularTime))}ms`
            });
            
            console.log(`  ${processingConsistent && allProcessedWell ? '✅' : '❌'} Performance: Pump.fun ${Math.round(avgPumpTime)}ms, Regular ${Math.round(avgRegularTime)}ms, ${allProcessedSuccessfully}/10 successful`);
            
        } catch (error) {
            results.add('16.5.1 - Processing performance consistency', false, { error: error.message });
            console.log(`  ❌ Performance comparison failed: ${error.message}`);
        }
        
        // ==================== TEST 16.6: Edge Cases and Boundary Conditions ====================
        console.log('\n🔍 Test 16.6: Edge Cases and Boundary Conditions');
        
        try {
            // Test 16.6.1: Ambiguous token classification
            const edgeCaseTokens = [
                createPumpFunToken({ tokenId: 'edge1', programId: 'DifferentProgram123', dex: 'pump.fun' }), // Different program ID
                createRegularDexToken({ tokenId: 'edge2', dex: 'pump.fun' }), // Regular token on pump.fun (possible?)
                createPumpFunToken({ tokenId: 'edge3', graduated: true, dex: 'raydium' }), // Graduated and moved
            ];
            
            let edgeCasesHandled = 0;
            
            for (const token of edgeCaseTokens) {
                mockRpc.setTokenMetadata(token.address, {
                    supply: '1000000000',
                    decimals: 9,
                    hasMintAuthority: false,
                    hasFreezeAuthority: false
                });
                
                const result = await filterService.processToken(token);
                
                // Edge cases should be handled gracefully (no crashes, reasonable classification)
                if (result && typeof result.approved === 'boolean') {
                    edgeCasesHandled++;
                }
                
                classifier.recordClassification(token, result);
            }
            
            const edgeCasesHandledWell = edgeCasesHandled === edgeCaseTokens.length;
            
            results.add('16.6.1 - Edge case handling', edgeCasesHandledWell, {
                handled: edgeCasesHandled,
                total: edgeCaseTokens.length,
                error: edgeCasesHandledWell ? null : `Edge cases failed: ${edgeCasesHandled}/${edgeCaseTokens.length}`
            });
            
            console.log(`  ${edgeCasesHandledWell ? '✅' : '❌'} Edge cases: ${edgeCasesHandled}/3 handled without crashes`);
            
        } catch (error) {
            results.add('16.6.1 - Edge case handling', false, { error: error.message });
            console.log(`  ❌ Edge case test failed: ${error.message}`);
        }
        
        // ==================== TEST 16.7: System Health Check ====================
        console.log('\n🏥 Test 16.7: System Health After Token Type Testing');
        
        try {
            const healthCheck = await filterService.healthCheck();
            const healthWorking = healthCheck && typeof healthCheck.healthy === 'boolean';
            const processedTokens = healthCheck?.stats?.processed || 0;
            const hasProcessedSignificant = processedTokens > 20;
            
            results.add('16.7.1 - Health monitoring after token type tests', healthWorking && hasProcessedSignificant, {
                healthy: healthCheck?.healthy,
                processed: processedTokens,
                error: healthWorking ? null : 'Health monitoring failed after token type processing'
            });
            
            console.log(`  ${healthWorking && hasProcessedSignificant ? '✅' : '❌'} Health check: healthy=${healthCheck?.healthy}, processed=${processedTokens}`);
            
        } catch (error) {
            results.add('16.7.1 - Health monitoring after token type tests', false, { error: error.message });
            console.log(`  ❌ Health check failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Test suite execution failed:', error);
        results.add('Test Suite Execution', false, { error: error.message });
    } finally {
        // Collect final statistics
        const classificationStats = {
            accuracy: classifier.getAccuracy(),
            totalClassifications: classifier.classifications.length,
            breakdown: classifier.getClassificationBreakdown(),
            errors: classifier.getErrors()
        };
        
        const riskComparisonStats = riskComparator.compareRiskProfiles();
        
        results.setClassificationStats(classificationStats);
        results.setRiskComparisonStats(riskComparisonStats);
        
        // Cleanup
        try {
            mockRpc.reset();
            await filterService.shutdown();
        } catch (e) {
            console.warn('⚠️ Cleanup warning:', e.message);
        }
    }
    
    // Print results summary
    results.summary();
    
    return results;
}

// Helper methods for stage classification
function _mapLiquidityToStage(lpValueUSD) {
    if (lpValueUSD < 1000) return 'early';
    if (lpValueUSD < 10000) return 'building';
    if (lpValueUSD < 50000) return 'momentum';
    return 'graduating';
}

function _isReasonableStage(detectedStage, lpValueUSD) {
    const expectedStage = _mapLiquidityToStage(lpValueUSD);
    const stageOrder = ['early', 'building', 'momentum', 'graduating'];
    const expectedIndex = stageOrder.indexOf(expectedStage);
    const detectedIndex = stageOrder.indexOf(detectedStage);
    
    // Allow +/- 1 stage tolerance
    return Math.abs(expectedIndex - detectedIndex) <= 1;
}

// Execute tests if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTest16()
        .then(results => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test execution failed:', error);
            process.exit(1);
        });
}

export { runTest16, TokenTypeRpcManager, TokenClassificationVerifier, RiskAssessmentComparator, createPumpFunToken, createRegularDexToken, createGraduatedPumpFunToken };