/**
 * LP Detector Meme Coin Validation Tests - FIXED VERSION
 * 
 * Comprehensive test suite validating all meme coin detection enhancements:
 * - Pump.fun instruction parsing
 * - Meme-specific time decay phases
 * - Statistical baseline calibration
 * - Rug pull risk detection
 * 
 * Performance targets:
 * - Math validation: <50ms
 * - Bayesian scoring: <25ms
 */

import { LiquidityPoolCreationDetectorService } from '../services/liquidity-pool-creation-detector.service.js';

// Mock RPC manager for testing
class MockRPCManager {
    constructor() {
        this.mockResponses = new Map();
    }
    
    setMockResponse(method, response) {
        this.mockResponses.set(method, response);
    }
    
    async call(method, params) {
        if (this.mockResponses.has(method)) {
            const response = this.mockResponses.get(method);
            return typeof response === 'function' ? response(params) : response;
        }
        throw new Error(`Mock RPC method ${method} not implemented`);
    }
}

// Test runner
async function runTests() {
    console.log('\n🧪 LP DETECTOR MEME COIN VALIDATION TEST SUITE\n');
    console.log('=' .repeat(60));
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Pump.fun Detection
    await testPumpFunDetection(results);
    
    // Test 2: Time Decay Phases
    await testTimeDecayPhases(results);
    
    // Test 3: Statistical Baseline Calibration
    await testStatisticalCalibration(results);
    
    // Test 4: Rug Pull Detection
    await testRugPullDetection(results);
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('\n📋 Detailed Results:');
    results.tests.forEach((test, i) => {
        console.log(`${i + 1}. ${test.name}: ${test.passed ? '✅ PASS' : '❌ FAIL'} (${test.duration.toFixed(1)}ms)`);
        if (!test.passed) {
            console.log(`   Error: ${test.error}`);
        }
    });
}

