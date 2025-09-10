/**
 * LP Detector Meme Coin Validation Tests
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
import { PublicKey } from '@solana/web3.js';

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
            data: createData.toString('base64'),
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
        console.log('Testing BUY instruction parsing...');
        const buyData = Buffer.alloc(32);
        buyData.write('66063d1201daebea', 0, 'hex'); // BUY discriminator
        buyData.writeBigUInt64LE(500000n, 8); // amount
        buyData.writeBigUInt64LE(1000000n, 16); // maxSolCost
        
        const buyInstruction = {
            programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
            data: buyData.toString('base64')
        };
        
        const buyResult = detector.parsePumpFunInstruction(buyInstruction);
        if (!buyResult || buyResult.type !== 'buy') {
            throw new Error('Failed to parse BUY instruction');
        }
        console.log(`  ✓ BUY parsed: amount=${buyResult.data.amount}, maxSol=${buyResult.data.maxSolCost}`);
        
        // Test GRADUATE instruction
        console.log('Testing GRADUATE instruction parsing...');
        const graduateData = Buffer.alloc(8);
        graduateData.write('16e3f45163dbac36', 0, 'hex'); // GRADUATE discriminator
        
        const graduateInstruction = {
            programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
            data: graduateData.toString('base64')
        };
        
        const graduateResult = detector.parsePumpFunInstruction(graduateInstruction);
        if (!graduateResult || graduateResult.type !== 'graduate') {
            throw new Error('Failed to parse GRADUATE instruction');
        }
        console.log(`  ✓ GRADUATE parsed successfully`);
        
        // Test LP detection from transaction
        console.log('Testing pump.fun LP detection...');
        const mockTx = {
            meta: { err: null },
            transaction: {
                message: {
                    instructions: [createInstruction],
                    accountKeys: Array(10).fill(null).map(() => new PublicKey(new Uint8Array(32)))
                }
            }
        };
        
        mockRPC.setMockResponse('getTransaction', mockTx);
        
        const candidates = await detector.detectFromTransaction('mock-signature');
        if (!candidates || candidates.length === 0) {
            throw new Error('Failed to detect pump.fun LP creation');
        }
        
        const candidate = candidates[0];
        if (candidate.dex !== 'pump.fun' || candidate.initialBuy !== '1000000') {
            throw new Error('Incorrect pump.fun candidate data');
        }
        console.log(`  ✓ Pump.fun LP detected: ${candidate.poolAddress}`);
        
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
            { age: 5, expectedPhase: 'pump', expectedDecay: 1.0, desc: '5 minutes (pump phase)' },
            { age: 30, expectedPhase: 'momentum', expectedDecay: 0.8, desc: '30 minutes (momentum phase)' },
            { age: 90, expectedPhase: 'decay', expectedDecay: 0.3, desc: '90 minutes (decay phase)' },
            { age: 150, expectedPhase: 'dead', expectedDecay: 0.1, desc: '150 minutes (dead phase)' }
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
            
            // Determine phase based on decay factor
            let phase;
            if (decayFactor >= 0.9) phase = 'pump';
            else if (decayFactor >= 0.6) phase = 'momentum';
            else if (decayFactor >= 0.2) phase = 'decay';
            else phase = 'dead';
            
            console.log(`  Phase: ${phase}`);
            console.log(`  Decay Factor: ${decayFactor.toFixed(2)}`);
            console.log(`  Expected: ${testCase.expectedPhase} (${testCase.expectedDecay})`);
            
            // Validate phase detection
            if (phase !== testCase.expectedPhase) {
                throw new Error(`Phase mismatch: expected ${testCase.expectedPhase}, got ${phase}`);
            }
            
            // Validate decay factor (with tolerance)
            const tolerance = 0.15;
            if (Math.abs(decayFactor - testCase.expectedDecay) > tolerance) {
                throw new Error(`Decay factor mismatch: expected ~${testCase.expectedDecay}, got ${decayFactor}`);
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
        console.log(`  LP Value: μ=${detector.statisticalState.bayesianPriors.lpValueMean}, σ=${detector.statisticalState.bayesianPriors.lpValueStd}`);
        console.log(`  Holders: μ=${detector.statisticalState.bayesianPriors.holderCountMean}, σ=${detector.statisticalState.bayesianPriors.holderCountStd}`);
        
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
        console.log('\nUpdated Bayesian priors:');
        console.log(`  LP Value: μ=${detector.statisticalState.bayesianPriors.lpValueMean}, σ=${detector.statisticalState.bayesianPriors.lpValueStd}`);
        console.log(`  Holders: μ=${detector.statisticalState.bayesianPriors.holderCountMean}, σ=${detector.statisticalState.bayesianPriors.holderCountStd}`);
        
        // Validate calculations
        const expectedLPMean = 58333; // Average of mock LP values
        const actualLPMean = detector.statisticalState.bayesianPriors.lpValueMean;
        
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
        const unlockedRisk = await detector.analyzeLiquidityLock(lockedCandidate);
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