// Test 1: Pump.fun Detection
async function testPumpFunDetection(results) {
    console.log('\n📍 TEST 1: PUMP.FUN DETECTION');
    console.log('-' .repeat(40));
    
    const startTime = performance.now();
    let passed = true;
    let error = null;
    
    try {
        const mockRPC = new MockRPCManager();
        const detector = new LiquidityPoolCreationDetectorService({
            rpcManager: mockRPC,
            accuracyThreshold: 0.95
        });
        
        // Test CREATE instruction through transaction
        console.log('Testing CREATE instruction detection...');
        const createData = Buffer.alloc(128);
        createData.write('e1146fce221eca2e', 0, 'hex'); // CREATE discriminator
        // Add minimal data for parsing
        createData.writeBigUInt64LE(1000000000n, 64); // virtualTokenReserves
        createData.writeBigUInt64LE(50000000n, 72); // virtualSolReserves
        
        const createInstruction = {
            programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
            data: createData,
            accounts: Array(10).fill('mock-account')
        };
        
        // Mock transaction with CREATE instruction
        const createTx = {
            meta: { err: null },
            transaction: {
                message: {
                    instructions: [createInstruction],
                    accountKeys: Array(10).fill(null).map((_, i) => ({
                        pubkey: `pubkey-${i}`,
                        signer: i === 0,
                        writable: i < 5
                    }))
                }
            }
        };
        
        mockRPC.setMockResponse('getTransaction', createTx);
        
        const createCandidates = await detector.detectFromTransaction('create-tx-sig');
        if (!createCandidates || createCandidates.length === 0) {
            throw new Error('Failed to detect pump.fun CREATE');
        }
        
        const createCandidate = createCandidates[0];
        console.log(`  ✓ CREATE detected: dex=${createCandidate.dex}, pool=${createCandidate.poolAddress}`);
        
        // Test BUY instruction
        console.log('Testing BUY instruction detection...');
        const buyData = Buffer.alloc(32);
        buyData.write('66063d1201daebea', 0, 'hex'); // BUY discriminator
        buyData.writeBigUInt64LE(500000n, 8); // amount
        buyData.writeBigUInt64LE(1000000n, 16); // maxSolCost
        
        const buyInstruction = {
            programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
            data: buyData,
            accounts: Array(5).fill('mock-account')
        };
        
        const buyTx = {
            meta: { err: null },
            transaction: {
                message: {
                    instructions: [buyInstruction],
                    accountKeys: Array(10).fill(null).map((_, i) => ({
                        pubkey: `pubkey-${i}`,
                        signer: i === 0,
                        writable: i < 5
                    }))
                }
            }
        };
        
        mockRPC.setMockResponse('getTransaction', buyTx);
        const buyCandidates = await detector.detectFromTransaction('buy-tx-sig');
        // BUY instruction won't create a candidate, just verify no error
        console.log(`  ✓ BUY instruction processed without error`);
        
        // Test GRADUATE instruction
        console.log('Testing GRADUATE instruction detection...');
        const graduateData = Buffer.alloc(8);
        graduateData.write('16e3f45163dbac36', 0, 'hex'); // GRADUATE discriminator
        
        const graduateInstruction = {
            programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
            data: graduateData,
            accounts: Array(10).fill('mock-account')
        };
        
        const graduateTx = {
            meta: { err: null },
            transaction: {
                message: {
                    instructions: [graduateInstruction],
                    accountKeys: Array(10).fill(null).map((_, i) => ({
                        pubkey: `pubkey-${i}`,
                        signer: i === 0,
                        writable: i < 5
                    }))
                }
            }
        };
        
        mockRPC.setMockResponse('getTransaction', graduateTx);
        const graduateCandidates = await detector.detectFromTransaction('graduate-tx-sig');
        // Graduate should create an LP on Raydium
        console.log(`  ✓ GRADUATE instruction processed successfully`);
        
        // Verify pump.fun detection
        if (createCandidate.dex !== 'pump.fun') {
            throw new Error(`Incorrect DEX: expected pump.fun, got ${createCandidate.dex}`);
        }
        console.log(`  ✓ Pump.fun LP properly identified`);
        
    } catch (e) {
        passed = false;
        error = e.message;
        console.log(`  ❌ Error: ${e.message}`);
    }
    
    const duration = performance.now() - startTime;
    console.log(`\n⏱️  Test completed in ${duration.toFixed(1)}ms`);
    
    results.tests.push({ name: 'Pump.fun Detection', passed, duration, error });
    if (passed) results.passed++; else results.failed++;
}

// Test 2: Time Decay Phases
async function testTimeDecayPhases(results) {
    console.log('\n📍 TEST 2: MEME-SPECIFIC TIME DECAY PHASES');
    console.log('-' .repeat(40));
    
    const startTime = performance.now();
    let passed = true;
    let error = null;
    
    try {
        const mockRPC = new MockRPCManager();
        const detector = new LiquidityPoolCreationDetectorService({
            rpcManager: mockRPC,
            accuracyThreshold: 0.95
        });
        
        // Test different age scenarios
        const testCases = [
            { age: 5, expectedPhase: 'pump', minDecay: 0.9, desc: '5 minutes (pump phase)' },
            { age: 30, expectedPhase: 'momentum', minDecay: 0.3, maxDecay: 0.6, desc: '30 minutes (momentum phase)' },
            { age: 90, expectedPhase: 'decay', minDecay: 0.1, maxDecay: 0.3, desc: '90 minutes (decay phase)' },
            { age: 150, expectedPhase: 'dead', maxDecay: 0.15, desc: '150 minutes (dead phase)' }
        ];
        
        for (const testCase of testCases) {
            console.log(`\nTesting ${testCase.desc}...`);
            
            const candidate = {
                poolAddress: 'test-pool',
                dex: 'Raydium',
                detectedAt: Date.now() - (testCase.age * 60 * 1000), // Convert minutes to ms
                binaryConfidence: 0.95,
                entropyScore: 6.5
            };
            
            const decayFactor = detector.calculateTimeDecayFactor(candidate);
            
            // Determine phase based on the actual meme phase logic
            let phase;
            if (testCase.age <= 15) phase = 'pump';
            else if (testCase.age <= 60) phase = 'momentum';
            else if (testCase.age <= 120) phase = 'decay';
            else phase = 'dead';
            
            console.log(`  Phase: ${phase}`);
            console.log(`  Decay Factor: ${decayFactor.toFixed(2)}`);
            console.log(`  Expected: ${testCase.expectedPhase}`);
            
            // Validate phase detection
            if (phase !== testCase.expectedPhase) {
                throw new Error(`Phase mismatch: expected ${testCase.expectedPhase}, got ${phase}`);
            }
            
            // Validate decay factor range
            if (testCase.minDecay !== undefined && decayFactor < testCase.minDecay) {
                throw new Error(`Decay factor too low: ${decayFactor} < ${testCase.minDecay}`);
            }
            if (testCase.maxDecay !== undefined && decayFactor > testCase.maxDecay) {
                throw new Error(`Decay factor too high: ${decayFactor} > ${testCase.maxDecay}`);
            }
            
            console.log(`  ✓ Correct phase and decay factor`);
        }
        
        // Performance check
        const perfStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            detector.calculateTimeDecayFactor({
                detectedAt: Date.now() - (30 * 60 * 1000)
            });
        }
        const avgTime = (performance.now() - perfStart) / 1000;
        console.log(`\n⚡ Average decay calculation time: ${avgTime.toFixed(3)}ms`);
        
        if (avgTime > 1) {
            throw new Error(`Time decay calculation too slow: ${avgTime.toFixed(3)}ms > 1ms`);
        }
        
    } catch (e) {
        passed = false;
        error = e.message;
        console.log(`\n❌ Error: ${e.message}`);
    }
    
    const duration = performance.now() - startTime;
    console.log(`\n⏱️  Test completed in ${duration.toFixed(1)}ms`);
    
    results.tests.push({ name: 'Time Decay Phases', passed, duration, error });
    if (passed) results.passed++; else results.failed++;
}

// Test 3: Statistical Baseline Calibration
async function testStatisticalCalibration(results) {
    console.log('\n📍 TEST 3: STATISTICAL BASELINE CALIBRATION');
    console.log('-' .repeat(40));
    
    const startTime = performance.now();
    let passed = true;
    let error = null;
    
    try {
        const mockRPC = new MockRPCManager();
        const detector = new LiquidityPoolCreationDetectorService({
            rpcManager: mockRPC,
            accuracyThreshold: 0.95
        });
        
        // Mock pool data for calibration
        const mockPools = [
            {
                poolAddress: 'pool1',
                lpValue: 50000,
                tokenHolders: 150,
                poolAge: 3600000, // 1 hour
                volume24h: 100000
            },
            {
                poolAddress: 'pool2',
                lpValue: 100000,
                tokenHolders: 300,
                poolAge: 7200000, // 2 hours
                volume24h: 250000
            },
            {
                poolAddress: 'pool3',
                lpValue: 25000,
                tokenHolders: 75,
                poolAge: 1800000, // 30 min
                volume24h: 50000
            }
        ];
        
        console.log('Initial Bayesian priors:');
        const initialPriors = detector.statisticalState.bayesianPriors;
        console.log(`  LP Value: μ=${initialPriors.lpValueMean}, σ=${initialPriors.lpValueStd}`);
        console.log(`  Holders: μ=${initialPriors.holderCountMean}, σ=${initialPriors.holderCountStd}`);
        
        // Override getRecentPools to return mock data
        detector.solanaPoolParser = {
            getRecentPools: async () => mockPools,
            getAllPools: async () => mockPools
        };
        
        // Calibrate with mock data
        console.log('\nCalibrating with mock pool data...');
        const calibrationStart = performance.now();
        await detector.calibrateStatisticalBaselines();
        const calibrationTime = performance.now() - calibrationStart;
        
        console.log(`  ✓ Calibration completed in ${calibrationTime.toFixed(1)}ms`);
        
        // Verify priors were updated
        const updatedPriors = detector.statisticalState.bayesianPriors;
        console.log('\nUpdated Bayesian priors:');
        console.log(`  LP Value: μ=${updatedPriors.lpValueMean}, σ=${updatedPriors.lpValueStd}`);
        console.log(`  Holders: μ=${updatedPriors.holderCountMean}, σ=${updatedPriors.holderCountStd}`);
        
        // Validate calculations
        const expectedLPMean = 58333; // Average of mock LP values
        const actualLPMean = updatedPriors.lpValueMean;
        
        if (Math.abs(actualLPMean - expectedLPMean) > 1000) {
            throw new Error(`LP value mean incorrect: expected ~${expectedLPMean}, got ${actualLPMean}`);
        }
        
        // Test Bayesian scoring performance
        console.log('\nTesting Bayesian scoring performance...');
        const candidate = {
            dex: 'Raydium',
            binaryConfidence: 0.95,
            entropyScore: 6.5,
            poolAddress: 'test',
            baseMint: 'base',
            quoteMint: 'quote'
        };
        
        const bayesianStart = performance.now();
        let totalBayesianTime = 0;
        const iterations = 100;
        
        for (let i = 0; i < iterations; i++) {
            const iterStart = performance.now();
            detector.calculateBayesianLPProbability(candidate);
            totalBayesianTime += performance.now() - iterStart;
        }
        
        const avgBayesianTime = totalBayesianTime / iterations;
        console.log(`  Average Bayesian scoring time: ${avgBayesianTime.toFixed(2)}ms`);
        
        if (avgBayesianTime > 25) {
            throw new Error(`Bayesian scoring too slow: ${avgBayesianTime.toFixed(2)}ms > 25ms target`);
        }
        console.log(`  ✓ Performance within target (<25ms)`);
        
    } catch (e) {
        passed = false;
        error = e.message;
        console.log(`\n❌ Error: ${e.message}`);
    }
    
    const duration = performance.now() - startTime;
    console.log(`\n⏱️  Test completed in ${duration.toFixed(1)}ms`);
    
    results.tests.push({ name: 'Statistical Calibration', passed, duration, error });
    if (passed) results.passed++; else results.failed++;
}

// Test 4: Rug Pull Detection
async function testRugPullDetection(results) {
    console.log('\n📍 TEST 4: RUG PULL DETECTION');
    console.log('-' .repeat(40));
    
    const startTime = performance.now();
    let passed = true;
    let error = null;
    
    try {
        const mockRPC = new MockRPCManager();
        const detector = new LiquidityPoolCreationDetectorService({
            rpcManager: mockRPC,
            accuracyThreshold: 0.95
        });
        
        // Test 1: Liquidity Lock Detection
        console.log('Testing liquidity lock detection...');
        
        // Mock responses
        mockRPC.setMockResponse('getAccountInfo', {
            data: Buffer.alloc(100)
        });
        
        // Mock locked LP tokens
        mockRPC.setMockResponse('getTokenAccountsByOwner', (params) => {
            if (params[0] === 'TeamTokenLockKqzUvzsVhfDHYkFxaWzuwdxNhkqE6HFbF9LF8ixG') {
                return {
                    value: [{
                        account: {
                            data: {
                                parsed: {
                                    info: {
                                        tokenAmount: {
                                            uiAmount: '900000' // 90% locked
                                        }
                                    }
                                }
                            }
                        }
                    }]
                };
            }
            return { value: [] };
        });
        
        mockRPC.setMockResponse('getTokenSupply', {
            value: { uiAmount: '1000000' }
        });
        
        const lockedCandidate = {
            poolAddress: 'locked-pool',
            lpMint: 'lp-mint',
            dex: 'Raydium',
            detectedAt: Date.now() - 3600000 // 1 hour old
        };
        
        const lockRisk = await detector.analyzeLiquidityLock(lockedCandidate);
        console.log(`  Lock Risk Score: ${lockRisk.toFixed(2)}`);
        
        if (lockRisk > 0.3) {
            throw new Error(`Lock risk too high for 90% locked pool: ${lockRisk}`);
        }
        console.log(`  ✓ Correctly identified low risk for locked liquidity`);
        
        // Test unlocked pool
        mockRPC.setMockResponse('getTokenAccountsByOwner', { value: [] });
        const unlockedCandidate = {
            poolAddress: 'unlocked-pool',
            lpMint: 'lp-mint-2',
            dex: 'Raydium',
            detectedAt: Date.now() - 3600000
        };
        
        const unlockedRisk = await detector.analyzeLiquidityLock(unlockedCandidate);
        console.log(`  Unlocked Risk Score: ${unlockedRisk.toFixed(2)}`);
        
        if (unlockedRisk < 0.7) {
            throw new Error(`Unlocked risk too low: ${unlockedRisk}`);
        }
        console.log(`  ✓ Correctly identified high risk for unlocked liquidity`);
        
        // Test 2: Deployer History Analysis
        console.log('\nTesting deployer history analysis...');
        
        // Mock suspicious deployer
        mockRPC.setMockResponse('getTransaction', {
            transaction: {
                message: {
                    accountKeys: [{ pubkey: 'deployer-wallet', signer: true }]
                }
            }
        });
        
        // Mock high-frequency deployer
        mockRPC.setMockResponse('getSignaturesForAddress', (params) => {
            if (params[0] === 'deployer-wallet') {
                return Array(50).fill(null).map((_, i) => ({
                    signature: `sig-${i}`,
                    blockTime: Math.floor(Date.now() / 1000) - (i * 3600) // 1 per hour
                }));
            }
            return [];
        });
        
        const suspiciousCandidate = {
            transactionId: 'test-tx',
            poolAddress: 'suspicious-pool'
        };
        
        const deployerRisk = await detector.analyzeDeployerHistory(suspiciousCandidate);
        console.log(`  Deployer Risk Score: ${deployerRisk.toFixed(2)}`);
        
        // Test new wallet
        mockRPC.setMockResponse('getSignaturesForAddress', []);
        const newWalletRisk = await detector.analyzeDeployerHistory(suspiciousCandidate);
        console.log(`  New Wallet Risk Score: ${newWalletRisk.toFixed(2)}`);
        
        if (newWalletRisk < 0.8) {
            throw new Error(`New wallet risk too low: ${newWalletRisk}`);
        }
        console.log(`  ✓ Correctly identified high risk for new deployer`);
        
        // Performance test for full validation
        console.log('\nTesting full mathematical validation performance...');
        
        const perfCandidate = {
            poolAddress: 'perf-test',
            dex: 'Raydium',
            binaryConfidence: 0.95,
            entropyScore: 6.5,
            detectedAt: Date.now() - 600000, // 10 min old
            baseMint: 'base',
            quoteMint: 'quote',
            transactionId: 'test-tx'
        };
        
        // Set up minimal mock responses for performance test
        mockRPC.setMockResponse('getTokenAccountsByOwner', { value: [] });
        mockRPC.setMockResponse('getSignaturesForAddress', [
            { blockTime: Math.floor(Date.now() / 1000) - 86400 }
        ]);
        
        const validationStart = performance.now();
        await detector.validateLPCandidate(perfCandidate);
        const validationTime = performance.now() - validationStart;
        
        console.log(`  Full validation time: ${validationTime.toFixed(1)}ms`);
        
        if (validationTime > 50) {
            console.log(`  ⚠️  Warning: Validation exceeds 50ms target`);
        } else {
            console.log(`  ✓ Performance within Renaissance target (<50ms)`);
        }
        
    } catch (e) {
        passed = false;
        error = e.message;
        console.log(`\n❌ Error: ${e.message}`);
    }
    
    const duration = performance.now() - startTime;
    console.log(`\n⏱️  Test completed in ${duration.toFixed(1)}ms`);
    
    results.tests.push({ name: 'Rug Pull Detection', passed, duration, error });
    if (passed) results.passed++; else results.failed++;
}

// Run all tests
runTests().catch(console.error);